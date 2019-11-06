var projectMode = -1;

const MODE_FREEHAND_SKETCH = 0;
const MODE_MAP_TRACE_SKETCH = 1;
const TMS_TILE_MAP = "tms";
const OSM_TILE_MAP = "osm";

/**
 * Set the project type and load the appropriate datasets
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
        top: y+10,
        left: x
    });

    if (sm_checked || mm_checked || ladm_checked || party_checked) {
        //console.log("i am here now :)")
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


function loadSketchMapProject(event,ele) {

    toolTipManager.movableToolTip(document.getElementById("tooltipdiv"));
    toolTipManager.displayToolTip(ele);

    toolTipManager.movableToolTip(document.getElementById("SM_project_div"));

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
function loadOrthophotoProject(event, ele) {


    toolTipManager.movableToolTip(document.getElementById("tooltipdiv"));
    toolTipManager.displayToolTip(ele);

    toolTipManager.movableToolTip(document.getElementById("orthophoto_project_div"));

    orth_sm_checked = new Boolean($("#orthphoto_drawing_checked").prop("checked", false));
    mm_checked1 = new Boolean($("#ortho_GCP_checked").prop("checked", false));
    orth_ladm_checked = new Boolean($("#ortho_LADM_checked").prop("checked", false));
    ortho_party_checked = new Boolean($("#ortho_Party_checked").prop("checked", false));

    projectMode = MODE_MAP_TRACE_SKETCH;
    let projectType = "orthoSketchProject";
    let divID =  '#orthophoto_project_div';

    loadProjectData(event, projectType, divID);
}


/**
 * For now we keep the session data in an encapsulated module object.
 * The session ID never changes unless we reload but the project type may change
 * upon selecting a new project type. In which case we should be able to set a new
 * project type.

var sessionData = (function(){
    var sessID = (new URL(document.location)).searchParams.get("sessID");
    var projectType;

    return {
        sessID: sessID,
        projectType: projectType,
        setProjectType: function(projectType){this.projectType = projectType}
    }
})();
 */

/**
 * For now we keep the session data in an encapsulated module object.
 * The session ID never changes unless we reload but the project type may change
 * upon selecting a new project type. In which case we should be able to set a new
 * project type.
 */
var sessionData = (function(){

    var projectType;
    var sessionData =  {
        projectType: projectType,
        setProjectType: function(projectType){
            this.projectType = projectType
        }
    }

    $.ajax({
        url: '/getSessionID',
        type: 'GET',
        success: function (resp) {
            button_manager.disable_all_interavtive_bnts();
            sessionData.sessID = resp;

        }
    });

    return sessionData
})();


/**
 * create a new communicator object with parameters for the ajax request.
 * Return a sendRequest method which expects a params object from which to
 * get its callback function's parameters and the callback function. The
 * function also displays and hides the processing indicator.
 */
var communicator = function(ajaxParams) {

    return (function(){
        return {
            sendRequest: function(callbackParams, callback) {
                createProcessingRing();

                if (ajaxParams.data){
                    ajaxParams.data.sessID = sessionData.sessID
                    ajaxParams.data.projectType = sessionData.projectType
                }else{
                    ajaxParams.data = {
                        sessID: sessionData.sessID,
                        projectType: sessionData.projectType
                    }
                }
                $.ajax({
                    ...ajaxParams,
                    success: function (resp) {
                        callback.call(callbackParams, resp);
                        deleteProcessingRing();
                    }
                });
            }
        }
    })();
}

/**
 * open first file in specified in event and add the file name to the given params object.
 * then invoke the supplied callback function, onloadCallback, with javascript's call()
 * passing params as the 'this' object for the callback's context and the file contents as
 * the ordinary parameter.
 */
var openReadFromFile = function(inputElement, onloadCallback, params, readFormat) {
    var inFile = inputElement.files[0];
    var reader = new FileReader();
    Object.assign(params, {fileName: inFile.name});
    if (readFormat == "text")
        reader.readAsText(inFile);
    else if (readFormat == "buffered")
        reader.readAsArrayBuffer(inFile);
    else
        reader.readAsDataURL(inFile);

    reader.onload = function(e) {
        onloadCallback.call(params, e.target.result);
    }
}