import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type TOCItem = { id: string; label: string };

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  toc: TOCItem[];
  children: React.ReactNode;
}

export function LegalLayout({ title, lastUpdated, toc, children }: LegalLayoutProps) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  return (
    <div className="container py-12 md:py-16">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 space-y-2">
          <h1>{title}</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        <div className="flex gap-12">
          {/* Sidebar TOC — desktop */}
          <nav className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                On this page
              </p>
              {toc.map(({ id, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={cn(
                    "block text-sm py-1 border-l-2 pl-3 transition-colors",
                    activeId === id
                      ? "border-primary text-foreground font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </a>
              ))}
            </div>
          </nav>

          {/* Content */}
          <article className="flex-1 min-w-0 prose prose-sm max-w-none space-y-8 [&_h2]:scroll-mt-24 [&_h2]:text-2xl [&_h2]:font-display [&_h2]:font-bold [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_li]:text-muted-foreground [&_ul]:space-y-1">
            {children}
          </article>
        </div>
      </div>
    </div>
  );
}
