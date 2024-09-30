import { Animautomaton, AnimautomatonOps } from "../animautomaton";
import { Anchor, ArcEndPoint, Border, Linecap, Vector2 } from "../types";
import { modulo } from "../utils";

/**
 * Configurable properties able to be passed to the Antiquum constructor.
 *
 * Superset of {AnimautomatonOps}.
 *
 * See {Antiquum} class documentation for explanations.
 */
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
  innerBorder: Border | null;
  outerBorder: Border | null;
  trackColour: string | null;
  lineCap: Linecap;
  leadCap: Linecap | null;
  tailCap: Linecap | null;
};

type Offsets = { outer: number; inner: number; mid: number };

type Positions = {
  lead: ArcEndPoint;
  tail: ArcEndPoint;
  leadSection: number;
  tailSection: number;
  leadGuide: Vector2;
  tailGuide: Vector2;
  sectionBounds: ArcEndPoint[];
};

/**
 * An animautomaton based on the traditional rotating/spinning arc loader.
 */
export class Antiquum extends Animautomaton {
  // #region Configurable properties
  /**
   * The number of individual shapes to draw.
   *
   * Default: 1
   */
  arcs: number;

  /**
   * Width of the primary arc (in pixels).
   *
   * Default: 10
   */
  arcWidth: number;

  /**
   * Only has an effect with multiple arcs. Each arc will be this much (proportional to primary arcWidth)
   * narrower than the previous.
   *
   * Can be set to a negative value to make successive arcs larger.
   *
   * Default: 0.02 (>0 to avoid aliasing)
   */
  arcWidthDelta: number;

  /**
   * Determines where arcs of differing width will align.
   *
   * Default: centre
   */
  arcAnchor: Anchor;

  /**
   * A value between 0 and 1 indicating what percentage behind in the loop the arc's tail (endpoint) will
   * be compared to its lead (starting point) at all times.
   *
   * Default: 0.1
   */
  tailDelay: number;

  /**
   * A value between 0 and 1 indicating what percentage behind in the loop each successive arc will be.
   *
   * Only has an effect with multiple arcs.
   *
   * Default: 0.1
   */
  arcDelay: number;

  /**
   * Radius of the circle that the centre of the arcs will travel along, in pixels.
   *
   * Default: 75% of minimum canvas dimension
   */
  radius: number;

  /**
   * Only has an effect with multiple arcs. Each arc will travel along a path with radius this
   * much less (proportional to primary radius).
   *
   * Can be set to a negative value to make successive arcs travel along a path with greater radius.
   *
   * Default: 0
   */
  radiusDelta: number;

  /**
   * The number of rotations the circular path will make in a single loop *as* the arcs travel around it.
   *
   * Note: This can be set to a non-integer value (e.g. 1.5) but this will result in the animation not
   * necessarily repeating exactly every loop, which usually will not matter but may interfere
   * with certain API uses.
   *
   * Default: 1
   */
  rotations: number;

  /**
   * If not null, defines the style of the inner border.
   *
   * Default: null
   */
  innerBorder: Border | null;

  /**
   * If not null, defines the style of the outer border.
   *
   * Default: null
   */
  outerBorder: Border | null;

  /**
   * If not null, the ring that the arcs travel along will have this background colour.
   *
   * Default: null
   */
  trackColour: string | null;

  /**
   * Determines the lead AND tail line cap appearance. Lower priority than leadCap and tailCap.
   *
   * Default: rounded
   */
  lineCap: Linecap;

  /**
   * Determines the lead line cap appearance. Overrides lineCap if not null.
   *
   * Default: null
   */
  leadCap: Linecap | null;

  /**
   * Determines the tail line cap appearance. Overrides lineCap if not null.
   *
   * Default: null
   */
  tailCap: Linecap | null;

  // #region Methods

