import bcrypt from 'bcryptjs';
import { execute, queryOne, transaction } from '../config/database.js';
import { runMigrations } from './migrate.js';

export async function runSeed() {
  runMigrations();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  transaction(() => {
    // Check if data already exists
    const existing = queryOne('SELECT COUNT(*) as count FROM users;');
    if (existing && existing.count > 0) {
      console.log('Database already seeded, skipping.');
      return;
    }

    console.log('Seeding initial educational environment data...');

    // 1. Users
    // Teacher
    const teacherInsert = execute(
      `INSERT INTO users (name, username, email, password_hash, role, avatar, xp, points, rank, bio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        'Dr. Elena Vance',
        'evance',
        'teacher@example.com',
        passwordHash,
        'teacher',
        'EV',
        5000,
        3500,
        'Professor',
        'Senior Capstone Instructor and Software Engineering Lead',
      ]
    );
    const teacherId = Number(teacherInsert.lastInsertRowid);

    // Students
    const aryanInsert = execute(
      `INSERT INTO users (name, username, email, password_hash, role, avatar, xp, points, rank, bio, github_username)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        'Aryan Thakkar',
        'aryan',
        'aryan@example.com',
        passwordHash,
        'student',
        'AT',
        2450,
        1820,
        'Level 6',
        'Full Stack • AI/ML Developer',
        'aryanthakkar',
      ]
    );
    const aryanId = Number(aryanInsert.lastInsertRowid);

    const rahulInsert = execute(
      `INSERT INTO users (name, username, email, password_hash, role, avatar, xp, points, rank, bio, github_username)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        'Rahul Kumar',
        'rahul',
        'rahul@example.com',
        passwordHash,
        'student',
        'RK',
        1950,
        1400,
        'Level 5',
        'Backend Developer & Cloud Enthusiast',
        'rahulkumar',
      ]
    );
    const rahulId = Number(rahulInsert.lastInsertRowid);

    const priyaInsert = execute(
      `INSERT INTO users (name, username, email, password_hash, role, avatar, xp, points, rank, bio, github_username)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        'Priya Sharma',
        'priya',
        'priya@example.com',
        passwordHash,
        'student',
        'PS',
        2100,
        1600,
        'Level 5',
        'Frontend UI/UX Specialist',
        'priyasharma',
      ]
    );
    const priyaId = Number(priyaInsert.lastInsertRowid);

    // 2. Class
    const classInsert = execute(
      `INSERT INTO classes (name, code, teacher_id, description)
       VALUES (?, ?, ?, ?);`,
      [
        'CS401: Senior Software Engineering Capstone',
        'CS401A',
        teacherId,
        'Collaborative capstone studio project course covering full lifecycle development.',
      ]
    );
    const classId = Number(classInsert.lastInsertRowid);

    // Class Members
    execute(`INSERT INTO class_members (class_id, user_id, role) VALUES (?, ?, 'teacher');`, [classId, teacherId]);
    execute(`INSERT INTO class_members (class_id, user_id, role) VALUES (?, ?, 'student');`, [classId, aryanId]);
    execute(`INSERT INTO class_members (class_id, user_id, role) VALUES (?, ?, 'student');`, [classId, rahulId]);
    execute(`INSERT INTO class_members (class_id, user_id, role) VALUES (?, ?, 'student');`, [classId, priyaId]);

    // 3. Team
    const teamInsert = execute(
      `INSERT INTO teams (name, class_id, leader_id) VALUES (?, ?, ?);`,
      ['Team Alpha', classId, aryanId]
    );
    const teamId = Number(teamInsert.lastInsertRowid);

    // Team Members
    execute(`INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'leader');`, [teamId, aryanId]);
    execute(`INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'member');`, [teamId, rahulId]);
    execute(`INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'member');`, [teamId, priyaId]);

    // 4. Projects
    const p1Insert = execute(
      `INSERT INTO projects (name, description, team_id, class_id, status, progress, goals, tags)
       VALUES (?, ?, ?, ?, 'active', 72, ?, ?);`,
      [
        'AI Interview Platform',
        'AI-powered technical interview platform for developers and recruiters.',
        teamId,
        classId,
        JSON.stringify(['Implement candidate assessment', 'Real-time coding environment', 'AI evaluation engine']),
        JSON.stringify(['React', 'Node.js', 'MongoDB', 'AI/ML']),
      ]
    );
    const p1Id = Number(p1Insert.lastInsertRowid);

    const p2Insert = execute(
      `INSERT INTO projects (name, description, team_id, class_id, status, progress, goals, tags)
       VALUES (?, ?, ?, ?, 'active', 48, ?, ?);`,
      [
        'Smart Campus',
        'A collaborative platform for managing campus services and student communities.',
        teamId,
        classId,
        JSON.stringify(['Facility reservations', 'Club discovery', 'Automated ticketing']),
        JSON.stringify(['React', 'Node.js', 'MongoDB', 'API']),
      ]
    );
    const p2Id = Number(p2Insert.lastInsertRowid);

    // 5. Milestones for Project 1
    const m1Insert = execute(
      `INSERT INTO milestones (project_id, title, description, due_date, status, xp_reward, completed_at)
       VALUES (?, ?, ?, datetime('now', '-7 days'), 'completed', 200, datetime('now', '-7 days'));`,
      [p1Id, 'Milestone 1: Architecture & Authentication', 'Setup project repo, DB schema, JWT auth']
    );
    const m1Id = Number(m1Insert.lastInsertRowid);

    const m2Insert = execute(
      `INSERT INTO milestones (project_id, title, description, due_date, status, xp_reward)
       VALUES (?, ?, ?, datetime('now', '+14 days'), 'in_progress', 300);`,
      [p1Id, 'Milestone 2: Interview Room & Code Evaluation', 'Real-time editor, runner, question bank']
    );
    const m2Id = Number(m2Insert.lastInsertRowid);

    // 6. Tasks for Project 1
    // Completed task
    execute(
      `INSERT INTO tasks (project_id, milestone_id, title, description, assigned_to_id, created_by_id, priority, deadline, task_type, status, completion_evidence, verification_status, xp_value)
       VALUES (?, ?, ?, ?, ?, ?, 'high', datetime('now', '-2 days'), 'weekly', 'Completed', ?, 'verified', 150);`,
      [
        p1Id,
        m1Id,
        'Completed authentication module',
        'Build JWT login, password hashing, and user registration endpoints.',
        aryanId,
        aryanId,
        'PR #12 merged to main with unit test coverage.',
      ]
    );

    // In Progress task
    execute(
      `INSERT INTO tasks (project_id, milestone_id, title, description, assigned_to_id, created_by_id, priority, deadline, task_type, status, verification_status, xp_value)
       VALUES (?, ?, ?, ?, ?, ?, 'urgent', datetime('now', '+3 days'), 'weekly', 'In Progress', 'none', 200);`,
      [
        p1Id,
        m2Id,
        'Implement code execution sandbox runner',
        'Secure Docker container execution for running untrusted candidate code safely.',
        rahulId,
        aryanId,
      ]
    );

    // Verification Pending task
    execute(
      `INSERT INTO tasks (project_id, milestone_id, title, description, assigned_to_id, created_by_id, priority, deadline, task_type, status, completion_evidence, verification_status, xp_value)
       VALUES (?, ?, ?, ?, ?, ?, 'medium', datetime('now', '+1 days'), 'daily', 'Verification Pending', ?, 'pending', 120);`,
      [
        p1Id,
        m2Id,
        'Build interview dashboard UI components',
        'Design interview room view, timer, problem display and candidate response area.',
        priyaId,
        aryanId,
        'Component files created in frontend/src/components/interview and pushed in commit 4f9812.',
      ]
    );

    // Planned task
    execute(
      `INSERT INTO tasks (project_id, milestone_id, title, description, assigned_to_id, created_by_id, priority, deadline, task_type, status, verification_status, xp_value)
       VALUES (?, ?, ?, ?, ?, ?, 'low', datetime('now', '+10 days'), 'monthly', 'Planned', 'none', 100);`,
      [
        p1Id,
        m2Id,
        'Integrate AI feedback scoring API',
        'Generate structured scoring and summary feedback using LLM prompt pipeline.',
        aryanId,
        aryanId,
      ]
    );

    // 7. Repositories
    const repoInsert = execute(
      `INSERT INTO repositories (project_id, repo_url, repo_name, owner, default_branch, last_synced_at)
       VALUES (?, ?, ?, ?, 'main', datetime('now', '-1 hours'));`,
      [p1Id, 'https://github.com/projecthub/ai-interviewer', 'ai-interviewer', 'projecthub']
    );
    const repoId = Number(repoInsert.lastInsertRowid);

    // 8. GitHub Activity
    execute(
      `INSERT INTO github_activities (repository_id, project_id, user_id, activity_type, title, description, commit_hash, branch, author_username, timestamp)
       VALUES (?, ?, ?, 'commit', ?, ?, 'a82e91b', 'main', 'aryanthakkar', datetime('now', '-2 hours'));`,
      [
        repoId,
        p1Id,
        aryanId,
        'feat(auth): complete authentication and RBAC security module',
        'Add JWT verify middleware, refresh tokens, and rate limits.',
      ]
    );

    execute(
      `INSERT INTO github_activities (repository_id, project_id, user_id, activity_type, title, description, pr_number, branch, author_username, timestamp)
       VALUES (?, ?, ?, 'pull_request', ?, ?, 14, 'feat/interview-ui', 'priyasharma', datetime('now', '-5 hours'));`,
      [
        repoId,
        p1Id,
        priyaId,
        'PR #14: Candidate Interview Room UI Component layout',
        'Adds responsive layout, problem card, and answer submission box.',
      ]
    );

    // 9. Contributions
    execute(
      `INSERT INTO contributions (user_id, project_id, activity_type, points, xp, description, recorded_at)
       VALUES (?, ?, 'task_completion', 150, 150, 'Completed authentication module', datetime('now', '-2 hours'));`,
      [aryanId, p1Id]
    );

    execute(
      `INSERT INTO contributions (user_id, project_id, activity_type, points, xp, description, recorded_at)
       VALUES (?, ?, 'code_contribution', 120, 120, 'Contributed to Smart Campus API endpoints', datetime('now', '-1 days'));`,
      [aryanId, p2Id]
    );

    execute(
      `INSERT INTO contributions (user_id, project_id, activity_type, points, xp, description, recorded_at)
       VALUES (?, ?, 'arena_challenge', 200, 200, 'Earned Weekly Arena XP for debugging session', datetime('now', '-2 days'));`,
      [aryanId, p1Id]
    );

    // 10. Achievements
    execute(
      `INSERT INTO achievements (user_id, title, badge_icon, description, xp_reward)
       VALUES (?, 'Bug Hunter', '🐛', 'Resolved 5 verified issues in project repositories', 100);`,
      [aryanId]
    );
    execute(
      `INSERT INTO achievements (user_id, title, badge_icon, description, xp_reward)
       VALUES (?, 'Builder', '🔧', 'Created 3 modular full-stack features', 150);`,
      [aryanId]
    );
    execute(
      `INSERT INTO achievements (user_id, title, badge_icon, description, xp_reward)
       VALUES (?, 'Team Player', '🤝', 'Collaborated on cross-functional tasks across 2 milestones', 100);`,
      [aryanId]
    );

    // 11. Chat Channels for Project 1
    const generalChannel = execute(
      `INSERT INTO chat_channels (project_id, name, slug, icon) VALUES (?, 'General', 'general', '💬');`,
      [p1Id]
    );
    const devChannel = execute(
      `INSERT INTO chat_channels (project_id, name, slug, icon) VALUES (?, 'Development', 'development', '💻');`,
      [p1Id]
    );
    execute(`INSERT INTO chat_channels (project_id, name, slug, icon) VALUES (?, 'AI / ML', 'ai', '🤖');`, [p1Id]);
    execute(`INSERT INTO chat_channels (project_id, name, slug, icon) VALUES (?, 'Tasks', 'tasks', '✓');`, [p1Id]);
    execute(
      `INSERT INTO chat_channels (project_id, name, slug, icon) VALUES (?, 'Announcements', 'announcements', '📢');`,
      [p1Id]
    );

    const generalChanId = Number(generalChannel.lastInsertRowid);

    // Chat messages matching the frontend ChatWindow.jsx
    execute(
      `INSERT INTO chat_messages (channel_id, sender_id, message, created_at)
       VALUES (?, ?, 'Welcome to the AI Interview Platform project group! 🚀', datetime('now', '-40 minutes'));`,
      [generalChanId, aryanId]
    );
    execute(
      `INSERT INTO chat_messages (channel_id, sender_id, message, created_at)
       VALUES (?, ?, 'I have started working on the backend API. I will push the authentication routes soon.', datetime('now', '-35 minutes'));`,
      [generalChanId, rahulId]
    );
    execute(
      `INSERT INTO chat_messages (channel_id, sender_id, message, created_at)
       VALUES (?, ?, 'Great! I will start working on the interview UI and candidate dashboard.', datetime('now', '-30 minutes'));`,
      [generalChanId, priyaId]
    );
    execute(
      `INSERT INTO chat_messages (channel_id, sender_id, message, created_at)
       VALUES (?, ?, 'Perfect. Lets keep the API structure documented here so everyone can follow along.', datetime('now', '-25 minutes'));`,
      [generalChanId, aryanId]
    );

    // 12. Notifications
    execute(
      `INSERT INTO notifications (user_id, title, message, type, is_read)
       VALUES (?, 'Welcome to ProjNaN', 'Your account is ready. Join your class with your class code.', 'system', 0);`,
      [aryanId]
    );
    execute(
      `INSERT INTO notifications (user_id, title, message, type, is_read)
       VALUES (?, 'Milestone 1 Completed', 'Your team completed Milestone 1: Architecture & Authentication (+200 XP)', 'milestone', 0);`,
      [aryanId]
    );

    // 13. Arena Challenges
    execute(
      `INSERT INTO arena_challenges (title, description, xp_reward, tag, difficulty)
       VALUES ('Fix a project issue', 'Debug and submit a solution with verified evidence or pull request', 200, 'Debugging', 'Medium');`
    );
    execute(
      `INSERT INTO arena_challenges (title, description, xp_reward, tag, difficulty)
       VALUES ('Improve existing code', 'Refactor a project component for modularity and testability', 150, 'Refactor', 'Easy');`
    );
    execute(
      `INSERT INTO arena_challenges (title, description, xp_reward, tag, difficulty)
       VALUES ('Help another developer', 'Review or contribute to a peer team member pull request', 250, 'Collaboration', 'Medium');`
    );
    execute(
      `INSERT INTO arena_challenges (title, description, xp_reward, tag, difficulty)
       VALUES ('Solve the weekly challenge', 'Implement full end-to-end integration and automated tests', 300, 'Challenge', 'Hard');`
    );
  });

  console.log('Database seeding completed successfully.');
}

if (process.argv[1] === import.meta.url || process.argv[1]?.endsWith('seed.js')) {
  runSeed().catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}
