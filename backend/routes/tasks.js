/* ============================================
   TASKS ROUTES — CRUD + status + checklist
   ============================================ */

const express = require('express');
const { dbWrapper: db } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Helper: enrich task
function enrichTask(t) {
  const checklist = db.prepare('SELECT * FROM checklists WHERE task_id = ?').all(t.id);
  return { ...t, checklist, desc: t.description };
}

// ── GET /api/tasks ──
router.get('/', authMiddleware, (req, res) => {
  const { status, priority, project, search, assignee } = req.query;

  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];

  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (priority) { sql += ' AND priority = ?'; params.push(priority); }
  if (project) { sql += ' AND project_id = ?'; params.push(project); }
  if (search) { sql += ' AND title LIKE ?'; params.push(`%${search}%`); }
  if (assignee) { sql += ' AND assignee_id = ?'; params.push(assignee); }

  // Employee faqat o'z tasklarini ko'radi
  if (req.user.role === 'employee') {
    sql += ' AND assignee_id = ?';
    params.push(req.user.id);
  }

  sql += ' ORDER BY id';

  const tasks = db.prepare(sql).all(...params);
  res.json(tasks.map(enrichTask));
});

// ── GET /api/tasks/:id ──
router.get('/:id', authMiddleware, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task topilmadi.' });

  res.json(enrichTask(task));
});

