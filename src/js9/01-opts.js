JS9.globalOpts = {
    helperType: "none",		// one of: sock.io, get, post, none
    helperPort: 2718,		// default port for node.js helper
    requireHelper: false,       // throw error if helper is not available?
    allinoneHelper: false,      // allow allinone to use helper?
    processQueryParams: true,   // process query parameters from url?
    quietReturn: false,         // should API return empty string or "OK"?
    useWasm: true,		// use WebAssembly if available?
    transforms: ["flip", "rot90", "rotate"], // order for processing transforms
    rotateRelative: false,	// is setRotate() relative or absolute?
    clickToFocus: false,	// how to change focus on the display
    winType: "light",		// plugin window: "light" or "new"
    sortPreloads: true,         // sort preloads into original order after load?
    defcolor: "#00FF00",	// graphics color when all else fails
    fits2fits: "never",		// convert to repfile? always|never|size>x Mb
    requireFits2Fits: false,    // throw error if fits2fits can't be run?
    localAccess: true,		// access files locally, when available?
    prependJS9Dir: true,        // prepend $JS9_DIR to relative fitsFile paths?
    dataDir: null,              // path to FITS data (def: use incoming path)
    alerts: true,		// set to false to turn off alerts
    valposTarget: null,         // target element for valpos updates
    valposWidth: "medium",      // small, medium, large
    valposDCoords: false,	// show display coords in valpos?
    internalValPos: true,	// a fancy info plugin can turns this off
    internalContrastBias: true,	// a fancy colorbar plugin can turns this off
    containContrastBias: false, // contrast/bias only when mouse is in display?
    arrowIncrement: 1,          // how much to move a region using arrow keys
    wcsCrosshair: false,	// enable wcs crosshair matching?
    localLoadFormat: "image",	// current format when loading local files
    remoteLoadMethod: "proxy",	// proxy or cors when loading remote file
    csvIncludeWCS: true,	// does Get/SaveRegions(csv) include wcs info?
    regWhichDefault: "auto",	// "auto" => selected or all, "all" is all
    regIncludeJSON: true,	// does SaveRegions(reg) include the json info?
    regIncludeComments: true,	// does SaveRegions(reg) include the comments?
    regListDCoords: false,	// ListRegions(reg) list preserved disp coords?
    regSaveDCoords: false,	// SaveRegions(reg) save preserved disp coords?
    regExpandDCoords: false,	// ExpandMacro(reg) use preserved disp coords?
    regCopyDCoords: true,	// CopyRegions(reg) copy preserved disp coords?
    regArrowCrosshair: true,	// does move with arrow keys display crosshair?
    regSaveWCS: "",		// def wcs for saving regions
    regSaveFormat: "reg",	// def format for saving regions (reg,cvs,svg)
    regSaveWhich1: "all",	// def 'which' for saving regions (all,selected)
    regSaveWhich2: "selected",	// def 'which' for saving in configure dialog
    regMenuCreate: true,	// menu select a region creates it immediately
    regMenuSelection: "circle",	// region selected during last menu select
    regToClipboard: false,	// copy all region changes to pseudo-clipboard?
    regGroupConflict: "skip",	// group conflicts: error or skip
    regConfigAddParens: true,	// does the reg configure gui try to add parens?
    regSyncTextColor: true,	// sync region text color with main color?
    regDisplay: "lightwin",	// "lightwin" or "display"
    reConfigSize: "medium",	// "small", "medium"
    htimeout:  10000,		// connection timeout for the helper connect
    lhtimeout: 10000,		// connection timeout for local helper connect
    ehtimeout: 500,		// connection timeout for Electron connect
    ehretries: 20,		// connection retries Electron connect
    xtimeout: 600000,		// connection timeout for fetch data requests
    extlist: "EVENTS STDEVT",	// list of binary table extensions
    imopts: "IMOPTS",           // basename of FITS param containing json opts
    imcmap: "IMCMAP",           // basename of FITS param containing cmaps
    table: {xdim: 4096, ydim: 4096, bin: 1, bitpix: 32},// image section size to extract from table
    image: {xdim: 4096, ydim: 4096, bin: 1},// image section size (unlimited=0)
    binMode: "s",               // "s" (sum) or "a" (avg) pixels when binning
    reprojSwitches: "",         // Montage reproject switches
    reprojectLimits: false,     // internal: check for reprojection limits?
    rotationCenter: "file",     // "current" display center or "file" (CRPIX1,2)
    runOnCR: true,              // Run forms such as binning when <cr> pressed?
    clearImageMemory: "heap",   // rm vfile: always|never|auto|noExt|noCube|size>x Mb heap=>free heap
    helperProtocol: location.protocol, // http: or https:
    reloadRefresh: false,       // reload an image will refresh (or redisplay)?
    reloadRefreshReg: true,     // reloading regions file removes previous?
    nextImageMask: false,	// does nextImage() show active image masks?
    panMouseThreshold: 1,	// pixels mouse must move before we pan
    panzoomRefreshLimit: 500,	// # of shapes before avoiding refresh
    panWithinDisplay: false,	// keep panned image within the display?
    pannerDirections: true,	// display direction vectors in panner?
    magnifierRegions: true,	// display regions in magnifier?
    editRegions: true,		// double-click to edit regions?
    svgBorder: true,		// border around the display when saving to svg?
    unremoveReg: 100,           // how many removed regions to save
    resetEmptyShapeId: false,	// reset nshape counter if all shapes removed?
    maxMemory: 2000000000,	// max heap memory to allocate for a fits image
    loadURL: "params/load.html",// location of param html file
    corsURL: "params/loadcors.html",       // location of param html file
    proxyURL: "params/loadproxy.html",     // location of param html file
    loadProxy: false,           // do we allow proxy load requests to server?
    imsectionURL: "params/imsection.html", // location of param html file
    postMessage: false,         // allow communication through iframes?
    localStorage: true,         // use localStorage for session params?
    waitType: "spinner",        // "spinner" or "mouse"
    spinColor: "#FF0000",       // color of spinner
    spinOpacity: 0.35,          // opacity of spinner
    resize: true,		// allow resize of display?
    resizeHandle: true,		// add resize handle to display?
    resizeRedisplay: true,	// redisplay image while resizing?
    logoDisplay: false,         // show JS9 logo on each display?
    logo: "images/js9logo.png", // show JS9 logo on each display?
    lightWinPos: "center=1",	// "left=n,top=m" offset from left,top of window
    lightWinClose: "ask",	// ask, close, move images when closing lightwin
    fallbackDisplay: true,	// displayMessage fallback to display window?
    refreshDragDrop: true,	// refresh on drag/drag and open file?
    reduceMosaic: "js9",        // "js9" or "shrink" ("js9" seems to be faster)
    internalRegcnts: true,      // make internal regcnts analysis available?
    reduceRegcnts: true,        // reduce image when doing counts in regions?
    plot3d: {cube:"*:*:all", mode:"avg", areaunits:"pixels", color: "green"}, // plot3d options: avg/sum, pixels/arcsecs
    imexamLineHeight: 1,        // "height" of line region section
    copyWcsPosFormat: "$ra $dec $sys", // format for copy wcs pos to clipboard
    floatPrecision: 6,          // precision for floatToString()
    mouseActions: ["display value/position", "change contrast/bias", "pan the image"],// 0,1,2 mousepress
    touchActions: ["display value/position", "change contrast/bias", "pan the image"],// 1,2,3 fingers
    keyboardActions: {
	a: "add last region selected in regions menu",
	b: "toggle selected region: source/background",
	c: "toggle crosshair",
	d: "send selected region to back",
	e: "toggle selected region: include/exclude",
	"M-e": "edit selected region(s)",
	i: "refresh image",
	I: "display full image",
	"M-i": "display selected cutouts",
	"M-k": "toggle keyboard actions plugin",
	l: "toggle active shape layers",
	"M-l": "new JS9 light window",
        m: "pan to mouse position",
	"M-m": "toggle mouse/touch plugin",
	"M-o": "open local file",
        P: "paste regions from local clipboard",
        p: "paste regions to current position",
	"M-,": "toggle preferences plugin",
	"M-p": "toggle preferences plugin",
	r: "copy region(s) to clipboard",
	s: "select region",
	S: "select all regions",
	"M-s": "toggle shape layers plugin",
	u: "undo remove of region(s)",
	U: "unselect all regions",
	x: "flip image around x axis",
	y: "flip image around y axis",
        "9": "rotate image by 90 degrees",
        "/": "copy wcs position to clipboard",
        "?": "copy value and position to clipboard",
	"0": "reset zoom",
	"=": "zoom in",
	"+": "zoom in",
	"-": "zoom out",
	"^": "raise region layer to top",
	">": "display next image",
	"<": "display previous image",
	"delete": "remove selected region",
	"leftArrow": "move region/position left",
	"upArrow": "move region/position up",
	"rightArrow": "move region/position right",
	"downArrow": "move region/position down"
    }, // keyboard actions
    mousetouchZoom: false,	// use mouse wheel, pinch to zoom?
    mousetouchLimit: true,	// limit zoom-out to size of image?
    metaClickPan: true,         // metaKey + click pans to mouse position?
    // statusBar: "$mag; $scale($scaleclipping); $img(images/voyager/color_$colormap.png) $colormap; $wcssys; $image",  // status display
    statusBar: "$colorbar; $colormap; $mag; $scale ($scalemin,$scalemax); $wcssys; $image0",  // status display
    statusBarDictionary: {},
    toolbarTooltips: false,     // display tooltips on toolbar?
    updateTitlebar: true,	// update titlebar when image changes?
    centerDivs: ["JS9Menubar"], // divs which take part in JS9.Display.center()
    resizeDivs: ["JS9Menubar", "JS9Colorbar", "JS9Toolbar", "JS9Statusbar"], // divs which take part in JS9.Display.resize()
    pinchWait: 8,		// number of events to wait before testing pinch
    pinchThresh: 6,		// threshold for pinch test
    xeqPlugins: true,		// execute plugin callbacks?
    extendedPlugins: true,	// enable extended plugin support?
    intensivePlugins: false,	// enable intensive plugin support?
    dynamicSelect: "click",     // dynamic plugins: "click", "move", or false
    dynamicHighlight: true,     // highlight dynamic selection
    corsProxy:  "https://js9.si.edu/cgi-bin/CORS-proxy.cgi",   // CORS proxy
    simbadProxy:"https://js9.si.edu/cgi-bin/simbad-proxy.cgi", // simbad proxy
    cgiProxy:   "https://js9.si.edu/cgi-bin/FITS-proxy.cgi",   // CGI proxy
    catalogs:   {ras: ["RA", "_RAJ2000", "RAJ2000"],  // cols to search for ..
		 decs: ["Dec", "_DEJ2000", "DEJ2000"],// when loading catalogs
		 shape: "circle",                     // object shape
		 color: "yellow",                     // object color
		 width: 7,                            // box object width
		 height: 7,                           // box object height
		 radius: 3.5,                         // circle object radius
		 r1: 5.0,                             // ellipse object r1
		 r2: 3.5,                             // ellipse object r2
		 wcssys: "ICRS",                      // wcs system
		 skip: "#\n",                         // skip # and blank lines
		 save: true,                          // save cat cols in shapes
		 tooltip: "$data.ra $data.dec"}, // tooltip format
    topColormaps: ["grey", "heat", "cool", "turbo", "viridis", "magma", "sls", "red", "green", "blue"], // toplevel colormaps
    infoBox: ["file", "object", "wcsfov", "wcscen", "wcspos", "impos", "physpos", "value", "regions", "progress"],
    infoBoxResize: true,                              // is size based on wcs?
    menuBar: ["file", "edit", "view", "zoom", "scale", "color", "region", "wcs", "analysis", "help"],
    menubarStyle: "classic",                          // mac or classic
    menuPosition: "right-5 bottom-5",                 // where menus pop up
    menuClickEvent: "mouseup",                        // "click" or "mouseup"
    menuSelected: "check",                            // selected option icon
    menuImages: true,                                 // show pngs in menu?
    userMenus: false,                                 // add user menus?
    userMenuDivider: "&nbsp;&nbsp;&nbsp;",            // divide before user menu
    imagesFileSubmenu: 5,        // how many images trigger a submenu?
    toolBar: ["annulus", "box", "circle", "ellipse", "line", "polygon", "text", "zoom+", "zoom-", "zoom1", "zoomtofit"],
    syncOps: ["alignment","colormap","contrastbias","flip","pan","regions","rotate", "rot90","scale","wcs","zoom"],                                         // which ops are sync'ed?
    syncReciprocate: true,       // default value for reciprocal sync'ing
    syncWCS: true,               // default value for using WCS to sync
    hiddenPluginDivs: [],        // which static plugin divs start hidden
    separate: {layout: "auto", leftMargin: 10, topMargin: 10}, // separate a display
    imageTemplates: ".fits,.fts,.png,.jpg,.jpeg,.fz,.ftz,.gz", // templates for local images
    wcsUnits: {FK4:"sexagesimal", FK5:"sexagesimal", ICRS:"sexagesimal",
	       galactic:"degrees", ecliptic:"degrees", linear:"degrees",
	       physical:"pixels", image:"pixels"}, // def units for wcs sys
    wcsSetUpdatesDef: true,          // does setWCSUnits() update the default?
    wcsHlength: 256000,		     // hlength passed to astroem wcsninit()
    regTemplates: ".reg",	     // templates for local region file input
    sessionTemplates: ".ses,.js9ses",// templates for local session file input
    colormapTemplates: ".cmap",      // templates for local colormap file input
    catalogTemplates: ".cat,.tab",   // templates for local catalog file input
    localTemplates: ".fits,.fts",    // templates for local file access
    controlsMatchRegion: false,      // true, false, "corner" or "border"
    internalColorPicker: true,       // use HTML5 color picker, if available?
    newWindowWidth:  530,	     // width of LoadWindow("new")
    newWindowHeight: 625,	     // height of LoadWindow("new")
    debug: 0		             // debug level
};

