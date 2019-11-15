
/**
 *
 * the function processing the spatial query and returns the relations
 * @type {string}
 */

var main_feat_id = "";
var main_feat_type = "";
var main_feat_name = "";
var vector13;
var vector14;
var vector15;


var spatialUnitManager = (function(){


    function showSpatialUnitBnts(event){
        document.getElementById("editor_tools_col_right").appendChild(document.getElementById("svg_editor_bnt"));
        document.getElementById("editor_tools_col_right").appendChild(document.getElementById("toggle_interaction_bnt"));
        document.getElementById("editor_tools_col_right").appendChild(document.getElementById("spatial_query_processor_bnt"));


        $('#svg_editor_bnt').prop("style", "visibility: visible");
        $('#svg_editor_bnt').prop("style", "position: relative");
        $('#svg_editor_bnt').prop("style", "margin-left: 5px");
        $('#svg_editor_bnt').prop("style", "margin-right: 5px");

        $('#toggle_interaction_bnt').prop("style", "visibility: visible");
        $('#toggle_interaction_bnt').prop("style", "position: relative");
        $('#toggle_interaction_bnt').prop("style", "margin-left: 5px");

        $('#spatial_query_processor_bnt').prop("style", "visibility: visible");
        $('#spatial_query_processor_bnt').prop("style", "position: relative");
        $('#spatial_query_processor_bnt').prop("style", "margin-left: 5px");

        $('#editor_tools_col_right').prop("style", "visibility: visible");
    }

    return{
        showSpatialUnitBnts: showSpatialUnitBnts,

    }

})();




function spatial_query_processor_mode() {
    //createProcessingRing();
    console.log("in the spatial query processor MODE...");

    svg_elem = d3.select("#sketchSVG").selectAll("path,polygon,circle,rect,line,polyline");
    //console.log("svg elements:", svg_elements);
    svg_elem.on('mouseover', spatial_query_mouse_over);
    svg_elem.on('mouseout', spatial_query_mouse_out);
    svg_elem.on('click', get_spatial_query_popup);


    $(document).on('keydown', function (e) {
        if (e.keyCode === 27) { // ESC
            $('#spatial_query_popup_div').hide();
            deleteProcessingRing();
        }
    });

}

//svg elelment interaction
function spatial_query_mouse_over(d, i) {

    fid = this.getAttribute('id');
    mid = mapmatches[fid];
    if (mid == undefined){
        mel = d3.select("#baseSVG").selectAll("#"+fid).node();
        d3.select(this)
            .style("stroke", "#039BE5")
            .style("stroke-width", "8px");
        d3.select(mel)
            .style("stroke", "#039BE5")
            .style("stroke-width", "1px");

    }else{
        mel = document.getElementById(mid);
        d3.select(this)
            .style("stroke", "#039BE5")
            .style("stroke-width", "10px");
        d3.select(mel)
            .style("stroke", "#039BE5")
            .style("stroke-width", "10px");
    }


    /*d3.select(this)
        .style("stroke", "#039BE5")
        .style("stroke-width", "30px");*/
}

function spatial_query_mouse_out(d, i) {
    fid = this.getAttribute('id');
    mid = mapmatches[fid];

    if (mid == undefined){
        mel = d3.select("#baseSVG").selectAll("#"+fid).node();
        mel_class =mel.getAttribute("class");
        d3.select(this)
            .style("stroke", "#455A64")
            .style("stroke-width", "1px");
        d3.select(mel)
            .style("stroke", "none")
            .style("stroke-width", "1px")
            .attr("class", mel_class);
    }else{
        mel = document.getElementById(mid);
        d3.select(this)
            .style("stroke", "#455A64")
            .style("stroke-width", "1px");
        d3.select(mel)
            .style("stroke", "#455A64")
            .style("stroke-width", "1px");
    }
    /*d3.select(this)
        .style("stroke", "#455A64")
        .style("stroke-width", "10px");*/
}

function get_spatial_query_popup() {

    var lr_relations = "";
    var topo_relations = "";
    var relDist_relations= "";

    d3.event.preventDefault();
    main_feat_id = $(this).attr('id');
    main_feat_name = $(this).attr('name');
    main_feat_type = $(this).attr('smart_skema_type');

    //console.log("here i am in the div");
    $('#featureID_spatial_query').text(main_feat_id);
    $('#featureName_spatial_query').text(main_feat_id);
    $('#featureType_spatial_query').text(main_feat_type);

    //$('#spatial_query_popup_div').empty();
    $('#spatial_query_popup_div').prop("style", "visibility: visible");

    x = d3.event.pageX;
    y = d3.event.pageY;
    //console.log("x, y :",x, y);

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
        setTimeout(visualize_computed_rels(lr_relations,topo_relations,relDist_relations), 5);
    });


    $('#spatial_query_popup_div').offset({
        top: y,
        left: x
    });
}


/**
 * Function takes the id and get possible relations
 */

function qualitative_spatial_queries() {
    /*var lr_relations = "";
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
        setTimeout(visualize_computed_rels(lr_relations,topo_relations,relDist_relations), 5);
    });*/
}

/**
 * function visualies the relations got from the server side
 */
