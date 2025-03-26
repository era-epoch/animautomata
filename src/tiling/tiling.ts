import { Animautomaton, AnimautomatonOps } from "../animautomaton";
import { Vector2 } from "../types";

/**
 * Configurable properties able to be passed to the constructor.
 *
 * Superset of {AnimautomatonOps}.
 *
 * See {Tiling} class documentation for explanations.
 */
export type TilingOps = AnimautomatonOps & {
  lineWeight: number;
  shape: TilingShape;
  size: number;
  padding: number;
};

export type TilingShape = "square" | "tri" | "hex";

/**
 * An animated planar tiling.
 */
export class Tiling extends Animautomaton {
  // #region Configurable properties
  /**
   *
   */
  lineWeight: number;

  /**
   *
   */
  shape: TilingShape;

  /**
   * The base width of the shapes in the tiling.
   */
  size: number;

  /**
   * The size of the space between shapes in the tiling. Will default to a value that draws the shapes
   * flush with each other.
   */
  padding: number;

  // #region Methods

  /**
   * Creates a new Tiling animautomaton.
   *
   * @param canvasId The id of an HTMLCanvasElement on the page that this animation will render to.
   * @param ops An object containing one or more valid {TilingOps} properties.
   */
  constructor(canvasId: string, ops?: Partial<TilingOps>) {
    // Parent constructor
    super(canvasId);

    // Set default configuration
    this.lineWeight = 1;
    this.shape = "square";
    this.size = 50;
    this.padding = 10;
    this.drawStyle = "stroke";

    // Set initial configuration
    if (ops) this.setConfig(ops);

    this.postConstructor();
  }

  // Capture the parent version of overridden methods before override
  parentDraw = this.draw;
  parentSetConfig = this.setConfig;

  /**
   * Sets one or more configurable properties of this Animautomaton.
   *
   * @param ops An object containing one or more valid {TilingOps} properties.
   */
  setConfig = (ops: Partial<TilingOps>) => {
    this.lineWeight = ops.lineWeight ?? this.lineWeight;
    this.context.lineWidth = this.lineWeight;
    this.shape = ops.shape ?? this.shape;
    this.size = ops.size ?? this.size;
    this.padding = ops.padding ?? this.padding;
  };

  /**
   * Uses this.context to draw the current frame of the animation, as determined by
   * the current configuration and this.currProgress.
   *
   * Called by this.animate().
   */
  draw = () => {
    // Eq. to super.draw()
    this.parentDraw();
    const progress = this.getProgress();
    const cols = Math.ceil(this.canvas.width / (this.size + this.padding));
    for (let col = -Math.ceil(cols / 2); col <= Math.ceil(cols / 2); col++) {
      let offset = 0;
      let colOffset = col * (this.size + this.padding);
      while (
        offset <
        Math.ceil(this.canvas.height / 2) + this.size + this.padding
      ) {
        this.drawShape({ x: colOffset, y: 0 + offset }, progress);
        if (offset != 0) {
          this.drawShape({ x: colOffset, y: 0 - offset }, progress);
        }
        offset += this.size + this.padding;
      }
    }
  };

  drawShape = (position: Vector2, progress: number) => {
    if (this.shape == "hex") this.drawHex(position, progress);
    else if (this.shape == "tri") this.drawTri(position, progress);
    else if (this.shape == "square") this.drawSquare(position, progress);
    else throw new Error("Invalid Tiling shape: " + this.shape);
  };

  drawHex = (position: Vector2, progress: number) => {};
  drawTri = (position: Vector2, progress: number) => {};
  drawSquare = (position: Vector2, progress: number) => {
    this.context.beginPath();
    this.context.moveTo(
      this.origin.x + position.x + this.size / 2,
      this.origin.y + position.y - this.size / 2
    );
    this.context.lineTo(
      this.origin.x + position.x + this.size / 2,
      this.origin.y + position.y + this.size / 2
    );
    this.context.lineTo(
      this.origin.x + position.x - this.size / 2,
      this.origin.y + position.y + this.size / 2
    );
    this.context.lineTo(
      this.origin.x + position.x - this.size / 2,
      this.origin.y + position.y - this.size / 2
    );
    this.context.lineTo(
      this.origin.x + position.x + this.size / 2,
      this.origin.y + position.y - this.size / 2
    );
    this.ctxDraw();
  };
}
