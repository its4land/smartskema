#orangeLower = (0, 172, 0)
#orangeUpper = (20, 255, 255)
# import the necessary packages
import cv2
import imutils
import numpy as np
from sketchProcessor.helperLibraries.utils import simple_obj_det as sd
from sketchProcessor.helperLibraries.utils import draw
from sketchProcessor.helperLibraries.utils import  sketch_segmentation as ss
from sketchProcessor.helperLibraries.preprocessing import non_maxima_supression as nms


def padding(image, increment,x1, y1, x2, y2):
    #Applies padding on the input coordinates (x1, y1, x2, y2)
    newX1 = x1
    newY1 =y1
    newX2 = x2
    newY2 =y2
    h,w,_= image.shape
    if x1 - increment > 0:
        newX1 = x1 - increment
    if y1 - increment > 0 :
        newY1 = y1 - increment
    if x2  + increment < w :
        newX2 = x2 + increment
    if y2 + increment < h:
        newY2 = y2 + increment
    return (newX1, newY1, newX2, newY2)

def padBoxes(image, boxes, increment = 10):
    #Applies padding on a set of bounding boxes
    pBoxes = []
    for b in boxes:
        (x1, y1, x2, y2) = b
        (newX1, newY1, newX2, newY2) = padding(image, increment, x1, y1, x2, y2)
        pBoxes.append( (newX1, newY1, newX2, newY2))
    return pBoxes


def getContourBoundlingBox(contours, image = None):
    # Computes the minimum surrounding bounding boxes of a set of contours
    boundingBoxes = []
    blank_image = np.zeros((image.shape[0], image.shape[1], 3))
    for sc in contours:
        cv2.drawContours(blank_image, [sc], -1, (255, 0, 0), 3)
        x, y, w, h = cv2.boundingRect(sc)

        if (image is not None):
            (x1, y1, x2, y2) = padding(image, 7, x, y, x + w, y + h)
            boundingBoxes.append((x1, y1, x2, y2))
        else:
            boundingBoxes.append((x, y, x + w, y + h))
    return boundingBoxes

def displayBoundingBoxes(image, boundingBoxes, path = "./",name = "test"):
    clone = image.copy()
    for box in boundingBoxes:
        (x1, y1, x2, y2) = box
        cv2.rectangle(clone, (x1, y1), (x2, y2), (226,43,138), 2)
    cv2.namedWindow('image', cv2.WINDOW_NORMAL)
    cv2.resizeWindow('image', 900, 900)
    cv2.imshow("image", clone)
    cv2.waitKey()
    cv2.destroyAllWindows()
    cv2.imwrite(path + str(name) + '.bmp', clone)


def generateRegions(boxes, overlapThresh=0.3):
    #Explores the input boxes and join those whose overlapping area exceeds overlapThresh
    regions = boxes.copy()
    iteration =1
    while(True):
        #print("Interation :", iteration)
        previousState = len(regions)
        regions = nms.nmsCris(regions, overlapThresh)
        currentState = len(regions)
        if (previousState==currentState):
            break
        iteration+=1
    return regions


def regionDetectionColor(image, filter = 'hsv', color = 'red', display = False):
    # Retrieves bounding boxes that surround the image objects that have a red or a dark blue color (usually the stamps)
    hsvMin = None
    hsVMax = None
    rgbMin = None
    rgbMax = None
    # Defining the number of dilation iterations and the dilation kernel
    iterations = 1
    kernel = np.ones((3, 3), np.uint8)
    h,w,c = image.shape
    if w  > 6000 or h > 6000:
        # If one of sides in the input image is greater than 6000 pixels
        # we apply larger kernels and more iterations
        iterations =4
        kernel = np.ones((5, 5), np.uint8)

    if color == 'blue':
        # These values were determined manually using the range-detector script in the imutils  library
        hsvMin = (103, 28, 144)
        hsVMax = (166, 255, 255)        #
        rgbMin = (174,79,0)
        rgbMax = (255,166,219)

    else :
        hsvMin = (170,15,0)
        hsVMax = (255,255,255)
        rgbMin = (0,0,189)
        rgbMax = (232,199,255)
    clone = image.copy()
    mask = None
    blank_image = np.zeros((image.shape[0], image.shape[1], 3))

    # Here, we filter the input image, thus, creating a mask that only contains the elements whose RGV or HSV values are inside
    # the stablished ranges

    if (filter == 'hsv'):
        clone = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        mask = cv2.inRange(clone, hsvMin, hsVMax)
        mask = cv2.dilate(mask, kernel, iterations=iterations)
        if display:
            draw.showImage(mask)
    else:
        mask = cv2.inRange(clone, rgbMin, rgbMax)
        mask = cv2.dilate(mask, kernel, iterations=iterations)
        if display:
            draw.showImage(mask)
    # We find contours on the masked image.
    cnts = cv2.findContours(mask.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = cnts[0] if imutils.is_cv2() else cnts[1]
    clone = image.copy()
    cnts = ss.remove_small_contours(cnts)
    clone = image.copy()

    #Generating bounding boxes out of the extracted contours
    bBoxes2 = getContourBoundlingBox(cnts, image=image)
    #Merging boxes whose overlapping area is at leat 15%
    bBoxes4 = generateRegions(np.array(bBoxes2), 0.15)
    # After merging some artifacts or redundant bounding boxes appear
    # Here we sort the bounding boxes by area and eliminate those whose overlapping area is greater than 10%
    bBoxes5 = nms.non_max_suppression_fast_area(bBoxes4, 0.1)
    # Bounding boxes are padded to increase the model accuracy
    boxes6 = padBoxes(image, bBoxes5, increment=10)

    if display :
        # Showing step by step the whole procedure
        displayBoundingBoxes(image, bBoxes2, path="./", name="test")

        displayBoundingBoxes(image, bBoxes4 , path="./", name="test")

        displayBoundingBoxes(image, bBoxes5, path="./", name="test")

        displayBoundingBoxes(image, boxes6, path="./", name="test")
    return boxes6


def cleanByColor (image, colorSpace, minValue, maxValue):
    # Removes image sections whose color spaces are inside the minValue and maxValue range
    # This function is usually used to remove the image symbols
    iterations = 1
    kernel = np.ones((3, 3), np.uint8)
    h, w, c = image.shape
    if (w > 6000) or (h > 6000):
        iterations = 4
        kernel = np.ones((5, 5), np.uint8)

    clone = image.copy()
    if (colorSpace == 'hsv'):
        clone = cv2.cvtColor(clone, cv2.COLOR_BGR2HSV)

    mask = cv2.inRange(clone, minValue, maxValue)
    kernel = np.ones((5, 5), np.uint8)
    newMask = cv2.dilate(mask, kernel, iterations=iterations)
    invertedMask = cv2.bitwise_not(newMask)
    fg = cv2.bitwise_or(image, image, mask=invertedMask)
    background = np.full(image.shape, 255, dtype=np.uint8)
    bk = cv2.bitwise_or(background, background, mask=newMask)
    # combine foreground+background
    final = cv2.bitwise_or(fg, bk)
    return final




