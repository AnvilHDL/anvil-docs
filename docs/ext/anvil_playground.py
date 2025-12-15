"""
Sphinx extension for interactive Anvil code playgrounds.
"""

from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util.docutils import SphinxDirective
import json


class AnvilPlaygroundNode(nodes.General, nodes.Element):
    pass


class AnvilPlaygroundDirective(SphinxDirective):
    """
    Directive to create an interactive Anvil code playground.

    Usage:
        .. anvil-playground::
            :playground-url: https://anvil.kisp-lab.org

            proc hello_world_counter() {
                reg counter : logic[8];
                loop {
                    dprint"[Cycle %d] Hello World!" (*counter);
                    set counter := *counter + 8'd1
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
        code = '\n'.join(self.content)

        playground_url = self.options.get('playground-url', 'https://anvil.kisp-lab.org')
        height = self.options.get('height', '500px')

        node = AnvilPlaygroundNode()
        node['code'] = code
        node['playground_url'] = playground_url
        node['height'] = height

        return [node]


def visit_anvil_playground_html(self, node):
    import hashlib
    import html

    code = node['code']
    playground_url = node['playground_url']
    height = node['height']

    widget_id = f"anvil-playground-{hashlib.md5(code.encode()).hexdigest()[:8]}"

    code_escaped = html.escape(code, quote=True)
    playground_url_escaped = html.escape(playground_url, quote=True)

    html_output = f'''<div class="anvil-playground-container" id="{widget_id}" data-code="{code_escaped}" data-playground-url="{playground_url_escaped}" style="min-height: {height};"></div>'''

    self.body.append(html_output)
    raise nodes.SkipNode


def depart_anvil_playground_html(self, node):
    pass


def add_assets(app, pagename, templatename, context, doctree):
    if doctree and doctree.traverse(AnvilPlaygroundNode):
        app.add_js_file('playground-widget.js')


def setup(app):
    """Setup the Sphinx extension."""

    app.add_directive('anvil-playground', AnvilPlaygroundDirective)

    app.add_node(
        AnvilPlaygroundNode,
        html=(visit_anvil_playground_html, depart_anvil_playground_html)
    )

    app.connect('html-page-context', add_assets)

    return {
        'version': '0.1',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }
