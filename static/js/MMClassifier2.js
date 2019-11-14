var mapmatches;
var baseMapDisplayManager; //baseMapDisplayManagerInstance
var selected = undefined;
var finalResult;
var json;


/**
 * Downloading Base map features from PnS platform
 * - the PnS must have features for the selected project location
 */
function download_MetricMap_from_pnS(){
    createProcessingRing();

    let ajaxParams = {
        url : "/download_MetricMap_from_pnS",
        type : "POST",
        data : {
            baseMapContant : ""
        }

    };
    new communicator(ajaxParams).sendRequest({}, function(resp){
        deleteProcessingRing();
        var json = JSON.parse(resp);
        var baseMapVectorData;
        if (json.baseMapContents != null){
            let sourceFormat = sessionData.projectType == "orthoSketchProject"? "tms": "openstreetmap";
            let tilemap_format = sessionData.projectType == "orthoSketchProject"? TMS_TILE_MAP: OSM_TILE_MAP;
            baseMapDisplayManager = baseMapDisplayManagerTemplate(tilemap_format);
            let url = sourceFormat  == "tms"?
                "./static/data/modified/tiles_256_raster/": "tile.openstreetmap.org/";

            baseMapDisplayManager.tilesFromURL(url).then(
                function(done){
                    baseMapDisplayManager.vectorFromGeoJSONContent(json.baseMapContents) //"baseLayer")

                    dataManager.addData("baseMapVector", json.baseMapContents);
                    button_manager.enable_interactive_bnts();
                });
        }
        mm_checked = new Boolean($("#MM_checked").prop("checked", true));
    });
}




function loadMetricMap() {

    var params = {location: document.getElementById("#metricmapplaceholder")};

    openReadFromFile(event.target, renderBaseMap, params, "text");
}

function renderBaseMap(map) {
    toolTipCounter = toolTipCounter+1;

    if(toolTipCounter==4){
        toolTipManager.hideToolTip();
    };

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


        dataManager.addData("baseMapVector", url);
        button_manager.enable_interactive_bnts();

        mm_checked = new Boolean($("#MM_checked").prop("checked", true));
        mm_checked1 = new Boolean($("#ortho_GCP_checked").prop("checked", true));
    };

    new communicator(ajaxParams).sendRequest(callbackParams, callback);
}


/**
 Function to align Maps
 **/

function align_geometries(event,ele){
    toolTipManager.movableToolTip(document.getElementById("tooltipdiv"));
    toolTipManager.displayToolTip(ele);
    if (projectMode == 0){
        console.log("alignment if",projectMode);
        align_Sketch_Map(event);
    }else if (projectMode == 1){
        align_Satellite_Drawing(event);
        console.log("alignment else if",projectMode);
    }else{
        //align_Sketch_Map();// have to set for the case when we are loading from publish and share platform
    }
}

function align_Sketch_Map(event) {

    $.alert({
        title: 'Info: the Alignment is in progress!',
        content: 'be patient the process will take some time...'
    });


    let svgContent = sketchMapDisplayManager.getVectorSVG().outerHTML;
    let geojsonContent = baseMapDisplayManager.getVectorsLayersAsGeojson();
    //console.log("here base map contants",geojsonContent)
    //console.log("here svgContent contants",svgContent)

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
      if (finalResult !=null){
          toolTipManager.hideToolTip(event);
          dataManager.addData("matchingDict", finalResult);
          button_manager.enable_interactive_bnts();
      }
    };
    new communicator(ajaxParams).sendRequest(callbackParams, callback);
}

/**
 * Align features using a least-squares transform
 *
 */

function align_Satellite_Drawing(event) {


    $.alert({
        title: 'Info: the Alignment is in progress!',
        content: 'be patient the process will take some time...'
    });

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
        mapmatches = json;
        // console.log("here is matching json:",json);
        baseMapDisplayManager.vectorFromGeoJSONContent(json, "alignedSketchMapData");
    };
    new communicator(ajaxParams).sendRequest(callbackParams, callback);
}

/**
 *  - Download all the final results are *.json
 *  - Both plan-sketch and ortho project result will be download by the function
 */
function downloadResult(event,ele){
    toolTipManager.movableToolTip(document.getElementById("tooltipdiv"));
    toolTipManager.displayToolTip(ele);

    let alignedResult = finalResult;
    var convertedData = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(alignedResult));
    // Create export
    document.getElementById('download_alignedResult').setAttribute('href', 'data:' + convertedData);
    document.getElementById('download_alignedResult').setAttribute('download', 'alignedResult.json');
}
