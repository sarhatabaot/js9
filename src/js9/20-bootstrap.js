
// INIT: after document is loaded, perform JS9 initialization
$(document).ready(() => {
    // when all is ready, we can preload images
    $(document).on("JS9:ready", () => {
	if( !JS9.readied ){
	    JS9.readied = true;
	    if( JS9.notNull(JS9.prerename) && JS9.prerename.length ){
		JS9.RenameDisplay(...JS9.prerename);
		delete JS9.prerename;
	    }
	    JS9.Preload(true);
	}
    });
    $(document).on("JS9:init", () => {
	if( JS9.helper.ready && JS9.fits.ready ){
	    // ... signal we are completely ready
	    $(document).trigger("JS9:ready", {status: "OK"});
	}
    });
    // ... might need to wait for astroem (via emscripten) to finish ...
    $(document).on("astroem:ready", () => {
	// astroem is loaded: we can now initialize FITS support
	JS9.initFITS();
	// if Node.js is available (i.e., if enabled in the Electron app),
	// try to mount the local file system
	if( window.electron && JS9.hostFS ){
	    try{
		// mount local file system or clear mount point
		if( !JS9.vmount("/", JS9.hostFS) ){
		    delete JS9.hostFS;
		}
	    }
	    catch(e){
		// no mount point for local file system
		delete JS9.hostFS;
	    }
	}
	if( JS9.helper.ready && JS9.inited ){
	    // ... signal we are completely ready
	    $(document).trigger("JS9:ready", {status: "OK"});
	}
    });
    // wait for helper
    $(document).on("JS9:helperReady", () => {
	if( JS9.fits.ready && JS9.inited && !JS9.readied ){
	    // ... signal we are completely ready (but only once)
	    $(document).trigger("JS9:ready", {status: "OK"});
	}
    });
    // init JS9 (unless explicitly specified not to)
    if( $('div[data-js9init="false"]').length === 0 ){
	JS9.init();
    }
});
