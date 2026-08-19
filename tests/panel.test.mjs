/**
 * The panel, driven the way a person drives it.
 *
 * `activate` is called with the same shape the app hands a plugin, including a
 * `scene` service that records what was drawn and hands back what `act`
 * returned. That is the whole contract, so a test that holds it exercises
 * everything except the IPC and the pixels.
 *
 * The engine is the real one, and the galaxy is generated afresh for every run,
 * so nothing here may assume a particular system, price or distance. What it
 * asserts is the shape of the answer and the rules the panel is supposed to
 * hold — which is what actually breaks.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { activate } from '../plugins/space-trader/main.mjs';

/** Everything `ctx` is, with a panel on the end of it. */
function harness({ settings = {}, document = {} } = {}) {
  const actions = new Map();
  const logged = [];
  let doc = document;
  let drawn = null;
  let presenter = null;
  let changed = null;

  const scene = {
    show: (value) => {
      drawn = value;
    },
    clear: () => {
      drawn = null;
    },
    present: (value) => {
      presenter = value;
    },
  };

  const ctx = {
    id: 'space-trader',
    service: (name) => {
      if (name === 'scene') return scene;
      throw new Error(`no service "${name}" was declared`);
    },
    action: ({ type, run, choose }) => actions.set(type, { run, choose }),
    prompt: () => {},
    context: (fn) => {
      ctx._context = fn;
    },
    onSettingsChanged: (fn) => {
      changed = fn;
    },
    store: { get: (key, fallback = '') => settings[key] ?? fallback },
    state: {
      get: () => doc,
      set: (value) => {
        assert.equal(typeof value, 'object');
        doc = value;
      },
    },
    dataDir: () => '.',
    log: (text) => logged.push(text),
    progress: () => {},
  };

  activate(ctx);
  return {
    logged,
    settings,
    get drawn() {
      return drawn;
    },
    get document() {
      return doc;
    },
    get game() {
      return doc.save ? JSON.parse(doc.save) : null;
    },
    /** Put a changed game back where the plugin will read it. */
    rewrite(state) {
      doc = { ...doc, save: JSON.stringify(state) };
    },
    /** Put anything else in the document — a fight, a flag — from outside. */
    patch(extra) {
      doc = { ...doc, ...extra };
    },
    show: (steps) => actions.get('space_trader').run(steps, {}),
    move: (steps) => actions.get('space_trader_move').run(steps, {}),
    act: (id, value) => presenter.act(id, value),
    context: () => ctx._context(),
    settingsChanged: () => changed?.('language'),
    /** Let the activation's own repaint finish. */
    settle: () => new Promise((resolve) => setImmediate(resolve)),
  };
}

/** A game in progress, made the way the panel makes one. */
async function flying(options = {}) {
  const app = harness(options);
  await app.show('new game');
  await app.act('background-trader');
  await app.act('name', 'Jameson');
  return app;
}

/** The first row in a group, or nothing. */
function rowIn(app, label) {
  return app.drawn.groups.find((group) => group.label === label)?.items ?? [];
}

test('nothing is drawn before there is a game', async () => {
  const app = harness();
  await app.settle();
  assert.equal(app.drawn, null);
  // Clearing is not scoped to whoever painted last, so a plugin with nothing to
  // show must show nothing rather than take the screen to say so.
  assert.deepEqual(app.document, {});
});

test('a new game asks who is flying, on cards', async () => {
  const app = harness();
  const result = await app.show('new game');
  assert.equal(result.ok, true);
  assert.ok(app.drawn.cards, 'no cards were dealt');
  assert.equal(app.drawn.cards.items.length, 5);
  for (const card of app.drawn.cards.items) {
    assert.match(card.action, /^background-/);
    // The numbers are read out of the table itself, so a description cannot
    // drift away from what the run actually starts with.
    if (card.action !== 'background-random') assert.match(card.note, /pilot \d/);
  }
  // The model is told to leave it alone: a background cannot be chosen by
  // typing, so a model that answers the question answers nothing.
  assert.match(result.feedback, /Do not choose for them/);
  assert.equal(app.game, null);
});

