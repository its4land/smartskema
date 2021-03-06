var pi = Math.PI,
    tau = 2 * Math.PI;

const IMAGE_MAP_DATA = 0
const VECTOR_MAP_DATA = 1
const MAP_TILE_DATA = 2

const SVG_ELEMENT_TYPES = ['point', 'line', 'path', 'polyline', 'polygon', 'circle', 'ellipse', 'rect'];

var sketchMapDisplayManager = (function(){
    var sketchLoaded;
    var sketchCanvas;
    var layers = {};


    var init = function() {
        sketchLoaded = false;
        d3.select('#sketchmapplaceholder').selectAll('*').remove();
        sketchCanvas = d3.select('#sketchmapplaceholder')
                                .append("svg")
                                .attr("id", "sketchSVG")
                                .attr("width", 800)
                                .attr("height", 565.686);
        sketchCanvas.append("g").attr("id", "raster");
        sketchCanvas.append("g").attr("id", "vector");
    }

    var getRasterSelection = function() {
        return sketchCanvas.select("#raster");
    }

    var getVectorAsSVG = function() {
        /**
        * Retrieve every vector object from every svg as done in load vector maps.
        *
        **/
        let svg = sketchCanvas.node().cloneNode(false);
            svg = d3.select(svg);

        for (let k in layers){
            let vectorLayer = layers[k].selection;
            vectorLayer.selectAll("*").each((d, i, g) => {
                svg.append(() => g[i].cloneNode(false));
            })
        }

        return svg.node();
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
            sketchCanvas.select("#raster").selectAll('*').remove();
            sketchCanvas.select("#vector").selectAll('*').remove();
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


    var appendVectorElement = function(element, layerName) {
        let vectorLayer = layer(layerName).selection;
        let elementSelection;

        if (element instanceof SVGGeometryElement){
            vectorLayer.append(() => element);
            elementSelection = vectorLayer.select(element)
        } else if (element.node) {
            if (element.node() instanceof SVGGeometryElement) {
                vectorLayer.append(() => element.node());
                elementSelection = vectorLayer.select(element.node())
            }
        }

        if (elementSelection) {
            let feat_type =
            elementSelection.classed(function(){return this.getAttribute('id')})
        }
    }

    var appendVectorElements = function(selection, layerName) {
        selection.each(function(){appendVectorElement(this, layerName)});
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

    var loadSketchMapVector = function(svgDoc, layerName) {

        let vectorLayer = layer(layerName).selection;

        //let sketchCanvas = sketchMapDisplayManager.sketchCanvas;
        let svgNode = d3.select(svgDoc).select("svg");
        let width = svgNode.attr('width');
        let height = svgNode.attr('height');

        svgNode.node().getAttributeNames().forEach((attrName) => {
            if (!sketchCanvas.node().hasAttribute(attrName)) {
                sketchCanvas.node().setAttribute(attrName, svgNode.node().getAttribute(attrName));
            }
        });

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

                vectorLayer.append(() => clone);
            }
        });
    }

     var loadSketchMapVectorFromURL = function(url, layerName) {
        d3.svg(url).then(loadSketchMapVector);
     }

    var loadSketchMapVectorFromContent = function(svgString, layerName) {
        svgDoc = (new DOMParser).parseFromString(svgString, "image/svg+xml");
        loadSketchMapVector(svgDoc, layerName);
    }

    var layer = function(layerName) {
        let vectorLayer;

        if (!layerName) {
            layerName = "baseLayer";
        }

        if (layers[layerName]) {
            vectorLayer = layers[layerName];
        } else {
            layers[layerName] = {
                                 selection: sketchCanvas.select("#vector")
                                              .append("g")
                                              .attr("id", layerName)
                                              .attr("class", "layer")
                                 };
            vectorLayer = layers[layerName];
        }

        return vectorLayer;
    }

    var getVectorSelection = function(layerName) {
        return layer(layerName).selection;
    }

    var getVectorSelections = function(layerName) {

        return Object.keys(layers).map(k => layers[k].selection);
    }

    var removeVectorSelection = function(layerName) {
        if (layerName){
            if (layers[layerName]){
                let selection = layers[layerName].selection.remove();
                delete layers[layerName];

                return selection;
            }
        }
    }

    init();

    return {
        init: init,
        rasterFromURL: loadSketchMapRasterFromURL,
        rasterFromContent: loadSketchMapRasterFromContent, //PENDING
        vectorFromSVGURL: loadSketchMapVectorFromURL,
        vectorFromSVGContent: loadSketchMapVectorFromContent,
        addVector: appendVectorElement, //PENDING
        addVectors: appendVectorElements,
        removeVectorLayer: removeVectorSelection, //PENDING
        getRaster: getRasterSelection,
        getVectorSVG: getVectorAsSVG,
        getVectorLayer: getVectorSelection,
        getVectorLayers: getVectorSelections//PENDING
    }

})();


