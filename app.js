const $ = (id) => document.getElementById(id);
const views = ['select-view', 'quiz-view', 'result-view'];

let exams = [];
let questions = [];
let index = 0;
let mistakes = 0;
let answered = false;
let total = 0;
let mastered = 0;
let failed = new Set();

function show(view) {
  views.forEach((v) => { $(v).hidden = v !== view; });
}

function showError(message) {
  $('error').textContent = message;
  $('error').hidden = false;
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Kan ${path} niet laden (${response.status})`);
  return response.json();
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function init() {
  try {
    exams = await loadJson('data/exams.json');
  } catch (e) {
    showError(`${e.message}. Draai de app via een webserver (bijv. GitHub Pages), niet via file://.`);
    return;
  }
  $('exam-select').innerHTML = exams
    .map((exam, i) => `<option value="${i}">${escapeHtml(exam.title)}</option>`)
    .join('');
  updateDescription();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function currentExam() {
  return exams[Number($('exam-select').value)];
}

const questionCache = new Map();

async function loadExamQuestions(exam) {
  if (!questionCache.has(exam)) {
    const files = [].concat(exam.files ?? exam.file);
    const parts = await Promise.all(files.map(loadJson));
    questionCache.set(exam, parts.flatMap((p) => p.questions));
  }
  return questionCache.get(exam);
}

async function updateDescription() {
  const exam = currentExam();
  $('exam-description').textContent = exam?.description ?? '';
  if (!exam) return;
  $('error').hidden = true;
  try {
    const count = (await loadExamQuestions(exam)).length;
    if (exam !== currentExam()) return;
    $('count').max = count;
    $('count').value = count;
    $('count-max').textContent = `van ${count}`;
    $('start').disabled = count === 0;
  } catch (e) {
    showError(e.message);
  }
}

async function startExam() {
  $('error').hidden = true;
  try {
    const all = await loadExamQuestions(currentExam());
    const wanted = Math.round(Number($('count').value)) || all.length;
    const n = Math.min(Math.max(wanted, 1), all.length);
    $('count').value = n;
    questions = $('shuffle').checked ? shuffle(all) : [...all];
    questions = questions.slice(0, n);
  } catch (e) {
    showError(e.message);
    return;
  }
  if (!questions.length) {
    showError('Dit examen bevat nog geen vragen.');
    return;
  }
  total = questions.length;
  mastered = 0;
  failed = new Set();
  index = 0;
  mistakes = 0;
  show('quiz-view');
  renderQuestion();
}

function renderQuestion() {
  const q = questions[index];
  answered = false;
  $('counter').textContent = `Goed beantwoord: ${mastered} van ${total} · nog ${questions.length - index} in de wachtrij`;
  $('progress-bar').style.width = `${(mastered / total) * 100}%`;
  $('question').textContent = q.question;
  $('feedback').textContent = '';
  $('feedback').className = '';
  $('next').hidden = true;
  $('check').hidden = true;

  const images = $('images');
  images.innerHTML = '';
  (q.images ?? []).forEach((src) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Exhibit';
    images.appendChild(img);
  });

  const multi = isMulti(q);
  if (multi) {
    if (!/kies|choose/i.test(q.question)) $('question').textContent += ` (Kies ${q.answer.length}.)`;
    $('check').hidden = false;
    $('check').disabled = true;
  }

  const container = $('options');
  container.innerHTML = '';
  q.options.forEach((option, i) => {
    const button = document.createElement('button');
    button.textContent = option;
    button.addEventListener('click', () => (multi ? toggle(button) : choose(i, button)));
    button.dataset.index = i;
    container.appendChild(button);
  });
}

function isMulti(q) {
  return Array.isArray(q.answer);
}

function toggle(button) {
  if (answered) return;
  button.classList.toggle('selected');
  $('check').disabled = !document.querySelector('#options button.selected');
}

function finishCorrect(q) {
  answered = true;
  document.querySelectorAll('#options button').forEach((b) => { b.disabled = true; });
  $('check').hidden = true;
  $('feedback').className = 'ok';
  $('feedback').textContent = '✔ Goed!' + (q.explanation ? ` ${q.explanation}` : '');
  mastered++;
  showNext();
}

function showNext() {
  $('next').textContent = index === questions.length - 1 ? 'Afronden' : 'Volgende';
  $('next').hidden = false;
  $('next').focus();
}

function failQuestion(q) {
  mistakes++;
  answered = true;
  failed.add(q);
  questions.push(q);
  const correct = [].concat(q.answer);
  document.querySelectorAll('#options button').forEach((b) => {
    b.disabled = true;
    b.classList.remove('selected');
    if (correct.includes(Number(b.dataset.index))) b.classList.add('correct');
  });
  $('check').hidden = true;
  $('feedback').className = 'no';
  $('feedback').textContent = '✘ Fout. Het juiste antwoord staat groen; de vraag komt later terug.' + (q.explanation ? ` ${q.explanation}` : '');
  showNext();
}

function checkMulti() {
  if (answered) return;
  const q = questions[index];
  const buttons = [...document.querySelectorAll('#options button')];
  const selected = buttons.filter((b) => b.classList.contains('selected')).map((b) => Number(b.dataset.index));
  const correct = selected.length === q.answer.length && selected.every((i) => q.answer.includes(i));

  if (correct) {
    buttons.forEach((b) => {
      b.classList.remove('selected');
      if (selected.includes(Number(b.dataset.index))) b.classList.add('correct');
    });
    finishCorrect(q);
  } else {
    failQuestion(q);
  }
}

function choose(i, button) {
  if (answered) return;
  const q = questions[index];
  const feedback = $('feedback');

  if (i === q.answer) {
    button.classList.add('correct');
    finishCorrect(q);
  } else {
    button.classList.add('wrong');
    failQuestion(q);
  }
}

function next() {
  index++;
  if (index >= questions.length) {
    $('progress-bar').style.width = '100%';
    $('result-text').textContent =
      `Alles goed! ${total} vragen, waarvan ${failed.size} minstens één keer fout (${mistakes} foute poging(en)).`;
    show('result-view');
  } else {
    renderQuestion();
  }
}

$('exam-select').addEventListener('change', updateDescription);
$('start').addEventListener('click', startExam);
$('next').addEventListener('click', next);
$('check').addEventListener('click', checkMulti);
$('restart').addEventListener('click', startExam);
$('back').addEventListener('click', () => show('select-view'));

init();
