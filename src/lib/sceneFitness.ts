import { type UISceneType, uiSceneLabels } from "./uiSceneTypes";

// ── Types ──────────────────────────────────────────────

export type FitnessLevel = "great" | "good" | "fair" | "poor";

export interface SceneFitness {
  level: FitnessLevel;
  label: string;
  tip: string;
  /** Score breakdown (0-1 scale) for detail dialog */
  scores: {
    curveFit: number;
    duration: number;
    stability: number;
    total: number;
  };
  /** Weight configuration for each dimension */
  weights: { curve: number; duration: number; stability: number };
}

export interface BezierInput {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SpringInput {
  mass: number;
  stiffness: number;
  damping: number;
  velocity: number;
}

export interface CustomInput {
  samples: { t: number; y: number }[];
}

export type CurveInput =
  | ({ type: "bezier" } & BezierInput)
  | ({ type: "spring" } & SpringInput)
  | ({ type: "custom" } & CustomInput);

// ── Unified CurveTraits (§7) ───────────────────────────

interface CurveTraits {
  velocityBias: number;
  inOutBalance: number;
  linearness: number;
  overshootAmount: number;
  settleTimeRatio: number;
  peakVelocity: number;
  jerkiness: number;
}

const EPS = 1e-6;

// ── Sampling & velocity (§6.1) ─────────────────────────

interface Sample {
  t: number;
  y: number;
  v: number;
}

function computeVelocity(ys: number[], dt: number): number[] {
  const N = ys.length;
  const v = new Array<number>(N);
  v[0] = (ys[1] - ys[0]) / dt;
  for (let i = 1; i < N - 1; i++) {
    v[i] = (ys[i + 1] - ys[i - 1]) / (2 * dt);
  }
  v[N - 1] = (ys[N - 1] - ys[N - 2]) / dt;
  // 3-point moving average smoothing
  const smoothed = new Array<number>(N);
  smoothed[0] = v[0];
  for (let i = 1; i < N - 1; i++) {
    smoothed[i] = (v[i - 1] + v[i] + v[i + 1]) / 3;
  }
  smoothed[N - 1] = v[N - 1];
  return smoothed;
}

function buildSamples(ys: number[], N: number): Sample[] {
  const dt = 1 / (N - 1);
  const vs = computeVelocity(ys, dt);
  return ys.map((y, i) => ({ t: i * dt, y, v: vs[i] }));
}

// ── Bezier sampling ────────────────────────────────────

function solveCubicBezierX(x1: number, x2: number, x: number): number {
  // Newton's method to find t for a given x on cubic-bezier(x1,_,x2,_)
  let t = x;
  for (let i = 0; i < 8; i++) {
    const ct = 1 - t;
    const bx = 3 * ct * ct * t * x1 + 3 * ct * t * t * x2 + t * t * t;
    const dx = 3 * ct * ct * x1 + 6 * ct * t * (x2 - x1) + 3 * t * t * (1 - x2);
    if (Math.abs(dx) < EPS) break;
    t -= (bx - x) / dx;
    t = Math.max(0, Math.min(1, t));
  }
  return t;
}

function sampleBezier(b: BezierInput, N: number): number[] {
  const ys = new Array<number>(N);
  for (let i = 0; i < N; i++) {
    const x = i / (N - 1);
    const t = solveCubicBezierX(b.x1, b.x2, x);
    const ct = 1 - t;
    ys[i] = 3 * ct * ct * t * b.y1 + 3 * ct * t * t * b.y2 + t * t * t;
  }
  return ys;
}

// ── Spring sampling (§6.2) ─────────────────────────────

function sampleSpring(
  s: SpringInput,
  N: number,
): { ys: number[]; settleTime: number; dampingRatio: number } {
  const { mass, stiffness, damping, velocity } = s;
  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  // Find settle time: y(t) enters [0.998, 1.002] and stays
  const maxTime = 10; // upper bound in seconds
  const fineSteps = 1000;
  const fineYs = new Array<number>(fineSteps + 1);
  for (let i = 0; i <= fineSteps; i++) {
    const t = (i / fineSteps) * maxTime;
    fineYs[i] = springValueAt(t, omega0, zeta, velocity);
  }
  let settleIndex = 0;
  for (let i = fineSteps; i >= 0; i--) {
    if (Math.abs(fineYs[i] - 1) > 0.002) {
      settleIndex = i + 1;
      break;
    }
  }
  const settleTime = Math.min(maxTime, (settleIndex / fineSteps) * maxTime + 0.05);

  // Sample N points over [0, settleTime]
  const ys = new Array<number>(N);
  for (let i = 0; i < N; i++) {
    const t = (i / (N - 1)) * settleTime;
    ys[i] = springValueAt(t, omega0, zeta, velocity);
  }

  return { ys, settleTime, dampingRatio: zeta };
}

function springValueAt(t: number, omega0: number, zeta: number, velocity: number): number {
  if (zeta < 1) {
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    const envelope = Math.exp(-zeta * omega0 * t);
    const phase = Math.atan2(zeta * omega0 + velocity, omegaD);
    return 1 - (envelope * Math.cos(omegaD * t - phase)) / Math.cos(phase);
  }
  if (zeta === 1) {
    return 1 - (1 + omega0 * t) * Math.exp(-omega0 * t);
  }
  const s1 = -omega0 * (zeta + Math.sqrt(zeta * zeta - 1));
  const s2 = -omega0 * (zeta - Math.sqrt(zeta * zeta - 1));
  const c2 = (s1 + velocity) / (s1 - s2);
  const c1 = 1 - c2;
  return 1 - c1 * Math.exp(s1 * t) - c2 * Math.exp(s2 * t);
}

// ── Custom curve sampling (§6.4) ───────────────────────

function sampleCustom(c: CustomInput, N: number): number[] {
  const src = c.samples;
  if (src.length < 2) return new Array(N).fill(0);
  const sorted = [...src].sort((a, b) => a.t - b.t);
  const ys = new Array<number>(N);
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    // Linear interpolation - find the segment containing t
    let lo = sorted.length - 2;
    for (let j = 1; j < sorted.length; j++) {
      if (sorted[j].t >= t) {
        lo = j - 1;
        break;
      }
    }
    const hi = Math.min(lo + 1, sorted.length - 1);
    if (lo === hi) {
      ys[i] = sorted[lo].y;
      continue;
    }
    const frac = (t - sorted[lo].t) / (sorted[hi].t - sorted[lo].t + EPS);
    ys[i] = sorted[lo].y + frac * (sorted[hi].y - sorted[lo].y);
  }
  return ys;
}

