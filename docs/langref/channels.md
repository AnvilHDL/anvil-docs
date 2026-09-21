# Channels

A channel provides communication and synchronization between a pair of processes. It abstracts the bundled interface wires used in traditional HDLs. A channel has the following features:

1. **Endpoints:** Each channel has **two endpoints**, corresponding to the two ends of the communication. Conceptually, a channel resembles a pipe that transports values between its two endpoints.

2. **Messages** : A channel defines a set of messages that can be sent and received in specified directions. Each message carries a value of a given data type.

3. **Timing Contract:** Each message has a timing contract specifying how long its value remains valid after communication completes. This duration is the message's *lifetime*.

4. **Synchronization:** A message transfer completes only when both endpoints are ready. Sending and receiving therefore occur at the same logical time, making all messages in Anvil synchronous. The completion of the send/receive operation defines the time of synchronization.

Messages use two-way handshake synchronization by default. Each endpoint of a message can also specify a different synchronization mode. These modes let the compiler omit unnecessary handshakes when synchronization is not required or can be determined statically.



## Channel Classes

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



For a detailed explanation of lifetime patterns and synchronization modes, see the [tutorial](../tutorial/communication.md).

---

## Channel Creation
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
## Array of Channels

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
