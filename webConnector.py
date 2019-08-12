# -*- coding: utf-8 -*-
"""
Created on Mon Apr 30 15:51:54 2018

@author: s_jan001
"""
import shutil
from docutils.nodes import image
from flask import Flask, render_template, request, redirect, url_for
from matcher.matching_preprocessor import compute_similarity_matrix
from matcher.adp_map_alignment_alternating import ADPMatcher
from matcher.test_eigen2 import SpecCenScore
# from qualifier import qualify_map
from matcher.map_loader import load_map_qualify, read_map_data_from_path, read_map_data_from_string
from matcher.geojson import load_map as load_geo
from matcher.svg import load_map as load_svg
from sklearn.linear_model import LinearRegression as linear_regression
from sklearn.preprocessing import PolynomialFeatures as polynomial_features
import cv2
import numpy as np
import io
import json
import os
import sys
from settings import APP_ROOT, DIR_DATA, DIR_QCNS, RecordList, \
    SketchMapName, BaseMapName
    # STATIC_DIR,UPLOADED_DIR_PATH,PROJ_DIR_PATH,MODIF_DIR_PATH,OUTPUT_DIR_PATH,SVG_DIR_PATH,UUID
import logging
from logging.handlers import RotatingFileHandler
from matplotlib import pyplot as plt
import base64

from lib import svg2paths
from pathlib import Path
from sketchProcessor.helperLibraries.utils import draw
from sketchProcessor.helperLibraries.utils import contour_classification as cc
import svgutils
from owlready2 import *
import owlready2
from domainModel.owlProcessor import *
import datetime
from domainModel.spatialQueries import *
import matplotlib as plot
import mimetypes
from time import sleep
import uuid
import base64
import io
import shapely
from shapely.geometry import Polygon,LinearRing
from geometryVisualizer import config
from geometryVisualizer.left_right_tiles import GLeftRightTiles as g_left_right_tiles
from geometryVisualizer.rcc_tiles import GRccTiles as g_rcc_tiles
from geometryVisualizer.reldist_tiles import GRelDistTiles as g_reldist_tiles
from geometryVisualizer.tessellations import Tessellations as tessellation
from geometryVisualizer.tiles_to_geoJson import *


#sys.setrecursionlimit(22000)

"""
create flask web app instance 
"""
mimetypes.add_type('image/svg+xml', '.svg')

DEBUG_SESSID = "39bb2657-d663-4a78-99c5-a66c152693b2"

STATIC_DIR = os.path.join("./static", "usessions")
UPLOADED_DIR_PATH = "uploaded"
MODIF_DIR_PATH = "modified"
OUTPUT_DIR_PATH = "output"

# probably delete this
SVG_DIR_PATH = "svg"

INPUT_RASTER_SKETCH = "input_sketch_image.png"
REDUCED_RASTER_SKETCH = "reduced_sketch_image.png"
VECTORIZED_SKETCH = "vectorized_sketch_svg.svg"

VECTOR_BASEMAP = "vector_base_map.geojson"

GEOREFERENCED_SKETCH_FEATURES = "georeferenced_sketch_features.json"
MATCHED_FEATURES = "matches.json"

SKETCH_MAP_QCN = "sketchmap_qcn.json"
BASEMAP_QCN = "basemap_qcn.json"

PARTIES_FILE = "parties.json"
LADM_FILE = "ladm.owl"
TENURE_RECORD_FILE = "tenureRecord.json"
APROX_TILE = "approx_tile_file.geojson"

app = Flask(__name__)

"""
This belongs to the utils modules but is here for quickly constructing directory/file paths from path lists
"""
def build_path(path_list):
    return os.path.join(*path_list)


def path_to_project(d):
    #print("d",d)
    return os.path.join(STATIC_DIR, d.get("sessID"), d.get("projectType"))

"""/getSessionID
    try:
        sess_id = request.args.get("sessID")
    except KeyError:
        sess_id = str(uuid.uuid4())
"""


@app.route("/")
def main_page():
    return render_template("smartSkeMa.html")


@app.route("/getSessionID", methods=["GET"])
def get_session_id():
    global STATIC_DIR
    global PROJ_DIR_PATH

    """ comment out if using full alignment in debug mode """
    if app.debug:
        print("using predefined session ID!")
        #print("here session id",debug_get_session_id())
        return debug_get_session_id()

    sess_id = str(uuid.uuid4())
    proj_dir_path = os.path.join(STATIC_DIR, sess_id)

    try:
        if not (os.path.exists(proj_dir_path)):
            os.mkdir(proj_dir_path)

    except IOError:
        print("problem in creating PROJ_DIR and Sub_DIRs..")

    # print(url_for('.smartSkeMa'))
    print("generated session ID - now returning!")
    return sess_id  # redirect("dashboard.html", sessId=sess_id)


def debug_get_session_id():
    return DEBUG_SESSID


