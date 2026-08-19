# Fundwise.eu

Fundwise.eu is a public, source-first European funding discovery platform. It helps visitors search the opportunity catalogue, inspect official records, and save verified deadlines to Google Calendar, Microsoft Outlook, or a downloadable calendar file.

## Daily official-source refresh

The repository includes a scheduled GitHub Actions workflow that checks the public European Commission Funding & Tenders Portal every morning and updates `data/official-funding-snapshot.json` when verified opportunity identifiers change. The workflow only records identifiers found verbatim at the official source. It intentionally does not invent titles, budgets, deadlines, eligibility, or application content.

> The public application catalogue remains sourced from the platform database. A structured, documented official source adapter is required before a background job can safely publish new opportunity detail records into the live catalogue.

## Local development

```bash
pnpm install
pnpm dev
```

Run the automated checks with `pnpm check`, `pnpm test`, and `pnpm build`.
