# -*- coding: utf-8 -*-
"""
Created on Thu Mar  8 10:27:05 2018

@author: Malumbo
"""
import itertools

from its4land.io import geojson
import shapely
#from igraph import Graph
from shapely.geometry import LineString, MultiPolygon, Point, Polygon
from shapely.geos import TopologicalError

# from demos.geomvis.generalalgo.geomtess.map_plotter import plotGPD, addToPlot
# from demos.geomvis.generalalgo.geomtess.tangents_tiles import tangents_tiles
# from demos.geomvis.generalalgo.geomtess.voronoi_tiles import voronoi_tiles
# from its4land.qualify.method.leftright import qualify_leftright
# from its4land.qualify.method.rcc8 import qualify_rcc8, polygonal_topology
# from its4land.qualify.method.regionstarvars import qualify_relative_direction
# from its4land.qualify.method.relativedist import qualify_relativedist
# from its4land.qualify.qualifier import QualifierInterface, get_qualifier_functions
# from demos.geomvis.generalalgo.left_right_tiles import GLeftRightTiles, QLeftRightTiles
# from demos.geomvis.generalalgo.rcc_tiles import GRccTiles, QRccTiles
# from demos.geomvis.generalalgo.region_star_vars_tiles import GRegionStarVarsTiles, QRegionStarVarsTiles
# from demos.geomvis.generalalgo.relative_distance_tiles import (GRelativeDistanceTiles,
#                                      QRelativeDistanceTiles)
#from its4land import *
from geometryVisualizer.config import *
from geometryVisualizer.tessellations import Tessellations
from geometryVisualizer.geomtess import voronoi_tiles,tangents_tiles


# ouput is a list of items of the form {'tessellation':'name', 'tuple':(objID_1, ..., objID_k), 'tiles': {'ref_1':tile_1, ..., 'ref_k':tile_k}}
def compute_tessellations(map_type, map_data, map_qsd, matches, base_tessellations=None):
    # first filter for matched objects only
    data_geom = []
    data_qual = {}
    
    if map_type == SKETCH_MAP:
        items = set(itertools.chain(matches.keys()))
        
    if map_type == METRIC_MAP:
        items = set(itertools.chain(matches.values()))
        if base_tessellations is None:
            raise ValueError('the base tessellation cannot be None for map type metric_map')
        
    data_geom = [d for d in map_data if d['attributes']['ssm_id'] in items]
    data_geom.append([f for f in map_data if f['attributes']['ssm_id'].lower() == 'bounding_box'.lower()][0])
    data_qual['features'] = [d for d in map_qsd['features'] if d['ssm_id'] in items]
    data_qual['constraint_collection'] = map_qsd['constraint_collection']
    
    # set up filter parameters
    filter_params = {'filter_geoms':FILTER_ALL,'filter_types':False,'type_list':[],'filter_ids':False,'id_list':[],'filter_names':False,'name_list':[]}
    
    tessellation_sets = {}
    
    # voronoi
    # set required filters and undo them after the call
    filter_params['filter_geoms'] = FILTER_ALL
    filter_params['filter_types'] = True
    filter_params['type_list'] = ['mountain','marsh'] #,'borehole', 'river', 'road', 'path'
    if map_type == SKETCH_MAP:
       tessellation_sets['voronoi'] = Tessellations('voronoi', voronoi_tiles, 0, data_geom, False, 'sketch_map', **filter_params)
    if map_type == METRIC_MAP: 
        base_tessellation = base_tessellations['voronoi']
        tessellation_sets['voronoi'] = Tessellations('voronoi', voronoi_tiles, 0, data_geom, False, 'metric_map', 
								       base_tessellation = base_tessellation, matches = matches, **filter_params)
    filter_params['filter_geoms'] = FILTER_ALL
    filter_params['filter_types'] = False
    filter_params['type_list'] = []
    
    # tangents
    # set required filters and undo them after the call
    filter_params['filter_geoms'] = FILTER_POLYGONS
    filter_params['filter_types'] = True
    filter_params['type_list'] = ['mountain','marsh']
    if map_type == SKETCH_MAP:
        tessellation_sets['tangents'] = Tessellations('tangents', tangents_tiles, 2, data_geom, False, 'sketch_map', **filter_params)
    if map_type == METRIC_MAP:
        base_tessellation = base_tessellations['tangents']
        tessellation_sets['tangents'] = Tessellations('tangents', tangents_tiles, 2, data_geom, False, 'metric_map', base_tessellation = base_tessellation, matches = matches, **filter_params)
    filter_params['filter_geoms'] = FILTER_ALL
    filter_params['filter_types'] = False
    filter_params['type_list'] = []
    
    # rcc8
    # set required filters and undo them after the call
