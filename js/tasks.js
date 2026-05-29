/* ============================================
   TASKS — Kanban, Table, Calendar, Workload
   ============================================ */

let taskView = 'kanban';
let taskFilter = { status: '', priority: '', search: '', project: '' };

function renderTasks() {
  const page = document.getElementById('page-tasks');

  page.innerHTML = `
    <div class="page-header">
      <h2>Tasklar</h2>
      <div style="display:flex;gap:var(--space-3);align-items:center">
        <div class="view-switcher">
          <button class="view-btn ${taskView==='kanban'?'active':''}" onclick="taskView='kanban';renderTasks()">▦ Kanban</button>
          <button class="view-btn ${taskView==='table'?'active':''}" onclick="taskView='table';renderTasks()">☰ Table</button>
          <button class="view-btn ${taskView==='calendar'?'active':''}" onclick="taskView='calendar';renderTasks()">📅 Calendar</button>
          <button class="view-btn ${taskView==='workload'?'active':''}" onclick="taskView='workload';renderTasks()">👥 Workload</button>
        </div>
        ${currentRole === 'admin' || currentRole === 'pm' ? `<button class="btn btn-primary" onclick="openModal('modalCreateTask')">+ Yangi task</button>` : ''}
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-search">
        <img src="assets/icons/sidebar-icons/search-icon.svg" alt="search" width="16" height="16" style="opacity:0.5">
        <input type="search" placeholder="Task qidirish..." name="search_tasks" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="search" value="${taskFilter.search}" oninput="taskFilter.search=this.value;renderTaskView()">
      </div>
      <select class="filter-select" onchange="taskFilter.status=this.value;renderTaskView()">
        <option value="">Barcha statuslar</option>
        ${TASK_STATUSES.map(s => `<option value="${s.key}" ${taskFilter.status===s.key?'selected':''}>${s.label}</option>`).join('')}
      </select>
      <select class="filter-select" onchange="taskFilter.priority=this.value;renderTaskView()">
        <option value="">Barcha prioritet</option>
        <option value="critical">Critical</option>
        <option value="high">Yuqori</option>
        <option value="medium">O'rtacha</option>
        <option value="low">Past</option>
      </select>
      <select class="filter-select" onchange="taskFilter.project=this.value;renderTaskView()">
        <option value="">Barcha loyihalar</option>
        ${PROJECTS.map(p => `<option value="${p.id}" ${taskFilter.project==p.id?'selected':''}>${p.name}</option>`).join('')}
      </select>
    </div>

    <div id="taskViewContainer"></div>
  `;
  renderTaskView();
}

function getFilteredTasks() {
  return TASKS.filter(t => {
    if (taskFilter.status && t.status !== taskFilter.status) return false;
    if (taskFilter.priority && t.priority !== taskFilter.priority) return false;
    if (taskFilter.project && t.projectId != taskFilter.project) return false;
    if (taskFilter.search && !t.title.toLowerCase().includes(taskFilter.search.toLowerCase())) return false;
    return true;
  });
}

function renderTaskView() {
  const container = document.getElementById('taskViewContainer');
  if (!container) return;
  switch (taskView) {
    case 'kanban': renderKanban(container); break;
    case 'table': renderTaskTable(container); break;
    case 'calendar': renderCalendar(container); break;
    case 'workload': renderWorkload(container); break;
  }
}

