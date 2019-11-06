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
var SVG_INTERACTION_MODE = -1
var SVG_INTERACTION_MODE_SKETCHMAP = 0 // for interaction on svg for sketch map
var SVG_INTERACTION_MODE_BASEMAP = 1 // for interaction  on SVG for base map
var toolTipCounter = 0;







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
        let ajaxParams = {
            url: '/uploadComplexSketchMap',
            type: 'POST',
            data: {
                fileName: fileName_full,
                imageContent: complextImageContent
            },
        };
        new communicator(ajaxParams).sendRequest({}, function(resp){
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
        });
    };
    $('#load_complexStructure_map_div').prop("style", "visibility: visible");

}


function toggle_interaction(event,ele) {
    /**
     *  get the matches for the interaction of alligned objects
     */
     getMapMatches();

    toolTipManager.movableToolTip(document.getElementById("tooltipdiv"));
    toolTipManager.displayToolTip(ele);

    svg_elements = d3.select("#sketchSVG").selectAll("path,polygon,circle,rect,line,polyline");
    //console.log("svg elements:", svg_elements);
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
    createProcessingRing();
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
    toolTipCounter= toolTipCounter+1;


    if(toolTipCounter==4){
        toolTipManager.hideToolTip();
    };

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
        deleteProcessingRing();
        //maximum image width should be 800 to fit in the svg without overflowing the viewport
        sketchMapDisplayManager.rasterFromURL("/" + json.imgPath, json.imgWidth, json.imgHeight);

        dataManager.addData("sketchMapImage", json.imgPath)
        button_manager.enable_interactive_bnts();

        sm_checked = new Boolean($("#SM_checked").prop("checked", true));
        orth_sm_checked = new Boolean($("#orthphoto_drawing_checked").prop("checked", true));
    };

    new communicator(ajaxParams).sendRequest(callbackParams, callback);

}


/**
 * loads the svg image from th image processed with Cristhian's code
 * @returns
 */

function processSketchMap(event,ele) {

    toolTipManager.movableToolTip(document.getElementById("tooltipdiv"));
    toolTipManager.displayToolTip(ele);

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

        toolTipManager.hideToolTip(event);
        dataManager.addData("vectorizedSketchMap", json.svgPath);
        button_manager.enable_interactive_bnts();
    };
    new communicator(ajaxParams).sendRequest(callbackParams, callback);
}


/*jQuery.fn.d3Click = function () {
    this.each(function (i, e) {
        var evt = new MouseEvent("click");
        e.dispatchEvent(evt);
    });
};*/

/*jQuery.fn.d3DblClick = function () {
    this.each(function (i, e) {
        var evt = new MouseEvent("dblclick");
        e.dispatchEvent(evt);
    });
};*/

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
/*function responseCallback(xhr) {

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

}*/


/*function responseCallback_degit(xhr) {
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
}*/


//from Salmans code for zooming and panning (and even rotating if that's necessary) in D3
/*
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
*/


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
function ladm_interaction_for_RRR(event,ele) {

    toolTipManager.displayToolTip(ele);
    toolTipManager.movableToolTip(document.getElementById("tooltipdiv"));
    deleteProcessingRing();
    ladm_interaction_for_RRR_mode();
}


/**
 * function activates spatial_query_activites
 */

function spatial_query_processor(event,ele){
    toolTipManager.movableToolTip(document.getElementById("tooltipdiv"));
    toolTipManager.displayToolTip(ele);

    spatial_query_processor_mode();
}

/**
 * function activates non-spatial_query_activites
 */
function nonSpatial_query_processor(event,ele){
    toolTipManager.movableToolTip(document.getElementById("tooltipdiv"));
    toolTipManager.displayToolTip(ele);

    deleteProcessingRing();
    nonSpatial_query_processor_mode();
}

/**
 * get the matching Dict.
 */
function getMapMatches() {

    let ajaxParams = {
            url: '/getMapMatches',
            type: 'POST',
            data: {

                     feat_id: "",
                    feat_type: ""
        }

    };
    new communicator(ajaxParams).sendRequest({}, function(resp){
        let json = JSON.parse(resp);
        mapmatches = json;
    });
}


$(function () {
    $('[data-toggle="tooltip"]').tooltip()
});


/**
 * removes the disable property of the svg tool buttons
 */
