// ---------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------

// sigh ... why do we need this polyfill??? (chrome pre-38)
Math.log10 = Math.log10 || function(x){
  return Math.log(x) / Math.LN10;
};

// javascript: the good parts p. 22
if( typeof Object.create !== "function" ){
    Object.create = function(o){
	const F = function(){return;};
	F.prototype = o;
	return new F();
    };
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/asinh
Math.asinh = Math.asinh || function(x){
  if (x === -Infinity){
    return x;
  }
  return Math.log(x + Math.sqrt(x * x + 1));
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sinh
Math.sinh = Math.sinh || function(x){
  return (Math.exp(x) - Math.exp(-x)) / 2;
};

// polyfill for ES2017 Array.prototype.includes from:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
// From https://github.com/kevlatus/polyfill-array-includes/blob/master/array-includes.js
if (!Array.prototype.includes){
  Object.defineProperty(Array.prototype, "includes", {
    value: function (searchElement, fromIndex) {

      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y) {
        return x === y || (typeof x === "number" && typeof y === "number" && isNaN(x) && isNaN(y));
      }

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        // c. Increase k by 1.
        if (sameValueZero(o[k], searchElement)) {
          return true;
        }
        k++;
      }

      // 8. Return false
      return false;
    }
  });
}

// make a copy of the raw data
// used by setFlip and setRot90
JS9.getRawCopy = function(oraw, bitpix){
    // make copy
    let nraw = JS9.extend(true, {}, oraw);
    nraw.bitpix = bitpix || oraw.bitpix;
    switch(nraw.bitpix){
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
	JS9.error(`unsupported bitpix: ${nraw.bitpix}`);
	break;
    }
    return nraw;
};

// extract line from raw data
// used by setFlip and setRot90
JS9.getRawLine = function(oraw, ooff, nraw, noff){
    let obuf, nbuf;
    switch(oraw.bitpix){
    case 8:
	obuf = new Uint8Array(oraw.data.buffer, ooff, oraw.width);
	nbuf = new Uint8Array(nraw.data.buffer, noff, oraw.width);
	break;
    case 16:
    case -16:
	obuf = new Uint16Array(oraw.data.buffer, ooff, oraw.width);
	nbuf = new Uint16Array(nraw.data.buffer, noff, oraw.width);
	break;
    case 32:
	obuf = new Uint32Array(oraw.data.buffer, ooff, oraw.width);
	nbuf = new Uint32Array(nraw.data.buffer, noff, oraw.width);
	break;
    case -32:
	obuf = new Float32Array(oraw.data.buffer, ooff, oraw.width);
	nbuf = new Float32Array(nraw.data.buffer, noff, oraw.width);
	break;
    case -64:
	obuf = new Float64Array(oraw.data.buffer, ooff, oraw.width);
	nbuf = new Float64Array(nraw.data.buffer, noff, oraw.width);
	break;
    default:
	JS9.error(`unsupported bitpix: ${oraw.bitpix}`);
	break;
    }
    return [obuf, nbuf];
};

// https://www.html5rocks.com/en/tutorials/webgl/typed_arrays/
JS9.memcpy = function(dst, dstOffset, src, srcOffset, length){
  var dstU8 = new Uint8Array(dst, dstOffset, length);
  var srcU8 = new Uint8Array(src, srcOffset, length);
  dstU8.set(srcU8);
};

// set explicit focus for IPython/Jupyter support
JS9.jupyterFocus = function(el, el2){
    let eljq;
    if( {}.hasOwnProperty.call(window, "Jupyter") ){
	if( el instanceof jQuery ){
	    eljq = el;
	} else {
	    eljq = $(el);
	}
	el2 = el2 || "input, textarea";
	eljq.find(el2).each((index, element) => {
	    Jupyter.keyboard_manager.register_events($(element));
	});
    }
};

// return a unique value for a given image id by appending <n> to the id
JS9.getImageID = function(imid, dispid, myim){
    let i, im, s;
    let ids = 0;
    let idmax = 1;
    const imlen = JS9.images.length;
    const rexp = /.*<([0-9][0-9]*)>$/;
    const rexp2 = /<[0-9][0-9]*>/;
    imid = JS9.cleanPath(imid.replace(rexp2, ""), "id");
    for(i=0; i<imlen; i++){
	im = JS9.images[i];
	if( im.display.id === dispid ){
	    if( (im !== myim) && (imid === im.id0.replace(rexp2, "")) ){
		if( im.id && im.id.search(rexp) >= 0 ){
		    s = im.id.replace(rexp, "$1");
		    idmax = Math.max(idmax, parseInt(s, 10));
		}
		ids++;
	    }
	}
    }
    if( ids ){
	return `${imid}<${String(idmax+1)}>`;
    }
    return imid;
};

// return a unique value for ids
JS9.uniqueID = (function(){
    let id = 1; // initial value
    return function(){
        return id++;
    };
}());

// change cursor to waiting/not waiting
JS9.waiting = function(mode, display){
    let el, opts, tdisp;
    switch(mode){
    case true:
	if( {}.hasOwnProperty.call(window, "Spinner") &&
	    (JS9.globalOpts.waitType === "spinner")   ){
	    if( display ){
		if( typeof display === "object" ){
		    el = display.divjq[0];
		} else if( typeof display === "string" ){
		    tdisp = JS9.lookupDisplay(display);
		    if( tdisp ){
			el = tdisp.divjq[0];
		    }
		}
	    }
	    if( !el ){
		el = $("body").get(0);
	    }
	    if( !JS9.spinner ){
		JS9.spinner = {};
		opts = {color:   JS9.globalOpts.spinColor,
			opacity: JS9.globalOpts.spinOpacity};
		JS9.spinner.spinner = new Spinner(opts);
	    }
	    JS9.spinner.spinner.spin(el);
	} else {
	    $("body").addClass("waiting");
	}
	break;
    case false:
	if( {}.hasOwnProperty.call(window, "Spinner") &&
	    (JS9.globalOpts.waitType === "spinner")   ){
	    if( JS9.spinner ){
		JS9.spinner.spinner.stop();
	    }
	} else {
	    $("body").removeClass("waiting");
	}
	break;
    }
};

// display a progress bar
JS9.progress = function(arg1, arg2){
    if( (typeof arg1 === "boolean") || (typeof arg1 === "string") ){
	switch(arg1){
	case true:
	case "indeterminate":
	    if( arg2 ){
		JS9.progress.display = arg2;
		JS9.progress.display.displayMessage("progress", arg1);
	    }
	    break;
	case false:
	case "":
	    if( JS9.progress.display ){
		JS9.progress.display.clearMessage("progress");
		delete JS9.progress.display;
	    }
	    break;
	}
    } else if( typeof arg1 === "number" ){
	if( JS9.progress.display ){
	    JS9.progress.display.displayMessage("progress", [arg1, arg2]);
	}
    }
};

// msg coming from socket.io or postMessage
JS9.msgHandler = function(msg, cb){
    let i, s, obj, tdisp, res, dobj;
    let args = [];
    const cmd = msg.cmd;
    const id = msg.id;
    const oalerts = JS9.globalOpts.alerts;
    const rstr = JS9.globalOpts.quietReturn ? "" : "OK";
    const getDisplayObject = (id, args) => {
	if( id ){
	    // bash sends a string, not an object
	    if( args.length > 0 ){
		s = args[args.length-1];
		if( typeof s === "string" ){
		    try{ obj = JSON.parse(s); }
		    catch(e){ obj = null; }
		} else if( typeof s === "object" ){
		    obj = s;
		}
		// is this the display object? see JS9.parsePublicArgs
		if( obj                                    &&
		    (typeof obj === "object")              &&
		    {}.hasOwnProperty.call(obj, "display") &&
		    (Object.keys(obj).length === 1)        ){
		    // remove the current display object
		    args.pop();
		    // return the new one
		    return obj;
		} else {
		    return {display: id};
		}
	    } else {
		return {display: id};
	    }
	}
	return null;
    };
    // turn off alerts
    if( cb ){
	JS9.globalOpts.alerts = false;
    }
    // look for a public API call
    if( JS9.publics[cmd] ){
	// check for non-array first arg
	if( !Array.isArray(msg.args) ){
	    msg.args = [msg.args];
	}
	// change empty quoted strings to empty strings
	for(i=0; i<msg.args.length; i++){
	    if( msg.args[i] === "''" || msg.args[i] === '""' ){
		msg.args[i] = "";
	    }
	}
	// deep copy of arg array
	args = JS9.extend(true, [], msg.args);
	// get display object (temporarily remove it, if necessary)
	dobj = getDisplayObject(id, args);
	// pre-processing
	switch(cmd){
	case "RunAnalysis":
	    // if RunAnalysis has a callback, call it when the helper returns
	    if( cb ){
		// add opts arg if not already present
		if( args.length === 1 ){
		    args.push(null);
		}
		// add callback arg
		args.push(cb);
	    }
	    break;
	default:
	    break;
	}
	// add (back) the display object
	if( dobj ){
	    args.push(dobj);
	}
	// call public API
	try{ res = JS9.publics[cmd](...args); }
	catch(e){ res = `ERROR: ${e.message}`; }
	if( cb ){
	    JS9.globalOpts.alerts = oalerts;
	    // last ditch effort to avoid passing back image or display objects
	    if( res instanceof JS9.Display || res instanceof JS9.Image ){
		res = res.id;
	    }
	    // post-processing
	    switch(cmd){
	    case "NewShapeLayer":
		if( res && res.layerName ){
		    res = res.layerName;
		}
		break;
	    case "RunAnalysis":
		// only callback on error, runAnalysis did non-error case
		if( !res.match(/^ERROR:/) ){
		    cb = null;
		}
		break;
	    default:
		break;
	    }
	    if( cb ){
		cb(res);
	    }
	}
	return res;
    }
    // skip blank lines and comments
    if( !cmd || (cmd === "#") ){
	if( cb ){
	    cb("");
	}
	if( cb ){
	    JS9.globalOpts.alerts = oalerts;
	}
	return;
    }
    // get command and display
    obj = JS9.lookupCommand(cmd);
    tdisp = JS9.lookupDisplay(id, false);
    if( obj && tdisp ){
	obj.getDisplayInfo(tdisp);
	if( msg.args ){
	    // deep copy of arg array
	    args = JS9.extend(true, [], msg.args);
	} else if( msg.paramlist ){
	    args = msg.paramlist.split(/ +/);
	}
	switch(obj.getWhich(args)){
	case "get":
	    // execute get call
	    try{ res = obj.get(args) || ""; }
	    catch(e){ res = `ERROR: ${e.message}`;}
	    break;
	case "set":
	    // execute set call
	    try{ res = obj.set(args) || rstr; }
	    catch(e){ res = `ERROR: ${e.message}`;}
	    break;
	default:
	    res = `ERROR: unknown cmd type for '${cmd}'`;
	    break;
	}
    } else {
	if( !obj ){
	    res = `ERROR: unknown cmd '${cmd}'`;
	}
	if( !tdisp ){
	    res = `ERROR: unknown display (${id})`;
	}
    }
    // turn on alerts, do message callback, if necessary
    if( cb ){
	JS9.globalOpts.alerts = oalerts;
	// last ditch effort to avoid passing back image or display objects
	if( res instanceof JS9.Display || res instanceof JS9.Image ){
	    res = res.id;
	}
	cb(res);
    }
    return res;
};

// create a light window
// someday we might want other options ...
JS9.lightWin = function(id, type, s, title, winformat){
    let rval;
    // winformat is optional
    winformat = winformat || "";
    // create the light window
    switch(JS9.LIGHTWIN){
    case "dhtml":
	// if no positioning, add the default
	if( !winformat.match(/(left|top|center)=/) ){
	    if( winformat ){ winformat = winformat + ","; }
	    winformat = winformat + `${JS9.globalOpts.lightWinPos}`;
	}
	rval = dhtmlwindow.open(id, type, s, title, winformat);
	// override dhtml to add ios scroll capability
	if(  /iPad|iPhone|iPod/.test(navigator.platform) ){
	    $(`#${id} ${JS9.lightOpts[JS9.LIGHTWIN].drag}`)
		.css("-webkit-overflow-scrolling", "touch")
		.css("overflow-y", "scroll");
	}
	// allow double-click or double-tap to close ...
	// ... the close button is unresponsive on the ipad/iphone
        $(`#${id} ${JS9.lightOpts[JS9.LIGHTWIN].dragBar}`)
	    .on("dblclick", () => {
		rval.close();
	    })
	    .on("touchend", (e) => {
		const curtime = (new Date()).getTime();
		const lasttime = $(e.currentTarget).data("lasttime");
		if( lasttime                             &&
		    (curtime - lasttime) > JS9.DBLCLICK0 &&
		    (curtime - lasttime) < JS9.DBLCLICK  ){
		    rval.close();
		}
		$(e.currentTarget).data("lasttime", curtime);
	    });
	// if ios user failed to close the window via the close button,
	// give a hint (once per session only!)
        $(`#${id} ${JS9.lightOpts[JS9.LIGHTWIN].dragBar}`)
	    .on("touchend", () => {
		// skip check if we are dragging
		if( !dhtmlwindow.distancex  && !dhtmlwindow.distancey ){
		    if( JS9.lightOpts.nclick >= 2 ){
			alert("trouble closing this window? double-tap the window handle");
			JS9.lightOpts.nclick = -1;
		    } else {
			if( JS9.lightOpts.nclick >= 0 ){
			    JS9.lightOpts.nclick++;
			}
		    }
		} else {
		    if( JS9.lightOpts.nclick > 0 ){
			JS9.lightOpts.nclick = 0;
		    }
		}
	    });
        break;
    default:
        break;
    }
    return rval;
};

// wrapper for new func to avoid jslint errors
JS9.checkNew = function(obj){
    if( !obj ){
	JS9.error("internal failure in a JS9 constructor");
    }
};

