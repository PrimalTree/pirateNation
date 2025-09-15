import test from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function getJson(path) {
  const res = await fetch(new URL(path, BASE));
  assert.equal(res.ok, true, `GET ${path} -> ${res.status}`);
  return res.json();
}

test('homepage responds', async () => {
  const res = await fetch(new URL('/', BASE));
  assert.equal(res.ok, true);
  const html = await res.text();
  assert.match(html, /<!doctype|<html/i);
});

test('/api/public/schedule.json returns object', async () => {
  const json = await getJson('/api/public/schedule.json');
  assert.equal(typeof json, 'object');
  assert.ok('games' in json || Array.isArray(json));
});

test('/api/public/roster.json returns object', async () => {
  const json = await getJson('/api/public/roster.json');
  assert.equal(typeof json, 'object');
  assert.ok('players' in json || Array.isArray(json));
});

test('/api/stadium-map returns object', async () => {
  const json = await getJson('/api/stadium-map');
  assert.equal(typeof json, 'object');
  assert.ok('name' in json);
});

