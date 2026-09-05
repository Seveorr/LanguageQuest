let correctCount = 0;
let currentSection = 1;
let questionInSectionIdx = 1;
const maxQuestionsPerSection = 10;
const totalQuestions = maxQuestionsPerSection * 3;

function shuffle(a) { return [...a].sort(() => Math.random() - 0.5); }

function uniqueBy(arr, key) {
    const seen = new Set();
    const res = [];
    for (const it of arr) {
        if (!seen.has(it[key])) {
            seen.add(it[key]);
            res.push(it);
        }
    }
    return res;
}

function updateHeader() {
    const badge = document.getElementById("sectionBadge");
    const title = document.getElementById("headerTitle");

    badge.textContent = `Secció ${currentSection} / 3`;

    if (currentSection === 1) {
        title.textContent = "Relacionar emojis i paraules";
    } else if (currentSection === 2) {
        title.textContent = "Com se sent en cada situació?";
    } else {
        title.textContent = "Com reacciones?";
    }
}

const modal = document.getElementById("exitModal");
const phaseHeader = document.getElementById("phaseHeader");
const question = document.getElementById("question");
const targetZone = document.getElementById("targetZone");
const options = document.getElementById("options");
const msg = document.getElementById("msg");
const actionBtn = document.getElementById("actionBtn");

function showExitModal() { modal.classList.add("active"); }
function hideExitModal() { modal.classList.remove("active"); }
function redirectToMenu() { window.location.href = "../menu/index.html"; }

function updateProgressCircle(isCorrect) {
    const circle = document.getElementById(`c${questionInSectionIdx}`);
    if (circle) {
        if (isCorrect) {
            circle.className = "circle correct";
            circle.textContent = "✓";
        } else {
            circle.className = "circle incorrect";
            circle.textContent = "X";
        }
    }
}

function resetProgressBar() {
    for (let i = 1; i <= maxQuestionsPerSection; i++) {
        const circle = document.getElementById(`c${i}`);
        if (circle) {
            circle.className = "circle";
            circle.textContent = i;
        }
    }
}

function buildEndingHtml(op) {
    const emoji = op.correct ? "🎉" : "😅";
    const label = op.correct ? "Molt bé!" : "Desenllaç";

    return `
        <div class="end-box">
            <div class="emoji">${emoji}</div>
            <div class="character-name">${label}</div>
            <p class="dialogue-text">${op.desenllac}</p>
        </div>`;
}

function selectOption(btn, isCorrect, endingHtml) {

    document.querySelectorAll('.option-btn').forEach(b => {
        b.classList.add('disabled');
        b.onclick = null;
    });

    if (isCorrect) {
        btn.classList.add('correct');
    } else {
        btn.classList.add('wrong');

        const correctBtn = document.querySelector('.option-btn[data-correct="true"]');
        if (correctBtn) correctBtn.classList.add('correct');
    }

    resolveRound(isCorrect, endingHtml);
}

function resolveRound(ok, endingHtml) {

    updateProgressCircle(ok);
    questionInSectionIdx++;

    if (ok) {

        correctCount++;

        targetZone.classList.add('correct-bg');
        updateHeader();

        if (endingHtml) {
            setTimeout(() => { targetZone.innerHTML = endingHtml; }, 500);
            setTimeout(() => { targetZone.classList.remove('correct-bg'); next(); }, 2400);
        } else {
            setTimeout(() => { targetZone.classList.remove('correct-bg'); next(); }, 1400);
        }

    } else {

        targetZone.classList.add('wrong-bg');
        updateHeader();

        if (endingHtml) {
            setTimeout(() => { targetZone.innerHTML = endingHtml; }, 500);
            setTimeout(() => { targetZone.classList.remove('wrong-bg'); next(); }, 2800);
        } else {
            setTimeout(() => { targetZone.classList.remove('wrong-bg'); next(); }, 1800);
        }
    }
}

