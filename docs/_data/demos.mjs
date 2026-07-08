// The demos gallery (docs/demos/index.html) is generated from this list, and it
// is the single place to register a demo. Add an entry under the right category
// and it appears on the gallery automatically — `slug` is the demo filename
// without .html (the page lives at docs/demos/<slug>.html). Eleventy exposes
// this file as the global `demos`.

export default {
  categories: [
    {
      title: "Getting started",
      items: [
        { slug: "js9basics", title: "Basics", blurb: "The standard hand-placed layout — menubar, display, and colorbar." },
        { slug: "js9editor", title: "One-call editor", blurb: "Build a complete editor with a single JS9.create() call." },
        { slug: "js9create", title: "Create dynamically", blurb: "Create JS9 displays at runtime from your own code." },
        { slug: "js9sizes", title: "Display sizes", blurb: "Set the width and height of a JS9 display." },
        { slug: "js9menustyles", title: "Menubar styles", blurb: "Style and customize the JS9 menubar." },
      ],
    },
    {
      title: "Single-file & embedding",
      items: [
        { slug: "js9allinone", title: "All-in-one bundle", blurb: "One JS + one CSS, self-hosted — no separate support files." },
        { slug: "js9allinone-cdn", title: "All-in-one via CDN", blurb: "The all-in-one bundle from a CDN, with a live load diagnostic." },
        { slug: "js9iframe", title: "In an iframe", blurb: "Embed a fully working JS9 inside an iframe." },
        { slug: "js9_postmessage", title: "postMessage control", blurb: "Drive JS9 across frames with window.postMessage." },
        { slug: "js9bespoke", title: "Bespoke interface", blurb: "A hand-built HTML interface in place of the menubar." },
      ],
    },
    {
      title: "Multiple displays",
      items: [
        { slug: "js9multi", title: "Multiple instances", blurb: "Run several independent JS9 displays on one page." },
        { slug: "js9super", title: "Supermenu", blurb: "A supermenu that controls multiple displays at once." },
        { slug: "js9sync", title: "Sync displays", blurb: "Synchronize pan, zoom, and more across images." },
        { slug: "js9dysel", title: "Dynamic selection", blurb: "Dynamically switch which display is active." },
      ],
    },
    {
      title: "Images & color",
      items: [
        { slug: "js9cmaps", title: "Colormaps", blurb: "Define and apply custom colormaps." },
        { slug: "js9rgb", title: "RGB composites", blurb: "Combine three images into an RGB composite." },
        { slug: "js9blend", title: "Image blending", blurb: "Blend stacked images with per-layer opacity." },
        { slug: "js9masks", title: "Masks & opacity", blurb: "Apply image masks and control opacity." },
        { slug: "js9bitpix", title: "FITS data types", blurb: "Display FITS data of every BITPIX type." },
        { slug: "js9panzoom", title: "Pan & zoom", blurb: "Pan and zoom around an image." },
      ],
    },
    {
      title: "Data & performance",
      items: [
        { slug: "js9large", title: "Large files", blurb: "Work with very large FITS files." },
        { slug: "js9preload", title: "Preloading", blurb: "Preload images before the user needs them." },
        { slug: "js9refresh", title: "Refresh rate", blurb: "Refresh an image display at a set rate (Hz)." },
      ],
    },
    {
      title: "Analysis",
      items: [
        { slug: "js9analysis", title: "Server-side analysis", blurb: "Remote, server-based data analysis tasks." },
        { slug: "js9imexam", title: "Imexam", blurb: "Interactive examination: radial profiles, histograms, and more." },
        { slug: "js9plugins", title: "Plugins", blurb: "Browser-based analysis with JS9 plugins." },
        { slug: "js9cat", title: "Catalogs", blurb: "Overlay astronomical catalogs on an image." },
        { slug: "js9onchange", title: "Region callbacks", blurb: "Run tasks in response to region changes." },
      ],
    },
  ],
};
