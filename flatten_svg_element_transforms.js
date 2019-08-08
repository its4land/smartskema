    function flatten_transformations(raphael_path_elem, normalize_path) {

        var arr, pathDOM = raphael_path_elem.node,
            d = pathDOM.getAttribute("d").trim();

        if (!normalize_path) // Set to false to prevent possible re-normalization. 
        arr = Raphael.parsePathString(d);
        else arr = Raphael.path2curve(d); // mahvstcsqz -> MC
        if (d.charAt(d.length - 1).toUpperCase() == "Z" && arr[arr.length - 1][0].toUpperCase() != "Z") arr.push(["Z"]); // To fix missing Z
        var svgDOM = pathDOM.ownerSVGElement;

        // Get the matrix that converts path coordinates to SVGroot coordinate space
        var matrix = pathDOM.getTransformToElement(svgDOM);

        // The following code expects normalized path data, but tries to
        // handle also partially normalized data
        var i, j, pt, letter, x, y, point, newcoords = [],
            seg_length;
        for (i = 0; i < arr.length; i++) {
            letter = arr[i][0].toUpperCase();
            x = 0, y = 0;
            newcoords[i] = [];
            newcoords[i][0] = arr[i][0];
            if (letter != "Z" && letter != "A") {
                seg_length = arr[i].length;
                if (letter != "H" && letter != "V") {
                    for (j = 1; j < arr[i].length; j = j + 2) {
                        x = arr[i][j];
                        y = arr[i][j + 1];
                        pt = svgDOM.createSVGPoint();
                        pt.x = x;
                        pt.y = y;
                        point = pt.matrixTransform(matrix);
                        newcoords[i][j] = point.x;
                        newcoords[i][j + 1] = point.y;
                    }
                }
                else if (letter == "H") {
                    x = arr[i][seg_length - 1];
                    newcoords[i][1] = x;
                }
                else if (letter == "V") {
                    y = arr[i][seg_length - 1];
                    newcoords[i][1] = y;
                }
            }
        }
        newcoords = newcoords.join(" ");
        return newcoords;
    } // function flatten_transformations