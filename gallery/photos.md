---
layout: default
title: cabeza de chivo — photo gallery
permalink: /gallery/photos/
---

<p class="epk-kicker">photo gallery</p>

{% for g in site.data.galleries %}
{% include photo-carousel.html gallery=g %}
{% endfor %}

<p class="gallery-note">These are web-resolution previews. Please contact us at mail@cabezadechivo.com before using any of these photos — we'll send full-resolution files, and the photographer credit must stay.</p>

<div class="epk-rule">~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*</div>

<p class="epk-links"><a href="/epk/">&laquo; back to press kit</a></p>

<script src="/assets/js/carousel.js"></script>
