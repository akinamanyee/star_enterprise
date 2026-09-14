import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Contractor, ContractorsFile, Trade, SafetyTier } from "./schema.js";

const PDF_DIR = resolve(import.meta.dirname, "../data/source-pdfs");
const OUT = resolve(import.meta.dirname, "../data/contractors.json");

const PDFS: { file: string; trade: Trade }[] = [
  { file: "interior_renovation.pdf", trade: "interior_renovation" },
  { file: "air_conditioning.pdf", trade: "air_conditioning" },
  { file: "external_wall_pipe.pdf", trade: "external_wall_pipe" },
  { file: "truss_out_scaffolding.pdf", trade: "truss_out_scaffolding" },
];

// Gold Star entries identified by visual inspection of badge icons in the PDFs.
// Key = English enterprise name (lowercased), Value = true if Gold Star.
const GOLD_STAR_ENTERPRISES = new Set([
  // Interior Renovation & External Wall/Pipe — entries 1,2 have Gold Star badges
  "kin fat construction company limited",
  "nga luen construction & engineering co., limited",
  // Scaffolding — entries 1-5 have Gold Star badges
  "wang fat hong scaffolding limited",
  "yau hop scaffolding works and contractors limited",
  "chi fai scaffolding works",
  "lok sum scaffolding limited",
  "yamaha scaffolding limited",
]);

// CIC S21 unregistered enterprises (marked with # in scaffolding PDF)
const CIC_UNREGISTERED = new Set([
  "runsheng scaffolding engineering company limited",
  "sum wai lee construction company limited",
]);

// HK 18-district mapping from address keywords
const DISTRICT_KEYWORDS: [string[], string][] = [
  [["tsim sha tsui", "尖沙咀", "佐敦", "jordan"], "Yau Tsim Mong"],
  [["mong kok", "mongkok", "旺角", "太子", "prince edward"], "Yau Tsim Mong"],
  [["yau ma tei", "油麻地"], "Yau Tsim Mong"],
  [["tai kok tsui", "大角咀"], "Yau Tsim Mong"],
  [["nathan road", "彌敦道"], "Yau Tsim Mong"],
  [["cheung sha wan", "長沙灣"], "Sham Shui Po"],
  [["sham shui po", "深水埗", "深水步"], "Sham Shui Po"],
  [["castle peak road, kln", "castle peak road, cheung"], "Sham Shui Po"],
  [["hung hom", "紅磡", "hung hum"], "Kowloon City"],
  [["kowloon city", "九龍城", "to kwa wan", "土瓜灣"], "Kowloon City"],
  [["san po kong", "新蒲崗"], "Wong Tai Sin"],
  [["wong tai sin", "黃大仙", "diamond hill", "鑽石山", "竹園"], "Wong Tai Sin"],
  [["kwun tong", "觀塘"], "Kwun Tong"],
  [["ngau tau kok", "牛頭角"], "Kwun Tong"],
  [["kwai chung", "葵涌", "kwai fong", "葵芳"], "Kwai Tsing"],
  [["tsing yi", "青衣"], "Kwai Tsing"],
  [["tsuen wan", "荃灣"], "Tsuen Wan"],
  [["tuen mun", "屯門"], "Tuen Mun"],
  [["yuen long", "元朗", "ping shan"], "Yuen Long"],
  [["tai po", "大埔"], "Tai Po"],
  [["sha tin", "shatin", "沙田", "fo tan", "火炭", "ma on shan"], "Sha Tin"],
  [["fanling", "粉嶺", "sheung shui", "上水"], "North"],
  [["sai kung", "西貢", "tseung kwan o", "將軍澳"], "Sai Kung"],
  [["tung chung", "東涌", "lantau", "大嶼山"], "Islands"],
  [["chai wan", "chaiwan", "柴灣"], "Eastern"],
  [["shau kei wan", "筲箕灣"], "Eastern"],
  [["wan chai", "灣仔"], "Wan Chai"],
  [["causeway bay", "銅鑼灣"], "Wan Chai"],
  [["central", "中環", "sheung wan", "上環", "western", "sai ying pun"], "Central and Western"],
  [["aberdeen", "香港仔", "ap lei chau"], "Southern"],
  [["stanley", "赤柱", "repulse bay"], "Southern"],
  [["lck, kowloon", "lai chi kok", "荔枝角", "青山道"], "Sham Shui Po"],
  [["san tin", "新田"], "Yuen Long"],
  [["fung wong", "鳳凰"], "Yuen Long"],
  [["lantau", "tung chung"], "Islands"],
  [["hung to road", "鴻圖道"], "Kwun Tong"],
  [["cheung sha wan road"], "Sham Shui Po"],
  [["no. 7 shek pai tau road, tuen mun"], "Tuen Mun"],
  [["kowloon"], "Yau Tsim Mong"],
  [["kln"], "Yau Tsim Mong"],
  [["nt"], "Tsuen Wan"],
];

function inferDistrict(address: string): string | null {
  const lower = address.toLowerCase();
  for (const [keywords, district] of DISTRICT_KEYWORDS) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) return district;
    }
  }
  return null;
}

