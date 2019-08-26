# -*- coding: utf-8 -*-
"""
Created on Thu Jan 25 12:28:47 2018

@author: Malumbo
"""
import io
import json
import pprint

import matcher.geojson
import matcher.svg
# from qualifier_database_writer import write_to_db
from matcher.qualifier import QualifierInterface, get_qualifier_functions
#from svgpathtools import svg2paths2
from lib import svg2paths2, svg2pathss2

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
def load_map_qualify(mapID, map_data, data_format, map_type):
    data_format = data_format
    map_type = map_type

    data_properties, data = 0, 0

    # load the data
    if data_format.strip().lower() == 'geojson'.lower():
        data_properties, data = matcher.geojson.load_map(map_data, map_type)
    elif data_format.strip().lower() == 'svg'.lower():
        data_properties, data = matcher.svg.load_map(map_data, map_type)
    elif data_format.strip().lower() == 'svg_content'.lower():
        data_properties, data = matcher.svg.load_map(map_data, map_type)

    # if load is successful continue to generate qualitative representation
    # and write the data to the database
    if not (data_properties == 0 or data == 0):
        # get the qualitative representation for the whole map
        qualitative_representation = qualify(data, data_properties)

    return qualitative_representation


def read_map_data_from_path(path, data_format):
    if data_format.strip().lower() == 'svg'.lower():
        #print("SVG\n", path)
        data = svg2paths2(path)
    if data_format.strip().lower() == 'geojson'.lower():
        with open(path) as file:
            data = json.load(file)
    #print(data)
    return data


def read_map_data_from_string(dstring, data_format):
    if data_format.strip().lower() == 'svg'.lower():
        #print("SVG\n", dstring)
        data = svg2pathss2(dstring)
    if data_format.strip().lower() == 'geojson'.lower():
        data = json.loads(dstring)

    return data
