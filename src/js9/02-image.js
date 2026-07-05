JS9.Image = function(file, params, func){
    let i, card, pars, nzoom, display, txeq, tval;
    let localOpts = null;
    let nhist = 0;
    let ncomm = 0;
    // called with current image context
    const mkscale = (opts) => {
	// do zscale, if necessary
	opts = opts || {};
	if( JS9.isNull(opts.scaleclipping) ){
	    if( this.params.scaleclipping === "zscale" ){
		this.zscale(true);
	    } else if( this.params.scaleclipping === "zmax" ){
		this.zscale("zmax");
	    }
	} else {
	    if( opts.scaleclipping === "zscale" ){
		this.zscale(true);
	    } else if( opts.scaleclipping === "zmax" ){
		this.zscale("zmax");
	    }
	}
	if( JS9.notNull(opts.scalemin) ){
	    this.params.scalemin = opts.scalemin;
	}
	if( JS9.notNull(opts.scalemax) ){
	    this.params.scalemax = opts.scalemax;
	}
    };
    // called with current image context
    const finishUp = (func) => {
	let i, s, topts, tkey, id, pre, waiting, plen, im;
	const imopts = JS9.globalOpts.imopts;
	const imcmap = JS9.globalOpts.imcmap;
	const oalerts = JS9.globalOpts.alerts;
	const rregexp = /(annulus|box|circle|ellipse|line|polygon|point|text) *\(/;
	// add to list of images
	JS9.images.push(this);
	// clear previous messages
	this.display.clearMessage();
	// if flip, rotate, rot90 opts were supplied, set transform
	if( localOpts ){
	    if( JS9.notNull(localOpts.flip)   ||
		JS9.notNull(localOpts.rotate) ||
		JS9.notNull(localOpts.rot90)  ){
		this.setTransform();
	    }
	}
	// display image, 2D graphics, etc.
	this.displayImage("all", localOpts);
	// notify the helper
	this.notifyHelper();
	// show regions layer
	this.showShapeLayer("regions", true, {local: true});
	if( localOpts ){
	    // pan, if necessary
	    if( (JS9.notNull(localOpts.x)  && JS9.notNull(localOpts.y))   ||
		(JS9.notNull(localOpts.px) && JS9.notNull(localOpts.py))  ||
		(JS9.notNull(localOpts.ra) && JS9.notNull(localOpts.dec)) ||
		(JS9.notNull(localOpts.wcs))                              ){
		this.setPan(localOpts);
	    }
	    // add regions, if necessary
	    if( localOpts.regions ){
		if( localOpts.regions.match(rregexp) ){
		    this.addShapes("regions", localOpts.regions);
		} else {
		    JS9.LoadRegions(localOpts.regions, {display:this.display});
		}
	    }
	}
	// no alerts while processing imopts or cmaps
	JS9.globalOpts.alerts = false;
	// looks for imcmap (json-formatted colormap object) in FITS header
	if( this.raw && this.raw.header && this.raw.header[imcmap] ){
	    // try to convert to object and set as image params
	    try{ topts = JSON.parse(this.raw.header[imcmap]); }
	    catch(e){ topts = null; }
	    if( topts ){
		try{ JS9.AddColormap(topts); }
		catch(e){ /* empty */ }
	    }
	}
	// look for multi-line colormap (imcmap1, imcmap2, ...) in FITS header
	tkey = `${imcmap}1`;
	if( this.raw && this.raw.header && this.raw.header[tkey] ){
	    // gather up the json string
	    for(i=1, s=""; i<100; i++){
		tkey = imcmap + String(i);
		if( this.raw.header[tkey] ){
		    s += this.raw.header[tkey];
		} else {
		    break;
		}
	    }
	    // try to convert to object and set as image params
	    if( s ){
		try{ topts = JSON.parse(s); }
		catch(e){ topts = null; }
		if( topts ){
		    try{ JS9.AddColormap(topts); }
		    catch(e){ /* empty */ }
		}
	    }
	}
	// looks for imopts (json-formatted image param object) in FITS header
	if( this.raw && this.raw.header && this.raw.header[imopts] ){
	    // try to convert to object and set as image params
	    try{ topts = JSON.parse(this.raw.header[imopts]); }
	    catch(e){ topts = null; }
	    if( topts ){
		try{ this.setParam("all", topts); }
		catch(e){ /* empty */ }
	    }
	}
	// look for multi-line imopts (imopts1, imopts2, ...) in FITS header
	tkey = `${imopts}1`;
	if( this.raw && this.raw.header && this.raw.header[tkey] ){
	    // gather up the json string
	    for(i=1, s=""; i<100; i++){
		tkey = imopts + String(i);
		if( this.raw.header[tkey] ){
		    s += this.raw.header[tkey];
		} else {
		    break;
		}
	    }
	    // try to convert to object and set as image params
	    if( s ){
		try{ topts = JSON.parse(s); }
		catch(e){ topts = null; }
		if( topts ){
		    try{ this.setParam("all", topts); }
		    catch(e){ /* empty */ }
		}
	    }
	}
	// restore alerts
	JS9.globalOpts.alerts = oalerts;
	// plugin callbacks
	this.xeqPlugins("image", "onimageload");
	// load is complete
	this.setStatus("load","complete");
	// done loading, reset wait cursor
	JS9.waiting(false);
	// everything else is done so call onload func, if necessary
	if( func ){
	    try{ JS9.xeqByName(func, window, this); }
	    catch(e){ JS9.error("in image onload callback", e, false); }
	}
	// might need to finish processing of preloads
	if( JS9.preloadwaiting && JS9.preloadwaiting.length ){
	    plen = JS9.preloadwaiting.length;
	    id = this.proxyURL || this.file;
	    // flag that this preload is loaded
	    for(i=0, waiting=0; i<plen; i++){
		pre = JS9.preloadwaiting[i];
		if( id.match(pre.id) || pre.id.match(id) ){
		    pre.loaded = true;
		    pre.im = this;
		} else {
		    // are we done preloading
		    if( pre.loaded === false ){
			waiting++;
		    }
		}
	    }
	    // are all preloads loaded?
	    if( !waiting ){
		// resort preloads into original order
		if( JS9.globalOpts.sortPreloads ){
		    JS9.images.sort((a, b) => {
			let ai = 0, bi = 0;
			for(i=0; i<plen; i++){
			    pre = JS9.preloadwaiting[i];
			    if( a.id === pre.im.id ){
				ai = i;
			    }
			    if( b.id === pre.im.id ){
				bi = i;
			    }
			}
			return ai - bi;
		    });
		    // display last image in the load list
		    im = JS9.preloadwaiting[plen-1].im || this;
		    im.displayImage();
		} else {
		    // not sorting preloads
		    im = this;
		}
		// execute preload callback
		if( JS9.notNull(JS9.globalOpts.onpreload) ){
		    try{
			JS9.xeqByName(JS9.globalOpts.onpreload, window, im);
		    }
		    catch(e){
			JS9.error("in onpreload callback", e, false);
		    }
		    finally{
			delete JS9.globalOpts.onpreload;
		    }
		}
		// done with this set of preloads, so re-init
		JS9.preloadwaiting = [];
	    }
	}
	// also load all of the image extensions?
	if( localOpts && localOpts.allext &&
	    this.hdus && this.hdus.length > 0 ){
	    this.displayExtension("all");
	}
    };
    // params can be an object containing local params, or the display string
    if( params ){
	if( typeof params === "object" ){
	    localOpts = params;
	    if( localOpts.display ){
		display = localOpts.display;
	    }
	} else {
	    display = params;
	}
    }
    // make sure we have a valid display
    if( !display ){
	if( JS9.displays.length > 0 ){
	    display = JS9.displays[0].id;
	} else {
	    display = JS9.DEFID;
	}
    }
    // save url, if available
    // it's an image
    this.type = "image";
    // set the display
    this.display = JS9.lookupDisplay(display);
    // initialize image params
    this.params = {};
    // region stack for saving removed regions
    this.regstack = [];
    // image-specific scratch space
    this.tmp = {};
    // current groups for each layer
    this.groups = {};
    // xeq callback for region changes?
    this.params.xeqonchange = true;
    // copy image parameters
    this.params = $.extend(true, this.params, JS9.imageOpts, localOpts);
    // inherit properties, if necessary
    if( this.display.image ){
	this.params.inherit = this.display.image.params.inherit;
	if( this.params.inherit ){
	    this.params = $.extend(true,
				   this.params, this.display.image.params);
	}
    }
    // (turn off plugin call, since we are not fully loaded)
    txeq = JS9.globalOpts.xeqPlugins;
    // save overlay (setting colormap turns it off)
    tval = this.params.overlay;
    JS9.globalOpts.xeqPlugins = false;
    this.setColormap(this.params.colormap);
    this.params.overlay = tval;
    JS9.globalOpts.xeqPlugins = txeq;
    // do we display?
    this.displayMode = true;
    // initialize click state
    this.clickState = 0;
    // initialize click in region
    this.clickInRegion = false;
    this.clickInLayer = null;
    // no helper queried yet
    this.queried = false;
    // is this a proxy image?
    if( localOpts && localOpts.proxyFile ){
	this.proxyFile = localOpts.proxyFile;
    }
    // is there a proxy parent?
    if( localOpts && localOpts.proxyParent ){
	this.proxyParent = localOpts.proxyParent;
    }
    if( localOpts && localOpts.proxyURL ){
	this.proxyURL = localOpts.proxyURL;
    }
    // was a "parent" FITS file specified?
    if( localOpts && localOpts.parentFile ){
	this.parentFile = localOpts.parentFile;
    }
    // was "parent" info specified?
    if( localOpts && localOpts.parent ){
	this.parent = localOpts.parent;
	// convert card string to header
	if( this.parent.cardstr && this.parent.ncard ){
	    this.parent.raw = {header: {}, history:[], comments: []};
	    for(i=0; i<this.parent.ncard; i++){
		card = this.parent.cardstr.slice(i*80, (i+1)*80);
		pars = JS9.cardpars(card);
		if( pars !== undefined ){
		    if( pars[0] === "HISTORY" ){
			this.parent.raw.header[`${pars[0]}__${nhist++}`] = pars[1];
		    } else if( pars[0] === "COMMENT" ){
			this.parent.raw.header[`${pars[0]}__${ncomm++}`] = pars[1];
		    } else {
			this.parent.raw.header[pars[0]] = pars[1];
		    }
		}
	    }
	    // initialize LCS for this parent header
	    this.parent.lcs = {};
	    // call is used because this.parent is not an image object
	    JS9.Image.prototype.initLCS.call(this.parent,
					     this.parent.raw.header);
	}
    }
    // was an id specified?
    if( localOpts && localOpts.id ){
	this.id = localOpts.id;
    }
    // offsets into canvas to display
    this.ix = 0;
    this.iy = 0;
    // init status object
    this.status = {};
    // RGB image
    this.rgb = {};
    // section parameters
    this.rgb.sect = {zoom: 1, ozoom: 1};
    // graphical layers
    this.layers = {};
    // current zindex for main layers
    this.zlayer = JS9.SHAPEZINDEX;
    // no logical coordinate systems
    this.lcs = {};
    // array of aux file pointers
    this.aux = {};
    // binning parameters
    this.binning = {bin: 1, obin: 1};
    // array to hold raw data as we create it (original raw data at index 0)
    this.raws = [];
    // initial blend mode
    this.blend = $.extend(true, {}, JS9.blendOpts);
    // initial mask mode
    this.mask = $.extend(true, {}, JS9.maskOpts);
    // request for an empty image object ends here
    if( !file ){
	return;
    }
    // change the cursor to show the waiting status
    JS9.waiting(true, this.display);
    // file arg can be an object containing raw data
    switch( typeof file ){
    case "object":
	// save source
	if( localOpts && localOpts.source ){
	    this.source = localOpts.source;
	} else {
	    this.source = "fits";
	}
	// generate the raw data array from the hdu
	// (11/2021: leave check on 'filename' for backward compatibility)
	this.mkRawDataFromHDU(file,
			      $.extend({},
				       {file: file.file||file.filename},
				       localOpts));
	// set scaling params from opts
	mkscale(localOpts);
	// set up initial zoom
	if( this.params.zoom ){
	    nzoom = this.parseZoom(this.params.zoom);
	    this.rgb.sect.zoom = nzoom;
	    this.rgb.sect.ozoom = nzoom;
	}
	// set up initial section
	this.mkSection();
	// was a static RGB file specified?
	if( localOpts && localOpts.rgbFile ){
	    this.rgbFile = localOpts.rgbFile;
	    // create the png object with image to hold png file
	    this.png = {image: new Image()};
	    // callback to fire when static RGB image is loaded
	    $(this.png.image).on("load", () => {
		let ss;
		if( (this.png.image.width !== this.raw.width)   ||
		    (this.png.image.height !== this.raw.height) ){
		    ss = sprintf("rgb dims [%s,%s] don't match image [%s,%s]",
				this.png.image.width,
				this.png.image.height,
				this.raw.width,
				this.raw.height);
		    JS9.error(ss);
		}
		// store png data in an offscreen canvas
		this.mkOffScreenCanvas();
		// finish up
		finishUp(func);
	    }).on("error", () => {
		// done loading, reset wait cursor
		JS9.waiting(false);
		JS9.error(`could not load image: ${this.id}`);
	    });
	    // set src to download the display file
	    this.png.image.src = this.rgbFile;
	} else {
	    // finish up
	    finishUp(func);
	}
	break;
    default:
	JS9.error(`unknown specification type for Load: ${typeof file}`);
	break;
    }
};

// return the image data in a relatively standard format
JS9.Image.prototype.getImageData = function(dflag){
    let data = null;
    const {xdim, ydim} = this.fileDimensions();
    const atob64 = (a) => {
	let i;
	let s = '';
	const bytes = new Uint8Array(a.buffer);
	const len = bytes.byteLength;
	for(i=0; i<len; i++){
            s += String.fromCharCode(bytes[i]);
	}
	return window.btoa(s);
    };
    // return data and auxiliary info
    if( dflag ){
	// return an array for IPC, since python mangles the typed array
	if( dflag === "array" ){
	    data = Array.from(this.raw.data);
	} else if( dflag === "base64" ){
	    // NB: this seems to be the fastest method for IPC!
	    data = atob64(this.raw.data);
	} else {
	    // use this for javascript programming on the web page itself
	    data = this.raw.data;
	}
    }
    return {id: this.id,
	    file: this.file,
	    fits: this.fitsFile || "",
	    source: this.source,
	    imtab: this.imtab,
	    width: this.raw.width,
	    height: this.raw.height,
	    bitpix: this.raw.bitpix,
	    bin: this.binning.bin,
	    header: this.raw.header,
	    hdus: this.hdus,
	    dwidth: this.display.width,
	    dheight: this.display.height,
	    fwidth: xdim,
	    fheight: ydim,
	    data: data
	   };
};

// undisplay the image, release resources
JS9.Image.prototype.closeImage = function(opts){
    let i, j, tim, key, raw, carr;
    let iscurrent = false;
    const ilen= JS9.images.length;
    // this is either the dynamically selected display or the current display
    const seldisplay = JS9.Dysel.getDisplayOr(this.display);
    // opts is optional
    opts = opts || {};
    // opts can be json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse closeImage opts: ${opts}`, e); }
    }
    // set close status to "closing"
    this.setStatus("close", "closing");
    // if this image is the wcs reference image for another image, clear it
    for(i=0; i<ilen; i++){
	if( JS9.images[i].wcsim === this ){
	    JS9.images[i].wcsim = null;
	}
    }
    // if this image is the image mask for another image, clear it
    for(i=0; i<ilen; i++){
	if( JS9.images[i].mask.im === this ){
	    JS9.images[i].mask.im = null;
	    JS9.images[i].mask.active = false;
	}
    }
    // look for the image in the image list, and remove it
    for(i=0; i<ilen; i++){
	if( this === JS9.images[i] ){
	    tim = JS9.images[i];
	    // is this the currently displayed image?
	    if( tim === tim.display.image ){
		iscurrent = i+1;
	    }
	    // clear display if this is the currently displayed image
	    if( iscurrent ){
		// clear unless specifically asked not to
		if( opts.clear !== false ){
		    tim.display.clearMessage();
		    tim.display.context.clear();
		}
		// clear all layers
		for( key of Object.keys(tim.layers) ){
		    // clear the shape layer if its in the main display,
		    //  and non-main layers if this image is selected
		    if( tim.layers[key].dlayer.dtype === "main" ||
			tim.display === seldisplay ){
			tim.showShapeLayer(key, false, {local: true});
		    }
		}
	    }
	    // plugin callbacks
	    tim.xeqPlugins("image", "onimageclose");
	    // after callbacks, we can unset the image from the display
	    if( iscurrent ){
		// clear image from display
		tim.display.image = null;
	    }
	    // remove from RGB mode, if necessary
	    switch(tim.cmapObj.name){
	    case "red":
		tim.display.rgb.rim = null;
		break;
	    case "green":
		tim.display.rgb.gim = null;
		break;
	    case "blue":
		tim.display.rgb.bim = null;
		break;
	    }
	    // cleanup FITS file support, if necessary
	    for(j=0; j<tim.raws.length; j++){
		raw = tim.raws[j];
		if( raw.hdu && raw.hdu.fits ){
		    carr = JS9.lookupVfile(raw.hdu.fits.vfile);
		    if( carr.length <= 1 ){
			JS9.cleanupFITSFile(raw, true);
		    }
		}
		// free wcs info
		if( raw.altwcs ){
		    this.freeWCS(raw);
		}
	    }
	    // remove proxy image from server, if necessary
	    tim.removeProxyFile();
	    // good hints to the garbage collector
	    tim.rgb = null;
	    tim.offscreen = null;
	    tim.raw = null;
	    tim.colorData = null;
	    tim.colorCells = null;
	    tim.psColors = null;
	    tim.psInverse = null;
	    tim = null;
	    // remove image from active list
	    JS9.images.splice(i,1);
	    // found and removed the specified image
	    break;
	}
    }
    // display another image, if necessary and if possible
    if( iscurrent ){
	iscurrent -= 2;
	for(i=iscurrent; i>=0; i--){
	    tim = JS9.images[i];
	    if( this.display === tim.display ){
		// display image, 2D graphics, etc.
		tim.displayImage("all");
		tim.refreshLayers();
		// signal we're done
		iscurrent = JS9.images.length;
		break;
	    }
	}
	for(i=JS9.images.length-1; i>iscurrent; i--){
	    tim = JS9.images[i];
	    if( this.display === tim.display ){
		// display image, 2D graphics, etc.
		tim.displayImage("all");
		tim.refreshLayers();
		break;
	    }
	}
    }
};

// make offscreen canvas to hold RGB data from the png file
JS9.Image.prototype.mkOffScreenCanvas = function(){
    // sanity check
    if( !this.png || !this.png.image ){ return this; }
    // offscreen object holds canvas into which we draw to get RGB values
    // no need for jquery here, we only manipulate this via the canvas API
    this.offscreen = {};
    this.offscreen.canvas = document.createElement("canvas");
    this.offscreen.canvas.setAttribute("width", this.png.image.width);
    this.offscreen.canvas.setAttribute("height", this.png.image.height);
    this.offscreen.context = this.offscreen.canvas.getContext("2d");
    // turn off anti-aliasing
    if( !JS9.ANTIALIAS ){
	this.offscreen.context.imageSmoothingEnabled = false;
    }
    // draw the png to the offscreen canvas
    this.offscreen.context.drawImage(this.png.image, 0, 0);
    // read the RGBA data from offscreen
    try{
	this.offscreen.img = this.offscreen.context.getImageData(0, 0,
			     this.png.image.width, this.png.image.height);
    } catch(e){
	if( JS9.CHROMEFILEWARNING &&
	    (JS9.BROWSER[0] === "Chrome") && (document.domain === "") ){
	    alert("When using the file:// URI, Chrome must be run with the --allow-file-access-from-files switch to permit JS9 to access data.");
	} else {
	    alert("could not read off-screen image data [same-origin policy violation?]");
	}
    }
    // allow chaining
    return this;
};

JS9.Image.prototype.useOffScreenCanvas = function(){
    return this.offscreen && (this.rgbFile || this.params.overlay);
};

// initialize keywords for various logical coordinate systems
JS9.Image.prototype.initLCS = function(iheader){
    let i, tval, rrot, frot, a, sina, cosa;
    const arr = [[0,0,0], [0,0,0], [0,0,0]];
    // header usually is raw header
    const header = iheader || this.raw.header;
    const cx = header.CRPIX1 || 1;
    const cy = header.CRPIX2 || 1;
    // seed rotation matrix and its inverse, if necessary
    if( header.LCSROTA2 && header.CROTA2 ){
	// screen rotation angle is reversed from FITS convention
	a = -header.CROTA2 * Math.PI / 180.0;
	sina = Math.sin(a);
	cosa = Math.cos(a);
	frot = [[0,0,0], [0,0,0], [0,0,0]];
	frot[0][0] = cosa;
	frot[0][1] = -sina;
	frot[0][2] = 0;
	frot[1][0] = sina;
	frot[1][1] = cosa;
	frot[1][2] = 0;
	rrot = JS9.invertMatrix3(frot);
	if( !rrot ){
	    frot = null;
	}
    }
    // physical coords
    arr[0][0] = JS9.defNull(header.LTM1_1, 1.0);
    arr[1][0] = header.LTM2_1 || 0.0;
    arr[0][1] = header.LTM1_2 || 0.0;
    arr[1][1] = JS9.defNull(header.LTM2_2, 1.0);
    arr[2][0] = header.LTV1   || 0.0;
    arr[2][1] = header.LTV2   || 0.0;
    if( this.imtab === "image" && this.params.ltvbug ){
	// There seems to be a tiny misalignment between wcs->image and
	// physical->image when ltv is involved. No idea why, but the fix is:
	// (set default to false after implementing rot90/flip 10/6/2019 ...
	//  on the fear this is doing more harm than good)
	if( JS9.notNull(header.LTV1) ){
	    for(i=0; i<2; i++){
		tval = Math.abs(arr[0][i]);
		if( tval > 0 && tval < 1 ){ arr[2][0] += tval * 0.5; }
	    }
	}
	if( JS9.notNull(header.LTV2) ){
	    for(i=0; i<2; i++){
		tval = Math.abs(arr[1][i]);
		if( tval > 0 && tval < 1 ){ arr[2][1] += tval * 0.5; }
	    }
	}
    }
    this.lcs.physical = {forward: $.extend(true, [], arr),
			 reverse: JS9.invertMatrix3(arr)};
    if( this.lcs.physical.reverse ){
	if( frot ){
	    this.lcs.physical.frot = $.extend(true, [], frot);
	    this.lcs.physical.rrot = $.extend(true, [], rrot);
	    // zero-index center
	    this.lcs.physical.cx = cx - arr[2][0] - 1;
	    this.lcs.physical.cy = cy - arr[2][1] - 1;
	}
    } else {
	delete this.lcs.physical;
    }
    // detector coordinates
    arr[0][0] = JS9.defNull(header.DTM1_1, 1.0);
    arr[1][0] = header.DTM2_1 || 0.0;
    arr[0][1] = header.DTM1_2 || 0.0;
    arr[1][1] = JS9.defNull(header.DTM2_2, 1.0);
    arr[2][0] = header.DTV1   || 0.0;
    arr[2][1] = header.DTV2   || 0.0;
    this.lcs.detector = {forward: $.extend(true, [], arr),
			reverse: JS9.invertMatrix3(arr)};
    if( this.lcs.detector.reverse ){
	if( frot ){
	    this.lcs.detector.frot = $.extend(true, [], frot);
	    this.lcs.detector.rrot = $.extend(true, [], rrot);
	    // zero-index center
	    this.lcs.detector.cx = cx - arr[2][0] - 1;
	    this.lcs.detector.cy = cy - arr[2][1] - 1;
	}
    } else {
	delete this.lcs.detector;
    }
    // amplifier coordinates
    arr[0][0] = JS9.defNull(header.ATM1_1, 1.0);
    arr[1][0] = header.ATM2_1 || 0.0;
    arr[0][1] = header.ATM1_2 || 0.0;
    arr[1][1] = JS9.defNull(header.ATM2_2, 1.0);
    arr[2][0] = header.ATV1   || 0.0;
    arr[2][1] = header.ATV2   || 0.0;
    this.lcs.amplifier = {forward: $.extend(true, [], arr),
			  reverse: JS9.invertMatrix3(arr)};
    if( this.lcs.amplifier.reverse ){
	if( frot ){
	    this.lcs.amplifier.frot = $.extend(true, [], frot);
	    this.lcs.amplifier.rrot = $.extend(true, [], rrot);
	    // zero-index center
	    this.lcs.amplifier.cx = cx - arr[2][0] - 1;
	    this.lcs.amplifier.cy = cy - arr[2][1] - 1;
	}
    } else {
	delete this.lcs.amplifier;
    }
    // reset lcs to image, if necessary
    if( this.params && !this.lcs[this.params.lcs] ){
	this.params.lcs = "image";
    }
    // set current, if not already done
    if( this.params && !this.params.wcssys0 ){
	this.setWCSSys("physical");
	this.params.wcssys0 = this.params.lcs;
    }
    // save original physical
    if( this.lcs.physical && !this.lcs.ophysical ){
	this.lcs.ophysical = $.extend(true, {}, this.lcs.physical);
    }
    // allow chaining
    return this;
};

// read input object and convert to image data
JS9.Image.prototype.mkRawDataFromHDU = function(obj, opts){
    let i, s, ui, clen, hdu, pars, card, got, rlen, rmvfile, done, frheap;
    let oraw, owidth, oheight, obitpix, owcssys, owcsunits;
    let header, x1, y1, bin;
    let nhist = 0;
    let ncomm = 0;
    opts = opts || {};
    if( $.isArray(obj) || JS9.isTypedArray(obj) || obj instanceof ArrayBuffer ){
	// flatten if necessary
	if( $.isArray(obj[0]) ){
	    obj = obj.reduce( (a, b) => { return a.concat(b); });
	}
	// javascript array or typed array
	hdu = {image: obj};
    } else if( typeof obj === "object" ){
	// fits object
	hdu = obj;
    } else {
	JS9.error("unknown or missing input for HDU creation");
    }
    // allow image to be passed in data property
    if( hdu.data && !hdu.image ){
	hdu.image = hdu.data;
    }
    // better have the image ...
    if( !hdu.image ){
	JS9.error(`data missing from JS9 FITS object: ${JSON.stringify(hdu)}`);
    }
    // quick check for 1D images (in case naxis is defined)
    if( hdu.naxis < 2 ){
	JS9.error("can't image a FITS file with less than 2 dimensions");
    }
    // save old essential values, if possible (for use as defaults)
    // free previous WCS, if possible
    if( this.raw ){
	oraw = this.raw;
	owidth = this.raw.width;
	oheight = this.raw.height;
	obitpix = this.raw.bitpix;
	owcssys = this.params.wcssys;
	owcsunits = this.params.wcsunits;
	this.freeWCS();
    }
    // initialize raws array?
    this.raws = this.raws || [];
    rlen = this.raws.length;
    if( !rlen ){
	// create object to hold raw data and add to raws array
	this.raws.push({from: "hdu"});
	// assign this object to the high-level raw data object
	this.raw = this.raws[rlen];
	// ignore rawid, this is the default raw data
	this.raw.id = JS9.RAWID0;
    } else {
	opts.rawid = opts.rawid || JS9.RAWIDX;
	// reuse raw object with the same id, after re-initializing it
	got = 0;
	for(i=0; i<rlen; i++){
	    if( opts.rawid === this.raws[i].id  ){
		s = this.raws[i].from;
		this.raws[i] = {from: s, id: opts.rawid};
		this.raw = this.raws[i];
		got++;
		break;
	    }
	}
	// otherwise, create new raw object with this id
	if( !got ){
	    // create the object to hold raw data and add to raws array
	    this.raws.push({from: "hdu", id: opts.rawid});
	    // assign this object to the high-level raw data object
	    this.raw = this.raws[rlen];
	    // the old raw object is invalid
	    oraw = null;
	}
    }
    // now save the hdu in the raw object
    this.raw.hdu = hdu;
    // fill in raw data info directly from the fits object
    if( hdu.axis ){
	this.raw.width  = hdu.axis[1];
	this.raw.height = hdu.axis[2];
    } else if( hdu.naxis1 && hdu.naxis2 ){
	this.raw.width  = hdu.naxis1;
	this.raw.height = hdu.naxis2;
    } else if( owidth && oheight ){
	this.raw.width  = owidth;
	this.raw.height = oheight;
    }
    if( hdu.bitpix ){
	this.raw.bitpix = hdu.bitpix;
    } else if( obitpix ){
	this.raw.bitpix = obitpix;
    }

    // if the data is base64-encoded, decode it now
    if( hdu.encoding === "base64" ){
	s = window.atob(hdu.image);
	// make an arraybuffer to hold the bytes from the decoded string
	hdu.image = new ArrayBuffer(s.length);
	ui = new Uint8Array(hdu.image);
	// to be turned into the right datatyped typed array, below
	for(i=0; i<s.length; i++){
	   ui[i] = s.charCodeAt(i);
	}
    }
    // make sure we have a typed array
    // flatten if necessary
    if( $.isArray(hdu.image[0]) ){
	hdu.image = hdu.image.reduce( (a, b) => { return a.concat(b); });
    }
    // make the raw data: note in the case of a typed array coming from
    // the Emscripten heap, this is a copy, so we can free the heap immediately
    // (done below iff clearImageMemory contains the "heap" directive).
    // I didn't realize new XXXArray(typedArray) makes a copy, but see:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
    switch(this.raw.bitpix){
    case 8:
	this.raw.data = new Uint8Array(hdu.image);
	break;
    case 16:
	this.raw.data = new Int16Array(hdu.image);
	break;
    case -16:
	this.raw.data = new Uint16Array(hdu.image);
	break;
    case 32:
	this.raw.data = new Int32Array(hdu.image);
	break;
    case -32:
	this.raw.data = new Float32Array(hdu.image);
	break;
    case -64:
	this.raw.data = new Float64Array(hdu.image);
	break;
    default:
	JS9.error(`unsupported bitpix: ${this.raw.bitpix}`);
	break;
    }
    // array of cards
    this.raw.card = hdu.card;
    // cfitsio returns these:
    this.raw.cardstr = hdu.cardstr;
    this.raw.ncard = hdu.ncard;
    // look for header
    if( hdu.head ){
	this.raw.header = hdu.head;
    } else if( this.raw.card ){
	this.raw.header = {};
	// make up header from array of raw cards
	clen = this.raw.card.length;
	for(i=0; i<clen; i++){
	    pars = JS9.cardpars(this.raw.card[i]);
	    if( pars !== undefined ){
		if( pars[0] === "HISTORY" ){
		    this.raw.header[`${pars[0]}__${nhist++}`] = pars[1];
		} else if( pars[0] === "COMMENT" ){
		    this.raw.header[`${pars[0]}__${ncomm++}`] = pars[1];
		} else {
		    this.raw.header[pars[0]] = pars[1];
		}
	    }
	}
    } else if( this.raw.cardstr ){
	this.raw.header = {};
	// make up header from string containing 80-char raw cards
	clen = this.raw.ncard;
	for(i=0; i<clen; i++){
	    card = this.raw.cardstr.slice(i*80, (i+1)*80);
	    pars = JS9.cardpars(card);
	    if( pars !== undefined ){
		if( pars[0] === "HISTORY" ){
		    this.raw.header[`${pars[0]}__${nhist++}`] = pars[1];
		} else if( pars[0] === "COMMENT" ){
		    this.raw.header[`${pars[0]}__${ncomm++}`] = pars[1];
		} else {
		    this.raw.header[pars[0]] = pars[1];
		}
	    }
	}
    } else {
	// simplest FITS header imaginable
	this.raw.header = {};
	this.raw.header.SIMPLE = true;
	this.raw.header.NAXIS = 2;
	this.raw.header.NAXIS1 = this.raw.width;
	this.raw.header.NAXIS2 = this.raw.height;
	this.raw.header.BITPIX = this.raw.bitpix;
    }
    // convenience variable
    header = this.raw.header;
    // hack for binning.js:
    // if an original file header has LTM/LTV keywords, save them now,
    // so we can go back to file coords at any time
    if( !oraw && !this.parentFile && !this.parent ){
	if( header.LTV1 !== undefined   || header.LTV2 !== undefined   ||
	    header.LTM1_1 !== undefined || header.LTM2_2 !== undefined ){
	    this.parent = {};
	    this.parent.raw = {header: $.extend(true, {}, header)};
	    // initialize LCS for this parent header
	    this.parent.lcs = {};
	    // call is used because this.parent is not an image object
	    JS9.Image.prototype.initLCS.call(this.parent,
					     this.parent.raw.header);
	}
    }
    // if section information is available, modify the WCS keywords
    // e.g., image sections from astroem/getFITSImage()
    // this code should match the algorithm in jsfitsio.c/updateWCS()
    if( hdu.imtab === "image"  &&
	(hdu.x1 !== undefined  && hdu.x1 !== 1)  ||
	(hdu.y1 !== undefined  && hdu.y1 !== 1)  ||
	(hdu.bin === undefined || hdu.bin !== 1) ){
	x1 = JS9.defNull(hdu.x1, 1);
	y1 = JS9.defNull(hdu.y1, 1);
	bin = hdu.bin || 1;
	if( bin < 0 ){ bin = 1.0 / Math.abs(bin); }
	if( JS9.notNull(header.NAXIS1) ){ header.NAXIS1 /= bin;	}
	if( JS9.notNull(header.NAXIS2) ){ header.NAXIS2 /= bin;	}
	if( JS9.notNull(header.CRPIX1) ){
	    // funtools-style: see funtools/funcopy.c/_FunCopy2ImageHeader
	    header.CRPIX1 = (header.CRPIX1 + 1.0 - x1 - 0.5) / bin + 0.5;
	    // cfitsio-style: see cfitsio/histo.c
	    // header.CRPIX1 = (header.CRPIX1 - x1) / bin + 0.5;
	}
	if( JS9.notNull(header.CRPIX2) ){
	    // funtools-style: see funtools/funcopy.c/_FunCopy2ImageHeader
	    header.CRPIX2 = (header.CRPIX2 + 1.0 - y1 - 0.5) / bin + 0.5;
	    // cfitsio-style: see cfitsio/histo.c
	    // header.CRPIX2 = (header.CRPIX2 - y1) / bin + 0.5;
	}
	if( JS9.notNull(header.CDELT1) ){ header.CDELT1 *= bin; }
	if( JS9.notNull(header.CDELT2) ){ header.CDELT2 *= bin; }
	if( JS9.notNull(header.CD1_1) ){  header.CD1_1  *= bin; }
	if( JS9.notNull(header.CD1_2) ){  header.CD1_2  *= bin; }
	if( JS9.notNull(header.CD2_1) ){  header.CD2_1  *= bin; }
	if( JS9.notNull(header.CD2_2) ){  header.CD2_2  *= bin; }
	header.LTM1_1 = JS9.defNull(header.LTM1_1, 1.0);
	header.LTM1_1 = header.LTM1_1 / bin;
	header.LTM2_1 = header.LTM2_1 || 0.0;
	header.LTM2_1 = header.LTM2_1 / bin;
	header.LTM1_2 = header.LTM1_2 || 0.0;
	header.LTM1_2 = header.LTM1_2 / bin;
	header.LTM2_2 = JS9.defNull(header.LTM2_2, 1.0);
	header.LTM2_2 = header.LTM2_2 / bin;
	// cfitsio-style: see cfitsio/histo.c
	// it's a mystery why funtools-style does not work here ...
	// (sigh ...cause LTV is 0-indexed but x1 is 1-indexed?)
	header.LTV1 = header.LTV1 || 0;
	header.LTV1 = (header.LTV1 - x1) / bin + 0.5;
	header.LTV2 = header.LTV2 || 0;
	header.LTV2 = (header.LTV2 - y1) / bin + 0.5;
    }
    // add header param to tell LCS system to use CROTA2 to modify LTM
    // needed because Montage does not know about LTM
    if( opts.lcsUseRota2 ){
	header.LCSROTA2 = true;
    }
    // look for a file/url (we'll also get a new id, see below)
    if( opts.file && opts.file !== this.file ){
	this.file = opts.file;
	this.id = null;
    } else if( opts.filename && opts.filename !== this.file ){
	// (11/2021: leave check on 'filename' for backward compatibility)
	this.file = opts.filename;
	this.id = null;
    } else if( hdu.file && hdu.file !== this.file ){
	this.file = hdu.file;
	this.id = null;
    }
    this.file = JS9.cleanPath(this.file) || (JS9.ANON + JS9.uniqueID());
    // save original file in case we add an extension
    this.file0 = this.file;
    // look for an id
    if( opts.id ){
	// get a unique id for this image
	this.id0 = opts.id;
	this.id = JS9.getImageID(opts.id, this.display.id, this);
    }
    // add extname or extnum, if possible
    if( !this.id && this.file && !this.file.match(/\[.*[^a-zA-Z0-9_].*\]/) ){
	if( opts.extname || opts.extnum ){
	    if( opts.extname ){
		this.file = this.file.replace(/\[.*\]/, "");
		this.file += `[${opts.extname}]`;
	    } else if( opts.extnum && (opts.extnum > 0) ){
		this.file = this.file.replace(/\[.*\]/, "");
		this.file += `[${opts.extnum}]`;
	    }
	    if( hdu.fits ){
		if( opts.extname ){
		    hdu.fits.extname = opts.extname;
		}
		if( opts.extnum && (opts.extnum > 0) ){
		    hdu.fits.extnum = opts.extnum;
		}
	    }
	} else if( hdu.fits ){
	    if( hdu.fits.extname ){
		this.file = this.file.replace(/\[.*\]/, "");
		this.file += `[${hdu.fits.extname}]`;
	    } else if( hdu.fits.extnum && (hdu.fits.extnum > 0) ){
		this.file = this.file.replace(/\[.*\]/, "");
		this.file += `[${hdu.fits.extnum}]`;
	    }
	} else if( this.raw.header ){
	    if( this.raw.header.EXTNAME ){
		this.file = this.file.replace(/\[.*\]/, "");
		this.file += `[${this.raw.header.EXTNAME}]`;
	    }
	}
    }
    // last chance: get it from the file
    if( !this.id ){
	// save id in case we have to change it for uniqueness
	this.id0 = (this.parentFile||this.file).split("/").reverse()[0];
	// get a unique id for this image
	this.id = JS9.getImageID(this.id0, this.display.id, this);
    }
    // is this a proxy image?
    if( opts.proxyFile ){
	this.proxyFile = opts.proxyFile;
    }
    // save filter, if necessary
    this.raw.filter = opts.filter || "";
    this.raw.columns = opts.columns || "";
    // image or table?
    if( hdu.imtab ){
	this.imtab = hdu.imtab;
    } else {
	this.imtab = hdu.table ? "table" : "image";
    }
    // also associate imtab with this raw layer
    this.raw.imtab = this.imtab;
    // min and max data values
    if( hdu.dmin !== undefined && hdu.dmax !== undefined ){
	// data min and max in object
	this.dataminmax(hdu.dmin, hdu.dmax);
    } else {
	// calculate data min and max
	this.dataminmax();
    }
    // object, telescope, instrument names
    this.object = this.raw.header.OBJECT;
    this.telescope = this.raw.header.TELESCOP;
    this.instrument = this.raw.header.INSTRUME;
    // see if binning was passed to us in opts, e.g. from external imsection
    // (internally, it's ordinarily in hdu or hdu.table)
    if( opts.binstr ){
	try{ s =  opts.binstr.split(/\s+/);
	     if( s && s.length === 2 ){
		 if( (this.imtab === "table") && hdu.table ){
		     hdu.table.bin = parseFloat(s[0]);
		     hdu.table.binMode = s[1];
		 } else {
		     hdu.bin = parseFloat(s[0]);
		     hdu.binMode = s[1];
		 }
	     }
	   }
	catch(ignore){ /* empty */ }
    }
    // reset binning properties, as necessary
    if( (this.imtab === "table") && hdu.table ){
	this.binning.bin = hdu.table.bin || 1;
    } else if( hdu.bin ){
	this.binning.bin = hdu.bin > 0 ? hdu.bin : 1 / Math.abs(hdu.bin);
    } else {
	this.binning.bin = 1;
    }
    // make sure obin matches bin for previous load of data
    if( !oraw ){
	this.binning.obin = this.binning.bin;
    }
    // reset the wcssys and wcsunits to previous, if necessary
    if( owcssys ){
	this.setWCSSys(owcssys);
    }
    if( owcsunits ){
	this.setWCSUnits(owcsunits);
    }
    // init WCS, if necessary
    if( oraw && oraw.header.CTYPE1 && oraw.header.CTYPE2 &&
	this.raw.header.CTYPE1 && this.raw.header.CTYPE2 &&
	(oraw.header.CTYPE1 !== this.raw.header.CTYPE1   ||
	 oraw.header.CTYPE2 !== this.raw.header.CTYPE2)  ){
	this.initWCS();
    }
    // save offscreen data if necessary
    if( JS9.notNull(hdu.offscreen) ){
	this.png = {image: hdu.offscreen};
	this.mkOffScreenCanvas();
    }
    // re-init wcs
    this.initWCS();
    // init the logical coordinate system, if possible
    this.initLCS();
    // get hdu info, if possible
    try{
	if( opts.hdus ){
	    this.hdus = opts.hdus;
	} else if( this.parentFile &&
		   JS9.helper.connected && JS9.helper.js9helper ){
	    obj = {
		id: this.expandMacro("$id"),
		cmd: this.expandMacro("js9Xeq listhdus $filename"),
		image: this.file,
		fits: this.parentFile,
		rtype: "text"
	    };
	    JS9.helper.send("listhdus", obj, (obj) => {
		if( obj.stderr ){
		    return;
		}
		if( obj.errcode ){
		    return;
		}
		if( obj.stdout ){
		    try{ this.hdus = JSON.parse(obj.stdout); }
		    catch(e) { this.hdus = null; }
		}
	    });
	} else if( this.raw.hdu && this.raw.hdu.fits ){
	    s = JS9.listhdu(this.raw.hdu.fits.vfile);
	    if( s ){
		try{ this.hdus = JSON.parse(s); }
		catch(e) { this.hdus = null; }
	    }
	}
    }
    catch(ignore){ /* empty */ }
    // can we remove the virtual file?
    if( this.raw.hdu && this.raw.hdu.fits && this.raw.hdu.fits.vfile  ){
	s = JS9.globalOpts.clearImageMemory;
	if( s === false ){
	    s = ["never"];
	} else if( s === true ){
	    s = ["always"];
	} else {
	    s = s.toLowerCase().split(/[,>]/);
	}
	rmvfile = false;
	frheap = false;
	// all conditions must be met ...
	for(i=0, done=false; i<s.length && !done; i++){
	    switch(s[i]){
	    case "never":
		rmvfile = false;
		done = true;
		break;
	    case "always":
		rmvfile = true;
		done = true;
		break;
	    case "heap":
		frheap = true;
		break;
	    case "auto":
		if( (this.raw.header.NAXIS <= 2)  &&
		    (!this.hdus || this.hdus.length === 1) ){
		    rmvfile = true;
		} else {
		    rmvfile = false;
		    done = true;
		}
		break;
	    case "nocube":
		if( this.raw.header.NAXIS <= 2 ){
		    rmvfile = true;
		} else {
		    rmvfile = false;
		    done = true;
		}
		break;
	    case "noext":
		if( !this.hdus || this.hdus.length === 1 ){
		    rmvfile = true;
		} else {
		    rmvfile = false;
		    done = true;
		}
		break;
	    case "size":
		if( s[i+1] ){
		    if( JS9.vsize(hdu.fits.vfile) > s[i+1]*1000000 ){
			rmvfile = true;
		    } else {
			rmvfile = false;
			done = true;
		    }
		} else {
		    rmvfile = false;
		    done = true;
		}
		break;
	    default:
		break;
	    }
	}
	// remove virtual file and/or heap space
	if( rmvfile ){
	    if( JS9.DEBUG > 2 ){
		JS9.log("removing underlying FITS vfile for %s: %s",
			this.id, this.raw.hdu.fits.vfile);
	    }
	    JS9.cleanupFITSFile(this.raw, true);
	} else if( frheap ){
	    if( JS9.DEBUG > 2 ){
		JS9.log("freeing heap space for %s: %s",
			this.id, this.raw.hdu.fits.vfile);
	    }
	    JS9.cleanupFITSFile(this.raw, false);
	}
    }
    // plugin callbacks
    this.xeqPlugins("image", "onrawdata");
    // allow chaining
    return this;
};

