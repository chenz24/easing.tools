// UI Scene types for contextual preview
export type UISceneType =
  | "list-loading"
  | "drawer"
  | "skeleton"
  | "button-hover"
  | "modal"
  | "toast"
  | "tab-switch"
  | "accordion"
  | "page-transition"
  | "tooltip"
  | "carousel";

// UI Scene display names
export const uiSceneLabels: Record<UISceneType, string> = {
  "list-loading": "List Loading",
  drawer: "Drawer",
  skeleton: "Skeleton",
  "button-hover": "Button Hover",
  modal: "Modal",
  toast: "Toast",
  "tab-switch": "Tab Switch",
  accordion: "Accordion",
  "page-transition": "Page Transition",
  tooltip: "Tooltip",
  carousel: "Carousel",
};

// UI Scene descriptions
export const uiSceneDescriptions: Record<UISceneType, string> = {
  "list-loading": "List items slide in sequentially",
  drawer: "Side panel slides out from edge",
  skeleton: "Loading shimmer effect sweeps across",
  "button-hover": "Button state transition on hover",
  modal: "Dialog appears with backdrop",
  toast: "Notification slides in and out",
  "tab-switch": "Tab indicator slides between options",
  accordion: "Content expands and collapses",
  "page-transition": "Page slides and fades in/out",
  tooltip: "Tooltip scales and fades in",
  carousel: "Slides horizontally between items",
};
