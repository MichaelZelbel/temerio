import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  Plus, Search, LayoutGrid, List, MoreHorizontal, Pencil,
  Trash2, Heart, Copy, FolderInput, X, Package, Star,
} from "lucide-react";

/* ─── Mock Data ─── */

const CATEGORIES = ["All", "Document", "Design", "Code", "Data", "Media"] as const;
type Category = (typeof CATEGORIES)[number];

interface LibraryItem {
  id: string;
  title: string;
  description: string;
  category: Exclude<Category, "All">;
  createdAt: Date;
  favorite: boolean;
}

const MOCK_ITEMS: LibraryItem[] = [
  { id: "1", title: "Q4 Marketing Report", description: "Comprehensive analysis of Q4 marketing performance across all channels.", category: "Document", createdAt: new Date("2026-02-10"), favorite: true },
  { id: "2", title: "Brand Guidelines v2", description: "Updated brand guidelines including new color palette and typography.", category: "Design", createdAt: new Date("2026-02-08"), favorite: false },
  { id: "3", title: "API Integration Script", description: "Python script for integrating with the payment gateway API.", category: "Code", createdAt: new Date("2026-02-06"), favorite: true },
  { id: "4", title: "User Analytics Dashboard", description: "Interactive dashboard for tracking user engagement metrics.", category: "Data", createdAt: new Date("2026-02-04"), favorite: false },
  { id: "5", title: "Product Demo Video", description: "Walkthrough demo of the new product features for onboarding.", category: "Media", createdAt: new Date("2026-02-02"), favorite: false },
  { id: "6", title: "Onboarding Flow Design", description: "Figma mockups for the redesigned user onboarding experience.", category: "Design", createdAt: new Date("2026-01-28"), favorite: true },
  { id: "7", title: "Database Schema", description: "ERD and schema documentation for the core data models.", category: "Code", createdAt: new Date("2026-01-25"), favorite: false },
  { id: "8", title: "Revenue Forecast 2026", description: "Financial projections and revenue targets for the upcoming year.", category: "Data", createdAt: new Date("2026-01-20"), favorite: false },
  { id: "9", title: "Team Standup Notes", description: "Weekly standup meeting notes and action items from the team.", category: "Document", createdAt: new Date("2026-01-15"), favorite: false },
];

const CATEGORY_COLORS: Record<string, "default" | "secondary" | "info" | "success" | "warning"> = {
  Document: "secondary",
  Design: "info",
  Code: "success",
  Data: "warning",
  Media: "default",
};

const PAGE_SIZE = 6;

/* ─── Component ─── */

export default function Library() {
  const [items, setItems] = useState<LibraryItem[]>(MOCK_ITEMS);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [sort, setSort] = useState<"recent" | "alpha" | "most-used">("recent");
  const [tab, setTab] = useState<"all" | "recent" | "favorites">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const toggleFavorite = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, favorite: !i.favorite } : i)));
  }, []);

  const deleteItem = useCallback(() => {
    if (!deleteId) return;
    setItems((prev) => prev.filter((i) => i.id !== deleteId));
    setDeleteId(null);
  }, [deleteId]);

  const filtered = useMemo(() => {
    let result = [...items];

    // Tab filter
    if (tab === "favorites") result = result.filter((i) => i.favorite);
    if (tab === "recent") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 14);
      result = result.filter((i) => i.createdAt >= weekAgo);
    }

    // Category filter
    if (category !== "All") result = result.filter((i) => i.category === category);

    // Search
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }

    // Sort
    if (sort === "recent") result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    else if (sort === "alpha") result.sort((a, b) => a.title.localeCompare(b.title));

    return result;
  }, [items, query, category, sort, tab]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  const hasFilters = !!(query || category !== "All");
  const clearFilters = () => { setQuery(""); setCategory("All"); setPage(1); };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3>My Library</h3>
          <p className="text-muted-foreground">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" /> Create New
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={category} onValueChange={(v) => { setCategory(v as Category); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="alpha">Alphabetical</SelectItem>
              <SelectItem value="most-used">Most Used</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex rounded-md border">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none border-0"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none border-0"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {paginated.map((item) => (
              <GridCard key={item.id} item={item} onFav={toggleFavorite} onDelete={setDeleteId} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {paginated.map((item) => (
              <ListRow key={item.id} item={item} onFav={toggleFavorite} onDelete={setDeleteId} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
            Load more
          </Button>
        </div>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The item will be permanently removed from your library.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Grid Card ─── */

function GridCard({ item, onFav, onDelete }: { item: LibraryItem; onFav: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
      <Card className="group cursor-pointer h-full flex flex-col">
        <CardContent className="p-4 flex flex-col flex-1 gap-3">
          <div className="flex items-start justify-between gap-2">
            <Badge variant={CATEGORY_COLORS[item.category] || "secondary"} className="text-2xs shrink-0">
              {item.category}
            </Badge>
            <ItemActions id={item.id} favorite={item.favorite} onFav={onFav} onDelete={onDelete} />
          </div>
          <div className="flex-1 min-h-0">
            <h6 className="line-clamp-1">{item.title}</h6>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {item.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            {item.favorite && <Star className="h-3.5 w-3.5 text-warning fill-warning" />}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── List Row ─── */

function ListRow({ item, onFav, onDelete }: { item: LibraryItem; onFav: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <motion.div layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.2 }}>
      <Card className="group cursor-pointer">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h6 className="truncate">{item.title}</h6>
              {item.favorite && <Star className="h-3.5 w-3.5 text-warning fill-warning shrink-0" />}
            </div>
            <p className="text-sm text-muted-foreground truncate mt-0.5">{item.description}</p>
          </div>
          <Badge variant={CATEGORY_COLORS[item.category] || "secondary"} className="text-2xs shrink-0 hidden sm:inline-flex">
            {item.category}
          </Badge>
          <span className="text-xs text-muted-foreground shrink-0 hidden md:block">
            {item.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          <ItemActions id={item.id} favorite={item.favorite} onFav={onFav} onDelete={onDelete} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Item Actions Dropdown ─── */

function ItemActions({ id, favorite, onFav, onDelete }: { id: string; favorite: boolean; onFav: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem><Pencil className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onFav(id)}>
          <Heart className={cn("h-3.5 w-3.5", favorite ? "fill-current" : "")} />
          {favorite ? "Unfavorite" : "Favorite"}
        </DropdownMenuItem>
        <DropdownMenuItem><Copy className="h-3.5 w-3.5" /> Duplicate</DropdownMenuItem>
        <DropdownMenuItem><FolderInput className="h-3.5 w-3.5" /> Move to Collection</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(id)}>
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Empty State ─── */

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-5 mb-5">
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
      {hasFilters ? (
        <>
          <h4>No results found</h4>
          <p className="text-muted-foreground mt-1 max-w-sm">Try adjusting your search or filters to find what you're looking for.</p>
          <Button variant="outline" className="mt-4" onClick={onClear}>Clear filters</Button>
        </>
      ) : (
        <>
          <h4>Your library is empty</h4>
          <p className="text-muted-foreground mt-1 max-w-sm">Create your first item to get started. It only takes a moment.</p>
          <Button className="mt-4"><Plus className="h-4 w-4" /> Create your first item</Button>
        </>
      )}
    </div>
  );
}
