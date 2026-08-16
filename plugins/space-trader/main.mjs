/**
 * Space Trader, played in the chat window.
 *
 * The game itself is not here. `engine.mjs` is Pieter Spronck's economy as the
 * modern remake implements it — the galaxy, the market, the encounters — bundled
 * out of that project untouched, so a rule argued over there is the rule here
 * too. This file is the part that could not come with it: how a game with a
 * star chart and a gunfight is played through a transcript.
 *
 * What the app gives a plugin to draw with is one string and a row of buttons.
 * That decides nearly everything below. A screen is the result of an action, so
 * a screen needs a turn — the user says something, a card is drawn. A button
 * cannot draw a second card, because `choose` returns a line for the status bar
 * and nothing else, so buttons are for committing a move whose result fits in a
 * sentence, never for stepping through one.
 *
 * The model advises and does not play. That is a decision, not a limitation of
 * the wiring: the moves are the user's, and a model that spends their credits
 * between two questions has taken the game off them. It reads the position on
 * every turn and moves only what it was explicitly told to move.
 */
import { briefing, chart, credits, destinations, market, messages, status } from './view.mjs';

/**
 * What the model is told.
 *
 * The first paragraph is the one that matters, and it is not describing the
 * action — it is naming the sentence the model will otherwise produce. Asked to
 * play, a model holding this answers "I can't run interactive games, but I can
 * describe one", exactly as one holding the lookup action answers "I have no
 * access to real-time information". The game is running in the same window as
 * the reply; the refusal is false and has to be called false.
 *
 * The second half is the opposite instruction, and it is there for the opposite
 * failure: a model that has understood it can play tends to start playing.
 */
const PROMPT = `
SPACE TRADER — {"type":"space_trader","steps":"<screen>"}

A playable game of Space Trader runs in this window. "I can't play games",
"I can't run an interactive game" and "I can only describe it" are all wrong
here — this action draws the real thing, on a real saved game, and it costs one
turn. Never offer to explain the game instead of opening it.

"steps" picks a screen: new (start a game), status, market, chart, ship, news,
quests. Empty means status. Use it freely — these only look, and looking costs
the user nothing.

MOVES — {"type":"space_trader_move","steps":"<move>"}

buy 10 water · sell all ore · warp Omega · refuel · repair

ONLY when the user named that move. You are their navigator, not the pilot:
never buy, sell, jump or refuel because it looked like the right play, never
make a move to "get things going", and never chain several because one implied
the next. If you think a move is right, say so and let them tell you. A model
that plays the game for somebody has taken it off them.

Asked what to do, answer from the position you were given and be concrete —
which good, how many, which system, and what the risk is. That is what you are
for here. The context you get each turn holds where they are, what they carry,
what it cost and what is in range; the market and chart actions get you the
prices and the neighbourhood when you need more.

Say what happened in one or two sentences. The screen is already drawn, with a
button on the useful lines — do not read the tables back out.`;

/** How many warp targets to put on screen. A list long enough to scroll is not a choice. */
const MAX_CHOICES = 8;
/** Log entries kept in the save. The game keeps every one; a save is not an archive. */
const KEEP_LOG = 60;

