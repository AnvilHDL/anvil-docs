# Processes

A process describes a module of the design. A complete design may consist of multiple processes that communicate with each other through channels.


## Process Definition

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


## Process Spawning

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


## Threads

The body of a process is defined in terms of threads. Each process may contain multiple independent threads, which execute concurrently.

Two kinds of threads are supported:

### Loop Threads

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

### Recursive Threads

Recursive threads describe general recursive behavior within a process. They generalize loop threads, which can be viewed as tail-recursive threads. Recursive threads are particularly useful for describing pipelined behavior.


```bnf
recursive-thread ::= "recursive" "{" expression "}"
```
