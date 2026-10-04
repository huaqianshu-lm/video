import test from "node:test";
import assert from "node:assert/strict";
import { GITHUB_AUTH_SOURCE, resolveGitHubToken } from "../src/github-auth.mjs";

test("reads local GitHub CLI credentials without allowing stale token variables to override them", () => {
  let call = null;
  const result = resolveGitHubToken({
    environment: {
      GITHUB_TOKEN: "stale-token",
      GH_TOKEN: "another-stale-token",
      PATH: "/usr/bin",
    },
    authSource: "gh-cli",
    execFileSyncImpl: (command, args, options) => {
      call = { command, args, options };
      return "keychain-token\n";
    },
  });

  assert.deepEqual(result, { token: "keychain-token", source: GITHUB_AUTH_SOURCE.GH_CLI, issue: null });
  assert.equal(call.command, "gh");
  assert.deepEqual(call.args, ["auth", "token", "--hostname", "github.com"]);
  assert.equal(call.options.env.GITHUB_TOKEN, undefined);
  assert.equal(call.options.env.GH_TOKEN, undefined);
});

test("uses environment authentication only when explicitly selected", () => {
  const result = resolveGitHubToken({
    environment: { GITHUB_TOKEN: "env-token", GH_TOKEN: "env-token" },
    authSource: "env",
  });
  assert.deepEqual(result, { token: "env-token", source: GITHUB_AUTH_SOURCE.ENV, issue: null });
});

test("rejects conflicting environment credentials without exposing either value", () => {
  const result = resolveGitHubToken({
    environment: { GITHUB_TOKEN: "first-secret", GH_TOKEN: "second-secret" },
    authSource: "env",
  });
  assert.equal(result.token, "");
  assert.equal(result.issue.code, "github-auth-ambiguous");
  assert.doesNotMatch(result.issue.message, /first-secret|second-secret/);
});

test("does not infer invalid credentials or require login when the execution environment cannot read them", () => {
  const result = resolveGitHubToken({
    environment: {},
    authSource: "gh-cli",
    execFileSyncImpl: () => { throw new Error("private stderr"); },
  });
  assert.equal(result.token, "");
  assert.equal(result.issue.code, "github-auth-unavailable");
  assert.match(result.issue.message, /尚不能判断账号是否失效/);
  assert.match(result.issue.message, /获准的宿主环境/);
  assert.doesNotMatch(result.issue.message, /请先运行 gh auth login/);
  assert.doesNotMatch(result.issue.message, /private stderr/);
});

test("empty CLI output requires host verification before deciding to reauthenticate", () => {
  const result = resolveGitHubToken({
    environment: {},
    authSource: "gh-cli",
    execFileSyncImpl: () => "\n",
  });
  assert.equal(result.token, "");
  assert.equal(result.issue.code, "github-auth-empty");
  assert.match(result.issue.message, /尚不能判断账号是否失效/);
  assert.match(result.issue.message, /获准的宿主环境/);
});

test("uses environment credentials for injected test environments by default", () => {
  const result = resolveGitHubToken({ environment: { GITHUB_TOKEN: "test-token" } });
  assert.deepEqual(result, { token: "test-token", source: GITHUB_AUTH_SOURCE.ENV, issue: null });
});
