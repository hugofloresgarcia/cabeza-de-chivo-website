// Pixel-art decoder: palette-indexed string grids -> offscreen canvases.
// All art is authored facing RIGHT; a horizontally mirrored copy is baked
// at load so rendering never needs a transform.
//
// Frame format: array of equal-length strings, one char per pixel.
// '.' (or ' ') = transparent; any other char looks up palette[char].

export function decodeFrame(rows, palette, scale = 1) {
  const h = rows.length;
  const w = rows[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const color = palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return canvas;
}

function mirrorCanvas(src) {
  const canvas = document.createElement('canvas');
  canvas.width = src.width;
  canvas.height = src.height;
  const ctx = canvas.getContext('2d');
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return canvas;
}

// anims: { name: { fps, frames: [rows, ...], loop? } }
// Returns { name: { fps, loop, frames: [canvas], mirrored: [canvas] } }
export function buildAnims(anims, palette, scale = 1) {
  const out = {};
  for (const name in anims) {
    const a = anims[name];
    const frames = a.frames.map((rows) => decodeFrame(rows, palette, scale));
    out[name] = {
      fps: a.fps ?? 8,
      loop: a.loop !== false,
      frames,
      mirrored: frames.map(mirrorCanvas),
      w: frames[0].width,
      h: frames[0].height,
    };
  }
  return out;
}

// Apply overlay patches to a copy of a base frame's rows.
// patch: { x, y, rows: ['HH', '.H'] } — '.' in a patch row leaves the
// base pixel untouched; any other char overwrites (including ' ' = erase
// is not supported; use a palette key mapped to a color or leave '.').
export function applyPatches(baseRows, patches) {
  const rows = baseRows.map((r) => r.split(''));
  for (const p of patches) {
    p.rows.forEach((prow, dy) => {
      const y = p.y + dy;
      if (y < 0 || y >= rows.length) return;
      for (let dx = 0; dx < prow.length; dx++) {
        const ch = prow[dx];
        if (ch === '.') continue;
        const x = p.x + dx;
        if (x < 0 || x >= rows[y].length) continue;
        rows[y][x] = ch === '_' ? '.' : ch; // '_' erases to transparent
      }
    });
  }
  return rows.map((r) => r.join(''));
}
