import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const sourceUrl = "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/calls-for-proposals";
const outputPath = resolve("data/official-funding-snapshot.json");
const response = await fetch(sourceUrl, {
  headers: { "User-Agent": "FundwiseOfficialSourceMonitor/1.0 (+https://github.com/zain-ramzan)" },
});

if (!response.ok) throw new Error(`Official source returned HTTP ${response.status}`);
const text = await response.text();
const identifiers = [...new Set([...text.matchAll(/\b(?:HORIZON|DIGITAL|CERV|EU4H|LIFE|SMP|AMIF|ISF|BMVI)-[A-Z0-9-]{4,}\b/g)].map(match => match[0]))].sort();
if (identifiers.length === 0) throw new Error("No official opportunity identifiers were found; refusing to overwrite the last verified snapshot.");

let previous = { identifiers: [] };
try { previous = JSON.parse(await readFile(outputPath, "utf8")); } catch { /* First verified snapshot. */ }
const additions = identifiers.filter(identifier => !previous.identifiers.includes(identifier));
const removals = previous.identifiers.filter(identifier => !identifiers.includes(identifier));
const snapshot = {
  sourceUrl,
  checkedAt: new Date().toISOString(),
  sourcePolicy: "Identifiers are captured verbatim from the European Commission Funding & Tenders Portal. This snapshot does not infer titles, deadlines, eligibility, or budget fields.",
  identifierCount: identifiers.length,
  additions,
  removals,
  identifiers,
};
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Verified ${identifiers.length} official identifiers; ${additions.length} new and ${removals.length} removed.`);
