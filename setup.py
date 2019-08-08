# -*- coding: utf-8 -*-
"""
Created on Mon Apr 13-07-2018 15:51:54 2018

@author: s_jan001
"""


from cx_Freeze import setup, Executable
import os.path
import sys

PYTHON_INSTALL_DIR = os.path.dirname(os.path.dirname(os.__file__))
os.environ['TCL_LIBRARY'] = os.path.join(PYTHON_INSTALL_DIR, 'tcl', 'tcl8.6')
os.environ['TK_LIBRARY'] = os.path.join(PYTHON_INSTALL_DIR, 'tcl', 'tk8.6')



temps = ['./templates', './templates']
static = ['./static', './static']
data = ['./data', './data']
manual = ['./manual', './manual']
output = ['./output', './output']
svg = ['./sketch_map.svg', './sketch_map.svg']




# Note: without 'jinja2.ext' in this list, we won't get the templates working.

include = [ 'jinja2', 'jinja2.ext','numpy.core._methods', 'numpy.lib.format','scipy.spatial.ckdtree']
flaskapp = Executable(
                    script="webConnector.py",
                    base="Win32GUI",
                    targetName="its4land.exe",
                        #compress = True,

                  )
setup(
    name="its4land",
    version="1.0",
    author="s_jan",
    description="its4land",
    options={
        'build_exe': {
            'packages': ['encodings', 'asyncio','scipy'],
            'include_files':[ temps, static,data,manual,output,svg,
                              os.path.join(PYTHON_INSTALL_DIR, 'DLLs', 'tk86t.dll'),
                              os.path.join(PYTHON_INSTALL_DIR, 'DLLs', 'tcl86t.dll'),
                              os.path.join(PYTHON_INSTALL_DIR, 'DLLs', 'geos_c.dll')
                             ],
            'includes': include,
            'build_exe': "its4land_build"
        }
    },
    executables=[flaskapp]
)