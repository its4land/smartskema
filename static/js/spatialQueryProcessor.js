
/**
 *
 * the function processing the spatial query and returns the relations
 * @type {string}
 */

var main_feat_id = "";
var main_feat_type = "";

function spatial_query_processor_mode() {

    console.log("in the spatial query processor MODE...");

    svg_elem = d3.select("#loadedSVG").selectAll("path,polygon,circle,rect,line,polyline");
    //console.log("svg elements:", svg_elements);
    svg_elem.on('mouseover', spatial_query_mouse_over);
    svg_elem.on('mouseout', spatial_query_mouse_out);
    svg_elem.on('click', get_spatial_query_popup);


    $(document).on('keydown', function (e) {
        if (e.keyCode === 27) { // ESC
            $('#').hide();
        }
    });
}

//svg elelment interaction
function spatial_query_mouse_over(d, i) {

    d3.select(this)
        .style("stroke", "#039BE5")
        .style("stroke-width", "30px");
}

function spatial_query_mouse_out(d, i) {
    d3.select(this)
        .style("stroke", "#455A64")
        .style("stroke-width", "10px");
}

function get_spatial_query_popup() {

    d3.event.preventDefault();
    main_feat_id = $(this).attr('id');
    main_feat_type = $(this).attr('smart_skema_type');

    console.log("here i am in the div");
    $('#featureID_spatial_query').text(main_feat_id);
    $('#featureType_spatial_query').text(main_feat_type);

    //$('#spatial_query_popup_div').empty();
    $('#spatial_query_popup_div').prop("style", "visibility: visible");

    x = d3.event.pageX;
    y = d3.event.pageY;

}

$('#spatial_query_popup_div').offset({
    top: y,
    left: x
});

/**
 * Function takes the id and get possible relations
 */

function qualitative_spatial_queries() {
    var lr_relations = "";
    var topo_relations = "";
    var relDist_relations= "";
    $('#leftRight_rels_div').empty();
    $('#lr_relation').empty();
    $('#topo_rels_div').empty();

    loc = document.getElementById("metricmapplaceholder");
    //createProcessingRing(loc);
    $.ajax({
        url: '/qualitative_spatial_queries',
        type: 'GET',
        data: {
            main_feat_id: main_feat_id,
            main_feat_type: main_feat_type

        },
        contentType: 'text/plain',
        success: function (resp) {
            var relations = JSON.parse(resp);

            //console.log(relations);
            lr_relations = relations.selected_feat_lr_rel;
            topo_relations = relations.selected_feat_rcc8_rel;
            relDist_relations = relations.selected_feat_relDist_rel;
            setTimeout(visualize_computed_rels(lr_relations,topo_relations,relDist_relations), 10);
        }
    });
}

/**
 * function visualies the relations got from the server side
 */
function visualize_computed_rels(lr_relations,topo_relations,relDist_relations) {
    deleteProcessingRing(loc);
    for (i in lr_relations) {

        $('#leftRight_rels_div').append(
            "<div id='lr_relation'>" +
            "<span style='padding-right: 10px'>" + lr_relations[i].obj_1 + "</span>" +
            "<span style='padding-right: 10px'>" + lr_relations[i].obj_2 + " : " + "</span>" +
            "<span style='padding-right: 10px'>" + lr_relations[i].relation + "</span>" +
            "</div>"
        );
        $('#lr_relation').prop("style", "padding:1px");
        $('#lr_relation').prop("id", "lr_relation" + i);
        $('#lr_relation' + i).prop("class", "btn btn-outline-info");
        $('#lr_relation' + i).prop("style", "padding:2px");


        $('#lr_relation' + i).attr("onclick", "get_qualitative_approximate_location(" + JSON.stringify(lr_relations[i]) + ")");

    }

    for (i in topo_relations) {
        $('#topo_rels_div').append(
            "<div id='topo_relations'>" +
            "<span style='padding-right: 10px;'>" + topo_relations[i].obj_1 + "</span>" +
            "<span style='padding-right: 10px;'>" + topo_relations[i].obj_2 + " : " + "</span>" +
            "<span style='padding-right: 10px;'>" + topo_relations[i].relation + "</span></div>"
        );
        $('#topo_relations').prop("style", "padding:1px");
        $('#topo_relations').prop("id", "topo_relations" + i);
        $('#topo_relations' + i).prop("class", "btn btn-outline-info");
        $('#topo_relations' + i).prop("style", "padding:2px");
        $('#topo_relations' + i).attr("onclick", "get_qualitative_approximate_location(" + JSON.stringify(topo_relations[i]) + ")");

    }

    for (i in relDist_relations) {

        $('#relDist_rels_div').append(
            "<div id='relDist_relations'>" +
            "<span style='padding-right: 10px;'>" + relDist_relations[i].obj_1 + "</span>" +
            "<span style='padding-right: 10px;'>" + relDist_relations[i].obj_2 + " : " + "</span>" + "" +
            "<span style='padding-right: 10px;'>" + relDist_relations[i].relation + "</span></div>"
        );
        $('#relDist_relations').prop("style", "padding:1px");
        $('#relDist_relations').prop("id", "relDist_relations" + i);
        $('#relDist_relations' + i).prop("class", "btn btn-outline-info");
        $('#relDist_relations' + i).prop("style", "padding:2px");
        $('#relDist_relations' + i).attr("onclick", "get_qualitative_approximate_location(" + JSON.stringify(relDist_relations[i]) + ")");

    }
}

/**
 * function takes the clicked relation to compute the approximate location
 * of the click object in the base map
 *
 */
function get_qualitative_approximate_location(rel) {
    console.log("single relation lr", rel);
    $.ajax({
        url: '/get_approx_location_lr',
        type: 'GET',
        data: {
            clicked_relations: JSON.stringify(rel)
        },
        contentType: 'text/plain',
        success: function (resp) {
            // var relations = JSON.parse(resp);

        }
    });

}