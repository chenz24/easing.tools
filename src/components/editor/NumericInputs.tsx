import { Slider } from "@/components/ui/slider";
import type { BezierValues } from "@/hooks/useEasingStore";

interface NumericInputsProps {
  bezier: BezierValues;
  onBezierChange: (values: Partial<BezierValues>) => void;
  duration?: number;
  onDurationChange?: (value: number) => void;
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
    onChange(Math.round(values[0] * 100) / 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number.parseFloat(e.target.value);
    if (!Number.isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="w-12 text-sm text-muted-foreground">{label}</span>
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
        value={value.toFixed(2)}
        onChange={handleInputChange}
        className="w-[4.5rem] rounded bg-muted/50 px-2 py-1 text-right font-mono text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
      />
    </div>
  );
}

export function NumericInputs({
  bezier,
  onBezierChange,
  duration,
  onDurationChange,
}: NumericInputsProps) {
  return (
    <div className="flex flex-col gap-3">
      <SliderInput
        label="x1"
        value={bezier.x1}
        onChange={(value) => onBezierChange({ x1: value })}
        min={0}
        max={1}
      />
      <SliderInput
        label="y1"
        value={bezier.y1}
        onChange={(value) => onBezierChange({ y1: value })}
        min={-1}
        max={2}
      />
      <SliderInput
        label="x2"
        value={bezier.x2}
        onChange={(value) => onBezierChange({ x2: value })}
        min={0}
        max={1}
      />
      <SliderInput
        label="y2"
        value={bezier.y2}
        onChange={(value) => onBezierChange({ y2: value })}
        min={-1}
        max={2}
      />
      {duration !== undefined && onDurationChange && (
        <SliderInput
          label="Duration"
          value={duration}
          onChange={onDurationChange}
          min={0.1}
          max={5}
          step={0.1}
        />
      )}
    </div>
  );
}
