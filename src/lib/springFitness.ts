import { springValueAt } from "./springCurves";
import { type SpringSceneType, springSceneLabels } from "./springSceneTypes";

// ── Types ──────────────────────────────────────────────

export type SpringFitnessLevel = "great" | "good" | "fair" | "poor";

export interface SpringSceneFitness {
  level: SpringFitnessLevel;
  label: string;
  tip: string;
  scores: {
    bounceQuality: number;
    settleQuality: number;
    energyFeel: number;
    total: number;
  };
  weights: { bounce: number; settle: number; energy: number };
}

export interface SpringInput {
  mass: number;
  stiffness: number;
  damping: number;
  velocity: number;
}

// ── Spring Traits (spring-native) ──────────────────────

interface SpringTraits {
  dampingRatio: number; // zeta: <1 underdamped, =1 critical, >1 overdamped
  overshootCount: number; // times curve crosses y=1
  overshootPeak: number; // max(y - 1) above target
  undershootPeak: number; // max(0 - y) below zero
  settleTime: number; // seconds to reach and stay within 0.2% of target
  settleCleanness: number; // 0-1: how flat the last 20% of animation is
  energyProfile: number; // 0-1: 0=slow start, 1=fast start
  totalDuration: number; // full settle duration in seconds
}

// ── Trait Extraction ───────────────────────────────────

function extractSpringTraits(spring: SpringInput): SpringTraits {
  const { mass, stiffness, damping, velocity } = spring;
  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  // Simulate at high resolution to find settle time and traits
  const maxTime = 10; // seconds
  const steps = 2000;
  const dt = maxTime / steps;
  const values: number[] = [];

  for (let i = 0; i <= steps; i++) {
    values.push(springValueAt(i * dt, omega0, zeta, velocity));
  }

  // Overshoot count: times the curve crosses y=1
  let overshootCount = 0;
  for (let i = 1; i < values.length; i++) {
    if ((values[i - 1] < 1 && values[i] >= 1) || (values[i - 1] > 1 && values[i] <= 1)) {
      overshootCount++;
    }
  }
  // Each crossing pair = one oscillation, so divide by 2 for "overshoot count"
  overshootCount = Math.floor(overshootCount / 2);

  // Overshoot peak and undershoot peak
  let overshootPeak = 0;
  let undershootPeak = 0;
  for (const v of values) {
    overshootPeak = Math.max(overshootPeak, v - 1);
    undershootPeak = Math.max(undershootPeak, -v);
  }

  // Settle time: find last index where |y - 1| > 0.002
  let settleIndex = 0;
  for (let i = values.length - 1; i >= 0; i--) {
    if (Math.abs(values[i] - 1) > 0.002) {
      settleIndex = i + 1;
      break;
    }
  }
  const settleTime = Math.min(maxTime, settleIndex * dt + 0.05);

  // Settle cleanness: variance of last 20% of values around y=1
  const lastChunkStart = Math.floor(values.length * 0.8);
  let sumDev = 0;
  let maxDev = 0;
  const lastChunkLen = values.length - lastChunkStart;
  for (let i = lastChunkStart; i < values.length; i++) {
    const dev = Math.abs(values[i] - 1);
    sumDev += dev;
    maxDev = Math.max(maxDev, dev);
  }
  const avgDev = sumDev / lastChunkLen;
  // Clean = low deviation. Map to 0-1 where 1 = perfectly clean
  const settleCleanness = clamp(1 - avgDev * 50, 0, 1);

  // Energy profile: how front-loaded is the motion
  // Compare speed in first 30% vs last 30%
  const firstChunkEnd = Math.floor(values.length * 0.3);
  let firstSpeed = 0;
  let lastSpeed = 0;
  for (let i = 1; i < firstChunkEnd; i++) {
    firstSpeed += Math.abs(values[i] - values[i - 1]);
  }
  for (let i = lastChunkStart + 1; i < values.length; i++) {
    lastSpeed += Math.abs(values[i] - values[i - 1]);
  }
  const totalSpeed = firstSpeed + lastSpeed + 1e-6;
  const energyProfile = clamp(firstSpeed / totalSpeed, 0, 1);

  return {
    dampingRatio: zeta,
    overshootCount,
    overshootPeak,
    undershootPeak,
    settleTime,
    settleCleanness,
    energyProfile,
    totalDuration: settleTime,
  };
}

// ── Scene Preferences ──────────────────────────────────

