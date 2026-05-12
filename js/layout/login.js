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
    </form>
  </div>
</div>
  `;
}
