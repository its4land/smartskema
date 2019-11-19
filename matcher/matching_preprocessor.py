# -*- coding: utf-8 -*-
"""
Created on Sun Jul  1 19:13:11 2018

@author: Lenovo
"""
import numpy as np
import logging
import difflib

import matcher.qualitative_calculi as qc

"""
Notes: the two sets of similarity computation functions below are
exactly the same except for their naming (function, argument, and variable names)
We will therefore probably drop the relation_similarity ones and stick with the 
concept_similarity ones.
"""


def concept_distance_binary(concept_1, concept_2):
    if concept_1 == concept_2:
        return 0
    else:
        return 1


def concept_distance(concept_1, concept_2, model):
    if model is None:
        return concept_distance_binary(concept_1, concept_2)
    else:
        # if we are given a model we should use tree distance
        return model.distance(concept_1, concept_2)


def concept_similarity(concept_1, concept_2, model=None):
    return 1 - concept_distance(concept_1, concept_2, model)


def similar_strings(seq1, seq2, thres):
    return string_similarity(seq1, seq2) > thres


def string_similarity(seq1, seq2):
    sim = difflib.SequenceMatcher(a=seq1.lower(), b=seq2.lower()).ratio()
    return sim


class string_distance:
    def distance(self, seq1, seq2):
        sim = string_similarity(seq1, seq2)
        return 1 - sim


def relation_distance_binary(relation_1, relation_2):
    if relation_1 == relation_2:
        return 0
    else:
        return 1


def relation_distance(relation_1, relation_2, calculus):
    if calculus is None:
        return relation_distance_binary(relation_1, relation_2)
    else:
        # if we are given a model we should use tree distance
        return calculus.distance(relation_1, relation_2)


def relation_similarity(relation_1, relation_2, calculus=None):
    return 1 - relation_distance(relation_1, relation_2, calculus)


def threshold_simple(value, threshold):
    if value >= threshold:
        return 1
    else:
        return 0


def reformart_constraint_list(constraints, calculus):
    new_constraints = {}
    for constraint in constraints:
        new_tuple, new_constraint = (constraint['obj_1'], constraint['obj_2']), constraint['relation']
        try:
            inverse_tuple, inverse_constraint = (constraint['obj_2'], constraint['obj_1']), \
                                                calculus.inverse(constraint['relation'])
        except KeyError:
            logging.error('KeyError', exc_info=True)
        new_constraints[new_tuple] = new_constraint
        new_constraints[inverse_tuple] = inverse_constraint

    return new_constraints


def compute_similarity_matrix(qualified_sketch_map, qualified_metric_map, sim_threshold=0.7):
    FID = 0
    FEAT_TYPE = 1
    # first compute and store object similarities
    sm_newfeats = [[f['ssm_id'], f['feat_type']] for f in qualified_sketch_map['features']]
    sm_newfeats = np.array(sm_newfeats).T

    mm_newfeats = [[f['ssm_id'], f['feat_type']] for f in qualified_metric_map['features']]
    mm_newfeats = np.array(mm_newfeats).T

    num_pairs = sm_newfeats.shape[1] * mm_newfeats.shape[1]
    similarity_matrix = np.zeros(shape=(num_pairs, num_pairs), dtype=np.float32)
    ftype_dist = string_distance()
    compatible_objects = []
    sm_object_interval = mm_newfeats.shape[1]

    for i in range(sm_newfeats.shape[1]):
        for j in range(mm_newfeats.shape[1]):
            pos = (i * sm_object_interval) + j
            similarity_matrix[pos, pos] = concept_similarity(sm_newfeats[FEAT_TYPE, i], mm_newfeats[FEAT_TYPE, j], ftype_dist)
            if threshold_simple(similarity_matrix[pos, pos], sim_threshold):
                if sm_newfeats[FEAT_TYPE, i] != mm_newfeats[FEAT_TYPE, j]:
                    print(sm_newfeats[FEAT_TYPE, i], "<==>",mm_newfeats[FEAT_TYPE, j])
                    print("--")
                compatible_objects.append(pos)

    # the compute and store relation similarities -- will need to prepare the
    # relation sets first to make picking out stuff easier
    # first pair up relation sets
    relation_sets = {}
    for m_rel_set in qualified_metric_map['constraint_collection']:
        for s_rel_set in qualified_sketch_map['constraint_collection']:
            if s_rel_set['relation_set'] == m_rel_set['relation_set']:
                calculus = qc.get_calculus(s_rel_set['relation_set'])
                s_rel_dict = reformart_constraint_list(s_rel_set['constraints'], calculus)
                m_rel_dict = reformart_constraint_list(m_rel_set['constraints'], calculus)
                relation_sets[calculus] = (s_rel_dict, m_rel_dict)

    # then do the rest
    for pair_i in compatible_objects:
        for pair_j in compatible_objects:
            # unpack pair index into sketch node index and metric node index
            fid_i_s = sm_newfeats[FID, int(pair_i / sm_object_interval)]
            fid_i_m = mm_newfeats[FID, int(pair_i % sm_object_interval)]
            fid_j_s = sm_newfeats[FID, int(pair_j / sm_object_interval)]
            fid_j_m = mm_newfeats[FID, int(pair_j % sm_object_interval)]

            # fetch the corresponding relations from the constraint sets
            weightsum = 0
            weighted_mean_sim = 0
            for calculus, constraints in relation_sets.items():
                try:
                    pair_s_rel = constraints[0][(fid_i_s, fid_j_s)]
                except KeyError:
                    if fid_i_s == fid_j_s:
                        pair_s_rel = calculus.eq
                    else:
                        continue
                try:
                    pair_m_rel = constraints[1][(fid_i_m, fid_j_m)]
                except KeyError:
                    if fid_i_m == fid_j_m:
                        pair_m_rel = calculus.eq
                    else:
                        continue

                wt = qc.weight(calculus)
                weighted_mean_sim = (
                                            weightsum * weighted_mean_sim
                                            + wt * concept_similarity(pair_s_rel, pair_m_rel, calculus)
                                    ) / (weightsum + wt)
                weightsum = weightsum + wt

            similarity_matrix[pair_i, pair_j] = weighted_mean_sim

    return similarity_matrix, sm_newfeats.shape[1]  # , sm_newfeats[0], mm_newfeats[0]
