/* ============================================================
   REAL LIFE · data.js  (BASE DE DADES)
   ------------------------------------------------------------
   Aquí hi ha tot el contingut del mode Real Life. Per afegir un
   escenari nou NO cal tocar cap altre fitxer: només afegeix un
   objecte nou a l'array SCENARIOS (al final d'aquest fitxer).

   ESTRUCTURA D'UN ESCENARI
     SCENARIOS[] → chapters[] → beats[] → questions[]
     · chapter  = un lloc (carrer, cafeteria, farmàcia...) amb un escenari 3D
     · beat     = un personatge que apareix en un punt (spot) del lloc
     · question = una prova que fa aquest personatge (creada amb Q.xxx)

   ESCENARIS 3D (set) I PUNTS (spot) DISPONIBLES
     street   : neighbor, crossing, bakery, busstop, end
     cafe     : counter, table, window
     pharmacy : counter, shelf
     park     : path, bench, pond
     office   : reception, desk, meeting, kitchen

   TIPUS DE PROVES (les crees amb Q.xxx)
     Q.pic(emoji, paraula, [paraules incorrectes], enunciat?)      → Pictomatcher: pictograma → paraula
     Q.word(paraula, emoji, [emojis incorrectes], enunciat?)       → Pictomatcher: paraula → pictograma
     Q.build(frase, [emojis en ordre], [emojis sobrants], enunciat?) → Pictomatcher: construir una frase
     Q.emotion(clau, enunciat?)                                    → Moodfinder: quina emoció sent el personatge
     Q.react(situació, [[text, correcta?, desenllaç], ...], consell?) → Moodfinder: com reaccionar
     Q.say(frase del personatge, resposta correcta, [incorrectes], consell?) → Dialogues: tria la resposta
     Q.speak(frase, enunciat?)                                     → Talker: digues aquesta frase en veu alta
     Q.talk(enunciat, mínim de paraules?)                          → Talker: resposta oral oberta

   Les proves es barregen dins de cada capítol com tu vulguis; un
   escenari hauria de tenir entre 20 i 30 proves en total.
   ============================================================ */

/* ---------- Emocions (clau → paraula, emoji i cara 3D) ---------- */
const EMOTIONS = {
    content: { label: 'content', emoji: '😀', face: 'happy' },
    trist: { label: 'trist', emoji: '😢', face: 'sad' },
    enfadat: { label: 'enfadat', emoji: '😠', face: 'angry' },
    espantat: { label: 'espantat', emoji: '😱', face: 'scared' },
    cansat: { label: 'cansat', emoji: '😴', face: 'tired' },
    sorpres: { label: 'sorprès', emoji: '😲', face: 'surprised' },
    avergonyit: { label: 'avergonyit', emoji: '😳', face: 'shy' },
    nervios: { label: 'nerviós', emoji: '😖', face: 'worried' },
    tranquil: { label: 'tranquil', emoji: '😌', face: 'calm' },
    avorrit: { label: 'avorrit', emoji: '🥱', face: 'bored' },
    enamorat: { label: 'enamorat', emoji: '😍', face: 'love' }
};

/* ---------- Personatges ----------
   hairStyle: short | long | bun | ponytail | curly | bald | cap
   accessory: glasses | apron | whitecoat | tie | badge | scarf | null
   voice: to de veu de la síntesi (pitch 0.5–2, rate 0.7–1.2)          */