@app.route("/setProjectType", methods=["POST"])
def setProjectType():
    global UPLOADED_DIR_PATH
    global MODIF_DIR_PATH
    global OUTPUT_DIR_PATH
    global SVG_DIR_PATH
    global PROJ_DIR_PATH

    try:
        #print("request.form",request.form)
        proj_type_dir_path = path_to_project(request.form)
        PROJ_DIR_PATH = proj_type_dir_path
        if not (os.path.exists(proj_type_dir_path)):
            os.mkdir(proj_type_dir_path)
            os.mkdir(os.path.join(proj_type_dir_path, UPLOADED_DIR_PATH))
            os.mkdir(os.path.join(proj_type_dir_path, MODIF_DIR_PATH))
            os.mkdir(os.path.join(proj_type_dir_path, OUTPUT_DIR_PATH))
            os.mkdir(os.path.join(proj_type_dir_path, SVG_DIR_PATH))

    except IOError:
            print("problem in creating PROJ_DIR and Sub_DIRs..")
    return ""

@app.route("/smartSkeMa_new", methods=["POST", "GET"])
def domainModel():
    return render_template("smartSkeMa.html")


@app.route("/metricFileName", methods=["POST", "GET"])
def getMetricMapID():
    metricMapID = request.args.get("metricFileName")
    BaseMapName=metricMapID
    return "msg"


@app.route("/sketchFileName", methods=["POST", "GET"])
def getSketchMapID():
    sketchMapID = request.args.get("sketchFileName")
    SketchMapName= sketchMapID
    return "msg"

# the function calls the reasoner to execuite the submitted query
@app.route("/reasoner_process_spatial_queries",methods = ["POST","GET"])
def reasoner_process_spatial_queries():
    owlready2.JAVA_EXE = "C:\\Program Files (x86)\\Common Files\\Oracle\\Java\\javapath"
    feat_type = request.args.get('main_feat_id')
    feat_type = request.args.get('main_feat_type')
    loaded_ladm_path = request.args.get('loaded_ladm_path')
    print(loaded_ladm_path)
    ontology = get_ontology(loaded_ladm_path).load()
    sync_reasoner(ontology)
    result = ontology.Jan.__class__
    print(sync_reasoner(ontology))

    return result


@app.route("/getParty", methods =["POST"])
def getParty():
    global UPLOADED_DIR_PATH
    global PARTIES_FILE
    global PROJ_DIR_PATH
    proj_type_dir_path = path_to_project(request.form)
    fileName_full = request.form.get('loadedPartyFile')
    partyJson = json.loads(request.form.get('partyJson'))
    #print("project to path",proj_type_dir_path)
    #fileName_full = request.args.get('loadedPartyFile')
    #partyJson = json.loads(request.args.get('partyJson'))
    party = partyJson.get("parties")
    try:
        uploaded_filepath = os.path.join(proj_type_dir_path, UPLOADED_DIR_PATH, PARTIES_FILE)
        #uploaded_filepath = os.path.join(UPLOADED_DIR_PATH, fileName_full)
        if os.path.exists(uploaded_filepath):
            os.remove(uploaded_filepath)
        f = open(uploaded_filepath, "w")
        f.write(json.dumps(partyJson, indent=4))
        f.close()

    except IOError:
        print("problem in Writing JSON file to the location...")

    return json.dumps(party)


@app.route("/qualitative_spatial_queries", methods=["POST"])
def qualitative_spatial_queries():
    global OUTPUT_DIR_PATH
    global SKETCH_MAP_QCN
    selected_feat_lr_rel = []
    selected_feat_rcc8_rel = []
    selected_feat_relDist_rel = []
    try:
        main_feat_id = request.form.get('main_feat_id')
        main_feat_type = request.form.get('main_feat_type')
        proj_type_dir_path = path_to_project(request.form)
        #print(main_feat_id, main_feat_type)
        smQCNFilePath = os.path.join(proj_type_dir_path,OUTPUT_DIR_PATH, SKETCH_MAP_QCN)

    except IOError:
        print("sketchmap_qcn.json path has problem ")

    with open(smQCNFilePath) as smJson:
        smQCNs = json.loads(smJson.read())

    with open('./static/data/spatialRepresentations.json') as qr_file:
        qualReps = json.loads(qr_file.read())
        qualiReps_list = get_qualitativeRepresentaitons(qualReps)
        #print("listofRepresentations",qualiReps_list)
        for i in range(len(qualiReps_list)):
            if (qualiReps_list[i] == "LEFT_RIGHT"):
                lr_relations = getTotalLeftRightRelations_sm(smQCNs)
                river_id = get_river_sm(smQCNs)
                for j in lr_relations:
                    obj2 = j["obj_2"]
                    if (main_feat_id == obj2):
                        selected_feat_lr_rel.append(j)

            if(qualiReps_list[i]=="RCC8"):
                rcc8_relations = getTotalRCC8Relations_sm(smQCNs)
                selected_feat_rcc8_rel = get_main_feature_rcc8rel_(main_feat_id,rcc8_relations)

            if (qualiReps_list[i] == "REL_DIST"):
                relDist_relations = getTotalRelDistRelations_sm(smQCNs)
                selected_feat_relDist_rel = get_main_feature_relDist_(main_feat_id, relDist_relations)


        print(selected_feat_lr_rel,selected_feat_rcc8_rel,selected_feat_relDist_rel)


    return json.dumps({"selected_feat_lr_rel":selected_feat_lr_rel,"selected_feat_rcc8_rel":selected_feat_rcc8_rel,"selected_feat_relDist_rel":selected_feat_relDist_rel})


