
from sketchProcessor.config import detection_config as config
from sketchProcessor.helperLibraries.preprocessing import ImageToArrayPreprocessor
from sketchProcessor.helperLibraries.preprocessing import AspectAwarePreprocessor
from sketchProcessor.helperLibraries.preprocessing import PreserveRatio
from sketchProcessor.helperLibraries.preprocessing import MeanPreprocessor
from sketchProcessor.helperLibraries.preprocessing import CropPreprocessor
from sketchProcessor.helperLibraries.io import HDF5DatasetGenerator

from sketchProcessor.helperLibraries.datasets import DatasetLoader
from keras.models import load_model
import numpy as np
import progressbar
from sklearn.metrics import classification_report
import json
import os
import random
import cv2


def displayPredictions(inputPath, nPred, preprocessors, model, classLabels):
    imgs = os.listdir(inputPath)
    paths = [inputPath + img for img in imgs]
    random.shuffle(paths)
    if nPred < len (imgs) :
        paths = paths[:nPred]
    dataLoader = DatasetLoader(preprocessors=preprocessors)
    (data, labels) = dataLoader.load(paths)
    print(type(data), data.shape, data.shape)
    probabilities = model.predict(data, batch_size=32)
    for (index, p) in enumerate(paths):
        probability = probabilities[index]
        sorted_indexes = np.argsort(probability)
        sorted_indexes = sorted_indexes[::-1]
        n = np.array(classLabels)
        n = n[sorted_indexes]
        probability = probability[sorted_indexes]
        firstP = round(probability[0],4)*100
        secondP = round(probability[1],4 )*100
        firstL = n[0]
        secondL =n [1]
        img = cv2.imread(p)
        h, w, _ = img.shape
        blank_image = np.zeros((h, w*2 + 250, 3), np.uint8)
        blank_image[0:h, 0:w] = img
        if (firstL != 'Background'):
            cv2.putText(blank_image, "1. Label: " + str(firstL) + " Prob : " + str(round(firstP,2)), (w + 10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(blank_image, "2. Label: " + str(secondL) + " Prob : " + str(round(secondP,2)), (w + 10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            print('Label : ' + str(firstL) + " Prob : " + str(firstP))
            cv2.imshow("image", blank_image)
            cv2.waitKey()
        cv2.destroyAllWindows()

def objectRecognition(inputPath, symbolType = 'stamp'):
    nPred = 30
    # load the RGB means for the training set
    means_stamp = json.loads(open(config.DATASET_MEAN_STAMP).read())
    means_hand_drawn = json.loads(open(config.DATASET_MEAN_HAND_DRAWN).read())
    sp = PreserveRatio(64, 64)
    cp = CropPreprocessor(64, 64)
    iap = ImageToArrayPreprocessor()
    mp_stamps = MeanPreprocessor(means_stamp["R"], means_stamp["G"], means_stamp["B"])
    mp_hand_drawn = MeanPreprocessor(means_hand_drawn["R"], means_hand_drawn["G"], means_hand_drawn["B"])


    if (symbolType == 'stamp'):
        preprocessors = [sp, mp_stamps, iap]
        modelPath = 'output/stampNetwork.hdf5'
        model = load_model(modelPath)
        labels = config.LABELS_STAMPS
        colors = ((255, 255, 255), (0, 0, 255), (92, 92, 205), (255, 0, 0), (0, 0, 0), (0, 255, 0), (139, 0, 139), (211, 0, 148), (0, 255, 0), (0, 255, 255), (255, 0, 0))
        displayPredictions(inputPath, nPred, preprocessors, model, labels)
    else:
        preprocessors = [sp, mp_hand_drawn, iap]
        modelPath = 'output/handDrawnNetwork.hdf5'
        model = load_model(modelPath)
        labels = config.LABELS_HAND_DRAWN
        colors = ((255, 255, 255), (0, 0, 255), (92, 92, 205), (255, 0, 0), (0, 0, 0), (0, 255, 0), (139, 0, 139),
                  (211, 0, 148), (0, 255, 0), (0, 255, 255), (255, 0, 0), (0, 255, 0))
        displayPredictions(inputPath, nPred, preprocessors, model, labels)