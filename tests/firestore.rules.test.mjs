// Firestore security-rules tests. Run with: pnpm test:rules (needs Java 21+).
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { Timestamp, deleteDoc, doc, getDoc, increment, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

const weekIndexOf = (ms) => Math.floor((ms + 259200000) / 604800000);
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'dhikrforest-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
after(() => env.cleanup());
beforeEach(() => env.clearFirestore());

const alice = () => env.authenticatedContext('alice').firestore();
const aliceDoc = () => doc(alice(), 'users', 'alice');

function newProfile(overrides = {}) {
  return {
    nickname: 'Alice',
    total: 0,
    weekTotal: 0,
    weekIndex: weekIndexOf(Date.now()),
    lastSync: serverTimestamp(),
    createdAt: serverTimestamp(),
    qadrActivatedAt: null,
    qadrExpiresAt: null,
    ...overrides,
  };
}

/** Seeds alice's row directly, as if her last sync was `agoSec` seconds ago. */
async function seed({ agoSec = 60, total = 100, qadrAgoDays = null } = {}) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const now = Date.now();
    await setDoc(doc(ctx.firestore(), 'users', 'alice'), {
      nickname: 'Alice',
      total,
      weekTotal: total,
      weekIndex: weekIndexOf(now),
      lastSync: Timestamp.fromMillis(now - agoSec * 1000),
      createdAt: Timestamp.fromMillis(now - 86400000),
      qadrActivatedAt: qadrAgoDays === null ? null : Timestamp.fromMillis(now - qadrAgoDays * 86400000),
      qadrExpiresAt: qadrAgoDays === null ? null : Timestamp.fromMillis(now - qadrAgoDays * 86400000 + 8 * 3600000),
    });
  });
}

function sync(delta, extra = {}) {
  return updateDoc(aliceDoc(), {
    total: increment(delta),
    weekTotal: increment(delta),
    weekIndex: weekIndexOf(Date.now()),
    lastSync: serverTimestamp(),
    ...extra,
  });
}

test('create: starts at zero with a valid nickname', async () => {
  await assertSucceeds(setDoc(aliceDoc(), newProfile()));
});

test('create: cannot start with trees, or as someone else', async () => {
  await assertFails(setDoc(aliceDoc(), newProfile({ total: 5000 })));
  await assertFails(setDoc(doc(alice(), 'users', 'bob'), newProfile()));
  await assertFails(setDoc(aliceDoc(), newProfile({ nickname: '<script>' })));
});

test('sync: a human-paced delta is accepted', async () => {
  await seed({ agoSec: 60 });
  await assertSucceeds(sync(500));
});

test('sync: more than 16 trees/s since last sync is rejected', async () => {
  await seed({ agoSec: 60 });
  await assertFails(sync(2000));
});

test('sync: at most 5,000 per write even after a long gap', async () => {
  await seed({ agoSec: 3600 });
  await assertFails(sync(5001));
  await assertSucceeds(sync(5000));
});

test('sync: writes closer than 5 s apart are rejected', async () => {
  await seed({ agoSec: 2 });
  await assertFails(sync(10));
});

test('sync: client cannot fake lastSync, lower the total, or skew weekTotal', async () => {
  await seed({ agoSec: 60 });
  await assertFails(sync(10, { lastSync: Timestamp.fromMillis(Date.now() - 999999) }));
  await assertFails(sync(-10));
  await assertFails(sync(10, { weekTotal: increment(500) }));
});

test('qadr: activation once, at most 14 h long, then ×1000 allowance', async () => {
  await seed({ agoSec: 60 });
  await assertFails(
    updateDoc(aliceDoc(), {
      qadrActivatedAt: serverTimestamp(),
      qadrExpiresAt: Timestamp.fromMillis(Date.now() + 20 * 3600000),
    })
  );
  await assertSucceeds(
    updateDoc(aliceDoc(), {
      qadrActivatedAt: serverTimestamp(),
      qadrExpiresAt: Timestamp.fromMillis(Date.now() + 8 * 3600000),
    })
  );
  await env.withSecurityRulesDisabled((ctx) =>
    updateDoc(doc(ctx.firestore(), 'users', 'alice'), { lastSync: Timestamp.fromMillis(Date.now() - 60000) })
  );
  await assertSucceeds(sync(400000));
});

test('qadr: a second night within 300 days is rejected', async () => {
  await seed({ agoSec: 60, qadrAgoDays: 10 });
  await assertFails(
    updateDoc(aliceDoc(), {
      qadrActivatedAt: serverTimestamp(),
      qadrExpiresAt: Timestamp.fromMillis(Date.now() + 8 * 3600000),
    })
  );
});

test('qadr: without an active night the ×1000 allowance does not apply', async () => {
  await seed({ agoSec: 60, qadrAgoDays: 30 });
  await assertFails(sync(400000));
});

test('profile: rename ok, delete and foreign writes denied', async () => {
  await seed();
  await assertSucceeds(updateDoc(aliceDoc(), { nickname: 'Aisha' }));
  await assertFails(deleteDoc(aliceDoc()));
  const bob = env.authenticatedContext('bob').firestore();
  await assertFails(updateDoc(doc(bob, 'users', 'alice'), { nickname: 'pwned' }));
  await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(), 'users', 'alice')));
});

test('private forest: owner only', async () => {
  const forest = { segments: [{ t: 'standard', n: 10 }], goal: 100, streak: { count: 1, lastGoalDay: null }, daily: { day: '2026-10-30', count: 3 }, resetAt: 0, updatedAt: serverTimestamp() };
  await assertSucceeds(setDoc(doc(alice(), 'users', 'alice', 'private', 'forest'), forest));
  const bob = env.authenticatedContext('bob').firestore();
  await assertFails(getDoc(doc(bob, 'users', 'alice', 'private', 'forest')));
  await assertFails(setDoc(doc(alice(), 'users', 'alice', 'private', 'other'), forest));
});
