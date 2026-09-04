let score = 0;
let correctCount = 0;
let currentSection = 1;
let questionInSectionIdx = 1;
const maxQuestionsPerSection = 10;
const totalQuestions = maxQuestionsPerSection * 3;
let correctAnswersOrder = [];

function shuffle(a) { return [...a].sort(() => Math.random() - 0.5); }

function updateHeader() {
    const badge = document.getElementById("sectionBadge");
    const title = document.getElementById("headerTitle");

    badge.textContent = `Secció ${currentSection} / 3`;

    if (currentSection === 1) {
        title.textContent = "Relacionar paraules i pictogrames";
    } else if (currentSection === 2) {
        title.textContent = "Construir frases complexes";
    } else {
        title.textContent = "Situacions i contexts diaris";
    }

    scoreEl.textContent = score;

    const scoreLabel = document.getElementById("scoreLabel");
    if (scoreLabel) {
        scoreLabel.textContent = (score === 1) ? "Punt" : "Punts";
    }
}

const modal = document.getElementById("exitModal");
const phaseHeader = document.getElementById("phaseHeader");
const question = document.getElementById("question");
const targetZone = document.getElementById("targetZone");
const duoHint = document.getElementById("duoHint");
const options = document.getElementById("options");
const msg = document.getElementById("msg");
const scoreEl = document.getElementById("score");
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

function initDragAndDrop() {
    targetZone.addEventListener('dragover', e => e.preventDefault());
    targetZone.addEventListener('drop', handleDrop);
    options.addEventListener('dragover', e => e.preventDefault());
    options.addEventListener('drop', handleDropBack);
}

function makeElementDraggable(el) {

    el.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', el.id);
        el.classList.add('dragging');
    });

    el.addEventListener('dragend', () => {
        el.classList.remove('dragging');
    });

    let offsetX = 0, offsetY = 0;

    el.addEventListener('touchstart', e => {
        if (!el.draggable) return;

        el.classList.add('dragging');

        const touch = e.touches[0];
        const rect = el.getBoundingClientRect();

        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;

        el.style.position = 'fixed';
        el.style.zIndex = '1000';
        el.style.width = rect.width + 'px';
        el.style.height = rect.height + 'px';

    }, { passive: true });

    el.addEventListener('touchmove', e => {
        if (!el.draggable) return;

        const touch = e.touches[0];

        el.style.left = (touch.clientX - offsetX) + 'px';
        el.style.top = (touch.clientY - offsetY) + 'px';

    }, { passive: true });

    el.addEventListener('touchend', e => {
        if (!el.draggable) return;

        el.classList.remove('dragging');

        el.style.position = '';
        el.style.zIndex = '';
        el.style.left = '';
        el.style.top = '';
        el.style.width = '';
        el.style.height = '';

        const touch = e.changedTouches[0];
        const targetDrop = document.elementFromPoint(touch.clientX, touch.clientY);

        if (targetDrop && (targetDrop.id === 'targetZone' || targetDrop.closest('#targetZone'))) {
            appendElementToTarget(el);
        } else {
            options.appendChild(el);

            if (currentSection === 2 &&
                targetZone.querySelectorAll('.drag-item').length === 0) {
                actionBtn.style.display = "none";
            }
        }
    });
}

function handleDrop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const draggedEl = document.getElementById(id);
    if (draggedEl) appendElementToTarget(draggedEl);
}

function handleDropBack(e) {
    e.preventDefault();

    const id = e.dataTransfer.getData('text/plain');
    const draggedEl = document.getElementById(id);

    if (draggedEl) {
        options.appendChild(draggedEl);

        if (currentSection === 2 &&
            targetZone.querySelectorAll('.drag-item').length === 0) {
            actionBtn.style.display = "none";
        }
    }
}

