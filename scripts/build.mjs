// Node build for the JS9 web artifacts — a replacement for the concatenation
// and all-in-one steps the Makefile used to do (targets: js9support, js9min,
// allinone). No make, no bash, no JVM.
//
// Produces, in the repo root (matching the current layout):
//   js9support.min.js  = concat of the vendored (already-minified) libs
//   js9support.js      = concat of the non-min vendored libs
//   js9support.css     = concat of the support + plugin CSS
//   js9plugins.js      = concat of the plugin sources
//   js9.min.js         = esbuild-minified js9.js
//   js9plugins.min.js  = esbuild-minified js9plugins.js
//   js9-allinone.js    = banner + support.min + js9.min + plugins + astroem
//                        + inline data-URI assets + embedded params HTML
//   js9-allinone.css   = banner + support.css + js9.css + inline icon
//
// The file lists below mirror JSFILES / CSSFILES / PLCSSFILES / PLUGINFILES in
// Makefile.in and are now the source of truth for the build.
//
// Usage: node scripts/build.mjs   (or: npm run build)

import { readFile, writeFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { minifyFile } from "./minify.mjs";
import { allinoneGifs, sunIconCss } from "./allinone-assets.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const abs = (p) => path.join(ROOT, p);

// --- file lists (mirror Makefile.in) --------------------------------------

// vendored support libs (already-minified builds); js9support.min.js
const JSFILES = [
  "js/winmod.js", "js/jquery.min.js", "js/jquery-ui.min.js",
  "js/jquery.contextMenu.min.js", "js/jquery.flot.min.js",
  "js/jquery.flot.errorbars.min.js", "js/jquery.flot.navigate.min.js",
  "js/jquery.flot.resize.min.js", "js/jquery.flot.selection.min.js",
  "js/flot-zoom.min.js", "js/sprintf.min.js", "js/dhtmlwindow.min.js",
  "js/dhtmlwindow_blurb.js", "js/fabric.min.js", "js/pako_inflate.min.js",
  "js/FileSaver.min.js", "js/canvas-toBlob.js", "js/tabcontent.js",
  "js/arrive.min.js", "js/jquery.doubletap.min.js",
  "js/jquery.flot.axislabels.js", "js/spin.js", "js/ElementQueries.js",
  "js/ResizeSensor.js", "js/gaussblur.js", "js/imagefilters.js",
  "js/jquery.ui.touch-punch.js", "js/js9inline.js", "js/spectrum.min.js",
  "js/tinycolor.min.js", "js/jquery.mark.es6.min.js", "js/jquery.caret.min.js",
  "js/regSelect.js",
];

const CSSFILES = [
  "css/jquery.contextMenu.css", "css/dhtmlwindow.css",
  "css/tabcontent.css", "css/spectrum.css",
];

const PLCSSFILES = [
  "blend", "blink", "cmaps", "colorcontrols", "colorbar", "cube", "divs",
  "filters", "imarith", "keyboard", "layers", "mef", "mousetouch",
  "scalecontrols", "separate", "statusbar", "syncui", "toolbar",
  "zoomcontrols",
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

// --- helpers ---------------------------------------------------------------

// Raw byte concatenation of files (matches `cat a b c > out`).
async function concat(files) {
  const bufs = await Promise.all(files.map((f) => readFile(abs(f))));
  return Buffer.concat(bufs);
}

async function writeOut(name, data) {
  await writeFile(abs(name), data);
  console.log(`  ${name}`);
}

// Port of the mkallinone `sed` pipeline that inlines a params/*.html file as a
// single JS string. `simple` files delete from line 1 through <body>; the rest
// also strip the leading block (to first blank line) and the </head>..<body>
// gap. All then drop the trailing </body>.. and collapse to one line, escaping
// double quotes.
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
  console.log(`building JS9 web artifacts (v${version}) ...`);

  // support + plugin concatenations
  await writeOut("js9support.min.js", await concat(JSFILES));
  await writeOut("js9support.js", await concat(JSFILES.map((f) => f.replace(/\.min/g, ""))));
  await writeOut("js9support.css", await concat([...CSSFILES, ...PLCSSFILES]));
  await writeOut("js9plugins.js", await concat(PLUGINFILES));

  // manifest of which files went into each bundle (shipped alongside them)
  const txt =
    "css files in js9support.css: \n" + CSSFILES.join(" ") + "\n" +
    PLCSSFILES.join(" ") + "\n" +
    "js files in js9support.js: \n" + JSFILES.join(" ") + "\n" +
    "plugin files in js9plugins.js: \n" + PLUGINFILES.join(" ") + "\n";
  await writeOut("js9support.txt", Buffer.from(txt));

  // minified core + plugins (esbuild)
  await minifyFile(abs("js9.js"));
  console.log("  js9.min.js");
  await minifyFile(abs("js9plugins.js"));
  console.log("  js9plugins.min.js");

  // all-in-one JS
  const banner = `/* JS9 allinone: v${version} */\n`;
  const bundle = await concat(["js9support.min.js", "js9.min.js", "js9plugins.js", "astroem.js"]);
  let js = Buffer.concat([Buffer.from(banner), bundle]).toString("binary");
  js += "JS9.allinone = {};\n";
  for (const key of ["min", "close", "restore", "resize"]) {
    js += `JS9.allinone.${key} = "${allinoneGifs[key]}";\n`;
  }
  js += `JS9.allinone.regionsConfigHTML = "${await embedHtml("params/regionsconfig.html")}";\n`;
  js += `JS9.allinone.regionsSaveHTML = "${await embedHtml("params/regionssave.html")}";\n`;
  js += `JS9.allinone.plotConfigHTML = "${await embedHtml("params/plotconfig.html")}";\n`;
  js += `JS9.allinone.loadHTML = "${await embedHtml("params/load.html")}";\n`;
  js += `JS9.allinone.loadCorsHTML = "${await embedHtml("params/loadcors.html", true)}";\n`;
  js += `JS9.allinone.lightCloseHTML = "${await embedHtml("params/lightclose.html", true)}";\n`;
  await writeOut("js9-allinone.js", Buffer.from(js, "binary"));

  // all-in-one CSS
  const css = Buffer.concat([
    Buffer.from(banner),
    await concat(["js9support.css", "js9.css"]),
    Buffer.from(sunIconCss + "\n"),
  ]);
  await writeOut("js9-allinone.css", css);

  console.log("done.");
}

main();
