<p align="center">
  <a href="https://easing.tools">
    <img src="public/logo.svg" alt="easing.tools logo" width="64" height="64" />
  </a>
</p>

<h1 align="center">easing.tools</h1>

<p align="center">
  A visual editor for crafting, comparing, and exporting easing curves &amp; spring animations for your UI projects.
</p>

<p align="center">
  <a href="https://github.com/chenz24/easing.tools/blob/main/LICENSE"><img src="https://img.shields.io/github/license/chenz24/easing.tools" alt="License" /></a>
  <a href="https://github.com/chenz24/easing.tools/stargazers"><img src="https://img.shields.io/github/stars/chenz24/easing.tools" alt="Stars" /></a>
  <a href="https://easing.tools"><img src="https://img.shields.io/badge/demo-easing.tools-blue" alt="Live Demo" /></a>
</p>

<p align="center">
  <a href="https://easing.tools">Live Demo</a> ·
  <a href="#features">Features</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#contributing">Contributing</a>
</p>

---

## Features

### Cubic Bezier Editor

- Interactive canvas — drag control points to shape your curve in real time
- **50+ built-in presets** across four categories:
  - **Classic** — Sine, Quad, Cubic, Quart, Quint, Expo, Circ, Back
  - **Material Design 3** — Emphasized, Standard (Accelerate / Decelerate)
  - **Material Design 2** — Standard, Decelerate, Accelerate, Sharp
  - **Apple HIG** — Default, Ease In/Out, Keyboard, Modal, Spring approximations
- Numeric inputs for precise `cubic-bezier()` values
- Adjustable duration

### Spring Animation Editor

- Physics-based spring model with **mass**, **stiffness**, **damping**, and **velocity** controls
- **13 curated spring presets** — jump, beat, plopp, breeze, wave, peak, lightning, viscous, dribble, throw, catch, attention, slide
- Auto-calculated duration based on settling time

### Animation Preview

- Real-time preview with **10 animation types**: Position, Scale, Opacity, Rotation, Combined, Bounce, Slide, Path Follow, Color Shift, Blur
- Customizable preview shapes (Ellipse, Squircle, Rectangle, Rhombus) and fills (Solid, Halftone, Gradient, Outline)

### Scene Fitness Scoring

- Evaluates how well your curve fits **11 common UI scenarios** — List Loading, Drawer, Skeleton, Button Hover, Modal, Toast, Tab Switch, Accordion, Page Transition, Tooltip, Carousel
- Provides a fitness level (Great / Good / Fair / Poor) with actionable tips
- Score breakdown across curve fit, duration, and stability dimensions
- Live UI scene demos showing your curve applied to real components

### Curve Comparison

- Side-by-side comparison of your curve against any other preset
- Quantitative metrics: max deviation, average deviation, T90 delta, perceived speed
- Animated tracks for visual comparison

### Multi-Platform Code Export

- One-click copy for **Web**, **iOS**, **Android**, and more
- Formats include CSS `cubic-bezier()`, JSON, and platform-specific snippets

### Save & Customize

- Save your own curves and springs to a personal library (persisted in localStorage)
- Rename and delete custom presets

### Dark Mode & Responsive

- System-aware dark / light theme
- Responsive layout with mobile-friendly panels

## Tech Stack

| Layer       | Technology                                    |
| ----------- | --------------------------------------------- |
| Framework   | [React 18](https://react.dev)                 |
| Language    | [TypeScript](https://www.typescriptlang.org)  |
| Build       | [Vite](https://vitejs.dev)                    |
| Styling     | [Tailwind CSS](https://tailwindcss.com)       |
| Components  | [Radix UI](https://www.radix-ui.com)          |
| Lint/Format | [Biome](https://biomejs.dev)                  |
| Testing     | [Vitest](https://vitest.dev)                  |
| Package Mgr | [pnpm](https://pnpm.io)                       |

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 8

### Installation

```bash
git clone https://github.com/chenz24/easing.tools.git
cd easing.tools
pnpm install
```

### Development

```bash
pnpm dev
```

The dev server will start at `http://localhost:8080`.

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

### Lint & Format

```bash
# Check
pnpm lint

# Auto-fix
pnpm lint:fix

# Format
pnpm format
```

### Test

```bash
# Run once
pnpm test

# Watch mode
pnpm test:watch
```

## Project Structure

```
src/
├── components/
│   ├── editor/        # Core editor components (BezierCanvas, SpringCanvas, PreviewPanel, CodeExport, ...)
│   ├── layout/        # App shell & navigation
│   └── ui/            # Shared UI primitives (Button, Card, Dialog, ...)
├── hooks/             # State management (useEasingStore, useSpringStore, ...)
├── lib/               # Business logic (easingCurves, springCurves, sceneFitness, ...)
├── pages/             # Route pages
├── App.tsx
└── main.tsx
```

## Contributing

Contributions are welcome! Whether it's a bug fix, new feature, or documentation improvement — feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

Please make sure `pnpm lint` and `pnpm test` pass before submitting.

## License

[MIT](./LICENSE)

## Acknowledgements

- Easing curve values referenced from [easings.net](https://easings.net)
- Material Design motion specs from [m3.material.io](https://m3.material.io/styles/motion)
- Apple HIG motion guidance from [developer.apple.com](https://developer.apple.com/design/human-interface-guidelines/motion)