test('the background is answered by pressing, and the name by typing into the game\'s own field', async () => {
  const app = harness();
  await app.show('new game');

  const chosen = await app.act('background-pilot');
  assert.equal(chosen.entry, true, 'the field was not opened for them');
  assert.equal(app.drawn.entry.action, 'name');
  assert.equal(app.game, null, 'a commander was made before there was a name');

  const made = await app.act('name', 'Jameson');
  // A cue rather than a move: the run exists, nothing has happened in it, and
  // the only thing left is for the model to introduce it.
  assert.equal(made.submit, 'the launch');
  assert.equal(app.game.commanderName, 'Jameson');
  assert.equal(app.game.skills.pilot, 9);
});

test('a name typed with the request is kept for the field', async () => {
  const app = harness();
  await app.show('new game Aurora');
  assert.equal(app.document.setup.name, 'Aurora');
  await app.act('background-trader');
  // Typed at the composer rather than into the field: both ways in, one run.
  await app.show('Aurora');
  assert.equal(app.game.commanderName, 'Aurora');
});

test('an empty field opens itself again rather than making a nameless commander', async () => {
  const app = harness();
  await app.show('new game');
  await app.act('background-trader');
  const answered = await app.act('name', '   ');
  assert.equal(answered.entry, true);
  assert.equal(app.game, null);
});

test('the panel is built out of the save', async () => {
  const app = await flying();
  const state = app.game;
  const panel = app.drawn;

  assert.ok(panel.title.includes('Jameson'));
  assert.ok(panel.title.includes(state.systems[state.currentSystem].nameId));
  assert.match(panel.subtitle, /day 1/);

  const hull = panel.meters.find((meter) => meter.accent === 'life');
  assert.equal(hull.value, state.ship.hull);
  assert.ok(hull.max > 0);
  const fuel = panel.meters.find((meter) => meter.accent === 'vigour');
  assert.equal(fuel.value, state.ship.fuel);
  // The day has no maximum, because a run has no last day: drawn as a number.
  const day = panel.meters.find((meter) => meter.accent === 'time');
  assert.equal(day.value, 1);
  assert.equal(day.max, undefined);

  const credits = panel.fields.find((field) => field.label === 'CREDITS');
  assert.equal(credits.value, '1,000 cr');
});

test('every accent is one the app has a colour for', async () => {
  const app = await flying();
  for (const meter of app.drawn.meters) {
    assert.ok(['life', 'mana', 'vigour', 'growth', 'time'].includes(meter.accent), `"${meter.accent}" is not an accent`);
  }
  for (const tag of app.drawn.tags) assert.ok(['good', 'warn', 'bad', ''].includes(tag.tone ?? ''));
});

test('the row of moves is what can be done from here, and nothing else', async () => {
  const app = await flying();
  const ids = app.drawn.actions.map((move) => move.id);
  assert.deepEqual(ids, ['market', 'chart', 'ship', 'jobs', 'news', 'restart', 'quit']);
  // A full tank has nothing to refuel, and a button that answers "the tank is
  // already full" is a button that should not have been drawn.
  assert.ok(!ids.includes('refuel'));
  // The app gives the first nine a digit by position, so a row that grows past
  // that loses its hotkeys silently.
  assert.ok(app.drawn.actions.length <= 9, 'the row has outgrown its hotkeys');
});

test('refuel appears when the tank is short, and fills it without a turn', async () => {
  const app = await flying();
  const state = app.game;
  state.ship.fuel = 4;
  app.rewrite(state);
  await app.act('market');

  const refuel = app.drawn.actions.find((move) => move.id === 'refuel');
  assert.ok(refuel, 'nothing offered to refuel a half-empty tank');
  assert.match(refuel.hint, /\d+ parsecs at \d+ cr each/);

  const pressed = await app.act('refuel');
  // The words go into the conversation so the transcript reads as though they
  // had been typed — but the move has already been made here.
  assert.equal(pressed.submit, 'refuel');
  assert.ok(app.game.ship.fuel > 4);
  assert.ok(app.game.credits < 1000);
});

test('a move a press already made is not made twice', async () => {
  const app = await flying();
  // Past the opening, so this is an ordinary turn rather than the first one.
  await app.show('the launch');
  const state = app.game;
  state.ship.fuel = 4;
  app.rewrite(state);
  await app.act('refuel');
  const fuelled = app.game.ship.fuel;
  const spent = app.game.credits;

  // The model relays the words, as it would a typed move.
  const result = await app.move('refuel');
  assert.equal(result.ok, true);
  assert.equal(app.game.ship.fuel, fuelled, 'the tank was filled twice');
  assert.equal(app.game.credits, spent);
  assert.match(result.feedback, /Do not make another move/);
});

