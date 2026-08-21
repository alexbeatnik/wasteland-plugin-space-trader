/**
 * The printed screens, on a galaxy made by hand.
 *
 * `view.mjs` is pure — state in, string out — and takes the engine as an
 * argument, so a test can hand it four functions and a dozen stars and know
 * exactly what should come back. The other test files drive the real engine on
 * a galaxy generated afresh every run, which is the right way to catch what
 * breaks in play and the wrong way to ask "is that star drawn or not".
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chart } from '../plugins/space-trader/view.mjs';

/** The four things `chart` asks the engine, answered off a plain object. */
const engine = {
  currentSystem: (state) => state.systems[state.currentSystem],
  maxRange: (state) => state.ship.maxFuel,
  reachableSystems: (state) => {
    const here = engine.currentSystem(state);
    return state.systems.filter((sys) => sys.id !== here.id && engine.systemDistance(here, sys) <= state.ship.fuel);
  },
  systemDistance: (a, b) => Math.round(Math.hypot(a.x - b.x, a.y - b.y)),
};

/**
 * A tank of 10 and five stars around it, one of each case the chart draws.
 *
 * `fuel` is what is left in it, which is the whole question here: the window is
 * ten parsecs and a bit whatever the gauge says.
 */
function galaxy(fuel = 10) {
  return {
    currentSystem: 0,
    ship: { fuel, maxFuel: 10 },
    systems: [
      { id: 0, nameId: 'Here', x: 100, y: 100, visited: true },
      { id: 1, nameId: 'Close', x: 104, y: 100, visited: true },
      { id: 2, nameId: 'Fresh', x: 100, y: 106, visited: false },
      { id: 3, nameId: 'Known', x: 112, y: 100, visited: true },
      { id: 4, nameId: 'Unknown', x: 100, y: 113, visited: false },
      { id: 5, nameId: 'Far', x: 160, y: 100, visited: false },
    ],
  };
}

/** Every glyph on the drawing, without the frame around it. */
function glyphs(drawn) {
  return drawn
    .split('\n')
    .filter((line) => line.startsWith('│'))
    .join('')
    .split('')
    .filter((char) => char !== '│' && char !== ' ');
}

test('a full tank draws what it reaches and what it does not', () => {
  const marks = glyphs(chart(engine, galaxy(10)));

  assert.equal(marks.filter((mark) => mark === '@').length, 1, 'the ship is not on its own chart');
  assert.equal(marks.filter((mark) => mark === 'O').length, 1, 'Close is not drawn as visited and in range');
  assert.equal(marks.filter((mark) => mark === 'o').length, 1, 'Fresh is not drawn as in range');
  // Known and Unknown are past the tank but inside the window: a route is
  // planned through stars the fuel does not reach yet.
  assert.equal(marks.filter((mark) => mark === '.').length, 1, 'Known is not drawn as seen and out of range');
  assert.equal(marks.filter((mark) => mark === '·').length, 1, 'Unknown was left off for never having been visited');
  // Far is sixty parsecs out. The chart is the neighbourhood, not the galaxy.
  assert.equal(marks.length, 5, 'something outside the window was drawn');
});

test('an empty tank draws the same stars, and none of them as reachable', () => {
  const marks = glyphs(chart(engine, galaxy(0)));

  assert.equal(marks.length, 5, 'the chart emptied out with the tank');
  assert.equal(marks.filter((mark) => mark === '@').length, 1);
  assert.equal(marks.filter((mark) => mark === 'O' || mark === 'o').length, 0, 'a jump the fuel will not make is drawn as one');
  assert.equal(marks.filter((mark) => mark === '.').length, 2, 'Close and Known are not both drawn as seen');
  assert.equal(marks.filter((mark) => mark === '·').length, 2, 'Fresh and Unknown are not both drawn as unknown');
});

test('the legend names every glyph the chart can draw', () => {
  const drawn = chart(engine, galaxy(4));
  const legend = drawn.split('\n').at(-1);
  for (const mark of new Set(glyphs(drawn))) {
    assert.ok(legend.includes(mark), `the legend does not say what "${mark}" means`);
  }
});