  /**
   * Creates a new Antiquum animautomaton.
   *
   * @param canvasId The id of an HTMLCanvasElement on the page that this animation will render to.
   * @param ops An object containing one or more valid {AntiquumOps} properties.
   */
  constructor(canvasId: string, ops?: Partial<AntiquumOps>) {
    // Parent constructor
    super(canvasId);

    // Set default configuration
    this.arcs = 1;
    this.arcWidth = 10;
    this.arcWidthDelta = 0.02;
    this.arcAnchor = "centre";
    this.tailDelay = 0.25;
    this.arcDelay = 0.1;
    const canvasMin = Math.min(
      this.canvas.width,
      this.canvas.height,
      ops?.canvasHeight ?? Infinity,
      ops?.canvasWidth ?? Infinity
    );
    this.radius = Math.floor(canvasMin * 0.4);
    this.radiusDelta = 0;
    this.rotations = 1;
    this.innerBorder = null;
    this.outerBorder = null;
    this.trackColour = "";
    this.lineCap = "rounded";
    this.leadCap = null;
    this.tailCap = null;

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
   * @param ops An object containing one or more valid {AntiquumOps} properties.
   */
  setConfig = (ops: Partial<AntiquumOps>) => {
    this.parentSetConfig(ops);
    this.arcs = ops.arcs ?? this.arcs;
    this.arcWidth = ops.arcWidth ?? this.arcWidth;
    this.arcWidthDelta = ops.arcWidthDelta ?? this.arcWidthDelta;
    this.arcAnchor = ops.arcAnchor ?? this.arcAnchor;
    this.tailDelay = ops.tailDelay ?? this.tailDelay;
    this.arcDelay = ops.arcDelay ?? this.arcDelay;
    this.radius = ops.radius ?? this.radius;
    this.radiusDelta = ops.radiusDelta ?? this.radiusDelta;
    this.rotations = ops.rotations ?? this.rotations;
    this.innerBorder = ops.innerBorder ?? this.innerBorder;
    this.outerBorder = ops.outerBorder ?? this.outerBorder;
    this.trackColour = ops.trackColour ?? this.trackColour;
    this.lineCap = ops.lineCap ?? this.lineCap;
    this.leadCap = ops.leadCap ?? this.leadCap;
    this.tailCap = ops.tailCap ?? this.tailCap;
  };

  /**
   * @returns The number of rotations + partial rotations this animation has performed.
   */
  getAccumulatedRotation = (): number => {
    return (
      (this.currIteration + this.currProgress) * this.rotations * Math.PI * 2
    );
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

    // Handle overall rotation
    const accumulatedRotation = this.getAccumulatedRotation();

    // The track should be drawn underneath everything else
    this.drawTrack();

    // Arcs must be drawn back-to-front so the leading arc appears on top.
    for (let i = 0; i < this.arcs; i++) {
      // First, calculate all the values for this shape
      const leadProgress = modulo(
        this.getProgress(this.arcDelay * i) * Math.PI * 2 + accumulatedRotation,
        Math.PI * 2
      );

      const tailProgress = modulo(
        this.getProgress(this.arcDelay * i - this.tailDelay) * Math.PI * 2 +
          accumulatedRotation,
        Math.PI * 2
      );

      const arcWidthDiff =
        (this.arcs - (i + 1)) * this.arcWidthDelta * this.arcWidth;

      const offsets = this.calculateOffsets(i, arcWidthDiff);

      const {
        lead,
        tail,
        leadSection,
        tailSection,
        leadGuide,
        tailGuide,
        sectionBounds,
      } = this.calculatePositions(
        leadProgress,
        tailProgress,
        offsets,
        arcWidthDiff
      );

      /**
       * Now we draw the path
       *
       * Path is always drawn in the following order:
       *  - Tail (inner -> end line -> outer)
       *  - Middle sections, if present (outer line)
       *  - Lead (outer -> start line -> inner)
       *  - Middle sections, if present (inner line)
       *
       * Each shape must be a single continuous path to avoid aliasing.
       */

      this.ctxSetColour(this.arcs - i - 1);
      this.context.beginPath();

      // Start drawing with the tail
      let currSection = tailSection;
      let hasDrawnLead = false;
      let hasDrawnTail = false;
      for (let i = 0; i < 6; i++) {
        // 6 is any upper bound on the number of potential drawing steps
        const contained =
          tailSection == currSection &&
          leadSection == currSection &&
          leadProgress > tailProgress;
        if (contained) {
          // The arc is contained in a single section
          this.drawContainedArc(tail, lead, leadGuide, tailGuide);
          break;
        } else {
          // The arc is not contained in a single section:
          if (tailSection == currSection && hasDrawnLead) {
            // If we're back in the tail and we've already drawn the lead, then we're done
            break;
          } else if (tailSection == currSection && !hasDrawnTail) {
            // This is the tail section
            hasDrawnTail = true;
            const bound = sectionBounds[(currSection + 1) % 3];
            this.drawTailArcSection(tail, bound, tailGuide);
          } else if (leadSection == currSection) {
            // This is the lead section
            hasDrawnLead = true;
            const bound = sectionBounds[currSection];
            this.drawLeadArcSection(lead, bound, leadGuide);
          } else {
            // This is neither the tail, nor lead
            const bound_1 = sectionBounds[currSection];
            const bound_2 = sectionBounds[(currSection + 1) % 3];
            this.drawMiddleArcSection(bound_1, bound_2, hasDrawnLead);
          }
        }
        // Go forwards if we haven't drawn the lead yet, backwards otherwise
        currSection = hasDrawnLead
          ? (currSection + 2) % 3
          : (currSection + 1) % 3;
      }

      // Draw the current shape to canvas
      this.ctxDraw();
    }

    // Draw the border circles
    this.drawBorders();
  };

  /**
   * Draws an arc shape that is contained in a single 120deg section.
   */
  drawContainedArc = (
    tail: ArcEndPoint,
    lead: ArcEndPoint,
    leadGuide: Vector2,
    tailGuide: Vector2
  ) => {
    const outerControlPoints = this.circularBezierControlPoints(
      tail.outer,
      lead.outer,
      this.origin
    );
    const innerControlPoints = this.circularBezierControlPoints(
      lead.inner,
      tail.inner,
      this.origin
    );
    this.context.moveTo(lead.inner.x, lead.inner.y);
    this.context.bezierCurveTo(
      innerControlPoints.cp1.x,
      innerControlPoints.cp1.y,
      innerControlPoints.cp2.x,
      innerControlPoints.cp2.y,
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
      outerControlPoints.cp1.x,
      outerControlPoints.cp1.y,
      outerControlPoints.cp2.x,
      outerControlPoints.cp2.y,
      lead.outer.x,
      lead.outer.y
    );
    if (this.lineCap == "rounded" || this.leadCap == "rounded") {
      this.ctxCircToVector(lead.outer, leadGuide, lead.mid);
      this.ctxCircToVector(leadGuide, lead.inner, lead.mid);
    } else {
      this.context.lineTo(lead.inner.x, lead.inner.y);
    }
  };

  /**
   * Draws the lead section of an arc shape.
   */
  drawLeadArcSection = (
    lead: ArcEndPoint,
    bound: ArcEndPoint,
    leadGuide: Vector2
  ) => {
    const outerControlPoints = this.circularBezierControlPoints(
      bound.outer,
      lead.outer,
      this.origin
    );
    const innerControlPoints = this.circularBezierControlPoints(
      lead.inner,
      bound.inner,
      this.origin
    );
    this.context.bezierCurveTo(
      outerControlPoints.cp1.x,
      outerControlPoints.cp1.y,
      outerControlPoints.cp2.x,
      outerControlPoints.cp2.y,
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
      innerControlPoints.cp1.x,
      innerControlPoints.cp1.y,
      innerControlPoints.cp2.x,
      innerControlPoints.cp2.y,
      bound.inner.x,
      bound.inner.y
    );
  };

  /**
   * Draws a middle section of an arc shape. Draws the outer line if {hasDrawnLead}
   * is false, and the inner line otherwise.
   */
  drawMiddleArcSection = (
    bound_1: ArcEndPoint,
    bound_2: ArcEndPoint,
    hasDrawnLead: boolean
  ) => {
    const outerControlPoints = this.circularBezierControlPoints(
      bound_1.outer,
      bound_2.outer,
      this.origin
    );
    const innerControlPoints = this.circularBezierControlPoints(
      bound_2.inner,
      bound_1.inner,
      this.origin
    );
    if (hasDrawnLead) {
      this.context.bezierCurveTo(
        innerControlPoints.cp1.x,
        innerControlPoints.cp1.y,
        innerControlPoints.cp2.x,
        innerControlPoints.cp2.y,
        bound_1.inner.x,
        bound_1.inner.y
      );
    } else {
      this.context.bezierCurveTo(
        outerControlPoints.cp1.x,
        outerControlPoints.cp1.y,
        outerControlPoints.cp2.x,
        outerControlPoints.cp2.y,
        bound_2.outer.x,
        bound_2.outer.y
      );
    }
  };

  /**
   * Draws the tail section of an arc.
   */
  drawTailArcSection = (
    tail: ArcEndPoint,
    bound: ArcEndPoint,
    tailGuide: Vector2
  ) => {
    const outerControlPoints = this.circularBezierControlPoints(
      tail.outer,
      bound.outer,
      this.origin
    );
    const innerControlPoints = this.circularBezierControlPoints(
      bound.inner,
      tail.inner,
      this.origin
    );
    this.context.moveTo(bound.inner.x, bound.inner.y);
    this.context.bezierCurveTo(
      innerControlPoints.cp1.x,
      innerControlPoints.cp1.y,
      innerControlPoints.cp2.x,
      innerControlPoints.cp2.y,
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
      outerControlPoints.cp1.x,
      outerControlPoints.cp1.y,
      outerControlPoints.cp2.x,
      outerControlPoints.cp2.y,
      bound.outer.x,
      bound.outer.y
    );
  };

  /**
   * Draws the background ring / track that the arcs travel over iff this.trackColour is not null.
   */
  drawTrack = () => {
    if (!this.trackColour) return;
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
  };

  /**
   * Draws the borders of the area the arcs travel along, iff borders are not null.
   */
  drawBorders = () => {
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
  };

  /**
   * Calculates values used for future geometric calculations.
   */
  calculateOffsets = (arc_i: number, arcWidthDiff: number): Offsets => {
    const radius =
      this.radius - (this.arcs - (arc_i + 1)) * this.radiusDelta * this.radius;

    let outerOffset: number, innerOffset: number, midOffset: number;
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
    return {
      outer: outerOffset,
      inner: innerOffset,
      mid: midOffset,
    };
  };

  /**
   * Calculates geometric information used for drawing an arc shape.
   */
  calculatePositions = (
    leadProgress: number,
    tailProgress: number,
    offsets: Offsets,
    arcWidthDiff: number
  ): Positions => {
    /**
     * IMPORTANT: We split the circle into three 120deg sections because the circular bezier curve
     * degenerates at the semi-circle point.
     */

    // Determine which section the lead point of the arc is in
    let leadSection = -1;
    if (leadProgress < (2 * Math.PI) / 3) {
      leadSection = 0;
    } else if (leadProgress < (4 * Math.PI) / 3) {
      leadSection = 1;
    } else {
      leadSection = 2;
    }

    // Determine which section the tail point of the arc is in
    let tailSection = -1;
    if (tailProgress < (2 * Math.PI) / 3) {
      tailSection = 0;
    } else if (tailProgress < (4 * Math.PI) / 3) {
      tailSection = 1;
    } else {
      tailSection = 2;
    }

    // Calculate the position of the lead line
    const lead = {
      outer: {
        x: this.origin.x + offsets.outer * Math.cos(leadProgress),
        y: this.origin.y + offsets.outer * Math.sin(leadProgress),
      },
      inner: {
        x: this.origin.x + offsets.inner * Math.cos(leadProgress),
        y: this.origin.y + offsets.inner * Math.sin(leadProgress),
      },
      mid: {
        x: this.origin.x + offsets.mid * Math.cos(leadProgress),
        y: this.origin.y + offsets.mid * Math.sin(leadProgress),
      },
    };

    // The distance to offset the guide point for rounded linecaps
    const guideDistance = (this.arcWidth - arcWidthDiff) / 2;

    // Calculate the position of the lead guide point (for rounded line caps)
    const leadGuideDistance =
      leadProgress > Math.PI ? guideDistance : -guideDistance;
    const leadM = -1 / Math.tan(leadProgress);
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
        offsets.mid * Math.cos(leadProgress) +
        leadVNorm.x * leadGuideDistance,
      y:
        this.origin.y +
        offsets.mid * Math.sin(leadProgress) +
        leadVNorm.y * leadGuideDistance,
    };

    // Calculate the positions of the tail line
    const tail = {
      outer: {
        x: this.origin.x + offsets.outer * Math.cos(tailProgress),
        y: this.origin.y + offsets.outer * Math.sin(tailProgress),
      },
      inner: {
        x: this.origin.x + offsets.inner * Math.cos(tailProgress),
        y: this.origin.y + offsets.inner * Math.sin(tailProgress),
      },
      mid: {
        x: this.origin.x + offsets.mid * Math.cos(tailProgress),
        y: this.origin.y + offsets.mid * Math.sin(tailProgress),
      },
    };

    // Calculate the position of the tail guide point (for rounded line caps)
    const tailGuideDistance =
      tailProgress < Math.PI ? guideDistance : -guideDistance;
    const tailM = -1 / Math.tan(tailProgress);
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
        offsets.mid * Math.cos(tailProgress) +
        tailVNorm.x * tailGuideDistance,
      y:
        this.origin.y +
        offsets.mid * Math.sin(tailProgress) +
        tailVNorm.y * tailGuideDistance,
    };

