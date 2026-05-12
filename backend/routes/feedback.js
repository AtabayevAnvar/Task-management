/* ============================================
   FEEDBACK ROUTES
   ============================================ */

const express = require('express');
const { dbWrapper: db } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/feedback ──
router.get('/', authMiddleware, (req, res) => {
  const { type } = req.query;

  let sql = 'SELECT f.*, u.name as author_name FROM feedbacks f LEFT JOIN users u ON f.author_id = u.id WHERE 1=1';
  const params = [];

  if (type) { sql += ' AND f.type = ?'; params.push(type); }

  sql += ' ORDER BY f.id DESC';

  const feedbacks = db.prepare(sql).all(...params);

  res.json(feedbacks.map(f => ({
    ...f,
    author: f.anonymous ? 'Anonim' : (f.author_name || 'Noma\'lum'),
    authorId: f.anonymous ? null : f.author_id,
    date: f.created_at ? f.created_at.split(' ')[0] || f.created_at.split('T')[0] : '',
    response: f.response_text ? {
      text: f.response_text,
      author: f.response_author,
      date: f.response_date
    } : null,
  })));
});

// ── POST /api/feedback ──
router.post('/', authMiddleware, (req, res) => {
  const { type, subject, text, anonymous } = req.body;

  if (!subject || !text) {
    return res.status(400).json({ error: 'Mavzu va matn kiritilishi shart.' });
  }

  const result = db.prepare(`
    INSERT INTO feedbacks (type, subject, text, author_id, anonymous, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(type || 'idea', subject, text, anonymous ? null : req.user.id, anonymous ? 1 : 0);

  res.status(201).json({ id: result.lastInsertRowid, message: 'Fikringiz yuborildi!' });
});

// ── PUT /api/feedback/:id/respond (admin only) ──
router.put('/:id/respond', authMiddleware, requireRole('admin'), (req, res) => {
  const { response_text } = req.body;
  if (!response_text) return res.status(400).json({ error: 'Javob matni kiritilishi shart.' });

  const feedback = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(req.params.id);
  if (!feedback) return res.status(404).json({ error: 'Feedback topilmadi.' });

  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
  const date = new Date().toISOString().split('T')[0];

  db.prepare(`
    UPDATE feedbacks SET status = 'answered', response_text = ?, response_author = ?, response_date = ?
    WHERE id = ?
  `).run(response_text, user ? user.name : 'Admin', date, req.params.id);

  // Notify feedback author
  if (feedback.author_id) {
    db.prepare(`
      INSERT INTO notifications (user_id, type, icon, title, description, color)
      VALUES (?, 'feedback', '💡', 'Feedback javob', ?, 'var(--accent-500)')
    `).run(feedback.author_id, `"${feedback.subject}" ga javob berildi`);
  }

  res.json({ message: 'Javob saqlandi.' });
});

module.exports = router;
