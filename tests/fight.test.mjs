/**
 * The fight, fought a round at a time.
 *
 * A jump meets whoever it meets, so almost nothing here waits for a pirate to
 * turn up: the encounter is built with the engine's own `spawnEncounter`, put
 * into the plugin's document, and then fought through the panel exactly as a
 * player would fight it. That makes the interesting cases — a wing of three, a
 * hauler that has done nothing wrong, a hull at one point — reachable in a test
 * instead of waiting for a seed that produces them.
 *
 * The one thing that is not stubbed is the fighting. Every round goes through
 * `resolveRound` in the real engine, because the bugs worth catching here are
 * disagreements with it about what an encounter is.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as engine from '../plugins/space-trader/engine.mjs';
import * as dict from '../plugins/space-trader/i18n.mjs';
import * as fight from '../plugins/space-trader/fight.mjs';
import { activate } from '../plugins/space-trader/main.mjs';
import { setLanguage, t } from '../plugins/space-trader/words.mjs';

function harness({ settings = {}, document = {} } = {}) {
  const actions = new Map();
  let doc = document;
  let drawn = null;
  let presenter = null;

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
      throw new Error(`no service "${name}"`);
    },
    action: ({ type, run, choose }) => actions.set(type, { run, choose }),
    prompt: () => {},
    context: (fn) => {
      ctx._context = fn;
    },
    onSettingsChanged: () => {},
    onButton: (fn) => { ctx._button = fn; },
    store: { get: (key, fallback = '') => settings[key] ?? fallback },
    state: {
      get: () => doc,
      set: (value) => {
        doc = value;
      },
    },
    dataDir: () => '.',
    log: () => {},
    progress: () => {},
  };

  activate(ctx);
  return {
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
    write(state, extra = {}) {
      doc = { ...doc, save: JSON.stringify(state), ...extra };
    },
    show: (steps) => actions.get('space_trader').run(steps, {}),
    move: (steps) => actions.get('space_trader_move').run(steps, {}),
    act: (id, value) => presenter.act(id, value),
    context: () => ctx._context(),
    press: (key) => ctx._button(key),
  };
}

/** A run, made the way the panel makes one. */
async function flying(options = {}) {
  const app = harness(options);
  await app.show('new game');
  await app.act('background-fighter');
  await app.act('name', 'Jameson');
  await app.show('the launch');
  return app;
}

/**
 * Somebody in the way, on purpose.
 *
 * The encounter is the engine's, the record is the plugin's, and `shape` is the
 * one liberty taken: an opponent whose hull is set to 1 makes "one shot ends
 * it" a test rather than a wait.
 */
async function intercept(app, { kind = 'pirate', seed = 7, shape = () => {} } = {}) {
  setLanguage(app.settings.language === 'uk' ? 'uk' : 'en');
  dict.setLocale(app.settings.language === 'uk' ? 'uk' : 'en');
  const state = app.game;
  const encounter = engine.spawnEncounter(kind, state, new engine.Rng(seed));
  shape(encounter, state);
  const record = fight.open(dict, [encounter], {
    system: state.systems[state.currentSystem].nameId,
    notes: [],
    met: 1,
  });
  app.write(state, { fight: record });
  // Any way in repaints; a screen is the one that changes nothing else.
  await app.show('status');
  return encounter;
}

const ids = (app) => app.drawn.actions.map((move) => move.id);
const group = (app, label) => app.drawn.groups.find((entry) => entry.label === label)?.items ?? [];

test('an interception takes the whole panel', async () => {
  const app = await flying();
  await intercept(app);

  assert.ok(app.drawn.title.length > 0);
  assert.match(app.drawn.subtitle, /round \d/);
  // No market, no chart, no way out but through: a row offering to go shopping
  // in the middle of a boarding action is a row offering to leave.
  for (const gone of ['market', 'chart', 'ship', 'jobs', 'news', 'refuel', 'restart', 'quit']) {
    assert.ok(!ids(app).includes(gone), `${gone} is still on the row`);
  }
  assert.ok(ids(app).every((id) => id.startsWith('fight-')));
});