@app.route("/get_approx_location_from_relations", methods=["POST"])
def get_approx_location_from_relations():
    #global main_feat_type
    global OUTPUT_DIR_PATH
    global UPLOADED_DIR_PATH
    global VECTOR_BASEMAP
    global APROX_TILE
    #global UPLOADED_DIR_PATH, MM_fileName_full

    try:
        proj_type_dir_path = path_to_project(request.form)
        lr_relations = json.loads(request.form.get('clicked_relations'))
        mm_json_FilePath = os.path.join(proj_type_dir_path, UPLOADED_DIR_PATH, VECTOR_BASEMAP)
        print("here basemap json",mm_json_FilePath)
        relatum = lr_relations['relatum']
        representation = lr_relations['representation']
        main_feat_id = lr_relations['main_feat_id']
        main_feat_type = lr_relations['main_feat_type']
        lr_relations = lr_relations['relation']

    except IOError:
        print("sketchmap_qcn.json path has problem ")

    # mm_json_FilePath = os.path.join(UPLOADED_DIR_PATH,MM_fileName_full)
    #mm_json_FilePath = "./static/metric_map_v6.geojson"

    print("relatum..:", relatum)
    print("rellations ..:", lr_relations)
    print(" representaiton..:", representation)
    print(" main_feat_id..:", main_feat_id)
    print(" main_feat_type..:", main_feat_type)

    geo_data_properties, data_geom = load_geo(read_map_data_from_path(mm_json_FilePath, "geojson"), "geojson")
    relatum_feat_type = get_relatum_feat_type(relatum, data_geom)

    #print("relatum_feat_type", relatum_feat_type)

    geoJson_tiles_type = ""
    if representation == "left_right":
        geoJson_tiles_type = "left_right"
        filter_params = {'filter_geoms': 6, 'filter_types': False, 'type_list': [], 'filter_ids': False,
                         'id_list': [], 'filter_names': False, 'name_list': []}
        filter_params['filter_ids'] = True
        filter_params['id_list'].append(relatum)

        tessellation_sets = {}
        tessellation_sets = tessellation('left_right', g_left_right_tiles, 1, data_geom, False,
                                         **filter_params).get_tessellations()
        # print(tessellation_sets)
        filter_params['filter_geoms'] = config.FILTER_ALL

        if lr_relations['relation'] == "left":
            shapelyObject = tessellation_sets[(relatum,)].get_tile('left')
        elif lr_relations['relation'] == "right":
            shapelyObject = tessellation_sets[(relatum,)].get_tile('right')
        else:
            shapelyObject = tessellation_sets.values()
        coords = shapelyObject.exterior.coords[::-1]
        shapelyObject = Polygon(coords)
        computed_tiles = shapely.geometry.mapping(shapelyObject)  #

        geoJson_tiles = convert_tiles_into_geojson(computed_tiles, geo_data_properties)

    elif representation == "RCC8":
        geoJson_tiles_type = "RCC8"
        filter_params = {'filter_geoms': 6, 'filter_types': False, 'type_list': [], 'filter_ids': False,
                         'id_list': [], 'filter_names': False, 'name_list': []}
        filter_params['filter_ids'] = True
        filter_params['id_list'].append(relatum)

        tessellation_sets = {}
        tessellation_sets = tessellation('rcc', g_rcc_tiles, 1, data_geom, False,
                                         **filter_params).get_tessellations()

        filter_params['filter_geoms'] = config.FILTER_ALL

        if lr_relations['relation'].upper() == 'PO' or 'EQ' or 'TPP' or 'TPPI' or 'NTPP' or 'NTPPI':
            shapelyObject = tessellation_sets[(relatum,)].get_tile('interior')
        elif lr_relations['relation'].upper() == 'EC' or 'PO' or 'EQ' or 'TPP' or 'TPPI' or 'NTPPI':
            shapelyObject = tessellation_sets[(relatum,)].get_tile('boundary')
        elif lr_relations['relation'].upper() == 'DC' or 'EC' or 'PO' or 'TPPI' or 'NTPPI':
            shapelyObject = tessellation_sets[(relatum,)].get_tile('exterior')
        else:
            shapelyObject = tessellation_sets.values()

        coords = shapelyObject.exterior.coords[::-1]
        shapelyObject = Polygon(coords)
        computed_tiles = shapely.geometry.mapping(shapelyObject)  #

        geoJson_tiles = convert_tiles_into_geojson(computed_tiles, geo_data_properties)

    elif representation == "REL_DIST":
        geoJson_tiles_type = "REL_DIST"

        tessellation_sets = {}
        filter_params = {'filter_geoms': 6, 'filter_types': True, 'type_list': [relatum_feat_type, main_feat_type],
                         'filter_ids': False,
                         'id_list': [], 'filter_names': False, 'name_list': []}
        filter_params['filter_ids'] = False
        filter_params['id_list'].append(relatum)
        filter_params['filter_geoms'] = config.FILTER_ALL

        tessellation_sets = tessellation('REL_DIST', g_reldist_tiles, 1, data_geom, False, [main_feat_type],
                                         **filter_params)
        # print("here is tessellation_sets",tessellation_sets)
        tessellation_sets = tessellation_sets.get_tessellations()

        if lr_relations['relation'] == "near":
            shapelyObject = tessellation_sets[(relatum,)].get_tile('near')
        elif lr_relations['relation'] == "far":
            shapelyObject = tessellation_sets[(relatum,)].get_tile('far')
        elif lr_relations['relation'] == "vfar":
            shapelyObject = tessellation_sets[(relatum,)].get_tile('vfar')
        else:
            shapelyObject = tessellation_sets.values()

        computed_tiles = shapely.geometry.mapping(shapelyObject)  #
        geoJson_tiles = convert_tiles_into_geojson(computed_tiles, geo_data_properties)

    geoJson_tiles = json.dumps(geoJson_tiles)
    geoJson_tiles = json.loads(geoJson_tiles)

    try:
        outputFilePath = os.path.join(proj_type_dir_path, OUTPUT_DIR_PATH, APROX_TILE)
        #outputFilePath = os.path.join("./output", "geoJson_tiles.geojson")
        if os.path.exists(outputFilePath):
            os.remove(outputFilePath)
        f = open(outputFilePath, "w")
        f.write(json.dumps(geoJson_tiles, indent=4))
        f.close()

    except IOError:
        print("sketchMap.json path has problem ")

    return json.dumps({"geoJson_tiles": geoJson_tiles, "geoJson_tiles_type": geoJson_tiles_type})


