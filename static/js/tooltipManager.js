var toolTipManager = (function(){

    var tooltip = {
       // "Start":"",
        "SketchMapProjectInputbutton":"Select the files from your local computer to load them into SmartSkeMa.",
        "OrthoMapProjectInputbutton": "Select the files from your local computer to load them into SmartSkeMa.",
        "download_project_from_PnS":"Select the files previously stored in PnS to load them into SmartSkeMa.",

        //"Vectorize_Image_menu":"",
        "Vectorize_Image":"After the feature geometries are vectorized, use \'Geometry Editor\' to manually edit them and add Land Tenure Information.",
        "Editor":"Select an editor function and click on a feature in the input map to add, edit, delete, or move its geometry.",

        //"Add_Land_Tenure_Info":"",
        "ladm_interaction_for_RRR_bnt":"Right-click on a feature in the input map to add Rights, Responsibilities and Restrictions.",
        "nonSpatial_query_processor_bnt":"Click on a feature in the input map to retrieve its land tenure record.",

        "align_geometries":"Use information about aligned features and relations among them to add new spatial units to the geo-referenced map.",

        "Add_Spatial_Unit":"Select editor function \'visualize relations\' to highlight approximate locations of non-aligned features and \'draw geometries\' to add this information.",
        "toggle_interaction":"Click on a feature in the input map to visualize the aligned feature in geo-referenced map.",
        "spatial_query_processor_bnt":"Click on a feature in the input map to visualize the approximate location in geo-referenced map.",


        "save_PnS":"All data is saved on PnS Platform with the file name assigned in the PnS Project.",

        "download_alignedResult":"The alignment resuls are downloaded to your local computer as *.json file."
    }


    function displayToolTip(event){
        bnt_id = event.id;
        //console.log("clicked bnt",bnt_id);
        var tooltipdiv = document.getElementById("tooltipdiv");
        tooltipdiv.style.visibility = "visible";
        x = 900;
        y = 80;
        //console.log("x and Y",x, y);


        for (const [key, value] of Object.entries(tooltip)) {
            if(key == bnt_id){
                document.getElementById("tooltipcontents").innerText = null;
                var content = (`${value}`);
                //console.log("content",content);

                $( "#tooltipcontents" ).append(content);
            }else{

            }
        }

        $('#tooltipdiv').offset({
            top: y,
            left: x
        });
    }

    function movableToolTip(elmnt){
        //function dragElement(elmnt) {
            var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            if (document.getElementById(elmnt.id + "header")) {
                /* if present, the header is where you move the DIV from:*/
                document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
            } else {
                /* otherwise, move the DIV from anywhere inside the DIV:*/
                elmnt.onmousedown = dragMouseDown;
            }

            function dragMouseDown(e) {
                e = e || window.event;
                e.preventDefault();
                // get the mouse cursor position at startup:
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                // call a function whenever the cursor moves:
                document.onmousemove = elementDrag;
            }

            function elementDrag(e) {
                e = e || window.event;
                e.preventDefault();
                // calculate the new cursor position:
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                // set the element's new position:
                elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
                elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
            }

            function closeDragElement() {
                /* stop moving when mouse button is released:*/
                document.onmouseup = null;
                document.onmousemove = null;
            }
       // }
    }
    return{
        displayToolTip: displayToolTip,
        movableToolTip: movableToolTip,
    }


})();


$(document).on('keydown', function (e) {
    if (e.keyCode === 27) { // ESC
        $('#tooltipdiv').hide();

    }
});