    // Calculate the positions of the ends of each 120deg section
    const sectionBounds = [
      {
        outer: {
          x: this.origin.x + offsets.outer * Math.cos(0),
          y: this.origin.y + offsets.outer * Math.sin(0),
        },
        inner: {
          x: this.origin.x + offsets.inner * Math.cos(0),
          y: this.origin.y + offsets.inner * Math.sin(0),
        },
        mid: {
          x: this.origin.x + offsets.mid * Math.cos(0),
          y: this.origin.y + offsets.mid * Math.sin(0),
        },
      },
      {
        outer: {
          x: this.origin.x + offsets.outer * Math.cos((2 * Math.PI) / 3),
          y: this.origin.y + offsets.outer * Math.sin((2 * Math.PI) / 3),
        },
        inner: {
          x: this.origin.x + offsets.inner * Math.cos((2 * Math.PI) / 3),
          y: this.origin.y + offsets.inner * Math.sin((2 * Math.PI) / 3),
        },
        mid: {
          x: this.origin.x + offsets.mid * Math.cos((2 * Math.PI) / 3),
          y: this.origin.y + offsets.mid * Math.sin((2 * Math.PI) / 3),
        },
      },
      {
        outer: {
          x: this.origin.x + offsets.outer * Math.cos((4 * Math.PI) / 3),
          y: this.origin.y + offsets.outer * Math.sin((4 * Math.PI) / 3),
        },
        inner: {
          x: this.origin.x + offsets.inner * Math.cos((4 * Math.PI) / 3),
          y: this.origin.y + offsets.inner * Math.sin((4 * Math.PI) / 3),
        },
        mid: {
          x: this.origin.x + offsets.mid * Math.cos((4 * Math.PI) / 3),
          y: this.origin.y + offsets.mid * Math.sin((4 * Math.PI) / 3),
        },
      },
    ];
    return {
      lead: lead,
      tail: tail,
      leadSection: leadSection,
      tailSection: tailSection,
      leadGuide: leadGuide,
      tailGuide: tailGuide,
      sectionBounds: sectionBounds,
    };
  };
}
