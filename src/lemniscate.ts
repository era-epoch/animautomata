import { Animautomaton, AnimautomatonOps } from "./animautomaton";
import { ArcEndPoint, ArcPoints, Vector2 } from "./types";

/**
 * Configurable properties able to be passed to the Lemniscate constructor.
 *
 * Superset of {AnimautomatonOps}.
 *
 * See {Lemniscate} class documentation for explanations.
 */
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

/**
 * TODO: document, name better
 */
const DrawOrders = [
  "tail",
  "outer-mid",
  "lead",
  "inner-mid",
  "contained",
] as const;
type DrawOrder = (typeof DrawOrders)[number];

/**
 * Geometric information used for drawing the lemniscate shape.
 */
type LemniscateGeometry = {
  /**
   * The slope of line through the origin that is tangent to the circles
   */
  k: number;

  /**
   * The slope of a line orthogonal to {k}
   */
  k_orthogonal: number;

  /**
   * Absolute value of the 2 points on each circles where the tangent line passes through the origin.
   */
  tangent_point: Vector2;

  /**
   * Angle towards tangent point/
   */
  theta: number;

  /**
   * Arc_theta
   */
  arc_theta: number;

  /**
   * An array of numbers between 0 and 1 that represent the progress values when the arc
   * enters into a different 'region' of the path (there are 8 regions in total).
   */
  checkpoints: number[];
};

/**
 * An animautomaton that draws along a path resembling an infinity symbol.
 */
export class Lemniscate extends Animautomaton {
  // #region Non-configurable properties

  /**
   * An array of geometric information objects where geometries[i] is the info for the ith arc.
   */
  geometries: LemniscateGeometry[];

  // #region Configurable properties

  /**
   * The number of individual shapes to draw.
   */
  arcs: number;

  /**
   * Width of the primary arc (in pixels).
   */
  arcWidth: number;

  /**
   * A value between 0 and 1 indicating what percentage behind in the loop the arc's tail (endpoint) will
   * be compared to its head (starting point) at all times.
   */
  tailDelay: number;

  /**
   * A value between 0 and 1 indicating what percentage behind in the loop each successive arc will be.
   *
   * Only has an effect with multiple arcs.
   */
  arcDelay: number;

  /**
   * Radius of the two circles that the centre of the arcs will travel along, in pixels.
   */
  radius: number;

  /**
   * The distance from the origin to the centre of each path circle along the x-axis.
   */
  xOff: number;

  /**
   * An optional function that modifies {this}, will be called every mutation interval.
   *
   * Can be used to procedurally change the animation properties (e.g. between loops).
   */
  mutator: (lemniscate: Lemniscate) => void;

  /**
   * Only has an effect with multiple arcs. Each arc will travel along a path with radius this
   * much less (proportional to primary radius).
   *
   * Can be set to a negative value to make successive arcs travel along a path with greater radius.
   */
  radiusDelta: number;

  /**
   * Only has an effect with multiple arcs. Each arc will be this much (proportional to primary arcWidth)
   * narrower than the previous.
   *
   * Can be set to a negative value to make successive arcs larger.
   */
  arcWidthDelta: number;

  // #region Constructor

  /**
   * Creates a new Lemniscate animautomaton.
   *
   * @param canvasId The id of an HTMLCanvasElement on the page that this animation will render to.
   * @param ops An object containing one or more valid {LemniscateOps} properties.
   */
  constructor(canvasId: string, ops?: Partial<LemniscateOps>) {
    super(canvasId, ops);
    this.arcs = ops?.arcs ?? 1;
    this.arcWidth = ops?.arcWidth ?? 10;
    this.arcWidthDelta = ops?.arcWidthDelta ?? 0;
    this.tailDelay = ops?.tailDelay ?? 0.2;
    this.arcDelay = ops?.arcDelay ?? 0.1;
    this.radius = ops?.radius ?? this.canvas.width / 8;
    this.radiusDelta = ops?.radiusDelta ?? 0;
    this.xOff = ops?.xOff ?? this.radius * 2;
    this.mutator = ops?.mutator ?? (() => void 0);

    this.geometries = [];
    for (let i = 0; i < this.arcs; i++) {
      const geometry = this.deriveGeometry(
        this.radius - i * this.radiusDelta * this.radius,
        this.xOff
      );
      this.geometries.push(geometry);
    }
  }

  // #region Methods

  // Capture the parent version of overridden methods
  parentDraw = this.draw;

