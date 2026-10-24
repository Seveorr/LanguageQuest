const dictats = [
    { text: "El gos petit corre pel parc verd.", audioText: "El gos petit corre pel parc verd." },
    { text: "M'agrada molt menjar pizza de formatge.", audioText: "Magrada mol manshar pitsa da formatge." },
    { text: "Demà farem una excursió a la muntanya.", audioText: "Demà farem una excursió a la muntanya." },
    { text: "La professora explica la lliçó amb molta calma.", audioText: "La professora explica la llisó amb molta calma." },
    { text: "Has tancat bé la porta de casa?", audioText: "Has tancat bé la porta de casa?" },
    { text: "Aquest estiu anirem de vacances a la platja.", audioText: "Aquest estiu anirem de vacances a la platcha." },
    { text: "Fa un dia fantàstic per passejar.", audioText: "Fa un dia fantàstic per passeshar." },
    { text: "Necessito comprar llet, pa i fruita.", audioText: "Necessito comprar llet, pa i fruita." },
    { text: "El cotxe vermell va anar molt ràpid.", audioText: "El cotxe vermell va anar molt ràpid." },
    { text: "Estudiar cada dia ajuda a millorar.", audioText: "Estudiar cada dia ashuda a millorar." }
];

const frasesOrdenar = [
    { paraules: ["El", "gat", "negre", "dorm", "al", "sofà"], ordreCorrecte: "El gat negre dorm al sofà" },
    { paraules: ["La", "música", "clàssica", "em", "relaxa", "molt"], ordreCorrecte: "La música clàssica em relaxa molt" },
    { paraules: ["Nosaltres", "juguem", "a", "futbol", "al", "pati"], ordreCorrecte: "Nosaltres juguem a futbol al pati" },
    { paraules: ["Avui", "fa", "un", "sol", "radiant"], ordreCorrecte: "Avui fa un sol radiant" },
    { paraules: ["Ella", "llegeix", "un", "llibre", "interessant"], ordreCorrecte: "Ella llegeix un llibre interessant" },
    { paraules: ["Tinc", "molta", "gana", "de", "menjar", "gelat"], ordreCorrecte: "Tinc molta gana de menjar gelat" },
    { paraules: ["El", "tren", "arribarà", "tard", "avui"], ordreCorrecte: "El tren arribarà tard avui" },
    { paraules: ["M'agrada", "molt", "viatjar", "per", "tot", "el", "món"], ordreCorrecte: "M'agrada molt viatjar per tot el món" },
    { paraules: ["Els", "amics", "celebren", "una", "festa"], ordreCorrecte: "Els amics celebren una festa" },
    { paraules: ["Pots", "ajudar-me", "amb", "aquesta", "tasca"], ordreCorrecte: "Pots ajudar-me amb aquesta tasca" }
];

const situacionsRedaccio = [
    { 
        tipus: "whatsapp", 
        icona: "📱", 
        titol: "WhatsApp amb un amic", 
        missatgeEntrant: "Ei! Tens plans per al cap de setmana? M'agradaria anar al cinema o fer alguna cosa junts. 🍿",
        minParaules: 8,
        keywords: ["cinema", "pel·lícula", "peli", "quedar", "dissabte", "diumenge", "venir", "vols", "anar", "sí", "perfecte"]
    },
    { 
        tipus: "whatsapp", 
        icona: "📱", 
        titol: "WhatsApp amb la teva mare", 
        missatgeEntrant: "A quina hora et va bé que et vingui a recollir al parc?",
        minParaules: 8,
        keywords: ["parc", "tard", "d'hora", "recollir", "hores", "hora"]
    },
    { 
        tipus: "whatsapp", 
        icona: "📱", 
        titol: "WhatsApp amb el teu avi", 
        missatgeEntrant: "Hola! A quina hora vindràs a dinar, avui?",
        minParaules: 8,
        keywords: ["dinar", "hora", "h", "tard", "d'hora", "avui", "menjar"]
    },
    { 
        tipus: "carta", 
        icona: "✉️", 
        titol: "Carta d'agraïment", 
        missatgeEntrant: "Estimat/da, et confecciono aquesta carta per fer-te arribar el meu sincer agraïment pel detall del teu regal d'aniversari.",
        minParaules: 12,
        keywords: ["gràcies", "regal", "aniversari", "estimat", "estimada", "molt", "m'ha agradat", "detall", "família"]
    },
    { 
        tipus: "carta", 
        icona: "✉️", 
        titol: "Carta amb un amic llunyà", 
        missatgeEntrant: "Estimat/da amic/ga, fa molt de temps que no ens veiem i m'agradaria saber com estàs i com et va la vida.",
        minParaules: 20,
        keywords: ["gràcies", "amic", "amiga", "llunyà", "llunyana", "temps", "vida", "com", "estàs", "saber"]
    },
    { 
        tipus: "carta", 
        icona: "✉️", 
        titol: "Factura d'electricitat (ja has pagat la factura)", 
        missatgeEntrant: "Estimat/da client/a, li informem que la seva factura d'electricitat no ha estat pagada encara. Si us plau, realitzi el pagament abans de la data de venciment per evitar interrupcions en el subministrament.",
        minParaules: 8,
        keywords: ["ja", "no", "pagar", "pagat", "pagada", "termini", "electricitat", "factura", "venciment", "subministrament"]
    },
    { 
        tipus: "correu", 
        icona: "💻", 
        titol: "Correu de la biblioteca", 
        missatgeEntrant: "Correu de coordialitat. Li informem que el termini de retorn del llibre prestat a finalitza en 5 dies. Si us plau, assegureu-vos de retornar-lo abans de la data de venciment per evitar penalitzacions.",
        minParaules: 10,
        keywords: ["llibre", "biblioteca", "préstec", "termini", "lliurament", "data", "retornar", "retornaré"]
    },
    { 
        tipus: "correu", 
        icona: "💻", 
        titol: "Correu de la botiga online", 
        missatgeEntrant: "Bona tarda estimat/da client/a, el seu paquet ja ha sigut lliurat al destí correctament. Si us plau, confirmeu la recepció del paquet i deixeu-nos un comentari sobre la vostra experiència de compra.",
        minParaules: 8,
        keywords: ["paquet", "lliurat", "correctament", "correcte", "lliurament", "experiència", "agradable", "online"]
    },
    { 
        tipus: "correu", 
        icona: "💻", 
        titol: "Correu al professorat", 
        missatgeEntrant: "Benvolgut/da alumne/a, recorda que tens pendent resoldre el dubte sobre el termini de lliurament del treball.",
        minParaules: 15,
        keywords: ["professor", "professora", "treball", "termini", "lliurament", "data", "dubte", "pregunta", "cordialment", "atentament", "gràcies"]
    }
];