#    filter_params['filter_geoms'] = FILTER_POLYGONS
#    if map_type == SKETCH_MAP:
#       tessellation_sets['RCC8'] = tessellations('RCC8', q_rcc_tiles, 1, data_qual, True, **filter_params).get_tessellations()
#    if map_type == METRIC_MAP:
#       tessellation_sets['RCC8'] = tessellations('RCC8', g_rcc_tiles, 1, data_geom, False, 0.05, **filter_params).get_tessellations()
#    filter_params['filter_geoms'] = FILTER_ALL
    
#    # left_right
#    # set required filters and undo them after the call
#    filter_params['filter_geoms'] = FILTER_LINESTRINGS
#    if map_type == SKETCH_MAP:
#       tessellation_sets['left_right'] = tessellations('left_right', q_left_right_tiles, 1, data_qual, True, **filter_params).get_tessellations()
#    if map_type == METRIC_MAP:
#       tessellation_sets['left_right'] = tessellations('left_right', g_left_right_tiles, 1, data_geom, False, **filter_params).get_tessellations()
#    filter_params['filter_geoms'] = FILTER_ALL
    
    """    
        # region_star_vars
        # set required filters and undo them after the call
        filter_params['filter_geoms'] = FILTER_POINTS_POLYGONS
        filter_params['filter_types'] = True
        filter_params['type_list'] = ['mountain','marsh','boma']
        if map_type == SKETCH_MAP:
           tessellation_sets['region_star_vars'] = tessellations('region_star_vars', q_region_star_vars_tiles, 1, data_qual, True, 8, **filter_params)
        if map_type == METRIC_MAP:
           tessellation_sets['region_star_vars'] = tessellations('region_star_vars', g_region_star_vars_tiles, 1, data_geom, False, 8, **filter_params)
        filter_params['filter_geoms'] = FILTER_ALL
        filter_params['filter_types'] = False
        filter_params['type_list'] = [] 
        
        # relative distance
        # set required filters and undo them after the call
        filter_params['filter_geoms'] = FILTER_POLYGONS
        filter_params['filter_types'] = True
        filter_params['type_list'] = ['mountain','marsh','boma','olopololi']
        if map_type == SKETCH_MAP:
           tessellation_sets['relative_distance'] = tessellations('relative_distance', q_relative_distance_tiles, 1, data_qual, True, **filter_params)
        if map_type == METRIC_MAP:
           tessellation_sets['relative_distance'] = tessellations('relative_distance', g_relative_distance_tiles, 1, data_geom, False, **filter_params)
        filter_params['filter_geoms'] = FILTER_ALL
        filter_params['filter_types'] = False
        filter_params['type_list'] = []
    """        
    return tessellation_sets

# For each unmatched object compute the tiles of each tessellation that they overlap.
# Expect a list of the following form:
#    overlapping_tiles = [ 
#       { object_id:[ {'tessellation':name_of_tessellation, 'tiles': [tile_1, ..., :tile_k]}, ... ] }, 
#       { ... },
#       ...
#   ]

