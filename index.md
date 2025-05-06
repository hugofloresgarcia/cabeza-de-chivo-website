---
layout: home
title: cabeza de chivo
---

<pre id="ascii-border-top" class="ascii-shows-border"></pre>

### UPCOMING SHOWS - 2025
<pre class="ascii-shows">
{% for show in site.data.shows %}
      >>> {{ show.date | date: "%B %e" }} at {{ show.venue }}.  <a href="{{ show.url }}" target="_blank">[tickets]</a>{% if show.note %} ({{ show.note }}){% endif %}
{% endfor %}
</pre>

<pre id="ascii-border-bottom" class="ascii-shows-border"></pre>


<script>
const borderFrames = [
  "~~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~~",
  "~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~",
  "~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~",
  "*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*",
];

let frame = 0;
function animateBorders() {
  const top = document.getElementById("ascii-border-top");
  const bottom = document.getElementById("ascii-border-bottom");
  const line = "      " + borderFrames[frame % borderFrames.length];

  if (top && bottom) {
    top.innerText = line;
    bottom.innerText = line;
  }

  frame++;
  setTimeout(animateBorders, 150);
}
animateBorders();
</script>
