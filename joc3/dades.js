// ============================================
// DIÀLEGS DEL JOC 3 - PRACTICA CONVERSES
// ============================================
//
// Per afegir una escena nova:
//   1. Afegeix una nova clau dins l'objecte "scenes" (per exemple "farmacia")
//      seguint exactament el mateix format que les altres.
//   2. Afegeix aquesta mateixa clau a l'array "sceneOrder", a la posició
//      on vulguis que aparegui (el nombre de cercles del lateral s'adapta
//      automàticament a la quantitat d'escenes).
//
// Cada escena és un arbre de diàleg ("tree"). Cada node té:
//   - npc: el que diu el personatge (mai hi va el consell barrejat)
//   - character / avatar: qui parla
//   - tip (opcional): un consell que es mostra en un requadre a part
//   - options: les respostes que pot triar l'usuari. Cada opció té:
//       - text: el que diu l'usuari
//       - correct: true si manté la conversa pel bon camí, false si la fa fallar
//       - next: l'identificador del següent node
//   - end (només als nodes finals): { success, emoji, title, text }
//     success = true si el diàleg s'ha completat bé, false si ha fallat

const scenes = {

    cafeteria: {
        title: "La cafeteria",
        tree: {
            start: {
                npc: "Bon dia! Què li poso?",
                character: "CAMBRER", avatar: "🧑‍🍳",
                options: [
                    { text: "Bon dia, voldria un cafè amb llet, si us plau.", correct: true, next: "size" },
                    { text: "Cafè.", correct: true, next: "informal" },
                    { text: "No ho sé, el que sigui.", correct: false, next: "fail_confus" }
                ]
            },
            informal: {
                npc: "Marxant! El vol gran o petit?",
                character: "CAMBRER", avatar: "🧑‍🍳",
                tip: "💡 Sona més educat fer frases completes i dir 'si us plau', com 'Voldria un cafè, si us plau'.",
                options: [
                    { text: "Gran, si us plau.", correct: true, next: "pay" },
                    { text: "Petit, si us plau.", correct: true, next: "pay" }
                ]
            },
            size: {
                npc: "Perfecte. El vol gran o petit?",
                character: "CAMBRER", avatar: "🧑‍🍳",
                options: [
                    { text: "Gran, si us plau.", correct: true, next: "pay" },
                    { text: "Petit, si us plau.", correct: true, next: "pay" }
                ]
            },
            pay: {
                npc: "Aquí té. Són 2 euros amb 50.",
                character: "CAMBRER", avatar: "🧑‍🍳",
                options: [
                    { text: "Aquí té, moltes gràcies.", correct: true, next: "end_success" },
                    { text: "Puc pagar amb targeta?", correct: true, next: "card" },
                    { text: "No tinc diners.", correct: false, next: "fail_diners" }
                ]
            },
            card: {
                npc: "Per descomptat! Aquí té el datàfon.",
                character: "CAMBRER", avatar: "🧑‍🍳",
                options: [
                    { text: "Gràcies, que tingui un bon dia.", correct: true, next: "end_success" }
                ]
            },
            end_success: {
                npc: "Aquí té el seu cafè! Que el gaudeixi.",
                character: "CAMBRER", avatar: "🧑‍🍳",
                end: { success: true, emoji: "☕", title: "Conversa completada!", text: "Has demanat el teu cafè amb èxit fent servir frases completes i educades. Molt bé!" }
            },
            fail_confus: {
                npc: "Uhm... no l'he entès bé, disculpi.",
                character: "CAMBRER", avatar: "🧑‍🍳",
                end: { success: false, emoji: "😕", title: "Diàleg no completat", text: "El cambrer no ha entès bé la teva comanda. Torna-ho a provar dient clarament què vols." }
            },
            fail_diners: {
                npc: "Ah, llavors no podré donar-li el cafè, ho sento.",
                character: "CAMBRER", avatar: "🧑‍🍳",
                end: { success: false, emoji: "😅", title: "Diàleg no completat", text: "Sense poder pagar, no has pogut completar la comanda." }
            }
        }
    },

    tren: {
        title: "Bitllet de tren",
        tree: {
            start: {
                npc: "Bona tarda! Em podria donar el seu bitllet, si us plau?",
                character: "REVISOR", avatar: "🤵",
                options: [
                    { text: "Sí, aquí el té.", correct: true, next: "validació" },
                    { text: "Ok.", correct: true, next: "informal" },
                    { text: "No tinc bitllet.", correct: true, next: "comprar" }
                ]
            },
            validació: {
                npc: "Ui, el seu bitllet està caducat. N'ha de comprar un de nou.",
                character: "REVISOR", avatar: "🤵",
                options: [
                    { text: "D'acord, voldria un bitllet senzill.", correct: true, next: "pagar" },
                    { text: "No vull comprar cap bitllet.", correct: false, next: "fail_enfadat" }
                ]
            },
            informal: {
                npc: "Vaja! El seu bitllet està caducat. N'haurà de comprar un de nou.",
                character: "REVISOR", avatar: "🤵",
                tip: "💡 Sona més educat fer frases completes, en comptes de respostes curtes.",
                options: [
                    { text: "D'acord, voldria un bitllet senzill.", correct: true, next: "pagar" },
                    { text: "No vull comprar cap bitllet.", correct: false, next: "fail_enfadat" }
                ]
            },
            comprar: {
                npc: "Perfecte, li puc vendre un bitllet senzill o recarregr-li una tarjeta T-Mobilitat. Què prefereix?",
                character: "REVISOR", avatar: "🤵",
                options: [
                    { text: "D'acord, vull un bitllet senzill, si us plau.", correct: true, next: "pagar" },
                    { text: "No vull comprar cap bitllet!", correct: false, next: "fail_enfadat" },
                    { text: "Vull recarregar la meva tarjeta T-Mobilitat.", correct: true, next: "pagar" }
                ]
            },
            pagar: {
                npc: "Aquí té. Són 2 euros amb 90 cèntims.",
                character: "REVISOR", avatar: "🤵",
                options: [
                    { text: "Aquí té, moltes gràcies.", correct: true, next: "end_success" },
                    { text: "Puc pagar amb targeta?", correct: true, next: "card" },
                    { text: "No tinc diners.", correct: false, next: "fail_diners" }
                ]
            },
            card: {
                npc: "Per descomptat! Aquí té el datàfon.",
                character: "REVISOR", avatar: "🤵",
                options: [
                    { text: "Gràcies, que tingui un bon dia.", correct: true, next: "end_success" }
                ]
            },
            end_success: {
                npc: "Moltes gracies! Que tingui un bon viatge!",
                character: "REVISOR", avatar: "🤵",
                end: { success: true, emoji: "🎫", title: "Conversa completada!", text: "Has comprat un bitllet amb èxit fent servir frases completes i educades. Molt bé!" }
            },
            fail_enfadat: {
                npc: "Doncs baixi del tren a la propera parada i vagi a comprar un bitllet a la taquilla!!",
                character: "REVISOR", avatar: "😡",
                end: { success: false, emoji: "😕", title: "Diàleg no completat", text: "El revisor s'ha enfadat degut al teu comportament inadequat." }
            },
            fail_diners: {
                npc: "Ah, llavors haurà de baixar del tren a la propera parada.",
                character: "REVISOR", avatar: "🤵",
                end: { success: false, emoji: "😅", title: "Diàleg no completat", text: "Sense poder pagar, no has pogut continuar el viatge." }
            }
        }
    },

    calle: {
        title: "Demanar indicacions",
        tree: {
            start: {
                npc: "Hola! Et puc ajudar en alguna cosa?",
                character: "VEÍ", avatar: "🧑",
                options: [
                    { text: "Hola, disculpa, saps on és la biblioteca?", correct: true, next: "directions" },
                    { text: "Biblioteca! On?", correct: true, next: "informal" },
                    { text: "No cal, ja me n'aniré.", correct: false, next: "fail_marxa" }
                ]
            },
            informal: {
                npc: "Ah, la biblioteca! És per allà.",
                character: "VEÍ", avatar: "🧑",
                tip: "💡 Sona més educat preguntar amb una frase completa, com 'Saps on és la biblioteca?'",
                options: [
                    { text: "D'acord, gràcies. On exactament?", correct: true, next: "directions" }
                ]
            },
            directions: {
                npc: "Sí, segueix tot recte i gira a la dreta al segon carrer. Està al costat del parc.",
                character: "VEÍ", avatar: "🧑",
                options: [
                    { text: "Moltes gràcies, molt amable!", correct: true, next: "end_success" },
                    { text: "Està molt lluny d'aquí?", correct: true, next: "distance" },
                    { text: "No t'he entès res.", correct: false, next: "fail_entendre" }
                ]
            },
            distance: {
                npc: "No, no està lluny. Són només cinc minuts caminant recte.",
                character: "VEÍ", avatar: "🧑",
                options: [
                    { text: "Perfecte, moltes gràcies per l'ajuda.", correct: true, next: "end_success" }
                ]
            },
            end_success: {
                npc: "De res! Que tinguis un molt bon dia!",
                character: "VEÍ", avatar: "🧑",
                end: { success: true, emoji: "🧭", title: "Indicacions aconseguides!", text: "Has demanat i entès les indicacions correctament. Genial!" }
            },
            fail_marxa: {
                npc: "Ah, d'acord, com vulguis!",
                character: "VEÍ", avatar: "🧑",
                end: { success: false, emoji: "👋", title: "Diàleg no completat", text: "Has marxat sense demanar les indicacions que necessitaves." }
            },
            fail_entendre: {
                npc: "Oh, ho sento, no t'he sabut explicar bé.",
                character: "VEÍ", avatar: "🧑",
                end: { success: false, emoji: "😕", title: "Diàleg no completat", text: "No has entès les indicacions. La propera vegada, demana que t'ho repeteixin a poc a poc." }
            }
        }
    },

    tienda: {
        title: "De compres",
        tree: {
            start: {
                npc: "Hola! Benvingut a la botiga, busques alguna cosa en especial?",
                character: "DEPENDENTA", avatar: "🧑‍💼",
                options: [
                    { text: "Hola, estic buscant una samarreta de talla mitjana.", correct: true, next: "color" },
                    { text: "Només estic mirant, gràcies.", correct: true, next: "browsing" },
                    { text: "Deixa'm en pau.", correct: false, next: "fail_groller" }
                ]
            },
            browsing: {
                npc: "Per descomptat! Si necessites ajuda, aquí estaré.",
                character: "DEPENDENTA", avatar: "🧑‍💼",
                options: [
                    { text: "De fet, sí, busco una samarreta mitjana.", correct: true, next: "color" }
                ]
            },
            color: {
                npc: "En tenim diverses. Quin color prefereixes?",
                character: "DEPENDENTA", avatar: "🧑‍💼",
                options: [
                    { text: "Blau, si us plau.", correct: true, next: "tryon" },
                    { text: "Quina em recomanes?", correct: true, next: "recommend" }
                ]
            },
            recommend: {
                npc: "El verd està molt de moda aquesta temporada.",
                character: "DEPENDENTA", avatar: "🧑‍💼",
                options: [
                    { text: "Val, provaré la verda, gràcies.", correct: true, next: "tryon" }
                ]
            },
            tryon: {
                npc: "Aquí tens. Els emprovadors són al fons a l'esquerra.",
                character: "DEPENDENTA", avatar: "🧑‍💼",
                options: [
                    { text: "Gràcies, me l'aniré a emprovar.", correct: true, next: "end_success" },
                    { text: "No sé on és.", correct: false, next: "fail_perdut" }
                ]
            },
            end_success: {
                npc: "Què tal et queda? Te l'emportes?",
                character: "DEPENDENTA", avatar: "🧑‍💼",
                end: { success: true, emoji: "🛍️", title: "Compra completada!", text: "Has demanat ajuda i triat un producte amb frases clares. Molt ben fet!" }
            },
            fail_groller: {
                npc: "Ah... d'acord, perdona.",
                character: "DEPENDENTA", avatar: "🧑‍💼",
                end: { success: false, emoji: "😳", title: "Diàleg no completat", text: "Respondre de males maneres no ajuda a comunicar-te bé amb els altres." }
            },
            fail_perdut: {
                npc: "Vaig amb tu, no et preocupis... però la propera vegada intenta preguntar per on és.",
                character: "DEPENDENTA", avatar: "🧑‍💼",
                end: { success: false, emoji: "😕", title: "Diàleg no completat", text: "No has aconseguit trobar l'emprovador. Torna-ho a provar demanant més informació." }
            }
        }
    },

    presentacion: {
        title: "Presentar-se",
        tree: {
            start: {
                npc: "Hola! Sóc Marta, encantada. Com et dius?",
                character: "MARTA", avatar: "👩",
                options: [
                    { text: "Hola Marta, encantat/da, em dic Alex.", correct: true, next: "from" },
                    { text: "Alex.", correct: true, next: "informal" },
                    { text: "No t'ho diré.", correct: false, next: "fail_desconfiat" }
                ]
            },
            informal: {
                npc: "Encantada, Alex! D'on ets?",
                character: "MARTA", avatar: "👩",
                tip: "💡 Una manera més completa de respondre és 'Em dic Alex, encantat/da'.",
                options: [
                    { text: "Sóc d'Espanya, i tu?", correct: true, next: "from_done" }
                ]
            },
            from: {
                npc: "Encantada, Alex! D'on ets?",
                character: "MARTA", avatar: "👩",
                options: [
                    { text: "Sóc d'Espanya, i tu?", correct: true, next: "from_done" }
                ]
            },
            from_done: {
                npc: "Jo sóc d'Argentina. A què et dediques?",
                character: "MARTA", avatar: "👩",
                options: [
                    { text: "Estic estudiant idiomes, m'encanta aprendre.", correct: true, next: "end_success" },
                    { text: "Treballo, però també estudio a les tardes.", correct: true, next: "end_success" },
                    { text: "Això no t'importa.", correct: false, next: "fail_borde" }
                ]
            },
            end_success: {
                npc: "Que interessant! Ha estat un plaer parlar amb tu.",
                character: "MARTA", avatar: "👩",
                end: { success: true, emoji: "🤝", title: "Presentació completada!", text: "Has mantingut una conversa de presentació natural i educada. Excel·lent!" }
            },
            fail_desconfiat: {
                npc: "Ah, d'acord... perdona la pregunta.",
                character: "MARTA", avatar: "👩",
                end: { success: false, emoji: "😕", title: "Diàleg no completat", text: "No has volgut presentar-te i la conversa s'ha acabat aquí." }
            },
            fail_borde: {
                npc: "Oh, val, perdona.",
                character: "MARTA", avatar: "👩",
                end: { success: false, emoji: "😳", title: "Diàleg no completat", text: "Aquesta resposta ha tallat la conversa de sobte." }
            }
        }
    },

    consulta: {
        title: "Anar al metge",
        tree: {
            start: {
                npc: "Bon dia, passa i seu. Què et porta per aquí avui?",
                character: "DOCTORA", avatar: "🧑‍⚕️",
                options: [
                    { text: "Bon dia, doctora. Em fa mal el cap des d'ahir.", correct: true, next: "detalls" },
                    { text: "Mal de cap.", correct: true, next: "informal" },
                    { text: "Res, m'he equivocat de porta.", correct: false, next: "fail_marxa" }
                ]
            },
            informal: {
                npc: "D'acord. Des de quan et fa mal?",
                character: "DOCTORA", avatar: "🧑‍⚕️",
                tip: "💡 Prova d'explicar-ho amb una frase completa, com 'Em fa mal el cap des d'ahir'.",
                options: [
                    { text: "Des d'ahir a la tarda.", correct: true, next: "detalls" }
                ]
            },
            detalls: {
                npc: "Entesos. El dolor és fort o suau, i tens algun altre símptoma?",
                character: "DOCTORA", avatar: "🧑‍⚕️",
                options: [
                    { text: "És un dolor suau, però també estic una mica cansat.", correct: true, next: "consell" },
                    { text: "No ho sé explicar bé.", correct: true, next: "ajuda_explicar" },
                    { text: "Prefereixo no dir-ho.", correct: false, next: "fail_no_explica" }
                ]
            },
            ajuda_explicar: {
                npc: "No et preocupis, pren-t'ho amb calma. És un dolor que va i ve, o constant?",
                character: "DOCTORA", avatar: "🧑‍⚕️",
                options: [
                    { text: "Crec que és constant, i estic una mica cansat.", correct: true, next: "consell" }
                ]
            },
            consell: {
                npc: "Molt bé, gràcies per explicar-m'ho. Et recomano descansar i beure molta aigua. Tens alguna pregunta?",
                character: "DOCTORA", avatar: "🧑‍⚕️",
                options: [
                    { text: "No, ho he entès tot. Moltes gràcies, doctora.", correct: true, next: "end_success" },
                    { text: "Necessito prendre alguna medicina?", correct: true, next: "medicina" }
                ]
            },
            medicina: {
                npc: "De moment no cal, però si el dolor continua demà, torna a venir a la consulta.",
                character: "DOCTORA", avatar: "🧑‍⚕️",
                options: [
                    { text: "D'acord, així ho faré. Moltes gràcies.", correct: true, next: "end_success" }
                ]
            },
            end_success: {
                npc: "Molt bé, cuida't i descansa. Que et milloris!",
                character: "DOCTORA", avatar: "🧑‍⚕️",
                end: { success: true, emoji: "🩺", title: "Consulta completada!", text: "Has explicat com et trobaves i has entès els consells de la doctora. Molt bé!" }
            },
            fail_marxa: {
                npc: "Ah, d'acord, no passa res.",
                character: "DOCTORA", avatar: "🧑‍⚕️",
                end: { success: false, emoji: "👋", title: "Diàleg no completat", text: "Has marxat de la consulta sense explicar què et passava." }
            },
            fail_no_explica: {
                npc: "D'acord, ho entenc, però així em costa ajudar-te.",
                character: "DOCTORA", avatar: "🧑‍⚕️",
                end: { success: false, emoji: "😕", title: "Diàleg no completat", text: "Sense explicar els símptomes, la doctora no ha pogut ajudar-te correctament." }
            }
        }
    }
};