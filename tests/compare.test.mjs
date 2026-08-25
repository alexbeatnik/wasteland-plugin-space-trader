/**
 * One market against the others in range, and the voice that offers it.
 *
 * Two halves of the same answer to "what is this planet worth to me". The
 * arithmetic is pure — `view.mjs` takes the engine as an argument — so it is
 * driven here off a galaxy of four stars made by hand, where the right answer
 * is known rather than generated afresh every run. What that buys is the one
 * assertion that matters most: a price is never quoted from a system this run
 * has not been to, which is impossible to test against a real galaxy without
 * waiting for the seed that would prove it.
 *
 * The wiring is then checked through the real plugin, because a comparison
 * nothing can reach is a comparison nobody has.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
// The real engine, for the half of this file that drives the whole plugin. The
// stub below is called `engine` because that is the name `view.mjs` gives the
// argument, and the two must not share one.
import * as game from '../plugins/space-trader/engine.mjs';
import { en } from '../plugins/space-trader/locales/en.mjs';
import { uk } from '../plugins/space-trader/locales/uk.mjs';
import { activate } from '../plugins/space-trader/main.mjs';
import { compare, compareDigest, priceLeads } from '../plugins/space-trader/view.mjs';

/** Everything the comparison asks the engine, answered off a plain object. */
const engine = {
  GOOD_IDS: ['water', 'furs', 'ore'],
  currentSystem: (state) => state.systems[state.currentSystem],
  reachableSystems: (state) => state.systems.filter((sys) => sys.id !== state.currentSystem),
  fuelCost: (state, id) => state.systems[id].fuel,
  systemDistance: (a, b) => Math.abs(a.x - b.x),
  marketBuyPrice: (state, good) => engine.currentSystem(state).buyPrice[good] ?? 0,
};

const dict = {
  goodName: (id) => ({ water: 'Water', furs: 'Furs', ore: 'Ore' })[id] ?? id,
  economyName: (id) => ({ agri: 'Agricultural', mining: 'Mining' })[id] ?? `economy.${id}`,
};

/**
 * Four stars, one of each case the comparison has to get right.
 *
 * `Unseen` is the important one: it is in range, it pays absurdly for
 * everything, and this run has never been there — so nothing about it may
 * reach the screen. It is priced at 999 precisely so that a leak is loud.
 */
function galaxy() {
  return {
    currentSystem: 0,
    credits: 5000,
    ship: { cargo: { furs: 4 } },
    systems: [
      {
        id: 0, nameId: 'Here', x: 0, fuel: 0, visited: true, techLevel: 4, economyType: 'agri',
        buyPrice: { water: 30, ore: 500 },
        qty: { water: 40, ore: 10 },
        sellPrice: { water: 28, furs: 200, ore: 480 },
      },
      {
        id: 1, nameId: 'Nyle', x: 3, fuel: 3, visited: true, techLevel: 5, economyType: 'mining',
        sellPrice: { water: 51, furs: 260, ore: 400 },
      },
      {
        id: 2, nameId: 'Ferris', x: 5, fuel: 5, visited: true, techLevel: 2, economyType: 'agri',
        sellPrice: { water: 40, furs: 300 },
      },
      {
        id: 3, nameId: 'Unseen', x: 2, fuel: 2, visited: false, techLevel: 8, economyType: 'mining',
        sellPrice: { water: 999, furs: 999, ore: 999 },
      },
    ],
  };
}

const lead = (leads, id) => leads.find((entry) => entry.id === id);

test('a price is only ever quoted from a system this run has been to', () => {
  const state = galaxy();
  const leads = priceLeads(engine, dict, state);
  for (const entry of leads) {
    assert.notEqual(entry.best?.sys.nameId, 'Unseen', `${entry.id} was priced off a system nobody has flown to`);
  }
  // And nothing about it reaches either drawing of the answer. Checked on the
  // strings rather than on the data, because that is where a leak would show.
  const printed = compare(engine, dict, state);
  const told = compareDigest(engine, dict, state);
  for (const text of [printed, told]) {
    assert.ok(!text.includes('Unseen'), 'an unvisited system was named');
    assert.ok(!text.includes('999'), 'an unvisited system\'s prices were quoted');
  }
  // Said out loud rather than left as an absence: a screen that quietly omits
  // half the range reads as a screen that has compared the whole of it.
  assert.match(printed, /never been visited/);
  assert.match(told, /unknown/i);
});