function normalizePhone(raw: string): string[] {
  const cleaned = raw.replace(/[^\d/]/g, "");
  if (!cleaned) return [];
  return cleaned.split("/").filter((p) => p.length >= 8).map((p) => `852${p}`);
}

function parseDate(raw: string): string | null {
  // Format: "14.7.2025" or "5.3.2026"
  const match = raw.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return null;
  const [, d, m, y] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function extractFromPdf(pdfPath: string, trade: Trade): Contractor[] {
  const raw = execSync(`pdftotext -layout "${pdfPath}" -`, {
    encoding: "utf-8",
  });

  const lines = raw.split("\n");
  const contractors: Contractor[] = [];
  let i = 0;

  // Skip until we find the table header
  while (i < lines.length) {
    if (lines[i].includes("Enterprise Name") && lines[i].includes("Address")) {
      i++;
      break;
    }
    i++;
  }

  // Parse entries — each starts with a row number at the start of a line
  let currentEntry: Partial<Contractor> | null = null;
  let addressLines: string[] = [];
  let rawPhone = "";
  let rawEffective = "";

  function flushEntry() {
    if (!currentEntry?.enterprise_name_en) return;
    const fullAddress = addressLines.join(" ").trim();
    const phones = normalizePhone(rawPhone);
    const effectiveClean = rawEffective.trim();
    const recert = effectiveClean.includes("認證進行中") || effectiveClean.includes("Re-certification");

    let startDate: string | null = null;
    let endDate: string | null = null;
    if (!recert && effectiveClean.includes("–") || effectiveClean.includes("-")) {
      const parts = effectiveClean.split(/[–-]/);
      if (parts.length === 2) {
        startDate = parseDate(parts[0].trim());
        endDate = parseDate(parts[1].trim());
      }
    }

    const nameEn = (currentEntry.enterprise_name_en || "").trim();
    const isGold = GOLD_STAR_ENTERPRISES.has(nameEn.toLowerCase());
    const isCicRegistered = !CIC_UNREGISTERED.has(nameEn.toLowerCase());

    contractors.push({
      enterprise_name_zh: (currentEntry.enterprise_name_zh || "").trim(),
      enterprise_name_en: nameEn,
      address: fullAddress,
      telephone: phones,
      telephone_display: rawPhone.trim() || null,
      effective_date_start: startDate,
      effective_date_end: endDate,
      recertification_in_progress: recert,
      accreditation_since: currentEntry.accreditation_since || 0,
      safety_tier: isGold ? "osh_gold_star" : "osh_star",
      trade,
      district: inferDistrict(fullAddress),
      cic_registered: isCicRegistered,
    });
  }

  while (i < lines.length) {
    const line = lines[i];

    // Footer / end markers
    if (line.includes("截至") || line.includes("As of") || line.includes("上述獲認可")) {
      flushEntry();
      break;
    }

    // New entry: starts with a number at position 0-5
    const entryMatch = line.match(/^\s{0,5}(\d{1,3})\s{2,}/);
    if (entryMatch) {
      flushEntry();

      currentEntry = {};
      addressLines = [];
      rawPhone = "";
      rawEffective = "";

      // The Chinese name is on this line
      const afterNum = line.substring(entryMatch[0].length).trim();
      // Split: Chinese name | phone area | effective date | accred year
      // The layout uses fixed columns roughly at positions:
      // ~5-55: name/address, ~56-68: phone, ~68-90: effective date, ~90+: year
      let zhName = afterNum.replace(/\s{3,}.*/, "").trim().replace(/#$/, "");
      zhName = zhName.replace(/認證進行中.*$/, "").replace(/Re-certification.*$/i, "").trim();
      currentEntry.enterprise_name_zh = zhName;

      // Extract phone from the right side of the line
      const phoneMatch = line.match(/(\d{4}\s?\d{4}(?:\/\s*\d{4}\s?\d{4})?)/);
      if (phoneMatch) rawPhone = phoneMatch[1];

      // Extract effective date
      const dateMatch = line.match(/(\d{1,2}\.\d{1,2}\.\d{4}\s*[–-]\s*\d{1,2}\.\d{1,2}\.\d{4})/);
      if (dateMatch) rawEffective = dateMatch[1];
      if (line.includes("認證進行中") || line.includes("Re-certification")) {
        rawEffective = "認證進行中";
      }

      // Extract accreditation year
      const yearMatch = line.match(/\b(20[12]\d)\s*$/);
      if (yearMatch) currentEntry.accreditation_since = parseInt(yearMatch[1]);

      i++;
      continue;
    }

    // English name line (contains "Limited", "Ltd", "Co.", "Works", "Engineering", "Company", "Group")
    if (
      currentEntry &&
      !currentEntry.enterprise_name_en &&
      (line.includes("Limited") ||
        line.includes("Ltd") ||
        line.includes("Co.") ||
        line.includes("Works") ||
        line.includes("Engineering") ||
        line.includes("Company") ||
        line.includes("Group") ||
        line.includes("Construction"))
    ) {
      let enName = line.trim().replace(/#$/, "");
      // Clean up layout bleed from adjacent columns
      enName = enName
        .replace(/\s{3,}.*/, "")  // drop everything after 3+ spaces (column bleed)
        .replace(/Re-certification.*$/i, "")
        .replace(/認證進行中.*$/, "")
        .replace(/\d{4}\s?\d{4}.*$/, "")  // phone bleed
        .trim();
      currentEntry.enterprise_name_en = enName;

      // Check for phone, date, year on this line too
      if (!rawPhone) {
        const pm = line.match(/(\d{4}\s?\d{4}(?:\/\s*\d{4}\s?\d{4})?)/);
        if (pm) rawPhone = pm[1];
      }
      if (!rawEffective) {
        const dm = line.match(/(\d{1,2}\.\d{1,2}\.\d{4}\s*[–-]\s*\d{1,2}\.\d{1,2}\.\d{4})/);
        if (dm) rawEffective = dm[1];
        if (line.includes("認證進行中") || line.includes("Re-certification")) {
          rawEffective = "認證進行中";
        }
      }
      if (!currentEntry.accreditation_since) {
        const ym = line.match(/\b(20[12]\d)\s*$/);
        if (ym) currentEntry.accreditation_since = parseInt(ym[1]);
      }

      i++;
      continue;
    }

    // Address line
    if (currentEntry && (line.includes("地址/Address:") || line.includes("地址/Address："))) {
      const addr = line.replace(/.*地址\/Address:\s*/, "").trim();
      addressLines.push(addr);
      i++;
      // Continuation lines for address (indented, no new entry number)
      while (i < lines.length) {
        const next = lines[i].trim();
        if (
          !next ||
          next.match(/^\d{1,3}\s{2,}/) ||
          next.includes("截至") ||
          next.includes("As of") ||
          next.includes("Enterprise Name") ||
          next.includes("地址/Address:") ||
          next.includes("Limited") ||
          next.includes("Ltd") ||
          next.includes("Engineering") ||
          next.includes("Company") ||
          next.includes("Construction") ||
          next.includes("上述")
        ) {
          break;
        }
        // Likely address continuation
        if (next.length < 80 && !next.includes("認證") && !next.includes("Re-cert")) {
          addressLines.push(next);
          i++;
        } else {
          break;
        }
      }
      continue;
    }

    // Pick up straggler data on unlabeled lines
    if (currentEntry) {
      if (!rawEffective && (line.includes("認證進行中") || line.includes("Re-certification"))) {
        rawEffective = "認證進行中";
      }
      if (!currentEntry.accreditation_since) {
        const ym = line.match(/\b(20[12]\d)\s*$/);
        if (ym) currentEntry.accreditation_since = parseInt(ym[1]);
      }
      if (!rawPhone) {
        const pm = line.match(/(\d{4}\s?\d{4})/);
        if (pm) rawPhone = pm[1];
      }
      if (!rawEffective) {
        const dm = line.match(/(\d{1,2}\.\d{1,2}\.\d{4}\s*[–-]\s*\d{1,2}\.\d{1,2}\.\d{4})/);
        if (dm) rawEffective = dm[1];
      }
    }

    i++;
  }

  flushEntry();
  return contractors;
}

// Run extraction
const allContractors: Contractor[] = [];

for (const { file, trade } of PDFS) {
  const path = `${PDF_DIR}/${file}`;
  console.log(`Extracting: ${file} (${trade})`);
  const entries = extractFromPdf(path, trade);
  console.log(`  → ${entries.length} entries`);
  allContractors.push(...entries);
}

console.log(`\nTotal: ${allContractors.length} contractors`);

// Deduplicate by (enterprise_name_en + trade) — same company can appear in multiple trades
const seen = new Set<string>();
const deduped = allContractors.filter((c) => {
  const key = `${c.enterprise_name_en.toLowerCase()}|${c.trade}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

if (deduped.length < allContractors.length) {
  console.log(`Deduped: ${allContractors.length} → ${deduped.length}`);
}

const output: ContractorsFile = {
  version: "1.0.0",
  extracted_at: new Date().toISOString(),
  source_pdfs: PDFS.map((p) => p.file),
  contractors: deduped,
};

writeFileSync(OUT, JSON.stringify(output, null, 2), "utf-8");
console.log(`\nWritten to ${OUT}`);

// Print summary
const byTrade = new Map<string, number>();
const byTier = new Map<string, number>();
for (const c of deduped) {
  byTrade.set(c.trade, (byTrade.get(c.trade) || 0) + 1);
  byTier.set(c.safety_tier, (byTier.get(c.safety_tier) || 0) + 1);
}
console.log("\nBy trade:", Object.fromEntries(byTrade));
console.log("By tier:", Object.fromEntries(byTier));

const noDistrict = deduped.filter((c) => !c.district);
if (noDistrict.length) {
  console.log(`\n⚠ ${noDistrict.length} entries with no district:`);
  for (const c of noDistrict) {
    console.log(`  - ${c.enterprise_name_en}: ${c.address}`);
  }
}
