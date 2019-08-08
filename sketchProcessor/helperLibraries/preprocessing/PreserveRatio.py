# import the necessary packages
import imutils
import cv2

class PreserveRatio:
    def __init__(self, width, height, inter=cv2.INTER_AREA):
        self.width = width
        self.height = height
        self.inter = inter

    def preprocess(self, image):

        (h, w) = image.shape[:2]

        # if the width is greater than the height then resize along
        # the width

        if w > h:
            image = imutils.resize(image, width=self.width)

        # otherwise, the height is greater than the width so resize
        # along the height
        else:
            image = imutils.resize(image, height=self.height)

        # determine the padding values for the width and height to
        # obtain the target dimensions
        padW = int((self.width - image.shape[1]) / 2.0)
        padH = int((self.height - image.shape[0]) / 2.0)

        # pad the image then apply one more resizing to handle any
        # rounding issues
        image = cv2.copyMakeBorder(image, padH, padH, padW, padW,
                                   cv2.BORDER_REPLICATE)
        image = cv2.resize(image, (self.width, self.height))

        # return the pre-processed image
        return image
