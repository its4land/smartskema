import numpy as np
import cv2
import os
from pathlib import Path

from sketchProcessor.SketchClassification import HandStroke
from sketchProcessor.helperLibraries.utils import draw
from sketchProcessor.helperLibraries.utils import simple_obj_det as sd
from sketchProcessor.helperLibraries.utils import sketch_segmentation as ss
import svgutils



def distance(pointA, pointB):
    # Calculates the distance between two points
    deltaXS = (pointA[0] - pointB[0]) ** 2
    deltaYS = (pointA[1] - pointB[1]) ** 2
    distance = (deltaXS + deltaYS) ** 0.5
    return distance

def minimumDistance(point, contour):
    # This function retrieves the minimum ditance between a point an a contour which contains several points
    # Expects an object of the type contour which is defined by the cv2 library and a point which is a list containing 2
    # values x and y
    # Lopping through all the points within the contour
    for i in range(len(contour)):
        pointContour = [contour[i][0][0], contour[i][0][1]]
        dist = distance(point, pointContour)
        if i == 0:
            minimumDist = dist
        else:
            if dist < minimumDist:
                minimumDist = dist
    return minimumDist


def sortStrokes(prediction, strokeList):
    # prediction : object containing the centroid coordinates and the label of the predicted symbols.
    # strokeList : list of HandStroke objects. Each HandStroke object contains a unique contour.

    # Sorts the strokes according to their minimum distances with respect to a prediction
    # , hence, the first stroke will be the one that is closer to the prediction centroid.
    # We store the information contained inside the prediction object into the first element of the stroke list

    minimumDistancesList = []
    contourSet = []
    for s in strokeList:
        minimumDistancesList.append(minimumDistance(prediction.c, s.contour))
    minimumDistancesList = np.array(minimumDistancesList)
    sorted_indexes = np.argsort(minimumDistancesList)
    minimumDistancesList = minimumDistancesList[sorted_indexes]
    strokeList = strokeList[sorted_indexes]
    strokeList[0].label = prediction.l
    strokeList[0].color = prediction.color
    strokeList[0].addLabel(prediction.l)
    strokeList[0].addDistance(minimumDistancesList[0])
    return strokeList


def strokeClassification(image, contours, predictions, knn = 3):
    # Returns a set of objects of the type HandStroke which are classified according to the input predictions
    strokeList = []
    for (index, c) in enumerate(contours):
        # A list containing a set of HandStroke objects is created
        strokeList.append(HandStroke(index, c, "", (255,255,0)))

    imageCopy = image.copy()
    strokeList = np.array(strokeList)

    for (index,p) in enumerate(predictions):
        center = p.c
        label = p.l
        color = p.color
        print('Finding the nearest contours for p ' + label)
        cv2.circle(imageCopy, (center[0],center[1]), 8, color, -1)
        # strokes are sorted according to their distance to the prediction "p", moreover, their values are updated
        strokeList = sortStrokes(p, strokeList)
    # Some strokes might be classified more than once by different predictions, to break ambiguities we apply the resolveLabel method
    for stroke in strokeList:
        stroke.resolveLabel()
    return strokeList


def completeClassification(image, svg_file_path):
    # This function classifies the setch strokes according to the allocated stamps
    draw.showImage(image)
    # Detecting symbols
    predictions = sd.detectSymbols(image, symbolType='stamp', method='t', filterColor='red')
    beacons = sd.beaconCoordinates(predictions)
    #if len(beacons)>0:
    beaconsSVG = getBeacons(beacons, image)
    # Here we get rid of the symbols, clean and segmantate the sketch to obtain a clean image,
    # Contours are then extracted from this clean image
    contours = ss.segmentateSketch(image, 'skeleton')  #

    # To provide a better overview of the extracted contours we display the five larger ones one by one
    #draw.drawContoursOneByOne(contours, image, numberOfContours=5)

    # We classify the contours based on their distances with respect to the detected symbols
    strokeList = strokeClassification(image, contours, predictions, knn=1)
    draw.drawHandStrokes(image, strokeList,oneByOne=False)

    strokesToSVG(strokeList, beaconsSVG,image, svg_file_path)

    return strokeList


def getBeacons(beacons, image):
    h, w, _ = image.shape
    if not os.path.exists("SVG"):
        os.makedirs("SVG")

    name = beacons[0].l
    color = beacons[0].color
    internal = ''

    for index, b in enumerate(beacons):
        (x, y) = b.c
        center = (int(x), int(y))
        radius = int(5)
        internal += '<circle cx="{0}" cy="{1}" r="{2}" style="fill:rgb({3},{4},{5});' \
                    ' stroke:rgb({3},{4},{5}); stroke-width:5"' \
                    ' id="{6}" smart_skema_type="{7}" hidden_="" name="" description=""/>' \
            .format(str(center[0]), str(center[1]), str(radius), str(color[2]),
                    str(color[1]), str(color[0]), index, name.lower())

    return internal


