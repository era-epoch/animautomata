import {
  Antiquum,
  AntiquumOps,
  Lemniscate,
  LemniscateOps,
  Sempiternal,
  SempiternalOps,
} from "../src";

const createCanvas = (headerText) => {
  const container = document.getElementById("animations");
  const wrapper = document.createElement("div");
  wrapper.classList.add("animation-example");
  const header = document.createElement("h1");
  header.innerHTML = headerText;
  const canvas = document.createElement("canvas");
  canvas.width = 250;
  canvas.height = 250;
  canvas.id = headerText + `-` + Math.floor(Math.random() * 100000);
  wrapper.appendChild(header);
  wrapper.appendChild(canvas);
  container?.appendChild(wrapper);
  return canvas.id;
};

const createAntiquum = (ops: Partial<AntiquumOps>) => {
  const anim = new Antiquum(createCanvas("antiquum"), ops);
  anim.seek(Math.floor(Math.random() * 60));
  anim.pause();
  const canvas = document.querySelector(
    `[data-animautomata-id="${anim.id}"]`
  ) as HTMLCanvasElement;
  if (canvas == null) return;
  canvas.parentElement!.addEventListener("mouseenter", () => anim.play());
  canvas.parentElement!.addEventListener("mouseleave", () => anim.pause());
};

const createLemniscate = (ops: Partial<LemniscateOps>) => {
  const anim = new Lemniscate(createCanvas("lemniscate"), ops);
  anim.seek(Math.floor(Math.random() * 60));
  anim.pause();
  const canvas = document.querySelector(
    `[data-animautomata-id="${anim.id}"]`
  ) as HTMLCanvasElement;
  if (canvas == null) return;
  canvas.parentElement!.addEventListener("mouseenter", () => anim.play());
  canvas.parentElement!.addEventListener("mouseleave", () => anim.pause());
};

const createSempiternal = (ops: Partial<SempiternalOps>) => {
  const anim = new Sempiternal(createCanvas("sempiternal"), ops);
  anim.seek(Math.floor(Math.random() * 60));
  anim.pause();
  const canvas = document.querySelector(
    `[data-animautomata-id="${anim.id}"]`
  ) as HTMLCanvasElement;
  if (canvas == null) return;
  canvas.parentElement!.addEventListener("mouseenter", () => anim.play());
  canvas.parentElement!.addEventListener("mouseleave", () => anim.pause());
};

createAntiquum({});

createAntiquum({
  cycleDuration_ms: 1500,
  fps: 120,
  colours: ["#FFc300", "#ff5733", "#c70039", "#900C3F", "#581845"],
  opacity: 1,
  timingFunction: "sinusoidal",
  drawStyle: "fill",
  arcs: 5,
  arcWidth: 10,
  arcWidthDelta: 0.02,
  arcAnchor: "centre",
  tailDelay: 0.2,
  arcDelay: 0.05,
  radius: 50,
  rotations: 1,
  backgroundColour: "#020035",
});

createAntiquum({
  cycleDuration_ms: 2000,
  fps: 120,
  colours: ["#FF6080", "#D95DFF", "#CC52C9", "#733C80", "#402E4D"],
  opacity: 1,
  timingFunction: "sinusoidal",
  drawStyle: "fill",
  arcs: 5,
  arcWidth: 10,
  arcWidthDelta: -0.69,
  arcAnchor: "centre",
  tailDelay: 0.18,
  arcDelay: 0.05,
  radius: 94,
  rotations: 2,
});

createAntiquum({
  cycleDuration_ms: 2500,
  fps: 120,
  colours: ["#00ff9f", "#00b8ff", "#001eff", "#bd00ff", "#d600ff"],
  opacity: 1,
  timingFunction: "sinusoidal",
  drawStyle: "fill",
  arcs: 9,
  arcWidth: 10,
  arcWidthDelta: -0.69,
  arcAnchor: "centre",
  tailDelay: 0.18,
  arcDelay: 0.74,
  radius: 94,
  lineCap: "flat",
  radiusDelta: 0.00999999999999999,
  rotations: 1,
  backgroundColour: "#FFFF00",
});

