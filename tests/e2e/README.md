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
- `api.spec.mjs` — colormap/scale/zoom/pan/WCS/flip/rotate/regions/shapes/GetValPos/etc. round-trips.
- `regions.spec.mjs` — region boolean-selection parser, grouping, save/load round-trip, `LoadRegions` from a file.
- `support/` — static server, harness pages, and JS9 load/eval helpers.

## Coverage vs. the legacy `tests/` suite

Mapping of the old tests to their status here. "Ported" = equivalent
assertions run in this suite; "data-gated" / "integration" = intentionally out
of scope (see below).

| Legacy test | What it exercises | Status |
|---|---|---|
| `smoke.py` pix/header/wcs/zoom/pan | conversions, header, WCS sys/units | ✅ ported (`api.spec`) |
| `smoke.py` regions/shapes | add/get/change/remove, shape layers, show/hide | ✅ ported (`api.spec`) |
| `smoke.py` blur/filter/grid/resize/separate | image ops & display ops | ✅ ported (`api.spec`) |
| `smoke.py` flipRotate (SetFlip/Rot90/Rotate) | orientation transforms | ✅ ported (`api.spec`) |
| `smoke.py` colormap (Add/GetParam/SetParam) + GetValPos | colormaps, pixel value | ✅ ported (`api.spec`) |
| `smoke.py` dispCoordsTest (`LoadRegions` file) | load `dcoords.reg` | ✅ ported (`regions.spec`) |
| `smoke2.py` boolean select + grouping | `regSelect` parser, Group/Ungroup/ListGroups | ✅ ported (`regions.spec`) |
| `smoke3.py` region save/load | region text round-trip | ✅ ported (`regions.spec`, serialization form) |
| `smoke.py` bin/rotate(reproject)/cube/ext/mosaic/mask/blend/catalog/loadWindow/fitsio | multi-file / reproject / multi-extension | ⛔ data-gated |
| `smoke.py` counts/analysis/xmmProxy | server-side & network | ⛔ integration (helper) |
| `test0.html`–`test7.html`, `js9debug.html`, `vela.html` | manual/visual pages | ⛔ mostly data-gated; functionally overlaps `api.spec`/`regions.spec` |
| `test5.html` region-position-under-zoom | display-coord preservation | ⚠️ `LoadRegions` ported; the visual pan/zoom pixel-tracking assertion is not |
| `ebands`, `testwait`, `threeways/`, `testhelper.html`, `js9memleak.html`, `ecnts.js` | `js9` CLI, helper, Electron app, leak/hostfs | ⛔ integration (CLI/helper/app stack) |

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
