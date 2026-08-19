/**
 * The manifest has to be true about the directory it sits in.
 *
 * The app checks all of this at install time, on somebody else's machine, and
 * answers a failure with a row that says the plugin is broken. Checking it here
 * costs a second and moves that discovery to a push. The rules are the ones
 * `src/main/plugins/manifest.mjs` enforces in the app, restated from the
 * publishing side: an id that is not the directory name cannot be unpacked
 * where it says it lives, a `main` that is not in the archive is a promise the
 * plugin breaks on its first use, and a service that does not exist is a
 * load-time error naming it.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const pluginsRoot = join(here, '..', 'plugins');

// One plugin per repository, but read rather than named: a second directory
// appearing here is exactly the mistake this file should catch.
const directories = readdirSync(pluginsRoot).filter((name) => existsSync(join(pluginsRoot, name, 'plugin.json')));

test('the repository holds exactly one plugin', () => {
  assert.equal(directories.length, 1, `expected one plugin directory, found ${directories.join(', ') || 'none'}`);
});

const dir = join(pluginsRoot, directories[0]);
const manifest = JSON.parse(readFileSync(join(dir, 'plugin.json'), 'utf8'));

test('the id is the directory name, and is a safe one', () => {
  assert.equal(manifest.id, directories[0]);
  assert.match(manifest.id, /^[a-z0-9][a-z0-9-]{0,39}$/);
});

test('the version is one the app can compare', () => {
  assert.match(String(manifest.version), /^\d+(\.\d+)*(-[0-9A-Za-z.-]+)?$/);
});

test('the api version is the one the panel needs', () => {
  // 11 is the build that added the field a game can ask into and the colours on
  // its bars, both of which this plugin uses. Declaring less would let it
  // install on a build where the trade field does nothing.
  assert.equal(manifest.apiVersion, 11);
});

test('it declares a category the app has a heading for', () => {
  // `normaliseCategory` files an unknown one under OTHER rather than refusing,
  // so a typo here is silent in the app and only a test says so.
  assert.ok(
    ['capability', 'input', 'media', 'everyday', 'games', 'language', 'appearance', 'other'].includes(manifest.category),
    `"${manifest.category}" is not a heading the app knows`,
  );
});

test('every action the plugin registers is declared, and nothing else is', async () => {
  // The app refuses an action that was not declared, so a name that drifts
  // between the two files is a move that stops working after an update.
  const registered = [];
  const { activate } = await import('../plugins/space-trader/main.mjs');
  activate({
    id: 'space-trader',
    service: () => { throw new Error('none here'); },
    action: ({ type }) => registered.push(type),
    prompt: () => {},
    context: () => {},
    onSettingsChanged: () => {},
    store: { get: (key, fallback = '') => fallback },
    state: { get: () => ({}), set: () => {} },
    dataDir: () => '.',
    log: () => {},
  });
  assert.deepEqual(registered.sort(), [...manifest.actions].sort());
});

test('every service it asks for exists in the app', () => {
  for (const service of manifest.services ?? []) {
    assert.ok(['notify', 'mic', 'audio', 'scene'].includes(service), `"${service}" is not a service the app hands out`);
  }
});

test('every file the manifest names is in the directory', () => {
  const named = [manifest.icon, manifest.main]
    .concat((manifest.themes ?? []).map((theme) => theme.file))
    .concat((manifest.locales ?? []).map((locale) => locale.file))
    .filter(Boolean);

  assert.ok(named.length > 0, 'the manifest names no files at all');
  for (const file of named) {
    // The same containment rule the app applies to `main`: a path that climbs
    // out of the plugin's own directory is refused rather than resolved.
    assert.ok(
      file.split(/[/\\]+/).every((segment) => segment && segment !== '..' && segment !== '.'),
      `"${file}" reaches outside the plugin directory`,
    );
    assert.ok(existsSync(join(dir, file)), `the manifest names "${file}", which is not here`);
  }
});

test('the bundled engine and dictionary are committed', () => {
  // Not named in the manifest, and the plugin is nothing without them: they are
  // built by `npm run engine` from a Space Trader checkout that only a
  // maintainer has, and an archive packed without them installs cleanly and
  // then fails on its first import.
  for (const file of ['engine.mjs', 'i18n.mjs', 'engine-source.json']) {
    assert.ok(existsSync(join(dir, file)), `${file} is missing — run npm run engine`);
  }
});

test('a select setting offers options, and no duplicate keys', () => {
  const keys = new Set();
  for (const setting of manifest.settings ?? []) {
    assert.ok(!keys.has(setting.key), `two settings called "${setting.key}"`);
    keys.add(setting.key);
    assert.ok(['folder', 'text', 'toggle', 'select'].includes(setting.type), `"${setting.type}" is not a setting the app draws`);
    // The app refuses to store a value that was never offered, so a `select`
    // with no options is a control that can hold nothing.
    if (setting.type === 'select') assert.ok(setting.options?.length > 0, `"${setting.key}" is a select with no options`);
  }
});

test('the language setting offers exactly the languages the plugin speaks', async () => {
  const { LANGUAGES } = await import('../plugins/space-trader/words.mjs');
  const offered = (manifest.settings ?? []).find((setting) => setting.key === 'language');
  assert.ok(offered, 'no language setting');
  assert.deepEqual(offered.options.map((option) => option.value).sort(), LANGUAGES.map((entry) => entry.code).sort());
});
