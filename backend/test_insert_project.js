const { initDatabase, dbWrapper } = require('./db/database');

async function test() {
  await initDatabase();
  const db = dbWrapper;
  
  try {
    const result = db.prepare(`
      INSERT INTO projects (name, client, pm_id, status, priority, progress, start_date, deadline, description)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
    `).run('Test Project', 'Client', 1, 'new', 'high', '2026-01-01', '2026-12-31', 'Desc');
    
    console.log('Result:', result);
    
    const rows = db.prepare('SELECT * FROM projects').all();
    console.log('Rows in DB:', rows);
  } catch(e) {
    console.error(e);
  }
}

test();
