// Keep demo pages at demos/<name>.html (not the pretty-URL demos/<name>/index.html).
module.exports = {
  eleventyComputed: {
    permalink: (data) => `demos/${data.page.fileSlug}.html`,
  },
};
