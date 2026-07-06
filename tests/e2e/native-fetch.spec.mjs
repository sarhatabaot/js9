import { test, expect } from "@playwright/test";
import { openHarness } from "./support/js9.mjs";

// Tests for the native replacements of the former $.ajax call sites:
//   JS9.getJSONSync (sync XHR)  <- loadPrefs / loadSession  (async:false json)
//   JS9.fetchText   (fetch)     <- helper CGI + config/form HTML load (text)
//   JS9.jsonp   (script+cb)     <- helper "alive" ping (dataType:"jsonp")
//   JS9.loadScript              <- helper client script load (dataType:"script")
// The harness provides JS9; serve.mjs provides /__mock/echo, /__mock/jsonp, and
// the static fixtures under tests/e2e/fixtures/. (The full helper stack — sockets
// — still needs a running helper and isn't exercised here; this covers the
// conversion mechanisms.)

test.beforeEach(async ({ page }) => {
  await openHarness(page, "source");
});

test("JS9.getJSONSync loads and parses JSON synchronously", async ({ page }) => {
  const r = await page.evaluate(() =>
    // eslint-disable-next-line no-undef
    JS9.getJSONSync("/tests/e2e/fixtures/sync.json")
  );
  expect(r).toEqual({ a: 1, b: { c: 2 }, arr: [1, 2, 3] });
});

test("JS9.fetchText GET appends the data as a query string", async ({ page }) => {
  const r = await page.evaluate(
    () =>
      new Promise((resolve) =>
        // eslint-disable-next-line no-undef
        JS9.fetchText("/__mock/echo", "GET", { a: "1", b: "two" }, resolve)
      )
  );
  expect(r).toContain("method=GET");
  expect(r).toContain("a=1");
  expect(r).toContain("b=two");
});

test("JS9.fetchText POST sends a form-encoded body", async ({ page }) => {
  const r = await page.evaluate(
    () =>
      new Promise((resolve) =>
        // eslint-disable-next-line no-undef
        JS9.fetchText("/__mock/echo", "POST", { x: "9", y: "z" }, resolve)
      )
  );
  expect(r).toContain("method=POST");
  expect(r).toContain("body=x=9&y=z");
});

test("JS9.jsonp injects a script and fires the callback with data", async ({ page }) => {
  const r = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        // eslint-disable-next-line no-undef
        JS9.jsonp("/__mock/jsonp", resolve, () => reject(new Error("jsonp error")));
      })
  );
  expect(r).toEqual({ ok: true, ping: "pong" });
});

test("JS9.loadScript loads and executes a script", async ({ page }) => {
  const r = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        // eslint-disable-next-line no-undef
        JS9.loadScript(
          "/tests/e2e/fixtures/script.js",
          // eslint-disable-next-line no-undef
          () => resolve(window.__js9_test_script),
          () => reject(new Error("script load error"))
        );
      })
  );
  expect(r).toBe("loaded");
});
