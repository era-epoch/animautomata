import { Animautomaton, AnimautomatonOps } from "../animautomaton";
import { Vector2 } from "../types";

/**
 * Configurable properties able to be passed to the Sempiternal constructor.
 *
 * Superset of {AnimautomatonOps}.
 *
 * See {Sempiternal} class documentation for explanations.
 */
export type SempiternalOps = AnimautomatonOps & {
  sideLength: number;
  circleSize: number;
  relativeExpansion: number;
  delay: number;
  alternateSpin: boolean;
  rotations: number;
  opacityPulse: HexPulse;
  radiusPulse: HexPulse;
};

/**
 * Represents an effect that acts on Sempiternal shapes based on which 'ring'
 * of the hexagonal structure they are in.
 */
export type HexPulse = {
  style: HexPulseStyle;
  delay: number;
  intensity: number;
};

export const HEX_PULSE_STYLES = ["disperse", "coelesce", "off"] as const;
export type HexPulseStyle = (typeof HEX_PULSE_STYLES)[number];

export class Sempiternal extends Animautomaton {
  // #region Configurable properties

  /**
   * The number of circles per side of the hexagon, also the number of 'rings'.
   */
  sideLength: number;

  /**
   * The radius (px) of each circle.
   */
  circleSize: number;

  /**
   * The number of circle radii each 'ring' is from the origin.
   */
  relativeExpansion: number;

  /**
   * A value between 0 and 1 indicating what percentage behind in the loop each successive ring will be.
   */
  delay: number;

  /**
   * If true: every other ring will rotate in the opposite direction.
   */
  alternateSpin: boolean;

  /**
   * Number of rotations to complete in one loop. Must be an integer.
   */
  rotations: number;

  /**
   * Controls the pulse in opacity (see HexPulse)
   */
  opacityPulse: HexPulse;

  /**
   * Controls the pulse in opacity (see HexPulse)
   */
  radiusPulse: HexPulse;

  // #region Methods

  /**
   * Creates a new Sempiternal animautomaton.
   *
   * @param canvasId The id of an HTMLCanvasElement on the page that this animation will render to.
   * @param ops An object containing one or more valid {SempiternalOps} properties.
   */
  constructor(canvasId: string, ops?: Partial<SempiternalOps>) {
    // Parent constructor
    super(canvasId);

    // Default configuration
    const defaultPulse = {
      style: "off" as HexPulseStyle,
      delay: 0.1,
      intensity: 1,
    };
    this.sideLength = 3;
    this.circleSize = this.canvas.width / 8;
    this.relativeExpansion = 1;
    this.delay = 0.1;
    this.alternateSpin = false;
    this.drawStyle = "stroke";
    this.rotations = 1;
    this.opacityPulse = structuredClone(defaultPulse);
    this.radiusPulse = structuredClone(defaultPulse);

    // Set initial configuration
    if (ops) this.setConfig(ops);

    this.postConstructor();
  }

  // Capture the parent version of overridden methods
  parentDraw = this.draw;
  parentSetConfig = this.setConfig;

  /**
   * Sets one or more configurable properties of this Animautomaton.
   *
   * @param ops An object containing one or more valid {SempiternalOps} properties.
   */
  setConfig = (ops: Partial<SempiternalOps>) => {
    this.parentSetConfig(ops);
    this.sideLength = ops?.sideLength ?? this.sideLength;
    this.circleSize = ops?.circleSize ?? this.circleSize;
    this.relativeExpansion = ops?.relativeExpansion ?? this.relativeExpansion;
    this.delay = ops?.delay ?? this.delay;
    this.alternateSpin = ops?.alternateSpin ?? this.alternateSpin;
    this.drawStyle = ops?.drawStyle ?? this.drawStyle;
    this.rotations = ops?.rotations ?? this.rotations;
    this.opacityPulse = ops?.opacityPulse ?? this.opacityPulse;
    this.radiusPulse = ops?.radiusPulse ?? this.radiusPulse;
  };