def get_candidate_locations(tes_pairs, metric_map_objects, mo, umo_map_objects, qsm):
    
    # first find the overlaping tiles
    
    # total_votes is a dict of the final votes for each tile for from each object after each step of the algorithm
    # total_votes = {obj_id: {}}
    total_votes = {}
    total_tiles = {}
    max_vote_cnts = {}
    ballots = {}
    ballot_tiles = {}
    umo_geoms = {}
    
    additional_vote_g = lambda pg, t: 1.0 if pg.intersects(t) else 0.0
    
    # debug counter to check number of intersection errors we get 
    errn = 0
    objn = 0
    
    for obj in umo_map_objects:
        objn += 1
        obj_id = obj['attributes']['ssm_id']
        umo_geoms[obj_id] = obj['geometry']
        tile_votes = []
        votes = {}
        max_vote_cnts[obj_id] = 0.0
        for tes_name, _tessellations in tes_pairs.items():
            for _tuple, s_tessellation in _tessellations[0].items():
                # get corresponding metric map tessellation
                try:
                    m_tessellation = _tessellations[1][dereference(_tuple, mo)]
                except KeyError:
                    print ('bad tuple')
                    raise KeyError(str(_tuple) + ' : ' + str(dereference(_tuple, mo)))
                # get overlaping tiles from sketch map tessellation
                ov_tiles = s_tessellation.get_overlaping_tiles(obj)
                # vote for metric map tiles and save the votes
                for tile in ov_tiles['tiles']:
                    m_tile = tile
                    
                    if tile in mo.keys():
                        m_tile = dereference((tile,), mo)[0]
                        
                    tile_votes.append((*ov_tiles['tessellation'], m_tile, m_tessellation.get_tile(m_tile)))
        
        # now we can find the regions of interest by overlaying all polygons on which we have voted
        # and count the number of original tiles that each intersection is contained in.
        refined_tiles = {} # the tiles after each subsequent overlay - initialised to the first tile for which we have a vote
#        votes[ghash(Polygon())] = 0 # initialize the vote set for refined tiles
#        tv_num = 0
        for tv_name, tv_tup, tv_id, tv in tile_votes: # get each tile for which we have a vote in turn
            refined_tile_votes = {}
#            tv_num += 1
#            print(tv_num)
            ####################### TRY NEW APPROACH #########################
#            refined_tiles[ghash(tv)] = tv # problematic put tv in the refined tiles set
            rings = [LineString(tv.exterior.coords)]
            rings.extend([LineString(ir) for ir in tv.interiors])
            rings.extend([LineString(rt.exterior.coords) for (rth, rt) in refined_tiles.items()])
            rings.extend([LineString(ir.coords) for (rth, rt) in refined_tiles.items() for ir in rt.interiors])

            #rings.append(tv.exterior.coords)
            from shapely.ops import unary_union, polygonize
            from shapely.prepared import prep
            ptv = prep(tv)
            
            union = unary_union(rings)
            result = [(geom, prep(geom)) for geom in polygonize(union) if geom.area > 0]
#            no_delta_result = [geom for (geom, pgeom) in result if not ptv.intersects(geom)]
#            delta_result = [(geom, pgeom) for (geom, pgeom) in result if ptv.intersects(geom)]
            
            
#            refined_tile_votes = {ghash(g): 1 for g in result} # remove with uncomment below - just for speed testing
#            refined_tile_votes = {ghash(g): 1 if pg.intersects(tv) else 0 for (g,pg) in result} # replaced by lambda additional_votes_g
#################### UNCOMMENT FROM HERE ############################################ 
            for (g, pg) in result:
                icnt = 0
                existing_votes_g = 0.0
                max_overlap_g = 0.0
                for (rth, rt) in [(rth, rt) for (rth, rt) in refined_tiles.items() if pg.intersects(rt)]:
                    area = g.intersection(rt).area
                    if area > max_overlap_g:
                        max_overlap_g = area
                        existing_votes_g = votes[rth]
                        icnt += 1
                    
                refined_tile_votes[ghash(g)] = additional_vote_g(pg,tv) + existing_votes_g
                if max_vote_cnts[obj_id] < refined_tile_votes[ghash(g)]:
                    max_vote_cnts[obj_id] = refined_tile_votes[ghash(g)]
#################### UNCOMMENT TO HERE ############################################                
#                if icnt > 1:
#                    print('tile', ghash(g),'intersects', icnt,'> 1 input tiles')   
##                    toPlot = [rti for (rthi, rti) in refined_tiles.items() if g.intersection(rti).area > 0]
#                    print([(ghash(g), rthi,g.intersection(rti).area, g.area) for (rthi, rti) in refined_tiles.items() if g.intersection(rti).area > 0 and g.area - g.intersection(rti).area < 1e-16])
##                    toPlot.append(tv)
##                    plot = plotGPD(toPlot, 'tile' + str(ghash(g)) + ' intersects ' + str(icnt) + ' gt 1 input tiles')
#                    if tv_num > 20:
#                        return
                