test('a commodity row opens the field with the price and the ceiling already worked out', async () => {
  const app = await flying();
  const forSale = rowIn(app, 'ON SALE HERE');
  assert.ok(forSale.length > 0, 'nothing is for sale anywhere');
  const good = forSale[0].action.slice('buy-'.length);

  const pressed = await app.act(forSale[0].action);
  assert.equal(pressed.entry, true);
  assert.equal(app.drawn.entry.action, 'amount');
  assert.match(app.drawn.entry.label, /\d+ cr each, \d+ affordable/);
  // Nothing is bought by pressing the row. A trade is a number, and the row
  // cannot ask for one.
  assert.equal(app.game.ship.cargo[good], 0);
});

test('the field is what buys, and it buys exactly what it was told', async () => {
  const app = await flying();
  const row = rowIn(app, 'ON SALE HERE')[0];
  const good = row.action.slice('buy-'.length);
  const before = app.game.credits;

  await app.act(row.action);
  const done = await app.act('amount', '2');
  assert.equal(app.game.ship.cargo[good], 2);
  assert.ok(app.game.credits < before);
  assert.match(done.submit, /^buy 2 /);
});

test('an empty field means as many as possible, and never more', async () => {
  const app = await flying();
  const row = rowIn(app, 'ON SALE HERE')[0];
  const good = row.action.slice('buy-'.length);

  await app.act(row.action);
  await app.act('amount', '');
  const state = app.game;
  assert.ok(state.ship.cargo[good] > 0);
  assert.ok(state.credits >= 0, 'the hold was filled on credit');
  assert.ok(state.ship.cargo[good] <= 10, 'more was bought than the Flea can carry');
});

test('a number larger than the ceiling is capped rather than refused', async () => {
  const app = await flying();
  const row = rowIn(app, 'ON SALE HERE')[0];
  const good = row.action.slice('buy-'.length);

  await app.act(row.action);
  await app.act('amount', '9999');
  assert.ok(app.game.ship.cargo[good] > 0);
  assert.ok(app.game.credits >= 0);
});

test('what is in the hold is a row that sells it', async () => {
  const app = await flying();
  const row = rowIn(app, 'ON SALE HERE')[0];
  const good = row.action.slice('buy-'.length);
  await app.act(row.action);
  await app.act('amount', '2');
  await app.act('market');

  const held = rowIn(app, 'IN THE HOLD');
  assert.equal(held.length, 1);
  assert.match(held[0].note, /2 aboard/);
  // Selling where nobody is buying is not offered at all.
  if (held[0].action) {
    await app.act(held[0].action);
    await app.act('amount', '');
    assert.equal(app.game.ship.cargo[good], 0);
  }
});

test('a row from a hold emptied three turns ago is refused in words', async () => {
  const app = await flying();
  const state = app.game;
  const good = Object.keys(state.ship.cargo)[0];
  const answered = await app.act(`sell-${good}`);
  assert.match(answered.status, /none of that aboard/i);
});

test('the chart is a board, and only what the tank reaches is pressable', async () => {
  const app = await flying();
  const board = app.drawn.board;
  const state = app.game;

  assert.ok(board.points.length >= 2, 'the chart drew nothing to fly to');
  assert.ok(board.points.length <= 24, 'the board is over the host\'s ceiling');
  const here = board.points.find((point) => point.here);
  assert.equal(here.label, state.systems[state.currentSystem].nameId);
  assert.equal(here.action, '', 'the system you are in is offered as a destination');
  assert.equal(here.x, 50);
  assert.equal(here.y, 50);

  for (const point of board.points) {
    assert.ok(point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100, 'a marker is off the board');
    if (point.action) assert.match(point.action, /^warp-\d+$/);
  }
  // A road to nowhere is a line drawn off the edge.
  const ids = new Set(board.points.map((point) => point.id));
  for (const link of board.links) {
    assert.ok(ids.has(link.from) && ids.has(link.to));
  }
});

