/**
 * The panel: what the app draws while a game is running.
 *
 * Everything here is pure — the engine, the game's dictionary and a saved state
 * go in, a plain document comes out — which is what lets the tests read a whole
 * screen without a window, and what stops the panel keeping a second copy of
 * the game beside the real one. The same save builds `briefing()` in `view.mjs`
 * for the model, so the screen and the prompt cannot drift into describing two
 * different runs.
 *
 * The shape is the `scene` service's: meters, fields, tags, groups behind the
 * sheet, a board, a row of moves. Every field is optional and anything that
 * does not fit is dropped by the host rather than thrown, so this file's job is
 * to decide what is *worth* drawing, not to defend the renderer.
 *
 * Two dictionaries are in play and they are not interchangeable. `t()` is the
 * plugin's own words — labels, hints, notes. `dict` is the game's, bundled with
 * the engine: it knows that `water` is Water and that `flea` is a Flea. A label
 * built from the wrong one is the bug this comment exists to prevent.
 */
import { economyName, techName } from './view.mjs';
import { clip, credits as money, group as digits, t } from './words.mjs';

/** How many systems the chart may carry. The host's own ceiling is 24. */
const MAX_POINTS = 24;
/** How far out the chart looks, as a multiple of the jump range. */
const CHART_REACH = 1.6;
/** Log lines kept on the sheet. The save holds more; a list is not an archive. */
const LOG_ROWS = 14;
/**
 * What the host allows a row's label to be.
 *
 * Forty-eight characters, and several things that belong on a row are
 * sentences: a headline, the description of a contract. Cut by the host they
 * end mid-word — "Talent contest grips a planet with nothing els" — so they are
 * cut here instead, at a space, with an ellipsis that says so.
 */
const MAX_LABEL = 48;
const short = (text) => clip(text, MAX_LABEL);
/**
 * Where the twenty-five skill points went.
 *
 * The engine takes `skills` and has no notion of a background, so these are the
 * plugin's own — five ways to spend the same budget rather than five different
 * budgets, because a card that was simply better than the others would not be a
 * choice. Every row sums to 25 and none exceeds the engine's `MAX_SKILL` of 10.
 *
 * The numbers are read out onto the cards by `cardChoices()` rather than
 * described in the card's own prose, so a description cannot quietly drift away
 * from what the run actually starts with.
 */
export const BACKGROUNDS = [
  { key: 'pilot', skills: { pilot: 9, fighter: 4, trader: 4, engineer: 4, electrician: 4 } },
  { key: 'fighter', skills: { pilot: 4, fighter: 9, trader: 4, engineer: 4, electrician: 4 } },
  { key: 'trader', skills: { pilot: 4, fighter: 4, trader: 9, engineer: 4, electrician: 4 } },
  { key: 'engineer', skills: { pilot: 4, fighter: 4, trader: 4, engineer: 8, electrician: 5 } },
];

/** A background by key, or nothing. */
export function backgroundFor(key) {
  return BACKGROUNDS.find((entry) => entry.key === key) ?? null;
}

/** The name of a background, in the language in force. */
export function backgroundName(key) {
  return t(`setup.card.${key}.label`);
}

/**
 * The cards a run opens on.
 *
 * Four trades and a shrug. `random` carries no skills of its own — the choice
 * is made when it is pressed, so the card cannot promise numbers it will not
 * deliver.
 */
export function cardChoices() {
  const named = BACKGROUNDS.map((entry) => ({
    key: entry.key,
    skills: entry.skills,
    label: t(`setup.card.${entry.key}.label`),
    note: `${t(`setup.card.${entry.key}.note`)} · ${t('setup.skills', entry.skills)}`,
  }));
  return [
    ...named,
    { key: 'random', skills: null, label: t('setup.card.random.label'), note: t('setup.card.random.note') },
  ];
}

/* ---------- small readings of the state ---------- */

function fraction(value, max) {
  return max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
}

function meterTone(value, max) {
  const part = fraction(value, max);
  if (part <= 0.25) return 'bad';
  if (part <= 0.5) return 'warn';
  return '';
}

/** Is the game over? One question, asked in one place, answered the same way. */
export function isWrecked(state) {
  return (state?.ship?.hull ?? 0) <= 0;
}

