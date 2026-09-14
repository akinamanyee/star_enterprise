import { z } from "zod";

export const TradeEnum = z.enum([
  "interior_renovation",
  "air_conditioning",
  "external_wall_pipe",
  "truss_out_scaffolding",
]);

export const SafetyTierEnum = z.enum(["osh_star", "osh_gold_star"]);

export const ContractorSchema = z.object({
  enterprise_name_zh: z.string().min(1),
  enterprise_name_en: z.string().min(1),
  address: z.string().min(1),
  telephone: z.array(z.string()).min(0),
  telephone_display: z.string().nullable(),
  effective_date_start: z.string().nullable(),
  effective_date_end: z.string().nullable(),
  recertification_in_progress: z.boolean(),
  accreditation_since: z.number().int(),
  safety_tier: SafetyTierEnum,
  trade: TradeEnum,
  district: z.string().nullable(),
  cic_registered: z.boolean().default(true),
});

export const ContractorsFileSchema = z.object({
  version: z.string(),
  extracted_at: z.string(),
  source_pdfs: z.array(z.string()),
  contractors: z.array(ContractorSchema),
});

export type Contractor = z.infer<typeof ContractorSchema>;
export type ContractorsFile = z.infer<typeof ContractorsFileSchema>;
export type Trade = z.infer<typeof TradeEnum>;
export type SafetyTier = z.infer<typeof SafetyTierEnum>;
