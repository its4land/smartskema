var MMGeoJsonData;
var SMGeoJsonData;
var MMStreetIDs = [];
var MMLandmarksIDs = [];
var sm_map;
var drawnItems_sm;
var drawnItems;
var map;
var labelLayer;
var combineGeojson = [];
var sketchMapCopy;
var mapmatches;
var metricFeatures = [];
var selected = undefined;
var previousOne = undefined;
var beaconJsonLayer;
var zoomOut = true;
var connectorFeature;
var json;
var feature_types = [];
var vector;
var vector1;
var vector2;
var vector3;
var vector4;
var vector5;
var vector6;
var raster;
var tile;
var projection;
var path;
var width = 700,
    height = 700;
var pi = Math.PI,
    tau = 2 * pi;
var metricZoomCount = 0;
var zoom;
var help = false;
var center;
var transform;

function HideMap() {
    $("#hideMap").hide();
    $("#metricmapplaceholder").hide();
    $("#showMap").show();
    $("#MMLinks").hide();
}

function ShowMap() {
    $("#hideMap").show();
    $("#metricmapplaceholder").show();
    $("#showMap").hide();
    $("#MMLinks").show();
}

function loadMetricMap(element) {
    var fileList = document.getElementById('MetrichMapInputbutton').files;
    console.log(fileList);

    for (var i = 0; i < fileList.length; i++) {
        randerGeoJsonFiles(fileList[i], map);
    }
}


/**
 * function allows you to load GCP for the alignment
 * @param element
 */
var loaded_GCP_File_name ;
function ortho_load_GCP_File(element) {
    loaded_GCP_File_name="";
    gcpFile = document.getElementById('orth_GCP_Inputbutton').files[0];
    loaded_GCP_File_name = gcpFile.name;

    fileReader = new FileReader();
    fileReader.readAsText(gcpFile);
    fileReader.onload = function () {
        json = JSON.parse(fileReader.result);
        $.ajax({
            url: '/postGCP',
            type: 'GET',
            data: {
                loadedGCPFileName: loaded_GCP_File_name,
                GCPJsonContent: JSON.stringify(json)
            },
            contentType: 'text/plain',
            success: function (resp) {
                loadGeojsonAsSVG_new();
            }
        });

        GCP_checked = new Boolean($("#ortho_GCP_checked").prop("checked", true));

    };
}

var loadedMetricFilename = "";

function randerGeoJsonFiles(file, map) {

    loadedMetricFilename = file.name;
    extension = loadedMetricFilename.substring(loadedMetricFilename.lastIndexOf('.') + 1);

    console.log(extension);

    if (extension == "geojson") {
        var reader = new FileReader();
        reader.readAsText(file);
        //var loadedJsonLayer;
        reader.onload = function () {
            json = JSON.parse(reader.result);
            $.ajax({
                url: '/mmResizer',
                type: 'POST',
                data: {
                    fileName: loadedMetricFilename,
                    mapContent: JSON.stringify(json)
                },
                success: function (resp) {
                }
            });


            loadGeojsonAsSVG();
        };
    }
    /* else {

         var reader = new FileReader();
         reader.readAsDataURL(file);
         reader.onload = function (e) {
             img = document.createElement("img");
             var location = document.getElementById("metricmapplaceholder");
             location.setAttribute("width", imgWidth);
             location.setAttribute("height", imgHight);
             file.src = this.result;
             //show the processRing
             createProcessingRing(location);
             //call resizer function
             var imageUrl = "./data_original/" + fileName;
             console.log(imageUrl);
             $.ajax({
                 url: '/smResizer',
                 type: 'GET',
                 data: {path: imageUrl},
                 contentType: 'text/plain',
                 //dataType: 'json',
                 success: function (resp) {
                     var json = JSON.parse(resp);
                     //hide the process ring
                     deleteProcessingRing(location);

                     $("#orthophoto_as_base_map_checked").prop("checked", true);

                     imgPath = json.imgPath;
                     imgHight = json.imgHight;
                     imgWidth = json.imgWidth;
                     img.setAttribute('src', './static/data/modified/' + fileName);
                     img.setAttribute('width', imgWidth);
                     img.setAttribute('height', imgHight);
                     location.appendChild(img);

                 }
             });
         }
     }*/
}