// favorites are used in dialog boxes and control boxes
JS9.favorites = {
    scales: ["linear", "log", "histeq"],
    colormaps: ["cool", "heat", "viridis", "magma"],
    regions: ["annulus", "box", "circle", "ellipse"],
    wcs: ["FK5", "ICRS", "galactic:Galactic", "physical", "image"]
//  you can specify a display string using a colon-separated string or array:
//  wcs: ["FK5:fk5", ["ICRS","icrs"], "galactic", "physical", "image"]
};

// desktop (i.e. Electron.js) defaults
// always wrap access in if( window.electron ){}
JS9.desktopOpts = {
    currentPath: true,              // files relative to current dir?
    sessionPath: true               // session files relative to session file?
};

// image param defaults
JS9.imageOpts = {
    inherit: false,			// inherit props from previous image?
    contrast: 1.0,			// default color contrast
    bias: 0.5,				// default color bias
    invert: false,			// default colormap invert
    exp: 1000,				// default exp value for scaling
    colormap: "grey",			// default color map
    overlay: true,			// display png/jpeg overlay?
    scale: "linear",			// default scale algorithm
    scaleclipping: "dataminmax",	// "dataminmax", "zscale", or "user" (when scalemin, scalemax is supplied)
    scalemin: Number.NaN,               // default scale min is undefined
    scalemax: Number.NaN,               // default scale max is undefined
    flip: "none",                       // default flip state
    rot90: 0,	                        // default 90 deg rotation state
    rotate: 0,	                        // default rotation state
    zscalecontrast: 0.25,		// default from ds9
    zscalesamples: 600,			// default from ds9
    zscaleline: 120,			// default from ds9
    wcssys: "native",			// default WCS sys
    lcs: "physical",			// default logical coordinate system
    valpos: true,			// whether to display value/position
    sigma: "none",			// gauss blur sigma or none
    opacity: 1.0,			// opacity between 0 and 1
    alpha:  255,                        // alpha for image (but use opacity!)
    nancolor: "#000000",		// 6-digit #hex color for NaN values
    nocolor: {red:0,green:0,blue:0,alpha:0} , // static color map no color
    // xcen: 0,                         // default x center pos to pan to
    // ycen: 0,                         // default y center pos to pan to
    zoom: 1,				// default zoom factor
    zooms: 6,				// how many zooms in each direction?
    topZooms: 2,			// how many zooms are at top level?
    wcsalign: true,			// align image using wcs after reproj?
    rotationMode: "relative",		// default: relative or absolute?
    crosshair: false,			// enable crosshair?
    disable: [],			// list of disabled core services
    ltvbug:  false,			// add 0.5/ltm to image LTV values?
    listonchange: false,		// whether to list after a reg change
    whichonchange: "selected"		// which to list ("all" or "selected")
};

