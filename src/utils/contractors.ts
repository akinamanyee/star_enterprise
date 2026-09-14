import contractorsData from "../../data/contractors.json";

export type SafetyTier = "osh_star" | "osh_gold_star";

export type Trade =
  | "interior_renovation"
  | "air_conditioning"
  | "external_wall_pipe"
  | "truss_out_scaffolding";

export interface Contractor {
  enterprise_name_zh: string;
  enterprise_name_en: string;
  address: string;
  telephone: string[];
  telephone_display: string | null;
  effective_date_start: string | null;
  effective_date_end: string | null;
  recertification_in_progress: boolean;
  accreditation_since: number;
  safety_tier: SafetyTier;
  trade: Trade;
  district: string | null;
  cic_registered: boolean;
}

export const TRADE_LABELS: Record<Trade, string> = {
  interior_renovation: "室內裝修",
  air_conditioning: "冷氣工程",
  external_wall_pipe: "外牆／喉管維修",
  truss_out_scaffolding: "棚架工程",
};

export const TRADE_ICONS: Record<Trade, string> = {
  interior_renovation: "🏠",
  air_conditioning: "❄️",
  external_wall_pipe: "🧱",
  truss_out_scaffolding: "🏗️",
};

const allContractors = contractorsData.contractors as Contractor[];

export function getContractors(): Contractor[] {
  return allContractors;
}

export function getDistinctDistricts(): string[] {
  const set = new Set<string>();
  for (const c of allContractors) {
    if (c.district) set.add(c.district);
  }
  return [...set].sort();
}

export function formatPhone(e164: string): string {
  const digits = e164.replace(/^852/, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  }
  return digits;
}

export function whatsappUrl(e164: string): string {
  return `https://wa.me/${e164}`;
}

export function telUrl(e164: string): string {
  return `tel:+${e164}`;
}
