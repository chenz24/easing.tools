export type CurveCategory =
  | "classic"
  | "material-design-3"
  | "material-design"
  | "apple-hig"
  | "custom";

export interface CurveGroup {
  id: CurveCategory;
  name: string;
  description?: string;
}

export const CURVE_CATEGORIES: CurveGroup[] = [
  { id: "classic", name: "Classic Easing", description: "Standard easing functions" },
  { id: "material-design-3", name: "Material Design 3", description: "Google M3 motion system" },
  { id: "material-design", name: "Material Design 2", description: "Legacy MD curves" },
  { id: "apple-hig", name: "Apple HIG", description: "iOS/macOS system curves" },
  { id: "custom", name: "Custom", description: "Your saved curves" },
];

export interface EasingCurve {
  id: string;
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  duration: number;
  category?: CurveCategory;
  isCustom?: boolean;
}

export const defaultEasingCurves: EasingCurve[] = [
  // Linear
  { id: "linear", name: "linear", x1: 0, y1: 0, x2: 1, y2: 1, duration: 1.0, category: "classic" },

  // Sine
  {
    id: "easeInSine",
    name: "easeInSine",
    x1: 0.12,
    y1: 0,
    x2: 0.39,
    y2: 0,
    duration: 1.3,
    category: "classic",
  },
  {
    id: "easeOutSine",
    name: "easeOutSine",
    x1: 0.61,
    y1: 1,
    x2: 0.88,
    y2: 1,
    duration: 1.3,
    category: "classic",
  },
  {
    id: "easeInOutSine",
    name: "easeInOutSine",
    x1: 0.37,
    y1: 0,
    x2: 0.63,
    y2: 1,
    duration: 1.3,
    category: "classic",
  },

  // Quad
  {
    id: "easeInQuad",
    name: "easeInQuad",
    x1: 0.11,
    y1: 0,
    x2: 0.5,
    y2: 0,
    duration: 1.3,
    category: "classic",
  },
  {
    id: "easeOutQuad",
    name: "easeOutQuad",
    x1: 0.5,
    y1: 1,
    x2: 0.89,
    y2: 1,
    duration: 1.3,
    category: "classic",
  },
  {
    id: "easeInOutQuad",
    name: "easeInOutQuad",
    x1: 0.45,
    y1: 0,
    x2: 0.55,
    y2: 1,
    duration: 1.3,
    category: "classic",
  },

  // Cubic
  {
    id: "easeInCubic",
    name: "easeInCubic",
    x1: 0.32,
    y1: 0,
    x2: 0.67,
    y2: 0,
    duration: 1.3,
    category: "classic",
  },
  {
    id: "easeOutCubic",
    name: "easeOutCubic",
    x1: 0.33,
    y1: 1,
    x2: 0.68,
    y2: 1,
    duration: 1.3,
    category: "classic",
  },
  {
    id: "easeInOutCubic",
    name: "easeInOutCubic",
    x1: 0.65,
    y1: 0,
    x2: 0.35,
    y2: 1,
    duration: 1.3,
    category: "classic",
  },

  // Quart
  {
    id: "easeInQuart",
    name: "easeInQuart",
    x1: 0.5,
    y1: 0,
    x2: 0.75,
    y2: 0,
    duration: 1.3,
    category: "classic",
  },
  {
    id: "easeOutQuart",
    name: "easeOutQuart",
    x1: 0.25,
    y1: 1,
    x2: 0.5,
    y2: 1,
    duration: 1.3,
    category: "classic",
  },
  {
    id: "easeInOutQuart",
    name: "easeInOutQuart",
    x1: 0.76,
    y1: 0,
    x2: 0.24,
    y2: 1,
    duration: 1.3,
    category: "classic",
  },

  // Quint
  {
    id: "easeInQuint",
    name: "easeInQuint",
    x1: 0.64,
    y1: 0,
    x2: 0.78,
    y2: 0,
    duration: 1.3,
    category: "classic",
  },
  {
    id: "easeOutQuint",
    name: "easeOutQuint",
    x1: 0.22,
    y1: 1,
    x2: 0.36,
    y2: 1,
    duration: 1.3,
    category: "classic",
  },
  {
    id: "easeInOutQuint",
    name: "easeInOutQuint",
    x1: 0.83,
    y1: 0,
    x2: 0.17,
    y2: 1,
    duration: 1.3,
    category: "classic",
  },

  // Expo
  {
    id: "easeInExpo",
    name: "easeInExpo",
    x1: 0.7,
    y1: 0,
    x2: 0.84,
    y2: 0,
    duration: 1.3,
    category: "classic",
  },
  {
    id: "easeOutExpo",
    name: "easeOutExpo",
    x1: 0.16,
    y1: 1,
    x2: 0.3,
    y2: 1,
    duration: 1.3,
    category: "classic",
  },
  {
    id: "easeInOutExpo",
    name: "easeInOutExpo",
    x1: 0.87,
    y1: 0,
    x2: 0.13,
    y2: 1,
    duration: 1.3,
    category: "classic",
  },

  // Circ
  {
    id: "easeInCirc",
    name: "easeInCirc",
    x1: 0.55,
    y1: 0,
    x2: 1,
    y2: 0.45,
    duration: 1.3,
    category: "classic",
  },
  {
    id: "easeOutCirc",
    name: "easeOutCirc",
    x1: 0,
    y1: 0.55,
    x2: 0.45,
    y2: 1,
    duration: 1.3,
    category: "classic",
  },
  {
    id: "easeInOutCirc",
    name: "easeInOutCirc",
    x1: 0.85,
    y1: 0,
    x2: 0.15,
    y2: 1,
    duration: 1.3,
    category: "classic",
  },

  // Back (with overshoot)
  {
    id: "easeInBack",
    name: "easeInBack",
    x1: 0.36,
    y1: 0,
    x2: 0.66,
    y2: -0.56,
    duration: 1.3,
    category: "classic",
  },
  {
    id: "easeOutBack",
    name: "easeOutBack",
    x1: 0.34,
    y1: 1.56,
    x2: 0.64,
    y2: 1,
    duration: 1.3,
    category: "classic",
  },
  {
    id: "easeInOutBack",
    name: "easeInOutBack",
    x1: 0.68,
    y1: -0.6,
    x2: 0.32,
    y2: 1.6,
    duration: 1.3,
    category: "classic",
  },

  // ============================================
  // Material Design 3 (M3) Standard Easing
  // https://m3.material.io/styles/motion/easing-and-duration
  // ============================================

  // Emphasized - for important or expressive motion
  {
    id: "md3-emphasized",
    name: "M3 Emphasized",
    x1: 0.2,
    y1: 0,
    x2: 0,
    y2: 1,
    duration: 0.5,
    category: "material-design-3",
  },
  {
    id: "md3-emphasizedAccelerate",
    name: "M3 Emphasized Accelerate",
    x1: 0.3,
    y1: 0,
    x2: 0.8,
    y2: 0.15,
    duration: 0.2,
    category: "material-design-3",
  },
  {
    id: "md3-emphasizedDecelerate",
    name: "M3 Emphasized Decelerate",
    x1: 0.05,
    y1: 0.7,
    x2: 0.1,
    y2: 1,
    duration: 0.4,
    category: "material-design-3",
  },

  // Standard - for most common UI transitions
  {
    id: "md3-standard",
    name: "M3 Standard",
    x1: 0.2,
    y1: 0,
    x2: 0,
    y2: 1,
    duration: 0.3,
    category: "material-design-3",
  },
  {
    id: "md3-standardAccelerate",
    name: "M3 Standard Accelerate",
    x1: 0.3,
    y1: 0,
    x2: 1,
    y2: 1,
    duration: 0.2,
    category: "material-design-3",
  },
  {
    id: "md3-standardDecelerate",
    name: "M3 Standard Decelerate",
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 1,
    duration: 0.25,
    category: "material-design-3",
  },

  // Legacy Material Design 2 curves (still widely used)
  {
    id: "md-standard",
    name: "MD Standard",
    x1: 0.4,
    y1: 0,
    x2: 0.2,
    y2: 1,
    duration: 0.3,
    category: "material-design",
  },
  {
    id: "md-decelerate",
    name: "MD Decelerate",
    x1: 0,
    y1: 0,
    x2: 0.2,
    y2: 1,
    duration: 0.25,
    category: "material-design",
  },
  {
    id: "md-accelerate",
    name: "MD Accelerate",
    x1: 0.4,
    y1: 0,
    x2: 1,
    y2: 1,
    duration: 0.2,
    category: "material-design",
  },
  {
    id: "md-sharp",
    name: "MD Sharp",
    x1: 0.4,
    y1: 0,
    x2: 0.6,
    y2: 1,
    duration: 0.2,
    category: "material-design",
  },

  // ============================================
  // Apple Human Interface Guidelines
  // https://developer.apple.com/design/human-interface-guidelines/motion
  // ============================================

  // iOS/macOS System Animation Curves
  {
    id: "apple-default",
    name: "Apple Default",
    x1: 0.25,
    y1: 0.1,
    x2: 0.25,
    y2: 1,
    duration: 0.35,
    category: "apple-hig",
  },
  {
    id: "apple-easeIn",
    name: "Apple Ease In",
    x1: 0.42,
    y1: 0,
    x2: 1,
    y2: 1,
    duration: 0.35,
    category: "apple-hig",
  },
  {
    id: "apple-easeOut",
    name: "Apple Ease Out",
    x1: 0,
    y1: 0,
    x2: 0.58,
    y2: 1,
    duration: 0.35,
    category: "apple-hig",
  },
  {
    id: "apple-easeInOut",
    name: "Apple Ease In Out",
    x1: 0.42,
    y1: 0,
    x2: 0.58,
    y2: 1,
    duration: 0.35,
    category: "apple-hig",
  },

  // iOS Keyboard & Modal animations
  {
    id: "apple-keyboard",
    name: "Apple Keyboard",
    x1: 0.28,
    y1: 0.09,
    x2: 0.1,
    y2: 0.99,
    duration: 0.25,
    category: "apple-hig",
  },
  {
    id: "apple-modal",
    name: "Apple Modal Present",
    x1: 0.17,
    y1: 0.89,
    x2: 0.32,
    y2: 1.28,
    duration: 0.5,
    category: "apple-hig",
  },

  // iOS Spring-like bezier approximations
  {
    id: "apple-springGentle",
    name: "Apple Spring Gentle",
    x1: 0.5,
    y1: 1.8,
    x2: 0.32,
    y2: 1,
    duration: 0.6,
    category: "apple-hig",
  },
  {
    id: "apple-springBouncy",
    name: "Apple Spring Bouncy",
    x1: 0.68,
    y1: -0.55,
    x2: 0.27,
    y2: 1.55,
    duration: 0.5,
    category: "apple-hig",
  },
];

