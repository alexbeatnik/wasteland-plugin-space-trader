/**
 * The screens, as text.
 *
 * There is a drawn panel now — bars, a star chart with pressable systems, lists
 * behind a sheet — and this is deliberately still here. The panel is the
 * instrument board: it is current, it is glanceable, and it is gone the moment
 * the game is closed. The transcript is the record. A market table printed into
 * the conversation is still there twenty turns later when somebody wants to
 * know what ore fetched at Nyle, and it is the only form of the game a model can
 * be shown at all.
 *
 * So the two are not rivals: the panel answers "what is true now", the text
 * answers "what happened, and what did it cost". Both are built from the same
 * save, which is what stops them describing two different runs.
 *
 * Everything here is pure — state in, string out — which is what lets the tests
 * drive it without a game running. `dict` is the *game's* dictionary, bundled
 * with the engine; `t` is the plugin's own. See the note in `words.mjs`.
 */
import { credits as money, group as digits, t } from './words.mjs';

/** Column width of a drawn chart, in characters. */
const CHART_W = 44;
/** Rows. Half the columns, because a character cell is about twice as tall. */
const CHART_H = 17;

/** Right-align a number in a column, so a table of prices reads as a table. */
function num(value, width) {
  return String(value).padStart(width);
}

function pad(text, width) {
  const value = String(text ?? '');
  return value.length >= width ? value.slice(0, width) : value + ' '.repeat(width - value.length);
}

/** A bar for a value out of a maximum: fuel, hull, shields. */
export function meter(value, max, width = 10) {
  if (!(max > 0)) return '';
  const filled = Math.max(0, Math.min(width, Math.round((value / max) * width)));
  return `[${'#'.repeat(filled)}${'.'.repeat(width - filled)}]`;
}

/**
 * The tech level's name, which the game indexes by id rather than by number.
 *
 * Exported because the panel needs the same answer, and two copies of a lookup
 * that falls back on a missing key is two places for it to fall back
 * differently.
 */
export function techName(engine, dict, level) {
  const id = engine.TECH_LEVEL_IDS[level];
  const name = id ? dict.techLevelName(id) : '';
  return name && !name.startsWith('tech.') ? name : String(level);
}

export function economyName(engine, dict, sys) {
  const name = dict.economyName(sys.economyType);
  return name && !name.startsWith('economy.') ? name : sys.economyType;
}

/**
 * What to call a place inside a star system.
 *
 * The capital planet is what anybody means by the system's name, so it keeps it
 * plain; everything else is the system plus a Roman numeral for its orbit, or
 * the station's trade. The same rule the app's own map follows, deliberately: a
 * moon that is "Nyle IV" on one screen and "the ice moon" on another is two
 * places as far as the person reading is concerned.
 *
 * Here rather than in `panel.mjs` for the reason `techName` is here: the screen
 * and the panel have to call a place the same thing, and two copies of a naming
 * rule are two places for it to drift.
 */
export function bodyName(dict, sys, body) {
  if (!body || body.kind === 'planet') return sys.nameId;
  if (body.kind === 'station') return `${sys.nameId} ${dict.stationShortName(body.station ?? 'science')}`;
  return `${sys.nameId} ${dict.orbitNumeral(body.orbit)}`;
}

/** What a place *is*: the capital, a station's trade, or the rock it is. */
export function bodyKind(dict, body) {
  if (!body || body.kind === 'planet') return dict.t('body.capital');
  if (body.kind === 'station') return dict.stationName(body.station ?? 'science');
  return dict.terrainName(body.terrain ?? 'rockyMoon');
}

/** What comes out of a site, named the way the market names it. */
export function siteYield(dict, site) {
  if (!site) return '';
  return site.resource === 'fuel' ? t('system.fuel') : dict.goodName(site.resource);
}

/**
 * The local starfield.
 *
 * The neighbourhood rather than the galaxy, because the chart is a decision —
 * where to go next — and 140 systems is not one. The current system is always
 * at the centre, and the scale is the jump range, so the edge of the drawing is
 * a little past the edge of a full tank.
 *
 * Everything inside that window is drawn, reachable or not, visited or not. The
 * window is sized by the tank rather than by what is left in it, so what the
 * chart holds does not change as the fuel burns down — the glyph does, and
 * that is the honest way round: an empty tank is a chart of stars you cannot
 * currently afford, not a chart of four stars.
 *
 * A cell holds one glyph, and where two systems land on the same cell the
 * nearer one wins: overprinting would draw a star that is not there.
 */