@app.route("/get_approx_location_lr",methods = ["POST", "GET"])
def get_approx_location_lr():

    lr_relations = json.loads(request.args.get('clicked_relations'))

    print("that is i am here ", lr_relations)

    return ""


@app.route("/get_tenure_record",methods =["POST"])
def get_tenure_record():
    global OUTPUT_DIR_PATH
    global MATCHED_FEATURES
    global TENURE_RECORD_FILE
    matchedRecord=""
    try:
        feat_id = request.form.get('feat_id')
        feat_type = request.form.get('feat_type')
        proj_type_dir_path = path_to_project(request.form)

        matchesDictFile = os.path.join(proj_type_dir_path,OUTPUT_DIR_PATH,MATCHED_FEATURES)
        tenureRecoredFilePath = os.path.join(proj_type_dir_path,OUTPUT_DIR_PATH, TENURE_RECORD_FILE)

    except IOError:
        print("problem in reading matches file and tenure recored in the /get_tenure_record()..")

    matched_feat = ""

    #print(matchesDictFile)
    with open(matchesDictFile) as matches:
        matches = json.loads(matches.read())
        #print(matches)
        for key, value in matches.items():
            if key==feat_id:
                matched_obj = value
                if matched_obj !=None:
                    matched_feat= matched_obj
                else:
                    matched_feat="NONE"

    #print(matched_feat)
    #print(matched_feat)
    #tenureRecoredFilePath = os.path.join(OUTPUT_DIR_PATH,"tenureRecord.json")

    with open(tenureRecoredFilePath) as record_json:
        records = json.loads(record_json.read())
        for record in records:
            for feature in record["features"]:
                feature_ID = feature["feature_id"]
                if feature_ID == feat_id:
                    matchedRecord = record

        #print("empity recored",matchedRecord)
        if (matchedRecord !=""):
            record_no = matchedRecord["record_no"]
            spatial_source = matchedRecord["spatial_source"]
            for feature in matchedRecord["features"]:
                for relation in feature["relations"]:
                    ownership = relation["ownership"]
                    party = relation["party"]
                    rrrs = relation["rrrs"]

            return json.dumps([{"Record no.": record_no, "Spatial Source": spatial_source,
                               "Feature ID": feat_id, "Feature Type": feat_type,"Aligned Object":matched_feat,
                               "Party": party,"Right": ownership,  "Condition": rrrs}])
        else:
            return "None"


@app.route("/getMapMatches", methods=["POST"])
def getMapMatches():
    global OUTPUT_DIR_PATH
    global MATCHED_FEATURES
    global PROJ_DIR_PATH
    #matchedRecord = ""

    #print("request.form", request.form)
    proj_type_dir_path = path_to_project(request.form)

    #print("project path in the getMapMatches",proj_type_dir_path)
    #feat_id = request.args.get('feat_id')
    #feat_type = request.args.get('feat_type')
    #print("feat_id in tenurerecord:", feat_id)
    mm_feature_id = ""
    #print("output file path",OUTPUT_DIR_PATH)
    matchesFilePath = os.path.join(proj_type_dir_path, OUTPUT_DIR_PATH, MATCHED_FEATURES)
    #print("here matches file path",matchesFilePath)
    #matchesFilePath = os.path.join(OUTPUT_DIR_PATH,"matches.json")
    with open(matchesFilePath) as matches:
        matches = json.loads(matches.read())
    return  json.dumps(matches)


