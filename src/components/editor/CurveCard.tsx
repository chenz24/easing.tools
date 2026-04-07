import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { EasingCurve } from "@/lib/easingCurves";
import { cn } from "@/lib/utils";

interface CurveCardProps {
  curve: EasingCurve;
  isSelected: boolean;
  onClick: () => void;
}

export function CurveCard({ curve, isSelected, onClick }: CurveCardProps) {
  // Generate SVG path for bezier curve
  const size = 60;
  const padding = 8;
  const innerSize = size - padding * 2;

  const x1 = padding + curve.x1 * innerSize;
  const y1 = size - padding - curve.y1 * innerSize;
  const x2 = padding + curve.x2 * innerSize;
  const y2 = size - padding - curve.y2 * innerSize;

  const pathD = `M ${padding} ${size - padding} C ${x1} ${y1}, ${x2} ${y2}, ${size - padding} ${padding}`;

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
            {/* Curve Preview */}
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

                {/* Bezier curve */}
                <path
                  d={pathD}
                  fill="none"
                  strokeWidth={2}
                  className="stroke-primary"
                  strokeLinecap="round"
                />

                {/* Start and end points */}
                <circle cx={padding} cy={size - padding} r={2} className="fill-muted-foreground" />
                <circle cx={size - padding} cy={padding} r={2} className="fill-muted-foreground" />
              </svg>

              {/* Duration badge */}
              <span className="absolute bottom-1 right-1 rounded bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground">
                {curve.duration.toFixed(1)}s
              </span>
            </div>

            {/* Curve name */}
            <span className="max-w-full truncate text-xs text-muted-foreground group-hover:text-foreground">
              {curve.name}
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
          <p className="font-medium">{curve.name}</p>
          <p className="text-muted-foreground">
            cubic-bezier({curve.x1}, {curve.y1}, {curve.x2}, {curve.y2})
          </p>
          <p className="text-muted-foreground">Duration: {curve.duration}s</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
