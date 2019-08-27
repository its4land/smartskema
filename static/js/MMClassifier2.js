var mapmatches;
var baseMapDisplayManager; //baseMapDisplayManagerInstance
var selected = undefined;
var finalResult;
var json;





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
        mm_checked1 = new Boolean($("#ortho_GCP_checked").prop("checked", true));
    };

    new communicator(ajaxParams).sendRequest(callbackParams, callback);
}

/**
 Align and integration of data
 **/
function align_Sketch_Map() {

    let svgContent = sketchMapDisplayManager.getVectorSVG().outerHTML;
    let geojsonContent = baseMapDisplayManager.getVectorGeojson().outerHTML;
    console.log("here base map contants",geojsonContent)
    console.log("here svgContent contants",svgContent)

    let ajaxParams = {
        url: '/align_plain',
        type: 'POST',
        data: {
                svgData: svgContent,
                geojsonData: geojsonContent
        }
    };

    let callbackParams = {};

    /**
     * callback for renderSketchMapRaster - expects a 'this' object containing all parameters
     * that are not part of the contents of a file
     * also sets up mouseover events for both maps
     */
    let callback = function (resp) {
      mapmatches = JSON.parse(resp);
      finalResult = mapmatches;
    };
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
        finalResult = json;
        // console.log("here is matching json:",json);
        baseMapDisplayManager.vectorFromGeoJSONContent(json, "alignedSketchMapData");
    };
    new communicator(ajaxParams).sendRequest(callbackParams, callback);
}

/**
 *  - Download all the final results are *.json
 *  - Both plan-sketch and ortho project result will be download by the function
 */
function downloadResult(){
    let alignedResult = finalResult;
    var convertedData = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(alignedResult));
    // Create export
    document.getElementById('download_alignedResult').setAttribute('href', 'data:' + convertedData);
    document.getElementById('download_alignedResult').setAttribute('download', 'alignedResult.json');
}
