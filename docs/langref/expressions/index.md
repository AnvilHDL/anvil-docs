# Expressions

Anvil describes hardware behavior through the expression forms below.

```{toctree}
:maxdepth: 1

timing-and-bindings
conditionals
operations
communication
functions-and-casts
generation
```

## Debug Statements

During simulation, `dprint` prints messages to the console, much like `$display` in SystemVerilog. The expression `dfinish` terminates the simulation. Both expressions are for simulation only.

```bnf
debug-print ::= "dprint" string-literal "(" expression ")" 
debug-finish ::= "dfinish"
```
