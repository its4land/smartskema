import cv2
import numpy as np
import os
import math
import imutils
from sklearn.utils import shuffle
import random
#Acknowledgement: some of these functions were extracted from the work of https://github.com/d4nst/RotNet/blob/master/utils.py

def rotate_image(image, angle):
    """
    Rotates an OpenCV 2 / NumPy image about it's centre by the given angle
    (in degrees). The returned image will be large enough to hold the entire
    new image, with a black background
    """

    # Get the image size
    # No that's not an error - NumPy stores image matricies backwards
    image_size = (image.shape[1], image.shape[0])
    image_center = tuple(np.array(image_size) / 2)

    # Convert the OpenCV 3x2 rotation matrix to 3x3
    rot_mat = np.vstack(
        [cv2.getRotationMatrix2D(image_center, angle, 1.0), [0, 0, 1]]
    )

    rot_mat_notranslate = np.matrix(rot_mat[0:2, 0:2])

    # Shorthand for below calcs
    image_w2 = image_size[0] * 0.5
    image_h2 = image_size[1] * 0.5

    # Obtain the rotated coordinates of the image corners
    # check nv stack
    rotated_coords = [
        (np.array([-image_w2, image_h2]) * rot_mat_notranslate).A[0],
        (np.array([image_w2, image_h2]) * rot_mat_notranslate).A[0],
        (np.array([-image_w2, -image_h2]) * rot_mat_notranslate).A[0],
        (np.array([image_w2, -image_h2]) * rot_mat_notranslate).A[0]
    ]

    # Find the size of the new image
    x_coords = [pt[0] for pt in rotated_coords]
    x_pos = [x for x in x_coords if x > 0]
    x_neg = [x for x in x_coords if x < 0]

    y_coords = [pt[1] for pt in rotated_coords]
    y_pos = [y for y in y_coords if y > 0]
    y_neg = [y for y in y_coords if y < 0]

    right_bound = max(x_pos)
    left_bound = min(x_neg)
    top_bound = max(y_pos)
    bot_bound = min(y_neg)

    new_w = int(abs(right_bound - left_bound))
    new_h = int(abs(top_bound - bot_bound))

    # We require a translation matrix to keep the image centred
    trans_mat = np.matrix([
        [1, 0, int(new_w * 0.5 - image_w2)],
        [0, 1, int(new_h * 0.5 - image_h2)],
        [0, 0, 1]
    ])

    # Compute the transform for the combined rotation and translation
    affine_mat = (np.matrix(trans_mat) * np.matrix(rot_mat))[0:2, :]

    # Apply the transform
    result = cv2.warpAffine(
        image,
        affine_mat,
        (new_w, new_h),
        flags=cv2.INTER_LINEAR
    )

    return result


def largest_rotated_rect(w, h, angle):
    """
    Given a rectangle of size wxh that has been rotated by 'angle' (in
    radians), computes the width and height of the largest possible
    axis-aligned rectangle within the rotated rectangle.

    """

    quadrant = int(math.floor(angle / (math.pi / 2))) & 3
    sign_alpha = angle if ((quadrant & 1) == 0) else math.pi - angle
    alpha = (sign_alpha % math.pi + math.pi) % math.pi

    bb_w = w * math.cos(alpha) + h * math.sin(alpha)
    bb_h = w * math.sin(alpha) + h * math.cos(alpha)

    gamma = math.atan2(bb_w, bb_w) if (w < h) else math.atan2(bb_w, bb_w)

    delta = math.pi - alpha - gamma

    length = h if (w < h) else w

    d = length * math.cos(alpha)
    a = d * math.sin(alpha) / math.sin(delta)

    y = a * math.cos(gamma)
    x = y * math.tan(gamma)

    return (
        bb_w - 2 * x,
        bb_h - 2 * y
    )


def crop_around_center(image, width, height):
    """
    Given a NumPy / OpenCV 2 image, crops it to the given width and height,
    around it's centre point
    """

    image_size = (image.shape[1], image.shape[0])
    image_center = (int(image_size[0] * 0.5), int(image_size[1] * 0.5))

    if (width > image_size[0]):
        width = image_size[0]

    if (height > image_size[1]):
        height = image_size[1]

    x1 = int(image_center[0] - width * 0.5)
    x2 = int(image_center[0] + width * 0.5)
    y1 = int(image_center[1] - height * 0.5)
    y2 = int(image_center[1] + height * 0.5)

    return image[y1:y2, x1:x2]


