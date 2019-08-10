# -*- coding: utf-8 -*-
"""
Created on Mon Mar 12 16:12:16 2018

@author: Malumbo
"""
from math import sqrt

#from its4land import *
from geometryVisualizer.tessellations import GTessellation, QTessellation


class QRccTiles(QTessellation):
    
    def __init__(self, _tuple, qsd):
        super().__init__(self, _tuple, 'rcc', qsd)
            
        self.intersectors = {}
        
        self.intersectors['interior'] = ['PO','EQ','TPP','TPPI','NTPP','NTPPI']
        self.intersectors['boundary'] = ['EC','PO','EQ','TPP','TPPI','NTPPI']
        self.intersectors['exterior'] = ['DC','EC','PO','TPPI','NTPPI']
        
        self._inverse = {'DC':'DC','EC':'EC','PO':'PO','EQ':'EQ','TPP':'TPPI','TPPI':'TPP','NTPP':'NTPPI','NTPPI':'NTPP'}
        

    def compute_tiles(self):
        tiles = {}
        # {'tessellation':'name', 'tuple':(objID_1, ..., objID_k), 'tiles': {'ref_1':tile_1, ..., 'ref_k':tile_k}}
        tiles['interior'] = 'interior'
        tiles['boundary'] = 'boundary'
        tiles['exterior'] = 'exterior'
               
        return tiles


    def intersects(self,r,t):
        return r in self.intersectors[t]
    
	
    def inverse(self,r):
        return self._inverse[r]


class GRccTiles(GTessellation):
        
    def __init__(self, _tuple, map_data):
        super().__init__(_tuple, 'rcc', map_data)

        #self.buffer_thickness = buffer_thickness

    def compute_tiles(self, d):
        buffer_thickness= 0
        tiles = {}
        #print("d...",d)
        # {'tessellation':'name', 'tuple':(objID_1, ..., objID_k), 'tiles': {'ref_1':tile_1, ..., 'ref_k':tile_k}}
        relatum = d[0]['geometry']

        base_bounds = relatum.bounds # returns the tuple (minx, miny, maxx, maxy)
        diam = sqrt((base_bounds[2] - base_bounds[0])**2 + (base_bounds[3] - base_bounds[1])**2)
        relatum_exterior = self.bounding_box

        buffer = relatum.buffer(diam * buffer_thickness)
        relatum_int = relatum.buffer(-0.1 * diam * buffer_thickness)
        relatum_bnd = buffer.difference(relatum_int)
        relatum_exterior = relatum_exterior.difference(buffer)
            
        tiles['interior'] = relatum_int
        tiles['boundary'] = relatum_bnd
        tiles['exterior'] = relatum_exterior
        #print(tiles)
        return tiles


    def intersects(self,t,d):
        return d.intersects(t)
