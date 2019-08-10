# -*- coding: utf-8 -*-
"""
Created on Wed May 15 15:51:54 2019

@author: s_jan001
"""


def convert_tiles_into_geojson(coordinates,geo_data_properties):
    georeferenced_features = []
    georeferenced_feature = {"type": "Feature",
                             "properties": {"id":"",
                                            "name": "",
                                            "feat_type":"approximate_tile"},
                             "geometry": coordinates}

    georeferenced_features.append(georeferenced_feature)

    geojson_output = geo_data_properties.copy()
    geojson_output["features"] = georeferenced_features

    return geojson_output
