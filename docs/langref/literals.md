# Literals

Anvil provides built-in literal forms to represent values commonly used in hardware designs.

## Numeric Literals

A numeric literal consists of:

1. A **bit width** (one or more digits),
2. A **single quote** `'`,
3. A **base specifier** (`b`, `d`, or `h`),
4. A **value** written in that base.

```bnf
numeric-literal        ::= $binary-literal
                         | $decimal-literal
                         | $hexadecimal-literal

binary-literal         ::= { $digit }+ 'b { 0 | 1 }+
decimal-literal        ::= { $digit }+ 'd { $digit }+
hexadecimal-literal    ::= { $digit }+ 'h { $digit | a...f | A...F }+
```

Examples:

```anvil
8'b10101010
16'hFFEE
8'd170
```

## String Literals

String literals are enclosed in double quotes:

```bnf
string-literal ::= " { $string-char } "
```

Example:

```anvil
"Hello, Anvil!"
```

> **Note**: String literals are just for debug printing and cannot be manipulated as first-class values in Anvil.
