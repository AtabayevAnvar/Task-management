/* ============================================
   DASHBOARD — Role-based dashboard rendering
   ============================================ */

function renderDashboard() {
  const page = document.getElementById('page-dashboard');
  const activeProjCount = PROJECTS.filter(p => p.status === 'progress').length;
  const delayedTasks = TASKS.filter(t => t.status === 'delayed').length;
  const reviewTasks = TASKS.filter(t => t.status === 'review').length;
  const todayDeadlines = TASKS.filter(t => daysUntil(t.deadline) === 0).length;
  const totalTasks = TASKS.length;
  const completedTasks = TASKS.filter(t => t.status === 'approved').length;

  const roleLabel = currentRole === 'employee' ? 'Mening tasklarim' :
    currentRole === 'pm' ? 'PM Dashboard' :
      currentRole === 'hr' ? 'HR Overview' : 'Umumiy statistika';

  page.innerHTML = `
    <!-- Stat Cards -->
    <div class="dashboard-grid">
      <div class="stat-card">
       
        <div class="stat-info">
          <div class="stat-value">${PROJECTS.length}</div>
          <div class="stat-label">Jami loyihalar</div>
          <div class="stat-change positive">↑ 2 yangi</div>
        </div>
      </div>
      <div class="stat-card">
        
        <div class="stat-info">
          <div class="stat-value">${activeProjCount}</div>
          <div class="stat-label">Aktiv loyihalar</div>
        </div>
      </div>
      <div class="stat-card">
       
        <div class="stat-info">
          <div class="stat-value">${delayedTasks}</div>
          <div class="stat-label">Kechikayotgan tasklar</div>
          <div class="stat-change negative">↑ 1 yangi</div>
        </div>
      </div>
      <div class="stat-card">
       
        <div class="stat-info">
          <div class="stat-value">${reviewTasks}</div>
          <div class="stat-label">Review kutilmoqda</div>
        </div>
      </div>
    </div>

    <!-- Progress Overview + Deadlines -->
    <div class="dashboard-row">
      <div class="card" style="display:flex; flex-direction:column; min-height:300px">
        <div class="card-header">
          <span class="card-title">Loyihalar jarayoni</span>
        </div>
        <div class="chart-bars" style="flex:1; align-items:flex-end; padding-bottom:var(--space-2)">
          ${PROJECTS.slice(0, 6).map(p => `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:var(--space-1)">
              <span style="font-size:var(--text-xs);color:var(--text-secondary)">${p.progress}%</span>
              <div style="width:100%;height:${p.progress * 1.5}px;background:linear-gradient(to top,var(--primary-600),var(--accent-500));border-radius:var(--radius-sm) var(--radius-sm) 0 0;min-height:4px;transition:height 0.5s ease"></div>
              <span style="font-size:9px;color:var(--text-tertiary);text-align:center;max-width:50px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name.split(' ')[0]}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">Bugungi deadline lar</span>
          <span class="badge badge-delayed">${todayDeadlines || 'Yo\'q'}</span>
        </div>
        <div class="deadline-list">
          ${TASKS.filter(t => {
    const d = daysUntil(t.deadline);
    return d !== null && d <= 3;
  }).slice(0, 5).map(t => {
    const d = daysUntil(t.deadline);
    const overdue = d < 0;
    return `
            <div class="deadline-item ${overdue ? 'overdue' : ''}">
              <span class="dl-time">${overdue ? Math.abs(d) + ' kun kechikdi' : d === 0 ? 'Bugun' : d + ' kun'}</span>
              <span class="dl-title">${t.title}</span>
              ${statusBadge(t.status)}
            </div>`;
  }).join('') || '<div class="empty-state" style="padding:var(--space-6)"><div class="empty-icon">📅</div><div class="empty-title">Deadline yo\'q</div></div>'}
        </div>
      </div>
    </div>

    <!-- Activity Feed + Team Workload -->
    <div class="dashboard-row-equal">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Activity Feed</span>
        </div>
        <div class="activity-feed">
          ${ACTIVITY_FEED.map(a => {
    const u = getUserById(a.userId);
    return `
            <div class="activity-item">
              <div class="act-avatar" style="background:${u.color}">${u.initials}</div>
              <div class="act-content">
                <p><strong>${u.name}</strong> ${a.action} ${a.target}</p>
                <span class="act-time">${a.time}</span>
              </div>
            </div>`;
  }).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">Xodimlar bandligi</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-3)">
          ${USERS.filter(u => ['employee', 'teamlead'].includes(u.role)).slice(0, 6).map(u => {
    const taskCount = TASKS.filter(t => t.assigneeId === u.id && t.status !== 'approved' && t.status !== 'cancelled').length;
    const barWidth = Math.min(taskCount * 15, 100);
    const barColor = barWidth > 70 ? 'var(--error)' : barWidth > 40 ? 'var(--warning)' : 'var(--success)';
    return `
            <div style="display:flex;align-items:center;gap:var(--space-3)">
              <div style="display:flex;align-items:center;gap:var(--space-2);min-width:130px">
                ${avatarHTML(u.id, 24)}
                <span style="font-size:var(--text-sm)">${u.name.split(' ')[0]}</span>
              </div>
              <div style="flex:1;height:8px;background:var(--bg-tertiary);border-radius:var(--radius-full);overflow:hidden">
                <div style="height:100%;width:${barWidth}%;background:${barColor};border-radius:var(--radius-full);transition:width 0.5s ease"></div>
              </div>
              <span style="font-size:var(--text-xs);color:var(--text-secondary);min-width:50px">${taskCount} task</span>
            </div>`;
  }).join('')}
        </div>
      </div>
    </div>

    <!-- Task Status Distribution -->
    <div class="card" style="margin-top:var(--space-4)">
      <div class="card-header">
        <span class="card-title">Task statuslari</span>
        <span style="font-size:var(--text-sm);color:var(--text-secondary)">Jami: ${totalTasks} task</span>
      </div>
      <div style="display:flex;gap:var(--space-3);flex-wrap:wrap">
        ${TASK_STATUSES.map(s => {
    const count = TASKS.filter(t => t.status === s.key).length;
    if (count === 0) return '';
    return `
          <div style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);background:${s.bg};border-radius:var(--radius-lg);cursor:pointer" onclick="navigateTo('tasks')">
            <span style="width:8px;height:8px;border-radius:50%;background:${s.color}"></span>
            <span style="font-size:var(--text-sm);color:${s.color}">${s.label}</span>
            <strong style="font-size:var(--text-sm);color:${s.color}">${count}</strong>
          </div>`;
  }).join('')}
      </div>
    </div>
  `;
}
