/**
 * Space Trader, played in the chat window.
 *
 * The game itself is not here. `engine.mjs` is Pieter Spronck's economy as the
 * modern remake implements it — the galaxy, the market, the encounters —
 * bundled out of that project untouched, so a rule argued over there is the
 * rule here too. This file is the part that could not come with it: how a game
 * with a star chart and a gunfight is played through a transcript.
 *
 * It used to be played only through one. The app gave a plugin a string and a
 * row of buttons under a card, so every screen was a turn, a fight had to
 * resolve in one go because nothing could redraw between rounds, and the chart
 * was drawn in characters. That is all still here and still works. What is new
 * is the panel: the `scene` service gives a game bars, a sheet of lists, a
 * board with pressable systems and one field to type a number into, none of
 * which costs a turn or a token. Looking at the market is no longer a thing you
 * ask a language model to do for you.
 *
 * The division stayed the same, because it was never about what the app could
 * draw. The moves are the user's. The model reads the position every turn and
 * advises; it moves only what it was explicitly told to move, and it can no
 * more press a button than it can spend the credits behind one.
 */
import { readdirSync } from 'node:fs';
// A namespace rather than named imports: half of what it exports is called the
// same as something here — `moves`, `scene`, `current` — and `fight.moves()`
// says which one it is at every call site.
import * as fight from './fight.mjs';
import {
  affordable,
  backgroundFor,
  backgroundName,
  BACKGROUNDS,
  isWrecked,
  menuScene,
  setupScene,
  snapshot,
} from './panel.mjs';
import * as saves from './saves.mjs';
import { credits as money, group as digits, patterns, setLanguage, t } from './words.mjs';
import {
  bodies,
  bodyKind,
  bodyName,
  briefing,
  chart,
  destinations,
  market,
  marketDigest,
  messages,
  openingBrief,
  siteYield,
  status,
} from './view.mjs';

/** A line break, named because writing one as an escape here keeps going wrong. */
const BREAK = String.fromCharCode(10);
/** How many warp targets to put under a chart card. A list long enough to scroll is not a choice. */
const MAX_CHOICES = 8;
/** Log entries kept in the save. The game keeps every one; a save is not an archive. */
const KEEP_LOG = 60;
/**
 * Pictures the player put in the data directory: `chart.png` behind the star
 * chart, `good-water.jpg` on the card that offers to buy water. None is
 * shipped — the galaxy is generated afresh every run — so these are theirs.
 */
const PICTURE_TYPES = ['png', 'jpg', 'jpeg', 'webp', 'gif'];

/**
 * The buttons of a fight, and the moves they stand for.
 *
 * A table rather than a chain of ifs because the same ten moves arrive two
 * ways — pressed here, typed there — and the engine takes one vocabulary. The
 * ids carry a prefix so a stale press from a fight three jumps ago cannot land
 * on the market's row.
 */
const FIGHT_ACTIONS = {
  'fight-attack': 'attack',
  'fight-flee': 'flee',
  'fight-closeIn': 'closeIn',
  'fight-openRange': 'openRange',
  'fight-submit': 'submit',
  'fight-bribe': 'bribe',
  'fight-surrender': 'surrender',
  'fight-ignore': 'ignore',
  'fight-endTurn': 'endTurn',
  'fight-plunder': 'plunder',
};

/**
 * The same moves, typed.
 *
 * Everything on the row is a sentence as well — that promise is not suspended
 * because there is shooting. In order, because "close" and "closeIn" would
 * otherwise be decided by whichever pattern was tried first.
 */
const FIGHT_WORDS = [
  ['fight.attack', 'attack'],
  ['fight.flee', 'flee'],
  ['fight.closeIn', 'closeIn'],
  ['fight.openRange', 'openRange'],
  ['fight.submit', 'submit'],
  ['fight.bribe', 'bribe'],
  ['fight.surrender', 'surrender'],
  ['fight.ignore', 'ignore'],
  ['fight.plunder', 'plunder'],
  ['fight.endTurn', 'endTurn'],
];

/**
 * Which door the sheet is open on, and whether NEW GAME has been armed.
 *
 * Module scope rather than the save: both are where the player last looked, not
 * anything about the run, and a fresh start on the market after a restart is
 * the right answer rather than a lost one.
 */
let sheetView = 'market';
let armedRestart = false;
/**
 * Which map the board is drawing: the galaxy, or the system the ship is in.
 *
 * One board and two maps, so they take turns on it. Module scope for the same
 * reason the sheet is: it is where the player last looked. It goes back to the
 * chart on a jump, because arriving somewhere new is a question about the
 * galaxy — and because the system under the ship is a different system now.
 */
let boardView = 'chart';
/**
 * The trade waiting for a number.
 *
 * Set when a commodity row is pressed and cleared when the field answers. Also
 * module scope: a half-asked question is not part of a saved game, and a run
 * reopened tomorrow should not come back with a dialog open over it.
 */
let askingAmount = null;
/**
 * Whether the market's deck is on screen.
 *
 * The app's chooser is its *question* dialog: no close button, no Escape, no
 * dismissing it by clicking away, and the row's digits go dead while it is up.
 * A question earns that; a market does not, and the deck was a trap because of
 * it — every card either bought something or opened another dialog on top of
 * it, so there was no way to leave a market without buying.
 *
 * A scene with no `cards` in it is what the app takes for "that question is
 * over", so this is the flag that closes the thing: the deck is drawn while it
 * is true and left out while it is false. Module scope, like `sheetView`, for
 * the same reason — a dialog is where the player last looked and not part of
 * the run, and a game reopened tomorrow should not come back with one over it.
 */
let deckOpen = false;
/**
 * That question, but only where it was asked.
 *
 * There are two places a number is asked for now — the market on a planet and
 * a hauler's stall in the middle of a jump — and one variable holding the
 * question. A field left half-answered on a planet would otherwise be redrawn
 * over a gunfight and priced off the wrong side of it.
 */
const asking = (where) => {
  const trade = askingAmount?.kind === 'tradeBuy' || askingAmount?.kind === 'tradeSell';
  return (where === 'trade') === trade ? askingAmount : null;
};

