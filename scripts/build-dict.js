/**
 * build-dict.js
 * Splits assets/English_dictionary/filtered.json into per-letter chunks
 * under assets/dict/. Run once: node scripts/build-dict.js
 */

const fs   = require('fs');
const path = require('path');

const SRC  = path.join(__dirname, '..', 'assets', 'English_dictionary', 'filtered.json');
const DEST = path.join(__dirname, '..', 'assets', 'dict');

fs.mkdirSync(DEST, { recursive: true });

console.log('Reading dictionary…');
const raw  = fs.readFileSync(SRC, 'utf8');
const full = JSON.parse(raw);

// Bucket by first letter (lowercase)
const buckets = {};
for (const [word, data] of Object.entries(full)) {
  const letter = word[0].toLowerCase();
  const key    = /[a-z]/.test(letter) ? letter : '_other';
  if (!buckets[key]) buckets[key] = {};

  // Normalise to lowercase key, keep original data shape
  buckets[key][word.toLowerCase()] = {
    m: (data.MEANINGS || []).map(m => ({
      pos: m[0] || '',
      def: m[1] || '',
      ex:  (m[3] || []).slice(0, 2)   // up to 2 examples
    })).filter(m => m.def),
    syn: (data.SYNONYMS || []).slice(0, 6).map(s => s.toLowerCase()),
    ant: (data.ANTONYMS || []).slice(0, 4).map(a => a.toLowerCase())
  };
}

for (const [key, data] of Object.entries(buckets)) {
  const file = path.join(DEST, `${key}.json`);
  fs.writeFileSync(file, JSON.stringify(data));
  const kb = (fs.statSync(file).size / 1024).toFixed(1);
  console.log(`  ${key}.json  — ${Object.keys(data).length} words, ${kb} KB`);
}

console.log('\nDone. All letter files written to assets/dict/');
