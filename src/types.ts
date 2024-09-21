export type Vector2 = {
  x: number;
  y: number;
};

export type BezierControlPoints = {
  cp1: Vector2;
  cp2: Vector2;
};

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

/**
 * TODO: document, name better
 */
export type ArcPoints = {
  lead: ArcEndPoint;
  tail: ArcEndPoint;
};

/**
 * TODO: document, name better
 */
export type ArcEndPoint = {
  outer: Vector2;
  mid: Vector2;
  inner: Vector2;
};
