import { Slider } from "@/components/ui/slider";
import { Rabbit, Turtle } from "lucide-react";

interface DurationSliderProps {
  duration: number;
  onDurationChange: (duration: number) => void;
}

export function DurationSlider({ duration, onDurationChange }: DurationSliderProps) {
  return (
    <div className="rounded-xl bg-muted/30 p-4">
      {/* Duration badge */}
      <div className="mb-3 flex justify-center">
        <span className="rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
          {duration.toFixed(1)}s
        </span>
      </div>

      {/* Slider with icons */}
      <div className="flex items-center gap-3">
        <Turtle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <Slider
          value={[duration]}
          min={0.1}
          max={3.0}
          step={0.1}
          onValueChange={([value]) => onDurationChange(value)}
          className="cursor-pointer"
        />
        <Rabbit className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      </div>
    </div>
  );
}