/** Systems the tank will reach from here, nearest first. */
export function reachable(engine, state) {
  const here = engine.currentSystem(state);
  return engine
    .reachableSystems(state)
    .filter((sys) => sys.id !== here.id)
    .map((sys) => ({ sys, fuel: engine.fuelCost(state, sys.id), distance: engine.systemDistance(here, sys) }))
    .sort((a, b) => a.distance - b.distance);
}

/* ---------- the chart ---------- */

/**
 * The star chart, as the board the app draws.
 *
 * A local window rather than the whole galaxy: 140 systems on one board would
 * be a field of dots at four pixels apart, and the host draws 24 in any case.
 * The ship is at the centre and the scale is its jump range, so the edge of the
 * drawing is the edge of the tank — the one fact a trader is actually deciding
 * against.
 *
 * Only what can be reached is pressable. A marker for somewhere out of range is
 * still worth drawing, because knowing that Nyle is two hops beyond the fuel is
 * how a route gets planned, but a button answering "the tank will not reach it"
 * is a button that should not have been drawn.
 */
export function board(engine, dict, state, image = '') {
  const here = engine.currentSystem(state);
  const range = Math.max(1, engine.maxRange(state));
  const reach = range * CHART_REACH;
  const inRange = new Map(reachable(engine, state).map((entry) => [entry.sys.id, entry]));

  const shown = state.systems
    .map((sys) => ({ sys, distance: engine.systemDistance(here, sys) }))
    .filter(({ sys, distance }) => sys.id === here.id || inRange.has(sys.id) || (sys.visited && distance <= reach))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_POINTS);

  const points = shown.map(({ sys, distance }) => {
    const leg = inRange.get(sys.id);
    const wormhole = here.wormholeTo === sys.id;
    const note = sys.id === here.id
      ? t('board.here')
      : wormhole
        ? t('board.wormhole', { tax: digits(engine.wormholeTax(state)) })
        : leg
          ? sys.visited
            ? t('board.reachable', {
              fuel: leg.fuel,
              distance: Math.round(distance),
              economy: economyName(engine, dict, sys),
              tech: sys.techLevel,
            })
            : t('board.reachableUnknown', { fuel: leg.fuel, distance: Math.round(distance) })
          : t('board.seen', { distance: Math.round(distance) });

    return {
      id: `sys-${sys.id}`,
      label: sys.nameId,
      note,
      // Percentages of the board, centred on the ship. 48 rather than 50 so a
      // marker at the edge of the range keeps its label on the picture.
      x: Math.max(2, Math.min(98, 50 + ((sys.x - here.x) / reach) * 48)),
      y: Math.max(2, Math.min(98, 50 + ((sys.y - here.y) / reach) * 48)),
      here: sys.id === here.id,
      tone: sys.id === here.id ? '' : leg || wormhole ? 'good' : '',
      action: sys.id !== here.id && (leg || wormhole) ? `warp-${sys.id}` : '',
    };
  });

  const drawn = new Set(points.map((point) => point.id));
  const links = [];
  for (const [id] of inRange) {
    if (drawn.has(`sys-${id}`)) links.push({ from: `sys-${here.id}`, to: `sys-${id}`, tone: 'good' });
  }
  // The wormhole costs no fuel and is therefore never in `reachable`, which is
  // exactly why it has to be drawn: it is the one route the range does not
  // explain.
  if (here.wormholeTo != null && drawn.has(`sys-${here.wormholeTo}`)) {
    links.push({ from: `sys-${here.id}`, to: `sys-${here.wormholeTo}`, tone: 'warn' });
  }

  return { image, points, links };
}

/* ---------- the lists behind the sheet ---------- */

