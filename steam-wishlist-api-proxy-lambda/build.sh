#!/usr/bin/env bash
# Builds dist/lambda.zip: the handler plus its dependencies, built for the Lambda runtime (Linux x86_64, Python 3.12).
set -euo pipefail
cd "$(dirname "$0")"  # so the rm -rf below only ever touches this project's build/ and dist/

rm -rf build dist && mkdir -p build dist
pip install -r requirements.txt -t build \
  --platform manylinux2014_x86_64 --implementation cp \
  --python-version 3.12 --only-binary=:all:
cp src/*.py build/
(cd build && zip -qrX ../dist/lambda.zip .)