// store section information
JS9.Image.prototype.mkSection = function(...args){
    let s, xtra;
    const sect = this.rgb.sect;
    const getWidth = (zoom) => {
	let len;
	let canvas = this.display.canvas;
	if( this.params.transformAngle ){
	    len = Math.max(canvas.width, canvas.height);
	    return Math.min(this.raw.width * zoom, len);
	} else {
	    return Math.min(this.raw.width * zoom, canvas.width);
	}
    };
    const getHeight = (zoom) => {
	let len;
	let canvas = this.display.canvas;
	if( this.params.transformAngle ){
	    len = Math.max(canvas.width, canvas.height);
	    return Math.min(this.raw.height * zoom, len);
	} else {
	    return Math.min(this.raw.height * zoom, canvas.height);
	}
    };
    // save zoom in case we are about to change it (regions have to be scaled)
    sect.ozoom  = sect.zoom;
    // process args
    switch(args.length){
    case 0:
	// no args: init to display central part of image
	sect.xcen   = Math.floor(this.raw.width/2);
	sect.ycen   = Math.floor(this.raw.height/2);
	sect.width  = getWidth(1);
	sect.height = getHeight(1);
	break;
    case 1:
	if( !JS9.isNumber(args[0]) ){
	    JS9.error(`invalid input for generating section: ${args[0]}`);
	}
	sect.zoom   = parseFloat(args[0]);
	sect.width  = getWidth(sect.zoom);
	sect.height = getHeight(sect.zoom);
	break;
    case 2:
	// two args: x, y
	if( !JS9.isNumber(args[0]) || !JS9.isNumber(args[1]) ){
	    JS9.error(`invalid input for generating section: ${args[0]} ${args[1]}`);
	}
	sect.xcen   = parseFloat(args[0]);
	sect.ycen   = parseFloat(args[1]);
	// reset width and height if there was a section offset
	if( JS9.notNull(sect.ix) ){
	    sect.width  = getWidth(sect.zoom);
	}
	if( JS9.notNull(sect.iy) ){
	    sect.height = getHeight(sect.zoom);
	}
	break;
    case 3:
	// three args: x, y, zoom
	if( !JS9.isNumber(args[0]) ||
	    !JS9.isNumber(args[1]) ||
	    !JS9.isNumber(args[2]) ){
	    JS9.error(`invalid input for generating section: ${args[0]} ${args[1]} ${args[2]}`);
	}
	sect.xcen   = parseFloat(args[0]);
	sect.ycen   = parseFloat(args[1]);
	sect.zoom   = parseFloat(args[2]);
	sect.width  = getWidth(sect.zoom);
	sect.height = getHeight(sect.zoom);
	break;
    default:
	break;
    }
    // assume no offset when displaying section
    delete sect.ix;
    delete sect.iy;
    // calculate section limits from center and dimensions
    sect.x0 = sect.xcen - (sect.width/(2*sect.zoom));
    sect.y0 = sect.ycen - (sect.height/(2*sect.zoom));
    sect.x1 = sect.xcen + (sect.width/(2*sect.zoom));
    sect.y1 = sect.ycen + (sect.height/(2*sect.zoom));
    // make sure we're within bounds while maintaining section dimensions
    if( sect.x0 < 0 ){
	if( JS9.globalOpts.panWithinDisplay ){
            sect.x1 -= sect.x0;
	} else {
	    sect.ix = sect.x0 * sect.zoom;
	}
        sect.x0 = 0;
    }
    if( sect.y0 < 0 ){
	if( JS9.globalOpts.panWithinDisplay ){
            sect.y1 -= sect.y0;
	} else {
	    sect.iy = sect.y0 * sect.zoom;
	}
        sect.y0 = 0;
    }
    if( sect.x1 > this.raw.width ){
	if( JS9.globalOpts.panWithinDisplay ){
            sect.x0 -= (sect.x1 - this.raw.width);
	} else {
	    sect.ix = (sect.x1 - this.raw.width) * sect.zoom;
	}
        sect.x1 = this.raw.width;
    }
    if( sect.y1 > this.raw.height ){
	if( JS9.globalOpts.panWithinDisplay ){
            sect.y0 -= (sect.y1 - this.raw.height);
	} else {
	    sect.iy = (sect.y1 - this.raw.height) * sect.zoom;
	}
        sect.y1 = this.raw.height;
    }
    // for offset images, maybe display more of the image
    if( sect.ix > 0 && sect.x0 > 0 ){
	xtra =  Math.min(sect.ix, sect.x0);
	sect.x0 -= xtra;
	sect.ix += xtra * sect.zoom;
    }
    if( sect.ix < 0 && sect.x1 < this.raw.width ){
	xtra =  Math.min(this.raw.width - sect.x1, Math.abs(sect.ix));
	sect.x1 += xtra;
	sect.ix -= xtra * sect.zoom;
    }
    if( sect.iy > 0 && sect.y0 > 0 ){
	xtra =  Math.min(sect.iy, sect.y0);
	sect.y0 -= xtra;
	sect.iy += xtra * sect.zoom;
    }
    if( sect.iy < 0 && sect.y1 < this.raw.height ){
	xtra =  Math.min(this.raw.height - sect.y1, Math.abs(sect.iy));
	sect.y1 += xtra;
	sect.iy -= xtra * sect.zoom;
    }
    // final check: make sure we're within bounds
    sect.x0 = Math.max(0, sect.x0);
    sect.x1 = Math.min(this.raw.width, sect.x1);
    sect.y0 = Math.max(0, sect.y0);
    sect.y1 = Math.min(this.raw.height, sect.y1);
    // final integer dimensions
    sect.x0 = Math.floor(sect.x0);
    sect.y0 = Math.floor(sect.y0);
    sect.x1 = Math.floor(sect.x1);
    sect.y1 = Math.floor(sect.y1);
    // final section limits: derive new width and height
    sect.width   = Math.ceil((sect.x1 - sect.x0) * sect.zoom);
    sect.height  = Math.ceil((sect.y1 - sect.y0) * sect.zoom);
    // sanity check
    if( sect.width <= 0 || sect.height <= 0 ){
	s = sprintf("invalid image section: %s,%s [%s,%s, %s,%s, %s]",
		    sect.width, sect.height,
		    sect.x0, sect.y0, sect.x1, sect.y1,
		    sect.zoom);
	JS9.error(s);
    }
    // put zoom back into params
    this.params.zoom = sect.zoom;
    // allow chaining
    return this;
};

// create colormap index array from data values and specified data min/max
// from: tksao1.0/frame/frametruecolor.C
JS9.Image.prototype.mkColorData = function(){
    let i, dd, idata, odata;
    const ss = JS9.SCALESIZE;
    const length = ss - 1;
    const dmin = this.params.scalemin;
    const dmax = this.params.scalemax;
    const dlen = this.raw.width * this.raw.height;
    const diff = dmax - dmin;
    const dval = length / diff;
    // skip if colormap is static
    if( this.cmapObj.type === "static" ){
	return this;
    }
    // allocate array
    if( !this.colorData || this.colorData.length < dlen ){
	this.colorData = new Int32Array(dlen);
    }
    // Important note 7/13/2020:
    // Chrome 83.0.4103.116 was taking either 4ms ... or 2+ seconds to do
    // this loop on a 2048x2048 int image (casa.fits in js9debug.html).
    // Replacing this.raw.data and this.colorData with local variables seems
    // to fix this slowdown. omg ...
    idata = this.raw.data;
    odata = this.colorData;
    // for each raw value, calculate lookup offset into scaled array
    for(i=0; i<dlen; i++){
	dd = idata[i];
	if( dd <= dmin ){
	    odata[i] = 0;
	} else if( dd >= dmax ){
	    odata[i] = ss - 1;
	} else {
	    odata[i] = Math.floor(((dd - dmin) * dval) + 0.5);
	}
    }
    // allow chaining
    return this;
};

// generate colorcells array from current colormap
// from: tksao1.0/colorbar/colorbar.C
JS9.Image.prototype.calcContrastBias = function(i){
    let r, result;
    let bias = this.params.bias;
    const cs = JS9.COLORSIZE;
    const contrast = this.params.contrast;
    // check for (close to) default
    if( ((bias - 0.5) < 0.0001) && ((contrast - 1.0) < 0.0001) ){
	return i;
    }
    // map i to range of 0 to 1.0
    // shift by bias (if invert, bias = 1 - bias)
    // multiply by contrast
    // shift to center of region
    // expand back to number of dynamic colors
    if( this.params.invert ){
	bias = 1 - bias;
    }
    r = Math.floor((((i / cs) - bias) * contrast + 0.5) * cs);
    if( r < 0 ){
	result = 0;
    } else if( r >= cs ){
	result = cs - 1;
    } else {
	result = r;
    }
    return result;
};

// generate colorcells array from current colormap
// from: tksao1.0/colorbar/colorbartruecolor.C
JS9.Image.prototype.mkColorCells = function(){
    let i, j, idx;
    const cs = JS9.COLORSIZE;
    // skip if colormap is static
    if( this.cmapObj.type === "static" ){
	return this;
    }
    // allocate array for color cells
    if( !this.colorCells ){
	this.colorCells = [];
    }
    // fill in colorcells
    for(i=0; i<cs; i++){
	j = this.params.invert ? cs - i - 1 : i;
	idx = this.calcContrastBias(j);
	this.colorCells[i] = this.cmapObj.mkColorCell(idx);
    }
    // allow chaining
    return this;
};

// create scaled colorCells from colorCells by applying scale algorithm
// from: tksao1.0/frame/colorscale.C
// inverse code from: tksao1.0/frame/inversescale.C
JS9.Image.prototype.mkScaledCells = function(){
    let aa, dd, ii, jj, ll, exp, low, vv, avg, color;
    let data, dlen, diff, bin, total, dval, dmin, dmax, pdf;
    const cs = JS9.COLORSIZE;
    const ss = JS9.SCALESIZE;
    const tt = JS9.INVSIZE;
    const hh = JS9.HISTSIZE;
    const hex2num = (hex) => {
	let i, k, int1, int2;
	const hex_alphabets = "0123456789ABCDEF";
	const value = [];
	//Remove the "#" char - if there is one.
	if(hex.charAt(0) === "#"){
	    hex = hex.slice(1);
	}
	hex = hex.toUpperCase();
	for(i=0, k=0; i<6; i+=2, k++){
	    int1 = hex_alphabets.indexOf(hex.charAt(i));
	    int2 = hex_alphabets.indexOf(hex.charAt(i+1));
	    value[k] = (int1 * 16) + int2;
	}
	return value;
    };
    // sanity check
    if( !this.colorCells ){ return this; }
    // skip if colormap is static
    if( this.cmapObj.type === "static" ){ return this; }
    // allocate array for scaled cells
    if( !this.psColors ){
	this.psColors = [];
	// value for NaN
	this.psColors[NaN] = hex2num(this.params.nancolor);
    }
    // and the inverse array for colorbar ticks
    if( !this.psInverse ){
	this.psInverse = [];
	// value for NaN
	this.psInverse[NaN] = 0;
    }
    // delta for scaling
    dd = this.params.scalemax - this.params.scalemin;
    low = this.params.scalemin;
    // apply the appropriate scale algorithm
    switch(this.params.scale){
    case "linear":
	// scaled cells
	for(ii=0; ii<ss; ii++){
	    aa = ii / ss;
	    ll = Math.floor(aa * cs);
	    this.psColors[ii] = this.colorCells[ll];
	}
	// inverse
	for(ii=0; ii<tt; ii++){
	    aa = ii / tt;
	    this.psInverse[ii] = aa * dd + low;
	}
	break;
    case "log":
	exp = this.params.exp;
	// scaled cells
	for(ii=0; ii<ss; ii++){
	    aa = Math.log(((exp*ii)/ss)+1) / Math.log(exp);
	    ll = Math.floor(aa * cs);
	    if( ll >= cs ){
		ll = cs - 1;
	    }
	    this.psColors[ii] = this.colorCells[ll];
	}
	// inverse
	for(ii=0; ii<tt; ii++){
	    aa = (Math.pow(exp,ii/tt)-1) / exp;
	    this.psInverse[ii] =  aa * dd + low;
	}
	break;
    case "power":
	exp = this.params.exp;
	// scaled cells
	for(ii=0; ii<ss; ii++){
	    aa = (Math.pow(exp, ii/ss)-1) / exp;
	    ll = Math.floor(aa * cs);
	    if( ll >= cs ){
		ll = cs - 1;
	    }
	    this.psColors[ii] = this.colorCells[ll];
	}
	// inverse
	for(ii=0; ii<tt; ii++){
	    aa = Math.log(exp*ii/tt+1) / Math.log(exp);
	    this.psInverse[ii] =  aa * dd + low;
	}
	break;
    case "sqrt":
	// scaled cells
	for(ii=0; ii<ss; ii++){
	    aa = ii / ss;
	    ll = Math.floor(Math.sqrt(aa) * cs);
	    if( ll >= cs ){
		ll = cs - 1;
	    }
	    this.psColors[ii] = this.colorCells[ll];
	}
	// inverse
	for(ii=0; ii<tt; ii++){
	    aa = ii / tt;
	    this.psInverse[ii] =  (aa * aa) * dd + low;
	}
	break;
    case "squared":
	// scaled cells
	for(ii=0; ii<ss; ii++){
	    aa = ii / ss;
	    ll = Math.floor(aa * aa * cs);
	    if( ll >= cs ){
		ll = cs - 1;
	    }
	    this.psColors[ii] = this.colorCells[ll];
	}
	// inverse
	for(ii=0; ii<tt; ii++){
	    aa = Math.sqrt(ii/tt);
	    this.psInverse[ii] =  aa * dd + low;
	}
	break;
    case "asinh":
	// scaled cells
	for(ii=0; ii<ss; ii++){
	    aa = ii / ss;
	    ll = Math.floor(Math.asinh(10.0*aa)/3.0 * cs);
	    if( ll >= cs ){
		ll = cs - 1;
	    }
	    this.psColors[ii] = this.colorCells[ll];
	}
	// inverse
	for(ii=0; ii<tt; ii++){
	    aa = ii / tt;
	    ll = Math.sinh(3.0*aa)/10.0;
	    this.psInverse[ii] =  ll * dd + low;
	}
	break;
    case "sinh":
	// scaled cells
	for(ii=0; ii<ss; ii++){
	    aa = ii / ss;
	    ll = Math.floor(Math.sinh(3.0*aa)/10.0 * cs);
	    if( ll >= cs ){
		ll = cs - 1;
	    }
	    this.psColors[ii] = this.colorCells[ll];
	}
	// inverse
	for(ii=0; ii<tt; ii++){
	    aa = ii / tt;
	    ll = Math.asinh(10.0*aa)/3.0;
	    this.psInverse[ii] =  ll * dd + low;
	}
	break;
    case "histeq":
	// taken from: saods9/tksao1.0/frame/frscale.C
	data = this.raw.data;
	dlen = this.raw.width * this.raw.height;
	diff = (this.raw.dmax - this.raw.dmin);
	dmax = this.raw.dmax;
	dmin = this.raw.dmin;
	bin = 0;
	total = 0;
	pdf = [];
	if( !this.hist || !this.hist.length ){
	    this.hist = [];
	    // start with a cleared pdf buffer
	    for(ii=0; ii<hh; ii++){
		pdf[ii] = 0;
	    }
	    // make histogram from data values
	    for(ii=0; ii<dlen; ii++){
		if( (data[ii] >= dmin) && (data[ii] <= dmax) ){
		    jj = Math.floor((data[ii] - dmin) / diff * hh + 0.5);
		    if( jj < hh ){
			pdf[jj] += 1;
		    }
		}
	    }
	    // get average
	    for(ii=0; ii<hh; ii++){
		total += pdf[ii];
	    }
	    avg = total / hh;
	    // generate histogram
	    for(color=0, ii=0; ii<hh && color<hh; ii++){
		this.hist[ii] = color / hh;
		bin += pdf[ii];
		while( (bin >= avg) && (color < hh) ){
		    bin -= avg;
		    color++;
		}
	    }
	    dval = (hh - 1) /hh;
	    while( ii < hh ){
		this.hist[ii++] = dval;
	    }
	}
	// scaled cells
	for(ii=0; ii<ss; ii++){
	    aa = this.hist[ii * hh / ss];
	    ll = Math.floor(aa * cs);
	    this.psColors[ii] = this.colorCells[ll];
	}
	// inverse
	for(ii=0; ii<tt; ii++){
	    vv = ii / tt;
	    for(jj=0; jj < (hh - 1); jj++){
		if( this.hist[jj] > vv ){
		    break;
		}
	    }
	    aa = jj / hh;
	    this.psInverse[ii] = aa * diff + dmin;
	}
	break;
    default:
	JS9.error(`unknown scale '${this.params.scale}'`);
    }
    // allow chaining
    return this;
};

// create RGB image from scaled colorCells
// sort of from: tksao1.0/frame/truecolor.c, but not really
JS9.Image.prototype.mkRGBImage = function(){
    let rgb, sect, img, xrgb, yrgb, wrgb, hrgb, rgbimg, ctx;
    let inc, zinc, xIn, yIn, xOut, yOut, xOutIdx, yOutIdx, yZoom, xZoom, cobj;
    let idx, odx, odxmax, ridx, gidx, bidx, mim, mimg;
    let yLen, zx, zy, zyLen, mopacity, cmopacity, val;
    let alpha, alpha1, alpha2, alphafloor, alphafloorvalue, curalpha;
    let domask = false;
    let doalphafloor = false;
    let rthis = null;
    let gthis = null;
    let bthis = null;
    let dorgb = false;
    let mimmask = false;
    let mimopacity = false;
    let mimoverlay = false;
    let cached = [];
    // sanity check
    if( !this.rgb ){ return this; }
    // image handles for RGB mode
    if( this.display.rgb.active &&
	((this === this.display.rgb.rim) ||
	 (this === this.display.rgb.gim) ||
	 (this === this.display.rgb.bim)) ){
	dorgb = true;
	if( this.display.rgb.rim ){
	    rthis = this.display.rgb.rim;
	}
	if( this.display.rgb.gim ){
	    gthis = this.display.rgb.gim;
	}
	if( this.display.rgb.bim ){
	    bthis = this.display.rgb.bim;
	}
    }
    ctx = this.display.context;
    rgb = this.rgb;
    sect = rgb.sect;
    // supply your own mkRGBImage call (black-magic, used by smart-x)
    if( this.MakeRGBImage && typeof this.MakeRGBImage === "function" ){
	if( this.MakeRGBImage() ){
	    return this;
	}
    }
    // backward-compatibility with v1.7
    if( this.MakePrimaryImage && typeof this.MakePrimaryImage === "function" ){
	if( this.MakePrimaryImage() ){
	    return this;
	}
    }
    // if we have an RGB file or image overlay, use offsreen RGB colors
    if( this.useOffScreenCanvas() ){
	wrgb = sect.width / sect.zoom;
	hrgb = sect.height / sect.zoom;
	xrgb = sect.x0;
	yrgb = (this.offscreen.canvas.height - 1) - (sect.y0 + hrgb);
	rgbimg = this.offscreen.context.getImageData(xrgb, yrgb, wrgb, hrgb);
	if( sect.zoom === 1 ){
	    // for unzoomed data, we can grab the RGB pixels directly
	    rgb.img = rgbimg;
	} else {
	    // for zoomed data, we have to replicate each RGB pixel
	    rgb.img = ctx.createImageData(sect.width, sect.height);
	    img = rgb.img;
	    odx = 0;
	    for(yIn=0, yOut=0; yIn<rgbimg.height; yIn++, yOut++){
		yLen = yIn * rgbimg.width;
		yOutIdx = yOut * sect.zoom;
		for(xIn=0, xOut=0; xIn<rgbimg.width; xIn++, xOut++){
		    idx = (yLen + xIn) * 4;
		    xOutIdx = xOut * sect.zoom;
		    for(yZoom=0; yZoom<sect.zoom; yZoom++){
			zy = Math.floor(yOutIdx + yZoom);
			zyLen = zy * sect.width;
			for(xZoom=0; xZoom<sect.zoom; xZoom++){
			    zx = Math.floor(xOutIdx + xZoom);
			    odx = (zyLen + zx) * 4;
			    img.data[odx]   = rgbimg.data[idx];
			    img.data[odx+1] = rgbimg.data[idx+1];
			    img.data[odx+2] = rgbimg.data[idx+2];
			    img.data[odx+3] = rgbimg.data[idx+3];
			}
		    }
		}
	    }
	    rgbimg = null;
	}
	return this;
    }
    // create an RGB image if necessary
    if( !rgb.img                         ||
	(rgb.img.width  !== sect.width)  ||
	(rgb.img.height !== sect.height) ){
	rgb.img = ctx.createImageData(sect.width, sect.height);
    }
    img = rgb.img;
    // max starting index into the data
    odxmax = img.data.length - 4;
    // converting raw data, we need psColors or a static colormap
    if( !this.psColors && !this.staticObj ){
	return this;
    }
    // opacity is preferred, but alpha is acceptable
    if( this.params.opacity !== undefined ){
	// opacity is 0.0 to 1.0
	alpha = Math.floor(this.params.opacity * 255);
    } else if( this.params.alpha !== undefined ){
	// alpha is 0 to 255
	alpha = this.params.alpha;
    } else {
	alpha = 255;
    }
    // mask: a raw array with same dimensions as the raw data array
    // whose values are used to set alpha in the raw image
    if( this.mask.active && this.mask.im ){
	mim = this.mask.im;
	if( this.mask.mode === "mask" ){
	    // mask mode: alpha = mask pixel == 0 ? alpha1 : alpha2
	    mimmask = true;
	    // opacity if image value <= mask value
	    if( JS9.notNull(this.mask.vopacity) ){
		alpha1 = this.mask.vopacity * 255;
	    } else {
		alpha1 = 0;
	    }
	    // opacity if image value > mask value
	    if( JS9.notNull(this.params.opacity) ){
		alpha2 = this.params.opacity * 255;
	    } else {
		alpha2 = 255;
	    }
	    // reverse mask alphas, if necessary
	    if( this.mask.invert ){
		alpha = alpha1;
		alpha1 = alpha2;
		alpha2 = alpha;
	    }
	} else if( this.mask.mode === "opacity" ){
	    // opacity mode: alpha = mask value 0 to 1 * 255
	    mimopacity = true;
	} else if( this.mask.mode === "overlay" ){
	    // overlay mode: non-zero mask value is blended with image value
	    mimoverlay = true;
	    mimg = mim.rgb.img;
	    if( JS9.isNull(this.mask.opacity) ){
		this.mask.opacity = 1;
	    }
	}
    } else if( JS9.notNull(this.params.flooropacity) && !dorgb && !domask ){
	// flooropacity: image pixels <= floor value use floor opacity
	// can't do this with rgb mode because we have 3 different data values
	alphafloor = this.params.flooropacity * 255;
	alphafloorvalue = this.params.floorvalue;
	doalphafloor = true;
    }
    // index into scaled data using previously calc'ed data value to get RGB
    // reverse y lines
    odx = 0;
    inc = Math.max(1, Math.floor(1/sect.zoom));
    zinc = sect.zoom * inc;
    for(yIn=Math.floor(sect.y1-1), yOut=0; yIn>=sect.y0; yIn -= inc, yOut++){
	yLen = yIn * this.raw.width;
	yOutIdx = yOut * zinc;
	for(xIn=Math.floor(sect.x0), xOut=0; xIn<sect.x1; xIn += inc, xOut++){
	    // mask mode: use alpha1 if pixel value is to be masked
	    if( mimmask ){
		if( mim.raw.data[yLen +xIn] > this.mask.value ){
		    alpha = alpha2;
		} else {
		    alpha = alpha1;
		}
	    } else if( mimopacity ){
		// opacity mode: masked value is the opacity
		alpha = mim.raw.data[yLen +xIn] * 255;
	    }
	    if( dorgb ){
		// rgb mode: up to three indexes
		ridx = rthis ? rthis.colorData[yLen + xIn] : 0;
		gidx = gthis ? gthis.colorData[yLen + xIn] : 0;
		bidx = bthis ? bthis.colorData[yLen + xIn] : 0;
		if( JS9.isNull(ridx) || JS9.isNull(gidx) || JS9.isNull(bidx) ){
		    this.display.rgb.active = false;
		    JS9.error("RGB images are incompatible. Turning off RGB mode.", "", false);
		    this.mkRGBImage();
		    return this;
		}
	    } else if( !this.staticObj ){
		// ordinary case: one index
		idx = this.colorData[yLen + xIn];
	    }
	    // current alpha to use in most cases
	    curalpha = alpha;
	    // use alpha min when data val is below threshold?
	    if( doalphafloor && this.raw.data[yLen + xIn] <= alphafloorvalue ){
		curalpha = alphafloor;
	    }
	    xOutIdx = xOut * zinc;
	    for(yZoom=0; yZoom<sect.zoom; yZoom++){
		// ceil avoids non-integer zoom cross-hair artifacts ...
		zy = Math.ceil(yOutIdx + yZoom);
		zyLen = zy * sect.width;
		for(xZoom=0; xZoom<sect.zoom; xZoom++){
		    // ceil avoids non-integer zoom cross-hair artifacts ...
		    zx = Math.ceil(xOutIdx + xZoom);
		    // final index into output buffer
		    odx = (zyLen + zx) * 4;
		    // check for odx out-of-bounds
		    if( odx <= odxmax ){
			// special case: rgb mode
			if( dorgb ){
			    if( rthis ){
				img.data[odx]   = rthis.psColors[ridx][0];
			    } else {
				img.data[odx] = 0;
			    }
			    if( gthis ){
				img.data[odx+1] = gthis.psColors[gidx][1];
			    } else {
				img.data[odx+1] = 0;
			    }
			    if( bthis ){
				img.data[odx+2] = bthis.psColors[bidx][2];
			    } else {
				img.data[odx+2] = 0;
			    }
			    img.data[odx+3] = alpha;
			} else {
			    if( this.staticObj ){
				// special case: static colormap
				val = this.raw.data[yLen+xIn];
				cobj = JS9.lookupStaticColor(this, val, cached);
				img.data[odx]   = cobj.red;
				img.data[odx+1] = cobj.green;
				img.data[odx+2] = cobj.blue;
				img.data[odx+3] = cobj.alpha;
			    } else if( this.psColors[idx] !== undefined ){
				// mask overlay: the mask color values
				// using source-atop composition
				if( mimoverlay && mimg.data[odx+3] ){
				    // average the global mask opacity with the
				    // local pixel opacity (is this OK??)
				    mopacity =  this.mask.opacity * (mimg.data[odx+3]/255);
				    cmopacity = 1 - mopacity;
				    img.data[odx]   = mimg.data[odx] * mopacity + this.psColors[idx][0] * cmopacity;
				    img.data[odx+1] = mimg.data[odx+1] * mopacity + this.psColors[idx][1] * cmopacity;
				    img.data[odx+2] = mimg.data[odx+2] * mopacity + this.psColors[idx][2] * cmopacity;
				    img.data[odx+3] = 255;
				} else {
				    // ordinary case
				    img.data[odx]   = this.psColors[idx][0];
				    img.data[odx+1] = this.psColors[idx][1];
				    img.data[odx+2] = this.psColors[idx][2];
				    img.data[odx+3] = curalpha;
				}
			    }
			}
		    }
		}
	    }
	}
    }
    // allow chaining
    return this;
};

// calling sequences:
//  blendImage()                   # return current blend params
//  blendImage(true||false)        # turn on/off blending
//  blendImage(mode, opacity)      # set blend mode and opacity
JS9.Image.prototype.blendImage = function(...args){
    let [mode, opacity, active] = args;
    // see composite and blend operations: https://www.w3.org/TR/compositing-1/
    const blendexp = /normal|multiply|screen|overlay|darken|lighten|color-dodge|color-burn|hard-light|soft-light|difference|exclusion|hue|saturation|color|luminosity|clear|copy|source-over|destination-over|source-in|destination-in|source-out|destination-out|source-atop|destination-atop|xor|lighter/i;
    if( args.length === 0 ){
	return this.blend;
    }
    // if first arg is true or false, this turns on/off blending
    if( (mode === true)   || (mode === false)   ||
	(mode === "true") || (mode === "false") ){
	if( mode === "true" ){
	    mode = true;
	} else if( mode === "false" ){
	    mode = false;
	}
	this.blend.active = mode;
	// trigger option redisplay
	this.xeqPlugins("image", "onimageblend");
	if( this.display.blendMode ){
	    this.displayImage();
	}
	return this;
    }
    if( JS9.notNull(mode) || JS9.notNull(opacity) ){
	// set blend mode, if necessary
	if( JS9.notNull(mode) ){
	    if( !blendexp.test(mode) ){
		JS9.error(`invalid composite/blend operation: ${mode}`);
	    }
	    this.blend.mode = mode;
	}
	// set opacity, if necessary
	if( JS9.notNull(opacity) ){
	    if( typeof opacity === "string" ){
		opacity = parseFloat(opacity);
	    } else if( typeof opacity !== "number" ){
		JS9.error(`invalid opacity: ${opacity}`);
	    }
	    this.blend.opacity = Math.min(Math.max(opacity, 0), 1);
	}
	// set active state, if necessary
	if( JS9.notNull(active) ){
	    if( active === "true" ){
		active = true;
	    } else if( active === "false" ){
		active = false;
	    }
	    this.blend.active = active;
	}
	// trigger option redisplay
	this.xeqPlugins("image", "onimageblend");
	// display blended result, if necessary
	if( this.display.blendMode && this.blend.active ){
	    this.displayImage();
	}
    }
    // allow chaining
    return this;
};

