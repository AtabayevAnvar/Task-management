/* ============================================
   USERS ROUTES — Employees list & management
   ============================================ */

const express = require('express');
const bcrypt = require('bcryptjs');
const { dbWrapper: db } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/users ──
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await db.all(`
      SELECT id, name, email, role, initials, color, position, status, created_at
      FROM users ORDER BY id
    `);

    // Add task/project counts
    const result = await Promise.all(users.map(async u => {
      const tasks = await db.get('SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ?', u.id);
      const projects = await db.get('SELECT COUNT(*) as count FROM project_members WHERE user_id = ?', u.id);
      return { ...u, tasks: parseInt(tasks.count, 10), projects: parseInt(projects.count, 10) };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/users/:id ──
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await db.get(`
      SELECT id, name, email, role, initials, color, position, status, created_at
      FROM users WHERE id = ?
    `, req.params.id);

    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });

    const tasks = await db.get('SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ?', user.id);
    const projects = await db.get('SELECT COUNT(*) as count FROM project_members WHERE user_id = ?', user.id);

    res.json({ ...user, tasks: parseInt(tasks.count, 10), projects: parseInt(projects.count, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/users/:id ──
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // Only admin can edit others, users can edit themselves
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Ruxsat yo\'q.' });
    }

    const { name, position, email, role, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE id = ?', req.params.id);
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });

    let newRole = user.role;
    if (role && req.user.role === 'admin') {
      newRole = role;
    }

    let newPassword = user.password;
    if (password) {
      newPassword = bcrypt.hashSync(password, 10);
    }

    await db.run('UPDATE users SET name = ?, position = ?, email = ?, role = ?, password = ? WHERE id = ?',
      name || user.name, position || user.position, email || user.email, newRole, newPassword, req.params.id);

    res.json({ message: 'Yangilandi.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/users/:id ──
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', req.params.id);
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });

    await db.run('DELETE FROM users WHERE id = ?', req.params.id);
    res.json({ message: 'Foydalanuvchi o\'chirildi.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/users/:id/status ──
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['online', 'offline', 'busy'].includes(status)) {
      return res.status(400).json({ error: 'Noto\'g\'ri status.' });
    }

    await db.run('UPDATE users SET status = ? WHERE id = ?', status, req.params.id);
    res.json({ message: 'Status yangilandi.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
