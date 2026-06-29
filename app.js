const MODULES = [
  { id: 'hero',     icon: 'ti-layout-navbar',    name: '히어로 섹션',   desc: '메인 배너, 핵심 메시지' },
  { id: 'offer',    icon: 'ti-tag',               name: '오퍼/혜택',     desc: '할인율, 기간, 조건' },
  { id: 'products', icon: 'ti-shopping-bag',      name: '상품 쇼케이스', desc: '추천 상품 그리드/캐러셀' },
  { id: 'social',   icon: 'ti-star',              name: '소셜 프루프',   desc: '후기, 별점, 고객 수' },
  { id: 'cta',      icon: 'ti-arrow-right-circle',name: 'CTA 섹션',      desc: '구매/신청 유도 버튼' },
  { id: 'faq',      icon: 'ti-help-circle',       name: 'FAQ',           desc: '자주 묻는 질문' },
  { id: 'timer',    icon: 'ti-clock',             name: '카운트다운',    desc: '마감 시간 긴박감' },
  { id: 'trust',    icon: 'ti-shield-check',      name: '신뢰 배지',     desc: '보안, 환불, 인증' },
];

let selected = [];
let orderItems = [];
let currentTab = 'brief';
let lastResult = {};
let dragSrc = null;
let apiKey = localStorage.getItem('anthropic_api_key') || '';

// ── Init ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderModules();
  renderOrder();
  injectApiKeyNotice();
});

// ── API Key ───────────────────────────────────────
function injectApiKeyNotice() {
  if (apiKey) return;
  const notice = document.createElement('div');
  notice.className = 'api-notice';
  notice.id = 'api-notice';
  notice.innerHTML = `
    <i class="ti ti-key" aria-hidden="true"></i>
    <div>
      <div>Anthropic API 키가 필요해요. <a href="https://console.anthropic.com/settings/keys" target="_blank">여기서 발급</a>받을 수 있어요.</div>
      <div class="api-key-row">
        <input type="password" id="api-key-input" placeholder="sk-ant-..." value="${apiKey}">
        <button onclick="saveApiKey()">저장</button>
      </div>
    </div>
  `;
  document.querySelector('.action-row').before(notice);
}

function saveApiKey() {
  const val = document.getElementById('api-key-input').value.trim();
  if (!val.startsWith('sk-')) {
    alert('올바른 API 키를 입력해주세요 (sk- 로 시작)');
    return;
  }
  apiKey = val;
  localStorage.setItem('anthropic_api_key', val);
  document.getElementById('api-notice')?.remove();
}

// ── Modules ───────────────────────────────────────
function renderModules() {
  const grid = document.getElementById('module-grid');
  grid.innerHTML = MODULES.map(m => `
    <div class="module-card${selected.includes(m.id) ? ' selected' : ''}"
         onclick="toggleModule('${m.id}')"
         role="checkbox"
         aria-checked="${selected.includes(m.id)}"
         tabindex="0"
         onkeydown="if(event.key==='Enter'||event.key===' ')toggleModule('${m.id}')">
      <i class="ti ${m.icon} m-icon" aria-hidden="true"></i>
      <div class="m-name">${m.name}</div>
      <div class="m-desc">${m.desc}</div>
    </div>
  `).join('');
}

function toggleModule(id) {
  if (selected.includes(id)) {
    selected = selected.filter(s => s !== id);
    orderItems = orderItems.filter(o => o !== id);
  } else {
    selected.push(id);
    orderItems.push(id);
  }
  renderModules();
  renderOrder();
}

// ── Order list ─────────────────────────────────────
function renderOrder() {
  const list = document.getElementById('order-list');
  if (!orderItems.length) {
    list.innerHTML = `
      <div class="empty-order">
        <i class="ti ti-stack-2" aria-hidden="true"></i>
        <span>모듈을 선택하면 여기에 나타나요</span>
      </div>`;
    return;
  }
  list.innerHTML = orderItems.map((id, i) => {
    const m = MODULES.find(x => x.id === id);
    return `
      <div class="order-item" draggable="true" data-id="${id}"
           ondragstart="onDragStart(event)"
           ondragover="onDragOver(event)"
           ondrop="onDrop(event, ${i})"
           ondragleave="onDragLeave(event)">
        <i class="ti ti-grip-vertical drag-handle" aria-hidden="true"></i>
        <i class="ti ${m.icon} item-icon" aria-hidden="true"></i>
        <span class="item-label">${m.name}</span>
        <button class="remove-btn" onclick="removeItem('${id}')" aria-label="${m.name} 제거">
          <i class="ti ti-x" aria-hidden="true"></i>
        </button>
      </div>`;
  }).join('');
}

function removeItem(id) {
  selected = selected.filter(s => s !== id);
  orderItems = orderItems.filter(o => o !== id);
  renderModules();
  renderOrder();
}

// ── Drag & Drop ────────────────────────────────────
function onDragStart(e) {
  dragSrc = e.currentTarget.dataset.id;
  e.dataTransfer.effectAllowed = 'move';
}

function onDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function onDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function onDrop(e, toIdx) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const fromIdx = orderItems.indexOf(dragSrc);
  if (fromIdx < 0 || fromIdx === toIdx) return;
  orderItems.splice(fromIdx, 1);
  orderItems.splice(toIdx, 0, dragSrc);
  renderOrder();
}

// ── Tabs ──────────────────────────────────────────
function switchTab(tab, el) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderResult();
}

