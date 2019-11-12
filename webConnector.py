# -*- coding: utf-8 -*-
"""
Created on Mon Apr 30 15:51:54 2018

@author: s_jan001
"""
import shutil

from flask import Flask, render_template, request, redirect, url_for
from matcher.matching_preprocessor import compute_similarity_matrix
from matcher.test_eigen2 import SpecCenScore
from matcher.map_loader import load_map_qualify, read_map_data_from_path, read_map_data_from_string
from matcher.geojson import load_map as load_geo
from matcher.svg import load_map as load_svg
from sklearn.linear_model import LinearRegression as linear_regression
from sklearn.preprocessing import PolynomialFeatures as polynomial_features
import cv2
import numpy as np
from settings import USER_SESSIONS_DIR,PROJ_TYPE,PnS_PROJ_Mode, PROJ_TYPE_SUB_PROJ_NAME,\
    RecordList,SPATIALSOURCE_SKETCH_UID,SPATIALSOURCE_BASE_UID, PnS_PROJ_ID, \
    SMARTSKEMA_PATH, QUALITATIVE_REPRESENTATION,SUB_PROJ_NAME
from pathlib import Path
from sketchProcessor.helperLibraries.utils import contour_classification as cc
import svgutils
from domainModel.owlProcessor import *
import datetime
from domainModel.spatialQueries import *
import mimetypes
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
from platform_PnS.platform_PnS import*


"""
create flask web app instance 
"""
mimetypes.add_type('image/svg+xml', '.svg')

DEBUG_SESSID = "39bb2657-d663-4a78-99c5-a66c152693b2"

UPLOADED_DIR_PATH = "uploaded"
MODIF_DIR_PATH = "modified"
OUTPUT_DIR_PATH = "output"

INPUT_RASTER_SKETCH = "input_sketch_image.png"
REDUCED_RASTER_SKETCH = "input_sketch_image.png"
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

INPUT_RASTER_COMPLEX_SKETCH = "input_complex_sketch_image.png"
REDUCED_RASTER_COMPLEX_SKETCH = "reduced_complex_sketch_image.png"
ALIGNED_RESULT = "alignedResult.json"


app = Flask(__name__)



"""
This belongs to the utils modules but is here for quickly constructing directory/file paths from path lists
"""
def build_path(path_list):
    return os.path.join(*path_list)


def path_to_project(d):

    global USER_SESSIONS_DIR
    global PnS_PROJ_ID
    global PROJ_TYPE
    global SUB_PROJ_NAME
    global PROJ_TYPE_SUB_PROJ_NAME
    global PnS_PROJ_Mode

    PnS_PROJ_ID =  d.get("sessID")
    PROJ_TYPE = d.get("projectType")
    print("PnS_PROJ_Mode",PnS_PROJ_Mode)
    if PnS_PROJ_Mode == True:

        PnS_PROJ_ID = os.getenv("I4L_PROJECTUID")
        if PnS_PROJ_ID == None:
            PnS_PROJ_ID = "4da0d7ad-952d-4308-a7f4-7ff1dc8672d4"
        temp = PROJ_TYPE_SUB_PROJ_NAME.split(":")
        PROJ_TYPE = ":".join(temp[:1])
        SUB_PROJ_NAME = ":".join(temp[1:])
        print("i am comming PnS_Proj_MODE", os.path.join(USER_SESSIONS_DIR, PnS_PROJ_ID, PROJ_TYPE, SUB_PROJ_NAME))
        return os.path.join(USER_SESSIONS_DIR, PnS_PROJ_ID, PROJ_TYPE, SUB_PROJ_NAME)
    else:
        print("i am in SmartSkeMa Proj_Mode",os.path.join(USER_SESSIONS_DIR, PnS_PROJ_ID, PROJ_TYPE))
        return os.path.join(USER_SESSIONS_DIR, PnS_PROJ_ID, PROJ_TYPE)



@app.route("/")
def main_page():
    return render_template("smartSkeMa.html", page="active")


@app.route("/getSessionID", methods=["GET"])
def get_session_id():
    global USER_SESSIONS_DIR
    global PnS_PROJ_ID

    """ comment out if using full alignment in debug mode """
    #if app.debug:
        # print("using predefined session ID!")
     #   return debug_get_session_id()

    #sess_id = str(uuid.uuid4())
    PnS_PROJ_ID = os.getenv("I4L_PROJECTUID")
    if PnS_PROJ_ID == None:
        PnS_PROJ_ID = "4da0d7ad-952d-4308-a7f4-7ff1dc8672d4"

    if PnS_PROJ_ID is None:
        raise PnSError ("Problem in Getting envirn_variable value as sess_id")

    """getting session id from PnS platform to create folder"""
    #sess_id = str(get_PnS_Project_ID())

    if PnS_PROJ_ID != None:

        proj_dir_path = os.path.join(USER_SESSIONS_DIR, PnS_PROJ_ID)

    try:
        if not (os.path.exists(proj_dir_path)):
            os.mkdir(proj_dir_path)

    except IOError:
        print("problem in createing session..")

    # print(url_for('.smartSkeMa'))
    #print("generated session ID - now returning!")
    return PnS_PROJ_ID  # redirect("dashboard.html", sessId=sess_id)