// desperate attempt to regularize the control/meta key
JS9.specialKey = function(e){
    return (e.metaKey || e.ctrlKey);
};

// desperate attempt to regularize the stracktrace message
JS9.strace = function(e){
    let s = "";
    if( JS9.DEBUG > 1 ){
	s = e.stack || e.stacktrace || "";
    }
    return s;
};

// try to make a nice string from a float
// ints remain ints, floats get truncated at 6 significant digits
JS9.floatToString = function(fval){
    if( typeof fval === "number" ){
	return sprintf("%g",
		       parseFloat(fval.toFixed(JS9.globalOpts.floatPrecision)));
    } else if( typeof fval === "string" ){
	return fval;
    } else {
	return String(fval);
    }
};

// figure out precision from range of values (used by colorbar)
// from: /tksao1.0/colorbar/colorbarbase.C
JS9.floatPrecision = function(fval1, fval2){
    let prec;
    let aa = Math.floor(Math.log10(Math.abs(fval1)));
    let bb = Math.floor(Math.log10(Math.abs(fval2)));
// not sure why prec is set to 1 in the else clause so ...
//    if( aa !== bb ){
//      prec = aa > bb ? aa : bb;
//    } else {
//      prec = 1;
//    }
    prec = Math.max(aa, bb);
    return prec;
};

// convert float value to a string with decent precision
// from: /tksao1.0/colorbar/colorbarbase.C
JS9.floatFormattedString = function(fval, prec, jj){
    let fmt;
    let s = "";
    if( fval === undefined ){
	return s;
    }
    if( prec < -2 ){
	fmt = `%.${String(2+jj)}e`;
	s = sprintf(fmt, fval);
    } else if( prec < 0 ){
	s = fval.toFixed(Math.abs(prec)+3+jj);
    } else if( prec < 2 ){
	fmt = `%.${String(prec+jj)}f`;
	s = sprintf(fmt, fval);
    } else if( prec < 5 ){
	s = fval.toFixed(0+jj);
    } else {
	fmt = `%.${String(2+jj)}e`;
	s = sprintf(fmt, fval);
    }
    return s;
};

// get center of bounding box surrounding a polygon
JS9.centerPolygon = function(points){
    let i, plen, minx, maxx, miny, maxy;
    // sanity check
    if( !points || !points.length ){ return; }
    plen = points.length;
    for(i=0; i<plen; i++){
	if( (minx === undefined) || (points[i].x < minx) ){
	    minx = points[i].x;
	}
	if( (maxx === undefined) || (points[i].x > maxx) ){
	    maxx = points[i].x;
	}
	if( (miny === undefined) || (points[i].y < miny) ){
	    miny = points[i].y;
	}
	if( (maxy === undefined) || (points[i].y > maxy) ){
	    maxy = points[i].y;
	}
    }
    return {x: (minx + maxx) / 2.0, y: (miny + maxy) / 2.0};
};

// calculate centroid for a polygon
// wont work for self-intersecting polygons but it's all I do right now!
// adapted from: http://en.wikipedia.org/wiki/Centroid
JS9.centroidPolygon = function(points, doaverage){
    let i, plen, factor, area, cx, cy;
    let parta = 0;
    let partx = 0;
    let party = 0;
    let totx = 0;
    let toty = 0;
    const pts = [];
    // sanity check
    if( !points || !points.length ){ return; }
    // get points
    plen = points.length;
    // just average the points?
    if( doaverage ){
	for(i=0; i<plen; i++){
	    totx += points[i].x;
	    toty += points[i].y;
	}
	return {x: totx / plen, y: toty / plen};
    }
    // copy point array so we can duplicate first point as last array element
    for(i=0; i<plen; i++){
	pts[i] = {};
	pts[i].x = points[i].x;
	pts[i].y = points[i].y;
    }
    pts[plen] = {};
    pts[plen].x = pts[0].x;
    pts[plen].y = pts[0].y;
    // calculate centroid
    for(i=0; i<plen; i++){
	factor = (pts[i].x * pts[i+1].y) - (pts[i+1].x * pts[i].y);
	parta += factor;
	partx += (pts[i].x + pts[i+1].x) * factor;
	party += (pts[i].y + pts[i+1].y) * factor;
    }
    area = parta / 2.0;
    cx = partx / (area * 6.0);
    cy = party / (area * 6.0);
    // return centroid position
    return {x: cx, y: cy};
};

// return the image object for the specified image object, name, or filename
JS9.lookupImage = function(id, display){
    let i, im, did, fp;
    const ilen= JS9.images.length;
    // sanity check
    if( !id ){ return null; }
    // desktop can have full path in file property, so check that as well
    if( window.electron ){
	fp = `${window.electron.currentDir}/${id}`;
    }
    for(i=0; i<ilen; i++){
	im = JS9.images[i];
	if( (id === im )      || (id === im.id)                          ||
	    (id === im.file)  || (id === im.file.replace(/\[.*\]$/, "")) ||
	    (fp === im.file)  || (fp === im.file.replace(/\[.*\]$/, "")) ||
	    (id === im.file0) || (id === (JS9.TOROOT + im.file))         ||
	    (im.fitsFile      && (id === im.fitsFile)) ){
	    // make sure the display still exists (light windows disappear)
	    if( $(`#${im.display.id}`).length > 0 ){
		did = im.display.id;
		if( !display                                            ||
		    (typeof display === "string" && display === did)    ||
		    (typeof display === "object" && display.id === did) ){
		    return im;
		}
	    }
	}
    }
    return null;
};

// return the display for the specified id
// id can be a display object or an id from a display object
JS9.lookupDisplay = function(id, mustExist){
    let i;
    const regexp = new RegExp(`[-_]?(${JS9.PLUGINS})$`);
    // default is the id must exist
    if( mustExist === undefined ){
	mustExist = true;
    }
    // lookup id
    if( id && (id.toString().search(JS9.SUPERMENU) < 0) ){
	// look for whole id
	for(i=0; i<JS9.displays.length; i++){
	    if( (id === JS9.displays[i])     ||
		(id === JS9.displays[i].id)  ||
		(id === JS9.displays[i].oid) ){
		return JS9.displays[i];
	    }
	}
	// try removing id suffix to get base id
	if( typeof id === "string" ){
	    id = id.replace(regexp,"");
	    for(i=0; i<JS9.displays.length; i++){
		if( (id === JS9.displays[i])     ||
		    (id === JS9.displays[i].id)  ||
		    (id === JS9.displays[i].oid) ){
		    return JS9.displays[i];
		}
	    }
	}
        // an id was specified but not found
        if( mustExist ){
	    JS9.error(`can't find JS9 display with id: ${id}`);
        }
        else {
            return null;
        }
    }
    // no id: return whatever we have
    return JS9.displays[0];
};

// return the image object for the specified image id or display id
JS9.getImage = function(id){
    let im = null;
    let display = null;
    // first look for an image file
    im = JS9.lookupImage(id);
    // then look for a display id
    if( !im ){
	display = JS9.lookupDisplay(id, false);
	// return associated image, if possible
	if( display ){
	    im = display.image;
	}
    }
    return im;
};

// look for specified vfile among raw0 hdus
// used to determine if its safe to delete a vfile
JS9.lookupVfile = function(vfile){
    let i, j, im, raw;
    const arr = [];
    // sanity check
    if( !vfile ){ return arr; }
    // check raw0 hdu for specified vfile
    for(i=0; i<JS9.images.length; i++){
	im = JS9.images[i];
	for(j=0; j<im.raws.length; j++){
	    raw = im.raws[j];
	    if( raw.hdu && raw.hdu.fits && (vfile === raw.hdu.fits.vfile) ){
		arr.push({im: im, raw: raw, idx: j});
	    }
	}
    }
    return arr;
};

// load javascript dynamically
// https://stackoverflow.com/questions/21294/dynamically-load-a-javascript-file
JS9.loadScript = function(url, func, error){
    // adding the script tag to the head as suggested before
    const head = document.getElementsByTagName("head")[0];
    const script = document.createElement("script");
    script.type = "text/javascript";
    // callback
    if( func ){
	script.onload = func;
    }
    // error
    if( error ){
	script.onerror = error;
    }
    script.src = url;
    // fire the loading
    head.appendChild(script);
};

// synchronous JSON GET (native sync XHR). jQuery's $.ajax async:false used the
// same synchronous XMLHttpRequest under the hood, so this is behavior-for-
// behavior; a status of 0 (local file) is treated as success, as jQuery did.
JS9.getJSONSync = function(url){
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    if( xhr.overrideMimeType ){ xhr.overrideMimeType("application/json"); }
    xhr.send(null);
    if( xhr.status && (xhr.status < 200 || xhr.status >= 300) ){
	throw new Error(`HTTP ${xhr.status} for ${url}`);
    }
    return JSON.parse(xhr.responseText);
};

// JSONP request (native <script> + global callback). Replaces $.ajax
// dataType:"jsonp"; used (not fetch) to ping a helper cross-origin without CORS.
JS9.jsonp = function(url, success, error){
    const cb = `JS9jsonp${JS9.jsonp._n = (JS9.jsonp._n || 0) + 1}`;
    const script = document.createElement("script");
    let done = false;
    const cleanup = () => {
	try{ delete window[cb]; } catch(e){ window[cb] = undefined; }
	if( script.parentNode ){ script.parentNode.removeChild(script); }
    };
    window[cb] = (data) => { done = true; cleanup(); if( success ){ success(data); } };
    script.onerror = () => { if( !done ){ cleanup(); if( error ){ error(); } } };
    const sep = url.indexOf("?") >= 0 ? "&" : "?";
    script.src = `${url}${sep}callback=${cb}`;
    (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script);
};

// fetch text, with jQuery-style `data` serialization: a query string for GET,
// a form-urlencoded body for POST. Replaces $.ajax dataType:"text".
JS9.fetchText = function(url, method, data, success, error){
    method = (method || "GET").toUpperCase();
    const opts = {method, cache: "no-store"};
    if( data ){
	const params = new URLSearchParams(data).toString();
	if( method === "GET" ){
	    url += (url.indexOf("?") >= 0 ? "&" : "?") + params;
	} else {
	    opts.body = params;
	    opts.headers = {"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"};
	}
    }
    fetch(url, opts)
	.then((resp) => {
	    if( !resp.ok ){ throw new Error(`HTTP ${resp.status}`); }
	    return resp.text();
	})
	.then((text) => { if( success ){ success(text); } })
	.catch((e) => { if( error ){ error(e); } });
};