// ── POST /api/tasks (admin + pm) ──
router.post('/', authMiddleware, requireRole('admin', 'pm'), (req, res, next) => {
  const {
    code,
    title,
    project_id,
    projectId,
    assignee_id,
    assigneeId,
    status,
    priority,
    deadline,
    description,
    desc,
    checklist
  } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Task nomi kiritilishi shart.' });
  }

  const normalizedProjectId = project_id ?? projectId ?? null;
  const normalizedAssigneeId = assignee_id ?? assigneeId ?? null;
  const normalizedDescription = description ?? desc ?? '';

  const projectIdNum = normalizedProjectId !== null && normalizedProjectId !== undefined && normalizedProjectId !== ''
    ? Number(normalizedProjectId)
    : null;
  const assigneeIdNum = normalizedAssigneeId !== null && normalizedAssigneeId !== undefined && normalizedAssigneeId !== ''
    ? Number(normalizedAssigneeId)
    : null;

  if (projectIdNum !== null && !Number.isInteger(projectIdNum)) {
    return res.status(400).json({ error: 'Loyiha ID noto\'g\'ri.' });
  }
  if (assigneeIdNum !== null && !Number.isInteger(assigneeIdNum)) {
    return res.status(400).json({ error: 'Mas\'ul xodim ID noto\'g\'ri.' });
  }

  if (projectIdNum !== null) {
    const projectExists = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectIdNum);
    if (!projectExists) {
      return res.status(400).json({ error: 'Tanlangan loyiha topilmadi.' });
    }
  }

  if (assigneeIdNum !== null) {
    const assigneeExists = db.prepare('SELECT id FROM users WHERE id = ?').get(assigneeIdNum);
    if (!assigneeExists) {
      return res.status(400).json({ error: 'Tanlangan xodim topilmadi.' });
    }
  }

  // Auto-generate code if not provided
  const rawCode = typeof code === 'string' ? code.trim() : '';
  let taskCode = rawCode || null;
  if (!taskCode && projectIdNum) {
    const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(projectIdNum);
    if (project) {
      const prefix = project.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
      const count = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE project_id = ?').get(projectIdNum);
      taskCode = `${prefix}-${String(count.count + 1).padStart(3, '0')}`;
    }
  }

  let result;
  try {
    result = db.prepare(`
      INSERT INTO tasks (code, title, project_id, assignee_id, status, priority, deadline, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      taskCode,
      String(title).trim(),
      projectIdNum,
      assigneeIdNum,
      status || 'new',
      priority || 'medium',
      deadline || '',
      normalizedDescription || ''
    );
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed: tasks.code')) {
      return res.status(400).json({ error: 'Task kodi allaqachon mavjud. Kodni o\'zgartiring.' });
    }
    return next(err);
  }

  const taskId = result.lastInsertRowid;

  // Add checklist items
  if (checklist && Array.isArray(checklist)) {
    const insertCheck = db.prepare('INSERT INTO checklists (task_id, text, done) VALUES (?, ?, ?)');
    const addChecks = db.transaction(() => {
      for (const item of checklist) {
        if (!item || !item.text || !String(item.text).trim()) continue;
        insertCheck.run(taskId, String(item.text).trim(), item.done ? 1 : 0);
      }
    });
    addChecks();
  }

  // Log activity
  db.prepare('INSERT INTO activity_log (user_id, action, target) VALUES (?, ?, ?)')
    .run(req.user.id, 'yangi task yaratdi', `"${String(title).trim()}"`);

  // Create notification for assignee
  if (assigneeIdNum) {
    db.prepare(`
      INSERT INTO notifications (user_id, type, icon, title, description, color)
      VALUES (?, 'task', '✅', 'Yangi task biriktildi', ?, 'var(--info-bg)')
    `).run(assigneeIdNum, `"${String(title).trim()}" sizga biriktildi`);
  }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  res.status(201).json(enrichTask(task));
});

// ── PUT /api/tasks/:id ──
router.put('/:id', authMiddleware, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task topilmadi.' });

  // Employee faqat o'z taskining statusini o'zgartira oladi
  if (req.user.role === 'employee' && task.assignee_id !== req.user.id) {
    return res.status(403).json({ error: 'Bu task sizga biriktirilmagan.' });
  }

  const { title, assignee_id, status, priority, deadline, description, delay_reason, delay_days } = req.body;

  db.prepare(`
    UPDATE tasks SET title = ?, assignee_id = ?, status = ?, priority = ?, 
    deadline = ?, description = ?, delay_reason = ?, delay_days = ?
    WHERE id = ?
  `).run(
    title || task.title,
    assignee_id !== undefined ? assignee_id : task.assignee_id,
    status || task.status,
    priority || task.priority,
    deadline || task.deadline,
    description !== undefined ? description : task.description,
    delay_reason !== undefined ? delay_reason : task.delay_reason,
    delay_days !== undefined ? delay_days : task.delay_days,
    req.params.id
  );

  // Log status change
  if (status && status !== task.status) {
    db.prepare('INSERT INTO activity_log (user_id, action, target) VALUES (?, ?, ?)')
      .run(req.user.id, "statusni o'zgartirdi", `"${task.title}" → ${status}`);
  }

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json(enrichTask(updated));
});

// ── PUT /api/tasks/:id/status (drag-and-drop uchun) ──
router.put('/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task topilmadi.' });

  if (!status) return res.status(400).json({ error: 'Status kiritilishi shart.' });

  db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, req.params.id);

  // Log
  db.prepare('INSERT INTO activity_log (user_id, action, target) VALUES (?, ?, ?)')
    .run(req.user.id, "statusni o'zgartirdi", `"${task.title}" → ${status}`);

  res.json({ message: 'Status yangilandi.', status });
});

// ── PUT /api/tasks/:id/checklist/:checkId ──
router.put('/:id/checklist/:checkId', authMiddleware, (req, res) => {
  const { done } = req.body;
  const check = db.prepare('SELECT * FROM checklists WHERE id = ? AND task_id = ?')
    .get(req.params.checkId, req.params.id);

  if (!check) return res.status(404).json({ error: 'Checklist item topilmadi.' });

  db.prepare('UPDATE checklists SET done = ? WHERE id = ?').run(done ? 1 : 0, req.params.checkId);
  res.json({ message: 'Yangilandi.' });
});

// ── DELETE /api/tasks/:id (admin + pm) ──
router.delete('/:id', authMiddleware, requireRole('admin', 'pm'), (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task topilmadi.' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: `"${task.title}" o'chirildi.` });
});

module.exports = router;
