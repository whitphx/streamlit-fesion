streamlit-fesion
===

Streamlit component for **f**ront**e**nd computer vi**sion** processing with Wasm/Pyodide.

Sister project: [`streamlit-webrtc`](https://github.com/whitphx/streamlit-webrtc)

---

You write an image filter function in Python that receives an image frame, transforms it, and returns a processed image frame.
**`streamlit-fesion` exports it to the frontend environment and executes it with [Pyodide](https://pyodide.org/) to process the WebCam video stream.**

Look at the code below. It is a grayscale filter example.

```python
from streamlit_fesion import streamlit_fesion


def image_filter(input_image):
    import skimage

    grayscale = skimage.color.rgb2gray(input_image)
    return skimage.color.gray2rgb(grayscale)


streamlit_fesion(image_filter, [], key="fesion")
```
`image_filter()` is the filter function.
`streamlit-fesion` will call it with an input image frame of type `np.ndarray` with 3 channels (RGB-ordered), and the filter function returns a processed image frame with the same type and shape.

Note that the `image_filter()` will be sent to the frontend environment and executed there, but any other parts of the code will not.
Therefore, the packages used in the filter function must be imported inside it, like `import skimage` in the example above.

`streamlit-fesion` automatically detects the imported packages and installs them to the frontend environment at the initialization time[^1].
However, if necessary, you can explicitly pass the requirements list to the second argument of `streamlit_fesion()`, where an empty list `[]` is passed in the example above.

[^1]:[`pyodide.loadPackagesFromImports`](https://pyodide.org/en/stable/usage/api/js-api.html#pyodide.loadPackagesFromImports) is used for it.


The signature of `streamlit_fesion()` follows.
```python
streamlit_fesion(
    filter_func: Callable[[np.ndarray], np.ndarray],
    dep_packages: Optional[List[str]] = None,
    key: Optional[str] = None,
)
```
