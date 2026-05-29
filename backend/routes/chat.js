/* ============================================
   CHAT ROUTES - Rooms + Messages
   ============================================ */

const express = require('express');
const { dbWrapper: db } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function toHourMinute(value) {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toTimeString().slice(0, 5);
}

// GET /api/chat/rooms
router.get('/rooms', authMiddleware, async (req, res, next) => {
  try {
    const rooms = await db.all(
      `SELECT cr.*
       FROM chat_rooms cr
       JOIN chat_members cm ON cr.id = cm.room_id
       WHERE cm.user_id = ?
       ORDER BY cr.id`,
      req.user.id
    );

    const result = await Promise.all(
      rooms.map(async (room) => {
        const lastMsg = await db.get(
          `SELECT m.text, m.created_at, u.name as author
           FROM messages m
           JOIN users u ON m.user_id = u.id
           WHERE m.room_id = ?
           ORDER BY m.id DESC
           LIMIT 1`,
          room.id
        );

        const members = await db.all(
          `SELECT u.id, u.name, u.initials, u.color, u.status
           FROM chat_members cm
           JOIN users u ON cm.user_id = u.id
           WHERE cm.room_id = ?`,
          room.id
        );

        let directUser = null;
        if (room.type === 'direct') {
          directUser = members.find((member) => member.id !== req.user.id) || null;
        }

        return {
          ...room,
          lastMsg: lastMsg ? lastMsg.text : '',
          lastTime: lastMsg ? toHourMinute(lastMsg.created_at) : '',
          unread: 0,
          members: members.map((member) => member.id),
          memberDetails: members,
          userId: directUser ? directUser.id : null
        };
      })
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/chat/rooms/:id/messages
router.get('/rooms/:id/messages', authMiddleware, async (req, res, next) => {
  try {
    const isMember = await db.get(
      'SELECT 1 FROM chat_members WHERE room_id = ? AND user_id = ?',
      req.params.id,
      req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ error: 'Bu chatga kirishingiz mumkin emas.' });
    }

    const messages = await db.all(
      `SELECT m.*, u.name as author_name, u.initials, u.color
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.room_id = ?
       ORDER BY m.id`,
      req.params.id
    );

    res.json(messages);
  } catch (err) {
    next(err);
  }
});

// POST /api/chat/rooms/:id/messages
router.post('/rooms/:id/messages', authMiddleware, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'Xabar matni kiritilishi shart.' });
    }

    const isMember = await db.get(
      'SELECT 1 FROM chat_members WHERE room_id = ? AND user_id = ?',
      req.params.id,
      req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ error: 'Bu chatga kirishingiz mumkin emas.' });
    }

    const result = await db.run(
      'INSERT INTO messages (room_id, user_id, text) VALUES (?, ?, ?)',
      req.params.id,
      req.user.id,
      String(text).trim()
    );

    const message = await db.get(
      `SELECT m.*, u.name as author_name, u.initials, u.color
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      result.lastInsertRowid
    );

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
});

// POST /api/chat/rooms
router.post('/rooms', authMiddleware, async (req, res, next) => {
  try {
    const { name, members, type } = req.body;

    if (type === 'group' && !name) {
      return res.status(400).json({ error: 'Guruh nomi kiritilishi shart.' });
    }

    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#34d399', '#60a5fa'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const roomType = type || 'group';
    const roomResult = await db.run(
      'INSERT INTO chat_rooms (type, name, color) VALUES (?, ?, ?)',
      roomType,
      name || null,
      color
    );

    const roomId = roomResult.lastInsertRowid;

    await db.run(
      'INSERT INTO chat_members (room_id, user_id) VALUES (?, ?) ON CONFLICT (room_id, user_id) DO NOTHING RETURNING room_id',
      roomId,
      req.user.id
    );

    if (Array.isArray(members)) {
      for (const memberIdRaw of members) {
        const memberId = Number(memberIdRaw);
        if (!Number.isInteger(memberId)) {
          continue;
        }
        await db.run(
          'INSERT INTO chat_members (room_id, user_id) VALUES (?, ?) ON CONFLICT (room_id, user_id) DO NOTHING RETURNING room_id',
          roomId,
          memberId
        );
      }
    }

    res.status(201).json({ id: roomId, name: name || null, type: roomType, color });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
