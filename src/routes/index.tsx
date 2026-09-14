import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ContractorCard } from "../components/ContractorCard";
import { FilterBar, type Filters } from "../components/FilterBar";
import {
  getContractors,
  getDistinctDistricts,
  type Contractor,
} from "../utils/contractors";

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

function HomePage() {
  const allContractors = getContractors();
  const districts = getDistinctDistricts();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const filtered = useMemo(
    () => applyFilters(allContractors, filters),
    [allContractors, filters],
  );

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
          onChange={setFilters}
          totalCount={allContractors.length}
          filteredCount={filtered.length}
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
