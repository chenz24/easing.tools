import {
  type SpringCurve,
  autoSpringDuration,
  defaultSpringCurves,
  getCustomSprings,
  saveCustomSprings,
} from "@/lib/springCurves";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface SpringValues {
  mass: number;
  stiffness: number;
  damping: number;
  velocity: number;
}

export function useSpringStore() {
  const [customSprings, setCustomSprings] = useState<SpringCurve[]>([]);
  const [selectedSpringId, setSelectedSpringId] = useState<string>("spring-jump");
  const [spring, setSpring] = useState<SpringValues>({
    mass: 0.04,
    stiffness: 10,
    damping: 0.7,
    velocity: 8,
  });
  const duration = useMemo(() => autoSpringDuration(spring), [spring]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [springTab, setSpringTab] = useState<"default" | "custom">("default");

  // Load custom springs on mount
  useEffect(() => {
    setCustomSprings(getCustomSprings());
  }, []);

  // Get all springs
  const allSprings = [...defaultSpringCurves, ...customSprings];

  // Get selected spring
  const selectedSpring = allSprings.find((s) => s.id === selectedSpringId);

  // Select a spring
  const selectSpring = useCallback((springCurve: SpringCurve) => {
    setSelectedSpringId(springCurve.id);
    setSpring({
      mass: springCurve.mass,
      stiffness: springCurve.stiffness,
      damping: springCurve.damping,
      velocity: springCurve.velocity,
    });
  }, []);

  // Update spring values
  const updateSpring = useCallback((values: Partial<SpringValues>) => {
    setSpring((prev) => ({ ...prev, ...values }));
  }, []);

  // Reset to selected spring's original values
  const resetToOriginal = useCallback(() => {
    if (selectedSpring) {
      setSpring({
        mass: selectedSpring.mass,
        stiffness: selectedSpring.stiffness,
        damping: selectedSpring.damping,
        velocity: selectedSpring.velocity,
      });
    }
  }, [selectedSpring]);

  // Save current spring as custom
  const saveAsCustom = useCallback(
    (name: string) => {
      const newSpring: SpringCurve = {
        id: `custom-spring-${Date.now()}`,
        name,
        ...spring,
        duration,
        isCustom: true,
      };
      const updated = [...customSprings, newSpring];
      setCustomSprings(updated);
      saveCustomSprings(updated);
      setSelectedSpringId(newSpring.id);
      setSpringTab("custom");
      return newSpring;
    },
    [spring, duration, customSprings],
  );

  // Delete custom spring
  const deleteCustomSpring = useCallback(
    (id: string) => {
      const updated = customSprings.filter((s) => s.id !== id);
      setCustomSprings(updated);
      saveCustomSprings(updated);
      if (selectedSpringId === id) {
        selectSpring(defaultSpringCurves[0]);
        setSpringTab("default");
      }
    },
    [customSprings, selectedSpringId, selectSpring],
  );

  // Rename custom spring
  const renameCustomSpring = useCallback(
    (id: string, newName: string) => {
      const updated = customSprings.map((s) => (s.id === id ? { ...s, name: newName } : s));
      setCustomSprings(updated);
      saveCustomSprings(updated);
    },
    [customSprings],
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
    defaultSprings: defaultSpringCurves,
    customSprings,
    allSprings,
    selectedSpring,
    selectedSpringId,
    spring,
    duration,
    isPlaying,
    animationKey,
    springTab,
    // Actions
    selectSpring,
    updateSpring,
    resetToOriginal,
    saveAsCustom,
    deleteCustomSpring,
    renameCustomSpring,
    playAnimations,
    stopAnimations,
    setSpringTab,
  };
}
