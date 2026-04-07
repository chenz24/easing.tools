// Shape types for preview items
export type ShapeType = "ellipse" | "squircle" | "rectangle" | "rhombus";

// Fill types for preview items
export type FillType = "solid" | "halftone" | "gradient" | "outline";

// Animation types for preview items
export type AnimationType =
  | "position"
  | "scale"
  | "opacity"
  | "rotation"
  | "combined"
  | "bounce"
  | "slide"
  | "path-follow"
  | "color-shift"
  | "blur";

// Preview item configuration
export interface PreviewItem {
  id: string;
  shape: ShapeType;
  fill: FillType;
  animation: AnimationType;
}

// Shape display names
export const shapeLabels: Record<ShapeType, string> = {
  ellipse: "Ellipse",
  squircle: "Squircle",
  rectangle: "Rectangle",
  rhombus: "Rhombus",
};

// Fill display names
export const fillLabels: Record<FillType, string> = {
  solid: "Solid",
  halftone: "Halftone",
  gradient: "Gradient",
  outline: "Outline",
};

// Animation display names
export const animationLabels: Record<AnimationType, string> = {
  position: "Position",
  scale: "Scale",
  opacity: "Opacity",
  rotation: "Rotation",
  combined: "Combined",
  bounce: "Bounce",
  slide: "Slide",
  "path-follow": "Path Follow",
  "color-shift": "Color Shift",
  blur: "Blur",
};

// Default preview items
export const defaultPreviewItems: PreviewItem[] = [
  { id: "preview-1", shape: "ellipse", fill: "halftone", animation: "scale" },
  { id: "preview-2", shape: "squircle", fill: "outline", animation: "position" },
  { id: "preview-3", shape: "rectangle", fill: "solid", animation: "bounce" },
  { id: "preview-4", shape: "rhombus", fill: "solid", animation: "rotation" },
  { id: "preview-5", shape: "rectangle", fill: "halftone", animation: "opacity" },
  { id: "preview-6", shape: "ellipse", fill: "gradient", animation: "combined" },
  { id: "preview-7", shape: "squircle", fill: "solid", animation: "slide" },
  { id: "preview-8", shape: "rectangle", fill: "outline", animation: "blur" },
];

export const PREVIEW_STORAGE_KEY = "easing-tools-preview-items";
