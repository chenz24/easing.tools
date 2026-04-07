// Spring-specific UI Scene types
export type SpringSceneType =
  | "pull-refresh"
  | "fab-expand"
  | "card-toss"
  | "swipe-dismiss"
  | "bottom-sheet"
  | "drag-settle"
  | "toggle-switch"
  | "modal-spring";

// Spring Scene display names
export const springSceneLabels: Record<SpringSceneType, string> = {
  "pull-refresh": "Pull to Refresh",
  "fab-expand": "FAB Expand",
  "card-toss": "Card Toss",
  "swipe-dismiss": "Swipe Dismiss",
  "bottom-sheet": "Bottom Sheet",
  "drag-settle": "Drag & Drop",
  "toggle-switch": "Toggle Switch",
  "modal-spring": "Spring Modal",
};

// Spring Scene descriptions
export const springSceneDescriptions: Record<SpringSceneType, string> = {
  "pull-refresh": "Indicator bounces back after pull release",
  "fab-expand": "Floating action button pops open with bounce",
  "card-toss": "Card flips or tosses with physical inertia",
  "swipe-dismiss": "Item slides away, remaining items reflow",
  "bottom-sheet": "Panel snaps to detent with spring physics",
  "drag-settle": "Element springs into place after drop",
  "toggle-switch": "Switch thumb bounces to opposite end",
  "modal-spring": "Dialog enters with controlled spring bounce",
};
