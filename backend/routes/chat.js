/* ============================================
   CHAT ROUTES — Rooms + Messages
   ============================================ */

const express = require('express');
const { dbWrapper: db } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/chat/rooms ──
router.get('/rooms', authMiddleware, (req, res) => {
  // Get rooms where user is a member
  const rooms = db.prepare(`
    SELECT cr.* FROM chat_rooms cr
    JOIN chat_members cm ON cr.id = cm.room_id
    WHERE cm.user_id = ?
    ORDER BY cr.id
  `).all(req.user.id);

  const result = rooms.map(room => {
    // Get last message
    const lastMsg = db.prepare(`
      SELECT m.text, m.created_at, u.name as author
      FROM messages m JOIN users u ON m.user_id = u.id
      WHERE m.room_id = ?
      ORDER BY m.id DESC LIMIT 1
    `).get(room.id);

    // Get unread count (simplified — all messages after last seen)
    const totalMsgs = db.prepare('SELECT COUNT(*) as count FROM messages WHERE room_id = ?').get(room.id);

    // Get members
    const members = db.prepare(`
      SELECT u.id, u.name, u.initials, u.color, u.status
      FROM chat_members cm JOIN users u ON cm.user_id = u.id
      WHERE cm.room_id = ?
    `).all(room.id);

    // For direct chats, get the other user
    let directUser = null;
    if (room.type === 'direct') {
      directUser = members.find(m => m.id !== req.user.id) || null;
    }

    return {
      ...room,
      lastMsg: lastMsg ? lastMsg.text : '',
      lastTime: lastMsg ? lastMsg.created_at.split(' ')[1]?.slice(0, 5) || '' : '',
      unread: 0,
      members: members.map(m => m.id),
      memberDetails: members,
      userId: directUser ? directUser.id : null,
    };
  });

  res.json(result);
});

// ── GET /api/chat/rooms/:id/messages ──
router.get('/rooms/:id/messages', authMiddleware, (req, res) => {
  // Check if user is member
  const isMember = db.prepare('SELECT * FROM chat_members WHERE room_id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!isMember) return res.status(403).json({ error: 'Bu chatga kirishingiz mumkin emas.' });

  const messages = db.prepare(`
    SELECT m.*, u.name as author_name, u.initials, u.color
    FROM messages m JOIN users u ON m.user_id = u.id
    WHERE m.room_id = ?
    ORDER BY m.id
  `).all(req.params.id);

  res.json(messages);
});

// ── POST /api/chat/rooms/:id/messages ──
router.post('/rooms/:id/messages', authMiddleware, (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Xabar matni kiritilishi shart.' });

  // Check membership
  const isMember = db.prepare('SELECT * FROM chat_members WHERE room_id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!isMember) return res.status(403).json({ error: 'Bu chatga kirishingiz mumkin emas.' });

  const now = new Date();
  const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;

  const result = db.prepare('INSERT INTO messages (room_id, user_id, text, created_at) VALUES (?, ?, ?, ?)')
    .run(req.params.id, req.user.id, text.trim(), timestamp);

  const message = db.prepare(`
    SELECT m.*, u.name as author_name, u.initials, u.color
    FROM messages m JOIN users u ON m.user_id = u.id
    WHERE m.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(message);
});

// ── POST /api/chat/rooms (create group) ──
router.post('/rooms', authMiddleware, (req, res) => {
  const { name, members, type } = req.body;

  if (type === 'group' && !name) {
    return res.status(400).json({ error: 'Guruh nomi kiritilishi shart.' });
  }

  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#34d399', '#60a5fa'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  const result = db.prepare('INSERT INTO chat_rooms (type, name, color) VALUES (?, ?, ?)')
    .run(type || 'group', name || null, color);

  const roomId = result.lastInsertRowid;

  // Add creator as member
  db.prepare('INSERT INTO chat_members (room_id, user_id) VALUES (?, ?)').run(roomId, req.user.id);

  // Add other members
  if (members && Array.isArray(members)) {
    const insertMember = db.prepare('INSERT OR IGNORE INTO chat_members (room_id, user_id) VALUES (?, ?)');
    for (const memberId of members) {
      insertMember.run(roomId, memberId);
    }
  }

  res.status(201).json({ id: roomId, name, type: type || 'group', color });
});

module.exports = router;
