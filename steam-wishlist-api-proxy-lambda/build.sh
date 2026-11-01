#!/usr/bin/env bash
# Builds dist/lambda.zip: the handler plus its dependencies, built for the Lambda runtime (Linux x86_64, Python 3.12).
# The zip is reproducible (see build_zip.py), so Terraform only redeploys when the code or dependencies change.
set -euo pipefail
cd "$(dirname "$0")"  # so the rm -rf below only ever touches this project's build/ and dist/

PYTHON="${PYTHON:-python}"

rm -rf build dist && mkdir -p build dist
# --no-compile: no .pyc files, which differ between builds (and would be for the wrong Python version anyway)
"$PYTHON" -m pip install -r requirements.txt -t build --no-compile --quiet \
  --platform manylinux2014_x86_64 --implementation cp \
  --python-version 3.12 --only-binary=:all:
# Console scripts (e.g. charset-normalizer's) aren't used by the Lambda, and their shebang is this machine's Python path
rm -rf build/bin
cp src/*.py build/
"$PYTHON" build_zip.py build dist/lambda.zip
