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
import { fileURLToPath, pathToFileURL } from "node:url";

// Preserve the leading block-comment banner (copyright / license) of a source
// file — esbuild's minifier would otherwise strip it.
/** @param {string} file */
async function leadingBanner(file) {
  const src = await readFile(file, "utf8");
  const m = src.match(/^\s*\/\*[\s\S]*?\*\//);
  return m ? m[0] : "";
}

// Minify "file" into "outFile" (default: sibling "foo.min.js"). Returns the
// output path.
/** @param {string} file @param {string} [outFile] @returns {Promise<string>} */
export async function minifyFile(file, outFile) {
  if (!file.endsWith(".js")) throw new Error(`not a .js file: ${file}`);
  const outfile = outFile || file.replace(/\.js$/, ".min.js");
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
  return outfile;
}

/** @param {string[]} files */
async function main(files) {
  if (files.length === 0) {
    console.error("usage: node scripts/minify.mjs file1.js [file2.js ...]");
    process.exit(1);
  }
  for (const file of files) {
    const out = await minifyFile(file);
    console.log(`minified ${path.basename(file)} -> ${path.basename(out)}`);
  }
}

// Run as a CLI only when invoked directly (not when imported by build.mjs).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
