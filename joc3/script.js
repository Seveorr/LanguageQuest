function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

const NUM_DIALEGS = 5;

// Tria NUM_DIALEGS escenes aleatòries (sense repetir) de totes les disponibles a "scenes"
function pickRandomScenes(count) {
    const allKeys = Object.keys(scenes);
    return shuffle(allKeys).slice(0, count);
}

const playOrder = pickRandomScenes(NUM_DIALEGS);

let currentIndex = 0;
let currentScene = playOrder[0];
let successCount = 0;

// Elements del DOM
const progressContainer = document.getElementById("progressContainer");
const sectionBadge = document.getElementById("sectionBadge");
const sceneTitle = document.getElementById("sceneTitle");
const sceneHeader = document.getElementById("sceneHeader");
const bubbleFooter = document.querySelector(".bubble-footer");
const avatarEl = document.getElementById("avatar");
const characterNameEl = document.getElementById("characterName");
const tipBox = document.getElementById("tipBox");
const dialogueBox = document.getElementById("dialogueBox");
const npcText = document.getElementById("npcText");
const optionsArea = document.getElementById("optionsArea");
const optionsEl = document.getElementById("options");
const gameArea = document.getElementById("gameArea");
const msg = document.getElementById("msg");
const speakBtn = document.getElementById("speakBtn");
const modal = document.getElementById("exitModal");

function showExitModal() { modal.classList.add("active"); }
function hideExitModal() { modal.classList.remove("active"); }
function redirectToMenu() { window.location.href = "../menu/index.html"; }

// ============================================
// LATERAL DE PROGRÉS (cercles numerats, no interactius)
// ============================================

function buildProgressCircles() {
    progressContainer.innerHTML = "";

    playOrder.forEach((_, i) => {
        const circle = document.createElement("div");
        circle.className = "circle";
        circle.id = `c${i + 1}`;
        circle.textContent = i + 1;
        progressContainer.appendChild(circle);
    });
}

function updateProgressCircle(index, success) {
    const circle = document.getElementById(`c${index + 1}`);
    if (circle) {
        if (success) {
            circle.className = "circle correct";
            circle.textContent = "✓";
        } else {
            circle.className = "circle incorrect";
            circle.textContent = "X";
        }
    }
}

// ============================================
// SÍNTESI DE VEU
// ============================================

let availableVoices = [];

function loadVoices() {
    availableVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith("ca"));
}
loadVoices();
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
}

function applyVoice(utterance, role) {
    if (availableVoices.length > 1) {
        utterance.voice = role === "npc" ? availableVoices[0] : availableVoices[1];
    } else if (availableVoices.length === 1) {
        utterance.voice = availableVoices[0];
    }
    utterance.lang = "ca-ES";
    utterance.rate = 0.95;
    utterance.pitch = role === "npc" ? 1 : 1.2;
}

function speakQueue(texts, role, onDone) {
    let index = 0;
    function speakNext() {
        if (index >= texts.length) {
            if (onDone) onDone();
            return;
        }
        const utterance = new SpeechSynthesisUtterance(texts[index]);
        applyVoice(utterance, role);
        utterance.onend = () => {
            index++;
            speakNext();
        };
        window.speechSynthesis.speak(utterance);
    }
    speakNext();
}

function speakScene() {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    speakBtn.classList.add("speaking");

    speakQueue([npcText.textContent], "npc", () => {
        if (optionsArea.style.display !== "none") {
            const optionButtons = optionsEl.querySelectorAll(".option-btn");
            const optionTexts = ["Les teves opcions són:"];
            optionButtons.forEach((btn, i) => {
                optionTexts.push("Opció " + (i + 1) + ": " + btn.textContent.replace(/[“”]/g, ""));
            });
            speakQueue(optionTexts, "options", () => {
                speakBtn.classList.remove("speaking");
            });
        } else {
            speakBtn.classList.remove("speaking");
        }
    });
}

speakBtn.addEventListener("click", speakScene);

// ============================================
// MOTOR DE DIÀLEG
// ============================================

