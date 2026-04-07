import type { SpringValues } from "@/hooks/useSpringStore";
import { SpringCanvas } from "./SpringCanvas";
import { SpringControls } from "./SpringControls";
import { SpringCodeExport } from "./SpringExportDropdown";

interface SpringEditorProps {
  spring: SpringValues;
  duration: number;
  isPlaying: boolean;
  animationKey: number;
  onSpringChange: (values: Partial<SpringValues>) => void;
  onReset: () => void;
}

export function SpringEditor({
  spring,
  duration,
  isPlaying,
  animationKey,
  onSpringChange,
  onReset,
}: SpringEditorProps) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      {/* Section 1: Canvas */}
      <SpringCanvas
        spring={spring}
        duration={duration}
        isPlaying={isPlaying}
        animationKey={animationKey}
        onReset={onReset}
      />

      {/* Section 2: Spring Controls */}
      <SpringControls spring={spring} onSpringChange={onSpringChange} />

      {/* Section 3: Code Export */}
      <SpringCodeExport spring={spring} />
    </div>
  );
}
