# -*- coding: utf-8 -*-
"""
Created on Tue Jan 23 12:09:26 2018

@author: Malumbo
"""

import random as rnd

import numpy as np
from shapely.geometry import *

from method.spatial import *
import matcher.feature_filters as ff


def sector_range(sectors, num_sectors):
    min_sector = min(sectors)
    max_sector = min(sectors)

    sectors.remove(min_sector)

    while (min_sector - 1) in sectors:
        min_sector = (min_sector - 1) % num_sectors
        sectors.remove(min_sector)

    while (max_sector + 1) in sectors:
        max_sector = (max_sector + 1) % num_sectors
        sectors.remove(max_sector)

    return min_sector, max_sector


def qualify_relative_direction(data, **kwargs):
    relation_set = 'REGION_STAR_VARS'
    arity = 2
    # get random pair of polygons
    f_data = ff.filter(data, filter_geoms=ff.FILTER_POINTS_POLYGONS)

    or_obj1 = rnd.choice(f_data)
    or_obj2 = rnd.choice(f_data)

    while or_obj1 == or_obj2:
        or_obj2 = rnd.choice(f_data)

    reference_pair_groups = [(or_obj1, [(or_obj1, or_obj2)]), (or_obj2, [(or_obj2, or_obj1)])]

    num_sectors = kwargs.get('num_sectors', 4)
    reference_pair_groups = kwargs.get('reference_pair_groups', reference_pair_groups)

    modifiers = {
        'reference_pair_groups': [],
        'number_of_sectors': num_sectors
    }

    # f_data = ff.filter(data, filter_geoms=ff.FILTER_POINTS_POLYGONS)

    qcn = []
    for ref, reference_pairs in reference_pair_groups:
        reference_obj_1 = {
            'ssm_id': ref['attributes']['ssm_id'],
            'feat_type': ref['attributes']['feat_type'],
            'geometry': ref['geometry']
        }
        modifiers['reference_pair_groups'].append(reference_obj_1['ssm_id'])
        d_sectors_list = []
        # generate all orientations for ref
        for reference_pair in reference_pairs:
            # determine the centroids of their convex hulls
            reference_obj_2 = {
                'ssm_id': reference_pair[1]['attributes']['ssm_id'],
                'feat_type': reference_pair[1]['attributes']['feat_type'],
                'geometry': reference_pair[1]['geometry']
            }
            cntr1 = reference_obj_1['geometry'].convex_hull.centroid
            cntr2 = reference_obj_2['geometry'].convex_hull.centroid

            # determine the global orientation of the ray from centroid 1 to centroid 2
            v = np.array(cntr2.coords[:][0]) - np.array(cntr1.coords[:][0])
            # using degrees instead of radians
            dir_deg = np.rad2deg(vector_angle(v))
            d_sectors_list.append(calculate_sectors(dir_deg, 360.0, num_sectors))

        o1 = ref['attributes']['ssm_id']
        g1 = ref['geometry']
        for sec in f_data:
            o2 = sec['attributes']['ssm_id']
            g2 = sec['geometry']
            relation = []
            for d_sectors in d_sectors_list:
                relation.append([
                    sector_range(directional_relation(g1, g2, dir_deg, 360.0, d_sectors), num_sectors),
                    sector_range(directional_relation(g2, g1, dir_deg, 360.0, d_sectors), num_sectors)
                ])
            qcn.append({'obj_1': o1, 'obj_2': o2, 'relation': relation})

    return relation_set, arity, modifiers, qcn
