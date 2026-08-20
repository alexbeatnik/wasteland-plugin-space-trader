/**
 * English — the source language.
 *
 * One key per phrase, flat and dotted, so two locale files can be diffed line
 * by line and a missing key is visible at a glance. Values with `{holes}` are
 * filled by `t()`; values that are objects are counted things and carry a form
 * per plural class.
 *
 * `re.*` entries are not phrases. They are the words the plugin listens for,
 * compiled into a regular expression, and the English ones stay in force in
 * every language — see `patterns()` in `words.mjs`.
 */
export const en = {
  /* ---------- numbers ---------- */

  'num.thousands': ',',
  'num.credits': '{amount} cr',

  /* ---------- what the model is told ---------- */

  'note.language': 'Answer the user in English.',

  'prompt.text': `
SPACE TRADER — {"type":"space_trader","steps":"<screen>"}

A playable game of Space Trader runs in this window. "I can't play games",
"I can't run an interactive game" and "I can only describe it" are all wrong
here — this action draws the real thing, on a real saved game, and it costs one
turn. Never offer to explain the game instead of opening it.

"steps" picks a screen: new (start a game), status, market, chart, ship, news,
jobs. Empty means status. Use it freely — these only look, and looking costs
the user nothing.

THE PANEL. While a game is running the user has a panel of their own above the
composer: the ship's bars, a row of moves numbered 1-9, a star chart and lists
behind them. Those buttons are real and pressing one costs no turn. You are not
told which are on the row this turn, so never name a button, never say "press
2", and never invent one — say what to do and let them find it. Everything on
the row can also be typed, so a move is never out of reach.

Never call either action with empty "steps". If the game sends a short line of
its own after a run begins, pass it to "space_trader" as it stands, or simply
answer — never as a move.

MOVES — {"type":"space_trader_move","steps":"<move>"}

buy 10 water · sell all ore · warp Omega · refuel · repair

Fuel and repairs are NOT bought on the market — they are the two moves above,
and no amount of looking at the commodity table will find them. "refuel" fills
the tank; "repair" mends the hull.

ONLY when the user named that move. You are their navigator, not the pilot:
never buy, sell, jump or refuel because it looked like the right play, never
make a move to "get things going", and never chain several because one implied
the next. If you think a move is right, say so and let them tell you. A model
that plays the game for somebody has taken it off them. When they DO name one —
"refuel", "buy 10 water", "let's go to Nyle" — make it, without asking again.

Asked what to trade, or what is worth carrying, open the market FIRST. You are
not told prices otherwise, and a recommendation made without them invents
commodities that are not in this game. The market action tells you what
everything costs here; the chart tells you what is in range and what the fuel
would be.

Asked what to do, answer from what you were actually given and be concrete —
which good, how many, which system, what it costs and what the risk is.

Say what happened in one or two sentences. The screen is already in front of
the user — do not read the tables back out, and never describe a screen you did
not produce this turn.

{language}`,

  /* ---------- the panel ---------- */

  'panel.title': '{commander} · {system}',
  'panel.subtitle': 'day {day} · {tech} · {economy} · {politics}',
  'panel.subtitle.situation': 'day {day} · {tech} · {economy} · {politics} · {situation}',
  'panel.subtitle.over': 'the {ship} was lost at {system} on day {day}',
  'panel.subtitle.setup': 'nothing has been flown yet',

  'panel.meter.hull': 'HULL',
  'panel.meter.shields': 'SHIELDS',
  'panel.meter.fuel': 'FUEL',
  'panel.meter.hold': 'HOLD',
  'panel.meter.day': 'DAY',

  'panel.field.credits': 'CREDITS',
  'panel.field.debt': 'DEBT',
  'panel.field.range': 'RANGE',
  'panel.field.rangeValue': '{parsecs} pc',
  'panel.field.record': 'RECORD',
  'panel.field.ship': 'SHIP',
  'panel.field.jobs': 'JOBS',
  'panel.field.jobsValue': { one: '{n} open', other: '{n} open' },
  'panel.field.inRange': 'IN RANGE',
  'panel.field.inRangeValue': { one: '{n} system', other: '{n} systems' },

  'panel.tag.wanted': 'WANTED',
  'panel.tag.debt': 'IN DEBT',
  'panel.tag.stranded': 'STRANDED',
  'panel.tag.breached': 'HULL BREACHED',
  'panel.tag.pod': 'ESCAPE POD',
  'panel.tag.insured': 'INSURED',
  'panel.tag.over': 'LOST',

  'panel.group.onsale': 'ON SALE HERE',
  'panel.group.onsale.empty': 'this planet trades in nothing',
  'panel.group.hold': 'IN THE HOLD',
  'panel.group.hold.empty': 'the hold is empty',
  'panel.group.ship': 'THE SHIP',
  'panel.group.ship.empty': 'nothing fitted',
  'panel.group.crew': 'ABOARD',
  'panel.group.crew.empty': 'flying alone',
  'panel.group.jobs': 'CONTRACTS',
  'panel.group.jobs.empty': 'nothing accepted — contracts are taken on the planet',
  'panel.group.board': 'THE JOB BOARD',
  'panel.group.board.empty': 'this port is offering nothing today',
  'panel.group.news': 'REPORTED HERE',
  'panel.group.news.empty': 'nothing is being reported here',
  'panel.group.log': 'THE LOG',
  'panel.group.log.empty': 'nothing has happened yet',

  'panel.row.buy': '{price} cr · {available} for sale · press to buy',
  'panel.row.buy.broke': '{price} cr · {available} for sale · not one is affordable',
  'panel.row.buy.full': '{price} cr · the hold is full',
  'panel.row.sell': '{held} aboard · sells here at {price} cr · press to sell',
  'panel.row.sell.margin': '{held} aboard · sells here at {price} cr, {margin} above what you paid · press to sell',
  'panel.row.sell.loss': '{held} aboard · sells here at {price} cr, {margin} under what you paid · press to sell',
  'panel.row.sell.noBid': '{held} aboard · nobody here is buying',
  'panel.row.hullLabel': 'hull',
  'panel.row.hull': '{hull} of {max}',
  'panel.row.weapons': 'weapons',
  'panel.row.shields': 'shields',
  'panel.row.gadgets': 'gadgets',
  'panel.row.quarters': 'quarters',
  'panel.row.quartersValue': { one: '{n} free', other: '{n} free' },
  'panel.row.nothing': 'none',
  'panel.row.crew': '{role} · pilot {pilot}, gunner {fighter}, engineer {engineer}',
  'panel.row.job': '{reward} cr · {where}',
  'panel.row.jobHere': '{reward} cr · deliverable here, press to turn it in',
  'panel.row.offer': '{reward} cr · {where} · press to take it on',
  'panel.row.offer.problem': '{reward} cr · {problem}',
  'panel.row.log': 'day {day}',

  'panel.entry.amount.buy': '{good} — {price} cr each, {max} affordable',
  'panel.entry.amount.sell': '{good} — {price} cr each, {max} aboard',
  'panel.entry.amount.hint': 'a number, or leave it empty for as many as possible',
  'panel.entry.amount.submit': 'DO IT',

  /* ---------- the deck ---------- */

  'deal.label': 'What is worth doing at {system}',
  'deal.label.blind': '{system} — nothing in range has been visited yet',
  'deal.sell': 'SELL · {held} aboard · they pay {price} · {margin}',
  'deal.sell.up': '{margin} a unit above what you gave',
  'deal.sell.down': '{margin} a unit under what you gave',
  'deal.sell.flat': 'exactly what you gave',
  'deal.buy': 'BUY · {price} · {room} · {system} paid {sells}, {fuel} fuel · {margin} a unit',
  'deal.buy.blind': 'BUY · {price} · {room} · {margin} under the usual · {carry}',
  'deal.room': 'room for {most}',
  'deal.broke': 'not one affordable',
  'deal.carry.up': 'dearer at high tech',
  'deal.carry.down': 'dearer at low tech',
  'deal.carry.flat': 'much the same everywhere',
  'deal.table.label': 'THE WHOLE TABLE',
  'deal.table.note': 'Every commodity this planet trades, both ways, with what is in the hold beside it.',

  /* ---------- the chart ---------- */

  'board.here': 'you are here',
  'board.reachable': '{fuel} fuel · {distance} pc · {economy}, tech {tech}',
  'board.reachableUnknown': '{fuel} fuel · {distance} pc · never visited',
  'board.wormhole': 'wormhole · {tax} cr toll',
  'board.seen': '{distance} pc · out of range',

  /* ---------- the row of moves ---------- */

  'move.market.label': 'MARKET',
  'move.market.hint': 'what is worth buying or selling here, dealt as a hand',
  'move.chart.label': 'CHART',
  'move.chart.hint': 'the systems the tank will reach',
  'move.ship.label': 'SHIP',
  'move.ship.hint': 'the hull, what is fitted and who is aboard',
  'move.jobs.label': 'JOBS',
  'move.jobs.hint': 'the contracts taken on',
  'move.news.label': 'NEWS',
  'move.news.hint': 'what is being reported here',
  'move.refuel.label': 'REFUEL',
  'move.refuel.hint': '{parsecs} parsecs at {price} cr each — {cost} cr to fill',
  'move.refuel.submit': 'refuel',
  'move.repair.label': 'REPAIR',
  'move.repair.hint': '{units} of hull at {price} cr each — {cost} cr to mend',
  'move.repair.submit': 'repair',
  'move.warp.submit': 'warp {system}',
  'move.fight.submit': 'how the fight went',
  'move.buy.submit': 'buy {amount} {good}',
  'move.sell.submit': 'sell {amount} {good}',
  'move.restart.label': 'NEW GAME',
  'move.restart.hint': 'press twice — this commander is still flying',
  'move.restart.hintArmed': 'press again and {commander} is abandoned',
  'move.restart.hintOver': 'start again with a new commander',
  'move.quit.label': 'QUIT',
  'move.quit.hint': 'leave the game — the run is kept, and the panel keeps the way back',
  'move.quit.hintOver': 'leave the game',
  'move.resume.submit': 'resume the game',

  /* ---------- the fight ---------- */

  'fight.intercepted': '{who} in a {ship} has you in its sights.',
  'fight.title': '{who} · {ship}',
  'fight.subtitle': 'round {round} · {distance} out',
  'fight.subtitle.stall': 'minding their own business · {distance} out',
  'fight.stopped': '{who} in a {ship} pulls alongside.',
  'fight.nextShip': 'The next one closes in.',
  'fight.nothingHappened': 'Nothing came of it.',
  'fight.alreadySettled': 'That one is finished with.',
  'fight.targetSwitched': 'Guns on the {ship}.',
  'fight.plundered': { one: '{n} bay taken off them.', other: '{n} bays taken off them.' },
  'fight.plunderedNothing': 'Their hold is empty.',

  'fight.meter.hull': 'HULL',
  'fight.meter.shields': 'SHIELDS',
  'fight.meter.theirHull': '{ship}',
  'fight.meter.theirShields': 'THEIR SHIELDS',
  'fight.meter.range': 'RANGE',

  'fight.field.actions': 'ACTIONS',
  'fight.field.actionsValue': '{left} of {of}',
  'fight.field.yourOdds': 'YOUR SHOT',
  'fight.field.theirOdds': 'THEIRS',
  'fight.field.percent': '{n}%',
  'fight.field.stations': 'STATIONS',
  'fight.field.stationsValue': { one: '{n} gunner · helm', other: '{n} gunners · helm' },
  'fight.field.stationsNoHelm': { one: '{n} gunner · no helm', other: '{n} gunners · no helm' },
  'fight.field.theirGuns': 'THEIR GUNS',
  'fight.field.fleet': 'THE WING',
  'fight.field.fleetValue': '{left} of {of} flying',
  'fight.field.met': 'MET',
  'fight.field.metValue': '{at} of {of}',
  'fight.field.credits': 'CREDITS',

  'fight.tag.tractor': 'TRACTOR LOCK',
  'fight.tag.crippled': 'THEY ARE CRIPPLED',
  'fight.tag.breached': 'HULL BREACHED',
  'fight.tag.downed': { one: '{n} DOWNED', other: '{n} DOWNED' },
  'fight.tag.provoked': 'YOU FIRED FIRST',
  'fight.tag.oppDestroyed': 'DESTROYED',
  'fight.tag.oppSurrendered': 'THEY STRUCK',
  'fight.tag.playerFled': 'CLEAR',
  'fight.tag.playerDestroyed': 'LOST',
  'fight.tag.ignored': 'PASSED BY',
  'fight.tag.inspected': 'INSPECTED',
  'fight.tag.bribed': 'PAID OFF',
  'fight.tag.playerSurrendered': 'SURRENDERED',
  'fight.tag.playerArrested': 'ARRESTED',

  'fight.over.oppDestroyed': 'the {ship} is debris',
  'fight.over.oppSurrendered': 'the {ship} has struck its colours',
  'fight.over.playerFled': 'you are clear of them',
  'fight.over.playerDestroyed': 'the ship did not survive it',
  'fight.over.ignored': 'you went on past',
  'fight.over.inspected': 'the inspection is over',
  'fight.over.bribed': 'they took the money and turned away',
  'fight.over.playerSurrendered': 'you gave them what they came for',
  'fight.over.playerArrested': 'they took you in',

  'fight.group.log': 'WHAT HAPPENED',
  'fight.group.log.empty': 'nothing yet',
  'fight.group.theirHold': 'THEIR HOLD',
  'fight.group.theirHold.empty': 'they are carrying nothing',
  'fight.group.fleet': 'THE WING',
  'fight.group.fleet.empty': 'this one is alone',
  'fight.group.onOffer': 'WHAT THEY ARE SELLING',
  'fight.group.onOffer.empty': 'they have nothing to spare',
  'fight.group.wanted': 'WHAT THEY ARE BUYING',
  'fight.group.wanted.empty': 'they are buying nothing',
  'fight.row.round': 'round {n}',
  'fight.row.theirCargo': { one: '{n} bay', other: '{n} bays' },
  'fight.row.reserve': 'hull {hull}/{max} · {distance} out · {chance}% · press to take aim',
  'fight.row.wreck': 'wreckage',
  'fight.row.onOffer': '{price} cr a unit · {qty} aboard · you can take {max}',
  'fight.row.onOfferNo': '{price} cr a unit · {qty} aboard · no room, or not the credits',
  'fight.row.wanted': { one: '{price} cr a unit · {n} bay aboard', other: '{price} cr a unit · {n} bays aboard' },
  'fight.row.wantedNo': '{price} cr a unit · none aboard',

  'fight.move.attack.label': 'FIRE',
  'fight.move.attack.hint': '{chance}% to hit at this range',
  'fight.move.attack.unarmed': 'nothing aboard is a weapon',
  'fight.move.attack.trader': 'they have done nothing — firing makes them an enemy, and you a pirate',
  'fight.move.trade.label': 'TRADE',
  'fight.move.trade.hint': 'what they are selling, and what they will buy',
  'fight.move.breakFree.label': 'BREAK FREE',
  'fight.move.flee.label': 'RUN',
  'fight.move.flee.hint': '{chance}% to shake them, and they get a shot',
  'fight.move.flee.locked': 'their tractor beam has you — break it first',
  'fight.move.ignore.label': 'GO PAST',
  'fight.move.ignore.hint': 'they are minding their own business',
  'fight.move.closeIn.label': 'CLOSE IN',
  'fight.move.closeIn.hint': 'accuracy rises as the range falls — theirs too',
  'fight.move.openRange.label': 'OPEN RANGE',
  'fight.move.openRange.hint': 'harder for them to hit, and harder for you',
  'fight.move.submit.label': 'SUBMIT',
  'fight.move.submit.hint': 'let them search the hold',
  'fight.move.bribe.label': 'BRIBE',
  'fight.move.bribe.hint': '{amount} to look the other way',
  'fight.move.surrender.label.plain': 'SURRENDER',
  'fight.move.surrender.label.cargo': 'HAND OVER THE HOLD',
  'fight.move.surrender.label.arrest': 'STAND DOWN',
  'fight.move.surrender.pirate': 'they take the cargo and let you go',
  'fight.move.surrender.police': 'a fine, and a mark on the record',
  'fight.move.surrender.bountyHunter': 'a cell, and the days it costs',
  'fight.move.endTurn.label': 'HOLD FIRE',
  'fight.move.endTurn.hint': 'give up the rest of the round',
  'fight.move.plunder.label': 'BOARD THEM',
  'fight.move.plunder.hint': 'take what the hold will carry',
  'fight.move.next.label': 'NEXT',
  'fight.move.next.hint': { one: '{n} more out there', other: '{n} more out there' },
  'fight.move.done.label': 'CARRY ON',
  'fight.move.done.hint': 'finish the jump',
  'fight.move.auto.label': 'LET IT PLAY',
  'fight.move.auto.fight': 'fight it out, as the settings say',
  'fight.move.auto.avoid': 'run, and submit to police, as the settings say',

  'fight.entry.buy': '{good} — {price} cr a unit, up to {max}',
  'fight.entry.sell': '{good} — they pay {price} cr a unit, up to {max}',
  'fight.entry.hint': 'a number, or empty for as many as possible',
  'fight.entry.buySubmit': 'BUY',
  'fight.entry.sellSubmit': 'SELL',

  'fight.context.head': 'SPACE TRADER — a fight is in progress. {who}, flying a {ship}.',
  'fight.context.headTrader': 'SPACE TRADER — the user has been stopped in transit by a {who} flying a {ship}. Nobody is shooting.',
  'fight.context.ships': 'Your hull {hull}/{maxHull}. Theirs {theirHull}/{theirMax}. Range {distance}.',
  'fight.context.moves': 'The user has the moves on their own panel: fire, run, close, open the range, surrender, and the rest.',
  'fight.context.stall': 'They are a hauler with a stall open, not an enemy: they will sell {sells} and will buy {buys}, in credits a unit. The user buys and sells there by pressing, and firing on them shuts it and makes them an enemy.',
  'fight.context.rule': 'The fight is theirs to fight. Do NOT narrate rounds, do not say who won, do not invent damage, and do not call the game\'s actions unless the user names a move. Answer what they ask about the position, briefly, and say what you would do.',
  'fight.context.said': 'So far: {text}',
  'fight.context.nothing': 'nothing yet',

  'note.fightStarted': 'A fight has started and it is on the user\'s own panel — the moves are theirs to press. Say in one sentence who intercepted them. Do NOT narrate the fight, do not decide how it goes, and do not make a move for them.',
  'note.fightOn': 'A fight is in progress on the user\'s panel. Do NOT narrate rounds or decide the outcome — the engine does that when they press. Answer about the position and advise if asked.',
  'refuse.notAFightMove': '"{what}" is not a move in a fight — fire, run, close in, open the range, submit, bribe, surrender, board them, or let it play',

  /* ---------- the game put away ---------- */

  'menu.title': 'SPACE TRADER',
  'menu.subtitle.saved': 'a run waiting on day {day}',
  'menu.subtitle.over': 'the run ended on day {day}',
  'menu.subtitle.none': 'no run saved',
  'menu.field.commander': 'COMMANDER',
  'menu.field.day': 'DAY',
  'menu.field.system': 'LAST SEEN',
  'menu.field.ship': 'SHIP',
  'menu.field.credits': 'CREDITS',
  'menu.resume.label': 'LOAD GAME',
  'menu.resume.hint': 'back aboard with {commander}, day {day}',
  'menu.resume.hintOver': 'look at how the run ended',
  'menu.restart.hint': 'a new commander, and a Flea to fly',
  'menu.restart.hintSaved': 'a new commander — press twice, the saved run is written over',
  'menu.restart.hintArmed': 'press again and {commander} is gone for good',

  /* ---------- starting a run ---------- */

  'setup.title': 'A new commander',
  'setup.subtitle.background': 'what they did before this',
  'setup.subtitle.name': 'and what to call them',
  'setup.cards.label': 'Where the skill points went',
  'setup.skills': 'pilot {pilot} · fighter {fighter} · trader {trader} · engineer {engineer} · electrician {electrician}',
  'setup.card.pilot.label': 'Pilot',
  'setup.card.pilot.note': 'Flew freight before buying the Flea. Outruns what it cannot outshoot, and a full tank goes further.',
  'setup.card.fighter.label': 'Gunner',
  'setup.card.fighter.note': 'Left a navy that was not asking questions. Hits what it aims at, and is met by pirates who wish it had not.',
  'setup.card.trader.label': 'Trader',
  'setup.card.trader.note': 'Sold other people\'s cargo for years. Buys under the asking price everywhere, which compounds over a hundred jumps.',
  'setup.card.engineer.label': 'Engineer',
  'setup.card.engineer.note': 'Kept other people\'s ships flying. Mends a hull cheaply and gets more out of every system fitted to it.',
  'setup.card.random.label': 'Whoever',
  'setup.card.random.note': 'The points fall where they fall. Somebody has to fly the ships nobody chose.',
  'setup.field.background': 'BACKGROUND',
  'setup.entry.label': 'Commander',
  'setup.entry.hint': 'the name on the {background}\'s licence',
  'setup.entry.placeholder': 'Jameson',
  'setup.entry.submit': 'LAUNCH',
  'setup.name.button': "COMMANDER'S NAME",
  'setup.name.buttonHint': 'the field for the name, if it was dismissed',
  'setup.name.nameless': 'Jameson',
  'setup.begun': '{commander} takes a Flea out of {system} with {credits}.',
  'setup.chosen': '{background}. Now the name.',
  'setup.needBackground': 'Choose a background first.',
  'setup.needName': 'The commander needs a name.',
  'setup.backgroundTaken': 'That question has been answered.',
  'setup.intro.words': 'so where are we starting?',

  /* ---------- lines for the status bar ---------- */

  'ui.notStarted': 'No game is running.',
  'ui.newRun': 'A new commander.',
  'ui.pickBackground': 'Choose a background on the cards.',
  'ui.closed': 'Space Trader put away — {commander}, day {day}.',
  'ui.alreadyClosed': 'The game is already put away.',
  'ui.notRunning': 'There is no game to close.',
  'ui.noSavedRun': 'There is no saved game.',
  'ui.resumed': 'Back aboard.',
  'ui.resumedAs': 'Back aboard — {commander}, day {day}.',
  'ui.running': 'The game is already running.',
  'ui.restartConfirm': 'Press again to abandon {commander} and start over.',
  'ui.quitIsYours': 'Leaving the game is the QUIT button, not mine to press.',
  'ui.restartIsYours': 'Starting over is the NEW GAME button, not mine to press.',
  'ui.moveGone': 'That move is no longer on the row.',
  'ui.rowGone': 'That is no longer in the hold.',
  'ui.noRouteThere': 'The tank will not reach it any more.',
  'ui.notForSale': 'This planet is not selling that.',
  'ui.notBought': 'Nobody here is buying that.',
  'ui.nothingToSell': 'There is none of that aboard.',
  'ui.cannotAfford': 'Not one is affordable.',
  'ui.holdFull': 'There is no room in the hold.',
  'ui.dead': 'The ship did not survive it.',
  'ui.noGame': 'No game is saved. Start one and it begins at a random system with 1000 credits.',

  /* ---------- notes to the model ---------- */

  'note.noGame': 'There is no saved game. Tell the user, and offer to start one — do not start it yourself.',
  'note.newRun': 'A new game is being made. Five cards are on the user\'s screen — pilot, gunner, trader, engineer, or whoever. Tell them to choose one. Do not choose for them and do not describe the cards.',
  'note.pickBackground': 'The cards are still on screen. Say only that a background has to be pressed.',
  'note.pickBackgroundContext': 'SPACE TRADER: a new game is being made. The user is choosing a background on five cards on their own screen. Say nothing about the game world until they have; a background cannot be chosen by typing.',
  'note.nameContext': 'SPACE TRADER: the user chose {background} and is typing the commander\'s name into the game\'s own field. Do not answer the name yourself and do not invent one — the field makes the commander the moment it is sent.',
  'note.opening': 'A new game has begun. Introduce it in two or three sentences, from these facts and no others:\n{brief}\nThen offer to open the market or the chart. Do not invent cargo, prices, systems or events.',
  'note.opening.pressed': '\nThe user has already made their first move, and it was: {text}. Introduce the run and then report that.',
  'note.moveMade': 'The move was made and the position below is the one after it: {text}. Say what happened in one or two sentences. Do not make another move.',
  'note.turnResult': '{text}',
  'note.screen': '[SPACE TRADER] The {screen} screen is on the user\'s screen.',
  'note.refused': '[SPACE TRADER] That move was refused: {reason}. Tell the user and do not retry it. Any move named in that sentence is a phrase to write in the conversation, NOT a button — never present them as a list of buttons to press, and never name a button at all.',
  'note.closed': 'SPACE TRADER: the game has been put away. There is no ship, no cargo and no market. Do not carry on the game from the conversation above, do not invent prices or jumps, and do not call the game\'s actions. If the user wants to fly again, tell them to say "resume the game" — that reopens the saved run.',
  'note.cannotClose': 'Closing the game is not yours to do. The user has a CLOSE button on their own row of moves — tell them it is there. Do not say the game is closed.',
  'note.cannotRestart': 'Abandoning a run is not yours to do. The user has a NEW GAME button on their own row of moves — tell them it is there. Do not say a new game has started.',
  'note.noGameToClose': 'There was nothing to close. Say so.',
  'note.alreadyClosed': 'The game is already closed. Say so, and that "resume the game" reopens it.',
  'note.noSavedRun': 'There is no saved game to go back to. Offer to start one — do not start it yourself.',
  'note.resume': 'The saved game is open again. Give the user a short briefing from the position below — where they are, what is in the hold, what the tank will reach — and then ask what they want to do. Make no moves.',
  'note.dead': 'SPACE TRADER: the commander is dead and the game is over. Say so plainly. The user has a NEW GAME button on their own row.',

  /* ---------- the text screens ---------- */

  'screen.status.head': '{commander} — day {day}',
  'screen.status.docked': 'docked at {system}   tech {tech}   {economy}   {politics}',
  'screen.status.situation': 'local situation: {situation}',
  'screen.status.fuel': 'fuel',
  'screen.status.hold': 'hold',
  'screen.status.credits': 'credits',
  'screen.status.debt': 'debt {amount}',
  'screen.status.hull': 'hull',
  'screen.status.bays': '{used}/{total} bays',
  'screen.status.parsecs': '{fuel}/{max} parsecs',
  'screen.status.cargo': 'in the hold:',
  'screen.status.cargoLine': 'sells here at {price} (paid {paid})',

  'screen.market.head': 'MARKET — {system}',
  'screen.market.commodity': 'COMMODITY',
  'screen.market.avail': 'AVAIL',
  'screen.market.buy': 'BUY',
  'screen.market.sell': 'SELL',
  'screen.market.held': 'HOLD',
  'screen.market.foot': 'hold {used}/{total}   {credits}',
  'screen.market.prices': 'Prices at {system} (tech {tech}, {economy}):',
  'screen.market.notSold': 'not sold here',
  'screen.market.notBought': 'not bought here',
  'screen.market.forSale': 'buy {price} ({available} available)',
  'screen.market.sellsFor': 'sells for {price}',
  'screen.market.inHold': '{held} in hold',

  'screen.chart.head': 'CHART — from {system}, range {parsecs} parsecs',
  'screen.chart.inRange': 'IN RANGE',
  'screen.chart.nothing': '  nothing in range — refuel first',
  'screen.chart.legend': '@ you   O visited, in range   o in range   . seen',
  'screen.chart.unvisited': 'never visited',
  'screen.chart.fuel': '{fuel} fuel',
  'screen.chart.wormhole': 'wormhole, {tax} cr',
  'screen.chart.warp': 'Warp to {system}',

  'screen.ship.head': 'SHIP — {ship}',
  'screen.ship.weapons': 'weapons',
  'screen.ship.shields': 'shields',
  'screen.ship.gadgets': 'gadgets',
  'screen.ship.crew': 'crew',
  'screen.ship.crewValue': '{aboard} aboard, {free} quarters free',
  'screen.ship.none': 'none',

  'screen.news.head': '{system} — day {day}',
  'screen.news.nothing': 'Nothing is being reported here.',

  'screen.jobs.head': 'JOBS',
  'screen.jobs.nothing': 'Nothing accepted. The job board is on the planet.',
  'screen.jobs.line': '• {text}   ({reward} cr)',

  'screen.sellAll': 'Sell all {good}',
  'screen.sellAllNote': '{held} × {price} cr',
  'screen.arrived': 'Arrived at {system}. Fuel {fuel}, hull {hull}.',
  'screen.arrivedMet': 'Arrived at {system}, {met} met on the way. Fuel {fuel}, hull {hull}.',
  'screen.met': '— {who}:',
  'screen.newGame': 'A new game.',

  /* ---------- refusals ---------- */

  'refuse.notCommodity': '"{what}" is not a commodity in this game',
  'refuse.noSystem': 'there is no system called "{what}" on the chart',
  'refuse.nothingTo': 'there is nothing to {move} there',
  'refuse.noMove': 'no move was named — buy, sell, warp, refuel and repair are the words',
  'refuse.unknownMove': '"{what}" is not a move — buy, sell, warp, refuel and repair are',
  'refuse.marketRefused': 'the market refused that',
  'refuse.jumpRefused': 'that jump is not possible',
  'refuse.noFuelSold': 'no fuel was sold',
  'refuse.noRepairs': 'no repairs were made',
  'refuse.saleRefused': 'that sale was refused',

  /* ---------- the briefing the model gets every turn ---------- */

  'brief.head': 'SPACE TRADER — a game is in progress.',
  'brief.commander': 'Commander {commander}, day {day}, {credits} cr',
  'brief.commanderDebt': 'Commander {commander}, day {day}, {credits} cr, debt {debt} cr',
  'brief.docked': 'Docked at {system} (tech {tech}, {economy}, {politics})',
  'brief.ship': 'Ship {ship}: hull {hull}/{maxHull}, fuel {fuel}/{maxFuel} parsecs, hold {used}/{total}',
  'brief.carrying': 'Carrying: {cargo}',
  'brief.empty': 'Hold empty.',
  'brief.inRange': 'In range: {systems}',
  'brief.wormhole': 'wormhole',
  'brief.stranded': 'In range: nowhere — out of fuel',
  'brief.opening': 'Commander {commander} is a {background} by trade, flying a Flea: {bays} cargo bays, a pulse laser, no shields. The run has only just begun, and the position is:',

  /* ---------- the words the plugin listens for ---------- */

  // The fight, typed. Not anchored to a bare word like the trading verbs: these
  // arrive inside a sentence a person wrote in the heat of it — "fire at them",
  // "get us out of here" — and the whole line is what is tested.
  're.fight.attack': '\\b(fire|shoot|attack|open fire)\\b',
  're.fight.flee': '\\b(run|flee|escape|get (us|me) out)\\b',
  're.fight.closeIn': '\\b(close in|close the range|get closer)\\b',
  're.fight.openRange': '\\b(open range|open the range|back off|pull away)\\b',
  're.fight.submit': '\\b(submit|comply|let them (search|aboard)|stand down)\\b',
  're.fight.bribe': '\\b(bribe|pay them off|buy them off)\\b',
  're.fight.surrender': '\\b(surrender|give (in|up)|yield)\\b',
  're.fight.ignore': '\\b(ignore|go past|leave them|fly on)\\b',
  're.fight.plunder': '\\b(board|plunder|loot|take their cargo)\\b',
  're.fight.endTurn': '\\b(hold fire|hold my fire|end turn|wait)\\b',
  're.fight.auto': '\\b(let it play|resolve it|play it out|auto)\\b',
  're.fight.on': '\\b(carry on|next|continue|move on|on we go)\\b',

  're.buy': '^(buy|purchase)$',
  're.sell': '^(sell)$',
  're.warp': '^(warp|jump|travel|go|fly)$',
  're.refuel': '^(refuel|fuel)$',
  're.repair': '^(repair|fix|mend)$',
  're.all': '^(all|max|everything)$',
  're.restart': '\\b(new game|start a new game|restart|start over|begin again)\\b',
  're.close': '\\b(close the game|put the game away|quit the game|stop playing)\\b',
  're.resume': '\\b(resume the game|resume|come back to the game|open the game again|back aboard)\\b',
  're.start': '\\b(start the game|play space trader|open the game|let\'s play)\\b',
  // The old cue is still listened for: a run interrupted before the model
  // relayed it comes back with those words already in the transcript.
  're.intro': '^\\s*(so where are we starting\\??|where are we starting\\??|the launch|launch)\\s*$',
  're.status': '^(status|position|where)',
  're.market': '^(market|price|trade)',
  're.chart': '^(chart|map|galaxy)',
  're.ship': '^(ship|vessel)',
  're.news': '^(news|paper)',
  're.jobs': '^(job|quest|contract)',
  // Anchored to a word rather than a prefix: `^new` also matches "news", and
  // asking for the news started a new game.
  're.new': '^new( |$)',
};
