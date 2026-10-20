const dictats = [
    { text: "El gos petit corre pel parc verd." },
    { text: "M'agrada molt menjar pizza de formatge." },
    { text: "Demà farem una excursió a la muntanya." },
    { text: "La professora explica la lliçó amb molta calma." },
    { text: "Has tancat bé la porta de casa?" },
    { text: "Aquest estiu anirem de vacances a la platja." },
    { text: "Fa un dia fantàstic per passejar." },
    { text: "Necessito comprar llet, pa i fruita." },
    { text: "El cotxe vermell va anar molt ràpid." },
    { text: "Estudiar cada dia ajuda a millorar." }
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
        tipus: "carta", 
        icona: "✉️", 
        titol: "Carta d'agraïment", 
        missatgeEntrant: "Estimat/da, et confeciono aquesta carta per fer-te arribar el meu sincer agraïment pel detall del teu regal d'aniversari.",
        minParaules: 12,
        keywords: ["gràcies", "regal", "aniversari", "estimat", "estimada", "molt", "m'ha agradat", "detall", "família"]
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