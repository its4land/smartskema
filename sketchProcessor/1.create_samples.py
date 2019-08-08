from sketchProcessor.config import cnn_config as config
from sketchProcessor.helperLibraries.utils import sampleGenerator



catalog_path = config.IMAGES_PATH_ORIGINAL

output_folder_name = config.IMAGES_PATH


labels = config.LABELS


for label in labels:
    sampleGenerator.create_rotated_images(catalog_path + label, output_folder_name, label,350,10, hops=3)