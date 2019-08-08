# -*- coding: utf-8 -*-
"""
Created on Tue Jan 23 12:09:22 2018

@author: Malumbo
"""

import os
import json

from shapely.geometry import Polygon, shape

from method.spatial import is_clockwise


def load_map(jsonData, map_type):
    map_properties = {'map_type': map_type}

    feature_attributes = []
    shapelyGeomList = []

    # geojson is a metric map so let's set the properties accordingly -- at least the map type
    map_properties["type"] = jsonData["type"]
    map_properties["crs"] = jsonData["crs"]

    for i in jsonData['features']:
        geom = i['geometry']
        shapelyGeom = shape(geom)
        if (shapelyGeom.geom_type == 'Polygon'):
            if (is_clockwise(shapelyGeom)):
                shapelyGeom = Polygon(shapelyGeom.exterior.coords[::-1])

        shapelyGeomList.append(shapelyGeom)

        attributes = i['properties']
        feature_attributes.append(attributes)

    features = list(map(lambda x, y: {"attributes": x, "geometry": y}, feature_attributes, shapelyGeomList))
    for d in features:
        d['attributes']['geometry_type'] = d['geometry'].geom_type
        d['attributes']['ssm_id'] = d['attributes']['id']
        del d['attributes']['id']

    print("map loaded")
    return map_properties, features
