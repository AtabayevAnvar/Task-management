/* ============================================
   PROJECTS — List + Detail
   ============================================ */

let projectFilter = { status: '', priority: '', search: '' };

function renderProjects() {
  const page = document.getElementById('page-projects');
  let filtered = PROJECTS.filter(p => {
    if (projectFilter.status && p.status !== projectFilter.status) return false;
    if (projectFilter.priority && p.priority !== projectFilter.priority) return false;
    if (projectFilter.search && !p.name.toLowerCase().includes(projectFilter.search.toLowerCase())) return false;
    return true;
  });

  page.innerHTML = `
    <div class="filter-bar">
      <div class="filter-search">
        <img src="assets/icons/sidebar-icons/search-icon.svg" alt="search" width="16" height="16" style="opacity:0.5">
        <input type="search" placeholder="Loyiha qidirish..." id="projSearch" name="search_projects" autocomplete="new-password" readonly onfocus="this.removeAttribute('readonly');" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="search" value="${projectFilter.search}" oninput="projectFilter.search=this.value;renderProjects()">
      </div>
      <select class="filter-select" id="filterProjStatus" onchange="projectFilter.status=this.value;renderProjects()">
        <option value="">Barcha statuslar</option>
        <option value="new" ${projectFilter.status === 'new' ? 'selected' : ''}>Yangi</option>
        <option value="progress" ${projectFilter.status === 'progress' ? 'selected' : ''}>Jarayonda</option>
        <option value="review" ${projectFilter.status === 'review' ? 'selected' : ''}>Review</option>
        <option value="approved" ${projectFilter.status === 'approved' ? 'selected' : ''}>Tasdiqlangan</option>
        <option value="delayed" ${projectFilter.status === 'delayed' ? 'selected' : ''}>Kechikkan</option>
      </select>
      <select class="filter-select" onchange="projectFilter.priority=this.value;renderProjects()">
        <option value="">Barcha prioritet</option>
        <option value="critical" ${projectFilter.priority === 'critical' ? 'selected' : ''}>Critical</option>
        <option value="high" ${projectFilter.priority === 'high' ? 'selected' : ''}>Yuqori</option>
        <option value="medium" ${projectFilter.priority === 'medium' ? 'selected' : ''}>O'rtacha</option>
        <option value="low" ${projectFilter.priority === 'low' ? 'selected' : ''}>Past</option>
      </select>
      ${currentRole === 'admin' || currentRole === 'pm' ? `<button class="btn btn-primary" style="margin-left:auto" onclick="openModal('modalCreateProject')">+ Yangi loyiha</button>` : `<div style="margin-left:auto"></div>`}
    </div>

    <div class="project-grid">
      ${filtered.map(p => {
    const days = daysUntil(p.deadline);
    const overdue = days !== null && days < 0;
    return `
        <div class="project-card" onclick="navigateTo('project-detail',${p.id})">
          <div class="pc-header">
            <div>
              <div class="pc-title">${p.name}</div>
              <div class="pc-client">${p.client}</div>
            </div>
            ${priorityBadge(p.priority)}
          </div>
          <div class="pc-progress">
            <div class="progress-label">
              <span>Progress</span>
              <span>${p.progress}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${p.progress}%"></div>
            </div>
          </div>
          <div class="pc-footer">
            <div class="pc-meta">
              <span>👤 ${p.pm.split(' ')[0]}</span>
              <span>👥 ${p.team.length}</span>
              <span>📋 ${p.completedTasks}/${p.taskCount}</span>
            </div>
            <div style="display:flex;align-items:center;gap:var(--space-2)">
              ${statusBadge(p.status)}
              ${overdue ? `<span style="font-size:var(--text-xs);color:var(--error)">${Math.abs(days)}d late</span>` :
        days !== null && days <= 7 ? `<span style="font-size:var(--text-xs);color:var(--warning)">${days}d</span>` : ''}
            </div>
          </div>
        </div>
      `}).join('')}
    </div>
  `;
}

