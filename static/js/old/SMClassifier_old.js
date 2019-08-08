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
var img;
var mapmatches;
var previous = undefined;
var selectedSM = undefined;
var sketchZoomCount = 0;
var fileName_full;

function showLabelsSM(){
    if (document.getElementById("hideLabelsSM").checked === true){
        document.getElementById("showLabelsSM").checked = true;
        document.getElementById("hideLabelsSM").checked = false;

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

function hideLabelsSM(){
    if (document.getElementById("showLabelsSM").checked === true) {
        document.getElementById("hideLabelsSM").checked = true;
        document.getElementById("showLabelsSM").checked = false;
        if (labelLayer !== undefined) {
            map.removeLayer(labelLayer);
        }
    }
}

/**
 * function allows you to load Sketch map in the panel
 * @param element
 */

function loadSketchMap(element){
    var fileList = document.getElementById('SketchMapInputbutton').files;
    //loadEditingToolforSM(sm_map);
    $("#SMLinks").show();
    $("#MMLinks").hide();
    $("#processSketchMap").prop("disabled", false);
    for (var i=0;i<fileList.length;i++){
        var imageLoc = document.getElementById("sketchmapplaceholder1");
        //call function
        randerSketchMapFiles(fileList[i],imageLoc);
    }
}

function randerSketchMapFiles(imageFile,location){
    var reader= new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = function(e){
        imageFile.src = this.result;
        var sm1 = document.getElementById('sm1');
        //document.getElementById('sm1').src = imageFile.src;
        img = document.createElement("img");
        fileName_full = imageFile.name;
        //img.src = imageFile.src;
        //location.appendChild(img);
        fName = fileName_full.split(".");
        fileName = fName[0];
        $('#span_sm1').html(fileName);
        //call resizer function
        var imageUrl = "./data_original/"+fileName_full;
              $.ajax({
                    url:'/smResizer',
                    type: 'GET',
                    data: {path:imageUrl},
                    contentType : 'text/plain',
                    //dataType: 'json',
                    success: function( resp ) {
                        sm1.setAttribute('src', "./static/data/modified/"+fileName_full);
                        img.setAttribute('src', "./static/data/modified/"+fileName_full);
                        location.appendChild(img);

                    }
        });
    }
}

function addSVG (){
    var url = 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Ghostscript_Tiger.svg';
    var req = new XMLHttpRequest();
    req.onload = function(resp){
        var xml = this.responseXML;
        var importedNode = document.importNode(xml.documentElement, true);
        var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.appendChild(importedNode);
        g.setAttribute('class', 'svglayer');
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.appendChild(g);
        svg.addEventListener('click', function(e) {
            console.log(e.target.id)
        })
        document.body.appendChild(svg);
    };
    req.open("GET", url, true);
    req.send();
}
/**
 * Load Sketch map


function loadEditingToolforSM(sm_map){

    drawnItems_sm=new L.FeatureGroup();
    //drawnItems.addTo(map);
    sm_map.addLayer(drawnItems_sm);

    // Snapping
    var guideLayers = new Array();

    var drawControl = new L.Control.Draw({
        draw:{

            polyline: {
                guideLayers: guideLayers,
                //snapDistance: 5 ,
                snapVertices:true,
                //allowIntersection: true, // Restricts shapes to simple polygons

                drawError: {
                    color: 'blue', // Color the shape will turn when intersects
                    message: '<strong>Oh snap!<strong> you can\'t draw that!', // Message that will show when intersect
                    weight:01,
                },
                shapeOptions: {
                    color: 'blue',
                    weight:01,
                }
            },
            polygon: {
                guideLayers: guideLayers,
                snapDistance: 15 ,
                snapVertices:true,
                //allowIntersection: true, // Restricts shapes to simple polygons

                drawError: {
                    color: '#e1e100', // Color the shape will turn when intersects
                    message: '<strong>Oh snap!<strong> you can\'t draw that!', // Message that will show when intersect
                    weight:01,
                },
                shapeOptions: {
                    color: '#97009c',
                    weight:01,
                }
            },

            marker: false,
            circle:false,
            rectangle: false,

        },
        edit: {
            featureGroup: drawnItems_sm,
            edit: true
        }
    });
    sm_map.addControl(drawControl);

   //now how drawining works
    sm_map.on('draw:created',function(event){
        var layer = event.layer;
        var type = event.layerType;
        feature=layer.feature=layer.feature||{};
        feature.type=feature.type||"Feature";
        var props =feature.properties=feature.properties||{};
        props.FID=null;
        props.id=null;
        props.isRoute=null;
        props.name=null;
        props.feat_type="something";
        props.sm_sk_type="rectangle | olopololi | some stuff";
        props.descriptn="something";
        //props.desc=null;
        //props.image=null;
        drawnItems_sm.addLayer(layer);
        if (type==="polyline"){
            // Make line editable
            layer.editing.enable();
            // Activate snapping
            layer.snapediting = new L.Handler.PolylineSnap(sm_map,layer);
            for(var i = 0;i < guideLayers.length; i++) {
                // Add every already drawn layer to snap list
                layer.snapediting.addGuideLayer(guideLayers[i]);
                // Add the currently drawn layer to the snap list of the already drawn layers
                guideLayers[i].snapediting.addGuideLayer(layer);
                guideLayers[i].snapediting.enable();
            }
            layer.snapediting.enable();
            // Add to drawnItems
            drawnItems_sm.addLayer(layer);
            // Add newly drawn feature to list of snappable features
            guideLayers.push(layer);

            addStreetPopUpSM(layer);
        }
        if (type==="polygon"){

            // Make line editable
            layer.editing.enable();
            // Activate snapping
            layer.snapediting = new L.Handler.PolylineSnap(sm_map,layer);
            for(var i = 0;i < guideLayers.length; i++) {
                // Add every already drawn layer to snap list
                layer.snapediting.addGuideLayer(guideLayers[i]);
                // Add the currently drawn layer to the snap list of the already drawn layers
                guideLayers[i].snapediting.addGuideLayer(layer);
                guideLayers[i].snapediting.enable();
            }
            layer.snapediting.enable();
            // Add to drawnItems
            drawnItems_sm.addLayer(layer);
            // Add newly drawn feature to list of snappable features
            guideLayers.push(layer);

            addLandmarkPopupSM(layer);
        }

    });
}

function addStreetPopUpSM(layer){
    var options= MMStreetIDs;
    var popUp_div= document.createElement('div');
    popUp_div.setAttribute("id","popUp");

    var fetureID_div= document.createElement('div');
    fetureID_div.setAttribute("id","fetureID_div");
    var checkedID;
    for (var i = 0; i <options.length; i++) {
        checkedID = document.createElement('input');
        var label = document.createElement('label');

        checkedID.setAttribute('type', 'checkbox');//
        checkedID.setAttribute('value', options[i]);// add rate value
        checkedID.setAttribute('name', options[i]);// add rate name
        checkedID.setAttribute('id', options[i]);// add rate value
        label.setAttribute('for', options[i]);// set for attribute for each label
        label.setAttribute('id', options[i]);// set id for label

        var opt = document.createElement('option');
        opt.value = options[i];
        opt.appendChild(document.createTextNode(options[i]));

        checkedID.appendChild(opt);
        label.appendChild(opt);

        fetureID_div.append(checkedID);
        fetureID_div.append(label);
    }
    var isRouteDIV= document.createElement('div');
    isRouteDIV.setAttribute("id","isRouteDIV")

    var labelRoute = document.createElement('label');
    labelRoute.id = "id";
    labelRoute.setAttribute = ("for", "isRoute");
    labelRoute.appendChild(document.createTextNode("RouteSegment?"));

    var isRoute=document.createElement("input");
    isRoute.type = "checkbox";
    isRoute.id = "isRoute";
    isRoute.name = "isRoute";
    isRoute.value = "No";
    isRouteDIV.append(isRoute)
    isRouteDIV.append(labelRoute)

    popUp_div.append(fetureID_div);
    popUp_div.append(isRouteDIV);

    layer.bindPopup(popUp_div);

    // if checkbox is checked then pass the value to feature_id

    var streetIds;
    fetureID_div.addEventListener ("click", function(event){
        //var elementId = event.target.id;
        if ($(event.target).is('[type="checkbox"]')){
            if ($ (event.target).is (":checked")){
                //console.log (event.target.id);
                var val = event.target.value;
                //console.log (val);
                streetIds = "sm_"+val;
            }
        }
    });
   // if checkbox is checked then pass the value to feature id

    popUp_div.addEventListener("focusout", function(event){
        console.log (streetIds);
        layer.feature.properties.id = streetIds;
        layer.feature.properties.FID = streetIds;
        layer.feature.properties.name = streetIds;
    });

    isRoute.addEventListener("click",RouteClickedFunction);
    function RouteClickedFunction(){
        //alert(isRoute.value);
        isRoute.setAttribute("value","Yes");
        layer.feature.properties.isRoute = isRoute.value;
    }
    /**
     layer.on("popupopen",function(){
		input.value = layer.feature.properties.id;
		isRoute.value = layer.feature.properties.isRoute;
		input.focus();
	});
  }
  function addLandmarkPopupSM(layer){
    var options = MMLandmarksIDs;
    var SM_landmarkID_div= document.createElement('div');
    SM_landmarkID_div.setAttribute("id","SM_landmarkID_div");

        for (var i = 0; i <options.length; i++) {
            var lm_input = document.createElement('input');
            var lm_label = document.createElement('label');
            lm_input.setAttribute('type', 'checkbox');//
            lm_input.setAttribute('value', options[i]);// add rate value
            lm_input.setAttribute('name', options[i]);// add rate name
            lm_input.setAttribute('id', options[i]);// add rate value

            lm_label.setAttribute('for', options[i]);// set for attribute for each label
            lm_label.setAttribute('id', options[i]);// set id for label

            var opt = document.createElement('option');
            opt.value = options[i];
            opt.appendChild(document.createTextNode(options[i]));

            lm_input.appendChild(opt);
            lm_label.appendChild(opt);

            SM_landmarkID_div.append(lm_input);
            SM_landmarkID_div.append(lm_label);

        }
    layer.bindPopup(SM_landmarkID_div);

    var ladmark_id;
    SM_landmarkID_div.addEventListener ("click", function(event){
        if ($(event.target).is('[type="checkbox"]')){
            if ($ (event.target).is (":checked")){
                //console.log (event.target.id);
                var val_lm = event.target.value;
                //console.log (val_lm);
                ladmark_id = val_lm;
            }
        }
    });

    SM_landmarkID_div.addEventListener("focusout", function(e){
        console.log (ladmark_id);
        layer.feature.properties.id = ladmark_id
        layer.feature.properties.FID = ladmark_id;
        layer.feature.properties.name = ladmark_id;
    });
    /**
     layer.on("popupopen",function(){
		lm_input.value = layer.feature.properties.id;
		lm_input.focus();
	});
   }
**/

function downloadJsonSM(){
    SMGeoJsonData = drawnItems_sm.toGeoJSON();
    var SMGeoJSON = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(SMGeoJsonData));
    document.getElementById('exportSketchFeatures').setAttribute('href', 'data:' + SMGeoJSON);
    document.getElementById('exportSketchFeatures').setAttribute('download','SMdata.geojson');
}

function ProcessMap(){
    $("#metricmapplaceholder").hide();
    $("sketch4").hide();
    //$("#sketchmapplaceholder1").hide();
    $("#SMLinks").hide();
    $("#MMLinks").hide();
    $("#resultholder").show();

}

/**
 - qualify_SM function takes the geojson from sketch maps and pass
 - it to the paython function "smReceiver" that connect qualifier plugin
 **/
function qualify_SM(){
    $("#qualify_MM").prop("disabled", false);
    fName = fileName_full.split(".");
    fileName = fName[0];

    //var svgURL = './static/data/SVG/'+fileName+'.svg';
    var svgURL = './static/data/SVG/sketch_3.svg'
    $.ajax({
        url:'/smReceiver',
        type: 'GET',
        data: {svgURL:svgURL},
        contentType : 'image/svg+xml',
        //dataType: 'json',
        success: function( resp ) {
            alert( resp );
        }
    });

}


/**
 * at the moment it just loads the pre-processed svg image
 * later we have to attached this to the recognition python code
 * @returns
 */

function ProcessSketchMap() {
    $("#qualify_SM").prop("disabled", false);
    alert("Processing Sketch Map...!");
	imgHolder = img.parentNode;
	imgHolder.removeChild(img);
    //document.getElementById('sketchmapplaceholder1').removeChild(img);
    var width = 800,
        height = 600;
    var centered;
    var viewPort = {
        x: 0,
        y: 0,
        width: 800,
        height: 600
    };
    var sketchZoom = d3.zoom();
    var sketchSVGFinal = d3.select('#sketchmapplaceholder1').append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(sketchZoom.scaleExtent([0.2, 2]).on("zoom", sketchZoomCallback))
        .append("g");

    function responseCallback(xhr) {
        sketchSVGFinal.append(function () {
            return xhr.responseXML.querySelector('svg');
        }).attr("width", 800)
            .attr("height", 600)
            .attr("x", 0)
            .attr("y", 0);
    }

    // call sketchProcess code
   var svgURL;
   //var svgURL = './static/data/SVG/sketch_2.svg'
  var imageUrl = "./data_original/GoodOne.bmp";
          $.ajax({
                url:'/processSketchMap',
                type: 'GET',
                data: {imageURL:imageUrl},
                contentType : 'image/png',
                //contentType : 'image/svg+xml',
                //dataType: 'json',
                success: function( resp ) {
                    //alert(resp);
                    svgURL = resp;
                    d3.request('./static/data/SVG/sketch_3.svg')
                    // d3.request(svgURL)
                        .mimeType("image/svg+xml")
                        .response(responseCallback)
                        .get();
                    alert( resp );
                }
    });
//d3.request('../static/data/sketch_2.svg')
//d3.request('../static/data/modified/GoodOne.svg')
        //d3.request(svgData)
       //.mimeType("image/svg+xml")
       //.response(responseCallback)
       //.get();

//without timeout the selection would not be loaded
    setTimeout(function () {
        /*function clickcancel() {
            console.log("at the beginning");
            // we want to a distinguish single/double click
            // details http://bl.ocks.org/couchand/6394506
            var dispatcher = d3.dispatch('click', 'dblclick');
            function cc(selection) {
                var down, tolerance = 5, last, wait = null, args;
                // euclidean distance
                function dist(a, b) {
                    return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
                }
                selection.on('mousedown', function() {
                    down = d3.mouse(document.body);
                    last = +new Date();
                    args = arguments;
                });
                selection.on('mouseup', function() {
                    if (dist(down, d3.mouse(document.body)) > tolerance) {
                        return;
                    } else {
                        if (wait) {
                            window.clearTimeout(wait);
                            wait = null;
                            dispatcher.apply("dblclick", this, args);
                        } else {
                            wait = window.setTimeout((function() {
                                return function() {
                                    dispatcher.apply("click", this, args);
                                    wait = null;
                                };
                            })(), 300);
                        }
                    }
                });
            };
            // Copies a variable number of methods from source to target.
            var d3rebind = function(target, source) {
                var i = 1, n = arguments.length, method;
                while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
                return target;
            };

            // Method is assumed to be a standard D3 getter-setter:
            // If passed with no arguments, gets the value.
            // If passed with arguments, sets the value and returns the target.
            function d3_rebind(target, source, method) {
                return function() {
                    var value = method.apply(source, arguments);
                    return value === source ? target : value;
                };
            }
            return d3rebind(cc, dispatcher, 'on');
        }

        var clicked = false;
        function doubleClickTest(feature){
            if(clicked == false) {
                var firstDate = new Date();
                if (clicked == true) {
                    var secondDate = new Date();
                    clicked = false;
                    var time = secondDate - firstDate;
                    console.log(time);
                    console.log(firstDate);
                    console.log(secondDate);
                    if (time < 0.2) {
                        $(feature).d3DblClick();
                    } else {
                        $(feature).d3Click();
                    }
                }
                clicked = true;
            }
        }*/


        //var cc = clickcancel();
        var final = sketchSVGFinal.selectAll("path,polygon,circle,rect,line");
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

                /*if (this && centered !== this) {
                 var extent = this.getBBox();
                 x = extent.x - 200;
                 y = extent.y - 200;
                 //x = centroid[0] - 200;
                 //y = centroid[1] - 200;
                 k = 2;
                 centered = this;
                 } else {
                 x = width / 2;
                 y = height / 2;
                 k = 1;
                 centered = null;
                 }

                 final.transition()
                 .duration(750)
                 .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");*/
            //});
        });//somehow say that here it is also possible to zoom and pan

        /*cc.on('dblclick', function() {
            //final.on("dblclick", function () {
            console.log("inside the double click function");
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
                    console.log("no match this time");
                }

                if (this && centered !== this) {
                    var extent = this.getBBox();
                    x = extent.x - 200;
                    y = extent.y - 200;
                    //x = centroid[0] - 200;
                    //y = centroid[1] - 200;
                    k = 2;
                    centered = this;
                } else {
                    x = width / 2;
                    y = height / 2;
                    k = 1;
                    centered = null;
                }

                final.transition()
                    .duration(750)
                    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");
            //});
        });*/

    }, 1000);

    //from Salmans code for zooming and panning (and even rotating if that's necessary) in D3
    var k,
        sketch_bbox;

    var k2 = 1;

    function sketchZoomCallback() {
        //console.log(d3.event.sourceEvent);
        /*if (d3.event.sourceEvent.ctrlKey) {
            dragged();
        }
        else {*/
            if (sketchZoomCount == 0) {
                sketchSVGFinal.attr("transform", d3.event.transform);
                //console.log(this);
                var transformSketch = d3.zoomTransform(this);
                sketch_bbox = d3.select("svg").node().getBBox();
                console.log(sketch_bbox);
                k = transformSketch.k;
                sketchZoomCount++;
                //metricZoomCallback(); maybe needed for combining both;
                /*console.log(d3.event.sourceEvent.type);
                var eventType = d3.event.sourceEvent.type;
                if(eventType == "wheel") {
                    if (k2 > k) {
                        zoomOut = true;
                        zoomEvent(); //rauszoomen nach higlhight
                    }
                    else {
                        zoomOut = false;
                        zoomEvent();
                    }
                }else{
                    //console.log(sketch_bbox);
                    //console.log(transformSketch);
                    //console.log(k);
                    panEvent();
                }*/
                sketchZoomCount--;
            }
        }
        k2 = k;
    //}

    /*function dragged() {
        var me = sketchSVGFinal.node();
        var x1 = me.getBBox().x + me.getBBox().width / 2;
        var y1 = me.getBBox().y + me.getBBox().height / 2;
        sketchSVGFinal.attr("transform", "rotate(" + d3.event.sourceEvent.y + "," + x1 + "," + y1 + ")");
        //metricSVG.attr("transform","rotate("+d3.event.sourceEvent.y+","+x1+","+y1+")" );
    }*/
}

