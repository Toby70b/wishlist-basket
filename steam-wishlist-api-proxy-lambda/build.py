"""
Builds dist/lambda.zip: the handler plus its dependencies, built for the Lambda runtime (Linux x86_64, Python 3.12).

The zip is reproducible (see build_zip.py), so Terraform only redeploys when the code or dependencies change.
Run it with the project's virtualenv Python, e.g. .venv/Scripts/python build.py (Windows) or .venv/bin/python build.py.
"""
import shutil
import subprocess
import sys
from pathlib import Path

from build_zip import build_zip

ROOT = Path(__file__).resolve().parent  # so the rmtree below only ever touches this project's build/ and dist/
BUILD = ROOT / "build"
DIST = ROOT / "dist"


def main() -> None:
    for directory in (BUILD, DIST):
        shutil.rmtree(directory, ignore_errors=True)
        directory.mkdir()

    subprocess.run(
        [
            sys.executable, "-m", "pip", "install",
            "-r", str(ROOT / "requirements.txt"),
            "-t", str(BUILD),
            # No .pyc files: they differ between builds (and would be for the wrong Python version anyway)
            "--no-compile",
            "--quiet",
            "--platform", "manylinux2014_x86_64",
            "--implementation", "cp",
            "--python-version", "3.12",
            "--only-binary=:all:",
        ],
        check=True,
    )
    # Console scripts (e.g. charset-normalizer's) aren't used by the Lambda, and their shebang is this machine's Python path
    shutil.rmtree(BUILD / "bin", ignore_errors=True)

    for source in (ROOT / "src").glob("*.py"):
        shutil.copy2(source, BUILD)

    build_zip(BUILD, DIST / "lambda.zip")
    print(f"Built {DIST / 'lambda.zip'}")


if __name__ == "__main__":
    main()
