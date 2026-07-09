---
layout: default
title: store
description: 'La Juana // Danza del Chivo — new 7" 45 from Cabeza de Chivo. limited pressing, ships from chicago.'
image: /assets/img/store/la-juana-share.jpg
---

## STORE

<div id="ascii-border-bottom" class="ascii-shows-border"></div>

<p class="store-intro">records &amp; merch, shipped from chicago. also on <a href="https://cabezadechivo.bandcamp.com" target="_blank" rel="noopener">bandcamp</a>. questions? <a href="mailto:cabezadechivo.773@gmail.com">email us</a>.</p>

<div class="store-grid">
{% for product in site.data.products %}
  <div class="store-card{% if product.sold_out %} store-card--soldout{% endif %}">
    {% if product.images and product.images.size > 1 %}
      <div class="store-card__gallery" data-store-gallery>
        {% for img in product.images %}<img class="store-slide{% if forloop.first %} is-active{% endif %}" src="{{ img | relative_url }}" alt="{{ product.name }} — photo {{ forloop.index }} of {{ product.images.size }}" loading="lazy">{% endfor %}
        <button class="store-gallery__nav store-gallery__prev" aria-label="previous photo" data-prev>&#x2039;</button>
        <button class="store-gallery__nav store-gallery__next" aria-label="next photo" data-next>&#x203a;</button>
        <div class="store-gallery__dots" aria-hidden="true">{% for img in product.images %}<span class="store-gallery__dot{% if forloop.first %} is-active{% endif %}"></span>{% endfor %}</div>
      </div>
    {% elsif product.images and product.images.size == 1 %}<img class="store-card__img" src="{{ product.images[0] | relative_url }}" alt="{{ product.name }}" loading="lazy">
    {% elsif product.image %}<img class="store-card__img" src="{{ product.image | relative_url }}" alt="{{ product.name }}" loading="lazy">
    {% else %}<div class="store-card__img store-card__img--placeholder">[ ◣◢ ]</div>{% endif %}
    <div class="store-card__body">
      {% if product.type %}<span class="store-card__tag store-card__tag--{{ product.type }}">{{ product.type }}</span>{% endif %}
      <h3 class="store-card__name">{{ product.name }}</h3>
      {% if product.description %}<p class="store-card__desc">{{ product.description }}</p>{% endif %}
      <p class="store-card__price">{{ product.price }}</p>
      {% if product.sold_out %}
        <span class="store-card__btn store-card__btn--soldout">sold out</span>
      {% elsif product.link and product.link != "" %}
        <a class="store-card__btn" href="{{ product.link }}" target="_blank" rel="noopener">buy &rarr;</a>
      {% else %}
        <span class="store-card__btn store-card__btn--soon">coming soon</span>
      {% endif %}
    </div>
  </div>
{% endfor %}
</div>

<div id="ascii-border-top" class="ascii-shows-border"></div>

<script src="/assets/js/store-gallery.js" defer></script>
