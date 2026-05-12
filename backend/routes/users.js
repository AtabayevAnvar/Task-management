/* ============================================
   USERS ROUTES — Employees list & management
   ============================================ */

const express = require('express');
const { dbWrapper: db } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/users ──
router.get('/', authMiddleware, (req, res) => {
  const users = db.prepare(`
    SELECT id, name, email, role, initials, color, position, status, created_at
    FROM users ORDER BY id
  `).all();

  // Add task/project counts
  const result = users.map(u => {
    const tasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ?').get(u.id);
    const projects = db.prepare('SELECT COUNT(*) as count FROM project_members WHERE user_id = ?').get(u.id);
    return { ...u, tasks: tasks.count, projects: projects.count };
  });

  res.json(result);
});

// ── GET /api/users/:id ──
router.get('/:id', authMiddleware, (req, res) => {
  const user = db.prepare(`
    SELECT id, name, email, role, initials, color, position, status, created_at
    FROM users WHERE id = ?
  `).get(req.params.id);

  if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });

  const tasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ?').get(user.id);
  const projects = db.prepare('SELECT COUNT(*) as count FROM project_members WHERE user_id = ?').get(user.id);

  res.json({ ...user, tasks: tasks.count, projects: projects.count });
});

// ── PUT /api/users/:id ──
router.put('/:id', authMiddleware, (req, res) => {
  // Only admin can edit others, users can edit themselves
  if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ error: 'Ruxsat yo\'q.' });
  }

  const { name, position, email } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });

  db.prepare('UPDATE users SET name = ?, position = ?, email = ? WHERE id = ?')
    .run(name || user.name, position || user.position, email || user.email, req.params.id);

  res.json({ message: 'Yangilandi.' });
});

// ── PUT /api/users/:id/status ──
router.put('/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  if (!['online', 'offline', 'busy'].includes(status)) {
    return res.status(400).json({ error: 'Noto\'g\'ri status.' });
  }

  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Status yangilandi.' });
});

module.exports = router;
