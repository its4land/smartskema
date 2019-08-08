import os
# define the paths to the images directory (Original dataset)
IMAGES_PATH_ORIGINAL = "./sketchProcessor/data/data_original/"

# define the paths to the images directory (Augmented dataset)
IMAGES_PATH = "./sketchProcessor/data/OuputSamples"
nOutputSamples = len(os.listdir(IMAGES_PATH))

# since we do not have validation data or access to the testing
# labels we need to take a number of images from the training
# data and use them instead
NUM_CLASSES = 11
NUM_VAL_IMAGES =  int(nOutputSamples * 0.15)
NUM_TEST_IMAGES = int(nOutputSamples * 0.20)

# define the path to the output training, validation, and testing
# HDF5 files
TRAIN_HDF5 = "./sketchProcessor/data/hdf5/trainS.hdf5"
VAL_HDF5 = "./sketchProcessor/data/hdf5/valS.hdf5"
TEST_HDF5 = "./sketchProcessor/data/hdf5/testS.hdf5"

# path to the output model file
MODEL_PATH = "./sketchProcessor/output/CNN_stamps.model"

# define the path to the dataset mean
DATASET_MEAN = "./sketchProcessor/output/CNN_stamps.json"

# define the path to the output directory used for storing plots,
# classification reports, etc.
OUTPUT_PATH = "./sketchProcessor/output"

LABELS = ['Background',
 'Boma',
 'House',
 'Marsh',
 'Mountain',
 'Olopololi',
 'Oltinka',
 'River',
 'School',
 'Triangle',
 'WaterTank']