// apply an image mask to an image
JS9.Image.prototype.maskImage = function(...args){
    let [s, opts] = args;
    let im, key;
    // return mask info
    if( !args.length ){
	return this.mask;
    }
    // if first arg is true or false, this turns on/off masking
    if( (s === true)   || (s === false) || (s === "true") || (s === "false") ){
	if( s === "true" ){
	    s = true;
	} else if( s === "false" ){
	    s = false;
	}
	this.mask.active = s;
	// trigger option redisplay
	this.xeqPlugins("image", "onimagemask");
	this.displayImage();
	return this;
    }
    // json string
    if( typeof s === "string" && s.charAt(0) === '{' ){
	try{ s = JSON.parse(s); }
	catch(e){ JS9.error(`can't parse JSON in maskImage: ${s}`, e); }
    }
    // is this the image object or the opts object?
    if( !JS9.isImage(s) && !opts ){
	opts = s;
	s = null;
    }
    // ok, we think we have an image
    if( s ){
	// get image handle
	im = JS9.lookupImage(s);
	// sanity check
	if( !im ){
	    JS9.error(`unknown image for maskImage: ${s}`);
	}
	if( this.raw.width  !== im.raw.width  ||
	    this.raw.height !== im.raw.height ){
	    JS9.error(`maskImage: mask dims (${im.raw.width},${im.raw.height}) don't match image dims (${this.raw.width},${this.raw.height})`);
	}
	// set up the image mask and turn on masking
	this.mask.im = im;
	this.mask.active = true;
    }
    // handle opts
    if( opts ){
	if( typeof opts === "string" ){
	    try{ opts = JSON.parse(opts); }
	    catch(e){ JS9.error(`can't parse JSON in maskImage: ${opts}`, e); }
	}
	// add opts to mask object
	for( key of Object.keys(opts) ){
	    switch(key){
	    case "opacity":
		// handle opacity specially to avoid name collision
		this.mask.vopacity = opts[key];
		break;
	    default:
		this.mask[key] = opts[key];
		break;
	    }
	}
    }
    // keep images in sync, if necessary
    if( im && (!opts || opts.sync !== false)  &&
	typeof this.syncImages === "function" ){
	this.syncImages(this.mask.syncops, [im]);
    }
    // redisplay with the new mask
    if( im || opts ){
	this.displayImage();
    }
};

// calculate and set offsets into display where image is to be written
JS9.Image.prototype.calcDisplayOffsets = function(dowcs){
    let wcsim, wcssect, npos, oval;
    const sect = this.rgb.sect;
    // calculate offsets
    this.ix = (this.display.canvas.width - this.rgb.img.width) / 2;
    this.iy = (this.display.canvas.height - this.rgb.img.height) / 2;
    // adjust when section is not centered on display
    if( JS9.notNull(sect.ix) ){
	this.ix -= sect.ix / 2;
    }
    if( JS9.notNull(sect.iy) ){
	this.iy += sect.iy / 2;
    }
    // ensure integer offsets
    this.ix = Math.floor(this.ix);
    this.iy = Math.floor(this.iy);
    // do wcs alignment, if necessary
    if( dowcs && this.wcsAlign() ){
	// calc offsets so as to align with the wcs image
	wcsim = this.wcsim;
	wcssect = wcsim.rgb.sect;
	// we will pan this image to the wcsim's display section
	npos = JS9.pix2pix(wcsim, this, wcsim.getPan());
	// and use those image coords for the center of the section
	oval = JS9.globalOpts.panWithinDisplay;
	JS9.globalOpts.panWithinDisplay = true;
	this.tmp.ozoom = this.rgb.sect.ozoom;
	this.mkSection(npos.x, npos.y, wcssect.zoom);
	this.rgb.sect.ozoom = this.tmp.ozoom; delete this.tmp.ozoom;
	JS9.globalOpts.panWithinDisplay = oval;
	// offsets of these images
	this.ix -= (sect.xcen - ((sect.x0 + sect.x1)/2)) * wcssect.zoom;
	this.iy += (sect.ycen - ((sect.y0 + sect.y1)/2)) * wcssect.zoom;
    }
    // allow chaining
    return this;
};

// primitive to put image data on screen
JS9.Image.prototype.putImage = function(opts){
    let m, w2, h2;
    const rgb = this.rgb;
    const display = this.display;
    const ctx = display.context;
    // called in image context
    const img2canvas = (img) => {
	let context, canvas;
	if( !this.offscreenRGB ){
	    canvas = document.createElement("canvas");
	    context = canvas.getContext("2d");
	    // turn off anti-aliasing
	    if( !JS9.ANTIALIAS ){
		context.imageSmoothingEnabled = false;
	    }
	    this.offscreenRGB = {canvas, context};
	}
	this.offscreenRGB.canvas.width= img.width;
	this.offscreenRGB.canvas.height = img.height;
	this.offscreenRGB.context.putImageData(img, 0, 0);
	return this.offscreenRGB.canvas;
    };
    // opts is optional
    opts = opts || {};
    // reproject: if reproj wcs header exists, save it for alignment
    if( this.rawDataLayer() === "reproject" && opts.wcsim ){
	this.wcsim = opts.wcsim;
	this.wcsim.isawcsim = true;
    }
    // get display offsets
    this.calcDisplayOffsets(true);
    // save context
    ctx.save();
    // do we need to apply blend mode parameters
    if( opts.opacity !== undefined ){ ctx.globalAlpha = opts.opacity; }
    if( opts.blend !== undefined ){ ctx.globalCompositeOperation = opts.blend; }
    // do we need to apply the canvas transform?
    if( this.params.transform ){
	// this is the transform matrix
	m = this.params.transform;
	// translate origin to center of display
	w2 = this.display.width / 2;
	h2 = this.display.height / 2;
	ctx.translate(w2, h2);
	// set new transform
	ctx.transform(m[0][0], m[0][1], m[1][0], m[1][1], m[2][0], m[2][1]);
	// translate back to 0, 0
	ctx.translate(-w2, -h2);
    }
    // display image
    ctx.drawImage(img2canvas(rgb.img), this.ix, this.iy);
    // restore original context
    ctx.restore();
    // allow chaining
    return this;
};

// display image, with pre and post processing based on comma-separated string
// of options:
// colors: generate colorData
// scaled: generate colorCells and scaledCells
// rgb: generate RGB image (happens automatically for any of the above)
// display: displlay image (always done)
// plugins: execute plugin callbacks
// all: colors,scaled,rgb,display,plugins
JS9.Image.prototype.displayImage = function(imode, opts){
    let i, im, bopts, obj;
    let nblend = 0;
    const allmode = "colors,scaled,rgb,display,plugins";
    const blends = [];
    const mode = {};
    // eslint-disable-next-line no-unused-vars
    const modeFunc = (element, index, array) => {
	const el = element.trim();
	mode[el] = true;
	// each step implies the next ones
	switch(el){
	case "colors":
	    mode.scaled = true;
	    mode.rgb = true;
	    break;
	case "scaled":
	    mode.rgb = true;
	    break;
	}
    };
    // special checks for displayMode setting
    if( imode === false ){
	this.displayMode = false;
	return this;
    }
    if( imode === true ){
	this.displayMode = true;
	imode = "all";
    }
    // if displayMode is false, just return
    if( !this.displayMode ){
	return this;
    }
    // did we just pass the opts params?
    if( typeof imode === "object" ){
	opts = imode;
	imode = null;
    }
    if( !imode ){
	imode = "rgb";
    } else if( imode === "all" ){
	imode = allmode;
	mode.notify = true;
    } else if( imode === "rgbonly" ){
	imode = "rgb,nodisplay";
	mode.notify = true;
    } else if( imode === "display" ){
	mode.notify = true;
    }
    // get mode as elements in an object
    imode.split(",").forEach(modeFunc);
    // by default display the image again (unless nodisplay is set)
    mode.display = true;
    // and always call plugins
    mode.plugins = true;
    // if we have an RGB file or image overlay, skip some steps
    if( this.useOffScreenCanvas() ){
	mode.colors = false;
	mode.scaled = false;
    }
    // opts are optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse displayImage opts: ${opts}`, e); }
    }
    // do we need to blend?
    if( this.display.blendMode && (opts.blendMode !== false) ){
	for(i=0; i<JS9.images.length; i++){
	    im = JS9.images[i];
	    if( (im.display === this.display) && im.blend.active ){
		blends.push(im);
		nblend++;
	    }
	}
    }
    // generate colordata
    if( mode.colors ){
	// populate the colorData array (offsets into scaled colorcell data)
	this.mkColorData();
    }
    // generated scaled cells
    if( mode.scaled ){
	// generate color cells from colormap
	this.mkColorCells();
	// generated scaled cells from color cells
	this.mkScaledCells();
    }
    // generate RGB image from scaled cells
    if( mode.rgb ){
	// make the RGB image
	this.mkRGBImage();
	if( nblend ){
	    for(i=blends.length-1; i>=0; i--){
		im = blends[i];
		im.mkRGBImage();
	    }
	}
    }
    // if we explicitly don't display, return here;
    if( mode.nodisplay ){
	return this;
    }
    // display image on screen
    if( mode.display ){
	// clear image
	this.display.context.clear();
	if( nblend ){
	    // pre-calculate image offsets in case of zoom changed for an image
	    // which acts as wcsim for another blended image ... in case the
	    // blended image gets loaded before the wcs image ... messy!
	    for(i=blends.length-1; i>=0; i--){
		blends[i].calcDisplayOffsets(false);
	    }
	    for(i=blends.length-1; i>=0; i--){
		im = blends[i];
		// display the image using blend characteristics
		bopts = {wcsim: opts.wcsim,
			 blend: im.blend.mode, opacity: im.blend.opacity};
		im.putImage(bopts);
		if( im === this ){
		    // display layers for this image
		    im.displayShapeLayers();
		}
	    }
	} else {
	    // display the image
	    this.putImage(opts);
	    // display layers for this image
	    this.displayShapeLayers();
	}
	// mark this image as being in this display
	this.display.image = this;
	// now this is the displayed image, we can add delayed shapes
	while( this.delayedShapes && this.delayedShapes.length ){
	    this.tmp.syncRunning = true;
	    obj = this.delayedShapes.shift();
	    switch(obj.mode){
	    case "add":
		this.addShapes(obj.layer, obj.shape, obj.opts);
		break;
	    case "change":
		this.changeShapes(obj.layer, obj.shape, obj.opts);
		break;
	    }
	    delete this.tmp.syncRunning;
	}
	delete this.delayedShapes;
    }
    // post-processing
    // plugin callbacks
    this.xeqPlugins("image", "onimagedisplay");
    // allow chaining
    return this;
};

// refresh data for an existing image
// input obj is a fits object, array, typed array, etc.
JS9.Image.prototype.refreshImage = function(obj, opts){
    let s, arr, ozoom, ora, odec, olpos, ipos, func;
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse refreshImage opts: ${opts}`, e); }
    }
    // no obj or obj is a string, this is a load with refresh turned on
    if( !obj || typeof obj === "string" ){
	if( opts.onrefresh ){
	    opts.onload = opts.onrefresh;
	    delete opts.onrefresh;
	}
	opts.refresh = this;
	// for file:// uri, we can use the FITS pathname, where possible
	if( !document.domain ){
	    s = obj || this.fitsFile || this.file;
	} else {
	    // else use the url path relative to the web page
	    s = obj || this.file;
	}
	JS9.Load(s, opts, {display: this.display});
	return;
    }
    // check for refresh func
    opts.rawid = opts.rawid || JS9.RAWID0;
    // allow explicit specification of a func, for backward-compatibility
    if( typeof opts === "function" ){
	func = opts;
	opts = {onrefresh: func};
    }
    if( !opts.onrefresh && JS9.imageOpts.onrefresh ){
	// use global onrefresh, if possible
	opts.onrefresh = JS9.imageOpts.onrefresh;
    }
    // save section center if it's not to be reset
    if( !opts.resetSection ){
	// always save logical coords
	olpos = this.imageToLogicalPos({x: this.rgb.sect.xcen,
					y: this.rgb.sect.ycen});
	// save wcs pos, if available
	if( this.validWCS() ){
	    s = JS9.pix2wcs(this.raw.wcs,
			    this.rgb.sect.xcen, this.rgb.sect.ycen);
	    arr = s.trim().split(/\s+/);
	    ora = JS9.saostrtod(arr[0]);
	    if( JS9.isHMS(this.params.wcssys) ){
		ora *= 15.0;
	    }
	    odec = JS9.saostrtod(arr[1]);
	}
    }
    ozoom = this.rgb.sect.zoom;
    // save old binning
    this.binning.obin = this.binning.bin;
    // generate new data
    this.mkRawDataFromHDU(obj, opts);
    // reset or restore section?
    if( opts.resetSection ){
	// reset section
	this.mkSection();
	this.mkSection(ozoom);
    } else {
	// try to restore section using saved coords
	if( this.validWCS() && JS9.notNull(ora) && JS9.notNull(odec) ){
	    arr = JS9.wcs2pix(this.raw.wcs, ora, odec).trim().split(/ +/);
	    ipos = {x: parseFloat(arr[0]), y: parseFloat(arr[1])};
	} else {
	    ipos = this.logicalToImagePos({x: olpos.x, y: olpos.y});
	}
	// but if the image position off the new image ...
	if( ipos.x > 0 && ipos.x < this.raw.width  &&
	    ipos.y > 0 && ipos.y < this.raw.height ){
	    this.mkSection(ipos.x, ipos.y, ozoom);
	} else {
	    // ... just reset the section
	    this.mkSection();
	    this.mkSection(ozoom);
	}
    }
    // display new image data with old section
    this.displayImage("colors", opts);
    // redo flip and rot
    this.reFlipRot();
    // notify the helper
    this.notifyHelper();
    // update shape layers if necessary
    if( opts.refreshRegions                      ||
	opts.resetSection                        ||
	(this.binning.obin !== this.binning.bin) ){
	this.refreshLayers();
	// update region values
	this.updateShapes("regions", "all", "binning");
    }
    // plugin callbacks
    this.xeqPlugins("image", "onimagerefresh");
    // all done
    JS9.waiting(false);
    // everything else is done so call refresh func, if necessary
    if( opts.onrefresh ){
	try{ JS9.xeqByName(opts.onrefresh, window, this); }
	catch(e){ JS9.error("in image refresh callback", e); }
    }
    // allow chaining
    return this;
};

// fileDimensions: get dimensions of "original" file
// this is the hackiest routine in the JS9 module
// why is it so hard???
JS9.Image.prototype.fileDimensions = function(){
    let xdim, ydim;
    if( this.parent && this.parent.raw.header.XTENSION !== "BINTABLE" ){
	if( this.parent.raw.header.TABDIM1 ){
	    xdim = this.parent.raw.header.TABDIM1;
	} else {
	    xdim = this.parent.raw.header.NAXIS1;
	}
	if( this.parent.raw.header.TABDIM2 ){
	    ydim = this.parent.raw.header.TABDIM2;
	} else {
	    ydim = this.parent.raw.header.NAXIS2;
	}
    } else {
	if( this.raw.header.TABDIM1 ){
	    xdim = this.raw.header.TABDIM1;
	} else {
	    xdim = this.raw.header.NAXIS1;
	}
	if( this.raw.header.TABDIM2 ){
	    ydim = this.raw.header.TABDIM2;
	} else {
	    ydim = this.raw.header.NAXIS2;
	}
    }
    return {xdim, ydim};
};

/*
   maybePhysicalToImage: the second hackiest routine in the JS9 module!
   The physical position defined by LTM/LTV is not always the file position,
   For example, if the file foo.fits was created from another file:
       funimage somefile.fits'[*,*,2]' foo.fits
   its LTM/LTV keywords will referring to the parent, instead of itself.
   In such a case, we want to convert physical position to the image position
   of the physical file.
   This situation is signalled by the presence of a parent lcs object.
   This routine is used to display sections and the binning.js plugin.
*/
JS9.Image.prototype.maybePhysicalToImage = function(pos){
    let lpos, ipos, npos;
    if( this.imtab === "image" &&
	this.parent && this.parent.lcs && pos.x && pos.y ){
	lpos = {x: pos.x, y: pos.y};
	// call is used because this.parent is not an image object
	ipos = JS9.Image.prototype.logicalToImagePos.call(this.parent, lpos,
                                                          "ophysical");
	npos = {x: Math.floor(ipos.x+0.5), y: Math.floor(ipos.y+0.5)};
    }
    return npos;
};

// extract and display a section of an image, with table filtering
JS9.Image.prototype.displaySection = function(opts, func){
    let s, oproxy, hdu, from, obj, oreg, nim, topts;
    let ipos, lpos, npos, tbin, arr, sect;
    const getval3 = (val1, val2, val3) => {
	let res;
	if( !JS9.isNull(val1) ){
	    res = val1;
	} else if( !JS9.isNull(val2) ){
	    res = val2;
	}
	return res || val3;
    };
    // convert region to section (cen and dim)
    const reg2sect = (xreg) => {
	let i, xdim, ydim, xcen, ycen, npos;
	let xx = 0;
	let yy = 0;
	let minx = 1000000;
	let maxx = 0;
	let miny = 1000000;
	let maxy = 0;
	const shape = xreg.shape;
	// use physical coords object, if possible
	if( !this.parentFile && xreg.lcs ){
	    xreg = xreg.lcs
	    xcen = xreg.x;
	    ycen = xreg.y;
	    // beware of problems with physical coords not tied to the file
	    npos = this.maybePhysicalToImage({x: xcen, y: ycen});
	    if( npos ){
		xcen = npos.x;
		ycen = npos.y;
	    }
	} else {
	    xcen = xreg.x;
	    ycen = xreg.y;
	}
	switch( shape ){
	case "annulus":
            xdim  = xreg.radii[xreg.radii.length-1]*2;
            ydim = xreg.radii[xreg.radii.length-1]*2;
	    break;
	case "box":
            xdim  = xreg.width;
            ydim = xreg.height;
	    break;
	case "circle":
            xdim  = xreg.radius*2;
            ydim = xreg.radius*2;
            break;
	case "cross":
            xdim  = xreg.width;
            ydim = xreg.height;
	    break;
	case "ellipse":
            xdim  = xreg.r1*2;
            ydim = xreg.r2*2;
            break;
	case "polygon":
        case "line":
	    for ( i=0; i < xreg.pts.length; i++ ) {
		xx += xreg.pts[i].x;
		yy += xreg.pts[i].y;
		if ( xreg.pts[i].x > maxx ) { maxx = xreg.pts[i].x; }
		if ( xreg.pts[i].x < minx ) { minx = xreg.pts[i].x; }
		if ( xreg.pts[i].y > maxy ) { maxy = xreg.pts[i].y; }
		if ( xreg.pts[i].y < miny ) { miny = xreg.pts[i].y; }
	    }
	    xreg.x = xx/xreg.pts.length;
	    xreg.y = yy/xreg.pts.length;
	    if( xreg.shape === "line" && xreg.pts.length === 2 ){
                xdim = Math.sqrt(((xreg.pts[0].x - xreg.pts[1].x)  *
                                  (xreg.pts[0].x - xreg.pts[1].x)) +
                                 ((xreg.pts[0].y - xreg.pts[1].y)  *
                                  (xreg.pts[0].y - xreg.pts[1].y)));
                ydim = 1;
	    } else {
	        xdim  = maxx - minx;
		ydim = maxy - miny;
	    }
	    break;
	case "text":
	    xdim = 10;
	    ydim = 10;
	    break;
	default:
	    break;
	}
	return({xcen: xcen, ycen: ycen, xdim: xdim, ydim: ydim});
    };
    // main display routine
    const disp = (hdu, opts) => {
	let tim, did, arr;
	let ss = "";
	// make a copy of opts so we can change it
	topts = $.extend(true, {}, opts || {});
	if( JS9.isNull(topts.refreshRegions) ){
	    topts.refreshRegions = true;
	}
	if( JS9.isNull(topts.resetSection) ){
	    topts.resetSection = true;
	}
	// start the waiting!
	if( topts.waiting !== false ){
	    JS9.waiting(true, this.display);
	}
	// the id might have changed if we changed extensions
	if( hdu.fits.extname ){
	    ss = `[${hdu.fits.extname}]`;
	} else if( hdu.fits.extnum && hdu.fits.extnum > 0 ){
	    ss = `[${hdu.fits.extnum}]`;
	} else if( this.parent ){
	    if( this.parent.extname ){
		ss = `[${this.parent.extname}]`;
	    } else if( this.parent.extnum && this.parent.extnum > 0 ){
		ss = `[${this.parent.extnum}]`;
	    }
	}
	// change id and file if extension changed
	if( ss ){
	    if( !topts.id ){
		topts.id = this.id.replace(/\[.*\]/,"") + ss;
	    }
	    // NB: this was removed in v2.3 ... why? ... added back in v2.5
	    if( !topts.file ){
		topts.file = this.file.replace(/\[.*\]/,"") + ss;
	    }
	}
	if( topts.separate ){
	    // display section as a separate image in the specified display
	    delete topts.xcen;
	    delete topts.ycen;
	    if( typeof topts.separate === "string" ){
		arr = topts.separate.split(":");
		switch(arr.length){
		case 1:
		    did = arr[0];
		    break;
		default:
		    did = arr[0];
		    topts.id = arr[1];
		    break;
		}
		// make sure we can find the display
		topts.display = JS9.lookupDisplay(did);
	    } else {
		topts.display = this.display;
	    }
	    // lame attempt to get to original parentFile
	    if( from === "parentFile" && this.fitsFile ){
		tim = JS9.lookupImage(this.fitsFile);
		if( tim && tim.parentFile ){
		    topts.parentFile = tim.parentFile;
		} else {
		    topts.parentFile = this.fitsFile;
		}
	    }
	    // save current regions (before displaying new image)
	    oreg = this.listRegions("all", {mode: 1,
					    includedcoords: true,
					    ignoreignore: true,
					    saveediting: true,
					    savewcsconfig: true,
					    sortids: false,
					    saveid: true});
	    // func to perform when image is loaded
	    func = topts.ondisplaysection || topts.onrefresh || func;
	    // set up new and display new image
	    nim = new JS9.Image(hdu, topts, func);
	    // reset obin to be bin, since new images have no previous bin
	    nim.binning.obin = nim.binning.bin;
	    // add regions to new image
	    if( oreg && topts.refreshRegions !== false ){
		nim.addShapes("regions", oreg, {restoreid: true});
	    }
	    // redo flip and rot
	    this.reFlipRot();
	    // set status of new image
	    nim.setStatus("displaySection", "complete");
	} else if( typeof topts.refresh === "string" ){
	    // refresh the image in the specified display
	    delete topts.xcen;
	    delete topts.ycen;
	    arr = topts.refresh.split(":");
	    switch(arr.length){
	    case 1:
		did = arr[0];
		break;
	    default:
		did = arr[0];
		topts.id = arr[1];
		break;
	    }
	    // make sure we can find the display
	    topts.display = JS9.lookupDisplay(did);
	    if( topts.display.image ){
		topts.rawid = this.raw.id;
		// func to perform when image is refreshed
		topts.onrefresh = topts.ondisplaysection ||
		                  topts.onrefresh || func;
		// refresh the image with the new hdu
		topts.display.image.refreshImage(hdu, topts);
	    } else {
		// no image in the specified display, so make a new one
		// lame attempt to get to original parentFile
		if( from === "parentFile" && this.fitsFile ){
		    tim = JS9.lookupImage(this.fitsFile);
		    if( tim && tim.parentFile ){
			topts.parentFile = tim.parentFile;
		    } else {
			topts.parentFile = this.fitsFile;
		    }
		}
		// save current regions (before displaying new image)
		oreg = this.listRegions("all", {mode: 1,
						includedcoords: true,
						ignoreignore: true,
						saveediting: true,
						savewcsconfig: true,
						sortids: false,
						saveid: true});
		// func to perform when image is loaded
		func = topts.ondisplaysection || topts.onrefresh || func;
		// set up new and display new image
		nim = new JS9.Image(hdu, topts, func);
		// reset obin to be bin, since new images have no previous bin
		nim.binning.obin = nim.binning.bin;
		// add regions to new image
		if( oreg ){
		    nim.addShapes("regions", oreg, {restoreid: true});
		}
		// redo flip and rot
		this.reFlipRot();
	    }
	} else {
	    // this is the default behavior for displaySection:
	    // refresh the image in the current display
	    topts.rawid = this.raw.id;
	    // func to perform when image is refreshed
	    topts.onrefresh = topts.ondisplaysection || topts.onrefresh || func;
	    // refresh the current image with the new hdu
	    this.refreshImage(hdu, topts);
	}
	// set status of old image
	this.setStatus("displaySection", "complete");
	// done waiting
	JS9.waiting(false);
    };
    // sanity check
    if( !this.raw || !this.raw.hdu || !this.raw.hdu.fits ){
	JS9.error("invalid image for displaySection");
    }
    // opts is optional
    opts = opts || {};
    // special case: if opts is "full", display full image
    if( opts === "full" ){
	const {xdim, ydim} = this.fileDimensions();
	opts = {xdim: xdim, ydim: ydim, xcen: 0, ycen: 0};
    } else if( opts === "selected" ){
	this._selectShapes("regions", "selected", null, (obj) => {
	    topts = reg2sect(obj.pub);
	    topts.from = "virtualFile";
	    topts.separate = true;
	    topts.refreshRegions = false;
	    topts.resetSection = true;
	    this.displaySection(topts, func);
	});
	return;
    } else if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse displaySection opts: ${opts}`, e); }
    }
    // cube column
    opts.cubecol = opts.cubecol || "";
    if( opts.cubecol ){
	// string containing filename and indication that this is a cube
	s = this.file
	    .split("/")
	    .reverse()[0]
	    .replace(/\[.*\]/,"")
	    .replace(".fits", `_cube_${opts.cubecol}.fits`)
	    .replace(/\.ftz$/, `_cube_${opts.cubecol}.fits`)
	    .replace(/\.gz$/, "")
	    .replace(/\.bz2$/, "")
	    .replace(/:/g, "_");
	// name of virtual file we will create
	if( !opts.file ){
	    opts.file = s;
	}
	// and its id
	if( !opts.id ){
	    opts.id = s;
	}
	// unless explicitly set to false, separate is set to true
	if( opts.separate !== false ){
	    opts.separate = true;
	}
    }
    if( opts.separate ){
	// if we are generating a separate image, copy the hdu
	hdu = $.extend(true, {}, this.raw.hdu);
    } else {
	// if we are replacing the current image, use the hdu directly
	hdu = this.raw.hdu;
    }
    // from where do we extract the section?
    from = opts.from;
    if( !from ){
	if( this.parentFile && JS9.helper.connected && JS9.helper.js9helper ){
	    // we will be processing a parent file to get the section
	    from = "parentFile";
	} else {
	    // we will be processing a virtual file to get the section
	    from = "virtualFile";
	}
    }
    // get previous values to use as defaults
    if( this.imtab === "table" && hdu.table ){
	// tables are easy: all the previous values should be present
	sect = hdu.table;
    } else {
	sect = {};
	// start with bin from hdu
	sect.bin = hdu.bin || 1;
	// images are a bit more difficult
	// hack: if a parent file was used to make this image,
	// calculate binning from its LTM/TLV parameters
	if( from === "parentFile" &&
	    this.raw.header && JS9.notNull(this.raw.header.LTM1_1) ){
	    sect.bin  = 1 / Math.abs(this.raw.header.LTM1_1);
	}
	// get image center from raw data
	ipos = {x: this.raw.width / 2, y: this.raw.height / 2};
	// convert to physical (file) coords
	lpos = this.imageToLogicalPos(ipos);
	// sect.xcen = Math.floor(lpos.x + 0.5);
	// sect.ycen = Math.floor(lpos.y + 0.5);
	sect.xcen = Math.floor(lpos.x + 0.5*(sect.bin-1));
	sect.ycen = Math.floor(lpos.y + 0.5*(sect.bin-1));
	npos = this.maybePhysicalToImage({x: sect.xcen, y: sect.ycen});
	if( npos ){
	    sect.xcen = npos.x;
	    sect.ycen = npos.y;
	}
	sect.xdim = Math.floor(hdu.naxis1 * sect.bin);
	sect.ydim = Math.floor(hdu.naxis2 * sect.bin);
	sect.filter = this.raw.filter || "";
	sect.columns = this.raw.columns || "";
    }
    // allow binning relative to current, e.g., *2, /4, +1, -3
    if( typeof opts.bin === "string" ){
	// save and remove mode flag
	if( opts.bin.match(/[as]$/) ){
	    opts.binMode = opts.bin.slice(-1);
	    opts.bin = opts.bin.slice(0, -1);
	}
	// temp binning value
	tbin = sect.bin || this.binning.bin;
	switch( opts.bin.charAt(0) ){
	case "*":
	case "x":
	case "X":
	    opts.bin = tbin * parseFloat(opts.bin.slice(1));
	    break;
	case "/":
	    opts.bin = tbin / parseFloat(opts.bin.slice(1));
	    break;
	case "i":
	case "I":
	    opts.bin = tbin * 2;
	    break;
	case "o":
	case "O":
	    opts.bin = tbin / 2;
	    break;
	default:
	    if( JS9.isNumber(opts.bin) ){
		opts.bin = parseFloat(opts.bin);
	    } else {
		JS9.error(`invalid bin for displaySection: ${opts.bin}`);
	    }
	    break;
	}
    }
    // now we can make sure opts has sensible defaults
    opts.xcen = getval3(opts.xcen, sect.xcen, 0);
    opts.ycen = getval3(opts.ycen, sect.ycen, 0);
    switch(this.imtab){
    case "table":
	opts.xdim = getval3(opts.xdim, sect.xdim, JS9.fits.options.table.xdim);
	opts.ydim = getval3(opts.ydim, sect.ydim, JS9.fits.options.table.ydim);
	opts.bin  = getval3(opts.bin,  sect.bin,  JS9.fits.options.table.bin);
	break;
    default:
	opts.xdim = getval3(opts.xdim, sect.xdim, JS9.fits.options.image.xdim);
	opts.ydim = getval3(opts.ydim, sect.ydim, JS9.fits.options.image.ydim);
	opts.bin  = getval3(opts.bin,  sect.bin,  JS9.fits.options.image.bin);
	break;
    }
    opts.binMode  = getval3(opts.binMode, sect.binMode, JS9.globalOpts.binMode);
    // final checks on binning
    // handle string bin, possibly containing explicit binMode
    if( typeof opts.bin === "string" ){
	if( opts.bin.match(/[as]$/) ){
	    opts.binMode = opts.bin.slice(-1);
	}
	opts.bin = parseFloat(opts.bin);
    }
    // sanity check: we need a bin
    if( !opts.bin ){
	opts.bin = 1;
    }
    // sanity check: fractional bin must be 1/n for images
    if( this.imtab === "image" && opts.bin > 0 && opts.bin < 1 ){
	opts.bin = 1.0 / Math.floor((1.0 / opts.bin) + 0.5);
    }
    // filter
    opts.filter = getval3(opts.filter, sect.filter, "");
    // save the filter, if necessary
    this.raw.filter = opts.filter || "";
    // columns
    opts.columns = getval3(opts.columns, sect.columns, "");
    // save the columns, if necessary
    this.raw.columns = opts.columns || "";
    // start the waiting!
    if( opts.waiting !== false ){
	JS9.waiting(true, this.display);
    }
    // set status
    this.setStatus("displaySection", "processing");
    // ... start a timeout to allow the wait spinner to get started
    window.setTimeout(() => {
	// get image section
	switch(from){
	case "parentFile":
	    oproxy = this.proxyFile;
	    // parentFile: image sect. from external parent file of cur file
	    // arr is for runAnalysis, remove opts for later processing
	    arr = [];
	    arr.push({name: "xcen", value: opts.xcen});
	    delete opts.xcen;
	    arr.push({name: "ycen", value: opts.ycen});
	    delete opts.ycen;
	    arr.push({name: "xdim", value: opts.xdim});
	    arr.push({name: "ydim", value: opts.ydim});
	    // load entire image section
	    if( opts.xdim !== undefined ){ opts.xdim = 0; }
	    if( opts.ydim !== undefined ){ opts.ydim = 0; }
	    // recombine bin and binMode, if necessary
	    if( opts.binMode ){
		opts.bin = `${opts.bin}${opts.binMode}`;
		delete opts.binMode;
	    }
	    arr.push({name: "bin", value: opts.bin});
	    delete opts.bin;
	    s = `${opts.filter||""}@@${opts.cols||""}`;
	    arr.push({name: "filter", value: s});
	    // hack: pass filter and columns along to reach binning plugin
	    // delete opts.filter;
	    // get image section from external file
	    arr.push({name: "slice", value: opts.slice||""});
	    delete opts.slice;
	    obj = {id: this.expandMacro("$id"),
		   image: this.file,
		   fits: this.parentFile,
		   rtype: "text"};
	    obj.cmd = `js9Xeq imsection ${this.parentFile}`;
	    // if we are changing the extension, replace the old extension
	    // with the new one
	    if( opts.extension ){
		obj.cmd = obj.cmd.replace(/\[.*\]/,"");
		obj.cmd += `[${opts.extension}]`;
		delete opts.extension;
	    }
	    obj.cmd += this.expandMacro(" $xdim@$xcen,$ydim@$ycen,$bin $filter $slice", arr);
	    JS9.helper.send("imsection", obj, (r) => {
		let obj, jobj, rarr, f, pf;
		if( typeof r === "object" ){
		    // with socketio, we get an object
		    obj = r;
		} else {
		    // with cgi, we just get a text string
		    if( r.search(JS9.analOpts.epattern) >=0 ){
			obj = {stderr: r};
		    } else {
			obj = {stdout: r};
		    }
		}
		if( obj.stderr ){
		    JS9.error(obj.stderr);
		    return;
		}
		if( obj.errcode ){
		    JS9.error(`in displaySection: ${obj.errcode}`);
		    return;
		}
		// output is file and possibly parentFile
		rarr = obj.stdout.split(/\n/);
		// file
		f = JS9.cleanPath(rarr[0]);
		// relative path: add install dir prefix
		if( f.charAt(0) !== "/" ){
		    f = JS9.InstallDir(f);
		}
		// this is the proxy file (meaning: delete it on close)
		opts.proxyFile = f;
		// remove oproxy file if not the same as the current file
		if( oproxy && (oproxy !== opts.proxyFile) ){
		    this.removeProxyFile(oproxy);
		}
		// json fits info
		if( rarr[1] ){
		    try{
			jobj = JSON.parse(rarr[1]);
		    }
		    catch(ignore){
			JS9.log("couldn't parse imsection as JSON: %s", f);
			jobj = null;
		    }
		    if( jobj ){
			opts.extname = jobj.extname;
			opts.extnum = jobj.extnum;
			opts.hdus = jobj.hdus;
			opts.binstr = jobj.binstr;
			opts.parent = jobj;
		    }
		}
		// look for parentFile (path relative to helper, not install)
		if( rarr[2] ){
		    pf = JS9.cleanPath(rarr[2]);
		    opts.parentFile = pf;
		}
		// retrieve and display newly created image section file
		JS9.fetchURL(f, f, opts, (result) => {
		    // cleanup previous FITS file support, if necessary
		    // do this before we handle the new FITS file, or else
		    // we end up with a memory leak in the emscripten heap!
		    JS9.cleanupFITSFile(this.raw, true);
		    // start the waiting!
		    if( opts.waiting !== false ){
			JS9.waiting(true, this.display);
		    }
		    // process the newly retrieved data as FITS
		    JS9.fits.handleFITSFile(result, opts, disp);
		});
	    });
	    break;
	case "virtualFile":
	    // cleanup previous FITS file support, if necessary
	    // do this before we handle the new FITS file, or else
	    // we end up with a memory leak in the emscripten heap!
	    JS9.cleanupFITSFile(this.raw, false);
	    // extract image section from current virtual file
	    JS9.getFITSImage(hdu.fits, hdu, opts, (hdu) => {
		disp(hdu, opts);
	    });
	    break;
	default:
	    JS9.error("image section cannot be extracted from this data file");
	    break;
	}
    }, JS9.SPINOUT);
};

// display the specified extension of a multi-extension FITS file
JS9.Image.prototype.displayExtension = function(extid, opts, func){
    let i, s, got, extname, im, id;
    const dispnext = (i) => {
	let hdu;
	const topts = $.extend(true, {}, opts);
	// hdus are loaded as separate images
	topts.separate = true;
	// all done, call the supplied func, if any
	if( i === this.hdus.length ){
	    if( func ){
		try{ JS9.xeqByName(func, window, this); }
		catch(e){ JS9.error("in displayExtension callback", e, false); }
	    }
	    return;
	}
	// next hdu
	hdu = this.hdus[i];
	if( hdu.type === "image" && hdu.naxis >= 2 ){
	    // load next hdu and recurse when done
	    this.displayExtension(hdu.hdu, topts, () => { dispnext(i+1); });
	} else {
	    dispnext(i+1);
	}
    };
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse displayExtension opts: ${opts}`, e); }
    }
    opts.waiting = false;
    // only makes sense if we have hdus
    if( !this.hdus ){
	JS9.error("no FITS HDUs found for displayExtension()");
    }
    // sanity check
    if( JS9.isNull(extid) ){
	JS9.error("missing extname/extnum for displayExtension()");
    }
    // display all extensions?
    if( extid === "all" ){
	// load all image extensions, in order, as separate images
	// we start with the first and let the call recurse
	dispnext(0);
	return;
    }
    // extname specified?
    if( typeof extid === "string" ){
	opts.extension = extid;
	extname = extid.toLowerCase();
	for(i=0, got=0; i<this.hdus.length; i++){
	    if( this.hdus[i].name &&
		this.hdus[i].name.toLowerCase() === extname ){
		got++;
		break;
	    }
	}
	if( !got ){
	    JS9.error(`no FITS HDU ${extid} for displayExtension()`);
	}
	// extnum specified?
    } else if( typeof extid === "number" ){
	opts.extension = extid;
	if( this.hdus[extid] ){
	    extname = this.hdus[extid].name || extid.toString();
	} else {
	    JS9.error(`no FITS HDU ${extid} for displayExtension()`);
	}
    }
    // if we are creating a separate file, see if we already have it
    if( opts.separate ){
	s = `[${extname}]`;
	id = this.id.replace(/\[.*\]/,"") + s;
	for(i=0, got=0; i<JS9.images.length; i++){
	    im = JS9.images[i];
	    if( id === im.id ){
		if( $(`#${im.display.id}`).length > 0 ){
		    if( this.display.id === im.display.id ){
			got++;
			break;
		    }
		}
	    }
	}
	if( got ){
	    im.displayImage("display", opts);
	    im.display.clearMessage();
	    if( func ){
		try{ JS9.xeqByName(func, window, this); }
		catch(e){ JS9.error("in displayExtension callback", e, false); }
	    }
	    return;
	}
    }
    // cleanup previous FITS file support, if necessary
    // do this before we handle the new FITS file, or else
    // we end up with a memory leak in the emscripten heap!
    if( !opts.separate ){
	JS9.cleanupFITSFile(this.raw, false);
    }
    // process the FITS file by going to the extname/extnum
    this.displaySection(opts, func);
    // allow chaining
    return this;
};

