function renderLogin() {
  return `
<div class="login-page" id="loginPage">
  <div class="login-bg"></div>
  <div class="login-card">
    <div class="login-logo">
      <div class="login-logo-icon">T</div>
      <div class="login-logo-text">Task<span>Flow</span></div>
    </div>
    <form class="login-form" id="loginForm">
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="loginEmail" placeholder="email@taskflow.uz" required>
      </div>
      <div class="form-group">
        <label>Parol</label>
        <input type="password" id="loginPassword" placeholder="••••••••" required>
      </div>
      <div id="loginError" style="display:none;color:var(--error);font-size:var(--text-sm);margin-bottom:var(--space-3);padding:var(--space-2) var(--space-3);background:rgba(239,68,68,0.1);border-radius:var(--radius-md)"></div>
      <button type="submit" class="login-btn" id="loginSubmitBtn">Tizimga kirish →</button>
      
      <div style="margin-top:var(--space-5);padding-top:var(--space-4);border-top:1px solid var(--surface-border)">
        <div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-bottom:var(--space-3);text-align:center">Tezkor kirish:</div>
        <div style="display:flex;flex-direction:column;gap:var(--space-2)">
          <button type="button" class="quick-login-btn" onclick="quickLogin('admin@taskflow.uz','admin123')" style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);background:var(--surface-card);border:1px solid var(--surface-border);border-radius:var(--radius-md);color:var(--text-primary);cursor:pointer;font-size:var(--text-sm);transition:all 0.2s">
            <span style="width:28px;height:28px;border-radius:50%;background:#3b82f6;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700">AA</span>
            <div style="flex:1;text-align:left">
              <div style="font-weight:600">Anvar Atabayev</div>
              <div style="font-size:10px;color:var(--text-tertiary)">Admin — to'liq huquq</div>
            </div>
            <span style="font-size:10px;padding:2px 8px;background:rgba(59,130,246,0.15);color:#3b82f6;border-radius:var(--radius-full);font-weight:600">ADMIN</span>
          </button>
          <button type="button" class="quick-login-btn" onclick="quickLogin('dilshod@taskflow.uz','pm123')" style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);background:var(--surface-card);border:1px solid var(--surface-border);border-radius:var(--radius-md);color:var(--text-primary);cursor:pointer;font-size:var(--text-sm);transition:all 0.2s">
            <span style="width:28px;height:28px;border-radius:50%;background:#8b5cf6;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700">DK</span>
            <div style="flex:1;text-align:left">
              <div style="font-weight:600">Dilshod Karimov</div>
              <div style="font-size:10px;color:var(--text-tertiary)">PM — loyiha boshqaruvi</div>
            </div>
            <span style="font-size:10px;padding:2px 8px;background:rgba(139,92,246,0.15);color:#8b5cf6;border-radius:var(--radius-full);font-weight:600">PM</span>
          </button>
          <button type="button" class="quick-login-btn" onclick="quickLogin('jasur@taskflow.uz','emp123')" style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);background:var(--surface-card);border:1px solid var(--surface-border);border-radius:var(--radius-md);color:var(--text-primary);cursor:pointer;font-size:var(--text-sm);transition:all 0.2s">
            <span style="width:28px;height:28px;border-radius:50%;background:#f59e0b;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700">JT</span>
            <div style="flex:1;text-align:left">
              <div style="font-weight:600">Jasur Toshmatov</div>
              <div style="font-size:10px;color:var(--text-tertiary)">Employee — faqat o'z tasklari</div>
            </div>
            <span style="font-size:10px;padding:2px 8px;background:rgba(245,158,11,0.15);color:#f59e0b;border-radius:var(--radius-full);font-weight:600">EMP</span>
          </button>
        </div>
      </div>
    </form>
  </div>
</div>
  `;
}
