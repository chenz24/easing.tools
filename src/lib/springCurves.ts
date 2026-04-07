export interface SpringCurve {
  id: string;
  name: string;
  mass: number;
  stiffness: number;
  damping: number;
  velocity: number;
  duration: number;
  isCustom?: boolean;
}

// Helper: compute auto-duration for a spring preset (settling time rounded to 1 decimal, clamped)
export function autoSpringDuration(params: {
  mass: number;
  stiffness: number;
  damping: number;
  velocity: number;
}): number {
  const t = calculateSettlingTime(params, 0.001);
  return Math.round(Math.max(0.2, Math.min(t, 30)) * 10) / 10;
}

// Duration for each preset is auto-calculated from spring parameters (settling time at 0.1% threshold)
export const defaultSpringCurves: SpringCurve[] = (() => {
  const presets: Omit<SpringCurve, "duration">[] = [
    // jump: quick rise → overshoot → small oscillation → settle (exact from Couverture)
    { id: "spring-jump", name: "jump", mass: 0.04, stiffness: 10, damping: 0.7, velocity: 8 },
    // beat: sharp spike → large overshoot → 2-3 decaying oscillations
    { id: "spring-beat", name: "beat", mass: 0.13, stiffness: 5.7, damping: 1.2, velocity: 10.0 },
    // plopp: multiple oscillations (~4-5), medium frequency, bouncy
    { id: "spring-plopp", name: "plopp", mass: 0.2, stiffness: 20.0, damping: 0.68, velocity: 0 },
    // breeze: moderate oscillation (~3-4 cycles), gentle decay
    {
      id: "spring-breeze",
      name: "breeze",
      mass: 0.42,
      stiffness: 5.85,
      damping: 1.85,
      velocity: 4.2,
    },
    // wave: very oscillatory, many cycles (~5-7), slow decay
    { id: "spring-wave", name: "wave", mass: 0.36, stiffness: 10.0, damping: 0.88, velocity: 1.65 },
    // peak: rapid small oscillations, high frequency, quick settle
    { id: "spring-peak", name: "peak", mass: 0.02, stiffness: 7.1, damping: 0.21, velocity: 9.15 },
    // lightning: very sharp spike, nearly no oscillation, instant settle
    {
      id: "spring-lightning",
      name: "lightning",
      mass: 0.04,
      stiffness: 20,
      damping: 1.1,
      velocity: 0,
    },
    // viscous: slow heavy rise, big overshoot, slow single-cycle settle
    {
      id: "spring-viscous",
      name: "viscous",
      mass: 0.94,
      stiffness: 4.6,
      damping: 3.58,
      velocity: 4.0,
    },
    // dribble: extreme oscillation, barely decaying, very low damping (exact from Couverture)
    {
      id: "spring-dribble",
      name: "dribble",
      mass: 0.08,
      stiffness: 4.75,
      damping: 0.05,
      velocity: 0,
    },
    // throw: multiple oscillations with medium decay, moderate bounce
    {
      id: "spring-throw",
      name: "throw",
      mass: 0.1,
      stiffness: 7.15,
      damping: 0.43,
      velocity: 3.25,
    },
    // catch: smooth overdamped rise, no oscillation, S-curve approach
    { id: "spring-catch", name: "catch", mass: 0.2, stiffness: 4, damping: 2.0, velocity: 0 },
    // attention: long oscillation, many cycles, low-frequency wobble
    {
      id: "spring-attention",
      name: "attention",
      mass: 0.1,
      stiffness: 3.25,
      damping: 0.25,
      velocity: 0,
    },
    // slide: smooth rise with slight overshoot, polished transition
    { id: "spring-slide", name: "slide", mass: 0.21, stiffness: 2.8, damping: 1.28, velocity: 3.0 },
  ];
  return presets.map((p) => ({ ...p, duration: autoSpringDuration(p) }));
})();

export const SPRING_STORAGE_KEY = "easing-tools-custom-springs";

