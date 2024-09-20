import { AnimautomatonOps, Anchor, Border, Linecap, Animautomaton } from "./animautomata";
import { modulo } from "./utils";


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

export class Antiquum extends Animautomaton {
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
   * Only has an effect with multiple arcs. Each arc will be this much (proportional to primary arcWidth)
   * narrower than the previous.
   *
   * Can be set to a negative value to make successive arcs larger.
   */
  arcWidthDelta: number;

  /**
   * Determines where arcs of differing width will align.
   */
  arcAnchor: Anchor;

  /**
   * A value between 0 and 1 indicating what percentage behind in the loop the arc's tail (endpoint) will
   * be compared to its lead (starting point) at all times.
   */
  tailDelay: number;

  /**
   * A value between 0 and 1 indicating what percentage behind in the loop each successive arc will be.
   *
   * Only has an effect with multiple arcs.
   */
  arcDelay: number;

  /**
   * Radius of the circle that the centre of the arcs will travel along, in pixels.
   */
  radius: number;

  /**
   * Only has an effect with multiple arcs. Each arc will travel along a path with radius this
   * much less (proportional to primary radius).
   *
   * Can be set to a negative value to make successive arcs travel along a path with greater radius.
   */
  radiusDelta: number;

  /**
   * The number of rotations the circular path will make in a single loop *as* the arcs travel around it.
   *
   * Note: This can be set to a non-integer value (e.g. 1.5) but this will result in the animation not
   * necessarily repeating exactly every loop.
   */
  rotations: number;

  /**
   * An optional function that modifies {this}, will be called every mutation interval.
   *
   * Can be used to procedurally change the animation properties (e.g. between loops).
   */
  mutator: (antiquum: Antiquum) => void;

  /**
   * If not null, defines the style of the inner circle.
   */
  innerBorder: Border | null;

  /**
   * If not null, defines the style of the outer circle.
   */
  outerBorder: Border | null;

  /**
   * If not null, the ring that the arcs travel along will have this background colour.
   */
  trackColour: string | null;

  /**
   * Determines the lead AND tail line cap appearance. Lower priority than leadCap and tailCap.
   */
  lineCap: Linecap;

  /**
   * Determines the lead line cap appearance. Overrides lineCap if not null.
   */
  leadCap: Linecap | null;

  /**
   * Determines the tail line cap appearance. Overrides lineCap if not null.
   */
  tailCap: Linecap | null;

  // #endregion

  // #region Constructor

  constructor(canvasId: string, ops?: Partial<AntiquumOps>) {
    super(canvasId, ops);
    this.arcs = ops?.arcs ?? 1;
    this.arcWidth = ops?.arcWidth ?? 10;
    this.arcWidthDelta = ops?.arcWidthDelta ?? 0;
    this.arcAnchor = ops?.arcAnchor ?? "centre";
    this.tailDelay = ops?.tailDelay ?? 0.1;
    this.arcDelay = ops?.arcDelay ?? 0.1;
    this.radius = ops?.radius ?? 50;
    this.radiusDelta = ops?.radiusDelta ?? 0;
    this.rotations = ops?.rotations ?? 1;
    this.mutator = ops?.mutator ?? (() => void 0);
    this.innerBorder = ops?.innerBorder ?? null;
    this.outerBorder = ops?.outerBorder ?? null;
    this.trackColour = ops?.trackColour ?? "";
    this.lineCap = ops?.lineCap ?? "flat";
    this.leadCap = ops?.leadCap ?? null;
    this.tailCap = ops?.tailCap ?? null;
  }

  // #endregion

  // #region Methods

  /**
   * This function is called every {mutationInterval} * {cycleDuration_ms} milliseconds.
   * Used for mutating the animation over time (e.g. between loops).
   */
  mutate() {
    this.mutator(this);
  }

  /**
   * @returns The number of rotations + partial rotations this animation has performed.
   */
  getAccumulatedRotation(): number {
    return (
      (this.currIteration + this.currProgress) * this.rotations * Math.PI * 2
    );
  }

