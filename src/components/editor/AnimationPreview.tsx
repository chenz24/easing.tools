import { formatCubicBezier } from "@/lib/easingCurves";
import type { AnimationType, FillType, PreviewItem, ShapeType } from "@/lib/previewTypes";
import { PreviewEditMenu } from "./PreviewEditMenu";

interface AnimationPreviewProps {
  preview: PreviewItem;
  bezierCSS: string;
  duration: number;
  animationKey: number;
  isPlaying: boolean;
  onUpdateShape: (shape: ShapeType) => void;
  onUpdateFill: (fill: FillType) => void;
  onUpdateAnimation: (animation: AnimationType) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

// Animation name mapping
const animationNames: Record<AnimationType, string> = {
  position: "preview-position",
  scale: "preview-scale",
  opacity: "preview-opacity",
  rotation: "preview-rotation",
  combined: "preview-combined",
  bounce: "preview-bounce",
  slide: "preview-slide",
  "path-follow": "preview-path-follow",
  "color-shift": "preview-color-shift",
  blur: "preview-blur",
};

export function AnimationPreview({
  preview,
  bezierCSS,
  duration,
  animationKey,
  isPlaying,
  onUpdateShape,
  onUpdateFill,
  onUpdateAnimation,
  onDuplicate,
  onDelete,
}: AnimationPreviewProps) {
  const { shape, fill, animation } = preview;

  const animationStyle: React.CSSProperties = {
    animationTimingFunction: bezierCSS,
    animationDuration: `${duration}s`,
    animationIterationCount: "infinite",
    animationDirection: "alternate",
    animationPlayState: isPlaying ? "running" : "paused",
    animationName: animationNames[animation],
  };

  // Render the shape based on configuration
  const renderShape = () => {
    // Size classes for shapes
    const sizeClass = "h-12 w-12";
    const smallSize = "h-10 w-10";

    // Handle halftone fill (special SVG pattern)
    if (fill === "halftone") {
      return (
        <div className={sizeClass}>
          <svg
            viewBox="0 0 48 48"
            className="h-full w-full"
            key={animationKey}
            style={animationStyle}
          >
            <defs>
              <pattern
                id={`halftone-${preview.id}`}
                patternUnits="userSpaceOnUse"
                width="4"
                height="4"
              >
                <circle cx="2" cy="2" r="1.2" className="fill-primary" />
              </pattern>
            </defs>
            {renderSVGShape(`url(#halftone-${preview.id})`)}
          </svg>
        </div>
      );
    }

    // Handle gradient fill (SVG)
    if (fill === "gradient") {
      return (
        <div className={sizeClass}>
          <svg
            viewBox="0 0 48 48"
            className="h-full w-full"
            key={animationKey}
            style={animationStyle}
          >
            <defs>
              <linearGradient id={`gradient-${preview.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className="[stop-color:hsl(var(--primary))]" />
                <stop offset="100%" className="[stop-color:hsl(280,77%,54%)]" />
              </linearGradient>
            </defs>
            {renderSVGShape(`url(#gradient-${preview.id})`)}
          </svg>
        </div>
      );
    }

    // Handle outline fill (SVG)
    if (fill === "outline") {
      return (
        <div className={sizeClass}>
          <svg
            viewBox="0 0 48 48"
            className="h-full w-full"
            key={animationKey}
            style={animationStyle}
          >
            {renderSVGShape("none", true)}
          </svg>
        </div>
      );
    }

    // Solid fill (CSS)
    const baseClasses = `${smallSize} bg-primary`;
    const shapeClasses: Record<ShapeType, string> = {
      ellipse: `${baseClasses} rounded-full`,
      squircle: `${baseClasses} rounded-xl`,
      rectangle: `${baseClasses}`,
      rhombus: `${baseClasses} rotate-45`,
    };

    return <div key={animationKey} className={shapeClasses[shape]} style={animationStyle} />;
  };

  // Render SVG shape based on shape type
  const renderSVGShape = (fill: string, isOutline = false) => {
    const strokeProps = isOutline
      ? { stroke: "hsl(var(--primary))", strokeWidth: 2.5, fill: "none" }
      : { fill };

    switch (shape) {
      case "ellipse":
        return <circle cx="24" cy="24" r="20" {...strokeProps} />;
      case "squircle":
        return <rect x="4" y="4" width="40" height="40" rx="10" {...strokeProps} />;
      case "rectangle":
        return <rect x="6" y="10" width="36" height="28" {...strokeProps} />;
      case "rhombus":
        return <polygon points="24,4 44,24 24,44 4,24" {...strokeProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="preview-card group relative flex aspect-square items-center justify-center rounded-xl">
      {renderShape()}
      {/* Edit menu - shows on hover */}
      <div className="absolute bottom-2 left-2">
        <PreviewEditMenu
          preview={preview}
          onUpdateShape={onUpdateShape}
          onUpdateFill={onUpdateFill}
          onUpdateAnimation={onUpdateAnimation}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

// Panel component that renders all previews
interface AnimationPreviewPanelProps {
  previews: PreviewItem[];
  bezier: { x1: number; y1: number; x2: number; y2: number };
  duration: number;
  animationKey: number;
  isPlaying: boolean;
  onUpdateShape: (id: string, shape: ShapeType) => void;
  onUpdateFill: (id: string, fill: FillType) => void;
  onUpdateAnimation: (id: string, animation: AnimationType) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AnimationPreviewPanel({
  previews,
  bezier,
  duration,
  animationKey,
  isPlaying,
  onUpdateShape,
  onUpdateFill,
  onUpdateAnimation,
  onDuplicate,
  onDelete,
}: AnimationPreviewPanelProps) {
  const bezierCSS = formatCubicBezier(bezier.x1, bezier.y1, bezier.x2, bezier.y2);

  return (
    <div className="grid grid-cols-2 gap-3">
      {previews.map((preview) => (
        <AnimationPreview
          key={preview.id}
          preview={preview}
          bezierCSS={bezierCSS}
          duration={duration}
          animationKey={animationKey}
          isPlaying={isPlaying}
          onUpdateShape={(shape) => onUpdateShape(preview.id, shape)}
          onUpdateFill={(fill) => onUpdateFill(preview.id, fill)}
          onUpdateAnimation={(anim) => onUpdateAnimation(preview.id, anim)}
          onDuplicate={() => onDuplicate(preview.id)}
          onDelete={() => onDelete(preview.id)}
        />
      ))}
    </div>
  );
}