interface SpringScenePreference {
  // Overshoot count: [min, max] ideal range
  idealOvCount: [number, number];
  // Overshoot peak: [min, max] ideal range
  idealOvPeak: [number, number];
  // Damping ratio: [min, max] ideal range
  idealDamping: [number, number];
  // Whether settle must be very clean (strict) or can linger
  settleStrict: boolean;
  // Energy profile target: 0=slow start, 1=fast start
  energyTarget: number;
  // Scoring weights
  weights: { bounce: number; settle: number; energy: number };
}

const springScenePreferences: Record<SpringSceneType, SpringScenePreference> = {
  "pull-refresh": {
    idealOvCount: [1, 3],
    idealOvPeak: [0.05, 0.25],
    idealDamping: [0.3, 0.8],
    settleStrict: false,
    energyTarget: 0.75,
    weights: { bounce: 0.45, settle: 0.25, energy: 0.3 },
  },
  "fab-expand": {
    idealOvCount: [1, 2],
    idealOvPeak: [0.05, 0.2],
    idealDamping: [0.4, 0.9],
    settleStrict: true,
    energyTarget: 0.8,
    weights: { bounce: 0.4, settle: 0.35, energy: 0.25 },
  },
  "card-toss": {
    idealOvCount: [2, 5],
    idealOvPeak: [0.1, 0.4],
    idealDamping: [0.15, 0.5],
    settleStrict: false,
    energyTarget: 0.7,
    weights: { bounce: 0.5, settle: 0.2, energy: 0.3 },
  },
  "swipe-dismiss": {
    idealOvCount: [0, 2],
    idealOvPeak: [0.02, 0.15],
    idealDamping: [0.5, 1.2],
    settleStrict: true,
    energyTarget: 0.85,
    weights: { bounce: 0.35, settle: 0.4, energy: 0.25 },
  },
  "bottom-sheet": {
    idealOvCount: [1, 3],
    idealOvPeak: [0.03, 0.2],
    idealDamping: [0.4, 0.9],
    settleStrict: true,
    energyTarget: 0.7,
    weights: { bounce: 0.4, settle: 0.4, energy: 0.2 },
  },
  "drag-settle": {
    idealOvCount: [1, 4],
    idealOvPeak: [0.05, 0.3],
    idealDamping: [0.25, 0.7],
    settleStrict: false,
    energyTarget: 0.65,
    weights: { bounce: 0.45, settle: 0.25, energy: 0.3 },
  },
  "toggle-switch": {
    idealOvCount: [0, 2],
    idealOvPeak: [0.02, 0.1],
    idealDamping: [0.5, 1.2],
    settleStrict: true,
    energyTarget: 0.85,
    weights: { bounce: 0.35, settle: 0.4, energy: 0.25 },
  },
  "modal-spring": {
    idealOvCount: [0, 2],
    idealOvPeak: [0.03, 0.15],
    idealDamping: [0.5, 1.0],
    settleStrict: true,
    energyTarget: 0.8,
    weights: { bounce: 0.4, settle: 0.35, energy: 0.25 },
  },
};

// ── Scoring Functions ──────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Score how well the value falls within [min, max], with gentle falloff outside */
function rangeScore(value: number, min: number, max: number, falloffSigma: number): number {
  if (value >= min && value <= max) return 1.0;
  const dist = value < min ? min - value : value - max;
  return Math.exp(-0.5 * (dist / falloffSigma) ** 2);
}

function scoreBounceQuality(traits: SpringTraits, pref: SpringScenePreference): number {
  // Score overshoot count
  const countScore = rangeScore(
    traits.overshootCount,
    pref.idealOvCount[0],
    pref.idealOvCount[1],
    1.5,
  );

  // Score overshoot peak magnitude
  const peakScore = rangeScore(traits.overshootPeak, pref.idealOvPeak[0], pref.idealOvPeak[1], 0.1);

  // Score damping ratio
  const dampingScore = rangeScore(
    traits.dampingRatio,
    pref.idealDamping[0],
    pref.idealDamping[1],
    0.25,
  );

  return countScore * 0.35 + peakScore * 0.35 + dampingScore * 0.3;
}

function scoreSettleQuality(traits: SpringTraits, pref: SpringScenePreference): number {
  let score = traits.settleCleanness;

  if (pref.settleStrict) {
    // Penalize long settle times more harshly
    if (traits.settleTime > 2.0) {
      score *= clamp(1 - (traits.settleTime - 2.0) * 0.3, 0.1, 1);
    }
    // Extra penalty for residual oscillation in the tail
    if (traits.overshootCount > pref.idealOvCount[1] + 2) {
      const excess = traits.overshootCount - pref.idealOvCount[1];
      score *= clamp(1 - excess * 0.15, 0.1, 1);
    }
  } else {
    // Lenient: only penalize very long settle
    if (traits.settleTime > 5.0) {
      score *= clamp(1 - (traits.settleTime - 5.0) * 0.2, 0.2, 1);
    }
  }

  return clamp(score, 0, 1);
}

