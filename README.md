# Space Trader for Wasteland Next

The Palm OS classic, played in the chat window — with the model reading the position over your
shoulder and telling you what it would do.

Trade between 140 star systems whose prices move with tech level, government, economy and whatever
crisis a planet is living through. Get jumped by pirates on the way. Ask what to carry to Nyle and
get an answer that names the good, the amount and what it costs you if the jump goes badly.

**You make every move.** The model advises and never spends your credits. That is a decision rather
than a missing feature — see *Why the model does not play*, below.

## Installing

In Wasteland Next, open the plugin list, add this repository's index as a registry, and install
Space Trader from it:

```
https://raw.githubusercontent.com/alexbeatnik/-wasteland-plugin-space-trader/main/index.json
```

Adding a registry is a widening of trust and looks like one: a URL typed in, a button pressed. The
plugin then has to be switched on, which is the consent to run code that did not ship with the app.

## Playing

Talk to it. Every screen is one turn.

| Say | What happens |
| --- | --- |
| *start a new game* | a commander, a Flea, 1000 credits, somewhere random |
| *show me the market* | the price table for this planet |
| *what's on the chart* | the local starfield, and a button for every system in range |
| *buy 10 water* | it buys 10 water |
| *sell all ore* | it sells the lot |
| *warp to Nyle* | the jump, whoever you meet on the way, and where you end up |
| *refuel* / *repair* | what the planet does for a ship |
| **what should I do?** | this is the part the model is for |

Buttons appear under the chart and the market for the moves whose whole result fits in a sentence —
a jump, or selling what is already aboard. Everything else goes through a sentence, because a click
cannot draw a new screen (see *What the medium allows*).

## Settings

| Setting | What it is |
| --- | --- |
| Commander | the name a new game starts under |
| Language | English or Ukrainian — the game's own dictionaries, not a second translation |
| Met in transit | whether to run from what you meet, or fight it out |

## Why the model does not play

An earlier plan had three tiers: hints, the model making moves in batches, and unattended autoplay.
The last one is not possible anyway — a plugin has no route to the model, since the host hands out
`browser`, `lookupBrowser`, `audio`, `notify` and `mic`, and nothing that answers questions — but
the middle one was, and it is deliberately not here.

A model that plays Space Trader for you has taken Space Trader off you. The interesting part of the
game is the decision under uncertainty, and a model that makes the decision leaves you watching a
number go up. So the prompt fragment says, in the place the model actually reads, that a move
happens only when the user named it: never to get things going, never because it looked like the
right play, and never several because one implied the next.

Advice, on the other hand, is what this window is unusually good at. The model gets the position on
every turn — where you are, what you carry, what it cost, what is in range — and the market and
chart actions get it the rest when it needs them.

## What the medium allows

Space Trader on Palm drew a chart of stars and an encounter with a ship on it, and the modern remake
draws both in SVG. Neither can come here. The chat window runs the app's own code and nothing else
(`script-src 'self'`), so a plugin contributes no markup and no script: an action's result is a
string in a `<pre>` and a row of buttons under it.

Three consequences worth knowing before you file a bug:

**The chart is drawn in characters.** A monospace block is a grid, and a grid is a chart — the local
starfield is plotted from the same `x`/`y` the SVG uses, centred on your ship and scaled to your
jump range, so the edge of the drawing is the edge of the tank. It is not clickable, so every target
on it is repeated as a button underneath.

**A fight resolves in one go.** A round at a time needs a redraw between rounds, and a button cannot
redraw — `choose` returns one line for the status bar. So the posture is chosen before the jump
(*Met in transit*) and the whole exchange resolves at once, with every round's own words kept.

**Screens come from sentences, not clicks.** A card is drawn as the result of an action, and an
action happens when you say something.

There is a route to the pictures, and it is small: an action result's extra fields already reach the
renderer, and the window's CSP already allows `img-src data:`. A plugin could hand over an SVG
rendered in the main process as a `data:` URI — data, not code, exactly like a theme's CSS — and the
renderer would need about ten lines to draw it. That is a change to Wasteland Next, not to this
plugin, so it is not done here.

## Building

The engine is not written here. It is [Space Trader](https://github.com/alexbeatnik/SpaceTrader)'s
own — 9.8k lines of TypeScript that import nothing outside themselves — bundled into one file so a
rule argued over there is the rule here too.

```bash
npm run engine    # SpaceTrader/src/game + src/i18n  ->  plugins/space-trader/*.mjs
npm test          # drives the plugin the way the host does, against the real engine
npm run index -- --base-url=https://github.com/OWNER/REPO/releases/download/plugins
```

`npm run engine` needs a Space Trader checkout beside this one (or `--game <path>`) with its
dependencies installed; esbuild comes from there rather than being added here. The bundle is
committed, because a plugin is installed as an archive of exactly what is in the directory — a build
step that has to run on the user's machine is not a build step, it is a plugin that does not work.

## Credits

Space Trader is Pieter Spronck's, originally for Palm OS, later ported to Windows by Jay French. The
economy, the galaxy and the encounters here are the modern remake's implementation of it.

Apache-2.0.
