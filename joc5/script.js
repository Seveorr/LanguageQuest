let currentSection = 1;
let questionInSectionIdx = 1;
const maxQuestionsPerSection = 10;
const totalQuestions = maxQuestionsPerSection * 3;

let sectionScores = [0, 0, 0];
let currentItemData = null;
let currentUtterance = null;

// Gestió de llistes aleatòries sense repetició
let shuffledDictats = [];
let shuffledFrases = [];
let shuffledSituacions = [];

function shuffleArray(array) {
    return [...array].sort(() => Math.random() - 0.5);
}

function updateHeader() {
    const badge = document.getElementById("sectionBadge");
    const title = document.getElementById("headerTitle");

    badge.textContent = `Secció ${currentSection} / 3`;

    if (currentSection === 1) {
        title.textContent = "Dictat i comprensió auditiva";
    } else if (currentSection === 2) {
        title.textContent = "Ordenar paraules";
    } else {
        title.textContent = "Redacció de textos i contextos";
    }
}

const modal = document.getElementById("exitModal");
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
        circle.className = isCorrect ? "circle correct" : "circle incorrect";
        circle.textContent = isCorrect ? "✓" : "X";
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

function next() {
    if (questionInSectionIdx > maxQuestionsPerSection) {
        currentSection++;
        questionInSectionIdx = 1;
        resetProgressBar();

        if (currentSection > 3) {
            document.querySelector('.sidebar').style.display = "none";
            document.querySelector('.main-container').style.justifyContent = "center";
            document.getElementById("topInfo").style.display = "none";
            document.getElementById("gameArea").style.display = "none";
            msg.style.display = "none";
            document.getElementById("exitContainer").style.display = "none";

            const totalScoreSum = sectionScores.reduce((a, b) => a + b, 0);
            showFinalScreen(
                "Enhorabona! Has completat totes les seccions del Writer.",
                totalScoreSum,
                totalQuestions
            );
            return;
        }
    }

    msg.textContent = "";
    options.innerHTML = "";
    targetZone.innerHTML = "";
    actionBtn.style.display = "none";

    updateHeader();

    question.style.animation = "none";
    void question.offsetWidth;
    question.style.animation = "pop 0.4s ease";

    if (currentSection === 1) {
        if (shuffledDictats.length === 0) shuffledDictats = shuffleArray(dictats);
        currentItemData = shuffledDictats[(questionInSectionIdx - 1) % shuffledDictats.length];

        question.textContent = "Escolta l'àudio i escriu la frase exacta:";

        const audioContainer = document.createElement("div");
        audioContainer.style.display = "flex";
        audioContainer.style.flexDirection = "column";
        audioContainer.style.alignItems = "center";
        audioContainer.style.gap = "15px";
        audioContainer.style.width = "100%";

        const playBtn = document.createElement("button");
        playBtn.className = "btn-action";
        playBtn.id = "playAudioBtn";
        playBtn.textContent = "🔊 Reproduir Àudio";
        playBtn.onclick = () => playDictationAudio(playBtn);

        const inputWrapper = document.createElement("div");
        inputWrapper.id = "dictationWrapper";
        inputWrapper.style.width = "100%";

        const inputField = document.createElement("input");
        inputField.type = "text";
        inputField.id = "dictationInput";
        inputField.placeholder = "Escriu aquí el que sents...";
        inputField.className = "writer-input";

        inputWrapper.appendChild(inputField);
        audioContainer.appendChild(playBtn);
        audioContainer.appendChild(inputWrapper);
        targetZone.appendChild(audioContainer);

        actionBtn.style.display = "inline-block";
        actionBtn.textContent = "Comprovar resposta";
        actionBtn.onclick = checkDictation;

        setTimeout(() => {
            playDictationAudio(playBtn);
        }, 1000);

    } else if (currentSection === 2) {
        if (shuffledFrases.length === 0) shuffledFrases = shuffleArray(frasesOrdenar);
        currentItemData = shuffledFrases[(questionInSectionIdx - 1) % shuffledFrases.length];

        question.textContent = "Ordena les paraules per construir una oració correcta:";

        const scrambled = shuffleArray(currentItemData.paraules);

        targetZone.style.minHeight = "70px";
        targetZone.style.display = "flex";
        targetZone.style.flexWrap = "wrap";
        targetZone.style.gap = "8px";
        targetZone.style.alignItems = "center";
        targetZone.style.justifyContent = "center";
        targetZone.innerHTML = `<span style="color:#888; font-style:italic;">Clica les paraules per afegir-les...</span>`;

        scrambled.forEach((p) => {
            const wordEl = document.createElement("div");
            wordEl.className = "drag-item item-word";
            wordEl.textContent = p;
            wordEl.style.cursor = "pointer";
            wordEl.style.padding = "8px 14px";
            wordEl.style.background = "#e3f2fd";
            wordEl.style.borderRadius = "6px";
            wordEl.style.margin = "4px";
            wordEl.onclick = () => {
                if (targetZone.querySelector("span")) targetZone.innerHTML = "";
                targetZone.appendChild(wordEl);
                actionBtn.style.display = "inline-block";
                actionBtn.textContent = "Comprovar frase";
                actionBtn.onclick = checkSentenceOrder;
            };
            options.appendChild(wordEl);
        });

    } else if (currentSection === 3) {
        if (shuffledSituacions.length === 0) shuffledSituacions = shuffleArray(situacionsRedaccio);
        currentItemData = shuffledSituacions[(questionInSectionIdx - 1) % shuffledSituacions.length];
        
        question.innerHTML = `${currentItemData.icona} <strong>${currentItemData.titol}</strong><br><span style="font-size:15px; font-weight:normal; color:#555;">Respon a la situació utilitzant l'eina interactiva:</span>`;

        targetZone.innerHTML = "";
        
        const wrapper = document.createElement("div");
        wrapper.className = `writing-environment ${currentItemData.tipus}`;

        if (currentItemData.tipus === "whatsapp") {
            wrapper.innerHTML = `
                <div class="phone-frame">
                    <div class="phone-status-bar">
                        <span>10:42</span>
                        <span>📶 🛜 🔋 94%</span>
                    </div>
                    <div class="whatsapp-header">
                        <div class="avatar">👤</div>
                        <div class="contact-info">
                            <span class="chat-title">Marc (Amic)</span>
                            <span class="chat-status">en línia</span>
                        </div>
                    </div>
                    <div class="whatsapp-body">
                        <div class="chat-bubble incoming-bubble">
                            ${currentItemData.missatgeEntrant}
                            <span class="msg-time">10:41</span>
                        </div>
                        <div class="chat-bubble user-bubble">
                            <textarea id="writingInput" placeholder="Escriu la teva resposta aquí..."></textarea>
                            <span class="msg-time">Ara</span>
                        </div>
                    </div>
                    <div class="whatsapp-footer">
                        <span class="emoji-icon">😊</span>
                        <div class="fake-input-bar">Escriu un missatge</div>
                        <button class="send-btn" onclick="checkWriting()">➤</button>
                    </div>
                </div>
            `;
        } else if (currentItemData.tipus === "carta") {
            wrapper.innerHTML = `
                <div class="letter-paper">
                    <div class="stamp">
                        <div class="stamp-inner">👑 <span>CORREUS</span></div>
                    </div>
                    <div class="letter-context-box">
                        <em>"${currentItemData.missatgeEntrant}"</em>
                    </div>
                    <div class="letter-header">Data: ${new Date().toLocaleDateString('ca-ES')}</div>
                    <textarea id="writingInput" class="letter-textarea" placeholder="Escriu la continuació de la carta aquí..."></textarea>
                </div>
            `;
        } else if (currentItemData.tipus === "correu") {
            wrapper.innerHTML = `
                <div class="email-client">
                    <div class="window-controls">
                        <span class="dot red"></span>
                        <span class="dot yellow"></span>
                        <span class="dot green"></span>
                        <span class="window-title">Redactar missatge - Correu Electrònic</span>
                    </div>
                    <div class="email-header">
                        <div><strong>De:</strong> alumne@escola.cat</div>
                        <div><strong>Per a:</strong> professorat@escola.cat</div>
                        <div><strong>Assumpte:</strong> Dubte sobre el termini del treball</div>
                    </div>
                    <div class="email-context-note">
                        💡 <em>Referència: ${currentItemData.missatgeEntrant}</em>
                    </div>
                    <div class="email-toolbar">
                        <span><b>Negreta</b></span> | <span><i>Cursiva</i></span> | <span><u>Subratllat</u></span> | <span>📎 Adjuntar</span>
                    </div>
                    <textarea id="writingInput" class="email-textarea" placeholder="Escriu el teu correu formal aquí..."></textarea>
                </div>
            `;
        }

        const wordCountInfo = document.createElement("div");
        wordCountInfo.id = "wordCountInfo";
        wordCountInfo.className = "word-count-badge";
        wordCountInfo.textContent = `Paraules: 0 / Mínim: ${currentItemData.minParaules}`;

        targetZone.appendChild(wrapper);
        targetZone.appendChild(wordCountInfo);

        const textArea = wrapper.querySelector("#writingInput");
        textArea.oninput = () => {
            const words = textArea.value.trim() ? textArea.value.trim().split(/\s+/).length : 0;
            wordCountInfo.textContent = `Paraules: ${words} / Mínim: ${currentItemData.minParaules}`;
            wordCountInfo.style.color = (words >= currentItemData.minParaules) ? "#2e7d32" : "#d32f2f";
        };

        actionBtn.style.display = "inline-block";
        actionBtn.textContent = "Enviar text";
        actionBtn.onclick = checkWriting;
    }
}

