import { initDocument } from "../../test_helpers";
import { Lemniscate, LemniscateOps } from "../lemniscate";

const properties = [
  "arcs",
  "arcWidth",
  "arcWidthDelta",
  "tailDelay",
  "arcDelay",
  "radius",
  "radiusDelta",
  "xOff",
];

const modifiedOps: Partial<LemniscateOps> = {
  arcs: 2,
  arcWidth: 20,
  arcWidthDelta: 0.2,
  tailDelay: 0.2,
  arcDelay: 0.2,
  radius: 20,
  radiusDelta: 0.2,
  xOff: 30,
};

test("empty constructor populates all option fields", () => {
  initDocument();
  const instance = new Lemniscate("canvas");
  expect(instance).toBeInstanceOf(Lemniscate);
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
    const instance = new Lemniscate("canvas", partial) as any;
    expect(instance).toHaveProperty(objKey);
    expect(instance[objKey]).toEqual(ops[objKey]);
  }
});

test("all options work properly in setConfig", () => {
  initDocument();
  for (const objKey of Object.keys(modifiedOps)) {
    const ops = structuredClone(modifiedOps) as any;
    const instance = new Lemniscate("canvas") as any;
    const partial = {} as any;
    partial[objKey] = ops[objKey];
    instance.setConfig(partial);
    expect(instance).toHaveProperty(objKey);
    expect(instance[objKey]).toEqual(ops[objKey]);
  }
});
