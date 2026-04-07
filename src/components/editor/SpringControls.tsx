import { Slider } from "@/components/ui/slider";
import type { SpringValues } from "@/hooks/useSpringStore";

interface SpringControlsProps {
  spring: SpringValues;
  onSpringChange: (values: Partial<SpringValues>) => void;
}

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

function SliderInput({ label, value, onChange, min = 0, max = 1, step = 0.01 }: SliderInputProps) {
  const handleSliderChange = (values: number[]) => {
    onChange(values[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number.parseFloat(e.target.value);
    if (!Number.isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
  };

  // Format display value based on step precision
  const displayValue = step >= 1 ? value.toString() : value.toFixed(step >= 0.1 ? 1 : 2);

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-sm text-muted-foreground">{label}</span>
      <div className="flex-1">
        <Slider
          value={[value]}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />
      </div>
      <input
        type="number"
        step={step}
        value={displayValue}
        onChange={handleInputChange}
        className="w-[4.5rem] rounded bg-muted/50 px-2 py-1 text-right font-mono text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
      />
    </div>
  );
}

export function SpringControls({ spring, onSpringChange }: SpringControlsProps) {
  return (
    <div className="flex flex-col gap-3">
      <SliderInput
        label="Mass"
        value={spring.mass}
        onChange={(value) => onSpringChange({ mass: value })}
        min={0.01}
        max={2}
        step={0.01}
      />
      <SliderInput
        label="Stiffness"
        value={spring.stiffness}
        onChange={(value) => onSpringChange({ stiffness: value })}
        min={0.05}
        max={20}
        step={0.01}
      />
      <SliderInput
        label="Damping"
        value={spring.damping}
        onChange={(value) => onSpringChange({ damping: value })}
        min={0.05}
        max={10}
        step={0.01}
      />
      <SliderInput
        label="Initial Velocity"
        value={spring.velocity}
        onChange={(value) => onSpringChange({ velocity: value })}
        min={0}
        max={10}
        step={0.01}
      />
    </div>
  );
}
