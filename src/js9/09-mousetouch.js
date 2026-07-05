// create our namespace, and specify some meta-information and params
JS9.MouseTouch = {};
JS9.MouseTouch.CLASS = "JS9";       // class of plugin
JS9.MouseTouch.NAME = "MouseTouch"; // name of this plugin
JS9.MouseTouch.WIDTH =  512;	    // width of light window
JS9.MouseTouch.HEIGHT = 220;	    // height of light window
JS9.MouseTouch.BASE = JS9.MouseTouch.CLASS + JS9.MouseTouch.NAME;

JS9.MouseTouch.mouseText = [];
JS9.MouseTouch.mouseText[0] = "Move mouse, no buttons pressed:";
JS9.MouseTouch.mouseText[1] = "Move mouse, primary button pressed:";
JS9.MouseTouch.mouseText[2] = "Move mouse, secondary button pressed:";

JS9.MouseTouch.touchText = [];
JS9.MouseTouch.touchText[0] = "Touch move, with one finger:";
JS9.MouseTouch.touchText[1] = "Touch move, with two fingers:";
JS9.MouseTouch.touchText[2] = "Touch move, with three fingers:";

JS9.MouseTouch.textHTML="<div style='float: left'>%s</div>";

JS9.MouseTouch.actionHTML="<div style='float: left'><b>%s</b></div>";

// get an id based on the action
JS9.MouseTouch.actionid = function(cname, aname){
    return (`${cname}_${aname}`).replace(/[^A-Za-z0-9_]/g, "_");
};

// add to the text descriptions
JS9.MouseTouch.addText = function(container, text){
    let s, divjq;
    // create the html for this action
    s = sprintf(JS9.MouseTouch.textHTML, text);
    // add text html to the text container
    divjq = $("<div>")
	.addClass(`${JS9.MouseTouch.BASE}Text`)
	.html(s)
	.appendTo(container);
    return divjq;
};

// add to the sortable action list
JS9.MouseTouch.addAction = function(container, cname, aname){
    let s, id, divjq;
    id = JS9.MouseTouch.actionid(cname, aname);
    // create the html for this action
    s = sprintf(JS9.MouseTouch.actionHTML, aname);
    // add action html to the action container
    divjq = $("<div>")
	.addClass(`${JS9.MouseTouch.BASE}Action`)
	.attr("id", id)
	.html(s)
	.appendTo(container);
    return divjq;
};

// display value/position
// eslint-disable-next-line no-unused-vars
JS9.MouseTouch.isPinch = function(im, evt){
    let i, display, dist, pinc, pdec;
    const npinch = JS9.globalOpts.pinchWait;
    const pthresh = JS9.globalOpts.pinchThresh;
    // sanity check
    if( !im ){ return -1; }
    display = im.display;
    if( !JS9.globalOpts.mousetouchZoom || (im.pos.touches.length !== 2) ){
	return -1;
    }
    switch(display.ispinch ){
    case -1:
    case 1:
	return display.ispinch;
    }
    dist = Math.sqrt(((im.pos.touches[0].x - im.pos.touches[1].x)  *
		      (im.pos.touches[0].x - im.pos.touches[1].x))  +
		     ((im.pos.touches[0].y - im.pos.touches[1].y)  *
		      (im.pos.touches[0].y - im.pos.touches[1].y)));
    if( !display.dist0 ){
	 display.dist0 = dist;
    }
    display.deltas.push(Math.floor(dist - display.dist0));
    if( display.deltas.length >= npinch ){
	for(i=1, pinc=0, pdec=0; i<npinch; i++){
	    if(  display.deltas[i] > display.deltas[i-1] ){
		pinc++;
	    } else if(  display.deltas[i] < display.deltas[i-1] ){
		pdec++;
	    }
	}
	if( (pinc >= pthresh) || (pdec >= pthresh) ){
	    display.ispinch = 1;
	} else {
	    display.ispinch = -1;
	}
	display.lastzoom = 0;
	return display.ispinch;
    }
    // not sure yet
    return 0;
};

// ---------------------------------------------------------------------
//
// MouseTouch.Actions: callbacks when on mouse or touch movement
//
// for mouse: no click, primary click, secondary click
// for touch: 1, 2, or 3 fingers down
//
// the mouseActions and touchActions arrays in JS9.globalOpts determine
// the initial mapping of mouse/touch configuration to callback, e.g.:
//
//  JS9.globalOpts.mouseActions = ["display value/position", "change contrast/bias", "pan the image"];
//
// You can add your own to the Actions object, with titles in mouseText ...
// They are transferred to the display object.
//
// ---------------------------------------------------------------------
JS9.MouseTouch.Actions = {};