function scoreEnergyFeel(traits: SpringTraits, pref: SpringScenePreference): number {
  const diff = Math.abs(traits.energyProfile - pref.energyTarget);
  return Math.exp(-0.5 * (diff / 0.25) ** 2);
}

// ── Tip Generation ─────────────────────────────────────

const greatTips: Record<SpringSceneType, string> = {
  "pull-refresh": "Natural bounce-back, perfect for pull-to-refresh",
  "fab-expand": "Snappy pop with controlled settle, ideal for FAB",
  "card-toss": "Playful oscillation with physical feel",
  "swipe-dismiss": "Quick and decisive spring, great for swipe actions",
  "bottom-sheet": "Smooth snap with satisfying settle",
  "drag-settle": "Natural drop-and-settle physics",
  "toggle-switch": "Crisp snap with subtle bounce, perfect for toggles",
  "modal-spring": "Elegant entrance with gentle spring character",
};

const goodTips: Record<SpringSceneType, string> = {
  "pull-refresh": "Decent bounce-back for refresh interactions",
  "fab-expand": "Good pop feel for expanding elements",
  "card-toss": "Works well for card interactions",
  "swipe-dismiss": "Solid spring for dismiss gestures",
  "bottom-sheet": "Good snap behavior for sheet interactions",
  "drag-settle": "Reasonable settle for drag interactions",
  "toggle-switch": "Works nicely for toggle animations",
  "modal-spring": "Good spring feel for modal entrance",
};

function generateSpringTip(
  scene: SpringSceneType,
  level: SpringFitnessLevel,
  traits: SpringTraits,
  pref: SpringScenePreference,
): string {
  if (level === "great") return greatTips[scene];
  if (level === "good") return goodTips[scene];

  const sceneLabel = springSceneLabels[scene].toLowerCase();
  const issues: string[] = [];

  // Identify main issues
  if (traits.dampingRatio > pref.idealDamping[1] + 0.3) {
    issues.push("Spring feels sluggish — try reducing damping");
  } else if (traits.dampingRatio < pref.idealDamping[0] - 0.2) {
    issues.push("Too bouncy — try increasing damping");
  }

  if (traits.overshootCount > pref.idealOvCount[1] + 2) {
    issues.push(`Too many oscillations for ${sceneLabel}`);
  } else if (traits.overshootPeak > pref.idealOvPeak[1] * 2) {
    issues.push(`Overshoot too large for ${sceneLabel}`);
  }

  if (pref.settleStrict && traits.settleTime > 3.0) {
    issues.push("Settles too slowly — try increasing stiffness");
  }

  if (traits.dampingRatio >= 1.0 && pref.idealDamping[1] < 1.0) {
    issues.push("Overdamped — this scene benefits from some bounce");
  }

  return issues.length > 0
    ? issues.slice(0, 2).join("; ")
    : `Adjust spring parameters for better ${sceneLabel} feel`;
}

// ── Main Scoring Function ──────────────────────────────

export function getSpringSceneFitness(
  scene: SpringSceneType,
  spring: SpringInput,
): SpringSceneFitness {
  const pref = springScenePreferences[scene];
  const traits = extractSpringTraits(spring);

  const bounceQuality = scoreBounceQuality(traits, pref);
  const settleQuality = scoreSettleQuality(traits, pref);
  const energyFeel = scoreEnergyFeel(traits, pref);

  const w = pref.weights;
  const totalScore = bounceQuality * w.bounce + settleQuality * w.settle + energyFeel * w.energy;

  // Level mapping
  let level: SpringFitnessLevel;
  if (totalScore >= 0.78) level = "great";
  else if (totalScore >= 0.58) level = "good";
  else if (totalScore >= 0.38) level = "fair";
  else level = "poor";

  const tip = generateSpringTip(scene, level, traits, pref);

  return {
    level,
    label:
      level === "great"
        ? "Great fit"
        : level === "good"
          ? "Good"
          : level === "fair"
            ? "Not ideal"
            : "Poor fit",
    tip,
    scores: {
      bounceQuality,
      settleQuality,
      energyFeel,
      total: totalScore,
    },
    weights: w,
  };
}
