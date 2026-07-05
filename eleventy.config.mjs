// Eleventy builds the JS9 documentation. Source lives in docs/; output goes to
// help/ and plugins/help/ (via per-directory permalinks) so the paths the app
// deep-links to (help/*.html, plugins/help/*.html) are preserved.
//
// htmlTemplateEngine is disabled: the help pages contain literal {{ }}, {% %}
// and { } (code/CSS examples) that must NOT be interpreted as templates. Only
// the .njk layout is templated; page content is inserted verbatim via
// `{{ content | safe }}`.
export default function () {
  return {
    dir: {
      input: "docs",
      output: ".",
      includes: "_includes",
    },
    htmlTemplateEngine: false,
    markdownTemplateEngine: false,
  };
}
