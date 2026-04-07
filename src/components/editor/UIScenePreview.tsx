import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCubicBezier } from "@/lib/easingCurves";
import {
  type CurveInput,
  type FitnessLevel,
  type SceneFitness,
  getSceneFitness,
} from "@/lib/sceneFitness";
import { type UISceneType, uiSceneLabels } from "@/lib/uiSceneTypes";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { FitnessDetailDialog } from "./FitnessDetailDialog";
import { UISceneDemo } from "./UISceneDemo";

const fitnessStyles: Record<FitnessLevel, { dot: string; text: string }> = {
  great: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  good: { dot: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
  fair: { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  poor: { dot: "bg-red-500", text: "text-red-600 dark:text-red-400" },
};

interface UIScenePreviewProps {
  scene: UISceneType;
  bezierCSS: string;
  duration: number;
  isPlaying: boolean;
  animationKey: number;
  fitness: SceneFitness;
  onClick?: () => void;
  onFitnessClick?: () => void;
}

// Individual scene component
function UIScenePreview({
  scene,
  bezierCSS,
  duration,
  isPlaying,
  animationKey,
  fitness,
  onClick,
  onFitnessClick,
}: UIScenePreviewProps) {
  const getAnimationStyle = (delay = 0): React.CSSProperties => ({
    animationTimingFunction: bezierCSS,
    animationDuration: `${duration}s`,
    animationIterationCount: "infinite",
    animationDirection: "alternate",
    animationPlayState: isPlaying ? "running" : "paused",
    animationDelay: `${delay}s`,
  });

  // List Loading Scene
  const renderListLoading = () => (
    <div className="flex flex-col gap-2 p-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={`${animationKey}-${i}`}
          className="flex items-center gap-3 rounded-lg bg-muted/50 p-2"
          style={{
            ...getAnimationStyle(i * 0.08),
            animationName: "scene-list-slide",
          }}
        >
          <div className="h-8 w-8 rounded-full bg-primary/30" />
          <div className="flex-1 space-y-1">
            <div className="h-2.5 w-3/4 rounded bg-primary/20" />
            <div className="h-2 w-1/2 rounded bg-primary/10" />
          </div>
        </div>
      ))}
    </div>
  );

  // Drawer Scene
  const renderDrawer = () => (
    <div className="relative h-full overflow-hidden rounded-lg bg-muted/30 p-2">
      {/* Main content area */}
      <div className="h-full rounded bg-muted/50 p-2">
        <div className="space-y-2">
          <div className="h-2 w-3/4 rounded bg-muted" />
          <div className="h-2 w-1/2 rounded bg-muted" />
        </div>
      </div>
      {/* Drawer panel */}
      <div
        key={animationKey}
        className="absolute left-0 top-0 h-full w-2/3 rounded-r-lg bg-surface shadow-lg border-r border-border"
        style={{
          ...getAnimationStyle(),
          animationName: "scene-drawer-slide",
        }}
      >
        <div className="p-2 space-y-2">
          <div className="h-3 w-1/2 rounded bg-primary/30" />
          <div className="h-2 w-full rounded bg-muted" />
          <div className="h-2 w-full rounded bg-muted" />
          <div className="h-2 w-3/4 rounded bg-muted" />
        </div>
      </div>
    </div>
  );

  // Skeleton Scene
  const renderSkeleton = () => (
    <div className="flex flex-col gap-3 p-3">
      {/* Card skeleton */}
      <div className="relative overflow-hidden rounded-lg bg-muted/50 p-3">
        <div className="flex gap-3">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-2 w-1/2 rounded bg-muted" />
          </div>
        </div>
        {/* Shimmer overlay */}
        <div
          key={animationKey}
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{
            ...getAnimationStyle(),
            animationName: "scene-skeleton-shimmer",
            animationDirection: "normal",
          }}
        />
      </div>
      {/* Text skeleton */}
      <div className="relative overflow-hidden rounded-lg bg-muted/50 p-3">
        <div className="space-y-2">
          <div className="h-2.5 w-full rounded bg-muted" />
          <div className="h-2.5 w-full rounded bg-muted" />
          <div className="h-2.5 w-2/3 rounded bg-muted" />
        </div>
        <div
          key={`${animationKey}-2`}
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{
            ...getAnimationStyle(0.15),
            animationName: "scene-skeleton-shimmer",
            animationDirection: "normal",
          }}
        />
      </div>
    </div>
  );

  // Button Hover Scene
  const renderButtonHover = () => (
    <div className="flex h-full items-center justify-center p-4">
      <button
        key={animationKey}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        style={{
          ...getAnimationStyle(),
          animationName: "scene-button-hover",
        }}
      >
        Click Me
      </button>
    </div>
  );

  // Modal Scene
  const renderModal = () => (
    <div className="relative h-full overflow-hidden rounded-lg bg-muted/30">
      {/* Backdrop */}
      <div
        key={`${animationKey}-backdrop`}
        className="absolute inset-0 bg-black/30"
        style={{
          ...getAnimationStyle(),
          animationName: "scene-modal-backdrop",
        }}
      />
      {/* Modal dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-2">
        <div
          key={animationKey}
          className="w-4/5 rounded-lg bg-surface p-3 shadow-xl"
          style={{
            ...getAnimationStyle(),
            animationName: "scene-modal-dialog",
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

  // Toast Scene
  const renderToast = () => (
    <div className="relative h-full overflow-hidden rounded-lg bg-muted/30 p-2">
      {/* Page content */}
      <div className="h-full rounded bg-muted/50 p-2">
        <div className="space-y-2">
          <div className="h-2 w-3/4 rounded bg-muted" />
          <div className="h-2 w-1/2 rounded bg-muted" />
        </div>
      </div>
      {/* Toast notification */}
      <div
        key={animationKey}
        className="absolute bottom-2 right-2 left-2 rounded-lg bg-foreground p-2 shadow-lg"
        style={{
          ...getAnimationStyle(),
          animationName: "scene-toast-slide",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-green-500" />
          <div className="h-2 flex-1 rounded bg-background/30" />
        </div>
      </div>
    </div>
  );

  // Tab Switch Scene
  const renderTabSwitch = () => (
    <div className="flex h-full flex-col items-center justify-center p-3">
      <div className="relative flex w-full rounded-lg bg-muted/50 p-1">
        {["Tab 1", "Tab 2", "Tab 3"].map((label, i) => (
          <div
            key={i}
            className="z-10 flex-1 py-1.5 text-center text-[10px] font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}
        {/* Sliding indicator */}
        <div
          key={animationKey}
          className="absolute top-1 bottom-1 w-1/3 rounded-md bg-surface shadow-sm"
          style={{
            ...getAnimationStyle(),
            animationName: "scene-tab-slide",
          }}
        />
      </div>
      <div className="mt-3 w-full space-y-1.5">
        <div className="h-2 w-full rounded bg-muted/40" />
        <div className="h-2 w-3/4 rounded bg-muted/40" />
      </div>
    </div>
  );

  // Accordion Scene
  const renderAccordion = () => (
    <div className="flex flex-col gap-1.5 p-3">
      {/* Collapsed item */}
      <div className="rounded-lg bg-muted/50 px-2.5 py-2">
        <div className="flex items-center justify-between">
          <div className="h-2 w-1/2 rounded bg-muted" />
          <div className="h-2 w-2 rounded bg-muted" />
        </div>
      </div>
      {/* Expanding item */}
      <div className="rounded-lg bg-muted/50 px-2.5 py-2">
        <div className="flex items-center justify-between">
          <div className="h-2 w-2/3 rounded bg-primary/30" />
          <div className="h-2 w-2 rounded bg-primary/30" />
        </div>
        <div
          key={animationKey}
          className="overflow-hidden"
          style={{
            ...getAnimationStyle(),
            animationName: "scene-accordion-expand",
          }}
        >
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full rounded bg-muted/80" />
            <div className="h-1.5 w-4/5 rounded bg-muted/80" />
          </div>
        </div>
      </div>
      {/* Collapsed item */}
      <div className="rounded-lg bg-muted/50 px-2.5 py-2">
        <div className="flex items-center justify-between">
          <div className="h-2 w-1/3 rounded bg-muted" />
          <div className="h-2 w-2 rounded bg-muted" />
        </div>
      </div>
    </div>
  );

  // Page Transition Scene
  const renderPageTransition = () => (
    <div className="relative h-full overflow-hidden rounded-lg bg-muted/30">
      {/* Old page (static) */}
      <div className="absolute inset-0 p-2">
        <div className="h-3 w-1/2 rounded bg-muted/50 mb-2" />
        <div className="space-y-1">
          <div className="h-2 w-full rounded bg-muted/30" />
          <div className="h-2 w-3/4 rounded bg-muted/30" />
        </div>
      </div>
      {/* New page sliding in */}
      <div
        key={animationKey}
        className="absolute inset-0 bg-surface p-2"
        style={{
          ...getAnimationStyle(),
          animationName: "scene-page-slide",
        }}
      >
        <div className="h-3 w-2/3 rounded bg-primary/25 mb-2" />
        <div className="space-y-1">
          <div className="h-2 w-full rounded bg-muted" />
          <div className="h-2 w-5/6 rounded bg-muted" />
          <div className="h-2 w-2/3 rounded bg-muted" />
        </div>
      </div>
    </div>
  );

  // Tooltip Scene
  const renderTooltip = () => (
    <div className="flex h-full items-center justify-center p-4">
      <div className="relative">
        {/* Trigger element */}
        <div className="rounded-md bg-muted/50 px-4 py-2">
          <div className="h-2 w-12 rounded bg-muted" />
        </div>
        {/* Tooltip bubble */}
        <div
          key={animationKey}
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5"
          style={{
            ...getAnimationStyle(),
            animationName: "scene-tooltip-pop",
            transformOrigin: "center bottom",
          }}
        >
          <div className="rounded-md bg-foreground px-2.5 py-1.5 shadow-lg">
            <div className="h-1.5 w-16 rounded bg-background/30" />
          </div>
          {/* Arrow */}
          <div className="mx-auto h-0 w-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-foreground" />
        </div>
      </div>
    </div>
  );

  // Carousel Scene
  const renderCarousel = () => (
    <div className="relative h-full overflow-hidden rounded-lg bg-muted/30 p-2">
      <div className="flex h-full gap-2">
        {/* Current slide */}
        <div
          key={animationKey}
          className="flex-none w-full h-full flex flex-col items-center justify-center"
          style={{
            ...getAnimationStyle(),
            animationName: "scene-carousel-slide",
          }}
        >
          <div className="w-3/4 aspect-video rounded-lg bg-primary/15 mb-2 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-primary/25" />
          </div>
          <div className="flex gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
            <div className="h-1.5 w-1.5 rounded-full bg-muted" />
            <div className="h-1.5 w-1.5 rounded-full bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderScene = () => {
    switch (scene) {
      case "list-loading":
        return renderListLoading();
      case "drawer":
        return renderDrawer();
      case "skeleton":
        return renderSkeleton();
      case "button-hover":
        return renderButtonHover();
      case "modal":
        return renderModal();
      case "toast":
        return renderToast();
      case "tab-switch":
        return renderTabSwitch();
      case "accordion":
        return renderAccordion();
      case "page-transition":
        return renderPageTransition();
      case "tooltip":
        return renderTooltip();
      case "carousel":
        return renderCarousel();
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
              <button
                className="text-primary hover:underline mt-1 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onFitnessClick?.();
                }}
              >
                Click for details
              </button>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="mt-2 text-center text-xs text-muted-foreground group-hover:text-foreground transition-colors">
        {uiSceneLabels[scene]}
      </div>
    </div>
  );
}

// Panel component that renders all UI scenes
interface UIScenePanelProps {
  bezier: { x1: number; y1: number; x2: number; y2: number };
  duration: number;
  animationKey: number;
  isPlaying: boolean;
  curveInput?: CurveInput;
}

const defaultScenes: UISceneType[] = [
  "list-loading",
  "drawer",
  "skeleton",
  "button-hover",
  "modal",
  "toast",
  "tab-switch",
  "accordion",
  "page-transition",
  "tooltip",
  "carousel",
];

export function UIScenePanel({
  bezier,
  duration,
  animationKey,
  isPlaying,
  curveInput,
}: UIScenePanelProps) {
  const [selectedScene, setSelectedScene] = useState<UISceneType | null>(null);
  const [fitnessDetailScene, setFitnessDetailScene] = useState<UISceneType | null>(null);
  const bezierCSS = formatCubicBezier(bezier.x1, bezier.y1, bezier.x2, bezier.y2);

  const fitnessMap = useMemo(() => {
    const map = {} as Record<UISceneType, SceneFitness>;
    const input = curveInput ?? bezier;
    for (const scene of defaultScenes) {
      map[scene] = getSceneFitness(scene, input, duration);
    }
    return map;
  }, [bezier.x1, bezier.y1, bezier.x2, bezier.y2, duration, curveInput]);

  return (
    <>
      {/* Scene-specific keyframes */}
      <style>{`
        @keyframes scene-list-slide {
          0% { transform: translateX(-100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes scene-drawer-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
        @keyframes scene-skeleton-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes scene-button-hover {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--primary), 0.3); }
          100% { transform: scale(1.05); box-shadow: 0 4px 20px rgba(var(--primary), 0.4); }
        }
        @keyframes scene-modal-backdrop {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes scene-modal-dialog {
          0% { transform: scale(0.9) translateY(10px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes scene-toast-slide {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes scene-tab-slide {
          0% { left: 4px; }
          100% { left: calc(66.666% + 4px); }
        }
        @keyframes scene-accordion-expand {
          0% { max-height: 0; opacity: 0; }
          100% { max-height: 60px; opacity: 1; }
        }
        @keyframes scene-page-slide {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes scene-tooltip-pop {
          0% { transform: translateX(-50%) scale(0.7); opacity: 0; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        @keyframes scene-carousel-slide {
          0% { transform: translateX(100%); }
          100% { transform: translateX(0); }
        }
      `}</style>

      <div className="grid grid-cols-2 gap-4">
        {defaultScenes.map((scene) => (
          <UIScenePreview
            key={scene}
            scene={scene}
            bezierCSS={bezierCSS}
            duration={duration}
            isPlaying={isPlaying}
            animationKey={animationKey}
            fitness={fitnessMap[scene]}
            onClick={() => setSelectedScene(scene)}
            onFitnessClick={() => setFitnessDetailScene(scene)}
          />
        ))}
      </div>

      {/* Demo Modal */}
      {selectedScene && (
        <UISceneDemo
          scene={selectedScene}
          bezier={bezier}
          duration={duration}
          open={!!selectedScene}
          onClose={() => setSelectedScene(null)}
        />
      )}

      {/* Fitness Detail Dialog */}
      {fitnessDetailScene && (
        <FitnessDetailDialog
          open={!!fitnessDetailScene}
          onClose={() => setFitnessDetailScene(null)}
          scene={fitnessDetailScene}
          fitness={fitnessMap[fitnessDetailScene]}
        />
      )}
    </>
  );
}
