// App de Tareas - JS v2
'use strict';
const qs  = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

// ── State ──
let tasks            = [];
let currentFilter    = 'all';
let currentPriority  = 'all';
let selectedColor    = '#ffffff';
let editingTaskId    = null;

// ── DOM refs ──
const usernameEl      = qs('#username');
const datetimeEl      = qs('#datetime');
const themeToggle     = qs('#themeToggle');
const themeIcon       = qs('#themeIcon');
const tasksGrid       = qs('#tasksGrid');
const fab             = qs('#fab');
const modal           = qs('#modal');
const taskForm        = qs('#taskForm');
const subtasksList    = qs('#subtasksList');
const addSubtaskBtn   = qs('#addSubtaskBtn');
const colorChoices    = qs('#colorChoices');
const cancelBtn       = qs('#cancelBtn');
const cancelBtn2      = qs('#cancelBtn2');
const filterBtns      = qsa('.filter-btn');
const completedCountEl= qs('#completedCount');
const totalCountEl    = qs('#totalCount');
const progressBar     = qs('#progressBar');
const detailModal     = qs('#detailModal');
const detailBody      = qs('#detailBody');
const modalTitle      = qs('#modalTitle');
const statusSelect    = qs('#statusSelect');
const prioritySelect  = qs('#prioritySelect');
const priorityFilter  = qs('#priorityFilter');

// ── SVG trash icon ──
const trashSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="3 6 5 6 21 6"/>
  <path d="M19 6l-1 14H6L5 6"/>
  <path d="M10 11v6"/><path d="M14 11v6"/>
  <path d="M9 6V4h6v2"/>
