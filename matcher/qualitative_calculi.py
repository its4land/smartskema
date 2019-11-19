import logging
import numpy as np
from itertools import product as prod  # , groupby as grp


class Calculus(object):

    def distance(self, relation_1, relation_2):
        return self.distances[self.relations[relation_1]][self.relations[relation_2]]

    def inverse(self, relation):
        return self.inverses[self.relations[relation]]


class RCC8(Calculus):

    def __init__(self):
        self.name = 'RCC8'
        self.eq = 'eq'
        self.relations = {'dc': 0, 'ec': 1, 'po': 2, 'eq': 3, 'tpp': 4, 'ntpp': 5, 'tppi': 6, 'ntppi': 7}
        self.inverses = ['dc', 'ec', 'po', 'eq', 'tppi', 'ntppi', 'tpp', 'ntpp']
        self.distances = [
            [0, 0.25, 0.5, 0.875, 0.875, 1., 0.875, 1],
            [0.25, 0, 0.25, 0.625, 0.625, 0.75, 0.625, 0.75],
            [0.5, 0.25, 0, 0.375, 0.375, 0.5, 0.375, 0.5],
            [0.875, 0.625, 0.375, 0, 0.4175, 0.375, 0.4175, 0.375],
            [0.875, 0.625, 0.375, 0.4175, 0, 0.375, 0.5, 0.625],
            [1, 0.75, 0.5, 0.375, 0.375, 0., 0.625, 0.625],
            [0.875, 0.625, 0.375, 0.4175, 0.5, 0.625, 0, 0.375],
            [1, 0.75, 0.5, 0.375, 0.625, 0.625, 0.375, 0]
        ]


class RCC11(Calculus):

    def __init__(self):
        self.name = 'RCC11'
        self.eq = 'eq'
        self.relations = {'dc': 0, 'ecp': 1, 'ecl': 2, 'po': 3, 'eq': 4,
                          'tppp': 5, 'tppl': 6, 'ntpp': 7, 'tpppi': 8,
                          'tppli': 9, 'ntppi': 10}
        self.inverses = ['dc', 'ecp', 'ecl', 'po', 'eq', 'tpppi',
                         'tppli', 'ntppi', 'tppp', 'tppl', 'ntpp']
        self.distances = [
            [0, 0.375, 0.375, 0.5, 0.9175, 0.9175, 0.9175, 0.9175, 0.75, 1, 1],
            [0.375, 0, 0.4175, 0.375, 0.6675, 0.6675, 0.6675, 0.6675, 0.5, 0.75, 0.75],
            [0.375, 0.4175, 0, 0.375, 0.6675, 0.6675, 0.6675, 0.6675, 0.5, 0.75, 0.75],
            [0.5, 0.375, 0.375, 0, 0.4175, 0.4175, 0.4175, 0.4175, 0.45, 0.5, 0.5],
            [0.9175, 0.6675, 0.6675, 0.4175, 0, 0.4175, 0.5, 0.5, 0.4175, 0.5, 0.6675],
            [0.9175, 0.6675, 0.6675, 0.4175, 0.4175, 0, 0.5, 0.5, 0.375, 0.5, 0.6675],
            [0.9175, 0.6675, 0.6675, 0.4175, 0.5, 0.5, 0, 0.4175, 0.4175, 0.6675, 0.5],
            [0.9175, 0.6675, 0.6675, 0.4175, 0.5, 0.5, 0.4175, 0, 0.4175, 0.6675, 0.5],
            [0.75, 0.5, 0.5, 0.45, 0.4175, 0.4175, 0.4175, 0.4175, 0, 0.4175, 0.4175],
            [1, 0.75, 0.75, 0.5, 0.5, 0.5, 0.6675, 0.6675, 0.4175, 0, 0.9],
            [1, 0.75, 0.75, 0.5, 0.6675, 0.6675, 0.5, 0.5, 0.4175, 0.9, 0]
        ]


class LeftRight(Calculus):

    def __init__(self):
        self.name = 'LEFT_RIGHT'
        self.eq = 'eq'
        self.relations = {'crosses': 0, 'left': 1, 'right': 2, 'eq': 3}
        self.inverses = ['crosses', 'left', 'right', 'eq']
        self.distances = [[0, 0.75, 0.75, 0.75],
                          [0.75, 0, 1, 0.75],
                          [0.75, 1, 0, 0.75],
                          [0.75, 0.75, 0.75, 0]]


class Adjacency(Calculus):

    def __init__(self):
        self.name = 'ADJACENCY'
        self.eq = 'eq'
        self.relations = {'eq': 0, 'adjacent': 1, 'non_adjacent': 2}
        self.inverses = ['eq', 'adjacent', 'non_adjacent']
        self.distances = [[0, 0.5, 1],
                          [0.5, 0, 0.5],
                          [1, 0.5, 0]]


