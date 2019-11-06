var pi = Math.PI,
    tau = 2 * Math.PI;

const IMAGE_MAP_DATA = 0
const VECTOR_MAP_DATA = 1
const MAP_TILE_DATA = 2

const SVG_ELEMENT_TYPES = ['point', 'line', 'path', 'polyline', 'polygon', 'circle', 'ellipse', 'rect'];

/**
 * For now we keep the session data in an encapsulated module object.
 * The session ID never changes unless we reload but the project type may change
 * upon selecting a new project type. In which case we should be able to set a new
 * project type.
 */
var sessionData = (function(){
    var sessID = (new URL(document.location)).searchParams.get("sessID");
    var projectType;

    return {
        sessID: sessID,
        projectType: projectType,
        setProjectType: function(projectType){
            this.projectType = projectType
        }
    }
})();


/**
 * create a new communicator object with parameters for the ajax request.
 * Return a sendRequest method which expects a params object from which to
 * get its callback function's parameters and the callback function. The
 * function also displays and hides the processing indicator.
 */
var communicator = function(ajaxParams) {

    return (function(){
        return {
            sendRequest: function(callbackParams, callback) {
                createProcessingRing();
                if (ajaxParams.data){
                    ajaxParams.data.sessID = sessionData.sessID
                    ajaxParams.data.projectType = sessionData.projectType
                }else{
                    ajaxParams.data = {
                        sessID: sessionData.sessID,
                        projectType: sessionData.projectType
                    }
                }
                $.ajax({
                    ...ajaxParams,
                    success: function (resp) {
                        callback.call(callbackParams, resp);
                        deleteProcessingRing();
                    }
                });
            }
        }
    })();
}

/**
 * open first file in specified in event and add the file name to the given params object.
 * then invoke the supplied callback function, onloadCallback, with javascript's call()
 * passing params as the 'this' object for the callback's context and the file contents as
 * the ordinary parameter.
 */
var openReadFromFile = function(inputElement, onloadCallback, params, readFormat) {
    var inFile = inputElement.files[0];
    var reader = new FileReader();
    Object.assign(params, {fileName: inFile.name});
    if (readFormat == "text")
        reader.readAsText(inFile);
    else if (readFormat == "buffered")
        reader.readAsArrayBuffer(inFile);
    else
        reader.readAsDataURL(inFile);

    reader.onload = function(e) {
        onloadCallback.call(params, e.target.result);
    }
}

