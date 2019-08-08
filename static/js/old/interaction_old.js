//TODO: put every interactive part of the two scripts into this script
// A collection of functions that can be called from the other scripts?

var connector;
//var sketchMapClick;
//var searchStringInArray;
var mycolor = d3.rgb(0, 0, 0);
var connectorFeature;
var metricFeatures;

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

// sketch map interaction
var sketchMapClick = function(clickedFeature, previousFeature, selectedFeature){
    console.log("inside the click function");
    if (selectedFeature !== undefined && '#' + connector.matchS !== selectedFeature) {
        previousFeature = selectedFeature;
    }

    //maybe there is a better way for highlighting the features but I couldn't find one
    if (d3.select(clickedFeature).style("stroke-miterlimit") === "10" && d3.select(clickedFeature).style("stroke-dasharray") === "none") {
        d3.select(clickedFeature).style("stroke-dasharray", "5");
        selectedFeature = clickedFeature;
    } else if (d3.select(clickedFeature).style("stroke") === "none") {
        d3.select(clickedFeature).style("stroke", mycolor);
        d3.select(clickedFeature).style("stroke-width", "10");
        selectedFeature = clickedFeature;
    } else if (d3.select(clickedFeature).style("stroke-dasharray") !== "none") {
        d3.select(clickedFeature).style("stroke-dasharray", "none");
    } else if (d3.select(clickedFeature).style("stroke-width") !== "none" && d3.select(clickedFeature).style("stroke") !== "none" && d3.select(clickedFeature).style("fill") !== "none") {
        d3.select(clickedFeature).style("stroke", "none");
        d3.select(clickedFeature).style("stroke-width", "none");
    } else {
        console.log("nothing from the possibilities");
    }

    if (previousFeature !== undefined && previousFeature.id !== "empty") {
        if (previousFeature !== "#" + clickedFeature.id && previousFeature !== undefined) {
            if (d3.select(previousFeature).style("stroke-dasharray") !== "none") {
                d3.select(previousFeature).style("stroke-dasharray", "none");
            } else if (d3.select(previousFeature).style("stroke-width") !== "none" && d3.select(previousFeature).style("stroke") !== "none" && d3.select(previousFeature).style("fill") !== "none") {
                d3.select(previousFeature).style("stroke", "none");
                d3.select(previousFeature).style("stroke-width", "none");
            }
        }
    }
    return selectedFeature;
};

// function that is triggered when the listener notices a change in the connector
var connectorSketchMap = function(selectedFeature, previousFeature){
    if (selectedFeature !== undefined) {
        previousFeature = selectedFeature;
    }
    if(connector.matchS === "noMatch" && previousFeature === undefined){
        console.log("yeah done SM");
    }
    if(connector.matchS === "noMatch" && previousFeature !== undefined && previousFeature.id !== "empty"){
        if (d3.select(previousFeature).style("stroke-dasharray") !== "none") {
            d3.select(previousFeature).style("stroke-dasharray", "none");
        } else if (d3.select(previousFeature).style("stroke-width") !== "none" && d3.select(previousFeature).style("stroke") !== "none" && d3.select(previousFeature).style("fill") !== "none") {
            d3.select(previousFeature).style("stroke", "none");
            d3.select(previousFeature).style("stroke-width", "none");
        }
    }
    if(previousFeature === undefined){
        previousFeature = {};
        previousFeature.id = "empty";
    }
    if('#' + connector.matchS === '#' + previousFeature.id && previousFeature !== undefined){
        console.log("yeah done SM");
    }else if('#' + connector.matchS !== '#' + previousFeature.id && connector.matchS !== "noMatch"){
        selectedFeature = '#' + connector.matchS;
        var clickNeeded = true;
        //$(selectedFeature).d3Click();
    }
    var returnArray = [];
    returnArray.push(selectedFeature, previousFeature, clickNeeded);
    return returnArray;
};

// the check for matches and setting of the respective parameters
var matchesCheck = function(mapType, matchesDictionary, feature) {
    var matchesString = JSON.stringify(matchesDictionary);
    var splittedMatches = matchesString.split(',');
    if (mapType == "sketch") {
        var clickedIDSM = feature.id;
        var clickedIndexSM = searchStringInArray(clickedIDSM, splittedMatches);
        if (clickedIndexSM !== undefined && clickedIndexSM !== -1) {
            var splittedClickedSM = splittedMatches[clickedIndexSM].split(':');
            var firstIdSM = splittedClickedSM[1].split("\\");
            connector.matchM = firstIdSM[1].slice(1);
        } else {
            connector.matchM = "noMatch";
            console.log("no match this time");
        }
    }
    else if (mapType == "metric") {
        var clickedID = feature.feature.properties.id;
        var clickedIndex = searchStringInArray(clickedID, splittedMatches);
        if (clickedIndex !== undefined && clickedIndex !== -1) {
            var splittedClicked = splittedMatches[clickedIndex].split(':');
            var firstId = splittedClicked[0].split("\\");
            connector.matchS = firstId[1].slice(1);
        } else {
            connector.matchS = "noMatch";
            console.log("no match this time");
        }
    }
};

