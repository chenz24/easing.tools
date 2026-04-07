import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSpringPreviewStore } from "@/hooks/useSpringPreviewStore";
import type { SpringValues } from "@/hooks/useSpringStore";
import { Play, Plus, RotateCcw, Square } from "lucide-react";
import { useState } from "react";
import { SpringAnimationPreviewPanel } from "./SpringAnimationPreview";
import { SpringScenePanel } from "./SpringScenePreview";

interface SpringPreviewPanelProps {
  spring: SpringValues;
  duration: number;
  animationKey: number;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export function SpringPreviewPanel({
  spring,
  duration,
  animationKey,
  isPlaying,
  onPlay,
  onStop,
}: SpringPreviewPanelProps) {
  const [previewTab, setPreviewTab] = useState<"shapes" | "scenes">("shapes");
  const {
    previews,
    addPreview,
    updateShape,
    updateFill,
    updateAnimation,
    duplicatePreview,
    deletePreview,
    resetPreviews,
  } = useSpringPreviewStore();

  return (
    <div className="flex h-full flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlay}
            className="h-8 w-8 text-primary hover:text-accent-foreground"
            title="Play animations"
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onStop}
            className="h-8 w-8 text-muted-foreground hover:text-accent-foreground"
            title="Stop animations"
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-accent-foreground"
          onClick={resetPreviews}
          title="Reset previews"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Preview Tabs */}
      <Tabs
        value={previewTab}
        onValueChange={(v) => setPreviewTab(v as "shapes" | "scenes")}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="border-b border-border px-4 py-2">
          <TabsList className="h-8 w-full bg-muted">
            <TabsTrigger value="shapes" className="flex-1 text-xs data-[state=active]:bg-surface">
              Shapes
            </TabsTrigger>
            <TabsTrigger value="scenes" className="flex-1 text-xs data-[state=active]:bg-surface">
              Scenes
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Shapes Tab */}
        <TabsContent value="shapes" className="flex-1 overflow-auto p-4 mt-0">
          <SpringAnimationPreviewPanel
            previews={previews}
            spring={spring}
            duration={duration}
            animationKey={animationKey}
            isPlaying={isPlaying}
            onUpdateShape={updateShape}
            onUpdateFill={updateFill}
            onUpdateAnimation={updateAnimation}
            onDuplicate={duplicatePreview}
            onDelete={deletePreview}
          />
        </TabsContent>

        {/* Scenes Tab */}
        <TabsContent value="scenes" className="flex-1 overflow-auto p-4 mt-0">
          <SpringScenePanel
            spring={spring}
            duration={duration}
            animationKey={animationKey}
            isPlaying={isPlaying}
          />
        </TabsContent>
      </Tabs>

      {/* Add Preview Button - only for shapes */}
      {previewTab === "shapes" && (
        <div className="border-t border-border p-4">
          <Button
            variant="outline"
            className="w-full gap-2 text-muted-foreground hover:text-accent-foreground"
            onClick={addPreview}
          >
            <Plus className="h-4 w-4" />
            Add Preview
          </Button>
        </div>
      )}
    </div>
  );
}
