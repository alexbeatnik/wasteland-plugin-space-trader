/**
 * The fight, fought a round at a time.
 *
 * The engine has always had a real combat model — a hit chance from the
 * gunner's skill against the other pilot's, shields that soak before the hull,
 * range that costs accuracy, crews that give more actions a round, tractor
 * beams, bribes, surrenders and a fleet that sends the next ship in when one
 * goes down. None of it was reachable. A plugin had one string and a row of
 * buttons under a card to draw with, a button could not draw the next round,
 * and so the whole exchange was resolved at once under a posture chosen before
 * the jump: you set "run" or "fight it out" in the settings and read the
 * transcript afterwards.
 *
 * The panel removed that constraint. `act` may redraw the scene, so a round is
 * a keypress that costs no turn and no tokens, and the choice that matters —
 * close the range or hold it, shoot or run, pay them or take the hit — is back
 * with the player where it belongs.
 *
 * What lives here is the fight's own state and its panel. Everything is pure:
 * the engine, the game's dictionary, a saved game and a fight record go in, and
 * a document or a list of lines comes out. The engine decides what happens; this
 * decides what may be pressed and what it looked like.
 *
 * The record is plain JSON and lives in the plugin's document, so a fight
 * survives closing the app: the queue of ships met on one jump, which of them is
 * being fought, everything said so far, and the arrival that is waiting for the
 * shooting to stop.
 */
import { clip, credits as money, group as digits, t } from './words.mjs';

/** A loop around somebody else's state machine wants a bound. */
const MAX_ROUNDS = 60;
/** Lines of the fight kept on the sheet. The host draws 60 rows at most. */
const LOG_ROWS = 30;

/** The ship being fought, or nothing when the whole queue is spent. */
export function current(fight) {
  return fight?.queue?.[fight.at] ?? null;
}

/** Is this one finished with? */
export function settled(encounter) {
  return !encounter || encounter.status !== 'ongoing';
}

/**
 * The die for one action.
 *
 * Seeded from the encounter's own seed and the count of actions taken in it, so
 * a round is deterministic in the save — reloading and pressing ATTACK again
 * gets the same shot, exactly as reloading and jumping again gets the same
 * pirate. `enc.round` is incremented by the engine on every action, which makes
 * it the counter this needs rather than a second one kept here.
 */
function dieFor(engine, encounter) {
  return new engine.Rng(((encounter.seed ?? 0) + encounter.round * 2654435761) >>> 0);
}

/**
 * Everything said since the last look, rendered and filed.
 *
 * Filed with the round it happened in, because the sheet draws rows and a row
 * is a short label with a longer note under it. The sentence has to be the
 * note: a label is cut at forty-eight characters, and "A bounty hunter in a
 * Hornet has come to collect on your head!" is not forty-eight characters — it
 * came out as "…has come to collect ", cut mid-word by the host.
 */
function harvest(dict, fight) {
  const encounter = current(fight);
  if (!encounter) return [];
  const fresh = encounter.messages
    .slice(fight.told ?? 0)
    .map((entry) => dict.renderMessage(entry.key, entry.params))
    .filter(Boolean);
  fight.told = encounter.messages.length;
  const round = Math.max(1, encounter.round);
  fight.log = [...(fight.log ?? []), ...fresh.map((text) => ({ round, text }))];
  return fresh;
}

/** The words of a filed line, whichever shape it was filed in. */
function spoken(entry) {
  return typeof entry === 'string' ? entry : entry?.text ?? '';
}

/**
 * A jump that met somebody.
 *
 * The queue is every ship rolled for that leg — one jump can meet three — and
 * they are fought one at a time. `arrival` is what is waiting on the other side
 * of the shooting: where the ship ended up, and anything else that happened on
 * the way.
 */
export function open(dict, encounters, arrival) {
  const fight = { queue: encounters, at: 0, told: 0, log: [], arrival };
  harvest(dict, fight);
  return fight;
}

/**
 * On to the next ship, or nothing left.
 *
 * Answers with the new one's opening lines — taken at once rather than on the
 * next press, because they are what tells the player who has just arrived — and
 * with `null` when the queue is spent. An empty array is still an answer, so a
 * caller may test it for truth.
 */
