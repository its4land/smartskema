import difflib

# geometry type filter criteria
FILTER_POINTS = 0
FILTER_LINESTRINGS = 1
FILTER_POLYGONS = 2
FILTER_POINTS_LINESTRINGS = 3
FILTER_POINTS_POLYGONS = 4
FILTER_LINESTRINGS_POLYGONS = 5
FILTER_ALL = 6

def in_list(txt, lst, weak_compare):
    thres = 1
    if weak_compare:
        thres = 0.8
    for lst_entry in lst:
        if similar_strings(txt, lst_entry, thres):
            return True
    return False


def similar_strings(seq1, seq2, thres):
    return difflib.SequenceMatcher(a=seq1.lower(), b=seq2.lower()).ratio() >= thres


def filter(data, filter_geoms=FILTER_ALL, type_list=[], weak_compare=False):
    # first extract the useful data - name, geometry_type, feature_type
    f_data = data

    try:
        # start with the attribute filter and then the names filter
        if len(type_list) != 0:
            f_data = [d for d in f_data if in_list(d['attributes']['feat_type'], type_list, weak_compare)]
    except KeyError:
        print([d for d in f_data if 'feat_type' not in d['attributes']])

    geom_type_list = []
    if filter_geoms == FILTER_POINTS:
        geom_type_list.append('Point')

    elif filter_geoms == FILTER_LINESTRINGS:
        geom_type_list.append('LineString')

    elif filter_geoms == FILTER_POLYGONS:
        geom_type_list.append('Polygon')

    elif filter_geoms == FILTER_POINTS_LINESTRINGS:
        geom_type_list.append('Point')
        geom_type_list.append('LineString')

    elif filter_geoms == FILTER_POINTS_POLYGONS:
        geom_type_list.append('Point')
        geom_type_list.append('Polygon')

    elif filter_geoms == FILTER_LINESTRINGS_POLYGONS:
        geom_type_list.append('LineString')
        geom_type_list.append('Polygon')

    elif filter_geoms == FILTER_ALL:
        geom_type_list.append('Point')
        geom_type_list.append('LineString')
        geom_type_list.append('Polygon')

    f_data = [d for d in f_data if d['attributes']['geometry_type'] in geom_type_list]

    return f_data
