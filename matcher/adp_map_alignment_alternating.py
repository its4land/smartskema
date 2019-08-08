"""
Computes the alignment of two input qualitative representations of maps given
as attributed graphs.
@author Malumbo Chipofya
"""

import numpy as np
import numpy.ma as ma
import scipy.sparse as sparse

from random import random, randrange, choice
from bisect import bisect_left

MODE_EXPLORE = 0
MODE_EXPLOIT = 1
MOVE_TYPE_ADD = 1
MOVE_TYPE_DROP = -1


class ADPMatcher:
    """
        Executes the matching procedure for a pair of qualitative spatial
        representations given

        - similarity matrix sim_mat (2D numpy array)
        - number of objects in the map of first representation sketch_map_size
    """

    def __init__(self, sketch_map_size, sim_mat, threshold=0.4,
                 weight_o=0.4, weight_r=0.6, gamma=0.95, epsilon=0.9, alpha=0.8):
        """
            Construct a new matching instance.

            :param sketch_map_size: The number of objects in map of first representation
            :param sim_mat: The similarity matrix of the two maps being aligned
            :return: The best matching between the two maps as a list of indexes
        """
        self.search_state = self.SearchSpace(sketch_map_size, sim_mat, threshold,
                                             weight_o, weight_r, gamma, epsilon, alpha)

        self.match = self.search_state.rtdp(max_explore=10, max_iter=10)

        # return self.match

    def get_match(self):
        return self.match



    class SearchSpace:

        """
            Stores a dually ordered list of contribution values. The list is
            ordered by the index, p, of the data in the input set and dually by
            the values incompat(p) and contribution C(.,p) as an ordered pair
        """

        def __init__(self, sketch_map_size, sim_mat, threshold,
                     weight_o, weight_r, gamma, epsilon, alpha):

            self.veval_on_pair = np.vectorize(self.eval_on_pair, excluded=['lcm_mask'])

            self.match_size = 0
            self.num_pairs = sim_mat.shape[0]

            diagonal_indices = np.full_like(sim_mat, True, np.bool)
            non_diagonal_indices = diagonal_indices.copy()

            non_diagonal_indices[np.diag_indices_from(diagonal_indices)] = False
            diagonal_indices = diagonal_indices != non_diagonal_indices

            self.sim_mat = sim_mat
            self.sim_mat[diagonal_indices] *= weight_o
            self.sim_mat[non_diagonal_indices] *= weight_r
            self.sketch_map_size = sketch_map_size
            self.metric_map_size = int(sim_mat.shape[0] / sketch_map_size)
            self.threshold = threshold
            self.weight_o = weight_o
            self.weight_r = weight_r
            self.gamma = gamma
            self.epsilon = epsilon
            self.alpha = alpha

            self.max_block = 0
            self.match_block = 1

            lcm_mask = self.max_block_mask(np.arange(self.num_pairs, dtype=np.uint32))

            self.c_values = np.stack(
                (
                    np.resize(np.diag(sim_mat), self.num_pairs + 1),
                    np.zeros(self.num_pairs + 1, dtype=np.float32)
                ),
                axis=-1)  # the similarity of each pair with current match pairs
            self.eval_values = np.asarray(self.veval_on_pair(range(self.num_pairs), lcm_mask=lcm_mask), dtype=np.uint16)
            self.match_compatibility_counts = np.zeros((self.num_pairs,), dtype=np.uint32)  # the number of pairs in
            self.value_ordering = np.empty((sketch_map_size, 0), dtype=np.uint16).tolist()

            #            max_blocks_pairs = np.argsort(self.eval_values).tolist()

            max_blocks_pairs = np.where(self.eval_values > 1)[0]

            max_block_sort = np.lexsort((max_blocks_pairs, self.eval_values[max_blocks_pairs]))
            self.value_ordering[0][:] = np.asarray(max_blocks_pairs,
                                                   dtype=np.uint16)[max_block_sort].tolist()

            #            self.value_ordering[0][:] = max_blocks_pairs
            self.sorted_positions = np.full(self.num_pairs, -1, dtype=np.uint16)
            self.sorted_positions[max_blocks_pairs[max_block_sort]] = np.arange(len(max_blocks_pairs))

            #            self.value_ordering[0] = np.argsort(self.eval_values).tolist()
            # self.last_cand_position = len(self.value_ordering[self.max_block]) - 2
            # self.last_match_position = len(self.value_ordering[self.max_block]) - 1
            #            self.sorted_positions = np.argsort(np.asarray(
            #                self.value_ordering[0]))  # the position of the ith pair in the value sorted ordering list -- position
            self.block_memberships = np.zeros(self.num_pairs, dtype=np.uint32)
            self.eval_0 = self.eval_m(lcm_mask)

            self.trellis_graph = (
                np.full((self.sketch_map_size, sim_mat.shape[0]), self.eval_values)
            )
            self.trellis_graph = self.trellis_graph * sim_mat.diagonal()
            # self.trellis_graph = self.trellis_graph.T
            self.best_path = []
            self.best_value = 0
            # np.resize(self.trellis_graph, (self.trellis_graph.shape[0]+1, self.trellis_graph.shape[1]))
            # self.trellis_graph[self.trellis_graph.shape[0] - 1] =
            # np.full(self.trellis_graph.shape[1], np.mean(sim_mat.diagonal()))

            return

        def max_block_mask(self, max_block_elements):
            """

            :param max_block_elements: pairs currently occupying the max_block list
            :return: lcm_mask -- mask of elements
            """
            # lcm_elements = np.asarray(max_block_elements)
            lcm_mask = np.zeros(self.num_pairs, dtype=np.uint8)
            lcm_mask.put(max_block_elements, 1)
            return lcm_mask

        def eval_on_pair(self, pair, lcm_mask=None):
            """ desc """
            lcm = self.sim_mat[pair].copy()
            lcm[lcm < self.threshold] = 0
            lcm[lcm > 0] = 1
            lcm = np.asarray(lcm, dtype=np.uint8)

            lcm = lcm & lcm_mask
            # print(self.sketch_map_size, self.metric_map_size)
            lcm = lcm.reshape((self.sketch_map_size, self.metric_map_size))

            i = int(pair / self.metric_map_size)
            j = int(pair % self.metric_map_size)
            lcm[i, :] = 0
            lcm[:, j] = 0
            lcm[i, j] = 1

            return self.count_representatives(lcm, self.metric_map_size)

        def eval_m(self, lcm_mask):
            """ desc """
            lcm = lcm_mask.reshape((self.sketch_map_size, self.metric_map_size))
            return self.count_representatives(lcm, self.metric_map_size)

        def count_representatives(self, lcm, row_length):
            """ desc """
            lcm_col_sums = lcm.sum(axis=0)
            lcm_row_sums = lcm.sum(axis=1)

            masked_lcm = ma.array((lcm_row_sums[:, None] + lcm_col_sums[None, :]) - 1, mask=(1 - lcm))

            unique_representatives_count = 0

            while masked_lcm.count() > 0:  # iterate on unmasked portion of array until it is all covered
                next_pair = masked_lcm.argmin()
                i = int(next_pair / row_length)
                j = int(next_pair % row_length)

                if masked_lcm.mask[i, j]:
                    masked_lcm.mask[:] = 1
                elif masked_lcm[i, j] <= 0:
                    masked_lcm.mask[:] = 1
                else:
                    unique_representatives_count = unique_representatives_count + 1
                    masked_lcm.mask[i, :] = 1
                    masked_lcm.mask[:, j] = 1

            return unique_representatives_count

        def _update_sort(self, compatible_pairs, move_pair, move_type, mode=MODE_EXPLORE):
            # fetch the position of each changed item in the sorted list
            # delta_positions = compatible_pairs.nonzero()

            # move pair is always in the max_block block
            if move_type == MOVE_TYPE_ADD and self.block_memberships[move_pair] != self.max_block \
                    or move_type == MOVE_TYPE_DROP and self.block_memberships[move_pair] != self.match_block:
                raise ValueError('Cannot move a node that is not connected to members of current match!')
            # preset all pointers and hope things don't break
            trellis_level = len(self.value_ordering[self.match_block])
            self.max_block = self.max_block + move_type
            self.match_block = self.match_block + move_type

            def next_block(p):
                if p == move_pair:
                    return self.block_memberships[p] + (2 * move_type)
                else:
                    return self.block_memberships[p] + move_type

            # create sorting array depending on the mode exploration -- only needed in move selection
            order_by = [None, None]
            if mode == MODE_EXPLORE:
                order_by[0] = self.eval_values
                order_by[1] = self.c_values[:, 0]
            else:  # MODE_EXPLOIT
                order_by[0] = self.trellis_graph[trellis_level]
                # order_by[0] = self.c_values[:, 0]
                order_by[1] = self.eval_values

            match_max_blocks_pairs = []
            pre_max_blocks_pairs = []

            for pair in compatible_pairs:
                # find the new max_block pairs
                new_block = next_block(pair)
                if new_block == self.max_block - 1:
                    pre_max_blocks_pairs.append(pair)
                if new_block == self.max_block:
                    match_max_blocks_pairs.append(pair)
                if new_block == self.match_block:
                    match_max_blocks_pairs.append(pair)

            if move_type == MOVE_TYPE_DROP:
                match_max_blocks_pairs_set = set(match_max_blocks_pairs)
                match_max_blocks_pairs_set.update(self.value_ordering[self.max_block])
                match_max_blocks_pairs_set.difference_update(pre_max_blocks_pairs)
                match_max_blocks_pairs = list(match_max_blocks_pairs_set)

            lcm_mask = self.max_block_mask(match_max_blocks_pairs)

            # find its new position by looking at all position changes
            for pair in compatible_pairs:
                # find the current block of the pair
                block = self.block_memberships[pair]
                new_block = next_block(pair)

                # then find its relative position within the block
                pos = self.sorted_positions[pair]
                if new_block in (self.max_block, self.match_block):
                    self.eval_values[pair] = self.eval_on_pair(pair, lcm_mask)

                try:
                    self.value_ordering[new_block].append(pair)
                except IndexError as err:
                    print(err)

                del self.value_ordering[block][pos]
                self.sorted_positions[self.value_ordering[block][pos:]] = \
                    self.sorted_positions[self.value_ordering[block][pos:]] - 1

                self.block_memberships[pair] = new_block
                self.sorted_positions[pair] = len(self.value_ordering[new_block]) - 1

            max_blocks_pairs = self.value_ordering[self.max_block]
            max_block_sort = np.lexsort((self.value_ordering[self.max_block][:],
                                         order_by[1][max_blocks_pairs],
                                         order_by[0][max_blocks_pairs]))
            self.value_ordering[self.max_block][:] = np.asarray(self.value_ordering[self.max_block],
                                                                dtype=np.uint16)[max_block_sort].tolist()

            match_blocks_pairs = self.value_ordering[self.match_block]
            match_block_sort = np.lexsort((self.value_ordering[self.match_block][:],
                                           order_by[1][match_blocks_pairs],
                                           order_by[0][match_blocks_pairs]))
            self.value_ordering[self.match_block][:] = np.asarray(self.value_ordering[self.match_block],
                                                                  dtype=np.uint16)[match_block_sort].tolist()

            self.sorted_positions[max_blocks_pairs] = np.arange(len(max_blocks_pairs))
            self.sorted_positions[match_blocks_pairs] = np.arange(len(match_blocks_pairs))

            return

        def update(self, move_pair, move_type, mode):

            compatible_pairs = np.where(self.sim_mat[move_pair] >= self.threshold)[0]

            if move_type == MOVE_TYPE_ADD:
                match_ratio = 1.0 / (self.match_size + 1)
            else:
                match_ratio = 1.0 / self.match_size

            c_r_values = self.c_values[compatible_pairs, 1]
            self.c_values[compatible_pairs, 1] = (
                                                         self.match_size * self.c_values[compatible_pairs, 1]
                                                         + move_type * self.sim_mat[move_pair, compatible_pairs]
                                                 ) * match_ratio
            self.c_values[compatible_pairs, 0] = self.c_values[compatible_pairs, 0] \
                                                 - c_r_values \
                                                 + self.c_values[compatible_pairs, 1]

            self.match_compatibility_counts[compatible_pairs] = self.match_compatibility_counts[  # TODO remove:
                                                                    compatible_pairs] + move_type  # value never used

            self._update_sort(compatible_pairs, move_pair, move_type, mode)

            self.match_size = self.match_size + move_type

            return

        def next_candidate(self, epsilon, move_type):
            # epsilon greedy strategy: make random move with probability of epsilon
            try:
                if random() < epsilon:
                    if move_type == MOVE_TYPE_ADD:
                        candidate = self.value_ordering[self.max_block][-1]  # add move
                    else:
                        candidate = self.value_ordering[self.match_block][0]  # drop move
                else:
                    if move_type == MOVE_TYPE_ADD:
                        candidate = choice(self.value_ordering[self.max_block][:])  # add move
                    else:
                        candidate = choice(self.value_ordering[self.match_block][:])  # drop move
            except(KeyError, AttributeError, ValueError, IndexError) as err:
                # print(f"Error fetching next candidate: {err}")
                candidate = -1

            return candidate

        def value_iteration_update(self):

            return

        def rtdp(self, max_explore, max_iter):
            i = 0
            n = 0
            explore = max_explore > 0
            exploit = True

            # repeat until stopping conditions
            while True:
                # use epsilon-greedy search with e(i,j)|m to find maximal path
                while explore:
                    next_path = self.epsilon_greedy_path_search(MODE_EXPLORE)
                    if len(next_path) == 1:
                        next_path = np.array(next_path, dtype=np.uint32).tolist()
                    if len(next_path) == self.eval_0:
                        return next_path
                    if len(next_path) > len(self.best_path):
                        self.best_path = next_path
                    # undo path, update trellis graph values along the path, and add them up
                    next_value = self.unwind_path(next_path)
                    if len(next_path) == len(self.best_path) and next_value > self.best_value:
                        self.best_value = next_value

                    if n < max_explore:
                        n = n + 1
                    else:
                        explore = False
                        exploit = True

                while exploit:
                    value_based_path = self.epsilon_greedy_path_search(MODE_EXPLOIT)
                    if len(value_based_path) == 1:
                        value_based_path = np.array(value_based_path, dtype=np.uint32).tolist()
                    if len(value_based_path) == self.eval_0:
                        return value_based_path
                    if len(value_based_path) > len(self.best_path):
                        self.best_path = value_based_path
                    # undo path, update trellis graph values along the path, and add them up
                    next_value = self.unwind_path(value_based_path)
                    if len(value_based_path) == len(self.best_path) and next_value > self.best_value:
                        self.best_value = next_value

                    if i < max_iter:
                        i = i + 1
                        explore = True
                        exploit = False
                    else:
                        return self.best_path

        def epsilon_greedy_path_search(self, mode):
            path = []
            done = False
            while not done:
                pair = self.next_candidate(self.epsilon, MOVE_TYPE_ADD)
                if pair != -1:
                    path.append(pair)
                    self.update(pair, MOVE_TYPE_ADD, mode=mode)
                    # self.update(pair, MOVE_TYPE_ADD, mode=mode)
                else:
                    done = True

            return path

        def unwind_path(self, path):
            done = False
            # path_value = 0
            c_values = self.c_values[path, 0]  # C^(.,.,.)
            path_c_values = c_values.cumsum(axis=0)  # C(.,.,.) -- order this backwards for later reference
            path_value = path_c_values[-1]

            self.update(path[-1], MOVE_TYPE_DROP, mode=MODE_EXPLORE)

            for pos in range(len(path) - 2, -1, -1):
                pair = path[pos]
                successors = np.asarray(self.value_ordering[self.max_block], dtype=np.uint16)
                successor_c_values = self.c_values[successors, 0]
                successor_trellis_values = self.trellis_graph[pos + 1, successors] - pos
                successor_probabilities = successor_c_values / successor_c_values.sum(axis=0)

                pair_value_n = path_c_values[pos] + self.gamma \
                               * (successor_probabilities * successor_trellis_values).sum()
                self.trellis_graph[:pos, pair] = (1 - np.power(self.alpha, np.arange(pos - 1, -1, -1))) \
                                                 * self.trellis_graph[pos, pair] \
                                                 + np.power(self.alpha, np.arange(pos - 1, -1, -1)) \
                                                 * pair_value_n
                path_value = path_value + self.trellis_graph[pos, pair]
                self.update(path[pos], MOVE_TYPE_DROP, mode=MODE_EXPLORE)

            return path_value / len(path)

    def neighborhood(self, pair):
        """
            Compute the neighborhood of the current pair

            :param pair: The pair for which we want to get the current neighborhood
            :return: a list of neighbors of pair
        """

        return pair