@app.route("/add_tenure_record", methods =["POST","GET"])
def add_tenure_record():
    newlist = []
    data_and_time = str(datetime.datetime.now())
    #print(data_and_time)
    spatialSource = request.args.get('spatialSource')
    feat_id = request.args.get('feat_id')
    feat_type = request.args.get('feat_type')
    ownership = request.args.get('ownership_type')
    party = request.args.get('party')
    rrrs = json.loads(request.args.get('rrrs_list'))

    print("feat_id:",feat_id)
    print("feat_type:",feat_type)
    print("ownership:",ownership)
    print("party",party)
    print("rrrs:",rrrs)


    record_json= generate_tuenure_record_json(spatialSource,data_and_time,feat_id,feat_type,ownership,party,rrrs)
    RecordList.append(record_json)
    return "Rights are recorded! "


@app.route("/save_tenure_record", methods =["POST"])
def save_tenure_record():
    global OUTPUT_DIR_PATH
    global TENURE_RECORD_FILE

    proj_type_dir_path = path_to_project(request.form)

    tenurefilepath = os.path.join(proj_type_dir_path,OUTPUT_DIR_PATH, TENURE_RECORD_FILE)
    #print("final tenure record path...", tenurefilepath)

    try:
        f = open(tenurefilepath, "w")
        f.write(json.dumps(RecordList, indent=4))
        #f.write(record_json)
        f.close()
    except IOError:
        print("tenureRecord.json path has problem ")
    #print(record_json)
    return "Records are saved as a JSON file"


@app.route("/postLADM",methods =["POST"])
def postLADM():
    global UPLOADED_DIR_PATH
    global LADM_FILE
    global PROJ_DIR_PATH
    proj_type_dir_path = path_to_project(request.form)
    #print("proj to path",proj_type_dir_path)
    fileName_full = str(request.form.get('LDMFileName'))
    owlContent = request.form.get('LDMContent')

    uploaded_filepath = os.path.join(proj_type_dir_path, UPLOADED_DIR_PATH, LADM_FILE)
    #uploaded_filepath = os.path.join(UPLOADED_DIR_PATH, fileName_full)
    try:
        if os.path.exists(uploaded_filepath):
            os.remove(uploaded_filepath)
        f = open(uploaded_filepath, "w")
        f.write(owlContent)
        f.close()

    except IOError:
        print("problem in Writing JSON file to the location...")

    return owlContent

@app.route("/get_domain_model_ownerships",methods =["POST"])
def get_domain_model():
    global UPLOADED_DIR_PATH
    global LADM_FILE
    try:
        fileName_full = request.form.get('LDMFileName')
        feat_type = request.form.get('feat_type')
        proj_type_dir_path = path_to_project(request.form)

        uploaded_filepath = os.path.join(proj_type_dir_path,UPLOADED_DIR_PATH, LADM_FILE)

        ontology = get_ontology(uploaded_filepath).load()
    except IOError:
        print("problem in Reading Owl file in the Function: /get_domain_model_ownerships...")

    if feat_type == "boma1":
        boma_ownerships = get_ownerships(ontology)
        #print(boma_ownerships)
        return json.dumps(boma_ownerships)

    elif feat_type== "olopololi1":
        olopololi_ownerships = get_olopololi_ownerships(ontology)
        #print(olopololi_ownerships)
        return json.dumps(olopololi_ownerships)

    else:
        ownerships = get_ownerships(ontology)
        # print(boma_ownerships)
        return json.dumps(ownerships)

    return "Please select the drawn object!"


@app.route("/get_domain_model_rrrs",methods =["POST"])
def get_domain_model_rrrs():
    global UPLOADED_DIR_PATH
    global LADM_FILE

    try:
        fileName_full = request.form.get('LDMFileName')
        proj_type_dir_path = path_to_project(request.form)
        #print("project path:",proj_type_dir_path)
        uploaded_filepath = os.path.join(proj_type_dir_path,UPLOADED_DIR_PATH, LADM_FILE)
        #uploaded_filepath = os.path.join(UPLOADED_DIR_PATH, fileName_full)
        ontology = get_ontology(uploaded_filepath).load()

        rrrs = get_has_rrr(ontology)
    except IOError:
        print("problem in Reading Owl file in the Function: /get_domain_model_rrrs...")

    return json.dumps(rrrs)


"""
initialize database 
    - it will delete all the previous records and 
    - create new main structure for neo4j
"""

"""
@app.route("/initializeDatabase", methods =["POST","GET"])
def initializeDatabase():
    deleted = dbInitilizer.deleteAllRecords()
    msg = dbInitilizer.createGraphStructure()
    return msg
"""

