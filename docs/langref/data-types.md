# Data Types

Anvil supports both primitive and user-defined data types. Types are constructed using data type expressions.

## Data Type Expressions

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

```anvil
logic
address_data_pair
logic[8]
```

## Type Definitions

A named type can be introduced using a type definition:

```bnf
data-type-definition ::= type $identifier [ $params ] = $data-type-expression ;
```

Example:

```anvil
type byte = (logic[8]);
type word = (logic[32]);
```

## Struct Definitions

A named struct type is defined as:

```bnf
struct $identifier [ $params ] {
  $identifier : $data-type-expression
  { , $identifier : $data-type-expression }
}
```

Example:

```anvil
struct address_data_pair {
  data : (logic[8]),
  addr : (logic[16])
}
```

## Enum Definitions

An enum type is defined as:

```bnf
enum $identifier {
  $identifier { , $identifier }
}
```

Example:

```anvil
enum state {
  IDLE,
  BUSY,
  DONE
}
```
