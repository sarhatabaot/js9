JS9.Regions = {};
JS9.Regions.CLASS = "JS9";
JS9.Regions.NAME = "Regions";

// defaults for new regions
JS9.Regions.opts = {
    // update WCS strings
    updateWCS: true,
    // pan and zoom enabled
    panzoom: true,
    tags: "source,include",
    strokeWidth: 2,
    ptStrokeWidth: 1,
    // annuli: inner and outer radius, number of annuli
    iradius: 15,
    oradius: 30,
    nannuli: 1,
    // box
    width: 60,
    height: 60,
    // circle
    radius: 30,
    // ellipse:
    // use r1, r2 to avoid confusion with rad1, rad2 for rounding in boxes!
    r1: 30,
    r2: 20,
    // point
    ptshape: "box",
    ptsize: 2,
    // line
    linepoints: [{x: -30, y: 30}, {x:30, y:-30}],
    // polygon in display coords
    // points: [{x: -30, y: 30}, {x:30, y:30}, {x:30, y:-30}, {x:-30, y: -30}],
    polypoints: [{x: -30, y: 30}, {x:30, y:30}, {x:0, y:-30}],
    // text
    // fontFamily: "Helvetica, sans-serif",
    fontFamily: "Helvetica",
    fontSize: 14,
    fontStyle: "normal",
    fontWeight: 300,
    textAlign: "left",
    // angles (box, ellipse)
    angle: 0,
    // anchor radii
    aradius1: 4,
    aradius2: 8,
    // region configuration url
    configURL: "./params/regionsconfig.html",
    // region save url
    saveURL: "./params/regionssave.html",
    // should overlapping shapes be sorted (smallest on top)?
    sortOverlapping: true,
    // title for region config dialog box
    title: "Edit region",
    // no centered scaling for these regions
    noCenteredScaling: ["box", "line"],
    // colors for tags
    // these should be ordered from more specific to less specific
    tagcolors: {
	include_source:     "#00FF00",
	exclude_source:     "#FF0000",
	include_background: "#FFD700",
	exclude_background: "#FF8C00",
	source:             "#00FF00",
	background:         "#FFD700",
	defcolor:           "#00FF00"
    },
    // mouse double-click processing
    onmousedblclick(im, xreg, evt, target){
	let params = target.params;
	if( (params && !params.winid && !params.ignore )             ||
	    (!params && target.type === "activeSelection")           ||
	    (!params && target.type === "group")                     ){
	    if( JS9.globalOpts.editRegions ){
		im.displayRegionsForm(target);
	    }
	}
	return;
    },
    // mouse down processing
    onmousedown(im, xreg, evt, target){
	let poly;
	// nb: target might be a polygon anchor => no params
	let params = target.params;
	if( JS9.specialKey(evt) ){
	    if( params ){
		im._regroupAnnulus(params.layerName, evt);
	    }
	    if( target.type === "polygon" || target.type === "polyline" ){
		// add polygon point
		im._addPolygonPoint(params.layerName, target, evt);
		im._updateShape(params.layerName, target, null, "update");
	    } else if( target.polyparams && target.polyparams.polygon  ){
		// remove polygon point
		poly = target.polyparams.polygon;
		im._removePolygonPoint(poly.params.layerName, target);
		im._updateShape(poly.params.layerName, poly, null, "update");
	    } else if( params && params.shape === "annulus" ){
		im._ungroupAnnulus(params.layerName, target);
	    }
	}
    },
    // mouse up processing
    onmouseup(){
	let i;
	let objs = [];
	// one active object
	if( this.getActiveObject() ){
	    objs.push(this.getActiveObject());
	}
	objs.push(this.getActiveObjects());
	// re-select polygon which was just processed
	for(i=0; i<objs.length; i++){
	    if( objs[i].polyparams ){
		this.setActiveObject(objs[i].polyparams.polygon);
	    }
	}
    },
    // global onchange callback
    onchange: null
};

// plugin init: load our regions methods
JS9.Regions.init = function(layerName){
    let dlayer;
    // get layer name
    layerName = layerName || "regions";
    // add to image prototypes
    JS9.Image.prototype.parseRegions = JS9.Regions.parseRegions;
    JS9.Image.prototype.saveRegions = JS9.Regions.saveRegions;
    JS9.Image.prototype.listRegions = JS9.Regions.listRegions;
    JS9.Image.prototype._getRegionExports = JS9.Regions._getRegionExports;
    JS9.Image.prototype.copyRegions = JS9.Regions.copyRegions;
    JS9.Image.prototype.changeRegionTags = JS9.Regions.changeRegionTags;
    JS9.Image.prototype.toggleRegionTags = JS9.Regions.toggleRegionTags;
    JS9.Image.prototype.unremoveRegions = JS9.Regions.unremoveRegions;
    JS9.Image.prototype.initRegionsForm = JS9.Regions.initConfigForm;
    JS9.Image.prototype.displayRegionsForm = JS9.Regions.displayConfigForm;
    JS9.Image.prototype.processRegionsForm = JS9.Regions.processConfigForm;
    // init the display shape layer
    dlayer = this.display.newShapeLayer(layerName, JS9.Regions.opts);
    // mouse up: list regions, if necessary
    dlayer.canvas.on("mouse:up", () => {
	let i, tim;
	let objs = [];
	if( dlayer.display.image ){
	    tim = dlayer.display.image;
	    // one active object
	    // group of active objects
	    objs.push(dlayer.canvas.getActiveObjects());
	    // process all active objects
	    for(i=0; i<objs.length; i++){
		if( objs[i].params ){
		    if( tim.params.listonchange ){
			if( tim.params.whichonchange === "all" ){
			    tim.listRegions("all", {mode: 2});
			} else {
			    tim.listRegions("selected", {mode: 2});
			}
		    } else if( objs[i].params.listonchange ){
			tim.listRegions("selected", {mode: 2});
		    }
		    break;
		}
	    }
	}
    });
    return this;
};

// display the region config form
// call using image context
JS9.Regions.displayConfigForm = function(shape, opts){
    let s, winformat;
    let got = 0;
    let title = JS9.Regions.opts.title;
    // sanity check
    if( !this ){ return; }
    // opts is optional
    opts = opts || {};
    // if there are no regions involved, make this a multi-select edit
    if( !shape ){
	// need at least one shape to edit
	if( !this.getShapes("regions").length ){
	    return;
	}
    }
    // which type of dialog box?
    opts.type = opts.type || "config";
    switch(opts.type){
    case "save":
	if( JS9.allinone ){
	    s = JS9.allinone.regionsSaveHTML;
	} else {
	    s = JS9.InstallDir(JS9.Regions.opts.saveURL);
	}
	// adjust title
	title = "Save regions";
	// adjust size of window
	winformat = JS9.lightOpts[JS9.LIGHTWIN].regWin1;
	break;
    case "config":
    default:
	if( JS9.allinone ){
	    s = JS9.allinone.regionsConfigHTML;
	} else {
	    s = JS9.InstallDir(JS9.Regions.opts.configURL);
	}
	if( !shape                                              ||
	    (!shape.params && shape.type === "activeSelection") ||
	    (!shape.params && shape.type === "group")           ){
	    opts.multi = true;
	}
	break;
    }
    // if a multi select form already exists, just update it
    if( opts.multi ){
	$("form[class='regionsConfigForm']").each((index, element) => {
	    const multi = $(element).data("multi");
	    const winid = $(element).data("winid");
	    const im = $(element).data("im");
	    if( multi && winid && im === this ){
		opts.winid = winid;
		im.initRegionsForm(null, opts);
		got++;
	    }
	});
	// change title to reflect multi-select, if necessary
	title = title.replace(/regions?/, "selected regions");
	// all done if we reinit'ed an existing window
	if( got ){ return; }
    }
    // call this once window is loaded
    $(JS9.lightOpts[JS9.LIGHTWIN].topid)
	.arrive(".regionsConfigForm", {onceOnly: true}, () => {
	    opts.firsttime = true;
	    if( shape && shape.params ){
		this.updateShapes("regions", shape, "wcsconfig");
	    }
	    this.initRegionsForm(shape, opts);
	});
    // bring up display window
    opts.winid = this.displayAnalysis("regions", s, {title, winformat});
    // save winid, if possible
    if( shape && shape.params ){
	shape.params.winid = opts.winid;
    }
};

