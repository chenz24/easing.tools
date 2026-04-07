import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SpringCurve } from "@/lib/springCurves";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { SpringCard } from "./SpringCard";

interface SpringLibraryProps {
  defaultSprings: SpringCurve[];
  customSprings: SpringCurve[];
  selectedSpringId: string;
  springTab: "default" | "custom";
  onSelectSpring: (spring: SpringCurve) => void;
  onSaveCustom: (name: string) => void;
  onDeleteCustom: (id: string) => void;
  onRenameCustom: (id: string, name: string) => void;
  onTabChange: (tab: "default" | "custom") => void;
}

export function SpringLibrary({
  defaultSprings,
  customSprings,
  selectedSpringId,
  springTab,
  onSelectSpring,
  onSaveCustom,
  onDeleteCustom,
  onRenameCustom,
  onTabChange,
}: SpringLibraryProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newSpringName, setNewSpringName] = useState("");
  const [renamingSpring, setRenamingSpring] = useState<SpringCurve | null>(null);

  const handleSave = () => {
    if (newSpringName.trim()) {
      onSaveCustom(newSpringName.trim());
      setNewSpringName("");
      setSaveDialogOpen(false);
    }
  };

  const handleRename = () => {
    if (renamingSpring && newSpringName.trim()) {
      onRenameCustom(renamingSpring.id, newSpringName.trim());
      setNewSpringName("");
      setRenamingSpring(null);
      setRenameDialogOpen(false);
    }
  };

  const openRenameDialog = (spring: SpringCurve) => {
    setRenamingSpring(spring);
    setNewSpringName(spring.name);
    setRenameDialogOpen(true);
  };

  return (
    <div className="flex h-full flex-col">
      <Tabs
        value={springTab}
        onValueChange={(v) => onTabChange(v as "default" | "custom")}
        className="flex h-full flex-col"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <TabsList className="bg-muted">
            <TabsTrigger value="default" className="data-[state=active]:bg-surface">
              Default springs
            </TabsTrigger>
            <TabsTrigger value="custom" className="data-[state=active]:bg-surface">
              Custom springs
            </TabsTrigger>
          </TabsList>

          {springTab === "custom" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSaveDialogOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Save current
            </Button>
          )}
        </div>

        <TabsContent value="default" className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-3 gap-3">
            {defaultSprings.map((spring) => (
              <SpringCard
                key={spring.id}
                spring={spring}
                isSelected={spring.id === selectedSpringId}
                onClick={() => onSelectSpring(spring)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="flex-1 overflow-auto p-4">
          {customSprings.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
              <p className="text-sm">No custom springs yet</p>
              <Button variant="outline" onClick={() => setSaveDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Save current spring
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {customSprings.map((spring) => (
                <ContextMenu key={spring.id}>
                  <ContextMenuTrigger>
                    <SpringCard
                      spring={spring}
                      isSelected={spring.id === selectedSpringId}
                      onClick={() => onSelectSpring(spring)}
                    />
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => openRenameDialog(spring)}>
                      Rename
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => onDeleteCustom(spring.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Custom Spring</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Spring name"
            value={newSpringName}
            onChange={(e) => setNewSpringName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Spring</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="New name"
            value={newSpringName}
            onChange={(e) => setNewSpringName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
