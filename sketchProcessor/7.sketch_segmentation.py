from sketchProcessor.helperLibraries.utils import sketch_segmentation as ss
from sketchProcessor.helperLibraries.utils import draw
import cv2
import numpy as np


image = cv2.imread('./testData/sketchMaps/stamps/GoodOne.bmp')
ss.segmentateSketch(image)

image = cv2.imread('./testData/sketchMaps/stamps/s0.bmp')
ss.segmentateSketch(image)