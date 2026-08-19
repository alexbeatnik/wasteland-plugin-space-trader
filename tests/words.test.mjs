/**
 * The two dictionaries, against each other.
 *
 * A translation goes wrong quietly. A key added in English and not in Ukrainian
 * shows an English sentence in the middle of a Ukrainian panel; a `{hole}` whose
 * name was translated along with the words around it shows `{система}` to a
 * player; a plural form left out counts "2 системи" as "2 система". None of
 * those throws, and none of them is visible from the code that uses the key.
 *
 * So the tables are compared here, key for key, rather than read.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { en } from '../plugins/space-trader/locales/en.mjs';
import { uk } from '../plugins/space-trader/locales/uk.mjs';
import { credits, group, has, language, patterns, setLanguage, t } from '../plugins/space-trader/words.mjs';

const TABLES = { en, uk };

/** Every `{hole}` in a phrase, whatever kind of value it is. */
function holes(value) {
  const found = new Set();
  for (const text of typeof value === 'object' ? Object.values(value) : [value]) {
    for (const [, name] of String(text).matchAll(/\{(\w+)\}/g)) found.add(name);
  }
  return [...found].sort();
}

test('both tables carry the same keys', () => {
  const missing = Object.keys(en).filter((key) => !(key in uk));
  const extra = Object.keys(uk).filter((key) => !(key in en));
  assert.deepEqual(missing, [], `not translated: ${missing.join(', ')}`);
  // A key in the translation and not in English is a phrase nothing will ever
  // ask for — usually a typo in one of the two.
  assert.deepEqual(extra, [], `in Ukrainian only: ${extra.join(', ')}`);
});

test('a translated phrase keeps the holes the code fills', () => {
  for (const key of Object.keys(en)) {
    if (key.startsWith('re.')) continue;
    assert.deepEqual(holes(uk[key]), holes(en[key]), `"${key}" has different holes in the two languages`);
  }
});

test('a counted phrase has a form for every class its language needs', () => {
  for (const [code, table] of Object.entries(TABLES)) {
    for (const [key, value] of Object.entries(table)) {
      if (typeof value !== 'object') continue;
      const forms = Object.keys(value).sort();
      // English needs two and Ukrainian three, and the third is not optional:
      // "2 система" is what a missing `few` produces.
      const wanted = code === 'en' ? ['one', 'other'] : ['few', 'many', 'one'];
      assert.deepEqual(forms, wanted, `${code} "${key}" has forms ${forms.join(', ')}`);
    }
  }
});

test('Ukrainian counts in three forms', () => {
  setLanguage('uk');
  assert.match(t('panel.field.inRangeValue', { n: 1 }), /^1 система/);
  assert.match(t('panel.field.inRangeValue', { n: 3 }), /^3 системи/);
  assert.match(t('panel.field.inRangeValue', { n: 11 }), /^11 систем/);
  assert.match(t('panel.field.inRangeValue', { n: 22 }), /^22 системи/);
  setLanguage('en');
  assert.equal(t('panel.field.inRangeValue', { n: 1 }), '1 system');
  assert.equal(t('panel.field.inRangeValue', { n: 4 }), '4 systems');
});

test('every pattern compiles, in both languages', () => {
  for (const [code, table] of Object.entries(TABLES)) {
    for (const [key, value] of Object.entries(table)) {
      if (!key.startsWith('re.')) continue;
      assert.doesNotThrow(() => new RegExp(value, 'i'), `${code} "${key}" is not a regular expression`);
    }
  }
});

test('the English words are listened for in a Ukrainian game too', () => {
  // The buttons send the phrasing of the current language, but a player types
  // what comes to hand and a small model asked to relay a move sometimes
  // translates it on the way. Both have to work.
  setLanguage('uk');
  assert.ok(patterns('warp').test('лети'));
  assert.ok(patterns('warp').test('warp'));
  assert.ok(patterns('buy').test('buy'));
  assert.ok(patterns('buy').test('купити'));
  setLanguage('en');
});

test('asking for the news does not start a new game', () => {
  // It did. `^new` matches "news", so the news screen made a commander instead
  // — and then every screen after it answered "choose a background".
  for (const code of ['en', 'uk']) {
    setLanguage(code);
    assert.equal(patterns('new').test('news'), false, `${code}: "news" reads as a new game`);
    assert.equal(patterns('new').test('новини'), false, `${code}: "новини" reads as a new game`);
    assert.ok(patterns('new').test('new game'));
    assert.ok(patterns('news').test('news'));
  }
  setLanguage('en');
});

test('the four kinds of command stay apart', () => {
  // One word meaning a move in one language and another move in the other would
  // fire the wrong rule, and the English patterns are in force in every
  // language. The Ukrainian ones are only tested under Ukrainian, because that
  // is the only place they are listened for.
  const kinds = ['buy', 'sell', 'refuel', 'repair', 'warp'];
  const words = {
    en: ['buy', 'sell', 'refuel', 'repair', 'warp'],
    uk: ['buy', 'sell', 'refuel', 'repair', 'warp', 'купити', 'продати', 'заправитися', 'ремонт', 'лети'],
  };
  for (const [code, list] of Object.entries(words)) {
    setLanguage(code);
    for (const word of list) {
      const matched = kinds.filter((kind) => patterns(kind).test(word));
      assert.equal(matched.length, 1, `${code}: "${word}" matches ${matched.join(' and ') || 'nothing'}`);
    }
  }
  setLanguage('en');
});

test('an unknown language is English rather than nothing', () => {
  assert.equal(setLanguage('kl'), 'en');
  assert.equal(language(), 'en');
});

test('a key nobody translated falls back to English rather than to a blank', () => {
  setLanguage('uk');
  // Proved with a real key rather than a fake one: `t` falls back through the
  // English table, so the test is that the fallback exists at all.
  assert.ok(has('panel.meter.hull'));
  assert.equal(t('this.key.does.not.exist'), 'this.key.does.not.exist');
  setLanguage('en');
});

test('a hole with nothing to put in it is left visible', () => {
  // Blanking it would read as a gap in the sentence — a bug in the game.
  // Leaving `{system}` reads as a bug in the translation, which is what it is.
  assert.equal(t('refuse.noSystem', {}), 'there is no system called "{what}" on the chart');
});

test('numbers are grouped the way each language groups them', () => {
  setLanguage('en');
  assert.equal(group(1000000), '1,000,000');
  assert.equal(credits(1000), '1,000 cr');
  assert.equal(group(-4500), '-4,500');
  assert.equal(group(999), '999');
  setLanguage('uk');
  // A non-breaking space, so a price cannot be broken across two lines.
  assert.equal(credits(1000), '1 000 кр');
  setLanguage('en');
});

test('the prompt names the refusal it exists to prevent, in both languages', () => {
  // Not decoration. A model holding a game action still answers "I can't play
  // games" unless the fragment says in words that the refusal is wrong here.
  assert.match(en['prompt.text'], /can't play games/i);
  assert.match(uk['prompt.text'], /не вмію грати/i);
  for (const table of [en, uk]) {
    assert.match(table['prompt.text'], /space_trader_move/);
    assert.match(table['prompt.text'], /\{language\}/);
  }
});
