var MODE_EDIT_SVG = function svgEditMode(SVG_INTERACTION_MODE, svg, body) {
	var drawing_started = false;
	var editing_started = false;
	var joining_started = false;
	var anchor_radius = 2.5;
	var obj_class;
	const SVG_NODE = svg.node();
	const MODE_VIEW = "View";
	const MODE_DRAW_GEOM = "New Geometry";
	const MODE_EDIT_GEOM = "Edit Geometry";
	const MODE_JOIN_POINTS = "Join Polyline Points";
	const MODE_DEL_GEOM = "Delete Geometry";

	function LPoint(x, y) {
		this.x = x;
		this.y = y;
	} 
	 
	//This is the accessor function we talked about above
	var lineFunction = d3.line()
							 .x(function(d) { return d.x; })
							 .y(function(d) { return d.y; });

	var editing_modes = [
		MODE_DRAW_GEOM,
		MODE_EDIT_GEOM, 
		MODE_JOIN_POINTS, 
		MODE_DEL_GEOM
	];

	var callback_map = new Map();

	function init() {
		
	}
	
	function finalize() {
		svg.on("click", null);
		svg.on("mouseover", null);
		svg.on("mouseout", null);
		svg.on("mousedown", null);
		svg.on("mouseup", null);
		svg.on("mousemove", null);
		
		d3.selectAll("path").on("click", null);
		d3.selectAll("path").on(".drag", null);
		d3.selectAll("path").on("mouseover", null);
		d3.selectAll("path").on("mouseout", null);
		d3.selectAll("path").on("mousedown", null);
		d3.selectAll("path").on("mouseup", null);
		d3.selectAll("path").on("mousemove", null);
	}

	Object.freeze(editing_modes);

	var current_mode = 0;
	{
		lineFunction.curve(d3.curveLinear);
		d3.select("body").on("keypress", drawing_keypressed);
		svg.on("mousedown", drawing_mousedown)
			.on("mouseup", null)
			.on("mousemove", null);
		obj_class = "polyline";
	}

	let svg_edit_nodes = new Map();
	let join_data = {"first_seg":{"path":null, "point":null}, 
					"second_seg":{"path":null, "point":null}};
	
	var btnDiv = document.createElement("div"); 
	
	var btn1 = document.createElement("BUTTON");       
	btn1.addEventListener("click", change_mode); 
	var t = document.createTextNode(editing_modes[current_mode]);      
	btn1.appendChild(t);                              

	var btn2 = document.createElement("BUTTON");       
	btn2.addEventListener("click", finalize); 
	var t = document.createTextNode("Finalize");      
	btn2.appendChild(t); 
	
	body.appendChild(btn1);
	body.appendChild(btn2);

	function change_mode() {
		current_mode = (current_mode + 1) % editing_modes.length;
		this.innerHTML = editing_modes[current_mode];
		lineFunction.curve(null);
		d3.select("body").on("keypress", null);

		switch(editing_modes[current_mode]) {
		case MODE_DRAW_GEOM:
			lineFunction.curve(d3.curveLinear);
			d3.select("body").on("keypress", drawing_keypressed);
			svg.on("mousedown", drawing_mousedown)
				.on("mouseup", null)
				.on("mousemove", null);
			obj_class = "polyline";
			break;
		case MODE_EDIT_GEOM:
			lineFunction.curve(d3.curveLinear);
			d3.select("body").on("keypress", drawing_keypressed);
			svg.on("mousedown", null)
				.on("mouseup", null)
				.on("mousemove", null);
			d3.selectAll(".polygon,.polyline")
				.on("click", make_editable);
			break;
		case MODE_JOIN_POINTS:
			joining_started = true;
			lineFunction.curve(d3.curveLinear);
			d3.select("body").on("keypress", drawing_keypressed);
			svg.on("mousedown", null)
				.on("mouseup", null)
				.on("mousemove", null);
			//d3.selectAll(svg.node().childNodes)
			//  .on("click", join_path_end_points);
			d3.selectAll(".polyline").each(start_joining);
			break;
		case MODE_DEL_GEOM:
			svg.on("mousedown", null)
				.on("mouseup", null)
				.on("mousemove", null);
			d3.selectAll(svg.node().childNodes)
				.on("click", del_geometry);
			break;
		default:
			svg.on("mousedown", null)
				.on("mouseup", null)
				.on("mousemove", null);
		}
	}
							 
	function drawing_mousedown() {
		var m = d3.mouse(this);  
		[x, y] = [m[0], m[1]];
		if (!drawing_started) {
			drawing_started = true;
			path = svg.append("path")
				.attr("d", lineFunction([{"x":x, "y":y},{"x":x, "y":y}]))
				.attr("class", obj_class).node();
			let pathData = path.getPathData();
			let c = addDraggableAnchors(1, [x, y], path)
						.attr("r", anchor_radius + 1)
						.call(d3.drag().on("start", dragStarted)
									   .on("drag", dragged)
									   .on("end", dragEnded)
								);
		}
	}




	function drawing_mousemove() {

	}

	function drawing_mouseup(dc) {
		if (editing_modes[current_mode] == MODE_DRAW_GEOM) {
			let vertexPathData = svg_edit_nodes.get(dc); 
			path = vertexPathData.path;
			pathData = vertexPathData.pathData;
			i = vertexPathData.pos;

			x = dc.getAttribute("cx");
			y = dc.getAttribute("cy");
			
			if (i >= 2)
			{
				for (var [key, value] of svg_edit_nodes) {
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
	}

	function del_geometry() {
		del = confirm("Are you sure you want to delete this object?");
		if (del) {
			d3.select(this).remove();
		}
	}

	// d3.select("body").on("keypress", keypressed);
	// d3.select("body").on("keydown", keypressed);
	// d3.select("body").on("keyup", keypressed);

	function drawing_keypressed() {

		key_code = d3.event.key;
		if (drawing_started && svg_edit_nodes.keys().next()) {
			path = svg_edit_nodes.values().next().value.path;
			pathData = path.getPathData()
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

			svg_edit_nodes.forEach(function(value, key, map) {
				d3.select(key).remove();
				}
			);
			svg_edit_nodes.clear();
			drawing_started = false;

		}
		else if (editing_started) {
			svg_edit_nodes.forEach(function(value, key, map) {
				d3.select(key).remove();
				}
			);
			svg_edit_nodes.clear();
			editing_started = false;
			d3.selectAll(".polyline,.polygon")
				.on("click", make_editable);
		}
	}

	function make_editable() {
		if (!editing_started){			
			d3.select(".selected").on("click", null);
			d3.select(".selected").classed("selected", false);
			d3.select(this).classed("selected", true);
			editing_started = true;

			let pathData = this.getPathData();

			for (let i = 0; i < pathData.length; i++) {
				let seg = pathData[i];
				let [x, y] = seg.values;
				let c = addDraggableAnchors(i, [x, y], this);
				c.on("contextmenu", delete_node)
				 .on("dblclick", split_node);
			}
		}
		else {
			svg.on("click", add_point);  
		}
	}
	
	function addDraggableAnchors(i, seg, path) {
		let c = addAnchor(i, seg, path);
		c.on('mouseover', function(){d3.select(this).classed("active", true);})
		 .on('mouseout', function(){d3.select(this).classed("active", false);})
		 .call(d3.drag()
			    .on("drag", dragged)
			    .on("end", dragEnded)
		);
		return c;
	}
	 
	function addLinkableAnchors(i, seg, path) {
		let c = addAnchor(i, seg.values, path);
		c.on("click", join_path_end_points);
		
		return c;
	}
	 
	function addAnchor(i, seg, path) {
		let [x, y] = seg;
		let c = svg.append('svg:circle')
					.attr("cx", x)
					.attr("cy", y)
					.attr('class', "anchor")
					.attr('r', anchor_radius)
					.attr('pos', i)
					.attr('fill', 'blue');
		svg_edit_nodes.set(c.node(), {'path': path, 'pathData': path.getPathData(), 'pos': i});
		
		return c;
	}

	function dragStarted() {
		// place an anchor at the node we are leaving now;
		let vertexPathData = svg_edit_nodes.get(this);  
		path = vertexPathData.path;
		pathData = vertexPathData.pathData;
		i = vertexPathData.pos - 1;
		[x, y] = pathData[i].values;		
		let c = addDraggableAnchors(i, [x, y], path);
		d3.select(this).raise();
	}

	function dragged() {
		x = d3.event.x;
		y = d3.event.y;    
		
		let vertexPathData = svg_edit_nodes.get(this);  
		path = vertexPathData.path;
		pathData = path.getPathData();
		
		i = vertexPathData.pos;
		pathData[i].values = [x, y];
		d3.select(this).attr("cx", x).attr("cy", y);
		
		path.setPathData(pathData);
		vertexPathData.pathData = pathData;
		if (2 <= i && i === pathData.length - 1)
		{
			for (var [key, value] of svg_edit_nodes) {
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

	function dragEnded() {
		x = d3.event.x;
		y = d3.event.y;
		drawing_mouseup(this);
	}
	
	function delete_node() {
		d3.event.preventDefault();
		let vertexPathData = svg_edit_nodes.get(this);  
		path = vertexPathData.path;
		pathData = path.getPathData();
		i = vertexPathData.pos;
		values = pathData.splice(i ,1);
		path.setPathData(pathData);
		svg_edit_nodes.forEach(
			function(v, k, m) {
				v.path = path;
				v.pathData = pathData;
				if (v.pos > i) {
					let t = v.pos;
					v.pos = v.pos - 1;
				}
			}
		);
		svg_edit_nodes.delete(this);
		d3.select(this).remove();
	}
	
		
	function split_node() {
		d3.event.preventDefault();
		let vertexPathData = svg_edit_nodes.get(this);  
		path = vertexPathData.path;
		pathData = path.getPathData();
		i = vertexPathData.pos;
		values = pathData[i].values;
		term = pathData[pathData.length - 1];
		
		if (term.type === "Z") {
			// just open up the polygon
			// first pop the "Z" segment 
			closingElement = pathData.pop();
			// rotate the pathData so the this node is the first
			pathData = pathData.map(function(el, idx, arr){
					return arr[(idx - i)%arr.length];
				}
			);
			svg_edit_nodes.forEach(
				function(v, k, m) {
					v.path = path;
					v.pathData = pathData;
					let t = v.pos;
					v.pos = (v.pos - i)%pathData.length;
				}
			);
			pathData.push(pathData[0]);
			let c = addDraggableAnchors(pathData.length - 1, values, path);
		}
		else {
			let temp_svg_edit_nodes = new Map();
			// split the polyline in two
			let leftPathData = pathData.slice(0, i + 1);
			let leftPath = svg.append("path")
							  .classed("polyline", true)
							  .on("click", make_editable)
							  .node();
			leftPath.setPathData(leftPathData);

			let rightPathData = pathData.slice(i, pathData.length);
			rightPathData[0].type = "M";
			let rightPath = svg.append("path")
							  .classed("polyline", true)
							  .on("click", make_editable)
							  .node();
			rightPath.setPathData(rightPathData);
			
			for (var [k, v] of svg_edit_nodes) {
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
			
			svg_edit_nodes = temp_svg_edit_nodes;
			console.log(svg_edit_nodes === temp_svg_edit_nodes);
			d3.select(path).remove();
			leftLength = leftPathData.length - 1;
			lastLeftValues = leftPathData[leftPathData.length - 1].values;
			let c = addDraggableAnchors(leftLength, lastLeftValues, leftPath);
			
		}
	}

	function add_point() {
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
			svg_edit_nodes.forEach(
				function(v, k, m) {
					v.path = path;
					v.pathData = pathData;
					if (v.pos > i) {
						let t = v.pos;
						v.pos = v.pos + 1;
					}
				}
			);
			let c = addDraggableAnchors(i + 1, [x, y], path);
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
		let vertexPathData = svg_edit_nodes.get(this); 
		let path = vertexPathData.path;
		let pathData = vertexPathData.pathData;
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
			svg_edit_nodes.forEach(
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
			let path = svg.append("path").attr("class", "polyline").node();
			path.setPathData(pathData);
			d3.select(firstPath).remove();
			d3.select(secondPath).remove();
			svg_edit_nodes.forEach(
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
}

document.body = document.createElement("body");
									
var vis = d3.select("body").append("svg") 
		.attr("width", 600)
		.attr("height", 400);

new MODE_EDIT_SVG(vis, document.body)