# Arithmetic and Concatenation

## Arithmetic Expressions

```
binary-arith-expression ::= $expression $binary-arith-operator $expression
unary-arith-expression ::= $unary-arith-operator $expression

binary-arith-operator ::= + | - | & | | | ^ | < | > | <= | >= | == | != | in
unary-arith-operator ::= - | ~ 
```

These expressions evaluate according to their operators. A unary expression completes when its operand completes; a binary expression completes when both operands complete.

> **Note:** The `in` operator checks whether the value of the left expression is contained in the set specified by the right expression. The right-hand side must be a set of expressions enclosed in curly braces `{}`.
> For example, `e1 in { e2, e3, e4 }` evaluates to true if the value of `e1` matches any of the values of `e2`, `e3`, or `e4`. This is syntax sugar for
> `e1 == e2 || e1 == e3 || e1 == e4`.

For example, consider the following program:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.capstone.kisp-lab.org
    
    enum state {
        IDLE,
        BUSY,
        DONE
    }
    proc Top() {
        reg counter : logic[8];
        reg state : state;
        loop{
            if (*state in { state::IDLE, state::BUSY }){
                dprint"[Cycle %d] Active State" (*counter)
            } else if (*state == state::DONE){
                dprint"[Cycle %d] Done State" (*counter)
            } else {
                dprint"[Cycle %d] Unknown State" (*counter)
            } >>
            set counter := *counter + 8'd1;
            set state := *state + 2'd1
        }
        loop{
            cycle 10 >>
            dfinish
        }
    }
```

## Concatenation

```
concat-expression ::= #{ $expression {, $expression} }
```

The expression `#{e1, e2, ..., en}` concatenates the results of `e1` through `en` into an array. It completes when all of these expressions have completed. In the result, `e1` occupies the high bits and `en` occupies the low bits. For example, `#{2'b01, 5'b01101, 1'b1}` produces `8'b01011011`.
