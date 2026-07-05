import { test, expect } from "@playwright/test";
import { openHarness, loadFits, js9 } from "./support/js9.mjs";

// Client-side JS9 public-API tests, ported from tests/smoke.py.
//
// Scope: only the parts of smoke.py that run against the committed tiny FITS
// (build/i800400.fits.gz) without the external data/ fixture set or the Node
// helper. Data-dependent tests (exact counts, blend/mosaic/cube/mask on
// specific multi-extension files) and server-side tests (RunAnalysis,
// LoadProxy, CountsInRegions) are intentionally excluded — see tests/e2e/README.md.

test.beforeEach(async ({ page }) => {
  await openHarness(page, "source");
  await loadFits(page, undefined, { scale: "linear", colormap: "grey" });
});

test("GetImageData reports the image dimensions", async ({ page }) => {
  const d = await js9(page, (JS9) => JS9.GetImageData(false));
  expect(d.width).toBe(800);
  expect(d.height).toBe(400);
  expect(d.bitpix).toBe(32);
  expect(typeof d.id).toBe("string");
});

test("GetFITSHeader returns header cards", async ({ page }) => {
  const cards = await js9(page, (JS9) => JS9.GetFITSHeader(true).split("\n").length);
  expect(cards).toBeGreaterThan(0);
});

test("colormap set/get round-trips", async ({ page }) => {
  await js9(page, (JS9) => JS9.SetColormap("heat"));
  const cmap = await js9(page, (JS9) => JS9.GetColormap().colormap);
  expect(cmap).toBe("heat");
});

test("scale set/get round-trips", async ({ page }) => {
  await js9(page, (JS9) => JS9.SetScale("log"));
  const scale = await js9(page, (JS9) => JS9.GetScale().scale);
  expect(scale).toBe("log");
});

test("zoom set/get round-trips", async ({ page }) => {
  await js9(page, (JS9) => JS9.SetZoom(2));
  const zoom = await js9(page, (JS9) => JS9.GetZoom());
  expect(Number(zoom)).toBe(2);
});

test("pan set/get round-trips", async ({ page }) => {
  await js9(page, (JS9) => JS9.SetPan({ px: 400, py: 200 }));
  const pan = await js9(page, (JS9) => JS9.GetPan());
  expect(Math.abs(pan.x - 400)).toBeLessThanOrEqual(2);
  expect(Math.abs(pan.y - 200)).toBeLessThanOrEqual(2);
});

test("display/image position conversions round-trip", async ({ page }) => {
  const back = await js9(page, (JS9) => {
    const dpos = JS9.ImageToDisplayPos({ x: 100, y: 100 });
    return JS9.DisplayToImagePos({ x: dpos.x, y: dpos.y });
  });
  expect(Math.abs(back.x - 100)).toBeLessThan(1);
  expect(Math.abs(back.y - 100)).toBeLessThan(1);
});

test("WCS pixel<->world conversions round-trip", async ({ page }) => {
  const r = await js9(page, (JS9) => {
    const h = JS9.GetImageData(false).header;
    const wcs = JS9.PixToWCS(h.CRPIX1, h.CRPIX2);
    const pix = JS9.WCSToPix(wcs.ra, wcs.dec);
    return { h, wcs, pix };
  });
  expect(Math.abs(r.pix.x - r.h.CRPIX1)).toBeLessThan(1);
  expect(Math.abs(r.pix.y - r.h.CRPIX2)).toBeLessThan(1);
});

test("WCS system and units can be changed", async ({ page }) => {
  await js9(page, (JS9) => JS9.SetWCSSys("galactic"));
  expect(await js9(page, (JS9) => JS9.GetWCSSys())).toBe("galactic");
  await js9(page, (JS9) => JS9.SetWCSUnits("degrees"));
  expect(await js9(page, (JS9) => JS9.GetWCSUnits())).toBe("degrees");
});

test("regions can be added, queried, changed and removed", async ({ page }) => {
  await js9(page, (JS9) => JS9.AddRegions("circle"));
  expect(await js9(page, (JS9) => JS9.GetRegions().length)).toBe(1);
  await js9(page, (JS9) => JS9.AddRegions("box"));
  expect(await js9(page, (JS9) => JS9.GetRegions().length)).toBe(2);
  await js9(page, (JS9) => JS9.RemoveRegions("all"));
  expect(await js9(page, (JS9) => JS9.GetRegions().length)).toBe(0);
  await js9(page, (JS9) => JS9.UnremoveRegions());
  expect(await js9(page, (JS9) => JS9.GetRegions().length)).toBeGreaterThan(0);
});

