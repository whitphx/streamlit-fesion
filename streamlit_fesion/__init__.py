import os
import streamlit.components.v1 as components


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


def streamlit_fesion():
    component_value = _component_func()
    return component_value


if not _RELEASE:
    streamlit_fesion()