// initialize the region config form
// call using image context
JS9.Regions.initConfigForm = function(obj, opts){
    let i, key, val, el, el2, wcssys, twcssys, mover, mout, p1, p2, cmode;
    let s, s2, s3, s4, winid, wid, form, otitle, fav, arr, ao, grp, o, objs;
    let multi = false;
    const wcsinfo = this.raw.wcsinfo || {cdelt1: 1, cdelt2: 1};
    const defobj = {
	type: "multi",
	pub: {shape: "multi", wcsconfig: {}},
	params: {}
    };
    const fmt= (val) => {
	if( val === undefined ){
	    return undefined;
	}
	if( (typeof val === "number") && (val % 1 !== 0) ){
	    val = Math.round((val + 0.00001) * 10000) / 10000;
	}
	return(String(val));
    };
    const replaceNewline = (s) => {
	const nl = String.fromCharCode(13, 10);
	if( typeof s === "string" ){
	    return s.replace(/\\n/g, nl);
	}
	return s;
    };
    // which wcssys do we use? edit version, if available
    if( obj && obj.pub ){
	if( obj.pub.wcsconfig && obj.pub.wcsconfig.wcssys  ){
	    wcssys = obj.pub.wcsconfig.wcssys;
	} else {
	    wcssys = this.params.wcssys;
	}
    } else {
	wcssys = this.params.wcssys;
	// fake obj: makes the checks easier, avoid if( obj ... ) everywhere
	obj = defobj;
    }
    cmode = obj.params.changeable === false;
    // opts is optional
    opts = opts || {};
    // where to we get winid?
    if( obj.params.winid ){
	winid = obj.params.winid;
    } else if( opts.winid ){
	winid = opts.winid;
    }
    // window id is required
    if( !winid ){
	return;
    }
    // find the form, based on winid
    wid = $(winid).attr("id");
    // leave trailing space!
    form = `#${wid} .regionsConfigForm `;
    // valid form is required
    if( !$(form).length ){
	return;
    }
    // if the form is already a multi-select form, keep it that way
    if( $(form).data("multi") ){
	multi = true;
    } else {
	multi = opts.multi;
    }
    // remove the nodisplay class from shape's div
    $(`${form}.${obj.pub.shape}`).each((index, element) => {
	$(element).removeClass("nodisplay");
    });
    // fill in form values based on current values in the shape object
    $(`${form}.val`).each((index, element) => {
	val = "";
	key = $(element).attr("name");
	// key-specific pre-processing
	switch(key){
	case "x":
	case "y":
	    if( obj.pub.lcs && obj.pub.lcs[key] !== undefined ){
		val = fmt(obj.pub.lcs[key]);
	    } else if( obj.pub[key] !== undefined ){
		val = fmt(obj.pub[key]);
	    }
	    break;
	case "radii":
	    if( obj.pub.radii ){
		if( JS9.notWCS(wcssys)        ||
		    !obj.pub.wcsconfig        ||
		    !obj.pub.wcsconfig.wcsstr ){
		    val = obj.pub.imstr
			.replace(/^annulus\(/,"").replace(/\)$/,"")
			.split(",").slice(2).join(",");
		} else {
		    val = obj.pub.wcsconfig.wcsstr
			.replace(/^annulus\(/,"").replace(/\)$/,"")
			.split(",").slice(2).join(",");
		}
	    }
	    break;
	case "pts":
	    if( obj.pub.pts ){
		obj.pub.pts.forEach( (p) => {
		    if( val ){
			val += ", ";
		    }
		    val += `${p.x.toFixed(2)}, ${p.y.toFixed(2)}`;
		});
	    } else if( obj.pub.imstr ){
		// use the flat points list instead of the pts object array
		val = obj.pub.imstr.replace(/^.*\(/, "").replace(/\)$/, "");
	    }
	    break;
	case "linelength":
	    if( obj.pub.pts && obj.pub.pts.length === 2 ){
		p1 = obj.pub.pts[0];
		p2 = obj.pub.pts[1];
		val = fmt(Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) +
				    (p2.y - p1.y) * (p2.y - p1.y)));
		switch(wcssys){
		case "image":
		case "physical":
		    break;
		default:
		    val *= Math.abs(wcsinfo.cdelt1);
		    val *= Math.abs(wcsinfo.cdelt2);
		    break;
		}
		val = fmt(val);
		this.tmp.linelength = val;
	    }
	    break;
	case "lineangle":
	    if( obj.pub.pts && obj.pub.pts.length === 2 ){
		p1 = obj.pub.pts[0];
		p2 = obj.pub.pts[1];
		val = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
		while( val < 0 ){ val += 360; }
		val = fmt(val);
		this.tmp.lineangle = val;
	    }
	    break;
	case "fontFamily":
	    if( obj.getFontFamily ){
		val = obj.getFontFamily();
	    }
	    break;
	case "fontSize":
	    if( obj.getFontSize ){
		val = obj.getFontSize();
	    }
	    break;
	case "fontStyle":
	    if( obj.getFontStyle ){
		val = obj.getFontStyle();
	    }
	    break;
	case "fontWeight":
	    if( obj.getFontWeight ){
		val = obj.getFontWeight();
	    }
	    break;
	case "colorPicker":
	    if( obj.pub.color !== undefined ){
		val = JS9.colorToHex(obj.pub.color);
	    } else {
		val = $(form).data("colorpicker") || JS9.globalOpts.defcolor;
	    }
	    break;
	case "color":
	    // multi: don't set color to avoid applying it to new selections
	    if( !multi ){
		if( obj.pub.color !== undefined ){
		    val = fmt(obj.pub.color);
		} else if( $(form).data("colorpicker") ){
		    val = $(form).data("colorpicker");
		}
	    }
	    break;
	case "strokeWidth":
	    if( obj.params.sw1 ){
		val = obj.params.sw1;
	    } else {
		val = $(form).data("strokewidth") || "";
	    }
	    break;
	case "strokeDashes":
	    if( obj.strokeDashArray ){
		val = obj.strokeDashArray.join(" ");
		if( val.match(/NaN/) ){
		    val = "";
		}
	    } else {
		val = $(form).data("strokedashes") || "";
	    }
	    break;
	case "regstr":
	    if( JS9.notWCS(wcssys)        ||
		!obj.pub.wcsconfig        ||
		!obj.pub.wcsconfig.wcsstr ){
		val = `${obj.pub.imsys};${obj.pub.imstr}`;
	    } else {
		val = `${obj.pub.wcsconfig.wcssys};${obj.pub.wcsconfig.wcsstr}`;
	    }
	    break;
	case "xpos":
	    switch(wcssys){
	    case "image":
		if( obj.pub.preservedcoords && obj.pub.dx !== undefined ){
		    val = sprintf("d%.1f", obj.pub.dx);
		} else if( obj.pub.x !== undefined ){
		    val = sprintf("%.1f", obj.pub.x);
		}
		break;
	    case "physical":
		if( obj.pub.lcs ){
		    val = sprintf("%.1f", obj.pub.lcs.x);
		} else if( obj.pub.x !== undefined ){
		    val = sprintf("%.1f", obj.pub.x);
		}
		break;
	    default:
		if( obj.pub.wcsconfig && JS9.notNull(obj.pub.wcsconfig.ra) ){
		    val = sprintf("%.6f", obj.pub.wcsconfig.ra);
		} else if( obj.pub.x !== undefined ){
		    val = sprintf("%.1f", obj.pub.x);
		}
		break;
	    }
	    $(`${form}[name='${key}']`).prop("readonly", cmode);
	    break;
	case "ypos":
	    switch(wcssys){
	    case "image":
		if( obj.pub.preservedcoords && obj.pub.dy !== undefined ){
		    val = sprintf("d%.1f", obj.pub.dy);
		} else if( obj.pub.y !== undefined ){
		    val = sprintf("%.1f", obj.pub.y);
		}
		break;
	    case "physical":
		if( obj.pub.lcs ){
		    val = sprintf("%.1f", obj.pub.lcs.y);
		} else if( obj.pub.y !== undefined ){
		    val = sprintf("%.1f", obj.pub.y);
		}
		break;
	    default:
		if( obj.pub.wcsconfig && JS9.notNull(obj.pub.wcsconfig.dec) ){
		    val = sprintf("%.6f", obj.pub.wcsconfig.dec);
		} else if( obj.pub.y !== undefined ){
		    val = sprintf("%.1f", obj.pub.y);
		}
		break;
	    }
	    $(`${form}[name='${key}']`).prop("readonly", cmode);
	    break;
	case "radius":
	case "oradius":
	case "length":
	case "width":
	case "r1":
	    switch(wcssys){
	    case "image":
		if( obj.pub[key] !== undefined ){
		    val = fmt(obj.pub[key]);
		}
		break;
	    case "physical":
		if( obj.pub.lcs && obj.pub.lcs[key] !== undefined ){
		    val = fmt(obj.pub.lcs[key]);
		}
		break;
	    default:
		if( obj.pub.wcsconfig                         &&
		    JS9.notNull(obj.pub.wcsconfig.wcssizestr) ){
		    val = fmt(obj.pub.wcsconfig.wcssizestr[0]);
		} else if( obj.pub[key] !== undefined ){
		    val = fmt(obj.pub[key]);
		}
		break;
	    }
	    $(`${form}[name='${key}']`).prop("readonly", cmode);
	    break;
	case "height":
	case "r2":
	    switch(wcssys){
	    case "image":
		if( obj.pub[key] !== undefined ){
		    val = fmt(obj.pub[key]);
		}
		break;
	    case "physical":
		if( obj.pub.lcs && obj.pub.lcs[key] !== undefined ){
		    val = fmt(obj.pub.lcs[key]);
		}
		break;
	    default:
		if( obj.pub.wcsconfig                         &&
		    JS9.notNull(obj.pub.wcsconfig.wcssizestr) ){
		    val = fmt(obj.pub.wcsconfig.wcssizestr[1]);
		} else if( obj.pub[key] !== undefined ){
		    val = fmt(obj.pub[key]);
		}
		break;
	    }
	    $(`${form}[name='${key}']`).prop("readonly", cmode);
	    break;
	case "wcssys":
	case "savewcs":
	    // add all wcs sys options
	    el = $(form).find(`[name='${key}']`);
	    if( !el.find("option").length ){
		for(i=0; i<JS9.wcssyss.length; i++){
		    el.append(`<option>${JS9.wcssyss[i]}</option>`);
		}
	    }
	    if( key === "savewcs" ){
		twcssys = JS9.globalOpts.regSaveWCS || wcssys;
	    } else {
		twcssys = wcssys;
	    }
	    el.find("option").each((index, element) => {
		if( twcssys === element.value ){
		    val = element.value;
		}
	    });
	    break;
	case "wcsunits":
	    if( obj.pub.wcsunits ){
		val = obj.pub.wcsunits;
	    }
	    break;
	case "childtext":
	    if( obj.params.children && obj.params.children.length > 0 ){
		val = replaceNewline(obj.params.children[0].obj.text);
	    }
	    break;
	case "text":
	    if( obj.pub[key] !== undefined ){
		val = replaceNewline(fmt(obj.pub[key]));
	    }
	    break;
	case "id":
	    if( multi ){
		val = "selected";
	    } else if( obj.pub.id !== undefined ){
		val = String(obj.pub.id);
		// set width of text input to be width of string
		$(element).css("width", `${val.length}ch`);
	    }
	    break;
	case "tags":
	    if( obj.pub[key] !== undefined ){
		val = fmt(obj.pub[key]);
	    }
	    break;
	case "savefile":
	    val = $(form).data("savefile")   ||
		  this.tmp.saveregionsFile   ||
		  "js9.reg";
	    if( window.electron && !val.match(/.*\//) ){
		val = `${window.electron.currentDir}/${val}`;
	    }
	    break;
	case "selectfilter":
	    val = $(form).data("selectfilter");
	    break;
	case "selectshape":
	case "selectcolor":
	case "selecttag":
	case "selectwcs":
	case "selectgroup":
	    JS9.Regions.regionsConfigSetSelectMenu(this, $(form), key);
	    break;
	default:
	    if( obj.pub[key] !== undefined ){
		val = fmt(obj.pub[key]);
	    }
	    break;
	}
	$(element).val(val);
    });
    // display or hide options
    if( multi || !this.raw.wcs || this.raw.wcs < 0 ){
	$(form).find("[name='wcssys']").hide();
    }
    // edit-able parameters
    // child text display for shapes, editable if no existing children yet
    if( obj.type !== "text" && obj.params.children ){
	$(`${form}.childtext`).removeClass("nodisplay");
    }
    // init options, if necessary
    if( opts.firsttime ){
	// desktop: display file browser
	if( window.electron ){
	    $(form).find(".rsavebrowse, .rconfigbrowse")
		.removeClass("nodisplay");
	}
	// multi "cur" works off selected, not current, regions
	if( multi ){
	    $(form).find("label[for='savecur']")
		.text("sel");
	    $(form).find("input[id='savecur']")
		.data("tooltip", "save selected regions");
	    $(form).find("[id='selectreg']")
		.prop("checked", true);
	} else {
	    $(form).find(".checkboxes").removeClass("nodisplay");
	}
	// add wcs button options
	if( JS9.favorites.wcs && JS9.favorites.wcs.length ){
	    // display wcs buttons
	    el = $(form).find(".rwcsbuttons").removeClass("nodisplay");
	    // add buttons to button container, if necessary
	    el2 = el.find(".rwcsbuttoncontainer");
	    if( el2.length && !el2.find(".rwcsbutton").length ){
		// add radio buttons for each favorite wcs
		for(i=0; i<JS9.favorites.wcs.length; i++){
		    fav = JS9.favorites.wcs[i];
		    if( typeof fav === "string" ){
			// format: "wcs:displayedname"
			arr = fav.split(":");
		    } else {
			// format: ["wcs", "displayedname"]
			arr = fav;
		    }
		    s =  arr[0];
		    s2 = arr[1] || s;
		    if( opts.type === "save" ){
			s3 = `rsavecol_R${i+2}`;
			s4 = "rsaveradio";
		    } else {
			s3 = `rconfigcol_R${i+2}`;
			s4 = "rconfigradio";
		    }
		    el2.append(`<span class='rconfigcol_R rwcsbutton ${s3}'>
                                <input type='radio'
                                       id='rwcsbutton_${s}'
                                       name='rwcsbutton'
                                       class='rwcsradio ${s4}}'
                                       value='${s}'
                                       data-tooltip='save using ${s} wcs'
                                       onclick='
                                           $(this).closest("form")
                                           .find("[name=savewcs]")
                                           .val("${s}")
                                           .trigger("change");'>
                                <label for='rwcsbutton_${s}'>${s2}</label>
                                </span>`);
		}
		// init the radio buttons
		$(form).find('.rwcsbuttons').find(`[value='${wcssys}']`)
		    .prop('checked', true);
	    }
	}
	// alternate colorpicker
	if( !JS9.globalOpts.internalColorPicker ||
	    !$.fn.spectrum.inputTypeColorSupport() ){
	    el = $(form).find(`input[name='colorPicker']`)
	    el.spectrum({showButtons: false,
			 showInput: false,
			 preferredFormat: "hex6"});
	    // when the color is changed via the colorpicker
	    el.on('move.spectrum', (evt, tinycolor) => {
		let color = tinycolor.toHexString();
		$(form).find("input[name='color']").val(color);
		$(form).data("colorpicker", color);
	    });
         }
    }
    // checkboxes
    if( obj.params.listonchange === undefined ){
	obj.params.listonchange = false;
    }
    if( obj.params.listonchange ){
	$(`${form}[name='listonchange']`).prop("checked", true);
    } else {
	$(`${form}[name='listonchange']`).prop("checked", false);
    }
    if( obj.params.changeable !== false ){
	$(`${form}[name='locked']`).prop("checked", false);
    } else {
	$(`${form}[name='locked']`).prop("checked", true);
    }
    if( obj.params.sticky ){
	$(`${form}[name='sticky']`).prop("checked", true);
    } else {
	$(`${form}[name='sticky']`).prop("checked", false);
    }
    // save regions processing
    $(`${form}[id='includejson']`)
	.prop("checked", JS9.globalOpts.regIncludeJSON);
    $(`${form}[id='includecomments']`)
	.prop("checked", JS9.globalOpts.regIncludeComments);
    $(`${form}[id='savedcoords']`)
	.prop("checked", JS9.globalOpts.regSaveDCoords);
    $(`${form}[id='includewcs']`)
	.prop("checked", JS9.globalOpts.csvIncludeWCS);
    // unset all save format radio buttons
    $(form).find(`input[name='saveformat']`)
	.prop("checked", false);
    // set save format based on global value
    $(form).find(`input[value='${JS9.globalOpts.regSaveFormat}']`)
	.prop("checked", true);
    // unset all save wcs radio buttons
    $(form).find(`input[name='rwcsbutton']`)
	.prop("checked", false);
    // set save wcs based on global value
    $(form).find(`input[value='${JS9.globalOpts.regSaveWCS||wcssys}']`)
	.prop("checked", true);
    // set which regions get saved
    if( opts.type === "save" ){
	s = `save${JS9.globalOpts.regSaveWhich1}`;
    } else {
	s = `save${JS9.globalOpts.regSaveWhich2}`;
    }
    $(`${form}[id='${s}']`).prop("checked", true);
    // triggering the savefile will cause format to be updated
    // and focus to be set
    if( opts.type === "save" ){
	$(form).find(`input[name='savefile']`).trigger("change");
    }
    // style menus
    $(form).find(`input[name='strokeMenu']`).prop("selectedIndex", 0);
    $(form).find(`input[name='dashesMenu']`).prop("selectedIndex", 0);
    // shape specific processing
    if( multi ){
	$(form).find(".regid").hide();
	$(form).find(".edit").hide();
	$(form).find(".childtext").hide();
	$(form).find(".multi").removeClass("nodisplay");
	if( opts.setmode <= 0 ){
	    $(form).find(`[name='multitext']`).val("");
	    $(form).find(`input[name="color"]`).val("");
	    $(form).find(`input[name="strokeWidth"]`).val("");
	    $(form).find(`input[name="strokeDashes"]`).val("");
	    $(form).data("strokewidth", "");
	    $(form).data("strokedashes", "");
	    if( opts.setmode < 0 ){
		$(form).find(`[name='selectfilter']`).val("");
		$(form).data("selectfilter", "");
	    }
	} else {
	    ao = this.layers.regions.canvas.getActiveObject();
	    if( ao && ao.type === "group" && !ao.params ){
		objs = ao.getObjects();
		if( objs && objs.length && objs[0] && objs[0].params ){
		    grp = objs[0].params.groupid;
		}
		if( grp ){
		    $(form).find(`[name='selectfilter']`).val(grp);
		    $(form).data('selectfilter', grp);
		    s = this.listGroups(grp);
		    s2 = s.substring(s.indexOf("\n")+1);
		    $(form).find(`[name='multitext']`).val(s2);
		} else {
		    $(form).find(`[name='multitext']`).val("");
		}
	    } else if( ao ){
		ao = this.layers.regions.canvas.getActiveObjects();
		for(i=0, s=[], s2=""; i<ao.length; i++){
		    o = ao[i];
		    if( o.type === "group" && !o.params ){
			s2 += `${this.lookupGroup(o)}\n`;
		    } else {
			s.push(o);
		    }
		}
		s3 = this.listRegions(s, {mode: 1,
					  includejson: false,
					  includecomments: false})
		    .replace(/ *; */g, "\n");
		s2 = s2 + s3.substring(s3.indexOf("\n")+1);
		if( s2 ){
		    s4 = "selected";
		    $(form).find(`[name='selectfilter']`).val(s4);
		    $(form).data('selectfilter', s4);
		    $(form).find(`[name='multitext']`).val(s2);
		}
	    } else {
		s =  $(form).find(`[name='selectfilter']`).val() || "selected";
		s2 = this.listRegions(s, {mode: 1,
					 includejson: false,
					 includecomments: false})
		    .replace(/ *; */g, "\n");
		if( s2 ){
		    $(form).find(`[name='selectfilter']`).val(s);
		    $(form).data('selectfilter', s);
		    $(form).find(`[name='multitext']`).val(s2);
		}
	    }
	}
    } else {
	// grey-out read-only text input
	$(form).find("input:text[readonly]")
	    .css("border-color", "#A5A5A5")
	    .css("background", "#E9E9E9");
	// regular text input
	$(form).find("input:text:not([readonly])")
	    .css("border-color", "#E9E9E9")
	    .css("background", "white");
	switch(obj.pub.shape){
	case "box":
	case "cross":
	case "ellipse":
	    $(`${form}.angle`).removeClass("nodisplay");
	    break;
	case "text":
	    $(`${form}.textangle`).removeClass("nodisplay");
	    break;
	case "line":
	    if( obj.pub.pts && obj.pub.pts.length === 2 ){
		$(`${form}.linelength`).removeClass("nodisplay");
		$(`${form}.lineangle`).removeClass("nodisplay");
	    } else {
		$(`${form}.linelength`).addClass("nodisplay");
		$(`${form}.lineangle`).addClass("nodisplay");
	    }
	    break;
	default:
	    break;
	}
    }
    // save options
    $(`${form}.xtrareg`).addClass("nodisplay");
    $(`${form}.xtracsv`).addClass("nodisplay");
    $(`${form}.xtrasvg`).addClass("nodisplay");
    $(`${form}.xtra${JS9.globalOpts.regSaveFormat}`).removeClass("nodisplay");
    // save image for later processing
    $(form).data("im", this);
    // save shape object for later processing
    $(form).data("shape", obj);
    // save the window id for later processing
    $(form).data("winid", winid);
    // save multi state for later processing
    $(form).data("multi", multi);
    // even triggers
    if( JS9.BROWSER[3] ){
	mover = "touchstart";
	mout = "touchend";
    } else {
	mover = "mouseover";
	mout = "mouseout";
    }
    // for save form, focus on filename
    if( opts.type === "save" ){
	$(form).on(mover, () => {
	    $(form).find(`input[name='savefile']`).focus();
	});
    }
    // add tooltip callbacks (not mobile: ios buttons stop working!)
    if( !$(form).data("tooltipInit") ){
	$(form).data("tooltipInit", true);
	$(".rconfigcol_R, .rsavecol_R").on(mover, (e) => {
	    const target = e.currentTarget;
	    const tooltip = $(target)
		  .find("input, textarea, span")
		  .data("tooltip");
	    const el = $(target)
		  .closest(JS9.lightOpts[JS9.LIGHTWIN].top)
		  .find(JS9.lightOpts[JS9.LIGHTWIN].dragBar);
	    if( tooltip && el.length ){
		// change title: see dhtmlwindow.js load() @line 130
		otitle = $(el)[0].childNodes[0].nodeValue.replace(/:.*/,"");
		$(el)[0].childNodes[0].nodeValue = `${otitle}: ${tooltip}`;
	    }
	});
	$(".rconfigcol_R, .rsavecol_R").on(mout, (e) => {
	    const target = e.currentTarget;
	    const el = $(target)
		  .closest(JS9.lightOpts[JS9.LIGHTWIN].top)
		  .find(JS9.lightOpts[JS9.LIGHTWIN].dragBar);
	    if( el.length ){
		otitle = $(el)[0].childNodes[0].nodeValue.replace(/:.*/,"");
		$(el)[0].childNodes[0].nodeValue = otitle;
	    }
	});
    }
};

