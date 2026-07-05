JS9.Colormap = function(...args){
    let [name, a1, a2, a3] = args;
    let i, got;
    // sanity check
    if( !name ){ return; }
    // type of colormap is based on number and type of args
    this.name = name;
    switch(args.length){
    case 2:
	if( $.isArray(a1[0]) && typeof a1[0][0] === "number" ){
	    // array of rgb values
	    // JS9.Colormap("sls", [[0, 0, 0], [0.043442, 0, 0.052883], ...]);
	    this.type = "lut";
	    this.colors = a1;
	} else {
	    // array of static colors and min, max values
	    // JS9.Colormap("s1", [["red",1,1], ["cyan",2,3], ["blue",4,99]]);
	    this.type = "static";
	    this.colors = JS9.parseStaticColors(a1);
	}
	break;
    case 4:
	// three arrays of vertices
	// JS9.Colormap("grey", [[0,0],[1,1]], [[0,0],[1,1]], [[0,0],[1,1]]));
	this.type = "sao";
	this.vertices = [a1, a2, a3];
	break;
    default:
	JS9.error("colormap requires a colormap name and 1 or 3 array args");
	break;
    }
    // flag whether this was a core or user-defined colormap
    if( !JS9.inited ){
	this.source = "core";
    } else {
	this.source = "user";
    }
    // replace or append
    for(i=0; i<JS9.colormaps.length; i++){
	if( JS9.colormaps[i].name === this.name ){
	    JS9.colormaps[i] = this;
	    got = true;
	    break;
	}
    }
    if( !got ){
	JS9.colormaps.push(this);
    }
    // debugging
    if( JS9.DEBUG > 1 ){
	JS9.log("JS9 colormap:  %s", this.name);
    }
};

JS9.Colormap.prototype.mkColorCell = function(ii){
    let m, x, i, j, val, vertex, len, size, index;
    const count = JS9.COLORSIZE;
    const umax = 255;
    const rgb = [0, 0, 0];
    switch(this.type){
    // from: tksao1.0/colormap/sao.C
    case "sao":
	x = ii / count;
	// for each of red, green, blue ...
	for(j=0; j<3; j++){
	    // look for the first vertex with x value larger than our x value
	    vertex = this.vertices[j];
	    len = vertex.length;
	    for(i=0; i<len; i++){
		if( vertex[i][0] > x ){
		    break;
		}
	    }
	    // if first vertex x value is greater than ours, use it
	    if( i === 0 ){
		val = vertex[0][1];
	    // if last vertex xvalue is less than ours, use it
	    } else if( i === len ){
		val = vertex[len-1][1];
	    // interpolate between two vertices
	    } else {
		m = (vertex[i][1] - vertex[i-1][1]) /
		    (vertex[i][0] - vertex[i-1][0]);
		if( m ){
		    // point slope form
		    val = m * (x - vertex[i-1][0]) + vertex[i-1][1];
		} else {
		    val = vertex[i][1];
		}
	    }
	    // assign value to the correct color in the result array
	    rgb[j] = val * umax;
	}
	break;
    // from: tksao1.0/colormap/lut.C
    case "lut":
	size = this.colors.length;
	// index into the evenly spaced RGB values
	index = Math.floor(ii*size/count);
	if( index < 0 ){
	    rgb[0] = this.colors[0][0] * umax;
	    rgb[1] = this.colors[0][1] * umax;
	    rgb[2] = this.colors[0][2] * umax;
	} else if( index < size ){
	    rgb[0] = this.colors[index][0] * umax;
	    rgb[1] = this.colors[index][1] * umax;
	    rgb[2] = this.colors[index][2] * umax;
	} else {
	    rgb[0] = this.colors[size-1][0] * umax;
	    rgb[1] = this.colors[size-1][1] * umax;
	    rgb[2] = this.colors[size-1][2] * umax;
	}
	break;
    case "static":
	break;
    default:
	JS9.error("unknown colormap type");
	break;
    }
    // return the news
    return rgb;
};

// ---------------------------------------------------------------------
// JS9 display object for the screen display
// ---------------------------------------------------------------------

