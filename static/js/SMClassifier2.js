var MMGeoJsonData;
var SMGeoJsonData;
var drawnItems_sm;
var map;
var labelLayer;
var img;
var mapmatches;
var previous = undefined;
var selectedSM = undefined;
var sketchZoomCount = 0;
var sketchSVGFinal;
var k;
var sketch_bbox;
var feat_id;
var feat_type;
var fileName;

var svg_elements;
var overlay;
var fileName_full;
var mm_checked;
var partyJson = "";
var party_checked;
var loadedPartyFile = "";
var ladm_checked;

var imgHight;
var imgWidth;
var sm_checked;
var originalImageContent = "";
var LDM_fileName_full = "";
var SvgPath;


function loadComplexStructureDrawingMap(element){
    fileList = document.getElementById('ComplexStrMapInputbutton').files;
    for (var i = 0; i < fileList.length; i++) {
        var location = document.getElementById("complexStructureMapholder");
        //call function
        randerComplexStructureFiles(fileList[i], location);
    }
}

function randerComplexStructureFiles(imageFile,location){
    fileName_full = "";
    var reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = function (e) {
        imageFile.src = this.result;
        complextImageContent = this.result;
        console.log(complextImageContent);
        var img = document.createElement("img");
        img.setAttribute("id", "complStruMap");

        fileName_full = imageFile.name;
        fName = fileName_full.split(".");
        fileName = fName[0];

        //call resizer function
       //var imageUrl = "./data_original/" + fileName_full;
        //console.log(imageUrl);
        $.ajax({
            url: '/smResizer',
            type: 'POST',
            data: {
                fileName: fileName_full,
                imageContent: complextImageContent
                },
            //contentType: 'text/plain',
            //dataType: 'json',
            success: function (resp) {
                var json = JSON.parse(resp);
                $("#complexStr_drawing_checked").prop("checked", true);
                imgPath = json.imgPath;
                imgHight = json.imgHight;
                imgWidth = json.imgWidth;
                filePath = "./"+imgPath;
                console.log(filePath,imgHight, imgWidth);

                img.setAttribute('src', filePath);
                img.setAttribute("height", "500px");
                img.setAttribute("width", "500px");
                location.appendChild(img);
            }
        });
    };
    $('#load_complexStructure_map_div').prop("style", "visibility: visible");

}


function toggle_interaction() {
    svg_elements = d3.select("#loadedSVG").selectAll("path,polygon,circle,rect,line,polyline");
    console.log("svg elements:", svg_elements);
    /*.on('click', function (d, i) {
        d3.select(this)
            .transition()//Set transition
            .style('stroke', '#039BE5')
            .attr("stroke-width", "5px");
    })*/
    svg_elements.on('mouseover', alignment_mouse_over);
    svg_elements.on('mouseout', alignment_mouse_out);
}


//svg elelment interaction
function alignment_mouse_over(d, i) {
    fid = this.getAttribute('id');
    mid = mapmatches[fid];
    mel = document.getElementById(mid);
    console.log(mid);

    d3.select(this)
        .style("stroke", "#039BE5")
        .style("stroke-width", "10px");
    d3.select(mel)
        .style("stroke", "#039BE5")
        .style("stroke-width", "10px");
}


function alignment_mouse_out(d, i) {
    fid = this.getAttribute('id');
    mid = mapmatches[fid];
    mel = document.getElementById(mid);

    d3.select(this)
        .style("stroke", "#455A64")
        .style("stroke-width", "1px");
    d3.select(mel)
        .style("stroke", "#455A64")
        .style("stroke-width", "1px");
}


/**
 * function allows you to load Sketch map in the panel
 * @param element
 */
function loadSketchMap() {

    var callbackParams = {};

    openReadFromFile(event.target, renderSketchMapRaster, callbackParams);

    $("#SMLinks").show();
    $("#MMLinks").hide();
}

/**
 * callback for loadSketchMap - expects a 'this' object containing all parameters
 * that are not part of the contents of a file
 */
function renderSketchMapRaster(image) {
    let originalImageContent = image;

    let ajaxParams = {
        url: '/uploadSketchMap',
        type: 'POST',
        data: {
                ...this,
                imageContent: originalImageContent
        }
    };

    let callbackParams = {};

    /**
     * callback for renderSketchMapRaster - expects a 'this' object containing all parameters
     * that are not part of the contents of a file
     */
    let callback = function(resp) {
        let json = JSON.parse(resp);
        //maximum image width should be 800 to fit in the svg without overflowing the viewport
        sketchMapDisplayManager.rasterFromURL("/" + json.imgPath, json.imgWidth, json.imgHeight);

        sm_checked = new Boolean($("#SM_checked").prop("checked", true));
    };

    new communicator(ajaxParams).sendRequest(callbackParams, callback);
}


