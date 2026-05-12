/* ============================================
   FEEDBACK — Ideas, Suggestions, Complaints
   ============================================ */

let feedbackFilter = 'all';

function renderFeedback() {
  const page = document.getElementById('page-feedback');
  
  let items = FEEDBACK_ITEMS;
  if (feedbackFilter !== 'all') items = items.filter(f => f.type === feedbackFilter);

  const counts = {
    all: FEEDBACK_ITEMS.length,
    idea: FEEDBACK_ITEMS.filter(f => f.type === 'idea').length,
    suggestion: FEEDBACK_ITEMS.filter(f => f.type === 'suggestion').length,
    complaint: FEEDBACK_ITEMS.filter(f => f.type === 'complaint').length,
  };

  page.innerHTML = `
    <div class="page-header">
      <h2>Fikr-mulohaza</h2>
      <button class="btn btn-primary" onclick="openModal('modalFeedback')">+ Yangi fikr</button>
    </div>

    <div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-5);flex-wrap:wrap">
      <button class="btn ${feedbackFilter==='all'?'btn-secondary':'btn-ghost'} btn-sm" onclick="feedbackFilter='all';renderFeedback()">Barchasi (${counts.all})</button>
      <button class="btn ${feedbackFilter==='idea'?'btn-secondary':'btn-ghost'} btn-sm" onclick="feedbackFilter='idea';renderFeedback()">💡 Fikrlar (${counts.idea})</button>
      <button class="btn ${feedbackFilter==='suggestion'?'btn-secondary':'btn-ghost'} btn-sm" onclick="feedbackFilter='suggestion';renderFeedback()">📝 Takliflar (${counts.suggestion})</button>
      <button class="btn ${feedbackFilter==='complaint'?'btn-secondary':'btn-ghost'} btn-sm" onclick="feedbackFilter='complaint';renderFeedback()">⚠️ Shikoyatlar (${counts.complaint})</button>
    </div>

    <div class="feedback-grid">
      ${items.map(f => {
        const statusLabel = f.status === 'answered' ? '✅ Javob berilgan' :
          f.status === 'in_review' ? '🔍 Ko\'rib chiqilmoqda' :
          f.status === 'resolved' ? '✓ Hal qilindi' : '⏳ Kutilmoqda';
        const statusColor = f.status === 'answered' || f.status === 'resolved' ? 'var(--success)' :
          f.status === 'in_review' ? 'var(--warning)' : 'var(--text-tertiary)';
        return `
        <div class="feedback-card">
          <div class="fc-header">
            <span class="fc-type ${f.type}">${f.type === 'idea' ? '💡 Fikr' : f.type === 'suggestion' ? '📝 Taklif' : '⚠️ Shikoyat'}</span>
            <span style="font-size:var(--text-xs);color:${statusColor}">${statusLabel}</span>
          </div>
          <h4 style="font-size:var(--text-md);margin-bottom:var(--space-2)">${f.subject}</h4>
          <div class="fc-body">${f.text}</div>
          ${f.response ? `
            <div class="fc-response">
              <div class="fc-resp-label">Javob — ${f.response.author} (${f.response.date})</div>
              <div class="fc-resp-text">${f.response.text}</div>
            </div>
          ` : ''}
          <div class="fc-footer">
            <div class="fc-author">
              ${f.anonymous ? '🔒 Anonim' : `${avatarHTML(f.authorId, 20)} ${f.author}`}
            </div>
            <span>${f.date}</span>
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
}
