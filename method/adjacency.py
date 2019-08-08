from method.spatial import compute_adjacency, compute_max_min_dist
import matcher.feature_filters as ff


def qualify_adjacency(data, **kwargs):
    qualify_adjacency.relation_set = 'adj'
    qualify_adjacency.arity = 2

    relata_list = list()

    relata_list.append(ff.filter(data, type_list=['boma', 'olopololi']))
    relata_list.append(ff.filter(data, type_list=['mountain', 'boundary']))

    qcn = []

    for relata in relata_list:
        max_min_dist = compute_max_min_dist([r['geometry'] for r in relata])
        for i in range(len(relata) - 1):
            for sec in relata[i + 1:]:
                o1 = relata[i]['attributes']['ssm_id']
                o2 = sec['attributes']['ssm_id']
                g1 = relata[i]['geometry']
                g2 = sec['geometry']
                relation = compute_adjacency(g1, g2, max_min_dist)
                qcn.append({'obj_1': o1, 'obj_2': o2, 'relation': relation})

        return 'ADJACENCY', 2, {}, qcn
    else:
        return 'ADJACENCY', 2, {}, []
