/**
 * The doors nobody had closed.
 *
 * Every test here is a way the game could be made to do something its own
 * rules forbid, found by playing it at random through the app's real `Scene`
 * and by reading the plugin against the host it is loaded into. None of them
 * was reachable by playing the game the way it is meant to be played, which is
 * why none of them had a test: a wrecked ship has no REPAIR button, a closed
 * game has no market, and a card in the transcript is usually pressed while it
 * is still true.
 *
 * What they have in common is that the panel refused something and another way
 * in did not. The model can call either action with any words at any time, a
 * button under an old card outlives the position it was dealt in, and the app's
 * own buttons in the left panel are pressed with nothing on screen at all.
 */
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import * as engine from '../plugins/space-trader/engine.mjs';
import { activate } from '../plugins/space-trader/main.mjs';

/** Everything `ctx` is, with a panel, a turn counter and a status bar on it. */
function harness({ settings = {}, document = {}, dataDir = mkdtempSync(join(tmpdir(), 'st-guards-')) } = {}) {
  const actions = new Map();
  const said = [];
  let doc = document;
  let drawn = null;
  let presenter = null;
  let prompt = '';
  let turn = () => {};

  const ctx = {
    id: 'space-trader',
    apiVersion: 12,
    service: (name) => {
      if (name !== 'scene') throw new Error(`no service "${name}" was declared`);
      return {
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
    },
    action: ({ type, run, choose }) => actions.set(type, { run, choose }),
    prompt: (text) => {
      prompt = text;
    },
    context: (fn) => {
      ctx._context = fn;
    },
    onTurnStart: (fn) => {
      turn = fn;
    },
    onButton: (fn) => {
      ctx._button = fn;
    },
    onSettingsChanged: () => {},
    store: { get: (key, fallback = '') => settings[key] ?? fallback },
    state: {
      get: () => doc,
      set: (value) => {
        assert.equal(typeof value, 'object');
        doc = value;
      },
    },
    dataDir: () => dataDir,
    log: () => {},
    progress: () => {},
  };

  activate(ctx);
  return {
    dataDir,
    said,
    get prompt() {
      return prompt;
    },
    get drawn() {
      return drawn;
    },
    get document() {
      return doc;
    },
    get game() {
      return doc.save ? JSON.parse(doc.save) : null;
    },
    rewrite(change) {
      const state = JSON.parse(doc.save);
      change(state);
      doc = { ...doc, save: JSON.stringify(state) };
    },
    patch(extra) {
      doc = { ...doc, ...extra };
    },
    /** A message from the user: the app runs the turn hooks once for each. */
    turn: () => turn(),
    show: (steps) => actions.get('space_trader').run(steps, {}),
    move: (steps) => actions.get('space_trader_move').run(steps, {}),
    click: (id) => actions.get('space_trader').choose(id, { status: (text) => said.push(text), log: () => {} }),
    act: (id, value) => presenter.act(id, value),
    press: (key) => ctx._button(key),
    context: () => ctx._context(),
  };
}

/** A game in progress, introduced, with nothing owed to anybody. */
async function flying(options = {}) {
  const app = harness(options);
  await app.press('newGame');
  await app.act('background-trader');
  const made = await app.act('name', 'Jameson');
  // The words the name field sends, relayed the way the model relays them.
  app.turn();
  await app.show(made.submit);
  return app;
}

/** Every id the drawn panel offers, wherever it offers it. */
function offered(scene) {
  return [
    ...(scene?.actions ?? []).map((move) => move.id),
    ...(scene?.groups ?? []).flatMap((group) => group.items.map((item) => item.action)),
    ...(scene?.board?.points ?? []).map((point) => point.action),
    ...(scene?.cards?.items ?? []).map((card) => card.action),
    scene?.entry?.action,
  ].filter(Boolean);
}

/** Every piece of text in a scene, for the things that must never be in one. */
function wording(scene) {
  return JSON.stringify(scene ?? {});
}

/* ---------- a lost ship ---------- */

test('a wrecked ship cannot be repaired back to life by typing', async () => {
  const app = await flying();
  app.rewrite((state) => {
    state.ship.hull = 0;
  });
  const credits = app.game.credits;

  // The engine sells hull plate to anything docked at a yard, and a hull of
  // zero is only a number to it. This mended it to full and the dead commander
  // flew on.
  for (const move of ['repair', 'refuel', 'buy 1 water', 'mine']) {
    const answer = await app.move(move);
    assert.equal(answer.ok, false, `"${move}" was carried out on a wreck`);
    assert.match(answer.feedback, /commander is dead/);
  }
  assert.equal(app.game.ship.hull, 0);
  assert.equal(app.game.credits, credits);
});

test('a wrecked ship keeps its panel and loses its controls', async () => {
  const app = await flying();
  const reach = offered(app.drawn).find((id) => id.startsWith('warp-'));
  assert.ok(reach, 'a new run with nowhere to jump to');
  app.rewrite((state) => {
    state.ship.hull = 0;
  });
  await app.show('status');

  // Still drawn: the last position and the log are what a game-over is read by.
  assert.ok(app.drawn.board.points.length > 1);
  assert.ok(app.drawn.groups.some((group) => group.items.length > 0));
  // And nothing on it is a move. NEW GAME and QUIT are the whole of it.
  assert.deepEqual(offered(app.drawn).sort(), ['quit', 'restart']);

  // A press that was already on its way — the marker was drawn a moment ago.
  const system = app.game.currentSystem;
  const pressed = await app.act(reach);
  assert.equal(pressed.submit ?? '', '');
  assert.equal(app.game.currentSystem, system, 'a dead commander jumped');
  const bought = await app.act('buy-water');
  assert.equal(bought.entry ?? false, false, 'a dead commander was asked how much water');
});

test('the slots are still live on a wreck, because loading is what it is for', async () => {
  const app = await flying();
  await app.press('save');
  await app.act('save-1');
  app.rewrite((state) => {
    state.ship.hull = 0;
  });
  await app.press('load');
  assert.ok(offered(app.drawn).includes('load-1'));
  await app.act('load-1');
  assert.ok(app.game.ship.hull > 0);
});

/* ---------- a game that was put away ---------- */

test('a closed game is not played by typing at it', async () => {
  const app = await flying();
  await app.act('quit');
  const before = app.game;

  const moved = await app.move('buy 1 water');
  assert.equal(moved.ok, false);
  assert.match(moved.feedback, /put away/);
  const looked = await app.show('market');
  assert.equal(looked.ok, false, 'the market of a closed game was printed');
  assert.match(looked.feedback, /resume the game/);

  assert.equal(app.game.credits, before.credits);
  assert.equal(app.game.day, before.day);
  assert.equal(app.document.closed, true);
  // The way back still works, and is the only thing that does.
  const back = await app.show('resume the game');
  assert.equal(back.ok, true);
  assert.equal(app.document.closed, false);
});

/* ---------- a run thrown away by a word ---------- */

test('"new" from the model does not replace a run in progress', async () => {
  // The word the prompt itself teaches for starting a game. Only the longer
  // phrasings were refused, so this one emptied the document mid-run.
  for (const words of ['new', 'new Bob']) {
    const app = await flying();
    const answer = await app.show(words);
    assert.equal(answer.ok, false, `"${words}" was obeyed`);
    assert.match(answer.feedback, /NEW GAME button/);
    assert.ok(app.document.save, `"${words}" threw the run away`);
    assert.equal(app.document.setup, undefined);
  }
});

test('a new game asked for over a closed run keeps it until the name is sent', async () => {
  const app = await flying();
  await app.act('quit');
  const day = app.game.day;

  const asked = await app.show('new game');
  assert.equal(asked.ok, true);
  assert.ok(app.document.setup, 'no question was asked');
  assert.ok(app.document.save, 'the closed run was thrown away before anybody answered');
  // So the card that walks away from the question has somewhere to go.
  assert.ok(offered(app.drawn).includes('setup-cancel'));
  await app.act('setup-cancel');
  assert.equal(app.document.setup, undefined);
  assert.equal(app.game.day, day);
});

/* ---------- an account owed to one turn ---------- */

/** Buy one unit from the panel, the way a press does it. */
async function buyOne(app) {
  const row = offered(app.drawn).find((id) => id.startsWith('buy-'));
  assert.ok(row, 'nothing on sale at the first planet');
  await app.act(row);
  const bought = await app.act('amount', '1');
  assert.ok(bought.submit, 'the purchase sent no words');
  return { good: row.slice('buy-'.length), words: bought.submit };
}

test('the words a press sends are answered with its account, once', async () => {
  const app = await flying();
  const { good, words } = await buyOne(app);
  const held = app.game.ship.cargo[good];

  app.turn();
  const told = await app.move(words);
  assert.equal(told.ok, true);
  assert.match(told.feedback, /The move was made/);
  // Not applied a second time: the press already made it.
  assert.equal(app.game.ship.cargo[good], held);
  assert.equal(app.document.narrate, undefined);
});

test('an account the model never collected does not swallow the next move', async () => {
  const app = await flying();
  const { good } = await buyOne(app);
  const held = app.game.ship.cargo[good];

  // The turn the words started: the model answered them without calling either
  // action, so the account is still in the document.
  app.turn();
  assert.ok(app.document.narrate);

  // And the next thing the player typed. It used to be answered with that
  // account — "Bought 1 × Water" — and never carried out.
  app.turn();
  const answer = await app.move(`buy 2 ${good}`);
  assert.equal(answer.ok, true);
  assert.equal(app.game.ship.cargo[good], held + 2, 'the typed move was swallowed');
  assert.equal(app.document.narrate, undefined);
});

test('an account left over from an earlier session is not read out over a move', async () => {
  const first = await flying();
  const { good } = await buyOne(first);
  const held = first.game.ship.cargo[good];

  // The app was closed before the model answered. The document comes back as
  // it was written, account and all.
  const app = harness({ document: first.document, dataDir: first.dataDir });
  app.turn();
  const answer = await app.move(`buy 1 ${good}`);
  assert.equal(answer.ok, true);
  assert.equal(app.game.ship.cargo[good], held + 1);
});

test('turning a contract in leaves nothing owed to the next turn', async () => {
  const app = await flying();
  app.rewrite((state) => {
    const here = state.currentSystem;
    state.quests = [...(state.quests ?? []), {
      id: 'q-test',
      type: 'relief',
      giverSystem: (here + 1) % state.systems.length,
      targetSystem: here,
      reward: 500,
      status: 'active',
      good: 'water',
      amount: 2,
    }];
    state.ship.cargo.water = 2;
    if (state.sourcedHere) state.sourcedHere.water = 0;
  });
  await app.act('jobs');
  const row = offered(app.drawn).find((id) => id.startsWith('turnin-'));
  assert.ok(row, 'a contract that could be turned in was not offered');

  const credits = app.game.credits;
  const done = await app.act(row);
  assert.ok(app.game.credits > credits, 'the reward was not paid');
  // Nothing is submitted, so no turn is coming to collect an account. It used
  // to be left anyway, and the next move typed was answered with it.
  assert.equal(done.submit ?? '', '');
  assert.equal(app.document.narrate, undefined);

  app.turn();
  const fuel = app.game.ship.fuel;
  const moved = await app.move('refuel');
  assert.doesNotMatch(moved.feedback, /The move was made/);
  assert.ok(moved.ok === false || app.game.ship.fuel > fuel);
});

/* ---------- a button under an old card ---------- */

test('a card in the transcript says what it did on the status bar', async () => {
  const app = await flying();
  const chart = await app.show('chart');
  const answer = await app.click(chart.choices[0].id);
  // The window draws nothing from the answer to a click, so a line that was
  // only returned was a jump made in silence.
  assert.equal(app.said.length, 1);
  assert.equal(answer.summary, app.said[0]);
  assert.ok(app.said[0].length > 0 && app.said[0].length <= 200);
});

test('a card dealt in another system is refused rather than flown', async () => {
  const app = await flying();
  const screen = await app.show('system');
  const crossing = screen.choices.find((choice) => choice.id.startsWith('body:'));
  if (!crossing) return;

  // The same card, three jumps later: "the second body" is a different rock.
  app.rewrite((state) => {
    state.currentSystem = (state.currentSystem + 1) % state.systems.length;
    state.currentBody = 0;
  });
  const day = app.game.day;
  await assert.rejects(() => app.click(crossing.id), /dealt somewhere else/);
  assert.equal(app.game.day, day);
});

test('a card cannot be pressed into a fight, a closed game or a wreck', async () => {
  const closed = await flying();
  const chart = await closed.show('chart');
  await closed.act('quit');
  await assert.rejects(() => closed.click(chart.choices[0].id), /put away/);

  const lost = await flying();
  const map = await lost.show('chart');
  lost.rewrite((state) => {
    state.ship.hull = 0;
  });
  await assert.rejects(() => lost.click(map.choices[0].id), /did not survive/);

  // Stopped by somebody: the encounter is the engine's own, so the record is
  // the shape a real jump leaves in the document.
  const stopped = await flying();
  const way = await stopped.show('chart');
  const state = stopped.game;
  const met = engine.spawnEncounter('pirate', state, new engine.Rng(7));
  stopped.patch({ fight: { queue: [met], at: 0, told: 0, log: [], arrival: { system: 'x', notes: [], met: 1 } } });
  const system = stopped.game.currentSystem;
  await assert.rejects(() => stopped.click(way.choices[0].id), /settle that first/);
  assert.equal(stopped.game.currentSystem, system, 'a second jump was made over the fight');
});

/* ---------- the language ---------- */

test('the fragment is in the language that is set, and names none for the reply', () => {
  const english = harness();
  assert.match(english.prompt, /can't play games/i);
  // It is in the prompt of every conversation, game or no game. A standing
  // order about the reply's language there outranked the question's own.
  assert.doesNotMatch(english.prompt, /Answer the user in/);
  assert.doesNotMatch(english.prompt, /\{\w+\}/);

  // Registered at activation, when nothing had set the language yet: a game
  // set to Ukrainian got the English text, ending "Answer the user in English".
  const ukrainian = harness({ settings: { language: 'uk' } });
  assert.match(ukrainian.prompt, /не вмію грати/i);
  assert.doesNotMatch(ukrainian.prompt, /Answer the user in English/);
  assert.doesNotMatch(ukrainian.prompt, /Відповідай користувачеві/);
  // The model reads the fragment back as actions, so those stay as they are.
  assert.match(ukrainian.prompt, /space_trader_move/);
  // Left as it was found: the language is module state the other tests share.
  harness();
});

test('the reply language is named while a game is being played, and only then', async () => {
  const idle = harness({ settings: { language: 'uk' } });
  assert.equal(await idle.context(), '');

  const app = await flying({ settings: { language: 'uk' } });
  assert.match(await app.context(), /^Відповідай користувачеві українською\./);
  harness();
});

test('a place is found behind the little word in front of it, in both languages', async () => {
  const app = await flying({ settings: { language: 'uk' } });
  const target = app.drawn.board.points.find((point) => point.action.startsWith('warp-'));
  assert.ok(target);
  // What the Ukrainian panel itself sends is «лети Nyle»; what a person types
  // is «лети до Nyle», and the preposition was looked up as part of the name.
  app.turn();
  const jumped = await app.move(`лети до ${target.label}`);
  assert.doesNotMatch(jumped.summary, /немає системи/);
  harness();

  const english = await flying();
  const other = english.drawn.board.points.find((point) => point.action.startsWith('warp-'));
  english.turn();
  const flown = await english.move(`warp to the ${other.label}`);
  assert.doesNotMatch(flown.summary, /no system called/);
});

/* ---------- the slots, from where nothing is being played ---------- */

test('LOAD reaches the slots after a run has been thrown away', async () => {
  const app = await flying();
  await app.press('save');
  await app.act('save-1');
  const day = app.game.day;

  // NEW GAME, twice: the run is gone and the document is the question.
  await app.act('restart');
  await app.act('restart');
  assert.deepEqual(app.document, { setup: {} });
  // The question offers the way out itself — its dialog has no close button.
  assert.ok(offered(app.drawn).includes('setup-load'), 'the chooser had no way to the slots');

  // The panel was the chooser, which has no sheet: this opened nothing.
  const opened = await app.press('load');
  assert.equal(opened.sheet, true);
  assert.equal(app.drawn.cards ?? null, null, 'the chooser was left standing over the slots');
  assert.ok(offered(app.drawn).includes('load-1'), 'the saved slot was not offered');

  const loaded = await app.act('load-1');
  assert.match(loaded.status, /Jameson/);
  assert.equal(app.game.day, day);
  assert.ok(offered(app.drawn).includes('market'));
});

test('the card to the slots does what the button does, and NEW GAME asks again', async () => {
  const app = await flying();
  await app.press('save');
  await app.act('save-2');
  await app.act('restart');
  await app.act('restart');

  const opened = await app.act('setup-load');
  assert.equal(opened.sheet, true);
  assert.ok(offered(app.drawn).includes('load-2'));
  // No run behind the menu, so the one move on it is the question again.
  assert.deepEqual(app.drawn.actions.map((move) => move.id), ['restart']);
  const again = await app.act('restart');
  assert.equal(again.cards, true);
  assert.ok(app.drawn.cards);
});

test('with every slot empty, LOAD leaves the question where it was', async () => {
  const app = harness();
  await app.press('newGame');
  assert.ok(!offered(app.drawn).includes('setup-load'), 'a card to six empty slots');

  const answer = await app.press('load');
  assert.match(answer.status, /No slot has a run in it/);
  assert.equal(answer.cards, true);
  assert.ok(app.document.setup, 'the question was withdrawn for nothing');
  assert.ok(app.drawn.cards);
});

test('SAVE has nothing to write while a commander is being made over a run', async () => {
  const app = await flying();
  await app.press('newGame');
  const answer = await app.press('save');
  assert.match(answer.status, /no run to save/i);
  assert.equal(answer.sheet ?? false, false);
  // LOAD withdraws the question and the run under it is still there.
  await app.press('load');
  assert.equal(app.document.setup, undefined);
  assert.ok(app.document.save);
});

/* ---------- what the sheet says ---------- */

test('every hole in the market sheet is filled, cargo rows included', async () => {
  for (const language of ['en', 'uk']) {
    const app = await flying({ settings: { language } });
    app.rewrite((state) => {
      // Cargo aboard, and somewhere in range this run has been to that pays
      // more for it: the one row whose price over there was never filled in.
      const here = state.systems[state.currentSystem];
      const near = engine.reachableSystems(state).find((sys) => sys.id !== here.id);
      state.systems[near.id].visited = true;
      state.systems[near.id].sellPrice.water = (here.sellPrice.water || 30) + 50;
      state.ship.cargo.water = 3;
      state.buyingPrice.water = 20;
    });
    await app.show('status');

    const rows = app.drawn.groups.flatMap((group) => group.items);
    const carried = rows.filter((row) => /\d/.test(row.note) && !row.action && row.tone === 'good');
    assert.ok(carried.length > 0, 'no row for the cargo that pays more elsewhere');
    assert.doesNotMatch(wording(app.drawn), /\{\w+\}/, `an unfilled hole on the ${language} panel`);
  }
  harness();
});
