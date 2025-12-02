# 3. Communication is the key

The key functionality of hardware components is to communicate with each other. As discussed in the [background](./background.md), such communication is often subject to **timing violations** due to the lack of precise and explicit **timing contracts** between components.

However the cause can be attributed to the interface definition for defacto-HDLs. For example, consider the following SystemVerilog interface for a module `Foo`:

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

This interface specifies only the data types and directionality of the signals. However, to an experienced SystemVerilog programmer, it is also *implicitly understood* that the two sides intend to use a two-way AXI-like valid-ack handshake. The problem is that this information is not explicitly captured in the interface itself. Instead, the burden of extracting this intent -- and implementing the required timing constraints--falls entirely on the designer.

Concretely, questions such as: *How long is `input_i` expected to remain stable after the exchange?* or *How long will `output_o` remain valid after being acknowledged?* cannot be answered by the interface alone. They require additional documentation or prior knowledge about the module. Any misinterpretation of these constraints-- or the complete absence of them, can lead to **timing hazards**, as shown in the previous lesson.

---

## Channels in Anvil

Anvil addresses this problem of timing hazards through an abstraction of communication called **channels**. Unlike traditional interfaces in HDLs, channels encode timing constraints directly into the interface itself.

At the hardware level, a channel is still just a bundle of wires that provides a message-like transmit and receive abstraction. However, its interface explicitly includes the timing behavior of those messages. For the same interface as above, the communication can be expressed in Anvil using the following channel definition:

```rs
chan foobar_ch {
    left req : (logic[8]@res),
    right res : (logic[8]@#1)
}
```

The channel definition begins with the keyword `chan`, followed by the channel name (`foobar_ch`). It then specifies the **message identifiers**, their **data types**, and the associated **timing contracts** for each communicating endpoint (`left` and `right`).

Here, the `left` endpoint receives a message labeled `req` of type `logic[8]` with lifetime `@res`. This lifetime represents a **guarantee from the `right` endpoint** that the value can be safely used by the `left` side without changing until the abstract time when the `res` message is acknowledged. Since this acknowledgement may occur at different times at run time, the lifetime is **dynamic**.

In contrast, the `right` endpoint receives a message labeled `res` of type `logic[8]` with lifetime `@#1`, which specifies a static lifetime: the value is guaranteed to remain stable for exactly one cycle after it is acknowledged.

When this channel definition is compiled down to SystemVerilog, it generates an interface equivalent to the one shown earlier (although the signal names may be less readable). The crucial difference is that the timing contract is now part of the interface itself, rather than being implicit or relegated to documentation.

This explicit encoding of timing contracts provides two key benefits:

1. **For designers**, both the author of a module and the user of a module work with a clear, unambiguous description of the communication timing.

2. **For the type system**, timing safety can be enforced modularly. Specifically:

   - For all values created inside a process, the type system ensures that they are used only within their specified lifetimes.
   - For all values communicated over channels, the type system guarantees that the underlying registers respect the promised lifetimes, thereby preventing timing hazards by construction.


## Anvil in Action!

As a concrete example, consider the following process definition that uses the channel defined above.

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.capstone.kisp-lab.org

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
            set cycle_count := *cycle_count + 1
          }
      }


     proc Top(){
        chan ep_le -- ep_ri : foobar_ch;
        spawn Foo(ep_le);
        reg input : logic[8];
        reg counter : logic[8];
        loop {
            send ep_ri.req (*input) >>
            set input:= *input + 1 >>
            let data = recv ep_ri.res >>
            dprint"[Cycle %d] The answer to the universe is %d" (*counter, data) >>
            cycle 1
        }
        loop{
          set counter := *counter + 1
        }
        loop{
          cycle 10 >>
          dfinish
        }
      }