var sketchMapDisplayManager = (function(){
    var sketchLoaded;
    var sketchCanvas;


    var init = function() {
        sketchLoaded = false;
        sketchCanvas = d3.select('#sketchmapplaceholder')
                                .append("svg")
                                .attr("id", "sketchSVG")
                                .attr("width", 0)
                                .attr("height", 0);
        sketchCanvas.append("g").attr("id", "raster");
        sketchCanvas.append("g").attr("id", "vector");
    }


    var getRasterSelection = function() {
        return sketchCanvas.select("#raster");
    }


    var getVectorSelection = function() {
        return sketchCanvas.select("#vector");
    }


    var getVectorAsSVG = function() {
        return sketchCanvas.select("#vector");
    }

    /**
    * loads the image into the base svg given the image file content
    */
    var loadSketchMapRasterFromContent = function(file, width, height) {
        loadSketchMapRasterFromURL(file, width, height);
    }


    /**
    * loads the image into the base svg given the image url
    */
    var loadSketchMapRasterFromURL = function(url, width, height) {
        if (sketchLoaded) {
            // only one image loaded at a time and delete all loaded vectors since these may now be obsolete
            sketchCanvas.select("#raster").selectAll().remove();
            sketchCanvas.select("#vector").selectAll().remove();
        }

        sketchCanvas
            .attr("width", width)
            .attr("height", height);

        var img = sketchCanvas.select("#raster").selectAll("image").data([0]);
            img.enter()
                .append("svg:image")
                .attr("xlink:href", url)
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', width)
                .attr('height', height);

        sketchLoaded = true;
    }


    var appendVectorElement = function(element) {
        if (element instanceof SVGGeometryElement){
            sketchCanvas.select("#vector").append(() => element);
        } else if (element.node) {
            if (element.node() instanceof SVGGeometryElement) {
                sketchCanvas.select("#vector").append(() => element.node());
            }
        }
    }


    var appendVectorElements = function(selection) {
        selection.each(() => appendVectorElement(this));
    }


    /**
    * Loads the contents of an svg file into the base svg given the input svg's url.
    * Elements are first extracted from the svg and all transforms collapsed to leaf
    * geometric elements. No non-geometry elements must be used in the svg - e.g. to do
    * styling, cross-referencing or external-referencing. No <defs> either.
    *
    * Note that this may be passed-on as a callback and in that case will have no direct
    * access to the properties of this class so we should import them as if importing them
    * in an external module (explicitly qualifying the import with sketchMapDisplayManager)
    */
    var loadSketchMapVector = function(svgDoc) {
        //let sketchCanvas = sketchMapDisplayManager.sketchCanvas;
        let svgNode = d3.select(svgDoc).select("svg");
        let width = svgNode.attr('width');
        let height = svgNode.attr('height');

        var scaleTransform = svgNode.node().createSVGTransform()
        /**
        * if width and height are specified check if we need to scale. If aspect ratios are different do nothing.
        * In that case scale by identity transform. Otherwise scale by appropriate factor.
        */
        if (width && height) {
            scale_difference = width/sketchCanvas.attr('width') - height/sketchCanvas.attr('height')
            if (-0.01 < scale_difference && scale_difference < 0.01) {
                scaleTransform.setScale(sketchCanvas.attr('width')/width, sketchCanvas.attr('height')/height);
            }
        }

        svgNode.selectAll("*").each(function (d, i) {
            /**
            * if it's not a 'g' node then consolidate and append
            */
            // if (SVG_ELEMENT_TYPES.includes(this.tagName.toLowerCase)) {
            if (this instanceof SVGGeometryElement){
                let svgDOM = this.ownerSVGElement;
                let clone = this.cloneNode(false);
                if (this.getScreenCTM()){
                    let consolidatedTransformMatrix = svgDOM.getScreenCTM().inverse().multiply(this.getScreenCTM());
                    let newTransform = clone.transform.baseVal.createSVGTransformFromMatrix(consolidatedTransformMatrix);
                    clone.transform.baseVal.initialize(newTransform);
                } else {
                    clone.transform.baseVal.appendItem(svgDOM.createSVGTransform());
                }
                clone.transform.baseVal.appendItem(scaleTransform);
                sketchCanvas.select("#vector").append(() => clone);
            }
        });
    }

     var loadSketchMapVectorFromURL = function(url) {
        d3.svg(url).then(loadSketchMapVector);
     }

    var loadSketchMapVectorFromContent = function(svgString) {
        svgDoc = (new DOMParser).parseFromString(svgString, "image/svg+xml");
        loadSketchMapVector(svgDoc);
    }

    init();

    return {
        init: init,
        rasterFromURL: loadSketchMapRasterFromURL,
        rasterFromContent: loadSketchMapRasterFromContent, //PENDING
        vectorFromSVGURL: loadSketchMapVectorFromURL,
        vectorFromSVGContent: loadSketchMapVectorFromContent,
        addVector: appendVectorElement, //PENDING
        addVectors: appendVectorElements, //PENDING
        getRaster: getRasterSelection,
        getVectors: getVectorSelection,
        getVectorSVG: getVectorAsSVG //PENDING
    }

})();

//sketchMapDisplayManager.init();


