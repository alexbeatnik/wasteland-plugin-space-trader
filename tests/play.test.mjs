/**
 * The plugin, driven the way the host drives it.
 *
 * `activate` is called with the same shape the app hands a plugin — a store, a
 * state document, an `action` registry — and the handlers are then run directly.
 * That is the whole contract, so a test that holds it exercises everything
 * except the IPC, and it runs in plain Node with no Electron and no window.
 *
 * The engine is the real one. Stubbing it would leave the interesting half of
 * this plugin untested: nearly every bug found while writing it was a
 * disagreement with the engine about the shape of an answer, not a mistake in
 * the text.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { activate } from '../plugins/space-trader/main.mjs';

/** Everything `ctx` is, and nothing the plugin is not entitled to. */
function harness({ settings = {} } = {}) {
  const actions = new Map();
  const logged = [];
  let prompt = '';
  let context = null;
  let document = {};

  const ctx = {
    id: 'space-trader',
    apiVersion: 5,
    service: (name) => {
      throw new Error(`no service "${name}" was declared`);
    },
    action: ({ type, run, choose }) => actions.set(type, { run, choose }),
    prompt: (text) => {
      prompt = text;
    },
    context: (fn) => {
      context = fn;
    },
    onTurnStart: () => {},
    onSettingsChanged: () => {},
    store: {
      get: (key, fallback = '') => settings[key] ?? fallback,
      all: () => ({ ...settings }),
    },
    state: {
      get: () => document,
      set: (value) => {
        // The real store refuses anything that is not a plain object, and
        // pretty-prints what it is given. Both are worth holding to here: the
        // size ceiling is the reason the save is a string in the first place.
        assert.equal(typeof value, 'object');
        document = value;
      },
    },
    dataDir: () => '.',
    log: (text) => logged.push(text),
    progress: () => {},
  };

  activate(ctx);
  return {
    actions,
    logged,
    get prompt() {
      return prompt;
    },
    get context() {
      return context;
    },
    get document() {
      return document;
    },
    show: (steps) => actions.get('space_trader').run(steps, {}),
    move: (steps) => actions.get('space_trader_move').run(steps, {}),
    click: (id) => actions.get('space_trader').choose(id, {}),
  };
}

/** A game in progress, which almost every test below needs. */
async function started() {
  const app = harness({ settings: { commander: 'Jameson' } });
  await app.show('new');
  return app;
}

test('both actions are registered, and nothing else is', async () => {
  const app = harness();
  assert.deepEqual([...app.actions.keys()].sort(), ['space_trader', 'space_trader_move']);
});

