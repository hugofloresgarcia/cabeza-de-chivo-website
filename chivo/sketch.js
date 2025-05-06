// Click and drag the mouse to view the scene from different angles.

let shape;
let bgColor;

// Load the file and create a p5.Geometry object.
function preload() {
  shape = loadModel('/assets/chivo.obj', true);
}

// let WIDTH = 

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL).parent('sketch');

  describe('A spinning goat.');

  bgColor = color("#211a1e");
  // bgColor = color("#5B2027");
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

function draw() {
  // background("#5B2027");
  // slight variation on the background color
  // bgColor.setAlpha(255);

  // bgColor = color_vary(bgColor, 10);

  // vary color only every 10 frames
  // if (frameCount % 10 == 0) {
  //   bgColor = color_vary(bgColor, 10);
  // }
  
  background(bgColor);


  // Enable orbiting with the mouse.
  orbitControl();

  // noStroke();
  rotateY(frameCount * 0.01);
  rotateX(frameCount * 0.01);

  // zoom in a bit
  scale(2);

  model(shape);

}