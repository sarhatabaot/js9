// Shared helpers for the JS9 Playwright suite.
//
// JS9 loads its wasm FITS module (astroem) asynchronously after page load, so
// callers must not call JS9.Load until it is ready. openHarness() navigates to
// a harness page and waits for readiness; loadFits() loads an image via
// JS9.Preload (which queues until the module is ready) and resolves on onload.

// A tiny FITS committed to the repo (800x400, int32). The only image fixture
// available without the external data/ set — see PHASE2-DEPS.md / smoke.py notes.
export const TINY_FITS = "../../../build/i800400.fits.gz";

// Navigate to a harness page and wait until JS9 + the FITS module are ready.
export async function openHarness(page, variant = "source") {
  const file = {
    source: "harness.html",
    min: "harness-min.html",
    allinone: "harness-allinone.html",
  }[variant] || "harness.html";
  await page.goto(`/tests/e2e/support/${file}`, { waitUntil: "load" });
  // JS9.fits.name is populated once the astroem wasm module has loaded.
  await page.waitForFunction(
    () => window.JS9 && window.JS9.fits && !!window.JS9.fits.name,
    { timeout: 60000 }
  );
}

// Load a FITS image and resolve when JS9 reports it loaded. Uses Preload so it
// is safe even if called the instant the module becomes ready.
export async function loadFits(page, file = TINY_FITS, opts = {}) {
  return page.evaluate(
    ({ file, opts }) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("JS9 load timeout")), 60000);
        try {
          JS9.Preload(
            file,
            Object.assign({}, opts, {
              onload: () => { clearTimeout(timer); resolve(true); },
            })
          );
        } catch (e) {
          clearTimeout(timer);
          reject(e);
        }
      }),
    { file, opts }
  );
}

// Evaluate a JS9 API call in the page. `fn` receives the JS9 global.
export function js9(page, fn, arg) {
  return page.evaluate(
    ({ src, arg }) => {
      // eslint-disable-next-line no-new-func
      const f = new Function("JS9", "arg", `return (${src})(JS9, arg);`);
      return f(window.JS9, arg);
    },
    { src: fn.toString(), arg }
  );
}