test('the hold is weighed against what this planet bids, and the shelf against what it costs', () => {
  const leads = priceLeads(engine, dict, galaxy());

  // Four bays of furs aboard: the question is whether to sell them here at 200
  // or carry them to Ferris at 300.
  const furs = lead(leads, 'furs');
  assert.equal(furs.carrying, true);
  assert.equal(furs.aboard, 4);
  assert.equal(furs.here, 200);
  assert.equal(furs.best.sys.nameId, 'Ferris');
  assert.equal(furs.margin, 100);

  // None aboard: the question is whether to buy at 30 and sell at Nyle for 51.
  const water = lead(leads, 'water');
  assert.equal(water.carrying, false);
  assert.equal(water.here, 30);
  assert.equal(water.best.sys.nameId, 'Nyle');
  assert.equal(water.margin, 21);

  // A loss is a lead too — it is the answer to "should I carry ore", and the
  // answer is no.
  assert.equal(lead(leads, 'ore').margin, -100);
  // Best first, so the top of the list is the thing to do.
  assert.deepEqual(leads.map((entry) => entry.id), ['furs', 'water', 'ore']);
});

test('a commodity this planet neither stocks nor the hold carries is not a row', () => {
  const state = galaxy();
  state.ship.cargo = {};
  state.systems[0].qty = { water: 40 };
  const leads = priceLeads(engine, dict, state);
  // Furs: none aboard and none for sale here. That this planet would buy some
  // is not a comparison, it is the market screen's business.
  assert.equal(lead(leads, 'furs'), undefined);
  assert.deepEqual(leads.map((entry) => entry.id), ['water']);
});

test('the printed table names the best run to each market in range', () => {
  const printed = compare(engine, dict, galaxy());
  // Out of the markets block rather than out of the whole screen: every
  // commodity row names a system too, and the first line mentioning Ferris is
  // the furs that would be carried there.
  const rows = printed.split('THE MARKETS IN RANGE')[1]?.split('\n') ?? [];
  const line = rows.find((row) => row.includes('Ferris'));
  assert.ok(line, 'a market in range was left off the table');
  // Ferris pays most for furs and furs are the best margin there is, so that is
  // the run to name. Naming the second-best would be a table that is right
  // about the numbers and wrong about the decision.
  assert.match(line, /best run: Furs/);
  assert.match(line, /5 fuel/);
  assert.match(line, /Agricultural/);
  // Nyle buys ore at a loss and water at a profit; the run is the profit.
  assert.match(rows.find((row) => row.includes('Nyle')), /best run: Water/);
});

test('the digest is in ids, so what comes back is a move the parser knows', () => {
  const told = compareDigest(engine, dict, galaxy());
  for (const id of ['water', 'furs', 'ore']) {
    assert.ok(told.includes(`${id}:`), `${id} was not in the digest`);
  }
  // The commodity names the player reads are not in it: a round trip through a
  // translation is where "ore" becomes something the parser has never heard of.
  assert.ok(!told.includes('Water'), 'the digest was written in the player\'s language');
  // The systems compared are named with the fuel to reach them, because "best
  // in range" is not an answer without what the range costs.
  assert.match(told, /Nyle \(3\)/);
  assert.match(told, /Ferris \(5\)/);
});

test('with nowhere known in range, both halves say so rather than guessing', () => {
  const state = galaxy();
  for (const sys of state.systems) sys.visited = sys.id === 0;
  const printed = compare(engine, dict, state);
  const told = compareDigest(engine, dict, state);
  assert.match(printed, /has been visited yet/);
  assert.ok(!printed.includes('Nyle'), 'a system nobody has been to was compared anyway');
  // The model is the half that invents when it is not told, so it is told in
  // as many words what to do instead.
  assert.match(told, /nothing to compare/);
  assert.match(told, /rather than guessing/);
});

test('a stranded ship is told it is stranded, not shown an empty table', () => {
  const state = galaxy();
  state.systems = [state.systems[0]];
  assert.match(compare(engine, dict, state), /will not reach anywhere/);
});

