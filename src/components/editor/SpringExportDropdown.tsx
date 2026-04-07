import type { SpringValues } from "@/hooks/useSpringStore";
import { CodeExportBase, type FormatDef, formatNumber as v } from "./CodeExportBase";

const allFormats: FormatDef<SpringValues>[] = [
  // Web
  {
    key: "framer",
    label: "Framer Motion",
    shortLabel: "Framer",
    platform: "Web",
    language: "jsx",
    generate: (s) =>
      `<motion.div\n  transition={{\n    type: "spring",\n    mass: ${v(s.mass)},\n    stiffness: ${v(s.stiffness)},\n    damping: ${v(s.damping)},\n    velocity: ${v(s.velocity)}\n  }}\n/>`,
  },
  {
    key: "react-spring",
    label: "React Spring",
    shortLabel: "R.Spring",
    platform: "Web",
    language: "jsx",
    generate: (s) =>
      `useSpring({\n  config: {\n    mass: ${v(s.mass)},\n    tension: ${v(s.stiffness)},\n    friction: ${v(s.damping)}\n  }\n})`,
  },
  {
    key: "rn-reanimated",
    label: "Reanimated",
    platform: "Web",
    language: "js",
    generate: (s) =>
      `withSpring(toValue, {\n  mass: ${v(s.mass)},\n  stiffness: ${v(s.stiffness)},\n  damping: ${v(s.damping)},\n  velocity: ${v(s.velocity)}\n})`,
  },
  {
    key: "popmotion",
    label: "Popmotion",
    platform: "Web",
    language: "js",
    generate: (s) =>
      `spring({\n  from: 0,\n  to: 1,\n  mass: ${v(s.mass)},\n  stiffness: ${v(s.stiffness)},\n  damping: ${v(s.damping)},\n  velocity: ${v(s.velocity)}\n})`,
  },
  {
    key: "css-comment",
    label: "CSS Comment",
    shortLabel: "CSS",
    platform: "Web",
    language: "css",
    generate: (s) =>
      `/* Spring Animation Parameters\n * mass: ${v(s.mass)}\n * stiffness: ${v(s.stiffness)}\n * damping: ${v(s.damping)}\n * velocity: ${v(s.velocity)}\n */`,
  },
  // iOS
  {
    key: "swiftui",
    label: "SwiftUI",
    platform: "iOS",
    language: "swift",
    generate: (s) =>
      `.spring(\n  response: ${v((Math.PI * 2) / Math.sqrt(s.stiffness / s.mass))},\n  dampingFraction: ${v(s.damping / (2 * Math.sqrt(s.stiffness * s.mass)))},\n  blendDuration: 0\n)`,
  },
  {
    key: "uikit",
    label: "UIKit",
    platform: "iOS",
    language: "swift",
    generate: (s) =>
      `UIView.animate(\n  withDuration: 0.5,\n  delay: 0,\n  usingSpringWithDamping: ${v(s.damping / (2 * Math.sqrt(s.stiffness * s.mass)))},\n  initialSpringVelocity: ${v(s.velocity)},\n  options: [],\n  animations: { /* ... */ }\n)`,
  },
  // Android
  {
    key: "compose",
    label: "Compose",
    platform: "Android",
    language: "kotlin",
    generate: (s) =>
      `spring<Float>(\n  dampingRatio = ${v(s.damping / (2 * Math.sqrt(s.stiffness * s.mass)))}f,\n  stiffness = ${v(s.stiffness)}f,\n  visibilityThreshold = 0.01f\n)`,
  },
  // Other
  {
    key: "json",
    label: "JSON",
    platform: "Other",
    language: "json",
    generate: (s) =>
      JSON.stringify(
        { mass: s.mass, stiffness: s.stiffness, damping: s.damping, velocity: s.velocity },
        null,
        2,
      ),
  },
  {
    key: "raw",
    label: "Raw",
    platform: "Other",
    language: "text",
    generate: (s) =>
      `mass: ${v(s.mass)}, stiffness: ${v(s.stiffness)}, damping: ${v(s.damping)}, velocity: ${v(s.velocity)}`,
  },
];

interface SpringCodeExportProps {
  spring: SpringValues;
}

export function SpringCodeExport({ spring }: SpringCodeExportProps) {
  return <CodeExportBase formats={allFormats} values={spring} defaultFormatKey="framer" />;
}
