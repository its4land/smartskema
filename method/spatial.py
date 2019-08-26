# -*- coding: utf-8 -*-
"""
Created on Tue Jan 23 11:31:48 2018

@author: Malumbo

Utility functions related to spatial geometries and reasoning

"""
from collections import deque
from functools import reduce

import numpy as np
from shapely.geometry import *
from sklearn.cluster import KMeans


###################### General polygon stuff #########################################
# If the vertices of the polygon are listed in counterclockwise order or not
def is_clockwise(poly):
    x = poly.exterior.coords[:-1]
    N = len(x)
    return (sum([(x[(i + 1) % N][0] - x[i][0]) * (x[(i + 1) % N][1] + x[i][1]) for i in range(N)]) > 0)


###################### Directinal relations #########################################

def calculate_sectors(rot, rng, num_sectors):
    sector_size, sector_rot = rng / num_sectors, rng / (num_sectors * 2)
    return [((rot + i * sector_size - sector_rot) % rng, (rot + i * sector_size + sector_rot) % rng) for i in
            range(num_sectors)]


def get_sector(angle, rng, sectors):
    for sector in range(len(sectors)):
        if (0 <= (angle - sectors[sector][0]) % rng < (sectors[sector][1] - sectors[sector][0]) % rng):
            return sector


def vector_angle(v):
    return (np.arctan2(*v[::-1]) + 2 * np.pi) % (2 * np.pi)


def directional_relation(referent, relatum, front, rng, sectors):
    # get centroid cntr of referent polygon
    cntr = referent.convex_hull.centroid

    # if relatum is point find single sector and return
    if isinstance(relatum, Point):
        v = np.array(relatum.coords[:][0]) - np.array(cntr.coords[:][0])
        dir = np.rad2deg(vector_angle(v))
        return set((get_sector(dir, rng, sectors),))
    elif isinstance(relatum, LineString):
        coords = relatum.coords[:]
    else:
        coords = relatum.exterior.coords[:]

    sectors_covered = set()

    for i in range(len(coords) - 1):
        # which way should we be counting sectors
        delta_dir = 0
        # create triangle for checking vertex orientation (CW/CCW)
        if (is_clockwise(Polygon([coords[i], coords[(i + 1)], cntr.coords[:][0]]))):
            delta_dir = -1
        else:
            delta_dir = 1

        # calculate the vectors representing the rays from cntr to the ith and (i+1)th vertices of the relatum
        start_v = np.array(coords[i]) - np.array(cntr.coords[:][0])
        end_v = np.array(coords[i + 1]) - np.array(cntr.coords[:][0])

        # find the base directions of the ray vectors using the arctan2 convention (i.e. relative to the x-axis)
        if (rng == 360):
            start_dir = np.rad2deg(vector_angle(start_v))
            end_dir = np.rad2deg(vector_angle(end_v))
        elif (rng == 2 * np.pi):
            start_dir = vector_angle(start_v)
            end_dir = vector_angle(end_v)

        # find the sectors with respect to the referent that contain the current and next vertex  
        current_sector = get_sector(start_dir, rng, sectors)
        end_sector = get_sector(end_dir, rng, sectors)

        # count out all the sectors crossed by the line from the ith to the (i+1)th vertex and 
        # add them to the sector covering the relatum 
        sectors_covered.add(current_sector)
        while (current_sector != end_sector):
            current_sector = (current_sector + delta_dir) % len(sectors)
            sectors_covered.add(current_sector)

    return sectors_covered


################## for left-right relations #########################################################


def excludes(line, other):
    if isinstance(other, Point):
        lr = line.coords[:]
        lr.extend(other.coords[:])
        return is_clockwise(Polygon(lr))
    elif isinstance(other, LineString):
        excluded = False
        for point in other.coords[:]:
            excluded = excluded or excludes(line, Point(point))
        return excluded
    else:
        return None


