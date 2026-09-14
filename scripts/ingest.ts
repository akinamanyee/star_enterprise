/**
 * Gemini-powered PDF ingestion script.
 *
 * Feeds official OSHC contractor-list PDFs to the Gemini API for structured
 * table extraction, validates the output against the contractor schema, and
 * writes data/contractors.json.
 *
 * Usage:
 *   GEMINI_API_KEY=<key> npm run ingest
 *
 * Requires the source PDFs in data/source-pdfs/.
 */
import { GoogleGenAI, Type } from "@google/genai";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ContractorSchema, ContractorsFileSchema } from "./schema.js";
import type { Contractor, ContractorsFile, Trade } from "./schema.js";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY environment variable is required.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const PDF_DIR = resolve(import.meta.dirname, "../data/source-pdfs");
const OUT = resolve(import.meta.dirname, "../data/contractors.json");

const MAX_RETRIES = 3;

const PDFS: { file: string; trade: Trade; tradeLabel: string }[] = [
  {
    file: "interior_renovation.pdf",
    trade: "interior_renovation",
    tradeLabel: "Interior Renovation Works",
  },
  {
    file: "air_conditioning.pdf",
    trade: "air_conditioning",
    tradeLabel: "Air-conditioning Works",
  },
  {
    file: "external_wall_pipe.pdf",
    trade: "external_wall_pipe",
    tradeLabel: "Repair of External Wall / Pipe Works",
  },
  {
    file: "truss_out_scaffolding.pdf",
    trade: "truss_out_scaffolding",
    tradeLabel: "Truss-out Scaffolding Works",
  },
];

const EXTRACTION_PROMPT = `Extract ALL contractor entries from this OSHC PDF table.

The PDF is an official Hong Kong Occupational Safety & Health Council
"OSH Star Enterprise List" for the trade: {TRADE_LABEL}.

For each row in the table, extract:
- enterprise_name_zh: Chinese name of the enterprise
- enterprise_name_en: English name of the enterprise
- address: Full address (from the 地址/Address line)
- telephone_display: Phone number(s) as displayed (e.g. "2380 2121" or "6909 9700/9553 4386")
- effective_date_start: Start date in YYYY-MM-DD format, or null if "Re-certification in Progress"
- effective_date_end: End date in YYYY-MM-DD format, or null if "Re-certification in Progress"
- recertification_in_progress: true if the effective date column says "認證進行中" or "Re-certification in Progress"
- accreditation_since: The year from the "首次認可年份 / Accreditation Since" column (integer)
- safety_tier: "osh_gold_star" if the entry has a gold star badge/icon, otherwise "osh_star"
- cic_registered: false if the enterprise name has a # mark (not registered as S21 with CIC), true otherwise

Gold Star enterprises have a distinctive gold-colored badge icon next to their name.
Regular Star enterprises have no badge or have the standard star badge.

Extract EVERY entry. Do not skip any rows. Return them in the order they appear.`;

const DISTRICT_PROMPT = `Given this Hong Kong address, determine which of the 18 districts it belongs to.
Return ONLY the district name, nothing else.

The 18 districts are:
Hong Kong Island: Central and Western, Wan Chai, Eastern, Southern
Kowloon: Yau Tsim Mong, Sham Shui Po, Kowloon City, Wong Tai Sin, Kwun Tong
New Territories: Kwai Tsing, Tsuen Wan, Tuen Mun, Yuen Long, North, Tai Po, Sha Tin, Sai Kung, Islands

Address: {ADDRESS}`;

