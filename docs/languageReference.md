# Tour of Anvil Syntax and Features


We now present a detailed tour of all language constructs in Anvil. We illustrate each construct with small code examples and explain their semantics.


## 1. Lexical Conventions

Anvil follows standard lexical rules like SystemVerilog.

### Whitespace

Whitespace separates identifiers, literals, and keywords but is otherwise ignored, **except inside string literals**, where it is treated as part of the value.

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

```rs
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

```rs
"Hello, Anvil!"
```

> **Note**: String literals are just for debug printing and cannot be manipulated as first-class values in Anvil.

---

## 3. Values
Anvil supports several kinds of values, including:

### Logic

`logic` is the most atomic value type in Anvil. It represents a single bit and can take the values:

```rs
1'b0
1'b1
```

### Array

An array is a fixed-length sequence of values of the same type. A logic array is written as:

```text
n'b...
n'd...
n'h...
```

where `n` is the number of bits.

Example:

```rs
8'b10101010        // binary
8'hAA              // hexadecimal
8'd170             // decimal
```

All three examples represent the same 8-bit value.


Arrays of arbitrary data types are written as:

```rs
[ v0, v1, ..., v(n-1) ]
```

Example:

```rs
[ 8'd1, 8'd2, 8'd3 ]
```

This is an array of three 8-bit logic arrays.

### Struct

A `struct` is a composite type that groups multiple named fields, potentially of different data types. A struct value is constructed using the syntax:

```text
struct_type_ident::{ field1 = value1; field2 = value2; ... }
```

Example:

```rs
address_data_pair::{ data = 8'b10101010; addr = 16'hFFEE }
```

### Enum

An `enum` represents a named constant chosen from a finite set. The syntax to refer to an enum constant is:

```rs
enum_type_ident::const_ident
```

Example:

```rs
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

```rs
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

```rs
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

```rs
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

```rs
enum state {
  IDLE,
  BUSY,
  DONE
}
```


## 5. Channels

A channel is the fundamental abstraction for communication and synchronization between a pair of processes. Channels are abstractions of bundled interface wires in traditional HDLs. Some key abstractions related to channels are:

1. **Endpoints:** Each channel has **two endpoints**, corresponding to the two ends of the communication. Conceptually, a channel resembles a pipe that transports values between its two endpoints.

2. **Messages** : A channel defines a set of messages that can be sent and received in specified directions. Each message carries a value of a given data type.

3. **Timing Contract:** Each message is associated with a timing contract, which specifies how long the exchanged value remains valid after the communication completes. This duration is referred to as the message’s *lifetime*.

4. **Synchronization:** All messages in Anvil are synchronous: a message transfer completes only when both endpoints are ready. Consequently, sending and receiving occur at the same logical time. The time of synchronization is defined as the time at which the send/receive operation completes.

By default, all messages use two-way handshake synchronization. However, Anvil allows users to specify different synchronization modes for each endpoint of a message. This enables the compiler to avoid generating unnecessary handshakes when synchronization is not required or can be determined statically.



### Channel Classes

A channel class serves as a template for creating channels. It specifies:

- the set of messages,
- their directions,
- their data types,
- their timing contracts, and
- their synchronization modes.

Channel classes play a role analogous to interface definitions in languages such as SystemVerilog. However, while SystemVerilog interfaces specify only the data types and directions of communication, Anvil channel classes additionally define the _timing-contract_. Channel classes may also be parameterized by type and integer parameters.


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

Here `@ sync-mode - @ sync-mode` specifies the synchronization modes for the left and right endpoints for that particular message respectively.


For example, consider the following channel class definition for a simple request-response channel:

```rs
chan simple_ch<T : type, W : int> {
    left  req : (T@ req),
    right res : (logic[W]@#1) @dyn - @#1
}
```

This channel class declares:

- Parameters:

  - `T` : a data type parameter,
  - `W` :  an integer parameter.

- Messages:

  - `req`: received on the **left** endpoint with value type `T` and lifetime `req`.
  - `res`: received on the **right** endpoint with value type `logic[W]` and lifetime `#1`.

The synchronization contract for `res` specifies:

- The left side (sender here) may initiate communication at any time (`dyn`).
- The right side (receiver here) must be ready exactly one cycle later (`@#1`).



For a detailed explanation of lifetime patterns and synchronization modes, see the [tutorial](https://github.com/jasonyu1996/anvil/tree/master/docs/tutorial/L2-Communication)

---

### Channel Creation
Channels are instantiated from channel classes to obtain a pair of endpoints.


```bnf
channel-creation ::= "chan" identifier "--" identifier ":"
                     identifier [ param-vals ] ";"
```

For example:

```rs
chan ep_le -- ep_ri : simple_ch<logic[8], 1>;
```

This creates a channel of type `simple_ch<logic[8], 1>` and binds its endpoints to
`ep_le` (left) and `ep_ri` (right).

---

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

```rs
proc Foo<T : type, W : int>( ep : left simple_ch<T, W> ) {
    // ... Process body ...
}
```

This defines a process named `Foo` with:
  - `T`, a data type parameter and `W`, an integer parameter;
  - one endpoint argument `ep`, which is the left endpoint of the channel class `simple_ch<T, W>`.

The process body contains:

- channel creations,
- process spawns,
- register declarations, and
- thread definitions
  
that together specify the behavior of the process.


### Process Spawning

Inside a process, a new instance of another process can be created using the `spawn` statement with the following syntax:

```bnf
process-spawn ::= "spawn" identifier [ param-vals ]
                  "(" ( identifier ( "," identifier )* | "()" ) ")"
                  ";"
```

For example:

```rs
proc Bar() {
    chan ep_le -- ep_ri : simple_ch<logic[8], 4>;
    spawn Foo<logic[8], 4>(ep_le);
    // ... rest of process body ...
}
```

This code:

1. Defines a process named `Bar`.
2. Creates a channel of type `simple_ch<logic[8], 4>`, binding its endpoints to `ep_le` and `ep_ri`.
3. Spawns an instance of the process `Foo`, passing:
   - the left endpoint `ep_le` as the argument, and
   - the type parameters `logic[8]` and `4` to the spawned process.


### Threads

The body of a process is defined in terms of threads. Each process may contain multiple independent threads, which execute concurrently.

Two kinds of threads are supported:

#### Loop Threads

Loop threads are used to defined infinite replicating behaviour of the components.

```bnf
loop-thread ::= "loop" "{" expression "}"
```

For example they can be used to define components with looping finite state machines, such as memory controllers (skeleton shown below):

```rs
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

Recursive threads define general recursive behavior in a process. They generalize loop threads (`loop` can be thought of as tail recursive threads) and are particularly useful for describing pipelined behaviours.


```bnf
recursive-thread ::= "recursive" "{" expression "}"
```

Here is your section **lightly polished for clarity, flow, and coherence**, without changing the structure or adding new concepts. I kept your format and intent intact.

---

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

Anvil provides a variety of expressions to describe hardware behaviour. Below is a comprehensive overview of the expression forms supported in Anvil.


### Debug Statements

For simulation only, Anvil provides a debug print (akin to `$display` in SystemVerilog) to print messages to the console, and `dfinish` to terminate the simulation.

```bnf
debug-print ::= "dprint" string-literal "(" expression ")" 
debug-finish ::= "dfinish"
```


### Cycle

The `cycle` expression introduces a delay in the evaluation of expressions.

```
cycle-expression ::= cycle { $digit }+
```

The `cycle` expression evaluates to the unit value `()` delayed by a specified number
of cycles. Its sole purpose is to introduce this delay. For example, `cycle 3` evaluates to `()` after three cycles.


### Wait

The `wait` expression is the main means of controlling time. It is used to define sequencing between expressions.

```
wait-expression ::= $expression >> $expression
```

The expression `e1 >> e2` waits for the evaluation of `e1` to complete (if it has not already
completed) before starting the evaluation of `e2`. The entire expression evaluates to the
result of `e2` when both `e1` and `e2` have completed.

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
            set counter := *counter + 1
        }
        loop{
            cycle 10 >>
            dfinish
        }
    }
```

For the above program, in each iteration of the first thread,
the message `"[Cycle X] Starting computation..."` is printed, where `X` is the current value of the cycle counter stored in the register `counter`. The program then waits for 2 cycles, prints
`"[Cycle X] Computation done after 2 cycles."`. After 1 cycle the program reaches the end of the loop iteration and starts the next iteration. The second thread increments the `counter` register every cycle. The third thread waits for 10 cycles and then terminates the simulation.


### Join

```
join-expression ::= $expression ; $expression
```

The expression `e1; e2` starts the evaluations of `e1` and `e2` immediately and
at the same time. It evaluates to the evaluation result of `e2` when both evaluations
complete.

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
            set counter := *counter + 1
        }
        loop{
            cycle 10 >>
            dfinish
        }
    }
```

In this program, in each iteration of the first thread,
the message `"[Cycle X] Starting computation..."` is printed, where `X` is the current value of the cycle counter stored in the register `counter`. The program then starts the evaluations of `cycle 3` and `cycle 2` at the same time. The join expression completes when both cycles complete, which is after 3 cycles. Then the message `"[Cycle X] Computation done after Later of (2,3) cycles."` is printed. After 1 cycle the program reaches the end of the loop iteration and starts the next iteration.


> *Note* The `>>` and `;` operators are right-associative and have the same precedence. For example, `e1; e2 >> e3; e4 >> e5` is equivalent to `(e1; (e2 >> (e3; (e4 >> e5))))`.

### Let

```
let-expression ::= let $identifier = $expression ; $expression
let-wait-expression ::= let $identifier = $expression >> $expression
```

The let expression `let x = e1; e2` binds `e1` to an identifier `x`, which can be
referenced in `e2`. The entire expression evaluates to the evaluation result of `e2` when
both `e1` and `e2` have completed.

The difference between `let x = e1; e2` and `let x = e1 >> e2`
is that the former starts evaluating `e1` and `e2` at the same time, whereas the latter
waits for `e1` to complete before starting to evaluate `e2`, similar to the relationship
between the join and wait expressions.

For example:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.capstone.kisp-lab.org

    proc Top() {
        reg counter : logic[8];
        loop {
            let cnt = *counter + 1 ;
            dprint"[Cycle %d] Hello World in Anvil!" (cnt) >>
            set counter := *counter + 1
        }
        loop{
            cycle 10 >>
            dfinish
        }
    }
```

In this program, in each iteration of the loop, the expression `*counter + 1` is evaluated and bound to the identifier `cnt`. The debug print then prints the value of `cnt`.

### If-Else

```
if-else-expression ::= if $expression { $expression } [ else ( { $expression } | $if-else-expression ) ]
```

The expression `if e1 { e2 } else { e3 }` evaluates to the evaluation result of
`e2` or `e3` depending on the evaluation result of `e1`. The evaluation of `e1` must already
be complete and the result must still be valid.

If `e1` evaluates to an all-zero value, the expression starts evaluating `e3`. Otherwise,
it starts evaluating `e2`. The `else` clause is optional, with `if e1 { e2 }` being equivalent to
`if e1 { e2 } else { () }`. Multiple conditionals can be chained, for example:
`if e1 { e2 } else if e3 { e4 } else { ... }`.

For example:

```{eval-rst}
.. anvil-playground::
    :playground-url: https://anvil.capstone.kisp-lab.org

    proc Top() {
        reg counter : logic[8];
        loop {
            if (*counter & 8'd1 == 0) {
                dprint"[Cycle %d] Even cycle" (*counter) >>
                cycle 3
            } else {
                dprint"[Cycle %d] Odd cycle" (*counter) >>
                cycle 1
            } >>
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

This program prints whether the current cycle (value of `counter`) is even or odd in each iteration of the loop. Note that the even cycles introduce a delay of 3 cycles, while the odd cycles introduce a delay of 1 cycle. Therefore in Anvil branches can take different times to complete and the language semantics and the type system are designed to handle this naturally.


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
            set counter := *counter + 1
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

These expressions evaluate according to their operators. The evaluation completes
when the one (unary) or both (binary) sub-expressions complete their evaluations.

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
            set counter := *counter + 1;
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

The expression `#{e1, e2, ..., en}` concatenates the evaluation results of `e1`, `e2`, ...,
`en` into an array where and completes evaluation when all evaluations of `e1`, `e2`, ..., `en` have completed.
Note `en` will be placed at the low bits in the result while `e1` will be placed at the high bits.
For example `#{2'b01, 5'b01101, 1'b1}` produces value `8'b01011011`.

### Send

```
send-expression ::= send $identifier.$identifier ($expression)
```

When the evaluation of the expression `send ep.m (e)` starts, the process starts waiting
to send the evaluated result of `e` with message `ep.m`, where `ep` is an endpoint identifier
and `m` is a message identifier. The evaluation completes with result `()`
once the send occurs.

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
            set counter := *counter + 1
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
            set counter := *counter + 1
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

For the purpose of avoiding blocking on communication when synchronization is not guaranteed, Anvil provides convenience features such as `try send` and `try recv` expressions.

```bnf
try-send-expression ::= "try" "send" $identifier.$identifier($expression) { $expression } else $expression
try-recv-expression ::= "try" $identifier = "recv" $identifier.$identifier { $expression } else $expression
```

For `try` expressions, if the communication can proceed immediately, then the continuation branch is executed with the result of the communication. Otherwise, the `else` branch is executed.


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
            set counter := *counter + 1
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
            set counter := *counter + 1
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

Functions provide a means of code reuse. Although we call them functions, in the current version, they are more akin to macros at the expression AST level.

```
function-definition ::= func $identifier ( [$identifier {, $identifier}] ) { $expression }
```

Calling a function simply substitutes the call in place with the function body,
with the extra bindings specified in the parameters:

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
            set counter := *counter + 1
        }
        loop{
            cycle 10 >>
            dfinish
        }
    }
