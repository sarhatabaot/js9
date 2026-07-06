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