#            existing_votes = {ghash(g): votes[rth] if any([g.intersects(rt) for (rth, rt) in refined_tiles.items()]) else 0 for g in result}
#            existing_votes = {ghash(g): votes[rth] if any([g.intersects(rt) for (rth, rt) in refined_tiles.items()]) else 0 for g in result}
#            print(additional_votes)
#            print(existing_votes)
            refined_tiles = {ghash(g):g for (g,pg) in result}
            votes = refined_tile_votes
################################### TO BE DELETED ################################
#            left_tiles = {ghash(tv):tv} # tiles not processed yet
#            temp_refined_tiles = {} # intermediate refined tiles
#            while len(refined_tiles) > 0:
#                rth, rt = refined_tiles.popitem()
#                
#                try:
#                    if 6603705626913358435 == ghash(rt):
#                        #del votes[ghash(rt)]
#                        votes_rt = votes.pop(rth)
#                    else:
#                        #del votes[ghash(rt)]
#                        votes_rt = votes.pop(rth)
#                except KeyError:
#                    print()
#                    print('Not in refined:', rth)
#                    raise KeyError(rth)
#                
#                 
#                
#                temp_left_tiles = {} # intermediate left (still to be processed) tiles - will be fed back into queue
#                while len(left_tiles) > 0:
#                    lefth, left = left_tiles.popitem()                            
#                    
#                    # we may ge a multipart geometry in return so do due diligence
#                    try:
#                        int_tile = left.intersection(rt) # intersection with already refined tile
#                    except TopologicalError:
#                        errn += 1
#                        print('Error %d during intersections' % errn)
#                        # intersection is invalid - put the refined piece back into the queue and 
#                        # place the left piece back into its next round queue to compare it with 
#                        # the next refined piece and skip the rest of the loop
#                        temp_refined_tiles[rth] = rt
#                        votes[rth] = votes_rt
#                        temp_left_tiles[lefth] = left
#                        continue 
#                    # otherwise (failing the error above) continue to the next ones
#                    int_tiles = {}
#                    if isinstance(int_tile, shapely.geometry.base.BaseMultipartGeometry):
#                        for g in int_tile.geoms:
#                            if isinstance(g, Polygon):
#                                int_tiles[ghash(g)] = g
#                            elif isinstance(g, MultiPolygon):
#                                int_tiles.update({ghash(pg):pg for pg in g.geoms})
#                    elif isinstance(int_tile, Polygon):
#                        int_tiles[ghash(int_tile)] = int_tile
#                    
#                    # same with the difference
#                    try:
#                        diff_tile = rt.difference(left)  # part of refined tile the is not covered by input tile
#                    except TopologicalError:
#                        errn += 1
#                        print('Error %d during refined diff' % errn)
#                        pass 
#                    diff_tiles = {}
#                    if isinstance(diff_tile, shapely.geometry.base.BaseMultipartGeometry):
#                        for g in diff_tile.geoms:
#                            if isinstance(g, Polygon):
#                                diff_tiles[ghash(g)] = g
#                            elif isinstance(g, MultiPolygon):
#                                diff_tiles.update({ghash(pg):pg for pg in g.geoms})
#                    elif isinstance(diff_tile, Polygon):
#                        diff_tiles[ghash(diff_tile)] = diff_tile
#                    
#                    # same with the leftovers
#                    try:
#                        left_tile = left.difference(rt) # part of input tile not refined out (covered) by refined tile
#                    except TopologicalError:
#                        errn += 1
#                        print('Error %d during left diff' % errn)
#                        pass 
#                    temp_temp_left_tiles = {}
#                    if isinstance(left_tile, shapely.geometry.base.BaseMultipartGeometry):
#                        for g in left_tile.geoms:
#                            if isinstance(g, Polygon):
#                                temp_temp_left_tiles[ghash(g)] = g
#                            elif isinstance(g, MultiPolygon):
#                                temp_temp_left_tiles.update({ghash(pg):pg for pg in g.geoms})
#                    elif isinstance(left_tile, Polygon):
#                        temp_temp_left_tiles[ghash(left_tile)] = left_tile
#
#                    for ith, int_tile in int_tiles.items():
#                        if not int_tile.is_empty and int_tile.is_valid:
#                            temp_refined_tiles[ith] = int_tile
#                            votes[ith] = votes_rt + 1
#                            if max_vote_cnts[obj_id] == votes_rt:
#                               max_vote_cnts[obj_id] = votes[ith] 
#                    for dth, diff_tile in diff_tiles.items():
#                        if not diff_tile.is_empty and diff_tile.is_valid:
#                            temp_refined_tiles[dth] = diff_tile
#                            votes[dth] = votes_rt
#                    for lth, left_tile in temp_temp_left_tiles.items():
#                        if not left_tile.is_empty and left_tile.is_valid:
#                            temp_left_tiles[lth] = left_tile
#                            
#                left_tiles = temp_left_tiles
#            
#            for lth, left_tile in left_tiles.items():
#                if not left_tile.is_empty and left_tile.is_valid:
#                    intersectors = [rft[0] for rft in temp_refined_tiles.items() if rft[1].intersection(left_tile).area > 0]
#                    if len(intersectors) > 0:
#                        print(lth,' intersects ',len(intersectors), ' refined tiles')
#                    temp_refined_tiles[lth] = left_tile
#                    votes[lth] = 1
#                    if max_vote_cnts[obj_id] == 0:
#                        max_vote_cnts[obj_id] = 1
#            
#            refined_tiles = temp_refined_tiles
 ##########################################################################################################           
            
        total_votes[obj_id] =  votes
        total_tiles[obj_id] = refined_tiles
        print(objn)
        #total_tiles[obj_id] = {ghash(t):t for t in refined_tiles}
        
        plot = plotGPD([mmo for mmo in metric_map_objects if mmo['attributes']['ssm_id'].lower() != 'bounding_box'.lower()], 'GAPPROX'+obj_id) # UNCOMMENT
