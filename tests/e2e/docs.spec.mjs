import { test, expect } from "@playwright/test";

// The documentation pages (help/*.html) use the sidebar layout + Pagefind
// search. They are served from _site/ (built by the prepare/build hook, which
// runs Eleventy then `pagefind`). These verify the docs chrome, not JS9 itself.

test("docs page renders the sidebar and highlights the current page", async ({ page }) => {
  await page.goto("/_site/help/start.html", { waitUntil: "load" });
  await expect(page.locator(".docsSidebar")).toBeVisible();
  // the current page (Introduction) is the active sidebar link
  await expect(page.locator(".docsSidebar a.active")).toHaveText("Introduction");
  // sections + a known link from another section are present
  await expect(page.locator(".docsSectionTitle", { hasText: "Getting Started" })).toBeVisible();
  await expect(page.locator(".docsSidebar a", { hasText: "User Manual" })).toHaveCount(1);
});

test("Pagefind search returns results", async ({ page }) => {
  await page.goto("/_site/help/start.html", { waitUntil: "load" });
  const input = page.locator(".pagefind-ui__search-input");
  await input.waitFor({ timeout: 15000 });
  await input.fill("regions");
  // results load asynchronously
  await expect(page.locator(".pagefind-ui__result").first()).toBeVisible({ timeout: 15000 });
});

test("landing page builds the hero editor and loads the example image", async ({ page }) => {
  await page.goto("/_site/index.html", { waitUntil: "load" });
  // wait for JS9 ready + the declarative hero editor built + the image loaded
  await page.waitForFunction(
    () => {
      try {
        const J = window.JS9;
        if (!(J && J.fits && J.fits.name)) return false;
        const ed = document.querySelector(".JS9Editor");
        if (!(ed && ed.querySelector(".JS9Menubar") && ed.querySelector(".JS9"))) return false;
        return J.images && J.images.length > 0; // example image loaded
      } catch {
        return false;
      }
    },
    { timeout: 60000 }
  );
  // full layout: all five chrome components are present
  const parts = await page.evaluate(() => {
    const ed = document.querySelector(".JS9Editor");
    return {
      menubar: !!ed.querySelector(".JS9Menubar"),
      toolbar: !!ed.querySelector(".JS9Toolbar"),
      colorbar: !!ed.querySelector(".JS9Colorbar"),
      statusbar: !!ed.querySelector(".JS9Statusbar"),
      loaded: window.JS9.images.length > 0,
    };
  });
  expect(parts.menubar).toBe(true);
  expect(parts.toolbar).toBe(true);
  expect(parts.colorbar).toBe(true);
  expect(parts.statusbar).toBe(true);
  expect(parts.loaded).toBe(true);
});
