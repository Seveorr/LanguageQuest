// ============================================
// CONFIGURACIÓ GENERAL
// ============================================

const sectionSizes = [10, 10, 2];
const totalQuestions = sectionSizes.reduce((a, b) => a + b, 0);

let currentSection = 1;
let questionIdx = 1;
let correctCount = 0;

function shuffle(a) { return [...a].sort(() => Math.random() - 0.5); }

// Bancs de preguntes triats a l'atzar per a aquesta partida
const section1Items = shuffle(paraulesPronunciacio).slice(0, sectionSizes[0]);
const section2Items = shuffle(preguntesOrals).slice(0, sectionSizes[1]);
const section3Items = shuffle(preguntesObertes).slice(0, sectionSizes[2]);

// ============================================
// ELEMENTS DEL DOM
// ============================================

const modal = document.getElementById("exitModal");
const question = document.getElementById("question");
const gameArea = document.getElementById("gameArea");
const msg = document.getElementById("msg");
const progressContainer = document.getElementById("progressContainer");

function showExitModal() { modal.classList.add("active"); }
function hideExitModal() { modal.classList.remove("active"); }
function redirectToMenu() { window.location.href = "../menu/index.html"; }

// ============================================
// RECONEIXEMENT DE VEU
// ============================================

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechSupported = !!SpeechRecognitionAPI;
let recognition = null;

if (speechSupported) {
    recognition = new SpeechRecognitionAPI();
    recognition.lang = "ca-ES";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
}

let isListening = false;

function normalize(text) {
    return text
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // treu accents
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
            else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

function isCloseMatch(said, target) {
    const a = normalize(said);
    const b = normalize(target);
    if (!a) return false;
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;
    const tolerance = Math.max(2, Math.round(b.length * 0.25));
    return levenshtein(a, b) <= tolerance;
}

// Connecta un botó de micròfon a un element de transcripció.
// Primer clic: comença a gravar i mostra en directe el que va sentint.
// Segon clic (o el mateix botó, ara dient "Atura't"): para la gravació
// i crida onFinalResult amb el text final detectat.
function attachMicButton(btnId, transcriptId, matchTarget, onFinalResult) {

    const micBtn = document.getElementById(btnId);
    const transcriptEl = document.getElementById(transcriptId);

    if (!micBtn) return;

    micBtn.dataset.label = micBtn.textContent;

    if (!speechSupported) {
        micBtn.disabled = true;
        transcriptEl.textContent = "El teu navegador no admet el reconeixement de veu.";
        return;
    }

    const getTarget = typeof matchTarget === "function" ? matchTarget : () => matchTarget;

    let finalTranscript = "";
    let hadError = false;
    let matchedEarly = false;

    function errorMessage(errorCode) {
        if (errorCode === "not-allowed" || errorCode === "service-not-allowed") {
            return "No s'ha concedit permís per fer servir el micròfon (o la pàgina no s'està obrint amb HTTPS/localhost).";
        }
        if (errorCode === "audio-capture") {
            return "No s'ha trobat cap micròfon disponible en aquest dispositiu.";
        }
        if (errorCode === "network") {
            return "Error de xarxa: el reconeixement de veu necessita connexió a internet.";
        }
        if (errorCode === "language-not-supported") {
            return "El català no és compatible amb el reconeixement de veu d'aquest navegador.";
        }
        return "S'ha produït un error amb el micròfon. Torna-ho a provar.";
    }

    micBtn.onclick = () => {
        if (!isListening) {
            // ---- Comença a gravar ----
            finalTranscript = "";
            hadError = false;
            matchedEarly = false;
            transcriptEl.textContent = "Escoltant...";

            recognition.onresult = (event) => {
                let interim = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + " ";
                    } else {
                        interim += transcript;
                    }
                }

                const currentText = (finalTranscript + interim).trim();
                transcriptEl.textContent = "Escoltant: " + currentText;

                // Tan bon punt es reconeix la paraula/frase esperada,
                // donem la pregunta per bona a l'instant.
                const target = getTarget();
                if (target && !matchedEarly && isCloseMatch(currentText, target)) {
                    matchedEarly = true;
                    finalTranscript = currentText;
                    recognition.stop();
                }
            };

            recognition.onerror = (e) => {
                if (e.error === "no-speech" || e.error === "aborted") return;
                hadError = true;
                isListening = false;
                micBtn.classList.remove("listening");
                micBtn.textContent = micBtn.dataset.label;
                transcriptEl.textContent = errorMessage(e.error);
            };

            recognition.onend = () => {
                isListening = false;
                micBtn.classList.remove("listening");
                micBtn.textContent = micBtn.dataset.label;

                if (hadError) return;

                const said = finalTranscript.trim();

                if (!said) {
                    transcriptEl.textContent = "No s'ha detectat cap veu. Prem \"Gravar\" per tornar-ho a provar.";
                    return;
                }

                transcriptEl.textContent = `Has dit: "${said}"`;
                onFinalResult(said, matchedEarly);
            };

            try {
                recognition.start();
                isListening = true;
                micBtn.classList.add("listening");
                micBtn.textContent = "🛑 Atura't";
            } catch (e) {
                isListening = false;
            }

        } else {
            // ---- Atura la gravació (l'onend farà la resta) ----
            recognition.stop();
        }
    };
}

