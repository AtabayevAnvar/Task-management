/* ============================================
   EMPLOYEES — Employee list & cards
   ============================================ */

function renderEmployees() {
  const page = document.getElementById('page-employees');
  
  const roleFilter = { admin: 'Super Admin', pm: 'Project Manager', teamlead: 'Team Lead', employee: 'Developer', hr: 'HR' };

  page.innerHTML = `
    <div class="page-header">
      <h2>Xodimlar <span style="font-size:var(--text-md);color:var(--text-tertiary);font-weight:400">(${USERS.length})</span></h2>
      ${currentRole === 'admin' ? '<button class="btn btn-primary" onclick="openModal(\'modalCreateEmployee\')">+ Xodim qo\'shish</button>' : ''}
    </div>

    <div class="filter-bar">
      <div class="filter-search">
        <img src="assets/icons/sidebar-icons/search-icon.svg" alt="search" width="16" height="16" style="opacity:0.5">
        <input type="search" placeholder="Xodim qidirish..." id="empSearch" name="search_employees" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="search" oninput="filterEmployees()">
      </div>
      <select class="filter-select" id="empRoleFilter" onchange="filterEmployees()">
        <option value="">Barcha rollar</option>
        <option value="admin">Admin</option>
        <option value="pm">PM</option>
        <option value="teamlead">Team Lead</option>
        <option value="employee">Employee</option>
        <option value="hr">HR</option>
      </select>
    </div>

    <div class="employee-grid" id="employeeGrid">
      ${renderEmployeeCards(USERS)}
    </div>
  `;
}

function renderEmployeeCards(users) {
  return users.map(u => {
    const activeTasks = TASKS.filter(t => t.assigneeId === u.id && !['approved','cancelled'].includes(t.status)).length;
    const completedTasks = TASKS.filter(t => t.assigneeId === u.id && t.status === 'approved').length;
    const statusDot = u.status === 'online' ? '🟢' : u.status === 'busy' ? '🟡' : '⚪';
    
    return `
    <div class="employee-card">
      <div class="ec-header">
        <div class="ec-avatar-wrapper">
          <div class="ec-avatar" style="background:${u.color}">${u.initials}</div>
          <span class="ec-status-dot ${u.status}"></span>
        </div>
        <div class="ec-info">
          <div class="ec-name">${u.name}</div>
          <div class="ec-role">${u.position || u.role}</div>
        </div>
        <div class="ec-menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2.5"></circle>
            <circle cx="12" cy="12" r="2.5"></circle>
            <circle cx="12" cy="19" r="2.5"></circle>
          </svg>
        </div>
      </div>
      <div class="ec-stats">
        <div class="ec-stat-box">
          <div class="es-label">Aktiv</div>
          <div class="es-val">${activeTasks}</div>
        </div>
        <div class="ec-stat-box">
          <div class="es-label">Bajarilgan</div>
          <div class="es-val">${completedTasks}</div>
        </div>
        <div class="ec-stat-box">
          <div class="es-label">Loyihalar</div>
          <div class="es-val">${u.projects}</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function filterEmployees() {
  const search = document.getElementById('empSearch')?.value?.toLowerCase() || '';
  const role = document.getElementById('empRoleFilter')?.value || '';
  
  let filtered = USERS;
  if (search) filtered = filtered.filter(u => u.name.toLowerCase().includes(search) || u.position.toLowerCase().includes(search));
  if (role) filtered = filtered.filter(u => u.role === role);
  
  const grid = document.getElementById('employeeGrid');
  if (grid) grid.innerHTML = renderEmployeeCards(filtered);
}
