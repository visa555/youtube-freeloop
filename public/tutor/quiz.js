// Routes: #/ → เลือกวิชา, #/<subject> → เลือกเรื่อง, #/<subject>/<topic> → ทำข้อสอบ
// ข้อสอบแต่ละเรื่องอยู่ที่ data/<subject>/<topic>.json (ดู README.md)

const LETTERS = ['ก', 'ข', 'ค', 'ง'];
const SCREENS = ['loadingScreen', 'errorScreen', 'homeScreen', 'subjectScreen', 'startScreen', 'quizScreen', 'resultScreen'];

let catalog = null;            // data/subjects.json
const topicCache = new Map();  // "science/rocks" → questions from the file
let bank = [];                 // questions of the open topic, in file order
let currentHash = '';
let routeToken = 0;

// State of the current attempt
let questions = [];            // bank with options shuffled for this attempt
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

// ---------- Loading & routing ----------

async function init() {
  window.addEventListener('hashchange', onHashChange);
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
  if (quizInProgress() && !confirm('ต้องการออกจากแบบทดสอบหรือไม่? คำตอบที่ทำไว้จะหายไป')) {
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
  window.scrollTo({ top: 0 });

  const [subjectId, topicId] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!subjectId) return renderHome();

  const subject = catalog.subjects.find(s => s.id === subjectId);
  if (!subject) return location.replace('#/');
  if (!topicId) return renderSubject(subject);

  const topic = subject.topics.find(t => t.id === topicId);
  if (!topic || !topic.ready) return location.replace(`#/${subject.id}`);

  showTopicHeader(subject, topic);
  show('loadingScreen');
  try {
    const qs = await loadTopic(subject, topic);
    if (token !== routeToken) return;  // user navigated away while loading
    bank = qs;
    const choices = Math.max(...qs.map(q => q.options.length));
    $('startInfo').textContent = `ข้อสอบทั้งหมด ${qs.length} ข้อ แบบเลือกตอบ ${choices} ตัวเลือก`;
    $('otherTopicLink').href = `#/${subject.id}`;
    show('startScreen');
  } catch (err) {
    if (token === routeToken) showError(err.message);
  }
}

async function loadTopic(subject, topic) {
  const file = `data/${subject.id}/${topic.id}.json`;
  if (!topicCache.has(file)) {
    const data = await fetchJSON(file);
    validateQuestions(data, file);
    topicCache.set(file, data);
  }
  return topicCache.get(file);
}