// display the specified slice of a 3D or 4d FITS cube
JS9.Image.prototype.displaySlice = function(slice, opts, func){
    let i, topts, tim;
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse displaySlice opts: ${opts}`, e); }
    }
    opts.waiting = false;
    // sanity check
    if( JS9.isNull(slice) ){
	JS9.error("missing slice for displaySlice()");
    }
    if( this.raw.header.NAXIS !== 3 ){
	JS9.error("3D image required for displaySlice()");
    }
    if( slice === "all" ){
	// load and display the slices separately
	// ignore the fact that we already are displaying a slice of the image,
	// since we don't actually know which slice is being displayed ...
	for(i=1; i<=this.raw.header.NAXIS3; i++){
	    topts = $.extend(true, {}, opts, {separate: true});
	    this.displaySlice(i, topts, func);
	}
    } else {
	// slicename or slicenum specified?
	if( JS9.isNumber(slice) ){
	    opts.slice = `*:*:${slice}`;
	} else {
	    opts.slice = slice;
	}
	// processing for separate images
	if( opts.separate ){
	    // make new id based on slice
	    opts.id = sprintf("%s_%s",
			      this.id
			      .replace(/_?([0-9])+:x:x/, "")
			      .replace(/_?x:([0-9])+:x/, "")
			      .replace(/_?x:x:([0-9])+/, ""),
			      opts.slice.replace(/\*/g, "x"));
	    // look for existing id and just redisplay, if possible
	    for(i=0; i<JS9.images.length; i++){
		tim = JS9.images[i];
		if( opts.id === tim.id ){
		    if( $(`#${tim.display.id}`).length > 0 ){
			tim.displayImage("display", {display: tim});
			return this;
		    }
		}
	    }
	}
	// cleanup previous FITS file heap before handling the new FITS file,
	// or we end up with a memory leak in the emscripten heap
	JS9.cleanupFITSFile(this.raw, false);
	// process the FITS file by going to the slice
	this.displaySection(opts, func);
    }
    // allow chaining
    return this;
};

// convert current image to array
JS9.Image.prototype.toArray = function(opts){
    let i, j, k, bpe, idx, le, header, npad, arr, buf, _dbuf;
    let dbuf, sect, xlen, blen, datalen, darr;
    // opts is optional
    opts = opts || {};
    // always perform the header keyword fix
    opts.simple = true;
    // make a copy of the header, in case we have to change it
    header = $.extend(true, {}, this.raw.header);
    // are we processing a section of the image?
    if( JS9.notNull(opts.sect) ){
	// image section
	sect = opts.sect;
	// header parameters that need to change
	header.NAXIS1 = sect.x1 - sect.x0;
	header.NAXIS2 = sect.y1 - sect.y0;
	if( JS9.notNull(header.CRPIX1) ){
	    header.CRPIX1 = header.CRPIX1 - sect.x0;
	}
	if( JS9.notNull(header.CRPIX2) ){
	    header.CRPIX2 = header.CRPIX2 - sect.y0;
	}
	if( JS9.notNull(header.LTV1) ){
	    header.LTV1 = header.LTV1 - sect.x0;
	}
	if( JS9.notNull(header.LTV2) ){
	    header.LTV2 = header.LTV2 - sect.y0;
	}
	// extract image section
	// length of a date element
	blen = Math.abs(this.raw.bitpix/8);
	// length of a row of data
	xlen = (sect.x1 - sect.x0) * blen;
	// total data length of the section
	datalen = xlen * (sect.y1 - sect.y0);
	// make an array of the required length
	darr = new ArrayBuffer(datalen);
	// make a vew that we can work with
	dbuf = new Uint8Array(darr);
	// copy the section into the new array, one row at a time
	for(i=sect.y0, j=0; i<sect.y1; i++, j++){
	    JS9.memcpy(dbuf.buffer, (j * xlen),
		       this.raw.data.buffer, (i*this.raw.width+sect.x0) * blen,
		       xlen);
	}
    } else {
	// save entire data buffer
	dbuf = this.raw.data.buffer;
    }
    // get header as a string
    header = JS9.raw2FITS({header: header}, opts);
    // append padding to header now
    npad = 2880 - (header.length % 2880);
    if( npad === 2880 ){ npad = 0; }
    for(i=0; i<npad; i++){ header += " "; }
    // calculate padding for data for later
    npad = 2880 - (dbuf.byteLength % 2880);
    if( npad === 2880 ){ npad = 0; }
    // make an array buffer to hold the whole FITS file
    arr = new ArrayBuffer(header.length + dbuf.byteLength + npad);
    // and a view of the array to manipulate
    buf = new Uint8Array(arr);
    // copy the header
    for(i=0; i<header.length; i++){ buf[i] = header.charCodeAt(i); }
    // copy data
    // if necessary, swap data bytes to get FITS big-endian
    le = new Int8Array(new Int16Array([1]).buffer)[0] > 0;
    if( le ){
	idx = header.length;
	bpe = Math.abs(this.raw.bitpix)/8;
	_dbuf = new Uint8Array(dbuf);
	// swap bytes to big-endian
	for(i=0; i<_dbuf.byteLength; i+= bpe){
	    for(j=i+bpe-1, k=0; k<bpe; j--, k++){
		buf[idx++] = _dbuf[j];
	    }
	}
    } else {
	// already big-endian, just copy the data
	buf.set(new Uint8Array(dbuf), header.length);
    }
    // now we can add data padding
    idx = header.length + dbuf.byteLength;
    for(i=0; i<npad; i++){ buf[idx++] = 0; }
    return buf;
};

// convenience routine: should we align by WCS?
JS9.Image.prototype.wcsAlign = function(){
    return this.wcsim                          &&
	   this.params.wcsalign                &&
	   (this.display === this.wcsim.display);
};

// get pan location
JS9.Image.prototype.getPan = function(){
    const sect = this.rgb.sect;
    let x = (sect.x0 + sect.x1) / 2;
    let y = (sect.y0 + sect.y1) / 2;
    if( JS9.notNull(sect.ix) ){
	x += sect.ix / (2 * sect.zoom);
    }
    if( JS9.notNull(sect.iy) ){
	y += sect.iy / (2 * sect.zoom);
    }
    return {x: x, y: y, ox: sect.xcen, oy: sect.ycen,
	    x0: sect.x0, y0: sect.y0, x1: sect.x1, y1: sect.y1,
	    ix: sect.ix||0, iy: sect.iy||0};
};

// set pan location of RGB image (using image coordinates)
JS9.Image.prototype.setPan = function(...args){
    let i, obj, im, pos, owcssys, txeq, arr, oval, npan;
    let [panx, pany] = args;
    // is this core service disabled?
    if( $.inArray("pan", this.params.disable) >= 0 ){
	return;
    }
    // default is to pan to center
    if( args.length === 0 ){
	panx = this.raw.width / 2;
	pany = this.raw.height / 2;
    }
    // one string arg is a json specification
    // (two string args is panx, pany in string format)
    if( args.length === 1 && typeof panx === "string" ){
	if( panx === "mouse" && this.ipos ){
	    panx = this.ipos.x;
	    pany = this.ipos.y;
	} else {
	    try{ panx = JSON.parse(panx); }
	    catch(e){ JS9.error(`can't parse setPan JSON: ${panx}`, e); }
	}
    }
    if( typeof panx === "object" ){
	obj = panx;
	// passing an object supports image, physical, wcs coordinates
	if( JS9.notNull(obj.x) && JS9.notNull(obj.y) ){
	    // image coords
	    panx = obj.x;
	    pany = obj.y;
	}
	if( JS9.notNull(obj.px) && JS9.notNull(obj.py) ){
	    // physical coords
	    pos = this.logicalToImagePos({x: obj.px, y: obj.py});
	    panx = pos.x;
	    pany = pos.y;
	}
	if( typeof obj.wcs === "string" ){
	    // wcs string: ra dec [wcssys]
            arr = obj.wcs.trim().split(/ +/);
            obj.ra  = arr[0];
            obj.dec = arr[1];
            if( arr.length >= 3 ){
		obj.wcssys = arr[2];
            }
	}
	if( this.validWCS() && JS9.notNull(obj.ra) && JS9.notNull(obj.dec) ){
	    // wcs coords
	    // use supplied wcs, if necessary
	    if( obj.wcssys ){
		owcssys = this.getWCSSys();
		txeq = JS9.globalOpts.xeqPlugins;
		JS9.globalOpts.xeqPlugins = false;
		this.setWCSSys(obj.wcssys, false);
	    }
	    // convert wcs supplied as strings
	    if( typeof obj.ra === "string" ){
		obj.ra = JS9.saostrtod(obj.ra);
		if( JS9.isHMS(this.params.wcssys) ){
		    obj.ra *= 15.0;
		}
	    }
	    if( typeof obj.dec === "string" ){
		obj.dec = JS9.saostrtod(obj.dec);
	    }
	    // convert to image coords
	    arr = JS9.wcs2pix(this.raw.wcs, obj.ra, obj.dec)
		.trim().split(/ +/);
	    panx = parseFloat(arr[0]);
	    pany = parseFloat(arr[1]);
	    // restore original wcssys
	    if( owcssys ){
		this.setWCSSys(owcssys, false);
		JS9.globalOpts.xeqPlugins = txeq;
	    }
	}
    }
    // generate section from new image coords
    if( !JS9.isNumber(panx) || !JS9.isNumber(pany) ){
	JS9.error(`invalid input for setPan: ${panx} ${pany}`);
    }
    if( this.wcsAlign() || this.isawcsim ){
	oval = JS9.globalOpts.panWithinDisplay;
	JS9.globalOpts.panWithinDisplay = true;
    }
    this.mkSection(panx, pany);
    // set pan for aligned images, if necessary
    if( this.wcsAlign() || this.isawcsim ){
	for(i=0; i<JS9.images.length; i++){
	    im = JS9.images[i];
	    if( (im !== this)                                &&
		(im.display === this.display)                &&
		(im.wcsim  === this ||
                 this.wcsim === im  ||
                 (im.wcsim && (im.wcsim === this.wcsim)))    &&
		(im.params.wcsalign || this.params.wcsalign) ){
		npan = JS9.pix2pix(this, im, {x: panx, y: pany});
		im.mkSection(npan.x, npan.y);
	    }
	}
	JS9.globalOpts.panWithinDisplay = oval;
    }
    this.displayImage("rgb");
    // pan/zoom the shape layers
    this.refreshLayers();
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetpan");
    }
    // allow chaining
    return this;
};

// return current zoom
JS9.Image.prototype.getZoom = function(){
    return this.rgb.sect.zoom;
};

// return zoom from zoom string
JS9.Image.prototype.parseZoom = function(zval){
    let i, ozoom, nzoom, w, h, pt, angle, x0, x1, y0, y1;
    const pts = [];
    // get old zoom
    ozoom = this.rgb.sect.zoom;
    // determine new zoom
    switch(typeof zval){
    case "string":
	switch(zval.charAt(0)){
	case "*":
	case "x":
	case "X":
	    nzoom = ozoom * parseFloat(zval.slice(1));
	    break;
	case "/":
	    nzoom = ozoom / parseFloat(zval.slice(1));
	    break;
	case "I":
	case "i":
	    nzoom = ozoom * 2;
	    break;
	case "O":
	case "o":
	    nzoom = ozoom / 2;
	    break;
	case "T":
	case "t":
	    if(  this.params.transformAngle ){
		angle = -this.params.transformAngle;
		pt = {x: -this.raw.width / 2, y: this.raw.height / 2};
		pts[0] = JS9.rotatePoint(pt, angle);
		pt = {x: this.raw.width / 2, y: this.raw.height / 2};
		pts[1] = JS9.rotatePoint(pt, angle);
		pt = {x: -this.raw.width / 2, y: -this.raw.height / 2};
		pts[2] = JS9.rotatePoint(pt, angle);
		pt = {x: this.raw.width / 2, y: -this.raw.height / 2};
		pts[3] = JS9.rotatePoint(pt, angle);
		for(i=0; i<pts.length; i++){
		    if( JS9.isNull(x0) || pts[i].x < x0 ){ x0 = pts[i].x; }
		    if( JS9.isNull(x1) || pts[i].x > x1 ){ x1 = pts[i].x; }
		    if( JS9.isNull(y0) || pts[i].y < y0 ){ y0 = pts[i].y; }
		    if( JS9.isNull(y1) || pts[i].y > y1 ){ y1 = pts[i].y; }
		}
		w = x1 - x0;
		h = y1 - y0;
	    } else {
		w = this.raw.width;
		h = this.raw.height;
	    }
	    nzoom = Math.min(this.display.width/w, this.display.height/h);
	    // a little rounding makes the zoom nicer
	    nzoom = Math.round((nzoom + 0.0000001) * 1000000) / 1000000;
	    break;
	default:
	    nzoom = parseFloat(zval);
	    break;
	}
	break;
    case "number":
	nzoom = zval;
	break;
    default:
	return;
    }
    return nzoom;
};

// set zoom of RGB image
JS9.Image.prototype.setZoom = function(zval){
    let i, nzoom, im, ipos, oval;
    // is this core service disabled?
    if( $.inArray("zoom", this.params.disable) >= 0 ){
	return;
    }
    nzoom = this.parseZoom(zval);
    if( !nzoom ){
	JS9.error(`invalid input for setZoom: ${zval}`);
    }
    if( this.wcsAlign() || this.isawcsim ){
	oval = JS9.globalOpts.panWithinDisplay;
	JS9.globalOpts.panWithinDisplay = true;
    }
    // remake section
    this.mkSection(nzoom);
    // set zoom for aligned images, if necessary
    if( this.wcsAlign() || this.isawcsim ){
	for(i=0; i<JS9.images.length; i++){
	    im = JS9.images[i];
	    if( (im !== this)                                &&
		(im.display === this.display)                &&
		(im.wcsim  === this ||
                 this.wcsim === im  ||
                 (im.wcsim && (im.wcsim === this.wcsim)))    &&
		(im.params.wcsalign || this.params.wcsalign) ){
		ipos = JS9.pix2pix(this, im, this.getPan());
		im.mkSection(ipos.x, ipos.y, nzoom);
	    }
	}
	JS9.globalOpts.panWithinDisplay = oval;
    }
    // redisplay the image
    this.displayImage("rgb");
    // pan/zoom the shape layers
    this.refreshLayers();
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetzoom");
    }
    // allow chaining
    return this;
};

// align an image to a target image in terms of pan and zoom values,
// also taking into account relative cdelt1 pixel sizes
// not taken into account: flips and rotations
// eslint-disable-next-line no-unused-vars
JS9.Image.prototype.alignPanZoom = function(im, opts){
    let tim, icen, iwcsinfo, izoom, wcsinfo, syncwcs;
    // sanity check
    if( !im ){ return; }
    // is im a string containing an image name?
    if( typeof im === "string" ){
	tim = JS9.getImage(im);
	if( tim ){
	    // it was an image name, so change im to the image handle
	    im = tim;
	} else {
	    JS9.error(`unknown image for alignPanZoom: ${im}`);
	}
    }
    // opts is optional (not used ... yet)
    opts = opts || {};
    // get center of target image
    icen = im.getPan();
    // get zoom of target image
    izoom = im.rgb.sect.zoom || 1;
    // use wcs to align?
    if( JS9.notNull(opts.syncwcs) ){
	syncwcs = opts.syncwcs;
    } else {
	syncwcs = JS9.globalOpts.syncWCS;
    }
    // do wcs or non-wcs alignment
    if( syncwcs ){
	wcsinfo  = this.raw.wcsinfo || {cdelt1: 1, crot: 0};
	iwcsinfo = im.raw.wcsinfo   || {cdelt1: 1, crot: 0};
	// pan this image to center of target
	this.setPan(JS9.pix2pix(im, this, {x: icen.ox, y: icen.oy}));
	// adjust zoom of this image, taking account of pixel size, target zoom
	this.setZoom(izoom * wcsinfo.cdelt1 / iwcsinfo.cdelt1);
	// adjust rotation of this image
	this.setRotate(iwcsinfo.crot - wcsinfo.crot);

    } else {
	// pan this image to center of target
	this.setPan({x: icen.ox, y: icen.oy});
	// adjust zoom of this image to target zoom
	this.setZoom(izoom);
    }
    // allow chaining
    return this;
};


// get paramerters for north is up, for given wcssys
JS9.Image.prototype.getNorthIsUp = function(wcssys){
    let txeq, cx, cy, arr, ra, dec, wcsinfo;
    let nobj = {};
    // ra, dec coords (degrees) of north poles for galactic, ecliptic
    let pole = {
	// galactic north pole in degrees
	// https://astronomy.swin.edu.au/cosmos/N/North+Galactic+Pole
	galactic: {
	    ra: JS9.saostrtod("12h51m26.00s") * 15,
	    dec: JS9.saostrtod("27d7m42.0s"),
	    wcssys: "FK5"
	},
	// ecliptic north pole in degrees
	// https://en.wikipedia.org/wiki/Orbital_pole
	ecliptic: {
	    ra: JS9.saostrtod("18h0m0.0s") * 15,
	    dec: JS9.saostrtod("66d33m38.55s"),
	    wcssys: "ICRS"
	}
    };
    // wcsinfo
    wcsinfo = this.raw.wcsinfo || {cdelt1: 1, cdelt2: 1, crot: 0};
    // default is current wcssys
    if( !wcssys ){
	wcssys = this.getWCSSys();
    }
    // init angle requirements
    nobj.angle = 0;
    // set flip requirements
    if( wcsinfo.cdelt1 > 0 ){ nobj.flip = "x"; }
    if( wcsinfo.cdelt2 < 0 ){ nobj.flip = (nobj.flip|| "") + "y"; }
    // only galactic and ecliptic use the algorithm below, others are trivial
    switch(wcssys){
    case "galactic":
    case "ecliptic":
	break;
    default:
	if( wcsinfo.crot ){
	    nobj.angle = -wcsinfo.crot;
	}
	return nobj;
    }
    // algorithm for galactic and ecliptic ... from AV (via trello)
    // turn off plugin callbacks
    txeq = JS9.globalOpts.xeqPlugins;
    JS9.globalOpts.xeqPlugins = false;
    // set wcssys to be the same wcssys the north pole coords are in
    this.setWCSSys(pole[wcssys].wcssys, false);
    // get center of image in that coord system
    cx = this.raw.width/2;
    cy = this.raw.height/2;
    arr = JS9.pix2wcs(this.raw.wcs, cx, cy).trim().split(/\s+/);
    // convert strings to float (degrees)
    ra = JS9.saostrtod(arr[0]);
    // ra hours to degrees, if necessary
    if( JS9.isHMS() ){ ra *= 15.0; }
    dec = JS9.saostrtod(arr[1]);
    // angular distance between north pole and image center
    nobj.angle = JS9.angdist(ra, dec, pole[wcssys].ra, pole[wcssys].dec);
    // remove any header-based rotation
    if( JS9.notNull(this.raw.wcsinfo.crot) ){
	nobj.angle -= this.raw.wcsinfo.crot;
    }
    // reset to the current coord system
    this.setWCSSys(wcssys, false);
    // restore plugin callbacks
    JS9.globalOpts.xeqPlugins = txeq;
    // return info
    return nobj;
};

// get transform
JS9.Image.prototype.getTransform = function(){
    return this.params.transform;
};

// set transform (basis for setFlip, setRot90, setRotate)
JS9.Image.prototype.setTransform = function(...args){
    let a, i, sina, cosa, m3, transform;
    let angle = 0;
    let scale = 1;
    let [arg1] = args;
    if( !this || !this.raw || !this.raw.header ){
	JS9.error("invalid image for setTransform");
    }
    // reset -> we're done
    if( arg1 === "reset" ){
	delete this.params.transform;
	delete this.params.transformInverse;
	delete this.params.transformAngle;
	delete this.params.transformScale;
	return;
    }
    // start with the identity matrix
    transform = [[1,0,0], [0,1,0], [0,0,1]];
    // for each transform ...
    for(i=0; i<JS9.globalOpts.transforms.length; i++){
	// ... add this transform to the transformation matrix, if necessary
	switch(JS9.globalOpts.transforms[i]){
	case "flip":
	    // flip
	    switch(this.params.flip){
	    case "x":
		m3 = [[-1, 0, 0], [0, 1, 0], [0, 0, 1]];
		transform = JS9.matrixMultiply(transform, m3);
		scale = -1;
		break;
	    case "y":
		m3 = [[1, 0, 0], [0, -1, 0], [0, 0, 1]];
		transform = JS9.matrixMultiply(transform, m3);
		scale = -1;
		break;
	    case "xy":
		m3 = [[-1, 0, 0], [0, -1, 0], [0, 0, 1]];
		transform = JS9.matrixMultiply(transform, m3);
		break;
	    default:
		break;
	    }
	    break;
	case "rot90":
	    // rot90 rotation
	    if( JS9.notNull(this.params.rot90) ){
		a = this.params.rot90 * Math.PI / 180.0;
		cosa = Math.cos(a);
		sina = Math.sin(a);
		m3 = [[cosa, -sina, 0], [sina, cosa, 0], [0, 0, 1]];
		transform = JS9.matrixMultiply(transform, m3);
		angle += this.params.rot90;
	    }
	    break;
	case "rotate":
	    // arbitrary rotation
	    if( JS9.notNull(this.params.rotate) ){
		a = this.params.rotate * Math.PI / 180.0;
		cosa = Math.cos(a);
		sina = Math.sin(a);
		m3 = [[cosa, -sina, 0], [sina, cosa, 0], [0, 0, 1]];
		transform = JS9.matrixMultiply(transform, m3);
		angle += this.params.rotate;
	    }
	    break;
	}
    }
    // new transform
    this.params.transform = transform;
    this.params.transformInverse = JS9.invertMatrix3(transform);
    // these get applied to each region angle
    this.params.transformAngle = scale * angle;
    this.params.transformScale = scale;
    // allow chaining
    return this;
}

// get flip state
JS9.Image.prototype.getFlip = function(){
    return this.params.flip;
};

// flip image along an axis using canvas transform
JS9.Image.prototype.setFlip = function(...args){
    let [flip, opts] = args;
    const calcFlip = (flip) => {
	let i, arr;
	let nx = 0;
	let ny = 0;
	let nflip = "";
	arr = (flip + (this.params.flip||"")).split("");
	for(i=0; i<arr.length; i++){
	    switch(arr[i]){
	    case "x":
		nx++;
		break;
	    case "y":
		ny++;
		break;
	    }
	}
	if( nx % 2 === 1 ){ nflip += "x"; }
	if( ny % 2 === 1 ){ nflip += "y"; }
	return nflip || "none";
    }
    // sanity checks
    if( JS9.isNull(flip) ){ return this; }
    // reset
    if( flip === "reset" ){
	this.params.flip = "none";
	return this.setFlip(0);
    }
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse setFlip opts: ${opts}`, e); }
    }
    // save this routine so it can be reconstituted in a restored session
    this.xeqStashSave("setFlip", [flip]);
    // save normalized value
    this.params.flip = calcFlip(flip);
    // update the transform
    this.setTransform();
    // redisplay using these data
    this.displayImage("all", opts);
    // refresh shape layers
    this.refreshLayers();
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetflip");
    }
    // allow chaining
    return this;
};

// get rotatation state
JS9.Image.prototype.getRotate = function(){
    return this.params.rotate;
};

// rotate image by specified angle
JS9.Image.prototype.setRotate = function(...args){
    let nobj;
    let [rot, opts] = args;
    const normRot = (rot) => {
	if( JS9.globalOpts.rotateRelative ){
	    rot += this.params.rotate||0;
	}
	while( rot < 0 ){ rot += 360; }
	while( rot >= 360 ){ rot -= 360; }
	return rot;
    }
    // sanity checks
    if( JS9.isNull(rot) ){ return this; }
    // reset
    if( rot === "reset" ){
	this.params.rotate = 0;
	return this.setRotate(0);
    }
    // north is up in current wcs system: calculate rotation angle
    if( typeof rot === "string" && rot.match(/north/i) ){
	nobj = this.getNorthIsUp();
	rot = nobj.angle;
	if( JS9.notNull(nobj.flip) ){ this.setParam("flip", nobj.flip); }
    }
    if( typeof rot === "string" ){
	rot = parseFloat(rot);
    }
    if( !JS9.isNumber(rot) ){
	JS9.error(`invalid rotation for setRotate: ${rot}`);
    }
    if( !this || !this.raw || !this.raw.header ){
	JS9.error("invalid image for setRotate");
    }
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse setRotate opts: ${opts}`, e); }
    }
    // save this routine so it can be reconstituted in a restored session
    this.xeqStashSave("setRotate", [rot]);
    // save normalized value
    this.params.rotate = normRot(rot);
    // update the transform
    this.setTransform();
    // non-rectangular canvas: redo section to ensure coverage of display
    if( this.params.transformAngle                               &&
	this.display.canvas.width !== this.display.canvas.height ){
	this.mkSection(this.getZoom());
    }
    // redisplay using these data
    this.displayImage("all", opts);
    // refresh shape layers
    this.refreshLayers();
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetrotate");
    }
    // allow chaining
    return this;
};

// get 90-degree rotatation state
JS9.Image.prototype.getRot90 = function(){
    return this.params.rot90;
};

// rotate image by multiples of 90 degrees using canvas transform
JS9.Image.prototype.setRot90 = function(...args){
    let [rot, opts] = args;
    const normRot = (rot) => {
	rot += this.params.rot90||0;
	while( rot < 0 ){ rot += 360; }
	while( rot >= 360 ){ rot -= 360; }
	if( rot === 270 ){
	    rot = -90;
	}
	return rot;
    }
    // sanity checks
    if( JS9.isNull(rot) ){ return this; }
    // reset
    if( rot === "reset" ){
	this.params.rot90 = 0;
	return this.setRot90(0);
    }
    if( typeof rot === "string" ){
	rot = parseFloat(rot);
    }
    if( !this || !this.raw || !this.raw.header ){
	JS9.error("invalid image for setRot90");
    }
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse setRot90 opts: ${opts}`, e); }
    }
    // only 90 degree rotations
    switch(rot){
    case 0:
	rot = 0;
	break;
    case 1:
	rot = 90;
	break;
    case -1:
	rot = -90;
	break;
    case 90:
	break;
    case -90:
	break;
    default:
	JS9.error(`invalid setRot90 rotation value: ${rot} (use: +/1, +/90)`);
	break;
    }
    // save this routine so it can be reconstituted in a restored session
    this.xeqStashSave("setRot90", [rot]);
    // save normalized value
    this.params.rot90 = normRot(rot);
    // update the transform
    this.setTransform();
    // non-rectangular canvas: redo section to ensure coverage of display
    if( this.params.transformAngle                               &&
	this.display.canvas.width !== this.display.canvas.height ){
	this.mkSection(this.getZoom());
    }
    // redisplay using these data
    this.displayImage("all", opts);
    // refresh shape layers
    this.refreshLayers();
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetrot90");
    }
    // allow chaining
    return this;
};

// redo the current flip and rot90 in cases where the underyling data changed
// (e.g. displaySection, refreshImage)
JS9.Image.prototype.reFlipRot = function(){
    let i, flips, nrot;
    let flip = this.params.flip;
    let rot90 = this.params.rot90;
    let rot = this.params.rotate;
    if( flip !== "none" ){
	this.params.flip = "none";
	flips = flip.split("");
	for(i=0; i<flips.length; i++){
	    if( flips[i] === "x" || flips[i] === "y" ){
		this.setFlip(flips[i]);
	    }
	}
    }
    if( rot90 ){
	this.params.rot90 = 0;
	nrot = Math.floor(Math.abs(rot90) / 90);
	rot = Math.sign(rot90);
	for(i=0; i<nrot; i++){
	    this.setRot90(rot);
	}
    }
    if( rot ){
	this.setRotate(rot);
    }
    // allow chaining
    return this;
};

// refresh all layers
JS9.Image.prototype.refreshLayers = function(panzoomrefresh){
    let key;
    for( key of Object.keys(this.layers) ){
	if( this.layers[key].show &&
	    this.layers[key].opts.panzoom ){
	    if( panzoomrefresh && panzoomrefresh[key] ){
		panzoomrefresh[key].refresh = true;
	    }
	    this.refreshShapes(key);
	}
    }
    // re-select selected regions
    this.selectShapes("regions", "selected");
};

// return current file-related position for specified image position
JS9.Image.prototype.imageToLogicalPos = function(ipos, lcs){
    let arr, rot, tx, ty, cx, cy, dval;
    let osys = "image";
    const opos = {x: ipos.x, y: ipos.y};
    lcs = lcs || this.params.lcs || "image";
    switch(lcs){
    case "image":
	break;
    case "physical":
	if( this.lcs.physical ){
	    osys = lcs;
	    arr = this.lcs.physical.reverse;
	    rot = this.lcs.physical.rrot;
	    cx = this.lcs.physical.cx;
	    cy = this.lcs.physical.cy;
	}
	break;
    case "detector":
	if( this.lcs.detector ){
	    osys = lcs;
	    arr = this.lcs.detector.reverse;
	    rot = this.lcs.detector.rrot;
	    cx = this.lcs.detector.cx;
	    cy = this.lcs.detector.cy;
	}
	break;
    case "amplifier":
	if( this.lcs.amplifier ){
	    osys = lcs;
	    arr = this.lcs.amplifier.reverse;
	    rot = this.lcs.amplifier.rrot;
	    cx = this.lcs.amplifier.cx;
	    cy = this.lcs.amplifier.cy;
	}
	break;
    }
    if( arr ){
	opos.x = ipos.x * arr[0][0] + ipos.y * arr[1][0] + arr[2][0];
	opos.y = ipos.x * arr[0][1] + ipos.y * arr[1][1] + arr[2][1];
	if( rot ){
	    tx = cx + (opos.x - cx) * rot[0][0] + (opos.y - cy) * rot[1][0] +
		rot[2][0];
	    ty = cy + (opos.x - cx) * rot[0][1] + (opos.y - cy) * rot[1][1] +
		rot[2][1];
	    opos.x = tx;
	    opos.y = ty;
	}
	// for tables, incorporate tlmin into physical coords
	// the tlmin value is saved by jsfitio as tabmin
	if( this.imtab === "table" ){
	    dval = this.raw.bitpix < 0 ? 0.5 : 1;
	    if( this.raw.header.TABMIN1 !== undefined ){
		opos.x = opos.x - dval + this.raw.header.TABMIN1;
	    }
	    if( this.raw.header.TABMIN2 !== undefined ){
		opos.y = opos.y - dval + this.raw.header.TABMIN2;
	    }
	}
    }
    return {x: opos.x, y: opos.y, sys: osys};
};

// return current image position from file-related position
JS9.Image.prototype.logicalToImagePos = function(lpos, lcs){
    let arr, rot, tx, ty, cx, cy, dval;
    const opos = {x: lpos.x, y: lpos.y};
    cx = this.raw.header.CRPIX1 || 1;
    cy = this.raw.header.CRPIX2 || 1;
    lcs = lcs || this.params.lcs || "image";
    switch(lcs){
    case "image":
	break;
    case "ophysical":
	if( this.lcs.ophysical ){
	    arr = this.lcs.ophysical.forward;
	    rot = this.lcs.ophysical.frot;
	} else if( this.lcs.physical ){
	    arr = this.lcs.physical.forward;
	    rot = this.lcs.physical.frot;
	}
	break;
    case "physical":
	if( this.lcs.physical ){
	    arr = this.lcs.physical.forward;
	    rot = this.lcs.physical.frot;
	}
	break;
    case "detector":
	if( this.lcs.detector ){
	    arr = this.lcs.detector.forward;
	    rot = this.lcs.detector.frot;
	}
	break;
    case "amplifier":
	if( this.lcs.amplifier ){
	    arr = this.lcs.amplifier.forward;
	    rot = this.lcs.amplifier.frot;
	}
	break;
    }
    if( arr ){
	// for tables, incorporate tlmin into physical coords
	// the tlmin value is saved by jsfitio as tabmin
	if( this.imtab === "table" ){
	    dval = this.raw.bitpix < 0 ? 0.5 : 1;
	    if( this.raw.header.TABMIN1 !== undefined ){
		lpos.x = lpos.x - this.raw.header.TABMIN1 + dval;
	    }
	    if( this.raw.header.TABMIN2 !== undefined ){
		lpos.y = lpos.y - this.raw.header.TABMIN2 + dval;
	    }
	}
	opos.x = lpos.x * arr[0][0] + lpos.y * arr[1][0] + arr[2][0];
	opos.y = lpos.x * arr[0][1] + lpos.y * arr[1][1] + arr[2][1];
	if( rot ){
	    tx = cx + (opos.x - cx) * rot[0][0] + (opos.y - cy) * rot[1][0] +
		rot[2][0];
	    ty = cy + (opos.x - cx) * rot[0][1] + (opos.y - cy) * rot[1][1] +
		rot[2][1];
	    opos.x = tx;
	    opos.y = ty;
	}
    }
    return opos;
};

// return 1-indexed image coords for specified 0-indexed display position
JS9.Image.prototype.displayToImagePos = function(dpos){
    let x, y, t, ox, oy, dx, dy;
    const sect = this.rgb.sect;
    const hh = this.rgb.img.height;
    const w2 = this.display.width / 2;
    const h2 = this.display.height / 2;
    if( this.params.transformInverse ){
	t = this.params.transformInverse;
	ox = dpos.x - w2;
	oy = dpos.y - h2;
	dx = ox * t[0][0] + oy * t[1][0] + w2;
	dy = ox * t[0][1] + oy * t[1][1] + h2;
    } else {
	dx = dpos.x;
	dy = dpos.y;
    }
    // see funtools/funcopy.c/_FunCopy2ImageHeader
    x = (dx - this.ix + 0.5) / sect.zoom + sect.x0 + 0.5;
    y = (hh - (dy - this.iy + 0.5)) / sect.zoom + sect.y0 + 0.5;
    return {x, y};
};

// return 0-indexed display coords for specified 1-indexed image position
JS9.Image.prototype.imageToDisplayPos = function(ipos){
    let x, y, t, ox, oy;
    const sect = this.rgb.sect;
    const hh = this.rgb.img.height;
    const w2 = this.display.width / 2;
    const h2 = this.display.height / 2;
    // see funtools/funcopy.c/_FunCopy2ImageHeader
    x = (((ipos.x - 0.5) - sect.x0) * sect.zoom) + this.ix - 0.5;
    y = (sect.y0 - (ipos.y - 0.5)) * sect.zoom + hh + this.iy - 0.5;
    if( this.params.transform ){
	t = this.params.transform;
	ox = x - w2;
	oy = y - h2;
	x = ox * t[0][0] + oy * t[1][0] + w2;
	y = ox * t[0][1] + oy * t[1][1] + h2;
    }
    return {x, y};
};

// return 0-indexed display pos from 1-indexed logical pos
JS9.Image.prototype.logicalToDisplayPos = function(lpos, lcs, mode){
    return this.imageToDisplayPos(this.logicalToImagePos(lpos, lcs, mode));
};

// return 1-indexed logical pos from 0-indexed display pos
JS9.Image.prototype.displayToLogicalPos = function(dpos){
    return this.imageToLogicalPos(this.displayToImagePos(dpos));
};

JS9.Image.prototype.getWCSSys = function(){
    if( this.params.wcssys ){
	return this.params.wcssys;
    }
};

// set the WCS sys for this image
JS9.Image.prototype.setWCSSys = function(wcssys, updatedef){
    let s, u;
    // is this core service disabled?
    if( $.inArray("wcs", this.params.disable) >= 0 ){
	return;
    }
    // do we update the default?
    if( JS9.isNull(updatedef) ){
	updatedef = JS9.globalOpts.wcsSetUpdatesDef;
    }
    if( wcssys === "image" ){
	this.params.wcssys = "image";
	this.params.wcsunits = "pixels";
	JS9.wcsunits.image = "pixels";
    } else if( wcssys === "physical" ){
	this.params.wcssys = "physical";
	this.params.wcsunits = "pixels";
	if( updatedef ){
	    JS9.globalOpts.wcsUnits.physical = "pixels";
	}
    } else if( this.validWCS() ){
	// native: original wcs from file
	if( wcssys === "native" ){
	    wcssys = this.params.wcssys0;
	}
	// set wcs system
	s = JS9.wcssys(this.raw.wcs, wcssys);
	if( s ){
	    // store new wcs system param
	    this.params.wcssys = s.trim();
	    // get units associated with this wcs system
	    u = JS9.globalOpts.wcsUnits[this.params.wcssys] || "sexagesimal";
	    // set the units
	    this.setWCSUnits(u, updatedef);
	}
    }
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetwcssys");
    }
    // allow chaining
    return this;
};

// init wcs
JS9.Image.prototype.initWCS = function(header){
    let alt, key, varr, s, bufsize, buf;
    const hlen = JS9.globalOpts.wcsHlength;
    const awcs = /(WCSNAME|WCSAXES|CRVAL[0-9]|CRPIX[0-9]|PC[0-9]_[0-9]|CDELT[0-9]|CD[0-9]_[0-9]|CTYPE[0-9]|CUNIT[0-9]|CRVAL[0-9]|PV[0-9]_[0-9]|PS[0-9]_[0-9]|RADESYS|LONPOLE|LATPOLE)([A-Z])/;
    if( !this.raw.header ){
	return this;
    }
    // usually it's the raw header
    header = header || this.raw.header;
    // clean up old wcs
    this.freeWCS();
    // init object to hold alt wcs objects
    this.raw.altwcs = {};
    // set up the default wcs, using the original header params
    alt = "default";
    this.raw.altwcs[alt] = {};
    this.raw.altwcs[alt].header = header;
    // look for wcs alternates
    // see: http://www.atnf.csiro.au/people/mcalabre/WCS/wcs.pdf
    for( key of Object.keys(header) ){
	// is it an alt wcs keyword?
	varr = key.match(awcs);
	if( varr && varr.length ){
	    // this is the A-Z version
	    alt = varr[2];
	    // init the alt wcs object, if necessary
	    if( !this.raw.altwcs[alt] ){
		this.raw.altwcs[alt] = {};
		// start with original header
		this.raw.altwcs[alt].header = $.extend({}, header);
	    }
	    // wcslib seems to want "RADECSYS", not "RADESYS"
	    if( varr[1] === "RADESYS" ){
		varr[1] = "RADECSYS";
	    }
	    // overwrite standard keyword in header with the alt value
	    this.raw.altwcs[alt].header[varr[1]] = header[varr[0]];
	}
    }
    // init all of the wcs's we found
    for( key of Object.keys(this.raw.altwcs) ){
	// loop through alt wcs objects
	s = JS9.raw2FITS(this.raw.altwcs[key].header);
	// too large headers blow Emscripten's stack space
	// this.raw.altwcs[key].wcs = JS9.initwcs(s, hlen);
	// so we have to copy the header to the heap:
	// allocate space for the string in the emscripten heap
	bufsize = s.length + 1;
	try{ buf = JS9.vmalloc(bufsize); }
	catch(e){ JS9.error(`can't malloc for wcsinit: ${bufsize}`, e); }
	// copy the string to the heap
	try{ JS9.vstrcpy(s, buf); }
	catch(e){ JS9.error(`can't copy for wcsinit: ${bufsize}`, e); }
	// call the wcsinit routine, passing the heap pointer
	this.raw.altwcs[key].wcs = JS9.initwcs(buf, hlen);
	// free heap space
	JS9.vfree(buf);
	// get info about the wcs
	if( this.raw.altwcs[key].wcs > 0 ){
	    try{ this.raw.altwcs[key].wcsinfo =
		 JSON.parse(JS9.wcsinfo(this.raw.altwcs[key].wcs)); }
	    catch(ignore){ /* empty */ }
	}
    }
    // set current wcs to the default
    this.setWCS("default");
    // allow chaining
    return this;
};

