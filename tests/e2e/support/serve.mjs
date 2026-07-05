// Minimal static file server for the Playwright e2e suite. Serves the repo
// root so the JS9 harness pages, sources, wasm, and FITS fixtures are all
// reachable at their normal relative paths. Launched by playwright.config.mjs
// (webServer). Port is fixed and shared with the config's baseURL.

import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

export const PORT = 8438;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".gz": "application/gzip",
  ".fits": "application/octet-stream",
  ".reg": "text/plain",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".gif": "image/gif",
};

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    // Health check for Playwright's webServer readiness probe.
    if (urlPath === "/") { res.writeHead(200, { "Content-Type": "text/plain" }).end("ok"); return; }
    const filePath = path.join(ROOT, path.normalize(urlPath));
    if (!filePath.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
});

// Only start listening when run directly (node serve.mjs). Importing this
// module for its PORT export (e.g. from playwright.config.mjs) must have no
// side effects, or Playwright's webServer would collide on the same port.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  server.listen(PORT, () => console.log(`e2e static server on http://localhost:${PORT}`));
}
