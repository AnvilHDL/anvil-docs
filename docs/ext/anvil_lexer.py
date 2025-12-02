
from pygments.lexer import RegexLexer, include, bygroups, default, words, combined
from pygments.token import (
    Text, Comment, Operator, Keyword, Name, String, Number, 
    Punctuation, Whitespace, Error
)


class AnvilLexer(RegexLexer):
    
    name = 'Anvil'
    aliases = ['anvil']
    filenames = ['*.anvil']
    mimetypes = ['text/x-anvil']

    flags = 0

    tokens = {
        'root': [
            # Whitespace
            (r'\s+', Whitespace),
            
            # Comments
            (r'//.*?$', Comment.Single),
            (r'/\*', Comment.Multiline, 'comment'),
            
            # Strings
            (r'"(?:\\.|[^"\\])*"', String.Double),
            
            # Numbers (binary, hex, decimal)
            (r'0[bB][01_]+', Number.Bin),
            (r'0[xX][0-9a-fA-F_]+', Number.Hex),
            (r'0[oO][0-7_]+', Number.Oct),
            (r'\d[\d_]*', Number.Integer),
            
            # Definition keywords
            (words((
                'const', 'struct', 'enum', 'type', 'func', 'let',
                'reg', 'spawn', 'proc', 'loop', 'recursive', 'chan',
            ), suffix=r'\b'), Keyword.Declaration),
            
            # Module keywords
            (words(('import',), suffix=r'\b'), Keyword.Namespace),
            
            # Control keywords
            (words((
                'if', 'else', 'match', 'generate', 'call', 'generate_seq',
                'recurse', 'dprint', 'dfinish', 'set',
            ), suffix=r'\b'), Keyword),
            
            # Other keywords
            (words((
                'send', 'recv', 'sync', 'cycle', 'put', 'ready', 'try',
                'left', 'right',
            ), suffix=r'\b'), Keyword),
            
            # Modifiers
            (words(('extern',), suffix=r'\b'), Keyword.Type),
            
            # Built-in types
            (words((
                'logic', 'bool', 'int', 'uint', 'float', 'double',
            ), suffix=r'\b'), Keyword.Type),
            
            # Operators
            (r'(>>|<<|<<=|>>=|<=|>=|==|!=|&&|\|\||->|=>|::|\.\.\.?|:=)', Operator),
            (r'[+\-*/%&|^!<>=@#]', Operator),
            
            # Brackets
            (r'[(){}\[\]]', Punctuation),
            
            # Punctuation
            (r'[,;:]', Punctuation),
            
            # Identifiers
            (r'[a-zA-Z_]\w*', Name),
            
            # Catch-all
            (r'.', Text),
        ],
        'comment': [
            (r'[^*/]', Comment.Multiline),
            (r'/\*', Comment.Multiline, '#push'),
            (r'\*/', Comment.Multiline, '#pop'),
            (r'[*/]', Comment.Multiline),
        ],
    }


def setup(app):
    from sphinx.highlighting import lexers
    lexers['anvil'] = AnvilLexer()
    return {
        'version': '0.1',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }
