from shapely.geometry import Point, Polygon

from method.spatial import compute_relative_dist_ranges, distance_relation
import matcher.feature_filters as ff


def qualify_relative_distance(data, **kwargs):
    # every qualifier function must specify these two parameters\n",
    qualify_relative_distance.relation_set = 'REL_DIST'
    qualify_relative_distance.arity = 2,

    relata_list = []

    relata_list.append(ff.filter(data, type_list=[
        'boma', 'olopololi', 'school', 'borehole',
        'church', 'river', 'marsh'
    ]))
    relata_list.append(ff.filter(data, type_list=['mountain', 'marsh', 'river', 'road']))

    qcn = []
    near_ends, far_ends = [], []

    for relata in relata_list:
        near_end, far_end = compute_relative_dist_ranges([r['geometry'] for r in relata])
        near_ends.append(near_end), far_ends.append(far_end)

    for k in range(len(relata_list)):
        relata = relata_list[k]
        near_end, far_end = near_ends[k], far_ends[k]

        for i in range(len(relata) - 1):
            for sec in relata[i + 1:]:
                if relata[i]['attributes']['feat_type'] in ['road', 'river', 'marsh'] \
                        and sec['attributes']['feat_type'] in ['road', 'river', 'marsh'] \
                        and i == 0:
                    continue

                o1 = relata[i]['attributes']['ssm_id']
                o2 = sec['attributes']['ssm_id']
                g1 = relata[i]['geometry']
                g2 = sec['geometry']
                relation = distance_relation(g1, g2, near_end, far_end)
                qcn.append({'obj_1': o1, 'obj_2': o2, 'relation': relation})

    return 'REL_DIST', 2, {}, qcn