function marketGroups(engine, dict, state) {
  const sys = engine.currentSystem(state);
  const ship = state.ship;
  const room = engine.freeCargoBays(ship);

  const onSale = [];
  for (const id of engine.GOOD_IDS) {
    const price = engine.marketBuyPrice(state, id);
    const available = sys.qty?.[id] ?? 0;
    if (!price || available <= 0) continue;
    const affordable = Math.floor(state.credits / price);
    const note = room <= 0
      ? t('panel.row.buy.full', { price: digits(price) })
      : affordable <= 0
        ? t('panel.row.buy.broke', { price: digits(price), available })
        : t('panel.row.buy', { price: digits(price), available });
    onSale.push({
      label: dict.goodName(id),
      note,
      tone: room > 0 && affordable > 0 ? '' : 'warn',
      // Offered even when nothing is affordable: the row still opens the amount
      // field, and a field that says "0 affordable" is a clearer answer than a
      // row that cannot be pressed for a reason nobody stated.
      action: `buy-${id}`,
    });
  }

  const held = [];
  for (const id of engine.GOOD_IDS) {
    const aboard = ship.cargo?.[id] ?? 0;
    if (aboard <= 0) continue;
    const price = sys.sellPrice?.[id] ?? 0;
    const paid = aboard > 0 ? Math.round((state.buyingPrice?.[id] ?? 0) / aboard) : 0;
    const margin = price && paid ? price - paid : 0;
    const note = !price
      ? t('panel.row.sell.noBid', { held: aboard })
      : margin > 0
        ? t('panel.row.sell.margin', { held: aboard, price: digits(price), margin: money(margin) })
        : margin < 0
          ? t('panel.row.sell.loss', { held: aboard, price: digits(price), margin: money(-margin) })
          : t('panel.row.sell', { held: aboard, price: digits(price) });
    held.push({
      label: dict.goodName(id),
      note,
      tone: !price ? 'warn' : margin > 0 ? 'good' : margin < 0 ? 'bad' : '',
      action: price ? `sell-${id}` : '',
    });
  }

  return [
    { label: t('panel.group.onsale'), empty: t('panel.group.onsale.empty'), items: onSale },
    { label: t('panel.group.hold'), empty: t('panel.group.hold.empty'), items: held },
  ];
}

function shipGroups(engine, dict, state) {
  const ship = state.ship;
  const names = (list, name) => (list ?? []).map((id) => name(id)).join(', ');
  const fitted = [
    {
      label: t('panel.row.weapons'),
      note: names(ship.weapons, dict.weaponName) || t('panel.row.nothing'),
      tone: (ship.weapons ?? []).length ? '' : 'warn',
    },
    {
      label: t('panel.row.shields'),
      note: names(ship.shields, dict.shieldName) || t('panel.row.nothing'),
      tone: (ship.shields ?? []).length ? '' : 'warn',
    },
    { label: t('panel.row.gadgets'), note: names(ship.gadgets, dict.gadgetName) || t('panel.row.nothing') },
    {
      label: t('panel.row.quarters'),
      note: t('panel.row.quartersValue', { n: engine.freeQuarters(ship) }),
    },
    {
      label: t('panel.row.hullLabel'),
      note: t('panel.row.hull', { hull: ship.hull, max: engine.maxHull(ship) }),
      tone: meterTone(ship.hull, engine.maxHull(ship)),
    },
  ];

  const crew = (ship.crew ?? []).map((id) => {
    const hand = engine.MERCENARIES?.[id];
    return {
      label: hand ? dict.mercName(id) : id,
      note: hand
        ? t('panel.row.crew', {
          role: dict.t(`profession.${hand.profession}`),
          pilot: hand.skills?.pilot ?? 0,
          fighter: hand.skills?.fighter ?? 0,
          engineer: hand.skills?.engineer ?? 0,
        })
        : '',
    };
  });

  return [
    { label: t('panel.group.ship'), empty: t('panel.group.ship.empty'), items: fitted },
    { label: t('panel.group.crew'), empty: t('panel.group.crew.empty'), items: crew },
  ];
}

/**
 * The contracts, taken and on offer.
 *
 * The offers are the interesting half and were unreachable before there was a
 * panel: the job board is a list on the planet, and a list is what a sheet is
 * for. Pressing one takes it on — which the engine settles by itself, with no
 * ruling to make and no model in the way.
 */
