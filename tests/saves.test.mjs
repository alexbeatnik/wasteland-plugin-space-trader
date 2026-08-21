/**
 * Save slots, driven through the panel the way a person drives them.
 *
 * The three controls that reach these live in the app's *left panel* rather
 * than on the row above the composer, because the moment LOAD is for is the one
 * where there is no row: nothing is drawn, and before this the only way back
 * into a run was to type at the composer. So they are `button` settings, which
 * the plugin answers through `ctx.onButton` — and this file presses them the
 * way the app does, then presses the rows they open.
 *
 * The engine is the real one and the galaxy is generated afresh for every run,
 * so nothing here assumes a system or a price. What it holds is the contract: a
 * slot is a copy of the run, loading one replaces what is being played, and
 * neither costs a turn.
 */
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { activate } from '../plugins/space-trader/main.mjs';
import * as saves from '../plugins/space-trader/saves.mjs';

/** Everything `ctx` is, with a panel and the button hook on the end of it. */
function harness({ dataDir, document = {} } = {}) {
  const actions = new Map();
  let doc = document;
  let drawn = null;
  let presenter = null;
  let button = null;

  const scene = {
    show: (value) => { drawn = value; },
    clear: () => { drawn = null; },
    present: (value) => { presenter = value; },
  };

  activate({
    id: 'space-trader',
    service: (name) => {
      if (name === 'scene') return scene;
      throw new Error(`no service "${name}"`);
    },
    action: ({ type, run }) => actions.set(type, run),
    prompt: () => {},
    context: () => {},
    onSettingsChanged: () => {},
    onButton: (fn) => { button = fn; },
    store: { get: (key, fallback = '') => fallback },
    state: { get: () => doc, set: (value) => { doc = value; } },
    dataDir: () => dataDir,
    log: () => {},
    progress: () => {},
  });

  return {
    get drawn() { return drawn; },
    get document() { return doc; },
    get game() { return doc.save ? JSON.parse(doc.save) : null; },
    show: (steps) => actions.get('space_trader')(steps, {}),
    act: (id, value) => presenter.act(id, value),
    press: (key) => button(key),
  };
}

/** A commander in the air, made the way the panel makes one. */
async function flying(dataDir) {
  const app = harness({ dataDir });
  await app.show('new game');
  await app.act('background-trader');
  await app.act('name', 'Jameson');
  return app;
}

const dataDir = () => mkdtempSync(join(tmpdir(), 'space-trader-saves-'));
const rows = (app, label) => app.drawn.groups.find((group) => group.label === label)?.items ?? [];

test('SAVE opens six slots, and none of them has anything in it yet', async () => {
  const app = await flying(dataDir());
  const opened = await app.press('save');
  assert.equal(opened.sheet, true);

  const list = rows(app, 'SAVE INTO');
  assert.equal(list.length, 6);
  for (const row of list) {
    assert.match(row.label, /^SLOT [1-6]$/);
    assert.match(row.note, /empty/);
    // Every one is pressable: a run is in the air, so any slot can take it.
    assert.match(row.action, /^save-[1-6]$/);
  }
  // Nothing to clear yet, and the list says so rather than being absent.
  assert.equal(rows(app, 'THROW A SLOT AWAY').length, 0);
});

test('a slot is written with what the run says about itself', async () => {
  const dir = dataDir();
  const app = await flying(dir);
  const day = app.game.day;
  const credits = app.game.credits;

  const wrote = await app.press('save');
  assert.equal(wrote.sheet, true);
  const saved = await app.act('save-2');
  assert.match(saved.status, /Jameson/);
  // Bookkeeping, not a move: no turn, nothing sent to the model.
  assert.equal(saved.submit ?? null, null);

  // On disk, under the plugin's own data directory rather than its installed
  // tree — that one is deleted on every update.
  assert.ok(existsSync(join(dir, 'saves', 'slot-2.json')));
  const [held] = saves.list(dir).filter((entry) => entry.slot === '2');
  assert.equal(held.meta.commander, 'Jameson');
  assert.equal(held.meta.day, day);
  assert.equal(held.meta.credits, credits);
  assert.ok(held.meta.system.length > 0);
  assert.ok(held.meta.savedAt > 0);

  // And the row now reads back what it holds, with a warning about pressing it.
  const row = rows(app, 'SAVE INTO').find((entry) => entry.action === 'save-2');
  assert.match(row.note, /Jameson/);
  assert.match(row.note, /over/);
  assert.equal(row.tone, 'good');
});

test('LOAD offers only the slots that have something in them', async () => {
  const dir = dataDir();
  const app = await flying(dir);
  await app.press('save');
  await app.act('save-1');

  await app.press('load');
  const list = rows(app, 'LOAD FROM');
  assert.equal(list.length, 6);
  assert.equal(list.filter((row) => row.action).length, 1);
  assert.equal(list.find((row) => row.action).action, 'load-1');
  // An empty slot is drawn without an action rather than left out: knowing that
  // slot 4 is free is the reason the row is there.
  for (const row of list.filter((entry) => !entry.action)) assert.match(row.note, /empty/);
});

