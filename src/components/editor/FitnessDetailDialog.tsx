import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FitnessLevel, SceneFitness } from "@/lib/sceneFitness";
import { type UISceneType, uiSceneLabels } from "@/lib/uiSceneTypes";
import { cn } from "@/lib/utils";

const levelColors: Record<FitnessLevel, string> = {
  great: "bg-emerald-500",
  good: "bg-blue-500",
  fair: "bg-amber-500",
  poor: "bg-red-500",
};

interface ScoreBarProps {
  label: string;
  value: number; // 0-1
  weight: number;
}

function ScoreBar({ label, value, weight }: ScoreBarProps) {
  const percentage = Math.round(value * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {percentage}%
          <span className="text-muted-foreground/60 ml-1">×{Math.round(weight * 100)}%</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface FitnessDetailDialogProps {
  open: boolean;
  onClose: () => void;
  scene: UISceneType;
  fitness: SceneFitness;
}

export function FitnessDetailDialog({ open, onClose, scene, fitness }: FitnessDetailDialogProps) {
  const totalPercentage = Math.round(fitness.scores.total * 100);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            Fitness Details
          </DialogTitle>
          <DialogDescription>{uiSceneLabels[scene]}</DialogDescription>
        </DialogHeader>

        {/* Overall Score */}
        <div className="flex items-center gap-3 py-2">
          <div className="text-3xl font-bold tabular-nums">{totalPercentage}</div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">/ 100</span>
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", levelColors[fitness.level])} />
              <span className="text-sm font-medium">{fitness.label}</span>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3 py-2">
          <ScoreBar
            label="Curve Fit"
            value={fitness.scores.curveFit}
            weight={fitness.weights.curve}
          />
          <ScoreBar
            label="Duration"
            value={fitness.scores.duration}
            weight={fitness.weights.duration}
          />
          <ScoreBar
            label="Stability"
            value={fitness.scores.stability}
            weight={fitness.weights.stability}
          />
        </div>

        {/* Methodology */}
        <div className="border-t pt-3 space-y-2">
          <h4 className="text-sm font-medium">How We Score</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ratings are derived by analyzing curve characteristics (velocity profile, ease-in/out
            balance, stability) against design system guidelines from Material Design, Apple HIG,
            and IBM Carbon.
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
            <span>⚠️</span>
            <span>
              Ratings are for reference only. Always validate animations with real user testing.
            </span>
          </p>
        </div>

        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
