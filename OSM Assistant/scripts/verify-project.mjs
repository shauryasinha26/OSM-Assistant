import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredJson = [
  'package.json', 'tsconfig.json', 'src/data/scripts_evaluated.json',
  'src/data/glitches_triaged.json', 'src/data/ncert_knowledge.json'
];
let failed = false;
for (const relative of requiredJson) {
  try {
    JSON.parse(readFileSync(path.join(root, relative), 'utf8'));
    console.log(`PASS JSON ${relative}`);
  } catch (error) {
    failed = true;
    console.error(`FAIL JSON ${relative}: ${error.message}`);
  }
}
const serverCheck = spawnSync(process.execPath, ['--check', path.join(root, 'server/index.js')], { encoding: 'utf8' });
if (serverCheck.status === 0) console.log('PASS server/index.js syntax');
else { failed = true; console.error(serverCheck.stderr || 'FAIL server/index.js syntax'); }
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const dependency of ['react', 'react-dom', 'vite', 'express', 'cors', 'dotenv', '@google/genai', 'concurrently']) {
  if (packageJson.dependencies?.[dependency]) console.log(`PASS dependency declared: ${dependency}`);
  else { failed = true; console.error(`FAIL dependency missing: ${dependency}`); }
}
const env = readFileSync(path.join(root, '.env.example'), 'utf8');
for (const key of ['GEMINI_API_KEY=', 'GEMINI_MODEL=', 'VITE_API_BASE_URL=']) {
  if (env.includes(key)) console.log(`PASS env template: ${key.slice(0, -1)}`);
  else { failed = true; console.error(`FAIL env template missing ${key}`); }
}
if (failed) process.exit(1);
console.log('\nSanity checks passed. This does NOT replace npm run build or a live API test.');
