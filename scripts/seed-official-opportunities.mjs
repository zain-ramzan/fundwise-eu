import "dotenv/config";
import { upsertOfficialOpportunity } from "../server/db/funding.ts";

const portalBase = "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details";
const sourceName = "European Commission — Funding & Tenders Portal";
const lastCheckedNote = "The authoritative eligibility, scope, budget and submission conditions remain on the linked official call page.";

const listings = [
  ["HORIZON-EIE-2027-01-CONNECT-01", "Startup Europe", "2027-06-01T00:00:00.000Z", "2027-09-15T17:00:00.000Z", ["Innovation ecosystems", "Startups"]],
  ["HORIZON-HLTH-2027-03-TOOL-08", "Towards Artificial General Intelligence (AGI) for healthcare", "2027-06-03T00:00:00.000Z", "2027-09-22T17:00:00.000Z", ["Health", "Artificial intelligence"]],
  ["HORIZON-MSCA-2027-DN-01-01", "MSCA Doctoral Networks 2027", "2027-05-26T00:00:00.000Z", "2027-11-23T17:00:00.000Z", ["Research & innovation", "Skills & education"]],
  ["HORIZON-CL5-2027-07-D3-16", "Industrial processes and equipment for innovative, reliable and scalable tandem technologies (EUPI-PV Partnership)", "2027-08-04T00:00:00.000Z", "2027-12-01T17:00:00.000Z", ["Energy & climate", "Industrial innovation"]],
  ["HORIZON-CL5-2027-07-D3-27", "Integrated Approaches for Retrofitting Infrastructures with Innovative Energy Storage Technologies", "2027-08-04T00:00:00.000Z", "2027-12-01T17:00:00.000Z", ["Energy & climate", "Infrastructure"]],
  ["HORIZON-CL5-2027-07-D3-11", "Demonstration of hydropower technologies for efficient and forward-looking refurbishment of existing hydropower plants", "2027-08-04T00:00:00.000Z", "2027-12-01T17:00:00.000Z", ["Energy & climate", "Clean technology"]],
  ["HORIZON-CL5-2027-06-D6-12", "Support for dissemination events in the field of Transport Research", "2027-06-03T00:00:00.000Z", "2027-10-07T17:00:00.000Z", ["Mobility", "Research & innovation"]],
  ["HORIZON-CL2-2027-01-DEMOCRACY-06", "Identifying user-focused solutions to support news media freedom", "2027-05-13T00:00:00.000Z", "2027-09-23T17:00:00.000Z", ["Democracy", "Media"]],
  ["HORIZON-CL2-2027-01-TRANSFO-05", "The effective use of artificial intelligence in learning environments in pre-primary and primary education", "2027-05-13T00:00:00.000Z", "2027-09-23T17:00:00.000Z", ["Skills & education", "Artificial intelligence"]],
  ["HORIZON-CL2-2027-01-HERITAGE-06", "Future-proofing sustainable cultural tourism", "2027-05-13T00:00:00.000Z", "2027-09-23T17:00:00.000Z", ["Culture & heritage", "Sustainability"]],
  ["HORIZON-CL2-2027-01-DEMOCRACY-04", "Addressing the impact of artificial intelligence, cyberviolence, and deepfakes on equality, democracy and inclusive societies", "2027-05-13T00:00:00.000Z", "2027-09-23T17:00:00.000Z", ["Democracy", "Artificial intelligence"]],
  ["HORIZON-CL2-2027-01-TRANSFO-08", "Scaling and deploying innovations in migration management", "2027-05-13T00:00:00.000Z", "2027-09-23T17:00:00.000Z", ["Public sector", "Migration"]],
];

for (const [externalId, title, openingDate, deadlineDate, sectors] of listings) {
  await upsertOfficialOpportunity({
    externalId,
    sourceName,
    sourceUrl: `${portalBase}/${externalId}`,
    applicationUrl: `${portalBase}/${externalId}`,
    title,
    slug: externalId.toLowerCase(),
    summary: `A forthcoming Horizon Europe topic listed by the European Commission under the EU Funding & Tenders Portal. ${lastCheckedNote}`,
    description: `This record is sourced from the official EU Funding & Tenders Portal listing for ${externalId}. The official topic page and its linked documentation provide the complete scope, expected outcomes, submission conditions and funding details.`,
    eligibilityText: `Eligibility is determined exclusively by the official call documents for ${externalId}. This platform provides an indicative organisational fit assessment and does not determine legal or formal eligibility.`,
    programme: "Horizon Europe (HORIZON)",
    fund: "Horizon Europe",
    opportunityType: "call_for_proposals",
    statusComputed: "upcoming",
    countries: ["EU-wide"],
    sectors,
    applicantTypes: ["See official documentation"],
    documents: [],
    deadlineAt: new Date(deadlineDate),
    deadlineText: `Deadline: ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(deadlineDate))}`,
    publishedAt: new Date(openingDate),
    totalBudgetEur: null,
    minGrantEur: null,
    maxGrantEur: null,
    fundingRateMin: null,
    fundingRateMax: null,
    sourceConfidence: "1.000",
    extractionConfidence: "1.000",
    isPublished: true,
  });
}

console.log(`Imported ${listings.length} official European Commission opportunity listings.`);
