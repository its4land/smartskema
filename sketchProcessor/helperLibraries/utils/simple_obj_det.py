# import the necessary packages
from keras.applications import imagenet_utils
import imutils
import json
import time
import cv2
import numpy as np
from keras.models import load_model
from sketchProcessor.config import detection_config as config
from sketchProcessor.helperLibraries.preprocessing import ImageToArrayPreprocessor
from sketchProcessor.helperLibraries.preprocessing import MeanPreprocessor
from sketchProcessor.helperLibraries.preprocessing import PreserveRatio
from sketchProcessor.helperLibraries.preprocessing.preprocessimage import PreprocessImage
from sketchProcessor.helperLibraries.utils import color_detection as cd
from sketchProcessor.SketchClassification.Prediction import Predicton
from sketchProcessor.SketchClassification.HandStroke import HandStroke
from sketchProcessor.helperLibraries.utils import draw


def printTime(start, end):
	temp = end - start
	hours = temp // 3600
	temp = temp - 3600 * hours
	minutes = temp // 60
	seconds = temp - 60 * minutes
	print('%d:%d:%d' % (hours, minutes, seconds))

def classify_batch(model, batchROIs, batchLocs, labels, minProb=0.5, top=10, dims=(224, 224)):
	# pass our batch ROIs through our network and decode the
	# predictions
	preds = model.predict(batchROIs)
	P = imagenet_utils.decode_predictions(preds, top=top)

	# loop over the decoded predictions
	for i in range(0, len(P)):
		for (_, label, prob) in P[i]:
			# filter out weak detections by ensuring the
			# predicted probability is greater than the minimum
			# probability
			if prob > minProb:
				# grab the coordinates of the sliding window for
				# the prediction and construct the bounding box
				(pX, pY) = batchLocs[i]
				box = (pX, pY, pX + dims[0], pY + dims[1])

				# grab the list of predictions for the label and
				# add the bounding box + probability to the list
				L = labels.get(label, [])
				L.append((box, prob))
				labels[label] = L

	# return the labels dictionary
	return labels


def addColors(predictionList):
    colors = {'Boma': (0, 100, 255), 'Mountain': (0,255,0), 'Marsh' : (100, 200, 20),'Oltinka': (92, 92, 205), 'Olopololi': (139, 0, 139), 'River' : (255,0,0), 'WaterTank': (200,20,0), 'Triangle' : (0, 0, 255), 'School': (85,10,230)}
    for p in predictionList:
        if p.l in colors.keys():
            p.color = colors[p.l]

def symbolDetection(image, finalBoxes, preprocessor, model, modelLabels, colors):
	# This function receives as input an image and a set of bounding boxes, which
	# are used to extract regions. These regions are parsed to the input model which generates as output a prediction
	# The function retrieves those predictions that are likely to contain a symbol. A prediction contains a bounding box and the associated probability
	pData = []
	predictedBoxes = {}
	predictionList = []
	clone = image.copy()

	# In first place we evaluate the ratio of the bounding boxes.
	# we only consider those whose horizontal and vertical ratio are greater than 10
	# Extracting regions from bounding boxes with smaller ratios crash the code
	for box in finalBoxes:
		(x1, y1, x2, y2) = box
		rH = (x2-x1)/(y2-y1)*100
		rV = (y2 - y1)/(x2 - x1)*100
		if (rH >10 and rV>10):
			# Regions are extracted from the image using the bounding boxes that satisfy the ratio condition
			roi = image[y1:y2, x1:x2]
			pRoi = preprocessor.preprocess(roi)[0]
			pData.append(pRoi)
	pData = np.array(pData)
	# Regions are parsed through the network to obtain prediction
	predictions = model.predict(pData, batch_size=64)
	# The network will predict probabilities for each of the classes inside the taining set, hence, we only keep the maximum probability
	bestPredIndexes = predictions.argmax(axis=1)
	for (index, bestPredIndex) in enumerate(bestPredIndexes):
		bestProb = predictions[index][bestPredIndex] * 100
		print(bestPredIndex, bestProb)
		label = modelLabels[bestPredIndex]
		fontColor = colors[bestPredIndex]
		# Probabilities greater than 60% and not corresponding to the background class are considered to be a symbol
		# , therefore, for these predictions we draw the associated bounding boxes.
		if bestProb > 60 and label != 'Background':
			(x1, y1, x2, y2) = finalBoxes[index]
			L = predictedBoxes.get(label, [])
			L.append((x1, y1, x2, y2))
			predictedBoxes[label] = L
			cv2.rectangle(clone, (x1, y1), (x2, y2), fontColor, 2)
			font = cv2.FONT_HERSHEY_SIMPLEX
			bottomLeftCornerOfText1 = (x1, y1 - 40)
			bottomLeftCornerOfText2 = (x1, y1 - 10)
			fontScale = 1
			p = Predicton((x1, y1, x2, y2), bestProb, label)
			predictionList.append(p)
			lineType = 2
			cv2.putText(clone, str(label),
						bottomLeftCornerOfText1,
						font,
						fontScale,
						(0, 0, 0),
						lineType)
			cv2.putText(clone, str(round(bestProb, 2)) + '%',
						bottomLeftCornerOfText2,
						font,
						fontScale,
						(0, 0, 0),
						lineType)
	addColors(predictionList)
	# cv2.namedWindow('image', cv2.WINDOW_NORMAL)
	# cv2.resizeWindow('image', 1000, 1000)
	# cv2.imshow("image", clone)
	# cv2.waitKey()
	# cv2.destroyAllWindows()
	cv2.imwrite('./detection.bmp',clone)

	return predictionList

