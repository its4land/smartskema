var svgEditor_status_Manager = (function () {

    var svgEditorButtons = {
        draw_geom: null,
        edit_geom: null,
        //join_endPoints: null,
        //split_endPoints: null,
        move_geom: null,
        delete_geom: null,
        //save_edits:null

    }

    function addStatus(name, indata) {
        svgEditorButtons[name] = indata;
    };

    var removeStatus = function (name) {
        svgEditorButtons[name] = null;

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
            //join_endPoints: ["draw_geom"],
            //split_endPoints: ["draw_geom"],
            move_geom: ["draw_geom", "edit_geom", "join_endPoints", "split_endPoints"],
            delete_geom: [],
            //save_edits: []
        },
        "orthoSketchProject": {
            draw_geom: ["edit_geom", "join_endPoints", "split_endPoints"],
            edit_geom: ["draw_geom"],
            //join_endPoints: ["draw_geom"],
            //split_endPoints: ["draw_geom"],
            move_geom: ["draw_geom", "edit_geom", "join_endPoints", "split_endPoints"],
            delete_geom: [],
            //save_edits: []
        },
        "both": {
            draw_geom: ["edit_geom"],
            edit_geom: ["draw_geom"],
            //join_endPoints: [],
            //split_endPoints: [],
            move_geom: [],
            delete_geom: ["draw_geom", "edit_geom"],
            //save_edits: []
        }
    };

    var svg_button_list = [
        "draw_geom",
        "edit_geom",
        //"join_endPoints",
        //"split_endPoints",
        "move_object",
        "delete_geom",
        //"save_geom"
    ];

    var enable_SVGEdit_bnts = function enable_SVGEdit_bnts() {
        svg_button_list.forEach((bnt) => {
            ele = document.getElementById(bnt);
            ele.style.pointerEvents = "auto";
        });
    }

    var disable_SVGEdit_bnts = function disable_SVGEdit_bnts() {
        Object.entries(svgEditor_status_Manager.getBntStatus()).forEach((status) => {
            if(status[1]){
                for (var bnt of svgEditorButtons_list["both"][status[0]]) {
                    ele = document.getElementById(bnt);
                    ele.style.pointerEvents = "none";
                }
            }
        });
    }

    return {
        disable_SVGEdit_bnts: disable_SVGEdit_bnts,
        enable_SVGEdit_bnts: enable_SVGEdit_bnts
    }
})();


var svg_editor_button_manager = (function () {
    svg_editor_buttons_status = {
            draw_geom: true,
            edit_geom: true,
            join_endPoints: false,
            split_endPoints: false,
            move_geom: false,
            delete_geom: false,
            save_edits: false
    };

    var svg_editor_button_list = [
        "draw_geom",
        "edit_geom",
       // "join_endPoints",
       // "split_endPoints",
        "move_object",
        "delete_geom",
       // "save_geom"
    ];

    var active_btns = function(){
        const activeBtns = Object.entries(svg_editor_buttons_status)
                .map(([key, val]) => val ? key : null)
                .reduce(function(accum, cur, i, arr){
                            if (cur) accum.push(cur);
                            return accum;
                        }, []);

        return activeBtns;
    }

    var inactive_btns = function(){
        const activeBtns = Object.entries(svg_editor_buttons_status)
                .map(([key, val]) => val ? null : key)
                .reduce(function(accum, cur, i, arr){
                            if (cur) accum.push(cur);
                            return accum;
                        }, []);

        return activeBtns;
    }

    var enable_btn = function(btn) {
        ele = document.getElementById(btn);
        ele.style.pointerEvents = "auto";
        svg_editor_buttons_status[btn] = true;
    }

    var enable_btns = function() {
        enable_btns_except();
    }

    var enable_btns_except = function() {
        let args = [...arguments];
        inactive_btns().forEach(
            function(e, i, arr) {
                if (!args.includes(e)){
                    enable_btn(e);
                }
            }
        );
    }

    var disable_btn = function(btn) {
        ele = document.getElementById(btn);
        ele.style.pointerEvents = "none";
        svg_editor_buttons_status[btn] = false;
    }

    var disable_btns = function() {
        disable_btns_except();
    }

    var disable_btns_except = function() {
        let args = [...arguments];
        active_btns().forEach(
            function(e, i, arr) {
                if (!args.includes(e)){
                    disable_btn(e);
                }
            }
        );
    }

    return {
        active_btns: active_btns,
        inactive_btns: inactive_btns,
        enable_btn: enable_btn,
        enable_btns: enable_btns,
        enable_btns_except: enable_btns_except,
        disable_btn: disable_btn,
        disable_btns: disable_btns,
        disable_btns_except: disable_btns_except
    }
})();