/*
 *
 * JS9: astronomical image display everywhere (December 10, 2012)
 *
 * Principals: Eric Mandel, Alexey Vikhlinin
 * Organization: Center for Astrophysics | Harvard & Smithsonian, Cambridge MA
 * Contact: emandel@cfa.harvard.edu
 *
 * Copyright (c) 2012 - 2022 Smithsonian Astrophysical Observatory
 *
 */

/*global JS9Prefs, JS9Inline, $, jQuery, fabric, io, sprintf, Astroem, dhtmlwindow, saveAs, Spinner, ResizeSensor, Jupyter, gaussBlur, ImageFilters, Plotly, tinycolor, regSelect */

"use strict";

// ensure Emscripten's Module object is available so we can pass properties
// (e.g. wasmBinary) in js9prefs.js and during JS9.init()
// (use var to add to global scope because it's how Emscripten does it)
var Module;
if( typeof Module !== "object" ){ Module = {}; }

// generate and expose JS9 module
// (use var to add to global scope for backward compatibility with previous ES5)
var JS9 = (function(){

// module header
const JS9 = {};
JS9.NAME = "JS9";		// The name of this namespace
JS9.VERSION = "3.9";		// The version of this namespace
JS9.COPYRIGHT = "Copyright (c) 2012-2024 Smithsonian Institution";
JS9.ABOUT = `JS9 ${JS9.VERSION}: astronomical image display everywhere\nEric Mandel, Alexey Vikhlinin\n${JS9.COPYRIGHT}`;

// internal defaults (not usually changed by users)
JS9.DEFID = "JS9";		// default JS9 display id
JS9.WIDTH = 512;	        // width of js9 canvas
JS9.HEIGHT = 512;		// height of js9 canvas
JS9.ANON = "Anonymous";		// name to use for images with no name
JS9.PREFSFILE = "js9Prefs.json";// prefs file to load
JS9.WORKERFILE = "js9worker.js";// js9 web worker file to load
JS9.ZINDEX = 0;			// z-index of image canvas: on bottom of js9
JS9.SHAPEZINDEX = 4;		// base z-index of shape layers layers
JS9.MESSZINDEX = 80;		// z-index of messages: above graphics
JS9.BTNZINDEX =  90;		// z-index of buttons on top of plugin canvases
JS9.MENUZINDEX = 1000;		// z-index of menus: always on top!
JS9.COLORSIZE = 1024;		// size of contrast/biased color array
JS9.SCALESIZE = 16384;		// size of scaled color array
JS9.INVSIZE = 1024;		// size of inverse array
JS9.HISTSIZE = 16384;		// size of histogram equalization array
JS9.INSTALLDIR="";		// prefix to get to js9 install directory
JS9.TOROOT="";			// prefix to get to data file from install
JS9.PLUGINS="";			// regexp list of plugins
JS9.LIGHTWIN = "dhtml";		// light window type: choice of dhtml
JS9.ANTIALIAS = false;		// use anti-aliasing?
JS9.SCALEIREG = true;		// scale interactive regions by zoom factor?
JS9.NOMOVE = 3;			// number of pixels before we recognize movement
JS9.DBLCLICK0 = 5;		// < millisec => same event
JS9.DBLCLICK = 300;		// < millisec => double-click
JS9.TIMEOUT = 250;              // millisec before assuming light window is up
JS9.SPINOUT = 250;		// millisec before assuming spinner is up
JS9.WORKEROUT = 2000;           // millisec before restarting worker socket
JS9.SUPERMENU = /^SUPERMENU_/;  // base of supermenu id
JS9.RESIZEDIST = 20;		// size of rectangle defining resize handle
JS9.RESIZEFUDGE = 5;            // fudge for webkit resize problems
JS9.RAWID0 = "raw0";		// default raw id
JS9.RAWIDX = "alt";		// default "alternate" raw id
JS9.IDFMT = "  (%s)";           // format for light window id
JS9.MINZOOM = 0.125;		// min zoom using scroll wheel
JS9.MAXZOOM = 32.0;		// max zoom using scroll wheel
JS9.ADDZOOM = 0.1;		// add/subtract amount per mouse wheel click
JS9.MODZOOM = 2;		// skip factor with wheel to avoid pileup
JS9.DIRZOOM = 1;		// sign (+/-) determines zoom direction
JS9.CHROMEFILEWARNING = true;	// whether to alert chrome users about file URI
JS9.CLIPBOARDERROR = "the local clipboard (which only holds data copied from within JS9) does not contain any content. Were you trying to paste something copied outside JS9?";
JS9.CLIPBOARDERROR2 = "the local clipboard (which only holds data copied from within JS9) does not contain any regions";
JS9.URLEXP = /^(https?|ftp):\/\//; // url to determine a web page
JS9.WCSEXP = /^(fk4|fk5|icrs|galactic|ecliptic|image|physical|linear)$/;
JS9.REGSIZE = 0;		// 0 -> cdelt, 1 -> ang sep (regions use #0)

JS9.useStatusbarDictionary = false;
// flag that is used to indicate that expandMacro should further use 
// the statusbar dictionary to expand its output

    
// https://hacks.mozilla.org/2013/04/detecting-touch-its-the-why-not-the-how/
JS9.TOUCHSUPPORTED = ({}.hasOwnProperty.call(window, "ontouchstart") || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
// modified from:
// http://stackoverflow.com/questions/2400935/browser-detection-in-javascript
// https://stackoverflow.com/questions/58019463/how-to-detect-device-name-in-safari-on-ios-13-while-it-doesnt-show-the-correct
JS9.BROWSER = (function(){
    const P = navigator.platform;
    const N = navigator.appName;
    const ua = navigator.userAgent;
    const tem = ua.match(/version\/([.\d]+)/i);
    let M = ua.match(/(opera|chrome|safari|firefox)\/?\s*(\.?\d+(\.\d+)*)/i);
    if( M && tem !== null ){ M[2] = tem[1]; }
    M = M? [M[1], M[2], P]: [N, navigator.appVersion,"-?", P];
    M.push(/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(ua) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    return M;
}());
// convenience to allow plugins to deal with HiDPI ratio blurring
// http://stackoverflow.com/questions/15661339/how-do-i-fix-blurry-text-in-my-html5-canvas
JS9.PIXEL_RATIO = (function(){
    const ctx = document.createElement("canvas").getContext("2d"),
          dpr = window.devicePixelRatio || 1,
          bsr = ctx.webkitBackingStorePixelRatio ||
                ctx.mozBackingStorePixelRatio ||
                ctx.msBackingStorePixelRatio ||
                ctx.oBackingStorePixelRatio ||
                ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
}());

// global options
