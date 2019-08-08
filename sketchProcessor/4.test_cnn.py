
from sketchProcessor.config import cnn_config as config
from sketchProcessor.helperLibraries.preprocessing import ImageToArrayPreprocessor
from sketchProcessor.helperLibraries.preprocessing import PreserveRatio
from sketchProcessor.helperLibraries.preprocessing import MeanPreprocessor
from sketchProcessor.helperLibraries.preprocessing import CropPreprocessor
from sketchProcessor.helperLibraries.utils.ranked import  rank5_accuracy
from sketchProcessor.helperLibraries.utils import draw
from sketchProcessor.helperLibraries.io import HDF5DatasetGenerator
from sketchProcessor.helperLibraries.datasets import SimpleDatasetLoader
from keras.models import load_model
from sklearn.metrics import classification_report
import json
import os
import random
import cv2


# load the RGB means for the training set
means = json.loads(open(config.DATASET_MEAN).read())
sp = PreserveRatio(64, 64)
cp = CropPreprocessor(64, 64)
iap = ImageToArrayPreprocessor()
mp = MeanPreprocessor(means["R"], means["G"], means["B"])

preprocessors = [sp, mp,iap]
# load the pretrained network
print("[INFO] loading model...")
model = load_model('sketchProcessor/output/CNN_stamps.model')
# initialize the testing dataset generator, then make predictions on
# the testing data
print("[INFO] predicting on test data (no crops)...")
testGen = HDF5DatasetGenerator(config.TEST_HDF5, 64, preprocessors=[mp, iap], classes=config.NUM_CLASSES)
testGen.classes
names=testGen.db["label_names"]
predictions = model.predict_generator(testGen.generator(), steps=testGen.numImages // 64, max_queue_size=64 * 2)

# compute the rank-1 and rank-5 accuracies
(rank1, rank5) = rank5_accuracy(predictions, testGen.db["labels"])
print("[INFO] rank-1: {:.2f}%".format(rank1 * 100))
print("[INFO] rank-5: {:.2f}%".format(rank5 * 100))
ground_truth = testGen.db["labels"][:]
if(len(ground_truth)> len(predictions)):
	ground_truth = ground_truth[:len(predictions)]
else:
	predictions = predictions[:len(ground_truth)]
print(classification_report(ground_truth, predictions.argmax(axis=1), target_names=names))
testGen.close()

#If you want to test the model with other sample images please store them into the following path
# samples should be in the format imabeClass.imageNumber.extension for example Boma.12.bmp
inputPath = "./sketchProcessor/data/testSamples/"

names = ['Background', 'Boma', 'House', 'Marsh', 'Mountain','Olopololi', 'Oltinka', 'River','School', 'Triangle', 'WaterTank']

draw.displayPredictions(inputPath,  preprocessors, model, names, nPred = 10)
