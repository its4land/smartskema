var connector;
var mycolor = d3.rgb(0, 0, 0);
var connectorFeature;
var metricFeatures;
var checked = false;

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
var mapClickD3 = function(clickedFeature, previousFeature, selectedFeature, mapType){
    console.log("inside the click function");
    if (selectedFeature !== undefined && '#' + connector.matchS !== selectedFeature && mapType == "sketch") {
        previousFeature = selectedFeature;
    }

    if (selectedFeature !== undefined && '#' + connector.matchM !== selectedFeature && mapType == "metric") {
        previousFeature = selectedFeature;
    }

    //maybe there is a better way for highlighting the features but I couldn't find one
    if (d3.select(clickedFeature).style("stroke-miterlimit") === "10" && d3.select(clickedFeature).style("stroke-dasharray") === "none") {
        d3.select(clickedFeature).style("stroke-dasharray", "5");
        selectedFeature = clickedFeature;
    } else if (d3.select(clickedFeature).style("stroke") === "none") {
        d3.select(clickedFeature).style("stroke", mycolor);
        d3.select(clickedFeature).style("stroke-width", "5");
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
                console.log("seems like im never in here :(");
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
    }else if('#' + connector.matchS !== '#' + previousFeature.id && connector.matchS !== "noMatch" && connector.matchS !== ""){
        selectedFeature = '#' + connector.matchS;
        var clickNeeded = true;
    }
    var returnArray = [];
    returnArray.push(selectedFeature, previousFeature, clickNeeded);
    return returnArray;
};

var connectorMetricMap = function(selectedFeature, previousFeature){
    if (selectedFeature !== undefined) {
        previousFeature = selectedFeature;
    }
    if(connector.matchM === "noMatch" && previousFeature === undefined){
        console.log("yeah done MM");
    }
    if(connector.matchM === "noMatch" && previousFeature !== undefined && previousFeature.id !== "empty"){
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
    if('#' + connector.matchM === '#' + previousFeature.id && previousFeature !== undefined){
        console.log("yeah done MM");
    }else if('#' + connector.matchM !== '#' + previousFeature.id && connector.matchM !== "noMatch" && connector.matchM !== ""){
        selectedFeature = '#' + connector.matchM;
        var clickNeeded = true;
    }
    var returnArray = [];
    returnArray.push(selectedFeature,previousFeature, clickNeeded);
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
        var clickedIDMM = feature.id;
        console.log(clickedIDMM);
        var clickedIndexMM = searchStringInArray(clickedIDMM, splittedMatches);
        if (clickedIndexMM !== undefined && clickedIndexMM !== -1) {
            var splittedClickedMM = splittedMatches[clickedIndexMM].split(':');
            var firstIdMM = splittedClickedMM[0].split("\\");
            connector.matchS = firstIdMM[1].slice(1);
        } else {
            connector.matchS = "noMatch";
            console.log("no match this time");
        }
    }
};

// helping function to find the index of a stirng in an array
var searchStringInArray = function(str, strArray) {
    for (var j=0; j<strArray.length; j++) {
        if (strArray[j].match(str)) return j;
    }
    return -1;
};