function playDictationAudio(btn) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        // Utilitza el camp audioText per a la veu
        const speechText = currentItemData.audioText || currentItemData.text;
        currentUtterance = new SpeechSynthesisUtterance(speechText);
        currentUtterance.lang = "ca-ES";

        btn.textContent = "🔊 Reproduint...";
        btn.style.opacity = "0.7";
        btn.disabled = true;

        currentUtterance.onend = () => {
            btn.textContent = "🔊 Tornar a escoltar";
            btn.style.opacity = "1";
            btn.disabled = false;
        };

        currentUtterance.onerror = () => {
            btn.textContent = "🔊 Reproduir Àudio";
            btn.style.opacity = "1";
            btn.disabled = false;
        };

        window.speechSynthesis.speak(currentUtterance);
    }
}

function checkDictation() {
    const input = document.getElementById("dictationInput");
    const wrapper = document.getElementById("dictationWrapper");
    if (!input || !wrapper) return;
    
    const userText = input.value.trim();
    const correctText = currentItemData.text.trim();

    const userWords = userText ? userText.split(/\s+/) : [];
    const correctWords = correctText.split(/\s+/);

    let correctMatches = 0;
    let inlineCorrectionHTML = "";

    // Corregim directament l'error mostrant la paraula correcta
    correctWords.forEach((cWord, idx) => {
        const cleanC = cWord.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        const uWord = userWords[idx] || "";
        const cleanU = uWord.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

        if (cleanU === cleanC) {
            correctMatches++;
            inlineCorrectionHTML += `<span class="word-correct">${uWord || cWord}</span> `;
        } else {
            // Si hi ha error, mostrem la paraula correcta corregida directament
            inlineCorrectionHTML += `<span class="word-fixed" title="Has escrit: '${uWord || 'res'}'">${cWord}</span> `;
        }
    });

    const totalWords = correctWords.length;
    const percentage = Math.round((correctMatches / totalWords) * 100);
    const isOk = percentage >= 70;

    // Reemplaçament del camp d'escriptura per la frase totalment corregida
    wrapper.innerHTML = `
        <div class="writer-input correction-box">
            ${inlineCorrectionHTML}
        </div>
    `;

    if (isOk) {
        sectionScores[0]++;
        msg.innerHTML = `<span style="color:#2e7d32; font-weight:bold;">Molt bé! (${percentage}% d'encert)</span>`;
    } else {
        msg.innerHTML = `<span style="color:#d32f2f; font-weight:bold;">${percentage}% d'encert. S'han corregit els errors marcats en lila.</span>`;
    }

    updateProgressCircle(isOk);
    questionInSectionIdx++;
    actionBtn.style.display = "none";
    setTimeout(() => { next(); }, 4000);
}