// ============================================
// CAPÇALERA I PROGRÉS
// ============================================

function updateHeader() {
    const badge = document.getElementById("sectionBadge");
    const title = document.getElementById("headerTitle");

    badge.textContent = `Secció ${currentSection} / 3`;

    if (currentSection === 1) {
        title.textContent = "Pronuncia les paraules";
    } else if (currentSection === 2) {
        title.textContent = "Respon en veu alta";
    } else {
        title.textContent = "Expressa't lliurement";
    }
}

function buildProgressCircles(count) {
    progressContainer.innerHTML = "";
    for (let i = 1; i <= count; i++) {
        const circle = document.createElement("div");
        circle.className = "circle";
        circle.id = `c${i}`;
        circle.textContent = i;
        progressContainer.appendChild(circle);
    }
}

function updateProgressCircle(idx, ok) {
    const circle = document.getElementById(`c${idx}`);
    if (circle) {
        if (ok) {
            circle.className = "circle correct";
            circle.textContent = "✓";
        } else {
            circle.className = "circle incorrect";
            circle.textContent = "X";
        }
    }
}

// ============================================
// FEEDBACK I RESOLUCIÓ DE RONDA
// ============================================

function showFeedback(ok, customText) {
    const title = ok ? "Molt bé!" : "Segueix practicant";
    const text = customText || (ok
        ? "Ho has dit correctament."
        : "No s'ha reconegut prou bé. Torna-ho a intentar la propera vegada.");

    msg.innerHTML = `
        <div class="notice-box ${ok ? 'success' : 'fail'}">
            <span class="notice-icon">${ok ? '✅' : '❌'}</span>
            <div class="notice-body">
                <div class="notice-title">${title}</div>
                <div class="notice-text">${text}</div>
            </div>
        </div>`;
}

function resolveRound(ok, customText) {

    if (ok) correctCount++;

    updateProgressCircle(questionIdx, ok);
    showFeedback(ok, customText);

    document.querySelectorAll(".option-btn, .mic-btn").forEach(el => el.disabled = true);

    setTimeout(() => {
        msg.innerHTML = "";
        questionIdx++;
        next();
    }, 2600);
}

// ============================================
// SECCIÓ 1: PRONUNCIA LA PARAULA
// ============================================

function renderSection1(idx) {
    const item = section1Items[idx];

    question.textContent = "Pronuncia aquesta paraula en veu alta:";

    gameArea.innerHTML = `
        <div class="talker-word">${item.word}</div>
        <button class="mic-btn" id="micBtn">🎤 Gravar</button>
        <div class="talker-transcript" id="transcriptText">Prem el botó, digues la paraula, i torna a prémer'l per aturar.</div>
    `;

    attachMicButton("micBtn", "transcriptText", item.word, (said, matchedEarly) => {
        const ok = matchedEarly || isCloseMatch(said, item.word);
        resolveRound(ok, ok
            ? `Molt bé, has pronunciat bé "${item.word}"!`
            : `Sembla que no has dit "${item.word}". Torna-ho a provar!`);
    });
}

// ============================================
// SECCIÓ 2: TRIA UNA RESPOSTA I DIGUES-LA
// ============================================