/**
 * loads the svg image from th image processed with Cristhian's code
 * @returns
 */

function processSketchMap(event) {
    $.alert({
        title: 'Info: the image is being processed',
        content: 'be patient the process will take some time...'
    });

    let ajaxParams = {
            url: '/processSketchMap',
            type: 'GET'
    };

    let callbackParams = {};
    let callback = function (resp) {
        var json = JSON.parse(resp);
        sketchMapDisplayManager.vectorFromSVGURL("/" + json.svgPath);
    };

    new communicator(ajaxParams).sendRequest(callbackParams, callback);


/** THIS SHOULD DEFINITELY GO - DON'T KNOW WHAT IT'S DOING HERE BUT WHATEVER IT IS
    WE DO IT ELSEWHERE.
    var final = sketchSVGFinal.selectAll("path,polygon,circle,rect,line,polyline");

    final.on('click', function () {
        selectedSM = mapClickD3(this, previous, selectedSM, "sketch");
        matchesCheck("sketch", mapmatches, this);
    });
*/
}


jQuery.fn.d3Click = function () {
    this.each(function (i, e) {
        var evt = new MouseEvent("click");
        e.dispatchEvent(evt);
    });
};

jQuery.fn.d3DblClick = function () {
    this.each(function (i, e) {
        var evt = new MouseEvent("dblclick");
        e.dispatchEvent(evt);
    });
};

//connector for connecting the clicks on the D3 map and the leaflet map. Later also for zooming and panning hopefully
connector.registerSketchListener(function (val) {
    var returnArray = connectorSketchMap(selectedSM, previous);
    selectedSM = returnArray[0];
    previous = returnArray[1];
    if (returnArray[2] == true) {
        $(selectedSM).d3Click();
    }
});


// THESE NEXT TWO WERE PART OF THE PROCESS_IMAGE FUNCTION. THEY WILL HAVE TO GO ELSEWHERE NOW
// IN PARTICULAR WE SHOULD REPLACE THEM (THE SET_SVG_FEATURES_COLOR METHODS INVOKED
// INSIDE) WITH CSS STYLING.
function responseCallback(xhr) {

    var svgFinal = sketchSVGFinal.append(function () {
        return xhr.responseXML.querySelector('svg');
    })
        .attr("id", "loadedSVG")
        .attr("width", svgWidth)
        .attr("height", svgHight)
        .attr("x", 0)
        .attr("y", 0);
    //set color for svg elements
    set_svg_features_color();

}


function responseCallback_degit(xhr) {
    //hide the process ring

    sketchSVGFinal.append(function () {
        return xhr.responseXML.querySelector('svg');
    })
        .attr("id", "loadedSVG")
        .attr("width", svgWidth)
        .attr("height", svgHight)
        .attr("x", 0)
        .attr("y", 0);
    //set color for svg elements
    set_svg_features_color_digit();
}


//from Salmans code for zooming and panning (and even rotating if that's necessary) in D3
function sketchZoomCallback() {
    if (sketchZoomCount == 0) {

        var transformSketch = d3.zoomTransform(this);
        sketch_bbox = d3.select("svg").node().getBBox();
        //console.log(sketch_bbox);
        k = transformSketch.k;
        sketchZoomCount++;
        //metricZoomCallback();
        sketchZoomCount--;
    }
}


function createProcessingRing() {
    proRing = document.getElementById("processRing");
    proRing.style.visibility = "visible";
    //loc.appendChild(proRing);


}

function deleteProcessingRing() {
    proRing = document.getElementById("processRing");
    proRing.style.visibility = "hidden"
    //loc.removeChild(proRing);
}


function enable_ladm_bnts() {

    $('#editor_div').prop("style", "visibility: visible");
    $('#ladm_interaction_bnts').prop("style", "visibility: visible");

    $('#svg_edit_bnts').prop("style", "visibility: hidden");
    $('#json_edit_bnts').prop("style", "visibility: hidden");

    $('#edit_ladm_bnt').prop('disabled', false);
    $('#query_ladm_bnt').prop('disabled', false);

    $('#edit_svg_popup_div').prop("style", "visibility: hidden");
    $('#edit_svg_popup_div').empty();
    $('#popup_div').empty();
    getMapMatches();
}


