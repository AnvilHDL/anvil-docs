# Tour of Anvil: Syntax and Features


This tour explains Anvil's language constructs and their semantics, using small code examples.


## 1. Lexical Conventions

Anvil follows standard lexical rules like SystemVerilog.

### Whitespace

Whitespace separates identifiers, literals, and keywords. It is otherwise ignored, **except inside string literals**, where it forms part of the value.

### Comments

Anvil supports two kinds of comments:

* **Block comments** begin with `/*` and end with `*/`. They may appear inline or span multiple lines.

  ```c
  /* This is a block comment */
  ```
* **Inline comments** start with `//` and continue to the end of the line.

  ```c
  // This is an inline comment
  ```

### Identifiers

Identifiers consist of letters, digits, and underscores, but **must start with either a letter or an underscore**. In the grammar, non-terminals are prefixed with `$`.

```bnf
identifier ::= ( $letter | _ ) { $letter | $digit | _ }
letter     ::= a...z | A...Z
digit      ::= 0...9
```

Examples of valid identifiers:

```text
counter
_data
temp32
```

Invalid identifiers:

```text
3value   // cannot start with a digit
```

---

## 2. Literals

Anvil provides built-in literal forms to represent values commonly used in hardware designs.

### Numeric Literals

A numeric literal consists of:

1. A **bit width** (one or more digits),
2. A **single quote** `'`,
3. A **base specifier** (`b`, `d`, or `h`),
4. A **value** written in that base.

```bnf
numeric-literal        ::= $binary-literal
                         | $decimal-literal
                         | $hexadecimal-literal

binary-literal         ::= { $digit }+ 'b { 0 | 1 }+
decimal-literal        ::= { $digit }+ 'd { $digit }+
hexadecimal-literal    ::= { $digit }+ 'h { $digit | a...f | A...F }+
```

Examples:

```anvil
8'b10101010
16'hFFEE
8'd170
```

### String Literals

String literals are enclosed in double quotes:

```bnf
string-literal ::= " { $string-char } "
```

Example:

```anvil
"Hello, Anvil!"
```

> **Note**: String literals are just for debug printing and cannot be manipulated as first-class values in Anvil.

---

## 3. Values
Anvil supports several kinds of values, including:

### Logic

`logic` is the most atomic value type in Anvil. It represents a single bit and can take the values:

```anvil
1'b0
1'b1
```

### Array

An array is a fixed-length sequence of values of the same type. A logic array of `n` bits is written as:

```text
n'b...
n'd...
n'h...
```

Example:

```anvil
8'b10101010        // binary
8'hAA              // hexadecimal
8'd170             // decimal
```

All three examples represent the same 8-bit value.


Arrays of arbitrary data types are written as:

```anvil
[ v0, v1, ..., v(n-1) ]
```

Example:

```anvil
[ 8'd1, 8'd2, 8'd3 ]
```

This is an array of three 8-bit logic arrays.

### Struct

A `struct` is a composite type that groups multiple named fields, potentially of different data types. A struct value is constructed using the syntax:

```text
struct_type_ident::{ field1 = value1; field2 = value2; ... }
```

Example:

```anvil
address_data_pair::{ data = 8'b10101010; addr = 16'hFFEE }
```

### Enum

An `enum` represents a named constant chosen from a finite set. The syntax to refer to an enum constant is:

```anvil
enum_type_ident::const_ident
```

Example:

```anvil
state::IDLE
state::BUSY
```


## 4. Data Types

Anvil supports both primitive and user-defined data types. Types are constructed using data type expressions.

### Data Type Expressions

```bnf
data-type-expression ::= ()
                       | logic
                       | $identifier
                       | ( $data-type-expression [ {digit}+ ] )
```

Meaning:

- `()` represents the unit type.
- `logic` is the single-bit type.
- `$identifier` refers to a named type.
- `(T[n])` is an array of `n` elements of type `T`.

Examples:

