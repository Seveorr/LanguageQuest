// ============================================
// SECCIÓ 1: Emocions (emoji <-> paraula)
// ============================================
const emocions = [
    { e: "😀", w: "content" },
    { e: "😢", w: "trist" },
    { e: "😠", w: "enfadat" },
    { e: "😱", w: "espantat" },
    { e: "😴", w: "cansat" },
    { e: "🤢", w: "fastiguejat" },
    { e: "😲", w: "sorprès" },
    { e: "😍", w: "enamorat" },
    { e: "😳", w: "avergonyit" },
    { e: "😂", w: "content" },
    { e: "😭", w: "trist" },
    { e: "🥱", w: "avorrit" },
    { e: "😖", w: "nerviós" },
    { e: "😌", w: "tranquil" },
    { e: "🤗", w: "content" }
];

// ============================================
// SECCIÓ 2: Com se sent en cada situació?
// ============================================
const situacionsEmocio = [
    { q: "El teu millor amic t'ha regalat una joguina que et fa molta il·lusió. Com et sents?", correct: "😀", opts: ["😢", "😠", "😴", "😱"] },
    { q: "Se t'ha trencat el joc preferit i no es pot arreglar. Com et sents?", correct: "😢", opts: ["😀", "😂", "😍", "😌"] },
    { q: "Un company t'ha empès sense motiu i t'ha fet mal. Com et sents?", correct: "😠", opts: ["😀", "😴", "🥱", "😍"] },
    { q: "Estàs sol a casa i sents un soroll molt fort i inesperat. Com et sents?", correct: "😱", opts: ["😀", "😌", "🤗", "😂"] },
    { q: "Has jugat tot el dia al parc i ja és molt tard. Com et sents?", correct: "😴", opts: ["😠", "😱", "😍", "😳"] },
    { q: "Al plat hi ha menjar que fa molt mala olor i està podrit. Com et sents?", correct: "🤢", opts: ["😀", "😍", "😌", "🤗"] },
    { q: "Els teus pares t'han preparat una festa sorpresa que no t'esperaves. Com et sents?", correct: "😲", opts: ["😠", "😴", "🥱", "😢"] },
    { q: "T'han posat una nota molt bona en un examen que et costava molt. Com et sents?", correct: "😀", opts: ["😢", "😠", "🤢", "😱"] },
    { q: "Has de parlar davant de tota la classe i tothom et mira. Com et sents?", correct: "😖", opts: ["😌", "🤗", "😴", "😂"] },
    { q: "Estàs assegut al sofà de casa, sense res a fer, un dia de pluja tranquil. Com et sents?", correct: "😌", opts: ["😱", "😠", "🤢", "😲"] },
    { q: "Portes tota la tarda esperant i no passa res interessant. Com et sents?", correct: "🥱", opts: ["😱", "😍", "😲", "🤢"] },
    { q: "T'has equivocat davant de tothom i s'han rigut de tu. Com et sents?", correct: "😳", opts: ["😀", "😌", "🤗", "😍"] },
    { q: "El teu gos et ve a rebre movent la cua quan arribes a casa. Com et sents?", correct: "🤗", opts: ["😢", "🤢", "😠", "😖"] },
    { q: "T'han pres la teva joguina preferida sense demanar-t'ho. Com et sents?", correct: "😠", opts: ["😀", "😌", "😍", "🥱"] },
    { q: "Estàs de vacances a la platja amb la teva família, tot tranquil i assolellat. Com et sents?", correct: "😌", opts: ["😱", "😠", "🤢", "😳"] }
];

