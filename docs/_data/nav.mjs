// Documentation sidebar navigation: groups the help pages (docs/help/<slug>.html)
// into ordered sections. Eleventy exposes this as the global `nav`; the docs
// layout (help.liquid) renders it and highlights the current page by fileSlug.
// To add or reorder a page in the sidebar, edit here.

export default {
  sections: [
    {
      title: "Getting Started",
      items: [
        { slug: "start", title: "Introduction" },
        { slug: "install", title: "Installation" },
        { slug: "webpage", title: "Add JS9 to a Web Page" },
        { slug: "yourdata", title: "Adding Your Data" },
        { slug: "deployment", title: "Deployment Modes" },
      ],
    },
    {
      title: "Guides",
      items: [
        { slug: "user", title: "User Manual" },
        { slug: "regions", title: "Regions" },
        { slug: "localtasks", title: "Local Analysis (Plugins)" },
        { slug: "serverside", title: "Server-side Analysis" },
        { slug: "helper", title: "Adding a Helper" },
        { slug: "extmsg", title: "External Messaging" },
        { slug: "python", title: "Python & Jupyter" },
        { slug: "archives", title: "Data Archives" },
      ],
    },
    {
      title: "Reference",
      items: [
        { slug: "publicapi", title: "Public API" },
        { slug: "preferences", title: "Site Preferences" },
      ],
    },
    {
      title: "Advanced",
      items: [
        { slug: "repfile", title: "Large Files" },
        { slug: "memory", title: "Memory Limits" },
        { slug: "desktop", title: "Desktop App" },
      ],
    },
    {
      title: "About",
      items: [
        { slug: "changelog", title: "Changelog" },
        { slug: "knownissues", title: "Known Issues" },
        { slug: "securityissues", title: "Security" },
      ],
    },
  ],
};
