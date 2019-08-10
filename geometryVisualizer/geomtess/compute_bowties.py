# -*- coding: utf-8 -*-
# @author: Stephanie, Malumbo
# finding initial tangent lines based on the algorithm for tangents between polygons: http://geomalgorithms.com/a15-_tangents.html
# line intersection computation code taken from stackoverflow answer: https://stackoverflow.com/a/20679579/4256382

from __future__ import division

import math

import matplotlib.pyplot as plt
import numpy as np
import shapely
from matplotlib import collections as mc
from scipy.spatial import ConvexHull
from shapely.geometry import Polygon

from .map_plotter import addToPlot, plotGPD


def line(p1, p2):
    A = (p1[1] - p2[1])
    B = (p2[0] - p1[0])
    C = (p1[0]*p2[1] - p2[0]*p1[1])
    return A, B, -C

def intersection(L1, L2):
    L1 = line(*L1)
    L2 = line(*L2)
    D  = L1[0] * L2[1] - L1[1] * L2[0]
    Dx = L1[2] * L2[1] - L1[1] * L2[2]
    Dy = L1[0] * L2[2] - L1[2] * L2[0]
    if D != 0:
        x = Dx / D
        y = Dy / D
        return x,y
    else:
        return False
    
def bbox_intersection(l, bbox_lines):
        l_bbt = intersection(l,bbox_lines['top'])
        l_bbb = intersection(l,bbox_lines['bottom'])
        l_bbl = intersection(l,bbox_lines['left'])
        l_bbr = intersection(l,bbox_lines['right'])
        
        l_bb1, l_bb2 = False, False
        
        
        # if l is parallel to the x-axis then it intersects the left and right perimeter lines
        if not l_bbt:
            # parallel to top line
            l_bb1, l_bb2 = (bbox_lines['top'][0][0], l_bbl[1]), (bbox_lines['bottom'][1][0],l_bbr[1])
        else:
            # check if we intersect the top, left, or right perimeters in the upward direction
            if bbox_lines['top'][0][0] <= l_bbt[0] <= bbox_lines['top'][1][0]:
                # intersection point on top perimeter
                l_bb1 = (l_bbt[0], bbox_lines['top'][0][1])
            elif l_bbt[0] < bbox_lines['top'][0][0]:
                # intersection on left perimeter
                l_bb1 = (bbox_lines['top'][0][0], l_bbl[1])
            else:
                # intersection on right perimeter
                l_bb1 = (bbox_lines['top'][1][0],l_bbr[1])
            # check if we intersect the bottom, left, or right perimeters in the downward direction
            if bbox_lines['bottom'][0][0] <= l_bbb[0] <= bbox_lines['bottom'][1][0]:
                # intersection point on top perimeter
                l_bb2 = (l_bbb[0], bbox_lines['bottom'][0][1])
            elif l_bbb[0] < bbox_lines['bottom'][0][0]:
                # intersection on left perimeter
                l_bb2 = (bbox_lines['bottom'][0][0], l_bbl[1])
            else:
                # intersection on right perimeter
                l_bb2 = (bbox_lines['bottom'][1][0],l_bbr[1])
        
        # now rearrange the two points so that l_bb1 is nearest to l[0]
        if (l_bb2[0] - l[0][0])**2 + (l_bb2[1] - l[0][1])**2 < (l_bb2[0] - l[1][0])**2 + (l_bb2[1] - l[1][1])**2:
            l_bb1, l_bb2 = l_bb2, l_bb1
            
        return l_bb1, l_bb2

