# Nimilista

Nimilista is a Finnish-language name comparison app using the public search results from the [Digital and Population Data Services Agency's Name Service](https://nimipalvelu.dvv.fi/etunimihaku).

## Features

- Search and compare up to eight Finnish forenames
- Total, gender split, peak decade and decade-by-decade chart
- Shareable comparison URLs
- Privacy-suppressed values are preserved as “alle 5”
- Cloudflare Pages Function proxies and parses DVV results server-side

## Local development

```sh
npm install
npm run build
npm run preview
```

The full local Pages runtime is then available at the URL printed by Wrangler. `npm run dev` starts the Vite frontend only and does not include the API Function.

## Verification

```sh
npm test
npm run typecheck
npm run build
```

## Deployment

The production branch is `main`. Cloudflare Pages builds with `npm run build`, publishes `dist`, and includes the `functions/` directory automatically.

Data remains owned and served by DVV. This project is an unofficial interface and does not bypass DVV's privacy thresholds.
