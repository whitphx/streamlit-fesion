import streamlit as st
from streamlit_fesion import streamlit_fesion


def grayscale(input_image):
    # Ref: https://scikit-image.org/docs/0.15.x/auto_examples/color_exposure/plot_rgb_to_gray.html
    import skimage

    grayscale = skimage.color.rgb2gray(input_image)
    return skimage.color.gray2rgb(grayscale)


def sobel(input_image):
    # Ref: https://scikit-image.org/docs/0.15.x/auto_examples/color_exposure/plot_adapt_rgb.html
    from skimage.color.adapt_rgb import adapt_rgb, each_channel, hsv_value
    from skimage import filters
    from skimage.exposure import rescale_intensity

    @adapt_rgb(each_channel)
    def sobel_each(image):
        return filters.sobel(image)

    @adapt_rgb(hsv_value)
    def sobel_hsv(image):
        return filters.sobel(image)

    return rescale_intensity(1 - sobel_each(input_image))


def face_detection(input_image):
    # Ref: https://scikit-image.org/docs/0.15.x/auto_examples/applications/plot_face_detection.html
    # TODO: This function is inefficient because detector is loaded in every frame. Create a cache mechanism.
    from skimage import data
    from skimage.feature import Cascade
    from skimage.draw import rectangle

    # Load the trained file from the module root.
    trained_file = data.lbp_frontal_face_cascade_filename()

    # Initialize the detector cascade.
    detector = Cascade(trained_file)

    detected = detector.detect_multi_scale(img=input_image,
                                        scale_factor=1.2,
                                        step_ratio=1,
                                        min_size=(60, 60),
                                        max_size=(123, 123))

    for patch in detected:
        print(patch)
        rr, cc = rectangle(start=(patch['c'], patch['r']), extent=(patch['width'], patch['height']), shape=input_image.shape[:2])
        input_image[rr, cc, 0] = 255

    return input_image


filter_type = st.radio("Filter", ["grayscale", "sobel", "face_detection"])
if filter_type == "grayscale":
    image_filter = grayscale
elif filter_type == "sobel":
    image_filter = sobel
elif filter_type == "face_detection":
    image_filter = face_detection
else:
    raise ValueError(f'Unexpected filter type "{filter_type}"')

streamlit_fesion(image_filter)