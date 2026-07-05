// Node build for the JS9 web app. Assembles the deployable static site in
// _site/ (no make, no bash, no JVM). Eleventy (npm run docs) renders the pages
// and copies docs/assets into _site/; this script produces the JS/CSS bundles
// and copies the core runtime library files.
//
// Inputs:  docs/assets/{js,css,params} (vendored libs + dialogs), plugins/
//          (plugin sources), and the root library sources (js9.js, js9.css, ...)
// Outputs (all in _site/):
//   js9support.min.js / js9support.js / js9support.css / js9support.txt
//   js9plugins.js / js9plugins.min.js / js9.min.js
//   js9-allinone.js / js9-allinone.css
//   + copied runtime files (js9.css, js9worker.js, astroem*, prefs, favicon)
//
// Usage: node scripts/build.mjs   (run before/with `npm run docs`; see build)

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { minifyFile } from "./minify.mjs";
import { allinoneGifs, sunIconCss } from "./allinone-assets.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTDIR = "_site";
const abs = (p) => path.join(ROOT, p); // source, repo-relative
const out = (p) => path.join(ROOT, OUTDIR, p); // build output in _site/

// --- file lists ------------------------------------------------------------
// Vendored libs + support CSS + params dialogs now live under docs/assets/;
// plugin sources stay at the repo root under plugins/.
const A = "docs/assets";

const JSFILES = [
  "winmod.js", "jquery.min.js", "jquery-ui.min.js", "jquery.contextMenu.min.js",
  "jquery.flot.min.js", "jquery.flot.errorbars.min.js", "jquery.flot.navigate.min.js",
  "jquery.flot.resize.min.js", "jquery.flot.selection.min.js", "flot-zoom.min.js",
  "sprintf.min.js", "dhtmlwindow.min.js", "dhtmlwindow_blurb.js", "fabric.min.js",
  "pako_inflate.min.js", "FileSaver.min.js", "canvas-toBlob.js", "tabcontent.js",
  "arrive.min.js", "jquery.doubletap.min.js", "jquery.flot.axislabels.js",
  "spin.js", "ElementQueries.js", "ResizeSensor.js", "gaussblur.js",
  "imagefilters.js", "jquery.ui.touch-punch.js", "js9inline.js", "spectrum.min.js",
  "tinycolor.min.js", "jquery.mark.es6.min.js", "jquery.caret.min.js", "regSelect.js",
].map((b) => `${A}/js/${b}`);

const CSSFILES = [
  "jquery.contextMenu.css", "dhtmlwindow.css", "tabcontent.css", "spectrum.css",
].map((b) => `${A}/css/${b}`);

const PLCSSFILES = [
  "blend", "blink", "cmaps", "colorcontrols", "colorbar", "cube", "divs",
  "filters", "imarith", "keyboard", "layers", "mef", "mousetouch",
  "scalecontrols", "separate", "statusbar", "syncui", "toolbar", "zoomcontrols",
].map((n) => `plugins/core/${n}.css`);

const PLUGINFILES = [
  "plugins/archive/archive.js", "plugins/fitsy/binning.js",
  "plugins/core/blend.js", "plugins/core/blink.js", "plugins/core/cmaps.js",
  "plugins/core/colorbar.js", "plugins/core/colorcontrols.js",
  "plugins/core/console.js", "plugins/core/cube.js", "plugins/core/divs.js",
  "plugins/core/filters.js", "plugins/core/imarith.js", "plugins/core/info.js",
  "plugins/core/keyboard.js", "plugins/core/layers.js",
  "plugins/core/magnifier.js", "plugins/core/mef.js", "plugins/core/menubar.js",
  "plugins/core/panner.js", "plugins/core/zoomcontrols.js",
  "plugins/core/prefs.js", "plugins/core/scalecontrols.js",
  "plugins/core/separate.js", "plugins/core/statusbar.js",
  "plugins/core/sync.js", "plugins/core/syncui.js", "plugins/core/toolbar.js",
  "plugins/imexam/imexam.js", "plugins/imexam/encircled.js",
  "plugins/imexam/pixtable.js", "plugins/imexam/radproj.js",
  "plugins/imexam/reghist.js", "plugins/imexam/regstat.js",
  "plugins/imexam/xyproj.js", "plugins/imexam/3dplot.js",
  "plugins/imexam/contour.js",
];

// Core runtime library files copied verbatim into _site/ (loaded by the app at
// runtime relative to INSTALLDIR, which resolves to _site/'s root).
const RUNTIME = [
  "js9.js", "js9.css", "js9prefs.js", "js9Prefs.json", "js9worker.js",
  "astroem.js", "astroemw.js", "astroemw.wasm", "favicon.ico",
];