```anvil
logic
address_data_pair
logic[8]
```

### Type Definitions

A named type can be introduced using a type definition:

```bnf
data-type-definition ::= type $identifier [ $params ] = $data-type-expression ;
```

Example:

```anvil
type byte = (logic[8]);
type word = (logic[32]);
```

### Struct Definitions

A named struct type is defined as:

```bnf
struct $identifier [ $params ] {
  $identifier : $data-type-expression
  { , $identifier : $data-type-expression }
}
```

Example:

```anvil
struct address_data_pair {
  data : (logic[8]),
  addr : (logic[16])
}
```

### Enum Definitions

An enum type is defined as:

```bnf
enum $identifier {
  $identifier { , $identifier }
}
```

Example:

```anvil
enum state {
  IDLE,
  BUSY,
  DONE
}
```


## 5. Channels

A channel provides communication and synchronization between a pair of processes. It abstracts the bundled interface wires used in traditional HDLs. A channel has the following features:

1. **Endpoints:** Each channel has **two endpoints**, corresponding to the two ends of the communication. Conceptually, a channel resembles a pipe that transports values between its two endpoints.

2. **Messages** : A channel defines a set of messages that can be sent and received in specified directions. Each message carries a value of a given data type.

3. **Timing Contract:** Each message has a timing contract specifying how long its value remains valid after communication completes. This duration is the message's *lifetime*.

4. **Synchronization:** A message transfer completes only when both endpoints are ready. Sending and receiving therefore occur at the same logical time, making all messages in Anvil synchronous. The completion of the send/receive operation defines the time of synchronization.

Messages use two-way handshake synchronization by default. Each endpoint of a message can also specify a different synchronization mode. These modes let the compiler omit unnecessary handshakes when synchronization is not required or can be determined statically.



### Channel Classes

A channel class serves as a template for creating channels. It specifies:

- the set of messages,
- their directions,
- their data types,
- their timing contracts, and
- their synchronization modes.

Channel classes play a role similar to interface definitions in SystemVerilog. SystemVerilog interfaces specify the data types and directions of communication; Anvil channel classes also define the *timing contract*. A channel class may have type and integer parameters.


```bnf
channel-class-definition ::= "chan" identifier [ params ] "{"
                               message-definition
                               ( "," message-definition )*
                             "}"

message-definition ::= message-direction identifier ":"
                       "(" data-type-expression "@" lifetime-pattern ")"
                       [ "@" sync-mode "-" "@" sync-mode ]

message-direction  ::= "left" | "right"
lifetime-pattern   ::= "#" digit+ | identifier
sync-mode          ::= "dyn"
                      | "#" digit+ [ "~" digit+ ]
                      | "#" identifier [ "+" digit+ ]
```

In `@ sync-mode - @ sync-mode`, the first mode describes the message's left endpoint and the second describes its right endpoint.


For example, consider the following channel class definition for a simple request-response channel:

```anvil
chan simple_ch<T : type, W : int> {
    left  req : (T@ req),
    right res : (logic[W]@#1) @dyn - @#1
}
```

The class has a data type parameter, `T`, and an integer parameter, `W`. It declares two messages:

- `req` is received on the **left** endpoint with value type `T` and lifetime `req`.
- `res` is received on the **right** endpoint with value type `logic[W]` and lifetime `#1`.

The synchronization contract for `res` specifies:

- The left side (sender here) may initiate communication at any time (`dyn`).
- The right side (receiver here) must be ready exactly one cycle later (`@#1`).



For a detailed explanation of lifetime patterns and synchronization modes, see the [tutorial](communication.md).

---

### Channel Creation
Channels are instantiated from channel classes to obtain a pair of endpoints.


```bnf
channel-creation ::= "chan" identifier "--" identifier ":"
                     identifier [ param-vals ] ";"
```

For example:

```anvil
chan ep_le -- ep_ri : simple_ch<logic[8], 1>;
```

