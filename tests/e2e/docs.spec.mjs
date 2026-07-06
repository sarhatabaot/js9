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

test("Pagefind search modal returns results", async ({ page }) => {
  await page.goto("/_site/help/start.html", { waitUntil: "load" });
  // open the search modal from the header trigger (Pagefind Component UI)
  await page.locator("pagefind-modal-trigger button").click();
  const input = page.locator("pagefind-modal input[type='search']");
  await input.waitFor({ timeout: 15000 });
  await input.fill("regions");
  // a result linking to a help page appears
  await expect(page.locator("pagefind-modal a[href*='.html']").first()).toBeVisible({ timeout: 15000 });
});

test("theme toggle switches and persists the theme", async ({ page }) => {
  await page.goto("/_site/help/start.html", { waitUntil: "load" });
  const before = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  await page.locator("#themeToggle").click();
  const after = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  expect(["light", "dark"]).toContain(after);
  expect(after).not.toBe(before);
  // persists across a reload (localStorage)
  await page.reload({ waitUntil: "load" });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme")))
    .toBe(after);
});

test("code blocks get syntax highlighting", async ({ page }) => {
  await page.goto("/_site/help/start.html", { waitUntil: "load" });
  // highlight.js adds .hljs to each code block...
  await expect(page.locator(".docsContent pre.hljs").first()).toBeVisible({ timeout: 10000 });
  // ...and produces highlighted tokens
  const tokens = await page
    .locator(".docsContent pre .hljs-string, .docsContent pre .hljs-tag, .docsContent pre .hljs-keyword")
    .count();
  expect(tokens).toBeGreaterThan(0);
});

test("code blocks have a copy button", async ({ page }) => {
  await page.goto("/_site/help/start.html", { waitUntil: "load" });
  await expect(page.locator(".docsContent .codeWrap .copyBtn").first()).toBeAttached();
});

test("the search modal follows the dark theme", async ({ page }) => {
  await page.goto("/_site/help/start.html", { waitUntil: "load" });
  // persist dark, reload so the (load-time) sync sets data-pf-theme
  await page.evaluate(() => { try { localStorage.setItem("js9-theme", "dark"); } catch (e) {} });
  await page.reload({ waitUntil: "load" });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.getAttribute("data-pf-theme")))
    .toBe("dark");
  // the opened modal renders on a dark (non-white) background
  await page.locator("pagefind-modal-trigger button").click();
  const bg = await page.evaluate(() => {
    const d = document.querySelector("pagefind-modal dialog, pagefind-modal .pf-modal");
    return d ? getComputedStyle(d).backgroundColor : null;
  });
  expect(bg).not.toBe("rgb(255, 255, 255)");
});

test("landing quickstart is highlighted and has a copy button", async ({ page }) => {
  await page.goto("/_site/index.html", { waitUntil: "load" });
  await expect(page.locator("pre.code.hljs").first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".codeWrap .copyBtn").first()).toBeAttached();
});

test("landing page theme toggle switches and persists", async ({ page }) => {
  await page.goto("/_site/index.html", { waitUntil: "load" });
  const before = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  await page.locator("#themeToggle").click();
  const after = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  expect(["light", "dark"]).toContain(after);
  expect(after).not.toBe(before);
  await page.reload({ waitUntil: "load" });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme")))
    .toBe(after);
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
