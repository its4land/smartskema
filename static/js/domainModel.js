function get_popup_contents() {

    //get the rights and create selection options
    rights = get_DM_rights();
    console.log("rights....", rights);

    //get parties
    parties = get_DM_parties();
    console.log("party....", parties);

    // get all RRRs
    rrrs = get_RRRs();
    console.log("rrrs....", rrrs);

}



// var sm_map;
// var map;
// var feat_id;
// var feat_type;
//
// var ownership_type;
// var main_popup;
// var popupContent_div;
// var fileName;
// var popLocation;
// var myPartyDiv;
//
//
// /**
//  * function allows you to load Sketch map in the panel
//  * @param element
//  */
// function loadSketchMap(element) {
//     var fileList = document.getElementById('LADM_SketchMapInputbutton').files
//     console.log(fileList);
//     sm_map = new L.map('LADM_sketchmapplaceholder', {
//         crs: L.CRS.Simple,
//         minZoom: 0
//     });
//     for (var i = 0; i < fileList.length; i++) {
//         //function call
//         randerSketchMapFiles(fileList[i], sm_map);
//     }
//     //function call
//     overlay_svg_image();
// }
//
// /**
//  function overlay the svg on png image
//  **/
// function overlay_svg_image() {
//     d3.xml("../static/data/sketch_2.svg", "image/svg+xml", function (error, collection) {
//         if (error) throw error;
//
//         var ele = d3.select(sm_map.getPanes().overlayPane).node().appendChild(collection.documentElement);
//         //console.log(ele);
//         svgObjectInteraction(sm_map);
//     });
// }
//
// /**
//  function renders the png image in the leaflet
//  **/
// function randerSketchMapFiles(imageFile, sm_map) {
//     var reader = new FileReader();
//     reader.readAsDataURL(imageFile);
//     var bounds = [[0, 0], [800, 850]];
//
//     reader.onload = function (e) {
//         imageFile.src = this.result;
//         var fileName_full = imageFile.name;
//         document.getElementById('sm1').src = imageFile.src;
//
//         var sketchMapLayer = L.imageOverlay(imageFile.src, bounds, {
//             format: 'image/png',
//             opacity: 0.6,
//         }).addTo(sm_map);
//
//         sm_map.fitBounds(bounds);
//         fName = fileName_full.split(".");
//         fileName = fName[0];
//         $('#span_sm1').html(fileName);
//     }
// }
//
// /**
//  - the function extract svg elements
//  - allow interaction on click
//  -
//  **/
// function svgObjectInteraction(sm_map) {
//     d3.select("svg").selectAll("path,polygon,circle,rect,line")
//         .on('click', function (d, i) {
//             feat_id = $(this).attr('id');
//             feat_type = $(this).attr('smart_skema_type');
//
//             console.log("CLICK on id", feat_id);
//             console.log("CLICK on smart_skema", feat_type);
//             //function call
//             get_main_popup();
//             d3.select(this)
//                 .transition()//Set transition
//                 .style('stroke', '#039BE5')
//                 .attr("stroke-width", "5px");
//         })
//         .on('mouseover', mouse_over)
//         .on('mouseout', mouse_out);
// }
//
// //svg elelment interaction
// function mouse_over() {
//     d3.select(this)
//         .transition()//Set transition
//         .attr("stroke", "#039BE5")
//         .attr("stroke-width", "5px");
// }
//
// function mouse_out() {
//     d3.select(this)
//         .transition()
//         .attr("stroke", "#455A64")
//         .attr("stroke-width", "1px");
// }
//
// /**
//  the function generats main pop-up with
//  - buttons
//  - popup contents place
//  **/
// function get_main_popup() {
//
//
//     main_popup = document.createElement('div');
//     main_popup.setAttribute("id", "main_popup");
//     var button_div = document.createElement('div');
//     button_div.setAttribute('id', "button_div");
//
//     var btn_ownership = document.createElement('button');
//     btn_ownership.setAttribute('id', 'btn_ownership');
//     btn_ownership.setAttribute('class', "btn btn-primary");
//     btn_ownership.setAttribute('style', 'margin:5px;');
//     btn_ownership.innerHTML = 'Ownership';
//
//     var btn_relationship = document.createElement('button');
//     btn_relationship.setAttribute('id', 'btn_relationship');
//     btn_relationship.setAttribute('class', "btn btn-primary");
//     btn_relationship.setAttribute('style', 'margin:5px;');
//     btn_relationship.innerHTML = 'Relationship';
//
//     button_div.appendChild(btn_ownership);
//     button_div.appendChild(btn_relationship);
//
//     popupContent_div = document.createElement('div');
//     popupContent_div.setAttribute("id", "popupContent_div")
//
//     var label = document.createElement('label');
//     label.appendChild(document.createTextNode("Owner Name"));
//
//
//     myPartyDiv = document.createElement('div');
//     myPartyDiv.setAttribute("id", "myPartyDiv");
//     myPartyDiv.appendChild(label);
//
//
//
//
//
//
//     main_popup.appendChild(button_div);
//
//     sm_map.on('click', function (e) {
//         popLocation = e.latlng;
//         var popup = new L.popup()
//             .setLatLng(popLocation)
//             .setContent(main_popup)
//             .openOn(sm_map);
//     });
//     btn_ownership.addEventListener("click", getOwnerships());
// }
//
//
// /**
//  the function communites with Domain Model and extract ownership and rights
//  **/
// function getOwnerships() {
//     var resp = "";
//     //pass the features_type on click
//     $.ajax({
//         url: '/get_domain_model_ownerships',
//         type: 'GET',
//         data: {feat_type: feat_type},
//         contentType: 'text/plain',
//         //dataType: 'json',
//         success: function (resp) {
//             set_popup_contents(resp);
//         }
//     });
// }
//
//
// /**
//  the function generates the pop-up contents from received response from domain model
//  **/
// function set_popup_contents(resp) {
//     var optionItems = [];
//     optionItems.push("--Please Select Ownership Type--");
//     var json = JSON.parse(resp);
//     for (var i = 0; i < json.length; i++) {
//         optionItems.push(json[i].item);
//     }
//
//     var mySelection = document.createElement("select");
//     mySelection.setAttribute("id", "mySelection")
//
//     for (var item = 0; item < optionItems.length; item++) {
//         option = document.createElement("option");
//         option.setAttribute("value", optionItems[item]);
//         option.text = optionItems[item];
//         mySelection.appendChild(option);
//
//     }
//     popupContent_div.appendChild(mySelection);
//     main_popup.appendChild(popupContent_div);
//
//     //call function to get Party information
//     get_party();
//     mySelection.addEventListener("click", function (e) {
//         $("#mySelection option:selected").each(function (e) {
//             if ($(this).text() != "--Please Select Ownership Type--") {
//                 ownership_type = $(this).text();
//                 console.log("ownership_type....", ownership_type);
//             }
//         });
//     });
//
//     //call function to record the land tenure "RIGHTS"
//     add_land_tenure_record();
// }
//
// /**
//  - function gets party information from the
//  **/
// function get_party() {
//     //pass the features_type on click
//     $.ajax({
//         url: '/getParty',
//         type: 'GET',
//         data: {
//             spatialSource: fileName
//         },
//         contentType: 'text/plain',
//         success: function (resp) {
//             //function to get party from domain model
//             set_party_content_popup(resp);
//         }
//     });
// }
//
// /**
//  - set party information in the popup list
//  **/
// function set_party_content_popup(resp) {
//     var optionItems = [];
//     optionItems.push("--Please Select Owner--");
//     var json = JSON.parse(resp);
//
//     //var json = response;
//     for (var i = 0; i < json.length; i++) {
//         optionItems.push(json[i]);
//     }
//
//     var myPartySelection = document.createElement("select");
//     myPartySelection.setAttribute("id", "myPartySelection")
//
//     for (var item = 0; item < optionItems.length; item++) {
//         option = document.createElement("option");
//         option.setAttribute("value", optionItems[item]);
//         option.text = optionItems[item];
//         myPartySelection.appendChild(option);
//
//     }
//     myPartyDiv.appendChild(myPartySelection);
//     main_popup.appendChild(myPartyDiv);
//
//     myPartySelection.addEventListener("click", function (e) {
//         $("#myPartySelection option:selected").each(function (e) {
//             if ($(this).text() != "--Please Select Owner--") {
//                 party = $(this).text();
//                 console.log("party....", party);
//             }
//
//         });
//     });
//
// }
//
// /**
//  - extract ownership Rights
//  - and ownership name
//  - and send it back to python for generating ownership and rights json
//  **/
// function add_land_tenure_record() {
//     //pass the features_type on click
//     $.ajax({
//         url: '/generate_tenure_record',
//         type: 'GET',
//         data: {
//             spatialSource: fileName,
//             feat_id: feat_id,
//             feat_type: feat_type,
//             ownership_type: ownership_type,
//             party: party
//         },
//         contentType: 'text/plain',
//         success: function (resp) {
//         }
//     });
// }
//
//
// function addStreetPopupMM(layer) {
//     var popupContent = document.createElement('div');
//     popupContent.id = "popupCOntent";
//     var featurId = document.createElement("input");
//     featurId.id = "featurId";
//     var featurIdLabel = document.createElement("label");
//     featurIdLabel.setAttribute = ("for", "featurId");
//     featurIdLabel.appendChild(document.createTextNode('St_ID'));
//
//     var labelRoute = document.createElement('label');
//     labelRoute.id = "id";
//     labelRoute.setAttribute = ("for", "isRoute");
//     labelRoute.appendChild(document.createTextNode("RouteSegment?"));
//
//     var isRoute = document.createElement("input");
//     isRoute.type = "checkbox";
//     isRoute.id = "isRoute";
//     isRoute.name = "isRoute";
//     isRoute.value = "No";
//     popupContent.append(featurIdLabel);
//     popupContent.append(featurId);
//     popupContent.append(labelRoute);
//     popupContent.append(isRoute);
//
//     layer.bindPopup(popupContent);
//
//     featurId.addEventListener("keyup", function () {
//         layer.feature.properties.id = featurId.value;
//         layer.feature.properties.FID = featurId.value;
//     });
//     isRoute.addEventListener("click", clickedFunction, false);
//
//     function clickedFunction() {
//         isRoute.setAttribute("value", "Yes");
//         layer.feature.properties.isRoute = isRoute.value;
//     }
//
//     layer.on("popupopen", function () {
//         featurId.value = layer.feature.properties.id;
//         isRoute.value = layer.feature.properties.isRoute;
//         featurId.focus();
//     });
//
//     featurId.addEventListener("focusout", function (e) {
//         MMStreetIDs.push(featurId.value);
//     });
// }
//
//
//
