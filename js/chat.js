/* ============================================
   CHAT — Group + Direct messaging
   ============================================ */

let activeChatId = 1;

function renderChat() {
  const page = document.getElementById('page-chat');

  page.innerHTML = `
    <div class="chat-layout">
      <!-- Sidebar -->
      <div class="chat-sidebar">
        <div class="chat-sidebar-header">
          <h3>Xabarlar</h3>
          <div class="chat-search">
            <img src="assets/icons/sidebar-icons/search-icon.svg" alt="search" width="16" height="16" style="opacity:0.5">
            <input type="search" placeholder="Chat qidirish..." id="chatSearchInput" name="search_chat" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="search">
          </div>
        </div>
        <div class="chat-tabs">
          <button class="tab-btn chat-tab active" id="chatTabAll">Barchasi</button>
          <button class="tab-btn chat-tab" id="chatTabGroup">Guruhlar</button>
          <button class="tab-btn chat-tab" id="chatTabDirect">Shaxsiy</button>
        </div>
        <div class="chat-list" id="chatList"></div>
      </div>

      <!-- Main chat area -->
      <div class="chat-main">
        <div class="chat-main-header" id="chatMainHeader"></div>
        <div class="chat-messages" id="chatMessages"></div>
        <div class="chat-input-area">
          <button class="btn btn-ghost btn-icon" title="Fayl yuklash" onclick="showToast('Fayl yuklash','info')">📎</button>
          <input type="text" class="chat-input" placeholder="Xabar yozing..." id="chatInput" onkeydown="if(event.key==='Enter')sendChatMessage()">
          <button class="chat-send" onclick="sendChatMessage()">➤</button>
        </div>
      </div>
    </div>
  `;

  // Tab events
  const tabs = ['All', 'Group', 'Direct'];
  tabs.forEach(tab => {
    document.getElementById('chatTab' + tab).addEventListener('click', function () {
      document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      renderChatList(tab.toLowerCase());
    });
  });

  renderChatList('all');
  renderChatMessages(activeChatId);
}

function renderChatList(filter) {
  const list = document.getElementById('chatList');
  if (!list) return;

  let rooms = CHAT_ROOMS;
  if (filter === 'group') rooms = rooms.filter(r => r.type === 'group');
  if (filter === 'direct') rooms = rooms.filter(r => r.type === 'direct');

  list.innerHTML = rooms.map(r => {
    let name, avatar, initial, color, online = false;
    if (r.type === 'group') {
      name = r.name;
      initial = r.name.charAt(0);
      color = r.color;
    } else {
      const u = getUserById(r.userId);
      name = u ? u.name : 'Unknown';
      initial = u ? u.initials : '?';
      color = u ? u.color : '#666';
      online = u && u.status === 'online';
    }
    return `
    <div class="chat-item ${r.id === activeChatId ? 'active' : ''}" onclick="activeChatId=${r.id};renderChatMessages(${r.id});renderChatList('${filter || 'all'}')">
      <div class="ci-avatar" style="background:${color}">
        ${initial}
        ${online ? '<div class="online-dot"></div>' : ''}
      </div>
      <div class="ci-info">
        <div class="ci-name">
          <span>${name}</span>
          <span class="ci-time">${r.lastTime}</span>
        </div>
        <div class="ci-preview">
          <span>${r.lastMsg}</span>
          ${r.unread > 0 ? `<span class="unread-badge">${r.unread}</span>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

async function renderChatMessages(roomId) {
  const room = CHAT_ROOMS.find(r => r.id === roomId);
  if (!room) return;

  const header = document.getElementById('chatMainHeader');
  const msgContainer = document.getElementById('chatMessages');

  let name, status;
  if (room.type === 'group') {
    name = room.name;
    status = `${room.members ? room.members.length : 0} a'zo`;
  } else {
    const u = getUserById(room.userId);
    name = u ? u.name : 'Unknown';
    status = u ? (u.status === 'online' ? '🟢 Online' : u.status === 'busy' ? '🟡 Band' : '⚪ Offline') : '';
  }

  header.innerHTML = `
    <div class="cmh-user">
      <div style="width:36px;height:36px;border-radius:50%;background:${room.color || '#666'};display:flex;align-items:center;justify-content:center;color:white;font-weight:600">${name.charAt(0)}</div>
      <div>
        <div class="cmh-name">${name}</div>
        <div class="cmh-status" style="color:${status.includes('Online') ? 'var(--success)' : 'var(--text-tertiary)'}">${status}</div>
      </div>
    </div>
    <div style="display:flex;gap:var(--space-2)">
      <button class="btn btn-ghost btn-icon" title="Qidirish"><img src="assets/icons/sidebar-icons/search-icon.svg" alt="search" width="16" height="16" style="opacity:0.6"></button>
      <button class="btn btn-ghost btn-icon" title="Pin xabarlar">📌</button>
      <button class="btn btn-ghost btn-icon" title="Sozlamalar">⚙️</button>
    </div>
  `;

  try {
    const messages = await API.getChatMessages(roomId);
    msgContainer.innerHTML = `
      <div style="text-align:center;padding:var(--space-3)">
        <span style="font-size:var(--text-xs);color:var(--text-tertiary);background:var(--bg-tertiary);padding:var(--space-1) var(--space-3);border-radius:var(--radius-full)">Xabarlar yuklandi</span>
      </div>
      ${messages.map(m => {
      const u = getUserById(m.user_id || m.userId);
      const isSent = (m.user_id || m.userId) === currentUser.id;
      return `
        <div class="chat-msg ${isSent ? 'sent' : ''}">
          <div class="msg-avatar" style="background:${u ? u.color : '#666'}">${u ? u.initials : '?'}</div>
          <div class="msg-content">
            ${!isSent && room.type === 'group' ? `<div style="font-size:var(--text-xs);color:var(--primary-400);margin-bottom:2px;font-weight:600">${u ? u.name : 'Unknown'}</div>` : ''}
            <div class="msg-text">${m.text || m.message}</div>
            <div class="msg-time">${new Date(m.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>`;
    }).join('')}
    `;
    msgContainer.scrollTop = msgContainer.scrollHeight;
  } catch (err) {
    msgContainer.innerHTML = `<div class="empty-state">Xabarlarni yuklab bo'lmadi</div>`;
  }
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  if (!input || !input.value.trim()) return;

  const text = input.value;
  input.value = '';

  try {
    await API.sendMessage(activeChatId, text);
    renderChatMessages(activeChatId);
  } catch (err) {
    showToast('Xabarni yuborib bo\'lmadi', 'error');
    input.value = text;
  }
}
