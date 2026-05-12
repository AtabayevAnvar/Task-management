/* ============================================
   DASHBOARD ROUTES — Stats + Activity
   ============================================ */

const express = require('express');
const { dbWrapper: db } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/dashboard/stats ──
router.get('/stats', authMiddleware, (req, res) => {
  const totalProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
  const activeProjects = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'progress'").get().count;
  const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
  const completedTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'approved'").get().count;
  const delayedTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'delayed'").get().count;
  const reviewTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'review'").get().count;
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const onlineUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'online'").get().count;

  // Task status distribution
  const statusDistribution = db.prepare(`
    SELECT status, COUNT(*) as count FROM tasks GROUP BY status
  `).all();

  // Projects with progress (for chart)
  const projectProgress = db.prepare(`
    SELECT id, name, progress, status FROM projects ORDER BY id LIMIT 6
  `).all();

  // Upcoming deadlines
  const upcomingDeadlines = db.prepare(`
    SELECT t.*, p.name as project_name 
    FROM tasks t LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.deadline != '' AND t.status NOT IN ('approved','cancelled')
    ORDER BY t.deadline ASC LIMIT 5
  `).all();

  // Employee workload
  const workload = db.prepare(`
    SELECT u.id, u.name, u.initials, u.color, u.position,
      (SELECT COUNT(*) FROM tasks WHERE assignee_id = u.id AND status NOT IN ('approved','cancelled')) as activeTasks
    FROM users u
    WHERE u.role = 'employee'
    ORDER BY activeTasks DESC
  `).all();

  res.json({
    totalProjects,
    activeProjects,
    totalTasks,
    completedTasks,
    delayedTasks,
    reviewTasks,
    totalUsers,
    onlineUsers,
    statusDistribution,
    projectProgress,
    upcomingDeadlines,
    workload,
  });
});

// ── GET /api/dashboard/activity ──
router.get('/activity', authMiddleware, (req, res) => {
  const activities = db.prepare(`
    SELECT a.*, u.name, u.initials, u.color
    FROM activity_log a JOIN users u ON a.user_id = u.id
    ORDER BY a.id DESC LIMIT 10
  `).all();

  res.json(activities.map(a => ({
    ...a,
    time: getRelativeTime(a.created_at),
    userId: a.user_id,
  })));
});

function getRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'hozirgina';
  if (diffMin < 60) return `${diffMin} daqiqa oldin`;
  if (diffHr < 24) return `${diffHr} soat oldin`;
  if (diffDay < 7) return diffDay === 1 ? 'kecha' : `${diffDay} kun oldin`;
  return dateStr.split(' ')[0] || dateStr;
}

module.exports = router;