  /**
   * Uses this.context to draw the current frame of the animation, as determined by
   * this.currProgress. Called by this.animate.
   */
  draw = () => {
    // Eq. to super.draw()
    this.parentDraw();

    // Draw outer 'rings' first
    for (let i = this.sideLength - 1; i >= 0; i--) {
      let spin =
        this.getProgress(this.delay * i) * Math.PI * 2 * this.rotations;

      if (this.alternateSpin && i % 2 == 0) spin *= -1;

      this.ctxSetColour(i);

      // Perform pulse effects
      this.performOpacityPulse(i);
      const effectiveRadius = this.performRadiusPulse(i);

      // Drawing the circles
      for (let j = 0; j < 6; j++) {
        // Circles along hexagonal axes
        const theta = Math.PI / 6 + (Math.PI / 3) * j;
        const r = this.circleSize * this.relativeExpansion * i;
        const position = {
          x: this.origin.x + r * Math.cos(theta + spin),
          y: this.origin.y + r * Math.sin(theta + spin),
        };
        this.context.beginPath();
        this.context.arc(
          position.x,
          position.y,
          effectiveRadius,
          0,
          Math.PI * 2
        );
        this.ctxDraw();
        if (i == 0) break; // Avoid drawing identical overlapping shapes in the degenerate case

        // Circles in-between hexagonal axes
        for (let k = 0; k < i - 1; k++) {
          const offsetPosition: Vector2 = {
            x:
              position.x +
              (k + 1) *
                this.circleSize *
                this.relativeExpansion *
                Math.cos(theta + (2 * Math.PI) / 3 + spin),
            y:
              position.y +
              (k + 1) *
                this.circleSize *
                this.relativeExpansion *
                Math.sin(theta + (2 * Math.PI) / 3 + spin),
          };
          this.context.beginPath();
          this.context.arc(
            offsetPosition.x,
            offsetPosition.y,
            effectiveRadius,
            0,
            Math.PI * 2
          );
          this.ctxDraw();
        }
      }
    }
  };

  /**
   * Adjusts this.context's opacity based on the current opacityPulse settings.
   * @param level The ring of the shape.
   */
  performOpacityPulse = (level: number) => {
    const i = level;
    if (this.opacityPulse.style == "coelesce") {
      const pulseProg = this.getProgressLinear(this.opacityPulse.delay * i);
      this.ctxModifyOpacity(
        pulseProg < 0.5 ? -(pulseProg * 2) : -2 + pulseProg * 2
      );
    } else if (this.opacityPulse.style == "disperse") {
      const pulseProg = this.getProgressLinear(
        this.opacityPulse.delay * (this.sideLength - 1 - i)
      );
      this.ctxModifyOpacity(
        pulseProg < 0.5 ? -(pulseProg * 2) : -2 + pulseProg * 2
      );
    }
  };

  /**
   * Calculates the circle radius for a given level with the current radius pulse settings.
   * @param level
   * @returns The effective radius for this level given current progress.
   */
  performRadiusPulse = (level: number): number => {
    const i = level;
    let effectiveRadius = this.circleSize;
    if (this.radiusPulse.style == "coelesce") {
      const pulseProg = this.getProgressLinear(this.radiusPulse.delay * i);
      const radiusModifier =
        pulseProg < 0.5 ? -(pulseProg * 2) : -2 + pulseProg * 2;
      effectiveRadius =
        effectiveRadius +
        radiusModifier * this.radiusPulse.intensity * effectiveRadius;
    } else if (this.radiusPulse.style == "disperse") {
      const pulseProg = this.getProgressLinear(
        this.radiusPulse.delay * (this.sideLength - 1 - i)
      );
      const radiusModifier =
        pulseProg < 0.5 ? -(pulseProg * 2) : -2 + pulseProg * 2;
      effectiveRadius =
        effectiveRadius +
        radiusModifier * this.radiusPulse.intensity * effectiveRadius;
    }
    return effectiveRadius;
  };
}
