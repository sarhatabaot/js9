// Eleventy builds the JS9 documentation site into _site/ (the deployable
// static site; a GitHub Action publishes it). It renders the pages in docs/
// and copies the served assets; scripts/build.mjs adds the JS/CSS bundles and
// runtime library files into the same _site/ tree.
//
// htmlTemplateEngine is disabled: the pages contain literal {{ }}, {% %} and
// { } (code/CSS examples) that must not be interpreted as templates. Only the
// .njk layout is templated; page content is inserted verbatim.
export default function (eleventyConfig) {
  // Build inputs bundled by scripts/build.mjs — neither templated nor copied.
  eleventyConfig.ignores.add("docs/assets/js");
  eleventyConfig.ignores.add("docs/assets/css");

  // Served assets copied verbatim into the site root (matches the paths the
  // app and pages request at runtime).
  eleventyConfig.addPassthroughCopy({ "docs/assets/images": "images" });
  eleventyConfig.addPassthroughCopy({ "docs/assets/font": "font" });
  eleventyConfig.addPassthroughCopy({ "docs/assets/params": "params" });
  eleventyConfig.addPassthroughCopy({ "docs/demos/data": "demos/data" });
  eleventyConfig.addPassthroughCopy({ "docs/data": "data" });
  eleventyConfig.addPassthroughCopy({ "docs/favicon.ico": "favicon.ico" });

  return {
    dir: { input: "docs", output: "_site", includes: "_includes" },
    htmlTemplateEngine: false,
    markdownTemplateEngine: false,
  };
}
