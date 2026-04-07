import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { calculateSpringPoints } from "@/lib/springCurves";
import {
  type SpringFitnessLevel,
  type SpringInput,
  type SpringSceneFitness,
  getSpringSceneFitness,
} from "@/lib/springFitness";
import { type SpringSceneType, springSceneLabels } from "@/lib/springSceneTypes";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { SpringSceneDemo } from "./SpringSceneDemo";

// ── Fitness badge styles ───────────────────────────────

const fitnessStyles: Record<SpringFitnessLevel, { dot: string; text: string }> = {
  great: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  good: { dot: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
  fair: { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  poor: { dot: "bg-red-500", text: "text-red-600 dark:text-red-400" },
};

// ── Spring value interpolation ─────────────────────────

function useSpringValue(
  spring: SpringInput,
  duration: number,
  isPlaying: boolean,
  animationKey: number,
): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef<number | null>(null);

  const points = useMemo(() => {
    return calculateSpringPoints({ ...spring, duration, id: "", name: "" }, 200);
  }, [spring.mass, spring.stiffness, spring.damping, spring.velocity, duration]);

  useEffect(() => {
    startRef.current = null;
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = (timestamp - startRef.current) / 1000;
      const t = Math.min(elapsed / duration, 1);

      // Find spring value at time t
      const idx = Math.floor(t * (points.length - 1));
      const springVal = points[Math.min(idx, points.length - 1)]?.value ?? 0;
      setValue(springVal);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Loop: restart after a brief pause
        setTimeout(() => {
          startRef.current = null;
          rafRef.current = requestAnimationFrame(animate);
        }, 600);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, duration, animationKey, points]);

  return value;
}

// ── Individual Scene Preview ───────────────────────────

interface SpringScenePreviewProps {
  scene: SpringSceneType;
  spring: SpringInput;
  duration: number;
  isPlaying: boolean;
  animationKey: number;
  fitness: SpringSceneFitness;
  onClick?: () => void;
  onFitnessClick?: () => void;
}

function SpringScenePreview({
  scene,
  spring,
  duration,
  isPlaying,
  animationKey,
  fitness,
  onClick,
  onFitnessClick,
}: SpringScenePreviewProps) {
  const v = useSpringValue(spring, duration, isPlaying, animationKey);

  // ── Scene renderers ──────────────────────────────────

  const renderPullRefresh = () => {
    const indicatorY = (1 - v) * 20 - 10; // bounces from pulled down to resting
    return (
      <div className="relative h-full overflow-hidden rounded-lg bg-muted/30 p-2">
        {/* Pull indicator */}
        <div className="flex justify-center">
          <div
            className="h-6 w-6 rounded-full border-2 border-primary/50 border-t-primary"
            style={{
              transform: `translateY(${indicatorY}px) rotate(${v * 360}deg)`,
            }}
          />
        </div>
        {/* List content below */}
        <div className="mt-3 space-y-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2 rounded bg-muted/50 p-1.5">
              <div className="h-5 w-5 rounded-full bg-primary/20" />
              <div className="flex-1 space-y-1">
                <div className="h-1.5 w-3/4 rounded bg-primary/15" />
                <div className="h-1 w-1/2 rounded bg-primary/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFabExpand = () => {
    const scale = 0.3 + v * 0.7; // from small to full size
    return (
      <div className="relative h-full overflow-hidden rounded-lg bg-muted/30 p-2">
        {/* Background content */}
        <div className="h-full rounded bg-muted/50 p-2">
          <div className="space-y-1.5">
            <div className="h-2 w-3/4 rounded bg-muted" />
            <div className="h-2 w-1/2 rounded bg-muted" />
          </div>
        </div>
        {/* FAB button */}
        <div
          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg"
          style={{
            transform: `scale(${scale})`,
            opacity: clampCSS(v * 1.5),
          }}
        >
          <span className="text-primary-foreground text-lg font-bold leading-none">+</span>
        </div>
      </div>
    );
  };

  const renderCardToss = () => {
    const rotation = (v - 0.5) * 30; // oscillates around center
    const translateX = (v - 0.5) * 40;
    return (
      <div className="flex h-full items-center justify-center overflow-hidden rounded-lg bg-muted/30 p-3">
        <div
          className="w-3/5 rounded-xl bg-surface shadow-lg border border-border p-3"
          style={{
            transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
          }}
        >
          <div className="aspect-video rounded bg-primary/15 mb-2 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-primary/25" />
          </div>
          <div className="space-y-1">
            <div className="h-1.5 w-2/3 rounded bg-muted" />
            <div className="h-1 w-1/2 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  };

  const renderSwipeDismiss = () => {
    const dismissed = v; // item slides away
    return (
      <div className="flex flex-col gap-1.5 overflow-hidden rounded-lg bg-muted/30 p-2">
        {/* Static items */}
        <div className="flex items-center gap-2 rounded bg-muted/50 p-1.5">
          <div className="h-5 w-5 rounded-full bg-muted" />
          <div className="h-1.5 flex-1 rounded bg-muted" />
        </div>
        {/* Dismissing item */}
        <div
          className="flex items-center gap-2 rounded bg-red-500/20 p-1.5"
          style={{
            transform: `translateX(${dismissed * 120}%)`,
            opacity: clampCSS(1 - dismissed * 0.8),
          }}
        >
          <div className="h-5 w-5 rounded-full bg-red-400/30" />
          <div className="h-1.5 flex-1 rounded bg-red-400/20" />
        </div>
        {/* Items below that slide up */}
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded bg-muted/50 p-1.5"
            style={{
              transform: `translateY(${(1 - v) * 12}px)`,
            }}
          >
            <div className="h-5 w-5 rounded-full bg-muted" />
            <div className="h-1.5 flex-1 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  };

  const renderBottomSheet = () => {
    const sheetY = (1 - v) * 60; // slides up from bottom
    return (
      <div className="relative h-full overflow-hidden rounded-lg bg-muted/30">
        {/* Background content */}
        <div className="p-2 space-y-1.5">
          <div className="h-2 w-3/4 rounded bg-muted/50" />
          <div className="h-2 w-1/2 rounded bg-muted/50" />
        </div>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/20" style={{ opacity: clampCSS(v) }} />
        {/* Sheet */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-t-xl bg-surface shadow-xl border-t border-border"
          style={{
            transform: `translateY(${sheetY}px)`,
          }}
        >
          {/* Handle */}
          <div className="flex justify-center py-2">
            <div className="h-1 w-8 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="px-3 pb-3 space-y-1.5">
            <div className="h-2 w-1/2 rounded bg-primary/30" />
            <div className="h-2 w-full rounded bg-muted" />
            <div className="h-2 w-3/4 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  };

  const renderDragSettle = () => {
    const settleX = (v - 0.5) * 40; // oscillates horizontally around drop point
    const settleY = (1 - v) * -15; // slight vertical bounce
    return (
      <div className="relative h-full overflow-hidden rounded-lg bg-muted/30 p-2">
        {/* Drop zone grid */}
        <div className="grid grid-cols-3 gap-1.5 h-full">
          <div className="rounded bg-muted/40 border border-dashed border-muted-foreground/20" />
          {/* Drop target with settling element */}
          <div className="rounded border-2 border-dashed border-primary/40 flex items-center justify-center">
            <div
              className="h-8 w-8 rounded-lg bg-primary/60 shadow-md"
              style={{
                transform: `translate(${settleX}px, ${settleY}px)`,
              }}
            />
          </div>
          <div className="rounded bg-muted/40 border border-dashed border-muted-foreground/20" />
        </div>
      </div>
    );
  };

  const renderToggleSwitch = () => {
    const thumbX = v * 20; // slides from left to right
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          {/* Switch track */}
          <div
            className="relative h-7 w-12 rounded-full transition-colors"
            style={{
              backgroundColor: v > 0.5 ? "hsl(var(--primary))" : "hsl(var(--muted))",
            }}
          >
            {/* Switch thumb */}
            <div
              className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md"
              style={{
                transform: `translateX(${thumbX}px)`,
              }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">
            {v > 0.5 ? "ON" : "OFF"}
          </span>
        </div>
      </div>
    );
  };

  const renderModalSpring = () => {
    const scale = 0.85 + v * 0.15; // from 0.85 to 1.0 with spring
    return (
      <div className="relative h-full overflow-hidden rounded-lg bg-muted/30">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/30" style={{ opacity: clampCSS(v) }} />
        {/* Modal */}
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <div
            className="w-4/5 rounded-lg bg-surface p-3 shadow-xl"
            style={{
              transform: `scale(${scale}) translateY(${(1 - v) * 10}px)`,
              opacity: clampCSS(v),
            }}
          >
            <div className="mb-2 h-3 w-1/2 rounded bg-foreground/20" />
            <div className="space-y-1">
              <div className="h-2 w-full rounded bg-muted" />
              <div className="h-2 w-3/4 rounded bg-muted" />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <div className="h-5 w-12 rounded bg-muted" />
              <div className="h-5 w-12 rounded bg-primary/50" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderScene = () => {
    switch (scene) {
      case "pull-refresh":
        return renderPullRefresh();
      case "fab-expand":
        return renderFabExpand();
      case "card-toss":
        return renderCardToss();
      case "swipe-dismiss":
        return renderSwipeDismiss();
      case "bottom-sheet":
        return renderBottomSheet();
      case "drag-settle":
        return renderDragSettle();
      case "toggle-switch":
        return renderToggleSwitch();
      case "modal-spring":
        return renderModalSpring();
      default:
        return null;
    }
  };

  const style = fitnessStyles[fitness.level];

  return (
    <div className="flex flex-col cursor-pointer group" onClick={onClick}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted/20 border border-border transition-all group-hover:border-primary/50 group-hover:shadow-md">
        {renderScene()}
        {/* Fitness badge */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full px-1.5 py-0.5",
                  "bg-background/80 backdrop-blur-sm border border-border/50",
                  "text-[10px] font-medium leading-none cursor-pointer",
                  "hover:bg-background hover:border-border transition-colors",
                  style.text,
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onFitnessClick?.();
                }}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                {fitness.label}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px] text-xs pointer-events-auto">
              <p>{fitness.tip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="mt-2 text-center text-xs text-muted-foreground group-hover:text-foreground transition-colors">
        {springSceneLabels[scene]}
      </div>
    </div>
  );
}

// ── Utility ────────────────────────────────────────────

function clampCSS(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// ── Panel Component ────────────────────────────────────

interface SpringScenePanelProps {
  spring: SpringInput;
  duration: number;
  animationKey: number;
  isPlaying: boolean;
}

const defaultSpringScenes: SpringSceneType[] = [
  "pull-refresh",
  "fab-expand",
  "card-toss",
  "swipe-dismiss",
  "bottom-sheet",
  "drag-settle",
  "toggle-switch",
  "modal-spring",
];

export function SpringScenePanel({
  spring,
  duration,
  animationKey,
  isPlaying,
}: SpringScenePanelProps) {
  const [selectedScene, setSelectedScene] = useState<SpringSceneType | null>(null);

  const fitnessMap = useMemo(() => {
    const map = {} as Record<SpringSceneType, SpringSceneFitness>;
    for (const scene of defaultSpringScenes) {
      map[scene] = getSpringSceneFitness(scene, spring);
    }
    return map;
  }, [spring.mass, spring.stiffness, spring.damping, spring.velocity]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {defaultSpringScenes.map((scene) => (
          <SpringScenePreview
            key={scene}
            scene={scene}
            spring={spring}
            duration={duration}
            isPlaying={isPlaying}
            animationKey={animationKey}
            fitness={fitnessMap[scene]}
            onClick={() => setSelectedScene(scene)}
          />
        ))}
      </div>

      {/* Demo Sheet */}
      {selectedScene && (
        <SpringSceneDemo
          scene={selectedScene}
          spring={spring}
          duration={duration}
          open={!!selectedScene}
          onClose={() => setSelectedScene(null)}
        />
      )}
    </>
  );
}