test('the prompt names the refusal it exists to prevent', () => {
  const app = harness();
  // Not decoration. A model holding a game action still answers "I can't play
  // games" unless the fragment says in words that the refusal is wrong here.
  assert.match(app.prompt, /can't play games/i);
  assert.match(app.prompt, /space_trader_move/);
});

test('the prompt forbids the model making moves of its own', () => {
  const app = harness();
  // The whole design decision, in the one place the model will read it.
  assert.match(app.prompt, /ONLY when the user named that move/);
  assert.match(app.prompt, /never buy, sell, jump or refuel because it looked like the right play/);
});

test('nothing is drawn and no game is started before there is one', async () => {
  const app = harness();
  const result = await app.show('status');
  assert.equal(result.ok, false);
  assert.match(result.summary, /No game is saved/);
  // The refusal has to stop the model from "helpfully" starting one.
  assert.match(result.feedback, /do not start it yourself/);
  assert.deepEqual(app.document, {});
});

test('a new game starts at a system with a ship and a thousand credits', async () => {
  const app = await started();
  const state = JSON.parse(app.document.save);
  assert.equal(state.credits, 1000);
  assert.equal(state.ship.type, 'flea');
  assert.equal(state.commanderName, 'Jameson');
  assert.equal(state.day, 1);
  assert.equal(state.systems.length, 140);
});

test('the save is a string, because the store pretty-prints what it holds', async () => {
  const app = await started();
  assert.equal(typeof app.document.save, 'string');
  // The number that matters: the real store refuses more than 1 MB, and the
  // same galaxy handed over as an object indents to over 400 KB of it.
  const stored = JSON.stringify(app.document, null, 2);
  assert.ok(Buffer.byteLength(stored, 'utf8') < 400 * 1024, `save is ${Buffer.byteLength(stored, 'utf8')} bytes`);
});

test('the status screen says where the ship is and what it holds', async () => {
  const app = await started();
  const result = await app.show('status');
  assert.equal(result.ok, true);
  assert.match(result.summary, /Jameson — day 1/);
  assert.match(result.summary, /docked at /);
  assert.match(result.summary, /fuel\s+\[#+\.*\]/);
});

test('the market screen is a table with a price column', async () => {
  const app = await started();
  const result = await app.show('market');
  assert.match(result.summary, /MARKET — /);
  assert.match(result.summary, /COMMODITY\s+AVAIL\s+BUY\s+SELL\s+HOLD/);
  assert.match(result.summary, /hold 0\//);
});

test('the chart draws a field and offers every target as a button', async () => {
  const app = await started();
  const result = await app.show('chart');
  assert.match(result.summary, /CHART — from /);
  // The ship is always at the centre of its own chart.
  assert.ok(result.summary.includes('@'), 'the chart does not draw the ship');
  assert.ok(result.choices.length > 0, 'nothing was in range on turn one');
  for (const choice of result.choices) {
    assert.match(choice.id, /^warp:\d+$/);
    assert.match(choice.label, /^Warp to /);
    assert.match(choice.note, /fuel/);
  }
});

test('a chart is drawn as a box of the width it claims', async () => {
  const app = await started();
  const result = await app.show('chart');
  const framed = result.summary.split('\n').filter((line) => line.startsWith('│'));
  assert.ok(framed.length > 5);
  const widths = new Set(framed.map((line) => line.length));
  assert.equal(widths.size, 1, 'the chart rows are not all the same width');
});

test('buying moves goods into the hold and credits out of the account', async () => {
  const app = await started();
  const before = JSON.parse(app.document.save);
  const good = Object.keys(before.ship.cargo).find((id) => (before.systems[before.currentSystem].buyPrice?.[id] ?? 0) > 0);

  const result = await app.move(`buy 3 ${good}`);
  assert.equal(result.ok, true);
  const after = JSON.parse(app.document.save);
  assert.equal(after.ship.cargo[good], 3);
  assert.ok(after.credits < before.credits);
  // The model is told the position again, so its next answer is about the new one.
  assert.match(result.feedback, /SPACE TRADER/);
  assert.match(result.feedback, /Carrying:/);
});

test('selling what is not aboard is refused in words, not thrown', async () => {
  const app = await started();
  const result = await app.move('sell 5 robots');
  assert.equal(result.ok, false);
  assert.match(result.feedback, /refused/);
  assert.match(result.feedback, /do not retry it/);
});

test('a commodity that does not exist is named as the problem', async () => {
  const app = await started();
  const result = await app.move('buy 5 dilithium');
  assert.equal(result.ok, false);
  assert.match(result.summary, /"dilithium" is not a commodity/);
});

test('"sell all" reads the amount off the hold', async () => {
  const app = await started();
  const state = JSON.parse(app.document.save);
  const sys = state.systems[state.currentSystem];
  const good = Object.keys(sys.buyPrice ?? {}).find((id) => sys.buyPrice[id] > 0 && sys.sellPrice[id] > 0);

  await app.move(`buy 4 ${good}`);
  const result = await app.move(`sell all ${good}`);
  assert.equal(result.ok, true);
  assert.equal(JSON.parse(app.document.save).ship.cargo[good], 0);
});

test('a jump spends fuel and arrives somewhere else', async () => {
  const app = await started();
  const before = JSON.parse(app.document.save);
  const chart = await app.show('chart');
  const target = Number(chart.choices[0].id.split(':')[1]);

  const result = await app.move(`warp ${before.systems[target].nameId}`);
  assert.equal(result.ok, true);
  const after = JSON.parse(app.document.save);
  assert.notEqual(after.currentSystem, before.currentSystem);
  assert.ok(after.ship.fuel < before.ship.fuel, 'the jump cost no fuel');
  assert.match(result.summary, /Arrived at /);
});

test('a system nobody has heard of is refused with its name in the sentence', async () => {
  const app = await started();
  const result = await app.move('warp Vogsphere');
  assert.equal(result.ok, false);
  assert.match(result.summary, /no system called "Vogsphere"/);
});

test('a warp button does the jump and reports it in one line', async () => {
  const app = await started();
  const chart = await app.show('chart');
  const line = await app.click(chart.choices[0].id);
  // A click has only the status bar, so what it says has to fit on it.
  assert.match(line, /^Arrived at /);
  assert.ok(line.length < 120, `too long for a status line: ${line.length}`);
});

test('a button from a game that is gone is refused rather than obeyed', async () => {
  const app = harness();
  await assert.rejects(() => app.click('warp:3'), /no game running/i);
});

test('an unknown button is refused too', async () => {
  const app = await started();
  await assert.rejects(() => app.click('selfdestruct:1'), /older game/);
});

test('refuelling a full tank is refused without spending anything', async () => {
  const app = await started();
  const before = JSON.parse(app.document.save).credits;
  const result = await app.move('refuel');
  assert.equal(result.ok, false);
  assert.equal(JSON.parse(app.document.save).credits, before);
});

test('a move nobody has heard of names the moves that exist', async () => {
  const app = await started();
  const result = await app.move('mine the asteroid belt');
  assert.equal(result.ok, false);
  assert.match(result.summary, /buy, sell, warp, refuel and repair/);
});

test('the per-turn context is empty until a game exists, and terse afterwards', async () => {
  const app = harness();
  assert.equal(await app.context(), '');

  await app.show('new');
  const briefing = await app.context();
  assert.match(briefing, /SPACE TRADER — a game is in progress/);
  assert.match(briefing, /Docked at /);
  assert.match(briefing, /In range: /);
  // This is re-sent on every turn of every conversation and counted against the
  // window, including conversations that have nothing to do with the game.
  assert.ok(briefing.split('\n').length <= 8, 'the briefing has grown into a screen');
  assert.ok(briefing.length < 500, `the briefing is ${briefing.length} characters`);
});

test('a save that cannot be parsed is reported, not thrown at the turn', async () => {
  const app = await started();
  app.document.save = '{ this is not json';
  const result = await app.show('status');
  assert.equal(result.ok, false);
  assert.match(app.logged.join('\n'), /could not be read/);
});

test('Ukrainian is a setting, and the screens answer in it', async () => {
  const app = harness({ settings: { language: 'uk', commander: 'Джеймсон' } });
  await app.show('new');
  const result = await app.show('market');
  // The engine's own dictionary, not a second translation kept here.
  assert.match(result.summary, /[а-яїієґ]/i, 'nothing on the market screen is in Ukrainian');
});
