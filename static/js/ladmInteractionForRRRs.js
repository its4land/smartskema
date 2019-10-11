var rrrs_list = [];
var ownership_type = [];
var party = [];
var feat_id = "";
var feat_type= "";


/**
 *  * @param element
 *  function loads the partyjson file
 *  and pass it to gloable variable PartyJson
 *  in the #getparty function we pass this a data
 */
function loadPartyFile(element) {
    partyfile = document.getElementById('PartyInputbutton').files[0];
    loadedPartyFile = partyfile.name;
    fileReader = new FileReader();
    //console.log(loadedPartyFile);
    fileReader.readAsText(partyfile);
    fileReader.onload = function () {
        partyJson = JSON.parse(fileReader.result);
        let ajaxParams = {
            url: '/postParty',
            type: 'POST',
            data: {
                loadedPartyFile: loadedPartyFile,
                partyJson: JSON.stringify(partyJson)
            }
        };
        new communicator(ajaxParams).sendRequest({}, function(resp){
            var party = JSON.parse(resp)
        });
        party_checked = new Boolean($("#Party_checked").prop("checked", true));

    };

}

function ortho_loadPartyFile(element) {
    partyfile = document.getElementById('orth_PartyInputbutton').files[0];
    loadedPartyFile = partyfile.name;
    fileReader = new FileReader();

    fileReader.readAsText(partyfile);
    fileReader.onload = function () {
        partyJson = JSON.parse(fileReader.result);

        let ajaxParams = {
            url: '/postParty',
            type: 'POST',
            data: {
                loadedPartyFile: loadedPartyFile,
                partyJson: JSON.stringify(partyJson)
            }
        };
        new communicator(ajaxParams).sendRequest({}, function(resp){
            var party = JSON.parse(resp)
        });
        ortho_party_checked = new Boolean($("#ortho_Party_checked").prop("checked", true));
    };

}


/**
 * the function loads and passes the ladm file path to the python code
 * @param element
 */

function loadLADMFile(element) {
    fileList = document.getElementById('LADMInputbutton').files;
    $("#SMLinks").show();
    $("#MMLinks").hide();
    ladm_checked = new Boolean($("#LADM_checked").prop("checked", true));

    for (var i = 0; i < fileList.length; i++) {
        read_LADM_file_contants(fileList[i])
    }
}


function ortho_loadLADMFile(element) {
    fileList = document.getElementById('ortho_LADMInputbutton').files;
    $("#SMLinks").show();
    $("#MMLinks").hide();
    orth_ladm_checked = new Boolean($("#ortho_LADM_checked").prop("checked", true));

    for (var i = 0; i < fileList.length; i++) {
        read_LADM_file_contants(fileList[i])
    }
}


//var loaded_ladm_path = "";

function read_LADM_file_contants(ladmFile) {
    LDM_fileName_full = ladmFile.name;

    var reader = new FileReader();
    reader.readAsText(ladmFile);
    reader.onload = function (e) {
        LDMContent = this.result;
        //console.log("here owlContent....",LDMContent);
        var fName = LDM_fileName_full.split(".");
        var fileName = fName[0];
        var extension = fName[1];
        if (extension == "owl") {

            let ajaxParams = {
                url: '/postLADM',
                type: 'POST',
                data: {
                    LDMFileName: LDM_fileName_full,
                    LDMContent: LDMContent
                }
            };
            new communicator(ajaxParams).sendRequest({}, function(resp){});

        }else{
            $.alert({
                title: 'Info: Wrong File',
                content: 'Please load OWL file...'
            });
        }

    }
}

/**
 * svg interact to extract domain model
 */
function ladm_interaction_for_RRR_mode() {
    console.log("i am in the LADM interaction MODE....");
    $('#edit_ladm_bnt').prop('disabled', true);
    $('#query_ladm_bnt').prop('disabled', false);

    var svg_elements = d3.select("#sketchSVG").selectAll("path,polygon,circle,rect,line,polyline");

    svg_elements.on('mouseover', ladm_mouse_over);
    svg_elements.on('mouseout', ladm_mouse_out);
    svg_elements.on('contextmenu', ladm_display_popup);
}