var baseMapDisplayManagerTemplate = (function(refFormat){
    var tileURL;
    var baseLayerLoaded;
    var baseCanvas;
    var zoomCallback;
    var layers = {};
    var tileLayer = {};
    var zoom = d3.zoom().on("zoom", tileZoom);
    var zoomTransform;// = d3.zoomIdentity.translate(tileLayer.width/2, tileLayer.height/2);
    var tileLoad;
    var method = {
        getProjection : {
            tms : () => {
                return d3.geoIdentity();
            },
            osm : () => {
                return d3.geoMercator()
                            .scale(1 / tau)
                            .translate([0, 0]);
            }
        },
        vectorZoom : {},
        tileLoad : {},
        vectorCAT : {},
        tileURL : {}
    };
//        tileLayer.getProjection = function(){};

    var init = function(refFormat) {
        baseLayerLoaded = false;

        d3.select('#metricmapplaceholder').selectAll('*').remove();

        // create svg
        baseCanvas = d3.select('#metricmapplaceholder')
                                .append("svg")
                                .attr("id", "baseSVG")
                                .attr("width", 800)
                                .attr("height", 565.686); //width to height ratio corresponding to A-series paper sizes

        // setup tile layer
        tileLayer.selection = baseCanvas.append("g").attr("id", "raster");
        tileLayer.width = baseCanvas.attr("width");
        tileLayer.height = baseCanvas.attr("height");
        tileLayer.tiler = d3.tile().size([tileLayer.width, tileLayer.height]).wrap(false);
        tileLayer.refFormat = refFormat.toLowerCase();
        tileLayer.initialOffset = 0;


        tileLayer.vectorZoom = method.vectorZoom[refFormat];
        tileLayer.tileLoad = method.tileLoad[refFormat];
        tileLayer.vectorLoad = vectorLoad;
        tileLayer.vectorCAT = method.vectorCAT[refFormat];
        tileLayer.getProjection = method.getProjection[refFormat];
        tileLayer.formatTileURL = method.tileURL[refFormat];

        zoomTransform = d3.zoomIdentity.translate(tileLayer.width/2, tileLayer.height/2);
        // vector layers
        baseCanvas.append("g").attr("id", "vector");
    }

    /**
    * tile loading, zooming, and retrieval functionality
    */
    method.tileLoad.tms = async function(url) {
        let t = tileLayer;
        let tilesLoaded = false;

        t.url = url.slice(-1) == "/"? url : url + "/";

        let tParams = await d3.xml(url + "tilemapresource.xml");
            tParams = d3.select(tParams).select("TileMap");
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
        let lowestTileRatio = 0;
        let highestScaleTileSet = tParams.select("TileSets")
                                            .selectAll("TileSet")
                                            .each((d, i, g) =>
                                                {
                                                    let scale = Number(g[i].getAttribute("order"));
                                                    let tileRatio = Number(g[i].getAttribute("units-per-pixel"));
                                                    highestScale = scale > highestScale? scale: highestScale;
                                                    lowestTileRatio = tileRatio > lowestTileRatio? tileRatio: lowestTileRatio;
                                                    return false;
                                                });

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
        };
        zoomTransform = zoomTransform.scale(t.lowestTileSize + t.initialOffset);
        zoom = d3.zoom().scaleExtent([1 << 8, 1 << Math.round(2 * highestScale)])
                        .on("zoom", tileZoom);
//        baseCanvas.call(zoom)
//                  .call(zoom.transform, zoomTransform);
        tilesLoaded = true;

        return new Promise((resolve, reject) => { if (tilesLoaded) {resolve(tilesLoaded)} else {reject(tilesLoaded)}});
    }

    method.tileLoad.osm = async function(url) {
        let t = tileLayer;
        let tilesLoaded = false;

        t.url = url.slice(-1) == "/"? url : url + "/";
        zoom = d3.zoom().scaleExtent([1 << 8, 1 << 30]).on("zoom", tileZoom);
//        baseCanvas.call(zoom)
//                  .call(zoom.transform, zoomTransform);
        tilesLoaded = true;

        return new Promise((resolve, reject) => { if (tilesLoaded) {resolve(tilesLoaded)} else {reject(tilesLoaded)}});
    }

    var tileZoom = function() {
        let transform = d3.event.transform;
        let t = tileLayer;
        let url = t.url;
        let tiles = t.tiler
                        .scale(transform.k)
                        .translate([transform.x, transform.y])();
        let image = t.selection
                        .attr("transform", stringify(tiles.scale, tiles.translate))
                        .selectAll("image")
                        .data(tiles, function (d) {
                            return [d.x, d.y, d.z];
                        });
        image.exit().remove();
        image.enter().append("image")
            .attr("xlink:href", function (d) {
                turl = t.formatTileURL(url, d);
                return turl;
            })
            .attr("x", function (d) {
                return d.tx;
            })
            .attr("y", function (d) {
                return d.ty;
            })
            .attr("width", 256)
            .attr("height", 256);

        Object.keys(layers).forEach((layer) => {t.vectorZoom.call(layers[layer], transform, tiles)});
    }

    method.tileURL.tms = function(url, d) {
        var y = Math.pow(2, d.z) - d.y - 1; //needs to be converted from TMS tiles to XYZ tiles
        return url + d.z + "/" + d.x + "/" + y + ".png";
    }

    method.tileURL.osm = function(url, d) {
        return "http://" + "abc"[d.y % 3] + "." + url + d.z + "/" + d.x + "/" + d.y + ".png";
    }

    var getRasterSelection = function() {
        return tileLayer.selection;
    }

    /**
    * vector loading, zooming, and retrieval functionality
    */
    method.vectorCAT.tms = function(center, map_center){
        let t = tileLayer;

        let translate_y = (128 - map_center[1] + t.initialOffset) / 256; //map_center[1]; //height/2 -
        let translate_x = (128 - map_center[0]) / 256; //map_center[0]; //width/2 -

        return [0, 0, translate_x, translate_y];
    }

    method.vectorCAT.osm = function(center, map_center){
        return [center[0], center[1], 0, 0];
    }

    var vectorLoad = function(geojson, layerName){
        let t = tileLayer;
        let geoLayer = layer(layerName);
        let width = baseCanvas.attr("width");
        let height = baseCanvas.attr("height");
        let translate_x = 0;
        let translate_y = 0;
        let center_x = 0;
        let center_y = 0;

        geoLayer.path.pointRadius(0.5);
        geoLayer.loading = true;

        let scaled_bounds = geoLayer.path.bounds(geojson);
        let center = geoLayer.path .centroid(geojson);
        let map_width = scaled_bounds[1][0] - scaled_bounds[0][0];
        let map_height = scaled_bounds[1][1] - scaled_bounds[0][1];
        let map_center = [scaled_bounds[0][0] + map_width / 2, scaled_bounds[0][1] + map_height / 2
                                                                                        + t.initialOffset];
        let bounds_scale = Math.min(t.width / map_width, t.height / map_height);

        centerAndTranslate = t.vectorCAT(center, map_center);
        center_x = centerAndTranslate[0];
        center_y = centerAndTranslate[1];
        translate_x = centerAndTranslate[2];
        translate_y = centerAndTranslate[3];

        let topo = topojson.topology({mapFeatures: geojson});
            topo = topojson.feature(topo, topo.objects.mapFeatures).features;

        geoLayer.selection.selectAll("path")
            .data(topo, function (a, b) {
                return a !== b;
            })
            .enter()
            .append("path")
            .attr("d", geoLayer.path)
            .attr("geom_type", function (d, i) {
                return (topo[i].geometry.type)
            })
            .attr("class", function (d, i) {
                return (topo[i].properties.feat_type || topo[i].properties.class)
            })
            .each((d, i, g) =>
                    {
                        Object.keys(topo[i].properties).forEach(
                            (key) => g[i].setAttribute(key, topo[i].properties[key])
                        );
            });

        baseCanvas.call(zoom)
                  .call(zoom.transform, zoomTransform)
                  .call(zoom.translateBy, translate_x, translate_y)
                  .call(zoom.scaleBy, bounds_scale)
                  .call(zoom.translateBy, -center_x, -center_y);
    }

    method.vectorZoom.tms = function(transform, tiles) {
        let zoomLevel = 1 << tiles.level;
        let vectorTransform = stringifyVectorTransform(tiles.scale, tiles.translate, zoomLevel);
        this.selection.attr("transform", vectorTransform);
    }

    method.vectorZoom.osm = function(transform) {
        this.projection
            .scale(transform.k / tau)
            .translate([transform.x, transform.y]);
        this.path.pointRadius(0.5);
        this.selection.selectAll("path")
                        .attr("d", this.path);
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
        let t = tileLayer;

        if (!layerName) {
            layerName = "baseLayer";
        }

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
            geoLayer.projection = t.getProjection();
            geoLayer.path = d3.geoPath().projection(geoLayer.projection);
        }

        return geoLayer;
    }

    var getVectorAsGeojson = function(){
        // setup the geojson object
        let geojson = {};
        // go through each layer and for each geometry element do
        // - if geometry is circle make a point with coordinates (cx, cy)
        // - for each coordinate of geometry
        //   - apply projection.invert
        //   - apply the inverse transformation matrix of the consolidated transform matrix of the geometry
        //   - append the coordinate to coordinate list for the geojson object created.

        /**
         * Retrieve every vector object from every svg as done in load vector maps.
         *
         **/
        let svg = baseCanvas.node().cloneNode(false);
        svg = d3.select(svg);

        for (let k in layers){
            let vectorLayer = layers[k].selection;
            vectorLayer.selectAll("*").each((d, i, g) => {
                svg.append(() => g[i].cloneNode(false));
        })
        }

        return svg.node();

        //return geojson
    }

    var getVectorSelection = function(layerName) {
        return layer(layerName).selection;
    }

    var getVectorSelections = function(layerName) {

        return Object.keys(layers).map(k => layers[k].selection);
    }

    var removeVectorSelection = function(layerName) {
        if (layerName){
            if (layers[layerName]){
                let selection = layers[layerName].selection.remove();
                delete layers[layerName];

                return selection;
            }
        }
    }

    init(refFormat);

    return {
        init: init,
        vectorFromGeoJSONContent: tileLayer.vectorLoad,
        tilesFromURL: tileLayer.tileLoad,
        getRaster: getRasterSelection,
        getVectorLayer: getVectorSelection,
        getVectorLayers: getVectorSelections,
        zoom: zoomCallback,
        removeVectorLayer: removeVectorSelection,
        getVectorGeojson: getVectorAsGeojson//PENDING
        /*,
        rasterFromContent: loadSketchMapRasterFromContent, //PENDING
        vectorFromSVGURL: loadSketchMapVectorFromURL,
        addVector: appendVectorElement, //PENDING
        addVectors: appendVectorElements, //PENDING
        getVectors: getVectorSelection,
        getVectorSVG: getVectorAsSVG //PENDING*/
    }
});

var nonMapDataManager = (function(){

    return {};
})();

