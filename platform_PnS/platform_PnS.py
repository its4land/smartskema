# -*- coding: utf-8 -*-
"""
Created on Friday Sep. 06 10:07:51:54 2019

@author: s_jan001
"""

import requests
import json

import os
import sys

API_URL_PnS = "https://platform.its4land.com/api"

PAYLOAD = {
"type": "FeatureCollection",
"name": "i4lProject",
"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
"features": [
{ "type": "Feature", "properties":
 {"Name": "Kenya SmartSkeMa_tested on 17/09/2019", "Description": "smartskema PnS Test on 06/09/19" },
 "geometry": { "type": "Polygon", "coordinates": [ [ [ 36.777795165646381, -2.23228285862402 ], [ 37.002349096730299, -2.236075251309175 ], [ 37.011046608145527, -2.398190656910149 ], [ 36.776371936505711, -2.396610675322141 ], [ 36.776371936505711, -2.396610675322141 ], [ 36.777795165646381, -2.23228285862402 ] ] ] } }
]
}

HEADER = {
        "Content-Type": "application/json",
        "cache-control": "no-cache"
}
class PnSError(Exception):
    def __init__(self,msg):
        print("Pns error", msg)


def get_PnS_Project_ID ():
    global API_URL_PnS
    global PAYLOAD
    try:
        response = requests.post(API_URL_PnS+"/projects", data = json.dumps(PAYLOAD), headers = HEADER)
        print("project creating resp code",response.status_code)
        if response.status_code ==201:
            resp_json = response.json()

            for i in resp_json['features']:
                project_id = i['properties']['UID']

            return project_id
        else:
            raise PnSError("Error creating Project")
    except PnSError as e:
        print("problem in create project at PnS")

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
    print("its4Land/API_URL...:",API_URL_PnS+endpoint)
    resp = requests.post(API_URL_PnS+endpoint, data = json.dumps(payload), headers = header)
    return resp



def post_to_Pns(file,fileType,fileName_prefix,PnS_PROJ_ID):
    #print(PnS_PROJ_ID)
    """ call post content item endpoint"""
    try:
        resp_ci = post_contentItem_to_PnS(file, os.path.basename(file))
        print("resp_ci",resp_ci)
        if resp_ci.status_code == 201 :
            resp_json = resp_ci.json()
            #print(resp_json)
            ContentID = resp_json.get("ContentID")
            payload_json = {
                "Type": fileType,
                "Description": fileName_prefix,
                "ContentItem": ContentID,
                "Name": os.path.basename(file)
            }
            spatialSource_PnS_endPoint = "/projects/" + PnS_PROJ_ID + "/SpatialSources"
            resp_ss = post_spatialSource_to_PnS(spatialSource_PnS_endPoint, payload_json)
            print("resp_ss", resp_ss)
            if resp_ss.status_code == 201:
                resp_ss_json = resp_ss.json()
                for i in resp_ss_json['features']:
                    SpatialSources = i['properties']["SpatialSources"]
                    for j in SpatialSources:
                        SpatialSources_UID = j["UID"]
                return str(SpatialSources_UID)
            else:
                raise PnSError("Problem in Creating SpatialSource")
        else:
            raise PnSError("Problem in Posting Content Items")
    except PnSError as e:
        print("Problem in Posting Content Item to PnS")

def post_related_files_to_PnS_ADocs(file,fileType,PnS_PROJ_ID,SPATIALSOURCE_SKETCH_UID):
    """ call post content item endpoint"""
    try:
        resp_ci = post_contentItem_to_PnS(file, fileType)

        if resp_ci.status_code == 201 :

            resp_json = resp_ci.json()
            ContentID = resp_json.get("ContentID")
            payload_json = {
                "Type": fileType,
                "Description": fileType,
                "ContentItem": ContentID,
                "Name": fileType
            }
            additionaDocument_endPoint = "/SpatialSource/"+SPATIALSOURCE_SKETCH_UID+"/AdditionalDocument"
            resp_ss = post_spatialSource_to_PnS(additionaDocument_endPoint, payload_json)
            #print("resp_ss", resp_ss)
            if resp_ss.status_code == 201:
                return resp_ss
            else:
                raise PnSError("Problem in creating spatialSource additional documents ")
        else:
            raise PnSError("Problem in posting contentItems for additional files")
    except PnSError as e:
        print("Problem in Posting additional documents to PnS")



def get_project_list_PnS(**kwargs):
    sub_projectList = []
    try:
        response = requests.get(API_URL_PnS + "/projects/" + kwargs["pns_proj_id"] + "?embed=SpatialSources")
        print(response.status_code)
        if response.status_code == 200:
            resp_json = response.json()
            for i in resp_json['features']:
                if 'properties' in i:
                    #print("properties",i["properties"])
                    if "SpatialSources" in i["properties"]:
                        spatialsource = i["properties"]["SpatialSources"]
                        #print("herr you go ",spatialsource)
                        for j in spatialsource:
                            if "ContentItem" in j:
                                contentItem = j["ContentItem"]
                                contentDescription = j["Description"]
                                spatialSource_ID = j["ObjectUUID"]

                                temp = contentDescription.split(":")
                                subProj = ":".join(temp[1:3])
                                sub_projectList.append(subProj)

                                #get_and_save_contentItem(contentItem, contentDescription, kwargs)
                            else:
                                raise PnSError("Can't find ContentItems in the project response")
                    else:
                        raise PnSError("SpatialSource is not in the project response")
                else:
                    raise PnSError("Can't find Properties in the project response")
            return sub_projectList
    except PnSError as e:
        print("Problem in accessing content of the project from PnS ")



