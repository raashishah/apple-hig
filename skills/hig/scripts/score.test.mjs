import assert from "node:assert/strict";
import test from "node:test";
import { fontProblems, scorePair, scoreScreen } from "./score.mjs";

const clean = {
  fontSizes: [34, 17, 13],
  weights: [400, 600],
  leadingEdges: [20, 20],
  spacings: [16],
  margins: [20],
  tapTargets: [{ width: 44, height: 44 }],
  bodyPairs: [{ foreground: "#111111", background: "#ffffff" }],
  nonTokenColor: false,
  accentCount: 1,
  customControls: 0,
  safeViolations: 0,
  primaryCount: 1,
  radiiMismatch: false,
  radiiNonNesting: false,
  inventedTiming: false,
  reducedMotion: true,
};

test("a clean screen has no open defects", () => {
  assert.deepEqual(scoreScreen(clean, { margin: null }), []);
});

test("a fifth type size opens the type defect", () => {
  const screen = { ...clean, fontSizes: [34, 28, 22, 17, 13] };
  assert.equal(scoreScreen(screen).length, 1);
  assert.equal(scorePair([clean, screen]).score, 1);
});

test("an off-scale size opens the type defect", () => {
  assert.equal(scoreScreen({ ...clean, fontSizes: [18] }).length, 1);
});

test("a third weight opens the weight defect", () => {
  assert.equal(scoreScreen({ ...clean, weights: [400, 600, 700] }).length, 1);
});

test("a short tap target opens the tap defect", () => {
  assert.equal(
    scoreScreen({ ...clean, tapTargets: [{ width: 32, height: 44 }] }).length,
    1,
  );
});

test("low body contrast opens the contrast defect", () => {
  assert.equal(
    scoreScreen({
      ...clean,
      bodyPairs: [{ foreground: "#777777", background: "#ffffff" }],
    }).length,
    1,
  );
});

test("missing Reduce Motion opens the motion defect", () => {
  assert.equal(scoreScreen({ ...clean, reducedMotion: false }).length, 1);
});

test("a logged colour override is not a defect", () => {
  assert.deepEqual(
    scoreScreen({ ...clean, nonTokenColor: true, waived: ["colour"] }),
    [],
  );
});

test("the font check accepts the system stack and rejects an SF face", () => {
  assert.deepEqual(
    fontProblems("body { font-family: -apple-system, system-ui, sans-serif; }"),
    [],
  );
  assert.equal(
    fontProblems(
      "@font-face { font-family: SF Pro; src: url(SF-Pro.otf); } body { font-family: -apple-system, system-ui, sans-serif; }",
    ).length,
    1,
  );
});