// close and free wcs resources
JS9.Image.prototype.freeWCS = function(raw){
    let key;
    // raw defaults to ... default raw
    raw = raw || this.raw;
    if( raw.altwcs ){
	// free all wcs structures
	for( key of Object.keys(raw.altwcs) ){
	    // loop through alt wcs objects
	    if( raw.altwcs[key].wcs > 0 ){
		JS9.freewcs(raw.altwcs[key].wcs);
		raw.altwcs[key].wcs = null;
	    }
	}
    }
};

// get name of current wcs (from among the alternates)
JS9.Image.prototype.getWCS = function(){
    let key, obj;
    // loop through wcs objects, looking for a match
    for( key of Object.keys(this.raw.altwcs) ){
	if( this.raw.wcs === this.raw.altwcs[key].wcs ){
	    obj = $.extend(true, {}, this.raw.altwcs[key].wcsinfo);
	    obj.version = key;
	    obj.wcsname = this.raw.altwcs[key].header.WCSNAME;
	    return obj;
	}
    }
    return null;
};

// set wcs to default or one of the alternative versions
JS9.Image.prototype.setWCS = function(version){
    let key, wcsname, wcssys;
    version = version || "default";
    // sanity check
    if( !this.raw || !this.raw.altwcs ){ return this; }
    // loop through wcs objects, looking for a match
    for( key of Object.keys(this.raw.altwcs) ){
	wcsname = this.raw.altwcs[key].header.WCSNAME;
	if( (version === key) || (version === wcsname) ){
	    // make sure its a valid wcs
	    if( this.raw.altwcs[key].wcs <= 0 ){
		JS9.error("invalid WCS for version: %s", version);
	    }
	    // set this wcs up as the current one
	    this.raw.wcs = this.raw.altwcs[key].wcs;
	    // get info about the wcs
	    this.raw.wcsinfo = this.raw.altwcs[key].wcsinfo;
	    // look for a good wcssys
	    if( this.raw.wcsinfo && this.raw.wcsinfo.radecsys ){
		wcssys = this.raw.wcsinfo.radecsys;
	    } else {
		if( this.params.wcssys !== "native" ){
		    wcssys = this.params.wcssys.trim();
		} else {
		    wcssys = this.params.lcs;
		}
	    }
	    // set the wcs system
	    this.setWCSSys(wcssys);
	    // this is also the default
	    if( !this.params.wcssys0 ){
		this.params.wcssys0 = wcssys;
	    }
	    // set the wcs units
	    this.setWCSUnits(this.params.wcsunits);
	    // all done
	    return this;
	}
    }
    // didn't find it
    JS9.error(`could not find WCS version: ${version}`);
};

// is a valid WCS open and active
JS9.Image.prototype.validWCS = function(){
    return this.raw && this.raw.wcs && this.raw.wcs > 0;
};

// get the WCS units for this image
JS9.Image.prototype.getWCSUnits = function(){
    if( this.params.wcsunits ){
	return this.params.wcsunits;
    }
    return "pixels";
};

// set the WCS units for this image
JS9.Image.prototype.setWCSUnits = function(wcsunits, updatedef){
    let s, ws;
    // is this core service disabled?
    if( $.inArray("wcs", this.params.disable) >= 0 ){
	return;
    }
    // do we update the default?
    if( JS9.isNull(updatedef) ){
	updatedef = JS9.globalOpts.wcsSetUpdatesDef;
    }
    if( wcsunits === "pixels" ){
	if( JS9.isWCSSys(this.params.wcssys) ){
	    this.params.wcssys = "physical";
	}
	this.params.wcsunits = "pixels";
	if( updatedef ){
	    JS9.globalOpts.wcsUnits[this.params.wcssys] = "pixels";
	}
    } else if( this.validWCS() ){
	if( JS9.notWCS(this.params.wcssys) ){
	    ws = JS9.imageOpts.wcssys;
	    this.setWCSSys(ws);
	}
	s = JS9.wcsunits(this.raw.wcs, wcsunits);
	if( s ){
	    this.params.wcsunits = s.trim();
	    if( updatedef ){
		JS9.globalOpts.wcsUnits[this.params.wcssys] =
		    this.params.wcsunits;
	    }
	}
    }
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetwcsunits");
    }
    // allow chaining
    return this;
};

// notify the helper a new image was displayed
JS9.Image.prototype.notifyHelper = function(){
    let basedir, image1, image2;
    const imexp = new RegExp(`^${JS9.ANON}[0-9]*`);
    const installexp = JS9.INSTALLDIR ? new RegExp(`^${JS9.INSTALLDIR}`) : null;
    // notify the helper
    if( JS9.helper.connected && !this.file.match(imexp) ){
	switch(JS9.helper.type){
	case "get":
	case "post":
	    // get pageid from CGI helper (socket.io does this when connecting)
	    if( !JS9.helper.pageid ){
		JS9.helper.send("pageid", null, (s) => {
		    if( s && s.trim().match(/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/) ){
			JS9.helper.pageid = s;
			JS9.helper.js9helper = "js9helper";
		    }
		});
		break;
	    }
	}
	// get helper info about this image
	// but also try removing part of path which gets to install dir
	image1 = this.file;
	if( image1.charAt(0) !== "/" && installexp ){
	    image2 = this.file.replace(installexp, "");
	}
	JS9.helper.send("image", {"image": image1, "image2": image2}, (res) => {
	    let rstr, r, s, cc, regexp;
	    if( typeof res === "object" ){
		// from node.js, we get an object with stdout and stderr
		rstr = res.stdout;
		// log stderr but keep going
		if( res.stderr && JS9.DEBUG > 1 ){
		    JS9.log(res.stderr);
		}
	    } else {
		// with cgi, we just get stdout
		rstr = res;
	    }
	    // unless we have no stdout
	    if( !rstr ){
		return;
	    }
	    // returns: [file, path, wcs]
	    // split args, dealing with spaces inside brackets
	    r = rstr.trim().match(/(?:[^\s[]+|\[[^\]]*\])+/g);
	    s = r[1];
	    if( s !== "?" ){
		if( !JS9.globalOpts.dataDir ){
		    this.fitsFile = s;
		    // prepend base of png path if fits file has no path
		    // is this a bad "feature" in tpos?? probably ...
		    if( !this.fitsFile.includes("/") ){
			basedir = this.file.match( /.*\// );
			// but don't add installdir as part of prefix
			// (fitsFile path is relative to the js9 directory)
			if( basedir && basedir.length ){
			    regexp = new RegExp(`^${JS9.INSTALLDIR}`);
			    basedir = basedir[0].replace(regexp, "");
			    this.fitsFile =  basedir + this.fitsFile;
			}
		    }
		    // prepend JS9_DIR on files if fits is not absolute
		    if( JS9.globalOpts.prependJS9Dir ){
			if( this.fitsFile &&
			    !this.fitsFile.match(/^\${JS9_DIR}/) &&
			    this.fitsFile.charAt(0) !== "/" ){
			    this.fitsFile = `\${JS9_DIR}/${this.fitsFile}`;
			}
			if( this.parentFile &&
			    !this.parentFile.match(/^\${JS9_DIR}/) &&
			    this.parentFile.charAt(0) !== "/" ){
			    this.parentFile = `\${JS9_DIR}/${this.parentFile}`;
			}
		    }
		} else {
		    cc = s.lastIndexOf("/") + 1;
		    this.fitsFile = `${JS9.globalOpts.dataDir}/${s.slice(cc)}`;
		}
		if( JS9.DEBUG > 1 ){
		    JS9.log("JS9 fitsFile: %s %s", this.file, this.fitsFile);
		}
	    }
	    if( this.fitsFile ){
		this.fitsFile = JS9.cleanPath(this.fitsFile);
	    }
	    if( this.parentFile ){
		this.parentFile = JS9.cleanPath(this.parentFile);
	    }
	    // first time through, query the helper for info
	    if( !this.queried ){
		this.queryHelper("all");
		this.queried = true;
	    }
	});
    }
    // allow chaining
    return this;
};

// ask helper for various types of information
JS9.Image.prototype.queryHelper = function(which){
    const what = which || "all";
    // query the helper
    if( JS9.helper.connected ){
	if( (what === "all") || (what === "getAnalysis") ){
	    // only retrieve analysis tasks once per image
	    if( !this.analysisPackages ){
		JS9.helper.send("getAnalysis", {"fits": this.fitsFile}, (s) => {
		    if( s ){
			try{ this.analysisPackages = JSON.parse(s); }
			catch(e){ JS9.log("can't get analysis", e); }
		    }
		});
	    }
	}
    }
    // allow chaining
    return this;
};

// expand macros for this image
JS9.Image.prototype.expandMacro = function(s, opts){
    let cmd, olen;
    // sanity check
    if( !s ){ return; }
    // process each $ token
    // eslint-disable-next-line no-unused-vars
    cmd = s.replace(/\${?([a-zA-Z][a-zA-Z0-9_()]+)}?/g, (m, t, o) => {
	let i, r, owcssys, pos;
	// called in image context
	const savewcs = (wcssys) => {
	    const owcs = this.params.wcssys;
	    if( wcssys ){
		switch(wcssys){
		case "wcs":
		    if( JS9.notWCS(owcs) ){
			this.params.wcssys = this.params.wcssys0;
		    }
		    break;
		case "physical":
		case "image":
		    this.params.wcssys = wcssys;
		    break;
		default:
		    break;
		}
	    }
	    return owcs;
	};
	const restorewcs = (wcssys) => {
	    if( wcssys ){
		this.params.wcssys = wcssys;
	    }
	};
	const withext = (r) => {
	    let e;
	    // for tables, we might need to add the binning filter
	    if( this.imtab === "table" ){
		if( this.raw.hdu && this.raw.hdu.table.filter &&
		    !r.match(this.raw.hdu.table.filter)       ){
		    if( r.match(/\]\[/) ){
			r = `${r.slice(0,-1)}&&${this.raw.hdu.table.filter}]`;
		    } else {
			r += `[${this.raw.hdu.table.filter}]`;
		    }
		}
	    } else if( this.imtab === "image" ){
		// for images, we might need to add/replace extension info
		e = this.file.match(/\[.*\]/);
		if( e ){
		    if( r.match(/\[.*\]/) ){
			r = r.replace(/\[.*\]/, e);
		    } else {
			r += e;
		    }
		} else if( this.raw && this.raw.hdu &&
			   this.raw.hdu.slice       ){
		    // current slice of 3D cube
		    e = this.raw.hdu.slice
			.replace(/:/g, ",").replace(/([0-9][0-9]*)/, "$1:$1");
		    r += `[${e}]`;
		} else if( this.raw && this.raw.header &&
			   this.raw.header.NAXIS > 2   ){
		    // first slice of 3D cube
		    r += `[*,*,1:1]`;
		}
	    }
	    return r;
	};
	const u = t.split("(");
	if( u[1] ){
	    u[1] = u[1].replace(/\)$/, "");
	}
	switch(u[0]){
	case "id":
	    r = this.display.divjq.attr("id");
	    break;
	case "image0":
	    r = this.id.replace(/\[EVENTS\]/i, "");
	    break;
	case "image":
	    r = this.id;
	    break;
	case "filename":
	    // for cubes, process all slices if (all) is specified
	    if( u[1] == "all" && this.fitsFile &&
		this.raw && this.raw.header && this.raw.header.NAXIS === 3 ){
		r = this.fitsFile;
	    } else if( this.parentFile && (u[1] !== "this") ){
		// if a filter is defined, add it
		if( this.raw && this.raw.filter ){
		    r = this.parentFile;
		    // assume parent is a table with EVENTS
		    if( !r.match(/\[.*\]/) ){ r += '[EVENTS]'; }
		    r += `[${this.raw.filter}]`;
		} else {
		    r = withext(this.parentFile);
		}
	    } else if( this.fitsFile ){
		r = withext(this.fitsFile);
	    } else {
		JS9.error(`no FITS file for ${this.id}`);
	    }
	    break;
	case "fits":
	    if( !this.fitsFile ){
		JS9.error(`no FITS file for ${this.id}`);
	    }
	    r = withext(this.fitsFile);
	    break;
	case "parent":
	    if( !this.parentFile ){
		JS9.error(`no parent FITS file for ${this.id}`);
	    }
	    r = this.parentFile;
	    break;
	case "ext":
	    if( this.fitsFile ){
		r = this.fitsFile.match(/\[.*\]/);
		if( r === null ){
		    r = "";
		}
	    } else {
		JS9.error(`no FITS file for ${this.id}`);
	    }
	    break;
	case "imcenter":
	    pos = this.displayToLogicalPos({x: this.display.width/2,
					    y: this.display.height/2});
	    r = `${pos.x},${pos.y}`;
	    break;
	case "wcscenter":
	    pos = this.displayToImagePos({x: this.display.width/2,
					  y: this.display.height/2});
	    r = JS9.pix2wcs(this.raw.wcs, pos.x, pos.y).replace(/\s+/g, ",");
	    break;
	case "sregions":
	    owcssys = savewcs(u[1]);
	    r = this.listRegions("source",
		{mode:0, includedcoords:JS9.globalOpts.regExpandDCoords})
		.replace(/\s+/g,"");
	    restorewcs(owcssys);
	    break;
	case "bregions":
	    owcssys = savewcs(u[1]);
	    r = this.listRegions("background",
		{mode:0, includedcoords:JS9.globalOpts.regExpandDCoords})
		.replace(/\s+/g,"");
	    restorewcs(owcssys);
	    break;
	case "regions":
	    owcssys = savewcs(u[1]);
	    r = this.listRegions("all",
		{mode:0, includedcoords:JS9.globalOpts.regExpandDCoords})
		.replace(/\s+/g,"");
	    restorewcs(owcssys);
	    break;
	case "mag":
	    // hack for statusbar
	    if( this.params.zoom ){
		r = sprintf("%s%", 100 * this.params.zoom);
	    } else {
		r = "?";
	    }
	    break;
	case "bin":
	    // binning factor for image/event file
	    if( this.binning.bin ){
		r = this.binning.bin;
	    } else {
		r = "?";
	    }
	    break;
	case "flip":
	    // flip info
	    if( this.params.flip ){
                r = this.params.flip;
	    } else {
		r = "?";
	    }
	    break;
	case "flipx":
	    // flipx
	    if( this.params.flip ){
                if (this.params.flip.match('x')) {
                    r = "x";
                } else {
                    r = "x-none";
                }
	    } else {
		r = "?";
	    }
	    break;
	case "flipy":
	    // flipy
	    if( this.params.flip ){
                if (this.params.flip.match('y')) {
                    r = "y";
                } else {
                    r = "y-none";
                }
	    } else {
		r = "?";
	    }
	    break;
	default:
	    // look for keyword in the serialized opts array
	    if( opts ){
		olen = opts.length;
		for(i=0; i<olen; i++){
		    if( opts[i].name === t ){
			r = opts[i].value;
			break;
		    }
		}
	    }
            // look for params in the image object
            if( r === undefined && this && this.params[t] !== undefined ){
		// shorten some of the results
		switch(t){
		case "wcsunits":
                    switch(this.params[t]){
                    case "sexagesimal":
			r = "hms";
			break;
                    case "degrees":
			r = "deg";
			break;
                    default:
			r = this.params[t];
			break;
                    }
                    break;
		case "scaleclipping":
                    switch(this.params[t]){
                    case "dataminmax":
			r = "data";
			break;
                    default:
			r = this.params[t];
			break;
                    }
                    break;
		case "colormap":
		    if( this.useOffScreenCanvas() ){
			r = "overlay";
		    } else {
			r = this.params[t];
		    }
		    break;
		default:
                    if( typeof this.params[t] === "number"            &&
			this.params[t] !== Math.floor(this.params[t]) ){
			r = this.params[t].toFixed(2);
                    } else {
			r = this.params[t];
                    }
                    break;
		}
            }
	    // if all else fails, return original macro unexpanded
	    if( r === undefined ){
		r = m;
	    }
	    break;
	}
        if (JS9.useStatusbarDictionary) {
            if (JS9.globalOpts.statusBarDictionary[r]) {
                r = JS9.globalOpts.statusBarDictionary[r];
            }
        }
	return r;
    });
    return cmd;
};

// lookup an analysis command by name
JS9.Image.prototype.lookupAnalysis = function(name){
    let i, j, tasks;
    let a = null;
    // look for the named analysis task
    if( this.analysisPackages ){
	// look for xclass:name
	for(j=0; j<this.analysisPackages.length && !a; j++){
	    tasks = this.analysisPackages[j];
	    for(i=0; i<tasks.length; i++){
		// the analysis command we are using
		a = tasks[i];
		if( a.xclass && ((`${a.xclass}:${a.name}`) === name) ){
		    break;
		}
		a = null;
	    }
	}
	if( a ){
	    return a;
	}
	// look for name
	for(j=0; j<this.analysisPackages.length && !a; j++){
	    tasks = this.analysisPackages[j];
	    for(i=0; i<tasks.length; i++){
		// the analysis command we are using
		a = tasks[i];
		if( a.name === name ){
		    break;
		}
		a = null;
	    }
	}
    }
    return a;
};

// validate a task against rules contained in the files parameter
JS9.Image.prototype.validateAnalysis = function(atask){
    let s, parr;
    const imexp = /imVar\((.*),(.*)\)/;
    const js9exp = /js9Var\((.*),(.*)\)/;
    const parexp = /fitsHeader\(([A-Za-z0-9_]+),(.*)\)/;
    const winexp = /winVar\((.*),(.*)\)/;
    const seq = (s1, s2) => {
	if( !s1 || !s2 ){
	    return false;
	}
	return String(s1).toUpperCase() === String(s2).toUpperCase();
    };
    // sanity check
    if( !atask.title || !atask.name ){ return false; }
    // is this task hidden?
    if( atask.hidden ){
	return false;
    }
    // file validators
    if( atask.files ){
	if( atask.files.match(/^fits$/) &&
	    !this.fitsFile ){
	    return false;
	}
	if( atask.files.match(/^table$/) ){
	    if( this.imtab !== "table" ){
		return false;
	    }
	}
	if( atask.files.match(/^image$/) ){
	    if( this.imtab !== "image" ){
		return false;
	    }
	}
	// header params: fitsHeader(pname,pvalue)
	parr = atask.files.match(parexp);
	if( parr ){
	    s = this.raw.header[parr[1].toUpperCase()];
	    if( !seq(s, parr[2]) ){
		return false;
	    }
	}
	// win vars: winVar(name,value)
	parr = atask.files.match(winexp);
	if( parr ){
	    s = JS9.varByName(parr[1], window);
	    if( !seq(s, parr[2]) ){
		return false;
	    }
	}
	// js9 vars: js9Var(name,value)
	parr = atask.files.match(js9exp);
	if( parr ){
	    s = JS9.varByName(parr[1], JS9);
	    if( !seq(s, parr[2]) ){
		return false;
	    }
	}
	// im vars: imVar(name,value)
	parr = atask.files.match(imexp);
	if( parr ){
	    s = JS9.varByName(parr[1], this);
	    if( !seq(s, parr[2]) ){
		return false;
	    }
	}
    } // end of file validators
    return true;
};

// return object containing analysis task definitions
JS9.Image.prototype.getAnalysis = function(){
    let i, j, t, tasks;
    const obj = [];
    // sanity check
    if( !this.analysisPackages ){ return obj; }
    // return validated tasks
    for(j=0; j<this.analysisPackages.length; j++){
	tasks = this.analysisPackages[j];
	for(i=0; i<tasks.length; i++){
	    t = tasks[i];
	    if( this.validateAnalysis(t) ){
		obj.push(t);
	    }
	}
    }
    return obj;
};

// execute analysis task
JS9.Image.prototype.runAnalysis = function(name, opts, func){
    let i, a, m, ropts;
    let obj = {};
    const analError = (s, t) => {
	// shouldn't happen
	if( !JS9.helper ){
	    JS9.error(s, t);
	}
	switch(JS9.helper.type){
	case 'nodejs':
	case 'socket.io':
	    // when socket.io is long-polling, throwing an error prevent the
	    // polling from completing, leading to a timeout error and disaster.
	    // to allow the polling to complete, throw the error after a delay
	    if( JS9.helper.socket &&
		JS9.helper.socket.io.engine.transport.name === "polling"){
		window.setTimeout(() => {
		    JS9.error(s, t);
		}, 0);
	    } else {
		JS9.error(s, t);
	    }
	    break;
	default:
	    JS9.error(s, t);
	    break;
	}
    };
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse runAnalysis opts: ${opts}`, e); }
    }
    // func can be passed, or it can be global
    func = func || JS9.globalOpts.analysisFunc;
    // sanity check
    if( !JS9.helper.connected || !this.analysisPackages ){ return; }
    // get analysis task
    a = this.lookupAnalysis(name);
    if( !a ){
	JS9.error(`could not find analysis task: ${name}`);
	return;
    }
    // get command line using macro expansion
    if( a.action ){
	obj.cmd = this.expandMacro(a.action, opts);
    }
    // macro expand the strings in the keys array
    if( a.keys ){
	obj.keys = {};
	for(i=0; i<a.keys.length; i++){
	    obj.keys[a.keys[i]] = this.expandMacro(`$${a.keys[i]}`, opts);
	}
    }
    // add some needed parameters
    obj.id = this.expandMacro("$id");
    obj.image = this.file;
    obj.fits = this.fitsFile;
    obj.rtype = a.rtype;
    // For socket.io communication, we have flattened the message space so
    // each analysis tool utilizes its own message. This allows easier addition
    // of non-exec'ed, in-line analysis. The cgi support utilizes the
    // 'runAnalysis' message to exec a task (there are no in-line additions)
    switch(JS9.helper.type){
    case 'nodejs':
    case 'socket.io':
	m = a.xclass ? (`${a.xclass}:${a.name}`) : a.name;
	break;
    default:
	m = "runAnalysis";
	break;
    }
    // ask the helper to run the command
    // change the cursor to show the waiting status
    JS9.waiting(true, this.display);
    // set status
    this.setStatus("runAnalysis", "processing");
    JS9.helper.send(m, obj, (r) => {
	let s, robj, f, pf, xobj, files;
	// return type can be string or object
	if( typeof r === "object" ){
	    // object from node.js
	    robj = r;
	} else {
	    // string from cgi
	    if( r.search(JS9.analOpts.epattern) >=0 ){
		robj = {stderr: r};
	    } else {
		robj = {stdout: r};
	    }
	}
	robj.errcode = robj.errcode || 0;
	// if a processing func was supplied, call it and don't display
	if( func ){
	    func.call(this, robj.stdout, robj.stderr, robj.errcode, a);
	} else {
	    // handle errors before we start
	    if( robj.stderr ){
		s = robj.stderr;
		// if its only a warning, log it
		if( (s.search(/WARNING:/i) >= 0) && (s.search(/ERROR:/i) < 0) ){
		    JS9.log(s);
		} else {
		    // otherwise, throw an error
		    analError(s, JS9.analOpts.epattern);
		    return;
		}
	    } else if( robj.errcode ){
		s = `ERROR: running ${a.name} [${robj.errcode}]`;
		// not sure what this means, so just log it if stdout exists
		if( robj.stdout ){
		    JS9.log(s);
		} else {
		    // otherwise, throw an error
		    analError(s, JS9.analOpts.epattern);
		    return;
		}
	    }
	    // display according to type
	    switch(a.rtype){
	    case "text":
	    case undefined:
		this.displayAnalysis("text", robj.stdout,
				     {divid: JS9.globalOpts.analysisDiv});
		break;
	    case "plot":
		this.displayAnalysis("plot", robj.stdout,
				     {divid: JS9.globalOpts.analysisDiv});
		break;
	    case "alert":
		if( robj.stdout ){
		    alert(robj.stdout);
		}
		break;
	    case "fits":
		// output is file and possibly parentFile
		files = robj.stdout.split(/\s+/);
		if( files && files[0] ){
		    // file
		    f = JS9.cleanPath(files[0]);
		    // relative path: add install dir prefix
		    if( f.charAt(0) !== "/" ){
			f = JS9.InstallDir(f);
		    }
		    // which is a proxy file (meaning: delete it on close)
		    xobj = {proxyFile: f};
		    // look for parentFile (relative to helper, not install)
		    if( files[1] ){
			pf = JS9.cleanPath(files[1]);
			xobj.parentFile = pf;
			xobj.proxyParent = pf;
		    }
		    // don't convert this FITS file into another FITS file!
		    xobj.fits2fits = false;
		    // don't fix the path for desktop
		    xobj.fixpath = false;
		    // load new file
	            JS9.Load(f, xobj, {display: this.display});
		}
		break;
	    case "regions":
		// output is region file (or region string), optional opts
		files = robj.stdout.split(/\s+/);
		if( files && files[0] ){
		    // see if a json opts was returned
		    if( files.length > 1 ){
			try{ ropts = JSON.parse(files[1]); }
			catch(e){ ropts = null; }
		    }
		    ropts = ropts || {};
		    if( typeof ropts.remove === "boolean" ){
			ropts.remove = "all";
		    }
		    if( ropts.type === "string" ){
			// region string was passed directly
			if( ropts.remove ){
			    this.removeShapes("regions", ropts.remove);
			}
			this.addShapes("regions", files[0], opts);
		    } else {
			// region file was passed, we have to fetch it
			f = JS9.cleanPath(files[0]);
			// relative path: add install dir prefix
			if( f.charAt(0) !== "/" ){
			    f = JS9.InstallDir(f);
			}
			// load new region file
			obj = {responseType: "text"};
			JS9.fetchURL(null, f, obj, (regions, opts) => {
			    if( ropts.remove ){
				this.removeShapes("regions", ropts.remove);
			    }
			    this.addShapes("regions", regions, opts);
			});
		    }
		}
		break;
	    case "catalog":
		// output is catalog file
		files = robj.stdout.split(/\s+/);
		if( files && files[0] ){
		    f = JS9.cleanPath(files[0]);
		    // load new catalog file
		    obj = {responseType: "text"};
		    JS9.fetchURL(null, f, obj, (catalog, opts) => {
			this.loadCatalog(null, catalog, opts);
		    });
		}
		break;
	    case "none":
		break;
	    default:
		JS9.error(`unknown analysis result type: ${a.rtype}`);
		break;
	    }
	}
	// set status
	this.setStatus("runAnalysis", "complete");
	// done waiting
	JS9.waiting(false);
    });
    // allow chaining
    return this;
};

// display analysis results (text or plot)
JS9.Image.prototype.displayAnalysis = function(type, s, opts){
    let i, r, id, did, hstr, pobj, divjq, title, titlefile, winFormat;
    let divid, plot, pdata, popts, gim, gdiv, nscale;
    const a = JS9.lightOpts[JS9.LIGHTWIN];
    const flotConfig = () => {
	let s;
	let winformat = "width=368px,height=110px,resize=1,scrolling=1";
	const title = JS9.Plot.opts.title;
	// sanity check
	if( !divjq || !plot ){ return; }
	// call this once window is loaded
	$(JS9.lightOpts[JS9.LIGHTWIN].topid)
	    .arrive("#plotConfigForm", {onceOnly: true}, () => {
		JS9.Plot.initConfigForm.call(this, plot, pobj);
	    });
	if( JS9.allinone ){
	    s = JS9.allinone.plotConfigHTML;
	    plot.winid = this.displayAnalysis("params", s, {title, winformat});
	} else {
	    s = JS9.InstallDir(JS9.Plot.opts.configURL);
	    plot.winid = this.displayAnalysis("params", s, {title, winformat});
	}
    };
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse displayAnalysis opts: ${opts}`, e); }
    }
    // window format ...
    winFormat = opts.winformat;
    // ... or target div
    if( opts.divid && $(`#${opts.divid}`).length > 0 ){
	divid = $(`#${opts.divid}`);
    }
    // make up title, if necessary
    title = opts.title || "";
    if( this && !title ){
	titlefile = (this.fitsFile || this.id || "");
	titlefile = titlefile.split("/").reverse()[0];
	title = `AnalysisResults: ${titlefile}`;
	// add display to title
	title += sprintf(JS9.IDFMT, this.display.id);
    }
    // unique id for light window
    id = `Analysis_${JS9.uniqueID()}`;
    // process the type of analysis results
    switch(type){
    case "text":
	s = s || "";
	hstr = "<div class='JS9Analysis'></div>";
	hstr += `<pre class='JS9AnalysisText'>${s}</pre>`;
	hstr += "</div>";
	// populate div or create the light window to hold the text
        if( divid ){
	    // existing div
	    divid.html(hstr);
	    // Electron does not support search so we implement our own ...
	    if( window.electron ){
		JS9.searchbar(divid[0]);
	    }
	} else {
	    // display light window
	    winFormat = winFormat || a.textWin;
	    did = JS9.lightWin(id, "inline", hstr, title, winFormat);
	    // Electron does not support search so we implement our own ...
	    if( window.electron ){
		JS9.searchbar(did);
	    }
	}
	break;
    case "plot":
	// convert results to js object
	if( s && typeof s === "string" ){
	    try{ pobj = JSON.parse(s); }
	    catch(e){ JS9.error(`can't plot return data: ${s}`, e);	}
	} else if( typeof s === "object" ){
	    pobj = s;
	}
	// sanity check
	if( !pobj ){ return; }
	// initialize scale
	pobj.curscale = {x: "linear", y: "linear"};
	// create an outer div and an inner plot for the light window open call
	hstr = `<div id='${id}' class='JS9Analysis'><div id='${id}Plot' class='JS9Plot' ></div></div>`;
	// populate div or create the light window to hold the plot
        if( divid ){
	    divid.html(hstr);
	} else {
	    winFormat = winFormat || a.plotWin;
	    did = JS9.lightWin(id, "inline", hstr, title, winFormat);
	}
	// find the inner plot div which now is inside the light window
	divjq = $(`#${id} #${id}Plot`);
	// when using a div (instead of a lightwin), set the div size
        if( divid ){
	    divjq.css("width", divid.css("width"));
	    divjq.css("height", divid.css("height"));
	    divjq.css("margin", 0);
	}
	// flot data
	if( pobj.data ){
	    switch( JS9.globalOpts.plotLibrary ){
	    case "plotly":
		popts = $.extend(true, {}, JS9.Plot.opts, pobj.opts);
		if( pobj.label ){
		    popts.title = pobj.label;
		}
		pdata = {x: [], y: [], type: "scatter"};
		// flot data format: [[x1,y1], [x2,y2], ..]
		//               or: [[x1,y1,yerr1], [x2,y2,yerr2], ..]
		if( pobj.data[0].length >= 3 ){
		    // look for flot yerr properties
		    pdata.error_y = {type: 'data', array: [], visible: true};
		    if( pobj.points && pobj.points.yerr ){
			if( pobj.points.yerr.color ){
			    pdata.error_y.color = pobj.points.yerr.color;
			}
		    }
		}
		for(i=0; i<pobj.data.length; i++){
		    pdata.x.push(pobj.data[i][0]);
		    pdata.y.push(pobj.data[i][1]);
		    if( pdata.error_y && pdata.error_y.array ){
			pdata.error_y.array.push(pobj.data[i][2]);
		    }
		}
		if( JS9.Plot.opts.annotate && pobj.annotations ){
		    popts.annotations = JS9.Plot.annotate(pobj);
		}
		if( popts.xscale === "log" ){
		    popts.xaxis = popts.xaxis || {};
		    popts.xaxis.type = "log";
		    popts.xaxis.autorange = true;
		    pobj.curscale.x = "log";
		}
		if( popts.yscale === "log" ){
		    popts.yaxis = popts.yaxis || {};
		    popts.yaxis.type = "log";
		    popts.yaxis.autorange = true;
		    pobj.curscale.y = "log";
		}
		try{  Plotly.newPlot(divjq.attr("id"), [pdata], popts); }
		catch(e){ JS9.error("can't plot data (plotly)", e); }
		break;
	    case "flot":
	    default:
		popts = $.extend(true, {}, JS9.Plot.opts, pobj.opts);
		// add re-annotate callback, if necessary
		if( JS9.Plot.opts.annotate && pobj.annotations ){
		    // eslint-disable-next-line no-unused-vars
		    popts.zoomStack.func = (plt, r) => {
			JS9.Plot.annotate(divjq, plt, pobj);
		    };
		}
		pobj.color = pobj.color || popts.color;
		// log scale?
		if( pobj.xscale === "log" ){
		    popts.xaxis = popts.xaxis || {};
		    popts.xaxis.transform = JS9.Plot.logfunc;
		    popts.xaxis.inverseTransform = JS9.Plot.expfunc;
		    pobj.curscale.x = "log";
		}
		if( pobj.yscale === "log" ){
		    popts.yaxis = popts.yaxis || {};
		    popts.yaxis.transform = JS9.Plot.logfunc;
		    popts.yaxis.inverseTransform = JS9.Plot.expfunc;
		    pobj.curscale.y = "log";
		}
		try{ plot = $.plot(divjq, [pobj], popts); }
		catch(e){ JS9.error("can't plot data (flot)", e); }
		// annotate, if necessary
		if( JS9.Plot.opts.annotate && pobj.annotations ){
		    JS9.Plot.annotate(divjq, plot, pobj);
		}
		break;
	    }
	    // add key handlers
	    divjq.css("outline", "none");
	    divjq.attr("tabindex", 0);
	    divjq.on("keydown", (evt) => {
		const c = JS9.eventToCharStr(evt);
		switch(c){
		case "c":
		    flotConfig();
		    break;
		case "x":
		case "y":
		    nscale = pobj.curscale[c] !== "linear" ? "linear" : "log";
		    JS9.Plot.rescale(divjq, plot, pobj, c, nscale);
		    break;
		default:
		    break;
		}
	    });
	    // add the plot config gear
	    gim = $(`<img src='${JS9.InstallDir("images/gears.png")}'>`);
	    gim.on("click", flotConfig);
	    gdiv = $("<div class='JS9PlotGear'>");
	    gdiv.append(gim);
	    divjq.append(gdiv);
	}
	break;
    case "params":
    case "regions":
    case "textline":
        if( divid ){
	    if( JS9.allinone ){
		divid.html(s);
	    } else {
		$.ajax({
		    url: s,
		    cache: false,  // required for v3 socket.io
		    dataType: "text",
		    success: (data) => { divid.html(data); }
		});
	    }
	} else {
	    if( type === "params" ){
		winFormat = winFormat || a.paramWin;
	    } else if( type === "regions" ){
		if( JS9.globalOpts.regConfigSize === "small" ){
		    winFormat = winFormat || a.regWin0;
		} else {
		    winFormat = winFormat || a.regWin;
		}
	    } else {
		winFormat = winFormat || a.dpathWin;
	    }
	    r = JS9.allinone?"inline":"ajax";
	    did = JS9.lightWin(id, r, s, title, winFormat);
	}
	break;
    default:
	break;
    }
    return did;
};

