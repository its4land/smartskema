# -*- coding: utf-8 -*-
"""
Create voronoi tiles of polygons (2nd version)
Source of function voronoi_finite_polygons_2d: http://nbviewer.jupyter.org/gist/pv/8037100

@author: Daniel
"""
import math

import matplotlib.pyplot as plt
import numpy as np
from scipy.spatial import Voronoi  # , voronoi_plot_2d, ConvexHull
from shapely.geometry import LineString, Point, Polygon
from shapely.ops import cascaded_union

from its4land.util.spatial import excludes, get_sector, left_or_right, vector_angle

from .map_plotter import addToPlot, plotGPD


class VoronoiTiles():

    def voronoi_finite_polygons_2d(vor, bbox=None, radius=None):
        """
        Reconstruct infinite voronoi regions in a 2D diagram to finite
        regions.

        Parameters
        ----------
        vor : Voronoi
            Input diagram
        bbox : tuple, optional
            Maximum and minimum x,y coordinates for all output voronoi vertices
        radius : float, optional
            Distance to 'points at infinity'.

        Returns
        -------
        regions : list of tuples
            Indices of vertices in each revised Voronoi regions.
        vertices : list of tuples
            Coordinates for revised Voronoi vertices. Same as coordinates
            of input vertices, with 'points at infinity' appended to the
            end.

        """

        if vor.points.shape[1] != 2:
            raise ValueError("Requires 2D input")

        center = vor.points.mean(axis=0)
        if radius is None:
            radius = vor.points.ptp().max()*2

        new_vertices = vor.vertices.copy()
        ridge_vertices = vor.ridge_vertices.copy()
        ridge_points = vor.ridge_points.copy().tolist()
        regions = vor.regions.copy()
        nullified_vertices = []
        new_regions = np.empty((len(vor.regions),1), dtype=np.int32).tolist()
        
        procd_pt_pairs = []
        
        # store the outer points of the diagram
        perimeter = []
        bbox_perim_pos = []
        # store for each perimeter point the regions which it bounds
        perimeter_region = []
        
        if not bbox == None:
            minx, miny, maxx, maxy = bbox
            bbox_pts = [np.array([minx,miny]),np.array([maxx,miny]),np.array([maxx,maxy]),np.array([minx,maxy])]
            perimeter = [pt for pt in bbox_pts]
            perimeter_region = [[],[],[],[]]
            bbox_perim_pos = [0,1,2,3]
        
        # find out which of left or right is outside the bbox as we traverse the boundary
        bboxln = LineString(Polygon(bbox_pts).exterior.coords[:])
        outpt = Point(bbox_pts[2] + 10)
        out = left_or_right(bboxln, outpt)
        
        # if any voronoi vertices are beyond the bbox boundary, truncate all ridges 
        # entering such vertices to the bbox. This means we have to generate new 
        # vertices at the bbox and add them to the corresponding bounding regions
        # We do this by setting such vertices to -1 in referencing arrays
        for i, v in enumerate(vor.vertices):
            
            v_loc = left_or_right(bboxln, Point(v))
            
            if v_loc == out:
                # mark vertex at i as nullified - we'll set it to -1 in ridge_vertices
                # and remove any ridges from it to points at infinity we must also set it to -1
                # in all regions making sure to remove connected to this vertex
                nullified_vertices.append(i)

        invalid_ridges = []
        # go through all ridges and update the vertices
        for r, (v1, v2) in enumerate(ridge_vertices):
            # check which vertex has to go 
            if v1 in nullified_vertices:
                ridge_vertices[r][0] = -1
            if v2 in nullified_vertices:
                ridge_vertices[r][1] = -1
            # if both ridge vertices are -1 mark the ridge for removal
            if ridge_vertices[r][0] == -1 and ridge_vertices[r][1] == -1:
                invalid_ridges.append(r)
            # first retrieve the regions

        # we need to shift the invalid ridge pointers one position left after each delete
        shift = 0
        for r in invalid_ridges:
            del ridge_vertices[r - shift]
            del ridge_points[r - shift]
            shift += 1
        
        # then update the regions taking out all intervals of nullified vertices
        for r, region in enumerate(regions):
            # find the first nullified vertex and search backwards and forward to establish the interval
            pivot = -1
            
            for i,v in enumerate(region):
                if v == -1:
                    pivot = i
                if v in nullified_vertices:
                    if pivot < 0:
                        pivot = i
            
            if pivot < 0:
                continue
            
            rightEnd = False
            leftEnd = False
            
            while not leftEnd or not rightEnd:
                if not leftEnd:
                    if region[(pivot - 1) % len(region)] in nullified_vertices:
                        del region[(pivot - 1) % len(region)] 
                        if pivot > 0:
                            pivot -= 1
                    else:
                        leftEnd = True
                
                if not rightEnd:
                    if region[(pivot + 1) % len(region)] in nullified_vertices:
                        del region[(pivot + 1) % len(region)] 
                        if pivot == len(region):
                            pivot -= 1
                    else:
                        rightEnd = True

            if region[pivot] > 0:
                region[pivot] = -1

                
