// Single source of truth for JS9 site branding, attribution, and links.
// Eleventy exposes this as the global `site` in every template/layout, and the
// homepage (docs/index.html) reads from it too. If the project changes hands or
// moves, update THIS file — the layout footer and pages follow automatically.
//
// (README.md lives outside the Eleventy build, so keep its "Who's responsible"
// section and links in sync with the values below by hand.)
import pkg from "../../package.json" with { type: "json" };

export default {
  name: "JS9",
  tagline: "astronomical image display everywhere",
  version: pkg.version,
  license: "MIT",

  // canonical links
  repo: "https://github.com/sarhatabaot/js9",
  homepage: pkg.homepage, // https://sarhatabaot.net/js9/

  // attribution: JS9 was created and maintained through v3.9 by the original
  // authors; a new maintainer took over from handoverVersion.
  handoverVersion: "3.10.0",
  originalAuthors: "Eric Mandel & Alexey Vikhlinin",
  originalOrg: "Center for Astrophysics | Harvard & Smithsonian",
  maintainer: {
    name: "Omer Oreg",
    org: "Weizmann Institute of Science, Particles & Astrophysics Department",
    url: "https://sarhatabaot.net",
  },
};
