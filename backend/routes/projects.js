/* ============================================
   PROJECTS ROUTES — CRUD + team + files
   ============================================ */

const express = require('express');
const { dbWrapper: db } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Helper: enrich project with PM name, team, task counts
async function enrichProject(p) {
  const pm = await db.get('SELECT name FROM users WHERE id = ?', p.pm_id);
  const team = await db.all(`
    SELECT u.id, u.name, u.initials, u.color, u.position 
    FROM project_members pm JOIN users u ON pm.user_id = u.id 
    WHERE pm.project_id = ?
  `, p.id);
  const taskCount = await db.get('SELECT COUNT(*) as count FROM tasks WHERE project_id = ?', p.id);
  const completedTasks = await db.get("SELECT COUNT(*) as count FROM tasks WHERE project_id = ? AND status = 'approved'", p.id);
  const files = await db.all('SELECT * FROM project_files WHERE project_id = ?', p.id);

  return {
    ...p,
    pm: pm ? pm.name : 'Noma\'lum',
    pmId: p.pm_id,
    team: team.map(t => t.id),
    teamMembers: team,
    taskCount: parseInt(taskCount.count, 10),
    completedTasks: parseInt(completedTasks.count, 10),
    files,
    desc: p.description,
    start: p.start_date,
  };
}

// ── GET /api/projects ──
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, priority, search } = req.query;

    let sql = 'SELECT * FROM projects WHERE 1=1';
    const params = [];

    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (priority) { sql += ' AND priority = ?'; params.push(priority); }
    if (search) { sql += ' AND name LIKE ?'; params.push(`%${search}%`); }

    sql += ' ORDER BY id DESC';

    const projects = await db.all(sql, ...params);
    const enrichedProjects = await Promise.all(projects.map(enrichProject));
    res.json(enrichedProjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/projects/:id ──
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await db.get('SELECT * FROM projects WHERE id = ?', req.params.id);
    if (!project) return res.status(404).json({ error: 'Loyiha topilmadi.' });

    const enriched = await enrichProject(project);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/projects (admin + pm) ──
router.post('/', authMiddleware, requireRole('admin', 'pm'), async (req, res) => {
  try {
    const { name, client, pm_id, status, priority, start_date, deadline, description, team } = req.body;

    if (!name) return res.status(400).json({ error: 'Loyiha nomi kiritilishi shart.' });

    const result = await db.run(`
      INSERT INTO projects (name, client, pm_id, status, priority, progress, start_date, deadline, description)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
    `, name, client || '', pm_id || req.user.id, status || 'new', priority || 'medium',
      start_date || new Date().toISOString().split('T')[0], deadline || '', description || '');

    const projectId = result.lastInsertRowid;

    // Add team members
    if (team && Array.isArray(team)) {
      for (const userId of team) {
        if (userId) { // ensure not null/NaN
          try {
            await db.run(
              'INSERT INTO project_members (project_id, user_id) VALUES (?, ?) RETURNING project_id',
              projectId,
              userId
            );
          } catch (err) {
            console.error("Team member insert error:", err.message);
          }
        }
      }
    }

    // Log activity
    await db.run('INSERT INTO activity_log (user_id, action, target) VALUES (?, ?, ?)',
      req.user.id, 'yangi loyiha yaratdi', `"${name}"`);

    const project = await db.get('SELECT * FROM projects WHERE id = ?', projectId);
    const enriched = await enrichProject(project);
    res.status(201).json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/projects/:id (admin + pm) ──
router.put('/:id', authMiddleware, requireRole('admin', 'pm'), async (req, res) => {
  try {
    const project = await db.get('SELECT * FROM projects WHERE id = ?', req.params.id);
    if (!project) return res.status(404).json({ error: 'Loyiha topilmadi.' });

    const { name, client, pm_id, status, priority, progress, start_date, deadline, description } = req.body;

    await db.run(`
      UPDATE projects SET name = ?, client = ?, pm_id = ?, status = ?, priority = ?, 
      progress = ?, start_date = ?, deadline = ?, description = ?
      WHERE id = ?
    `,
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

    const updated = await db.get('SELECT * FROM projects WHERE id = ?', req.params.id);
    const enriched = await enrichProject(updated);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/projects/:id (admin only) ──
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const project = await db.get('SELECT * FROM projects WHERE id = ?', req.params.id);
    if (!project) return res.status(404).json({ error: 'Loyiha topilmadi.' });

    await db.run('DELETE FROM projects WHERE id = ?', req.params.id);
    res.json({ message: `"${project.name}" o'chirildi.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/projects/:id/tasks ──
router.get('/:id/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = await db.all('SELECT * FROM tasks WHERE project_id = ? ORDER BY id', req.params.id);
    
    const result = await Promise.all(tasks.map(async t => {
      const checklist = await db.all('SELECT * FROM checklists WHERE task_id = ?', t.id);
      return { ...t, checklist, desc: t.description };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/projects/:id/team ──
router.get('/:id/team', authMiddleware, async (req, res) => {
  try {
    const team = await db.all(`
      SELECT u.id, u.name, u.initials, u.color, u.position, u.status
      FROM project_members pm JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `, req.params.id);

    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
