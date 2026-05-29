/* ============================================
   DASHBOARD ROUTES - Stats + Activity
   ============================================ */

const express = require('express');
const { dbWrapper: db } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, async (req, res, next) => {
  try {
    const totalProjects = await db.get('SELECT COUNT(*) as count FROM projects');
    const activeProjects = await db.get("SELECT COUNT(*) as count FROM projects WHERE status = 'progress'");
    const totalTasks = await db.get('SELECT COUNT(*) as count FROM tasks');
    const completedTasks = await db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'approved'");
    const delayedTasks = await db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'delayed'");
    const reviewTasks = await db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'review'");
    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
    const onlineUsers = await db.get("SELECT COUNT(*) as count FROM users WHERE status = 'online'");

    const statusDistribution = await db.all(
      'SELECT status, COUNT(*) as count FROM tasks GROUP BY status'
    );

    const projectProgress = await db.all(
      'SELECT id, name, progress, status FROM projects ORDER BY id LIMIT 6'
    );

    const upcomingDeadlines = await db.all(
      `SELECT t.*, p.name as project_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.deadline != '' AND t.status NOT IN ('approved', 'cancelled')
       ORDER BY t.deadline ASC
       LIMIT 5`
    );

    const workload = await db.all(
      `SELECT u.id, u.name, u.initials, u.color, u.position,
              (SELECT COUNT(*) FROM tasks WHERE assignee_id = u.id AND status NOT IN ('approved','cancelled')) as "activeTasks"
       FROM users u
       WHERE u.role = 'employee'
       ORDER BY "activeTasks" DESC`
    );

    res.json({
      totalProjects: Number(totalProjects.count),
      activeProjects: Number(activeProjects.count),
      totalTasks: Number(totalTasks.count),
      completedTasks: Number(completedTasks.count),
      delayedTasks: Number(delayedTasks.count),
      reviewTasks: Number(reviewTasks.count),
      totalUsers: Number(totalUsers.count),
      onlineUsers: Number(onlineUsers.count),
      statusDistribution: statusDistribution.map((item) => ({ ...item, count: Number(item.count) })),
      projectProgress,
      upcomingDeadlines,
      workload: workload.map((item) => ({ ...item, activeTasks: Number(item.activeTasks) }))
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/activity
router.get('/activity', authMiddleware, async (req, res, next) => {
  try {
    const activities = await db.all(
      `SELECT a.*, u.name, u.initials, u.color
       FROM activity_log a
       JOIN users u ON a.user_id = u.id
       ORDER BY a.id DESC
       LIMIT 10`
    );

    res.json(
      activities.map((activity) => ({
        ...activity,
        time: getRelativeTime(activity.created_at),
        userId: activity.user_id
      }))
    );
  } catch (err) {
    next(err);
  }
});

function getRelativeTime(value) {
  if (!value) {
    return '';
  }

  const now = new Date();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'hozirgina';
  if (diffMin < 60) return `${diffMin} daqiqa oldin`;
  if (diffHr < 24) return `${diffHr} soat oldin`;
  if (diffDay < 7) return diffDay === 1 ? 'kecha' : `${diffDay} kun oldin`;
  return date.toISOString().slice(0, 10);
}

module.exports = router;