// display value/position
// eslint-disable-next-line no-unused-vars
JS9.MouseTouch.Actions["display value/position"] = function(im, ipos, evt){
    // special key: do nothing
    if( JS9.specialKey(evt) ){
	return;
    }
    // display pixel and wcs values
    if( JS9.globalOpts.internalValPos && im && ipos ){
	if( (ipos.x > 0) && (ipos.y > 0) &&
	    (ipos.x <= im.raw.width) && (ipos.y <= im.raw.height) ){
	    im.valpos = im.updateValpos(ipos, true);
	}
    }
};

// change contrast/bias
JS9.MouseTouch.Actions["change contrast/bias"] = function(im, ipos, evt){
    let x, y, pos, display;
    // skip contrast/bias change?
    if( !JS9.globalOpts.internalContrastBias || !im || !ipos ){
	return;
    }
    // skip if colormap is static
    if( im.cmapObj.type === "static" ){
	return;
    }
    // convenience variables
    display = im.display;
    // make sure we moved the mouse a bit
    if( im.pos0 && im.pos ){
	if( ((Math.abs(im.pos0.x-im.pos.x) < JS9.NOMOVE)  &&
	     (Math.abs(im.pos0.y-im.pos.y) < JS9.NOMOVE)) ){
	    return;
	}
    }
    // inside a region or with special key: no contrast/bias
    if( im.clickInRegion || JS9.specialKey(evt) ){
	return;
    }
    // if we have an RGB file or image overlay, no contrast/bias
    if( im.useOffScreenCanvas() ){
	return;
    }
    // get canvas position
    pos = JS9.eventToDisplayPos(evt, im.posOffset);
    // contrast/bias change
    x = Math.floor(pos.x + 0.5);
    y = Math.floor(pos.y + 0.5);
    // values only from within display window?
    if( JS9.globalOpts.containContrastBias ){
	if( (x < 0) || (y < 0) ||
	    (x >= display.canvas.width) || (y >= display.canvas.height) ){
	    return;
	}
    }
    im.params.bias = x / display.canvas.width;
    im.params.contrast = y / display.canvas.height * 10.0;
    // work-around for FF bug, not fixed as of 8/8/2012
    // https://bugzilla.mozilla.org/show_bug.cgi?id=732621
    if( JS9.bugs.firefox_linux ){
	window.setTimeout(() => {
	    im.displayImage("scaled", {blendMode: false});
	}, 0);
    } else {
	im.displayImage("scaled", {blendMode: false});
    }
    // hack: delete filterRGBImage from stash to avoid restore during reproject
    im.xeqStashDiscard("filterRGBImage");
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	im.xeqPlugins("image", "onchangecontrastbias");
    }
};

// stop action for contrast/bias: redisplay image
// eslint-disable-next-line no-unused-vars
JS9.MouseTouch.Actions["change contrast/bias"].stop = function(im, ipos, evt){
    // if blendMode is on, we have to redisplay
    if( im.display.blendMode ){
	im.displayImage("rgb");
    }
};

