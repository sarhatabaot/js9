import { test, expect } from "@playwright/test";
import { openHarness, loadFits, js9 } from "./support/js9.mjs";

for (const variant of ["source", "min", "allinone"]) {
  test(`load notice: sectioned FITS load is explained (${variant} bundle)`, async ({ page }) => {
    const logs = [];
    page.on("console", (msg) => {
      if (msg.type() === "log") {
        logs.push(msg.text());
      }
    });

    await openHarness(page, variant);
    await loadFits(page, undefined, { xdim: 200, ydim: 100 });

    await expect
      .poll(async () => js9(page, (JS9) => JS9.GetImageData(false)))
      .toMatchObject({
        width: 200,
        height: 100,
        fwidth: 800,
        fheight: 400,
      });

    await expect(page.getByText("Section loaded: 200x100 of 800x400")).toBeVisible();

    await expect
      .poll(() =>
        logs.find((line) => line.includes("JS9 load notice") && line.includes("loaded 200x100 of 800x400"))
      )
      .toContain("section");
  });
}
