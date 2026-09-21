# Communication Expressions

## Send

```
send-expression ::= send $identifier.$identifier ($expression)
```

The expression `send ep.m (e)` waits to send the result of `e` as message `m` on endpoint `ep`. Once the send occurs, the expression completes with result `()`.

## Receive

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

## Try Send/Receive

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

## Ready/Probe

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