```

In this example, we define two processes: `Foo` and `Top`. The `Foo` process uses the left endpoint of the `foobar_ch` channel to communicate with its environment.

Inside the first loop of the `Foo` process, execution begins by receiving a message labeled `req` from the channel using the `recv` expression. The received value is bound to the variable `x` using a `let` binding. The sequencing operator `>>` ensures that each subsequent expression is executed only after the previous one completes, as discussed earlier.

After receiving the value, the process performs branching based on whether `x` is even or odd using an `if` expression. The `call` expression is simply syntactic sugar for invoking a function, allowing us to reuse combinational logic. Depending on the branch taken, the process:

1. Prints a debug message describing the expected response,
2. Waits for either 2 or 3 cycles using the `cycle` expression, and
3. Sets the value of the `ans` register to the result of calling the `answer_to_universe` function with `x` as its argument.

The `answer_to_universe` function itself also computes the result based on whether `x` is even or odd. After the `ans` register is updated, the process sends the value of `ans` over the channel using the `send` expression. The dereference operator `*` is used here to read the current value stored in the register. Finally, the process waits for one additional cycle before starting the next iteration of the loop.

In addition to this main loop, the `Foo` process contains another loop that runs concurrently. This second loop simply increments the `cycle_count` register every cycle. The value of this register is used in the `dprint` statements to display the current clock cycle.



The `Top` process is responsible for driving the communication. It first creates the two endpoints of the `foobar_ch` channel using the `chan` declaration. The left endpoint `ep_le` is passed to the `Foo` process as an argument using the `spawn` expression.

The `Top` process also declares two registers, `input` and `counter`, both of type `logic[8]`. Inside its main loop, the process:

1. Sends the value of the `input` register over the channel using `send`,
2. Immediately increments the value of `input` using `set`,
3. Receives the response message labeled `res` using `recv` and binds it to `data`,
4. Prints the current cycle count and the received value using `dprint`, and
5. Waits for one cycle before starting the next iteration.

As in `Foo`, the `Top` process also contains two additional concurrent loops. One increments the `counter` register every cycle, and the other waits for 10 cycles before terminating the simulation using the `dfinish` expression.


If you run this program in the Anvil playground, you will observe a type error. The error points out that the register `input`, which is borrowed during the `send` over `req`, is being mutated during its loan period, thereby violating the timing contract specified in the channel definition.

Recall that the channel definition specified the lifetime of the `req` message as `@res`. This means that the value sent over `req` must remain stable until the corresponding `res` message is acknowledged. However, in the `Top` process, the `input` register is updated immediately after the `send`, which violates this contract.

To observe the practical effect of this error, disable the lifetime checker using the toggle button in the editor widget. You will then notice unexpected outputs, since the value of `input` changes before the `res` message is acknowledged. In particular, inside the even branch of the `Foo` process, the value of `x` may behave as if the input were odd, and vice versa.

To fix this error, we need to ensure that the `input` register is not modified until after the `res` message has been received. Therefore we can move the `set` expression after the `res` message is received.



```{eval-rst}
.. raw:: html

   <details>
   <summary style="cursor: pointer; font-weight: bold; font-size: 1.1em;">Did the fix work ?</summary>
   <div style="padding: 10px 0;">