// process the config form to change the specified shape
// call using image context
JS9.Regions.processConfigForm = function(form, obj, arr){
    let i, key, nkey, val, nval, nopts, multi, layer, wcssys;
    let cpos, p1, p2, d, x, y, ang, sel;
    let bin = 1;
    const defobj = {
	type: "multi",
	pub: {shape: "multi"},
	params: {}
    };
    const alen = arr.length;
    const opts = {};
    const wcsinfo = this.raw.wcsinfo || {cdelt1: 1, cdelt2: 1};
    const fmt= (val) => {
	if( val === undefined ){
	    return undefined;
	}
	if( (typeof val === "number") && (val % 1 !== 0) ){
	    val = Math.round((val + 0.00001) * 10000) / 10000;
	}
	return(String(val));
    };
    const fmtcheck = (val1, val2) => {
	if( multi ){
	    return true;
	}
	if( val1 === undefined ){
	    return false;
	}
	return fmt(val1) !== fmt(val2);
    };
    const newval = (obj, key, val) => {
	// let v1, v2;
	// special keys having no public or param equivalents
	if( key === "remove" ){
	    return val === "selected";
	}
	if( key === "childtext" ){
	    if( obj.params.children && obj.params.children.length > 0 ){
		if( obj.params.children[0].obj        &&
		    obj.params.children[0].obj.params ){
		    return val !== obj.params.children[0].obj.params.text;
		}
		return false;
	    }
	    return val !== obj.params.text;
	}
	if( key === "strokeWidth" ){
	    if( obj.params && obj.params.sw1 ){
		return val !== obj.params.sw1;
	    } else {
		return true;
	    }
	}
	if( key === "strokeDashes" ){
	    if( obj.strokeDashArray){
		return JSON.stringify(obj.strokeDashArray) !==
		       JSON.stringify(val);
	    }
	    if( $.isArray(val) ){
		switch(val.length){
		case 0:
		    return false;
		case 1:
		    return val[0] !== "";
		case 2:
		default:
		    return val[0] !== "" && val[1] !== "";
		}
	    } else {
		return val !== "";
	    }
	}
	if( key !== "tags" && val === "" ){
	    return false;
	}
	if( key === "misc" && val !== "" ){
	    return true;
	}
	if( key === "radii" && obj.params.radii ){
	    // https://stackoverflow.com/questions/1773069/using-jquery-to-compare-two-arrays-of-javascript-objects
	    // v1 = val.split(",").map((item) => {return parseFloat(item)});
	    // v2 = obj.params.radii;
	    // return $(v1).not(v2).length !== 0 || $(v2).not(v1).length !== 0;
	    // always return true or else annuli won't change other properties
	    return true;
	}
	if( key === "angle" ){
	    return obj.angle !== -parseFloat(val);
	}
	if( key === "ix" ){
	    if( obj.pub.preservedcoords             &&
		val.charAt(0).toLowerCase() === "d" ){
		return fmtcheck(obj.pub.dx, JS9.saostrtod(val.substring(1)));
	    } else {
		return fmtcheck(obj.pub.x, JS9.saostrtod(val));
	    }
	}
	if( key === "iy" ){
	    if( obj.pub.preservedcoords             &&
		val.charAt(0).toLowerCase() === "d" ){
		return fmtcheck(obj.pub.dy, JS9.saostrtod(val.substring(1)));
	    } else {
		return fmtcheck(obj.pub.y, JS9.saostrtod(val));
	    }
	}
	if( key === "px" && obj.pub.lcs ){
	    return fmtcheck(obj.pub.lcs.x.toFixed(1), val);
	}
	if( key === "py" && obj.pub.lcs ){
	    return fmtcheck(obj.pub.lcs.y.toFixed(1), val);
	}
	if( key === "ra" ){
	    if( obj.pub.wcsconfig && obj.pub.wcsconfig.wcsposstr ){
		return fmtcheck(JS9.saostrtod(obj.pub.wcsconfig.wcsposstr[0]),
				JS9.saostrtod(val));
	    } else if( obj.pub.wcsposstr ){
		return fmtcheck(JS9.saostrtod(obj.pub.wcsposstr[0]),
				JS9.saostrtod(val));
	    }
	    return false;
	}
	if( key === "dec" ){
	    if( obj.pub.wcsconfig && obj.pub.wcsconfig.wcsposstr ){
		return fmtcheck(JS9.saostrtod(obj.pub.wcsconfig.wcsposstr[1]),
				JS9.saostrtod(val));
	    } else if( obj.pub.wcsposstr ){
		return fmtcheck(JS9.saostrtod(obj.pub.wcsposstr[1]),
				JS9.saostrtod(val));
	    }
	}
	if( key === "sticky" ){
	    if( multi ){
		return false;
	    } else {
		return fmtcheck(obj.pub.sticky||false, val);
	    }
	}
	if( key === "locked" ){
	    if( multi ){
		return false;
	    } else {
		if( obj.params.changeable !== false ){
		    return val === false;
		} else {
		    return val === true;
		}
	    }
	}
	if( key === "listonchange" ){
	    if( multi ){
		return false;
	    }
	}
	if( obj.pub.lcs && obj.pub.lcs[key] !== undefined ){
	    if( fmtcheck(obj.pub.lcs[key], val) ){
		return true;
	    }
	    // don't look further or we end up checking image x, y
	    return false;
	}
	if( fmtcheck(obj.pub[key], val) ){
	    return true;
	}
	if( fmtcheck(obj.params[key], val) ){
	    return true;
	}
	if( fmtcheck(obj[key], val) ){
	    return true;
	}
	return false;
    };
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
    const replaceNewline = (s) => {
	const nl = String.fromCharCode(13, 10);
	if( typeof s === "string" ){
	    return s.replace(/\\n/g, nl);
	}
	return s;
    };
    // set physical to image conversion, if possible
    if( this.lcs && this.lcs.physical ){
	bin = Math.sqrt(Math.pow(this.lcs.physical.forward[0][0],2) +
		        Math.pow(this.lcs.physical.forward[0][1],2));
    }
    // which wcssys do we use? edit version, if available
    if( obj && obj.pub ){
	if( obj.pub.wcsconfig && obj.pub.wcsconfig.wcssys  ){
	    wcssys = obj.pub.wcsconfig.wcssys;
	} else {
	    wcssys = this.params.wcssys;
	}
    } else {
	wcssys = this.params.wcssys;
	// fake obj: makes the checks easier, avoid if( obj ... ) everywhere
	obj = defobj;
    }
    // multi selection or single region
    multi = $(form).data("multi");
    // layer or regions
    layer = obj.pub.layer || "regions";
    // process array of keyword/values
    for(i=0; i<alen; i++){
	key = arr[i].name;
	val = arr[i].value;
	// pos keys: convert to correct type of position before switch statment
	if( key === "xpos" || key === "ypos" ){
	    switch(wcssys){
	    case "image":
		key = `i${key.charAt(0)}`;
		break;
	    case "physical":
		key = `p${key.charAt(0)}`;
		break;
	    default:
		if( this.validWCS() ){
		    if( key === "xpos" ){
			key = "ra";
		    } else {
			key = "dec";
		    }
		} else {
		    if( key === "xpos" ){
			key = "ix";
		    } else {
			key = "iy";
		    }
		}
		break;
	    }
	}
	switch(key){
	// these are never passed on
	case "multitext":
	case "colorPicker":
	case "savefile":
	case "rwcsbutton":
	case "savewcs":
	case "saveformat":
	case "includejson":
	case "includecomments":
	case "savewhich":
	case "savedcoords":
	    break;
	case "text":
	    if( obj.type === "text" ){
		if( newval(obj, key, val) ){
		    opts[key] = replaceNewline(val);
		}
	    }
	    break;
	case "selectfilter":
	    if( val && val !== $(form).data('selectfilter') ){
		// save current filter
		$(form).data('selectfilter', val);
		// make selection
		if( this.lookupGroup(val) ){
		    this.groupShapes(layer, val);
		} else {
		    this.selectShapes(layer, val);
		}
		// don't do anything else when making a new filter selection
		return;
	    }
	    break;
	case "strokeDashes":
	    if( val === "" ){
		opts.strokeDashArray = [];
	    } else {
		nval = val.trim().split(/\s+/);
		if( (multi && val) || newval(obj, key, nval) ){
		    if( nval.length === 0 ){
			opts.strokeDashArray = [];
		    } else {
			opts.strokeDashArray = nval.map( s => parseInt(s, 10) );
		    }
		}
	    }
	    break;
	case "strokeWidth":
	    if( val === "" ){
		opts[key] = "";
	    } else {
		if( JS9.isNumber(val) ){
		    nval = parseInt(val, 10);
		    if( nval <= 0 ){
			opts[key] = "";
		    } else if( (multi && val)                     ||
			       (!multi && newval(obj, key, nval)) ){
			opts[key] = getval(nval);
		    }
		}
	    }
	    break;
	case "color":
	    if( val === "" ){
		opts[key] = "";
	    } else if( newval(obj, key, val) ){
		opts[key] = getval(val);
	    }
	    break;
	case "tags":
	    if( multi ){
		if( val ){
		    if( val === '""' || val === "''" ){
			opts[key] = "";
		    } else {
			opts[key] = getval(val);
		    }
		}
	    } else if( newval(obj, key, val) ){
		opts[key] = getval(val);
	    }

	    break;
	case "childtext":
	    if( obj.type !== "text" ){
		if( newval(obj, key, val) ){
		    opts.text = replaceNewline(val);
		}
	    }
	    break;
	case "ix":
	    if( newval(obj, key, val) ){
		if( obj.pub.preservedcoords             &&
		    val.charAt(0).toLowerCase() === "d" ){
		    opts.dx = getval(val.substring(1));
		    if( opts.dy === undefined && obj.pub.dy !== undefined ){
			opts.dy = obj.pub.dy;
		    }
		} else {
		    opts.x = getval(val);
		    if( opts.y === undefined && obj.pub.y !== undefined ){
			opts.y = obj.pub.y;
		    }
		}
	    }
	    break;
	case "iy":
	    if( newval(obj, key, val) ){
		if( obj.pub.preservedcoords             &&
		    val.charAt(0).toLowerCase() === "d" ){
		    opts.dy = getval(val.substring(1));
		    if( opts.dx === undefined && obj.pub.dx !== undefined ){
			opts.dx = obj.pub.dx;
		    }
		} else {
		    opts.y = getval(val);
		    if( opts.x === undefined && obj.pub.x !== undefined ){
			opts.x = obj.pub.x;
		    }
		}
	    }
	    break;
	case "px":
	    if( newval(obj, key, val) ){
		opts.px = getval(val);
		if( opts.py === undefined && obj.pub.lcs ){
		    opts.py = obj.pub.lcs.y;
		}
	    }
	    break;
	case "py":
	    if( newval(obj, key, val) ){
		opts.py = getval(val);
		if( opts.px === undefined && obj.pub.lcs ){
		    opts.px = obj.pub.lcs.x;
		}
	    }
	    break;
	case "ra":
	    if( newval(obj, key, val) ){
		opts.ra = val;
		if( opts.dec === undefined ){
		    if( obj.pub.wcsconfig && obj.pub.wcsconfig.wcsposstr ){
			opts.dec = obj.pub.wcsconfig.wcsposstr[1];
		    } else if( obj.pub.wcsposstr ){
			opts.dec = obj.pub.wcsposstr[1];
		    }
		}
	    }
	    break;
	case "dec":
	    if( newval(obj, key, val) ){
		opts.dec = val;
		if( opts.ra === undefined ){
		    if( obj.pub.wcsconfig && obj.pub.wcsconfig.wcsposstr ){
			opts.ra = obj.pub.wcsconfig.wcsposstr[0];
		    } else if( obj.pub.wcsposstr ){
			opts.ra = obj.pub.wcsposstr[0];
		    }
		}
		if( opts.wcssys === undefined ){
		    opts.wcssys = wcssys;
		}
	    }
	    break;
	case "wcssys":
	    break;
	case "radius":
	case "length":
	case "width":
	case "r1":
	    switch(wcssys){
	    case "image":
		if( newval(obj, key, val) ){
		    opts[key] = getval(val);
		}
		break;
	    case "physical":
		if( newval(obj, key, val) ){
		    opts[key] = getval(val) * bin;
		}
		break;
	    default:
		nval = JS9.strtoscaled(val);
		val = Math.abs(nval.dval / wcsinfo.cdelt1);
		nkey = key.replace("wcs", "");
		if( newval(obj, nkey, val) ){
		    opts[nkey] = getval(val);
		}
		break;
	    }
	    break;
	case "height":
	case "r2":
	    switch(wcssys){
	    case "image":
		if( newval(obj, key, val) ){
		    opts[key] = getval(val);
		}
		break;
	    case "physical":
		if( newval(obj, key, val) ){
		    opts[key] = getval(val) * bin;
		}
		break;
	    default:
		nval = JS9.strtoscaled(val);
		val = Math.abs(nval.dval / wcsinfo.cdelt2);
		nkey = key.replace("wcs", "");
		if( newval(obj, nkey, val) ){
		    opts[nkey] = getval(val);
		}
		break;
	    }
	    break;
	case "radii":
	    if( newval(obj, key, val) ){
		opts[key] = val;
	    }
	    break;
	case "linelength":
	    if( obj.pub.pts && obj.pub.pts.length === 2 ){
		if( JS9.isNumber(val) && val !== this.tmp.linelength ){
		    val = parseFloat(val);
		    switch(wcssys){
		    case "image":
		    case "physical":
			break;
		    default:
			if( wcsinfo.cdelt1 !== undefined ){
			    val /= Math.abs(wcsinfo.cdelt1);
			} else if( wcsinfo.cdelt2 !== undefined ){
			    val /= Math.abs(wcsinfo.cdelt2);
			}
			break;
		    }
		    if( opts.pts ){
			p1 = opts.pts[0];
			p2 = opts.pts[1];
		    } else {
			p1 = obj.pub.pts[0];
			p2 = obj.pub.pts[1];
		    }
		    if( $.inArray("line",
				  JS9.Regions.opts.noCenteredScaling) >= 0 ){
			// leave p1 fixed
			// https://math.stackexchange.com/questions/175896/finding-a-point-along-a-line-a-certain-distance-away-from-another-point
			d = Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) +
				      (p1.y - p2.y) * (p1.y - p2.y) );
			x = p1.x - (val * (p1.x - p2.x))/d;
			y = p1.y - (val * (p1.y - p2.y))/d;
			opts.pts = [p1, {x, y}];
		    } else {
			// leave center fixed
			cpos = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
			ang = parseFloat(this.tmp.lineangle)||0;
			p1.x = cpos.x - val/2;
			p1.y = cpos.y;
			p2.x = cpos.x + val/2;
			p2.y = cpos.y;
			opts.pts = [JS9.rotatePoint(p1, ang, cpos),
				    JS9.rotatePoint(p2, ang, cpos)];
		    }
		}
	    }
	    break;
	case "lineangle":
	    if( obj.pub.pts && obj.pub.pts.length === 2 ){
		if( JS9.isNumber(val) && val !== this.tmp.lineangle ){
		    ang = parseFloat(val) - parseFloat(this.tmp.lineangle)||0;
		    if( opts.pts ){
			p1 = opts.pts[0];
			p2 = opts.pts[1];
		    } else {
			p1 = obj.pub.pts[0];
			p2 = obj.pub.pts[1];
		    }
		    if( $.inArray("line",
				  JS9.Regions.opts.noCenteredScaling) >= 0 ){
			// leave p1 fixed
			opts.pts = [p1, JS9.rotatePoint(p2, ang, p1)];
		    } else {
			// leave center fixed
			cpos = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
			opts.pts = [JS9.rotatePoint(p1, ang, cpos),
				    JS9.rotatePoint(p2, ang, cpos)];
		    }
		}
	    }
	    break;
	case "remove":
	    if( newval(obj, key, val) ){
		if( multi ){
		    opts[key] = "selected";
		} else if( obj.pub.id !== undefined ){
		    opts[key] = obj.pub.id;
		}
	    }
	    break;
	case "locked":
	    if( newval(obj, key, !getval(val)) ){
		opts.changeable = !getval(val);
	    }
	    break;
	case "misc":
	    if( val.trim() ){
		try{ nopts = JSON.parse(val); $.extend(opts, nopts); }
		catch(e){ JS9.error(`invalid json: ${val}`);}
	    }
	    break;
	default:
	    if( newval(obj, key, val) ){
		opts[key] = getval(val);
	    }
	    break;
	}
    }
    // change the shape(s), if necessary
    if( Object.keys(opts).length > 0 ){
	if( multi ){
	    sel = $(form).find(`[name='selectfilter']`).val() || "selected";
	    this.changeShapes(layer, sel, opts);
	} else {
	    sel = $(form).find(`[name='id']`).val() || obj;
	    this.changeShapes(layer, sel, opts);
	}
	this.initRegionsForm(obj, {multi});
    }
};

