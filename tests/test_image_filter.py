import pytest

from streamlit_fesion.image_filter import transpile_image_filter_func


def test_transpile_image_filter_func_returns_the_code_and_func_name():
    def func(input_image):
        return input_image[::-1, :, :]

    expected = [
        """    def func(input_image):
        return input_image[::-1, :, :]
""",
        "func",
    ]

    assert transpile_image_filter_func(func) == expected


def zero_args():
    return 42


def two_args(a, b):
    return a + b


@pytest.mark.parametrize(
    "invalid_func",
    [
        (zero_args,),
        (two_args,),
    ],
)
def test_transpile_image_filter_func_validates_arg_number(invalid_func):
    with pytest.raises(TypeError):
        transpile_image_filter_func(invalid_func)
