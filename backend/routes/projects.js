/* ============================================
   PROJECTS ROUTES — CRUD + team + files
   ============================================ */

const express = require('express');
const { dbWrapper: db } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Helper: enrich project with PM name, team, task counts
function enrichProject(p) {
  const pm = db.prepare('SELECT name FROM users WHERE id = ?').get(p.pm_id);
  const team = db.prepare(`
    SELECT u.id, u.name, u.initials, u.color, u.position 
    FROM project_members pm JOIN users u ON pm.user_id = u.id 
    WHERE pm.project_id = ?
  `).all(p.id);
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE project_id = ?').get(p.id);
  const completedTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE project_id = ? AND status = 'approved'").get(p.id);
  const files = db.prepare('SELECT * FROM project_files WHERE project_id = ?').all(p.id);

  return {
    ...p,
    pm: pm ? pm.name : 'Noma\'lum',
    pmId: p.pm_id,
    team: team.map(t => t.id),
    teamMembers: team,
    taskCount: taskCount.count,
    completedTasks: completedTasks.count,
    files,
    desc: p.description,
    start: p.start_date,
  };
}

// ── GET /api/projects ──
router.get('/', authMiddleware, (req, res) => {
  const { status, priority, search } = req.query;

  let sql = 'SELECT * FROM projects WHERE 1=1';
  const params = [];

  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (priority) { sql += ' AND priority = ?'; params.push(priority); }
  if (search) { sql += ' AND name LIKE ?'; params.push(`%${search}%`); }

  sql += ' ORDER BY id DESC';

  const projects = db.prepare(sql).all(...params);
  res.json(projects.map(enrichProject));
});

// ── GET /api/projects/:id ──
router.get('/:id', authMiddleware, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Loyiha topilmadi.' });

  res.json(enrichProject(project));
});

// ── POST /api/projects (admin + pm) ──
router.post('/', authMiddleware, requireRole('admin', 'pm'), (req, res) => {
  const { name, client, pm_id, status, priority, start_date, deadline, description, team } = req.body;

  if (!name) return res.status(400).json({ error: 'Loyiha nomi kiritilishi shart.' });

  const result = db.prepare(`
    INSERT INTO projects (name, client, pm_id, status, priority, progress, start_date, deadline, description)
    VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
  `).run(name, client || '', pm_id || req.user.id, status || 'new', priority || 'medium',
    start_date || new Date().toISOString().split('T')[0], deadline || '', description || '');

  const projectId = result.lastInsertRowid;

  // Add team members
  if (team && Array.isArray(team)) {
    const insertMember = db.prepare('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)');
    for (const userId of team) {
      if (userId) { // ensure not null/NaN
        try {
          insertMember.run(projectId, userId);
        } catch (err) {
          console.error("Team member insert error:", err.message);
        }
      }
    }
  }

  // Log activity
  db.prepare('INSERT INTO activity_log (user_id, action, target) VALUES (?, ?, ?)')
    .run(req.user.id, 'yangi loyiha yaratdi', `"${name}"`);

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  res.status(201).json(enrichProject(project));
});

// ── PUT /api/projects/:id (admin + pm) ──
router.put('/:id', authMiddleware, requireRole('admin', 'pm'), (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Loyiha topilmadi.' });

  const { name, client, pm_id, status, priority, progress, start_date, deadline, description } = req.body;

  db.prepare(`
    UPDATE projects SET name = ?, client = ?, pm_id = ?, status = ?, priority = ?, 
    progress = ?, start_date = ?, deadline = ?, description = ?
    WHERE id = ?
  `).run(
    name || project.name,
    client !== undefined ? client : project.client,
    pm_id || project.pm_id,
    status || project.status,
    priority || project.priority,
    progress !== undefined ? progress : project.progress,
    start_date || project.start_date,
    deadline || project.deadline,
    description !== undefined ? description : project.description,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json(enrichProject(updated));
});

// ── DELETE /api/projects/:id (admin only) ──
router.delete('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Loyiha topilmadi.' });

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: `"${project.name}" o'chirildi.` });
});

// ── GET /api/projects/:id/tasks ──
router.get('/:id/tasks', authMiddleware, (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY id').all(req.params.id);
  
  const result = tasks.map(t => {
    const checklist = db.prepare('SELECT * FROM checklists WHERE task_id = ?').all(t.id);
    return { ...t, checklist, desc: t.description };
  });

  res.json(result);
});

// ── GET /api/projects/:id/team ──
router.get('/:id/team', authMiddleware, (req, res) => {
  const team = db.prepare(`
    SELECT u.id, u.name, u.initials, u.color, u.position, u.status
    FROM project_members pm JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
  `).all(req.params.id);

  res.json(team);
});

module.exports = router;
