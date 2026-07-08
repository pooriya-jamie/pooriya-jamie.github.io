---
layout: page
permalink: /publications/
title: publications
description: Peer-reviewed and preprint research outputs.
nav: true
nav_order: 2
---

<div class="publications page-feature" data-filter-scope data-filter-items=".publication-entry">
  <div class="publication-filter-panel">
    <div class="filter-group" aria-label="Filter publications by year">
      <span class="filter-group__label">Year</span>
      <button class="filter-button is-active" type="button" data-filter-key="year" data-filter-value="all">All</button>
      <button class="filter-button" type="button" data-filter-key="year" data-filter-value="2026">2026</button>
      <button class="filter-button" type="button" data-filter-key="year" data-filter-value="2025">2025</button>
      <button class="filter-button" type="button" data-filter-key="year" data-filter-value="2024">2024</button>
    </div>
    <div class="filter-group" aria-label="Filter publications by topic">
      <span class="filter-group__label">Topic</span>
      <button class="filter-button is-active" type="button" data-filter-key="topic" data-filter-value="all">All</button>
      <button class="filter-button" type="button" data-filter-key="topic" data-filter-value="platform">Platform Audits</button>
      <button class="filter-button" type="button" data-filter-key="topic" data-filter-value="education">AI in Education</button>
      <button class="filter-button" type="button" data-filter-key="topic" data-filter-value="applied-ml">Applied ML</button>
    </div>
  </div>

  <p class="filter-empty" hidden>No publications match the selected filters.</p>

{% bibliography %}

</div>
