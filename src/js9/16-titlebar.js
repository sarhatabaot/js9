JS9.Titlebar = {};
JS9.Titlebar.CLASS = "JS9";
JS9.Titlebar.NAME = "Titlebar";

// plugin init: save initial title
// eslint-disable-next-line no-unused-vars
JS9.Titlebar.init = function(opts){
    if( !JS9.Titlebar.title ){
	JS9.Titlebar.title = document.title;
    }
};

// change titlebar when image is loaded
JS9.Titlebar.imageload = function(im){
    if( im && JS9.globalOpts.updateTitlebar ){
	if( window.electron ){
	    JS9.Titlebar.imid = im.fitsFile || im.file || im.id;
	} else {
	    JS9.Titlebar.imid = im.id;
	}
	document.title = `${JS9.Titlebar.title}: ${JS9.Titlebar.imid}`;
    }
};

// change titlebar when image is displayed
JS9.Titlebar.imagedisplay = function(im){
    if( im && im.id !== JS9.Titlebar.imid && JS9.globalOpts.updateTitlebar ){
	if( window.electron ){
	    JS9.Titlebar.imid = im.fitsFile || im.file || im.id;
	} else {
	    JS9.Titlebar.imid = im.id;
	}
	document.title = `${JS9.Titlebar.title}: ${JS9.Titlebar.imid}`;
    }
};

// change titlebar when image is closed
JS9.Titlebar.imageclose = function(){
    if( JS9.globalOpts.updateTitlebar ){
	document.title = JS9.Titlebar.title;
    }
};

