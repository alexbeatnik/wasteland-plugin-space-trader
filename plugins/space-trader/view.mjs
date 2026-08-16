/**
 * The screens, as text.
 *
 * Space Trader on Palm drew a chart of stars and an encounter with a ship on
 * it, and the remake draws both in SVG. Neither can come here: the chat window
 * runs the app's own code and nothing else, so a plugin contributes no markup
 * and no script — an action's result is a string in a `<pre>` and a row of
 * buttons under it.
 *
 * That is less than a canvas and more than a log. A monospace block is a grid,
 * and a grid is a chart: the local starfield is drawn where the systems
 * actually are, from the same `x`/`y` the SVG uses. What it cannot be is
 * clickable, so every target on it is repeated as a button underneath.
 *
 * Everything here is pure — state in, string out — which is what lets the
 * tests drive it without a game running.
 */

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

export function credits(value) {
  return `${Number(value ?? 0).toLocaleString('en-US')} cr`;
}

/**
 * The local starfield.
 *
 * Only what the ship could reach plus what has been seen, because the chart is
 * a decision — where to go next — and 140 systems is not one. The current
 * system is always at the centre, and the scale is the jump range, so the edge
 * of the drawing is the edge of the tank.
 *
 * A cell holds one glyph, and where two systems land on the same cell the
 * nearer one wins: overprinting would draw a star that is not there.
 */
export function chart(engine, state, { width = CHART_W, height = CHART_H } = {}) {
  const here = engine.currentSystem(state);
  const range = Math.max(1, engine.maxRange(state));
  const reachable = new Set(engine.reachableSystems(state).map((s) => s.id));

  const shown = state.systems.filter((sys) => {
    const distance = engine.systemDistance(here, sys);
    return distance <= range * 1.35 && (sys.visited || reachable.has(sys.id) || sys.id === here.id);
  });

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
  lines.push('@ you   O visited, in range   o in range   . seen');
  return lines.join('\n');
}

/** Systems the ship can actually reach, nearest first — the chart's legend. */
export function destinations(engine, state, limit = 8) {
  const here = engine.currentSystem(state);
  return engine
    .reachableSystems(state)
    .filter((sys) => sys.id !== here.id)
    .map((sys) => ({
      sys,
      fuel: engine.fuelCost(state, sys.id),
      distance: engine.systemDistance(here, sys),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/** One line describing a system, as much as has been learned about it. */
export function systemLine(sys, { known = true } = {}) {
  if (!known && !sys.visited) return `${pad(sys.nameId, 12)}  unvisited`;
  return `${pad(sys.nameId, 12)}  tech ${sys.techLevel}  ${pad(sys.economyType, 11)} ${sys.politics}`;
}

/**
 * The market, as the table the game shows.
 *
 * Prices the planet does not offer are left blank rather than zeroed: a zero in
 * a price column reads as free, and "not sold here" is the more useful fact.
 */
export function market(engine, state, t) {
  const sys = engine.currentSystem(state);
  const ship = state.ship;
  const rows = [
    `${pad('COMMODITY', 14)}${num('AVAIL', 6)}${num('BUY', 7)}${num('SELL', 7)}${num('HOLD', 6)}`,
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
      pad(t(`good.${id}`), 14) +
        num(buy ? available : '—', 6) +
        num(buy || '—', 7) +
        num(sell || '—', 7) +
        num(held || '—', 6),
    );
  }

  const bays = engine.totalCargoBays(ship);
  rows.push('─'.repeat(40));
  rows.push(`hold ${engine.usedCargoBays(ship)}/${bays}   ${credits(state.credits)}`);
  return rows.join('\n');
}

/** Where the ship is, what it is, and what it is carrying. */
export function status(engine, state, t) {
  const sys = engine.currentSystem(state);
  const ship = state.ship;
  const fuel = engine.maxFuel(ship);
  const hull = engine.maxHull(ship);

  const lines = [
    `${state.commanderName} — day ${state.day}`,
    `docked at ${sys.nameId}   tech ${sys.techLevel}   ${sys.economyType}   ${sys.politics}`,
    sys.status && sys.status !== 'uneventful' ? `local situation: ${t(`status.${sys.status}`)}` : '',
    '',
    `${pad(t(`shipType.${ship.type}`) || ship.type, 14)} hull ${meter(ship.hull, hull)} ${ship.hull}/${hull}`,
    `${pad('fuel', 14)}      ${meter(ship.fuel, fuel)} ${ship.fuel}/${fuel} parsecs`,
    `${pad('hold', 14)}      ${engine.usedCargoBays(ship)}/${engine.totalCargoBays(ship)} bays`,
    `${pad('credits', 14)}      ${credits(state.credits)}${state.debt ? `   debt ${credits(state.debt)}` : ''}`,
  ].filter((line) => line !== '');

  const cargo = engine.GOOD_IDS.filter((id) => (ship.cargo?.[id] ?? 0) > 0);
  if (cargo.length) {
    lines.push('', 'in the hold:');
    for (const id of cargo) {
      const held = ship.cargo[id];
      const paid = state.buyingPrice?.[id] ?? 0;
      const here = engine.currentSystem(state).sellPrice?.[id] ?? 0;
      const margin = here && paid ? `  sells here at ${here} (paid ${Math.round(paid / Math.max(1, held))})` : '';
      lines.push(`  ${pad(t(`good.${id}`), 14)} ${num(held, 3)}${margin}`);
    }
  }
  return lines.join('\n');
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
export function briefing(engine, state) {
  const sys = engine.currentSystem(state);
  const ship = state.ship;
  const cargo = engine.GOOD_IDS.filter((id) => (ship.cargo?.[id] ?? 0) > 0)
    .map((id) => `${id} ${ship.cargo[id]}`)
    .join(', ');

  return [
    'SPACE TRADER — a game is in progress.',
    `Commander ${state.commanderName}, day ${state.day}, ${state.credits} cr` +
      (state.debt ? `, debt ${state.debt} cr` : ''),
    `Docked at ${sys.nameId} (tech ${sys.techLevel}, ${sys.economyType}, ${sys.politics})`,
    `Ship ${ship.type}: hull ${ship.hull}/${engine.maxHull(ship)}, fuel ${ship.fuel}/${engine.maxFuel(ship)} parsecs, ` +
      `hold ${engine.usedCargoBays(ship)}/${engine.totalCargoBays(ship)}`,
    cargo ? `Carrying: ${cargo}` : 'Hold empty.',
    `In range: ${destinations(engine, state, 6)
      .map((d) => `${d.sys.nameId} (${d.fuel})`)
      .join(', ') || 'nowhere — out of fuel'}`,
  ].join('\n');
}

/** The engine answers in message keys; this is what turns a batch into prose. */
export function messages(list, t) {
  return (list ?? [])
    .map((entry) => (typeof entry === 'string' ? entry : t(entry.key, entry.params)))
    .filter(Boolean)
    .join('\n');
}
