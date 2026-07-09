# Setting up the store

The store on `cabezadechivo.com/store` is a static page. It has **no
backend** — payment is handled by **Stripe Payment Links**, which are free
to create (Stripe just takes ~2.9% + 30¢ per sale, no monthly fee).

You create a link once per product in the Stripe dashboard, then paste it
into `_data/products.yml`. That's it.

---

## One-time: make a Stripe account

1. Go to <https://stripe.com> and sign up (use `cabezadechivo.773@gmail.com`).
2. Add the band's bank account so payouts have somewhere to land.
3. (Optional but nice) Under **Settings → Branding**, set the logo/colors so
   the checkout page looks like us.

## Per product: create a Payment Link

1. Stripe dashboard → **Product catalog** → **+ Add product**. Set name,
   price, and upload a photo.
2. Go to **Payment Links** → **+ New** → pick that product.
3. For **vinyl and merch** (physical things you ship):
   - Turn on **"Collect customers' addresses → Shipping address."**
   - Add **Shipping rates** (e.g. $5 US media mail, $15 international). Do this
     under **Settings → Shipping** once, then reuse.
   - If you have limited stock, set **"Limit the number of payments"** so it
     auto-closes when you sell out.
4. Copy the link — it looks like `https://buy.stripe.com/abc123`.
5. Paste it into the matching product's `link:` field in
   `../_data/products.yml`.

## Digital releases

Stripe Payment Links **don't deliver download files automatically**. Easiest
options:
- **Keep digital on Bandcamp** (what the catalog does now) — set `link:` to the
  Bandcamp URL. Fans expect digital there anyway.
- Or, if you want it through Stripe, set the link's **confirmation page** to a
  hidden download/Bandcamp-code page after purchase.

---

## Editing the catalog

Everything lives in `_data/products.yml`. To add an item, copy a block:

```yaml
- name: "tour poster"
  type: merch          # vinyl | digital | merch
  price: "$15"
  image: /assets/img/store/poster.jpg
  description: "18x24 screen print."
  link: "https://buy.stripe.com/..."   # blank = "coming soon"
  sold_out: false                      # true = SOLD OUT badge
```

- Product photos go in `assets/img/store/`. Square images look best.
- Set `sold_out: true` to keep an item visible but mark it sold out.
- Commit + push; GitHub Pages rebuilds the site automatically.

## When everything's gone

The old `store/sold_out.md` page is still there as a generic fallback if you
ever want to link to it.
