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
import { bodyKind, bodyName, economyName, siteYield, techName } from './view.mjs';
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
 * What the host allows a title or a subtitle to be.
 *
 * Eighty characters, and the panel's subtitle is five facts about a planet
 * joined with middots — which fits in English and does not in Ukrainian:
 * "день 2 · Постіндустріальний · Високотехнологічна · Корпоративна держава ·
 * Епідемія" is eighty-two, and the host cut the last word in half. Cut here
 * instead, at a space, with an ellipsis that says a word was dropped.
 */
const MAX_TITLE = 80;
const heading = (text) => clip(text, MAX_TITLE);
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
 *
 * Which is why the window is the whole neighbourhood and not the tank. It used
 * to hold what the fuel reached plus the systems this run had already been to,
 * and that is a chart that empties out exactly when it is needed: fly in on
 * fumes and the stars a hop away — the ones the next tank of fuel buys —
 * vanished, because a place nobody has been to yet had nothing to draw it for.
 * They are drawn now, unpressable and labelled as out of range, and the
 * drawing only changes when the ship moves.
 */
export function board(engine, dict, state, image = '') {
  const here = engine.currentSystem(state);
  const range = Math.max(1, engine.maxRange(state));
  const reach = range * CHART_REACH;
  const inRange = new Map(reachable(engine, state).map((entry) => [entry.sys.id, entry]));

  // The wormhole's far end is pulled in from wherever it lies: it is a
  // destination that can be pressed, and the range is not what explains it.
  const near = ({ sys, distance }) =>
    sys.id === here.id || inRange.has(sys.id) || here.wormholeTo === sys.id || distance <= reach;
  // Ranked before it is cut, so the host's ceiling takes a star off the rim
  // rather than somewhere the ship could be flying to this minute.
  const rank = ({ sys }) => (sys.id === here.id ? 0 : inRange.has(sys.id) || here.wormholeTo === sys.id ? 1 : 2);

  const shown = state.systems
    .map((sys) => ({ sys, distance: engine.systemDistance(here, sys) }))
    .filter(near)
    .sort((a, b) => rank(a) - rank(b) || a.distance - b.distance)
    .slice(0, MAX_POINTS);

  // Whether the system the ship is in is worth looking inside. Always, as the
  // galaxy is generated — but a save written before there were bodies has one
  // planet and a star, and a button promising a map of that is a button that
  // lies.
  const inside = engine.systemBodies(here).length > 1;

  const points = shown.map(({ sys, distance }) => {
    const leg = inRange.get(sys.id);
    const wormhole = here.wormholeTo === sys.id;
    const note = sys.id === here.id
      ? inside ? t('board.hereSystem') : t('board.here')
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
          : sys.visited
            ? t('board.seen', { distance: Math.round(distance) })
            : t('board.seenUnknown', { distance: Math.round(distance) });

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
      // Pressing where you already are is the way *in*: the chart is the
      // galaxy at arm's length, and the system under the ship is the one place
      // on it that has anything else to show.
      action: sys.id === here.id
        ? (inside ? 'system' : '')
        : leg || wormhole ? `warp-${sys.id}` : '',
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

/* ---------- the system ---------- */

/**
 * A place in the system, in the line under its name.
 *
 * What it is, what it costs to get there, and what is there when you arrive —
 * in that order, because the first is what it is called and the last is the
 * reason to go. The services are named rather than implied: "no market away
 * from the spaceport" is a rule the engine holds and the panel has to say out
 * loud, or a hold full of ore looks like a market that has stopped working.
 */
export function bodyNote(engine, dict, state, body) {
  const sys = engine.currentSystem(state);
  const here = body.id === engine.currentBodyIndex(state);
  const site = engine.bodyMineSite(sys, body);
  // The kind is on the line either way: "docked here" says where the ship is
  // and nothing about what it is parked on.
  const parts = here
    ? [t('board.body.here'), bodyKind(dict, body)]
    : [bodyKind(dict, body), t('board.body.transit', { n: engine.transitDaysTo(state, body.id) })];
  if (body.kind === 'planet') parts.push(t('board.body.port'));
  if (body.kind === 'station') parts.push(t('board.body.yard'));
  if (site) parts.push(t(here ? 'board.body.mineHere' : 'board.body.mine', { resource: siteYield(dict, site) }));
  if (!site && body.kind === 'barren') parts.push(t('board.body.nothing'));
  return parts.join(' · ');
}

/**
 * The star system, as the board draws it.
 *
 * The other half of the chart, and the reason the two share one board: they are
 * the same question at two scales — where can this ship go, and what is there
 * when it arrives. The star sits at the centre with everything else out on its
 * orbit, squashed to about half height so the system reads as a plane seen at
 * an angle rather than as a target.
 *
 * Nothing here is out of range. A warp drive is dead weight this deep in a
 * star's gravity well, so crossing a system is done on impulse and costs days
 * rather than fuel — which means every marker is pressable, and what a marker
 * has to say is what those days buy.
 *
 * The one that is not is the body the ship is already at: standing still is not
 * a course. It carries the mining instead, when there is anything under it,
 * which is where the app's own map puts it too.
 */
export function systemBoard(engine, dict, state, image = '') {
  const sys = engine.currentSystem(state);
  const bodies = engine.systemBodies(sys);
  const hereIndex = engine.currentBodyIndex(state);
  const outer = Math.max(1, ...bodies.map((body) => body.orbit ?? 1));

  const points = [{
    id: 'star',
    label: dict.t('systemMap.star', { class: dict.starClassName(sys.starClass ?? 'yellow') }),
    note: dict.t('systemMap.bodies', { count: bodies.length }),
    x: 50,
    y: 50,
    here: false,
    tone: 'warn',
    action: '',
  }];

  for (const body of bodies) {
    const here = body.id === hereIndex;
    const site = engine.bodyMineSite(sys, body);
    const angle = (body.angle ?? 0) * Math.PI * 2;
    const radius = ((body.orbit ?? 1) / outer) * 44;
    points.push({
      id: `body-${body.id}`,
      label: bodyName(dict, sys, body),
      note: bodyNote(engine, dict, state, body),
      x: Math.max(2, Math.min(98, 50 + Math.cos(angle) * radius)),
      // Halved on top of that, for the reason the star chart halves it: a
      // marker is wider than it is tall, and a true circle of them comes out
      // looking like an ellipse anyway.
      y: Math.max(2, Math.min(98, 50 + Math.sin(angle) * radius * 0.52)),
      here,
      tone: here ? '' : site ? 'good' : '',
      action: here ? (site ? 'mine' : '') : `fly-${body.id}`,
    });
  }

  // Routes rather than orbits: the same thing the lines mean on the star chart,
  // drawn from where the ship is to everywhere it could put its nose instead.
  const links = bodies
    .filter((body) => body.id !== hereIndex)
    .map((body) => ({ from: `body-${hereIndex}`, to: `body-${body.id}`, tone: 'good' }));

  return { image, points: points.slice(0, MAX_POINTS), links };
}

/* ---------- the deck ---------- */

/**
 * The market as a hand of cards, and why it is not the table.
 *
 * The table is a reference: eighteen rows of four columns, correct and mute. It
 * tells you what water costs here and says nothing about whether to buy any,
 * which is the only question a trader is actually asking. Answering it means
 * knowing two things the table has never held — what the hold already cost, and
 * what the systems in range pay — and neither fits in a column.
 *
 * So a card is one commodity with the decision worked out: what it costs here,
 * where the best price in range is, how much fuel that costs, and what the
 * difference comes to a unit. Nothing on it is a secret: every price quoted is
 * from a system this run has already visited, which is exactly what the player
 * could work out by hand from the chart and their own memory.
 *
 * Eight at most, because the host draws eight, and that turns out to be the
 * right shape anyway — a hand of choices rather than a spreadsheet.
 *
 * Six of them are deals. The other two are the ways out: the whole table, and
 * leaving. That was seven and one until 2.4.0, when the eighth card had to be
 * found somewhere — see `marketCards`.
 */
const DEAL_CARDS = 6;
/**
 * How far under the usual price is worth a card of its own.
 *
 * Only ever asked of a card that has no destination to name, where the whole
 * argument is the discount. Thirteen credits off a two hundred credit good is
 * not an argument, and seven cards making it in the same words was the deck's
 * first draft: a wall of identical prose with two numbers moving in it.
 */
const WORTH_SAYING = 0.05;

/** Systems the tank reaches whose prices this run has actually seen. */
function knownMarkets(engine, state) {
  return reachable(engine, state).filter((leg) => leg.sys.visited);
}

/** Where in range pays most for this, of the places the run has been. */
function bestDestination(good, legs) {
  let best = null;
  for (const leg of legs) {
    const price = leg.sys.sellPrice?.[good] ?? 0;
    if (price > 0 && (!best || price > best.price)) best = { price, sys: leg.sys, fuel: leg.fuel };
  }
  return best;
}

/**
 * What is worth doing here, best first.
 *
 * Three questions in order, and only the last of them is arithmetic.
 *
 * `can` — could this be pressed right now? A commodity worth 400 a bay that
 * the credits will not stretch to one of is worth knowing about and is not
 * worth the top of the deck.
 *
 * `sure` — is the number on it a remembered price or an argument? A destination
 * this run has actually visited beats a guess about where the thing might sell,
 * however good the guess looks.
 *
 * `score` — what a bay of it is worth. Buying and selling compete here on one
 * number, so a sale clearing 40 a unit outranks a purchase that might clear 12,
 * and a load bought at the wrong price sinks to where it belongs. A bay is the
 * scarce thing, which is why the measure is per bay and not per credit.
 */
export function deals(engine, dict, state, { pictures = {}, limit = DEAL_CARDS } = {}) {
  const sys = engine.currentSystem(state);
  const legs = knownMarkets(engine, state);
  const found = [];

  for (const id of engine.GOOD_IDS) {
    const held = state.ship.cargo?.[id] ?? 0;
    const bid = sys.sellPrice?.[id] ?? 0;
    if (held > 0 && bid > 0) {
      // What a unit of it cost. `buyingPrice` is already the average paid for
      // one — the engine keeps it that way, dividing the running total by the
      // hold on every purchase — so dividing again here is dividing twice, and
      // it was: five units bought at 46 came back as "paid 9", and a card
      // selling them at 44 read as 35 a unit of profit on a two-credit loss.
      // Cargo that was never bought — plundered, or delivered on a contract —
      // costs nothing, and a full-price sale is exactly what it is worth.
      const paid = state.buyingPrice?.[id] ?? 0;
      const margin = bid - paid;
      found.push({
        kind: 'sell',
        id,
        // Cargo aboard, at a planet that buys it: always something you can do.
        can: 1,
        sure: 1,
        score: margin,
        label: dict.goodName(id),
        note: t('deal.sell', {
          held,
          price: digits(bid),
          margin: margin > 0
            ? t('deal.sell.up', { margin: money(margin) })
            : margin < 0
              ? t('deal.sell.down', { margin: money(-margin) })
              : t('deal.sell.flat'),
        }),
        tone: margin > 0 ? 'good' : margin < 0 ? 'bad' : '',
      });
      // One card per commodity, and the sale takes it: "sell your medicine" and
      // "you cannot afford medicine" side by side is the same word twice and a
      // slot spent on it.
      continue;
    }

    const price = engine.marketBuyPrice(state, id);
    const stock = sys.qty?.[id] ?? 0;
    if (!price || stock <= 0) continue;
    const most = affordable(engine, state, id);
    const best = bestDestination(id, legs);

    if (best) {
      const margin = best.price - price;
      found.push({
        kind: 'buy',
        id,
        can: most > 0 ? 1 : 0,
        sure: 1,
        score: margin,
        label: dict.goodName(id),
        note: t('deal.buy', {
          price: digits(price),
          room: most > 0 ? t('deal.room', { most }) : t('deal.broke'),
          system: best.sys.nameId,
          sells: digits(best.price),
          fuel: best.fuel,
          margin: money(margin),
        }),
        tone: margin <= 0 ? 'warn' : most > 0 ? 'good' : '',
      });
      continue;
    }

    /**
     * Nowhere in range has been visited, which is most of the first hour.
     *
     * Naming a price at a system nobody has been to would be the panel handing
     * over what the run has not earned — the chart says "never visited" about
     * those systems for the same reason. So the card falls back on two things
     * that are honestly known here: what this commodity usually goes for on a
     * planet like this one, which is a function of the tech level, economy and
     * politics printed at the top of the panel; and which way it wants to be
     * carried, which is a fact about the commodity and never changes.
     *
     * Only when it is under the usual price. A card saying "this is dear and
     * you have no idea who wants it" is not a deal, and the deck is short by a
     * card, which is itself the answer.
     */
    const usual = engine.standardPrice(engine.TRADE_GOODS[id], sys);
    const discount = usual - price;
    if (!usual || discount < price * WORTH_SAYING) continue;
    const slope = engine.TRADE_GOODS[id].pricePerTech ?? 0;
    found.push({
      kind: 'buy',
      id,
      can: most > 0 ? 1 : 0,
      sure: 0,
      score: discount,
      label: dict.goodName(id),
      note: t('deal.buy.blind', {
        price: digits(price),
        room: most > 0 ? t('deal.room', { most }) : t('deal.broke'),
        margin: money(discount),
        carry: slope > 0 ? t('deal.carry.up') : slope < 0 ? t('deal.carry.down') : t('deal.carry.flat'),
      }),
      tone: most > 0 && discount > 0 ? '' : 'warn',
    });
  }

  found.sort((a, b) => (b.can - a.can) || (b.sure - a.sure) || (b.score - a.score));
  return found.slice(0, limit).map((deal) => ({
    label: deal.label,
    note: deal.note,
    image: pictures[deal.id] ?? '',
    tone: deal.tone,
    action: `deal-${deal.kind}-${deal.id}`,
  }));
}

/**
 * The deck, with two ways out of it on the end.
 *
 * The chooser is the app's *question* dialog and it is built like one: no close
 * button, no Escape, no dismissing it by clicking away, and the row's digits go
 * dead while it is up. That is right for "who are you flying", which is what it
 * was made for. It is wrong for a market, which is a shop — and the first
 * version of this deck was a trap because of it. The way out was supposed to be
 * THE WHOLE TABLE, on the argument that a deck used as a reference has to carry
 * its own answer; it was not one. `{sheet: true}` opens the sheet *over* the
 * chooser without closing it, so shutting the sheet again put the player back
 * on the deck with nothing else to press. There was no way to leave a market
 * without buying something.
 *
 * What actually closes the dialog is a scene with no `cards` in it — the app
 * hides it the moment one arrives. So the deck is drawn only while it is open,
 * `deckOpen` in `main.mjs` says whether it is, and both of the last two cards
 * put it down: one on the way to the table, one on the way out.
 */
export function marketCards(engine, dict, state, options = {}) {
  const items = deals(engine, dict, state, options);
  // Said once on the deck rather than on every card in it. Six cards each
  // ending "nowhere in range has been visited yet" is one fact repeated six
  // times, and it crowded out the two numbers that actually differed.
  const blind = items.length > 0 && knownMarkets(engine, state).length === 0;
  items.push({ label: t('deal.table.label'), note: t('deal.table.note'), action: 'deal-table' });
  // Last, so it is where a hand of cards ends rather than where it starts, and
  // never cut: the host keeps the first eight, and this deck is eight.
  items.push({ label: t('deal.leave.label'), note: t('deal.leave.note'), action: 'deal-close' });
  return {
    label: t(blind ? 'deal.label.blind' : 'deal.label', { system: engine.currentSystem(state).nameId }),
    items,
  };
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
    // Already the average paid for one unit — see the note in `deals()`.
    const paid = state.buyingPrice?.[id] ?? 0;
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
/**
 * The slots, as one list that is pressed to save or to load.
 *
 * Two modes and one list, because six slots drawn twice is twelve rows of the
 * same six things. `mode` decides only what a press does and what the note
 * under each row says it will do — which is the honest way round: a slot with a
 * commander in it reads the same whichever button opened it.
 *
 * An empty slot cannot be loaded and a full one warns before it is written
 * over. Neither is arming, because there is no digit to hit by accident here —
 * these are rows in a dialog, not the row above the composer.
 */
export function saveGroups(dict, slots, { mode = 'load', running = false } = {}) {
  const items = slots.map(({ slot, meta, unreadable }) => {
    const filled = Boolean(meta);
    const note = unreadable
      ? t('saves.row.unreadable')
      : filled
        ? t('saves.row.held', {
          commander: meta.commander,
          day: meta.day,
          system: meta.system,
          ship: dict.shipName(meta.ship),
          credits: money(meta.credits),
        })
        : t('saves.row.empty');

    // What a press would do, said before it is pressed. A slot with somebody in
    // it is written over, and that is worth a word of its own.
    const can = mode === 'save' ? running : filled && !unreadable;
    return {
      label: t('saves.row.label', { n: slot }),
      note: can ? `${note} — ${t(mode === 'save' ? (filled ? 'saves.row.overwrite' : 'saves.row.write') : 'saves.row.load')}` : note,
      tone: unreadable ? 'bad' : filled ? 'good' : '',
      action: can ? `${mode === 'save' ? 'save' : 'load'}-${slot}` : '',
    };
  });

  const groups = [{
    label: t(mode === 'save' ? 'saves.group.save' : 'saves.group.load'),
    empty: t('saves.group.empty'),
    items,
  }];

  // Deleting is its own list rather than a third button on every row: it is the
  // one thing here that cannot be undone, and it should not sit under the
  // cursor of somebody aiming at LOAD.
  const filled = slots.filter((entry) => entry.meta || entry.unreadable);
  groups.push({
    label: t('saves.group.clear'),
    empty: t('saves.group.clear.empty'),
    items: filled.map(({ slot, meta }) => ({
      label: t('saves.row.label', { n: slot }),
      note: meta ? t('saves.row.deleteHeld', { commander: meta.commander, day: meta.day }) : t('saves.row.delete'),
      tone: 'warn',
      action: `delete-${slot}`,
    })),
  });
  return groups;
}

export function groupsFor(engine, dict, state, view, { slots = [], running = true } = {}) {
  if (view === 'ship') return shipGroups(engine, dict, state);
  if (view === 'jobs') return jobGroups(engine, dict, state);
  if (view === 'news') return newsGroups(engine, dict, state);
  if (view === 'save' || view === 'load') return saveGroups(dict, slots, { mode: view, running });
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
export function moves(engine, dict, state, { armedRestart = false, boardView = 'chart' } = {}) {
  if (isWrecked(state)) {
    return [
      { id: 'restart', label: t('move.restart.label'), hint: t('move.restart.hintOver'), tone: 'good' },
      { id: 'quit', label: t('move.quit.label'), hint: t('move.quit.hintOver') },
    ];
  }

  /**
   * The row is where the ship is, not where the run started.
   *
   * The market, the bank, the hiring hall and the job board are the capital
   * planet's spaceport, and the engine refuses all four anywhere else. A button
   * that exists to be refused is worse than no button: it reads as the game
   * being broken rather than as the ship being parked on a rock.
   */
  const port = engine.hasSpaceport(state);
  const site = engine.currentMineSite(state);
  const list = [];
  if (port) list.push({ id: 'market', label: t('move.market.label'), hint: t('move.market.hint') });
  // One key for both maps, because there is only one board to draw them on and
  // ten moves is one more than there are digits. It is labelled with what
  // pressing it will show rather than with what is up, which is the way every
  // other toggle in the app reads.
  list.push(boardView === 'system'
    ? { id: 'chart', label: t('move.chart.label'), hint: t('move.chart.hint') }
    : { id: 'system', label: t('move.system.label'), hint: t('move.system.hint') });
  list.push({ id: 'ship', label: t('move.ship.label'), hint: t('move.ship.hint') });
  if (port) list.push({ id: 'jobs', label: t('move.jobs.label'), hint: t('move.jobs.hint') });
  list.push({ id: 'news', label: t('move.news.label'), hint: t('move.news.hint') });

  /**
   * MINE, where mining is what the ship came for.
   *
   * Only away from the spaceport, and that is a room decision as much as a
   * sense one: at the capital the row is already nine moves deep with fuel and
   * repairs on it, and a tenth would be a move with no digit. Out on a rock
   * there is nothing else to press — and at a planet with workings of its own
   * the marker on the system map is still there to press, which is where the
   * app's own map keeps mining anyway.
   */
  if (site && !port) {
    list.push({
      id: 'mine',
      label: t('move.mine.label'),
      hint: t('move.mine.hint', { resource: siteYield(dict, site) }),
      tone: 'good',
    });
  }

  const ship = state.ship;
  // The planet's own yard, or a station's. Not a rock: nothing out there sells
  // fuel or straightens hull plate, and the engine says so before the credits
  // are counted.
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
  const {
    sheetView = 'market', armedRestart = false, image = '', pictures = {},
    amount = null, deck = false, slots = [], boardView = 'chart',
  } = options;
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
  // Not a misfortune, but it is why half the row is missing: the market, the
  // bank, the hiring hall and the job board are all the planet's spaceport.
  if (!wrecked && !engine.hasSpaceport(state)) tags.push({ label: t('panel.tag.away'), tone: 'warn' });

  const document = {
    // Where the ship actually is, which is not always the planet the system is
    // named after: a run parked on a belt four days out should not be titled as
    // though it were sitting on the landing field.
    title: t('panel.title', { commander: state.commanderName, system: bodyName(dict, sys, engine.currentBody(state)) }),
    subtitle: heading(wrecked
      ? t('panel.subtitle.over', { ship: dict.shipName(ship.type), system: sys.nameId, day: state.day })
      : t(sys.status && sys.status !== 'uneventful' ? 'panel.subtitle.situation' : 'panel.subtitle', {
        day: state.day,
        tech: techName(engine, dict, sys.techLevel),
        economy: economyName(engine, dict, sys),
        politics: dict.politicsName(sys.politics),
        situation: dict.statusName(sys.status),
      })),
    meters,
    fields,
    tags,
    groups: groupsFor(engine, dict, state, sheetView, { slots, running: !wrecked }),
    actions: moves(engine, dict, state, { armedRestart, boardView }),
    /**
     * One board, two maps.
     *
     * The galaxy and the system are the same question at two scales, and the
     * host draws one board — so they take turns on it rather than competing
     * for the row. Which one is up is where the player last looked, and it
     * survives a repaint for the same reason the open sheet does.
     */
    board: boardView === 'system' ? systemBoard(engine, dict, state, image) : board(engine, dict, state, image),
    /**
     * The deck, while it is open and there is a market to deal from.
     *
     * A wrecked ship is not shopping, and a planet that trades in nothing has
     * no hand to deal. `deck` is the third condition and the one that closes
     * it: the chooser has no close button of its own, and a scene arriving
     * without cards is what the app takes for "that question is over".
     */
    cards: wrecked || !deck ? null : marketCards(engine, dict, state, { pictures }),
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
 * The panel with the game put away.
 *
 * What QUIT used to leave behind was nothing at all — `scene.clear()`, a blank
 * strip, and typing at the composer as the only way back into a run that was
 * still saved. That is the one thing the panel exists to spare you, and it made
 * the button read as "destroy this" to anybody who had not tried it.
 *
 * So closing leaves a door instead of a wall: the run it was closed on, named
 * and dated so it is plainly still there, and the two things that can be done
 * from outside a game — go back into that one, or start another. There is no
 * QUIT here, because this is what quitting arrives at.
 *
 * A wrecked run is still offered, and deliberately: the game-over panel is
 * where the log and the last position are read, and a commander who died on
 * day 300 is worth looking at before the next one launches.
 */
export function menuScene(engine, dict, state, { armedRestart = false, slots = [], sheetView = 'load' } = {}) {
  const wrecked = state ? isWrecked(state) : false;
  const fields = [];
  const actions = [];

  if (state) {
    fields.push({ label: t('menu.field.commander'), value: state.commanderName });
    fields.push({ label: t('menu.field.day'), value: digits(state.day) });
    fields.push({ label: t('menu.field.system'), value: engine.currentSystem(state).nameId });
    fields.push({ label: t('menu.field.ship'), value: dict.shipName(state.ship.type) });
    fields.push({ label: t('menu.field.credits'), value: money(state.credits) });
    actions.push({
      id: 'resume',
      label: t('menu.resume.label'),
      hint: wrecked
        ? t('menu.resume.hintOver')
        : t('menu.resume.hint', { commander: state.commanderName, day: state.day }),
      tone: wrecked ? '' : 'good',
    });
  }

  // Armed on the second press for the same reason the row inside a running
  // game is: the app puts the digits on by position, `2` is easy to hit by
  // accident, and the run under it is hours of trading. Nothing to arm when
  // there is no save, because then there is nothing to lose.
  actions.push({
    id: 'restart',
    label: t('move.restart.label'),
    hint: !state
      ? t('menu.restart.hint')
      : armedRestart
        ? t('menu.restart.hintArmed', { commander: state.commanderName })
        : t('menu.restart.hintSaved'),
    tone: !state ? 'good' : armedRestart ? 'bad' : '',
  });

  return {
    title: t('menu.title'),
    subtitle: state
      ? t(wrecked ? 'menu.subtitle.over' : 'menu.subtitle.saved', { day: state.day })
      : t('menu.subtitle.none'),
    fields,
    tags: wrecked ? [{ label: t('panel.tag.over'), tone: 'bad' }] : [],
    /**
     * The slots, behind the sheet, here as well as in a running game.
     *
     * This is the panel with nothing being played, which is exactly when LOAD
     * GAME is pressed — so the list it opens has to exist here. Saving is
     * offered too and refuses every row, because a slot cannot be written from
     * a game that is not running and the note on the row is where that is said.
     */
    groups: saveGroups(dict, slots, { mode: sheetView === 'save' ? 'save' : 'load', running: false }),
    actions,
  };
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
export function setupScene(setup, { canCancel = false } = {}) {
  if (!setup.background) {
    /**
     * A card to walk away by, when there is something to walk back to.
     *
     * The chooser is the app's question dialog: no close button, no Escape, and
     * the way out has to be one of the answers. NEW GAME does not throw the old
     * run away until a name is sent, so without this the button was a one-way
     * door — press it by mistake with a hundred days behind you and the only
     * way back was to type at the composer.
     *
     * A card and not a move on the row, deliberately: the app throws a chooser
     * open by itself only when the scene offers no moves at all, and one move
     * here would mean the question never opened.
     */
    const items = cardChoices().map((choice) => ({
      label: choice.label,
      note: choice.note,
      tone: choice.key === 'random' ? 'warn' : '',
      action: `background-${choice.key}`,
    }));
    if (canCancel) {
      items.push({ label: t('setup.keep.label'), note: t('setup.keep.note'), action: 'setup-cancel' });
    }
    return {
      title: t('setup.title'),
      subtitle: t('setup.subtitle.background'),
      cards: { label: t('setup.cards.label'), items },
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
    // that a dismissible window has to have — and, while there is still a run
    // in the document, the way out of the whole question.
    actions: canCancel
      ? [
        { id: 'name', label: t('setup.name.button'), hint: t('setup.name.buttonHint') },
        { id: 'setup-cancel', label: t('setup.keep.label'), hint: t('setup.keep.note') },
      ]
      : [{ id: 'name', label: t('setup.name.button'), hint: t('setup.name.buttonHint') }],
  };
}