  /**
   * Uses this.context to draw the current frame of the animation, as determined by
   * this.currProgress.
   *
   * Called by this.animate().
   */
  draw() {
    super.draw();
    const accumulatedRotation = this.getAccumulatedRotation();

    // Draw track underneath everything else (if present)
    if (this.trackColour) {
      this.context.beginPath();
      this.context.fillStyle = this.trackColour;
      this.context.arc(
        this.origin.x,
        this.origin.y,
        this.radius - 1, // One-off to avoid aliasing
        0,
        Math.PI * 2
      );
      this.context.arc(
        this.origin.x,
        this.origin.y,
        this.radius - this.arcWidth + 1, // One-off to avoid aliasing
        0,
        Math.PI * 2,
        true
      );
      this.context.fill();
    }

    // Arcs must be drawn back-to-front so the leading arc appears on top.
    for (let i = 0; i < this.arcs; i++) {
      // Calculate all the values for this shape
      const progress_lead = modulo(
        this.getProgress(this.arcDelay * i) * Math.PI * 2 + accumulatedRotation,
        Math.PI * 2
      );

      const progress_tail = modulo(
        this.getProgress(this.arcDelay * i - this.tailDelay) * Math.PI * 2 +
          accumulatedRotation,
        Math.PI * 2
      );

      const radius =
        this.radius - (this.arcs - (i + 1)) * this.radiusDelta * this.radius;

      const arcWidthDiff =
        (this.arcs - (i + 1)) * this.arcWidthDelta * this.arcWidth;

      let outerOffset, innerOffset, midOffset;
      if (this.arcAnchor == "centre") {
        outerOffset = radius - arcWidthDiff / 2;
        innerOffset = radius - this.arcWidth + arcWidthDiff / 2;
        midOffset =
          radius - arcWidthDiff / 2 - (this.arcWidth - arcWidthDiff) / 2;
      } else if (this.arcAnchor == "inner") {
        outerOffset = radius - arcWidthDiff;
        innerOffset = radius - this.arcWidth;
        midOffset = radius - arcWidthDiff - (this.arcWidth - arcWidthDiff) / 2;
      } else if (this.arcAnchor == "outer") {
        outerOffset = radius;
        innerOffset = radius - (this.arcWidth - arcWidthDiff);
        midOffset = radius - (this.arcWidth - arcWidthDiff) / 2;
      } else {
        throw new Error("Invalid arcAnchor value: " + this.arcAnchor);
      }
      outerOffset = Math.max(outerOffset, 0);
      innerOffset = Math.max(innerOffset, 0);
      midOffset = Math.max(midOffset, 0);

      // The distance to offset the guide point for rounded linecaps
      const guideDistance = (this.arcWidth - arcWidthDiff) / 2;

      /**
       * IMPORTANT: We split the circle into three 120deg sections because the circular bezier curve
       * degenerates at the semi-circle point.
       */

      // Determine which section the lead point of the arc is in
      let lead_section = -1;
      if (progress_lead < (2 * Math.PI) / 3) {
        lead_section = 0;
      } else if (progress_lead < (4 * Math.PI) / 3) {
        lead_section = 1;
      } else {
        lead_section = 2;
      }

      // Determine which section the tail point of the arc is in
      let tail_section = -1;
      if (progress_tail < (2 * Math.PI) / 3) {
        tail_section = 0;
      } else if (progress_tail < (4 * Math.PI) / 3) {
        tail_section = 1;
      } else {
        tail_section = 2;
      }

      // Calculate the position of the lead line
      const lead = {
        outer: {
          x: this.origin.x + outerOffset * Math.cos(progress_lead),
          y: this.origin.y + outerOffset * Math.sin(progress_lead),
        },
        inner: {
          x: this.origin.x + innerOffset * Math.cos(progress_lead),
          y: this.origin.y + innerOffset * Math.sin(progress_lead),
        },
        mid: {
          x: this.origin.x + midOffset * Math.cos(progress_lead),
          y: this.origin.y + midOffset * Math.sin(progress_lead),
        },
      };

      // Calculate the position of the lead guide point (for rounded line caps)
      const leadGuideDistance =
        progress_lead > Math.PI ? guideDistance : -guideDistance;
      const leadM = -1 / Math.tan(progress_lead);
      const leadV = { x: 1, y: leadM };
      const leadVMagnitude = Math.sqrt(
        Math.pow(leadV.x, 2) + Math.pow(leadV.y, 2)
      );
      const leadVNorm = {
        x: leadV.x / leadVMagnitude,
        y: leadV.y / leadVMagnitude,
      };

      const leadGuide = {
        x:
          this.origin.x +
          midOffset * Math.cos(progress_lead) +
          leadVNorm.x * leadGuideDistance,
        y:
          this.origin.y +
          midOffset * Math.sin(progress_lead) +
          leadVNorm.y * leadGuideDistance,
      };

      // Calculate the positions of the tail line
      const tail = {
        outer: {
          x: this.origin.x + outerOffset * Math.cos(progress_tail),
          y: this.origin.y + outerOffset * Math.sin(progress_tail),
        },
        inner: {
          x: this.origin.x + innerOffset * Math.cos(progress_tail),
          y: this.origin.y + innerOffset * Math.sin(progress_tail),
        },
        mid: {
          x: this.origin.x + midOffset * Math.cos(progress_tail),
          y: this.origin.y + midOffset * Math.sin(progress_tail),
        },
      };

      // Calculate the position of the tail guide point (for rounded line caps)
      const tailGuideDistance =
        progress_tail < Math.PI ? guideDistance : -guideDistance;
      const tailM = -1 / Math.tan(progress_tail);
      const tailV = { x: 1, y: tailM };
      const tailVMagnitude = Math.sqrt(
        Math.pow(tailV.x, 2) + Math.pow(tailV.y, 2)
      );
      const tailVNorm = {
        x: tailV.x / tailVMagnitude,
        y: tailV.y / tailVMagnitude,
      };

      const tailGuide = {
        x:
          this.origin.x +
          midOffset * Math.cos(progress_tail) +
          tailVNorm.x * tailGuideDistance,
        y:
          this.origin.y +
          midOffset * Math.sin(progress_tail) +
          tailVNorm.y * tailGuideDistance,
      };

      // Calculate the positions of the ends of each 120deg section
      const section_bounds = [
        {
          outer: {
            x: this.origin.x + outerOffset * Math.cos(0),
            y: this.origin.y + outerOffset * Math.sin(0),
          },
          inner: {
            x: this.origin.x + innerOffset * Math.cos(0),
            y: this.origin.y + innerOffset * Math.sin(0),
          },
        },
        {
          outer: {
            x: this.origin.x + outerOffset * Math.cos((2 * Math.PI) / 3),
            y: this.origin.y + outerOffset * Math.sin((2 * Math.PI) / 3),
          },
          inner: {
            x: this.origin.x + innerOffset * Math.cos((2 * Math.PI) / 3),
            y: this.origin.y + innerOffset * Math.sin((2 * Math.PI) / 3),
          },
        },
        {
          outer: {
            x: this.origin.x + outerOffset * Math.cos((4 * Math.PI) / 3),
            y: this.origin.y + outerOffset * Math.sin((4 * Math.PI) / 3),
          },
          inner: {
            x: this.origin.x + innerOffset * Math.cos((4 * Math.PI) / 3),
            y: this.origin.y + innerOffset * Math.sin((4 * Math.PI) / 3),
          },
        },
      ];

      /**
       * Draw the path!
       *
       * Path is drawn in the following order:
       *  - Tail (inner -> end line -> outer)
       *  - Middle sections, if present (outer line)
       *  - Lead (outer -> start line -> inner)
       *  - Middle sections, if present (inner line)
       *
       * Each shape must be a single continuous path to avoid aliasing.
       * */

      this.ctxSetColour(this.arcs - i - 1);
      this.context.beginPath();

      // Start drawing with the tail
      let curr_section = tail_section;
      let has_drawn_lead = false;
      let has_drawn_tail = false;
      for (let i = 0; i < 6; i++) {
        // 6 is any upper bound on the number of potential drawing steps
        const contained =
          tail_section == curr_section &&
          lead_section == curr_section &&
          progress_lead > progress_tail;
        if (contained) {
          // The arc is contained in a single section, so drawing is simple
          const outer_cps = this.circularBezierControlPoints(
            tail.outer,
            lead.outer,
            this.origin
          );
          const inner_cps = this.circularBezierControlPoints(
            lead.inner,
            tail.inner,
            this.origin
          );
          this.context.moveTo(lead.inner.x, lead.inner.y);
          this.context.bezierCurveTo(
            inner_cps.cp1.x,
            inner_cps.cp1.y,
            inner_cps.cp2.x,
            inner_cps.cp2.y,
            tail.inner.x,
            tail.inner.y
          );
          if (this.lineCap == "rounded" || this.tailCap == "rounded") {
            this.ctxCircToVector(tail.inner, tailGuide, tail.mid);
            this.ctxCircToVector(tailGuide, tail.outer, tail.mid);
          } else {
            this.context.lineTo(tail.outer.x, tail.outer.y);
          }

          this.context.bezierCurveTo(
            outer_cps.cp1.x,
            outer_cps.cp1.y,
            outer_cps.cp2.x,
            outer_cps.cp2.y,
            lead.outer.x,
            lead.outer.y
          );
          if (this.lineCap == "rounded" || this.leadCap == "rounded") {
            this.ctxCircToVector(lead.outer, leadGuide, lead.mid);
            this.ctxCircToVector(leadGuide, lead.inner, lead.mid);
          } else {
            this.context.lineTo(lead.inner.x, lead.inner.y);
          }
          break;
        } else {
          // The arc is not contained in a single section:
          if (tail_section == curr_section && has_drawn_lead) {
            // If we're back in the tail and we've already drawn the lead, then we're done
            break;
          } else if (tail_section == curr_section && !has_drawn_tail) {
            // This is the tail section
            has_drawn_tail = true;
            const bound = section_bounds[(curr_section + 1) % 3];
            const outer_cps = this.circularBezierControlPoints(
              tail.outer,
              bound.outer,
              this.origin
            );
            const inner_cps = this.circularBezierControlPoints(
              bound.inner,
              tail.inner,
              this.origin
            );
            this.context.moveTo(bound.inner.x, bound.inner.y);
            this.context.bezierCurveTo(
              inner_cps.cp1.x,
              inner_cps.cp1.y,
              inner_cps.cp2.x,
              inner_cps.cp2.y,
              tail.inner.x,
              tail.inner.y
            );
            if (this.lineCap == "rounded" || this.tailCap == "rounded") {
              this.ctxCircToVector(tail.inner, tailGuide, tail.mid);
              this.ctxCircToVector(tailGuide, tail.outer, tail.mid);
            } else {
              this.context.lineTo(tail.outer.x, tail.outer.y);
            }
            this.context.bezierCurveTo(
              outer_cps.cp1.x,
              outer_cps.cp1.y,
              outer_cps.cp2.x,
              outer_cps.cp2.y,
              bound.outer.x,
              bound.outer.y
            );
          } else if (lead_section == curr_section) {
            // This is the lead section
            has_drawn_lead = true;
            const bound = section_bounds[curr_section];
            const outer_cps = this.circularBezierControlPoints(
              bound.outer,
              lead.outer,
              this.origin
            );
            const inner_cps = this.circularBezierControlPoints(
              lead.inner,
              bound.inner,
              this.origin
            );
            this.context.bezierCurveTo(
              outer_cps.cp1.x,
              outer_cps.cp1.y,
              outer_cps.cp2.x,
              outer_cps.cp2.y,
              lead.outer.x,
              lead.outer.y
            );
            if (this.lineCap == "rounded" || this.leadCap == "rounded") {
              this.ctxCircToVector(lead.outer, leadGuide, lead.mid);
              this.ctxCircToVector(leadGuide, lead.inner, lead.mid);
            } else {
              this.context.lineTo(lead.inner.x, lead.inner.y);
            }

            this.context.bezierCurveTo(
              inner_cps.cp1.x,
              inner_cps.cp1.y,
              inner_cps.cp2.x,
              inner_cps.cp2.y,
              bound.inner.x,
              bound.inner.y
            );
          } else {
            // This is neither the tail, nor lead
            const bound_1 = section_bounds[curr_section];
            const bound_2 = section_bounds[(curr_section + 1) % 3];
            const outer_cps = this.circularBezierControlPoints(
              bound_1.outer,
              bound_2.outer,
              this.origin
            );
            const inner_cps = this.circularBezierControlPoints(
              bound_2.inner,
              bound_1.inner,
              this.origin
            );
            if (has_drawn_lead) {
              this.context.bezierCurveTo(
                inner_cps.cp1.x,
                inner_cps.cp1.y,
                inner_cps.cp2.x,
                inner_cps.cp2.y,
                bound_1.inner.x,
                bound_1.inner.y
              );
            } else {
              this.context.bezierCurveTo(
                outer_cps.cp1.x,
                outer_cps.cp1.y,
                outer_cps.cp2.x,
                outer_cps.cp2.y,
                bound_2.outer.x,
                bound_2.outer.y
              );
            }
          }
        }
        // Go forwards if we haven't drawn the lead yet, backwards otherwise
        curr_section = has_drawn_lead
          ? (curr_section + 2) % 3
          : (curr_section + 1) % 3;
      }
      this.ctxDraw();
    }

    // Draw the border circles (if set)
    if (this.outerBorder) {
      this.context.beginPath();
      this.context.strokeStyle = this.outerBorder.colour;
      this.context.lineWidth = this.outerBorder.weight;
      this.context.arc(
        this.origin.x,
        this.origin.y,
        this.radius,
        0,
        Math.PI * 2
      );
      this.context.stroke();
    }

    if (this.innerBorder) {
      this.context.beginPath();
      this.context.strokeStyle = this.innerBorder.colour;
      this.context.lineWidth = this.innerBorder.weight;
      this.context.arc(
        this.origin.x,
        this.origin.y,
        this.radius - this.arcWidth,
        0,
        Math.PI * 2
      );
      this.context.stroke();
    }
  }
  // #endregion
}