function renderSection2(idx) {
    const item = section2Items[idx];
    const opts = shuffle(item.options);
    let selected = null;

    question.textContent = item.question;

    gameArea.innerHTML = `
        <div class="options" id="optsContainer"></div>
        <div class="talker-say-area" id="sayArea" style="display:none;">
            <p class="prompt">Ara digues aquesta frase en veu alta:</p>
            <div class="talker-word" id="chosenText" style="font-size:26px;"></div>
            <button class="mic-btn" id="micBtn">🎤 Gravar</button>
            <div class="talker-transcript" id="transcriptText"></div>
        </div>
    `;

    const optsContainer = document.getElementById("optsContainer");

    opts.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = opt.text;
        btn.onclick = () => {
            selected = opt;
            optsContainer.querySelectorAll(".option-btn").forEach(b => {
                b.disabled = true;
                b.classList.remove("chosen");
            });
            btn.classList.add("chosen");
            document.getElementById("chosenText").textContent = `"${opt.text}"`;
            document.getElementById("sayArea").style.display = "block";
        };
        optsContainer.appendChild(btn);
    });

    document.getElementById("transcriptText").textContent = "";

    attachMicButton("micBtn", "transcriptText", () => selected ? selected.text : null, (said, matchedEarly) => {
        if (!selected) return;

        const pronounced = matchedEarly || isCloseMatch(said, selected.text);

        let customText;
        if (selected.correct && pronounced) {
            customText = "Molt bé! Era una resposta adequada i l'has dit clarament.";
        } else if (selected.correct && !pronounced) {
            customText = "La resposta triada era adequada, però prova de dir-la més clarament.";
        } else {
            customText = "Aquesta no era la resposta més adequada per a la pregunta.";
        }

        const ok = selected.correct && pronounced;
        resolveRound(ok, customText);
    });
}

// ============================================
// SECCIÓ 3: DESENVOLUPA UNA RESPOSTA ORAL
// ============================================

function renderSection3(idx) {
    const item = section3Items[idx];

    question.textContent = item.prompt;

    gameArea.innerHTML = `
        <button class="mic-btn" id="micBtn">🎤 Gravar resposta</button>
        <div class="talker-transcript" id="transcriptText">Prem el botó, respon en veu alta, i torna a prémer'l per aturar.</div>
    `;

    attachMicButton("micBtn", "transcriptText", null, said => {
        const wordCount = said ? said.trim().split(/\s+/).length : 0;
        const ok = wordCount >= 8;

        resolveRound(ok, ok
            ? "Molt bé, has desenvolupat una resposta completa!"
            : "Intenta explicar-t'hi una mica més la propera vegada.");
    });
}

// ============================================
// PROGRESSIÓ ENTRE SECCIONS
// ============================================

function next() {

    if (questionIdx > sectionSizes[currentSection - 1]) {

        questionIdx = 1;
        currentSection++;

        if (currentSection > 3) {
            showFinalScreen();
            return;
        }

        buildProgressCircles(sectionSizes[currentSection - 1]);
    }

    updateHeader();

    question.style.animation = "none";
    void question.offsetWidth;
    question.style.animation = "pop 0.4s ease";

    const idx = questionIdx - 1;

    if (currentSection === 1) renderSection1(idx);
    else if (currentSection === 2) renderSection2(idx);
    else renderSection3(idx);
}

function showFinalScreen() {

    document.querySelector(".sidebar").style.display = "none";
    document.querySelector(".main-container").style.justifyContent = "center";

    document.getElementById("topInfo").style.display = "none";
    gameArea.style.display = "none";
    msg.style.display = "none";
    document.getElementById("exitContainer").style.display = "none";

    const pct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    let pctClass = "low";
    if (pct >= 70) pctClass = "good";
    else if (pct >= 40) pctClass = "mid";

    const finalScreen = document.getElementById("finalScreen");

    finalScreen.innerHTML = `
        <div class="final-message">🎉 Enhorabona! Has completat totes les seccions.</div>
        <div class="final-percentage ${pctClass}">${pct}%</div>
        <div class="final-fraction">${correctCount}/${totalQuestions} encerts</div>
        <button class="btn-action" onclick="redirectToMenu()">Tornar al menú</button>
    `;

    finalScreen.style.display = "flex";
}

buildProgressCircles(sectionSizes[0]);
updateHeader();
next();