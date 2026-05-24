# Oduzz Curated Knowledge Base

This folder is the controlled technical knowledge source for the engineering assistant.

Use it for:
- inverter specs
- battery specs
- panel datasheets
- cable charts
- protection component specs
- Oduzz service, pricing, and policy records

Notes:
- Only curated Oduzz-managed files should live here.
- Files ending in `.template.json` are ignored by the ingestion script.
- Put verified live records in regular `.json` files, then run `npm run ingest-knowledge`.

Suggested order:
1. `inverters/`
2. `batteries/`
3. `panels/`
4. `cables/`
5. `protection/`
6. `business/`
7. `faq/`
