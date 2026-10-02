// Routes: #/ → เลือกวิชา, #/<subject> → เลือกชุดข้อสอบ,
//         #/<subject>/<set>/practice → ฝึกทำ (ตรวจทีละข้อ), #/<subject>/<set>/exam → จำลองสอบ (จับเวลา ส่งทีเดียว)
// ข้อสอบอยู่ที่ data/<subject>/<topic>.json และชุดข้อสอบที่ data/<subject>/sets.json
// ซึ่งกำหนดข้อ ลำดับข้อ และลำดับตัวเลือกไว้ตายตัว สร้างด้วย tools/build_sets.py (ดู README.md)

const LEVELS = [1, 2, 3];
const MODE_NAMES = { practice: 'ฝึกทำ', exam: 'จำลองสอบ' };
const SCREENS = ['loadingScreen', 'errorScreen', 'homeScreen', 'subjectScreen', 'quizScreen', 'resultScreen'];
const STORAGE_KEY = 'onet-sets';
const HISTORY_SIZE = 10;
const MAX_OPTIONS = 4;

let catalog = null;            // data/subjects.json
const subjectCache = new Map(); // subject id → { byId: question id → question (with its topic), sets }
let subject = null;            // open subject
let sets = [];                 // sets of the open subject
let byId = new Map();
let examSet = null;            // open set
let currentHash = '';
let routeToken = 0;

// State of the current attempt
let mode = 'practice';
let questions = [];            // questions of the set, options in the set's order
let answers = [];
let checked = [];              // practice: checked one by one • exam: all at once on submit
let flagged = [];
let score = 0;
let current = 0;
let steps = [];                // question indexes that prev/next walk through
let reviewing = false;
let submitted = false;
let timeUp = false;
let newBest = false;
let startedAt = 0;
let usedSeconds = 0;
let deadline = 0;
let timer = null;

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

const pad = n => String(n).padStart(2, '0');
const formatTime = sec => `${Math.floor(sec / 60)}:${pad(sec % 60)}`;
const levelName = level => catalog.levels[level - 1];
const sum = list => list.reduce((a, b) => a + b, 0);
const setName = s => `ชุดที่ ${s.id}`;

// ---------- Loading & routing ----------