// ── Reset ─────────────────────────────────────────
function reset() {
  selected = [];
  orderItems = [];
  lastResult = {};
  document.getElementById('draft-input').value = '';
  document.getElementById('result-content').style.display = 'none';
  document.querySelector('.result-placeholder').style.display = 'flex';
  renderModules();
  renderOrder();
}

// ── Analyze ───────────────────────────────────────
async function analyze() {
  const draft = document.getElementById('draft-input').value.trim();
  if (!draft) {
    alert('프로모션 초안을 먼저 입력해주세요.');
    return;
  }

  if (!apiKey) {
    alert('API 키를 먼저 입력해주세요.');
    document.getElementById('api-key-input')?.focus();
    return;
  }

  const modules = orderItems.length
    ? orderItems.map(id => MODULES.find(m => m.id === id).name)
    : MODULES.map(m => m.name);

  const btn = document.getElementById('analyze-btn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px"></div> 분석 중...';

  // Show result area with loading
  document.querySelector('.result-placeholder').style.display = 'none';
  document.getElementById('result-content').style.display = 'block';
  document.getElementById('tab-body').innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Claude가 페이지 구성을 분석하고 있어요...</span>
    </div>`;

  const systemPrompt = `당신은 프로모션 페이지 구성 전문가입니다. 아래 JSON 형식만 반환하세요. 마크다운 코드블록 없이 순수 JSON만 반환하세요. 각 문자열 값 안에 줄바꿈이 필요하면 반드시 \\n 이스케이프를 사용하고, 큰따옴표는 \\" 로 이스케이프 하세요.

{"brief":{"goal":"캠페인 핵심 목표 1-2문장","audience":"타겟 고객층","modules":["모듈1","모듈2"],"message":"핵심 메시지","caution":"디자인 주의사항"},"figma":"Figma 프롬프트 (2-3문단, 줄바꿈은 \\n 사용)","notion":"Notion 구조 (줄바꿈은 \\n 사용)"}`;

  const userMsg = `프로모션 초안:\n${draft}\n\n사용할 모듈 (순서대로):\n${modules.join(', ')}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `API 오류 (${res.status})`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '{}';

    let parsed;
    try {
      const clean = text.replace(/^```json\s*/,'').replace(/```\s*$/,'').trim();
      parsed = JSON.parse(clean);
    } catch(parseErr) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('응답 형식 오류: ' + parseErr.message);
      }
    }

    lastResult = {
      brief: parsed.brief,
      figma: parsed.figma,
      notion: parsed.notion,
    };

    renderResult();

  } catch (e) {
    document.getElementById('tab-body').innerHTML = `
      <div style="color:#c0392b;font-size:13px;padding:1rem;background:#fdf0f0;border-radius:8px;line-height:1.6">
        <strong>오류가 발생했어요</strong><br>${e.message}
      </div>`;
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-sparkles" aria-hidden="true"></i> Claude로 구성 분석하기';
}

// ── Render result ─────────────────────────────────
function renderResult() {
  const body = document.getElementById('tab-body');
  if (!lastResult[currentTab]) {
    body.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>분석 중...</span></div>`;
    return;
  }
  if (currentTab === 'brief') renderBrief(body);
  else if (currentTab === 'figma') renderCode(body, lastResult.figma, 'Figma / Claude Design 프롬프트', 'figma-text');
  else renderCode(body, lastResult.notion, 'Notion 페이지 구조', 'notion-text');
}

function renderBrief(el) {
  const d = lastResult.brief || {};
  el.innerHTML = `
    <div class="brief-section">
      <div class="brief-label"><i class="ti ti-target" aria-hidden="true"></i> 캠페인 목표</div>
      <div class="brief-text">${escHtml(d.goal || '-')}</div>
    </div>
    <div class="brief-section">
      <div class="brief-label"><i class="ti ti-users" aria-hidden="true"></i> 타겟 오디언스</div>
      <div class="brief-text">${escHtml(d.audience || '-')}</div>
    </div>
    <div class="brief-section">
      <div class="brief-label"><i class="ti ti-layout-2" aria-hidden="true"></i> 추천 페이지 구성</div>
      <div class="module-pills">
        ${(d.modules || []).map(m => `<span class="module-pill">${escHtml(m)}</span>`).join('')}
      </div>
    </div>
    <div class="brief-section">
      <div class="brief-label"><i class="ti ti-bulb" aria-hidden="true"></i> 핵심 메시지</div>
      <div class="brief-text">${escHtml(d.message || '-')}</div>
    </div>
    <div class="brief-section">
      <div class="brief-label"><i class="ti ti-alert-triangle" aria-hidden="true"></i> 디자인 주의사항</div>
      <div class="brief-text">${escHtml(d.caution || '-')}</div>
    </div>
  `;
}

function renderCode(el, text, label, id) {
  el.innerHTML = `
    <div class="brief-label" style="margin-bottom:10px"><i class="ti ti-code" aria-hidden="true"></i> ${label}</div>
    <div class="code-block">
      <pre id="${id}">${escHtml(text || '')}</pre>
    </div>
    <div class="copy-row">
      <button class="btn-copy" onclick="copyText('${id}')">
        <i class="ti ti-copy" aria-hidden="true"></i> 복사하기
      </button>
    </div>
  `;
}

function copyText(id) {
  const text = document.getElementById(id)?.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    const btn = event.currentTarget;
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="ti ti-check" aria-hidden="true"></i> 복사됨';
    setTimeout(() => { btn.innerHTML = orig; }, 1500);
  });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
