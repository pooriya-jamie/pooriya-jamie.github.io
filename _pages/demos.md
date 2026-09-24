---
layout: page
title: demos
permalink: /demos/
description: Hands-on tours of the research systems behind my work. Each one runs right in your browser, no sign-up needed.
nav: true
nav_order: 4
---

<div class="demos page-feature">
  {% for demo in site.data.demos %}
  {% assign flip = forloop.index | modulo: 2 %}
  <section class="demo-showcase{% if flip == 0 %} demo-showcase--flip{% endif %}" style="--demo-glow-a: {{ demo.glow_a }}; --demo-glow-b: {{ demo.glow_b }};">
    <a class="demo-frame" href="{{ demo.url }}" target="_blank" rel="noopener noreferrer" aria-label="Launch the {{ demo.title }} demo">
      <div class="demo-frame__bar" aria-hidden="true">
        <span class="demo-frame__dots"><i></i><i></i><i></i></span>
        <span class="demo-frame__url"><i class="fa-solid fa-lock"></i>{{ demo.url | remove: 'https://' }}</span>
      </div>
      <div class="demo-frame__screen">
        <img src="{{ demo.image | relative_url }}" alt="Screenshot of the {{ demo.title }} demo" width="1440" height="900" loading="lazy">
        <span class="demo-frame__launch"><i class="fa-solid fa-play" aria-hidden="true"></i>Launch demo</span>
      </div>
    </a>
    <div class="demo-showcase__body">
      <div class="demo-showcase__meta">
        <span class="demo-showcase__index" aria-hidden="true">{{ forloop.index | prepend: '0' }}</span>
        <span class="theme-chip theme-chip--{{ demo.chip }}">{{ demo.kicker }}</span>
      </div>
      <h2>{{ demo.title }}</h2>
      <p class="demo-showcase__pitch">{{ demo.pitch }}</p>
      <ul class="demo-showcase__highlights">
        {% for item in demo.highlights %}
        <li><i class="{{ item.icon }}" aria-hidden="true"></i><span>{{ item.text }}</span></li>
        {% endfor %}
      </ul>
      <div class="demo-showcase__tags">
        {% for tag in demo.tags %}<span>{{ tag }}</span>{% endfor %}
      </div>
      <div class="demo-showcase__actions">
        <a class="home-button home-button--primary" href="{{ demo.url }}" target="_blank" rel="noopener noreferrer">
          <i class="fa-solid fa-play" aria-hidden="true"></i>
          <span>Launch demo</span>
        </a>
        <a class="home-button home-button--ghost" href="{{ demo.code }}" target="_blank" rel="noopener noreferrer">
          <i class="fa-brands fa-github" aria-hidden="true"></i>
          <span>Code</span>
        </a>
        {% if demo.related_url %}
        <a class="text-link" href="{{ demo.related_url | relative_url }}">
          <span>Project: {{ demo.related_label }}</span>
          <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </a>
        {% endif %}
      </div>
    </div>
  </section>
  {% endfor %}
</div>