// save image as a FITS file
JS9.Image.prototype.saveFITS = function(fname, opts){
    let arr, blob, s, sect;
    if( {}.hasOwnProperty.call(window, "saveAs") ){
	if( fname ){
	    fname = fname
		.replace(/\s+/g, "_")
		.replace(/(png|jpg|jpeg|fz)$/i, "fits");
	    if( !fname.match(/.fits$/) ){
		fname += ".fits";
	    }
	} else {
	    fname = "js9.fits";
	}
	opts = opts || {};
	if( typeof opts === "string" ){
	    try{ s = JSON.parse(opts); }
	    catch(e){ s = null; }
	    if( s ){ opts = s; }
	}
	// what do we save?
	if( opts === "display" || opts.source === "display" ){
	    // save currently displayed section
	    sect = this.rgb.sect;
	    arr = this.toArray({notab: true, twoaxes: true, sect: sect});
	} else if( opts === "virtual" || opts.source === "virtual" ){
	    if( this.raw.hdu && this.raw.hdu.fits && this.raw.hdu.fits.vfile ){
		arr = JS9.vread(this.raw.hdu.fits.vfile, "binary");
	    } else {
		JS9.error("no virtual file available to save");
	    }
	} else {
	    // save entire image: first convert to array (with two axes)
	    arr = this.toArray({notab: true, twoaxes: true});
	}
	// convert array to blob
	blob = new Blob([arr], {type: "application/octet-binary"});
	// save to disk
	JS9.saveAs(blob, fname);
    } else {
	JS9.error("no saveAs() available to save FITS file");
    }
    return fname;
};

// save image as an img file of specified type (e.g., image/png, image/jpeg)
JS9.Image.prototype.saveIMG = function(fname, type, opts){
    let key, img, ctx, canvas, width, height, quality;
    if( {}.hasOwnProperty.call(window, "saveAs") ){
	// opts can be opts object or json string or quality value
	if( typeof opts === "number" ){
	    quality = opts;
	    opts = null;
	} else if( typeof opts === "string" ){
	    if( JS9.isNumber(opts) ){
		quality = parseFloat(opts);
		opts = null;
	    } else {
		try{ opts = JSON.parse(opts); }
		catch(e){ opts = null; }
	    }
	    if( opts ){
		quality = opts.quality;
	    }
	}
	// opts is optional
	opts = opts || {};
	// filename is optional
	fname = fname || "js9.png";
	// save as specified type
	type = type || "image/png";
	// convenience params
	width = this.display.width;
	height = this.display.height;
	// create off-screen canvas, into which we write all canvases
	img = document.createElement("canvas");
	img.setAttribute("width", width);
	img.setAttribute("height", height);
	ctx = img.getContext("2d");
	// source can be image or display
	if( opts.source === "image" ){
	    // image: save RGB image for this image, which will be different
	    // from the display, e.g., when blend mode is turned on
	    ctx.putImageData(this.rgb.img, 0, 0);
	} else {
	    // display: save RGB image as seen on the display,
	    // e.g. a composite blended image
	    ctx.drawImage(this.display.canvas, 0, 0);
	}
	// add graphics layers, unless explicitly specified not to
	if( opts.layers !== false ){
	    for( key of Object.keys(this.layers) ){
		// each layer canvas
		if( this.layers[key].dlayer.dtype === "main" &&
		    this.layers[key].show ){
		    canvas = this.layers[key].dlayer.canvasjq[0];
		    ctx.drawImage(canvas, 0, 0, width, height);
		}
	    }
	}
	// sanity check on quality
	if( JS9.notNull(quality) ){
	    if( quality < 0 || quality > 1 ){
		quality = 0.95;
	    }
	}
	img.toBlob( (blob) => {
	    JS9.saveAs(blob, fname);
	}, type, quality);
    } else {
	JS9.error("no saveAs() available for saving image");
    }
    return fname;
};

// save image as a PNG file
JS9.Image.prototype.savePNG = function(fname, opts){
    fname = fname || "js9.png";
    if( !fname.match(/\.png$/) ){
	fname += ".png";
    }
    return this.saveIMG(fname, "image/png", opts);
};

// save image as a JPEG file
JS9.Image.prototype.saveJPEG = function(fname, opts){
    fname = fname || "js9.jpg";
    if( !fname.match(/\.jpg$/) && !fname.match(/\.jpeg$/)  ){
	fname += ".jpg";
    }
    return this.saveIMG(fname, "image/jpeg", opts);
};

// update (and display) pixel and wcs values (connected to info plugin)
JS9.Image.prototype.updateValpos = function(ipos, disp){
    let val, vstr, vstr1, vstr2, vstr3, val3, i, c, d, p, s;
    let cd1, cd2, v1, v2, units, sect;
    let obj = null;
    const sep1 = "\t ";
    const sep2 = "\t\t ";
    const sp = "&nbsp;&nbsp;&nbsp;&nbsp;";
    const tf = (fval) => {
	return JS9.floatFormattedString(fval, this.params.precision, 3);
    };
    const tr = (fval, length) => {
	length = length || 3;
	return fval.toFixed(length);
    };
    const ti = (ival, length) => {
        let r = "";
	let prefix = "";
	length = length || 3;
	if( ival < 0 ){
	    ival = Math.abs(ival);
	    prefix = "-";
	}
	r = r + ival;
	while (r.length < length) {
            r = `0${r}`;
	}
	return prefix + r;
    };
    // only do processing if valpos is turned on
    if( this.params.valpos ){
	// default is to display
	if( disp === undefined ){
	    disp = true;
	}
	// if a cached valpos object exists, use it
	// this is unset and reset in the mousemove callback
	if( this.valpos ){
	    if( disp ){
		this.display.displayMessage("info", this.valpos,
					   JS9.globalOpts.valposTarget);
	    }
	    return this.valpos;
	}
	// get image coordinates
	i = {x: ipos.x, y: ipos.y, sys: "image"};
	// get logical coordinates
	p = this.imageToLogicalPos(ipos);
	// get display coordinates
	d = this.imageToDisplayPos(ipos);
	d.sys = "display";
	// get pixel coordinates in current logical coordinate system;
	if( this.params.wcssys === "image" ){
	    c = i;
	} else {
	    c = p;
	}
	// get image value: here we need 0-indexed display positions,
	// so subtract the 0.5 of the image pixel
	val = this.raw.data[Math.floor(ipos.y - 0.5) * this.raw.width +
			    Math.floor(ipos.x - 0.5)];
	// fix the significant digits in the value
	switch(this.raw.bitpix){
	case 8:
	case 16:
	case -16:
	case 32:
	    val3 = ti(val);
	    break;
	case -32:
	case -64:
	    val3 = tf(val);
	    break;
	default:
	    val3 = ti(val);
	    break;
	}
	// create the valpos string
	vstr1 = val3;
	vstr2 =  `${tr(c.x, 3)} ${tr(c.y, 3)} (${c.sys})`;
	if( JS9.globalOpts.valposDCoords && c.sys === "image" ){
	    vstr2 += `${sp}${tr(d.x, 3)} ${tr(d.y, 3)} (${d.sys})`;
	}
	vstr = vstr1 + sp + vstr2;
	// object containing all information
	obj = {ix: i.x, iy: i.y, ipos: tr(i.x, 2) + sep2 + tr(i.y, 2),
	       isys: "image",
	       px: p.x, py: p.y, ppos: tr(p.x, 2) + sep2 + tr(p.y, 2),
	       psys: "physical",
	       dx: d.x, dy: d.y, dpos: tr(d.x, 2) + sep2 + tr(d.y, 2),
	       dsys: "display",
	       cx: c.x, cy: c.y, cpos: tr(c.x, 2) + sep2 + tr(c.y, 2),
	       csys: c.sys,
	       ra: "", dec: "", wcspos: "", wcssys: "",
	       racen: "", deccen: "",
	       wcsfov: "", wcspix: "",
	       val: val, val3: val3,
	       id: this.id, file: this.file, object: this.object||""};
	if( this.telescope || this.instrument ){
	    if( obj.object ){ obj.object += "  "; }
	    obj.object += "(";
	    if( this.telescope ){
		obj.object += this.telescope;
		if( this.instrument ){
		    obj.object += ", ";
		}
	    }
	    if( this.instrument ){
		obj.object += this.instrument;
	    }
	    obj.object += ")";
	}
        // Define FOV and center in terms of pixels; will be redefined
        // to WCS if WCS is available
        sect = this.rgb.sect;
	v1 = (sect.x1 - sect.x0).toFixed(0);
	v2 = (sect.y1 - sect.y0).toFixed(0);
	obj.wcsfovpix = `${v1} × ${v2} pix`;
        obj.racen = (sect.x1 + sect.x0)/2;
        obj.deccen = (sect.y1 + sect.y0)/2;
	obj.wcscen = obj.racen + sep1 + obj.deccen;

	// add wcs, if necessary
	if( this.validWCS() && JS9.isWCSSys(this.params.wcssys) ){
	    s = JS9.pix2wcs(this.raw.wcs, ipos.x, ipos.y).trim().split(/\s+/);
	    vstr3 =  `${s[0]} ${s[1]} (${s[2]||"wcs"})`;
	    vstr = vstr1 + sp + vstr3 + sp + vstr2;
	    // update object with wcs
	    obj.ra = s[0];
	    obj.dec = s[1];
	    obj.wcspos = s[0] + sep1 + s[1];
	    obj.wcssys = s[2];
	    if( this.raw.wcsinfo ){
		cd1 = Math.abs(this.raw.wcsinfo.cdelt1);
		cd2 = Math.abs(this.raw.wcsinfo.cdelt2);
		v1 = 1/60;
		if( this.raw.header.CUNIT1 ){
		    units = this.raw.header.CUNIT1;
		}
		if( !units || units.match(/^deg/i) ){
		    if( (cd1 >= 1) || (cd2 >= 1) ){
			units = "deg";
		    } else if( (cd1 >= v1) || (cd2 >= v1) ){
			units = "'";
			cd1 *= 60;
			cd2 *= 60;
		    } else {
			units = '"';
			cd1 *= 3600;
			cd2 *= 3600;
		    }
		}
		sect = this.rgb.sect;
		v1 = ((sect.x1 - sect.x0) * cd1).toFixed(0);
		v2 = ((sect.y1 - sect.y0) * cd2).toFixed(0);
		obj.wcsfov = `${v1}${units} × ${v2}${units}`;
		v1 = tr(cd1 / sect.zoom, 3);
		obj.wcspix = `${v1}${units}/pix`;
		obj.wcsfovpix = `${obj.wcsfov}  (${obj.wcspix})`;
		s = JS9.pix2wcs(this.raw.wcs,
				(sect.x1 + sect.x0)/2, (sect.y1 + sect.y0)/2)
		    .trim().split(/\s+/);
		obj.racen = s[0];
		obj.deccen = s[1];
		obj.wcscen = s[0] + sep1 + s[1];
	    }
	}
	obj.vstrsmall = vstr1 + sp + vstr2;
	obj.vstr = vstr;
	obj.vstrmedium = vstr;
	obj.vstrlarge = vstr + sp + this.file;
	if( disp ){
	    this.display.displayMessage("info", obj,
					JS9.globalOpts.valposTarget);
	}
    }
    return obj;
};

// toggle display of value/position
JS9.Image.prototype.toggleValpos = function(){
    this.params.valpos = !this.params.valpos;
    if( !this.params.valpos ){
	this.display.clearMessage();
    }
};

// get color map name
JS9.Image.prototype.getColormap = function(){
    if(  this.cmapObj ){
	return {colormap: this.cmapObj.name,
		contrast: this.params.contrast,
		bias: this.params.bias};
    }
};

// set color map
// calling sequences:
//   setColormap(name);
//   setColormap(name, contrast, bias);
//   setColormap(name, staticOpts);
//   setColormap(contrast, bias);
//   setColormap(staticOpts);
//   setColormap("rgb");
//   setColormap("invert");
//   setColormap("reset");
JS9.Image.prototype.setColormap = function(...args){
    let [arg, arg2, arg3] = args;
    let arr;
    const setCmap = (arg) => {
	if( this.cmapObj ){
	    // unset rgb mode, if necessary
	    switch(this.cmapObj.name){
	    case "red":
		if( this.display.rgb.rim === this ){
		    this.display.rgb.rim = null;
		}
		break;
	    case "green":
		if( this.display.rgb.gim === this ){
		    this.display.rgb.gim = null;
		}
		break;
	    case "blue":
		if( this.display.rgb.bim === this ){
		    this.display.rgb.bim = null;
		}
		break;
	    }
	}
	// remove previous static colormap
	delete this.staticObj;
	// add the new colormap
	this.cmapObj = JS9.lookupColormap(arg);
	this.params.colormap = this.cmapObj.name;
	// for static colormaps, copy the static object (we might edit it)
	if( this.cmapObj.type === "static" ){
	    this.staticObj = $.extend(true, {}, this.cmapObj);
	}
	// set rgb mode, if necessary
	switch(arg){
	case "red":
	    this.display.rgb.rim = this;
	    break;
	case "green":
	    this.display.rgb.gim = this;
	    break;
	case "blue":
	    this.display.rgb.bim = this;
	    break;
	default:
	    break;
	}
	// new colormap, turn off image overlay
	this.params.overlay = false;
    };
    const setContrastBias = (arg1, arg2) => {
	arg1 = parseFloat(arg1);
	if( !Number.isNaN(arg1) ){
	    this.params.contrast = arg1;
	}
	arg2 = parseFloat(arg2);
	if( !Number.isNaN(arg2) ){
	    this.params.bias = arg2;
	}
    };
    const setStatic = (a) => {
	let i, j, color, dval;
	for(i=0; i<a.length; i++){
	    if( !$.isArray(a[i]) || typeof a[i][0] !== "string" ){ continue; }
	    for(j=0; j<this.staticObj.colors.length; j++){
		color = this.staticObj.colors[j];
		if( a[i][0] === color.name ){
		    switch(a[i].length){
		    case 2:
			if( a[i][1] === false || a[i][1] === "false" ){
			    // active
			    color.active = false;
			} else if( a[i][1] === true || a[i][1] === "true" ){
			    // active
			    color.active = true;
			} else {
			    // alpha
			    dval = parseFloat(a[i][1]);
			    if( dval > 0 && dval <= 1 ){
				dval = dval * 255;
			    }
			    color.alpha = dval;
			}
			break;
		    case 3:
			// min and max
			color.min = parseFloat(a[i][1]);
			if( Number.isNaN(color.min) ){
			    color.min = -Infinity;
			}
			color.max = parseFloat(a[i][2]);
			if( Number.isNaN(color.max) ){
			    color.max = Infinity;
			}
			break;
		    default:
			break;
		    }
		    break;
		}
	    }
	}
	// new colormap, turn off image overlay
	this.params.overlay = false;
    }
    // is this core service disabled?
    // (only if the colormap has been set at least once!)
    if( $.inArray("colormap", this.params.disable) >= 0 && this.cmapObj ){
	return;
    }
    switch(args.length){
    case 1:
	switch(arg){
	case "rgb":
	    this.display.rgb.active = !this.display.rgb.active;
	    break;
	case "overlay":
	    if( this.offscreen ){
		this.params.overlay = !this.params.overlay;
	    }
	    break;
	case "invert":
	    this.params.invert = !this.params.invert;
	    break;
	case "reset":
	    this.params.invert = JS9.imageOpts.invert;
	    this.params.contrast = JS9.imageOpts.contrast;
	    this.params.bias = JS9.imageOpts.bias;
	    break;
	default:
	    if( this.cmapObj && this.cmapObj.type === "static" ){
		if( $.isArray(arg) ){
		    setStatic(arg);
		} else if( typeof arg === "string" && arg.charAt(0) === '[' ){
		    try{
			arr = JSON.parse(arg);
			setStatic(arr);
		    }
		    catch(e){
			JS9.error(`can't parse JSON in setColormap: ${arg}`, e);
		    }
		} else {
		    setCmap(arg);
		}
	    } else if( typeof arg === "string" ){
		setCmap(arg);
	    }
	    break;
	}
	break;
    case 2:
	if( JS9.isNumber(arg) && JS9.isNumber(arg2) ){
	    setContrastBias(arg, arg2);
	} else if( this.cmapObj && this.cmapObj.type === "static" ){
	    setCmap(arg);
	    setStatic(arg2);
	}
	break;
    case 3:
	setCmap(arg);
	setContrastBias(arg2, arg3);
	break;
    default:
	break;
    }
    this.displayImage("colors");
    // hack: delete filterRGBImage from stash to avoid restore during reproject
    this.xeqStashDiscard("filterRGBImage");
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetcolormap");
    }
    return this;
};

// get scale factor
JS9.Image.prototype.getScale = function(){
    if( this.params.scale ){
	return {scale: this.params.scale,
		scalemin: this.params.scalemin,
		scalemax: this.params.scalemax,
	        scaleclipping: this.params.scaleclipping};
    }
};

// set scale factor
JS9.Image.prototype.setScale = function(...args){
    let [s0, s1, s2] = args;
    const newscale = (s) => {
	if( JS9.scales.includes(s) ){
	    this.params.scale = s;
	} else if( s === "dataminmax" ){
	    this.params.scaleclipping = "dataminmax";
	    this.params.scalemin = this.raw.dmin;
	    this.params.scalemax = this.raw.dmax;
	} else if( s === "zscale" ){
	    if( (this.params.z1 === undefined) ||
		(this.params.z2 === undefined) ){
		this.zscale(false);
	    }
	    this.params.scaleclipping = "zscale";
	    this.params.scalemin = this.params.z1;
	    this.params.scalemax = this.params.z2;
	} else if( s === "zmax" ){
	    if( (this.params.z1 === undefined) ){
		this.zscale(false);
	    }
	    this.params.scaleclipping = "zmax";
	    this.params.scalemin = this.params.z1;
	    this.params.scalemax = this.raw.dmax;
	} else if( s === "user" ){
	    this.params.scaleclipping = "user";
	} else {
	    JS9.error(`unknown scale: ${s}`);
	}
    };
    // is this core service disabled?
    if( $.inArray("scale", this.params.disable) >= 0 ){
	return;
    }
    if( args.length ){
	switch(args.length){
	case 1:
	    newscale(s0);
	    break;
	case 2:
	    this.params.scalemin = parseFloat(s0);
	    this.params.scalemax = parseFloat(s1);
	    this.params.scaleclipping = "user";
	    break;
        default:
	    newscale(s0);
	    if( (s0 !== "zscale") && (s0 !== "zmax") ){
		this.params.scalemin = parseFloat(s1);
		this.params.scalemax = parseFloat(s2);
		this.params.scaleclipping = "user";
	    }
	    break;
	}
	this.params.precision =
	    JS9.floatPrecision(this.params.scalemin, this.params.scalemax);
	this.displayImage("colors");
    }
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetscale");
    }
    return this;
};

// get opacity factor
JS9.Image.prototype.getOpacity = function(){
    let obj = {};
    if( JS9.notNull(this.params.opacity) ){
	obj.opacity = this.params.opacity;
    } else {
	obj.opacity = 1;
    }
    if( JS9.notNull(this.params.flooropacity) ){
	obj.flooropacity = this.params.flooropacity;
	obj.floorvalue = this.params.floorvalue;
    }
    return obj;
};

// set opacity factor:
// set default opacity for all pixels
//   setOpacity(0.9)
// set opacity floor: for pixel values <= 1st arg assign 2nd arg as opacity
//   setOpacity(5, 0.2)
// set default opacity, for pixel values <= 2nd arg, assign 3rd arg as opacity
//   setOpacity(0.9, 5, 0.2)
// reset default opacity to 1
//   setOpacity("reset")
// remove opacity floor
//   setOpacity("resetfloor")
// reset default opacity to 1, remove opacity floor
//   setOpacity("resetall")
JS9.Image.prototype.setOpacity = function(...args){
    let [a1, a2, a3] = args;
    // is this core service disabled?
    if( $.inArray("opacity", this.params.disable) >= 0 ){
	return;
    }
    if( args.length ){
	switch(args.length){
	case 1:
	    if( typeof a1 === "string" ){
		if( a1.toLowerCase() === "reset" ){
		    this.params.opacity = 1;
		} else if( a1.toLowerCase() === "resetfloor" ){
		    delete this.params.floorvalue;
		    delete this.params.flooropacity;
		} else if( a1.toLowerCase() === "resetall" ){
		    this.params.opacity = 1;
		    delete this.params.floorvalue;
		    delete this.params.flooropacity;
		}
	    } else if( JS9.isNumber(a1) ){
		this.params.opacity = parseFloat(a1);
	    }
	    break;
	case 2:
	    if( JS9.isNumber(a1) && JS9.isNumber(a2) ){
		this.params.floorvalue = parseFloat(a1);
		this.params.flooropacity = parseFloat(a2);
	    }
	    break;
	case 3:
	    if( JS9.isNumber(a1) ){
		this.params.opacity = parseFloat(a1);
	    }
	    if( JS9.isNumber(a2) && JS9.isNumber(a3) ){
		this.params.floorvalue = parseFloat(a2);
		this.params.flooropacity = parseFloat(a3);
	    }
	    break;
        default:
	    break;
	}
	// if we just set opacity (not reset), it must mean we want to use it,
	// so turn off opacity masking, if necessary
	if(  typeof a1 === "number" ||
	    (typeof a1 === "string" && !a1.match(/reset/)) ){
	    if( this.mask.active && this.mask.im ){
		this.mask.active = false;
	    }
	}
	this.displayImage("colors");
    }
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onsetopacity");
    }
    return this;
};

// get an image param value
JS9.Image.prototype.getParam = function(param){
    // sanity check
    if( !param ){ return null; }
    // return param object
    if( param === "all" ){
	return this.params;
    }
    // return value
    return this.params[param];
};

// set an image param value
JS9.Image.prototype.setParam = function(param, value){
    let i, idx, ovalue, obj;
    const getval = (s) => {
	if( s === "true" ){
	    return true;
	}
	if( s === "false" ){
	    return false;
	}
	if( !JS9.isNumber(s) ){
	    return s;
	}
	return parseFloat(s);
    };
    // sanity check
    if( !param ){ return null; }
    // convert strings to values
    value = getval(value);
    // merge in new params
    if( param === "all" && typeof value === "object" ){
	$.extend(true, this.params, value);
	// call core methods as needed
	if( value.colormap || value.contrast || value.bias ){
	    obj = this.getColormap();
	    value.colormap = value.colormap || obj.colormap;
	    value.contrast = value.contrast || obj.contrast;
	    value.bias = value.bias || obj.bias;
	    this.setColormap(value.colormap, value.contrast, value.bias);
	}
	if( value.scale || value.scalemin || value.scalemax ){
	    obj = this.getScale();
	    value.scale = value.scale || obj.scale;
	    value.scalemin = value.scalemin || obj.scalemin;
	    value.scalemax = value.scalemax || obj.scalemax;
	    this.setScale(value.scale, value.scalemin, value.scalemax);
	}
	if( value.flip ){
	    this.setFlip("reset");
	    this.setFlip(value.flip);
	}
	if( value.rot90 ){
	    this.setRot90("reset");
	    this.setRot90(value.rot90);
	}
	if( value.rotate ){
	    this.setRotate("reset");
	    this.setRotate(value.rotate);
	}
	if( value.invert ){
	    this.params.invert = value.invert;
	    this.displayImage("colors");
	}
	if( value.zoom ){
	    this.setZoom(value.zoom);
	}
	if( value.wcssys ){
	    this.setWCSSys(value.wcssys);
	}
	if( value.wcsunits ){
	    this.setWCSUnits(value.wcsunits);
	}
	return this.params;
    } else if( param === "disable" ){
	if( !$.isArray(value) ){
	    value = [value];
	}
	for(i=0; i<value.length; i++){
	    idx = $.inArray(value[i], this.params.disable);
	    if( idx < 0 ){
		this.params.disable.push(value[i]);
	    }
	}
	return this.params.disable;
    } else if( param === "enable" ){
	if( !$.isArray(value) ){
	    value = [value];
	}
	for(i=0; i<value.length; i++){
	    idx = $.inArray(value[i], this.params.disable);
	    if( idx >= 0 ){
		this.params.disable.splice(idx, 1);
	    }
	}
	return this.params.disable;
    }
    // save old value
    ovalue = this.params[param];
    // set new value
    this.params[param] = value;
    // call core methods as needed
    switch(param){
    case "colormap":
	this.setColormap(value);
	break;
    case "invert":
	this.displayImage("colors");
	break;
    case "contrast":
	obj = this.getColormap();
	this.setColormap(obj.colormap, value, obj.bias);
	break;
    case "bias":
	obj = this.getColormap();
	this.setColormap(obj.colormap, obj.contrast, value);
	break;
    case "overlay":
	this.displayImage("colors");
	break;
    case "flip":
	this.setFlip("reset");
	this.setFlip(value);
	break;
    case "rot90":
	this.setRot90("reset");
	this.setRot90(value);
	break;
    case "rotate":
	this.setRotate("reset");
	this.setRotate(value);
	break;
    case "scale":
	this.setScale(value);
	break;
    case "scalemin":
	obj = this.getScale();
	this.setScale("user", value, obj.scalemax);
	break;
    case "scalemax":
	obj = this.getScale();
	this.setScale("user", obj.scalemin, value);
	break;
    case "scaleclipping":
	obj = this.getScale();
	this.setScale(value, obj.scalemin, obj.scalemax);
	break;
    case "wcssys":
	this.setWCSSys(value);
	break;
    case "wcsunits":
	this.setWCSUnits(value);
	break;
    case "zoom":
	this.setZoom(value);
	break;
    }
    // return old value
    return ovalue;
};

// copy params from one image to another
JS9.Image.prototype.copyParams = function(params, images, opts){
    let i, j, im, param, val;
    let xims = [];
    // sanity check
    if( !params ){ return; }
    // opts is optional
    opts = opts || {};
    if( typeof params === "string" && params.charAt(0) === '[' ){
	try{ params = JSON.parse(params); }
	catch(e){ JS9.error(`can't parse JSON in copyParams: ${params}`, e); }
    }
    if( !$.isArray(params) ){ params = [params]; }
    // do regions first to avoid problems with changes to the current image
    i = $.inArray("regions", params);
    if( i >= 0 ){
	params.splice(i, 1);
	params.unshift("regions");
    }
    // default is all images
    images = images || JS9.images;
    if( typeof images === "string" && images.charAt(0) === '[' ){
	try{ images = JSON.parse(images); }
	catch(e){ JS9.error(`can't parse JSON in copyParams: ${images}`, e); }
    }
    if( !$.isArray(images) ){ images = [images]; }
    // for each image
    for(i=0; i<images.length; i++){
	im = images[i];
	// im can be an image handle or image id
	if( typeof im === "string" ){
	    im = JS9.lookupImage(im);
	    if( !im ){
		JS9.error(`unknown image for copyParams`);
	    }
	}
	// but don't do myself
	if( im === this ){
	    continue;
	}
	// save the currently displayed image
	if( im !== im.display.image ){
	    if( $.inArray(im.display.image, xims) < 0 ){
		xims.push(im.display.image);
	    }
	}
	try{
	    // set each param
	    for(j=0; j<params.length; j++){
		param = params[j];
		switch(param){
		case "alignment":
		    im.alignPanZoom(this);
		    break;
		case "contrastbias":
		    val = this.getParam("contrast");
		    im.setParam("contrast", val);
		    val = this.getParam("bias");
		    im.setParam("bias", val);
		    break;
		case "pan":
		    val = this.getPan();
		    im.setPan(JS9.pix2pix(this, im, {x: val.ox, y: val.oy}));
		    break;
		case "regions":
		    this.copyRegions(im);
		    break;
		case "shapes":
		    if( opts.layer ){
			this.copyShapes(opts.layer, im);
		    }
		    break;
		case "wcs":
		    val = this.getParam("wcssys");
		    im.setParam("wcssys", val);
		    val = this.getParam("wcsunits");
		    im.setParam("wcsunits", val);
		    break;
		default:
		    val = this.getParam(param);
		    im.setParam(param, val);
		    break;
		}
	    }
	} catch(e){
	    JS9.error(`could not copy params for ${im.id}`);
	}
	finally{
	    // re-display image(s),  necessary
	    if( xims.length ){
		for(i=0; i<xims.length; i++){
		    xims[i].displayImage();
		}
	    }
	}
    }
};

// get status
JS9.Image.prototype.getStatus = function(status){
    if( JS9.isNull(status) || typeof status !== "string" ){
	return undefined;
    }
    switch(status.toLowerCase()){
    case "close":
	return this.status.close;
    case "displaysection":
    case "displayextension":
	return this.status.displaySection;
    case "createmosaic":
	return this.status.createMosaic;
    case "load":
    case "preload":
	// if the fetch is still running or failed, return the status
	if( JS9.fetchURL.status ){
	    return JS9.fetchURL.status;
	}
	return this.status.load;
    case "loadcatalog":
	return this.status.loadCatalog;
    case "loadcolormap":
	return this.status.loadColormap;
    case "loadproxy":
	return this.status.loadProxy;
    case "loadregions":
	return this.status.loadRegions;
    case "loadsession":
	return this.status.loadSession;
    case "reproject":
    case "reprojectdata":
    case "rotate":
    case "rotatedata":
	return this.status.reprojectData;
    case "runanalysis":
	return this.status.runAnalysis;
    case "separate":
	return this.status.separate;
    case "uploadfitsfile":
	return this.status.uploadFITSFile;
    default:
	return undefined;
    }
};

// set status
JS9.Image.prototype.setStatus = function(id, status){
    if( JS9.notNull(id) && JS9.notNull(status) ){
	switch(status){
	case "error":
	case "complete":
	    delete this.status.cur;
	    break;
	default:
	    this.status.cur = id;
	    break;
	}
    }
    this.status[id] = status;
};

// re-calculate data min and max (and set scale params, if necessary)
//
// Important note 7/10/2020:
// Chrome was taking either 35ms ... or 7+ seconds to find the min/max on a
// 2048x2048 int image (casa.fits in js9debug.html). The slowdown was random.
// We optimized the loop in this way:
//   1. assign data[i] to val instead of accessing data[i] more than once
//   2. use direct min/max compare instead of Math.min() and Math.max
//   3. use local params instead of this.raw, this.params, this.raw.data
// These changes appear to have helped but the underlying cause is unknown.
JS9.Image.prototype.dataminmax = function(dmin, dmax){
    let i, raw, params, data, val, blankval, reminscale, remaxscale;
    // convenience variables
    raw = this.raw;
    params = this.params;
    data = this.raw.data;
    // rescale?
    reminscale = Number.isNaN(params.scalemin) || !Number.isFinite(params.scalemin) || JS9.isNull(params.scalemin);
    remaxscale = Number.isNaN(params.scalemax) || !Number.isFinite(params.scalemax) || JS9.isNull(params.scalemax);
    // might have to redo scaling if it's tied to current data min or max
    if( params.scaleclipping === "dataminmax" ){
	if( (raw.dmin === params.scalemin) || JS9.isNull(raw.dmin) ){
	    reminscale = true;
	}
	if( (raw.dmax === params.scalemax) || JS9.isNull(raw.dmax) ){
	    remaxscale = true;
	}
    }
    // used supplied values, if possible
    if( JS9.notNull(dmin) && JS9.notNull(dmax) ){
	raw.dmin = dmin;
	raw.dmax = dmax;
    } else {
	// re-calculate data min and max values
	raw.dmin = Number.MAX_VALUE;
	raw.dmax = Number.MIN_VALUE;
	// get data min and max, ignoring type-dependent blank values
	if( raw.bitpix > 0 ){
	    // integer data: BLANK header value specifies data value to ignore
	    if( raw.header.BLANK !== undefined ){
		blankval = raw.header.BLANK;
		for(i=0; i<data.length; i++){
		    val = data[i];
		    if( val !== blankval ){
			if( val < raw.dmin ){ raw.dmin = val; }
			if( val > raw.dmax ){ raw.dmax = val; }
		    }
		}
	    } else {
		for(i=0; i<data.length; i++){
		    val = data[i];
		    if( val < raw.dmin ){ raw.dmin = val; }
		    if( val > raw.dmax ){ raw.dmax = val; }
		}
	    }
	} else {
	    // float data: ignore NaN, infinity
	    for(i=0; i<data.length; i++){
		val = data[i];
		if( !Number.isNaN(val) && Number.isFinite(val) ){
		    if( val < raw.dmin ){ raw.dmin = val; }
		    if( val > raw.dmax ){ raw.dmax = val; }
		}
	    }
	}
    }
    // re-set scaling values, if necessary
    if( reminscale ){ params.scalemin = raw.dmin; }
    if( remaxscale ){ params.scalemax = raw.dmax; }
    // set new precision
    params.precision = JS9.floatPrecision(params.scalemin, params.scalemax);
    // allow chaining
    return this;
};

// the zscale calculation
JS9.Image.prototype.zscale = function(setvals){
    let s, rawdata, bufsize, buf, vals;
    // sanity check
    if( !JS9.zscale || !this.raw || !this.raw.data ){ return this; }
    rawdata = this.raw.data;
    // allocate space for the image in the emscripten heap
    bufsize = rawdata.length * rawdata.BYTES_PER_ELEMENT;
    try{ buf = JS9.vmalloc(bufsize); }
    catch(e){ JS9.error(`image too large for zscale malloc: ${bufsize}`, e); }
    // copy the raw image data to the heap
    // try{ JS9.vheap.set(new Uint8Array(rawdata.buffer), buf); }
    try{ JS9.vmemcpy(new Uint8Array(rawdata.buffer), buf); }
    catch(e){ JS9.error(`can't copy image to zscale heap: ${bufsize}`, e); }
    // call the zscale routine
    s = JS9.zscale(buf,
		   this.raw.width,
		   this.raw.height,
		   this.raw.bitpix,
		   this.params.zscalecontrast,
		   this.params.zscalesamples,
		   this.params.zscaleline);
    // free emscripten heap space
    JS9.vfree(buf);
    // clean up return values
    vals = s.trim().split(/\s+/);
    // save z1 and z2
    this.params.z1 = parseFloat(vals[0]);
    this.params.z2 = parseFloat(vals[1]);
    // make z1 and z2 the scale clip values, if necessary
    if( setvals === "zmax" ){
	this.params.scalemin = this.params.z1;
	this.params.scalemax = this.raw.dmax;
    } else if( setvals ){
	this.params.scalemin = this.params.z1;
	this.params.scalemax = this.params.z2;
    }
    this.params.precision =
	JS9.floatPrecision(this.params.scalemin, this.params.scalemax);
    // allow chaining
    return this;
};