function renderKanban(container) {
  const tasks = getFilteredTasks();
  const cols = ['new', 'progress', 'review', 'approved', 'returned', 'delayed'];
  
  container.innerHTML = `
    <div class="kanban-board">
      ${cols.map(status => {
        const s = getStatusInfo(status);
        const colTasks = tasks.filter(t => t.status === status);
        return `
        <div class="kanban-column" data-status="${status}">
          <div class="kanban-column-header">
            <div style="display:flex;align-items:center">
              <span class="col-indicator" style="background:${s.color}"></span>
              <span class="col-title">${s.label}</span>
            </div>
            <span class="col-count">${colTasks.length}</span>
          </div>
          <div class="kanban-cards" data-status="${status}">
            ${colTasks.map(t => {
              const u = getUserById(t.assigneeId);
              const proj = PROJECTS.find(p => p.id === t.projectId);
              const days = daysUntil(t.deadline);
              const checkDone = t.checklist.filter(c => c.done).length;
              return `
              <div class="kanban-card" draggable="true" data-task-id="${t.id}" onclick="onKanbanCardClick(event, ${t.id})" style="view-transition-name: task-card-${t.id}">
                <div class="kc-header">
                  <span class="kc-code">${t.code}</span>
                  ${priorityBadge(t.priority)}
                </div>
                <div class="kc-title">${t.title}</div>
                ${t.checklist.length ? `
                <div style="margin-bottom:var(--space-2)">
                  <div class="progress-bar" style="height:4px">
                    <div class="progress-fill" style="width:${(checkDone/t.checklist.length)*100}%"></div>
                  </div>
                  <span style="font-size:var(--text-xs);color:var(--text-tertiary)">${checkDone}/${t.checklist.length}</span>
                </div>` : ''}
                <div class="kc-footer">
                  <div class="kc-meta">
                    ${u ? avatarHTML(t.assigneeId, 22) : ''}
                    <span>${proj ? proj.name.split(' ')[0] : ''}</span>
                  </div>
                  <div class="kc-meta">
                    ${t.comments ? `<span>💬 ${t.comments}</span>` : ''}
                    ${t.files ? `<span>📎 ${t.files}</span>` : ''}
                    <span style="color:${days < 0 ? 'var(--error)' : days <= 3 ? 'var(--warning)' : 'var(--text-tertiary)'}">${formatDate(t.deadline)}</span>
                  </div>
                </div>
              </div>`;
            }).join('') || `<div class="kanban-empty-placeholder" style="text-align:center;padding:var(--space-6);color:var(--text-tertiary);font-size:var(--text-sm)">Task yo'q</div>`}
          </div>
        </div>`;
      }).join('')}
    </div>
  `;

  // ── Drag & Drop Setup ──
  initKanbanDragDrop();
}

let draggedTaskId = null;
let isDragging = false;

function onKanbanCardClick(event, taskId) {
  // Don't open detail if we just finished dragging
  if (isDragging) {
    isDragging = false;
    event.stopPropagation();
    return;
  }
  openTaskDetail(taskId);
}

function initKanbanDragDrop() {
  const cards = document.querySelectorAll('.kanban-card[draggable]');
  const dropZones = document.querySelectorAll('.kanban-cards[data-status]');

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedTaskId = parseInt(card.dataset.taskId);
      isDragging = true;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.dataset.taskId);
      
      // Use setTimeout so the dragged image retains original styles, but the placeholder card gets the dragging style
      setTimeout(() => {
        card.classList.add('is-dragging');
        dropZones.forEach(zone => {
          zone.classList.add('drag-active');
        });
      }, 0);
    });

    card.addEventListener('dragend', (e) => {
      card.classList.remove('is-dragging');
      dropZones.forEach(zone => {
        zone.classList.remove('drag-active', 'drag-over');
      });
      // Reset dragging flag after a short delay so click handler can check it
      setTimeout(() => { isDragging = false; }, 100);
    });
  });

  dropZones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', (e) => {
      // Only remove highlight if we actually left the zone
      if (!zone.contains(e.relatedTarget)) {
        zone.classList.remove('drag-over');
      }
    });

    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      zone.classList.remove('drag-active', 'drag-over');

      const taskId = parseInt(e.dataTransfer.getData('text/plain'));
      const newStatus = zone.dataset.status;
      
      if (!taskId || !newStatus) return;

      const task = TASKS.find(t => t.id === taskId);
      if (!task || task.status === newStatus) return;

      const oldStatus = task.status;
      const oldInfo = getStatusInfo(oldStatus);
      const newInfo = getStatusInfo(newStatus);

      try {
        await API.updateTaskStatus(taskId, newStatus);
        
        // Update task status
        task.status = newStatus;
        
        showToast(`"${task.code}" — ${oldInfo.label} → ${newInfo.label}`, 'success');
        
        // Re-render kanban with View Transitions for WOW effect
        const container = document.getElementById('taskViewContainer');
        if (container) {
          if (document.startViewTransition) {
            document.startViewTransition(() => renderKanban(container));
          } else {
            renderKanban(container);
          }
        }
      } catch (error) {
        showToast(error.message || 'Statusni o\'zgartirib bo\'lmadi', 'error');
      }
    });
  });
}