/**
 * LADM interaction for RRRs
 */
function ladm_interaction_for_RRR() {
    ladm_interaction_for_RRR_mode();
}


/**
 * function activates spatial_query_activites
 */

function spatial_query_processor(){
    spatial_query_processor_mode();
}

/**
 * function activates non-spatial_query_activites
 */
function nonSpatial_query_processor(){

    nonSpatial_query_processor_mode();
}

/**
 * get the matching Dict.
 */
function getMapMatches() {
     $.ajax({
        url: '/getMapMatches',
        type: 'GET',
        data: {
            feat_id: "",
            feat_type: ""
        },
        contentType: 'text/plain',

        success: function (resp) {
            //console.log("receiver Record", resp);
            json = JSON.parse(resp);
            mapmatches = json;
            console.log("mapMatches", mapmatches);
        }
    });
}

function createTenureRecordTable(record) {
    queryResult_div = document.getElementById("nonSpatial_query_resp_div");
    $(queryResult_div).empty();

    var table = document.createElement("table");
    table.setAttribute("width", "100%");
    table.setAttribute("border-collapse", "collapse");
    table.setAttribute("border", "1px lightslategray");
    table.setAttribute("word-wrap", "break-word-all");
    table.setAttribute("table-layout", "fixed");
    var th1 = document.createElement("th");
    th1.innerHTML = "KEY";
    var th2 = document.createElement("th");
    th2.innerHTML = "VALUE";
    var tr = table.insertRow(-1);
    tr.appendChild(th1);
    tr.appendChild(th2);

    for (var i = 0; i < record.length; i++) {
        for (var key in record[i]) {
            var row = table.insertRow(-1);
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            cell1.innerHTML = key;
            cell2.innerHTML = record[i][key];
        }
    }
    queryResult_div.appendChild(table);
}

function downloadJsonSM() {
    SMGeoJsonData = drawnItems_sm.toGeoJSON();
    var SMGeoJSON = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(SMGeoJsonData));
    document.getElementById('exportSketchFeatures').setAttribute('href', 'data:' + SMGeoJSON);
    document.getElementById('exportSketchFeatures').setAttribute('download', 'SMdata.geojson');
}


$(function () {
    $('[data-toggle="tooltip"]').tooltip()
});



/**
 * removes the disable property of the svg tool buttons
 */
function enable_svg_edit_tool() {
    $('#editor_div').prop("style", "visibility: visible");
    $('#svg_edit_bnts').prop("style", "visibility: visible");

    $('#ladm_interaction_bnts').prop("style", "visibility: hidden");
    $('#json_edit_bnts').prop("style", "visibility: hidden");


    popup = document.getElementById("popup_div");
    popup.style.visibility = "hidden";


    $('.bnt').prop("disabled", false);
    let svg = d3.select("#loadedSVG");

    let img = d3.select("#bgImg");

    var editor = new MODE_EDIT_SVG(svg, img, [0, 1, 2, 3, 4]).init();

    svgEditor.init(MODE_EDIT_SKETCHMAP)

    d3.select(draw_geom).on("click", function () {
        editor.change_mode(0)
    });
    d3.select(edit_geom).on("click", function () {
        editor.change_mode(1)
    });
    d3.select(join_endPoints).on("click", function () {
        editor.change_mode(2)
    });
    d3.select(split_endPoints).on("click", function () {
        editor.change_mode(3)
    });
    d3.select(delete_geom).on("click", function () {
        editor.change_mode(4)
    });
    d3.select(save).on("click", function () {
        editor.save()
    });

    console.log("SVG Editor Activating...");

}

/**
 * enable geoJSON interaction buttons
 */
function enable_json_svg_edit_tool() {
    svgEditor.init('base')

    console.log("JSON_SVG Editor MODE is Activated...");

}

/**
 * LADM interaction for reasoning
 */
function reasoner_process_spatial_queries(){
    $.ajax({
        url: '/reasoner_process_spatial_queries',
        type: 'GET',
        data: {
            main_feat_id: "64",
            main_feat_type: "boma",
            loaded_ladm_path: loaded_ladm_path

        },
        contentType: 'text/plain',
        success: function (resp) {
            var relations = JSON.parse(resp);
          }
    });

}

