
# -*- coding: utf-8 -*-
"""
Created on Mon Oct 23 09:35:54 2018

@author: s_jan001
"""
from owlready2 import *

def generate_tuenure_record_json(spatialSource, date_time, feat_id,feat_type,ownership,party,rrrs):
    #rrrs = {i: rrrs[i] for i in range(0, len(rrrs))}
    #print (rrrs)
    tenureRecord = {
            'record_no': date_time,
            'spatial_source': spatialSource,
            "features":[{
                                "feature_id" : feat_id,
                                "feature_type":feat_type,
                                "relations":[{
                                                "party":party,
                                                "ownership": ownership,
                                                "rrrs":rrrs

                                             }]
                                }]
            }

    return tenureRecord


def get_has_rrr(onto):
    rrr_list = []
    #rrrs = onto.search(iri="*Right*")
    rrrs = onto.classes()

    classes1 = onto.classes()

    rights = None

    for class1 in classes1:
        if class1.iri.endswith('Right'):
            rights = class1.descendants()
            #print(class1.iri)
            #print(class1.descendants())

    for subright in rights:
        item = str(subright)
        prefix_term = item.split(".", 1)[0]
        item_term = item.split(".", 1)[-1]
        rrr_list.append({'prefix': prefix_term, 'item': item_term})


    return rrr_list


def get_boma_ownerships(onto):
    boma_ownerships_list = []
    boma_ownerships = onto.search(iri="*Boma*")
    for index, item in enumerate(boma_ownerships):
        item =str(item)
        prefix_term = item.split(".", 1)[0]
        item_term = item.split(".", 1)[-1]

        boma_ownerships_list.append({'prefix':prefix_term, 'item':item_term})
    return boma_ownerships_list


def get_olopololi_ownerships(onto):
    olopololi_ownerships_list = []
    olopololi_ownerships = onto.search(iri="*Olopololi*")
    for index, item in enumerate(olopololi_ownerships):
        item = str(item)
        prefix_term = item.split(".", 1)[0]
        item_term = item.split(".", 1)[-1]

        olopololi_ownerships_list.append({'prefix':prefix_term, 'item':item_term})
    return olopololi_ownerships_list

def get_ownerships(onto):
    ownership_list= []
    ownership = onto.search(iri="*Ownership")
    for index, item in enumerate(ownership):
        item = str(item)
        prefix_term = item.split(".", 1)[0]
        item_term = item.split(".", 1)[-1]
        if item_term == "CommonOwnership":
            ownership_list.append({'prefix':prefix_term, 'item':item_term})
        elif item_term == "Ownership":
            ownership_list.append({'prefix':prefix_term, 'item':item_term})
    return ownership_list