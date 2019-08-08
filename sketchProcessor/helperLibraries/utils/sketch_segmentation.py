import numpy as np
from skimage.morphology import skeletonize
from skimage import img_as_ubyte
from sketchProcessor.helperLibraries.utils import draw
from sketchProcessor.helperLibraries.utils import color_detection as cd
import cv2
import os

def get_contour_perimeter(contours):
    # Returns the perimiters of all the contours as list
    all_perimeter = []
    for cnt in contours:
        perimeter = cv2.arcLength(cnt,True)
        all_perimeter.append(perimeter)
    return all_perimeter


def remove_small_contours(contours):
    # Deletes small contours that are considered to be noise by applying heuristics
    # In other words contours whose perimeter is not at least 2 % of the four longest contours average perimiter are eliminated
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


def getSkeleton (image):
    # Applies a skeletonization algorithm, thus, transforming all the strokes inside the sketch into one pixel width lines

    grayscaled = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    #grayscaled = cv2.medianBlur(grayscaled, 5)
    ret, threshold = cv2.threshold(grayscaled, 200, 255, cv2.THRESH_BINARY)
    draw.showImage(threshold)
    threshold = cv2.bitwise_not(threshold)
    threshold[threshold == 255] = 1
    skeleton = skeletonize(threshold)
    skeleton = img_as_ubyte(skeleton)
    return skeleton

def getContours(image, method):
    if method == 'skeleton':
        skeletonImage = getSkeleton(image)
        #draw.showImage(skeletonImage)
        im2, contours, hierarchy = cv2.findContours(skeletonImage, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        sorted_contours_final = remove_small_contours(contours)
        return sorted_contours_final
    elif method == 'normal':
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray = cv2.medianBlur(gray, 5)
        edged = cv2.Canny(gray, 50, 200)
        im2, contours, hierarchy = cv2.findContours(edged.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        sorted_contours_final = remove_small_contours(contours)
        return sorted_contours_final
    else:
        print('Method not available')


def cleanSymbols(image, colorSpace = 'hsv', color = 'red'):
    # Remove symbols which have the specified color from the input image

    clone = image.copy()
    hsvMin = None
    hsVMax = None
    rgbMin = None
    rgbMax = None
    min = None
    max = None
    if color == 'blue':
        # Thresholds were calculated  using the imutils library

        hsvMin = (44,40,22)
        hsVMax = (136,130,255)

        rgbMin = (174,79,0)
        rgbMax = (255,166,219)

    elif color == 'red' :
        hsvMin = (170,15,0)
        hsVMax = (255,255,255)
        rgbMin = (0,0,189)
        rgbMax = (232,199,255)

    else :
        print('This color has not been included')
        return None

    if colorSpace == 'hsv':
        min = hsvMin
        max = hsVMax
    else:
        min = rgbMin
        max = rgbMax
    return cd.cleanByColor(clone, colorSpace, min, max)


def segmentateSketch(image, method = 'skeleton'):
    # Returns the main contours inside an image. In case of selecting the skeleton method
    # all the sketch strokes are transformed into one pixel width lines
    imageClone = image.copy()
    draw.showImage(imageClone)
    imageWithoutStamps = cleanSymbols(imageClone,colorSpace = 'hsv', color = 'red')
    #draw.showImage(imageWithoutStamps)
    contours = getContours(imageWithoutStamps, method)
    return contours

