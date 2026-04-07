import type { BezierValues } from "@/hooks/useEasingStore";
import { CodeExportBase, type FormatDef, formatNumber as v } from "./CodeExportBase";

const allFormats: FormatDef<BezierValues>[] = [
  // Web
  {
    key: "css",
    label: "CSS",
    platform: "Web",
    language: "css",
    generate: (b) =>
      `transition-timing-function: cubic-bezier(${v(b.x1)}, ${v(b.y1)}, ${v(b.x2)}, ${v(b.y2)});`,
  },
  {
    key: "css-var",
    label: "CSS Variable",
    shortLabel: "CSS Var",
    platform: "Web",
    language: "css",
    generate: (b) => `--easing: cubic-bezier(${v(b.x1)}, ${v(b.y1)}, ${v(b.x2)}, ${v(b.y2)});`,
  },
  {
    key: "waapi",
    label: "Web Animations",
    shortLabel: "WAAPI",
    platform: "Web",
    language: "js",
    generate: (b) =>
      `element.animate(keyframes, {\n  duration: 400,\n  easing: "cubic-bezier(${v(b.x1)}, ${v(b.y1)}, ${v(b.x2)}, ${v(b.y2)})"\n});`,
  },
  {
    key: "framer",
    label: "Framer Motion",
    shortLabel: "Framer",
    platform: "Web",
    language: "jsx",
    generate: (b) =>
      `<motion.div\n  transition={{ ease: [${v(b.x1)}, ${v(b.y1)}, ${v(b.x2)}, ${v(b.y2)}] }}\n/>`,
  },
  {
    key: "gsap",
    label: "GSAP",
    platform: "Web",
    language: "js",
    generate: (b) =>
      `gsap.to(element, {\n  ease: CustomEase.create("custom",\n    "M0,0 C${v(b.x1)},${v(b.y1)} ${v(b.x2)},${v(b.y2)} 1,1"\n  )\n});`,
  },
  {
    key: "animejs",
    label: "Anime.js",
    shortLabel: "Anime",
    platform: "Web",
    language: "js",
    generate: (b) =>
      `anime({\n  targets: element,\n  easing: "cubicBezier(${v(b.x1)}, ${v(b.y1)}, ${v(b.x2)}, ${v(b.y2)})"\n});`,
  },
  {
    key: "tailwind",
    label: "Tailwind CSS",
    shortLabel: "Tailwind",
    platform: "Web",
    language: "html",
    generate: (b) => `ease-[cubic-bezier(${v(b.x1)},${v(b.y1)},${v(b.x2)},${v(b.y2)})]`,
  },
  // iOS
  {
    key: "swiftui",
    label: "SwiftUI",
    platform: "iOS",
    language: "swift",
    generate: (b) =>
      `.animation(.timingCurve(${v(b.x1)}, ${v(b.y1)}, ${v(b.x2)}, ${v(b.y2)}, duration: 0.35))`,
  },
  {
    key: "uikit",
    label: "UIKit",
    platform: "iOS",
    language: "swift",
    generate: (b) =>
      `UIView.animate(withDuration: 0.35) {\n  UIView.setAnimationCurve(\n    CAMediaTimingFunction(controlPoints: ${v(b.x1)}, ${v(b.y1)}, ${v(b.x2)}, ${v(b.y2)})\n  )\n}`,
  },
  {
    key: "core-anim",
    label: "Core Animation",
    shortLabel: "Core Anim",
    platform: "iOS",
    language: "objc",
    generate: (b) =>
      `[CAMediaTimingFunction functionWithControlPoints:${v(b.x1)} :${v(b.y1)} :${v(b.x2)} :${v(b.y2)}]`,
  },
  // Android
  {
    key: "android-kt",
    label: "Compose",
    platform: "Android",
    language: "kotlin",
    generate: (b) => `CubicBezierEasing(${v(b.x1)}f, ${v(b.y1)}f, ${v(b.x2)}f, ${v(b.y2)}f)`,
  },
  {
    key: "android-xml",
    label: "XML Interpolator",
    shortLabel: "XML",
    platform: "Android",
    language: "xml",
    generate: (b) =>
      `<pathInterpolator\n  android:controlX1="${v(b.x1)}"\n  android:controlY1="${v(b.y1)}"\n  android:controlX2="${v(b.x2)}"\n  android:controlY2="${v(b.y2)}" />`,
  },
  // Other
  {
    key: "array",
    label: "Array",
    platform: "Other",
    language: "js",
    generate: (b) => `[${v(b.x1)}, ${v(b.y1)}, ${v(b.x2)}, ${v(b.y2)}]`,
  },
  {
    key: "raw",
    label: "Raw",
    platform: "Other",
    language: "text",
    generate: (b) => `${v(b.x1)}, ${v(b.y1)}, ${v(b.x2)}, ${v(b.y2)}`,
  },
];

interface CodeExportProps {
  bezier: BezierValues;
}

export function CodeExport({ bezier }: CodeExportProps) {
  return <CodeExportBase formats={allFormats} values={bezier} defaultFormatKey="css" />;
}