export const STORAGE_KEY = "easing-tools-custom-curves";

export function getCustomCurves(): EasingCurve[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load custom curves:", e);
  }
  return [];
}

export function saveCustomCurves(curves: EasingCurve[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(curves));
  } catch (e) {
    console.error("Failed to save custom curves:", e);
  }
}

export function formatCubicBezier(x1: number, y1: number, x2: number, y2: number): string {
  return `cubic-bezier(${x1.toFixed(2)}, ${y1.toFixed(2)}, ${x2.toFixed(2)}, ${y2.toFixed(2)})`;
}

export function formatJSON(x1: number, y1: number, x2: number, y2: number): string {
  return JSON.stringify(
    { x1: +x1.toFixed(2), y1: +y1.toFixed(2), x2: +x2.toFixed(2), y2: +y2.toFixed(2) },
    null,
    2,
  );
}

/**
 * Solve cubic bezier: given time (x in 0-1), return progression (y).
 * Uses Newton-Raphson to find parametric t where B_x(t) = x, then returns B_y(t).
 */
export function solveCubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x: number,
): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // B(t) = 3*(1-t)^2*t*c1 + 3*(1-t)*t^2*c2 + t^3
  const bx = (t: number) => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
  const by = (t: number) => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  // Derivative of B_x(t)
  const bxPrime = (t: number) =>
    3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);

  // Newton-Raphson
  let t = x; // initial guess
  for (let i = 0; i < 8; i++) {
    const dx = bx(t) - x;
    const d = bxPrime(t);
    if (Math.abs(d) < 1e-6) break;
    t -= dx / d;
  }
  t = Math.max(0, Math.min(1, t));

  return by(t);
}