  /**
   * Sets one or more configurable properties of this Animautomaton.
   *
   * @param ops An object containing one or more valid {LemniscateOps} properties.
   */
  setOps = (ops: Partial<LemniscateOps>) => {
    const thisOps: LemniscateOps = this; // Widen this
    // Switch to generics
    (Object.keys(ops) as readonly (keyof LemniscateOps)[]).forEach(
      <K extends keyof LemniscateOps>(key: K) => {
        const option = ops[key];
        if (option !== undefined) {
          thisOps[key] = option;
        }
      }
    );
  };

  /**
   * Calculates helpful geomtric information for rendering the lemniscate shape
   * @param radius Radius of both "circles" in the shape
   * @param xOff Distance from midpoint to the centre of each circle
   */
  deriveGeometry(radius: number, xOff: number): LemniscateGeometry {
    const r = radius * radius;
    const a = xOff * xOff;
    const k = Math.sqrt(r / (a - r));
    const k_orthogonal = -1 / k;
    const k_sq = k * k;
    const b = 4 * a - 4 * (k_sq + 1) * (a - r);
    const x_tan = (2 * xOff - Math.sqrt(b)) / (2 * (k_sq + 1));
    const y_tan = k * x_tan;
    const tangent_point = { x: x_tan, y: y_tan }; // absolute values of the points on the circles where the tangent passes through the origin
    const dist_tan = Math.sqrt(x_tan * x_tan + y_tan * y_tan);
    const theta = Math.PI / 2 - Math.atan(y_tan / x_tan);
    const arc_proportion = theta / Math.PI;
    const arc_theta = 2 * Math.PI - theta * 2;
    const c = radius * 2 * Math.PI;
    const dist_arc = arc_proportion * c;
    const alt_dist_tan = dist_tan * 0.5;
    const alt_dist_arc = dist_arc;
    const d =
      alt_dist_tan +
      alt_dist_arc +
      alt_dist_tan * 2 +
      alt_dist_arc +
      alt_dist_tan; // Total distance
    const checkpoints = [
      0,
      alt_dist_tan / d,
      (alt_dist_tan + alt_dist_arc / 2) / d,
      (alt_dist_tan + alt_dist_arc) / d,
      (alt_dist_tan + alt_dist_arc + alt_dist_tan) / d,
      (alt_dist_tan + alt_dist_arc + alt_dist_tan * 2) / d,
      (alt_dist_tan + alt_dist_arc + alt_dist_tan * 2 + alt_dist_arc / 2) / d,
      (alt_dist_tan + alt_dist_arc + alt_dist_tan * 2 + alt_dist_arc) / d,
      (alt_dist_tan +
        alt_dist_arc +
        alt_dist_tan * 2 +
        alt_dist_arc +
        alt_dist_tan) /
        d,
      1,
    ];
    return {
      k: k,
      k_orthogonal: k_orthogonal,
      tangent_point: tangent_point,
      theta: theta,
      arc_theta: arc_theta,
      checkpoints: checkpoints,
    };
  }

  /**
   * This function is called every {mutationInterval} * {cycleDuration_ms} milliseconds.
   * Used for mutating the animation over time (e.g. between loops).
   */
  mutate = () => {
    this.mutator(this);
  };

  /**
   * Uses this.context to draw the current frame of the animation, as determined by
   * this.currProgress. Called by this.animate.
   */
  draw = () => {
    this.parentDraw();
    // this.drawPath(); // The path that the arcs travel along
    for (let i = 0; i < this.arcs; i++) {
      this.drawArc(i);
    }
  };

