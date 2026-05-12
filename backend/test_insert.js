const { initDatabase, dbWrapper } = require('./db/database');

async function test() {
  await initDatabase();
  const db = dbWrapper;
  
  const res = db.prepare('INSERT INTO chat_rooms (name) VALUES (?)').run('Test Room');
  console.log('Result:', res);
  
  const rows = db.prepare('SELECT * FROM chat_rooms').all();
  console.log('Rows in DB:', rows);
}

test();
