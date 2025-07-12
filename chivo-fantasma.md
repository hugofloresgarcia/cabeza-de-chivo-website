---
layout: default
title: chivo fantasma
---

Mira fijamente a el chivo, concentrate en los ojos. Mira fijamente for 45 segundos, no te vayas a distraer, eschucha atentamente a lo que dice el fantasma. 

<!-- 
La imagen que veras a continuación es un relato fantasmagórico...

Debes tener el audio debidamente configurado...  Sube el volumen hasta que escuches bien el test de sonido que se oye en esta página.  Luego presiona el link para continuar.

Si padeces del corazón, presión baja, eres muy pequeño o si te asustas fácilmente NO sigas, mejor mira la broma de la Formula Uno.  NO ACEPTAMOS QUEJAS O NOS HACEMOS RESPONSABLES.


Escucho bien, ahora quiero ver la imagen >>

Mira fijamente la imagen, concéntrate en la parte central, justo en medio de las dos ventanas, mira fijamente por 60 segundos.  Escucha atentamente al fantasma cuando aparezca. -->
<!-- include p5.js and p5.sound.js (put this in your <head> or before the sketch) -->

<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.5.0/p5.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.5.0/addons/p5.sound.min.js"></script>

<!-- your p5 sketch -->
<script>
let imgCalm, imgJump;
let scareSnd;
let hasPlayed = false;
const CALM_DURATION = 10000;  // 10 s
const SCARE_DURATION = 2000;  // 2 s
const LOOP_DURATION = CALM_DURATION + SCARE_DURATION;

function preload() {
  imgCalm = loadImage('assets/img/chivo-fantasma.jpeg');
  imgJump = loadImage('assets/img/chivo-jumpscare.jpeg');
  // loadSound can take an array for multiple formats
  scareSnd = loadSound([
    'assets/audio/chivo-delay.mp3',
    'assets/audio/chivo-delay.wav',
    'assets/audio/chivo-delay.ogg'
  ]);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CORNER);
  noCursor();
}

function draw() {
  background(0);
  let t = millis() % LOOP_DURATION;

  if (t < CALM_DURATION) {
    // show calm image
    image(imgCalm, 0, 0, width, height);
    // reset for next scare
    if (hasPlayed) {
      scareSnd.stop();
      hasPlayed = false;
    }
  } else {
    // show jumpscare image
    image(imgJump, 0, 0, width, height);
    // play sound once per cycle
    if (!hasPlayed && scareSnd.isLoaded()) {
      scareSnd.play();
      hasPlayed = true;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
</script>