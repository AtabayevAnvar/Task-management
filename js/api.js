/* ============================================
   API — Frontend API service layer
   ============================================ */

const API = {
  baseUrl: '/api',

  // ── Token management ──
  getToken() {
    return localStorage.getItem('auth_token');
  },

  setToken(token) {
    localStorage.setItem('auth_token', token);
  },

  clearToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  getUser() {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) { return null; }
    }
    return null;
  },

  setUser(user) {
    localStorage.setItem('auth_user', JSON.stringify(user));
  },

  // ── HTTP helpers ──
  async request(method, endpoint, data = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const token = this.getToken();
    if (token) {
      opts.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      opts.body = JSON.stringify(data);
    }

    try {
      const res = await fetch(this.baseUrl + endpoint, opts);
      const json = await res.json();

      if (!res.ok) {
        // Token expired
        if (res.status === 401) {
          this.clearToken();
          if (typeof showLoginPage === 'function') showLoginPage();
        }
        throw new Error(json.error || 'Server xatosi');
      }

      return json;
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('Server bilan aloqa yo\'q. Backend ishlab turganini tekshiring.');
      }
      throw err;
    }
  },

  get(endpoint) { return this.request('GET', endpoint); },
  post(endpoint, data) { return this.request('POST', endpoint, data); },
  put(endpoint, data) { return this.request('PUT', endpoint, data); },
  delete(endpoint) { return this.request('DELETE', endpoint); },

  // ══════════════════════════════════════
  // AUTH
  // ══════════════════════════════════════
  async login(email, password) {
    const result = await this.post('/auth/login', { email, password });
    this.setToken(result.token);
    this.setUser(result.user);
    return result;
  },

  async register(data) {
    return this.post('/auth/register', data);
  },

  async logout() {
    try { await this.post('/auth/logout'); } catch(e) {}
    this.clearToken();
  },

  async getMe() {
    return this.get('/auth/me');
  },

  // ══════════════════════════════════════
  // USERS
  // ══════════════════════════════════════
  async getUsers() { return this.get('/users'); },
  async getUser(id) { return this.get(`/users/${id}`); },
  async updateUser(id, data) { return this.put(`/users/${id}`, data); },

  // ══════════════════════════════════════
  // PROJECTS
  // ══════════════════════════════════════
  async getProjects(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString();
    return this.get('/projects' + (qs ? '?' + qs : ''));
  },
  async getProject(id) { return this.get(`/projects/${id}`); },
  async createProject(data) { return this.post('/projects', data); },
  async updateProject(id, data) { return this.put(`/projects/${id}`, data); },
  async deleteProject(id) { return this.delete(`/projects/${id}`); },
  async getProjectTasks(id) { return this.get(`/projects/${id}/tasks`); },
  async getProjectTeam(id) { return this.get(`/projects/${id}/team`); },

  // ══════════════════════════════════════
  // TASKS
  // ══════════════════════════════════════
  async getTasks(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.project) params.set('project', filters.project);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString();
    return this.get('/tasks' + (qs ? '?' + qs : ''));
  },
  async getTask(id) { return this.get(`/tasks/${id}`); },
  async createTask(data) { return this.post('/tasks', data); },
  async updateTask(id, data) { return this.put(`/tasks/${id}`, data); },
  async updateTaskStatus(id, status) { return this.put(`/tasks/${id}/status`, { status }); },
  async toggleChecklistItem(taskId, checkId, done) { return this.put(`/tasks/${taskId}/checklist/${checkId}`, { done }); },
  async deleteTask(id) { return this.delete(`/tasks/${id}`); },

  // ══════════════════════════════════════
  // CHAT
  // ══════════════════════════════════════
  async getChatRooms() { return this.get('/chat/rooms'); },
  async getChatMessages(roomId) { return this.get(`/chat/rooms/${roomId}/messages`); },
  async sendMessage(roomId, text) { return this.post(`/chat/rooms/${roomId}/messages`, { text }); },
  async createChatRoom(data) { return this.post('/chat/rooms', data); },

  // ══════════════════════════════════════
  // NOTIFICATIONS
  // ══════════════════════════════════════
  async getNotifications() { return this.get('/notifications'); },
  async markNotificationRead(id) { return this.put(`/notifications/${id}/read`); },
  async markAllNotificationsRead() { return this.put('/notifications/read-all'); },

  // ══════════════════════════════════════
  // FEEDBACK
  // ══════════════════════════════════════
  async getFeedbacks(type) {
    return this.get('/feedback' + (type ? `?type=${type}` : ''));
  },
  async createFeedback(data) { return this.post('/feedback', data); },
  async respondToFeedback(id, text) { return this.put(`/feedback/${id}/respond`, { response_text: text }); },

  // ══════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════
  async getDashboardStats() { return this.get('/dashboard/stats'); },
  async getActivityFeed() { return this.get('/dashboard/activity'); },
};