// convenience routine used in regionsConfig.html
JS9.Regions.regionsConfigSetSelectFilter = function(el, def) {
    let i, s, curval, lastval, nval, nfilter;
    let arr = [];
    let defarr = [];
    let grparr = [];
    const form = el.closest('form');
    const filter = form.find(`[name='selectfilter']`);
    const im = form.data('im');
    const withparens = (s) => {
	let t;
	if( !s ){ return ""; }
	t = s.trim();
	if( t.charAt(0) === "(" && t.charAt(t.length-1) === ")" ){
	    return t;
	} else {
	    return `(${t})`;
	}
    };
    // sanity check
    if( !im ){ return; }
    // groups
    grparr = im.listGroups("all", {includeregions:false}).split("\n");
    // new value from menu
    nval =  el.val().trim();
    // cur value from filter select
    curval = filter.val().trim();
    // handle "saved" specially
    if( def === "other" && nval === "saved" ){
	// compose and set the new filter selection
	s = im.layers.regions.selection || "";
	if( s ){
	    if( curval ){
		s = `${withparens(s)} && ${withparens(curval)}`;
	    }
	}
	filter.val(`${s}`);
	// reset the menu
	el.prop('selectedIndex', 0);
	return;
    }
    if( curval ){
	arr = curval.split(/\s+/);
    }
    if( arr.length ){
	lastval = arr[arr.length-1];
	if( !nval.match(/[&|]/) && !lastval.match(/[&|!]/) ){
	    // get array of possible values
	    switch(def){
	    case "regions":
		defarr = JS9.regions;
		break;
	    case "colors":
		break;
	    case "tags":
		break;
	    case "wcssys":
		defarr = JS9.wcssyss;
		break;
	    case "groups":
		defarr = grparr;
		break;
	    case "ops":
		defarr = ["!", "&&", "||"];
		break;
	    }
	    if( $.inArray(lastval, defarr) >= 0 ){
		// if new and last val is of the same type, use || for union
		// (intersection of same types, but non-identical, is null)
		nval = `|| ${nval}`;
	    } else if( $.inArray(lastval, grparr) >= 0 ||
		       $.inArray(nval, grparr) >= 0    ){
		// if either is a group, use || for union
		// (intersection of non-identical groups is null)
		nval = `|| ${nval}`;
	    } else {
		// use && for intersection, e.g., color && shape
		nval = `&& ${nval}`;
	    }
	}
    }
    // this is the new filter
    nfilter = `${curval} ${nval}`;
    // futz w/parens: split by ||, add parens around segments containing &&
    // if you used the menus to choose these:
    //   circle blue || box red
    // then instead of this:
    //   circle && blue || box && red
    // we should end up with this:
    //   (circle && blue) || (box && red)
    if( JS9.globalOpts.regConfigAddParens ){
	arr = nfilter.split("||");
	if( arr.length >= 2 ){
	    for(i=0; i<arr.length; i++){
		s = arr[i].trim();
		if( s.indexOf("&&") > 0 ){
		    arr[i] = withparens(s);
		} else {
		    arr[i] = s;
		}
	    }
	}
	nfilter = arr.join(' || ').replace(/  */g, " ");
    }
    // compose and set the new filter selection
    filter.val(nfilter);
    // reset the menu
    el.prop('selectedIndex', 0);
};