class Bowties:

    # for a line from start to end, compare the position of the other point. left of the line is 1, directly on the line is 0, right of the line is -1
    @staticmethod
    def isLeft(start, end, other):
        position = (end[0] - start[0]) * (other[1] - start[1]) - (other[0] - start[0]) * (end[1] - start[1])
        if position > 0:
            return 1
        elif position < 0:
            return -1
        else:
            return 0

    # find the right tangent from the point to the polygon. returns the index of the polygon's vertex
    @staticmethod
    def rPointPoly(point, poly):
        n = len(poly) - 1
        
        if Bowties.isLeft(point, poly[1], poly[0]) < 0 and Bowties.isLeft(point, poly[n-1], poly[0]) < 1:
            return 0
    
        a = 0
        b = n
        while True:
            c = math.ceil((a + b) / 2)
            dnC = - Bowties.isLeft(point, poly[c+1], poly[c])
            if Bowties.isLeft(point, poly[c-1], poly[c]) < 1 and dnC > 0:
                return c
            
            upA = Bowties.isLeft(point, poly[a+1], poly[a])
            if upA > 0:
                if dnC > 0:
                    b = c
                else:
                    if Bowties.isLeft(point, poly[a], poly[c]) > 0:
                        b = c
                    else:
                        a = c
            else:
                if dnC < 1:
                    a = c
                else:
                    if Bowties.isLeft(point, poly[a], poly[c]) < 0:
                        b = c
                    else:
                        a = c

    # find the left tangent from the point to the polygon. returns the index of the polygon's vertex
    @staticmethod
    def lPointPoly(point, poly):
        n = len(poly) - 1
        
        if Bowties.isLeft(point, poly[n-1], poly[n]) > 0 and Bowties.isLeft(point, poly[1], poly[0]) > -1:
            return 0
    
        a = 0
        b = n
        while True:
            c = math.ceil((a + b) / 2)
            dnC = - Bowties.isLeft(point, poly[c+1], poly[c])
            if Bowties.isLeft(point, poly[c-1], poly[c]) > 0 and dnC < 1:
                return c
            
            dnA = - Bowties.isLeft(point, poly[a+1], poly[a])
            if dnA > 0:
                if dnC < 1:
                    b = c
                else:
                    if Bowties.isLeft(point, poly[a], poly[c]) < 0:
                        b = c
                    else:
                        a = c
            else:
                if dnC > 0:
                    a = c
                else:
                    if Bowties.isLeft(point, poly[a], poly[c]) > 0:
                        b = c
                    else:
                        a = c

    # find the right-left tangent between two polygons. returns the two points of the tangent
    @staticmethod
    def llPolyPoly(p1, p2):
        m = len(p1) - 1
        n = len(p2) - 1

        x1 = Bowties.rPointPoly(p2[0], p1)
        x2 = Bowties.lPointPoly(p1[x1], p2)

        done = False
        while done == False:
            if Bowties.rPointPoly(p2[x2], p1) != x1 :
                x1 = Bowties.rPointPoly(p2[x2], p1)
                if Bowties.lPointPoly(p1[x1], p2) != x2:
                    x2 = Bowties.lPointPoly(p1[x1], p2)
            elif Bowties.lPointPoly(p1[x1], p2) != x2:
                x2 = Bowties.lPointPoly(p1[x1], p2)
            else:
                done = True

        return [p1[x1], p2[x2]]


    # find the left-right tangent between two polygons. returns the two points of the tangent
    @staticmethod
    def rrPolyPoly(p1, p2):
        return Bowties.llPolyPoly(p2, p1)[::-1]

    # find the right-right tangent between two polygons. returns the two points of the tangent
    @staticmethod
    def lrPolyPoly(p1, p2):
        m = len(p1) - 1
        n = len(p2) - 1

        x1 = Bowties.rPointPoly(p2[0], p1)
        x2 = Bowties.rPointPoly(p1[x1], p2)

        done = False
        while done == False:
            if Bowties.rPointPoly(p2[x2], p1) != x1 :
                x1 = Bowties.rPointPoly(p2[x2], p1)
                if Bowties.rPointPoly(p1[x1], p2) != x2:
                    x2 = Bowties.rPointPoly(p1[x1], p2)
            elif Bowties.rPointPoly(p1[x1], p2) != x2:
                x2 = Bowties.rPointPoly(p1[x1], p2)
            else:
                done = True

        return [p1[x1], p2[x2]]
    
    # find the left-left tangent between two polygons. returns the two points of the tangent
    @staticmethod
    def rlPolyPoly(p1, p2):
        m = len(p1) - 1
        n = len(p2) - 1

        x1 = Bowties.lPointPoly(p2[0], p1)
        x2 = Bowties.lPointPoly(p1[x1], p2)

        done = False
        while done == False:
            while done == False:
                if Bowties.lPointPoly(p2[x2], p1) != x1 :
                    x1 = Bowties.lPointPoly(p2[x2], p1)
                    if Bowties.lPointPoly(p1[x1], p2) != x2:
                        x2 = Bowties.lPointPoly(p1[x1], p2)
                elif Bowties.lPointPoly(p1[x1], p2) != x2:
                    x2 = Bowties.lPointPoly(p1[x1], p2)
                else:
                    done = True
        return [p1[x1], p2[x2]]

    # create the regions (left, center, right) of the two polygons. The third argument is an optional bounding box, default is the envelope around the polygons
    @staticmethod
    def bowtieRegions(p1, p2, bbox="envelope", lbl='1'):

        # calculate default bounding box
        if bbox == "envelope":
            bbox1 = p1['geometry'].envelope.exterior.coords
            bbox2 = p2['geometry'].envelope.exterior.coords
            #bbox1 = p1.envelope.exterior.coords
            #bbox2 = p2.envelope.exterior.coords

            minx = min(bbox1[0][0], bbox2[0][0])
            miny = min(bbox1[0][1], bbox2[0][1])
            maxx = max(bbox1[2][0], bbox2[2][0])
            maxy = max(bbox1[2][1], bbox2[2][1])

            bbox = Polygon([(minx,miny),(maxx,miny),(maxx,maxy),(minx,maxy)])
        else:
            minx, miny, maxx, maxy = bbox.bounds

        # make perimeter segments explicit
        bbox_lines = {'top':[(minx,maxy),(maxx,maxy)], 'bottom':[(minx,miny),(maxx,miny)], 'left':[(minx,maxy),(minx,miny)], 'right':[(maxx,maxy),(maxx,miny)]}
        
        ####
        # get original polygon and convex hull coordinates
        coords1 = p1['geometry'].convex_hull.exterior.coords
        coords2 = p2['geometry'].convex_hull.exterior.coords
        
        coords1_lst = p1['geometry'].exterior.coords[:]
        coords2_lst = p2['geometry'].exterior.coords[:]
        
        # calculate the vertices of the tangent lines
        rr = Bowties.rrPolyPoly(coords1,coords2)
        ll = Bowties.llPolyPoly(coords1,coords2)
        lr = Bowties.lrPolyPoly(coords1,coords2)
        rl = Bowties.rlPolyPoly(coords1,coords2)
      
        # get the initial points of tangent with the reference objects
        p1_ll = ll[0]
        p2_ll = ll[1]
        p1_lr = lr[0]
        p2_lr = lr[1]
        p1_rr = rr[0]
        p2_rr = rr[1]
        p1_rl = rl[0]
        p2_rl = rl[1]
        
        # get the points at the box perimeter. First just pick intersections of each line with the bbox lines
        ll_bb1,ll_bb2 = bbox_intersection(ll,bbox_lines)
        lr_bb1,lr_bb2 = bbox_intersection(lr,bbox_lines)
        rr_bb1,rr_bb2 = bbox_intersection(rr,bbox_lines)
        rl_bb1,rl_bb2 = bbox_intersection(rl,bbox_lines)
        
        # get the intersections between the tangent lines
        if p1_ll == p1_lr:
            ll_lr = p1_ll
        else:
            ll_lr = intersection(ll, lr)
        
        if p2_ll == p2_rl:
            ll_rl = p2_ll
        else:
            ll_rl = intersection(ll, rl)
        
