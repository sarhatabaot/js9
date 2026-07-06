// Syntax-highlighting bundle for the docs pages. esbuild bundles highlight.js
// core plus only the languages our docs use into _site/vendor/highlight.js
// (see scripts/build.mjs). It self-runs: on load it highlights every <pre> in
// the docs content. Kept self-contained (no CDN), matching the rest of the build.
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import xml from "highlight.js/lib/languages/xml"; // also covers HTML
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import css from "highlight.js/lib/languages/css";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("css", css);

// highlight every code block in the docs content (auto-detecting the language)
// and add a copy-to-clipboard button (shown on hover).
function run() {
  // docs pages (.docsContent pre) and the landing quickstart (pre.code)
  document.querySelectorAll(".docsContent pre, pre.code").forEach((el) => {
    if (el.getAttribute("data-enhanced")) {
      return;
    }
    el.setAttribute("data-enhanced", "1");
    if (!el.classList.contains("hljs")) {
      hljs.highlightElement(/** @type {HTMLElement} */ (el));
    }
    // capture the code text BEFORE inserting the button, so it isn't copied
    const code = el.textContent || "";
    const wrap = document.createElement("div");
    wrap.className = "codeWrap";
    el.before(wrap); // insert the wrapper before the <pre>
    wrap.append(el); // move the <pre> into the wrapper
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copyBtn";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code");
    btn.addEventListener("click", () => {
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = "Copied";
        setTimeout(() => { btn.textContent = "Copy"; }, 1500);
      }).catch(() => {});
    });
    wrap.append(btn);
  });
}

if (document.readyState !== "loading") {
  run();
} else {
  document.addEventListener("DOMContentLoaded", run);
}
