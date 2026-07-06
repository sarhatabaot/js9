JS9.Grid = {};
JS9.Grid.CLASS = "JS9";
JS9.Grid.NAME = "Grid";
JS9.Grid.LAYERNAME = "grid";

// defaults for grids
JS9.Grid.opts = {
    // evented: false,
    movable: false,
    cover: "display",
    reduceDims: true,
    strokeWidth: 1,
    margin:   0,
    labelMargin: 10,
    stride:  32,
    raLines:  8,
    raSkip:  0,
    raAngle:  0,
    decLines: 8,
    decSkip: 0,
    decAngle:  90,
    sexaPrec: 1,
    degPrec: 3,
    lineColor: "#00FFFF",
    labelColor: "#00FFFF",
    labelFontFamily: "Helvetica, sans-serif",
    labelFontSize: 11,
    labelFontStyle: "normal",
    labelFontWeight: 300,
    labelRAOffx: 3,
    labelRAOffy: -1,
    labelDecOffx: -14,
    labelDecOffy: 6
};

// this is the problem routine: hard to get a heuristic which will:
// 1. pick a "natural" number of lines (depends on size of image)
// 2. put the lines on "natural" wcs boundaries (.1 degree or every 10 arcsec)
JS9.Grid.limits = function(opts, in0, in1, n){
    let trange, tscale, out0, out1, outinc;
    trange = in1 - in0;
    if( trange > 1 ){
	tscale = 10;
    } else if( trange > 0.1 ){
	tscale = 100;
    } else if( trange > 0.01 ){
	tscale = 1000;
    } else if( trange > 0.001 ){
	tscale = 10000;
    } else if( trange > 0.0001 ){
	tscale = 100000;
    } else {
	tscale = 1000000;
    }
    out0 = Math.floor(in0 * tscale) / tscale;
    out1 = Math.ceil(in1 * tscale) / tscale;
    outinc = Math.ceil(((out1 - out0) / n) * tscale) / tscale;
    return {lo: out0, hi: out1, inc: outinc};
};

// generate label value
JS9.Grid.getLabel = function(opts, v, which){
    let i, t, idx, arr;
    let doall = false;
    switch(opts.wcsunits){
    case "sexagesimal":
	if( (which === "ra") &&
	    ((opts.wcssys !== "galactic") && (opts.wcssys !== "ecliptic")) ){
	    v /= 15.0;
	}
	t = JS9.saodtostr(v, ":", opts.sexaPrec);
	arr = t.split(":");
	if( opts.last[which] ){
	    t = "";
	    for(i=0; i<arr.length; i++){
		if( t ){ t += ":"; }
		if( doall || arr[i] !== opts.last[which][i] ){
		    t += arr[i];
		    doall = true;
		}
	    }
	}
	opts.last[which] = JS9.extend({}, arr);
	break;
    default:
	t = v.toFixed(opts.degPrec);
	break;
    }
    t = t.replace(/0+$/, "");
    idx = t.indexOf(".");
    if( idx < 0 ){
	t += ".0";
    } else if( idx === t.length -1 ){
	t += "0";
    }
    t = t.replace(/:\.0/, ":0.0");
    return t;
};

