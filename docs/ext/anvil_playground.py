"""
Sphinx extension for interactive Anvil code playgrounds.

This extension adds a custom directive `.. anvil-playground::` that creates
interactive code editors with run buttons for Anvil HDL code examples.
"""

from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util.docutils import SphinxDirective
import json


class AnvilPlaygroundNode(nodes.General, nodes.Element):
    """Node for Anvil playground widget."""
    pass


class AnvilPlaygroundDirective(SphinxDirective):
    """
    Directive to create an interactive Anvil code playground.
    
    Usage:
        .. anvil-playground::
            :playground-url: https://anvil.capstone.kisp-lab.org
            
            proc hello_world_counter() {
                reg counter : logic[8];
                loop {
                    dprint"[Cycle %d] Hello World!" (*counter);
                    set counter := *counter + 1
                }
            }
    """
    
    has_content = True
    required_arguments = 0
    optional_arguments = 0
    option_spec = {
        'playground-url': directives.unchanged,
        'height': directives.unchanged,
    }

    def run(self):
        # Get the code content
        code = '\n'.join(self.content)
        
        # Get options
        playground_url = self.options.get('playground-url', 'https://anvil.capstone.kisp-lab.org')
        height = self.options.get('height', '500px')
        
        # Create the node
        node = AnvilPlaygroundNode()
        node['code'] = code
        node['playground_url'] = playground_url
        node['height'] = height
        
        return [node]


def visit_anvil_playground_html(self, node):
    """Generate HTML for the playground widget."""
    import hashlib
    import html
    
    code = node['code']
    playground_url = node['playground_url']
    height = node['height']
    
    # Generate a unique ID for this widget
    widget_id = f"anvil-playground-{hashlib.md5(code.encode()).hexdigest()[:8]}"
    
    # Escape code for safe embedding in HTML data attribute
    # Use html.escape to handle quotes and special characters
    code_escaped = html.escape(code, quote=True)
    playground_url_escaped = html.escape(playground_url, quote=True)
    
    # Use double quotes for HTML attributes, escape the content properly
    html_output = f'''<div class="anvil-playground-container" id="{widget_id}" data-code="{code_escaped}" data-playground-url="{playground_url_escaped}" style="min-height: {height};"></div>'''
    
    self.body.append(html_output)
    raise nodes.SkipNode


def depart_anvil_playground_html(self, node):
    """Close the playground widget HTML."""
    # Nothing to do - we already skipped the node
    pass


def add_assets(app, pagename, templatename, context, doctree):
    """Add JavaScript and CSS assets to the page."""
    if doctree and doctree.traverse(AnvilPlaygroundNode):
        # Add the playground widget script
        app.add_js_file('playground-widget.js')


def setup(app):
    """Setup the Sphinx extension."""
    
    # Register the directive
    app.add_directive('anvil-playground', AnvilPlaygroundDirective)
    
    # Register the node
    app.add_node(
        AnvilPlaygroundNode,
        html=(visit_anvil_playground_html, depart_anvil_playground_html)
    )
    
    # Connect to the html-page-context event to add assets
    app.connect('html-page-context', add_assets)
    
    return {
        'version': '0.1',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }
