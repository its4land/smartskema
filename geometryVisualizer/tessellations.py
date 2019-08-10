# -*- coding: utf-8 -*-
"""
Created on Fri Mar  9 09:02:16 2018

@author: Malumbo
"""
import itertools
from geometryVisualizer.config import *

#from its4land import *


class Tessellations(object):    
    # Every class extending tessellation must specify a name and must initialize is self.qualitative
    # and self.geometric to true depending on whether the tessellation is based on a purely qualitative representation,
    # a purely geometric one, or geometric representation induced by qualitative constraints.
    #
    # All instances that want specify filter criteria must initialise this list to the desired filter parameters in order since
    # we can't later refer to them by name. Code accessing the API can then call filter() on the object passing the filtering parameters
    # as follows:
    #
    # tes = custom_tessellation(filter_geoms_option, list_of_types_to_filter, list_of_IDs_to_filter, list_of_names_to_filter)
    # tes_data = tes.filter(map_data,*tes.filter_params)
    # 
    # **kwargs={filter_geoms = FILTER_ALL, filter_types = False, type_list = [],
    # filter_ids = False, id_list =[], filter_names = False, name_list =[]}
    def __init__(self, name, impl, arity, data, is_qualitative, *args , base_tessellation=None, matches=None, **kwargs):
        
        self.name = name
        self.impl = impl
        self.arity = arity
        self.data = data
        self.is_qualitative = is_qualitative
        self.args = args
        self.filter_params = kwargs
        self.bounding_box = None
        
        # initialise data objects
        self.Tessellations = {}
        self.features = None

        if not is_qualitative:
            self.features = [d['attributes'] for d in self.data]
            # remove bounding box
            self.bounding_box = [
                f for f in self.features if f['ssm_id'].lower() == 'boundingbox'.lower()][0]
            self.features.remove(self.bounding_box)
        else:
            self.features = data['features']
         
        # filter 
        self.features = [f['ssm_id'] for f in self.filter(self.features, **kwargs)]
        #print("features after filter...:",self.features)
        # if we have a metches list and a base_tessellation then order the tuples 
        # in this tessellation according to the base_tessellation
        if base_tessellation is not None and matches is not None:
            # determine arity from base_tessellation and return properly ordered tuples of objects of length arity
            self.arity = base_tessellation.arity
            self.tuples = []
            for t in base_tessellation.tuples:
                self.tuples.append(tuple((matches[t_i] for t_i in t)))
        else:
            # return tuples of objects of length arity
            if self.arity == 0 or self.arity > len(self.features):
                self.arity = len(self.features)
                
            # make tuples - assuming all data are of the type here or that the order doesn't matter
            self.tuples = list(itertools.combinations(self.features, self.arity))
         
        # make the tessellations
        # COMMENTED FOR TESTING PURPOSES
        for t in self.tuples:
            self.Tessellations[t] = self.impl(t, self.data, *self.args)
            self.Tessellations[t].tessellate()
        # REMOVE WITH UNCOMMENT OF ABOVE
#        t = tuples[0]
#        self.tessellations[t] = self.impl(t, self.data, *self.args)
#        self.tessellations[t].tessellate()


    def filter(self, data, filter_geoms = FILTER_ALL, filter_types = False, type_list = [], filter_ids = False, id_list =[], filter_names = False, name_list =[]):
        # first extract the useful data - name, geometry_type, feature_type
        f_data = data 
        
        # start with the attribute filter and then the names filter
        if filter_types:            
            if len(type_list) == 0:
                raise Exception('No types given but filter_type is set to True. Set filter_type to false if you do not want to filter by type')
            else:
                #print("f_data",f_data)
                f_data = [d for d in f_data if d['feat_type'] in type_list]
                #print("f_data", f_data)
        if filter_ids:
            if len(id_list) == 0:
                raise Exception('No ids given but filter_ids is set to True. Set filter_ids to false if you do not want to filter by IDs')
            else:
                f_data = [d for d in f_data if d['ssm_id'] in id_list]

        if filter_names:
            if len(name_list) == 0:
                raise Exception('No names given but filter_names is set to True. Set filter_names to false if you do not want to filter by names')
            else:
                f_data = [d for d in f_data if d['name'] in name_list]
            
        geom_type_list = []
        if filter_geoms == FILTER_POINTS:
            geom_type_list.append('Point')
        
        elif filter_geoms == FILTER_LINESTRINGS:
            geom_type_list.append('LineString')
        
        elif filter_geoms == FILTER_POLYGONS:
            geom_type_list.append('Polygon')
        
        elif filter_geoms == FILTER_POINTS_LINESTRINGS:
            geom_type_list.append('Point')
            geom_type_list.append('LineString')
        
        elif filter_geoms == FILTER_POINTS_POLYGONS:
            geom_type_list.append('Point')
            geom_type_list.append('Polygon')

        elif filter_geoms == FILTER_LINESTRINGS_POLYGONS:
            geom_type_list.append('LineString')
            geom_type_list.append('Polygon')
        
        elif filter_geoms == FILTER_ALL:
            geom_type_list.append('Point')
            geom_type_list.append('LineString')
            geom_type_list.append('Polygon')
            
        f_data = [d for d in f_data if d['geometry_type'] in geom_type_list] 
            
        return f_data
    
    
    def get_tessellations(self):
        return self.Tessellations
    
    def get_tuples(self):
        return self.tuples


