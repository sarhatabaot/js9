import { test, expect } from "@playwright/test";
import { openHarness } from "./support/js9.mjs";

// Tests for JS9.create(target, opts): one call -> a full editor in a container.
// The harness loads JS9 + the plugins bundle (so the chrome is available); each
// test creates a fresh container div and inspects what create() built.

test.beforeEach(async ({ page }) => {
  await openHarness(page, "source");
});

// build an editor in a fresh container and report which component divs exist
async function build(page, opts) {
  return page.evaluate((opts) => {
    const c = document.createElement("div");
    c.id = `c_${Math.floor(performance.now() * 1000)}`;
    document.body.appendChild(c);
    // eslint-disable-next-line no-undef
    const id = JS9.create(c.id, opts || undefined);
    const has = (cls) => !!c.querySelector("." + cls);
    return {
      id,
      // eslint-disable-next-line no-undef
      registered: JS9.displays.some((d) => d.id === id),
      menubar: has("JS9Menubar"),
      toolbar: has("JS9Toolbar"),
      display: has("JS9"),
      colorbar: has("JS9Colorbar"),
      statusbar: has("JS9Statusbar"),
      panner: has("JS9Panner"),
    };
  }, opts);
}

test("full layout (default) builds the whole editor + registers the display", async ({ page }) => {
  const r = await build(page, undefined);
  expect(r.registered).toBe(true);
  expect(r.menubar).toBe(true);
  expect(r.toolbar).toBe(true);
  expect(r.display).toBe(true);
  expect(r.colorbar).toBe(true);
  expect(r.statusbar).toBe(true);
});

test("minimal layout builds only the image display", async ({ page }) => {
  const r = await build(page, { layout: "minimal" });
  expect(r.registered).toBe(true);
  expect(r.display).toBe(true);
  expect(r.menubar).toBe(false);
  expect(r.toolbar).toBe(false);
  expect(r.colorbar).toBe(false);
  expect(r.statusbar).toBe(false);
});

test("viewer preset builds menubar + display + colorbar only", async ({ page }) => {
  const r = await build(page, { layout: "viewer" });
  expect(r.registered).toBe(true);
  expect(r.menubar).toBe(true);
  expect(r.display).toBe(true);
  expect(r.colorbar).toBe(true);
  expect(r.toolbar).toBe(false);
  expect(r.statusbar).toBe(false);
});

test("per-component overrides add/remove parts on top of a preset", async ({ page }) => {
  // minimal + add menubar + add panner, but no toolbar
  const r = await build(page, { layout: "minimal", menubar: true, panner: true });
  expect(r.display).toBe(true);
  expect(r.menubar).toBe(true);
  expect(r.panner).toBe(true);
  expect(r.toolbar).toBe(false);
  expect(r.colorbar).toBe(false);
});

test("create can preload an image with display opts", async ({ page }) => {
  const r = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const c = document.createElement("div");
        c.id = "loadEditor";
        document.body.appendChild(c);
        // eslint-disable-next-line no-undef
        const id = JS9.create(c.id, {
          layout: "minimal",
          image: "/build/i800400.fits.gz",
          colormap: "heat",
          opts: {
            onload: () =>
              resolve({
                id,
                // eslint-disable-next-line no-undef
                loaded: !!JS9.GetImage({ display: id }),
                // eslint-disable-next-line no-undef
                colormap: JS9.GetColormap({ display: id }).colormap,
              }),
          },
        });
      })
  );
  expect(r.loaded).toBe(true);
  expect(r.colormap).toBe("heat");
});

test("declarative <div class='JS9Editor'> is auto-built by JS9.init()", async ({ page }) => {
  // a page with a JS9Editor div and no script -> init() builds it
  await page.goto("/tests/e2e/support/harness-editor.html", { waitUntil: "load" });
  // wait for JS9 ready + the editor built + the image loaded
  await page.waitForFunction(
    () => {
      try {
        const J = window.JS9;
        if (!(J && J.fits && J.fits.name)) return false;
        if (!J.displays.some((d) => d.id === "declEditorJS9")) return false;
        return !!J.GetImage({ display: "declEditorJS9" });
      } catch {
        return false;
      }
    },
    { timeout: 60000 }
  );
  const r = await page.evaluate(() => {
    const c = document.getElementById("declEditor");
    const has = (cls) => !!c.querySelector("." + cls);
    return {
      menubar: has("JS9Menubar"),
      display: has("JS9"),
      colorbar: has("JS9Colorbar"),
      toolbar: has("JS9Toolbar"),
      statusbar: has("JS9Statusbar"),
      colormap: window.JS9.GetColormap({ display: "declEditorJS9" }).colormap,
    };
  });
  // data-layout="viewer" -> menubar + display + colorbar (no toolbar/statusbar)
  expect(r.menubar).toBe(true);
  expect(r.display).toBe(true);
  expect(r.colorbar).toBe(true);
  expect(r.toolbar).toBe(false);
  expect(r.statusbar).toBe(false);
  // data-colormap="heat" was applied to the preloaded image
  expect(r.colormap).toBe("heat");
});
