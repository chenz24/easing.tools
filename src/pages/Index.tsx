import { CurveEditor } from "@/components/editor/CurveEditor";
import { CurveLibrary } from "@/components/editor/CurveLibrary";
import { PreviewPanel } from "@/components/editor/PreviewPanel";
import { SpringEditor } from "@/components/editor/SpringEditor";
import { SpringLibrary } from "@/components/editor/SpringLibrary";
import { SpringPreviewPanel } from "@/components/editor/SpringPreviewPanel";
import { Layout } from "@/components/layout/Layout";
import { useEasingStore } from "@/hooks/useEasingStore";
import { useSpringStore } from "@/hooks/useSpringStore";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();
  const [curveMode, setCurveMode] = useState<"easing" | "spring">("easing");
  const [showPreviewPanel, setShowPreviewPanel] = useState(true);

  // Easing store
  const easing = useEasingStore();

  // Spring store
  const spring = useSpringStore();

  const curveCount =
    curveMode === "easing" ? easing.defaultCurves.length : spring.defaultSprings.length;

  return (
    <Layout curveMode={curveMode} onCurveModeChange={setCurveMode}>
      {/* Centered Container */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {/* Tool Card */}
        <Card className="flex h-[calc(100vh-180px)] min-h-[500px] flex-col overflow-hidden">
          {/* Sub-header with curve count and controls */}
          <div className="flex h-10 items-center justify-between border-b border-border px-4">
            {/* Left: Curve count */}
            <span className="text-sm text-muted-foreground">
              {curveCount} {curveMode === "easing" ? "easing" : "spring"} curves
            </span>

            {/* Right: Toggle Preview Panel */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPreviewPanel((p) => !p)}
              className="h-8 w-8 text-muted-foreground hover:text-accent-foreground"
              title={showPreviewPanel ? "Hide preview panel" : "Show preview panel"}
            >
              {showPreviewPanel ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Three-column layout */}
          <div className="flex flex-1 overflow-hidden">
            {/* Column A: Library */}
            <div className="w-full flex-1 border-r border-border lg:w-[400px] lg:flex-none">
              {curveMode === "easing" ? (
                <CurveLibrary
                  defaultCurves={easing.defaultCurves}
                  customCurves={easing.customCurves}
                  selectedCurveId={easing.selectedCurveId}
                  curveTab={easing.curveTab}
                  onSelectCurve={easing.selectCurve}
                  onSaveCustom={easing.saveAsCustom}
                  onDeleteCustom={easing.deleteCustomCurve}
                  onRenameCustom={easing.renameCustomCurve}
                  onTabChange={easing.setCurveTab}
                />
              ) : (
                <SpringLibrary
                  defaultSprings={spring.defaultSprings}
                  customSprings={spring.customSprings}
                  selectedSpringId={spring.selectedSpringId}
                  springTab={spring.springTab}
                  onSelectSpring={spring.selectSpring}
                  onSaveCustom={spring.saveAsCustom}
                  onDeleteCustom={spring.deleteCustomSpring}
                  onRenameCustom={spring.renameCustomSpring}
                  onTabChange={spring.setSpringTab}
                />
              )}
            </div>

            {/* Column B: Editor */}
            <div className="hidden min-w-0 flex-1 border-r border-border lg:block">
              {curveMode === "easing" ? (
                <CurveEditor
                  bezier={easing.bezier}
                  duration={easing.duration}
                  isPlaying={easing.isPlaying}
                  animationKey={easing.animationKey}
                  onBezierChange={easing.updateBezier}
                  onDurationChange={easing.setDuration}
                  onReset={easing.resetToOriginal}
                />
              ) : (
                <SpringEditor
                  spring={spring.spring}
                  duration={spring.duration}
                  isPlaying={spring.isPlaying}
                  animationKey={spring.animationKey}
                  onSpringChange={spring.updateSpring}
                  onReset={spring.resetToOriginal}
                />
              )}
            </div>

            {/* Column C: Preview Panel (Desktop) */}
            {showPreviewPanel && !isMobile && (
              <div className="hidden w-[320px] flex-none lg:block">
                {curveMode === "easing" ? (
                  <PreviewPanel
                    bezier={easing.bezier}
                    duration={easing.duration}
                    animationKey={easing.animationKey}
                    isPlaying={easing.isPlaying}
                    onPlay={easing.playAnimations}
                    onStop={easing.stopAnimations}
                    allCurves={easing.defaultCurves}
                  />
                ) : (
                  <SpringPreviewPanel
                    spring={spring.spring}
                    duration={spring.duration}
                    animationKey={spring.animationKey}
                    isPlaying={spring.isPlaying}
                    onPlay={spring.playAnimations}
                    onStop={spring.stopAnimations}
                  />
                )}
              </div>
            )}

            {/* Mobile/Tablet: Sheet for Editor */}
            <Sheet>
              <SheetContent side="bottom" className="h-[70vh] lg:hidden">
                {curveMode === "easing" ? (
                  <CurveEditor
                    bezier={easing.bezier}
                    duration={easing.duration}
                    isPlaying={easing.isPlaying}
                    animationKey={easing.animationKey}
                    onBezierChange={easing.updateBezier}
                    onDurationChange={easing.setDuration}
                    onReset={easing.resetToOriginal}
                  />
                ) : (
                  <SpringEditor
                    spring={spring.spring}
                    duration={spring.duration}
                    isPlaying={spring.isPlaying}
                    animationKey={spring.animationKey}
                    onSpringChange={spring.updateSpring}
                    onReset={spring.resetToOriginal}
                  />
                )}
              </SheetContent>
            </Sheet>
          </div>
        </Card>
      </div>

      {/* Mobile Preview Panel (Sheet) */}
      {isMobile && (
        <Sheet open={showPreviewPanel} onOpenChange={setShowPreviewPanel}>
          <SheetContent side="right" className="w-full max-w-sm">
            {curveMode === "easing" ? (
              <PreviewPanel
                bezier={easing.bezier}
                duration={easing.duration}
                animationKey={easing.animationKey}
                isPlaying={easing.isPlaying}
                onPlay={easing.playAnimations}
                onStop={easing.stopAnimations}
                allCurves={easing.defaultCurves}
              />
            ) : (
              <SpringPreviewPanel
                spring={spring.spring}
                duration={spring.duration}
                animationKey={spring.animationKey}
                isPlaying={spring.isPlaying}
                onPlay={spring.playAnimations}
                onStop={spring.stopAnimations}
              />
            )}
          </SheetContent>
        </Sheet>
      )}
    </Layout>
  );
};

export default Index;