// --- helpers ---------------------------------------------------------------
async function concatFiles(files) {
  const bufs = await Promise.all(files.map((f) => readFile(abs(f))));
  return Buffer.concat(bufs);
}

async function writeOut(name, data) {
  await writeFile(out(name), data);
  console.log(`  _site/${name}`);
}

// Port of the old mkallinone sed pipeline: inline a params/*.html dialog as one
// escaped JS string (see git history for the original bash).
async function embedHtml(file, simple) {
  let lines = (await readFile(abs(file), "utf8")).split("\n");
  if (simple) {
    const b = lines.findIndex((l) => /<body>/.test(l));
    if (b !== -1) lines = lines.slice(b + 1);
  } else {
    const blank = lines.findIndex((l) => l === "");
    if (blank !== -1) lines = lines.slice(blank + 1);
    const h = lines.findIndex((l) => /<\/head>/.test(l));
    if (h !== -1) {
      let b = -1;
      for (let i = h; i < lines.length; i++) {
        if (/<body>/.test(lines[i])) { b = i; break; }
      }
      lines = b !== -1 ? lines.toSpliced(h, b - h + 1) : lines.slice(0, h);
    }
  }
  const eb = lines.findIndex((l) => /<\/body>/.test(l));
  if (eb !== -1) lines = lines.slice(0, eb);
  return lines.join("").replace(/"/g, '\\"');
}

// --- build -----------------------------------------------------------------
async function main() {
  const pkg = JSON.parse(await readFile(abs("package.json"), "utf8"));
  const version = pkg.version;
  console.log(`building JS9 web app -> ${OUTDIR}/ (v${version}) ...`);
  await mkdir(out("."), { recursive: true });

  // support + plugin concatenations
  await writeOut("js9support.min.js", await concatFiles(JSFILES));
  await writeOut("js9support.js", await concatFiles(JSFILES.map((f) => f.replace(/\.min/g, ""))));
  await writeOut("js9support.css", await concatFiles([...CSSFILES, ...PLCSSFILES]));
  await writeOut("js9plugins.js", await concatFiles(PLUGINFILES));

  // manifest of which files went into each bundle
  const txt =
    "css files in js9support.css: \n" + CSSFILES.join(" ") + "\n" +
    PLCSSFILES.join(" ") + "\n" +
    "js files in js9support.js: \n" + JSFILES.join(" ") + "\n" +
    "plugin files in js9plugins.js: \n" + PLUGINFILES.join(" ") + "\n";
  await writeOut("js9support.txt", Buffer.from(txt));

  // minified core + plugins (esbuild)
  await minifyFile(abs("js9.js"), out("js9.min.js"));
  console.log("  _site/js9.min.js");
  await minifyFile(out("js9plugins.js"), out("js9plugins.min.js"));
  console.log("  _site/js9plugins.min.js");

  // all-in-one JS (reads the just-built bundles from _site/ + astroem source)
  const banner = `/* JS9 allinone: v${version} */\n`;
  const bundle = Buffer.concat([
    await readFile(out("js9support.min.js")),
    await readFile(out("js9.min.js")),
    await readFile(out("js9plugins.js")),
    await readFile(abs("astroem.js")),
  ]);
  let js = Buffer.concat([Buffer.from(banner), bundle]).toString("binary");
  js += "JS9.allinone = {};\n";
  for (const key of ["min", "close", "restore", "resize"]) {
    js += `JS9.allinone.${key} = "${allinoneGifs[key]}";\n`;
  }
  js += `JS9.allinone.regionsConfigHTML = "${await embedHtml(`${A}/params/regionsconfig.html`)}";\n`;
  js += `JS9.allinone.regionsSaveHTML = "${await embedHtml(`${A}/params/regionssave.html`)}";\n`;
  js += `JS9.allinone.plotConfigHTML = "${await embedHtml(`${A}/params/plotconfig.html`)}";\n`;
  js += `JS9.allinone.loadHTML = "${await embedHtml(`${A}/params/load.html`)}";\n`;
  js += `JS9.allinone.loadCorsHTML = "${await embedHtml(`${A}/params/loadcors.html`, true)}";\n`;
  js += `JS9.allinone.lightCloseHTML = "${await embedHtml(`${A}/params/lightclose.html`, true)}";\n`;
  await writeOut("js9-allinone.js", Buffer.from(js, "binary"));

  // all-in-one CSS
  await writeOut("js9-allinone.css", Buffer.concat([
    Buffer.from(banner),
    await concatFiles([...CSSFILES, ...PLCSSFILES, "js9.css"]),
    Buffer.from(sunIconCss + "\n"),
  ]));

  // copy core runtime files into _site/
  for (const f of RUNTIME) await copyFile(abs(f), out(f));
  console.log(`  _site/ <- ${RUNTIME.length} runtime files`);

  console.log("done.");
}

main();
