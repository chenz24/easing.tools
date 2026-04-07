import type { SpringValues } from "@/hooks/useSpringStore";
import type { AnimationType, FillType, PreviewItem, ShapeType } from "@/lib/previewTypes";
import { calculateSpringPoints } from "@/lib/springCurves";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { PreviewEditMenu } from "./PreviewEditMenu";

interface SpringAnimationPreviewProps {
  preview: PreviewItem;
  registerRef: (el: HTMLDivElement | null) => void;
  onUpdateShape: (shape: ShapeType) => void;
  onUpdateFill: (fill: FillType) => void;
  onUpdateAnimation: (animation: AnimationType) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

// Apply spring transform directly to a DOM element (no React re-render)
function applySpringTransform(el: HTMLElement, animation: AnimationType, value: number) {
  const v = Math.max(0, Math.min(value, 2));
  switch (animation) {
    case "position":
      el.style.transform = `translateX(${(v - 0.5) * 60}px)`;
      el.style.opacity = "";
      el.style.filter = "";
      break;
    case "scale":
      el.style.transform = `scale(${0.5 + v * 0.7})`;
      el.style.opacity = "";
      el.style.filter = "";
      break;
    case "opacity":
      el.style.transform = "";
      el.style.opacity = `${v}`;
      el.style.filter = "";
      break;
    case "rotation":
      el.style.transform = `rotate(${v * 180}deg)`;
      el.style.opacity = "";
      el.style.filter = "";
      break;
    case "combined":
      el.style.transform = `translateX(${(v - 0.5) * 40}px) scale(${0.8 + v * 0.3})`;
      el.style.opacity = `${0.3 + v * 0.7}`;
      el.style.filter = "";
      break;
    case "bounce":
      el.style.transform = `translateY(${(1 - v) * 30 - 15}px)`;
      el.style.opacity = "";
      el.style.filter = "";
      break;
    case "slide":
      el.style.transform = `translateX(${(v - 1) * 40}px)`;
      el.style.opacity = `${v}`;
      el.style.filter = "";
      break;
    case "path-follow":
      el.style.transform = `translate(${(v - 0.5) * 60}px, ${Math.sin(v * Math.PI) * -15}px) rotate(${v * 180}deg)`;
      el.style.opacity = "";
      el.style.filter = "";
      break;
    case "color-shift":
      el.style.transform = "";
      el.style.opacity = "";
      el.style.filter = `hue-rotate(${v * 90}deg)`;
      break;
    case "blur":
      el.style.transform = "";
      el.style.opacity = `${0.3 + v * 0.7}`;
      el.style.filter = `blur(${(1 - v) * 8}px)`;
      break;
  }
}

export function SpringAnimationPreview({
  preview,
  registerRef,
  onUpdateShape,
  onUpdateFill,
  onUpdateAnimation,
  onDuplicate,
  onDelete,
}: SpringAnimationPreviewProps) {
  const { shape, fill } = preview;

  // Render SVG shape for halftone/gradient/outline fills
  const renderSVGShape = (fillValue: string, isOutline = false) => {
    const strokeProps = isOutline
      ? { stroke: "hsl(var(--primary))", strokeWidth: 2.5, fill: "none" }
      : { fill: fillValue };

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

  const renderShape = () => {
    const sizeClass = "h-12 w-12";
    const smallSize = "h-10 w-10";

    if (fill === "halftone") {
      return (
        <div className={sizeClass}>
          <svg viewBox="0 0 48 48" className="h-full w-full">
            <defs>
              <pattern
                id={`spring-halftone-${preview.id}`}
                patternUnits="userSpaceOnUse"
                width="4"
                height="4"
              >
                <circle cx="2" cy="2" r="1.2" className="fill-primary" />
              </pattern>
            </defs>
            {renderSVGShape(`url(#spring-halftone-${preview.id})`)}
          </svg>
        </div>
      );
    }

    if (fill === "gradient") {
      return (
        <div className={sizeClass}>
          <svg viewBox="0 0 48 48" className="h-full w-full">
            <defs>
              <linearGradient
                id={`spring-gradient-${preview.id}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" className="[stop-color:hsl(var(--primary))]" />
                <stop offset="100%" className="[stop-color:hsl(280,77%,54%)]" />
              </linearGradient>
            </defs>
            {renderSVGShape(`url(#spring-gradient-${preview.id})`)}
          </svg>
        </div>
      );
    }

    if (fill === "outline") {
      return (
        <div className={sizeClass}>
          <svg viewBox="0 0 48 48" className="h-full w-full">
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

    return <div className={shapeClasses[shape]} />;
  };

  return (
    <div className="preview-card group relative flex aspect-square items-center justify-center rounded-xl">
      {/* Animated wrapper — transforms applied directly via DOM ref */}
      <div ref={registerRef}>{renderShape()}</div>
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

// Panel component that renders all previews with a SINGLE animation loop
interface SpringAnimationPreviewPanelProps {
  previews: PreviewItem[];
  spring: SpringValues;
  duration: number;
  animationKey: number;
  isPlaying: boolean;
  onUpdateShape: (id: string, shape: ShapeType) => void;
  onUpdateFill: (id: string, fill: FillType) => void;
  onUpdateAnimation: (id: string, animation: AnimationType) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SpringAnimationPreviewPanel({
  previews,
  spring,
  duration,
  animationKey,
  isPlaying,
  onUpdateShape,
  onUpdateFill,
  onUpdateAnimation,
  onDuplicate,
  onDelete,
}: SpringAnimationPreviewPanelProps) {
  // Pre-compute spring curve points once
  const points = useMemo(
    () => calculateSpringPoints({ ...spring, duration, id: "", name: "" }, 200),
    [spring, duration],
  );

  // Ref map: preview id → DOM element
  const shapeRefs = useRef<Map<string, HTMLElement>>(new Map());

  const registerShapeRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) shapeRefs.current.set(id, el);
    else shapeRefs.current.delete(id);
  }, []);

  // Single rAF loop for ALL shapes — zero React re-renders during animation
  useEffect(() => {
    if (!isPlaying) return;
    let startTime: number | null = null;
    let rafId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const t = Math.min(elapsed / duration, 1);
      const pointIndex = Math.floor(t * (points.length - 1));
      const value = points[pointIndex]?.value ?? 0;

      previews.forEach((p) => {
        const el = shapeRefs.current.get(p.id);
        if (el) applySpringTransform(el, p.animation, value);
      });

      if (t < 1) rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, animationKey, duration, points, previews]);

  // Reset all shapes when animation key changes
  useEffect(() => {
    previews.forEach((p) => {
      const el = shapeRefs.current.get(p.id);
      if (el) applySpringTransform(el, p.animation, 0);
    });
  }, [animationKey, previews]);

  return (
    <div className="grid grid-cols-2 gap-3">
      {previews.map((preview) => (
        <SpringAnimationPreview
          key={preview.id}
          preview={preview}
          registerRef={(el) => registerShapeRef(preview.id, el)}
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