```

In this program, we define a function named `max` that takes two parameters, `a` and `b`, and returns the maximum of the two. Inside the `Top` process, we call this function with the current value of the `counter` register and the constant `8'd5`. The result is bound to the identifier `sum`, which is then printed in the debug statement.  

> **Note:** In current version, functions have all the bindings in the context of the call site in scope, including registers inside processes.
 

### Generate 


Sometimes for repetitive code patterns, it is useful to generate code programmatically. Anvil provides two generate constructs: `generate` and `generate_seq`.

```
generate-expression ::= "generate" ( $identifier : $start, $end, $step ) { $expression }
generate-seq-expression ::= "generate_seq" ( $identifier : $start, $end, $step ) { $expression }
```

The `generate` expression unrolls the body expression for each value of the loop variable from `start` to `end` (inclusive) with the specified `step` in parallel i.e akin to generating a join expression of all the unrolled bodies. On the other hand, the `generate_seq` expression unrolls the body expression for each value of the loop variable from `start` to `end` (inclusive) with the specified `step` in sequence i.e akin to generating a wait expression of all the unrolled bodies.


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
                set mem[i] := i >>
                dprint"[Cycle %d][Bar] mem[%d] = %d" (*counter, i, *mem[i])

            } >>
            dprint"[Cycle %d][Bar] Memory initialized." (*counter) >>
            dfinish >>
            cycle 1
        }
        loop{
          set counter := *counter + 1
        }

    }
    proc Top() {
        reg mem : byte[4];
        reg counter : logic[8];
        spawn Bar();
        loop{
            generate (i : 0, 3, 1) {
                set mem[i] := i
            } >>
            dprint"[Cycle %d][Top] Memory initialized. (%d , %d, %d, %d)" (*counter, *mem[0], *mem[1], *mem[2], *mem[3]) >>
            cycle 1
        }
        loop{
          set counter := *counter + 1
        }
        
    }

```

In this program, the `Top` process uses the `generate` construct to initialize an array `mem` in parallel, while the `Bar` process uses the `generate_seq` construct to initialize its own array `mem` in sequence. Each iteration of the loop variable `i` sets the corresponding element of the array and prints its value. The `Top` process completes the initialization in one cycle, while the `Bar` process takes multiple cycles to complete its sequential initialization.