// background-subtracted counts in regions
// eslint-disable-next-line no-unused-vars
JS9.Image.prototype.countsInRegions = function(...args){
    let i, s, vfile, bvfile, sect, ext, filter, bin, opts, cmdswitches;
    let sregions = "field";
    let bregions = "";
    const getreg = (arg, def) => {
	let ii, rarr, reg, narg;
	const regrexp= /(annulus|box|circle|ellipse|line|polygon|point|text) *\(/;
	// if we have no region, we're done
	if( !arg ){
	    return def;
	}
	if( typeof arg === "string" ){
	    narg = this.expandMacro(arg);
	    // if we have no region, we're done
	    if( !narg ){
		return def;
	    }
	    // if its a known region, we're done
	    if( narg.match(regrexp) ){
		return narg;
	    }
	}
	// look for a region specifier
	rarr = this.getShapes("regions", arg);
	// no region are returned: this is an error
	if( !rarr || !rarr.length ){
	    JS9.error(`no regions found: ${arg}`);
	}
	// compose a region string from the returned regions
	narg = "";
	for(ii=0; ii<rarr.length; ii++){
	    reg = rarr[ii];
	    if( this.params.wcssys ){
		// put wcs sys at the start
		if( !narg ){
		    narg = reg.wcssys || "";
		}
		// add wcs region string
		narg += `; ${reg.wcsstr}`;
	    } else {
		// put image sys at the start
		if( !narg ){
		    narg = reg.imsys || "";
		}
		// add image region string
		narg += `; ${reg.imstr}`;
	    }
	}
	return narg || def;
    };
    // sanity check
    if( !this.raw.hdu || !this.raw.hdu.fits || !this.raw.hdu.fits.vfile ){
	JS9.error(`no virtual file available for regcnts: ${this.id}`);
    }
    // convert json to an object
    for(i=0; i<args.length; i++){
	s = args[i];
	if( typeof s === "string" && s.charAt(0) === '{' ){
	    try{ args[i] = JSON.parse(s); }
	    catch(e){ JS9.error(`can't parse JSON arg in regcnts: ${s}`, e); }
	}
    }
    // analyze args
    switch(args.length){
    case 0:
	break;
    case 1:
	if( typeof args[0] === "object" ){
	    opts = args[0];
	} else {
	    sregions = getreg(args[0], "field");
	}
	break;
    case 2:
	sregions = getreg(args[0], "field");
	if( typeof args[1] === "object" ){
	    opts = args[1];
	} else {
	    bregions = getreg(args[1], "");
	}
	break;
    default:
	sregions = getreg(args[0], "field");
	bregions = getreg(args[1], "");
	opts = args[2];
	break;
    }
    // opts is optional
    opts = opts || {};
    // reduce can be taken from the global value
    opts.reduce = opts.reduce || JS9.globalOpts.reduceRegcnts;
    // same for reduction dims
    opts.dim = opts.dim ||
	Math.max(JS9.globalOpts.image.xdim, JS9.globalOpts.image.ydim);
    // check for command switches
    cmdswitches = opts.cmdswitches || "";
    // get final file, including filters and extensions
    vfile = this.raw.hdu.fits.vfile;
    ext =  this.file.match(/\[.*\]/);
    if( ext ){
	vfile += ext;
    }
    if( this.imtab === "table" ){
	filter = this.raw.hdu.table.filter;
	if( filter && !vfile.match(filter) ){
	    if( vfile.match(/\]\[/) ){
		vfile = `${vfile.slice(0, -1)}&&${filter}]`;
	    } else {
		vfile += `[${filter}]`;
	    }
	}
    } else if( this.raw.header.NAXIS === 3 &&
	       cmdswitches.search(/(^| )-c/) < 0 ){
	cmdswitches += ` -c ${this.raw.hdu.slice || 1}`;
    }
    // reduce file size, if necessary and possible
    if( opts.reduce && !this.parentFile && this.raw.header.NAXIS < 3 ){
	const {xdim, ydim} = this.fileDimensions();
	bin = Math.floor((Math.max(xdim, ydim) / opts.dim) + 0.5);
	if( bin > 1 ){
	    if( this.imtab === "table" ){
		// for tables, regcnts has a -b switch
		cmdswitches += ` -b ${bin}`;
	    } else {
		// for images, make a temporary binned file
		bvfile = `bin${bin}_${vfile.split("/").reverse()[0]}`;
		sect = `0@0,0@0,${bin}`;
		JS9.imsection(vfile, bvfile, sect, "");
		vfile = bvfile;
	    }
	}
    }
    // could take a while ...
    JS9.waiting(true, this.display);
    // call low-level regcnts
    s = JS9.regcnts(vfile, sregions, bregions, cmdswitches);
    // all done waiting
    JS9.waiting(false);
    // remove binned file, if necessary
    if( bvfile ){
	JS9.vunlink(bvfile);
    }
    // check for regions or cfitio errors
    if( s.match(/^ERROR/) || s.match(/FITSIO status/) ){
	JS9.error(s);
    }
    // display in a lightwin, if necessary
    if( opts.lightwin ){
	// display counts in a light window
	this.displayAnalysis("text", s, {divid: JS9.globalOpts.analysisDiv});
    }
    // return results, including errors
    return s;
};

// radial profile plot
// eslint-disable-next-line no-unused-vars
JS9.Image.prototype.radialProfile = function(...args){
    let i, s, xlabel, ylabel, obj, cobj, pobj, res, el, opts;
    let color, errorbars, errorcolor;
    const carr = [];
    const swobj = {cmdswitches: "-G -j -r"};
    // make up arg list, add required radial profile switches to opts
    for(i=0; i<args.length; i++){
	if( typeof args[i] === "object" ){
	    // integrate our switches into passed opts
	    cobj = $.extend(true, {}, args[i], swobj);
	    carr.push(cobj);
	    opts = cobj;
	} else {
	    carr.push(args[i]);
	}
    }
    // if no opts supplied, add the switches manually
    if( !cobj ){
	carr.push(swobj);
    }
    // opts is optional
    opts = opts || {};
    // call regcnts routine
    s = this.countsInRegions(...carr);
    // need a json string in return
    if( s ){
	try{ obj = JSON.parse(s); }
	catch(e){ JS9.error("can't parse regcnts JSON", e); }
    }
    if( !obj || !obj.columnUnits || !obj.columnUnits.radii ){
	JS9.error("no radii available for radial profile");
    }
    // get plot labels
    xlabel = obj.columnUnits.radii;
    ylabel = obj.columnUnits.surfBrightness;
    // get plot colors
    color = opts.color || "green";
    errorcolor = opts.errorcolor || "red";
    if( JS9.isNull(opts.errorbars) || opts.errorbars ){
	errorbars = "y";
    } else {
	errorbars = "n";
    }
    // init plot object
    pobj = {color: sprintf("%s", color), label : sprintf("surface brightness(%s) vs. radius(%s)", ylabel, xlabel), points:{"errorbars" : sprintf("%s", errorbars), "yerr" : {"show" : "true", "color" : sprintf("%s", errorcolor)}}, data: []};
    // add data values
    for(i=0; i<obj.backgroundSubtractedResults.length; i++){
	res = obj.backgroundSubtractedResults[i];
	if( res.radius2 === "undefined" ||
	    res.radius2 === "NA"        ||
	    res.radius1 > res.radius2   ){
	    JS9.error("radial profile source region must be an annulus");
	}
	el = [(res.radius1 + res.radius2)/2, res.surfBrightness, res.surfError];
	pobj.data.push(el);
    }
    // display results
    return this.displayAnalysis("plot", pobj,
				{divid: JS9.globalOpts.analysisDiv});
};

// plot of a 3D cube a region
// eslint-disable-next-line no-unused-vars
JS9.Image.prototype.plot3d = function(src, bkg, opts){
    let i, j, s, arr, jobj, el, pobj, color, mode, divid, xlabel, ylabel;
    let index3, xoff, xdelt;
    const counts=[];
    if( !this.raw.header || this.raw.header.NAXIS !== 3 ){
	JS9.error("plot3d requires a data cube with 3 dimensions");
    }
    // opts is optional
    opts = $.extend(true, {}, opts, JS9.globalOpts.plot3d);
    // slice
    opts.cube = opts.cube || "*:*:all";
    // make sure 'all' is specified
    arr = opts.cube.split(":");
    for(i=0; i<arr.length; i++){
	if( arr[i] === "all" ){
	    index3 = i+1;
	    break;
	}
    }
    if( !index3 ){
	JS9.error("plot3d requires specification of cube's third index");
    }
    // but these regcnts command switches are not
    opts.cmdswitches = `-j -c ${opts.cube}`;
    // average or sum?
    mode =  opts.mode || "avg";
    // for avg: what sort of area (pixels or arcsec)?
    if( !opts.areaunits ){
	opts.areaunits = "pixels";
	opts.cmdswitches += " -p";
    } else if( opts.areaunits.match(/^p/) ){
	opts.areaunits = "pixels";
	opts.cmdswitches += " -p";
    } else if( opts.areaunits.match(/^a/) ){
	opts.areaunits = "arcsec";
    } else {
	opts.areaunits = "pixels";
	opts.cmdswitches += " -p";
    }
    // plot colors
    color = opts.color || "green";
    // get counts in regions for all slices in the cube
    s = this.countsInRegions(src, bkg, opts);
    // convert to json format
    if( s ){
	try{ jobj = JSON.parse(s); }
	catch(e){ JS9.error(`can't parse regcnts results: ${s}`, e); }
    }
    if( !jobj ){
	JS9.error("no regcnts info available for plot3d");
    }
    // init plot object
    s = this.raw.header[`CTYPE${String(index3)}`];
    if( s ){
	xlabel = s.toLowerCase();
    } else {
	xlabel = "slice";
    }
    if( mode === "avg" ){
	if( opts.areaunits === "pixels"){
	    ylabel = "counts/pixel**2";
	} else {
	    ylabel = "counts/arcsec**2";
	}
    } else {
	ylabel = "summed counts";
    }
    pobj = {color: sprintf("%s", color), label : sprintf("%s vs %s ", ylabel, xlabel), data: []};
    // offset for 3rd dimension
    xoff = this.raw.header[`CRVAL${String(index3)}`]  || 0;
    xdelt = this.raw.header[`CDELT${String(index3)}`] || 1;
    // get bkgd-subtracted counts in each slice
    for(i=0; i<jobj.source.cubeSlices; i++){
        s = `backgroundSubtractedResults${String(i+1)}`;
	counts[i] = 0;
	for(j=0; j<jobj[s].length; j++){
	    if( mode === "avg" ){
		counts[i] += jobj[s][j].surfBrightness;
	    } else {
		counts[i] += jobj[s][j].netCounts;
	    }
	}
	el = [(i * xdelt) + xoff, counts[i]];
	pobj.data.push(el);
    }
    // which div?
    divid = opts.divid || JS9.globalOpts.analysisDiv;
    // display results
    return this.displayAnalysis("plot", pobj, {divid});
};

// make (or select) a raw data layer
// calling sequences:
//   im.rawDataLayer(obj, func) -- editing existing or create new raw data layer
// where obj can contain:
//    rawid: id of new raw data (default: "alt")
//    oraw: id of raw data to pass to func or "current" (default: "raw0")
//    from: string describing origin of this raw data (def: "func")
// or:
//   im.rawDataLayer(id, func) -- editing existing or create new raw data layer
// or:
//   im.rawDataLayer(id) -- switch to existing raw data later with specified id
// or:
//   im.rawDataLayer(id, "remove") -- remove raw data later with specified id
// or:
//   im.rawDataLayer() -- return name of the current layer
JS9.Image.prototype.rawDataLayer = function(...args){
    let i, j, id, mode, raw, oraw, nraw, rawid, cur, nlen, carr, im;
    let [opts, func] = args;
    // no arg => return name of current raw
    if( !args.length ){
	return this.raw.id;
    }
    // opts is optional
    opts = opts || {};
    // opts is a string with second arg a func: generate opts object
    // opts is a string, no func: switch to a different raw data layer
    // opts is a string + "remove": remove specified layer
    if( typeof opts === "string" ){
	if( typeof func === "function" ){
	    // change: rawDataLayer(id, func) to rawDataLater(obj, func)
	    opts = {rawid: opts};
	} else {
	    id = opts;
	    mode = func;
	    // look for raw layer with the specified id
	    for(i=0; i<this.raws.length; i++){
		raw = this.raws[i];
		// are we deleting this raw layer?
		if( id === raw.id ){
		    if( mode === "remove" ){
			if( id === JS9.RAWID0 ){
			    JS9.error("can't remove primary (raw0) data layer");
			}
			// delete vfile associated with this layer?
			if( raw.hdu && raw.hdu.fits ){
			    carr = JS9.lookupVfile(raw.hdu.fits.vfile);
			    if( carr.length <= 1 ){
				JS9.cleanupFITSFile(raw, true);
			    }
			}
			// default is to go back to original raw data
			this.raw = this.raws[0];
			// but go back to origin of this layer if necessary
			if( raw.current0 && raw.current0.id ){
			    // look for origin
			    for(j=0; j<this.raws.length; j++){
				if( raw.current0.id === this.raws[j].id ){
				    // found it!
				    this.raw = this.raws[j];
				    break;
				}
			    }
			}
			// remove stash calls for this id from other images
			for(j=0; j<JS9.images.length; j++){
			    im = JS9.images[j];
			    if( im && im.xeqstash ){
				im.xeqStashDiscard(id);
			    }
			}
			// remove layer
			this.raws.splice(i, 1);
		    } else {
			// switch to new raw layer
			this.raw = raw;
		    }
		    // configure the current raw layer
		    if( this.raw.header.BITPIX ){
			this.raw.bitpix = this.raw.header.BITPIX;
		    }
		    // reset imtab
		    this.imtab = this.raw.imtab || this.imtab;
		    // set data min and max, ensuring a rescale
		    this.params.scalemin = undefined;
		    this.params.scalemax = undefined;
		    this.dataminmax();
		    // reset section
		    this.mkSection();
		    // reinit coordinate transforms
		    this.initWCS();
		    this.initLCS();
		    // redisplay using these data
		    this.displayImage("all");
		    // refresh layers
		    this.refreshLayers();
		    // extended plugins
		    if( JS9.globalOpts.extendedPlugins ){
			this.xeqPlugins("image", "onrawdatalayer");
		    }
		    return true;
		}
	    }
	    // did not find the specified layer
	    return false;
	}
    }
    // otherwise, sanity check if we are going to change data
    if( typeof func !== "function" ){ return false; }
    // but the id is not
    rawid = opts.rawid || JS9.RAWIDX;
    // which of the "old" raws do we pass to func?
    if( opts.oraw === undefined ){
	opts.oraw = "current0";
    }
    if( opts.oraw === "current" ){
	// use currently active raw
	oraw = this.raw;
    } else if( opts.oraw === "current0" ){
	// current0: use original current data for this layer
	// iff this layer is the same as current active layer
	if( this.raw.id === rawid ){
	    oraw = this.raw.current0;
	} else {
	    // otherwise, use currently active raw layer
	    oraw = this.raw;
	}
    } else {
	// look for oraw matching 'oraw' property
	for(i=0; i<this.raws.length; i++){
	    raw = this.raws[i];
	    if( opts.oraw === raw.id ){
		oraw = raw;
		break;
	    }
	}
    }
    // if all else fails: use initial (raw0)
    if( !oraw ){
	oraw = this.raws[0];
    }
    // look for existing nraw by id
    cur = -1;
    for(i=0; i<this.raws.length; i++){
	if( rawid === this.raws[i].id ){
	    nraw = this.raws[i];
	    cur = i;
	    break;
	}
    }
    // if we don't have an existing nraw, make a copy from oraw
    if( (cur < 0) || opts.alwaysCopy ){
	// make copy
	nraw = $.extend(true, {}, oraw);
	// save current for next time
	nraw.current0 = oraw;
	// but ensure data is a copy, not a pointer to the original!
	if( opts.bitpix ){
	    // different bitpix from oraw specified?
	    switch(opts.bitpix){
	    case 8:
		nraw.data = new Uint8Array(oraw.height * oraw.width);
		break;
	    case 16:
		nraw.data = new Int16Array(oraw.height * oraw.width);
		break;
	    case -16:
		nraw.data = new Uint16Array(oraw.height * oraw.width);
		break;
	    case 32:
		nraw.data = new Int32Array(oraw.height * oraw.width);
		break;
	    case -32:
		nraw.data = new Float32Array(oraw.height * oraw.width);
		break;
	    case -64:
		nraw.data = new Float64Array(oraw.height * oraw.width);
		break;
	    default:
		JS9.error(`unsupported bitpix: ${opts.bitpix}`);
		break;
	    }
	    // copy data and convert data type
	    nlen = nraw.width * nraw.height;
	    for(i=0; i<nlen; i++){
		nraw.data[i] = oraw.data[i];
	    }
	    nraw.bitpix = opts.bitpix;
	} else {
	    switch(oraw.bitpix){
	    case 8:
		nraw.data = new Uint8Array(oraw.data);
		break;
	    case 16:
		nraw.data = new Int16Array(oraw.data);
		break;
	    case -16:
		nraw.data = new Uint16Array(oraw.data);
		break;
	    case 32:
		nraw.data = new Int32Array(oraw.data);
		break;
	    case -32:
		nraw.data = new Float32Array(oraw.data);
		break;
	    case -64:
		nraw.data = new Float64Array(oraw.data);
		break;
	    default:
		JS9.error(`unsupported bitpix: ${oraw.bitpix}`);
		break;
	    }
	}
	// set id for copy
	nraw.id = rawid;
	// where did this raw data come from?
	nraw.from = opts.from || nraw.from || "func";
    }
    // call the func to fill in the nraw data
    if( func.call(this, oraw, nraw, opts) ){
	// replace existing nraw with new version
	if( cur >= 0 ){
	    this.raws[cur] = nraw;
	} else {
	    this.raws.push(nraw);
	}
	// assign this nraw to the high-level raw data object
	this.raw = nraw;
	// renew bitpix, if necessary
	if( this.raw.header.bitpix ){
	    this.raw.bitpix = this.raw.header.bitpix;
	}
	// re-calculate min and max, if necesary
	if( opts.dataminmax !== false ){
	    this.dataminmax();
	}
	// re-init coordinate systems, if necessary
	if( opts.updatewcs ){
	    // init WCS, if possible
	    this.initWCS();
	    // init the logical coordinate system, if possible
	    this.initLCS();
	}
	// reset pan, if necessary
	if( opts.resetpan ){
	    this.setPan();
	}
	// refresh shape layers
	this.refreshLayers();
	// redisplay using these data
	this.displayImage("all", opts);
	// redo flip and rot
	this.reFlipRot();
    }
    return true;
};

// perform a gaussian blur on the raw data
// creates a new raw data layer ("gaussBlur")
JS9.Image.prototype.gaussBlurData = function(sigma, opts){
    if( sigma === undefined ){
	JS9.error("missing sigma value for gaussBlurData");
    }
    // save value
    this.params.sigma = sigma;
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse gaussBlur opts: ${opts}`, e); }
    }
    // the blurred image will be floating point
    if( this.raw.bitpix === -64 ){
	opts.bitpix = -64;
    } else {
	opts.bitpix = -32;
    }
    // use origin of current
    opts.oraw = "current0";
    // nraw should be a floating point copy of oraw
    opts.alwaysCopy = true;
    // new layer
    opts.rawid = opts.rawid || "gaussBlur";
    // pass the options
    opts.sigma = sigma;
    // save this routine so it can be reconstituted in a restored session
    this.xeqStashSave("gaussBlurData", [sigma], opts.rawid);
    // call routine to generate (or modify) the new layer
    this.rawDataLayer(opts, (oraw, nraw) => {
	let tdata;
	// nraw contains a floating point copy of oraw
	// make a temporary copy of nraw data for calculations
	switch(nraw.bitpix){
	case -32:
	    tdata = new Float32Array(nraw.data);
	    break;
	case -64:
	    tdata = new Float64Array(nraw.data);
	    break;
	default:
	    JS9.error(`invalid temp bitpix for gaussBlur: ${nraw.bitpix}`);
	    break;
	}
	// the heart of the matter!
	gaussBlur(tdata, nraw.data, nraw.width, nraw.height, sigma);
	return true;
    });
    // allow chaining
    return this;
};

// perform arithmetic operations on the raw data
// creates a new raw data layer ("imarith")
JS9.Image.prototype.imarithData = function(...args){
    let im;
    let [op, arg1, opts] = args;
    // no args means return the available ops
    if( !args.length ){
	return ["add", "sub", "mul", "div", "min", "max", "reset"];
    }
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse imarith opts: ${opts}`, e); }
    }
    opts.rawid = opts.rawid || "imarith";
    // special case: reset by deleting the layer
    if( (op === "reset") || (op === "remove") ){
	this.rawDataLayer(opts.rawid, "remove");
	return;
    }
    // sanity check
    if( op === undefined || arg1 === undefined ){
	JS9.error("missing arg(s) for image arithmetic");
    }
    // save this routine so it can be reconstituted in a restored session
    this.xeqStashSave("imarithData", args.slice(), opts.rawid);
    // operation: add, sub, mul, div ...
    switch(op){
    case "add":
    case "sub":
    case "mul":
    case "div":
    case "min":
    case "max":
	opts.op = op;
	break;
    default:
	JS9.error(`invalid operator for image arithmetic: ${op}`);
	break;
    }
    // arg1: can be an image object or a numeric value
    if( typeof arg1 === "object" ){
	if( (this.raw.width  !== arg1.raw.width)  ||
	    (this.raw.height !== arg1.raw.height) ){
	    JS9.error("images must be the same size for image arithmetic");
	}
	opts.argtype = "image";
	opts.argval = arg1;
    } else if( JS9.isNumber(arg1) ){
	opts.argtype = "value";
	opts.argval = arg1;
    } else {
	// lookup the image by name
	im = JS9.lookupImage(arg1);
	if( !im ){
	    JS9.error(`imarith arg1 must be an image or a constant: ${arg1}`);
	}
	opts.argval = im;
	opts.argtype = "image";
    }
    // check for invalid args
    if( (opts.op === "div") &&
	(opts.argtype === "value") && (opts.argval === 0) ){
	JS9.error("imarith can't divide by zero (nor can anyone else)");
    }
    // choose a decent bitpix
    if( !opts.bitpix ){
	switch(opts.argtype){
	case "image":
	    if( (this.raw.bitpix > 0) && (opts.argval.raw.bitpix > 0) ){
		opts.bitpix = Math.max(this.raw.bitpix, opts.argval.raw.bitpix);
	    } else if( (this.raw.bitpix < 0) && (opts.argval.raw.bitpix < 0) ){
		opts.bitpix = Math.min(this.raw.bitpix, opts.argval.raw.bitpix);
	    } else if( (this.raw.bitpix < 0) && (opts.argval.raw.bitpix > 0) ){
		opts.bitpix = this.raw.bitpix;
	    } else {
		opts.bitpix = opts.argval.raw.bitpix;
	    }
	    break;
	case "value":
	    if( this.raw.bitpix === -64 ){
		opts.bitpix = -64;
	    } else {
		opts.bitpix = -32;
	    }
	    break;
	}
    }
    // nraw should be a opts.bitpix copy of oraw
    opts.alwaysCopy = true;
    // use current
    opts.oraw = "current";
    // call routine to generate (or modify) the new layer
    this.rawDataLayer(opts, (oraw, nraw, opts) => {
	let i, val;
	switch(opts.argtype){
	case "image":
	    val = opts.argval.raw.data;
	    switch(opts.op){
	    case "add":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] += val[i];
		}
		break;
	    case "sub":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] -= val[i];
		}
		break;
	    case "mul":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] *= val[i];
		}
		break;
	    case "div":
		for(i=0; i<nraw.data.length; i++){
		    if( val[i] === 0 ){
			nraw.data[i] = 0;
		    } else {
			nraw.data[i] /= val[i];
		    }
		}
		break;
	    case "min":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] = Math.min(nraw.data[i], val[i]);
		}
		break;
	    case "max":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] = Math.max(nraw.data[i], val[i]);
		}
		break;
	    default:
		JS9.error(`unknown operation for imarith: ${opts.op}`);
		break;
	    }
	    break;
	case "value":
	    val = opts.argval;
	    switch(opts.op){
	    case "add":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] += val;
		}
		break;
	    case "sub":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] -= val;
		}
		break;
	    case "mul":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] *= val;
		}
		break;
	    case "div":
		for(i=0; i<nraw.data.length; i++){
		    if( val === 0 ){
			nraw.data[i] = 0;
		    } else {
			nraw.data[i] /= val;
		    }
		}
		break;
	    case "min":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] = Math.min(nraw.data[i], val);
		}
		break;
	    case "max":
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] = Math.max(nraw.data[i], val);
		}
		break;
	    default:
		JS9.error(`unknown op for imarith: ${opts.op}`);
		break;
	    }
	    break;
	default:
	    JS9.error(`unknown arg type for imarith: ${opts.argtype}`);
	    break;
	}
	return true;
    });
    // allow chaining
    return this;
};

// linear shift of raw data (cheap alignment for CFA MicroObservatory)
// creates a new raw data layer ("shift")
JS9.Image.prototype.shiftData = function(...args){
    let [x, y, opts] = args;
    if( x === undefined || y === undefined ){
	JS9.error("missing translation value(s) for shiftData");
    }
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse shift opts: ${opts}`, e); }
    }
    opts.rawid = opts.rawid || "shift";
    opts.x = parseFloat(x);
    opts.y = parseFloat(y);
    // save this routine so it can be reconstituted in a restored session
    this.xeqStashSave("shiftData", args.slice(), opts.rawid);
    this.rawDataLayer(opts, (oraw, nraw, opts) => {
	let i, oi, oj, ni, nj, nlen, oU8, nU8, ooff, noff, blankval;
	const bpp = oraw.data.BYTES_PER_ELEMENT;
	if( nraw.xoff === undefined ){
	    nraw.xoff = 0;
	}
	if( nraw.yoff === undefined ){
	    nraw.yoff = 0;
	}
	nraw.xoff += opts.x;
	nraw.yoff += opts.y;
	if( !opts.fill || opts.fill === "clear" ){
	    if( nraw.bitpix > 0 ){
		blankval = opts.blank || nraw.header.BLANK || 0;
		nraw.header.BLANK = blankval;
	    } else {
		blankval = NaN;
	    }
	    if( typeof nraw.data.fill === "function" ){
		nraw.data.fill(blankval);
	    } else {
		for(i=0; i<nraw.data.length; i++){
		    nraw.data[i] = blankval;
		}
	    }
	}
	for(oj=0; oj<oraw.height; oj++){
	    nj = oj + nraw.yoff;
	    if( (nj < 0) || (nj >= oraw.height) ){
		continue;
	    }
	    oi = 0;
	    ni = oi + nraw.xoff;
	    nlen = oraw.width;
	    if( ni < 0 ){
		oi -= ni;
		nlen += ni;
		ni = 0;
	    }
	    if( (ni + nlen) > oraw.width ){
		nlen -= (ni + nlen) - oraw.width;
	    }
	    if( nlen <= 0 ){
		return false;
	    }
	    ooff = (oj * oraw.width + oi) * bpp;
	    oU8 = new Uint8Array(oraw.data.buffer, ooff, nlen * bpp);
	    noff = (nj * oraw.width + ni) * bpp;
	    nU8 = new Uint8Array(nraw.data.buffer, noff, nlen * bpp);
	    nU8.set(oU8);
	}
	return true;
    });
    // allow chaining
    return this;
};

// rotate image by changing WCS info and calling reprojectData
// creates a new raw data layer ("rotate")
// angle is in degrees (since CROTA2 is in degrees)
JS9.Image.prototype.rotateData = function(...args){
    let raw, oheader, nheader, arad, sinrot, cosrot, pos, arr;
    let ocdelt1 = 0.0;
    let ocdelt2 = 0.0;
    let [angle, opts] = args;
    // sanity checks
    if( !this.raws || !this.raws[0] ){
	JS9.error("no raw data for reprojection");
    }
    // go back to original data for reprojection
    raw = this.raws[0];
    if( !raw.header || !raw.wcsinfo ){
	JS9.error("no WCS info available for reprojection");
    }
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse rotate opts: ${opts}`, e); }
    }
    // save stash name
    opts.stash = "rotateData";
    // but make sure we can set the id
    opts.rawid = "rotate";
    // rotate raw data
    opts.oraw = JS9.RAWID0;
    // maintain current section, unless specified otherwise
    if( opts.resetSection !== true ){
	opts.resetSection = false;
    }
    // old and new header
    oheader = raw.header;
    nheader = $.extend(true, {}, oheader);
    // rotate around current center or file center (i.e., CRPIX1,2)
    opts.center = opts.center || JS9.globalOpts.rotationCenter;
    if( opts.center !== "file" && this.validWCS() ){
	pos = this.getPan();
	arr = JS9.pix2wcs(this.raw.wcs, pos.x, pos.y).trim().split(/\s+/);
	if( arr && arr.length > 1 ){
	    nheader.CRPIX1 = pos.x;
	    nheader.CRPIX2 = pos.y;
	    nheader.CRVAL1 = JS9.saostrtod(arr[0]);
	    if( JS9.isHMS(this.params.wcssys) ){
		nheader.CRVAL1 *= 15.0;
	    }
	    nheader.CRVAL2 = JS9.saostrtod(arr[1]);
	}
    }
    // normalized values from wcslib
    if( raw.wcsinfo ){
	ocdelt1 = raw.wcsinfo.cdelt1 || 0;
	ocdelt2 = raw.wcsinfo.cdelt2 || 0;
    }
    // string directives instead of a numeric angle
    if( typeof angle === "string" ){
	switch(angle.toLowerCase()){
	case "northisup":
	case "northup":
	    angle = 0;
	    if( ocdelt1 > 0 ){ ocdelt1 = -ocdelt1; }
	    if( ocdelt2 < 0 ){ ocdelt2 = -ocdelt2; }
	    break;
	default:
	    angle = parseInt(angle, 10);
	    break;
	}
    }
    // new header same as old, but with a changed angle
    // make up new WCS keywords
    // use CD matrix if possible, else set CROTA2
    if( JS9.notNull(oheader.CD1_1)  ){
	arad = -(angle * Math.PI / 180.0);
	sinrot = Math.sin(arad);
	cosrot = Math.cos(arad);
	nheader.CD1_1 =  oheader.CD1_1 * cosrot  + oheader.CD1_2 * sinrot;
	nheader.CD1_2 =  oheader.CD1_1 * -sinrot + oheader.CD1_2 * cosrot;
	nheader.CD2_1 =  oheader.CD2_1 * cosrot  + oheader.CD2_2 * sinrot;
	nheader.CD2_2 =  oheader.CD2_1 * -sinrot + oheader.CD2_2 * cosrot;
    } else {
	nheader.CROTA2 = angle;
	nheader.CDELT1 = ocdelt1;
	nheader.CDELT2 = ocdelt2;
    }
    // flag that we will use CROTA2 to modify LTM matrix
    // needed because Montage does not know about LTM
    opts.lcsUseRota2 = true;
    // save ptype if possible
    if( raw.wcsinfo ){
	nheader.ptype = raw.wcsinfo.ptype;
    }
    // save this routine so it can be reconstituted in a restored session
    this.xeqStashSave("rotateData", args.slice(), opts.rawid);
    // rotate by reprojecting the data
    return this.reprojectData(nheader, opts);
};