#        lr_rl = intersection(lr, rl)
        
        if p2_rr == p2_lr:
            rr_lr = p2_rr
        else:
            rr_lr = intersection(rr, lr)
            
        if p1_rr == p1_rl:
            rr_rl = p1_rr
        else:
            rr_rl = intersection(rr, rl)
 
        # arrange the points on the perimeter in ccw order to correctly assign corner points
        perimeter =  [ll_bb1,ll_bb2,lr_bb1,lr_bb2,rr_bb1,rr_bb2,rl_bb1,rl_bb2]
        perimeter.extend(bbox.exterior.coords[:-1])
        perimeter_array = np.asarray(perimeter)
        cn = perimeter_array.mean(axis=0)
        angles = np.arctan2(perimeter_array[:,1] - cn[1], perimeter_array[:,0] - cn[0])
        perimeter_array = perimeter_array[np.argsort(angles)]
        perimeter = perimeter_array.tolist()
            
        # finally put together the regions
        # we pack the initial coordinate list in dictionary to simplify the code
        # we must make sure that the coordinates are all listed in ccw order and coords[0] == coords[-1]
        regions = {
            'back' : [rl_bb1, rr_rl, p1_rr, p1_ll, ll_lr, lr_bb1, rl_bb1],
            'front' : [rl_bb2, ll_rl, p2_ll, p2_rr, rr_lr, lr_bb2, rl_bb2],
            'between' : [p1_rl, p1_rr, rr_rl, rr_lr, p2_rr, p2_lr, p2_rl, p2_ll, ll_rl, ll_lr, p1_ll, p1_lr, p1_rl],
            'left' : [lr_bb1, ll_lr, ll_rl, rl_bb2, lr_bb1],
            'right' : [lr_bb2, rr_lr, rr_rl, rl_bb1,lr_bb2]
        }
        
        # first let's get rid of duplicates
        for region, vertices in regions.items():
            vert_groups = []
            idx = 0
            
            while idx < len(vertices):
                
                vert_group = [idx]
                dup_idx = idx
                
                while vertices[(dup_idx+1)%len(vertices)] == vertices[idx]:
                    dup_idx = (dup_idx+1)%len(vertices)
                    
                if dup_idx > idx:
                    idx = dup_idx + 1
                else:
                    idx += 1
                    
                vert_group.append(dup_idx)
                vert_groups.append(vert_group)
                
            vert_groups = [vertices[vert_group[0]] for vert_group in vert_groups]

            regions[region] = vert_groups
        
        # then find out which polygons contain the corner vertices and add them - this is where we need the ccw ordering
        def addVertices(region, vertices):

            perim_pos1 = perimeter.index(list(regions[region][-2]))
            perim_pos2 = perimeter.index(list(regions[region][-1]))
            
            perim_pos = (perim_pos1 + 1)%len(perimeter)
        
            while (perim_pos != perim_pos2):
                regions[region].insert(-1, tuple(perimeter[perim_pos]))
                perim_pos = (perim_pos + 1)%len(perimeter)
            
        for region, vertices in regions.items():
            if region != 'between':
                addVertices(region, vertices)
        
        # finally append vertices from the polygons onto the boundary of the appropriate regions        
        # the back region first
        if p1_ll != p1_rr:
            back_rr_idx = regions['back'].index(p1_rr)
            p1_ll_idx = coords1_lst.index(p1_ll)
            p1_rr_idx = coords1_lst.index(p1_rr)
            
            nv = (p1_ll_idx + 1)%len(coords1_lst)
            insert_pt = (back_rr_idx + 1)

            while nv != p1_rr_idx:
                regions['back'].insert(insert_pt,  coords1_lst[nv])
                nv = (nv + 1)%len(coords1_lst)

        # the front region next
        if p2_ll != p2_rr:
            front_ll_idx = regions['front'].index(p2_ll)
            p2_ll_idx = coords2_lst.index(p2_ll)
            p2_rr_idx = coords2_lst.index(p2_rr)
            
            nv = (p2_rr_idx + 1)%len(coords2_lst)
            insert_pt = (front_ll_idx + 1)
            
            while nv != p2_ll_idx:
                regions['front'].insert(insert_pt, coords2_lst[nv])
                nv = (nv + 1)%len(coords2_lst)
            
        # the middle region last - there will be at most 6 boundary pieces to check 3 at each ref. polygon
        # start at p1
        if p1_lr != p1_rl:
            mid_p1_lr_idx = regions['between'].index(p1_lr)
            p1_rl_idx = coords1_lst.index(p1_rl)
            p1_lr_idx = coords1_lst.index(p1_lr)
            
            nv = (p1_rl_idx + 1)%len(coords1_lst)
            insert_pt = (mid_p1_lr_idx + 1)
            
            while nv != p1_lr_idx:
                regions['between'].insert(insert_pt, coords1_lst[nv])
                nv = (nv + 1)%len(coords1_lst)
                
        if p1_rr != p1_rl:
            mid_p1_rl_idx = regions['between'].index(p1_rl)
            p1_rl_idx = coords1_lst.index(p1_rl)
            p1_rr_idx = coords1_lst.index(p1_rr)
            
            nv = (p1_rr_idx + 1)%len(coords1_lst)
            insert_pt = (mid_p1_rl_idx + 1)
            
            while nv != p1_rl_idx:
                regions['between'].insert(insert_pt, coords1_lst[nv])
                nv = (nv + 1)%len(coords1_lst)
            
        if p1_ll != p1_lr:
            mid_p1_ll_idx = regions['between'].index(p1_ll)
            p1_ll_idx = coords1_lst.index(p1_ll)
            p1_lr_idx = coords1_lst.index(p1_lr)
            
            nv = (p1_lr_idx + 1)%len(coords1_lst)
            insert_pt = (mid_p1_ll_idx + 1)
            
            while nv != p1_ll_idx:
                regions['between'].insert(insert_pt, coords1_lst[nv])
                nv = (nv + 1)%len(coords1_lst)
        
        # then do p2
        p2_rl_lr = [p2_lr,p2_rl]
        if p2_lr != p2_rl:
            mid_p2_lr_idx = regions['between'].index(p2_lr)
            p2_rl_idx = coords2_lst.index(p2_rl)
            p2_lr_idx = coords2_lst.index(p2_lr)
            
            nv = (p2_rl_idx + 1)%len(coords2_lst)
            insert_pt = (mid_p2_lr_idx + 1)
            ct = 0
            while nv != p2_lr_idx:
                regions['between'].insert(insert_pt, coords2_lst[nv])
                if ct < 100:
                    ct += 1
                    p2_rl_lr.insert(1, coords2_lst[nv])
                    
                nv = (nv + 1)%len(coords2_lst)
        
        p2_lr_rr = [p2_rr,p2_lr]   
        if p2_rr != p2_lr:
            mid_p2_rr_idx = regions['between'].index(p2_rr)
            p2_lr_idx = coords2_lst.index(p2_lr)
            p2_rr_idx = coords2_lst.index(p2_rr)
            
            nv = (p2_lr_idx + 1)%len(coords2_lst)
            insert_pt = (mid_p2_rr_idx + 1)
            ct = 0            
            while nv != p2_rr_idx:
                regions['between'].insert(insert_pt, coords2_lst[nv])
                if ct < 100:
                    ct += 1
                    p2_lr_rr.insert(1, coords2_lst[nv])
                nv = (nv + 1)%len(coords2_lst)
        
        p2_ll_rl = [p2_rl,p2_ll]
        if p2_ll != p2_rl:
            mid_p2_rl_idx = regions['between'].index(p2_rl)
            p2_ll_idx = coords2_lst.index(p2_ll)
            p2_rl_idx = coords2_lst.index(p2_rl)
            
            nv = (p2_ll_idx + 1)%len(coords2_lst)
            insert_pt = (mid_p2_rl_idx + 1)
            ct = 0
            while nv != p2_rl_idx:
                regions['between'].insert(insert_pt, coords2_lst[nv])
                if ct < 100:
                    ct += 1
                    p2_ll_rl.insert(1, coords2_lst[nv])
                nv = (nv + 1)%len(coords2_lst)

        for region, geom_coords in regions.items():
            regions[region] = Polygon(geom_coords)
            
        # last step is to add the original polygons to the tiles
        regions['p1'] = p1['geometry']
        regions['p2'] = p2['geometry']
        
        ########################## HERE ON JUST PLOTTING FOR DEBUG ##########################
        
        if True:#p1['attributes']['ssm_id'] in roi and p2['attributes']['ssm_id'] in roi:
            lines = [p2_rl_lr,p2_lr_rr,p2_ll_rl]
            lc = mc.LineCollection(lines, linewidths=1.5, colors=["cyan","indigo","fuchsia"])
        else:
            lines = [rl,[rl_bb1, rl_bb2], [lr_bb1, lr_bb2], [ll_bb1,ll_bb2], [rr_bb1,rr_bb2]]
            lc = mc.LineCollection(lines, linewidths=1.5)
        
        # plot ridges with nullified vertices to see
