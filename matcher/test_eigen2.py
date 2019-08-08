'''
This code is same as test_eigen but class based.
and is called from map_loader
Last update : 19.09.18

'''

# from __future__ import print_function

from time import time
from scipy import sparse

import numpy as np
import scipy.linalg as linalg
import heapq

class SpecCenScore:

    def __init__(self, ddarr, sketch_map_size):
        print('init')
        self.slist,self.mlist = self.spectral(ddarr, sketch_map_size)

    def centrality_scores(self, X, alpha=0.85, max_iter=100, tol=1e-10):
        """Power iteration computation of the principal eigenvector

        This method is also known as Google PageRank and the implementation
        is based on the one from the NetworkX project (BSD licensed too)
        with copyrights by:

          Aric Hagberg <hagberg@lanl.gov>
          Dan Schult <dschult@colgate.edu>
          Pieter Swart <swart@lanl.gov>
        """
        print("Before refereing shape:", type(X))
        n = X.shape[0]
        X = X.copy()
        incoming_counts = np.asarray(X.sum(axis=1)).ravel()

        print("Normalizing the graph")
        for i in incoming_counts.nonzero()[0]:
            X.data[X.indptr[i]:X.indptr[i + 1]] *= 1.0 / incoming_counts[i]
        dangle = np.asarray(np.where(X.sum(axis=1) == 0, 1.0 / n, 0)).ravel()

        # print("dangle:\n",dangle)
        scores = np.ones(n, dtype=np.float32) / n  # initial guess
        for i in range(max_iter):
            # print("power iteration #%d" % i)
            prev_scores = scores
            scores = (alpha * (scores * X + np.dot(dangle, prev_scores))
                      + (1 - alpha) * prev_scores.sum() / n)
            # check convergence: normalized l_inf norm
            scores_max = np.abs(scores).max()
            if scores_max == 0.0:
                scores_max = 1.0
            err = np.abs(scores - prev_scores).max() / scores_max
            # print("error: %0.6f" % err)
            if err < n * tol:
                return scores

        return scores

    def spectral(self,ddarr, sketch_map_size):

        eignres = linalg.eig(ddarr, right=True)
        eigval = eignres[0].astype(float)                        #copy_eigval is the 'x' in the paper, 1D array with size m*n && #astype() for removing the img part of the complex numbers
        eigvec = eignres[1]

        # print("eignres",eignres)
        print("===============================================")
        # print(eigvec)

        print("Computing principal eigenvector score using a power iteration method")
        t0 = time()
        # print("ddarr.data" ,ddarr.data[ddarr[1]:ddarr[2]])  #0x0000016501C08708

        # ddarr = sparse.lil_matrix(ddarr)
        ddarr = sparse.csr_matrix(ddarr)
        # aa = np.asarray(ddarr.sum(axis=1)).ravel()
        scores = self.centrality_scores(ddarr, max_iter=100, tol=1e-10)
        print("done in %0.6fs" % (time() - t0))
        print("sketch_map_size-", sketch_map_size)
        metric_map_size = int(ddarr.shape[0] / sketch_map_size)
        print("metric_map_size-", metric_map_size)

        sm_feat_list = []
        mm_feat_list = []
        L = np.ones(ddarr.shape[0])
        X = np.zeros(ddarr.shape[0])
        # print(np.where(scores == max5[0])[0][0], " / ", metric_map_size, "..",
        #       np.where(scores == max5[0])[0][0] / metric_map_size)
        #print("scores.max():",scores.max())
        #print("np.count_nonzero(L): ", np.count_nonzero(L), " ddarr.shape[0]: ",ddarr.shape[0])
        cnt = 0
        while scores.max() > 0 and np.count_nonzero(L) != 0:
            cnt += 1
            max5 = heapq.nlargest(1, scores)
            maxind = np.where(scores == max5[0])[0][0]
            #print("Max = ", max5, " at index : ", maxind)

            sm_feat_id = int(np.where(scores == max5[0])[0][0] / metric_map_size)
            sm_feat_list.append(sm_feat_id)
            mm_feat_id = np.where(scores == max5[0])[0][0] % metric_map_size
            mm_feat_list.append(mm_feat_id)
            # .append(np.where(scores == max5[9])[0][0] % metric_map_size)
            #print("sm_feat_id-",np.around(sm_feat_id,0))
            #print("mm_feat_id-",mm_feat_id)

            #reduce max score
            scores[maxind] = -1
            #remove pairs (i,i`) and (i,k) and (q,i`)
            L[maxind] = 0
            for i in range(ddarr.shape[0]):
                if(int(i / metric_map_size) == sm_feat_id):
                    L[i] = 0
                    scores[i] = -1
                    # if cnt < 10: print(i)
                if(i % metric_map_size == mm_feat_id):
                    L[i] = 0
                    scores[i] = -1
                    # if cnt < 10: print(i)

            X[maxind] = 1

        #print("sm_feat_list-", np.around(sm_feat_list, 0))
        #print("mm_feat_list-",mm_feat_list)
        # To print L and X in readable format
        # print("score:", scores)
        # print("L:")
        # for k in range(L.shape[0]):
        #     if k % 21 == 0:
        #         print("\n", L[k], end=" ", sep=" ")
        #     else:
        #         print(L[k], end=" ", sep=" ")
        # print("\n\nX: ")
        # for k in range(X.shape[0]):
        #     if k % 21 == 0:
        #         print("\n", X[k], end=" ", sep=" ")
        #     else:
        #         print(X[k], end=" ", sep=" ")
        print("done!")
        #print("cnt=",cnt)

        return  np.around(sm_feat_list, 0), mm_feat_list