  /**
   * Draws the ith arc.
   */
  drawArc = (arc_i: number) => {
    const leadProgress = this.getProgress(this.arcDelay * arc_i);
    const tailProgress = this.getProgress(
      this.arcDelay * arc_i - this.tailDelay
    );

    this.ctxSetColour(this.arcs - arc_i - 1);

    this.context.beginPath();

    /**
     * Path is drawn in the following order:
     *  - Tail (inner -> end line -> outer)
     *  - Middle sections, if present (outer line)
     *  - Lead (outer -> start line -> inner)
     *  - Middle sections, if present (inner line)
     *
     * Each arc must be a single continuous path to avoid internal aliasing.
     * */

    const points = this.arcPoints(arc_i);
    const leadSection = this.getSection(leadProgress, arc_i);
    const tailSection = this.getSection(tailProgress, arc_i);

    // First, handle the easy case where the arc is contained in a single section

    const contained = tailSection == leadSection && leadProgress > tailProgress;

    if (contained) {
      this.drawSection(tailSection, "contained", points, arc_i);
      this.ctxDraw();
      return;
    }

    // Drat, the arc is in more than 1 section, so drawing is more complicated

    // Start drawing with the tail
    let currSection = tailSection;
    const nSections = this.geometries[arc_i].checkpoints.length - 2;
    let hasDrawnLead = false;
    let hasDrawnTail = false;

    for (let j = 0; j < 1000; j++) {
      // 1000 is some upper bound on the number of section drawing steps
      if (currSection == tailSection && hasDrawnLead) {
        // If we're back in the tail and we've already drawn the lead, then we're done
        break;
      } else if (currSection == tailSection && !hasDrawnTail) {
        // Drawing the tail
        this.drawSection(currSection, "tail", points, arc_i);
        hasDrawnTail = true;
      } else if (currSection == leadSection) {
        // Drawing the lead
        this.drawSection(currSection, "lead", points, arc_i);
        hasDrawnLead = true;
      } else {
        // This is neither the tail, nor lead, so it is a middle section
        if (hasDrawnLead) {
          this.drawSection(currSection, "inner-mid", points, arc_i);
        } else {
          this.drawSection(currSection, "outer-mid", points, arc_i);
        }
      }
      // Go forwards if we haven't drawn the lead yet, backwards otherwise
      currSection = hasDrawnLead
        ? (currSection + (nSections - 1)) % nSections
        : (currSection + 1) % nSections;
    }
    this.ctxDraw();
  };

  /**
   * Draws the path the arc will travel along.
   */
  drawPath = () => {
    // Origin
    this.ctxSetColour(-1);
    this.context.beginPath();
    this.context.arc(this.origin.x, this.origin.y, 1, 0, 2 * Math.PI);
    this.context.stroke();

    // Circles
    this.ctxSetColour(0);
    this.context.beginPath();
    this.context.arc(
      this.origin.x + this.xOff,
      this.origin.y,
      this.radius,
      0,
      2 * Math.PI
    );
    this.context.stroke();
    this.context.beginPath();
    this.context.arc(
      this.origin.x - this.xOff,
      this.origin.y,
      this.radius,
      0,
      2 * Math.PI
    );
    this.context.stroke();

    // Connecting lines
    const r = this.radius * this.radius;
    const a = this.xOff * this.xOff;
    const slope_1 = Math.sqrt(r / (a - r));
    const slope_1_sq = slope_1 * slope_1;
    const b = 4 * a - 4 * (slope_1_sq + 1) * (a - r);
    const x = (2 * this.xOff - Math.sqrt(b)) / (2 * (slope_1_sq + 1));
    const endpoint_1 = { x: x, y: slope_1 * x };
    const endpoint_2 = { x: x, y: slope_1 * x * -1 };
    this.ctxSetColour(3);
    this.context.beginPath();
    this.context.moveTo(this.origin.x, this.origin.y);
    this.context.lineTo(
      this.origin.x + endpoint_1.x,
      this.origin.y + endpoint_1.y
    );
    this.context.stroke();
    this.ctxSetColour(4);
    this.context.beginPath();
    this.context.moveTo(this.origin.x, this.origin.y);
    this.context.lineTo(
      this.origin.x - endpoint_1.x,
      this.origin.y - endpoint_1.y
    );
    this.context.stroke();
    this.ctxSetColour(6);
    this.context.beginPath();
    this.context.moveTo(this.origin.x, this.origin.y);
    this.context.lineTo(
      this.origin.x + endpoint_2.x,
      this.origin.y + endpoint_2.y
    );
    this.context.stroke();
    this.context.beginPath();
    this.context.moveTo(this.origin.x, this.origin.y);
    this.context.lineTo(
      this.origin.x - endpoint_2.x,
      this.origin.y - endpoint_2.y
    );
    this.context.stroke();
  };

  /**
   * Calculates the necessary positions for the ith arc in the animation.
   * @param i
   * @returns outer_lead, mid_lead, inner_lead, outer_tail, mid_tail, inner_tail
   */
  arcPoints = (i: number): ArcPoints => {
    const leadProgress = this.getProgress(this.arcDelay * i);
    const tailProgress = this.getProgress(this.arcDelay * i - this.tailDelay);
    const lead = this.progressPosition(leadProgress, i);
    const tail = this.progressPosition(tailProgress, i);
    const points: ArcPoints = {
      lead: lead,
      tail: tail,
    };
    return points;
  };