export function advance(dict, fight) {
  fight.at += 1;
  fight.told = 0;
  if (!current(fight)) return null;
  return harvest(dict, fight);
}

/** Is there anything aboard the other ship worth taking, and room for it? */
export function canPlunder(engine, state, encounter) {
  if (!encounter || encounter.status !== 'oppSurrendered') return false;
  if (engine.freeCargoBays(state.ship) <= 0) return false;
  return engine.GOOD_IDS.some((id) => (encounter.opponent.cargo?.[id] ?? 0) > 0);
}

/**
 * The stall a lone hauler keeps.
 *
 * The engine deals every solitary trader a hand of goods it will sell and a
 * short list it will buy, priced off the base rather than off any market — a
 * caravan met three parsecs out is a market no chart knows about, which is the
 * whole point of it. None of it was reachable from here: the plugin's fight had
 * a row of buttons and a row cannot hold a price list, so the one encounter in
 * the game that is not a gunfight was fought like one.
 *
 * It closes the moment the first shot is fired — `isPeacefulTrader` is false
 * from then on — and the engine refuses both sides once the encounter stops
 * being `ongoing`. Asked here as well, because a row that can be pressed into
 * a refusal is a row that should not have been drawn.
 */
export function canTrade(engine, encounter) {
  return Boolean(
    encounter
    && encounter.kind === 'trader'
    && encounter.status === 'ongoing'
    && encounter.trade
    && engine.isPeacefulTrader(encounter),
  );
}

/**
 * How many of one good may change hands, on whichever side of it.
 *
 * Three ceilings on the way in — their stock, the credits and the free bays —
 * and one on the way out, which is what is aboard. The engine applies the same
 * limits itself and would simply sell fewer; worked out here so the field can
 * open with the answer in it rather than with a number that gets quietly cut.
 */
export function tradeCeiling(engine, state, encounter, kind, good) {
  if (kind === 'tradeSell') return state.ship.cargo?.[good] ?? 0;
  const offer = encounter?.trade?.sells?.[good];
  if (!offer || offer.price <= 0) return 0;
  return Math.max(0, Math.min(offer.qty, engine.freeCargoBays(state.ship), Math.floor(state.credits / offer.price)));
}

/** What a unit costs on their terms, whichever way it is going. */
function tradePrice(encounter, kind, good) {
  return kind === 'tradeSell'
    ? encounter?.trade?.buys?.[good] ?? 0
    : encounter?.trade?.sells?.[good]?.price ?? 0;
}

/**
 * How many, at their price.
 *
 * The same one-line field the market uses, and deliberately the same shape: a
 * trade is a number wherever it happens, and a player who has bought water on a
 * planet should not have to learn a second way to buy it in space.
 */
export function tradeEntry(engine, dict, state, encounter, { kind, good }) {
  const most = tradeCeiling(engine, state, encounter, kind, good);
  return {
    action: 'amount',
    label: t(kind === 'tradeSell' ? 'fight.entry.sell' : 'fight.entry.buy', {
      good: dict.goodName(good),
      price: digits(tradePrice(encounter, kind, good)),
      max: most,
    }),
    hint: t('fight.entry.hint'),
    placeholder: String(most),
    value: String(most),
    submit: t(kind === 'tradeSell' ? 'fight.entry.sellSubmit' : 'fight.entry.buySubmit'),
  };
}

/**
 * Walking away, and who is allowed to.
 *
 * The engine will end any encounter on `ignore` — it leaves the question to
 * whoever is driving it — and offering that against a pirate would be a button
 * that wins the fight by declining it. A hauler minding its own business is the
 * case it exists for: there is nothing to run from and nothing to settle, and
 * the way past one is to leave it alone.
 */
function canIgnore(engine, encounter) {
  return engine.isPeacefulTrader(encounter);
}

/**
 * One action, and what it looked like.
 *
 * The engine is handed the move and the die, and answers by mutating the
 * encounter and the game. Nothing is decided here — including whether the
 * action was legal, which the engine already refuses in its own terms.
 */
