import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { calculateSpringPoints } from "@/lib/springCurves";
import type { SpringInput } from "@/lib/springFitness";
import { type SpringSceneType, springSceneLabels } from "@/lib/springSceneTypes";
import { ArrowLeft, GripVertical, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface SpringSceneDemoProps {
  scene: SpringSceneType;
  spring: SpringInput;
  duration: number;
  open: boolean;
  onClose: () => void;
}

// ── Spring animation hook for demos ────────────────────

function useSpringAnimation(spring: SpringInput, duration: number, trigger: number): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef<number | null>(null);

  const points = useMemo(() => {
    return calculateSpringPoints({ ...spring, duration, id: "", name: "" }, 200);
  }, [spring.mass, spring.stiffness, spring.damping, spring.velocity, duration]);

  useEffect(() => {
    if (trigger === 0) return;
    startRef.current = null;
    setValue(0);

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = (timestamp - startRef.current) / 1000;
      const t = Math.min(elapsed / duration, 1);
      const idx = Math.floor(t * (points.length - 1));
      setValue(points[Math.min(idx, points.length - 1)]?.value ?? 0);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [trigger, duration, points]);

  return value;
}

// ── Main Demo Component ────────────────────────────────

export function SpringSceneDemo({ scene, spring, duration, open, onClose }: SpringSceneDemoProps) {
  const renderDemo = () => {
    switch (scene) {
      case "pull-refresh":
        return <PullRefreshDemo spring={spring} duration={duration} />;
      case "fab-expand":
        return <FabExpandDemo spring={spring} duration={duration} />;
      case "card-toss":
        return <CardTossDemo spring={spring} duration={duration} />;
      case "swipe-dismiss":
        return <SwipeDismissDemo spring={spring} duration={duration} />;
      case "bottom-sheet":
        return <BottomSheetDemo spring={spring} duration={duration} />;
      case "drag-settle":
        return <DragSettleDemo spring={spring} duration={duration} />;
      case "toggle-switch":
        return <ToggleSwitchDemo spring={spring} duration={duration} />;
      case "modal-spring":
        return <ModalSpringDemo spring={spring} duration={duration} />;
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full max-w-lg sm:max-w-xl flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {springSceneLabels[scene]} Demo
            </SheetTitle>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-auto p-6">
          <div className="rounded-xl border border-border bg-muted/20 p-6 min-h-[300px]">
            {renderDemo()}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Demo Props ─────────────────────────────────────────

interface DemoProps {
  spring: SpringInput;
  duration: number;
}

// ── Pull to Refresh Demo ───────────────────────────────

function PullRefreshDemo({ spring, duration }: DemoProps) {
  const [trigger, setTrigger] = useState(0);
  const v = useSpringAnimation(spring, duration, trigger);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Pull to Refresh</h3>
        <Button
          onClick={() => setTrigger((k) => k + 1)}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Trigger Refresh
        </Button>
      </div>

      <div className="relative rounded-lg bg-surface border border-border overflow-hidden h-72">
        {/* Spinner */}
        <div
          className="flex justify-center pt-4"
          style={{
            transform: `translateY(${(1 - v) * 30 - 15}px)`,
            opacity: trigger > 0 ? Math.min(v * 2, 1) : 0,
          }}
        >
          <div
            className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary"
            style={{ transform: `rotate(${v * 720}deg)` }}
          />
        </div>

        {/* Content list */}
        <div className="p-3 space-y-2 mt-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/30 p-2.5">
              <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">U{i + 1}</span>
              </div>
              <div className="flex-1 space-y-1">
                <div className="h-2.5 w-3/4 rounded bg-muted" />
                <div className="h-2 w-1/2 rounded bg-muted/70" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Click &quot;Trigger Refresh&quot; to see the spinner bounce back with spring physics.
      </p>
    </div>
  );
}

// ── FAB Expand Demo ────────────────────────────────────

function FabExpandDemo({ spring, duration }: DemoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [trigger, setTrigger] = useState(0);
  const v = useSpringAnimation(spring, duration, trigger);

  const toggle = () => {
    setIsOpen(!isOpen);
    setTrigger((k) => k + 1);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Floating Action Button</h3>
        <p className="text-xs text-muted-foreground">
          Click the FAB to see it expand with spring animation.
        </p>
      </div>

      <div className="relative rounded-lg bg-surface border border-border h-72 overflow-hidden">
        {/* Background content */}
        <div className="p-4 space-y-2">
          <div className="h-3 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted" />
        </div>

        {/* Mini FABs */}
        {isOpen &&
          ["Edit", "Share", "Delete"].map((label, i) => {
            const itemV = Math.max(0, v - i * 0.1);
            return (
              <div
                key={label}
                className="absolute right-5 flex items-center gap-2"
                style={{
                  bottom: `${72 + (i + 1) * 52 * Math.min(itemV, 1)}px`,
                  opacity: Math.min(itemV * 2, 1),
                  transform: `scale(${0.5 + Math.min(itemV, 1) * 0.5})`,
                }}
              >
                <span className="text-xs text-muted-foreground bg-surface px-2 py-1 rounded shadow-sm border border-border">
                  {label}
                </span>
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shadow-md">
                  <span className="text-secondary-foreground text-sm">{label[0]}</span>
                </div>
              </div>
            );
          })}

        {/* Main FAB */}
        <button
          className="absolute bottom-4 right-5 h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          onClick={toggle}
          style={{
            transform: isOpen ? `rotate(${v * 45}deg)` : "rotate(0deg)",
          }}
        >
          <span className="text-primary-foreground text-2xl font-light leading-none">+</span>
        </button>
      </div>
    </div>
  );
}

// ── Card Toss Demo ─────────────────────────────────────

function CardTossDemo({ spring, duration }: DemoProps) {
  const [trigger, setTrigger] = useState(0);
  const v = useSpringAnimation(spring, duration, trigger);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Card Toss</h3>
        <Button
          onClick={() => setTrigger((k) => k + 1)}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Toss Card
        </Button>
      </div>

      <div className="flex items-center justify-center h-64 overflow-hidden">
        <div
          className="w-48 rounded-xl bg-surface shadow-xl border border-border p-4"
          style={{
            transform: `translateX(${(v - 0.5) * 80}px) rotate(${(v - 0.5) * 25}deg)`,
          }}
        >
          <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 mb-3 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-primary/30" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-2/3 rounded bg-muted" />
            <div className="h-2 w-1/2 rounded bg-muted/70" />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        The card tosses and settles with spring oscillation. Notice the bounce pattern from your
        spring curve.
      </p>
    </div>
  );
}

// ── Swipe Dismiss Demo ─────────────────────────────────

function SwipeDismissDemo({ spring, duration }: DemoProps) {
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [trigger, setTrigger] = useState(0);
  const [currentDismiss, setCurrentDismiss] = useState(-1);
  const v = useSpringAnimation(spring, duration, trigger);

  const dismissItem = (index: number) => {
    if (dismissed.includes(index)) return;
    setCurrentDismiss(index);
    setTrigger((k) => k + 1);
    setTimeout(() => {
      setDismissed((prev) => [...prev, index]);
    }, duration * 1000);
  };

  const reset = () => {
    setDismissed([]);
    setCurrentDismiss(-1);
  };

  const items = ["Buy groceries", "Call dentist", "Review PR #42", "Team standup", "Update docs"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Swipe to Dismiss</h3>
        <Button onClick={reset} size="sm" variant="outline" className="gap-2">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => {
          if (dismissed.includes(i)) return null;
          const isDismissing = currentDismiss === i && !dismissed.includes(i);
          return (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg bg-surface border border-border p-3 cursor-pointer group"
              style={
                isDismissing
                  ? {
                      transform: `translateX(${v * 120}%)`,
                      opacity: Math.max(0, 1 - v),
                    }
                  : undefined
              }
              onClick={() => dismissItem(i)}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-sm flex-1">{item}</span>
              <X className="h-4 w-4 text-muted-foreground/0 group-hover:text-red-400 transition-colors" />
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Click an item to dismiss it with spring animation.
      </p>
    </div>
  );
}

// ── Bottom Sheet Demo ──────────────────────────────────

function BottomSheetDemo({ spring, duration }: DemoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [trigger, setTrigger] = useState(0);
  const v = useSpringAnimation(spring, duration, trigger);

  const toggle = () => {
    setIsOpen(!isOpen);
    setTrigger((k) => k + 1);
  };

  const sheetV = isOpen ? v : 1 - v;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Bottom Sheet</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Click the button to open/close the bottom sheet with spring snapping.
        </p>
      </div>

      <div className="relative rounded-lg bg-muted/30 border border-border h-72 overflow-hidden">
        {/* Background */}
        <div className="p-4 space-y-2">
          <div className="h-3 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
        <div className="flex justify-center pt-4">
          <Button size="sm" onClick={toggle}>
            {isOpen ? "Close Sheet" : "Open Sheet"}
          </Button>
        </div>

        {/* Backdrop */}
        {trigger > 0 && (
          <div
            className="absolute inset-0 bg-black/30"
            style={{ opacity: isOpen ? sheetV : 0 }}
            onClick={toggle}
          />
        )}

        {/* Sheet */}
        {trigger > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-surface shadow-2xl border-t border-border"
            style={{
              transform: `translateY(${(1 - sheetV) * 100}%)`,
            }}
          >
            <div className="flex justify-center py-3">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="px-4 pb-6 space-y-3">
              <div className="h-4 w-1/3 rounded bg-foreground/20" />
              {["Option 1", "Option 2", "Option 3"].map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/15" />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Drag & Drop Settle Demo ────────────────────────────

function DragSettleDemo({ spring, duration }: DemoProps) {
  const [trigger, setTrigger] = useState(0);
  const v = useSpringAnimation(spring, duration, trigger);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Drag & Drop</h3>
        <Button
          onClick={() => setTrigger((k) => k + 1)}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Drop Element
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 h-48">
        <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Zone A</span>
        </div>
        <div className="rounded-lg border-2 border-dashed border-primary/40 flex items-center justify-center relative">
          <span className="text-xs text-muted-foreground absolute top-2">Zone B</span>
          <div
            className="h-14 w-14 rounded-xl bg-primary/70 shadow-lg flex items-center justify-center"
            style={{
              transform: `translate(${(v - 0.5) * 60}px, ${(1 - v) * -20}px)`,
            }}
          >
            <GripVertical className="h-5 w-5 text-primary-foreground/70" />
          </div>
        </div>
        <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Zone C</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Click &quot;Drop Element&quot; to see it settle into position with spring physics.
      </p>
    </div>
  );
}

// ── Toggle Switch Demo ─────────────────────────────────

function ToggleSwitchDemo({ spring, duration }: DemoProps) {
  const [isOn, setIsOn] = useState(false);
  const [trigger, setTrigger] = useState(0);
  const v = useSpringAnimation(spring, duration, trigger);

  const toggle = () => {
    setIsOn(!isOn);
    setTrigger((k) => k + 1);
  };

  const thumbX = isOn ? v * 24 : (1 - v) * 24;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">Toggle Switch</h3>
        <p className="text-xs text-muted-foreground">
          Click the toggles to see the switch animation with spring bounce.
        </p>
      </div>

      <div className="space-y-6 py-4">
        {[
          { label: "Dark Mode", sublabel: "Switch to dark appearance" },
          { label: "Notifications", sublabel: "Enable push notifications" },
          { label: "Auto-save", sublabel: "Save changes automatically" },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.sublabel}</div>
            </div>
            {i === 0 ? (
              <button
                className="relative h-7 w-12 rounded-full transition-colors"
                style={{
                  backgroundColor: isOn ? "hsl(var(--primary))" : "hsl(var(--muted))",
                }}
                onClick={toggle}
              >
                <div
                  className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md"
                  style={{ transform: `translateX(${thumbX}px)` }}
                />
              </button>
            ) : (
              <button className="relative h-7 w-12 rounded-full bg-muted cursor-default">
                <div className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md" />
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        The first toggle uses your spring curve. Notice the bounce when it snaps into place.
      </p>
    </div>
  );
}

// ── Modal Spring Demo ──────────────────────────────────

function ModalSpringDemo({ spring, duration }: DemoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [trigger, setTrigger] = useState(0);
  const v = useSpringAnimation(spring, duration, trigger);

  const openModal = () => {
    setIsOpen(true);
    setTrigger((k) => k + 1);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Spring Modal</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Click the button to open a modal with spring entrance animation.
        </p>
      </div>

      <Button onClick={openModal}>Open Modal</Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            style={{ opacity: Math.min(v * 1.5, 1) }}
            onClick={() => setIsOpen(false)}
          />
          {/* Dialog */}
          <div
            className="relative z-10 w-full max-w-md rounded-xl bg-surface p-6 shadow-2xl mx-4"
            style={{
              transform: `scale(${0.85 + v * 0.15}) translateY(${(1 - v) * 20}px)`,
              opacity: Math.min(v * 2, 1),
            }}
          >
            <h2 className="text-lg font-semibold mb-2">Spring Modal</h2>
            <p className="text-sm text-muted-foreground mb-6">
              This modal enters using your spring curve. Notice the subtle bounce as it scales and
              translates into position.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsOpen(false)}>Confirm</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