// generate and display a coordinate grid of Line shapes
// call with image context
JS9.Grid.display = function(mode, myopts){
    let i, n, s, t, x, y, lineloc, arr, inc, got;
    let ra, dec, ra0, ra1, dec0, dec1, rainc, decinc;
    let raoffx, raoffy, decoffx, decoffy, raskip, decskip, lastra, lastdec;
    let xrainc0, xrainc, xralim, xdecinc0, xdecinc, xdeclim, ipos, dpos;
    let ratios, corners, opts;
    let out = {};
    const display = this.display;
    const raw = this.raw;
    const lims = [{ra:0, dec:0}, {ra:0, dec:0}, {ra:0, dec:0}, {ra:0, dec:0}];
    // no arg: return current grid display status
    if( JS9.isNull(mode) ){
	// toggle display
	switch(this.tmp.gridStatus){
	case "inactive":
	case undefined:
	    return false;
	case "active":
	case "processing":
	    return true;
	default:
	    return true;
	}
    }
    // delete previous grid
    this.removeShapes(JS9.Grid.LAYERNAME);
    // if false or no wcs, set inactive status and return
    if( mode === false || !this.raw.wcs || this.raw.wcs <= 0 ){
	this.tmp.gridStatus = "inactive";
	return;
    }
    // local opts are optional
    myopts = myopts || {};
    // myopts can be an object or json
    if( typeof myopts === "string" ){
	try{ myopts = JSON.parse(myopts); }
	catch(e){ JS9.error("can't parse displayCoordGrid JSON", e); }
    }
    // we are actively creating a grid
    this.tmp.gridStatus = "processing";
    // get opts
    opts = JS9.extend(true, {}, JS9.Grid.opts, myopts);
    // labels will follow current wcs units
    opts.wcsunits = this.getWCSUnits();
    opts.wcssys = this.getWCSSys();
    // keep track of labels as we go along
    opts.last = {};
    // wcslib wants degrees
    JS9.wcsunits(this.raw.wcs, "degrees");
    // if we will cover the whole image, change the ratio and corner values
    if( opts.cover === "image" ){
	ratios = [Math.max(1, Math.floor(raw.width  / display.width)),
		  Math.max(1, Math.floor(raw.height / display.height))];
	corners = [{x: 0, y: 0}, {x: raw.width-1, y: raw.height-1}];
    } else {
	if( opts.reduceDims ){
	    if( raw.width < raw.height ){
		ratios = [raw.width / raw.height, 1];
	    } else if( raw.height < raw.width ){
		ratios = [1, raw.height / raw.width];
	    } else {
		ratios = [1,1];
	    }
	} else {
	    ratios = [1,1];
	}
	corners = [];
	dpos = {x: this.ix + opts.margin,
		y: this.iy - opts.margin};
	ipos = this.displayToImagePos(dpos);
	corners[0] = {x: ipos.x, y: ipos.y};
	dpos = {x: display.width - 1 - this.ix - opts.margin,
		y: display.height - 1 - this.iy - opts.margin};
	ipos = this.displayToImagePos(dpos);
	corners[1] = {x: ipos.x, y: ipos.y};
    }
    // wcs coords at corners of display
    s = JS9.pix2wcs(raw.wcs, corners[0].x, corners[0].y).trim().split(/\s+/);
    lims[0].ra = JS9.saostrtod(s[0]);
    lims[0].dec = JS9.saostrtod(s[1]);
    s = JS9.pix2wcs(raw.wcs, corners[0].x, corners[1].y).trim().split(/\s+/);
    lims[1].ra = JS9.saostrtod(s[0]);
    lims[1].dec = JS9.saostrtod(s[1]);
    s = JS9.pix2wcs(raw.wcs, corners[1].x, corners[0].y).trim().split(/\s+/);
    lims[2].ra = JS9.saostrtod(s[0]);
    lims[2].dec = JS9.saostrtod(s[1]);
    s = JS9.pix2wcs(raw.wcs, corners[1].x, corners[1].y).trim().split(/\s+/);
    lims[3].ra = JS9.saostrtod(s[0]);
    lims[3].dec = JS9.saostrtod(s[1]);
    ra0 = lims[0].ra;
    dec0 = lims[0].dec;
    ra1 = lims[0].ra;
    dec1 = lims[0].dec;
    // initial ra,dec limits in ascending order
    for(i=1; i<4; i++){
	ra0 = Math.min(ra0, lims[i].ra);
	dec0 = Math.min(dec0, lims[i].dec);
	ra1 = Math.max(ra1, lims[i].ra);
	dec1 = Math.max(dec1, lims[i].dec);
    }
    // calculate normalized ra limits
    out = JS9.Grid.limits.call(this, opts, ra0, ra1, opts.raLines*ratios[0]);
    ra0 = out.lo;
    ra1 = out.hi;
    rainc = out.inc;
    // find best line for RA labels
    // calculate normalized dec limits
    out = JS9.Grid.limits.call(this, opts, dec0, dec1, opts.decLines*ratios[1]);
    dec0 = out.lo;
    dec1 = out.hi;
    decinc = out.inc;
    // restore original values
    JS9.wcsunits(this.raw.wcs, opts.wcsunits);
    // loop limits
    xrainc0 = Math.abs(this.raw.wcsinfo.cdelt1);
    xrainc = xrainc0 * JS9.Grid.opts.stride;
    xralim = ra1 - xrainc;
    xdecinc0 = Math.abs(this.raw.wcsinfo.cdelt2);
    xdecinc = xdecinc0 * JS9.Grid.opts.stride;
    xdeclim = dec1 - xdecinc;
    // start grid regions
    s = "image;";
    // lines of constant RA
    for(ra=ra0; ra<=ra1; ra=ra+rainc){
	t = "line(";
	inc = xdecinc0;
	lineloc = 0;
	n = 0;
        for(dec=dec0; dec<=dec1; dec=dec+inc){
	    arr = JS9.wcs2pix(raw.wcs, ra, dec).trim().split(/ +/);
	    if( arr && arr.length ){
		x = parseFloat(arr[0]);
		y = parseFloat(arr[1]);
		if( x >= -opts.margin && x <= raw.width + opts.margin  &&
		    y >= -opts.margin && y <= raw.height + opts.margin ){
		    t += String(`${x + 1},${y}${1}, `);
		    n++;
		    if( lineloc === 0 ){
			lineloc = 1;
			if( dec < xdeclim ){
			    inc = xdecinc;
			}
		    } else if( lineloc === 1 ){
			if( dec > xdeclim ){
			    lineloc = 2;
			    inc = xdecinc0;
			}
		    }
		} else {
		    if( lineloc === 1 ){
			lineloc = 2;
			dec = dec - inc;
			inc = xdecinc0;
		    }
		}
	    }
	}
	if( n > 1 ){
	    s += t.replace(/,\s+$/, ") ");
	    s += ` {"color": "${opts.lineColor}"};`;
	}
    }
    // lines of constant Dec
    for(dec=dec0; dec<=dec1; dec=dec+decinc){
	t = "line(";
	inc = xrainc0;
	lineloc = 0;
	n = 0;
        for(ra=ra0; ra<=ra1; ra=ra+inc){
	    arr = JS9.wcs2pix(raw.wcs, ra, dec).trim().split(/ +/);
	    if( arr && arr.length ){
		x = parseFloat(arr[0]);
		y = parseFloat(arr[1]);
		if( x >= -opts.margin && x <= raw.width + opts.margin  &&
		    y >= -opts.margin && y <= raw.height + opts.margin ){
		    t += String(`${x + 1},${y}${1}, `);
		    n++;
		    if( lineloc === 0 ){
			lineloc = 1;
			if( ra < xralim ){
			    inc = xrainc;
			}
		    } else if( lineloc === 1 ){
			if( ra > xralim ){
			    lineloc = 2;
			    inc = xrainc0;
			}
		    }
		} else {
		    if( lineloc === 1 ){
			lineloc = 2;
			ra = ra - inc;
			inc = xrainc0;
		    }
		}
	    }
	}
	if( n > 1 ){
	    s += t.replace(/,\s+$/, ") ");
	    s += ` {"color": "${opts.lineColor}"};`;
	}
    }
    // dec labels along constant ra line
    decoffx = opts.labelDecOffx / this.rgb.sect.zoom;
    decoffy = opts.labelDecOffy / this.rgb.sect.zoom;
    decskip = 0;
    lastra = ra0;
    for(ra=ra0, got=0; ra<=ra1; ra=ra+rainc){
	for(dec=dec0; dec<=dec1; dec=dec+decinc){
	    arr = JS9.wcs2pix(raw.wcs, ra, dec).trim().split(/ +/);
	    if( arr && arr.length ){
		x = parseFloat(arr[0]);
		y = parseFloat(arr[1]);
		dpos = this.imageToDisplayPos({x, y});
		if( dpos.x > (this.ix+opts.labelMargin) && dpos.x < (this.rgb.img.width+this.ix-opts.labelMargin) &&
		    dpos.y > (this.iy+opts.labelMargin) && dpos.y < (this.rgb.img.height+this.iy-opts.labelMargin)){
		    if( decskip >= opts.decSkip ){
			s += sprintf('text(%s,%s,%s,%s) {"color":"%s", "fontFamily":"%s", "fontSize":%s, "fontStyle":"%s", "fontWeight":"%s", "originX":"left", "originY":"top"};',
				 x + decoffx, y + decoffy,
				 JS9.Grid.getLabel.call(this, opts, dec, "dec"),
				 opts.decAngle,
				 opts.labelColor,
				 opts.labelFontFamily,
				 opts.labelFontSize,
				 opts.labelFontStyle,
				 opts.labelFontWeight);
			got++;
		    } else {
			if( ra !== lastra ){
			    decskip++;
			}
			lastra = ra;
		    }
		}
	    }
	}
	if( got ){
	    break;
	}
    }
    // ra labels along constant dec line
    raoffx = opts.labelRAOffx / this.rgb.sect.zoom;
    raoffy = opts.labelRAOffy / this.rgb.sect.zoom;
    raskip = 0;
    lastdec = dec0;
    for(dec=dec0, got=0; dec<=dec1; dec=dec+decinc){
	for(ra=ra0; ra<=ra1; ra=ra+rainc){
	    arr = JS9.wcs2pix(raw.wcs, ra, dec).trim().split(/ +/);
	    if( arr && arr.length ){
		x = parseFloat(arr[0]);
		y = parseFloat(arr[1]);
		dpos = this.imageToDisplayPos({x, y});
		if( dpos.x > (this.ix+opts.labelMargin) && dpos.x < (this.rgb.img.width+this.ix-opts.labelMargin) &&
		    dpos.y > (this.iy+opts.labelMargin) && dpos.y < (this.rgb.img.height+this.iy-opts.labelMargin)){
		    if( raskip >= opts.raSkip ){
			s += sprintf('text(%s,%s,%s,%s) {"color":"%s", "fontFamily":"%s", "fontSize":%s, "fontStyle":"%s", "fontWeight":"%s", "originX":"left", "originY":"top"};',
				 x + raoffx, y + raoffy,
				 JS9.Grid.getLabel.call(this, opts, ra, "ra"),
				 opts.raAngle,
				 opts.labelColor,
				 opts.labelFontFamily,
				 opts.labelFontSize,
				 opts.labelFontStyle,
				 opts.labelFontWeight);
			got++;
		    } else {
			if( dec !== lastdec ){
			    raskip++;
			}
			lastdec = dec;
		    }
		}
	    }
	}
	if( got ){
	    break;
	}
    }
    // add the grid shapes
    this.addShapes(JS9.Grid.LAYERNAME, s, opts);
    // grid is complete and active
    this.tmp.gridStatus = "active";
};

