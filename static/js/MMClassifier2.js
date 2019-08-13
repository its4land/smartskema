var MMGeoJsonData;
var SMGeoJsonData;
var labelLayer;

var mapmatches;
var baseMapDisplayManager; //baseMapDisplayManagerInstance

var selected = undefined;
var previousOne = undefined;

var json;

function HideMap() {
    $("#hideMap").hide();
    $("#metricmapplaceholder").hide();
    $("#showMap").show();
    $("#MMLinks").hide();
}

function ShowMap() {
    $("#hideMap").show();
    $("#metricmapplaceholder").show();
    $("#showMap").hide();
    $("#MMLinks").show();
}

function loadMetricMap() {

    var params = {location: document.getElementById("#metricmapplaceholder")};

    openReadFromFile(event.target, renderBaseMap, params, "text");
}

function renderBaseMap(map) {
    let json = JSON.parse(map);

    let ajaxParams = {
        url: '/uploadBaseMap',
        type: 'POST',
        data: {
                mapContent: JSON.stringify(json)
        }
    };

    let callbackParams = {};

    /**
     * callback for renderSketchMapRaster - expects a 'this' object containing all parameters
     * that are not part of the contents of a file
     */
    let callback = function(resp) {
        //let json = JSON.parse(resp);
        let sourceFormat = sessionData.projectType == "orthoSketchProject"? "tms": "openstreetmap";

        let tilemap_format = sessionData.projectType == "orthoSketchProject"? TMS_TILE_MAP: OSM_TILE_MAP;
        baseMapDisplayManager = baseMapDisplayManagerTemplate(tilemap_format);

        let url = sourceFormat  == "tms"?
                                        "./static/data/modified/tiles_256_raster/": "tile.openstreetmap.org/";
        baseMapDisplayManager.tilesFromURL(url).then(
                    function(done){
                        baseMapDisplayManager.vectorFromGeoJSONContent(json) //"baseLayer")
                        });

        mm_checked = new Boolean($("#MM_checked").prop("checked", true));
    };

    new communicator(ajaxParams).sendRequest(callbackParams, callback);
}


function downloadJsonMM() {
    var convertedData = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(MMGeoJsonData));
    // Create export
    document.getElementById('exportMetricFeatures').setAttribute('href', 'data:' + convertedData);
    document.getElementById('exportMetricFeatures').setAttribute('download', 'MM_fileName.geojson');
}


/**
 Align and integration of data
 **/
function align_Sketch_Map() {

    let svgContent = sketchMapDisplayManager.getVectorSVG().outerHTML;
    let geojsonContent = baseMapDisplayManager.getVectorGeojson().outerHTML;

    let ajaxParams = {
        url: '/align_plain',
        type: 'POST',
        data: {
                svgData: svgContent,
                geoData: geojsonContent
        }
    };

    let callbackParams = {};

    /**
     * callback for renderSketchMapRaster - expects a 'this' object containing all parameters
     * that are not part of the contents of a file
     *
     * also sets up mouseover events for both maps
     */
    let callback = function (resp) {
      mapmatches = JSON.parse(resp);
    };

   /* let callback = function(resp) {
        mapmatches = JSON.parse(resp);
        let matches = JSON.parse(resp);
        // console.log("here is matching json:",json);
        let allFeatureLayers = sketchMapDisplayManager.getVectorLayers();
        allFeatureLayers.forEach(sml => {
            sml.selectAll("*").each(function(){
                if (matches[this.getAttribute("id")]) {
                    d3.select(this).on("mouseover", function (d,i,g) {
                        d3.select(this).classed("selected", true);
                        matches[this.getAttribute("id")].forEach(match => {
                                baseMapDisplayManager.getVectorLayers().forEach(
                                    bml => bml.select("#" + match).classed("selected", true));
                            });
                        }
                    ).on("mouseout", function (d,i,g) {
                        d3.select(this).classed("selected", false);
                        matches[this.getAttribute("id")].forEach(match => {
                                baseMapDisplayManager.getVectorLayers().forEach(
                                    bml => bml.select("#" + match).classed("selected", false));
                            });
                        }
                    )
                }
            });
        });

        let allBMFeatureLayers = baseMapDisplayManager.getVectorLayers();
        allBMFeatureLayers.forEach(sml => {
            sml.selectAll("*").each(function(){
                counter = 0
                num_keys = Object.keys(matches).length;
                matched = [];
                mid = this.getAttribute("id");
                Object.keys(matches).forEach(k => {
                    matches[k].forEach(match => {
                        if (mid == match) {
                            matched.push(k);
                        }
                    })
                    counter++;
                });
                new Promise().resolve(counter == num_keys).then(
                    function(){
                        d3.select("#"+mid).on("mouseover", function (d,i,g) {
                            d3.select(this).classed("selected", true);
                            matched.forEach(match => {
                                    sketchMapDisplayManager.getVectorLayers().forEach(
                                        bml => bml.select("#" + match).classed("selected", true));
                                });
                            }
                        ).on("mouseout", function (d,i,g) {
                            d3.select(this).classed("selected", false);
                            matched.forEach(match => {
                                    sketchMapDisplayManager.getVectorLayers().forEach(
                                        bml => bml.select("#" + match).classed("selected", false));
                                });
                            }
                        )
                    }
                )
            })
        });

        $.alert({
            title: 'Info: Alignment is completed!',
            content: 'Move the mouse over a sketch or base map feature to find the corresponding feature.'
        });
    };*/

    new communicator(ajaxParams).sendRequest(callbackParams, callback);
}

/**
 * Align features using a least-squares transform
 *
 */
function align_Satellite_Drawing() {

    let svgContent = sketchMapDisplayManager.getVectorSVG().outerHTML;

    let ajaxParams = {
        url: '/align_ortho',
        type: 'POST',
        data: { svgData: svgContent }
    };

    let callbackParams = {};

    /**
     * callback for renderSketchMapRaster - expects a 'this' object containing all parameters
     * that are not part of the contents of a file
     */
    let callback = function(resp) {
        let json = JSON.parse(resp);
        // console.log("here is matching json:",json);
        baseMapDisplayManager.vectorFromGeoJSONContent(json, "alignedSketchMapData");
    };

    new communicator(ajaxParams).sendRequest(callbackParams, callback);
}


jQuery.fn.d3Click = function () {
    this.each(function (i, e) {
        var evt = new MouseEvent("click");
        e.dispatchEvent(evt);
    });
};