</svg>`;

// ── Helpers ──
function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function persist() { localStorage.setItem('tasks', JSON.stringify(tasks)); }

// ── Username ──
usernameEl.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); usernameEl.blur(); }
});
usernameEl.addEventListener('blur', () => {
  localStorage.setItem('username', usernameEl.textContent.trim() || 'Mi nombre');
});

// ── Clock ──
function updateClock() {
  const d = new Date();
  const date = d.toLocaleDateString('es', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const time = d.toLocaleTimeString('es');
  datetimeEl.textContent = date + ' · ' + time;
}
setInterval(updateClock, 1000);
updateClock();

// ── Theme ──
function applyTheme(dark) {
  document.documentElement.classList.toggle('dark', dark);
  themeIcon.textContent = dark ? '🌙' : '☀️';
  themeToggle.classList.toggle('dark', dark);
}
themeToggle.addEventListener('click', () => {
  const isDark = !document.documentElement.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  applyTheme(isDark);
});

// ── Color choices ──
colorChoices.addEventListener('click', e => {
  const btn = e.target.closest('.choice');
  if (!btn) return;
  selectColor(btn.dataset.color);
});
function selectColor(c) {
  selectedColor = c;
  qsa('.color.choice').forEach(b => b.classList.toggle('selected', b.dataset.color === c));
}

// ── Subtask row builder ──
function addSubtaskRow(text = '') {
  const row = document.createElement('div');
  row.className = 'subtask-row';
  const inp = document.createElement('input');
  inp.className = 'subtask-input';
  inp.placeholder = 'Nombre de la subtarea';
  inp.value = text;
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'subtask-del';
  del.innerHTML = trashSVG;
  del.addEventListener('click', () => row.remove());
  row.appendChild(inp);
  row.appendChild(del);
  subtasksList.appendChild(row);
}
addSubtaskBtn.addEventListener('click', () => addSubtaskRow());

// ── Open create / edit modal ──
function openModal(taskId = null) {
  editingTaskId = taskId;
  taskForm.reset();
  subtasksList.innerHTML = '';
  selectColor('#ffffff');
  statusSelect.value   = 'not_started';
  prioritySelect.value = 'low';
  modalTitle.textContent = taskId ? 'Editar tarea' : 'Crear tarea';

  if (taskId !== null) {
    const t = tasks.find(x => x.id == taskId);
    if (!t) return;
    qs('#taskTitle').value = t.title;
    qs('#taskDesc').value  = t.desc  || '';
    qs('#taskDue').value   = t.due   || '';
    qs('#taskDur').value   = t.dur   || '';
    selectColor(t.color   || '#ffffff');
    statusSelect.value   = t.status   || 'not_started';
    prioritySelect.value = t.priority || 'low';
    (t.subtasks || []).forEach(st => addSubtaskRow(st.title));
  }
  modal.classList.remove('hidden');
}

fab.addEventListener('click', () => openModal());

function closeCreateModal() {
  modal.classList.add('hidden');
  editingTaskId = null;
}
cancelBtn.addEventListener('click',  closeCreateModal);
cancelBtn2.addEventListener('click', closeCreateModal);

// ── Form submit (create / update) ──
taskForm.addEventListener('submit', e => {
  e.preventDefault();
  const title    = qs('#taskTitle').value.trim();
  if (!title) return;
  const desc     = qs('#taskDesc').value.trim();
  const due      = qs('#taskDue').value  || null;
  const dur      = qs('#taskDur').value  || null;
  const status   = statusSelect.value    || 'not_started';
  const priority = prioritySelect.value  || 'low';
  const rawSubs  = Array.from(subtasksList.querySelectorAll('.subtask-input'))
    .map(s => s.value.trim()).filter(Boolean);

  if (editingTaskId !== null) {
    const idx = tasks.findIndex(x => x.id == editingTaskId);
    if (idx > -1) {
      const old = tasks[idx];
      const subtasks = rawSubs.map(stTitle => {
        const existing = (old.subtasks || []).find(s => s.title === stTitle);
        return existing || { id: Date.now() + Math.random(), title: stTitle, done: false };
      });
      tasks[idx] = { ...old, title, desc, subtasks, color: selectedColor, due, dur, status, priority };
    }
  } else {
    const subtasks = rawSubs.map(stTitle => ({ id: Date.now() + Math.random(), title: stTitle, done: false }));
    tasks.unshift({ id: Date.now() + Math.random(), title, desc, subtasks, color: selectedColor, due, dur, status, priority, created: Date.now() });
  }

  persist();
  closeCreateModal();
  renderTasks();
});

// ── Render grid ──
function renderTasks() {
  tasksGrid.innerHTML = '';
  const filtered = tasks.filter(t => {
    const statusOk   = currentFilter   === 'all' || t.status   === currentFilter;
    const priorityOk = currentPriority === 'all' || t.priority === currentPriority;
    return statusOk && priorityOk;
  });

  filtered.forEach(t => {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.style.background = t.color || '#fff';

    const titleEl = document.createElement('div');
    titleEl.className = 'task-title';
    titleEl.textContent = t.title;
    card.appendChild(titleEl);

    if (t.desc) {
      const descEl = document.createElement('div');
      descEl.className = 'task-desc-preview';
      descEl.textContent = t.desc.length > 70 ? t.desc.slice(0, 70) + '…' : t.desc;
      card.appendChild(descEl);
    }

    // bottom-left dots (status + priority)
    const dots = document.createElement('div');
    dots.className = 'task-card-dots';
    const statusDot = document.createElement('span');
    statusDot.className = 'card-dot status-' + (t.status || 'not_started');
    statusDot.title = { not_started: 'Sin iniciar', in_progress: 'En progreso', complete: 'Completa' }[t.status] || '';
    const prioMap = { low: '🟢 Baja', medium: '🟡 Media', high: '🔴 Alta' };
    const priorityDot = document.createElement('span');
    priorityDot.className = 'card-dot priority-' + (t.priority || 'low');
    priorityDot.title = prioMap[t.priority] || 'Baja';
    dots.appendChild(statusDot);
    dots.appendChild(priorityDot);
    card.appendChild(dots);

    if (t.subtasks && t.subtasks.length) {
      const sc = document.createElement('div');
      sc.className = 'subtask-count';
      sc.textContent = '+' + t.subtasks.length;
      card.appendChild(sc);
    }

    card.addEventListener('click', () => openDetail(t.id));
    tasksGrid.appendChild(card);
  });

  updateFooter();
}

// ── Filters ──
filterBtns.forEach(b => b.addEventListener('click', () => {
  filterBtns.forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  currentFilter = b.dataset.filter;
  renderTasks();
}));
priorityFilter.addEventListener('change', () => {
  currentPriority = priorityFilter.value;
  renderTasks();
});

// ── Footer ──
function updateFooter() {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.status === 'complete').length;
  totalCountEl.textContent     = total;
  completedCountEl.textContent = completed;
  progressBar.style.width = total ? Math.round((completed / total) * 100) + '%' : '0%';
}

// ── Detail modal ──
function openDetail(id) {
  const t = tasks.find(x => x.id == id);
  if (!t) return;
  detailBody.innerHTML = '';

  // ── Title
  const h3 = document.createElement('h3');
  h3.style.cssText = 'margin: 0 36px 0 0; font-size:1.15rem;';
  h3.textContent   = t.title;
  detailBody.appendChild(h3);

  // ── Description
  if (t.desc) {
    const p = document.createElement('p');
    p.style.cssText = 'color:var(--muted);font-size:.9rem;margin:8px 0 0;';
    p.textContent   = t.desc;
    detailBody.appendChild(p);
  }

  // ── Due / duration / priority metadata
  {
    const meta = document.createElement('div');
    meta.style.cssText = 'display:flex;gap:16px;font-size:.82rem;color:var(--muted);margin-top:12px;flex-wrap:wrap;';
    if (t.due) { const s = document.createElement('span'); s.textContent = '📅 ' + t.due; meta.appendChild(s); }
    if (t.dur) { const s = document.createElement('span'); s.textContent = '⏱ ' + t.dur + ' hrs'; meta.appendChild(s); }
    const prioLabels = { low: '🟢 Baja', medium: '🟡 Media', high: '🔴 Alta' };
    const ps = document.createElement('span');
    ps.textContent = prioLabels[t.priority] || '🟢 Baja';
    meta.appendChild(ps);
    if (meta.children.length) detailBody.appendChild(meta);
  }

  // ── Status selector
  const stLabel = document.createElement('div');
  stLabel.className   = 'form-label';
  stLabel.style.marginTop = '20px';
  stLabel.textContent = 'Estado';
  detailBody.appendChild(stLabel);

  const stSel = document.createElement('div');
  stSel.className = 'status-selector';
  [['not_started','Sin iniciar'],['in_progress','En progreso'],['complete','Completa']].forEach(([val, lbl]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className   = 'status-opt' + (t.status === val ? ' sel' : '');
    btn.dataset.val = val;
    btn.textContent = lbl;
    btn.addEventListener('click', () => {
      t.status = val;
      persist();
      renderTasks();
      stSel.querySelectorAll('.status-opt').forEach(b => b.classList.toggle('sel', b.dataset.val === val));
    });
    stSel.appendChild(btn);
  });
  detailBody.appendChild(stSel);

  // ── Subtasks
  const subLabel = document.createElement('div');
  subLabel.className      = 'form-label';
  subLabel.style.marginTop = '22px';
  subLabel.textContent    = 'Subtareas';
  detailBody.appendChild(subLabel);

  if (!t.subtasks || !t.subtasks.length) {
    const empty = document.createElement('p');
    empty.style.cssText = 'color:var(--muted);font-size:.87rem;margin:6px 0 0;';
    empty.textContent   = 'No hay subtareas por mostrar';
    detailBody.appendChild(empty);
  } else {
    const pWrap = document.createElement('div');
    pWrap.className = 'subtask-progress-wrap';
    const pBar = document.createElement('div');
    pBar.className  = 'subtask-progress-bar';
    const calcPct = () => {
      const done = t.subtasks.filter(s => s.done).length;
      return Math.round(done / t.subtasks.length * 100);
    };
    pBar.style.width = calcPct() + '%';
    pWrap.appendChild(pBar);
    detailBody.appendChild(pWrap);

    const subItems = document.createElement('div');
    subItems.style.marginTop = '8px';

    t.subtasks.forEach(st => {
      const row = document.createElement('div');
      row.className = 'detail-subtask-item';

      const cb  = document.createElement('input');
      cb.type   = 'checkbox';
      cb.checked = !!st.done;

      const lbl = document.createElement('span');
      lbl.className   = 'detail-sub-label' + (st.done ? ' done' : '');
      lbl.textContent = st.title;

      cb.addEventListener('change', () => {
        st.done = cb.checked;
        lbl.classList.toggle('done', st.done);
        pBar.style.width = calcPct() + '%';
        const allDone = t.subtasks.every(s => s.done);
        const anyDone = t.subtasks.some(s => s.done);
        t.status = allDone ? 'complete' : anyDone ? 'in_progress' : 'not_started';
        persist();
        renderTasks();
        stSel.querySelectorAll('.status-opt').forEach(b => b.classList.toggle('sel', b.dataset.val === t.status));
      });

      row.appendChild(cb);
      row.appendChild(lbl);
      subItems.appendChild(row);
    });
    detailBody.appendChild(subItems);
  }

  // ── Action buttons
  const actions = document.createElement('div');
  actions.className = 'detail-actions';

  const editBtn = document.createElement('button');
  editBtn.type        = 'button';
  editBtn.className   = 'btn-primary';
  editBtn.textContent = 'Editar';
  editBtn.addEventListener('click', () => {
    detailModal.classList.add('hidden');
    openModal(t.id);
  });

  const delBtn = document.createElement('button');
  delBtn.type        = 'button';
  delBtn.className   = 'btn-danger';
  delBtn.textContent = 'Eliminar';
  delBtn.addEventListener('click', () => openConfirmModal(t.title, () => {
    tasks = tasks.filter(x => x.id != id);
    persist();
    renderTasks();
    detailModal.classList.add('hidden');
  }));

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);
  detailBody.appendChild(actions);

  detailModal.classList.remove('hidden');
}

// ── Close modals: X button or click on backdrop ──
qs('#closeDetail').addEventListener('click', () => detailModal.classList.add('hidden'));
[modal, detailModal].forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); });
});

// ── Confirm delete modal ──
const confirmModal     = qs('#confirmModal');
const confirmMsg       = qs('#confirmMsg');
const confirmDeleteBtn = qs('#confirmDeleteBtn');
const confirmCancelBtn = qs('#confirmCancelBtn');
let _confirmCallback   = null;

function openConfirmModal(taskTitle, onConfirm) {
  confirmMsg.textContent = '¿Estás seguro de que deseas eliminar "' + taskTitle + '"? Esta acción no se puede deshacer.';
  _confirmCallback = onConfirm;
  confirmModal.classList.remove('hidden');
}
confirmDeleteBtn.addEventListener('click', () => {
  if (_confirmCallback) _confirmCallback();
  _confirmCallback = null;
  confirmModal.classList.add('hidden');
});
confirmCancelBtn.addEventListener('click', () => {
  _confirmCallback = null;
  confirmModal.classList.add('hidden');
});
confirmModal.addEventListener('click', e => {
  if (e.target === confirmModal) {
    _confirmCallback = null;
    confirmModal.classList.add('hidden');
  }
});

// ── Init ──
function load() {
  const name = localStorage.getItem('username');
  if (name) usernameEl.textContent = name;
  applyTheme(localStorage.getItem('theme') === 'dark');

  const stored = localStorage.getItem('tasks');
  tasks = stored ? JSON.parse(stored) : [];

  if (!tasks.length) {
    tasks = [{
      id: 1, title: 'Tarea de ejemplo', desc: 'Descripción de la tarea de bienvenida.',
      subtasks: [
        { id: 11, title: 'Revisar diseño',   done: true  },
        { id: 12, title: 'Añadir funciones', done: false }
      ],
      color: '#ffd8cc', due: '2026-03-31', dur: '3', status: 'in_progress', priority: 'medium', created: Date.now()
    }];
    persist();
  }
  renderTasks();
}
load();

// ── Pomodoro ──
let pomodoroMode             = 'focus';
let pomodoroRunning          = false;
let pomodoroInterval         = null;
let pomodoroTotalSeconds     = 25 * 60;
let pomodoroRemainingSeconds = 25 * 60;

const fabPomodoro       = qs('#fabPomodoro');
const pomodoroModal2    = qs('#pomodoroModal');
const closePomodoroBtn  = qs('#closePomodoroModal');
const pomodoroTimeInput = qs('#pomodoroTime');
const pomodoroLabelEl   = qs('#pomodoroLabel');
const pomodoroStartBtn  = qs('#pomodoroStart');
const pomodoroResetBtn2 = qs('#pomodoroReset');
const pomodoroWidget    = qs('#pomodoroWidget');
const widgetTimeEl      = qs('#widgetTime');
const widgetResetBtn    = qs('#widgetReset');
const widgetExpandBtn   = qs('#widgetExpand');
const pomoModeBtns      = qsa('.pomo-mode-btn');

function formatPomTime(secs) {
  if (secs < 0) secs = 0;
  return Math.floor(secs / 60).toString().padStart(2,'0') + ':' + (secs % 60).toString().padStart(2,'0');
}
function parsePomTime(str) {
  const p = (str || '').split(':');
  return (parseInt(p[0],10)||0)*60 + (parseInt(p[1],10)||0);
}
function pomUpdateDisplay() {
  const t = formatPomTime(pomodoroRemainingSeconds);
  pomodoroTimeInput.value  = t;
  widgetTimeEl.textContent = t;
}
function pomStop() {
  clearInterval(pomodoroInterval);
  pomodoroRunning = false;
  pomodoroStartBtn.textContent = 'Comenzar';
}
function pomStart() {
  if (pomodoroRemainingSeconds <= 0) { pomodoroRemainingSeconds = pomodoroTotalSeconds; pomUpdateDisplay(); }
  pomodoroRunning = true;
  pomodoroStartBtn.textContent = 'Pausar';
  pomodoroInterval = setInterval(() => {
    pomodoroRemainingSeconds--;
    pomUpdateDisplay();
    if (pomodoroRemainingSeconds <= 0) {
      pomStop();
      playPomodoroAlarm();
    }
  }, 1000);
}
function showPomoWidget() {
  pomodoroModal2.classList.add('hidden');
  pomodoroWidget.classList.remove('hidden');
}
function showPomoModal() {
  pomodoroWidget.classList.add('hidden');
  pomodoroModal2.classList.remove('hidden');
  pomUpdateDisplay();
}

fabPomodoro.addEventListener('click', showPomoModal);
closePomodoroBtn.addEventListener('click', () => {
  pomodoroModal2.classList.add('hidden');
  if (pomodoroRunning || pomodoroRemainingSeconds !== pomodoroTotalSeconds) pomodoroWidget.classList.remove('hidden');
});
pomodoroModal2.addEventListener('click', e => {
  if (e.target === pomodoroModal2) {
    pomodoroModal2.classList.add('hidden');
    if (pomodoroRunning || pomodoroRemainingSeconds !== pomodoroTotalSeconds) pomodoroWidget.classList.remove('hidden');
  }
});

pomoModeBtns.forEach(btn => btn.addEventListener('click', () => {
  pomoModeBtns.forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  pomodoroMode = btn.dataset.mode;
  pomodoroLabelEl.textContent = pomodoroMode === 'focus' ? 'Tiempo de enfoque' : 'Tiempo de descanso';
  pomStop();
  pomodoroTotalSeconds     = pomodoroMode === 'focus' ? 25*60 : 5*60;
  pomodoroRemainingSeconds = pomodoroTotalSeconds;
  pomUpdateDisplay();
}));

pomodoroTimeInput.addEventListener('blur', () => {
  const secs = parsePomTime(pomodoroTimeInput.value);
  if (secs > 0) { pomodoroTotalSeconds = secs; pomodoroRemainingSeconds = secs; pomStop(); pomUpdateDisplay(); }
});

pomodoroStartBtn.addEventListener('click', () => {
  if (pomodoroRunning) { pomStop(); pomodoroStartBtn.textContent = 'Continuar'; }
  else pomStart();
});
pomodoroResetBtn2.addEventListener('click', () => { pomStop(); pomodoroRemainingSeconds = pomodoroTotalSeconds; pomUpdateDisplay(); });
widgetResetBtn.addEventListener('click',  () => { pomStop(); pomodoroRemainingSeconds = pomodoroTotalSeconds; pomUpdateDisplay(); });
widgetExpandBtn.addEventListener('click', showPomoModal);

// ── Pomodoro alarm (Web Audio API — no file needed) ──
function playPomodoroAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beeps = [
      { freq: 880, start: 0,   dur: 0.18 },
      { freq: 880, start: 0.25, dur: 0.18 },
      { freq: 1100, start: 0.5, dur: 0.35 },
    ];
    beeps.forEach(({ freq, start, dur }) => {
      const osc   = ctx.createOscillator();
      const gain  = ctx.createGain();
      osc.type    = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.45, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });
    setTimeout(() => ctx.close(), 2000);
  } catch (e) { /* AudioContext not available */ }
}

// ── Drag widget (mouse + touch) ──
{
  let da = false, wx = 0, wy = 0;
  pomodoroWidget.addEventListener('mousedown', e => {
    if (e.target.closest('button')) return;
    da = true;
    const r = pomodoroWidget.getBoundingClientRect();
    wx = e.clientX - r.left; wy = e.clientY - r.top;
    pomodoroWidget.style.cursor = 'grabbing';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!da) return;
    pomodoroWidget.style.left   = (e.clientX - wx) + 'px';
    pomodoroWidget.style.top    = (e.clientY - wy) + 'px';
    pomodoroWidget.style.right  = 'auto';
    pomodoroWidget.style.bottom = 'auto';
  });
  document.addEventListener('mouseup', () => { if (da) { da = false; pomodoroWidget.style.cursor = 'grab'; } });
  pomodoroWidget.addEventListener('touchstart', e => {
    if (e.target.closest('button')) return;
    const t = e.touches[0], r = pomodoroWidget.getBoundingClientRect();
    wx = t.clientX - r.left; wy = t.clientY - r.top;
    e.preventDefault();
  }, { passive: false });
  pomodoroWidget.addEventListener('touchmove', e => {
    const t = e.touches[0];
    pomodoroWidget.style.left   = (t.clientX - wx) + 'px';
    pomodoroWidget.style.top    = (t.clientY - wy) + 'px';
    pomodoroWidget.style.right  = 'auto';
    pomodoroWidget.style.bottom = 'auto';
    e.preventDefault();
  }, { passive: false });
}

