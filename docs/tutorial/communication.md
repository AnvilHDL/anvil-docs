# 3. Communication is the key

Hardware components communicate with each other. As discussed in the [background](./background.md), this communication is prone to **timing hazards** when components lack precise, explicit **timing contracts**.

The interface definitions in de-facto HDLs contribute to this problem. Consider the following SystemVerilog interface for a module named `Foo`:

```verilog
module Foo(
    input logic clk_i,
    input logic rst_i,
    input logic[7:0] input_i,
    input logic valid_i,
    output logic ack_o,
    output logic[7:0] output_o,
    output logic valid_o,
    input logic ack_i
    // and other ports...
);
```

This interface specifies only the data types and directions of its signals. An experienced SystemVerilog programmer would also understand the intended two-way AXI-like valid-ack handshake. That intent, however, is implicit. The designer must extract it and implement the required timing constraints.

Those constraints cannot be read from the interface alone. How long must `input_i` remain stable after the exchange? How long will `output_o` remain valid after acknowledgement? Answering these questions requires additional documentation or prior knowledge of the module. Missing or misunderstood constraints can cause the timing hazards shown in the previous lesson.

---

## Channels in Anvil

Anvil makes timing contracts part of the interface through **channels**. At the hardware level, a channel is a bundle of wires that two components use to exchange values. Its definition also states the guarantees and assumptions about each message's *lifetime*.

The communication above can be expressed with the following channel definition:

```anvil
chan foobar_ch {
    left  req : (logic[8]@res),
    right res : (logic[8]@#1)
}
```

The `chan` keyword introduces the channel name, `foobar_ch`. The body specifies the **message identifiers**, their **data types**, and their **timing contracts** for the communicating endpoints, `left` and `right`.

The `left` endpoint receives the message `req` of type `logic[8]`. Its lifetime, written `@res`, is a guarantee from the `right` endpoint: the left side can safely use the value without it changing until `res` is acknowledged. Because the acknowledgement can occur at different times at run time, this lifetime is dynamic.

The `right` endpoint receives the message `res`, also of type `logic[8]`. Its lifetime, written `@#1`, guarantees that the value remains stable for exactly one cycle after acknowledgement. This fixed duration makes the lifetime static.

Compiling this channel to SystemVerilog generates an interface equivalent to the one above, though the signal names may be less readable. The timing contract is now explicit in the interface.

This explicit encoding of timing contracts provides two key benefits:

1. **For designers**, both the author of a module and the user of a module work with a clear, unambiguous description of the communication timing.

2. **For the type system**, timing safety can be enforced modularly. Specifically:

   - Values created inside a process must be used within their valid scopes or lifetimes. Values derived from channel messages inherit the lifetimes specified in the channel definition.
   - For values communicated over channels, the underlying registers must respect the promised lifetimes. Enforcing these lifetimes prevents timing hazards by construction.


## Anvil in Action!

