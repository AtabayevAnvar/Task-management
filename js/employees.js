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
        ${currentRole === 'admin' ? `
        <div class="ec-menu" onclick="toggleEmpMenu(event, ${u.id})">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2.5"></circle>
            <circle cx="12" cy="12" r="2.5"></circle>
            <circle cx="12" cy="19" r="2.5"></circle>
          </svg>
          <div class="ec-dropdown" id="empDropdown-${u.id}">
            <div class="ec-dropdown-item" onclick="editEmployee(${u.id})">
              ✏️ Tahrirlash
            </div>
            <div class="ec-dropdown-item text-danger" onclick="deleteEmployee(${u.id})">
              🗑️ O'chirish
            </div>
          </div>
        </div>
        ` : ''}
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

// ── Dropdown and actions ──
function toggleEmpMenu(e, id) {
  e.stopPropagation();
  // Close others
  document.querySelectorAll('.ec-dropdown').forEach(el => {
    if(el.id !== `empDropdown-${id}`) el.classList.remove('show');
  });
  const dd = document.getElementById(`empDropdown-${id}`);
  if(dd) dd.classList.toggle('show');
}

document.addEventListener('click', () => {
  document.querySelectorAll('.ec-dropdown').forEach(el => el.classList.remove('show'));
});

function editEmployee(id) {
  const user = USERS.find(u => u.id === id);
  if (!user) return;
  
  const modal = document.getElementById('modalEditEmployee');
  if (!modal) {
    showToast('Xatolik: Modal topilmadi', 'error');
    return;
  }
  
  document.getElementById('editEmpId').value = user.id;
  document.getElementById('editEmpName').value = user.name;
  document.getElementById('editEmpEmail').value = user.email || '';
  document.getElementById('editEmpRole').value = user.role;
  document.getElementById('editEmpPosition').value = user.position || '';
  document.getElementById('editEmpPassword').value = '';
  
  openModal('modalEditEmployee');
  
  const dd = document.getElementById(`empDropdown-${id}`);
  if(dd) dd.classList.remove('show');
}

async function updateEmployee() {
  const id = document.getElementById('editEmpId').value;
  const name = document.getElementById('editEmpName').value.trim();
  const email = document.getElementById('editEmpEmail').value.trim();
  const password = document.getElementById('editEmpPassword').value;
  const role = document.getElementById('editEmpRole').value;
  const position = document.getElementById('editEmpPosition').value.trim();

  if (!name || !email) {
    showToast("Ism va email kiritilishi shart", "warning");
    return;
  }

  try {
    const payload = { name, email, role, position };
    if (password) payload.password = password;

    await API.updateUser(id, payload);

    // Update local data
    const idx = USERS.findIndex(u => u.id == id);
    if (idx !== -1) {
      USERS[idx] = { ...USERS[idx], ...payload };
    }
    
    showToast("Xodim muvaffaqiyatli tahrirlandi!", "success");
    closeModal('modalEditEmployee');
    renderEmployees();
  } catch (error) {
    showToast(error.message || "Xatolik yuz berdi", "error");
  }
}

async function deleteEmployee(id) {
  if (confirm("Bu amalni orqaga qaytarib bo'lmaydi. Rostdan ham ushbu xodimni o'chirmoqchimisiz?")) {
    try {
      await API.deleteUser(id);
      
      const idx = USERS.findIndex(u => u.id == id);
      if (idx !== -1) {
        USERS.splice(idx, 1);
      }
      renderEmployees();
      showToast("Xodim o'chirildi", 'success');
    } catch (error) {
      showToast(error.message || "O'chirishda xatolik yuz berdi", "error");
    }
  }
}
