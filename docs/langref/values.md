# Values

Anvil supports several kinds of values, including:

## Logic

`logic` is the most atomic value type in Anvil. It represents a single bit and can take the values:

```anvil
1'b0
1'b1
```

## Array

An array is a fixed-length sequence of values of the same type. A logic array of `n` bits is written as:

```text
n'b...
n'd...
n'h...
```

Example:

```anvil
8'b10101010        // binary
8'hAA              // hexadecimal
8'd170             // decimal
```

All three examples represent the same 8-bit value.


Arrays of arbitrary data types are written as:

```anvil
[ v0, v1, ..., v(n-1) ]
```

Example:

```anvil
[ 8'd1, 8'd2, 8'd3 ]
```

This is an array of three 8-bit logic arrays.

## Struct

A `struct` is a composite type that groups multiple named fields, potentially of different data types. A struct value is constructed using the syntax:

```text
struct_type_ident::{ field1 = value1; field2 = value2; ... }
```

Example:

```anvil
address_data_pair::{ data = 8'b10101010; addr = 16'hFFEE }
```

## Enum

An `enum` represents a named constant chosen from a finite set. The syntax to refer to an enum constant is:

```anvil
enum_type_ident::const_ident
```

Example:

```anvil
state::IDLE
state::BUSY
```