#        null_vert_regs = [(i, vr) for i,vr in enumerate(vor.regions) if any((x == y) for x in vr for y in nullified_vertices)]
#        print(null_vert_regs)
#        
#        null_vert_ridges = [vr for vr in ridge_vertices if any((x == y) for x in vr for y in nullified_vertices)]
#        print(null_vert_ridges)
        
        # Construct a map containing all ridges for a given point
        all_ridges = {}
        for (p1, p2), (v1, v2) in zip(ridge_points, ridge_vertices):
            all_ridges.setdefault(p1, []).append((p2, v1, v2))
            all_ridges.setdefault(p2, []).append((p1, v1, v2))
        
#        lines = [vor.vertices[i] for i in ridge_vertices if i[0] >= 0 and i[1] >=0]#[[vor.vertices[i[0]],vor.vertices[i[1]]] for i in ridge_vertices if i[0] >= 0 and i[1] >=0]
#
#        # plot ridges with nullified vertices to see
#        fig, ax = plt.subplots()
#        lc = mc.LineCollection(lines, linewidths=0.5)
#        ax.add_collection(lc)
#        ax.scatter(vor.points[:,0], vor.points[:,1], s=0.5, marker='x', color="red")#, markersize=1)
#        for i,v in enumerate(vor.points):
#                 plt.annotate( str(i), xy=v, xytext=(v + 6))
#        #ax.autoscale()
#        ax.margins(0.1)
#        plt.savefig('a_metric_ridges_out_vertices.svg')
#        plt.show()
#        
#        print ('Nullified Vertices:', nullified_vertices)
                    
        # Reconstruct infinite regions
        for p1, region in enumerate(vor.point_region):
                        
            vertices = regions[region]
            new_regions[region] = [v for v in vertices if v >= 0]

            if all([v >= 0 for v in vertices]):
                # finite region
                continue
            
            # reconstruct a non-finite region
            ridges = all_ridges[p1]
            #new_region = [v for v in vertices if v >= 0]

            for p2, v1, v2 in ridges:
                
                if v2 < 0:
                    v1, v2 = v2, v1
                if v1 >= 0:
                    # finite ridge: already in the region
                    continue
                elif set([p1,p2]) in procd_pt_pairs:
                    # we've already processed the ridge between p1 and p2
                    continue
                    
                region2 = vor.point_region[p2]

                # Compute the missing endpoint of an infinite ridge
                t = vor.points[p2] - vor.points[p1] # tangent
                t /= np.linalg.norm(t)
                nt = np.array([-t[1], t[0]])  # normal

                midpoint = vor.points[[p1, p2]].mean(axis=0)
                direction = np.sign(np.dot(midpoint - center, nt)) * nt
                dn = vector_angle(direction)
                far_point = vor.vertices[v2] + direction * radius
                ridge = [vor.vertices[v2], far_point]
                
                # find intersection point between bbox and vector starting at v2 in direction 'direction'
                # just find the distance to the nearest bounding box edge. First compute the sectors of 
                # the tiling centered at v2 with rays going to each of the 4 corners of bbox
                if not bbox == None:
                    angles = []
                    for p in perimeter:
                        v = np.array(p) - vor.vertices[v2]
                        angles.append(vector_angle(v))
                        
                    sectors = [(angles[i], angles[(i+1)%len(angles)]) for i in range(len(angles))]

                    t_sector = get_sector(dn, 2*np.pi, sectors)
                    interval = (perimeter[t_sector],perimeter[(t_sector + 1)%len(angles)])
                    
                    excludesP1 = excludes(LineString(ridge), Point(vor.points[p1]))
                    
                    bbox_sides = [excludes(LineString(ridge), Point(bpt)) for bpt in bbox_pts]
                    
                    m = 0
                    b = 0
                    
                    if interval[0][0] == interval[1][0]:
                        # intercept on vertical edges
                        far_point_x = interval[0][0]
                        if direction[1] == 0:
                            # line is vertical
                            far_point_y = vor.vertices[v2][1]
                        else:
                            # line is non-vertical: find slope and intercept
                            m = direction[1]/direction[0]
                            b = (-m)*vor.vertices[v2][0] + vor.vertices[v2][1]
                            far_point_y = m * far_point_x + b
                            
                    elif interval[0][1] == interval[1][1]:
                        # intercept on horizontal edge
                        far_point_y = interval[0][1]
                        if direction[0] == 0:
                            # line is horizontal
                            far_point_x = vor.vertices[v2][0]
                        else:
                            # line is non-vertical: find slope and intercept
                            m = direction[1]/direction[0]
                            b = (-m)*vor.vertices[v2][0] + vor.vertices[v2][1]
                            far_point_x = m**-1 * (far_point_y - b)
                    
                    # instantiate the new finite voronoi vertex
                    far_point = np.array([far_point_x,far_point_y])
                                        
                    # update the bbox regions if any
                    for b in range(len(bbox_perim_pos)):
                        pt_pos = bbox_perim_pos[b]
                        # if this bbox point immediately precedes new point then remove 
                        # all regions chosen based on previously succeding point and the 
                        # new region based on the currently inserted point
                        if pt_pos == t_sector:
                            try:
                                perimeter_region[pt_pos].remove(perimeter_region[t_sector+1][0])                                
                            except (IndexError,ValueError):
                                pass
                            try:
                                perimeter_region[pt_pos].remove(perimeter_region[t_sector+1][1])                                
                            except (IndexError,ValueError):
                                pass
                            
                            if excludesP1 == bbox_sides[b] and not region in perimeter_region[pt_pos]:
                                perimeter_region[pt_pos].append(region)
                            elif not excludesP1 == bbox_sides[b] and not region2 in perimeter_region[pt_pos]:
                                perimeter_region[pt_pos].append(region2)
                        # if this bbox point immediately succedes new point then remove 
                        # all regions chosen based on previously preceding point and the 
                        # new region based on the currently inserted point                        
                        if pt_pos == t_sector + 1:
                            try:
                                perimeter_region[pt_pos].remove(perimeter_region[t_sector][0])                                
                            except (IndexError,ValueError):
                                pass
                            try:
                                perimeter_region[pt_pos].remove(perimeter_region[t_sector][1])                                
                            except (IndexError,ValueError):
                                pass
                            
                            if excludesP1 == bbox_sides[b] and not region in perimeter_region[pt_pos]:
                                perimeter_region[pt_pos].append(region)
                            elif not excludesP1 == bbox_sides[b] and not region2 in perimeter_region[pt_pos]:
                                perimeter_region[pt_pos].append(region2) 
                                
                    # update the positions of all succeding bbox points by shifting them down one position
                    bbox_perim_pos = [b if b < t_sector + 1 else b + 1 for b in bbox_perim_pos]
                
                # insert new voronoi vertex (far_point) into list of perimeter points
                perimeter.insert(t_sector + 1, far_point)
                # note the voronoi region bounded by this far_point
                perimeter_region.insert(t_sector + 1, [region, region2])
                    
                # mark point pair as processed so that we don't duplicate finite points
                procd_pt_pairs.append(set([p1,p2]))
            
        # first convert the vertices np.array to list
        new_vertices = vor.vertices.tolist()
        
