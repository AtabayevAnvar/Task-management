/* ============================================
   SERVER — TaskFlow Backend Entry Point
   ============================================ */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase, dbWrapper } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Serve frontend static files ──
app.use(express.static(path.join(__dirname, '..')));

async function startServer() {
  // Initialize database
  await initDatabase();
  
  // Make db available to routes
  app.locals.db = dbWrapper;

  // ── API Routes ──
  app.use('/api/auth',          require('./routes/auth'));
  app.use('/api/users',         require('./routes/users'));
  app.use('/api/projects',      require('./routes/projects'));
  app.use('/api/tasks',         require('./routes/tasks'));
  app.use('/api/chat',          require('./routes/chat'));
  app.use('/api/notifications', require('./routes/notifications'));
  app.use('/api/feedback',      require('./routes/feedback'));
  app.use('/api/dashboard',     require('./routes/dashboard'));

  // ── Health check ──
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // ── Error handler ──
  app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Ichki server xatosi.', details: err.message, stack: err.stack });
  });

  // ── Start ──
  app.listen(PORT, () => {
    console.log(`\n🚀 TaskFlow Backend running at http://localhost:${PORT}`);
    console.log(`📂 API available at http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend at http://localhost:${PORT}\n`);
  });
}

startServer().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