function renderProjectDetail(projectId) {
  const page = document.getElementById('page-project-detail');
  const p = PROJECTS.find(pr => pr.id === projectId);
  if (!p) { navigateTo('projects'); return; }

  const projectTasks = TASKS.filter(t => t.projectId === p.id);
  const days = daysUntil(p.deadline);

  page.innerHTML = `
    <div style="margin-bottom:var(--space-4)">
      <button class="btn btn-ghost" onclick="navigateTo('projects')">← Loyihalarga qaytish</button>
    </div>

    <div class="project-detail-header">
      <div class="pd-info">
        <h2>${p.name} ${statusBadge(p.status)} ${priorityBadge(p.priority)}</h2>
        <div class="pd-meta">
          <span>👤 ${p.pm}</span>
          <span>📅 ${formatDate(p.start)} — ${formatDate(p.deadline)}</span>
          <span>👥 ${p.team.length} a'zo</span>
          ${days !== null && days < 0 ? `<span style="color:var(--error)">⚠️ ${Math.abs(days)} kun kechikmoqda</span>` : ''}
        </div>
      </div>
      <div style="display:flex;gap:var(--space-2); align-items:center;">
        ${currentRole === 'admin' ? `<button class="btn btn-danger" onclick="deleteProject(${p.id})">🗑 O'chirish</button>` : ''}
        ${currentRole === 'admin' || currentRole === 'pm' ? `<button class="btn btn-secondary" onclick="openModal('modalCreateTask')">+ Task qo'shish</button>` : ''}
      </div>
    </div>

    <div class="pd-info-grid">
      <div class="pd-info-item">
        <div class="label">Progress</div>
        <div class="value">${p.progress}%</div>
        <div class="progress-bar" style="margin-top:var(--space-2)">
          <div class="progress-fill" style="width:${p.progress}%"></div>
        </div>
      </div>
      <div class="pd-info-item">
        <div class="label">Jami tasklar</div>
        <div class="value">${p.taskCount}</div>
      </div>
      <div class="pd-info-item">
        <div class="label">Bajarilgan</div>
        <div class="value" style="color:var(--success)">${p.completedTasks}</div>
      </div>
      <div class="pd-info-item">
        <div class="label">Deadline</div>
        <div class="value" style="color:${days < 0 ? 'var(--error)' : days <= 7 ? 'var(--warning)' : 'var(--text-primary)'}">${formatDate(p.deadline)}</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs" id="pdTabs">
      <button class="tab-btn active" data-tab="pd-tasks">📋 Tasklar (${projectTasks.length})</button>
      <button class="tab-btn" data-tab="pd-info">ℹ️ Ma'lumot</button>
      <button class="tab-btn" data-tab="pd-files">📎 TZ / Fayllar (${p.files.length})</button>
      <button class="tab-btn" data-tab="pd-team">👥 Jamoa (${p.team.length})</button>
    </div>

    <div class="tab-content active" id="pd-tasks">
      ${projectTasks.length ? `
        <table class="data-table">
          <thead>
            <tr>
              <th>Kod</th>
              <th>Task</th>
              <th>Mas'ul</th>
              <th>Status</th>
              <th>Prioritet</th>
              <th>Deadline</th>
            </tr>
          </thead>
          <tbody>
            ${projectTasks.map(t => {
    const u = getUserById(t.assigneeId);
    return `
              <tr style="cursor:pointer" onclick="openTaskDetail(${t.id})">
                <td><code style="font-size:var(--text-xs);color:var(--text-tertiary)">${t.code}</code></td>
                <td><strong>${t.title}</strong></td>
                <td><div class="user-cell">${avatarHTML(t.assigneeId, 24)}<span>${u ? u.name.split(' ')[0] : '—'}</span></div></td>
                <td>${statusBadge(t.status)}</td>
                <td>${priorityBadge(t.priority)}</td>
                <td style="color:${daysUntil(t.deadline) < 0 ? 'var(--error)' : 'var(--text-secondary)'}">${formatDate(t.deadline)}</td>
              </tr>`;
  }).join('')}
          </tbody>
        </table>
      ` : '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">Tasklar yo\'q</div></div>'}
    </div>

    <div class="tab-content" id="pd-info">
      <div class="card" style="max-width:640px">
        <h3 style="margin-bottom:var(--space-3)">Loyiha tavsifi</h3>
        <p style="color:var(--text-secondary);line-height:var(--leading-relaxed)">${p.desc}</p>
      </div>
    </div>

    <div class="tab-content" id="pd-files">
      ${p.files.length ? `
        <div class="file-list">
          ${p.files.map(f => `
            <div class="file-item">
              <div class="fi-icon" style="background:var(--info-bg);color:var(--info)">📄</div>
              <div class="fi-info">
                <div class="fi-name">${f.name}</div>
                <div class="fi-meta">${f.size} · ${f.date} · ${f.author}</div>
              </div>
              <div class="fi-actions">
                <button class="btn btn-ghost btn-sm">👁️</button>
                <button class="btn btn-ghost btn-sm">⬇️</button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      <div class="upload-area" style="margin-top:var(--space-4)" onclick="showToast('Fayl yuklash demo','info')">
        <div class="upload-icon">📤</div>
        <div class="upload-text">TZ yoki boshqa faylni yuklang</div>
        <div class="upload-hint">PDF, DOCX, XLSX, PNG, ZIP — max 50MB</div>
      </div>
    </div>

    <div class="tab-content" id="pd-team">
      <div class="employee-grid">
        ${p.team.map(uid => {
    const u = getUserById(uid);
    if (!u) return '';
    const uTasks = TASKS.filter(t => t.assigneeId === uid && t.projectId === p.id);
    return `
          <div class="employee-card">
            <div class="ec-avatar" style="background:${u.color}">${u.initials}</div>
            <div class="ec-name">${u.name}</div>
            <div class="ec-role">${u.position}</div>
            <div class="ec-stats">
              <div class="ec-stat"><div class="es-val">${uTasks.length}</div><div class="es-label">Tasklar</div></div>
              <div class="ec-stat"><div class="es-val">${uTasks.filter(t => t.status === 'approved').length}</div><div class="es-label">Bajarilgan</div></div>
            </div>
          </div>`;
  }).join('')}
      </div>
    </div>
  `;

  // Tab switching
  document.querySelectorAll('#pdTabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#pdTabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('#page-project-detail .tab-content').forEach(tc => tc.classList.remove('active'));
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });
}

async function deleteProject(projectId) {
  if (!confirm("Haqiqatan ham bu loyihani o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.")) return;

  try {
    // API orqali o'chirish
    await API.deleteProject(projectId);

    // Frontend-dan o'chirish
    const idx = PROJECTS.findIndex(p => p.id === projectId);
    if (idx !== -1) {
      PROJECTS.splice(idx, 1);
    }

    // Tasklarini ham tozalash (reassignment hatosi oldini olish uchun)
    const filteredTasks = TASKS.filter(t => t.projectId !== projectId);
    TASKS.length = 0;
    TASKS.push(...filteredTasks);

    if (typeof updateSidebarCounts === 'function') updateSidebarCounts();

    showToast("Loyiha muvaffaqiyatli o'chirildi", "success");
    navigateTo('projects');
  } catch (err) {
    showToast(err.message || 'Xatolik yuz berdi', 'error');
  }
}
