import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ContractorsFileSchema } from "./schema.js";

const DATA_PATH = resolve(import.meta.dirname, "../data/contractors.json");

const raw = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
const result = ContractorsFileSchema.safeParse(raw);

if (!result.success) {
  console.error("Validation FAILED:");
  for (const issue of result.error.issues) {
    console.error(`  ${issue.path.join(".")} — ${issue.message}`);
  }
  process.exit(1);
}

const data = result.data;
console.log(`Validation PASSED`);
console.log(`  Version: ${data.version}`);
console.log(`  Extracted: ${data.extracted_at}`);
console.log(`  Total contractors: ${data.contractors.length}`);

const byTrade = new Map<string, number>();
const byTier = new Map<string, number>();
let missingPhone = 0;
let missingDistrict = 0;

for (const c of data.contractors) {
  byTrade.set(c.trade, (byTrade.get(c.trade) || 0) + 1);
  byTier.set(c.safety_tier, (byTier.get(c.safety_tier) || 0) + 1);
  if (c.telephone.length === 0) missingPhone++;
  if (!c.district) missingDistrict++;
}

console.log("\n  By trade:");
for (const [trade, count] of byTrade) {
  console.log(`    ${trade}: ${count}`);
}

console.log("\n  By tier:");
for (const [tier, count] of byTier) {
  console.log(`    ${tier}: ${count}`);
}

if (missingPhone) console.log(`\n  ⚠ ${missingPhone} entries missing phone`);
if (missingDistrict) console.log(`  ⚠ ${missingDistrict} entries missing district`);