#        plotGPD([rft_[1] for rft_ in refined_tiles.items() if rft_[0] in [tv_[0] for tv_ in votes.items() if tv_[1] > 6]], 'GAPPROX')
#        max_vote = max([tv_ for tv_ in votes.values()])
        addToPlot([rft_[1] for rft_ in refined_tiles.items() if rft_[0] in [tv_[0] for tv_ in votes.items() if tv_[1] >= max_vote_cnts[obj_id]]], plot, 'GAPPROX'+obj_id) 

    # now incorporate unmatched object constraints
    # we will add a vote for every pair of unmatched objects
    # and save each pair with at least one constraint satisfied
    # in a list. First get the qcns
#    tile_data = [{'attributes':{'ssm_id':(obj_id, thash)}, 'geometry':total_tiles[obj_id][thash]} for obj_id in total_tiles.keys() for thash in total_tiles[obj_id].keys()]
    
    # TO DO: Need to change the qualifier interface to recieve tuples of participants in a relation instead of 
    # list of all objects so that it computes only relations between those tuples - or alternatively allow tuple
    # filtering. Probably best if we give the tuples (optionally) and these can then be passed on to the individual
    # qualifiers.
    
    # follow expected updates in the new model:

#    data_properties = {'map_type':'metric_map'}
#    qualifier = qualifier_interface(tile_data, data_properties)
#    
#    for f in get_qualifier_functions():
#        arity = f.get_arity()
#        qualifier.qualify(f)
#    
#    qualified_tile_data = qualifier.current_qualitative_representation()
    
#    qcn_pairs = [(qcn_1, qcn_2) for qcn_1 in qualified_tile_data['constraint_collection'] for qcn_2 in qsm['constraint_collection'] if qcn_1['relation_set'] == qcn_2['relation_set']]
    
#    qcn_dict_pairs = {qcn_pair[0]['relation_set']:(qcn_to_dict(qcn_pair[0]['constraints']),qcn_to_dict(qcn_pair[1]['constraints'])) for qcn_pair in qcn_pairs}
    
    # now we can use the tile qcn's and sketch map qcn's to compare the constraints, connect, and vote
    edges_ = []
