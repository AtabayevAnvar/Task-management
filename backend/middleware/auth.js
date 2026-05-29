/* ============================================
   AUTH MIDDLEWARE — JWT token verification
   ============================================ */

const jwt = require('jsonwebtoken');
const { dbWrapper: db } = require('../db/database');
const { touchUserSession } = require('../utils/sessionHelpers');

const JWT_SECRET = () => process.env.JWT_SECRET || 'super_secret_key_123_taskflow';

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token topilmadi. Login qiling.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET());
    req.user = decoded;

    if (decoded.sid) {
      const session = await db.get(
        'SELECT id FROM user_sessions WHERE id = ? AND user_id = ? AND revoked_at IS NULL',
        decoded.sid,
        decoded.id
      );

      if (!session) {
        return res.status(401).json({ error: 'Sessiya tugatilgan. Qayta kiring.' });
      }

      await touchUserSession(db, decoded.sid, decoded.id);
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token yaroqsiz yoki muddati tugagan.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentifikatsiya talab qilinadi.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Sizda bu amalni bajarish huquqi yo\'q.' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole, JWT_SECRET };
