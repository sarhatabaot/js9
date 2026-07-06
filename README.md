# JS9: astronomical image display everywhere

JS9 displays FITS images, tables, and data cubes in the browser, with the
analysis power of the [DS9](https://sites.google.com/cfa.harvard.edu/saoimageds9)
imaging application. FITS I/O, WCS, and image processing run client-side in
WebAssembly (via CFITSIO compiled from C), so basic display and analysis work
with no server at all.

This is a **modernized fork** of the original JS9. See
[Who's responsible?](#whos-responsible) for the attribution and handover.

- Website / live demo: <https://sarhatabaot.net/js9/>
- Source: <https://github.com/sarhatabaot/js9>

## What does it do?

- display FITS images, binary tables, data cubes, and multi-extension files
- colormaps, scaling, pan, zoom, binning, blending, print, export ...
- region support: create, manipulate, import, export, ...
- drag and drop images, regions, and catalogs
- client-side analysis via the JS9 public API (image arithmetic, smoothing,
  radial profiles, histograms, ...), plus optional server-side analysis
- control JS9 from scripts (shell or Python) through the public API
- runs on macOS, Linux, Windows, iPads, iPhones, and as a desktop app
- uses WebAssembly for FITS processing at near-native speed

## Try it

Go to the [JS9 website](https://sarhatabaot.net/js9/) and drag a
[FITS](https://fits.gsfc.nasa.gov/) file onto the display. You can also pass a
remote file and display parameters in the URL:

    https://sarhatabaot.net/js9/js9.html?url=https://path/to/image.fits.gz&colormap=cool

## Install / run locally

JS9 now builds with Node (no `configure`/`make`/JVM). Clone, install, and serve:

    git clone https://github.com/sarhatabaot/js9
    cd js9
    npm install          # also builds the site into _site/ (prepare hook)
    npm run serve        # build + preview at http://localhost:8080

Other scripts:

    npm run build        # assemble the deployable static site into _site/
    npm test             # Playwright end-to-end tests
    npm run typecheck    # type-check the Node tooling

JS9 supports two deployment modes — **static/client-side** (no server; WASM does
the work) and a **Node helper** (adds server-side analysis, a CORS proxy, and
file saving). See [Deployment Modes](https://sarhatabaot.net/js9/help/deployment.html)
to choose. To run the helper:

    node server/js9Helper.js

## Scripting

The `js9` command controls a JS9 web page from the shell via the public API
(requires the Node helper):

    js9 Load chandra.fits '{"scale":"log","colormap":"red"}'
    js9 ReprojectData chandra.fits

Python users can drive JS9 with [pyjs9](https://github.com/ericmandel/pyjs9)
(the upstream Python interface):

    import pyjs9
    j = pyjs9.JS9()
    j.Load('chandra.fits', '{"scale":"log","colormap":"red"}')

## License

JS9 is distributed under the terms of the MIT License.

## Release history

Full details are in the
[ChangeLog](https://sarhatabaot.net/js9/help/changelog.html). In brief: the
original authors released JS9 through **v3.9** (December 2024); this fork
continues from **v3.10**, beginning with a tooling/modernization pass (Node
build, esbuild, Eleventy docs, Playwright tests) before further code changes.

## Who's responsible?

JS9 was created and maintained through **v3.9** by **Eric Mandel** and **Alexey
Vikhlinin** at the *Center for Astrophysics | Harvard & Smithsonian*, funded by
the Smithsonian Institution, the Chandra X-ray Science Center, and NASA's
Universe of Learning. This fork gratefully builds on their work.

From **v3.10**, JS9 is maintained by **Omer Oreg** (Weizmann Institute of
Science, Particles & Astrophysics Department) — <https://sarhatabaot.net>.

> Site branding, links, and attribution live in one place for maintainers:
> [`docs/_data/site.mjs`](docs/_data/site.mjs). Keep this section in sync with it.
