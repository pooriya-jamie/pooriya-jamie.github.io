---
layout: page
title: projects
permalink: /projects/
description: Research projects organized by theme.
nav: true
nav_order: 3
---

<div class="projects page-feature" data-filter-scope data-filter-items=".project-theme-section">
  <div class="filter-bar" aria-label="Filter projects by theme">
    <button class="filter-button is-active" type="button" data-filter-key="theme" data-filter-value="all">All</button>
    <button class="filter-button" type="button" data-filter-key="theme" data-filter-value="llm">LLM Safety</button>
    <button class="filter-button" type="button" data-filter-key="theme" data-filter-value="sociotech">Platform Audits</button>
    <button class="filter-button" type="button" data-filter-key="theme" data-filter-value="aied">AI in Education</button>
  </div>

{% assign llm_projects = site.projects | where: "theme", "llm" | sort: "importance" %}

  <section id="llms" class="project-theme-section js-filter-item" data-filter-theme="llm">
    <div class="theme-section-header">
      <span class="theme-chip theme-chip--llm">LLM Safety</span>
      <h2>Studies of Large Language Models</h2>
      <p>Investigating the safety, behavior, and societal impact of large language models through agentic auditing, behavioral evaluation, and experimental measurement.</p>
    </div>
    <div class="row row-cols-1 row-cols-md-2 g-4">
      {% for project in llm_projects %}
        {% include projects.liquid %}
      {% endfor %}
    </div>
  </section>

{% assign sociotech_projects = site.projects | where: "theme", "sociotech" | sort: "importance" %}

  <section id="sociotech" class="project-theme-section js-filter-item" data-filter-theme="sociotech">
    <div class="theme-section-header">
      <span class="theme-chip theme-chip--sociotech">Platform Audits</span>
      <h2>Studies of Sociotechnical Systems</h2>
      <p>Examining how algorithmic systems, human behavior, and platform design interact to shape online experiences and societal outcomes.</p>
    </div>
    <div class="row row-cols-1 row-cols-md-2 g-4">
      {% for project in sociotech_projects %}
        {% include projects.liquid %}
      {% endfor %}
    </div>
  </section>

{% assign aied_projects = site.projects | where: "theme", "aied" | sort: "importance" %}

  <section id="aied" class="project-theme-section js-filter-item" data-filter-theme="aied">
    <div class="theme-section-header">
      <span class="theme-chip theme-chip--aied">AI in Education</span>
      <h2>AI in Education</h2>
      <p>Understanding how learners and instructors use generative AI in real courses, and what it changes about learning, assessment, and pedagogy.</p>
    </div>
    <div class="row row-cols-1 row-cols-md-2 g-4">
      {% for project in aied_projects %}
        {% include projects.liquid %}
      {% endfor %}
    </div>
  </section>
</div>
