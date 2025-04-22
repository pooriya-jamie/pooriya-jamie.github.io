---
layout: page
permalink: /team.html
title: OASIS Lab
page-title: Team
description: Online and AI Systems’ Integrity & Safety
nav: true
nav_order: 2
nav_rank: 2
---

<style>
  .group-container {
    margin-bottom: 2rem;
  }
  .group-heading {
    margin: 1rem 0 0.5rem;
    font-size: 1.75rem;
    font-weight: bold;
  }
  .team-card {
    margin-bottom: 1rem;
  }
</style>

{% assign groups = site.members | sort: "group_rank" | map: "group" | uniq %}
{% for group in groups %}
  <div class="group-container">
    <h2 class="group-heading">{{ group }}</h2>
    {% assign members = site.members | sort: "group_order" | where: "group", group %}

    {% if group == "Academic Collaborators" %}
      {% assign academic_members = members | where: "academic", true %}
      {% assign other_members = members | where_exp: "item", "item.academic != true" %}

      <div class="row">
        {% for member in academic_members %}
          <div class="col-md-6">
            <div class="card team-card {% if member.inline == false %}hoverable{% endif %}">
              <div class="row no-gutters">
                <div class="col-sm-4 col-md-4">
                  <img src="{{ '/assets/img/team/' | append: member.profile.image | relative_url }}" class="card-img img-fluid" alt="{{ member.profile.name }}" />
                </div>
                <div class="team col-sm-8 col-md-8">
                  <div class="card-body">
                    {% if member.inline == false %}
                      {% if member.external == true %}
                        <a href="{{ member.profile.website }}">
                      {% else %}
                        <a href="{{ member.url | relative_url }}">
                      {% endif %}
                    {% endif %}
                    <h5 class="card-title">{{ member.profile.name }}</h5>
                    {% if member.profile.team-position %}
                      <h6 class="card-subtitle mb-2 text-muted">{{ member.profile.team-position }}</h6>
                    {% elsif member.profile.position %}
                      <h6 class="card-subtitle mb-2 text-muted">{{ member.profile.position }}</h6>
                    {% endif %}
                    <p class="card-text">{{ member.teaser }}</p>
                    {% if member.inline == false %}</a>{% endif %}
                    {% if member.profile.email %}
                      <a href="mailto:{{ member.profile.email }}" class="card-link"><i class="fas fa-envelope"></i></a>
                    {% endif %}
                    {% if member.profile.phone %}
                      <a href="tel:{{ member.profile.phone }}" class="card-link"><i class="fas fa-phone"></i></a>
                    {% endif %}
                    {% if member.profile.orcid %}
                      <a href="https://orcid.org/{{ member.profile.orcid }}" class="card-link" target="_blank"><i class="fab fa-orcid"></i></a>
                    {% endif %}
                    {% if member.profile.twitter %}
                      <a href="https://twitter.com/{{ member.profile.twitter }}" class="card-link" target="_blank"><i class="fab fa-twitter"></i></a>
                    {% endif %}
                    {% if member.profile.github %}
                      <a href="https://github.com/{{ member.profile.github }}" class="card-link" target="_blank"><i class="fab fa-github"></i></a>
                    {% endif %}
                    {% if member.profile.website %}
                      <a href="{{ member.profile.website }}" class="card-link" target="_blank"><i class="fas fa-globe"></i></a>
                    {% endif %}
                  </div>
                </div>
              </div>
            </div>
          </div>
        {% endfor %}
      </div>

      {% for member in other_members %}
        <div class="card team-card {% if member.inline == false %}hoverable{% endif %}">
          <div class="row no-gutters">
            <div class="col-sm-4 col-md-3">
              <img src="{{ '/assets/img/team/' | append: member.profile.image | relative_url }}" class="card-img img-fluid" alt="{{ member.profile.name }}" />
            </div>
            <div class="team col-sm-8 col-md-9">
              <div class="card-body">
                {% if member.inline == false %}
                  {% if member.external == true %}
                    <a href="{{ member.profile.website }}">
                  {% else %}
                    <a href="{{ member.url | relative_url }}">
                  {% endif %}
                {% endif %}
                <h5 class="card-title">{{ member.profile.name }}</h5>
                {% if member.profile.team-position %}
                  <h6 class="card-subtitle mb-2 text-muted">{{ member.profile.team-position }}</h6>
                {% elsif member.profile.position %}
                  <h6 class="card-subtitle mb-2 text-muted">{{ member.profile.position }}</h6>
                {% endif %}
                <p class="card-text">{{ member.teaser }}</p>
                {% if member.inline == false %}</a>{% endif %}
                {% if member.profile.email %}
                  <a href="mailto:{{ member.profile.email }}" class="card-link"><i class="fas fa-envelope"></i></a>
                {% endif %}
                {% if member.profile.phone %}
                  <a href="tel:{{ member.profile.phone }}" class="card-link"><i class="fas fa-phone"></i></a>
                {% endif %}
                {% if member.profile.orcid %}
                  <a href="https://orcid.org/{{ member.profile.orcid }}" class="card-link" target="_blank"><i class="fab fa-orcid"></i></a>
                {% endif %}
                {% if member.profile.twitter %}
                  <a href="https://twitter.com/{{ member.profile.twitter }}" class="card-link" target="_blank"><i class="fab fa-twitter"></i></a>
                {% endif %}
                {% if member.profile.github %}
                  <a href="https://github.com/{{ member.profile.github }}" class="card-link" target="_blank"><i class="fab fa-github"></i></a>
                {% endif %}
                {% if member.profile.website %}
                  <a href="{{ member.profile.website }}" class="card-link" target="_blank"><i class="fas fa-globe"></i></a>
                {% endif %}
              </div>
            </div>
          </div>
        </div>
      {% endfor %}

    {% else %}
      {% for member in members %}
        <div class="card team-card {% if member.inline == false %}hoverable{% endif %}">
          <div class="row no-gutters">
            <div class="col-sm-4 col-md-3">
              <img src="{{ '/assets/img/team/' | append: member.profile.image | relative_url }}" class="card-img img-fluid" alt="{{ member.profile.name }}" />
            </div>
            <div class="team col-sm-8 col-md-9">
              <div class="card-body">
                {% if member.inline == false %}
                  {% if member.external == true %}
                    <a href="{{ member.profile.website }}">
                  {% else %}
                    <a href="{{ member.url | relative_url }}">
                  {% endif %}
                {% endif %}
                <h5 class="card-title">{{ member.profile.name }}</h5>
                {% if member.profile.team-position %}
                  <h6 class="card-subtitle mb-2 text-muted">{{ member.profile.team-position }}</h6>
                {% elsif member.profile.position %}
                  <h6 class="card-subtitle mb-2 text-muted">{{ member.profile.position }}</h6>
                {% endif %}
                <p class="card-text">{{ member.teaser }}</p>
                {% if member.inline == false %}</a>{% endif %}
                {% if member.profile.email %}
                  <a href="mailto:{{ member.profile.email }}" class="card-link"><i class="fas fa-envelope"></i></a>
                {% endif %}
                {% if member.profile.phone %}
                  <a href="tel:{{ member.profile.phone }}" class="card-link"><i class="fas fa-phone"></i></a>
                {% endif %}
                {% if member.profile.orcid %}
                  <a href="https://orcid.org/{{ member.profile.orcid }}" class="card-link" target="_blank"><i class="fab fa-orcid"></i></a>
                {% endif %}
                {% if member.profile.twitter %}
                  <a href="https://twitter.com/{{ member.profile.twitter }}" class="card-link" target="_blank"><i class="fab fa-twitter"></i></a>
                {% endif %}
                {% if member.profile.github %}
                  <a href="https://github.com/{{ member.profile.github }}" class="card-link" target="_blank"><i class="fab fa-github"></i></a>
                {% endif %}
                {% if member.profile.website %}
                  <a href="{{ member.profile.website }}" class="card-link" target="_blank"><i class="fas fa-globe"></i></a>
                {% endif %}
              </div>
            </div>
          </div>
        </div>
      {% endfor %}
    {% endif %}
  </div>
{% endfor %}