test('both ships are on the strip, with the range between them', async () => {
  const app = await flying();
  const encounter = await intercept(app);
  const state = app.game;

  const bars = app.drawn.meters;
  assert.equal(bars[0].value, state.ship.hull);
  assert.equal(bars[0].accent, 'life');
  const theirs = bars.find((bar) => bar.label === engine.SHIP_TYPES[encounter.opponent.shipType].id
    || bar.value === encounter.opponent.hull);
  assert.ok(theirs, 'the other ship is not on the panel');
  assert.equal(theirs.max, encounter.opponent.maxHull);
  const range = bars.find((bar) => bar.accent === 'vigour');
  assert.equal(range.value, Math.round(encounter.opponent.distance));
  assert.equal(range.max, engine.MAX_ENGAGEMENT_RANGE);

  // The two numbers a person actually decides against.
  const yours = app.drawn.fields.find((field) => field.label === 'YOUR SHOT');
  assert.match(yours.value, /^\d+%$/);
  assert.ok(app.drawn.fields.some((field) => field.label === 'THEIRS'));
});

test('the row is what can be done against this one, and nothing else', async () => {
  const app = await flying();

  await intercept(app, { kind: 'pirate' });
  assert.ok(ids(app).includes('fight-attack'));
  assert.ok(ids(app).includes('fight-flee'));
  assert.ok(ids(app).includes('fight-surrender'));
  // Walking away from a pirate is not on offer: the engine would allow it, and
  // a button that wins a fight by declining it is not a button.
  assert.ok(!ids(app).includes('fight-ignore'));

  await intercept(app, { kind: 'police' });
  assert.ok(ids(app).includes('fight-submit'), 'the police cannot be submitted to');

  await intercept(app, { kind: 'trader', shape: (enc) => { enc.provoked = false; } });
  assert.ok(ids(app).includes('fight-ignore'), 'a hauler cannot be left alone');
  assert.ok(!ids(app).includes('fight-flee'), 'there is nothing to run from');
});

test('the row of a fight fits the hotkeys it is given', async () => {
  // The app draws twelve at most and puts the digits 1-9 on the first nine by
  // position. A police encounter with a crew aboard is the longest row there
  // is: fire, run, close, open, submit, surrender, bribe, fight it out, run for
  // it, hold fire — ten, so exactly one of them goes without a digit, and which
  // one is decided here rather than by whatever order the list came out in.
  const app = await flying();
  const state = app.game;
  state.ship.crew = ['pax', 'mira'];
  state.ship.weapons = ['pulse', 'pulse'];
  app.write(state);
  await intercept(app, { kind: 'police', shape: (enc) => { enc.bribeCost = 400; } });
  await app.act('fight-closeIn');

  const row = ids(app);
  assert.ok(row.length <= 12, `the row is ${row.length} long and the app draws twelve`);
  assert.equal(new Set(row).size, row.length, 'the same move is on the row twice');
  assert.ok(row.includes('fight-endTurn'), 'a crew gets a second action and no way to decline it');
  // The two that end the fight in one press keep their digits; HOLD FIRE is the
  // one that may lose one, because it only declines the rest of a round.
  assert.ok(row.indexOf('fight-auto') < 9, 'RUN FOR IT lost its hotkey');
  assert.ok(row.indexOf('fight-autoFight') < 9, 'FIGHT IT OUT lost its hotkey');
  assert.equal(row.at(-1), 'fight-endTurn');
});

test('a round costs no turn and sends nothing to the model', async () => {
  const app = await flying();
  await intercept(app);
  const day = app.game.day;

  const fired = await app.act('fight-attack');
  assert.equal(fired.submit ?? '', '', 'a round was sent to the model');
  assert.ok(fired.status.length > 0, 'the round said nothing');
  assert.equal(app.game.day, day, 'a round cost a day');
  assert.ok(app.document.fight, 'the fight was dropped after one round');
  assert.ok(app.document.fight.log.length > 1);
});