export function resolve(engine, dict, state, fight, move) {
  const encounter = current(fight);
  if (!encounter) return [];

  if (move === 'plunder') {
    const taken = engine.plunder(state, encounter);
    const lines = harvest(dict, fight);
    // `plunder` writes to the *game's* log rather than the encounter's, so the
    // one number worth reading has to be said here.
    const said = taken > 0 ? t('fight.plundered', { n: taken }) : t('fight.plunderedNothing');
    fight.log.push(said);
    return [said, ...lines];
  }

  engine.resolveRound(state, encounter, move, dieFor(engine, encounter));
  return harvest(dict, fight);
}

/**
 * The rest of this one, under a standing posture.
 *
 * What the whole fight used to be, kept for two callers: the AUTO button, for a
 * player who does not want to press through a gunfight with a hauler, and a
 * host with no panel at all, where there is nothing to press.
 *
 * Bounded because it is a loop around somebody else's state machine. An
 * encounter that will not settle is a bug in the engine or in this posture, and
 * either way an app that stops responding is the worse of the two outcomes.
 */
export function auto(engine, dict, state, fight, stance) {
  const encounter = current(fight);
  if (!encounter) return [];
  const before = fight.log.length;

  for (let round = 0; round < MAX_ROUNDS && encounter.status === 'ongoing'; round += 1) {
    let move = stance === 'fight' ? 'attack' : 'flee';
    // The engine refuses `flee` against a hauler outright, and refusing it
    // silently would spin this loop to its bound.
    if (canIgnore(engine, encounter)) move = 'ignore';
    else if (encounter.kind === 'police' && stance !== 'fight') move = 'submit';
    engine.resolveRound(state, encounter, move, dieFor(engine, encounter));
    harvest(dict, fight);
  }
  return fight.log.slice(before).map(spoken);
}

/* ---------- the panel ---------- */

function fraction(value, max) {
  return max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
}

function meterTone(value, max) {
  const part = fraction(value, max);
  if (part <= 0.25) return 'bad';
  if (part <= 0.5) return 'warn';
  return '';
}

/** A chance, as the whole number a person can decide against. */
function odds(value) {
  return Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100);
}

/** Who this is: a pirate, the police, a hauler, something else. */
export function who(dict, encounter) {
  return dict.t(`encounter.kind.${encounter.kind}`);
}

/** Which ship they are flying. */
export function theirShip(dict, encounter) {
  return dict.shipName(encounter.opponent.shipType);
}

/**
 * What may be pressed, and in the order the digits land on it.
 *
 * Built from the encounter rather than fixed: SUBMIT is the police and nobody
 * else, a bribe that costs nothing to a government that takes none is not
 * offered, and CLOSE IN is absent at point-blank range where it would do
 * nothing. A button that answers "you cannot do that here" is a button that
 * should not have been drawn.
 */