async function extractFromPdf(
  pdfPath: string,
  trade: Trade,
  tradeLabel: string,
): Promise<Contractor[]> {
  const pdfBytes = readFileSync(pdfPath);
  const pdfBase64 = pdfBytes.toString("base64");

  const prompt = EXTRACTION_PROMPT.replace("{TRADE_LABEL}", tradeLabel);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: "application/pdf", data: pdfBase64 } },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                enterprise_name_zh: { type: Type.STRING },
                enterprise_name_en: { type: Type.STRING },
                address: { type: Type.STRING },
                telephone_display: { type: Type.STRING, nullable: true },
                effective_date_start: { type: Type.STRING, nullable: true },
                effective_date_end: { type: Type.STRING, nullable: true },
                recertification_in_progress: { type: Type.BOOLEAN },
                accreditation_since: { type: Type.INTEGER },
                safety_tier: {
                  type: Type.STRING,
                  enum: ["osh_star", "osh_gold_star"],
                },
                cic_registered: { type: Type.BOOLEAN },
              },
              required: [
                "enterprise_name_zh",
                "enterprise_name_en",
                "address",
                "accreditation_since",
                "safety_tier",
                "recertification_in_progress",
                "cic_registered",
              ],
            },
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini");

      const parsed = JSON.parse(text) as Array<Record<string, unknown>>;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error(`Expected array of entries, got: ${typeof parsed}`);
      }

      // Validate each entry and add derived fields
      const contractors: Contractor[] = [];
      for (const raw of parsed) {
        const phoneDisplay = (raw.telephone_display as string) || null;
        const phones = phoneDisplay
          ? phoneDisplay
              .replace(/[^\d/]/g, "")
              .split("/")
              .filter((p: string) => p.length >= 8)
              .map((p: string) => `852${p}`)
          : [];

        const entry: Contractor = {
          enterprise_name_zh: String(raw.enterprise_name_zh || ""),
          enterprise_name_en: String(raw.enterprise_name_en || ""),
          address: String(raw.address || ""),
          telephone: phones,
          telephone_display: phoneDisplay,
          effective_date_start: (raw.effective_date_start as string) || null,
          effective_date_end: (raw.effective_date_end as string) || null,
          recertification_in_progress: Boolean(raw.recertification_in_progress),
          accreditation_since: Number(raw.accreditation_since) || 0,
          safety_tier: raw.safety_tier === "osh_gold_star" ? "osh_gold_star" : "osh_star",
          trade,
          district: null,
          cic_registered: raw.cic_registered !== false,
        };

        const validation = ContractorSchema.safeParse(entry);
        if (!validation.success) {
          console.warn(`  ⚠ Skipping invalid entry "${entry.enterprise_name_en}": ${validation.error.issues[0].message}`);
          continue;
        }
        contractors.push(entry);
      }

      console.log(`  ✓ Extracted ${contractors.length} entries (attempt ${attempt})`);
      return contractors;
    } catch (err) {
      console.error(`  ✗ Attempt ${attempt} failed:`, (err as Error).message);
      if (attempt === MAX_RETRIES) throw err;
    }
  }

  return [];
}

async function inferDistricts(contractors: Contractor[]): Promise<void> {
  console.log("\nInferring districts...");
  const batchSize = 10;

  for (let i = 0; i < contractors.length; i += batchSize) {
    const batch = contractors.slice(i, i + batchSize);
    const addresses = batch.map((c) => c.address);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `For each address below, return the Hong Kong district name (one of the 18 districts). Return a JSON array of strings, one per address, in the same order.

The 18 districts: Central and Western, Wan Chai, Eastern, Southern, Yau Tsim Mong, Sham Shui Po, Kowloon City, Wong Tai Sin, Kwun Tong, Kwai Tsing, Tsuen Wan, Tuen Mun, Yuen Long, North, Tai Po, Sha Tin, Sai Kung, Islands

Addresses:
${addresses.map((a, idx) => `${idx + 1}. ${a}`).join("\n")}`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      });

      const districts = JSON.parse(response.text || "[]") as string[];
      for (let j = 0; j < batch.length && j < districts.length; j++) {
        batch[j].district = districts[j] || null;
      }
    } catch (err) {
      console.warn(`  ⚠ District batch ${i / batchSize + 1} failed:`, (err as Error).message);
    }
  }

  const resolved = contractors.filter((c) => c.district).length;
  console.log(`  ✓ ${resolved}/${contractors.length} districts resolved`);
}

async function main() {
  const allContractors: Contractor[] = [];

  for (const { file, trade, tradeLabel } of PDFS) {
    const path = `${PDF_DIR}/${file}`;
    console.log(`\nExtracting: ${file} (${trade})`);
    const entries = await extractFromPdf(path, trade, tradeLabel);
    allContractors.push(...entries);
  }

  // Deduplicate by (name + trade)
  const seen = new Set<string>();
  const deduped = allContractors.filter((c) => {
    const key = `${c.enterprise_name_en.toLowerCase()}|${c.trade}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`\nTotal: ${deduped.length} contractors (${allContractors.length} before dedup)`);

  // Infer districts via Gemini
  await inferDistricts(deduped);

  const output: ContractorsFile = {
    version: "1.0.0",
    extracted_at: new Date().toISOString(),
    source_pdfs: PDFS.map((p) => p.file),
    contractors: deduped,
  };

  // Final validation
  const validation = ContractorsFileSchema.safeParse(output);
  if (!validation.success) {
    console.error("\nFinal validation FAILED:");
    for (const issue of validation.error.issues) {
      console.error(`  ${issue.path.join(".")} — ${issue.message}`);
    }
    process.exit(1);
  }

  writeFileSync(OUT, JSON.stringify(output, null, 2), "utf-8");
  console.log(`\n✓ Written to ${OUT}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