def debug_get_session_id():
    return DEBUG_SESSID


@app.route("/setProjectType", methods=["POST"])
def setProjectType():
    global UPLOADED_DIR_PATH
    global MODIF_DIR_PATH
    global OUTPUT_DIR_PATH
    global PnS_PROJ_Mode

    PnS_PROJ_Mode = False

    try:
        #print("request.form",request.form)
        proj_type_dir_path = path_to_project(request.form)
        print("here you go:proj_type_dir_path",proj_type_dir_path)

        if not (os.path.exists(proj_type_dir_path)):

            os.mkdir(proj_type_dir_path)
            os.mkdir(os.path.join(proj_type_dir_path, UPLOADED_DIR_PATH))
            os.mkdir(os.path.join(proj_type_dir_path, MODIF_DIR_PATH))
            os.mkdir(os.path.join(proj_type_dir_path, OUTPUT_DIR_PATH))
            #os.mkdir(os.path.join(proj_type_dir_path, SVG_DIR_PATH))

    except IOError:
            print("problem in creating PROJ_DIR and Sub_DIRs for P and S..")
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


@app.route("/postParty", methods =["POST"])
def postParty():
    global UPLOADED_DIR_PATH
    global PARTIES_FILE
    proj_type_dir_path = path_to_project(request.form)

    fileName_full = request.form.get('loadedPartyFile')
    partyJson = json.loads(request.form.get('partyJson'))

    party = partyJson.get("parties")
    try:
        uploaded_filepath = os.path.join(proj_type_dir_path, UPLOADED_DIR_PATH, PARTIES_FILE)
        if os.path.exists(uploaded_filepath):
            os.remove(uploaded_filepath)
        f = open(uploaded_filepath, "w")
        f.write(json.dumps(partyJson, indent=4))
        f.close()

    except IOError:
        print("problem in Writing JSON file to the location...")

    return json.dumps(party)


@app.route("/getParty", methods =["POST"])
def getParty():
    proj_type_dir_path = path_to_project(request.form)

    uploaded_party_file = os.path.join(proj_type_dir_path, UPLOADED_DIR_PATH, PARTIES_FILE)
    with open(uploaded_party_file) as partyFile:
        partyJson = json.loads(partyFile.read())
        party = partyJson.get("parties")
    return json.dumps(party)

@app.route("/qualitative_spatial_queries", methods=["POST"])
def qualitative_spatial_queries():
    global OUTPUT_DIR_PATH
    global SKETCH_MAP_QCN
    global QUALITATIVE_REPRESENTATION
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

    with open(QUALITATIVE_REPRESENTATION) as qr_file:
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


        #print(selected_feat_lr_rel,selected_feat_rcc8_rel,selected_feat_relDist_rel)


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
        #print("here basemap json",mm_json_FilePath)
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
    #print(geo_data_properties,data_geom)
    relatum_feat_type = get_relatum_feat_type(relatum, data_geom)

    print("relatum_feat_type", relatum_feat_type)
    try:
        geoJson_tiles_type = ""
        if representation == "left_right":
            try:
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
            except IOError:
                print("Problem in Computing Approxmate tiles for leftRight")
        elif representation == "RCC8":
            try:
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
            except IOError:
                print("Problem in Computing Approxmate tiles for RCC8")
        elif representation == "REL_DIST":
            try:
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
            except IOError:
                print("Problem in Computing Approxmate tiles for reldist")
        geoJson_tiles = json.dumps(geoJson_tiles)
        geoJson_tiles = json.loads(geoJson_tiles)

    except IOError:
        print("Problem in Computing Approxmate tiles ")

    try:
        outputFilePath = os.path.join(proj_type_dir_path, OUTPUT_DIR_PATH, APROX_TILE)
        #outputFilePath = os.path.join("./output", "geoJson_tiles.geojson")
        if os.path.exists(outputFilePath):
            os.remove(outputFilePath)
        f = open(outputFilePath, "w")
        f.write(json.dumps(geoJson_tiles, indent=4))
        f.close()
    except IOError:
        print("Problem in Writing tiles ")

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
        #print(proj_type_dir_path)
        matchesDictFile = os.path.join(proj_type_dir_path,OUTPUT_DIR_PATH,MATCHED_FEATURES)
        tenureRecoredFilePath = os.path.join(proj_type_dir_path,OUTPUT_DIR_PATH, TENURE_RECORD_FILE)
        matched_feat = ""
        if os.path.exists(matchesDictFile):
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
        if os.path.exists(tenureRecoredFilePath):
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
                       return "Tenure record not found"
        else:
            return "Tenure record not found"
    except IOError:
        print("Problem in Tenure record file @get_tenure_record()")


