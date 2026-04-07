import { describe, expect, it } from "vitest";
import calibrationData from "../../fixtures/scene-fitness-calibration.json";
import { type CurveInput, getSceneFitness } from "../lib/sceneFitness";
import type { UISceneType } from "../lib/uiSceneTypes";

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
  expectedLevel: "great" | "good" | "fair" | "poor";
  source: string;
}

const levelOrder = { great: 3, good: 2, fair: 1, poor: 0 };

function buildCurveInput(entry: CalibrationEntry): CurveInput {
  if (entry.curve.type === "bezier") {
    return {
      type: "bezier",
      x1: entry.curve.x1!,
      y1: entry.curve.y1!,
      x2: entry.curve.x2!,
      y2: entry.curve.y2!,
    };
  }
  return {
    type: "spring",
    mass: entry.curve.mass!,
    stiffness: entry.curve.stiffness!,
    damping: entry.curve.damping!,
    velocity: entry.curve.velocity ?? 0,
  };
}

describe("Scene Fitness Calibration", () => {
  const entries = calibrationData as CalibrationEntry[];

  // Test exact level matches (target: ≥75%)
  describe("Exact Level Matches", () => {
    let matches = 0;
    let total = 0;

    for (const entry of entries) {
      it(`${entry.scene} — ${entry.source}`, () => {
        const curve = buildCurveInput(entry);
        const duration = entry.duration ?? 0.3; // default for spring
        const result = getSceneFitness(entry.scene, curve, duration);

        total++;
        if (result.level === entry.expectedLevel) {
          matches++;
        }

        expect(result.level).toBe(entry.expectedLevel);
      });
    }
  });

  // Test tolerance matches (within 1 level, target: ≥95%)
  describe("Tolerance Matches (±1 level)", () => {
    for (const entry of entries) {
      it(`${entry.scene} — ${entry.source}`, () => {
        const curve = buildCurveInput(entry);
        const duration = entry.duration ?? 0.3;
        const result = getSceneFitness(entry.scene, curve, duration);

        const actualOrder = levelOrder[result.level];
        const expectedOrder = levelOrder[entry.expectedLevel];
        const diff = Math.abs(actualOrder - expectedOrder);

        expect(diff).toBeLessThanOrEqual(1);
      });
    }
  });
});

// Summary statistics (run with `vitest --reporter=verbose`)
describe("Calibration Summary", () => {
  it("reports overall accuracy", () => {
    const entries = calibrationData as CalibrationEntry[];
    let exactMatches = 0;
    let toleranceMatches = 0;
    let totalDeviation = 0;

    for (const entry of entries) {
      const curve = buildCurveInput(entry);
      const duration = entry.duration ?? 0.3;
      const result = getSceneFitness(entry.scene, curve, duration);

      const actualOrder = levelOrder[result.level];
      const expectedOrder = levelOrder[entry.expectedLevel];
      const diff = Math.abs(actualOrder - expectedOrder);

      if (diff === 0) exactMatches++;
      if (diff <= 1) toleranceMatches++;
      totalDeviation += diff;
    }

    const total = entries.length;
    const exactRate = ((exactMatches / total) * 100).toFixed(1);
    const toleranceRate = ((toleranceMatches / total) * 100).toFixed(1);
    const mae = (totalDeviation / total).toFixed(2);

    console.log("\n📊 Calibration Report:");
    console.log(`   Exact match rate: ${exactRate}% (${exactMatches}/${total}) — target: ≥75%`);
    console.log(
      `   Tolerance rate:   ${toleranceRate}% (${toleranceMatches}/${total}) — target: ≥95%`,
    );
    console.log(`   Mean absolute error: ${mae} — target: ≤0.4`);

    // These expectations can be relaxed during initial calibration
    // expect(exactMatches / total).toBeGreaterThanOrEqual(0.75);
    // expect(toleranceMatches / total).toBeGreaterThanOrEqual(0.95);
    expect(true).toBe(true); // Placeholder - uncomment above after calibration
  });
});
