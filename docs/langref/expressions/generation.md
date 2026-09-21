# Generate Expressions

## Generate

Repetitive code can be generated programmatically with two constructs: `generate` and `generate_seq`.

```
generate-expression ::= "generate" ( $identifier : $start, $end, $step ) { $expression }
generate-seq-expression ::= "generate_seq" ( $identifier : $start, $end, $step ) { $expression }
```

Both constructs unroll the body for each value of the loop variable, from `start` to `end` inclusive, using the specified `step`. The `generate` construct combines these bodies in parallel, like a join expression. The `generate_seq` construct combines them in sequence, like a wait expression.


For example:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.kisp-lab.org

    type byte = (logic[8]);
    proc Bar(){
      reg mem : byte[4];
      reg counter : logic[8];
      loop{
            generate_seq (i : 0, 3, 1) {
                set mem[i] := <(i):: logic[8]> >>
                dprint"[Cycle %d][Bar] mem[%d] = %d" (*counter, i, *mem[i])

            } >>
            dprint"[Cycle %d][Bar] Memory initialized." (*counter) >>
            dfinish >>
            cycle 1
        }
        loop{
          set counter := *counter + 8'd1
        }

    }
    proc Top() {
        reg mem : byte[4];
        reg counter : logic[8];
        spawn Bar();
        loop{
            generate (i : 0, 3, 1) {
                set mem[i] := <(i):: logic[8]>
            } >>
            dprint"[Cycle %d][Top] Memory initialized. (%d , %d, %d, %d)" (*counter, *mem[0], *mem[1], *mem[2], *mem[3])
        }
        loop{
          set counter := *counter + 8'd1
        }
        
    }

```

In this program, the `Top` process uses the `generate` construct to initialize an array `mem` in parallel, while the `Bar` process uses the `generate_seq` construct to initialize its own array `mem` in sequence. Each iteration of the loop variable `i` sets the corresponding element of the array and prints its value. The `Top` process completes the initialization in one cycle, while the `Bar` process takes multiple cycles to complete its sequential initialization.
