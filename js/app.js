/* ============================================
   APP — Router, State, Global Functions
   ============================================ */

let currentPage = 'dashboard';
let currentRole = 'employee';
let currentUser = null;

try {
  const _savedUser = API.getUser();
  if (_savedUser && _savedUser.role) {
    currentRole = _savedUser.role;
    currentUser = _savedUser;
  }
} catch(e) {
  API.clearToken();
}

// ── Theme Management ──
function getSavedTheme() {
  return localStorage.getItem('theme') || 'dark'; // dark is default
}

// Persistence handled by API now

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('theme', theme);
}

function toggleTheme() {
  const current = getSavedTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  
  // Update header quick toggle if it exists
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.innerHTML = `<img class="theme-toggle-icon" src="assets/icons/sidebar-icons/${next === 'dark' ? 'sun' : 'moon'}-icon.svg" alt="theme" width="20" height="20">`;

  // also update toggle UI if it's currently on screen
  renderSettings();
  
  return next;
}

// Initial apply
applyTheme(getSavedTheme());

// ── Page Navigation ──
function navigateTo(page, data) {
  currentPage = page;

  // Remove active from all nav items
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');

  // Hide all pages
  document.querySelectorAll('.content-page').forEach(p => p.classList.remove('active'));

  // Show target page
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) {
    pageEl.classList.add('active');
  }

  // Update page title
  const titles = {
    dashboard: 'Dashboard',
    projects: 'Loyihalar',
    'project-detail': 'Loyiha tafsiloti',
    tasks: 'Tasklar',
    calendar: 'Kalendar',
    chat: 'Chat',
    notifications: 'Bildirishnomalar',
    employees: 'Xodimlar',
    feedback: 'Fikr-mulohaza',
    settings: 'Sozlamalar'
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  // Render page content
  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'projects': renderProjects(); break;
    case 'project-detail': renderProjectDetail(data); break;
    case 'tasks': renderTasks(); break;
    case 'calendar': renderCalendar(); break;
    case 'chat': renderChat(); break;
    case 'notifications': renderNotificationsPage(); break;
    case 'employees': renderEmployees(); break;
    case 'feedback': renderFeedback(); break;
    case 'settings': renderSettings(); break;
  }

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
}

// ── Modal Helpers ──
function openModal(id) {
  document.getElementById(id).classList.add('active');
  
  // Specific initializations
  if (id === 'modalCreateProject') {
    renderEmployeeSelect();
  } else if (id === 'modalCreateTask') {
    createTaskAssigneeList();
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// ── Toast Notifications ──
function showToast(message, type = 'info') {
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-msg">${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ── Utility: get user by ID ──
function getUserById(id) {
  return USERS.find(u => u.id === id);
}

// ── Utility: get status info ──
function getStatusInfo(key) {
  return TASK_STATUSES.find(s => s.key === key) || { label: key, color: '#6b7280', bg: 'rgba(107,114,128,0.12)' };
}

// ── Utility: badge HTML ──
function statusBadge(statusKey) {
  const s = getStatusInfo(statusKey);
  return `<span class="badge badge-dot" style="background:${s.bg};color:${s.color}">${s.label}</span>`;
}

function priorityBadge(p) {
  const map = {
    critical: { label: 'Critical', cls: 'priority-critical' },
    high: { label: 'Yuqori', cls: 'priority-high' },
    medium: { label: "O'rtacha", cls: 'priority-medium' },
    low: { label: 'Past', cls: 'priority-low' },
  };
  const info = map[p] || map.medium;
  return `<span class="priority-badge ${info.cls}">${info.label}</span>`;
}

// ── Utility: avatar HTML ──
function avatarHTML(userId, size) {
  const u = getUserById(userId);
  if (!u) return '';
  const s = size || 28;
  return `<div style="width:${s}px;height:${s}px;border-radius:50%;background:${u.color};display:flex;align-items:center;justify-content:center;font-size:${s*0.38}px;font-weight:600;color:#fff;flex-shrink:0">${u.initials}</div>`;
}

// ── Utility: format date ──
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0,0,0,0);
  const d = new Date(dateStr);
  d.setHours(0,0,0,0);
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

// ── Init ──
function initApp() {
  // Sidebar nav
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.dataset.page);
    });
  });

  // Sidebar toggle
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    const sb = document.getElementById('sidebar');
    if (window.innerWidth <= 1024) {
      sb.classList.toggle('open');
    } else {
      sb.classList.toggle('collapsed');
    }
  });

  document.getElementById('sidebarOverlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
  });


  // Notification dropdown
  document.getElementById('notifBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const dd = document.getElementById('notifDropdown');
    dd.classList.toggle('show');
    if (dd.classList.contains('show')) {
      renderNotifDropdown();
    }
  });

  document.addEventListener('click', () => {
    document.getElementById('notifDropdown').classList.remove('show');
  });

  document.getElementById('markAllRead').addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      await API.markAllNotificationsRead();
      NOTIFICATIONS.forEach(n => { n.read = 1; });
      if (typeof updateSidebarCounts === 'function') updateSidebarCounts();
      const dot = document.querySelector('.notif-dot');
      if (dot) dot.style.display = 'none';
      renderNotifDropdown();
      showToast('Barcha bildirishnomalar o\'qildi', 'success');
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error');
    }
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // Render dashboard
  navigateTo('dashboard');
}