@app.route("/getMapMatches", methods=["POST"])
def getMapMatches():
    global OUTPUT_DIR_PATH
    global MATCHED_FEATURES
    proj_type_dir_path = path_to_project(request.form)
    print("proj_type_dir_path",proj_type_dir_path)
    try:
        matchesFilePath = os.path.join(proj_type_dir_path, OUTPUT_DIR_PATH, MATCHED_FEATURES)
        with open(matchesFilePath) as matches:
            matches = json.loads(matches.read())
            return json.dumps(matches)
    except IOError:
        return(json.dumps("none"))



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

    #print("feat_id:",feat_id)
    #print("feat_type:",feat_type)
    #print("ownership:",ownership)
    #print("party",party)
    #print("rrrs:",rrrs)


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
        #print(rrrs)
    except IOError:
        print("problem in Reading Owl file in the Function: /get_domain_model_rrrs...")

    return json.dumps(rrrs)



"""
    - resize image to load in the imageholder 
"""
@app.route("/uploadComplexSketchMap", methods=["POST", "GET"])
def uploadComplexSketchMap():
    global MODIF_DIR_PATH
    global UPLOADED_DIR_PATH
    global INPUT_RASTER_COMPLEX_SKETCH
    global REDUCED_RASTER_COMPLEX_SKETCH
    global SMARTSKEMA_PATH

    project_files_path = path_to_project(request.form)

    imageFileName = request.form.get('fileName')
    imageContent = request.form.get('imageContent')
    imageContent = imageContent.replace("data:image/png;base64,", "")
    imageContent = imageContent.encode('utf-8')

    upload_filepath = os.path.join(project_files_path, UPLOADED_DIR_PATH, INPUT_RASTER_COMPLEX_SKETCH)
    modified_filepath = os.path.join(project_files_path, MODIF_DIR_PATH, REDUCED_RASTER_COMPLEX_SKETCH)

    try:
        if os.path.exists(upload_filepath):
            os.remove(upload_filepath)

        os.makedirs(os.path.dirname(upload_filepath), exist_ok=True)
        with open(upload_filepath, "wb") as f:
            f.write(base64.decodebytes(imageContent))
            f.close()

        w = 800

        img = cv2.imread(upload_filepath, -1)
        if img is not None:
            height, width, depth = img.shape
            imgScale = w/width

            newX, newY = img.shape[1] * imgScale, img.shape[0] * imgScale

            resized_image = cv2.resize(img, (int(newX), int(newY)))
            cv2.imwrite(modified_filepath, resized_image)
        else:
            newX    =   500
            newY    =   500
            #img_path = Path(modified_filepath)
            with open(modified_filepath, "wb") as f:
                f.write(base64.decodebytes(imageContent))

        modified_filepath_relative = os.path.relpath(modified_filepath, SMARTSKEMA_PATH)
        img_path = Path(modified_filepath_relative)
        #img_path = Path(upload_filepath)

        return json.dumps({"imgPath": img_path.as_posix(), "imgHeight": newY, "imgWidth": newX})

    except IOError:
        print("couldn't write data\n", IOError)
        return json.dumps({"error": IOError.__module__})
"""
    - resize image to load in the imageholder 
"""
@app.route("/uploadSketchMap", methods=["POST", "GET"])
def uploadSketchMap():
    global MODIF_DIR_PATH
    global UPLOADED_DIR_PATH
    global INPUT_RASTER_SKETCH
    global REDUCED_RASTER_SKETCH
    global SMARTSKEMA_PATH

    project_files_path = path_to_project(request.form)
    print("Sketch Map is Resizing and Loading....")
    imageFileName = request.form.get('fileName')
    imageContent = request.form.get('imageContent')
    imageContent = imageContent.replace("data:image/png;base64,", "")
    imageContent = imageContent.encode('utf-8')
    #print("here image contants",imageContent)
    upload_filepath = os.path.join(project_files_path, UPLOADED_DIR_PATH, INPUT_RASTER_SKETCH)
    modified_filepath = os.path.join(project_files_path, MODIF_DIR_PATH, REDUCED_RASTER_SKETCH)

    try:

        #comment out if using full alignment in debug mode
        """
        if app.debug:
            
          
             #copy folder with fileName to currentUserSession/projectType
            preRunFiles = os.path.join("preRunSessions", imageFileName)
            try:
                #print("copying from preRun", project_files_path)
                shutil.rmtree(project_files_path, ignore_errors=False, onerror=None)
                shutil.copytree(preRunFiles, project_files_path)
            # Directories are the same
            except shutil.Error as e:
                print('Directory not copied. Error: %s' % e)
            # Any error saying that the directory doesn't exist
            except OSError as e:
                print('Directory not copied. Error: %s' % e)
                """
        #else:
        if os.path.exists(upload_filepath):
            os.remove(upload_filepath)

            # f = open(upload_filepath, "wb")
            # f.write(base64.decodebytes(imageContent))
            # f.close()

        os.makedirs(os.path.dirname(upload_filepath), exist_ok=True)
        with open(upload_filepath, "wb") as f:
            f.write(base64.decodebytes(imageContent))
            f.close()

        w = 800

        img = cv2.imread(upload_filepath, -1)
        if img is not None:
            height, width, depth = img.shape
            imgScale = w/width

            newX, newY = img.shape[1] * imgScale, img.shape[0] * imgScale

            resized_image = cv2.resize(img, (int(newX), int(newY)))
            #make path relativ
            #img_path = Path(modified_filepath)
            cv2.imwrite(modified_filepath, resized_image)
        else:
            newX    =   800
            newY    =   565.686
            #img_path = Path(modified_filepath)
            with open(modified_filepath, "wb") as f:
                f.write(base64.decodebytes(imageContent))

        """
            - docker container requires relative path for front end
            - SketchMap_path gives rel path
            - get relative and pass to front end 
        """
        modified_filepath_relative = os.path.relpath(modified_filepath, SMARTSKEMA_PATH)
        img_path = Path(modified_filepath_relative)
        return json.dumps({"imgPath": img_path.as_posix(), "imgHeight": newY, "imgWidth": newX})

    except IOError:
        print("couldn't write data\n", IOError)
        return json.dumps({"error": IOError.__module__})