// ── Trait extraction from samples (§7) ─────────────────

function extractTraits(samples: Sample[]): CurveTraits {
  const N = samples.length;
  const half = Math.floor(N / 2);
  const fifth = Math.floor(N * 0.2);

  // velocityBias (§7.1)
  let avgFirst = 0;
  let avgSecond = 0;
  for (let i = 0; i < half; i++) avgFirst += samples[i].v;
  for (let i = half; i < N; i++) avgSecond += samples[i].v;
  avgFirst /= half;
  avgSecond /= N - half;
  const velocityBias = avgFirst / (avgFirst + avgSecond + EPS);

  // inOutBalance (§7.2)
  let avgStart = 0;
  let avgEnd = 0;
  let avgMid = 0;
  for (let i = 0; i <= fifth; i++) avgStart += samples[i].v;
  avgStart /= fifth + 1;
  for (let i = N - 1 - fifth; i < N; i++) avgEnd += samples[i].v;
  avgEnd /= fifth + 1;
  for (let i = fifth + 1; i < N - 1 - fifth; i++) avgMid += samples[i].v;
  const midCount = N - 2 * (fifth + 1);
  avgMid = midCount > 0 ? avgMid / midCount : 1;
  const inOutBalance = clamp(1 - Math.abs(avgStart + avgEnd) / (2 * Math.abs(avgMid) + EPS), 0, 1);

  // linearness (§7.3)
  let linDev = 0;
  for (let i = 0; i < N; i++) linDev += Math.abs(samples[i].y - samples[i].t);
  const linearness = clamp(1 - (2 / N) * linDev, 0, 1);

  // overshootAmount (§7.4)
  let maxY = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  for (const s of samples) {
    maxY = Math.max(maxY, s.y);
    minY = Math.min(minY, s.y);
  }
  const overshootAmount = Math.max(0, maxY - 1) + Math.max(0, -minY);

  // settleTimeRatio (§7.5)
  let lastUnsettled = 0;
  for (let i = N - 1; i >= 0; i--) {
    if (Math.abs(samples[i].y - 1) > 0.005) {
      lastUnsettled = i;
      break;
    }
  }
  const settleTimeRatio = lastUnsettled / (N - 1);

  // peakVelocity (§7.6)
  let maxAbsV = 0;
  let sumAbsV = 0;
  for (const s of samples) {
    const av = Math.abs(s.v);
    maxAbsV = Math.max(maxAbsV, av);
    sumAbsV += av;
  }
  const avgAbsV = sumAbsV / N;
  const peakVelocity = maxAbsV / (avgAbsV + EPS);

  // jerkiness (§7.7)
  const accel = new Array<number>(N - 1);
  for (let i = 0; i < N - 1; i++) accel[i] = samples[i + 1].v - samples[i].v;
  let meanA = 0;
  for (const a of accel) meanA += a;
  meanA /= accel.length;
  let varA = 0;
  for (const a of accel) varA += (a - meanA) ** 2;
  const stdA = Math.sqrt(varA / accel.length);
  const jerkiness = clamp(stdA / (avgAbsV + EPS) / 2.0, 0, 1);

  return {
    velocityBias,
    inOutBalance,
    linearness,
    overshootAmount,
    settleTimeRatio,
    peakVelocity,
    jerkiness,
  };
}

