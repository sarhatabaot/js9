# Phase 2 — vendored dependency audit

Inventory of the **33 vendored `js/` files the build actually uses** (the
`JSFILES` list in `Makefile.in`; the other ~70 files in `js/` are alternate
versions or unused). Goal: decide which can move to `package.json` deps and
which must stay vendored.

**Constraint (tooling-only modernization):** where a file moves to npm, install
the **same pinned version** that is vendored today. Version *upgrades* are a
separate, opt-in decision — they change runtime behavior and are out of scope
for a tooling refresh.

## A. Clean upstream — safe to move to npm at the pinned version
Evidence: unmodified upstream headers; `fabric.min.js` verified byte-identical
to the pinned `fabric-v5.2.1.min.js`.

| vendored file | npm package | pin to |
|---|---|---|
| jquery.min.js | jquery | 3.5.0 |
| jquery-ui.min.js | jquery-ui | 1.12.1 |
| jquery.contextMenu.min.js | jquery-contextmenu | 2.8.0 |
| jquery.flot.min.js + navigate/resize/selection/errorbars | flot | 0.8.3 |
| jquery.flot.axislabels.js | flot-axislabels | (match header) |
| fabric.min.js | fabric | 5.2.1 |
| pako_inflate.min.js | pako | 0.2.3 *(ancient; pako is 2.x — pin exact)* |
| FileSaver.min.js | file-saver | (match) |
| canvas-toBlob.js | canvas-toblob | (match) |
| arrive.min.js | arrive | 2.4.1 |
| spin.js | spin.js | (match) |
| spectrum.min.js | spectrum-colorpicker | 1.8.0 |
| tinycolor.min.js | tinycolor2 | 1.4.1 |
| jquery.mark.es6.min.js | mark.js | 9.0.0 |
| jquery.ui.touch-punch.js | jquery-ui-touch-punch | 0.2.3 |
| ElementQueries.js + ResizeSensor.js | css-element-queries | (match) |
| jquery.caret.min.js | jquery.caret (verify pkg) | (match) |

## B. Patched / old / niche — KEEP vendored (verify each before any swap)
Not cleanly replaceable at a matching version, or locally modified.

| file | reason to keep vendored |
|---|---|
| dhtmlwindow.min.js + dhtmlwindow_blurb.js | **patched** — `document.write` holder removed (js9.js documents this) |
| tabcontent.js | Dynamic Drive v2.0; not a maintained npm package |
| jquery.doubletap.min.js | 2010 lib; likely patched |
| sprintf.min.js | old php.js-era port; maps loosely to `sprintf-js` but not 1:1 |
| imagefilters.js | MSDN sample origin; no clean npm equivalent |

## C. JS9-original / JS9-modified — DO NOT touch (not dependencies)
Evidence: JS9 identifiers / Eric Mandel authorship in the source.

| file | evidence |
|---|---|
| winmod.js | JS9-specific electron window shim |
| js9inline.js | defines `JS9Inline` |
| regSelect.js | references `JS9.tmp.regSelect` |
| flot-zoom.js | `/*globals $, JS9 */`, custom flot zoom plugin |
| gaussblur.js | header: "modified by: Eric Mandel (2/16/2016)" |

## Key implication for sequencing
Moving Category A to `node_modules` only pays off once a **bundler consumes
them** — the current shell-concat build (`mkallinone`, hand-listed `JSFILES`)
would just get new paths. And the real risk in this codebase is that all these
libs attach to **global `$`/`window` and depend on concatenation order**, which
a naive Vite/rollup setup can reorder or tree-shake incorrectly.

**Recommendation:** de-risk with a Phase 3 Vite proof-of-concept *first* —
prove Vite can reproduce `js9support.min.js` from the current `js/` files
(global ordering intact, Java/Closure removed) — *then* do the Category A npm
swap on a proven build. Phase 2 becomes mechanical once the bundler works.
