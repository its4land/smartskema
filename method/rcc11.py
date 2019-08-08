# -*- coding: utf-8 -*-
"""
Created on Tue Jan 23 12:25:10 2018

@author: s_jan001

RCC11: Captures the Topological relations between
    Polygoanl features

"""

# from de9im import pattern
from method.spatial import pattern
import matcher.feature_filters as ff

DC_pattern = pattern('FF*FF****')
ECp_pattern = pattern('FF*F0****')
ECl_pattern = pattern('FF*F1****')
PO_pattern = pattern('T*T***T**')
NTPP_pattern = pattern('T*****FF*')
NTPP_inv_pattern = pattern('T*F**F***')
TPPp_pattern = pattern('2FF10FTTT')
TPPl_pattern = pattern('2FF11FTTT')
TPPp_inv_pattern = pattern('212F01FF2')
TPPl_inv_pattern = pattern('212F11FF2')
equals_pattern = pattern('T*F**FFF*')


def polygonal_topology(p1, p2):
    im_pattern = p1.relate(p2)

    # return im_pattern
    if (DC_pattern.matches(im_pattern)):
        return "dc"
    elif (ECp_pattern.matches(im_pattern)):
        return "ecp"
    elif (ECl_pattern.matches(im_pattern)):
        return "ecl"
    elif (PO_pattern.matches(im_pattern)):
        return "po"
    elif (NTPP_pattern.matches(im_pattern)):
        return "ntpp"
    elif (NTPP_inv_pattern.matches(im_pattern)):
        return "ntppi"
    elif (TPPp_pattern.matches(im_pattern)):
        return "tppp"
    elif (TPPl_pattern.matches(im_pattern)):
        return "tppl"
    elif (TPPp_inv_pattern.matches(im_pattern)):
        return "tpppi"
    elif (TPPp_inv_pattern.matches(im_pattern)):
        return "tpppl"
    elif (equals_pattern.matches(im_pattern)):
        return "eq"
    else:
        return None


def qualify_rcc11(data, **kwargs):
    f_data = ff.filter(data, filter_geoms=ff.FILTER_POLYGONS)

    qcn = []
    for i in range(len(f_data[:-1])):
        for sec in f_data[i + 1:]:
            o1 = f_data[i]['attributes']['ssm_id']
            o2 = sec['attributes']['ssm_id']
            relation = polygonal_topology(f_data[i]['geometry'], sec['geometry'])
            qcn.append({
                'obj_1': o1,
                'obj_2': o2,
                'relation': relation
            })

    return 'RCC11', 2, {}, qcn