function appendElementToTarget(el) {

    if (currentSection === 1 || currentSection === 3) {

        if (targetZone.querySelectorAll('.drag-item').length === 0) {
            targetZone.appendChild(el);
            checkAnswerDirectly(el);
        }

    } else if (currentSection === 2) {

        targetZone.appendChild(el);

        actionBtn.style.display = "inline-block";
        actionBtn.textContent = "Comprovar frase";
        actionBtn.onclick = checkSentenceOrder;
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
    duoHint.style.display = "none";
    actionBtn.style.display = "none";

    updateHeader();

    question.style.animation = "none";
    void question.offsetWidth;
    question.style.animation = "pop 0.4s ease";

    const numOptions = (currentSection === 2) ? 10 : 5;

    if (currentSection === 1) {

        const correct = data[Math.floor(Math.random() * data.length)];
        const isWordToPic = Math.random() < 0.5;

        const distractors = shuffle(
            data.filter(x => x !== correct)
        ).slice(0, numOptions - 1);

        const finalOpts = shuffle([correct, ...distractors]);

        if (isWordToPic) {

            question.textContent =
                `Arrossega el pictograma correcte cap a la zona blanca:`;

            targetZone.innerHTML =
                `<div class="target-label">${correct.w.toUpperCase()}</div>`;

            targetZone.dataset.correct = correct.e;

            finalOpts.forEach((o, i) => {

                const div = document.createElement('div');

                div.className = 'drag-item item-pic';
                div.textContent = o.e;
                div.draggable = true;
                div.id = `drag-${i}`;

                makeElementDraggable(div);
                options.appendChild(div);
            });

        } else {

            question.textContent =
                `Arrossega la paraula correcta cap a la zona blanca:`;

            targetZone.innerHTML =
                `<div class="target-label-pic">${correct.e}</div>`;

            targetZone.dataset.correct = correct.w;

            finalOpts.forEach((o, i) => {

                const div = document.createElement('div');

                div.className = 'drag-item item-word';
                div.textContent = o.w;
                div.draggable = true;
                div.id = `drag-${i}`;

                makeElementDraggable(div);
                options.appendChild(div);
            });
        }

    } else if (currentSection === 2) {

        const fraseSeleccionada =
            frasesComplexes[Math.floor(Math.random() * frasesComplexes.length)];

        question.textContent =
            `Arrossega i ordena la major quantitat de pictogrames per traduir la frase:`;

        duoHint.textContent = `"${fraseSeleccionada.text}"`;
        duoHint.style.display = "block";

        duoHint.style.animation = "none";
        void duoHint.offsetWidth;
        duoHint.style.animation = "pop 0.4s ease";

        correctAnswersOrder = fraseSeleccionada.ordre;

        let distractors = [];

        while (distractors.length <
            (numOptions - correctAnswersOrder.length)) {

            let d = data[Math.floor(Math.random() * data.length)].e;

            if (!correctAnswersOrder.includes(d) &&
                !distractors.includes(d)) {
                distractors.push(d);
            }
        }

        const allPieces =
            shuffle([...correctAnswersOrder, ...distractors]);

        allPieces.forEach((sym, i) => {

            const div = document.createElement('div');

            div.className = 'drag-item item-pic';
            div.textContent = sym;
            div.draggable = true;
            div.id = `drag-${i}`;
            div.dataset.val = sym;

            makeElementDraggable(div);
            options.appendChild(div);
        });

    } else if (currentSection === 3) {

        const sit =
            situacions[Math.floor(Math.random() * situacions.length)];

        question.textContent = sit.q;

        targetZone.innerHTML =
            `<div class="target-label">?</div>`;

        targetZone.dataset.correct = sit.correct;

        const finalOpts =
            shuffle([sit.correct, ...sit.opts.slice(0, 4)]);

        finalOpts.forEach((opt, i) => {

            const div = document.createElement('div');

            div.className = 'drag-item item-pic';
            div.textContent = opt;
            div.draggable = true;
            div.id = `drag-${i}`;

            makeElementDraggable(div);
            options.appendChild(div);
        });
    }
}

function checkAnswerDirectly(element) {
    const answer = element.textContent;
    const correct = targetZone.dataset.correct;
    resolveRound(answer === correct);
}

function checkSentenceOrder() {

    const items =
        Array.from(targetZone.querySelectorAll('.drag-item'));

    const userOrder =
        items.map(el => el.dataset.val);

    if (userOrder.length !== correctAnswersOrder.length) {
        resolveRound(false);
        return;
    }

    const isCorrect =
        userOrder.every(
            (val, index) => val === correctAnswersOrder[index]
        );

    resolveRound(isCorrect);
}

function resolveRound(ok) {

    document
        .querySelectorAll('.drag-item')
        .forEach(el => el.draggable = false);

    if (ok) {

        score += 1;
        correctCount++;

        const badge = document.querySelector('.score-badge');

        if (badge) {
            badge.classList.remove('bump');
            void badge.offsetWidth;
            badge.classList.add('bump');
        }

        targetZone.classList.add('correct-bg');

        updateProgressCircle(ok);

        questionInSectionIdx++;
        updateHeader();

        setTimeout(() => {
            targetZone.classList.remove('correct-bg');
            next();
        }, 1500);

    } else {

        score = Math.max(0, score - 2);

        targetZone.classList.add('wrong-bg');

        setTimeout(() => {

            targetZone.innerHTML = `
            <div style="
                font-size:18px;
                font-weight:bold;
                color:#d32f2f;
                margin-bottom:15px;
                text-transform:uppercase;">
                Resposta correcta:
            </div>`;

            if (currentSection === 2) {

                const correctDiv =
                    document.createElement('div');

                correctDiv.style.display = "flex";
                correctDiv.style.gap = "6px";
                correctDiv.style.justifyContent = "center";

                correctAnswersOrder.forEach(pictograma => {

                    const el =
                        document.createElement('div');

                    el.className =
                        "drag-item item-pic";

                    el.textContent = pictograma;

                    el.style.fontSize = "30px";
                    el.style.padding = "5px 10px";
                    el.style.animation = "pop .4s ease";

                    correctDiv.appendChild(el);
                });

                targetZone.appendChild(correctDiv);

            } else {

                const correctVal =
                    targetZone.dataset.correct;

                targetZone.innerHTML += `
                <div class="drag-item item-pic"
                     style="
                        font-size:30px;
                        padding:5px 15px;
                        animation:pop .4s ease;">
                     ${correctVal}
                </div>`;
            }

            updateProgressCircle(ok);

            questionInSectionIdx++;
            updateHeader();

            setTimeout(() => {
                targetZone.classList.remove('wrong-bg');
                next();
            }, 2000);

        }, 1000);
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

initDragAndDrop();
updateHeader();
next();