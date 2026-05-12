function renderAppLayout() {
  return `
<div class="app-layout" id="appLayout" style="display:none;">
  <!-- Dummy inputs to stop aggressive password managers -->
  <input type="text" style="width:0;height:0;position:absolute;opacity:0" autocomplete="username">
  <input type="password" style="width:0;height:0;position:absolute;opacity:0" autocomplete="current-password">

  <!-- ── SIDEBAR ── -->
  <aside class="sidebar" id="sidebar">
    ${renderSidebar()}
  </aside>

  <div class="sidebar-overlay" id="sidebarOverlay"></div>

  <!-- ── MAIN AREA ── -->
  <div class="main-area">

    <!-- ── HEADER ── -->
    <header class="header">
      ${renderHeader()}
    </header>

    <!-- ── CONTENT ── -->
    <main class="content" id="mainContent">

      <!-- ═══ DASHBOARD PAGE ═══ -->
      <div class="content-page" id="page-dashboard"></div>

      <!-- ═══ PROJECTS PAGE ═══ -->
      <div class="content-page" id="page-projects"></div>

      <!-- ═══ PROJECT DETAIL PAGE ═══ -->
      <div class="content-page" id="page-project-detail"></div>

      <!-- ═══ TASKS PAGE ═══ -->
      <div class="content-page" id="page-tasks"></div>

      <!-- ═══ CALENDAR PAGE ═══ -->
      <div class="content-page" id="page-calendar"></div>

      <!-- ═══ CHAT PAGE ═══ -->
      <div class="content-page" id="page-chat"></div>

      <!-- ═══ NOTIFICATIONS PAGE ═══ -->
      <div class="content-page" id="page-notifications"></div>

      <!-- ═══ EMPLOYEES PAGE ═══ -->
      <div class="content-page" id="page-employees"></div>

      <!-- ═══ FEEDBACK PAGE ═══ -->
      <div class="content-page" id="page-feedback"></div>

      <!-- ═══ SETTINGS PAGE ═══ -->
      <div class="content-page" id="page-settings"></div>

    </main>
  </div>
</div>
  `;
}
