"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  width?: string;
  /** Value used for sorting/searching. Defaults to render output when absent. */
  accessor?: (row: T) => string | number | null | undefined;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Concatenated text a row is searched against. */
  searchAccessor?: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  /** Filter controls / actions rendered in the toolbar next to search. */
  toolbar?: React.ReactNode;
  empty?: React.ReactNode;
  initialSort?: { key: string; dir: "asc" | "desc" };
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading = false,
  searchable = true,
  searchPlaceholder = "Search…",
  searchAccessor,
  onRowClick,
  pageSize = 12,
  toolbar,
  empty,
  initialSort,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(initialSort?.key ?? null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialSort?.dir ?? "asc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!query.trim() || !searchAccessor) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((r) => searchAccessor(r).toLowerCase().includes(q));
  }, [rows, query, searchAccessor]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.accessor) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.accessor!(a);
      const bv = col.accessor!(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1; // nulls last
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const paged = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  function toggleSort(col: Column<T>) {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir("asc");
    }
    setPage(0);
  }

  const showEmpty = !loading && sorted.length === 0;

  return (
    <div className="nx-card overflow-hidden">
      {/* Toolbar */}
      {(searchable || toolbar) && (
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--nx-edge)" }}>
          {searchable && (
            <div className="relative sm:w-72">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: "var(--nx-faint)" }}
              />
              <input
                className="nx-input pl-9"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          )}
          {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="sticky top-0 z-10" style={{ background: "var(--nx-panel)" }}>
            <tr style={{ color: "var(--nx-faint)" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-2.5 text-xs font-medium",
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                    col.sortable && "cursor-pointer select-none",
                  )}
                  style={{ width: col.width }}
                  onClick={() => toggleSort(col)}
                >
                  <span className={cn("inline-flex items-center gap-1", col.align === "right" && "flex-row-reverse")}>
                    {col.header}
                    {col.sortable &&
                      (sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ChevronUp className="h-3.5 w-3.5" style={{ color: "var(--nx-accent-2)" }} />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--nx-accent-2)" }} />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "var(--nx-edge)" }}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="nx-skeleton h-4 w-full max-w-[120px] rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              : paged.map((row) => (
                  <tr
                    key={getRowId(row)}
                    className={cn("border-t transition-colors", onRowClick && "cursor-pointer")}
                    style={{ borderColor: "var(--nx-edge)" }}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--nx-panel-2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3",
                          col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                        )}
                        style={{ color: "var(--nx-text)" }}
                      >
                        {col.render ? col.render(row) : String(col.accessor?.(row) ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {showEmpty && (empty ?? <div className="px-4 py-14 text-center text-sm" style={{ color: "var(--nx-faint)" }}>No records found.</div>)}

      {/* Pagination */}
      {!loading && sorted.length > 0 && (
        <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: "var(--nx-edge)" }}>
          <p className="text-xs" style={{ color: "var(--nx-faint)" }}>
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              className="nx-btn nx-btn-ghost px-2 py-1.5"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs" style={{ color: "var(--nx-muted)" }}>
              {safePage + 1} / {pageCount}
            </span>
            <button
              className="nx-btn nx-btn-ghost px-2 py-1.5"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
