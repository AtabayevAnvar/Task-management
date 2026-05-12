/* ============================================
   NOTIFICATIONS ROUTES
   ============================================ */

const express = require('express');
const { dbWrapper: db } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/notifications ──
router.get('/', authMiddleware, (req, res) => {
  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC
  `).all(req.user.id);

  res.json(notifications.map(n => ({
    ...n,
    read: !!n.read,
    desc: n.description,
    time: getRelativeTime(n.created_at)
  })));
});

// ── PUT /api/notifications/:id/read ──
router.put('/:id/read', authMiddleware, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);
  res.json({ message: 'O\'qildi.' });
});

// ── PUT /api/notifications/read-all ──
router.put('/read-all', authMiddleware, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?')
    .run(req.user.id);
  res.json({ message: 'Hammasi o\'qildi.' });
});

// Helper: relative time
function getRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'hozirgina';
  if (diffMin < 60) return `${diffMin} daqiqa oldin`;
  if (diffHr < 24) return `${diffHr} soat oldin`;
  if (diffDay < 7) return `${diffDay} kun oldin`;
  return dateStr.split(' ')[0] || dateStr;
}

module.exports = router;
