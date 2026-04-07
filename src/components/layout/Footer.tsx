import { Github } from "lucide-react";
import { useState } from "react";
import { AboutDialog } from "./AboutDialog";

export function Footer() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
        {/* Left: Copyright */}
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} easing.tools. All rights reserved.
        </p>

        {/* Center: Links */}
        <nav className="flex items-center gap-6">
          <a
            href="https://github.com/chenz24/easing.tools"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <button
            type="button"
            onClick={() => setAboutOpen(true)}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </button>
        </nav>
      </div>

      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </footer>
  );
}
