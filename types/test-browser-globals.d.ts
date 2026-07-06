// The Playwright test helpers reference browser globals inside page.evaluate
// callbacks (functions that are serialized and run in the page, where JS9 is a
// global). Declared here as `any` so the test code type-checks in the Node
// tooling project without dragging in the whole JS9 surface.

declare const JS9: any;

interface Window {
  JS9?: any;
}