/**
 *
 * @param file
 * @param map
 */
/*function loadOrthophoto_as_MetricMap(element) {
    var fileList = document.getElementById('orthophotoAsMetrichMapInputbutton').files;
    console.log(fileList);

    for (var i = 0; i < fileList.length; i++) {
        randerOrthoTilles(fileList[i], map);
    }
}

function randerOrthoTilles(file) {
    loadedMetricFilename = file.name;
    var reader = new FileReader();
    reader.readAsText(file);
    //var loadedJsonLayer;
    reader.onload = function () {
        //json = JSON.parse(reader.result);
        /!*   $.ajax({
               url: '/mmResizer',
               type: 'POST',
               data: {
                   fileName: loadedMetricFilename,
                   mapContent: JSON.stringify(json)
               },
               success: function (resp) {
               }
           });*!/

        loadGeojsonAsSVG_new();
    }
}*/


function loadGeojsonAsSVG_new() {
    /* set up the svg element and give it a border */
    map = d3.select("#metricmapplaceholder")
        .append("svg")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", "0 0 " + width + " " + height + "");

    var borderPath = map.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", height)
        .attr("width", width)
        .style("stroke", 'black')
        .style("fill", "none")
        .style("stroke-width", 1);

    /**
     * first project the map crs into the image space
     */
    var renderedInitialMapSize = 250;
    var imageCoordinateBounds = [[330385.25, 1294790], [334385.25, 1290790]];

    var coordExtentX = imageCoordinateBounds[1][0] - imageCoordinateBounds[0][0];
    var coordExtentY = imageCoordinateBounds[1][1] - imageCoordinateBounds[0][1];


    /**
     * Then scale to fit in initial render tile.
     */
    var scale_x = renderedInitialMapSize / coordExtentX;
    var mShift_x = 0;
    var t_x_ = -scale_x * imageCoordinateBounds[0][0] + mShift_x;

    var scale_y = renderedInitialMapSize / coordExtentY;
    var mShift_y = 6;
    var t_y_ = -scale_y * imageCoordinateBounds[0][1] + mShift_y;

    /*console.log('rS_x:', imageRescale_x);
    console.log('cTMR_x:', scale_x);
    console.log(' mShift_x:', mShift_x);
    console.log('t_x_:', t_x_);

    console.log('rS_y:', imageRescale_y);
    console.log('cTMR_y:', scale_y);
    console.log('mShift_y:', mShift_y);
    console.log('t_y_:', t_y_);*/
//    console.log('initial json:', json);

    initProjection = d3.geoIdentity();
    initProjection.reflectY(true).scale(scale_x).translate([t_x_, t_y_]);
    path = d3.geoPath().projection(initProjection);
//    initProjection.fitSize([width, height], json);

    var bounds = d3.geoPath().bounds(json);
    var scaled_bounds = path.bounds(json);
    // console.log('initialbbox after projection:', bounds);

    var map_width = scaled_bounds[1][0] - scaled_bounds[0][0];
    var map_height = scaled_bounds[1][1] - scaled_bounds[0][1];
    var map_center = [scaled_bounds[0][0] + map_width / 2, scaled_bounds[0][1] + map_height / 2 + 6];
    var bounds_scale = Math.min(width / map_width, height / map_height);
    var translate_x = (128 - map_center[0]) / 256; //map_center[0]; //width/2 -
    var translate_y = (128 - map_center[1] + 6) / 256; //map_center[1]; //height/2 -

    /*console.log("bounds_x_shift", bounds_x_shift);
    console.log("bounds_y_shift", bounds_y_shift);
    console.log("\nscaled_bounds\n", scaled_bounds);
    console.log("map_width", map_width);
    console.log("map_height", map_height);
    console.log("map_center", map_center);
    console.log("bounds_scale", bounds_scale, "\n");
    console.log("width/2", width / 2, "map_center[0]", map_center[0], "translate_x", translate_x);
    console.log("height/2", height / 2, "map_center[1]", map_center[1], "translate_y", translate_y, "\n");*/

    initial_zoom = d3.zoomIdentity
    //                .translate(width/2, height/2)
        .translate(width / 2, height / 2)
        //                .translate(bounds_x_shift, -bounds_y_shift)
        .scale(renderedInitialMapSize + 6)// * bounds_scale/5)//1 << 13)//scale * tau) //
//                .translate(0.2027, -0.243)
    ;
    // console.log("initial_zoom", initial_zoom);
    // console.log("scale_map_center", scale_map_center);

    zoom = d3.zoom()
        .scaleExtent([1 << 8, 1 << 16])
        .on("zoom", metricZoomCallback_new);

    function floor(k) {
        return Math.pow(2, Math.floor(Math.log(k) / Math.LN2));
    }

    setTimeout(function () {
        tile = d3.tile()
            .size([width, height]);

        raster = map.append("g").attr("layer", "raster");

        var topo = topojson.topology({foo: json});
        // get bounding box of geojson and zoom and center to it

        vector = map.append("g").attr("layer", "vector");
        vector.selectAll("path")
            .data(topojson.feature(topo, topo.objects.foo).features, function (a, b) {
                return a !== b;
            })
            .enter()
            .append("path")
            .attr("d", path)
            .attr("class","GCP");

        map
            .call(zoom)
            .call(zoom.transform, initial_zoom)
            .call(zoom.translateBy, translate_x, translate_y)
            .call(zoom.scaleBy, bounds_scale)
        ;
    }, 1000);
}


