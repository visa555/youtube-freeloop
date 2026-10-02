// Routes: #/ → รายการเรื่อง, #/<topic> → สรุปเนื้อหา, #/<topic>/quiz → แบบฝึกหัด
// แต่ละเรื่องอยู่ที่ data/topics/<topic>.json มีทั้งสรุปเนื้อหา (lesson) และคลังข้อสอบ (questions) — ดู README.md

const LETTERS = ['A', 'B', 'C', 'D'];
const SCREENS = ['loadingScreen', 'errorScreen', 'homeScreen', 'lessonScreen', 'quizScreen', 'resultScreen'];
const SECTION_BLOCKS = ['text', 'chips', 'formulas', 'table', 'list', 'examples', 'mistakes'];
const STORAGE_KEY = 'grammar-progress';

let catalog = null;            // data/topics.json
let topics = [];               // every topic in catalog order, each with its group and number
const topicCache = new Map();  // topic id → { lesson, questions }
let topic = null;              // open topic
let lesson = null;
let bank = [];                 // all questions of the open topic
let currentHash = '';
let routeToken = 0;

// State of the current attempt
let questions = [];            // questions drawn for this round, options shuffled
let answers = [];
let checked = [];
let score = 0;
let current = 0;
let steps = [];                // question indexes that prev/next walk through
let reviewing = false;

const $ = id => document.getElementById(id);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

// "**word**" in data files becomes a highlight; everything else stays plain text.
function rich(text) {
  const frag = document.createDocumentFragment();
  String(text).split('**').forEach((part, i) => {
    if (part) frag.append(i % 2 ? el('mark', null, part) : document.createTextNode(part));
  });
  return frag;
}

function richEl(tag, className, text) {
  const node = el(tag, className);
  node.append(rich(text));
  return node;
}

// ---------- Loading & routing ----------

async function init() {
  window.addEventListener('hashchange', onHashChange);
  $('lessonDialog').addEventListener('click', e => {
    if (e.target === $('lessonDialog')) closeLessonDialog();
  });
  try {
    catalog = await fetchJSON('data/topics.json');
  } catch (err) {
    return showError(err.message);
  }
  catalog.groups.forEach(group => group.topics.forEach(t => {
    topics.push({ ...t, group, number: topics.length + 1 });
  }));
  route();
}

async function fetchJSON(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`โหลดไฟล์ ${url} ไม่ได้ (HTTP ${res.status})`);
  try {
    return await res.json();
  } catch (err) {
    throw new Error(`ไฟล์ ${url} มีรูปแบบ JSON ไม่ถูกต้อง: ${err.message}`);
  }
}

function onHashChange() {
  if (quizInProgress() && !confirm('ต้องการออกจากแบบฝึกหัดหรือไม่? คำตอบที่ทำไว้จะหายไป')) {
    history.replaceState(null, '', currentHash);
    return;
  }
  route();
}

function quizInProgress() {
  return !$('quizScreen').classList.contains('hidden') && !reviewing && checked.some(Boolean);
}

async function route() {
  const token = ++routeToken;
  currentHash = location.hash;
  checked = [];  // any navigation ends the current attempt
  closeLessonDialog();
  window.scrollTo({ top: 0 });

  const [topicId, mode] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!topicId) return renderHome();

  const t = topics.find(x => x.id === topicId);
  if (!t || !t.ready) return location.replace('#/');
  if (mode && mode !== 'quiz') return location.replace(`#/${t.id}`);

  showTopicHeader(t, mode === 'quiz');
  show('loadingScreen');
  try {
    const data = await loadTopic(t);
    if (token !== routeToken) return;  // user navigated away while loading
    topic = t;
    lesson = data.lesson;
    bank = data.questions;
    if (mode === 'quiz') startQuiz();
    else renderLesson();
  } catch (err) {
    if (token === routeToken) showError(err.message);
  }
}

