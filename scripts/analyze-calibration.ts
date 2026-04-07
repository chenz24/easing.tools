/**
 * Scene Fitness Calibration Analysis Script
 *
 * Run with: npx tsx scripts/analyze-calibration.ts
 *
 * This script analyzes the calibration data and outputs recommended
 * scene preference parameters based on the CurveTraits of "great" curves.
 */

import calibrationData from "../fixtures/scene-fitness-calibration.json";
import type { UISceneType } from "../src/lib/uiSceneTypes";

// Minimal types needed for the analysis
type FitnessLevel = "great" | "good" | "fair" | "poor";

interface CalibrationEntry {
  scene: UISceneType;
  curve: {
    type: "bezier" | "spring";
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    mass?: number;
    stiffness?: number;
    damping?: number;
    velocity?: number;
  };
  duration: number | null;
  expectedLevel: FitnessLevel;
  source: string;
}

interface CurveTraits {
  velocityBias: number;
  inOutBalance: number;
  linearness: number;
  overshootAmount: number;
}

const EPS = 1e-6;

// ── Bezier analysis (simplified from sceneFitness.ts) ────────────────

function analyzeBezier(x1: number, y1: number, x2: number, y2: number): CurveTraits {
  const p1Bias = y1 - x1;
  const p2Bias = y2 - x2;
  const easeOutBias = p1Bias + p2Bias;
  const easeInOutStrength = Math.max(0, -p1Bias) + Math.max(0, p2Bias);
  const linearness_cp = 1 - Math.min(1, (Math.abs(p1Bias) + Math.abs(p2Bias)) / 1.2);
  const overshootBelow = Math.max(0, -y1);
  const overshootAbove = Math.max(0, y2 - 1);
  const overshootAmount = overshootBelow + overshootAbove;

  return {
    velocityBias: Math.max(0, Math.min(1, 0.5 + easeOutBias / 4)),
    inOutBalance: Math.max(0, Math.min(1, easeInOutStrength / 0.8)),
    linearness: linearness_cp,
    overshootAmount,
  };
}

// ── Statistics helpers ────────────────────────────────────────────────

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0.15; // default sigma
  const m = mean(arr);
  const variance = arr.reduce((sum, val) => sum + (val - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

// ── Main analysis ────────────────────────────────────────────────────

const entries = calibrationData as CalibrationEntry[];
const scenes = [...new Set(entries.map((e) => e.scene))];

console.log("# Scene Fitness Calibration Analysis\n");
console.log("Based on:", entries.length, "reference curves\n");

for (const scene of scenes) {
  const sceneEntries = entries.filter((e) => e.scene === scene);
  const greatEntries = sceneEntries.filter((e) => e.expectedLevel === "great");
  const goodEntries = sceneEntries.filter((e) => e.expectedLevel === "good");
  const acceptableEntries = [...greatEntries, ...goodEntries];

  // Only analyze bezier curves (spring traits need runtime sampling)
  const bezierGreats = greatEntries.filter((e) => e.curve.type === "bezier");
  const bezierAcceptable = acceptableEntries.filter((e) => e.curve.type === "bezier");

  if (bezierGreats.length === 0) {
    console.log(`## ${scene}: (no bezier great curves)\n`);
    continue;
  }

  const traits = bezierGreats.map((e) =>
    analyzeBezier(e.curve.x1!, e.curve.y1!, e.curve.x2!, e.curve.y2!),
  );

  // Use acceptable curves for broader sigma estimation
  const traitsAcceptable = bezierAcceptable.map((e) =>
    analyzeBezier(e.curve.x1!, e.curve.y1!, e.curve.x2!, e.curve.y2!),
  );

  // Duration analysis
  const durations = sceneEntries
    .filter(
      (e) => e.duration !== null && (e.expectedLevel === "great" || e.expectedLevel === "good"),
    )
    .map((e) => e.duration!);

  console.log(`## ${scene}`);
  console.log(`   Samples: ${bezierGreats.length} great, ${bezierAcceptable.length} acceptable\n`);

  console.log("   velocityBias:");
  console.log(`      target: ${mean(traits.map((t) => t.velocityBias)).toFixed(3)}`);
  console.log(
    `      sigma:  ${Math.max(0.15, stddev(traitsAcceptable.map((t) => t.velocityBias))).toFixed(3)}`,
  );

  console.log("   inOutBalance:");
  console.log(`      target: ${mean(traits.map((t) => t.inOutBalance)).toFixed(3)}`);
  console.log(
    `      sigma:  ${Math.max(0.15, stddev(traitsAcceptable.map((t) => t.inOutBalance))).toFixed(3)}`,
  );

  console.log("   linearness:");
  console.log(`      target: ${mean(traits.map((t) => t.linearness)).toFixed(3)}`);
  console.log(
    `      sigma:  ${Math.max(0.15, stddev(traitsAcceptable.map((t) => t.linearness))).toFixed(3)}`,
  );

  console.log("   overshootMax:", Math.max(...traits.map((t) => t.overshootAmount)).toFixed(3));

  if (durations.length > 0) {
    const sortedDurations = durations.sort((a, b) => a - b);
    console.log(
      `   duration ideal: [${sortedDurations[0]?.toFixed(2)}, ${sortedDurations[sortedDurations.length - 1]?.toFixed(2)}]`,
    );
  }

  console.log("");
}

console.log("---");
console.log("Use these values to update scenePreferences in sceneFitness.ts");
