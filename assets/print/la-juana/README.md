# PRINT FILES

Press-ready artwork, hosted here so it can be handed to a printer by URL.
These are **not** used by any page on the site.

## La Juana / Cabeza de Chivo shirt

Artwork by **Brian Herrera**. Derived from the 7" sleeve art.

| file | what it is | give it to |
|---|---|---|
| `la-juana-shirt.svg` | vector, **black** fill, transparent bg | screen printers |
| `la-juana-shirt-white.svg` | vector, **white** fill, transparent bg | screen printers (white ink) |
| `la-juana-shirt-white.png` | 3924 × 3856 raster, white, transparent bg, 300 DPI | DTG / anyone wanting raster |
| `la-juana-artwork-source.psd` | the untouched original | anyone who wants to rework it |

`la-juana-artwork-source.psd` is the original file everything else was made
from, kept here so the chain isn't lost — originally
`La Juana Artwork - Tito - Brian Herrera Layout-1.psd`. It's 2100 × 2100,
grayscale, a single layer, and still has the scanner grain in it. It is
**not** a print file; use one of the three above for that.

Both SVGs are the same paths, only the fill colour differs. They carry a real
physical size of **13.08 in × 12.85 in**, so they open at print scale rather
than as an arbitrary pixel box. Being vector, they can be scaled to any size
with no quality loss — use these for anything large.

The art is one solid colour. It's designed as **white ink on a dark garment**
(the original is a white line drawing on black), so the black-filled SVG is
just the conventional viewable version — the printer sets the actual ink.

### Resolution note

The only source that exists is a ~2100 px scan, so true optical detail tops out
around 1962 px across the artwork. The PNG here is a 2× upscale, which is why
it reports 300 DPI at 13 in — that resolution is interpolated, not extra
detail. **For any print wider than about 7 in, use the SVG**, which has no such
ceiling. The bundled PDF of the same art is not vector either; it just wraps a
2018 × 2024 raster.

### How these were made

From the PSD composite (`la-juana-artwork-source.psd`): cleaned with a `-level 32%,82%` black/white point to
remove diffuse scanner grain from the background while preserving the
intentional stipple texture, trimmed to the artwork bounds, then either
upscaled 2× (Lanczos + sigmoidal re-crisp) for the PNG, or traced with
`potrace -t 4 -a 0.6 -O 0.1 -u 20 --flat` for the SVGs. Tracing the upscaled
bitmap rather than the native one cut the error against the original scan
roughly in half.