function metricZoomCallback_new(box) {
    if (metricZoomCount == 0) {
        zoomed(box);

        function zoomed(box) {
            if (box != undefined) {
                map.attr('viewBox', null);
            }
            else if (box == undefined) {
                transform = d3.event.transform;
                console.log('transform.k:', transform.k, '| transform.x:', transform.x, '| transform.y:', transform.y);

                var tiles = tile
                    .scale(transform.k)
                    .translate([transform.x, transform.y])
                    ();

                console.log('tiles.scale:', tiles.scale, '| tiles.translate:', tiles.translate);
                console.log("initProjection before:", initProjection.scale(), initProjection.translate());

                /**
                 * get the zoom level and level-translation apply it to the vector layer
                 * */
                var zoom_level = tiles[0][2];
                vector.attr("transform", stringify_vector_transform(tiles.scale, tiles.translate, (1 << zoom_level)));

                vector.selectAll("path")
                    .attr("d", path)
                    .style("stroke-width", 1.5 / (1 << zoom_level));

                console.log('vector transform: ', stringify_vector_transform(tiles.scale, tiles.translate, (1 << zoom_level)));
                console.log('raster transform: ', stringify(tiles.scale, tiles.translate));

                var image = raster
                    .attr("transform", stringify(tiles.scale, tiles.translate))
                    .selectAll("image")
                    .data(tiles, function (d) {
                        return d;
                    });

                image.exit().remove();

                image.enter().append("image")
                    .attr("xlink:href", function (d) {
                        // given indexes [x, y, z]
                        // data layout z/x/y^(-1)
                        var y = Math.pow(2, d[2]) - d[1] - 1; //needs to be converted from TMS tiles to XYZ tiles
                        return "../static/data/modified/tiles_256_raster/" + d[2] + "/" + d[0] + "/" + y + ".png";
                    })
                    .attr("x", function (d) {
                        //return d.x * 256;
                        return d[0] * 256;
                    })
                    .attr("y", function (d) {
                        //return d.y * 256;
                        return d[1] * 256;
                    })
                    .attr("width", 256)
                    .attr("height", 256)
                    .on("error", function () {
                        d3.select(this).style("visibility", "visible");
                    });
            }
        }

        metricZoomCount++;
        if (help !== false) {
            sketchZoomCallback(insideMetricArr);
        }
        help = false;
        metricZoomCount--;
    }
    else console.log('box, metricZoomCount > 0:\n', box, metricZoomCount);
}

function stringify(scale, translate) {
    var k = scale / 256, r = scale % 1 ? Number : Math.round;
    return "translate(" + r(translate[0] * scale) + "," + r(translate[1] * scale) + ") scale(" + k + ")";
}

function stringify_vector_transform(scale, translate, zoom) {
    var k = (scale / 256) * zoom, r = scale % 1 ? Number : Math.round;
    return "translate(" + r(translate[0] * scale) + "," + r(translate[1] * scale) + ") scale(" + k + ")";
}