function validateQuestions(data, file) {
  if (!Array.isArray(data) || !data.length) {
    throw new Error(`ไฟล์ ${file} ต้องเป็นรายการข้อสอบ [ ... ] อย่างน้อย 1 ข้อ`);
  }
  data.forEach((item, i) => {
    const ok = item && typeof item.q === 'string' &&
      Array.isArray(item.options) && item.options.length >= 2 && item.options.length <= LETTERS.length &&
      Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.options.length;
    if (!ok) {
      throw new Error(`ไฟล์ ${file} ข้อที่ ${i + 1}: ต้องมี q, options 2–${LETTERS.length} ตัวเลือก และ answer เป็นเลขลำดับตัวเลือกที่ถูก (เริ่มนับจาก 0)`);
    }
  });
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

function renderHome() {
  setTheme(null);
  setHero(`TUTOR • ${catalog.gradeEn}`, `แบบทดสอบ ${catalog.grade}`, 'เลือกวิชาที่ต้องการฝึกทำข้อสอบ', '📚');
  setCrumbs([]);
  document.title = `แบบทดสอบ ${catalog.grade}`;

  const grid = $('subjectGrid');
  grid.replaceChildren();
  catalog.subjects.forEach(subject => {
    const ready = subject.topics.filter(t => t.ready).length;
    const card = el('a', 'subject-card');
    card.href = `#/${subject.id}`;
    card.style.setProperty('--primary', subject.color);
    card.append(
      el('span', 'subject-icon', subject.icon),
      el('strong', null, subject.name),
      el('span', 'subject-meta', ready
        ? `พร้อมทำ ${ready} จาก ${subject.topics.length} เรื่อง`
        : `${subject.topics.length} เรื่อง • เร็ว ๆ นี้`)
    );
    grid.append(card);
  });
  show('homeScreen');
}

function renderSubject(subject) {
  setTheme(subject.color);
  setHero(`${subject.nameEn} • ${catalog.gradeEn}`, `${subject.name} ${catalog.grade}`, 'เลือกเรื่องที่ต้องการทำแบบทดสอบ', subject.icon);
  setCrumbs([['ทุกวิชา', '#/'], [subject.name]]);
  document.title = `${subject.name} ${catalog.grade} | แบบทดสอบ`;

  const list = $('topicList');
  list.replaceChildren();
  subject.topics.forEach(topic => {
    const row = el(topic.ready ? 'a' : 'div', topic.ready ? 'topic' : 'topic soon');
    if (topic.ready) row.href = `#/${subject.id}/${topic.id}`;
    row.append(
      el('span', 'topic-icon', topic.icon),
      el('span', 'topic-title', topic.title),
      el('span', 'topic-status', topic.ready ? 'เริ่มทำ →' : 'เร็ว ๆ นี้')
    );
    list.append(row);
  });
  show('subjectScreen');
}

function showTopicHeader(subject, topic) {
  setTheme(subject.color);
  setHero(`${subject.nameEn} • ${catalog.gradeEn}`, `แบบทดสอบ${subject.name} ${catalog.grade}`, `เรื่อง ${topic.title}`, topic.icon);
  setCrumbs([['ทุกวิชา', '#/'], [subject.name, `#/${subject.id}`], [topic.title]]);
  document.title = `แบบทดสอบ${subject.name} ${catalog.grade} | ${topic.title}`;
}

// ---------- Quiz ----------

function startQuiz() {
  questions = bank.map(shuffleOptions);
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
// (e.g. ones with a "ถูกทุกข้อ" option that must stay last).
function shuffleOptions(item) {
  const order = item.options.map((_, i) => i);
  if (!item.keepOrder) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }
  return { ...item, options: order.map(i => item.options[i]), answer: order.indexOf(item.answer) };
}

function renderQuestion() {
  const item = questions[current];
  const pos = steps.indexOf(current);
  $('questionNumber').textContent = `ข้อ ${item.id ?? current + 1}`;
  $('questionText').textContent = item.q;
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
    b.append(el('span', 'letter', LETTERS[i]), el('span', null, opt));
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
      ' ' + (item.explanation || `คำตอบที่ถูกต้องคือ “${item.options[item.answer]}”`)
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
  else showResult();
}

function prevQuestion() {
  const pos = steps.indexOf(current);
  if (pos > 0) goTo(steps[pos - 1]);
}

function showResult() {
  const total = questions.length;
  const pct = Math.round(score / total * 100);
  $('finalScore').textContent = score;
  $('finalTotal').textContent = `/ ${total}`;
  $('correctCount').textContent = score;
  $('wrongCount').textContent = total - score;
  $('percent').textContent = pct + '%';
  let title = 'ลองทบทวนอีกครั้ง';
  if (pct >= 80) title = 'ยอดเยี่ยมมาก! 🌟';
  else if (pct >= 60) title = 'ทำได้ดีมาก! 👍';
  else if (pct >= 50) title = 'ผ่านเกณฑ์พื้นฐาน 📚';
  $('resultTitle').textContent = title;
  $('resultMessage').textContent = `คุณทำได้ ${score} จาก ${total} ข้อ`;
  $('reviewBtn').classList.toggle('hidden', score === total);
  show('resultScreen');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Walk through wrong answers only, keeping the original question numbers.
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
  if (confirm('ต้องการเริ่มข้อสอบใหม่หรือไม่? คะแนนและคำตอบเดิมจะถูกล้างทั้งหมด')) startQuiz();
}

init();