"""
    - resize image to load in the imageholder 
"""
@app.route("/uploadSketchMap", methods=["POST", "GET"])
def uploadSketchMap():
    global MODIF_DIR_PATH
    global UPLOADED_DIR_PATH
    global INPUT_RASTER_SKETCH
    global REDUCED_RASTER_SKETCH

    project_files_path = path_to_project(request.form)

    imageFileName = request.form.get('fileName')
    imageContent = request.form.get('imageContent')
    imageContent = imageContent.replace("data:image/png;base64,", "")
    imageContent = imageContent.encode('utf-8')

    upload_filepath = os.path.join(project_files_path, UPLOADED_DIR_PATH, INPUT_RASTER_SKETCH)
    modified_filepath = os.path.join(project_files_path, MODIF_DIR_PATH, REDUCED_RASTER_SKETCH)

    try:
        if os.path.exists(upload_filepath):
            os.remove(upload_filepath)
        f = open(upload_filepath, "wb")
        f.write(base64.decodebytes(imageContent))
        f.close()

        w = 800

        img = cv2.imread(upload_filepath, -1)
        height, width, depth = img.shape

        imgScale = w/width

        newX, newY = img.shape[1] * imgScale, img.shape[0] * imgScale

        resized_image = cv2.resize(img, (int(newX), int(newY)))
        img_path = Path(modified_filepath)
        cv2.imwrite(modified_filepath, resized_image)

        """ comment out if using full alignment in debug mode """
        if app.debug:
            """ copy folder with fileName to currentUserSession/projectType"""
            print("here is file name",imageFileName)
            preRunFiles = os.path.join("preRunSessions", imageFileName)
            #dst =
            try:
                shutil.rmtree(project_files_path, ignore_errors=False, onerror=None)
                shutil.copytree(preRunFiles, project_files_path)
            # Directories are the same
            except shutil.Error as e:
                print('Directory not copied. Error: %s' % e)
            # Any error saying that the directory doesn't exist
            except OSError as e:
                print('Directory not copied. Error: %s' % e)

        return json.dumps({"imgPath": img_path.as_posix(), "imgHeight": newY, "imgWidth": newX})

    except IOError:
        print(IOError)
        return json.dumps({"error": IOError})


"""
    - resize base map if necessary 
    - and create geojson file in the uploaded and modified DIRs. 
"""
@app.route("/uploadBaseMap", methods=["POST"])
def uploadBaseMap():

    global MODIF_DIR_PATH
    global UPLOADED_DIR_PATH
    global VECTOR_BASEMAP

    project_files_path = path_to_project(request.form)
    upload_filepath = os.path.join(project_files_path, UPLOADED_DIR_PATH, VECTOR_BASEMAP)
    modified_filepath = os.path.join(project_files_path, MODIF_DIR_PATH, VECTOR_BASEMAP)

    json_content = request.form.get('mapContent')
    json_content = json.loads(json_content)
    try:
        if os.path.exists(upload_filepath):
            os.remove(upload_filepath)
        f = open(upload_filepath, "w")
        f.write(json.dumps(json_content, indent=4))
        f.close()

        if os.path.exists(modified_filepath):
            os.remove(modified_filepath)
        f = open(modified_filepath, "w")
        f.write(json.dumps(json_content, indent=4))
        f.close()

    except IOError:
        return json.dumps({"error": IOError})

    return ""


"""
    - process sketch map
    - Christian Code under here 
"""
@app.route("/processSketchMap", methods=["GET"])
def processSketchMap():
    global UPLOADED_DIR_PATH
    global OUTPUT_DIR_PATH
    global INPUT_RASTER_SKETCH
    global VECTORIZED_SKETCH

    project_files_path = path_to_project(request.args)
    uploaded_filepath = os.path.join(project_files_path, UPLOADED_DIR_PATH, INPUT_RASTER_SKETCH)
    svg_filepath = os.path.join(project_files_path, OUTPUT_DIR_PATH, VECTORIZED_SKETCH)
    modified_filepath = os.path.join(project_files_path, MODIF_DIR_PATH, VECTORIZED_SKETCH)


    """ comment out if using full alignment in debug mode """
    if app.debug:
        svg = svgutils.transform.fromfile(modified_filepath)
        return json.dumps({'svgPath': Path(modified_filepath).as_posix(), 'svgHeight': int(svg.height), 'svgWidth': int(svg.width)})

    try:
        """ load image from uploaded folder"""
        img2 = cv2.imread(uploaded_filepath)
        """Save the recognized objects as svg in the output and modified folders"""
        classified_strokes = cc.completeClassification(img2, svg_filepath)
        svgstring = cc.strokesToSVG(classified_strokes,"abc", img2, svg_filepath)

        """ write the SVG to modified_filepath as well """
        svg = svgutils.transform.fromstring(svgstring)
        svg.save(modified_filepath)
        # originalSVG = svgutils.compose.SVG(svg_file_path)
        # originalSVG.move(0, 0)

        h = int(svg.height)
        w = int(svg.width)

        # scaleFact = 800/w
        # print (scaleFact)
        # scaledSVG = originalSVG.scale(scaleFact)
        # newY = float(scaleFact*float(svg.height))
        # newX = float(scaleFact*float(svg.width))
        # figure = svgutils.compose.Figure(newY, newX, originalSVG)

        #newY = 6586
        #newX = 10023
        """- - -"""
        #newY = 800
        #newX = 565.94

        return json.dumps({'svgPath': Path(modified_filepath).as_posix(), 'svgHeight': h, 'svgWidth': w})

    except IOError as ioe:
        print("problem in Reading original Image from loaded DIR function: /processSketchMap..\n", ioe)
        return json.dumps({"error": ioe.__dict__})


