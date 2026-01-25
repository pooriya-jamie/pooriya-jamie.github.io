---
layout: page
title: projects
permalink: /projects/
description: Research projects organized by theme.
nav: true
nav_order: 3
horizontal: true
---

<div class="projects">

  <!-- Theme 1 -->
  <h2 id="llms" class="category">Studies of Large Language Models</h2>
  <p class="font-weight-light">
    Investigating the safety, behavior, and societal impact of large language models through red teaming, auditing, and experimental evaluation.
  </p>

  {% assign llm_projects = site.projects | where: "theme", "llm" | sort: "importance" %}
  <div class="container">
    <div class="row row-cols-1 row-cols-md-2">
      {% for project in llm_projects %}
        {% include projects_horizontal.liquid %}
      {% endfor %}
    </div>
  </div>

  <!-- Theme 2 -->
  <h2 id="sociotech" class="category mt-5">Studies of Sociotechnical Systems</h2>
  <p class="font-weight-light">
    Examining how algorithmic systems, human behavior, and platform design interact to shape online experiences and societal outcomes.
  </p>

  {% assign sociotech_projects = site.projects | where: "theme", "sociotech" | sort: "importance" %}
  <div class="container">
    <div class="row row-cols-1 row-cols-md-2">
      {% for project in sociotech_projects %}
        {% include projects_horizontal.liquid %}
      {% endfor %}
    </div>
  </div>

  <!-- Theme 3 -->
  <h2 id="aied" class="category mt-5">AI in Education</h2>
  <p class="font-weight-light">
    Understanding how learners and instructors use generative AI in real courses, and what it changes about learning, assessment, and pedagogy.
  </p>

  {% assign aied_projects = site.projects | where: "theme", "aied" | sort: "importance" %}
  <div class="container">
    <div class="row row-cols-1 row-cols-md-2">
      {% for project in aied_projects %}
        {% include projects_horizontal.liquid %}
      {% endfor %}
    </div>
  </div>

</div>