function downloadJsonMM() {
    var convertedData = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(MMGeoJsonData));
    // Create export
    document.getElementById('exportMetricFeatures').setAttribute('href', 'data:' + convertedData);
    document.getElementById('exportMetricFeatures').setAttribute('download', 'MM_fileName.geojson');
}


function showLabelsMM() {
    if (document.getElementById("hideLabelsMM").checked === true) {
        document.getElementById("showLabelsMM").checked = true;
        document.getElementById("hideLabelsMM").checked = false;

        labelLayer = L.geoJson(MMGeoJsonData, {
            onEachFeature: function (feature, layer) {
                layer.bindTooltip(feature.properties.name, {
                    permanent: true,
                    direction: 'center'
                });
            }
        });
        labelLayer.addTo(map);
    }
}

function hideLabelsMM() {
    if (document.getElementById("showLabelsMM").checked === true) {
        document.getElementById("hideLabelsMM").checked = true;
        document.getElementById("showLabelsMM").checked = false;
        if (labelLayer !== undefined) {
            map.removeLayer(labelLayer);
        }
    }
}

function ProcessMap() {
    $("#metricmapplaceholder").hide();
    $("#sketchmapplaceholder").hide();
    $("#SMLinks").hide();
    $("#MMLinks").hide();
    $("#resultholder").show();
}

/**
 - qualify_MM function takes the geojson from metric maps and pass
 - it to the paython function "mmReceiver" that connect qualifier plugin
 **/
function qualify_MM(callback) {
    //$("#align_Maps").prop("disabled", false);
    //MMGeoJsonData = drawnItems.toGeoJSON();
    //var MMGeoJSON = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(MMGeoJsonData));
    //loc = document.getElementById("metricmapplaceholder");

    //createProcessingRing(loc);
    console.log(json);
    $.ajax({
        url: '/mmReceiver',
        type: 'POST',
        data:
            {
                loadedMetricFilename: loadedMetricFilename,
                metricMapContent: JSON.stringify(json)
            },
        //contentType: 'application/json',
        success: function (resp) {

            console.log("completed qualify MM");
            callback();

            //deleteProcessingRing(loc);
            /*            $.alert({
                            title: 'Info: Qualitative Representation of Base Map',
                            content: 'Qualitative Constraint Networks (QCNs) have been generated and stored in a *.JSON file'
                        });*/

        }
    });

}

/**
 Align and integration of data
 **/
function align_Sketch_Map() {

    loc = document.getElementById("divider");
    createProcessingRing(loc);

/*    $.when(qualify_MM()).done(function () {

        $.when(qualify_SM()).done(function () {

            // ajax call for getting the matches dictionary
            $.ajax({
                url: '/alignmentData',
                type: 'GET',
                data: {
                    loadedMetricFilename: loadedMetricFilename,
                    loadedSketchFilename: fileName_full

                },
                contentType: 'text/plain',
                success: function (resp) {
                    mapmatches = JSON.parse(resp);
                    console.log(mapmatches);

                    deleteProcessingRing(loc);
                    $.alert({
                        title: 'Info: Alignment is completed!',
                        content: 'Move the mouse over sketch features to find the corresponing feature in the base map.'
                    });
                }
            });

        });
    });*/
    qualify_MM(function () {
        console.log("calling qualify SM");
        qualify_SM(function () {
            console.log("calling alignment");
            // ajax call for getting the matches dictionary
            $.ajax({
                url: '/alignmentData',
                type: 'GET',
                data: {
                    loadedMetricFilename: loadedMetricFilename,
                    loadedSketchFilename: fileName_full

                },
                contentType: 'text/plain',
                success: function (resp) {
                    mapmatches = JSON.parse(resp);
                    console.log(mapmatches);

                    deleteProcessingRing(loc);
                    $.alert({
                        title: 'Info: Alignment is completed!',
                        content: 'Move the mouse over sketch features to find the corresponing feature in the base map.'
                    });
                }
            });

        });
    });


    setTimeout(function () {
        var allFeature = map.selectAll("path");
        allFeature.on("click", function () {
            selected = mapClickD3(this, previousOne, selected, "metric");
            matchesCheck("metric", mapmatches, this);
        })
    }, 1000);
}

/**
 * the function align the
 * - drawing objects on satellite image and
 * - geo-referenced them on the ground objects
 */

