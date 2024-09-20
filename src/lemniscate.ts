
import Animautomaton from "./animautomaton";
import { LemniscateOps, Vector2 } from "./types";

const DrawOrders = [
  "tail",
  "outer-mid",
  "lead",
  "inner-mid",
  "contained",
] as const;
type DrawOrder = (typeof DrawOrders)[number];

type ArcEndPoint = {
  outer: Vector2;
  mid: Vector2;
  inner: Vector2;
};

type ArcPoints = {
  lead: ArcEndPoint;
  tail: ArcEndPoint;
};

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

class Lemniscate extends Animautomaton {
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

    this.drawPath = this.drawPath.bind(this);
    this.drawArc = this.drawArc.bind(this);
    this.arcPoints = this.arcPoints.bind(this);
    this.progressPosition = this.progressPosition.bind(this);
    this.getSection = this.getSection.bind(this);
    this.drawSection = this.drawSection.bind(this);
    this.drawSection_0 = this.drawSection_0.bind(this);
    this.drawSection_1 = this.drawSection_1.bind(this);
    this.drawSection_2 = this.drawSection_2.bind(this);
    this.drawSection_3 = this.drawSection_3.bind(this);
    this.drawSection_4 = this.drawSection_4.bind(this);
    this.drawSection_5 = this.drawSection_5.bind(this);
    this.drawSection_6 = this.drawSection_6.bind(this);
    this.drawSection_7 = this.drawSection_7.bind(this);
  }

  // #region Methods

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
  mutate() {
    this.mutator(this);
  }

  /**
   * Uses this.context to draw the current frame of the animation, as determined by
   * this.currProgress. Called by this.animate.
   */
  draw() {
    super.draw();
    // this.drawPath(); // The path that the arcs travel along
    for (let i = 0; i < this.arcs; i++) {
      this.drawArc(i);
    }
  }

  /**
   * Draws the ith arc.
   */
  drawArc(arc_i: number) {
    const progress_lead = this.getProgress(this.arcDelay * arc_i);
    const progress_tail = this.getProgress(
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
    const lead_section = this.getSection(progress_lead, arc_i);
    const tail_section = this.getSection(progress_tail, arc_i);

    // First, handle the easy case where the arc is contained in a single section

    const contained =
      tail_section == lead_section && progress_lead > progress_tail;

    if (contained) {
      this.drawSection(tail_section, "contained", points, arc_i);
      this.ctxDraw();
      return;
    }

    // Drat, the arc is in more than 1 section, so drawing is more complicated

    // Start drawing with the tail
    let curr_section = tail_section;
    const nSections = this.geometries[arc_i].checkpoints.length - 2;
    let has_drawn_lead = false;
    let has_drawn_tail = false;

    for (let j = 0; j < 1000; j++) {
      // 1000 is some upper bound on the number of section drawing steps
      if (curr_section == tail_section && has_drawn_lead) {
        // If we're back in the tail and we've already drawn the lead, then we're done
        break;
      } else if (curr_section == tail_section && !has_drawn_tail) {
        // Drawing the tail
        this.drawSection(curr_section, "tail", points, arc_i);
        has_drawn_tail = true;
      } else if (curr_section == lead_section) {
        // Drawing the lead
        this.drawSection(curr_section, "lead", points, arc_i);
        has_drawn_lead = true;
      } else {
        // This is neither the tail, nor lead, so it is a middle section
        if (has_drawn_lead) {
          this.drawSection(curr_section, "inner-mid", points, arc_i);
        } else {
          this.drawSection(curr_section, "outer-mid", points, arc_i);
        }
      }
      // Go forwards if we haven't drawn the lead yet, backwards otherwise
      curr_section = has_drawn_lead
        ? (curr_section + (nSections - 1)) % nSections
        : (curr_section + 1) % nSections;
    }
    this.ctxDraw();
  }

  /**
   * Draws the path the arc will travel along.
   */
  drawPath() {
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
  }

  /**
   * Calculates the necessary positions for the ith arc in the animation.
   * @param i
   * @returns outer_lead, mid_lead, inner_lead, outer_tail, mid_tail, inner_tail
   */
  arcPoints(i: number): ArcPoints {
    const progress_lead = this.getProgress(this.arcDelay * i);
    const progress_tail = this.getProgress(this.arcDelay * i - this.tailDelay);
    const lead = this.progressPosition(progress_lead, i);
    const tail = this.progressPosition(progress_tail, i);
    const points: ArcPoints = {
      lead: lead,
      tail: tail,
    };
    return points;
  }

  /**
   * Given a progress value, calculates the useful points that far along the animation's path
   * for the ith arc.
   *
   * @param prog A number between 0 and 1 representing the position along the path to get.
   * @param i The index of the arc.
   * @returns Outer, centre, and inner points for the given progress
   */
  progressPosition(prog: number, i: number): ArcEndPoint {
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
  }

  /**
   * @param prog A number between 0 and 1.
   * @param arc_i The index of the arc whose geometry we're interested in.
   * @returns The animation section corresponding to the progress value, or -1 on failure.
   */
  getSection(prog: number, arc_i: number): number {
    for (let i = 0; i < this.geometries[arc_i].checkpoints.length + 1; i++) {
      if (
        prog > this.geometries[arc_i].checkpoints[i] &&
        prog <= this.geometries[arc_i].checkpoints[i + 1]
      ) {
        return i;
      }
    }
    return -1;
  }

  drawSection(section: number, order: DrawOrder, points: ArcPoints, i: number) {
    switch (section) {
      case 0:
        this.drawSection_0(order, points, i);
        break;
      case 1:
        this.drawSection_1(order, points, i);
        break;
      case 2:
        this.drawSection_2(order, points, i);
        break;
      case 3:
        this.drawSection_3(order, points, i);
        break;
      case 4:
        this.drawSection_4(order, points, i);
        break;
      case 5:
        this.drawSection_5(order, points, i);
        break;
      case 6:
        this.drawSection_6(order, points, i);
        break;
      case 7:
        this.drawSection_7(order, points, i);
        break;
      default:
        console.error("Tried to draw invalid section number: " + section);
        break;
    }
  }
  drawSection_0(order: DrawOrder, points: ArcPoints, arc_i: number) {
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
  }
  drawSection_1(order: DrawOrder, points: ArcPoints, arc_i: number) {
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
  }
  drawSection_2(order: DrawOrder, points: ArcPoints, arc_i: number) {
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
  }
  drawSection_3(order: DrawOrder, points: ArcPoints, arc_i: number) {
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
  }
  drawSection_4(order: DrawOrder, points: ArcPoints, arc_i: number) {
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
  }
  drawSection_5(order: DrawOrder, points: ArcPoints, arc_i: number) {
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
  }
  drawSection_6(order: DrawOrder, points: ArcPoints, arc_i: number) {
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
  }
  drawSection_7(order: DrawOrder, points: ArcPoints, arc_i: number) {
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
  }
}

export default Lemniscate;