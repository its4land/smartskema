
import itertools
import itertools
from math import copysign, sqrt

from shapely.geometry import LineString, Polygon,Point
from shapely.ops import linemerge, polygonize

#from its4land import *
#from tessellations import GTessellation, QTessellation
#from its4land.util.spatial import left_or_right
from method.spatial import left_or_right
from geometryVisualizer.tessellations import GTessellation, QTessellation
from method.spatial import *
import matcher.feature_filters as ff



class QRelDistTiles(QTessellation):
    def __init__(self,_tuple,qsd):
        super().__init__(self,_tuple,'rel_dist',qsd)
        self.intersectors = {}

        self.intersectors['near'] = ['near']
        self.intersectors['far'] = ['far']
        self.intersectors['vfar'] = ['vfar']

        self._inverse = {'near': 'vfar', 'vfar': 'near'}

    def compute_tiles(self):
        tiles = {}
        # {'tessellation':'name', 'tuple':(objID_1, ..., objID_k), 'tiles': {'ref_1':tile_1, ..., 'ref_k':tile_k}}
        tiles['near'] = 'near'
        tiles['far'] = 'far'
        tiles['vfar'] = 'vfar'

        return tiles

    def intersects(self, r, t):
        return r in self.intersectors[t]

    def inverse(self, r):
        return self._inverse[r]

class GRelDistTiles(GTessellation):
    def __init__(self, _tuple, map_data, type_list):
        super().__init__(_tuple, 'rel_dist', map_data)
        self.type_list = type_list


    def compute_tiles(self,d):
        tiles ={}
        relatum = d[0]['geometry']

        secondary_object_list=(ff.filter(self.data, type_list=self.type_list))

        near_end, far_end, vfar_end = compute_relative_dis_ranges_1_to_M(relatum, secondary_object_list)
        #print(near_end, far_end,vfar_end)

        base_bounds = relatum.bounds  # returns the tuple (minx, miny, maxx, maxy)
        diam = sqrt((base_bounds[2] - base_bounds[0]) ** 2 + (base_bounds[3] - base_bounds[1]) ** 2)

        relatum_nearEnd = relatum.buffer( near_end)
        relatum_farEnd = relatum.buffer(  far_end)
        relatum_vfarEnd = relatum.buffer( far_end)
        #print(relatum_nearEnd, relatum_farEnd,relatum_vfarEnd)


        tiles['near'] = relatum_nearEnd
        tiles['far'] = relatum_farEnd
        tiles['vfar'] = relatum_vfarEnd
        return tiles

    def intersects(self, t, d):
        return d.intersects(t)