function renderNotifDropdown() {
  const list = document.getElementById('notifList');
  list.innerHTML = NOTIFICATIONS.slice(0, 5).map(n => `
    <div class="notif-item ${isNotifUnread(n) ? 'unread' : ''}">
      <div class="notif-icon" style="background:${n.color}">${n.icon}</div>
      <div class="notif-text">
        <p><strong>${n.title}</strong></p>
        <p style="color:var(--text-secondary)">${n.desc}</p>
        <span class="notif-time">${n.time}</span>
      </div>
    </div>
  `).join('');
}

// ── Project/Task CRUD stubs ──
function renderEmployeeSelect() {
  const grid = document.getElementById('projTeamGrid');
  if (!grid) return;
  
  grid.innerHTML = USERS.filter(u => u.role !== 'admin').map(u => `
    <label class="team-member-checkbox">
      <input type="checkbox" name="projMembers" value="${u.id}">
      <div class="tmc-info">
        ${avatarHTML(u.id, 24)}
        <div>
          <div class="name">${u.name}</div>
          <div class="pos">${u.position}</div>
        </div>
      </div>
    </label>
  `).join('');
}

async function createProject() {
  const name = document.getElementById('projName').value;
  const client = document.getElementById('projClient').value || 'Mijoz ko\'rsatilmadi';
  const pm = document.getElementById('projPM').value;
  const start = document.getElementById('projStart').value || new Date().toISOString().split('T')[0];
  const deadline = document.getElementById('projDeadline').value;
  const priority = document.getElementById('projPriority').value;
  const status = document.getElementById('projStatus').value;
  const desc = document.getElementById('projDesc').value || 'Tavsif yo\'q';

  if (!name) { showToast('Loyiha nomini kiriting', 'warning'); return; }
  if (!deadline) { showToast('Deadline sanasini tanlang', 'warning'); return; }

  // Collect selected members
  const selectedIds = Array.from(document.querySelectorAll('input[name="projMembers"]:checked'))
    .map(cb => parseInt(cb.value));

  if (selectedIds.length === 0) {
    showToast('Kamida bitta xodimni biriktiring', 'warning');
    return;
  }

  try {
    const payload = {
      name,
      client,
      pm_id: USERS.find(u => u.name === pm)?.id || currentUser.id,
      status,
      priority,
      start_date: start,
      deadline,
      description: desc,
      team: selectedIds
    };

    const newProj = await API.createProject(payload);

    // Frontendda qo'shib qo'yamiz (realtime qayta o'qib kelish ham mumkin, bu vaqtni tejash uchun arrayga push deymiz)
    newProj.progress = 0;
    newProj.taskCount = 0;
    newProj.completedTasks = 0;
    newProj.files = [];
    newProj.pm = USERS.find(u => u.id === newProj.pmId)?.name || 'Noma\'lum';
    
    PROJECTS.unshift(newProj);
    if (typeof updateSidebarCounts === 'function') updateSidebarCounts();
    
    showToast(`"${name}" loyihasi muvaffaqiyatli yaratildi!`, 'success');
    closeModal('modalCreateProject');
    
    // Refresh projects view
    if (currentPage === 'projects') {
      renderProjects();
    } else {
      navigateTo('projects');
    }

    // Clear form
    document.getElementById('projName').value = '';
    document.getElementById('projClient').value = '';
    document.getElementById('projDesc').value = '';

  } catch (error) {
    showToast(error.message || 'Loyiha yaratishda xatolik yuz berdi', 'error');
  }
}

function createTaskAssigneeList() {
  const projSelect = document.getElementById('taskProject');
  const userSelect = document.getElementById('taskAssignee');
  if (projSelect) {
    projSelect.innerHTML = PROJECTS.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }
  if (userSelect) {
    userSelect.innerHTML = USERS.filter(u => u.role !== 'admin').map(u => `<option value="${u.id}">${u.name}</option>`).join('');
  }
}