def crop_rotate(angle, image, border_size=10):
    """
    Demos the largest_rotated_rect function
    """

    bordersize = border_size
    border = cv2.copyMakeBorder(image, top=bordersize, bottom=bordersize, left=bordersize, right=bordersize,
                                borderType=cv2.BORDER_CONSTANT, value=[255, 255, 255])
    image = border
    image_height, image_width = image.shape[0:2]
    image_rotated = rotate_image(image, angle)
    image_rotated_cropped = crop_around_center(image_rotated,
                                               *largest_rotated_rect(image_width, image_height, math.radians(angle)))

    return image_rotated_cropped


def border_size(angle):
    angle = abs(angle)
    if angle >= 0 and angle <= 10:
        b = 10
    elif angle >= 350 and angle <=360:
        b = 10
    elif angle >= 175 and angle <= 185:
        b = 20
    elif angle >= 40 and angle <= 70:
        b = 60
    elif angle >= 110 and angle <= 160:
        b = 60
    elif angle >= 200 and angle <= 250:
        b = 60
    elif angle >= 290 and angle <= 340:
        b = 60
    elif angle >= 110 and angle <= 160:
        b = 60
    else:
        b = 30
    return b



def preprocess(image, width, height):
	# grab the dimensions of the image, then initialize
	# the padding values
	(h, w) = image.shape[:2]

	# if the width is greater than the height then resize along
	# the width
	if w > h:
		image = imutils.resize(image, width=width)

	# otherwise, the height is greater than the width so resize
	# along the height
	else:
		image = imutils.resize(image, height=height)

	# determine the padding values for the width and height to
	# obtain the target dimensions
	padW = int((width - image.shape[1]) / 2.0)
	padH = int((height - image.shape[0]) / 2.0)

	# pad the image then apply one more resizing to handle any
	# rounding issues
	image = cv2.copyMakeBorder(image, padH, padH, padW, padW,
		cv2.BORDER_REPLICATE)
	image = cv2.resize(image, (width, height))

	# return the pre-processed image
	return image

def create_rotated_images(catalog_path, output_folder_name,  className, left, right, hops=1):

    """
    Creates a set of  rotated images from a sample provided by the user.    
    Parameters : 
        catalog_path: String which corresponds to the path name  where the sample images are located.
        output_folder_name : Name of the folder where the user wants to store the positives images.
        number_of_positives : Corresponds to the number of positives that the user wants to generate.
        left : left most range value of the rotation window
        right : right most range value of the rotation window 
        # hps = length between grades in the rotation windows
        (i.e if the user wants to generate rotated images between 270 and 10 grades clockwise,
        then left = 270 and right = 10)
        scale : whether  or not the user wants to scale the images, if True the user must provide a maximum size       
    """
    # Name Convention
    # r : rotated, f : flipped, s  : scaled, n : normal
    s = ""
    counter = 0
    if not os.path.exists(output_folder_name):
        os.makedirs(output_folder_name)

    sample = os.listdir(catalog_path)
    sampleR = random.shuffle(sample)

    s = 0

    for i in range(len(sample)):

        image_path = catalog_path + '\\' + sample[i]
        img = cv2.imread(image_path)
        print('1 ' + str(img.shape))
        degrees = [degree  for degree in range(0 , 360 , 3) if (degree >= 0 and degree <= 10) or (degree <= 360 and degree >=350)]
        degrees = [(degree + random.randint(-3, 3)) % 360 for degree in degrees]
        for r in degrees:
            print('Writing R Image ' + str(counter))
            counter += 1
            border = border_size(r)
            img2 = crop_rotate(r, img, border)
            print('2 '+ str(img2.shape))
            cv2.imwrite(output_folder_name + '\\'+ className + '.' + str(counter) + '.bmp', img2)
            height, width, _ = img2.shape
            small = cv2.resize(img2, (0, 0), fx=0.3, fy=0.3)
            heightS, widthS, _ = small.shape
            if (heightS < 64 or widthS<64):
                small = cv2.resize(img2, (0, 0), fx=0.9, fy=0.9)

            counter += 1
            cv2.imwrite(output_folder_name + '\\' + className + '.' + str(counter) + '.bmp', small)
            counter += 1
            big = cv2.resize(img2, (0, 0), fx=1.5, fy=1.5)
            print('Writing R Image ' + str(counter))

