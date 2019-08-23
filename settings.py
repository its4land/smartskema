#settings.py
# -*- coding: utf-8 -*-
"""
Created on Mon Apr 30 15:51:54 2018

@author: s_jan001
"""


import os
# __file__ refers to the file settings.py
APP_ROOT = os.path.dirname(os.path.abspath(__file__))   # refers to application_top
#print("APP_ROOT:",APP_ROOT)
UUID = ""
STATIC_DIR = os.path.join(APP_ROOT,"static")
PROJ_DIR_PATH = ""
UPLOADED_DIR_PATH = ""
MODIF_DIR_PATH = ""
OUTPUT_DIR_PATH = ""
SVG_DIR_PATH = ""
SMARTSKEMA_PATH = os.path.join(STATIC_DIR,"..")
QUALITATIVE_REPRESENTATION = os.path.join(APP_ROOT, "spatialRepresentations.json")
#print("herer is working dir",os.getcwd())

DIR_QCNS = "./output"
PROJECT_FOLDER ="./projectFolder"
UPLOADED_FOLDER ="./projectFolder/uploadedFiles"
MODIFIED_FOLDER ="./projectFolder/modifiedFiles"
DIR_DATA = "./data"
RecordList=[]
SketchMapName= ""
BaseMapName=""
