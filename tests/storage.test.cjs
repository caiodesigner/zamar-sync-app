const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { Store, validateText } = require('../dist/main/storage.js');
test('SQLite preserves exact text, chords and accents after reopening in a path with accents', () => {
 const directory = mkdtempSync(join(tmpdir(), 'zamar-ação-'));
 try {
  let store = new Store(directory);
  const content = '[C]Uma canção\n[G/B]Coração e fé 🎵';
  store.save(content); store.close();
  store = new Store(directory); assert.equal(store.read(), content); store.close();
 } finally { rmSync(directory, { recursive: true, force: true }); }
});
test('IPC text validation rejects invalid and oversized payloads', () => {
 for (const value of [null, {}, 42, 'a'.repeat(100001)]) assert.throws(() => validateText(value));
 assert.equal(validateText('ação'), 'ação');
});
