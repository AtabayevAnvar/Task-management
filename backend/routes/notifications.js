/* ============================================
   NOTIFICATIONS ROUTES
   ============================================ */

const express = require('express');
const { dbWrapper: db } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const notifications = await db.all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC',
      req.user.id
    );

    res.json(
      notifications.map((item) => ({
        ...item,
        read: Boolean(item.read),
        desc: item.description,
        time: getRelativeTime(item.created_at)
      }))
    );
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authMiddleware, async (req, res, next) => {
  try {
    await db.run(
      'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?',
      req.params.id,
      req.user.id
    );
    res.json({ message: 'Oqildi.' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', authMiddleware, async (req, res, next) => {
  try {
    await db.run('UPDATE notifications SET read = 1 WHERE user_id = ?', req.user.id);
    res.json({ message: 'Hammasi oqildi.' });
  } catch (err) {
    next(err);
  }
});

function getRelativeTime(value) {
  if (!value) {
    return '';
  }

  const now = new Date();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'hozirgina';
  if (diffMin < 60) return `${diffMin} daqiqa oldin`;
  if (diffHr < 24) return `${diffHr} soat oldin`;
  if (diffDay < 7) return `${diffDay} kun oldin`;
  return date.toISOString().slice(0, 10);
}

module.exports = router;
