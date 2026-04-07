import { Button } from "@/components/ui/button";
import type { SpringValues } from "@/hooks/useSpringStore";
import { calculateSpringPoints } from "@/lib/springCurves";
import { Grid3X3, RotateCcw, Search, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface SpringCanvasProps {
  spring: SpringValues;
  duration: number;
  isPlaying: boolean;
  animationKey: number;
  onReset: () => void;
}

export function SpringCanvas({
  spring,
  duration,
  isPlaying,
  animationKey,
  onReset,
}: SpringCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 280, height: 280 });
  const [timelineProgress, setTimelineProgress] = useState(0);
  const animStartRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const [showGrid, setShowGrid] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1); // 0=small, 1=medium, 2=large

  const zoomScales = [0.6, 0.8, 1.0];
  const padding = 32;

  // Responsive sizing based on zoom level
  const parentWidthRef = useRef(280);
  useEffect(() => {
    const updateSize = () => {
      if (svgRef.current?.parentElement) {
        const parent = svgRef.current.parentElement;
        parentWidthRef.current = parent.clientWidth - 32;
        const s = Math.round(parentWidthRef.current * zoomScales[zoomLevel]);
        setSize({ width: s, height: s });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [zoomLevel]);

  const graphSize = size.width - padding * 2;
  // Calculate spring curve points
  const points = useMemo(() => {
    return calculateSpringPoints({ ...spring, duration, id: "", name: "" }, 200);
  }, [spring, duration]);

  // Find value range for scaling
  const valueRange = useMemo(() => {
    const values = points.map((p) => p.value);
    const minV = Math.min(0, ...values);
    const maxV = Math.max(1.1, ...values);
    const span = maxV - minV;
    const margin = span * 0.1;
    return { min: minV - margin, max: maxV + margin };
  }, [points]);

  // Convert normalized coordinates to SVG coordinates
  const toSVG = useCallback(
    (t: number, value: number) => ({
      x: padding + t * graphSize,
      y:
        size.height -
        padding -
        ((value - valueRange.min) / (valueRange.max - valueRange.min)) * graphSize,
    }),
    [graphSize, size.height, valueRange],
  );

  // Generate SVG path from spring points
  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    let d = "";
    points.forEach((point, i) => {
      const pos = toSVG(point.t, point.value);
      d += i === 0 ? `M ${pos.x} ${pos.y}` : ` L ${pos.x} ${pos.y}`;
    });
    return d;
  }, [points, toSVG]);

  // Generate fill path (area between curve and y=0 baseline)
  const fillPathD = useMemo(() => {
    if (points.length === 0) return "";
    const baseline = toSVG(0, 0);
    const endBaseline = toSVG(1, 0);
    // Build path: curve forward, then straight back along y=0
    let d = "";
    points.forEach((point, i) => {
      const pos = toSVG(point.t, point.value);
      d += i === 0 ? `M ${pos.x} ${pos.y}` : ` L ${pos.x} ${pos.y}`;
    });
    // Close by going to end baseline, then start baseline
    d += ` L ${endBaseline.x} ${endBaseline.y} L ${baseline.x} ${baseline.y} Z`;
    return d;
  }, [points, toSVG]);

  // Animation loop: play forward once and stop (synced with shapes panel)
  useEffect(() => {
    animStartRef.current = null;
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const animate = (timestamp: number) => {
      if (animStartRef.current === null) animStartRef.current = timestamp;
      const elapsed = (timestamp - animStartRef.current) / 1000;
      const t = Math.min(elapsed / duration, 1);
      if (t < 1) {
        setTimelineProgress(t);
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setTimelineProgress(0);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, duration, animationKey]);

  // Reset timeline on animation key change
  useEffect(() => {
    setTimelineProgress(0);
  }, [animationKey]);

  // Get spring value at current timeline progress
  const currentSpringValue = useMemo(() => {
    if (points.length === 0) return 0;
    const idx = Math.floor(timelineProgress * (points.length - 1));
    return points[Math.min(idx, points.length - 1)]?.value ?? 0;
  }, [points, timelineProgress]);

  // Timeline and cursor positions
  const timelineX = padding + timelineProgress * graphSize;
  const curvePointSVG = toSVG(timelineProgress, currentSpringValue);
  const valueY =
    size.height -
    padding -
    ((currentSpringValue - valueRange.min) / (valueRange.max - valueRange.min)) * graphSize;

  // Target line at y=1
  const targetLineY =
    size.height - padding - ((1 - valueRange.min) / (valueRange.max - valueRange.min)) * graphSize;

  // Grid lines
  const rangeSpan = valueRange.max - valueRange.min;
  const gridStep = 0.25;
  const gridLines: { x1: number; y1: number; x2: number; y2: number }[] = [];

  // Horizontal grid lines (value axis)
  const gridStartV = Math.floor(valueRange.min / gridStep) * gridStep;
  const gridEndV = Math.ceil(valueRange.max / gridStep) * gridStep;
  for (let v = gridStartV; v <= gridEndV; v = Math.round((v + gridStep) * 100) / 100) {
    const y = size.height - padding - ((v - valueRange.min) / rangeSpan) * graphSize;
    gridLines.push({ x1: padding, y1: y, x2: padding + graphSize, y2: y });
  }

  // Vertical grid lines (time axis at 0.25 intervals)
  for (let t = 0; t <= 1; t += gridStep) {
    const x = padding + t * graphSize;
    gridLines.push({ x1: x, y1: padding, x2: x, y2: padding + graphSize });
  }

  // Grid intersection cross markers
  const crossPoints: { x: number; y: number }[] = [];
  for (let t = 0; t <= 1; t += gridStep) {
    for (let v = gridStartV; v <= gridEndV; v = Math.round((v + gridStep) * 100) / 100) {
      const x = padding + t * graphSize;
      const y = size.height - padding - ((v - valueRange.min) / rangeSpan) * graphSize;
      if (x >= padding && x <= padding + graphSize && y >= padding && y <= padding + graphSize) {
        crossPoints.push({ x, y });
      }
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        {/* Left: Zoom controls */}
        <div className="flex items-center rounded-lg bg-muted/50 p-0.5">
          <Button
            variant={zoomLevel === 0 ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => setZoomLevel(0)}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={zoomLevel === 1 ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => setZoomLevel(1)}
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={zoomLevel === 2 ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => setZoomLevel(2)}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Right: Reset */}
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

      {/* Canvas */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-background p-4"
        style={{ minHeight: parentWidthRef.current + 32 }}
      >
        {/* Y-axis label */}
        <span className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium tracking-wider text-muted-foreground">
          VALUE
        </span>

        <svg
          ref={svgRef}
          width={size.width}
          height={size.height}
          className="cursor-crosshair transition-all duration-300 ease-out"
          style={{ touchAction: "none" }}
        >
          <defs>
            {/* Dense grid pattern */}
            <pattern id="springGridPattern" patternUnits="userSpaceOnUse" width="8" height="8">
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

            {/* Fill pattern for curve area */}
            <pattern id="springStripePattern" patternUnits="userSpaceOnUse" width="4" height="4">
              <rect x="0" y="0" width="2" height="2" fill="hsl(var(--primary))" opacity="0.4" />
            </pattern>
          </defs>

          {/* Dense grid background texture */}
          <rect
            x={padding}
            y={padding}
            width={graphSize}
            height={graphSize}
            fill="url(#springGridPattern)"
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

          {/* Grid cross markers */}
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

          {/* Border */}
          <rect
            x={padding}
            y={padding}
            width={graphSize}
            height={graphSize}
            fill="none"
            className="stroke-border"
            strokeWidth={1}
          />

          {/* Target line at y=1 (dashed) */}
          <line
            x1={padding}
            y1={targetLineY}
            x2={padding + graphSize}
            y2={targetLineY}
            className="stroke-muted-foreground/30"
            strokeWidth={1}
            strokeDasharray="4 4"
          />

          {/* Curve fill area - solid background */}
          <path d={fillPathD} fill="hsl(var(--primary) / 0.15)" />

          {/* Curve fill area - stripe pattern overlay */}
          <path d={fillPathD} fill="url(#springStripePattern)" />

          {/* Spring curve */}
          <path
            d={pathD}
            fill="none"
            className="stroke-primary"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Start point - hollow ring */}
          {(() => {
            const startPos = toSVG(0, 0);
            return (
              <circle
                cx={startPos.x}
                cy={startPos.y}
                r={5}
                fill="none"
                className="stroke-primary"
                strokeWidth={2}
              />
            );
          })()}

          {/* End point - small filled circle */}
          {(() => {
            const endPos = toSVG(1, points.length > 0 ? points[points.length - 1].value : 1);
            return (
              <circle cx={endPos.x} cy={endPos.y} r={3} className="fill-muted-foreground/50" />
            );
          })()}

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

          {/* Horizontal line from curve point to Y-axis */}
          <line
            x1={padding}
            y1={curvePointSVG.y}
            x2={curvePointSVG.x}
            y2={curvePointSVG.y}
            className="stroke-muted-foreground/25"
            strokeWidth={1}
            strokeDasharray="2 2"
          />

          {/* Y-axis indicator: spring value (white filled dot) */}
          <circle
            cx={padding - 8}
            cy={valueY}
            r={4}
            className="fill-white stroke-muted-foreground/60"
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

          {/* Curve tracking dot */}
          <circle cx={curvePointSVG.x} cy={curvePointSVG.y} r={4} className="fill-primary" />
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
      </div>
    </div>
  );
}