async function init() {
  window.addEventListener('hashchange', onHashChange);
  window.addEventListener('beforeunload', e => {
    if (quizInProgress()) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
  try {
    catalog = await fetchJSON('data/subjects.json');
  } catch (err) {
    return showError(err.message);
  }
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
  if (quizInProgress() && !confirm('ต้องการออกจากข้อสอบหรือไม่? คำตอบที่ทำไว้จะหายไป')) {
    history.replaceState(null, '', currentHash);
    return;
  }
  route();
}

function quizInProgress() {
  if ($('quizScreen').classList.contains('hidden') || reviewing) return false;
  return mode === 'exam' ? !submitted && answers.some(a => a !== null) : checked.some(Boolean);
}

async function route() {
  const token = ++routeToken;
  currentHash = location.hash;
  stopTimer();
  answers = [];  // any navigation ends the current attempt
  checked = [];
  window.scrollTo({ top: 0 });

  const [subjectId, setId, modeId] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!subjectId) return renderHome();

  const s = catalog.subjects.find(x => x.id === subjectId);
  if (!s || !s.sets) return location.replace('#/');
  if (setId && !MODE_NAMES[modeId]) return location.replace(`#/${s.id}`);

  showSubjectHeader(s);
  show('loadingScreen');
  try {
    const data = await loadSubject(s);
    if (token !== routeToken) return;  // user navigated away while loading
    subject = s;
    sets = data.sets;
    byId = data.byId;
    if (!setId) return renderSubject();
    examSet = sets.find(x => String(x.id) === setId);
    if (!examSet) return location.replace(`#/${s.id}`);
    showSubjectHeader(s, examSet, modeId);
    startQuiz(modeId);
  } catch (err) {
    if (token === routeToken) showError(err.message);
  }
}

async function loadSubject(s) {
  if (!subjectCache.has(s.id)) {
    const [lists, setList] = await Promise.all([
      Promise.all(s.topics.filter(t => t.ready).map(async t => {
        const file = `data/${s.id}/${t.id}.json`;
        const data = await fetchJSON(file);
        validateQuestions(data, file);
        return data.map(q => ({ ...q, topic: t }));
      })),
      fetchJSON(`data/${s.id}/sets.json`),
    ]);
    const map = new Map(lists.flat().map(q => [q.id, q]));
    validateSets(setList, map, `data/${s.id}/sets.json`);
    subjectCache.set(s.id, { byId: map, sets: setList });
  }
  return subjectCache.get(s.id);
}

function validateQuestions(data, file) {
  if (!Array.isArray(data) || !data.length) {
    throw new Error(`ไฟล์ ${file} ต้องเป็นรายการข้อสอบ [ ... ] อย่างน้อย 1 ข้อ`);
  }
  data.forEach((item, i) => {
    const ok = item && typeof item.id === 'string' && LEVELS.includes(item.level) && typeof item.q === 'string' &&
      Array.isArray(item.options) && item.options.length >= 2 && item.options.length <= MAX_OPTIONS &&
      Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.options.length;
    if (!ok) {
      throw new Error(`ไฟล์ ${file} ข้อที่ ${i + 1}: ต้องมี id, level (1–3), q, options 2–${MAX_OPTIONS} ตัวเลือก และ answer เป็นเลขลำดับตัวเลือกที่ถูก (เริ่มนับจาก 0)`);
    }
  });
}

function validateSets(data, map, file) {
  if (!Array.isArray(data) || !data.length) throw new Error(`ไฟล์ ${file} ต้องมีชุดข้อสอบอย่างน้อย 1 ชุด`);
  data.forEach((set, i) => {
    if (!set || !Array.isArray(set.questions) || !set.questions.length) {
      throw new Error(`ไฟล์ ${file} ชุดที่ ${i + 1}: ไม่มีรายการข้อ (questions)`);
    }
    set.questions.forEach(({ id, order }, j) => {
      const q = map.get(id);
      if (!q) throw new Error(`ไฟล์ ${file} ชุดที่ ${i + 1} ข้อที่ ${j + 1}: ไม่พบข้อ ${id} ในคลังข้อสอบ`);
      const ok = Array.isArray(order) && order.length === q.options.length &&
        [...order].sort().every((v, k) => v === k);
      if (!ok) throw new Error(`ไฟล์ ${file} ชุดที่ ${i + 1} ข้อ ${id}: order ต้องเป็นการเรียงลำดับใหม่ของตัวเลือก`);
    });
  });
}

// ---------- Progress (saved in this browser only) ----------
// { [subject]: { sets: { [set id]: { best, last, attempts } }, history: [{ at, set, mode, score, total }] } }

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

const subjectProgress = id => loadProgress()[id] || {};
const setProgress = (id, setId) => (subjectProgress(id).sets || {})[setId] || {};

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

function renderHome() {
  setTheme(null);
  setHero(catalog.titleEn, catalog.title, catalog.subtitle, '🎯');
  setCrumbs([]);
  document.title = catalog.title;

  const grid = $('subjectGrid');
  grid.replaceChildren();
  catalog.subjects.forEach(s => {
    const card = el(s.sets ? 'a' : 'div', s.sets ? 'subject-card' : 'subject-card soon');
    if (s.sets) card.href = `#/${s.id}`;
    card.style.setProperty('--primary', s.color);
    const meta = s.sets
      ? `${s.sets} ชุด • ชุดละ ${catalog.questionsPerExam} ข้อ • ${s.minutes} นาที`
      : 'กำลังจัดทำข้อสอบ';
    card.append(el('span', 'subject-icon', s.icon), el('strong', null, s.name), el('span', 'subject-meta', meta));
    const done = Object.values(subjectProgress(s.id).sets || {}).filter(p => p.best).length;
    if (done) card.append(el('span', 'subject-best', `ทำแล้ว ${done} จาก ${s.sets} ชุด`));
    grid.append(card);
  });
  show('homeScreen');
}

function showSubjectHeader(s, set, modeId) {
  setTheme(s.color);
  if (!set) {
    setHero(`${s.nameEn} • ${catalog.titleEn}`, s.name, 'เลือกชุดข้อสอบและโหมดที่ต้องการ', s.icon);
    setCrumbs([['ทุกวิชา', '#/'], [s.name]]);
    document.title = `${s.name} | ${catalog.title}`;
    return;
  }
  const label = `${setName(set)} • ${MODE_NAMES[modeId]}`;
  setHero(`${s.nameEn} • ${catalog.titleEn}`, `${s.name} ${setName(set)}`, MODE_NAMES[modeId], s.icon);
  setCrumbs([['ทุกวิชา', '#/'], [s.name, `#/${s.id}`], [label]]);
  document.title = `${s.name} ${label} | ${catalog.title}`;
}

function renderSubject() {
  const size = sets[0].questions.length;
  const levels = LEVELS.map(level => sets[0].questions.filter(({ id }) => byId.get(id).level === level).length);
  $('setsInfo').textContent = `มีข้อสอบ ${sets.length} ชุด ชุดละ ${size} ข้อ เรียงจากง่ายไปยาก: ` +
    LEVELS.map(level => `${levelName(level)} ${levels[level - 1]} ข้อ`).join(' • ');
  $('examInfo').textContent = `จับเวลา ${subject.minutes} นาที ทำครบแล้วส่งคำตอบทีเดียว`;

  const grid = $('setGrid');
  grid.replaceChildren();
  sets.forEach(set => {
    const saved = setProgress(subject.id, set.id);
    const card = el('div', 'set-card');
    const head = el('div', 'set-head');
    head.append(el('strong', null, setName(set)));
    head.append(saved.best
      ? el('span', 'set-best', `สูงสุด ${saved.best.score}/${saved.best.total}`)
      : el('span', 'set-new', 'ยังไม่ได้ทำ'));
    card.append(head);
    if (saved.last) {
      card.append(el('p', 'set-last', `ล่าสุด ${saved.last.score}/${saved.last.total} (${MODE_NAMES[saved.last.mode]}) • ทำแล้ว ${saved.attempts} ครั้ง`));
    }
    const actions = el('div', 'set-actions');
    const practice = el('a', 'button secondary', '📝 ฝึกทำ');
    practice.href = `#/${subject.id}/${set.id}/practice`;
    const exam = el('a', 'button primary', '⏱️ จำลองสอบ');
    exam.href = `#/${subject.id}/${set.id}/exam`;
    actions.append(practice, exam);
    card.append(actions);
    grid.append(card);
  });

  const table = $('blueprintTable');
  table.replaceChildren();
  const headRow = el('tr');
  ['เรื่อง', 'ข้อต่อชุด'].forEach(h => headRow.append(el('th', null, h)));
  const thead = el('thead');
  thead.append(headRow);
  const tbody = el('tbody');
  subject.topics.forEach(t => {
    const tr = el('tr');
    const name = el('td');
    name.append(el('span', 'bp-icon', t.icon), el('strong', null, t.title));
    if (t.scope) name.append(el('small', null, t.scope));
    tr.append(name, el('td', 'num total', sum(t.draw)));
    tbody.append(tr);
  });
  const foot = el('tr', 'foot');
  foot.append(el('td', null, 'รวม'), el('td', 'num total', size));
  tbody.append(foot);
  table.append(thead, tbody);

  renderHistory();
  show('subjectScreen');
}

function renderHistory() {
  const history = subjectProgress(subject.id).history || [];
  $('historyCard').classList.toggle('hidden', !history.length);
  const list = $('historyList');
  list.replaceChildren();
  history.slice().reverse().forEach(h => {
    const row = el('div', 'history-row');
    const when = new Date(h.at).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    row.append(el('span', 'history-when', when), el('span', 'history-set', `ชุดที่ ${h.set}`),
      el('span', 'history-mode', MODE_NAMES[h.mode]),
      el('strong', null, `${h.score}/${h.total} (${Math.round(h.score / h.total * 100)}%)`));
    list.append(row);
  });
}

// ---------- Quiz ----------

// The set fixes which questions appear, their order, and the order of each question's options.
function setQuestions(set) {
  return set.questions.map(({ id, order }) => {
    const q = byId.get(id);
    return { ...q, options: order.map(i => q.options[i]), answer: order.indexOf(q.answer) };
  });
}

function startQuiz(m) {
  stopTimer();
  mode = m;
  questions = setQuestions(examSet);
  answers = Array(questions.length).fill(null);
  checked = Array(questions.length).fill(false);
  flagged = Array(questions.length).fill(false);
  score = 0;
  reviewing = false;
  submitted = false;
  timeUp = false;
  steps = questions.map((_, i) => i);
  current = 0;
  startedAt = Date.now();
  if (mode === 'exam') startTimer(subject.minutes);
  show('quizScreen');
  renderQuestion();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderQuestion() {
  const item = questions[current];
  const pos = steps.indexOf(current);
  const taking = mode === 'exam' && !submitted;
  const letters = [...(subject.letters || 'กขคง')];

  $('questionNumber').textContent = `ข้อ ${current + 1}`;
  $('questionTags').replaceChildren(...(taking ? [] : [
    el('span', `tag level-${item.level}`, levelName(item.level)),
    el('span', 'tag', `${item.topic.icon} ${item.topic.title}`),
  ]));
  $('questionText').replaceChildren(rich(item.q));
  const img = $('questionImage');
  img.classList.toggle('hidden', !item.image);
  if (item.image) {
    img.src = `data/${item.image}`;
    img.alt = item.imageAlt || 'รูปประกอบโจทย์';
  } else {
    img.removeAttribute('src');
  }

  $('progressText').textContent = reviewing
    ? `ทบทวน ${pos + 1} / ${steps.length}`
    : `ข้อ ${pos + 1} / ${steps.length}`;
  $('scoreText').textContent = taking
    ? `ตอบแล้ว ${answers.filter(a => a !== null).length} / ${questions.length}`
    : `คะแนน ${score}`;
  $('progressBar').style.width = `${((pos + 1) / steps.length) * 100}%`;

  const container = $('options');
  container.replaceChildren();
  item.options.forEach((opt, i) => {
    const b = el('button', 'option');
    b.type = 'button';
    b.append(el('span', 'letter', letters[i]), richEl('span', null, opt));
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
    const given = answers[current];
    const right = given === item.answer;
    fb.className = 'feedback ' + (right ? 'correct' : 'wrong');
    fb.replaceChildren(
      right ? '✅ ' : given === null ? '⚪ ' : '❌ ',
      el('b', null, right ? 'ตอบถูก!' : given === null ? 'ไม่ได้ตอบ' : 'ตอบไม่ถูก'),
      ' ',
      rich(item.explanation || `คำตอบที่ถูกต้องคือ “${item.options[item.answer]}”`)
    );
  } else {
    fb.className = 'feedback hidden';
    fb.replaceChildren();
  }

  const last = pos === steps.length - 1;
  const needsCheck = mode === 'practice' && !checked[current];
  $('prevBtn').disabled = pos === 0;
  $('flagBtn').classList.toggle('hidden', !taking);
  $('flagBtn').textContent = flagged[current] ? '🚩 ยกเลิกเครื่องหมาย' : '🚩 ทำเครื่องหมาย';
  $('checkBtn').classList.toggle('hidden', !needsCheck);
  $('checkBtn').disabled = answers[current] === null;
  $('nextBtn').classList.toggle('hidden', needsCheck);
  $('nextBtn').textContent = !last ? 'ข้อถัดไป →' : reviewing ? 'กลับไปหน้าผล →' : taking ? 'ส่งคำตอบ →' : 'ดูผลคะแนน →';

  $('timer').classList.toggle('hidden', !taking);
  $('submitBtn').classList.toggle('hidden', !taking);
  $('restartBtn').classList.toggle('hidden', reviewing);
  $('resultBtn').classList.toggle('hidden', !reviewing);
  renderNav();
}

// Question number grid: shown while taking an exam and when reviewing every question.
function renderNav() {
  const visible = (mode === 'exam' || reviewing) && steps.length === questions.length;
  $('navCard').classList.toggle('hidden', !visible);
  if (!visible) return;
  const taking = mode === 'exam' && !submitted;
  $('navLegend').textContent = taking
    ? 'กดเลขข้อเพื่อไปยังข้อนั้น • สีเข้ม = ตอบแล้ว • 🚩 = ทำเครื่องหมายไว้'
    : 'กดเลขข้อเพื่อดูเฉลย • เขียว = ถูก • แดง = ผิดหรือไม่ได้ตอบ';
  const grid = $('navGrid');
  grid.replaceChildren();
  questions.forEach((q, i) => {
    const b = el('button', 'nav-item', String(i + 1));
    b.type = 'button';
    if (checked[i]) b.classList.add(answers[i] === q.answer ? 'correct' : 'wrong');
    else if (answers[i] !== null) b.classList.add('answered');
    if (flagged[i] && taking) b.classList.add('flagged');
    if (i === current) b.classList.add('current');
    b.onclick = () => goTo(i);
    grid.append(b);
  });
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

function toggleFlag() {
  flagged[current] = !flagged[current];
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
  else if (mode === 'exam') confirmSubmit();
  else finishRound();
}

function prevQuestion() {
  const pos = steps.indexOf(current);
  if (pos > 0) goTo(steps[pos - 1]);
}

function confirmRestart() {
  const message = mode === 'exam'
    ? `ต้องการเริ่มทำ${setName(examSet)}ใหม่หรือไม่? ระบบจะเริ่มจับเวลาใหม่ และคำตอบรอบนี้จะถูกล้าง`
    : `ต้องการเริ่มทำ${setName(examSet)}ใหม่หรือไม่? คะแนนรอบนี้จะถูกล้าง`;
  if (confirm(message)) startQuiz(mode);
}

// ---------- Exam timer & submit ----------

function startTimer(minutes) {
  deadline = Date.now() + minutes * 60000;
  tick();
  timer = setInterval(tick, 1000);
}

function stopTimer() {
  clearInterval(timer);
  timer = null;
}

function tick() {
  const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  $('timer').textContent = `⏱ ${formatTime(left)}`;
  $('timer').classList.toggle('low', left <= 300);
  if (!left) {
    timeUp = true;
    submitExam();
  }
}

function confirmSubmit() {
  const blank = answers.filter(a => a === null).length;
  const flags = flagged.filter(Boolean).length;
  const notes = [];
  if (blank) notes.push(`ยังไม่ได้ตอบ ${blank} ข้อ`);
  if (flags) notes.push(`ทำเครื่องหมายไว้ ${flags} ข้อ`);
  const head = notes.length ? `${notes.join(' และ ')}\n` : '';
  if (confirm(`${head}ต้องการส่งคำตอบหรือไม่? ส่งแล้วจะแก้ไขไม่ได้`)) submitExam();
}

function submitExam() {
  stopTimer();
  submitted = true;
  checked = questions.map(() => true);
  score = questions.filter((q, i) => answers[i] === q.answer).length;
  finishRound();
}

// ---------- Results ----------

function finishRound() {
  usedSeconds = Math.round((Date.now() - startedAt) / 1000);
  const progress = subjectProgress(subject.id);
  const saved = (progress.sets || {})[examSet.id] || {};
  const total = questions.length;
  newBest = !saved.best || score / total > saved.best.score / saved.best.total;
  const result = { score, total, mode };
  saveProgress(subject.id, {
    sets: {
      ...progress.sets,
      [examSet.id]: {
        best: newBest ? { score, total } : saved.best,
        last: result,
        attempts: (saved.attempts || 0) + 1,
      },
    },
    history: [...(progress.history || []), { at: new Date().toISOString(), set: examSet.id, ...result }].slice(-HISTORY_SIZE),
  });
  showResult();
}

function showResult() {
  const total = questions.length;
  const blank = answers.filter(a => a === null).length;
  const pct = Math.round(score / total * 100);
  $('resultIcon').textContent = timeUp ? '⏰' : '🎉';
  $('resultHeading').textContent = timeUp ? 'หมดเวลา! ระบบส่งคำตอบให้แล้ว' : mode === 'exam' ? 'ส่งคำตอบแล้ว!' : `ทำ${setName(examSet)}ครบแล้ว!`;
  $('finalScore').textContent = score;
  $('finalTotal').textContent = `/ ${total}`;
  $('correctCount').textContent = score;
  $('wrongCount').textContent = total - score;
  $('percent').textContent = pct + '%';
  let title = 'ลองทบทวนเรื่องที่ได้คะแนนน้อยแล้วทำอีกครั้งนะ';
  if (pct >= 80) title = 'ยอดเยี่ยมมาก! 🌟';
  else if (pct >= 60) title = 'ทำได้ดีมาก! 👍';
  else if (pct >= 50) title = 'ผ่านเกณฑ์พื้นฐาน 📚';
  $('resultTitle').textContent = title;
  const notes = [`${setName(examSet)} คุณทำได้ ${score} จาก ${total} ข้อ`];
  if (blank) notes.push(`ไม่ได้ตอบ ${blank} ข้อ`);
  if (mode === 'exam') notes.push(`ใช้เวลา ${Math.floor(usedSeconds / 60)} นาที ${usedSeconds % 60} วินาที`);
  if (newBest) notes.push('🏆 สถิติใหม่ของชุดนี้!');
  $('resultMessage').textContent = notes.join(' • ');
  $('reviewBtn').classList.toggle('hidden', score === total);
  $('subjectLink').href = `#/${subject.id}`;
  const next = sets[sets.indexOf(examSet) + 1];
  $('nextSetLink').classList.toggle('hidden', !next);
  if (next) {
    $('nextSetLink').href = `#/${subject.id}/${next.id}/${mode}`;
    $('nextSetLink').textContent = `${setName(next)} →`;
  }

  renderBars($('levelBreakdown'), LEVELS.map(level => [levelName(level), q => q.level === level]));
  renderBars($('topicBreakdown'), subject.topics.map(t => [`${t.icon} ${t.title}`, q => q.topic === t]));

  show('resultScreen');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// rows: [[label, belongs(question)], ...] — rows with no question in this round are skipped
function renderBars(container, rows) {
  container.replaceChildren();
  rows.forEach(([label, belongs]) => {
    const idx = questions.map((_, i) => i).filter(i => belongs(questions[i]));
    if (!idx.length) return;
    const right = idx.filter(i => answers[i] === questions[i].answer).length;
    const pct = right / idx.length * 100;
    const row = el('div', pct < 50 ? 'bar-row weak' : 'bar-row');
    const name = el('span', 'bar-label', label);
    if (pct < 50) name.append(el('span', 'weak-tag', 'ควรทบทวน'));
    const track = el('div', 'bar-track');
    const fill = el('div', 'bar-fill');
    fill.style.width = `${pct}%`;
    track.append(fill);
    row.append(name, track, el('span', 'bar-value', `${right}/${idx.length}`));
    container.append(row);
  });
}

// Walk through wrong (or all) answers with explanations, keeping the set's question numbers.
function review(onlyWrong) {
  steps = questions.map((_, i) => i).filter(i => !onlyWrong || answers[i] !== questions[i].answer);
  if (!steps.length) return;
  reviewing = true;
  checked = questions.map(() => true);
  current = steps[0];
  show('quizScreen');
  renderQuestion();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

init();
