// Eleventy builds the JS9 documentation site into _site/ (the deployable
// static site; a GitHub Action publishes it). It renders the pages in docs/
// and copies the served assets; scripts/build.mjs adds the JS/CSS bundles and
// runtime library files into the same _site/ tree.
//
// htmlTemplateEngine is disabled: the pages contain literal {{ }}, {% %} and
// { } (code/CSS examples) that must not be interpreted as templates. Only the
// Liquid layout (_includes/help.liquid) and the homepage (which opts in via
// templateEngineOverride) are templated; page content is inserted verbatim.
// Shared branding/links come from the global data file docs/_data/site.mjs.
/** @param {any} eleventyConfig */
export default function (eleventyConfig) {
  // Build inputs bundled by scripts/build.mjs — neither templated nor copied.
  eleventyConfig.ignores.add("docs/assets/js");
  eleventyConfig.ignores.add("docs/assets/css");

  // Served assets copied verbatim into the site root (matches the paths the
  // app and pages request at runtime).
  eleventyConfig.addPassthroughCopy({ "docs/css": "css" });
  eleventyConfig.addPassthroughCopy({ "docs/assets/images": "images" });
  eleventyConfig.addPassthroughCopy({ "docs/assets/font": "font" });
  eleventyConfig.addPassthroughCopy({ "docs/assets/params": "params" });
  eleventyConfig.addPassthroughCopy({ "docs/demos/data": "demos/data" });
  eleventyConfig.addPassthroughCopy({ "docs/data": "data" });
  eleventyConfig.addPassthroughCopy({ "docs/favicon.ico": "favicon.ico" });
  // GitHub Pages custom domain (js9.sarhatabaot.net) -> served from _site/CNAME
  eleventyConfig.addPassthroughCopy({ "docs/CNAME": "CNAME" });

  // The demo pages (docs/demos/*.html) are standalone documents with their own
  // JS9 setup, so they are not wrapped in the docs layout. Instead, inject a
  // slim shared header at build time so every demo links back to Home / Docs /
  // the Demos gallery. Pure HTML+CSS (no JS9), scoped under .js9DemoBar so it
  // can't clash with a demo's own styles. To change the header, edit here once.
  const DEMO_NAV_STYLE = `<style>
.js9DemoBar{position:sticky;top:0;z-index:9999;display:flex;align-items:center;gap:18px;padding:8px 16px;background:#fff;border-bottom:1px solid #e2e8f0;font:14px/1.4 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.js9DemoBar .brand{display:flex;align-items:center;gap:8px;font-weight:700;text-decoration:none;color:#1a202c}
.js9DemoBar .brand img{height:24px}
.js9DemoBar nav{display:flex;gap:20px}
.js9DemoBar nav a{text-decoration:none;color:#5a6675}
.js9DemoBar nav a:hover{color:#2b6cb0}
.js9DemoBar .tag{margin-left:auto;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#5a6675;border:1px solid #e2e8f0;border-radius:10px;padding:2px 8px}
@media (prefers-color-scheme:dark){.js9DemoBar{background:#0d1117;border-bottom-color:#30363d}.js9DemoBar .brand{color:#e6edf3}.js9DemoBar nav a{color:#8b98a5}.js9DemoBar nav a:hover{color:#58a6ff}.js9DemoBar .tag{color:#8b98a5;border-color:#30363d}}
</style>`;
  const DEMO_NAV_HTML = `<header class="js9DemoBar"><a class="brand" href="../index.html"><img src="../images/js9logo.png" alt="JS9">JS9</a><nav><a href="../index.html">Home</a><a href="../help/start.html">Docs</a><a href="../demos/">Demos</a></nav><span class="tag">demo</span></header>`;

  eleventyConfig.addTransform("demoHeader", function (content, outputPath) {
    const out = outputPath || (this.page && this.page.outputPath) || "";
    // only demo pages (demos/<name>.html, including the gallery index)
    if (!/[\\/]demos[\\/][^\\/]+\.html$/.test(out)) return content;
    if (content.includes("js9DemoBar")) return content; // idempotent
    if (!/<body[^>]*>/i.test(content)) return content; // nothing to anchor to
    return content
      .replace(/<\/head>/i, DEMO_NAV_STYLE + "</head>")
      .replace(/(<body[^>]*>)/i, "$1" + DEMO_NAV_HTML);
  });

  return {
    dir: { input: "docs", output: "_site", includes: "_includes" },
    htmlTemplateEngine: false,
    markdownTemplateEngine: false,
  };
}