// ── Bezier control-point shortcut (§6.3) ───────────────

function bezierShortcutTraits(b: BezierInput): CurveTraits {
  const p1Bias = b.y1 - b.x1;
  const p2Bias = b.y2 - b.x2;
  const easeOutBias = p1Bias + p2Bias;
  const easeInOutStrength = Math.max(0, -p1Bias) + Math.max(0, p2Bias);
  const linearness_cp = 1 - Math.min(1, (Math.abs(p1Bias) + Math.abs(p2Bias)) / 1.2);
  const overshootBelow = Math.max(0, -b.y1);
  const overshootAbove = Math.max(0, b.y2 - 1);
  const overshootAmount = overshootBelow + overshootAbove;

  // Compute peakVelocity via light sampling (32 points) for accuracy
  const N = 32;
  const ys = sampleBezier(b, N);
  const dt = 1 / (N - 1);
  let maxAbsV = 0;
  let sumAbsV = 0;
  for (let i = 0; i < N - 1; i++) {
    const v = Math.abs(ys[i + 1] - ys[i]) / dt;
    maxAbsV = Math.max(maxAbsV, v);
    sumAbsV += v;
  }
  const avgAbsV = sumAbsV / (N - 1);
  const peakVelocity = maxAbsV / (avgAbsV + EPS);

  return {
    velocityBias: clamp(0.5 + easeOutBias / 4, 0, 1),
    inOutBalance: clamp(easeInOutStrength / 0.8, 0, 1),
    linearness: linearness_cp,
    overshootAmount,
    settleTimeRatio: overshootAmount > 0.05 ? 0.3 : 0,
    peakVelocity,
    jerkiness: 0,
  };
}

// ── Scene preference table (§9) ────────────────────────

interface TraitPref {
  target: number;
  sigma: number;
}

