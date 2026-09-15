import { execute, queryAll, queryOne, transaction } from '../config/database.js';

export const gamificationService = {
  getArenaChallenges(userId) {
    // Ensure challenges exist
    const count = queryOne('SELECT COUNT(*) as count FROM arena_challenges;')?.count || 0;
    if (count === 0) {
      execute(
        `INSERT INTO arena_challenges (title, description, xp_reward, tag, difficulty) VALUES
         ('Fix a project issue', 'Debug and submit a solution with verified evidence or pull request', 200, 'Debugging', 'Medium'),
         ('Improve existing code', 'Refactor a project component for modularity and testability', 150, 'Refactor', 'Easy'),
         ('Help another developer', 'Review or contribute to a peer team member pull request', 250, 'Collaboration', 'Medium'),
         ('Solve the weekly challenge', 'Implement full end-to-end integration and automated tests', 300, 'Challenge', 'Hard');`
      );
    }

    const challenges = queryAll(
      `SELECT ac.*,
              COALESCE(uc.status, 'available') as user_status,
              uc.evidence,
              uc.completed_at
       FROM arena_challenges ac
       LEFT JOIN user_challenges uc ON ac.id = uc.challenge_id AND uc.user_id = ?
       ORDER BY ac.xp_reward ASC;`,
      [userId]
    );

    return challenges;
  },

  acceptChallenge(userId, challengeId) {
    const challenge = queryOne('SELECT * FROM arena_challenges WHERE id = ?;', [challengeId]);
    if (!challenge) {
      const err = new Error('Challenge not found.');
      err.statusCode = 404;
      throw err;
    }

    execute(
      `INSERT INTO user_challenges (user_id, challenge_id, status)
       VALUES (?, ?, 'accepted')
       ON CONFLICT(user_id, challenge_id) DO UPDATE SET status = 'accepted';`,
      [userId, challengeId]
    );

    return { success: true, message: `Accepted challenge: ${challenge.title}` };
  },

  completeChallenge(userId, challengeId, evidence = '') {
    const challenge = queryOne('SELECT * FROM arena_challenges WHERE id = ?;', [challengeId]);
    if (!challenge) {
      const err = new Error('Challenge not found.');
      err.statusCode = 404;
      throw err;
    }

    return transaction(() => {
      execute(
        `INSERT INTO user_challenges (user_id, challenge_id, status, evidence, completed_at)
         VALUES (?, ?, 'completed', ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id, challenge_id) DO UPDATE SET
           status = 'completed',
           evidence = excluded.evidence,
           completed_at = CURRENT_TIMESTAMP;`,
        [userId, challengeId, evidence]
      );

      // Award XP and points
      execute('UPDATE users SET xp = xp + ?, points = points + ? WHERE id = ?;', [
        challenge.xp_reward,
        challenge.xp_reward,
        userId,
      ]);

      // Record contribution to user's active project or system project
      const userProj = queryOne(
        `SELECT p.id FROM projects p
         LEFT JOIN team_members tm ON p.team_id = tm.team_id
         WHERE tm.user_id = ?
         LIMIT 1;`,
        [userId]
      ) || queryOne('SELECT id FROM projects LIMIT 1;');

      if (userProj) {
        execute(
          `INSERT INTO contributions (user_id, project_id, activity_type, points, xp, description, external_id)
           VALUES (?, ?, 'arena_challenge', ?, ?, ?, ?);`,
          [
            userId,
            userProj.id,
            challenge.xp_reward,
            challenge.xp_reward,
            `Completed Arena Challenge: ${challenge.title}`,
            `challenge:${challengeId}:${userId}`,
          ]
        );
      }

      const updatedUser = queryOne('SELECT id, xp, points FROM users WHERE id = ?;', [userId]);

      return {
        success: true,
        message: `Challenge completed! +${challenge.xp_reward} XP awarded!`,
        earnedXp: challenge.xp_reward,
        totalXp: updatedUser.xp,
      };
    });
  },

  getLeaderboard(limit = 10) {
    const leaderboard = queryAll(
      `SELECT u.id, u.name, u.username, u.avatar, u.role, u.xp, u.points, u.rank,
              (SELECT COUNT(*) FROM user_challenges WHERE user_id = u.id AND status = 'completed') as challenges_completed,
              (SELECT COUNT(*) FROM contributions WHERE user_id = u.id) as contribution_count
       FROM users u
       WHERE u.role = 'student'
       ORDER BY u.xp DESC, u.points DESC
       LIMIT ?;`,
      [limit]
    );

    return leaderboard.map((user, idx) => ({
      ...user,
      position: idx + 1,
    }));
  },
};