test("shape layers can be created and populated", async ({ page }) => {
  await js9(page, (JS9) => JS9.NewShapeLayer("reg2"));
  await js9(page, (JS9) => JS9.AddShapes("reg2", "box; circle"));
  expect(await js9(page, (JS9) => JS9.GetShapes("reg2").length)).toBe(2);
  await js9(page, (JS9) => JS9.ChangeShapes("reg2", "all", { color: "red" }));
  await js9(page, (JS9) => JS9.RemoveShapes("reg2", "all"));
  expect(await js9(page, (JS9) => JS9.GetShapes("reg2").length)).toBe(0);
});

test("GaussBlurData runs without error", async ({ page }) => {
  await js9(page, (JS9) => JS9.GaussBlurData(2));
  // still a valid image afterwards
  expect(await js9(page, (JS9) => JS9.GetImageData(false).width)).toBe(800);
});

test("FilterRGBImage applies an image filter", async ({ page }) => {
  await js9(page, (JS9) => JS9.FilterRGBImage("emboss"));
  expect(await js9(page, (JS9) => JS9.GetImageData(false).width)).toBe(800);
});

test("coordinate grid can be toggled", async ({ page }) => {
  await js9(page, (JS9) => JS9.DisplayCoordGrid(true));
  expect(await js9(page, (JS9) => JS9.DisplayCoordGrid())).toBe(true);
  await js9(page, (JS9) => JS9.DisplayCoordGrid(false));
  expect(await js9(page, (JS9) => JS9.DisplayCoordGrid())).toBe(false);
});

test("display can be resized and reset", async ({ page }) => {
  await js9(page, (JS9) => JS9.ResizeDisplay(300, 300));
  await js9(page, (JS9) => JS9.ResizeDisplay("reset"));
  expect(await js9(page, (JS9) => JS9.GetImageData(false).width)).toBe(800);
});

test("display can be separated and gathered", async ({ page }) => {
  await js9(page, (JS9) => JS9.SeparateDisplay());
  await js9(page, (JS9) => JS9.GatherDisplay());
  expect(await js9(page, (JS9) => JS9.GetImageData(false).width)).toBe(800);
});

test("flip set/get round-trips", async ({ page }) => {
  await js9(page, (JS9) => JS9.SetFlip("x"));
  expect(await js9(page, (JS9) => JS9.GetFlip())).toBe("x");
});

test("rot90 set/get round-trips", async ({ page }) => {
  await js9(page, (JS9) => JS9.SetRot90(90));
  expect(await js9(page, (JS9) => JS9.GetRot90())).toBe(90);
});

test("rotate set/get round-trips", async ({ page }) => {
  await js9(page, (JS9) => JS9.SetRotate(45));
  expect(await js9(page, (JS9) => JS9.GetRotate())).toBe(45);
});

test("GetValPos returns the pixel value at a position", async ({ page }) => {
  // build/i800400.fits.gz is a ramp with pixel value == x*1000 + y.
  const vp = await js9(page, (JS9) => JS9.GetValPos({ x: 400, y: 200 }, false));
  expect(vp.val).toBe(400200);
  expect(vp.ix).toBe(400);
  expect(vp.iy).toBe(200);
});

test("a user colormap can be added and selected", async ({ page }) => {
  await js9(page, (JS9) =>
    JS9.AddColormap("mycm", [[0, 0], [0, 0]], [[0, 0], [1, 1]], [[0, 0], [1, 1]])
  );
  await js9(page, (JS9) => JS9.SetColormap("mycm"));
  expect(await js9(page, (JS9) => JS9.GetColormap().colormap)).toBe("mycm");
});

test("GetParam/SetParam round-trip the colormap param", async ({ page }) => {
  await js9(page, (JS9) => JS9.SetColormap("heat"));
  expect(await js9(page, (JS9) => JS9.GetParam("colormap"))).toBe("heat");
  await js9(page, (JS9) => JS9.SetParam("colormap", "cool"));
  expect(await js9(page, (JS9) => JS9.GetColormap().colormap)).toBe("cool");
});

test("a shape layer can be hidden and shown", async ({ page }) => {
  await js9(page, (JS9) => JS9.NewShapeLayer("lyr"));
  await js9(page, (JS9) => JS9.AddShapes("lyr", "circle"));
  await js9(page, (JS9) => JS9.ShowShapeLayer("lyr", false));
  await js9(page, (JS9) => JS9.ShowShapeLayer("lyr", true));
  expect(await js9(page, (JS9) => JS9.GetShapes("lyr").length)).toBe(1);
});
