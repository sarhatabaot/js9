# `src/js9/` — the JS9 core library, split into fragments

This directory holds the JS9 browser core, formerly a single 28,560-line
`src/js9.js`. It was split **purely for navigability** — the runtime is
unchanged.

## How it works

The files are **raw byte slices** of the original monolith, named with a `NN-`
prefix that fixes their load order. The build
([`scripts/build.mjs`](../../scripts/build.mjs) → `assembleCore()`)
concatenates them in filename order into `_site/js9.js`:

```
sort(NN-*.js)  →  Buffer.concat  →  _site/js9.js   (then esbuild → js9.min.js)
```

Because the fragments are exact byte slices concatenated in order, the assembled
`_site/js9.js` is **byte-identical** to the pre-split file. That is the safety
invariant of the split.

## Invariants to preserve

- **One shared closure.** The whole library is a single IIFE:
  `00-header.js` opens `var JS9 = (function(){ … `, `19-public-api.js` closes it
  with `return JS9; }())`, and `20-bootstrap.js` is the `$(document).ready`
  bootstrap that runs *after*. Every fragment runs in that one closure and shares
  the private `JS9` const and helpers — so **the fragments are not independently
  parseable or reorderable.** Don't `node --check` a fragment; check the
  assembled `_site/js9.js`.
- **Load order matters** for the code that executes at IIFE-evaluation time
  (browser detection in `01-opts.js`, polyfills in `17-utils.js`, fabric setup
  in `08-fabric.js`, the bootstrap in `20-bootstrap.js`). Keep the `NN-` order.
- Editing logic is fine; just edit the fragment that owns that section.

## Layout

| File | Contents |
|------|----------|
| `00-header.js` | prologue, IIFE open, module constants (`JS9.VERSION`, sizes, …) |
| `01-opts.js` | `JS9.globalOpts` + all `*Opts` config, browser detection, stub objects |
| `02-image.js` | `JS9.Image` + its ~111 prototype methods (FITS model, scaling, WCS) |
| `03-colormap.js` | `JS9.Colormap` |
| `04-display.js` | `JS9.Display` |
| `05-command.js` | `JS9.Command` |
| `06-helper.js` | `JS9.Helper` (node-helper client) |
| `07-webworker.js` | `JS9.WebWorker` |
| `08-fabric.js` | fabric.js setup + `JS9.Fabric` (canvas graphics / shape layers) |
| `09-mousetouch.js` | `JS9.MouseTouch` |
| `10-regions.js` | `JS9.Regions` (shapes, parsing, serialization, config forms) |
| `11-plot.js` | `JS9.Plot` |
| `12-catalogs.js` | `JS9.Catalogs` |
| `13-crosshair.js` | `JS9.Crosshair` |
| `14-grid.js` | `JS9.Grid` |
| `15-dysel.js` | `JS9.Dysel` (display selection) |
| `16-titlebar.js` | `JS9.Titlebar` |
| `17-utils.js` | polyfills + free `JS9.*` utility functions (math, WCS, path, color, FITS I/O) |
| `18-events.js` | mouse/keyboard/drag callbacks + `JS9.initCommands` |
| `19-public-api.js` | the public API (`mkPublic` wrappers), `JS9.init`, **IIFE close** |
| `20-bootstrap.js` | `$(document).ready` bootstrap (runs after the IIFE) |

The large files (`02-image.js`, `08-fabric.js`, `10-regions.js`, `17-utils.js`)
are natural candidates for further sub-splitting later.
