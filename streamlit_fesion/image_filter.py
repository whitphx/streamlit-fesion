import inspect
from typing import Callable, List

import numpy as np

ImageFilterFunc = Callable[[np.ndarray], np.ndarray]


def transpile_image_filter_func(func: ImageFilterFunc) -> List[str]:
    def_code = inspect.getsource(func)

    name = func.__name__
    sig = inspect.signature(func)
    if len(sig.parameters) != 1:
        raise TypeError(
            "The image filter function must take exactly 1 argument as an input image."
        )

    return [def_code, name]
