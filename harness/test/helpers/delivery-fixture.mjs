import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { bindRenderInputDelivery } from "../../src/render-input.mjs";

// Network, baseline API and credential reads are synthetic. Git and ZIP validation remain real.
export function createDeliveryDependencies(workspace, monitor) {
  const binaryDirectory = path.join(workspace, "local", "test-bin");
  fs.mkdirSync(binaryDirectory, { recursive: true });
  const gh = path.join(binaryDirectory, "gh");
  fs.writeFileSync(gh, '#!/bin/sh\nprintf "fixture-token\\n"\n');
  fs.chmodSync(gh, 0o755);
  const method = { repository: "example/video", inputRepository: "example/inputs", ref: "main", baselineRun: "1" };
  fs.writeFileSync(path.join(workspace, "local/render-method.json"), JSON.stringify(method));
  const git = args => execFileSync("git", ["-C", workspace, ...args], { encoding: "utf8", stdio: "pipe" }).trim();
  return {
    environment: { ...process.env, PATH: `${binaryDirectory}:${process.env.PATH}` },
    ...(monitor ? { monitor } : {}),
    async checkPreparation() {
      const localCommit = git(["rev-parse", "HEAD"]);
      let remoteCommit = localCommit;
      if (git(["remote"]).split("\n").includes("origin")) remoteCommit = git(["ls-remote", "origin", "main"]).split(/\s/)[0];
      return { ok: true, checks: [], baseline: { localCommit, remoteCommit, successfulCommit: localCommit } };
    },
    async publishInput(input) {
      return { url: `https://inputs.example.test/${input.slug}.zip`, sha256: input.archiveSha256, archivePath: input.archivePath };
    },
    async bindInput(project, input) {
      const bytes = fs.readFileSync(input.archivePath);
      return bindRenderInputDelivery(project, { ...input, fetchImpl: async () => ({ ok: true, status: 200, arrayBuffer: async () => bytes }) });
    },
  };
}
