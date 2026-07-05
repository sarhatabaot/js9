JS9.Plot = {};

JS9.Plot.CLASS = "JS9";
JS9.Plot.NAME = "Plot";

// defaults for plot creation
JS9.Plot.opts = {
    // generic options
    annotate: false,
    annotateColor: "#FF0000",
    color: "blue",
    // flot options
    zoomStack: {
	enabled: true
    },
    selection: {
	mode: "xy"
    },
    series: {
	clickable: true,
	hoverable: true,
        lines: { show: true },
        points: { show: false }
    },
    legend: {
	backgroundColor: null,
	backgroundOpacity: 0
    },
    // plotly options
    xaxis: {
	autorange: true
    },
    yaxis: {
	autorange: true
    },
    // title for plot config dialog box
    title: "Plot Configuration",
    // plot configuration url
    configURL: "./params/plotconfig.html"
};

// log function. exponential function for plot
JS9.Plot.logfunc = function(v) { return v === 0 ? 0 : Math.log(v); };
JS9.Plot.expfunc = function(v) { return v === 0 ? 0 : Math.exp(v); };

// rescale a plot
JS9.Plot.rescale = function (divjq, plot, pobj, axis, scale, smin, smax){
    let opts, curaxis;
    // change the scale
    switch( JS9.globalOpts.plotLibrary ){
    case "flot":
	switch(axis){
	case "x":
	    curaxis = plot.getAxes().xaxis;
	    break;
	case "y":
	    curaxis = plot.getAxes().yaxis;
	    break;
	}
	switch(scale){
	case "linear":
	    curaxis.options.transform = null;
	    curaxis.options.inverseTransform = null;
	    pobj.curscale[axis] = scale;
	    break;
	case "log":
	    curaxis.options.transform = JS9.Plot.logfunc;
	    curaxis.options.inverseTransform = JS9.Plot.expfunc;
	    pobj.curscale[axis] = scale;
	    break;
	}
	if( JS9.isNumber(smin) ){
	    curaxis.options.min = Number.parseFloat(smin);
	} else if( smin == "" ){
	    curaxis.options.min = null;
	}
	if( JS9.isNumber(smax) ){
	    curaxis.options.max = Number.parseFloat(smax);
	} else if( smax == "" ){
	    curaxis.options.max = null;
	}
	plot.setupGrid();
	plot.draw();
	break;
    case "plotly":
	switch(axis){
	case "x":
	    opts = {xaxis: {type: scale, autorange: true}};
	    pobj.curscale[axis] = scale;
	    break;
	case "y":
	    opts = {yaxis: {type: scale, autorange: true}};
	    pobj.curscale[axis] = scale;
	    break;
	}
	Plotly.restyle(divjq.attr("id"), opts);
	break;
    default:
	break;
    }
};

// anotate a plot
JS9.Plot.annotate = function (divjq, plot, pobj){
    let i, ann, ao, aobj, pos, ahtml, yTextOffset;
    const annotations = [];
    const data = pobj.data;
    const ac = pobj.annotations.color || JS9.Plot.opts.annotateColor;
    const getPos = (ann, data) => {
	let i, x, y;
	if( !ann.text ){
	    return null;
	}
	x = ann.x || 0;
	if( ann.y.toUpperCase() === "%Y" ){
	    for(i=1; i<data.length-1; i++){
		if( data[i][0] > x ){
		    y = Math.max(data[i-1][1], data[i][1], data[i+1][1]);
		    break;
		}
	    }
	} else {
	    y = ann.y;
	}
	return {x, y};
    };
    switch( JS9.globalOpts.plotLibrary ){
    case "flot":
	yTextOffset = -25;
	divjq.find(".plotAnnotation").remove();
	for(i=0; i<pobj.annotations.data.length; i++){
	    ann = pobj.annotations.data[i];
	    pos = getPos(ann, data);
	    ao = plot.pointOffset({ x: pos.x, y: pos.y });
	    if( (ao.left < 0) || (ao.left > divjq.width()) ){
		continue;
	    }
	    ahtml = sprintf("<div class='plotAnnotation' style='position: absolute; left: %spx; top:%spx; color: %s; font-size: small'>%s</div>",
			    ao.left, ao.top+yTextOffset,
			    ac, `&darr;${ann.text}`);
	    divjq.append(ahtml);
	}
	break;
    case "plotly":
	yTextOffset = -30;
	for(i=0; i<pobj.annotations.data.length; i++){
	    ann = pobj.annotations.data[i];
	    pos = getPos(ann, data);
	    if( !pos ){
		continue;
	    }
	    aobj = {x: pos.x, y: pos.y, xref: "x", yref: "y",
		    text: ann.text, arrowcolor: ac, font: {color: ac},
		    showarrow: true, arrowhead: 2, ax: 0, ay: yTextOffset};
	    annotations.push(aobj);
	}
	return annotations;
    }
};

