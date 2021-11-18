import os

import streamlit.components.v1 as components

from streamlit_fesion.image_filter import transpile_image_filter_func, ImageFilterFunc


_RELEASE = False


if not _RELEASE:
    _component_func = components.declare_component(
        "streamlit_fesion",
        url="http://localhost:3001",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component("streamlit_fesion", path=build_dir)


def streamlit_fesion(filter_func: ImageFilterFunc, dep_packages):
    func_def_code, func_name = transpile_image_filter_func(filter_func)
    component_value = _component_func(func_def_code=func_def_code, dep_packages=dep_packages, func_name=func_name)
    return component_value


if not _RELEASE:
    def image_filter(input_image):
        import skimage
        grayscale = skimage.color.rgb2gray(input_image)
        return skimage.color.gray2rgb(grayscale)


    streamlit_fesion(image_filter, [])