const CHARACTERS = {
    rosa: { name: 'Rosa', role: 'La veïna', skin: '#f0c6a0', hair: '#d4d4d4', hairStyle: 'bun', top: '#9b59b6', bottom: '#4f4a6a', accessory: 'glasses', height: 0.94, build: 1.08, sleeves: 'long', voice: { pitch: 1.25, rate: 0.92 } },
    octavi: { name: 'Octavi', role: 'El veï', skin: '#f4d7c0', hair: '#000000', hairStyle: 'short', top: '#0cdc09', bottom: '#34495e', voice: { pitch: 0.9, rate: 1 } },
    pau: { name: 'Pau', role: 'Un vianant', skin: '#d9a37a', hair: '#2b1d14', hairStyle: 'short', top: '#e67e22', bottom: '#34495e', voice: { pitch: 0.9, rate: 1 } },
    pep: { name: 'Pep', role: 'El forner', skin: '#f3cfb3', hair: '#7a4a21', hairStyle: 'short', top: '#ffffff', bottom: '#6b7280', accessory: 'apron', height: 1.02, build: 1.2, voice: { pitch: 0.8, rate: 0.95 } },
    nuria: { name: 'Núria', role: 'Cambrera', skin: '#e8b894', hair: '#3b2417', hairStyle: 'ponytail', top: '#e74c3c', bottom: '#2d2d35', accessory: 'apron', apron: '#2d2d35', voice: { pitch: 1.3, rate: 1 } },
    laia: { name: 'Laia', role: 'La teva amiga', skin: '#e9b896', hair: '#a0522d', hairStyle: 'long', top: '#16a085', bottom: '#3d5a80', voice: { pitch: 1.35, rate: 1 } },
    marta: { name: 'Marta', role: 'Farmacèutica', skin: '#f3d2b3', hair: '#5a3a22', hairStyle: 'bun', top: '#2e9d5b', bottom: '#2d3748', accessory: 'whitecoat', voice: { pitch: 1.2, rate: 0.98 } },
    joan: { name: 'Joan', role: 'Un client gran', skin: '#e8c4a0', hair: '#cccccc', hairStyle: 'bald', top: '#7f8c8d', bottom: '#5d4e37', accessory: 'glasses', height: 0.96, build: 1.1, sleeves: 'long', voice: { pitch: 0.75, rate: 0.85 } },
    carles: { name: 'Carles', role: 'Passejant el gos', skin: '#c68e63', hair: '#1b1209', hairStyle: 'curly', top: '#27ae60', bottom: '#2c3e50', voice: { pitch: 0.85, rate: 1.02 } },
    carme: { name: 'Carme', role: 'A la parada del bus', skin: '#8d5a3b', hair: '#111111', hairStyle: 'bun', top: '#c0392b', bottom: '#2d2d3a', accessory: 'scarf', scarf: '#f1c40f', voice: { pitch: 1.2, rate: 1 } },
    sofia: { name: 'Sofia', role: 'Recepcionista', skin: '#f0c6a0', hair: '#2b1d14', hairStyle: 'long', top: '#2563eb', bottom: '#1f2937', accessory: 'badge', voice: { pitch: 1.3, rate: 1 } },
    david: { name: 'David', role: 'El teu company', skin: '#e9b896', hair: '#4a2c17', hairStyle: 'short', top: '#3b82f6', bottom: '#374151', accessory: 'badge', voice: { pitch: 0.95, rate: 1 } },
    oriol: { name: 'Oriol', role: 'Company de la cuina', skin: '#d9a37a', hair: '#a0522d', hairStyle: 'curly', top: '#f59e0b', bottom: '#374151', voice: { pitch: 1.0, rate: 1.05 } },
    elena: { name: 'Elena', role: 'La cap d\'equip', skin: '#c68e63', hair: '#222222', hairStyle: 'long', top: '#7c3aed', bottom: '#1f2937', accessory: 'badge', voice: { pitch: 1.15, rate: 0.97 } }
};

/* ---------- Constructors de proves ---------- */
const Q = {
    pic: (emoji, word, wrongs, prompt) => ({
        type: 'match', dir: 'pic2word', show: emoji, sign: { emoji },
        prompt: prompt || 'Quina paraula correspon a aquest pictograma?',
        options: [word].concat(wrongs).map((t, i) => ({ text: t, correct: i === 0 }))
    }),
    word: (word, emoji, wrongs, prompt) => ({
        type: 'match', dir: 'word2pic', show: word, sign: { text: word },
        prompt: prompt || ('Quin pictograma representa «' + word + '»?'),
        options: [emoji].concat(wrongs).map((t, i) => ({ text: t, correct: i === 0 }))
    }),
    build: (sentence, order, extras, prompt) => ({
        type: 'build', sentence, order, extras: extras || [],
        prompt: prompt || 'Construeix aquesta amb els pictogrames que creguis més adequats, en ordre:'
    }),
    emotion: (key, prompt) => ({
        type: 'emotion', emotion: key,
        prompt: prompt || 'Com es deu sentir aquest personatge?'
    }),
    react: (situation, opts, tip) => ({
        type: 'choice', speaker: 'narrator', say: situation, tip,
        options: opts.map(o => ({ text: o[0], correct: o[1], outcome: o[2] }))
    }),
    say: (line, right, wrongs, tip) => ({
        type: 'choice', speaker: 'npc', say: line, tip,
        options: [right].concat(wrongs).map((t, i) => ({ text: t, correct: i === 0 }))
    }),
    speak: (phrase, prompt) => ({
        type: 'speak', phrase,
        prompt: prompt || 'Digues aquesta frase en veu alta:'
    }),
    talk: (prompt, minWords) => ({ type: 'talk', prompt, minWords: minWords || 8 })
};

