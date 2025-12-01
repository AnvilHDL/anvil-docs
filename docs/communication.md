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