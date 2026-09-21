# Registers

A register provides the means to maintain **persistent state**.

## Register Creation

A register can be defined inside a process.

```bnf
reg-creation ::= reg $identifier : $data-type-expression [$param-vals] ;
```

The statement `reg r : dtype;` defines a new register with identifier `r` and data type `dtype`.


## Register Read

A register can be read using the `*` operator.

```bnf
reg-read-expression ::= *$identifier
```

The expression `*r` evaluates immediately to the current value of the register `r`.
The value remains available until the next write to `r`.

Upon reset, the initial value of a register is all zeros.



## Register Write

A register can be written using the `set` expression.

```bnf
set-expression ::= set $lval := $expression
lval ::= $identifier | $lval.$identifier | $lval [ $expression ] | $lval [ $expression+:{$digit}+ ]
```

The `set` expression evaluates to `()` **delayed by one cycle**. All expressions involved
must have been evaluated and must have valid results. The new value of the register becomes visible in the **next cycle**.

For example, `set r := e` writes the evaluated result of `e` to the register `r` after one cycle.
