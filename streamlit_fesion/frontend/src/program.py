import numpy as np

from js import fesionImageWidth, fesionImageHeight, fesionImageData  # Import from JS globals

input_image4chan = np.asarray(fesionImageData.to_py()).reshape((fesionImageHeight, fesionImageWidth, 4)) # 4 channels (RGBA)
input_image = input_image4chan[:,:,:3]

output_image = input_image[::-1, :, :] # TODO: Inject more interesting filter

if np.issubdtype(output_image.dtype, np.floating):
    output_image = (output_image * 255).astype(np.uint8)

output_alpha = np.ones((fesionImageHeight, fesionImageWidth, 1), dtype=np.uint8) * 255
output_image4chan = np.concatenate((output_image, output_alpha), axis=2).copy()

output_height, output_width = output_image4chan.shape[:2]