interface ScenePreference {
  velocityBias: TraitPref;
  inOutBalance: TraitPref;
  linearness: TraitPref;
  overshootMax: number;
  duration: { ideal: [number, number] };
  weights: { curve: number; duration: number; stability: number };
  stabilityFlags: {
    penalizeSettle: boolean;
    penalizeJerkiness: boolean;
    bonusSpringPop: boolean;
  };
}

// Calibrated from Material Design 3, IBM Carbon, CSS defaults
// See: fixtures/scene-fitness-calibration.json, scripts/analyze-calibration.ts
const scenePreferences: Record<UISceneType, ScenePreference> = {
  "list-loading": {
    velocityBias: { target: 0.73, sigma: 0.2 },
    inOutBalance: { target: 0.85, sigma: 0.25 },
    linearness: { target: 0.33, sigma: 0.3 },
    overshootMax: 0.15,
    duration: { ideal: [0.3, 0.45] },
    weights: { curve: 0.65, duration: 0.25, stability: 0.1 },
    stabilityFlags: { penalizeSettle: false, penalizeJerkiness: false, bonusSpringPop: false },
  },
  drawer: {
    velocityBias: { target: 0.69, sigma: 0.2 },
    inOutBalance: { target: 0.95, sigma: 0.25 },
    linearness: { target: 0.2, sigma: 0.25 },
    overshootMax: 0.12,
    duration: { ideal: [0.25, 0.4] },
    weights: { curve: 0.6, duration: 0.3, stability: 0.1 },
    stabilityFlags: { penalizeSettle: false, penalizeJerkiness: false, bonusSpringPop: false },
  },
  skeleton: {
    velocityBias: { target: 0.5, sigma: 0.2 },
    inOutBalance: { target: 0.0, sigma: 0.5 },
    linearness: { target: 1.0, sigma: 0.4 },
    overshootMax: 0,
    duration: { ideal: [1.0, 2.0] },
    weights: { curve: 0.6, duration: 0.3, stability: 0.1 },
    stabilityFlags: { penalizeSettle: false, penalizeJerkiness: true, bonusSpringPop: false },
  },
  "button-hover": {
    velocityBias: { target: 0.64, sigma: 0.2 },
    inOutBalance: { target: 0.95, sigma: 0.25 },
    linearness: { target: 0.33, sigma: 0.25 },
    overshootMax: 0.1,
    duration: { ideal: [0.12, 0.22] },
    weights: { curve: 0.55, duration: 0.35, stability: 0.1 },
    stabilityFlags: { penalizeSettle: false, penalizeJerkiness: false, bonusSpringPop: true },
  },
  modal: {
    velocityBias: { target: 0.78, sigma: 0.2 },
    inOutBalance: { target: 0.94, sigma: 0.25 },
    linearness: { target: 0.21, sigma: 0.25 },
    overshootMax: 0.2,
    duration: { ideal: [0.2, 0.35] },
    weights: { curve: 0.65, duration: 0.25, stability: 0.1 },
    stabilityFlags: { penalizeSettle: false, penalizeJerkiness: false, bonusSpringPop: true },
  },
  toast: {
    velocityBias: { target: 0.76, sigma: 0.2 },
    inOutBalance: { target: 0.83, sigma: 0.25 },
    linearness: { target: 0.28, sigma: 0.3 },
    overshootMax: 0.1,
    duration: { ideal: [0.25, 0.4] },
    weights: { curve: 0.65, duration: 0.25, stability: 0.1 },
    stabilityFlags: { penalizeSettle: false, penalizeJerkiness: false, bonusSpringPop: true },
  },
  "tab-switch": {
    velocityBias: { target: 0.54, sigma: 0.2 },
    inOutBalance: { target: 0.95, sigma: 0.25 },
    linearness: { target: 0.35, sigma: 0.25 },
    overshootMax: 0,
    duration: { ideal: [0.18, 0.28] },
    weights: { curve: 0.6, duration: 0.25, stability: 0.15 },
    stabilityFlags: { penalizeSettle: true, penalizeJerkiness: false, bonusSpringPop: false },
  },
  accordion: {
    velocityBias: { target: 0.54, sigma: 0.2 },
    inOutBalance: { target: 0.95, sigma: 0.25 },
    linearness: { target: 0.35, sigma: 0.25 },
    overshootMax: 0,
    duration: { ideal: [0.22, 0.35] },
    weights: { curve: 0.6, duration: 0.25, stability: 0.15 },
    stabilityFlags: { penalizeSettle: true, penalizeJerkiness: false, bonusSpringPop: false },
  },
  "page-transition": {
    velocityBias: { target: 0.56, sigma: 0.2 },
    inOutBalance: { target: 1.0, sigma: 0.25 },
    linearness: { target: 0.25, sigma: 0.25 },
    overshootMax: 0.1,
    duration: { ideal: [0.3, 0.45] },
    weights: { curve: 0.6, duration: 0.3, stability: 0.1 },
    stabilityFlags: { penalizeSettle: false, penalizeJerkiness: true, bonusSpringPop: false },
  },
  tooltip: {
    velocityBias: { target: 0.64, sigma: 0.2 },
    inOutBalance: { target: 0.95, sigma: 0.25 },
    linearness: { target: 0.37, sigma: 0.25 },
    overshootMax: 0.08,
    duration: { ideal: [0.1, 0.2] },
    weights: { curve: 0.55, duration: 0.35, stability: 0.1 },
    stabilityFlags: { penalizeSettle: false, penalizeJerkiness: false, bonusSpringPop: false },
  },
  carousel: {
    velocityBias: { target: 0.56, sigma: 0.2 },
    inOutBalance: { target: 1.0, sigma: 0.25 },
    linearness: { target: 0.25, sigma: 0.25 },
    overshootMax: 0,
    duration: { ideal: [0.3, 0.45] },
    weights: { curve: 0.6, duration: 0.25, stability: 0.15 },
    stabilityFlags: { penalizeSettle: true, penalizeJerkiness: false, bonusSpringPop: false },
  },
};

