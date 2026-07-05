JS9.Crosshair = {};
JS9.Crosshair.CLASS = "JS9";
JS9.Crosshair.NAME = "Crosshair";
JS9.Crosshair.LAYERNAME = "crosshair";

// defaults for crosshair layer
JS9.Crosshair.opts = {
    // override fabric defaults
    hasControls: false,
    hasRotatingPoint: false,
    hasBorders: false,
    // evented: false,
    // user does not move the crosshair
    lockMovementX: true,
    lockMovementY: true,
    lockRotation: true,
    lockScalingX: true,
    lockScalingY: true,
    lockUniScaling: true,
    selectable: false,
    // canvas options
    canvas: {
	selection: false
    },
    // don't update WCS strings
    updateWCS: false,
    // pan and zoom enabled
    panzoom: false,
    // width and height when displaying arrow-key crosshair
    arrowSize: 14,
    // general
    strokeWidth: 1,
    // stroke color
    color: "#00FF00",
    // should overlapping shapes be sorted (smallest on top)?
    sortOverlapping: false,
    // where the crosshair is placed in order to hide it
    hiddenPts: {pts: [{x: -9999, y: -9999}, {x: -9999, y: -9900}]}
};

// display: display crosshair as the mouse moves
// eslint-disable-next-line no-unused-vars
JS9.Crosshair.display = function(im, ipos, evt){
    let i, s, arr, cim, ra, dec, w, h, x, y, hopts, vopts, shift, size;
    const layername = JS9.Crosshair.LAYERNAME;
    // sanity check
    if( !im ){ return; }
    // for computers, shift key must be down
    // for ipad, assume always true
    if( /iPad|iPhone|iPod/.test(navigator.platform) ){
	shift = true;
    } else {
	shift = evt.shiftKey;
    }
    // always do arrow crosshair, otherwise:
    // exit if crosshair is not enabled for this image
    // exit if we are not actively tracking the crosshair via shift
    if( !im.tmp.arrowCrosshair &&
	(!shift || im.tmp.shiftKey || !im.crosshair || !im.params.crosshair) ){
	return;
    }
    if( im.tmp.arrowCrosshair && !im.params.crosshair ){
	// special crosshair used with arrow keys
	size = JS9.Crosshair.opts.arrowSize / im.rgb.sect.zoom;
	x = ipos.x - size;
	w = ipos.x + size;
	y = ipos.y - size;
	h = ipos.y + size;
    } else {
	// default crosshair
	x = 0;
	w = im.raw.width;
	y = 0;
	h = im.raw.height;
    }
    // draw the crosshair, centered on the image pos
    hopts = {pts: [{x: x, y: ipos.y}, {x: w, y: ipos.y}], redraw: false};
    im.changeShapes(layername, im.crosshair.h, hopts);
    vopts = {pts: [{x: ipos.x, y: y}, {x: ipos.x, y: h}], redraw: true};
    im.changeShapes(layername, im.crosshair.v, vopts);
    im.crosshair.visible = true;
    // if crosshair mode is on and this image has wcs ...
    if( JS9.globalOpts.wcsCrosshair && im.validWCS() ){
	// get wcs coords of current mouse position
	arr = JS9.pix2wcs(im.raw.wcs, ipos.x, ipos.y).trim().split(/\s+/);
	ra = JS9.saostrtod(arr[0]);
	if( JS9.isHMS(im.params.wcssys) ){
	    ra *= 15.0;
	}
	dec = JS9.saostrtod(arr[1]);
	// for each displayed image ...
	for(i=0; i<JS9.displays.length; i++){
	    cim = JS9.displays[i].image;
	    if( cim && cim !== im                     &&
		cim.crosshair && cim.params.crosshair &&
		cim.validWCS()                        ){
		// if the ra, dec pos is on this image, display crosshair
		w = cim.raw.width;
		h = cim.raw.height;
		// convert wcs pos to image pos for this image
		// trap uncaught errors => we were way off scale
		try{ s = JS9.wcs2pix(cim.raw.wcs, ra, dec); }
		catch(e){ s = null; }
		if( s ){
		    arr = s.trim().split(/\s+/);
		    x = parseFloat(arr[0]);
		    y = parseFloat(arr[1]);
		    // if image pos is within the image boundaries ...
		    if( x > 0 && x < w && y > 0 && y < h ){
			// draw the crosshair, centered on the image pos
			hopts = {pts: [{x: 0, y: y}, {x: w, y: y}],
				 redraw:false};
			cim.changeShapes(layername, cim.crosshair.h, hopts);
			vopts = {pts: [{x: x, y: 0}, {x: x, y: h}],
				redraw: true};
			cim.changeShapes(layername, cim.crosshair.v, vopts);
			cim.crosshair.visible = true;
		    }
		}
	    }
	}
    }
};

// hide: move the crosshair out of the display
// eslint-disable-next-line no-unused-vars
JS9.Crosshair.hide = function(im, ipos, evt){
    const layername = JS9.Crosshair.LAYERNAME;
    const opts = JS9.Crosshair.opts.hiddenPts;
    // sanity check
    if( !im ){ return; }
    // if the crosshair is visible ...
    if( (im.crosshair && im.crosshair.visible) ||
	im.tmp.arrowCrosshairVisible           ){
	// move it off the display
	im.changeShapes(layername, im.crosshair.h, opts);
	im.changeShapes(layername, im.crosshair.v, opts);
	im.crosshair.visible = false;
	delete im.tmp.arrowCrosshairVisible;
    }
};

// image load: create the cross hair for this image
JS9.Crosshair.create = function(im){
    const opts = JS9.Crosshair.opts.hiddenPts;
    const layername = JS9.Crosshair.LAYERNAME;
    // sanity check
    if( !im ){ return; }
    if( !im.crosshair ){
	// create the crosshair object for this image
	im.crosshair = {};
	// create the crosshair, but don't display it yet
	im.crosshair.h = im.addShapes(layername, "line", opts);
	im.crosshair.v = im.addShapes(layername, "line", opts);
	im.crosshair.visible = false;
    }
};

// mark key actions which use the shift key
JS9.Crosshair.keyaction = function(im, ipos, evt){
    if( im && evt && evt.shiftKey ){
	im.tmp.shiftKey = true;
    }
};

// unmark key action-based shift key use
JS9.Crosshair.keyup = function(im, ipos, evt){
    // remove shiftKey marker, if necessary
    if( im && im.tmp.shiftKey && evt && !evt.shiftKey ){
	delete im.tmp.shiftKey;
    }
};

// init: create the shape layer for this display
JS9.Crosshair.init = function(){
    let i;
    const layername = JS9.Crosshair.LAYERNAME;
    // init the crosshair shape layer, but only once per display
    for(i=0; i<JS9.displays.length; i++){
	if( !JS9.displays[i].layers.crosshair ){
	    JS9.displays[i].newShapeLayer(layername, JS9.Crosshair.opts);
	}
    }
    return this;
};

// toggle display of crosshair
JS9.Image.prototype.toggleCrosshair = function(){
    this.params.crosshair = !this.params.crosshair;
    if( !this.params.crosshair ){
        JS9.Crosshair.hide(this);
    }
};

// toggle display of wcs crosshair
JS9.Image.prototype.toggleWCSCrosshair = function(){
    JS9.globalOpts.wcsCrosshair = !JS9.globalOpts.wcsCrosshair;
};

// ---------------------------------------------------------------------
// Grid object displays a wcs coordinate grid
// ---------------------------------------------------------------------

