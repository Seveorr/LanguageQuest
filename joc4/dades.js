// ============================================
// DADES DEL JOC "TALKER"
// ============================================
// A cada partida es trien a l'atzar: 10 paraules de la secció 1,
// 10 preguntes de la secció 2, i 2 preguntes obertes de la secció 3.
// Per afegir-ne més, només cal afegir elements nous a cada llista
// seguint exactament el mateix format.

// ============================================
// SECCIÓ 1: Pronuncia la paraula (banc de paraules)
// ============================================
const paraulesPronunciacio = [
    { word: "casa" },
    { word: "gos" },
    { word: "taula" },
    { word: "aigua" },
    { word: "llibre" },
    { word: "escola" },
    { word: "cotxe" },
    { word: "platja" },
    { word: "muntanya" },
    { word: "família" },
    { word: "amic" },
    { word: "menjar" },
    { word: "carrer" },
    { word: "finestra" },
    { word: "cadira" },
    { word: "porta" },
    { word: "ordinador" },
    { word: "telèfon" },
    { word: "jardí" },
    { word: "cambra" }
];

// ============================================
// SECCIÓ 2: Tria una resposta i digues-la en veu alta
// ============================================
// Cada pregunta té 5 opcions. Només UNA és "correct: true"
// (la resposta adequada); la resta són respostes poc adequades.
const preguntesOrals = [
    {
        question: "Com estàs avui?",
        options: [
            { text: "Molt bé, gràcies. I tu?", correct: true },
            { text: "Calla.", correct: false },
            { text: "No m'importa.", correct: false },
            { text: "Per què ho preguntes?", correct: false },
            { text: "Ves-te'n.", correct: false }
        ]
    },
    {
        question: "Com et dius?",
        options: [
            { text: "Em dic Marc.", correct: true },
            { text: "Què vols saber?", correct: false },
            { text: "Això no és de la teva incumbència.", correct: false },
            { text: "Tant se val.", correct: false },
            { text: "No ho sé.", correct: false }
        ]
    },
    {
        question: "Quin dia és avui?",
        options: [
            { text: "Avui és dilluns.", correct: true },
            { text: "Que et sembla a tu?", correct: false },
            { text: "No en tinc ni idea i no m'importa.", correct: false },
            { text: "Pregunta-ho a algú altre.", correct: false },
            { text: "Calla ja.", correct: false }
        ]
    },
    {
        question: "Et puc ajudar en alguna cosa?",
        options: [
            { text: "Sí, si us plau, busco els lavabos.", correct: true },
            { text: "No, marxa.", correct: false },
            { text: "Deixa'm en pau.", correct: false },
            { text: "Per què hauries de fer-ho?", correct: false },
            { text: "Calla.", correct: false }
        ]
    },
    {
        question: "T'agrada la música?",
        options: [
            { text: "Sí, m'agrada molt escoltar música.", correct: true },
            { text: "Calla.", correct: false },
            { text: "Deixa'm.", correct: false },
            { text: "Per què t'importa?", correct: false },
            { text: "No contestaré.", correct: false }
        ]
    },
    {
        question: "On vius?",
        options: [
            { text: "Visc a Barcelona.", correct: true },
            { text: "Per què vols saber-ho?", correct: false },
            { text: "No t'ho diré mai.", correct: false },
            { text: "Calla.", correct: false },
            { text: "Ves-te'n.", correct: false }
        ]
    },
    {
        question: "Què has fet aquest cap de setmana?",
        options: [
            { text: "He anat al cinema amb un amic.", correct: true },
            { text: "Res del teu interès.", correct: false },
            { text: "Calla.", correct: false },
            { text: "Per què ho preguntes tant?", correct: false },
            { text: "No penso explicar-t'ho.", correct: false }
        ]
    },
    {
        question: "Vols venir a la festa d'aniversari?",
        options: [
            { text: "Sí, m'encantaria venir, gràcies per convidar-me.", correct: true },
            { text: "No m'agraden les festes ni tu.", correct: false },
            { text: "Calla.", correct: false },
            { text: "Per què hauria de voler-hi anar?", correct: false },
            { text: "Deixa'm en pau.", correct: false }
        ]
    },
    {
        question: "Necessites ajuda amb els deures?",
        options: [
            { text: "Sí, si us plau, no entenc aquest exercici.", correct: true },
            { text: "No, i calla.", correct: false },
            { text: "Per què t'importa?", correct: false },
            { text: "Deixa'm sol.", correct: false },
            { text: "No en necessito de ningú.", correct: false }
        ]
    },
    {
        question: "T'ha agradat la pel·lícula?",
        options: [
            { text: "Sí, m'ha agradat molt, era molt divertida.", correct: true },
            { text: "Calla, no me'n parlis.", correct: false },
            { text: "No m'importa la teva opinió.", correct: false },
            { text: "Per què ho preguntes?", correct: false },
            { text: "Marxa.", correct: false }
        ]
    },
    {
        question: "Tens gana?",
        options: [
            { text: "Sí, tinc una mica de gana.", correct: true },
            { text: "Calla.", correct: false },
            { text: "Per què m'ho preguntes?", correct: false },
            { text: "No és de la teva incumbència.", correct: false },
            { text: "Deixa'm en pau.", correct: false }
        ]
    },
    {
        question: "Ens veiem demà a la mateixa hora?",
        options: [
            { text: "Sí, perfecte, ens veiem demà.", correct: true },
            { text: "Tant se val.", correct: false },
            { text: "Calla.", correct: false },
            { text: "No vull veure't més.", correct: false },
            { text: "Per què hauria de dir-t'ho?", correct: false }
        ]
    }
];

// ============================================
// SECCIÓ 3: Desenvolupa una resposta oral
// ============================================
const preguntesObertes = [
    { prompt: "Presenta't breument: digues el teu nom, la teva edat i una cosa que t'agradi fer." },
    { prompt: "Imagina que estàs en una entrevista de feina. Explica per què t'agradaria treballar en aquesta empresa." },
    { prompt: "Explica com ha anat el teu dia avui." },
    { prompt: "Descriu breument la teva família." },
    { prompt: "Explica quin és el teu passatemps preferit i per què t'agrada." },
    { prompt: "Imagina que acabes de conèixer algú nou. Presenta't i explica alguna cosa sobre tu." }
];