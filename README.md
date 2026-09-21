# AnvilHDL Documentation

The documentation sources are organized into:

- [`docs/tutorial/`](docs/tutorial/index.md): installation and tutorial chapters.
- [`docs/langref/`](docs/langref/index.md): language reference topics, with grouped expression pages in `expressions/`.
- [`docs/index.rst`](docs/index.rst): the documentation home page and navigation.
- [`docs/artefacts.md`](docs/artefacts.md): project repositories, research artefacts, and contributors.


Create a local Python environment and install the documentation dependencies once:

```bash
python3 -m venv --without-pip .venv
python3 -m pip --python .venv/bin/python install -r docs/requirements.txt
```

Then build the documentation. The build script uses `.venv` automatically:

```bash
bash build-docs.sh
```


The documentation will be generated in the `docs/_build/html` directory.


To test the documentation locally, run the following command. It builds the documentation and then starts a local server:

```bash
bash run-server.sh
```

> *Note:* After each change to the documentation, rebuild it using `build-docs.sh` or `run-server.sh`.