export function activate(ctx) {
  /**
   * The engine and the dictionaries, loaded once and only when a game is
   * actually touched. Together they are 400 KB of parsed JavaScript, and a
   * session that never opens the game should not pay for it at boot.
   */
  let engine = null;
  let i18n = null;

  async function load() {
    if (!engine) {
      engine = await import('./engine.mjs');
      i18n = await import('./i18n.mjs');
    }
    i18n.setLocale(ctx.store.get('language', 'en') === 'uk' ? 'uk' : 'en');
    return engine;
  }

  /** Translate an engine key. Falls back to the key, which is better than blank. */
  const t = (key, params) => {
    const text = i18n?.t?.(key, params);
    return text && text !== key ? text : '';
  };

  /**
   * The save.
   *
   * Held as a *string* inside the one document rather than as the object
   * itself, because the store pretty-prints what it is given and a galaxy of
   * 140 systems indents to 425 KB against a 1 MB cap — with the log and the
   * quest list still to grow into it. Stringified first it is 249 KB and stays
   * there. The cost is a second parse, which is nothing next to running out of
   * room to save a game somebody is in the middle of.
   */
  async function read() {
    const doc = await ctx.state.get();
    if (!doc?.save) return null;
    try {
      return JSON.parse(doc.save);
    } catch (err) {
      ctx.log(`the saved game could not be read — ${err.message}`);
      return null;
    }
  }

  async function write(state) {
    // The engine keeps every line it ever logged, newest first. Worth showing,
    // not worth carrying forever: this is the one thing in a save with no
    // ceiling on it.
    const trimmed = { ...state, log: (state.log ?? []).slice(0, KEEP_LOG) };
    await ctx.state.set({ save: JSON.stringify(trimmed), day: state.day, commander: state.commanderName });
  }

  /* ---------- reading what the user asked for ---------- */

  /** Goods are matched by id and by name, in whichever language is set. */
  function findGood(text) {
    const wanted = text.trim().toLowerCase();
    if (!wanted) return null;
    for (const id of engine.GOOD_IDS) {
      if (id.toLowerCase() === wanted) return id;
      const name = t(`good.${id}`).toLowerCase();
      if (name && name === wanted) return id;
    }
    // A prefix, so "narco" and "spring" reach the good they obviously mean.
    for (const id of engine.GOOD_IDS) {
      const name = t(`good.${id}`).toLowerCase();
      if (id.toLowerCase().startsWith(wanted) || (name && name.startsWith(wanted))) return id;
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

  /* ---------- encounters ---------- */

  /**
   * Play an encounter out to its end under one posture.
   *
   * A round at a time with a button between them is what the game does and what
   * this medium cannot: `choose` cannot draw the next round, so a fight fought
   * that way would report itself entirely on the status bar, one line at a time.
   * So the posture is chosen before the jump and the whole exchange resolves at
   * once, with every round's own words kept — which is the part worth reading
   * afterwards anyway.
   *
   * Bounded because it is a loop around somebody else's state machine. An
   * encounter that will not settle is a bug in the engine or in this posture,
   * and either way an app that stops responding is the worse of the two
   * outcomes.
   */
  function fightItOut(state, encounter, stance) {
    const rng = new engine.Rng((state.seed ^ (state.day * 2654435761) ^ encounter.round) >>> 0);
    const before = encounter.messages.length;

    for (let round = 0; round < 60 && encounter.status === 'ongoing'; round += 1) {
      let move = stance === 'fight' ? 'attack' : 'flee';
      // Nobody is chasing a hauler, so there is nothing to run from: the way
      // past one is to leave it alone. The engine refuses `flee` here outright,
      // and refusing it silently would spin this loop to its bound.
      if (engine.isPeacefulTrader(encounter)) move = 'ignore';
      else if (encounter.kind === 'police' && stance !== 'fight') move = 'submit';
      engine.resolveRound(state, encounter, move, rng);
    }

    return {
      status: encounter.status,
      log: messages(encounter.messages.slice(before), t),
    };
  }

  /* ---------- screens ---------- */

  function chartScreen(state) {
    const targets = destinations(engine, state, MAX_CHOICES);
    const here = engine.currentSystem(state);
    const lines = [
      `CHART — from ${here.nameId}, range ${engine.maxRange(state)} parsecs`,
      '',
      chart(engine, state),
      '',
      'IN RANGE',
    ];
    for (const { sys, fuel, distance } of targets) {
      lines.push(
        `  ${sys.nameId.padEnd(12)} ${String(Math.round(distance)).padStart(3)} pc   ${String(fuel).padStart(2)} fuel   ` +
          (sys.visited ? `tech ${sys.techLevel}  ${sys.economyType}` : 'never visited'),
      );
    }
    if (!targets.length) lines.push('  nothing in range — refuel first');

    return {
      summary: lines.join('\n'),
      choices: targets.map(({ sys, fuel }) => ({
        id: `warp:${sys.id}`,
        label: `Warp to ${sys.nameId}`,
        note: `${fuel} fuel${sys.visited ? '' : ' · unvisited'}`,
      })),
    };
  }

  function marketScreen(state) {
    const sys = engine.currentSystem(state);
    const held = engine.GOOD_IDS.filter((id) => (state.ship.cargo?.[id] ?? 0) > 0 && (sys.sellPrice?.[id] ?? 0) > 0);
    return {
      summary: `MARKET — ${sys.nameId}\n\n${market(engine, state, t)}`,
      // Selling what is already aboard is the one move whose whole result fits
      // in a sentence, so it is the one that belongs on a button.
      choices: held.slice(0, MAX_CHOICES).map((id) => ({
        id: `sellall:${id}`,
        label: `Sell all ${t(`good.${id}`) || id}`,
        note: `${state.ship.cargo[id]} × ${sys.sellPrice[id]} cr`,
      })),
    };
  }

  function newsScreen(state) {
    const sys = engine.currentSystem(state);
    const items = (sys.news ?? []).map((item) => `• ${t(item.key, item.params) || item.key}`);
    return {
      summary: `${sys.nameId.toUpperCase()} — day ${state.day}\n\n${items.join('\n') || 'Nothing is being reported here.'}`,
    };
  }

  function shipScreen(state) {
    const ship = state.ship;
    const lines = [
      `SHIP — ${t(`shipType.${ship.type}`) || ship.type}`,
      '',
      status(engine, state, t),
      '',
      `weapons  ${(ship.weapons ?? []).map((w) => t(`weapon.${w}`) || w).join(', ') || 'none'}`,
      `shields  ${(ship.shields ?? []).map((s) => t(`shield.${s}`) || s).join(', ') || 'none'}`,
      `gadgets  ${(ship.gadgets ?? []).map((g) => t(`gadget.${g}`) || g).join(', ') || 'none'}`,
      `crew     ${(ship.crew ?? []).length} aboard, ${engine.freeQuarters(ship)} quarters free`,
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
    const open = (state.quests ?? []).filter((q) => q.status === 'active');
    const lines = open.map((q) => {
      const system = state.systems[q.targetSystem]?.nameId ?? '';
      const params = { system, amount: q.amount ?? 0, good: t(`good.${q.good}`) || q.good || '', bounty: q.bountyName ?? '', passenger: q.passengerName ?? '' };
      const text = t(`quest.desc.${q.type}`, params) || t(`quest.type.${q.type}`) || q.type;
      return `• ${text}   (${q.reward} cr)`;
    });
    return { summary: `JOBS\n\n${lines.join('\n') || 'Nothing accepted. The job board is on the planet.'}` };
  }

  /* ---------- the actions ---------- */

  ctx.action({
    type: 'space_trader',
    async run(steps) {
      await load();
      const want = String(steps ?? '').trim().toLowerCase();
      let state = await read();

      if (want.startsWith('new') || (!state && want !== 'status')) {
        const named = String(steps ?? '').replace(/^\s*new\s*(game)?\s*/i, '').trim();
        const commander = named || ctx.store.get('commander', '') || 'Jameson';
        state = engine.newGame({ commanderName: commander });
        await write(state);
        const sys = engine.currentSystem(state);
        return {
          ok: true,
          summary: `A new game.\n\n${status(engine, state, t)}`,
          feedback:
            `A new game has started for commander ${commander} at ${sys.nameId} with ${state.credits} cr ` +
            `and a Flea. Say so briefly and offer to show the market or the chart.`,
        };
      }

      if (!state) {
        return {
          ok: false,
          summary: 'No game is saved. Start one and it begins at a random system with 1000 credits.',
          feedback: 'There is no saved game. Tell the user, and offer to start one — do not start it yourself.',
        };
      }

      const screen =
        want.startsWith('market') || want.startsWith('price')
          ? marketScreen(state)
          : want.startsWith('chart') || want.startsWith('map')
            ? chartScreen(state)
            : want.startsWith('news')
              ? newsScreen(state)
              : want.startsWith('ship')
                ? shipScreen(state)
                : want.startsWith('quest') || want.startsWith('job')
                  ? questScreen(state)
                  : { summary: status(engine, state, t) };

      return {
        ok: true,
        ...screen,
        feedback: `[SPACE TRADER] The ${want || 'status'} screen is on the user's screen.\n${briefing(engine, state)}`,
      };
    },

    /**
     * A button.
     *
     * Whatever it does has to be sayable in one line, because a line on the
     * status bar is the whole of what a click can produce — the turn that drew
     * the buttons finished long ago and there is no card left to redraw.
     */
    async choose(choiceId) {
      await load();
      const state = await read();
      if (!state) throw new Error('there is no game running');

      const [what, argument] = String(choiceId).split(':');

      if (what === 'sellall') {
        const held = state.ship.cargo?.[argument] ?? 0;
        if (!held) throw new Error(`no ${t(`good.${argument}`) || argument} aboard any more`);
        const result = engine.sellGood(state, argument, held);
        if (!result.ok) throw new Error(t(result.error) || 'that sale was refused');
        await write(state);
        return `${messages([result.info], t)} — ${credits(state.credits)}`;
      }

      if (what === 'warp') {
        const target = state.systems[Number(argument)];
        if (!target) throw new Error('that system is not on the chart any more');
        return await jump(state, target);
      }

      throw new Error('that button belongs to an older game');
    },
  });

  /** Everything a jump involves, from either a button or an explicit move. */
  async function jump(state, target) {
    const stance = ctx.store.get('stance', 'avoid') === 'fight' ? 'fight' : 'avoid';
    const result = engine.warp(state, target.id);
    if (!result.ok) {
      throw new Error(t(result.error) || 'that jump is not possible');
    }

    const notes = [];
    for (const encounter of result.encounters ?? []) {
      const fought = fightItOut(state, encounter, stance);
      notes.push(fought.log);
      // Nothing after this matters: the game is over and saving a dead
      // commander's next move would be the app arguing with the engine.
      if (state.ship.hull <= 0) break;
    }
    if (result.event) notes.push(t(result.event.bodyKey, result.event.params));

    await write(state);
    const arrived = state.systems[result.arrivedAt ?? target.id];
    const met = (result.encounters ?? []).length;
    return `Arrived at ${arrived.nameId}${met ? `, ${met} met on the way` : ''}. Fuel ${state.ship.fuel}, hull ${state.ship.hull}.`;
  }

  ctx.action({
    type: 'space_trader_move',
    async run(steps) {
      await load();
      const state = await read();
      if (!state) {
        return {
          ok: false,
          summary: 'No game is running.',
          feedback: 'There is no saved game, so there is no move to make. Offer to start one.',
        };
      }

      const said = String(steps ?? '').trim();
      const [, verb = '', rest = ''] = said.match(/^(\w+)\s*(.*)$/s) ?? [];
      const move = verb.toLowerCase();

      /* --- buying and selling --- */
      if (move === 'buy' || move === 'sell') {
        const [, amountText = '', goodText = ''] = rest.match(/^(\S+)\s+(.*)$/s) ?? [];
        const good = findGood(goodText || rest);
        if (!good) {
          return refuse(state, `"${goodText || rest}" is not a commodity in this game`);
        }

        const sys = engine.currentSystem(state);
        let amount = Number.parseInt(amountText, 10);
        if (!Number.isFinite(amount)) {
          // "all" and "max" are what a person says, and they mean different
          // things on the two sides of the trade.
          if (move === 'sell') amount = state.ship.cargo?.[good] ?? 0;
          else {
            const price = engine.marketBuyPrice(state, good);
            amount = Math.min(engine.freeCargoBays(state.ship), price ? Math.floor(state.credits / price) : 0);
          }
        }
        if (!(amount > 0)) return refuse(state, `there is nothing to ${move} there`);

        const result = move === 'buy' ? engine.buyGood(state, good, amount) : engine.sellGood(state, good, amount);
        if (!result.ok) {
          return refuse(state, t(result.error) || 'the market refused that');
        }
        await write(state);
        return {
          ok: true,
          summary: `${messages([result.info], t)}\n\n${market(engine, state, t)}`,
          feedback: `[SPACE TRADER] ${messages([result.info], t)}\n${briefing(engine, state)}`,
        };
      }

      /* --- moving --- */
      if (move === 'warp' || move === 'jump' || move === 'travel' || move === 'go') {
        const target = findSystem(state, rest.replace(/^to\s+/i, ''));
        if (!target) return refuse(state, `there is no system called "${rest}" on the chart`);
        let line;
        try {
          line = await jump(state, target);
        } catch (err) {
          return refuse(state, err.message);
        }
        const dead = state.ship.hull <= 0;
        return {
          ok: !dead,
          summary: `${line}\n\n${dead ? 'The ship did not survive it.' : status(engine, state, t)}`,
          feedback: `[SPACE TRADER] ${line}\n${dead ? 'The commander is dead; the game is over.' : briefing(engine, state)}`,
        };
      }

      /* --- the two things a planet does for a ship --- */
      if (move === 'refuel') {
        const want = Number.parseInt(rest, 10);
        const room = engine.maxFuel(state.ship) - state.ship.fuel;
        const result = engine.refuel(state, Number.isFinite(want) ? Math.min(want, room) : room);
        if (!result.ok) return refuse(state, t(result.error) || 'no fuel was sold');
        await write(state);
        return {
          ok: true,
          summary: `${messages([result.info], t)}\n\n${status(engine, state, t)}`,
          feedback: `[SPACE TRADER] ${messages([result.info], t)}\n${briefing(engine, state)}`,
        };
      }

      if (move === 'repair') {
        const result = engine.repair(state, engine.maxHull(state.ship) - state.ship.hull);
        if (!result.ok) return refuse(state, t(result.error) || 'no repairs were made');
        await write(state);
        return {
          ok: true,
          summary: `${messages([result.info], t)}\n\n${status(engine, state, t)}`,
          feedback: `[SPACE TRADER] ${messages([result.info], t)}\n${briefing(engine, state)}`,
        };
      }

      return refuse(state, `"${said}" is not a move — buy, sell, warp, refuel and repair are`);
    },
  });

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
      feedback: `[SPACE TRADER] That move was refused: ${reason}. Tell the user and do not retry it.\n${briefing(engine, state)}`,
    };
  }

  ctx.prompt(PROMPT);

  /**
   * The position, every turn.
   *
   * Only while a game exists, and only ever the briefing — never the market
   * table. This is re-sent on every turn of every conversation, counted against
   * the window, and paid for by turns that have nothing to do with the game.
   */
  ctx.context(async () => {
    const doc = await ctx.state.get();
    if (!doc?.save) return '';
    await load();
    const state = await read();
    return state ? briefing(engine, state) : '';
  });

  /** A language change is the one setting that rewrites every screen. */
  ctx.onSettingsChanged((key) => {
    if (key === 'language' && i18n) i18n.setLocale(ctx.store.get('language', 'en') === 'uk' ? 'uk' : 'en');
  });
}