test('the same round played twice comes out the same way', async () => {
  // The die is seeded from the encounter and the count of actions in it, so a
  // fight is as deterministic in the save as the galaxy is.
  const first = await flying();
  await intercept(first, { seed: 21 });
  const one = await first.act('fight-attack');

  const second = await flying();
  await intercept(second, { seed: 21 });
  const two = await second.act('fight-attack');

  assert.equal(one.status, two.status);
});

test('one shot ends it, and the account waits for the jump to finish', async () => {
  const app = await flying();
  await intercept(app, { shape: (enc) => { enc.opponent.hull = 1; enc.opponent.shieldPoints = 0; enc.reserves = []; } });

  for (let round = 0; round < 12 && app.document.fight?.queue[0].status === 'ongoing'; round += 1) {
    await app.act('fight-attack');
  }
  assert.notEqual(app.document.fight.queue[0].status, 'ongoing', 'twelve shots and it is still up');

  // Settled: the row is what to do next, not what to shoot with.
  assert.ok(ids(app).includes('fight-on'));
  assert.ok(!ids(app).includes('fight-attack'));

  const done = await app.act('fight-on');
  assert.equal(done.submit, t('move.fight.submit'));
  assert.equal(app.document.fight, undefined, 'the fight outlived the jump');
  // The whole thing goes into the transcript at once, when there is a "what
  // happened" to tell.
  assert.match(app.document.narrate, /Arrived at /);
  assert.ok(app.document.narrate.split('\n').length > 2);
  // And the ordinary panel is back.
  assert.ok(ids(app).includes('market'));
});

test('the model is told the fight is not its to narrate', async () => {
  const app = await flying();
  await intercept(app);

  const fragment = await app.context();
  assert.match(fragment, /a fight is in progress/i);
  assert.match(fragment, /Do NOT narrate rounds/);
  // Every screen answers with the fight rather than with a price table: a model
  // handed one in the middle of a boarding action advises on trade.
  const screen = await app.show('market');
  assert.match(screen.feedback, /Do NOT narrate rounds/);
  assert.doesNotMatch(screen.feedback, /Prices at /);
});

test('nothing is bought or jumped while there is shooting', async () => {
  const app = await flying();
  await intercept(app);
  const credits = app.game.credits;

  const bought = await app.move('buy 3 water');
  assert.equal(bought.ok, false);
  assert.equal(app.game.credits, credits);
  assert.match(bought.summary, /not a move in a fight/);

  const jumped = await app.move('warp Nowhere');
  assert.equal(jumped.ok, false);
  assert.ok(app.document.fight, 'the fight was left behind by a jump');
});

test('the fight can be fought by typing, like everything else', async () => {
  const app = await flying();
  await intercept(app);

  const fired = await app.move('fire at them');
  assert.equal(fired.ok, true);
  assert.ok(app.document.fight.log.length > 1);
  assert.match(fired.feedback, /a fight is in progress/i);
});

test('FIGHT IT OUT settles the lot and finishes the jump', async () => {
  const app = await flying();
  await intercept(app);

  const done = await app.act('fight-autoFight');
  assert.equal(app.document.fight, undefined);
  assert.ok(done.submit === t('move.fight.submit') || app.game.ship.hull <= 0);
  assert.ok((app.document.narrate ?? '').trim().length > 0);
});

test('RUN FOR IT settles the lot the other way', async () => {
  const app = await flying();
  await intercept(app);

  const done = await app.act('fight-auto');
  assert.equal(app.document.fight, undefined);
  assert.ok(done.submit === t('move.fight.submit') || app.game.ship.hull <= 0);
});

/**
 * The posture was a settings row until 2.4.0 — one standing answer, given
 * before the jump, to a question that is different every time somebody stops
 * you. It is two buttons now, pressed against a position that is on screen.
 */
