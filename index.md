---
layout: home
title: cabeza de chivo
---


## UPCOMING SHOWS - 2025

<pre class="ascii-shows">
{% for show in site.data.shows %}
  >>> <span class="show-date">{{ show.date | date: "%B %e" }}</span> at <span class="show-venue">{{ show.venue }}</span>.  <a href="{{ show.url }}" target="_blank">[tickets]</a>{% if show.note %} <span class="show-note">({{ show.note }})</span>{% endif %}
{% endfor %}
</pre>

<div id="ascii-border-bottom" class="ascii-shows-border"></div>

