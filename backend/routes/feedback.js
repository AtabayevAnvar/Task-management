/* ============================================
   FEEDBACK ROUTES
   ============================================ */

const express = require('express');
const { dbWrapper: db } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

function formatDateOnly(value) {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

// GET /api/feedback
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { type } = req.query;

    let sql = `
      SELECT f.*, u.name as author_name
      FROM feedbacks f
      LEFT JOIN users u ON f.author_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      sql += ' AND f.type = ?';
      params.push(type);
    }

    sql += ' ORDER BY f.id DESC';

    const feedbacks = await db.all(sql, ...params);

    res.json(
      feedbacks.map((feedback) => ({
        ...feedback,
        author: feedback.anonymous ? 'Anonim' : feedback.author_name || "Nomalum",
        authorId: feedback.anonymous ? null : feedback.author_id,
        date: formatDateOnly(feedback.created_at),
        response: feedback.response_text
          ? {
              text: feedback.response_text,
              author: feedback.response_author,
              date: feedback.response_date
            }
          : null
      }))
    );
  } catch (err) {
    next(err);
  }
});

// POST /api/feedback
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { type, subject, text, anonymous } = req.body;

    if (!subject || !text) {
      return res.status(400).json({ error: 'Mavzu va matn kiritilishi shart.' });
    }

    const result = await db.run(
      `INSERT INTO feedbacks (type, subject, text, author_id, anonymous, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      type || 'idea',
      subject,
      text,
      anonymous ? null : req.user.id,
      anonymous ? 1 : 0
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Fikringiz yuborildi!' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/feedback/:id/respond (admin only)
router.put('/:id/respond', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const { response_text } = req.body;
    if (!response_text) {
      return res.status(400).json({ error: 'Javob matni kiritilishi shart.' });
    }

    const feedback = await db.get('SELECT * FROM feedbacks WHERE id = ?', req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback topilmadi.' });
    }

    const user = await db.get('SELECT name FROM users WHERE id = ?', req.user.id);
    const responseDate = new Date().toISOString().slice(0, 10);

    await db.run(
      `UPDATE feedbacks
       SET status = 'answered', response_text = ?, response_author = ?, response_date = ?
       WHERE id = ?`,
      response_text,
      user ? user.name : 'Admin',
      responseDate,
      req.params.id
    );

    if (feedback.author_id) {
      await db.run(
        `INSERT INTO notifications (user_id, type, icon, title, description, color)
         VALUES (?, 'feedback', '\u{1F4A1}', 'Feedback javob', ?, 'var(--accent-500)')`,
        feedback.author_id,
        `"${feedback.subject}" ga javob berildi`
      );
    }

    res.json({ message: 'Javob saqlandi.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
