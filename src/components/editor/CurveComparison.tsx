import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CURVE_CATEGORIES,
  type EasingCurve,
  formatCubicBezier,
  solveCubicBezier,
} from "@/lib/easingCurves";
import { ChevronDown, HelpCircle, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

interface CurveComparisonProps {
  currentCurve: { x1: number; y1: number; x2: number; y2: number };
  duration: number;
  allCurves: EasingCurve[];
  isPlaying: boolean;
}

interface ComparisonItemProps {
  label: string;
  curve: { x1: number; y1: number; x2: number; y2: number };
  curveName: string;
  duration: number;
  animationKey: number;
  isPlaying: boolean;
  color: string;
}

const CHART_SAMPLES = 64;
const CHART_PADDING = 16;
const METRICS_SAMPLES = 256;

type CurveValues = { x1: number; y1: number; x2: number; y2: number };

interface CurveMetricsData {
  maxDeviation: number;
  avgDeviation: number;
  t90Current: number;
  t90Compare: number;
  t90Delta: number;
  areaCurrent: number;
  areaCompare: number;
  areaDelta: number;
}

function computeMetrics(current: CurveValues, compare: CurveValues): CurveMetricsData {
  let maxDev = 0;
  let sumDev = 0;
  let t90Current = 1;
  let t90Compare = 1;
  let t90CurrentFound = false;
  let t90CompareFound = false;
  let areaCurrent = 0;
  let areaCompare = 0;
  const step = 1 / METRICS_SAMPLES;

  for (let i = 0; i <= METRICS_SAMPLES; i++) {
    const t = i / METRICS_SAMPLES;
    const yA = solveCubicBezier(current.x1, current.y1, current.x2, current.y2, t);
    const yB = solveCubicBezier(compare.x1, compare.y1, compare.x2, compare.y2, t);
    const dev = Math.abs(yA - yB);
    if (dev > maxDev) maxDev = dev;
    sumDev += dev;

    // T90: first t where output >= 0.9
    if (!t90CurrentFound && yA >= 0.9) {
      t90Current = t;
      t90CurrentFound = true;
    }
    if (!t90CompareFound && yB >= 0.9) {
      t90Compare = t;
      t90CompareFound = true;
    }

    // Trapezoidal area (skip first sample)
    if (i > 0) {
      const prevT = (i - 1) / METRICS_SAMPLES;
      const prevYA = solveCubicBezier(current.x1, current.y1, current.x2, current.y2, prevT);
      const prevYB = solveCubicBezier(compare.x1, compare.y1, compare.x2, compare.y2, prevT);
      areaCurrent += ((prevYA + yA) * step) / 2;
      areaCompare += ((prevYB + yB) * step) / 2;
    }
  }

  return {
    maxDeviation: maxDev,
    avgDeviation: sumDev / (METRICS_SAMPLES + 1),
    t90Current,
    t90Compare,
    t90Delta: t90Current - t90Compare,
    areaCurrent,
    areaCompare,
    areaDelta: areaCurrent - areaCompare,
  };
}

function MetricLabel({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function MetricsBadge({ value, thresholds }: { value: number; thresholds?: [number, number] }) {
  const abs = Math.abs(value);
  const [low, high] = thresholds || [0.02, 0.2];
  const color =
    abs < low
      ? "text-emerald-500 bg-emerald-500/10"
      : abs < high
        ? "text-foreground bg-muted"
        : "text-amber-500 bg-amber-500/10";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono font-semibold ${color}`}
    >
      {(value * 100).toFixed(1)}%
    </span>
  );
}

function CurveMetrics({
  current,
  compare,
  duration,
}: { current: CurveValues; compare: CurveValues; duration: number }) {
  const metrics = useMemo(() => computeMetrics(current, compare), [current, compare]);
  const t90DeltaMs = metrics.t90Delta * duration * 1000;

  const similarity =
    metrics.maxDeviation < 0.02
      ? { label: "Nearly identical", color: "text-emerald-500" }
      : metrics.maxDeviation < 0.1
        ? { label: "Similar", color: "text-foreground" }
        : metrics.maxDeviation < 0.25
          ? { label: "Noticeable difference", color: "text-amber-500" }
          : { label: "Very different", color: "text-amber-600" };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Difference</span>
          <span className={`text-xs font-semibold ${similarity.color}`}>{similarity.label}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Max Deviation */}
          <div className="space-y-1">
            <MetricLabel
              label="Max Deviation"
              tooltip="The largest instantaneous difference between the two curves across the entire timeline."
            />
            <MetricsBadge value={metrics.maxDeviation} />
          </div>

          {/* Avg Deviation */}
          <div className="space-y-1">
            <MetricLabel
              label="Avg Deviation"
              tooltip="The average difference between the two curves across all sampled points. Reflects overall similarity."
            />
            <MetricsBadge value={metrics.avgDeviation} />
          </div>

          {/* T90 Delta */}
          <div className="space-y-1">
            <MetricLabel
              label="T90 Delta"
              tooltip="The time difference for each curve to reach 90% progress. Positive means the current curve is slower to reach 90%."
            />
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono font-semibold bg-muted text-foreground">
              {t90DeltaMs >= 0 ? "+" : ""}
              {t90DeltaMs.toFixed(0)}ms
            </span>
          </div>

          {/* Area Diff */}
          <div className="space-y-1">
            <MetricLabel
              label="Perceived Speed"
              tooltip="Based on the area under each curve. A larger area means the animation feels faster overall because it reaches higher progress earlier."
            />
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold ${
                metrics.areaDelta > 0.01
                  ? "text-emerald-500 bg-emerald-500/10"
                  : metrics.areaDelta < -0.01
                    ? "text-amber-500 bg-amber-500/10"
                    : "bg-muted text-foreground"
              }`}
            >
              {metrics.areaDelta > 0.01
                ? "Current faster"
                : metrics.areaDelta < -0.01
                  ? "Compare faster"
                  : "Equal"}
            </span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function generateCurvePath(
  curve: { x1: number; y1: number; x2: number; y2: number },
  width: number,
  height: number,
  padding: number,
): string {
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const points: string[] = [];

  for (let i = 0; i <= CHART_SAMPLES; i++) {
    const t = i / CHART_SAMPLES;
    const y = solveCubicBezier(curve.x1, curve.y1, curve.x2, curve.y2, t);
    const px = padding + t * innerW;
    // Flip Y: progress goes up
    const py = padding + (1 - y) * innerH;
    points.push(`${i === 0 ? "M" : "L"}${px.toFixed(2)},${py.toFixed(2)}`);
  }

  return points.join(" ");
}

interface CurveOverlayChartProps {
  currentCurve: { x1: number; y1: number; x2: number; y2: number };
  compareCurve: { x1: number; y1: number; x2: number; y2: number } | null;
}

function CurveOverlayChart({ currentCurve, compareCurve }: CurveOverlayChartProps) {
  const width = 260;
  const height = 200;
  const p = CHART_PADDING;
  const innerW = width - p * 2;
  const innerH = height - p * 2;

  const currentPath = useMemo(
    () => generateCurvePath(currentCurve, width, height, p),
    [currentCurve],
  );
  const comparePath = useMemo(
    () => (compareCurve ? generateCurvePath(compareCurve, width, height, p) : null),
    [compareCurve],
  );

  return (
    <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ aspectRatio: `${width}/${height}` }}
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <g key={frac} className="text-border">
            <line
              x1={p + frac * innerW}
              y1={p}
              x2={p + frac * innerW}
              y2={p + innerH}
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="3 3"
              opacity="0.4"
            />
            <line
              x1={p}
              y1={p + frac * innerH}
              x2={p + innerW}
              y2={p + frac * innerH}
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="3 3"
              opacity="0.4"
            />
          </g>
        ))}

        {/* Axes */}
        <rect
          x={p}
          y={p}
          width={innerW}
          height={innerH}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-border"
          opacity="0.6"
        />

        {/* Diagonal reference (linear) */}
        <line
          x1={p}
          y1={p + innerH}
          x2={p + innerW}
          y2={p}
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="4 4"
          className="text-muted-foreground"
          opacity="0.3"
        />

        {/* Compare curve (rendered first so current is on top) */}
        {comparePath && (
          <path
            d={comparePath}
            fill="none"
            stroke="hsl(280, 77%, 54%)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
        )}

        {/* Current curve */}
        <path
          d={currentPath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Start / End dots - current */}
        <circle cx={p} cy={p + innerH} r="3" fill="hsl(var(--primary))" />
        <circle cx={p + innerW} cy={p} r="3" fill="hsl(var(--primary))" />

        {/* Start / End dots - compare */}
        {compareCurve && (
          <>
            <circle cx={p} cy={p + innerH} r="3" fill="hsl(280, 77%, 54%)" opacity="0.8" />
            <circle cx={p + innerW} cy={p} r="3" fill="hsl(280, 77%, 54%)" opacity="0.8" />
          </>
        )}

        {/* Axis labels */}
        <text
          x={p}
          y={height - 2}
          fontSize="8"
          fill="currentColor"
          className="text-muted-foreground"
          opacity="0.6"
        >
          0
        </text>
        <text
          x={p + innerW - 4}
          y={height - 2}
          fontSize="8"
          fill="currentColor"
          className="text-muted-foreground"
          opacity="0.6"
        >
          1
        </text>
        <text
          x={2}
          y={p + 4}
          fontSize="8"
          fill="currentColor"
          className="text-muted-foreground"
          opacity="0.6"
        >
          1
        </text>
        <text
          x={2}
          y={p + innerH + 1}
          fontSize="8"
          fill="currentColor"
          className="text-muted-foreground"
          opacity="0.6"
        >
          0
        </text>

        {/* Legend */}
        <g transform={`translate(${p + 4}, ${p + 10})`}>
          <line x1="0" y1="0" x2="12" y2="0" stroke="hsl(var(--primary))" strokeWidth="2" />
          <text
            x="16"
            y="3"
            fontSize="8"
            fill="currentColor"
            className="text-muted-foreground"
            opacity="0.8"
          >
            Current
          </text>
        </g>
        {compareCurve && (
          <g transform={`translate(${p + 4}, ${p + 22})`}>
            <line x1="0" y1="0" x2="12" y2="0" stroke="hsl(280, 77%, 54%)" strokeWidth="2" />
            <text
              x="16"
              y="3"
              fontSize="8"
              fill="currentColor"
              className="text-muted-foreground"
              opacity="0.8"
            >
              Compare
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

function ComparisonItem({
  label,
  curve,
  curveName,
  duration,
  animationKey,
  isPlaying,
  color,
}: ComparisonItemProps) {
  const bezierCSS = formatCubicBezier(curve.x1, curve.y1, curve.x2, curve.y2);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
        <span className="text-xs text-muted-foreground truncate max-w-[120px]">{curveName}</span>
      </div>

      {/* Animation track */}
      <div className="relative h-12 rounded-lg bg-muted/30 border border-border overflow-hidden">
        {/* Track line */}
        <div className="absolute inset-x-4 top-1/2 h-px bg-border" />

        {/* Moving dot */}
        <div
          key={animationKey}
          className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full shadow-md"
          style={{
            backgroundColor: color,
            left: "12px",
            animation: isPlaying
              ? `compare-slide ${duration}s ${bezierCSS} infinite alternate`
              : "none",
          }}
        />

        {/* Start/End markers */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-muted-foreground/30" />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Bezier value */}
      <div className="text-[10px] text-muted-foreground font-mono truncate">{bezierCSS}</div>
    </div>
  );
}

export function CurveComparison({
  currentCurve,
  duration,
  allCurves,
  isPlaying,
}: CurveComparisonProps) {
  const [compareCurve, setCompareCurve] = useState<EasingCurve | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  // Group curves by category for the dropdown
  const groupedCurves = useMemo(() => {
    const groups = new Map<string, EasingCurve[]>();
    CURVE_CATEGORIES.forEach((cat) => {
      if (cat.id !== "custom") {
        groups.set(cat.id, []);
      }
    });
    allCurves.forEach((curve) => {
      const category = curve.category || "classic";
      const group = groups.get(category);
      if (group) {
        group.push(curve);
      }
    });
    return groups;
  }, [allCurves]);

  const replay = () => {
    setAnimationKey((k) => k + 1);
  };

  // Popular comparison presets
  const presets = [
    { name: "linear", label: "vs Linear" },
    { name: "easeOutCubic", label: "vs Ease Out Cubic" },
    { name: "easeOutExpo", label: "vs Ease Out Expo" },
    { name: "md3-standard", label: "vs M3 Standard" },
  ];

  return (
    <div className="space-y-4">
      {/* Keyframes */}
      <style>{`
        @keyframes compare-slide {
          0% { left: 12px; }
          100% { left: calc(100% - 32px); }
        }
      `}</style>

      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Compare Curves</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={replay} title="Replay">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Overlay SVG chart */}
      <CurveOverlayChart currentCurve={currentCurve} compareCurve={compareCurve} />

      {/* Quantitative metrics */}
      {compareCurve && (
        <CurveMetrics current={currentCurve} compare={compareCurve} duration={duration} />
      )}

      {/* Current curve (Curve A) */}
      <ComparisonItem
        label="Current"
        curve={currentCurve}
        curveName="Your Curve"
        duration={duration}
        animationKey={animationKey}
        isPlaying={isPlaying}
        color="hsl(var(--primary))"
      />

      {/* Compare curve (Curve B) */}
      {compareCurve ? (
        <ComparisonItem
          label="Compare"
          curve={compareCurve}
          curveName={compareCurve.name}
          duration={duration}
          animationKey={animationKey}
          isPlaying={isPlaying}
          color="hsl(280, 77%, 54%)"
        />
      ) : (
        <div className="h-[76px] rounded-lg border-2 border-dashed border-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Select a curve to compare</span>
        </div>
      )}

      {/* Curve selector */}
      <div className="space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span className="truncate">
                {compareCurve ? compareCurve.name : "Select curve to compare"}
              </span>
              <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 max-h-64 overflow-auto">
            {/* Quick presets */}
            <DropdownMenuLabel className="text-xs">Quick Presets</DropdownMenuLabel>
            {presets.map((preset) => {
              const curve = allCurves.find((c) => c.id === preset.name);
              if (!curve) return null;
              return (
                <DropdownMenuItem
                  key={preset.name}
                  onClick={() => {
                    setCompareCurve(curve);
                    setAnimationKey((k) => k + 1);
                  }}
                >
                  {preset.label}
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuSeparator />

            {/* All curves by category */}
            {CURVE_CATEGORIES.filter((cat) => cat.id !== "custom").map((category) => {
              const curves = groupedCurves.get(category.id) || [];
              if (curves.length === 0) return null;
              return (
                <div key={category.id}>
                  <DropdownMenuLabel className="text-xs">{category.name}</DropdownMenuLabel>
                  {curves.map((curve) => (
                    <DropdownMenuItem
                      key={curve.id}
                      onClick={() => {
                        setCompareCurve(curve);
                        setAnimationKey((k) => k + 1);
                      }}
                    >
                      {curve.name}
                    </DropdownMenuItem>
                  ))}
                </div>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {compareCurve && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => setCompareCurve(null)}
          >
            Clear Comparison
          </Button>
        )}
      </div>
    </div>
  );
}
