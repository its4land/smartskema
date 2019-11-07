var dataManager = (function () {

    var loadedData = {
        sketchMapImage: null,
        baseMapVector: null,
        basemapTiles: null,
        vectorizedSketchMap: null,
        ladmData: null,
        parties: null,
        matchingDict: null,
        tenureRecord:null
    }

    function addData(name, indata) {
        loadedData[name] = indata
    };
    var removeData = function (name) {
        loadedData[name] = null

    };
    var getData = function (name) {
        return loadedData[name];
    };
    var getDataStatus = function () {
        const dataStatus = Object.fromEntries(
            Object.entries(loadedData)
                .map(([key, val]) => [key, val == null ? false : true])
    );
        return dataStatus;
    };



    return {
        addData: addData,
        removeData: removeData,
        getData: getData,
        getDataStatus: getDataStatus
    }
})();





/*Object.entries(dataManager.getDataStatus()).forEach((status) => {
        console.log("status",status);
        if(status[1]){
                for (var bnt of UIStateMap[sessionData.projectType][status[0]]) {
                    enable_interactive_buttons(bnt);
                }
            }
    });*/

/*function enable_interactive_buttons(bnt) {
    document.getElementById("bnt").disabled = true;
}*/


var button_manager = (function (){
    console.log("I AM HERE");
    UIStateMap = {
        "plainSketchProject": {
            sketchMapImage: ["Vectorize_Image_menu", "Vectorize_Image"],
            baseMapVector: ["Vectorize_Image_menu", "Vectorize_Image"],
            basemapTiles: ["Vectorize_Image_menu", "Vectorize_Image"],
            vectorizedSketchMap: ["Editor","align_geometries"],
            ladmData: ["Vectorize_Image_menu", "Vectorize_Image"],
            parties: ["Vectorize_Image_menu", "Vectorize_Image"],
            matchingDict: ["Add_Land_Tenure_Info.","ladm_interaction_for_RRR_bnt","Add_Spatial_Unit","toggle_interaction_bnt","spatial_query_processor_bnt","save_PnS","download_alignedResult"],
            tenureRecord:["Add_Land_Tenure_Info.","nonSpatial_query_processor_bnt"]
        },
        "orthoSketchProject": {
            sketchMapImage: ["Vectorize_Image_menu", "Vectorize_Image"],
            baseMapVector: ["Vectorize_Image_menu", "Vectorize_Image"],
            basemapTiles: ["Vectorize_Image_menu", "Vectorize_Image"],
            vectorizedSketchMap: ["Editor","Add_Land_Tenure_Info.","ladm_interaction_for_RRR_bnt","align_geometries"],
            ladmData: ["Vectorize_Image_menu", "Vectorize_Image"],
            parties: ["Vectorize_Image_menu", "Vectorize_Image"],
            matchingDict: ["Add_Land_Tenure_Info.","ladm_interaction_for_RRR_bnt","Add_Spatial_Unit","toggle_interaction_bnt","spatial_query_processor_bnt","save_PnS","download_alignedResult"],
            tenureRecord:["Add_Land_Tenure_Info.","nonSpatial_query_processor_bnt"]
        }
    };

    var button_list = [
        //"Vectorize_Image_menu",
        //"Vectorize_Image",
        //"Editor",
        "Add_Land_Tenure_Info.",
        "ladm_interaction_for_RRR_bnt",
        "nonSpatial_query_processor_bnt",
        "align_geometries",
        //"Add_Spatial_Unit",
        //"spatial_query_processor_bnt",
        //"toggle_interaction_bnt",
        "save_PnS",
        "download_alignedResult"
    ];

    var disable_all_interavtive_bnts= function disable_all_interavtive_bnts(){
        button_list.forEach((bnt) => {
            el = document.getElementById(bnt);
            el.style.color = 'slategrey';
            el.style.pointerEvents = "none";

        });
    }

   var enable_interactive_bnts =  function enable_interactive_bnts(){
        Object.entries(dataManager.getDataStatus()).forEach((status) => {

        if(status[1]){
            for (var bnt of UIStateMap[sessionData.projectType][status[0]]) {
                el = document.getElementById(bnt);

                if (el.id == "Vectorize_Image_menu" || el.id =="Add_Land_Tenure_Info." ||
                    el.id == "align_geometries" || el.id=="Add_Spatial_Unit" ||
                    el.id =="save_PnS" || el.id== "download_alignedResult"){

                    el.style.color = "white";
                    el.style.pointerEvents = "auto";
                }
                else{

                    el.style.color = "black";
                    el.style.pointerEvents = "auto";
                }

            }
        }
    });
    }


    return {
        disable_all_interavtive_bnts: disable_all_interavtive_bnts,
        enable_interactive_bnts: enable_interactive_bnts,
    }

})();