def left_or_right(polyline, other):
    pts_left = 0
    pts_right = 0

    # check where each point of other is - left or right
    if isinstance(other, Polygon):
        other_coords = other.exterior.coords
    else:
        other_coords = other.coords

    for point in other_coords[:]:
        includers = deque()
        excluders = deque()

        coords = polyline.coords[:]
        for line in [LineString((coords[i], coords[i + 1])) for i in range(len(coords[:-1]))]:
            if excludes(line, Point(point)):
                excluders.appendleft(line)
            else:
                includers.appendleft(line)

        pt_in = False
        done = len(includers) == 0

        while not done:

            e = includers.pop()
            for i in range(len(excluders)):
                e_ = excluders.pop()
                if not (excludes(e, e_) and excludes(e_, e)):
                    excluders.appendleft(e_)

            if len(excluders) == 0:
                pt_in = True
                done = True

            if len(includers) == 0:
                done = True

        if pt_in:
            pts_left += 1
        else:
            pts_right += 1

    if pts_left > 0 and pts_right > 0:
        return 'crosses'
    elif pts_left > 0:
        return 'left'
    elif pts_right > 0:
        return 'right'
    else:
        raise Exception('something went wrong')


############################### relative distance and adjacency ##########################################
def compute_max_min_dist(geoms_1, geoms_2=None):
    """
    Computes maximum of the minimum among distances between geometries of geoms_1 and geometries of
    geoms_2. If geoms_1 == geoms_2 compute_max_min_dist(geoms_1, geoms_2) returns the maximum of the
    minimum of pairwise distances between the geometries in geoms_1. Otherwise it returns the maximum
    of the minimum distances between geometries in geom_1 and geometries in geom_2.

    :param geoms_1:
    :param geoms_2:
    :return:
    """
    min_dist_list = []
    if geoms_2 is None or geoms_2 == geoms_1:
        for g1 in range(len(geoms_1) - 1):
            distances = []
            for g2 in range(g1 + 1, len(geoms_1)):
                distances.append(geoms_1[g1].distance(geoms_1[g2]))
            min_dist_list.append(min(distances))
    else:
        for g1 in range(len(geoms_1)):
            distances = []
            for g2 in range(len(geoms_2)):
                distances.append(geoms_1[g1].distance(geoms_2[g2]))
            min_dist_list.append(min(distances))

    max_min_dist = max(min_dist_list)
    return max_min_dist


def compute_adjacency(g1, g2, maxdist):
    street_buffer = g2.buffer(maxdist)
    adjacent = street_buffer.intersects(g1)
    if adjacent:
        return "adjacent"
    else:
        return "non_adjacent"


def distance_relation(o1, o2, near_end, far_end):
    dist = compute_distance(o1, o2)
    if dist <= near_end:
        return "near"
    elif dist <= far_end:
        return "far"
    else:
        return "vfar"


def compute_distance(geom1, geom2):
    dist = geom1.distance(geom2)
    return dist


def clustering_distances(min_dist_data):
    min_dist_data1 = np.array(min_dist_data)
    min_dist_data2 = min_dist_data1.reshape(-1, 1)

    km = KMeans(n_clusters=3, init='k-means++', n_init=10)
    km.fit(min_dist_data2)
    x = km.fit_predict(min_dist_data2)
    return x


def compute_relative_dis_ranges_1_to_M(relatum,secondary_geoms):
    min_dist_list = []
    for g1 in secondary_geoms:
        g1coord = g1['geometry']
        min_dist_list.append(relatum.distance(g1coord))
    #print("min_dist_list",min_dist_list)
    x = clustering_distances(min_dist_list)

    near_dists = []
    far_dists = []
    vfar_dists = []
    for i in range(len(x)):
        if x[i] == 2:
            near_dists.append(min_dist_list[i])
        elif x[i] == 1:
            far_dists.append(min_dist_list[i])
        elif x[i] == 0:
            vfar_dists.append(min_dist_list[i])

    near_range = (min(near_dists), max(near_dists))
    #print("nearEnd",near_range)
    far_range = (min(far_dists), max(far_dists))
    #print("far_range", far_range)
    vfar_range = (min(vfar_dists), max(vfar_dists))
    #print("vfar_range", vfar_range)

    ''' clusters are returned in arbitrary order so we have to sort them to 
        have each distance name refer to the correct  distance (i.e. [1,2,3] could be cluster 1
        while [31, 43, 39] is cluster 2 and [5, 9, 13] is cluster 3
    '''
    near_range, far_range, vfar_range = sorted((near_range, far_range, vfar_range))

    return near_range[1], far_range[1],vfar_range[1]

