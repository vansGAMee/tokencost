# TokenCost

Production-ready, privacy-first calculator for translating source code into AI tokens and input cost. It follows the supplied desktop and mobile reference layouts while keeping the implementation intentionally light enough for Vercel's free tier.

## Product behavior

- Counts OpenAI-compatible encodings exactly in the browser and labels provider-specific approximations honestly.
- Detects a likely model provider from pasted imports, while leaving the final model under user control.
- Uses exact decimal arithmetic for prices and exposes current official source links.
- Supports TypeScript, JavaScript, and C++ syntax modes with a restrained editorial highlight palette.
- Creates compact `/s/{id}` links backed by private Vercel Blob records that expire after 30 days.
- Exports a self-contained 1200×800 PNG cost receipt entirely in the browser.
- Provides a searchable rates market, provider filters, currency conversion, model deep links, source freshness, and an honest price-history empty state.
- Supports keyboard navigation, reduced motion, mobile safe areas, and responsive layouts from phone to wide desktop.

## Run and verify

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

## Vercel free-tier architecture

The production project is linked to the private `tokencost-shares` Vercel Blob store. Vercel injects `BLOB_READ_WRITE_TOKEN`; never commit it.

- Tokenization, PNG rendering, filtering, sorting, and cost calculation happen on the client.
- `/api/rates` is a static normalized snapshot with a one-day CDN cache and seven-day stale-while-revalidate window.
- `/api/fx/[quote]` calls Frankfurter only for non-USD display currencies and caches successful conversions for six hours.
- `/api/share` validates a maximum 50 KB payload and stores it under an opaque eight-character id. Blob URLs and credentials are never exposed to visitors.
- The legacy URL-fragment reader remains available at `/s/view`, but all new shares use compact links.

## Pricing maintenance

Model records live in `src/data/model-rates.ts`. Every entry stores the official source URL, check time, tokenizer method, and status. Update a rate only after verifying the linked provider page; then add the verified change to the ledger instead of inventing historical data. The product currently starts its audit history on 8 September 2026.

Provider prices can differ by batch mode, cache writes, regional endpoints, long-context tiers, and off-peak windows. The calculator deliberately shows standard input pricing and calls out important exceptions in each model's notes.
