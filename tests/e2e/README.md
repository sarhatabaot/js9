# JS9 end-to-end tests (Playwright)

Headless browser tests that drive the JS9 public API, run with
[`@playwright/test`](https://playwright.dev). They replace the hand-rolled
`ci-smoke` node scripts and port the *client-side* portion of the legacy
`tests/smoke.py` (pyjs9) suite — no Python, no helper.

## Run

```bash
npm test            # or: npx playwright test
```

A static file server (`support/serve.mjs`) serves the repo root; specs load a
JS9 harness page (`support/harness.html`, or `harness-min.html` for the
minified bundle) and call the API via `support/js9.mjs`.

The minified harness needs current `*.min.js`; build them first:

```bash
npm run build:min && npm test
```

## Files
- `smoke.spec.mjs` — renders a FITS image in both the source and esbuild-minified bundles.
- `api.spec.mjs` — colormap/scale/zoom/pan/WCS/regions/shapes/etc. round-trips.
- `support/` — static server, harness pages, and JS9 load/eval helpers.

## Scope and what is intentionally excluded

These tests use the **only committed image fixture**, `build/i800400.fits.gz`
(800x400). The original `smoke.py` also exercises areas that need resources not
in this repo, so they are **not ported here**:

- **External data set** — `smoke.py` loads ~15 FITS files and region/catalog/
  colormap fixtures under `data/` (gitignored, not present). Tests with
  hard-coded expectations tied to those files (exact `netCounts`, specific pan
  centers, blend/mosaic/cube/multi-extension/mask flows) require that data.
- **Server-side + network** — `RunAnalysis`, `LoadProxy` (live XMM archive),
  and `CountsInRegions -j` need the Node helper, analysis wrappers, and
  network access.

### Enabling the excluded tests later
Provide the JS9 `data/` fixture set at the repo root and add specs that load
those files (the API calls translate 1:1 — `j.Method(args)` in pyjs9 becomes
`JS9.Method(args)` in `page.evaluate`). Server-side tests additionally need the
helper running; that is a separate effort from this client-side suite.