function renderNode(nodeId) {
    window.speechSynthesis.cancel();
    speakBtn.classList.remove("speaking");

    const tree = scenes[currentScene].tree;
    const node = tree[nodeId];

    npcText.style.animation = "none";
    requestAnimationFrame(() => { npcText.style.animation = "pop 0.3s ease"; });

    npcText.textContent = node.npc;
    avatarEl.textContent = node.avatar;
    characterNameEl.textContent = node.character;

    if (node.tip) {
        const tipText = node.tip.replace(/^💡\s*/, "");
        tipBox.innerHTML = `
            <span class="notice-icon">💡</span>
            <div class="notice-body">
                <div class="notice-title">Consell</div>
                <div class="notice-text">${tipText}</div>
            </div>`;
        tipBox.style.display = "flex";
    } else {
        tipBox.style.display = "none";
    }

    dialogueBox.classList.remove("correct-bg", "wrong-bg");
    msg.innerHTML = "";

    if (node.end) {

        optionsArea.style.display = "none";

        const ok = node.end.success;

        dialogueBox.classList.add(ok ? "correct-bg" : "wrong-bg");
        updateProgressCircle(currentIndex, ok);
        if (ok) successCount++;

        msg.innerHTML = `
            <div class="notice-box ${ok ? 'success' : 'fail'}">
                <span class="notice-icon">${node.end.emoji}</span>
                <div class="notice-body">
                    <div class="notice-title">${node.end.title}</div>
                    <div class="notice-text">${node.end.text}</div>
                </div>
            </div>`;

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            speakBtn.classList.add("speaking");
            speakQueue([npcText.textContent], "npc", () => speakBtn.classList.remove("speaking"));
        }

        setTimeout(() => {
            dialogueBox.classList.remove("correct-bg", "wrong-bg");
            advanceScene();
        }, 4200);

        return;
    }

    optionsArea.style.display = "block";

    optionsEl.innerHTML = "";
    shuffle(node.options).forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = "“" + opt.text + "”";
        btn.onclick = () => chooseOption(btn, opt);
        optionsEl.appendChild(btn);
    });

    speakScene();
}

function chooseOption(btn, opt) {

    document.querySelectorAll(".option-btn").forEach(b => {
        b.classList.add("disabled");
        b.onclick = null;
    });

    if (opt.correct) {
        btn.classList.add("correct");
        setTimeout(() => renderNode(opt.next), 350);
    } else {
        btn.classList.add("wrong");
        setTimeout(() => renderNode(opt.next), 900);
    }
}

// ============================================
// PROGRESSIÓ ENTRE ESCENES
// ============================================

function loadScene(index) {
    currentIndex = index;
    currentScene = playOrder[index];

    sceneTitle.style.animation = "none";
    void sceneTitle.offsetWidth;
    sceneTitle.style.animation = "pop 0.4s ease";

    sceneTitle.textContent = scenes[currentScene].title;
    sectionBadge.textContent = `Diàleg ${index + 1} / ${playOrder.length}`;

    renderNode("start");
}

function advanceScene() {
    const next = currentIndex + 1;

    if (next >= playOrder.length) {
        showFinalScreen();
    } else {
        loadScene(next);
    }
}

function showFinalScreen() {

    document.querySelector(".sidebar").style.display = "none";
    document.querySelector(".main-container").style.justifyContent = "center";

    sceneHeader.style.display = "none";
    document.querySelector(".character").style.display = "none";
    tipBox.style.display = "none";
    dialogueBox.style.display = "none";
    if (bubbleFooter) bubbleFooter.style.display = "none";
    msg.style.display = "none";
    document.getElementById("exitContainer").style.display = "none";

    const total = playOrder.length;
    const pct = total > 0 ? Math.round((successCount / total) * 100) : 0;

    let pctClass = "low";
    if (pct >= 70) pctClass = "good";
    else if (pct >= 40) pctClass = "mid";

    const finalScreen = document.getElementById("finalScreen");

    finalScreen.innerHTML = `
        <div class="final-message">Enhorabona! Has completat totes les converses.</div>
        <div class="final-percentage ${pctClass}">${pct}%</div>
        <div class="final-fraction">${successCount}/${total} encerts</div>
        <button class="btn-action" onclick="redirectToMenu()">Tornar al menú</button>
    `;

    finalScreen.style.display = "flex";
}

buildProgressCircles();
loadScene(0);