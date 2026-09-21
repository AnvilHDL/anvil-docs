# Conditionals

## If-Else

```
if-else-expression ::= if $expression { $expression } [ else ( { $expression } | $if-else-expression ) ]
```

The expression `if e1 { e2 } else { e3 }` selects a branch using the result of `e1`. This result must already be available and must still be valid. If it is all zero, evaluation starts in `e3`; otherwise, it starts in `e2`. The expression returns the selected branch's result.

The `else` clause is optional: `if e1 { e2 }` is equivalent to `if e1 { e2 } else { () }`. Multiple conditionals can also be chained, for example:
`if e1 { e2 } else if e3 { e4 } else { ... }`.

For example:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.capstone.kisp-lab.org

    proc Top() {
        reg counter : logic[8];
        loop {
            if (*counter & 8'd1 == 8'd0) {
                dprint"[Cycle %d] Even cycle" (*counter) >>
                cycle 3
            } else {
                dprint"[Cycle %d] Odd cycle" (*counter) >>
                cycle 1
            } >>
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

On each iteration, the program prints whether the current value of `counter` is even or odd. The even branch introduces a delay of three cycles, and the odd branch introduces a delay of one cycle. Branches can therefore take different times to complete. Anvil's semantics and type system support this behavior.

## Match

Match expressions provide a pattern-matching primitive.

```
match-expression ::= match $expression { ($expression | _) => $expression {, ($expression | _) => $expression } }
```

The expression
`match e { e1 => e1', e2 => e2', ..., en => en', _ => e' }`
is syntax sugar for:

```
if e == e1 { e1' } else if e == e2 { e2' } else if ... else if e == en { en' } else { e' }
```

The `_ => e'` (default branch) must appear **exactly once** in the match expression.

For example:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.capstone.kisp-lab.org

    proc Top() {
        reg counter : logic[8];
        loop{
            match (*counter) {
                8'd0 => dprint"[Cycle %d] Zero" (*counter),
                8'd1 => dprint"[Cycle %d] One" (*counter),
                8'd2 => dprint"[Cycle %d] Two" (*counter),
                _     => dprint"[Cycle %d] Many" (*counter)
            } >>
            set counter := *counter + 8'd1
        }
        loop{
            cycle 10 >>
            dfinish
        }
    }
```

This program prints whether the current cycle (value of `counter`) is `0`, `1`, `2`, or `Many` in each iteration of the loop.
