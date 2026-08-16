/**
 * Bundle Space Trader's game engine into something a plugin can import.
 *
 * The engine is 9.8k lines of TypeScript that imports nothing outside itself —
 * no React, no Capacitor, no Electron — so it is already the shape a plugin
 * wants: `newGame(opts) → GameState`, `buyGood(state, good, n) → ActionResult`.
 * What it is not is loadable. It is written for a bundler (`moduleResolution:
 * Bundler`), so every import is extensionless, and Node's ESM loader will not
 * resolve one. `tsc` does not rewrite specifiers either — it would emit the same
 * unloadable imports with the types stripped off.
 *
 * So it is bundled rather than compiled, into one file with no imports left in
 * it at all. esbuild comes from the game's own `node_modules`; nothing is added
 * to this repository to do it.
 *
 * The output is committed. A plugin is installed as an archive of exactly what
 * is here, so a build step that has to run on the user's machine is not a build
 * step, it is a plugin that does not work. Regenerating is a maintainer's job,
 * which is what this script is for.
 *
 * Usage: node scripts/build-engine.mjs [--game <path to SpaceTrader checkout>]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const out = join(root, 'plugins', 'space-trader');

/**
 * Where the game is checked out.
 *
 * Searched rather than hard-coded, for the reason `shared/engine.mjs` in the app
 * searches for manul-browser: a clone can sit under any directory name, and
 * pinning one means finding nothing on a machine that used another. The
 * canonical name comes first and `--game` overrules everything.
 */
function findGame() {
  const named = process.argv.indexOf('--game');
  if (named !== -1 && process.argv[named + 1]) {
    const dir = resolve(process.argv[named + 1]);
    if (!existsSync(join(dir, 'src', 'game', 'index.ts'))) {
      throw new Error(`no src/game/index.ts under ${dir}`);
    }
    return dir;
  }
  for (const name of ['SpaceTrader', 'spacetrader', 'space-trader']) {
    const dir = resolve(root, '..', name);
    if (existsSync(join(dir, 'src', 'game', 'index.ts'))) return dir;
  }
  throw new Error('no Space Trader checkout found beside this one — pass --game <path>');
}

/**
 * esbuild, from the game's own devDependencies. Vite already brings it.
 *
 * The package's own JS entry point, run through `node`, rather than the shim in
 * `.bin`. On Windows that shim is a `.cmd`, and since Node 20.12 `spawnSync`
 * refuses to launch a batch file directly — it fails with `EINVAL`, which names
 * neither the file nor the reason. Running the script the shim would have run
 * needs no shell, so it also cannot be made to interpret a path as an argument.
 */
function esbuildIn(game) {
  const script = join(game, 'node_modules', 'esbuild', 'bin', 'esbuild');
  if (!existsSync(script)) {
    throw new Error(`esbuild is not installed in ${game} — run npm install there first`);
  }
  return script;
}

/**
 * One entry point, one output file, no imports left.
 *
 * `--platform=node` and no externals: the point is a file that Node can import
 * from a plugin directory with nothing installed beside it.
 */
function bundle(esbuild, game, entry, target) {
  execFileSync(
    process.execPath,
    [
      esbuild,
      join(game, entry),
      '--bundle',
      '--format=esm',
      '--platform=node',
      '--target=node20',
      `--outfile=${target}`,
      '--log-level=warning',
    ],
    { stdio: 'inherit', cwd: game },
  );
  return statSync(target).size;
}

const game = findGame();
const esbuild = esbuildIn(game);
const version = JSON.parse(readFileSync(join(game, 'package.json'), 'utf8')).version ?? '0.0.0';

console.log(`[space-trader] engine from ${game} (game version ${version})`);

const engineBytes = bundle(esbuild, game, join('src', 'game', 'index.ts'), join(out, 'engine.mjs'));
console.log(`[space-trader] engine.mjs — ${(engineBytes / 1024).toFixed(0)} KB`);

/**
 * The dictionaries come too, because the engine answers in keys.
 *
 * `buyGood` returns `{key: 'info.bought', params: {...}}` rather than a
 * sentence, and the game ships English and Ukrainian for those keys already.
 * Rewriting them here would be translating a translation.
 */
const i18nBytes = bundle(esbuild, game, join('src', 'i18n', 'index.ts'), join(out, 'i18n.mjs'));
console.log(`[space-trader] i18n.mjs — ${(i18nBytes / 1024).toFixed(0)} KB`);

/**
 * What was built, recorded beside it.
 *
 * The plugin's own version is not the game's, and an engine regenerated from a
 * different checkout is the first thing worth suspecting when the two disagree.
 */
writeFileSync(
  join(out, 'engine-source.json'),
  `${JSON.stringify({ game: version, builtAt: new Date().toISOString().slice(0, 10) }, null, 2)}\n`,
  'utf8',
);
console.log('[space-trader] ok');
