import { useState, type FormEvent } from "react";
import type { Trade, SafetyTier } from "../utils/contractors";
import { TRADE_LABELS } from "../utils/contractors";

export interface Filters {
  trade: Trade | "all";
  district: string | "all";
  tier: SafetyTier | "all";
  query: string;
}

interface FilterBarProps {
  filters: Filters;
  districts: string[];
  onChange: (next: Filters) => void;
  onSearch: (query: string) => void;
  searchPending: boolean;
  totalCount: number;
  filteredCount: number;
  aiActive: boolean;
}

const TRADES: (Trade | "all")[] = [
  "all",
  "interior_renovation",
  "air_conditioning",
  "external_wall_pipe",
  "truss_out_scaffolding",
];

const TRADE_FILTER_LABELS: Record<Trade | "all", string> = {
  all: "全部工種",
  ...TRADE_LABELS,
};

const TIER_OPTIONS: { value: SafetyTier | "all"; label: string }[] = [
  { value: "all", label: "全部級別" },
  { value: "osh_gold_star", label: "金星級" },
  { value: "osh_star", label: "星級" },
];

export function FilterBar({
  filters,
  districts,
  onChange,
  onSearch,
  searchPending,
  totalCount,
  filteredCount,
  aiActive,
}: FilterBarProps) {
  const [searchInput, setSearchInput] = useState("");

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleClear = () => {
    setSearchInput("");
    onSearch("");
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="search"
            placeholder="用自然語言搜尋，例如「冷氣 元朗」或「scaffolding Kowloon」…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-card py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
            <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
        <button
          type="submit"
          disabled={searchPending || !searchInput.trim()}
          className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {searchPending ? "搜尋中…" : "搜尋"}
        </button>
        {(aiActive || filters.query) && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-gray-50"
          >
            清除
          </button>
        )}
      </form>

      {aiActive && (
        <p className="flex items-center gap-1.5 text-xs text-accent">
          <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
            <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
          </svg>
          AI 已解析搜尋條件
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {TRADES.map((t) => (
          <button
            key={t}
            onClick={() => set("trade", t)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filters.trade === t
                ? "border-accent bg-accent text-white"
                : "border-border bg-surface-card text-ink-muted hover:border-accent hover:text-accent"
            }`}
          >
            {TRADE_FILTER_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
        <select
          value={filters.district}
          onChange={(e) => set("district", e.target.value)}
          className="rounded-lg border border-border bg-surface-card px-3 py-2 text-sm text-ink-muted outline-none focus:border-accent"
        >
          <option value="all">全部地區</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={filters.tier}
          onChange={(e) => set("tier", e.target.value as SafetyTier | "all")}
          className="rounded-lg border border-border bg-surface-card px-3 py-2 text-sm text-ink-muted outline-none focus:border-accent"
        >
          {TIER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-ink-faint">
        顯示 {filteredCount} / {totalCount} 間認可企業
      </p>
    </div>
  );
}