// ============================================
// SECCIÓ 3: Com reacciones? (situacions amb desenllaços)
// ============================================
const reaccions = [
    {
        q: "Un amic teu ha perdut la seva joguina preferida i està molt trist. Què fas?",
        opcions: [
            { text: "L'abraço i l'ajudo a buscar-la", desenllac: "El teu amic se sent acompanyat i, entre tots dos, trobeu la joguina! 🎉", correct: true },
            { text: "Me'n ric d'ell perquè l'ha perduda", desenllac: "El teu amic se sent encara més trist i s'allunya de tu. 😢", correct: false },
            { text: "L'ignoro i continuo jugant sol", desenllac: "El teu amic se sent sol i abandonat en un mal moment. 😔", correct: false }
        ]
    },
    {
        q: "A l'esbarjo, veus un company que sempre juga sol. Què fas?",
        opcions: [
            { text: "M'hi acosto i el convido a jugar amb nosaltres", desenllac: "El nen somriu i passeu una estona molt divertida junts! 😀", correct: true },
            { text: "El deixo sol, com sempre", desenllac: "El nen continua sentint-se sol i trist al pati. 😢", correct: false },
            { text: "Em burlo del fet que sempre estigui sol", desenllac: "El nen se sent encara pitjor i evita apropar-se als altres. 😔", correct: false }
        ]
    },
    {
        q: "El teu germà petit ha fet un dibuix i està molt content ensenyant-te'l. Què fas?",
        opcions: [
            { text: "Li dic que m'agrada molt i li faig preguntes sobre el dibuix", desenllac: "El teu germà se sent orgullós i content de compartir-ho amb tu! 😀", correct: true },
            { text: "No li faig cas i continuo mirant el mòbil", desenllac: "El teu germà se sent decebut perquè no l'has escoltat. 😢", correct: false },
            { text: "Li dic que el dibuix és lleig", desenllac: "El teu germà es posa molt trist i no vol tornar a dibuixar. 😔", correct: false }
        ]
    },
    {
        q: "Estàs a taula i el teu company de classe ha vessat el suc sense voler. Què fas?",
        opcions: [
            { text: "L'ajudo a netejar-ho i li dic que no passa res", desenllac: "El teu company es queda tranquil i us el passeu bé igualment. 😌", correct: true },
            { text: "Crido perquè tothom es giri a mirar-lo", desenllac: "El teu company se sent avergonyit davant de tota la classe. 😳", correct: false },
            { text: "Me'n vaig de la taula sense dir res", desenllac: "El teu company es queda sol intentant arreglar-ho. 😟", correct: false }
        ]
    },
    {
        q: "Un amic t'explica que està nerviós perquè demà té un examen difícil. Què fas?",
        opcions: [
            { text: "L'animo i li dic que segur que li anirà bé si estudia", desenllac: "El teu amic es queda més tranquil i estudia amb més confiança. 😌", correct: true },
            { text: "Li dic que segur que suspendrà", desenllac: "El teu amic se sent encara més nerviós i preocupat. 😖", correct: false },
            { text: "Canvio de tema com si no m'importés", desenllac: "El teu amic sent que no l'has escoltat de veritat. 😕", correct: false }
        ]
    },
    {
        q: "Veus que un nen nou a l'escola no coneix ningú i està assegut sol al menjador. Què fas?",
        opcions: [
            { text: "M'assec amb ell i li pregunto com es diu", desenllac: "El nen nou se sent benvingut i comença a fer amics! 🤗", correct: true },
            { text: "El miro de lluny però no faig res", desenllac: "El nen nou continua se sentint sol el primer dia. 😢", correct: false },
            { text: "Li dic als altres que no s'hi asseguin", desenllac: "El nen nou se sent encara més exclòs. 😔", correct: false }
        ]
    },
    {
        q: "El teu amic ha guanyat un premi molt important i està molt content. Què fas?",
        opcions: [
            { text: "El felicito i li dic que n'estic molt content per ell", desenllac: "El teu amic se sent recolzat i comparteix la seva alegria amb tu! 😀", correct: true },
            { text: "Li dic que jo ho hauria fet millor", desenllac: "El teu amic es queda decebut per la teva reacció. 😕", correct: false },
            { text: "L'ignoro perquè estic gelós", desenllac: "El teu amic se sent trist perquè no l'has felicitat. 😢", correct: false }
        ]
    },
    {
        q: "Un company de classe s'ha equivocat llegint en veu alta i alguns nens han rigut. Què fas?",
        opcions: [
            { text: "Li dic que no passa res, que a tots ens passa", desenllac: "El teu company se sent millor i continua llegint tranquil. 😌", correct: true },
            { text: "També me'n ric amb els altres", desenllac: "El teu company se sent molt avergonyit davant de tothom. 😳", correct: false },
            { text: "No dic res i miro cap a un altre costat", desenllac: "El teu company se sent sol en aquell moment difícil. 😟", correct: false }
        ]
    }
];