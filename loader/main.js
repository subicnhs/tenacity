// Lesson 5 — Stagger
//
// anime.stagger(value, options) distributes a value evenly across all targets.
// It can be used anywhere a property value is accepted.
//
// Basic usage:
//   delay: anime.stagger(100)           — 0ms, 100ms, 200ms, 300ms, ...
//   delay: anime.stagger([0, 600])      — spread 0ms→600ms across all targets
//   translateX: anime.stagger(50)       — 0px, 50px, 100px, ...
//
// Options:
//   start     — starting value (default: 0)
//   from      — 'first' | 'last' | 'center' | index — where the stagger originates
//   direction — 'normal' | 'reverse'
//   easing    — easing for the stagger distribution curve
//   grid      — [cols, rows] — switches to 2D distance-based stagger

var COLS = 8, ROWS = 6;
var grid = document.getElementById('grid');

for (var i = 0; i < COLS * ROWS; i++) {
  var cell = document.createElement('div');
  cell.className = 'cell';
  grid.appendChild(cell);
}

anime({
  targets: '.cell',
  scale: [
    { value: 0.1, easing: 'easeOutSine',   duration: 200 },
    { value: 0.01,   easing: 'easeInOutBack', duration: 200 }
  ],
  opacity: [0, 1],
  // grid: stagger calculates each cell's distance from the 'center' origin
  delay: anime.stagger(70, { grid: [COLS, ROWS], from: 'center' }),
  loop: true
});
