import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

interface LayoutProps {
  children: ReactNode;
  curveMode?: "easing" | "spring";
  onCurveModeChange?: (mode: "easing" | "spring") => void;
}

export function Layout({ children, curveMode, onCurveModeChange }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header curveMode={curveMode} onCurveModeChange={onCurveModeChange} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
