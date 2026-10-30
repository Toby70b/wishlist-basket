rm -rf build dist && mkdir -p build dist
pip install -r requirements.txt -t build \
  --platform manylinux2014_x86_64 --implementation cp \
  --python-version 3.12 --only-binary=:all:
cp src/*.py build/
(cd build && zip -qrX ../dist/lambda.zip .)