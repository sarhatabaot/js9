// Directory data for plugin help pages:
// docs/plugins-help/<name>.html -> plugins/help/<name>.html
// CommonJS (package.json has no "type":"module"; the helper uses require()).
module.exports = {
  layout: "help.liquid",
  prefix: "../../", // plugins/help/ is two levels below the web root
  eleventyComputed: {
    permalink: (data) => `plugins/help/${data.page.fileSlug}.html`,
  },
};
