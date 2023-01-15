from PIL import Image
import sys

filename = sys.argv[1];
im = Image.open(filename)
im.load()  # Needed only for .png EXIF data (see citation above)
print(im.info)