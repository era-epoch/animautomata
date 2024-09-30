import { Antiquum } from "../antiquum/antiquum";
import { Lemniscate } from "../lemniscate/lemniscate";
import { Sempiternal } from "../sempiternal/sempiternal";
import { initDocument } from "../test_helpers";

const commonProperties = [
  "id",
  "start",
  "lastDraw",
  "paused",
  "pauseTimestamp",
  "pauseDuration",
  "currColour",
  "canvas",
  "context",
  "backgroundColour",
  "currProgress",
  "lastProgress",
  "lastMutationTimestamp",
  "origin",
  "cycleDuration_ms",
  "rest",
  "fps",
  "currIteration",
  "nIterations",
  "colours",
  "opacity",
  "opacityDelta",
  "timingFunction",
  "customTimingFunction",
  "drawStyle",
  "postConstructor",
  "setConfig",
  "draw",
  "step",
  "seek",
  "animate",
  "getProgress",
  "getProgressLinear",
  "getProgressExponential",
  "getProgressSinusoidal",
  "play",
  "pause",
  "ctxDraw",
  "ctxMoveToVector",
  "ctxLineToVector",
  "ctxCircToVector",
  "ctxSetColour",
  "ctxModifyOpacity",
  "drawDot",
  "circularBezierControlPoints",
  "parentDraw",
  "parentSetConfig",
];

for (const PresetClass of [Antiquum, Sempiternal, Lemniscate]) {
  test("empty constructor throws error", () => {
    const initializer = () => {
      // @ts-expect-error
      new PresetClass();
    };
    expect(initializer).toThrow(Error);
  });
  test("invalid canvas id throws error", () => {
    const initializer = () => {
      new PresetClass("bad-id");
    };
    expect(initializer).toThrow(Error);
  });
  test("valid canvas id creates valid animautomaton instance", () => {
    initDocument();
    const instance = new PresetClass("canvas");
    expect(instance).toBeInstanceOf(PresetClass);
    for (const prop of commonProperties) {
      expect(instance).toHaveProperty(prop);
    }
  });
  // test("options object in constructor should affect instance", () => {
  //   initDocument();

  // })
}
