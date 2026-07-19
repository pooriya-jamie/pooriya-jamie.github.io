---
layout: page
title: "Beyond Binary Detection"
description: "A multi-dimensional taxonomy of cancer misinformation across Reddit communities"
img: /assets/img/projects/Reddit-taxonomy.png
importance: 5
category: work
theme: sociotech
---

### What this is

This project moves beyond binary misinformation labels by introducing a multi-dimensional taxonomy for cancer discussions on Reddit. It studies conversations about breast, lung, colon, and prostate cancer while preserving distinctions that matter for understanding how misinformation appears and what risks it may pose.

### Taxonomy and method

The taxonomy captures seven dimensions, including:

- **Misinformation presence:** whether a post contains a misleading or unsupported claim
- **Information type:** the kind of health information being shared
- **Risk level:** the potential severity of acting on the claim
- **Stance:** whether the author supports, rejects, or questions the claim
- **Topical focus:** the cancer-related issue being discussed

Using expert-annotated data, the study evaluates multiple large language models for scalable annotation and applies the taxonomy across Reddit cancer communities.

### Key findings

1. **Cancer misinformation is present but unevenly distributed.** Approximately 6% of Reddit cancer discussions contain misinformation, with substantial variation across communities and topics.

2. **Few-shot prompting helps with nuance.** Examples substantially improve LLM classification, especially for the taxonomy's more detailed dimensions.

3. **Recurring narratives reveal distinct risks.** Common patterns include unsupported treatments, distrust of conventional medicine, and misleading claims about diagnosis and screening.

### Why it matters

A binary label cannot capture whether a claim is dangerous, what it concerns, or how a user positions it. The taxonomy, dataset, and evaluation provide a foundation for more precise measurement and modeling of online cancer misinformation.

### Citation

Pessianzadeh, A., Jamie, P., Sultana, N., Himmelstein, G., Zektser, Y., Ganz, P., Hosseinmardi, H., Ghasemian, A., & Rezapour, R. (2026). Beyond Binary Detection: A Multi-Dimensional Taxonomy of Cancer Misinformation on Reddit. *arXiv preprint [arXiv:2607.12383](https://arxiv.org/abs/2607.12383)*.