/* ---------- and the same answer, through the plugin the app runs ---------- */

/** Everything `ctx` is, with a panel on the end of it. */
function harness({ settings = {} } = {}) {
  const actions = new Map();
  let doc = {};
  let drawn = null;
  let presenter = null;
  const scene = {
    show: (value) => { drawn = value; },
    clear: () => { drawn = null; },
    present: (value) => { presenter = value; },
  };
  const ctx = {
    id: 'space-trader',
    service: () => scene,
    action: ({ type, run }) => actions.set(type, { run }),
    prompt: () => {},
    context: (fn) => { ctx._context = fn; },
    onSettingsChanged: () => {},
    onButton: () => {},
    store: { get: (key, fallback = '') => settings[key] ?? fallback },
    state: { get: () => doc, set: (value) => { doc = value; } },
    dataDir: () => '.',
    log: () => {},
    progress: () => {},
  };
  activate(ctx);
  return {
    get drawn() { return drawn; },
    get document() { return doc; },
    get game() { return doc.save ? JSON.parse(doc.save) : null; },
    rewrite(state) { doc = { ...doc, save: JSON.stringify(state) }; },
    patch(extra) { doc = { ...doc, ...extra }; },
    show: (steps) => actions.get('space_trader').run(steps, {}),
    move: (steps) => actions.get('space_trader_move').run(steps, {}),
    act: (id, value) => presenter.act(id, value),
  };
}

/** A run, made the way the panel makes one, and introduced. */
async function flying(options = {}) {
  const app = harness(options);
  await app.show('new game');
  await app.act('background-trader');
  await app.act('name', 'Jameson');
  await app.show('the launch');
  return app;
}

/**
 * Somewhere to have been, so the comparison has something to compare.
 *
 * Marked on the systems the tank actually reaches rather than on the first
 * three in the array: a visited star ten jumps away is not in the comparison,
 * and a fixture that marks those is a fixture that changes nothing.
 */
function withNeighbours(app) {
  const state = app.game;
  let seen = 0;
  for (const sys of game.reachableSystems(state)) {
    if (sys.id === state.currentSystem) continue;
    sys.visited = true;
    if (++seen >= 3) break;
  }
  app.rewrite(state);
  return state;
}

test('the comparison is a screen, asked for in either language', async () => {
  const app = await flying();
  withNeighbours(app);

  const seen = await app.show('compare prices');
  assert.match(seen.summary, /^PRICES — /);
  // The one screen whose whole content is a comparison, and the second whose
  // feedback is worth its tokens: the model is not shown the table.
  assert.match(seen.feedback, /PRICE COMPARISON/);
  assert.match(seen.feedback, /must not be guessed at/);
  // Looking costs nothing: no day, no move.
  assert.equal(seen.submit ?? '', '');
});

test('«ціни» is still the market, and «порівняти ціни» is not', async () => {
  const app = await flying({ settings: { language: 'uk' } });
  withNeighbours(app);

  // Both patterns are anchored at the start of what was typed, and the market
  // has answered to «ціни» since before there was anything to compare it with.
  const market = await app.show('ціни');
  assert.match(market.summary, /^РИНОК/i);

  const both = await app.show('порівняти ціни');
  assert.match(both.summary, /^ЦІНИ — /);
  assert.match(both.summary, /РИНКИ В ДОСЯЖНОСТІ/);
});

test('the market sheet carries the comparison beside the two lists', async () => {
  const app = await flying();
  const state = withNeighbours(app);
  // Something worth carrying: a neighbour that pays over the odds for whatever
  // is on the shelf here, so the group has a row rather than being empty for a
  // reason that is about the galaxy rather than about the panel.
  const here = state.systems[state.currentSystem];
  const good = Object.keys(here.buyPrice ?? {}).find((id) => here.buyPrice[id] > 0 && (here.qty?.[id] ?? 0) > 0);
  const near = game.reachableSystems(state).find((sys) => sys.visited && sys.id !== state.currentSystem);
  near.sellPrice[good] = here.buyPrice[good] * 3;
  app.rewrite(state);
  await app.act('deal-table');

  const group = app.drawn.groups.find((entry) => entry.label === 'WHERE IT PAYS MORE');
  assert.ok(group, 'the market sheet lost the comparison');
  const row = group.items.find((item) => item.action === `buy-${good}`);
  assert.ok(row, 'the commodity that pays triple somewhere in range was not a row');
  assert.match(row.note, new RegExp(near.nameId));
  assert.equal(row.tone, 'good');
  // Pressing it buys it here, which is the move the row is an argument for.
  assert.equal((await app.act(row.action)).entry, true);
});