function jobGroups(engine, dict, state) {
  // Through the game's own `quest.desc.*` keys rather than a sentence assembled
  // here: a contract is an amount, a good and a system, and those three read
  // differently in the two languages the game ships. A kind with no description
  // of its own falls back to the name of the kind rather than to the key.
  const describe = (quest) => {
    const text = dict.renderMessage(`quest.desc.${quest.type}`, engine.questParams(state, quest));
    return short(text.startsWith('quest.desc.') ? dict.t(`quest.type.${quest.type}`) : text);
  };

  const taken = engine.activeQuests(state).map((quest) => {
    const ready = engine.canTurnIn(state, quest);
    return {
      label: describe(quest),
      note: ready
        ? t('panel.row.jobHere', { reward: digits(quest.reward) })
        : t('panel.row.job', { reward: digits(quest.reward), where: state.systems[quest.targetSystem]?.nameId ?? '' }),
      tone: ready ? 'good' : '',
      action: ready ? `turnin-${quest.id}` : '',
    };
  });

  const board = (engine.currentSystem(state).questBoard ?? []).map((quest) => {
    const problem = engine.boardQuestProblem(state, quest);
    return {
      label: describe(quest),
      note: problem
        ? t('panel.row.offer.problem', { reward: digits(quest.reward), problem: dict.t(problem) })
        : t('panel.row.offer', { reward: digits(quest.reward), where: state.systems[quest.targetSystem]?.nameId ?? '' }),
      tone: problem ? 'warn' : '',
      action: problem ? '' : `take-${quest.id}`,
    };
  });

  return [
    { label: t('panel.group.jobs'), empty: t('panel.group.jobs.empty'), items: taken },
    { label: t('panel.group.board'), empty: t('panel.group.board.empty'), items: board },
  ];
}

/**
 * What is being said here, and what has happened.
 *
 * A news item is a headline and a body under two separate keys — not a message
 * with parameters — which is worth stating because the screen that printed
 * these before read them as messages, called the dictionary with `undefined`
 * and threw on the first planet that had any news at all.
 */
function newsGroups(engine, dict, state) {
  const sys = engine.currentSystem(state);
  const news = (sys.news ?? []).map((item) => ({
    label: short(dict.t(item.headlineKey)),
    note: clip(dict.t(item.bodyKey)),
    tone: item.tone === 'bad' ? 'bad' : item.tone === 'good' ? 'good' : '',
  }));
  const log = (state.log ?? []).slice(0, LOG_ROWS).map((entry) => ({
    label: t('panel.row.log', { day: entry.day }),
    note: clip(dict.renderMessage(entry.key, entry.params)),
  }));
  return [
    { label: t('panel.group.news'), empty: t('panel.group.news.empty'), items: news },
    { label: t('panel.group.log'), empty: t('panel.group.log.empty'), items: log },
  ];
}

/**
 * Which door the sheet is open on.
 *
 * One list at a time. Everything at once is a screenful of eighteen commodities
 * followed by the ship, the contracts and the log, and a player who wanted to
 * know what ore fetches here has to find it.
 */
export function groupsFor(engine, dict, state, view) {
  if (view === 'ship') return shipGroups(engine, dict, state);
  if (view === 'jobs') return jobGroups(engine, dict, state);
  if (view === 'news') return newsGroups(engine, dict, state);
  return marketGroups(engine, dict, state);
}

/* ---------- the row of moves ---------- */

/**
 * What can be done from here, in the order the hotkeys land on it.
 *
 * The engine decides what is in the row, not the model and not a fixed list:
 * REFUEL is absent where there is no shipyard or the tank is full, because a
 * button that answers "there is no shipyard here" is a button that should not
 * have been drawn. The first nine get the digits `1`–`9` by position.
 */
export function moves(engine, state, { armedRestart = false } = {}) {
  if (isWrecked(state)) {
    return [
      { id: 'restart', label: t('move.restart.label'), hint: t('move.restart.hintOver'), tone: 'good' },
      { id: 'quit', label: t('move.quit.label'), hint: t('move.quit.hintOver') },
    ];
  }

  const list = [
    { id: 'market', label: t('move.market.label'), hint: t('move.market.hint') },
    { id: 'chart', label: t('move.chart.label'), hint: t('move.chart.hint') },
    { id: 'ship', label: t('move.ship.label'), hint: t('move.ship.hint') },
    { id: 'jobs', label: t('move.jobs.label'), hint: t('move.jobs.hint') },
    { id: 'news', label: t('move.news.label'), hint: t('move.news.hint') },
  ];

  const ship = state.ship;
  // Always true as the plugin flies — a run never leaves the capital's landing
  // field, and the engine reads a shipyard off exactly that. Asked anyway,
  // because it is the engine's rule for whether fuel can be bought at all, and
  // a button that costs nothing to withhold should not be drawn on an
  // assumption about somebody else's code.
  if (engine.hasShipyard(state)) {
    const wanted = engine.maxFuel(ship) - ship.fuel;
    if (wanted > 0) {
      const price = engine.fuelPricePerParsec(state);
      list.push({
        id: 'refuel',
        label: t('move.refuel.label'),
        hint: t('move.refuel.hint', { parsecs: wanted, price: digits(price), cost: digits(wanted * price) }),
        tone: ship.fuel <= 0 ? 'bad' : '',
      });
    }
    const damage = engine.maxHull(ship) - ship.hull;
    if (damage > 0) {
      const price = engine.repairPricePerUnit(state);
      list.push({
        id: 'repair',
        label: t('move.repair.label'),
        hint: t('move.repair.hint', { units: damage, price: digits(price), cost: digits(damage * price) }),
        tone: meterTone(ship.hull, engine.maxHull(ship)) === 'bad' ? 'bad' : '',
      });
    }
  }

  list.push({
    id: 'restart',
    label: t('move.restart.label'),
    hint: armedRestart ? t('move.restart.hintArmed', { commander: state.commanderName }) : t('move.restart.hint'),
    tone: armedRestart ? 'bad' : '',
  });
  list.push({ id: 'quit', label: t('move.quit.label'), hint: t('move.quit.hint') });
  return list;
}