// ── Scoring functions (§8) ─────────────────────────────

function gaussian(value: number, target: number, sigma: number): number {
  const d = (value - target) / sigma;
  return Math.exp(-0.5 * d * d);
}

function scoreCurveFit(traits: CurveTraits, pref: ScenePreference): number {
  const sVB = gaussian(traits.velocityBias, pref.velocityBias.target, pref.velocityBias.sigma);
  const sIO = gaussian(traits.inOutBalance, pref.inOutBalance.target, pref.inOutBalance.sigma);
  const sLin = gaussian(traits.linearness, pref.linearness.target, pref.linearness.sigma);
  let score = (sVB + sIO + sLin) / 3;

  // Overshoot penalty
  if (traits.overshootAmount > pref.overshootMax) {
    const excess = traits.overshootAmount - pref.overshootMax;
    score *= Math.max(0, 1 - excess * 4);
  }
  return score;
}

function scoreDuration(duration: number, ideal: [number, number]): number {
  const mid = (ideal[0] + ideal[1]) / 2;
  const sigma = (ideal[1] - ideal[0]) * 1.2;
  return gaussian(duration, mid, Math.max(sigma, 0.05));
}

function scoreStability(traits: CurveTraits, pref: ScenePreference): number {
  const excess_os = Math.max(0, traits.overshootAmount - pref.overshootMax);
  const factor_overshoot = Math.max(0.1, 1 - excess_os * 3);

  let factor_settle = 1;
  if (pref.stabilityFlags.penalizeSettle) {
    const excess_settle = Math.max(0, traits.settleTimeRatio - 0.4);
    factor_settle = Math.max(0.2, 1 - excess_settle * 2);
  }

  let factor_jerkiness = 1;
  if (pref.stabilityFlags.penalizeJerkiness) {
    const excess_jerk = Math.max(0, traits.jerkiness - 0.3);
    factor_jerkiness = Math.max(0.3, 1 - excess_jerk * 1.5);
  }

  let factor_pop = 1;
  if (pref.stabilityFlags.bonusSpringPop) {
    if (
      traits.overshootAmount >= 0.05 &&
      traits.overshootAmount <= 0.2 &&
      traits.settleTimeRatio < 0.35
    ) {
      factor_pop = 1.1;
    }
  }

  return clamp(factor_overshoot * factor_settle * factor_jerkiness * factor_pop, 0, 1);
}