export function moves(engine, state, fight, { stance = 'avoid' } = {}) {
  const encounter = current(fight);
  if (!encounter) return [];

  if (settled(encounter)) {
    const list = [];
    if (canPlunder(engine, state, encounter)) {
      list.push({ id: 'fight-plunder', label: t('fight.move.plunder.label'), hint: t('fight.move.plunder.hint'), tone: 'good' });
    }
    const more = fight.at + 1 < fight.queue.length;
    list.push({
      id: 'fight-on',
      label: more ? t('fight.move.next.label') : t('fight.move.done.label'),
      hint: more ? t('fight.move.next.hint', { n: fight.queue.length - fight.at - 1 }) : t('fight.move.done.hint'),
      tone: 'good',
    });
    return list;
  }

  const opponent = encounter.opponent;
  const skills = engine.effectiveSkills(state);
  const list = [{
    id: 'fight-attack',
    label: t('fight.move.attack.label'),
    // A hauler that has done nothing is one press away from being an enemy, and
    // the press does not come back: `provoked` is set for the rest of the
    // encounter, the stall closes with it, and it is piracy the law counts. The
    // hit chance is true of that press too, and it is not what it costs.
    hint: engine.weaponPower(state.ship) <= 0
      ? t('fight.move.attack.unarmed')
      : canIgnore(engine, encounter)
        ? t('fight.move.attack.trader')
        : t('fight.move.attack.hint', { chance: odds(engine.playerHitChance(state, encounter)) }),
    tone: 'bad',
  }];

  if (canIgnore(engine, encounter)) {
    list.push({ id: 'fight-ignore', label: t('fight.move.ignore.label'), hint: t('fight.move.ignore.hint'), tone: 'good' });
    // Their stall, and only while it is open. Two price lists, so it belongs
    // behind the sheet rather than on the row — but nothing would say the sheet
    // had anything new in it without a button that says so.
    if (canTrade(engine, encounter)) {
      list.push({ id: 'fight-trade', label: t('fight.move.trade.label'), hint: t('fight.move.trade.hint'), tone: 'good' });
    }
  } else {
    // Under a tractor beam RUN is not running, it is pulling against the beam —
    // a different move with a different chance, and the label should not claim
    // otherwise.
    list.push({
      id: 'fight-flee',
      label: t(encounter.tractorLocked ? 'fight.move.breakFree.label' : 'fight.move.flee.label'),
      hint: encounter.tractorLocked
        ? t('fight.move.flee.locked')
        : t('fight.move.flee.hint', { chance: odds(engine.fleeChance(state, encounter, skills.pilot)) }),
      tone: encounter.tractorLocked ? 'warn' : '',
    });
  }

  if (opponent.distance > engine.POINT_BLANK_RANGE) {
    list.push({ id: 'fight-closeIn', label: t('fight.move.closeIn.label'), hint: t('fight.move.closeIn.hint') });
  }
  if (opponent.distance < engine.MAX_ENGAGEMENT_RANGE) {
    list.push({ id: 'fight-openRange', label: t('fight.move.openRange.label'), hint: t('fight.move.openRange.hint') });
  }

  if (encounter.kind === 'police') {
    list.push({ id: 'fight-submit', label: t('fight.move.submit.label'), hint: t('fight.move.submit.hint') });
  }
  if (encounter.bribeCost > 0) {
    list.push({
      id: 'fight-bribe',
      label: t('fight.move.bribe.label'),
      hint: t('fight.move.bribe.hint', { amount: money(encounter.bribeCost) }),
      tone: state.credits >= encounter.bribeCost ? '' : 'warn',
    });
  }
  if (encounter.kind === 'pirate' || encounter.kind === 'police' || encounter.kind === 'bountyHunter') {
    // Named after what they are demanding rather than after the act of giving
    // in. A pirate wants the hold and a bounty hunter wants you, and "SURRENDER"
    // in front of both hides the only difference that matters — one of them
    // costs cargo and the other costs the days of a sentence.
    const demand = encounter.demand === 'arrest' || encounter.demand === 'cargo' ? encounter.demand : 'plain';
    list.push({
      id: 'fight-surrender',
      label: t(`fight.move.surrender.label.${demand}`),
      hint: t(`fight.move.surrender.${encounter.kind}`),
      tone: 'warn',
    });
  }

  // The posture comes in from the caller rather than being read here: the
  // setting lives in the store, this file may not reach it, and a hint that
  // says "runs" while the setting says "fights" is worse than no hint.
  list.push({ id: 'fight-auto', label: t('fight.move.auto.label'), hint: t(`fight.move.auto.${stance === 'fight' ? 'fight' : 'avoid'}`) });

  // Last, and only mid-turn, which is the only time it means anything: a crew
  // gets more than one action a round and this is how you decline the rest of
  // them. Last because the app puts the digits on by position and only the
  // first nine get one — this is the move to lose a hotkey before LET IT PLAY
  // does.
  if (encounter.actionsLeft > 0 && encounter.actionsLeft < encounter.actionsPerRound) {
    list.push({ id: 'fight-endTurn', label: t('fight.move.endTurn.label'), hint: t('fight.move.endTurn.hint') });
  }
  return list;
}

/**
 * Their stall, as two lists that can be pressed.
 *
 * What they will sell and what they will buy, in that order, because the first
 * is the reason to stop and the second is what to do about the hold while you
 * are stopped. A row nothing can be done with — sold out, or a good there is
 * none of aboard — is drawn without an action rather than left out: "they want
 * furs" is worth knowing on a run that has none, and a row that could be
 * clicked and did nothing is the one thing worse than a row that plainly
 * cannot.
 */
