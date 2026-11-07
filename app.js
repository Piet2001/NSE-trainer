const $ = (id) => document.getElementById(id);
const views = ['select-view', 'quiz-view', 'result-view'];

let exams = [];
let questions = [];
let index = 0;
let mistakes = 0;
let answered = false;

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

function updateDescription() {
  $('exam-description').textContent = currentExam()?.description ?? '';
}

async function startExam() {
  $('error').hidden = true;
  try {
    const data = await loadJson(currentExam().file);
    questions = $('shuffle').checked ? shuffle(data.questions) : data.questions;
  } catch (e) {
    showError(e.message);
    return;
  }
  if (!questions.length) {
    showError('Dit examen bevat nog geen vragen.');
    return;
  }
  index = 0;
  mistakes = 0;
  show('quiz-view');
  renderQuestion();
}

function renderQuestion() {
  const q = questions[index];
  answered = false;
  $('counter').textContent = `Vraag ${index + 1} van ${questions.length}`;
  $('progress-bar').style.width = `${(index / questions.length) * 100}%`;
  $('question').textContent = q.question;
  $('feedback').textContent = '';
  $('feedback').className = '';
  $('next').hidden = true;

  const container = $('options');
  container.innerHTML = '';
  q.options.forEach((option, i) => {
    const button = document.createElement('button');
    button.textContent = option;
    button.addEventListener('click', () => choose(i, button));
    container.appendChild(button);
  });
}

function choose(i, button) {
  if (answered) return;
  const q = questions[index];
  const feedback = $('feedback');

  if (i === q.answer) {
    answered = true;
    button.classList.add('correct');
    document.querySelectorAll('#options button').forEach((b) => { b.disabled = true; });
    feedback.className = 'ok';
    feedback.textContent = '✔ Goed!' + (q.explanation ? ` ${q.explanation}` : '');
    $('next').textContent = index === questions.length - 1 ? 'Afronden' : 'Volgende';
    $('next').hidden = false;
    $('next').focus();
  } else {
    mistakes++;
    button.classList.add('wrong');
    button.disabled = true;
    feedback.className = 'no';
    feedback.textContent = '✘ Fout, probeer het opnieuw.';
  }
}

function next() {
  index++;
  if (index >= questions.length) {
    $('progress-bar').style.width = '100%';
    $('result-text').textContent =
      `Je hebt ${questions.length} vragen beantwoord met ${mistakes} foute poging(en).`;
    show('result-view');
  } else {
    renderQuestion();
  }
}

$('exam-select').addEventListener('change', updateDescription);
$('start').addEventListener('click', startExam);
$('next').addEventListener('click', next);
$('restart').addEventListener('click', startExam);
$('back').addEventListener('click', () => show('select-view'));

init();