#    for i in range(len(total_votes)-1):
#        obj_i = total_votes.keys()[i]
#        i_tile_cnt = len(total_votes[obj_i])
#        for j in range(i+1, len(total_votes)):
#            obj_j = total_votes.keys()[j]
#            j_tile_cnt = len(total_votes[obj_j])
#            tile_num_i, tile_num_j = 0, 0

    def point_to_top(p1, p2):
        relation = polygonal_topology (p1, p2)
        
        if relation != 'DC':
            return ['PO', 'EC', 'EQ']
        else:
            return [relation, 'EC']
        
    objs = [(obj_i,tiles_i) for obj_i,tiles_i in total_tiles.items()]
    
    obj_weights = {obj:1.0/sum([len(total_tiles[obj_i]) for obj_i in total_tiles.keys() if obj_i != obj]) for obj in total_tiles.keys()}
    
    for i in range(len(objs) - 1):
        obj_i,tiles_i = objs[i]
        for j in range(i+1, len(objs)):
            obj_j ,tiles_j = objs[j]
            if obj_i == obj_j:
                continue
            
            for ghash_i, tile_i in tiles_i.items():
                for ghash_j, tile_j in tiles_j.items():
                    # check one calculus: RCC8
                    try:
                        rel_0 = polygonal_topology(total_tiles[obj_i][ghash_i], total_tiles[obj_j][ghash_j])
                    except KeyError:
                        rel_0 = False

                    try:
                        rel_1 = point_to_top(umo_geoms[obj_i],umo_geoms[obj_j])
                    except KeyError:
                        rel_1 = False
                        
                    if similar(rel_0,rel_1, 'RCC8'):
                        edges_.append([(obj_i, ghash_i),(obj_j, ghash_j)])
                        total_votes[obj_i][ghash_i] = total_votes[obj_i][ghash_i] + obj_weights[obj_i]
                        total_votes[obj_j][ghash_j] = total_votes[obj_j][ghash_j] + obj_weights[obj_j]
                        if max_vote_cnts[obj_i] < total_votes[obj_i][ghash_i]:
                            max_vote_cnts[obj_i] = total_votes[obj_i][ghash_i]
                        if max_vote_cnts[obj_j] < total_votes[obj_j][ghash_j]:
                            max_vote_cnts[obj_j] = total_votes[obj_j][ghash_j]
                
    # filter only for the maximum number of votes
    ballots = {obj_id:{thash:vote for thash, vote in total_votes[obj_id].items() if vote >= max_vote_cnts[obj_id]} for obj_id in total_votes}
    ballot_tiles = {obj_id:{thash:tile for thash, tile in total_tiles[obj_id].items() if total_votes[obj_id][thash] >= max_vote_cnts[obj_id]} for obj_id in total_tiles}
    
    return edges_, ballots, ballot_tiles

def check_intersections(refined_tiles):
    intersectors = []
    for i in refined_tiles:
        for j in refined_tiles:
            if i[1].intersects(j[1]):
                intersectors.append((i[0],j[0]))
                
    return intersectors

def dereference(_tuple, mo):
    _list = []
    for o in _tuple:
        _list.append(mo[o])
            
    return tuple(_list)

def ghash(geom):
    return str(geom).__hash__()
#
def similar(rel_0, rel_1, relation_set):
    if relation_set == 'RCC8':
        return rel_0 in rel_1
    if relation_set == 'left_right':
        return rel_0 == rel_1
    if relation_set == 'region_star_vars':
        return sectors_overlap(rel_0,rel_1)
    if relation_set == 'relative_distance':
        return rel_0 == rel_1
    

def sectors_overlap(r1, r2):
    min_sector_1 = r1[0]
    max_sector_1 = r1[1]
    
    min_sector_2 = r2[0]
    max_sector_2 = r2[1]
    
    if min_sector_1 <= max_sector_1:
        if min_sector_1 <= min_sector_2 <= max_sector_1 or min_sector_1 <= max_sector_2 <= max_sector_1 :
            return True
    elif min_sector_1 > max_sector_1:
        if (min_sector_1 <= min_sector_2 or min_sector_2 <= max_sector_1) or (min_sector_1 <= max_sector_2 or max_sector_2 <= max_sector_1):
            return True
    
    if min_sector_2 <= max_sector_2:
        if min_sector_2 <= min_sector_1 <= max_sector_2 or min_sector_2 <= max_sector_1 <= max_sector_2:
            return True
    elif min_sector_2 > max_sector_2:
        if (min_sector_2 <= min_sector_1 or min_sector_1 <= max_sector_2) or (min_sector_2 <= max_sector_1 or max_sector_1 <= max_sector_2):
            return True

    return False


def qcn_to_dict(qcn):
    return {(r['obj 1'], r['obj 2']):r['relation'] for r in qcn}

