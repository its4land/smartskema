

var rrrs_list = [];
var ownership_type = [];
var party = [];
var feat_id = "";
var feat_type= "";

/**
 * svg interact to extract domain model
 */
function ladm_interaction_for_RRR_mode() {
    console.log("i am in the LADM interaction MODE....");
    $('#edit_ladm_bnt').prop('disabled', true);
    $('#query_ladm_bnt').prop('disabled', false);

    var svg_elements = d3.select("#loadedSVG").selectAll("path,polygon,circle,rect,line,polyline");

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
    //pass the features_type on click
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
    });
    return rights_list;
}


/**
 - function gets party information from the
 **/
function get_DM_parties() {
    party_list = [];
    resp = "";

    $.ajax({
        url: '/getParty',
        type: 'GET',
        data: {
            loadedPartyFile: loadedPartyFile,
            partyJson: JSON.stringify(partyJson)
        },
        contentType: 'text/plain',
        success: function (resp) {
            party_list.push("Select Party...");
            var json_party = JSON.parse(resp);

            for (var i = 0; i < json_party.length; i++) {
                party_list.push(json_party[i]);
            }
            generate_parties_option(party_list);
        }
    });
    return party_list;
}

/**
 - function gets other RRRs for all features from the
 **/
function get_RRRs() {
    rrr_list = [];
    resp = "";
    //pass the features_type on click
    $.ajax({
        url: '/get_domain_model_rrrs',
        type: 'GET',
        data: {
            LDMFileName: LDM_fileName_full
        },
        contentType: 'text/plain',
        success: function (resp) {
            rrr_list.push("Select Other RRRs...");
            rrr_list.push("Pastures Depleted Ranch1");

            var json_rrr = JSON.parse(resp);

            for (var i = 0; i < json_rrr.length; i++) {
                rrr_list.push(json_rrr[i].item);
            }
            generate_rrrs_option(rrr_list);
        }
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

    $.ajax({
        url: '/save_tenure_record',
        type: 'GET',
        data: {
            feat_id: feat_id
        },
        contentType: 'text/plain',
        success: function (resp) {
            var json = resp;
            $.alert({
                title: 'Info: Tenure Information!',
                content: 'The land tenure record is Saved as a *.json file'
            });
            $('#ladm_rrrs_popup_div').hide();
        }
    });

}