// init the plot config form: called with the image context
// eslint-disable-next-line no-unused-vars
JS9.Plot.initConfigForm = function(plot, pobj){
    let val, key, mover, mout, winid, wid, form;
    const fmt= (val) => {
	if( val === undefined ){
	    return undefined;
	}
	if( (typeof val === "number") && (val % 1 !== 0) ){
	    val = Math.round((val + 0.001) * 100) / 100;
	}
	return(String(val));
    };
    // sanity check
    if( !plot || !pobj ){ return; }
    // convenience variables
    winid = plot.winid;
    wid = $(winid).attr("id");
    form = `#${wid} #plotConfigForm `;
    // flot support only for now ...
    if( JS9.globalOpts.plotLibrary !== "flot" ){ return; }
    // fill in the values from the plot
    $(`${form}.val`).each((index, element) => {
	val = "";
	key = $(element).attr("name");
	// key-specific pre-processing
	switch(key){
	case "xscale":
	    if( JS9.notNull(pobj.curscale.x) ){
		val = fmt(pobj.curscale.x);
	    }
	    break;
	case "xmin":
	    if( JS9.notNull(plot.getAxes().xaxis.options.min) ){
		val = fmt(plot.getAxes().xaxis.options.min);
	    }
	    break;
	case "xmax":
	    if( JS9.notNull(plot.getAxes().xaxis.options.max) ){
		val = fmt(plot.getAxes().xaxis.options.max);
	    }
	    break;
	case "yscale":
	    if( JS9.notNull(pobj.curscale.y) ){
		val = fmt(pobj.curscale.y);
	    }
	    break;
	case "ymin":
	    if( JS9.notNull(plot.getAxes().yaxis.options.min) ){
		val = fmt(plot.getAxes().yaxis.options.min);
	    }
	    break;
	case "ymax":
	    if( JS9.notNull(plot.getAxes().yaxis.options.max) ){
		val = fmt(plot.getAxes().yaxis.options.max);
	    }
	    break;
	default:
	    break;
	}
	$(element).val(val);
    });
    // save the image for later processing
    $(form).data("im", this);
    // save the plot object for later processing
    $(form).data("plot", plot);
    // save the plot opts object for later processing
    $(form).data("pobj", pobj);
    // save the window id for later processing
    $(form).data("winid", winid);
    // add tooltip callbacks (not mobile: ios buttons stop working!)
    if( !$(form).data("tooltipInit") ){
	$(form).data("tooltipInit", true);
	if( JS9.BROWSER[3] ){
	    mover = "touchstart";
	    mout = "touchend";
	} else {
	    mover = "mouseover";
	    mout = "mouseout";
	}
	$(".plotcol_P").on(mover, (e) => {
	    let title;
	    const target = e.currentTarget;
	    const tooltip = $(target).find("input").data("tooltip");
	    const el = $(target)
		  .closest(JS9.lightOpts[JS9.LIGHTWIN].top)
		  .find(JS9.lightOpts[JS9.LIGHTWIN].dragBar);
	    if( tooltip && el.length ){
		// change title: see dhtmlwindow.js load() @line 130
		title = `${JS9.Plot.opts.title}: ${tooltip}`;
		$(el)[0].childNodes[0].nodeValue = title;
	    }
	});
	$(".plotcol_P").on(mout, (e) => {
	    const target = e.currentTarget;
	    const el = $(target)
		  .closest(JS9.lightOpts[JS9.LIGHTWIN].top)
		  .find(JS9.lightOpts[JS9.LIGHTWIN].dragBar);
	    if( el.length ){
		$(el)[0].childNodes[0].nodeValue = JS9.Plot.opts.title;
	    }
	});
    }
};

// process the plot config form: called with the image context
// eslint-disable-next-line no-unused-vars
JS9.Plot.processConfigForm = function(form, plot, pobj, arr){
    let i, key, val;
    const alen = arr.length;
    // sanity check
    switch( JS9.globalOpts.plotLibrary ){
    case "flot":
	break;
    case "plotly":
	return;
    }
    // process array of keyword/values
    for(i=0; i<alen; i++){
	key = arr[i].name;
	val = arr[i].value;
	// key-specific processing
	switch(key){
	case "xscale":
	    if( val === "" ){ val = "linear"; }
	    JS9.Plot.rescale(null, plot, pobj, "x", val);
	    break;
	case "xmin":
	    JS9.Plot.rescale(null, plot, pobj, "x", null, val, null);
	    break;
	case "xmax":
	    JS9.Plot.rescale(null, plot, pobj, "x", null, null, val);
	    break;
	case "yscale":
	    if( val === "" ){ val = "linear"; }
	    JS9.Plot.rescale(null, plot, pobj, "y", val);
	    break;
	case "ymin":
	    JS9.Plot.rescale(null, plot, pobj, "y", null, val, null);
	    break;
	case "ymax":
	    JS9.Plot.rescale(null, plot, pobj, "y", null, null, val);
	    break;
	default:
	    break;
	}
    }
    JS9.Plot.initConfigForm.call(this, plot, pobj);
};

// backward compatibility pre-2.6 (and needed for assigning preferences)
JS9.plotOpts = JS9.Plot.opts;

// ---------------------------------------------------------------------
// Catalogs object defines high level calls for catalog plugin
// Mostly replaced by a call to newShapeLayer() and addShapes(),
// leaving on the options
// ---------------------------------------------------------------------

