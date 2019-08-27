var projectMode = -1;

const MODE_FREEHAND_SKETCH = 0;
const MODE_MAP_TRACE_SKETCH = 1;
const TMS_TILE_MAP = "tms"
const OSM_TILE_MAP = "osm"

/**
 * function to activate the project for sketch map
 *
 */
function loadProjectData(event, projectType, divID) {
    // HERE IS WHERE WE SHOULD CLEAR THE WHOLE SKETCH PANEL.
    // WE SHOULD THEREFORE HAVE AN ALERT PROMPT THAT THIS WILL
    // RESET IMAGE DATA IN THE SKETCH PANEL!
    /**
     * if (!alert("warning text here - ends with do you want to continue or something like that")) {
     *      return;
     * }
     */

    sessionData.setProjectType(projectType);

    x = event.pageX;
    y = event.pageY;

    $(divID).prop("style", "visibility: visible");

    $(divID).offset({
        top: y,
        left: x
    });

    if (sm_checked || mm_checked || ladm_checked || party_checked) {
        console.log("i am here now :)")
    }

    let ajaxParams = {
        url: '/setProjectType',
        type: 'POST'
    };

    new communicator(ajaxParams).sendRequest({}, function(resp){});

    $(document).on('keydown', function (e) {
        if (e.keyCode === 27) { // ESC
            $(divID).hide();
        }
    });

}

function loadSketchMapProject(event) {
    sm_checked = new Boolean($("#SM_checked").prop("checked", false));
    mm_checked = new Boolean($("#MM_checked").prop("checked", false));
    ladm_checked = new Boolean($("#LADM_checked").prop("checked", false));
    party_checked = new Boolean($("#Party_checked").prop("checked", false));

    projectMode = MODE_FREEHAND_SKETCH;
    let projectType = "plainSketchProject";
    let divID =  '#SM_project_div';

    loadProjectData(event, projectType, divID);
}

/**
 * function to activate the project for OrthoPhoto
 *
 */
function loadOrthophotoProject(event) {

    orth_sm_checked = new Boolean($("#orthphoto_drawing_checked").prop("checked", false));
    mm_checked1 = new Boolean($("#ortho_GCP_checked").prop("checked", false));
    orth_ladm_checked = new Boolean($("#ortho_LADM_checked").prop("checked", false));
    ortho_party_checked = new Boolean($("#ortho_Party_checked").prop("checked", false));

    projectMode = MODE_MAP_TRACE_SKETCH;
    let projectType = "orthoSketchProject";
    let divID =  '#orthophoto_project_div';

    loadProjectData(event, projectType, divID);
}

function freehand_sketchMap_project_mode(event){

    x = event.pageX;
    y= event.pageY;

    $('#SM_project_div').prop("style", "visibility: visible");

    $('#SM_project_div').offset({
        top: y,
        left: x
    });

    if(sm_checked||mm_checked||ladm_checked||party_checked){
        console.log ("i am here now :)")
    }

}