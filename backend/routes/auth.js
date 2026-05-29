/* ============================================
   AUTH ROUTES — Login, Register, Me
   ============================================ */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbWrapper: db } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/auth/login ──
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email va parol kiritilishi shart.' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', email);
    if (!user) {
      return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri.' });
    }

    // Update status to online
    await db.run('UPDATE users SET status = ? WHERE id = ?', 'online', user.id);

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'super_secret_key_123_taskflow',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        initials: user.initials,
        color: user.color,
        position: user.position,
        status: 'online'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/register (admin only) ──
router.post('/register', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role, position } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Ism, email va parol kiritilishi shart.' });
    }

    // Check if email already exists
    const existing = await db.get('SELECT id FROM users WHERE email = ?', email);
    if (existing) {
      return res.status(400).json({ error: 'Bu email allaqachon ro\'yxatdan o\'tgan.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#34d399', '#60a5fa', '#a78bfa', '#f97316', '#06b6d4', '#e11d48'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const result = await db.run(`
      INSERT INTO users (name, email, password, role, initials, color, position)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, name, email, hashedPassword, role || 'employee', initials, color, position || '');

    res.status(201).json({
      id: result.lastInsertRowid,
      name, email,
      role: role || 'employee',
      initials, color,
      position: position || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/me ──
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.get('SELECT id, name, email, role, initials, color, position, status FROM users WHERE id = ?', req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/logout ──
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await db.run('UPDATE users SET status = ? WHERE id = ?', 'offline', req.user.id);
    res.json({ message: 'Muvaffaqiyatli chiqildi.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
