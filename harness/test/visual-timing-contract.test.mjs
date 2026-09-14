import assert from "node:assert/strict";
import test from "node:test";
import { validateVisualBindings } from "../src/visual-timing.mjs";

test("accepts visual events bound to Cue frames and dependency-based connectors", () => {
  assert.deepEqual(validateVisualBindings([
    { id: "computer", source: { type: "cue", id: "05-01-b" }, atFrame: 30 },
    { id: "phone", source: { type: "cue", id: "05-01-d" }, atFrame: 60 },
    { id: "connection", dependsOn: ["computer", "phone"], atFrame: 60 },
  ]), []);
});

test("rejects a connector that appears before its latest dependency", () => {
  const issues = validateVisualBindings([
    { id: "computer", source: { type: "cue", id: "05-01-b" }, atFrame: 30 },
    { id: "phone", source: { type: "cue", id: "05-01-d" }, atFrame: 60 },
    { id: "connection", dependsOn: ["computer", "phone"], atFrame: 59 },
  ]);

  assert.equal(issues.some((issue) => issue.code === "visual-binding-early"), true);
});

test("rejects missing and cyclic visual dependencies", () => {
  const issues = validateVisualBindings([
    { id: "left", dependsOn: ["missing"], atFrame: 30 },
    { id: "cycle-a", dependsOn: ["cycle-b"], atFrame: 30 },
    { id: "cycle-b", dependsOn: ["cycle-a"], atFrame: 30 },
  ]);

  assert.equal(issues.some((issue) => issue.code === "visual-binding-dependency-missing"), true);
  assert.equal(issues.some((issue) => issue.code === "visual-binding-cycle"), true);
});
