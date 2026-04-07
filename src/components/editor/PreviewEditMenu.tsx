import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type AnimationType,
  type FillType,
  type PreviewItem,
  type ShapeType,
  animationLabels,
  fillLabels,
  shapeLabels,
} from "@/lib/previewTypes";
import { Check, ChevronRight, Copy, Trash2 } from "lucide-react";

interface PreviewEditMenuProps {
  preview: PreviewItem;
  onUpdateShape: (shape: ShapeType) => void;
  onUpdateFill: (fill: FillType) => void;
  onUpdateAnimation: (animation: AnimationType) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const shapes: ShapeType[] = ["ellipse", "squircle", "rectangle", "rhombus"];
const fills: FillType[] = ["solid", "halftone", "gradient", "outline"];
const animations: AnimationType[] = [
  "position",
  "scale",
  "opacity",
  "rotation",
  "combined",
  "bounce",
  "slide",
  "path-follow",
  "color-shift",
  "blur",
];

export function PreviewEditMenu({
  preview,
  onUpdateShape,
  onUpdateFill,
  onUpdateAnimation,
  onDuplicate,
  onDelete,
}: PreviewEditMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-accent-foreground"
        >
          Edit
          <ChevronRight className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Preview</div>

        {/* Shape submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <span className="flex-1">Shape</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {shapes.map((shape) => (
                <DropdownMenuItem
                  key={shape}
                  onClick={() => onUpdateShape(shape)}
                  className="gap-2"
                >
                  {preview.shape === shape && <Check className="h-4 w-4" />}
                  <span className={preview.shape === shape ? "" : "ml-6"}>
                    {shapeLabels[shape]}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        {/* Fill submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <span className="flex-1">Fill</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {fills.map((fill) => (
                <DropdownMenuItem key={fill} onClick={() => onUpdateFill(fill)} className="gap-2">
                  {preview.fill === fill && <Check className="h-4 w-4" />}
                  <span className={preview.fill === fill ? "" : "ml-6"}>{fillLabels[fill]}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        {/* Animations submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <span className="flex-1">Animations</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {animations.map((anim) => (
                <DropdownMenuItem
                  key={anim}
                  onClick={() => onUpdateAnimation(anim)}
                  className="gap-2"
                >
                  {preview.animation === anim && <Check className="h-4 w-4" />}
                  <span className={preview.animation === anim ? "" : "ml-6"}>
                    {animationLabels[anim]}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Duplicate */}
        <DropdownMenuItem onClick={onDuplicate} className="gap-2">
          <Copy className="h-4 w-4" />
          Duplicate Preview
        </DropdownMenuItem>

        {/* Delete */}
        <DropdownMenuItem
          onClick={onDelete}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete Preview
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
