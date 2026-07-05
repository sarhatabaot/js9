JS9.Dysel = {};
JS9.Dysel.CLASS = "JS9";
JS9.Dysel.NAME = "Dysel";

JS9.Dysel.display = null;
JS9.Dysel.plugins = [];

// plugin init: no op
// eslint-disable-next-line no-unused-vars
JS9.Dysel.init = function(opts){
    return;
};

// unhighlight current selection
JS9.Dysel.unhighlightSelection = function(){
    if( JS9.bugs.webkit_resize ){
	$(".JS9").find(".JS9Image").removeClass("JS9Highlight");
    } else {
	$(".JS9").removeClass("JS9Highlight");
    }
};

// highlight display when dynamic selection is made
JS9.Dysel.highlightSelection = function(im){
    let disp;
    // sanity check
    if( !im || !JS9.Dysel.retrievePlugins().length ){ return; }
    // optimization: no processing if we only have one display
    if( JS9.displays.length === 1 ){ return; }
    // unhighlight all
    JS9.Dysel.unhighlightSelection();
    // the display to highlight
    disp = im.display;
    // highlight selected
    if( JS9.bugs.webkit_resize ){
	$(disp.divjq).find(".JS9Image").addClass("JS9Highlight");
    } else {
	$(disp.divjq).addClass("JS9Highlight");
    }
};

// add to dynamic selection array
JS9.Dysel.addPlugins = function(plugin){
    JS9.Dysel.plugins.push(plugin);
};

// get dynamic selection array
JS9.Dysel.retrievePlugins = function(){
    return JS9.Dysel.plugins;
};

// return current dynamically selected display
JS9.Dysel.getDisplay = function(which){
    if( !JS9.Dysel.retrievePlugins().length ){
	return null;
    }
    if( which === "previous" ){
	return JS9.Dysel.odisplay;
    }
    return JS9.Dysel.display;
};

// return the display object associated with the current dynamic selection
// or else a default value
JS9.Dysel.getDisplayOr = function(def){
    if( def === "previous" ){
	return JS9.Dysel.getDisplay(def);
    }
    return JS9.Dysel.getDisplay() || def;
};

// set current dynamically selected display
JS9.Dysel.select = function(display){
    // sanity check
    if( !display || !JS9.Dysel.retrievePlugins().length ){ return; }
    // save old display
    JS9.Dysel.odisplay = JS9.Dysel.display;
    // set new display
    JS9.Dysel.display = display;
    if( display.image ){
	JS9.Dysel.highlightSelection(display.image);
	// plugin callbacks for selected display
	display.image.xeqPlugins("image", "ondynamicselect", null);
    }
};

// imageload: select the display
JS9.Dysel.imageload = function(im){
    if( im ){
	JS9.Dysel.select(im.display);
    }
};

// imageclose: select another display, if necessary
JS9.Dysel.imageclose = function(im){
    let i, got, disp;
    if( im ){
	disp = JS9.Dysel.getDisplay();
	if( !disp || disp.image !== im ){
	    return;
	}
	// if this the last image in this display?
	for(i=0, got=0; i<JS9.images.length; i++){
	    if( im.display === JS9.images[i].display ){
		got++;
	    }
	}
	// if so, select another image in another display
	if( got <= 1 ){
	    for(i=0; i<JS9.displays.length; i++){
		disp = JS9.displays[i];
		if( im.display !== disp && disp.image ){
		    JS9.Dysel.select(JS9.displays[i]);
		    return;
		}
	    }
	}
    }
};

// public alias for plugin developers
JS9.getDynamicDisplayOr = JS9.Dysel.getDisplayOr;

// ---------------------------------------------------------------------
// Titlebar: titlebar updates
// ---------------------------------------------------------------------

