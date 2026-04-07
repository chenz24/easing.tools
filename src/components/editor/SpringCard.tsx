import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type SpringCurve, calculateSpringPoints } from "@/lib/springCurves";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface SpringCardProps {
  spring: SpringCurve;
  isSelected: boolean;
  onClick: () => void;
}

export function SpringCard({ spring, isSelected, onClick }: SpringCardProps) {
  const size = 60;
  const padding = 8;
  const innerSize = size - padding * 2;

  // Calculate spring curve points for preview
  const points = useMemo(() => calculateSpringPoints(spring, 30), [spring]);

  // Compute dynamic value range for proper scaling
  const valueRange = useMemo(() => {
    const values = points.map((p) => p.value);
    const minV = Math.min(0, ...values);
    const maxV = Math.max(1.1, ...values);
    const span = maxV - minV;
    const margin = span * 0.08;
    return { min: minV - margin, max: maxV + margin };
  }, [points]);

  // Generate SVG path with dynamic scaling
  const pathD = useMemo(() => {
    if (points.length === 0) return "";

    const startX = padding;
    const startY =
      size - padding - ((0 - valueRange.min) / (valueRange.max - valueRange.min)) * innerSize;

    let d = `M ${startX} ${startY}`;

    points.forEach((point) => {
      const x = padding + point.t * innerSize;
      const y =
        size -
        padding -
        ((point.value - valueRange.min) / (valueRange.max - valueRange.min)) * innerSize;
      d += ` L ${x} ${y}`;
    });

    return d;
  }, [points, innerSize, valueRange]);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "group relative flex flex-col items-center gap-2 rounded-xl bg-surface p-3 transition-all hover:bg-surface-hover",
              isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            )}
          >
            {/* Spring Preview */}
            <div className="relative h-[60px] w-[60px] rounded-lg bg-background/50">
              <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="overflow-visible"
              >
                {/* Grid dots */}
                {[0.25, 0.5, 0.75].map((t) => (
                  <g key={t}>
                    <circle
                      cx={padding + t * innerSize}
                      cy={size - padding}
                      r={1}
                      className="fill-muted-foreground/30"
                    />
                    <circle
                      cx={padding}
                      cy={size - padding - t * innerSize}
                      r={1}
                      className="fill-muted-foreground/30"
                    />
                  </g>
                ))}

                {/* Baseline at y=1 */}
                <line
                  x1={padding}
                  y1={
                    size -
                    padding -
                    ((1 - valueRange.min) / (valueRange.max - valueRange.min)) * innerSize
                  }
                  x2={size - padding}
                  y2={
                    size -
                    padding -
                    ((1 - valueRange.min) / (valueRange.max - valueRange.min)) * innerSize
                  }
                  className="stroke-muted-foreground/20"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />

                {/* Spring curve */}
                <path
                  d={pathD}
                  fill="none"
                  strokeWidth={2}
                  className="stroke-primary"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Start point */}
                <circle
                  cx={padding}
                  cy={
                    size -
                    padding -
                    ((0 - valueRange.min) / (valueRange.max - valueRange.min)) * innerSize
                  }
                  r={2}
                  className="fill-muted-foreground"
                />
              </svg>

              {/* Duration badge */}
              <span className="absolute bottom-1 right-1 rounded bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground">
                {spring.duration.toFixed(1)}s
              </span>
            </div>

            {/* Spring name */}
            <span className="max-w-full truncate text-xs text-muted-foreground group-hover:text-foreground">
              {spring.name}
            </span>

            {/* Selected indicator */}
            {isSelected && (
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                selected
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p className="font-medium">{spring.name}</p>
          <p className="text-muted-foreground">
            mass: {spring.mass}, stiffness: {spring.stiffness}
          </p>
          <p className="text-muted-foreground">
            damping: {spring.damping}, velocity: {spring.velocity}
          </p>
          <p className="text-muted-foreground">Duration: {spring.duration}s</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
