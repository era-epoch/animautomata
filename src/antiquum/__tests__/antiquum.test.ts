import { initDocument } from "../../testing";
import { Antiquum, AntiquumOps } from "../antiquum";

const properties = [
  "arcs",
  "arcWidth",
  "arcWidthDelta",
  "arcAnchor",
  "tailDelay",
  "arcDelay",
  "radius",
  "radiusDelta",
  "rotations",
  "innerBorder",
  "outerBorder",
  "trackColour",
  "lineCap",
  "leadCap",
  "tailCap",
];

const modifiedOps: Partial<AntiquumOps> = {
  arcs: 2,
  arcWidth: 20,
  arcWidthDelta: 0.2,
  arcAnchor: "inner",
  tailDelay: 0.2,
  arcDelay: 0.2,
  radius: 60,
  radiusDelta: 0.2,
  rotations: 2,
  innerBorder: {
    weight: 1,
    colour: "#ffffff",
  },
  outerBorder: {
    weight: 1,
    colour: "#ffffff",
  },
  trackColour: "#0000ff",
  lineCap: "flat",
  leadCap: "rounded",
  tailCap: "rounded",
};

test("empty constructor populates all option fields", () => {
  initDocument();
  const instance = new Antiquum("canvas");
  expect(instance).toBeInstanceOf(Antiquum);
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
    const instance = new Antiquum("canvas", partial) as any;
    expect(instance).toHaveProperty(objKey);
    expect(instance[objKey]).toEqual(ops[objKey]);
  }
});

test("all options work properly in setConfig", () => {
  initDocument();
  for (const objKey of Object.keys(modifiedOps)) {
    const ops = structuredClone(modifiedOps) as any;
    const instance = new Antiquum("canvas") as any;
    const partial = {} as any;
    partial[objKey] = ops[objKey];
    instance.setConfig(partial);
    expect(instance).toHaveProperty(objKey);
    expect(instance[objKey]).toEqual(ops[objKey]);
  }
});
