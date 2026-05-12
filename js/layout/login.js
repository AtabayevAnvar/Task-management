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
        <div class="password-wrapper" style="position: relative; display: flex; align-items: center;">
          <input type="password" id="loginPassword" placeholder="••••••••" required style="padding-right: 40px; width: 100%;">
          <button type="button" id="togglePasswordVisibility" style="position: absolute; right: 10px; background: transparent; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; opacity: 0.6; transition: opacity 0.2s;" onclick="togglePassword()">
            <img src="assets/icons/eye-close.svg" alt="Show Password" id="passwordEyeIcon" width="20" height="20">
          </button>
        </div>
      </div>
      <div id="loginError" style="display:none;color:var(--error);font-size:var(--text-sm);margin-bottom:var(--space-3);padding:var(--space-2) var(--space-3);background:rgba(239,68,68,0.1);border-radius:var(--radius-md)"></div>
      <button type="submit" class="login-btn" id="loginSubmitBtn">Tizimga kirish →</button>
    </form>
  </div>
</div>
  `;
}
