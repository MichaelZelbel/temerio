import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Menu,
  Search,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { docNav, getAdjacentSlugs, getTitleForSlug } from "@/content/docs";
import { getDocPage } from "@/content/docs/pages";

const DEFAULT_SLUG = "quick-start";

function DocsSidebar({
  activeSlug,
  searchQuery,
  onSearchChange,
  searchResults,
}: {
  activeSlug: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults: { slug: string; title: string }[] | null;
}) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search docs…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {searchResults ? (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-2">
            {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
          </p>
          {searchResults.map((r) => (
            <Link
              key={r.slug}
              to={`/docs?page=${r.slug}`}
              className={cn(
                "block text-sm py-1.5 px-3 rounded-md transition-colors",
                activeSlug === r.slug
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {r.title}
            </Link>
          ))}
        </div>
      ) : (
        <nav className="space-y-5">
          {docNav.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                {group.label}
              </p>
              {group.items.map((item) => (
                <Link
                  key={item.slug}
                  to={`/docs?page=${item.slug}`}
                  className={cn(
                    "block text-sm py-1.5 px-3 rounded-md transition-colors",
                    activeSlug === item.slug
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}

function TOC({ headings, activeId }: { headings: { id: string; label: string }[]; activeId: string }) {
  return (
    <nav className="sticky top-24 space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        On this page
      </p>
      {headings.map(({ id, label }) => (
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
    </nav>
  );
}

const Docs = () => {
  const [searchParams] = useSearchParams();
  const slug = searchParams.get("page") || DEFAULT_SLUG;
  const page = getDocPage(slug);
  const { prev, next } = getAdjacentSlugs(slug);
  const title = getTitleForSlug(slug);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeHeadingId, setActiveHeadingId] = useState("");
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const results: { slug: string; title: string }[] = [];
    for (const group of docNav) {
      for (const item of group.items) {
        const p = getDocPage(item.slug);
        if (
          item.title.toLowerCase().includes(q) ||
          (p && p.searchText.toLowerCase().includes(q))
        ) {
          results.push({ slug: item.slug, title: item.title });
        }
      }
    }
    return results;
  }, [searchQuery]);

  // scroll-spy for TOC
  useEffect(() => {
    if (!page) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActiveHeadingId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    page.headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [page, slug]);

  // Reset feedback on page change
  useEffect(() => {
    setFeedback(null);
    window.scrollTo(0, 0);
  }, [slug]);

  return (
    <div className="container py-8 md:py-12">
      <div className="flex gap-10">
        {/* Left sidebar — desktop */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-24">
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <DocsSidebar
                activeSlug={slug}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchResults={searchResults}
              />
            </ScrollArea>
          </div>
        </aside>

        {/* Mobile sidebar trigger */}
        <div className="lg:hidden fixed bottom-4 left-4 z-40">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="rounded-full shadow-lg">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 pt-10">
              <ScrollArea className="h-full">
                <DocsSidebar
                  activeSlug={slug}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  searchResults={searchResults}
                />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {page ? (
            <article className="max-w-3xl space-y-6 [&_h2]:scroll-mt-24 [&_h2]:text-2xl [&_h2]:font-display [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_li]:text-muted-foreground [&_ul]:space-y-1 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_strong]:text-foreground">
              <h1>{title}</h1>
              {page.content}

              {/* Feedback */}
              <Separator className="mt-12" />
              <div className="flex items-center justify-between py-4">
                <p className="text-sm text-muted-foreground">Was this page helpful?</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={feedback === "up" ? "default" : "outline"}
                    onClick={() => setFeedback("up")}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" /> Yes
                  </Button>
                  <Button
                    size="sm"
                    variant={feedback === "down" ? "default" : "outline"}
                    onClick={() => setFeedback("down")}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" /> No
                  </Button>
                </div>
              </div>

              {/* Prev / Next */}
              <div className="flex items-center justify-between pt-4">
                {prev ? (
                  <Button variant="ghost" asChild>
                    <Link to={`/docs?page=${prev.slug}`}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      {prev.title}
                    </Link>
                  </Button>
                ) : <span />}
                {next ? (
                  <Button variant="ghost" asChild>
                    <Link to={`/docs?page=${next.slug}`}>
                      {next.title}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                ) : <span />}
              </div>
            </article>
          ) : (
            <div className="text-center py-20 space-y-4">
              <h2>Page not found</h2>
              <p className="text-muted-foreground">The documentation page you're looking for doesn't exist.</p>
              <Button asChild>
                <Link to="/docs">Go to Quick Start</Link>
              </Button>
            </div>
          )}
        </main>

        {/* Right TOC — desktop */}
        {page && (
          <aside className="hidden xl:block w-52 shrink-0">
            <TOC headings={page.headings} activeId={activeHeadingId} />
          </aside>
        )}
      </div>
    </div>
  );
};

export default Docs;