//svg elelment interaction
function ladm_mouse_over(d, i) {

    d3.select(this)
        .style("stroke", "#039BE5")
        .style("stroke-width", "30px");
}

function ladm_mouse_out(d, i) {
    d3.select(this)
        .style("stroke", "#455A64")
        .style("stroke-width", "1px");
}



function ladm_display_popup() {
    rrrs_list = [];
    d3.event.preventDefault();

    feat_id = $(this).attr('id');
    feat_type = $(this).attr('smart_skema_type');

    x = d3.event.pageX;
    y = d3.event.pageY;

    get_popup_contents();


    ladm_rrrs_popup_div = document.getElementById("ladm_rrrs_popup_div");
    ladm_rrrs_popup_div.style.visibility = "visible";

    $(ladm_rrrs_popup_div).show();

    $('#ladm_rrrs_popup_div').offset({
        top: y,
        left: x
    });

    $('#party_selector').change(function () {
        prt = $('#party_selector').find(':selected').text();
        //console.log("here is selected party",prt);
        if (prt != "Select Party...") {
            console.log("party. here you go ..:", prt);
            party = prt;
        }
    });

    $('#ownership_selector').change(function () {
        ownership = $('#ownership_selector').find(':selected').text();
        if (ownership != "Select Ownership...") {
            console.log("ownership. here you go ..:", ownership);
            ownership_type = ownership;
        }
    });

    $('#other_rrrs_selector').change(function () {
        rights = $('#other_rrrs_selector').find(':selected').text();
        if (rights != "Select Other RRRs...") {
            if (rrrs_list.indexOf(rights) === -1) {
                rrrs_list.push(rights);
            }
            console.log("other rrrs. here you go ..:", rrrs_list);
        }
    });

}

$(document).on('keydown', function (e) {
    if (e.keyCode === 27) { // ESC
        $('#ladm_rrrs_popup_div').hide();
        deleteProcessingRing();
    }
});

function get_popup_contents() {
    //get the rights and create selection options
    rights = get_DM_rights();
    //get parties
    parties = get_DM_parties();
     // get all RRRs
    rrrs = get_RRRs();

}

/**
 the function communites with Domain Model and extract ownership and rights
 **/

function get_DM_rights() {
    rights_list = [];
    var resp = "";

    let ajaxParams = {
        url: '/get_domain_model_ownerships',
        type: 'POST',
        data: {
            LDMFileName: LDM_fileName_full,
            feat_type: feat_type
        }
    };
    new communicator(ajaxParams).sendRequest({}, function(resp){
        rights_list.push("Select Ownership...");
        rights_list.push("Rest Calves");

        var json_rights = JSON.parse(resp);
        for (var i = 0; i < json_rights.length; i++) {
            rights_list.push(json_rights[i].item);
        }
        generate_rights_options(rights_list);
    });


    /*//pass the features_type on click
    $.ajax({
        url: '/get_domain_model_ownerships',
        type: 'GET',
        data: {
            LDMFileName: LDM_fileName_full,
            feat_type: feat_type

        },
        contentType: 'text/plain',

        success: function (resp) {

            rights_list.push("Select Ownership...");
            rights_list.push("Rest Calves");

            var json_rights = JSON.parse(resp);
            for (var i = 0; i < json_rights.length; i++) {
                rights_list.push(json_rights[i].item);
            }
            generate_rights_options(rights_list);
        }
    });*/
    return rights_list;
}


/**
 - function gets party information from the
 **/