// allows regions opts (in Regions.opts) to be overridden via js9prefs.js
JS9.regionOpts = {};
// allows catalog opts (in Catalogs.opts) to be overridden via js9prefs.js
JS9.catalogOpts = {};
// allows crosshair opts (in Crosshair.opts) to be overridden via js9prefs.js
JS9.crosshairOpts = {};
// allows grid opts (in Grid.opts) to be overridden via js9prefs.js
JS9.gridOpts = {};
// allows emscripten opts (in Module) to be overridden via js9prefs.js
JS9.emscriptenOpts = {};
// allows fabric opts (in Fabric.opts) to be overridden via js9prefs.js
JS9.fabricOpts = {};
// socket.io options
JS9.socketioOpts = {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax : 10000,
    reconnectionAttempts: 100,
    timeout: JS9.globalOpts.htimeout
};
// defaults for blending
JS9.blendOpts = {
    active: true,
    mode: "screen",
    opacity: 1.0
};

// defaults for masking
JS9.maskOpts = {
    active: false,
    mode: "overlay",  // "overlay", "mask", "opacity"
    opacity: 1,       // overlay opacity
    vopacity: 0,      // mask opacity
    value: 0,         // mask value
    syncops: ["flip", "pan", "rot90", "zoom"],
    invert: false
};