function tradeGroups(engine, dict, state, encounter) {
  const trade = encounter.trade ?? {};

  const onOffer = engine.GOOD_IDS
    .filter((id) => (trade.sells?.[id]?.qty ?? 0) > 0)
    .map((id) => {
      const offer = trade.sells[id];
      const most = tradeCeiling(engine, state, encounter, 'tradeBuy', id);
      return {
        label: dict.goodName(id),
        note: most > 0
          ? t('fight.row.onOffer', { price: digits(offer.price), qty: offer.qty, max: most })
          : t('fight.row.onOfferNo', { price: digits(offer.price), qty: offer.qty }),
        tone: most > 0 ? 'good' : '',
        action: most > 0 ? `fight-buy-${id}` : '',
      };
    });

  const wanted = engine.GOOD_IDS
    .filter((id) => (trade.buys?.[id] ?? 0) > 0)
    .map((id) => {
      const held = state.ship.cargo?.[id] ?? 0;
      return {
        label: dict.goodName(id),
        note: held > 0
          ? t('fight.row.wanted', { price: digits(trade.buys[id]), n: held })
          : t('fight.row.wantedNo', { price: digits(trade.buys[id]) }),
        tone: held > 0 ? 'good' : '',
        action: held > 0 ? `fight-sell-${id}` : '',
      };
    });

  return [
    { label: t('fight.group.onOffer'), empty: t('fight.group.onOffer.empty'), items: onOffer },
    { label: t('fight.group.wanted'), empty: t('fight.group.wanted.empty'), items: wanted },
  ];
}

/** The lists behind the sheet, while there is shooting. */
function groups(engine, dict, state, fight) {
  const encounter = current(fight);
  const log = (fight.log ?? []).slice(-LOG_ROWS).map((entry) => ({
    label: t('fight.row.round', { n: entry.round ?? 1 }),
    note: clip(spoken(entry)),
  }));

  const cargo = engine.GOOD_IDS
    .filter((id) => (encounter.opponent.cargo?.[id] ?? 0) > 0)
    .map((id) => ({
      label: dict.goodName(id),
      note: t('fight.row.theirCargo', { n: encounter.opponent.cargo[id] }),
    }));

  /**
   * The wing, wrecks and all.
   *
   * The dead first because they are what is no longer coming, then everyone
   * still flying in order of range — the order the fight is actually in, and
   * the order the remake draws them in. Each still-flying row is pressable:
   * switching target is free, and a wing of five with one cripple in it is a
   * decision. The odds are on the row because that is the number the decision
   * turns on — range costs accuracy, and the near cripple is not always the
   * better shot.
   */
  const wrecks = (encounter.downed ?? []).map((type) => ({
    label: dict.shipName(type),
    note: t('fight.row.wreck'),
  }));

  const flying = (encounter.reserves ?? [])
    .map((ship, index) => ({ ship, index }))
    .sort((a, b) => a.ship.distance - b.ship.distance)
    .map(({ ship, index }) => ({
      label: dict.shipName(ship.shipType),
      note: t('fight.row.reserve', {
        hull: ship.hull,
        max: ship.maxHull,
        distance: Math.round(ship.distance),
        chance: odds(engine.playerHitChance(state, encounter, ship)),
      }),
      tone: ship.hull <= ship.maxHull * 0.25 ? 'warn' : '',
      action: settled(encounter) ? '' : `fight-target-${index}`,
    }));

  return [
    // First while there is a stall to shop at: pressing TRADE opens the sheet,
    // and what it opens on should be the thing that was pressed for.
    ...(canTrade(engine, encounter) ? tradeGroups(engine, dict, state, encounter) : []),
    { label: t('fight.group.log'), empty: t('fight.group.log.empty'), items: log },
    { label: t('fight.group.theirHold'), empty: t('fight.group.theirHold.empty'), items: cargo },
    { label: t('fight.group.fleet'), empty: t('fight.group.fleet.empty'), items: [...wrecks, ...flying] },
  ];
}

