import { test, expect } from "@playwright/test";
import { openHarness, loadFits, js9 } from "./support/js9.mjs";

// Basic render smoke: JS9 loads its wasm module and displays a FITS image.
// Runs against both the source bundle and the esbuild-minified bundle so the
// minifier output is exercised in CI (replaces the old ci-smoke scripts).
for (const variant of ["source", "min", "allinone"]) {
  test(`smoke: renders a FITS image (${variant} bundle)`, async ({ page }) => {
    await openHarness(page, variant);
    await loadFits(page, undefined, { scale: "log", colormap: "viridis" });
    const d = await js9(page, (JS9) => JS9.GetImageData(false));
    expect(d.width).toBe(800);
    expect(d.height).toBe(400);
    expect(d.bitpix).toBe(32);
  });
}