// ── Tip generation (§11) ──────────────────────────────

type IssueType =
  | "overshoot"
  | "curve_shape"
  | "spring_bounce"
  | "spring_overdamped"
  | "duration_short"
  | "duration_long"
  | "jerkiness";

interface IssueEntry {
  type: IssueType;
  priority: number;
  score: number;
}

const tipTemplates: Record<IssueType, string> = {
  overshoot: "Overshoot may feel jarring for {sceneLabel}",
  curve_shape: "{suggestedCurveType} would better match {sceneLabel}",
  spring_bounce: "Spring is underdamped — consider increasing damping",
  spring_overdamped: "Spring feels sluggish — try reducing damping",
  duration_short: "Duration too short — try {idealDuration} for {sceneLabel}",
  duration_long: "Duration too long — try {idealDuration} for {sceneLabel}",
  jerkiness: "Curve has abrupt speed changes — try a smoother easing",
};

const greatTips: Record<UISceneType, string> = {
  "list-loading": "Ease-out curve with good timing for staggered entrances",
  drawer: "Smooth deceleration, perfect for drawer slide",
  skeleton: "Smooth, steady sweep ideal for skeleton shimmer",
  "button-hover": "Quick responsive feedback, ideal for micro-interactions",
  modal: "Smooth entrance with natural deceleration",
  toast: "Snappy entrance, great for notifications",
  "tab-switch": "Smooth slide, perfect for tab indicators",
  accordion: "Smooth expand/collapse, natural feel",
  "page-transition": "Elegant page transition with balanced timing",
  tooltip: "Quick and subtle, ideal for tooltips",
  carousel: "Smooth sliding motion, great for carousels",
};

const goodTips: Record<UISceneType, string> = {
  "list-loading": "Works well for list animations",
  drawer: "Decent feel for drawer transitions",
  skeleton: "Acceptable for shimmer effects",
  "button-hover": "Good responsiveness for hover states",
  modal: "Solid feel for modal appearance",
  toast: "Works well for toast slide-in",
  "tab-switch": "Works nicely for tab transitions",
  accordion: "Good for accordion animations",
  "page-transition": "Solid feel for page changes",
  tooltip: "Good responsiveness for tooltip appearance",
  carousel: "Works well for slide transitions",
};

function detectSuggestedCurveType(pref: ScenePreference): string {
  if (pref.linearness.target > 0.7) return "a linear curve";
  if (pref.inOutBalance.target > 0.5) return "an ease-in-out curve";
  return "an ease-out curve";
}

