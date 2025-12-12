.. AnvilHDL Documentation master file

Welcome to AnvilHDL Documentation!
====================================

`Anvil <https://github.com/jasonyu1996/anvil>`_ is a general-purpose hardware description language (HDL) that statically guarantees **timing safety** -- the absence of timing hazards, at compile time using a novel type system.

In traditional HDLs, signals may unintentionally change when their underlying registers are updated, making it difficult to guarantee the stability of intermediate values across multiple clock cycles. 
Anvil eliminates this class of errors by making the timing relationships between the creation and use of values explicit, and by enforcing that values are used only when they are semantically valid.
At the same time, Anvil gives designers full control over state-storing elements (registers) and cycle-level latency.
Anvil compiles to synthesizable SystemVerilog and has demonstrated comparable **area, power, and frequency** to handwritten SystemVerilog designs in practice, while incurring **no additional clock-cycle latency**.


You can try Anvil without installation at `AnvilHDL Playground <https://anvil.capstone.kisp-lab.org/>`_,
or install it locally by following the :doc:`installation` guide.

Citation
--------
Anvil has been accepted to apear at `ASPLOS 2026 <https://asplos-conference.org/asplos2026/>`_. If you use Anvil in your research, please use the following citation:

.. code-block:: bibtex

   @inproceedings{yu2026anvil,
      title={Anvil: A General-Purpose Timing-Safe Hardware Description Language},
      author={Yu, Jason Zhijingcheng and Jha, Aditya Ranjan and Mathur, Umang and Carlson, Trevor E and Saxena, Prateek},
      year={2026},
      publisher={Association for Computing Machinery},
      booktitle={Proceedings of the 31st ACM International Conference on Architectural Support for Programming Languages and Operating Systems},
      series={ASPLOS '26},
      address={Pittsburgh, PA, USA},
      url={https://arxiv.org/abs/2503.19447},
      note={To appear. Preprint available at arXiv:2503.19447}
   }

Documentation Overview
----------------------

This documentation is organized as follows:

* **Language Reference** - An up-to-date description of Anvil's syntax and language features.
* **Getting Started** - A guided tutorial to help you get started with Anvil, including interactive examples and practice problems.


.. toctree::
   :maxdepth: 2
   :caption: Language Reference

   installation
   languageReference

.. toctree::
   :maxdepth: 2
   :caption: Getting Started

   background
   helloWorld
   communication
   examples

Quick Links
-----------

* `Research Paper Preprint <https://arxiv.org/abs/2503.19447>`_
* `AnvilHDL Playground <https://anvil.kisp-lab.org/>`_
* `Anvil Compiler <https://github.com/kisp-nus/anvil>`_
* `Community Chat <https://anvilhdl.zulipchat.com/>`_


Contact Us
----------

* `Jason Zhijingcheng Yu <https://www.comp.nus.edu.sg/~yuz1996/>`_
* `Aditya Ranjan Jha <https://arj4web.github.io/contact/>`_
* `Umang Mathur <https://www.comp.nus.edu.sg/~umathur/>`_
* `Trevor E. Carlson <https://www.comp.nus.edu.sg/~tcarlson/>`_
* `Prateek Saxena <https://www.comp.nus.edu.sg/~prateeks/>`_


**Acknowledgement**: We want to thank |zulip-logo| for sponsoring the community chat channel and allowing us to encourage discussions. Zulip is an organized team chat app designed for efficient communication.

.. |zulip-logo| image:: https://raw.githubusercontent.com/zulip/zulip/main/static/images/logo/zulip-org-logo.svg
   :height: 20px
   :alt: Zulip
   :target: https://zulip.com