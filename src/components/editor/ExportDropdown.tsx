import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { BezierValues } from "@/hooks/useEasingStore";
import { formatCubicBezier, formatJSON } from "@/lib/easingCurves";
import { ChevronDown, Copy } from "lucide-react";

interface ExportDropdownProps {
  bezier: BezierValues;
}

export function ExportDropdown({ bezier }: ExportDropdownProps) {
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const cssValue = formatCubicBezier(bezier.x1, bezier.y1, bezier.x2, bezier.y2);
  const jsonValue = formatJSON(bezier.x1, bezier.y1, bezier.x2, bezier.y2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          Export
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem
          onClick={() => copyToClipboard(cssValue, "CSS")}
          className="flex flex-col items-start gap-1"
        >
          <div className="flex w-full items-center justify-between">
            <span className="font-medium">Copy CSS</span>
            <Copy className="h-3.5 w-3.5 opacity-50" />
          </div>
          <code className="text-xs text-muted-foreground">{cssValue}</code>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => copyToClipboard(jsonValue, "JSON")}
          className="flex flex-col items-start gap-1"
        >
          <div className="flex w-full items-center justify-between">
            <span className="font-medium">Copy JSON</span>
            <Copy className="h-3.5 w-3.5 opacity-50" />
          </div>
          <code className="line-clamp-1 text-xs text-muted-foreground">
            {jsonValue.replace(/\n/g, " ")}
          </code>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
