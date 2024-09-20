import Antiquum from "./antiquum";
import Lemniscate from "./lemniscate";
import Sempiternal from "./sempiternal";

export type Vector2 = {
  x: number;
  y: number;
};

export type BezierControlPoints = {
  cp1: Vector2;
  cp2: Vector2;
};

export type AnimautomatonOps = {
  backgroundColour: string | null;
  currProgress: number;
  lastProgress: number;
  cycleDuration_ms: number;
  currIteration: number;
  nIterations: number;
  fps: number;
  paused: boolean;
  colours: string[];
  opacity: number;
  opacityDelta: number;
  timingFunction: TimingFunction;
  customTimingFunction: (offset?: number) => number;
  drawStyle: DrawStyle;
  rest: number;
  mutationInterval: number;
};

export type LemniscateOps = AnimautomatonOps & {
  arcs: number;
  arcWidth: number;
  arcWidthDelta: number;
  tailDelay: number;
  arcDelay: number;
  radius: number;
  radiusDelta: number;
  xOff: number;
  mutator: (lemniscate: Lemniscate) => void;
};

export type AntiquumOps = AnimautomatonOps & {
  arcs: number;
  arcWidth: number;
  arcWidthDelta: number;
  arcAnchor: Anchor;
  tailDelay: number;
  arcDelay: number;
  radius: number;
  radiusDelta: number;
  rotations: number;
  mutator: (antiquum: Antiquum) => void;
  innerBorder: Border;
  outerBorder: Border;
  trackColour: string;
  lineCap: Linecap;
  leadCap: Linecap;
  tailCap: Linecap;
};

export type SempiternalOps = AnimautomatonOps & {
  sideLength: number;
  circleSize: number;
  relativeExpansion: number;
  delay: number;
  alternateSpin: boolean;
  rotations: number;
  mutator: (sempiternal: Sempiternal) => void;
  opacityPulse: HexPulse;
  radiusPulse: HexPulse;
};

/**
 * A HexPulse is an effect that acts on shapes based on which 'ring' of the hexagonal structure they are in.
 */
export type HexPulse = {
  style: HexPulseStyle;
  delay: number;
  intensity: number;
};

export const HEX_PULSE_STYLES = ["disperse", "coelesce", "off"] as const;
export type HexPulseStyle = (typeof HEX_PULSE_STYLES)[number];

export const DRAW_STYLES = ["fill", "stroke"] as const;
export type DrawStyle = (typeof DRAW_STYLES)[number];

export const TIMING_FUNCTIONS = [
  "linear",
  "sinusoidal",
  "quadratic",
  "cubic",
  "custom",
] as const;
export type TimingFunction = (typeof TIMING_FUNCTIONS)[number];

export const PRESETS = ["antiquum", "lemniscate", "sempiternal"] as const;
export type Preset = (typeof PRESETS)[number];

export const ANCHORS = ["inner", "centre", "outer"] as const;
export type Anchor = (typeof ANCHORS)[number];

export const LINECAPS = ["flat", "rounded"] as const;
export type Linecap = (typeof LINECAPS)[number];

export type Border = {
  weight: number;
  colour: string;
};