  /**
   * Given a progress value, calculates the useful points that far along the animation's path
   * for the ith arc.
   *
   * @param prog A number between 0 and 1 representing the position along the path to get.
   * @param i The index of the arc.
   * @returns Outer, centre, and inner points for the given progress
   */
  progressPosition = (prog: number, i: number): ArcEndPoint => {
    let outer: Vector2 = { x: 0, y: 0 };
    let inner: Vector2 = { x: 0, y: 0 };
    let mid: Vector2 = { x: 0, y: 0 };
    const widthDiff = 1 - i * this.arcWidthDelta;
    const radius = this.radius - i * this.radiusDelta * this.radius;

    if (prog <= this.geometries[i].checkpoints[1]) {
      // Northwest line

      const section_progress = prog / this.geometries[i].checkpoints[1];
      const raw_mid_x =
        section_progress * this.geometries[i].tangent_point.x * -1;
      const raw_mid_y = raw_mid_x * this.geometries[i].k;
      const raw_mid = { x: raw_mid_x, y: raw_mid_y };
      const dist_x = Math.sqrt(
        (this.arcWidth * this.arcWidth) /
          (4 *
            (1 +
              this.geometries[i].k_orthogonal *
                this.geometries[i].k_orthogonal))
      );
      const dist_y = this.geometries[i].k_orthogonal * dist_x;
      outer = {
        x: this.origin.x + raw_mid.x + dist_x * widthDiff,
        y: this.origin.y + raw_mid.y + dist_y * widthDiff,
      };
      inner = {
        x: this.origin.x + raw_mid_x - dist_x * widthDiff,
        y: this.origin.y + raw_mid_y - dist_y * widthDiff,
      };
      mid = {
        x: this.origin.x + raw_mid_x,
        y: this.origin.y + raw_mid_y,
      };
    } else if (prog <= this.geometries[i].checkpoints[3]) {
      // Left Arc

      const section_progress =
        (prog - this.geometries[i].checkpoints[1]) /
        (this.geometries[i].checkpoints[3] - this.geometries[i].checkpoints[1]);
      const lead_theta =
        this.geometries[i].theta +
        section_progress * this.geometries[i].arc_theta;
      mid = {
        x: this.origin.x + Math.cos(lead_theta) * radius - this.xOff,
        y: this.origin.y + Math.sin(lead_theta) * radius * -1,
      };
      outer = {
        x:
          this.origin.x +
          Math.cos(lead_theta) * (radius + (this.arcWidth / 2) * widthDiff) -
          this.xOff,
        y:
          this.origin.y +
          Math.sin(lead_theta) *
            (radius + (this.arcWidth / 2) * widthDiff) *
            -1,
      };
      inner = {
        x:
          this.origin.x +
          Math.cos(lead_theta) * (radius - (this.arcWidth / 2) * widthDiff) -
          this.xOff,
        y:
          this.origin.y +
          Math.sin(lead_theta) *
            (radius - (this.arcWidth / 2) * widthDiff) *
            -1,
      };
    } else if (prog < this.geometries[i].checkpoints[4]) {
      // Southwest line

      const section_progress =
        (prog - this.geometries[i].checkpoints[3]) /
        (this.geometries[i].checkpoints[4] - this.geometries[i].checkpoints[3]);
      const raw_mid_x =
        -1 * this.geometries[i].tangent_point.x +
        section_progress * this.geometries[i].tangent_point.x;
      const raw_mid_y = raw_mid_x * this.geometries[i].k * -1;
      const raw_mid = { x: raw_mid_x, y: raw_mid_y };
      const dist_x = Math.sqrt(
        (this.arcWidth * this.arcWidth) /
          (4 *
            (1 +
              this.geometries[i].k_orthogonal *
                this.geometries[i].k_orthogonal))
      );
      const dist_y = dist_x * this.geometries[i].k_orthogonal * -1;
      outer = {
        x: this.origin.x + raw_mid.x + dist_x * widthDiff,
        y: this.origin.y + raw_mid.y + dist_y * widthDiff,
      };
      inner = {
        x: this.origin.x + raw_mid_x - dist_x * widthDiff,
        y: this.origin.y + raw_mid_y - dist_y * widthDiff,
      };
      mid = {
        x: this.origin.x + raw_mid_x,
        y: this.origin.y + raw_mid_y,
      };
    } else if (prog <= this.geometries[i].checkpoints[5]) {
      // Northeast Line

      const section_progress =
        (prog - this.geometries[i].checkpoints[4]) /
        (this.geometries[i].checkpoints[5] - this.geometries[i].checkpoints[4]);
      const raw_mid_x = section_progress * this.geometries[i].tangent_point.x;
      const raw_mid_y = raw_mid_x * this.geometries[i].k * -1;
      const raw_mid = { x: raw_mid_x, y: raw_mid_y };
      const dist_x = Math.sqrt(
        (this.arcWidth * this.arcWidth) /
          (4 *
            (1 +
              this.geometries[i].k_orthogonal *
                this.geometries[i].k_orthogonal))
      );
      const dist_y = dist_x * this.geometries[i].k_orthogonal * -1;
      inner = {
        x: this.origin.x + raw_mid.x - dist_x * widthDiff,
        y: this.origin.y + raw_mid.y - dist_y * widthDiff,
      };
      outer = {
        x: this.origin.x + raw_mid_x + dist_x * widthDiff,
        y: this.origin.y + raw_mid_y + dist_y * widthDiff,
      };
      mid = {
        x: this.origin.x + raw_mid_x,
        y: this.origin.y + raw_mid_y,
      };
    } else if (prog <= this.geometries[i].checkpoints[7]) {
      // Right Arc

      const section_progress =
        (prog - this.geometries[i].checkpoints[5]) /
        (this.geometries[i].checkpoints[7] - this.geometries[i].checkpoints[5]);
      const lead_theta =
        this.geometries[i].theta +
        section_progress * this.geometries[i].arc_theta;
      mid = {
        x: this.origin.x + -1 * Math.cos(lead_theta) * radius + this.xOff,
        y: this.origin.y + Math.sin(lead_theta) * radius * -1,
      };
      inner = {
        x:
          this.origin.x +
          -1 *
            Math.cos(lead_theta) *
            (radius + (this.arcWidth / 2) * widthDiff) +
          this.xOff,
        y:
          this.origin.y +
          Math.sin(lead_theta) *
            (radius + (this.arcWidth / 2) * widthDiff) *
            -1,
      };
      outer = {
        x:
          this.origin.x +
          -1 *
            Math.cos(lead_theta) *
            (radius - (this.arcWidth / 2) * widthDiff) +
          this.xOff,
        y:
          this.origin.y +
          Math.sin(lead_theta) *
            (radius - (this.arcWidth / 2) * widthDiff) *
            -1,
      };
    } else {
      // Southeast Line

      const section_progress =
        (prog - this.geometries[i].checkpoints[7]) /
        (this.geometries[i].checkpoints[8] - this.geometries[i].checkpoints[7]);
      const raw_mid_x =
        this.geometries[i].tangent_point.x -
        section_progress * this.geometries[i].tangent_point.x;
      const raw_mid_y = raw_mid_x * this.geometries[i].k;
      const raw_mid = { x: raw_mid_x, y: raw_mid_y };
      const dist_x = Math.sqrt(
        (this.arcWidth * this.arcWidth) /
          (4 *
            (1 +
              this.geometries[i].k_orthogonal *
                this.geometries[i].k_orthogonal))
      );
      const dist_y = this.geometries[i].k_orthogonal * dist_x;
      inner = {
        x: this.origin.x + raw_mid.x + dist_x * widthDiff,
        y: this.origin.y + raw_mid.y + dist_y * widthDiff,
      };
      outer = {
        x: this.origin.x + raw_mid_x - dist_x * widthDiff,
        y: this.origin.y + raw_mid_y - dist_y * widthDiff,
      };
      mid = {
        x: this.origin.x + raw_mid_x,
        y: this.origin.y + raw_mid_y,
      };
    }
    return {
      outer: outer,
      inner: inner,
      mid: mid,
    };
  };

