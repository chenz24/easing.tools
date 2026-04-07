import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatCubicBezier } from "@/lib/easingCurves";
import { type UISceneType, uiSceneLabels } from "@/lib/uiSceneTypes";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Menu,
  RotateCcw,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { CodeExport } from "./CodeExport";

interface UISceneDemoProps {
  scene: UISceneType;
  bezier: { x1: number; y1: number; x2: number; y2: number };
  duration: number;
  open: boolean;
  onClose: () => void;
}

export function UISceneDemo({ scene, bezier, duration, open, onClose }: UISceneDemoProps) {
  const bezierCSS = formatCubicBezier(bezier.x1, bezier.y1, bezier.x2, bezier.y2);

  const renderDemo = () => {
    switch (scene) {
      case "list-loading":
        return <ListLoadingDemo bezierCSS={bezierCSS} duration={duration} />;
      case "drawer":
        return <DrawerDemo bezierCSS={bezierCSS} duration={duration} />;
      case "skeleton":
        return <SkeletonDemo bezierCSS={bezierCSS} duration={duration} />;
      case "button-hover":
        return <ButtonHoverDemo bezierCSS={bezierCSS} duration={duration} />;
      case "modal":
        return <ModalDemo bezierCSS={bezierCSS} duration={duration} />;
      case "toast":
        return <ToastDemo bezierCSS={bezierCSS} duration={duration} />;
      case "tab-switch":
        return <TabSwitchDemo bezierCSS={bezierCSS} duration={duration} />;
      case "accordion":
        return <AccordionDemo bezierCSS={bezierCSS} duration={duration} />;
      case "page-transition":
        return <PageTransitionDemo bezierCSS={bezierCSS} duration={duration} />;
      case "tooltip":
        return <TooltipDemo bezierCSS={bezierCSS} duration={duration} />;
      case "carousel":
        return <CarouselDemo bezierCSS={bezierCSS} duration={duration} />;
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full max-w-lg sm:max-w-xl flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {uiSceneLabels[scene]} Demo
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Demo Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="rounded-xl border border-border bg-muted/20 p-6 min-h-[300px]">
            {renderDemo()}
          </div>
        </div>

        {/* Code Export */}
        <div className="border-t border-border p-4">
          <CodeExport bezier={bezier} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============ Individual Scene Demos ============

interface DemoProps {
  bezierCSS: string;
  duration: number;
}

// List Loading Demo
function ListLoadingDemo({ bezierCSS, duration }: DemoProps) {
  const [items, setItems] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadItems = useCallback(() => {
    setItems([]);
    setIsLoading(true);

    // Simulate loading items one by one
    [0, 1, 2, 3, 4].forEach((i) => {
      setTimeout(() => {
        setItems((prev) => [...prev, i]);
        if (i === 4) setIsLoading(false);
      }, i * 100);
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Inbox</h3>
        <Button onClick={loadItems} size="sm" variant="outline" className="gap-2">
          <RotateCcw className="h-3.5 w-3.5" />
          {isLoading ? "Loading..." : "Reload"}
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg bg-surface p-3 shadow-sm border border-border"
            style={{
              animation: `list-item-slide ${duration}s ${bezierCSS} forwards`,
            }}
          >
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">U{i + 1}</span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">User {i + 1}</div>
              <div className="text-xs text-muted-foreground">New message received...</div>
            </div>
            <div className="text-xs text-muted-foreground">2m ago</div>
          </div>
        ))}

        {items.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground text-sm py-8">
            Click "Reload" to see the animation
          </div>
        )}
      </div>

      <style>{`
        @keyframes list-item-slide {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// Drawer Demo
function DrawerDemo({ bezierCSS, duration }: DemoProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative h-64 rounded-lg bg-surface border border-border overflow-hidden">
      {/* Main content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h3 className="text-sm font-medium">My App</h3>
          <div className="w-8" />
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Click the menu icon to open the drawer.</p>
          <p>The drawer will slide in using your easing curve.</p>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="absolute inset-0 bg-black/40"
          style={{
            animation: `drawer-backdrop ${duration}s ${bezierCSS} forwards`,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className="absolute left-0 top-0 h-full w-3/4 bg-surface shadow-2xl border-r border-border"
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: `transform ${duration}s ${bezierCSS}`,
        }}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-medium">Menu</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 space-y-2">
          {["Home", "Profile", "Settings", "Help"].map((item) => (
            <div key={item} className="px-3 py-2 rounded-lg hover:bg-muted cursor-pointer text-sm">
              {item}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes drawer-backdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Skeleton Demo
function SkeletonDemo({ bezierCSS, duration }: DemoProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shimmerKey, setShimmerKey] = useState(0);

  const reload = () => {
    setIsLoaded(false);
    setShimmerKey((k) => k + 1);
    setTimeout(() => setIsLoaded(true), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Content Card</h3>
        <Button onClick={reload} size="sm" variant="outline" className="gap-2">
          <RotateCcw className="h-3.5 w-3.5" />
          Reload
        </Button>
      </div>

      <div className="rounded-lg bg-surface border border-border p-4 overflow-hidden relative">
        {!isLoaded ? (
          <>
            {/* Skeleton */}
            <div className="flex gap-4">
              <div className="h-16 w-16 rounded-full bg-muted" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 rounded bg-muted" />
              <div className="h-3 rounded bg-muted" />
              <div className="h-3 w-4/5 rounded bg-muted" />
            </div>
            {/* Shimmer overlay */}
            <div
              key={shimmerKey}
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{
                animation: `shimmer ${duration * 2}s ${bezierCSS} infinite`,
              }}
            />
          </>
        ) : (
          /* Real content */
          <div
            style={{
              animation: `content-fade ${duration}s ${bezierCSS} forwards`,
            }}
          >
            <div className="flex gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">JD</span>
              </div>
              <div className="flex-1 py-1">
                <div className="font-medium">John Doe</div>
                <div className="text-sm text-muted-foreground">Software Engineer</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              This is the actual content that appears after loading. The skeleton animation uses
              your selected easing curve.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes content-fade {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// Button Hover Demo
function ButtonHoverDemo({ bezierCSS, duration }: DemoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">Hover over these buttons</h3>
        <p className="text-xs text-muted-foreground">
          The transition uses your easing curve: {bezierCSS}
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium"
          style={{
            transition: `all ${duration}s ${bezierCSS}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Scale + Shadow
        </button>

        <button
          className="px-6 py-3 rounded-lg bg-secondary text-secondary-foreground font-medium"
          style={{
            transition: `all ${duration}s ${bezierCSS}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Lift Up
        </button>

        <button
          className="px-6 py-3 rounded-lg border-2 border-primary text-primary font-medium bg-transparent"
          style={{
            transition: `all ${duration}s ${bezierCSS}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "hsl(var(--primary))";
            e.currentTarget.style.color = "hsl(var(--primary-foreground))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "hsl(var(--primary))";
          }}
        >
          Fill In
        </button>
      </div>
    </div>
  );
}

// Modal Demo
function ModalDemo({ bezierCSS, duration }: DemoProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Modal Dialog</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Click the button to open a modal with your easing curve.
        </p>
      </div>

      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            style={{
              animation: `modal-backdrop ${duration}s ${bezierCSS} forwards`,
            }}
            onClick={() => setIsOpen(false)}
          />
          {/* Dialog */}
          <div
            className="relative z-10 w-full max-w-md rounded-xl bg-surface p-6 shadow-2xl mx-4"
            style={{
              animation: `modal-dialog ${duration}s ${bezierCSS} forwards`,
            }}
          >
            <h2 className="text-lg font-semibold mb-2">Confirm Action</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to proceed with this action? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsOpen(false)}>Confirm</Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modal-backdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-dialog {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// Toast Demo
function ToastDemo({ bezierCSS, duration }: DemoProps) {
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);

    // Auto dismiss after 3s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Toast Notifications</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Click the buttons to show different toast notifications.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => showToast("Action completed successfully!")}>
          Success Toast
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => showToast("New notification received")}
        >
          Info Toast
        </Button>
      </div>

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center gap-3 rounded-lg bg-foreground text-background px-4 py-3 shadow-lg min-w-[250px]"
            style={{
              animation: `toast-slide ${duration}s ${bezierCSS} forwards`,
            }}
          >
            <Bell className="h-4 w-4" />
            <span className="text-sm">{toast.message}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-auto text-background/70 hover:text-background hover:bg-transparent"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toast-slide {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// Tab Switch Demo
function TabSwitchDemo({ bezierCSS, duration }: DemoProps) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["General", "Notifications", "Security", "Billing"];
  const tabContents = [
    "Manage your general account settings and preferences.",
    "Configure how and when you receive notifications.",
    "Set up two-factor authentication and manage sessions.",
    "View your billing history and manage payment methods.",
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Settings Tabs</h3>
        <p className="text-xs text-muted-foreground">
          Click the tabs to see the indicator slide with your easing curve.
        </p>
      </div>

      <div className="rounded-lg bg-surface border border-border overflow-hidden">
        {/* Tab bar */}
        <div className="relative flex border-b border-border">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              className={`flex-1 py-3 text-sm font-medium z-10 transition-colors ${
                activeTab === i ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab(i)}
            >
              {tab}
            </button>
          ))}
          {/* Sliding indicator */}
          <div
            className="absolute bottom-0 h-0.5 bg-primary"
            style={{
              width: `${100 / tabs.length}%`,
              transform: `translateX(${activeTab * 100}%)`,
              transition: `transform ${duration}s ${bezierCSS}`,
            }}
          />
        </div>
        {/* Tab content */}
        <div className="p-4">
          <p className="text-sm text-muted-foreground">{tabContents[activeTab]}</p>
        </div>
      </div>
    </div>
  );
}

// Accordion Demo
function AccordionDemo({ bezierCSS, duration }: DemoProps) {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggle = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const items = [
    {
      title: "What is easing?",
      content:
        "Easing defines the rate of change of a parameter over time. It makes animations feel more natural by mimicking real-world physics.",
    },
    {
      title: "When to use ease-out?",
      content:
        "Use ease-out for elements entering the screen. The fast start and gradual deceleration feels responsive and natural.",
    },
    {
      title: "What about spring curves?",
      content:
        "Spring-based animations simulate physical spring dynamics, offering a more organic feel with optional overshoot and bounce.",
    },
    {
      title: "How to choose duration?",
      content:
        "Micro-interactions: 100–300ms. Transitions: 200–500ms. Page-level: 300–800ms. Shorter durations feel snappier.",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">FAQ Accordion</h3>
        <p className="text-xs text-muted-foreground">
          Click items to expand/collapse with your easing curve.
        </p>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 text-left"
              onClick={() => toggle(i)}
            >
              <span className="text-sm font-medium">{item.title}</span>
              <ChevronDown
                className="h-4 w-4 text-muted-foreground shrink-0"
                style={{
                  transform: openItems.includes(i) ? "rotate(180deg)" : "rotate(0deg)",
                  transition: `transform ${duration}s ${bezierCSS}`,
                }}
              />
            </button>
            <div
              className="overflow-hidden"
              style={{
                maxHeight: openItems.includes(i) ? "200px" : "0px",
                opacity: openItems.includes(i) ? 1 : 0,
                transition: `max-height ${duration}s ${bezierCSS}, opacity ${duration}s ${bezierCSS}`,
              }}
            >
              <div className="px-4 pb-4 text-sm text-muted-foreground">{item.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Page Transition Demo
function PageTransitionDemo({ bezierCSS, duration }: DemoProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [transitionKey, setTransitionKey] = useState(0);

  const pages = [
    {
      title: "Home",
      color: "bg-primary/10",
      content: "Welcome to the app. Explore features and get started.",
    },
    {
      title: "Profile",
      color: "bg-blue-500/10",
      content: "View and edit your profile information.",
    },
    {
      title: "Settings",
      color: "bg-amber-500/10",
      content: "Configure your application preferences.",
    },
  ];

  const goToPage = (index: number) => {
    if (index === currentPage) return;
    setTransitionKey((k) => k + 1);
    setCurrentPage(index);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Page Navigation</h3>
        <p className="text-xs text-muted-foreground">
          Click the nav items to see page transitions.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface overflow-hidden h-64">
        {/* Nav bar */}
        <div className="flex border-b border-border bg-muted/30">
          {pages.map((page, i) => (
            <button
              key={page.title}
              className={`flex-1 py-2.5 text-xs font-medium ${
                currentPage === i
                  ? "text-primary bg-surface"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => goToPage(i)}
            >
              {page.title}
            </button>
          ))}
        </div>
        {/* Page content */}
        <div className="relative h-[calc(100%-41px)] overflow-hidden">
          <div
            key={transitionKey}
            className={`absolute inset-0 p-4 ${pages[currentPage].color}`}
            style={{
              animation: `page-enter ${duration}s ${bezierCSS} forwards`,
            }}
          >
            <h4 className="font-medium mb-2">{pages[currentPage].title}</h4>
            <p className="text-sm text-muted-foreground">{pages[currentPage].content}</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes page-enter {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// Tooltip Demo
function TooltipDemo({ bezierCSS, duration }: DemoProps) {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  const items = [
    { label: "Save", tip: "Save your changes (Ctrl+S)" },
    { label: "Export", tip: "Export as PNG or SVG" },
    { label: "Share", tip: "Copy shareable link" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">Tooltip / Popover</h3>
        <p className="text-xs text-muted-foreground">
          Hover over the buttons to see tooltips appear with your easing curve.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 justify-center py-8">
        {items.map((item, i) => (
          <div
            key={i}
            className="relative"
            onMouseEnter={() => setActiveTooltip(i)}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <Button variant="outline" size="sm" className="gap-2">
              <Info className="h-3.5 w-3.5" />
              {item.label}
            </Button>
            {/* Tooltip */}
            <div
              className="absolute left-1/2 bottom-full mb-2 pointer-events-none"
              style={{
                transform:
                  activeTooltip === i
                    ? "translateX(-50%) scale(1)"
                    : "translateX(-50%) scale(0.85)",
                opacity: activeTooltip === i ? 1 : 0,
                transition: `transform ${duration}s ${bezierCSS}, opacity ${duration}s ${bezierCSS}`,
                transformOrigin: "center bottom",
              }}
            >
              <div className="whitespace-nowrap rounded-md bg-foreground text-background px-3 py-1.5 text-xs shadow-lg">
                {item.tip}
              </div>
              <div className="mx-auto h-0 w-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-foreground" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Carousel Demo
function CarouselDemo({ bezierCSS, duration }: DemoProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideKey, setSlideKey] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");

  const slides = [
    { title: "Mountain Vista", bg: "bg-gradient-to-br from-sky-400/20 to-emerald-400/20" },
    { title: "Ocean Sunset", bg: "bg-gradient-to-br from-orange-400/20 to-rose-400/20" },
    { title: "Forest Path", bg: "bg-gradient-to-br from-emerald-400/20 to-teal-400/20" },
    { title: "City Lights", bg: "bg-gradient-to-br from-violet-400/20 to-indigo-400/20" },
  ];

  const goTo = (dir: "left" | "right") => {
    setDirection(dir);
    setSlideKey((k) => k + 1);
    setCurrentSlide((prev) => {
      if (dir === "right") return (prev + 1) % slides.length;
      return (prev - 1 + slides.length) % slides.length;
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Image Carousel</h3>
        <p className="text-xs text-muted-foreground">Click the arrows to slide between items.</p>
      </div>

      <div className="relative rounded-xl border border-border bg-surface overflow-hidden">
        <div className="relative h-48 overflow-hidden">
          <div
            key={slideKey}
            className={`absolute inset-0 flex items-center justify-center ${slides[currentSlide].bg}`}
            style={{
              animation: `carousel-${direction} ${duration}s ${bezierCSS} forwards`,
            }}
          >
            <span className="text-lg font-medium">{slides[currentSlide].title}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between p-3 border-t border-border">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => goTo("left")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === currentSlide ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => goTo("right")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes carousel-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes carousel-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