// on each feature of the leaflet map
/*var onEachFeatureClosure = function(selectedFeature, previousFeature, matchesDictionary) {
    return function onEachFeature(feature, layer) {
        layer.bindTooltip(feature.properties.name, {
            //permanent: true,
            direction: 'center'
        });
        layer.on({
            /*'mouseover': function (e) {
             highlight(e.target);
             },
            'unload': function (e) {
                console.log("unload is triggered");
                dehighlight(e.target, selectedFeature);
            },
            'click': function (e) {
                select(e.target, previousFeature, selectedFeature, matchesDictionary);
            }/*,
             'dblclick': function(e){
             specialSelect(e.target);
             }
        });

        var key = feature.properties.id;
        metricFeatures.push(key);
    };
}*/

//on clicking and hovering
var highlight = function(layer) {
    layer.setStyle({
        color: '#98fb98'
    });
    /*if (!L.Browser.ie && !L.Browser.opera) {
     layer.bringToFront();
     }*/
};

// dehighlight highlighted features
var dehighlight = function(layer, selectedFeature) {
    if (selectedFeature === undefined || selectedFeature._leaflet_id !== layer._leaflet_id) {
        beaconJsonLayer.resetStyle(layer);
        //map.setZoom(12); //not perfect, a bit buggy
    }
};

//what happens when you click on something in leaflet
var select = function(layer, previousFeature, selectedFeature, matchesDictionary) {
    if (connector.matchM !== undefined) {
        connectorFeature = beaconJsonLayer.customGetLayer(connector.matchM);
    }
    if (selectedFeature !== undefined && connectorFeature !== selectedFeature) {
        previousFeature = selectedFeature;
    }
    if (selectedFeature !== undefined && previousFeature === "empty") {
        previousFeature = selectedFeature;
    }
    if (selectedFeature !== undefined && connectorFeature === selectedFeature && selectedFeature !== layer) {
        previousFeature = selectedFeature;
    }
    if (layer.options.color !== '#98fb98') {
        highlight(layer);
        selectedFeature = layer;
    } else if (layer.options.color === '#98fb98') {
        dehighlight(layer, selectedFeature);
    }
    /*if(layer === previousOne){
     dehighlight(layer);
     }*/
    if (previousFeature !== undefined && previousFeature !== "empty") {
        if (previousFeature !== layer) {
            if (previousFeature.options.color === "#98fb98") {
                dehighlight(previousFeature, selectedFeature);
            }
        }
    }

    matchesCheck("metric", matchesDictionary, layer);

    var returnArray = [];
    returnArray.push(selectedFeature, previousFeature);
    return returnArray;
}

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

var connectorMetricMap = function(selectedFeature, previousFeature){
    if (selectedFeature !== undefined) {
        previousFeature = selectedFeature;
    }
    if(connector.matchM === "noMatch" && previousFeature === undefined){
        console.log("yeah done MM");
    }
    if (connector.matchM === "noMatch" && previousFeature !== undefined && previousFeature !== "empty"){
        /*var previousFeature1 = beaconJsonLayer.customGetLayer(previousOne.feature.properties.id);
         previousFeature1.fireEvent("unload");*/
        beaconJsonLayer.resetStyle(previousFeature);
    }
    if(previousFeature === undefined){
        previousFeature = "empty";
    }
    if(beaconJsonLayer.customGetLayer(connector.matchM) === previousFeature && previousFeature !== undefined){
        console.log("yeah done MM");
    }else if(beaconJsonLayer.customGetLayer(connector.matchM) !== previousFeature && connector.matchM !== "noMatch"){
        selectedFeature = beaconJsonLayer.customGetLayer(connector.matchM);
        //selectedFeature.fireEvent("click");
        var clickNeeded = true;
    }
    var returnArray = [];
    returnArray.push(selectedFeature,previousFeature, clickNeeded);
    return returnArray;
};

// helping function to find the index of a stirng in an array
var searchStringInArray = function(str, strArray) {
    for (var j=0; j<strArray.length; j++) {
        if (strArray[j].match(str)) return j;
    }
    return -1;
};