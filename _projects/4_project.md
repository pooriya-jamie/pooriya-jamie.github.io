---
layout: page
title: "Simulating Vulnerability"
description: "LLM-driven agents for policy-controlled audits under exposure constraints"
img: /assets/img/projects/simulating-vulnerability.png
importance: 1
category: work
theme: sociotech
---

<!-- **Status:** Manuscript in preparation (not yet published). -->

### Why this project

Auditing recommender systems in safety-critical domains is hard for a simple reason: you often need to **express audit intent** (seek, avoid, stop) while also respecting **exposure constraints**. Scripted bots scale, but they are typically open-loop and cannot condition behavior on what is actually on screen. This project introduces a framework for **dynamic audits under exposure constraints**, where intent is explicitly defined as an interaction policy and executed in a closed loop.

<!-- ### Core idea
An audit is specified as:
- an **interaction policy**
- an **exposure budget** (with safety constraints)
- a **logging schema**
- a **probe domain**

A **multimodal LLM controller** runs at control-time to estimate a lightweight content state from on-screen signals, then routes actions according to the pre-specified policy. Crucially, control-time predictions are used only for routing, while outcomes are computed offline to avoid circular evaluation.

### System design
The pipeline separates:
- **Online policy execution** (controller routes actions and logs a full audit trace)
- **Offline measurement** (post-hoc labeling + metrics)

This produces an inspectable trace (observation → controller output → action) and keeps measurement independent from the controller.

### Case study instantiation
We instantiate the framework in a TikTok mental health probe domain and compare three policies:
- Passive (open-loop baseline)
- Interested (watch longer on probe-relevant content)
- Avoiding (skip probe-relevant content)

Policies differ only in how they allocate attention based on the controller’s control-time relevance decision.

### What this project contributes
- A formalization of **dynamic, policy-driven audits** under explicit exposure constraints
- A system design that cleanly separates **control-time routing** from **offline measurement**
- Evidence (via a probe-domain instantiation) that policy choice changes exposure trajectories and that multimodal routing matters in practice  -->