def strokeToSVG(stroke, image, stroke_id='0'):
    h, w, _ = image.shape
    if not os.path.exists("SVG"):
        os.makedirs("SVG")
    contourTest = stroke.contour
    name = stroke.label
    color = stroke.color
    internal = ''
    if name =='':
        return None
    elif (name in ['Boma']):
        hull = cv2.convexHull(contourTest)
        internal += '<polygon points="'

        for p in hull:
            x = p[0][0]
            y = p[0][1]
            # #

            internal += str(x) + ',' + str(y) + ' '

        internal += '" style="fill: rgb(' + str(color[2]) + ',' + str(color[1]) + ',' + str(color[0]) + ');' \
                                                                                                            ' stroke:rgb(' + str(
                color[2]) + ',' + str(color[1]) + ',' + str(color[0]) + ');stroke-width:3"' \
                                                                        ' id="' + stroke_id + '" smart_skema_type="' + name.lower() + '"  hidden_="" name="" description=""/>'

        #     internal += '(' + str(x) + ',' + str(y) + ') '
        #
        # (x, y), radius = cv2.minEnclosingCircle(contourTest)
        # center = (int(x), int(y))
        #
        # radius = int(radius)
        # internal += '<circle cx="{0}" cy="{1}" r="{2}" style="fill:rgb({3},{4},{5});' \
        #             ' stroke:rgb({3},{4},{5}); stroke-width:5"'\
        #             ' id="{6}" smart_skema_type="{7}"  hidden_="" name="" description=""/>'\
        #             .format(str(center[0]), str(center[1]), str(radius), str(color[2]),
        #                                         str(color[1]), str(color[0]), stroke_id, name.lower())
    elif (name in ['House', 'Olopololi', 'Oltinka', 'School', 'WaterTank']):
        rect = cv2.minAreaRect(contourTest)
        box = cv2.boxPoints(rect)
        box = np.int0(box)
        internal += '<polygon points="'

        for p in box:

            x = p[0]
            y = p[1]
            # #
            internal += str(x) + ',' + str(y) + ' '
        internal += '" style="fill: rgb(' + str(color[2]) + ',' + str(color[1]) + ',' + str(color[0]) + ');' \
                    ' stroke:rgb(' + str(color[2]) + ',' + str(color[1]) + ',' + str(color[0]) + ');stroke-width:3"'\
                    ' id="' + stroke_id + '" smart_skema_type="' + name.lower() + '"  hidden_="" name="" description=""/>'

    elif name in ['Triangle']:
        hull = cv2.convexHull(contourTest)
        internal += '<polygon points="'

        for p in hull:
            x = p[0][0]
            y = p[0][1]
            # #
            internal += str(x) + ',' + str(y) + ' '
        internal += '" style="fill: rgb(' + str(color[2]) + ',' + str(color[1]) + ',' + str(color[0]) + ');' \
                                                                                                        'stroke:rgb(' + str(
            color[2]) + ',' + str(color[1]) + ',' + str(color[0]) + ');opacity:0.8;stroke-width:3"' \
                                                                    ' id="' + stroke_id + '" smart_skema_type="' + 'boundary' + '"  hidden_="" name="" description=""/>'
        print('ADDED BOUNDARY TO SVG')
    elif name in ['Mountain', 'Marsh']:
        hull = cv2.convexHull(contourTest)
        internal += '<polygon points="'

        for p in hull:

            x = p[0][0]
            y = p[0][1]
            # #
            internal += str(x) + ',' + str(y) + ' '
        internal += '" style="fill: rgb(' + str(color[2]) + ',' + str(color[1]) + ',' + str(color[0]) + ');' \
                    'stroke:rgb(' + str(color[2]) + ',' + str(color[1]) + ',' + str(color[0]) + ');opacity:0.8;stroke-width:3"'\
                    ' id="' + stroke_id + '" smart_skema_type="' + name.lower() + '"  hidden_="" name="" description=""/>'

    else:
        internal += '<polyline points="'
        for p in contourTest:
            x = p[0][0]
            y = p[0][1]
                # #
            internal += str(x) + ',' + str(y) + ' '
        internal += '" style="fill:none;stroke:rgb(' + str(color[2]) + ',' + str(color[1]) + ',' + str(color[0]) + ');stroke-width:3"'\
                    ' id="' + stroke_id + '" smart_skema_type="' + name.lower() + '"  hidden_="" name="" description=""/>'
    return internal



def strokesToSVG(strokes, beacons,image, svg_file_path):
    h, w, _ = image.shape
    internal = ''
    #f = open('SVG//' + str(fileName) + '.svg', 'w+')
    svgPath = Path(svg_file_path)
    print("till here is file...:",svgPath)
    #svgPath = Path('./static/data/SVG') / (str(fileName) + '.svg')
    internal = '<svg width="' + str(w) + '" height="' + str(h) + '" xmlns="http://www.w3.org/2000/svg">'
    for (i,s) in enumerate(strokes):

        if s.label !='':
            internal += strokeToSVG(s, image, str(i))

    # if(len(beacons )>0):
    #     internal += beacons
    #     print ( "I added beacons")

    internal += '</svg>'
    #f.write(internal)
    #f.write('</svg>')
    #f.close()

    svgPath.write_text(internal)
    return svgPath.as_posix()


