import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { CURVE_CATEGORIES, type CurveCategory, type EasingCurve } from "@/lib/easingCurves";
import { ChevronDown, ChevronRight, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CurveCard } from "./CurveCard";

interface CurveLibraryProps {
  defaultCurves: EasingCurve[];
  customCurves: EasingCurve[];
  selectedCurveId: string;
  curveTab: "default" | "custom";
  onSelectCurve: (curve: EasingCurve) => void;
  onSaveCustom: (name: string) => void;
  onDeleteCustom: (id: string) => void;
  onRenameCustom: (id: string, name: string) => void;
  onTabChange: (tab: "default" | "custom") => void;
}

export function CurveLibrary({
  defaultCurves,
  customCurves,
  selectedCurveId,
  curveTab,
  onSelectCurve,
  onSaveCustom,
  onDeleteCustom,
  onRenameCustom,
  onTabChange,
}: CurveLibraryProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newCurveName, setNewCurveName] = useState("");
  const [renamingCurve, setRenamingCurve] = useState<EasingCurve | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<CurveCategory>>(
    new Set(["classic", "material-design-3", "material-design", "apple-hig"]),
  );

  // Filter curves by search query
  const filteredCurves = useMemo(() => {
    if (!searchQuery.trim()) return defaultCurves;
    const query = searchQuery.toLowerCase();
    return defaultCurves.filter(
      (curve) => curve.name.toLowerCase().includes(query) || curve.id.toLowerCase().includes(query),
    );
  }, [defaultCurves, searchQuery]);

  // Group curves by category
  const groupedCurves = useMemo(() => {
    const groups = new Map<CurveCategory, EasingCurve[]>();

    // Initialize groups in order
    CURVE_CATEGORIES.forEach((cat) => {
      if (cat.id !== "custom") {
        groups.set(cat.id, []);
      }
    });

    // Populate groups
    filteredCurves.forEach((curve) => {
      const category = curve.category || "classic";
      const group = groups.get(category);
      if (group) {
        group.push(curve);
      }
    });

    return groups;
  }, [filteredCurves]);

  const toggleGroup = (groupId: CurveCategory) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleSave = () => {
    if (newCurveName.trim()) {
      onSaveCustom(newCurveName.trim());
      setNewCurveName("");
      setSaveDialogOpen(false);
    }
  };

  const handleRename = () => {
    if (renamingCurve && newCurveName.trim()) {
      onRenameCustom(renamingCurve.id, newCurveName.trim());
      setNewCurveName("");
      setRenamingCurve(null);
      setRenameDialogOpen(false);
    }
  };

  const openRenameDialog = (curve: EasingCurve) => {
    setRenamingCurve(curve);
    setNewCurveName(curve.name);
    setRenameDialogOpen(true);
  };

  return (
    <div className="flex h-full flex-col">
      <Tabs
        value={curveTab}
        onValueChange={(v) => onTabChange(v as "default" | "custom")}
        className="flex h-full flex-col"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <TabsList className="bg-muted">
            <TabsTrigger value="default" className="data-[state=active]:bg-surface">
              Default curves
            </TabsTrigger>
            <TabsTrigger value="custom" className="data-[state=active]:bg-surface">
              Custom curves
            </TabsTrigger>
          </TabsList>

          {curveTab === "custom" && (
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

        <TabsContent value="default" className="flex-1 overflow-hidden flex flex-col">
          {/* Search Box */}
          <div className="px-4 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search curves..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Grouped Curves */}
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {searchQuery && filteredCurves.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                No curves found for "{searchQuery}"
              </div>
            ) : (
              CURVE_CATEGORIES.filter((cat) => cat.id !== "custom").map((category) => {
                const curves = groupedCurves.get(category.id) || [];
                if (curves.length === 0) return null;

                const isExpanded = expandedGroups.has(category.id);

                return (
                  <Collapsible
                    key={category.id}
                    open={isExpanded}
                    onOpenChange={() => toggleGroup(category.id)}
                  >
                    <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="flex-1 text-left">{category.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {curves.length}
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid grid-cols-3 gap-3 px-2 py-3">
                        {curves.map((curve) => (
                          <CurveCard
                            key={curve.id}
                            curve={curve}
                            isSelected={curve.id === selectedCurveId}
                            onClick={() => onSelectCurve(curve)}
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="flex-1 overflow-auto p-4">
          {customCurves.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
              <p className="text-sm">No custom curves yet</p>
              <Button variant="outline" onClick={() => setSaveDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Save current curve
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {customCurves.map((curve) => (
                <ContextMenu key={curve.id}>
                  <ContextMenuTrigger>
                    <CurveCard
                      curve={curve}
                      isSelected={curve.id === selectedCurveId}
                      onClick={() => onSelectCurve(curve)}
                    />
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => openRenameDialog(curve)}>
                      Rename
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => onDeleteCustom(curve.id)}
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
            <DialogTitle>Save Custom Curve</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Curve name"
            value={newCurveName}
            onChange={(e) => setNewCurveName(e.target.value)}
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
            <DialogTitle>Rename Curve</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="New name"
            value={newCurveName}
            onChange={(e) => setNewCurveName(e.target.value)}
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
