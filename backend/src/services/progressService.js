import { execute, queryAll, queryOne, transaction } from '../config/database.js';
import { projectService } from './projectService.js';

export const progressService = {
  /**
   * Idempotently record a contribution for a user.
   * If an externalId is provided (e.g. "commit:abc1234", "task:42", "pr:15"), duplicates are safely skipped.
   */
  recordContribution({ userId, projectId, taskId = null, activityType, points = 0, xp = 0, description, externalId = null, metadata = null }) {
    if (!userId || !projectId || !activityType || !description) {
      const err = new Error('Missing required contribution fields (userId, projectId, activityType, description).');
      err.statusCode = 400;
      throw err;
    }

    return transaction(() => {
      if (externalId) {
        const existing = queryOne('SELECT id FROM contributions WHERE external_id = ?;', [externalId]);
        if (existing) {
          return {
            id: existing.id,
            recorded: false,
            message: 'Contribution already recorded for this external reference.',
          };
        }
      }

      const res = execute(
        `INSERT INTO contributions (user_id, project_id, task_id, activity_type, points, xp, description, external_id, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          userId,
          projectId,
          taskId,
          activityType,
          points,
          xp,
          description.trim(),
          externalId,
          typeof metadata === 'object' && metadata !== null ? JSON.stringify(metadata) : metadata,
        ]
      );

      // Credit XP and points to user if > 0
      if (xp > 0 || points > 0) {
        execute('UPDATE users SET xp = xp + ?, points = points + ? WHERE id = ?;', [xp, points, userId]);
      }

      return {
        id: Number(res.lastInsertRowid),
        recorded: true,
        xpAwarded: xp,
        pointsAwarded: points,
      };
    });
  },

  getUserDashboard(userId) {
    const user = queryOne(
      'SELECT id, name, username, email, role, avatar, xp, points, rank, bio, github_username FROM users WHERE id = ?;',
      [userId]
    );

    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    // Projects user is involved in
    const projects = projectService.getUserProjects(userId);

    // Calculate user ranking in class/global
    const totalStudents = queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'student';")?.count || 1;
    let communityRank = '#1';
    let communityTier = 'Top 10%';

    if (user.role === 'teacher') {
      communityRank = 'Faculty';
      communityTier = 'Instructor';
    } else {
      const rankResult = queryOne(
        `SELECT COUNT(*) + 1 as rank FROM users WHERE role = 'student' AND (xp > ? OR (xp = ? AND points > ?));`,
        [user.xp, user.xp, user.points]
      );
      const rank = rankResult?.rank || 1;
      communityRank = `#${rank}`;
      const pct = Math.max(1, Math.min(100, Math.round((rank / Math.max(1, totalStudents)) * 100)));
      communityTier = `Top ${pct}%`;
    }

    // Weekly contribution metrics (past 7 days)
    const weeklyRow = queryOne(
      `SELECT COALESCE(SUM(xp), 0) as weekly_xp, COALESCE(SUM(points), 0) as weekly_points
       FROM contributions
       WHERE user_id = ? AND recorded_at >= datetime('now', '-7 days');`,
      [userId]
    );
    const weeklyXp = Number(weeklyRow?.weekly_xp || 0);
    const weeklyPoints = Number(weeklyRow?.weekly_points || 0);
    const weeklyXpText = weeklyXp > 0 ? `+${weeklyXp} this week` : '0 this week';
    const weeklyPointsText = weeklyPoints > 0 ? `+${weeklyPoints} pts this week` : '0 pts this week';

    // Completed tasks count
    const completedTasksRow = queryOne(
      `SELECT COUNT(*) as count FROM tasks WHERE (assigned_to_id = ? OR created_by_id = ?) AND status = 'Completed';`,
      [userId, userId]
    );
    const completedTaskCount = completedTasksRow?.count || 0;

    // Recent Contributions / Activities
    const recentActivities = queryAll(
      `SELECT c.id, c.activity_type, c.points, c.xp, c.description, c.external_id, c.recorded_at,
              p.name as project_name
       FROM contributions c
       LEFT JOIN projects p ON c.project_id = p.id
       WHERE c.user_id = ?
       ORDER BY c.recorded_at DESC
       LIMIT 10;`,
      [userId]
    );

    // Active tasks assigned to user
    const pendingTasks = queryAll(
      `SELECT t.*, p.name as project_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE (t.assigned_to_id = ? OR t.created_by_id = ?) AND t.status != 'Completed'
       ORDER BY t.deadline ASC, t.created_at DESC;`,
      [userId, userId]
    );

    return {
      user: {
        ...user,
        communityRank,
        communityTier,
      },
      stats: {
        totalXp: user.xp,
        contributionPoints: user.points,
        weeklyXp,
        weeklyPoints,
        weeklyXpText,
        weeklyPointsText,
        projectCount: projects.length,
        activeProjectCount: projects.filter((p) => p.status === 'active').length,
        pendingTaskCount: pendingTasks.length,
        completedTaskCount,
        communityRank,
        communityTier,
      },
      projects,
      recentActivities,
      pendingTasks,
    };
  },

  getUserContributions(userId, { limit = 50, projectId = null, activityType = null } = {}) {
    let sql = `
      SELECT c.*, p.name as project_name
      FROM contributions c
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE c.user_id = ?
    `;
    const params = [userId];

    if (projectId) {
      sql += ' AND c.project_id = ?';
      params.push(projectId);
    }
    if (activityType) {
      sql += ' AND c.activity_type = ?';
      params.push(activityType);
    }

    sql += ' ORDER BY c.recorded_at DESC LIMIT ?;';
    params.push(limit);

    return queryAll(sql, params);
  },

  getProjectContributions(projectId, { limit = 50 } = {}) {
    return queryAll(
      `SELECT c.*, u.name as user_name, u.avatar as user_avatar, u.github_username
       FROM contributions c
       JOIN users u ON c.user_id = u.id
       WHERE c.project_id = ?
       ORDER BY c.recorded_at DESC
       LIMIT ?;`,
      [projectId, limit]
    );
  },
};
