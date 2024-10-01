import { initDocument } from "../../testing";
import { Sempiternal, SempiternalOps } from "../sempiternal";

const properties = [
  "sideLength",
  "circleSize",
  "relativeExpansion",
  "delay",
  "alternateSpin",
  "rotations",
  "opacityPulse",
  "radiusPulse",
];

const modifiedOps: Partial<SempiternalOps> = {
  sideLength: 4,
  circleSize: 19,
  relativeExpansion: 0.12,
  delay: 0.12,
  alternateSpin: true,
  rotations: 2,
  opacityPulse: {
    style: "disperse",
    delay: 0.1,
    intensity: 1,
  },
  radiusPulse: {
    style: "disperse",
    delay: 0.1,
    intensity: 1,
  },
};

test("empty constructor populates all option fields", () => {
  initDocument();
  const instance = new Sempiternal("canvas");
  expect(instance).toBeInstanceOf(Sempiternal);
  for (const prop of properties) {
    expect(instance).toHaveProperty(prop);
  }
  expect(instance.canvas.width).toEqual(100);
  expect(instance.canvas.height).toEqual(100);
  expect(instance.postConstructorCalls).toEqual(1);
  expect(instance.paused).toBe(false);
});

test("all options work properly in constructor", () => {
  initDocument();
  for (const objKey of Object.keys(modifiedOps)) {
    const ops = structuredClone(modifiedOps) as any;
    const partial = {} as any;
    partial[objKey] = ops[objKey];
    const instance = new Sempiternal("canvas", partial) as any;
    expect(instance).toHaveProperty(objKey);
    expect(instance[objKey]).toEqual(ops[objKey]);
  }
});

test("all options work properly in setConfig", () => {
  initDocument();
  for (const objKey of Object.keys(modifiedOps)) {
    const ops = structuredClone(modifiedOps) as any;
    const instance = new Sempiternal("canvas") as any;
    const partial = {} as any;
    partial[objKey] = ops[objKey];
    instance.setConfig(partial);
    expect(instance).toHaveProperty(objKey);
    expect(instance[objKey]).toEqual(ops[objKey]);
  }
});