  /**
   * @param prog A number between 0 and 1.
   * @param arc_i The index of the arc whose geometry we're interested in.
   * @returns The animation section corresponding to the progress value, or -1 on failure.
   */
  getSection = (prog: number, arc_i: number): number => {
    for (let i = 0; i < this.geometries[arc_i].checkpoints.length + 1; i++) {
      if (
        prog > this.geometries[arc_i].checkpoints[i] &&
        prog <= this.geometries[arc_i].checkpoints[i + 1]
      ) {
        return i;
      }
    }
    return -1;
  };

  drawSection = (
    section: number,
    order: DrawOrder,
    points: ArcPoints,
    arc_i: number
  ) => {
    switch (section) {
      case 0:
        this.draw_NW_Line(order, points, arc_i);
        break;
      case 1:
        this.draw_NW_Arc(order, points, arc_i);
        break;
      case 2:
        this.draw_SW_Arc(order, points, arc_i);
        break;
      case 3:
        this.draw_SW_Line(order, points, arc_i);
        break;
      case 4:
        this.draw_NE_Line(order, points, arc_i);
        break;
      case 5:
        this.draw_NE_Arc(order, points, arc_i);
        break;
      case 6:
        this.draw_SE_Arc(order, points, arc_i);
        break;
      case 7:
        this.draw_SE_Line(order, points, arc_i);
        break;
      default:
        console.error("Tried to draw invalid section number: " + section);
        break;
    }
  };

