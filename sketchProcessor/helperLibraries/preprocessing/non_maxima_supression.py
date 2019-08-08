import numpy as np


def nmsCris(boxes, overlapThresh=0.1):
    # This function creates new larger bounting boxes out of overlapping ones
    if len(boxes) == 0:
        return []
        # initialize the list of picked indexes

    pick = []
        # grab the coordinates of the bounding boxes
    x1 = boxes[:, 0]
    y1 = boxes[:, 1]
    x2 = boxes[:, 2]
    y2 = boxes[:, 3]

    # compute the area of the bounding boxes and sort the bounding
    # boxes by the bottom-right y-coordinate of the bounding box
    area = (x2 - x1 + 1) * (y2 - y1 + 1)
    idxs = np.argsort(y2)
    newBoxes= []
    # keep looping while some indexes still remain in the indexes
    # list
    while len(idxs) > 0:
        # grab the last index in the indexes list, add the index
        # value to the list of picked indexes, then initialize
        # the suppression list (i.e. indexes that will be deleted)
        # using the last index
        last = len(idxs)
        i = idxs[0]
        pick.append(i)
        suppress = [0]
        # loop over all indexes in the indexes list
        for pos in range(1, last):
            # grab the current index
            j = idxs[pos]

            # find the largest (x, y) coordinates for the start of
            # the bounding box and the smallest (x, y) coordinates
            # for the end of the bounding box
            xx1 = max(x1[i], x1[j])
            yy1 = max(y1[i], y1[j])
            xx2 = min(x2[i], x2[j])
            yy2 = min(y2[i], y2[j])

            # compute the width and height of the bounding box
            w = max(0, xx2 - xx1 + 1)
            h = max(0, yy2 - yy1 + 1)

            # compute the ratio of overlap between the computed
            # bounding box and the bounding box in the area list
            overlap = float(w * h) / area[j]

            # if there is sufficient overlap, add the bounding box to the suppress  list

            if overlap > overlapThresh:
                suppress.append(pos)

        # At this point I have found all the overlapping boxes
        # Take the minimum upper left coordintes and the maximum
        # lower right coordinates of the overlapping bounding boxes to generate a new bounding box,
        # once this new regions is created we can delete the overlapping bounding boxes
        sidx = idxs[suppress]
        oBoxes = boxes[sidx]
        xN1 = min(oBoxes[:, 0])
        yN1 = min(oBoxes[:, 1])
        xN2 = max(oBoxes[:, 2])
        yN2 = max(oBoxes[:, 3])
        newBox = (xN1, yN1, xN2, yN2)
        idxs = np.delete(idxs, suppress)
        newBoxes.append(newBox)
    return np.array(newBoxes)




def non_max_suppression_fast_area(boxes, overlapThresh):
    # This function sorts the bounding boxes according to their area and eliminates the boxes whose overlapping area
    # in greater than the overlapThresh value. This function is usually applied after the nmsCris function to get rid of small artifacts

    # if there are no boxes, return an empty list
    if len(boxes) == 0:
        return []
    # added
    boxes = np.array(boxes)
    # if the bounding boxes integers, convert them to floats --
    # this is important since we'll be doing a bunch of divisions
    if boxes.dtype.kind == "i":
        boxes = boxes.astype("float")

    # initialize the list of picked indexes
    pick = []

    # grab the coordinates of the bounding boxes
    x1 = boxes[:, 0]
    y1 = boxes[:, 1]
    x2 = boxes[:, 2]
    y2 = boxes[:, 3]

    # compute the area of the bounding boxes and sort the bounding
    # boxes by area
    area = (x2 - x1 + 1) * (y2 - y1 + 1)
    idxs = np.argsort(area)

    # keep looping while some indexes still remain in the indexes
    # list
    while len(idxs) > 0:
        # grab the last index in the indexes list and add the
        # index value to the list of picked indexes
        last = len(idxs) - 1
        i = idxs[last]
        pick.append(i)

        # find the largest (x, y) coordinates for the start of
        # the bounding box and the smallest (x, y) coordinates
        # for the end of the bounding box
        xx1 = np.maximum(x1[i], x1[idxs[:last]])
        yy1 = np.maximum(y1[i], y1[idxs[:last]])
        xx2 = np.minimum(x2[i], x2[idxs[:last]])
        yy2 = np.minimum(y2[i], y2[idxs[:last]])

        # compute the width and height of the bounding box
        w = np.maximum(0, xx2 - xx1 + 1)
        h = np.maximum(0, yy2 - yy1 + 1)

        # compute the ratio of overlap
        overlap = (w * h) / area[idxs[:last]]

        # delete all indexes from the index list that have
        idxs = np.delete(idxs, np.concatenate(([last],
                                               np.where(overlap > overlapThresh)[0])))

    # return only the bounding boxes that were picked using the
    # integer data type
    return boxes[pick].astype("int")