// fetch a file URL (as a blob) and process it
// (as of 2/2015: can't use $.ajax to retrieve a blob: use low-level xhr)
JS9.fetchURL = function(name, url, opts, handler){
    let nurl;
    const xhr = new XMLHttpRequest();
    // opts is optional
    opts = opts || {};
    // sanity check
    if( !name && !url ){
	JS9.error("invalid url specification for fetchURL");
    }
    // either url or name can be blank
    if( !url ){
	url = name;
	name = /([^\\/]+)$/.exec(url)[1];
    }
    if( !name ){
	name = /([^\\/]+)$/.exec(url)[1];
    }
    // use fits proxy, if necessary
    if( opts.proxy && JS9.globalOpts.cgiProxy              &&
	url.match(/\.(fits|ftz|fz|fits\.gz|fits\.bz2)(\?.*)?$/) ){
	url = `${JS9.globalOpts.cgiProxy}?fits=${url}`;
    }
    // avoid the cache (Safari is especially aggressive) for FITS files
    if( !opts.allowCache && !url.match(/\?/) ){
	nurl = `${url}?r=${Math.random()}`;
    } else {
	nurl = url;
    }
    // change $JS9_DIR back to install dir
    nurl = nurl.replace(/^\${JS9_DIR}\//,JS9.INSTALLDIR);
    // set up connection
    xhr.open("GET", nurl, true);
    // and parameters
    if( opts.responseType ){
	xhr.responseType = opts.responseType;
    } else {
	xhr.responseType = "blob";
    }
    if( JS9.globalOpts.xtimeout ){
	xhr.timeout = JS9.globalOpts.xtimeout;
    }
    xhr.onload = () => {
	let blob;
        if( xhr.readyState === 4 ){
	    if( xhr.status === 200 || xhr.status === 0 ){
		// delete fetch status so JS9.error() does not process it
		delete JS9.fetchURL.status;
		if( xhr.responseType === "blob" ){
	            blob = new Blob([xhr.response]);
		    // discard path (or scheme) up to slashes
		    // remove trailing ? params
		    if( name.match("://") ){
			blob.name = name.split("/").reverse()[0]
			    .replace(/\?.*$/, "");
		    } else {
			blob.name = name;
		    }
		    // hack for Google Drive's lack of a filename
		    if( blob.name === "uc" ){
			blob.name = `google_${JS9.uniqueID()}.fits`;
		    }
		    if( handler ){
			handler(blob, opts);
		    } else {
			JS9.Load(blob, opts);
		    }
		} else {
		    if( opts.display ){
			handler(xhr.response, opts, {display: opts.display});
		    } else {
			handler(xhr.response, opts);
		    }
		}
	    } else if( xhr.status === 404 ){
		JS9.error(`could not find ${url}`);
	    } else {
		JS9.error(`can't load: ${url} ${xhr.statusText} ${xhr.status}`);
	    }
	}
    };
    xhr.onerror = () => {
	JS9.error(`cannot load: ${url} ... please check the url/pathname`);
    };
    xhr.ontimeout = () => {
	JS9.error(`timeout awaiting response from server: ${url}`);
    };
    // hack: set fetch status for JS9.error() to sense and pass on
    // this will be picked up by getStatus("load")
    JS9.fetchURL.status = "processing";
    // fetch the data!
    try{ xhr.send(); }
    catch(e){ JS9.error(`request to load ${url} failed`, e); }
};

// JS9 wrapper around saveAs:
// deal with pathnames in Electron desktop app
JS9.saveAs = function(blob, pathname){
    let dirmatch, dirname, basename;
    if( window.electron ){
	dirmatch = pathname.match(/.*\//);
	// if a directory was specified ...
	if( dirmatch && dirmatch[0] ){
	    // ... change save directory in Electron before save
	    dirname = dirmatch[0];
	    JS9.SaveDir(dirname, {onceOnly: true});
	}
	// get basename
	basename = pathname.split('/').reverse()[0];
	// wait a bit for ipc to finish, then save
	window.setTimeout(() => {
	    // save basename in current save directory
	    try{ saveAs(blob, basename); }
	    catch(e){ JS9.error("could not saveAs", e); }
	}, JS9.TIMEOUT);
    } else {
	// non-Electron (or no path): just save filename
	try{ saveAs(blob, pathname); }
	catch(e){ JS9.error("could not saveAs", e); }
    }
}

// configure or return the fits library
JS9.fitsLibrary = function(s){
    let t;
    if( !s ){
	return JS9.fits.name;
    }
    t = s.toLowerCase();
    switch(t){
    case "astroem":
    case "cfitsio":
	JS9.fits = Astroem;
	// set up default options
	JS9.fits.options = JS9.fits.options || {};
	JS9.fits.options.handler = JS9.NewFitsImage;
	JS9.fits.options.error = JS9.error;
	if( JS9.userOpts.fits ){
	    JS9.fits.options.extlist =  JS9.userOpts.fits.extlist;
	    JS9.fits.options.table = {
		xdim: JS9.userOpts.fits.xdim,
		ydim: JS9.userOpts.fits.ydim,
		bin: JS9.userOpts.fits.bin || 1
	    };
	    JS9.fits.options.image = {
		xdim: JS9.userOpts.fits.ixdim || JS9.userOpts.fits.xmax,
		ydim: JS9.userOpts.fits.iydim || JS9.userOpts.fits.ymax,
		bin: JS9.userOpts.fits.ibin || 1
	    };
	} else {
	    JS9.fits.options.extlist =  JS9.globalOpts.extlist;
	    JS9.fits.options.table = {bin: (JS9.globalOpts.table.bin || 1)};
	    // NB: dims are deprecated 11/27/16
	    if( JS9.notNull(JS9.globalOpts.table.xdim) ){
		JS9.fits.options.table.xdim = JS9.globalOpts.table.xdim;
	    } else if( JS9.notNull(JS9.globalOpts.dims) ){
		JS9.fits.options.table.xdim = JS9.globalOpts.dims[0];
	    }
	    if( JS9.notNull(JS9.globalOpts.table.ydim) ){
		JS9.fits.options.table.ydim = JS9.globalOpts.table.ydim;
	    } else if( JS9.notNull(JS9.globalOpts.dims) ){
		JS9.fits.options.table.ydim = JS9.globalOpts.dims[1];
	    }
	    JS9.fits.options.image = {bin: (JS9.globalOpts.image.bin || 1)};
	    if( JS9.notNull(JS9.globalOpts.image.xdim) ){
		JS9.fits.options.image.xdim = JS9.globalOpts.image.xdim;
	    } else if( JS9.notNull(JS9.globalOpts.xmax) ){
		JS9.fits.options.image.xdim = JS9.globalOpts.xmax;
	    }
	    if( JS9.notNull(JS9.globalOpts.image.ydim) ){
		JS9.fits.options.image.ydim = JS9.globalOpts.image.ydim;
	    } else if( JS9.notNull(JS9.globalOpts.ymax) ){
		JS9.fits.options.image.ydim = JS9.globalOpts.ymax;
	    }
	}
	if( JS9.fits.maxFITSMemory && JS9.globalOpts.maxMemory ){
	    JS9.fits.maxFITSMemory(JS9.globalOpts.maxMemory);
	}
	break;
    default:
	JS9.error(`unknown fits library: ${s}`);
	break;
    }
    // common code
    JS9.fits.ready = true;
    JS9.fits.name = t;
    JS9.fits.options.error = JS9.error;
    JS9.fits.options.waiting = JS9.waiting;
    return t;
};

// check for 'real' FITS handling routine and call it. This routine can:
// read a blob as a FITS file
// open an existing virtual FITS file (e.g. created by Montage reprojection)
JS9.handleFITSFile = function(file, opts, handler){
    if( JS9.fits.handleFITSFile ){
	JS9.fits.handleFITSFile(file, opts, handler);
    } else {
	JS9.error("no FITS module available to process FITS file");
    }
};

// cleanup FITS file by deleting vfile, etc
JS9.cleanupFITSFile = function(raw, mode){
    let rexp;
    if( JS9.hostFS ){
	rexp = new RegExp(`^${JS9.hostFS}`);
    }
    if( JS9.fits.cleanupFITSFile && raw && raw.hdu && raw.hdu.fits ){
	// don't delete real local file
	if( rexp && raw.hdu.fits.vfile && raw.hdu.fits.vfile.match(rexp) ){
	    mode = false;
	}
	JS9.fits.cleanupFITSFile(raw.hdu.fits, mode);
	return true;
    }
    // just return if no available cleanup routine or no raw data file
    return false;
};

// load an image (jpeg, png, etc)
JS9.handleImageFile = function(file, options, handler){
    const reader = new FileReader();
    options = JS9.extend(true, {}, JS9.fits.options, options);
    handler = handler || JS9.Load;
    reader.onload = (ev) => {
	let data, grey, hdu;
	const img = new Image();
	img.onload = () => {
	    let x, y, v, header;
	    let i = 0;
	    const canvas = document.createElement("canvas");
	    const ctx    = canvas.getContext("2d");
	    const h      = img.height;
	    const w      = img.width;
	    canvas.width  = w;
	    canvas.height = h;
	    ctx.drawImage(img, 0, 0);
	    data   = ctx.getImageData(0, 0, w, h).data;
	    grey   = new Float32Array(h*w);
	    for ( y = 0; y < h; y++ ) {
		for ( x = 0; x < w; x++ ) {
		    // NTSC
		    v = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
		    grey[(h - y) * w + x] = v;
		    i += 4;
		}
	    }
	    header = {SIMPLE: true,
		      BITPIX: -32,
		      NAXIS: 2,
		      NAXIS1: w,
		      NAXIS2: h};
	    hdu = {filename: file.name,
		   naxis: 2, axis: [0, w, h], bitpix: -32, bin: 1,
		   head: header, data: grey, offscreen: img};
	    hdu.dmin = Number.MAX_VALUE;
	    hdu.dmax = Number.MIN_VALUE;
	    for(i=0; i< h*w; i++){
		if( !Number.isNaN(hdu.data[i])   &&
		    Number.isFinite(hdu.data[i]) ){
		    hdu.dmin = Math.min(hdu.dmin, hdu.data[i]);
		    hdu.dmax = Math.max(hdu.dmax, hdu.data[i]);
		}
	    }
	    options.source = "img";
	    handler(hdu, options);
	};
	img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
};

// check for 'real' FITS handling routine and call it
JS9.getFITSImage = function(fits, hdu, options, handler){
    if( JS9.fits.getFITSImage ){
	JS9.fits.getFITSImage(fits, hdu, options, handler);
    } else {
	JS9.error("no FITS module available to process FITS image");
    }
};

// run fits2fits converter, if necessary
JS9.fits2fits = function(display, file, opts, func){
    let i, s, xdim, ydim, bin, bmode, obj, xcond;
    const xopts = {};
    opts = opts || {};
    if( JS9.notNull(opts.fits2fits) ){
	xcond = opts.fits2fits;
    } else {
	xcond = JS9.globalOpts.fits2fits;
    }
    if( xcond === true ){
	xcond = "always";
    } else if(  xcond === false ){
	xcond = "never";
    }
    // if never, we are done
    if( xcond.match(/never/i) ){
	return false;
    }
    // make sure we are set up to run the converter
    // requires a connected helper via a socket.io connection
    if( !JS9.helper.connected ||
	(JS9.helper.type !== "nodejs" && JS9.helper.type !== "socket.io") ){
	if(  xcond === "always" && JS9.globalOpts.requireFits2Fits ){
	    JS9.error("can't run fits2fits without connected JS9 helper");
	}
	return false;
    }
    // if the helper program does not exist, we might want to throw an error
    if( !JS9.helper.js9helper ){
	if( JS9.globalOpts.requireFits2Fits ){
	    JS9.error("js9helper not found for fits2fits processing");
	} else {
	    return false;
	}
    }
    // requires a tmp workdir
    if( !JS9.globalOpts.workDir ){
	if( JS9.globalOpts.requireFits2Fits ){
	    JS9.error("can't run fits2fits without a workdir");
	}
	return false;
    }
    xdim =
	opts.xdim ||
	JS9.fits.options.image.xdim ||
	JS9.fits.options.table.xdim;
    ydim =
	opts.ydim ||
	JS9.fits.options.image.ydim ||
	JS9.fits.options.table.ydim;
    bin =
	opts.bin ||
	JS9.fits.options.image.bin ||
	JS9.fits.options.table.bin;
    bmode = opts.binMode || JS9.globalOpts.binMode;
    bmode = bmode === "a" ? "a" : "";
    // handle string bin, possibly containing explicit binMode
    if( typeof bin === "string" ){
	if( bin.match(/[as]$/) ){
	    bmode = bin.slice(-1);
	}
	bin = parseInt(bin, 10);
    }
    bin = Math.max(1, bin || 1);
    if( JS9.notNull(opts.xcen) && JS9.notNull(opts.ycen) ){
	xopts.sect = `${xdim}@${opts.xcen},${ydim}@${opts.ycen},${bin}${bmode}`;
    } else {
	xopts.sect = `${xdim},${ydim},${bin}${bmode}`;
    }
    s = xcond.toLowerCase().split(/[>,]/);
    for(i=0; i<s.length; i++){
	switch(s[i]){
	case "size":
	    if( s[i+1] ){
		if( JS9.isNumber(s[i+1]) ){
		    xopts.maxsize = parseFloat(s[i+1])*1000000;
		}
		i++;
	    }
	    break;
	}
    }
    xopts.fits = JS9.cleanPath(file);
    xopts.parent = true;
    // start the waiting!
    JS9.waiting(true, display);
    // send message to helper to do conversion
    JS9.helper.send("fits2fits", xopts, (r) => {
	let robj, rarr, f, pf, nopts;
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
	if( robj.stderr ){
	    JS9.error(robj.stderr, JS9.analOpts.epattern);
	}
	if( robj.stdout ){
	    // look for error condition, which we might throw or swallow
	    if( robj.stdout.match(/^ERROR:/) ){
		if( JS9.globalOpts.requireFits2Fits ){
		    JS9.error(robj.stdout);
		} else {
		    robj.stdout = xopts.fits;
		}
	    }
	    // output is file and possibly parentFile
	    rarr = robj.stdout.split(/\n/);
	    // file
	    f = JS9.cleanPath(rarr[0]);
	    if( f === xopts.fits ){
		// same file (imsection not run)
		nopts = JS9.extend(true, {}, opts);
	    } else {
		// new file using imsection
		// relative path: add install dir prefix
		if( f.charAt(0) !== "/" ){
		    f = JS9.InstallDir(f);
		}
		nopts = JS9.extend(true, {}, opts);
		// but remove already-used section properties from opts
		delete nopts.xcen;
		delete nopts.ycen;
		delete nopts.bin;
		// but load entire image section
		if( nopts.xdim !== undefined ){ nopts.xdim = 0; }
		if( nopts.ydim !== undefined ){ nopts.ydim = 0; }
		// save source
		nopts.source = "fits2fits";
		// it's a proxy file (i.e., delete it on close)
		nopts.proxyFile = f;
		// json fits info
		if( rarr[1] ){
		    try{ obj = JSON.parse(rarr[1]); }
		    catch(ignore){ /* empty */ }
		    if( obj ){
			nopts.extname = obj.extname;
			nopts.extnum = obj.extnum;
			nopts.hdus = obj.hdus;
			nopts.parent = obj;
		    }
		}
		// look for parentFile (relative to helper, not install)
		if( rarr[2] ){
		    pf = JS9.cleanPath(rarr[2]);
		    nopts.parentFile = pf;
		    // now add extension info, if possible
		    if( nopts.extname ){
			nopts.parentFile = nopts.parentFile
			    .replace(/\[.*\]/, "");
			nopts.parentFile += `[${nopts.extname}]`;
		    } else if( nopts.extnum && (nopts.extnum > 0) ){
			nopts.parentFile = nopts.parentFile
			    .replace(/\[.*\]/, "");
			nopts.parentFile.file += `[${nopts.extnum}]`;
		    }
		}
		// add onload, if necessary
		if( func ){
		    nopts.onload = func;
		}
	    }
	    // no recursion!
	    nopts.fits2fits = false;
	    // load new file
	    JS9.Load(f, nopts, {display});
	}
    });
    return true;
};

// return the specified colormap object (or default)
JS9.lookupColormap = function(name, mustExist){
    let i;
    // default is the id must exist
    if( mustExist === undefined ){
	mustExist = true;
    }
    if( !name ){
	name = JS9.imageOpts.colormap;
    }
    if( name ){
	for(i=0; i<JS9.colormaps.length; i++){
	    if( JS9.colormaps[i].name === name ){
		return JS9.colormaps[i];
	    }
	}
    }
    if( mustExist ){
        JS9.error(`unknown colormap '${name}'`);
    } else {
	return null;
    }
};

// lookup command
JS9.lookupCommand = function(name){
    let cmd, i, n;
    if( name ){
	n = name.toLowerCase();
	for(i=0; i<JS9.commands.length; i++){
	    cmd = JS9.commands[i];
	    if( (cmd.name  === n) || (cmd.alias === n) || (cmd.alias2 === n) ){
		return cmd;
	    }
	}
    }
    return null;
};

// error message handler
JS9.error = function(...args){
    let [emsg, epattern, dothrow] = args;
    let e, earr, i, s, im, cur;
    let emessage = "";
    let stack = "";
    let doerr = true;
    // reset wait cursor
    JS9.waiting(false);
    // set fetch error status, if coming from a fetch
    if( JS9.fetchURL.status === "processing" ){
	JS9.fetchURL.status = "error";
    }
    // set current error status, if we find it
    for(i=0; i<JS9.images.length; i++){
	im = JS9.images[i];
	cur = im.status.cur;
	if( cur && im.status[cur] ){
	    im.setStatus(cur, "error");
	}
    }
    // second args can be error pattern to look for, or else an error object
    if( typeof epattern === "string" ){
	earr = emsg.match(epattern);
	if( earr ){
	    if( earr[1] ){
		emsg = earr[1];
	    } else if( earr[0] ){
		emsg = earr[0];
	    }
	} else {
	    doerr = false;
	}
    } else if( typeof epattern === "object" ){
	e = epattern;
    }
    // default is to throw the error
    if( args.length < 3 ){
	dothrow = true;
    }
    // maybe throw error and send message to user
    if( doerr ){
	// add error object message to emsg, if possible
	if( e && e.message ){
	    emsg += ` (${e.message})`;
	} else if( emsg ){
	    e = new Error(emsg);
	}
	// try to add stacktrace
	s = JS9.strace(e);
	if( s ){
	    stack = `\n\nStacktrace:\n${s}`;
	}
	// can be set "outside" to prevent the alert message
	// (for example, in the console window)
	if( JS9.globalOpts.alerts ){
	    if( emsg && typeof emsg === "string" && emsg.search(/ERROR/) < 0 ){
		emessage = "JS9 ERROR: ";
	    }
	    emessage += emsg + stack;
	    alert(emessage);
	}
	// throw error, if necessary
	if( dothrow ){
	    throw e;
	}
    }
};

// log to console
JS9.log = function(...args){
    if( (window.console !== undefined) && (window.console.log !== undefined) ){
	// eslint-disable-next-line no-console
        console.log(...args);
    }
};

// we use keydown instead of keypress, so we need ...
// http://stackoverflow.com/questions/2220196/how-to-decode-character-pressed-from-jquerys-keydowns-event-handler
// ... for conversion of keydown into char string
JS9.eventToCharStr = function(evt){
    let c, s;
    const _specialKeys = {
	"37": "leftArrow",
	"38": "upArrow",
	"39": "rightArrow",
	"40": "downArrow",
	 "8": "delete"
    };
    const _to_ascii = {
        "188": "44",
        "109": "45",
        "190": "46",
        "191": "47",
        "192": "96",
        "220": "92",
        "222": "39",
        "221": "93",
        "219": "91",
        "173": "45",
        "187": "61", //IE Key codes
        "186": "59", //IE Key codes
        "189": "45"  //IE Key codes
    };
    const _shiftUps = {
        "96": "~",
        "49": "!",
        "50": "@",
        "51": "#",
        "52": "$",
        "53": "%",
        "54": "^",
        "55": "&",
        "56": "*",
        "57": "(",
        "48": ")",
        "45": "_",
        "61": "+",
        "91": "{",
        "93": "}",
        "92": "|",
        "59": ":",
        "39": "\"",
        "44": "<",
        "46": ">",
        "47": "?"
    };
    // allow direct specification of keycode as a number
    if( typeof evt === "number" ){
	c = evt;
    } else {
	// otherwise its the event
	c = evt.which || evt.keyCode;
    }
    s = String(c);
    // normalize keyCode
    if( {}.hasOwnProperty.call(_to_ascii, s) ){
        c = _to_ascii[s];
    }
    if( !evt.shiftKey && (c >= 65 && c <= 90) ){
        c = String.fromCharCode(c + 32);
    } else if( !evt.shiftKey && {}.hasOwnProperty.call(_specialKeys, c) ){
        c = _specialKeys[c];
    } else if( evt.shiftKey  && {}.hasOwnProperty.call(_shiftUps, c) ){
        //get shifted keyCode value
        c = _shiftUps[c];
    } else {
        c = String.fromCharCode(c);
    }
    // check for special key
    if( JS9.specialKey(evt) ){
	c = `M-${c}`;
    }
    return c;
};

// get position of mouse in a canvas
// http://stackoverflow.com/questions/1114465/getting-mouse-location-in-canvas
JS9.eventToDisplayPos = function(evt, offset){
    // from http://www.quirksmode.org/js/events_properties.html
    let i, targ, pageX, pageY, leftOff, upOff, touches, pos;
    const XFUDGE = 1;
    const YFUDGE = 1;
    if( !evt ){
	evt = window.event;
    }
    if( evt.target ){
        targ = evt.target;
    } else if( evt.srcElement ){
        targ = evt.srcElement;
    }
    if( targ.nodeType === 3 ){ // defeat Safari bug
        targ = targ.parentNode;
    }
    // offset() returns the position of the element relative to the document
    offset = offset || $(targ).offset();
    // pageX, pageY: mouse positions relative to the document
    // changed touch events: take position from first finger
    if( evt.originalEvent ){
	if( evt.originalEvent.touches &&
	    evt.originalEvent.touches.length ){
	    touches = evt.originalEvent.touches;
	    pageX = touches[0].pageX;
	    pageY = touches[0].pageY;
	} else if( evt.originalEvent.changedTouches &&
		   evt.originalEvent.changedTouches.length ){
	    touches = evt.originalEvent.changedTouches;
	    pageX = touches[0].pageX;
	    pageY = touches[0].pageY;
	} else {
	    pageX = evt.pageX;
	    pageY = evt.pageY;
	}
    } else {
	// mouse events
	pageX = evt.pageX;
	pageY = evt.pageY;
    }
    // position is (evt pos relative to page - pos of element relative to page)
    // FUDGE added after visual inspection of line512 at zoom 32
    // I tried to place the mouse, and have the magnifier be in the right place
    // Linux, FF & Chrome: x=1, y=1 (5/28/14)
    leftOff = offset.left + XFUDGE;
    upOff = offset.top  + YFUDGE;
    // display position
    pos = {x: Math.floor(pageX - leftOff), y: Math.floor(pageY - upOff)};
    // touch positions, if necessary
    if( touches && touches.length ){
	pos.touches = [{x: pos.x, y: pos.y}];
	for(i=1; i<touches.length; i++){
	    pos.touches[i] = {x: Math.floor(touches[i].pageX - leftOff),
			      y: Math.floor(touches[i].pageY - upOff)};
	}
    }
    return pos;
};

// convert image pixels in one image to image pixels in another image
// NB: assumes both images have wcs available
JS9.pix2pix = function(im1, im2, obj){
    let s, ra, dec, x, y, nx, ny;
    const epsilon = 0.5;
    // sanity check
    if( !im1 || !im2 || im1.raw.wcs <= 0 || im2.raw.wcs <= 0 ){ return obj; }
    // convenience variables
    x = obj.x;
    y = obj.y;
    // convert image pixels to ra, dec in source image
    s = JS9.pix2wcs(im1.raw.wcs, x, y).trim().split(/\s+/);
    ra = JS9.saostrtod(s[0]);
    if( JS9.isHMS(im1.params.wcssys) ){
	ra *= 15.0;
    }
    dec = JS9.saostrtod(s[1]);
    // convert ra, dec to image coords in dest image
    s = JS9.wcs2pix(im2.raw.wcs, ra, dec).trim().split(/\s+/);
    nx = parseFloat(s[0]);
    ny = parseFloat(s[1]);
    // lord, save us from wcs transformation jitter
    if( Math.abs(nx - x) < epsilon ){ nx = x; }
    if( Math.abs(ny - y) < epsilon ){ ny = y; }
    // return image pixels
    return {x: nx, y: ny};
};

// calculate angular distance, based on P.T. Wallaces's slalib routines,
// which were acquired from him via email 6/29/2020, converted to javascript
// could also use newer routines from www.iausofa.org, but ...
// input values are in degrees
JS9.angdist = function(ra1, dec1, ra2, dec2){
    let a, b, dist;
    const slaDcs2c = (a, b) => {
	let v = [];
	let cosb = Math.cos ( b );
	v[0] = Math.cos ( a ) * cosb;
	v[1] = Math.sin ( a ) * cosb;
	v[2] = Math.sin ( b );
	return v;
    };
    // modified from P.T. Wallace (acquired via email 6/29/2020)
    const slaDpav = (v1, v2) => {
	let x0, y0, z0, w, x1, y1, z1, s, c;
	/* Unit vector to point 1. */
	x0 = v1 [ 0 ];
	y0 = v1 [ 1 ];
	z0 = v1 [ 2 ];
	w = Math.sqrt ( x0 * x0 + y0 * y0 + z0 * z0 );
	if( w != 0.0 ) { x0 /= w; y0 /= w; z0 /= w; }
	/* Vector to point 2. */
	x1 = v2 [ 0 ];
	y1 = v2 [ 1 ];
	z1 = v2 [ 2 ];
	/* Position angle. */
	s = y1 * x0 - x1 * y0;
	c = z1 * ( x0 * x0 + y0 * y0 ) - z0 * ( x1 * x0 + y1 * y0 );
	return ( s != 0.0 || c != 0.0 ) ? Math.atan2 ( s, c ) : 0.0;
    };
    const d2r = (x) => { return x * Math.PI / 180; };
    const r2d = (x) => { return x * 180 / Math.PI; };
    a = slaDcs2c(d2r(ra1), d2r(dec1));
    b = slaDcs2c(d2r(ra2), d2r(dec2));
    dist = slaDpav(a, b);
    // negation required to be in line with our conventions
    dist = -dist;
    return r2d(dist);
};

// http://stackoverflow.com/questions/13695317/rotate-a-point-around-another-point
// angle is input in degrees
JS9.rotatePoint = function(point, angle, cen)
{
    let cosA, sinA;
    cen = cen || {x: 0.0, y: 0.0};
    angle = Math.PI * angle / 180.0;
    cosA = Math.cos(angle);
    sinA = Math.sin(angle);
    return {
        x: (cosA * (point.x - cen.x) - sinA * (point.y - cen.y) + cen.x),
	y: (sinA * (point.x - cen.x) + cosA * (point.y - cen.y) + cen.y)
    };
};

// multiply two matrices
// https://stackoverflow.com/questions/27205018/multiply-2-matrices-in-javascript
JS9.matrixMultiply = function(a, b){
    let r, c, i, m;
    const aNumRows = a.length, aNumCols = a[0].length;
    // eslint-disable-next-line no-unused-vars
    const bNumRows = b.length, bNumCols = b[0].length;
    m = new Array(aNumRows);  // initialize array of rows
    for(r = 0; r < aNumRows; ++r){
	m[r] = new Array(bNumCols); // initialize the current row
	for(c = 0; c < bNumCols; ++c){
	    m[r][c] = 0;             // initialize the current cell
	    for(i = 0; i < aNumCols; ++i){
		m[r][c] += a[r][i] * b[i][c];
	    }
	}
    }
    return m;
};

// invert a 3x3 matrix
JS9.invertMatrix3 = function(xin){
    let i, j, det_1;
    let pos = 0.0;
    let neg = 0.0;
    let temp =  xin[0][0] * xin[1][1];
    const prec = 1.0e-15;
    const xout = [[0,0,0], [0,0,0], [0,0,0]];
    const accum = () => {
	if( temp >= 0.0 ){
	    pos += temp;
	} else {
	    neg += temp;
	}
    };
    // sanity check for NaN
    for(i=0; i<3; i++){
	for(j=0; j<2; j++){
	    if( (xin[i][j] === undefined) || Number.isNaN(xin[i][j]) ){
		return null;
	    }
	}
    }
    accum();
    temp = -xin[0][1] * xin[1][0];
    accum();
    det_1 = pos + neg;
    // Is the submatrix A singular?
    if( (det_1 === 0.0) || (Math.abs(det_1 / (pos - neg)) < prec) ){
	// Matrix M has no inverse
	return null;
    }
    // Calculate inverse(A) = adj(A) / det(A)
    det_1 = 1.0 / det_1;
    xout[0][0] =   xin[1][1] * det_1;
    xout[1][0] = - xin[1][0] * det_1;
    xout[0][1] = - xin[0][1] * det_1;
    xout[1][1] =   xin[0][0] * det_1;
    // Calculate -C * inverse(A)
    xout[2][0] = - (xin[2][0] * xout[0][0] + xin[2][1] * xout[1][0]);
    xout[2][1] = - (xin[2][0] * xout[0][1] + xin[2][1] * xout[1][1]);
    return xout;
};

// native replacements for the jQuery utility functions JS9 used to call
// ($.extend / $.inArray / $.isArray -> Array.isArray). These mirror jQuery's
// semantics exactly (ported from jQuery 3.x, MIT) so the swap is behavior-for-
// behavior; keeping them in-house removes JS9's reliance on jQuery as a utility
// library (jQuery is still used for DOM/plugins).

// is obj a plain object ({} or new Object), not a DOM node, array, etc.?
JS9.isPlainObject = function(obj){
    let proto, ctor;
    if( !obj || Object.prototype.toString.call(obj) !== "[object Object]" ){
	return false;
    }
    proto = Object.getPrototypeOf(obj);
    // objects with no prototype (e.g. Object.create(null)) are plain
    if( !proto ){
	return true;
    }
    // objects with a prototype are plain iff made by the global Object function
    ctor = Object.prototype.hasOwnProperty.call(proto, "constructor") &&
	   proto.constructor;
    return typeof ctor === "function" &&
	   Function.prototype.toString.call(ctor) ===
	   Function.prototype.toString.call(Object);
};

// merge the contents of two or more objects into the first; a leading boolean
// true triggers a deep (recursive) merge. Faithful port of jQuery's $.extend.
JS9.extend = function(...args){
    let options, name, src, copy, copyIsArray, clone;
    let target = args[0] || {};
    let i = 1;
    const length = args.length;
    let deep = false;
    // handle a deep copy situation
    if( typeof target === "boolean" ){
	deep = target;
	target = args[i] || {};
	i++;
    }
    // handle case when target is a string or something (possible in deep copy)
    if( typeof target !== "object" && typeof target !== "function" ){
	target = {};
    }
    for( ; i < length; i++ ){
	options = args[i];
	// only deal with non-null/undefined values
	if( options == null ){
	    continue;
	}
	// extend the base object
	for( name in options ){
	    copy = options[name];
	    // prevent Object.prototype pollution and never-ending loop
	    if( name === "__proto__" || target === copy ){
		continue;
	    }
	    src = target[name];
	    // recurse if we're merging plain objects or arrays
	    if( deep && copy &&
		( JS9.isPlainObject(copy) ||
		  (copyIsArray = Array.isArray(copy)) ) ){
		if( copyIsArray ){
		    copyIsArray = false;
		    clone = src && Array.isArray(src) ? src : [];
		} else {
		    clone = src && JS9.isPlainObject(src) ? src : {};
		}
		// never move original objects, clone them
		target[name] = JS9.extend(deep, clone, copy);
	    } else if( copy !== undefined ){
		// don't bring in undefined values
		target[name] = copy;
	    }
	}
    }
    // return the modified object
    return target;
};

// index of elem in arr (or -1); faithful port of jQuery's $.inArray
JS9.inArray = function(elem, arr, i){
    return arr == null ? -1 : Array.prototype.indexOf.call(arr, elem, i);
};

// is this a string representation of a number?
// https://stackoverflow.com/questions/175739/built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number
// NB: don't use Number.XXX routines, they don't work .. "2016-5" returns true
JS9.isNumber = function(s){
    return !isNaN(parseFloat(s)) && isFinite(s);
};

// check if a variable is neither undefined nor null
JS9.notNull = function(s){
    return s !== undefined && s !== null;
};

// check if a variable is either undefined or null
JS9.isNull = function(s){
    return s === undefined || s === null;
};

// use a default if a variable is either undefined or null
JS9.defNull = function(s, def){
    return JS9.notNull(s) ? s : def;
};

// check if a wcs system is a world coordinate system (fk5, etc)
JS9.isWCSSys = function(s){
    return s !== "image" && s !== "physical";
};

// check if a wcs system is not a world coordinate system (fk5, etc)
JS9.notWCS = function(s){
    return s === "image" || s === "physical";
};

// was last parsed string in units of hours/min/sec (using specified wcssys)?
JS9.isHMS = function(wcssys, dtype){
    dtype = dtype || String.fromCharCode(JS9.saodtype());
    return (dtype === ":" || dtype === "h") &&
	    wcssys !== "galactic"           &&
	    wcssys !== "ecliptic";
};

// is this a HEALPix image?
JS9.ishealpix = function(im){
    return im                                                      &&
	im.imtab === "table"                                       &&
	im.raw && im.raw.header                                    &&
	im.raw.header.CTYPE1 &&	im.raw.header.CTYPE1.match(/--HPX/i);
};

// is the proxy server available for LoadProxy() call?
JS9.proxyAvailable = function(){
    return JS9.globalOpts.loadProxy          &&
        !JS9.allinone                        &&
        JS9.globalOpts.helperType !== "none" &&
        JS9.globalOpts.workDir;
}

// parse a FITS card and return name and value
JS9.cardpars = function(card){
    let value;
    let name = card.slice(0, 8).trim();
    if( name === "HISTORY" ){ return [name, card.slice(9).trim()]; }
    if( name === "COMMENT" ){ return [name, card.slice(9).trim()]; }
    if( card[8] !== "=" ){ return undefined; }
    value = card.slice(10).replace(/'/g, " ").replace(/ \/.*/, "").trim();
    if( value === "T" ){
	value = true;
    } else if( value === "F" ){
	value = false;
    } else if( JS9.isNumber(value) ){
	value = parseFloat(value);
    }
    return [name, value];
};

// convert obj to FITS-style string
JS9.raw2FITS = function(raw, opts){
    let i, s, obj, key, val, card, ncard, header, left;
    let hasend = false;
    let t = "";
    const gots = {};
    const rexp = /^(NAXIS|CRPIX|CRVAL|CTYPE|CUNIT|CDELT)[34567]/;
    const fixparam = (card, name, val, comm) => {
	let s, oval, regexp;
	let ncard = card;
	if( name === "XTENSION" && !val ){
	    ncard = sprintf("%s  = %20s / %-47s",
			    "SIMPLE",
			    "T",
			    "file does conform to FITS standard");

	} else {
	    // eslint-disable-next-line no-useless-escape
	    regexp = new RegExp(`${name} *= *(-?[-+]?[0-9]*\.?[0-9]*([eE][-+]?[0-9]+)?) *`);
	    if( card ){
		s = card.replace(regexp, "$1");
		oval = parseFloat(s);
	    } else {
		oval = undefined;
	    }
	    if( oval !== val ){
		ncard = sprintf("%-8s= %20s / %-47s", name, val, comm||"");
	    }
	}
	gots[name] = true;
	return ncard;
    };
    // sanity check
    if( !raw ){ return t; }
    // opts is optional
    opts = opts || {};
    // backward compatibility: orig. version used boolean to specify addcr
    if( typeof opts === "boolean" ){
	opts = {addcr: opts};
    }
    // raw.card and raw.cardstr contain comments: use them if possible
    if( raw.card || raw.cardstr ){
	header = raw.header || {};
	if( raw.card ){
	    ncard = raw.card.length;
	} else {
	    ncard = raw.ncard;
	}
	for(i=0; i<ncard; i++){
	    if( raw.card ){
		card = raw.card[i].slice(0, 80);
	    } else {
		card = raw.cardstr.slice(i*80, (i+1)*80);
	    }
	    if( opts.notab && card.match(/^TAB(TYP|MIN|MAX|DIM)[1,2]/) ){
		continue;
	    }
	    // change values which get set in mkRawDataFromHDU()
	    if( card.match(/^XTENSION/) && i === 0 && opts.simple ){
		t += fixparam(card, "XTENSION");
	    } else if( card.match(/^BITPIX /) && raw.bitpix ){
		t += fixparam(card, "BITPIX", raw.bitpix, "bits/pixel");
	    } else if( card.match(/^NAXIS1 /) && raw.width ){
		t += fixparam(card, "NAXIS1", raw.width, "x image dim");
	    } else if( card.match(/^NAXIS2 /) && raw.height ){
		t += fixparam(card, "NAXIS2", raw.height, "y image dim");
	    } else if( card.match(/^CRPIX1 /) && JS9.notNull(header.CRPIX1) ){
		t += fixparam(card, "CRPIX1", header.CRPIX1, "ref point");
	    } else if( card.match(/^CRPIX2 /) && JS9.notNull(header.CRPIX2) ){
		t += fixparam(card, "CRPIX2", header.CRPIX2, "ref point");
	    } else if( card.match(/^CDELT1 /) && JS9.notNull(header.CDELT1) ){
		t += fixparam(card, "CDELT1", header.CDELT1, "deg/pixel");
	    } else if( card.match(/^CDELT2 /) && JS9.notNull(header.CDELT2) ){
		t += fixparam(card, "CDELT2", header.CDELT2, "deg/pixel");
	    } else if( card.match(/^CD1_1 /) && JS9.notNull(header.CD1_1) ){
		t += fixparam(card, "CD1_1", header.CD1_1, "WCS matrix value");
	    } else if( card.match(/^CD1_2 /) && JS9.notNull(header.CD1_2) ){
		t += fixparam(card, "CD1_2", header.CD1_2, "WCS matrix value");
	    } else if( card.match(/^CD2_1 /) && JS9.notNull(header.CD2_1) ){
		t += fixparam(card, "CD2_1", header.CD2_1, "WCS matrix value");
	    } else if( card.match(/^CD2_2 /) && JS9.notNull(header.CD2_2) ){
		t += fixparam(card, "CD2_2", header.CD2_2, "WCS matrix value");
	    } else if( card.match(/^LTV1 /) && JS9.notNull(header.LTV1) ){
		t += fixparam(card, "LTV1", header.LTV1, "IRAF ref. point");
	    } else if( card.match(/^LTV2 /) && JS9.notNull(header.LTV2) ){
		t += fixparam(card, "LTV2", header.LTV2, "IRAF ref. point");
	    } else if( card.match(/^LTM1_1 /) && JS9.notNull(header.LTM1_1) ){
		t += fixparam(card, "LTM1_1", header.LTM1_1, "IRAF matrix value");
	    } else if( card.match(/^LTM1_2 /) && JS9.notNull(header.LTM1_2) ){
		t += fixparam(card, "LTM1_2", header.LTM1_2, "IRAF matrix value");
	    } else if( card.match(/^LTM2_1 /) && JS9.notNull(header.LTM2_1) ){
		t += fixparam(card, "LTM2_1", header.LTM2_1, "IRAF matrix value");
	    } else if( card.match(/^LTM2_2 /) && JS9.notNull(header.LTM2_2) ){
		t += fixparam(card, "LTM2_2", header.LTM2_2, "IRAF matrix value");
	    } else if( opts.twoaxes && card.match(/^NAXIS /) ){
		t += fixparam(card, "NAXIS", 2, "number of data axes");
	    } else if( opts.twoaxes && card.match(/^(NAXIS|CRPIX|CRVAL|CTYPE|CUNIT|CDELT)[34567]/) ){
		continue;
	    } else if( opts.twoaxes && card.match(/^(DATASUM|CHECKSUM)/) ){
		continue;
	    } else if( card.substring(0,4) === "END " ){
		// try to add LTM/LTV if they were not present originally
		if( JS9.notNull(header.LTV1) && !gots.LTV1 ){
		    t += fixparam(null, "LTV1", header.LTV1, "IRAF ref. point");
		    if( opts.addcr ){ t += "\n"; }
		}
		if( JS9.notNull(header.LTV2) && !gots.LTV2 ){
		    t += fixparam(null, "LTV2", header.LTV2, "IRAF ref. point");
		    if( opts.addcr ){ t += "\n"; }
		}
		if( JS9.notNull(header.LTM1_1) && !gots.LTM1_1 ){
		    t += fixparam(null, "LTM1_1", header.LTM1_1, "IRAF matrix value");
		    if( opts.addcr ){ t += "\n"; }
		}
		if( JS9.notNull(header.LTM1_2) && !gots.LTM1_2 ){
		    t += fixparam(null, "LTM1_2", header.LTM1_2, "IRAF matrix value");
		    if( opts.addcr ){ t += "\n"; }
		}
		if( JS9.notNull(header.LTM2_1) && !gots.LTM2_1 ){
		    t += fixparam(null, "LTM2_1", header.LTM2_1, "IRAF matrix value");
		    if( opts.addcr ){ t += "\n"; }
		}
		if( JS9.notNull(header.LTM2_2) && !gots.LTM2_2 ){
		    t += fixparam(null, "LTM2_2", header.LTM2_2, "IRAF matrix value");
		    if( opts.addcr ){ t += "\n"; }
		}
		// add the end card
		t += card;
		// mark we did so
		hasend = true;
	    } else {
		t += card;
	    }
	    if( opts.addcr ){
		t += "\n";
	    }
	}
    } else if( raw.header || raw.BITPIX ){
	if( raw.header ){
	    // minimal header without comments
	    obj = raw.header;
	} else {
	    // directly specified object containing header without comments
	    obj = raw;
	}
	// cfitsio requires simple and bitpix to be first and second params
	if( obj.SIMPLE !== undefined || obj.simple !== undefined ){
	    if( obj.SIMPLE !== undefined ){
		val = obj.SIMPLE;
	    } else {
		val = obj.simple;
	    }
	    if( val === true ){
		val = "T";
	    } else if( val === false ){
		val = "F";
	    }
	    t += sprintf("%-8s= %20s / %-47s", "SIMPLE", val, "conforms to FITS standard");
	    if( opts.addcr ){ t += "\n"; }
	}
	if( obj.BITPIX !== undefined || obj.bitpix !== undefined ){
	    if( obj.BITPIX !== undefined ){
		val = obj.BITPIX;
	    } else {
		val = obj.bitpix;
	    }
	    t += sprintf("%-8s= %20s / %-47s", "BITPIX", val, "bits/pixel");
	    if( opts.addcr ){ t += "\n"; }
	}
	for( key of Object.keys(obj) ){
	    if( key === "js9Protocol" || key === "js9Endian" ){
		continue;
	    }
	    if( key === "SIMPLE" || key === "simple" ){
		continue;
	    }
	    if( key === "BITPIX" || key === "bitpix" ){
		continue;
	    }
	    if( key === "END" ){
		hasend = true;
	    }
	    if( opts.twoaxes && key === "NAXIS" ){
		obj[key] = 2;
	    }
	    if( opts.twoaxes && key.match(rexp) ){
		continue;
	    }
	    if( key.match(/HISTORY__[0-9]+/) ){
		t += sprintf("HISTORY %-72s", obj[key]);
	    } else if( key.match(/COMMENT__[0-9]+/) ){
		t += sprintf("COMMENT %-72s", obj[key]);
	    } else {
		val = obj[key];
		if( val === true ){
		    val = "T";
		} else if( val === false ){
		    val = "F";
		} else if( val === "" ){
		    val = "' '";
		} else if( Number.isNaN(val) ){
		    val = "NaN";
		} else if( !JS9.isNumber(val) && val.charAt(0) !== "'" ){
		    val = `'${val}'`;
		}
		s = sprintf("%-8s= %20s", key, val);
		left = 80 - s.length;
		if( left > 0 ){
		    for(i=0; i<left; i++){
			s += " ";
		    }
		}
		t += s;
	    }
	    if( opts.addcr ){
		t += "\n";
	    }
	}
    }
    // add end card, if necessary
    if( !hasend ){
	t += sprintf("%-8s%-72s", "END", " ");
	if( opts.addcr ){
	    t += "\n";
	}
    }
    return t;
};

// convert an array of hdu objects into a nice string
JS9.hdus2Str = function(hdus){
    let i, j, s, obj;
    let t = "";
    // sanity check
    if( !hdus ){ return t; }
    for(i=0; i<hdus.length; i++){
	obj = hdus[i];
	if( obj.name ){
	    s = obj.name;
	} else if( i === 0 ){
	    s = "Primary";
	} else {
	    s = "N/A";
	}
	t += sprintf("<b>#%d</b>:&#09;<b>name</b>: %s&#09;<b>type</b>: %s",
		     obj.hdu, s, obj.type);
	switch(obj.type){
	case "image":
	    t += sprintf("&#09;<b>bitpix</b>: %d&#09;<b>naxis</b>: %d", obj.bitpix, obj.naxis);
	    if( obj.naxes.length ){
		t += "&#09;<b>axes</b>: [";
		for(j=0; j<obj.naxes.length; j++){
		    t += sprintf("%d", obj.naxes[j]);
		    if( j !== obj.naxes.length-1 ){
			t += ", ";
		    }
		}
		t += "]";
	    }
	    break;
	case "table":
	case "ascii":
	    s = "&#09;";
	    if( obj.rows <= 9 ){
		s += "&#09;";
	    }
	    t += sprintf("&#09;<b>rows</b>: %d%s<b>cols</b>: [", obj.rows, s);
	    for(j=0; j<obj.cols.length; j++){
		t += `${obj.cols[j].name}`;
		if( JS9.notNull(obj.cols[j].min) &&
		    JS9.notNull(obj.cols[j].max) ){
		    t += `:${obj.cols[j].min}:${obj.cols[j].max}`;
		}
		if( j !== obj.cols.length-1 ){
		    t += ", ";
		}
	    }
	    t += "]";
	    break;
	}
	t += "\n\n";
    }
    return t;
};

// clear canvas
// http://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
CanvasRenderingContext2D.prototype.clear =
  CanvasRenderingContext2D.prototype.clear || function (preserveTransform){
    if (preserveTransform){
      this.save();
      this.setTransform(1, 0, 0, 1, 0, 0);
    }
    this.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (preserveTransform){
      this.restore();
    }
};

// create a searchbar on a div using: https://markjs.io/
// routine adapted from: https://jsfiddle.net/julmot/973gdh8g/
JS9.searchbar = function(el, textid){
    let div, text, bar;
    let srch, next, prev, close;
    let matchcase, matchdiacritics, matchwords, matchwildcards;
    const jel = $(el);
    const currentClass = "current";
    const offsetTop = 50;
    const search = (value) => {
	let searchVal = value;
	text.unmark({
	    done: () => {
		text.mark(searchVal, {
		    caseSensitive: bar.opts.matchcase,
		    diacritics: bar.opts.diacritics,
		    accuracy: bar.opts.matchwords ? "exactly" : "partially",
		    wildcards: bar.opts.matchwildcards ? "enabled" : "disabled",
		    done: () => {
			bar.results = text.find("mark");
			bar.currentIndex = 0;
			jumpTo();
		    }
		});
	    }
	});
    };
    const btnColor = (which) => {
	const s = which.prop("data-btn");
	if( bar.opts[s] ){
	    which.removeClass("JS9SearchButton-false");
	    which.addClass("JS9SearchButton-true");
	} else {
	    which.removeClass("JS9SearchButton-true");
	    which.addClass("JS9SearchButton-false");
	}
    };
    const jumpTo = () => {
	let cur, pos;
	if( bar.results.length ){
	    cur = bar.results.eq(bar.currentIndex);
	    bar.results.removeClass(currentClass);
	    if( cur.length ){
		cur.addClass(currentClass);
		pos = cur.position().top;
		if( pos < 0 || pos > div.height() ){
		    pos = pos + div.scrollTop() - offsetTop;
                    div.scrollTop(pos);
		}
	    }
	}
    };
    textid = textid || ".JS9AnalysisText";
    // make sure we have text
    if( jel.is(textid) ){
	text = jel;
    } else {
	text = jel.find(textid);
	if( !text.length ){
	    return;
	}
    }
    // light window or div?
    div = jel.find(JS9.lightOpts[JS9.LIGHTWIN].drag);
    if( !div.length ){
	// just a div
	div = jel;
    }
    // does the searchbar already exist?
    bar = div.find(".JS9Searchbar");
    if( bar.length ){
	// make it visiable and return
	bar.css("display", "block");
	return;
    }
    // make a new searchbar
    bar = $("<div>")
	.addClass("JS9Searchbar")
	.appendTo(div);
    // add options
    bar.opts = {
	matchcase: false,
	matchdiacritics: false,
	matchwords: false,
	matchwildcards: false,
    };
    // search text box
    srch = $("<input type='search'>")
	.addClass("JS9SearchInput")
	.appendTo(bar);
    // event fires with each keystroke
    srch.on("input", () => {
	search(srch.val());
    });
    // placeholder hints
    if( bar.opts.matchwildcards ){
	srch.prop("placeholder", "sea*rch template?");
    } else {
	srch.prop("placeholder", "search term(s)");
    }
    // find next occurence
    next = $("<button>")
	.addClass("JS9SearchButton")
	.prop("data-btn", "next")
	.html("&darr;")
	.appendTo(bar);
    // find previous occurence
    prev = $("<button>")
	.addClass("JS9SearchButton")
	.prop("data-btn", "prev")
	.html("&uarr;")
	.appendTo(bar);
    // event callback for next and prev
    next.add(prev).on("click", (e) => {
	if( bar.results && bar.results.length) {
	    bar.currentIndex += $(e.currentTarget).is(prev) ? -1 : 1;
	    if( bar.currentIndex < 0 ){
		bar.currentIndex = bar.results.length - 1;
	    }
	    if( bar.currentIndex > bar.results.length - 1 ){
		bar.currentIndex = 0;
	    }
	    jumpTo();
	}
    });
    matchcase = $("<button>")
	.addClass(`JS9SearchButton JS9SearchButton-${bar.opts.matchcase}`)
	.prop("data-btn", "matchcase")
	.html("Match Case")
	.appendTo(bar);
    matchcase.on("click", () => {
	bar.opts.matchcase = !bar.opts.matchcase;
	btnColor(matchcase);
	search(srch.val());
    });
    btnColor(matchcase);
    matchdiacritics = $("<button>")
	.addClass(`JS9SearchButton JS9SearchButton-${bar.opts.matchdiacritics}`)
	.prop("data-btn", "matchdiacritics")
	.html("Match Diacritics")
	.appendTo(bar);
    matchdiacritics.on("click", () => {
	bar.opts.matchdiacritics = !bar.opts.matchdiacritics;
	btnColor(matchdiacritics);
	search(srch.val());
    });
    btnColor(matchdiacritics);
    matchwords = $("<button>")
	.addClass(`JS9SearchButton JS9SearchButton-${bar.opts.matchwords}`)
	.prop("data-btn", "matchwords")
	.html("Whole Words")
	.appendTo(bar);
    matchwords.on("click", () => {
	bar.opts.matchwords = !bar.opts.matchwords;
	btnColor(matchwords);
	search(srch.val());
    });
    btnColor(matchwords);
    matchwildcards = $("<button>")
	.addClass(`JS9SearchButton JS9SearchButton-${bar.opts.matchwildcards}`)
	.prop("data-btn", "matchwildcards")
	.html("Wildcards")
	.appendTo(bar);
    matchwildcards.on("click", () => {
	bar.opts.matchwildcards = !bar.opts.matchwildcards;
	if( bar.opts.matchwildcards ){
	    srch.prop("placeholder", "sea*rch template?");
	} else {
	    srch.prop("placeholder", "search term(s)");
	}
	btnColor(matchwildcards);
	search(srch.val());
    });
    btnColor(matchwildcards);
    // close the searchbar
    close = $("<button>")
	.addClass("JS9SearchButton")
	.prop("data-btn", "close")
	.html("Close")
	.appendTo(bar);
    close.on("click", () => {
	text.unmark();
	srch.val("");
	bar.css("display", "none");
    });
    // no outline on focus
    div.css("outline", "none");
    // set tabindex so we can sense keyboard events
    div.attr("tabindex", "0");
    // meta-k will bring up the searchbar
    div.on("keydown", (evt) => {
	const code = evt.which || evt.keyCode;
	const c = String.fromCharCode(code);
	if( JS9.specialKey(evt) && c === "F" ){
	    if( bar.css("display") === "none" ){
		bar.css("display", "block");
		srch.focus();
	    } else {
		text.unmark();
		srch.val("");
		bar.css("display", "none");
	    }
	}
    });
};

// create a tooltip, with the tip formatted from a string containing
// variables in the current context, e.g. "$im.id\n$xreg.imstr\n$xreg.data.tag"
JS9.tooltip = function(x, y, fmt, im, xreg, evt){
    let tipstr, tx, ty, w, h;
    const fmt2str = (str) => {
	// eslint-disable-next-line no-unused-vars
	const cmd = str.replace(/\$([a-zA-Z0-9_./]+)/g, (m, t, o) => {
            let i, v, val;
	    const arr = t.split(".");
	    switch(arr[0]){
	    case "im":
		val = im;
		break;
	    case "xreg":
		val = xreg;
		break;
	    case "evt":
		val = evt;
		break;
	    case "data":
		val = xreg.data;
		break;
	    default:
		return m;
	    }
	    for(i=1; i<arr.length; i++){
		v = val[arr[i]];
		if( JS9.isNumber(v) ){
		    val = v.toFixed(6);
		} else {
		    val = v;
		}
	    }
	    if( val === undefined ){
		val = "";
	    }
	    return val;
	});
	return cmd;
    };
    if( fmt ){
	tipstr = fmt2str(fmt);
	im.display.tooltip.html(tipstr);
	// get size of div ...
	w = im.display.tooltip.width();
	h = im.display.tooltip.height();
	// ... so we can place the tooltip properly
	tx = Math.max(2, Math.min(x, im.display.width - (w + 10)));
	ty = Math.max(2, Math.min(y, im.display.height - (h + 10)));
	im.display.tooltip.css({left:tx, top:ty, display: "inline-block"});
    } else {
	im.display.tooltip.html("").css({left: -9999, display: "none"});
    }
};

// http://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
// our modification will execute a real func or a funcName
// for argument parsing:
// https://stackoverflow.com/questions/13952870/regular-expression-to-get-parameter-list-from-function-definition
JS9.xeqByName = function(...args){
    let i, namespaces, func, targs;
    let [funcName, context] = args;
    let xargs = args.slice(2);
    let type = typeof funcName;
    switch( type ){
    case "function":
	return funcName.apply(context, xargs);
    case "string":
	// see if args are attached, i.e. ...func(arg1,arg2,...)
	targs = /\(\s*([^)]+?)\s*\)/.exec(funcName);
	if( targs && targs[1] ){
	    funcName = funcName.slice(0,targs.index);
	    xargs = targs[1].split(/\s*,\s*/);
	}
	namespaces = funcName.split(".");
	func = namespaces.pop();
	for(i = 0; i < namespaces.length; i++){
            context = context[namespaces[i]];
	}
	// see if a JS9 public function was implicitly specified
	if( typeof context[func] === "undefined" ){
	    if( typeof JS9.publics[func] === "function" ){
		context = JS9.publics;
	    }
	}
	return context[func](...xargs);
    default:
	JS9.error(`unknown func type: ${type}`);
	break;
    }
};

// return value of a variable passed as a string (based on above)
JS9.varByName = function(funcName, context){
    let i, namespaces, vname;
    context = context || JS9;
    namespaces = funcName.split(".");
    vname = namespaces.pop();
    for(i=0; i<namespaces.length; i++){
	context = context[namespaces[i]];
	if( !context ){
	    return null;
	}
    }
    return context[vname];
};

// merge preferences into global JS9 object
JS9.mergePrefs = function(obj){
    let otype, jtype, name;
    let domerge = false;
    // merge preferences with js9 objects and data
    obj = obj || {};
    for( name of Object.keys(obj) ){
	// handle config specially
	if( name === "config" ){
	    if( obj[name].objects === "merge" ){
		domerge = true;
	    }
	} else {
	    if( {}.hasOwnProperty.call(JS9, name) ){
		jtype = typeof JS9[name];
		otype = typeof obj[name];
		if( (jtype === otype) || (otype === "string") ){
		    switch(jtype){
		    case "object":
			if( Array.isArray(obj[name]) ){
			    // arrays get replaced completely
			    JS9[name] = obj[name];
			} else {
			    // objects get replaced or recursively extended
			    if( domerge ){
				JS9.extend(true, JS9[name], obj[name]);
			    } else {
				JS9.extend(JS9[name], obj[name]);
			    }
			}
			break;
		    case "number":
		    case "string":
			JS9[name] = obj[name];
			break;
		    default:
			break;
		    }
		}
	    }
	}
    }
};

// load a prefs file and merge preferences into global JS9 object
JS9.loadPrefs = function(url, doerr){
    // load site/user preferences synchronously
    // native sync XHR (jQuery async:false used the same primitive)
    try{
	JS9.mergePrefs(JS9.getJSONSync(url));
    }
    catch(e){
	if( doerr ){
	    JS9.log("JS9 prefs file not available: %s", url);
	}
    }
};

// is this object a typed array?
JS9.isTypedArray = function(obj){
    let type;
    const types = {
        "[object Int8Array]": true,
        "[object Uint8Array]": true,
        "[object Uint8ClampedArray]": true,
        "[object Int16Array]": true,
        "[object Uint16Array]": true,
        "[object Int32Array]": true,
        "[object Uint32Array]": true,
        "[object Float32Array]": true,
        "[object Float64Array]": true
    };
    type = Object.prototype.toString.call(obj);
    return {}.hasOwnProperty.call(types, type);
};

// starbase table support
// tab-delimited ascii tables, # in first line is a comment
JS9.Starbase = function(s, opts){
    let i, j, skips, dashes, data, cobj;
    let line = 0;
    const checkDashline = (dash) => {
	let i;
	for(i=0; i<dash.length; i++){
	    if( dash[i].match(/^-+$/) === null ){
		return 0;
	    }
	}
	return i;
    };
    const I = (x) => { return x; };
    // init returned object
    this.head = {};
    this.convFuncs = [];
    this.data = [];
    this.delims = [];
    // sanity check
    if( !s ){ return; }
    // opts is optional
    opts = opts || {};
    // get array of data lines
    data = s.replace(/\s+$/,"").split("\n");
    // skip comments
    if( opts.skip ){
	skips = opts.skip.split("");
	if( skips && skips.length ){
	    for(; line < data.length; line++){
		if( (skips[0] !== data[line][0])             &&
		    (skips[1] !== "\n" || data[line] !== "") ){
		    break;
		}
	    }
	}
    }
    // make sure we have a header to process
    if(  (data[line] === undefined) || (data[line+1] === undefined)  ){
	return;
    }
    // look for header and dashes, in various guises
    this.headline = data[line++].trim().split(/ *\t */);
    if( opts.units ){
	this.unitline = data[line++].trim().split(/ *\t */);
    }
    this.dashline = data[line++].trim().split(/ *\t */);
    dashes = checkDashline(this.dashline);
    // read lines until the dashline is found
    while ( dashes === 0 || dashes !== this.headline.length ){
	if( !opts.units ){
	    this.headline = this.dashline;
	} else {
	    this.headline = this.unitline;
	    this.unitline = this.dashline;
	}
	this.dashline = data[line++].trim().split(/ *\t */);
	dashes = checkDashline(this.dashline);
    }
    // process header:
    // replace "." with "_" in header names
    // create a vector of type converter funcs
    for(i=0; i<this.headline.length; i++ ){
	this.headline[i] = this.headline[i].replace(/\./g, "_");
	if( opts.convFuncs && opts.convFuncs[this.headline[i]] ){
	    this.convFuncs[i] = opts.convFuncs[this.headline[i]];
	} else {
	    if( opts.convFuncs && opts.convFuncs.def ){
		this.convFuncs[i] = opts.convFuncs.def;
	    } else {
		this.convFuncs[i] = I;
	    }
	}
    }
    // read each line of the data in and convert to type
    for(j = 0; line < data.length; line++, j++){
	// skip means end of data
	if( skips && skips.length ){
	    if( (skips[0] === data[line][0])             ||
		(skips[1] === "\n" && data[line] === "") ){
		break;
	    }
	}
	this.data[j] = data[line].split("\t");
	for(i=0; i<this.data[j].length; i++){
	    cobj = this.convFuncs[i](this.data[j][i]);
	    this.data[j][i] = cobj.val;
	    this.delims[i] = cobj.delim || null;
	}
    }
    // convenience indexes
    for(i = 0; i < this.headline.length; i++){
	this[this.headline[i]] = i;
    }
};

// http://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
// NB: colors are augmented by /opt/X11//share/X11/rgb.txt
JS9.colorToHex = function(color){
    let arr;
    const colors = {
"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff","beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887","cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff","darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f","darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1","darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff","firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff","gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f","honeydew":"#f0fff0","hotpink":"#ff69b4","indianred ":"#cd5c5c","indigo":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c","lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2","lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de","lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6","magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee","mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5","navajowhite":"#ffdead","navy":"#000080","oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6","palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080","rebeccapurple":"#663399","red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1","saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4","tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0","violet":"#ee82ee","wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5","yellow":"#ffff00","yellowgreen":"#9acd3","antiquewhite1":"#ffefdb","antiquewhite2":"#eedfcc","antiquewhite3":"#cdc0b0","antiquewhite4":"#8b8378","cadetblue1":"#98f5ff","cadetblue2":"#8ee5ee","cadetblue3":"#7ac5cd","cadetblue4":"#53868b","darkgoldenrod1":"#ffb90f","darkgoldenrod2":"#eead0e","darkgoldenrod3":"#cd950c","darkgoldenrod4":"#8b6508","darkgrey":"#a9a9a9","darkolivegreen1":"#caff70","darkolivegreen2":"#bcee68","darkolivegreen3":"#a2cd5a","darkolivegreen4":"#6e8b3d","darkorange1":"#ff7f00","darkorange2":"#ee7600","darkorange3":"#cd6600","darkorange4":"#8b4500","darkorchid1":"#bf3eff","darkorchid2":"#b23aee","darkorchid3":"#9a32cd","darkorchid4":"#68228b","darkseagreen1":"#c1ffc1","darkseagreen2":"#b4eeb4","darkseagreen3":"#9bcd9b","darkseagreen4":"#698b69","darkslategray1":"#97ffff","darkslategray2":"#8deeee","darkslategray3":"#79cdcd","darkslategray4":"#528b8b","darkslategrey":"#2f4f4f","deeppink1":"#ff1493","deeppink2":"#ee1289","deeppink3":"#cd1076","deeppink4":"#8b0a50","deepskyblue1":"#00bfff","deepskyblue2":"#00b2ee","deepskyblue3":"#009acd","deepskyblue4":"#00688b","dimgrey":"#696969","dodgerblue1":"#1e90ff","dodgerblue2":"#1c86ee","dodgerblue3":"#1874cd","dodgerblue4":"#104e8b","hotpink1":"#ff6eb4","hotpink2":"#ee6aa7","hotpink3":"#cd6090","hotpink4":"#8b3a62","indianred":"#cd5c5c","indianred1":"#ff6a6a","indianred2":"#ee6363","indianred3":"#cd5555","indianred4":"#8b3a3a","lavenderblush1":"#fff0f5","lavenderblush2":"#eee0e5","lavenderblush3":"#cdc1c5","lavenderblush4":"#8b8386","lemonchiffon1":"#fffacd","lemonchiffon2":"#eee9bf","lemonchiffon3":"#cdc9a5","lemonchiffon4":"#8b8970","lightblue1":"#bfefff","lightblue2":"#b2dfee","lightblue3":"#9ac0cd","lightblue4":"#68838b","lightcyan1":"#e0ffff","lightcyan2":"#d1eeee","lightcyan3":"#b4cdcd","lightcyan4":"#7a8b8b","lightgoldenrod":"#eedd82","lightgoldenrod1":"#ffec8b","lightgoldenrod2":"#eedc82","lightgoldenrod3":"#cdbe70","lightgoldenrod4":"#8b814c","lightgray":"#d3d3d3","lightpink1":"#ffaeb9","lightpink2":"#eea2ad","lightpink3":"#cd8c95","lightpink4":"#8b5f65","lightsalmon1":"#ffa07a","lightsalmon2":"#ee9572","lightsalmon3":"#cd8162","lightsalmon4":"#8b5742","lightskyblue1":"#b0e2ff","lightskyblue2":"#a4d3ee","lightskyblue3":"#8db6cd","lightskyblue4":"#607b8b","lightslateblue":"#8470ff","lightslategrey":"#778899","lightsteelblue1":"#cae1ff","lightsteelblue2":"#bcd2ee","lightsteelblue3":"#a2b5cd","lightsteelblue4":"#6e7b8b","lightyellow1":"#ffffe0","lightyellow2":"#eeeed1","lightyellow3":"#cdcdb4","lightyellow4":"#8b8b7a","mediumorchid1":"#e066ff","mediumorchid2":"#d15fee","mediumorchid3":"#b452cd","mediumorchid4":"#7a378b","mediumpurple1":"#ab82ff","mediumpurple2":"#9f79ee","mediumpurple3":"#8968cd","mediumpurple4":"#5d478b","mistyrose1":"#ffe4e1","mistyrose2":"#eed5d2","mistyrose3":"#cdb7b5","mistyrose4":"#8b7d7b","navajowhite1":"#ffdead","navajowhite2":"#eecfa1","navajowhite3":"#cdb38b","navajowhite4":"#8b795e","navyblue":"#000080","olivedrab1":"#c0ff3e","olivedrab2":"#b3ee3a","olivedrab3":"#9acd32","olivedrab4":"#698b22","orangered1":"#ff4500","orangered2":"#ee4000","orangered3":"#cd3700","orangered4":"#8b2500","palegreen1":"#9aff9a","palegreen2":"#90ee90","palegreen3":"#7ccd7c","palegreen4":"#548b54","paleturquoise1":"#bbffff","paleturquoise2":"#aeeeee","paleturquoise3":"#96cdcd","paleturquoise4":"#668b8b","palevioletred1":"#ff82ab","palevioletred2":"#ee799f","palevioletred3":"#cd6889","palevioletred4":"#8b475d","peachpuff1":"#ffdab9","peachpuff2":"#eecbad","peachpuff3":"#cdaf95","peachpuff4":"#8b7765","rosybrown1":"#ffc1c1","rosybrown2":"#eeb4b4","rosybrown3":"#cd9b9b","rosybrown4":"#8b6969","royalblue1":"#4876ff","royalblue2":"#436eee","royalblue3":"#3a5fcd","royalblue4":"#27408b","seagreen1":"#54ff9f","seagreen2":"#4eee94","seagreen3":"#43cd80","seagreen4":"#2e8b57","skyblue1":"#87ceff","skyblue2":"#7ec0ee","skyblue3":"#6ca6cd","skyblue4":"#4a708b","slateblue1":"#836fff","slateblue2":"#7a67ee","slateblue3":"#6959cd","slateblue4":"#473c8b","slategray1":"#c6e2ff","slategray2":"#b9d3ee","slategray3":"#9fb6cd","slategray4":"#6c7b8b","slategrey":"#708090","springgreen1":"#00ff7f","springgreen2":"#00ee76","springgreen3":"#00cd66","springgreen4":"#008b45","steelblue1":"#63b8ff","steelblue2":"#5cacee","steelblue3":"#4f94cd","steelblue4":"#36648b","violetred":"#d02090","violetred1":"#ff3e96","violetred2":"#ee3a8c","violetred3":"#cd3278","violetred4":"#8b2252","webgray":"#808080","webgreen":"#008000","webgrey":"#808080","webmaroon":"#800000","webpurple":"#800080","x11gray":"#bebebe","x11green":"#00ff00","x11grey":"#bebebe","x11maroon":"#b03060","x11purple":"#a020f0","aquamarine1":"#7fffd4","aquamarine2":"#76eec6","aquamarine3":"#66cdaa","aquamarine4":"#458b74","azure1":"#f0ffff","azure2":"#e0eeee","azure3":"#c1cdcd","azure4":"#838b8b","bisque1":"#ffe4c4","bisque2":"#eed5b7","bisque3":"#cdb79e","bisque4":"#8b7d6b","blue1":"#0000ff","blue2":"#0000ee","blue3":"#0000cd","blue4":"#00008b","brown1":"#ff4040","brown2":"#ee3b3b","brown3":"#cd3333","brown4":"#8b2323","burlywood1":"#ffd39b","burlywood2":"#eec591","burlywood3":"#cdaa7d","burlywood4":"#8b7355","chartreuse1":"#7fff00","chartreuse2":"#76ee00","chartreuse3":"#66cd00","chartreuse4":"#458b00","chocolate1":"#ff7f24","chocolate2":"#ee7621","chocolate3":"#cd661d","chocolate4":"#8b4513","coral1":"#ff7256","coral2":"#ee6a50","coral3":"#cd5b45","coral4":"#8b3e2f","cornsilk1":"#fff8dc","cornsilk2":"#eee8cd","cornsilk3":"#cdc8b1","cornsilk4":"#8b8878","cyan1":"#00ffff","cyan2":"#00eeee","cyan3":"#00cdcd","cyan4":"#008b8b","firebrick1":"#ff3030","firebrick2":"#ee2c2c","firebrick3":"#cd2626","firebrick4":"#8b1a1a","gold1":"#ffd700","gold2":"#eec900","gold3":"#cdad00","gold4":"#8b7500","goldenrod1":"#ffc125","goldenrod2":"#eeb422","goldenrod3":"#cd9b1d","goldenrod4":"#8b6914","gray0":"#000000","gray1":"#030303","gray10":"#1a1a1a","gray100":"#ffffff","gray11":"#1c1c1c","gray12":"#1f1f1f","gray13":"#212121","gray14":"#242424","gray15":"#262626","gray16":"#292929","gray17":"#2b2b2b","gray18":"#2e2e2e","gray19":"#303030","gray2":"#050505","gray20":"#333333","gray21":"#363636","gray22":"#383838","gray23":"#3b3b3b","gray24":"#3d3d3d","gray25":"#404040","gray26":"#424242","gray27":"#454545","gray28":"#474747","gray29":"#4a4a4a","gray3":"#080808","gray30":"#4d4d4d","gray31":"#4f4f4f","gray32":"#525252","gray33":"#545454","gray34":"#575757","gray35":"#595959","gray36":"#5c5c5c","gray37":"#5e5e5e","gray38":"#616161","gray39":"#636363","gray4":"#0a0a0a","gray40":"#666666","gray41":"#696969","gray42":"#6b6b6b","gray43":"#6e6e6e","gray44":"#707070","gray45":"#737373","gray46":"#757575","gray47":"#787878","gray48":"#7a7a7a","gray49":"#7d7d7d","gray5":"#0d0d0d","gray50":"#7f7f7f","gray51":"#828282","gray52":"#858585","gray53":"#878787","gray54":"#8a8a8a","gray55":"#8c8c8c","gray56":"#8f8f8f","gray57":"#919191","gray58":"#949494","gray59":"#969696","gray6":"#0f0f0f","gray60":"#999999","gray61":"#9c9c9c","gray62":"#9e9e9e","gray63":"#a1a1a1","gray64":"#a3a3a3","gray65":"#a6a6a6","gray66":"#a8a8a8","gray67":"#ababab","gray68":"#adadad","gray69":"#b0b0b0","gray7":"#121212","gray70":"#b3b3b3","gray71":"#b5b5b5","gray72":"#b8b8b8","gray73":"#bababa","gray74":"#bdbdbd","gray75":"#bfbfbf","gray76":"#c2c2c2","gray77":"#c4c4c4","gray78":"#c7c7c7","gray79":"#c9c9c9","gray8":"#141414","gray80":"#cccccc","gray81":"#cfcfcf","gray82":"#d1d1d1","gray83":"#d4d4d4","gray84":"#d6d6d6","gray85":"#d9d9d9","gray86":"#dbdbdb","gray87":"#dedede","gray88":"#e0e0e0","gray89":"#e3e3e3","gray9":"#171717","gray90":"#e5e5e5","gray91":"#e8e8e8","gray92":"#ebebeb","gray93":"#ededed","gray94":"#f0f0f0","gray95":"#f2f2f2","gray96":"#f5f5f5","gray97":"#f7f7f7","gray98":"#fafafa","gray99":"#fcfcfc","green1":"#00ff00","green2":"#00ee00","green3":"#00cd00","green4":"#008b00","grey":"#bebebe","grey0":"#000000","grey1":"#030303","grey10":"#1a1a1a","grey100":"#ffffff","grey11":"#1c1c1c","grey12":"#1f1f1f","grey13":"#212121","grey14":"#242424","grey15":"#262626","grey16":"#292929","grey17":"#2b2b2b","grey18":"#2e2e2e","grey19":"#303030","grey2":"#050505","grey20":"#333333","grey21":"#363636","grey22":"#383838","grey23":"#3b3b3b","grey24":"#3d3d3d","grey25":"#404040","grey26":"#424242","grey27":"#454545","grey28":"#474747","grey29":"#4a4a4a","grey3":"#080808","grey30":"#4d4d4d","grey31":"#4f4f4f","grey32":"#525252","grey33":"#545454","grey34":"#575757","grey35":"#595959","grey36":"#5c5c5c","grey37":"#5e5e5e","grey38":"#616161","grey39":"#636363","grey4":"#0a0a0a","grey40":"#666666","grey41":"#696969","grey42":"#6b6b6b","grey43":"#6e6e6e","grey44":"#707070","grey45":"#737373","grey46":"#757575","grey47":"#787878","grey48":"#7a7a7a","grey49":"#7d7d7d","grey5":"#0d0d0d","grey50":"#7f7f7f","grey51":"#828282","grey52":"#858585","grey53":"#878787","grey54":"#8a8a8a","grey55":"#8c8c8c","grey56":"#8f8f8f","grey57":"#919191","grey58":"#949494","grey59":"#969696","grey6":"#0f0f0f","grey60":"#999999","grey61":"#9c9c9c","grey62":"#9e9e9e","grey63":"#a1a1a1","grey64":"#a3a3a3","grey65":"#a6a6a6","grey66":"#a8a8a8","grey67":"#ababab","grey68":"#adadad","grey69":"#b0b0b0","grey7":"#121212","grey70":"#b3b3b3","grey71":"#b5b5b5","grey72":"#b8b8b8","grey73":"#bababa","grey74":"#bdbdbd","grey75":"#bfbfbf","grey76":"#c2c2c2","grey77":"#c4c4c4","grey78":"#c7c7c7","grey79":"#c9c9c9","grey8":"#141414","grey80":"#cccccc","grey81":"#cfcfcf","grey82":"#d1d1d1","grey83":"#d4d4d4","grey84":"#d6d6d6","grey85":"#d9d9d9","grey86":"#dbdbdb","grey87":"#dedede","grey88":"#e0e0e0","grey89":"#e3e3e3","grey9":"#171717","grey90":"#e5e5e5","grey91":"#e8e8e8","grey92":"#ebebeb","grey93":"#ededed","grey94":"#f0f0f0","grey95":"#f2f2f2","grey96":"#f5f5f5","grey97":"#f7f7f7","grey98":"#fafafa","grey99":"#fcfcfc","honeydew1":"#f0fff0","honeydew2":"#e0eee0","honeydew3":"#c1cdc1","honeydew4":"#838b83","ivory1":"#fffff0","ivory2":"#eeeee0","ivory3":"#cdcdc1","ivory4":"#8b8b83","khaki1":"#fff68f","khaki2":"#eee685","khaki3":"#cdc673","khaki4":"#8b864e","magenta1":"#ff00ff","magenta2":"#ee00ee","magenta3":"#cd00cd","magenta4":"#8b008b","maroon1":"#ff34b3","maroon2":"#ee30a7","maroon3":"#cd2990","maroon4":"#8b1c62","orange1":"#ffa500","orange2":"#ee9a00","orange3":"#cd8500","orange4":"#8b5a00","orchid1":"#ff83fa","orchid2":"#ee7ae9","orchid3":"#cd69c9","orchid4":"#8b4789","pink1":"#ffb5c5","pink2":"#eea9b8","pink3":"#cd919e","pink4":"#8b636c","plum1":"#ffbbff","plum2":"#eeaeee","plum3":"#cd96cd","plum4":"#8b668b","purple1":"#9b30ff","purple2":"#912cee","purple3":"#7d26cd","purple4":"#551a8b","red1":"#ff0000","red2":"#ee0000","red3":"#cd0000","red4":"#8b0000","salmon1":"#ff8c69","salmon2":"#ee8262","salmon3":"#cd7054","salmon4":"#8b4c39","seashell1":"#fff5ee","seashell2":"#eee5de","seashell3":"#cdc5bf","seashell4":"#8b8682","sienna1":"#ff8247","sienna2":"#ee7942","sienna3":"#cd6839","sienna4":"#8b4726","snow1":"#fffafa","snow2":"#eee9e9","snow3":"#cdc9c9","snow4":"#8b8989","tan1":"#ffa54f","tan2":"#ee9a49","tan3":"#cd853f","tan4":"#8b5a2b","thistle1":"#ffe1ff","thistle2":"#eed2ee","thistle3":"#cdb5cd","thistle4":"#8b7b8b","tomato1":"#ff6347","tomato2":"#ee5c42","tomato3":"#cd4f39","tomato4":"#8b3626","turquoise1":"#00f5ff","turquoise2":"#00e5ee","turquoise3":"#00c5cd","turquoise4":"#00868b","wheat1":"#ffe7ba","wheat2":"#eed8ae","wheat3":"#cdba96","wheat4":"#8b7e66","yellow1":"#ffff00","yellow2":"#eeee00","yellow3":"#cdcd00","yellow4":"#8b8b00"
    };
    let c;
    if( !color ){
	return "";
    }
    c = color.toLowerCase();
    if( typeof colors[c] !== "undefined" ){
        return colors[c];
    }
    arr = color.match(/rgb\((\d+)[,\s]+(\d+)[,\s]+(\d+)\)/i);
    if( arr ){
	return sprintf("#%02x%02x%02x", arr[1], arr[2], arr[3]);
    }
    return color;
};

// parse array of static colors
JS9.parseStaticColors = function(arr){
    let i, sobj, t, a;
    let staticColors = [];
    // can be json
    if( typeof arr === "string" ){
	try{ arr = JSON.parse(arr); }
	catch(e){ /* empty */ }
    }
    // sanity check
    if( !Array.isArray(arr) ){
	JS9.error("invalid input for static colors");
    }
    // for each array object
    for(i=0; i<arr.length; i++){
	if( typeof arr[i] === "string" ){
	    // format: "color:min:max"
	    a = arr[i].split(":");
	} else {
	    // format: ["color" or [r:,g:,b:,a:], min, max]
	    a = arr[i];
	}
	// canonical array
	if( Array.isArray(a) ){
	    // sanity check for color name
	    if( !a[0] ){ JS9.error(`no color specified: ${arr[i]}`); }
	    // color name can be any valid tiny color format
	    try{ t = tinycolor(a[0]); }
	    catch(e){ JS9.error(`invalid color: ${a[0]}`); }
	    // process min:max variations
	    if( JS9.isNull(a[1]) ){
		a[1] = 1;
		a[2] = Infinity;
	    } else if( a[1] === "" ){
		a[1] = -Infinity;
	    } else {
		a[1] = parseFloat(a[1]);
	    }
	    if( JS9.isNull(a[2]) ){
		a[2] = a[1];
	    } else 	if( a[2] === "" ){
		a[2] = Infinity;
	    } else {
		a[2] = parseFloat(a[2]);
	    }
	    // save this color object
	    sobj = {active: true,
		    red: t._r, green: t._g, blue: t._b, alpha: t._a * 255,
		    min: a[1], max: a[2]};
	    if( typeof a[0] === "string" ){
		sobj.name = a[0];
	    }
	} else if( typeof a === "object" ){
	    // raw object (e.g. saved static colormap)
	    sobj = a;
	}
	staticColors.push(sobj);
    }
    // optimize lookup: sort so that first min is global min
    staticColors.sort((a, b) => { return a.min - b.min; });
    // return array of color objects
    return staticColors;
};

// look up a static color
JS9.lookupStaticColor = (im, val, cache) => {
    let i, color;
    let nocolor = {red:0,green:0,blue:0,alpha:0};
    const maxcache = 10000000;
    const search = (array, val) => {
	let middle, obj;
	let start = 0;
	let end = array.length - 1;
	while( start <= end ){
            middle = Math.floor((start + end) / 2);
	    obj = array[middle];
            if( val >= obj.min && val <= obj.max ) {
		// found the interval
		return middle;
            } else if( obj.max < val ){
		// continue searching to the right
		start = middle + 1;
            } else {
		// continue searching to the left
		end = middle - 1;
            }
	}
	// interval wasn't found
	return -1;
    };
    if( im && im.staticObj ){
	nocolor = im.params.nocolor || nocolor;
	// colors are sorted, so we can skip values less than the first min
	if( val < im.staticObj.colors[0].min ){ return nocolor; }
	// return cached color, if possible
	if( cache && cache[val] ){ return cache[val]; }
	// look for the value within the static color intervals
	i = search(im.staticObj.colors, val);
	if( i < 0 ){
	    color = nocolor;
	} else {
	    color = im.staticObj.colors[i];
	    if( !color.active ){
		color = nocolor;
	    }
	}
	// save in cache, if possible
	if( cache && val <= maxcache ){
	    cache[val] = color;
	}
	// this is the color
	return color;
    }
    // nothing found
    return nocolor;
};

// convert string to double, returning (possibly scaled) value and delim
JS9.strtoscaled = function(s){
    let dval = JS9.saostrtod(s);
    const dtype = String.fromCharCode(JS9.saodtype());
    // scale for certain units
    switch(dtype){
    case '"':
	dval /= 3600.0;
	break;
    case "'":
	dval /= 60.0;
	break;
    case "r":
	dval *= (180.0 / Math.PI) ;
	break;
    default:
	break;
    }
    return {dval, dtype};
};

// clean file path
JS9.cleanPath = function(s, what){
    let t;
    // vulnerability hints culled from https://html5sec.org/
    const xssreg = /(<(animation|form|math|maction|svg|script|video)\s|<\?xml|javascript:|on.*&equals;|alert\(|alert&lpar;)|window\./i;
    if( !s ){ return ""; }
    // check for xss vulnerabilities (but not within cfitsio brackets)
    t = s.replace(/\[.*\]/, "");
    if( t.match(xssreg) ){
	// we're under attack: turn on alerts no matter what
	JS9.globalOpts.alerts = true;
	// warn user they are under attack!
	JS9.error(`${what||"filename"} is susceptible to XSS attack: ${t}`);
    }
    // remove unnecessary /./ etc
    return s.trim().replace(/\/\.\//, "/").replace(/^\.\//, "");
};

// convert relative directory into absolute directory using currentDir
// desktop only, to make pathname relative to where js9 was started
JS9.fixPath = function(f, opts){
    opts = opts || {};
    if( window.electron             &&
	JS9.desktopOpts.currentPath &&
	opts.fixpath !== false      &&
	!f.match(JS9.URLEXP)        ){
	if( f.match(/^\${JS9_DIR}\//) ){
	    f = f.replace(/^\${JS9_DIR}\//, JS9.INSTALLDIR);
	} else if( f.match(/^\${JS9_INSTALLDIR}\//) ){
	    f = f.replace(/^\${JS9_INSTALLDIR}\//, JS9.INSTALLDIR);
	} else if( f.match(/^\${JS9_PAGEDIR}\//) ){
	    f = f.replace(/^\${JS9_PAGEDIR}\//, "");
	} else if( f.charAt(0) !== "/" ){
	    f = `${window.electron.currentDir}/${f}`;
	}
    }
    return f;
};

// return virtual path of a local access file, if warranted
JS9.localAccess = function(file){
    let tfile, text;
    // only if local access is turned on and we have a local disk mounted
    if( !file || !JS9.globalOpts.localAccess || !JS9.hostFS ){
	return null;
    }
    // get file without bracket extension
    tfile = file.replace(/\[.*\]/, "");
    // and file extension
    text = `.${tfile.split(".").pop().toLowerCase()}`;
    // this is the candidate virtual file
    tfile = `${JS9.hostFS}/${tfile}`;
    // check for existence
    // note to myself: cfitsio uncompresses .gz files into memory, so
    // there is no benefit to having ".gz" in the localTemplates list.
    if( JS9.vsize(tfile) >= 0 &&
	JS9.inArray(text, JS9.globalOpts.localTemplates.split(",")) >= 0){
	if( JS9.DEBUG > 2 ){
	    JS9.log("local access file: %s", tfile);
	}
	return tfile;
    }
    // no local access file
    return null;
};

// get directory name of a file, including trailing "/";
JS9.dirname = function(f){
    if( !f || !f.includes("/") ){
	return "";
    }
    return f.match(/.*\//)[0];
};

// ---------------------------------------------------------------------
// end of Utilities