function generateTip(
  scene: UISceneType,
  level: FitnessLevel,
  traits: CurveTraits,
  pref: ScenePreference,
  curveFitScore: number,
  durationScore: number,
  stabilityScore: number,
  duration: number,
  dampingRatio?: number,
): string {
  if (level === "great") return greatTips[scene];
  if (level === "good") return goodTips[scene];

  const ideal = pref.duration.ideal;
  const idealStr = `${ideal[0]}–${ideal[1]}s`;
  const sceneLabel = uiSceneLabels[scene].toLowerCase();
  const suggested = detectSuggestedCurveType(pref);

  // Collect issues
  const issues: IssueEntry[] = [];

  if (traits.overshootAmount > pref.overshootMax && pref.overshootMax < 0.05) {
    issues.push({ type: "overshoot", priority: 1, score: stabilityScore });
  }
  if (curveFitScore < 0.6) {
    issues.push({ type: "curve_shape", priority: 2, score: curveFitScore });
  }
  if (dampingRatio !== undefined) {
    if (dampingRatio < 0.3 && traits.overshootAmount > 0.1) {
      issues.push({ type: "spring_bounce", priority: 3, score: stabilityScore });
    } else if (dampingRatio > 1.5) {
      issues.push({ type: "spring_overdamped", priority: 3, score: curveFitScore });
    }
  }
  if (duration < ideal[0]) {
    issues.push({ type: "duration_short", priority: 4, score: durationScore });
  } else if (duration > ideal[1]) {
    issues.push({ type: "duration_long", priority: 4, score: durationScore });
  }
  if (traits.jerkiness > 0.5) {
    issues.push({ type: "jerkiness", priority: 5, score: 1 - traits.jerkiness });
  }

  // Sort by priority, take top issue
  issues.sort((a, b) => a.priority - b.priority);
  const main = issues[0];
  if (!main) {
    return `Try ${suggested} at ${idealStr} for ${sceneLabel}`;
  }

  let tip = tipTemplates[main.type]
    .replace("{sceneLabel}", sceneLabel)
    .replace("{idealDuration}", idealStr)
    .replace("{suggestedCurveType}", suggested);

  // Append secondary issue if present and low scoring
  if (issues.length > 1 && issues[1].score < 0.5) {
    const sec = tipTemplates[issues[1].type]
      .replace("{sceneLabel}", sceneLabel)
      .replace("{idealDuration}", idealStr)
      .replace("{suggestedCurveType}", suggested);
    tip += `; ${sec.charAt(0).toLowerCase()}${sec.slice(1)}`;
  }

  return tip;
}

// ── Utilities ──────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ── Main scoring function (§5) ─────────────────────────

const SAMPLE_COUNT = 64;

export function getSceneFitness(
  scene: UISceneType,
  curve: CurveInput | BezierInput,
  duration: number,
): SceneFitness {
  const pref = scenePreferences[scene];

  let traits: CurveTraits;
  let dampingRatio: number | undefined;
  let effectiveDuration = duration;

  // Determine curve type and extract traits
  const input = normalizeCurveInput(curve);

  if (input.type === "bezier") {
    traits = bezierShortcutTraits(input);
  } else if (input.type === "spring") {
    const result = sampleSpring(input, SAMPLE_COUNT);
    const samples = buildSamples(result.ys, SAMPLE_COUNT);
    traits = extractTraits(samples);
    dampingRatio = result.dampingRatio;
    effectiveDuration = result.settleTime;
  } else {
    const ys = sampleCustom(input, SAMPLE_COUNT);
    const samples = buildSamples(ys, SAMPLE_COUNT);
    traits = extractTraits(samples);
  }

  // Score
  const curveFit = scoreCurveFit(traits, pref);
  const dur = scoreDuration(effectiveDuration, pref.duration.ideal);
  const stability = scoreStability(traits, pref);

  const w = pref.weights;
  const totalScore = curveFit * w.curve + dur * w.duration + stability * w.stability;

  // Level mapping (§10)
  let level: FitnessLevel;
  if (totalScore >= 0.78) level = "great";
  else if (totalScore >= 0.58) level = "good";
  else if (totalScore >= 0.38) level = "fair";
  else level = "poor";

  const tip = generateTip(
    scene,
    level,
    traits,
    pref,
    curveFit,
    dur,
    stability,
    effectiveDuration,
    dampingRatio,
  );

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
      curveFit: curveFit,
      duration: dur,
      stability: stability,
      total: totalScore,
    },
    weights: w,
  };
}

// ── Input normalization (backward compat) ──────────────

function normalizeCurveInput(curve: CurveInput | BezierInput): CurveInput {
  if ("type" in curve) return curve as CurveInput;
  // Legacy BezierInput without type field
  return { type: "bezier", ...(curve as BezierInput) };
}