createAntiquum({
  cycleDuration_ms: 2500,
  fps: 120,
  colours: ["#5bcefa", "#f5a9b8", "#ffffff", "#f5a9b8", "#5bcefa"],
  opacity: 1,
  timingFunction: "sinusoidal",
  drawStyle: "fill",
  rest: 0.3,
  arcs: 5,
  arcWidth: 10,
  arcWidthDelta: 0.02,
  arcAnchor: "centre",
  tailDelay: 0.39,
  arcDelay: 0.02,
  radius: 100,
  lineCap: "flat",
  radiusDelta: 0.08,
  rotations: 1,
});

createLemniscate({});

createLemniscate({
  cycleDuration_ms: 1500,
  fps: 120,
  colours: ["#FFc300", "#ff5733", "#c70039", "#900C3F", "#581845"],
  opacity: 1,
  timingFunction: "sinusoidal",
  drawStyle: "fill",
  arcs: 5,
  arcWidth: 20,
  arcWidthDelta: -0.04,
  tailDelay: 0.2,
  arcDelay: 0.02,
  radius: 25,
  xOff: 50,
  backgroundColour: "#020035",
});

createLemniscate({
  cycleDuration_ms: 1500,
  fps: 120,
  colours: ["#b21f29", "#f05a35", "#ffb94a", "#207ea2", "#68192f"],
  opacity: 1,
  timingFunction: "sinusoidal",
  drawStyle: "fill",
  arcs: 5,
  arcWidth: 10,
  arcWidthDelta: 0.1,
  tailDelay: 0.2,
  arcDelay: 0.02,
  radius: 20,
  radiusDelta: -0.3,
  xOff: 70,
});

createLemniscate({
  cycleDuration_ms: 700,
  fps: 120,
  colours: ["#00ff9f", "#00b8ff", "#001eff", "#bd00ff", "#d600ff"],
  opacity: 1,
  timingFunction: "sinusoidal",
  drawStyle: "fill",
  arcs: 10,
  arcWidth: 3,
  arcWidthDelta: -0.04,
  tailDelay: 0.07,
  arcDelay: 0.37,
  radius: 22,
  radiusDelta: -0.11,
  xOff: 80,
});

createLemniscate({
  cycleDuration_ms: 1500,
  backgroundColour: "#222222",
  fps: 120,
  colours: ["#FFFFFF", "#EEEEEE", "#DDDDDD", "#555555", "#222222"],
  opacity: 0.7,
  timingFunction: "sinusoidal",
  drawStyle: "fill",
  arcs: 8,
  arcWidth: 21,
  tailDelay: 0.17,
  arcDelay: 0.43,
  radius: 39,
  xOff: 65,
});

createSempiternal({
  timingFunction: "linear",
  delay: 0,
  cycleDuration_ms: 2500,
});

createSempiternal({
  cycleDuration_ms: 2500,
  fps: 120,
  colours: ["#581845", "#900C3F", "#c70039", "#ff5733", "#FFc300"],
  opacity: 1,
  delay: 0.1,
  rest: 0.25,
  timingFunction: "sinusoidal",
  drawStyle: "stroke",
  sideLength: 5,
  relativeExpansion: 1,
  circleSize: 25,
  rotations: 1,
});

createSempiternal({
  cycleDuration_ms: 2000,
  fps: 120,
  colours: ["#FF0000", "#00FF00", "#0000FF"],
  opacity: 1,
  timingFunction: "linear",
  drawStyle: "stroke",
  sideLength: 20,
  relativeExpansion: 1,
  circleSize: 10,
  rotations: 0,
  radiusPulse: { style: "disperse", delay: 0.15, intensity: 0.25 },
  backgroundColour: "#000000",
});

createSempiternal({
  cycleDuration_ms: 2700,
  fps: 120,
  colours: ["#EAE2B7", "#FCBF49", "#F77F00", "#D62828", "#003049"],
  opacity: 1,
  timingFunction: "sinusoidal",
  drawStyle: "fill",
  rest: 0.11,
  sideLength: 5,
  relativeExpansion: 1,
  circleSize: 20,
  delay: 0.05,
  rotations: -2,
});

createSempiternal({
  cycleDuration_ms: 2700,
  fps: 120,
  colours: ["#FF9AA2", "#FFB7B2", "#FFDAC1", "#E2F0CB", "#B5EAD7"],
  opacity: 1,
  timingFunction: "sinusoidal",
  drawStyle: "fill",
  rest: 0.11,
  sideLength: 25,
  relativeExpansion: 1,
  circleSize: 4,
  delay: 0.01,
  rotations: 1,
  opacityPulse: { style: "coelesce", delay: 0.03, intensity: 2 },
});