/* ============================================================
   ESCENARIS
   ============================================================ */
const SCENARIOS = [

    /* ---------------------------------------------------------
       ESCENARI 1 · UN DIA AL BARRI  (26 proves)
       --------------------------------------------------------- */
    {
        id: 'barri',
        title: 'Un dia al barri',
        emoji: '🏙️',
        color: '#2196F3',
        difficulty: 1,
        description: 'Surt de casa i resol el teu dia: saluda la veïna, compra pa, esmorza a la cafeteria, passa per la farmàcia i acaba la tarda al parc.',
        chapters: [
            {
                id: 'carrer', title: 'Al carrer', subtitle: 'Bon dia, barri!', set: 'street',
                intro: 'Surts de casa amb ganes de començar el dia. El barri ja s\'està despertant.',
                beats: [
                    {
                        spot: 'neighbor', npc: 'rosa', questions: [
                            Q.say('Bon dia! Quin dia tant bonic que fa avui, oi?', 'Bon dia, Rosa! Sí, fa un dia preciós.', ['No et conec de res.', 'Ara no tinc temps per parlar.', 'Ahir va ploure molt.'], 'Saluda amb amabilitat i respon al que et diuen.'),
                            Q.emotion('trist', 'La Rosa t\'explica que ha perdut el seu gat. Com es deu sentir?'),
                            Q.react('La Rosa està molt trista pel seu gat. Què fas?', [
                                ['L\'abraço i m\'ofereixo a ajudar-la a buscar-lo.', true, 'La Rosa somriu una mica i t\'ho agraeix de tot cor.'],
                                ['Li dic que els gats sempre se\'n van.', false, 'La Rosa es posa encara més trista.'],
                                ['Miro el mòbil sense dir res.', false, 'La Rosa sent que no l\'escoltes.']
                            ], 'Quan algú està trist, escolta\'l i ofereix-li ajuda.'),
                            Q.pic('🐱', 'gat', ['gos', 'ocell', 'peix'], 'La Rosa t\'ensenya una foto del seu animal. Quina paraula és?')
                        ]
                    },
                    {
                        spot: 'neighbor', npc: 'octavi', questions: [
                            Q.say('Ei, quan de temps!', 'Quan de temps, Octavi! Quina alegria haver-te vist!', ['Ens hem vist abans?', 'Tinc molta pressa!', '*Fer com si no l\'haguessis vist*'], 'Saluda amablement al vell amic i intenta enrecordar-te d\'ell.'),
                            Q.emotion('content', 'L\'Octavi t\'explica que se sent molt content d\'haver-te vist. Com es deu sentir?'),
                            Q.say('Hauríem de quedar algun dia d\'aquests!', 'Es clar que sí, Octavi! Et va bé la setmana que vé?', ['Ostres, no em vé de gust.', 'No, gràcies.', 'T\'ho volia dir des de fa temps. Mai m\'has caigut bé, i t\'ho volia dir quan encara vivia a la ciutat. No ho vaig fer i vaig optar per venir a viure en aquest poble tranquil. Avui, en veure\'t a la llunyania, he intentat esquivar-te, però ha sigut inevitable.'], 'No diguis això a l\'Octavi, ja que li pots causar tristesa severa o inclús una depressió!'),
                            Q.speak('Vols anar a pendre algo a la cafeteria dimarts vinent?', 'Proposa algo a fer a l\'Octavi, digues la següent frase en veu alta:'),
                            Q.say('Perfecte, quedem per dimarts vinent!', 'Què t\'agradaria prendre?', ['Canvi de plans, no podré quedar d\'aquí a un mes vista!', 'D\'acord, però hi arribaré tard.', 'Ok.'], 'Respon de forma correcta al teu amic!'),
                            Q.pic('☕', 'cafè', ['refresc', 'te', 'suc'], 'L\'Octavi t\'ensenya el que li agradaria prendre. Quina paraula és?'),
                            Q.say('Pefecte, ens veiem dimarts!', 'Que vagi bé!', ['Adeu.', 'Ves-te\'n!', '*No dir res*'], 'Acomiada\'t amb educació i amabilitat del teu amic.')
                        ]
                    },
                    {
                        spot: 'crossing', npc: 'pau', questions: [
                            Q.say('Perdona, saps on és la farmàcia més propera?', 'Sí, segueix aquest carrer i gira a la dreta.', ['No ho sé i no m\'importa.', 'Pregunta-ho a un altre.', 'No parlo amb desconeguts.'], 'Si pots ajudar algú, fes-ho amb amabilitat.'),
                            Q.speak('Hem d\'esperar, el semàfor està en vermell.', 'En Pau vol creuar de pressa. Avisa\'l en veu alta:')
                        ]
                    },
                    {
                        spot: 'bakery', npc: 'pep', questions: [
                            Q.word('pa', '🍞', ['🥛', '🍎', '🧀'], 'Al forn, quin pictograma representa «pa»?'),
                            Q.say('Bon dia! Què desitja?', 'Una barra de pa, si us plau.', ['Doneu-me pa ja!', 'No sé què vull.', 'Això és massa car.'], 'Demana les coses amb «si us plau».')
                        ]
                    }
                ]
            },
            {
                id: 'cafeteria', title: 'A la cafeteria', subtitle: 'Un esmorzar tranquil', set: 'cafe',
                intro: 'Amb el pa a la bossa, entres a la cafeteria del barri. Fa una olor deliciosa.',
                beats: [
                    {
                        spot: 'counter', npc: 'nuria', questions: [
                            Q.say('Hola, benvingut! Què et posem?', 'Bon dia, voldria un cafè amb llet, si us plau.', ['Cafè.', 'El que sigui.', 'No ho sé, decideix tu.'], 'Fes frases completes i digues «si us plau».'),
                            Q.build('Vull un cafè amb llet', ['🙋', '☕', '🥛'], ['🍕', '🚗', '🏠']),
                            Q.pic('🥐', 'croissant', ['pizza', 'entrepà', 'pastís'], 'A la carta hi ha aquest pictograma. Quina paraula és?'),
                            Q.say('Són 3 euros amb 50. Pagues amb targeta o amb efectiu?', 'Amb targeta, si us plau.', ['Cobra\'m i calla.', 'No tinc res.', 'Això és massa car.'], 'Respon amb claredat i educació.'),
                            Q.speak('Gràcies, que tingueu un bon dia.', 'Acomiada\'t de la cambrera en veu alta:')
                        ]
                    },
                    {
                        spot: 'table', npc: 'laia', questions: [
                            Q.emotion('content', 'La Laia arriba i et diu que li han donat la feina que volia. Com es sent?'),
                            Q.say('He aconseguit la feina! Estic tan contenta!', 'Felicitats, Laia! Me n\'alegro molt per tu.', ['I a mi què?', 'Segur que no et durarà.', 'Ja ho sabia, no t\'ho creguis tant.'], 'Alegra\'t amb les bones notícies dels amics.')
                        ]
                    }
                ]
            },
            {
                id: 'farmacia', title: 'A la farmàcia', subtitle: 'Cuidar-se també és important', set: 'pharmacy',
                intro: 'Des d\'ahir tens una mica de mal de coll. Aprofites per passar per la farmàcia.',
                beats: [
                    {
                        spot: 'counter', npc: 'marta', questions: [
                            Q.say('Bon dia! En què et puc ajudar?', 'Bon dia, em fa mal el coll i tinc una mica de tos.', ['Res.', 'Ho hauries de saber tu, ets la farmacèutica.', 'Dona\'m alguna cosa, ràpid.'], 'Explica clarament què et passa.'),
                            Q.pic('🌡️', 'termòmetre', ['rellotge', 'cullera', 'llanterna'], 'Al pòster hi ha aquest pictograma. Quina paraula és?'),
                            Q.react('La Marta t\'explica com prendre el xarop, però no ho has entès del tot. Què fas?', [
                                ['Li demano que ho repeteixi més a poc a poc.', true, 'La Marta t\'ho torna a explicar amb paciència i ara ho entens perfectament.'],
                                ['Dic que sí, encara que no ho hagi entès.', false, 'Més tard no recordes com s\'havia de prendre.'],
                                ['Me\'n vaig sense dir res.', false, 'Et quedes amb el dubte i sense saber com usar-lo.']
                            ], 'Si no entens alguna cosa, demana que te la repeteixin.'),
                            Q.speak('Pots repetir-ho, si us plau? No ho he entès bé.', 'Demana-li que ho repeteixi, en veu alta:')
                        ]
                    },
                    {
                        spot: 'shelf', npc: 'joan', questions: [
                            Q.emotion('nervios', 'En Joan no troba la seva recepta i mira a tot arreu. Com es deu sentir?'),
                            Q.say('Disculpa, jove, m\'ajudes a llegir aquesta caixa? No hi veig bé.', 'És clar, Joan! Aquesta caixa diu «dues pastilles al dia».', ['Llegeix-ho tu.', 'No tinc temps.', 'Jo tampoc hi veig.'], 'Ajudar els altres també és una forma de comunicar-se.')
                        ]
                    }
                ]
            },
            {
                id: 'parc', title: 'Una tarda al parc', subtitle: 'Un final de dia perfecte', set: 'park',
                intro: 'Ja és la tarda. Has quedat amb la Laia al parc, sota els arbres.',
                beats: [
                    {
                        spot: 'path', npc: 'carles', questions: [
                            Q.say('Hola! Aquest és el meu gos, es diu Bruc. T\'agraden els gossos?', 'Sí, m\'agraden molt! És molt simpàtic.', ['No, fan fàstic.', 'Aparta\'l de mi!', 'No m\'importa.'], 'Respon amb educació encara que no t\'agradin gaire.'),
                            Q.word('gos', '🐶', ['🐱', '🐟', '🐦'], 'El Bruc és molt actiu! Quin pictograma representa «gos»?'),
                            Q.emotion('sorpres', 'El Bruc ha saltat de sobte i en Carles s\'ha quedat parat. Com es sent?')
                        ]
                    },
                    {
                        spot: 'bench', npc: 'laia', questions: [
                            Q.talk('La Laia vol saber coses de tu. Presenta\'t: digues el teu nom i què t\'agrada fer en el temps lliure.', 8),
                            Q.react('Veus una ampolla buida a terra del parc. Què fas?', [
                                ['La recullo i la llenço a la paperera.', true, 'El parc queda més net i un nen et somriu.'],
                                ['La deixo allà, no és meva.', false, 'L\'ampolla continua embrutant el parc.'],
                                ['La llenço a l\'estany.', false, 'Els ànecs s\'espanten i l\'estany s\'embruta.']
                            ], 'Cuidar l\'entorn és cosa de tots.')
                        ]
                    }
                ]
            }
        ]
    },

    /* ---------------------------------------------------------
       ESCENARI 2 · EL PRIMER DIA DE FEINA  (24 proves)
       --------------------------------------------------------- */
    {
        id: 'feina',
        title: 'El primer dia de feina',
        emoji: '💼',
        color: '#7c3aed',
        difficulty: 2,
        description: 'Agafa l\'autobús, arriba a l\'oficina, coneix els teus companys i supera la primera reunió amb l\'equip.',
        chapters: [
            {
                id: 'arribada', title: 'Cap a l\'oficina', subtitle: 'Avui comença una nova etapa', set: 'street',
                intro: 'Són les vuit del matí. Avui comences a la teva nova feina i els nervis es noten.',
                beats: [
                    {
                        spot: 'busstop', npc: 'carme', questions: [
                            Q.say('Bon dia! Tu també vas a l\'oficina del centre?', 'Bon dia! Sí, avui és el meu primer dia de feina.', ['No et pregunto res.', 'Això no és cosa teva.', 'No et conec.'], 'Respon amb amabilitat quan algú et saluda.'),
                            Q.emotion('nervios', 'La Carme mira el rellotge sense parar i es mossega les ungles. Com es deu sentir?'),
                            Q.word('autobús', '🚌', ['🚲', '✈️', '🚂'], 'Arriba el teu transport. Quin pictograma representa «autobús»?'),
                            Q.react('L\'autobús arriba i només queda un seient, al costat d\'una senyora gran amb bosses. Què fas?', [
                                ['Li ofereixo el seient i em quedo dempeus.', true, 'La senyora t\'ho agraeix amb un somriure enorme.'],
                                ['Hi seu tan ràpid com puc.', false, 'La senyora et mira decebuda.'],
                                ['Em poso els auriculars i faig veure que no la veig.', false, 'La senyora s\'ha de quedar dempeus.']
                            ], 'Pensar en els altres també és comunicar.'),
                            Q.speak('Bon dia, em dic Àlex. Encantat de conèixer-te.', 'Presenta\'t a la Carme en veu alta:')
                        ]
                    }
                ]
            },
            {
                id: 'recepcio', title: 'A la recepció', subtitle: 'Benvingut a Ona Digital', set: 'office',
                intro: 'Entres a l\'edifici. Davant teu, una gran recepció i un logotip lluminós.',
                beats: [
                    {
                        spot: 'reception', npc: 'sofia', questions: [
                            Q.emotion('sorpres', 'La Sofia no t\'esperava tan d\'hora i ha fet un bot a la cadira. Com es sent?'),
                            Q.say('Bon dia, benvingut a Ona Digital. Té cita amb algú?', 'Bon dia, sóc l\'Àlex i avui és el meu primer dia.', ['Vull el cafè.', 'No sé què fer aquí.', 'Això no t\'importa.'], 'Presenta\'t i explica per què ets allà.'),
                            Q.pic('🔑', 'clau', ['porta', 'mòbil', 'ordinador'], 'La Sofia t\'ensenya aquest pictograma. Quina paraula és?'),
                            Q.react('La Sofia et dona una targeta d\'accés, però no saps on s\'utilitza. Què fas?', [
                                ['Li pregunto amablement on l\'he de fer servir.', true, 'Ella t\'ho explica i entres a l\'oficina sense problemes.'],
                                ['La deixo sobre la taula i me\'n vaig.', false, 'No pots obrir cap porta i et quedes bloquejat.'],
                                ['La llenço, segur que no serveix.', false, 'Sense targeta no pots entrar enlloc.']
                            ], 'Preguntar els dubtes és de persones valentes.'),
                            Q.build('Vull parlar amb la cap', ['🙋', '🗣️', '👩'], ['🍕', '🚗', '🏠'])
                        ]
                    }
                ]
            },
            {
                id: 'oficina', title: 'La teva taula', subtitle: 'Coneixent l\'equip', set: 'office',
                intro: 'Ja pots passar. L\'oficina és gran i lluminosa, plena de gent concentrada.',
                beats: [
                    {
                        spot: 'desk', npc: 'david', questions: [
                            Q.say('Hola! Tu has de ser el nou. Jo sóc en David.', 'Hola, David! Encantat, jo sóc l\'Àlex.', ['Hola.', 'Ja ho sé, no cal que m\'ho diguis.', 'No m\'interessa.'], 'Presenta\'t amb una frase completa.'),
                            Q.emotion('content', 'En David somriu i t\'ensenya la teva taula, amb una planta de benvinguda. Com es sent?'),
                            Q.word('ordinador', '💻', ['📱', '📺', '📚'], 'Aquest és el teu lloc de treball. Quin pictograma representa «ordinador»?'),
                            Q.say('Si tens qualsevol dubte, pregunta\'m, eh!', 'Gràcies, David. Segur que et faré alguna pregunta.', ['No necessito ningú.', 'Millor no et molesto mai.', 'Això ja ho sé tot.'], 'Acceptar l\'ajuda dels companys és de bons professionals.')
                        ]
                    },
                    {
                        spot: 'kitchen', npc: 'oriol', questions: [
                            Q.say('Vols un cafè? Acabo de fer-lo.', 'Sí, gràcies, molt amable.', ['No, el teu cafè deu ser dolent.', 'Dona\'m-ne i calla.', 'No.'], 'Accepta o rebutja amb educació.'),
                            Q.pic('☕', 'cafè', ['te', 'suc', 'aigua'], 'Quina paraula correspon a aquest pictograma?'),
                            Q.speak('Moltes gràcies, el cafè està boníssim.', 'Agraeix-li el cafè a l\'Oriol en veu alta:')
                        ]
                    }
                ]
            },
            {
                id: 'reunio', title: 'La primera reunió', subtitle: 'Hora de brillar', set: 'office',
                intro: 'És l\'hora de la reunió d\'equip. Tothom t\'espera a la sala de vidre.',
                beats: [
                    {
                        spot: 'meeting', npc: 'elena', questions: [
                            Q.say('Benvingut a l\'equip! Explica\'ns una mica qui ets.', 'Gràcies per la benvinguda. Sóc l\'Àlex i m\'agrada treballar en equip.', ['No tinc res a dir.', 'Millor que ho expliqui un altre.', 'Això ja ho sabeu.'], 'Presenta\'t amb seguretat i amabilitat.'),
                            Q.talk('Presenta\'t a l\'equip: explica qui ets i per què t\'agrada aquesta feina.', 10),
                            Q.emotion('avergonyit', 'L\'Elena s\'ha equivocat de nom davant de tothom i li ha sortit el color a la cara. Com es sent?'),
                            Q.react('Una companya s\'ha equivocat en una dada i alguns riuen. Què fas?', [
                                ['Li dic que a tothom li passa i l\'ajudo a corregir-ho.', true, 'Ella t\'ho agraeix i la reunió continua amb bon ambient.'],
                                ['Em ric amb els altres.', false, 'Ella se sent humiliada i es queda en silenci.'],
                                ['Faig veure que no he vist res.', false, 'Ella es queda sola davant de l\'error.']
                            ], 'Un bon company ajuda i no es burla.'),
                            Q.word('reunió', '👥', ['🏃', '🍽️', '😴'], 'Quin pictograma representa «reunió»?'),
                            Q.say('Alguna pregunta abans d\'acabar la reunió?', 'Sí, a quina hora ens veiem demà?', ['No, i vaig tard.', 'Cap, i calla ja.', 'Sí, quan s\'acaba això?'], 'Fer preguntes demostra interès.'),
                            Q.speak('Gràcies a tots, ens veiem demà.', 'Acomiada\'t de l\'equip en veu alta:')
                        ]
                    }
                ]
            }
        ]
    }

    /* Per afegir un escenari nou, copia un dels blocs anteriors, canvia-li
       l'id, el títol i els capítols, i afegeix-lo aquí (separat per una coma). */
];