def get_projects_items_from_PnS(**kwargs):
    spatialSource_list = []
    try:
        sub_proj_name = kwargs["sub_proj_name"]
        print("sub_proj_name",sub_proj_name)
        response = requests.get(API_URL_PnS + "/projects/"+kwargs["pns_proj_id"]+"?embed=SpatialSources")

        if response.status_code ==200:
            resp_json = response.json()
            for i in resp_json['features']:
                if 'properties' in i:
                    if "SpatialSources" in i["properties"]:
                        spatialsource = i["properties"]["SpatialSources"]
                        #print(spatialsource)
                        for j in spatialsource:
                            if "ContentItem" in j:
                                contentDescription = j["Description"]
                                if sub_proj_name in contentDescription:
                                    #print(contentDescription)
                                    contentItem = j["ContentItem"]
                                    spatialSource_ID = j["ObjectUUID"]
                                    spatialSource_list.append(spatialSource_ID)
                                    resp = get_and_save_contentItem(contentItem, contentDescription, kwargs)

                            else:
                                raise PnSError("Content item not found in the project response")
                    else:
                        raise PnSError("spatial source not found in the project response")
                else:
                    raise PnSError("Properties are not found in the project response")



            if len(spatialSource_list)>0:

                resp = download_additional_documents(spatialSource_list,kwargs)
                print(resp)
            else:
                raise PnSError("No spatialsources found in the selected sub_project")
        else:
            raise PnSError("Problem in getting projecting contents")
    except PnSError as e:
        print("Problem in accessing content of the sub_project from PnS ")
    return response.status_code


def get_and_save_contentItem(contentItem, desc,kwargs):

    project_Dir = os.path.join(kwargs["user_session_dir"],kwargs["pns_proj_id"])
    sub_proj_name = kwargs["sub_proj_name"]
    temp = sub_proj_name.split(":")
    subProj_type = ":".join(temp[:1])
    sub_subProj_type = ":".join(temp[1:])
    #print(subProj_type, sub_subProj_type)
    try:
        if kwargs['proj_dir_path'] is "":
            projectType = subProj_type
            proj_type_dir_path = os.path.join(project_Dir,projectType,sub_subProj_type)
            #print("proj_type_dir_path", proj_type_dir_path)

        else:
            proj_type_dir_path =  kwargs['proj_dir_path']


        os.makedirs(proj_type_dir_path)
        os.mkdir(os.path.join(proj_type_dir_path, kwargs['uploaded_dir_path']))
        os.mkdir(os.path.join(proj_type_dir_path, kwargs['output_dir_path']))
        os.mkdir(os.path.join(proj_type_dir_path, kwargs['modified_dir_path']))
        #os.mkdir(os.path.join(proj_type_dir_path, SVG_DIR_PATH))
    except IOError:
        print("problem in createing session..")
    except FileExistsError:
        print("file already exist")


    location_list =desc.split(":")
    #print("location_list",location_list)
    location = os.path.join(proj_type_dir_path,*location_list[3:])
    #print("locations",location)

    download_contentItem(contentItem,location)
    return "folders are create"



def download_contentItem (contentID, location):

    #print("contentitem id ",contentID,location)
    resp = requests.get(API_URL_PnS+"/contentitems/"+contentID)

    try:
        with open(location, "wb") as file:
            file.write(resp.content)
    except:
        print("Problem in downloading and writing file to folders")
    return



def download_additional_documents(spatialSourceList,kwargs):
    try:
        for i in spatialSourceList:
            print("i = spatialSourceList ",i)
            resp =  requests.get(API_URL_PnS+"/spatialsource/"+i+"?embed=AdditionalDocuments")
            if resp.status_code==200:
                response = resp.json()
                print("response for Additional doc",response)
                if 'AdditionalDocuments' in response:
                    for doc in response["AdditionalDocuments"]:
                        print("DOCs", doc)
                        if "ContentItem" in doc:
                            contentItem = doc["ContentItem"]
                            contentDescription = doc["Description"]
                            contentType = doc["Type"]
                            get_and_save_contentItem(contentItem,contentType,kwargs)
                        else:
                            raise PnSError("ContentItem is not in AdditionalDocuments")
                else:
                    raise PnSError("AdditionalDocuments is not in the Pns response")
        return resp.status_code
    except:
        print("Problem in downloading Additional Documents")


def get_metric_map_features(boundingBox):
    response = requests.get("http://platform.its4land.com:80/api/metricmapfeature?querywindow=" + boundingBox)
    # print(response.status_code)
    if response.status_code == 200:
        json_content = response.json()
        for feature in json_content['features']:
            # print(feature)
            properties = feature["properties"]
            UID = feature["properties"]["UID"]
            ftype = feature["properties"]["ftype"]
            # print(UID, ftype)
            properties.update([('id', UID), ('class', ftype), ('feat_type', ftype)])

        return json_content
    else:
        return None
