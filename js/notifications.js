/* ============================================
   NOTIFICATIONS — Full page + dropdown
   ============================================ */

function renderNotificationsPage() {
  const page = document.getElementById('page-notifications');
  const unread = NOTIFICATIONS.filter(n => !n.read).length;

  page.innerHTML = `
    

    <div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-5);flex-wrap:wrap">
      <button class="btn btn-secondary btn-sm notif-filter active-filter" data-filter="all" onclick="filterNotifications('all',this)">Barchasi</button>
      <button class="btn btn-ghost btn-sm notif-filter" data-filter="task" onclick="filterNotifications('task',this)">Tasklar</button>
      <button class="btn btn-ghost btn-sm notif-filter" data-filter="deadline" onclick="filterNotifications('deadline',this)">Deadline</button>
      <button class="btn btn-ghost btn-sm notif-filter" data-filter="review" onclick="filterNotifications('review',this)">Review</button>
      <button class="btn btn-ghost btn-sm notif-filter" data-filter="chat" onclick="filterNotifications('chat',this)">Chat</button>
    </div>

    <div class="notifications-list" id="notifPageList">
      ${renderNotifCards(NOTIFICATIONS)}
    </div>
  `;
}

function renderNotifCards(items) {
  return items.map(n => `
    <div class="notification-card ${n.read ? '' : 'unread'}" onclick="markNotifRead(${n.id})">
      <div class="nc-icon" style="background:${n.color}">${n.icon}</div>
      <div class="nc-body">
        <div class="nc-title">${n.title}</div>
        <div class="nc-desc">${n.desc}</div>
      </div>
      <div class="nc-time">${n.time}</div>
    </div>
  `).join('');
}

function filterNotifications(type, btn) {
  document.querySelectorAll('.notif-filter').forEach(b => {
    b.classList.remove('active-filter');
    b.classList.remove('btn-secondary');
    b.classList.add('btn-ghost');
  });
  btn.classList.add('active-filter');
  btn.classList.add('btn-secondary');
  btn.classList.remove('btn-ghost');

  const filtered = type === 'all' ? NOTIFICATIONS : NOTIFICATIONS.filter(n => n.type === type);
  document.getElementById('notifPageList').innerHTML = renderNotifCards(filtered);
}

async function markNotifRead(id) {
  try {
    await API.markNotificationRead(id);
    const n = NOTIFICATIONS.find(n => n.id === id);
    if (n) n.read = 1;
    if (typeof updateSidebarCounts === 'function') updateSidebarCounts();
    renderNotificationsPage();
  } catch (err) {
    console.error(err);
  }
}

async function markAllNotifRead() {
  try {
    await API.markAllNotificationsRead();
    NOTIFICATIONS.forEach(n => n.read = 1);

    if (typeof updateSidebarCounts === 'function') updateSidebarCounts();

    const dot = document.querySelector('.notif-dot');
    if (dot) dot.style.display = 'none';
    showToast("Barcha bildirishnomalar o'qildi", 'success');
    renderNotificationsPage();
  } catch (err) {
    showToast('Xatolik yuz berdi', 'error');
  }
}
