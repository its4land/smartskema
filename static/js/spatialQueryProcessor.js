
/**
 *
 * the function processing the spatial query and returns the relations
 * @type {string}
 */

var main_feat_id = "";
var main_feat_type = "";
var vector13;
var vector14;
var vector15;

function spatial_query_processor_mode() {
    createProcessingRing();
    console.log("in the spatial query processor MODE...");

    svg_elem = d3.select("#sketchSVG").selectAll("path,polygon,circle,rect,line,polyline");
    //console.log("svg elements:", svg_elements);
    svg_elem.on('mouseover', spatial_query_mouse_over);
    svg_elem.on('mouseout', spatial_query_mouse_out);
    svg_elem.on('click', get_spatial_query_popup);


    $(document).on('keydown', function (e) {
        if (e.keyCode === 27) { // ESC
            $('#spatial_query_popup_div').hide();
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
    console.log("x, y :",x, y);

    $('#spatial_query_popup_div').offset({
        top: y,
        left: x
    });
    deleteProcessingRing();

}


/**
 * Function takes the id and get possible relations
 */

function qualitative_spatial_queries() {
    deleteProcessingRing();
    var lr_relations = "";
    var topo_relations = "";
    var relDist_relations= "";
    $('#leftRight_rels_div').empty();
    $('#relDist_rels_div').empty();
    $('#topo_rels_div').empty();

    let ajaxParams = {
        url: '/qualitative_spatial_queries',
        type: 'POST',
        data: {
            main_feat_id: main_feat_id,
            main_feat_type: main_feat_type

        }
    };
    new communicator(ajaxParams).sendRequest({}, function(resp){
        var relations = JSON.parse(resp);

        //console.log(relations);
        lr_relations = relations.selected_feat_lr_rel;
        topo_relations = relations.selected_feat_rcc8_rel;
        relDist_relations = relations.selected_feat_relDist_rel;
        setTimeout(visualize_computed_rels(lr_relations,topo_relations,relDist_relations), 10);

    });

    //createProcessingRing(loc);
   /* $.ajax({
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
    });*/
}

/**
 * function visualies the relations got from the server side
 */
function visualize_computed_rels(lr_relations,topo_relations,relDist_relations) {
    //createProcessingRing();
    deleteProcessingRing();

    for (i in lr_relations) {
        var presentation = "left_right";
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


        $('#lr_relation' + i).attr("onclick", "get_qualitative_approximate_location(" + JSON.stringify(presentation)+','+JSON.stringify(lr_relations[i]) + ")");

    }

    for (i in topo_relations) {
        var presentation = "RCC8";
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
        $('#topo_relations' + i).attr("onclick", "get_qualitative_approximate_location(" +JSON.stringify(presentation)+','+ JSON.stringify(topo_relations[i]) + ")");

    }

    for (i in relDist_relations) {
        var presentation = "REL_DIST";
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
        $('#relDist_relations' + i).attr("onclick", "get_qualitative_approximate_location(" +JSON.stringify(presentation)+','+ JSON.stringify(relDist_relations[i]) + ")");

    }
}

/**
 * function takes the clicked relation to compute the approximate location
 * of the click object in the base map
 *
 */
function get_qualitative_approximate_location(rep, rel) {
    deleteProcessingRing();
    let ajaxParams = {
        url: '/get_approx_location_from_relations',
        type: 'POST',
        data: {
            clicked_relations: JSON.stringify({representation:rep, relation: rel, relatum: mapmatches[rel["obj_1"]], main_feat_id: main_feat_id,
                main_feat_type: main_feat_type})
        }
    };
    new communicator(ajaxParams).sendRequest({}, function(resp){
        tilesAsjson_and_type = JSON.parse(resp);
        console.log("tilesAsjson_and_type...:",tilesAsjson_and_type);

        tilesType = tilesAsjson_and_type.geoJson_tiles_type;
        tilesAsjson = tilesAsjson_and_type.geoJson_tiles;
        deleteProcessingRing();
        //loadGeojsonAsSVG();
        load_computed_tiles_as_svg(tilesType,tilesAsjson);

    });

   /* $.ajax({
        url: '/get_approx_location_from_relations',
        type: 'GET',
        data: {
            clicked_relations: JSON.stringify({representation:rep, relation: rel, relatum: mapmatches[rel["obj_1"]], main_feat_id: main_feat_id,
                main_feat_type: main_feat_type})
        },
        contentType: 'text/plain',
        success: function (resp) {
            tilesAsjson_and_type = JSON.parse(resp);
            console.log("tilesAsjson_and_type...:",tilesAsjson_and_type);

            tilesType = tilesAsjson_and_type.geoJson_tiles_type;
            tilesAsjson = tilesAsjson_and_type.geoJson_tiles;

            //loadGeojsonAsSVG();
            load_computed_tiles_as_svg(tilesType,tilesAsjson);

        }
    });*/

}

function load_computed_tiles_as_svg(tilesType,tilesAsjson){
    //console.log("here is computed tile",tilesAsjson);
    deleteProcessingRing();
    var topo = topojson.topology({foo: tilesAsjson});
    //console.log("topo feat_type",topo.objects.foo.geometries[0].properties.feat_type);


   /* zoom = d3.zoom()
        .scaleExtent([1 << 15, 1 << 30])
        .on("zoom", function () {
            metricZoomCallback(false)
        });
    path = d3.geoPath()
        .projection(projection);*/

  /*  path = d3.geoPath()
        .projection(projection);*/

    json_svg = d3.select("#baseSVG").select("#baseLayer").append("g");

    if (tilesType ==="left_right"){

        vector13 =json_svg.selectAll("path")
            .data(topojson.feature(topo, topo.objects.foo).features, function (a, b) {
                return a !== b;
            })
            .enter()
            .append("svg:path")
            .attr("feat_type", function (d, i) {
                return topo.objects.foo.geometries[i].properties.feat_type
            })
            .attr("d",function(d) { return path(d.geometry) })
            .attr("class", "");

           var  tile =json_svg.selectAll("path[feat_type='approximate_tile']")
                .attr("class", "approximate_tile")
                .attr("style", null);


    }if (tilesType ==="RCC8"){
        vector14  = json_svg.selectAll("path")
            .data(topojson.feature(topo, topo.objects.foo).features, function (a, b) {
                return a !== b;
            })
            .enter()
            .append("path")
            .attr("feat_type", function (d, i) {
                return topo.objects.foo.geometries[i].properties.feat_type
            })
            .attr("d",function(d) { return path(d.geometry) })
            .attr("class","");

         var tile1 =json_svg.selectAll("path[feat_type='approximate_tile']")
            .attr("class", "approximate_tile")
            .attr("style", null);
    }else{
        vector15  = json_svg.selectAll("path")
            .data(topojson.feature(topo, topo.objects.foo).features, function (a, b) {
                return a !== b;
            })
            .enter()
            .append("path")
            .attr("feat_type", function (d, i) {
                return topo.objects.foo.geometries[i].properties.feat_type
            })
            .attr("d",function(d) { return path(d.geometry) })
            .attr("class","");
        var tile3 =json_svg.selectAll("path[feat_type='approximate_tile']")
            .attr("class", "approximate_tile")
            .attr("style", null);
    }

}