class QTessellation(object):    
    
    def __init__(self, _tuple, name, qsd): 
        
        self.name = name
        # initialise data objects
        self.qsd = qsd
        self.tuple = _tuple
        self.tiles = {}


    def get_tile(tile_ref):
        return self.tiles[tile_ref]


    def tessellate(self):
        # Call the local tessellations.
        self.tiles = self.compute_tiles(self.qsd)
        
        return {'tessellation':self.name, 'tuple':self.tuple, 'tiles': self.tiles}


    def get_overlaping_tiles(self, d):
        # go through each tile and check if it overlaps d
        # whether the tiles are concretely implemented or not
        r = None
        try:
            r = self.qsd['constraints'][(*self.tuple, d['attributes']['ssm_id'])]
        except KeyError:
            r = self.inverse(self.qsd['constraints'][(d['attributes']['ssm_id'], *self.tuple)])

        overlaping_tiles = {'tessellation':(self.name, self.tuple), 'tiles': []}

        for t in self.tiles.items():
            if self.intersects(t[0],r):
                overlaping_tiles['tiles'].append(t[0])
                   
        return overlaping_tiles
    
    

class GTessellation(object):    
   
    def __init__(self, _tuple, name, map_data): 
        
        self.name = name
        # initialise data objects
        self.data = map_data[:]
        self.tuple = _tuple
        self.tiles = {}
        # get the bounding_box explicitly
        self.bounding_box = [d for d in map_data if d['attributes']['ssm_id'].lower() == 'boundingbox'.lower()][0]
        self.data.remove(self.bounding_box)
        self.bounding_box = self.bounding_box['geometry']
    
	
    def get_tile(self, tile_ref):
        return self.tiles[tile_ref]
	
	
    def tessellate(self):
        # Call the local tessellation function with this tessellation's tuple
        tuple_data = tuple((d for d in self.data if d['attributes']['ssm_id'] in self.tuple))

        self.tiles = self.compute_tiles(tuple_data)
        
        return {'tessellation':self.name, 'tuple':self.tuple, 'tiles': self.tiles}

    
    def get_overlaping_tiles(self, d):
        # go through each tile and check if it overlaps d
        # whether the tiles are concretely implemented or not
        overlaping_tiles = {'tessellation':(self.name,self.tuple), 'tiles': []}
        
        for t in self.tiles.items():
            if self.intersects(t[1],d['geometry']):
                overlaping_tiles['tiles'].append(t[0])
                   
        return overlaping_tiles
    
    


class QGTessellation(object):    

    def __init__(self, _tuple, name, map_data, qsd): 
        
        self.name = name
        # initialise data objects
        self.data = map_data[:]
        self.qsd = qsd
        self.tuple = _tuple
        self.tiles = {}
    
    def tessellate(self):
        # Call the local tessellations. Tessellation data to be passed
        # depends on whether the input is purely geometric  or not
        tuple_data = tuple((d for d in self.data if d['attributes']['ssm_id'] in self.tuple))
        self.tiles = self.compute_tiles(*tuple_data, self.qsd)
        
        return {'tessellation':self.name, 'tuple':self.tuple, 'tiles': self.tiles}
    
    def get_overlaping_tiles(self, d):
        # go through each tile and check it overlaps
        # whether the tiles are concretely implemented or not
        overlaping_tiles = {'tessellation':self.name, 'tiles': []}
        
        for t in self.tiles.items():
            if self.intersects(d,t):
                overlaping_tiles['tiles'].append(t[0])
                   
        return overlaping_tiles