// zoom the image
JS9.MouseTouch.Actions["wheel zoom"] = function(im, evt){
    let ozoom, nzoom, maxzoom, key;
    let floor = JS9.globalOpts.panzoomRefreshLimit;
    let got = 0;
    const delta = evt.originalEvent.deltaY * Math.sign(JS9.DIRZOOM);
    // sanity check
    if( !im ){ return; }
    // is scroll to zoom turned on?
    if( !JS9.globalOpts.mousetouchZoom ){
	return;
    }
    // prevent pileup
    im.tmp.wheelzooms = im.tmp.wheelzooms || 0;
    if( im.tmp.wheelzooms++ % JS9.MODZOOM !== 0 ){
	return;
    }
    // current zoom
    ozoom = im.getZoom();
    // scroll by the delta
    if( delta < 0 ){
	nzoom = Math.min(JS9.MAXZOOM, ozoom + JS9.ADDZOOM);
    } else {
	nzoom = Math.max(JS9.MINZOOM, ozoom - JS9.ADDZOOM);
    }
    // stop zooming once full image is in the screen?
    if( JS9.globalOpts.mousetouchLimit ){
	maxzoom = Math.min(im.display.width/im.raw.width,
			   im.display.height/im.raw.height);
	if( maxzoom > nzoom && ozoom > nzoom ){
	    return;
	}
    }
    // a little rounding makes the zoom nicer
    nzoom = Math.round((nzoom + 0.00001) * 100) / 100;
    // see if any layers have many regions, thus requiring optimization
    for( key of Object.keys(im.layers) ){
	if( im.layers[key].show && im.layers[key].opts.panzoom ){
	    if( im.layers[key].canvas.size() > floor ){
		im.tmp.panzoomRefresh = im.tmp.panzoomRefresh || {};
		im.tmp.panzoomRefresh[key] = {};
		got++;
	    }
	}
    }
    // timeout to refresh layers
    if( im.tmp.panzoomTimeout ){
	clearTimeout(im.tmp.panzoomTimeout);
	delete im.tmp.panzoomTimeout;
    }
    if( got || im.tmp.panzoomRefresh ){
	im.tmp.panzoomTimeout = setTimeout(() => {
	    im.refreshLayers(im.tmp.panzoomRefresh);
	    delete im.tmp.panzoomRefresh;
	}, JS9.TIMEOUT);
    }
    // zoom the image
    im.setZoom(nzoom);
};

// pan the image
// eslint-disable-next-line no-unused-vars
JS9.MouseTouch.Actions["pan the image"] = function(im, ipos, evt){
    let dx, dy, temp, sect, pos, key;
    let thresh = JS9.globalOpts.panMouseThreshold;
    let floor = JS9.globalOpts.panzoomRefreshLimit;
    // sanity check
    if( !im ){ return; }
    sect = im.rgb.sect;
    // how much would we pan by?
    dx = ((im.pos0.x - im.pos.x) / sect.zoom);
    dy = ((im.pos0.y - im.pos.y) / sect.zoom);
    // pan the image (but avoid a redisplay, if we haven't moved much)
    if( Math.abs(dx) >= thresh || Math.abs(dy) >= thresh ){
	// flips will change the pan direction
	if( im.params.flip === "x" ){
	    dx = -dx;
	} else if( im.params.flip === "y" ){
	    dy = -dy;
	} else if( im.params.flip === "xy" ){
	    dx = -dx;
	    dy = -dy;
	}
	// rotations will change the pan direction
	if( im.params.rot90 === 90 ){
	    temp = dx;
	    dx = -dy;
	    dy = temp;
	} else if( im.params.rot90 === 180 ){
	    dx = -dx;
	    dy = -dy;
	} else if( im.params.rot90 === -90 ){
	    temp = dx;
	    dx = dy;
	    dy = -temp;
	}
	pos = {x: sect.xcen + dx, y: sect.ycen - dy};
	// rotations will change the pan position
	if( im.params.rotate ){
	    pos = JS9.rotatePoint(pos,
				  -im.params.rotate,
				  {x: sect.xcen, y: sect.ycen});
	}
	// see if any layers have many regions, thus requiring optimization
	for( key of Object.keys(im.layers) ){
	    if( im.layers[key].show && im.layers[key].opts.panzoom ){
		if( im.layers[key].canvas.size() > floor ){
		    im.tmp.panzoomRefresh = im.tmp.panzoomRefresh || {};
		    im.tmp.panzoomRefresh[key] = {};
		}
	    }
	}
	im.setPan(pos);
	// reset initial position
	im.pos0 = im.pos;
    }
};

// pinch zoom
// eslint-disable-next-line no-unused-vars
JS9.MouseTouch.Actions.pinch = function(im, ipos, evt){
    let display, dist, nzoom;
    // sanity check
    if( !im ){ return; }
    // is scroll to zoom turned on?
    display = im.display;
    // get current distance
    dist = Math.sqrt(((im.pos.touches[0].x - im.pos.touches[1].x)  *
		      (im.pos.touches[0].x - im.pos.touches[1].x)) +
		      ((im.pos.touches[0].y - im.pos.touches[1].y)  *
		       (im.pos.touches[0].y - im.pos.touches[1].y)));
    nzoom = display.zoom0 * dist / display.dist0;
    // a little rounding makes the zoom nicer
    nzoom = Math.max(JS9.MINZOOM, Math.min(JS9.MAXZOOM, Math.round((nzoom + 0.00001) * 100) / 100));
    // zoom the image
    if( nzoom !== display.lastzoom ){
	im.setZoom(nzoom);
    }
    display.lastzoom = nzoom;
};