function get_DM_parties() {
    party_list = [];
    resp = "";

    let ajaxParams = {
    url: '/getParty',
        type: 'POST',
        data: {
            loadedPartyFile: loadedPartyFile,
            partyJson: JSON.stringify(partyJson)
        }
    };
    new communicator(ajaxParams).sendRequest({}, function(resp){
         party_list.push("Select Party...");
            var json_party = JSON.parse(resp);

            for (var i = 0; i < json_party.length; i++) {
                party_list.push(json_party[i]);
            }
            generate_parties_option(party_list);
    });

    return party_list;
}

/**
 - function gets other RRRs for all features from the
 **/
function get_RRRs() {
    rrr_list = [];
    resp = "";

    let ajaxParams = {
        url: '/get_domain_model_rrrs',
        type: 'POST',
        data: {
            LDMFileName: LDM_fileName_full
        }
    };
    new communicator(ajaxParams).sendRequest({}, function(resp){
        rrr_list.push("Select Other RRRs...");
        rrr_list.push("Pastures Depleted Ranch1");

        var json_rrr = JSON.parse(resp);

        for (var i = 0; i < json_rrr.length; i++) {
            rrr_list.push(json_rrr[i].item);
        }
        generate_rrrs_option(rrr_list);

    });
    return rrr_list;
}

/**
 *  the function generates Ownership options in the div
 *  @param rights
 */

function generate_rights_options(rights) {
    var option;
    ownership_selector = document.getElementById("ownership_selector");
    ownership_selector.innerHTML = null;
    for (var i = 0; i < rights.length; i++) {

        option = document.createElement('option');
        option.setAttribute("id", rights[i]);

        option.setAttribute("value", rights[i]);
        option.textContent = rights[i];

        ownership_selector.appendChild(option);
    }

}

/**
 *  the function generates party option in the div
 *  @param parties
 */

function generate_parties_option(parties) {
    var option;

    party_selector = document.getElementById("party_selector");
    party_selector.innerHTML = null;
    for (var i = 0; i < parties.length; i++) {

        option = document.createElement('option');
        option.setAttribute("id", parties[i]);
        option.setAttribute("value", parties[i]);
        option.textContent = parties[i];
        party_selector.appendChild(option);
    }

}


/**
 *  the function generates rrrs option in the div
 *
 * @param rrr_list
 */

function generate_rrrs_option(rrr_list) {
    var option;


    other_rrrs_selector = document.getElementById("other_rrrs_selector");
    other_rrrs_selector.innerHTML = null;
    for (var i = 0; i < rrr_list.length; i++) {

        option = document.createElement('option');
        option.setAttribute("id", rrr_list[i]);
        option.setAttribute("value", rrr_list[i]);
        option.textContent = rrr_list[i];
        other_rrrs_selector.appendChild(option);
    }
}


/**
 - extract ownership Rights
 - and ownership name
 - and send it back to python for generating ownership and rights json
 **/
function add_land_tenure_record() {

    $.ajax({
        url: '/add_tenure_record',
        type: 'GET',
        data: {
            spatialSource: fileName,
            feat_id: feat_id,
            feat_type: feat_type,
            ownership_type: ownership_type,
            party: party,
            rrrs_list: JSON.stringify(rrrs_list)
        },
        contentType: 'text/plain',
        success: function (resp) {
            $.alert({
                title: 'Info: Tenure Information!',
                content: 'The land tenure record is added in the list'
            });
            rrrs_list = [];
        }
    });
}

/**
 - extract ownership Rights
 - and ownership name
 - and send it back to python for generating ownership and rights json
 **/
function save_land_tenure_record() {

    let ajaxParams = {
        url: '/save_tenure_record',
        type: 'POST',
        data: {
            feat_id: feat_id
        }
    };
    new communicator(ajaxParams).sendRequest({}, function(resp){
        var json = resp;
        $.alert({
            title: 'Info: Tenure Information!',
            content: 'The land tenure record is Saved as a *.json file'
        });

        $('#ladm_rrrs_popup_div').hide();
    });
}
