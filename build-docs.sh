#!/bin/bash
# Build Sphinx documentation for the AnvilHDL Playground

set -e

echo "Building Sphinx documentation..."

# Check if Sphinx is installed
if ! command -v sphinx-build &> /dev/null; then
    echo "Error: sphinx-build not found. Please install Sphinx:"
    echo "  pip install -r docs/requirements.txt"
    exit 1
fi

# Build the documentation
cd docs
make clean
make html
cd ..

echo "Documentation built successfully!"
echo "Documentation is available at: docs/_build/html/index.html"
