
const borderFrames = [
  "~~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~~*",
  "~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~",
  "~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*",
  "*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~~*~*~~*~~*~*~~*~~*~*~~*~",
];

let frame = 0;
function animateBorders() {
  const top = document.getElementById("ascii-border-top");
  const bottom = document.getElementById("ascii-border-bottom");
  const line = borderFrames[frame % borderFrames.length];

  if (top && bottom) {
    top.innerText = line;
    bottom.innerText = line;
  }

  frame++;
  setTimeout(animateBorders, 150);
}
animateBorders();