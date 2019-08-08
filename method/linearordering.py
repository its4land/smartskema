# -*- coding: utf-8 -*-
"""
Created on Fri Feb 02 14:02:12 2018
  -Computes linear ordering betweeen adjacent landmarks and street

@author: s_jan001
"""
from shapely.geometry import LineString, Point

from method.spatial import compute_adjacency, compute_max_min_dist


def linear_referencing(poly, line):
    # pd = line.project(Point(poly))
    # print pd# slice the vertices of the relatum to
    distances = []

    polyCoords = poly.exterior.coords[:]  # [::-1]
    # print polyCoords
    # print line.coords[:]
    # coords = list(line.coords)
    # for i, p in enumerate(coords):
    #   pd = line.project(Point(p), normalized= True)
    #  cp = line.interpolate(pd, normalized = True)
    # print "streets Points:",cp
    # lineLength = line.length
    # print lineLength
    for i in range(len(polyCoords)):
        # print polyCoords[i]
        pd = line.project(Point(polyCoords[i]), normalized=True)
        distances.append(pd)
    # print "distances:", distances
    minDist = min(distances)
    maxDist = max(distances)
    # print minDist, maxDist

    startInterval = line.interpolate(minDist, normalized=True)
    endInterval = line.interpolate(maxDist, normalized=True)
    # print "start and end Intervals:", startInterval,endInterval

    # print "intervals",polygonIntervals
    return startInterval, endInterval


def linear_ordering(geom1, geom2):
    # coordint = geom1.coords[:]
    # print coordint
    A1 = Point(geom1.coords[:][0])
    A2 = Point(geom1.coords[:][1])

    B1 = Point(geom2.coords[:][0])
    B2 = Point(geom2.coords[:][1])

    print("1st poly projected inervals:", A1, A2)
    print("2nd poly projected inervals:", B1, B2)
    print("------")
    # p1d = geom2.project(Point(B11),normalized= True)

    if ((A1.x <= A2.x and B1.x <= B2.x and A2.x < B1.x) or (A1.y <= A2.y and B1.y <= B2.y and A2.y < B1.y)):
        return "before"
    elif ((A1.x <= A2.x and B1.x <= B2.x and A1.x > B2.x) or (A1.y <= A2.y and B1.y <= B2.y and A1.y > B2.y)):
        return "after"
    elif ((A1.x <= A2.x and B1.x <= B2.x and A2.x == B1.x) or (A1.y <= A2.y and B1.y <= B2.y and A2.y == B1.y)):
        return "meets"
    elif ((A1.x <= A2.x and B1.x <= B2.x and A1.x == B2.x) or (A1.y <= A2.y and B1.y <= B2.y and A1.y == B2.y)):
        return "meet_by"
    elif ((A1.x <= A2.x and B1.x <= B2.x and A2.x > B1.x and A1.x < B1.x and A2.x < B2.x) or (
            A1.y <= A2.y and B1.y <= B2.y and A2.y > B1.y and A1.y < B1.y and A2.y < B2.y)):
        return "overlaps"
    elif ((A1.x <= A2.x and B1.x <= B2.x and B2.x > A1.x and B1.x < A1.x and B2.x < A2.x) or (
            A1.y <= A2.y and B1.y <= B2.y and B2.y > A1.y and B1.y < A1.y and B2.y < A2.y)):
        return "overlapped_by"
    elif ((A1.x <= A2.x and B1.x <= B2.x and A1.x > B1.x and A2.x < B2.x) or (
            A1.y <= A2.y and B1.y <= B2.y and A1.y > B1.y and A2.y < B2.y)):
        return "during"
    elif ((A1.x <= A2.x and B1.x <= B2.x and A1.x < B1.x and A2.x > B2.x) or (
            A1.y <= A2.y and B1.y <= B2.y and A1.y < B1.y and A2.y > B2.y)):
        return "during_inv"
    elif ((A1.x <= A2.x and B1.x <= B2.x and A1.x == B1.x and A2.x < B2.x) or (
            A1.y <= A2.y and B1.y <= B2.y and A1.y == B1.y and A2.y < B2.y)):
        return "starts"
    elif ((A1.x <= A2.x and B1.x <= B2.x and A1.x == B1.x and A2.x > B2.x) or (
            A1.y <= A2.y and B1.y <= B2.y and A1.y == B1.y and A2.y > B2.y)):
        return "started_by"
    elif ((A1.x <= A2.x and B1.x <= B2.x and A1.x > B1.x and A2.x == B2.x) or (
            A1.y <= A2.y and B1.y <= B2.y and A1.y > B1.y and A2.y == B2.y)):
        return "finishes"
    elif ((A1.x <= A2.x and B1.x <= B2.x and A1.x < B1.x and A2.x == B2.x) or (
            A1.y <= A2.y and B1.y <= B2.y and A1.y < B1.y and A2.y == B2.y)):
        return "finished_by"
    elif ((A1.x <= A2.x and B1.x <= B2.x and A1.x == B1.x and A2.x == B2.x) or (
            A1.y <= A2.y and B1.y <= B2.y and A1.y == B1.y and A2.y == B2.y)):
        return "equals"


def qualify_linear_ordering(data):
    relation_set = 'linearOrdering'
    arity = 2
    polygonList = []
    streetList = []
    poly_Intervals_list = []
    street_Intervals_list = []
    intervalList = []
    polyIDList = []
    streetIDList = []

    for i in range(len(data)):
        if (data[i]['geometry'].geom_type == 'Polygon'):
            polygonList.append((i, data[i]['geometry']))
        elif (data[i]['geometry'].geom_type == 'LineString'):
            streetList.append((i, data[i]['geometry']))

    maxMinDist = computeMinMaxDist(polygonList, streetList)
    # print maxMinDist
    for i in range(len(data)):
        for sec in data:
            if (data[i]['geometry'].geom_type == 'Polygon' and sec['geometry'].geom_type == 'LineString'):
                # check that the two geoms are adjacent
                isAdjacent = computeAdjacency(data[i]['geometry'], sec['geometry'], 7.99)

                if (isAdjacent == "Adjacent"):
                    # project and extract intervals of adjacent landmarks
                    intA, intB = linear_referencing(data[i]['geometry'], sec['geometry'])
                    # print sec['geometry']
                    if data[i] not in polyIDList:
                        polyIDList.append(data[i])
                        poly_Intervals_list.append((data[i], LineString([intA, intB])))
                        # print poly_Intervals_list
                    if sec not in streetIDList:
                        streetIDList.append(sec)
                        street_Intervals_list.append((sec, sec['geometry']))

    intervalList.extend(street_Intervals_list)
    intervalList.extend(poly_Intervals_list)
    # print intervalList
    #  for i in range(len(intervalList[:])):
    #     print poly_Intervals_list[:]['geometry']

    return relation_set, arity, {}, [
        {'obj 1': intervalList[i][0]['attributes']['id'], 'obj 2': sec[0]['attributes']['id'],
         'relation': linear_ordering(intervalList[i][1], sec[1])}
        for i in range(len(intervalList[:])) for sec in intervalList[i + 1:]]
