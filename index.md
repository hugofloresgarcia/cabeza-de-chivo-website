---
layout: home
title: cabeza de chivo
---

## UPCOMING SHOWS - 2025

<pre class="ascii-shows">{% assign today = site.time | date: "%Y-%m-%d" %} {% assign upcoming_shows = site.data.shows | sort: "date" %} {% for show in upcoming_shows %} {% assign show_date = show.date | date: "%Y-%m-%d" %}{% if show_date >= today %}>>> <span class="show-date">{{ show.date | date: "%B %e" }}</span> at <span class="show-venue">{{ show.venue }}</span>.{% if show.url %} <a href="{{ show.url }}" target="_blank">[tickets]</a>{% endif %}{% if show.note %} <span class="show-note">({{ show.note }})</span>{% endif %}
{% endif %}{% endfor %}</pre>

<div id="ascii-border-bottom" class="ascii-shows-border"></div>

## PAST SHOWS

<details class="ascii-shows-expander">
  <summary><strong> click here to see the past shows  </strong></summary>
  <pre class="ascii-shows">{% assign past_shows = site.data.shows | sort: "date" | reverse %}{% for show in past_shows %}{% assign show_date = show.date | date: "%Y-%m-%d" %}{% if show_date < today %}>>> <span class="show-date">{{ show.date | date: "%B %e" }}</span> at <span class="show-venue">{{ show.venue }}</span>.{% if show.note %} <span class="show-note">({{ show.note }})</span>{% endif %}
{% endif %}{% endfor %}</pre>
</details>






<!-- website by [hugo](https://hugofloresgarcia.art/)  -->