JS9.Helper = function(){
    // reset protocol for file:
    if( JS9.globalOpts.helperProtocol === "file:" ){
	JS9.globalOpts.helperProtocol = "http:";
    }
    // reset helper timeout for local access
    if( !document.domain || document.domain === "localhost" ){
	JS9.globalOpts.htimeout = JS9.globalOpts.lhtimeout;
    }
    // add suffix, if necessary
    if( !JS9.globalOpts.helperProtocol.match(/\/\/$/) ){
	JS9.globalOpts.helperProtocol += "//";
    }
    // assume the worst
    this.connected = false;
    this.helper = false;
    // set up initial type of helper connection
    if( JS9.allinone && !JS9.globalOpts.allinoneHelper ){
	this.type = "none";
    } else {
	this.type = JS9.globalOpts.helperType || "sock.io";
    }
    // no page id yet
    this.pageid = null;
    // make the connection
    this.connect();
};

// get back-end helper connection info
JS9.Helper.prototype.connectinfo = function(){
    let s;
    // no connection configured
    if( JS9.helper.connected === null ){
	return "notConfigured";
    }
    // connection configured and established
    if( JS9.helper.connected ){
	s = `connected ${JS9.helper.type} ${JS9.helper.url}`;
	if( JS9.helper.pageid ){
	    s += `<p>${JS9.helper.pageid}`;
	}
	return s;
    }
    // connection configured but not established
    return `notConnected ${JS9.helper.type}`;
};

