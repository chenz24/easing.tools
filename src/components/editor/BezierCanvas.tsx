import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BezierValues } from "@/hooks/useEasingStore";
import { solveCubicBezier } from "@/lib/easingCurves";
import { Eye, Grid3X3, Maximize2, RotateCcw, Search, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface BezierCanvasProps {
  bezier: BezierValues;
  duration: number;
  isPlaying: boolean;
  animationKey: number;
  onBezierChange: (values: Partial<BezierValues>) => void;
  onReset: () => void;
}

type DragPoint = "p1" | "p2" | "timeline" | null;

export function BezierCanvas({
  bezier,
  duration,
  isPlaying,
  animationKey,
  onBezierChange,
  onReset,
}: BezierCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<DragPoint>(null);
  const [size, setSize] = useState({ width: 280, height: 280 });
  const [timelineProgress, setTimelineProgress] = useState(0);
  const animStartRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const [showGrid, setShowGrid] = useState(true);
  const [viewRange, setViewRange] = useState({ min: -0.1, max: 1.1 });

  // Responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (svgRef.current?.parentElement) {
        const parent = svgRef.current.parentElement;
        const s = Math.min(parent.clientWidth - 32, 280);
        setSize({ width: s, height: s });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const padding = 32;
  const graphSize = size.width - padding * 2;

  const rangeSpan = viewRange.max - viewRange.min;

  // Convert normalized coordinates to SVG coordinates
  const toSVG = useCallback(
    (x: number, y: number) => ({
      x: padding + ((x - viewRange.min) / rangeSpan) * graphSize,
      y: size.height - padding - ((y - viewRange.min) / rangeSpan) * graphSize,
    }),
    [graphSize, size.height, viewRange.min, rangeSpan],
  );

  // Convert SVG coordinates to normalized coordinates
  const fromSVG = useCallback(
    (svgX: number, svgY: number) => ({
      x: Math.round((viewRange.min + ((svgX - padding) / graphSize) * rangeSpan) * 100) / 100,
      y:
        Math.round(
          (viewRange.min + ((size.height - padding - svgY) / graphSize) * rangeSpan) * 100,
        ) / 100,
    }),
    [graphSize, size.height, viewRange.min, rangeSpan],
  );

  // Get mouse position in SVG coordinates
  const getMousePos = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Handle mouse down on control points
  const handleMouseDown = useCallback(
    (point: DragPoint) => (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(point);
    },
    [],
  );

  // Animation loop: animate timelineProgress when isPlaying
  useEffect(() => {
    if (!isPlaying) {
      animStartRef.current = null;
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const durationMs = duration * 1000;
    const animate = (timestamp: number) => {
      if (animStartRef.current === null) animStartRef.current = timestamp;
      const elapsed = timestamp - animStartRef.current;
      const raw = elapsed / durationMs;
      // loop: alternate direction
      const cycle = Math.floor(raw);
      const frac = raw - cycle;
      const progress = cycle % 2 === 0 ? frac : 1 - frac;
      setTimelineProgress(Math.max(0, Math.min(1, progress)));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, duration, animationKey]);

  // Handle timeline drag
  const handleTimelineMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging("timeline");
  }, []);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setViewRange((prev) => {
      const center = (prev.min + prev.max) / 2;
      const halfSpan = ((prev.max - prev.min) / 2) * 0.8; // shrink by 20%
      return { min: center - halfSpan, max: center + halfSpan };
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewRange((prev) => {
      const center = (prev.min + prev.max) / 2;
      const halfSpan = ((prev.max - prev.min) / 2) * 1.25; // expand by 25%
      return { min: center - halfSpan, max: center + halfSpan };
    });
  }, []);

  const handleFitToView = useCallback(() => {
    const allY = [0, 1, bezier.y1, bezier.y2];
    const allX = [0, 1, bezier.x1, bezier.x2];
    const minVal = Math.min(...allX, ...allY);
    const maxVal = Math.max(...allX, ...allY);
    const span = maxVal - minVal;
    const marginRatio = 0.15;
    setViewRange({
      min: minVal - span * marginRatio,
      max: maxVal + span * marginRatio,
    });
  }, [bezier]);

  const handleResetView = useCallback(() => {
    setViewRange({ min: -0.1, max: 1.1 });
  }, []);

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging) return;
      const pos = getMousePos(e);

      if (dragging === "timeline") {
        const norm = viewRange.min + ((pos.x - padding) / graphSize) * rangeSpan;
        setTimelineProgress(Math.max(0, Math.min(1, norm)));
        return;
      }

      const norm = fromSVG(pos.x, pos.y);

      if (dragging === "p1") {
        onBezierChange({
          x1: Math.max(0, Math.min(1, norm.x)),
          y1: norm.y, // Allow overshoot
        });
      } else if (dragging === "p2") {
        onBezierChange({
          x2: Math.max(0, Math.min(1, norm.x)),
          y2: norm.y, // Allow overshoot
        });
      }
    },
    [dragging, fromSVG, getMousePos, onBezierChange, graphSize, viewRange.min, rangeSpan],
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  // Add/remove event listeners
  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Calculate positions
  const start = toSVG(0, 0);
  const end = toSVG(1, 1);
  const p1 = toSVG(bezier.x1, bezier.y1);
  const p2 = toSVG(bezier.x2, bezier.y2);

  // Bezier path
  const pathD = `M ${start.x} ${start.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${end.x} ${end.y}`;

  // Fill path: area between curve and diagonal baseline (shows deviation from linear)
  // Path goes: start -> bezier curve -> end -> diagonal back to start
  const fillPathD = `M ${start.x} ${start.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${end.x} ${end.y} L ${start.x} ${start.y} Z`;

  // Timeline position
  const timelineX = padding + ((timelineProgress - viewRange.min) / rangeSpan) * graphSize;

  // Eased progression value at current time
  const easedProgress = solveCubicBezier(
    bezier.x1,
    bezier.y1,
    bezier.x2,
    bezier.y2,
    timelineProgress,
  );
  // Linear progress = timelineProgress itself
  const linearProgress = timelineProgress;

  // Y positions of the two indicators on the left axis
  const easedY = size.height - padding - ((easedProgress - viewRange.min) / rangeSpan) * graphSize;
  const linearY =
    size.height - padding - ((linearProgress - viewRange.min) / rangeSpan) * graphSize;

  // Point on curve
  const curvePointSVG = toSVG(timelineProgress, easedProgress);

  // Generate grid lines at 0.25 intervals, positioned according to viewRange
  const gridStep = 0.25;
  const gridLines: { x1: number; y1: number; x2: number; y2: number; isHorizontal: boolean }[] = [];

  const gridStart = Math.floor(viewRange.min / gridStep) * gridStep;
  const gridEnd = Math.ceil(viewRange.max / gridStep) * gridStep;

  for (let v = gridStart; v <= gridEnd; v = Math.round((v + gridStep) * 100) / 100) {
    const svgPos = padding + ((v - viewRange.min) / rangeSpan) * graphSize;
    // Horizontal lines
    gridLines.push({
      x1: padding,
      y1: size.height - padding - ((v - viewRange.min) / rangeSpan) * graphSize,
      x2: padding + graphSize,
      y2: size.height - padding - ((v - viewRange.min) / rangeSpan) * graphSize,
      isHorizontal: true,
    });
    // Vertical lines
    gridLines.push({
      x1: svgPos,
      y1: padding,
      x2: svgPos,
      y2: padding + graphSize,
      isHorizontal: false,
    });
  }

  // Generate intersection points for cross markers
  const crossPoints: { x: number; y: number }[] = [];
  for (let vx = gridStart; vx <= gridEnd; vx = Math.round((vx + gridStep) * 100) / 100) {
    for (let vy = gridStart; vy <= gridEnd; vy = Math.round((vy + gridStep) * 100) / 100) {
      const cx = padding + ((vx - viewRange.min) / rangeSpan) * graphSize;
      const cy = size.height - padding - ((vy - viewRange.min) / rangeSpan) * graphSize;
      // Only include points within visible area
      if (
        cx >= padding &&
        cx <= padding + graphSize &&
        cy >= padding &&
        cy <= padding + graphSize
      ) {
        crossPoints.push({ x: cx, y: cy });
      }
    }
  }

  // Control point size
  const controlPointSize = 14;
  const controlPointRadius = 4;

  return (
    <div className="flex flex-col gap-3">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        {/* Left: Zoom controls in a grouped container */}
        <div className="flex items-center rounded-lg bg-muted/50 p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={handleZoomOut}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={handleResetView}
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={handleZoomIn}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Right: View dropdown and Reset */}
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-accent-foreground"
              >
                <Eye className="h-3.5 w-3.5" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowGrid(!showGrid)}>
                <Grid3X3 className="mr-2 h-4 w-4" />
                {showGrid ? "Hide Grid" : "Show Grid"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleFitToView}>
                <Maximize2 className="mr-2 h-4 w-4" />
                Fit to View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="gap-1.5 text-muted-foreground hover:text-accent-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex items-center justify-center rounded-xl bg-background p-4">
        {/* Y-axis label */}
        <span className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium tracking-wider text-muted-foreground">
          PROGRESSION
        </span>

        <svg
          ref={svgRef}
          width={size.width}
          height={size.height}
          className="cursor-crosshair"
          style={{ touchAction: "none" }}
        >
          <defs>
            {/* Dense grid pattern for entire canvas background */}
            <pattern id="gridPattern" patternUnits="userSpaceOnUse" width="8" height="8">
              <line
                x1="0"
                y1="8"
                x2="8"
                y2="8"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="0.5"
                opacity="0.15"
              />
              <line
                x1="8"
                y1="0"
                x2="8"
                y2="8"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="0.5"
                opacity="0.15"
              />
            </pattern>

            {/* Small squares pattern for curve fill */}
            <pattern id="stripePattern" patternUnits="userSpaceOnUse" width="4" height="4">
              <rect x="0" y="0" width="2" height="2" fill="hsl(var(--primary))" opacity="0.4" />
            </pattern>

            {/* Drop shadow filter for control points */}
            <filter id="controlPointShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="3"
                floodColor="hsl(0 0% 0%)"
                floodOpacity="0.25"
              />
            </filter>
          </defs>

          {/* Dense grid background texture */}
          <rect
            x={padding}
            y={padding}
            width={graphSize}
            height={graphSize}
            fill="url(#gridPattern)"
          />

          {/* Grid lines */}
          {showGrid &&
            gridLines.map((line, i) => (
              <line
                key={`grid-${i}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                className="stroke-muted-foreground/15"
                strokeWidth={1}
              />
            ))}

          {/* Grid cross markers at intersections */}
          {showGrid &&
            crossPoints.map((point, i) => (
              <g key={`cross-${i}`}>
                <line
                  x1={point.x - 4}
                  y1={point.y}
                  x2={point.x + 4}
                  y2={point.y}
                  className="stroke-muted-foreground/40"
                  strokeWidth={1}
                />
                <line
                  x1={point.x}
                  y1={point.y - 4}
                  x2={point.x}
                  y2={point.y + 4}
                  className="stroke-muted-foreground/40"
                  strokeWidth={1}
                />
              </g>
            ))}

          {/* Border - 0-1 unit square */}
          {(() => {
            const unitOrigin = toSVG(0, 0);
            const unitEnd = toSVG(1, 1);
            const ux = Math.min(unitOrigin.x, unitEnd.x);
            const uy = Math.min(unitOrigin.y, unitEnd.y);
            const uw = Math.abs(unitEnd.x - unitOrigin.x);
            const uh = Math.abs(unitEnd.y - unitOrigin.y);
            return (
              <rect
                x={ux}
                y={uy}
                width={uw}
                height={uh}
                fill="none"
                className="stroke-border"
                strokeWidth={1}
              />
            );
          })()}

          {/* Diagonal baseline (linear reference) */}
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            className="stroke-muted-foreground/30"
            strokeWidth={1}
            strokeDasharray="4 4"
          />

          {/* Curve fill area - solid background */}
          <path d={fillPathD} fill="hsl(var(--primary) / 0.15)" />

          {/* Curve fill area - stripe pattern overlay */}
          <path d={fillPathD} fill="url(#stripePattern)" />

          {/* Handle lines (solid style) */}
          <line
            x1={start.x}
            y1={start.y}
            x2={p1.x}
            y2={p1.y}
            className="stroke-muted-foreground/60"
            strokeWidth={1.5}
          />
          <line
            x1={end.x}
            y1={end.y}
            x2={p2.x}
            y2={p2.y}
            className="stroke-muted-foreground/60"
            strokeWidth={1.5}
          />

          {/* Bezier curve */}
          <path
            d={pathD}
            fill="none"
            className="stroke-primary"
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          {/* Start point - hollow ring */}
          <circle
            cx={start.x}
            cy={start.y}
            r={5}
            fill="none"
            className="stroke-primary"
            strokeWidth={2}
          />

          {/* End point - small filled circle (subtle) */}
          <circle cx={end.x} cy={end.y} r={3} className="fill-muted-foreground/50" />

          {/* Timeline indicator vertical line */}
          <line
            x1={timelineX}
            y1={padding}
            x2={timelineX}
            y2={size.height - padding}
            className="stroke-muted-foreground/40"
            strokeWidth={1}
            strokeDasharray="2 2"
          />

          {/* Horizontal line from curve point to Y-axis (eased) */}
          <line
            x1={padding}
            y1={curvePointSVG.y}
            x2={curvePointSVG.x}
            y2={curvePointSVG.y}
            className="stroke-muted-foreground/25"
            strokeWidth={1}
            strokeDasharray="2 2"
          />

          {/* Y-axis indicator: eased progression (white filled dot) */}
          <circle
            cx={padding - 8}
            cy={easedY}
            r={4}
            className="fill-white stroke-muted-foreground/60"
            strokeWidth={1.5}
          />

          {/* Y-axis indicator: linear reference (hollow primary ring) */}
          <circle
            cx={padding - 8}
            cy={linearY}
            r={4.5}
            fill="none"
            className="stroke-primary"
            strokeWidth={1.5}
          />

          {/* X-axis indicator: current time (small primary square) */}
          <rect
            x={timelineX - 4}
            y={size.height - padding + 4}
            width={8}
            height={8}
            rx={1.5}
            className="fill-primary"
          />

          {/* Control point 1 - rendered last for highest z-order */}
          <rect
            x={p1.x - controlPointSize / 2 - 4}
            y={p1.y - controlPointSize / 2 - 4}
            width={controlPointSize + 8}
            height={controlPointSize + 8}
            fill="transparent"
            className="cursor-grab"
            onMouseDown={handleMouseDown("p1")}
          />
          <rect
            x={p1.x - controlPointSize / 2}
            y={p1.y - controlPointSize / 2}
            width={controlPointSize}
            height={controlPointSize}
            rx={controlPointRadius}
            ry={controlPointRadius}
            className={`cursor-grab fill-white stroke-primary stroke-2 ${
              dragging === "p1" ? "cursor-grabbing" : ""
            }`}
            filter="url(#controlPointShadow)"
            onMouseDown={handleMouseDown("p1")}
          />

          {/* Control point 2 - rendered last for highest z-order */}
          <rect
            x={p2.x - controlPointSize / 2 - 4}
            y={p2.y - controlPointSize / 2 - 4}
            width={controlPointSize + 8}
            height={controlPointSize + 8}
            fill="transparent"
            className="cursor-grab"
            onMouseDown={handleMouseDown("p2")}
          />
          <rect
            x={p2.x - controlPointSize / 2}
            y={p2.y - controlPointSize / 2}
            width={controlPointSize}
            height={controlPointSize}
            rx={controlPointRadius}
            ry={controlPointRadius}
            className={`cursor-grab fill-white stroke-primary stroke-2 ${
              dragging === "p2" ? "cursor-grabbing" : ""
            }`}
            filter="url(#controlPointShadow)"
            onMouseDown={handleMouseDown("p2")}
          />
        </svg>

        {/* X-axis label */}
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium tracking-wider text-muted-foreground">
          TIME
        </span>
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center justify-center gap-1">
        <Button
          variant={showGrid ? "secondary" : "ghost"}
          size="icon"
          className="h-7 w-7"
          onClick={() => setShowGrid(!showGrid)}
        >
          <Grid3X3 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-accent-foreground"
          onClick={handleFitToView}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