# note vote_set has structure 
# {'obj_id_1':{Tgeom1:votes1, ..., Tgeomk:votesK},...,'obj_id_n':{Tgeom1:votes1, ..., Tgeoml:votesl}}
def get_candidates_graph(edges_, ballots, ballot_tiles):    
    # we'll go through the list of vote sets which correspond to each unmatched object
    # and create a node for each tile labeled with that tile and the votes it has obtained
    tile_ids = [(obj_id,thash) for obj_id in ballots.items() for thash in ballots[obj_id].items()]
    tiles = [ballot_tiles[thash] for obj_id in ballots.items() for thash in ballots[obj_id].items()]
    votes = [ballots[thash] for obj_id in ballots.items() for thash in ballots[obj_id].items()]
    
    # then we can connect nodes using the edges 
    edge_list = []
    for i in range(len(tile_ids)):
        for j in range(len(tile_ids)):
            if (tile_ids[i],tile_ids[j]) in edges_:
                edge_list.append((i,j))
                
    g = Graph(len(tile_ids), edges = edge_list, vertex_attrs ={'tile_id':tile_ids, 'tile':tiles, 'votes':votes})
    
    return g


def location_selection():
    
    bval = 0
    best_locs = []
    for clique in g.largest_cliques():
        cval = sum(clique.vs['votes'])
        if cval == bval:
            best_locs.append(clique)
        elif cval > bval:
            bval = cval
            best_locs =[clique]
    
    return bval, best_locs

"""
function computes within the metric map the approximate locations of unmatched objects from the sketch map.
In: metric_map_geometries in smart_skema_format (attr, shapely.geom), sketch_map_geometries in smart_skema_format, qualified_sketch_map, matches, unmatched_sketch_objects
"""
def approximate_object_locations(sketch_map, qualified_sketch_map, metric_map, qualified_metric_map, matches):
    # rename for easy reference down stream
    mm, qmm, sm, qsm, mo = metric_map, qualified_metric_map, sketch_map, qualified_sketch_map, matches

    # first retrieve the tessellations of each map. 
    s_tes_groups = compute_tessellations(SKETCH_MAP, sm, qsm, mo)
    
    m_tes_groups = compute_tessellations(METRIC_MAP, mm, qmm, mo, base_tessellations=s_tes_groups)
    
    unmatched_sketch_objects = [d for d in sketch_map if d['attributes']['feat_type'] in ['borehole','beacon']]
    
#    unmatched_sketch_objects = [d for d in sketch_map if not d['attributes']['ssm_id'] in set(itertools.chain(mo.keys()))]
    
    umo = unmatched_sketch_objects
    
    tes_pairs = {t_s[0]:(t_s[1].get_tessellations(),t_m[1].get_tessellations()) for t_s in s_tes_groups.items() for t_m in m_tes_groups.items() if t_s[0] == t_m[0]}
#    
    edges_, ballots, ballot_tiles = get_candidate_locations(tes_pairs, metric_map, mo, umo, qsm)
#    
#    loc_graph = get_candidates_graph(edges_, ballots, ballot_tiles)
#    
#    # in here we just run max_clique several times and return 
#    sum_votes, loc_sels = location_selection(loc_graph)
#    
#    # export the stuff to geojson as a list
#    geometry_outputs = []
#    for loc_cands in loc_sels:
#        feature_collection = {"type":"FeatureCollection", "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } }, "features":[]}
#        for loc in loc_cands.vs:
#            obj_id = loc['tile_id'][0]
#            tile_id = loc['tile_id'][1]
#            geom = loc['tile']
#            votes = loc['votes']
#            
#            feature = {'type': 'Feature', 'properties': {'ssm_id':obj_id, 'tile':tile_id, 'evaluation':votes}, 'geometry':geojson.loads(geojson.dumps(mapping(geom)))}
#            
#            feature_collection['features'].append(feature)
#        geometry_outputs.append(feature_collection)
#        
#    return geometry_outputs
#    
    
    
    
    
    
    
    
    
    
    #{ 'id':object_id, tessellations:[ {'name':name_of_tessellation, 'inducers':(tuple, of, objects), 'tiles': {'ref_1':tile_1, ..., 'ref_k':tile_K} }, ... ] } ]