async function loadTopic(t) {
  if (!topicCache.has(t.id)) {
    const file = `data/topics/${t.id}.json`;
    const data = await fetchJSON(file);
    validateTopic(data, file);
    topicCache.set(t.id, data);
  }
  return topicCache.get(t.id);
}

function validateTopic(data, file) {
  const lesson = data && data.lesson;
  if (!lesson || typeof lesson.summary !== 'string' || !Array.isArray(lesson.sections)) {
    throw new Error(`ไฟล์ ${file}: ต้องมี lesson ที่มี summary และ sections`);
  }
  lesson.sections.forEach((sec, i) => {
    const unknown = Object.keys(sec).filter(k => k !== 'title' && k !== 'icon' && !SECTION_BLOCKS.includes(k));
    if (typeof sec.title !== 'string' || unknown.length) {
      throw new Error(`ไฟล์ ${file} lesson หัวข้อที่ ${i + 1}: ต้องมี title และใช้ได้เฉพาะ ${SECTION_BLOCKS.join(', ')}${unknown.length ? ` (พบ ${unknown.join(', ')})` : ''}`);
    }
  });

  const qs = data.questions;
  if (!Array.isArray(qs) || !qs.length) {
    throw new Error(`ไฟล์ ${file}: ต้องมี questions อย่างน้อย 1 ข้อ`);
  }
  qs.forEach((item, i) => {
    const ok = item && typeof item.q === 'string' &&
      Array.isArray(item.options) && item.options.length >= 2 && item.options.length <= LETTERS.length &&
      Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.options.length;
    if (!ok) {
      throw new Error(`ไฟล์ ${file} ข้อที่ ${i + 1}: ต้องมี q, options 2–${LETTERS.length} ตัวเลือก และ answer เป็นเลขลำดับตัวเลือกที่ถูก (เริ่มนับจาก 0)`);
    }
  });
}

