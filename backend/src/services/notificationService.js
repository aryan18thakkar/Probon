import { execute, queryAll, queryOne, transaction } from '../config/database.js';

export const notificationService = {
  createNotification({ userId, title, message, type = 'system', metadata = null }) {
    if (!userId || !title || !message) {
      const err = new Error('User ID, title, and message are required for notifications.');
      err.statusCode = 400;
      throw err;
    }

    const res = execute(
      `INSERT INTO notifications (user_id, title, message, type, metadata)
       VALUES (?, ?, ?, ?, ?);`,
      [
        userId,
        title.trim(),
        message.trim(),
        type,
        typeof metadata === 'object' && metadata !== null ? JSON.stringify(metadata) : metadata,
      ]
    );

    return this.getNotificationById(Number(res.lastInsertRowid));
  },

  getNotificationById(id) {
    return queryOne('SELECT * FROM notifications WHERE id = ?;', [id]);
  },

  getUserNotifications(userId, { unreadOnly = false, limit = 50 } = {}) {
    let sql = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [userId];

    if (unreadOnly) {
      sql += ' AND is_read = 0';
    }

    sql += ' ORDER BY created_at DESC LIMIT ?;';
    params.push(limit);

    const items = queryAll(sql, params);
    const unreadCount = queryOne(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0;',
      [userId]
    )?.count || 0;

    return {
      items,
      unreadCount,
    };
  },

  markAsRead(notificationId, userId) {
    const notif = queryOne('SELECT * FROM notifications WHERE id = ? AND user_id = ?;', [notificationId, userId]);
    if (!notif) {
      const err = new Error('Notification not found.');
      err.statusCode = 404;
      throw err;
    }

    execute('UPDATE notifications SET is_read = 1 WHERE id = ?;', [notificationId]);
    return { success: true, message: 'Notification marked as read.' };
  },

  markAllAsRead(userId) {
    execute('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0;', [userId]);
    return { success: true, message: 'All notifications marked as read.' };
  },

  deleteNotification(notificationId, userId) {
    const notif = queryOne('SELECT * FROM notifications WHERE id = ? AND user_id = ?;', [notificationId, userId]);
    if (!notif) {
      const err = new Error('Notification not found.');
      err.statusCode = 404;
      throw err;
    }

    execute('DELETE FROM notifications WHERE id = ?;', [notificationId]);
    return { success: true, message: 'Notification deleted.' };
  },
};