// connect to back-end helper
JS9.Helper.prototype.connect = function(type){
    let sockbase, sockfile;
    const tries = JS9.globalOpts.ehretries;
    const delay = JS9.globalOpts.ehtimeout;
    const failedHelper = (textStatus, errorThrown) => {
	this.connected = false;
	this.helper = false;
	this.ready = true;
	$(document).trigger("JS9:helperReady",
			    {type: "socket.io", status: "error"});
	textStatus = textStatus || "timeout";
	if( !errorThrown || errorThrown === "timeout" ){
	    errorThrown = "or connection refused";
	}
	if( errorThrown === textStatus  ){
	    textStatus = "";
	}
	if( errorThrown === "error" ){
	    errorThrown = "is the helper running?";
	}
	// throw error if needed
	if( JS9.globalOpts.requireHelper ){
	    JS9.error(`helper connect error: ${textStatus} (${errorThrown})`);
	} else if( JS9.DEBUG ){
	    JS9.log(`JS9 helper connect error: ${textStatus} (${errorThrown})`);
	}
    };
    const connectHelper = (url) => {
	// connect to helper
	$.ajax({
	    url: url,
	    dataType: "script",
	    timeout: JS9.globalOpts.htimeout,
	    cache: true,
	    success: () => {
		// if there is no io object, we didn't really succeed
		// can happen, for example, in the Jupyter environment
		if( typeof io === "undefined" ){
		    failedHelper("socket io object is undefined", null);
		    return;
		}
		// connect to the helper
		this.socket = io.connect(this.url, JS9.socketioOpts);
		// on-event processing
		this.socket.on("connect", () => {
		    let ii, d, p;
		    this.connected = true;
		    this.helper = true;
		    d = [];
		    for(ii=0; ii<JS9.displays.length; ii++){
			d.push(JS9.displays[ii].id);
		    }
		    p = this.pageid;
		    this.socket.emit("initialize", {displays: d, pageid: p},
                    (obj) => {
			this.pageid = obj.pageid;
			this.js9helper = obj.js9helper;
			JS9.globalOpts.dataPathModify = obj.dataPathModify;
			this.ready = true;
			$(document).trigger("JS9:helperReady",
					    {type: "socket.io", status: "OK"});
			if( JS9.DEBUG ){
			    JS9.log(`JS9 helper: connect: ${this.type}`);
			}
		    });
		    $(document).trigger("JS9:connected",
					{type: "socket.io", status: "OK"});
		});
		this.socket.on("connect_error", () => {
		    this.connected = false;
		    this.helper = false;
		    if( JS9.DEBUG > 1 ){
			JS9.log("JS9 helper: connect error");
		    }
		});
		this.socket.on("connect_timeout", () => {
		    this.connected = false;
		    this.helper = false;
		    if( JS9.DEBUG > 1 ){
			JS9.log("JS9 helper: connect timeout");
		    }
		});
		this.socket.on("disconnect", (reason) => {
		    this.connected = false;
		    this.helper = false;
		    if( JS9.DEBUG > 1 ){
			JS9.log(`JS9 helper: disconnect: ${reason}`);
		    }
		    // https://github.com/socketio/socket.io-client/blob/master/docs/API.md#event-disconnect
		    if( reason === "io server disconnect" ){
			// the disconnection was initiated by the server,
			// you need to reconnect manually
			if( JS9.DEBUG > 1 ){
			    JS9.log("JS9 helper: manual reconnect");
			}
			this.socket.connect();
		    }
		    // else the socket will automatically try to reconnect
		});
		this.socket.on("reconnect", () => {
		    this.connected = true;
		    this.helper = true;
		    if( JS9.DEBUG > 1 ){
			JS9.log("JS9 helper: reconnect");
		    }
		});
		this.socket.on("msg", JS9.msgHandler);
	    },
	    error: (jqXHR, textStatus, errorThrown) => {
		failedHelper(textStatus, errorThrown);
	    }
	});
    };
    // make an "alive" request of the helper (jsonp to avoid CORS rejection)
    const waitForHelper = (eurl, hurl, tries) => {
	$.ajax({
	    url: eurl,
	    dataType: "jsonp",
	    success: () => {
		connectHelper(hurl);
	    },
	    error: () => {
		if( --tries > 0 ){
		    window.setTimeout(() => {
			waitForHelper(eurl, hurl, tries);
		    }, delay);
		} else {
		    failedHelper();
		}
	    }
	});
    };
    // might be establishing a new type
    if( type ){
	this.type = type;
    }
    // close off previous socket connection, if necessary
    if( this.socket ){
	try{this.socket.disconnect();}
	catch(e){JS9.log("warning: can't disconnect from socket");}
	this.socket = null;
    }
    // base of helper url is either specified, same as current domain, or local
    if( JS9.globalOpts.helperURL ){
	if( JS9.globalOpts.helperURL.search(/:\/\//) >=0 ){
	    this.url = JS9.globalOpts.helperURL;
	} else {
	    this.url = JS9.globalOpts.helperProtocol + JS9.globalOpts.helperURL;
	}
    } else if( document.domain ){
	if( location.origin ){
	    this.url = location.origin;
	} else {
	    this.url = JS9.globalOpts.helperProtocol + document.domain;
	}
    } else {
	this.url = `${JS9.globalOpts.helperProtocol}localhost`;
    }
    // save base of url
    this.baseurl = this.url;
    // try to establish connection, based on connection type
    switch(this.type){
    case "none":
        this.connected = null;
	this.ready = true;
        // signal JS9 helper is ready
        $(document).trigger("JS9:helperReady", {type: "none", status: "OK"});
        break;
    case "get":
    case "post":
	// sanity check
	if( !JS9.globalOpts.helperCGI ){
	    JS9.error("cgi script name missing for helper");
	}
	this.url += `/${JS9.globalOpts.helperCGI}`;
	this.connected = true;
	this.helper = true;
        if( JS9.DEBUG ){
	    JS9.log(`JS9 helper: connect: ${this.type}`);
        }
	this.ready = true;
        $(document).trigger("JS9:helperReady", {type: "get", status: "OK"});
	break;
    case "sock.io":
    case "nodejs":
	if( !JS9.globalOpts.helperPort ){
	    JS9.error("port missing for helper");
	}
	// ignore port on url, add our own
	this.url = `${this.url.replace(/:[0-9][0-9]*$/, "")}:${JS9.globalOpts.helperPort}`;
	// which version of socket.io?
	sockbase = "socket.io";
	// use min version for production, as per migration docs
	if( JS9.DEBUG <= 2 ){
	    sockfile  = "socket.io.min.js";
	} else {
	    sockfile  = "socket.io.js";
	}
	// full url of the socket.io.js file
	this.sockurl  = `${this.url}/${sockbase}/${sockfile}`;
	// make sure helper is running and then connect
	if( window.electron ){
	    this.aliveurl = `${this.url}/alive`;
	    waitForHelper(this.aliveurl, this.sockurl, tries);
	} else {
	    connectHelper(this.sockurl);
	}
	break;
    default:
	JS9.error(`unknown helper type: ${this.type}`);
	break;
    }
};

// send request to back-end helper
JS9.Helper.prototype.send = function(key, obj, cb){
    // sanity check
    if( !this.connected ){ return null; }
    // add cookie value
    // add dataPath, if available (but always look in the helper directory)
    if( obj && (typeof obj === "object") ){
	// wrap this in a try to catch CORS errors
        try{ obj.cookie = document.cookie; }
	catch(e){ delete obj.cookie; }
	if( JS9.globalOpts.dataPath && !obj.dataPath ){
	    obj.dataPath = `${JS9.globalOpts.dataPath}:.`;
	}
    } else {
	obj = {dataPath: "."};
    }
    // add path which gets us to the js9 root
    if( JS9.TOROOT ){
	obj.dataPath += `:${JS9.TOROOT}`;
    }
    // tell server how to get to root (for datapath)
    // send message, based on connection type
    switch(this.type){
    case "get":
    case "post":
	obj.key = key;
	if( JS9.helper.pageid ){
	    obj.pageid = JS9.helper.pageid;
	}
        if( JS9.DEBUG ){
	    JS9.log("JS9 cgi helper [%s, %s]: %s",
		    this.type, JSON.stringify(obj), this.url);
        }
	$.ajax({
	    url: this.url,
	    type: this.type.toUpperCase(),
	    data: obj,
	    dataType: "text",
	    success: (data) => {
		if( typeof data === "string" &&
		    data.search(JS9.analOpts.epattern) >=0 ){
		    JS9.log(data);
		}
		if( cb ){
		    cb(data);
		}
	    },
	    error: (jqXHR, textStatus, errorThrown) => {
		if( JS9.DEBUG ){
	            JS9.log(`JS9 helper: ${this.type} failure: ${textStatus} ${errorThrown}`);
		}
	    }
	});
	break;
    case "sock.io":
    case "nodejs":
	JS9.helper.socket.emit(key, obj, cb);
	break;
    }
    // allow chaining
    return this;
};

// ---------------------------------------------------------------------
// JS9 web worker support to off-load CPU intensive tasks
// ---------------------------------------------------------------------

// create new web worker
