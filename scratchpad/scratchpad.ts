import { Tiling } from "../src";

const setup = () => {
  const tiling = new Tiling("canvas");
  tiling.play();
};
window.addEventListener("load", setup);
