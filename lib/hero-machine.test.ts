import assert from "node:assert/strict";
import { test } from "node:test";
import {
  heroCanRotate,
  heroReducer as reduce,
  initialHeroState,
} from "./hero-machine";

test("rotation starts only after motion preference resolves and cycles without returning to X", () => {
  let state = initialHeroState({ mode: "X", paused: false });
  assert.equal(heroCanRotate(state), false);
  state = reduce(state, { type: "MOTION", reduced: false });
  const modes = [];
  for (let i = 0; i < 4; i++) {
    state = reduce(state, { type: "TICK" });
    modes.push(state.mode);
  }
  assert.deepEqual(modes, ["AI", "Career", "Team", "AI"]);
});
test("hover and focus suspend ticks without losing run intent", () => {
  let state = reduce(initialHeroState({ mode: "AI", paused: false }), {
    type: "MOTION",
    reduced: false,
  });
  for (const type of ["HOVER", "FOCUS"] as const) {
    state = reduce(state, { type, value: true });
    assert.equal(heroCanRotate(state), false);
    assert.equal(reduce(state, { type: "TICK" }), state);
    state = reduce(state, { type, value: false });
    assert.equal(heroCanRotate(state), true);
  }
});
test("reduced motion stops rotation; explicit Resume is an intentional override", () => {
  let state = reduce(initialHeroState({ mode: "AI", paused: false }), {
    type: "MOTION",
    reduced: true,
  });
  assert.equal(heroCanRotate(state), false);
  state = reduce(state, { type: "TOGGLE" });
  assert.equal(heroCanRotate(state), true);
  assert.equal(state.motion, "reduced");
  state = reduce(state, { type: "MOTION", reduced: true });
  state = reduce(state, { type: "MOTION", reduced: false });
  assert.equal(heroCanRotate(state), false);
});
test("manual selection and saved pause stay paused after remount", () => {
  const state = reduce(initialHeroState({ mode: "AI", paused: false }), {
    type: "SELECT",
    mode: "Team",
  });
  const restored = reduce(
    initialHeroState({ mode: state.mode, paused: true }),
    { type: "MOTION", reduced: false },
  );
  assert.equal(restored.mode, "Team");
  assert.equal(heroCanRotate(restored), false);
});
