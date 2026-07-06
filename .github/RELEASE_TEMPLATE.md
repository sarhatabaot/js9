<!--
Release-notes skeleton for JS9. GitHub does not auto-load a release-body
template, so copy this into the release description and fill it in. Click
"Generate release notes" to append the categorized "What's Changed" list
(configured in .github/release.yml).

Publishing the release triggers .github/workflows/release.yml, which builds the
bundles and attaches js9-allinone.js, js9-allinone.css, and js9-dist.zip below.
-->

## Highlights

- <!-- the headline changes in this release -->

## Install

The **`js9-allinone.js`** + **`js9-allinone.css`** bundles are attached to this
release, along with **`js9-dist.zip`** (the full self-host set, including the
WebAssembly engine). Drop the single-file bundle onto a page:

```html
<link rel="stylesheet" href="js9-allinone.css">
<script src="js9-allinone.js"></script>
```

See the [Getting Started guide](https://js9.sarhatabaot.net/help/start.html) for
CDN and layout options.

> npm publishing is not enabled yet.

## What's changed

<!-- Use "Generate release notes" to fill this from merged PRs. -->
