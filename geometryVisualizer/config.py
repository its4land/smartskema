# -*- coding: utf-8 -*-
"""
Created on Mon Mar 12 10:11:57 2018

@author: Malumbo

Globals
"""
import configparser
import logging

# geometry type filter criteria
FILTER_POINTS = 0
FILTER_LINESTRINGS = 1
FILTER_POLYGONS = 2
FILTER_POINTS_LINESTRINGS = 3
FILTER_POINTS_POLYGONS = 4
FILTER_LINESTRINGS_POLYGONS = 5
FILTER_ALL = 6

# map types
SKETCH_MAP = 'sketch_map'
METRIC_MAP = 'metric_map'

# clique search result modes
MODE_BEST = 0
MODE_BEST_ALL = 1
MODE_ALL = 2

# Global config variable
__config__ = configparser.ConfigParser()

def read_config(settings_file):
    """ Read user defined settings from give file in INI format"""
    loglevels = {
        'debug': logging.DEBUG,
        'info': logging.INFO,
        'warning': logging.WARNING,
        'error': logging.ERROR,
        'critical': logging.CRITICAL
    }

    __config__.read(settings_file)
    loglevel = __config__.get('logging', 'loglevel', fallback='warning')

    if loglevel.lower() not in loglevels:
        logging.warning(f"Undefined loglevel - '{loglevel}'. Choose from: "
                        "debug/info/warning/error/critical")
    else:
        loglevel = loglevels[loglevel.lower()]

    logging.info(f"Read user defined settings from '{settings_file}'")

def get_value(section_name, key, default=None, warn=True):
    """ Get value of a property in the given section 
    
        If 'section_name' is missing, then add it
        If 'key' is missing, create it and set it to default value
    """
    if section_name in __config__:
        if key in __config__[section_name]:
            return __config__[section_name][key]
        else:
            if warn:
                logging.warning(f"Key '{key}' not found in "
                            f"section '{section_name}' of configuration file")
    else:
        if warn:
            logging.warning(f"Section '{section_name}' "
                            "not found in configuration file'")
    logging.info(f"Will set '{key}' to default value '{default}'")
    return __config__.get(section_name, key, fallback=default)
