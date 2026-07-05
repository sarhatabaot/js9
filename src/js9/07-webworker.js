JS9.WebWorker = function(url){
    const finishup = () => {
	this.worker.onmessage = JS9.WebWorker.prototype.msgHandler.bind(this);
	this.handlers = [];
    };
    if( url.match(JS9.URLEXP) ){
	// avoid cross-origin problems if the webworker is being retrieved
	// from somewhere other than the local host
	// this leaks a small bit of memory (no revokeObjectURL call)
	JS9.fetchURL(null, url, null, (blob) => {
	    this.worker = new Worker(URL.createObjectURL(blob));
	    finishup();
	});
    } else {
	// ordinary retrieval of a local file
	this.worker = new Worker(url);
	finishup();
    }
};

// handle (known) messages from web worker
JS9.WebWorker.prototype.msgHandler = function(msg){
    let i, handler;
    const h = JS9.helper;
    const obj = msg.data;
    switch(obj.cmd){
    case "progress":
	JS9.progress(obj.result.value, obj.result.max);
	break;
    case "initsocketio":
	if( obj.result === "OK" ){
	    this.sockinit = true;
	    for(i=0; i<this.handlers.length; i++){
		handler = this.handlers[i];
		if( handler.id === obj.id ){
		    handler.func(obj.result);
		    this.handlers.splice(i, 1);
		    break;
		}
	    }
	}
	break;
    case "uploadFITS":
	for(i=0; i<this.handlers.length; i++){
	    handler = this.handlers[i];
	    if( handler.id === obj.id ){
		handler.func(obj.result);
		this.handlers.splice(i, 1);
		break;
	    }
	}
	break;
    case "connect_error":
    case "connect_timeout":
	delete JS9.worker.uploadActive;
	JS9.progress(false);
	if( JS9.DEBUG > 1 ){
	    JS9.log(`JS9 worker socketio: ${obj.cmd}`);
	}
	break;
    case "disconnect":
	delete JS9.worker.uploadActive;
	JS9.progress(false);
	obj.result = obj.result || "JS9 worker socket was disconnected";
	// need a slight delay here, not sure why
	window.setTimeout(() => {
	    JS9.worker.send("initsocketio", [h.url, h.pageid],
			    () => {
				if( obj.alert ){
				    alert(obj.result);
				} else if(  JS9.DEBUG > 1 ){
				    JS9.log(obj.result);
				}
			    });
	}, JS9.WORKEROUT);
	break;
    case "error":
	delete JS9.worker.uploadActive;
	JS9.progress(false);
	JS9.error(obj.result||"in web worker");
	break;
    default:
	break;
    }
};

// send a message to a web worker
JS9.WebWorker.prototype.send = function(cmd, args, func, xfer){
    const id = cmd + JS9.uniqueID();
    const obj = {id, cmd, args};
    // push context
    if( func ){
	args = args || [];
	this.handlers.push({id, cmd, args, func});
    }
    // send message, possibly with transferred data
    if( xfer ){
	this.worker.postMessage(obj, xfer);
    } else {
	this.worker.postMessage(obj);
    }
};

// initialize worker socketio connection, then call handler
JS9.WebWorker.prototype.socketio = function(handler){
    const h = JS9.helper;
    JS9.worker.send("initsocketio", [h.url, h.pageid], (s) => {
	if( s === "OK" ){
	    if( handler ){ handler(); }
	} else {
	    JS9.error(`can't init socket.io for JS9 worker: ${s}`);
	}
    });
};

// terminate a web worker
JS9.WebWorker.prototype.terminate = function(){
    this.worker.terminate();
};

// ---------------------------------------------------------------------
// Graphics support using fabric.js
//
// Fabric object defines graphical primitives
// ---------------------------------------------------------------------

