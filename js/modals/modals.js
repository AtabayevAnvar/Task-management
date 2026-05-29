function renderModals() {
  return `
<!-- Create Project Modal -->
<div class="modal-overlay" id="modalCreateProject">
  <div class="modal modal-lg">
    <div class="modal-header">
      <h3>Yangi loyiha yaratish</h3>
      <button class="modal-close" onclick="closeModal('modalCreateProject')">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">Loyiha nomi *</label>
        <input type="text" class="form-input" id="projName" placeholder="Loyiha nomini kiriting">
      </div>
      <div class="form-row" style="margin-bottom:var(--space-4)">
        <div class="form-group">
          <label class="form-label">Klient / Turi</label>
          <input type="text" class="form-input" id="projClient" placeholder="Klient nomi">
        </div>
        <div class="form-group">
          <label class="form-label">Project Manager</label>
          <select class="form-select" id="projPM">
            <option>Anvar Atabayev</option>
            <option>Dilshod Karimov</option>
            <option>Madina Rahimova</option>
          </select>
        </div>
      </div>
      <div class="form-row" style="margin-bottom:var(--space-4)">
        <div class="form-group">
          <label class="form-label">Boshlanish sanasi</label>
          <input type="date" class="form-input" id="projStart">
        </div>
        <div class="form-group">
          <label class="form-label">Deadline</label>
          <input type="date" class="form-input" id="projDeadline">
        </div>
      </div>
      <div class="form-row" style="margin-bottom:var(--space-4)">
        <div class="form-group">
          <label class="form-label">Prioritet</label>
          <select class="form-select" id="projPriority">
            <option value="critical">Critical</option>
            <option value="high">Yuqori</option>
            <option value="medium" selected>O'rtacha</option>
            <option value="low">Past</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="projStatus">
            <option value="new">Yangi</option>
            <option value="progress" selected>Jarayonda</option>
            <option value="review">Review</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">Tavsif</label>
        <textarea class="form-textarea" id="projDesc" rows="3" placeholder="Loyiha haqida qisqacha..."></textarea>
      </div>
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">Jamoa a'zolari (Ishchilarni biriktirish)</label>
        <div class="team-select-grid" id="projTeamGrid">
          <!-- Populated dynamically via renderEmployeeSelect() -->
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">TZ fayl yuklash</label>
        <div class="upload-area" id="projUploadArea">
          <div class="upload-icon">📤</div>
          <div class="upload-text">Faylni bu yerga tashlang yoki bosing</div>
          <div class="upload-hint">PDF, DOCX, XLSX — max 50MB</div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('modalCreateProject')">Bekor qilish</button>
      <button class="btn btn-primary" onclick="createProject()">Yaratish</button>
    </div>
  </div>
</div>

<!-- Task Detail Modal -->
<div class="modal-overlay" id="modalTaskDetail">
  <div class="modal modal-xl">
    <div class="modal-header">
      <h3 id="taskDetailTitle">Task Detail</h3>
      <button class="modal-close" onclick="closeModal('modalTaskDetail')">✕</button>
    </div>
    <div class="modal-body" id="taskDetailBody"></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('modalTaskDetail')">Yopish</button>
      <button class="btn btn-primary" id="taskApproveBtn" style="display:none" onclick="approveTask()">✓ Tasdiqlash</button>
      <button class="btn btn-danger" id="taskRejectBtn" style="display:none" onclick="rejectTask()">↩ Qaytarish</button>
    </div>
  </div>
</div>

<!-- Delay Reason Modal -->
<div class="modal-overlay" id="modalDelayReason">
  <div class="modal">
    <div class="modal-header">
      <h3>⚠️ Kechikish sababi</h3>
      <button class="modal-close" onclick="closeModal('modalDelayReason')">✕</button>
    </div>
    <div class="modal-body">
      <div class="delay-form">
        <div class="delay-info" id="delayInfo"></div>
        <div class="form-group">
          <label class="form-label">Kechikish sababi</label>
          <select class="form-select" id="delayCategory">
            <option value="">— Tanlang —</option>
            <option>Texnik muammo</option>
            <option>Resurs yetishmovchiligi</option>
            <option>TZ o'zgarishi</option>
            <option>Tashqi bog'liqlik</option>
            <option>Boshqa</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Izoh</label>
          <textarea class="form-textarea" id="delayComment" placeholder="Batafsil izoh yozing..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Yangi deadline</label>
          <input type="date" class="form-input" id="delayNewDeadline">
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('modalDelayReason')">Bekor qilish</button>
      <button class="btn btn-danger" onclick="submitDelayReason()">Saqlash</button>
    </div>
  </div>
</div>

<!-- Feedback Modal -->
<div class="modal-overlay" id="modalFeedback">
  <div class="modal">
    <div class="modal-header">
      <h3>Fikr / Taklif yuborish</h3>
      <button class="modal-close" onclick="closeModal('modalFeedback')">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">Turi</label>
        <select class="form-select" id="feedbackType">
          <option value="idea">💡 Fikr</option>
          <option value="suggestion">📝 Taklif</option>
          <option value="complaint">⚠️ Shikoyat</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">Mavzu</label>
        <input type="text" class="form-input" id="feedbackSubject" placeholder="Qisqa mavzu">
      </div>
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">Matn</label>
        <textarea class="form-textarea" id="feedbackText" rows="4" placeholder="Batafsil yozing..."></textarea>
      </div>
      <div class="form-checkbox">
        <input type="checkbox" id="feedbackAnon">
        <label for="feedbackAnon" style="font-size:var(--text-sm);color:var(--text-secondary)">Anonim yuborish</label>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('modalFeedback')">Bekor qilish</button>
      <button class="btn btn-primary" onclick="submitFeedback()">Yuborish</button>
    </div>
  </div>
</div>

<!-- Create Task Modal -->
<div class="modal-overlay" id="modalCreateTask">
  <div class="modal modal-lg">
    <div class="modal-header">
      <h3>Yangi task yaratish</h3>
      <button class="modal-close" onclick="closeModal('modalCreateTask')">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">Task nomi *</label>
        <input type="text" class="form-input" id="taskName" placeholder="Task nomini kiriting">
      </div>
      <div class="form-row" style="margin-bottom:var(--space-4)">
        <div class="form-group">
          <label class="form-label">Loyiha</label>
          <select class="form-select" id="taskProject">
            <option>E-Commerce Platform</option>
            <option>CRM Tizimi</option>
            <option>Mobile App</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Mas'ul xodim</label>
          <select class="form-select" id="taskAssignee">
            <option>Jasur Toshmatov</option>
            <option>Nodira Azimova</option>
            <option>Shaxzod Aliyev</option>
          </select>
        </div>
      </div>
      <div class="form-row" style="margin-bottom:var(--space-4)">
        <div class="form-group">
          <label class="form-label">Deadline</label>
          <input type="date" class="form-input" id="taskDeadline">
        </div>
        <div class="form-group">
          <label class="form-label">Prioritet</label>
          <select class="form-select" id="taskPriority">
            <option value="critical">Critical</option>
            <option value="high">Yuqori</option>
            <option value="medium" selected>O'rtacha</option>
            <option value="low">Past</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">Tavsif</label>
        <textarea class="form-textarea" id="taskDesc" rows="3" placeholder="Task haqida..."></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('modalCreateTask')">Bekor qilish</button>
      <button class="btn btn-primary" onclick="createTask()">Yaratish</button>
    </div>
  </div>
</div>
<!-- Create Employee Modal -->
<div class="modal-overlay" id="modalCreateEmployee">
  <div class="modal">
    <div class="modal-header">
      <h3>Yangi xodim qo'shish</h3>
      <button class="modal-close" onclick="closeModal('modalCreateEmployee')">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">To'liq ism *</label>
        <input type="text" class="form-input" id="empName" placeholder="Xodimning ismini kiriting">
      </div>
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">Email *</label>
        <input type="email" class="form-input" id="empEmail" placeholder="Misol: user@taskflow.uz">
      </div>
      <div class="form-row" style="margin-bottom:var(--space-4)">
        <div class="form-group">
          <label class="form-label">Parol *</label>
          <input type="password" class="form-input" id="empPassword" placeholder="Kamida 6 ta belgi">
        </div>
        <div class="form-group">
          <label class="form-label">Rol</label>
          <select class="form-select" id="empRole">
            <option value="employee" selected>Employee (Xodim)</option>
            <option value="teamlead">Team Lead</option>
            <option value="pm">Project Manager</option>
            <option value="hr">HR</option>
            <option value="admin">Super Admin</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">Lavozim (Position)</label>
        <input type="text" class="form-input" id="empPosition" placeholder="Misol: Frontend dasturchi">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('modalCreateEmployee')">Bekor qilish</button>
      <button class="btn btn-primary" onclick="createEmployee()">Qo'shish</button>
    </div>
  </div>
</div>

<!-- Edit Employee Modal -->
<div class="modal-overlay" id="modalEditEmployee">
  <div class="modal">
    <div class="modal-header">
      <h3>Xodimni tahrirlash</h3>
      <button class="modal-close" onclick="closeModal('modalEditEmployee')">✕</button>
    </div>
    <div class="modal-body">
      <input type="hidden" id="editEmpId">
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">To'liq ism *</label>
        <input type="text" class="form-input" id="editEmpName" placeholder="Xodimning ismini kiriting">
      </div>
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">Email *</label>
        <input type="email" class="form-input" id="editEmpEmail" placeholder="Misol: user@taskflow.uz">
      </div>
      <div class="form-row" style="margin-bottom:var(--space-4)">
        <div class="form-group">
          <label class="form-label">Parol</label>
          <input type="password" class="form-input" id="editEmpPassword" placeholder="Yangi parol (ixtiyoriy)">
        </div>
        <div class="form-group">
          <label class="form-label">Rol</label>
          <select class="form-select" id="editEmpRole">
            <option value="employee">Employee (Xodim)</option>
            <option value="teamlead">Team Lead</option>
            <option value="pm">Project Manager</option>
            <option value="hr">HR</option>
            <option value="admin">Super Admin</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label">Lavozim (Position)</label>
        <input type="text" class="form-input" id="editEmpPosition" placeholder="Misol: Frontend dasturchi">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('modalEditEmployee')">Bekor qilish</button>
      <button class="btn btn-primary" onclick="updateEmployee()">Saqlash</button>
    </div>
  </div>
</div>

<!-- Tasdiqlash modali (o'chirish va boshqa xavfli amallar) -->
<div class="modal-overlay" id="modalConfirm">
  <div class="modal modal-confirm">
    <div class="modal-header">
      <h3 id="confirmModalTitle">Tasdiqlash</h3>
      <button type="button" class="modal-close" onclick="closeConfirmModal()">✕</button>
    </div>
    <div class="modal-body confirm-modal-body">
      <div class="confirm-modal-icon" aria-hidden="true">⚠️</div>
      <p class="confirm-modal-message" id="confirmModalMessage"></p>
      <p class="confirm-modal-detail" id="confirmModalDetail"></p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" id="confirmModalCancelBtn" onclick="closeConfirmModal()">Bekor qilish</button>
      <button type="button" class="btn btn-danger" id="confirmModalConfirmBtn" onclick="handleConfirmModalAction()">Tasdiqlash</button>
    </div>
  </div>
</div>
  `;
}

