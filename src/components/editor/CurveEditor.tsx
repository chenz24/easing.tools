import type { BezierValues } from "@/hooks/useEasingStore";
import { BezierCanvas } from "./BezierCanvas";
import { CodeExport } from "./CodeExport";
import { DurationSlider } from "./DurationSlider";
import { NumericInputs } from "./NumericInputs";

interface CurveEditorProps {
  bezier: BezierValues;
  duration: number;
  isPlaying: boolean;
  animationKey: number;
  onBezierChange: (values: Partial<BezierValues>) => void;
  onDurationChange: (duration: number) => void;
  onReset: () => void;
}

export function CurveEditor({
  bezier,
  duration,
  isPlaying,
  animationKey,
  onBezierChange,
  onDurationChange,
  onReset,
}: CurveEditorProps) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      {/* Section 1: Canvas */}
      <BezierCanvas
        bezier={bezier}
        duration={duration}
        isPlaying={isPlaying}
        animationKey={animationKey}
        onBezierChange={onBezierChange}
        onReset={onReset}
      />

      {/* Section 2: Numeric Inputs */}
      <NumericInputs bezier={bezier} onBezierChange={onBezierChange} />

      {/* Section 3: Duration Slider */}
      <DurationSlider duration={duration} onDurationChange={onDurationChange} />

      {/* Section 4: Code Export */}
      <CodeExport bezier={bezier} />
    </div>
  );
}