function align_Satellite_Drawing() {

    svgItems = d3.select("#loadedSVG");
    svgContent = svgItems.node().outerHTML;

    fName = fileName_full.split(".");
    fileName = fName[0];
    createProcessingRing(loc);

    $.ajax({
        url: '/align_Satellite_Drawing',
        type: 'POST',
        data: {
            loaded_GCP_File_name:loaded_GCP_File_name,
            svg_fileName_full:fileName_full,
            svgData: svgContent
        },
        //contentType: 'image/svg+xml',
        success: function (resp) {
            json = JSON.parse(resp);
            console.log("here is matching json:",json);
            loadGeojsonAsSVG_new();
            deleteProcessingRing(loc);
        }
    });

/*
    setTimeout(function () {

        loadedsvg = document.getElementById("loadedSVG");
        loc.appendChild(loadedsvg);

        $('#loadedSVG').css('position', "absolute");
        $('#loadedSVG').css('top', 0);
        $('#loadedSVG').css('left', 0);
        $('#loadedSVG').css('padding', "inherit");

        deleteProcessingRing();

    }, 4000);*/
}


jQuery.fn.d3Click = function () {
    this.each(function (i, e) {
        var evt = new MouseEvent("click");
        e.dispatchEvent(evt);
    });
};

/*jQuery.fn.d3Zoom = function () {
    this.each(function (i, e) {
        var evt = new MouseEvent("zoom");
        e.dispatchEvent(evt);
    });
};*/

//connector for connecting the maps; here for leaflet
connector.registerMetricListener(function (val) {
    var returnArray = connectorMetricMap(selected, previousOne);
    selected = returnArray[0];
    previousOne = returnArray[1];
    console.log(previousOne);
    if (returnArray[2] == true) {
        $(selected).d3Click();
    }
});


