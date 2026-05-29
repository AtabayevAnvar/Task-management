/* ============================================
   TASKS ROUTES - CRUD + status + checklist
   ============================================ */

const express = require('express');
const { dbWrapper: db } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

async function enrichTask(task) {
  const checklist = await db.all('SELECT * FROM checklists WHERE task_id = ?', task.id);
  return { ...task, checklist, desc: task.description };
}

// GET /api/tasks
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { status, priority, project, search, assignee } = req.query;

    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (priority) {
      sql += ' AND priority = ?';
      params.push(priority);
    }
    if (project) {
      sql += ' AND project_id = ?';
      params.push(project);
    }
    if (search) {
      sql += ' AND title LIKE ?';
      params.push(`%${search}%`);
    }
    if (assignee) {
      sql += ' AND assignee_id = ?';
      params.push(assignee);
    }

    // Employee only sees own tasks.
    if (req.user.role === 'employee') {
      sql += ' AND assignee_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY id';

    const tasks = await db.all(sql, ...params);
    const enriched = await Promise.all(tasks.map(enrichTask));
    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task topilmadi.' });
    }

    res.json(await enrichTask(task));
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks (admin + pm)
router.post('/', authMiddleware, requireRole('admin', 'pm', 'teamlead'), async (req, res, next) => {
  try {
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
      return res.status(400).json({ error: 'Loyiha ID notogri.' });
    }
    if (assigneeIdNum !== null && !Number.isInteger(assigneeIdNum)) {
      return res.status(400).json({ error: 'Masul xodim ID notogri.' });
    }

    if (projectIdNum !== null) {
      const projectExists = await db.get('SELECT id FROM projects WHERE id = ?', projectIdNum);
      if (!projectExists) {
        return res.status(400).json({ error: 'Tanlangan loyiha topilmadi.' });
      }
    }

    if (assigneeIdNum !== null) {
      const assigneeExists = await db.get('SELECT id FROM users WHERE id = ?', assigneeIdNum);
      if (!assigneeExists) {
        return res.status(400).json({ error: 'Tanlangan xodim topilmadi.' });
      }
    }

    // Auto-generate code if not provided.
    const rawCode = typeof code === 'string' ? code.trim() : '';
    let taskCode = rawCode || null;
    if (!taskCode && projectIdNum) {
      const project = await db.get('SELECT name FROM projects WHERE id = ?', projectIdNum);
      if (project?.name) {
        const prefix = project.name
          .split(/\s+/)
          .filter(Boolean)
          .map((word) => word[0])
          .join('')
          .toUpperCase()
          .slice(0, 3) || 'TSK';

        const count = await db.get('SELECT COUNT(*) as count FROM tasks WHERE project_id = ?', projectIdNum);
        taskCode = `${prefix}-${String(Number(count.count) + 1).padStart(3, '0')}`;
      }
    }

    let result;
    try {
      result = await db.run(
        `INSERT INTO tasks (code, title, project_id, assignee_id, status, priority, deadline, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
      // PostgreSQL unique violation
      if (err && err.code === '23505') {
        return res.status(400).json({ error: "Task kodi allaqachon mavjud. Kodni ozgartiring." });
      }
      throw err;
    }

    const taskId = result.lastInsertRowid;

    if (Array.isArray(checklist)) {
      for (const item of checklist) {
        if (!item || !item.text || !String(item.text).trim()) {
          continue;
        }
        await db.run(
          'INSERT INTO checklists (task_id, text, done) VALUES (?, ?, ?)',
          taskId,
          String(item.text).trim(),
          item.done ? 1 : 0
        );
      }
    }

    await db.run(
      'INSERT INTO activity_log (user_id, action, target) VALUES (?, ?, ?)',
      req.user.id,
      'yangi task yaratdi',
      `"${String(title).trim()}"`
    );

    if (assigneeIdNum) {
      await db.run(
        `INSERT INTO notifications (user_id, type, icon, title, description, color)
         VALUES (?, 'task', '\u2705', 'Yangi task biriktildi', ?, 'var(--info-bg)')`,
        assigneeIdNum,
        `"${String(title).trim()}" sizga biriktildi`
      );
    }

    const created = await db.get('SELECT * FROM tasks WHERE id = ?', taskId);
    res.status(201).json(await enrichTask(created));
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task topilmadi.' });
    }

    if (req.user.role === 'employee' && task.assignee_id !== req.user.id) {
      return res.status(403).json({ error: 'Bu task sizga biriktirilmagan.' });
    }

    const {
      title,
      assignee_id,
      assigneeId,
      status,
      priority,
      deadline,
      description,
      desc,
      delay_reason,
      delayReason,
      delay_days,
      delayDays
    } = req.body;

    const nextDescription = description ?? desc ?? task.description;
    const nextDelayReason = delay_reason ?? delayReason ?? task.delay_reason;
    const nextDelayDays = delay_days ?? delayDays ?? task.delay_days;
    const nextAssignee = assignee_id ?? assigneeId ?? task.assignee_id;

    await db.run(
      `UPDATE tasks
       SET title = ?, assignee_id = ?, status = ?, priority = ?, deadline = ?,
           description = ?, delay_reason = ?, delay_days = ?
       WHERE id = ?`,
      title || task.title,
      nextAssignee,
      status || task.status,
      priority || task.priority,
      deadline || task.deadline,
      nextDescription,
      nextDelayReason,
      nextDelayDays,
      req.params.id
    );

    if (status && status !== task.status) {
      await db.run(
        'INSERT INTO activity_log (user_id, action, target) VALUES (?, ?, ?)',
        req.user.id,
        "statusni ozgartirdi",
        `"${task.title}" -> ${status}`
      );
    }

    const updated = await db.get('SELECT * FROM tasks WHERE id = ?', req.params.id);
    res.json(await enrichTask(updated));
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id/status
router.put('/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status kiritilishi shart.' });
    }

    const task = await db.get('SELECT * FROM tasks WHERE id = ?', req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task topilmadi.' });
    }

    await db.run('UPDATE tasks SET status = ? WHERE id = ?', status, req.params.id);
    await db.run(
      'INSERT INTO activity_log (user_id, action, target) VALUES (?, ?, ?)',
      req.user.id,
      "statusni ozgartirdi",
      `"${task.title}" -> ${status}`
    );

    res.json({ message: 'Status yangilandi.', status });
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id/checklist/:checkId
router.put('/:id/checklist/:checkId', authMiddleware, async (req, res, next) => {
  try {
    const { done } = req.body;
    const check = await db.get(
      'SELECT * FROM checklists WHERE id = ? AND task_id = ?',
      req.params.checkId,
      req.params.id
    );

    if (!check) {
      return res.status(404).json({ error: 'Checklist item topilmadi.' });
    }

    await db.run('UPDATE checklists SET done = ? WHERE id = ?', done ? 1 : 0, req.params.checkId);
    res.json({ message: 'Yangilandi.' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id (admin + pm)
router.delete('/:id', authMiddleware, requireRole('admin', 'pm'), async (req, res, next) => {
  try {
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task topilmadi.' });
    }

    await db.run('DELETE FROM tasks WHERE id = ?', req.params.id);
    res.json({ message: `"${task.title}" ochirildi.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