test('loading a slot replaces the run being played', async () => {
  const dir = dataDir();
  const app = await flying(dir);
  await app.press('save');
  await app.act('save-3');
  const savedDay = app.game.day;

  // Move the run on, so loading is visibly a different game from the one in the
  // document rather than a repaint of the same one.
  const state = app.game;
  state.day = savedDay + 40;
  state.credits = 999;
  await app.act('market');
  app.document.save = JSON.stringify(state);

  const loaded = await app.act('load-3');
  assert.match(loaded.status, /Jameson/);
  assert.equal(app.game.day, savedDay);
  assert.notEqual(app.game.credits, 999);
  // The model is told, in the same words coming back aboard uses.
  assert.match(loaded.submit, /resume/i);
  // And the panel is a game again rather than the deck that was open over it.
  assert.equal(app.drawn.cards ?? null, null);
  assert.ok(app.drawn.actions.some((move) => move.id === 'market'));
});

test('a slot survives the game being put away, and brings it back', async () => {
  const dir = dataDir();
  const app = await flying(dir);
  await app.press('save');
  await app.act('save-5');
  const day = app.game.day;

  await app.act('quit');
  assert.equal(app.document.closed, true);
  // The menu is what QUIT leaves behind, and the slots are behind its sheet —
  // this is the state LOAD exists for.
  assert.equal(app.drawn.title, 'SPACE TRADER');

  const opened = await app.press('load');
  assert.equal(opened.sheet, true);
  const row = rows(app, 'LOAD FROM').find((entry) => entry.action === 'load-5');
  assert.ok(row, 'the slot was not offered with the game closed');

  await app.act('load-5');
  assert.equal(app.document.closed ?? false, false);
  assert.equal(app.game.day, day);
});

test('there is nothing to save when nothing is being played', async () => {
  const dir = dataDir();
  const app = await flying(dir);
  await app.act('quit');

  const refused = await app.press('save');
  assert.match(refused.status, /no run to save/i);
  assert.equal(refused.sheet ?? false, false);
});

test('a slot can be thrown away, and only from its own list', async () => {
  const dir = dataDir();
  const app = await flying(dir);
  await app.press('save');
  await app.act('save-4');

  // Its own list rather than a third button on every row: it is the one thing
  // here that cannot be undone.
  const clear = rows(app, 'THROW A SLOT AWAY');
  assert.equal(clear.length, 1);
  assert.equal(clear[0].action, 'delete-4');
  assert.match(clear[0].note, /Jameson/);

  const gone = await app.act('delete-4');
  assert.match(gone.status, /cleared/i);
  assert.ok(!existsSync(join(dir, 'saves', 'slot-4.json')));
  assert.equal(rows(app, 'THROW A SLOT AWAY').length, 0);
});

test('a slot from a newer build is shown as unreadable, not loaded', async () => {
  const dir = dataDir();
  const app = await flying(dir);
  await app.press('save');
  await app.act('save-6');

  // A file this build cannot make sense of: refused rather than half-read into
  // a game with no way back out of it.
  writeFileSync(join(dir, 'saves', 'slot-6.json'), JSON.stringify({ format: 99, meta: null, save: '{}' }));

  await app.press('load');
  const row = rows(app, 'LOAD FROM').find((entry) => entry.label === 'SLOT 6');
  assert.equal(row.action, '', 'an unreadable slot could still be pressed');
  assert.equal(row.tone, 'bad');
  assert.match(row.note, /newer build/);
});

test('a slot id that never came from a row cannot reach a file path', async () => {
  const dir = dataDir();
  const app = await flying(dir);

  for (const bad of ['../escape', '7', '', 'slot']) {
    const answer = await app.act(`save-${bad}`);
    assert.match(answer.status ?? '', /no longer|not started|gone/i, `"${bad}" was taken for a slot`);
  }
  assert.deepEqual(existsSync(join(dir, 'saves')) ? readdirSync(join(dir, 'saves')) : [], []);
  assert.equal(saves.isSlot('../escape'), false);
  assert.equal(saves.isSlot('7'), false);
});

test('NEW GAME asks who is flying, and keeps the run until the name is sent', async () => {
  const dir = dataDir();
  const app = await flying(dir);
  const before = app.document.save;

  const asked = await app.press('newGame');
  assert.equal(asked.cards, true);
  assert.ok(app.drawn.cards, 'the backgrounds were not offered');
  // The old run is still in the document: the chooser has to be answerable
  // without it having cost anything to open.
  assert.equal(app.document.save, before);

  await app.act('background-pilot');
  await app.act('name', 'Ayesha');
  assert.equal(app.game.commanderName, 'Ayesha');
});