test('handing a fight over is a choice made at the fight, not in the settings', async () => {
  const app = await flying();
  await intercept(app, { kind: 'pirate' });
  const row = ids(app);
  assert.ok(row.includes('fight-auto') && row.includes('fight-autoFight'));

  // Both say what they do, and neither cites a setting.
  for (const id of ['fight-auto', 'fight-autoFight']) {
    const move = app.drawn.actions.find((entry) => entry.id === id);
    assert.ok(move.hint.length > 0);
    assert.ok(!/setting/i.test(move.hint), `${id} still points at a settings row`);
  }

  // Against police the running one submits, and the hint has to say so rather
  // than promise a getaway.
  const police = await flying();
  await intercept(police, { kind: 'police' });
  assert.match(police.drawn.actions.find((entry) => entry.id === 'fight-auto').hint, /submit/i);
});

test('a hauler gets one hand-over button, because there is nothing to choose', async () => {
  const app = await flying();
  await intercept(app, { kind: 'trader', seed: 1 });
  const row = ids(app);
  assert.ok(row.includes('fight-auto'));
  // Nothing to run from and nothing to shoot: auto goes past it either way, so
  // a second button would be two labels for one outcome.
  assert.ok(!row.includes('fight-autoFight'));
  assert.match(app.drawn.actions.find((entry) => entry.id === 'fight-auto').hint, /past/i);
});

test('a wing sends the next ship in, and the sheet can pick which', async () => {
  const app = await flying();
  const encounter = await intercept(app, {
    shape: (enc, state) => {
      const rng = new engine.Rng(3);
      enc.reserves = [engine.spawnEncounter('pirate', state, rng).opponent];
      enc.fleetSize = 2;
      enc.opponent.hull = 1;
      enc.opponent.shieldPoints = 0;
    },
  });

  const fleet = group(app, 'THE WING');
  assert.equal(fleet.length, 1);
  assert.match(fleet[0].action, /^fight-target-0$/);

  const switched = await app.act('fight-target-0');
  assert.equal(switched.sheet, true);
  assert.notEqual(app.document.fight.queue[0].opponent.shipType, undefined);

  // Whoever is in front now, downing one leaves the other still flying.
  for (let round = 0; round < 40 && app.document.fight?.queue[0].status === 'ongoing'; round += 1) {
    await app.act('fight-attack');
    if (app.game.ship.hull <= 0) break;
  }
  assert.ok(encounter.defeated >= 0);
});

test('surrendering to a pirate costs the cargo', async () => {
  const app = await flying();
  const state = app.game;
  const good = engine.GOOD_IDS.find((id) => (state.systems[state.currentSystem].buyPrice?.[id] ?? 0) > 0);
  state.ship.cargo[good] = 3;
  app.write(state);
  await intercept(app, { kind: 'pirate' });

  await app.act('fight-surrender');
  assert.equal(app.game.ship.cargo[good], 0, 'they left the cargo behind');
  assert.notEqual(app.document.fight.queue[0].status, 'ongoing');
});

test('a ship that strikes its colours can be boarded', async () => {
  const app = await flying();
  await intercept(app, {
    shape: (enc) => {
      enc.status = 'oppSurrendered';
      enc.reserves = [];
      for (const id of engine.GOOD_IDS) enc.opponent.cargo[id] = 0;
      enc.opponent.cargo.water = 4;
    },
  });

  assert.ok(ids(app).includes('fight-plunder'));
  assert.equal(group(app, 'THEIR HOLD').length, 1);
  await app.act('fight-plunder');
  assert.equal(app.game.ship.cargo.water, 4);
});

test('a commander who dies out there dies, and the panel says so', async () => {
  const app = await flying();
  await intercept(app, {
    shape: (enc, state) => {
      state.ship.hull = 1;
      enc.opponent.weaponPower = 400;
      enc.opponent.fighter = 13;
      enc.opponent.distance = engine.POINT_BLANK_RANGE;
    },
  });
  // The shaped state has to go back with the encounter.
  const state = app.game;
  state.ship.hull = 1;
  app.write(state);

  for (let round = 0; round < 20 && app.game.ship.hull > 0; round += 1) await app.act('fight-attack');
  assert.equal(app.game.ship.hull, 0, 'twenty rounds against a hull of one');
  assert.equal(app.document.fight, undefined, 'the fight outlived the commander');
  assert.ok(app.drawn.tags.some((tag) => tag.label === 'LOST'));
  assert.deepEqual(ids(app), ['restart', 'quit']);
});

