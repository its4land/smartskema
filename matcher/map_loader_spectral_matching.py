# -*- coding: utf-8 -*-
"""
Created on Thu Jan 25 12:28:47 2018

@author: Malumbo
"""
import io
import json

import matcher.geojson
import matcher.svg
#from qualifier_database_writer import write_to_db
from matcher.matching_preprocessor import compute_similarity_matrix
from matcher.qualifier import QualifierInterface, get_qualifier_functions
from matcher.adp_map_alignment_alternating import ADPMatcher

from matcher.test_eigen2 import SpecCenScore

try:
    to_unicode = unicode
except NameError:
    to_unicode = str


# this function computes the qualitative representation of the input data
# and returns it. At the moment the qualifiers for each set of relations are 
# specified manually in qualifier_collection. Later we will load them from a settings file.
def qualify(data, data_properties):
    qualifier = QualifierInterface(data, data_properties)
    
    # qualify each aspect in turn
    for qf in get_qualifier_functions(data):
        f = qf[0]
        if qf[1] is None:
            kwargs = {}
        else:
            kwargs = qf[1]

        qualifier.qualify(f, **kwargs)
    
    return qualifier.current_qualitative_representation()

# =========================================== =========================== 
# path # './Data/Polygons_test.geojson' 
# data_format = 'geojson' 
# map_type = ' metric_map ' 
# 
# path =' ./Data/sample.svg ' 
# data_format =' svg ' 
# map_type =' sketch_map ' 
# ===================== ================================================== ===== 
input_list = [] 
#input_list.append ({'path': './Data/sample-small.svg', 'data_format': 'svg', 'map_type': 'sketch_map'}) 
#input_list.append ({ 'path': './Data/sample_synthetic_map_polys.geojson', 'data_format': 'geojson', 'map_type': 'metric_map'}) #metric_map

#input_list.append ({ 'path': './Data/Jan_all_beacons_boundary.geojson', 'data_format': 'geojson', 'map_type': 'metric_map'})
#input_list.append ({ 'path': './Data/Jan_all_geometries_reduced.geojson', 'data_format': 'geojson', 'map_type': 'metric_map'})
#IMAD:input_list.append ({'path': './data/sketch_2-Copy.svg', 'data_format': 'svg', 'map_type': 'sketch_map'})  #'./Data/Jan_sketchmap_2_modified_v5.svg'
input_list.append({'path': './data/all_geometries_v1.geojson', 'data_format': 'geojson', 'map_type': 'metric_map'})
input_list.append({'path': './data/sketch_2.svg', 'data_format': 'svg', 'map_type': 'sketch_map'})
#Jans maps
#input_list.append ({'path': './Data/query-correction-geojson-only-maps/MM_fileName.geojson', 'data_format': 'geojson', 'map_type': 'sketch_map'})       #MM_fileName.geojson

#Jans maps2
#input_list.append ({'path': './Data/SMdata2.geojson', 'data_format': 'geojson', 'map_type': 'metric_map'})       #SMdata2.geojson

data_properties1, data1 = {}, [] 
data_properties2, data2 = {}, [] 


# load the data1
if input_list[0]['data_format']. strip(). lower() == 'geojson'.lower():
    in_data_properties, in_data = geojson.load_map (input_list[0]['path'], input_list[0]['map_type'])
elif input_list[0]['data_format']. strip(). lower() == 'svg'.lower():
    in_data_properties, in_data = svg.load_map(input_list[0] ['path'], input_list[0] ['map_type'])


data1.extend(in_data)
data_properties1.update(in_data_properties)

# load the data2
if input_list[1]['data_format']. strip(). lower() == 'geojson'.lower ():
    in_data_properties, in_data = geojson.load_map(input_list[1]['path'], input_list[1]['map_type'])
elif input_list[1]['data_format']. strip(). lower() == 'svg'.lower():
    in_data_properties, in_data = svg.load_map (input_list[1]['path'], input_list[1]['map_type'])

data2.extend (in_data) 
data_properties2.update(in_data_properties)


# If load is successful continue to generate qualitative representation 
# and write the data to the database 
if ((not (len (data_properties1) == 0 or len (data1) == 0)) and not (len (data_properties1) == 0 or len (data1) == 0)): 
    # get the quality representation for the whole map
    qualitative_representation1 = qualify (data1, data_properties1)
    qualitative_representation2 = qualify (data2, data_properties2)
    print('maps qualified ... writing to database')
    # write the qualitative representation to the database
    with io.open('./output/mm_dict.json', 'w', encoding='utf8') as file:
        jstr = json.dumps(qualitative_representation1
    #                           ,indent = 4, sort_keys = True,
    #                           separators = (',',': '), ensure_ascii = False
                )
        file.write(to_unicode(jstr))

    with io.open('./output/sm_dict.json', 'w', encoding='utf8') as file:
        jstr = json.dumps(qualitative_representation2)
        file.write(to_unicode(jstr))

    #    mapid = write_to_db (qualitative_representation)
    similarity_matrix, sketch_map_size = compute_similarity_matrix(
        qualitative_representation1,
        qualitative_representation2
    )

    # matcher = SpecMatch(sketch_map_size, similarity_matrix)
    matcher = SpecCenScore(similarity_matrix, sketch_map_size)
    print(qualitative_representation2['features'][10],"\n==========================================================",qualitative_representation1['features'][12])
    matchdict = {}          # dictionary with SM_ssm_id : MM_name
    pairsdict = {}          # dictionary with SM_ssm_id : MM_ssm_id
    for l in range(matcher.slist.shape[0]):
        matchdict[qualitative_representation2['features'][matcher.slist[l]]['ssm_id']] = qualitative_representation1['features'][matcher.mlist[l]]['name']
        pairsdict[qualitative_representation2['features'][matcher.slist[l]]['ssm_id']] = qualitative_representation1['features'][matcher.mlist[l]]['ssm_id']
        print(qualitative_representation2['features'][matcher.slist[l]]['ssm_id'],"(",qualitative_representation2['features'][matcher.slist[l]]['feat_type'],")...matches with...",qualitative_representation1['features'][matcher.mlist[l]]['ssm_id'],"(", qualitative_representation1['features'][matcher.mlist[l]]['feat_type'], ")")
    print(matchdict)
    print(pairsdict)

print("exited successfully")