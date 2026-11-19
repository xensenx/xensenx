/**
 * Splits the source dictionary into lightweight per-letter JSON chunks.
 * Run with `node --experimental-strip-types scripts/build-dict.ts` on Node 22+.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type RawMeaning = [partOfSpeech?: string, definition?: string, unknown?: unknown, examples?: string[]];
interface RawWord {
  MEANINGS?: RawMeaning[];
  SYNONYMS?: string[];
  ANTONYMS?: string[];
}
interface DictionaryMeaning { pos: string; def: string; ex: string[]; }
interface DictionaryWord { m: DictionaryMeaning[]; syn: string[]; ant: string[]; }

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(scriptDirectory, '..', 'data', 'filtered-dictionary.json');
const outputDirectory = path.join(scriptDirectory, '..', 'public', 'assets', 'dict');

fs.mkdirSync(outputDirectory, { recursive: true });

console.log('Reading dictionary…');
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8')) as Record<string, RawWord>;
const buckets: Record<string, Record<string, DictionaryWord>> = {};

for (const [word, data] of Object.entries(source)) {
  const firstLetter = word[0]?.toLowerCase() || '_other';
  const bucket = /^[a-z]$/.test(firstLetter) ? firstLetter : '_other';
  buckets[bucket] ??= {};
  buckets[bucket][word.toLowerCase()] = {
    m: (data.MEANINGS || []).map((meaning) => ({
      pos: meaning[0] || '',
      def: meaning[1] || '',
      ex: (meaning[3] || []).slice(0, 2),
    })).filter((meaning) => meaning.def),
    syn: (data.SYNONYMS || []).slice(0, 6).map((synonym) => synonym.toLowerCase()),
    ant: (data.ANTONYMS || []).slice(0, 4).map((antonym) => antonym.toLowerCase()),
  };
}

for (const [letter, words] of Object.entries(buckets)) {
  const outputPath = path.join(outputDirectory, `${letter}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(words));
  const sizeKb = (fs.statSync(outputPath).size / 1024).toFixed(1);
  console.log(`  ${letter}.json — ${Object.keys(words).length} words, ${sizeKb} KB`);
}

console.log('\nDone. Dictionary chunks written to public/assets/dict/');