async function createTask() {
  const title = document.getElementById('taskName').value;
  const projectId = document.getElementById('taskProject').value;
  const assigneeId = document.getElementById('taskAssignee').value;
  const deadline = document.getElementById('taskDeadline').value;
  const priority = document.getElementById('taskPriority').value;
  const desc = document.getElementById('taskDesc').value;

  if (!title) { showToast('Task nomini kiriting', 'warning'); return; }
  if (!projectId) { showToast('Loyihani tanlang', 'warning'); return; }
  if (!deadline) { showToast('Deadline sanasini tanlang', 'warning'); return; }

  try {
    const payload = {
      title: title.trim(),
      project_id: parseInt(projectId, 10),
      assignee_id: parseInt(assigneeId, 10) || currentUser.id,
      deadline,
      priority,
      description: desc || ''
    };

    const createdTask = await API.createTask(payload);
    const newTask = {
      ...createdTask,
      projectId: createdTask.project_id,
      assigneeId: createdTask.assignee_id,
      delayReason: createdTask.delay_reason,
      delayDays: createdTask.delay_days,
      comments: createdTask.comments_count,
      files: createdTask.files_count,
      checklist: Array.isArray(createdTask.checklist) ? createdTask.checklist : []
    };
    
    TASKS.unshift(newTask);
    if (typeof updateSidebarCounts === 'function') updateSidebarCounts();
    
    // Update local project progress counter
    const p = PROJECTS.find(pr => pr.id === newTask.projectId);
    if (p) p.taskCount++;

    showToast(`"${title}" task yaratildi!`, 'success');
    closeModal('modalCreateTask');
    
    if (currentPage === 'tasks') renderTasks();
    else if (currentPage === 'project-detail') navigateTo('project-detail', newTask.projectId);
    else navigateTo('tasks');

    // Clear form
    document.getElementById('taskName').value = '';
    document.getElementById('taskDesc').value = '';

  } catch (error) {
    showToast(error.message || 'Task yaratishda xatolik yuz berdi', 'error');
  }
}

function submitDelayReason() {
  const reason = document.getElementById('delayCategory').value;
  if (!reason) { showToast('Sababni tanlang', 'warning'); return; }
  showToast('Kechikish sababi saqlandi', 'success');
  closeModal('modalDelayReason');
}

async function submitFeedback() {
  const text = document.getElementById('feedbackText').value;
  const subject = document.getElementById('feedbackSubject') ? document.getElementById('feedbackSubject').value : 'Mijoz fikri';
  const type = document.getElementById('feedbackType') ? document.getElementById('feedbackType').value : 'suggestion';

  if (!text) { showToast('Matn kiriting', 'warning'); return; }

  try {
    await API.createFeedback({ subject, text, type });
    showToast('Fikringiz yuborildi!', 'success');
    closeModal('modalFeedback');
    // Refresh feedback list if on feedback page
    if (currentPage === 'feedback' && typeof renderFeedbackPage === 'function') {
      const fresh = await API.getFeedbacks();
      FEEDBACK_ITEMS.length = 0;
      FEEDBACK_ITEMS.push(...fresh);
      renderFeedbackPage();
    }
  } catch (err) {
    showToast('Xatolik yuz berdi', 'error');
  }
}

async function approveTask(taskId) {
  try {
    await API.updateTaskStatus(taskId, 'approved');
    const t = TASKS.find(x => x.id === taskId);
    if (t) t.status = 'approved';
    showToast('Task tasdiqlandi ✓', 'success');
    closeModal('modalTaskDetail');
    if (typeof renderTaskView === 'function') renderTaskView();
  } catch (error) {
    showToast(error.message || 'Xatolik', 'error');
  }
}

async function rejectTask(taskId) {
  try {
    await API.updateTaskStatus(taskId, 'returned');
    const t = TASKS.find(x => x.id === taskId);
    if (t) t.status = 'returned';
    showToast('Task qaytarildi', 'warning');
    closeModal('modalTaskDetail');
    if (typeof renderTaskView === 'function') renderTaskView();
  } catch (error) {
    showToast(error.message || 'Xatolik', 'error');
  }
}

async function createEmployee() {
  const name = document.getElementById('empName').value;
  const email = document.getElementById('empEmail').value;
  const password = document.getElementById('empPassword').value;
  const role = document.getElementById('empRole').value;
  const position = document.getElementById('empPosition').value;

  if (!name || !email || !password) {
    showToast('Barcha majburiy maydonlarni to\'ldiring', 'warning');
    return;
  }

  try {
    const payload = { name, email, password, role, position };
    const newUser = await API.register(payload);
    
    // Add missing default values for UI rendering
    newUser.tasks = 0;
    newUser.projects = 0;
    newUser.status = 'online'; // registered users are usually set to online logic or just fallback
    
    USERS.push(newUser);
    
    showToast(`"${name}" - yangi xodim qo'shildi!`, 'success');
    closeModal('modalCreateEmployee');
    
    if (currentPage === 'employees') {
      renderEmployees();
    }
    
    // Clear form
    document.getElementById('empName').value = '';
    document.getElementById('empEmail').value = '';
    document.getElementById('empPassword').value = '';
    document.getElementById('empPosition').value = '';
    
  } catch (error) {
    showToast(error.message || 'Xodim qo\'shishda xatolik', 'error');
  }
}
