import cv2
from sketchProcessor.helperLibraries.utils import draw
from sketchProcessor.helperLibraries.utils import simple_obj_det as sd
from sketchProcessor.helperLibraries.utils import sketch_segmentation as ss
from sketchProcessor.helperLibraries.utils import  contour_classification as cc


image = cv2.imread('./testData/sketchMaps/stamps/GoodOne.bmp')
draw.showImage(image)
svg = cc.completeClassification(image,fileName='preprocessedSketchMap50')


image = cv2.imread('./testData/sketchMaps/stamps/s0.bmp')
cc.completeClassification(image, fileName='hans')
svg = cc.completeClassification(image,fileName='preprocessedSketchMap30')

