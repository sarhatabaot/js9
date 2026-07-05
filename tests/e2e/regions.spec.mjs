import { test, expect } from "@playwright/test";
import { openHarness, loadFits, js9 } from "./support/js9.mjs";

// Region tests ported from smoke2.py (boolean-selection parser + grouping),
// smoke3.py (save/load round-trip) and smoke.py's dispCoordsTest. All use
// inline regions (image coords) or the committed tests/dcoords.reg — no
// external data/ set required.

test.beforeEach(async ({ page }) => {
  await openHarness(page, "source");
  await loadFits(page, undefined, { scale: "linear", colormap: "grey" });
});

// Add a fresh set of tagged regions, apply a boolean ChangeRegions expression,
// and return the tags of every region that ended up red.
async function matchedByExpr(page, regionsStr, expr) {
  return js9(
    page,
    (JS9, { regionsStr, expr }) => {
      JS9.RemoveRegions("all");
      JS9.AddRegions(regionsStr);
      JS9.ChangeRegions("all", { color: "#000000" });
      JS9.ChangeRegions(expr, { color: "red" });
      return JS9.GetRegions()
        .filter((r) => (r.color || "").toLowerCase() === "red")
        .map((r) => `${r.shape}:${(r.tags || []).join(",")}`)
        .sort();
    },
    { regionsStr, expr }
  );
}

const REGIONS =
  "image; circle(200,200,20) # foo1; circle(300,200,20) # foo2; " +
  "ellipse(200,100,30,20) # foo1; box(300,100,30,30) # foo2";

test("boolean parser: shape match", async ({ page }) => {
  expect(await matchedByExpr(page, REGIONS, "circle")).toEqual([
    "circle:foo1",
    "circle:foo2",
  ]);
});

test("boolean parser: AND with tag", async ({ page }) => {
  expect(await matchedByExpr(page, REGIONS, "circle && foo1")).toEqual([
    "circle:foo1",
  ]);
});

test("boolean parser: OR of shapes", async ({ page }) => {
  expect(await matchedByExpr(page, REGIONS, "circle || ellipse")).toEqual([
    "circle:foo1",
    "circle:foo2",
    "ellipse:foo1",
  ]);
});

test("boolean parser: NOT of tag", async ({ page }) => {
  expect(await matchedByExpr(page, REGIONS, "!foo2")).toEqual([
    "circle:foo1",
    "ellipse:foo1",
  ]);
});

test("boolean parser: grouped expression", async ({ page }) => {
  expect(
    await matchedByExpr(page, REGIONS, "(circle && foo2) || (ellipse && foo1)")
  ).toEqual(["circle:foo2", "ellipse:foo1"]);
});

test("SelectRegions applies a boolean expression without error", async ({ page }) => {
  const n = await js9(page, (JS9, r) => {
    JS9.RemoveRegions("all");
    JS9.AddRegions(r);
    JS9.SelectRegions("circle || ellipse");
    JS9.SelectRegions("reset");
    return JS9.GetRegions().length;
  }, REGIONS);
  expect(n).toBe(4);
});

test("regions can be grouped, listed and ungrouped", async ({ page }) => {
  const grp = await js9(page, (JS9) => {
    JS9.RemoveRegions("all");
    JS9.AddRegions("image; circle(200,200,20); box(300,200,30,30)");
    return JS9.GroupRegions("circle || box");
  });
  expect(typeof grp).toBe("string");
  expect(await js9(page, (JS9, g) => JS9.ListGroups().includes(g), grp)).toBe(true);
  await js9(page, (JS9, g) => JS9.UngroupRegions(g), grp);
  expect(await js9(page, (JS9, g) => JS9.ListGroups().includes(g), grp)).toBe(false);
});

test("region serialization round-trips (save/load)", async ({ page }) => {
  const { first, second } = await js9(page, (JS9) => {
    JS9.RemoveRegions("all");
    JS9.AddRegions("image; circle(200,200,20); box(300,150,40,30)");
    const first = JS9.GetRegions().map((r) => r.imstr).sort();
    JS9.RemoveRegions("all");
    JS9.AddRegions("image; " + first.join("; "));
    const second = JS9.GetRegions().map((r) => r.imstr).sort();
    return { first, second };
  });
  expect(second).toEqual(first);
  expect(first.length).toBe(2);
});

test("LoadRegions loads a region file (display coords)", async ({ page }) => {
  await js9(page, (JS9) => JS9.LoadRegions("/tests/dcoords.reg"));
  await page.waitForFunction(
    () => window.JS9.GetRegions().length >= 13,
    undefined,
    { timeout: 15000 }
  );
  const shapes = await js9(page, (JS9) => {
    const counts = {};
    JS9.GetRegions().forEach((r) => { counts[r.shape] = (counts[r.shape] || 0) + 1; });
    return counts;
  });
  // dcoords.reg: 3 text, 3 circle, 1 box, 2 line, 4 polygon = 13
  expect(shapes.circle).toBe(3);
  expect(shapes.polygon).toBe(4);
});