export function chart(engine, state, { width = CHART_W, height = CHART_H } = {}) {
  const here = engine.currentSystem(state);
  const range = Math.max(1, engine.maxRange(state));
  const reachable = new Set(engine.reachableSystems(state).map((s) => s.id));

  const shown = state.systems.filter((sys) => engine.systemDistance(here, sys) <= range * 1.35);

  const grid = Array.from({ length: height }, () => Array(width).fill(' '));
  const claimed = new Map();

  for (const sys of shown) {
    // Scaled so the reachable circle fills the drawing rather than a dot in the
    // middle of it. Y is halved on top of that: a character cell is about twice
    // as tall as it is wide, and without it the field comes out an ellipse.
    const dx = (sys.x - here.x) / (range * 1.35);
    const dy = (sys.y - here.y) / (range * 1.35);
    const col = Math.round((width - 1) / 2 + (dx * (width - 1)) / 2);
    const row = Math.round((height - 1) / 2 + (dy * (height - 1)) / 2);
    if (col < 0 || col >= width || row < 0 || row >= height) continue;

    const key = `${row},${col}`;
    const distance = engine.systemDistance(here, sys);
    const held = claimed.get(key);
    if (held && held.distance <= distance) continue;
    claimed.set(key, { sys, distance });

    grid[row][col] =
      sys.id === here.id ? '@' : reachable.has(sys.id) ? (sys.visited ? 'O' : 'o') : sys.visited ? '.' : '·';
  }

  const rule = '─'.repeat(width);
  const lines = [`┌${rule}┐`];
  for (const row of grid) lines.push(`│${row.join('')}│`);
  lines.push(`└${rule}┘`);
  lines.push(t('screen.chart.legend'));
  return lines.join('\n');
}

/**
 * Systems the ship can actually reach, nearest first — the chart's legend.
 *
 * A wormhole is marked, because the fuel figure beside it is a lie: the engine
 * charges a toll in credits for that leg and no fuel at all. It only turns up
 * in this list when the far end happens to be inside the tank's range as well,
 * which is rare and was rarer still to notice — a jump that spent nothing.
 */