test('a fight survives the app being closed', async () => {
  const app = await flying();
  await intercept(app);
  await app.act('fight-attack');

  const again = harness({ document: app.document });
  await again.show('status');
  assert.ok(again.drawn.subtitle.match(/round \d/), 'the fight did not come back');
  assert.ok(again.document.fight.log.length > 1, 'what had been said was lost');
  const fired = await again.act('fight-attack');
  assert.ok(fired.status.length > 0);
});

test('a Ukrainian fight is Ukrainian', async () => {
  const app = await flying({ settings: { language: 'uk' } });
  await intercept(app);
  assert.match(app.drawn.actions[0].label, /ВОГОНЬ/);
  assert.match(app.drawn.groups[0].label, /[а-яїієґ]/i);
  const fired = await app.act('fight-attack');
  assert.match(fired.status, /[а-яїієґ]/i);
});

/**
 * The hauler's stall.
 *
 * The engine has dealt every lone trader a hand of goods to sell and a short
 * list to buy since the encounter was written, and none of it was reachable
 * from the plugin: a row of buttons cannot hold a price list, so the one
 * encounter in the game that is not a gunfight was fought like one.
 */
test('a hauler met in transit keeps a stall, and it can be bought from', async () => {
  const app = await flying();
  const encounter = await intercept(app, { kind: 'trader', seed: 1 });
  assert.ok(encounter.trade, 'the seed did not produce a lone trader');

  // The stall is a button, because two price lists belong behind the sheet and
  // nothing would say the sheet had anything new in it.
  assert.ok(ids(app).includes('fight-trade'));
  const opened = await app.act('fight-trade');
  assert.equal(opened.sheet, true);

  const offered = group(app, 'WHAT THEY ARE SELLING');
  assert.ok(offered.length > 0, 'they are selling nothing');
  const row = offered.find((item) => item.action);
  assert.ok(row, 'nothing on the stall could be pressed');
  const good = row.action.slice('fight-buy-'.length);

  // A row opens the field, exactly as a commodity on a planet does.
  const asked = await app.act(row.action);
  assert.equal(asked.entry, true);
  assert.equal(app.drawn.entry.action, 'amount');

  const before = app.game;
  const held = before.ship.cargo[good] ?? 0;
  const bought = await app.act('amount', '1');
  assert.equal(bought.sheet, true);
  assert.equal(app.game.ship.cargo[good], held + 1);
  assert.ok(app.game.credits < before.credits, 'the goods were free');
  // Nothing is submitted: a stall in the middle of a jump is not a turn.
  assert.equal(bought.submit ?? null, null);
  // What was bought is in the fight's own account, which is what reaches the
  // transcript when the encounter is over.
  assert.ok(fight.account(app.document.fight).includes(dict.goodName(good)), 'the purchase never reached the account');
});

test('what they will buy is pressable only for what is actually aboard', async () => {
  const app = await flying();
  const state = app.game;
  const encounter = engine.spawnEncounter('trader', state, new engine.Rng(1));
  const wanted = engine.GOOD_IDS.filter((id) => (encounter.trade.buys[id] ?? 0) > 0);
  assert.ok(wanted.length > 0);
  state.ship.cargo[wanted[0]] = 2;
  const record = fight.open(dict, [encounter], { system: 'x', notes: [], met: 1 });
  app.write(state, { fight: record });
  await app.show('status');

  const rows = group(app, 'WHAT THEY ARE BUYING');
  const first = rows.find((item) => item.label === dict.goodName(wanted[0]));
  assert.ok(first.action, 'a good in the hold could not be sold');
  for (const id of wanted.slice(1)) {
    const row = rows.find((item) => item.label === dict.goodName(id));
    if ((state.ship.cargo[id] ?? 0) === 0) assert.equal(row.action, '', 'a good nobody has could be sold');
  }

  await app.act(first.action);
  const credits = app.game.credits;
  const sold = await app.act('amount', '2');
  assert.equal(app.game.ship.cargo[wanted[0]], 0);
  assert.ok(app.game.credits > credits);
  assert.ok(sold.status.length > 0);
});

