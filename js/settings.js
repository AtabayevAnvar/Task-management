/* ============================================
   SETTINGS — Profile & System Configuration
   ============================================ */

let settingsTab = 'profile';

function selectSettingsTab(tab) {
  settingsTab = tab;
  renderSettings();
  if (tab === 'security') {
    loadSecuritySessions();
  }
}

function renderSettings() {
  const page = document.getElementById('page-settings');

  page.innerHTML = `
    

    <div class="settings-tabs">
      <div class="tab-btn settings-tab ${settingsTab === 'profile' ? 'active' : ''}" onclick="selectSettingsTab('profile')">Profil</div>
      <div class="tab-btn settings-tab ${settingsTab === 'notifications' ? 'active' : ''}" onclick="selectSettingsTab('notifications')">Bildirishnomalar</div>
      <div class="tab-btn settings-tab ${settingsTab === 'security' ? 'active' : ''}" onclick="selectSettingsTab('security')">Xavfsizlik</div>
      ${currentRole === 'admin' ? `
        <div class="tab-btn settings-tab ${settingsTab === 'roles' ? 'active' : ''}" onclick="selectSettingsTab('roles')">Rollar va ruxsatlar</div>
        <div class="tab-btn settings-tab ${settingsTab === 'system' ? 'active' : ''}" onclick="selectSettingsTab('system')">Tizim</div>
      ` : ''}
    </div>

    <div class="settings-content">
      ${renderSettingsContent()}
    </div>
  `;
}

function renderSettingsContent() {
  switch (settingsTab) {
    case 'profile': return renderProfileSettings();
    case 'notifications': return renderNotifSettings();
    case 'security': return renderSecuritySettings();
    case 'roles': return renderRolesSettings();
    case 'system': return renderSystemSettings();
    default: return renderProfileSettings();
  }
}

function renderProfileSettings() {
  return `
    <div class="settings-section">
      <h3>Profil ma'lumotlari</h3>
      <div style="display:flex;align-items:center;gap:var(--space-5);margin-bottom:var(--space-5);padding:var(--space-5);background:var(--surface-card);border-radius:var(--radius-xl);border:1px solid var(--surface-border)">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--primary-600),var(--accent-500));display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;color:white">AA</div>
        <div style="flex:1">
          <div style="font-size:var(--text-lg);font-weight:var(--weight-semibold)">Anvar Atabayev</div>
          <div style="font-size:var(--text-sm);color:var(--text-tertiary)">admin@taskflow.uz</div>
        </div>
        <button class="btn btn-secondary btn-sm">Rasmni o'zgartirish</button>
      </div>
      <div class="form-row" style="margin-bottom:var(--space-4)">
        <div class="form-group">
          <label class="form-label">Ism</label>
          <input type="text" class="form-input" value="Anvar">
        </div>
        <div class="form-group">
          <label class="form-label">Familiya</label>
          <input type="text" class="form-input" value="Atabayev">
        </div>
      </div>
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">Email</label>
        <input type="email" class="form-input" value="admin@taskflow.uz">
      </div>
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">Lavozim</label>
        <input type="text" class="form-input" value="CTO">
      </div>
      <button class="btn btn-primary">Saqlash</button>
    </div>
  `;
}

