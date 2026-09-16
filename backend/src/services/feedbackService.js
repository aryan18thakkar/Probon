import { execute, queryAll, queryOne, transaction } from '../config/database.js';
import { notificationService } from './notificationService.js';

export const feedbackService = {
  createFeedback({ projectId, teamId, userId = null, authorId, comment, rating = 5, type = 'teacher_review' }) {
    if (!projectId || !comment || !comment.trim()) {
      const err = new Error('Project ID and feedback comment are required.');
      err.statusCode = 400;
      throw err;
    }

    const project = queryOne('SELECT * FROM projects WHERE id = ?;', [projectId]);
    if (!project) {
      const err = new Error('Project not found.');
      err.statusCode = 404;
      throw err;
    }

    const effectiveTeamId = teamId || project.team_id;

    const res = execute(
      `INSERT INTO feedback (project_id, team_id, user_id, author_id, comment, rating, type)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        projectId,
        effectiveTeamId,
        userId || null,
        authorId,
        comment.trim(),
        Math.min(5, Math.max(1, parseInt(rating, 10) || 5)),
        type || 'teacher_review',
      ]
    );

    const feedback = this.getFeedbackById(Number(res.lastInsertRowid));

    // Notify project team members
    const teamMembers = queryAll(
      'SELECT user_id FROM team_members WHERE team_id = ? AND user_id != ?;',
      [effectiveTeamId, authorId]
    );

    for (const m of teamMembers) {
      notificationService.createNotification({
        userId: m.user_id,
        title: 'New Evaluation Feedback',
        message: `${feedback.author_name} posted a ${feedback.rating}★ review on project "${project.name}".`,
        type: 'feedback',
        metadata: { projectId, feedbackId: feedback.id },
      });
    }

    return feedback;
  },

  getFeedbackById(id) {
    return queryOne(
      `SELECT f.*,
              u_author.name as author_name,
              u_author.avatar as author_avatar,
              u_author.role as author_role,
              u_target.name as target_user_name
       FROM feedback f
       JOIN users u_author ON f.author_id = u_author.id
       LEFT JOIN users u_target ON f.user_id = u_target.id
       WHERE f.id = ?;`,
      [id]
    );
  },

  getProjectFeedback(projectId) {
    return queryAll(
      `SELECT f.*,
              u_author.name as author_name,
              u_author.avatar as author_avatar,
              u_author.role as author_role,
              u_target.name as target_user_name
       FROM feedback f
       JOIN users u_author ON f.author_id = u_author.id
       LEFT JOIN users u_target ON f.user_id = u_target.id
       WHERE f.project_id = ?
       ORDER BY f.created_at DESC;`,
      [projectId]
    );
  },

  deleteFeedback(feedbackId, authorId, authorRole) {
    const feedback = queryOne('SELECT * FROM feedback WHERE id = ?;', [feedbackId]);
    if (!feedback) {
      const err = new Error('Feedback entry not found.');
      err.statusCode = 404;
      throw err;
    }

    if (feedback.author_id !== authorId && authorRole !== 'teacher') {
      const err = new Error('Unauthorized to delete this feedback.');
      err.statusCode = 403;
      throw err;
    }

    execute('DELETE FROM feedback WHERE id = ?;', [feedbackId]);
    return { success: true, message: 'Feedback deleted successfully.' };
  },
};
