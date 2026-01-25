---
layout: page
title: "Seeking Help, Facing Harm"
description: "Auditing TikTok mental health recommendations under help-seeking vs distress intent"
img: /assets/img/projects/seeking-help-facing-harm.png
importance: 2
category: work
theme: sociotech
---

<!-- **Status:** Working paper (not yet published). -->

### Research question
Do recommender systems distinguish between **help-seeking** and **distress expression** within the same sensitive domain, or do they collapse both into an undifferentiated “mental health interest” signal?

### Audit design
We run a controlled 7-day audit of TikTok’s For You Page using 30 fresh accounts and LLM-guided agents. The design crosses:
- **Search framing:** distress-initiated vs help-initiated
- **Interaction strategy:** MH-engaged vs MH-avoidant vs passive-observer

This yields six experimental conditions and isolates stated intent (search) from revealed behavior (watch/skip patterns). 

### Key findings
1) **Behavior dominates outcomes.** Engagement rapidly saturates feeds with mental health content (about 45% of daily recommendations), while avoidance and passive viewing reduce but do not eliminate exposure (about 11–20%).

2) **Help-seeking changes the mix, not the risk.** Help-initiated searches yield more potentially supportive material, but potentially harmful content persists at low but non-zero levels, including suicide/self-harm content. Help-seeking does not act as a safety boundary. 

3) **Avoidance reduces volume, not safety.** Suppressing mental health content lowers overall exposure, but does not reliably improve what the remaining content contains. 

### Why this matters
The results suggest limited sensitivity to user intent signals in a sensitive domain, and motivate context-aware safeguards that treat help-seeking as safety-relevant rather than just topical. 
