"""
Zips a directory reproducibly: the same files always give a byte-identical zip.

Terraform redeploys the Lambda whenever the zip's hash changes. A normal zip stores each file's
modification time, so rebuilding unchanged code would still change the hash and redeploy every time.
This writes every entry with a fixed timestamp and permissions, in a fixed order.

Usage: python build_zip.py <source dir> <output zip>
"""
import sys
import zipfile
from pathlib import Path

FIXED_TIME = (1980, 1, 1, 0, 0, 0)  # the earliest date a zip can store
FILE_MODE = 0o644 << 16  # rw-r--r--, stored in the high bits of external_attr


def build_zip(source: Path, output: Path) -> None:
    # Sort on the posix path string: Path ordering is case-insensitive on Windows but not on Linux.
    files = sorted(
        (path.relative_to(source).as_posix(), path)
        for path in source.rglob("*")
        if path.is_file() and "__pycache__" not in path.parts and path.suffix != ".pyc"
    )
    with zipfile.ZipFile(output, "w") as zf:
        for name, path in files:
            info = zipfile.ZipInfo(name, FIXED_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = FILE_MODE
            zf.writestr(info, path.read_bytes())


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    build_zip(Path(sys.argv[1]), Path(sys.argv[2]))