function checkSentenceOrder() {
    const items = Array.from(targetZone.querySelectorAll('.drag-item'));
    const userOrder = items.map(el => el.textContent).join(" ");
    const isOk = (userOrder === currentItemData.ordreCorrecte);

    if (isOk) {
        sectionScores[1]++;
        msg.innerHTML = `<span style="color:#2e7d32; font-weight:bold;">Molt bé! Frase correcta.</span>`;
    } else {
        msg.innerHTML = `<span style="color:#d32f2f; font-weight:bold;">Incorrecte. L'ordre era: "${currentItemData.ordreCorrecte}"</span>`;
    }

    updateProgressCircle(isOk);
    questionInSectionIdx++;
    actionBtn.style.display = "none";
    setTimeout(() => { next(); }, 2500);
}

function checkWriting() {
    const textArea = document.getElementById("writingInput");
    if (!textArea) return;
    
    const text = textArea.value.trim().toLowerCase();
    const words = text ? text.split(/\s+/) : [];
    
    const hasMinWords = words.length >= currentItemData.minParaules;
    const matchedKeywords = currentItemData.keywords.filter(kw => text.includes(kw.toLowerCase()));
    const hasEnoughKeywords = matchedKeywords.length >= 2;

    if (!hasMinWords) {
        msg.innerHTML = `<span style="color:#d32f2f; font-weight:bold;">El text no arriba al mínim de ${currentItemData.minParaules} paraules (n'has escrit ${words.length}).</span>`;
        updateProgressCircle(false);
    } else if (!hasEnoughKeywords) {
        msg.innerHTML = `<span style="color:#d32f2f; font-weight:bold;">El text no sembla relacionat amb el tema. Inclou conceptes com: ${currentItemData.keywords.slice(0, 3).join(', ')}.</span>`;
        updateProgressCircle(false);
    } else {
        sectionScores[2]++;
        msg.innerHTML = `<span style="color:#2e7d32; font-weight:bold;">Molt bé! Redacció coherent i adequada.</span>`;
        updateProgressCircle(true);
    }

    questionInSectionIdx++;
    actionBtn.style.display = "none";
    setTimeout(() => { next(); }, 3000);
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
        <div class="final-fraction">${correct}/${total} encerts totals</div>
        <div style="margin: 15px 0; font-size: 15px; color: #444; background: #f8f9fa; padding: 12px; border-radius: 8px;">
            <div><strong>Secció 1 (Dictat):</strong> ${sectionScores[0]} / 10</div>
            <div><strong>Secció 2 (Ordenar):</strong> ${sectionScores[1]} / 10</div>
            <div><strong>Secció 3 (Redacció):</strong> ${sectionScores[2]} / 10</div>
        </div>
        <button class="btn-action" onclick="redirectToMenu()">Tornar al menú</button>
    `;

    finalScreen.style.display = "flex";
}

updateHeader();
next();