function renderNotifSettings() {
  return `
    <div class="settings-section">
      <h3>Bildirishnoma sozlamalari</h3>
      ${[
      ['Yangi task biriktilganda', true],
      ['Deadline yaqinlashganda', true],
      ['Task tasdiqlanganda', true],
      ['Task qaytarilganda', true],
      ['Yangi chat xabar', true],
      ['Feedback javob kelganda', false],
      ['Email bildirishnomalar', true],
      ['Push bildirishnomalar', false],
    ].map(([label, active]) => `
        <div class="setting-row">
          <div class="sr-info">
            <div class="sr-label">${label}</div>
          </div>
          <div class="toggle ${active ? 'active' : ''}" onclick="this.classList.toggle('active')"></div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderSecuritySettings() {
  return `
    <div class="settings-section">
      <h3>Xavfsizlik</h3>
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">Joriy parol</label>
        <input type="password" class="form-input" placeholder="••••••••">
      </div>
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">Yangi parol</label>
        <input type="password" class="form-input" placeholder="Kamida 8 ta belgi">
      </div>
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">Parolni tasdiqlash</label>
        <input type="password" class="form-input" placeholder="Yangi parolni qaytaring">
      </div>
      <button class="btn btn-primary" type="button" onclick="showToast('Parol yangilandi','success')">Parolni yangilash</button>

      <h3 style="margin-top:var(--space-8)">Sessiyalar</h3>
      <p style="font-size:var(--text-sm);color:var(--text-tertiary);margin-bottom:var(--space-4)">
        Hisobingizga ulangan qurilmalar. Boshqa sessiyani tugatish uchun «Tugatish» ni bosing.
      </p>
      <div id="sessionsList">
        <p style="color:var(--text-tertiary);font-size:var(--text-sm)">Yuklanmoqda...</p>
      </div>
    </div>
  `;
}

function renderSessionsList(sessions) {
  if (!sessions || sessions.length === 0) {
    return '<p style="color:var(--text-tertiary);font-size:var(--text-sm)">Faol sessiyalar topilmadi.</p>';
  }

  return sessions.map((s) => {
    const desc = s.isCurrent
      ? `Hozirgi sessiya · IP: ${s.ip}`
      : `${s.lastActive || 'Noma\'lum'} · IP: ${s.ip}`;

    const action = s.isCurrent
      ? '<span class="badge badge-approved">Aktiv</span>'
      : (s.legacy || !s.id
        ? ''
        : `<button type="button" class="btn btn-ghost btn-sm" style="color:var(--error)" onclick="terminateSession(${s.id})">Tugatish</button>`);

    return `
      <div class="setting-row" style="${s.isCurrent ? 'border-left:3px solid var(--success)' : ''}">
        <div class="sr-info">
          <div class="sr-label">${s.label}</div>
          <div class="sr-desc">${desc}</div>
        </div>
        ${action}
      </div>
    `;
  }).join('');
}

async function loadSecuritySessions() {
  const list = document.getElementById('sessionsList');
  if (!list) return;

  list.innerHTML = '<p style="color:var(--text-tertiary);font-size:var(--text-sm)">Yuklanmoqda...</p>';

  try {
    const data = await API.getSessions();
    if (data.currentSessionId) {
      API.setSessionId(data.currentSessionId);
    }
    list.innerHTML = renderSessionsList(data.sessions);
  } catch (err) {
    list.innerHTML = `<p style="color:var(--error);font-size:var(--text-sm)">${err.message || 'Sessiyalar yuklanmadi'}</p>`;
  }
}

function terminateSession(sessionId) {
  openConfirmModal({
    title: 'Sessiyani tugatish',
    message: 'Bu qurilmadagi kirish bekor qilinadi.',
    detail: 'Foydalanuvchi qayta login qilishi kerak bo\'ladi.',
    confirmText: 'Ha, tugatish',
    danger: true,
    onConfirm: async () => {
      await API.terminateSession(sessionId);
      showToast('Sessiya tugatildi', 'success');
      await loadSecuritySessions();
    },
  });
}

function renderRolesSettings() {
  const roles = [
    { name: 'Super Admin', desc: 'To\'liq huquq — barcha modullar', perms: ['Loyiha CRUD', 'Task CRUD', 'Xodim boshqaruv', 'Sozlamalar', 'Hisobotlar', 'Feedback admin'] },
    { name: 'Project Manager', desc: 'Loyiha va tasklar nazorati', perms: ['Loyiha yaratish', 'Task CRUD', 'Review/Approve', 'Chat', 'Hisobotlar'] },
    { name: 'Team Lead', desc: 'Jamoa boshqaruvi', perms: ['Task yaratish', 'Task assign', 'Review', 'Chat', 'Jamoa ko\'rish'] },
    { name: 'Employee', desc: 'Task bajarish va hisobot', perms: ['Task ko\'rish', 'Task status o\'zgartirish', 'Chat', 'Feedback yuborish'] },
    { name: 'HR / Observer', desc: 'Faqat ko\'rish huquqi', perms: ['Dashboard ko\'rish', 'Xodimlar ko\'rish', 'Hisobotlar'] },
  ];

  return `
    <div class="settings-section">
      <h3>Rollar va ruxsatlar</h3>
      ${roles.map(r => `
        <div class="card" style="margin-bottom:var(--space-3)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-2)">
            <div>
              <strong style="font-size:var(--text-md)">${r.name}</strong>
              <p style="font-size:var(--text-xs);color:var(--text-tertiary)">${r.desc}</p>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:var(--space-1)">
            ${r.perms.map(p => `<span class="badge" style="background:var(--info-bg);color:var(--info)">${p}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderSystemSettings() {
  const currentTheme = getSavedTheme();
  return `
    <div class="settings-section">
      <h3>Tizim sozlamalari</h3>
      <div class="setting-row">
        <div class="sr-info">
          <div class="sr-label">Mavzu rejimi (Dark Mode)</div>
          <div class="sr-desc">${currentTheme === 'dark' ? "Qorong'i rejim yoqilgan" : "Yorug' rejim yoqilgan"}</div>
        </div>
        <div class="toggle ${currentTheme === 'dark' ? 'active' : ''}" onclick="toggleTheme()"></div>
      </div>
      <div class="setting-row">
        <div class="sr-info">
          <div class="sr-label">Avtomatik deadline eslatma</div>
          <div class="sr-desc">Deadline dan 1 kun oldin eslatma yuboriladi</div>
        </div>
        <div class="toggle active" onclick="this.classList.toggle('active')"></div>
      </div>
      <div class="setting-row">
        <div class="sr-info">
          <div class="sr-label">Kechikish sababi majburiy</div>
          <div class="sr-desc">Deadline o'tganda sabab yozish talab qilinadi</div>
        </div>
        <div class="toggle active" onclick="this.classList.toggle('active')"></div>
      </div>
      <div class="setting-row">
        <div class="sr-info">
          <div class="sr-label">Anonim feedback</div>
          <div class="sr-desc">Xodimlar anonim fikr yuborishi mumkin</div>
        </div>
        <div class="toggle active" onclick="this.classList.toggle('active')"></div>
      </div>
      <div class="form-group" style="margin-top:var(--space-5)">
        <label class="form-label">Tizim tili</label>
        <select class="form-select" style="max-width:300px">
          <option selected>O'zbekcha</option>
          <option>Русский</option>
          <option>English</option>
        </select>
      </div>
    </div>
  `;
}
