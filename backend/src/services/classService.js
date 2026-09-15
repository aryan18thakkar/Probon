import crypto from 'crypto';
import { execute, queryAll, queryOne, transaction } from '../config/database.js';

function generateClassCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

export const classService = {
  createClass({ name, description, teacherId }) {
    if (!name || !name.trim()) {
      const err = new Error('Class name is required.');
      err.statusCode = 400;
      throw err;
    }

    let code = generateClassCode();
    // Ensure code is unique
    while (queryOne('SELECT id FROM classes WHERE code = ?;', [code])) {
      code = generateClassCode();
    }

    return transaction(() => {
      const result = execute(
        `INSERT INTO classes (name, code, teacher_id, description)
         VALUES (?, ?, ?, ?);`,
        [name.trim(), code, teacherId, description ? description.trim() : '']
      );

      const classId = Number(result.lastInsertRowid);

      // Add teacher as class member
      execute(
        `INSERT INTO class_members (class_id, user_id, role)
         VALUES (?, ?, 'teacher');`,
        [classId, teacherId]
      );

      return queryOne('SELECT * FROM classes WHERE id = ?;', [classId]);
    });
  },

  joinClass({ code, userId, role = 'student' }) {
    if (!code || !code.trim()) {
      const err = new Error('Class code is required.');
      err.statusCode = 400;
      throw err;
    }

    const normalizedCode = code.trim().toUpperCase();
    const foundClass = queryOne('SELECT * FROM classes WHERE code = ?;', [normalizedCode]);

    if (!foundClass) {
      const err = new Error('Invalid class code. No matching class found.');
      err.statusCode = 404;
      throw err;
    }

    const existingMember = queryOne(
      'SELECT id FROM class_members WHERE class_id = ? AND user_id = ?;',
      [foundClass.id, userId]
    );

    if (existingMember) {
      const err = new Error('You are already a member of this class.');
      err.statusCode = 409;
      throw err;
    }

    execute(
      `INSERT INTO class_members (class_id, user_id, role)
       VALUES (?, ?, ?);`,
      [foundClass.id, userId, role]
    );

    return foundClass;
  },

  getUserClasses(userId) {
    return queryAll(
      `SELECT DISTINCT c.id, c.name, c.code, c.description, c.teacher_id, c.created_at,
              u.name as teacher_name, COALESCE(cm.role, 'teacher') as member_role,
              (SELECT COUNT(*) FROM class_members WHERE class_id = c.id AND role = 'student') as student_count,
              (SELECT COUNT(*) FROM teams WHERE class_id = c.id) as team_count,
              (SELECT COUNT(*) FROM projects WHERE class_id = c.id) as project_count
       FROM classes c
       JOIN users u ON c.teacher_id = u.id
       LEFT JOIN class_members cm ON c.id = cm.class_id AND cm.user_id = ?
       WHERE cm.user_id = ? OR c.teacher_id = ?
       ORDER BY c.created_at DESC;`,
      [userId, userId, userId]
    );
  },

  getClassById(classId, userId) {
    const classData = queryOne(
      `SELECT c.*, u.name as teacher_name, u.email as teacher_email
       FROM classes c
       JOIN users u ON c.teacher_id = u.id
       WHERE c.id = ?;`,
      [classId]
    );

    if (!classData) {
      const err = new Error('Class not found.');
      err.statusCode = 404;
      throw err;
    }

    // Members list
    const members = queryAll(
      `SELECT u.id, u.name, u.username, u.email, u.avatar, u.role, u.xp, u.points, u.rank, cm.joined_at, cm.role as class_role
       FROM class_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.class_id = ?
       ORDER BY u.name ASC;`,
      [classId]
    );

    // Teams in this class
    const teams = queryAll(
      `SELECT t.id, t.name, t.leader_id, u.name as leader_name, t.created_at,
              (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count,
              (SELECT COUNT(*) FROM projects WHERE team_id = t.id) as project_count
       FROM teams t
       LEFT JOIN users u ON t.leader_id = u.id
       WHERE t.class_id = ?;`,
      [classId]
    );

    // Projects in this class
    const projects = queryAll(
      `SELECT p.*, t.name as team_name
       FROM projects p
       JOIN teams t ON p.team_id = t.id
       WHERE p.class_id = ?;`,
      [classId]
    );

    return {
      ...classData,
      members,
      teams,
      projects,
    };
  },

  removeStudentFromClass(classId, studentId, teacherId) {
    const classData = queryOne('SELECT teacher_id FROM classes WHERE id = ?;', [classId]);
    if (!classData) {
      const err = new Error('Class not found.');
      err.statusCode = 404;
      throw err;
    }

    if (classData.teacher_id !== teacherId) {
      const err = new Error('Only the class teacher can remove students.');
      err.statusCode = 403;
      throw err;
    }

    execute('DELETE FROM class_members WHERE class_id = ? AND user_id = ?;', [classId, studentId]);

    return { success: true, message: 'Student removed from class.' };
  },
};
