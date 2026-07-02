// Headless smoke test for JS9: serve the repo, load tests/ci-smoke.html in
// Chromium, load a FITS file, and assert a real image renders.
//
// Usage: node tests/ci-smoke.mjs
// Requires: @playwright/test (chromium). See package.json devDependencies.

import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8437; // arbitrary high port unlikely to collide in CI
// Which harness page to load (default: non-min source). Pass a repo-relative
// path to test a different bundle, e.g. tests/ci-smoke-min.html.
const PAGE = process.argv[2] || "tests/ci-smoke.html";

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".gz": "application/gzip",
  ".fits": "application/octet-stream",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".gif": "image/gif",
};

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
      // Prevent path traversal outside the repo root.
      const filePath = path.join(ROOT, path.normalize(urlPath));
      if (!filePath.startsWith(ROOT)) { res.writeHead(403).end(); return; }
      const body = await readFile(filePath);
      res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  let failed = false;
  try {
    const page = await browser.newPage();
    page.on("console", (m) => console.log(`  [browser:${m.type()}] ${m.text()}`));
    page.on("pageerror", (e) => console.log(`  [browser:pageerror] ${e.message}`));
    page.on("requestfailed", (r) => console.log(`  [req FAILED] ${r.url()} :: ${r.failure()?.errorText}`));
    page.on("response", (r) => { if (/astroem|\.wasm/.test(r.url())) console.log(`  [resp ${r.status()}] ${r.url()}`); });

    console.log(`  loading /${PAGE}`);
    await page.goto(`http://localhost:${PORT}/${PAGE}`, { waitUntil: "load" });

    // Wait for the harness to set window.__js9smoke (wasm compile + FITS load).
    await page.waitForFunction("window.__js9smoke !== null", { timeout: 60000 });
    const result = await page.evaluate("window.__js9smoke");

    if (!result.ok) {
      console.error(`\n✗ smoke test FAILED: ${result.error}`);
      failed = true;
    } else if (!(result.width > 0 && result.height > 0)) {
      console.error(`\n✗ smoke test FAILED: image has no dimensions: ${JSON.stringify(result)}`);
      failed = true;
    } else {
      console.log(`\n✓ smoke test PASSED: loaded '${result.id}' ` +
        `${result.width}x${result.height} bitpix=${result.bitpix}`);
    }
  } catch (err) {
    console.error(`\n✗ smoke test ERRORED: ${err.message}`);
    failed = true;
  } finally {
    await browser.close();
    server.close();
  }
  process.exit(failed ? 1 : 0);
}

main();