#        fig, ax = plt.subplots()
#        fig.set_size_inches(10, 10)
##        lc = mc.LineCollection(lines, linewidths=1.5)
##        polys = [bbox.exterior.coords,regions['back'],regions['front'],regions['between'],regions['left'],regions['right'],p1['geometry'].exterior.coords, p2['geometry'].exterior.coords]
#        polys = [bbox.exterior.coords,regions['back'].exterior.coords,regions['front'].exterior.coords,regions['between'].exterior.coords,p1['geometry'].exterior.coords, p2['geometry'].exterior.coords]
#        pc = mc.PolyCollection(polys, facecolors=["white","grey","brown","gold","red","green"], linewidths=1.5)
#        
#        plt.annotate( 'p1_rl', xy=rl[0], xytext=(rl[0][0],rl[0][1]))
#        plt.annotate( 'p2_rl', xy=rl[1], xytext=(rl[1][0],rl[1][1]))
#        plt.annotate( 'p1_lr', xy=lr[0], xytext=(lr[0][0],lr[0][1]))
#        plt.annotate( 'p2_lr', xy=lr[1], xytext=(lr[1][0],lr[1][1]))
#        plt.annotate( 'p1_ll', xy=ll[0], xytext=(ll[0][0],ll[0][1]))
#        plt.annotate( 'p2_ll', xy=ll[1], xytext=(ll[1][0],ll[1][1]))
#        plt.annotate( 'p1_rr', xy=rr[0], xytext=(rr[0][0],rr[0][1]))
#        plt.annotate( 'p2_rr', xy=rr[1], xytext=(rr[1][0],rr[1][1]))
#        
#        plt.annotate( 'll_bb1', xy=ll_bb1, xytext=(ll_bb1[0],ll_bb1[1]))
#        plt.annotate( 'll_bb2', xy=ll_bb2, xytext=(ll_bb2[0],ll_bb2[1]))
#        plt.annotate( 'lr_bb1', xy=lr_bb1, xytext=(lr_bb1[0],lr_bb1[1]))
#        plt.annotate( 'lr_bb2', xy=lr_bb2, xytext=(lr_bb2[0],lr_bb2[1]))
#        plt.annotate( 'rr_bb1', xy=rr_bb1, xytext=(rr_bb1[0],rr_bb1[1]))
#        plt.annotate( 'rr_bb2', xy=rr_bb2, xytext=(rr_bb2[0],rr_bb2[1]))
#        plt.annotate( 'rl_bb1', xy=rl_bb1, xytext=(rl_bb1[0],rl_bb1[1]))
#        plt.annotate( 'rl_bb2', xy=rl_bb2, xytext=(rl_bb2[0],rl_bb2[1]))
#        
#        ax.add_collection(lc)
#        ax.add_collection(pc)
##        ax.scatter(np.array(coords1)[:,0], np.array(coords1)[:,1], s=0.5, marker='x', color="red")
##        ax.scatter(np.array(coords2)[:,0], np.array(coords2)[:,1], s=0.5, marker='x', color="blue")
#        #ax.autoscale()
#        ax.margins(0.1)
#        #plt.savefig('tangents_matplt_'+p1['attributes']['ssm_id']+'_'+p2['attributes']['ssm_id']+'_'+lbl+'.svg')
#        plt.show()
        
#        print(p1['attributes']['ssm_id']+' is_ccw?',p1['geometry'].exterior.is_ccw)
#        print(p2['attributes']['ssm_id']+' is_ccw?',p1['geometry'].exterior.is_ccw)

        plotTiles = []
        
        try:
            for pid, polygon in regions.items():
                plotTiles.append({'attributes':{'feat_type':pid},'geometry':Polygon(polygon)})

        except Exception as e:
            print('Region:', pid, '-- bad polygon', polygon)
            print(e.__dict__)
            
        lbl = 'tangent_tiles_'+p1['attributes']['ssm_id']+'_'+p2['attributes']['ssm_id']+'_'+lbl
        #plotGPD(plotTiles, lbl) #UNCOMMENT HERE

        ########################## END OF DEBUG PLOTS ##########################
        
        # return our computed tiles
        return regions
    
    
    def attrByID(data, ssm_id):
        for d in data:
            if d['attributes']['ssm_id'] == ssm_id:
                a = d['attributes'].copy()
                return a
            
        return {}
