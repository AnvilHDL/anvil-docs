#!/bin/bash
# Build Sphinx documentation for the AnvilHDL Playground

set -e

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

echo "Building Sphinx documentation..."

# Prefer the project's virtual environment, then fall back to PATH.
if [ -x "$project_dir/.venv/bin/sphinx-build" ]; then
    sphinx_build="$project_dir/.venv/bin/sphinx-build"
elif command -v sphinx-build &> /dev/null; then
    sphinx_build="$(command -v sphinx-build)"
else
    echo "Error: sphinx-build not found. Please install Sphinx:"
    echo "  cd \"$project_dir\""
    echo "  python3 -m venv --without-pip .venv"
    echo "  python3 -m pip --python .venv/bin/python install -r docs/requirements.txt"
    exit 1
fi

# Build the documentation
cd "$project_dir/docs"
make clean
make html SPHINXBUILD="$sphinx_build"

echo "Documentation built successfully!"
echo "Documentation is available at: docs/_build/html/index.html"