// convenience routine used in regionsConfig.html
JS9.Regions.regionsConfigSetSelectMenu = function(im, form, key) {
    let i, j, s, el, objs, gots, arr;
    const initmenu = (el) => {
	let i;
	// remove all but the header (0th option)
	for(i=el.options.length-1; i>=1; i--) {
	    el.remove(i);
	}
    };
    if( !key.match(/^select/) ){
	key = `select${key}`;
    }
    el = form.find(`[name='${key}']`);
    // reinit: clear menu
    initmenu(el[0]);
    // current objects
    objs = im.getShapes("regions", "all");
    // add items
    switch(key){
    case "selectshape":
	for(i=0, gots=[]; i<objs.length; i++){
	    s = objs[i].shape;
	    if( $.inArray(s, gots) < 0 ){
		el.append(`<option>${s}</option>`);
		gots.push(s);
	    }
	}
	break;
    case "selectcolor":
	for(i=0, gots=[]; i<objs.length; i++){
	    s = objs[i].color;
	    if( $.inArray(s, gots) < 0 ){
		el.append(`<option>${s}</option>`);
		gots.push(s);
	    }
	}
	break;
    case "selecttag":
	for(i=0, gots=[]; i<objs.length; i++){
	    s = objs[i].tags;
	    for(j=0; j<s.length; j++){
		if( $.inArray(s[j], gots) < 0 ){
		    el.append(`<option>${s[j]}</option>`);
		    gots.push(s[j]);
		}
	    }
	}
	break;
    case "selectwcs":
	for(i=0, gots=[]; i<objs.length; i++){
	    if( objs[i].wcsconfig ){
		s = objs[i].wcsconfig.wcssys;
		if( $.inArray(s, gots) < 0 ){
		    el.append(`<option>${s}</option>`);
		    gots.push(s);
		}
	    }
	}
	break;
    case "selectgroup":
	s = im.listGroups("all", {includeregions:false});
	if( s ){
	    arr = s.split("\n");
	    for(i=0; i<arr.length; i++){
		el.append(`<option>${arr[i]}</option>`);
	    }
	}
	break;
    }
};

// convenience routine used in regionsConfig.html
JS9.Regions.regionsConfigSetSelectOrGroup = function(im, form, key, update){
    let obj, group, canvas;
    let el1 = form.find(`[name="selectfilter"]`);
    let el2 = form.find(`[name="multitext"]`);
    let selection = el1.val().trim();
    // sanity check
    if( !im ){ return; }
    // convenience variables
    canvas = im.layers.regions.canvas;
    // default is to allow update of multi-selection dialog
    // sometimes we definitely don't want that to happen, so ...
    if( update === false ){ im.tmp.updateMulti = false; }
    // default is to select
    if( !selection ){
	el1.val("");
	el2.val("");
	form.data("selectfilter", "");
	if( canvas.getActiveObject() ){
	    canvas.discardActiveObject();
	}
	canvas.renderAll()
	key = "clear";
    }
    if( !key ){
	key = im.lookupGroup(selection) ? "group" : "select";
    }
    switch(key){
    case "select":
	form.data("selectfilter", selection);
	im.selectShapes("regions", selection, {transparentgroup: false});
	break;
    case "group":
	form.data("selectfilter", selection);
	group = im.groupShapes("regions", selection);
	el1.val(group);
	el2.val(im.listGroups(group))
	obj = im.lookupGroup(group);
	if( obj ){
	    canvas.setActiveObject(obj);
	    canvas.renderAll();
	    JS9.Regions.regionsConfigSetSelectMenu(im, form, "selectgroup");
	}
	break;
    case "ungroup":
	im.ungroupShapes("regions", selection);
	el1.val("");
	el2.val("");
	form.data("selectfilter", "");
	if( canvas.getActiveObject() ){
	    canvas.discardActiveObject();
	}
	JS9.Regions.regionsConfigSetSelectMenu(im, form, "selectgroup");
	break;
    case "clear":
	form.find(`input[name="color"]`).val("");
	form.find(`input[name="strokeWidth"]`).val("");
	form.find(`input[name="strokeDashes"]`).val("");
	form.data("strokewidth", "");
	form.data("strokedashes", "");
	break;
    default:
	break;
    }
    delete im.tmp.updateMulti;
};

