import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Github, Heart, Zap } from "lucide-react";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <svg
                width="24"
                height="24"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 24 C6 24, 10 24, 14 14 C18 4, 22 8, 26 8"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  className="text-primary-foreground"
                />
              </svg>
            </div>
            <div>
              <DialogTitle className="text-xl">easing.tools</DialogTitle>
              <DialogDescription className="text-xs">v1.0.0</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Intro */}
          <p className="text-sm leading-relaxed text-foreground/90">
            A free, open-source visual editor for crafting easing curves and spring animations.
            Design, compare, and export timing functions for any UI project — all in one place.
          </p>

          {/* Features */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What you can do
            </h4>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li className="flex items-start gap-2">
                <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                Edit cubic-bezier curves and spring physics with real-time preview
              </li>
              <li className="flex items-start gap-2">
                <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                Choose from 40+ built-in presets or create your own
              </li>
              <li className="flex items-start gap-2">
                <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                Export to CSS, GSAP, Framer Motion, Anime.js, Tailwind, and more
              </li>
              <li className="flex items-start gap-2">
                <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                Preview animations with shapes and real-world UI scenes
              </li>
            </ul>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Links & Credits */}
          <div className="flex items-center justify-between">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              Made with <Heart className="h-3 w-3 text-red-500" /> for the motion community
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
