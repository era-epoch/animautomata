import {
  BezierControlPoints,
  DrawStyle,
  TimingFunction,
  Vector2,
} from "./types";
import { clamp, modulo, pseudoUUID } from "./utils";

/**
 * Configurable properties able to be passed to *all* Animautomaton constructors.
 *
 * See {Animautomaton} class documentation for explanations.
 */

export type AnimautomatonOps = {
  backgroundColour: string | null;
  canvasWidth: number;
  canvasHeight: number;
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

/**
 * Abstract parent class containing shared properties and methods for all animautomatons.
 */

export abstract class Animautomaton {
  // #region Non-configurable properties

  /**
   * A uuid for this object. Generated with crypto.randomUUID().
   *
   * Falls back to pseudoUUID() which uses Math.random() if not running in a secure context.
   */
  id: string;

  /**
   * High resolution timestamp (ms) of when this animation was created.
   */
  start: number;

  /**
   * High resolution timestamp (ms) of when this animation was last rendered.
   */
  lastDraw: number;

  /**
   * True iff this animation is currently paused.
   */
  paused: boolean;

  /**
   * High resolution timestamp (ms) of when this animation was last paused.
   */
  pauseTimestamp: number;

  /**
   * Number of milliseconds this animation has spent paused in total.
   */
  pauseDuration: number;

  /**
   * Keeps track of the current colour value during a draw call
   */
  currColour: string;

  // #region Configurable properties

  /**
   * If not null: the canvas will be painted this colour.
   *
   * Default: null
   */
  backgroundColour: string | null;

  /**
   * A number between 0 and 1 representing the animation's progress through its loop THIS frame.
   *
   * Default: 0
   */
  currProgress: number;

  /**
   * A number between 0 and 1 representing the animation's progress through its loop LAST frame.
   *
   * Default: 0
   */
  lastProgress: number;

  /**
   * High resolution timestamp (ms) of when this animation was last mutated.
   *
   * Default: 0
   */
  lastMutationTimestamp: number;

  /**
   * The canvas element this animation is being drawn on.
   *
   * Animations should have their own canvas with nothing else on it.
   */
  canvas: HTMLCanvasElement;

  /**
   * The context2d from this animation's canvas.
   */
  context: CanvasRenderingContext2D;

  /**
   * The (x,y) value of the geometric centre of the canvas.
   *
   * Default: {x: Math.floor(canvas.width / 2), y: Math.floor(canvas.height / 2)}
   */
  origin: Vector2;

  /**
   * This animation's mutate() method is called after this many iterations.
   * e.g. If mutationInterval is 0.5, the mutate method will be called halfway through each loop,
   * and again at the end of each loop.
   *
   * Default: Infinity (i.e. mutate() is never called)
   */
  mutationInterval: number;

  /**
   * Number of milliseconds this animation's loop will take. Lower = faster.
   *
   * Default: 1000
   */
  cycleDuration_ms: number;

  /**
   * A number between 0 and 1.
   *
   * This animation will be still in its starting position for this proportion of its duration.
   *
   * Default: 0
   */
  rest: number;

  /**
   * Number of requested renders per second (not guaranteed!).
   *
   * Default: 60
   */
  fps: number;

  /**
   * The current iteration of this animation.
   *
   * Default: 0
   */
  currIteration: number;

  /**
   * This animation will pause after this many loops.
   *
   * Default: Infinity (i.e. animation continues forever)
   */
  nIterations: number;

  /**
   * An array of 7-character hex code colour strings (e.g. ["#ffffff"]).
   * (Must be 7 characters for opacity to work properly.)
   */
  colours: string[];

  /**
   * A number between 0 and 1.
   *
   * The base transparcency to apply to colours when drawing.
   *
   * Default: 1
   */
  opacity: number;

  /**
   * Each differentiable section will have this much less opacity than the previous section (minimum 0).
   *
   * Default: 0
   */
  opacityDelta: number;

  /**
   * Transformation to apply to this animation's progress.
   *
   * Default: sinusoidal
   */
  timingFunction: TimingFunction;

  /**
   * This function will be called iff timingFunction = "custom"
   *
   * Custom timing functions must take in an offset to apply to currProgress,
   * and return a value between 0 and 1.
   */
  customTimingFunction: (offset?: number) => number;

  /**
   * Represents which Context2D drawing function to call.
   *
   * Default: fill
   */
  drawStyle: DrawStyle;

  // #region Constructor

  /**
   * Creates a new Animautomaton.
   *
   * @param canvasId The id of an HTMLCanvasElement on the page that this animation will render to.
   * @param ops An object containing one or more valid {AnimautomatonOps} properties.
   */
  constructor(canvasId: string) {
    // Initialize non-config properties
    if (window.isSecureContext) {
      this.id = crypto.randomUUID();
    } else {
      this.id = pseudoUUID();
    }
    this.start = performance.now();
    this.lastDraw = this.start;
    this.lastMutationTimestamp = this.start;
    this.pauseTimestamp = 0;
    this.pauseDuration = 0;
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (this.canvas === null) {
      throw new Error("Canvas element not found with id: " + canvasId);
    }
    this.origin = {
      x: Math.floor(this.canvas.width / 2),
      y: Math.floor(this.canvas.height / 2),
    };
    this.currColour = "";
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    // Set default configuration
    this.backgroundColour = null;
    this.currProgress = 0;
    this.lastProgress = 0;
    this.rest = 0;
    this.fps = 60;
    this.cycleDuration_ms = 1500;
    this.currIteration = 0;
    this.nIterations = Infinity;
    this.paused = false;
    this.colours = ["#000000"];
    this.opacity = 1;
    this.opacityDelta = 0;
    this.timingFunction = "sinusoidal";
    this.customTimingFunction = this.getProgressLinear;
    this.drawStyle = "fill";
    this.mutationInterval = Infinity;

    // Initial configuration from {ops} will be set in child class constructor.
  }

  // #region Methods

  /**
   * Sets one or more configurable properties of this Animautomaton.
   *
   * @param ops An object containing one or more valid {AnimautomatonOps} properties.
   */
  setConfig = (ops: Partial<AnimautomatonOps>) => {
    this.backgroundColour = ops.backgroundColour ?? this.backgroundColour;
    this.currProgress = ops.currProgress ?? this.currProgress;
    this.lastProgress = ops.lastProgress ?? this.lastProgress;
    this.rest = ops.rest ?? this.rest;
    this.fps = ops.fps ?? this.fps;
    this.cycleDuration_ms = ops.cycleDuration_ms ?? this.cycleDuration_ms;
    this.currIteration = ops.currIteration ?? this.currIteration;
    this.nIterations = ops.nIterations ?? this.nIterations;
    this.paused = ops.paused ?? this.paused;
    this.colours = ops.colours ?? this.colours;
    this.opacity = ops.opacity ?? this.opacity;
    this.opacityDelta = ops.opacityDelta ?? this.opacityDelta;
    this.timingFunction = ops.timingFunction ?? this.timingFunction;
    this.customTimingFunction =
      ops.customTimingFunction ?? this.customTimingFunction;
    this.drawStyle = ops.drawStyle ?? this.drawStyle;
    this.mutationInterval = ops.mutationInterval ?? this.mutationInterval;
    this.canvas.width = ops.canvasWidth ?? this.canvas.width;
    this.canvas.height = ops.canvasHeight ?? this.canvas.height;

    // Side effects
    this.origin = {
      x: Math.floor(this.canvas.width / 2),
      y: Math.floor(this.canvas.height / 2),
    };
  };

  /**
   * Parent draw() must be called at the start of childrens' draw() methods.
   */
  draw = () => {
    // Clear previous render
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Paint background colour, if present
    if (this.backgroundColour != null) {
      this.context.fillStyle = this.backgroundColour;
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  };

  /**
   * Moves the animation 1 frame forward.
   */
  step = () => {
    this.seek(1);
  };

  /**
   * Moves the animation immediately a certain number of frames.
   * @param frames Number of frames to seek (negative = rewind)
   */
  seek = (frames: number) => {
    const msPerFrame = 1000 / this.fps;
    const progressPerFrame = msPerFrame / this.cycleDuration_ms;
    this.lastProgress = this.currProgress;
    this.currProgress = clamp(
      0,
      this.currProgress + frames * progressPerFrame,
      1
    );
    if (this.lastProgress === 1) this.currProgress = 0;
    this.draw();
  };

  /**
   * This function is called every animation frame & decides whether or not to draw
   * a new frame of this animation, and also whether or not to call mutate().
   */
  animate = () => {
    // Cancel animation if paused
    if (this.paused) return;

    // Request the next animation frame
    requestAnimationFrame(this.animate);

    // Check time delta since last call
    const now = performance.now();
    const delta = now - this.lastDraw;
    const msPerFrame = 1000 / this.fps;
    if (delta < msPerFrame) {
      return;
    }

    // Check time delta since last mutation
    const mutationDelta = now - this.lastMutationTimestamp;
    if (mutationDelta >= this.mutationInterval) {
      this.mutate();
      this.lastMutationTimestamp = now;
    }

    // If time elapsed since last call exceeds target ms/f, re-render
    this.lastProgress = this.currProgress;
    this.currProgress =
      modulo(now - this.pauseDuration - this.start, this.cycleDuration_ms) /
      this.cycleDuration_ms;
    if (this.lastProgress > this.currProgress) {
      this.currIteration++;
      if (this.currIteration >= this.nIterations) {
        this.pause();
      }
    }
    this.draw();
    this.lastDraw = now;
  };

  /**
   * This function is called every {mutationInterval} * {cycleDuration_ms} milliseconds.
   * Used for mutating the animation over time (e.g. between loops).
   * @abstract
   */
  mutate = () => {};

  /**
   * @param offset An amount to either add or subtract from the base progress before transformation.
   * @returns A value between 0 and 1 representing the animation's progress through its loop,
   * transformed according to this.timingFunction.
   */
  getProgress = (offset?: number): number => {
    switch (this.timingFunction) {
      case "sinusoidal":
        return this.getProgressSinusoidal(offset);
      case "quadratic":
        return this.getProgressExponential(2, offset);
      case "cubic":
        return this.getProgressExponential(3, offset);
      case "custom":
        if (this.customTimingFunction == null) {
          throw new Error("Custom timing function does not exist.");
        }
        return this.customTimingFunction(offset);
      default:
        return this.getProgressLinear(offset);
    }
  };

  getProgressLinear = (offset?: number): number => {
    const offset_progress = offset
      ? (this.currProgress + 1 + offset) % 1
      : this.currProgress;
    const x = Math.min(1, offset_progress / (1 - this.rest));
    return x;
  };

  getProgressExponential = (pow: number, offset?: number): number => {
    const offset_progress = offset
      ? (this.currProgress + 1 + offset) % 1
      : this.currProgress;
    const x = Math.min(1, offset_progress / (1 - this.rest));
    return Math.pow(x, pow);
  };

  getProgressSinusoidal = (offset?: number): number => {
    const offset_progress = offset
      ? (this.currProgress + 1 + offset) % 1
      : this.currProgress;
    const x = Math.min(1, offset_progress / (1 - this.rest));
    const t = 0.5 + Math.sin((x - 0.5) * Math.PI) / 2;
    return t;
  };

  /**
   * Starts or resumes new rendering calls.
   */
  play = () => {
    this.paused = false;
    const now = performance.now();
    this.lastDraw = now;
    this.pauseDuration += now - this.pauseTimestamp;
    requestAnimationFrame(this.animate);
  };

  /**
   * Prevents new rendering calls.
   */
  pause = () => {
    this.paused = true;
    this.pauseTimestamp = performance.now();
  };

  /**
   * Draws the current path in this.context based on this.drawStyle.
   */
  ctxDraw = () => {
    if (this.drawStyle == "fill") {
      this.context.fill();
    } else {
      this.context.stroke();
    }
  };

  /**
   * Moves this.context to position vector v
   * @param v
   */
  ctxMoveToVector = (v: Vector2) => {
    this.context.moveTo(v.x, v.y);
  };

  /**
   * Draws a line from the current position of this.context to the position given
   * by vector v.
   * @param v
   */
  ctxLineToVector = (v: Vector2) => {
    this.context.lineTo(v.x, v.y);
  };

  /**
   * Draws a circular bezier curve from the start position to the end position with the center
   * point of originOffset.
   *
   * @param start
   * @param end
   * @param originOffset
   */
  ctxCircToVector = (start: Vector2, end: Vector2, originOffset: Vector2) => {
    const cps = this.circularBezierControlPoints(start, end, originOffset);
    this.context.bezierCurveTo(
      cps.cp1.x,
      cps.cp1.y,
      cps.cp2.x,
      cps.cp2.y,
      end.x,
      end.y
    );
  };

  /**
   * Sets both context.strokeStyle and context.fillStyle with appropriate opacity.
   * @param offset The index of the colour in this.colours (wraps around).
   */
  ctxSetColour = (offset: number) => {
    const modOffset = modulo(offset, this.colours.length);
    const opacity = Math.floor(
      Math.max(
        0,
        this.opacity - (this.colours.length - 1 - modOffset) * this.opacityDelta
      ) * 255
    );
    const opacityString = opacity.toString(16).padStart(2, "0");
    const colour = `${this.colours[modOffset]}${opacityString}`;
    this.context.strokeStyle = colour;
    this.context.fillStyle = colour;
    // This is necessary because subseqent access to the colour on the context object does not
    // return opacity in some cases, for some unknown reason. TODO: Investigate
    this.currColour = colour;
  };

  /**
   * Sets new opacity to: currentOpacity + currentOpacity * modifier. Enforces minimum of 0.
   * @param modifier
   */
  ctxModifyOpacity = (modifier: number) => {
    const styleString = this.currColour;
    const colour = styleString.slice(0, 7);
    const opacity = styleString.slice(7, 9);
    const opacityValue = parseInt(opacity, 16);
    const modifiedOpacity = Math.floor(opacityValue + opacityValue * modifier);
    const modifiedOpacityString = modifiedOpacity.toString(16).padStart(2, "0");
    const newColour = `${colour}${modifiedOpacityString}`;
    this.context.strokeStyle = newColour;
    this.context.fillStyle = newColour;
    this.currColour = newColour;
  };

  /**
   * Draws a radius 2 circle at the position given. Used for debugging.
   */
  drawDot = (pos: Vector2) => {
    this.context.beginPath();
    this.context.arc(
      this.origin.x + pos.x,
      this.origin.y + pos.y,
      2,
      0,
      2 * Math.PI
    );
    this.context.fill();
  };

  /**
   * Given two points {from} and {to}, calculates the control points necessary to draw a Bezier curve
   * from {from} to {to} that is part of a circle with center of {originOffset}
   * @param from
   * @param to
   * @param originOffset
   * @returns An object containing the Bezier control points.
   */
  circularBezierControlPoints = (
    from: Vector2,
    to: Vector2,
    originOffset?: Vector2
  ): BezierControlPoints => {
    // Thanks to: https://stackoverflow.com/questions/734076/how-to-best-approximate-a-geometrical-arc-with-a-bezier-curve
    const offset = originOffset ?? { x: 0, y: 0 };
    const ax = from.x - offset.x;
    const ay = from.y - offset.y;
    const bx = to.x - offset.x;
    const by = to.y - offset.y;
    const q1 = ax * ax + ay * ay;
    const q2 = q1 + ax * bx + ay * by;
    const k2 = ((4 / 3) * (Math.sqrt(2 * q1 * q2) - q2)) / (ax * by - ay * bx);
    const x1 = offset.x + ax - k2 * ay;
    const y1 = offset.y + ay + k2 * ax;
    const x2 = offset.x + bx + k2 * by;
    const y2 = offset.y + by - k2 * bx;
    return {
      cp1: { x: x1, y: y1 },
      cp2: { x: x2, y: y2 },
    };
  };
}
