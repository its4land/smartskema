# -*- coding: utf-8 -*-
"""
Created on Tue Jan 23 11:37:34 2018

@author: Malumbo
"""
# from shapely.geometry import *
import logging
from enum import Enum, auto
from itertools import permutations as perm, groupby as grp

from matcher.config import get_value
from matcher.feature_filters import filter
from method.adjacency import qualify_adjacency
from method.leftright import qualify_left_right
from method.rcc11 import qualify_rcc11
from method.rcc8 import qualify_rcc8
from method.regionstarvars import qualify_relative_direction
from method.relativedist import qualify_relative_distance

# Track defined qualifiers and their callable functions
available_qualifiers = dict()


class QualifierInterface:
    """Defines an interface for a qualifier"""

    def __init__(self, data, properties):
        self.data = data
        self.q_rep = {}
        self.q_rep['properties'] = properties
        self.q_rep['constraint_collection'] = []
        self.q_rep['features'] = []

        for d in data:
            x = d['attributes']
            x['geometry_type'] = d['geometry'].geom_type
            # x['ssm_id'] = x['id']
            # del x['id']
            self.q_rep['features'].append(x)

    def qualify(self, fqualifier: callable, **kwargs):
        """ Run qualifier using the chosen method
        """

        qcn = {'constraints': []}
        if kwargs:
            relation_set, arity, modifiers, relations = fqualifier(self.data, **kwargs)
        else:
            relation_set, arity, modifiers, relations = fqualifier(self.data)

        qcn['relation_set'] = relation_set
        qcn['arity'] = arity

        # if the qualifier uses modifiers add them to the
        if not modifiers:
            qcn['modifiers'] = modifiers

        for r in relations:
            if len(r) < qcn['arity']:
                raise TypeError(
                    'Expecting relations with {0}-tuples, given a {1}-tuples: {2}'.format(
                        qcn['arity'], len(r), r))

            qcn['constraints'].append(r)

        self.q_rep['constraint_collection'].append(qcn)

        print("qualified: ", relation_set)
        return {
            'features': self.q_rep['features'],
            'constraint_collection': [qcn]}

    def qualify_by_name(self, qualifier_name: str, **kwargs):
        """ Uses method name to invoke qualification function"""
        fqualifier = get_qualifier(qualifier_name)
        if fqualifier:
            self.qualify(fqualifier, **kwargs)

    def current_qualitative_representation(self):
        """Return currently chosen qualitative representation """
        return self.q_rep


def get_qualifier_functions(data):
    """Loops through a list of qualifiers, initializing them
    and returning a list of qualifier functions that can be applied on
    any 'well formed' data.
    """
    #  append qualifier for each aspect and return list
    qualifier_function_list = []

    # 1. rcc8
    qualifier_function_list.append((qualify_rcc8, None))

    # 2. rcc11
    qualifier_function_list.append((qualify_rcc11, None))

    # 3. RegionStarVars
    fargs = {'num_sectors': 4}
    regstarvars_ref_objects = filter(data, type_list=['mountain'])
    regstarvars_ref_pairs = grp(perm(regstarvars_ref_objects, 2), key=lambda x: x[0])
    fargs['reference_pair_groups'] = regstarvars_ref_pairs
    qualifier_function_list.append((qualify_relative_direction, fargs))

    # 4. relative distance
    qualifier_function_list.append((qualify_relative_distance, None))

    # 5. left-right relations
    qualifier_function_list.append((qualify_left_right, None))

    # 6. adjacency
    qualifier_function_list.append((qualify_adjacency, None))

    return qualifier_function_list


def register_qualifier(name: str, fn_name: callable):
    """ Register a method for qualification

    Provides a way to register a qualifier which uses a method for
    qualifying a spatial configuration. In addition to existing
    qualifiers available in the library, this allows for a custom
    qualifier method to be named and defined.
    """
    if name in available_qualifiers:
        logging.warning(f"'{name}' is already associated with an existing qualifier."
                        "Overriding old qualifier.")

    available_qualifiers[str] = fn_name


def get_qualifier_names():
    """ Access names of available qualifiers"""
    return std_qualifiers_.keys()


def get_qualifier(name: str) -> callable:
    """ Return qualifying function for a given method"""
    if name in std_qualifiers_:
        return std_qualifiers_[name]

    logging.error(f"No qualifier found for method '{name}'")
    return None


class Qualifier(Enum):
    """Create enumeration of qualification methods(calculi) 
    
    Using enumerations allows the different qualification calculi to be
    grouped, compared and iterated over.
    """
    ADJACENCY = auto()
    DE91M = auto()
    LEFTRIGHT = auto()
    OPRA = auto()
    RCC11 = auto()
    RCC8 = auto()
    RELATIVEDIST = auto()
    REGIONSTARVARS = auto()


# Add any qualifier name and function defined in the library here
std_qualifiers_ = {
    Qualifier.ADJACENCY: qualify_adjacency,
    Qualifier.LEFTRIGHT: qualify_left_right,
    Qualifier.RCC11: qualify_rcc11,
    Qualifier.RCC8: qualify_rcc8,
    Qualifier.RELATIVEDIST: qualify_relative_distance,
    Qualifier.REGIONSTARVARS: qualify_relative_direction
}

for qfr in std_qualifiers_:
    register_qualifier(qfr, std_qualifiers_[qfr])
