# Space Trader

The Palm OS classic, played in the chat window of [Wasteland Next](https://github.com/alexbeatnik/WastelandNext),
with the model reading the position over your shoulder. Version 2.2.0.

Trade between 140 star systems whose prices move with tech level, government, economy and whatever
crisis a planet is living through. Get stopped on the way, and fight it out a round at a time — the
range, the odds and both sets of shields on screen. Ask what to carry to Nyle and get an answer that
names the good, the amount and what it costs you if the jump goes badly.

Playable in **English and Ukrainian** — the language is a setting on the plugin's row, and a run
started in one can be carried on in another.

**Needs Wasteland Next 0.1.5, build of 19.08 or newer** — the plugin declares `apiVersion: 11`,
takes the `scene` service, and asks it for a text field and colours for its bars. On older builds it
appears in the list marked "update Wasteland Next".

**You make every move.** The model advises and never spends your credits. That is a decision rather
than a missing feature — see *Why the model does not play*, below.

---

## How it is played

Two ways in, and they do not get in each other's way.

**The panel.** Above the composer while a game is running: the ship's bars — hull (red), shields
(blue), fuel (yellow), hold (green) and the day (amber) — then credits, the ship, the jump range,
your standing with the law and how many systems are in reach. Anything currently costing you
something hangs as a tag: WANTED, IN DEBT, STRANDED, HULL BREACHED, and whatever the planet below is
living through.

**The row of moves**, numbered `1`–`9`: MARKET, CHART, SHIP, JOBS, NEWS, and REFUEL and REPAIR when
there is a shipyard and something to spend it on. The engine decides what is in that row — a full
tank is not offered fuel — so the model neither invents the list nor recites it.

**Looking costs nothing.** MARKET deals the hand below; SHIP, JOBS and NEWS open the sheet on one
list each. No turn, no model, no tokens. Reading your own manifest is not a thing to ask a language
model to do for you.

**The chart** — the `CHART` button. The ship at the centre, the systems around it where they
actually are, and a line to every one the tank will reach; press one and you jump. What is out of
range is still drawn, because knowing that Nyle is two hops past the fuel is how a route gets
planned, but it is a label rather than a button.

**The market is dealt, not listed.** MARKET turns the panel into a hand of cards, one commodity
each, with the decision already worked out on it:

> **Furs** — 4 aboard, and they pay 360 here — 302 cr a unit more than you gave for it. Press to sell.
>
> **Water** — 46 cr here, and 21 is what the credits and the hold allow. Nyle was paying 89, 10 fuel
> away — 43 cr a unit. Press to buy.

The table said what water costs. It never said whether to buy any, which is the only question a
trader is actually asking, and answering it takes two things no column ever held: what the hold
already cost, and what the systems in range pay. Buying and selling are ranked against each other on
one number — what a bay of it is worth — after two that come first: whether it can be pressed at all
with the credits in hand, and whether the price on it is remembered or guessed.

**Nothing on a card is a secret.** Every price quoted is from a system this run has already visited.
Early on that is nowhere, and the card says so and falls back on what is honestly known here — what
the commodity usually goes for on a planet like this one, and which way up the tech ladder it wants
carrying. A guess is never drawn as a certainty and never outranks a deal that can be taken.

**Trading is a number, so the panel asks for one.** Press a card — or a row on the full table — and a
single field opens with the price and the ceiling already worked out: "Water — 55 cr each, 18
affordable". Type an amount, or leave it empty for as many as the credits and the hold allow. The
trade happens there; the words it stands for go into the conversation so the transcript reads as
though you had typed them.

**The whole table is still one press away** — the last card in the deck, and the app's own sheet
button. Eight cards is a hand; eighteen commodities is a spreadsheet, and the sheet is where a
spreadsheet belongs.

**The job board.** Contracts are a list on a planet, and a list is what the sheet is for. JOBS shows
what you have taken on and what this port is offering; press an offer to take it, press a contract to
turn it in where it can be turned in. None of that was reachable before there was a panel.

**A fight.** Get jumped on the way and the panel becomes the fight: both hulls on the same strip in
the same colours, their shields under yours, the range as a bar of its own, and the two numbers you
are actually deciding against — your chance to hit and theirs. Then the moves, and which ones you
get depends on who stopped you:

| | |
| --- | --- |
| FIRE | at the odds shown, from where you are |
| CLOSE IN / OPEN RANGE | accuracy rises as the range falls — theirs too |
| RUN | at the odds shown, and they get a shot as you go |
| GO PAST | a hauler minding its own business, and nothing else |
| SUBMIT | let the police search the hold |
| BRIBE | where the government takes one, at the price it takes |
| SURRENDER | the cargo, a fine, or a cell, depending who is asking |
| BOARD THEM | when they strike their colours, and there is room in the hold |
| LET IT PLAY | hand the rest of it to the posture in the settings |

**A round is a keypress.** It costs no turn and not one token: the engine settles it, the panel
redraws, and the status bar says what happened. The whole account goes into the conversation once,
when the shooting stops — the model narrates the fight, it does not decide it, and it is told so in
as many words on every turn there is shooting.

Behind the sheet: every line of the fight so far, what the other ship is carrying (which is what
BOARD THEM would get you), and the rest of the wing if there is one — pressable, because switching
target is free and a wing of five with one cripple in it is a decision.

**Starting a run.** Five cards: Pilot, Gunner, Trader, Engineer, and whoever. Each carries the
twenty-five skill points as that trade would spend them, read out of the table itself, so a
description cannot drift away from what the run starts with. Choosing one opens a field for the
commander's name, and the run begins the moment it is sent.

**Typing still works for all of it.** Every move on the row is a sentence as well, in either
language — and a screen printed into the conversation is still there twenty turns later, which the
panel is not.

| Say | What happens |
| --- | --- |
| *start a new game* | five cards, then a name, then a Flea and 1000 credits somewhere random |
| *show me the market* | the price table for this planet, printed |
| *what's on the chart* | the local starfield in characters, and a button per system in range |
| *buy 10 water* | it buys 10 water |
| *sell all ore* | it sells the lot |
| *warp to Nyle* | the jump, whoever you meet on the way, and where you end up |
| *refuel* / *repair* | what the planet does for a ship |
| *fire at them* / *run* / *surrender* | a round of a fight, when there is one |
| *close the game* / *resume the game* | put it away, and pick it back up on the same day |
| **what should I do?** | this is the part the model is for |

---

## Why the model does not play

An earlier plan had three tiers: hints, the model making moves in batches, and unattended autoplay.
A model that plays Space Trader for you has taken Space Trader off you — the interesting part of the
game is the decision under uncertainty, and a model that makes the decision leaves you watching a
number go up.

So the prompt fragment says, in the place the model actually reads, that a move happens only when
the user named it: never to get things going, never because it looked like the right play, and never
several because one implied the next. Two more things are the player's alone, and the model is
refused in words if it tries: **closing the game** and **throwing a run away**. Both are buttons on
the row. A model asked to stop playing will otherwise say it has stopped, which it has no means to
do, and a hole held shut by a model's good behaviour is not shut.

A fight is the same rule with the stakes raised. The model is told on every turn of one not to
narrate rounds, not to say who won and not to invent damage — because a model that has just read "a
pirate closes in" will otherwise write the whole gunfight, and then the panel and the story are two
different games. What happens out there happens when somebody presses something.

Advice, on the other hand, is what this window is unusually good at. The model gets the position on
every turn — where you are, what you carry, what it cost, what is in range — and the market and
chart actions get it the rest when it needs them.

---

## What the panel changed, and what it did not

The first version of this plugin was written when a plugin had one string and a row of buttons under
a card to draw with. Three consequences were documented as permanent, and all three are now gone —
none of them was ever about Space Trader, and each was a fair description of what a plugin could do
at the time:

- **The chart is a board.** It is still drawn in characters when you ask for it in the conversation,
  because the transcript is the record — but the pressable one is a real map now.
- **Screens are not turns.** Opening the market was a turn and a model call; now it is a keypress.
- **A fight is fought a round at a time.** It used to resolve in one go under a posture chosen in
  the settings before the jump, because a button could not draw the next round. It can now: the
  encounter lives in the save and the panel is the fight.

---

## Languages

`Language` on the plugin's row — English or Українська. It changes everything the player and the
model see: the commodity names, the ship, the planets' economies, the panel, the row of moves, the
printed screens, and the instructions the model is given, down to a line telling it which language to
answer in. The setting is read live, so a change takes effect on the next turn rather than after a
restart, and the panel is redrawn immediately.

**There are two dictionaries here and they are not the same thing.**

- `i18n.mjs` is the *game's*. It comes out of the Space Trader checkout with the engine, it is
  regenerated by `npm run engine`, and it knows what a Flea is called and what "Bought 3 × Water for
  90 cr" says in Ukrainian. Nothing may be written into it by hand — the next build would throw it
  away.
- `words.mjs` and `locales/` are the *plugin's*: the panel, the buttons, the screens, the refusals
  and the notes the model reads. Until 2.0.0 these were English literals spread through the code,
  which made the Ukrainian setting a half-truth — the commodity names translated and every label
  around them did not.

A save carries no words: a good is `water`, a background is `trader`, a message is a key. So a run
started in English opens in Ukrainian as the same run, at the same planet, with the same cargo.

**Adding a language.** Copy `plugins/space-trader/locales/en.mjs`, translate the values, add the file
to `words.mjs` and the code to `LANGUAGES` and to the manifest's `settings`. Keys are flat and dotted
so two files can be diffed line by line, and a key missing from a translation falls back to English
rather than to nothing. `re.*` entries are not phrases but the words the plugin listens for; the
English ones are always in force as well, so `warp Nyle` works in a Ukrainian game and so does a
model that translated the move on the way through. The game's own dictionary is a separate question,
and the answer to it is in the [Space Trader](https://github.com/alexbeatnik/SpaceTrader) repository.

---

## Settings

| Setting | What it is |
| --- | --- |
| Language | English or Українська |
| Met in transit | what LET IT PLAY does with a fight: run and submit to police, or fight it out |

*Met in transit* used to decide every fight, because there was no way to fight one by hand. It now
decides only the ones you hand over — the LET IT PLAY button, and any fight at all on a host with no
panel, where there is nothing to press.

The commander's name used to be a third. It is asked for by the game now, on the card that starts a
run, which is where a question about a run belongs.

---

## Installing

**From the registry — the ordinary way.** Space Trader is one of the registries Wasteland Next ships
with, so it is already in `GET PLUGINS` under GAMES: `INSTALL`, then `ALLOW AND RUN` in the plugin
list. Updates arrive the same way — the app compares versions and offers the new one.

If it has been removed from that list, the registry is this repository:

    https://github.com/alexbeatnik/wasteland-plugin-space-trader

**From an archive**, if a registry is out of reach or a particular build is wanted:

1. `npm test`, then `npm run index -- --base-url=https://example.invalid` — the archive appears in
   `dist/`. (Or zip the contents of `plugins/space-trader` by hand so that `plugin.json` sits at the
   root of the archive.)
2. `GET PLUGINS` → `FROM FILE…`, choose the archive.
3. Press `ALLOW AND RUN` in the plugin list.
4. Write `start a new game` to the model, or press the button.

On Windows, Wasteland Next keeps its data in `%APPDATA%\Wasteland Next`. The installed plugin lands
in `plugins\space-trader` and the saved run in `plugin-state\space-trader.json`.

**Pictures**, if you want them. Drop them into the plugin's data directory:

    %APPDATA%\Wasteland Next\plugin-data\space-trader\

- `chart.png` — behind the star chart, with the markers drawn over it. `.jpg`, `.jpeg`, `.webp` and
  `.gif` work too.
- `good-water.png`, `good-furs.png`, `good-narcotics.png` … — on the market card for that commodity.
  The id is the game's own, the same word the moves are typed with, so there is one vocabulary to
  learn rather than two.

None is shipped, deliberately. The galaxy is generated afresh for every run, so a painted starfield
would be showing stars that are not there; the markers, the names and the jump legs are drawn by the
app from the run's own data, and a background only makes them pleasant to look at.

---

## Who decides what

The model remembers nothing, and should not. The whole state of a run is in the plugin's save, and
before every turn the plugin hands the model a short briefing: the commander, the day, the credits,
the planet, the ship, what is in the hold and what is in range. Six lines, because it is re-sent on
every turn of every conversation and counted against the window — including conversations that have
nothing to do with the game. The tables are what the actions are for.

The engine decides what happens. It is not this plugin's: `engine.mjs` is
[Space Trader](https://github.com/alexbeatnik/SpaceTrader)'s own — 9.8k lines of TypeScript that
import nothing outside themselves — bundled into one file, so a rule argued over there is the rule
here too. Prices, encounters, fuel, the police and the black holes are all its answers. Nothing here
adjusts them.

---

## Building

```bash
npm run engine    # SpaceTrader/src/game + src/i18n  ->  plugins/space-trader/*.mjs
npm test          # drives the plugin the way the host does, against the real engine
npm run index -- --base-url=https://github.com/OWNER/REPO/releases/download/plugins
```

`npm run engine` needs a Space Trader checkout beside this one (or `--game <path>`) with its
dependencies installed; esbuild comes from there rather than being added here. The bundle is
committed, because a plugin is installed as an archive of exactly what is in the directory — a build
step that has to run on the user's machine is not a build step, it is a plugin that does not work.

---

## How this is published

The repository is its own registry. `index.json` at the root of `main` is what the app reads: it
names the exact archive and its checksum, and without matching checksums the app installs nothing.

- `plugins/space-trader/` — the plugin itself, exactly what goes into the archive.
- `scripts/build-engine.mjs` — bundles the game's engine and dictionary out of a checkout.
- `scripts/build-index.mjs` — packs the directory and writes `index.json` with the digest.
- `scripts/prune-release.mjs` — takes the archives the index no longer names off the release.
- `.github/workflows/release.yml` — on a push to `main` touching `plugins/**` or `scripts/**`: runs
  the tests, packs, uploads the archive to the release tagged `plugins`, commits the updated
  `index.json` and prunes the old archives.

The publishing scripts and the workflow are copied unchanged from the other published Wasteland Next
plugins; only the id in the `concurrency` group differs, so a fix to either can be carried back the
same way. Nothing in the workflow rebuilds the engine — the machine that runs it has no game to
bundle from, and that is a maintainer's job, done before the push.

To release a version: raise `version` in `plugins/space-trader/plugin.json`, describe the change
below, and push to `main`. An archive uploaded by hand with no regenerated index is invisible to the
app.

**Everything committed here is written in English** — the README, the code, the comments, the commit
messages. The game speaks two languages; the repository speaks one.

---

## Layout

- `plugins/space-trader/main.mjs` — the adapter: the two actions, the panel's `act`, and the save;
- `plugins/space-trader/panel.mjs` — the scene document: meters, lists, the chart, the row of moves;
- `plugins/space-trader/fight.mjs` — the fight: its own state, its own panel, one round per press;
- `plugins/space-trader/view.mjs` — the printed screens, and the briefing the model reads;
- `plugins/space-trader/words.mjs` — the plugin's translator: `t()`, plurals, and the words it listens for;
- `plugins/space-trader/locales/` — `en.mjs`, `uk.mjs`, one key per phrase;
- `plugins/space-trader/engine.mjs`, `i18n.mjs` — the game, bundled; generated, not edited;
- `tests/panel.test.mjs` — the panel against a stub host, pressed the way a person presses it;
- `tests/fight.test.mjs` — a fight put in front of the panel on purpose, and fought through it;
- `tests/play.test.mjs` — the same game played by typing, with no panel at all;
- `tests/words.test.mjs` — the two dictionaries against each other;
- `tests/manifest.test.mjs` — the manifest is true about the directory it sits in;
- `tests/prune.test.mjs` — what to take off a release and what to keep.

The plugin lives in `plugins/<id>/` rather than at the root because that is the layout the publishing
scripts and the app's own tests expect. The directory has to be named exactly like the manifest's
`id`: the app installs a plugin under the directory name and looks it up by the same.

`panel.mjs` and `view.mjs` are both pure — a state goes in, a document or a string comes out — and
both read the same save, which is what stops the screen and the prompt describing two different runs.

---

## What changed in 2.2.0

- **The market is a hand of cards.** MARKET deals one commodity per card with the decision worked
  out on it — what it costs here, where in range pays more, how much fuel that is, and what the
  difference comes to a bay. The table it replaced is the last card in the deck, and the app's own
  sheet button.
- **Ranked by what can be done.** Three questions in order: could this be pressed right now with the
  credits in hand; is the number on it remembered or guessed; and what is a bay of it worth. A
  certainty nobody can afford is worth less at the top of the deck than a deal somebody can take.
- **A guess is drawn as a guess.** Nothing quotes a price at a system the run has not visited — the
  chart says "never visited" about those for the same reason. With nowhere known, the card falls
  back on what this planet's own tech level, economy and politics imply the thing is worth, and on
  which way up the tech ladder it wants carrying.
- **One card per commodity**, and a sale takes it: "sell your medicine" and "you cannot afford
  medicine" side by side is the same word twice.
- **Pictures for the cards.** `good-water.png` in the plugin's data directory lands on the card that
  offers to buy water, as `chart.png` already landed behind the chart. None is shipped.
- **Fixed: a brand new run could be answered with "«» is not a move".** The panel makes the commander
  and then sends a few words so the transcript has a line in it. Which action the model relays those
  words to is the model's choice, and it got it wrong: they arrived at the *move* action with nothing
  in them, were refused as an empty move, and a player one press into their first game was handed a
  list of moves that the model then presented as buttons to press. Both doors answer the cue now, an
  empty relay counts as it — nothing else it could have meant — and the cue is phrased as a question
  rather than as a noun that reads like an order.
- **Fixed: a refused move taught the model to invent buttons.** The refusal names the moves that do
  exist, and a model turned that list into controls. It now says in as many words that they are
  phrases to write and not buttons.
- **A move made while the cards are still up** points at the cards, instead of answering "no game is
  running" — which is true, and not what the player needs to hear.

## What changed in 2.1.0

- **A fight is a fight now.** Every ship met on a jump is fought a round at a time, on a panel of
  its own: both hulls, both sets of shields, the range between them, and your chance to hit against
  theirs. FIRE, CLOSE IN, OPEN RANGE, RUN, SUBMIT, BRIBE, SURRENDER, BOARD THEM — which of them are
  on the row depends on who stopped you, because a button that answers "you cannot do that here" is
  a button that should not have been drawn.
- **None of that model is new.** Hit chances from the gunner's skill against the other pilot's,
  shields that soak before the hull, accuracy that falls off with range, crews that give more than
  one action a round, tractor beams, bribes, surrenders and a wing that sends the next ship in when
  one goes down — the engine has had all of it from the start and no version of this plugin could
  reach any of it. The old fight chose "run" or "fight it out" from a settings row and printed the
  result.
- **A round costs no turn and not one token.** The whole account reaches the conversation once, when
  the shooting stops. The model narrates a fight it did not decide, and is told on every turn of one
  not to narrate rounds, not to say who won, and not to invent damage.
- **LET IT PLAY** hands the rest of it to the posture in the settings, which is what *Met in transit*
  now means. On a host with no panel that posture still decides everything, exactly as before.
- **A fight is in the save.** Close the app in the middle of a boarding action and it is still there,
  the same ship at the same range with everything said so far.
- **Nothing is bought, sold or jumped while there is shooting**, and every screen answers with the
  fight — a model handed a price table in the middle of a gunfight advises on trade.
- **Fixed: a row of the fight log was cut mid-word.** So were the news headlines, the contracts and
  the ship's log: they were sentences in a field the host cuts at forty-eight characters. They are
  cut at a space now, with an ellipsis, and every one of them is written out in full in the
  transcript.

## What changed in 2.0.0

- **A panel.** Bars for the hull, the shields, the fuel, the hold and the day; the credits, the ship
  and your standing with the law; a row of moves on the digits `1`–`9`; and the market, the ship, the
  contracts and the news each behind a button. None of it costs a turn or a token. Opening the market
  used to be a sentence, a model call and a printed table.
- **The chart is pressable.** The ship at the centre, the systems where they are, a line to every one
  the tank will reach, and a jump on a press. What is out of range is drawn and not offered.
- **Trading asks how many.** A commodity row opens a field with the price and the ceiling in its
  label; empty means as many as the credits and the hold allow. A number over the ceiling is capped
  rather than refused.
- **The job board is reachable.** Contracts can be taken on and turned in from the sheet. The engine
  has always had them; nothing in the plugin could get at them.
- **A run starts on cards.** Pilot, gunner, trader, engineer or whoever, each showing how it spends
  the twenty-five skill points, and then a field for the commander's name. The name left the plugin's
  settings row, where nobody remembered filling it in.
- **The game can be closed and picked back up.** CLOSE puts it away and keeps the run; "resume the
  game" opens it again on the same day. While it is shut the model is told the world is gone, because
  a model told nothing carries on from the transcript and invents a game with no plugin behind it.
- **The plugin speaks Ukrainian too, not only the game.** Two hundred and sixty phrases moved out
  of the code into `locales/`, keyed, with plural forms — Ukrainian needs three and "2 системи"
  was being written as "2 система". The English words stay in force as patterns in every language, so
  a typed `warp Nyle` still works.
- **Fixed: the news screen threw.** A news item is a headline and a body under two keys, not a
  message with parameters. Read as a message, the dictionary was called with `undefined` — on every
  planet that had any news, which is every planet after the first jump.
- **Fixed: asking for the news started a new game.** `^new` matches "news".
- **Published by workflow.** `.github/workflows/release.yml` and `scripts/prune-release.mjs`, the
  same ones the other plugins use: tests, pack, upload, commit the index, prune what it no longer
  names.

## What changed in 1.1.0

- **A fight is reported.** "Arrived at Hesperia, 2 met on the way" was the entire account of two
  gunfights, and what they cost showed up only as a number quietly missing from the hull.
- **The market tells the model what things cost.** A session produced advice to trade a commodity
  that does not exist in this game, because the model had the position and no prices.
- **The prompt stopped the model inventing buttons.** It told a user to press "Show Market". There
  was no such button then. There is a MARKET button now, which is a different fix.

---

## Credits

Space Trader is Pieter Spronck's, originally for Palm OS, later ported to Windows by Jay French. The
economy, the galaxy and the encounters here are the modern remake's implementation of it.

Apache-2.0.
