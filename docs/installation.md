# Installation Guide

This document describes how to set up and use the [Anvil](https://github.com/jasonyu1996/anvil) compiler.

## 1. Setup Instructions

1. Install the prerequisite (`opam`)
   Install the OCaml package manager opam by following the official instructions:
   [https://opam.ocaml.org/doc/Install.html](https://opam.ocaml.org/doc/Install.html)

2. Clone the repository

   ```bash
   git clone https://github.com/jasonyu1996/anvil.git
   ```

3. Navigate to the project directory

   ```bash
   cd anvil
   ```

4. Install project dependencies only

   ```bash
   opam install . --deps-only
   ```

At this point, all required dependencies are available. You can now proceed in one of two ways, depending on whether you want a local development build or a global installation.


**Option 1: Local Build (for Development)**

This option builds and runs the compiler without installing it globally.

5. Build the project

   ```bash
   eval $(opam env)
   dune build
   ```

6. Run the compiler locally

   ```bash
   dune exec anvil -- <args>
   ```

This method is recommended for development and testing, as it avoids reinstalling the package after every change.

**Option 2: Global Installation (as an opam Package)**

This option installs Anvil into the current `opam` switch and makes the `anvil` binary available system-wide (within the switch).

5. **Install the package**

   ```bash
   opam install .
   ```

This command pins the package to the current directory, builds it, and installs the `anvil` binary globally.



## 2. Compiler Usage

After installation, the compiler can be invoked as follows:

- For local builds:

  ```bash
  dune exec anvil -- [options] <file1> [<file2>] ...
  ```
- For global installations:

  ```bash
  anvil [options] <file1> [<file2>] ...
  ```

The input files must use the `.anvil` extension.


Following are the available command-line options:

```bash
-verbose            Enable verbose output for debugging
-disable-lt-checks  Disable lifetime and borrow checks
-O <level>          Set optimisation level: 0, 1, or 2 (default: 0)
--help              Display this help message
```


**Example Usage**

```bash
dune exec anvil -- example.anvil -verbose -O 2
```

This command compiles `example.anvil` with:
- verbose debug output enabled, and
- optimisation level set to 2.
