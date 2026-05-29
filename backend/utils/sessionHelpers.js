/* ============================================
   SESSION HELPERS — UA, IP, vaqt formati
   ============================================ */

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'Noma\'lum';
}

function parseUserAgent(ua) {
  const agent = String(ua || '');

  let browser = 'Brauzer';
  if (/Edg\//i.test(agent)) browser = 'Edge';
  else if (/Chrome\//i.test(agent)) browser = 'Chrome';
  else if (/Firefox\//i.test(agent)) browser = 'Firefox';
  else if (/Safari\//i.test(agent)) browser = 'Safari';

  let os = 'Noma\'lum';
  if (/Windows NT 10/i.test(agent)) os = 'Windows 11';
  else if (/Windows/i.test(agent)) os = 'Windows';
  else if (/Mac OS X/i.test(agent)) os = 'macOS';
  else if (/iPhone/i.test(agent)) os = 'iPhone';
  else if (/iPad/i.test(agent)) os = 'iPad';
  else if (/Android/i.test(agent)) os = 'Android';
  else if (/Linux/i.test(agent)) os = 'Linux';

  return `${browser} — ${os}`;
}

function formatSessionTime(value) {
  if (!value) return '';

  const now = new Date();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

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

async function createUserSession(db, userId, req) {
  const label = parseUserAgent(req.headers['user-agent']);
  const ip = getClientIp(req);
  const ua = String(req.headers['user-agent'] || '').slice(0, 500);

  const result = await db.run(
    `INSERT INTO user_sessions (user_id, label, ip_address, user_agent, last_active_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    userId,
    label,
    ip,
    ua
  );

  return result.lastInsertRowid;
}

async function touchUserSession(db, sessionId, userId) {
  if (!sessionId) return;
  await db.run(
    `UPDATE user_sessions SET last_active_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ? AND revoked_at IS NULL`,
    sessionId,
    userId
  );
}

async function revokeUserSession(db, sessionId, userId) {
  await db.run(
    `UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ? AND revoked_at IS NULL`,
    sessionId,
    userId
  );
}

module.exports = {
  getClientIp,
  parseUserAgent,
  formatSessionTime,
  createUserSession,
  touchUserSession,
  revokeUserSession,
};