class RelativeDistance(Calculus):

    def __init__(self):
        self.name = 'REL_DIST'
        self.eq = 'same'
        self.relations = {'same': 0, 'near': 1, 'far': 2, 'vfar': 3}
        self.inverses = ['same', 'near', 'far', 'vfar']
        self.distances = [[0, 0.33, 0.67, 1],
                          [0.33, 0, 0.33, 0.67],
                          [0.67, 0.33, 0, 0.33],
                          [1, 0.67, 0.33, 0]]


class RegionStarVars(Calculus):

    def __init__(self, num_sectors=4):
        self.name = 'REGION_STAR_VARS'
        self.num_sectors = num_sectors
        self.eq = [(0, num_sectors), (0, num_sectors)]

    def distance(self, relation_1, relation_2):
        normalized_distance = self.d_taxicab_sectors(relation_1, relation_2) / self.num_sectors
        return normalized_distance

    def inverse(self, relation):
        return relation[::-1]

    def d_taxicab_sectors(self, relation_1, relation_2):
        if len(np.shape(relation_1)) == 2:
            taxicab_distance = self.d_hausdorff(relation_1[0], relation_2[0]) \
                               + self.d_hausdorff(relation_1[1], relation_2[1])
        elif len(np.shape(relation_1)) == 3:
            taxicab_distance = self.min_distances(np.array(relation_1)[:, 0], np.array(relation_2)[:, 0]) \
                               + self.min_distances(np.array(relation_1)[:, 1], np.array(relation_2)[:, 1])

        return taxicab_distance

    def min_distances(self, r_1_components, r_2_components):

        min_separation_distances = []

        for relation_1, relation_2 in prod(r_1_components, r_2_components):
            min_separation_distance = self.d_min_separation(relation_1, relation_2)
            min_separation_distances.append(min_separation_distance)

        dim_1 = min(len(r_1_components), len(r_2_components))
        dim_2 = max(len(r_1_components), len(r_2_components))

        min_separation_distances = np.array(min_separation_distances, dtype=np.float32).reshape(
            (dim_1, dim_2)
        )

        min_dists_per_row = np.argmin(min_separation_distances, axis=1)
        n = 0
        min_dist_sum = 0
        while n < dim_1:
            min_dist_sum = min_dist_sum + min_separation_distances[n, min_dists_per_row[n]]
            min_separation_distances[:, min_dists_per_row[n]] = np.inf
            min_dists_per_row = np.argmin(min_separation_distances, axis=1)
            n = n + 1

        return min_dist_sum / n

    def d_min_separation(self, relation_1_x, relation_2_x):
        if self.point_in_interval(relation_1_x[0], relation_1_x[1], relation_2_x[0]) \
                and self.point_in_interval(relation_2_x[0], relation_2_x[1], relation_1_x[0]):
            min_separation_distance = 0
        else:
            separation_distance_1 = (relation_1_x[0] - relation_2_x[1]) % self.num_sectors
            separation_distance_2 = (relation_2_x[0] - relation_1_x[1]) % self.num_sectors
            min_separation_distance = min(separation_distance_1, separation_distance_2)

        return min_separation_distance

    def d_hausdorff(self, relation_1_x, relation_2_x):
        hausdorff_distance = max(
            self.d_cyclic(relation_1_x[0], relation_2_x[0]),
            self.d_cyclic(relation_1_x[0], relation_2_x[1]),
            self.d_cyclic(relation_1_x[1], relation_2_x[0]),
            self.d_cyclic(relation_1_x[1], relation_2_x[1])
        )
        return hausdorff_distance

    def point_in_interval(self, s, e, p):
        return (p - s) % self.num_sectors <= (e - s) % self.num_sectors

    def d_cyclic(self, x, y):
        positive_dir_distance = (x - y) % self.num_sectors
        negative_dir_distance = (y - x) % self.num_sectors
        return min(positive_dir_distance, negative_dir_distance)


std_calculi = {
    'RCC8': RCC8(),
    'RCC11': RCC11(),
    'LEFT_RIGHT': LeftRight(),
    'ADJACENCY': Adjacency(),
    'REL_DIST': RelativeDistance(),
    'REGION_STAR_VARS': RegionStarVars(),
    'None': None
}

weights = {
    'RCC8': 1,
    'RCC11': 0.8,
    'LEFT_RIGHT': 1,
    'ADJACENCY': 0.8,
    'REL_DIST': 0.7,
    'REGION_STAR_VARS': 0.001
}


def get_calculus(calculus_name):
    try:
        return std_calculi[calculus_name]
    except KeyError:
        logging.error(f"No such calculus activated. Only active calculi can be used", exc_info=True, stack_info=True)


def weight(calculus):
    return weights[calculus.name]


def weight_by_name(calculus_name):
    return weights[calculus_name]
