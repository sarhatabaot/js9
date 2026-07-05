// JS9 site preferences (loaded by the web page before js9.js).
//
// Deployment mode is chosen here via globalOpts.helperType:
//   "none"   -> client-side / static site (default): everything runs in the
//               browser via the astroem WebAssembly engine; no back end.
//   "nodejs" -> also run the Node helper (server/js9Helper.js) for server-side
//               analysis tasks, the CORS proxy, and server file saving.
// See help/deployment.html for the trade-offs. To enable the helper, set
// helperType to "nodejs" and loadProxy to true, then start the helper.
var JS9Prefs = {
    "globalOpts": {
        "helperType":       "none",
        "helperPort":       2718,
        "helperCGI":        "./cgi-bin/js9/js9Helper.cgi",
        "debug":            0,
        "loadProxy":        false,
        "workDir":          "./tmp",
        "workDirQuota":     100,
        "dataPath":         "$HOME/Desktop:$HOME/data",
        "analysisPlugins":  "./analysis-plugins",
        "analysisWrappers": "./analysis-wrappers"
    },
    "imageOpts": {
	"colormap":         "grey",
	"scale":            "linear"
    }
}