function next() {

    if (questionInSectionIdx > maxQuestionsPerSection) {

        questionInSectionIdx = 1;
        currentSection++;

        resetProgressBar();

        if (currentSection > 3) {

            document.querySelector('.sidebar').style.display = "none";
            document.querySelector('.main-container').style.justifyContent = "center";

            document.getElementById("topInfo").style.display = "none";
            gameArea.style.display = "none";
            msg.style.display = "none";
            document.getElementById("exitContainer").style.display = "none";

            showFinalScreen(
                "🎉 Enhorabona! Has completat totes les seccions.",
                correctCount,
                totalQuestions
            );

            return;
        }
    }

    msg.textContent = "";
    options.innerHTML = "";
    targetZone.innerHTML = "";
    targetZone.classList.remove('correct-bg', 'wrong-bg');
    actionBtn.style.display = "none";

    updateHeader();

    question.style.animation = "none";
    void question.offsetWidth;
    question.style.animation = "pop 0.4s ease";

    if (currentSection === 1) {

        const correct = emocions[Math.floor(Math.random() * emocions.length)];
        const isEmojiToWord = Math.random() < 0.5;

        if (isEmojiToWord) {

            question.textContent = "Quina paraula descriu aquesta emoció?";

            targetZone.innerHTML = `<div class="face">${correct.e}</div>`;

            const pool = uniqueBy(emocions.filter(x => x.w !== correct.w), 'w');
            const distractors = shuffle(pool).slice(0, 4);
            const finalOpts = shuffle([correct, ...distractors]);

            finalOpts.forEach(o => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.textContent = o.w;
                btn.dataset.correct = (o.w === correct.w) ? "true" : "false";
                btn.onclick = () => selectOption(btn, o.w === correct.w);
                options.appendChild(btn);
            });

        } else {

            question.textContent = "Quin emoji representa aquesta paraula?";

            targetZone.innerHTML = `<div class="target-label">${correct.w.toUpperCase()}</div>`;

            const pool = uniqueBy(emocions.filter(x => x.e !== correct.e), 'e');
            const distractors = shuffle(pool).slice(0, 4);
            const finalOpts = shuffle([correct, ...distractors]);

            finalOpts.forEach(o => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.textContent = o.e;
                btn.style.fontSize = '32px';
                btn.dataset.correct = (o.e === correct.e) ? "true" : "false";
                btn.onclick = () => selectOption(btn, o.e === correct.e);
                options.appendChild(btn);
            });
        }

    } else if (currentSection === 2) {

        const sit = situacionsEmocio[Math.floor(Math.random() * situacionsEmocio.length)];

        question.textContent = sit.q;

        targetZone.innerHTML = `<div class="face">🤔</div>`;

        const finalOpts = shuffle([sit.correct, ...sit.opts]);

        finalOpts.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.style.fontSize = '32px';
            btn.dataset.correct = (opt === sit.correct) ? "true" : "false";
            btn.onclick = () => selectOption(btn, opt === sit.correct);
            options.appendChild(btn);
        });

    } else if (currentSection === 3) {

        const escena = reaccions[Math.floor(Math.random() * reaccions.length)];

        question.textContent = escena.q;

        targetZone.innerHTML = `<div class="face">💭</div>`;

        const opcions = shuffle(escena.opcions);

        opcions.forEach(op => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = op.text;
            btn.onclick = () => selectOption(btn, op.correct, buildEndingHtml(op));
            options.appendChild(btn);
        });
    }
}

function showFinalScreen(message, correct, total) {

    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    let pctClass = "low";
    if (pct >= 70) pctClass = "good";
    else if (pct >= 40) pctClass = "mid";

    const finalScreen = document.getElementById("finalScreen");

    finalScreen.innerHTML = `
        <div class="final-message">${message}</div>
        <div class="final-percentage ${pctClass}">${pct}%</div>
        <div class="final-fraction">${correct}/${total} encerts</div>
        <button class="btn-action" onclick="redirectToMenu()">Tornar al menú</button>
    `;

    finalScreen.style.display = "flex";
}

updateHeader();
next();