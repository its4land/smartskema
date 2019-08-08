/**
 * function allows you to load metric map in the panel
 * @param element
 */
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
var loadedJsonLayer;

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

    /*L.tileLayer(
     'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
     maxZoom: 18
     }).addTo(map);*/

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

    reader.onload = function(){
        // load GeoJSON from an external file
        $.getJSON(reader.result,function(data){
            //passing data to qualifier
            MMGeoJsonData = data;
            loadedJsonLayer = L.geoJson(data,{

                style: function(feature){
                    switch(feature.properties.feat_type){
                        case 'boma':return {
                            color:"#F64A8A",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.5
                        };
                        case 'school':return {
                            color:"#e67e22 ",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.5
                        };
                        case 'pond':return {
                            color:"#1560BD",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.5
                        };
                        case 'olopololi':return {
                            color:"#50C878",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.5
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
                            color:" #465945",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.5
                        };
                        case 'mountain':return {
                            color:" #E49B0F",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.7
                        };
                        case 'path':return {
                            color:"#ED9121",
                            weight: 2,
                            opacity: 1
                        };
                        case 'road':return {
                            color:"#F0DC82",
                            weight: 2,
                            opacity: 1
                        };
                        case 'river':return {
                            color:" #1E90FF",
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
    //MMGeoJsonData = drawnItems.toGeoJSON();
    // Stringify the GeoJson
    var convertedData = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(MMGeoJsonData));
    // Create export
    document.getElementById('exportMetricFeatures').setAttribute('href', 'data:' + convertedData);
    document.getElementById('exportMetricFeatures').setAttribute('download','MM_fileName.geojson');
}


function showLabelsMM(){
    if (document.getElementById("hideLabelsMM").checked === true){
        document.getElementById("showLabelsMM").checked = true;
        document.getElementById("hideLabelsMM").checked = false;

    //var data= MMGeoJsonData.toGeoJSON();
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
//function showLabels(){
//document.getElementById("showLabels").checked = true;
//document.getElementById("hideLabels").checked = false;
//map.addLayer(labelLayer);
//}

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
    $("#align_Maps").prop("disabled", false);
    //MMGeoJsonData = drawnItems.toGeoJSON();
    //var MMGeoJSON = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(MMGeoJsonData));
    console.log(MMGeoJsonData)
    $.ajax({
        url:'/mmReceiver',
        type: 'POST',
        data: JSON.stringify(MMGeoJsonData),
        contentType : 'application/json',
        //dataType: 'json',
        success: function( resp ) {
            alert( resp );
        },
        error: function(){
            alert("error in posting geojson")
        }
    });

}

/**

 Aligne and integration of data
 **/

function align_Maps() {

    alert("Aligning of Maps is in progress...!");

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

    setTimeout(function(){
       // $.getJSON( '../static/data/metric_map_v2.geojson', function( data ) {
      $.getJSON( '../static/data/metric_map_v2.geojson', function( data ) {

            var onEachFeature = function(feature, layer) {
                layer.bindTooltip(feature.properties.name,{
                    //permanent: true,
                    direction: 'center'
                });
                layer.on({
                    /*'mouseover': function (e) {
                        highlight(e.target);
                    },*/
                    'unload': function (e) {
                        console.log("unload is triggered");
                        dehighlight(e.target);
                    },
                    'click': function(e){
                        select(e.target);
                    }/*,
                    'dblclick': function(e){
                        specialSelect(e.target);
                    }*/
                });

                var key = feature.properties.id;
                metricFeatures.push(key);
            };

            //on clicking and hovering
            function highlight (layer) {
                layer.setStyle({
                    color: '#98fb98'
                });
                /*if (!L.Browser.ie && !L.Browser.opera) {
                    layer.bringToFront();
                }*/
            };

            function dehighlight (layer) {
                if (selected === undefined || selected._leaflet_id !== layer._leaflet_id) {
                    beaconJsonLayer.resetStyle(layer);
                    //map.setZoom(12); //not perfect, a bit buggy
                }
            };

            function highlightZoom(layer){
                layer.setStyle({
                    color: '#98fb98',
                    weight: 3
                });
                map.fitBounds(layer.getBounds());
                if (!L.Browser.ie && !L.Browser.opera) {
                    layer.bringToFront();
                }
            }

            function dehighlightZoom(layer){
                if (selected === undefined || selected._leaflet_id !== layer._leaflet_id) {
                    beaconJsonLayer.resetStyle(layer);
                    //map.setZoom(12); //not perfect, a bit buggy
                    map.fitBounds(beaconJsonLayer.getBounds());
                }
            }

            //what happens when you click on something in leaflet
            var select = function(layer){
                if(connector.matchM !== undefined){
                    connectorFeature = beaconJsonLayer.customGetLayer(connector.matchM);
                }
                if(selected !== undefined && previousOne === "empty"){
                    previousOne = selected;
                }
                if(selected !== undefined && connectorFeature === selected && selected !== layer){
                    previousOne = selected;
                }

                if (selected !== undefined && connectorFeature !== selected) {
                    //console.log("in here but why?"); // sollte hier nicht sein da previousone genau hier eben nicht neu gesetzt werden sollte!!!
                    previousOne = selected;
                }
                if(layer.options.color !== '#98fb98'){
                    highlight(layer);
                    selected = layer;
                } else if(layer.options.color === '#98fb98'){
                    dehighlight(layer);
                }
                /*if(layer === previousOne){
                    dehighlight(layer);
                }*/

                if(previousOne !== undefined && previousOne !== "empty"){
                    if(previousOne !== layer){
                        if(previousOne.options.color === "#98fb98"){
                            dehighlight(previousOne);
                        }
                    }
                }
               
                // the part where we want to find the matches and highlight them in both maps
                var matchesString = JSON.stringify(mapmatches);
                var splittedMatches = matchesString.split(',');
                var clickedID = layer.feature.properties.id;
                var clickedIndex = searchStringInArray(clickedID, splittedMatches);

                if(clickedIndex !== undefined && clickedIndex !== -1){
                    var splittedClicked = splittedMatches[clickedIndex].split(':');
                    var firstId = splittedClicked[0].split("\\");
                    var realFirstId = firstId[1].slice(1);
					console.log(realFirstId);
                    connector.matchS = realFirstId;
                    //previousOne = realFirstId;
                } else{
                    connector.matchS = "noMatch";
                    //connector.matchM = "noMatch";
                    console.log("no match this time");
                }
            };

            beaconJsonLayer = L.geoJson(data,{
                style: function(feature){

                    switch(feature.properties.feat_type){
                        case 'boma':return {
                            color:"#F64A8A",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.5
                        };
                        case 'school':return {
                            color:"#e67e22 ",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.5
                        };
                        case 'pond':return {
                            color:"#1560BD",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.5
                        };
                        case 'olopololi':return {
                            color:"#50C878",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.5
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
                            color:" #465945",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.5
                        };
                        case 'mountain':return {
                            color:" #E49B0F",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.7
                        };
                        case 'path':return {
                            color:"#ED9121",
                            weight: 2,
                            opacity: 1
                        };
                        case 'road':return {
                            color:"#F0DC82",
                            weight: 2,
                            opacity: 1
                        };
                        case 'river':return {
                            color:" #1E90FF",
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
                        radius:4
                    });
                },
                onEachFeature: onEachFeature
            });

            //for getting the id out of a leaflet feature
            L.LayerGroup.include({
                customGetLayer: function (id) {
                    for (var i in this._layers) {
                        if (this._layers[i].feature.properties.id == id) {
                            return this._layers[i];
                        }
                    }
                }
            });

            map.addLayer(beaconJsonLayer);
            map.fitBounds(beaconJsonLayer.getBounds());
        });
		
		//insert the sketch map stuff here
		var sketchSVGFinal = d3.select('#sketchmapplaceholder1').select("svg").select("g")
		var final = sketchSVGFinal.selectAll("polygon,circle,rect");
        final.style("stroke","none");
        final.style("stroke-width","none");
        //final.call(cc);

        final.on('click', function() {
            console.log("inside the click function");
            //doubleClickTest(this);
            //final.on("click", function () {
                if (selectedSM !== undefined && '#' + connector.matchS !== selectedSM) {
                    previous = selectedSM;
                }

                //maybe there is a better way for highlighting the features but I couldn't find one
                if (d3.select(this).style("stroke-miterlimit") === "10" && d3.select(this).style("stroke-dasharray") === "none") {
                    d3.select(this).style("stroke-dasharray", "5");
                    selectedSM = this;
                } else if (d3.select(this).style("stroke") === "none") {
                    d3.select(this).style("stroke", "red");
                    d3.select(this).style("stroke-width", "5");
                    selectedSM = this;
                } else if (d3.select(this).style("stroke-dasharray") !== "none") {
                    d3.select(this).style("stroke-dasharray", "none");
                } else if (d3.select(this).style("stroke-width") !== "none" && d3.select(this).style("stroke") !== "none" && d3.select(this).style("fill") !== "none") {
                    d3.select(this).style("stroke", "none");
                    d3.select(this).style("stroke-width", "none");
                } else {
                    console.log("nothing from the possibilities");
                }

                if (previous !== undefined && previous.id !== "empty") {
                    if (previous !== "#" + this.id && previous !== undefined) {
                        if (d3.select(previous).style("stroke-dasharray") !== "none") {
                            d3.select(previous).style("stroke-dasharray", "none");
                        } else if (d3.select(previous).style("stroke-width") !== "none" && d3.select(previous).style("stroke") !== "none" && d3.select(previous).style("fill") !== "none") {
                            d3.select(previous).style("stroke", "none");
                            d3.select(previous).style("stroke-width", "none");
                        }
                    }
                }

                var matchesString = JSON.stringify(mapmatches);
                var splittedMatches = matchesString.split(',');
                var clickedID = this.id;
                var clickedIndex = searchStringInArray(clickedID, splittedMatches);

                if (clickedIndex !== undefined && clickedIndex !== -1) {
                    var splittedClicked = splittedMatches[clickedIndex].split(':');
                    var firstId = splittedClicked[1].split("\\");
                    var realFirstId = firstId[1].slice(1);
                    console.log(realFirstId);
                    connector.matchM = realFirstId;
                } else {
                    connector.matchM = "noMatch";
                    //connector.matchS = "noMatch";
                    console.log("no match this time");
                }
        });
		 

    }, 3000);

    // ajax call for getting the matches dictionary
    var svgURL = './static/data/SVG/sketch_3.svg'
    $.ajax({
        url:'/alignmentData',
        type: 'GET',
        data: {svgURL:svgURL},
        contentType : 'image/svg+xml',
    //dataType: 'json',
        success: function( resp ) {
            mapmatches = resp;
        },
        error: function(){
            alert("error in getting the alignment data")
        }
    });

}

//the initiation of the connector for metric and sketch map
connector = {
    matchSketch: "nothing",
    matchMetric: "nothing",
    matchSketchListener: function(val) {},
    set matchS(val) {
        this.matchSketch = val;
        this.matchSketchListener(val);
    },
    get matchS() {
        return this.matchSketch;
    },
    registerSketchListener: function(listener) {
        this.matchSketchListener = listener;
    },
    matchMetricListener: function(val) {},
    set matchM(val){
        this.matchMetric = val;
        this.matchMetricListener(val);
    },
    get matchM(){
        return this.matchMetric;
    },
    registerMetricListener: function(listener) {
        this.matchMetricListener = listener;
    }
};

//connector for connecting the maps; here for leaflet
connector.registerMetricListener(function(val) {
    if (selected !== undefined) {
        previousOne = selected;
    }
    if(connector.matchM === "noMatch" && previousOne === undefined){
        console.log("yeah done MM");
    }
    if (connector.matchM === "noMatch" && previousOne !== undefined && previousOne !== "empty"){
        /*var previousFeature1 = beaconJsonLayer.customGetLayer(previousOne.feature.properties.id);
        previousFeature1.fireEvent("unload");*/
        beaconJsonLayer.resetStyle(previousOne);
    }
    if(previousOne === undefined){
        previousOne = "empty";
    }
    if(beaconJsonLayer.customGetLayer(connector.matchM) === previousOne && previousOne !== undefined){
        console.log("yeah done MM");
    }else if(beaconJsonLayer.customGetLayer(connector.matchM) !== previousOne && connector.matchM !== "noMatch"){
        /*var matchesString = JSON.stringify(mapmatches);
        var splittedMatches = matchesString.split(',');
        var clickedIndex = searchStringInArray(connector.matchM, splittedMatches);
        if (clickedIndex !== undefined && clickedIndex !== -1 && clickedIndex !== "nothing") {
            selected = beaconJsonLayer.customGetLayer(connector.matchM);
            /*if (previousOne !== selected && previousOne !== undefined) {
                var previousFeature = beaconJsonLayer.customGetLayer(previousOne.feature.properties.id);
                previousFeature.fireEvent("click");
                beaconJsonLayer.resetStyle(previousFeature);
                //disableEditing(previousFeature);
            }
        }*/
        selected = beaconJsonLayer.customGetLayer(connector.matchM);
        selected.fireEvent("click");
    }
});

function searchStringInArray (str, strArray) {
    for (var j=0; j<strArray.length; j++) {
        if (strArray[j].match(str)) return j;
    }
    return -1;
}

function zoomEvent(){
    console.log('at least im here');
    var zoomLevel = map.getZoom();
    if (zoomOut == true) {
        map.setZoom(zoomLevel - 1);
    } else {
        map.setZoom(zoomLevel + 1);
    }
}

function panEvent(){
    console.log("im in the movestart");
    //set new view for leaflet map the same as d3 map was panned
}

//(more important) TODO: connect zoom and pan in the two maps...somehow...maybe by looking at zoomextent and k in SM. Pan will be really hard

//(optional) TODO: on dehighlight the zoom is set back to full extent. Unfortunately also when just hovering over other objects when something is already highlighted