"""
    - return alignment results 
"""
@app.route("/align_plain", methods =["POST"])
def align_plain_sketch_map():

    global OUTPUT_DIR_PATH
    global MODIF_DIR_PATH
    global VECTORIZED_SKETCH
    global VECTOR_BASEMAP
    global MATCHED_FEATURES
    global SKETCH_MAP_QCN
    global BASEMAP_QCN

    project_files_path = path_to_project(request.form)
    matches_file_path = os.path.join(project_files_path, OUTPUT_DIR_PATH, MATCHED_FEATURES)
    print(matches_file_path)
    """ comment out if using full alignment in debug mode """
    if app.debug:
        return debug_align_plain_sketch(matches_file_path)

    svg_file_path = os.path.join(project_files_path, MODIF_DIR_PATH, VECTORIZED_SKETCH)
    geojson_file_path = os.path.join(project_files_path, MODIF_DIR_PATH, VECTOR_BASEMAP)
    qualified_sketch_map_file_path = os.path.join(project_files_path, OUTPUT_DIR_PATH, SKETCH_MAP_QCN)
    qualified_metric_map_file_path = os.path.join(project_files_path, OUTPUT_DIR_PATH, BASEMAP_QCN)
    print ("here i am ")
    sketchid = "_".join(("sketch", request.form.get("sessID"), request.form.get("projectType")))
    metricid = "_".join(("metric", request.form.get("sessID"), request.form.get("projectType")))
    loadedSketch, loadedMetric = None, None

    try:
        loadedSketch = str(request.form.get('svgData'))
        print(loadedSketch)
    except KeyError:
        pass

    try:
        loadedMetric = str(request.form.get('geojsonData'))
        print(loadedMetric)
    except KeyError:
        pass

    print(loadedMetric, "\n\n", loadedSketch)

    qualified_sketch_map = 0  # load qualitative representation here
    qualified_metric_map = 0  # load qualitative representation here

    # write incoming map data to modified
    try:
        if (loadedSketch is not None):
            if os.path.exists(svg_file_path):
                os.remove(svg_file_path)
            with io.open(svg_file_path, 'r+', encoding='utf8') as file:
                file.write(loadedSketch)
                file.close()

            qualified_sketch_map = load_map_qualify(sketchid, read_map_data_from_string(loadedSketch,
                                                                            "svg"), "svg", "sketch_map")
        else:
            qualified_sketch_map = load_map_qualify(sketchid, read_map_data_from_path(svg_file_path,
                                                                            "svg"), "svg", "sketch_map")
        print("SM_QCN...:", qualified_sketch_map)
        if os.path.exists(qualified_sketch_map_file_path):
            os.remove(qualified_sketch_map_file_path)
        with io.open(qualified_sketch_map_file_path, 'w', encoding='utf8') as file:
            file.write(json.dumps(qualified_sketch_map, indent=4))
            file.close()

        if (loadedMetric is not None):
            if os.path.exists(geojson_file_path):
                os.remove(geojson_file_path)
            with io.open(geojson_file_path, 'w', encoding='utf8') as file:
                file.write(loadedMetric)
                file.close()

            qualified_metric_map = load_map_qualify(metricid, read_map_data_from_string(loadedMetric,
                                                                            "geojson"), "geojson", "metric_map")

        else:
            qualified_metric_map = load_map_qualify(metricid, read_map_data_from_path(geojson_file_path,
                                                                            "geojson"), "geojson", "metric_map")
        print("MM_QCN...:", qualified_metric_map)
        if os.path.exists(qualified_metric_map_file_path):
            os.remove(qualified_metric_map_file_path)
        with io.open(qualified_metric_map_file_path, 'w', encoding='utf8') as file:
            file.write(json.dumps(qualified_metric_map, indent=4))
            file.close()

        similarity_matrix, sketch_map_size = compute_similarity_matrix(
            qualified_sketch_map,
            qualified_metric_map
        )

        # matcher = SpecMatch(sketch_map_size, similarity_matrix)
        matcher = SpecCenScore(similarity_matrix, sketch_map_size)

        matchdict = {}  # dictionary with SM_ssm_id : MM_ssm_id

        for l in range(matcher.slist.shape[0]):
            matchdict[qualified_sketch_map['features'][matcher.slist[l]]['ssm_id']] = \
                qualified_metric_map['features'][matcher.mlist[l]]['ssm_id']
            print(qualified_sketch_map['features'][matcher.slist[l]]['ssm_id'], "(",
                  qualified_sketch_map['features'][matcher.slist[l]]['feat_type'], ")...matches with...",
                  qualified_metric_map['features'][matcher.mlist[l]]['ssm_id'], "(",
                  qualified_metric_map['features'][matcher.mlist[l]]['feat_type'], ")"
                  )

        if os.path.exists(matches_file_path):
            os.remove(matches_file_path)

        with io.open(matches_file_path, 'w', encoding='utf8') as file:
            file.write(json.dumps(matchdict, indent=4))
            file.close()

        return json.dumps(matchdict)

    except IOError as ioe:
        print("Problem in writing svg contents in Modified Folder =>\n", ioe)
    except Exception as e:
        print(e)
        return json.dumps({"error": e})

def debug_align_plain_sketch(matches_file_path):

    with io.open(matches_file_path, 'r+') as matches_file:
        matches = json.loads(matches_file.read())

    return json.dumps(matches)


