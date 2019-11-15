var svgEditor = (function () {

	let anchor_radius = 5;
	let regexp = /\s+|,/;

	var displayManager;

    var rasterLayer, vectorLayer, drawingLayer, decoratorsLayer;
    var rasterNode, vectorNode, drawingNode, decoratorsNode;
    var vScale = 1;
    var iScale = 1;
	
	var anchorRad = 5;
	var edAnchorRad = 8;

    var editModeOnClick = null;

    const BASE_LAYER_NAME = "baseLayer"
    const DRAWING_LAYER_NAME = "drawingLayer"
    const DECORATORS_LAYER_NAME = "decoratorsLayer"

	const GEOM_TYPES = "path,polygon,circle,rect,line,polyline";
	const GEOM_POLY_TYPES = "path,polygon,rect,line,polyline";

	const MODE_BASIC = 0;
	const MODE_DRAW = 1;
	const MODE_EDIT = 2;

	const EDIT_MODE_BASIC = 0;
	const EDIT_MODE_MOVE = 1;
	const EDIT_MODE_DELETE = 2;
	const EDIT_MODE_JOIN = 3;
	const EDIT_MODE_SPLIT = 4;

	let activeGeometries = new Map([]);

    var state = {
        mode: MODE_BASIC,
        secondaryMode: EDIT_MODE_BASIC,
        activeGeometries: activeGeometries
    }

    let num = Number;
	let lineFunction = d3.line()
							 .x(function(d) { return d.x; })
							 .y(function(d) { return d.y; });

    /**
	 * create popup to enter id and feature type for the added geom
     */
    //create_popoup_4_feat_ID_type();

	let activeMode = -1;
	let activeEditMode = -1;

	let anchorNodes = new Map();
	let join_data = {"first_seg":{"path":null, "point":null}, 
					"second_seg":{"path":null, "point":null}};

	var init = function(mapType) {
	    activeMode = -1;
	    activeEditMode = -1;

	    switch (mapType){
	    case 'sketch':
            displayManager = sketchMapDisplayManager;
            break;
	    case 'base':
            displayManager = baseMapDisplayManager;
            break;
	    default: //defaults to sketch
            displayManager = sketchMapDisplayManager;
        }

        rasterLayer = displayManager.getRaster();
        vectorLayer = displayManager.getVectorLayer();
        drawingLayer = displayManager.getVectorLayer(DRAWING_LAYER_NAME);
        decoratorsLayer = displayManager.getVectorLayer(DECORATORS_LAYER_NAME);

	    vectorNode = vectorLayer.node();
	    rasterNode = rasterLayer.node()
        drawingNode = drawingLayer.node();
        decoratorsNode = decoratorsLayer.node();


        if (vectorNode.transform.baseVal.consolidate()){
            vScale = vectorNode.transform.baseVal.consolidate().matrix.a;
			anchor_radius = edAnchorRad/vScale;
			drawingLayer.attr("transform", vectorLayer.attr("transform"));
			decoratorsLayer.attr("transform", vectorLayer.attr("transform"));
        }

        if (rasterNode.transform.baseVal.consolidate()){
            iScale = rasterNode.transform.baseVal.consolidate().matrix.a;
        }

        // call function to create div for GCPs
        // create_div_for_GCPS();

        // console.log("vector elements:", svg_elements);
        // svg_elements.on('click', feat_mouseClick_4_gcps);
        setUpEditorMenu();

		setMode(MODE_BASIC);

		return this;
	}

	function setUpEditorMenu(){
        let inactive_btns = svg_editor_button_manager.inactive_btns();
	    svg_editor_button_manager.disable_btns();
	    svg_editor_button_manager.enable_btns_except(...inactive_btns);

        $('.bnt').prop("disabled", false);

        d3.select("#draw_geom").on("click", function () {
            setMode(MODE_DRAW);
        });

        d3.select("#edit_geom").on("click", function () {
            setMode(MODE_EDIT);
        });

        d3.select("#move_object").on("click", function () {
            setMode(EDIT_MODE_MOVE);
        });

        d3.select("#delete_geom").on("click", deleteGeometries);

        d3.select("#join_endPoints").on("click", function () {
            setSecondaryMode(EDIT_MODE_JOIN);
        });

        d3.select("#split_endPoints").on("click", function () {
            setMode(EDIT_MODE_SPLIT);
        });

        d3.select("#save_geom").on("click", function () {
            save();
        });

        console.log("SVG Editor Activating...");
	}

	function save() {
		saveAllEdits();
	}


//		this.finalize();
//
//		d3.select("body").on("keypress", null);

	var finalize = function() {
	    removeVectorLayer

	    img.on("click", null)
		   .on("mouseover", null)
		   .on("mouseout", null)
		   .on("mousedown", null)
		   .on("mouseup", null)
		   .on("mousemove", null);

		vector.on("click", null)
		   .on("mouseover", null)
		   .on("mouseout", null)
		   .on("mousedown", null)
		   .on("mouseup", null)
		   .on("mousemove", null);
		
		d3.select(SVG_NODE).selectAll(GEOM_TYPES)
		                    .on("click", null)
							.on(".drag", null)
							.on("mouseover", null)
							.on("mouseout", null)
							.on("mousedown", null)
							.on("mouseup", null)
							.on("mousemove", null);

		lineFunction.curve(null);

		anchorNodes.forEach(function(value, key, map) {
				d3.select(key).remove();
			}
		);
		anchorNodes.clear();
	}

	var LPoint = function(x, y) {
		this.x = x;
		this.y = y;
	}
	
	var setMode = function(mode) {

		if (mode == activeMode) {return}

		switch(activeMode) {
		case MODE_DRAW:
            finalizeDrawingMode();
			break;
		case MODE_EDIT:
			finalizeEditMode();
			break;
		default:
            break;
		}

		switch(mode) {
		case MODE_DRAW:
            activateDrawingMode();
			break;
		case MODE_EDIT:
			activateEditMode();
			break;
		default:
            break;
		}

		activeMode = mode;
	}

	var setSecondaryMode = function(mode) {

	    if (mode == activeEditMode) {
	        switch(activeEditMode) {
            case EDIT_MODE_MOVE:
                finalizeEditMoveMode();
                break;
            case EDIT_MODE_DELETE:
                finalizeEditDeleteMode();
                break;
            case EDIT_MODE_JOIN:
                finalizeEditJoinMode();
                break;
            case EDIT_MODE_SPLIT:
                finalizeEditSplitMode();
                break;
            default:
                break;
            }
	    } else {
            switch(mode) {
            case EDIT_MODE_MOVE:
                activateEditMoveMode();
                break;
            case EDIT_MODE_DELETE:
                activateEditDeleteMode();
                break;
            case EDIT_MODE_JOIN:
                activateEditJoinMode();
                break;
            case EDIT_MODE_SPLIT:
                activateEditSplitMode();
                break;
            default:
                break;
            }
	    }
	}

	function activateDrawingMode() {
        lineFunction.curve(d3.curveLinear);

        vectorLayer.on("mousedown", drawingMousedown);
		//rasterLayer.selectAll('image').each((i, v) => console.log(i, v));
        //rasterLayer.selectAll('image').on("mousedown", drawingMousedown);
		rasterLayer.on("mousedown", drawingMousedown);
        drawingLayer.on("mousedown", drawingMousedown);

        d3.select("body").on("keypress", drawingKeypressed);

        svg_editor_button_manager.disable_btns_except("draw_geom", "edit_geom");
	}

	function activateEditMode() {
	    // if active geometry list is not empty then alert - save changes and continue in edit mode? YES/NO
	    if (activeGeometries.size > 0){
            if (!confirm('Save any changes and continue in edit mode?')) {
                return;
            }
            else {
                //save active geometries

            }
	    }

        lineFunction.curve(d3.curveLinear);
        drawingLayer.selectAll(GEOM_POLY_TYPES)
            .on("click", editGeomOnClick);
        vectorLayer.selectAll(GEOM_POLY_TYPES)
            .on("click", editGeomOnClick);
        rasterLayer.selectAll('*').on("click", () => {
            activeGeometries.forEach(
                (v, k, m) => {deactivateGeometry(k)}
            )
	    });

        svg_editor_button_manager.disable_btns_except("draw_geom", "edit_geom", "move_object");
    }

    function activateEditMoveMode(){

    }

    function activateEditJoinMode(){

    }

    function activateEditSplitMode(){

    }

	function finalizeDrawingMode() {
        d3.select(vectorLayer.node().parentNode).selectAll("*")
                   .on("click", null).on("mousedown", null)
                   .on("mouseover", null).on("mouseout", null)
                   .on("mouseup", null).on("mousemove", null);

        lineFunction.curve(null);

        activeGeometries.forEach(
            (v, k, m) => {
                deactivateGeometry(k);
                //updateFeatureAttributes(k);
                update_SVG_new_element_attributues(k);
            }
        );

        drawingLayer.selectAll("path").remove().each(
            function(d, i ,g){
                vectorLayer.append(() => g[i]);
            }
        );
	}

	function finalizeEditMode() {
        d3.select(vectorLayer.node().parentNode).selectAll("*")
                   .on("click", null).on("mousedown", null)
                   .on("mouseover", null).on("mouseout", null)
                   .on("mouseup", null).on("mousemove", null);

        lineFunction.curve(null);

        activeGeometries.forEach(
            (v, k, m) => {
                deactivateGeometry(k);
            }
        );

        drawingLayer.selectAll("path").remove().each(
            function(d, i ,g){
                vectorLayer.append(() => g[i]);
            }
        );
	}

	function finalizeEditJoinMode(){

	}


    function finalizeEditSplitMode(){

    }


	function updateFeatureGeometry(path) {
        pathData = path.getPathData();

        s = pathData[0].values;
        e = pathData[pathData.length - 1].values;
        e2 = pathData[pathData.length - 2].values;
		e3 = pathData[pathData.length - 3].values;

        if (e[0] === e2[0] && e[1] === e2[1]) {
            pathData.pop();
            e = e2;
        }
		if (e2[0] === e3[0] && e2[1] === e3[1]) {
            pathData.pop();
            e = e3;
        }
		
        if (s[0] === e[0], s[1] === e[1]) {
            pathData.pop();
            pathData.push({"type":"Z", "values":[]});
            d3.select(path).classed("polyline", false);
            d3.select(path).classed("polygon",true);
            d3.select(path).attr("geom_type", "polygon");
        }
        else {
            d3.select(path).classed("polygon", false);
            d3.select(path).classed("polyline", true);
            d3.select(path).classed("geom_type", "polyline");
        }

        path.setPathData(pathData);
	}

    function update_SVG_new_element_attributes(path) {
        d3.select(path).classed("highlight", true);
        save_svg_new_elements_attributes.path = path;

        pathData = path.getPathData();

        s = pathData[0].values;

        x = s[0];
        y = s[1];

        $('#svg_new_element_div').prop("style", "visibility: visible");

        $('#svg_new_element_div').offset({
           top: y*vScale+10,
           left: x*vScale

        });
        $(document).on('keydown', function (e) {
            if (e.keyCode === 27) { // ESC
                $('#svg_new_element_div').hide();

            }
        });
	}

	function save_svg_new_elements_attributes(){
	    let path = save_svg_new_elements_attributes.path;
        if (path){
            d3.select(path)
                .attr("id", $('#svg_new_ele_id').val())
                .attr("name", $('#svg_new_ele_id').val())
                .attr("feat_type", $('#svg_new_ele_name').val())
                .attr("description", $('#svg_new_ele_name').val())
                .attr("hidden_", "")
                .classed("highlight", false);
            $('#svg_new_element_div').prop("style", "visibility: hidden");
        }
    }

	function inview(x, y) {
		let xInview = (0 < x) && (x < drawingNode.parentNode.parentNode.getAttribute("width"));
		let yInview = (0 < y) && (y < drawingNode.parentNode.parentNode.getAttribute("height"));
		
		return xInview && yInview;
	}
	
	function drawingMousedown() {
		var m = d3.mouse(drawingNode);  
		//[x, y] = [m[0]/vScale, m[1]/vScale];
		[x, y] = m;
		//console.log("x, y",[m[0]/scale, m[1]/scale]);
		if (activeGeometries.size == 0 && inview(x, y)) {
			/* create a line object and pass it to 
			   activateGeometry() to obtain an editable 
			   path. Set the drag event on the last anchor
			   to dragDraw
			*/
			path = drawingLayer.append("line")
				.attr("x1", x)
				.attr("y1", y)
				.attr("x2", x)
				.attr("y2", y)
				.attr("id", "userGeom" + Math.round(Math.random() * Math.pow(10, 10)))
				.classed("line", true).node();
			path = activateGeometry(path);
			let pathAnchors = activeGeometries.get(path);
			pathAnchors[pathAnchors.length - 1].call(
													d3.drag()
													.on("start", ()=>{})
													.on("drag", dragged)
													.on("end", dragEnded)
													);
			/*
			let c = addDraggableAnchors(1, [x, y], path, ()=>{}, dragged, dragEnded)
						.attr("r", anchor_radius + 1)
			c.raise()
						//.call(d3.drag().on("start", dragStarted)
						//			   .on("drag", dragged)
						//			   .on("end", dragEnded)
						//		);
			//activeGeometries[path] = [c]; //*/
		}
	}

	function drawingMousemove() {

	}

	function drawingMouseup(dc) {
        let vertexPathData = anchorNodes.get(dc);
        path = vertexPathData.path;
        pathData = vertexPathData.pathData;
        i = vertexPathData.pos;

        x = dc.getAttribute("cx");
        y = dc.getAttribute("cy");

        if (i >= 2)
        {
            for (var [key, value] of anchorNodes) {
              if (value.pos === 0) {
                  x0 = key.getAttribute("cx");
                  y0 = key.getAttribute("cy");
                  if (Math.abs(x - x0) <= anchor_radius + 1
                        && Math.abs(y - y0) <= anchor_radius + 1) {
                    x = x0;
                    dc.setAttribute("cx", x);
                    y = y0;
                    dc.setAttribute("cy", y);
                  }
                  break;
              }
            }
        }
        pathData[i].values = [x, y];

        if (i === pathData.length - 1){
            if (pathData[i].values[0] != pathData[i - 1].values[0]
            && pathData[i].values[1] != pathData[i - 1].values[1]) {
                pathData.push({"type":"L", values:[x, y]});
                vertexPathData.pos = vertexPathData.pos + 1;
            }
        }

        path.setPathData(pathData);
	}

	function editGeomOnClick() {
	    if (!d3.event.ctrlKey) { //deactivate all other geometries
            saveAllEdits();
	    }
	    activateGeometry(this);
        d3.select("body").on("keypress", drawingKeypressed);

	    svg_editor_button_manager.disable_btns_except("draw_geom", "edit_geom", "join_endPoints", "split_endPoints", "move_object", "delete_geom");
	}

	function activateGeometry(geom) {
	    [path, decorators] = makeEditable(geom);
	    activeGeometries.set(path, decorators);
        d3.select(path).classed("selected", true)
                       .call(d3.drag()
                            .on("start", geomDragStart)
                            .on("drag", geomDrag)
                            .on("end", geomDragEnd))
	    return path;
	}

	function deactivateGeometry(geom) {
        decorators = activeGeometries.get(geom);
        updateFeatureGeometry(geom);

        decorators.forEach(function(v, i, arr) {
            anchorNodes.delete(v);
            decoratorsLayer.select(() => v.node()).remove();
        });

        activeGeometries.delete(geom);
        d3.select(geom).classed("selected", false)
                       .on(".drag", null);

        if (activeGeometries.size == 0) {
            svg_editor_button_manager.disable_btn("delete_geom");
        }

	    return path;
	}

    function deleteGeometries() {
		del = confirm("Do you want to delete the selected objects?");
		if (del) {
            activeGeometries.forEach(
                (v, k, m) => {
                    d3.select(k).classed("active", false);
                    deactivateGeometry(k);
                    deleteGeometry(k, true);
                }
            );
        }
	}

	function deleteGeometry(geom) {
		del = arguments[0]? arguments[0]: confirm("Are you sure you want to delete this object?");
		if (del) {
			deleteSVGElement(geom);
		}
	}

    function deleteSVGElement(elem) {
        d3.select(elem).remove();
	}

	function drawingKeypressed() {
	    if (d3.event.keyCode = 13) { //key == Enter
			saveAllEdits();

	    }
	}

	function saveAllEdits() {
		activeGeometries.forEach(
			(v, k, m) => {
				deactivateGeometry(k);
				k = displayManager.moveVectorToLayer(k, DRAWING_LAYER_NAME, BASE_LAYER_NAME);
				update_SVG_new_element_attributes(k);
			}
		);
	}

	/*
		Make geometry editable, first detaching it from it's
		parent then converting it to a path object if it isn't a 
		path, and finally appending it to the drawing layer. At 
		the end also create draggable anchor nodes to manipulate
		the geometry's shape.
    */
	function makeEditable(geom) {
	    let transform = d3.select(geom).attr("transform");

        switch(geom.tagName.toLowerCase()) {

		case 'path':
          lineFunction.curve(d3.curveLinear);
		  geom = d3.select(geom).remove().node();
		  drawingLayer.append(()=>geom);
		  break;

        case 'rect':
          lineFunction.curve(d3.curveLinearClosed);
          x = geom.getAttribute("x");
          y = geom.getAttribute("y");
          h = geom.getAttribute("height");
          w = geom.getAttribute("width");

          d = [
               {"x": x, "y": y},
               {"x": x, "y": y + h},
               {"x": x + w, "y": y + h},
               {"x":x + w, "y": y}
              ];

          d3.select(geom).remove();
          geom = drawingLayer.append("path")
                    .attr("d", lineFunction(d))
					.attr("geom_type", 'polygon')
					.attr("id", geom.getAttribute("id") || geom.getAttribute("feat_id"))
                    .attr("feat_type", geom.getAttribute("feat_type") || "NA")
                    .attr("smart_skema_type", geom.getAttribute("smart_skema_type") || "NA")
                    .attr("name", geom.getAttribute("name") || "NA")
                    .attr("description", geom.getAttribute("description") || "NA")
                    .attr("hidden_", geom.getAttribute("hidden_") || "NA")
					.attr("transform", transform || "scale(1)")
                    .classed(geom.getAttribute("class"), true)
                    .classed('polygon', true)
                    .node();
          break;

        case 'line':
          lineFunction.curve(d3.curveLinear);
          x1 = geom.getAttribute("x1");
          y1 = geom.getAttribute("y1");
          x2 = geom.getAttribute("x2");
          y2 = geom.getAttribute("y2");

          d = [
               {"x":x1, "y":y1},
               {"x":x2, "y":y2}
              ];

          d3.select(geom).remove();
          geom = drawingLayer.append("path")
                    .attr("d", lineFunction(d))
					.attr("geom_type", 'polyline')
					.attr("id", geom.getAttribute("id") || geom.getAttribute("feat_id"))
                    .attr("feat_type", geom.getAttribute("feat_type") || "NA")
                    .attr("smart_skema_type", geom.getAttribute("smart_skema_type") || "NA")
                    .attr("name", geom.getAttribute("name") || "NA")
                    .attr("description", geom.getAttribute("description") || "NA")
                    .attr("hidden_", geom.getAttribute("hidden_") || "NA")
					.attr("transform", transform || "scale(1)")
                    .classed(geom.getAttribute("class"), true)
                    .classed('polyline', true)
                    .node();
          break;

        case 'polyline':
          lineFunction.curve(d3.curveLinear);
          point_string = geom.getAttribute("points");
          points = point_string.trim().split(/\s+/);
          d = points.map((p, i) => {
                                      coords = p.trim().split(/,/);
                                      return {"x": num(coords[0]), "y": num(coords[1])};
                                   });

          d3.select(geom).remove();
          geom = drawingLayer.append("path")
                    .attr("d", lineFunction(d))
					.attr("geom_type", 'polyline')
					.attr("id", geom.getAttribute("id") || geom.getAttribute("feat_id"))
                    .attr("feat_type", geom.getAttribute("feat_type") || "NA")
                    .attr("smart_skema_type", geom.getAttribute("smart_skema_type") || "NA")
                    .attr("name", geom.getAttribute("name") || "NA")
                    .attr("description", geom.getAttribute("description") || "NA")
                    .attr("hidden_", geom.getAttribute("hidden_") || "NA")
					.attr("transform", transform || "scale(1)")
                    .classed(geom.getAttribute("class"), true)
                    .classed('polyline', true)
                    .node();
          break;

        case 'polygon':
          lineFunction.curve(d3.curveLinearClosed);
          point_string = geom.getAttribute("points");
          points = point_string.trim().split(/\s+/);
          d = points.map((p, i) => {
                                      coords = p.trim().split(/,/);
                                      return {"x": num(coords[0]), "y": num(coords[1])};
                                   });
          d3.select(geom).remove();
          geom = drawingLayer.append("path")
                    .attr("d", lineFunction(d))
					.attr("geom_type", 'polygon')
					.attr("id", geom.getAttribute("id") || geom.getAttribute("feat_id"))
                    .attr("feat_type", geom.getAttribute("feat_type") || "NA")
                    .attr("smart_skema_type", geom.getAttribute("smart_skema_type") || "NA")
                    .attr("name", geom.getAttribute("name") || "NA")
                    .attr("description", geom.getAttribute("description") || "NA")
                    .attr("hidden_", geom.getAttribute("hidden_") || "NA")
					.attr("transform", transform || "scale(1)")
                    .classed(geom.getAttribute("class"), true)
                    .classed('polygon', true)
                    .node();
          break;
        }

        lineFunction.curve(null);

        let pathData = geom.getPathData();
        let decorators = [];

        for (let i = 0; i < pathData.length; i++) {
            let seg = pathData[i];
            let [x, y] = seg.values;
            if (x && y){
                let c = addDraggableAnchors(i, [x, y], geom, edAnchorRad/vScale, ()=>{}, dragged, ()=>{})
					        .attr("transform", transform || "scale(1)");
                decorators.push(c);
            }
        }
		return [geom, decorators];
	}
	
	function addDraggableAnchors(i, seg, path, radius, dragStart, drag, dragEnd) {
		let c = addAnchor(i, seg, path, radius);
		let activate = function(){
			d3.select(this).classed("active", true);
		}
		let deactivate = function(){
			d3.select(this).classed("active", false);
		}
		c.on('mouseover', activate)
		 .on('mouseout', deactivate)
		 .call(d3.drag()
			    .on("start", dragStart)
			    .on("drag", drag)
			    .on("end", dragEnd)
		);
		return c;
	}
	 
	function addLinkableAnchors(i, seg, path) {
		let c = addAnchor(i, seg.values, path);
		c.on("click", join_path_end_points);
		
		return c;
	}
	 
	function addAnchor(i, seg, path, radius) {
		let [x, y] = seg;
		let c = decoratorsLayer.append('svg:circle')
					.attr("cx", x)
					.attr("cy", y)
					.attr('class', "anchor")
					.attr('r', radius)
					.attr('pos', i)
					.attr('fill', 'blue');
		c.raise();
		anchorNodes.set(c.node(), {'path': path, 'pathData': path.getPathData(), 'pos': i});
		
		return c;
	}

    function geomDragStart() {
        d3.select(this).classed("active", true);
    }

    function geomDragEnd() {
        d3.select(this).classed("active", false);
    }

	function geomDrag() {
		dx = d3.event.dx;
		dy = d3.event.dy;

        switch( this.tagName.toLowerCase() ) {

        case 'circle':
          x = this.getAttribute("cx");
		  y = this.getAttribute("cy");
		  d3.select(this).attr("cx", num(x) + dx).attr("cy", num(y) + dy);
          break;

        case 'rect':
          x = this.getAttribute("x");
		  y = this.getAttribute("y");
		  d3.select(this).attr("x", num(x) + dx).attr("y", num(y) + dy);
          break;

        case 'line':
          x1 = this.getAttribute("x1");
          y1 = this.getAttribute("y1");
          x2 = this.getAttribute("x2");
          y2 = this.getAttribute("y2");
          d3.select(this).attr("x1", num(x1) + dx)
                         .attr("y1", num(y1) + dy)
                         .attr("x2", num(x2) + dx)
                         .attr("y2", num(y2) + dy);
          break;

        case 'polyline':
          point_string = this.getAttribute("points");
          points = point_string.split(regexp);
          points = points.map((p, i) => i % 2? num(p) + dy : num(p) + dx);
          point_string = points.reduce((acc, v, i) => (acc + (i%2 ? v  + " " : v + ",")), "");
//          for (vertex of pathData) {
//              [x, y] = vertex.values;
//              [x, y] = [x + dx, y + dy]
//              poing_string = point_string + x + "," + y + " ";
//          }
          d3.select(this).attr("points", point_string.trim());
          break;

        case 'polygon':
          point_string = this.getAttribute("points");
          points = point_string.trim().split(regexp);
		  
          points = points.map((p, i) => i % 2? num(p) + dy : num(p) + dx);
          point_string = points.reduce((acc, v, i) => (acc + (i%2 ? v  + " " : v + ",")), "");
		  
          d3.select(this).attr("points", point_string.trim());
          break;

        case 'path':
          pathData = this.getPathData();
          x0 = pathData[0].values[0];
          y0 = pathData[0].values[1];
		  
          pathData.forEach(function (vertex){
              [x, y] = vertex.values;
              if (x && y)
                vertex.values = [x + dx, y + dy];
             });
          this.setPathData(pathData);
          break;
      }

      let decorators = activeGeometries.get(this);
      if (decorators) {
          decorators.forEach(function(e, i){
            let dn = e.node();
            let x = parseFloat(dn.getAttribute("cx"));
            let y = parseFloat(dn.getAttribute("cy"));
            e.attr("cx", x + dx).attr("cy", y + dy);
          });
      }
    }

	function dragEnded() {
		// place an anchor under this node;
		let vertexPathData = anchorNodes.get(this);  
		let path = vertexPathData.path;
		let pathData = vertexPathData.pathData;
        let i = vertexPathData.pos;

        let x = this.getAttribute("cx");
        let y = this.getAttribute("cy");

        if (i >= 2)
        {
            for (var [key, value] of anchorNodes) {
              if (value.pos === 0 && value.path === path) {
                  let x0 = key.getAttribute("cx");
                  let y0 = key.getAttribute("cy");
                  if (Math.abs(x - x0) <= anchor_radius + 1
                        && Math.abs(y - y0) <= anchor_radius + 1) {
                    x = x0;
                    this.setAttribute("cx", x);
                    y = y0;
                    this.setAttribute("cy", y);
                  }
                  break;
              }
            }
        }
        pathData[i].values = [x, y];

        if (i === pathData.length - 1){
            if (pathData[i].values[0] != pathData[i - 1].values[0]
            && pathData[i].values[1] != pathData[i - 1].values[1]) {
                pathData.push({"type":"L", values:[x, y]});
                //vertexPathData.pos = vertexPathData.pos + 1;
                let c = addDraggableAnchors(vertexPathData.pos + 1, [x, y], path, edAnchorRad/vScale, ()=>{}, dragged, dragEnded);
                activeGeometries.get(path).push(c);
				d3.select(this).on(".drag", null);
				d3.select(this).call(
									d3.drag()
									.on("start", ()=>{})
									.on("drag", dragged)
									.on("end", ()=>{})
									);
            }
        }

        path.setPathData(pathData);

		//i = vertexPathData.pos - 1;
		//[x, y] = pathData[i].values;
		//let c = addDraggableAnchors(i, [x, y], path, ()=>{}, dragged, ()=>{});
	}

	function dragged() {
		x = d3.event.x;
		y = d3.event.y;   
		m = d3.mouse(drawingNode);
		
		let vertexPathData = anchorNodes.get(this);  
		path = vertexPathData.path;
		pathData = path.getPathData();
		
		i = vertexPathData.pos;
		pathData[i].values = [x, y];
		d3.select(this).attr("cx", x).attr("cy", y);
		
		path.setPathData(pathData);
		vertexPathData.pathData = pathData;
		if (2 <= i && i === pathData.length - 1)
		{
			for (var [key, value] of anchorNodes) {
			  if (value.pos === 0) {
				  x0 = key.getAttribute("cx");
				  y0 = key.getAttribute("cy");
				  if (Math.abs(x - x0) <= anchor_radius + 1 
				        && Math.abs(y - y0) <= anchor_radius + 1) {
					  d3.select(key).classed("active", true);
				  }
				  else {
					  d3.select(key).classed("active", false);
				  }
				  break;
			  }
			}
		}
	}

//	function dragEnded() {
//		drawingMouseup(this);
//	}
	
	function deleteNode() {
		d3.event.preventDefault();
		let vertexPathData = anchorNodes.get(this);
		path = vertexPathData.path;
		let parent = d3.select(path.parentNode);
		pathData = path.getPathData();
		i = vertexPathData.pos;
		values = pathData.splice(i ,1);
		path.setPathData(pathData);
		anchorNodes.forEach(
			function(v, k, m) {
				v.path = path;
				v.pathData = pathData;
				if (v.pos > i) {
					v.pos = v.pos - 1;
				}
			}
		);
		decorators = activeGeometries.get(path);
		decorators.splice(decorators.indexOf(this), 1);
		anchorNodes.delete(this);
		d3.select(this).remove();
	}
	
		
	function split_node() {
		d3.event.preventDefault();
		let vertexPathData = anchorNodes.get(this);  
		path = vertexPathData.path;
		pathData = path.getPathData();
		i = vertexPathData.pos;
		values = pathData[i].values;
		term = pathData[pathData.length - 1];
		
		if (term.type === "Z") {
			// just open up the polygon
			// first pop the "Z" segment 
			closingElement = pathData.pop();
			// then make everything an inside segment
			pathData[0].type = "L";
			// rotate the pathData so the this node is the first
			pathData = pathData.map(function(el, idx, arr){
					return arr[(idx + arr.length - i)%arr.length];
				}
			);
			anchorNodes.forEach(
				function(v, k, m) {
					v.path = path;
					v.pathData = pathData;
					let t = v.pos;
					v.pos = (v.pos + pathData.length - i)%pathData.length;
				}
			);
			pathData.push({"type":pathData[0].type, "values":pathData[0].values});
			pathData[0].type = "M";
			path.setPathData(pathData);
			let c = addDraggableAnchors(pathData.length - 1, values, path, edAnchorRad/vScale, ()=>{}, dragged, ()=>{});
		}
		else {
			let temp_svg_edit_nodes = new Map();
			// split the polyline in two
			let leftPathData = pathData.slice(0, i + 1);
			let leftPath = parent.append("path")
							  .classed("polyline", true)
							  .on("click", makeEditable)
							  .node();
			leftPath.setPathData(leftPathData);

			let rightPathData = pathData.slice(i, pathData.length);
			rightPathData[0].type = "M";
			let rightPath = parent.append("path")
							  .classed("polyline", true)
							  .on("click", makeEditable)
							  .node();
			rightPath.setPathData(rightPathData);
			
			for (var [k, v] of anchorNodes) {
				d3.select(k).raise();
				if (v.pos < i) {
					v.path = leftPath;
					v.pathData = leftPathData
				}
				else {
					v.path = rightPath;
					v.pathData = rightPathData
					v.pos = v.pos - i;
				}
				temp_svg_edit_nodes.set(k, v);
			}
			
			anchorNodes = temp_svg_edit_nodes;
			d3.select(path).remove();
			leftLength = leftPathData.length - 1;
			lastLeftValues = leftPathData[leftPathData.length - 1].values;
			let c = addDraggableAnchors(leftLength, lastLeftValues, leftPath, edAnchorRad/vScale, ()=>{}, dragged, ()=>{});
		}
	}

	function addPoint() {
		let click_point = d3.mouse(this);
		    click_point = {"x":click_point[0],"y":click_point[1]};
		let path = d3.select(".selected").node();
		let segments = path_to_segments(path);
		let point_to_position = point_on_nearest_segment(click_point, segments);
		if ((point_to_position.point.x == point_to_position.seg.s.x 
			&& point_to_position.point.y == point_to_position.seg.s.y) 
		|| (point_to_position.point.x == point_to_position.seg.e.x 
			&& point_to_position.point.y == point_to_position.seg.e.y)){
			point_to_position.seg = null;
			point_to_position.idx = Infinity;
			point_to_position.point = null;
		}
		if (point_to_position.point && point_to_position.distance < 5) {
			x = point_to_position.point.x;
			y = point_to_position.point.y;
			i = point_to_position.idx;
			pathData = path.getPathData();
			pathData.splice(i + 1, 0, {"type":"L", "values":[x, y]});
			path.setPathData(pathData);
			anchorNodes.forEach(
				function(v, k, m) {
					v.path = path;
					v.pathData = pathData;
					if (v.pos > i) {
						let t = v.pos;
						v.pos = v.pos + 1;
					}
				}
			);
			let c = addDraggableAnchors(i + 1, [x, y], path, edAnchorRad/vScale, ()=>{}, dragged, ()=>{});
			    c.on("contextmenu", split_node);
		}
	}

	function point_distance(p, q) {
		let x_dist = p.x - q.x;
		let y_dist = p.y - q.y;
		return Math.sqrt(Math.pow(x_dist, 2) + Math.pow(y_dist, 2));
	}

	function path_to_segments(path) {
		let endPoints = path.getPathData();
		let segs = [];
		let seg = {"s":{"x":endPoints[0].values[0], "y":endPoints[0].values[1]}, "e":null};

		for (i = 1; i < endPoints.length - 1; i++) {
			point = {"x":endPoints[i].values[0], "y":endPoints[i].values[1]};
			seg.e = point;
			segs.push(seg);
			seg = {"s":point, "e":null};
		}
		if (endPoints[endPoints.length - 1].type == "Z") {
			point = {"x":endPoints[0].values[0], "y":endPoints[0].values[1]};
			seg.e = point;
			segs.push(seg);
		}
		else {
			point = {"x":endPoints[endPoints.length - 1].values[0], "y":endPoints[endPoints.length - 1].values[1]};
			seg.e = point;
			segs.push(seg);
		}
		return segs
	}

	function point_on_line_projection(p, segment) {
		let x = segment.s.x, y = segment.s.y;
		let u = segment.e.x, v = segment.e.y;
		let a = p.x, b = p.y;

		let t = ((a - x) * (u - x) + (b - y) * (v - y));
		t = t / (Math.pow(u - x, 2) + Math.pow(v - y, 2));

		let nu = t * u + (1 - t) * x;
		let mu = t * v + (1 - t) * y;
		
		return {"x":nu, "y":mu};
	}

	function point_on_nearest_segment(point, segments) {
		let nearest_segment = null;
		let nearest_segment_idx = null;
		let nearest_point = null;
		let shortest_distance = Infinity;

		for (let i = 0; i <= segments.length - 1; i++) {
			let seg = segments[i];
			point_on_segment = point_on_line_projection(point, seg);
			distance_to_point = point_distance(point, point_on_segment);
			if (distance_to_point < shortest_distance) {
				shortest_distance = distance_to_point;
				nearest_segment = seg;
				nearest_segment_idx = i;
				nearest_point = point_on_segment;
			}
		}
		
		return {"seg": nearest_segment, "idx": nearest_segment_idx, "point": nearest_point, "distance": shortest_distance};
	}

	function join_path_end_points() {
		let vertexPathData = anchorNodes.get(this); 
		let path = vertexPathData.path;
		let pathData = vertexPathData.pathData;
		let parent = d3.select(path.parentNode);
		let i = vertexPathData.pos;

		d3.select(this).classed("active", true);

		if (!join_data.first_seg.path || join_data.first_seg.point < 0) {
			join_data.second_seg.path  = null;
			join_data.second_seg.point = -1;
			
			join_data.first_seg.path = path;
			join_data.first_seg.point = i;
			
			return;
		}

		if (!join_data.second_seg.path || join_data.second_seg.point < 0){
			if (join_data.first_seg.path  === this 
				&& join_data.first_seg.path == i) {
				return;
			}
			
			join_data.second_seg.path = path;
			join_data.second_seg.point = i;
		}

		// if we reach here we have our two segments so join them
		if (join_data.first_seg.path === join_data.second_seg.path) {
			// same path, so we are just closing it - add the command at the end
			let path = join_data.first_seg.path;
			let pathData = path.getPathData();

			pathData.push({"type":"Z", "values":[]});
			path.setPathData(pathData);
			d3.select(path).attr("class", "polygon");
			anchorNodes.forEach(
				function(v, k, m) {
					if (v.path == path) {
						m.delete(k);
						d3.select(k).remove();
					}
				}
			);
		}
		else {
			// different paths so figure out how to order their points 
			let firstPath = join_data.first_seg.path;
			let firstPathData = firstPath.getPathData();
			let secondPath = join_data.second_seg.path;
			let secondPathData = secondPath.getPathData();
			secondPathData[0].type = "L";
			
			if (join_data.first_seg.point == 0){
				//reverse this path
				firstPathData[0].type = "L";
				firstPathData = firstPathData.reverse();
				firstPathData[0].type = "M";
			}
			if (join_data.second_seg.point == secondPathData.length - 1){
				//reverse this path
				secondPathData = secondPathData.reverse();
			}
			let pathData = firstPathData.concat(secondPathData);
			let path = parent.append("path").attr("class", "polyline").node();
			path.setPathData(pathData);
			d3.select(firstPath).remove();
			d3.select(secondPath).remove();
			anchorNodes.forEach(
					function(v, k, m) {
					
					if (v.path == firstPath || v.path == secondPath) {
					m.delete(k);
					d3.select(k).remove();
				  }
				}
			);
			d3.selectAll([path]).each(start_joining);
		}
		join_data.first_seg.path  = null;
		join_data.first_seg.point = -1;
		join_data.second_seg.path  = null;
		join_data.second_seg.point = -1;
	}

	function start_joining(d, i) {
		let pathData = this.getPathData();
		let start_seg = pathData[0];
		let end_seg = pathData[pathData.length - 1];

		if (end_seg.type !== "Z") {
			addLinkableAnchors(0, start_seg, this);
			addLinkableAnchors(pathData.length - 1, end_seg, this);
		}
	}


    /**
    * GCP stuff
    **/
    function feat_mouseClick_4_gcps(){
        d3.select(this)
            .style("stroke", "#039BE5")
            .style("stroke-width", "2px");

        feat_id = $(this).attr('id');
        feat_type = $(this).attr('smart_skema_type');
        console.log("CLICK on id", feat_id);
        console.log("CLICK on smart_skema", feat_type);

        x = d3.event.pageX;
        y = d3.event.pageY;


        referencePoints_popup_div = document.getElementById("referencePoints_popup_div");
        referencePoints_popup_div.style.visibility = "visible";

        $('#referencePoints_popup_div').offset({
            top: y,
            left: x
        });

        GCP_Ok_bnt.addEventListener("click", gcps_attr_ok_clicked);

        $(document).on('keydown', function (e) {
            if (e.keyCode === 27) { // ESC
                $(referencePoints_popup_div).hide();
            }
        });
    }

    function gcps_attr_ok_clicked() {
        d3.select(this)
            .attr("id", $('#feature_id').val())
            .attr("name", $('#feature_id').val())
            .attr("smart_skema_type", $('#feature_type').val())
            .attr("description", $('#feature_type').val())
            .attr("hidden_", "");
    }

    var GCP_Ok_bnt;
    function create_div_for_GCPS(){

        var feat_id_div = document.createElement("div");
        feat_id_div.setAttribute("class", "input-group mb-3 input-group-sm");

        feat_id_div_text = document.createElement("input");
        feat_id_div_text.setAttribute("id","feature_id");
        feat_id_div_text.setAttribute("class", "form-control");

        feat_id_div_label = document.createElement("label");
        feat_id_div_label.setAttribute("class","input-group-text");
        feat_id_div_label.textContent = "Feature ID:";

        feat_id_div.appendChild(feat_id_div_label);
        feat_id_div.appendChild(feat_id_div_text);


        feat_type_div = document.createElement("div");
        feat_type_div.setAttribute("class", "input-group mb-3 input-group-sm");

        feat_type_div_text = document.createElement("input");
        feat_type_div_text.setAttribute("id","feature_type");
        feat_type_div_text.setAttribute("class", "form-control");
        feat_type_div_text.defaultValue = "Reference Point";

        feat_type_div_label = document.createElement("label");
        feat_type_div_label.setAttribute("class","input-group-text");
        feat_type_div_label.textContent = "Feature Type:";


        feat_type_div.appendChild(feat_type_div_label);
        feat_type_div.appendChild(feat_type_div_text);

        GCP_Ok_bnt = document.createElement("button");
        GCP_Ok_bnt.setAttribute("id", "Ok_bnt");
        GCP_Ok_bnt.setAttribute("class", "w3-button w3-blue w3-round-large");
        GCP_Ok_bnt.textContent = "Save";
        GCP_Ok_bnt.setAttribute("style", "align:center");


        grp_svg_popup_div = document.getElementById("referencePoints_popup_div");
        grp_svg_popup_div.appendChild(feat_id_div);
        grp_svg_popup_div.appendChild(feat_type_div);
        grp_svg_popup_div.appendChild(GCP_Ok_bnt);

    }

	var Ok_bnt;
    var feat_id_div;
    function create_popoup_4_feat_ID_type(){

        feat_id_div = document.createElement("div");
        feat_id_div.setAttribute("class", "input-group mb-3 input-group-sm");

        feat_id_div_text = document.createElement("input");
        feat_id_div_text.setAttribute("id","feature_id");
        feat_id_div_text.setAttribute("class", "form-control");

        feat_id_div_label = document.createElement("label");
        feat_id_div_label.setAttribute("class","input-group-text");
        feat_id_div_label.textContent = "Feature ID:";

        feat_id_div.appendChild(feat_id_div_label);
        feat_id_div.appendChild(feat_id_div_text);


        feat_type_div = document.createElement("div");
        feat_type_div.setAttribute("class", "input-group mb-3 input-group-sm");

        feat_type_div_text = document.createElement("input");
        feat_type_div_text.setAttribute("id","feature_type");
        feat_type_div_text.setAttribute("class", "form-control");

        feat_type_div_label = document.createElement("label");
        feat_type_div_label.setAttribute("class","input-group-text");
        feat_type_div_label.textContent = "Feature Type:";


        feat_type_div.appendChild(feat_type_div_label);
        feat_type_div.appendChild(feat_type_div_text);

        Ok_bnt = document.createElement("button");
        Ok_bnt.setAttribute("id", "Ok_bnt");
        Ok_bnt.setAttribute("class", "w3-button w3-blue w3-round-large");
        Ok_bnt.textContent = "Save";
        Ok_bnt.setAttribute("style", "align:center");

        svg_popup_div = document.getElementById("edit_svg_popup_div");
        svg_popup_div.appendChild(feat_id_div);
        svg_popup_div.appendChild(feat_type_div);
        svg_popup_div.appendChild(Ok_bnt);

    }

    return {
        init: init,
        save_svg_new_elements_attributes:save_svg_new_elements_attributes,
        changeMode: setMode,
        save: ()=>{}//saveChanges
    }
})();