function loadGeojsonAsSVG() {
    mm_checked = new Boolean($("#MM_checked").prop("checked", true));
    projection = d3.geoMercator()
        .scale(1 / tau)
        .translate([0, 0]);

    path = d3.geoPath()
        .projection(projection);

    map = d3.select("#metricmapplaceholder")
        .append("svg")
        .attr("width", imgWidth)
        .attr("height", imgHight)
        .attr("id", "json_svg");

    tile = d3.tile()
        .size([width, height]);

    raster = map.append("g");

    zoom = d3.zoom()
        .scaleExtent([1 << 15, 1 << 30])
        .on("zoom", function () {
            metricZoomCallback(false)
        });

    setTimeout(function () {
        var topo = topojson.topology({foo: json});
        for (var i = 0; i < topo.objects.foo.geometries.length; i++) {
            feature_types.push(topo.objects.foo.geometries[i].properties.feat_type);
        }
        feature_types = removeDuplicates(feature_types);
        console.log("feature_type:", feature_types);
        var featTypeArrs = [];
        for (var j = 0; j < feature_types.length; j++) {
            featTypeArrs[j] = topo.objects.foo.geometries.filter(checkType, feature_types[j]);
        }
        var boma = {type: "GeometryCollection", geometries: featTypeArrs[0]};
        var olopololi = {type: "GeometryCollection", geometries: featTypeArrs[1]};
        var school = {type: "GeometryCollection", geometries: featTypeArrs[2]};
        var pond = {type: "GeometryCollection", geometries: featTypeArrs[3]};
        var church = {type: "GeometryCollection", geometries: featTypeArrs[4]};
        var marsh = {type: "GeometryCollection", geometries: featTypeArrs[5]};
        var borehole = {type: "GeometryCollection", geometries: featTypeArrs[6]};
        var mountain = {type: "GeometryCollection", geometries: featTypeArrs[7]};
        var path = {type: "GeometryCollection", geometries: featTypeArrs[8]};
        var road = {type: "GeometryCollection", geometries: featTypeArrs[9]};
        var river = {type: "GeometryCollection", geometries: featTypeArrs[10]};
        var boundary = {type: "GeometryCollection", geometries: featTypeArrs[11]};
        console.log(boma);


        /*        var school = {type:"GeometryCollection", geometries:featTypeArrs[8]};
                var church = {type:"GeometryCollection", geometries:featTypeArrs[9]};
                var pond = {type:"GeometryCollection", geometries:featTypeArrs[10]};*/

        topo.objects = ({
            boma: boma,
            olopololi: olopololi,
            school: school,
            pond: pond,
            church: church,
            marsh: marsh,
            borehole: borehole,
            mountain: mountain,
            path: path,
            road: road,
            river: river,
            boundary: boundary

        });

        vector = map.selectAll("boma")
            .data(topojson.feature(topo, topo.objects.boma).features, function (a, b) {
                return a !== b;
            })
            .enter()
            .append("path")
            .attr("id", function (d, i) {
                return topo.objects.boma.geometries[i].properties.id
            })
            .attr("name", function (d, i) {
                return topo.objects.boma.geometries[i].properties.name
            })
            .attr("feat_type", "boma")
            .attr("class", "boma");

        vector1 = map.selectAll("olopololi")
            .data(topojson.feature(topo, topo.objects.olopololi).features, function (a, b) {
                return a !== b;
            })
            .enter()
            .append("path")
            .attr("id", function (d, i) {
                return topo.objects.olopololi.geometries[i].properties.id
            })
            .attr("name", function (d, i) {
                return topo.objects.olopololi.geometries[i].properties.id
            })
            .attr("feat_type", "olopololi")
            .attr("class", "olopololi");

        vector2 = map.selectAll("school")
            .data(topojson.feature(topo, topo.objects.school).features, function (a, b) {
                return a !== b;
            })
            .enter()
            .append("path")
            .attr("id", function (d, i) {
                return topo.objects.school.geometries[i].properties.id
            })
            .attr("name", function (d, i) {
                return topo.objects.school.geometries[i].properties.id
            })
            .attr("feat_type", "school")
            .classed("school", true);


        vector3 = map.selectAll("pond")
            .data(topojson.feature(topo, topo.objects.pond).features, function (a, b) {
                return a !== b;
            })
            .enter()
            .append("path")
            .attr("id", function (d, i) {
                return topo.objects.pond.geometries[i].properties.id
            })
            .attr("name", function (d, i) {
                return topo.objects.pond.geometries[i].properties.id
            })
            .attr("feat_type", "pond")
            .classed("pond", true);


        vector4 = map.selectAll("church")
            .data(topojson.feature(topo, topo.objects.church).features, function (a, b) {
                return a !== b;
            })
            .enter()
            .append("path")
            .attr("id", function (d, i) {
                return topo.objects.church.geometries[i].properties.id
            })
            .attr("name", function (d, i) {
                return topo.objects.church.geometries[i].properties.id
            })
            .attr("feat_type", "church")
            .classed("church", true);

        vector5 = map.selectAll("marsh")
            .data(topojson.feature(topo, topo.objects.marsh).features, function (a, b) {
                return a !== b;
            })
            .enter()
            .append("path")
            .attr("id", function (d, i) {
                return topo.objects.marsh.geometries[i].properties.id
            })
            .attr("name", function (d, i) {
                return topo.objects.marsh.geometries[i].properties.id
            })
            .attr("feat_type", "marsh")
            .attr("class", "marsh");

        vector6 = map.selectAll("borehole")
            .data(topojson.feature(topo, topo.objects.borehole).features, function (a, b) {
                return a !== b;
            })
            .enter()
            .append("path")
            .attr("id", function (d, i) {
                return topo.objects.borehole.geometries[i].properties.id
            })
            .attr("name", function (d, i) {
                return topo.objects.borehole.geometries[i].properties.id
            })
            .attr("feat_typ", "borehole")
            .attr("class", "borehole");


        vector7 = map.selectAll("mountain")
            .data(topojson.feature(topo, topo.objects.mountain).features, function (a, b) {
                return a !== b;
            })
            .enter()
            .append("path")
            .attr("id", function (d, i) {
                return topo.objects.mountain.geometries[i].properties.id
            })
            .attr("name", function (d, i) {
                return topo.objects.mountain.geometries[i].properties.id
            })
            .attr("feat_type", "mountain")
            .attr("class", "mountain");


        vector8 = map.selectAll("linkRoad")
            .data(topojson.feature(topo, topo.objects.path).features, function (a, b) {
                return a !== b;
            })
            .enter()
            .append("path")
            .attr("id", function (d, i) {
                return topo.objects.path.geometries[i].properties.id
            })
            .attr("name", function (d, i) {
                return topo.objects.path.geometries[i].properties.id
            })
            .attr("feat_type", "linkRoad")
            .attr("class", "linkRoad");

        vector9 = map.selectAll("road")
            .data(topojson.feature(topo, topo.objects.road).features, function (a, b) {
                return a !== b;
            })
            .enter()
            .append("path")
            .attr("id", function (d, i) {
                return topo.objects.road.geometries[i].properties.id
            })
            .attr("name", function (d, i) {
                return topo.objects.road.geometries[i].properties.id
            })
            .attr("feat_type", "road")
            .attr("class", "road_mm");

        vector10 = map.selectAll("river")
            .data(topojson.feature(topo, topo.objects.river).features, function (a, b) {
                return a !== b;
            })
            .enter()
            .append("path")
            .attr("id", function (d, i) {
                return topo.objects.river.geometries[i].properties.id
            })
            .attr("name", function (d, i) {
                return topo.objects.river.geometries[i].properties.id
            })
            .attr("feat_type", "river")
            .attr("class", "river_mm");

        vector11 = map.selectAll("boundary")
            .data(topojson.feature(topo, topo.objects.boundary).features, function (a, b) {
                return a !== b;
            })
            .enter()
            .append("path")
            .attr("id", function (d, i) {
                return topo.objects.boundary.geometries[i].properties.id
            })
            .attr("name", function (d, i) {
                return topo.objects.boundary.geometries[i].properties.id
            })
            .attr("feat_type", "boundary")
            .attr("class", "ranch_boundary");


        center = projection([36.8, -2.3]);

        map
            .call(zoom)
            .call(zoom.transform, d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(1 << 19)
                .translate(-center[0], -center[1]));
    }, 1000);
}

