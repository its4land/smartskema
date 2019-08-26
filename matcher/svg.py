# -*- coding: utf-8 -*-
"""
Created on Tue Jan 23 12:38:23 2018

@author: Malumbo
"""
import numpy as np
from shapely.geometry import LineString, Point, Polygon
from svgpathtools import CubicBezier, Line, QuadraticBezier, Arc, svg2paths2

from method.spatial import is_clockwise

import shapely.geometry as geom


def arc_to_polylines(arc, num_segments=5):
    ''' # Define the arc (presumably ezdxf uses a similar convention)
        centerx, centery = 3, 4
        radius = 2
        start_angle, end_angle = 30, 56 # In degrees
        numsegments = 1000
        # The coordinates of the arc
        theta = np.radians(np.linspace(start_angle, end_angle, numsegments))
        x = centerx + radius * np.cos(theta)
        y = centery + radius * np.sin(theta)

        arc = geom.LineString(np.column_stack([x, y]))
    '''

    polyline = [arc.point(float(i)/float(num_segments)) for i in range(num_segments)]

    return polyline


def simplify_qcurve_simple(p0, p1, p2, segments=[]):
    # simply replace curve with line
    segments.append({'start': p0, 'end': p2})
    return segments


# simple recursive bezier curve simplification
def simplify_qcurve(p0, p1, p2, c, segments=[]):
    m0 = ave(p0, p1)
    m1 = ave(p1, p2)
    m2 = ave(p2, p0)
    q0 = ave(m0, m1)

    # if curvature is smaller than c then don't split anymore
    if (dist(q0, m2) / dist(p0, p2) <= c):
        segments.append({'start': p0, 'end': p2})
        return segments
    else:
        segments = simplify_qcurve(p0, m0, q0, c)
        segments = simplify_qcurve(q0, m1, p2, c)

    return segments


def simplify_ccurve_simple(p0, p1, p2, p3, segments=[]):
    # simply replace curve with line
    segments.append({'start': p0, 'end': p3})
    return segments


# simple recursive bezier curve simplification
def simplify_ccurve(p0, p1, p2, p3, c, segments=[]):
    m0 = ave(p0, p1)
    m1 = ave(p1, p2)
    m2 = ave(p2, p3)
    m3 = ave(p3, p0)
    q0 = ave(m0, m1)
    q1 = ave(m1, m2)
    u0 = ave(q0, q1)

    # if curvature is smaller than c then don't split anymore
    if (dist(u0, m3) / dist(p0, p3) <= c):
        segments.append({'start': p0, 'end': p3})
        return segments
    else:
        segments = simplify_ccurve(p0, m0, q0, u0, c)
        segments = simplify_ccurve(u0, q1, m2, p3, c)

    return segments


def ave(a, b):
    return (a + b) / 2


def dist(a, b):
    return abs(a - b)


# Convert list of coordinates to shapley geometry objects
def point_list2shapely(d_path):
    # is the path a point?
    if len(d_path) == 1:
        return Point(d_path[0])
    # is the path closed?
    elif d_path[0] == d_path[len(d_path) - 1]:
        p = None
        try:
            p = Polygon(d_path)
            if (is_clockwise(p)):
                p = Polygon(p.exterior.coords[::-1])
        except ValueError:
            print(d_path)
            raise ValueError
        return p
    # it's a linestring
    else:
        return LineString(d_path)


def load_map(map_data, map_type):
    # set the properties accordingly -- at least the map type
    map_properties = {'map_type': map_type}

    # Update: You can now also extract the svg-attributes by setting
    # return_svg_attributes=True, or with the convenience function svg2paths2
    paths, attributes, svg_attributes = map_data

    # map attributes to remove non-essential attributes
    for x in attributes:
        if 'description' not in x.keys():
            x['description'] = "N/A"
        if 'hidden_' not in x.keys():
            x['hidden_'] = "N/A"

    attributes = list(map(lambda x: {'ssm_id': x['id'], 'name': x['name'], 'sm_sk_type': x['smart_skema_type'],
                                'feat_type': x['smart_skema_type'],
                                'descriptn': x['description'], 'hidden': x['hidden_']}, attributes))


    shapelyGeoms = []

    # split curves if the ratio of the curve radius and the base (start to end) diameter is greater than the parameter c
    # 0c=0.01
    minx = 0
    maxx = 0
    miny = 0
    maxy = 0

    def updateBounds(p, bounds):
        minx, maxx, miny, maxy = bounds
        if p.real < miny:
            miny = p.real
        elif p.real > maxy:
            maxy = p.real
        if p.imag < minx:
            minx = p.imag
        elif p.imag > maxx:
            maxx = p.imag

        return (minx, maxx, miny, maxy)

    d_paths = []
    i = 0
    for p in paths:
        # we unpack each complex number representing a point into its components
        d_path = [(1 * p.point(0).real, -1 * p.point(0).imag)]

        (minx, maxx, miny, maxy) = updateBounds(p.point(0), (minx, maxx, miny, maxy))

        for s in p:
            if isinstance(s, Line):
                sp = s.bpoints()
                d_path.append((1 * sp[1].real, -1 * sp[1].imag))
                (minx, maxx, miny, maxy) = updateBounds(sp[1], (minx, maxx, miny, maxy))

            elif isinstance(s, QuadraticBezier):
                sp = s.bpoints()
                segments = simplify_qcurve_simple(sp[0], sp[1], sp[2], segments=[])
                points = map(lambda x: (1 * x['end'].real, -1 * x['end'].imag), segments)
                d_path.extend(points)
                (minx, maxx, miny, maxy) = updateBounds(sp[2], (minx, maxx, miny, maxy))

            elif isinstance(s, CubicBezier):
                sp = s.bpoints()
                segments = simplify_ccurve_simple(sp[0], sp[1], sp[2], sp[3], segments=[])
                points = map(lambda x: (1 * x['end'].real, -1 * x['end'].imag), segments)
                d_path.extend(points)
                (minx, maxx, miny, maxy) = updateBounds(sp[3], (minx, maxx, miny, maxy))

            elif isinstance(s, Arc):
                points = arc_to_polylines(s)
                points = map(lambda x: (1 * x.real, -1 * x.imag), points[1:])
                d_path.extend(points)
                sp = s.point(1)
                d_path.append((1 * sp.real, -1 * sp.imag))
                (minx, maxx, miny, maxy) = updateBounds(sp, (minx, maxx, miny, maxy))


        d_paths.append(d_path)
        i += 1

    #        shapelyGeoms.append(point_list2shapely(d_path))

    print((minx, maxx, miny, maxy))

    for p in d_paths:
        pd = [(ptx + maxx, pty + maxy) for (ptx, pty) in p]
        try:
            shapelyGeoms.append(point_list2shapely(pd))
        except ValueError:
            print(p)
            print(d_paths.index(p))
            print(attributes[d_paths.index(p)])

    # features = map( lambda x, y: {"attributes":x, "geometry":y}, attributes, shapelyGeoms)
    features = [{"attributes": x, "geometry": y} for (x, y) in zip(attributes, shapelyGeoms)]
    for d in features:
        d['attributes']['geometry_type'] = d['geometry'].geom_type

    #print("map loaded")

    # map loaded, so return the data
    return map_properties, features
