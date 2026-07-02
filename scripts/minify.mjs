// Minify JS files with esbuild — a drop-in replacement for the old
// build/minify (Google Closure Compiler via Java).
//
// Usage: node scripts/minify.mjs file1.js [file2.js ...]
// For each input "foo.js" it writes "foo.min.js".
//
// Why esbuild (not Closure): no JVM dependency, ~1000x faster, and it is
// pointer-safe for this codebase — it renames only local identifiers, never
// globals or object properties, so the many libraries and JS9 itself that
// rely on global `$`/`fabric`/`JS9`/window keep working. (Closure was run in
// its default SIMPLE mode, which has the same non-aggressive guarantee.)

import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import path from "node:path";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: node scripts/minify.mjs file1.js [file2.js ...]");
  process.exit(1);
}

// Preserve the leading block-comment banner (copyright / license) of each
// source file — esbuild's minifier would otherwise strip it.
async function leadingBanner(file) {
  const src = await readFile(file, "utf8");
  const m = src.match(/^\s*\/\*[\s\S]*?\*\//);
  return m ? m[0] : "";
}

for (const file of files) {
  if (!file.endsWith(".js")) {
    console.error(`skipping non-.js input: ${file}`);
    continue;
  }
  const outfile = file.replace(/\.js$/, ".min.js");
  const banner = await leadingBanner(file);
  await build({
    entryPoints: [file],
    outfile,
    minify: true,
    bundle: false,        // faithful 1:1 minify, no module resolution
    legalComments: "none",
    charset: "utf8",      // keep non-ASCII (e.g. copyright glyphs) intact
    banner: banner ? { js: banner } : undefined,
    logLevel: "warning",
  });
  console.log(`minified ${path.basename(file)} -> ${path.basename(outfile)}`);
}
