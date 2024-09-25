import { Antiquum, Lemniscate, Sempiternal } from "../../src";

const antiquum = new Antiquum("antiquum-canvas", {
  canvasHeight: 250,
  canvasWidth: 250,
  arcWidth: 25,
});

antiquum.play();

const lemniscate = new Lemniscate("lemniscate-canvas", {
  canvasHeight: 250,
  canvasWidth: 250,
  arcWidth: 25,
});

lemniscate.play();

const sempiternal = new Sempiternal("sempiternal-canvas", {
  canvasHeight: 250,
  canvasWidth: 250,
});

sempiternal.play();
