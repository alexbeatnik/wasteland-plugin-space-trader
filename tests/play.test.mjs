/**
 * The plugin, played by typing.
 *
 * `activate` is called with the same shape the app hands a plugin — a store, a
 * state document, an `action` registry — and the handlers are then run directly.
 * That is the whole contract, so a test that holds it exercises everything
 * except the IPC, and it runs in plain Node with no Electron and no window.
 *
 * Deliberately *without* the panel. `tests/panel.test.mjs` covers the scene, and
 * the point of this file is the half of the game that has to keep working when
 * there is no scene at all: every screen and every move reachable by typing a
 * sentence, exactly as before there were buttons. The host this plugin declares
 * always has one, so that branch is a fallback rather than a supported
 * configuration — but a fallback nobody tests is a fallback that is broken.
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
    apiVersion: 11,
    // No panel here, on purpose. See the note at the top of the file.
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
  const app = harness();
  // With no panel there are no cards to press, so the run is made at once
  // rather than on a question that could never be answered.
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

test("the prompt says the panel is the user's, not a thing to recite", () => {
  // The opposite of the mistake it used to prevent. There were no controls at
  // all, and the model invented a "Show Market" button; now there is a row of
  // them, and the failure to guard against is a model reciting a row it cannot
  // see — "press 2" when 2 is something else this turn.
  const app = harness();
  assert.match(app.prompt, /never name a button/);
  assert.match(app.prompt, /Everything on\nthe row can also be typed/);
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
  const after = JSON.parse(app.document.save);
  // A pirate can end a Flea on its first jump, and that is a real outcome
  // rather than a failed move: the turn is `ok: false` only because the game is
  // over. Everything else about the jump has to be true either way.
  assert.equal(result.ok, after.ship.hull > 0);
  assert.notEqual(after.currentSystem, before.currentSystem);
  assert.ok(after.ship.fuel < before.ship.fuel, 'the jump cost no fuel');
  assert.match(result.summary, /Arrived at /);
});

test('what happened on the way is reported, not just that it happened', async () => {
  // Reported from a real game: "Arrived at Hesperia, 2 met on the way" was the
  // entire account of two gunfights. The log was being built and thrown away,
  // so whatever they cost showed up only as a number quietly missing from the
  // hull. Fought and unreported is worse than not fought.
  //
  // With no panel there is nobody to press the moves, so the exchange resolves
  // under the posture from the settings and the whole of it comes back at once.
  let sawOne = false;

  // Three runs of twenty jumps rather than one of twenty-five: a run can end
  // stranded with no credits for fuel, or in a wreck, and neither of those is
  // evidence about reporting. A galaxy that produced no encounter at all in
  // sixty jumps would be a different bug.
  for (let attempt = 0; attempt < 3 && !sawOne; attempt += 1) {
    const app = await started();
    for (let hop = 0; hop < 20 && !sawOne; hop += 1) {
      if (JSON.parse(app.document.save).ship.hull <= 0) break;
      const chart = await app.show('chart');
      if (!chart.choices?.length) {
        const refuelled = await app.move('refuel');
        if (!refuelled.ok) break;
        continue;
      }
      const name = JSON.parse(app.document.save).systems[Number(chart.choices[0].id.split(':')[1])].nameId;
      const result = await app.move(`warp ${name}`);
      const met = /(\d+) met on the way/.exec(result.summary);
      if (!met || Number(met[1]) === 0) continue;

      sawOne = true;
      // Something more than the one-line arrival: whoever was met, and what
      // came of it.
      const above = result.summary.split('Arrived at')[0].trim();
      assert.ok(above.length > 0, `nothing was said about the encounter — ${result.summary}`);
      assert.match(result.feedback, /SPACE TRADER/);
    }
  }
  assert.ok(sawOne, 'no encounter happened in sixty jumps — the test proved nothing');
});

test('the market tells the model what things cost, not only that it is on screen', async () => {
  // Without this the model has the position and no prices, which is the one
  // combination that cannot answer "what should I carry". A real session
  // produced advice to trade a commodity that does not exist in this game.
  const app = await started();
  const result = await app.show('market');
  assert.match(result.feedback, /Prices at /);
  assert.match(result.feedback, /water: /);
  assert.match(result.feedback, /buy \d+ \(\d+ available\)|not sold here/);
});

test('the status screen does not pay for the price list', async () => {
  // The digest is for the turn that asked for the market. Eighteen goods on
  // every screen would be the briefing's mistake made twice.
  const app = await started();
  const result = await app.show('status');
  assert.doesNotMatch(result.feedback, /Prices at /);
});

test('the prompt says fuel is a move and not a commodity', () => {
  // It opened the market and told the user to look for "Fuel" in the commodity
  // table. Fuel is never on it; the planet always sells it through `refuel`.
  const app = harness();
  assert.match(app.prompt, /Fuel and repairs are NOT bought on the market/);
});

test('the prompt sends the model to the market before it advises on trade', () => {
  const app = harness();
  assert.match(app.prompt, /open the market FIRST/);
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
  // The language is told every turn rather than left to the prompt fragment,
  // which is fixed at activation: a language changed mid-session would
  // otherwise not reach the model until a restart.
  assert.match(briefing, /^Answer the user in English\./);
  assert.match(briefing, /SPACE TRADER — a game is in progress/);
  assert.match(briefing, /Docked at /);
  assert.match(briefing, /In range: /);
  // This is re-sent on every turn of every conversation and counted against the
  // window, including conversations that have nothing to do with the game.
  assert.ok(briefing.split('\n').length <= 9, 'the briefing has grown into a screen');
  assert.ok(briefing.length < 500, `the briefing is ${briefing.length} characters`);
});

test('a save that cannot be parsed is reported, not thrown at the turn', async () => {
  const app = await started();
  app.document.save = '{ this is not json';
  const result = await app.show('status');
  assert.equal(result.ok, false);
  assert.match(app.logged.join('\n'), /could not be read/);
});

test('Ukrainian is a setting, and both halves of a screen answer in it', async () => {
  const app = harness({ settings: { language: 'uk' } });
  await app.show('new game Джеймсон');
  const result = await app.show('market');
  // Two dictionaries meet on this screen: the commodity names come from the
  // game's own, bundled with the engine, and the column headings from the
  // plugin's. Until they were split, one of the two was always English.
  assert.match(result.summary, /ТОВАР/, 'the table is still headed in English');
  assert.match(result.summary, /[а-яїієґ]/i, 'nothing on the market screen is in Ukrainian');
  assert.match(result.summary, /РИНОК — /);
});

test('a Ukrainian game understands a move typed in either language', async () => {
  const app = harness({ settings: { language: 'uk' } });
  await app.show('new');
  const state = JSON.parse(app.document.save);
  const good = Object.keys(state.ship.cargo).find((id) => (state.systems[state.currentSystem].buyPrice?.[id] ?? 0) > 0);

  const bought = await app.move(`купити 2 ${good}`);
  assert.equal(bought.ok, true, `купити was not understood: ${bought.summary}`);
  assert.equal(JSON.parse(app.document.save).ship.cargo[good], 2);
  // And English still works, because a model asked to relay a move sometimes
  // translates it on the way through.
  const more = await app.move(`buy 1 ${good}`);
  assert.equal(more.ok, true);
  assert.equal(JSON.parse(app.document.save).ship.cargo[good], 3);
});

test('with no panel a new game is made at once, because there are no cards to press', async () => {
  const app = harness();
  const result = await app.show('new game Aurora');
  assert.equal(result.ok, true);
  assert.equal(JSON.parse(app.document.save).commanderName, 'Aurora');
  // The model is handed the facts to introduce it with, rather than told to
  // introduce something and left to invent what.
  assert.match(result.feedback, /Introduce it in two or three sentences/);
  assert.match(result.feedback, /cargo bays/);
});

test('asking for the news does not start a new game', async () => {
  // `^new` matches "news". The news screen made a commander instead, and every
  // screen after it answered "choose a background".
  const app = await started();
  const before = JSON.parse(app.document.save).seed;
  await app.show('news');
  assert.equal(JSON.parse(app.document.save).seed, before, 'the news started a new game');
});

test('the news screen prints what is being reported, and does not throw on it', async () => {
  // A news item is a headline and a body under two keys, not a message with
  // parameters. Read as a message, the dictionary was called with `undefined`
  // and threw — on the first planet that had any news at all, which is every
  // planet after the first jump.
  const app = await started();
  const state = JSON.parse(app.document.save);
  const sys = state.systems[state.currentSystem];
  sys.news = [{ id: 'coldSnap', headlineKey: 'news.coldSnap.headline', bodyKey: 'news.coldSnap.body', tone: 'bad' }];
  app.document.save = JSON.stringify(state);

  const result = await app.show('news');
  assert.equal(result.ok, true);
  assert.doesNotMatch(result.summary, /undefined/);
  assert.doesNotMatch(result.summary, /news\.coldSnap/);
});
