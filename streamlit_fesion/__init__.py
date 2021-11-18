import os
from typing import List, Optional

import streamlit.components.v1 as components

from streamlit_fesion.image_filter import ImageFilterFunc, transpile_image_filter_func

_RELEASE = True


if not _RELEASE:
    _component_func = components.declare_component(
        "streamlit_fesion",
        url="http://localhost:3001",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component("streamlit_fesion", path=build_dir)


class ClientSideError(Exception):
    def __init__(self, message: str, stack: str) -> None:
        super().__init__(message)
        self.message = message
        self.stack = stack


def streamlit_fesion(
    filter_func: ImageFilterFunc,
    dep_packages: Optional[List[str]] = None,
    key: Optional[str] = None,
):
    func_def_code, func_name = transpile_image_filter_func(filter_func)

    component_value = _component_func(
        func_def_code=func_def_code,
        dep_packages=dep_packages,
        func_name=func_name,
        key=key,
        default=None,
    )

    if component_value is None:
        return

    python_error = component_value.get("pythonError")
    if python_error:
        raise ClientSideError(
            message=python_error["message"], stack=python_error["stack"]
        )


if not _RELEASE:

    def image_filter(input_image):
        import skimage

        grayscale = skimage.color.rgb2gray(input_image)
        return skimage.color.gray2rgb(grayscale)

    streamlit_fesion(image_filter, [], key="fesion")