// defaults for analysis (macro expansion)
JS9.analOpts = {
    // if this pattern is matched in stderr, throw a real error
    epattern: /^(ERROR:[^\n]*)\n/,
    // location of datapath's param html file
    dpathURL: "params/datapath.html",
    // location of filepath's param html file
    fpathURL: "params/filepath.html"
};

// light window opts
JS9.lightOpts = {
    nclick: 0,
    dhtml: {
	topid:    "#dhtmlwindowholder",
	top:      ".dhtmlwindow",
	drag:     ".drag-contentarea",
	dragBar:  ".drag-handle",
	format:   "width=%spx,height=%spx,resize=%s,scrolling=0",
	textWin:  "width=830px,height=400px,resize=1,scrolling=1",
	// NB: dimensions are tied to .JS9Plot CSS params
	plotWin:  "width=830px,height=420px,resize=1,scrolling=1",
	dpathWin: "width=830px,height=175px,resize=1,scrolling=1",
	lcloseWin:"width=512px,height=190px,resize=1,scrolling=1",
	paramWin: "width=830px,height=235px,resize=1,scrolling=1",
	regWin0:  "width=640px,height=130px,resize=1,scrolling=1",
	regWin1:  "width=640px,height=200px,resize=1,scrolling=1",
	regWin:   "width=640px,height=470px,resize=1,scrolling=1",
	imageWin: "width=512px,height=598px,resize=1,scrolling=1",
	lineWin:  "width=400px,height=60px,resize=1,scrolling=1"
    },
    lcloseURL: "params/lightclose.html"
};