// ---------- Progress (saved in this browser only) ----------

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProgress(id, patch) {
  try {
    const all = loadProgress();
    all[id] = { ...all[id], ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // storage blocked (private mode etc.) — the app still works without it
  }
}

// ---------- Screens ----------

function show(id) {
  SCREENS.forEach(s => $(s).classList.toggle('hidden', s !== id));
}

function showError(message) {
  $('errorMessage').textContent = message;
  show('errorScreen');
}

function setTheme(color) {
  const root = document.documentElement.style;
  if (color) root.setProperty('--primary', color);
  else root.removeProperty('--primary');
}

function setHero(eyebrow, title, subtitle, icon) {
  $('heroEyebrow').textContent = eyebrow;
  $('heroTitle').textContent = title;
  $('heroSubtitle').textContent = subtitle;
  $('heroIcon').textContent = icon;
}

// items: [[label, href], ..., [label]] — the last item is the current page
function setCrumbs(items) {
  const bar = $('crumbs');
  bar.replaceChildren();
  bar.classList.toggle('hidden', !items.length);
  items.forEach(([label, href], i) => {
    if (i) bar.append(el('span', 'sep', '›'));
    const node = el(href ? 'a' : 'span', null, label);
    if (href) node.href = href;
    bar.append(node);
  });
}

const pad = n => String(n).padStart(2, '0');

function renderHome() {
  setTheme(null);
  const progress = loadProgress();
  const ready = topics.filter(t => t.ready);
  const done = ready.filter(t => progress[t.id] && progress[t.id].best != null).length;
  setHero(`ENGLISH GRAMMAR • ${catalog.levelEn}`, `${catalog.title} ${catalog.level}`,
    `อ่านสรุปสั้น ๆ แล้วลองทำแบบฝึกหัด • ทำแล้ว ${done} จาก ${ready.length} เรื่อง`, '📘');
  setCrumbs([]);
  document.title = `${catalog.title} ${catalog.level}`;

  const list = $('groupList');
  list.replaceChildren();
  catalog.groups.forEach(group => {
    const card = el('section', 'card group');
    card.style.setProperty('--primary', group.color);
    const head = el('div', 'group-head');
    head.append(el('span', 'group-icon', group.icon));
    const name = el('div');
    name.append(el('h2', null, group.name), el('span', 'group-meta', group.nameTh));
    head.append(name);
    card.append(head);

    const rows = el('div', 'topic-list');
    topics.filter(t => t.group === group).forEach(t => rows.append(topicRow(t, progress[t.id])));
    card.append(rows);
    list.append(card);
  });
  show('homeScreen');
}

function topicRow(t, saved) {
  const row = el(t.ready ? 'a' : 'div', t.ready ? 'topic' : 'topic soon');
  if (t.ready) row.href = `#/${t.id}`;
  const title = el('span', 'topic-title');
  title.append(el('span', null, t.title), el('small', null, t.titleTh));
  row.append(el('span', 'topic-num', pad(t.number)), el('span', 'topic-icon', t.icon), title);

  let status = t.ready ? 'เริ่มเรียน →' : 'เร็ว ๆ นี้';
  let statusClass = 'topic-status';
  if (saved && saved.best != null) {
    status = `สูงสุด ${saved.best}/${saved.total}`;
    statusClass += ' scored';
  } else if (saved && saved.read) {
    status = 'อ่านสรุปแล้ว';
  }
  row.append(el('span', statusClass, status));
  return row;
}

function showTopicHeader(t, inQuiz) {
  setTheme(t.group.color);
  setHero(`${t.group.name.toUpperCase()} • ${pad(t.number)}`, t.title, t.titleTh, t.icon);
  setCrumbs(inQuiz
    ? [['ทุกเรื่อง', '#/'], [t.title, `#/${t.id}`], ['แบบฝึกหัด']]
    : [['ทุกเรื่อง', '#/'], [t.title]]);
  document.title = `${t.title} | ${catalog.title} ${catalog.level}`;
}

// ---------- Lesson ----------

function renderLesson() {
  renderLessonInto($('lessonBody'), lesson);
  $('skipLink').href = `#/${topic.id}/quiz`;
  $('lessonQuizInfo').textContent = `สุ่ม ${roundSize()} ข้อจากคลัง ${bank.length} ข้อ แบบเลือกตอบ ตรวจและดูคำอธิบายได้ทันทีทีละข้อ`;
  show('lessonScreen');
}

function startFromLesson() {
  saveProgress(topic.id, { read: true });
  location.hash = `#/${topic.id}/quiz`;
}

function renderLessonInto(container, data) {
  container.replaceChildren();
  const intro = el('section', 'card lesson-intro');
  intro.append(el('div', 'lesson-label', 'สรุปสั้น ๆ'), richEl('p', 'lesson-summary', data.summary));
  container.append(intro);

  data.sections.forEach(sec => {
    const box = el('section', 'card lesson-section');
    box.append(el('h3', null, sec.icon ? `${sec.icon} ${sec.title}` : sec.title));
    // Blocks render in the order they are written in the JSON file.
    Object.keys(sec).filter(k => SECTION_BLOCKS.includes(k)).forEach(k => box.append(BLOCKS[k](sec[k])));
    container.append(box);
  });

  if (data.tip) {
    const tip = el('section', 'card lesson-tip');
    tip.append(el('div', 'lesson-label', '💡 จำง่าย ๆ'), richEl('p', null, data.tip));
    container.append(tip);
  }
}

const BLOCKS = {
  text(value) {
    const frag = document.createDocumentFragment();
    [].concat(value).forEach(p => frag.append(richEl('p', 'lesson-text', p)));
    return frag;
  },
  chips(items) {
    const wrap = el('div', 'chips');
    items.forEach(c => wrap.append(richEl('span', 'chip', c)));
    return wrap;
  },
  formulas(rows) {
    const wrap = el('div', 'formulas');
    rows.forEach(r => {
      const row = el('div', 'formula');
      row.append(el('span', 'formula-label', r.label), richEl('div', 'formula-text', r.formula));
      if (r.example) row.append(richEl('div', 'formula-example', r.example));
      wrap.append(row);
    });
    return wrap;
  },
  table({ head, rows }) {
    const wrap = el('div', 'table-wrap');
    const table = el('table');
    if (head) {
      const tr = el('tr');
      head.forEach(h => tr.append(el('th', null, h)));
      const thead = el('thead');
      thead.append(tr);
      table.append(thead);
    }
    const body = el('tbody');
    rows.forEach(r => {
      const tr = el('tr');
      r.forEach(c => tr.append(richEl('td', null, c)));
      body.append(tr);
    });
    table.append(body);
    wrap.append(table);
    return wrap;
  },
  list(items) {
    const ul = el('ul', 'lesson-list');
    items.forEach(i => ul.append(richEl('li', null, i)));
    return ul;
  },
  examples(items) {
    const wrap = el('div', 'examples');
    items.forEach(ex => {
      const row = el('div', 'example');
      row.append(richEl('div', 'example-en', ex.en));
      if (ex.th) row.append(richEl('div', 'example-th', ex.th));
      wrap.append(row);
    });
    return wrap;
  },
  mistakes(items) {
    const wrap = el('div', 'mistakes');
    items.forEach(m => {
      const row = el('div', 'mistake');
      const wrong = el('div', 'mistake-wrong');
      wrong.append(el('span', 'mark-icon', '✘'), richEl('span', null, m.wrong));
      const right = el('div', 'mistake-right');
      right.append(el('span', 'mark-icon', '✔'), richEl('span', null, m.right));
      row.append(wrong, right);
      if (m.why) row.append(richEl('div', 'mistake-why', m.why));
      wrap.append(row);
    });
    return wrap;
  },
};

function openLessonDialog() {
  $('dialogTitle').textContent = `📖 สรุป ${topic.title}`;
  renderLessonInto($('dialogBody'), lesson);
  $('lessonDialog').showModal();
  $('dialogBody').scrollTop = 0;
}

function closeLessonDialog() {
  if ($('lessonDialog').open) $('lessonDialog').close();
}

// ---------- Quiz ----------

const roundSize = () => Math.min(catalog.questionsPerRound, bank.length);

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startQuiz() {
  questions = shuffle(bank).slice(0, roundSize()).map(shuffleOptions);
  answers = Array(questions.length).fill(null);
  checked = Array(questions.length).fill(false);
  score = 0;
  reviewing = false;
  steps = questions.map((_, i) => i);
  current = 0;
  show('quizScreen');
  renderQuestion();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Options are reshuffled on every attempt, except questions marked keepOrder
// (e.g. "Type 0 / 1 / 2 / 3" that read better in order).
function shuffleOptions(item) {
  const order = item.options.map((_, i) => i);
  const shuffled = item.keepOrder ? order : shuffle(order);
  return { ...item, options: shuffled.map(i => item.options[i]), answer: shuffled.indexOf(item.answer) };
}

function renderQuestion() {
  const item = questions[current];
  const pos = steps.indexOf(current);
  $('questionNumber').textContent = `ข้อ ${current + 1}`;
  $('questionText').replaceChildren(rich(item.q));
  $('progressText').textContent = reviewing
    ? `ทบทวนข้อที่ผิด ${pos + 1} / ${steps.length}`
    : `ข้อ ${pos + 1} / ${steps.length}`;
  $('scoreText').textContent = `คะแนน ${score}`;
  $('progressBar').style.width = `${((pos + 1) / steps.length) * 100}%`;

  const container = $('options');
  container.replaceChildren();
  item.options.forEach((opt, i) => {
    const b = el('button', 'option');
    b.type = 'button';
    b.append(el('span', 'letter', LETTERS[i]), richEl('span', null, opt));
    if (answers[current] === i) b.classList.add('selected');
    if (checked[current]) {
      b.disabled = true;
      if (i === item.answer) b.classList.add('correct');
      else if (i === answers[current]) b.classList.add('wrong');
    }
    b.onclick = () => selectAnswer(i);
    container.append(b);
  });

  const fb = $('feedback');
  if (checked[current]) {
    const right = answers[current] === item.answer;
    fb.className = 'feedback ' + (right ? 'correct' : 'wrong');
    fb.replaceChildren(
      right ? '✅ ' : '❌ ',
      el('b', null, right ? 'ตอบถูก!' : 'ตอบไม่ถูก'),
      ' ',
      rich(item.explanation || `คำตอบที่ถูกต้องคือ “${item.options[item.answer]}”`)
    );
  } else {
    fb.className = 'feedback hidden';
    fb.replaceChildren();
  }

  const last = pos === steps.length - 1;
  $('prevBtn').disabled = pos === 0;
  $('checkBtn').disabled = answers[current] === null;
  $('checkBtn').classList.toggle('hidden', checked[current]);
  $('nextBtn').classList.toggle('hidden', !checked[current]);
  $('nextBtn').textContent = !last ? 'ข้อถัดไป →' : reviewing ? 'กลับไปหน้าผล →' : 'ดูผลคะแนน →';
}

function selectAnswer(i) {
  if (checked[current]) return;
  answers[current] = i;
  renderQuestion();
}

function checkAnswer() {
  if (answers[current] === null) return;
  checked[current] = true;
  if (answers[current] === questions[current].answer) score++;
  renderQuestion();
}

function goTo(i) {
  current = i;
  renderQuestion();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextQuestion() {
  const pos = steps.indexOf(current);
  if (pos < steps.length - 1) goTo(steps[pos + 1]);
  else if (reviewing) showResult();
  else finishRound();
}

function prevQuestion() {
  const pos = steps.indexOf(current);
  if (pos > 0) goTo(steps[pos - 1]);
}

let newBest = false;

function finishRound() {
  const saved = loadProgress()[topic.id] || {};
  const pct = score / questions.length;
  newBest = saved.best == null || pct > saved.best / saved.total;
  saveProgress(topic.id, {
    attempts: (saved.attempts || 0) + 1,
    ...(newBest ? { best: score, total: questions.length } : {}),
  });
  showResult();
}

function showResult() {
  const total = questions.length;
  const pct = Math.round(score / total * 100);
  $('finalScore').textContent = score;
  $('finalTotal').textContent = `/ ${total}`;
  $('correctCount').textContent = score;
  $('wrongCount').textContent = total - score;
  $('percent').textContent = pct + '%';
  let title = 'ลองอ่านสรุปแล้วทำอีกครั้งนะ';
  if (pct >= 80) title = 'ยอดเยี่ยมมาก! 🌟';
  else if (pct >= 60) title = 'ทำได้ดีมาก! 👍';
  else if (pct >= 50) title = 'ผ่านเกณฑ์พื้นฐาน 📚';
  $('resultTitle').textContent = title;
  $('resultMessage').textContent = `คุณทำได้ ${score} จาก ${total} ข้อ` + (newBest ? ' • 🏆 สถิติใหม่ของเรื่องนี้!' : '');
  $('reviewBtn').classList.toggle('hidden', score === total);
  $('lessonLink').href = `#/${topic.id}`;

  const next = topics.slice(topic.number).find(t => t.ready);
  $('nextTopicLink').classList.toggle('hidden', !next);
  if (next) $('nextTopicLink').href = `#/${next.id}`;

  show('resultScreen');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Walk through wrong answers only, keeping the round's question numbers.
function reviewWrong() {
  steps = questions.map((_, i) => i).filter(i => answers[i] !== questions[i].answer);
  if (!steps.length) return;
  reviewing = true;
  current = steps[0];
  show('quizScreen');
  renderQuestion();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function confirmRestart() {
  if (confirm('ต้องการเริ่มใหม่หรือไม่? ระบบจะสุ่มข้อชุดใหม่ และคะแนนรอบนี้จะถูกล้าง')) startQuiz();
}

init();
