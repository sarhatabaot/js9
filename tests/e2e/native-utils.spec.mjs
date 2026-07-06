import { test, expect } from "@playwright/test";
import { openHarness } from "./support/js9.mjs";

// Parity tests for the native replacements of the jQuery utilities JS9 used to
// call ($.extend / $.inArray). The harness loads jQuery too, so we run both the
// JS9 helper and the jQuery original on identical inputs and assert they agree.
// This guards the ~183 core call-site swaps.

test.beforeEach(async ({ page }) => {
  await openHarness(page, "source");
});

test("JS9.extend matches jQuery $.extend (shallow + deep)", async ({ page }) => {
  const rows = await page.evaluate(() => {
    const clone = (o) => JSON.parse(JSON.stringify(o));
    /** run the same args through $.extend and JS9.extend, return both as JSON */
    const both = (args) => {
      const a = args.map((x) => (typeof x === "boolean" ? x : clone(x)));
      const b = args.map((x) => (typeof x === "boolean" ? x : clone(x)));
      // eslint-disable-next-line no-undef
      return [JSON.stringify($.extend(...a)), JSON.stringify(JS9.extend(...b))];
    };
    return [
      // shallow
      both([{ a: 1 }, { b: 2 }]),
      both([{ a: 1, b: 2 }, { b: 3, c: 4 }]),
      both([{ a: 1 }, { b: undefined }]), // undefined is skipped
      both([{}, { a: { x: 1 } }, { a: { y: 2 } }]), // shallow: a is replaced
      // deep
      both([true, {}, { a: { x: 1, y: 2 } }]),
      both([true, { a: { x: 1 } }, { a: { y: 2 } }]), // deep-merged
      both([true, {}, { arr: [1, 2, { k: 3 }] }]),
      both([true, { a: { b: { c: 1 } } }, { a: { b: { d: 2 } } }]),
      both([true, { a: 1 }, { a: undefined }]), // undefined skipped in deep too
      both([true, { a: [1, 2, 3] }, { a: [9] }]), // array element-wise deep merge
    ];
  });
  for (const [jq, js] of rows) expect(js).toBe(jq);
});

test("JS9.inArray matches jQuery $.inArray", async ({ page }) => {
  const r = await page.evaluate(() => {
    const arr = [10, 20, 30, "x"];
    // eslint-disable-next-line no-undef
    const pair = (v, i) => [JS9.inArray(v, arr, i), $.inArray(v, arr, i)];
    return {
      found: pair(20),
      missing: pair(99),
      str: pair("x"),
      fromIndex: pair(10, 1),
      // eslint-disable-next-line no-undef
      nullArr: [JS9.inArray(1, null), $.inArray(1, null)],
    };
  });
  expect(r.found[0]).toBe(r.found[1]);
  expect(r.missing[0]).toBe(r.missing[1]);
  expect(r.str[0]).toBe(r.str[1]);
  expect(r.fromIndex[0]).toBe(r.fromIndex[1]);
  expect(r.nullArr[0]).toBe(r.nullArr[1]);
});
