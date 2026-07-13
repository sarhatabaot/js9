// Keep demo pages at demos/<name>.html (not the pretty-URL demos/<name>/index.html).
// The gallery (docs/demos/index.html) is served at demos/ (index.html) instead;
// Eleventy's fileSlug for an index file is the parent dir, so special-case it.
module.exports = {
  eleventyComputed: {
    permalink: (data) =>
      data.page.inputPath.endsWith("/index.html")
        ? "demos/index.html"
        : `demos/${data.page.fileSlug}.html`,
  },
};