#        lines = [vor.vertices[i] for i in ridge_vertices if i[0] >= 0 and i[1] >=0]#[[vor.vertices[i[0]],vor.vertices[i[1]]] for i in ridge_vertices if i[0] >= 0 and i[1] >=0]
#        
#        # plot ridges to see
#        lc = mc.LineCollection(lines, linewidths=2)
#        fig, ax = plt.subplots()
#        ax.add_collection(lc)
#        ax.autoscale()
#        ax.margins(0.1)
#        plt.savefig('ridges.svg')
#        plt.show()
#        
#        # go through all the perimeter points and append them to their regions as vertices
        for per_pos, per_pt in enumerate(perimeter):
            for region in perimeter_region[per_pos]:
                new_regions[region].append(len(new_vertices))
                new_vertices.append(per_pt.tolist())
        
        # sort regions counterclockwise and store in regions list
        regions = []
        for new_region in new_regions:
            vs = np.asarray([new_vertices[v] for v in new_region])
            cn = vs.mean(axis=0)
            angles = np.arctan2(vs[:,1] - cn[1], vs[:,0] - cn[0])
            region = np.array(new_region)[np.argsort(angles)]
            # finish
            regions.append(region.tolist())
            
#        lines = [(new_vertices[r[i]], new_vertices[r[(i+1)%len(r)]]) for r in regions for i in range(len(r))]#[[vor.vertices[i[0]],vor.vertices[i[1]]] for i in ridge_vertices if i[0] >= 0 and i[1] >=0]
#        
#        # plot ridges to see
#        lc = mc.LineCollection(lines, linewidths=0.5)
#        fig, ax = plt.subplots()
#        ax.add_collection(lc)
#        ax.autoscale()
#        ax.margins(0.1)
#        plt.savefig('a_metric_final_ridges.svg')
#        plt.show()        
            
        return regions, np.asarray(new_vertices)


    def getTiles(data, bbox, lbl='1'):
        points = {}
        coord_list = []
        polyCoordPositions = {}
        voronoiTiles = {}
        
        # track the position of each vertex of each geometry in the coordinates list passsed to scypi.voronoi
        # this position is mapped to the id of the corresponding feature in polyCoordPositions
        vert_cnt = 0
        
        vor_data = VoronoiTiles.get_min_dists([d['geometry'] for d in data])
        toPlot = []
                
        for d_pos in range(len(vor_data)):
            pid = data[d_pos]['attributes']['ssm_id']
            polyCoordPositions[pid] = []

            if isinstance(data[d_pos]['geometry'], Polygon):
                coords = VoronoiTiles.sample_geometry(vor_data[d_pos][0].exterior.coords[:], vor_data[d_pos][1])
                toPlot.append(Polygon(coords))
                coords = coords[:-1]
            if isinstance(data[d_pos]['geometry'], LineString):
                coords = VoronoiTiles.sample_geometry(vor_data[d_pos][0].coords[:], vor_data[d_pos][1])
                toPlot.append(LineString(coords))
            if isinstance(data[d_pos]['geometry'], Point):
                coords = VoronoiTiles.sample_geometry(vor_data[d_pos][0].coords[:], vor_data[d_pos][1])
                toPlot.append(Point(coords))
                        
            for coord in coords:
                current_vert = vert_cnt
                try:
                    current_vert = points[coord]
                except:
                    points[coord] = current_vert
                    coord_list.append(coord)
                    vert_cnt += 1
                    
                polyCoordPositions[pid].append(current_vert)
                
        lbl = 'map_data_'+lbl