This creates a channel of type `simple_ch<logic[8], 1>` and binds its endpoints to
`ep_le` (left) and `ep_ri` (right).

---
### Array of Channels

An array declaration creates multiple instances of a channel type at once. Their endpoints have correspondingly indexed identifiers.

```bnf
channel-array-creation ::= "chan" identifier "--" identifier ":"
                            identifier [ param-vals ]
                            "[" digit+ "]" ";"
```

For example, this declaration creates four independent channels of type `simple_ch<logic[8], 1>`:

```anvil
chan ep_le -- ep_ri : simple_ch<logic[8], 1>[4];
```

Their endpoints are bound as follows:

- The left endpoints of the 4 channels become `ep_le[0]`, `ep_le[1]`, `ep_le[2]`, and `ep_le[3]`.
- The right endpoints become `ep_ri[0]`, `ep_ri[1]`, `ep_ri[2]`, and `ep_ri[3]`.

Each index refers to one concrete channel instance in the array.



## 6. Processes

A process describes a module of the design. A complete design may consist of multiple processes that communicate with each other through channels.


### Process Definition

A process definition has the following syntax:


```bnf
proc-definition ::= "proc" identifier [ params | () ]
                    "(" ( proc-endpoint-list | "()" ) ")"
                    "{"
                      process-item*
                    "}"

proc-endpoint-list ::= proc-endpoint
                       ( "," proc-endpoint )*

proc-endpoint ::= identifier ":" ( "left" | "right" )
                  identifier [ param-vals ]

process-item ::= channel-creation
               | process-spawn
               | reg-creation
               | loop-thread
               | recursive-thread
```

For example, consider the following process definition signature:

```anvil
proc Foo<T : type, W : int>( ep : left simple_ch<T, W> ) {
    // ... Process body ...
}
```

This defines a process named `Foo` with:

- `T`, a type parameter,
- `W`, an integer parameter, and
- one endpoint argument `ep`, which is the **left** endpoint of the channel class `simple_ch<T, W>`.

The process body specifies its behavior through:

- channel creations,
- process spawns,
- register declarations, and
- thread definitions.

Arrays of endpoints can also be passed to processes in the same way.

For example:

```anvil
proc FooArray<T : type, W : int>( ep : right simple_ch<T, W>[4] ) {
    // ... Process body ...
}
```

The process `FooArray` takes an array `ep` of four endpoints of type `right simple_ch<T, W>`. Inside its body, `ep[0]`, `ep[1]`, `ep[2]`, and `ep[3]` access the corresponding endpoints.


### Process Spawning

Inside a process, a new instance of another process can be created using the `spawn` statement with the following syntax:

```bnf
process-spawn ::= "spawn" identifier [ param-vals ]
                  "(" ( identifier ( "," identifier )* | "()" ) ")"
                  ";"
```

For example:

```anvil
proc Bar() {
    chan ep_le -- ep_ri : simple_ch<logic[8], 4>;
    spawn Foo<logic[8], 4>(ep_le);
    // ... rest of process body ...
}
```

The process `Bar` creates a channel of type `simple_ch<logic[8], 4>` with endpoints `ep_le` and `ep_ri`. It then spawns `Foo`, passing the left endpoint `ep_le` as its argument and `logic[8]` and `4` as its parameters.


### Threads

The body of a process is defined in terms of threads. Each process may contain multiple independent threads, which execute concurrently.

Two kinds of threads are supported:

#### Loop Threads

A loop thread describes a component's indefinitely repeating behavior.

```bnf
loop-thread ::= "loop" "{" expression "}"
```

Loop threads can describe components with looping finite state machines. The following skeleton illustrates their use in a memory controller:

```anvil
proc memory_controller(ep : left memory_ch){
    loop{
        // Handle read requests
    }
    loop{
        // Handle write requests
    }
}
```

#### Recursive Threads

