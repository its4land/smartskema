# -*- coding: utf-8 -*-
"""
Created on Mon Mar 12 16:12:16 2018

@author: Malumbo
"""
from geomtess.voronoi import VoronoiTiles as vt
from tessellations import GTessellation


class voronoi_tiles(GTessellation):

    def __init__(self, _tuple, map_data, map_type):
        super().__init__(_tuple, 'voronoi', map_data)  
        self.map_type = map_type

    def compute_tiles(self, d):
        
        tiles = vt.getTiles(d, self.bounding_box, self.map_type)

        return tiles


    def intersects(self,t,d):
        return d.intersects(t)