#        plot = plotGPD(toPlot, lbl)       

        # prepare bbox: add the maximum of min-dists as buffer around bbox 
        # - the rational here is that max of min-dists will include enough outer space and if 
        #   sketch map distances are somewhat correlated to metric map distances this implies
        #   an increased chance of including objects on the periphery in the expected voronoi region
        # First get the maximum distance
        maxmin_dist = max([d[1] for d in vor_data])
        
        minx, miny, maxx, maxy = np.array(bbox.bounds)
        
        bbox = Polygon([(minx - maxmin_dist,miny - maxmin_dist),(maxx + maxmin_dist,miny - maxmin_dist),(maxx + maxmin_dist,maxy + maxmin_dist),(minx - maxmin_dist,maxy + maxmin_dist)])
        
        vor = Voronoi(coord_list, qhull_options="QJ Pp") # )#  #UNCOMMENT
#        fig = voronoi_plot_2d(vor, show_vertices= False, line_width=0.5, point_size=0.5)
#        fig.set_size_inches((10, 10), forward=True)
#        plt.xlim(vor.min_bound[0] - 0.5, vor.max_bound[0] + 0.5)
#        plt.ylim(vor.min_bound[1] - 0.5 , vor.max_bound[1] + 0.5000)
#        fig.savefig("orig_"+lbl+".svg")
#        plt.show()

        # plot
        regions, vertices = VoronoiTiles.voronoi_finite_polygons_2d(vor, bbox = bbox.bounds) #UNCOMMENT
        
        plotTiles = []
        # merge regions corresponding to polygons
        unmerged_vor_regs = []
        for pid in polyCoordPositions:
            region_set = []
            for pt_pos in polyCoordPositions[pid]:
                pt_region = regions[vor.point_region[pt_pos]]
                region_set.append(Polygon(vertices[pt_region]))
                unmerged_vor_regs.append(Polygon(vertices[pt_region]))
                
            try:
                poly_vor_pg = cascaded_union(region_set)
            except ValueError:
                raise
            # get the combined polygon back as np.array for matplotlib
            # vor_pg = np.array(poly_vor_pg.exterior)
            
            voronoiTiles[pid] = poly_vor_pg
            plotRow = VoronoiTiles.attrByID(data, pid)
            plotRow['feat_type'] = plotRow['feat_type'] + '_vor_region'
            plotTiles.append({'attributes':plotRow, 'geometry':poly_vor_pg})
            # only need this for visualdebug in matplotlib
            #polyVoronoiMapping[pid] = vor_pg
            
        lbl = 'voronoi_'+lbl