/* ---------- the whole document ---------- */

/**
 * The run, as the panel shows it.
 *
 * Built from the save on every write rather than kept alongside it, for the
 * reason at the top of this file: two copies of a game diverge, and the one on
 * screen would be the one the player trusts.
 */
export function snapshot(engine, dict, state, options = {}) {
  const { sheetView = 'market', armedRestart = false, image = '', amount = null } = options;
  const sys = engine.currentSystem(state);
  const ship = state.ship;
  const wrecked = isWrecked(state);
  const maxHull = engine.maxHull(ship);
  const maxFuel = engine.maxFuel(ship);
  const bays = engine.totalCargoBays(ship);
  const shieldPower = engine.totalShieldPower(ship);
  const legs = reachable(engine, state);

  const meters = [
    { label: t('panel.meter.hull'), value: ship.hull, max: maxHull, accent: 'life', tone: meterTone(ship.hull, maxHull) },
  ];
  if (shieldPower > 0) {
    const charge = engine.currentShieldCharge(ship);
    meters.push({ label: t('panel.meter.shields'), value: charge, max: shieldPower, accent: 'mana', tone: meterTone(charge, shieldPower) });
  }
  meters.push({
    label: t('panel.meter.fuel'),
    value: ship.fuel,
    max: maxFuel,
    accent: 'vigour',
    tone: legs.length ? meterTone(ship.fuel, maxFuel) : 'bad',
  });
  meters.push({ label: t('panel.meter.hold'), value: engine.usedCargoBays(ship), max: bays, accent: 'growth' });
  // No maximum, because a run has no last day: drawn as a bare number, which is
  // what a date is.
  meters.push({ label: t('panel.meter.day'), value: state.day, accent: 'time' });

  const fields = [
    { label: t('panel.field.credits'), value: money(state.credits) },
    { label: t('panel.field.ship'), value: dict.shipName(ship.type) },
    { label: t('panel.field.range'), value: t('panel.field.rangeValue', { parsecs: engine.maxRange(state) }) },
    { label: t('panel.field.record'), value: dict.t(`standing.${engine.standing(state)}`), tone: engine.wantedByLaw(state) ? 'bad' : '' },
    {
      label: t('panel.field.inRange'),
      value: t('panel.field.inRangeValue', { n: legs.length }),
      tone: legs.length ? '' : 'bad',
    },
  ];
  if (state.debt > 0) fields.push({ label: t('panel.field.debt'), value: money(state.debt), tone: engine.wantedByBank(state) ? 'bad' : 'warn' });
  const jobs = engine.activeQuests(state);
  if (jobs.length) fields.push({ label: t('panel.field.jobs'), value: t('panel.field.jobsValue', { n: jobs.length }) });

  const tags = [];
  if (wrecked) tags.push({ label: t('panel.tag.over'), tone: 'bad' });
  if (engine.wantedByLaw(state)) tags.push({ label: t('panel.tag.wanted'), tone: 'bad' });
  if (!wrecked && !legs.length) tags.push({ label: t('panel.tag.stranded'), tone: 'bad' });
  if (!wrecked && fraction(ship.hull, maxHull) <= 0.25) tags.push({ label: t('panel.tag.breached'), tone: 'bad' });
  if (state.debt > 0) tags.push({ label: t('panel.tag.debt'), tone: engine.wantedByBank(state) ? 'bad' : 'warn' });
  if (ship.escapePod) tags.push({ label: t('panel.tag.pod'), tone: 'good' });
  if (state.insurance) tags.push({ label: t('panel.tag.insured'), tone: 'good' });
  if (sys.status && sys.status !== 'uneventful') tags.push({ label: dict.statusName(sys.status), tone: 'warn' });

  const document = {
    title: t('panel.title', { commander: state.commanderName, system: sys.nameId }),
    subtitle: wrecked
      ? t('panel.subtitle.over', { ship: dict.shipName(ship.type), system: sys.nameId, day: state.day })
      : t(sys.status && sys.status !== 'uneventful' ? 'panel.subtitle.situation' : 'panel.subtitle', {
        day: state.day,
        tech: techName(engine, dict, sys.techLevel),
        economy: economyName(engine, dict, sys),
        politics: dict.politicsName(sys.politics),
        situation: dict.statusName(sys.status),
      }),
    meters,
    fields,
    tags,
    groups: groupsFor(engine, dict, state, sheetView),
    actions: moves(engine, state, { armedRestart }),
    board: board(engine, dict, state, image),
  };

  /**
   * The amount field, when a commodity row has been pressed.
   *
   * A trade is a number, and a number is the one thing a row of buttons cannot
   * ask for. The field is drawn with the price and the ceiling in its label, so
   * the answer is given in front of the arithmetic rather than after it.
   */
  if (amount) document.entry = amountEntry(engine, dict, state, amount);
  return document;
}

