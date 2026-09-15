import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';
import { runMigrations } from '../src/db/migrate.js';

describe('Gamification & Arena Integration', () => {
  before(() => {
    runMigrations();
  });

  let studentToken = '';
  let challenges = [];
  let challengeToTest = null;
  let initialXp = 0;

  test('Log in student and get current profile', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'aryan@example.com', password: 'Password123!' });

    assert.strictEqual(loginRes.status, 200);
    studentToken = loginRes.body.data.token;
    initialXp = loginRes.body.data.user.xp;
  });

  test('GET /api/gamification/arena should retrieve active weekly challenges', async () => {
    const res = await request(app)
      .get('/api/gamification/arena')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    challenges = res.body.data;
    challengeToTest = challenges[0];
    assert.ok(challengeToTest.title);
    assert.ok(challengeToTest.xp_reward);
  });

  test('POST /api/gamification/arena/:id/accept should accept challenge', async () => {
    const res = await request(app)
      .post(`/api/gamification/arena/${challengeToTest.id}/accept`)
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.message.includes('Accepted'));
  });

  test('POST /api/gamification/arena/:id/complete should award XP and record contribution', async () => {
    const evidenceText = 'Fixed null pointer exception in issue #42 via PR #15.';
    const res = await request(app)
      .post(`/api/gamification/arena/${challengeToTest.id}/complete`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ evidence: evidenceText });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.earnedXp, challengeToTest.xp_reward);
    assert.ok(res.body.totalXp >= initialXp + challengeToTest.xp_reward);

    // Verify user profile reflects new XP
    const profileRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(profileRes.status, 200);
    assert.strictEqual(profileRes.body.data.xp, res.body.totalXp);
  });

  test('GET /api/gamification/leaderboard should return ranked student leaderboard', async () => {
    const res = await request(app)
      .get('/api/gamification/leaderboard')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    assert.strictEqual(res.body.data[0].position, 1);
    assert.ok(res.body.data[0].xp >= (res.body.data[1]?.xp || 0));
  });
});
