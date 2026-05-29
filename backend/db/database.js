/* ============================================
   DATABASE — PostgreSQL connection + schema
   ============================================ */

const { Pool } = require('pg');
const { getDatabaseUrl } = require('../loadEnv');

let pool = null;

async function initDatabase() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL topilmadi. Render Dashboard → Task-management → Environment → ' +
      'PostgreSQL "Internal Database URL" ni DATABASE_URL sifatida qo\'shing (yoki bazani web service ga ulang).'
    );
  }

  const forceSsl =
    process.env.PGSSLMODE === 'require' ||
    process.env.DB_SSL === 'true' ||
    /render\.com/i.test(connectionString);

  const poolConfig = { connectionString };
  if (forceSsl) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  pool = new Pool(poolConfig);

  // ── Create Tables (PostgreSQL syntax) ──
  // Note: INTEGER PRIMARY KEY AUTOINCREMENT becomes SERIAL PRIMARY KEY
  // Note: DATETIME becomes TIMESTAMP
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'employee' CHECK(role IN ('admin','pm','employee','teamlead','hr')),
      initials TEXT,
      color TEXT,
      position TEXT,
      status TEXT DEFAULT 'offline' CHECK(status IN ('online','offline','busy')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      client TEXT,
      pm_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'new',
      priority TEXT DEFAULT 'medium',
      progress INTEGER DEFAULT 0,
      start_date TEXT,
      deadline TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_members (
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (project_id, user_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE,
      title TEXT NOT NULL,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      assignee_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'new',
      priority TEXT DEFAULT 'medium',
      deadline TEXT,
      description TEXT,
      delay_reason TEXT,
      delay_days INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      files_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS checklists (
      id SERIAL PRIMARY KEY,
      task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      done INTEGER DEFAULT 0
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_rooms (
      id SERIAL PRIMARY KEY,
      type TEXT DEFAULT 'group' CHECK(type IN ('group','direct')),
      name TEXT,
      color TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_members (
      room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (room_id, user_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type TEXT,
      icon TEXT,
      title TEXT,
      description TEXT,
      read INTEGER DEFAULT 0,
      color TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id SERIAL PRIMARY KEY,
      type TEXT CHECK(type IN ('idea','suggestion','complaint')),
      subject TEXT NOT NULL,
      text TEXT NOT NULL,
      author_id INTEGER REFERENCES users(id),
      anonymous INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      response_text TEXT,
      response_author TEXT,
      response_date TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_files (
      id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      size TEXT,
      author TEXT,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      target TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      revoked_at TIMESTAMP
    )
  `);

  await migrateUserRoleConstraint();

  return pool;
}

/** Mavjud bazada users.role CHECK cheklovini yangilash */
async function migrateUserRoleConstraint() {
  const allowed = "('admin','pm','employee','teamlead','hr')";
  try {
    await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
  } catch (err) {
    console.warn('users_role_check drop:', err.message);
  }
  try {
    await pool.query(
      `ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ${allowed})`
    );
  } catch (err) {
    if (!/already exists/i.test(err.message)) {
      console.warn('users_role_check add:', err.message);
    }
  }
}

function ensurePool() {
  if (!pool) {
    throw new Error('Database is not initialized. Call initDatabase() before queries.');
  }
}

// Convert SQLite '?' binding to PostgreSQL '$1, $2'
function convertSql(sql) {
  let count = 1;
  return sql.replace(/\?/g, () => `$${count++}`);
}

// ── Wrapper methods (Async interface for Postgres) ──
const dbWrapper = {
  // Returns a single object
  async get(sql, ...params) {
    ensurePool();
    const pgSql = convertSql(sql);
    const result = await pool.query(pgSql, params);
    return result.rows[0];
  },
  // Returns array of objects
  async all(sql, ...params) {
    ensurePool();
    const pgSql = convertSql(sql);
    const result = await pool.query(pgSql, params);
    return result.rows;
  },
  // Returns { lastInsertRowid }
  async run(sql, ...params) {
    ensurePool();

    const pgSql = convertSql(sql);
    const normalizedSql = pgSql.replace(/;\s*$/, '');
    const isInsert = /^\s*INSERT\b/i.test(normalizedSql);
    const hasReturning = /\bRETURNING\b/i.test(normalizedSql);

    let result;
    if (isInsert && !hasReturning) {
      try {
        result = await pool.query(`${normalizedSql} RETURNING id`, params);
      } catch (err) {
        // Some tables use composite primary keys and do not have "id".
        if (err && err.code === '42703' && /column\s+["']?id["']?\s+does not exist/i.test(err.message || '')) {
          result = await pool.query(normalizedSql, params);
        } else {
          throw err;
        }
      }
    } else {
      result = await pool.query(normalizedSql, params);
    }

    let lastInsertRowid = 0;
    if (result.rows && result.rows.length > 0) {
      if (result.rows[0].id !== undefined) {
        lastInsertRowid = result.rows[0].id;
      }
    }
    return { lastInsertRowid };
  },
  async exec(sql) {
    ensurePool();
    await pool.query(sql);
  },
  async transaction(fn) {
    ensurePool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const txDb = {
        async get(sql, ...params) {
          const result = await client.query(convertSql(sql), params);
          return result.rows[0];
        },
        async all(sql, ...params) {
          const result = await client.query(convertSql(sql), params);
          return result.rows;
        },
        async run(sql, ...params) {
          const txSql = convertSql(sql).replace(/;\s*$/, '');
          const txResult = await client.query(txSql, params);
          let lastInsertRowid = 0;
          if (txResult.rows && txResult.rows.length > 0 && txResult.rows[0].id !== undefined) {
            lastInsertRowid = txResult.rows[0].id;
          }
          return { lastInsertRowid };
        },
        async exec(sql) {
          await client.query(sql);
        }
      };

      await fn(txDb);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
};

function getPool() {
  return pool;
}

module.exports = { initDatabase, dbWrapper, getPool };
