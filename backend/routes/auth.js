/* ============================================
   AUTH ROUTES — Login, Register, Me
   ============================================ */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbWrapper: db } = require('../db/database');
const { authMiddleware, requireRole, JWT_SECRET } = require('../middleware/auth');
const {
  createUserSession,
  revokeUserSession,
  formatSessionTime,
  parseUserAgent,
  getClientIp,
} = require('../utils/sessionHelpers');

const router = express.Router();

// ── POST /api/auth/login ──
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email va parol kiritilishi shart.' });
    }

    const user = await db.get('SELECT * FROM users WHERE LOWER(email) = ?', email);
    if (!user) {
      return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri.' });
    }

    await db.run('UPDATE users SET status = ? WHERE id = ?', 'online', user.id);

    const sessionId = await createUserSession(db, user.id, req);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, sid: sessionId },
      JWT_SECRET(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      sessionId,
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

    const allowedRoles = ['admin', 'pm', 'employee', 'teamlead', 'hr'];
    const userRole = role || 'employee';
    if (!allowedRoles.includes(userRole)) {
      return res.status(400).json({ error: 'Noto\'g\'ri foydalanuvchi roli.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#34d399', '#60a5fa', '#a78bfa', '#f97316', '#06b6d4', '#e11d48'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const result = await db.run(`
      INSERT INTO users (name, email, password, role, initials, color, position)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, name, email, hashedPassword, userRole, initials, color, position || '');

    res.status(201).json({
      id: result.lastInsertRowid,
      name, email,
      role: userRole,
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
    if (req.user.sid) {
      await revokeUserSession(db, req.user.sid, req.user.id);
    }
    await db.run('UPDATE users SET status = ? WHERE id = ?', 'offline', req.user.id);
    res.json({ message: 'Muvaffaqiyatli chiqildi.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/sessions ──
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT id, label, ip_address, last_active_at, created_at
       FROM user_sessions
       WHERE user_id = ? AND revoked_at IS NULL
       ORDER BY last_active_at DESC`,
      req.user.id
    );

    const sessions = rows.map((row) => ({
      id: row.id,
      label: row.label,
      ip: row.ip_address || "Noma'lum",
      lastActive: formatSessionTime(row.last_active_at),
      isCurrent: req.user.sid ? row.id === req.user.sid : false,
    }));

    if (sessions.length === 0 || !sessions.some((s) => s.isCurrent)) {
      sessions.unshift({
        id: req.user.sid || 0,
        label: parseUserAgent(req.headers['user-agent']),
        ip: getClientIp(req),
        lastActive: 'hozirgina',
        isCurrent: true,
        legacy: !req.user.sid,
      });
    }

    res.json({ sessions, currentSessionId: req.user.sid || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/auth/sessions/:id ──
router.delete('/sessions/:id', authMiddleware, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id, 10);
    if (!sessionId) {
      return res.status(400).json({ error: 'Noto\'g\'ri sessiya ID.' });
    }

    if (req.user.sid && sessionId === req.user.sid) {
      return res.status(400).json({ error: 'Joriy sessiyani bu yerdan emas, chiqish tugmasidan foydalaning.' });
    }

    const row = await db.get(
      'SELECT id FROM user_sessions WHERE id = ? AND user_id = ? AND revoked_at IS NULL',
      sessionId,
      req.user.id
    );

    if (!row) {
      return res.status(404).json({ error: 'Sessiya topilmadi.' });
    }

    await revokeUserSession(db, sessionId, req.user.id);
    res.json({ message: 'Sessiya tugatildi.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