def compute_relative_dist_ranges(geoms):
    min_dist_list = []
    for g1 in geoms[:-1]:
        for g2 in geoms[1:]:
            min_dist_list.append(g1.distance(g2))

    x = clustering_distances(min_dist_list)
    near_dists = []
    far_dists = []
    vfar_dists = []

    for i in range(len(x)):
        if x[i] == 2:
            near_dists.append(min_dist_list[i])
        elif x[i] == 1:
            far_dists.append(min_dist_list[i])
        elif x[i] == 0:
            vfar_dists.append(min_dist_list[i])

    near_range = (min(near_dists), max(near_dists))
    far_range = (min(far_dists), max(far_dists))
    vfar_range = (min(vfar_dists), max(vfar_dists))

    ''' clusters are returned in arbitrary order so we have to sort them to 
        have each distance name refer to the correct  distance (i.e. [1,2,3] could be cluster 1
        while [31, 43, 39] is cluster 2 and [5, 9, 13] is cluster 3
    '''
    near_range, far_range, vfar_range = sorted((near_range, far_range, vfar_range))

    return near_range[1], vfar_range[0]


############################## RCC and 9-Intersections #######################################
'''
Taken from the de9im 0.1 package by Sean Gillies: http://bitbucket.org/sgillies/de9im/
'''

DIMS = {
    'F': frozenset('F'),
    'T': frozenset('012'),
    '*': frozenset('F012'),
    '0': frozenset('0'),
    '1': frozenset('1'),
    '2': frozenset('2'),
}


def pattern(pattern_string):
    return Pattern(pattern_string)


class Pattern(object):

    def __init__(self, pattern_string):
        self.pattern = tuple(pattern_string.upper())

    def __str__(self):
        return ''.join(self.pattern)

    def __repr__(self):
        return "DE-9IM pattern: '%s'" % str(self)

    def matches(self, matrix_string):
        matrix = tuple(matrix_string.upper())

        def one_match(p, m):
            return m in DIMS[p]

        return bool(
            reduce(lambda x, y: x * one_match(*y), zip(self.pattern, matrix), 1)
        )


class AntiPattern(object):

    def __init__(self, anti_pattern_string):
        self.anti_pattern = tuple(anti_pattern_string.upper())

    def __str__(self):
        return '!' + ''.join(self.anti_pattern)

    def __repr__(self):
        return "DE-9IM anti-pattern: '%s'" % str(self)

    def matches(self, matrix_string):
        matrix = tuple(matrix_string.upper())

        def one_match(p, m):
            return m in DIMS[p]

        return not (
            reduce(lambda x, y: x * one_match(*y),
                   zip(self.anti_pattern, matrix),
                   1)
        )


class NOrPattern(object):

    def __init__(self, pattern_strings):
        self.patterns = [tuple(s.upper()) for s in pattern_strings]

    def __str__(self):
        return '||'.join([''.join(list(s)) for s in self.patterns])

    def __repr__(self):
        return "DE-9IM or-pattern: '%s'" % str(self)

    def matches(self, matrix_string):
        matrix = tuple(matrix_string.upper())

        def one_match(p, m):
            return m in DIMS[p]

        for pattern in self.patterns:
            val = bool(
                reduce(lambda x, y: x * one_match(*y), zip(pattern, matrix), 1))
            if val is True:
                break
        return val
