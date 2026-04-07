import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type PlatformGroup = "Web" | "iOS" | "Android" | "Other";

export interface FormatDef<T = unknown> {
  key: string;
  label: string;
  shortLabel?: string;
  platform: PlatformGroup;
  generate: (values: T) => string;
  language: string;
}

export function formatNumber(n: number): string {
  return n.toFixed(2).replace(/\.?0+$/, "") || "0";
}

const platformGroups: PlatformGroup[] = ["Web", "iOS", "Android", "Other"];

interface CodeExportBaseProps<T> {
  formats: FormatDef<T>[];
  values: T;
  defaultFormatKey?: string;
}

export function CodeExportBase<T>({ formats, values, defaultFormatKey }: CodeExportBaseProps<T>) {
  const [activePlatform, setActivePlatform] = useState<PlatformGroup>("Web");
  const [activeFormatKey, setActiveFormatKey] = useState(defaultFormatKey ?? formats[0]?.key ?? "");
  const [copied, setCopied] = useState(false);
  const formatScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const { toast } = useToast();

  const platformFormats = formats.filter((f) => f.platform === activePlatform);
  const activeFormat = formats.find((f) => f.key === activeFormatKey);
  const code = activeFormat ? activeFormat.generate(values) : "";

  // When platform changes, select the first format in that platform
  const handlePlatformChange = (platform: PlatformGroup) => {
    setActivePlatform(platform);
    const first = formats.find((f) => f.platform === platform);
    if (first) setActiveFormatKey(first.key);
  };

  // Check scroll state
  const checkScroll = () => {
    const el = formatScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = formatScrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      const ro = new ResizeObserver(checkScroll);
      ro.observe(el);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        ro.disconnect();
      };
    }
  }, [activePlatform]);

  const scroll = (dir: "left" | "right") => {
    formatScrollRef.current?.scrollBy({
      left: dir === "left" ? -100 : 100,
      behavior: "smooth",
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: "Copied!",
        description: `${activeFormat?.label} code copied to clipboard`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-w-0 rounded-xl border border-border/50 bg-muted/30 overflow-hidden">
      {/* Platform group tabs */}
      <div className="flex items-center gap-0.5 border-b border-border/50 px-2 py-1.5">
        {platformGroups.map((platform) => (
          <button
            key={platform}
            onClick={() => handlePlatformChange(platform)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
              activePlatform === platform
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            {platform}
          </button>
        ))}
      </div>

      {/* Format selector row */}
      <div className="relative flex items-center border-b border-border/30">
        {/* Left scroll indicator */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 z-10 flex h-full w-6 items-center justify-center bg-gradient-to-r from-muted/80 to-transparent"
          >
            <ChevronLeft className="h-3 w-3 text-muted-foreground" />
          </button>
        )}

        <div
          ref={formatScrollRef}
          className="flex items-center gap-0.5 overflow-x-auto px-2 py-1 scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          {platformFormats.map((format) => (
            <button
              key={format.key}
              onClick={() => setActiveFormatKey(format.key)}
              className={cn(
                "relative whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium transition-all",
                activeFormatKey === format.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground/80",
              )}
            >
              {format.shortLabel || format.label}
            </button>
          ))}
        </div>

        {/* Right scroll indicator */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 z-10 flex h-full w-6 items-center justify-center bg-gradient-to-l from-muted/80 to-transparent"
          >
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Code display */}
      <div className="group relative">
        <pre
          className="overflow-x-auto p-3 text-[13px] leading-relaxed scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          <code className="font-mono text-foreground/90">{code}</code>
        </pre>

        {/* Copy button - always visible on right */}
        <Button
          variant="ghost"
          size="icon"
          onClick={copyToClipboard}
          className={cn(
            "absolute right-1.5 top-1.5 h-7 w-7 transition-all",
            copied
              ? "text-primary hover:text-accent-foreground"
              : "text-muted-foreground hover:text-accent-foreground",
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}