test('pressing a system makes the jump, and the panel moves with the ship', async () => {
  const app = await flying();
  const before = app.game;
  const target = app.drawn.board.points.find((point) => point.action);

  const jumped = await app.act(target.action);
  const after = app.game;
  assert.notEqual(after.currentSystem, before.currentSystem);
  assert.ok(after.ship.fuel < before.ship.fuel, 'the jump cost no fuel');

  if (app.document.fight) {
    // Intercepted on the way. The panel is a fight now, and nothing is sent to
    // the model — see tests/fight.test.mjs.
    assert.equal(jumped.submit ?? '', '');
    return;
  }
  assert.match(jumped.submit, /^warp /);
  assert.ok(app.drawn.title.includes(target.label));
  // Whatever happened on the way is kept for the model to report, not thrown
  // away with the arrival line.
  assert.ok(app.document.narrate.length > 0);
});

test('a system the run has since flown out of range of is refused, not obeyed', async () => {
  const app = await flying();
  const state = app.game;
  const target = app.drawn.board.points.find((point) => point.action);
  state.ship.fuel = 0;
  app.rewrite(state);

  const answered = await app.act(target.action);
  assert.match(answered.status, /will not reach/i);
  assert.equal(app.game.currentSystem, state.currentSystem);
});

test('the sheet swaps one list for another, and costs nothing', async () => {
  const app = await flying();
  const before = app.game.day;

  for (const [door, labels] of [
    ['ship', ['THE SHIP', 'ABOARD']],
    ['jobs', ['CONTRACTS', 'THE JOB BOARD']],
    ['news', ['REPORTED HERE', 'THE LOG']],
    ['market', ['ON SALE HERE', 'IN THE HOLD']],
  ]) {
    const answered = await app.act(door);
    assert.equal(answered.sheet, true, `${door} did not open the sheet`);
    assert.deepEqual(app.drawn.groups.map((group) => group.label), labels);
    // Opening a list is not an attempt at anything: no submitted words, so no
    // turn and no tokens.
    assert.equal(answered.submit ?? '', '');
  }
  assert.equal(app.game.day, before);
});

test('an empty list carries the plugin\'s own words for being empty', async () => {
  const app = await flying();
  await app.act('ship');
  const crew = app.drawn.groups.find((group) => group.label === 'ABOARD');
  assert.equal(crew.items.length, 0);
  assert.equal(crew.empty, 'flying alone');
});

test('a news item too long for a row is cut where a reader would cut it', async () => {
  // The host trims a note to its own limit, which lands mid-word: one body
  // ended "though the miners are not celebratin". The whole item is on the
  // printed NEWS screen, which has no ceiling.
  const app = await flying();
  const state = app.game;
  state.systems[state.currentSystem].news = [
    { id: 'coldSnap', headlineKey: 'news.coldSnap.headline', bodyKey: 'news.coldSnap.body', tone: 'bad' },
    { id: 'oreBoom', headlineKey: 'news.oreBoom.headline', bodyKey: 'news.oreBoom.body', tone: 'good' },
  ];
  app.rewrite(state);
  await app.act('news');

  for (const row of rowIn(app, 'REPORTED HERE')) {
    assert.ok(row.note.length <= 120, `a note of ${row.note.length} characters will be cut by the host`);
    if (row.note.endsWith('…')) assert.doesNotMatch(row.note, /\s…$/, 'cut after a space');
  }
});

test('the job board is reachable, and pressing an offer takes it on', async () => {
  const app = await flying();
  // The starting system has no board — it is generated on arrival — so this
  // flies one hop to find one.
  const target = app.drawn.board.points.find((point) => point.action);
  await app.act(target.action);
  await app.act('jobs');

  const offers = rowIn(app, 'THE JOB BOARD').filter((row) => row.action);
  if (!offers.length) return; // a port with nothing on offer is an ordinary port
  const taken = await app.act(offers[0].action);
  assert.equal(taken.sheet, true);
  assert.ok(app.game.quests.some((quest) => quest.status === 'active'), 'the contract was not taken on');
  assert.match(taken.status, /\d/);
});

test('NEW GAME asks twice while the commander is still flying', async () => {
  const app = await flying();
  const first = await app.act('restart');
  assert.match(first.status, /Press again/);
  assert.ok(app.game, 'the run was thrown away on the first press');

  const second = await app.act('restart');
  assert.equal(second.cards, true);
  assert.equal(app.game, null);
  assert.deepEqual(app.document, { setup: {} });
});