// start of mouse/touch action processing
JS9.MouseTouch.Actions.start = function(im, ipos, evt){
    let display, action;
    if( im ){
	display = im.display;
	display.ispinch = 0;
	display.dist0 = 0;
	display.zoom0 = im.rgb.sect.zoom;
	display.deltas = [];
    }
    action = JS9.MouseTouch.getAction(im, evt);
    // call the start mouse/touch action, if necessary
    if( JS9.MouseTouch.Actions[action] &&
	JS9.MouseTouch.Actions[action].start ){
	JS9.MouseTouch.Actions[action].start(im, im.ipos, evt);
    }
};

// end of mouse/touch action processing
JS9.MouseTouch.Actions.stop = function(im, ipos, evt){
    const action = JS9.MouseTouch.getAction(im, evt);
    // call the stop mouse/touch action, if necessary
    if( JS9.MouseTouch.Actions[action] &&
	JS9.MouseTouch.Actions[action].stop ){
	JS9.MouseTouch.Actions[action].stop(im, im.ipos, evt);
    }
    return;
};

// get action associated with the current clickState
JS9.MouseTouch.getAction = function(im, evt){
    let action, display;
    // sanity check
    if( !im ){ return action; }
    display = im.display;
    switch(im.clickState){
	// mouse move actions
    case 0:
	action = display.mouseActions[0];
	break;
    case 1:
	action = display.mouseActions[1];
	break;
    case 2:
	action = display.mouseActions[2];
	break;
	// touch event actions
    case -1:
	action = display.touchActions[0];
	break;
    case -2:
	switch( JS9.MouseTouch.isPinch(im, evt) ){
	case -1:
	    action = display.touchActions[1];
	    break;
	case 0:
	    // do nothing, no idea if its a pinch yet
	    break;
	case 1:
	    action = "pinch";
	    break;
	}
	break;
    case -3:
	action = display.touchActions[2];
	break;
    default:
	break;
    }
    return action;
};

// execute the mouse/touch action routine
JS9.MouseTouch.action = function(im, evt, action){
    action = action || JS9.MouseTouch.getAction(im, evt);
    // call the mouse/touch action
    if( action && JS9.MouseTouch.Actions[action] ){
	JS9.MouseTouch.Actions[action](im, im.ipos, evt);
    }
};

// change zoom mode for this display
JS9.MouseTouch.mousetouchzoom = function(id, target){
    const display = JS9.lookupDisplay(id);
    const mode = target.checked;
    // change global blink mode
    if( display ){
	JS9.globalOpts.mousetouchZoom = mode;
    }
};