function renderTaskTable(container) {
  const tasks = getFilteredTasks();
  container.innerHTML = `
    <div style="overflow-x:auto">
      <table class="data-table">
        <thead>
          <tr>
            <th>Kod</th>
            <th>Task nomi</th>
            <th>Loyiha</th>
            <th>Mas'ul</th>
            <th>Status</th>
            <th>Prioritet</th>
            <th>Deadline</th>
            <th>Checklist</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map(t => {
            const u = getUserById(t.assigneeId);
            const proj = PROJECTS.find(p => p.id === t.projectId);
            const days = daysUntil(t.deadline);
            const checkDone = t.checklist.filter(c => c.done).length;
            return `
            <tr style="cursor:pointer" onclick="openTaskDetail(${t.id})">
              <td><code style="font-size:var(--text-xs);color:var(--text-tertiary)">${t.code}</code></td>
              <td><strong>${t.title}</strong></td>
              <td style="font-size:var(--text-xs);color:var(--text-secondary)">${proj ? proj.name : '—'}</td>
              <td><div class="user-cell">${u ? avatarHTML(t.assigneeId, 24) : ''}${u ? u.name.split(' ')[0] : '—'}</div></td>
              <td>${statusBadge(t.status)}</td>
              <td>${priorityBadge(t.priority)}</td>
              <td style="color:${days < 0 ? 'var(--error)' : days <= 3 ? 'var(--warning)' : 'var(--text-secondary)'}">
                ${formatDate(t.deadline)}
                ${days < 0 ? `<br><span style="font-size:var(--text-xs)">${Math.abs(days)}d late</span>` : ''}
              </td>
              <td>
                <span style="font-size:var(--text-xs);color:var(--text-secondary)">${checkDone}/${t.checklist.length}</span>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderWorkload(container) {
  const workers = USERS.filter(u => u.role === 'employee' || u.role === 'teamlead');
  const tasks = getFilteredTasks();
  
  container.innerHTML = `
    <div class="workload-grid">
      ${workers.map(w => {
        const wTasks = tasks.filter(t => t.assigneeId === w.id);
        const statusCounts = {};
        wTasks.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
        const total = wTasks.length;
        return `
        <div class="workload-row">
          <div class="wr-user">
            ${avatarHTML(w.id, 32)}
            <div>
              <div style="font-size:var(--text-sm);font-weight:var(--weight-semibold)">${w.name}</div>
              <div style="font-size:var(--text-xs);color:var(--text-tertiary)">${w.position}</div>
            </div>
          </div>
          <div class="wr-bar">
            ${Object.entries(statusCounts).map(([status, count]) => {
              const s = getStatusInfo(status);
              const width = total ? (count / Math.max(total, 1)) * 100 : 0;
              return `<div class="wr-segment" style="background:${s.color};width:${width}%" title="${s.label}: ${count}"></div>`;
            }).join('')}
            ${total === 0 ? '<div style="flex:1;background:var(--bg-elevated);border-radius:var(--radius-sm)"></div>' : ''}
          </div>
          <div class="wr-count">${total} task</div>
        </div>`;
      }).join('')}
    </div>
  `;
}

function openTaskDetail(taskId) {
  const t = TASKS.find(task => task.id === taskId);
  if (!t) return;
  
  const u = getUserById(t.assigneeId);
  const proj = PROJECTS.find(p => p.id === t.projectId);
  const days = daysUntil(t.deadline);
  const checkDone = t.checklist.filter(c => c.done).length;

  document.getElementById('taskDetailTitle').textContent = `${t.code} — ${t.title}`;

  const body = document.getElementById('taskDetailBody');
  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);margin-bottom:var(--space-5)">
      <div class="pd-info-item">
        <div class="label">Status</div>
        <div class="value">${statusBadge(t.status)}</div>
      </div>
      <div class="pd-info-item">
        <div class="label">Prioritet</div>
        <div class="value">${priorityBadge(t.priority)}</div>
      </div>
      <div class="pd-info-item">
        <div class="label">Mas'ul</div>
        <div class="value" style="display:flex;align-items:center;gap:var(--space-2)">${u ? avatarHTML(t.assigneeId, 24) : ''}${u ? u.name : '—'}</div>
      </div>
      <div class="pd-info-item">
        <div class="label">Deadline</div>
        <div class="value" style="color:${days < 0 ? 'var(--error)' : 'var(--text-primary)'}">
          ${formatDate(t.deadline)}
          ${days < 0 ? ` (${Math.abs(days)} kun kechikmoqda)` : days <= 3 ? ` (${days} kun qoldi)` : ''}
        </div>
      </div>
      <div class="pd-info-item">
        <div class="label">Loyiha</div>
        <div class="value">${proj ? proj.name : '—'}</div>
      </div>
      <div class="pd-info-item">
        <div class="label">Fayllar / Izohlar</div>
        <div class="value">📎 ${t.files || 0} · 💬 ${t.comments || 0}</div>
      </div>
    </div>

    ${t.desc ? `<div style="margin-bottom:var(--space-5)"><h4 style="margin-bottom:var(--space-2)">Tavsif</h4><p style="color:var(--text-secondary);line-height:var(--leading-relaxed)">${t.desc}</p></div>` : ''}

    ${t.delayReason ? `
      <div class="alert alert-error" style="margin-bottom:var(--space-5)">
        <span>⚠️</span>
        <div>
          <strong>Kechikish sababi:</strong><br>
          ${t.delayReason}<br>
          <span style="font-size:var(--text-xs);margin-top:var(--space-1);display:block">${t.delayDays} kun kechikmoqda</span>
        </div>
      </div>
    ` : ''}

    <div style="margin-bottom:var(--space-5)">
      <h4 style="margin-bottom:var(--space-3)">Checklist (${checkDone}/${t.checklist.length})</h4>
      <div class="progress-bar" style="margin-bottom:var(--space-3)">
        <div class="progress-fill" style="width:${t.checklist.length ? (checkDone/t.checklist.length)*100 : 0}%"></div>
      </div>
      ${t.checklist.map(c => `
        <div class="checklist-item ${c.done ? 'done' : ''}">
          <input type="checkbox" ${c.done ? 'checked' : ''} disabled>
          <span class="check-text">${c.text}</span>
        </div>
      `).join('')}
    </div>

    ${t.status === 'delayed' || (days !== null && days < 0) ? `
      <button class="btn btn-danger" style="margin-top:var(--space-3)" onclick="openDelayModal(${t.id})">⚠️ Kechikish sababini qayd qilish</button>
    ` : ''}
  `;

  // Show approve/reject buttons for PM role on review tasks
  const approveBtn = document.getElementById('taskApproveBtn');
  const rejectBtn = document.getElementById('taskRejectBtn');
  
  if ((currentRole === 'pm' || currentRole === 'admin') && t.status === 'review') {
    approveBtn.style.display = 'inline-flex';
    rejectBtn.style.display = 'inline-flex';
    approveBtn.onclick = () => approveTask(t.id);
    rejectBtn.onclick = () => rejectTask(t.id);
  } else {
    approveBtn.style.display = 'none';
    rejectBtn.style.display = 'none';
  }

  openModal('modalTaskDetail');
}

function openDelayModal(taskId) {
  const t = TASKS.find(task => task.id === taskId);
  if (!t) return;
  const days = daysUntil(t.deadline);
  
  document.getElementById('delayInfo').innerHTML = `
    <div class="di-item">
      <div class="di-label">Task</div>
      <div class="di-value" style="color:var(--text-primary)">${t.title}</div>
    </div>
    <div class="di-item">
      <div class="di-label">Asl deadline</div>
      <div class="di-value">${formatDate(t.deadline)}</div>
    </div>
    <div class="di-item">
      <div class="di-label">Kechikish</div>
      <div class="di-value">${days < 0 ? Math.abs(days) + ' kun' : '—'}</div>
    </div>
    <div class="di-item">
      <div class="di-label">Mas'ul</div>
      <div class="di-value" style="color:var(--text-primary)">${getUserById(t.assigneeId)?.name || '—'}</div>
    </div>
  `;

  closeModal('modalTaskDetail');
  openModal('modalDelayReason');
}
