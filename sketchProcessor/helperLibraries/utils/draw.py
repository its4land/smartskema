import cv2
import numpy as np
import os
import random
from sketchProcessor.helperLibraries.datasets import SimpleDatasetLoader

def showImage(image):
    return
    # factor = 1600/float(max(image.shape[:]))
    # newWidth =image.shape[0]*factor
    # newHeight = image.shape[1]*factor
    # cv2.namedWindow('image', cv2.WINDOW_NORMAL)
    # cv2.resizeWindow('image', int(newHeight), int(newWidth))
    # cv2.imshow('image', image)
    # cv2.waitKey(0)
    # cv2.destroyAllWindows()

def drawPredictions(predictions, image, method = 'box'):
    clone = image.copy()

    fontScale = 1
    lineType = 2
    font = cv2.FONT_HERSHEY_SIMPLEX
    for p in predictions:
        if method == 'box':
            (x1, y1, x2, y2) = p.bBox
            bottomLeftCornerOfText1 = (x1, y1 - 40)
            bottomLeftCornerOfText2 = (x1, y1 - 10)
            cv2.putText(clone, str(p.l), bottomLeftCornerOfText1, font, fontScale, (0, 0, 0), lineType)
            cv2.putText(clone, str(round(p.p, 2)) + '%', bottomLeftCornerOfText2, font, fontScale, (0, 0, 0), lineType)
            cv2.rectangle(clone, (x1, y1), (x2, y2), p.color, 2)
        else :
            center = p.c
            x1 = center[0]
            y1 = center[1]
            bottomLeftCornerOfText1 = (x1, y1 - 40)
            bottomLeftCornerOfText2 = (x1, y1 - 10)
            cv2.putText(clone, str(p.l), bottomLeftCornerOfText1, font, fontScale, (0, 0, 0), lineType)
            cv2.putText(clone, str(round(p.p, 2)) + '%', bottomLeftCornerOfText2, font, fontScale, (0, 0, 0), lineType)
            cv2.circle(clone, (x1, y1), 7, p.color, -1)
    cv2.namedWindow('image', cv2.WINDOW_NORMAL)
    cv2.resizeWindow('image', 900, 900)
    cv2.imshow("image", clone)
    cv2.waitKey()
    cv2.destroyAllWindows()
    return clone

def drawContoursBoundingBox(contours, image):
    blank_image = np.zeros((image.shape[0], image.shape[1], 3))
    b = []
    for sc in contours:
        cv2.drawContours(blank_image, [sc], -1, (255, 0, 0), 3)
        x, y, w, h = cv2.boundingRect(sc)
        cv2.rectangle(blank_image, (x, y), (x + w, y + h), (0, 255, 0), 2)
        b.append((x, y, x + w, y + h))
    showImage(blank_image)
    return b



def drawContours(contours, image):
    blank_image = np.zeros((image.shape[0], image.shape[1], 3))
    cv2.drawContours(blank_image, contours, -1, (0, 255, 0), 3)
    showImage(blank_image)



def get_contour_perimeter(contours):
    # returns the areas of all contours as list
    all_perimeter = []
    for cnt in contours:
        perimeter = cv2.arcLength(cnt,True)
        all_perimeter.append(perimeter)
    return all_perimeter


def remove_small_contours(contours):
    sorted_contours = sorted(contours, key=get_contour_perimeter, reverse=True)
    sorted_perimeters = get_contour_perimeter(sorted_contours)
    minimumPerimeter = 100
    if (len(sorted_perimeters)>4):
        meanMax = sum(sorted_perimeters[0:4])/4
        minimumPerimeter = meanMax*0.002
    for i in range(len(sorted_perimeters)):
        if sorted_perimeters[i] < minimumPerimeter:
            return sorted_contours[:i]
    return sorted_contours

def drawContoursOneByOne(contours, image, numberOfContours = 20):
    blank_image = np.zeros((image.shape[0], image.shape[1], 3))
    sorted_contours = sorted(contours, key=get_contour_perimeter, reverse=True)
    colors = [(0, 255, 0), (0, 0, 255)]
    for index, c in enumerate(sorted_contours):
        cv2.drawContours(blank_image, [c], -1, colors[index%2], 3)
        if index < numberOfContours:
            showImage(blank_image)


def displayBoundingBoxes(image, bBoxes):
    clone= image.copy()
    for (x1, y1, x2, y2) in bBoxes:
        cv2.rectangle(clone, (x1, y1), (x2, y2), (0, 0, 255), 2)
    cv2.namedWindow('image', cv2.WINDOW_NORMAL)
    cv2.resizeWindow('image', 1000, 1000)
    cv2.imshow("image", clone)
    cv2.waitKey()
    cv2.destroyAllWindows()


def drawHandStrokes(image, handStrokes , oneByOne = True):
    blank_image = np.zeros((image.shape[0], image.shape[1], 3),np.uint8)
    image = image.copy()
    for stroke in handStrokes:
        contours = stroke.contour
        color = stroke.color
        label = stroke.label
        #if(len(stroke.labels) > 0):
            #print('I was labeled as '+ str(label) + ' and I have ' + str(stroke.labels) )
        if (label == ''):
            cv2.drawContours(blank_image, contours, -1, (255,255,255), 1)
        else:
            cv2.drawContours(blank_image, contours, -1, color, 6)
            if oneByOne:
                showImage(blank_image)
    showImage(blank_image)
    return blank_image


def displayPredictions(inputPath,  preprocessors, model, classLabels, nPred=50):
	# Displays the network predictions of the samples stored inside the folder inputPath

	imgs = os.listdir(inputPath)
	paths = [inputPath + img for img in imgs]
	random.shuffle(paths)
	paths = paths[:nPred]
	dataLoader = SimpleDatasetLoader(preprocessors=preprocessors)
	(data, labels) = dataLoader.load(paths)
	print(type(data), data.shape, data.shape)
	probabilities = model.predict(data, batch_size=32)
	preds = probabilities.argmax(axis=1)

	for (index, p) in enumerate(paths):
		img = cv2.imread(p)
		cv2.putText(img, "1. Label: {}".format(classLabels[preds[index]]),(10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
		print("Label: {} Probability : ".format(classLabels[preds[index]]))
		print ("probabilities", probabilities[index][preds[index]])
		cv2.imshow("image", img)
		cv2.waitKey()
		cv2.destroyAllWindows()