export function activate(ctx) {
  /**
   * The engine and the dictionaries, loaded once and only when a game is
   * actually touched. Together they are 400 KB of parsed JavaScript, and a
   * session that never opens the game should not pay for it at boot.
   */
  let engine = null;
  let dict = null;

  /** The language, read live, so a change takes effect on the next turn. */
  const speak = () => {
    const code = ctx.store.get('language', 'en') === 'uk' ? 'uk' : 'en';
    setLanguage(code);
    dict?.setLocale(code);
    return code;
  };

  async function load() {
    if (!engine) {
      engine = await import('./engine.mjs');
      dict = await import('./i18n.mjs');
    }
    speak();
    return engine;
  }

  /**
   * A saved game out of the string that holds it.
   *
   * The game is held as a *string* inside the plugin's document rather than as
   * the object itself, because the store pretty-prints what it is given and a
   * galaxy of 140 systems indents to 425 KB against a 1 MB cap — with the log
   * and the quest list still to grow into it. Stringified first it is 249 KB
   * and stays there. The cost is a second parse, which is nothing next to
   * running out of room to save a game somebody is in the middle of.
   *
   * Its own function because there are two readers — the actions, through
   * `read()`, and the panel, through `paint()` — and the migration below has
   * to happen in both. It did not: the panel parsed the string itself, so a
   * run saved before there were star systems was drawn as one planet on the
   * map while typing "system" listed all four of its moons. Two readings of
   * one save is exactly what the rest of this file is arranged to prevent.
   */
  function unpack(save) {
    const state = JSON.parse(save);
    /**
     * Star systems, for a save written before there were any.
     *
     * The engine's own migration, and it has to be called by whoever loads a
     * game — nothing inside the engine calls it. A run saved by an older
     * build has systems with no bodies and no star, and every question about
     * where the ship is docked would answer "the capital" forever: the map
     * would draw one planet and mining would never find a seam. It is a
     * no-op the moment they are there, which is every save written since.
     */
    engine.ensureBodies(state.seed, state.systems ?? []);
    return state;
  }

  /** The run in the document, or nothing — and never a throw at the turn. */
  async function read() {
    const doc = await ctx.state.get();
    if (!doc?.save) return null;
    try {
      return unpack(doc.save);
    } catch (err) {
      ctx.log(`the saved game could not be read — ${err.message}`);
      return null;
    }
  }

  /** The game, packed the way the document holds it. */
  function pack(state) {
    // The engine keeps every line it ever logged, newest first. Worth showing,
    // not worth carrying forever: this is the one thing in a save with no
    // ceiling on it.
    return JSON.stringify({ ...state, log: (state.log ?? []).slice(0, KEEP_LOG) });
  }

  /** Write the document and put what was written on the panel, in that order. */
  async function save(document) {
    await ctx.state.set(document);
    await paint(document);
    return document;
  }

  /** The document with a game in it, keeping everything else the document held. */
  function withGame(doc, state, extra = {}) {
    return {
      ...doc,
      save: pack(state),
      day: state.day,
      commander: state.commanderName,
      ...extra,
    };
  }

  /**
   * The position, and what to say when there is no longer one.
   *
   * Every turn answers with two things: a `summary`, which is the card the
   * player reads, and a `feedback`, which is what the model is told about the
   * position it is advising on. Both of them used to be built by asking the
   * screen and the briefing directly, and neither of those knows the run can
   * end — a hull of 0/60 is a number like any other to them, and the briefing
   * goes on listing the systems in range of a ship that no longer exists.
   *
   * A fight fought from the panel costs no turn, so a commander can die
   * without a single line about it reaching the transcript. What the model has
   * to go on afterwards is exactly this feedback, and a briefing that reads
   * like an ordinary day is how it comes to answer that the game has no
   * fighting in it while the panel behind the answer says the ship was lost on
   * day three.
   *
   * So the question is asked here, once, the way `isWrecked` is asked once:
   * over means over at every door, whether the move was pressed or typed.
   */
  const position = (state) => (isWrecked(state) ? t('ui.dead') : status(engine, dict, state));
  /**
   * `lead` is whatever the turn wanted to say before the position — that the
   * market is on screen, that the save was opened again. It is dropped on a
   * wrecked run rather than printed above the ending, because those lines are
   * instructions about a game that is still being played: "give the user a
   * short briefing, then ask what they want to do next" is the wrong thing to
   * tell a model whose next sentence has to be that the commander is dead. An
   * account of what happened is not a lead and is not passed here — that still
   * goes in front of the answer, on a wrecked run most of all.
   */
  const note = (state, lead = '') => (isWrecked(state)
    ? t('note.dead')
    : `${lead ? `${lead}\n` : ''}${briefing(engine, dict, state)}`);

  /* ---------- the panel ---------- */

  /**
   * A picture under the chart, if the player put one there.
   *
   * None is shipped, deliberately: the markers, the names and the jump legs are
   * drawn by the app from the run's own data, and a painted starfield would be
   * showing a galaxy that is generated afresh every game. What a background can
   * do is make it pleasant, so any file the player drops in is used.
   *
   * `ctx.dataDir()` and not the plugin's own directory: that one is deleted and
   * rewritten on every update, and a picture somebody generated must survive a
   * version bump.
   */
  function pictures() {
    const found = { chart: '', goods: {} };
    try {
      // Read on every repaint rather than cached: dropping a file in should
      // work without restarting anything, and this is a directory listing.
      for (const name of readdirSync(ctx.dataDir())) {
        const dot = name.lastIndexOf('.');
        if (dot < 1 || !PICTURE_TYPES.includes(name.slice(dot + 1).toLowerCase())) continue;
        const stem = name.slice(0, dot).toLowerCase();
        if (stem === 'chart') found.chart ||= name;
        // `good-water.jpg`, and the id is the game's own: the same word the
        // moves are typed with, so a player naming a file has one vocabulary
        // to learn rather than two.
        else if (stem.startsWith('good-')) found.goods[stem.slice('good-'.length)] ||= name;
      }
    } catch {
      // No data directory yet is the ordinary case, not a fault.
    }
    return found;
  }

  let scene = null;

  async function paint(doc) {
    if (!scene || !engine) return;
    if (doc?.setup) {
      // A run still in the document is a run that can be gone back to, and the
      // chooser has to say so: nothing is thrown away until a name is sent.
      scene.show(setupScene(doc.setup, { canCancel: Boolean(doc.save) }));
      return;
    }
    if (!doc?.save) {
      scene.clear();
      return;
    }
    let state;
    try {
      // Through `unpack` rather than `JSON.parse`, so the panel and the actions
      // are looking at the same galaxy — see the note there.
      state = unpack(doc.save);
    } catch {
      scene.clear();
      return;
    }
    /**
     * Put away, not thrown away.
     *
     * The panel used to go blank here, which left the composer as the only way
     * back into a run that was sitting in the document untouched. A menu is the
     * honest drawing of that state: the game is not running, the save is still
     * there, and both of the things that can be done about it are a keypress
     * away.
     */
    if (doc.closed === true) {
      scene.show(menuScene(engine, dict, state, {
        armedRestart,
        slots: saves.list(ctx.dataDir()),
        sheetView,
      }));
      return;
    }
    // A fight takes the whole panel. There is no market where the shooting is,
    // and a row of moves offering one would be a row offering to leave.
    if (doc.fight && fight.current(doc.fight)) {
      scene.show(fight.scene(engine, dict, state, doc.fight, { amount: asking('trade') }));
      return;
    }
    const art = pictures();
    scene.show(snapshot(engine, dict, state, {
      sheetView,
      boardView,
      armedRestart,
      image: art.chart,
      pictures: art.goods,
      amount: asking('market'),
      deck: deckOpen,
      // Read on every repaint rather than cached: a slot written a moment ago
      // has to show as written, and this is six small files.
      slots: sheetView === 'save' || sheetView === 'load' ? saves.list(ctx.dataDir()) : [],
    }));
  }

  /* ---------- reading what the user asked for ---------- */

  /** Goods are matched by id and by name, in whichever language is set. */
  function findGood(text) {
    const wanted = text.trim().toLowerCase();
    if (!wanted) return null;
    for (const id of engine.GOOD_IDS) {
      if (id.toLowerCase() === wanted) return id;
      const name = dict.goodName(id).toLowerCase();
      if (name === wanted) return id;
    }
    // A prefix, so "narco" and "spring" reach the good they obviously mean.
    for (const id of engine.GOOD_IDS) {
      const name = dict.goodName(id).toLowerCase();
      if (id.toLowerCase().startsWith(wanted) || name.startsWith(wanted)) return id;
    }
    return null;
  }

  /** Systems are matched by name; the chart is where the names came from. */
  function findSystem(state, text) {
    const wanted = text.trim().toLowerCase();
    if (!wanted) return null;
    const all = state.systems;
    return (
      all.find((sys) => sys.nameId.toLowerCase() === wanted) ??
      all.find((sys) => sys.nameId.toLowerCase().startsWith(wanted)) ??
      null
    );
  }

  /**
   * A place inside this system, by whatever the player called it.
   *
   * Three vocabularies reach the same rock and all three are on the screen it
   * was read off: what it is called ("Nyle IV"), the numeral alone ("IV"), and
   * what it is ("ice moon", "the belt", "research"). Matched in that order,
   * because a name is exact and a kind is a guess — and there can be two ice
   * moons in one system, where the first one found is as good an answer as any
   * and better than a refusal.
   */
  function findBody(state, text) {
    // "cross to the ice moon" is how a person says it, and the article is not
    // part of anything's name.
    const wanted = text.trim().toLowerCase().replace(/^(the|a)\s+/, '');
    if (!wanted) return null;
    const sys = engine.currentSystem(state);
    const list = engine.systemBodies(sys);
    const named = (body) => bodyName(dict, sys, body).toLowerCase();
    const kind = (body) => bodyKind(dict, body).toLowerCase();
    return (
      list.find((body) => named(body) === wanted) ??
      list.find((body) => named(body).endsWith(` ${wanted}`)) ??
      list.find((body) => named(body).startsWith(wanted)) ??
      list.find((body) => kind(body) === wanted) ??
      list.find((body) => kind(body).includes(wanted)) ??
      null
    );
  }

  /* ---------- travelling, and whoever is out there ---------- */

  /**
   * What a fight nobody is pressing through falls back to.
   *
   * Running, and submitting to the police. Not a setting: there was one, called
   * "Met in transit", and it was a standing answer given before the jump to a
   * question that is different every time somebody stops you — the same mistake
   * the commander's name made before it moved onto a card. Where there is a
   * panel the question is asked at the moment it is answered, on two buttons
   * with the odds and both hulls beside them; this is only for the case where
   * there is nothing to press.
   */
  const FALLBACK_POSTURE = 'avoid';

  /**
   * A jump, up to the point where somebody intercepts it.
   *
   * The engine moves the ship, spends the day, rolls for what is met on the way
   * and leaves those encounters ongoing — so by the time this returns the ship
   * has arrived and the shooting has not started. Everything below decides who
   * does the shooting.
   */
  function beginJump(state, target) {
    const result = engine.warp(state, target.id);
    if (!result.ok) throw new Error(dict.t(result.error) || t('refuse.jumpRefused'));
    const system = state.systems[result.arrivedAt ?? target.id];
    const notes = [];
    if (result.incident) notes.push(dict.renderMessage(result.incident.bodyKey, result.incident.params));
    if (result.event) notes.push(dict.renderMessage(result.event.bodyKey, result.event.params));
    /**
     * A singularity, which the engine reports raw rather than as a story.
     *
     * `warp` answers with what happened — survived or not, the damage, the days
     * — and `blackHoleEvent` is the thing that turns it into a key and its
     * parameters. Read as though it were already an event it has no `bodyKey`,
     * and rendering `undefined` throws inside the dictionary: the jump then
     * came back as a refusal, with the ship still where it started and a
     * TypeError where the sentence should have been. Rare enough to look like
     * a flaky test — a black hole is a fraction of a percent of jumps.
     *
     * Whether the pod fired is the second half of the story and changes the
     * words: escaping in one is not the same ending as not escaping.
     */
    if (result.blackHole) {
      const story = engine.blackHoleEvent(result.blackHole, !result.blackHole.survived && Boolean(state.ship.escapePod));
      notes.push(dict.renderMessage(story.bodyKey, story.params));
    }
    const encounters = result.encounters ?? [];
    return { encounters, arrival: { system: system.nameId, notes, met: encounters.length } };
  }

  /**
   * A crossing inside the system, up to the point where somebody intercepts it.
   *
   * The same shape as a jump, deliberately: the engine moves the ship, spends
   * the days, rolls for what is met on the way and leaves the encounters
   * ongoing. What differs is the price. A warp drive is dead weight this deep
   * in a star's gravity well, so this runs on impulse — no fuel at all, and
   * days on the calendar instead, which is wages, interest and whatever a tired
   * crew does to a ship.
   *
   * The seed is the app's own, constant for constant. A save crossed here and
   * crossed there should meet the same people on the way: two front ends over
   * one engine is only an honest claim while the dice agree.
   */
  function beginTransit(state, bodyId) {
    const sys = engine.currentSystem(state);
    const rng = new engine.Rng((state.seed ^ (state.day * 2246822519) ^ ((bodyId + 1) * 40503)) >>> 0);
    const result = engine.travelToBody(state, bodyId, rng);
    if (!result.ok) throw new Error(dict.t(result.error) || t('refuse.crossingRefused'));
    const notes = [];
    if (result.incident) notes.push(dict.renderMessage(result.incident.bodyKey, result.incident.params));
    const encounters = result.encounters ?? [];
    return {
      encounters,
      arrival: {
        system: bodyName(dict, sys, engine.currentBody(state)),
        notes,
        met: encounters.length,
        key: encounters.length ? 'screen.dockedMet' : 'screen.docked',
        params: { n: result.days ?? 0 },
      },
    };
  }

  /**
   * A day's work at the site under the ship, up to the raid.
   *
   * One press, one day, one unit — two for an industrial hull, which is what
   * those holds are for — and in a belt the occasional gem on top of it. The
   * site is read before the engine runs, because what came out is named in the
   * line afterwards and the ship may have been moved on by then.
   *
   * A mining ship is a stationary ship with its hold filling up, and the engine
   * prices that: roughly one operation in eight is jumped by raiders, and that
   * encounter goes into the same record a jump's does.
   */
  function beginMining(state) {
    const sys = engine.currentSystem(state);
    const site = engine.currentMineSite(state);
    const rng = new engine.Rng((state.seed ^ (state.day * 2654435761)) >>> 0);
    const result = engine.mineOnce(state, rng);
    if (!result.ok) throw new Error(dict.t(result.error) || t('refuse.nothingToMine'));
    const notes = [];
    if (result.incident) notes.push(dict.renderMessage(result.incident.bodyKey, result.incident.params));
    if (result.bonus) notes.push(t('screen.minedBonus', { good: dict.goodName(result.bonus) }));
    const encounters = result.encounter ? [result.encounter] : [];
    return {
      encounters,
      arrival: {
        system: bodyName(dict, sys, engine.currentBody(state)),
        notes,
        met: encounters.length,
        key: encounters.length ? 'screen.minedRaid' : 'screen.mined',
        params: { amount: result.amount ?? 0, resource: siteYield(dict, site) },
      },
    };
  }

  /**
   * Where the ship ended up, in the one line a status bar can hold.
   *
   * A leg names its own words. Arriving, docking after four days on impulse and
   * coming up with three units of ore are three different things that all end
   * with the same two facts — what is left in the tank, and what is left of the
   * hull — and a line that called all three "arrived at" would be describing
   * the machinery rather than what happened.
   */
  function arrivedLine(state, arrival) {
    const key = arrival.key ?? (arrival.met ? 'screen.arrivedMet' : 'screen.arrived');
    return t(key, {
      system: arrival.system,
      met: arrival.met,
      fuel: state.ship.fuel,
      hull: state.ship.hull,
      ...(arrival.params ?? {}),
    });
  }

  /**
   * The whole account of a jump.
   *
   * What was said out there, then anything else that happened on the way, then
   * where the ship ended up — in that order, because the fight is what explains
   * the hull in the last line.
   */
  function jumpAccount(state, record) {
    return [fight.account(record), ...(record.arrival.notes ?? []), arrivedLine(state, record.arrival)]
      .filter(Boolean)
      .join(`${BREAK}${BREAK}`);
  }

  /** Every ship met on one leg, settled the one way. */
  function resolveAll(state, record, posture = FALLBACK_POSTURE) {
    while (fight.current(record) && !isWrecked(state)) {
      fight.auto(engine, dict, state, record, posture);
      if (!fight.advance(dict, record)) break;
    }
  }

  /**
   * A leg, and whatever it ran into.
   *
   * With a panel, an interception stops here: the record goes into the document
   * and the player fights it a round at a time. Without one there is nothing to
   * press, so the older behaviour stands and the whole exchange resolves under
   * the posture from the settings — a fight fought by typing would be a model
   * turn per round.
   *
   * A leg is a jump between stars, a crossing between bodies, or a day at a
   * seam. Three things happen out there and one of them is being shot at, so
   * they answer through one function rather than three copies of it: the last
   * two were added by writing what they *are* — encounters and an arrival — and
   * handing them here.
   */
  async function leg(doc, state, { encounters, arrival }) {
    const record = fight.open(dict, encounters, arrival);

    if (scene && fight.current(record) && !isWrecked(state)) {
      await save(withGame(doc, state, { fight: record }));
      const encounter = fight.current(record);
      return {
        fighting: true,
        // "has you in its sights" is not true of a hauler that has stopped to
        // sell you water, and it is the first thing the player reads.
        line: t(engine.isPeacefulTrader(encounter) ? 'fight.stopped' : 'fight.intercepted', {
          who: fight.who(dict, encounter),
          ship: fight.theirShip(dict, encounter),
        }),
        account: fight.account(record),
      };
    }

    resolveAll(state, record);
    return { fighting: false, line: arrivedLine(state, arrival), account: jumpAccount(state, record) };
  }

  /**
   * The three legs, by name. Each one is what happened, handed to `leg`.
   *
   * The board follows the ship, and it is set here rather than at the six
   * places that press these: arriving in a new system is a question about the
   * galaxy, and crossing to a moon is a question about the system. Set after
   * the engine has agreed to the move, so a refused one leaves the map alone.
   */
  const travel = async (doc, state, target) => {
    const done = await leg(doc, state, beginJump(state, target));
    boardView = 'chart';
    return done;
  };
  const crossTo = async (doc, state, bodyId) => {
    const done = await leg(doc, state, beginTransit(state, bodyId));
    boardView = 'system';
    return done;
  };
  const dig = (doc, state) => leg(doc, state, beginMining(state));

  /**
   * The shooting is over: the arrival goes into the transcript and the panel
   * comes back.
   *
   * `narrate` is what a press leaves behind for the model to read out on the
   * turn its submitted words start. A fight fought by typing is already inside
   * such a turn and is answering with the account itself, so it asks for none —
   * left set, it would be reported a second time by whatever ran next.
   */
  async function endFight(doc, state, record, { narrate = true } = {}) {
    const account = jumpAccount(state, record);
    const next = withGame(doc, state, { fight: undefined, narrate: narrate ? account : undefined });
    delete next.fight;
    if (!narrate) delete next.narrate;
    await save(next);
    return { account, line: arrivedLine(state, record.arrival) };
  }

  /**
   * A fight driven by typing rather than by pressing.
   *
   * Slower and dearer — this is inside a turn, so every round costs one — and
   * it exists because everything on the row is a sentence as well. A player
   * who would rather write "shoot them" than press 1 is not doing anything
   * wrong.
   */
  async function fightByWord(doc, state, said) {
    const record = doc.fight;
    const encounter = fight.current(record);
    const word = said.trim().toLowerCase();
    const tell = (text, ok = true) => ({
      ok,
      summary: text,
      feedback: `${t('note.fightOn')}\n${fight.situation(engine, dict, state, record)}`,
    });

    if (patterns('fight.auto').test(word) || patterns('fight.autoFight').test(word)) {
      resolveAll(state, record, patterns('fight.autoFight').test(word) ? 'fight' : 'avoid');
      const ended = await endFight(doc, state, record, { narrate: false });
      return {
        ok: !isWrecked(state),
        summary: `${ended.account}\n\n${position(state)}`,
        feedback: `${ended.account}\n${note(state)}`,
      };
    }

    // Settled, and the player is asking to move on rather than to shoot.
    if (fight.settled(encounter) && patterns('fight.on').test(word)) {
      const opening = fight.advance(dict, record);
      if (opening) {
        await save(withGame(doc, state, { fight: record }));
        return tell(opening.join('\n') || t('fight.nextShip'));
      }
      const ended = await endFight(doc, state, record, { narrate: false });
      return {
        ok: true,
        summary: `${ended.account}\n\n${position(state)}`,
        feedback: `${ended.account}\n${note(state)}`,
      };
    }

    const chosen = FIGHT_WORDS.find(([key]) => patterns(key).test(word));
    if (!chosen) return tell(t('refuse.notAFightMove', { what: said }), false);
    if (fight.settled(encounter) && chosen[1] !== 'plunder') return tell(t('fight.alreadySettled'), false);

    const lines = fight.resolve(engine, dict, state, record, chosen[1]);
    if (isWrecked(state)) {
      const ended = await endFight(doc, state, record, { narrate: false });
      return { ok: false, summary: `${ended.account}\n\n${t('ui.dead')}`, feedback: `${ended.account}\n${t('note.dead')}` };
    }
    await save(withGame(doc, state, { fight: record }));
    return tell(lines.join('\n') || t('fight.nothingHappened'));
  }


  /* ---------- screens ---------- */

  function chartScreen(state) {
    const targets = destinations(engine, state, MAX_CHOICES);
    const here = engine.currentSystem(state);
    const lines = [
      t('screen.chart.head', { system: here.nameId, parsecs: engine.maxRange(state) }),
      '',
      chart(engine, state),
      '',
      t('screen.chart.inRange'),
    ];
    for (const { sys, fuel, distance, wormhole } of targets) {
      lines.push(
        `  ${sys.nameId.padEnd(12)} ${String(Math.round(distance)).padStart(3)} pc   ` +
          (wormhole ? t('screen.chart.wormhole', { tax: engine.wormholeTax(state) }) : `${String(fuel).padStart(2)} fuel  `) +
          '   ' + (sys.visited ? `tech ${sys.techLevel}  ${sys.economyType}` : t('screen.chart.unvisited')),
      );
    }
    if (!targets.length) lines.push(t('screen.chart.nothing'));

    return {
      summary: lines.join('\n'),
      choices: targets.map(({ sys, fuel, wormhole }) => ({
        id: `warp:${sys.id}`,
        label: t('screen.chart.warp', { system: sys.nameId }),
        note: wormhole ? t('screen.chart.wormhole', { tax: engine.wormholeTax(state) }) : t('screen.chart.fuel', { fuel }),
      })),
    };
  }

  /**
   * The system, printed: where the ship is docked and everywhere else it could.
   *
   * The chart's smaller sibling, and the same shape — a drawing, then the list,
   * then a button per place — because they answer the same question about two
   * scales of distance. What a row costs is days rather than fuel: the impulse
   * drive burns nothing and the calendar pays for it, which is a different
   * thing to weigh and the reason the column says so.
   */
  function systemScreen(state) {
    const sys = engine.currentSystem(state);
    const here = engine.currentBodyIndex(state);
    const site = engine.currentMineSite(state);
    const targets = engine.systemBodies(sys).filter((body) => body.id !== here);
    const lines = [
      t('screen.system.head', { system: sys.nameId, star: dict.starClassName(sys.starClass ?? 'yellow') }),
      '',
      bodies(engine, dict, state),
      '',
      // The rule the whole screen exists under, said once rather than repeated
      // on every row: nothing here costs fuel and everything here costs days.
      t('screen.system.impulse'),
    ];

    const choices = targets.slice(0, MAX_CHOICES).map((body) => ({
      id: `body:${body.id}`,
      label: t('screen.system.fly', { place: bodyName(dict, sys, body) }),
      note: t('screen.system.days', { n: engine.transitDaysTo(state, body.id) }),
    }));
    if (site) {
      choices.unshift({
        id: 'mine:here',
        label: t('screen.system.mine'),
        note: t('screen.system.yields', { resource: siteYield(dict, site) }),
      });
    }
    return { summary: lines.join('\n'), choices };
  }

  function marketScreen(state) {
    const sys = engine.currentSystem(state);
    const held = engine.GOOD_IDS.filter((id) => (state.ship.cargo?.[id] ?? 0) > 0 && (sys.sellPrice?.[id] ?? 0) > 0);
    return {
      summary: `${t('screen.market.head', { system: sys.nameId })}\n\n${market(engine, dict, state)}`,
      // The one screen whose feedback is worth its tokens: the table on screen
      // is drawn for a person and the model is not shown it, so without this it
      // has to guess what is for sale — and it does.
      feedback: note(state, `${t('note.screen', { screen: 'market' })}\n${marketDigest(engine, dict, state)}`),
      choices: held.slice(0, MAX_CHOICES).map((id) => ({
        id: `sellall:${id}`,
        label: t('screen.sellAll', { good: dict.goodName(id) }),
        note: t('screen.sellAllNote', { held: state.ship.cargo[id], price: sys.sellPrice[id] }),
      })),
    };
  }

  function newsScreen(state) {
    const sys = engine.currentSystem(state);
    // Headline and body under two keys, not a message with parameters. The
    // screen that printed these before read them as messages and threw on the
    // first planet that had any news at all.
    const items = (sys.news ?? []).map((item) => `• ${dict.t(item.headlineKey)}\n  ${dict.t(item.bodyKey)}`);
    return {
      summary: `${t('screen.news.head', { system: sys.nameId.toUpperCase(), day: state.day })}\n\n${items.join('\n') || t('screen.news.nothing')}`,
    };
  }

  function shipScreen(state) {
    const ship = state.ship;
    const names = (list, name) => (list ?? []).map((id) => name(id)).join(', ') || t('screen.ship.none');
    const lines = [
      t('screen.ship.head', { ship: dict.shipName(ship.type) }),
      '',
      status(engine, dict, state),
      '',
      `${t('screen.ship.weapons')}  ${names(ship.weapons, dict.weaponName)}`,
      `${t('screen.ship.shields')}  ${names(ship.shields, dict.shieldName)}`,
      `${t('screen.ship.gadgets')}  ${names(ship.gadgets, dict.gadgetName)}`,
      `${t('screen.ship.crew')}     ${t('screen.ship.crewValue', { aboard: (ship.crew ?? []).length, free: engine.freeQuarters(ship) })}`,
    ];
    return { summary: lines.join('\n') };
  }

  /**
   * The jobs taken on.
   *
   * Described through the game's own `quest.desc.*` keys rather than a sentence
   * assembled here: a contract is the amount, the good and the system, and those
   * three read differently in the two languages the game ships. The renderer in
   * the original does exactly this, and duplicating it in English only would be
   * a second, worse translation.
   */
  function questScreen(state) {
    const lines = engine.activeQuests(state).map((quest) => {
      const text = dict.renderMessage(`quest.desc.${quest.type}`, engine.questParams(state, quest));
      return t('screen.jobs.line', {
        text: text.startsWith('quest.desc.') ? dict.t(`quest.type.${quest.type}`) : text,
        reward: digits(quest.reward),
      });
    });
    return { summary: `${t('screen.jobs.head')}\n\n${lines.join('\n') || t('screen.jobs.nothing')}` };
  }

  /* ---------- starting and stopping a run ---------- */

  /**
   * Make the commander and write the save, from a name however it arrived.
   *
   * Two ways in — the panel's field and a name typed at the composer — and one
   * run made either way. Kept together because the interesting part is the same
   * for both: a name is not something to interpret, so only the control
   * characters and the field separator come out of it.
   */
  async function makeCommander(doc, { background, name, told = false }) {
    /**
     * A new run opens on the panel, not on whatever dialog the last one left.
     *
     * All three of these are where the player last looked rather than anything
     * about a game, and they outlive a run because they are module scope. A
     * commander who launches into a market deck dealt for the previous one is
     * the visible half of that.
     */
    sheetView = 'market';
    boardView = 'chart';
    deckOpen = false;
    askingAmount = null;
    armedRestart = false;
    const clean = [...String(name ?? '')]
      .map((ch) => (ch === '|' || ch < ' ' ? ' ' : ch))
      .join('')
      .trim()
      .slice(0, 24) || t('setup.name.nameless');
    const chosen = backgroundFor(background) ?? BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
    const state = engine.newGame({ commanderName: clean, skills: { ...chosen.skills } });
    /**
     * Arrive at the planet the run starts on.
     *
     * `newGame` builds the galaxy and puts the ship down, and leaves that one
     * system undressed: no news, no job board, no crew for hire. Everything
     * that furnishes a planet is done by `settleArrival`, which runs when a
     * jump ends — and the first system is the one place nothing ever jumps to.
     * So day one had a planet living through a cold snap with nothing whatever
     * being reported about it, and an empty contract board, until the commander
     * flew somewhere else and came back.
     *
     * The engine's own routine rather than a list of generators copied out of
     * it: if arriving ever comes to mean a fourth thing, the first planet gets
     * that too. It touches nothing else here — the day, the credits and the
     * tank are what `newGame` left them.
     */
    engine.settleArrival(state, new engine.Rng(state.seed));
    // `opening` means "nobody has been introduced to this run yet", so it is not
    // set when the reply carrying it out is the very one being written.
    const next = withGame({}, state, { background: chosen.key, opening: !told });
    await save(next);
    return { state, background: chosen.key };
  }

  /**
   * What the model is told about a run that has just begun.
   *
   * Two jobs. The first lines wall off whatever came before — a new game starts
   * in the same conversation as the old, and a small model reads the transcript
   * above and keeps playing that one. The rest hands over the facts, because a
   * note saying "introduce the new game" and naming nothing is a hole of exactly
   * the kind a 3B fills with fiction, and the state cannot be leaned on here:
   * `ctx.context()` for this turn was built before the commander existed.
   */
  function openingNote(state, background) {
    return t('note.opening', { brief: openingBrief(engine, dict, state, backgroundName(background)) });
  }

  /* ---------- the actions ---------- */

  const isRestart = (input) => patterns('restart').test(input);
  /**
   * The name typed with the request, if there was one.
   *
   * "new game Jameson" names a commander and "start a new game" does not — and
   * the words that asked for the game must never become somebody's name. This
   * used to strip the English literal `new game`, so every other phrasing that
   * starts a run went through as the name: "restart" made a commander called
   * Restart, and in Ukrainian "нова гра" made one called нова гра.
   *
   * The phrase to take out is therefore whichever pattern actually matched, in
   * whichever language it was typed. `restart` first because its alternatives
   * are the longer ones: taking `new ` out of "new game Jameson" would leave
   * the commander called "game Jameson".
   */
  const nameFrom = (said) => {
    let rest = said;
    for (const key of ['restart', 'new']) {
      const found = rest.match(patterns(key));
      if (found) rest = `${rest.slice(0, found.index)} ${rest.slice(found.index + found[0].length)}`;
    }
    return rest.trim();
  };
  const isClose = (input) => patterns('close').test(input);
  const isResume = (input) => patterns('resume').test(input);
  const isStart = (input) => patterns('start').test(input);
  const isIntro = (input) => patterns('intro').test(input);

  /**
   * A move a press already made.
   *
   * The words arrive as usual so the transcript reads normally, but they must
   * not be applied twice — the day would pass twice and the ship would jump two
   * systems. Consumed whatever the model actually sent: what happened is what
   * happened.
   */
  async function narrated(doc, state) {
    const told = String(doc.narrate);
    const opening = doc.opening === true;
    const next = withGame(doc, state, { narrate: undefined, opening: undefined });
    delete next.narrate;
    delete next.opening;
    await save(next);
    return {
      ok: !isWrecked(state),
      summary: `${told}\n\n${position(state)}`,
      feedback: opening
        ? openingNote(state, doc.background) + t('note.opening.pressed', { text: told })
        : `${t('note.moveMade', { text: told })}\n${note(state)}`,
    };
  }

  /**
   * The cue from the name field, wherever it lands.
   *
   * The panel makes the commander itself and then sends a few words so the
   * transcript has a line in it — nothing has happened in the run yet, and the
   * only thing left is for the model to introduce it. Which action those words
   * arrive at is the model's choice, and it gets it wrong: a real session had
   * the cue relayed to the *move* action with no steps at all, which answered
   * "«» is not a move" and left a new commander being told to press buttons
   * that do not exist.
   *
   * So both doors answer it, and an empty relay counts: a model that passed
   * nothing on while a run is waiting to be introduced meant this and could
   * have meant nothing else.
   */
  async function openingTurn(doc, state, said) {
    if (!state || doc.opening !== true) return null;
    if (said && !isIntro(said)) return null;
    const next = withGame(doc, state, {});
    delete next.opening;
    await save(next);
    return {
      ok: true,
      summary: position(state),
      feedback: openingNote(state, doc.background),
    };
  }

  /**
   * A move that did not happen.
   *
   * The position goes back with it on purpose: a refusal the model cannot act on
   * produces the same move again, spelled differently.
   */
  function refuse(state, reason) {
    return {
      ok: false,
      summary: reason,
      feedback: `${t('note.refused', { reason })}\n${note(state)}`,
    };
  }

  ctx.action({
    type: 'space_trader',
    async run(steps) {
      await load();
      const doc = (await ctx.state.get()) ?? {};
      const said = String(steps ?? '').trim();
      const want = said.toLowerCase();
      const state = await read();

      if (doc.narrate && state) return narrated(doc, state);

      /**
       * There is shooting.
       *
       * Every screen answers with the fight, the market and the chart included.
       * Not because the market is unknowable from here — the ship has arrived
       * and the prices are real — but because a model handed a price table in
       * the middle of a gunfight advises on trade, and the one thing the player
       * needs to hear is what is shooting at them.
       */
      if (doc.fight && fight.current(doc.fight) && state) {
        await paint(doc);
        return {
          ok: true,
          summary: fight.account(doc.fight),
          feedback: `${t('note.fightOn')}\n${fight.situation(engine, dict, state, doc.fight)}`,
        };
      }

      /**
       * A commander being made.
       *
       * The background is answered by pressing a card, so nothing typed can
       * settle it and whatever arrives while that question is open is handed
       * back to the player. Once one is chosen the next thing typed *is* the
       * name — all of it, as typed, because a name is not something to
       * interpret.
       */
      if (doc.setup) {
        if (!doc.setup.background) {
          // Repainted before the answer, because the answer points at cards
          // that may not be on screen: `setup` survives a restart, and the only
          // way out of this branch is pressing one of them.
          await paint(doc);
          return { ok: true, summary: t('ui.pickBackground'), feedback: t('note.pickBackground') };
        }
        const made = await makeCommander(doc, { background: doc.setup.background, name: said || doc.setup.name, told: true });
        return {
          ok: true,
          summary: `${t('setup.begun', {
            commander: made.state.commanderName,
            system: engine.currentSystem(made.state).nameId,
            credits: money(made.state.credits),
          })}\n\n${status(engine, dict, made.state)}`,
          feedback: openingNote(made.state, made.background),
        };
      }

      // Before every other pattern, because the cue reads like a request to
      // start a game and would otherwise be answered by the resume note — a
      // briefing about a run nobody has flown yet.
      const opening = await openingTurn(doc, state, said);
      if (opening) return opening;

      /**
       * Closing is the player's, and only the player's.
       *
       * A model asked to stop playing will say it has stopped, which it has no
       * means to do, and a prompt can make that rarer without making it
       * impossible. So the answer is a refusal with somewhere to point —
       * refused only while the panel is up, because that is where the button
       * is. With the game already closed, typing has to keep working or there
       * would be no way back at all.
       */
      if (isClose(said)) {
        if (!state) return { ok: true, summary: t('ui.notRunning'), feedback: t('note.noGameToClose') };
        if (doc.closed === true) return { ok: true, summary: t('ui.alreadyClosed'), feedback: t('note.alreadyClosed') };
        if (scene) {
          // Told about a button, so the row it is on had better be drawn.
          await paint(doc);
          return { ok: false, summary: t('ui.quitIsYours'), feedback: t('note.cannotClose') };
        }
        // With no panel there is no button to point at, and refusing would
        // leave a game that cannot be put away at all.
        await save({ ...doc, closed: true });
        return {
          ok: true,
          summary: t('ui.closed', { commander: state.commanderName, day: state.day }),
          feedback: t('note.closed'),
        };
      }

      if (isResume(said)) {
        if (!state) return { ok: true, summary: t('ui.noSavedRun'), feedback: t('note.noSavedRun') };
        await save({ ...doc, closed: false });
        return {
          ok: true,
          summary: `${t('ui.resumed')}\n\n${position(state)}`,
          feedback: note(state, t('note.resume')),
        };
      }

      /**
       * Throwing a run away is the player's too, for the same reason. Refused
       * while a live run is on screen, where the button is; allowed when the
       * game is closed or when there is no run at all, which is not a restart.
       */
      if (state && doc.closed !== true && !isWrecked(state) && isRestart(said) && scene) {
        await paint(doc);
        return { ok: false, summary: t('ui.restartIsYours'), feedback: t('note.cannotRestart') };
      }

      if (patterns('new').test(want) || isRestart(said)) {
        const named = nameFrom(said);
        /**
         * Not a commander yet — a question.
         *
         * Who is flying is the player's to answer, and it is answered on cards
         * rather than read out of a settings row nobody remembers filling in.
         * A name typed with the request is kept and put in the field, so
         * "new game Jameson" still names the commander.
         */
        if (scene) {
          armedRestart = false;
          await save({ setup: named ? { name: named } : {} });
          return { ok: true, summary: t('ui.newRun'), feedback: t('note.newRun') };
        }
        // No panel: there are no cards to press, so the run is made at once
        // rather than on a question that could never be answered.
        const made = await makeCommander(doc, { background: 'random', name: named, told: true });
        return {
          ok: true,
          summary: `${t('screen.newGame')}\n\n${status(engine, dict, made.state)}`,
          feedback: openingNote(made.state, made.background),
        };
      }

      if (!state) return { ok: false, summary: t('ui.noGame'), feedback: t('note.noGame') };

      if (isStart(said) && doc.closed === true) {
        await save({ ...doc, closed: false });
        return {
          ok: true,
          summary: `${t('ui.resumed')}\n\n${position(state)}`,
          feedback: note(state, t('note.resume')),
        };
      }

      // Asked for a map, the panel changes to the one that was asked for. The
      // screen and the board are two drawings of one answer, and a player who
      // typed "system" and got the star chart beside it has been given two.
      if (patterns('system').test(want)) boardView = 'system';
      else if (patterns('chart').test(want)) boardView = 'chart';

      const screen = patterns('market').test(want)
        ? marketScreen(state)
        : patterns('system').test(want)
          ? systemScreen(state)
          : patterns('chart').test(want)
            ? chartScreen(state)
            : patterns('news').test(want)
              ? newsScreen(state)
              : patterns('ship').test(want)
                ? shipScreen(state)
                : patterns('jobs').test(want)
                  ? questScreen(state)
                  : { summary: position(state) };

      // Looking costs nothing and changes nothing, but it is a turn the game
      // acted in — which is what claims the panel for this conversation.
      await paint(doc);

      // A screen's own feedback wins where it has one: the default says where
      // the user is, and the market's says what things cost, which is a
      // different and more useful answer.
      return {
        ok: true,
        feedback: `${t('note.screen', { screen: want || 'status' })}\n${note(state)}`,
        ...screen,
      };
    },

    /**
     * A button under a card in the transcript.
     *
     * Older than the panel and kept: a card scrolled back to still has its
     * buttons, and they still work. Whatever one does has to be sayable in one
     * line, because a line on the status bar is the whole of what it can
     * produce.
     */
    async choose(choiceId) {
      await load();
      const doc = (await ctx.state.get()) ?? {};
      const state = await read();
      if (!state) throw new Error('there is no game running');

      const [what, argument] = String(choiceId).split(':');

      if (what === 'sellall') {
        const held = state.ship.cargo?.[argument] ?? 0;
        if (!held) throw new Error(t('ui.nothingToSell'));
        const result = engine.sellGood(state, argument, held);
        if (!result.ok) throw new Error(dict.t(result.error) || t('refuse.saleRefused'));
        await save(withGame(doc, state));
        return `${messages([result.info], dict)} — ${money(state.credits)}`;
      }

      if (what === 'warp') {
        const target = state.systems[Number(argument)];
        if (!target) throw new Error(t('ui.noRouteThere'));
        // A button under an old card can start a fight like anything else; the
        // panel is where it is then fought, and this line is what says so.
        const jumped = await travel(doc, state, target);
        if (!jumped.fighting) await save(withGame(doc, state));
        return jumped.line;
      }

      if (what === 'body') {
        const bodies = engine.systemBodies(engine.currentSystem(state));
        const target = bodies[Number(argument)];
        if (!target || target.id === engine.currentBodyIndex(state)) throw new Error(t('ui.noRouteThere'));
        const crossed = await crossTo(doc, state, target.id);
        if (!crossed.fighting) await save(withGame(doc, state));
        return crossed.line;
      }

      if (what === 'mine') {
        if (!engine.currentMineSite(state)) throw new Error(t('refuse.nothingToMine'));
        const dug = await dig(doc, state);
        if (!dug.fighting) await save(withGame(doc, state));
        return dug.line;
      }

      throw new Error('that button belongs to an older game');
    },
  });

  ctx.action({
    type: 'space_trader_move',
    async run(steps) {
      await load();
      const doc = (await ctx.state.get()) ?? {};
      const said = String(steps ?? '').trim();

      /**
       * A commander still being made.
       *
       * There is no game to move in, and the question on screen is answered by
       * pressing a card. Answered here rather than left to fall through to "no
       * game is running", which is true and unhelpful: what the player needs to
       * hear is that the cards are waiting.
       */
      if (doc.setup) {
        await paint(doc);
        return { ok: true, summary: t('ui.pickBackground'), feedback: t('note.pickBackground') };
      }

      const state = await read();
      if (!state) {
        return { ok: false, summary: t('ui.notStarted'), feedback: t('note.noGame') };
      }
      if (doc.narrate) return narrated(doc, state);

      // The cue from the name field, which the model relays to whichever action
      // it feels like — including this one, with nothing in it.
      const opening = await openingTurn(doc, state, said);
      if (opening) return opening;

      // Nothing is bought, sold or jumped while there is shooting: the ship is
      // in somebody's sights, and the moves that exist there are the fight's.
      if (doc.fight && fight.current(doc.fight)) return fightByWord(doc, state, said);

      // A move action called with nothing in it. Refused in its own words: the
      // alternative reads «» — це не хід, which is a sentence about nothing.
      if (!said) return refuse(state, t('refuse.noMove'));

      const [, verb = '', rest = ''] = said.match(/^(\S+)\s*(.*)$/s) ?? [];
      const move = verb.toLowerCase();

      /* --- buying and selling --- */
      if (patterns('buy').test(move) || patterns('sell').test(move)) {
        const selling = patterns('sell').test(move);
        const [, amountText = '', goodText = ''] = rest.match(/^(\S+)\s+(.*)$/s) ?? [];
        const good = findGood(goodText || rest);
        if (!good) return refuse(state, t('refuse.notCommodity', { what: goodText || rest }));

        let amount = Number.parseInt(amountText, 10);
        if (!Number.isFinite(amount)) {
          // "all" and "max" are what a person says, and they mean different
          // things on the two sides of the trade.
          amount = selling ? state.ship.cargo?.[good] ?? 0 : affordable(engine, state, good);
        }
        if (!(amount > 0)) return refuse(state, t('refuse.nothingTo', { move }));

        const result = selling ? engine.sellGood(state, good, amount) : engine.buyGood(state, good, amount);
        if (!result.ok) return refuse(state, dict.t(result.error) || t('refuse.marketRefused'));
        await save(withGame(doc, state));
        return {
          ok: true,
          summary: `${messages([result.info], dict)}\n\n${market(engine, dict, state)}`,
          feedback: `${messages([result.info], dict)}\n${note(state)}`,
        };
      }

      /**
       * What a leg answers with, whichever leg it was.
       *
       * Intercepted, the move ends here: the panel now holds a fight, and the
       * fight is the player's to fight. The model is told in as many words not
       * to narrate its outcome, because a model that has just read "a pirate
       * closes in" will otherwise write the whole gunfight — and then the panel
       * and the story are two different games.
       *
       * Not intercepted, the day is over and the position goes back. Raiders
       * jump a mining operation as readily as a shipping lane, which is why
       * this is one answer and not three.
       */
      const legReply = async (done) => {
        if (done.fighting) {
          return {
            ok: true,
            summary: `${done.account}\n\n${done.line}`,
            feedback: `${t('note.fightStarted')}\n${fight.situation(engine, dict, state, (await ctx.state.get()).fight)}`,
          };
        }
        await save(withGame(doc, state));
        const dead = isWrecked(state);
        return {
          ok: !dead,
          summary: `${done.account}\n\n${position(state)}`,
          feedback: `${done.account}\n${note(state)}`,
        };
      };

      /* --- moving --- */
      if (patterns('warp').test(move)) {
        const where = rest.replace(/^to\s+/i, '');
        const target = findSystem(state, where);
        /**
         * "fly to Nyle IV" is not a jump, and the words are the same.
         *
         * `fly` and `go` have always been warp verbs, and now half the places
         * worth naming are inside the system the ship is already in. Rather
         * than teach the player which verb reaches which kind of place — a
         * distinction the game does not otherwise make — a name that is not a
         * system is looked for where the ship is standing before it is refused.
         */
        if (!target) {
          const body = findBody(state, where);
          if (body && body.id !== engine.currentBodyIndex(state)) {
            try {
              return await legReply(await crossTo(doc, state, body.id));
            } catch (err) {
              return refuse(state, err.message);
            }
          }
          return refuse(state, t('refuse.noSystem', { what: rest }));
        }
        try {
          return await legReply(await travel(doc, state, target));
        } catch (err) {
          return refuse(state, err.message);
        }
      }

      /**
       * Crossing the system, which is not a jump and must not read like one.
       *
       * Typed as "fly to Nyle IV" or "dock at the belt". The place is found by
       * what it is called on the map and by what it is — a player who has read
       * "ice moon" on the screen should be able to say "ice moon" back.
       */
      if (patterns('flyTo').test(move)) {
        const target = findBody(state, rest.replace(/^(to|at)\s+/i, ''));
        if (!target) return refuse(state, t('refuse.noBody', { what: rest }));
        if (target.id === engine.currentBodyIndex(state)) return refuse(state, t('refuse.alreadyThere'));
        try {
          return await legReply(await crossTo(doc, state, target.id));
        } catch (err) {
          return refuse(state, err.message);
        }
      }

      /* --- a day at the seam --- */
      if (patterns('mine').test(move)) {
        if (!engine.currentMineSite(state)) return refuse(state, t('refuse.nothingToMine'));
        try {
          return await legReply(await dig(doc, state));
        } catch (err) {
          return refuse(state, err.message);
        }
      }

      /* --- the two things a planet does for a ship --- */
      if (patterns('refuel').test(move)) {
        const want = Number.parseInt(rest, 10);
        const room = engine.maxFuel(state.ship) - state.ship.fuel;
        const result = engine.refuel(state, Number.isFinite(want) ? Math.min(want, room) : room);
        if (!result.ok) return refuse(state, dict.t(result.error) || t('refuse.noFuelSold'));
        await save(withGame(doc, state));
        return {
          ok: true,
          summary: `${messages([result.info], dict)}\n\n${position(state)}`,
          feedback: `${messages([result.info], dict)}\n${note(state)}`,
        };
      }

      if (patterns('repair').test(move)) {
        const result = engine.repair(state, engine.maxHull(state.ship) - state.ship.hull);
        if (!result.ok) return refuse(state, dict.t(result.error) || t('refuse.noRepairs'));
        await save(withGame(doc, state));
        return {
          ok: true,
          summary: `${messages([result.info], dict)}\n\n${position(state)}`,
          feedback: `${messages([result.info], dict)}\n${note(state)}`,
        };
      }

      return refuse(state, t('refuse.unknownMove', { what: said }));
    },
  });

  /**
   * The position, every turn.
   *
   * Only while a game exists and is open, and only ever the briefing — never
   * the market table. This is re-sent on every turn of every conversation,
   * counted against the window, and paid for by turns that have nothing to do
   * with the game.
   */
  ctx.context(async () => {
    const doc = await ctx.state.get();
    if (!doc) return '';
    await load();

    if (doc.setup) {
      return doc.setup.background
        ? t('note.nameContext', { background: backgroundName(doc.setup.background) })
        : t('note.pickBackgroundContext');
    }
    if (!doc.save) return '';
    // A closed game takes the world out of the prompt, because while that is in
    // front of the model every turn it goes on being a trading computer
    // whatever it was asked. It does not take out the way back in: with nothing
    // at all here, a model asked to play again simply carries on from the
    // transcript, inventing a game with no plugin behind it.
    if (doc.closed === true) return t('note.closed');
    const state = await read();
    if (!state) return '';
    // A fight replaces the position rather than joining it: where the ship is
    // docked is not the question while somebody is shooting at it, and the
    // model has to be told in as many words that the outcome is not its to
    // write.
    if (doc.fight && fight.current(doc.fight)) {
      return `${t('note.language')}\n${fight.situation(engine, dict, state, doc.fight)}`;
    }
    return `${t('note.language')}\n${note(state)}`;
  });

  ctx.prompt(t('prompt.text', { language: t('note.language') }));

  /**
   * A language changed is a panel that has to be redrawn.
   *
   * Every label on it — the moves, the meters, the title — was chosen in the
   * old language, and nothing else would redraw them until the next turn.
   */
  /**
   * The buttons in the left panel: PLAY, NEW GAME, SAVE, LOAD.
   *
   * They are there rather than on the row above the composer because that row
   * only exists while a game is drawn, and the moment PLAY and LOAD GAME are
   * for is the one where nothing is. The app claims the panel for the open
   * conversation after this returns, so painting a scene here is what makes the
   * game appear in the chat the button was pressed from.
   *
   * Nothing destructive happens on the press itself. NEW GAME asks who is
   * flying, and SAVE and LOAD open the list of slots — the slot is the thing
   * that gets pressed, and a run is only written over from a row that says
   * whose run it is.
   */
  ctx.onButton(async (key) => {
    await load();
    const doc = (await ctx.state.get()) ?? {};

    /**
     * PLAY: the run already in the document, in the conversation being had.
     *
     * A game is one save and many chats. Opening a new one left the run with
     * nowhere to be drawn and the only way back in was to type at the model and
     * hope it passed the words along — a turn, a model call and a relay, spent
     * on something that is not a move. A press claims the panel, which is the
     * whole of what "put the game here" means.
     *
     * It submits rather than settling, because coming back aboard is exactly
     * when the position is worth reading out, and `space_trader` answers that
     * phrase with the briefing. Same words the menu's LOAD GAME sends, so the
     * two ways back in read the same in the transcript.
     *
     * With nothing saved at all this asks who is flying, rather than answering
     * "there is nothing to play" — a press that costs one and gives nothing
     * back. Nothing is written over: the commander is not made until a name is
     * sent, which is what NEW GAME relies on too.
     */
    if (key === 'play') {
      armedRestart = false;
      askingAmount = null;
      deckOpen = false;
      // The question of who is flying is still open, so it is put back up
      // rather than answered from here.
      if (doc.setup) {
        await paint(doc);
        return { status: t('ui.newRun'), cards: true };
      }
      const held = await read();
      if (!held) {
        await save({ ...doc, setup: {} });
        return { status: t('ui.newRun'), cards: true };
      }
      // The panel arrives on the market rather than on whatever sheet was open
      // in the chat this was last drawn in.
      sheetView = 'market';
      // Written whether or not it was closed: a run that is merely somewhere
      // else is not closed, and the flag is what the menu is drawn from.
      await save({ ...doc, closed: false });
      return {
        status: t('ui.resumedAs', { commander: held.commanderName, day: held.day }),
        submit: t('move.resume.submit'),
      };
    }

    if (key === 'newGame') {
      armedRestart = false;
      askingAmount = null;
      deckOpen = false;
      // A run in progress is not thrown away here. It is written over when the
      // name is sent, and until then the old save is still in the document —
      // which is what makes closing the chooser a way out rather than a loss.
      await save({ ...doc, setup: {} });
      return { status: t('ui.newRun'), cards: true };
    }

    if (key !== 'save' && key !== 'load') return { status: t('ui.moveGone') };

    // A game that was put away still has a panel to draw — the menu — so this
    // works closed as well as running. With nothing saved at all there is
    // nothing to draw and nothing to claim, which is the honest answer.
    if (!doc.save && !doc.setup) return { status: t('ui.noGame') };
    if (key === 'save' && (doc.closed === true || !doc.save)) return { status: t('saves.notRunning') };

    sheetView = key;
    deckOpen = false;
    askingAmount = null;
    await paint(doc);
    return { sheet: true };
  });

  ctx.onSettingsChanged(async () => {
    if (!engine) return;
    speak();
    const doc = await ctx.state.get();
    if (doc?.setup || doc?.save) await paint(doc);
  });

  // Declared in the manifest, so a reader knows this plugin draws a panel
  // without reading a line of it. Absent on a host that has none, and
  // everything above still works — the game is playable by typing, exactly as
  // it was before there were buttons.
  try {
    scene = ctx.service('scene');
  } catch {
    /* older host: the panel is a bonus, not the game */
  }
  if (!scene) return;

  /**
   * A pressed button.
   *
   * Two kinds, and the difference is the whole design. Looking at something —
   * the market, the ship, the chart — is answered here and now: it redraws the
   * panel, involves no model and costs no turn. Doing something the engine can
   * settle by itself is applied here too, and then the words it stands for are
   * handed back so the transcript reads as though they had been typed. Nothing
   * here starts a turn on its own.
   *
   * Registered last, after every other contribution, so a failure earlier in
   * activation cannot leave a panel driven by a plugin that is not running.
   */
  scene.present({
    pluginId: ctx.id,
    pluginName: 'Space Trader',
    act: async (actionId, value = '') => {
      await load();
      const doc = (await ctx.state.get()) ?? {};

      /**
       * A card pressed.
       *
       * Only while the question is open: a background arriving at any other time
       * is a stale click on a chooser already answered, and acting on it would
       * replace a commander mid-run.
       */
      /**
       * Out of the question, back to the run it was asked over.
       *
       * Only while there is one: with nothing in the document this would be a
       * card that closes the game onto an empty panel.
       */
      if (actionId === 'setup-cancel') {
        if (!doc.save) return { status: t('setup.nothingToKeep') };
        const kept = { ...doc };
        delete kept.setup;
        await save(kept);
        const flying = await read();
        return {
          status: flying
            ? t('setup.kept', { commander: flying.commanderName, day: flying.day })
            : t('setup.nothingToKeep'),
        };
      }

      if (actionId.startsWith('background-')) {
        if (!doc.setup || doc.setup.background) return { status: t('setup.backgroundTaken') };
        const key = actionId.slice('background-'.length);
        const picked = backgroundFor(key) ?? BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
        await save({ ...doc, setup: { ...doc.setup, background: picked.key } });
        // Opened for them rather than left to be found: the background was
        // chosen by pressing, and the next question should not be answered
        // somewhere else.
        return { status: t('setup.chosen', { background: backgroundName(picked.key) }), entry: true };
      }

      /**
       * The name, and with it the run.
       *
       * Pressed empty — from the button on the row — this only opens the field.
       * Sent with something in it, it makes the commander here and now: the
       * engine decides, the model narrates, and whether a game starts at all
       * stops depending on a 3B choosing to pass a word along.
       */
      if (actionId === 'name') {
        if (!doc.setup?.background) return { status: t('setup.needBackground') };
        const typed = String(value ?? '').trim();
        if (!typed) return { status: t('setup.needName'), entry: true };
        const made = await makeCommander(doc, { background: doc.setup.background, name: typed });
        return {
          status: t('setup.begun', {
            commander: made.state.commanderName,
            system: engine.currentSystem(made.state).nameId,
            credits: money(made.state.credits),
          }),
          // A cue and not a move: nothing in the world has happened yet, and the
          // opening is the one thing left to say.
          submit: t('setup.intro.words'),
        };
      }

      /**
       * The menu, which is the panel with no game running on it.
       *
       * Answered before the save is read, because the whole condition these two
       * exist under is that nothing is being played: below this line a missing
       * game is an error, and here it is the situation.
       */
      if (actionId === 'resume' || (actionId === 'restart' && doc.closed === true)) {
        askingAmount = null;
        const saved = doc.closed === true ? await read() : null;
        if (actionId === 'restart') {
          // The same second press the row inside a running game asks for: a
          // digit is easy to hit by accident and the run under it is hours old.
          if (saved && !armedRestart) {
            armedRestart = true;
            await paint(doc);
            return { status: t('ui.restartConfirm', { commander: saved.commanderName }) };
          }
          armedRestart = false;
          await save({ setup: {} });
          return { status: t('ui.newRun'), cards: true };
        }
        armedRestart = false;
        // A stale press from a panel that has moved on: the game is running, and
        // "there is no saved game" would be the wrong thing to say about it.
        if (!saved) return { status: doc.save ? t('ui.running') : t('ui.noSavedRun') };
        await save({ ...doc, closed: false });
        return {
          status: t('ui.resumedAs', { commander: saved.commanderName, day: saved.day }),
          // Sent as words rather than settled here: coming back aboard after a
          // week away is exactly when the position is worth reading out, and
          // `space_trader` answers this phrase with the briefing.
          submit: t('move.resume.submit'),
        };
      }

      /**
       * A slot, pressed.
       *
       * All three answered before the run is read, because two of them are
       * about a run that is not loaded yet: LOAD replaces whatever is in the
       * document, and DELETE touches no game at all. Saving needs one and says
       * so itself.
       *
       * Nothing here submits. Writing a slot is bookkeeping and costs no turn;
       * loading one ends with the panel showing the run and the model told
       * about it in the same words a resume uses.
       */
      if (actionId.startsWith('save-') || actionId.startsWith('load-') || actionId.startsWith('delete-')) {
        const [what, slot] = [actionId.slice(0, actionId.indexOf('-')), actionId.slice(actionId.indexOf('-') + 1)];
        if (!saves.isSlot(slot)) return { status: t('ui.moveGone') };
        armedRestart = false;
        askingAmount = null;

        if (what === 'delete') {
          saves.remove(ctx.dataDir(), slot);
          await paint(doc);
          return { status: t('saves.deleted', { n: slot }), sheet: true };
        }

        if (what === 'save') {
          const held = doc.closed === true ? null : await read();
          if (!held || !doc.save) {
            await paint(doc);
            return { status: t('saves.notRunning') };
          }
          const ok = saves.write(ctx.dataDir(), slot, {
            save: doc.save,
            meta: saves.metaOf(engine, held),
          });
          await paint(doc);
          return {
            status: ok
              ? t('saves.saved', { n: slot, commander: held.commanderName, day: held.day })
              : t('saves.failed'),
            sheet: true,
          };
        }

        const held = saves.read(ctx.dataDir(), slot);
        if (!held) {
          await paint(doc);
          return { status: t('saves.unreadable', { n: slot }) };
        }
        const loaded = JSON.parse(held.save);
        deckOpen = false;
        sheetView = 'market';
        // Everything the old document held is dropped: a fight in progress, a
        // half-made commander and a closed flag all belong to the run being
        // replaced, and carrying any of them over would be the new game
        // inheriting the old one's shooting.
        await save({
          save: held.save,
          day: loaded.day,
          commander: loaded.commanderName,
        });
        return {
          status: t('saves.loaded', { n: slot, commander: loaded.commanderName, day: loaded.day }),
          submit: t('move.resume.submit'),
        };
      }

      const state = doc.closed === true ? null : await read();
      if (!state) return { status: t('ui.notStarted') };

      /**
       * A round of a fight.
       *
       * Free, and that is the whole point of it: the engine settles the round,
       * the panel redraws and the status bar carries what just happened, with
       * no turn and no tokens spent. Nothing is submitted until the shooting
       * stops — a line sent per round would be a model turn per round, which is
       * the thing this replaced.
       */
      if (doc.fight && fight.current(doc.fight)) {
        const record = doc.fight;
        const encounter = fight.current(record);

        /** Switching target inside a wing. Free, and not a round. */
        if (actionId.startsWith('fight-target-')) {
          if (!engine.setTarget(encounter, Number(actionId.slice('fight-target-'.length)))) {
            await paint(doc);
            return { status: t('ui.moveGone') };
          }
          await save(withGame(doc, state, { fight: record }));
          return { status: t('fight.targetSwitched', { ship: fight.theirShip(dict, encounter) }), sheet: true };
        }

        /**
         * Their stall.
         *
         * Free, like every other press in a fight, and for the same reason: it
         * is the engine settling something, not a turn. TRADE opens the sheet
         * on their two price lists; a row of one opens the field; the field is
         * answered below, in the same place a purchase on a planet is answered.
         */
        if (actionId === 'fight-trade') {
          askingAmount = null;
          await paint(doc);
          return { sheet: true };
        }

        if (actionId.startsWith('fight-buy-') || actionId.startsWith('fight-sell-')) {
          const kind = actionId.startsWith('fight-buy-') ? 'tradeBuy' : 'tradeSell';
          const good = actionId.slice((kind === 'tradeBuy' ? 'fight-buy-' : 'fight-sell-').length);
          // The stall closes on the first shot, and the row was drawn before it.
          if (!engine.GOOD_IDS.includes(good) || !fight.canTrade(engine, encounter)) {
            askingAmount = null;
            await paint(doc);
            return { status: t('ui.moveGone') };
          }
          if (fight.tradeCeiling(engine, state, encounter, kind, good) <= 0) {
            askingAmount = null;
            await paint(doc);
            return { status: kind === 'tradeSell' ? t('ui.nothingToSell') : t('ui.cannotAfford') };
          }
          askingAmount = { kind, good };
          await paint(doc);
          return { entry: true };
        }

        /**
         * The field answering, which is where the trade happens.
         *
         * Nothing is submitted: a stall in the middle of a jump is not a turn,
         * and what was bought goes into the fight's own account, which reaches
         * the transcript when the encounter is over along with everything else
         * that happened out there.
         */
        if (actionId === 'amount') {
          const asked = askingAmount;
          askingAmount = null;
          if (!asked || !fight.canTrade(engine, encounter)) {
            await paint(doc);
            return { status: t('ui.moveGone') };
          }
          const ceiling = fight.tradeCeiling(engine, state, encounter, asked.kind, asked.good);
          const typed = Number.parseInt(String(value ?? '').trim(), 10);
          const amount = Math.max(0, Math.min(Number.isFinite(typed) ? typed : ceiling, ceiling));
          if (!(amount > 0)) {
            await paint(doc);
            return { status: asked.kind === 'tradeSell' ? t('ui.nothingToSell') : t('ui.cannotAfford') };
          }
          const result = asked.kind === 'tradeSell'
            ? engine.tradeSell(state, encounter, asked.good, amount)
            : engine.tradeBuy(state, encounter, asked.good, amount);
          if (!result.ok) {
            await paint(doc);
            return { status: dict.t(result.error) || t('refuse.marketRefused') };
          }
          const line = messages([result.info], dict);
          record.log.push({ round: Math.max(1, encounter.round), text: line });
          await save(withGame(doc, state, { fight: record }));
          return { status: line, sheet: true };
        }

        // Anything else is a move, and a move closes a half-asked question:
        // a field left open over a round would be answered against a stall the
        // shooting has already shut.
        askingAmount = null;

        /**
         * Handing the rest of it over, and saying to what.
         *
         * Every ship left on this leg, not only the one in front — this is the
         * button for a player who does not want to press through a gunfight
         * with a hauler, and stopping it halfway would not be that.
         *
         * Two ids rather than one and a setting: which of them is on the row is
         * decided by the encounter, and what each does is on the button.
         */
        if (actionId === 'fight-auto' || actionId === 'fight-autoFight') {
          resolveAll(state, record, actionId === 'fight-autoFight' ? 'fight' : 'avoid');
          const ended = await endFight(doc, state, record);
          return { status: isWrecked(state) ? t('ui.dead') : ended.line, submit: t('move.fight.submit') };
        }

        /** The next ship, or the end of the jump. */
        if (actionId === 'fight-on') {
          const opening = fight.advance(dict, record);
          if (opening) {
            await save(withGame(doc, state, { fight: record }));
            return { status: fight.headline(opening) || t('fight.nextShip') };
          }
          const ended = await endFight(doc, state, record);
          return { status: ended.line, submit: t('move.fight.submit') };
        }

        const move = FIGHT_ACTIONS[actionId];
        if (!move) {
          await paint(doc);
          return { status: t('ui.moveGone') };
        }
        const lines = fight.resolve(engine, dict, state, record, move);
        // A commander who dies out there dies with the jump unfinished; the
        // account still has to reach the transcript, and the panel has to stop
        // being a fight.
        if (isWrecked(state)) {
          await endFight(doc, state, record);
          return { status: t('ui.dead'), submit: t('move.fight.submit') };
        }
        await save(withGame(doc, state, { fight: record }));
        return { status: fight.headline(lines) || t('fight.nothingHappened') };
      }

      /**
       * Leaving. Local: no turn, no model, no tokens.
       *
       * The save is untouched apart from the flag, so this is a door and not a
       * demolition — "resume the game" walks back through it into the same day
       * with the same cargo.
       */
      if (actionId === 'quit') {
        armedRestart = false;
        askingAmount = null;
        deckOpen = false;
        await save({ ...doc, closed: true });
        return { status: t('ui.closed', { commander: state.commanderName, day: state.day }) };
      }

      /**
       * Starting over, on the second press while a commander is still flying.
       *
       * The app puts digits on these by position and a digit is easy to hit by
       * accident. A run is hours of trading, and losing it to a mistyped
       * keystroke is the one failure this game cannot make up for. A wrecked
       * ship has nothing left to lose, so it goes straight through.
       */
      if (actionId === 'restart') {
        if (!isWrecked(state) && !armedRestart) {
          armedRestart = true;
          await paint(doc);
          return { status: t('ui.restartConfirm', { commander: state.commanderName }) };
        }
        armedRestart = false;
        askingAmount = null;
        deckOpen = false;
        await save({ setup: {} });
        return { status: t('ui.newRun'), cards: true };
      }

      // Anything else disarms it: a player who went off to do something else
      // has answered the question.
      if (armedRestart) {
        armedRestart = false;
        await paint(doc);
      }

      /**
       * The four doors and the chart.
       *
       * Opening one costs nothing: it swaps which lists the sheet holds and
       * asks for the sheet. Repainting first matters — the dialog is filled
       * from the scene, so the scene has to hold the new lists before the app
       * is told to show them, or the first press opens the previous view.
       */
      /**
       * The market is dealt rather than listed.
       *
       * The table is still one press away — the app's own sheet button, and the
       * last card in the deck — but it is a reference, and the question a trader
       * is actually asking is not in it. See `deals()` in `panel.mjs`.
       */
      if (actionId === 'market') {
        sheetView = 'market';
        askingAmount = null;
        deckOpen = true;
        await paint(doc);
        return { cards: true };
      }
      /**
       * Out of the deck, by the two cards that are not deals.
       *
       * Both put it down, and that is the whole of the fix: `{sheet: true}`
       * used to open the sheet *over* the chooser without closing it, so
       * shutting the sheet again put the player back on a deck with nothing
       * else to press.
       */
      if (actionId === 'deal-table' || actionId === 'deal-close') {
        sheetView = 'market';
        askingAmount = null;
        deckOpen = false;
        await paint(doc);
        return actionId === 'deal-table' ? { sheet: true } : { status: t('ui.marketClosed') };
      }
      if (actionId === 'ship' || actionId === 'jobs' || actionId === 'news') {
        sheetView = actionId;
        askingAmount = null;
        deckOpen = false;
        await paint(doc);
        return { sheet: true };
      }
      /**
       * The two maps, on the one board.
       *
       * Free, like every other look: the board changes and nothing is sent to
       * the model. `{board: true}` opens it if it was shut, which is what makes
       * this one key both a toggle and a way in.
       */
      if (actionId === 'chart' || actionId === 'system') {
        askingAmount = null;
        deckOpen = false;
        boardView = actionId === 'system' ? 'system' : 'chart';
        await paint(doc);
        return { board: true };
      }

      /**
       * A commodity, from a card in the deck or a row in the table.
       *
       * A trade is a number, and neither a card nor a row can ask for one — so
       * pressing either opens the field with the price and the ceiling already
       * worked out. Nothing is bought or sold here; that happens when the field
       * answers.
       */
      if (actionId.startsWith('buy-') || actionId.startsWith('sell-')
        || actionId.startsWith('deal-buy-') || actionId.startsWith('deal-sell-')) {
        const bare = actionId.startsWith('deal-') ? actionId.slice('deal-'.length) : actionId;
        const kind = bare.startsWith('buy-') ? 'buy' : 'sell';
        const good = bare.slice(kind.length + 1);
        if (!engine.GOOD_IDS.includes(good)) return { status: t('ui.moveGone') };
        const sys = engine.currentSystem(state);
        if (kind === 'sell' && !(state.ship.cargo?.[good] > 0)) {
          askingAmount = null;
          await paint(doc);
          return { status: t('ui.nothingToSell') };
        }
        if (kind === 'buy' && !engine.marketBuyPrice(state, good)) {
          askingAmount = null;
          await paint(doc);
          return { status: t('ui.notForSale') };
        }
        if (kind === 'sell' && !(sys.sellPrice?.[good] > 0)) {
          askingAmount = null;
          await paint(doc);
          return { status: t('ui.notBought') };
        }
        askingAmount = { kind, good };
        await paint(doc);
        return { entry: true };
      }

      /**
       * The field answering, which is where a trade actually happens.
       *
       * Empty means as many as possible, which is what the field was already
       * showing. The engine settles it — there is no ruling to make about a
       * purchase — and the words it stands for go into the conversation so the
       * transcript reads as though they had been typed.
       */
      if (actionId === 'amount') {
        const asked = askingAmount;
        askingAmount = null;
        if (!asked) {
          await paint(doc);
          return { status: t('ui.moveGone') };
        }
        const ceiling = asked.kind === 'sell'
          ? state.ship.cargo?.[asked.good] ?? 0
          : affordable(engine, state, asked.good);
        const typed = Number.parseInt(String(value ?? '').trim(), 10);
        const amount = Math.max(0, Math.min(Number.isFinite(typed) ? typed : ceiling, ceiling));
        if (!(amount > 0)) {
          await paint(doc);
          return { status: asked.kind === 'sell' ? t('ui.nothingToSell') : t('ui.cannotAfford') };
        }
        const result = asked.kind === 'sell'
          ? engine.sellGood(state, asked.good, amount)
          : engine.buyGood(state, asked.good, amount);
        if (!result.ok) {
          await paint(doc);
          return { status: dict.t(result.error) || t('refuse.marketRefused') };
        }
        const line = messages([result.info], dict);
        // The app shuts every dialog on a move that submits, so a deck left
        // open in the scene would be one the document says is up and the screen
        // says is not.
        deckOpen = false;
        await save(withGame(doc, state, { narrate: line }));
        return {
          status: line,
          submit: t(asked.kind === 'sell' ? 'move.sell.submit' : 'move.buy.submit', {
            amount,
            good: dict.goodName(asked.good),
          }),
        };
      }

      /**
       * A system pressed on the chart.
       *
       * The jump is made here rather than handed to the model as words to relay:
       * a press is the player's own, and a 3B asked to pass "warp Nyle" through
       * sometimes narrates the arrival instead of calling the action, which
       * would leave the ship where it was while the story moved on. Checked
       * against what is actually in range, because the run may have moved on
       * since the marker was drawn.
       */
      if (actionId.startsWith('warp-')) {
        deckOpen = false;
        const target = state.systems[Number(actionId.slice('warp-'.length))];
        const canReach = target && (engine.canTravelTo(state, target.id) || engine.currentSystem(state).wormholeTo === target.id);
        if (!canReach) {
          await paint(doc);
          return { status: t('ui.noRouteThere') };
        }
        let jumped;
        try {
          jumped = await travel(doc, state, target);
        } catch (err) {
          await paint(doc);
          return { status: err.message };
        }
        // Intercepted: the panel is already showing the fight, and nothing is
        // sent to the model — a round is a keypress and a keypress must not
        // cost a turn. The transcript hears about it when the shooting stops.
        if (jumped.fighting) return { status: jumped.line };
        await save(withGame(doc, state, { narrate: jumped.account }));
        return { status: jumped.line, submit: t('move.warp.submit', { system: target.nameId }) };
      }

      /**
       * A place in this system, pressed on the map.
       *
       * The impulse run, and the only thing it has in common with a jump is
       * that somebody may be out there. It costs days rather than fuel, so
       * there is nothing to check against the tank — only that the ship is not
       * being told to fly to where it already is.
       */
      if (actionId.startsWith('fly-')) {
        deckOpen = false;
        const bodies = engine.systemBodies(engine.currentSystem(state));
        const target = bodies[Number(actionId.slice('fly-'.length))];
        if (!target || target.id === engine.currentBodyIndex(state)) {
          await paint(doc);
          return { status: t('ui.noRouteThere') };
        }
        const place = bodyName(dict, engine.currentSystem(state), target);
        let crossed;
        try {
          crossed = await crossTo(doc, state, target.id);
        } catch (err) {
          await paint(doc);
          return { status: err.message };
        }
        if (crossed.fighting) return { status: crossed.line };
        await save(withGame(doc, state, { narrate: crossed.account }));
        return { status: crossed.line, submit: t('move.fly.submit', { place }) };
      }

      /**
       * A day at the seam, pressed on the body the ship is docked at.
       *
       * One press is one day and one unit, which is the shape the whole panel
       * is in: the engine settles it, the status bar carries what came up, and
       * the model is told once at the end rather than once a unit. Raiders end
       * the day the same way they end a jump — the fight is on the panel and
       * nothing is submitted until it is over.
       */
      if (actionId === 'mine') {
        deckOpen = false;
        if (!engine.currentMineSite(state)) {
          await paint(doc);
          return { status: t('refuse.nothingToMine') };
        }
        let dug;
        try {
          dug = await dig(doc, state);
        } catch (err) {
          await paint(doc);
          return { status: err.message };
        }
        if (dug.fighting) return { status: dug.line };
        await save(withGame(doc, state, { narrate: dug.account }));
        return { status: dug.line, submit: t('move.mine.submit') };
      }

      if (actionId === 'refuel' || actionId === 'repair') {
        const result = actionId === 'refuel'
          ? engine.refuel(state, engine.maxFuel(state.ship) - state.ship.fuel)
          : engine.repair(state, engine.maxHull(state.ship) - state.ship.hull);
        if (!result.ok) {
          await paint(doc);
          return { status: dict.t(result.error) || t(actionId === 'refuel' ? 'refuse.noFuelSold' : 'refuse.noRepairs') };
        }
        const line = messages([result.info], dict);
        await save(withGame(doc, state, { narrate: line }));
        return { status: line, submit: t(`move.${actionId}.submit`) };
      }

      /**
       * A contract taken on, or turned in.
       *
       * Both are settled by the engine and neither needs a model, so both
       * happen here. The job board was unreachable before there was a panel:
       * it is a list on a planet, and a list is what the sheet is for.
       */
      if (actionId.startsWith('take-')) {
        const result = engine.acceptBoardQuest(state, actionId.slice('take-'.length));
        if (!result.ok) {
          await paint(doc);
          return { status: dict.t(result.error) };
        }
        const line = messages([result.info], dict);
        await save(withGame(doc, state));
        return { status: line, sheet: true };
      }

      if (actionId.startsWith('turnin-')) {
        const quest = engine.turnInQuest(state, actionId.slice('turnin-'.length));
        if (!quest) {
          await paint(doc);
          return { status: t('ui.moveGone') };
        }
        const line = messages([{ key: 'quest.completed', params: engine.questParams(state, quest) }], dict);
        await save(withGame(doc, state, { narrate: line }));
        return { status: line, sheet: true };
      }

      // The host already refuses an id that is not in the scene it drew; this is
      // the other half — the run itself has moved on since. Repainting is what
      // puts the row back in step, and is more use than an error.
      await paint(doc);
      return { status: t('ui.moveGone') };
    },
  });

  /**
   * The saved run, drawn at activation.
   *
   * A scene painted outside a turn belongs to no conversation and is drawn
   * nowhere until the plugin acts in one — so this is not a panel appearing over
   * somebody's unrelated chat, it is the panel being ready for the conversation
   * the game is next played in. Only when there is something to draw: `paint`
   * clears the panel for a document with no run in it, and clearing is not
   * scoped to whoever painted last.
   */
  (async () => {
    const doc = await ctx.state.get();
    if (!doc?.setup && !doc?.save) return;
    // A game that was put away stays put away until somebody asks for it. The
    // menu is what QUIT leaves behind, not what a restart of the app opens on:
    // drawn here it would claim nothing and show nowhere, and the first turn of
    // an unrelated conversation would inherit it.
    if (doc.closed === true) return;
    await load();
    await paint(doc);
  })();
}

export function deactivate() {}