// colors for text messages
JS9.textColorOpts = {
    regions: "#00FF00",
    info:    "#00FF00",
    inimage: "#000000"
};

// help pages
JS9.helpOpts = {
    user: {
	heading: "JS9Help",
	type: "help", url:"user.html",
	title: "User Manual"
    },
    install: {
	heading: "JS9Help",
	type: "help", url:"install.html",
	title: "Installing JS9"
    },
    webpage: {
	heading: "JS9Help",
	type: "help", url:"webpage.html",
	title: "Adding JS9 to a Web Page"
    },
    yourdata: {
	heading: "JS9Help",
	type: "help", url:"yourdata.html",
	title: "Adding Data to a Web Page"
    },
    localtasks: {
	heading: "JS9Help",
	type: "help", url:"localtasks.html",
	title: "Adding Local Analysis Tasks and Plugins"
    },
    helper: {
	heading: "JS9Help",
	type: "help", url:"helper.html",
	title: "Adding Server-side Analysis Tasks"
    },
    serverside: {
	heading: "JS9Help",
	type: "help", url:"serverside.html",
	title: "Server-side Analysis with JS9"
    },
    publicapi: {
	heading: "JS9Help",
	type: "help", url:"publicapi.html",
	title: "The JS9 Public API"
    },
    extmsg: {
	heading: "JS9Help",
	type: "help", url:"extmsg.html",
	title: "External Messaging"
    },
    desktop: {
	heading: "JS9Help",
	type: "help", url:"desktop.html",
	title: "JS9 on the Desktop"
    },
    python: {
	heading: "JS9Help",
	type: "help", url:"python.html",
	title: "JS9 with Python and Jupyter"
    },
    archives: {
	heading: "JS9Help",
	type: "help", url:"archives.html",
	title: "Accessing Data Archives"
    },
    preferences: {
	heading: "JS9Help",
	type: "help", url:"preferences.html",
	title: "Setting Site Preferences"
    },
    regions: {
	heading: "JS9Help",
	type: "help", url:"regions.html",
	title: "Regions Format"
    },
    changelog: {
	heading: "JS9Help",
	type: "help", url:"changelog.html",
	title: "ChangeLog"
    },
    repfile: {
	heading: "JS9Help",
	type: "help", url:"repfile.html",
	title: "Dealing with Large Files"
    },
    memory: {
	heading: "JS9Help",
	type: "help", url:"memory.html",
	title: "Dealing with Memory Limitations"
    },
    issues: {
	heading: "JS9Help",
	type: "help", url:"knownissues.html",
	title: "Known Issues"
    },
    security: {
	heading: "JS9Help",
	type: "help", url:"securityissues.html",
	title: "Security Issues"
    }
};

