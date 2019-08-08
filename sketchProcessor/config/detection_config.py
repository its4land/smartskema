# define the paths to the images directory
IMAGES_PATH = "./data/OuputSamples3"

# since we do not have validation data or access to the testing
# labels we need to take a number of images from the training
# data and use them instead
NUM_CLASSES = 10
NUM_VAL_IMAGES = 500 * NUM_CLASSES
NUM_TEST_IMAGES = 500 * NUM_CLASSES

# define the path to the output training, validation, and testing
# HDF5 files
TRAIN_HDF5 = "./data/hdf5/train3.hdf5"
VAL_HDF5 = "./data/hdf5/val3.hdf5"
TEST_HDF5 = "./data/hdf5/test3.hdf5"

# path to the output model file
MODEL_PATH = "./sketchProcessor/output/tiny_sketch3.model"

# define the path to the dataset mean
DATASET_MEAN_STAMP = "./sketchProcessor/output/stamp.json"
DATASET_MEAN_HAND_DRAWN = "./sketchProcessor/output/hand_drawn.json"
# define the path to the output directory used for storing plots,
# classification reports, etc.
OUTPUT_PATH = "./sketchProcessor/output"

LABELS_HAND_DRAWN = ['Background',
 'Boma',
 'House',
 'Marsh',
 'Mountain',
 'Olopololi',
 'Oltinka',
 'River',
 'School',
 'Tree',
 'Triangle',
 'WaterTank']

LABELS_STAMPS = ['Background', 'Boma', 'House', 'Marsh', 'Mountain','Olopololi', 'Oltinka', 'River','School', 'Triangle', 'WaterTank']