function metricZoomCallback(bool) {
    if (metricZoomCount == 0) {

        //map.attr("transform", d3.event.transform);
        //var transformMetric = d3.zoomTransform(this);
        zoomed(bool);

        function zoomed(bool) {
            if (bool == true) {
                //$(map).d3Zoom();
                console.log("in the true case");
                transform = d3.event.transform;
                //transform.k = transform.k << 19;
                /*map.call(zoom.transform, d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(1 << 19)
                    .translate(-center[0], -center[1]));;*/
            }
            else {
                transform = d3.event.transform;
            }
            //console.log(transform); //first very huge but then gets very small when zooming in sketch

            var tiles = tile
                .scale(transform.k)
                .translate([transform.x, transform.y])
                ();

            projection
                .scale(transform.k / tau)
                .translate([transform.x, transform.y]);

            vector
                .attr("d", path);

            vector1
                .attr("d", path);

            vector2
                .attr("d", path);

            vector3
                .attr("d", path);

            vector4
                .attr("d", path);

            vector5
                .attr("d", path);

            vector6
                .attr("d", path);

            vector7
                .attr("d", path);

            vector8
                .attr("d", path);

            vector9
                .attr("d", path);

            vector10
                .attr("d", path);

            vector11
                .attr("d", path);

            var image = raster
                .attr("transform", stringify(tiles.scale, tiles.translate))
                .selectAll("image")
                .data(tiles, function (d) {
                    return d;
                });

            image.exit().remove();

            image.enter().append("image")
                .attr("xlink:href", function (d) {
                    return "http://" + "abc"[d[1] % 3] + ".tile.openstreetmap.org/" + d[2] + "/" + d[0] + "/" + d[1] + ".png";
                })
                .attr("x", function (d) {
                    return d[0] * 256;
                })
                .attr("y", function (d) {
                    return d[1] * 256;
                })
                .attr("width", 256)
                .attr("height", 256);
        }

        function stringify(scale, translate) {
            var k = scale / 256, r = scale % 1 ? Number : Math.round;
            return "translate(" + r(translate[0] * scale) + "," + r(translate[1] * scale) + ") scale(" + k + ")";
        }

        metricZoomCount++;
        /*if (help !== false) {
            sketchZoomCallback(true);
        }*/
        help = true;
        metricZoomCount--;
    }
}

function checkType(arr) {
    return arr.properties.feat_type == this;
}

function removeDuplicates(arr) {
    var unique_array = [];
    for (var i = 0; i < arr.length; i++) {
        if (unique_array.indexOf(arr[i]) == -1) {
            unique_array.push(arr[i])
        }
    }
    return unique_array;
}