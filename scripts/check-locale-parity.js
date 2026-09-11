#!/usr/bin/env node
/**
 * Fails if the Hindi bundle drifts from English: a missing key, an extra key, a
 * placeholder that doesn't match ("{name}" in one, "{naam}" in the other), or a
 * value left as an untranslated copy of the English.
 *
 * The last check allows strings with no letters to translate (numbers, "{salary}")
 * and brand names, which are legitimately identical.
 */
const en = require('../locales/en.json');
const hi = require('../locales/hi.json');

// Brand names stay as they are in every language.
const IDENTICAL_OK = new Set(['auth.phone.placeholder', 'pipeline.salary', 'contact.whatsapp']);
const problems = [];

for (const key of Object.keys(en)) {
  if (!(key in hi)) { problems.push(`missing in hi: ${key}`); continue; }
  const a = (en[key].match(/\{\w+\}/g) || []).sort().join();
  const b = (hi[key].match(/\{\w+\}/g) || []).sort().join();
  if (a !== b) problems.push(`placeholders differ: ${key} (${a} vs ${b})`);
  if (en[key] === hi[key] && !IDENTICAL_OK.has(key)) problems.push(`not translated: ${key}`);
}
for (const key of Object.keys(hi)) {
  if (!(key in en)) problems.push(`only in hi: ${key}`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Locales in parity: ${Object.keys(en).length} keys`);