#        plot = plotGPD(unmerged_vor_regs, lbl+'_unmerged') # UNCOMMENT
#        addToPlot(vert_points, plot, lbl+'_unmerged')
#        plot = plotGPD(plotTiles, lbl) # UNCOMMENT
#        addToPlot(plotTiles, plot, lbl) # UNCOMMENT
        
        return voronoiTiles
 
    
    def get_min_dist(geom, other_geoms):
        _min_dist = math.inf
        
        for other in other_geoms:
            _min_dist = min(_min_dist, geom.distance(other))
            
        return _min_dist
    
    def get_min_dists(geoms):
        _min_dists = []
        for geom_pos in range(len(geoms)):
            _min_dists.append(
                              (geoms[geom_pos], min(VoronoiTiles.get_min_dist(geoms[geom_pos], geoms[:geom_pos]),
                                   VoronoiTiles.get_min_dist(geoms[geom_pos], geoms[geom_pos + 1:])) ) )
            
        return _min_dists
    
    def sample_geometry(coords, gap):
        # generate edges
        edge_list = []
        if len(coords) < 2:
            return coords
        for pos in range(len(coords) - 1):
            edge_list.append([coords[pos],coords[pos + 1]])
            
        for edge in edge_list:
            edge_len = Point(edge[0]).distance(Point(edge[1]))
            num_pts = int(edge_len/gap + 0.5)
            gap_ratio = 1.0 / (num_pts + 1)
            edge_geom = LineString(edge)
            
            for i in range(num_pts):
                pos = i + 1
                next_pt = edge_geom.interpolate(pos*gap_ratio, normalized=True)
                edge.insert(pos, next_pt.coords[0])
                
        # repack the coordinates into a single list. Last coordinate of preceding edge is first coordinate of next edge
        sampled_pts = edge_list[0]
        
        for edge in edge_list[1:]:
            for coord in edge[1:]:
                sampled_pts.append(coord)
                
        return sampled_pts


    def attrByID(data, ssm_id):
        for d in data:
            if d['attributes']['ssm_id'] == ssm_id:
                a = d['attributes'].copy()
                return a
            
        return {}
