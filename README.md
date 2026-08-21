# Space Trader

The Palm OS classic, played in the chat window of [Wasteland Next](https://github.com/alexbeatnik/WastelandNext),
with the model reading the position over your shoulder. Version 2.5.1.

Trade between 140 star systems whose prices move with tech level, government, economy and whatever
crisis a planet is living through. Get stopped on the way, and fight it out a round at a time — the
range, the odds and both sets of shields on screen. Ask what to carry to Nyle and get an answer that
names the good, the amount and what it costs you if the jump goes badly.

Playable in **English and Ukrainian** — the language is a setting on the plugin's row, and a run
started in one can be carried on in another.

**Needs Wasteland Next with plugin API 12 or newer** — the plugin declares `apiVersion: 12`,
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

**The row of moves**, numbered `1`–`9`: MARKET, SYSTEM (or CHART, whichever the board is not
showing), SHIP, JOBS, NEWS, MINE where the ship is parked on something worth digging, and REFUEL and
REPAIR when there is a shipyard and something to spend it on. The engine decides what is in that row
— a full tank is not offered fuel, and a rock has no market — so the model neither invents the list
nor recites it.

**Looking costs nothing.** MARKET deals the hand below; SHIP, JOBS and NEWS open the sheet on one
list each. No turn, no model, no tokens. Reading your own manifest is not a thing to ask a language
model to do for you.

**The chart** — the `CHART` button. The ship at the centre, the systems around it where they
actually are, and a line to every one the tank will reach; press one and you jump. What is out of
range is still drawn, because knowing that Nyle is two hops past the fuel is how a route gets
planned, but it is a label rather than a button.

**The system is the other half of that board.** `SYSTEM` swaps the galaxy for the star the ship is
parked at: the capital planet, the dead worlds sharing its sun, and now and then a station in orbit
around one of them. Pressing where you already are on the star chart opens it too. Nothing here is
out of range — a warp drive is dead weight this deep in a gravity well, so crossing to a belt runs
on impulse and costs days rather than fuel, with everything a day out in the dark entails.

**`MINE`, where there is anything to dig.** An asteroid field yields ore, an ice moon water, and a
gas giant fuel — which is a tank filled a long way from anywhere selling any. One press is one day
and one unit; an industrial hull runs heavy rigs and takes more. About one operation in eight is
jumped by raiders, and that is the same fight the panel fights everywhere else.

**Away from the planet the row goes quiet, and it should.** The market, the bank, the hiring hall and
the job board are the spaceport's, and the spaceport is on the capital. A station will work on a
ship; a rock will not. The moves that cannot be made are not drawn, because a button that exists to
be refused reads as the game being broken rather than as the ship being parked on a rock.

**The market is dealt, not listed.** MARKET turns the panel into a hand of cards, one commodity
each, with the decision already worked out on it:

> **Furs**   SELL · 4 aboard · they pay 360 · 302 cr a unit above what you gave
>
> **Water**   BUY · 46 · room for 21 · Nyle paid 89, 10 fuel · 43 cr a unit
>
> **Machines**   BUY · 817 · room for 1 · 80 cr under the usual · dearer at low tech

The table said what water costs. It never said whether to buy any, which is the only question a
trader is actually asking, and answering it takes two things no column ever held: what the hold
already cost, and what the systems in range pay. Buying and selling are ranked against each other on
one number — what a bay of it is worth — after two that come first: whether it can be pressed at all
with the credits in hand, and whether the price on it is remembered or guessed.

**One line, and the same shape on every card.** Sharing a shape is what makes a hand comparable — a
column of prices reads as a table. What must not be shared is a *sentence*: the first draft ended
every card with "no destination known yet, press to buy", and eight wrapped lines of identical prose
with two numbers moving somewhere in the middle is not a choice, it is a list with extra steps. A
fact true of every card belongs on the deck, once, and that is where it is.

**Nothing on a card is a secret.** Every price quoted is from a system this run has already visited.
Early on that is nowhere — the deck says so in its own title — and the cards fall back on what is
honestly known here: what the commodity usually goes for on a planet like this one, and which way up
the tech ladder it wants carrying. A guess is never drawn as a certainty and never outranks a deal
that can be taken, and a discount too small to be worth naming does not get a card at all.

**Trading is a number, so the panel asks for one.** Press a card — or a row on the full table — and a
single field opens with the price and the ceiling already worked out: "Water — 55 cr each, 18
affordable". The most you can take is already in it; type over it for fewer. The trade happens there,
and the words it stands for go into the conversation so the transcript reads as though you had typed
them.

**And you can walk out.** The last two cards are the ways out: THE WHOLE TABLE, and LEAVE THE MARKET,
which buys nothing and puts the deck down. That matters more than it sounds — the app's chooser is
its *question* dialog, with no close button, no Escape and no dismissing it by clicking away, because
a question with a way out is a question that never gets answered. A market is not a question, and
until 2.4.0 the deck had no card that put it down: everything either bought something or opened a
second dialog on top. There was no leaving a market without buying.

**The whole table is still one press away** — the second-to-last card in the deck, and the app's own
sheet button. Eight cards is a hand; eighteen commodities is a spreadsheet, and the sheet is where a
spreadsheet belongs.

**Six slots, and an autosave that was always there.** The run being played is written to the
plugin's own document after every purchase and every jump, so a game is never lost by closing
anything — that is the autosave, and it has no slot because it is not a copy. `[ SAVE ]` puts a copy
into one of six numbered slots; `[ LOAD ]` flies one; a third list throws one away, kept apart from
the other two because it is the only thing here that cannot be undone. Each row reads the commander,
the day, the system, the ship and the credits, so a slot is identified by the run in it rather than
by when you happened to press the button.

The slots are files in the plugin's data directory, one each — not in its installed tree, which is
deleted and rewritten on every update, and not in the plugin's document, which is a single JSON file
against a 1 MB ceiling that one 250 KB galaxy already half fills. A slot written by a newer build is
shown as unreadable rather than half-loaded into a game with no way back out.

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
| BREAK FREE | the same button under a tractor beam, which is a different move |
| GO PAST | a hauler minding its own business, and nothing else |
| TRADE | their stall, when the hauler has one open |
| SUBMIT | let the police search the hold |
| BRIBE | where the government takes one, at the price it takes |
| HAND OVER THE HOLD / STAND DOWN / SURRENDER | named after what they are demanding |
| BOARD THEM | when they strike their colours, and there is room in the hold |
| HOLD FIRE | give up the rest of a round, when the crew has more than one action in it |
| FIGHT IT OUT / RUN FOR IT | the rest of this one, and every other ship on the leg, without pressing |

**A round is a keypress.** It costs no turn and not one token: the engine settles it, the panel
redraws, and the status bar says what happened. The whole account goes into the conversation once,
when the shooting stops — the model narrates the fight, it does not decide it, and it is told so in
as many words on every turn there is shooting.

Behind the sheet: every line of the fight so far, what the other ship is carrying (which is what
BOARD THEM would get you), and the wing if there is one — the wrecks, then everyone still flying in
order of range, with your chance to hit each. Pressable, because switching target is free, and the
near cripple is not always the better shot.

**A hauler is not a gunfight.** A lone trader met in transit keeps a stall: three to six goods it
will sell and a few it will buy, priced off the base rather than off any market — a shop three
parsecs from anywhere, which no chart knows about. The engine has dealt one to every solitary trader
since the encounter was written, and until 2.4.0 nothing in the plugin could reach it. TRADE opens
the two price lists behind the sheet, a row opens the field, and the buying is the same field a
planet's market uses. It costs no turn either. Firing on them shuts it — the hint on FIRE says so
before the press, because it does not come back: they become an enemy and you become a pirate.

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
| *system* | everywhere in this system: what is on it, and how many days out |
| *cross to the ice moon* | the impulse run — days off the calendar, no fuel out of the tank |
| *mine* | a day at whatever can be dug out where the ship is docked |
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

| Control | What it is |
| --- | --- |
| Language | English or Українська |
| `[ PLAY ]` | the run in progress, on screen in this conversation |
| `[ NEW GAME ]` | the background cards, then a name |
| `[ SAVE ]` | copy the run being played into one of six slots |
| `[ LOAD ]` | open a slot — whether or not a game is running |

All five are drawn twice: on the plugin's row in PLUGINS, where somebody decides about the plugin,
and in a section of the left panel headed SPACE TRADER, where somebody plays — one declaration, two
places, asked for with `"panel"` in the manifest and drawn while the plugin is running.

**Four of them are buttons, which is a setting type that stores nothing.** A setting is a question
whose answer the app keeps; these are things that happen when they are pressed. They needed a home in
the left panel and the panel section is built from the settings list, so plugin API 12 added
`type: "button"` and `ctx.onButton` to Wasteland Next for exactly this. A press answers in the same
words a move on the game's row answers with — `{status, sheet, cards, submit}` — and the app claims
the panel for the conversation the press came from, which is what makes PLAY and LOAD work when
there is nothing on screen at all.

**PLAY is for the ordinary case, which is a chat that has never drawn the game.** One save, many
conversations: open a new one and the panel belongs to the old one, so the way in was to type
something at the model and hope it passed the words along — a turn, a model call and a relay, spent
on a thing that is not a move, and a small model is as likely to answer the request itself. A press
claims the panel and sends the same words the menu's LOAD GAME sends, so the model reads the
position out and the transcript looks the same either way. With nothing saved at all it asks who is
flying, because a button that answers "there is nothing to play" has cost a press and given nothing
back — and nothing is written over, since the commander is not made until a name is sent.

**Why the left panel and not the row above the composer.** That row only exists while a game is
drawn. PLAY and LOAD are for the moment when none is.

**There used to be a second, and it was a mistake.** *Met in transit* asked, before any of it had
happened, what to do about a fight — one standing answer to a question that is different every time
somebody stops you, on a row nobody remembers filling in. It is the same mistake the commander's name
made before 2.0.0 moved it onto a card. It is gone. The choice it held is two buttons in the fight
itself, **FIGHT IT OUT** and **RUN FOR IT**, pressed with the odds and both hulls on screen beside
them. A host with no panel has nothing to press, so a fight nobody drives there runs and submits to
the police, which is what the setting defaulted to.

**QUIT stays on the game's own row**, because it is a thing you do to a game that is running, and it
leaves the panel showing the run it closed on — commander, day, system, ship and credits — with LOAD
GAME and NEW GAME under it.

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
- `plugins/space-trader/saves.mjs` — the six slots, as files, and what a row says about each;
- `plugins/space-trader/view.mjs` — the printed screens, and the briefing the model reads;
- `plugins/space-trader/words.mjs` — the plugin's translator: `t()`, plurals, and the words it listens for;
- `plugins/space-trader/locales/` — `en.mjs`, `uk.mjs`, one key per phrase;
- `plugins/space-trader/engine.mjs`, `i18n.mjs` — the game, bundled; generated, not edited;
- `tests/panel.test.mjs` — the panel against a stub host, pressed the way a person presses it;
- `tests/fight.test.mjs` — a fight put in front of the panel on purpose, and fought through it;
- `tests/saves.test.mjs` — the slots, pressed from the left panel the way the app presses them;
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

## What changed in 2.5.1

- **Fixed: a commander could die and the game would then deny there had been a fight.** Reported
  from a real session, and the worst answer this plugin has given. The fight was fought from the
  panel, which costs no turn, so not one line of it was in the conversation; asked afterwards how it
  had gone, the model answered that Space Trader has no fighting in it, while the panel behind the
  answer read LOST and the hull read 0/60. It was not inventing that out of nothing. Every door
  built its answer from `status` and `briefing`, and neither of those knows a run can end — a hull
  of zero is a number like any other to them, and the systems in range were still being listed for a
  ship that no longer existed. The typed moves had always handled it, each in its own place; the
  pressed ones went past. It is asked once now, the way `isWrecked` is asked once, and a run that is
  over says so at every door, whether the move was pressed or typed. Two lines that only make sense
  mid-run are dropped rather than printed over the ending: the market's price table, and "give the
  user a short briefing and then ask what they want to do next".
- **Fixed: the prompt let the model answer the game's own line instead of passing it on.** A press
  sends a short line so the transcript has one, and the prompt said to hand it to the action "or
  simply answer" — so it simply answered, from a position several days stale, and the account
  waiting in the document was never read out. That way out is gone, and the paragraph now says the
  thing the model had no way to know: the panel moves without it, a fight is fought a round at a
  time and a commander can die between two of its turns, and none of it reaches the conversation.
- **The cues that are questions now name the game.** «лети Callisto», "repair", "buy 10 water" read
  as moves and were always passed along. "How the fight went", "how the day at the workings went"
  and "resume the game" read as conversation, and all three were answered out of context at least
  once. They carry the game's name in front of them now, which is the whole of what makes them
  unanswerable without looking.

---

## What changed in 2.5.0

- **A system is somewhere to go, not a dot.** The engine has always laid out every star system —
  the settled capital, the dead worlds sharing its sun, now and then a station in orbit around one
  of them — and the plugin drew a system as one point on a chart. `SYSTEM` is that layout: the star
  at the centre and everything else out on its orbit, on the same board the galaxy is drawn on,
  because they are one question at two scales and the host draws one board. Pressing where you
  already are on the star chart opens it, which is the honest place to put that door — the system
  under the ship is the one marker on a chart with anything else to show.
- **Crossing a system costs days, not fuel.** A warp drive is dead weight this deep in a star's
  gravity well, so the run out to a belt is made on impulse: nothing off the gauge, one to six days
  off the calendar, and a chance per day that somebody finds you out there. Days are not free — they
  are wages, interest, and whatever an undermanned watch does to a ship — which is what makes a
  four-day moon a decision rather than a detour.
- **MINE.** An asteroid field yields ore, an ice moon water, and a gas giant fuel — a tank filled a
  very long way from anywhere that sells any. A press is a day and a unit, an industrial hull runs
  heavy rigs and brings up more, a belt now and then turns up a gem, and about one operation in
  eight is jumped by raiders, which is the same fight the panel already fights. The mining sits on
  the marker for the body the ship is docked at rather than on the row: it is a thing you do to a
  place, and the row at a planet is already nine moves deep.
- **The row is where the ship is.** The market, the bank, the hiring hall and the job board are the
  spaceport's, and the spaceport is on the capital planet. The engine has always refused all four
  anywhere else; the panel used to draw them anyway, which would have read as the game being broken
  rather than as the ship being parked on a rock. They are not drawn out there now, a station is
  still a shipyard and a rock is not, and a tag says AWAY FROM PORT so the missing half of the row
  has a reason on screen.
- **`[ PLAY ]`, in the left panel.** A save is one run and a window is many conversations, so the
  ordinary way to find a game was to open a chat that had never drawn it — and the only way in was
  to type at the model and hope it passed the words along, which is a turn and a model call spent on
  something that is not a move. A press claims the panel and sends the same words the menu's LOAD
  GAME sends, so the model reads the position out and the transcript looks the same either way.
- **Fixed: the chart emptied out as the tank did.** It drew what the fuel could reach plus the
  systems this run had already visited, so flying in on fumes deleted exactly the stars a route
  would be planned through — a chart at its emptiest at the one moment it is needed. The window is
  the neighbourhood now, sized by the tank rather than by what is left in it: everything inside it
  is drawn whether or not it can be afforded, out of range and unpressable and labelled as such, and
  what the chart holds only changes when the ship moves.

---

## What changed in 2.4.0

- **Fixed: a black hole ended the jump in a TypeError.** `warp` reports a singularity raw — survived or not, the damage, the days — and `blackHoleEvent` is what turns it into a sentence. Read as though it were already one it has no `bodyKey`, rendering `undefined` threw inside the dictionary, and the jump came back as a refusal with the ship still where it started. A fraction of a percent of jumps, which is exactly the rate that reads as a flaky test.

- **New game, save and load are in the left panel.** Always, whether or not a game is drawn — which
  is the point, because the row above the composer only exists while one is, and LOAD is for the
  moment when none is. This needed a feature in the app: plugin API 12 adds `type: "button"`
  settings and `ctx.onButton`, a control that does something rather than storing a value, drawn
  wherever a plugin's settings are drawn. A press answers in the same words a move answers with, and
  claims the panel for the conversation it came from.
- **Six save slots.** The run being played was already written after every purchase and every jump —
  an autosave in everything but name — and there was no way to keep a second one. `[ SAVE ]` copies
  it into a numbered slot, `[ LOAD ]` flies one back, and a slot names the commander, the day, the
  system, the ship and the credits so it is identified by the run in it. Kept as files in the
  plugin's data directory: the document is one JSON file against a 1 MB ceiling and a galaxy is
  250 KB of it, so six would not fit, and the data directory survives a version bump where the
  installed tree does not.
- **Throwing a slot away is its own list**, kept apart from the two that load and save, because it is
  the only thing here that cannot be undone and it should not sit under the cursor of somebody
  aiming at LOAD.

- **Fixed: a market could not be left without buying something.** The deck is dealt in the app's
  chooser, which is its question dialog — no close button, no Escape, no dismissing it by clicking
  away, and the row's digits go dead while it is up. That is right for "who are you flying" and wrong
  for a shop. THE WHOLE TABLE was supposed to be the way out and was not: `{sheet: true}` opens the
  sheet *over* the chooser without closing it, so shutting the sheet again put you back on the deck.
  What actually closes it is a scene arriving with no cards in it, so the deck is now drawn only
  while it is open, there is a LEAVE THE MARKET card that puts it down, and every other move on the
  row puts it down too. Six deals instead of seven, because the eighth card had to come from
  somewhere.
- **The amount field stopped promising something it could not do.** It said "leave it empty for as
  many as possible"; the app refuses to send an empty field. The most you can take was always already
  in the box, so that is what it says now.

- **A hauler's stall can be shopped at.** The engine gives every lone trader met in transit a hand of
  goods to sell and a short list to buy, and no version of this plugin could reach a line of it: a
  row of buttons cannot hold a price list, so the one encounter in the game that is not a gunfight
  was fought like one. TRADE puts both lists behind the sheet, a row opens the amount field, and what
  changes hands goes into the fight's own account — so it reaches the transcript with everything else
  that happened out there, and costs no turn on the way.
- **The panel stops calling that a fight.** A trader minding its own business reads "minding their
  own business · 23 out" rather than "round 1", the status line says they pulled alongside rather
  than that they have you in their sights, and the model is told there is a stall open and that
  nobody is shooting. It was being handed a hull, a range and the word "fight", and advising
  accordingly.
- **The moves are named after what they do.** SURRENDER is HAND OVER THE HOLD to a pirate and STAND
  DOWN to a bounty hunter, because `demand` is in the encounter and the difference is cargo against a
  sentence. RUN is BREAK FREE under a tractor beam, which is a different move with a different roll.
  And FIRE on a hauler says what firing costs instead of quoting the odds.
- **The wing reads like a formation.** The wrecks, then everyone still flying nearest first, each row
  carrying your chance to hit that ship — the number the choice of target actually turns on, since
  accuracy falls off with range.
- **STATIONS.** A round is one volley per gunner plus a manoeuvre if anybody is spare to fly. The
  panel said "ACTIONS 1 of 1" and never said why; beside it now is "1 gunner · no helm", which is a
  reason to hire somebody.
- **QUIT leaves a door.** It used to clear the panel, which left typing at the composer as the only
  way back into a run still sitting in the save — the one thing a panel exists to spare you. It shows
  the run it closed on now, named and dated, with LOAD GAME and NEW GAME under it.
- **The fight posture stopped being a setting.** *Met in transit* was one standing answer, given
  before the jump, to a question that is different every time somebody stops you — and the row said
  nothing about what it did. It is gone, and LET IT PLAY is two buttons: FIGHT IT OUT and RUN FOR IT,
  pressed against a position that is on screen. Against a hauler there is one, PAST THEM ALL, because
  there is nothing to run from and nothing to shoot.
- **The setting that is left is in the left panel.** The language, under a heading of its own, where
  the game is played rather than in the list where the plugin is switched on.

## What changed in 2.2.1

- **Fixed: the planet a run starts on was never furnished.** No news, no job board, no crew for hire
  — a world living through a cold snap with nothing whatever being reported about it, and an empty
  contract board, until the commander flew somewhere else and came back. Everything that dresses a
  planet is done by the engine when a jump *ends*, and nothing ever jumps to the first system. It
  arrives there now, through the engine's own routine rather than a copied list of generators.
- **Fixed: the cards were a wall of prose.** Seven of them, each eight wrapped lines, each ending in
  the same two sentences, with the two numbers that differed buried in the middle. One line each
  now, the verb first, the facts separated — and the sentence they all shared moved to the deck's
  title where it is said once.
- **A discount too small to be worth naming does not get a card.** Thirteen credits off a two hundred
  credit good is not an argument; the deck is shorter and every card in it is one.

## What changed in 2.2.0

- **The market is a hand of cards.** MARKET deals one commodity per card with the decision worked
  out on it — what it costs here, where in range pays more, how much fuel that is, and what the
  difference comes to a bay. The table it replaced is a card in the deck, and the app's own
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
- **FIGHT IT OUT and RUN FOR IT** hand the rest of it over — every ship left on the leg, not only the
  one in front. Until 2.4.0 that was one button reading a settings row; the row is gone and the
  choice is made where it is made. On a host with no panel there is nothing to press, and a fight
  there runs and submits to the police.
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
  label, filled in with as many as the credits and the hold allow. A number over the ceiling is
  capped rather than refused.
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