// toggle grid on/off
JS9.Grid.toggle = function(im){
    // sanity check
    if( !im ){ return; }
    // toggle display
    switch(im.tmp.gridStatus){
    case undefined:
    case null:
    case "inactive":
	// start afresh
	im.displayCoordGrid(true);
	break;
    case "active":
	// clear the grid
	im.displayCoordGrid(false);
	break;
    case "processing":
    default:
	break;
    }
};

// display grid, as needed
JS9.Grid.regrid = function(im){
    if( im ){
	// ignore if grid is not active or the image is not loaded
	if( im.tmp.gridStatus !== "active" || im.status.load !== "complete" ){
	    return;
	}
	// redraw the grid
	im.displayCoordGrid(true);
    }
};

// plugin init: load our grid methods
// eslint-disable-next-line no-unused-vars
JS9.Grid.init = function(opts){
    let dlayer;
    opts = JS9.extend(true, {}, JS9.Catalogs.opts, JS9.Grid.opts, opts);
    // init the display shape layer
    dlayer = this.display.newShapeLayer(JS9.Grid.LAYERNAME, opts);
    // mouse up: no-op
    dlayer.canvas.on("mouse:up", () => {
	    return false;
    });
};

// add to image prototypes
JS9.Image.prototype.displayCoordGrid = JS9.Grid.display;

// check if an object is an image handle
JS9.isImage = function(s){
    if( typeof s === "object"   &&
	JS9.notNull(s.id)       &&
	JS9.notNull(s.raw)      &&
	JS9.notNull(s.rgb)      &&
	JS9.notNull(s.params)   &&
	JS9.notNull(s.display)  ){
	return true;
    } if( typeof s === "string" && JS9.lookupImage(s) ){
	return true;
    }
    return false;
};

// ---------------------------------------------------------------------
// Dysel: callbacks when a display is selected dynamically
// ---------------------------------------------------------------------

