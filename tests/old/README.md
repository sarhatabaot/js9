# Legacy tests (superseded)

These are the original `pyjs9`-based smoke tests. They drive JS9 over the Node
helper from Python, and require the `js9` CLI, a running helper, `pyjs9` +
`astropy`, and the external `data/` fixture set (never included in this repo).

They have been **replaced** by the browser-based Playwright suite in
[`../e2e/`](../e2e/), which runs headless with no Python and no helper. The
client-side coverage of these files is ported there — see
[`../e2e/README.md`](../e2e/README.md) for the old→new coverage matrix.

Kept here as reference, because they remain the source of truth for the parts
not yet ported:

| File | Ported to e2e? | Remaining value |
|------|----------------|-----------------|
| `smoke.py` | client-side parts ✅ | reference for data-gated tests (bin/cube/ext/mosaic/mask/blend/…) and server-side tests (analysis/proxy/counts) |
| `smoke2.py` | ✅ (region boolean parser + grouping) | — |
| `smoke3.py` | ✅ (region serialization round-trip) | reference for on-disk `.reg` diff via the helper |
| `smokesubs.py` | n/a | shared pyjs9 helpers for the above |
| `smoke.html` | ✅ (see `../e2e/support/harness.html`) | manual page the pyjs9 suite drove |

The `make smoke` / `smoke2` / `smoke3` targets still invoke these (paths updated
to `tests/old/`). To port the remaining tests, add specs under `../e2e/` — the
API calls translate 1:1 (`j.Method(args)` → `JS9.Method(args)` in
`page.evaluate`) — once the `data/` fixtures are available.
