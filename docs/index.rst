.. AnvilHDL Documentation master file

.. image:: https://github.com/AnvilHDL/anvil/blob/master/docs/logo/anvil-horizontal.png?raw=true
   :alt: AnvilHDL logo
   :class: title-logo
   :target: https://anvil.kisp-lab.org/

.. raw:: html

   <br>

Welcome to AnvilHDL Documentation!
====================================

`Anvil <https://github.com/AnvilHDL/anvil>`_ is a general-purpose hardware description language (HDL) that guarantees **timing safety**, the absence of timing hazards. Its novel type system enforces this guarantee at compile time.

In traditional HDLs, signals may unintentionally change when their underlying registers are updated. These changes make it difficult to guarantee that intermediate values remain stable across multiple clock cycles.
Anvil eliminates this class of errors by making the timing relationships between the creation and use of values explicit. It enforces that values are used only when they are semantically valid.
At the same time, Anvil gives designers full control over state-storing elements (registers) and cycle-level latency.
Anvil compiles to synthesizable SystemVerilog. In practice, it has demonstrated comparable **area, power, and frequency** to handwritten SystemVerilog designs, with **no additional clock-cycle latency**.


You can try Anvil without installation at `AnvilHDL Playground <https://anvil.kisp-lab.org/>`_,
or install it locally by following the :doc:`tutorial/installation` guide.

:doc:`artefacts`: AnvilHDL repositories, tools, research artefacts, and contributors.

.. _anvil-citation:

Citation
--------
If you use Anvil in your research, please cite the |anvil-paper-icon| `Anvil paper <https://dl.acm.org/doi/10.1145/3779212.3790125>`_:

.. |anvil-paper-icon| image:: assets/anvil.png
   :alt: Anvil logo
   :width: 24px
   :align: middle
   :target: https://dl.acm.org/doi/10.1145/3779212.3790125

.. code-block:: bibtex

   @inproceedings{yu2026anvil,
      title={Anvil: A General-Purpose Timing-Safe Hardware Description Language},
      author={Yu, Jason Zhijingcheng and Jha, Aditya Ranjan and Mathur, Umang and Carlson, Trevor E and Saxena, Prateek},
      year={2026},
      publisher={Association for Computing Machinery},
      booktitle={Proceedings of the 31st ACM International Conference on Architectural Support for Programming Languages and Operating Systems},
      series={ASPLOS '26},
      address={Pittsburgh, PA, USA},
      doi={10.1145/3779212.3790125},
      url={https://dl.acm.org/doi/10.1145/3779212.3790125}
   }

Documentation Overview
----------------------

This documentation is organized as follows:

* **Language Reference** - An up-to-date description of Anvil's syntax and language features.
* **Tutorial** - Installation and a guided introduction to Anvil, including interactive examples and practice problems.
* **Artefacts and Contributors** - Project repositories, research resources, and contributor profiles.

.. toctree::
   :maxdepth: 1
   :caption: Project

   artefacts


.. toctree::
   :maxdepth: 2
   :caption: Language Reference

   langref/index

.. toctree::
   :maxdepth: 2
   :caption: Tutorial

   tutorial/index

Quick Links
-----------

* `Research Paper <https://dl.acm.org/doi/10.1145/3779212.3790125>`_
* `AnvilHDL Playground <https://anvil.kisp-lab.org/>`_
* `Anvil Compiler <https://github.com/AnvilHDL/anvil>`_
* `Community Chat <https://anvilhdl.zulipchat.com/>`_
* `Research Paper Artifacts <https://github.com/AnvilHDL/AnvilHDL-Experiments>`_


Contact Us
----------

* `Jason Zhijingcheng Yu <https://www.comp.nus.edu.sg/~yuz1996/>`_
* `Aditya Ranjan Jha <https://arjha.com/contact/>`_
* `Umang Mathur <https://www.comp.nus.edu.sg/~umathur/>`_
* `Trevor E. Carlson <https://www.comp.nus.edu.sg/~tcarlson/>`_
* `Prateek Saxena <https://www.comp.nus.edu.sg/~prateeks/>`_

You can also join the `AnvilHDL community chat <https://anvilhdl.zulipchat.com/>`_ for questions and discussion.


**Acknowledgement**: We want to thank |zulip-logo| for sponsoring the community chat channel and allowing us to encourage discussions. Zulip is an organized team chat app designed for efficient communication.

.. |zulip-logo| image:: https://raw.githubusercontent.com/zulip/zulip/main/static/images/logo/zulip-org-logo.svg
   :height: 20px
   :alt: Zulip
   :target: https://zulip.com
