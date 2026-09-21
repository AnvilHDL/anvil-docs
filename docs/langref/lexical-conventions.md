# Lexical Conventions

Anvil follows standard lexical rules like SystemVerilog.

## Whitespace

Whitespace separates identifiers, literals, and keywords. It is otherwise ignored, **except inside string literals**, where it forms part of the value.

## Comments

Anvil supports two kinds of comments:

* **Block comments** begin with `/*` and end with `*/`. They may appear inline or span multiple lines.

  ```c
  /* This is a block comment */
  ```
* **Inline comments** start with `//` and continue to the end of the line.

  ```c
  // This is an inline comment
  ```

## Identifiers

Identifiers consist of letters, digits, and underscores, but **must start with either a letter or an underscore**. In the grammar, non-terminals are prefixed with `$`.

```bnf
identifier ::= ( $letter | _ ) { $letter | $digit | _ }
letter     ::= a...z | A...Z
digit      ::= 0...9
```

Examples of valid identifiers:

```text
counter
_data
temp32
```

Invalid identifiers:

```text
3value   // cannot start with a digit
```
