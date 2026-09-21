# Functions and Casts

## Functions

Functions allow code reuse. In the current version, they behave like macros at the level of the expression's abstract syntax tree (AST).

```
function-definition ::= func $identifier ( [$identifier {, $identifier}] ) { $expression }
```

Calling a function replaces the call with the function body and introduces bindings for its parameters:

```
call-expression ::= call $identifier ( [$expression {, $expression}] )
```

For example:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.kisp-lab.org

    func max(a, b) {
        if a > b {
            a
        } else {
            b
        }
    }
    proc Top() {
        reg counter : logic[8];
        loop{
            let sum = call max( *counter, 8'd5 ) >>
            dprint"[Cycle %d] Max : %d" (*counter, sum) >>
            cycle 1
        }
        loop{
            set counter := *counter + 8'd1
        }
        loop{
            cycle 10 >>
            dfinish
        }
    }
```

In this program, we define a function named `max` that takes two parameters, `a` and `b`, and returns the maximum of the two. Inside the `Top` process, we call this function with the current value of the `counter` register and the constant `8'd5`. The result is bound to the identifier `sum`, which is then printed in the debug statement.  

> **Note:** In the current version, a function can access all bindings in scope at its call site, including registers inside processes.

## Cast

Simulators and compilers for traditional HDLs often silently ignore data-width mismatches. These mismatches can lead to unintended behavior. Anvil prevents such issues through strict data-type checking. It also provides an option to restrict casts between abstract data types; this restriction is disabled by default.

When a conversion is necessary, it can be written explicitly with a cast expression:

```
cast-expression ::= "<" ( $expression ) "::" $data-type-expression ">"
```

For example:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.kisp-lab.org

    proc Top() {
        loop{
            let x = 2'd2 >>
            let x4 = <(x):: logic[4]> >>
            let x1 = <(x4):: logic[1]> >>
            dprint"Casted values: (%b) = | %b | %b" (x, x4, x1) >>
            dfinish >>
            cycle 1
        }
    }
```

In this program, the value `2'd2` is first cast to a `logic[4]`, which **extends the bit-width**, producing `4'b0010`. It is then cast to a `logic[1]`, which **truncates the higher-order bits**, resulting in `1'b0`.
The debug print statement shows the original value and its casted forms.