/* ---------- the voice that reports an arrival ---------- */

test('an arrival is reported from the bridge, and offers what can be looked at', async () => {
  const app = await flying();
  // Driven through the document rather than by flying until a jump goes
  // unmolested: what is under test is which cue the model is handed, and a
  // test that waits for a quiet leg is a test that waits for a seed.
  app.patch({ narrate: 'Arrived at Nyle. Fuel 11, hull 60.', arrived: true });

  const told = await app.move('warp Nyle');
  assert.match(told.feedback, /ship's computer/);
  // The three things that can be looked at from a landing field, offered as
  // phrases rather than as buttons — the model is never told which buttons are
  // on the row, and naming one is how it invents them.
  assert.match(told.feedback, /news/);
  assert.match(told.feedback, /compare prices/);
  assert.match(told.feedback, /advice/);
  assert.match(told.feedback, /not buttons/);
  assert.match(told.feedback, /Do not make another move/);
  // The account still reaches the model, inside the cue rather than beside it.
  assert.ok(told.feedback.includes('Arrived at Nyle'));
  // And it is consumed: a move a press already made must not be applied twice.
  assert.equal(app.document.narrate ?? null, null);
  assert.equal(app.document.arrived ?? null, null);
});

test('a day at the seam is not an arrival, and is not reported as one', async () => {
  const app = await flying();
  app.patch({ narrate: 'Mined 1 of Ore.' });

  const told = await app.move('mine');
  assert.match(told.feedback, /The move was made/);
  assert.ok(!told.feedback.includes('ship\'s computer'), 'a day at the workings was reported as an arrival');
});

test('the prompt says whose ship the model is speaking from, in both languages', () => {
  /**
   * The persona belongs in the standing prompt and not only in the arrival
   * cue: it is the register for the whole conversation rather than for one turn
   * of it, and a model told how to speak only on arrival speaks like that once.
   *
   * Read off the tables rather than out of a running plugin, the way
   * `tests/words.test.mjs` reads them: `ctx.prompt` is registered while the
   * plugin activates, before a language has been chosen, so what a harness
   * holds is whichever one the module was last set to.
   */
  for (const [table, computer, offer] of [
    [en, /ship's computer/i, /prices here against the markets in range/i],
    [uk, /бортовий комп'ютер/i, /ринків у досяжності/i],
  ]) {
    assert.match(table['prompt.text'], computer, 'the prompt never says what it is');
    assert.match(table['prompt.text'], offer, 'the prompt never says what to offer');
    // The screen it offers has to be one the model can actually reach.
    assert.match(table['prompt.text'], /compare/);
    // And it must not undo the rule it sits next to: what is offered is a
    // phrase to say, and the row of buttons is still the user's alone.
    assert.match(table['prompt.text'], /space_trader_move/);
  }
});

test('a fight handed over on the way somewhere still reports the arrival', async () => {
  const app = await flying();
  const state = app.game;
  // Intercepted mid-jump, and the fight handed over rather than pressed
  // through. The leg still ended at a planet, and the report is still an
  // arrival — this is the ending that used to answer as though it were not.
  const encounter = game.spawnEncounter('pirate', state, new game.Rng(7));
  encounter.opponent.hull = 1;
  app.patch({
    save: JSON.stringify(state),
    fight: {
      queue: [encounter],
      at: 0,
      told: 0,
      log: [],
      arrival: { system: 'Nyle', notes: [], met: 1, arrived: true },
    },
  });

  const over = await app.move('fight it out');
  assert.match(over.feedback, /ship's computer/, 'the arrival went unreported');
  assert.match(over.feedback, /compare prices/);
  assert.equal(app.document.fight ?? null, null, 'the fight outlived the leg');
});
