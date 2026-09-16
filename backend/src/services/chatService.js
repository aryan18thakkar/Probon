import { execute, queryAll, queryOne } from '../config/database.js';

export const chatService = {
  getChannels(projectId) {
    return queryAll(
      `SELECT cc.*,
              (SELECT COUNT(*) FROM chat_messages WHERE channel_id = cc.id) as message_count
       FROM chat_channels cc
       WHERE cc.project_id = ?
       ORDER BY cc.id ASC;`,
      [projectId]
    );
  },

  getMessages(channelId, limit = 50) {
    const messages = queryAll(
      `SELECT cm.id, cm.channel_id, cm.sender_id, cm.message, cm.created_at,
              u.name as sender_name, u.avatar as sender_avatar
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.channel_id = ?
       ORDER BY cm.created_at ASC
       LIMIT ?;`,
      [channelId, limit]
    );

    return messages.map((m) => ({
      id: m.id,
      sender: m.sender_name,
      initials: m.sender_avatar,
      message: m.message,
      senderId: m.sender_id,
      time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  },

  sendMessage({ channelId, senderId, message }) {
    if (!channelId || !message || !message.trim()) {
      const err = new Error('Channel ID and message content are required.');
      err.statusCode = 400;
      throw err;
    }

    const result = execute(
      `INSERT INTO chat_messages (channel_id, sender_id, message)
       VALUES (?, ?, ?);`,
      [channelId, senderId, message.trim()]
    );

    const sender = queryOne('SELECT name, avatar FROM users WHERE id = ?;', [senderId]);

    return {
      id: Number(result.lastInsertRowid),
      channel_id: channelId,
      sender: sender?.name || 'You',
      initials: sender?.avatar || 'U',
      senderId,
      message: message.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  },
};