/**
 * The fight, as the panel shows it.
 *
 * Both ships on the same strip, in the same colours: hull red and shields blue,
 * theirs under yours. The range is a bar of its own because it is a number you
 * act on — accuracy falls off with it, and the two manoeuvre buttons are there
 * to move it.
 */
export function scene(engine, dict, state, fight, { stance = 'avoid', amount = null } = {}) {
  const encounter = current(fight);
  if (!encounter) return null;
  const ship = state.ship;
  const opponent = encounter.opponent;
  const maxHull = engine.maxHull(ship);
  const shieldPower = engine.totalShieldPower(ship);
  const over = settled(encounter);

  const meters = [
    { label: t('fight.meter.hull'), value: ship.hull, max: maxHull, accent: 'life', tone: meterTone(ship.hull, maxHull) },
  ];
  if (shieldPower > 0) {
    const charge = engine.currentShieldCharge(ship);
    meters.push({ label: t('fight.meter.shields'), value: charge, max: shieldPower, accent: 'mana', tone: meterTone(charge, shieldPower) });
  }
  meters.push({
    label: t('fight.meter.theirHull', { ship: theirShip(dict, encounter) }),
    value: Math.max(0, opponent.hull),
    max: opponent.maxHull,
    accent: 'life',
    tone: meterTone(opponent.hull, opponent.maxHull),
  });
  if (opponent.maxShield > 0) {
    meters.push({
      label: t('fight.meter.theirShields'),
      value: Math.max(0, opponent.shieldPoints ?? 0),
      max: opponent.maxShield,
      accent: 'mana',
    });
  }
  meters.push({
    label: t('fight.meter.range'),
    value: Math.round(opponent.distance),
    max: engine.MAX_ENGAGEMENT_RANGE,
    accent: 'vigour',
    tone: opponent.distance <= engine.POINT_BLANK_RANGE ? 'good' : '',
  });

  const fields = [];
  if (!over) {
    fields.push({
      label: t('fight.field.actions'),
      value: t('fight.field.actionsValue', { left: encounter.actionsLeft, of: encounter.actionsPerRound }),
      tone: encounter.actionsLeft > 1 ? 'good' : '',
    });
    /**
     * Where the actions come from.
     *
     * A round is one volley per gunner plus a manoeuvre if anybody is spare to
     * fly, and both halves are hired at a planet rather than fitted to the
     * ship. Shown because the number above is otherwise a rule with no visible
     * cause: a crew of one gets one action and no helm, and nothing on the
     * panel said why until the second berth was paid for.
     */
    const stations = engine.battleStations(state);
    fields.push({
      label: t('fight.field.stations'),
      value: t(stations.helm ? 'fight.field.stationsValue' : 'fight.field.stationsNoHelm', { n: stations.shots }),
      tone: stations.helm ? '' : 'warn',
    });
    fields.push({
      label: t('fight.field.yourOdds'),
      value: t('fight.field.percent', { n: odds(engine.playerHitChance(state, encounter)) }),
    });
    fields.push({
      label: t('fight.field.theirOdds'),
      value: t('fight.field.percent', { n: odds(engine.opponentHitChance(state, encounter)) }),
      tone: engine.opponentHitChance(state, encounter) > 0.6 ? 'bad' : '',
    });
  }
  fields.push({ label: t('fight.field.theirGuns'), value: String(opponent.weaponPower || 0), tone: opponent.weaponPower > engine.weaponPower(ship) ? 'bad' : '' });
  if (encounter.fleetSize > 1) {
    fields.push({
      label: t('fight.field.fleet'),
      value: t('fight.field.fleetValue', { left: (encounter.reserves ?? []).length + (over ? 0 : 1), of: encounter.fleetSize }),
      tone: (encounter.reserves ?? []).length > 0 ? 'warn' : '',
    });
  }
  if (fight.queue.length > 1) {
    fields.push({ label: t('fight.field.met'), value: t('fight.field.metValue', { at: fight.at + 1, of: fight.queue.length }) });
  }
  fields.push({ label: t('fight.field.credits'), value: money(state.credits) });

  const tags = [];
  if (encounter.tractorLocked) tags.push({ label: t('fight.tag.tractor'), tone: 'bad' });
  if (!over && opponent.hull <= opponent.maxHull * 0.25) tags.push({ label: t('fight.tag.crippled'), tone: 'good' });
  if (!over && ship.hull <= maxHull * 0.25) tags.push({ label: t('fight.tag.breached'), tone: 'bad' });
  if (encounter.defeated > 0) tags.push({ label: t('fight.tag.downed', { n: encounter.defeated }), tone: 'good' });
  if (encounter.provoked) tags.push({ label: t('fight.tag.provoked'), tone: 'warn' });
  if (over) tags.push({ label: t(`fight.tag.${encounter.status}`), tone: encounter.status === 'oppDestroyed' || encounter.status === 'oppSurrendered' || encounter.status === 'playerFled' ? 'good' : 'bad' });

  const document = {
    title: t('fight.title', { who: who(dict, encounter), ship: theirShip(dict, encounter) }),
    // A hauler with its stall open is not a round of anything, and calling it
    // "round 1" is what made every trader read as an ambush.
    subtitle: over
      ? t(`fight.over.${encounter.status}`, { ship: theirShip(dict, encounter) })
      : canTrade(engine, encounter)
        ? t('fight.subtitle.stall', { distance: Math.round(opponent.distance) })
        : t('fight.subtitle', { round: Math.max(1, encounter.round), distance: Math.round(opponent.distance) }),
    meters,
    fields,
    tags,
    groups: groups(engine, dict, state, fight),
    actions: moves(engine, state, fight, { stance }),
  };

  // The amount field, when a row of their stall has been pressed. Checked
  // against the stall as well as against the question, because the answer
  // arrives a press later and the first shot closes it in between.
  if (amount && canTrade(engine, encounter)) {
    document.entry = tradeEntry(engine, dict, state, encounter, amount);
  }
  return document;
}