def completeDetection(image, model, preprocessor, modelLabels, colors, method='t', color='blue'):
	# Executes the input model to detect symbols on the input image
	start = time.time()
	clone = image.copy()
	regions = None
	# Instead of using the time wonsuming sliding window approach, we apply the regionDetectionColor method to extract
	# regions that are likely to contain the objects of interest
	regions = cd.regionDetectionColor(image, filter='hsv', color=color, display=False)
	# regions are parsed to the network to obtain predictions
	predictedBoxes = symbolDetection(clone, regions, preprocessor, model, modelLabels, colors)
	end = time.time()
	printTime(start, end)
	return predictedBoxes


def detectSymbols(image, symbolType='stamp', method='t', filterColor = 'red'):
	# Wrapper function that detects symbols allocated inside an image

	clone = image.copy()

	# Defining model and image preprocessing parameters
	start = time.time()
	predictedBoxes = {}
	means_stamp = json.loads(open(config.DATASET_MEAN_STAMP).read())
	means_hand_drawn = json.loads(open(config.DATASET_MEAN_HAND_DRAWN).read())
	sp = PreserveRatio(64, 64)
	iap = ImageToArrayPreprocessor()
	mp_stamps = MeanPreprocessor(means_stamp["R"], means_stamp["G"], means_stamp["B"])
	mp_hand_drawn = MeanPreprocessor(means_hand_drawn["R"], means_hand_drawn["G"], means_hand_drawn["B"])


	if (symbolType == 'stamp'):
		# Load Network
		preprocessors = [sp, mp_stamps, iap]
		preprocessor = PreprocessImage(preprocessors=preprocessors)
		modelPath = './sketchProcessor/output/stampNetwork.hdf5'
		model = load_model(modelPath)
		labels = config.LABELS_STAMPS
		colors = ((255, 255, 255), (0, 0, 255), (92, 92, 205), (255, 0, 0), (0, 0, 0), (0, 255, 0), (139, 0, 139),
					  (211, 0, 148), (0, 255, 0), (0, 255, 255), (255, 0, 0))
		predictedBoxes= completeDetection(image, model, preprocessor, labels, colors, 'threshold', filterColor)

	# I fwe do not want to detect stamps, we load the model trained on hand drawn symbols
	else:
		preprocessors = [sp, mp_hand_drawn, iap]
		preprocessor = PreprocessImage(preprocessors=preprocessors)
		modelPath = './sketchProcessor/output/handDrawnNetwork.hdf5'
		model = load_model(modelPath)
		labels = config.LABELS_HAND_DRAWN
		colors = ((255, 255, 255), (0, 0, 255), (92, 92, 205), (255, 0, 0), (0, 0, 0), (0, 255, 0), (139, 0, 139),
					  (211, 0, 148), (0, 255, 0), (0, 255, 255), (255, 0, 0), (0, 255, 0))
		predictedBoxes = completeDetection(image, model, preprocessor, labels, colors, 'threshold', filterColor)


	cv2.imwrite('./output/test.bmp',clone)
	return  predictedBoxes

def beaconCoordinates( predictions):
	#predictions = detectSymbols(image, symbolType='stamp', method='t', filterColor='red')
	beacons = []
	for p in predictions:
		if p.l == "Triangle":

			beacons.append(p)
	return beacons

# image = cv2.imread('./testData/sketchMaps/stamps/GoodOne.bmp')
# draw.showImage(image)
#
# predictions = detectSymbols(image, symbolType='stamp', method='t', filterColor='red')
#
# beaconCoordinates(predictions)

# beacons