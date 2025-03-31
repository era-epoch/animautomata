import { Tiling } from "../src";

const setup = () => {
  const tiling = new Tiling("canvas", {
    timingFunction: "linear",
    cycleDuration_ms: 5000,
  });
  tiling.play();
};
window.addEventListener("load", setup);
window.addEventListener("reload", setup);
