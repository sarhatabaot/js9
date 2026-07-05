import { test, expect } from "@playwright/test";
import { openHarness, loadFits, js9 } from "./support/js9.mjs";

// Characterization tests for the region config dialog. JS9.Regions.initConfigForm
// builds/populates the form from a region; JS9.Regions.processConfigForm applies
// the edited form back to the region. These functions are large (~680 / ~570
// lines) and were previously untested (the headless suite never opened the
// dialog). These specs pin the current behavior so those two functions can be
// decomposed safely.
//
// The dialog loads _site/params/regionsconfig.html, so INSTALLDIR must point at
// _site (the source harness leaves it empty).

test.beforeEach(async ({ page }) => {
  await openHarness(page, "source");
  await loadFits(page, undefined, { scale: "linear", colormap: "grey" });
  await js9(page, (JS9) => { JS9.INSTALLDIR = "/_site/"; });
});

// Open the single-shape config form for the first region of the given shape,
// and wait for the form DOM to be populated.
async function openSingleForm(page, shape) {
  await js9(
    page,
    (JS9, s) => {
      const im = JS9.GetImage();
      const obj = im.layers.regions.canvas
        .getObjects()
        .find((o) => o.params && o.params.shape === s);
      im.displayRegionsForm(obj);
    },
    shape
  );
  await page.waitForSelector(".regionsConfigForm", { timeout: 15000 });
  // xpos is populated by initConfigForm; wait until it is set
  await page.waitForFunction(() => {
    const el = document.querySelector(".regionsConfigForm [name='xpos']");
    return el && el.value !== "";
  }, { timeout: 15000 });
}

const val = (page, name) =>
  page.evaluate((n) => {
    const el = document.querySelector(`.regionsConfigForm [name="${n}"]`);
    return el ? el.value : null;
  }, name);

test("config form is populated from a circle region", async ({ page }) => {
  await js9(page, (JS9) =>
    JS9.AddRegions("circle(400,200,25)", { tags: "src", color: "#ff0000" })
  );
  await openSingleForm(page, "circle");

  expect(await val(page, "xpos")).toBe("400.0");
  expect(await val(page, "ypos")).toBe("200.0");
  expect(await val(page, "radius")).toBe("25");
  expect(await val(page, "angle")).toBe("0");
  expect(await val(page, "color")).toBe("#ff0000");
  expect(await val(page, "tags")).toBe("src");
  expect(await val(page, "wcssys")).toBe("physical");
  expect(await val(page, "regstr")).toContain("circle(400.00,200.00,25.00)");
});

test("config form is populated from a box region (width/height/angle)", async ({ page }) => {
  await js9(page, (JS9) =>
    JS9.AddRegions("box(350,180,60,40,30)", { tags: "reg1" })
  );
  await openSingleForm(page, "box");

  expect(await val(page, "xpos")).toBe("350.0");
  expect(await val(page, "ypos")).toBe("180.0");
  expect(await val(page, "width")).toBe("60");
  expect(await val(page, "height")).toBe("40");
  expect(await val(page, "angle")).toBe("30");
  expect(await val(page, "tags")).toBe("reg1");
  expect(await val(page, "regstr")).toContain("box(350.00,180.00,60.00,40.00,30.0000)");
});

test("editing radius in the form and applying updates the region", async ({ page }) => {
  await js9(page, (JS9) => JS9.AddRegions("circle(400,200,25)", { tags: "src" }));
  await openSingleForm(page, "circle");

  await page.fill(".regionsConfigForm [name='radius']", "40");
  await page.click(".regionsConfigForm [name='Apply']");

  await expect
    .poll(async () =>
      js9(page, (JS9) => Math.round(JS9.GetRegions("all")[0].radius))
    )
    .toBe(40);

  const reg = await js9(page, (JS9) => {
    const r = JS9.GetRegions("all")[0];
    return { shape: r.shape, x: Math.round(r.x), y: Math.round(r.y) };
  });
  expect(reg.shape).toBe("circle");
  expect(reg.x).toBe(400);
  expect(reg.y).toBe(200);
});

test("editing position/color/tags in the form and applying updates the region", async ({ page }) => {
  await js9(page, (JS9) =>
    JS9.AddRegions("circle(400,200,25)", { tags: "src", color: "#00ff00" })
  );
  await openSingleForm(page, "circle");

  await page.fill(".regionsConfigForm [name='xpos']", "410");
  await page.fill(".regionsConfigForm [name='ypos']", "220");
  await page.fill(".regionsConfigForm [name='tags']", "src,edited");
  await page.click(".regionsConfigForm [name='Apply']");

  await expect
    .poll(async () =>
      js9(page, (JS9) => Math.round(JS9.GetRegions("all")[0].x))
    )
    .toBe(410);

  const reg = await js9(page, (JS9) => {
    const r = JS9.GetRegions("all")[0];
    return { y: Math.round(r.y), tags: (r.tags || []).join(",") };
  });
  expect(reg.y).toBe(220);
  expect(reg.tags).toContain("edited");
});

test("multi-select config form opens for all regions", async ({ page }) => {
  await js9(page, (JS9) => {
    JS9.AddRegions("circle(300,200,20)", { tags: "a" });
    JS9.AddRegions("box(350,200,40,30)", { tags: "b" });
    JS9.GetImage().displayRegionsForm(); // no shape -> multi
  });
  await page.waitForSelector(".regionsConfigForm", { timeout: 15000 });
  // multi form carries the multi-select controls (selectfilter/selectshape)
  const hasMulti = await page.evaluate(
    () => !!document.querySelector(".regionsConfigForm [name='selectshape']")
  );
  expect(hasMulti).toBe(true);
});
