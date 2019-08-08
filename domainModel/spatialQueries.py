
"""
    ----------LeftRight---------------
"""

def get_qualitativeRepresentaitons(qualReps):
    qualiReps_list = []
    for reps in qualReps['spatialRepresentations']:
        qualiReps_list.append(reps)
    return qualiReps_list


def get_river_sm(smqcns):
    river_id_List=[]
    if  smqcns['properties']['map_type'] == "sketch_map":
        for feature in smqcns['features']:
            #print(feature)
            if feature['feat_type'] =="river":
                river_id =feature["ssm_id"]
                river_id_List.append(river_id)

    return river_id_List


def get_main_feature_sm(smJson,main_feat_id,main_feat_type):
    main_feature_id_list = []
    if  smJson['properties']['map_type'] == "sketch_map":
        for feature in smJson['features']:
            #print(feature)
            if feature['feat_type'] == main_feat_type:
                feature_id =feature["ssm_id"]
                main_feature_id_list.append(feature_id)

    return main_feature_id_list

def get_school_sm(smqcns):
    school_id_List=[]
    if  smqcns['properties']['map_type'] == "sketch_map":
        for feature in smqcns['features']:
            #print(feature)
            if feature['feat_type'] =="school":
                school_id =feature["ssm_id"]
                school_id_List.append(school_id)

    return school_id_List



def get_bomas_sm(smqcns):
    bomas_id_List=[]
    if  smqcns['properties']['map_type'] == "sketch_map":
        for feature in smqcns['features']:
            #print(feature)
            if feature['feat_type'] =="boma":
                boma_id =feature["ssm_id"]
                bomas_id_List.append(boma_id)

    return bomas_id_List


def get_leftRight_constraints (qcns):
    lrConstraints = []
    try:
        for item in qcns:
            for lr_const in item['constraints']:
                if item['relation_set']=="LEFT_RIGHT":
                    lrConstraints.append(lr_const)
    except IOError:
         print("NO LeftRight relations found")
    return lrConstraints

def getTotalLeftRightRelations_sm(sm_qcns):
    if sm_qcns['properties']['map_type'] == "sketch_map":
        constriantList_lr = get_leftRight_constraints(sm_qcns['constraint_collection'])
    return constriantList_lr




def get_main_feature_rcc8rel_(main_feat_id,rcc8_relations):
    main_feat_rcc8_rel = []
    for k in rcc8_relations:
        obj1 = k["obj_1"]
        obj2 = k["obj_2"]
        rel = k["relation"]
        if ((main_feat_id == obj1 and rel == "ntpp")or(main_feat_id == obj2 and rel == "ntpp")or(main_feat_id == obj1 and rel == "ntppi")
                or(main_feat_id == obj2 and rel == "ntppi")):
            main_feat_rcc8_rel.append(k)
        elif((main_feat_id == obj1 and rel == "op")or(main_feat_id == obj2 and rel == "op")):
            main_feat_rcc8_rel.append(k)
        elif ((main_feat_id == obj1 and rel == "ec") or (main_feat_id == obj2 and rel == "ec")):
            main_feat_rcc8_rel.append(k)

    return main_feat_rcc8_rel


def get_RCC8_constraints (qcns):
    rcc8Constraints = []
    try:
        for item in qcns:
            for rcc8_const in item['constraints']:
                if item['relation_set']=="RCC8":
                    rcc8Constraints.append(rcc8_const)
    except IOError:
         print("NO LeftRight relations found")
    return rcc8Constraints

def getTotalRCC8Relations_sm(sm_qcns):
    if sm_qcns['properties']['map_type'] == "sketch_map":
        constriantList_rcc8 = get_RCC8_constraints(sm_qcns['constraint_collection'])
    return constriantList_rcc8

##########################################################

def get_main_feature_relDist_(main_feat_id,relDist_relations):
    main_feat_relDist_rel = []
    for k in relDist_relations:
        obj1 = k["obj_1"]
        obj2 = k["obj_2"]
        rel = k["relation"]
        if ((main_feat_id == obj1 and rel == "near")or(main_feat_id == obj2 and rel == "near")):
            main_feat_relDist_rel.append(k)

    return main_feat_relDist_rel


def get_relDist_constraints (qcns):
    relDistConstraints = []
    try:
        for item in qcns:
            for relDist_const in item['constraints']:
                if item['relation_set']=="REL_DIST":
                    relDistConstraints.append(relDist_const)
    except IOError:
         print("NO LeftRight relations found")
    return relDistConstraints

def getTotalRelDistRelations_sm(sm_qcns):
    if sm_qcns['properties']['map_type'] == "sketch_map":
        constriantList_relDist = get_relDist_constraints(sm_qcns['constraint_collection'])
    return constriantList_relDist