// low-level reprojection: creates reprojected file, but does not display it
// instead, it returns the name of the reprojected FITS file (emscripten vfile)
// this is the basis for reprojectData, but can be used in other routines which
// require a reprojection
JS9.Image.prototype.reproject = function(wcsim, opts){
    let awvfile, awvfile2, wvfile, owvfile;
    let wcsheader, wcsstr, oheader, nheader, theader;
    let arr, ivfile, ovfile, rstr, key;
    let tab, tx1, tx2, ty1, ty2, s;
    let n, raw, avfile, earr, cmdswitches;
    let i, tid, traw, maxx, maxy, maxpix;
    let rcomplete = false;
    const twcs = {};
    const wcsexp = /SIMPLE|BITPIX|NAXIS|NAXIS[1-4]|AMDX|AMDY|CD[1-2]_[1-2]|CDELT[1-4]|CNPIX[1-4]|CO1_[1-9][0-9]|CO2_[1-9][0-9]|CROTA[1-4]|CRPIX[1-4]|CRVAL[1-4]|CTYPE[1-4]|CUNIT[1-4]|DATE|DATE_OBS|DC-FLAG|DEC|DETSEC|DETSIZE|EPOCH|EQUINOX|EQUINOX[a-z]|IMAGEH|IMAGEW|LATPOLE|LONGPOLE|MJD-OBS|PC00[1-4]00[1-4]|PC[1-4]_[1-4]|PIXSCALE|PIXSCAL[1-2]|PLTDECH|PLTDECM|PLTDECS|PLTDECSN|PLTRAH|PLTRAM|PLTRAS|PPO|PROJP[1-9]|PROJR0|PV[1-3]_[1-3]|PV[1-4]_[1-4]|RA|RADECSYS|SECPIX|SECPIX|SECPIX[1-2]|UT|UTMID|VELOCITY|VSOURCE|WCSAXES|WCSDEP|WCSDIM|WCSNAME|XPIXSIZE|YPIXSIZE|ZSOURCE|LTM|LTV/;
    const ptypeexp = /TAN|SIN|ZEA|STG|ARC/;
    const addwcsinfo = (header, wcsinfo) => {
	let theader;
	if( !wcsinfo ){ return header; }
	theader = $.extend(true, {}, header);
	if( JS9.isNull(theader.CRVAL1) && !JS9.isNull(wcsinfo.crval1) ){
	    theader.CRVAL1 = wcsinfo.crval1;
	}
	if( JS9.isNull(theader.CRVAL2) && !JS9.isNull(wcsinfo.crval2) ){
	    theader.CRVAL2 = wcsinfo.crval2;
	}
	if( JS9.isNull(theader.CRPIX1) && !JS9.isNull(wcsinfo.crpix1) ){
	    theader.CRPIX1 = wcsinfo.crpix1;
	}
	if( JS9.isNull(theader.CRPIX2) && !JS9.isNull(wcsinfo.crpix2) ){
	    theader.CRPIX2 = wcsinfo.crpix2;
	}
	if( JS9.isNull(theader.CDELT1) && !JS9.isNull(wcsinfo.cdelt1) ){
	    theader.CDELT1 = wcsinfo.cdelt1;
	}
	if( JS9.isNull(theader.CDELT2) && !JS9.isNull(wcsinfo.cdelt2) ){
	    theader.CDELT2 = wcsinfo.cdelt2;
	}
	if( JS9.isNull(theader.CROTA2) && !JS9.isNull(wcsinfo.crot) ){
	    theader.CROTA2 = wcsinfo.crot;
	}
	return theader;
    };
    // sanity checks
    if( !JS9.reproject || !wcsim || this === wcsim ){ return; }
    if( !this.raws || !this.raws[0] ){
	JS9.error("no raw data for reprojection");
    }
    // go back to original data for reprojection
    raw = this.raws[0];
    if( !raw.header || !raw.wcsinfo ){
	JS9.error("no WCS info available for reprojection");
    }
    // opts is optional
    opts = opts || {};
    // make copy of input header, removing wcs keywords
    oheader = $.extend(true, {}, raw.header);
    for( key of Object.keys(oheader) ){
	if( wcsexp.test(key) ){
	    delete oheader[key];
	}
    }
    if( typeof wcsim === "object" ){
	// get wcs keywords from new header
	if( wcsim.raw && wcsim.raw.header ){
	    nheader = wcsim.raw.header;
	} else if( wcsim.BITPIX && wcsim.NAXIS1 && wcsim.NAXIS2 ){
	    // assume its a WCS header
	    nheader = wcsim;
	} else {
	    JS9.error("invalid wcs object input to reproject()");
	}
	for( key of Object.keys(nheader) ){
	    if( wcsexp.test(key) ){
		twcs[key] = nheader[key];
	    }
	}
	// combine new wcs keywords + old header keywords
	wcsheader = $.extend(true, {}, twcs, oheader);
	// sanity check on result
	if( !wcsheader.NAXIS || !wcsheader.NAXIS1 || !wcsheader.NAXIS2 ){
	    // JS9.error("invalid FITS image header");
	    return;
	}
	// restrict size of reprojection
	wcsheader.NAXIS1 = Math.min(wcsheader.NAXIS1,
				    JS9.globalOpts.image.xdim);
	wcsheader.NAXIS2 = Math.min(wcsheader.NAXIS2,
				    JS9.globalOpts.image.ydim);
	// convert reprojection header to a string
	wcsstr = JS9.raw2FITS(wcsheader, {addcr: true});
	// create vfile text file containing reprojection WCS
	wvfile = `wcs_${JS9.uniqueID()}.txt`;
	JS9.vfile(wvfile, wcsstr);
	// check limits on reprojection, if necessary
	if( JS9.globalOpts.reprojectLimits ){
	    // reprojection limits
	    maxx = JS9.globalOpts.image.xdim;
	    maxy = JS9.globalOpts.image.ydim;
	    // check max image dimension
	    maxpix = JS9.globalOpts.image.xdim * JS9.globalOpts.image.ydim;
	    // keep within the limits of current memory constraints, or die
	    if( (raw.header.NAXIS1 * raw.header.NAXIS2) > maxpix ){
		JS9.error(`the max reproject size is ${maxx} * ${maxy}. You can use the Bin/Filter/Section plugin to extract a section, then save it as FITS and reproject the smaller image.`);
	    }
	}
    } else {
	wvfile = wcsim;
    }
    // check input and reproj WCS to make sure we can run fast mProjectPP
    // if not, try to make an alternate WCS header amenable to mProjectPP
    try{
	// try to change input WCS to a sys usable by mProjectPP
	if( !ptypeexp.test(raw.wcsinfo.ptype) ){
	    theader = addwcsinfo(raw.header, raw.wcsinfo);
	    owvfile = `owcs_${JS9.uniqueID()}.txt`;
	    JS9.vfile(owvfile, JS9.raw2FITS(theader, {addcr: true}));
	    awvfile = `awcs_${JS9.uniqueID()}.txt`;
	    rstr = JS9.tanhdr(owvfile, awvfile, "");
	    if( JS9.DEBUG > 1 ){
		JS9.log("tanhdr (input): %s %s -> %s",
			owvfile, awvfile, rstr);
	    }
	    JS9.vunlink(owvfile);
	    if( rstr.search(/\[struct stat="OK"/) >= 0 ){
		// add command switch to use this alternate wcs
		opts.cmdswitches = opts.cmdswitches || "";
		opts.cmdswitches += ` -i ${awvfile}`;
	    }
	}
	// try to change reproject WCS to a sys usable by mProjectPP
	if( (wcsim.raw && !ptypeexp.test(wcsim.raw.wcsinfo.ptype)) ||
	    (wcsim.ptype && !ptypeexp.test(wcsim.ptype))           ){
	    theader = addwcsinfo(nheader, wcsim.raw.wcsinfo);
	    owvfile = `owcs_${JS9.uniqueID()}.txt`;
	    JS9.vfile(owvfile, JS9.raw2FITS(theader, {addcr: true}));
	    awvfile2 = `awcs_${JS9.uniqueID()}.txt`;
	    rstr = JS9.tanhdr(owvfile, awvfile2, "");
	    if( JS9.DEBUG > 1 ){
		JS9.log("tanhdr (reproj): %s %s -> %s",
			owvfile, awvfile2, rstr);
	    }
	    JS9.vunlink(owvfile);
	    if( rstr.search(/\[struct stat="OK"/) >= 0 ){
		// delete old wcs file and use this alternate wcsfile
		JS9.vunlink(wvfile);
		wvfile = awvfile2;
	    }
	}
    }
    catch(ignore){ /* empty */ }
    // get reference to existing raw data file (or create one)
    if( raw.hdu && raw.hdu.fits.vfile ){
	// input file name
	ivfile = raw.hdu.fits.vfile;
	// add extension name or number
	if( raw.hdu.fits.extname ){
	    ivfile += `[${raw.hdu.fits.extname}]`;
	} else if( raw.hdu.fits.extnum &&
		   (raw.hdu.fits.extnum > 0) ){
	    ivfile += `[${raw.hdu.fits.extnum}]`;
	}
    } else {
	// input file name
	arr = this.toArray();
	ivfile = this.id.replace(/\.png$/, "_png" +  ".fits");
	JS9.vfile(ivfile, arr);
    }
    // output file name
    s = this.id
	.replace(/\[.*\]/, "")
	.replace(/\.png$/i, ".fits")
	.replace(/\.fz$/i, "")
	.replace(/\.gz$/i, "");
    ovfile = `reproj_${JS9.uniqueID()}_${s}`;
    // remove previous vfile for this reprojection layer, if possible
    tid = opts.rawid || "reproject";
    for(i=0; i<this.raws.length; i++){
	traw = this.raws[i];
	if( traw.id === tid ){
	    if( JS9.cleanupFITSFile(traw, true) ){
		break;
	    }
	}
    }
    // for tables, we probably have to bin it by adding a bin specification
    // also need to pass the HDU name. For now, "EVENTS" is all we know ...
    if( raw.hdu && raw.hdu.imtab === "table" && raw.hdu.table ){
	if( !ivfile.match(/\[bin /) ){
	    if( !ivfile.match(/\[EVENTS\]/) ){
		ivfile += "[EVENTS]";
	    }
	    tab = raw.hdu.table;
	    tx1 = Math.floor(tab.xcen - (tab.xdim/2) + 1);
	    tx2 = Math.floor(tab.xcen + (tab.xdim/2));
	    ty1 = Math.floor(tab.ycen - (tab.ydim/2) + 1);
	    ty2 = Math.floor(tab.ycen + (tab.ydim/2));
	    ivfile += `[bin X=${tx1}:${tx2},Y=${ty1}:${ty2}]`;
	}
    }
    // call the reproject routine
    try{
	// name of (unneeded) area file
	n = ovfile.lastIndexOf(".");
	if( n >= 0 ){
	    avfile = `${ovfile.substring(0, n)}_area${ovfile.substring(n)}`;
	}
	// optional command line args
	cmdswitches = opts.cmdswitches || "";
	// no area file, but add global switches for reproject processing
	cmdswitches += ` -a 0 ${JS9.globalOpts.reprojSwitches}`;
	// call reproject
	rstr = JS9.reproject(ivfile, ovfile, wvfile, cmdswitches);
	if( JS9.DEBUG > 1 ){
	    JS9.log("reproject: %s %s %s [%s] -> %s",
		    ivfile, ovfile, wvfile, cmdswitches, rstr);
	}
	// delete unneeded files ...
	JS9.vunlink(avfile);
	JS9.vunlink(wvfile);
	if( awvfile ){
	    JS9.vunlink(awvfile);
	}
	if( arr ){
	    JS9.vunlink(ivfile);
	}
	// ... then error check
	if( rstr.search(/\[struct stat="OK"/) < 0 ){
	    // signal this we completed the reproject attempt
	    rcomplete = true;
	    earr = rstr.match(/msg="(.*)"/);
	    if( earr && earr[1] ){
		JS9.error(`${earr[1]} (from mProjectPP)`);
	    } else {
		JS9.error(rstr);
	    }
	}
    }
    catch(e){
	// avoid double error reporting
	if( !rcomplete ){
	    // delete unneeded files ...
	    JS9.vunlink(avfile);
	    JS9.vunlink(wvfile);
	    // call error handler
	    if( rstr ){
		JS9.error(rstr);
	    } else {
		JS9.error("WCS reproject failed", e);
	    }
	} else {
	    return;
	}
    }
    // return output file name
    return ovfile;
};

// high-level routine to reproject image using WCS info
// creates a new raw data layer ("reproject")
JS9.Image.prototype.reprojectData = function(...args){
    let i, im, ovfile;
    let [wcsim, opts] = args;
    // sanity check
    if( !wcsim || !JS9.reproject ){ return; }
    // is this a string containing an image name or WCS values?
    if( typeof wcsim === "string" ){
	if( wcsim === "all" ){
	    for(i=0; i<JS9.images.length; i++){
		im = JS9.images[i];
		if( this.display.id === im.display.id ){
		    im.reprojectData(this);
		}
	    }
	    return;
	}
	im = JS9.getImage(wcsim);
	if( im ){
	    // it was an image name, so change wcsim to the image handle
	    wcsim = im;
	} else {
	    JS9.error(`unknown WCS for reproject: ${wcsim}`);
	}
    }
    // don't reproject myself (useful in supermenu support, "all" reprojections)
    if( this === wcsim ){
	return;
    }
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse reproject opts: ${opts}`, e); }
    }
    // save this routine so it can be reconstituted in a restored session
    // (unless another xxxData routine is calling us)
    if( !opts.rawid ){
	this.xeqStashSave("reprojectData", args.slice(), "reproject");
    }
    // save stash name
    if( !opts.stash ){
	opts.stash = "reprojectData";
    }
    // could take a while ...
    JS9.waiting(true, this.display);
    // set status
    this.setStatus("reprojectData", "processing");
    // ... start a timeout to allow the wait spinner to get started
    window.setTimeout(() => {
	let topts, reprojHandler;
	const defaultReprojHandler = (hdu) => {
	    // plugin callbacks
	    this.xeqPlugins("image", "onreprojectdata");
	    topts = topts || {};
	    topts.refreshRegions = true;
	    // reset section, unless specified otherwise
	    if( opts.resetSection !== false ){
		topts.resetSection = true;
	    }
	    // pass on the lcs flag
	    if( opts.lcsUseRota2 ){
		topts.lcsUseRota2 = true;
	    }
	    // refresh the image
	    this.refreshImage(hdu, topts);
	    // set status
	    this.setStatus("reprojectData", "complete");
	    // might have to re-execute calls in the stash
	    this.xeqStashCall(this.xeqstash, [opts.stash, "reprojectData"]);
	    // execute onreproject function
	    if( typeof opts.onreproject === "function" ){
		try{ JS9.xeqByName(opts.onreproject, window, this); }
		catch(e){ JS9.error("in onreproject callback", e, false); }
	    }
	};
	// opts is optional
	opts = opts || {};
	// handler
	reprojHandler = opts.reprojHandler || defaultReprojHandler;
	// call the low-level reproject routine, returning reprojected file
	ovfile = this.reproject(wcsim, opts);
	if( ovfile ){
	    // refresh image using the reprojected file ...
	    topts = $.extend(true, {}, JS9.fits.options, opts);
	    // ... in a new raw data layer
	    topts.rawid = topts.rawid || "reproject";
	    // save pointer to original wcs image
	    if( wcsim.raw && wcsim.raw.header ){
		topts.wcsim = wcsim;
	    }
	    // process the FITS file
	    try{ JS9.handleFITSFile(ovfile, topts, reprojHandler); }
	    catch(e){ JS9.error("can't process reprojected FITS file", e); }
	}
    }, JS9.SPINOUT);
    // allow chaining
    return this;
};

// apply image processing filters to the current RGB image
JS9.Image.prototype.filterRGBImage = function(...args){
    let [filter] = args;
    // no arg: return list of filters
    if( !filter ){
	return Object.keys(JS9.ImageFilters);
    }
    // pre-processing and special processing
    switch(filter){
    case "reset":
	// special case: reset to original RGB data, contrast/bias
	this.setColormap("reset");
	return this;
    case "median":
	// alias used in filters plugin
	filter = "medianFilter";
	break;
    case "edge":
	// alias used in filters plugin
	filter = "edgeDetect";
	break;
    default:
	break;
    }
    // sanity check
    if( !JS9.ImageFilters[filter] ){
	JS9.error(`JS9 image filter '${filter}' not available`);
    }
    // save this routine so it can be reconstituted in a restored session
    this.xeqStashSave("filterRGBImage", args.slice());
    // remove filter name arg
    args.shift();
    // add display context and RGB img arg
    args.unshift(this.display.context, this.rgb.img);
    // try to run the filter to generate a new RGB image
    try{ JS9.ImageFilters[filter](...args); }
    catch(e){ JS9.error(`JS9 image filter '${filter}' failed`, e); }
    // display new RGB image
    this.displayImage("display");
    // extended plugins
    if( JS9.globalOpts.extendedPlugins ){
	this.xeqPlugins("image", "onfilterrgbimage");
    }
    // allow chaining
    return this;
};

// move image to a different display
// maybe this should be refactored using more useful routines ...
// ... and should (some of) this code be in the Fabric section??
JS9.Image.prototype.moveToDisplay = function(dname){
    let i, im, key, layer, dlayer;
    let got = 0;
    const odisplay = this.display;
    const ndisplay = JS9.lookupDisplay(dname);
    // sanity check
    if( !dname || !ndisplay ){
	JS9.error(`could not find display: ${dname}`);
    }
    // clear old display first
    this.display.clearMessage();
    this.display.context.clear();
    // plugin callbacks
    this.xeqPlugins("image", "onimageclear");
    // make sure the main layers in the old display are in the new display
    for( key of Object.keys(odisplay.layers) ){
	if( (odisplay.layers[key].dtype === "main") &&
	    !ndisplay.layers[key] ){
	    ndisplay.newShapeLayer(key, odisplay.layers[key].opts);
	}
    }
    // turn off display of layers in new display
    // don't want them showing on the new image ...
    if( ndisplay.image ){
	for( key of Object.keys(ndisplay.layers) ){
	    if( ndisplay.layers[key].dtype === "main" ){
		ndisplay.image.showShapeLayer(key, false, {local: true});
	    }
	}
    }
    // re-assign each "main" layer from old display to new by:
    // saving the graphics, reassigning the canvas, restoring the graphics
    for( key of Object.keys(this.layers) ){
	layer = this.layers[key];
	dlayer = ndisplay.layers[key];
	if( dlayer ){
	    this.showShapeLayer(key, false, {local: true});
            layer.dlayer = dlayer;
            layer.divjq = dlayer.divjq;
            layer.canvasjq = dlayer.canvasjq;
            layer.canvas = dlayer.canvas;
	} else {
	    delete this.layers[key];
	}
    }
    // move "main" display from old to new
    this.display = ndisplay;
    // avoid erroneous save of previous layers
    this.display.image = this;
    // reset section to ensure proper display size
    this.mkSection();
    // and redisplay
    this.displayImage("all");
    // show shape layers in new display
    for( key of Object.keys(this.layers) ){
	this.showShapeLayer(key, true, {local: true});
    }
    // move rgb contribution, if necessary
    if( odisplay.rgb.rim === this ){
	odisplay.rgb.rim = null;
	ndisplay.rgb.rim = this;
    }
    if( odisplay.rgb.gim === this ){
	odisplay.rgb.gim = null;
	ndisplay.rgb.gim = this;
    }
    if( odisplay.rgb.bim === this ){
	odisplay.rgb.bim = null;
	ndisplay.rgb.bim = this;
    }
    // old display has no image
    odisplay.image = null;
    // ensure proper positions for graphics
    this.refreshLayers();
    // display a different image in old display, if possible
    for(i=0; i<JS9.images.length; i++){
	im = JS9.images[i];
	if( odisplay === im.display ){
	    // avoid erroneous save of previous layers
	    im.display.image = null;
	    im.displayImage("all");
	    // ensure proper positions for graphics
	    im.refreshLayers();
	    // flag we found an image
	    got++;
	    break;
	}
    }
    // if display is in a lightwin and there are no other images, close it
    if( !got && odisplay.winid && odisplay.winid.close ){
	i = $.inArray(odisplay, JS9.displays);
	if( i >= 0 ){
	    JS9.displays.splice(i, 1);
	}
	odisplay.winid.close();
    }
    // allow chaining
    return this;
};

// save session to a json file
// NB: save is an image method, load is a display method
JS9.Image.prototype.saveSession = function(file, opts){
    let i, obj, str, blob, layer, dlayer, tobj, key, im, lpos, ipos;
    const saveim = (im) => {
	let regexp;
	// object holding session keys
	const obj = {};
	// filename
	if( window.electron ){
	    // remove current directory to make it relative
	    // this allows the session file (and data files) to be moved
	    // to a machine with a different directory structure, and
	    // also allows web and desktop sessions to be shared
	    regexp = new RegExp(`^${window.electron.currentDir}/`);
	    obj.file = im.file.replace(regexp, "");
	} else {
	    obj.file = im.file;
	}
	// display size info
	obj.dwidth = im.display.width;
	obj.dheight = im.display.height;
	// image params
	obj.params = $.extend(true, {}, im.params);
	// temp values: explicitly save some of them
	obj.tmp = {};
	if( im.tmp.gridStatus === "active" ){
	    obj.tmp.gridStatus = "active";
	}
	// get center of displayed image in physical coords
	lpos = im.imageToLogicalPos({x:im.rgb.sect.xcen,
				       y:im.rgb.sect.ycen});
	ipos = im.maybePhysicalToImage(lpos);
	if( ipos ){
	    lpos = ipos;
	}
	// save section info
	obj.sect = {};
	obj.sect.xcen = lpos.x;
	obj.sect.ycen = lpos.y;
	obj.sect.xdim = im.raw.width;
	obj.sect.ydim = im.raw.height;
	obj.sect.zoom = im.rgb.sect.zoom;
	// layers
	obj.layers = [];
	for( key of Object.keys(im.layers) ){
	    // save each main layer so it can be reconstituted
	    layer = im.layers[key];
	    dlayer = layer.dlayer;
	    // only save layers on main display
	    // don't save crosshair or grid
	    if( dlayer.dtype === "main" &&
		key !== "crosshair"     &&
		key !== "grid"          ){
		tobj = {};
		tobj.name = key;
		tobj.json = dlayer.canvas.toJSON(dlayer.el);
		tobj.dopts = $.extend(true, {}, dlayer.opts);
		if( layer.catalog ){
		    tobj.catalog = layer.catalog;
		}
		if( layer.starbase ){
		    tobj.starbase = JSON.stringify(layer.starbase);
		}
		obj.layers.push(tobj);
	    }
	    dlayer.canvas.forEachObject((obj) => {
		// look for winid's: they cause circular json errors
		if( obj.params && obj.params.winid ){
		    if( $(obj.params.winid).is(":visible") ){
			JS9.error("please close your region dialog box(es) to avoid a JSON circular reference error when saving this session");
		    } else {
			obj.params.winid = null;
		    }
		}
	    });
	}
	// save blend state
	obj.blend = im.blend;
	// save routines which must be executed when restoring session
	obj.xeqstash = im.xeqstash;
	// save wcsim reference, if necessary
	if( im.wcsim && im.wcsim.id ){
	    obj.wcsim = im.wcsim.id;
	}
	// remove old display info
	delete obj.params.display;
	// remove rot90 and flip, as we will recreate them
	obj.params.rot90 = 0;
	obj.params.flip = "none";
	// we didn't save the crosshair
	obj.params.crosshair = false;
	return obj;
    };
    if( !{}.hasOwnProperty.call(window, "saveAs") ){
	JS9.error("no saveAs() available to save session");
    }
    // filename for saving
    file = file || "js9.ses";
    // make sure we have the right extension
    if( !file.match(/\.ses$/) ){
	file += ".ses";
    }
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse session opts: ${opts}`, e); }
    }
    // change the cursor to show the waiting status
    JS9.waiting(true, this.display);
    // object we will save
    obj = {};
    // list of images to save
    obj.images = [];
    // which images to save?
    if( opts.mode === "display" ){
	// save all images in this display
	for(i=0; i<JS9.images.length; i++){
	    im = JS9.images[i];
	    if( im.display.id === this.display.id ){
		obj.images.push(saveim(im));
	    }
	}
    } else {
	// save current image
	obj.images.push(saveim(this));
    }
    // save display parameters
    obj.display = {blendMode: this.display.blendMode};
    // save global params
    obj.globals = $.extend(true, {}, JS9.globalOpts);
    // but delete properties which cause circular errors
    delete obj.globals.rgb;
    // save user-defined colormaps
    obj.cmaps = [];
    for(i=0; i<JS9.colormaps.length; i++){
	if( JS9.colormaps[i].source === "user" ){
	    obj.cmaps.push(JS9.colormaps[i]);
	}
    }
    // make a blob from the stringified session object
    try{ str = JSON.stringify(obj, null, 4); }
    catch(e){ JS9.error("can't create json file for save session", e); }
    blob = new Blob([str], {type: "application/json"});
    // save it
    JS9.saveAs(blob, file);
    // done waiting
    JS9.waiting(false);
    // return file name
    return file;
};

// stash a routine name and args
// the routine will be re-executed when the session is loaded
JS9.Image.prototype.xeqStashSave = function(func, args, id, context){
    let i, stash, len;
    // default context is image
    context = context || "image";
    // stash routine name and args
    this.xeqstash = this.xeqstash || [];
    // change display or image object to id
    for(i=0; i<args.length; i++){
	if( typeof args[i] === "object" ){
	    if( args[i] instanceof JS9.Image ){
		args[i] = args[i].id;
	    } else if( args[i] instanceof JS9.Display ){
		args[i] = args[i].id;
	    }
	}
    }
    // for most funcs: overwrite previous stash having the same func
    switch(func){
    case "setRot90":
	// two rots in the opposite direction cancel one another
	len = this.xeqstash.length;
	if( len >= 1                                  &&
	    this.xeqstash[len-1]                      &&
	    this.xeqstash[len-1].args[0] === -args[0] ){
	    this.xeqstash.pop();
	    return this;
	}
	break;
    case "setFlip":
	// two flips in the same direction cancel one another
	len = this.xeqstash.length;
	if( len >= 1                                 &&
	    this.xeqstash[len-1]                     &&
	    this.xeqstash[len-1].args[0] === args[0] ){
	    this.xeqstash.pop();
	    return this;
	}
	break;
    default:
	for(i=0; i<this.xeqstash.length; i++){
	    stash = this.xeqstash[i];
	    if( stash &&
		stash.func === func &&
		stash.context === context ){
		stash.args = args;
		return this;
	    }
	}
	break;
    }
    // add new func to stash
    this.xeqstash.push({func, args, id, context});
    // allow chaining
    return this;
};

// call a stashed routine name and args
JS9.Image.prototype.xeqStashCall = function(xeqstash, exclArr){
    let i, key, xeq;
    const doxeq = (func, xeq) => {
	let context = xeq.context || "image";
	try{
	    switch(context){
	    case "image":
		this[func](...xeq.args);
		break;
	    case "display":
		this.display[func](...xeq.args);
		break;
	    default:
		this[func](...xeq.args);
		break;
	    }
	}
	catch(e){
	    JS9.error(`error executing stash: ${func}`, e, false);
	}
    };
    xeqstash = xeqstash || this.xeqstash;
    if( $.isArray(xeqstash) ){
	for(i=0; i<xeqstash.length; i++){
	    xeq = xeqstash[i];
	    key = xeq.func;
	    if( $.inArray(key, exclArr) >= 0 ){
		continue;
	    }
	    doxeq(key, xeq);
	}
    } else {
	// backward compatibility: pre 3.1 used an object, not an array
	for( key of Object.keys(xeqstash) ){
	    if( $.inArray(key, exclArr) >= 0 ){
		continue;
	    }
	    xeq = xeqstash[key];
	    doxeq(key, xeq);
	}
    }
};

// remove a stash routine
JS9.Image.prototype.xeqStashDiscard = function(xid){
    let i, key;
    // sanity check
    if( !this.xeqstash ){ return; }
    if( $.isArray(this.xeqstash) ){
	for(i=this.xeqstash.length-1; i>=0; i--){
	    if( xid === this.xeqstash[i].func || xid === this.xeqstash[i].id ){
		this.xeqstash.splice(i,1);
	    }
	}
    } else {
	// pre 3.1 used an object
	for( key of Object.keys(this.xeqstash) ){
	    if( xid === key || xid === this.xeqstash[key].id ){
		delete this.xeqstash[key];
	    }
	}
    }
};

// execute plugins of various types (using type-specific values)
JS9.Image.prototype.xeqPlugins = function(xtype, xname, xval){
    let pname, pinst, popts, parr, evt;
    const xtrig = (name, obj) => {
        const s = `JS9:${name}`;
        $(document).trigger(s, obj);
    };
    // sanity check
    if( !xtype || !xname || !JS9.globalOpts.xeqPlugins ){ return; }
    // array of plugin instances
    parr = this.display.pluginInstances || {};
    // look for plugin callbacks to execute
    for( pname of Object.keys(parr) ){
	pinst = parr[pname];
	popts = pinst.plugin.opts;
	if( pinst.isActive(xname) && typeof popts[xname] === "function" ){
	    this.callingPlugin = xname;
	    switch(xtype){
	    case "image":
		// used for: onimage[load,close,refresh,display]
		try{
		    popts[xname].call(pinst, this);
		    xtrig(xname, {im: this});
                }
		catch(e){ pinst.errLog(xname, e); }
		break;
	    case "region":
	    case "shape":
		// used for: on[layer]change
		// xval: pub
		try{
		    popts[xname].call(pinst, this, xval);
		    xtrig(xname, {im: this, xreg: xval});
                }
		catch(e){ pinst.errLog(xname, e); }
		break;
	    case "keydown":
	    case "keypress":
		// used for: onkeydown, onkeypress (deprecated)
		// xval: evt
		evt = xval.originalEvent || xval;
		try{
		    popts[xname].call(pinst, this, this.ipos, evt);
		    xtrig(xname, {im: this, ipos: this.ipos, evt: evt});
                }
		catch(e){ pinst.errLog(xname, e); }
		break;
	    case "mouse":
		// used for: onmouse[down,move,over,out]
		// xval: evt
		if( !this.clickInRegion || popts[`${xname}_inRegion`] ){
		    evt = xval.originalEvent || xval;
		    try{
			popts[xname].call(pinst, this, this.ipos, evt);
			xtrig(xname, {im: this, ipos: this.ipos, evt: evt});
                    }
		    catch(e){ pinst.errLog(xname, e); }
		}
		break;
	    }
	    delete this.callingPlugin;
	}
    }
    // allow chaining
    return this;
};

// upload virtual file to proxy server
JS9.Image.prototype.uploadFITSFile = function(){
    let vfile, vdata;
    const upcb = (r) => {
	delete JS9.worker.uploadActive;
	window.setTimeout(() => { JS9.progress(false); }, 1000);
	if( r.stderr ){
	    JS9.error(r.stderr);
	} else if( r.stdout ){
	    // set FITS filename and proxy filename
	    this.fitsFile = r.stdout.trim();
	    this.proxyFile = this.fitsFile;
	    if( JS9.globalOpts.prependJS9Dir         &&
		!this.fitsFile.match(/^\${JS9_DIR}/) &&
		this.fitsFile.charAt(0) !== "/"      ){
		this.fitsFile = `\${JS9_DIR}/${this.fitsFile}`;
	    }
	    // re-query for analysis
	    this.queryHelper("all");
	}
    };
    // sanity check
    if( !JS9.worker ){ return; }
    // only supported when using socket.io ...
    if( JS9.helper.type !== "nodejs" && JS9.helper.type !== "socket.io" ){
	return;
    }
    // ... and only when we have a virtual file to upload
    if( !this.raw.hdu || !this.raw.hdu.fits || !this.raw.hdu.fits.vfile ){
	return;
    }
    // only one upload at a time
    if( JS9.worker.uploadActive ){
	JS9.error("only one upload allowed at a time");
    }
    // this is the file to upload
    vfile = this.raw.hdu.fits.vfile;
    // ask the remote server if we can upload
    JS9.helper.send("quotacheck", null, (robj) => {
	// check quota, only errors matter
	if( robj.stderr || robj.errcode ){
	    JS9.error(robj.stderr || `from quotacheck: ${robj.errcode}`);
	}
	vdata = JS9.vread(vfile, "binary");
	JS9.worker.socketio(() => {
	    JS9.worker.uploadActive = true;
	    JS9.progress(true, this.display);
	    JS9.worker.send("uploadFITS", [vfile, vdata], upcb, [vdata.buffer]);
	});
    });
    return this;
};

// remove proxy file from a remote server
JS9.Image.prototype.removeProxyFile = function(s){
    let t, reset, file, regexp;
    const func = (r) => {
	if( reset ){
	    if( r && r.stdout.trim() === "OK" ){
		this.proxyFile = null;
		this.proxyParent = null;
		this.fitsFile = null;
		this.analysisPackages = null;
		this.queryHelper("all");
	    }
	}
    };
    // arg can be a boolean, which means remove proxyFile and reset
    if( typeof s === "boolean" ){
	reset = s;
    } else if( typeof s === "string" ){
	// specify file to remove in the working directory
	// check for attempt to break out of the working dir using abs path
	if( s.match(/^\//) ){
	    return;
	}
	// remove possible install dir prefix and then ...
	// check attempt to break out of the working dir using ".."
	regexp = new RegExp(`^${JS9.INSTALLDIR}`);
	t = s.replace(regexp, "");
	if( t.match(/\.\./) ){
	    return;
	}
	file = s;
    } else {
	// default is to remove the proxy file
	if( !this.proxyFile ){
	    return;
	}
	file = this.proxyFile;
	// also remove the proxyParent file, if necessary
	if( this.proxyParent ){
	    file = `${file} ${this.proxyParent}`;
	}
    }
    // sanity check
    if( !file ){ return; }
    // ask to remove proxy file, and process result
    JS9.Send('removeproxy', {'cmd': `js9Xeq removeproxy ${file}`}, func);
};

// convert table to a shape array for the given image
JS9.Image.prototype.starbaseToShapes = function(starbase, opts){
    let i, j, k, shape, pos, siz, reg, data, header, delims, sizefunc;
    let xcol, ycol, ra, dec, owcssys, wcssys, tcol, tregexp;
    const global = JS9.globalOpts.catalogs;
    const xcols = JS9.globalOpts.catalogs.ras;
    const ycols = JS9.globalOpts.catalogs.decs;
    const regs = [];
    const getpos = (ra, dec) => {
	let arr;
	arr = JS9.wcs2pix(this.raw.wcs, ra, dec).trim().split(/ +/);
	if( arr && arr.length ){
	    return {x: parseFloat(arr[0]), y: parseFloat(arr[1])};
	}
	return null;
    };
    const getcol = (starbase, header, cols, defcol) => {
	let i, j, col;
	if( defcol !== undefined ){
	    col = defcol;
	} else {
	    // look for an exact match
	    col = -1;
	    for(j=0; j<cols.length; j++){
		for(i=0; i<header.length; i++){
		    if( cols[j].toLowerCase() === header[i].toLowerCase() ){
			col = starbase[header[i]];
			break;
		    }
		}
		if( col >= 0 ){
		    break;
		}
	    }
	    // no exact match, look for an approx match
	    if( col < 0 ){
		tcol = cols[0];
		tregexp = new RegExp(`^${tcol}`, "i");
		for(i=0; i<header.length; i++){
		    if( header[i].match(tregexp) ){
			col = starbase[header[i]];
			break;
		    }
		}
	    }
	    // no approx match, look for a less restrictive approx match
	    if( col < 0 ){
		tcol = cols[0];
		tregexp = new RegExp(`.*${tcol}.*`, "i");
		for(i=0; i<header.length; i++){
		    if( header[i].match(tregexp) ){
			col = starbase[header[i]];
			break;
		    }
		}
	    }
	}
	return col;
    };
    // sanity check
    if( !starbase || !starbase.data || !starbase.headline ){ return; }
    data = starbase.data;
    header = starbase.headline;
    delims = starbase.delims;
    // opts is optional
    opts = opts || {};
    xcol = getcol(starbase, header, xcols, opts.xcol);
    if( xcol < 0 ){
	JS9.error("can't find an RA column (see Preferences:catalogs)");
    }
    ycol = getcol(starbase, header, ycols, opts.ycol);
    if( ycol < 0 ){
	JS9.error("can't find a Dec column (see Preferences:catalogs)");
    }
    // process shape
    shape = opts.shape || global.shape || "circle";
    switch(shape){
    case "box":
	// eslint-disable-next-line no-unused-vars
	sizefunc = () => {
	    return { width: opts.width   || global.width  || 7,
		     height: opts.height || global.height || 7 };
	};
	break;
    case "circle":
	// eslint-disable-next-line no-unused-vars
	sizefunc = () => {
	    return { radius: opts.radius || global.radius || 3.5};
	};
	break;
    case "ellipse":
	// eslint-disable-next-line no-unused-vars
	sizefunc = () => {
	    return { r1: opts.r1  || global.r1  || 3.5,
		     r2: opts.r2  || global.r2  || 3.5 };
	};
	break;
    default:
	// eslint-disable-next-line no-unused-vars
	sizefunc = () => {
	    return { width: opts.width || 7, height: opts.height || 7 };
	};
	break;
    }
    // save original wcs system
    owcssys = this.getWCSSys();
    // set wcs system for catalogs
    if( opts.wcssys ){
	wcssys = opts.wcssys;
    } else if( global.wcssys ){
	wcssys = global.wcssys;
    } else {
	// umm ...
	wcssys = "ICRS";
    }
    // set wcssys for this catalog
    this.setWCSSys(wcssys, false);
    // convert each catalog object in the table into a JS9 shape
    for(i=0, j=0; i<data.length; i++){
	ra = data[i][xcol];
	dec = data[i][ycol];
	// various ways we might specify hms
	if( (delims[xcol] !== "\0")  && (":h ".includes(delims[xcol])) &&
	    (wcssys !== "galactic")  && (wcssys !== "ecliptic")        ){
	    ra *= 15.0;
	}
	pos = getpos(ra, dec);
	if( pos ){
	    siz = sizefunc();
	    reg = {id: i.toString(), shape: shape,
		   x: pos.x, y: pos.y,
		   width: siz.width, height: siz.height,
		   radius: siz.radius,
		   r1: siz.r1, r2: siz.r2,
		   angle: 0,
		   data: {ra, dec}};
	    // save catalog columns for this row
	    if( (opts.save !== false) &&
		(JS9.globalOpts.catalogs.save !== false) ){
		for(k=0; k<=header.length; k++){
		    if( header[k] ){
			reg.data[header[k]] = data[i][k];
		    }
		}
	    }
	    if( opts.color ){
		reg.color = opts.color;
	    }
	    regs[j++] = reg;
	}
    }
    // restore original wcs
    this.setWCSSys(owcssys, false);
    return regs;
};

// read a tab-delimited, #-commented table (starbase table), create a catalog
JS9.Image.prototype.loadCatalog = function(...args){
    let [layer, catalog, opts] = args;
    let shapes, topts, starbase;
    const lopts = $.extend(true, {}, JS9.Catalogs.opts);
    const global = JS9.globalOpts.catalogs;
    const defconv = (s) => {
	const delims = " \t-.:hdmsr'\"";
	const obj = {};
	obj.val = JS9.saostrtod(s);
	obj.delim = String.fromCharCode(JS9.saodtype());
	if( (obj.delim !== "\0") && (delims.includes(obj.delim)) ){
	    // valid delim means we converted to a float
	    return obj;
	} else if( JS9.isNumber(s) ){
	    // no delim, but its a number, so must be an int
	    return obj;
	}
	// everything else is a string
	obj.val = s;
	return obj;
    };
    // special case: 1 non-string arg is the catalog, not the layer
    if( args.length === 1 && typeof layer !== "string" ){
	catalog = layer;
	layer = null;
    }
    // special case: 2 non-string args: file and obj, not the layer
    if( args.length === 2 && typeof layer !== "string" ){
	opts = catalog;
	catalog = layer;
	layer = null;
    }
    // sanity check
    if( !catalog ){ return; }
    if( global.tooltip ){
	lopts.tooltip = global.tooltip;
    }
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse catalog opts: ${opts}`, e); }
    }
    // default color, if none specified
    opts.color = opts.color || global.color || "#00FF00";
    // wcs system
    opts.wcssys = opts.wcssys || global.wcssys;
    // update the WCS strings when adding a catalog shape
    opts.updateWCS = true;
    // starbase opts
    topts = {convFuncs:  {def: defconv},
	     units: opts.units || global.units,
	     skip:  opts.skip  || global.skip};
    // generate starbase table
    try{ starbase = new JS9.Starbase(catalog, topts); }
    catch(e){ JS9.error("could not parse catalog. Is it in tab-separated column format?"); }
    // sanity check
    if( !starbase || !starbase.data || !starbase.data.length ){
	JS9.error("no objects found in catalog");
    }
    // generate new catalog shapes
    shapes = this.starbaseToShapes(starbase, opts);
    if( shapes.length ){
	// layer name
	layer = layer || `catalog_${JS9.uniqueID()}` ;
	// create a new layer, if necessary
	this.display.newShapeLayer(layer, lopts);
	// delete any old shapes
	this.removeShapes(layer);
	// save the original catalog before adding shapes
	this.layers[layer].catalog = catalog;
	this.layers[layer].starbase = starbase;
	// add them to the catalog layer
	this.addShapes(layer, shapes, opts);
    } else {
	JS9.error("no catalog objects found");
    }
    // allow chaining
    return this;
};

// save catalog as a file
JS9.Image.prototype.saveCatalog = function(fname, which){
    let layer, cat, blob;
    layer = which || this.activeShapeLayer();
    if( !this.layers[layer] || !this.layers[layer].catalog ){
	if( layer && layer !== "undefined" ){
	    JS9.error(`no catalog available: ${layer}`);
	} else {
	    JS9.error("no active catalog available");
	}
    }
    cat = this.layers[layer].catalog;
    blob = new Blob([cat], {type: "text/plain;charset=utf-8"});
    fname = fname || `${layer}.cat`;
    if( !fname.match(/\.cat$/) ){
	fname += ".cat";
    }
    if( {}.hasOwnProperty.call(window, "saveAs") ){
	JS9.saveAs(blob, fname);
    } else {
	JS9.error("no saveAs() available to save catalog");
    }
    return fname;
};

// convert ra, dec from one wcs to another
JS9.Image.prototype.wcs2wcs = function(from, to, ra, dec){
    let owcssys, ounits, nwcs, arr, x, y, s, v0;
    // save current wcs and units
    owcssys = this.getWCSSys();
    ounits = this.getWCSUnits();
    // to, from default to current wcs
    from = from || owcssys;
    to = to || owcssys;
    //  convert ra, dec from string input to float degrees, if necessary
    if( typeof ra === "string" ){
	v0 = JS9.strtoscaled(ra);
	if( JS9.isHMS(from, v0.dtype) ){
	    v0.dval *= 15.0;
	}
	ra = v0.dval;
    }
    if( typeof dec === "string" ){
	v0 = JS9.strtoscaled(dec);
	dec = v0.dval;
    }
    // temporarily set the wcs to what we are converting from
    nwcs = this.setWCSSys(from, false).getWCSSys();
    // make sure change was successful
    if( from !== "native" ){
	if( nwcs !== from ){
	    JS9.error(`unknown or invalid wcs: ${from}`);
	}
    }
    // convert input ra, dec into image pixels in this wcs
    arr = JS9.wcs2pix(this.raw.wcs, ra, dec).trim().split(/ +/);
    x = parseFloat(arr[0]);
    y = parseFloat(arr[1]);
    // set wcs back to the target wcs
    this.setWCSSys(to, false);
    // convert image pixels from input ra, dec into target wcs
    this.setWCSUnits("degrees", false);
    s = JS9.pix2wcs(this.raw.wcs, x, y).trim();
    // reset wcs to original
    this.setWCSUnits(ounits, false);
    if( owcssys !== to ){
	this.setWCSSys(owcssys, false);
    }
    // return result
    return s;
};

// convert wcs, physical or image image length to image length,
// using current wcs and string delimiters to determine what input type
JS9.Image.prototype.wcs2imlen = function(s){
    let v, wcsinfo, iscale;
    let dpp = 1;
    // sanity check
    if( !s ){ return; }
    v = JS9.strtoscaled(s);
    wcsinfo = this.raw.wcsinfo || {cdelt1: 1, cdelt2: 1};
    // oh dear, this is cheating ...
    if( wcsinfo.cdelt1 !== undefined ){
	dpp = wcsinfo.cdelt1;
    } else if( wcsinfo.cdelt2 !== undefined ){
	dpp = wcsinfo.cdelt2;
    }
    switch(this.params.wcssys){
    case "image":
	break;
    case "physical":
	// use LTM1_1 or LTM1_2 value stored for logical to image transforms
	if( this.lcs && this.lcs.physical ){
	    iscale = Math.sqrt(Math.pow(this.lcs.physical.forward[0][0],2) +
		               Math.pow(this.lcs.physical.forward[0][1],2));
	    v.dval = Math.abs(v.dval * iscale);
	}
	break;
    default:
	// cheap conversion of wcs len to image len
	if( v.dtype && (v.dtype !== ".") && (v.dtype !== "\0")  ){
	    v.dval = Math.abs(v.dval / dpp);
	}
	break;
    }
    return v.dval;
};

// ---------------------------------------------------------------------
// JS9 Colormap support
// ---------------------------------------------------------------------

