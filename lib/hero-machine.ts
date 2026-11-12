import type { Mode } from "./site-config";

export const heroSequence = ["X", "AI", "Career", "Team"] as const;
export type HeroPreference = { mode: "X" | Mode; paused: boolean };
export type HeroState = {
  mode: HeroPreference["mode"];
  intent: "running" | "paused";
  motion: "unresolved" | "standard" | "reduced";
  motionOverride: boolean;
  hovered: boolean;
  focused: boolean;
};
export type HeroEvent =
  | { type: "MOTION"; reduced: boolean }
  | { type: "SELECT"; mode: Mode }
  | { type: "TICK" }
  | { type: "TOGGLE" }
  | { type: "PAUSE" }
  | { type: "HOVER" | "FOCUS"; value: boolean };

export function initialHeroState(preference: HeroPreference): HeroState {
  return {
    mode: preference.mode,
    intent: preference.paused ? "paused" : "running",
    motion: "unresolved",
    motionOverride: false,
    hovered: false,
    focused: false,
  };
}
/** Explicit Resume overrides reduced-motion stopping; CSS motion stays disabled. */
export function heroCanRotate(state: HeroState) {
  return (
    state.intent === "running" &&
    state.motion !== "unresolved" &&
    (state.motion !== "reduced" || state.motionOverride) &&
    !state.hovered &&
    !state.focused
  );
}
export function heroReducer(state: HeroState, event: HeroEvent): HeroState {
  switch (event.type) {
    case "MOTION":
      return {
        ...state,
        motion: event.reduced ? "reduced" : "standard",
        motionOverride: false,
        intent: event.reduced ? "paused" : state.intent,
      };
    case "SELECT":
      return {
        ...state,
        mode: event.mode,
        intent: "paused",
        motionOverride: false,
      };
    case "PAUSE":
      return { ...state, intent: "paused", motionOverride: false };
    case "TOGGLE":
      return state.intent === "running"
        ? { ...state, intent: "paused", motionOverride: false }
        : {
            ...state,
            intent: "running",
            motionOverride: state.motion === "reduced",
          };
    case "HOVER":
      return { ...state, hovered: event.value };
    case "FOCUS":
      return { ...state, focused: event.value };
    case "TICK": {
      if (!heroCanRotate(state)) return state;
      const next = heroSequence.indexOf(state.mode) + 1;
      return {
        ...state,
        mode: heroSequence[next >= heroSequence.length ? 1 : next],
      };
    }
  }
}