// paste a region from clipboard
// call using image context
JS9.Regions.pasteFromClipboard = function(curpos){
    let i, s, nobj, xpos, ypos, oval;
    let objs = [];
    let xcen = 0, ycen = 0;
    const rregexp = /(annulus|box|circle|cross|ellipse|line|polygon|point|text) *\(/;
    // sanity check
    if( !this ){ return; }
    // get string from clipboard
    s = JS9.CopyFromClipboard().trim();
    // see if we have anything at all
    if( !s ){
	JS9.error(JS9.CLIPBOARDERROR);
    }
    // see if we have region(s)
    if( s.match(rregexp) ){
	// we don't update the clipboard for these operations
	oval = JS9.globalOpts.regToClipboard;
	JS9.globalOpts.regToClipboard = false;
	// add regions (don't update clipboard)
	objs = this.addShapes("regions", s, {rtn: "objs"});
	// place regions in the position specified by the mouse, if necessary
	if( curpos ){
	    // number of regions
	    nobj = objs.length;
	    // get centroid
	    for(i=0; i<nobj; i++){
		xcen += objs[i].pub.x;
		ycen += objs[i].pub.y;
	    }
	    xcen /= nobj;
	    ycen /= nobj;
	    // move to current position specified by mouse
	    for(i=0; i<nobj; i++){
		xpos = objs[i].pub.x - xcen + this.ipos.x;
		ypos = objs[i].pub.y - ycen + this.ipos.y;
		this.changeShapes("regions", objs[i].pub.id, {x: xpos, y:ypos});
	    }
	}
	JS9.globalOpts.regToClipboard = oval;
    } else {
	JS9.error(JS9.CLIPBOARDERROR2);
    }
    return s;
};

// ---------------------------------------------------------------------------
// Regions prototype additions to JS9 Image class
// ---------------------------------------------------------------------------

// list one or more regions
JS9.Regions.listRegions = function(which, opts, layerName){
    let i, j, region, rlen, key, obj, tagjoin, tagstr, iestr, mode, val, got;
    let txeq, owcsunits, owcssys, wcssys, layer;
    let regstr="";
    let lasttype="none";
    let dotags = false;
    let pubs = [];
    let exports = {};
    let preservedcoords = [];
    const sepstr="; ";
    const tagcolors = [];
    const topts = {includeObj: true};
    // opts is optional
    opts = opts || {};
    // opts can be an object or json
    if( typeof opts === "string" ){
	try{ opts = JSON.parse(opts); }
	catch(e){ JS9.error(`can't parse listRegions opts: ${opts}`, e); }
    }
    // pass sortids from opts to topts (used by getShapes)
    if( JS9.notNull(opts.sortids) ) topts.sortids = opts.sortids;
    // default is to display, including non-source tags
    mode = opts.mode;
    if( JS9.isNull(mode) ){
	mode = 3;
    }
    // default is to list the regions layer
    layerName = layerName || "regions";
    layer = this.getShapeLayer(layerName);
    // sanity check
    if( !layer ){ return; }
    // set user-specified wcs, if necessary
    if( opts.wcssys || opts.wcsunits ){
	txeq = JS9.globalOpts.xeqPlugins;
	JS9.globalOpts.xeqPlugins = false;
	if( opts.wcssys ){
	    owcssys = this.getWCSSys();
	    this.setWCSSys(opts.wcssys, false);
	    wcssys = this.getWCSSys();
	}
	if( opts.wcsunits ){
	    owcsunits = this.getWCSUnits();
	    this.setWCSUnits(opts.wcsunits, false);
	}
	// update wcs values
	this.updateShapes(layerName, which, "export");
    }
    // include dcoord shapes?
    if( JS9.isNull(opts.includedcoords) ){
	opts.includedcoords = JS9.globalOpts.regListDCoords;
    }
    // get specified regions into an array
    pubs = this.getShapes(layerName, which, topts);
    // loop through shapes
    rlen = pubs.length;
    // display tags if at least one is not standard "source,include"
    if( mode ){
	for(i=0; i<rlen; i++){
	    region = pubs[i];
	    tagjoin = region.tags.join(",");
	    if( tagjoin                        &&
		(tagjoin !== "source,include") &&
		(tagjoin !== "include,source") ){
		dotags = true;
		break;
	    }
	}
    }
    // get array of colors associated with tags
    for( key of Object.keys(JS9.Regions.opts.tagcolors) ){
	tagcolors.push(JS9.Regions.opts.tagcolors[key]);
    }
    // process all regions
    for(i=0; i<rlen; i++){
	region = pubs[i];
	obj = region.obj;
	preservedcoords = [];
	// don't list sticky regions, if specified
	// used by refresh to avoid changing sticky regions
	if( region.sticky && opts.sticky === false ){
	    continue;
	}
	// don't list regions where we are preserving dcoords, if specified
	if( region.preservedcoords && !opts.includedcoords ){
	    continue;
	}
	// don't list regions to a display if ignore is set
	if( region.ignore && !opts.ignoreignore ){
	    continue;
	}
	// preserving dcoords get handled specially
	if( $.isArray(obj.params.preservedcoords) ){
	    // make array of raw values to output
	    for(j=0; j<obj.params.preservedcoords.length; j++){
		key = obj.params.preservedcoords[j];
		switch(key){
		case "pts":
		    if( $.inArray("dx", preservedcoords) < 0 ){
			preservedcoords.push("dx");
		    }
		    if( $.inArray("dy", preservedcoords) < 0 ){
			preservedcoords.push("dy");
		    }
		    if( $.inArray("points", preservedcoords) < 0 ){
			preservedcoords.push("points");
		    }
		    break;
		default:
		    preservedcoords.push(key);
		    break;
		}
	    }
	    if( lasttype !== "none" ){
		regstr += sepstr;
	    }
	    if( lasttype !== "image" ){
		regstr += "image";
		regstr += sepstr;
	    }
	    regstr += `${region.shape}({`;
	    // return values originally passed when creating regions
	    for(j=0, got=0; j<preservedcoords.length; j++){
		key = preservedcoords[j];
		// skip keys added during processing
		if( key === "shape" ){ continue; }
		if( key === "sticky" ){ continue; }
		if( key === "wcsconfig" ){ continue; }
		// convert pts to points, along with dx, dy
		if( key === "pts" ){
		    key = "dx";
		    obj.params.preservedcoords.push("dy");
		    obj.params.preservedcoords.push("points");
		}
		// convert raw array to original boolean
		if( key === "preservedcoords" ){
		    val = true;
		} else if( JS9.notNull(region[key]) ){
		    val = region[key];
		} else if( JS9.notNull(obj[key]) ){
		    val = obj[key];
		} else {
		    switch(key){
		    case "dx":
			val = obj.left;
			break;
		    case "dy":
			val = obj.top;
			break;
		    case "color":
			val = obj.stroke;
			break;
		    default:
			val = null;
			break;
		    }
		}
		// format the value
		if( val ){
		    if( got++ > 0 ){ regstr += ","; }
		    regstr += `"${key}":`;
		    switch(typeof val){
		    case "string":
			regstr += `"${val}"`;
			break;
		    case "object":
			try{ regstr += JSON.stringify(val); }
			catch(e){ JS9.error(`can't parse: ${val}`, e); }
			break;
		    default:
			regstr += `${val}`;
			break;
		    }
		}
	    }
	    regstr += `})`;
	    lasttype = "image";
	    continue;
	}
	// init tags
	tagjoin = region.tags.join(",");
	if( tagjoin.includes("exclude") ){
	    iestr = "-";
	} else {
	    iestr = "";
	}
	// add exported properties
	exports = this._getRegionExports(obj, region, owcssys, wcssys, opts);
	// add id, if necessary
	if( opts.saveid ){
	    exports.id = region.id;
	} else {
	    delete exports.id;
	}
	// save wcsconfig, if necessary
	if( opts.savewcsconfig && region.wcsconfig   &&
	    Object.keys(region.wcsconfig).length > 0 ){
	    exports.wcsconfig = $.extend(true, {}, region.wcsconfig);
	} else {
	    delete exports.wcsconfig;
	}
	// add color, if necessary
	if( region.color && !tagcolors.includes(region.color) ){
	    exports.color = region.color;
	}
	// display tags?
	if( dotags ){
	    tagstr = ` # ${tagjoin}`;
	}
	// save editing?
	if( !opts.saveediting ){
	    delete exports.editing;
	}
	// use wcs string, if available
	if( region.wcsstr && JS9.isWCSSys(this.params.wcssys) ){
	    if( lasttype !== "wcs" ){
		if( lasttype !== "none" ){
		    regstr += sepstr;
		}
		// use region wcs sys, if possible
		// (current wcssys might be different!)
		if( region.wcssys ){
		    regstr += region.wcssys;
		} else {
		    regstr += this.params.wcssys;
		}
		lasttype = "wcs";
	    }
	    regstr += (sepstr + iestr + region.wcsstr);
	} else if( region.imstr ){
	    // else use image string, if available
	    if( lasttype !== region.imsys ){
		if( lasttype !== "none" ){
		    regstr += sepstr;
		}
		regstr += region.imsys;
		lasttype = region.imsys;
	    }
	    regstr += (sepstr + iestr + region.imstr);
	}
	// odd modes output the exports
	if( opts.includejson !== false        &&
	    ((mode % 2) === 1)                &&
	    (Object.keys(exports).length > 0) ){
	    // line region: remove size/distance info
	    if( region.shape === "line" ){
		regstr = regstr.replace(/ *{[^{}]*}$/,"");
	    }
	    regstr += ` ${JSON.stringify(exports)}`;
	}
	if( tagstr ){
	    regstr += tagstr;
	}
    }
    // remove comments, if necessary
    if( opts.includecomments === false ){
	regstr = regstr.replace(/ *#[^;]*/g, "");
    }
    // restore original wcs, if necessary
    if( owcssys || owcsunits ){
	if( owcssys ){
	    this.setWCSSys(owcssys, false);
	}
	if( owcsunits ){
	    this.setWCSUnits(owcsunits, false);
	}
	// restore wcs values
	this.updateShapes(layerName, which, "export");
	JS9.globalOpts.xeqPlugins = txeq;
    }
    // display the region string, if necessary
    if( mode > 1 ){
	this.display.displayMessage("regions", regstr);
    }
    // always return the region string
    return regstr;
};

// build the export object (the properties to serialize/save) for a region.
// Extracted from listRegions; recurses for a region's text child. owcssys/
// wcssys/opts come from the listRegions call. call using image context
JS9.Regions._getRegionExports = function(obj, region, owcssys, wcssys, opts){
	let i, s, key, child, ra, dec;
	const nexports = {};
	const params = obj.params;
	const children = params.children;
	const exports = params.exports;
	for(i=0; i<exports.length; i++){
	    // property name
	    key = exports[i];
	    // skip text keys (except text regions), get them from the children
	    if( (key === "text" && obj.type !== "text") ||
		(key === "textOpts") ){
		continue;
	    }
	    // ignore empty stroke dash array
	    if( key === "strokeDashArray" && obj.strokeDashArray ){
		s = obj.strokeDashArray.join("");
		if( (s === "") || s.match(/NaN/) ){
		    continue;
		}
	    }
	    // skip id when saving to a file
	    if( key === "id" && opts.file ){
		continue;
	    }
	    // skip wcsconfig when saving to a file
	    if( key === "wcsconfig" && opts.file ){
		continue;
	    }
	    // sometimes skip data when saving to a file
	    if( key === "data" && typeof params.data === "object" &&
		params.data.doexport === false && opts.file ){
		continue;
	    }
	    // strokeWidth can be changed as part of zooming,
	    // so use the original value if needed
	    if( (key === "strokeWidth") && params.sw1 ){
		nexports[key] = params.sw1;
		continue;
	    }
	    // looks for its value
	    if( obj[key] !== undefined ){
		nexports[key] = obj[key];
	    } else if( params[key] !== undefined ){
		nexports[key] = params[key];
	    } else if( region && region[key] !== undefined ){
		nexports[key] = region[key];
	    }
	}
	// handle text child properties specially
	// for now, just output the first one (cf. updateShape)
	if( (children.length > 0) && (children[0].obj.text) ){
	    child = children[0].obj;
	    // create a text child
	    nexports.text = child.text;
	    // get options for text child but ...
	    nexports.textOpts = this._getRegionExports(child, undefined, owcssys, wcssys, opts);
	    // try to minimize exported properties
	    if( obj.angle !== child.angle ){
		// child has an explicit angle different from parent
		nexports.textOpts.angle = -child.angle;
		if( (obj.params.shape === "circle")  ||
		    (obj.params.shape === "annulus") ){
		    child.params.hasTextOpts = true;
		}
	    } else if( child.angle !== 0 ){
		// parent is circle/annulus and child has an angle
		if( (obj.params.shape === "circle")  ||
		    (obj.params.shape === "annulus") ){
		    nexports.textOpts.angle = -child.angle;
		    child.params.hasTextOpts = true;
		}
	    }
	    if( child.params.parent.moved || child.params.hasTextOpts ){
		// wcs, then physical coords are preferred ...
		if( child.pub.ra && child.pub.dec ){
		    // convert child ra, dec to target wcs, if necessary
		    if( owcssys && wcssys && owcssys !== wcssys ){
			s = this.wcs2wcs(owcssys, wcssys,
					 child.pub.ra, child.pub.dec);
			s = s.trim().split(/\s+/);
			ra = JS9.saostrtod(s[0]);
			if( JS9.isHMS(wcssys) ){
			    ra *= 15.0;
			}
			dec = JS9.saostrtod(s[1]);
		    } else {
			ra = child.pub.ra;
			dec = child.pub.dec;
		    }
		    nexports.textOpts.ra  = ra;
		    nexports.textOpts.dec = dec;
		} else if( child.pub.lcs ){
		    nexports.textOpts.px = child.pub.lcs.x;
		    nexports.textOpts.py = child.pub.lcs.y;
		} else {
		    // ... image coords will are only good for this image
		    nexports.textOpts.x = child.pub.x;
		    nexports.textOpts.y = child.pub.y;
		}
	    }
	    if( nexports.textOpts.color === obj.stroke ){
		delete nexports.textOpts.color;
	    }
	    if( nexports.textOpts.text ){
		delete nexports.textOpts.text;
	    }
	    if( !Object.keys(nexports.textOpts).length ){
		delete nexports.textOpts;
	    }
	}
	return nexports;
};

// copy one or more regions to another image
// call using image context
JS9.Regions.copyRegions = function(to, which){
    return this.copyShapes("regions", to, which);
};

// parse a string containing a subset of DS9/Funtools regions
// call using image context
JS9.Regions.parseRegions = function(s, opts){
    let i, j, k, lines, obj, robj, txeq;
    let owcssys, owcsunits, wcssys, iswcs, liswcs, pos, alen;
    const regions = [];
    const regrexp = /^-?(annulus|box|circle|cross|ellipse|line|polygon|point|text)$/;
    const wcsrexp = /^(fk4|fk5|icrs|galactic|ecliptic|image|physical|linear)$/;
    const imrexp = /^(image|physical)$/;
    const unrexp = /[dr:]/;
    const parrexp = /\(\s*([^)]+?)\s*\)/;
    const seprexp = /\n|;/;
    const optsrexp = /(\{.*\})/;
    const argsrexp = /\s*,\s*/;
    const charrexp = /(\(|\{|#|;|\n)/;
    const comrexp  = /#(?![a-zA-Z0-9]{6}['"])/;
    // convert "0" to false and "1" to true
    const tf = (s) => {
	if( s === "0" || s.toLowerCase() === "false" ){return false;}
	return true;
    };
    // ds9 compatibility: get properties from comment string
    const ds9properties = (s) => {
	let xarr, key, key2, val, nobj;
	const xobj = {};
	const rexp = /([a-zA-Z][a-zA-Z0-9_]*)\s*=\s*(\d+(\s*\d+)*|[^ '"{]+|['"{][^'"}]*['"}])/g;
	const ds9opts = {
	    color(v) {return {color: v};},
	    dash(v) {if(v){return {strokeDashArray: [3,1]};}},
	    dashlist(v) {
		let i, arr;
		if( v ){
		    arr = v.split(" ");
		    for(i=0; i<arr.length; i++){
			arr[i] = parseFloat(arr[i]);
		    }
		    return {strokeDashArray: arr};
		}
	    },
	    delete(v) {return {removable: tf(v)};},
	    edit(v) {return {selectable: tf(v)};},
	    fixed(v) {return {zoomable: !tf(v)};},
	    font(v) {
		const obj = {};
		const arr = v.split(" ");
		const len = arr.length;
		if( len >= 1 ){ obj.fontFamily = arr[0]; }
		if( len >= 2 ){ obj.fontSize = parseFloat(arr[1]); }
		if( len >= 3 ){ obj.fontStyle  = arr[2]; }
		if( len >= 4 ){ obj.fontWeight = arr[3]; }
		return obj;
	    },
	    highlite(v) {return {hasControls: tf(v), hasBorders: tf(v), hasRotatingPoint: tf(v)};},
	    move(v) {return {movable: tf(v)};},
	    rotate(v) {return {rotatable: tf(v)};},
	    resize(v) {return {resizable: tf(v)};},
	    changeable(v) {return {changeable: tf(v)};},
	    select(v) {return {selectable: tf(v)};},
	    text(v) {return {text: v};},
	    tag(v) {return {tags: v};},
	    width(v) {return {strokeWidth: parseFloat(v)};}
	};
	// opts is optional
	opts = opts || {};
	// loop through DS9 region properties, converting to js9 props
	while( (xarr = rexp.exec(s)) !== null ){
	    key = xarr[1].toLowerCase();
	    val = xarr[2].replace(/^['"{]|['"}]$/g, "");
	    if( {}.hasOwnProperty.call(ds9opts, key) &&
		typeof ds9opts[key] === "function"   ){
		nobj = ds9opts[key](val) || {};
		for( key2 of Object.keys(nobj) ){
		    if( key2 === "tags" && {}.hasOwnProperty.call(xobj, key2) ){
			xobj[key2] += `,${nobj[key2]}`;
		    } else {
			xobj[key2] = nobj[key2];
		    }
		}
	    } else {
		xobj[key] = val;
	    }
	}
	// save the remaining comment
	s = s.replace(rexp, "");
	if( s ){
	    xobj._comment = s.trim();
	}
	return xobj;
    };
    // parse region line into cmd (shape or wcs), args, opts, comment
    const regparse1 = (s) => {
	let t, tarr, ds9props;
	const tobj = {};
	// initialize the return object
	tobj.opts = {};
	tobj.args = [];
	tobj.isregion = 0;
	// look for a command
	if( s.includes("(") ){
	    tobj.cmd = s.split("(")[0].trim().toLowerCase();
	} else if( s.includes("{") ){
	    tobj.cmd = s.split("{")[0].trim().toLowerCase();
	} else if( s.includes("#") ){
	    tobj.cmd = s.split("#")[0].trim().toLowerCase();
	} else {
	    tobj.cmd = s.trim().toLowerCase();
	}
	// got regions?
	if( tobj.cmd ){
	    tobj.isregion = (tobj.cmd.search(regrexp) >=0);
	}
	// split on comment (ignore color specifications starting with "#")
	t = s.trim().split(comrexp);
	// look for json opts after the arg list
	tarr = optsrexp.exec(t[0]);
	if( tarr && tarr[0] ){
	    // convert to object
	    try{ tobj.opts = JSON.parse(tarr[0].trim()); }
	    catch(e){ JS9.error(`can't parse opts: ${tarr[0]}`, e); }
	}
	// look for comments
	tobj.comment = t[1];
	if( tobj.comment ){
	    ds9props = ds9properties(tobj.comment.trim());
	    if( ds9props._comment !== undefined ){
		tobj.comment = ds9props._comment;
		delete ds9props._comment;
	    }
	}
	// merge with ds9 opts
	if( ds9props ){
	    tobj.opts = $.extend({}, ds9props, tobj.opts);
	}
	// separate the region args into an array
	tarr = parrexp.exec(s);
	if( tarr && tarr[0].match(optsrexp) ){
	    // no region args, all properties passed in json
	    tobj.args = [];
	} else if( tarr && tarr[1] ){
	    // region args, without json opts
	    tobj.args = tarr[1].split(argsrexp);
	}
	// look for - sign signifying an exclude region
	if( tobj.isregion && tobj.cmd.startsWith("-") ){
	    tobj.cmd = tobj.cmd.slice(1);
	    if( tobj.comment ){
		if( !tobj.comment.match(/exclude/) ){
		    tobj.comment += ",exclude";
		}
	    } else {
		tobj.comment = "exclude";
	    }
	}
	return tobj;
    };
    const getipos = (ix, iy) => {
	let vt, sarr, v1, v2;
	let obj = {};
	// special handling for display coords
	if( ix.charAt(0).toLowerCase() === "d" &&
	    iy.charAt(0).toLowerCase() === "d" ){
	    obj.dx = parseFloat(ix.substring(1));
	    obj.dy = parseFloat(iy.substring(1));
	    return obj;
	}
	// convert strings to numbers, along with unit delimiters
	v1 = JS9.strtoscaled(ix);
	v2 = JS9.strtoscaled(iy);
	// local override of wcs if:
	// a. we used sexagesimal units or appended d,r
	// b. we are not currently using wcs
	if( ((v1.dtype.match(unrexp)) || (v2.dtype.match(unrexp))) &&
	    !iswcs && !owcssys.match(imrexp) ){
	    liswcs = true;
	    wcssys = owcssys;
	}
	if( iswcs || liswcs ){
	    // arg1 coords are hms, but ecliptic, galactic are deg
	    if( JS9.isHMS(wcssys, v1.dtype) ){
		v1.dval *= 15.0;
	    }
	    // convert to degrees, if necessary
	    if( v1.dtype === "r" ){ v1.dval = v1.dval * 180 / Math.PI; }
	    if( v2.dtype === "r" ){ v2.dval = v2.dval * 180 / Math.PI; }
	    // get image coordinates
	    sarr = JS9.wcs2pix(this.raw.wcs, v1.dval, v2.dval).split(/ +/);
	    obj.x = parseFloat(sarr[0]);
	    obj.y = parseFloat(sarr[1]);
	    return obj;
	} else if( wcssys === "physical" ){
	    vt = this.logicalToImagePos({x: v1.dval, y: v2.dval});
	    obj.x = vt.x;
	    obj.y = vt.y;
	    return obj;
	}
	// image coords
	obj.x = v1.dval;
	obj.y = v2.dval;
	return obj;
    };
    // get image length
    const getilen = (len, which) => {
	let cstr, iscale;
	const v = JS9.strtoscaled(len);
	const wcsinfo = this.raw.wcsinfo || {cdelt1: 1, cdelt2: 1};
	// local override of wcs if:
	// a. we are not currently using wcs
	// b. we used sexagesimal units or appended d,r
	if( v.dtype.match(unrexp) && !iswcs && !owcssys.match(imrexp) ){
	    liswcs = true;
	    wcssys = owcssys;
	}
	if( iswcs || liswcs ){
	    // convert to degrees, if necessary
	    if( v.dtype === "r" ){ v.dval = v.dval * 180 / Math.PI; }
	    // angular separation is not implemented
	    // region wcs size is always based on cdelt
	    if( JS9.REGSIZE !== 0 ){
		JS9.error("region size based on ang sep is not implemented");
	    }
	    // wcs-based size
	    cstr = `cdelt${which}`;
	    v.dval = Math.abs(v.dval / wcsinfo[cstr]);
	} else if( wcssys === "physical" ){
	    // use the LTM1_1 value stored for logical to image transforms
	    if( this.lcs && this.lcs.physical ){
		iscale = Math.sqrt(Math.pow(this.lcs.physical.forward[0][0],2)+
				   Math.pow(this.lcs.physical.forward[0][1],2));
		v.dval = Math.abs(v.dval * iscale);
	    }
	}
	return v.dval;
    };
    // get image angle
    const getang = (a) => {
	const v = JS9.strtoscaled(a);
	return v.dval;
    };
    // get cleaned-up string
    const getstr = (s) => {
	const t = s.replace(/^['"]/, "").replace(/["']$/, "");
	return t;
    };
    // sanity check
    s = s.trim();
    if( !s.match(charrexp) ){
	return s;
    }
    // save original wcs
    owcssys = this.getWCSSys();
    owcsunits = this.getWCSUnits();
    // this is the default wcs for regions
    wcssys = "physical";
    // do we have a real wcs?
    iswcs = JS9.isWCSSys(wcssys);
    // get individual "lines" (new-line or semi-colon separated)
    lines = s.split(seprexp);
    // for each region or cmd
    for(i=0; i<lines.length; i++){
	// ignore comments
	if( lines[i].trim().substr(0,1) !== "#" ){
	    // reset temp wcs
	    liswcs = false;
	    // parse the line
	    robj = regparse1(lines[i]);
	    alen = robj.args.length;
	    // if this is a region ...
	    if( robj.isregion ){
		// start afresh or with opts from the region string
		obj = $.extend(true, {}, robj.opts);
		// save the shape
		obj.shape = robj.cmd;
		// save the current wcssys for editing
		obj.wcsconfig = obj.wcsconfig || {wcssys};
		// args are not required!
		if( alen >= 2               &&
		    obj.shape !== "line"    &&
		    obj.shape !== "polygon" ){
		    // get image position
		    $.extend(obj, getipos(robj.args[0], robj.args[1]));
		}
		// if textOpts has ra, dec, save the wcssys, it may be
		// different by the time textOpts gets processed
		if( obj.textOpts                    &&
		    obj.textOpts.ra  !== undefined  &&
		    obj.textOpts.dec !== undefined  ){
		    obj.textOpts._wcssys = wcssys;
		}
		// region args are optional
		switch(robj.cmd){
		case "annulus":
		    if( alen > 0 ){
			obj.radii = [];
			for(j=2; j<alen; j++){
			    obj.radii.push(getilen(robj.args[j], 1));
			}
		    }
		    break;
		case "box":
		case "cross":
		    if( alen >= 3 ){
			obj.width = getilen(robj.args[2], 1);
		    }
		    if( alen >= 4 ){
			obj.height = getilen(robj.args[3], 2);
		    }
		    if( alen >= 5 ){
			obj.angle = getang(robj.args[4]);
		    }
		    break;
		case "circle":
		    if( alen >= 3 ){
			obj.radius = getilen(robj.args[2], 1);
		    }
		    break;
		case "ellipse":
		    if( alen >= 3 ){
			obj.r1 = getilen(robj.args[2], 1);
		    }
		    if( alen >= 4 ){
			obj.r2 = getilen(robj.args[3], 2);
		    }
		    if( alen >= 5 ){
			obj.angle = getang(robj.args[4]);
		    }
		    break;
		case "line":
		case "polygon":
		    if( alen > 0 ){
			obj.pts = [];
			for(j=0, k=0; j<alen; j+=2, k++){
			    pos = getipos(robj.args[j], robj.args[j+1]);
			    if( JS9.notNull(pos.dx) && JS9.notNull(pos.dy) ){
				obj.pts[k] = {dx: pos.dx, dy: pos.dy};
			    } else {
				obj.pts[k] = {x: pos.x, y: pos.y};
			    }
			}
		    }
		    break;
		case "point":
		    break;
		case "text":
		    if( alen >= 3 ){
			obj.text = getstr(robj.args[2]);
		    }
		    if( alen >= 4 ){
			obj.angle = getang(robj.args[3]);
		    }
		    break;
		default:
		    break;
		}
		// comment contains the tags
		if( robj.comment ){
		    obj.tags = robj.comment;
		}
		// save this region
		regions.push(obj);
	    } else {
		// if its a wcs command
		if( robj.cmd.match(wcsrexp) ){
		    // reset the wcs system
		    txeq = JS9.globalOpts.xeqPlugins;
		    JS9.globalOpts.xeqPlugins = false;
		    this.setWCSSys(robj.cmd, false);
		    JS9.globalOpts.xeqPlugins = txeq;
		    // get new wcssys
		    wcssys = this.getWCSSys();
		    // is this a real wcs?
		    iswcs = JS9.isWCSSys(wcssys);
		} else if( robj.cmd === "remove" || robj.cmd === "delete" ){
		    regions.push({remove: true});
		}
	    }
	}
    }
    // restore original wcs
    txeq = JS9.globalOpts.xeqPlugins;
    JS9.globalOpts.xeqPlugins = false;
    this.setWCSSys(owcssys, false);
    this.setWCSUnits(owcsunits);
    JS9.globalOpts.xeqPlugins = txeq;
    // return the generated object
    return regions;
};

// save regions to a file
JS9.Regions.saveRegions = function(fname, which, layer){
    let i, s, t, header, regstr, format, blob, opts, arr, rid;
    // see if default type is implicit in the output file
    if( fname ){
	arr = fname.match(/\.([^.]*)$/);
	if( arr && arr[1] && arr[1].match(/^(reg|svg|csv)$/) ){
	    format = arr[1];
	}
    }
    // layer can be a layer name or an object describing layer, output type
    if( typeof layer === "object" ){
	opts = layer;
	layer = null;
    } else if( layer && typeof layer === "string" ){
	try{ opts = JSON.parse(layer); }
	catch(e){ opts = null; }
	if( opts ){ layer = null; }
    }
    // see if parameters are in the opts object
    if( opts ){
	// layer name
	if( JS9.notNull(opts.layer) ){
	    layer = opts.layer;
	}
	// old style 'type' property is now ...
	if( JS9.notNull(opts.type) ){
	    format = opts.type ;
	}
	// ... format
	if( JS9.notNull(opts.format) ){
	    format = opts.format ;
	}
    }
    // make sure we have an opts
    opts = opts || {};
    // last chance ... use defaults
    layer = layer || "regions";
    format =  format  || "reg";
    // and make a sanity check
    if( !this.layers[layer] ){
	JS9.error(`can't find layer for saveRegions: ${layer}`);
    }
    // construct final output file name, if necessary
    if( !fname ){
	if( layer !== "regions" ){
	    fname = `js9_${layer}.${format}`;
	} else {
	    fname = `js9.${format}`;
	}
    }
    // generate the specified output
    switch(format){
    case "svg":
	// convert layer to svg
	try{
	    // add border box, if necessary
	    if( JS9.globalOpts.svgBorder ){
		rid = this.addShapes(layer, "box",
				     {left:   this.rgb.img.width/2,
				      top:    this.rgb.img.height/2,
				      width:  this.rgb.img.width,
				      height: this.rgb.img.height,
				      color: "black",
				      strokeWidth: 1,
				      tags: "SVGBorder"
				     });
	    }
	    // convert canvas to SVG
	    s = this.layers[layer].dlayer.canvas.toSVG();
	    // remove border box, if necessary
	    if( JS9.globalOpts.svgBorder ){
		this.removeShapes(layer, rid);
	    }
	}
	catch(e){ JS9.error(`can't convert layer to SVG: ${layer}`);}
	break;
    case  "csv":
	// convert layer to region string
	try{
	    opts.mode = 1;
	    opts.file = fname;
	    // when saving csv, we might want to include the wcs info
	    if( JS9.isNull(opts.includewcs) ){
		opts.includewcs = JS9.globalOpts.csvIncludeWCS;
	    }
	    // when saving reg, we might want to exclude the dcoord shapes
	    if( JS9.isNull(opts.savedcoords) ){
		opts.includedcoords = JS9.globalOpts.regSaveDCoords;
	    }
	    // list of regions
	    regstr = this.listRegions(which, opts, layer);
	    // convert to csv
	    arr = regstr.split(";");
	    for(i=0, s=""; i<arr.length; i++){
		if( !arr[i] ){ continue; }
		if( arr[i].toLowerCase().match(JS9.WCSEXP) ){
		    if( opts.includewcs ){
			s += `${arr[i].trim()}\n`;
		    }
		} else {
		    t = arr[i].replace(/\(/, ",").replace(/\).*/, "").trim();
		    s += `${t}\n`;
		}
	    }
	}
	catch(e){ JS9.error(`can't convert layer to region: ${layer}`);	}
	break;
    case "reg":
    default:
	// convert layer to region string
	try{
	    header = "# Region file format: JS9 version 1.0";
	    opts.mode = 1;
	    opts.file = fname;
	    // when saving reg, we might want to exclude the json object
	    if( JS9.isNull(opts.includejson) ){
		opts.includejson = JS9.globalOpts.regIncludeJSON;
	    }
	    // when saving reg, we might want to exclude the comments
	    if( JS9.isNull(opts.includecomments) ){
		opts.includecomments = JS9.globalOpts.regIncludeComments;
	    }
	    // when saving reg, we might want to exclude the dcoord shapes
	    if( JS9.notNull(opts.savedcoords) ){
		opts.includedcoords = opts.savedcoords;
	    } else {
		opts.includedcoords = JS9.globalOpts.regSaveDCoords;
	    }
	    // list of regions
	    regstr = this.listRegions(which, opts, layer).replace(/; */g, "\n");
	    // add header, if necessary
	    if( opts.includecomments !== false ){
		s = `${header}\n${regstr}\n`;
	    } else {
		s = `${regstr}\n`;
	    }
	}
	catch(e){ JS9.error(`can't convert layer to region: ${layer}`);	}
	break;
    }
    // create the blob
    blob = new Blob([s], {type: "text/plain;charset=utf-8"});
    // save blob
    if( {}.hasOwnProperty.call(window, "saveAs") ){
	JS9.saveAs(blob, fname);
    } else {
	JS9.error("no saveAs() available to save region file");
    }
    // save file name
    this.tmp.saveregionsFile = fname;
    // return the filename
    return fname;
};

// unremove previously removed regions
JS9.Regions.unremoveRegions = function(){
    const s = this.regstack.pop();
    if( s ){
	return this.addShapes("regions", s);
    }
    return null;
};

// change region tags, e.g. set source, delete background
// e.g. im.changeRegionTags("selected", "source", "background");
// call using image context
JS9.Regions.changeRegionTags = function(which, addtags, remtags){
    let i, j, s, ctags, tags;
    which = which || "all";
    addtags = addtags || [];
    remtags = remtags || [];
    if( !$.isArray(addtags) ){
	addtags = addtags.split(",").map(i=>i.trim());
    }
    if( !$.isArray(remtags) ){
	remtags = remtags.split(",").map(i=>i.trim());
    }
    s = this.getShapes("regions", which);
    // for each shape ...
    for(i=0; i<s.length; i++){
	// current tags for this shape
	ctags = s[i].tags;
	// new tags for this shape
	tags = [];
	// add new tags, unless they already exist
	for(j=0; j<addtags.length; j++){
	    if( $.inArray(addtags[j], ctags) < 0 ){
		tags.push(addtags[j]);
	    }
	}
	// copy current tags, except the one we want to remove
	for(j=0; j<ctags.length; j++){
	    if( $.inArray(ctags[j], remtags) < 0 ){
		tags.push(ctags[j]);
	    }
	}
	this.changeShapes("regions", s[i].id, {tags});
    }
};

// toggle region tags, e.g. source <-> background, include <-> exclude
// e.g. im.toggleRegionTags("selected", "source", "background");
// call using image context
JS9.Regions.toggleRegionTags = function(which, x1, x2){
    let i, j, s, tags, xnew;
    which = which || "all";
    s = this.getShapes("regions", which);
    for(i=0; i<s.length; i++){
	tags = s[i].tags;
	xnew = "";
	for(j=0; j<tags.length; j++){
	    // switch tags
	    if( tags[j] === x1 ){
		tags[j] = x2;
		xnew = x2;
		break;
	    } else if( tags[j] === x2 ){
		tags[j] = x1;
		xnew = x1;
		break;
	    }
	}
	if( xnew ){
	    this.changeShapes("regions", s[i].id, {tags});
	}
    }
};

// ---------------------------------------------------------------------
// plotting utilities
// ---------------------------------------------------------------------