// constructor: add HTML elements to the plugin
JS9.MouseTouch.init = function(){
    let i, s;
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id of the div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // create container to hold action container and header
    // clean main container
    this.divjq.html("");
    // allow scrolling on the plugin
    this.divjq.addClass("JS9PluginScrolling");
    // main container
    this.mousetouchContainer = $("<div>")
	.addClass(`${JS9.MouseTouch.BASE}Container`)
	.attr("id", `${this.id}MouseTouchContainer`)
	.appendTo(this.divjq);
    s = sprintf("<div class='%s'><span><b>Drag an action to reconfigure JS9 mouse/touch events:</b></span><p>", `${JS9.MouseTouch.BASE}Header`);
    this.mousetouchHeadContainer = $("<span style='float: left'>")
	.addClass(`${JS9.MouseTouch.BASE}Container`)
	.attr("id", `${this.id}MouseTouchHeadContainer`)
        .html(s)
	.appendTo(this.mousetouchContainer);
    this.mousetouchTextContainer = $("<span style='float: left'>")
	.addClass(`${JS9.MouseTouch.BASE}Container`)
	.attr("id", `${this.id}MouseTouchTextContainer`)
	.appendTo(this.mousetouchContainer);
    this.mousetouchActionContainer = $("<span style='float: left'>")
	.addClass(`${JS9.MouseTouch.BASE}Container`)
	.attr("id", `${this.id}MouseTouchActionContainer`)
	.appendTo(this.mousetouchContainer);
    if( JS9.TOUCHSUPPORTED ){
	// container to hold text descriptions
	this.mousetouchTouchTextContainer = $("<div>")
	    .addClass(`${JS9.MouseTouch.BASE}TextContainer`)
	    .attr("id", `${this.id}TouchTextContainer`)
            .html("")
	    .appendTo(this.mousetouchTextContainer);
	for(i=0; i<JS9.MouseTouch.touchText.length; i++){
            JS9.MouseTouch.addText.call(this,
					this.mousetouchTouchTextContainer,
					JS9.MouseTouch.touchText[i]);
	}
	for(i=JS9.MouseTouch.touchText.length;
	    i<this.display.touchActions.length ; i++){
            JS9.MouseTouch.addText.call(this,
					this.mousetouchMouseTextContainer,
					"&nbsp;");
	}
	// container to hold touch actions
	this.mousetouchTouchContainer = $("<div>")
	    .addClass(`${JS9.MouseTouch.BASE}ActionContainer`)
	    .attr("id", `${this.id}TouchContainer`)
            .html("")
	    .appendTo(this.mousetouchActionContainer);
	// add touch actions, if necessary
	for(i=0; i<this.display.touchActions.length; i++){
	    s = this.display.touchActions[i];
            JS9.MouseTouch.addAction.call(this, this.mousetouchTouchContainer,
					  "touch", s);
	}
	// the actions within the action container will be sortable
	this.mousetouchTouchContainer.sortable({
	    start: (event, ui) => {
		this.oidx = ui.item.index();
	    },
	    stop: (event, ui) => {
		const nidx = ui.item.index();
		const oarr = this.display.touchActions.splice(this.oidx, 1)[0];
		// JS9 action list reflects the sort
		this.display.touchActions.splice(nidx, 0, oarr);
		delete this.oidx;
	    }
	});
    }
    if(  !/iPad|iPhone|iPod/.test(navigator.platform) ){
	// container to hold text descriptions
	this.mousetouchMouseTextContainer = $("<div>")
	    .addClass(`${JS9.MouseTouch.BASE}TextContainer`)
	    .attr("id", `${this.id}MouseTextContainer`)
	    .appendTo(this.mousetouchTextContainer);
	for(i=0; i< 3; i++){
            JS9.MouseTouch.addText.call(this,
					this.mousetouchMouseTextContainer,
					JS9.MouseTouch.mouseText[i]);
	}
	for(i=3; i<this.display.mouseActions.length ; i++){
            JS9.MouseTouch.addText.call(this,
					this.mousetouchMouseTextContainer,
					"&nbsp;");
	}
	// container to hold mouse actions
	this.mousetouchMouseContainer = $("<div>")
	    .addClass(`${JS9.MouseTouch.BASE}ActionContainer`)
	    .attr("id", `${this.id}MouseContainer`)
            .html("")
	    .appendTo(this.mousetouchActionContainer);
	// add mouse actions, if necessary
	for(i=0; i<this.display.mouseActions.length; i++){
	    s = this.display.mouseActions[i];
            JS9.MouseTouch.addAction.call(this, this.mousetouchMouseContainer,
					  "mouse", s);
	}
	// the actions within the action container will be sortable
	this.mousetouchMouseContainer.sortable({
	    start: (event, ui) => {
		this.oidx = ui.item.index();
	    },
	    stop: (event, ui) => {
		const nidx = ui.item.index();
		const oarr = this.display.mouseActions.splice(this.oidx, 1)[0];
		// JS9 action list reflects the sort
		this.display.mouseActions.splice(nidx, 0, oarr);
		delete this.oidx;
	    }
	});
    }
    // add the footer, containing buttons
    s = sprintf("<p><div class='%s'>Use mouse wheel or pinch to zoom:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type='checkbox' value='1' onclick='javascript:JS9.MouseTouch.mousetouchzoom(\"%s\", this);'></div>", `${JS9.MouseTouch.BASE}Footer`, this.display.id);
    this.mousetouchFootContainer = $("<span style='float: left'>")
	.addClass(`${JS9.MouseTouch.BASE}Container`)
	.attr("id", `${this.id}MouseTouchFootContainer`)
        .html(s)
	.appendTo(this.mousetouchContainer);
    // set initial value of scroll
    if( JS9.globalOpts.mousetouchZoom ){
	this.mousetouchContainer.find("input").attr("checked", true);
    }
};


// ---------------------------------------------------------------------
// Regions object defines high level calls for Regions plugin
// ---------------------------------------------------------------------

