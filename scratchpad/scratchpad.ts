import { Tiling } from "../src";

const setup = () => {
  const canvas = document.querySelector("canvas") as HTMLCanvasElement;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const tiling = new Tiling("canvas", {
    cycleDuration_ms: 2500,
    colours: ["#5BCEFA", "#F5A9B8", "#FFFFFF", "#F5A9B8", "#5BCEFA"],
  });
};
window.addEventListener("load", setup);