  draw_NW_Line = (order: DrawOrder, points: ArcPoints, arc_i: number) => {
    // console.log(`Drawing section 0: ${order}`);
    const lowerBoundPoint = this.progressPosition(
      this.geometries[arc_i].checkpoints[0],
      arc_i
    );
    const upperBoundPoint = this.progressPosition(
      this.geometries[arc_i].checkpoints[1],
      arc_i
    );
    switch (order) {
      case "contained":
        this.ctxMoveToVector(points.tail.inner);
        this.ctxLineToVector(points.tail.outer);
        this.ctxLineToVector(points.lead.outer);
        this.ctxLineToVector(points.lead.inner);
        this.ctxLineToVector(points.tail.inner);
        break;
      case "tail":
        this.ctxMoveToVector(upperBoundPoint.inner);
        this.ctxLineToVector(points.tail.inner);
        this.ctxLineToVector(points.tail.outer);
        this.ctxLineToVector(upperBoundPoint.outer);
        break;
      case "outer-mid":
        this.ctxLineToVector(upperBoundPoint.outer);
        break;
      case "lead":
        this.ctxLineToVector(points.lead.outer);
        this.ctxLineToVector(points.lead.inner);
        this.ctxLineToVector(lowerBoundPoint.inner);
        break;
      case "inner-mid":
        this.ctxLineToVector(lowerBoundPoint.inner);
        break;
      default:
        console.error("Tried to draw section with invalid order: " + order);
    }
  };

  draw_NW_Arc = (order: DrawOrder, points: ArcPoints, arc_i: number) => {
    // console.log(`Drawing section 1: ${order}`);
    const lowerBoundPoint = this.progressPosition(
      this.geometries[arc_i].checkpoints[1],
      arc_i
    );
    const upperBoundPoint = this.progressPosition(
      this.geometries[arc_i].checkpoints[2],
      arc_i
    );
    const offset = { x: this.origin.x - this.xOff, y: this.origin.y };
    switch (order) {
      case "contained":
        this.ctxMoveToVector(points.tail.inner);
        this.ctxLineToVector(points.tail.outer);
        this.ctxCircToVector(points.tail.outer, points.lead.outer, offset);
        this.ctxLineToVector(points.lead.inner);
        this.ctxCircToVector(points.lead.inner, points.tail.inner, offset);
        break;
      case "tail":
        this.ctxMoveToVector(upperBoundPoint.inner);
        this.ctxCircToVector(upperBoundPoint.inner, points.tail.inner, offset);
        this.ctxLineToVector(points.tail.outer);
        this.ctxCircToVector(points.tail.outer, upperBoundPoint.outer, offset);
        break;
      case "outer-mid":
        this.ctxCircToVector(
          lowerBoundPoint.outer,
          upperBoundPoint.outer,
          offset
        );
        break;
      case "lead":
        this.ctxCircToVector(lowerBoundPoint.outer, points.lead.outer, offset);
        this.ctxLineToVector(points.lead.inner);
        this.ctxCircToVector(points.lead.inner, lowerBoundPoint.inner, offset);
        break;
      case "inner-mid":
        this.ctxCircToVector(
          upperBoundPoint.inner,
          lowerBoundPoint.inner,
          offset
        );
        break;
      default:
        console.error("Tried to draw section with invalid order: " + order);
    }
  };

