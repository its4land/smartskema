# -*- coding: utf-8 -*-
"""
Created on Wed Apr 25 17:42:58 2018

@author: Malumbo
"""

import geopandas as gpd
import matplotlib.pyplot as plt
import pandas as pd

########################### PLOT MAP FUNCTION ###########################
plt.style.use('bmh')

def plotGPD(data, lbl):
    frame_data = []
    pltArgs = dict(cmap='Set2', figsize=(10, 10))
    
    if isinstance(data[0], dict):
        pltArgs['column']='feat_type'
        for d_pnt in data:
            d_pnt['attributes']['geometry'] = d_pnt['geometry']
            frame_data.append(d_pnt['attributes'])
    else:
        for d_pnt in data:
            frame_data.append({'geometry':d_pnt})
            
    df = pd.DataFrame(frame_data)
    gdf = gpd.GeoDataFrame(df, geometry='geometry')
    gdf.plot(**pltArgs)
    fig = plt.figure()
    fig.suptitle(lbl)
    
    #plt.axis('off')
    plt.savefig("test_"+lbl+".svg")
    
    return gdf
######################### END PLOT MAP FUNCTION #########################

########################### PLOT MAP FUNCTION ###########################
def addToPlot(data, gdf, lbl):
    frame_data = []
    pltArgs = dict(cmap='Set2', figsize=(10, 10))
    
    if isinstance(data[0], dict):
        pltArgs['column']='feat_type'
        for d_pnt in data:
            d_pnt['attributes']['geometry'] = d_pnt['geometry']
            frame_data.append(d_pnt['attributes'])
    else:
        for d_pnt in data:
            frame_data.append({'geometry':d_pnt})
            
    
    fig = plt.figure()
    fig.suptitle(lbl)
    df = pd.DataFrame(frame_data)
    gdf_dat = gpd.GeoDataFrame(df, geometry='geometry')
    gdf.plot(ax=gdf_dat.plot(**pltArgs, lw=2))
    
    #plt.axis('off')
    plt.savefig("test_add_"+lbl+".svg")
    
######################### END PLOT MAP FUNCTION #########################
