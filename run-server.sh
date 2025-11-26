#!/bin/bash

bash build-docs.sh

echo "Starting a simple HTTP server to serve the documentation..."
cd docs/_build/html
python3 -m http.server -b 127.0.0.1 8000
