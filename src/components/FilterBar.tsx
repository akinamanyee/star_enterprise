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
  totalCount: number;
  filteredCount: number;
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
  totalCount,
  filteredCount,
}: FilterBarProps) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="space-y-4">
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

        <input
          type="search"
          placeholder="搜尋企業名稱或地址…"
          value={filters.query}
          onChange={(e) => set("query", e.target.value)}
          className="col-span-2 rounded-lg border border-border bg-surface-card px-3 py-2 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent sm:min-w-0 sm:flex-1"
        />
      </div>

      <p className="text-sm text-ink-faint">
        顯示 {filteredCount} / {totalCount} 間認可企業
      </p>
    </div>
  );
}