var baseMapDisplayManager = (function(refFormat){
    var tileURL;
    var tilesLoaded;
    var baseLayerLoaded;
    var baseCanvas;
    var zoomCallback;
    var layers = {};
    var tileLayer = {};
    var method = {
        tileZoom : {
            tms : tileZoomTMS,
            openstreetmap : tileZoomOSM
        },
        vectorZoom : {
            tms : vectorZoomTMS,
            openstreetmap : vectorZoomOSM
        },
        tileLoad : {
            tms : tileLoadTMS,
            openstreetmap : tileLoadOSM
        },
        vectorLoad : {
            tms : vectorLoadTMS,
            openstreetmap : vectorLoadOSM
        },
    };
//        tileLayer.getProjection = function(){};

    var init = function(refFormat) {
        tilesLoaded = false;
        baseLayerLoaded = false;
        // create svg
        baseCanvas = d3.select('#metricmapplaceholder')
                                .append("svg")
                                .attr("id", "baseSVG")
                                .attr("width", 800)
                                .attr("height", 565.686); //width to height ratio corresponding to A-series paper sizes

        // setup tile layer
        tileLayer.selection = baseCanvas.append("g").attr("id", "raster");

        let initial_zoom = d3.zoomIdentity;
        tileLayer.width = baseCanvas.attr("width");
        tileLayer.height = baseCanvas.attr("height");
        tileLayer.tiler = d3.tile().size([tileLayer.width, tileLayer.height]);
        tileLayer.zoom = d3.zoom();
        tileLayer.zoomTransform = initial_zoom;
        tileLayer.refFormat = refFormat.toLowerCase();
        tileLayer.initialOffset = 0;
        tileLayer.zoomLevel = 0;
        tileLayer.tileZoom = tileZoom;
        tileLayer.vectorZoom = method[refFormat].vectorZoom;
        tileLayer.tileLoad = method[refFormat].tileLoad;
        tileLayer.vectorLoad = method[refFormat].vectorLoad;

        baseCanvas.append("g").attr("id", "vector");
        layer("baseLayer");
    }

    /**
    * tile loading, zooming, and retrieval functionality
    */
    var tileLoadTMS = async function(url) {
        let t = tileLayer;

        t.url = url.slice(-1) == "/"? url : url + "/";

        let tParams = await d3.xml(url + "tilemapresource.xml");
            tParams = d3.select(tileParameters).select("TileMap");

        let bbox = tParams.select("BoundingBox");
        let origin = tParams.select("Origin");
            origin = [origin.attr("x"), origin.attr("y")];

        let miny = bbox.attr("miny");
        let minx = bbox.attr("minx");
        let maxx = bbox.attr("maxx");
        let maxy = bbox.attr("maxy");

        let top = [];
        let bot = [];

        top[0] = origin[0] == minx? minx: maxx;
        bot[0] = origin[0] == minx? maxx: minx;
        top[1] = origin[1] == miny? maxy: miny;
        bot[1] = origin[1] == miny? miny: maxy;

        let highestScale = 0;
        let highestScaleTileSet = tParams.select("TileSets").selectAll("TileSet")
                                                            .filter((d, i, g) =>
                                                                {
                                                                    if (g[i].getAttribute("order") > highestScale) {
                                                                        highestScale = g[i].getAttribute("order");
                                                                        return true;
                                                                    } else {
                                                                        return false;
                                                                    }});

        let lowestTileRatio = highestScaleTileSet.attr("units-per-pixel");
        let lowestTileRatioTileSet = tParams.select("TileSets").selectAll("TileSet")
                                                        .filter((d, i, g) =>
                                                                {
                                                                    if (g[i].getAttribute("units-per-pixel") > lowestTileRatio) {
                                                                        lowestTileRatio = g[i].getAttribute("units-per-pixel");
                                                                        return true;
                                                                    } else {
                                                                        return false;
                                                                    }});

        t.xExtent = bot[0] - top[0];
        t.yExtent = bot[1] - top[1];

        t.lowestTileSize = Math.floor(t.xExtent/lowestTileRatio);
        t.initialOffset = 256 - t.lowestTileSize;

        /**
         * scale to fit and translate to top-left corner in initial render tile.
         */
        let scale_x = t.lowestTileSize / t.xExtent;
        t.initialXTranslate = -scale_x * top[0]
        t.initialScale = scale_x;
        let scale_y = t.lowestTileSize / t.yExtent;
        t.initialYTranslate = -scale_y * top[1] + t.initialOffset;

        t.getProjection = () => {
            return d3.geoIdentity()
                .reflectY(t.yExtent < 0)
                .reflectX(t.xExtent < 0)
                .scale(t.initialScale)
                .translate([t.initialXTranslate, t.initialYTranslate]);
        }

        t.zoomTransform.translate(t.width / 2, t.height / 2)
                       .scale(t.lowestTileSize + t.initialOffset);

        t.zoom = d3.zoom()
                            .scaleExtent([1 << 8, 1 << Math.round(2 * highestScale)])
                            .on("zoom", zoomCallback);


        baseCanvas.call(t.zoom)
                  .call(t.zoom.transform, t.zoomTransform);

        tilesLoaded = true;

        return new Promise((resolve, reject) => { if (tilesLoaded) {resolve(tilesLoaded)} else {reject(tilesLoaded)}});
    }

    var tileLoadOSM = async function(url) {
        let t = tileLayer;

        t.url = url.slice(-1) == "/"? url : url + "/";

        t.zoomTransform.translate(t.width / 2, t.height / 2);

        t.getProjection = () => {
            return d3.geoMercator()
                        .scale(1 / tau)
                        .translate([0, 0]);;
        }

        t.zoom = d3.zoom()
            .scaleExtent([1 << 8, 1 << 30])
            .on("zoom", zoomCallback);

        baseCanvas.call(t.zoom)
                  .call(t.zoom.transform, t.zoomTransform);

        tilesLoaded = true;

        return new Promise((resolve, reject) => { if (tilesLoaded) {resolve(tilesLoaded)} else {reject(tilesLoaded)}});
    }

    var loadTiles = async function(url, sourceFormat) {


        tileLayer.url = url.slice(-1) == "/"? url : url + "/";
        tileLayer.tiles = d3.tile().size([baseCanvas.attr("width"), baseCanvas.attr("height")]);

        tileLayer.zoom = tileZoom;
        tileLayer.sourceFormat = sourceFormat.toLowerCase();
        tileLayer.initialOffset = 0;
        tileLayer.zoomLevel = 0;

        if  (sourceFormat == "tms") {
            let tParams = await d3.xml(url + "tilemapresource.xml");
                tParams = d3.select(tParams).select("TileMap");

            let bbox = tParams.select("BoundingBox");
            let top = [bbox.attr("minx"), bbox.attr("maxy")];
            let bot = [bbox.attr("maxx"), bbox.attr("miny")];

            let lowestTileRatio = tParams.select("TileSets").selectAll("TileSet")
                                                                     .filter((d, i, g) => g[i].getAttribute("order") == 0);
                lowestTileRatio = lowestTileRatio.attr("units-per-pixel");
            let highestScale = 0;
            let highestScaleTileSet = tParams.select("TileSets").selectAll("TileSet")
                                                                .filter((d, i, g) =>
                                                                    {
                                                                        if (g[i].getAttribute("order") > highestScale) {
                                                                            highestScale = g[i].getAttribute("order");
                                                                            return true;
                                                                        } else {
                                                                            return false;
                                                                        }});

            tileLayer.xExtent = bot[0] - top[0];
            tileLayer.yExtent = bot[1] - top[1];

            tileLayer.lowestTileSize = Math.floor(tileLayer.xExtent/lowestTileRatio);
            tileLayer.initialOffset = 256 - tileLayer.lowestTileSize;

            /**
             * scale to fit and translate to top-left corner in initial render tile.
             */
            let scale_x = tileLayer.lowestTileSize / tileLayer.xExtent;
            tileLayer.initialXTranslate = -scale_x * top[0]
            tileLayer.initialScale = scale_x;
            let scale_y = tileLayer.lowestTileSize / tileLayer.yExtent;
            tileLayer.initialYTranslate = -scale_y * top[1] + tileLayer.initialOffset;

            initial_zoom = initial_zoom.translate(width / 2, height / 2)
                                       .scale(tileLayer.lowestTileSize + tileLayer.initialOffset);

            tileLayer.getProjection = () => {
                return d3.geoIdentity()
                    .reflectY(tileLayer.yExtent < 0)
                    .reflectX(tileLayer.xExtent < 0)
                    .scale(tileLayer.initialScale)
                    .translate([tileLayer.initialXTranslate, tileLayer.initialYTranslate]);
            }

            tileLayer.zoom = d3.zoom()
                                .scaleExtent([1 << 8, 1 << Math.round(2 * highestScale)])
                                .on("zoom", zoomCallback);
        } else {

            initial_zoom = initial_zoom.translate(width / 2, height / 2)
                                       ;//.scale(1 << 20);

            tileLayer.getProjection = () => {
                return d3.geoMercator()
                            .scale(1 / tau)
                            .translate([0, 0]);;
            }

            tileLayer.zoom = d3.zoom()
                .scaleExtent([1 << 8, 1 << 30])
                .on("zoom", zoomCallback);
        }

        baseCanvas.call(tileLayer.zoom)
                  .call(tileLayer.zoom.transform, initial_zoom);

        tilesLoaded = true;

        return new Promise((resolve, reject) => { if (tilesLoaded) {resolve(tilesLoaded)} else {reject(tilesLoaded)}});
    }


    var tileZoom = function(transform) {
        let t = tileLayer;
        let url = t.url;
        let tiles = t.tiler
                                .scale(transform.k)
                                .translate([transform.x, transform.y])();

        t.zoomLevel = tiles.level;

        let image = t.selection
                        .attr("transform", stringify(tileGenerator.scale, tileGenerator.translate))
                        .selectAll("image")
                        .data(tileGenerator, function (d) {
                            return d;
                        });

        image.exit().remove();

        image.enter().append("image")
            .attr("xlink:href", function (d) {
                return formatTileURL(d);
            })
            .attr("x", function (d) {
                return d[0] * 256;
            })
            .attr("y", function (d) {
                return d[1] * 256;
            })
            .attr("width", 256)
            .attr("height", 256);

            Object.keys(layers).forEach((layer) => {t.vectorZoom.call(layers[layer], tileGenerator, transform)});
    }

    var formatTileURL = function(d){
         if (t.sourceFormat.toLowerCase() == "openstreetmap") {
            return "http://" + "abc"[d[1] % 3] + "." + url + d[2] + "/" + d[0] + "/" + d[1] + ".png";
        } else if (t.sourceFormat.toLowerCase() == "tms") {
            var y = Math.pow(2, d[2]) - d[1] - 1; //needs to be converted from TMS tiles to XYZ tiles
            return url + d[2] + "/" + d[0] + "/" + y + ".png";
        } else {
            return "http://" + "abc"[d[1] % 3] + "." + url + d[2] + "/" + d[0] + "/" + d[1] + ".png";
        }
    }

    var loadVectorsTMS = function(layerName, geojson){

    }

    var loadVectorsOSM = function(layerName, geojson){

    }

    var loadVectors = function(layerName, geojson){
        let geoLayer = layer(layerName);
        let width = baseCanvas.attr("width");
        let height = baseCanvas.attr("height");
        let translate_x = 0;
        let translate_y = 0;
        let center_x = 0;
        let center_y = 0;
        let bounds_scale = 1;

        if (!geoLayer.projection) {
            geoLayer.projection = tileLayer.getProjection();
            geoLayer.path = d3.geoPath().projection(geoLayer.projection);
            geoLayer.path.pointRadius(0.5);
            geoLayer.loading = true;
        }

        if (tileLayer.sourceFormat == "tms") {
            let bounds = d3.geoPath().bounds(geojson);
            let scaled_bounds = geoLayer.path.bounds(geojson);

            let map_width = scaled_bounds[1][0] - scaled_bounds[0][0];
            let map_height = scaled_bounds[1][1] - scaled_bounds[0][1];
            let map_center = [scaled_bounds[0][0] + map_width / 2, scaled_bounds[0][1] + map_height / 2
                                                                                            + tileLayer.initialOffset];
            bounds_scale = Math.min( width / map_width, height / map_height);
            translate_x = (128 - map_center[0]) / 256; //map_center[0]; //width/2 -
            translate_y = (128 - map_center[1] + tileLayer.initialOffset) / 256; //map_center[1]; //height/2 -
        } else {
            let scaled_bounds = geoLayer.path.bounds(geojson);

            let map_width = scaled_bounds[1][0] - scaled_bounds[0][0];
            let map_height = scaled_bounds[1][1] - scaled_bounds[0][1];
            let map_center = [scaled_bounds[0][0] + map_width / 2, scaled_bounds[0][1] + map_height / 2
                                                                                            + tileLayer.initialOffset];
            bounds_scale = Math.min( width / map_width, height / map_height);
            let center = geoLayer.path .centroid(geojson);
            center_x = center[0];
            center_y = center[1];
            //bounds_scale = 1;
        }

        let topo = topojson.topology({mapFeatures: geojson});
            topo = topojson.feature(topo, topo.objects.mapFeatures).features;

        geoLayer.selection.selectAll("path")
            .data(topo, function (a, b) {
                return a !== b;
            })
            .enter()
            .append("path")
            .attr("d", geoLayer.path)
            .attr("id", function (d, i) {
                return (topo[i].properties.id)
            })
            .attr("name", function (d, i) {
                if (topo[i].properties.label) {
                    return (topo[i].properties.label)
                } else if (topo[i].properties.name){
                    return (topo[i].properties.name);
                } else {
                    return "";
                }

            })
            .attr("feat_type", function (d, i) {
                return (topo[i].properties.feat_type)
            })
            .attr("class", function (d, i) {
                return (topo[i].properties.feat_type)
            })
            .attr("geom_type", function (d, i) {
                return (topo[i].geometry.type)
            });

        geoLayer.loaded = true;
        geoLayer.loading = false;

        baseCanvas.call(tileLayer.zoom)
                  .call(tileLayer.zoom.translateBy, translate_x, translate_y)
                  .call(tileLayer.zoom.scaleBy, bounds_scale)
                  .call(tileLayer.zoom.translateBy, -center_x, -center_y);
    }


    var vectorZoomTMS = function(tileGenerator, transform) {
        let zoomLevel = 1 << tileLayer.zoomLevel;
        let vectorTransform = stringifyVectorTransform(tileGenerator.scale, tileGenerator.translate, zoomLevel);
        this.selection.attr("transform", vectorTransform);
    }


    var vectorZoomOSM = function(transform) {
        this.projection
            .scale(transform.k / tau)
            .translate([transform.x, transform.y]);
        this.path.pointRadius(0.5);
        this.selection.selectAll("path")
                        .attr("d", this.path);
    }

    var vectorZoom = function(tileGenerator, transform) {
        if (tileLayer.sourceFormat == "tms") {


            if (this.loading || this.loaded) {
                this.path.pointRadius(0.5);
                this.selection.selectAll("path")
                                .attr("d", this.path);
            }
        } else {
            if (this.loading || this.loaded) {
                this.projection
                      .scale(transform.k / tau)
                      .translate([transform.x, transform.y]);
                this.path.pointRadius(0.5);
                this.selection.selectAll("path")
                                .attr("d", this.path);
            }
        }
    }

    function zoomCallback(){
        let transform = d3.event.transform;

        tileZoom(transform);
    }

    function stringify(scale, translate) {
        let k = scale / 256, r = scale % 1 ? Number : Math.round;
        return "translate(" + r(translate[0] * scale) + "," + r(translate[1] * scale) + ") scale(" + k + ")";
    }

    function stringifyVectorTransform(scale, translate, zoom) {
        let k = (scale / 256) * zoom, r = scale % 1 ? Number : Math.round;
        return "translate(" + r(translate[0] * scale) + "," + r(translate[1] * scale) + ") scale(" + k + ")";
    }

    var layer = function(layerName) {
        let geoLayer;

        if (layers[layerName]) {
            geoLayer = layers[layerName];
        } else {
            layers[layerName] = {
                                 selection: baseCanvas.select("#vector")
                                              .append("g")
                                              .attr("id", layerName)
                                              .attr("class", "layer")
                                 };

            geoLayer = layers[layerName];
        }

        return geoLayer;
    }

    var getRasterSelection = function() {
        return tileLayer.selection;
    }

    var getVectorSelection = function(layerName) {
        if (layerName){
            return layer(layerName).selection;
        } else {
            return layers.baseLayer.selection;
        }
    }

    init();

    return {
        init: init,
        vectorFromGeoJSONContent: loadVectors,
        tilesFromURL: loadTiles,
        getRaster: getRasterSelection,
        getVectorLayer: getVectorSelection,
        zoom: zoomCallback/*,
        rasterFromContent: loadSketchMapRasterFromContent, //PENDING
        vectorFromSVGURL: loadSketchMapVectorFromURL,
        addVector: appendVectorElement, //PENDING
        addVectors: appendVectorElements, //PENDING
        getVectors: getVectorSelection,
        getVectorSVG: getVectorAsSVG //PENDING*/
    }
})(refFormat);

var nonMapDataLoader = new function(){

}

