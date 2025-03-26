import { Animautomaton, AnimautomatonOps } from "../animautomaton";

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
    this.shape = "hex";
    this.size = 1;
    this.padding = 1;

    // Set initial configuration
    if (ops) this.setConfig(ops);
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
  };
}
