# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = 'AnvilHDL Documentation'
copyright = '2026, AnvilHDL Team, NUS'
author = 'AnvilHDL Team'
release = '0.1.0'

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

import sys
import os

# Add the _ext directory to the Python path for custom extensions
sys.path.insert(0, os.path.abspath('ext'))

extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.viewcode',
    'sphinx.ext.napoleon',
    'sphinx.ext.intersphinx',
    'sphinx.ext.todo',
    'sphinx.ext.coverage',
    'sphinx.ext.githubpages',
    'sphinx.ext.mathjax',  # LaTeX math support
    'myst_parser',
    'anvil_playground',  # Custom extension for interactive playgrounds
    'anvil_lexer',
]

# MyST Parser configuration - enable math extensions
myst_enable_extensions = [
    "dollarmath",  # Enable $...$ and $$...$$ math
    "amsmath",     # Enable LaTeX math environments
]

templates_path = ['templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = 'sphinx_rtd_theme'
html_static_path = ['static', 'assets']
# Add custom CSS file(s) to the HTML output. Files must be placed under _static.
html_css_files = [
    'static.css',
    'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/theme/monokai.min.css',
]

# Add custom JS files - CodeMirror must load before playground-widget.js
html_js_files = [
    ('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js', {'priority': 100}),
    ('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/clike/clike.min.js', {'priority': 101}),
    ('anvil-mode.js', {'priority': 102}),  # Custom Anvil syntax highlighting mode
    ('playground-widget.js', {'priority': 500}),
    ('navbar-toggle.js', {'priority': 501}),
    ('copy-code.js', {'priority': 502}),
]

# -- Extension configuration -------------------------------------------------

# Napoleon settings for Google/NumPy style docstrings
napoleon_google_docstring = True
napoleon_numpy_docstring = True
napoleon_include_init_with_doc = True
html_favicon = 'assets/anvil.png'
html_logo = 'assets/anvil.png'

# Intersphinx configuration
intersphinx_mapping = {
    'python': ('https://docs.python.org/3', None),
}

source_suffix = {
    '.rst': 'restructuredtext',
    '.md': 'markdown',
}
# Todo extension
todo_include_todos = True