test('the first shot shuts the stall', async () => {
  const app = await flying();
  await intercept(app, { kind: 'trader', seed: 1 });
  assert.ok(ids(app).includes('fight-trade'));
  // Firing on a hauler is a decision the hint has to name, because it does not
  // come back: it makes them an enemy and you a pirate.
  const fire = app.drawn.actions.find((move) => move.id === 'fight-attack');
  assert.match(fire.hint, /pirate/i);

  await app.act('fight-attack');
  assert.ok(!ids(app).includes('fight-trade'), 'the stall was still open after the first shot');
  assert.equal(group(app, 'WHAT THEY ARE SELLING').length, 0);
});

test('a move mid-trade closes the half-asked question', async () => {
  const app = await flying();
  await intercept(app, { kind: 'trader', seed: 1 });
  const row = group(app, 'WHAT THEY ARE SELLING').find((item) => item.action);
  await app.act(row.action);
  assert.ok(app.drawn.entry, 'the field never opened');

  await app.act('fight-openRange');
  assert.equal(app.drawn.entry ?? null, null, 'the field survived a move');
});

test('the row names what is being demanded rather than the act of giving in', async () => {
  const pirate = await flying();
  await intercept(pirate, { kind: 'pirate' });
  const gave = pirate.drawn.actions.find((move) => move.id === 'fight-surrender');
  assert.match(gave.label, /HOLD/);

  const hunter = await flying();
  await intercept(hunter, { kind: 'bountyHunter' });
  assert.match(hunter.drawn.actions.find((move) => move.id === 'fight-surrender').label, /STAND DOWN/);

  const police = await flying();
  await intercept(police, { kind: 'police' });
  assert.match(police.drawn.actions.find((move) => move.id === 'fight-surrender').label, /SURRENDER/);
});

test('a tractor beam renames the way out, because it is a different move', async () => {
  const app = await flying();
  await intercept(app, {
    kind: 'pirate',
    shape: (enc) => {
      enc.tractorLocked = true;
    },
  });
  const out = app.drawn.actions.find((move) => move.id === 'fight-flee');
  assert.match(out.label, /BREAK FREE/);
  assert.match(out.hint, /tractor/i);
});

test('the wing is read by range, with the odds on every row and the wrecks kept', async () => {
  const app = await flying();
  await intercept(app, {
    shape: (enc, state) => {
      const rng = new engine.Rng(3);
      const near = engine.spawnEncounter('pirate', state, rng).opponent;
      const far = engine.spawnEncounter('pirate', state, rng).opponent;
      near.distance = 8;
      far.distance = 34;
      enc.reserves = [far, near];
      enc.downed = ['flea'];
      enc.fleetSize = 4;
    },
  });

  const wing = group(app, 'THE WING');
  assert.equal(wing.length, 3);
  // Wrecks first: they are what is no longer coming.
  assert.equal(wing[0].action ?? '', '');
  // Then the living, nearest first — and the index is the engine's, not the
  // row's, or taking aim would switch to the wrong ship.
  assert.equal(wing[1].action, 'fight-target-1');
  assert.equal(wing[2].action, 'fight-target-0');
  for (const row of wing.slice(1)) assert.match(row.note, /[0-9]+%/);
});

test('the panel says where the actions in a round come from', async () => {
  const app = await flying();
  await intercept(app);
  const stations = app.drawn.fields.find((field) => field.label === 'STATIONS');
  assert.ok(stations, 'nothing said who was at the guns');
  // A commander flying alone is one gunner and nobody on the helm, which is
  // why the round is one action long.
  assert.match(stations.value, /gunner/);
  assert.match(stations.value, /no helm/);
});