Recursive threads describe general recursive behavior within a process. They generalize loop threads, which can be viewed as tail-recursive threads. Recursive threads are particularly useful for describing pipelined behavior.


```bnf
recursive-thread ::= "recursive" "{" expression "}"
```


## 7. Registers

A register provides the means to maintain **persistent state**.

### Register Creation

A register can be defined inside a process.

```bnf
reg-creation ::= reg $identifier : $data-type-expression [$param-vals] ;
```

The statement `reg r : dtype;` defines a new register with identifier `r` and data type `dtype`.


### Register Read

A register can be read using the `*` operator.

```bnf
reg-read-expression ::= *$identifier
```

The expression `*r` evaluates immediately to the current value of the register `r`.
The value remains available until the next write to `r`.

Upon reset, the initial value of a register is all zeros.



### Register Write

A register can be written using the `set` expression.

```bnf
set-expression ::= set $lval := $expression
lval ::= $identifier | $lval.$identifier | $lval [ $expression ] | $lval [ $expression+:{$digit}+ ]
```

The `set` expression evaluates to `()` **delayed by one cycle**. All expressions involved
must have been evaluated and must have valid results. The new value of the register becomes visible in the **next cycle**.

For example, `set r := e` writes the evaluated result of `e` to the register `r` after one cycle.

---



## 8. Expressions

Anvil describes hardware behavior through the expression forms below.


### Debug Statements

During simulation, `dprint` prints messages to the console, much like `$display` in SystemVerilog. The expression `dfinish` terminates the simulation. Both expressions are for simulation only.

```bnf
debug-print ::= "dprint" string-literal "(" expression ")" 
debug-finish ::= "dfinish"
```


### Cycle

The `cycle` expression introduces a delay in the evaluation of expressions.

```
cycle-expression ::= cycle { $digit }+
```

The `cycle` expression evaluates to the unit value `()` after the specified number of cycles. For example, `cycle 3` evaluates to `()` after three cycles. Introducing this delay is the expression's sole purpose.


### Wait

The `wait` expression controls time by sequencing expressions.

```
wait-expression ::= $expression >> $expression
```

In `e1 >> e2`, evaluation of `e2` starts only after `e1` has completed. The combined expression returns the result of `e2` when both expressions have completed.

For example, consider the following program:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.capstone.kisp-lab.org
    
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


### Join

```
join-expression ::= $expression ; $expression
```

The expression `e1; e2` starts evaluating `e1` and `e2` immediately, at the same time. It returns the result of `e2` when both evaluations complete.

For example, consider the modified version of the previous program:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.capstone.kisp-lab.org
    
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

### Let

```
let-expression ::= let $identifier = $expression ; $expression
let-wait-expression ::= let $identifier = $expression >> $expression
```

The expression `let x = e1; e2` binds `e1` to the identifier `x`, which can be referenced in `e2`. It starts evaluating `e1` and `e2` at the same time. Once both complete, it returns the result of `e2`.

The form `let x = e1 >> e2` waits for `e1` to complete before starting `e2`. The two forms therefore follow the same distinction as join and wait.

For example:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.capstone.kisp-lab.org

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

### If-Else

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


### Match

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

### Arithmetic Expressions

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

### Concatenation

```
concat-expression ::= #{ $expression {, $expression} }
```

The expression `#{e1, e2, ..., en}` concatenates the results of `e1` through `en` into an array. It completes when all of these expressions have completed. In the result, `e1` occupies the high bits and `en` occupies the low bits. For example, `#{2'b01, 5'b01101, 1'b1}` produces `8'b01011011`.

### Send

```
send-expression ::= send $identifier.$identifier ($expression)
```

The expression `send ep.m (e)` waits to send the result of `e` as message `m` on endpoint `ep`. Once the send occurs, the expression completes with result `()`.

### Receive 

```
recv-expression ::= recv $identifier.$identifier
```

