PALETTE = {
    "Bright pink (Crayola)":"ef476f",
    "Sunglow":"ffd166",
    "Emerald":"06d6a0",
    "Blue (NCS)":"118ab2",
    "Midnight green":"073b4c"
}

function random_color_from_palette(palette) {
  let keys = Object.keys(palette);
  let key = keys[Math.floor(Math.random() * keys.length)];

  // need to prepend # to make it a valid hex color
  // append the alpha value

  return color("#" + palette[key] + "ff");
}

function random_color() {
    return color(random(255), random(255), random(255));
}

function color_vary(clr, amt) {
  // vary hsb by amt
  let h = hue(clr);
  let s = saturation(clr);
  let b = brightness(clr);
  return color(
    h + random(-amt, amt), 
    s + random(-amt, amt), 
    b + random(-amt, amt)
  );
}