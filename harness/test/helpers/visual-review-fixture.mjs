import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Synthetic evidence for contract tests only; never used to review a real video.
export function writeVisualReviewFixture(workspace, slug, workflow = "narrated-tutorial-v1") {
  const directory = path.join(workspace, "videos", ...(workflow === "product-promo-v1" ? ["product-promo"] : []), slug);
  const hash = name => crypto.createHash("sha256").update(fs.readFileSync(path.join(directory, name))).digest("hex");
  const prefix = workflow === "product-promo-v1" ? "PROMO" : "TUTORIAL";
  fs.writeFileSync(path.join(directory, "test-review-evidence.md"), "Synthetic contract test evidence. This is not a real visual review.");
  fs.writeFileSync(path.join(directory, "visual-self-review.json"), JSON.stringify({
    schemaVersion: 1, videoSlug: slug, workflow, reviewedAt: "2026-10-03",
    visualScriptFingerprint: hash("visual-script.md"),
    prototypeFingerprint: hash(workflow === "product-promo-v1" ? "motion-prototype.html" : "visual-prototype.html"),
    evidence: [{id: "fixture", kind: "human-review", path: "test-review-evidence.md"}],
    checks: Array.from({length: 6}, (_, i) => ({id: `VC-${i + 1}`, status: "passed", evidenceIds: ["fixture"], note: "Synthetic test"})),
    workflowChecks: Array.from({length: 4}, (_, i) => ({id: `${prefix}-${i + 1}`, status: "passed", evidenceIds: ["fixture"], note: "Synthetic test"})),
  }));
}