When the evaluation of the expression `recv ep.m (e)` starts, the process starts waiting
to receive the message `ep.m`, where `ep` is an endpoint identifier
and `m` is a message identifier.
Once the receive occurs,
the evaluation completes with the received value as the result.


For example, consider the following program:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.capstone.kisp-lab.org

    chan foobar_ch<T : type> {
        left  req : (T@ req),
        right res : (logic@#1)
    }
    proc Foo<T : type>( ep : right foobar_ch<T> ) {
        reg counter : logic[8];
        loop{
            send ep.req ( 8'd42 ) >>
            let res = recv ep.res >>
            dprint"[Cycle %d][Foo] Received response: %d" (*counter,res) >>
            cycle 1
        }
        loop{
            set counter := *counter + 8'd1
        }
    }
    proc Bar<T : type>(ep : left foobar_ch<T>){
        reg counter : logic[8];
        loop{
            let req = recv ep.req >>
            dprint"[Cycle %d][Bar] Received request: %d" (*counter,req) >>
            cycle 3 >>
            send ep.res (1'd1) >>
            cycle 1
        }
        loop{
            set counter := *counter + 8'd1
        }
    }
    proc Top() {
        chan ep_le -- ep_ri : foobar_ch<logic[8]>;
        spawn Foo<logic[8]>(ep_ri);
        spawn Bar<logic[8]>(ep_le);
        loop{
            cycle 10 >>
            dfinish
        }
    }
```
### Try Send/Receive

When synchronization is not guaranteed, `try send` and `try recv` let a process attempt communication without blocking.

```bnf
try-send-expression ::= "try" "send" $identifier.$identifier($expression) { $expression } else $expression
try-recv-expression ::= "try" $identifier = "recv" $identifier.$identifier { $expression } else $expression
```

If communication can proceed immediately, a `try` expression executes its continuation branch with the communication result. Otherwise, it executes the `else` branch.


```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.capstone.kisp-lab.org

    chan foobar_ch<T : type> {
        left  req : (T@ req),
        right res : (logic@#1)
    }

    proc Foo<T : type>( ep : right foobar_ch<T> ) {
        reg counter : logic[8];
        loop{
            cycle 4 >>
            send ep.req ( 8'd42 ) >>
            let res = recv ep.res >>
            dprint"[Cycle %d][Foo] Received response: %d" (*counter,res) >>
            cycle 1
        }
        loop{
            set counter := *counter + 8'd1
        }
    }


    proc Bar<T : type>(ep : left foobar_ch<T>){
        reg counter : logic[8];
        loop{
            try req = recv ep.req {
                dprint"[Cycle %d][Bar] Received request: %d" (*counter,req) >>
                cycle 3 >>
                send ep.res (1'd1)
            }else {
                dprint"[Cycle %d][Bar] No request received, proceeding." (*counter)
            } >>
            cycle 1
        }
        loop{
            set counter := *counter + 8'd1
        }
    }

    proc Top() {
        chan ep_le -- ep_ri : foobar_ch<logic[8]>;
        spawn Foo<logic[8]>(ep_ri);
        spawn Bar<logic[8]>(ep_le);
        loop{
            cycle 10 >>
            dfinish
        }
    }

```

In the above program, the `Bar` process uses a `try recv` expression to attempt to receive a request from the `Foo` process. If a request is available, it processes the request and sends a response. If no request is available, it prints a message indicating that no request was received and proceeds without blocking.


### Functions

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
    :playground-url: https://anvil.capstone.kisp-lab.org

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
 
### Cast

Simulators and compilers for traditional HDLs often silently ignore data-width mismatches. These mismatches can lead to unintended behavior. Anvil prevents such issues through strict data-type checking. It also provides an option to restrict casts between abstract data types; this restriction is disabled by default.

When a conversion is necessary, it can be written explicitly with a cast expression:

```
cast-expression ::= "<" ( $expression ) "::" $data-type-expression ">"
```

For example:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.capstone.kisp-lab.org

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




### Generate 


Repetitive code can be generated programmatically with two constructs: `generate` and `generate_seq`.

```
generate-expression ::= "generate" ( $identifier : $start, $end, $step ) { $expression }
generate-seq-expression ::= "generate_seq" ( $identifier : $start, $end, $step ) { $expression }
```

Both constructs unroll the body for each value of the loop variable, from `start` to `end` inclusive, using the specified `step`. The `generate` construct combines these bodies in parallel, like a join expression. The `generate_seq` construct combines them in sequence, like a wait expression.


For example:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.capstone.kisp-lab.org

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


### Ready/Probe

Sometimes it is helpful to check whether a communication event -- i.e., the exchange of a message on a channel endpoint -- was successful in order to make control-flow decisions. For this purpose, Anvil provides two expressions: `ready` and `probe`.

```bnf
ready-expression ::= "ready" $identifier.$identifier
probe-expression ::= "probe" $identifier.$identifier
```

The expression `ready ep.m` checks whether the current process has a message `m` ready to be received on endpoint `ep`. If a message is available, the expression immediately evaluates to `1'b1`; otherwise, it immediately evaluates to `1'b0`.

In contrast, the expression `probe ep.m` checks whether the process sending a message `m` on endpoint `ep` has a receiver that is ready to accept the message. If a receiver is ready, the expression immediately evaluates to `1'b1`; otherwise, it evaluates to `1'b0`.

These expressions are provided for convenience. Semantically, they can be implemented using nested `try recv` and `try send` expressions. However, to avoid rewriting this pattern multiple times, Anvil exposes `ready` and `probe` as first-class expressions.

**Example:** Consider the following program:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.capstone.kisp-lab.org

    chan foobar_ch {
        left  req : (logic@#1),
        right res : (logic@#1)
    }

    proc Foo( ep : left foobar_ch ) {
        reg counter : logic[8];
        reg all : logic;

        loop{
            try x = recv ep.req {
                dprint"[Cycle %d][Foo] Received request: %d" (*counter,x)
            } else {
                dprint"[Cycle %d][Foo] No request received, skipping recv." (*counter)
            }  >>

            try send ep.res (1'd1) {
                // check if we did get all messages this cycle
                if ready ep.req {
                    dprint"[Cycle %d][Foo] All messages exchanged this cycle." (*counter) >>
                    set all := 1'b1
                } else {
                    dprint"[Cycle %d][Foo] Sent Response." (*counter) >>
                    set all := 1'b0
                }
            } else {
                dprint"[Cycle %d][Foo] No receiver ready, skipping send." (*counter) >>
                cycle 1
            } 
        }

        loop{
            set counter := *counter + 8'd1
        }
    }

    proc Top() {
        chan ep_le -- ep_ri : foobar_ch;
        spawn Foo(ep_le);

        loop{
            send ep_ri.req (1'd1) >>
            cycle 1 >>
            send ep_ri.req (1'd1) >>
            cycle 1 >>
            send ep_ri.req (1'd1) >>
            let x = recv ep_ri.res >>
            cycle 1
        }

        loop{
            cycle 10 >>
            dfinish
        }
    } 
```

In this program, the `Foo` process receives requests from the `Top` process and sends responses back. To avoid blocking, it uses `try recv` and `try send` expressions. After sending a response, it uses the `ready` expression to check whether a request was also received in the same cycle, i.e., whether all messages were exchanged during that cycle.

If `ready ep.req` evaluates to `1'b1`, the program prints that all messages were exchanged and sets the `all` register accordingly. Otherwise, it prints that only a response was sent and updates `all` to reflect that not all communication completed in that cycle.

This pattern is particularly useful for making control-flow decisions based on communication status, such as managing FIFO buffer full/empty states.


> **Note:** The `ready` and `probe` expressions only check the readiness of a communication event at the moment they are evaluated. They do not block or wait for the communication to become ready.