function set_svg_features_color_digit() {
    var svg = d3.select("#loadedSVG");
    var g = svg.select("#layer2").select("g");

    linkRoad = g.selectAll("path[smart_skema_type='linkRoad']")
        .attr("class", "linkRoad")
        .attr("style", null);

    parcel = g.selectAll("path[smart_skema_type='parcel']")
        .attr("class", "parcel")
        .attr("style", null);

    referencePoint = g.selectAll("path[smart_skema_type='referencePoint']")
        .attr("class", "referencePoint")
        .attr("style", null);

    hospital = g.selectAll("path[smart_skema_type='hospital']")
        .attr("class", "hospital")
        .attr("style", null);
    house = g.selectAll("path[smart_skema_type='house']")
        .attr("class", "boma")
        .attr("style", null);

    landmark = g.selectAll("path[smart_skema_type='landmark']")
        .attr("class", "landmark")
        .attr("style", null);

    olopololi = g.selectAll("path[smart_skema_type='olopololi']")
        .attr("class", "olopololi")
        .attr("style", null);
}

/**
 * function gives colors based on the defined classes in
 * mm_interaction_stype
 */
function set_svg_features_color() {

    var svg = d3.select("#loadedSVG");
    var g = svg.select("g").select("g");

    add1 = g.selectAll("path[smart_skema_type='boma']")
        .attr("style", null)
        .attr("class", "boma");

    add2 = g.selectAll("path[smart_skema_type='borehole']")
        .attr("style", null)
        .attr("class", "borehole");

    add3 = g.selectAll("path[smart_skema_type='river']")
        .attr("class", "river_sm")
        .attr("style", null);

    add4 = g.selectAll("path[smart_skema_type='olopololi']")
        .attr("style", null)
        .attr("class", "olopololi");

    add5 = g.selectAll("path[smart_skema_type='road']")
        .attr("style", null)
        .attr("class", "road_sm");

    add6 = g.selectAll("path[smart_skema_type='marsh']")
        .attr("style", null)
        .attr("class", "marsh");

    bomas = g.selectAll("polygon[smart_skema_type='boma']")
        .attr("class", "boma")
        .attr("style", null);

    olopololi = g.selectAll("polygon[smart_skema_type='olopololi']")
        .attr("class", "olopololi")
        .attr("style", null);

    school = g.selectAll("polygon[smart_skema_type='school']")
        .attr("class", "school")
        .attr("style", null);

    pond = g.selectAll("polygon[smart_skema_type='pond']")
        .attr("class", "pond")
        .attr("style", null);

    church = g.selectAll("polygon[smart_skema_type='church']")
        .attr("class", "church")
        .attr("style", null);

    marsh = g.selectAll("polygon[smart_skema_type='marsh']")
        .attr("class", "marsh")
        .attr("style", null);

    borehole = g.selectAll("polygon[smart_skema_type='borehole']")
        .attr("class", "borehole")
        .attr("style", null);

    mountain = g.selectAll("polygon[smart_skema_type='mountain']")
        .attr("class", "mountain")
        .attr("style", null);

    street = g.selectAll("polygon[smart_skema_type='path']")
        .attr("class", "path")
        .attr("style", null);

    road = g.selectAll("polygon[smart_skema_type='road']")
        .attr("class", "road_sm")
        .attr("style", null);

    river = g.selectAll("polygon[smart_skema_type='river']")
        .attr("class", "river_sm")
        .attr("style", null);

    boundary = g.selectAll("polygon[smart_skema_type='boundary']")
        .attr("class", "ranch_boundary")
        .attr("style", null);

    boundary = g.selectAll("path[smart_skema_type='beacon']")
        .attr("style", null)
        .attr("class", "beacon");

    boundary = g.selectAll("path[smart_skema_type='mountain']")
        .attr("style", null)
        .attr("class", "mountain");

}


$(".chosen").chosen();

function add_complexStruMap_bnt() {
    var SVG_ELE = d3.select("#loadedSVG").selectAll("path,polygon,circle,rect,line,polyline");

    SVG_ELE.on('click', loadComplexStructureMap_mouseClick);

    function loadComplexStructureMap_mouseClick() {
        feat_id = "";
        feat_type = "";

        rrrs_list = [];
        d3.event.preventDefault();
        feat_id = $(this).attr('id');
        feat_type = $(this).attr('smart_skema_type');
        console.log("CLICK on id", feat_id);
        console.log("CLICK on smart_skema", feat_type);
        x = d3.event.pageX;
        y = d3.event.pageY;

        popup = document.getElementById("complexStructure_div");
        popup.style.visibility = "visible";
        $('#complexStructure_div').offset({
            top: y,
            left: x
        });

        $(document).on('keydown', function (e) {
            if (e.keyCode === 27) { // ESC
                $("#complexStructure_div").hide();
            }
        });
    }
}