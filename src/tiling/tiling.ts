import { Animautomaton, AnimautomatonOps } from "../animautomaton";
import { Vector2 } from "../types";
import { isEven } from "../util";

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
  pulseDirection: Direction;
};

export type TilingShape = "square" | "tri" | "hex";

export type Direction = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

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

  pulseDirection: Direction;

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
    this.size = 70;
    this.padding = 0;
    this.drawStyle = "fill";
    this.pulseDirection = "N";
    this.timingFunction = "linear";

    // Set initial configuration
    if (ops) this.setConfig(ops);

    // Warn if trying to use unsupported shape
    if (this.shape != "hex") {
      throw new Error(
        "Animautomata: Non-hex tilings are not yet fully implemented."
      );
    }

    this.postConstructor();
  }

  /**
   * Sets one or more configurable properties of this Animautomaton.
   *
   * @param ops An object containing one or more valid {TilingOps} properties.
   */
  setConfig = (ops: Partial<TilingOps>) => {
    super.setConfig(ops);
    this.lineWeight = ops.lineWeight ?? this.lineWeight;
    this.context.lineWidth = this.lineWeight;
    this.shape = ops.shape ?? this.shape;
    this.size = ops.size ?? this.size;
    this.padding = ops.padding ?? this.padding;
    this.pulseDirection = ops.pulseDirection ?? this.pulseDirection;
  };

  /**
   * Uses this.context to draw the current frame of the animation, as determined by
   * the current configuration and progress.
   *
   * Called by this.animate().
   */
  draw = () => {
    super.draw();
    const progress = this.getProgress();
    this.drawShapes(progress);
  };

  drawShapes(progress: number) {
    if (this.shape == "square") this.drawSquares(progress);
    else if (this.shape == "tri") this.drawTris(progress);
    else if (this.shape == "hex") this.drawHexes(progress);
    else throw new Error("Invalid Tiling shape: " + this.shape);
  }

  drawSquares(progress: number) {
    const positions = this.getSquarePositions(progress);
    positions.forEach((position) => this.drawSquare(position, progress));
  }

  drawTris(progress: number) {
    const positions = this.getTriPositions(progress);
    positions.forEach((position) =>
      this.drawTri(position, progress, position.dir)
    );
  }

  drawHexes(progress: number) {
    const positions = this.getHexPositions(progress);
    positions.forEach((position) => this.drawHex(position, progress));
  }

  getHexPositions(progress: number) {
    type HexPos = Vector2 & { col: number; row: number };
    const positions: HexPos[] = [];
    const shapeSize = this.size + this.padding;
    const xCutoff = this.canvas.width;
    const yCutoff = this.canvas.height;
    let xOff = 0;
    let col = 0;
    while (xOff <= xCutoff) {
      let yOff = 0;
      let row = 0;
      while (yOff <= yCutoff) {
        positions.push({ x: xOff, y: yOff, col, row });
        if (xOff != 0) {
          positions.push({ x: -xOff, y: yOff, col: -col, row });
        }
        if (yOff != 0) {
          positions.push({ x: xOff, y: -yOff, col, row: -row });
          if (xOff != 0) {
            positions.push({ x: -xOff, y: -yOff, col: -col, row: -row });
          }
        }
        row++;
        yOff += shapeSize;
      }
      col++;
      xOff += shapeSize * (3 / 4) - 1;
    }
    return positions;
  }

  getTriPositions(progress: number) {
    type TriPos = Vector2 & { dir: "up" | "down" };
    const positions: TriPos[] = [];
    const a = this.size;
    const shapeSize = a + this.padding / 2;
    const h = Math.sqrt(Math.pow(a, 2) - Math.pow(a / 2, 2));
    const cutoff = this.canvas.width / 2;
    let xOff = 0;
    let dir: "up" | "down" = "up";
    while (xOff <= cutoff) {
      let yOff = 0;
      while (yOff <= cutoff) {
        positions.push({ x: xOff, y: yOff, dir: dir });
        if (xOff != 0) {
          positions.push({ x: -xOff, y: yOff, dir: dir });
        }
        if (yOff != 0) {
          positions.push({ x: xOff, y: -yOff, dir: dir });
          if (xOff != 0) {
            positions.push({ x: -xOff, y: -yOff, dir: dir });
          }
        }
        yOff += h + this.padding / 2;
        dir = dir == "up" ? "down" : "up";
      }
      xOff += shapeSize / 2 + this.padding / 2;
    }
    return positions;
  }

  getSquarePositions(progress: number) {
    const positions: Vector2[] = [];
    const shapeSize = this.size + this.padding;
    const cutoff = this.canvas.width / 2;
    let xOff = 0;
    while (xOff <= cutoff) {
      let yOff = 0;
      while (yOff <= cutoff) {
        positions.push({ x: xOff, y: yOff });
        if (xOff != 0) {
          positions.push({ x: -xOff, y: yOff });
        }
        if (yOff != 0) {
          positions.push({ x: xOff, y: -yOff });
          if (xOff != 0) {
            positions.push({ x: -xOff, y: -yOff });
          }
        }
        yOff += shapeSize;
      }
      xOff += shapeSize;
    }
    return positions;
  }

  drawHex(position: Vector2 & { col: number; row: number }, progress: number) {
    let a = this.size;
    let r = a / 2;
    if (isEven(position.col)) position.y = position.y + r + this.padding / 2;

    const progress_x = ["E", "NE", "SE"].includes(this.pulseDirection)
      ? 1 - progress
      : progress;
    let progress_y = ["S", "SW", "SE"].includes(this.pulseDirection)
      ? 1 - progress
      : progress;

    let normalized_x =
      (position.x + progress_x * this.canvas.width * 2) / this.canvas.width;
    if (normalized_x > 1) normalized_x = 2 - normalized_x;

    let normalized_y =
      (position.y + progress_y * this.canvas.height * 2) / this.canvas.height;
    if (normalized_y > 1) normalized_y = 2 - normalized_y;

    const max_hold = 0;
    if (normalized_y > 1 - max_hold) {
      normalized_y = 1;
    } else {
      normalized_y = normalized_y * (1 / (1 - max_hold));
    }

    this.ctxSetColour(position.row);

    if (this.pulseDirection == "N") r = r * normalized_y;
    else if (this.pulseDirection == "NE") r = r * normalized_x * normalized_y;
    else if (this.pulseDirection == "E") r = r * normalized_x;
    else if (this.pulseDirection == "SE") r = r * normalized_x * normalized_y;
    else if (this.pulseDirection == "S") r = r * normalized_y;
    else if (this.pulseDirection == "SW") r = r * normalized_x * normalized_y;
    else if (this.pulseDirection == "W") r = r * normalized_x;
    else if (this.pulseDirection == "NW") r = r * normalized_x * normalized_y;

    this.context.beginPath();
    this.context.moveTo(
      this.origin.x + position.x + r / 2,
      this.origin.y + position.y - r
    );
    this.context.lineTo(
      this.origin.x + position.x + r,
      this.origin.y + position.y
    );
    this.context.lineTo(
      this.origin.x + position.x + r / 2,
      this.origin.y + position.y + r
    );
    this.context.lineTo(
      this.origin.x + position.x - r / 2,
      this.origin.y + position.y + r
    );
    this.context.lineTo(
      this.origin.x + position.x - r,
      this.origin.y + position.y
    );
    this.context.lineTo(
      this.origin.x + position.x - r / 2,
      this.origin.y + position.y - r
    );
    this.context.lineTo(
      this.origin.x + position.x + r / 2,
      this.origin.y + position.y - r
    );
    this.ctxDraw();
  }

  drawTri(position: Vector2, progress: number, orientation: "up" | "down") {
    const a = this.size;
    const h = (a * Math.sqrt(3)) / 5.5;
    const r = a / Math.sqrt(3);
    this.context.beginPath();
    if (orientation == "up") {
      this.context.moveTo(
        this.origin.x + position.x,
        this.origin.y + position.y - r
      );
      this.context.lineTo(
        this.origin.x + position.x + a / 2,
        this.origin.y + position.y + h
      );
      this.context.lineTo(
        this.origin.x + position.x - a / 2,
        this.origin.y + position.y + h
      );
      this.context.lineTo(
        this.origin.x + position.x,
        this.origin.y + position.y - r
      );
    } else {
      const offset = r / 2;
      this.context.moveTo(
        this.origin.x + position.x,
        this.origin.y + position.y - offset + r
      );
      this.context.lineTo(
        this.origin.x + position.x - a / 2,
        this.origin.y + position.y - offset - h
      );
      this.context.lineTo(
        this.origin.x + position.x + a / 2,
        this.origin.y + position.y - offset - h
      );
      this.context.lineTo(
        this.origin.x + position.x,
        this.origin.y + position.y - offset + r
      );
    }
    this.ctxDraw();
  }

  drawSquare(position: Vector2, progress: number) {
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
  }
}
