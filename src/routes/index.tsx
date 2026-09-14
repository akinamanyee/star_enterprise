import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback, useTransition } from "react";
import { ContractorCard } from "../components/ContractorCard";
import { FilterBar, type Filters } from "../components/FilterBar";
import {
  getContractors,
  getDistinctDistricts,
  type Contractor,
} from "../utils/contractors";
import { parseSearchQuery, type SearchFilters } from "../utils/search.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "職安健星級企業名冊 — Star Enterprise" }],
  }),
  component: HomePage,
});

const DEFAULT_FILTERS: Filters = {
  trade: "all",
  district: "all",
  tier: "all",
  query: "",
};

function applyFilters(contractors: Contractor[], filters: Filters): Contractor[] {
  let result = contractors;

  if (filters.trade !== "all") {
    result = result.filter((c) => c.trade === filters.trade);
  }
  if (filters.district !== "all") {
    result = result.filter((c) => c.district === filters.district);
  }
  if (filters.tier !== "all") {
    result = result.filter((c) => c.safety_tier === filters.tier);
  }
  if (filters.query.trim()) {
    const q = filters.query.trim().toLowerCase();
    result = result.filter(
      (c) =>
        c.enterprise_name_zh.toLowerCase().includes(q) ||
        c.enterprise_name_en.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q),
    );
  }

  return result;
}

function applyAiFilters(
  contractors: Contractor[],
  sf: SearchFilters,
  manualFilters: Filters,
): Contractor[] {
  let result = contractors;

  if (sf.trade) {
    result = result.filter((c) => c.trade === sf.trade);
  }
  if (sf.district) {
    result = result.filter((c) => c.district === sf.district);
  }
  if (manualFilters.tier !== "all") {
    result = result.filter((c) => c.safety_tier === manualFilters.tier);
  }
  if (sf.keywords.length > 0) {
    const kws = sf.keywords.map((k) => k.toLowerCase());
    result = result.filter((c) => {
      const text = `${c.enterprise_name_zh} ${c.enterprise_name_en} ${c.address}`.toLowerCase();
      return kws.some((kw) => text.includes(kw));
    });
  }

  return result;
}

function HomePage() {
  const allContractors = getContractors();
  const districts = getDistinctDistricts();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [aiFilters, setAiFilters] = useState<SearchFilters | null>(null);
  const [searchPending, startTransition] = useTransition();
  const [aiActive, setAiActive] = useState(false);

  const filtered = useMemo(() => {
    if (aiActive && aiFilters) {
      return applyAiFilters(allContractors, aiFilters, filters);
    }
    return applyFilters(allContractors, filters);
  }, [allContractors, filters, aiFilters, aiActive]);

  const handleSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setAiActive(false);
        setAiFilters(null);
        setFilters((f) => ({ ...f, query: "" }));
        return;
      }

      startTransition(async () => {
        try {
          const result = await parseSearchQuery({ data: { query } });
          const sf = result.filters;
          if (sf.trade || sf.district || sf.keywords.length > 0) {
            setAiFilters(sf);
            setAiActive(true);
            setFilters((f) => ({
              ...f,
              trade: sf.trade ?? "all",
              district: sf.district ?? "all",
              query: "",
            }));
          } else {
            setAiActive(false);
            setAiFilters(null);
            setFilters((f) => ({ ...f, query }));
          }
        } catch {
          setAiActive(false);
          setAiFilters(null);
          setFilters((f) => ({ ...f, query }));
        }
      });
    },
    [],
  );

  const handleFilterChange = useCallback((next: Filters) => {
    setAiActive(false);
    setAiFilters(null);
    setFilters(next);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          職安健星級企業名冊
        </h1>
        <p className="mt-2 text-base text-ink-muted">
          香港職業安全健康局認可承建商名錄 — 室內裝修、冷氣、外牆維修及棚架工程
        </p>
      </header>

      <section className="mb-8" aria-label="篩選條件">
        <FilterBar
          filters={filters}
          districts={districts}
          onChange={handleFilterChange}
          onSearch={handleSearch}
          searchPending={searchPending}
          totalCount={allContractors.length}
          filteredCount={filtered.length}
          aiActive={aiActive}
        />
      </section>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-card px-6 py-16 text-center">
          <p className="text-lg font-medium text-ink-muted">找不到符合條件的企業</p>
          <p className="mt-1 text-sm text-ink-faint">請嘗試調整篩選條件</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => (
            <ContractorCard key={`${c.enterprise_name_en}-${c.trade}-${i}`} contractor={c} />
          ))}
        </div>
      )}
    </div>
  );
}
