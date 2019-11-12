
var svgEditor_status_Manager = (function () {

    var svgEditorButtons = {
        draw_geom: null,
        edit_geom: null,
        join_endPoints: null,
        split_endPoints: null,
        move_geom: null,
        delete_geom: null,
        save_edits:null

    }

    function addStatus(name, indata) {
        svgEditorButtons[name] = indata
    };
    var removeStatus = function (name) {
        svgEditorButtons[name] = null

    };
    var getBntData = function (name) {
        return svgEditorButtons[name];
    };
    var getBntStatus = function () {
        const dataStatus = Object.fromEntries(
            Object.entries(svgEditorButtons)
                .map(([key, val]) => [key, val == null ? false : true])
    );
        return dataStatus;
    };

    return {
        addStatus: addStatus,
        removeStatus: removeStatus,
        getBntData: getBntData,
        getBntStatus: getBntStatus
    }
})();



var svgEditor_button_Manager = (function () {
    svgEditorButtons_list = {
        "plainSketchProject": {
            draw_geom: ["edit_geom", "join_endPoints", "split_endPoints"],
            edit_geom: ["draw_geom"],
            join_endPoints: ["draw_geom"],
            split_endPoints: ["draw_geom"],
            move_geom: ["draw_geom", "edit_geom", "join_endPoints", "split_endPoints"],
            delete_geom: [],
            save_edits: []
        },
        "orthoSketchProject": {
            draw_geom: ["edit_geom", "join_endPoints", "split_endPoints"],
            edit_geom: ["draw_geom"],
            join_endPoints: ["draw_geom"],
            split_endPoints: ["draw_geom"],
            move_geom: ["draw_geom", "edit_geom", "join_endPoints", "split_endPoints"],
            delete_geom: [],
            save_edits: []
        }


    };
    var svg_button_list = [
        "draw_geom",
        "edit_geom",
        "join_endPoints",
        "split_endPoints",
        "move_object",
        "delete_geom",
        "save_geom"
    ];

    var enable_SVGEdit_bnts= function enable_SVGEdit_bnts(){
        svg_button_list.forEach((bnt) => {
            ele = document.getElementById(bnt);
            ele.style.pointerEvents = "auto";

    });
    }


    var disable_SVGEdit_bnts =  function disable_SVGEdit_bnts(){
        Object.entries(svgEditor_status_Manager.getBntStatus()).forEach((status) => {

            if(status[1]){
            for (var bnt of svgEditorButtons_list[sessionData.projectType][status[0]]) {
                ele = document.getElementById(bnt);

                ele.style.pointerEvents = "none";
            }
        }
    });
    }

    return {
        disable_SVGEdit_bnts: disable_SVGEdit_bnts,
        enable_SVGEdit_bnts:enable_SVGEdit_bnts

    }

})();