/**
 * How many, and of what.
 *
 * The ceiling is worked out here and shown, because "as many as possible" means
 * two different things on the two sides of a trade — everything the credits and
 * the hold allow, or everything that is aboard.
 */
export function amountEntry(engine, dict, state, { kind, good }) {
  const sys = engine.currentSystem(state);
  const name = dict.goodName(good);
  if (kind === 'sell') {
    const price = sys.sellPrice?.[good] ?? 0;
    const held = state.ship.cargo?.[good] ?? 0;
    return {
      action: 'amount',
      label: t('panel.entry.amount.sell', { good: name, price: digits(price), max: held }),
      hint: t('panel.entry.amount.hint'),
      placeholder: String(held),
      value: String(held),
      submit: t('panel.entry.amount.submit'),
    };
  }
  const price = engine.marketBuyPrice(state, good);
  const most = affordable(engine, state, good);
  return {
    action: 'amount',
    label: t('panel.entry.amount.buy', { good: name, price: digits(price), max: most }),
    hint: t('panel.entry.amount.hint'),
    placeholder: String(most),
    value: String(most),
    submit: t('panel.entry.amount.submit'),
  };
}

/** As many as the credits and the hold allow. */
export function affordable(engine, state, good) {
  const price = engine.marketBuyPrice(state, good);
  const stock = engine.currentSystem(state).qty?.[good] ?? 0;
  if (!price) return 0;
  return Math.max(0, Math.min(engine.freeCargoBays(state.ship), stock, Math.floor(state.credits / price)));
}

/**
 * The panel while a commander is being made.
 *
 * Two steps and no more: the cards ask what they flew before, and one line asks
 * what to call them. The name is asked for in a field the game owns rather than
 * at the composer, for the reason the field exists at all — a name typed at the
 * composer is a message, a message reaches the model first, and a small model
 * asked to pass a word through sometimes answers it instead.
 */
export function setupScene(setup) {
  if (!setup.background) {
    return {
      title: t('setup.title'),
      subtitle: t('setup.subtitle.background'),
      cards: {
        label: t('setup.cards.label'),
        items: cardChoices().map((choice) => ({
          label: choice.label,
          note: choice.note,
          tone: choice.key === 'random' ? 'warn' : '',
          action: `background-${choice.key}`,
        })),
      },
    };
  }
  const chosen = backgroundName(setup.background);
  return {
    title: t('setup.title'),
    subtitle: t('setup.subtitle.name'),
    fields: [{ label: t('setup.field.background'), value: chosen, tone: 'good' }],
    entry: {
      action: 'name',
      label: t('setup.entry.label'),
      hint: t('setup.entry.hint', { background: chosen }),
      placeholder: t('setup.entry.placeholder'),
      submit: t('setup.entry.submit'),
    },
    // The same id as the field, so a player who dismissed it has the way back
    // that a dismissible window has to have.
    actions: [{ id: 'name', label: t('setup.name.button'), hint: t('setup.name.buttonHint') }],
  };
}
