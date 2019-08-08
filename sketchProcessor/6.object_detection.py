
from sketchProcessor.helperLibraries.utils import simple_obj_det as sd
from sketchProcessor.helperLibraries.utils import draw
from skimage.morphology import skeletonize
from skimage import img_as_ubyte
import numpy as np
import cv2
import os



image = cv2.imread('./testData/sketchMaps/handDrawn/chipotia1.bmp')
draw.showImage(image)
predictions = sd.detectSymbols(image, symbolType='handDrawn', method='t', filterColor= 'blue')



image2 = cv2.imread('./testData/sketchMaps/stamps/sm3.bmp')
draw.showImage(image2)
predictions = sd.detectSymbols(image2, symbolType='stamp', method='t', filterColor= 'red')




image = cv2.imread('./testData/sketchMaps/stamps/sm2.bmp')
draw.showImage(image)
predictions = sd.detectSymbols(image, symbolType='stamp', method='t', filterColor= 'red')




image = cv2.imread('./testData/sketchMaps/stamps/sm1.bmp')
draw.showImage(image)
predictions = sd.detectSymbols(image, symbolType='stamp', method='t', filterColor= 'red')



image2 = cv2.imread('./testData/sketchMaps/handDrawn/hd2.bmp')
draw.showImage(image2)
predictions = sd.detectSymbols(image2, symbolType='handDrawn', method='t', filterColor= 'blue')


image = cv2.imread('./testData/sketchMaps/stamps/s1.bmp')
draw.showImage(image)
predictions = sd.detectSymbols(image, symbolType='stamp', method='t', filterColor= 'red')


image = cv2.imread('./testData/sketchMaps/stamps/s4.bmp')
draw.showImage(image)
predictions = sd.detectSymbols(image, symbolType='stamp', method='t', filterColor= 'red')
