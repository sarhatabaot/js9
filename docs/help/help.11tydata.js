// Directory data for the main help pages: docs/help/<name>.html -> help/<name>.html
// CommonJS (package.json has no "type":"module"; the helper uses require()).
module.exports = {
  layout: "help.liquid",
  prefix: "../", // help/ is one level below the web root
  eleventyComputed: {
    permalink: (data) => `help/${data.page.fileSlug}.html`,
  },
};