"""
    - resize base map if necessary 
    - and create geojson file in the uploaded and modified DIRs. 
"""
@app.route("/uploadBaseMap", methods=["POST"])
def uploadBaseMap():

    global MODIF_DIR_PATH
    global UPLOADED_DIR_PATH
    global VECTOR_BASEMAP
    global USER_SESSIONS_DIR

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
    - download baseMap geometries from PnS platform 
"""

@app.route("/download_MetricMap_from_pnS",methods = ["POST"])
def download_MetricMap_from_pnS():
    global MODIF_DIR_PATH
    global UPLOADED_DIR_PATH
    global VECTOR_BASEMAP

    project_files_path = path_to_project(request.form)
    upload_filepath = os.path.join(project_files_path, UPLOADED_DIR_PATH, VECTOR_BASEMAP)
    modified_filepath = os.path.join(project_files_path, MODIF_DIR_PATH, VECTOR_BASEMAP)

    boundingBox = "35,-1,37,-1,37,-3,35,-3,35,-1"

    baseMap_json_content = get_metric_map_features(boundingBox)
    if baseMap_json_content is not None:
        try:
             if os.path.exists(upload_filepath):
                 os.remove(upload_filepath)
             f = open(upload_filepath, "w")
             f.write(json.dumps(baseMap_json_content, indent=4))
             f.close()

             if os.path.exists(modified_filepath):
                 os.remove(modified_filepath)
             f = open(modified_filepath, "w")
             f.write(json.dumps(baseMap_json_content, indent=4))
             f.close()

        except IOError:
             return json.dumps({"error": IOError})

        modified_filepath_relative = os.path.relpath(modified_filepath, SMARTSKEMA_PATH)
        baseMap_path = Path(modified_filepath_relative)
        return json.dumps({"baseMapPath":baseMap_path.as_posix(),"baseMapContents": baseMap_json_content})
    else:
        return json.dumps({"error": IOError})


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
    global SMARTSKEMA_PATH
    global PROJ_TYPE
    global USER_SESSIONS_DIR

    project_files_path = path_to_project(request.args)
    uploaded_filepath = os.path.join(project_files_path, UPLOADED_DIR_PATH, INPUT_RASTER_SKETCH)
    output_file_path = os.path.join(project_files_path, OUTPUT_DIR_PATH, VECTORIZED_SKETCH)
    modified_filepath = os.path.join(project_files_path, MODIF_DIR_PATH, VECTORIZED_SKETCH)


    #comment out if using full alignment in debug mode

    if app.debug:
        if PROJ_TYPE =="plainSketchProject":
            shutil.copyfile(os.path.join("preRunSessions","Mailua_Ranch_Map01.png","output",VECTORIZED_SKETCH),output_file_path)
            shutil.copyfile(os.path.join("preRunSessions", "Mailua_Ranch_Map01.png", "output", VECTORIZED_SKETCH),
                            modified_filepath)
            svg = svgutils.transform.fromfile(modified_filepath)
            modified_filepath_relative = os.path.relpath(modified_filepath, SMARTSKEMA_PATH)
            return json.dumps({'svgPath': Path(modified_filepath_relative).as_posix(), 'svgHeight': float(svg.height), 'svgWidth': float(svg.width)})
        if PROJ_TYPE == "orthoSketchProject":
            shutil.copyfile (os.path.join(USER_SESSIONS_DIR,VECTORIZED_SKETCH),output_file_path)
            shutil.copyfile(os.path.join(USER_SESSIONS_DIR, VECTORIZED_SKETCH), modified_filepath)
            modified_filepath_relative = os.path.relpath(modified_filepath, SMARTSKEMA_PATH)
            return json.dumps({'svgPath': Path(modified_filepath_relative).as_posix(), 'svgHeight': "",
                               'svgWidth': ""})

    #else:
    try:
        """ load image from uploaded folder"""
        img2 = cv2.imread(uploaded_filepath)

        """Save the recognized objects as svg in the output and modified folders"""
        print("Object Detection STARTED...")
        classified_strokes = cc.completeClassification(img2, output_file_path)
        svgstring = cc.strokesToSVG(classified_strokes,"abc", img2, output_file_path)
        #print("svgString...:",svgstring)
        print("Object Detection END")
        svg = svgutils.transform.fromstring(svgstring)
        """ write the SVG to modified_filepath  as well as in the output_file_path """
        svg.save(modified_filepath)

        svg.save(output_file_path)
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
        #print("h and w of svg..:",h,w)
        #newY = 6586
        #newX = 10023
        # modifiy the path to relative path for front-end
        modified_filepath_relative = os.path.relpath(modified_filepath, SMARTSKEMA_PATH)

        return json.dumps({'svgPath': Path(modified_filepath_relative).as_posix(), 'svgHeight': h, 'svgWidth': w})

    except IOError as ioe:
        print("problem in Reading original Image from loaded DIR function: /processSketchMap..\n", ioe)
        return json.dumps({"error": ioe.__dict__})


"""
    - return alignment results 
