

/**
 * function to create div for queries with ladm
 */

function nonSpatial_query_processor_mode() {
    console.log("in the NON-Spatial query processor MODE...");
    $('#edit_ladm_bnt').prop('disabled', false);
    $('#query_ladm_bnt').prop('disabled', false);


    //function reads matches file and puts in the mapMatches variable
    //getMapMatches();

    popup = document.getElementById("popup_div");
    popup.style.visibility = "hidden";


    var svg_elements = d3.select("#sketchSVG").selectAll("path,polygon,circle,rect,line,polyline");
    svg_elements.on('mouseover', nonSpatial_query_mouse_over);
    svg_elements.on('mouseout', nonSpatial_query_mouse_out);
    svg_elements.on('click', nonSpatial_query_result_popup);

}


//svg elelment interaction
function nonSpatial_query_mouse_over(d, i) {

    d3.select(this)
        .style("stroke", "#039BE5")
        .style("stroke-width", "30px");
}

function nonSpatial_query_mouse_out(d, i) {
    d3.select(this)
        .style("stroke", "#455A64")
        .style("stroke-width", "1px");
}

function nonSpatial_query_result_popup() {

    var feat_id = "";
    var feat_type = "";

    rrrs_list = [];
    d3.event.preventDefault();

    feat_id = $(this).attr('id');
    feat_type = $(this).attr('smart_skema_type');

    metric_id = mapmatches[feat_id];
    //console.log("id of matched object in base map:", metric_id);


    if ((feat_id != null) && (metric_id != null)) {
        mmelement = document.getElementById(metric_id);
        var rect = mmelement.getBoundingClientRect();
        //console.log(rect.top,rect.left);
        x = rect.left;
        y = rect.top;

    }

    if ((feat_id != null) && (metric_id == null)) {
        x = d3.event.pageX;
        y = d3.event.pageY;

    }
    if (feat_id == null) {
        $(query_popup).hide();
    }

    query_popup = document.getElementById("nonSpatial_query_popup_div");
    query_popup.style.visibility = "visible";
    $(query_popup).show();
    //empity query response table
    $('#nonSpatial_query_resp_div').empty();

    get_tenure_record(feat_id, feat_type);

    console.log(x, y);
    $('#nonSpatial_query_popup_div').offset({
        top: y,
        left: x
    });
}

$(document).on('keydown', function (e) {
    if (e.keyCode === 27) { // ESC
        $('#nonSpatial_query_popup_div').hide();
        deleteProcessingRing();
    }
});

function get_tenure_record(feat_id, feat_type) {
    let ajaxParams = {
        url: '/get_tenure_record',
        type: 'POST',
        data: {
            feat_id: feat_id,
            feat_type: feat_type
        }
    };
    new communicator(ajaxParams).sendRequest({}, function(resp){
        console.log("receiver Record", resp);
        if (resp != "None") {
            var json = "";
            json = JSON.parse(resp);
            //console.log("received record:",json);
            record = json;
            createTenureRecordTable(record);
            //create_record_table(record);
        } else {
            $('#nonSpatial_query_popup_div').hide();
        }

    });
/*
    $.ajax({
        url: '/get_tenure_record',
        type: 'GET',
        data: {
            feat_id: feat_id,
            feat_type: feat_type
        },
        contentType: 'text/plain',

        success: function (resp) {
            console.log("receiver Record", resp);
            if (resp != "None") {
                var json = "";
                json = JSON.parse(resp);
                //console.log("received record:",json);
                record = json;
                createTenureRecordTable(record);
                //create_record_table(record);
            } else {
                $('#nonSpatial_query_popup_div').hide();
            }

        }
    });*/
}

function createTenureRecordTable(record) {
    queryResult_div = document.getElementById("nonSpatial_query_resp_div");
    $(queryResult_div).empty();

    var table = document.createElement("table");
    table.setAttribute("width", "100%");
    table.setAttribute("border-collapse", "collapse");
    table.setAttribute("border", "1px lightslategray");
    table.setAttribute("word-wrap", "break-word-all");
    table.setAttribute("table-layout", "fixed");
    var th1 = document.createElement("th");
    th1.innerHTML = "KEY";
    var th2 = document.createElement("th");
    th2.innerHTML = "VALUE";
    var tr = table.insertRow(-1);
    tr.appendChild(th1);
    tr.appendChild(th2);

    for (var i = 0; i < record.length; i++) {
        for (var key in record[i]) {
            var row = table.insertRow(-1);
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            cell1.innerHTML = key;
            cell2.innerHTML = record[i][key];
        }
    }
    queryResult_div.appendChild(table);
}
