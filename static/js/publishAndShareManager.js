
/*
    - function to push the final results to the Publish and Share Platform
    - files includes:
    - sketch map, base map and intermediate results in svg, json format
 */

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

/*
    - function to downloads all the projects from  Publish and Share Platform
    - files includes:
    - sketch map, base map and intermediate results in svg, json format
 */

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
        //var msg = resp.msg;
        $.alert({
            title: 'Project@PnS',
            content: 'Project has been Downloaded!'
        });

        toolTipManager.hideToolTip(event);
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
            }

            /*else if (json[i].fileBaseName == "vectorized_sketch_svg.svg"){

                sketchMapDisplayManager.vectorFromSVGURL("/" + json[i].filePath);

                dataManager.addData("vectorizedSketchMap", json[i].filePath);
                button_manager.enable_interactive_bnts();
            }else if (json[i].fileBaseName == "matches.json"){
                var matchesdata = json[i];
                dataManager.addData("matchingDict", matchesdata.fileContent);
                button_manager.enable_interactive_bnts();
            }*/
        }
    });


}
