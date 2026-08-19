# Official Source Research Note

On 19 August 2026, the European Commission Funding & Tenders Portal calls catalogue was checked as the authority for the initial platform records. The public catalogue exposed official call identifiers, titles, programme labels, publication/opening dates, deadlines, and submission status for forthcoming Horizon Europe opportunities.

Individual topic-detail URLs were also checked. The public page shell loaded, but the portal did not expose the dynamic topic fields to the unauthenticated extraction session. For that reason, the initial import retains direct official topic URLs, titles, dates, programme labels, and clear provenance. Budget, full scope, and formal eligibility remain unpopulated until a structured official endpoint or verified detail-document adapter is connected.

The product must not infer those unavailable fields. The linked European Commission record and its official call documentation remain authoritative.

## Daily workflow validation

The official portal’s public calls and API-support pages were rechecked on 19 August 2026. Their unauthenticated rendered shells did not expose a documented calls-search endpoint or structured opportunity fields. The repository workflow therefore must fail safely when it cannot verify identifier data and must not overwrite a previous snapshot, fabricate opportunity fields, or directly publish unverified records to the public catalogue.
