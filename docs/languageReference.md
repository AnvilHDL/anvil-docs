# Tour of Anvil Syntax and Features


We now present a detailed tour of all language constructs in Anvil. We illustrate each construct with small code examples and explain their semantics.


## 1. Lexical Conventions

Anvil follows standard lexical rules like SystemVerilog.

### Whitespace

Whitespace separates identifiers, literals, and keywords but is otherwise ignored, **except inside string literals**, where it is treated as part of the value.

### Comments

Anvil supports two kinds of comments:

* **Block comments** begin with `/*` and end with `*/`. They may appear inline or span multiple lines.

  ```c
  /* This is a block comment */
  ```
* **Inline comments** start with `//` and continue to the end of the line.

  ```c
  // This is an inline comment
  ```

### Identifiers

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

---

## 2. Literals

Anvil provides built-in literal forms to represent values commonly used in hardware designs.

### Numeric Literals

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

```rs
8'b10101010
16'hFFEE
8'd170
```

### String Literals

String literals are enclosed in double quotes:

```bnf
string-literal ::= " { $string-char } "
```

Example:

```rs
"Hello, Anvil!"
```

> **Note**: String literals are just for debug printing and cannot be manipulated as first-class values in Anvil.

---

## 3. Values
Anvil supports several kinds of values, including:

### Logic

`logic` is the most atomic value type in Anvil. It represents a single bit and can take the values:

```rs
1'b0
1'b1
```

### Array

An array is a fixed-length sequence of values of the same type. A logic array is written as:

```text
n'b...
n'd...
n'h...
```

where `n` is the number of bits.

Example:

```rs
8'b10101010        // binary
8'hAA              // hexadecimal
8'd170             // decimal
```

All three examples represent the same 8-bit value.


Arrays of arbitrary data types are written as:

```rs
[ v0, v1, ..., v(n-1) ]
```

Example:

```rs
[ 8'd1, 8'd2, 8'd3 ]
```

This is an array of three 8-bit logic arrays.

### Struct

A `struct` is a composite type that groups multiple named fields, potentially of different data types. A struct value is constructed using the syntax:

```text
struct_type_ident::{ field1 = value1; field2 = value2; ... }
```

Example:

```rs
address_data_pair::{ data = 8'b10101010; addr = 16'hFFEE }
```

### Enum

An `enum` represents a named constant chosen from a finite set. The syntax to refer to an enum constant is:

```rs
enum_type_ident::const_ident
```

Example:

```rs
state::IDLE
state::BUSY
```


## 4. Data Types

Anvil supports both primitive and user-defined data types. Types are constructed using data type expressions.

### Data Type Expressions

```bnf
data-type-expression ::= ()
                       | logic
                       | $identifier
                       | ( $data-type-expression [ {digit}+ ] )
```

Meaning:

- `()` represents the unit type.
- `logic` is the single-bit type.
- `$identifier` refers to a named type.
- `(T[n])` is an array of `n` elements of type `T`.
Examples:

```rs
logic
address_data_pair
logic[8]
```

### Type Definitions

A named type can be introduced using a type definition:

```bnf
data-type-definition ::= type $identifier [ $params ] = $data-type-expression ;
```

Example:

```rs
type byte = (logic[8]);
type word = (logic[32]);
```

### Struct Definitions

A named struct type is defined as:

```bnf
struct $identifier [ $params ] {
  $identifier : $data-type-expression
  { , $identifier : $data-type-expression }
}
```

Example:

```rs
struct address_data_pair {
  data : (logic[8]),
  addr : (logic[16])
}
```

### Enum Definitions

An enum type is defined as:

```bnf
enum $identifier {
  $identifier { , $identifier }
}
```

Example:

```rs
enum state {
  IDLE,
  BUSY,
  DONE
}
```


## 5. Channels

A channel is the fundamental mechanism for communication and synchronization between a pair of processes.

**Endpoints:** Each channel has **two endpoints**, corresponding to the two ends of the communication. Conceptually, a channel resembles a pipe that transports values between its two endpoints.

**Messages** : A channel defines a set of **messages** that can be sent and received in specified directions. Each message carries a value of a given data type.

**Timing Contract:** Each message is associated with a timing contract, which specifies how long the exchanged value remains valid after the communication completes. This duration is referred to as the message’s *lifetime*.

**Synchronization:** All messages in Anvil are synchronous: a message transfer completes only when both endpoints are ready. Consequently, sending and receiving occur at the same logical time. The time of synchronization is defined as the time at which the send/receive operation completes.

By default, all messages use two-way handshake synchronization. However, Anvil allows users to specify different synchronization modes for each endpoint of a message. This enables the compiler to avoid generating unnecessary handshakes when synchronization is not required or can be determined statically.



### Channel Classes

A channel class serves as a template for creating channels. It specifies:

- the set of messages,
- their directions,
- their data types,
- their timing contracts, and
- their synchronization modes.

Channel classes play a role analogous to interface definitions in languages such as SystemVerilog. However, while SystemVerilog interfaces specify only the data types and directions of communication, Anvil channel classes additionally define the _timing-contract_. Channel classes may also be parameterized by type and integer parameters.


```bnf
channel-class-definition ::= "chan" identifier [ params ] "{"
                               message-definition
                               ( "," message-definition )*
                             "}"

message-definition ::= message-direction identifier ":"
                       "(" data-type-expression "@" lifetime-pattern ")"
                       [ "@" sync-mode "-" "@" sync-mode ]

message-direction  ::= "left" | "right"
lifetime-pattern   ::= "#" digit+ | identifier
sync-mode          ::= "dyn"
                      | "#" digit+ [ "~" digit+ ]
                      | "#" identifier [ "+" digit+ ]
```

Here `@ sync-mode - @ sync-mode` specifies the synchronization modes for the left and right endpoints for that particular message respectively.


For example, consider the following channel class definition for a simple request-response channel:

```rs
chan simple_ch<T : data_type, W : int> {
    left  req : (T@ req),
    right res : (logic[W]@#1) @dyn - @#1
}
```

This channel class declares:

- Parameters:

  - `T` : a data type parameter,
  - `W` :  an integer parameter.

- Messages:

  - `req`: received on the **left** endpoint with value type `T` and lifetime `req`.
  - `res`: received on the **right** endpoint with value type `logic[W]` and lifetime `#1`.

The synchronization contract for `res` specifies:

- The left side (sender here) may initiate communication at any time (`dyn`).
- The right side (receiver here) must be ready exactly one cycle later (`@#1`).



For a detailed explanation of lifetime patterns and synchronization modes, see the [tutorial](https://github.com/jasonyu1996/anvil/tree/master/docs/tutorial/L2-Communication)

---

### Channel Creation
Channels are instantiated from channel classes to obtain a pair of endpoints.


```bnf
channel-creation ::= "chan" identifier "--" identifier ":"
                     identifier [ param-vals ] ";"
```

For example:

```rs
chan ep_le -- ep_ri : simple_ch<logic[8], 1>;
```

This creates a channel of type `simple_ch<logic[8], 1>` and binds its endpoints to
`ep_le` (left) and `ep_ri` (right).
