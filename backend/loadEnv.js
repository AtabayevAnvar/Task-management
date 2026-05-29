/* Render va lokal: .env fayl + tizim muhit o'zgaruvchilari */
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    return null;
  }
  return value.trim();
}

function getDatabaseUrl() {
  return (
    requireEnv('DATABASE_URL') ||
    requireEnv('POSTGRES_URL') ||
    requireEnv('POSTGRESQL_URL')
  );
}

module.exports = { getDatabaseUrl, requireEnv };
