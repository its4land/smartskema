from method.spatial import left_or_right
import matcher.feature_filters as ff


def qualify_left_right(data, **kwargs):
    # every qualifier function must specify these two parameters\n",
    relation_set = 'LEFT_RIGHT'
    arity = 2

    relata = ff.filter(data)
    referents = ff.filter(relata, type_list=['river', 'road'])

    for ref in referents:
        relata.remove(ref)

    qcn = []

    for referent in referents:
        for relatum in relata:
            o1 = referent['attributes']['ssm_id']
            o2 = relatum['attributes']['ssm_id']
            g1 = referent['geometry']
            g2 = relatum['geometry']
            relation = left_or_right(g1, g2)
            qcn.append({
                'obj_1': o1,
                'obj_2': o2,
                'relation': relation
            })

    return relation_set, arity, {}, qcn