  draw_SW_Arc = (order: DrawOrder, points: ArcPoints, arc_i: number) => {
    // console.log(`Drawing section 2: ${order}`);
    const lowerBoundPoint = this.progressPosition(
      this.geometries[arc_i].checkpoints[2],
      arc_i
    );
    const upperBoundPoint = this.progressPosition(
      this.geometries[arc_i].checkpoints[3],
      arc_i
    );
    const offset = { x: this.origin.x - this.xOff, y: this.origin.y };
    switch (order) {
      case "contained":
        this.ctxMoveToVector(points.tail.inner);
        this.ctxLineToVector(points.tail.outer);
        this.ctxCircToVector(points.tail.outer, points.lead.outer, offset);
        this.ctxLineToVector(points.lead.inner);
        this.ctxCircToVector(points.lead.inner, points.tail.inner, offset);
        break;
      case "tail":
        this.ctxMoveToVector(upperBoundPoint.inner);
        this.ctxCircToVector(upperBoundPoint.inner, points.tail.inner, offset);
        this.ctxLineToVector(points.tail.outer);
        this.ctxCircToVector(points.tail.outer, upperBoundPoint.outer, offset);
        break;
      case "outer-mid":
        this.ctxCircToVector(
          lowerBoundPoint.outer,
          upperBoundPoint.outer,
          offset
        );
        break;
      case "lead":
        this.ctxCircToVector(lowerBoundPoint.outer, points.lead.outer, offset);
        this.ctxLineToVector(points.lead.inner);
        this.ctxCircToVector(points.lead.inner, lowerBoundPoint.inner, offset);
        break;
      case "inner-mid":
        this.ctxCircToVector(
          upperBoundPoint.inner,
          lowerBoundPoint.inner,
          offset
        );
        break;
      default:
        console.error("Tried to draw section with invalid order: " + order);
    }
  };

  draw_SW_Line = (order: DrawOrder, points: ArcPoints, arc_i: number) => {
    // console.log(`Drawing section 3: ${order}`);
    const lowerBoundPoint = this.progressPosition(
      this.geometries[arc_i].checkpoints[3],
      arc_i
    );
    const upperBoundPoint = this.progressPosition(
      this.geometries[arc_i].checkpoints[4],
      arc_i
    );
    switch (order) {
      case "contained":
        this.ctxMoveToVector(points.tail.inner);
        this.ctxLineToVector(points.tail.outer);
        this.ctxLineToVector(points.lead.outer);
        this.ctxLineToVector(points.lead.inner);
        this.ctxLineToVector(points.tail.inner);
        break;
      case "tail":
        this.ctxMoveToVector(upperBoundPoint.inner);
        this.ctxLineToVector(points.tail.inner);
        this.ctxLineToVector(points.tail.outer);
        this.ctxLineToVector(upperBoundPoint.outer);
        break;
      case "outer-mid":
        this.ctxLineToVector(upperBoundPoint.outer);
        break;
      case "lead":
        this.ctxLineToVector(points.lead.outer);
        this.ctxLineToVector(points.lead.inner);
        this.ctxLineToVector(lowerBoundPoint.inner);
        break;
      case "inner-mid":
        this.ctxLineToVector(lowerBoundPoint.inner);
        break;
      default:
        console.error("Tried to draw section with invalid order: " + order);
    }
  };

  draw_NE_Line = (order: DrawOrder, points: ArcPoints, arc_i: number) => {
    // console.log(`Drawing section 4: ${order}`);
    const lowerBoundPoint = this.progressPosition(
      this.geometries[arc_i].checkpoints[4],
      arc_i
    );
    const upperBoundPoint = this.progressPosition(
      this.geometries[arc_i].checkpoints[5],
      arc_i
    );
    switch (order) {
      case "contained":
        this.ctxMoveToVector(points.tail.inner);
        this.ctxLineToVector(points.tail.outer);
        this.ctxLineToVector(points.lead.outer);
        this.ctxLineToVector(points.lead.inner);
        this.ctxLineToVector(points.tail.inner);
        break;
      case "tail":
        this.ctxMoveToVector(upperBoundPoint.inner);
        this.ctxLineToVector(points.tail.inner);
        this.ctxLineToVector(points.tail.outer);
        this.ctxLineToVector(upperBoundPoint.outer);
        break;
      case "outer-mid":
        this.ctxLineToVector(upperBoundPoint.outer);
        break;
      case "lead":
        this.ctxLineToVector(points.lead.outer);
        this.ctxLineToVector(points.lead.inner);
        this.ctxLineToVector(lowerBoundPoint.inner);
        break;
      case "inner-mid":
        this.ctxLineToVector(lowerBoundPoint.inner);
        break;
      default:
        console.error("Tried to draw section with invalid order: " + order);
    }
  };