.. anvil-playground::
    :playground-url: https://anvil.capstone.kisp-lab.org

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
            set cycle_count := *cycle_count + 1
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
            set input:= *input + 1 >>
            dprint"[Cycle %d] The answer to the universe is %d" (*counter, data) >>
            cycle 1
        }
        loop{
          set counter := *counter + 1
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


With this change, you will now encounter a different type error indicating that the value `data` in the `Top` process is being used after its lifetime has expired. This happens because the lifetime of the `res` message is specified as `@#1`, meaning that the received value is guaranteed to remain valid for only one cycle after the `send` of `res`.

As a result, any use of `data` must occur within one cycle of the `recv` expression. However, in the code above, the value of `data` is used only after the `set` expression. Since the `set` expression itself consumes one cycle to execute, the usage of `data` is effectively delayed beyond its permitted lifetime. Hence, the type system correctly rejects this program.

To fix this violation, we must ensure that `data` is consumed before any cycle-advancing operation occurs. Concretely, this can be achieved by moving the `set` expression after the `dprint` expression, thereby guaranteeing that `data` is used safely within its one-cycle lifetime.


```{eval-rst}
.. raw:: html

   <details>
   <summary style="cursor: pointer; font-weight: bold; font-size: 1.1em;">Fixed Code!</summary>
   <div style="padding: 10px 0;">

.. anvil-playground::
    :playground-url: https://anvil.capstone.kisp-lab.org

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
            set cycle_count := *cycle_count + 1
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
            set input:= *input + 1 >>
            cycle 1
        }
        loop{
          set counter := *counter + 1
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

In the previous examples, we observed that both the sender and the receiver can block during communication. This type of interface is known as a latency-insensitive interface. Such interfaces are particularly useful when the communication latency is variable or unknown at design time.

However, in many practical designs, the communication latency is fixed and known in advance. In these cases, Anvil allows the designer to define channels with explicit synchronization patterns that specify exact timing relationships between messages. These synchronization patterns enable the compiler to decide when handshake signals are required and when they can be safely omitted.

Synchronization patterns can be classified into four cases, depending on whether the sender and the receiver can guarantee a fixed communication frequency:

- **Case 1:** Sender: *dynamic*, Receiver: *dynamic* &rarr; Latency-insensitive interface (as shown earlier)

- **Case 2:** Sender: *static*, Receiver: *dynamic* &rarr; Acknowledgement required from the receiver

- **Case 3:** Sender: *static*, Receiver: *static* &rarr; No handshake required

- **Case 4:** Sender: *dynamic*, Receiver: *static* &rarr; Valid signal required from the sender

For example, consider the following example that illustrates the use of synchronization patterns (particularly Cases 2 and 3):

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.capstone.kisp-lab.org

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
                  cycle 2 >>
              }
              else{
                  cycle 3 >>
              } >>
              let x = recv ep.req >>
              let ans = call answer_to_universe(*prev_x) >>
              send ep.res (ans) >>
              dprint"[Cycle %d] Received %d , Sent %d" (*cycle_count, *prev_x, ans) >>
              set prev_x := x
          }
          loop{
            set cycle_count := *cycle_count + 1
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
            set input:= *input + 1
        }
        loop{
          set counter := *counter + 1
        }
        loop{
          cycle 10 >>
          dfinish
        }
      }
```

In this example, the synchronization pattern for the `req` message is specified as:

```
@dyn - @#1
```

This indicates that the left endpoint (here, the receiver) cannot guarantee a fixed communication frequency and therefore acknowledges messages dynamically. In contrast, the right endpoint (sender) promises that it is ready to send a new `req` message exactly one cycle after the previous `req`.

From this information, the compiler can infer that the sender must wait for an acknowledgement from the receiver before transmitting the next `req` message. Consequently, it automatically generates the necessary handshake signals. At the same time, the type system enforces that the sender does not delay the next `req` beyond one cycle after the previous one.

For the `res` message, the synchronization pattern is:

```
@#req - @#req
```

This pattern specifies that both endpoints promise to communicate `res` in the exact same cycle as the corresponding `req`. Since both sides guarantee a fixed schedule, no handshake is required for `res`. Instead, the compiler only needs to ensure that both sides respect this fixed timing relationship.

As a result, if you run this program as written, the type checker verifies that all synchronization constraints are satisfied, and the program executes without any unexpected behavior.


If you now experiment by:

- Registering the `ans` value in the `Foo` process before sending it, or
- Delaying the `send` of `req` in the `Top` process,

the synchronization patterns will be violated. In both cases, the type checker will detect the mismatches and reject the program. You are encouraged to try these modifications to gain a better intuition for how synchronization patterns constrain communication.


The general syntax of synchronization patterns is defined as follows:

```bnf
sync_pattern ::= '@' left_side_pattern '-' '@' right_side_pattern
left_side_pattern ::= '#'<n> | '#'<msg_id> '+' <n> | 'dyn'
right_side_pattern ::= '#'<n> | '#'<msg_id> '+' <n> | 'dyn'
```

Here:

- `<n>` is a non-negative integer representing a number of cycles.
- `<msg_id>` is a message identifier defined in the same channel.

The `left_side_pattern` specifies the timing behavior promised by the left endpoint, while the `right_side_pattern` specifies the timing behavior promised by the right endpoint.

However, only a restricted set of combinations are currently considered well-formed:

1. `@dyn - @#1`
2. `@#1 - @dyn`
3. `@#1 - @#1`
4. `@#msg + n - @#msg + n`
5. `@dyn - @dyn` (equivalent to writing no synchronization pattern)

Some combinations are semantically ill-formed, such as:

- `@dyn - @#n` for `n > 1`
- `@#n - @#m` for `n ≠ m`
- etc.

(As a hint: consider whether it is always possible for two fixed but mismatched schedules to remain synchronized.)

Finally, while some additional patterns are theoretically valid, they are not yet supported in the current version of Anvil. We plan to extend the supported synchronization patterns in future versions of the language.

---