"""
@app.route("/align_plain", methods =["POST"])
def align_plain_sketch_map():
    global USER_SESSIONS_DIR
    global OUTPUT_DIR_PATH
    global MODIF_DIR_PATH
    global VECTORIZED_SKETCH
    global VECTOR_BASEMAP
    global MATCHED_FEATURES
    global SKETCH_MAP_QCN
    global BASEMAP_QCN
    global PnS_PROJ_ID
    global PROJ_TYPE

    project_files_path = path_to_project(request.form)
    matches_file_path = os.path.join(project_files_path, OUTPUT_DIR_PATH, MATCHED_FEATURES)
    #print(matches_file_path)

    """ comment out if using full alignment in debug mode """
    #if app.debug:
     #   matches_file_path = os.path.join(USER_SESSIONS_DIR, "matches.json")
      #  return debug_align_plain_sketch(matches_file_path)

    svg_file_path = os.path.join(project_files_path, MODIF_DIR_PATH, VECTORIZED_SKETCH)
    geojson_file_path = os.path.join(project_files_path, MODIF_DIR_PATH, VECTOR_BASEMAP)
    qualified_sketch_map_file_path = os.path.join(project_files_path, OUTPUT_DIR_PATH, SKETCH_MAP_QCN)
    qualified_metric_map_file_path = os.path.join(project_files_path, OUTPUT_DIR_PATH, BASEMAP_QCN)
    #print ("here i am ")
    if not request.form.get("projectType")== None:
        sketchid = "_".join(("sketch", request.form.get("sessID"), request.form.get("projectType")))
        metricid = "_".join(("metric", request.form.get("sessID"), request.form.get("projectType")))
        loadedSketch, loadedMetric = None, None
    else:
        sketchid = "_".join(("sketch", PnS_PROJ_ID, PROJ_TYPE))
        metricid = "_".join(("metric", PnS_PROJ_ID, PROJ_TYPE))
        loadedSketch, loadedMetric = None, None
    try:
        loadedSketch = str(request.form.get('svgData'))
        #print("loadedSketch: ",loadedSketch)
    except KeyError:
        pass

    try:
        loadedMetric = str(request.form.get('geojsonData'))
        #print("loadedMetric",loadedMetric)
    except KeyError:
        pass

    #print(loadedMetric, "\n\n", loadedSketch)

    qualified_sketch_map = 0  # load qualitative representation here
    qualified_metric_map = 0  # load qualitative representation here

    # write incoming map data to modified
    try:
        if (loadedSketch is not None):
            if os.path.exists(svg_file_path):
                os.remove(svg_file_path)
            with io.open(svg_file_path, 'w', encoding='utf8') as file:
                file.write(loadedSketch)
                file.close()

            #qualified_sketch_map = load_map_qualify(sketchid, read_map_data_from_string(loadedSketch,
            #                                                   "svg"), "svg", "sketch_map")
            #print("qualified_sketch_map..:",qualified_sketch_map)
        else:
            print("else")
        qualified_sketch_map = load_map_qualify(sketchid, read_map_data_from_path(svg_file_path,
                                                                            "svg"), "svg", "sketch_map")
        #print("SM_QCN...:", qualified_sketch_map)

        if os.path.exists(qualified_sketch_map_file_path):
            os.remove(qualified_sketch_map_file_path)
        with io.open(qualified_sketch_map_file_path, 'w', encoding='utf8') as file:
            file.write(json.dumps(qualified_sketch_map, indent=4))
            file.close()
        """
        if (loadedMetric is not None):
            if os.path.exists(geojson_file_path):
                os.remove(geojson_file_path)
            with io.open(geojson_file_path, 'w', encoding='utf8') as file:
                file.write(loadedMetric)
                file.close()

            #qualified_metric_map = load_map_qualify(metricid, read_map_data_from_string(loadedMetric,
             #                                                               "geojson"), "geojson", "metric_map")

        else:
            print("temp")
            """
        qualified_metric_map = load_map_qualify(metricid, read_map_data_from_path(geojson_file_path,
                                                                            "geojson"), "geojson", "metric_map")
        #print("MM_QCN...:", qualified_metric_map)

        if os.path.exists(qualified_metric_map_file_path):
            os.remove(qualified_metric_map_file_path)
        with io.open(qualified_metric_map_file_path, 'w', encoding='utf8') as file:
            file.write(json.dumps(qualified_metric_map, indent=4))
            file.close()

        print("Alignment is STARTED...")

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
            # print(qualified_sketch_map['features'][matcher.slist[l]]['ssm_id'], "(",
            #       qualified_sketch_map['features'][matcher.slist[l]]['feat_type'], ")...matches with...",
            #       qualified_metric_map['features'][matcher.mlist[l]]['ssm_id'], "(",
            #       qualified_metric_map['features'][matcher.mlist[l]]['feat_type'], ")"
            #       )
        print("Alignment is ENDED")
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
    global GEOREFERENCED_SKETCH_FEATURES
    global USER_SESSIONS_DIR

    project_files_path = path_to_project(request.form)
    svg_file_path = os.path.join(project_files_path, MODIF_DIR_PATH, VECTORIZED_SKETCH)
    svg_file_path_output = os.path.join(project_files_path, OUTPUT_DIR_PATH, VECTORIZED_SKETCH)
    gcp_file_name = os.path.join(project_files_path, UPLOADED_DIR_PATH, VECTOR_BASEMAP)
    output_file_path = os.path.join(project_files_path, OUTPUT_DIR_PATH, GEOREFERENCED_SKETCH_FEATURES)

    """temporary copying manual file to the location"""
    svgFile_manual_file = os.path.join(USER_SESSIONS_DIR,"vectorized_sketch_svg.svg")
    shutil.copy(svgFile_manual_file, svg_file_path)
    shutil.copy(svgFile_manual_file, svg_file_path_output)

    svg_content = request.form.get('svgData')
    #print("SVG content:\n", svg_content)
    """
    try:
        with io.open(svg_file_path, 'w', encoding='utf8') as file:
            file.write(svg_content)
            file.close()

    except IOError:
        print("Problem in writing svg contents in Modified Folder")
    """
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
        #print("svg_data_properties", svg_data_properties)
        #print("svg_data", svg_data)

    #geo_data_properties, geo_data = load_geo(loaded_GCP_File, "geojson")
    #svg_data_properties, svg_data = load_svg(svgFile, "svg")
    print("Alignment is STARTED...")
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
    #print("geo_data_properties\n", geo_data_properties)
    geojson_output["features"] = georeferenced_features

    print("Alignment is ENDED")
    #print("geojson_output\n", geojson_output)
    #print()
    try:
        if os.path.exists(output_file_path):
             os.remove(output_file_path)
        f = open(output_file_path, "w")
        f.write(json.dumps(geojson_output, indent=4))
        f.close()
    except IOError:
         print("Problem in Writing matching result as output.json")

    return json.dumps(geojson_output)



def get_fileName_with_prefix(file, proj_type, sub_proj_name):
    return ":".join(["SmartSkeMa",proj_type,sub_proj_name,
              os.path.dirname(file).split(os.sep)[-1],
              os.path.basename(file)])


""" 
    - to save data at PnS
