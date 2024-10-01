import { AnimautomatonOps } from "../animautomaton";
import { Antiquum } from "../antiquum/antiquum";
import { Lemniscate } from "../lemniscate/lemniscate";
import { Sempiternal } from "../sempiternal/sempiternal";
import { initDocument } from "../testing";

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

const fullAnimautomatonOps: Partial<AnimautomatonOps> = {
  backgroundColour: "#ffffff",
  currProgress: 2,
  lastProgress: 1,
  rest: 0.5,
  fps: 30,
  cycleDuration_ms: 2000,
  currIteration: 1,
  nIterations: 100,
  paused: true,
  colours: ["#ffff00"],
  opacity: 0.5,
  opacityDelta: 0.1,
  timingFunction: "linear",
  drawStyle: "stroke",
};

// TODO: ensure defaults are as-expected too

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

  test("valid canvas id creates valid animautomaton instance on that canvas", () => {
    initDocument();
    const instance = new PresetClass("canvas");
    expect(instance).toBeInstanceOf(PresetClass);
    for (const prop of commonProperties) {
      expect(instance).toHaveProperty(prop);
    }
    expect(instance.canvas.width).toEqual(100);
    expect(instance.canvas.height).toEqual(100);
    expect(instance.postConstructorCalls).toEqual(1);
    expect(instance.paused).toBe(false);
  });

  test("all simple base animautomaton options set properly in instance constructor", () => {
    initDocument();
    for (const objKey of Object.keys(fullAnimautomatonOps)) {
      const ops = structuredClone(fullAnimautomatonOps) as any;
      const partial = {} as any;
      partial[objKey] = ops[objKey];
      const instance = new PresetClass("canvas", partial) as any;
      expect(instance).toHaveProperty(objKey);
      expect(instance[objKey]).toEqual(ops[objKey]);
    }
  });

  test("canvas base animautomaton options set properly in instance constructor", () => {
    initDocument();
    const ops = {
      canvasWidth: 200,
      canvasHeight: 200,
    };
    const instance = new PresetClass("canvas", ops);
    expect(instance.canvas.width).toEqual(200);
    expect(instance.canvas.height).toEqual(200);
  });

  test("custom timing function is called", () => {
    initDocument();
    const spy = jest.fn();
    const ops: Partial<AnimautomatonOps> = {
      timingFunction: "custom",
      customTimingFunction: (_offset?) => {
        spy();
        return 0;
      },
    };
    const instance = new PresetClass("canvas", ops);
    instance.step();
    expect(spy).toHaveBeenCalled();
  });

  test("setConfig works for all simple base options", () => {
    initDocument();
    for (const objKey of Object.keys(fullAnimautomatonOps)) {
      const ops = structuredClone(fullAnimautomatonOps) as any;
      const instance = new PresetClass("canvas") as any;
      const partial = {} as any;
      partial[objKey] = ops[objKey];
      instance.setConfig(partial);
      expect(instance).toHaveProperty(objKey);
      expect(instance[objKey]).toEqual(ops[objKey]);
    }
  });

  test("setConfig works for canvas base options", () => {
    initDocument();
    const instance = new PresetClass("canvas");
    expect(instance.canvas.width).toEqual(100);
    expect(instance.canvas.height).toEqual(100);
    const ops = {
      canvasWidth: 200,
      canvasHeight: 200,
    };
    instance.setConfig(ops);
    expect(instance.canvas.width).toEqual(200);
    expect(instance.canvas.height).toEqual(200);
  });

  test("setConfig works for custom timing function", () => {
    initDocument();
    const spy = jest.fn();
    const ops: Partial<AnimautomatonOps> = {
      timingFunction: "custom",
      customTimingFunction: (_offset?) => {
        spy();
        return 0;
      },
    };
    const instance = new PresetClass("canvas");
    instance.step();
    expect(spy).toHaveBeenCalledTimes(0);
    instance.setConfig(ops);
    instance.step();
    expect(spy).toHaveBeenCalled();
  });

  test("play and pause function change instance.paused appropriately", () => {
    initDocument();
    const instance = new PresetClass("canvas", { paused: true });
    expect(instance.paused).toBe(true);
    instance.pause();
    expect(instance.paused).toBe(true);
    instance.play();
    expect(instance.paused).toBe(false);
    instance.play();
    expect(instance.paused).toBe(false);
    instance.pause();
    expect(instance.paused).toBe(true);
    instance.pause();
    expect(instance.paused).toBe(true);
    instance.play();
    expect(instance.paused).toBe(false);
  });

  test("seek moves to the correct frame", () => {
    initDocument();
    const instance = new PresetClass("canvas", {
      paused: true,
      fps: 100,
      cycleDuration_ms: 1000,
    });
    expect(instance.frame).toBe(0);
    instance.step();
    expect(instance.frame).toBe(1);
    instance.seek(9);
    expect(instance.frame).toBe(10);
    instance.seek(100);
    expect(instance.frame).toBe(10);
    instance.seek(-20);
    expect(instance.frame).toBe(90);
    instance.seek(9);
    expect(instance.frame).toBe(99);
    instance.step();
    expect(instance.frame).toBe(0);
  });

  test("parentDraw is called within child draw method", () => {
    initDocument();
    const instance = new PresetClass("canvas");
    const _parentDraw = instance.parentDraw;
    const spy = jest.fn();
    instance.parentDraw = () => {
      spy();
      _parentDraw();
    };
    expect(spy).toHaveBeenCalledTimes(0);
    instance.step();
    expect(spy).toHaveBeenCalled();
  });
}
