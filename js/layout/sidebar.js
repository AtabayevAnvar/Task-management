function renderSidebar() {
  const projectsCount = PROJECTS.length;
  const tasksCount = TASKS.length;
  // For chat, we show unread count if available, otherwise total rooms
  const unreadChat = CHAT_ROOMS.reduce((acc, r) => acc + (r.unread || 0), 0);
  const chatDisplay = unreadChat > 0 ? unreadChat : CHAT_ROOMS.length;
  const notifCount = NOTIFICATIONS.filter(n => !n.read).length;

  return `
    <div class="sidebar-logo">
      <div class="logo-icon">T</div>
      <div class="logo-text">Task<span>Flow</span></div>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section">
        <div class="section-title">Asosiy</div>
        <div class="nav-item ${currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
          <span class="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="sidebar-icon-svg">
              <path d="M22 8.52V3.98C22 2.57 21.36 2 19.77 2H15.73C14.14 2 13.5 2.57 13.5 3.98V8.51C13.5 9.93 14.14 10.49 15.73 10.49H19.77C21.36 10.5 22 9.93 22 8.52Z" fill="currentColor"/>
              <path d="M22 19.77V15.73C22 14.14 21.36 13.5 19.77 13.5H15.73C14.14 13.5 13.5 14.14 13.5 15.73V19.77C13.5 21.36 14.14 22 15.73 22H19.77C21.36 22 22 21.36 22 19.77Z" fill="currentColor"/>
              <path d="M10.5 8.52V3.98C10.5 2.57 9.86 2 8.27 2H4.23C2.64 2 2 2.57 2 3.98V8.51C2 9.93 2.64 10.49 4.23 10.49H8.27C9.86 10.5 10.5 9.93 10.5 8.52Z" fill="currentColor"/>
              <path d="M10.5 19.77V15.73C10.5 14.14 9.86 13.5 8.27 13.5H4.23C2.64 13.5 2 14.14 2 15.73V19.77C2 21.36 2.64 22 4.23 22H8.27C9.86 22 10.5 21.36 10.5 19.77Z" fill="currentColor"/>
            </svg>
          </span>
          <span class="nav-text">Dashboard</span>
        </div>
        <div class="nav-item ${currentPage === 'projects' ? 'active' : ''}" data-page="projects">
          <span class="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="sidebar-icon-svg">
              <path d="M21.06 11.82L20.9 11.6C20.62 11.26 20.29 10.99 19.91 10.79C19.4 10.5 18.82 10.35 18.22 10.35H5.76995C5.16995 10.35 4.59995 10.5 4.07995 10.79C3.68995 11 3.33995 11.29 3.04995 11.65C2.47995 12.38 2.20995 13.28 2.29995 14.18L2.66995 18.85C2.79995 20.26 2.96995 22 6.13995 22H17.86C21.03 22 21.19 20.26 21.33 18.84L21.7 14.19C21.79 13.35 21.57 12.51 21.06 11.82ZM14.39 17.34H9.59995C9.20995 17.34 8.89995 17.02 8.89995 16.64C8.89995 16.26 9.20995 15.94 9.59995 15.94H14.39C14.78 15.94 15.09 16.26 15.09 16.64C15.09 17.03 14.78 17.34 14.39 17.34Z" fill="currentColor"/>
              <path d="M20.561 8.59643C20.5986 8.97928 20.1833 9.23561 19.8185 9.11348C19.3137 8.94449 18.7824 8.86 18.2299 8.86H5.76988C5.21304 8.86 4.66478 8.95012 4.15322 9.12194C3.79283 9.24298 3.37988 8.99507 3.37988 8.61489V6.66C3.37988 3.09 4.46988 2 8.03988 2H9.21988C10.6499 2 11.0999 2.46 11.6799 3.21L12.8799 4.81C13.1299 5.15 13.1399 5.17 13.5799 5.17H15.9599C19.0856 5.17 20.3069 6.00724 20.561 8.59643Z" fill="currentColor"/>
            </svg>
          </span>
          <span class="nav-text">Loyihalar</span>
          ${projectsCount > 0 ? `<span class="nav-badge" id="badge-projects">${projectsCount}</span>` : ''}
        </div>
        <div class="nav-item ${currentPage === 'tasks' ? 'active' : ''}" data-page="tasks">
          <span class="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="sidebar-icon-svg">
              <path d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.19C2 19.83 4.17 22 7.81 22H16.19C19.83 22 22 19.83 22 16.19V7.81C22 4.17 19.83 2 16.19 2ZM9.97 14.9L7.72 17.15C7.57 17.3 7.38 17.37 7.19 17.37C7 17.37 6.8 17.3 6.66 17.15L5.91 16.4C5.61 16.11 5.61 15.63 5.91 15.34C6.2 15.05 6.67 15.05 6.97 15.34L7.19 15.56L8.91 13.84C9.2 13.55 9.67 13.55 9.97 13.84C10.26 14.13 10.26 14.61 9.97 14.9ZM9.97 7.9L7.72 10.15C7.57 10.3 7.38 10.37 7.19 10.37C7 10.37 6.8 10.3 6.66 10.15L5.91 9.4C5.61 9.11 5.61 8.63 5.91 8.34C6.2 8.05 6.67 8.05 6.97 8.34L7.19 8.56L8.91 6.84C9.2 6.55 9.67 6.55 9.97 6.84C10.26 7.13 10.26 7.61 9.97 7.9ZM17.56 16.62H12.31C11.9 16.62 11.56 16.28 11.56 15.87C11.56 15.46 11.9 15.12 12.31 15.12H17.56C17.98 15.12 18.31 15.46 18.31 15.87C18.31 16.28 17.98 16.62 17.56 16.62ZM17.56 9.62H12.31C11.9 9.62 11.56 9.28 11.56 8.87C11.56 8.46 11.9 8.12 12.31 8.12H17.56C17.98 8.12 18.31 8.46 18.31 8.87C18.31 9.28 17.98 9.62 17.56 9.62Z" fill="currentColor"/>
            </svg>
          </span>
          <span class="nav-text">Tasklar</span>
          ${tasksCount > 0 ? `<span class="nav-badge" id="badge-tasks">${tasksCount}</span>` : ''}
        </div>
        <div class="nav-item ${currentPage === 'calendar' ? 'active' : ''}" data-page="calendar">
          <span class="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="sidebar-icon-svg">
              <path d="M16.7502 3.56V2C16.7502 1.59 16.4102 1.25 16.0002 1.25C15.5902 1.25 15.2502 1.59 15.2502 2V3.5H8.75023V2C8.75023 1.59 8.41023 1.25 8.00023 1.25C7.59023 1.25 7.25023 1.59 7.25023 2V3.56C4.55023 3.81 3.24023 5.42 3.04023 7.81C3.02023 8.1 3.26023 8.34 3.54023 8.34H20.4602C20.7502 8.34 20.9902 8.09 20.9602 7.81C20.7602 5.42 19.4502 3.81 16.7502 3.56Z" fill="currentColor"/>
              <path d="M20 9.84003H4C3.45 9.84003 3 10.29 3 10.84V17C3 20 4.5 22 8 22H16C19.5 22 21 20 21 17V10.84C21 10.29 20.55 9.84003 20 9.84003ZM9.21 18.21C9.16 18.25 9.11 18.3 9.06 18.33C9 18.37 8.94 18.4 8.88 18.42C8.82 18.45 8.76 18.47 8.7 18.48C8.63 18.49 8.57 18.5 8.5 18.5C8.37 18.5 8.24 18.47 8.12 18.42C7.99 18.37 7.89 18.3 7.79 18.21C7.61 18.02 7.5 17.76 7.5 17.5C7.5 17.24 7.61 16.98 7.79 16.79C7.89 16.7 7.99 16.63 8.12 16.58C8.3 16.5 8.5 16.48 8.7 16.52C8.76 16.53 8.82 16.55 8.88 16.58C8.94 16.6 9 16.63 9.06 16.67C9.11 16.71 9.16 16.75 9.21 16.79C9.39 16.98 9.5 17.24 9.5 17.5C9.5 17.76 9.39 18.02 9.21 18.21ZM9.21 14.71C9.02 14.89 8.76 15 8.5 15C8.24 15 7.98 14.89 7.79 14.71C7.61 14.52 7.5 14.26 7.5 14C7.5 13.74 7.61 13.48 7.79 13.29C8.07 13.01 8.51 12.92 8.88 13.08C9.01 13.13 9.12 13.2 9.21 13.29C9.39 13.48 9.5 13.74 9.5 14C9.5 14.26 9.39 14.52 9.21 14.71ZM12.71 18.21C12.52 18.39 12.26 18.5 12 18.5C11.74 18.5 11.48 18.39 11.29 18.21C11.11 18.02 11 17.76 11 17.5C11 17.24 11.11 16.98 11.29 16.79C11.66 16.42 12.34 16.42 12.71 16.79C12.89 16.98 13 17.24 13 17.5C13 17.76 12.89 18.02 12.71 18.21ZM12.71 14.71C12.66 14.75 12.61 14.79 12.56 14.83C12.5 14.87 12.44 14.9 12.38 14.92C12.32 14.95 12.26 14.97 12.2 14.98C12.13 14.99 12.07 15 12 15C11.74 15 11.48 14.89 11.29 14.71C11.11 14.52 11 14.26 11 14C11 13.74 11.11 13.48 11.29 13.29C11.38 13.2 11.49 13.13 11.62 13.08C11.99 12.92 12.43 13.01 12.71 13.29C12.89 13.48 13 13.74 13 14C13 14.26 12.89 14.52 12.71 14.71ZM16.21 18.21C16.02 18.39 15.76 18.5 15.5 18.5C15.24 18.5 14.98 18.39 14.79 18.21C14.61 18.02 14.5 17.76 14.5 17.5C14.5 17.24 14.61 16.98 14.79 16.79C15.16 16.42 15.84 16.42 16.21 16.79C16.39 16.98 16.5 17.24 16.5 17.5C16.5 17.76 16.39 18.02 16.21 18.21ZM16.21 14.71C16.16 14.75 16.11 14.79 16.06 14.83C16 14.87 15.94 14.9 15.88 14.92C15.82 14.95 15.76 14.97 15.7 14.98C15.63 14.99 15.56 15 15.5 15C15.24 15 14.98 14.89 14.79 14.71C14.61 14.52 14.5 14.26 14.5 14C14.5 13.74 14.61 13.48 14.79 13.29C14.89 13.2 14.99 13.13 15.12 13.08C15.3 13 15.5 12.98 15.7 13.02C15.76 13.03 15.82 13.05 15.88 13.08C15.94 13.1 16 13.13 16.06 13.17C16.11 13.21 16.16 13.25 16.21 13.29C16.39 13.48 16.5 13.74 16.5 14C16.5 14.26 16.39 14.52 16.21 14.71Z" fill="currentColor"/>
            </svg>
          </span>
          <span class="nav-text">Kalendar</span>
        </div>
      </div>

      <div class="nav-section">
        <div class="section-title">Aloqa</div>
        <div class="nav-item ${currentPage === 'chat' ? 'active' : ''}" data-page="chat">
          <span class="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="sidebar-icon-svg">
              <path d="M17 2H7C4.24 2 2 4.23 2 6.98V12.96V13.96C2 16.71 4.24 18.94 7 18.94H8.5C8.77 18.94 9.13 19.12 9.3 19.34L10.8 21.33C11.46 22.21 12.54 22.21 13.2 21.33L14.7 19.34C14.89 19.09 15.19 18.94 15.5 18.94H17C19.76 18.94 22 16.71 22 13.96V6.98C22 4.23 19.76 2 17 2ZM8 12C7.44 12 7 11.55 7 11C7 10.45 7.45 10 8 10C8.55 10 9 10.45 9 11C9 11.55 8.56 12 8 12ZM12 12C11.44 12 11 11.55 11 11C11 10.45 11.45 10 12 10C12.55 10 13 10.45 13 11C13 11.55 12.56 12 12 12ZM16 12C15.44 12 15 11.55 15 11C15 10.45 15.45 10 16 10C16.55 10 17 10.45 17 11C17 11.55 16.56 12 16 12Z" fill="currentColor"/>
            </svg>
          </span>
          <span class="nav-text">Chat</span>
          ${chatDisplay > 0 ? `<span class="nav-badge" id="badge-chat">${chatDisplay}</span>` : ''}
        </div>
        <div class="nav-item ${currentPage === 'notifications' ? 'active' : ''}" data-page="notifications">
          <span class="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="sidebar-icon-svg">
              <path d="M19.3399 14.49L18.3399 12.83C18.1299 12.46 17.9399 11.76 17.9399 11.35V8.82C17.9399 6.47 16.5599 4.44 14.5699 3.49C14.0499 2.57 13.0899 2 11.9899 2C10.8999 2 9.91994 2.59 9.39994 3.52C7.44994 4.49 6.09994 6.5 6.09994 8.82V11.35C6.09994 11.76 5.90994 12.46 5.69994 12.82L4.68994 14.49C4.28994 15.16 4.19994 15.9 4.44994 16.58C4.68994 17.25 5.25994 17.77 5.99994 18.02C7.93994 18.68 9.97994 19 12.0199 19C14.0599 19 16.0999 18.68 18.0399 18.03C18.7399 17.8 19.2799 17.27 19.5399 16.58C19.7999 15.89 19.7299 15.13 19.3399 14.49Z" fill="currentColor"/>
              <path d="M14.8302 20.01C14.4102 21.17 13.3002 22 12.0002 22C11.2102 22 10.4302 21.68 9.88018 21.11C9.56018 20.81 9.32018 20.41 9.18018 20C9.31018 20.02 9.44018 20.03 9.58018 20.05C9.81018 20.08 10.0502 20.11 10.2902 20.13C10.8602 20.18 11.4402 20.21 12.0202 20.21C12.5902 20.21 13.1602 20.18 13.7202 20.13C13.9302 20.11 14.1402 20.1 14.3402 20.07C14.5002 20.05 14.6602 20.03 14.8302 20.01Z" fill="currentColor"/>
            </svg>
          </span>
          <span class="nav-text">Bildirishnomalar</span>
          ${notifCount > 0 ? `<span class="nav-badge" id="badge-notif">${notifCount}</span>` : ''}
        </div>
      </div>

      <div class="nav-section">
        <div class="section-title">Boshqaruv</div>
        <div class="nav-item ${currentPage === 'employees' ? 'active' : ''}" data-page="employees">
          <span class="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="sidebar-icon-svg">
              <path d="M9 2C6.38 2 4.25 4.13 4.25 6.75C4.25 9.32 6.26 11.4 8.88 11.49C8.96 11.48 9.04 11.48 9.1 11.49C9.12 11.49 9.13 11.49 9.15 11.49C9.16 11.49 9.16 11.49 9.17 11.49C11.73 11.4 13.74 9.32 13.75 6.75C13.75 4.13 11.62 2 9 2Z" fill="currentColor"/>
              <path d="M14.08 14.15C11.29 12.29 6.73996 12.29 3.92996 14.15C2.65996 15 1.95996 16.15 1.95996 17.38C1.95996 18.61 2.65996 19.75 3.91996 20.59C5.31996 21.53 7.15996 22 8.99996 22C10.84 22 12.68 21.53 14.08 20.59C15.34 19.74 16.04 18.6 16.04 17.36C16.03 16.13 15.34 14.99 14.08 14.15Z" fill="currentColor"/>
              <path d="M19.99 7.33998C20.15 9.27998 18.77 10.98 16.86 11.21C16.85 11.21 16.85 11.21 16.84 11.21H16.81C16.75 11.21 16.69 11.21 16.64 11.23C15.67 11.28 14.78 10.97 14.11 10.4C15.14 9.47998 15.73 8.09998 15.61 6.59998C15.54 5.78998 15.26 5.04998 14.84 4.41998C15.22 4.22998 15.66 4.10998 16.11 4.06998C18.07 3.89998 19.82 5.35998 19.99 7.33998Z" fill="currentColor"/>
              <path d="M21.99 16.59C21.91 17.56 21.29 18.4 20.25 18.97C19.25 19.52 17.99 19.78 16.74 19.75C17.46 19.1 17.88 18.29 17.96 17.43C18.06 16.19 17.47 15 16.29 14.05C15.62 13.52 14.84 13.1 13.99 12.79C16.2 12.15 18.98 12.58 20.69 13.96C21.61 14.7 22.08 15.63 21.99 16.59Z" fill="currentColor"/>
            </svg>
          </span>
          <span class="nav-text">Xodimlar</span>
        </div>
        <div class="nav-item ${currentPage === 'feedback' ? 'active' : ''}" data-page="feedback">
          <span class="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="sidebar-icon-svg">
              <path d="M19.21 6.36001C18.17 4.26001 16.16 2.71001 13.83 2.20001C11.39 1.66001 8.88997 2.24001 6.97997 3.78001C5.05997 5.31001 3.96997 7.60001 3.96997 10.05C3.96997 12.64 5.51997 15.35 7.85997 16.92V17.75C7.84997 18.03 7.83997 18.46 8.17997 18.81C8.52997 19.17 9.04997 19.21 9.45997 19.21H14.59C15.13 19.21 15.54 19.06 15.82 18.78C16.2 18.39 16.19 17.89 16.18 17.62V16.92C19.28 14.83 21.23 10.42 19.21 6.36001Z" fill="currentColor"/>
              <path d="M15.2599 22C15.1999 22 15.1299 21.99 15.0699 21.97C13.0599 21.4 10.9499 21.4 8.93991 21.97C8.56991 22.07 8.17991 21.86 8.07991 21.49C7.96991 21.12 8.18991 20.73 8.55991 20.63C10.8199 19.99 13.1999 19.99 15.4599 20.63C15.8299 20.74 16.0499 21.12 15.9399 21.49C15.8399 21.8 15.5599 22 15.2599 22Z" fill="currentColor"/>
            </svg>
          </span>
          <span class="nav-text">Fikr-mulohaza</span>
        </div>
        <div class="nav-item ${currentPage === 'settings' ? 'active' : ''}" data-page="settings">
          <span class="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="sidebar-icon-svg">
              <path d="M20.1 9.22006C18.29 9.22006 17.55 7.94006 18.45 6.37006C18.97 5.46006 18.66 4.30006 17.75 3.78006L16.02 2.79006C15.23 2.32006 14.21 2.60006 13.74 3.39006L13.63 3.58006C12.73 5.15006 11.25 5.15006 10.34 3.58006L10.23 3.39006C9.78 2.60006 8.76 2.32006 7.97 2.79006L6.24 3.78006C5.33 4.30006 5.02 5.47006 5.54 6.38006C6.45 7.94006 5.71 9.22006 3.9 9.22006C2.86 9.22006 2 10.0701 2 11.1201V12.8801C2 13.9201 2.85 14.7801 3.9 14.7801C5.71 14.7801 6.45 16.0601 5.54 17.6301C5.02 18.5401 5.33 19.7001 6.24 20.2201L7.97 21.2101C8.76 21.6801 9.78 21.4001 10.25 20.6101L10.36 20.4201C11.26 18.8501 12.74 18.8501 13.65 20.4201L13.76 20.6101C14.23 21.4001 15.25 21.6801 16.04 21.2101L17.77 20.2201C18.68 19.7001 18.99 18.5301 18.47 17.6301C17.56 16.0601 18.3 14.7801 20.11 14.7801C21.15 14.7801 22.01 13.9301 22.01 12.8801V11.1201C22 10.0801 21.15 9.22006 20.1 9.22006ZM12 15.2501C10.21 15.2501 8.75 13.7901 8.75 12.0001C8.75 10.2101 10.21 8.75006 12 8.75006C13.79 8.75006 15.25 10.2101 15.25 12.0001C15.25 13.7901 13.79 15.2501 12 15.2501Z" fill="currentColor"/>
            </svg>
          </span>
          <span class="nav-text">Sozlamalar</span>
        </div>
      </div>
    </nav>

    <div class="sidebar-user">
      <div class="user-avatar" id="sidebarAvatar">${currentUser ? (currentUser.initials || currentUser.name.charAt(0)) : '??'}</div>
      <div class="sidebar-user-info">
        <div class="user-name" id="sidebarUserName">${currentUser ? currentUser.name : 'Unknown'}</div>
        <div class="user-role" id="sidebarUserRole">${currentRole}</div>
      </div>
      <button class="logout-btn" onclick="API.logout().then(() => showLoginPage())" style="background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:var(--space-1);margin-left:auto" title="Tizimdan chiqish">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="sidebar-icon-svg">
          <path d="M17.44 14.62L20.02 12.04L17.44 9.45996" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9.76001 12.04H19.93" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M11.76 20C7.34001 20 3.76001 17 3.76001 12C3.76001 7 7.34001 4 11.76 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;
}

/**
 * Updates sidebar badges without re-rendering the whole sidebar
 */
function updateSidebarCounts() {
  const sb = document.getElementById('sidebar');
  if (!sb) return;

  const bProj = sb.querySelector('[data-page="projects"]');
  if (bProj) {
    let badge = bProj.querySelector('.nav-badge');
    if (PROJECTS.length > 0) {
       if (!badge) {
         badge = document.createElement('span');
         badge.className = 'nav-badge';
         bProj.appendChild(badge);
       }
       badge.textContent = PROJECTS.length;
    } else if (badge) badge.remove();
  }

  const bTask = sb.querySelector('[data-page="tasks"]');
  if (bTask) {
    let badge = bTask.querySelector('.nav-badge');
    if (TASKS.length > 0) {
       if (!badge) {
         badge = document.createElement('span');
         badge.className = 'nav-badge';
         bTask.appendChild(badge);
       }
       badge.textContent = TASKS.length;
    } else if (badge) badge.remove();
  }

  const bChat = sb.querySelector('[data-page="chat"]');
  if (bChat) {
    let badge = bChat.querySelector('.nav-badge');
    const count = CHAT_ROOMS.length; // Use total rooms for now
    if (count > 0) {
       if (!badge) {
         badge = document.createElement('span');
         badge.className = 'nav-badge';
         bChat.appendChild(badge);
       }
       badge.textContent = count;
    } else if (badge) badge.remove();
  }

  const bNotif = sb.querySelector('[data-page="notifications"]');
  if (bNotif) {
    let badge = bNotif.querySelector('.nav-badge');
    const count = NOTIFICATIONS.filter(n => !n.read).length;
    if (count > 0) {
       if (!badge) {
         badge = document.createElement('span');
         badge.className = 'nav-badge';
         bNotif.appendChild(badge);
       }
       badge.textContent = count;
    } else if (badge) badge.remove();
  }
}