/**
 * The whole account, for the transcript and for the model.
 *
 * Written once, when the shooting stops, rather than a line per round: a round
 * is a keypress and a keypress must not cost a turn, so the model is told what
 * happened when there is a "what happened" to tell.
 */
export function account(fight) {
  return (fight.log ?? []).map(spoken).filter(Boolean).join('\n');
}

/** What the model is told while the shooting is still going on. */
export function situation(engine, dict, state, fight) {
  const encounter = current(fight);
  if (!encounter) return '';
  const opponent = encounter.opponent;
  return [
    t(canTrade(engine, encounter) ? 'fight.context.headTrader' : 'fight.context.head', {
      who: who(dict, encounter),
      ship: theirShip(dict, encounter),
    }),
    t('fight.context.ships', {
      hull: state.ship.hull,
      maxHull: engine.maxHull(state.ship),
      theirHull: Math.max(0, opponent.hull),
      theirMax: opponent.maxHull,
      distance: Math.round(opponent.distance),
    }),
    settled(encounter) ? t(`fight.over.${encounter.status}`, { ship: theirShip(dict, encounter) }) : t('fight.context.moves'),
    // A stall is worth naming, because it is the one encounter that is not a
    // fight and a model told only about hulls and range advises on the shooting.
    canTrade(engine, encounter)
      ? t('fight.context.stall', {
        sells: engine.GOOD_IDS
          .filter((id) => (encounter.trade.sells?.[id]?.qty ?? 0) > 0)
          .map((id) => `${dict.goodName(id)} ${encounter.trade.sells[id].price}`)
          .join(', ') || t('fight.context.nothing'),
        buys: engine.GOOD_IDS
          .filter((id) => (encounter.trade.buys?.[id] ?? 0) > 0)
          .map((id) => `${dict.goodName(id)} ${encounter.trade.buys[id]}`)
          .join(', ') || t('fight.context.nothing'),
      })
      : '',
    t('fight.context.rule'),
    t('fight.context.said', { text: (fight.log ?? []).slice(-4).map(spoken).join(' ') || t('fight.context.nothing') }),
  ].filter(Boolean).join('\n');
}

/** The last thing that happened, short enough for the status bar. */
export function headline(lines) {
  const said = (lines ?? []).filter(Boolean);
  return said.slice(-2).join(' ') || '';
}
