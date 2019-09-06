# -*- coding: utf-8 -*-
"""
Created on Friday Sep. 06 10:07:51:54 2019

@author: s_jan001
"""

import requests
import json

import os

API_URL_PnS = "http://platform.its4land.com/api"

PAYLOAD = {
"type": "FeatureCollection",
"name": "i4lProject",
"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
"features": [
{ "type": "Feature", "properties":
 {"Name": "Kenya SmartSkeMa", "Description": "smartskema PnS Test on 06/09/19" },
 "geometry": { "type": "Polygon", "coordinates": [ [ [ 36.777795165646381, -2.23228285862402 ], [ 37.002349096730299, -2.236075251309175 ], [ 37.011046608145527, -2.398190656910149 ], [ 36.776371936505711, -2.396610675322141 ], [ 36.776371936505711, -2.396610675322141 ], [ 36.777795165646381, -2.23228285862402 ] ] ] } }
]
}

HEADER = {
        "Content-Type": "application/json",
        "cache-control": "no-cache"
}

def get_PnS_Project_ID ():
    global API_URL_PnS
    global PAYLOAD
    response = requests.post(API_URL_PnS+"/projects", data = json.dumps(PAYLOAD), headers = HEADER)
    #print(response.status_code)
    if response.status_code ==201:
        resp_json = response.json()
        for i in resp_json['features']:
            project_id = i['properties']['UID']

        return project_id
    else:
        return None

"""
    All the files should be save as contentItem at PnS platform
"""
def post_contentItem_to_PnS(file, description=None):
    if (description):
        data = {"description":description}
    else:
        data = None
    file_contents = {"newcontent": open(file, "rb")}

    resp = requests.post(API_URL_PnS + "/contentitems", files = file_contents, data = data)

    return resp


def post_spatialSource_to_PnS(endpoint, payload):
    header = {
        "Content-Type": "application/json",
        "cache-control": "no-cache"
    }
    #endpoint_url = API_URL_PnS+endpoint
    resp = requests.post(API_URL_PnS+endpoint, data = json.dumps(payload), headers = header)
    return resp



def post_all_files_to_Pns(file,PnS_PROJ_ID):
    #print(PnS_PROJ_ID)
    fileName = os.path.basename(file)
    name, ext = os.path.splitext(fileName)
    if ext == ".png":
        fileType = "sketch"
    elif ext == ".geojson":
        fileType = "base"

    """ call post content item endpoint"""
    resp_ci = post_contentItem_to_PnS(file, os.path.basename(file))
    if resp_ci.status_code == 201:
        resp_json = resp_ci.json()
        ContentID = resp_json.get("ContentID")
        payload_json = {
            "Type": fileType,
            "Description": os.path.basename(file),
            "ContentItem": ContentID,
            "Name": os.path.basename(file)
        }
        spatialSource_PnS_endPoint = "/projects/" + PnS_PROJ_ID + "/SpatialSources"
        resp_ss = post_spatialSource_to_PnS(spatialSource_PnS_endPoint, payload_json)
        if resp_ss.status_code == 201:
            # print(resp_ss.json())
            return resp_ss.status_code
        else:
            print("problem in creating spatialSource")
    else:
        return "Problem in posting contentItems"