As a concrete example, consider the following process definition that uses the channel defined above.

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.kisp-lab.org

      chan foobar_ch {
          left req : (logic[8]@res),
          right res : (logic[8]@#1)
      }
      func is_even(x){
        x & 8'd1 == 8'd0
      }
      func answer_to_universe(x){
        if (call is_even(x)){
          8'd42
        }
        else{
          8'd0
        }
      }

      proc Foo(ep : left foobar_ch) {
          reg cycle_count : logic[8];
          reg ans : logic[8];
          loop {
              let x = recv ep.req >>
              if(call is_even(x)){
                dprint"[Cycle %d] Received even number %d : Should get answer 42 in 3 cycles" (*cycle_count, x) >>
                cycle 2 >>
                set ans := call answer_to_universe(x)
              }
              else{
                dprint"[Cycle %d] Received odd number %d : Should get answer 0 in 4 cycles" (*cycle_count, x) >>
                cycle 3 >>
                set ans := call answer_to_universe(x)
              } >>
              send ep.res (*ans) >>
              cycle 1
          }
          loop{
            set cycle_count := *cycle_count + 8'd1
          }
      }


     proc Top(){
        chan ep_le -- ep_ri : foobar_ch;
        spawn Foo(ep_le);
        reg input : logic[8];
        reg counter : logic[8];
        loop {
            send ep_ri.req (*input) >>
            set input:= *input + 8'd1 >>
            let data = recv ep_ri.res >>
            dprint"[Cycle %d] The answer to the universe is %d" (*counter, data) >>
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

The example defines two processes, `Foo` and `Top`. The `Foo` process communicates with its environment through the left endpoint of `foobar_ch`.

Its first loop begins by receiving `req` with a `recv` expression. A `let` binding names the received value `x`. As discussed earlier, the `>>` operator starts each subsequent expression only after the previous one completes.

The following `if` expression branches according to whether `x` is even or odd. It uses `call` to invoke a function, allowing combinational logic to be reused. Depending on the branch taken, the process:

1. Prints a debug message describing the expected response,
2. Waits for either 2 or 3 cycles using the `cycle` expression, and
3. Sets the value of the `ans` register to the result of calling the `answer_to_universe` function with `x` as its argument.

The `answer_to_universe` function also bases its result on whether `x` is even or odd. Once this result has been stored in `ans`, the process reads the register with `*` and sends its value using `send`. It then waits one cycle before starting the next iteration.

A second loop in `Foo` runs concurrently and increments `cycle_count` every cycle. The `dprint` statements use this register to display the current clock cycle.



The `Top` process drives the communication. Its `chan` declaration creates the two endpoints of `foobar_ch`. The following `spawn` expression passes the left endpoint, `ep_le`, to `Foo`.

The `Top` process also declares two registers, `input` and `counter`, both of type `logic[8]`. Inside its main loop, the process:

1. Sends the value of the `input` register over the channel using `send`,
2. Immediately increments the value of `input` using `set`,
3. Receives the response message labeled `res` using `recv` and binds it to `data`,
4. Prints the current cycle count and the received value using `dprint`, and
5. Waits for one cycle before starting the next iteration.

The `Top` process also has two concurrent loops. One increments `counter` every cycle. The other waits ten cycles and then terminates the simulation with `dfinish`.


The update to `input` violates the channel's timing contract. The request lifetime is `@res`, so the value sent over `req` must remain stable until the corresponding response is acknowledged. In `Top`, however, `input` is updated immediately after the send.

Running the program in the playground produces a type error. It reports that `input`, borrowed during the send of `req`, is being mutated during its loan period.

To observe the effect of this error, disable the lifetime checker with the editor widget's toggle. The value of `input` then changes before `res` is acknowledged, producing unexpected outputs. Inside the even branch of `Foo`, `x` may behave as if the input were odd, and vice versa.

To preserve `input` until the response arrives, move the `set` expression after the receive of `res`:



```{eval-rst}
.. raw:: html

   <details>
   <summary style="cursor: pointer; font-weight: bold; font-size: 1.1em;">Did the fix work ?</summary>
   <div style="padding: 10px 0;">

.. anvil-playground::
    :playground-url: https://anvil.kisp-lab.org

      chan foobar_ch {
          left req : (logic[8]@res),
          right res : (logic[8]@#1)
      }
      func is_even(x){
        x & 8'd1 == 8'd0
      }
      func answer_to_universe(x){
        if (call is_even(x)){
          8'd42
        }
        else{
          8'd0
        }
      }

      proc Foo(ep : left foobar_ch) {
          reg cycle_count : logic[8];
          reg ans : logic[8];
          loop {
              let x = recv ep.req >>
              if(call is_even(x)){
                dprint"[Cycle %d] Received even number %d : Should get answer 42 in 3 cycles" (*cycle_count, x) >>
                cycle 2 >>
                set ans := call answer_to_universe(x)
              }
              else{
                dprint"[Cycle %d] Received odd number %d : Should get answer 0 in 4 cycles" (*cycle_count, x) >>
                cycle 3 >>
                set ans := call answer_to_universe(x)
              } >>
              send ep.res (*ans) >>
              cycle 1
          }
          loop{
            set cycle_count := *cycle_count + 8'd1
          }
      }


     proc Top(){
        chan ep_le -- ep_ri : foobar_ch;
        spawn Foo(ep_le);
        reg input : logic[8];
        reg counter : logic[8];
        loop {
            send ep_ri.req (*input) >>
            let data = recv ep_ri.res >>
            set input:= *input + 8'd1 >>
            dprint"[Cycle %d] The answer to the universe is %d" (*counter, data) >>
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

.. raw:: html

   </div>
   </details>
```


This change produces a different type error: `Top` uses `data` after its lifetime expires. The response lifetime, `@#1`, guarantees validity for only one cycle after the send of `res`. Any use of `data` must therefore occur within one cycle of the receive.

The code instead uses `data` after `set`. Because `set` consumes one cycle, it delays that use beyond the permitted lifetime. The type checker therefore rejects the program.

To use `data` within its lifetime, it must be consumed before any operation advances the cycle. Moving `set` after `dprint` ensures that the print uses `data` in time:


```{eval-rst}
.. raw:: html

   <details>
   <summary style="cursor: pointer; font-weight: bold; font-size: 1.1em;">Fixed Code!</summary>
   <div style="padding: 10px 0;">

.. anvil-playground::
    :playground-url: https://anvil.kisp-lab.org

      chan foobar_ch {
          left req : (logic[8]@res),
          right res : (logic[8]@#1)
      }
      func is_even(x){
        x & 8'd1 == 8'd0
      }
      func answer_to_universe(x){
        if (call is_even(x)){
          8'd42
        }
        else{
          8'd0
        }
      }

      proc Foo(ep : left foobar_ch) {
          reg cycle_count : logic[8];
          reg ans : logic[8];
          loop {
              let x = recv ep.req >>
              if(call is_even(x)){
                dprint"[Cycle %d] Received even number %d : Should get answer 42 in 3 cycles" (*cycle_count, x) >>
                cycle 2 >>
                set ans := call answer_to_universe(x)
              }
              else{
                dprint"[Cycle %d] Received odd number %d : Should get answer 0 in 4 cycles" (*cycle_count, x) >>
                cycle 3 >>
                set ans := call answer_to_universe(x)
              } >>
              send ep.res (*ans) >>
              cycle 1
          }
          loop{
            set cycle_count := *cycle_count + 8'd1
          }
      }


     proc Top(){
        chan ep_le -- ep_ri : foobar_ch;
        spawn Foo(ep_le);
        reg input : logic[8];
        reg counter : logic[8];
        loop {
            send ep_ri.req (*input) >>
            let data = recv ep_ri.res >>
            dprint"[Cycle %d] The answer to the universe is %d" (*counter, data) >>
            set input:= *input + 8'd1 >>
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

.. raw:: html

   </div>
   </details>
```

---

## Synchronization Patterns

In the previous examples, both the sender and the receiver can block during communication. This is a *latency-insensitive interface*. Such interfaces are useful when communication latency is variable or unknown at design time.

When latency is fixed and known in advance, a channel can describe it with explicit **synchronization patterns**. These patterns specify exact timing relationships between messages. The compiler uses those relationships to determine which handshake signals are required and which can be omitted.

Synchronization patterns can be classified into four cases, depending on whether the sender and the receiver can guarantee a fixed communication frequency:

- **Case 1:** Sender: *dynamic*, Receiver: *dynamic* &rarr; Latency-insensitive interface (as shown earlier)

- **Case 2:** Sender: *static*, Receiver: *dynamic* &rarr; Acknowledgement required from the receiver

- **Case 3:** Sender: *static*, Receiver: *static* &rarr; No handshake required

- **Case 4:** Sender: *dynamic*, Receiver: *static* &rarr; Valid signal required from the sender

The following example illustrates Cases 2 and 3:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.kisp-lab.org

      chan foobar_ch {
          left req : (logic[8]@#1) @dyn - @#1,
          right res : (logic[8]@#1) @#req - @#req
      }
      func is_even(x){
        x & 8'd1 == 8'd0
      }
      func answer_to_universe(x){
        if (call is_even(x)){
          8'd42
        }
        else{
          8'd0
        }
      }

      proc Foo(ep : left foobar_ch) {
          reg cycle_count : logic[8];
          reg prev_x : logic[8];
          loop {
              if(call is_even(*cycle_count)){
                  cycle 2
              }
              else{
                  cycle 3
              } >>
              let x = recv ep.req >>
              let ans = call answer_to_universe(*prev_x) >>
              send ep.res (ans) >>
              dprint"[Cycle %d] Received %d previously, Sent %d" (*cycle_count, *prev_x, ans) >>
              set prev_x := x
          }
          loop{
            set cycle_count := *cycle_count + 8'd1
          }
      }


     proc Top(){
        chan ep_le -- ep_ri : foobar_ch;
        spawn Foo(ep_le);
        reg input : logic[8];
        reg counter : logic[8];
        loop {
            send ep_ri.req (*input) >>
            let data = recv ep_ri.res >>
            dprint"[Cycle %d] The answer to the universe is %d" (*counter, data) >>
            set input:= *input + 8'd1
        }
        loop{
          set counter := *counter + 8'd1
        }
        loop{
          cycle 20 >>
          dfinish
        }
      }
```

In this example, the synchronization pattern for the `req` message is specified as:

```
@dyn - @#1
```

The left endpoint receives `req`. Its `@dyn` pattern indicates that it cannot guarantee a fixed communication frequency, so it acknowledges messages dynamically. The right endpoint sends `req`. Its `@#1` pattern promises readiness to send a new request exactly one cycle after the previous request.

The sender must therefore wait for the receiver's acknowledgement before transmitting the next request. The compiler generates the required handshake signals, and the type system enforces that the sender does not delay the next request beyond one cycle after the previous one.

For the `res` message, the synchronization pattern is:

```
@#req - @#req
```

Both endpoints promise to communicate `res` in the same cycle as the corresponding `req`. This shared schedule requires no handshake for `res`. The compiler checks that both endpoints respect the timing relationship.

As a result, if you run this program as written, the type checker verifies that all synchronization constraints are satisfied, and the program executes without any unexpected behavior.


Either of the following changes violates the synchronization patterns:

- Registering `ans` in `Foo` before sending it.
- Delaying the send of `req` in `Top`.

The type checker detects either mismatch and rejects the program. Try these changes to explore how synchronization patterns constrain communication.


A synchronization pattern specifies the promises made by the left and right endpoints through `left_side_pattern` and `right_side_pattern`. In the syntax below, `<n>` is a non-negative number of cycles and `<msg_id>` identifies a message in the same channel:

```bnf
sync_pattern ::= '@' left_side_pattern '-' '@' right_side_pattern
left_side_pattern ::= '#'<n> | '#'<msg_id> '+' <n> | 'dyn'
right_side_pattern ::= '#'<n> | '#'<msg_id> '+' <n> | 'dyn'
```

Only a restricted set of combinations is well-formed:

1. `@dyn - @#1`
2. `@#1 - @dyn`
3. `@#1 - @#1`
4. `@#msg + n - @#msg + n`
5. `@dyn - @#msg`
6. `@#msg - @dyn`
7. `@dyn - @dyn` (equivalent to writing no synchronization pattern)

Some combinations are semantically ill-formed, such as:

- `@dyn - @#n` for `n > 1`
- `@#n - @#m` for `n ≠ m`
- etc.

(As a hint, consider whether it is always possible for two fixed but mismatched schedules to remain synchronized.)

In `@dyn - @#1` and `@#1 - @dyn`, one endpoint is ready to exchange messages every cycle. The other chooses dynamically when to communicate. The compiler generates handshake signals for the dynamic side and checks the static side's one-cycle schedule.

In `@#msg - @dyn` and `@dyn - @#msg`, one endpoint promises readiness after the corresponding message `msg` is exchanged. The other cannot guarantee a fixed latency. Here too, the compiler generates handshake signals for the dynamic side and checks the static side's schedule.

In `@#msg + n - @#msg + n`, both endpoints promise to communicate exactly `n` cycles after `msg`. In `@#1 - @#1`, both promise to communicate every cycle. These shared schedules require no handshake; the compiler checks that both endpoints respect the timing relationship.