"""
def change_reduced_sketchfile_name(project_files_path,PnsProjectName):
    global MODIF_DIR_PATH
    global REDUCED_RASTER_SKETCH
    os.rename(os.path.join(project_files_path, MODIF_DIR_PATH, REDUCED_RASTER_SKETCH),
              os.path.join(project_files_path, MODIF_DIR_PATH, PnsProjectName + "_modified_sketch.png"))
    REDUCED_RASTER_SKETCH = PnsProjectName + "_modified_sketch"
    reducedSketchName = os.path.join(project_files_path, MODIF_DIR_PATH, REDUCED_RASTER_SKETCH)
    return reducedSketchName


def change_original_sketchfile_name(project_files_path,PnsProjectName):
    global INPUT_RASTER_SKETCH
    global UPLOADED_DIR_PATH

    os.rename(os.path.join(project_files_path,UPLOADED_DIR_PATH,INPUT_RASTER_SKETCH),
              os.path.join(project_files_path,UPLOADED_DIR_PATH,PnsProjectName+"_sketch.png"))
    INPUT_RASTER_SKETCH = PnsProjectName + "_sketch.png"
    originalSketchName = os.path.join(project_files_path,UPLOADED_DIR_PATH,INPUT_RASTER_SKETCH)
    return originalSketchName

@app.route("/save_PnS", methods = ["POST"])
def save_PnS ():
    global UPLOADED_DIR_PATH
    global OUTPUT_DIR_PATH
    global MODIF_DIR_PATH

    global INPUT_RASTER_SKETCH
    global REDUCED_RASTER_SKETCH
    global VECTORIZED_SKETCH
    global VECTOR_BASEMAP
    global SKETCH_MAP_QCN
    global BASEMAP_QCN
    global LADM_FILE
    global PARTIES_FILE
    global MATCHED_FEATURES
    global GEOREFERENCED_SKETCH_FEATURES
    global MATCHED_FEATURES
    global TENURE_RECORD_FILE
    global INPUT_RASTER_COMPLEX_SKETCH
    global REDUCED_RASTER_COMPLEX_SKETCH
    global APROX_TILE
    # for P_and_S platform
    global PnS_PROJ_ID
    global SPATIALSOURCE_SKETCH_UID
    global SPATIALSOURCE_BASE_UID


    SUB_PROJ_NAME = request.form.get('sub_project_name')

    project_files_path = path_to_project(request.form)

    upladed_sketch_original = os.path.join(project_files_path,UPLOADED_DIR_PATH,INPUT_RASTER_SKETCH)
    uploaded_base_map = os.path.join(project_files_path, UPLOADED_DIR_PATH, VECTOR_BASEMAP)
    modified_base_map = os.path.join(project_files_path, MODIF_DIR_PATH, VECTOR_BASEMAP)
    ladm_file = os.path.join(project_files_path, UPLOADED_DIR_PATH, LADM_FILE)
    party_file = os.path.join(project_files_path, UPLOADED_DIR_PATH, PARTIES_FILE)
    input_raster_complex_file = os.path.join(project_files_path, UPLOADED_DIR_PATH, INPUT_RASTER_COMPLEX_SKETCH)

    reduced_raster_sketch = os.path.join(project_files_path, MODIF_DIR_PATH, REDUCED_RASTER_SKETCH)
    reduced_raster_complex_sketch = os.path.join(project_files_path, MODIF_DIR_PATH, REDUCED_RASTER_COMPLEX_SKETCH)

    sketch_svg_file = os.path.join(project_files_path,OUTPUT_DIR_PATH,VECTORIZED_SKETCH)
    modified_sketch_svg_file = os.path.join(project_files_path, MODIF_DIR_PATH, VECTORIZED_SKETCH)
    sketch_qcn = os.path.join(project_files_path,OUTPUT_DIR_PATH,SKETCH_MAP_QCN)
    baseMap_qcn = os.path.join(project_files_path,OUTPUT_DIR_PATH,BASEMAP_QCN)
    geoReferenced_sketch_matches_file = os.path.join(project_files_path,OUTPUT_DIR_PATH,GEOREFERENCED_SKETCH_FEATURES)
    matches_file = os.path.join(project_files_path,OUTPUT_DIR_PATH,MATCHED_FEATURES)
    tenure_record_file = os.path.join(project_files_path,OUTPUT_DIR_PATH,TENURE_RECORD_FILE)
    approx_tile_file = os.path.join(project_files_path, OUTPUT_DIR_PATH, APROX_TILE)

    if os.path.exists(upladed_sketch_original):
        upladed_sketch_original = change_original_sketchfile_name(project_files_path,SUB_PROJ_NAME)
    if os.path.exists(reduced_raster_sketch):
        reduced_raster_sketch = change_reduced_sketchfile_name(project_files_path,SUB_PROJ_NAME)

    print(upladed_sketch_original,reduced_raster_sketch)
    try:
        files = [upladed_sketch_original,uploaded_base_map]
        for file in files:
            if os.path.exists(file):
                fileName_prefix = get_fileName_with_prefix(file,os.path.basename(project_files_path),SUB_PROJ_NAME)
                print("fileName_prefix",fileName_prefix)
                name, ext = os.path.splitext(file)
                if ext == ".png":
                    fileType = "sketch"
                    SPATIALSOURCE_SKETCH_UID = post_to_Pns(file,fileType,fileName_prefix,PnS_PROJ_ID)
                    print("SPATIALSOURCE_SKETCH_UID status",SPATIALSOURCE_SKETCH_UID)
                elif ext == ".geojson":
                    fileType = "base"
                    SPATIALSOURCE_BASE_UID = post_to_Pns(file,fileType,fileName_prefix,PnS_PROJ_ID)
                    print("SPATIALSOURCE_BASE_UID status", SPATIALSOURCE_BASE_UID)

        sketchMapRelatedFiles = [input_raster_complex_file,
                                 reduced_raster_complex_sketch,
                                 reduced_raster_sketch,
                                 ladm_file,party_file,
                                 sketch_svg_file,
                                 modified_sketch_svg_file,
                                 sketch_qcn]
        for file in sketchMapRelatedFiles:
            if os.path.exists(file):
                #fileName = os.path.basename(file)
                fileName = get_fileName_with_prefix(file,os.path.basename(project_files_path),SUB_PROJ_NAME)
                #name, ext = os.path.splitext(file)
                fileType = fileName
                resp = post_related_files_to_PnS_ADocs (file,fileType,PnS_PROJ_ID,SPATIALSOURCE_SKETCH_UID )


        baseMapRelatedFiles = [matches_file,
                               modified_base_map,
                               geoReferenced_sketch_matches_file,
                               tenure_record_file,
                               baseMap_qcn ]
        for file in baseMapRelatedFiles:
            if os.path.exists(file):
                fileName = get_fileName_with_prefix(file,os.path.basename(project_files_path),SUB_PROJ_NAME)
                #fileName = os.path.basename(file)
                #name, ext = os.path.splitext(fileName)
                fileType = fileName
                resp = post_related_files_to_PnS_ADocs(file, fileType, PnS_PROJ_ID, SPATIALSOURCE_BASE_UID)
        return "Data has been Pushed to PnS platform successfully!"
    except PnSError as e:
        print("Problem in pushing SmartSkeMa project data to PnS platform")



@app.route("/get_sub_project_from_PnS", methods = ["POST"])
def get_sub_project_from_PnS():
    global PnS_PROJ_ID
    global USER_SESSIONS_DIR
    global PnS_PROJ_Mode
    #print("PnS_PROJ_ID",PnS_PROJ_ID,)
    PnS_PROJ_Mode = True
    project_files_path = path_to_project(request.form)

    resp = get_project_list_PnS(pns_proj_id=PnS_PROJ_ID,
                                user_session_dir=USER_SESSIONS_DIR)

    sub_proj_list = list(dict.fromkeys(resp))
    #print(sub_proj_list)

    return json.dumps({'projects': sub_proj_list})

@app.route("/download_project_items_from_PnS", methods = ["POST"])
def download_project_items_from_PnS():
    global PnS_PROJ_ID
    global USER_SESSIONS_DIR
    global UPLOADED_DIR_PATH
    global OUTPUT_DIR_PATH
    global MODIF_DIR_PATH
    global PROJ_TYPE_SUB_PROJ_NAME
    global PnS_PROJ_Mode

    PnS_PROJ_Mode = True

    PROJ_TYPE_SUB_PROJ_NAME = request.form.get('sub_project_name')
    project_files_path = path_to_project(request.form)

    print("path_to_project", project_files_path)
    resp = get_projects_items_from_PnS(pns_proj_id=PnS_PROJ_ID,
                                     user_session_dir=USER_SESSIONS_DIR,
                                     proj_dir_path = project_files_path,
                                     uploaded_dir_path = UPLOADED_DIR_PATH,
                                     output_dir_path = OUTPUT_DIR_PATH,
                                     modified_dir_path =MODIF_DIR_PATH,
                                     sub_proj_name = PROJ_TYPE_SUB_PROJ_NAME)
   #return "here you go"
    return json.dumps({'msg': resp})



@app.route("/render_downloaded_files_on_client", methods = ["POST"])
def render_downloaded_files_on_client():
    global REDUCED_RASTER_SKETCH
    global MODIF_DIR_PATH
    global UPLOADED_DIR_PATH
    global OUTPUT_DIR_PATH
    global VECTOR_BASEMAP
    global LADM_FILE
    global PARTIES_FILE
    global VECTORIZED_SKETCH
    global SKETCH_MAP_QCN
    global BASEMAP_QCN
    global GEOREFERENCED_SKETCH_FEATURES
    global MATCHED_FEATURES
    global TENURE_RECORD_FILE
    global SMARTSKEMA_PATH
    global PROJ_TYPE_SUB_PROJ_NAME

    #PnS_PROJ_ID = os.getenv("I4L_PROJECTUID")
    PROJ_TYPE_SUB_PROJ_NAME = request.form.get('sub_project_name')


    path_to_downloaded_project_PnS = path_to_project(request.form)

    print("path_to_downloaded_project_PnS",path_to_downloaded_project_PnS)

    reduced_raster_sketch = os.path.join(path_to_downloaded_project_PnS, MODIF_DIR_PATH, REDUCED_RASTER_SKETCH)
    uploaded_base_map = os.path.join(path_to_downloaded_project_PnS, UPLOADED_DIR_PATH, VECTOR_BASEMAP)
    sketch_svg_file = os.path.join(path_to_downloaded_project_PnS, OUTPUT_DIR_PATH, VECTORIZED_SKETCH)
    matches_file = os.path.join(path_to_downloaded_project_PnS, OUTPUT_DIR_PATH, MATCHED_FEATURES)

    downloaded_files = [reduced_raster_sketch,sketch_svg_file, uploaded_base_map,matches_file]
    fileList = []
    for file in downloaded_files:
        if os.path.exists(file):
            print(file)
            fileContent = ""
            file_rel = os.path.relpath(file, SMARTSKEMA_PATH)
            fileBaseName = os.path.basename(file)
            name, ext = os.path.splitext(file)
            if ext == ".png":
                img = cv2.imread(file, -1)
                if img is not None:
                    height, width, depth = img.shape
                    print(height,width)
                else:
                    width = 800
                    height = 565.686
            if ext == ".geojson" or  ext == ".json":
                with open(file) as file:
                    fileContent = json.loads(file.read())
                    #print(fileContent)
            else:
                print(fileBaseName)
            fileList.append({"fileBaseName":fileBaseName,"filePath": Path(file_rel).as_posix(),"fileContent": fileContent, "width":width, "height":height })
        else:
            print("file cant find ")



    return json.dumps(fileList)
if __name__ == '__main__':
    app.run(debug=True)