export function destinations(engine, state, limit = 8) {
  const here = engine.currentSystem(state);
  return engine
    .reachableSystems(state)
    .filter((sys) => sys.id !== here.id)
    .map((sys) => ({
      sys,
      fuel: engine.fuelCost(state, sys.id),
      distance: engine.systemDistance(here, sys),
      wormhole: here.wormholeTo === sys.id,
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/**
 * Everywhere in this system, printed.
 *
 * A list rather than a drawing, and that is not laziness. The star chart is a
 * field of stars where the *positions* are the information — which way, how
 * far — and forty-four columns of characters can carry that. A solar system is
 * four or five places on rings around one star, where the position tells you
 * almost nothing and what matters is what is on each one: days out, a yard, a
 * seam of ore. Drawn at this size it would be four dots and a smudge; written
 * out it is a decision.
 *
 * The panel draws the rings, where there are pixels to do it with.
 */
export function bodies(engine, dict, state) {
  const sys = engine.currentSystem(state);
  const here = engine.currentBodyIndex(state);
  const rows = [];
  for (const body of engine.systemBodies(sys)) {
    const site = engine.bodyMineSite(sys, body);
    const what = [bodyKind(dict, body)];
    if (site) what.push(t('screen.system.yields', { resource: siteYield(dict, site) }));
    rows.push(
      `  ${pad(bodyName(dict, sys, body), 16)} ${pad(
        body.id === here ? t('screen.system.here') : t('screen.system.days', { n: engine.transitDaysTo(state, body.id) }),
        14,
      )} ${what.join(', ')}`,
    );
  }
  return rows.join('\n');
}

/**
 * The market, as the table the game shows.
 *
 * Prices the planet does not offer are left blank rather than zeroed: a zero in
 * a price column reads as free, and "not sold here" is the more useful fact.
 */
export function market(engine, dict, state) {
  const sys = engine.currentSystem(state);
  const ship = state.ship;
  const rows = [
    pad(t('screen.market.commodity'), 14) +
      num(t('screen.market.avail'), 6) +
      num(t('screen.market.buy'), 7) +
      num(t('screen.market.sell'), 7) +
      num(t('screen.market.held'), 6),
    '─'.repeat(40),
  ];

  for (const id of engine.GOOD_IDS) {
    const available = sys.qty?.[id] ?? 0;
    const buy = sys.buyPrice?.[id] ?? 0;
    const sell = sys.sellPrice?.[id] ?? 0;
    const held = ship.cargo?.[id] ?? 0;
    // A good nobody here trades and none of which is aboard is not a row worth
    // a line: eighteen goods is a screenful, and most planets deal in ten.
    if (!buy && !sell && !held) continue;
    rows.push(
      pad(dict.goodName(id), 14) +
        num(buy ? available : '—', 6) +
        num(buy || '—', 7) +
        num(sell || '—', 7) +
        num(held || '—', 6),
    );
  }

  const bays = engine.totalCargoBays(ship);
  rows.push('─'.repeat(40));
  rows.push(t('screen.market.foot', { used: engine.usedCargoBays(ship), total: bays, credits: money(state.credits) }));
  return rows.join('\n');
}

/** Where the ship is, what it is, and what it is carrying. */
export function status(engine, dict, state) {
  const sys = engine.currentSystem(state);
  const ship = state.ship;
  const fuel = engine.maxFuel(ship);
  const hull = engine.maxHull(ship);

  const lines = [
    t('screen.status.head', { commander: state.commanderName, day: state.day }),
    t('screen.status.docked', {
      system: sys.nameId,
      tech: sys.techLevel,
      economy: economyName(engine, dict, sys),
      politics: dict.politicsName(sys.politics),
    }),
    sys.status && sys.status !== 'uneventful' ? t('screen.status.situation', { situation: dict.statusName(sys.status) }) : '',
    engine.hasSpaceport(state)
      ? ''
      : t('screen.status.away', {
        place: bodyName(dict, sys, engine.currentBody(state)),
        kind: bodyKind(dict, engine.currentBody(state)),
      }),
    engine.currentMineSite(state)
      ? t('screen.status.mine', { resource: siteYield(dict, engine.currentMineSite(state)) })
      : '',
    '',
    `${pad(dict.shipName(ship.type), 14)} ${pad(t('screen.status.hull'), 5)} ${meter(ship.hull, hull)} ${ship.hull}/${hull}`,
    `${pad(t('screen.status.fuel'), 14)}       ${meter(ship.fuel, fuel)} ${t('screen.status.parsecs', { fuel: ship.fuel, max: fuel })}`,
    `${pad(t('screen.status.hold'), 14)}       ${t('screen.status.bays', { used: engine.usedCargoBays(ship), total: engine.totalCargoBays(ship) })}`,
    `${pad(t('screen.status.credits'), 14)}       ${money(state.credits)}${state.debt ? `   ${t('screen.status.debt', { amount: money(state.debt) })}` : ''}`,
  ].filter((line) => line !== '');

  const cargo = engine.GOOD_IDS.filter((id) => (ship.cargo?.[id] ?? 0) > 0);
  if (cargo.length) {
    lines.push('', t('screen.status.cargo'));
    for (const id of cargo) {
      const held = ship.cargo[id];
      // The average paid for one unit, which is what the engine keeps here.
      // Dividing it by the hold as well — which this did — turned five units
      // bought at 46 into "paid 9".
      const paid = state.buyingPrice?.[id] ?? 0;
      const here = sys.sellPrice?.[id] ?? 0;
      const margin = here && paid
        ? `  ${t('screen.status.cargoLine', { price: digits(here), paid: digits(paid) })}`
        : '';
      lines.push(`  ${pad(dict.goodName(id), 14)} ${num(held, 3)}${margin}`);
    }
  }
  return lines.join('\n');
}

/**
 * The prices, for the model rather than for the screen.
 *
 * The table above is drawn for a person and is nearly useless as feedback: it
 * is columns of spaces, and the model is not shown it at all. Without this the
 * model has the position and no prices, which is the one combination that
 * cannot answer "what should I carry" — and what it does instead is invent. A
 * real session produced advice to trade "ореній", which is not a commodity in
 * this game, and then told the user to press a "Show Market" button that did
 * not exist, because from where the model sat there had to be one somewhere.
 *
 * Sent only for the turn that asked for the market, never in the briefing:
 * eighteen goods every turn of every conversation is exactly the sort of thing
 * the context budget is for.
 *
 * Deliberately in ids and English rather than in the player's language: this is
 * read by a model and then handed back as `buy 10 water`, and a round trip
 * through a translation is where "ore" becomes something the parser has never
 * heard of.
 */
export function marketDigest(engine, dict, state) {
  const sys = engine.currentSystem(state);
  const parts = [];
  for (const id of engine.GOOD_IDS) {
    const buy = sys.buyPrice?.[id] ?? 0;
    const sell = sys.sellPrice?.[id] ?? 0;
    const held = state.ship.cargo?.[id] ?? 0;
    if (!buy && !sell && !held) continue;
    const bits = [`${id}:`];
    if (buy) bits.push(t('screen.market.forSale', { price: buy, available: sys.qty?.[id] ?? 0 }));
    else bits.push(t('screen.market.notSold'));
    if (sell) bits.push(t('screen.market.sellsFor', { price: sell }));
    else bits.push(t('screen.market.notBought'));
    if (held) bits.push(t('screen.market.inHold', { held }));
    parts.push(bits.join(' '));
  }
  const head = t('screen.market.prices', {
    system: sys.nameId,
    tech: sys.techLevel,
    economy: economyName(engine, dict, sys),
  });
  return `${head}\n${parts.join('\n')}`;
}

/* ---------- one market against the others in range ---------- */

/**
 * How many markets the comparison holds.
 *
 * The tank is the real ceiling and it rarely reaches more than a handful of
 * places this run has been to. This is the printed table's own: a dozen
 * destinations is a spreadsheet, and what the screen is for is a decision.
 */
const COMPARE_SYSTEMS = 8;

/**
 * The markets in range this run has actually been to.
 *
 * Only visited ones, and that is the whole honesty of it: the engine knows what
 * every system in the galaxy pays and the run does not. Quoting a price from a
 * planet nobody has flown to would be handing over what the player has not
 * earned — the chart says "never visited" about those for exactly the same
 * reason, and the market's own deck has always priced its cards this way.
 */
export function knownMarkets(engine, state, limit = COMPARE_SYSTEMS) {
  return destinations(engine, state, 64).filter((leg) => leg.sys.visited).slice(0, limit);
}

/** Where a commodity pays most, of those markets. */
export function bestMarketFor(good, legs) {
  let best = null;
  for (const leg of legs) {
    const price = leg.sys.sellPrice?.[good] ?? 0;
    if (price > 0 && (!best || price > best.price)) best = { price, sys: leg.sys, fuel: leg.fuel };
  }
  return best;
}

/**
 * The comparison itself, as one entry per commodity worth comparing.
 *
 * Pure and exported, because three things ask this question — the printed
 * table, what the model is told, and the list behind the panel's sheet — and
 * three copies of "where does this pay more" is three places for them to
 * answer differently. The whole file exists for that reason.
 *
 * `here` is what this planet does about the commodity, and which side of the
 * trade that is depends on the hold: cargo aboard is weighed against what this
 * planet bids for it, and everything else against what it costs to pick up.
 * `margin` is what a bay is worth carrying rather than settling for here, and
 * it is `null` rather than zero where there is nothing to compare — a planet
 * that does not buy furs has not offered a poor price for them.
 */
export function priceLeads(engine, dict, state, legs = null) {
  const markets = legs ?? knownMarkets(engine, state);
  const sys = engine.currentSystem(state);
  const leads = [];

  for (const id of engine.GOOD_IDS) {
    const aboard = state.ship.cargo?.[id] ?? 0;
    const stock = sys.qty?.[id] ?? 0;
    const costs = stock > 0 ? engine.marketBuyPrice(state, id) : 0;
    // Neither in the hold nor on the shelf here: there is no move to compare,
    // and eighteen commodities is a screenful of rows that are not one.
    if (aboard <= 0 && costs <= 0) continue;

    const carrying = aboard > 0;
    const here = carrying ? sys.sellPrice?.[id] ?? 0 : costs;
    const best = bestMarketFor(id, markets);
    leads.push({
      id,
      good: dict.goodName(id),
      carrying,
      aboard,
      stock,
      here,
      best,
      margin: best && here > 0 ? best.price - here : null,
    });
  }

  // Best first, and the rows with nothing to compare last rather than mixed in
  // among the losses: "nobody here buys it" is not a worse deal than a deal, it
  // is the absence of one.
  return leads.sort((a, b) => (b.margin ?? -Infinity) - (a.margin ?? -Infinity));
}

/** What one commodity's row says, on whichever side of the trade it is. */
function leadNote(lead) {
  const parts = [];
  if (lead.carrying) {
    parts.push(t('screen.compare.aboard', { n: lead.aboard }));
    parts.push(lead.here > 0 ? t('screen.compare.bid', { price: digits(lead.here) }) : t('screen.compare.noBid'));
  } else {
    parts.push(t('screen.compare.costs', { price: digits(lead.here), stock: lead.stock }));
  }
  parts.push(lead.best
    ? t('screen.compare.best', {
      system: lead.best.sys.nameId,
      price: digits(lead.best.price),
      fuel: lead.best.fuel,
    })
    : t('screen.compare.nowhere'));
  if (lead.margin !== null) {
    parts.push(lead.margin > 0
      ? t('screen.compare.up', { margin: money(lead.margin) })
      : lead.margin < 0
        ? t('screen.compare.down', { margin: money(-lead.margin) })
        : t('screen.compare.level'));
  }
  return parts.join(' · ');
}

/**
 * This planet's prices against everywhere in range, printed.
 *
 * What a trader is actually doing is comparing two markets, and until now the
 * only place that comparison existed was the six cards the deck deals: the top
 * of the answer, with no way to see the rest of it and nothing a model could
 * read. This is the whole of it, and it is a screen rather than a panel because
 * it is the sort of thing worth scrolling back to twenty turns later, when the
 * question is what ore was fetching at Nyle.
 *
 * Three blocks, in the order the decisions come: what the hold is worth if it
 * is carried rather than sold here, what is worth picking up here, and the
 * markets themselves with the best single run to each. An empty one is left out
 * rather than printed as a heading with nothing under it.
 */
export function compare(engine, dict, state) {
  const sys = engine.currentSystem(state);
  const inRange = destinations(engine, state, 64);
  const markets = knownMarkets(engine, state);
  const head = t('screen.compare.head', { system: sys.nameId, n: markets.length });

  if (!inRange.length) return `${head}\n\n${t('screen.compare.stranded')}`;
  if (!markets.length) return `${head}\n\n${t('screen.compare.nothingKnown')}`;

  const leads = priceLeads(engine, dict, state, markets);
  const lines = [head];
  const unseen = inRange.length - markets.length;
  if (unseen > 0) lines.push(t('screen.compare.unvisited', { n: unseen }));

  for (const [heading, rows] of [
    ['screen.compare.hold', leads.filter((lead) => lead.carrying)],
    ['screen.compare.buy', leads.filter((lead) => !lead.carrying)],
  ]) {
    if (!rows.length) continue;
    lines.push('', t(heading));
    for (const lead of rows) lines.push(`  ${pad(lead.good, 14)}${leadNote(lead)}`);
  }

  lines.push('', t('screen.compare.markets'));
  for (const leg of markets) {
    // The leads are already best first, so the first one pointing at a system
    // is the best run there is to it.
    const run = leads.find((lead) => lead.best?.sys.id === leg.sys.id && (lead.margin ?? 0) > 0);
    const about = t('screen.compare.marketRow', {
      fuel: leg.fuel,
      tech: leg.sys.techLevel,
      economy: economyName(engine, dict, leg.sys),
    });
    const run_ = run ? t('screen.compare.bestRun', { good: run.good, margin: money(run.margin) }) : t('screen.compare.noRun');
    lines.push(`  ${pad(leg.sys.nameId, 14)}${about} · ${run_}`);
  }

  lines.push('', t('screen.compare.foot'));
  return lines.join('\n');
}

/**
 * The same comparison, for the model.
 *
 * Sent on the turn that asked for it and never in the briefing, for the reason
 * `marketDigest` gives: a table of prices on every turn of every conversation
 * is exactly what the context budget is for. In ids, so what comes back out of
 * the model is `buy 10 water` and not a commodity the parser has never heard
 * of.
 *
 * It carries the screen's caveat in as many words, because a model told only
 * the prices answers as though it also knew the ones it was not told: these are
 * the systems this run has been to, and the rest are unknown.
 */
export function compareDigest(engine, dict, state) {
  const sys = engine.currentSystem(state);
  const markets = knownMarkets(engine, state);
  if (!markets.length) return t('screen.compare.digest.none', { system: sys.nameId });

  const rows = priceLeads(engine, dict, state, markets)
    .filter((lead) => lead.best)
    .map((lead) => t('screen.compare.digest.row', {
      id: lead.id,
      side: lead.carrying
        ? t('screen.compare.digest.carrying', { n: lead.aboard, here: lead.here || 0 })
        : t('screen.compare.digest.onSale', { here: lead.here }),
      system: lead.best.sys.nameId,
      price: lead.best.price,
      fuel: lead.best.fuel,
      margin: lead.margin === null ? t('screen.compare.digest.noMargin') : lead.margin,
    }));

  return [
    t('screen.compare.digest.head', {
      system: sys.nameId,
      systems: markets.map((leg) => `${leg.sys.nameId} (${leg.fuel})`).join(', '),
    }),
    ...rows,
  ].join('\n');
}

/**
 * What the model is told about the position, every turn.
 *
 * Deliberately not the market table. This is recomputed and re-sent on every
 * single turn, it is counted against the context window, and a conversation
 * that is not about the game pays for it too — so it is the smallest thing that
 * still lets the model answer "where am I, and can I afford that". The tables
 * are what the actions are for.
 */
export function briefing(engine, dict, state) {
  const sys = engine.currentSystem(state);
  const ship = state.ship;
  const cargo = engine.GOOD_IDS.filter((id) => (ship.cargo?.[id] ?? 0) > 0)
    .map((id) => `${id} ${ship.cargo[id]}`)
    .join(', ');
  const inRange = destinations(engine, state, 6)
    .map((d) => `${d.sys.nameId} (${d.wormhole ? t('brief.wormhole') : d.fuel})`)
    .join(', ');

  /**
   * Where in the system, and what is under the ship — when there is anything
   * to say about either.
   *
   * Both lines are silent for a run sitting on the capital's landing field with
   * nothing to dig, which is most turns of most runs, so the ordinary game pays
   * nothing for them. They are not optional when they are true: a model that
   * does not know the ship is four days out on a belt advises on a market that
   * is not there, and one that does not know the belt is a belt never mentions
   * the ore the hold could be filling with.
   */
  const body = engine.currentBody(state);
  const site = engine.currentMineSite(state);

  return [
    t('brief.head'),
    state.debt
      ? t('brief.commanderDebt', { commander: state.commanderName, day: state.day, credits: state.credits, debt: state.debt })
      : t('brief.commander', { commander: state.commanderName, day: state.day, credits: state.credits }),
    t('brief.docked', {
      system: sys.nameId,
      tech: sys.techLevel,
      economy: economyName(engine, dict, sys),
      politics: dict.politicsName(sys.politics),
    }),
    engine.hasSpaceport(state)
      ? ''
      : t('brief.away', {
        place: bodyName(dict, sys, body),
        kind: bodyKind(dict, body),
        system: sys.nameId,
        n: engine.transitDaysTo(state, 0),
      }),
    site ? t('brief.mine', { resource: siteYield(dict, site) }) : '',
    t('brief.ship', {
      ship: dict.shipName(ship.type),
      hull: ship.hull,
      maxHull: engine.maxHull(ship),
      fuel: ship.fuel,
      maxFuel: engine.maxFuel(ship),
      used: engine.usedCargoBays(ship),
      total: engine.totalCargoBays(ship),
    }),
    cargo ? t('brief.carrying', { cargo }) : t('brief.empty'),
    inRange ? t('brief.inRange', { systems: inRange }) : t('brief.stranded'),
  ].filter(Boolean).join('\n');
}

/**
 * The facts a run opens on, written out for the model to retell.
 *
 * The model used to be told to "say so briefly" about a new game and given the
 * commander's name and nothing else — no system, no ship, no fuel — and a model
 * holding a hole that size fills it. The opening is composed here, out of the
 * run itself, and the model only retells it.
 *
 * The position comes from `briefing()` rather than being written out again,
 * because a run can be introduced late: pressing a button before the model has
 * said anything makes the move first, and an opening that had "day 1" and the
 * starting purse baked into it would then be describing a game that had already
 * moved on. Only what cannot change — who is flying, and what they are flying —
 * is stated here.
 */
export function openingBrief(engine, dict, state, background) {
  return `${t('brief.opening', {
    commander: state.commanderName,
    background,
    bays: engine.totalCargoBays(state.ship),
  })}
${briefing(engine, dict, state)}`;
}

/** The engine answers in message keys; this is what turns a batch into prose. */
export function messages(list, dict) {
  return (list ?? [])
    .map((entry) => (typeof entry === 'string' ? entry : dict.renderMessage(entry.key, entry.params)))
    .filter(Boolean)
    .join('\n');
}
