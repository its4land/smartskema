var svgEditor = (function () {


	let anchor_radius = 40;
	let regexp = /\s+|,/;


	var displayManager;

    var rasterLayer, vectorLayer, drawingLayer, decoratorsLayer;
    var rasterNode, vectorNode, drawingNode, decoratorsNode;
    var vScale = 1;
    var iScale = 1;

    var editModeOnClick = null;

    const DRAWING_LAYER_NAME = "drawingLayer"
    const DECORATORS_LAYER_NAME = "decoratorsLayer"

	const GEOM_TYPES = "path,polygon,circle,rect,line,polyline";
	const GEOM_POLY_TYPES = "path,polygon,rect,line,polyline";

	const MODE_DRAW = 0;
	const MODE_EDIT = 1;

	const EDIT_MODE_BASIC = 0;
	const EDIT_MODE_JOIN = 1;
	const EDIT_MODE_SPLIT = 2;

    let num = Number;
	let lineFunction = d3.line()
							 .x(function(d) { return d.x; })
							 .y(function(d) { return d.y; });

    /**
	 * create popup to enter id and feature type for the added geom
     */
    create_popoup_4_feat_ID_type();

	let activeMode = -1;
	let activeEditMode = -1;

	let anchorNodes = new Map();
	let join_data = {"first_seg":{"path":null, "point":null}, 
					"second_seg":{"path":null, "point":null}};

	let activeGeometries = [];
	let activeMarkers = [];

	
	var init = function(mapType) {
	    activeMode = -1;
	    activeEditMode = -1

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
        }

        if (vectorNode.transform.baseVal.consolidate()){
            iScale = rasterNode.transform.baseVal.consolidate().matrix.a;
        }

        // call function to create div for GCPs
        // create_div_for_GCPS();

        // console.log("vector elements:", svg_elements);
        // svg_elements.on('click', feat_mouseClick_4_gcps);
        setUpEditorMenu();

		setMode(MODE_DRAW);

		return this;
	}

	function setUpEditorMenu(){
        $('#editor_div').prop("style", "visibility: visible");
        $('#svg_edit_bnts').prop("style", "visibility: visible");

        $('#ladm_interaction_bnts').prop("style", "visibility: hidden");
        $('#json_edit_bnts').prop("style", "visibility: hidden");


        popup = document.getElementById("popup_div");
        popup.style.visibility = "hidden";


        $('.bnt').prop("disabled", false);
        let svg = d3.select("#loadedSVG");

        let img = d3.select("#bgImg");

        d3.select(draw_geom).on("click", function () {
            setMode(MODE_DRAW)
        });
        d3.select(edit_geom).on("click", function () {
            setMode(MODE_EDIT)
        });
        d3.select(join_endPoints).on("click", function () {
            setSecondaryMode(EDIT_MODE_JOIN)
        });
        d3.select(split_endPoints).on("click", function () {
            setMode(EDIT_MODE_SPLIT)
        });
        d3.select(save_edits).on("click", function () {
            save()
        });

        console.log("SVG Editor Activating...");
	}

	function save() {
        drawingLayer.selectAll("path").remove().each(
            function(d, i ,g){
                vectorLayer.append(() => g[i]);
            }
        );
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
		case EDIT_MODE_SPLIT:
			finalizeSplitMode();
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
		case EDIT_MODE_SPLIT:
			activateSplitMode();
			break;
		default:
            break;
		}

		activeMode = mode;
	}

	var setSecondaryMode = function(mode) {

	    if (mode == activeEditMode) {
	        switch(activeEditMode) {
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
        rasterLayer.on("mousedown", drawingMousedown);
        drawingLayer.on("mousedown", drawingMousedown);

        d3.select("body").on("keypress", drawingKeypressed);
	}

	function activateEditMode() {
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
                updateFeatureAttributes(k);
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

        if (e[0] === e2[0] && e[1] === e2[1]) {
            pathData.pop();
            e = e2;
        }
        if (s[0] === e[0], s[1] === e[1]) {
            pathData.pop();
            pathData.push({"type":"Z", "values":[]});
            d3.select(path).classed("polyline", false);
            d3.select(path).classed("polygon",true);
        }
        else {
            d3.select(path).classed("polygon", false);
            d3.select(path).classed("polyline", true);
        }

        path.setPathData(pathData);
	}


	function updateFeatureAttributes(path) {
        let feat_id_div = document.createElement("div");
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

        let Ok_bnt = document.createElement("button");
        Ok_bnt.setAttribute("id", "Ok_bnt");
        Ok_bnt.setAttribute("class", "w3-button w3-blue w3-round-large");
        Ok_bnt.textContent = "Save";
        Ok_bnt.setAttribute("style", "align:center");

        let svg_popup_div = document.getElementById("edit_svg_popup_div");
        svg_popup_div.setAttribute("draggable",true);
        svg_popup_div.appendChild(feat_id_div);
        svg_popup_div.appendChild(feat_type_div);
        svg_popup_div.appendChild(Ok_bnt);

        d3.select(path).classed("highlight", true);

        pathData = path.getPathData();

        s = pathData[0].values;

        x = s[0];
        y = s[1];


        $('#edit_svg_popup_div').offset({
            top: y*vScale,
            left: x*vScale
        })
/*        .on("drag", (event) => {
            curOffset = $('#edit_svg_popup_div').offset();
            $('#edit_svg_popup_div').offset()
            top: event.pageX);
            left: event.pageY);
        })*/
        ;

        svg_popup_div.style.visibility = "visible";

        Ok_bnt.addEventListener("click", () => {
            d3.select(path)
                .attr("id", $('#feature_id').val())
                .attr("name", $('#feature_id').val())
                .attr("feat_type", $('#feature_type').val())
                .attr("description", $('#feature_type').val())
                .attr("hidden_", "")
                .classed("highlight", false);

            $('#edit_svg_popup_div').prop("style","visibility: hidden");
            $('#feature_id').val("");
            $('#feature_type').val("");

            this.parentNode.parentNode.removeChild(this.parentNode);
            delete this;
            delete this.parentNode;
	    });
	}

	function drawingMousedown() {
		var m = d3.mouse(this);  
		[x, y] = [m[0]/vScale, m[1]/vScale];
		//console.log("x, y",[m[0]/scale, m[1]/scale]);
		if (activeGeometries.size == 0) {
			path = g.append("path")
				.attr("d", lineFunction([{"x":x, "y":y}]))
				.classed("polyline").node();
			activateGeometry(path);
			let c = addDraggableAnchors(1, [x, y], path, ()=>{}, dragged, dragEnded)
						.attr("r", anchor_radius + 1)
			c.raise()
						//.call(d3.drag().on("start", dragStarted)
						//			   .on("drag", dragged)
						//			   .on("end", dragEnded)
						//		);
			//activeGeometries[path] = [c];
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
            activeGeometries.forEach(
                (v, k, m) => {
                    deactivateGeometry(k);
                }
            );
	    }
	    activateGeometry(this);
	}

	function activateGeometry(geom) {
	    [path, decorators] = makeEditable(geom);
	    parentNode = path.parentNode;
	    drawingLayer.append(()=> path)
	    parentNode.removeChild(path);
	    activeGeometries.set(path, decorators);
        d3.select(path).classed("selected", true)
                       .call(d3.drag()
                            .on("start", geomDragStart)
                            .on("drag", geomDrag)
                            .on("end", geomDragEnd))
                       .on("contextmenu", addPoint)
                       .on("click", editModeOnClick);

        d3.select(delete_geom).attr("opacity", 1)
                              .on("click", deleteGeometry);
	    return path;
	}

	function deactivateGeometry(geom) {
        decorators = activeGeometries[geom];
        updateFeatureGeometry(geom);

        decorators.forEach(function(v, i, arr) {
            anchorNodes.delete(v);
            decoratorsLayer.select(v).remove();
        });

        activeGeometries.delete(geom);
        d3.select(geom).classed("selected", false)
                       .on(".drag", null)
                       .on("click", editGeomOnClick);

        if (activeGeometries.size == 0) {
            d3.select(delete_geom).attr("opacity", 0.5)
                                  .on("click", null);
        }

	    return path;
	}

    function deleteGeometries() {
        activeGeometries.forEach(
            (v, k, m) => {
                d3.select(k).classed("active", true);
                deleteGeometry(k);
                deactivateGeometry(k);
                d3.select(k).classed("active", false);
            }
        );
	}

	function deleteGeometry(geom) {
		del = confirm("Are you sure you want to delete this object?");
		if (del) {
			deleteSVGElement(geom);
		}
	}

    function deleteSVGElement(elem) {
        d3.select(elem).remove();
	}

	function drawingKeypressed() {
	    if (d3.event.keyCode = 13) { //key == Enter

	        activeGeometries.forEach(
                (v, k, m) => {
                    deactivateGeometry(k);
                    updateFeatureAttributes(k);
                }
            );
	    }
	}

/*    function handler(ev) {
      console.log('CTRL pressed during click:', ev.ctrlKey);
    }*/

	function makeEditable(geom) {
        switch( geom.tagName.toLowerCase() ) {

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

          geom = g.append("path")
                    .attr("d", lineFunction(d))
                    .classed('polygon', true)
                    .node();
          d3.select(geom).remove();
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

          geom = g.append("path")
                    .attr("d", lineFunction(d))
                    .classed('polyline', true)
                    .node();
          d3.select(geom).remove();
          break;

        case 'polyline':
          lineFunction.curve(d3.curveLinear);
          point_string = geom.getAttribute("points");
          points = point_string.trim().split(/\s+/);
          d = points.map((p, i) => {
                                      coords = p.trim().split(/,/);
                                      return {"x": num(coords[0]), "y": num(coords[1])};
                                   });

          geom = g.append("path")
                    .attr("d", lineFunction(d))
                    .classed('polyline', true)
                    .node();
          d3.select(geom).remove();
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
          geom = g.append("path")
                    .attr("d", lineFunction(d))
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
                let c = addDraggableAnchors(i, [x, y], geom, ()=>{}, dragged, ()=>{})
                                .on("contextmenu", deleteNode);
                decorators.push(c);
            }
        }
		return [geom, decorators];
		// vector.on("click", addPoint);
	}
	
	function addDraggableAnchors(i, seg, path, dragStart, drag, dragEnd) {
		let c = addAnchor(i, seg, path);
		c.on('mouseover', () => d3.select(this).classed("active", true))
		 .on('mouseout', () => d3.select(this).classed("active", false))
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
              if (value.pos === 0) {
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
                vertexPathData.pos = vertexPathData.pos + 1;
                let c = addDraggableAnchors(i, [x, y], path, ()=>{}, dragged, ()=>{});
                activeGeometries.get(path).push(c);
            }
        }

        path.setPathData(pathData);

		//i = vertexPathData.pos - 1;
		//[x, y] = pathData[i].values;
		//let c = addDraggableAnchors(i, [x, y], path, ()=>{}, dragged, ()=>{});
		d3.select(this).raise();
	}

	function dragged() {
		x = d3.event.x;
		y = d3.event.y;    
		
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
		decorators = activeGeometries[path];
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
			let c = addDraggableAnchors(pathData.length - 1, values, path, ()=>{}, dragged, ()=>{});
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
			let c = addDraggableAnchors(leftLength, lastLeftValues, leftPath, ()=>{}, dragged, ()=>{});
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
			let c = addDraggableAnchors(i + 1, [x, y], path, ()=>{}, dragged, ()=>{});
			c.attr('r', anchor_radius + 1)
			 .on("contextmenu", split_node);
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
        changeMode: setMode,
        save: ()=>{}//saveChanges
    }
})();