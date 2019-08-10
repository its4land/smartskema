# -*- coding: utf-8 -*-
"""
Created on Mon Mar 12 16:12:16 2018

@author: Malumbo
"""
import itertools
from math import copysign, sqrt

from shapely.geometry import LineString, Polygon,Point
from shapely.ops import linemerge, polygonize

#from its4land import *
#from tessellations import GTessellation, QTessellation
#from its4land.util.spatial import left_or_right
from method.spatial import left_or_right
from geometryVisualizer.tessellations import GTessellation, QTessellation

class QLeftRightTiles(QTessellation):
    
    def __init__(self, _tuple, qsd):
        super().__init__(self, _tuple, 'left_right', qsd)
            
        self.intersectors = {}
        
        self.intersectors['left'] = ['crosses','left']
        self.intersectors['right'] = ['crosses','right']
        
        self._inverse = {'left':'left_of','crosses':'crossed_by','right':'right_of'}
        

    def compute_tiles(self):
        tiles = {}
        # {'tessellation':'name', 'tuple':(objID_1, ..., objID_k), 'tiles': {'ref_1':tile_1, ..., 'ref_k':tile_k}}
        tiles['left'] = 'left'
        tiles['right'] = 'right'
               
        return tiles


    def intersects(self,r,t):
        return r in self.intersectors[t]
    
	
    def inverse(self,r):
        return self._inverse[r]


class GLeftRightTiles(GTessellation):
        
    def __init__(self, _tuple,  map_data):
        super().__init__(_tuple, 'left_right', map_data)

    def bounding_box_intercepts(self, s, e):
        
        x0, y0, x1, y1 = self.bounding_box.bounds


        m = (e[1] - s[1])/(e[0] - s[0])

        print("m",m)

        xt = s[0] + (y0 - s[1])/m
        xb = s[0] + (y1 - s[1])/m
        yl = s[1] + (x0 - s[0]) * m
        yr = s[1] + (x1 - s[0]) * m
        
        sign = lambda x: copysign(1, x)
        
        intercept = None

        # find the intercept in the direction of the line        
        if x0 < xt < x1 and sign(s[0]-e[0]) == sign(s[0] - xt):
            intercept = (xt, y0)
        if x0 < xb < x1 and sign(s[0]-e[0]) == sign(s[0] - xb):
            intercept = (xb, y1)
        if y0 < yl < y1 and sign(s[1]-e[1]) == sign(s[1] - yl):
            intercept = (x0, yl)
        if y0 < yr < y1 and sign(s[1]-e[1]) == sign(s[1] - yr):
            intercept = (x1, yr)
        
        # we have the intercepts now check which way the line is going
        return intercept

        
    def compute_tiles(self, d):
        tiles = {}
        # {'tessellation':'name', 'tuple':(objID_1, ..., objID_k), 'tiles': {'ref_1':tile_1, ..., 'ref_k':tile_k}}
        # first compute the line extension to the bounding box
        relatum = d[0]['geometry']
        #print("relatum:",relatum)
        s_coords = relatum.coords[1::-1]
        e_coords = relatum.coords[-2:]

        s_ext_coords = self.bounding_box_intercepts(*s_coords)
        e_ext_coords = self.bounding_box_intercepts(*e_coords)

        s_coords = s_coords[1:]
        e_coords = e_coords[1:]

        s_coords.append(s_ext_coords)
        e_coords.append(e_ext_coords)

        s_ext = LineString(s_coords)
        e_ext = LineString(e_coords)
        
        relatum = linemerge((s_ext, relatum, e_ext))
        
        # get the left and right points of the bounding box
        left_coords = []
        right_coords = []
        
        bound_pts = itertools.product(self.bounding_box.bounds[::2],self.bounding_box.bounds[1::2])

        #print("bound_pts",[pt for pt in bound_pts])
        for pt in bound_pts:
            if left_or_right(relatum, Point(pt)) == 'left':
                left_coords.append(pt)
            elif left_or_right(relatum, Point(pt)) == 'right':
                right_coords.append(pt)
            else:
                left_coords.append(pt)
                right_coords.append(pt)            
        
        left_poly_coords = relatum.coords[:]
        right_poly_coords = relatum.coords[:]
        
        p_dat = [(left_coords, left_poly_coords), (right_coords ,right_poly_coords)]
        
        for c_pair in p_dat:
            c = -1
            while len(left_coords) > 0:
                c += 1
                if c_pair[0][c][0] == c_pair[1][0][0] or c_pair[0][c][1] == c_pair[1][0][1]:
                    # collinear with lhs intercept
                    c_pair[1].insert(0,c_pair[0].pop(c))
                    c -= 1
                elif c_pair[0][c][0] == c_pair[1][-1][0] or c_pair[0][c][1] == c_pair[1][-1][1]:
                    # collinear with rhs intercept
                    c_pair[1].insert(len(c_pair[1]),c_pair[0].pop(c))
                    c -= 1
            
        left_polygon = Polygon(left_poly_coords)
        right_polygon = Polygon(right_poly_coords)
        
        tiles['left'] = left_polygon
        tiles['right'] = right_polygon
        
        return tiles


    def intersects(self,t,d):
        return d.intersects(t)
