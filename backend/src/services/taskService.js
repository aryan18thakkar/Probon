import { execute, queryAll, queryOne, transaction } from '../config/database.js';
import { notificationService } from './notificationService.js';

function recalculateProjectProgress(projectId) {
  const stats = queryOne(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed
     FROM tasks WHERE project_id = ?;`,
    [projectId]
  );

  const total = stats?.total || 0;
  const completed = stats?.completed || 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  execute('UPDATE projects SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;', [progress, projectId]);
  return progress;
}

export const taskService = {
  createTask({
    projectId,
    milestoneId,
    title,
    description,
    assignedToId,
    priority = 'medium',
    deadline,
    taskType = 'weekly',
    xpValue = 50,
    createdById,
  }) {
    if (!projectId || !title || !title.trim()) {
      const err = new Error('Project ID and task title are required.');
      err.statusCode = 400;
      throw err;
    }

    const project = queryOne('SELECT id FROM projects WHERE id = ?;', [projectId]);
    if (!project) {
      const err = new Error('Project not found.');
      err.statusCode = 404;
      throw err;
    }

    const validPriority = ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium';
    const validTaskType = ['daily', 'weekly', 'monthly'].includes(taskType) ? taskType : 'weekly';
    const finalAssignedToId = assignedToId
      ? parseInt(assignedToId, 10)
      : (createdById ? parseInt(createdById, 10) : null);

    return transaction(() => {
      const result = execute(
        `INSERT INTO tasks (
          project_id, milestone_id, title, description, assigned_to_id, created_by_id,
          priority, deadline, task_type, status, xp_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Planned', ?);`,
        [
          projectId,
          milestoneId || null,
          title.trim(),
          description ? description.trim() : '',
          finalAssignedToId,
          createdById,
          validPriority,
          deadline || null,
          validTaskType,
          xpValue,
        ]
      );

      const taskId = Number(result.lastInsertRowid);
      recalculateProjectProgress(projectId);

      // If assigned to someone, notify them
      if (finalAssignedToId && finalAssignedToId !== createdById) {
        execute(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES (?, 'New Task Assigned', ?, 'system');`,
          [finalAssignedToId, `You have been assigned task: "${title.trim()}"`]
        );
      }

      return this.getTaskById(taskId);
    });
  },

  getTaskById(taskId) {
    const task = queryOne(
      `SELECT t.*,
              p.name as project_name,
              m.title as milestone_title,
              u_assigned.name as assigned_to_name,
              u_assigned.avatar as assigned_to_avatar,
              u_created.name as created_by_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN milestones m ON t.milestone_id = m.id
       LEFT JOIN users u_assigned ON t.assigned_to_id = u_assigned.id
       LEFT JOIN users u_created ON t.created_by_id = u_created.id
       WHERE t.id = ?;`,
      [taskId]
    );

    if (!task) {
      const err = new Error('Task not found.');
      err.statusCode = 404;
      throw err;
    }

    // Attach latest verification details if any
    const verification = queryOne(
      `SELECT tv.*, u.name as verified_by_name
       FROM task_verifications tv
       LEFT JOIN users u ON tv.verified_by_id = u.id
       WHERE tv.task_id = ?
       ORDER BY tv.created_at DESC LIMIT 1;`,
      [taskId]
    );

    return {
      ...task,
      verification: verification || null,
    };
  },

  getTasks({ projectId, assignedToId, userId, userProjectTasks, status, taskType, priority, milestoneId } = {}) {
    let sql = `
      SELECT t.*,
             p.name as project_name,
             m.title as milestone_title,
             u_assigned.name as assigned_to_name,
             u_assigned.avatar as assigned_to_avatar
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN milestones m ON t.milestone_id = m.id
      LEFT JOIN users u_assigned ON t.assigned_to_id = u_assigned.id
      WHERE 1=1
    `;
    const params = [];

    if (projectId) {
      sql += ' AND t.project_id = ?';
      params.push(projectId);
    }
    if (assignedToId) {
      sql += ' AND t.assigned_to_id = ?';
      params.push(assignedToId);
    }
    if (userId) {
      sql += ' AND (t.assigned_to_id = ? OR t.created_by_id = ?)';
      params.push(userId, userId);
    }
    if (userProjectTasks) {
      sql += ` AND t.project_id IN (
        SELECT p.id FROM projects p
        JOIN team_members tm ON p.team_id = tm.team_id
        WHERE tm.user_id = ?
        UNION
        SELECT p.id FROM projects p
        JOIN classes c ON p.class_id = c.id
        WHERE c.teacher_id = ?
      )`;
      params.push(userProjectTasks, userProjectTasks);
    }
    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }
    if (taskType) {
      sql += ' AND t.task_type = ?';
      params.push(taskType);
    }
    if (priority) {
      sql += ' AND t.priority = ?';
      params.push(priority);
    }
    if (milestoneId) {
      sql += ' AND t.milestone_id = ?';
      params.push(milestoneId);
    }

    sql += " ORDER BY CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, t.deadline ASC, t.created_at DESC;";

    return queryAll(sql, params);
  },

  updateTask(taskId, updates, userId) {
    const existing = queryOne('SELECT * FROM tasks WHERE id = ?;', [taskId]);
    if (!existing) {
      const err = new Error('Task not found.');
      err.statusCode = 404;
      throw err;
    }

    const {
      title,
      description,
      assignedToId,
      milestoneId,
      priority,
      deadline,
      taskType,
      status,
      completionEvidence,
      verificationStatus,
    } = updates;

    const validStatus = ['Planned', 'In Progress', 'Verification Pending', 'Completed'].includes(status)
      ? status
      : existing.status;

    return transaction(() => {
      execute(
        `UPDATE tasks
         SET title = ?,
             description = ?,
             assigned_to_id = ?,
             milestone_id = ?,
             priority = ?,
             deadline = ?,
             task_type = ?,
             status = ?,
             completion_evidence = ?,
             verification_status = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?;`,
        [
          title !== undefined ? title.trim() : existing.title,
          description !== undefined ? description.trim() : existing.description,
          assignedToId !== undefined ? assignedToId : existing.assigned_to_id,
          milestoneId !== undefined ? milestoneId : existing.milestone_id,
          priority !== undefined ? priority : existing.priority,
          deadline !== undefined ? deadline : existing.deadline,
          taskType !== undefined ? taskType : existing.task_type,
          validStatus,
          completionEvidence !== undefined ? completionEvidence : existing.completion_evidence,
          verificationStatus !== undefined ? verificationStatus : existing.verification_status,
          taskId,
        ]
      );

      // If status changed to Completed and was not completed before
      if (validStatus === 'Completed' && existing.status !== 'Completed') {
        const beneficiaryId = existing.assigned_to_id || userId;
        if (beneficiaryId) {
          execute('UPDATE users SET xp = xp + ?, points = points + ? WHERE id = ?;', [
            existing.xp_value,
            existing.xp_value,
            beneficiaryId,
          ]);

          execute(
            `INSERT INTO contributions (user_id, project_id, task_id, activity_type, points, xp, description, external_id)
             VALUES (?, ?, ?, 'task_completion', ?, ?, ?, ?);`,
            [
              beneficiaryId,
              existing.project_id,
              taskId,
              existing.xp_value,
              existing.xp_value,
              `Completed task: ${existing.title}`,
              `task:${taskId}`,
            ]
          );
        }
      }

      recalculateProjectProgress(existing.project_id);
      return this.getTaskById(taskId);
    });
  },

  submitEvidence(taskId, evidence, userId) {
    if (!evidence || !evidence.trim()) {
      const err = new Error('Completion evidence is required.');
      err.statusCode = 400;
      throw err;
    }

    const task = queryOne('SELECT * FROM tasks WHERE id = ?;', [taskId]);
    if (!task) {
      const err = new Error('Task not found.');
      err.statusCode = 404;
      throw err;
    }

    return transaction(() => {
      // 1. Analyze evidence text and match against project activities
      const trimmed = evidence.trim();
      let confidenceScore = 0.50; // base confidence for non-empty text
      let matchedActivityId = null;
      const reasons = [];

      // Keyword & length heuristic checks
      if (trimmed.length > 30) {
        confidenceScore += 0.15;
        reasons.push('Detailed descriptive summary provided');
      }

      // Check for PR mentions
      const prMatch = trimmed.match(/#(\d+)/) || trimmed.match(/pull\/(\d+)/i) || trimmed.match(/pr\s*#?(\d+)/i);
      if (prMatch) {
        const prNum = parseInt(prMatch[1], 10);
        const actPr = queryOne(
          `SELECT id FROM github_activities WHERE project_id = ? AND pr_number = ? LIMIT 1;`,
          [task.project_id, prNum]
        );
        if (actPr) {
          matchedActivityId = actPr.id;
          confidenceScore += 0.25;
          reasons.push(`Verified pull request #${prNum} linked in repository`);
        } else {
          confidenceScore += 0.10;
          reasons.push(`Pull request #${prNum} referenced`);
        }
      }

      // Check for commit hash mentions (7 to 40 hex chars)
      const commitMatch = trimmed.match(/\b([0-9a-f]{7,40})\b/i);
      if (commitMatch) {
        const hashPrefix = commitMatch[1];
        const actCommit = queryOne(
          `SELECT id FROM github_activities WHERE project_id = ? AND commit_hash LIKE ? LIMIT 1;`,
          [task.project_id, `${hashPrefix}%`]
        );
        if (actCommit) {
          matchedActivityId = matchedActivityId || actCommit.id;
          confidenceScore += 0.25;
          reasons.push(`Verified commit ${hashPrefix.substring(0, 7)} matches project repository`);
        } else {
          confidenceScore += 0.10;
          reasons.push(`Commit hash ${hashPrefix.substring(0, 7)} cited`);
        }
      }

      // Check for test / verification pass keywords
      if (/passed|100%|test\s*pass|success|deploy|verified/i.test(trimmed)) {
        confidenceScore += 0.10;
        reasons.push('Testing / verification outcome specified');
      }

      // Cap confidence score between 0.20 and 0.98
      const finalConfidence = Math.min(0.98, Math.max(0.20, Math.round(confidenceScore * 100) / 100));
      const explanation = reasons.length > 0
        ? `AI Verification (${Math.round(finalConfidence * 100)}%): ${reasons.join('; ')}.`
        : `AI Verification (${Math.round(finalConfidence * 100)}%): Basic completion note submitted.`;

      // Update task status
      execute(
        `UPDATE tasks
         SET status = 'Verification Pending',
             completion_evidence = ?,
             verification_status = 'pending',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?;`,
        [trimmed, taskId]
      );

      // Record or update task_verifications record
      execute(
        `INSERT INTO task_verifications (task_id, activity_id, confidence_score, explanation, verification_state, suggested_evidence)
         VALUES (?, ?, ?, ?, 'suggested', ?);`,
        [taskId, matchedActivityId, finalConfidence, explanation, trimmed]
      );

      return this.getTaskById(taskId);
    });
  },

  confirmVerification(taskId, { approved, feedbackNote }, teacherId) {
    const task = queryOne('SELECT * FROM tasks WHERE id = ?;', [taskId]);
    if (!task) {
      const err = new Error('Task not found.');
      err.statusCode = 404;
      throw err;
    }

    return transaction(() => {
      const isApproved = approved === true || approved === 'true';
      const newState = isApproved ? 'confirmed' : 'rejected';
      const newStatus = isApproved ? 'Completed' : 'In Progress';
      const newVerificationStatus = isApproved ? 'verified' : 'rejected';

      // Update task
      execute(
        `UPDATE tasks
         SET status = ?,
             verification_status = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?;`,
        [newStatus, newVerificationStatus, taskId]
      );

      // Update latest verification record
      execute(
        `UPDATE task_verifications
         SET verification_state = ?,
             verified_by_id = ?,
             explanation = COALESCE(?, explanation),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = (
           SELECT id FROM task_verifications WHERE task_id = ? ORDER BY created_at DESC LIMIT 1
         );`,
        [newState, teacherId, feedbackNote || null, taskId]
      );

      // If approved, award XP/points and contribution if not already completed
      if (isApproved && task.status !== 'Completed') {
        const beneficiaryId = task.assigned_to_id || teacherId;
        if (beneficiaryId) {
          execute('UPDATE users SET xp = xp + ?, points = points + ? WHERE id = ?;', [
            task.xp_value,
            task.xp_value,
            beneficiaryId,
          ]);

          execute(
            `INSERT INTO contributions (user_id, project_id, task_id, activity_type, points, xp, description, external_id)
             VALUES (?, ?, ?, 'task_completion', ?, ?, ?, ?);`,
            [
              beneficiaryId,
              task.project_id,
              taskId,
              task.xp_value,
              task.xp_value,
              `Verified & completed task: ${task.title}`,
              `task:${taskId}`,
            ]
          );

          notificationService.createNotification({
            userId: beneficiaryId,
            title: isApproved ? 'Task Verification Approved' : 'Task Verification Rejected',
            message: isApproved
              ? `Your evidence for task "${task.title}" was verified (+${task.xp_value} XP).`
              : `Your evidence for task "${task.title}" was rejected: ${feedbackNote || 'Needs revision'}.`,
            type: 'task_verification',
            metadata: { taskId, approved: isApproved, feedbackNote },
          });
        }
      }

      recalculateProjectProgress(task.project_id);
      return this.getTaskById(taskId);
    });
  },

  deleteTask(taskId) {
    const task = queryOne('SELECT project_id FROM tasks WHERE id = ?;', [taskId]);
    if (!task) {
      const err = new Error('Task not found.');
      err.statusCode = 404;
      throw err;
    }

    return transaction(() => {
      execute('DELETE FROM tasks WHERE id = ?;', [taskId]);
      recalculateProjectProgress(task.project_id);
      return { success: true, message: 'Task deleted successfully.' };
    });
  },
};
