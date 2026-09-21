# Timing and Bindings

## Cycle

The `cycle` expression introduces a delay in the evaluation of expressions.

```
cycle-expression ::= cycle { $digit }+
```

The `cycle` expression evaluates to the unit value `()` after the specified number of cycles. For example, `cycle 3` evaluates to `()` after three cycles. Introducing this delay is the expression's sole purpose.

## Wait

The `wait` expression controls time by sequencing expressions.

```
wait-expression ::= $expression >> $expression
```

In `e1 >> e2`, evaluation of `e2` starts only after `e1` has completed. The combined expression returns the result of `e2` when both expressions have completed.

For example, consider the following program:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.kisp-lab.org
    
    proc Top() {
        reg counter : logic[8];
        loop {
            dprint"[Cycle %d] Starting computation..." (*counter) >>
            cycle 2 >>
            dprint"[Cycle %d] Computation done after 2 cycles." (*counter) >>
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

The first thread begins each iteration by printing `"[Cycle X] Starting computation..."`, where `X` is the current value of `counter`. It then waits two cycles and prints `"[Cycle X] Computation done after 2 cycles."`. After one more cycle, the iteration ends and the next begins.

The second thread increments `counter` every cycle. The third waits ten cycles and then terminates the simulation.

## Join

```
join-expression ::= $expression ; $expression
```

The expression `e1; e2` starts evaluating `e1` and `e2` immediately, at the same time. It returns the result of `e2` when both evaluations complete.

For example, consider the modified version of the previous program:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.kisp-lab.org
    
    proc Top() {
        reg counter : logic[8];
        loop {
            dprint"[Cycle %d] Starting computation..." (*counter) >>
            (cycle 3; cycle 2) >>
            dprint"[Cycle %d] Computation done after Later of (2,3) cycles." (*counter) >>
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

The first thread begins each iteration by printing `"[Cycle X] Starting computation..."`, where `X` is the current value of `counter`. It then starts `cycle 3` and `cycle 2` at the same time. The join completes when both delays have finished, after three cycles.

The thread then prints `"[Cycle X] Computation done after Later of (2,3) cycles."`. After one more cycle, the iteration ends and the next begins.


> *Note* The `>>` and `;` operators are right-associative and have the same precedence. For example, `e1; e2 >> e3; e4 >> e5` is equivalent to `(e1; (e2 >> (e3; (e4 >> e5))))`.

## Let

```
let-expression ::= let $identifier = $expression ; $expression
let-wait-expression ::= let $identifier = $expression >> $expression
```

The expression `let x = e1; e2` binds `e1` to the identifier `x`, which can be referenced in `e2`. It starts evaluating `e1` and `e2` at the same time. Once both complete, it returns the result of `e2`.

The form `let x = e1 >> e2` waits for `e1` to complete before starting `e2`. The two forms therefore follow the same distinction as join and wait.

For example:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.kisp-lab.org

    proc Top() {
        reg counter : logic[8];
        loop {
            let cnt = *counter + 8'd1 ;
            dprint"[Cycle %d] Hello World in Anvil!" (cnt) >>
            set counter := *counter + 8'd1
        }
        loop{
            cycle 10 >>
            dfinish
        }
    }
```

In this program, in each iteration of the loop, the expression `*counter + 8'd1` is evaluated and bound to the identifier `cnt`. The debug print then prints the value of `cnt`.