"""
    - return Align Ortho Drawing on top of Ortho Image 
"""
@app.route("/align_ortho", methods =["POST", "GET"])
def align_orthophoto_sketch_map():
    global UPLOADED_DIR_PATH
    global MODIF_DIR_PATH
    global OUTPUT_DIR_PATH
    global UPLOADED_DIR_PATH
    global VECTORIZED_SKETCH
    global VECTOR_BASEMAP

    project_files_path = path_to_project(request.form)
    svg_file_path = os.path.join(project_files_path, MODIF_DIR_PATH, VECTORIZED_SKETCH)
    gcp_file_name = os.path.join(project_files_path, UPLOADED_DIR_PATH, VECTOR_BASEMAP)
    output_file_path = os.path.join(project_files_path, OUTPUT_DIR_PATH, GEOREFERENCED_SKETCH_FEATURES)

    svg_content = request.form.get('svgData')
    print("SVG content:\n", svg_content)

    try:
        with io.open(svg_file_path, 'w', encoding='utf8') as file:
            file.write(svg_content)
            file.close()

    except IOError:
        print("Problem in writing svg contents in Modified Folder")

    geo_data_properties, geo_data, svg_data_properties, svg_data = "", "", "", ""
    try:
        # with io.open(svgModifiedFilePath, 'r+') as file:
        #     svgFile = file.read()
        #     print("svgContents:",svgFile)
        #
        # with io.open(loaded_GCP_File_name, 'r+') as file:
        #     loaded_GCP_File = json.loads(file.read())
        #     print("GCPs:",loaded_GCP_File)
        geo_data_properties, geo_data = load_geo(read_map_data_from_path(gcp_file_name, "geojson"), "geojson")
        svg_data_properties, svg_data = load_svg(read_map_data_from_path(svg_file_path, "svg"), "svg")

    except IOError:
        print("problem in reading svg and GCPs for the Alignment")
        print("svg_file_path", svg_file_path)
        print("gcp_file_name", gcp_file_name)
        print("svg_data_properties", svg_data_properties)
        print("svg_data", svg_data)

    #geo_data_properties, geo_data = load_geo(loaded_GCP_File, "geojson")
    #svg_data_properties, svg_data = load_svg(svgFile, "svg")

    # pair up the gcps
    svg_gcps = [d for d in svg_data if d['attributes']['feat_type'] == 'gcp']
    geo_gcps = [d for d in geo_data if d['attributes']['feat_type'] == 'gcp']
    # svg_feature_data = svg_data  # [d for d in svg_data if d['attributes']['feat_type']]

    for d in svg_data:
        if d['attributes']['feat_type'] == 'gcp':
            d['geometry'] = d['geometry'].centroid
        del d['attributes']['hidden']

    # svg_geoms = [(d['attributes']['name'], d['geometry'].wkt) for d in svg_gcps]
    point_pairs = [(s['geometry'].centroid, g['geometry']) for s in svg_gcps for g in geo_gcps if
                   s['attributes']['name'] == g['attributes']['label']]

    x_coordinate_data_input = np.array([ps.coords[:][0] for (ps, pg) in point_pairs])
    y_coordinate_data_input = np.array([pg.coords[:][0] for (ps, pg) in point_pairs])

    if len(svg_gcps) < 6:
        reg = linear_regression()
        reg.fit(x_coordinate_data_input, y_coordinate_data_input)
    else:
        poly = polynomial_features(degree=2)
        qx_coordinate_data_input = poly.fit_transform(x_coordinate_data_input)
        reg = linear_regression()
        reg.fit(qx_coordinate_data_input, y_coordinate_data_input)

    georeferenced_features = []

    for feature in svg_data:
        if feature['geometry'].geom_type.lower() == "polygon":
            raw_input = feature['geometry'].exterior.coords[:]
        else:
            raw_input = feature['geometry'].coords[:]

        raw_input = raw_input if len(svg_gcps) < 6 else poly.fit_transform(raw_input)

        transformed_coordinates = reg.predict(raw_input).tolist()

        if feature['geometry'].geom_type.lower() == "polygon":
            transformed_coordinates = [transformed_coordinates]
        if feature['geometry'].geom_type.lower() == "linestring":
            transformed_coordinates = transformed_coordinates
        if feature['geometry'].geom_type.lower() == "point":
            transformed_coordinates = transformed_coordinates[0]

        georeferenced_feature = {"type": "Feature",
                                 "properties": feature['attributes'],
                                 "geometry": {"type": feature['geometry'].geom_type,
                                            "coordinates": transformed_coordinates}}
        georeferenced_features.append(georeferenced_feature)

    geojson_output = geo_data_properties.copy()
    print("geo_data_properties\n", geo_data_properties)
    geojson_output["features"] = georeferenced_features

    print("geojson_output\n", geojson_output)
    print()
    try:
        if os.path.exists(output_file_path):
             os.remove(output_file_path)
        f = open(output_file_path, "w")
        f.write(json.dumps(geojson_output, indent=4))
        f.close()
    except IOError:
         print("Problem in Writing matching result as output.json")

    return json.dumps(geojson_output)


if __name__ == '__main__':
    app.run(debug=True)