// containers for groups of JS9 objects
JS9.images = [];		// array of current images
JS9.displays = [];		// array of current display canvases
JS9.colormaps = [];		// array of current colormaps
JS9.commands = [];		// array of commands
JS9.plugins = [];		// array of defined plugins
JS9.preloads = [];		// array of images to preload
JS9.auxFiles = [];		// array of auxiliary files
JS9.supermenus = [];		// array containing supermenu instances
JS9.preloadwaiting = [];	// array of images currently being preloaded
JS9.publics = {};		// object containing defined public API calls
JS9.helper = {};		// only one helper per page, please
JS9.fits = {};			// object holding FITS access routines
JS9.userOpts = {};		// object to hold localStorage opts
JS9.tmp = {};			// global temp area
// misc params
// list of scales in mkScaledCells
JS9.scales = ["linear", "log", "histeq", "power", "sqrt", "squared", "asinh", "sinh"];

// list of known wcs systems
JS9.wcssyss = ["FK4", "FK5", "ICRS", "galactic", "ecliptic",
	       "physical", "image", "native"];

// list of known wcs units
JS9.wcsunitss = ["degrees", "sexagesimal", "pixels"];

// list of known regions
JS9.regions = ["annulus", "box", "circle", "cross", "ellipse", "line", "point",
	       "polygon", "text"];