jQuery.fn.d3Click = function () {
    this.each(function (i, e) {
        var evt = new MouseEvent("click");
        e.dispatchEvent(evt);
    });
};

jQuery.fn.d3DblClick = function () {
    this.each(function (i, e) {
        var evt = new MouseEvent("dblclick");
        e.dispatchEvent(evt);
    });
};

//connector for connecting the clicks on the D3 map and the leaflet map. Later also for zooming and panning hopefully
connector.registerSketchListener(function(val) {
    if (selectedSM !== undefined) {
        previous = selectedSM;
    }
    if(connector.matchS === "noMatch" && previous === undefined){
        console.log("yeah done SM");
    }
    if(connector.matchS === "noMatch" && previous !== undefined && previous.id !== "empty"){
        if (d3.select(previous).style("stroke-dasharray") !== "none") {
            d3.select(previous).style("stroke-dasharray", "none");
        } else if (d3.select(previous).style("stroke-width") !== "none" && d3.select(previous).style("stroke") !== "none" && d3.select(previous).style("fill") !== "none") {
            d3.select(previous).style("stroke", "none");
            d3.select(previous).style("stroke-width", "none");
        }
    }
    if(previous === undefined){
        previous = {};
        previous.id = "empty";
    }
    if('#' + connector.matchS === '#' + previous.id && previous !== undefined){
        console.log("yeah done SM");
    }else if('#' + connector.matchS !== '#' + previous.id && connector.matchS !== "noMatch"){
        /*var matchesString = JSON.stringify(mapmatches);
        var splittedMatches = matchesString.split(',');
        var clickedIndex = searchStringInArray(connector.matchS, splittedMatches);
        if (clickedIndex !== undefined && clickedIndex !== -1 && clickedIndex !== "nothing") {
            selectedSM = '#' + connector.matchS;
            /*
             if(d3.select(selectedSM).style("stroke-miterlimit") === "10" && d3.select(selectedSM).style("stroke-dasharray") === "none") {
             d3.select(selectedSM).style("stroke-dasharray", "5");
             } else if(d3.select(selectedSM).style("stroke") === "none"){
             d3.select(selectedSM).style("stroke", "red");
             d3.select(selectedSM).style("stroke-width", "5");
             }
             if (previous !== selectedSM && previous !== undefined){
             console.log("im here");
             if(d3.select(previous).style("stroke-dasharray") !== "none"){
             d3.select(previous).style("stroke-dasharray", "none");
             } else if(d3.select(previous).style("stroke-width") !== "none" && d3.select(previous).style("stroke") !== "none" && d3.select(previous).style("fill") !== "none"){
             d3.select(previous).style("stroke", "none");
             d3.select(previous).style("stroke-width", "none");
             }
             }
        }*/
        selectedSM = '#' + connector.matchS;
        $(selectedSM).d3Click();
    }
});