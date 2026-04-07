import {
  type EasingCurve,
  defaultEasingCurves,
  getCustomCurves,
  saveCustomCurves,
} from "@/lib/easingCurves";
import { useCallback, useEffect, useState } from "react";

export interface BezierValues {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function useEasingStore() {
  const [customCurves, setCustomCurves] = useState<EasingCurve[]>([]);
  const [selectedCurveId, setSelectedCurveId] = useState<string>("easeInOutCubic");
  const [bezier, setBezier] = useState<BezierValues>({ x1: 0.65, y1: 0, x2: 0.35, y2: 1 });
  const [duration, setDuration] = useState(1.3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [curveTab, setCurveTab] = useState<"default" | "custom">("default");

  // Load custom curves on mount
  useEffect(() => {
    setCustomCurves(getCustomCurves());
  }, []);

  // Get all curves
  const allCurves = [...defaultEasingCurves, ...customCurves];

  // Get selected curve
  const selectedCurve = allCurves.find((c) => c.id === selectedCurveId);

  // Select a curve
  const selectCurve = useCallback((curve: EasingCurve) => {
    setSelectedCurveId(curve.id);
    setBezier({ x1: curve.x1, y1: curve.y1, x2: curve.x2, y2: curve.y2 });
    setDuration(curve.duration);
  }, []);

  // Update bezier values
  const updateBezier = useCallback((values: Partial<BezierValues>) => {
    setBezier((prev) => ({ ...prev, ...values }));
  }, []);

  // Reset to selected curve's original values
  const resetToOriginal = useCallback(() => {
    if (selectedCurve) {
      setBezier({
        x1: selectedCurve.x1,
        y1: selectedCurve.y1,
        x2: selectedCurve.x2,
        y2: selectedCurve.y2,
      });
      setDuration(selectedCurve.duration);
    }
  }, [selectedCurve]);

  // Save current bezier as custom curve
  const saveAsCustom = useCallback(
    (name: string) => {
      const newCurve: EasingCurve = {
        id: `custom-${Date.now()}`,
        name,
        ...bezier,
        duration,
        isCustom: true,
      };
      const updated = [...customCurves, newCurve];
      setCustomCurves(updated);
      saveCustomCurves(updated);
      setSelectedCurveId(newCurve.id);
      setCurveTab("custom");
      return newCurve;
    },
    [bezier, duration, customCurves],
  );

  // Delete custom curve
  const deleteCustomCurve = useCallback(
    (id: string) => {
      const updated = customCurves.filter((c) => c.id !== id);
      setCustomCurves(updated);
      saveCustomCurves(updated);
      if (selectedCurveId === id) {
        selectCurve(defaultEasingCurves[0]);
        setCurveTab("default");
      }
    },
    [customCurves, selectedCurveId, selectCurve],
  );

  // Rename custom curve
  const renameCustomCurve = useCallback(
    (id: string, newName: string) => {
      const updated = customCurves.map((c) => (c.id === id ? { ...c, name: newName } : c));
      setCustomCurves(updated);
      saveCustomCurves(updated);
    },
    [customCurves],
  );

  // Play animations
  const playAnimations = useCallback(() => {
    setAnimationKey((k) => k + 1);
    setIsPlaying(true);
  }, []);

  // Stop animations
  const stopAnimations = useCallback(() => {
    setIsPlaying(false);
  }, []);

  return {
    // Data
    defaultCurves: defaultEasingCurves,
    customCurves,
    allCurves,
    selectedCurve,
    selectedCurveId,
    bezier,
    duration,
    isPlaying,
    animationKey,
    curveTab,
    // Actions
    selectCurve,
    updateBezier,
    setDuration,
    resetToOriginal,
    saveAsCustom,
    deleteCustomCurve,
    renameCustomCurve,
    playAnimations,
    stopAnimations,
    setCurveTab,
  };
}
