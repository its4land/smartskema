var MMGeoJsonData;
var SMGeoJsonData;
var MMStreetIDs=[];
var MMLandmarksIDs=[];
var sm_map;
var drawnItems_sm;
var drawnItems;
var map;
var labelLayer;
var combineGeojson=[];
var sketchMapCopy;
var mapmatches;
var metricFeatures = [];
var selected = undefined;
var previousOne = undefined;
var beaconJsonLayer;
var zoomOut = true;
var connectorFeature;

function HideMap(){
    $("#hideMap").hide();
    $("#metricmapplaceholder").hide();
    $("#showMap").show();
    $("#MMLinks").hide();
}

function ShowMap(){
    $("#hideMap").show();
    $("#metricmapplaceholder").show();
    $("#showMap").hide();
    $("#MMLinks").show();
}

function loadMetricMap(element){
    var fileList = document.getElementById('MetrichMapInputbutton').files;
    console.log(fileList);
    map = L.map('metricmapplaceholder').setView([0, 0], 5);

    var mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
            '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        mbUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    sateliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    var streetMap   = L.tileLayer(mbUrl, {id: 'mapbox.light', attribution: mbAttr}),
        satelite  = L.tileLayer(sateliteUrl, {id: 'mapbox.streets',   attribution: mbAttr});

    var baseLayers = {
        "Street Map": streetMap,
        "Aerial Imagery": satelite
    };

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(map);

    L.control.layers(baseLayers).addTo(map);
    var MM_fileName = "geojsons";
    $('#span_mm').html(MM_fileName);

    //loadEditingToolforMM(map);
    $("#hideMap").show();
    $("#MMLinks").show();

    for (var i=0;i<fileList.length;i++){
        randerGeoJsonFiles(fileList[i],map);
    }
}

function randerGeoJsonFiles(file, map){
    var fileName = file.name;
    var reader= new FileReader();
    reader.readAsDataURL(file);
    var loadedJsonLayer;
    reader.onload = function(){
        // load GeoJSON from an external file
        $.getJSON(reader.result,function(data){
            //passing data to qualifier
            MMGeoJsonData = data;
            loadedJsonLayer = L.geoJson(data,{
                style: function(feature){
                    switch(feature.properties.feat_type){
                        case 'boma':return {
                            color:"#920b21",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.4
                        };
                        case 'beacon':return {
                            radius:5,
                            shape: "triangle",
                            color: "#f50b0b",
                            weight: 1,
                            opacity: 1
                        };
                        case 'borehole':return {
                            radius:5,
                            shape: "triangle",
                            color: "#0f1010 ",
                            weight: 1,
                            opacity: 1
                        };

                        case 'marsh':return {
                            color:"#639432",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.7
                        };
                        case 'mountain':return {
                            color:"#7e5956",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.7
                        };
                        case 'path':return {
                            color:"#c89112",
                            weight: 2,
                            opacity: 1
                        };
                        case 'road':return {
                            color:"#c89112",
                            weight: 2,
                            opacity: 1
                        };
                        case 'river':return {
                            color:"#389be8",
                            weight: 2,
                            opacity: 1
                        };
                        case 'boundary':return {
                            color:"#f96905",
                            weight: 2,
                            opacity: 1
                        };
                    }
                },
                pointToLayer: function(feature,latlng){
                    return new L.shapeMarker(latlng,{
                        radius:5
                    });
                },
                onEachFeature: function (feature, layer) {
                    layer.bindTooltip(feature.properties.name,{
                        //permanent: true,
                        direction: 'center'
                    });
                }

            });
            map.addLayer(loadedJsonLayer),
                map.fitBounds(loadedJsonLayer.getBounds());
        });
    }
}

function downloadJsonMM(){
    var convertedData = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(MMGeoJsonData));
    // Create export
    document.getElementById('exportMetricFeatures').setAttribute('href', 'data:' + convertedData);
    document.getElementById('exportMetricFeatures').setAttribute('download','MM_fileName.geojson');
}


function showLabelsMM(){
    if (document.getElementById("hideLabelsMM").checked === true){
        document.getElementById("showLabelsMM").checked = true;
        document.getElementById("hideLabelsMM").checked = false;

        labelLayer=L.geoJson(MMGeoJsonData,{
            onEachFeature: function (feature, layer) {
                layer.bindTooltip(feature.properties.name,{
                    permanent: true,
                    direction: 'center'
                });
            }
        });
        labelLayer.addTo(map);
    }
}

