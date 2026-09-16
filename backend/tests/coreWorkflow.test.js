import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';
import { runMigrations } from '../src/db/migrate.js';

describe('Core Workflow Integration: Classes, Teams, Projects & Tasks', () => {
  before(() => {
    runMigrations();
  });

  let teacherToken = '';
  let studentToken = '';
  let classCode = '';
  let classId = 0;
  let teamId = 0;
  let projectId = 0;
  let taskId = 0;

  // 1. Authenticate Teacher and Student
  test('Log in Teacher and Student', async () => {
    const teacherRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@example.com', password: 'Password123!' });

    assert.strictEqual(teacherRes.status, 200);
    teacherToken = teacherRes.body.data.token;

    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'aryan@example.com', password: 'Password123!' });

    assert.strictEqual(studentRes.status, 200);
    studentToken = studentRes.body.data.token;
  });

  // 2. Class Management
  test('Teacher creates a class with unique code', async () => {
    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name: 'CS450: Distributed Systems',
        description: 'Advanced systems capstone',
      });

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.data.code);
    assert.strictEqual(res.body.data.code.length, 6);
    classId = res.body.data.id;
    classCode = res.body.data.code;
  });

  test('Student joins class using code', async () => {
    // Create new student to join
    const newStudentEmail = `joiner_${Date.now()}@example.com`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New Joiner',
        username: `joiner_${Date.now()}`,
        email: newStudentEmail,
        password: 'Password123!',
        role: 'student',
      });

    assert.strictEqual(regRes.status, 201);
    const joinerToken = regRes.body.data.token;

    const joinRes = await request(app)
      .post('/api/classes/join')
      .set('Authorization', `Bearer ${joinerToken}`)
      .send({ code: classCode });

    assert.strictEqual(joinRes.status, 200);
    assert.strictEqual(joinRes.body.data.id, classId);
  });

  // 3. Team Management
  test('Student creates a team in class', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Cloud Ninjas',
        classId: classId,
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.name, 'Cloud Ninjas');
    assert.strictEqual(res.body.data.members.length, 1);
    teamId = res.body.data.id;
  });

  // 4. Project Management
  test('Team creates a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Cloud Monitor Platform',
        description: 'Real-time telemetry and monitoring tool',
        teamId: teamId,
        classId: classId,
        goals: ['Setup metrics collector', 'Build live dashboard'],
        tags: ['Go', 'React', 'Docker'],
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.name, 'Cloud Monitor Platform');
    assert.strictEqual(res.body.data.progress, 0);
    projectId = res.body.data.id;
  });

  test('Fetch newly created project by ID', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.id, projectId);
    assert.strictEqual(res.body.data.name, 'Cloud Monitor Platform');
    assert.strictEqual(res.body.data.class_id, classId);
    assert.strictEqual(res.body.data.team_id, teamId);
  });

  test('Reject project creation when team does not belong to class', async () => {
    const otherClassRes = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name: 'CS999: Unrelated Class',
        description: 'Testing team mismatch',
      });
    const unrelatedClassId = otherClassRes.body.data.id;

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Mismatched Project',
        description: 'Should fail validation',
        teamId: teamId,
        classId: unrelatedClassId,
      });

    assert.strictEqual(res.status, 400);
    assert.match(res.body.message, /team does not belong to the selected class/i);
  });

  test('Teacher creates project in their managed class', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name: 'Teacher Managed Project',
        description: 'Created directly by instructor',
        teamId: teamId,
        classId: classId,
        tags: ['Architecture', 'DevOps'],
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.name, 'Teacher Managed Project');
  });

  test('Add a milestone to the project', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/milestones`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Milestone 1: Agent Setup',
        description: 'Deploy host monitoring daemon',
        xpReward: 150,
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.title, 'Milestone 1: Agent Setup');
  });

  // 5. Task Management
  test('Create a task with priority and deadline', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        projectId: projectId,
        title: 'Build telemetry ingestion endpoint',
        description: 'Accept JSON metrics payloads from client daemon',
        priority: 'high',
        taskType: 'weekly',
        xpValue: 80,
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.status, 'Planned');
    assert.strictEqual(res.body.data.priority, 'high');
    assert.ok(res.body.data.assigned_to_id);
    taskId = res.body.data.id;
  });

  test('Newly created task appears in GET /api/tasks/my and GET /api/tasks?projectId=...', async () => {
    // 1. Check /api/tasks/my
    const myTasksRes = await request(app)
      .get('/api/tasks/my')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(myTasksRes.status, 200);
    assert.ok(Array.isArray(myTasksRes.body.data));
    const foundInMy = myTasksRes.body.data.some((t) => t.id === taskId);
    assert.strictEqual(foundInMy, true, 'Task must appear in My Tasks');

    // 2. Check /api/tasks?projectId=...
    const projectTasksRes = await request(app)
      .get(`/api/tasks?projectId=${projectId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(projectTasksRes.status, 200);
    assert.ok(Array.isArray(projectTasksRes.body.data));
    const foundInProject = projectTasksRes.body.data.some((t) => t.id === taskId);
    assert.strictEqual(foundInProject, true, 'Task must appear in Project Tasks');
  });

  test('Update task status: Planned -> In Progress', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ status: 'In Progress' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.status, 'In Progress');
  });

  test('Submit completion evidence: In Progress -> Verification Pending with AI Confidence scoring', async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/evidence`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ evidence: 'Implemented in PR #42 with 100% test passing.' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.status, 'Verification Pending');
    assert.strictEqual(res.body.data.verification_status, 'pending');
    assert.strictEqual(res.body.data.completion_evidence, 'Implemented in PR #42 with 100% test passing.');
    assert.ok(res.body.data.verification, 'AI verification object must be attached');
    assert.ok(res.body.data.verification.confidence_score >= 0.7, 'Confidence score should reflect PR & test keywords');
    assert.ok(res.body.data.verification.explanation.includes('AI Verification'));
  });

  test('Complete task and verify project progress & XP award', async () => {
    // Check initial student XP
    const meBefore = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);
    const initialXP = meBefore.body.data.xp;

    const res = await request(app)
      .post(`/api/tasks/${taskId}/verify`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ approved: true, feedbackNote: 'Great telemetry design and implementation.' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.status, 'Completed');
    assert.strictEqual(res.body.data.verification_status, 'verified');
    assert.strictEqual(res.body.data.verification.verification_state, 'confirmed');

    // Check project progress updated to 100% (1 of 1 completed)
    const projRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(projRes.body.data.progress, 100);

    // Check user earned XP
    const meAfter = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(meAfter.body.data.xp, initialXP + 80);
  });

  // 6. GitHub Integration & Repository Linking
  test('Connect GitHub repository to project', async () => {
    const res = await request(app)
      .post(`/api/github/${projectId}/connect`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        repoUrl: 'https://github.com/cloudninjas/monitor-daemon',
        defaultBranch: 'main',
        accessToken: 'ghp_fake_test_token_123',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.repo_name, 'monitor-daemon');
    assert.strictEqual(res.body.data.owner, 'cloudninjas');
    assert.strictEqual(res.body.data.default_branch, 'main');
  });

  test('Sync repository gracefully even when remote is mocked/offline', async () => {
    const res = await request(app)
      .post(`/api/github/${projectId}/sync`)
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  test('Query GitHub status, commits, PRs, and issues endpoints', async () => {
    // 1. Check status endpoint
    const statusRes = await request(app)
      .get(`/api/github/${projectId}/status`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(statusRes.status, 200);
    assert.strictEqual(statusRes.body.success, true);
    assert.ok(statusRes.body.data.metrics);
    assert.strictEqual(typeof statusRes.body.data.metrics.commits, 'number');
    assert.strictEqual(typeof statusRes.body.data.metrics.pullRequests, 'number');
    assert.strictEqual(typeof statusRes.body.data.metrics.issues, 'number');

    // 2. Check commits endpoint
    const commitsRes = await request(app)
      .get(`/api/github/${projectId}/commits`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(commitsRes.status, 200);
    assert.ok(Array.isArray(commitsRes.body.data));

    // 3. Check PRs endpoint
    const prsRes = await request(app)
      .get(`/api/github/${projectId}/pull-requests`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(prsRes.status, 200);
    assert.ok(Array.isArray(prsRes.body.data));

    // 4. Check issues endpoint
    const issuesRes = await request(app)
      .get(`/api/github/${projectId}/issues`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(issuesRes.status, 200);
    assert.ok(Array.isArray(issuesRes.body.data));
  });

  // 7. Dashboard Progress & Activity Feed
  test('Fetch aggregated user dashboard progress', async () => {
    const res = await request(app)
      .get('/api/progress/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.stats.totalXp > 0);
    assert.ok(res.body.data.stats.communityRank.startsWith('#'), 'Community rank should be ranked for student');
    assert.ok(res.body.data.stats.communityTier.startsWith('Top'), 'Community tier should be percentage tier');
    assert.ok(res.body.data.stats.weeklyXp >= 80, 'Weekly XP should include the completed task XP');
    assert.ok(res.body.data.stats.weeklyXpText.includes('this week'), 'Weekly XP text should mention this week');
    assert.ok(Array.isArray(res.body.data.projects));
    assert.ok(Array.isArray(res.body.data.recentActivities));
  });

  test('Query unified contributions and test idempotent deduplication', async () => {
    // 1. Fetch user contributions
    const userContribsRes = await request(app)
      .get('/api/progress/contributions')
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(userContribsRes.status, 200);
    assert.ok(Array.isArray(userContribsRes.body.data));
    // The completed task should already have created a contribution
    const taskContrib = userContribsRes.body.data.find((c) => c.external_id === `task:${taskId}`);
    assert.ok(taskContrib, 'Completed task must generate a contribution with external_id task:<id>');

    // 2. Query project-scoped contributions
    const projContribsRes = await request(app)
      .get(`/api/progress/contributions/project/${projectId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(projContribsRes.status, 200);
    assert.ok(Array.isArray(projContribsRes.body.data));
    assert.ok(projContribsRes.body.data.length > 0);

    // 3. Record a contribution with an external_id
    const testExternalId = `review:pr:14:${Date.now()}`;
    const recordRes1 = await request(app)
      .post('/api/progress/contributions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        projectId: projectId,
        activityType: 'code_review',
        points: 20,
        xp: 20,
        description: 'Reviewed Pull Request #14 architecture changes',
        externalId: testExternalId,
      });
    assert.strictEqual(recordRes1.status, 201);
    assert.strictEqual(recordRes1.body.data.recorded, true);

    // 4. Record identical contribution with the same external_id (idempotency check)
    const recordRes2 = await request(app)
      .post('/api/progress/contributions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        projectId: projectId,
        activityType: 'code_review',
        points: 20,
        xp: 20,
        description: 'Reviewed Pull Request #14 architecture changes',
        externalId: testExternalId,
      });
    assert.strictEqual(recordRes2.status, 201);
    assert.strictEqual(recordRes2.body.data.recorded, false, 'Duplicate external_id should be skipped');
  });

  // 8. User Scoping & Isolation between different Students, Teams, Projects, and Tasks
  test('Strict User Scoping: Student A cannot retrieve Student B team project or tasks through user-scoped endpoints', async () => {
    // 1. Register Student A
    const studentARes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Student',
        username: `alice_${Date.now()}`,
        email: `alice_${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'student',
      });
    assert.strictEqual(studentARes.status, 201);
    const tokenA = studentARes.body.data.token;

    // 2. Register Student B
    const studentBRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Student',
        username: `bob_${Date.now()}`,
        email: `bob_${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'student',
      });
    assert.strictEqual(studentBRes.status, 201);
    const tokenB = studentBRes.body.data.token;

    // 3. Both join the same class
    await request(app)
      .post('/api/classes/join')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ code: classCode });

    await request(app)
      .post('/api/classes/join')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ code: classCode });

    // 4. Student A creates Team Alpha and Project Alpha
    const teamARes = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: `Team Alpha ${Date.now()}`, classId: classId });
    assert.strictEqual(teamARes.status, 201);
    const teamAId = teamARes.body.data.id;

    const projARes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Alpha Secret Platform',
        description: 'Team Alpha internal project',
        teamId: teamAId,
        classId: classId,
      });
    assert.strictEqual(projARes.status, 201);
    const projAId = projARes.body.data.id;

    const taskARes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        projectId: projAId,
        title: 'Alpha Private Task',
        description: 'Confidential work for Team Alpha',
      });
    assert.strictEqual(taskARes.status, 201);
    const taskAId = taskARes.body.data.id;

    // 5. Student B creates Team Beta and Project Beta
    const teamBRes = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: `Team Beta ${Date.now()}`, classId: classId });
    assert.strictEqual(teamBRes.status, 201);
    const teamBId = teamBRes.body.data.id;

    const projBRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Beta Innovation System',
        description: 'Team Beta internal project',
        teamId: teamBId,
        classId: classId,
      });
    assert.strictEqual(projBRes.status, 201);
    const projBId = projBRes.body.data.id;

    const taskBRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        projectId: projBId,
        title: 'Beta Private Task',
        description: 'Confidential work for Team Beta',
      });
    assert.strictEqual(taskBRes.status, 201);
    const taskBId = taskBRes.body.data.id;

    // 6. Verify User-Scoped Projects (/api/projects/my):
    // Student A must see Project A, and MUST NOT see Project B
    const aProjsRes = await request(app)
      .get('/api/projects/my')
      .set('Authorization', `Bearer ${tokenA}`);
    assert.strictEqual(aProjsRes.status, 200);
    const aProjIds = aProjsRes.body.data.map((p) => p.id);
    assert.ok(aProjIds.includes(projAId), "Student A must see Team Alpha's project");
    assert.strictEqual(aProjIds.includes(projBId), false, "Student A MUST NOT see Team Beta's project");

    // Student B must see Project B, and MUST NOT see Project A
    const bProjsRes = await request(app)
      .get('/api/projects/my')
      .set('Authorization', `Bearer ${tokenB}`);
    assert.strictEqual(bProjsRes.status, 200);
    const bProjIds = bProjsRes.body.data.map((p) => p.id);
    assert.ok(bProjIds.includes(projBId), "Student B must see Team Beta's project");
    assert.strictEqual(bProjIds.includes(projAId), false, "Student B MUST NOT see Team Alpha's project");

    // 7. Verify User-Scoped Tasks (/api/tasks/my):
    // Student A must see Task A, and MUST NOT see Task B
    const aTasksRes = await request(app)
      .get('/api/tasks/my')
      .set('Authorization', `Bearer ${tokenA}`);
    assert.strictEqual(aTasksRes.status, 200);
    const aTaskIds = aTasksRes.body.data.map((t) => t.id);
    assert.ok(aTaskIds.includes(taskAId), "Student A must see their own task");
    assert.strictEqual(aTaskIds.includes(taskBId), false, "Student A MUST NOT see Student B's task");

    // Student B must see Task B, and MUST NOT see Task A
    const bTasksRes = await request(app)
      .get('/api/tasks/my')
      .set('Authorization', `Bearer ${tokenB}`);
    assert.strictEqual(bTasksRes.status, 200);
    const bTaskIds = bTasksRes.body.data.map((t) => t.id);
    assert.ok(bTaskIds.includes(taskBId), "Student B must see their own task");
    assert.strictEqual(bTaskIds.includes(taskAId), false, "Student B MUST NOT see Student A's task");
  });

  // 9. Teacher Feedback & Evaluations
  test('Teacher creates project review feedback and student retrieves it', async () => {
    // 1. Teacher submits review
    const createRes = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        projectId: projectId,
        comment: 'Outstanding progress on host daemon and test automation.',
        rating: 5,
        type: 'teacher_review',
      });

    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createRes.body.data.rating, 5);
    assert.strictEqual(createRes.body.data.author_role, 'teacher');
    const feedbackId = createRes.body.data.id;

    // 2. Student retrieves feedback for the project
    const getRes = await request(app)
      .get(`/api/feedback/project/${projectId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(getRes.status, 200);
    assert.ok(Array.isArray(getRes.body.data));
    const found = getRes.body.data.some((f) => f.id === feedbackId);
    assert.strictEqual(found, true, 'Created feedback should be visible to project members');
  });
});
