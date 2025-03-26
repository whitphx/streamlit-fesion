import importlib.metadata
from typing import Optional

__version__: Optional[str] = None

try:
    __version__ = importlib.metadata.version(__name__)
except importlib.metadata.PackageNotFoundError:
    pass
