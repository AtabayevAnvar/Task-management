/* ============================================
   LOGIN — Real API Authentication
   ============================================ */

// Quick login buttons
async function quickLogin(email, password) {
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPassword').value = password;

  const errorDiv = document.getElementById('loginError');
  const submitBtn = document.getElementById('loginSubmitBtn');

  // Loading state
  submitBtn.disabled = true;
  submitBtn.textContent = 'Kirish...';
  if (errorDiv) errorDiv.style.display = 'none';

  try {
    const result = await API.login(email, password);

    currentUser = result.user;
    currentRole = result.user.role;

    // Load cached data
    await loadAppData();

    // Animate out
    const card = document.querySelector('.login-card');
    card.style.transform = 'scale(0.95)';
    card.style.opacity = '0';

    setTimeout(() => {
      document.getElementById('loginPage').classList.add('hidden');
      document.getElementById('appLayout').style.display = 'flex';

      const roleLabels = { admin: 'Super Admin', pm: 'Project Manager', employee: 'Employee' };
      document.getElementById('sidebarUserRole').textContent = roleLabels[currentRole] || currentRole;
      document.getElementById('sidebarUserName').textContent = currentUser.name;

      initApp();
    }, 300);

  } catch (err) {
    if (errorDiv) {
      errorDiv.textContent = err.message || 'Login xatosi';
      errorDiv.style.display = 'block';
    }
    submitBtn.disabled = false;
    submitBtn.textContent = 'Tizimga kirish →';
  }
}

// Show login page
function showLoginPage() {
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('appLayout').style.display = 'none';
  // Clear form
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  if (emailInput) emailInput.value = '';
  if (passInput) passInput.value = '';
}

document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('loginForm');
  const loginPage = document.getElementById('loginPage');
  const appLayout = document.getElementById('appLayout');

  // Safety: ensure login page is visible by default
  if (loginPage) loginPage.classList.remove('hidden');
  if (appLayout) appLayout.style.display = 'none';

  // ── Check if already logged in ──
  const savedToken = API.getToken();
  const savedUser = API.getUser();

  if (savedToken && savedUser) {
    try {
      // Verify token is still valid
      const me = await API.getMe();
      currentUser = me;
      currentRole = me.role;

      // IMPORTANT: Load real data from API on refresh
      await loadAppData();

      // Skip login, go to app
      if (loginPage) loginPage.classList.add('hidden');
      if (appLayout) appLayout.style.display = 'flex';

      const roleLabels = { admin: 'Super Admin', pm: 'Project Manager', teamlead: 'Team Lead', employee: 'Employee', hr: 'HR' };
      document.getElementById('sidebarUserRole').textContent = roleLabels[me.role] || me.role;
      document.getElementById('sidebarUserName').textContent = me.name;

      initApp();
      return;
    } catch (e) {
      // Token expired or invalid — show login
      console.warn('Session expired:', e.message);
      API.clearToken();
      currentUser = null;
      currentRole = 'employee';
      // Make sure login page is visible
      if (loginPage) loginPage.classList.remove('hidden');
      if (appLayout) appLayout.style.display = 'none';
    }
  }

  // ── Login form submit ──
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    const submitBtn = document.getElementById('loginSubmitBtn');

    if (!email || !password) {
      errorDiv.textContent = 'Email va parolni kiriting';
      errorDiv.style.display = 'block';
      return;
    }

    // Loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Kirish...';
    errorDiv.style.display = 'none';

    try {
      const result = await API.login(email, password);

      currentUser = result.user;
      currentRole = result.user.role;

      // Load cached data
      await loadAppData();

      // Animate out
      const card = document.querySelector('.login-card');
      card.style.transform = 'scale(0.95)';
      card.style.opacity = '0';

      setTimeout(() => {
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('appLayout').style.display = 'flex';

        const roleLabels = { admin: 'Super Admin', pm: 'Project Manager', employee: 'Employee' };
        document.getElementById('sidebarUserRole').textContent = roleLabels[currentRole] || currentRole;
        document.getElementById('sidebarUserName').textContent = currentUser.name;

        initApp();
      }, 300);

    } catch (err) {
      errorDiv.textContent = err.message || 'Login xatosi';
      errorDiv.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Tizimga kirish →';
    }
  });
});

// ── Load initial data from API ──
async function loadAppData() {
  try {
    // Load all data in parallel
    const [users, projects, tasks, rooms, notifications, feedback] = await Promise.all([
      API.getUsers(),
      API.getProjects(),
      API.getTasks(),
      API.getChatRooms(),
      API.getNotifications(),
      API.getFeedbacks(),
    ]);

    // Update global data
    USERS.length = 0;
    USERS.push(...users);

    PROJECTS.length = 0;
    PROJECTS.push(...projects);

    TASKS.length = 0;
    TASKS.push(...tasks);

    CHAT_ROOMS.length = 0;
    CHAT_ROOMS.push(...rooms);

    NOTIFICATIONS.length = 0;
    NOTIFICATIONS.push(...notifications);

    FEEDBACK_ITEMS.length = 0;
    FEEDBACK_ITEMS.push(...feedback);

    // Refresh UI badges
    if (typeof updateSidebarCounts === 'function') {
      updateSidebarCounts();
    }

  } catch (err) {
    console.error('Data load error:', err);
  }
}

// ── Calendar Page (shared function) ──
function renderCalendar(container) {
  const target = container || document.getElementById('page-calendar');
  if (!target) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
  const dayNames = ['Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha', 'Ya'];

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  let cells = '';

  dayNames.forEach(d => {
    cells += `<div class="calendar-header-cell">${d}</div>`;
  });

  for (let i = 0; i < startDay; i++) {
    const prevDate = new Date(year, month, -startDay + i + 1);
    cells += `<div class="calendar-cell other-month"><span class="cal-date">${prevDate.getDate()}</span></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = d === now.getDate() && month === now.getMonth();
    const dayTasks = TASKS.filter(t => t.deadline === dateStr);

    cells += `
      <div class="calendar-cell ${isToday ? 'today' : ''}">
        <span class="cal-date">${d}</span>
        ${dayTasks.slice(0, 3).map(t => {
      const s = getStatusInfo(t.status);
      return `<div class="cal-task" style="background:${s.bg};color:${s.color}" onclick="openTaskDetail(${t.id})" title="${t.title}">${t.code}</div>`;
    }).join('')}
        ${dayTasks.length > 3 ? `<div style="font-size:9px;color:var(--text-tertiary)">+${dayTasks.length - 3} ko'proq</div>` : ''}
      </div>
    `;
  }

  const totalCells = startDay + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    cells += `<div class="calendar-cell other-month"><span class="cal-date">${i}</span></div>`;
  }

  const content = `
    ${!container ? `` : ''}
    <div class="card">
      <div class="card-header">
        <span class="card-title">📅 ${monthNames[month]} ${year}</span>
        <div style="display:flex;gap:var(--space-2)">
          <button class="btn btn-ghost btn-sm">← Oldingi</button>
          <button class="btn btn-secondary btn-sm">Bugun</button>
          <button class="btn btn-ghost btn-sm">Keyingi →</button>
        </div>
      </div>
      <div class="calendar-grid">${cells}</div>
    </div>
  `;

  if (container) {
    container.innerHTML = content;
  } else {
    target.innerHTML = content;
  }
}