function hideLabelsMM(){
    if (document.getElementById("showLabelsMM").checked === true) {
        document.getElementById("hideLabelsMM").checked = true;
        document.getElementById("showLabelsMM").checked = false;
        if (labelLayer !== undefined) {
            map.removeLayer(labelLayer);
        }
    }
}

function ProcessMap(){
    $("#metricmapplaceholder").hide();
    $("#sketchmapplaceholder1").hide();
    $("#SMLinks").hide();
    $("#MMLinks").hide();
    $("#resultholder").show();
}

/**
 - qualify_MM function takes the geojson from metric maps and pass
 - it to the paython function "mmReceiver" that connect qualifier plugin
 **/
function qualify_MM(){
    //$("#align_Maps").prop("disabled", false);
    //MMGeoJsonData = drawnItems.toGeoJSON();
    //var MMGeoJSON = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(MMGeoJsonData));
    console.log(MMGeoJsonData);
    $.ajax({
        url:'/mmReceiver',
        type: 'POST',
        data: JSON.stringify(MMGeoJsonData),
        contentType : 'application/json',
        success: function( resp ) {
            alert( resp );
        },
        error: function(){
            alert("error in posting geojson")
        }
    });
}

/**
 Align and integration of data
 **/
function align_Maps() {
    alert("Aligning of Maps is in progress :)!");
    generalMapListener();
    setTimeout(function(){
        $.getJSON( '../static/data/all_geometries.geojson', function( data ) {
            var onEachFeature = function(feature, layer) {
                layer.bindTooltip(feature.properties.name,{
                    direction: 'center'
                });
                layer.on({
                    'unload': function (e) {
                        dehighlight(e.target, selected);
                    },
                    'click': function(e){
                        var returnArray = select(e.target, previousOne, selected, mapmatches);
                        selected = returnArray[0];
                        previousOne = returnArray[1];
                    }
                });
            };
            beaconJsonLayer = L.geoJson(data,{
                style: function(feature){
                    switch(feature.properties.feat_type){
                        case 'beacon':return {
                            radius:4,
                            shape: "triangle",
                            color: "#a805f9 ",
                            weight: 1,
                            opacity: 1
                        };
                        case 'boundary':return {
                            color: "#fb0505 ",
                            weight: 1,
                            opacity: 1
                        };

                    }
                },
                pointToLayer: function(feature,latlng){
                    return new L.shapeMarker(latlng,{
                        radius:4
                    });
                },
                onEachFeature: onEachFeature
            });
            map.addLayer(beaconJsonLayer);
            map.fitBounds(beaconJsonLayer.getBounds());
        });
    }, 3000);

    // ajax call for getting the matches dictionary
    $.ajax({
        url:'/alignmentData',
        type: 'GET',
        data: JSON.stringify(MMGeoJsonData),
        contentType : 'application/json',
        success: function( resp ) {
            mapmatches = resp;
            //console.log(mapmatches);
        },
        error: function(){
            alert("error in getting the alignment data")
        }
    });
}

//connector for connecting the maps; here for leaflet
connector.registerMetricListener(function(val) {
    var returnArray = connectorMetricMap(selected, previousOne);
    selected = returnArray[0];
    previousOne = returnArray[1];
    if(returnArray[2] == true){
        selected.fireEvent("click");
    }
});

function zoomEvent(){
    console.log('at least im here');
    var zoomLevel = map.getZoom();
    if (zoomOut == true) {
        map.setZoom(zoomLevel - 1);
    } else {
        map.setZoom(zoomLevel + 1);
    }
}

// some general listener for the leaflet map
function generalMapListener(){
    map.doubleClickZoom.disable();

    map.addEventListener('mousedown', function(ev) {
        var lat = ev.latlng.lat;
        var lng = ev.latlng.lng;
        console.log(lat,lng);
    });

    map.addEventListener('mouseup', function(ev) {
        var lat2 = ev.latlng.lat;
        var lng2 = ev.latlng.lng;
        console.log(lat2,lng2);
    });
}