/* ---------- Validació (avisa per consola si hi ha errors al contingut) ---------- */
(function validateScenarios() {
    const SETS = { street: ['neighbor', 'crossing', 'bakery', 'busstop', 'end'], cafe: ['counter', 'table', 'window'], pharmacy: ['counter', 'shelf'], park: ['path', 'bench', 'pond'], office: ['reception', 'desk', 'meeting', 'kitchen'] };
    SCENARIOS.forEach(sc => {
        let total = 0;
        sc.chapters.forEach(ch => {
            if (!SETS[ch.set]) console.warn('[data] Escenari 3D desconegut a', sc.id, ch.id, ':', ch.set);
            ch.beats.forEach(b => {
                if (SETS[ch.set] && SETS[ch.set].indexOf(b.spot) < 0) console.warn('[data] Spot desconegut:', ch.set, b.spot);
                if (!CHARACTERS[b.npc]) console.warn('[data] Personatge desconegut:', b.npc);
                b.questions.forEach(q => {
                    total++;
                    if (q.options && !q.options.some(o => o.correct)) console.warn('[data] Pregunta sense resposta correcta a', sc.id, ch.id);
                    if (q.type === 'emotion' && !EMOTIONS[q.emotion]) console.warn('[data] Emoció desconeguda:', q.emotion);
                });
            });
        });
        sc.totalQuestions = total;
        if (total < 20 || total > 30) console.warn('[data] L\'escenari "' + sc.id + '" té ' + total + ' proves (recomanat: entre 20 i 30).');
    });
})();