import { createHash } from "node:crypto";
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
const contentHash = createHash("sha256").update(text).digest("hex");

let previous = { identifiers: [] };
try { previous = JSON.parse(await readFile(outputPath, "utf8")); } catch { /* First verified snapshot. */ }
const hasStructuredIdentifiers = identifiers.length > 0;
const additions = hasStructuredIdentifiers ? identifiers.filter(identifier => !previous.identifiers.includes(identifier)) : [];
const removals = hasStructuredIdentifiers ? previous.identifiers.filter(identifier => !identifiers.includes(identifier)) : [];
const snapshot = {
  sourceUrl,
  checkedAt: new Date().toISOString(),
  sourcePolicy: "Identifiers are captured verbatim from the European Commission Funding & Tenders Portal. This snapshot does not infer titles, deadlines, eligibility, or budget fields. When the portal withholds structured records, the last verified identifier set is retained.",
  sourceAvailability: hasStructuredIdentifiers ? "structured identifiers verified" : "public source available but structured identifiers were not exposed",
  contentHash,
  identifierCount: hasStructuredIdentifiers ? identifiers.length : previous.identifiers.length,
  additions,
  removals,
  identifiers: hasStructuredIdentifiers ? identifiers : previous.identifiers,
};
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(hasStructuredIdentifiers
  ? `Verified ${identifiers.length} official identifiers; ${additions.length} new and ${removals.length} removed.`
  : "Official source was available but did not expose structured identifiers; retained the last verified snapshot without publishing opportunity changes.");