test('anything else disarms NEW GAME', async () => {
  const app = await flying();
  await app.act('restart');
  await app.act('ship');
  const again = await app.act('restart');
  assert.match(again.status, /Press again/, 'the second press went through after a detour');
  assert.ok(app.game);
});

test('CLOSE puts the game away and keeps it', async () => {
  const app = await flying();
  const day = app.game.day;

  const closed = await app.act('quit');
  assert.match(closed.status, /Jameson/);
  assert.equal(app.drawn, null, 'the panel stayed up after the game was closed');
  assert.equal(app.document.closed, true);
  // A door, not a demolition.
  assert.equal(JSON.parse(app.document.save).day, day);

  // And the model is told the world is gone, rather than told nothing: a model
  // given nothing carries on from the transcript.
  const fragment = await app.context();
  assert.match(fragment, /has been put away/);
  assert.match(fragment, /resume the game/);

  const back = await app.show('resume the game');
  assert.equal(back.ok, true);
  assert.ok(app.drawn, 'the panel did not come back');
  assert.equal(app.game.day, day);
});

test('closing and restarting are the player\'s, and the model is refused', async () => {
  const app = await flying();
  const closing = await app.show('close the game');
  assert.equal(closing.ok, false);
  assert.match(closing.feedback, /CLOSE button/);
  assert.ok(app.game, 'a model closed the game');

  const restarting = await app.show('start a new game');
  assert.equal(restarting.ok, false);
  assert.match(restarting.feedback, /NEW GAME button/);
  assert.ok(app.game, 'a model threw the run away');
});

test('a wrecked ship leaves two moves and says which one it is', async () => {
  const app = await flying();
  const state = app.game;
  state.ship.hull = 0;
  app.rewrite(state);
  await app.act('market');

  assert.deepEqual(app.drawn.actions.map((move) => move.id), ['restart', 'quit']);
  assert.ok(app.drawn.tags.some((tag) => tag.label === 'LOST'));
  assert.match(app.drawn.subtitle, /was lost at /);
  // Nothing to lose, so the confirmation is not asked for.
  const again = await app.act('restart');
  assert.equal(again.cards, true);
});

test('the panel and the briefing describe the same run', async () => {
  const app = await flying();
  const state = app.game;
  const fragment = await app.context();
  assert.ok(fragment.includes(state.systems[state.currentSystem].nameId));
  assert.ok(app.drawn.title.includes(state.systems[state.currentSystem].nameId));
  assert.ok(fragment.includes(`day ${state.day}`));
});

test('a language changed redraws the panel without a turn', async () => {
  const app = await flying({ settings: { language: 'en' } });
  assert.equal(app.drawn.meters[0].label, 'HULL');
  app.settings.language = 'uk';
  await app.settingsChanged();
  assert.equal(app.drawn.meters[0].label, 'КОРПУС');
  assert.equal(app.drawn.actions[0].label, 'РИНОК');
});

test('a Ukrainian game is Ukrainian on both halves of the screen', async () => {
  const app = await flying({ settings: { language: 'uk' } });
  // The commodity names come from the game's own dictionary and the labels
  // around them from the plugin's. Before they were split, one of the two was
  // always English.
  assert.match(app.drawn.groups[0].label, /[а-яїієґ]/i);
  assert.match(app.drawn.groups[0].items[0].label, /[а-яїієґ]/i);
  assert.match(app.drawn.groups[0].items[0].note, /натисніть/);
});

test('an action id nobody drew is refused rather than obeyed', async () => {
  const app = await flying();
  const answered = await app.act('self-destruct');
  assert.match(answered.status, /no longer on the row/i);
});

test('a saved run is drawn again when the plugin comes back', async () => {
  const app = await flying();
  const document = app.document;
  const again = harness({ document });
  await again.settle();
  assert.ok(again.drawn, 'the panel did not come back after a restart');
  assert.ok(again.drawn.title.includes('Jameson'));
});

test('a game closed yesterday does not come back on screen by itself', async () => {
  const app = await flying();
  await app.act('quit');
  const again = harness({ document: app.document });
  await again.settle();
  assert.equal(again.drawn, null);
});