export function getCustomSprings(): SpringCurve[] {
  try {
    const stored = localStorage.getItem(SPRING_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load custom springs:", e);
  }
  return [];
}

export function saveCustomSprings(curves: SpringCurve[]): void {
  try {
    localStorage.setItem(SPRING_STORAGE_KEY, JSON.stringify(curves));
  } catch (e) {
    console.error("Failed to save custom springs:", e);
  }
}

// Generate CSS spring() function (experimental) or keyframes
export function formatSpringCSS(spring: SpringCurve): string {
  // Since CSS doesn't natively support spring(), we provide the parameters
  return `/* Spring Animation Parameters */
mass: ${spring.mass}
stiffness: ${spring.stiffness}
damping: ${spring.damping}
velocity: ${spring.velocity}`;
}

export function formatSpringJSON(spring: SpringCurve): string {
  return JSON.stringify(
    {
      mass: spring.mass,
      stiffness: spring.stiffness,
      damping: spring.damping,
      velocity: spring.velocity,
    },
    null,
    2,
  );
}

/**
 * Calculate the settling time of a spring (time to stay within threshold of target).
 * Uses the envelope decay: |envelope| < threshold => t > -ln(threshold) / (zeta * omega0)
 */
export function calculateSettlingTime(
  spring: { mass: number; stiffness: number; damping: number; velocity: number },
  threshold = 0.001,
): number {
  const { mass, stiffness, damping, velocity } = spring;
  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  if (zeta <= 0) return 10; // safety fallback

  if (zeta < 1) {
    // Underdamped: envelope = A * exp(-zeta*omega0*t)
    // Compute amplitude factor A that accounts for initial velocity
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    const A = Math.sqrt(1 + ((zeta * omega0 - velocity) / omegaD) ** 2);
    return -Math.log(threshold / Math.max(A, 1)) / (zeta * omega0);
  }
  if (zeta === 1) {
    // Critically damped: (1 + (omega0 - v)*t) * exp(-omega0*t)
    // Use iterative approach for accuracy
    let t = -Math.log(threshold) / omega0;
    // Refine: account for the polynomial term
    t += 2 / omega0;
    return Math.max(t, 0.1);
  }
  // Overdamped: dominated by the slower decay rate
  const s2 = omega0 * (zeta - Math.sqrt(zeta * zeta - 1));
  return -Math.log(threshold) / s2;
}

/**
 * Compute the value of a spring at time t (seconds).
 * Handles underdamped, critically-damped, and overdamped cases.
 * Returns 0 → 1 (with possible overshoot) as t increases.
 */
export function springValueAt(t: number, omega0: number, zeta: number, velocity: number): number {
  if (zeta < 1) {
    // Underdamped (oscillatory)
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    const envelope = Math.exp(-zeta * omega0 * t);
    const phase = Math.atan2(zeta * omega0 - velocity, omegaD);
    return 1 - (envelope * Math.cos(omegaD * t - phase)) / Math.cos(phase);
  }
  if (zeta === 1) {
    // Critically damped
    return 1 - (1 + (omega0 - velocity) * t) * Math.exp(-omega0 * t);
  }
  // Overdamped
  const s1 = -omega0 * (zeta + Math.sqrt(zeta * zeta - 1));
  const s2 = -omega0 * (zeta - Math.sqrt(zeta * zeta - 1));
  const c2 = (s1 + velocity) / (s1 - s2);
  const c1 = 1 - c2;
  return 1 - c1 * Math.exp(s1 * t) - c2 * Math.exp(s2 * t);
}

// Calculate spring animation curve points for visualization
export function calculateSpringPoints(
  spring: SpringCurve,
  steps = 100,
): { t: number; value: number }[] {
  const { mass, stiffness, damping, velocity } = spring;
  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  const points: { t: number; value: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const tNorm = i / steps;
    const tSeconds = tNorm * spring.duration;
    points.push({ t: tNorm, value: springValueAt(tSeconds, omega0, zeta, velocity) });
  }
  return points;
}