  draw_NE_Arc = (order: DrawOrder, points: ArcPoints, arc_i: number) => {
    // console.log(`Drawing section 5: ${order}`);
    const lowerBoundPoint = this.progressPosition(
      this.geometries[arc_i].checkpoints[5],
      arc_i
    );
    const upperBoundPoint = this.progressPosition(
      this.geometries[arc_i].checkpoints[6],
      arc_i
    );
    const offset = { x: this.origin.x + this.xOff, y: this.origin.y };
    switch (order) {
      case "contained":
        this.ctxMoveToVector(points.tail.inner);
        this.ctxLineToVector(points.tail.outer);
        this.ctxCircToVector(points.tail.outer, points.lead.outer, offset);
        this.ctxLineToVector(points.lead.inner);
        this.ctxCircToVector(points.lead.inner, points.tail.inner, offset);
        break;
      case "tail":
        this.ctxMoveToVector(upperBoundPoint.inner);
        this.ctxCircToVector(upperBoundPoint.inner, points.tail.inner, offset);
        this.ctxLineToVector(points.tail.outer);
        this.ctxCircToVector(points.tail.outer, upperBoundPoint.outer, offset);
        break;
      case "outer-mid":
        this.ctxCircToVector(
          lowerBoundPoint.outer,
          upperBoundPoint.outer,
          offset
        );
        break;
      case "lead":
        this.ctxCircToVector(lowerBoundPoint.outer, points.lead.outer, offset);
        this.ctxLineToVector(points.lead.inner);
        this.ctxCircToVector(points.lead.inner, lowerBoundPoint.inner, offset);
        break;
      case "inner-mid":
        this.ctxCircToVector(
          upperBoundPoint.inner,
          lowerBoundPoint.inner,
          offset
        );
        break;
      default:
        console.error("Tried to draw section with invalid order: " + order);
    }
  };

  draw_SE_Arc = (order: DrawOrder, points: ArcPoints, arc_i: number) => {
    // console.log(`Drawing section 6: ${order}`);
    const lowerBoundPoint = this.progressPosition(
      this.geometries[arc_i].checkpoints[6],
      arc_i
    );
    const upperBoundPoint = this.progressPosition(
      this.geometries[arc_i].checkpoints[7],
      arc_i
    );
    const offset = { x: this.origin.x + this.xOff, y: this.origin.y };
    switch (order) {
      case "contained":
        this.ctxMoveToVector(points.tail.inner);
        this.ctxLineToVector(points.tail.outer);
        this.ctxCircToVector(points.tail.outer, points.lead.outer, offset);
        this.ctxLineToVector(points.lead.inner);
        this.ctxCircToVector(points.lead.inner, points.tail.inner, offset);
        break;
      case "tail":
        this.ctxMoveToVector(upperBoundPoint.inner);
        this.ctxCircToVector(upperBoundPoint.inner, points.tail.inner, offset);
        this.ctxLineToVector(points.tail.outer);
        this.ctxCircToVector(points.tail.outer, upperBoundPoint.outer, offset);
        break;
      case "outer-mid":
        this.ctxCircToVector(
          lowerBoundPoint.outer,
          upperBoundPoint.outer,
          offset
        );
        break;
      case "lead":
        this.ctxCircToVector(lowerBoundPoint.outer, points.lead.outer, offset);
        this.ctxLineToVector(points.lead.inner);
        this.ctxCircToVector(points.lead.inner, lowerBoundPoint.inner, offset);
        break;
      case "inner-mid":
        this.ctxCircToVector(
          upperBoundPoint.inner,
          lowerBoundPoint.inner,
          offset
        );
        break;
      default:
        console.error("Tried to draw section with invalid order: " + order);
    }
  };

  draw_SE_Line = (order: DrawOrder, points: ArcPoints, arc_i: number) => {
    // console.log(`Drawing section 7: ${order}`);
    const lowerBoundPoint = this.progressPosition(
      this.geometries[arc_i].checkpoints[7],
      arc_i
    );
    const upperBoundPoint = this.progressPosition(
      this.geometries[arc_i].checkpoints[8],
      arc_i
    );
    switch (order) {
      case "contained":
        this.ctxMoveToVector(points.tail.inner);
        this.ctxLineToVector(points.tail.outer);
        this.ctxLineToVector(points.lead.outer);
        this.ctxLineToVector(points.lead.inner);
        this.ctxLineToVector(points.tail.inner);
        break;
      case "tail":
        this.ctxMoveToVector(upperBoundPoint.inner);
        this.ctxLineToVector(points.tail.inner);
        this.ctxLineToVector(points.tail.outer);
        this.ctxLineToVector(upperBoundPoint.outer);
        this.ctxMoveToVector(upperBoundPoint.inner);
        break;
      case "outer-mid":
        this.ctxLineToVector(upperBoundPoint.inner);
        break;
      case "lead":
        this.ctxLineToVector(points.lead.inner);
        this.ctxLineToVector(points.lead.outer);
        this.ctxLineToVector(lowerBoundPoint.inner);
        break;
      case "inner-mid":
        this.ctxLineToVector(lowerBoundPoint.inner);
        break;
      default:
        console.error("Tried to draw section with invalid order: " + order);
    }
  };
}
