import { execute, queryAll, queryOne, transaction } from '../config/database.js';

export const teamService = {
  createTeam({ name, classId, leaderId }) {
    if (!name || !name.trim() || !classId) {
      const err = new Error('Team name and class ID are required.');
      err.statusCode = 400;
      throw err;
    }

    // Verify class exists
    const classData = queryOne('SELECT id FROM classes WHERE id = ?;', [classId]);
    if (!classData) {
      const err = new Error('Class not found.');
      err.statusCode = 404;
      throw err;
    }

    return transaction(() => {
      const result = execute(
        `INSERT INTO teams (name, class_id, leader_id)
         VALUES (?, ?, ?);`,
        [name.trim(), classId, leaderId]
      );

      const teamId = Number(result.lastInsertRowid);

      // Add leader to team_members
      execute(
        `INSERT INTO team_members (team_id, user_id, role)
         VALUES (?, ?, 'leader');`,
        [teamId, leaderId]
      );

      return this.getTeamById(teamId);
    });
  },

  getTeamById(teamId) {
    const team = queryOne(
      `SELECT t.*, c.name as class_name, u.name as leader_name, u.email as leader_email
       FROM teams t
       JOIN classes c ON t.class_id = c.id
       LEFT JOIN users u ON t.leader_id = u.id
       WHERE t.id = ?;`,
      [teamId]
    );

    if (!team) {
      const err = new Error('Team not found.');
      err.statusCode = 404;
      throw err;
    }

    const members = queryAll(
      `SELECT u.id, u.name, u.username, u.email, u.avatar, u.role, u.xp, u.points, u.rank, tm.role as team_role, tm.joined_at
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ?
       ORDER BY tm.role DESC, u.name ASC;`,
      [teamId]
    );

    const projects = queryAll(
      `SELECT p.* FROM projects p WHERE p.team_id = ? ORDER BY p.created_at DESC;`,
      [teamId]
    );

    return {
      ...team,
      members,
      projects,
    };
  },

  getUserTeams(userId) {
    const user = queryOne('SELECT role FROM users WHERE id = ?;', [userId]);
    const isTeacher = user?.role === 'teacher';

    if (isTeacher) {
      return queryAll(
        `SELECT t.id, t.name, t.class_id, t.leader_id, t.created_at,
                c.name as class_name, 'instructor' as member_role,
                (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count,
                (SELECT COUNT(*) FROM projects WHERE team_id = t.id) as project_count
         FROM teams t
         JOIN classes c ON t.class_id = c.id
         WHERE c.teacher_id = ?
         ORDER BY t.created_at DESC;`,
        [userId]
      );
    }

    return queryAll(
      `SELECT DISTINCT t.id, t.name, t.class_id, t.leader_id, t.created_at,
              c.name as class_name, COALESCE(tm.role, 'member') as member_role,
              (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count,
              (SELECT COUNT(*) FROM projects WHERE team_id = t.id) as project_count
       FROM teams t
       JOIN classes c ON t.class_id = c.id
       LEFT JOIN team_members tm ON t.id = tm.team_id
       LEFT JOIN class_members cm ON t.class_id = cm.class_id
       WHERE tm.user_id = ? OR cm.user_id = ?
       ORDER BY t.created_at DESC;`,
      [userId, userId]
    );
  },

  addMember({ teamId, userId, role = 'member', requesterId }) {
    const team = queryOne('SELECT * FROM teams WHERE id = ?;', [teamId]);
    if (!team) {
      const err = new Error('Team not found.');
      err.statusCode = 404;
      throw err;
    }

    // Check user exists
    const user = queryOne('SELECT id FROM users WHERE id = ?;', [userId]);
    if (!user) {
      const err = new Error('User to add not found.');
      err.statusCode = 404;
      throw err;
    }

    // Ensure user is also enrolled in the class
    const classMember = queryOne('SELECT id FROM class_members WHERE class_id = ? AND user_id = ?;', [
      team.class_id,
      userId,
    ]);
    if (!classMember) {
      execute('INSERT OR IGNORE INTO class_members (class_id, user_id, role) VALUES (?, ?, ?);', [
        team.class_id,
        userId,
        'student',
      ]);
    }

    execute(
      `INSERT OR REPLACE INTO team_members (team_id, user_id, role)
       VALUES (?, ?, ?);`,
      [teamId, userId, role]
    );

    return this.getTeamById(teamId);
  },

  removeMember({ teamId, userId, requesterId }) {
    const team = queryOne('SELECT * FROM teams WHERE id = ?;', [teamId]);
    if (!team) {
      const err = new Error('Team not found.');
      err.statusCode = 404;
      throw err;
    }

    // Cannot remove leader unless transferred
    if (team.leader_id === userId) {
      const err = new Error('Cannot remove team leader. Transfer leadership first.');
      err.statusCode = 400;
      throw err;
    }

    execute('DELETE FROM team_members WHERE team_id = ? AND user_id = ?;', [teamId, userId]);

    return { success: true, message: 'Member removed from team.' };
  },
};