function enable_svg_edit_tool() {
    svgEditor.init('sketch')
/*
    $('#editor_div').prop("style", "visibility: visible");
    $('#svg_edit_bnts').prop("style", "visibility: visible");

    $('#ladm_interaction_bnts').prop("style", "visibility: hidden");
    $('#json_edit_bnts').prop("style", "visibility: hidden");


    popup = document.getElementById("popup_div");
    popup.style.visibility = "hidden";



    $('.bnt').prop("disabled", false);
    let svg = d3.select("#loadedSVG");

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
*/
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

/*function set_svg_features_color_digit() {
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
}*/

/**
 * function gives colors based on the defined classes in
 * mm_interaction_stype
 */
/*function set_svg_features_color() {

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

}*/


$(".chosen").chosen();

function add_complexStruMap_bnt(event) {


    toolTipManager.movableToolTip(document.getElementById("tooltipdiv"));
    toolTipManager.displayToolTip(event);

    var SVG_ELE = d3.select("#sketchSVG").selectAll("path,polygon,circle,rect,line,polyline");

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
/*

/!*
    - function to push the final results to the Publish and Share Platform
    - files includes:
    - sketch map, base map and intermediate results in svg, json format
 *!/

function save_PnS(event,ele){

    toolTipManager.movableToolTip(document.getElementById("tooltipdiv"));
    toolTipManager.displayToolTip(ele);

    //toolTipManager.movableToolTip(document.getElementById("projectNameInputDiv_for_PnS"));


    $('#projectNameInputDiv_for_PnS').prop("style", "visibility: visible");
    x = event.pageX;
    y = event.pageY;

    $('#projectNameInputDiv_for_PnS').offset({
        top: y+10,
        left: x-120
    });

    $(document).on('keydown', function (e) {
        if (e.keyCode === 27) { // ESC
            $("#projectNameInputDiv_for_PnS").hide();
        }
    });

}

function  saveProject_to_PnS(){

    var sub_project_name= document.getElementById("sub_project_name_input").value;
    $.alert({
        title: 'Info: saving data is in progress!',
        content: 'be patient the process will take some time...'
    });

    if (sub_project_name != undefined){
        let ajaxParams = {
            url: "/save_PnS",
            type:"POST",
            data:{
                sub_project_name :sub_project_name
            }
        };
        new communicator(ajaxParams).sendRequest({}, function(resp){
            sub_project_name = undefined;
            deleteProcessingRing();
            $.alert({
                title: 'Project@PnS',
                content: 'Project has been Uploaded!'
            });
            //$('#projectNameInputDiv_for_PnS').prop("style", "visibility: hidden");
        });

    }else{
        sub_project_name = undefined;
        $.alert({
            title: 'Project Name',
            content: 'Please enter project name'
        });
    }


}

/!*
    - function to downloads all the projects from  Publish and Share Platform
    - files includes:
    - sketch map, base map and intermediate results in svg, json format
 *!/

function download_projects_from_PnS(event,ele){


    toolTipManager.movableToolTip(document.getElementById("tooltipdiv"));
    toolTipManager.displayToolTip(ele);

    //console.log("here i am in the download function")
    ajaxParams = {
        url: '/get_sub_project_from_PnS',
        type:'POST',
        data:{
            feat_id : "",
        }
    };
   new communicator(ajaxParams).sendRequest({}, function(resp){
        $('#project_loader').empty();
        var resp = JSON.parse(resp);
        projects = resp.projects;

        for (i in projects){
            var pieces = projects[i].split(":");
            var lastName= pieces[pieces.length-1];
            console.log(lastName);
            $('#project_loader').append(
                "<div id='row' class='row'>"+
                "<button id='projects'>" +
                lastName +
                "</button>"+
                "</div>"
            );
            $('#row').prop("id", "row" + i);
            $('#row' + i).prop("style", "padding:2px");

            $('#row' + i).prop("style", "margin-top: 2px");
            $('#row' + i).prop("style", "margin-left: 2px");
            $('#projects').prop("id", "projects" + i);
            $('#projects' + i).prop("style", "margin-bottom: 2px");
            $('#projects' + i).prop("class", "btn btn-outline-info");
            $('#projects' + i).attr("onclick", "get_PnS_project_items("+ JSON.stringify(projects[i])+")");

        }


   });

         //$('#spatial_query_popup_div').empty();
    $('#PnS_download_projects_div').prop("style", "visibility: visible");
    x = event.pageX;
    y = event.pageY;
    $('#PnS_download_projects_div').offset({
        top: y,
        left: x
    });

    toolTipManager.movableToolTip(document.getElementById("PnS_download_projects_div"));

     $(document).on('keydown', function (e) {
        if (e.keyCode === 27) { // ESC
            $('#PnS_download_projects_div').hide();
            deleteProcessingRing();
        }
    });

}

function get_PnS_project_items(sub_project_name){
    $('#PnS_download_projects_div').prop("style", "visibility: hidden");
    var str = sub_project_name.split(":");
    var project_type= str[0];
    if(project_type == "plainSketchProject"){
        projectMode =0;
        sessionData.projectType = project_type;
    }if(project_type == "orthoSketchProject"){
        projectMode =1;
        sessionData.projectType = project_type;
    }
   createProcessingRing();
   let ajaxParams = {
       url : "/download_project_items_from_PnS",
       type : "POST",
       data : {
           sub_project_name : sub_project_name
       }
    
   };
   new communicator(ajaxParams).sendRequest({}, function(resp){
       deleteProcessingRing();
       var resp = JSON.parse(resp);
       var msg = resp.msg;
       $.alert({
           title: 'Project@PnS',
           content: 'Project has been Downloaded!'+msg
       });


       //display the downloaded files in the HTML divs
       render_downloaded_files_on_client(sub_project_name);

    });

}

var baseMapDisplayManager; //baseMapDisplayManagerInstance

function render_downloaded_files_on_client(sub_project_name) {
    createProcessingRing();

    console.log("recived json")
    let ajaxParams = {
        url : "/render_downloaded_files_on_client",
        type : "POST",
        data : {
            sub_project_name : sub_project_name
        }

    };
    new communicator(ajaxParams).sendRequest({}, function(resp){
        deleteProcessingRing();
        var json = JSON.parse(resp);
        var baseMapVectorData;
        //let width=799.9999999999999, height=525.6709567993614;

        for (i in json){

            if (json[i].fileBaseName == "input_sketch_image.png"){
                sketchMapDisplayManager.rasterFromURL("/" + json[i].filePath,json[i].width, json[i].height);

                dataManager.addData("sketchMapImage", json[i].filePath);
                button_manager.enable_interactive_bnts();
            }else if (json[i].fileBaseName == "vectorized_sketch_svg.svg"){

                sketchMapDisplayManager.vectorFromSVGURL("/" + json[i].filePath);

                dataManager.addData("vectorizedSketchMap", json[i].filePath);
                button_manager.enable_interactive_bnts();

            }else if (json[i].fileBaseName == "vector_base_map.geojson"){

               let sourceFormat = sessionData.projectType == "orthoSketchProject"? "tms": "openstreetmap";
                    let tilemap_format = sessionData.projectType == "orthoSketchProject"? TMS_TILE_MAP: OSM_TILE_MAP;
                    baseMapDisplayManager = baseMapDisplayManagerTemplate(tilemap_format);
                    let url = sourceFormat  == "tms"?
                        "./static/data/modified/tiles_256_raster/": "tile.openstreetmap.org/";
                    baseMapVectorData = json[i];
                    baseMapDisplayManager.tilesFromURL(url).then(
                        function(done){
                            baseMapDisplayManager.vectorFromGeoJSONContent(baseMapVectorData.fileContent) //"baseLayer")

                            dataManager.addData("baseMapVector", baseMapVectorData.fileContent);
                            button_manager.enable_interactive_bnts();
                        });
                    //baseMapDisplayManagerTemplate.vectorFromGeoJSONContent(json[i].fileContent) //"baseLayer")
            } else if (json[i].fileBaseName == "matches.json"){
                var matchesdata = json[i];
                dataManager.addData("matchingDict", matchesdata.fileContent);
                button_manager.enable_interactive_bnts();
            }
        }
    });


}
*/

function contactTeam(){
    $('#contact_div').prop("style", "visibility: visible");
}

$(document).on('keydown', function (e) {
    if (e.keyCode === 27) { // ESC
        $('#contact_div').hide();

    }
});