// known bugs and work-arounds
JS9.bugs = {};
// sometimes hiding the menu does not refresh the image properly
// JS9.bugs.hide_menu = true;
// turned off: 6/30/16
JS9.bugs.hide_menu = false;
// firefox does not repaint as needed (last checked FF 24.0 on 10/20/13)
if( (JS9.BROWSER[0] === "Firefox") && JS9.BROWSER[2].search(/Linux/) >=0 ){
    JS9.bugs.firefox_linux = true;
}
// webkit resize is not quite up to par
// if( (JS9.BROWSER[0] === "Chrome") || (JS9.BROWSER[0] === "Safari") ){
// only safari seems to need the extra border (4/18/20)
if( (JS9.BROWSER[0] === "Safari") ){
    JS9.bugs.webkit_resize = true;
}

// wasm broken in ios 11.2.2, 11.2.5 and on, fixed in 11.3beta1 (1/22/2018)
// see: https://github.com/kripken/emscripten/issues/6042
if( /iPad|iPhone|iPod/.test(navigator.platform) &&
    /11_2_(?:[2-9])/.test(navigator.userAgent)  ){
    JS9.globalOpts.useWasm = false;
}
// iOS and presumably android has severe memory limits (05/2017)
// also force user to turn on crosshair, since it works with one finger
// also, iOS requires wider region dialog boxes to fit the buttons
if( JS9.BROWSER[3] ){
    JS9.globalOpts.maxMemory = Math.min(JS9.globalOpts.maxMemory, 350000000);
    JS9.globalOpts.table.xdim = 2048;
    JS9.globalOpts.table.ydim = 2048;
    JS9.globalOpts.image.xdim = 2048;
    JS9.globalOpts.image.ydim = 2048;
    JS9.imageOpts.crosshair = false;
    JS9.globalOpts.reproj = {xdim: 2048, ydim: 2048};
    JS9.lightOpts.dhtml.regWin0="width=660px,height=130px,resize=1,scrolling=1";
    JS9.lightOpts.dhtml.regWin1="width=660px,height=200px,resize=1,scrolling=1";
    JS9.lightOpts.dhtml.regWin="width=660px,height=470px,resize=1,scrolling=1";
}
// Jupyter doesn't seem to be able to load wasm (7/4/2018)
if( {}.hasOwnProperty.call(window, "Jupyter") ){
    JS9.globalOpts.useWasm = false;
}
// JS9 desktop app using Electron.js
if( window.electron ){
    // Emscripten mount point for local file system, based on hostname
    if( window.electron.hostFS ){
	JS9.hostFS = window.electron.hostFS;
    }
    // if multiple instances are running, turn off localStorage
    if( window.electron.multiElectron ){
	JS9.globalOpts.localStorage = false;
    }
    // once recommended by Electron, they removed this by 8.0.0
    // still seems worthwhile, but let's put it here instead of passing it in
    if( typeof window.eval === "function" ){
	window.eval = function(){
	    throw new Error('For security reasons, Desktop JS9 does not support window.eval()');
	}
    }
    // cmdlineOpts are opts used by the app to specify the command line
    if( window.electron.cmdlineOpts ){
	try{ JS9.cmdlineOpts = JSON.parse(window.electron.cmdlineOpts); }
	catch(e){ delete JS9.cmdlineOpts; }
    }
    // guiOpts used mainly by Voyager
    if( window.electron.guiOpts ){
	// voyager mode?
	JS9.Voyager=window.electron.guiOpts.voyager;
	// change root to local dir for dialogs?
	JS9.localRootDir=window.electron.guiOpts.localRootDir;
    }
}

// ---------------------------------------------------------------------
// JS9 Image object to manage images
// ---------------------------------------------------------------------