function visualize_computed_rels(lr_relations,topo_relations,relDist_relations) {

    for (i in lr_relations) {
        var presentation = "left_right";
        $('#leftRight_rels_div').append(
            "<div id='lr_relation'>" +
            "<span >" + "has a spatial relation to feature (ID"+ " : "+ lr_relations[i].obj_1 +") in Sketch map"+ "</span>" +
            "</div>"+
            "</br>"
        );
       // $('#lr_relation').prop("style", "padding:1px");
        $('#lr_relation').prop("id", "lr_relation" + i);
        $('#lr_relation' + i).prop("class", " btn btn-outline-info");
        $('#lr_relation' + i).prop("style", "margin-top:3px");


        $('#lr_relation' + i).attr("onclick", "get_qualitative_approximate_location(" + JSON.stringify(presentation)+','+JSON.stringify(lr_relations[i]) + ")");

    }

    for (i in topo_relations) {
        console.log(i);
        var layer = sketchMapDisplayManager.getVectorLayer("baseLayer");
         //"Name:"+ ele_name +
        var presentation = "RCC8";
        $('#topo_rels_div').append(
            "<div id='topo_relations'>" +
            "<span >" + "has a spatial relation to feature (ID"+ " : "+ topo_relations[i].obj_1 +") in sketch map"+ "</span>" +
            "</div>"+
            "</br>"
        );
      /*  $('#topo_relations').prop("style", "padding:1px");*/
        $('#topo_relations').prop("id", "topo_relations" + i);
        $('#topo_relations' + i).prop("class", "btn btn-outline-info");
        $('#topo_relations' + i).prop("style", "margin-top:3px");
        $('#topo_relations' + i).attr("onclick", "get_qualitative_approximate_location(" +JSON.stringify(presentation)+','+ JSON.stringify(topo_relations[i]) + ")");

    }

    for (i in relDist_relations) {
        var presentation = "REL_DIST";
        $('#relDist_rels_div').append(
            "<div id='relDist_relations'>" +
            "<span >" + "has a spatial relation to feature (ID"+ " : "+ relDist_relations[i].obj_1 +") in sketch map"+ "</span>" +
            "</div>"+
            "<br>"
        );
       // $('#relDist_relations').prop("style", "padding:1px");
        $('#relDist_relations').prop("id", "relDist_relations" + i);
        $('#relDist_relations' + i).prop("class", " btn btn-outline-info");
        $('#relDist_relations' + i).prop("style", "margin-top:3px");
        $('#relDist_relations' + i).attr("onclick", "get_qualitative_approximate_location(" +JSON.stringify(presentation)+','+ JSON.stringify(relDist_relations[i]) + ")");

    }
}

/**
 * function takes the clicked relation to compute the approximate location
 * of the click object in the base map
 *
 */
function get_qualitative_approximate_location(rep, rel) {
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
        //console.log("tilesAsjson_and_type...:",tilesAsjson_and_type);

        tilesType = tilesAsjson_and_type.geoJson_tiles_type;
        tilesAsjson = tilesAsjson_and_type.geoJson_tiles;
        load_computed_tiles_as_svg(tilesType,tilesAsjson);

    });
}

function load_computed_tiles_as_svg(tilesType,tilesAsjson){
    let sourceFormat = sessionData.projectType == "orthoSketchProject"? "tms": "openstreetmap";

    let tilemap_format = sessionData.projectType == "orthoSketchProject"? TMS_TILE_MAP: OSM_TILE_MAP;
    //baseMapDisplayManager = baseMapDisplayManagerTemplate(tilemap_format);

    let url = sourceFormat  == "tms"?
        "./static/data/modified/tiles_256_raster/": "tile.openstreetmap.org/";
    if (tilesType ==="left_right"){
        date_time = (new Date()).toISOString();
        //baseMapDisplayManager.tilesFromURL(url).then(
        //    function(done){
                baseMapDisplayManager.vectorFromGeoJSONContent(tilesAsjson, "Approx_tiles_leftRight_"+date_time)
                    .then(svgEditor.init('base')); //"baseLayer")
        //    });

    }if (tilesType ==="RCC8"){
        date_time = (new Date()).toISOString();
        console.log("i am in the RCC if for tiles ")

        //baseMapDisplayManager.tilesFromURL(url).then(
        //    function(done){
                baseMapDisplayManager.vectorFromGeoJSONContent(tilesAsjson, "Approx_tiles_RCC_"+date_time)
                    .then(svgEditor.init('base')); //"baseLayer")
        //    });
    }if (tilesType ==="REL_DIST"){
        date_time = (new Date()).toISOString();
        console.log("i am in the reldist if for tiles ")

        //baseMapDisplayManager.tilesFromURL(url).then(
        //    function(done){
                baseMapDisplayManager.vectorFromGeoJSONContent(tilesAsjson, "Approx_tiles_relDist_"+date_time)
                    .then(svgEditor.init('base')); //"baseLayer")
        //    });
    }


    svgEditor.init('base');
    console.log("SVG Editor for Base Map is Activate...");

    //baseMapDisplayManager.vectorFromGeoJSONContent(json) //"baseLayer")
   /* var topo = topojson.topology({foo: tilesAsjson});
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
    }*/
}