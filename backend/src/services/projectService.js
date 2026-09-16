import { execute, queryAll, queryOne, transaction } from '../config/database.js';

export const projectService = {
  createProject({ name, description, teamId, classId, goals = [], tags = [], userId, userRole }) {
    if (!name || !name.trim()) {
      const err = new Error('Project name is required.');
      err.statusCode = 400;
      throw err;
    }
    if (!classId) {
      const err = new Error('Class ID is required.');
      err.statusCode = 400;
      throw err;
    }
    if (!teamId) {
      const err = new Error('Team ID is required.');
      err.statusCode = 400;
      throw err;
    }

    // Verify class exists
    const classData = queryOne('SELECT id, name, teacher_id FROM classes WHERE id = ?;', [classId]);
    if (!classData) {
      const err = new Error('Selected class does not exist.');
      err.statusCode = 404;
      throw err;
    }

    // Verify team exists
    const teamData = queryOne('SELECT id, name, class_id FROM teams WHERE id = ?;', [teamId]);
    if (!teamData) {
      const err = new Error('Selected team does not exist.');
      err.statusCode = 404;
      throw err;
    }

    // Verify team belongs to the selected class
    if (Number(teamData.class_id) !== Number(classId)) {
      const err = new Error('The selected team does not belong to the selected class.');
      err.statusCode = 400;
      throw err;
    }

    // Authorization & Membership
    if (userId) {
      const user = queryOne('SELECT id, role FROM users WHERE id = ?;', [userId]);
      const role = userRole || user?.role;

      if (role === 'teacher') {
        if (Number(classData.teacher_id) !== Number(userId)) {
          const isMember = queryOne('SELECT id FROM class_members WHERE class_id = ? AND user_id = ?;', [classId, userId]);
          if (!isMember) {
            const err = new Error('You are not authorized to create projects for this class.');
            err.statusCode = 403;
            throw err;
          }
        }
      } else {
        // Student: must be enrolled in class or in team
        const isTeamMember = queryOne('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?;', [teamId, userId]);
        const isClassMember = queryOne('SELECT id FROM class_members WHERE class_id = ? AND user_id = ?;', [classId, userId]);

        if (!isTeamMember && !isClassMember) {
          const err = new Error('You must belong to this class or team to create a project.');
          err.statusCode = 403;
          throw err;
        }

        // If student is in the class but not yet registered in team_members, associate them
        if (!isTeamMember && isClassMember) {
          execute(
            `INSERT OR IGNORE INTO team_members (team_id, user_id, role) VALUES (?, ?, 'member');`,
            [teamId, userId]
          );
        }
      }
    }

    return transaction(() => {
      const result = execute(
        `INSERT INTO projects (name, description, team_id, class_id, status, progress, goals, tags)
         VALUES (?, ?, ?, ?, 'active', 0, ?, ?);`,
        [
          name.trim(),
          description ? description.trim() : '',
          teamId,
          classId,
          JSON.stringify(Array.isArray(goals) ? goals : []),
          JSON.stringify(Array.isArray(tags) ? tags : []),
        ]
      );

      const projectId = Number(result.lastInsertRowid);

      // Create default channels for this project
      execute(
        `INSERT INTO chat_channels (project_id, name, slug, icon) VALUES (?, 'General', 'general', '💬');`,
        [projectId]
      );
      execute(
        `INSERT INTO chat_channels (project_id, name, slug, icon) VALUES (?, 'Development', 'development', '💻');`,
        [projectId]
      );
      execute(
        `INSERT INTO chat_channels (project_id, name, slug, icon) VALUES (?, 'Tasks', 'tasks', '✓');`,
        [projectId]
      );

      return this.getProjectById(projectId);
    });
  },

  getProjectById(projectId) {
    const project = queryOne(
      `SELECT p.*, COALESCE(t.name, 'General Team') as team_name, COALESCE(c.name, 'General Class') as class_name
       FROM projects p
       LEFT JOIN teams t ON p.team_id = t.id
       LEFT JOIN classes c ON p.class_id = c.id
       WHERE p.id = ?;`,
      [projectId]
    );

    if (!project) {
      const err = new Error('Project not found.');
      err.statusCode = 404;
      throw err;
    }

    // Parse JSON fields safely
    let goals = [];
    let tags = [];
    try {
      goals = typeof project.goals === 'string' ? JSON.parse(project.goals) : (Array.isArray(project.goals) ? project.goals : []);
    } catch {
      goals = [];
    }
    try {
      tags = typeof project.tags === 'string' ? JSON.parse(project.tags) : (Array.isArray(project.tags) ? project.tags : []);
    } catch {
      tags = [];
    }
    project.goals = goals;
    project.tags = tags;

    // Milestones
    const milestones = queryAll(
      `SELECT m.*,
              (SELECT COUNT(*) FROM tasks WHERE milestone_id = m.id) as task_count,
              (SELECT COUNT(*) FROM tasks WHERE milestone_id = m.id AND status = 'Completed') as completed_task_count
       FROM milestones m
       WHERE m.project_id = ?
       ORDER BY m.created_at ASC;`,
      [projectId]
    );

    // Team members
    const members = project.team_id
      ? queryAll(
          `SELECT u.id, u.name, u.username, u.email, u.avatar, u.role, u.xp, u.points, u.rank, tm.role as team_role
           FROM team_members tm
           JOIN users u ON tm.user_id = u.id
           WHERE tm.team_id = ?
           ORDER BY tm.role DESC;`,
          [project.team_id]
        )
      : [];

    // Repository connection
    const repository = queryOne(
      'SELECT id, repo_url, repo_name, owner, default_branch, last_synced_at FROM repositories WHERE project_id = ?;',
      [projectId]
    );

    // Task counts
    const taskStats = queryOne(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
         SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
         SUM(CASE WHEN status = 'Verification Pending' THEN 1 ELSE 0 END) as verification_pending,
         SUM(CASE WHEN status = 'Planned' THEN 1 ELSE 0 END) as planned
       FROM tasks WHERE project_id = ?;`,
      [projectId]
    );

    return {
      ...project,
      milestones,
      members,
      repository,
      taskStats: {
        total: taskStats?.total || 0,
        completed: taskStats?.completed || 0,
        in_progress: taskStats?.in_progress || 0,
        verification_pending: taskStats?.verification_pending || 0,
        planned: taskStats?.planned || 0,
      },
    };
  },

  getAllProjects({ classId, search, status } = {}) {
    let sql = `
      SELECT p.*, COALESCE(t.name, 'General Team') as team_name, COALESCE(c.name, 'General Class') as class_name,
             (SELECT COUNT(*) FROM team_members WHERE team_id = p.team_id) as member_count
      FROM projects p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN classes c ON p.class_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (classId) {
      sql += ' AND p.class_id = ?';
      params.push(classId);
    }
    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY p.created_at DESC;';

    const projects = queryAll(sql, params);
    return projects.map((p) => {
      let goals = [];
      let tags = [];
      try {
        goals = typeof p.goals === 'string' ? JSON.parse(p.goals) : (Array.isArray(p.goals) ? p.goals : []);
      } catch {
        goals = [];
      }
      try {
        tags = typeof p.tags === 'string' ? JSON.parse(p.tags) : (Array.isArray(p.tags) ? p.tags : []);
      } catch {
        tags = [];
      }
      return {
        ...p,
        goals,
        tags,
      };
    });
  },

  getUserProjects(userId) {
    const user = queryOne('SELECT role FROM users WHERE id = ?;', [userId]);
    const isTeacher = user?.role === 'teacher';

    let sql = '';
    let params = [];

    if (isTeacher) {
      sql = `
        SELECT DISTINCT p.*, COALESCE(t.name, 'General Team') as team_name, c.name as class_name,
               (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
               (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'Completed') as completed_task_count
        FROM projects p
        LEFT JOIN teams t ON p.team_id = t.id
        LEFT JOIN team_members tm ON t.id = tm.team_id
        JOIN classes c ON p.class_id = c.id
        WHERE c.teacher_id = ? OR tm.user_id = ?
        ORDER BY p.updated_at DESC;
      `;
      params = [userId, userId];
    } else {
      sql = `
        SELECT DISTINCT p.*, COALESCE(t.name, 'General Team') as team_name, c.name as class_name,
               (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
               (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'Completed') as completed_task_count
        FROM projects p
        JOIN teams t ON p.team_id = t.id
        JOIN team_members tm ON t.id = tm.team_id
        JOIN classes c ON p.class_id = c.id
        WHERE tm.user_id = ?
        ORDER BY p.updated_at DESC;
      `;
      params = [userId];
    }

    const projects = queryAll(sql, params);
    return projects.map((p) => {
      let goals = [];
      let tags = [];
      try {
        goals = typeof p.goals === 'string' ? JSON.parse(p.goals) : (Array.isArray(p.goals) ? p.goals : []);
      } catch {
        goals = [];
      }
      try {
        tags = typeof p.tags === 'string' ? JSON.parse(p.tags) : (Array.isArray(p.tags) ? p.tags : []);
      } catch {
        tags = [];
      }
      return {
        ...p,
        goals,
        tags,
      };
    });
  },

  updateProject(projectId, { name, description, status, goals, tags }) {
    const existing = queryOne('SELECT * FROM projects WHERE id = ?;', [projectId]);
    if (!existing) {
      const err = new Error('Project not found.');
      err.statusCode = 404;
      throw err;
    }

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedDesc = description !== undefined ? description.trim() : existing.description;
    const updatedStatus = status !== undefined ? status : existing.status;
    const updatedGoals = goals !== undefined ? JSON.stringify(goals) : existing.goals;
    const updatedTags = tags !== undefined ? JSON.stringify(tags) : existing.tags;

    execute(
      `UPDATE projects
       SET name = ?, description = ?, status = ?, goals = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?;`,
      [updatedName, updatedDesc, updatedStatus, updatedGoals, updatedTags, projectId]
    );

    return this.getProjectById(projectId);
  },

  // Milestones
  createMilestone(projectId, { title, description, dueDate, xpReward = 100 }) {
    if (!title || !title.trim()) {
      const err = new Error('Milestone title is required.');
      err.statusCode = 400;
      throw err;
    }

    const result = execute(
      `INSERT INTO milestones (project_id, title, description, due_date, status, xp_reward)
       VALUES (?, ?, ?, ?, 'pending', ?);`,
      [projectId, title.trim(), description || '', dueDate || null, xpReward]
    );

    return queryOne('SELECT * FROM milestones WHERE id = ?;', [Number(result.lastInsertRowid)]);
  },

  updateMilestone(milestoneId, { title, description, dueDate, status }) {
    const existing = queryOne('SELECT * FROM milestones WHERE id = ?;', [milestoneId]);
    if (!existing) {
      const err = new Error('Milestone not found.');
      err.statusCode = 404;
      throw err;
    }

    const updatedTitle = title !== undefined ? title.trim() : existing.title;
    const updatedDesc = description !== undefined ? description.trim() : existing.description;
    const updatedDue = dueDate !== undefined ? dueDate : existing.due_date;
    const updatedStatus = status !== undefined ? status : existing.status;
    const completedAt = updatedStatus === 'completed' && existing.status !== 'completed' ? new Date().toISOString() : existing.completed_at;

    execute(
      `UPDATE milestones
       SET title = ?, description = ?, due_date = ?, status = ?, completed_at = ?
       WHERE id = ?;`,
      [updatedTitle, updatedDesc, updatedDue, updatedStatus, completedAt, milestoneId]
    );

    // If milestone is marked completed, award bonus XP to team members
    if (updatedStatus === 'completed' && existing.status !== 'completed') {
      const project = queryOne('SELECT team_id FROM projects WHERE id = ?;', [existing.project_id]);
      if (project) {
        const members = queryAll('SELECT user_id FROM team_members WHERE team_id = ?;', [project.team_id]);
        for (const m of members) {
          execute('UPDATE users SET xp = xp + ?, points = points + ? WHERE id = ?;', [
            existing.xp_reward,
            existing.xp_reward,
            m.user_id,
          ]);
          execute(
            `INSERT INTO contributions (user_id, project_id, activity_type, points, xp, description)
             VALUES (?, ?, 'milestone_bonus', ?, ?, ?);`,
            [m.user_id, existing.project_id, existing.xp_reward, existing.xp_reward, `Completed Milestone: ${updatedTitle}`]
          );
        }
      }
    }

    return queryOne('SELECT * FROM milestones WHERE id = ?;', [milestoneId]);
  },
};
