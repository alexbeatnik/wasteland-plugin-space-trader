/**
 * Save slots, kept as files.
 *
 * The plugin's own document already holds the run being played, and that is an
 * autosave in everything but name — every purchase and every jump writes it.
 * What it cannot hold is a *second* run: `ctx.state` is one JSON document
 * against a 1 MB ceiling, and a galaxy of 140 systems stringifies to about
 * 250 KB. Two of them fit; six do not. So slots live in the plugin's data
 * directory as one file each, which is where the desktop Space Trader keeps
 * them too.
 *
 * `ctx.dataDir()` and not the installed tree: that one is deleted and rewritten
 * on every update, and a save somebody made last month has to survive a version
 * bump.
 *
 * Everything that touches the disk answers rather than throws — a slot that
 * cannot be read is a row on the panel saying so, not a game that stops
 * working.
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** How many the player may fill in. Six is what the desktop game offers. */
export const SLOT_IDS = ['1', '2', '3', '4', '5', '6'];

/** Bumped when this envelope changes shape — never for the game inside it. */
const FORMAT = 1;

/** A slot id that arrived from a pressed button is not to be trusted into a path. */
export function isSlot(value) {
  return SLOT_IDS.includes(String(value ?? ''));
}

function dir(dataDir) {
  return join(dataDir, 'saves');
}

function fileFor(dataDir, slot) {
  return join(dir(dataDir), `slot-${slot}.json`);
}

/**
 * What a slot says about itself without the game being parsed.
 *
 * The panel draws six rows and none of them needs a galaxy: a commander, a day,
 * what they were flying and where they were. Written beside the state rather
 * than derived from it, so listing the slots costs six small reads instead of
 * six 250 KB parses.
 */
export function metaOf(engine, state) {
  return {
    commander: state.commanderName,
    day: state.day,
    credits: state.credits,
    ship: state.ship.type,
    system: engine.currentSystem(state).nameId,
    savedAt: Date.now(),
  };
}

/** Every slot, in order, whether or not there is anything in it. */
export function list(dataDir) {
  let present = new Set();
  try {
    present = new Set(readdirSync(dir(dataDir)));
  } catch {
    // No saves directory yet is the ordinary case, not a fault.
  }
  return SLOT_IDS.map((slot) => {
    if (!present.has(`slot-${slot}.json`)) return { slot, meta: null };
    try {
      const held = JSON.parse(readFileSync(fileFor(dataDir, slot), 'utf8'));
      // A file from a newer build may hold a state this one cannot read. Shown
      // as unreadable rather than loaded into a half-understood game.
      if (!held || held.format > FORMAT || typeof held.save !== 'string') return { slot, meta: null, unreadable: true };
      return { slot, meta: held.meta ?? null };
    } catch {
      return { slot, meta: null, unreadable: true };
    }
  });
}

/**
 * Write one, and answer whether it went.
 *
 * The game goes in as the same string the document holds, so a slot is a copy
 * of the autosave rather than a second serialisation that could disagree with
 * it.
 */
export function write(dataDir, slot, { save, meta }) {
  if (!isSlot(slot) || typeof save !== 'string') return false;
  try {
    mkdirSync(dir(dataDir), { recursive: true });
    writeFileSync(fileFor(dataDir, slot), JSON.stringify({ format: FORMAT, meta, save }));
    return true;
  } catch {
    return false;
  }
}

/** Read one back, or null if there is nothing there to read. */
export function read(dataDir, slot) {
  if (!isSlot(slot)) return null;
  try {
    const held = JSON.parse(readFileSync(fileFor(dataDir, slot), 'utf8'));
    if (!held || held.format > FORMAT || typeof held.save !== 'string') return null;
    // Parsed here so a corrupt game is caught before it replaces the run on
    // screen, rather than at the next repaint with no way back.
    JSON.parse(held.save);
    return held;
  } catch {
    return null;
  }
}

/** Throw one away. */
export function remove(dataDir, slot) {
  if (!isSlot(slot)) return false;
  try {
    rmSync(fileFor(dataDir, slot), { force: true });
    return true;
  } catch {
    return false;
  }
}
