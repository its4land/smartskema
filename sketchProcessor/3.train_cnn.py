
import matplotlib
matplotlib.use("Agg")

# import the necessary packages
from sketchProcessor.config import cnn_config as config
from sketchProcessor.helperLibraries.preprocessing import ImageToArrayPreprocessor
from sketchProcessor.helperLibraries.preprocessing import PreserveRatio

from sketchProcessor.helperLibraries.preprocessing import PatchPreprocessor
from sketchProcessor.helperLibraries.preprocessing import MeanPreprocessor
from keras.callbacks import ModelCheckpoint
from sketchProcessor.helperLibraries.callbacks import TrainingMonitor
from sketchProcessor.helperLibraries.io import HDF5DatasetGenerator

from sketchProcessor.CNN import StampSymbolCNN
from keras.preprocessing.image import ImageDataGenerator
from keras.optimizers import Adam
from keras.optimizers import SGD
import json
import os
from keras.models import load_model

# construct the callback to save only the *best* model to disk
# based on the validation loss
fname = os.path.sep.join(["./sketchProcessor/data/weights", "weights-{epoch:03d}-{val_loss:.4f}.hdf5"])
checkpoint = ModelCheckpoint(fname, monitor="val_loss", mode="min", save_best_only=False, verbose=1)


# construct the training image generator for data augmentation
aug = ImageDataGenerator(rotation_range=10, zoom_range=0.15,
	width_shift_range=0.3, height_shift_range=0.3, shear_range=0.2,
	horizontal_flip=False, fill_mode="nearest")

# load the RGB means for the training set
means = json.loads(open(config.DATASET_MEAN).read())

# initialize the image preprocessors
sp = PreserveRatio(64, 64)
pp = PatchPreprocessor(64, 64)
mp = MeanPreprocessor(means["R"], means["G"], means["B"])
iap = ImageToArrayPreprocessor()

# initialize the training and validation dataset generators
trainGen = HDF5DatasetGenerator(config.TRAIN_HDF5, 128, aug=aug, preprocessors=[mp, iap], classes=config.NUM_CLASSES)
valGen = HDF5DatasetGenerator(config.VAL_HDF5, 128, preprocessors=[mp, iap], classes=config.NUM_CLASSES)

# initialize the optimizer
print("[INFO] compiling model...")

# opt = SGD(lr=0.002, decay=0.002/ 15, momentum=0.9, nesterov=True)
# opt = SGD(lr=0.00010, momentum=0.9, nesterov=True)
# model = load_model('output/2.hdf5')
opt = SGD(lr=0.002, decay=0.002/ 15, momentum=0.9, nesterov=True)
model = StampSymbolCNN.build(width=64, height=64, depth=3, classes=config.NUM_CLASSES, reg=0.0003)
model.compile(loss="binary_crossentropy", optimizer=opt, metrics=["accuracy"])

# construct the set of callbacks
path = os.path.sep.join([config.OUTPUT_PATH, "{}.png".format(os.getpid())])
callbacks = [TrainingMonitor(path),checkpoint]

# train the networkpre
model.fit_generator(
	trainGen.generator(),
	steps_per_epoch=trainGen.numImages // 128,
	validation_data=valGen.generator(),
	validation_steps=valGen.numImages // 128,
	epochs=1,
	max_queue_size=128 * 2,
	callbacks=callbacks, verbose=1)

# save the model to file
print("[INFO] serializing model...")
model.save(config.MODEL_PATH, overwrite=True)

# close the HDF5 datasets
trainGen.close()
valGen.close()
