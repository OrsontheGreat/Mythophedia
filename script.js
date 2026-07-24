// ==========================================

// MYTHOPHEDIA - SCRIPT.JS - BLOCCO 1

// ==========================================

document.addEventListener("DOMContentLoaded", () => {

  // Registri delle Mappe e degli Stati di Gioco

  let dizionarioMappe = {};

  let mappaMondo = [];

  let mappaGuerraClan = [];

 

  // Contatori Punti Dominio per la Guerra tra Clan

  let puntiDominioGiocatore = 0;

  let puntiDominioBot1 = 0;

  let puntiDominioBot2 = 0;

  let puntiDominioBot3 = 0;

  let capitanoOracoliUsatiOggi = 0;

  let amnistiaUsataQuestaSettimana = false;

 

  // Variabili per l'Arena dei Duelli

  let listaDuelliBacheca = [];

  let contatoreDuelliGiornalieri = 0;

  let haGiocatoEliteOggi = false;

  let sfidaSelezionataInAccettazione = null;

  let donazioneFattaOggi = false;

  let donazioneDestinatarioCorrente = null;

 

  // Registri delle Gilde e dell'Utente

  let listaClanGlobali = [];

  let clanMioAttuale = null;

  let esagonoGuerraSelezionatoDati = null;

  let nicknameUtente = "OrsonWells";

  let presentationUtente = "Un fiero evocatore di miti ancestrali.";

 

  const RIGHE_MAPPA_GUERRA = 10;

  const COLONNE_MAPPA_GUERRA = 10;

 

  // Controllo e reset dei duelli allo scattare della mezzanotte reale

  function controllaResetGiornalieroDuelli() {

    const oggi = new Date().toDateString();

    const ultimoReset = localStorage.getItem("mythophedia_ultimo_reset");

 

    if (ultimoReset !== oggi) {

      contatoreDuelliGiornalieri = 0;

      haGiocatoEliteOggi = false;

      donazioneFattaOggi = false;

      capitanoOracoliUsatiOggi = 0;

      localStorage.setItem("mythophedia_ultimo_reset", oggi);

 

      const duelsModal = document.getElementById("duels-modal");

      if (duelsModal && !duelsModal.classList.contains("hidden")) {

        if (typeof aggiornaValidazioneCreazioneSfida === "function") {

          aggiornaValidazioneCreazioneSfida();

        }

      }

    }

  }

  controllaResetGiornalieroDuelli();

  setInterval(controllaResetGiornalieroDuelli, 30000);

 

  // Pool dei nomi e delle culture per la generazione procedurale delle carte

  const MITI_PER_RARITA = {

    1: { 

      nomi: ["Pixie", "Kappa", "Chaneque", "Leprecauno", "Domovoj", "Korrigan", "Menehune", "Tsuchinoko", "Tanuki", "Nisse", "Puck", "Brownie", "Gremlin", "Sylph", "Gnomo", "Will-o-the-Wisp"],

      titoli: ["Silvestre", "Errante", "dei Boschi", "Nativo", "dei Campi", "dei Sogni", "Ancestrale", "Arcano", "del Crepuscolo", "delle Ombre", "Primordiale", "Planare", "dei Ruderi", "delle Radure", "Evocato", "Runico", "d'Argilla", "delle Fronde", "dei Calanchi", "Neofita", "d'Ambra", "della Brughiera", "Crepuscolare", "Erratico", "dei Sentieri", "Fiammeggiante", "del Solstizio", "dell'Eclissi", "Spettrale", "della Notte"],

      culture: ["Celtica", "Giapponese", "Azteca", "Slava", "Polinesiana", "Norrena", "Greca", "Egizia"]

    },

    2: { 

      nomi: ["Segugio di Annwn", "Cervo di Cerinea", "Cinghiale di Erimanto", "Lupo Mannaro", "Hellhound", "Baku", "Kamaitachi", "Jackalope", "Chupacabra", "Gorgone Minore", "Arpia", "Raiju"],

      titoli: ["Ferale", "Feroce", "Cacciatore", "Silente", "Ombroso", "Zannuto", "Sanguinario", "Predatore", "delle Ombre", "Spietato", "Agile", "Mietitore", "Veloce", "Notturno", "Inseguitore", "Randagio"],

      culture: ["Celtica", "Greca", "Giapponese", "Norrena", "Egizia", "Romana"]

    },

    3: { 

      nomi: ["Minotauro", "Manticora", "Sfinge", "Chimera", "Grifone", "Pegaso", "Anubi Guardiano", "Golem", "Centauro", "Kitsune a 9 Code", "Yeti", "Oni"],

      titoli: ["Custode", "Sacro", "Implacabile", "Incorrotto", "Eterno", "Mistico", "Guardiano del Tempio", "Maledetto", "Imponente", "del Labirinto", "Inviolabile", "Veggente", "Guerriero", "Legato alla Roccia", "Spettrale", "Rinascente"],

      culture: ["Greca", "Egizia", "Mesopotamica", "Giapponese", "Slava", "Romana"]

    }

  };

  const MITI_PER_RARITA_RESTO = {

    4: { 

      nomi: ["Idra di Lerna", "Fenice", "Roc", "Thunderbird", "Basilisco", "Sleipnir", "Ippogrifo", "Nemeo", "Cerbero", "Valkiria", "Garmr"],

      titoli: ["Primordiale", "Ancestrale", "Supremo", "Immateriale", "Immortale", "Immemore", "delle Tempeste", "delle Fiamme", "Abissale", "Eclissato", "Celestiale", "Inarrestabile", "Devastatore", "Flagello della Terra", "Distruttore", "Generatore di Caos"],

      culture: ["Greca", "Egizia", "Norrena", "Celtica", "Romana", "Persiana"]

    },

    5: { 

      nomi: ["Fenrir", "Kraken", "Behemoth", "Leviatano", "Jormungandr", "Cthulhu", "Quetzalcoatl", "Anubi", "Ymir", "Tifone", "Medusa Suprema"],

      titoli: ["Flagello Divino", "Mitico", "Infernale", "Cosmico", "Cataclismatico", "Divoratore di Stelle", "Apocalittico", "Senza Tempo", "Eterno Guardiano", "Signore del Vuoto", "Origine del Mondo", "Innominabile", "Distruttore di Dei", "Titano Supremo"],

      culture: ["Norrena", "Egizia", "Greca", "Mesopotamica", "Azteca"]

    }

  };

  const TRATTI_DISPONIBILI = ["volo", "nuoto", "arrampicata", "equilibrio"];

  const EMOJI_MOSTRI = ["👹", "🐉", "🦅", "🦁", "🐺", "🧜", "🦂", "🐂", "🦉", "🏺"];

  const DRAGHI_LEGGENDARI = [

    { nome: "Fafnir", cultura: "Norrena", traits: ["arrampicata"], immagine: "🐉", livello: 6 },

    { nome: "Ryujin", cultura: "Giapponese", traits: ["nuoto"], immagine: "🐉", livello: 6 },

    { nome: "Tiamat", cultura: "Mesopotamica", traits: ["volo"], immagine: "🐉", livello: 6 },

    { nome: "Vritra", cultura: "Indiana", traits: ["volo"], immagine: "🐉", livello: 6 },

    { nome: "Quetzalcoatl", cultura: "Azteca", traits: ["volo", "equilibrio"], immagine: "🐉", livello: 6 },

    { nome: "Ladone", cultura: "Greca", traits: ["arrampicata"], immagine: "🐉", livello: 6 }

  ];

  function inizializzaClanDefault() {

  listaClanGlobali = [

    {

      id: "clan_bot_1",

      nome: "Legione Olimpo",

      emblema: "⚡",

      motto: "Il fulmine di Zeus guida le nostre lame.",

      regole: ["Partecipazione attiva", "Donare carte", "Nessun duello fratricida"],

      membri: [

        { nome: "Athena_War", rank: "comandante" },

        { nome: "ZeusPlayer", rank: "capitano" },

        { nome: "Ragnar99", rank: "sergente" }

      ],

      isBot: true,

      fazioneId: "bot1",

      assedioAttivo: false, chat: [],

      oracoloHex: null

    },

    {

      id: "clan_bot_2",

      nome: "Abissi del Kraken",

      emblema: "🐙",

      motto: "Nessuna nave sfugge alla morsa delle onde.",

      regole: ["Presidiare le torri", "Rispettare i turni", "Sondare la nebbia"],

      membri: [

        { nome: "HydraMaster", rank: "comandante" },

        { nome: "Anubis_Shadow", rank: "capitano" }

      ],

      isBot: true,

      fazioneId: "bot2",

      assedioAttivo: false, chat: [],

      oracoloHex: null

    },

    {

      id: "clan_bot_3",

      nome: "Cacciatori di Fenrir",

      emblema: "🐺",

      motto: "Il nostro ululato squarcia le tenebre.",

      regole: ["Attacchi massicci", "Sfondare le lines", "Allenamento"],

      membri: [

        { nome: "FenrirFang", rank: "comandante" },

        { nome: "LokiTrickster", rank: "capitano" }

      ],

      isBot: true,

      fazioneId: "bot3",

      assedioAttivo: false, chat: [],

      oracoloHex: null

    }

  ];

}

inizializzaClanDefault();

function generaDatabaseCompleto() {

  let database = [];

  let quoteRarita = [

    { lvl: 1, quantita: 500 }, { lvl: 2, quantita: 270 }, 

    { lvl: 3, quantita: 110 }, { lvl: 4, quantita: 80 }, 

    { lvl: 5, quantita: 34 }

  ];

 

  quoteRarita.forEach(quota => {

    let configurazione = quota.lvl <= 3 ? MITI_PER_RARITA[quota.lvl] : MITI_PER_RARITA_RESTO[quota.lvl];

    for (let i = 1; i <= quota.quantita; i++) {

      let nPool = configurazione.nomi;

      let tPool = configurazione.titoli;

      let cPool = configurazione.culture;

 

      let nomeBase = nPool[Math.floor(Math.random() * nPool.length)];

      let titolo = tPool[Math.floor(Math.random() * tPool.length)];

      let cultura = cPool[Math.floor(Math.random() * cPool.length)];

      let emoji = EMOJI_MOSTRI[Math.floor(Math.random() * EMOJI_MOSTRI.length)];

 

      let traits = [];

      let numTratti = Math.floor(Math.random() * 3);

      let poolTratti = [...TRATTI_DISPONIBILI];

      for(let t = 0; t < numTratti; t++) {

        let idx = Math.floor(Math.random() * poolTratti.length);

        traits.push(poolTratti.splice(idx, 1)[0]);

      }

 

      database.push({ 

        nome: nomeBase + " " + titolo, 

        cultura: cultura, 

        tratti: traits, 

        immagine: emoji, 

        livello: quota.lvl 

      });

    }

  });

 

  let draghiMappati = DRAGHI_LEGGENDARI.map(d => ({

    nome: d.nome,

    cultura: d.cultura,

    tratti: d.traits || d.tratti || [],

    immagine: d.immagine,

    livello: d.livello

  }));

 

  return database.concat(draghiMappati);

}

const DATABASE_COMPLETO_1000 = generaDatabaseCompleto();

const DATABASE_LIVELLO_1 = DATABASE_COMPLETO_1000.filter(c => c.livello === 1);

function generaStatisticheAsimmetriche(puntiTotali) {

  const minVal = 0.1; 

  let pool = puntiTotali - 0.4;

  let r1 = Math.random() * pool; 

  let r2 = Math.random() * pool; 

  let r3 = Math.random() * pool;

 

  let v1 = Math.min(r1, r2, r3); 

  let v3 = Math.max(r1, r2, r3); 

  let v2 = (r1 + r2 + r3) - v1 - v3;

 

  let s1 = parseFloat((v1 + minVal).toFixed(1)); 

  let s2 = parseFloat((v2 - v1 + minVal).toFixed(1));

  let s3 = parseFloat((v3 - v2 + minVal).toFixed(1)); 

  let s4 = parseFloat((pool - v3 + minVal).toFixed(1));

 

  let sum = parseFloat((s1 + s2 + s3 + s4).toFixed(1)); 

  let diff = parseFloat((puntiTotali - sum).toFixed(1));

  s1 = parseFloat((s1 + diff).toFixed(1));

 

  return { ferocia: s1, balzo: s2, corazza: s3, istinto: s4 };

}

let deckGiocatore = [];

let dracmeAttuali = 1000;

let ambraAttuale = 5;

let livelloGiocatore = 1;

let xpAttuali = 0;

let slotMassimiDeck = 50;

const SOGLIE_XP = { 1: 50, 2: 200, 3: 500, 4: 1000, 5: 2000, 6: 999999 };

  function aggiornaPulsantiLateraliRarita() {

  const conteggi = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  deckGiocatore.forEach(c => { if (conteggi[c.livello] !== undefined) conteggi[c.livello]++; });

 

  document.getElementById("filter-comuni").innerText = `Comuni (${conteggi[1]})`;

  document.getElementById("filter-noncomuni").innerText = `Non Comuni (${conteggi[2]})`;

  document.getElementById("filter-rare").innerText = `Rare (${conteggi[3]})`;

  document.getElementById("filter-epiche").innerText = `Epiche (${conteggi[4]})`;

  document.getElementById("filter-mitiche").innerText = `Mitiche (${conteggi[5]})`;

  document.getElementById("filter-leggendarie").innerText = `Leggendarie (${conteggi[6]})`;

 

  let sidebar = document.querySelector(".right-sidebar");

  if (sidebar) {

    let contatoreEsistente = document.getElementById("deck-global-counter");

    if (!contatoreEsistente) {

      let nuovoContatore = document.createElement("div");

      nuovoContatore.id = "deck-global-counter";

      nuovoContatore.style = "color:#ffcc66; font-weight:bold; text-align:center; padding:8px 0; font-size:1rem; letter-spacing:0.5px; border-bottom:1px dashed #5c4d31; margin-bottom:8px;";

      let titolo = sidebar.querySelector(".sidebar-title");

      if (titolo) titolo.insertAdjacentElement("afterend", nuovoContatore);

      contatoreEsistente = nuovoContatore;

    }

    contatoreEsistente.innerText = `Capacità: ${deckGiocatore.length} / ${slotMassimiDeck}`;

  }

}

function aggiungiXP(quantita) {

  xpAttuali += quantita;

  let stabileSoglia = SOGLIE_XP[livelloGiocatore];

  let passatiLivelli = false;

  let reportLivelliHTML = "";

 

  while (xpAttuali >= stabileSoglia && livelloGiocatore < 6) {

    xpAttuali -= stabileSoglia;

    livelloGiocatore++;

    slotMassimiDeck += 5;

    dracmeAttuali += 1000;

    ambraAttuale += 5;

    passatiLivelli = true;

    stabileSoglia = SOGLIE_XP[livelloGiocatore];

    reportLivelliHTML += `<p>Ascensione al <strong>Livello ${livelloGiocatore}</strong>!<br>Bonus: +1000 Dracme | +5 Frammenti d'Ambra | +5 Slot Deck</p><br>`; 

  }

 

  document.getElementById("player-level").innerText = livelloGiocatore;

  document.getElementById("dracme-count").innerText = dracmeAttuali;

  document.getElementById("ambra-count").innerText = ambraAttuale;

 

  if (passatiLivelli) {

    document.getElementById("battle-title-outcome").innerText = " Nuovo Livello!"; 

    document.getElementById("battle-report-content").innerHTML = `

      <div style="text-align:center; color:#ecc94b; font-size:1.1rem; font-weight:bold; margin-bottom:10px;"> Livello Aumentato! </div>

      ${reportLivelliHTML}

      <p style="border-top:1px dashed #5c4d31; padding-top:10px; font-size:0.8rem; color:#aaa;">La capienza del tuo Deck è ora di <strong>${slotMassimiDeck}</strong> carte.</p>

    `;

    document.getElementById("battle-result-modal").classList.remove("hidden");

  }

  aggiornaPulsantiLateraliRarita();

}

function controllaERinfrescaFatica(carta) {

  if (!carta.ultimoAggiornamentoFatica) return;

  let minutiPassati = (Date.now() - carta.ultimoAggiornamentoFatica) / 60000;

  let puntiRecuperati = Math.floor(minutiPassati / 30);

  if (puntiRecuperati <= 0) return;

  carta.faticaMondo = Math.max(0, carta.faticaMondo - puntiRecuperati);

  carta.fatigueGuerra = Math.max(0, carta.fatigueGuerra - puntiRecuperati);

  carta.ultimoAggiornamentoFatica += puntiRecuperati * 30 * 60 * 1000;

  if (carta.faticaMondo <= 0 && carta.fatigueGuerra <= 0) {

    carta.faticaMondo = 0;

    carta.fatigueGuerra = 0;

    carta.ultimoAggiornamentoFatica = null;

  }

}

function calcolaVigorePercentuale(carta) {

  controllaERinfrescaFatica(carta);

  let maxFatica = Math.max(carta.faticaMondo, carta.fatigueGuerra);

  let vigore = 100 - (maxFatica * 10);

  return Math.max(0, Math.round(vigore));

}

function applicaSfiancamento(carta, tipoMappa) {

  controllaERinfrescaFatica(carta);

  if (tipoMappa === "guerra" && clanMioAttuale && clanMioAttuale.assedioAttivo) {

    if (esagonoGuerraSelezionatoDati && esagonoGuerraSelezionatoDati.tipo !== "normale") {

      carta.fatigueGuerra += 0.5;

    } else {

      carta.fatigueGuerra += 1;

    }

  } else if (tipoMappa === "guerra") {

    carta.fatigueGuerra += 1;

  } else {

    carta.faticaMondo += 1;

  }

 

  if (!carta.ultimoAggiornamentoFatica) {

    carta.ultimoAggiornamentoFatica = Date.now();

  }

}

function inizializzaDeckGiocatore() {

  deckGiocatore = [];

  for (let i = 0; i < 5; i++) {

    let r = Math.floor(Math.random() * DATABASE_LIVELLO_1.length);

    let ref = DATABASE_LIVELLO_1[r];

    deckGiocatore.push({

      id: "carta_" + i + "_" + Date.now() + "_" + Math.floor(Math.random()*1000),

      nome: ref.nome, 

      cultura: ref.cultura, 

      tratti: ref.tratti || [], 

      immagine: ref.immagine, 

      livello: 1, 

      stelle: 0,

      statistiche: generaStatisticheAsimmetriche(8), 

      isJolly: false,

      occupataInDifesa: false, 

      coordinatePresidio: null, 

      mondoPresidio: null, 

      sottomondoPresidio: null,

      bloccataInDuello: false, 

      faticaMondo: 0, 

      fatigueGuerra: 0, 

      inizioRiposo: null

    });

  }

  aggiornaPulsantiLateraliRarita();

}

const STRUTTURA_MONDI = [

  { id: "p", nome: "Principianti", info: "Ammesse solo carte di Livello 1" },

  { id: "i", nome: "Intermedio", info: "Ammesse solo carte di Livello 1 e 2" },

  { id: "e", nome: "Esperti", info: "Ammesse solo carte di Livello 1, 2 e 3" },

  { id: "c", nome: "Cultori", info: "Ammesse solo carte di Livello 2, 3 e 4" },

  { id: "l", nome: "Libero", info: "Possono partecipare tutte le carte" }

];

const STRUTTURA_SOTTOMONDI = [

  { id: "1", nome: "Normale", info: "Statistica di scontro variabile settimanalmente" },

  { id: "2", nome: "Bifase", info: "Scontro basato sulla media di 2 statistiche" },

  { id: "3", nome: "Trifase", info: "Scontro basato sulla media di 3 statistiche" },

  { id: "4", nome: "Nebbia di Guerra", info: "Caratteristiche avversarie nascoste" }

];

let mondoSelezionatoCorrente = null;

let sottomondoSelezionatoCorrente = null;

let esagonoSelezionatoDati = null;

const RIGHE_MAPPA = 12; 

const COLONNE_MAPPA = 12;

const TIPI_TERRENO = ["Aria", "Terra", "Foresta", "Acqua"];

let statisticheSettimanaliMondo = [];

function utenteHaAlmenoUnEsagono() {

  for (let r = 0; r < RIGHE_MAPPA; r++) {

    for (let c = 0; c < COLONNE_MAPPA; c++) {

      if (mappaMondo[r] && mappaMondo[r][c] && mappaMondo[r][c].proprietario === nicknameUtente + " (Tu)") {

        return true;

      }

    }

  }

  return false;

}

  // ==========================================

// MYTHOPHEDIA - SCRIPT.JS - BLOCCO 4

// ==========================================

function confinaConEsagonoUtente(r, c) {

  let vicini = [];

  if (r % 2 === 0) {

    vicini = [

      {r: r-1, c: c-1}, {r: r-1, c: c},

      {r: r, c: c-1}, {r: r, c: c+1},

      {r: r+1, c: c-1}, {r: r+1, c: c}

    ];

  } else {

    vicini = [

      {r: r-1, c: c}, {r: r-1, c: c+1},

      {r: r, c: c-1}, {r: r, c: c+1},

      {r: r+1, c: c}, {r: r+1, c: c+1}

    ];

  }

  for (let v of vicini) {

    if (v.r >= 0 && v.r < RIGHE_MAPPA && v.c >= 0 && v.c < COLONNE_MAPPA) {

      if (mappaMondo[v.r] && mappaMondo[v.r][v.c] && mappaMondo[v.r][v.c].proprietario === nicknameUtente + " (Tu)") {

        return true;

      }

    }

  }

  return false;

}

function generaDatiMappaSicura() {

  const poolCaratteristiche = ["ferocia", "balzo", "corazza", "istinto"];

  const chiaveMappa = `${mondoSelezionatoCorrente.id}_${sottomondoSelezionatoCorrente.id}`;

 

  if (dizionarioMappe[chiaveMappa]) {

    mappaMondo = dizionarioMappe[chiaveMappa];

    if (sottomondoSelezionatoCorrente.id === "2") {

      let rimescolato = [...poolCaratteristiche].sort(() => 0.5 - Math.random());

      statisticheSettimanaliMondo = rimescolato.slice(0, 2);

    } else if (sottomondoSelezionatoCorrente.id === "3") {

      let rimescolato = [...poolCaratteristiche].sort(() => 0.5 - Math.random());

      statisticheSettimanaliMondo = rimescolato.slice(0, 3);

    } else {

      let casuale = poolCaratteristiche[Math.floor(Math.random() * poolCaratteristiche.length)];

      statisticheSettimanaliMondo = [casuale];

    }

    return;

  }

 

  mappaMondo = [];

  if (sottomondoSelezionatoCorrente.id === "2") {

    let rimescolato = [...poolCaratteristiche].sort(() => 0.5 - Math.random());

    statisticheSettimanaliMondo = rimescolato.slice(0, 2);

  } else if (sottomondoSelezionatoCorrente.id === "3") {

    let rimescolato = [...poolCaratteristiche].sort(() => 0.5 - Math.random());

    statisticheSettimanaliMondo = rimescolato.slice(0, 3);

  } else {

    let casuale = poolCaratteristiche[Math.floor(Math.random() * poolCaratteristiche.length)];

    statisticheSettimanaliMondo = [casuale];

  }

 

  for (let r = 0; r < RIGHE_MAPPA; r++) {

    let riga = [];

    for (let c = 0; c < COLONNE_MAPPA; c++) {

      let terrStr = TIPI_TERRENO[Math.floor(Math.random() * TIPI_TERRENO.length)];

      let guard = [];

      for (let g = 0; g < 5; g++) {

        let m = DATABASE_LIVELLO_1[Math.floor(Math.random() * DATABASE_LIVELLO_1.length)];

        guard.push({ nome: m.nome, immagine: m.immagine, statistiche: generaStatisticheAsimmetriche(8), tratti: m.tratti || [], isJolly: false });

      }

      riga.push({ riga: r, colonna: c, terrain: terrStr, proprietario: "Nessuno (Mostri Selvatici)", difesa: guard, conquistato: false });

    }

    mappaMondo.push(riga);

  }

  dizionarioMappe[chiaveMappa] = mappaMondo;

}

const gridElement = document.getElementById("hex-grid");

function renderizzaMappaVisiva() {

  if (!gridElement) return;

  gridElement.innerHTML = "";

  mappaMondo.forEach((rigaDati) => {

    const rowDiv = document.createElement("div");

    rowDiv.className = "hex-row";

    rigaDati.forEach((esagono) => {

      const hexDiv = document.createElement("div");

      let classeTerreno = "hex-" + esagono.terrain.toLowerCase();

      if (esagono.conquistato) classeTerreno = "hex-conquistato";

      hexDiv.className = "hexagon " + classeTerreno;

      hexDiv.id = `hex-cell-${esagono.riga}-${esagono.colonna}`;

      hexDiv.innerText = esagono.riga + "," + esagono.colonna;

 

      hexDiv.addEventListener("click", () => {

        document.querySelectorAll(".hexagon").forEach(h => h.classList.remove("selected"));

        hexDiv.classList.add("selected");

        esagonoSelezionatoDati = esagono;

        mostraDettagliEsagono(esagono);

      });

      rowDiv.appendChild(hexDiv);

    });

    gridElement.appendChild(rowDiv);

  });

}

function mostraDettagliEsagono(esagono) {

  document.getElementById("info-hex-coords").innerText = "Esagono [" + esagono.riga + ", " + esagono.colonna + "]";

  let infoCaratteristicheHTML = statisticheSettimanaliMondo.map(s => String(s).toUpperCase()).join(" + ");

  document.getElementById("info-hex-terrain").innerHTML = `${esagono.terrain} <span style="font-size:0.75rem; color:#aaa; display:block; font-weight:normal; margin-top:2px;">(Scontro su: <strong style="color:#ffcc66;">${infoCaratteristicheHTML}</strong>)</span>`;

  document.getElementById("info-hex-owner").innerText = esagono.proprietario;

 

  const setupTitle = document.getElementById("setup-action-title");

  const btnAttacca = document.getElementById("btn-attacca-esagono");

 

  if (esagono.conquistato) {

    setupTitle.innerText = "Modifica Presidio (Cambio Difesa):";

    btnAttacca.innerText = "Salva Nuova Difesa";

  } else {

    setupTitle.innerText = "Il Tuo Schieramento (Scegli 5 Carte):";

    btnAttacca.innerText = "Attacca Esagono";

  }

 

  const difesaDiv = document.getElementById("hex-defense-team");

  const isNebbia = (sottomondoSelezionatoCorrente && sottomondoSelezionatoCorrente.id === "4" && !esagono.conquistato && !(clanMioAttuale && clanMioAttuale.oracoloHex === `${esagono.riga},${esagono.colonna}`));

 

  let listaDifensoriHTML = esagono.difesa.map((mostro, index) => {

    if (isNebbia) {

      return `<div class="defense-row"><span><strong>${index + 1}°:</strong> Mostro ❓ Misterioso</span><div class="defense-stats"><span>F: ❓ </span><span>B: ❓ </span><span>C: ❓ </span><span>I: ❓ </span></div></div>`;

    }

    return `<div class="defense-row"><span><strong>${index + 1}°:</strong> ${mostro.immagine} ${mostro.nome}</span><div class="defense-stats"><span>F: ${mostro.statistiche.ferocia}</span><span>B: ${mostro.statistiche.balzo}</span><span>C: ${mostro.statistiche.corazza}</span><span>I: ${mostro.statistiche.istinto}</span></div></div>`;

  }).join("");

 

  difesaDiv.innerHTML = "<h4>Guarnigione di Difesa:</h4>" + listaDifensoriHTML;

  popolaSelectSchieramento(); 

  aggiornaValidazioneAttacco();

}

const NOMI_BOT = ["Ragnar99", "Athena_War", "ZeusPlayer", "KitsuneFan", "Anubis_Shadow", "Valkyrie_X", "HydraMaster", "FenrirFang"];

function generaSfideArtificiali() {

  listaDuelliBacheca = [];

  const terrains = ["Aria", "Terra", "Foresta", "Acqua"];

  const poolStats = ["ferocia", "balzo", "corazza", "istinto"];

  const scaglioni = ["minore", "maggiore", "elite"];

 

  for (let i = 0; i < 5; i++) {

    let bot = NOMI_BOT[Math.floor(Math.random() * NOMI_BOT.length)] + " [BOT]";

    let tier = scaglioni[Math.floor(Math.random() * scaglioni.length)];

    let terr = terrains[Math.floor(Math.random() * terrains.length)];

    let numStats = Math.floor(Math.random() * 3) + 1; 

    let statsRimescolate = [...poolStats].sort(() => 0.5 - Math.random());

    // ==========================================

// MYTHOPHEDIA - SCRIPT.JS - BLOCCO 5

// ==========================================

    let statsScelte = statsRimescolate.slice(0, numStats);

 

    let dracmeScommessa = tier === "minore" ? 50 : tier === "maggiore" ? 300 : 1000;

    let ambraScommessa = tier === "elite" ? 1 : 0;

    let lvlMazzo = tier === "minore" ? 1 : tier === "maggiore" ? 3 : 5;

    let puntiBase = lvlMazzo === 1 ? 8 : lvlMazzo === 3 ? 16 : 24;

    let mazzoBot = [];

 

    let poolFiltrato = DATABASE_COMPLETO_1000.filter(c => c.livello === lvlMazzo);

    if (poolFiltrato.length === 0) poolFiltrato = DATABASE_LIVELLO_1;

 

    for (let m = 0; m < 5; m++) {

      let cartaRef = poolFiltrato[Math.floor(Math.random() * poolFiltrato.length)];

      mazzoBot.push({

        nome: cartaRef.nome,

        immagine: cartaRef.immagine,

        tratti: cartaRef.tratti || [],

        statistiche: generaStatisticheAsimmetriche(puntiBase)

      });

    }

 

    listaDuelliBacheca.push({

      id: "sfida_bot_" + i + "_" + Date.now(),

      creatore: bot,

      tier: tier,

      terreno: terr,

      statisticheCoinvolte: statsScelte,

      dracmeQuota: dracmeScommessa,

      ambraQuota: ambraScommessa,

      mazzoDifensivo: mazzoBot,

      isBot: true

    });

  }

}

function renderizzaBachecaDuelli() {

  const container = document.getElementById("duels-list");

  if (!container) return;

  container.innerHTML = "";

 

  if (listaDuelliBacheca.length === 0) {

    container.innerHTML = `<p style="color:#aaa; text-align:center; padding-top:20px;">Nessuna sfida attiva in bacheca.</p>`;

    return;

  }

 

  listaDuelliBacheca.forEach(sfida => {

    let infoStatsHTML = sfida.statisticheCoinvolte.map(s => s.toUpperCase()).join(" + ");

    let stringaPremio = sfida.tier === "elite" ? `${sfida.dracmeQuota * 2} 🪙 + ${sfida.ambraQuota * 2} 💎` : `${sfida.dracmeQuota * 2} 🪙`;

    let classElite = sfida.tier === "elite" ? "elite-border" : "";

    let badgeReale = sfida.reale ? `<span style="background:#2f855a; color:#fff; font-size:0.65rem; padding:2px 6px; border-radius:4px; margin-left:6px;">👤 REALE</span>` : "";

 

    let cardHTML = `

      <div class="duel-card-bacheca ${classElite}">

        <div class="duel-card-header">

          <span> Sfidante: <strong>${sfida.creatore}</strong>${badgeReale}</span>

          <span style="text-transform:uppercase; font-weight:bold; color:#ffcc66;">${sfida.tier}</span>

        </div>

        <div class="duel-card-body">

          <p> Terreno: <strong>${sfida.terreno}</strong> | Parametri: <strong>${infoStatsHTML}</strong></p>

          <p class="duel-card-prize"> Montepremi Totale: ${stringaPremio} <span style="font-size:0.7rem; color:#aaa; font-weight:normal;">(Tassa 10% inclusa)</span></p>

        </div>

        <button class="attack-btn" id="accept-duel-${sfida.id}" style="padding:6px; font-size:0.75rem; margin-top:2px;">Accetta ed Entra in Arena</button>

      </div>`;

    container.insertAdjacentHTML("beforeend", cardHTML);

    document.getElementById(`accept-duel-${sfida.id}`).addEventListener("click", () => {

      apriPannelloSchieramentoDuello(sfida);

    });

  });

}

function gestisciConfigurazioneSelettoriStatisticheArena() {

  const fase = document.getElementById("duel-phase-select").value;

  const container = document.getElementById("duel-stats-selectors");

  container.innerHTML = "";

 

  const caratteristiche = [

    { id: "ferocia", nome: "Ferocia" },

    { id: "balzo", nome: "Balzo" },

    { id: "corazza", nome: "Corazza" },

    { id: "istinto", nome: "Istinto" }

  ];

 

  let numSelettori = parseInt(fase);

  for (let i = 0; i < numSelettori; i++) {

    let div = document.createElement("div");

    div.className = "select-row";

    div.style.marginTop = "2px";

    div.innerHTML = `

      <span>${i+1}°:</span>

      <select id="duel-stat-choice-${i}" class="deploy-select">

        ${caratteristiche.map((c, idx) => `<option value="${c.id}" ${idx===i ? 'selected':''}>${c.nome}</option>`).join("")}

      </select>`;

    container.appendChild(div);

    document.getElementById(`duel-stat-choice-${i}`).addEventListener("change", aggiornaValidazioneCreazioneSfida);

  }

  aggiornaValidazioneCreazioneSfida();

}

function aggiornaValidazioneCreazioneSfida() {

  const btnCrea = document.getElementById("btn-crea-sfida");

  if (!btnCrea) return;

  let valido = true;

  let sceltiMazzo = [];

 

  for (let i = 0; i < 5; i++) {

    const el = document.getElementById(`duel-slot-${i}`);

    let val = el ? el.value : "";

    if (!val || sceltiMazzo.includes(val)) valido = false;

    else sceltiMazzo.push(val);

  }

 

  const fase = parseInt(document.getElementById("duel-phase-select").value);

  let statsScelte = [];

  for (let i = 0; i < fase || i < fase; i++) {

    const el = document.getElementById(`duel-stat-choice-${i}`);

    if (el) {

      let sVal = el.value;

      if (statsScelte.includes(sVal)) valido = false;

      else statsScelte.push(sVal);

    }

  }

 

  const tier = document.getElementById("duel-tier-select").value;

  if (tier === "elite" && (contatoreDuelliGiornalieri >= 10 || haGiocatoEliteOggi)) valido = false;

  else if (contatoreDuelliGiornalieri >= 10) valido = false;

 

  btnCrea.disabled = !valido;

}

function popolaSelectMazzoDuelli() {

  let valoriSelezionati = [];

  for (let i = 0; i < 5; i++) {

    const s = document.getElementById(`duel-slot-${i}`);

    if (s && s.value) valoriSelezionati.push(s.value);

  }

  for (let i = 0; i < 5; i++) {

    const select = document.getElementById(`duel-slot-${i}`);

    if (!select) continue;

    const currentVal = select.value;

    select.innerHTML = '<option value="">-- Seleziona --</option>';

    deckGiocatore.forEach(carta => {

      let vigore = calcolaVigorePercentuale(carta);

      if (carta.isJolly || carta.occupataInDifesa || carta.bloccataInDuello || vigore <= 0) return;

      if (valoriSelezionati.includes(carta.id) && carta.id !== currentVal) return;

      const option = document.createElement("option");

      option.value = carta.id;

      let stringaTratti = carta.tratti && carta.tratti.length > 0 ? ` [${carta.tratti.join(",")}]` : " [Nessuno]";

      option.innerText = `${carta.immagine} ${carta.nome} [ ${vigore}%] F:${carta.statistiche.ferocia} B:${carta.statistiche.balzo} C:${carta.statistiche.corazza} I:${carta.statistiche.istinto}${stringaTratti}`;

      if (carta.id === currentVal) option.selected = true;

      select.appendChild(option);

    });

    select.removeEventListener("change", gestisciCambioMazzoCreaSfida);

    select.addEventListener("change", gestisciCambioMazzoCreaSfida);

  }

}

function gestisciCambioMazzoCreaSfida() {

  popolaSelectMazzoDuelli();

  aggiornaValidazioneCreazioneSfida();

}

  // ==========================================

// MYTHOPHEDIA - SCRIPT.JS - BLOCCO 6

// ==========================================

function apriPannelloSchieramentoDuello(sfida) {

  if (contatoreDuelliGiornalieri >= 10) { alert("Limite di 10 duelli raggiunto!"); return; }

  if (sfida.tier === "elite" && haGiocatoEliteOggi) { alert("Hai già affrontato il tuo duello d'Elite!"); return; }

  if (dracmeAttuali < sfida.dracmeQuota) { alert("Dracme insufficienti!"); return; }

  if (sfida.ambraQuota > 0 && ambraAttuale < sfida.ambraQuota) { alert("Frammenti d'Ambra insufficienti!"); return; }

 

  sfidaSelezionataInAccettazione = sfida;

  let infoStats = sfida.statisticheCoinvolte.map(s => s.toUpperCase()).join(" + ");

  document.getElementById("duel-setup-summary-text").innerHTML = `Sfidante: <strong>${sfida.creatore}</strong><br>Terreno: <strong>${sfida.terreno}</strong><br>Parametri: <strong>${infoStats}</strong>`;

  popolaSelectMazzoAccettaDuello();

  document.getElementById("duel-setup-modal").classList.remove("hidden");

}

function popolaSelectMazzoAccettaDuello() {

  let scelti = [];

  for (let i = 0; i < 5; i++) {

    const selectAccept = document.getElementById(`accept-duel-slot-${i}`);

    if (selectAccept && selectAccept.value) scelti.push(selectAccept.value);

  }

  for (let i = 0; i < 5; i++) {

    const select = document.getElementById(`accept-duel-slot-${i}`);

    if (!select) continue;

    const currentVal = select.value;

    select.innerHTML = '<option value="">-- Seleziona --</option>';

    deckGiocatore.forEach(carta => {

      let vigore = calcolaVigorePercentuale(carta);

      if (carta.isJolly || carta.occupataInDifesa || carta.bloccataInDuello || vigore <= 0) return;

      if (scelti.includes(carta.id) && carta.id !== currentVal) return;

      const option = document.createElement("option");

      option.value = carta.id;

      let stringaTratti = carta.tratti && carta.tratti.length > 0 ? ` [${carta.tratti.join(",")}]` : " [Nessuno]";

      option.innerText = `${carta.immagine} ${carta.nome} [ ${vigore}%] F:${carta.statistiche.ferocia} B:${carta.statistiche.balzo} C:${carta.statistiche.corazza} I:${carta.statistiche.istinto}${stringaTratti}`;

      if (carta.id === currentVal) option.selected = true;

      select.appendChild(option);

    });

    select.removeEventListener("change", validaMazzoAccettaDuello);

    select.addEventListener("change", validaMazzoAccettaDuello);

  }

  validaMazzoAccettaDuello();

}

function validaMazzoAccettaDuello() {

  let valido = true;

  let scelti = [];

  for (let i = 0; i < 5; i++) {

    let el = document.getElementById(`accept-duel-slot-${i}`);

    let val = el ? el.value : "";

    if (!val || scelti.includes(val)) valido = false;

    else scelti.push(val);

  }

  document.getElementById("btn-conferma-avvia-duello").disabled = !valido;

  popolaSelectMazzoAccettaDuelloAggiornaDinamico();

}

function popolaSelectMazzoAccettaDuelloAggiornaDinamico() {

  let scelti = [];

  for (let i = 0; i < 5; i++) {

    const selectAccept = document.getElementById(`accept-duel-slot-${i}`);

    if (selectAccept && selectAccept.value) scelti.push(selectAccept.value);

  }

  for (let i = 0; i < 5; i++) {

    const select = document.getElementById(`accept-duel-slot-${i}`);

    if (!select) continue;

    const currentVal = select.value;

    const options = select.options;

    for (let o = 1; o < options.length; o++) {

      let optVal = options[o].value;

      if (scelti.includes(optVal) && optVal !== currentVal) {

        options[o].style.display = "none";

      } else {

        options[o].style.display = "block";

      }

    }

  }

}

document.getElementById("btn-conferma-avvia-duello").addEventListener("click", () => {

  if (!sfidaSelezionataInAccettazione) return;

  let sfida = sfidaSelezionataInAccettazione;

  let mazzoMioDuello = [];

  for (let i = 0; i < 5; i++) {

    let cardId = document.getElementById(`accept-duel-slot-${i}`).value;

    mazzoMioDuello.push(deckGiocatore.find(c => c.id === cardId));

  }

 

  document.getElementById("duel-setup-modal").classList.add("hidden");

  document.getElementById("duels-modal").classList.add("hidden");

 

  dracmeAttuali -= sfida.dracmeQuota;

  if (sfida.tier === "elite") ambraAttuale -= sfida.ambraQuota;

  contatoreDuelliGiornalieri++;

  if (sfida.tier === "elite") haGiocatoEliteOggi = true;

 

  let roundVintiGiocatore = 0;

  document.getElementById("battle-title-outcome").innerText = " IN ARENA: DUELLO ATTIVO...";

  document.getElementById("battle-report-content").innerHTML = `

    <div style="text-align:center; padding:20px; font-weight:bold; color:#ffcc66;">

      <p>Il cancello di ferro si apre...</p>

      <p style="font-size:0.8rem; color:#aaa; margin-top:5px;">Elaborazione e simulazione dei 5 Round di scontro.</p>

    </div>`;

  document.getElementById("battle-result-modal").classList.remove("hidden");

 

  let roundIndex = 0;

  function eseguiProssimoRoundAnimato() {

    if (roundIndex >= 5) {

      risolviFineDuelloArena(sfida, roundVintiGiocatore);

      return;

    }

    let miaC = mazzoMioDuello[roundIndex];

    let nemC = sfida.mazzoDifensivo[roundIndex];

    let miaSomma = 0, nemSomma = 0;

 

    sfida.statisticheCoinvolte.forEach(st => {

      miaSomma += miaC.statistiche[st];

      nemSomma += nemC.statistiche[st];

    });

 

    let mioVBase = parseFloat((miaSomma / sfida.statisticheCoinvolte.length).toFixed(1));

    let nemVBase = parseFloat((nemSomma / sfida.statisticheCoinvolte.length).toFixed(1));

    let mioM = calcolaModificatoreTerreno(miaC.tratti || [], sfida.terreno);

    let nemM = calcolaModificatoreTerreno(nemC.tratti || [], sfida.terreno);

    let mioVFin = parseFloat((mioVBase + mioM).toFixed(1));

    let nemVFin = parseFloat((nemVBase + nemM).toFixed(1));

 

    let esito = (mioVFin >= nemVFin);

    if (esito) roundVintiGiocatore++;

 

    let roundCardId = `clash-round-row-${roundIndex}`;

    let rLineHTML = `

      <div class="battle-arena-row" id="${roundCardId}">

        <div class="mini-card-anim" id="my-clash-card-${roundIndex}">

          <div style="font-size:0.8rem; font-weight:bold; color:#ffcc66;">${miaC.nome}</div>

          <div style="font-size:1.5rem; margin:5px 0;">${miaC.immagine}</div>

          <div style="font-size:0.75rem; font-weight:bold; color:#fff;">PUNTI: ${mioVFin}</div>

        </div>

        <div class="vs-clash-text" id="vs-text-clash-${roundIndex}">ROUND ${roundIndex+1}</div>

        <div class="mini-card-anim" id="nem-clash-card-${roundIndex}">

          <div style="font-size:0.8rem; font-weight:bold; color:#f56565;">${nemC.nome}</div>

          <div style="font-size:1.5rem; margin:5px 0;">${nemC.immagine}</div>

          <div style="font-size:0.75rem; font-weight:bold; color:#fff;">PUNTI: ${nemVFin}</div>

        </div>

      </div>`;

 

    if (roundIndex === 0) {

      document.getElementById("battle-report-content").innerHTML = rLineHTML;

    } else {

      document.getElementById("battle-report-content").insertAdjacentHTML("beforeend", rLineHTML);

    }

    // ==========================================

// MYTHOPHEDIA - SCRIPT.JS - BLOCCO 7

// ==========================================

    let targetRow = document.getElementById(roundCardId);

    if(targetRow) targetRow.scrollIntoView({ behavior: 'smooth', block: 'end' });

 

    setTimeout(() => {

      document.getElementById(`my-clash-card-${roundIndex}`).classList.add("mia-card-scatto");

      document.getElementById(`nem-clash-card-${roundIndex}`).classList.add("nemica-card-scatto");

      document.getElementById(`vs-text-clash-${roundIndex}`).classList.add("shake");

 

      setTimeout(() => {

        if (esito) {

          document.getElementById(`nem-clash-card-${roundIndex}`).classList.add("card-sconfitta");

          document.getElementById(`vs-text-clash-${roundIndex}`).innerHTML = "VINCI";

          document.getElementById(`vs-text-clash-${roundIndex}`).style.color = "#48bb78";

        } else {

          document.getElementById(`my-clash-card-${roundIndex}`).classList.add("card-sconfitta");

          document.getElementById(`vs-text-clash-${roundIndex}`).innerHTML = "PERDI";

          document.getElementById(`vs-text-clash-${roundIndex}`).style.color = "#f56565";

        }

        applicaSfiancamento(miaC, "mondo");

        roundIndex++;

        setTimeout(eseguiProssimoRoundAnimato, 1000);

      }, 400);

    }, 600);

  }

  setTimeout(eseguiProssimoRoundAnimato, 500);

});

function risolviFineDuelloArena(sfida, roundVintiGiocatore) {

  let vinto = (roundVintiGiocatore >= 3);

  let malloppoDracme = Math.floor((sfida.dracmeQuota * 2) * 0.9);

  let epilogoHTML = `<div class="info-divider"></div>`;

 

  if (vinto) {

    dracmeAttuali += malloppoDracme;

    if (sfida.tier === "elite") ambraAttuale += sfida.ambraQuota * 2; 

    document.getElementById("battle-title-outcome").innerText = "Vittoria nell'Arena!";

    epilogoHTML += `<h3 style="text-align:center; color:#48bb78; text-transform:uppercase;">Duello Concluso: Hai Vinto! (${roundVintiGiocatore}/5)</h3>`;

    epilogoHTML += `<p style="text-align:center; font-weight:bold; color:#ecc94b; margin-top:5px; font-size:1rem;">Malloppo riscosso: +${malloppoDracme} Dracme</p>`;

    aggiungiXP(10);

  } else {

    document.getElementById("battle-title-outcome").innerText = "Sconfitta nell'Arena";

    epilogoHTML += `<h3 style="text-align:center; color:#f56565; text-transform:uppercase;">Duello Concluso: Hai Perso! (${roundVintiGiocatore}/5)</h3>`;

    epilogoHTML += `<p style="text-align:center; color:#aaa; margin-top:5px;">La tua quota è andata allo sfidante.</p>`;

    aggiungiXP(2);

  }

 

  document.getElementById("dracme-count").innerText = dracmeAttuali;

  document.getElementById("ambra-count").innerText = ambraAttuale;

  if (sfida.reale && utenteFirebaseAttuale) {

    salvaProgressoCloud();

    dbFirebase.ref("sfide_reali/" + sfida.firebaseId).update({

      stato: "completata",

      accettanteUid: utenteFirebaseAttuale.uid,

      accettanteNome: nicknameUtente,

      vincitoreUid: vinto ? utenteFirebaseAttuale.uid : sfida.creatoreUidReale,

      malloppoDracme: malloppoDracme,

      malloppoAmbra: sfida.tier === "elite" ? sfida.ambraQuota * 2 : 0,

      reclamata: false

    }).catch((err) => console.error("Errore aggiornamento sfida reale:", err));

  }

  if (!sfida.isBot && sfida.creatore.includes("(Tu)")) {

    deckGiocatore.forEach(carta => {

      if (sfida.mazzoDifensivo.some(cMio => cMio.id === carta.id)) {

        carta.bloccataInDuello = false;

      }

    });

  }

 

  listaDuelliBacheca = listaDuelliBacheca.filter(s => s.id !== sfida.id);

  if (sfida.isBot) generaSfideArtificiali();

  document.getElementById("battle-report-content").insertAdjacentHTML("beforeend", epilogoHTML);

 

  let modalContent = document.getElementById("battle-report-content");

  if(modalContent) modalContent.scrollTop = modalContent.scrollHeight;

  sfidaSelezionataInAccettazione = null;

}

document.getElementById("close-duel-setup-modal").addEventListener("click", () => {

  document.getElementById("duel-setup-modal").classList.add("hidden");

  sfidaSelezionataInAccettazione = null;

});

function caricaSfideRealiCondivise(callback) {

  if (!utenteFirebaseAttuale) { callback(); return; }

  dbFirebase.ref("sfide_reali").orderByChild("stato").equalTo("aperta").once("value").then((snapshot) => {

    listaDuelliBacheca = listaDuelliBacheca.filter(s => !s.reale);

    if (snapshot.exists()) {

      snapshot.forEach((childSnap) => {

        const dati = childSnap.val();

        if (dati.creatoreUid === utenteFirebaseAttuale.uid) return;

        listaDuelliBacheca.push({

          id: childSnap.key,

          firebaseId: childSnap.key,

          creatore: dati.creatoreNome,

          tier: dati.tier,

          terreno: dati.terreno,

          statisticheCoinvolte: dati.statisticheCoinvolte,

          dracmeQuota: dati.dracmeQuota,

          ambraQuota: dati.ambraQuota,

          mazzoDifensivo: dati.creatoreMazzo,

          isBot: false,

          reale: true,

          creatoreUidReale: dati.creatoreUid

        });

      });

    }

    callback();

  }).catch((err) => {

    console.error("Errore caricamento sfide reali:", err);

    callback();

  });

}

function controllaSfideRealiVinte() {

  if (!utenteFirebaseAttuale) return;

  dbFirebase.ref("sfide_reali").orderByChild("creatoreUid").equalTo(utenteFirebaseAttuale.uid).once("value").then((snapshot) => {

    if (!snapshot.exists()) return;

    snapshot.forEach((childSnap) => {

      const dati = childSnap.val();

      if (dati.stato === "completata" && !dati.reclamata) {

        if (dati.vincitoreUid === utenteFirebaseAttuale.uid) {

          dracmeAttuali += dati.malloppoDracme || 0;

          ambraAttuale += dati.malloppoAmbra || 0;

          document.getElementById("dracme-count").innerText = dracmeAttuali;

          document.getElementById("ambra-count").innerText = ambraAttuale;

          salvaProgressoCloud();

          alert(`La tua sfida è stata accettata da ${dati.accettanteNome} e l'hai vinta! Hai ricevuto ${dati.malloppoDracme} Dracme${dati.malloppoAmbra ? ` + ${dati.malloppoAmbra} Frammenti` : ""}.`);

        } else {

          alert(`La tua sfida è stata accettata da ${dati.accettanteNome} e purtroppo l'hai persa.`);

        }

        dbFirebase.ref("sfide_reali/" + childSnap.key + "/reclamata").set(true);

      }

    });

  }).catch((err) => console.error("Errore controllo sfide vinte:", err));

}

document.getElementById("btn-duelli").addEventListener("click", () => {

  generaSfideArtificiali();

  controllaSfideRealiVinte();

  caricaSfideRealiCondivise(() => {

    renderizzaBachecaDuelli();

  });

  gestisciConfigurazioneSelettoriStatisticheArena();

  popolaSelectMazzoDuelli();

  document.getElementById("duels-modal").classList.remove("hidden");

});

document.getElementById("close-duels-modal").addEventListener("click", () => {

  document.getElementById("duels-modal").classList.add("hidden");

});

 

document.getElementById("duel-phase-select")?.addEventListener("change", gestisciConfigurazioneSelettoriStatisticheArena);

document.getElementById("duel-tier-select")?.addEventListener("change", aggiornaValidazioneCreazioneSfida);

 

document.getElementById("btn-crea-sfida")?.addEventListener("click", () => {

  const tier = document.getElementById("duel-tier-select").value;

  const terr = document.getElementById("duel-terrain-select").value;

  const fase = parseInt(document.getElementById("duel-phase-select").value);

 

  let dracmeScommessa = tier === "minore" ? 50 : tier === "maggiore" ? 300 : 1000;

  let ambraScommessa = tier === "elite" ? 1 : 0;

 

  if (dracmeAttuali < dracmeScommessa || (tier === "elite" && ambraAttuale < ambraScommessa)) {

    alert("Risorse insufficienti per pubblicare la scommessa!");

    return;

  }

 

  let statsScelte = [];

  for (let i = 0; i < fase; i++) {

    statsScelte.push(document.getElementById(`duel-stat-choice-${i}`).value);

  }

 

  let mazzoScelto = [];

  for (let i = 0; i < 5; i++) {

    let cardId = document.getElementById(`duel-slot-${i}`).value;

    let carta = deckGiocatore.find(c => c.id === cardId);

    carta.bloccataInDuello = true;

    mazzoScelto.push(carta);

  }

 

  let nuovaSfidaId = "sfida_utente_" + Date.now();

  listaDuelliBacheca.unshift({

    id: nuovaSfidaId,

    creatore: nicknameUtente + " (Tu)",

    tier: tier,

    terreno: terr,

    statisticheCoinvolte: statsScelte,

    dracmeQuota: dracmeScommessa,

    ambraQuota: ambraScommessa,

    mazzoDifensivo: mazzoScelto,

    isBot: false

  });

  if (utenteFirebaseAttuale) {

    dracmeAttuali -= dracmeScommessa;

    if (tier === "elite") ambraAttuale -= ambraScommessa;

    document.getElementById("dracme-count").innerText = dracmeAttuali;

    document.getElementById("ambra-count").innerText = ambraAttuale;

    salvaProgressoCloud();

    dbFirebase.ref("sfide_reali/" + nuovaSfidaId).set({

      creatoreUid: utenteFirebaseAttuale.uid,

      creatoreNome: nicknameUtente,

      creatoreMazzo: mazzoScelto.map(c => ({ nome: c.nome, immagine: c.immagine, statistiche: c.statistiche, tratti: c.tratti || [] })),

      tier: tier,

      terreno: terr,

      statisticheCoinvolte: statsScelte,

      dracmeQuota: dracmeScommessa,

      ambraQuota: ambraScommessa,

      stato: "aperta",

      reclamata: false,

      timestampCreazione: Date.now()

    }).catch((err) => console.error("Errore pubblicazione sfida reale:", err));

  }

 

  renderizzaBachecaDuelli();

  popolaSelectMazzoDuelli();

  aggiornaValidazioneCreazioneSfida();

  alert("Sfida pubblicata! Le 5 carte sono bloccate a difesa dell'arena.");

});

  // ==========================================

// MYTHOPHEDIA - SCRIPT.JS - BLOCCO 8

// ==========================================

function popolaSelectSchieramento() {

  let valoriSelezionati = [];

  for (let i = 0; i < 5; i++) {

    const s = document.getElementById(`deploy-slot-${i}`);

    if (s && s.value) valoriSelezionati.push(s.value);

  }

  for (let i = 0; i < 5; i++) {

    const select = document.getElementById(`deploy-slot-${i}`);

    if (!select) continue;

    const currentVal = select.value; 

    select.innerHTML = '<option value="">-- Seleziona --</option>';

    deckGiocatore.forEach(carta => {

      controllaERinfrescaFatica(carta);

      let vigore = calcolaVigorePercentuale(carta);

      if (carta.isJolly || carta.bloccataInDuello || carta.inizioRiposo || vigore <= 0) return;

      if (carta.occupataInDifesa && carta.coordinatePresidio !== `${esagonoSelezionatoDati.riga},${esagonoSelezionatoDati.colonna}`) return;

      if (valoriSelezionati.includes(carta.id) && carta.id !== currentVal) return;

 

      const option = document.createElement("option");

      option.value = carta.id; 

      let stringaTratti = carta.tratti && carta.tratti.length > 0 ? ` [${carta.tratti.join(",")}]` : " [Nessuno]";

      option.innerText = `${carta.immagine} ${carta.nome} [ ${vigore}%] F:${carta.statistiche.ferocia} B:${carta.statistiche.balzo} C:${carta.statistiche.corazza} I:${carta.statistiche.istinto}${stringaTratti}`;

      if (carta.id === currentVal) option.selected = true;

      select.appendChild(option);

    });

    select.removeEventListener("change", gestisciCambioSelect); 

    select.addEventListener("change", gestisciCambioSelect);

  }

}

function gestisciCambioSelect() { popolaSelectSchieramento(); aggiornaValidazioneAttacco(); }

function aggiornaValidazioneAttacco() {

  const btnAttacca = document.getElementById("btn-attacca-esagono");

  let scelti = []; 

  let valido = true;

  for (let i = 0; i < 5; i++) {

    const val = document.getElementById(`deploy-slot-${i}`).value;

    if (!val || scelti.includes(val)) valido = false;

    else scelti.push(val);

  }

  if (!esagonoSelezionatoDati) valido = false;

  if (esagonoSelezionatoDati && !esagonoSelezionatoDati.conquistato) {

    if (utenteHaAlmenoUnEsagono()) {

      if (!confinaConEsagonoUtente(esagonoSelezionatoDati.riga, esagonoSelezionatoDati.colonna)) valido = false;

    }

  }

  btnAttacca.disabled = !valido;

}

function calcolaModificatoreTerreno(tratti, terreno) {

  let mod = 0.0;

  const terrMod = terreno.toLowerCase();

  tratti.forEach(t => {

    const tratto = String(t).toLowerCase().trim();

    if (tratto === "volo") {

      if (terrMod === "aria") mod += 2.0;

      if (terrMod === "acqua") mod -= 2.0;

    } else if (tratto === "arrampicata" || tratto === "equilibrio") {

      if (terrMod === "foresta" || terrMod === "terra") mod += 2.0;

      if (terrMod === "acqua" || terrMod === "aria") mod -= 2.0;

    } else if (tratto === "nuoto") {

      if (terrMod === "acqua") mod += 2.0;

      if (terrMod === "aria") mod -= 2.0;

    }

  });

  return mod;

}

document.getElementById("btn-attacca-esagono").addEventListener("click", () => {

  if (!esagonoSelezionatoDati) return;

  let mazzoAttaccoSelezionato = [];

  for (let i = 0; i < 5; i++) {

    const cardId = document.getElementById(`deploy-slot-${i}`).value;

    mazzoAttaccoSelezionato.push(deckGiocatore.find(c => c.id === cardId));

  }

 

  if (esagonoSelezionatoDati.conquistato) {

    deckGiocatore.forEach(c => {

      if (c.coordinatePresidio === `${esagonoSelezionatoDati.riga},${esagonoSelezionatoDati.colonna}`) {

        c.occupataInDifesa = false; c.coordinatePresidio = null; c.mondoPresidio = null; c.sottomondoPresidio = null;

      }

    });

    mazzoAttaccoSelezionato.forEach(c => {

      c.occupataInDifesa = true; c.coordinatePresidio = `${esagonoSelezionatoDati.riga},${esagonoSelezionatoDati.colonna}`;

      c.mondoPresidio = mondoSelezionatoCorrente.nome; c.sottomondoPresidio = sottomondoSelezionatoCorrente.nome;

    });

    esagonoSelezionatoDati.difesa = mazzoAttaccoSelezionato.map(c => { return { nome: c.nome, immagine: c.immagine, statistiche: c.statistiche, tratti: c.tratti || [], isJolly: false }; });

    mostraDettagliEsagono(esagonoSelezionatoDati);

    document.getElementById("battle-title-outcome").innerText = "Difesa Aggiornata";

    document.getElementById("battle-report-content").innerHTML = "<p style='text-align:center;'>La guarnigione a difesa di questo territorio è stata riconfigurata con successo!</p>";

    document.getElementById("battle-result-modal").classList.remove("hidden");

    return;

  }

 

  let roundVintiGiocatore = 0;

  document.getElementById("battle-title-outcome").innerText = "INVASIONE TERRITORIALE...";

  document.getElementById("battle-result-modal").classList.remove("hidden");

  let mapRoundIdx = 0;

 

  function eseguiProssimoRoundMappaAnimato() {

    if (mapRoundIdx >= 5) {

      risolviFineInvasioneMappa(mazzoAttaccoSelezionato, roundVintiGiocatore);

      return;

    }

    const miaCarta = mazzoAttaccoSelezionato[mapRoundIdx]; 

    const mostroNemico = esagonoSelezionatoDati.difesa[mapRoundIdx];

 

    let sommaMioVal = 0, sommaNemicoVal = 0;

    statisticheSettimanaliMondo.forEach(stat => {

      sommaMioVal += miaCarta.statistiche[stat];

      sommaNemicoVal += mostroNemico.statistiche[stat];

    });

 

    let mioValBase = parseFloat((sommaMioVal / statisticheSettimanaliMondo.length).toFixed(1));

    let nemicoValBase = parseFloat((sommaNemicoVal / statisticheSettimanaliMondo.length).toFixed(1));

    let mioMod = calcolaModificatoreTerreno(miaCarta.tratti || miaCarta.traits || [], esagonoSelezionatoDati.terrain);

    let nemicoMod = calcolaModificatoreTerreno(mostroNemico.tratti || mostroNemico.traits || [], esagonoSelezionatoDati.terrain);

    let mioValFinale = parseFloat((mioValBase + mioMod).toFixed(1));

    let nemicoValFinale = parseFloat((nemicoValBase + nemicoMod).toFixed(1));

 

    const esitoRound = (mioValFinale >= nemicoValFinale); 

    if (esitoRound) roundVintiGiocatore++;

 

    let nomeVisibileNemico = (sottomondoSelezionatoCorrente.id === "4") ? "Mostro Misterioso" : mostroNemico.nome;

    let emojiVisibileNemica = (sottomondoSelezionatoCorrente.id === "4") ? "❓" : mostroNemico.immagine;

    let roundCardId = `clash-map-row-${mapRoundIdx}`;

 

    let rLineHTML = `

      <div class="battle-arena-row" id="${roundCardId}">

        <div class="mini-card-anim" id="my-map-card-${mapRoundIdx}">

          <div style="font-size:0.8rem; font-weight:bold; color:#ffcc66;">${miaCarta.nome}</div>

          <div style="font-size:1.5rem; margin:5px 0;">${miaCarta.immagine}</div>

          <div style="font-size:0.75rem; font-weight:bold; color:#fff;">PUNTI: ${mioValFinale}</div>

        </div>

        <div class="vs-clash-text" id="vs-text-map-${mapRoundIdx}">ROUND ${mapRoundIdx+1}</div>

        <div class="mini-card-anim" id="nem-map-card-${mapRoundIdx}">

          <div style="font-size:0.8rem; font-weight:bold; color:#f56565;">${nomeVisibileNemico}</div>

          <div style="font-size:1.5rem; margin:5px 0;">${emojiVisibileNemica}</div>

          <div style="font-size:0.75rem; font-weight:bold; color:#fff;">PUNTI: ${nemicoValFinale}</div>

        </div>

      </div>`;

    // ==========================================

// MYTHOPHEDIA - SCRIPT.JS - BLOCCO 9

// ==========================================

    if (mapRoundIdx === 0) {

      document.getElementById("battle-report-content").innerHTML = rLineHTML;

    } else {

      document.getElementById("battle-report-content").insertAdjacentHTML("beforeend", rLineHTML);

    }

 

    let targetRow = document.getElementById(roundCardId);

    if(targetRow) targetRow.scrollIntoView({ behavior: 'smooth', block: 'end' });

 

    setTimeout(() => {

      document.getElementById(`my-map-card-${mapRoundIdx}`).classList.add("mia-card-scatto");

      document.getElementById(`nem-map-card-${mapRoundIdx}`).classList.add("nemica-card-scatto");

      document.getElementById(`vs-text-map-${mapRoundIdx}`).classList.add("shake");

 

      setTimeout(() => {

        if (esitoRound) {

          document.getElementById(`nem-map-card-${mapRoundIdx}`).classList.add("card-sconfitta");

          document.getElementById(`vs-text-map-${mapRoundIdx}`).innerHTML = "VINCI";

          document.getElementById(`vs-text-map-${mapRoundIdx}`).style.color = "#48bb78";

        } else {

          document.getElementById(`my-map-card-${mapRoundIdx}`).classList.add("card-sconfitta");

          document.getElementById(`vs-text-map-${mapRoundIdx}`).innerHTML = "PERDI";

          document.getElementById(`vs-text-map-${mapRoundIdx}`).style.color = "#f56565";

        }

        applicaSfiancamento(miaCarta, "mondo");

        mapRoundIdx++;

        setTimeout(eseguiProssimoRoundMappaAnimato, 1000);

      }, 400);

    }, 600);

  }

  setTimeout(eseguiProssimoRoundMappaAnimato, 500);

});

function risolviFineInvasioneMappa(mazzoAttaccoSelezionato, roundVintiGiocatore) {

  let guadagnoDracme = roundVintiGiocatore * 100; 

  if (roundVintiGiocatore === 5) guadagnoDracme += 100;

  dracmeAttuali += guadagnoDracme; 

  document.getElementById("dracme-count").innerText = dracmeAttuali; 

 

  const vintoBattaglia = (roundVintiGiocatore >= 3);

  document.getElementById("battle-title-outcome").innerText = vintoBattaglia ? "Vittoria Assoluta!" : "Sconfitta";

  let epilogoHTML = `<div class="info-divider"></div>`;

 

  if (vintoBattaglia) {

    esagonoSelezionatoDati.conquistato = true; 

    esagonoSelezionatoDati.proprietario = nicknameUtente + " (Tu)";

    mazzoAttaccoSelezionato.forEach(c => {

      c.occupataInDifesa = true; 

      c.coordinatePresidio = `${esagonoSelezionatoDati.riga},${esagonoSelezionatoDati.colonna}`;

      c.mondoPresidio = mondoSelezionatoCorrente.nome; 

      c.sottomondoPresidio = sottomondoSelezionatoCorrente.nome;

    });

    esagonoSelezionatoDati.difesa = mazzoAttaccoSelezionato.map(c => { 

      return { nome: c.nome, immagine: c.immagine, statistiche: c.statistiche, tratti: c.tratti || [], isJolly: false }; 

    });

    renderizzaMappaVisiva(); 

    mostraDettagliEsagono(esagonoSelezionatoDati);

    epilogoHTML += `<h3 style="text-align:center; color:#48bb78; text-transform:uppercase;">Territorio Conquistato! (${roundVintiGiocatore}/5)</h3>`;

    aggiungiXP(5);

  } else {

    epilogoHTML += `<h3 style="text-align:center; color:#f56565; text-transform:uppercase;">Invasione Fallita! (${roundVintiGiocatore}/5)</h3>`;

    aggiungiXP(1);

  }

 

  epilogoHTML += `<p style="text-align:center; margin-top:8px; font-weight:bold; color:#ecc94b;">Ricompensa: +${guadagnoDracme} Dracme</p>`;

  document.getElementById("battle-report-content").insertAdjacentHTML("beforeend", epilogoHTML);

  let modalContent = document.getElementById("battle-report-content");

  if(modalContent) modalContent.scrollTop = modalContent.scrollHeight;

}

const collectionModal = document.getElementById("collection-modal"); 

const sottomondiModal = document.getElementById("sottomondi-modal"); 

const worldsModal = document.getElementById("worlds-modal"); 

const dynamicGrid = document.getElementById("worlds-dynamic-grid"); 

const worldsTitle = document.getElementById("worlds-title-nav"); 

const btnBackToWorlds = document.getElementById("btn-back-to-worlds"); 

const modalGrid = document.getElementById("modal-cards-grid"); 

const modalTitle = document.getElementById("modal-title");

function renderizzaSelezioneMondi() {

  worldsTitle.innerText = "Seleziona Mondo"; 

  btnBackToWorlds.classList.add("hidden"); 

  dynamicGrid.innerHTML = "";

  STRUTTURA_MONDI.forEach(mondo => {

    const btn = document.createElement("button"); 

    btn.className = "sottomondo-btn"; 

    btn.innerHTML = `<strong class="sub-title">${mondo.nome}</strong><span class="sub-info">${mondo.info}</span>`;

    btn.addEventListener("click", () => { 

      mondoSelezionatoCorrente = mondo; 

      renderizzaSelezioneSottomondi(); 

    });

    dynamicGrid.appendChild(btn);

  });

}

function renderizzaSelezioneSottomondi() {

  worldsTitle.innerText = "Mondo: " + mondoSelezionatoCorrente.nome; 

  btnBackToWorlds.classList.remove("hidden"); 

  dynamicGrid.innerHTML = "";

  STRUTTURA_SOTTOMONDI.forEach(sub => {

    const btn = document.createElement("button"); 

    btn.className = "sottomondo-btn"; 

    btn.innerHTML = `<strong class="sub-title">${sub.nome}</strong><span class="sub-info">${sub.info}</span>`;

    btn.addEventListener("click", () => {

      sottomondoSelezionatoCorrente = sub; 

      sottomondiModal.classList.add("hidden"); 

      document.getElementById("map-header-title").innerText = "Mappa: " + mondoSelezionatoCorrente.nome + " (" + sub.nome + ")";

      generaDatiMappaSicura(); 

      renderizzaMappaVisiva(); 

      worldsModal.classList.remove("hidden");

    });

    dynamicGrid.appendChild(btn);

  });

}

  // ==========================================

// MYTHOPHEDIA - SCRIPT.JS - BLOCCO 10

// ==========================================

btnBackToWorlds.addEventListener("click", renderizzaSelezioneMondi);

document.getElementById("btn-mondi").addEventListener("click", () => { 

  renderizzaSelezioneMondi(); 

  sottomondiModal.classList.remove("hidden"); 

});

document.getElementById("close-sottomondi-modal").addEventListener("click", () => { 

  sottomondiModal.classList.add("hidden"); 

});

document.getElementById("close-worlds-modal").addEventListener("click", () => { 

  worldsModal.classList.add("hidden"); 

  sottomondiModal.classList.remove("hidden"); 

});

function renderizzaFiltrata(lvl, nomeLivello) {

  if (!modalGrid) return; 

  modalGrid.innerHTML = ""; 

  modalTitle.innerText = "Collezione: Carte " + nomeLivello;

  let carteFiltrate = deckGiocatore.filter(c => c.livello === lvl);

 

  if(carteFiltrate.length === 0) {

    modalGrid.innerHTML = `<p style="color:#aaa; grid-column:span 5; text-align:center; padding-top:40px;">Non possiedi ancora carte di questa rarità.</p>`;

  } else {

    carteFiltrate.forEach(carta => {

      let pctVigore = calcolaVigorePercentuale(carta);

      let careTraits = carta.tratti || []; 

      let trattiHTML = carta.isJolly ? `<span class="trait-tag nessuno" style="border-color:#ecc94b; color:#ecc94b;">Materiale Evolutivo</span>` : (careTraits.length === 0 ? `<span class="trait-tag nessuno">Nessun Tratto</span>` : careTraits.map(t => `<span class="trait-tag ${t}">${t}</span>`).join(""));

      let badgeHTML = ''; 

 

      if (pctVigore < 100 && carta.ultimoAggiornamentoFatica) {

        let puntiMancanti = Math.max(carta.faticaMondo, carta.fatigueGuerra);

        let minutiAlProssimoTick = 30 - (((Date.now() - carta.ultimoAggiornamentoFatica) / 60000) % 30);

        let minutiTotali = Math.max(0, Math.ceil(minutiAlProssimoTick + (puntiMancanti - 1) * 30));

        let oreParte = Math.floor(minutiTotali / 60);

        let minParte = minutiTotali % 60;

        let tempoTesto = oreParte > 0 ? `${oreParte}h ${minParte}m` : `${minParte}m`;

        let coloreBadge = pctVigore <= 0 ? "background:linear-gradient(to bottom, #742a2a, #4a1d1d) !important;" : "background:linear-gradient(to bottom, #7a5c1e, #5c4512) !important;";

        badgeHTML = `<span class="trait-tag status-badge" style="${coloreBadge}">Vigore: ${pctVigore}%<br>Pieno tra ${tempoTesto}</span>`;

      } else if (carta.occupataInDifesa) { 

        badgeHTML = `<span class="trait-tag status-badge">In Difesa<br>${carta.mondoPresidio}<br>(${carta.sottomondoPresidio})<br>Es. [${carta.coordinatePresidio}]</span>`; 

      } else if (carta.bloccataInDuello) {

        badgeHTML = `<span class="trait-tag status-badge" style="background:linear-gradient(to bottom, #d69e2e, #b7791f) !important;"> In Duello<br>Mazzo Bloccato</span>`;

      }

 

      let bottoneEvolviHTML = '';

      if (!carta.isJolly) {

        bottoneEvolviHTML = carta.stelle >= 8 ? 

          `<button type="button" class="attack-btn" style="background:#4a5568; cursor:not-allowed; padding:5px; font-size:0.75rem; margin-top:8px;" disabled>Evoluzione Max</button>` :

          `<button type="button" class="attack-btn" id="btn-evo-act-${carta.id}" style="padding:5px; font-size:0.75rem; margin-top:8px; background:linear-gradient(to bottom, #2f855a, #22543d); border-color:#22543d;">Evolvi (Migliora)</button>`;

      } else {

        bottoneEvolviHTML = `<button type="button" class="attack-btn" style="background:#4a5568; cursor:not-allowed; padding:5px; font-size:0.75rem; margin-top:8px;" disabled>Solo per Sacrifici</button>`;

      }

 

      const cardHTML = `

        <div class="creature-card ${carta.occupataInDifesa || carta.bloccataInDuello || pctVigore <= 0 ? 'occupata' : ''}">

          ${badgeHTML}

          <div class="card-name" style="${carta.occupataInDifesa || carta.bloccataInDuello || pctVigore <= 0 ? 'margin-top:45px;':''}">${carta.nome} ${carta.isJolly ? '' : `(${carta.stelle} ★)`}</div>

          <div class="card-icon">${carta.immagine}</div>

          <div class="card-stats">

            <div class="stat-line"><span class="stat-label">Vigore</span><span class="stat-val" style="color:${pctVigore > 30 ? '#48bb78' : '#f56565'};">${pctVigore}%</span></div>

            <div class="stat-line"><span class="stat-label">Ferocia</span><span class="stat-val">${carta.statistiche.ferocia}</span></div>

            <div class="stat-line"><span class="stat-label">Balzo</span><span class="stat-val">${carta.statistiche.balzo}</span></div>

            <div class="stat-line"><span class="stat-label">Corazza</span><span class="stat-val">${carta.statistiche.corazza}</span></div>

            <div class="stat-line"><span class="stat-label">Istinto</span><span class="stat-val">${carta.statistiche.istinto}</span></div>

          </div>

          <div class="card-traits-container">${trattiHTML}</div>

          ${bottoneEvolviHTML}

        </div>`;

 

      modalGrid.insertAdjacentHTML("beforeend", cardHTML);

 

      if (!carta.isJolly && carta.stelle < 8 && !carta.bloccataInDuello && !carta.occupataInDifesa && pctVigore > 0) {

        document.getElementById(`btn-evo-act-${carta.id}`).addEventListener("click", () => {

          collectionModal.classList.add("hidden"); 

          apriFinestraEvoluzione(carta); 

        });

      }

    });

  }

  collectionModal.classList.remove("hidden");

}

let creaturaInEvoluzione = null;

let puntiDistribuzioneAssegnati = { ferocia: 0, balzo: 0, corazza: 0, istinto: 0 };

let valoreBonusStellaCorrente = 0;

function apriFinestraEvoluzione(carta) {

  creaturaInEvoluzione = carta;

  valoreBonusStellaCorrente = carta.livello === 1 ? 0.7 : carta.livello === 6 ? 0.3 : 0.6;

  puntiDistribuzioneAssegnati = { ferocia: 0, balzo: 0, corazza: 0, istinto: 0 };

 

  document.getElementById("evo-modal-title").innerText = `Evoluzione: ${carta.nome} (${carta.stelle} ★ → ${carta.stelle + 1} ★)`;

  let targetPreview = document.getElementById("evo-target-preview");

  targetPreview.innerHTML = `

    <div style="font-weight:bold; font-size:1.1rem; color:#ffcc66;">${carta.immagine} ${carta.nome}</div>

    <div style="font-size:0.8rem; color:#aaa; margin-top:4px;">F: ${carta.statistiche.ferocia} | B: ${carta.statistiche.balzo} | C: ${carta.statistiche.corazza} | I: ${carta.statistiche.istinto}</div>`;

 

  aggiornaInterfacciaPuntiEvo(); 

  popolaSelectSacrifici();

  document.getElementById("evolution-modal").classList.remove("hidden");

}

  // ==========================================

// MYTHOPHEDIA - SCRIPT.JS - BLOCCO 11

// ==========================================

function popolaSelectSacrifici() {

  let valoriSelezionati = [];

  for (let i = 0; i < 4; i++) {

    const s = document.getElementById(`sacr-slot-${i}`);

    if (s && s.value) valoriSelezionati.push(s.value);

  }

 

  let lvlRichiesto = creaturaInEvoluzione.livello === 1 ? 1 : creaturaInEvoluzione.livello - 1;

  let stelleRichieste = creaturaInEvoluzione.stelle;

  let poolIdonee = deckGiocatore.filter(c => c.id !== creaturaInEvoluzione.id && c.livello === lvlRichiesto && (c.isJolly || c.stelle === stelleRichieste) && !c.occupataInDifesa && !c.bloccataInDuello && calcolaVigorePercentuale(c) > 0);

  for (let i = 0; i < 4; i++) {

    const select = document.getElementById(`sacr-slot-${i}`);

    if (!select) continue;

    const currentVal = select.value; 

    select.innerHTML = '<option value="">-- Seleziona Creatura --</option>';

    poolIdonee.forEach(carta => {

      if (valoriSelezionati.includes(carta.id) && carta.id !== currentVal) return;

      const option = document.createElement("option");

      option.value = carta.id; 

      option.innerText = carta.isJolly ? `${carta.immagine} ${carta.nome} (Evolutivo)` : `${carta.immagine} ${carta.nome} (Lvl ${carta.livello} - ${carta.stelle} ★)`;

      if (carta.id === currentVal) option.selected = true;

      select.appendChild(option);

    });

    select.removeEventListener("change", gestisciCambioSelectSacrifici);

    select.addEventListener("change", gestisciCambioSelectSacrifici);

  }

  validaEvoluzioneCompleta();

}

function gestisciCambioSelectSacrifici() { popolaSelectSacrifici(); }

function aggiornaInterfacciaPuntiEvo() {

  let spesi = puntiDistribuzioneAssegnati.ferocia + puntiDistribuzioneAssegnati.balzo + puntiDistribuzioneAssegnati.corazza + puntiDistribuzioneAssegnati.istinto;

  let rimasti = parseFloat((valoreBonusStellaCorrente - spesi).toFixed(1));

  document.getElementById("evo-pts-remaining").innerText = rimasti.toFixed(1);

 

  const container = document.getElementById("evo-stats-distribution-container"); 

  container.innerHTML = "";

  const caratteristiche = ["ferocia", "balzo", "corazza", "istinto"];

 

  caratteristiche.forEach(stat => {

    let valBase = creaturaInEvoluzione.statistiche[stat]; 

    let valAggiunto = puntiDistribuzioneAssegnati[stat]; 

    let valFinale = parseFloat((valBase + valAggiunto).toFixed(1));

    let row = document.createElement("div"); 

    row.style = "display:grid; grid-template-columns: 1fr 100px auto; align-items:center; color:#fff; font-size:0.85rem;";

    row.innerHTML = `

      <span><strong style="text-transform:capitalize;">${stat}:</strong> ${valBase} → <span style="color:#ecc94b; font-weight:bold;">${valFinale}</span></span>

      <span style="color:#2f855a; font-weight:bold; text-align:center;">(+${valAggiunto.toFixed(1)})</span>

      <div style="display:flex; gap:5px;">

        <button type="button" class="attack-btn" id="btn-evo-min-${stat}" style="padding:2px 8px; width:auto; margin:0; background:#742a2a;">-</button>

        <button type="button" class="attack-btn" id="btn-evo-pls-${stat}" style="padding:2px 8px; width:auto; margin:0; background:#22543d;">+</button>

      </div>`;

    container.appendChild(row);

 

    document.getElementById(`btn-evo-min-${stat}`).addEventListener("click", (e) => { 

      e.preventDefault(); 

      if (puntiDistribuzioneAssegnati[stat] > 0) { 

        puntiDistribuzioneAssegnati[stat] = parseFloat((puntiDistribuzioneAssegnati[stat] - 0.1).toFixed(1)); 

        aggiornaInterfacciaPuntiEvo(); 

      }

    });

    document.getElementById(`btn-evo-pls-${stat}`).addEventListener("click", (e) => { 

      e.preventDefault(); 

      if (rimasti > 0) { 

        puntiDistribuzioneAssegnati[stat] = parseFloat((puntiDistribuzioneAssegnati[stat] + 0.1).toFixed(1)); 

        aggiornaInterfacciaPuntiEvo(); 

      } 

    });

  });

  validaEvoluzioneCompleta();

}

function validaEvoluzioneCompleta() {

  const btnConferma = document.getElementById("btn-conferma-evoluzione"); 

  if (!btnConferma) return;

  let sacrificiScelti = []; 

  let sacrificiValidi = true;

  for (let i = 0; i < 4; i++) {

    const el = document.getElementById(`sacr-slot-${i}`);

    const val = el ? el.value : "";

    if (!val || sacrificiScelti.includes(val)) sacrificiValidi = false; 

    else sacrificiScelti.push(val);

  }

  let spesi = puntiDistribuzioneAssegnati.ferocia + puntiDistribuzioneAssegnati.balzo + puntiDistribuzioneAssegnati.corazza + puntiDistribuzioneAssegnati.istinto;

  let rimasti = parseFloat((valoreBonusStellaCorrente - spesi).toFixed(1));

  btnConferma.disabled = !(sacrificiValidi && rimasti === 0);

}

document.getElementById("btn-conferma-evoluzione").addEventListener("click", () => {

  let sacrificiIds = []; 

  for (let i = 0; i < 4; i++) { 

    sacrificiIds.push(document.getElementById(`sacr-slot-${i}`).value);

  }

 

  deckGiocatore = deckGiocatore.filter(c => !sacrificiIds.includes(c.id));

 

  ["ferocia", "balzo", "corazza", "istinto"].forEach(stat => { 

    creaturaInEvoluzione.statistiche[stat] = parseFloat((creaturaInEvoluzione.statistiche[stat] + puntiDistribuzioneAssegnati[stat]).toFixed(1)); 

  });

 

  creaturaInEvoluzione.stelle += 1; 

  aggiornaPulsantiLateraliRarita();

 

  document.getElementById("evolution-modal").classList.add("hidden");

  document.getElementById("battle-title-outcome").innerText = "Evoluzione Riuscita!";

  document.getElementById("battle-report-content").innerHTML = `

    <p>La tua creatura <strong>${creaturaInEvoluzione.immagine} ${creaturaInEvoluzione.nome}</strong> è ascesa al grado di <strong>${creaturaInEvoluzione.stelle} ★</strong>!</p>

    <p style='margin:10px 0; border-top:1px dashed #2f855a; padding-top:10px; color:#cbd5e0;'>I nuovi attributi personalizzati sono stati applicati con successo alla matrice matematica del server.</p>

  `;

  document.getElementById("battle-result-modal").classList.remove("hidden");

  aggiungiXP(15 * creaturaInEvoluzione.livello);

});

document.getElementById("close-evolution-modal").addEventListener("click", () => { 

  document.getElementById("evolution-modal").classList.add("hidden"); 

});

const SCHEMI_PACCHETTI = {

  1: { nome: "Spiriti della Terra", costo: 150, valuta: "dracme", descrizione: "3 Carte Comuni (Lvl 1)" },

  2: { nome: "Bestiario Ferale", costo: 350, valuta: "dracme", descrizione: "5 Comuni (Lvl 1) + 1 Non Comune (Lvl 2) garantita" },

  3: { nome: "Dono di Gea", costo: 500, valuta: "dracme", descrizione: "5 Carte miste (80% Lvl 1, 20% Lvl 2) + 1 Jolly Lvl 1" }

};

const SCHEMI_PACCHETTI_RESTO = {

  4: { nome: "Guardiani del Tempio", costo: 800, valuta: "dracme", descrizione: "4 Non Comuni (Lvl 2) + 5% possibilità Rara (Lvl 3)" },

  5: { nome: "Scommessa del Fato", costo: 1000, valuta: "dracme", descrizione: "1 Carta misteriosa (50% Lvl 1, 35% Lvl 2, 15% Lvl 3) + 2 Non Comuni garantite" },

  6: { nome: "Miti Incorrotti", costo: 1, valuta: "ambra", descrizione: "2 Rare (Lvl 3) garantite" },

  7: { nome: "Forze Primordiali", costo: 3, valuta: "ambra", descrizione: "1 Epica (Lvl 4) + 2 Rare (Lvl 3) garantite" },

  8: { nome: "Essenza dell'Evoluzione", costo: 4, valuta: "ambra", descrizione: "1 Carta Jolly Livello 2 + 1 Carta Jolly Livello 3" },

  9: { nome: "Flagello dei Cieli", costo: 8, valuta: "ambra", descrizione: "1 Mitica (Lvl 5) estratta dal pool supremo" },

  10: { nome: "Respiro del Drago", costo: 15, valuta: "ambra", descrizione: "1 Jolly Lvl 4 + 0.1% possibilità Drago Ancestrale (Lvl 6)" }

};

  // ==========================================

// MYTHOPHEDIA - SCRIPT.JS - BLOCCO 12

// ==========================================

function estraiCartaPerLivello(lvl, forzaJolly = false) {

  if (forzaJolly) {

    return {

      id: "jolly_" + lvl + "_" + Date.now() + "_" + Math.floor(Math.random()*10000),

      nome: `[JOLLY] Grado ${lvl}`, cultura: "", tratti: [], immagine: "✨", livello: lvl, stelle: 0,

      statistiche: { ferocia: 0.0, balzo: 0.0, corazza: 0.0, istinto: 0.0 }, isJolly: true,

      occupataInDifesa: false, coordinatePresidio: null, mondoPresidio: null, sottomondoPresidio: null, 

      bloccataInDuello: false, faticaMondo: 0, fatigueGuerra: 0, inizioRiposo: null, ultimoAggiornamentoFatica: null

    };

  }

  let pool = DATABASE_COMPLETO_1000.filter(c => c.livello === lvl);

  if (pool.length === 0) pool = DATABASE_LIVELLO_1;

  let ref = pool[Math.floor(Math.random() * pool.length)];

  let punti = lvl === 1 ? 8 : lvl === 2 ? 12 : lvl === 3 ? 16 : lvl === 4 ? 20 : lvl === 5 ? 24 : 28;

  return {

    id: "carta_" + lvl + "_" + Date.now() + "_" + Math.floor(Math.random()*10000),

    nome: ref.nome, cultura: ref.cultura, tratti: ref.tratti || ref.traits || [], immagine: ref.immagine, livello: lvl, stelle: 0,

    statistiche: generaStatisticheAsimmetriche(punti), isJolly: false,

    occupataInDifesa: false, coordinatePresidio: null, mondoPresidio: null, sottomondoPresidio: null, 

    bloccataInDuello: false, faticaMondo: 0, fatigueGuerra: 0, inizioRiposo: null, ultimoAggiornamentoFatica: null

  };

}

function acquistaPacchetto(id) {

  let pack = id <= 3 ? SCHEMI_PACCHETTI[id] : SCHEMI_PACCHETTI_RESTO[id];

  if (pack.valuta === "dracme" && dracmeAttuali < pack.costo) { alert("Dracme insufficienti!"); return; }

  if (pack.valuta === "ambra" && ambraAttuale < pack.costo) { alert("Frammenti d'Ambra insufficienti!"); return; }

  if (deckGiocatore.length >= slotMassimiDeck) { alert(`Deck pieno! Capienza: ${slotMassimiDeck}`); return; }

 

  if (pack.valuta === "dracme") { 

    dracmeAttuali -= pack.costo; 

    document.getElementById("dracme-count").innerText = dracmeAttuali; 

    aggiungiXP(2); 

  } else { 

    ambraAttuale -= pack.costo; 

    document.getElementById("ambra-count").innerText = ambraAttuale; 

    aggiungiXP(10); 

  }

 

  let nuoveCarte = [];

  if (id === 1) { for(let i=0; i<3; i++) nuoveCarte.push(estraiCartaPerLivello(1)); }

  else if (id === 2) { for(let i=0; i<5; i++) nuoveCarte.push(estraiCartaPerLivello(1)); nuoveCarte.push(estraiCartaPerLivello(2)); }

  else if (id === 3) { for(let i=0; i<5; i++) { let lvl = Math.random() < 0.8 ? 1 : 2; nuoveCarte.push(estraiCartaPerLivello(lvl)); } nuoveCarte.push(estraiCartaPerLivello(1, true)); }

  else if (id === 4) { for(let i=0; i<4; i++) nuoveCarte.push(estraiCartaPerLivello(2)); if(Math.random() < 0.05) nuoveCarte.push(estraiCartaPerLivello(3)); }

  else if (id === 5) { let r = Math.random(); let lvl = r < 0.5 ? 1 : r < 0.85 ? 2 : 3; nuoveCarte.push(estraiCartaPerLivello(lvl)); nuoveCarte.push(estraiCartaPerLivello(2)); nuoveCarte.push(estraiCartaPerLivello(2)); }

  else if (id === 6) { nuoveCarte.push(estraiCartaPerLivello(3), estraiCartaPerLivello(3)); }

  else if (id === 7) { nuoveCarte.push(estraiCartaPerLivello(4), estraiCartaPerLivello(3), estraiCartaPerLivello(3)); }

  else if (id === 8) { nuoveCarte.push(estraiCartaPerLivello(2, true), estraiCartaPerLivello(3, true)); }

  else if (id === 9) { nuoveCarte.push(estraiCartaPerLivello(5)); }

  else if (id === 10) { nuoveCarte.push(estraiCartaPerLivello(4, true)); if(Math.random() < 0.001) nuoveCarte.push(estraiCartaPerLivello(6)); }

 

  deckGiocatore = deckGiocatore.concat(nuoveCarte);

  aggiornaPulsantiLateraliRarita();

  document.getElementById("battle-title-outcome").innerText = "Spacchettamento!";

  let cartineFlipHTML = nuoveCarte.map((c, idx) => {

    let raro = c.livello >= 3 ? " rare-glow" : "";

    return `

      <div class="pack-flip-card${raro}" id="pack-flip-${idx}">

        <div class="pack-flip-inner">

          <div class="pack-flip-front">🎴</div>

          <div class="pack-flip-back">

            <div style="font-size:1.8rem;">${c.immagine}</div>

            <div style="font-size:0.65rem; font-weight:bold; margin-top:4px; line-height:1.1;">${c.nome}</div>

            <div style="font-size:0.6rem; color:#c9a054; margin-top:2px;">Lvl ${c.livello}</div>

          </div>

        </div>

      </div>`;

  }).join("");

  document.getElementById("battle-report-content").innerHTML = `

    <p style="text-align:center;">Hai acquistato il pacchetto <strong>${pack.nome}</strong>!</p>

    <div class="pack-flip-row">${cartineFlipHTML}</div>

  `;

  document.getElementById("battle-result-modal").classList.remove("hidden");

  nuoveCarte.forEach((c, idx) => {

    setTimeout(() => {

      const el = document.getElementById(`pack-flip-${idx}`);

      if (el) el.classList.add("flipped");

    }, 500 + idx * 450);

  });

}

document.getElementById("btn-mercato").addEventListener("click", () => {

  modalGrid.innerHTML = ""; 

  modalTitle.innerText = "Mercato Generale - Acquista Pacchetti";

 

  const slotCardHTML = `

    <div class="creature-card" style="justify-content: space-between; text-align: center; padding: 15px; height: 100%; border-color: #ffb703;">

      <div class="card-name" style="color: #ffb703; font-size: 1rem;">Espansione Deck</div>

      <div class="card-icon" style="font-size: 2rem; margin: 10px 0;">📦</div>

      <p style="font-size: 0.75rem; color: #cbd5e0; margin-bottom: 10px; font-family: sans-serif; min-height: 40px;">Aggiunge immediatamente +5 slot massimi per conservare le tue carte.</p>

      <button type="button" class="attack-btn" id="buy-slots-btn" style="padding: 8px; font-size: 0.75rem; margin-top: auto; background: linear-gradient(to bottom, #2b6cb0, #2b4c7e); border-color: #2b4c7e;">5000 🪙</button>

    </div>`;

  modalGrid.insertAdjacentHTML("beforeend", slotCardHTML);

 

  const tuttiI_Pacchetti = Object.assign({}, SCHEMI_PACCHETTI, SCHEMI_PACCHETTI_RESTO);

  Object.keys(tuttiI_Pacchetti).forEach(id => {

    const p = tuttiI_Pacchetti[id]; 

    const iconaValuta = p.valuta === "dracme" ? "🪙" : "💎";

    const cardHTML = `

      <div class="creature-card" style="justify-content: space-between; text-align: center; padding: 15px; height: 100%;">

        <div class="card-name" style="color: #ffb703; font-size: 1rem;">${p.nome}</div>

        <div class="card-icon" style="font-size: 2rem; margin: 10px 0;">✨</div>

        <p style="font-size: 0.75rem; color: #cbd5e0; margin-bottom: 10px; font-family: sans-serif; min-height: 40px;">${p.descrizione}</p>

        <button type="button" class="attack-btn" id="buy-pack-${id}" style="padding: 8px; font-size: 0.75rem; margin-top: auto;">${p.costo} ${iconaValuta}</button>

      </div>`;

    modalGrid.insertAdjacentHTML("beforeend", cardHTML);

  });

 

  document.getElementById("buy-slots-btn").addEventListener("click", () => { 

    if (dracmeAttuali < 5000) { alert("Dracme insufficienti!"); return; } 

    dracmeAttuali -= 5000; slotMassimiDeck += 5; 

    document.getElementById("dracme-count").innerText = dracmeAttuali; 

    aggiornaPulsantiLateraliRarita(); 

    alert(`Espanso! Massimi: ${slotMassimiDeck}`); 

  });

 

  Object.keys(tuttiI_Pacchetti).forEach(id => { 

    document.getElementById(`buy-pack-${id}`).addEventListener("click", () => acquistaPacchetto(parseInt(id))); 

  });

  collectionModal.classList.remove("hidden");

});

  // ==========================================

// MYTHOPHEDIA - SCRIPT.JS - BLOCCO 13

// ==========================================

function apriPannelloProfiloEvocatore() {

  document.getElementById("battle-title-outcome").innerText = "Profilo Evocatore";

  document.getElementById("battle-report-content").innerHTML = `

    <div style="display:flex; flex-direction:column; gap:15px; padding:10px; font-family:sans-serif; align-items:center;">

      <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">

        <div id="profile-avatar-preview" style="width: 100px; height: 100px; border-radius: 50%; border: 2px solid #c9a054; background-size: cover; background-position: center; background-image: url('${localStorage.getItem("user_avatar") || ""}'); display: flex; align-items: center; justify-content: center; background-color: #1a1a24; color: #718096; font-size: 0.8rem; text-align: center;">

          ${localStorage.getItem("user_avatar") ? "" : "Nessuna Foto"}

        </div>

        <button id="btn-upload-avatar" type="button" class="attack-btn" style="padding: 5px 10px; font-size: 0.75rem; margin: 0; width: auto; background: #2d3748; border-color: #4a5568;">Carica Foto / JPEG</button>

        <input type="file" id="input-avatar-file" accept="image/jpeg, image/png, image/jpg" style="display: none;">

      </div>

      <div style="width: 100%;">

        <label style="color:#c9a054; font-weight:bold; display:block; margin-bottom:5px; font-family:Cinzel;">NICKNAME EVOCATORE:</label>

        <input type="text" id="edit-profile-nickname" class="deploy-select" value="${nicknameUtente}" style="font-size:1rem; padding:8px;">

      </div>

      <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:6px; border:1px solid #5c4d31; width: 100%;">

        <p style="color:#fff; margin-bottom:4px;"><strong>Livello Attuale:</strong> ${livelloGiocatore}</p>

        <p style="color:#aaa; font-size:0.85rem;"><strong>Esperienza accumulata:</strong> ${xpAttuali} / ${SOGLIE_XP[livelloGiocatore]} XP</p>

        <p style="color:#cbd5e0; font-size:0.85rem; margin-top:4px;"><strong>Capacità Totale Deck:</strong> ${deckGiocatore.length} / ${slotMassimiDeck} carte</p>

      </div>

      <div style="width: 100%;">

        <label style="color:#c9a054; font-weight:bold; display:block; margin-bottom:5px; font-family:Cinzel;">FRASE DI PRESENTAZIONE:</label>

        <textarea id="edit-profile-presentation" class="deploy-select" style="font-size:0.9rem; padding:8px; height:80px; resize:none;">${presentationUtente}</textarea>

      </div>

      <button id="btn-save-profile-data" class="attack-btn" style="padding:10px; font-size:0.85rem; margin-top:5px; background:linear-gradient(to bottom, #2f855a, #22543d); border-color:#22543d; width: 100%;">Salva Modifiche Profilo</button>

    </div>`;

 

  document.getElementById("battle-result-modal").classList.remove("hidden");

 

  const btnUpload = document.getElementById("btn-upload-avatar");

  const inputAvatar = document.getElementById("input-avatar-file");

  const avatarPreview = document.getElementById("profile-avatar-preview");

 

  btnUpload.addEventListener("click", () => { inputAvatar.click(); });

 

  inputAvatar.addEventListener("change", (e) => {

    const file = e.target.files[0];

    if (file) {

      if (file.size > 2 * 1024 * 1024) { alert("L'immagine è troppo grande! Massimo 2MB."); return; }

      const reader = new FileReader();

      reader.onload = function(event) {

        const base64Image = event.target.result;

        avatarPreview.style.backgroundImage = `url('${base64Image}')`;

        avatarPreview.innerText = "";

        localStorage.setItem("user_avatar_temp", base64Image);

      };

      reader.readAsDataURL(file);

    }

  });

 

  document.getElementById("btn-save-profile-data").addEventListener("click", () => {

    const nuovoNick = document.getElementById("edit-profile-nickname").value.trim();

    const nuovaPres = document.getElementById("edit-profile-presentation").value.trim();

    if (!nuovoNick) { alert("Il nickname non può essere vuoto!"); return; }

 

    const tempAvatar = localStorage.getItem("user_avatar_temp");

    if (tempAvatar) { localStorage.setItem("user_avatar", tempAvatar); localStorage.removeItem("user_avatar_temp"); }

 

    nicknameUtente = nuovoNick; presentationUtente = nuovaPres;

    document.querySelectorAll(".clickable-topbar-profile").forEach(el => el.innerText = nicknameUtente);

    const elProfiloBtn = document.getElementById("btn-profilo"); 

    if (elProfiloBtn) elProfiloBtn.innerText = nicknameUtente;

 

    alert("Profilo aggiornato con successo!"); document.getElementById("battle-result-modal").classList.add("hidden");

  });

}

document.getElementById("btn-profilo").addEventListener("click", apriPannelloProfiloEvocatore);

function renderEmblemaClan(valore, dimensionePx) {

  if (typeof valore === "string" && valore.startsWith("data:image")) {

    return `<img src="${valore}" style="width:${dimensionePx}px; height:${dimensionePx}px; border-radius:50%; object-fit:cover; vertical-align:middle;">`;

  }

  return valore;

}

function renderizzaListaClanReclutamento() {

  const container = document.getElementById("clan-available-list");

  if (!container) return;

  container.innerHTML = "";

  listaClanGlobali.forEach(clan => {

    const cardHTML = `

      <div class="clan-card-bacheca">

        <div class="clan-card-details">

          <div class="clan-card-title"><span>${renderEmblemaClan(clan.emblema, 22)}</span> ${clan.nome}</div>

          <div class="clan-card-motto">"${clan.motto}"</div>

          <div class="clan-card-meta">Membri: <strong>${clan.membri.length}/20</strong></div>

        </div>

        <button type="button" class="attack-btn" id="join-clan-btn-${clan.id}" style="padding: 6px 12px; font-size: 0.75rem; width: auto; margin: 0;">Unisciti</button>

      </div>`;

    container.insertAdjacentHTML("beforeend", cardHTML);

    document.getElementById(`join-clan-btn-${clan.id}`).addEventListener("click", () => { uniscitiAClanEsistente(clan.id); });

  });

}

function uniscitiAClanEsistente(clanId) {

  let clan = listaClanGlobali.find(c => c.id === clanId);

  if (!clan) return;

  if (clan.membri.length >= 20) { alert("Questo Clan è già al completo!"); return; }

  clan.membri.push({ nome: nicknameUtente + " (Tu)", rank: "soldato" });

  clanMioAttuale = clan;

  aggiornaVisualizzazioneClan();

  alert(`Ti sei unito con successo al clan: ${clan.nome}!`);

}

document.getElementById("btn-crea-clan-conferma")?.addEventListener("click", () => {

  const nomeInput = document.getElementById("clan-creation-name").value.trim();

  const emblemaInput = clanEmblemaCaricato || document.getElementById("clan-creation-emblem").value;

  const mottoInput = document.getElementById("clan-creation-motto").value.trim();

  const r1 = document.getElementById("clan-creation-rule1").value.trim();

  const r2 = document.getElementById("clan-creation-rule2").value.trim();

  const r3 = document.getElementById("clan-creation-rule3").value.trim();

 

  if (!nomeInput || !mottoInput || !r1 || !r2 || !r3) {

    alert("Compila tutti i campi per fondare il tuo Clan!");

    return;

  }

 

  let nuovoClan = {

    id: "clan_utente_" + Date.now(),

    nome: nomeInput,

    emblema: emblemaInput,

    motto: mottoInput,

    regole: [r1, r2, r3],

    membri: [{ nome: nicknameUtente + " (Tu)", rank: "comandante" }],

    isBot: false,

    fazioneId: "alleato",

    assedioAttivo: false, chat: [],

    oracoloHex: null

  };

 

  listaClanGlobali.push(nuovoClan);

  clanMioAttuale = nuovoClan;

  aggiornaVisualizzazioneClan();

  alert(`Il Clan "${nuovoClan.nome}" è stato fondato! Sei il Comandante.`);

});

let clanEmblemaCaricato = null;

document.getElementById("btn-apri-form-clan")?.addEventListener("click", () => {

  document.getElementById("clan-creation-intro").classList.add("hidden");

  document.getElementById("clan-creation-form").classList.remove("hidden");

});

document.getElementById("btn-upload-clan-emblem")?.addEventListener("click", () => {

  document.getElementById("clan-emblem-file").click();

});

document.getElementById("clan-emblem-file")?.addEventListener("change", (e) => {

  const file = e.target.files[0];

  if (!file) return;

  if (file.size > 2 * 1024 * 1024) { alert("L'immagine è troppo grande! Massimo 2MB."); return; }

  const reader = new FileReader();

  reader.onload = function(event) {

    clanEmblemaCaricato = event.target.result;

    const preview = document.getElementById("clan-emblem-preview");

    preview.style.backgroundImage = `url('${clanEmblemaCaricato}')`;

    preview.innerText = "";

  };

  reader.readAsDataURL(file);

});

  // ==========================================

// MYTHOPHEDIA - SCRIPT.JS - BLOCCO 14

// ==========================================

function aggiornaVisualizzazioneClan() {

  const setupScreen = document.getElementById("clan-join-creation-view");

  const dashScreen = document.getElementById("clan-dashboard-view");

 

  if (!clanMioAttuale) {

    setupScreen.classList.remove("hidden");

    dashScreen.classList.add("hidden");

    renderizzaListaClanReclutamento();

  } else {

    setupScreen.classList.add("hidden");

    dashScreen.classList.remove("hidden");

    document.getElementById("clan-info-emblem").innerHTML = renderEmblemaClan(clanMioAttuale.emblema, 48);

    document.getElementById("clan-info-name").innerText = clanMioAttuale.nome;

    document.getElementById("clan-info-motto").innerText = `"${clanMioAttuale.motto}"`;

    document.getElementById("clan-info-count").innerText = clanMioAttuale.membri.length;

 

    const rulesContainer = document.getElementById("clan-info-rules");

    rulesContainer.innerHTML = clanMioAttuale.regole.map((r, i) => `<li><strong>${i+1}.</strong> ${r}</li>`).join("");

 

    const membersContainer = document.getElementById("clan-members-list");

    membersContainer.innerHTML = "";

    let ruoloAttualeVis = getRuoloGiocatore();

    clanMioAttuale.membri.forEach(m => {

      let isLeaderClass = (m.rank === "comandante" || m.rank === "capitano") ? "leader" : "";

      let eIlGiocatore = m.nome.includes("(Tu)");

      let btnDonaHTML = eIlGiocatore ? "" : `<button type="button" class="attack-btn btn-dona-membro" data-nome="${m.nome}" style="width:auto; padding:3px 10px; font-size:0.7rem;">Dona</button>`;

      let promozioneHTML = "";

      if (ruoloAttualeVis === "comandante" && m.rank !== "comandante") {

        promozioneHTML = `<select class="deploy-select promuovi-membro-select" data-nome="${m.nome}" style="width:auto; padding:2px 4px; font-size:0.7rem;">

          <option value="soldato" ${m.rank === "soldato" ? "selected" : ""}>Soldato</option>

          <option value="sergente" ${m.rank === "sergente" ? "selected" : ""}>Sergente</option>

          <option value="capitano" ${m.rank === "capitano" ? "selected" : ""}>Capitano</option>

        </select>`;

      }

      const rowHTML = `

        <div class="clan-member-row ${isLeaderClass}">

          <span class="clan-member-name">${m.nome}</span>

          <span class="clan-member-rank ${m.rank}">${m.rank}</span>

          ${promozioneHTML}

          ${btnDonaHTML}

        </div>`;

      membersContainer.insertAdjacentHTML("beforeend", rowHTML);

    });

    membersContainer.querySelectorAll(".btn-dona-membro").forEach(btn => {

      btn.addEventListener("click", () => apriModaleDonazione(btn.dataset.nome));

    });

    membersContainer.querySelectorAll(".promuovi-membro-select").forEach(sel => {

      sel.addEventListener("change", (e) => promuoviMembro(sel.dataset.nome, e.target.value));

    });

 

    const ruolo = getRuoloGiocatore();

    const poteriContainer = document.getElementById("clan-poteri-comando");

    let poteriDashHTML = "";

    if (ruolo === "comandante") {

      let assedioAttivoOra = clanMioAttuale.assedioAttivo && Date.now() < (clanMioAttuale.assedioScadenza || 0);

      poteriDashHTML += `<button type="button" class="attack-btn" id="btn-potere-assedio" style="font-size:0.75rem; padding:8px;">⚔️ Dichiarazione d'Assedio${assedioAttivoOra ? " (Attiva)" : ""}</button>`;

    }

    if (ruolo === "capitano") {

      poteriDashHTML += `<button type="button" class="attack-btn" id="btn-potere-staffetta" style="font-size:0.75rem; padding:8px;">🐎 Staffetta Logistica (-1h fatica, 50 Dracme)</button>`;

    }

    if (ruolo === "sergente") {

      poteriDashHTML += `<p style="color:#c9a054; font-size:0.75rem; text-align:center;">🛒 Supervisore del Mercato: le tue donazioni non costano Frammenti d'Ambra.</p>`;

    }

    poteriContainer.innerHTML = poteriDashHTML;

    document.getElementById("btn-potere-assedio")?.addEventListener("click", attivaAssedio);

    document.getElementById("btn-potere-staffetta")?.addEventListener("click", attivaStaffettaLogistica);

    renderizzaChatClan();

  }

}

function apriModaleDonazione(nomeDestinatario) {

  if (donazioneFattaOggi) { alert("Hai già donato una carta oggi. Riprova domani!"); return; }

  if (ambraAttuale < 1 && getRuoloGiocatore() !== "sergente") { alert("Non hai abbastanza Frammenti d'Ambra!"); return; }

  donazioneDestinatarioCorrente = nomeDestinatario;

  document.getElementById("donation-target-name").innerText = nomeDestinatario;

  const select = document.getElementById("donation-card-select");

  select.innerHTML = '<option value="">-- Seleziona --</option>';

  deckGiocatore.filter(c => !c.isJolly && (c.livello === 1 || c.livello === 2)).forEach(carta => {

    const option = document.createElement("option");

    option.value = carta.id;

    option.innerText = `${carta.immagine} ${carta.nome} (Lvl ${carta.livello})`;

    select.appendChild(option);

  });

  document.getElementById("btn-conferma-donazione").disabled = true;

  document.getElementById("donation-modal").classList.remove("hidden");

}

document.getElementById("donation-card-select")?.addEventListener("change", (e) => {

  document.getElementById("btn-conferma-donazione").disabled = !e.target.value;

});

document.getElementById("close-donation-modal")?.addEventListener("click", () => {

  document.getElementById("donation-modal").classList.add("hidden");

});

document.getElementById("btn-conferma-donazione")?.addEventListener("click", () => {

  const cardId = document.getElementById("donation-card-select").value;

  if (!cardId || donazioneFattaOggi) return;

  const carta = deckGiocatore.find(c => c.id === cardId);

  if (!carta) return;

  deckGiocatore = deckGiocatore.filter(c => c.id !== cardId);

  if (getRuoloGiocatore() !== "sergente") {

    ambraAttuale -= 1;

    document.getElementById("ambra-count").innerText = ambraAttuale;

  }

  donazioneFattaOggi = true;

  aggiornaPulsantiLateraliRarita();

  document.getElementById("donation-modal").classList.add("hidden");

  alert(`Hai donato ${carta.nome} a ${donazioneDestinatarioCorrente}!`);

});

document.getElementById("btn-abbandona-clan").addEventListener("click", () => {

  if (!clanMioAttuale) return;

  if (confirm(`Vuoi abbandonare il clan "${clanMioAttuale.nome}"?`)) {

    clanMioAttuale.membri = clanMioAttuale.membri.filter(m => !m.nome.includes(nicknameUtente));

    if (clanMioAttuale.membri.length === 0) {

      listaClanGlobali = listaClanGlobali.filter(c => c.id !== clanMioAttuale.id);

    }

    clanMioAttuale = null;

    aggiornaVisualizzazioneClan();

    alert("Hai abbandonato il clan.");

  }

});

document.getElementById("btn-clan").addEventListener("click", () => {

  aggiornaVisualizzazioneClan();

  document.getElementById("clan-modal").classList.remove("hidden");

});

document.getElementById("close-clan-modal").addEventListener("click", () => {

  document.getElementById("clan-modal").classList.add("hidden");

});

function generaMappaGuerra() {

  if (mappaGuerraClan.length > 0) return;

  for (let r = 0; r < RIGHE_MAPPA_GUERRA; r++) {

    let riga = [];

    for (let c = 0; c < COLONNE_MAPPA_GUERRA; c++) {

      let terreno = TIPI_TERRENO[Math.floor(Math.random() * TIPI_TERRENO.length)];

      let fazione = "neutro";

      let tipoSettore = "normale";

      let rendimento = 1;

 

      if (r === 0 && c === 0) { fazione = "alleato"; tipoSettore = "base"; rendimento = 0; }

      else if (r === 0 && c === COLONNE_MAPPA_GUERRA - 1) { fazione = "bot1"; tipoSettore = "base"; rendimento = 0; }

      else if (r === RIGHE_MAPPA_GUERRA - 1 && c === 0) { fazione = "bot2"; tipoSettore = "base"; rendimento = 0; }

      else if (r === RIGHE_MAPPA_GUERRA - 1 && c === COLONNE_MAPPA_GUERRA - 1) { fazione = "bot3"; tipoSettore = "base"; rendimento = 0; }

      else if (r === Math.floor(RIGHE_MAPPA_GUERRA / 2) && c === Math.floor(COLONNE_MAPPA_GUERRA / 2)) { tipoSettore = "cittadella"; rendimento = 30; }

      else if ((r === 2 && c === 2) || (r === 2 && c === COLONNE_MAPPA_GUERRA - 3) || (r === RIGHE_MAPPA_GUERRA - 3 && c === 2) || (r === RIGHE_MAPPA_GUERRA - 3 && c === COLONNE_MAPPA_GUERRA - 3)) { tipoSettore = "avamposto"; rendimento = 10; }

 

      let poolCaratteristiche = ["ferocia", "balzo", "corazza", "istinto"];

      let statsAttive = [];

      if (tipoSettore === "cittadella") {

        statsAttive = ["ferocia", "balzo", "corazza", "istinto"];

      } else if (tipoSettore === "avamposto") {

        statsAttive = [...poolCaratteristiche].sort(() => 0.5 - Math.random()).slice(0, 2);

      } else {

        statsAttive = [poolCaratteristiche[Math.floor(Math.random() * poolCaratteristiche.length)]];

      }

 

      let numMazziDifesa = 0;

      if (tipoSettore === "cittadella") numMazziDifesa = 3 + Math.floor(Math.random() * 3);

      else if (tipoSettore === "avamposto") numMazziDifesa = 2 + Math.floor(Math.random() * 3);

      else if (tipoSettore === "normale") numMazziDifesa = 1;

      let guarnigioni = [];

      for (let g = 0; g < numMazziDifesa; g++) {

        let mazzo = [];

        for (let m = 0; m < 5; m++) {

          let ref = DATABASE_LIVELLO_1[Math.floor(Math.random() * DATABASE_LIVELLO_1.length)];

          mazzo.push({ nome: ref.nome, immagine: ref.immagine, statistiche: generaStatisticheAsimmetriche(8), tratti: ref.tratti || [], proprietario: "Mostri Selvatici" });

        }

        guarnigioni.push(mazzo);

      }

 

      riga.push({ r: r, c: c, terrain: terreno, fazione: fazione, tipo: tipoSettore, yield: rendimento, guarnigioni: guarnigioni, statsGuerra: statsAttive, haMarchioPredatore: false, predatoreScadenza: 0, oracoloScadenza: 0 });

    }

    mappaGuerraClan.push(riga);

  }

}

function renderizzaMappaGuerraVisiva() {

  const grid = document.getElementById("clan-war-hex-grid");

  if (!grid) return;

  grid.innerHTML = "";

 

  mappaGuerraClan.forEach((rigaDati) => {

    const rowDiv = document.createElement("div");

    rowDiv.className = "hex-row";

    rigaDati.forEach((esagono) => {

      const hexDiv = document.createElement("div");

      let classeFazione = "hex-" + esagono.terrain.toLowerCase();

      if (esagono.tipo === "base") classeFazione = "hex-fazione-" + esagono.fazione;

      else if (esagono.fazione !== "neutro") classeFazione = "hex-fazione-" + esagono.fazione;

      

      hexDiv.className = "hexagon " + classeFazione;

      hexDiv.id = `war-hex-cell-${esagono.r}-${esagono.c}`;

      

      if (esagono.tipo === "cittadella") hexDiv.innerText = "👑";

      else if (esagono.tipo === "avamposto") hexDiv.innerText = "🏰";

      else if (esagono.tipo === "base") hexDiv.innerText = "⛺";

      else hexDiv.innerText = esagono.r + "," + esagono.c;

      if ((esagono.tipo === "cittadella" || esagono.tipo === "avamposto") && esagono.guarnigioni.length > 1) {

        hexDiv.innerText += ` x${esagono.guarnigioni.length}`;

      }

 

      hexDiv.addEventListener("click", () => {

        document.querySelectorAll("#clan-war-hex-grid .hexagon").forEach(h => h.classList.remove("selected"));

        hexDiv.classList.add("selected");

        esagonoGuerraSelezionatoDati = esagono;

        mostraDettagliEsagonoGuerra(esagono);

      });

      rowDiv.appendChild(hexDiv);

    });

    grid.appendChild(rowDiv);

  });

}

function getRuoloGiocatore() {

  if (!clanMioAttuale) return null;

  const io = clanMioAttuale.membri.find(m => m.nome.includes("(Tu)"));

  return io ? io.rank : null;

}

function attivaAssedio() {

  if (clanMioAttuale.assedioAttivo && Date.now() < (clanMioAttuale.assedioScadenza || 0)) {

    alert("La Dichiarazione d'Assedio è già attiva!");

    return;

  }

  clanMioAttuale.assedioAttivo = true;

  clanMioAttuale.assedioScadenza = Date.now() + 24 * 60 * 60 * 1000;

  alert("Dichiarazione d'Assedio attivata! Per 24 ore, tutti gli attacchi in guerra costano metà della Fatica.");

  aggiornaVisualizzazioneClan();

}

function attivaStaffettaLogistica() {

  if (dracmeAttuali < 50) { alert("Non hai abbastanza Dracme (servono 50)!"); return; }

  let candidati = deckGiocatore.filter(c => !c.isJolly && (c.faticaMondo > 0 || c.fatigueGuerra > 0));

  if (candidati.length === 0) { alert("Nessuna delle tue creature ha bisogno di riposo in questo momento!"); return; }

  candidati.sort((a, b) => Math.max(b.faticaMondo, b.fatigueGuerra) - Math.max(a.faticaMondo, a.fatigueGuerra));

  const carta = candidati[0];

  controllaERinfrescaFatica(carta);

  if (carta.ultimoAggiornamentoFatica) carta.ultimoAggiornamentoFatica -= 60 * 60 * 1000;

  dracmeAttuali -= 50;

  document.getElementById("dracme-count").innerText = dracmeAttuali;

  alert(`Staffetta Logistica: hai donato 1 ora di riduzione fatica a ${carta.nome}!`);

}

function promuoviMembro(nomeMembro, nuovoRank) {

  if (getRuoloGiocatore() !== "comandante") return;

  const m = clanMioAttuale.membri.find(x => x.nome === nomeMembro);

  if (!m || m.rank === nuovoRank) return;

  if (nuovoRank === "capitano") {

    let conteggio = clanMioAttuale.membri.filter(x => x.rank === "capitano").length;

    if (conteggio >= 3) { alert("Puoi avere al massimo 3 Capitani! Degrada prima qualcun altro."); aggiornaVisualizzazioneClan(); return; }

  }

  if (nuovoRank === "sergente") {

    let conteggio = clanMioAttuale.membri.filter(x => x.rank === "sergente").length;

    if (conteggio >= 5) { alert("Puoi avere al massimo 5 Sergenti! Degrada prima qualcun altro."); aggiornaVisualizzazioneClan(); return; }

  }

  let vecchioRank = m.rank;

  m.rank = nuovoRank;

  clanMioAttuale.chat.push({ autore: "Sistema", testo: `${m.nome} è stato promosso da ${vecchioRank} a ${nuovoRank}.`, sistema: true });

  aggiornaVisualizzazioneClan();

}

const RISPOSTE_CHAT_BOT = [

  "Ottima notizia, comandante!", "Io sono pronto per la prossima guerra.", "Qualcuno ha carte di Livello 2 da scambiare?",

  "Bel colpo nell'ultimo assedio!", "Aspetto il reset settimanale con ansia.", "Concordo pienamente.",

  "Ho appena evoluto una nuova creatura, top!", "Dobbiamo difendere meglio gli avamposti questa settimana."

];

function renderizzaChatClan() {

  const box = document.getElementById("clan-chat-messages");

  if (!clanMioAttuale.chat) clanMioAttuale.chat = [];

  box.innerHTML = clanMioAttuale.chat.map(msg => {

    if (msg.sistema) return `<div style="text-align:center; color:#c9a054; font-style:italic; font-size:0.72rem;">${msg.testo}</div>`;

    let colore = msg.mio ? "#ffcc66" : "#a0d8ef";

    return `<div><strong style="color:${colore};">${msg.autore}:</strong> <span style="color:#e0d5c1;">${msg.testo}</span></div>`;

  }).join("");

  box.scrollTop = box.scrollHeight;

}

function inviaMessaggioChatClan() {

  const input = document.getElementById("clan-chat-input");

  const testo = input.value.trim();

  if (!testo || !clanMioAttuale) return;

  if (!clanMioAttuale.chat) clanMioAttuale.chat = [];

  clanMioAttuale.chat.push({ autore: nicknameUtente, testo: testo, mio: true });

  input.value = "";

  renderizzaChatClan();

  const altriMembri = clanMioAttuale.membri.filter(m => !m.nome.includes("(Tu)"));

  if (altriMembri.length > 0 && Math.random() < 0.7) {

    setTimeout(() => {

      if (!clanMioAttuale || !clanMioAttuale.chat) return;

      const autoreBot = altriMembri[Math.floor(Math.random() * altriMembri.length)];

      const rispostaBot = RISPOSTE_CHAT_BOT[Math.floor(Math.random() * RISPOSTE_CHAT_BOT.length)];

      clanMioAttuale.chat.push({ autore: autoreBot.nome, testo: rispostaBot, mio: false });

      renderizzaChatClan();

    }, 1200 + Math.random() * 1800);

  }

}

document.getElementById("btn-invia-chat-clan")?.addEventListener("click", inviaMessaggioChatClan);

const CAPITOLI_GUIDA = [

  { id: "creature", titolo: "🃏 Le Creature", html: `<h3>Il Bestiario</h3><p>1000 creature uniche, ispirate alle mitologie e al folklore reale (greca, norrena, giapponese, azteca, celtica...), divise in 6 Livelli di rarità:</p><ul><li><strong>Livello 1 (Comuni):</strong> 500 carte, piccoli spiriti e folletti.</li><li><strong>Livello 2 (Non Comuni):</strong> 270 carte, bestie feroci.</li><li><strong>Livello 3 (Rare):</strong> 110 carte, mostri iconici.</li><li><strong>Livello 4 (Epiche):</strong> 80 carte, forze della natura.</li><li><strong>Livello 5 (Mitiche):</strong> 34 carte, flagelli divini.</li><li><strong>Livello 6 (Leggendarie):</strong> 6 Draghi Millenari.</li></ul><p>Ogni carta ha 4 caratteristiche: <strong>Ferocia</strong> (attacco), <strong>Balzo</strong> (agilità), <strong>Corazza</strong> (resistenza), <strong>Istinto</strong> (adattamento). Alcune hanno anche tratti come Volo, Nuoto, Arrampicata o Equilibrio.</p>` },

  { id: "evoluzione", titolo: "⭐ Evoluzione a Stelle", html: `<h3>Come far evolvere una carta</h3><p>Per dare una stella a una creatura, devi <strong>sacrificare 4 creature del livello immediatamente inferiore</strong> che abbiano una stella in meno di quella che vuoi evolvere.</p><p>Esempio: per dare la 4ª stella a una carta di Livello 3 con 3 stelle, servono 4 carte di Livello 2 con 2 stelle ciascuna.</p><p>Le carte <strong>Jolly</strong> (ottenibili nei pacchetti) possono sostituire qualsiasi carta richiesta nel sacrificio, per aiutarti nella progressione.</p>` },

  { id: "combattimento", titolo: "⚔️ Combattimento", html: `<h3>Come funziona uno scontro</h3><p>Scegli 5 creature dal tuo mazzo e le ordini. Si confrontano una contro una (1ª vs 1ª, 2ª vs 2ª...) per 5 round totali, su <strong>una sola caratteristica alla volta</strong>. Vince chi prevale in almeno 3 round su 5.</p><h3>Terreno Congeniale</h3><p>Ogni scontro avviene su un terreno: Aria, Terra, Foresta o Acqua. Se la tua creatura ha un tratto adatto, riceve un bonus; altrimenti un malus.</p><ul><li><strong>Volo:</strong> bonus in Aria, malus in Acqua</li><li><strong>Nuoto:</strong> bonus in Acqua, malus in Aria</li><li><strong>Arrampicata / Equilibrio:</strong> bonus in Foresta/Terra, malus in Acqua/Aria</li></ul>` },

  { id: "fatica", titolo: "💪 Fatica e Vigore", html: `<h3>Vigore</h3><p>Ogni volta che una creatura combatte, il suo Vigore scende del 10%. A 0% non può più combattere.</p><h3>Recupero</h3><p>Il recupero parte subito ed è <strong>continuo</strong>: +10% ogni 30 minuti, anche a gioco chiuso. Da 0% a 100% servono 5 ore, ma puoi ririschierare la carta anche a ricarica parziale se ne hai bisogno urgente.</p>` },

  { id: "mondi", titolo: "🗺️ Mondi e Sottomondi", html: `<h3>I 5 Mondi</h3><p>Mappe da circa 400 esagoni dove conquisti territorio attaccando in modo asincrono (il tuo avversario non deve essere online).</p><ul><li><strong>Principianti:</strong> solo Livello 1</li><li><strong>Intermedio:</strong> Livello 1-2</li><li><strong>Esperti:</strong> Livello 1-3</li><li><strong>Cultori:</strong> Livello 2-4</li><li><strong>Libero:</strong> tutte le carte</li></ul><h3>I 4 Sottomondi</h3><ul><li><strong>Normale:</strong> una statistica variabile a settimana</li><li><strong>Bifase:</strong> media di 2 statistiche</li><li><strong>Trifase:</strong> media di 3 statistiche</li><li><strong>Nebbia di Guerra:</strong> non vedi le carte avversarie</li></ul><p>Ogni mondo si rigenera ogni settimana: chi ha conquistato più esagoni riceve più ricompense.</p>` },

  { id: "mercato", titolo: "🛒 Mercato", html: `<h3>Pacchetti di carte</h3><p>Compra pacchetti con Dracme o Frammenti d'Ambra per ampliare il tuo mazzo. Le carte più rare costano di più e sono più difficili da ottenere.</p><h3>Risorse</h3><ul><li><strong>Dracme:</strong> valuta comune, si ottiene giocando</li><li><strong>Frammenti d'Ambra:</strong> valuta rara, per pacchetti di livello superiore</li></ul>` },

  { id: "duelli", titolo: "🎲 Duelli con Scommessa", html: `<h3>Come funzionano</h3><p>Non in tempo reale: lanci una sfida scommettendo Dracme (ed eventualmente Ambra), un altro giocatore (o bot) la accetta pagando la stessa quota, e il server calcola subito lo scontro. Il vincitore incassa il montepremi (meno una piccola tassa).</p><h3>Scaglioni</h3><ul><li><strong>Minore:</strong> piccole quantità di Dracme</li><li><strong>Maggiore:</strong> quantità rilevanti</li><li><strong>Elite:</strong> Dracme + 1 Frammento d'Ambra, massimo 1 al giorno</li></ul><p>Limite: 10 duelli al giorno in totale, tra creati e accettati.</p>` },

  { id: "clan", titolo: "🛡️ Clan e Ruoli", html: `<h3>La struttura</h3><p>Un clan ha fino a 20 membri: 1 Comandante, fino a 3 Capitani, fino a 5 Sergenti, il resto Soldati. Solo il Comandante può promuovere o degradare i membri.</p><h3>Donazioni</h3><p>Puoi donare 1 carta di Livello 1 o 2 al giorno a un compagno di clan, spendendo 1 Frammento d'Ambra.</p><h3>Poteri di Ruolo</h3><ul><li><strong>Comandante:</strong> Amnistia di Guerra (ritira le difese di un tuo esagono, 1 volta a settimana) e Dichiarazione d'Assedio (dimezza la fatica in guerra per 24h)</li><li><strong>Capitano:</strong> Occhio dell'Oracolo (rivela le difese nemiche per 6h, 1 volta al giorno) e Staffetta Logistica (-1h di fatica a una tua carta, costa Dracme)</li><li><strong>Sergente:</strong> Marchio del Predatore (bonus al 1° round contro un esagono marcato) e Supervisore del Mercato (donazioni gratuite, senza Ambra)</li></ul>` },

  { id: "guerra", titolo: "⚔️ Guerra tra Clan", html: `<h3>La mappa</h3><p>Un settore normale genera 1 Punto Dominio l'ora, un Avamposto 10, la Cittadella centrale 30. Alla fine della settimana, il clan con più Punti Dominio vince la Cassa del Clan.</p><h3>Guarnigioni Multiple</h3><p>Le Torri (Cittadella e Avamposti) possono avere <strong>fino a 5-6 mazzi difensivi impilati</strong>. Attacchi sempre il mazzo in prima linea: se vinci, viene eliminato e puoi proseguire l'assedio contro il successivo. La Torre cambia fazione solo quando l'ultimo mazzo cade.</p>` }

];

function apriGuida(capitoloId) {

  const toc = document.getElementById("guide-toc");

  toc.innerHTML = CAPITOLI_GUIDA.map(cap => `<button type="button" class="attack-btn guide-toc-btn" data-id="${cap.id}" style="width:100%; text-align:left; font-size:0.75rem; padding:8px; ${cap.id === capitoloId ? 'background:linear-gradient(to bottom, #d69e2e, #b7791f);' : ''}">${cap.titolo}</button>`).join("");

  toc.querySelectorAll(".guide-toc-btn").forEach(btn => {

    btn.addEventListener("click", () => apriGuida(btn.dataset.id));

  });

  const capitolo = CAPITOLI_GUIDA.find(c => c.id === capitoloId) || CAPITOLI_GUIDA[0];

  document.getElementById("guide-content").innerHTML = capitolo.html;

  document.getElementById("guide-modal").classList.remove("hidden");

}

document.getElementById("btn-apri-guida")?.addEventListener("click", () => apriGuida("creature"));

document.getElementById("close-guide-modal")?.addEventListener("click", () => {

  document.getElementById("guide-modal").classList.add("hidden");

});

document.getElementById("clan-chat-input")?.addEventListener("keydown", (e) => {

  if (e.key === "Enter") inviaMessaggioChatClan();

});

function attivaOracolo(esagono) {

  if (capitanoOracoliUsatiOggi >= 1) { alert("Hai già usato l'Occhio dell'Oracolo oggi!"); return; }

  esagono.oracoloScadenza = Date.now() + 6 * 60 * 60 * 1000;

  capitanoOracoliUsatiOggi++;

  alert("Occhio dell'Oracolo attivato: le difese di questo settore sono rivelate per 6 ore!");

  mostraDettagliEsagonoGuerra(esagono);

}

function attivaMarchioPredatore(esagono) {

  esagono.haMarchioPredatore = true;

  esagono.predatoreScadenza = Date.now() + 24 * 60 * 60 * 1000;

  alert("Marchio del Predatore applicato! Per 24 ore, chi nel clan attacca questo settore ha un bonus al primo round.");

  mostraDettagliEsagonoGuerra(esagono);

}

function attivaAmnistia(esagono) {

  if (amnistiaUsataQuestaSettimana) { alert("Hai già usato l'Amnistia di Guerra questa settimana!"); return; }

  esagono.guarnigioni = [];

  amnistiaUsataQuestaSettimana = true;

  alert("Amnistia di Guerra attivata: le truppe sono state richiamate. Il settore è ora indifeso, pronto per un nuovo schieramento a sorpresa.");

  mostraDettagliEsagonoGuerra(esagono);

}

function mostraDettagliEsagonoGuerra(esagono) {

  document.getElementById("war-info-hex-coords").innerText = `Settore [${esagono.r}, ${esagono.c}]` + (esagono.tipo !== "normale" ? ` - ${esagono.tipo.toUpperCase()}` : "");

  document.getElementById("war-info-hex-terrain").innerText = esagono.terrain;

  document.getElementById("war-info-hex-owner").innerText = esagono.fazione.toUpperCase();

  document.getElementById("war-info-hex-yield").innerText = esagono.yield;

  

  const defenseDiv = document.getElementById("war-hex-defense-team");

  if (esagono.tipo === "base") {

    defenseDiv.innerHTML = "<h4>Guarnigione di Difesa:</h4><p style='color:#aaa; font-style:italic; padding:5px;'>Base operativa invulnerabile. Impossibile attaccare.</p>";

    document.getElementById("btn-attacca-esagono-guerra").disabled = true;

    return;

  }

  

  let ruoloGiocatore = getRuoloGiocatore();

  let oracoloAttivo = esagono.oracoloScadenza && Date.now() < esagono.oracoloScadenza;

  let predatoreAttivo = esagono.haMarchioPredatore && Date.now() < esagono.predatoreScadenza;

  let nascondiDifese = (esagono.fazione !== "alleato") && !oracoloAttivo;

  let listaDifensoriHTML;

  if (esagono.guarnigioni.length === 0) {

    listaDifensoriHTML = "<p style='color:#48bb78;'>Settore indifeso! Pronto per essere conquistato.</p>";

  } else if (nascondiDifese) {

    let totaleMostri = esagono.guarnigioni.reduce((tot, m) => tot + m.length, 0);

    listaDifensoriHTML = `<p style="color:#aaa; font-style:italic; padding:5px;">🌫️ Nebbia di Guerra: statistiche esatte nascoste (${esagono.guarnigioni.length} mazzi impilati, ${totaleMostri} creature totali).</p>`;

  } else {

    listaDifensoriHTML = esagono.guarnigioni.map((mazzo, mIdx) => {

      let etichettaMazzo = mIdx === 0 ? `<strong style="color:#f56565;">⚔️ Mazzo in Prima Linea (${mIdx + 1}/${esagono.guarnigioni.length}):</strong>` : `<strong style="color:#a0aec0;">Mazzo in Riserva (${mIdx + 1}/${esagono.guarnigioni.length}):</strong>`;

      let righeCarte = mazzo.map((mostro, index) => {

        let stringaTratti = mostro.tratti && mostro.tratti.length > 0 ? ` [${mostro.tratti.join(",")}]` : "";

        return `<div class="defense-row guarnigione-slot"><span><strong>${index + 1}° Slot:</strong> ${mostro.immagine} ${mostro.nome}${stringaTratti}</span><div class="defense-stats"><span>F: ${mostro.statistiche.ferocia}</span><span>B: ${mostro.statistiche.balzo}</span><span>C: ${mostro.statistiche.corazza}</span><span>I: ${mostro.statistiche.istinto}</span></div></div>`;

      }).join("");

      return `<div style="margin-bottom:10px; ${mIdx > 0 ? 'opacity:0.6;' : ''}">${etichettaMazzo}${righeCarte}</div>`;

    }).join("<div class='info-divider'></div>");

  }

  

  let etichetteStat = { ferocia: "FEROCIA", balzo: "BALZO", corazza: "CORAZZA", istinto: "ISTINTO" };

  let statAttiveTesto = esagono.statsGuerra.map(s => etichetteStat[s]).join(" + ");

  let marchioTesto = predatoreAttivo ? `<p style="color:#f56565; font-size:0.8rem;">🎯 Marchio del Predatore attivo: bonus per chi attacca al 1° round!</p>` : "";

  let poteriHTML = "";

  if (esagono.fazione !== "alleato") {

    if (ruoloGiocatore === "capitano" && !oracoloAttivo) {

      poteriHTML += `<button type="button" class="attack-btn" id="btn-potere-oracolo" style="width:auto; font-size:0.75rem; padding:6px 10px; margin-right:6px;" ${capitanoOracoliUsatiOggi >= 1 ? "disabled" : ""}>👁️ Occhio dell'Oracolo</button>`;

    }

    if (ruoloGiocatore === "sergente" && !predatoreAttivo) {

      poteriHTML += `<button type="button" class="attack-btn" id="btn-potere-marchio" style="width:auto; font-size:0.75rem; padding:6px 10px;">🎯 Marchio del Predatore</button>`;

    }

  } else if (ruoloGiocatore === "comandante") {

    poteriHTML += `<button type="button" class="attack-btn" id="btn-potere-amnistia" style="width:auto; font-size:0.75rem; padding:6px 10px;" ${amnistiaUsataQuestaSettimana ? "disabled" : ""}>🕊️ Amnistia di Guerra</button>`;

  }

  defenseDiv.innerHTML = `<h4>Guarnigione di Difesa:</h4><p style="color:#c9a054; font-size:0.8rem; margin-bottom:8px;">Statistiche in gioco: <strong>${statAttiveTesto}</strong> — Terreno: <strong>${esagono.terrain}</strong></p>` + marchioTesto + listaDifensoriHTML + (poteriHTML ? `<div class="info-divider"></div><div>${poteriHTML}</div>` : "");

  document.getElementById("btn-potere-oracolo")?.addEventListener("click", () => attivaOracolo(esagono));

  document.getElementById("btn-potere-marchio")?.addEventListener("click", () => attivaMarchioPredatore(esagono));

  document.getElementById("btn-potere-amnistia")?.addEventListener("click", () => attivaAmnistia(esagono));

  document.getElementById("btn-attacca-esagono-guerra").disabled = false;

  popolaSelectSchieramentoGuerra();

}

function popolaSelectSchieramentoGuerra() {

  let valoriSelezionati = [];

  for (let i = 0; i < 5; i++) {

    const s = document.getElementById(`war-deploy-slot-${i}`);

    if (s && s.value) valoriSelezionati.push(s.value);

  }

  for (let i = 0; i < 5; i++) {

    const select = document.getElementById(`war-deploy-slot-${i}`);

    if (!select) continue;

    const currentVal = select.value;

    select.innerHTML = '<option value="">-- Seleziona --</option>';

    deckGiocatore.forEach(carta => {

      controllaERinfrescaFatica(carta);

      let vigore = calcolaVigorePercentuale(carta);

      if (carta.isJolly || carta.bloccataInDuello || carta.inizioRiposo || carta.occupataInDifesa || vigore <= 0) return;

      if (valoriSelezionati.includes(carta.id) && carta.id !== currentVal) return;

      const option = document.createElement("option");

      option.value = carta.id;

      let stringaTratti = carta.tratti && carta.tratti.length > 0 ? ` [${carta.tratti.join(",")}]` : " [Nessuno]";

      option.innerText = `${carta.immagine} ${carta.nome} [${vigore}%] F:${carta.statistiche.ferocia} B:${carta.statistiche.balzo} C:${carta.statistiche.corazza} I:${carta.statistiche.istinto}${stringaTratti}`;

      if (carta.id === currentVal) option.selected = true;

      select.appendChild(option);

    });

    select.removeEventListener("change", gestisciCambioSelectGuerra);

    select.addEventListener("change", gestisciCambioSelectGuerra);

  }

  aggiornaValidazioneAttaccoGuerra();

}

function gestisciCambioSelectGuerra() { popolaSelectSchieramentoGuerra(); }

function aggiornaValidazioneAttaccoGuerra() {

  const btnAttacca = document.getElementById("btn-attacca-esagono-guerra");

  if (!btnAttacca || !esagonoGuerraSelezionatoDati || esagonoGuerraSelezionatoDati.tipo === "base") return;

  let scelti = [];

  let valido = true;

  for (let i = 0; i < 5; i++) {

    const val = document.getElementById(`war-deploy-slot-${i}`).value;

    if (!val || scelti.includes(val)) valido = false;

    else scelti.push(val);

  }

  btnAttacca.disabled = !valido;

}

function calcolaPuntiDominioOrari() {

  if (mappaGuerraClan.length === 0) return;

  const ultimoCalcolo = parseInt(localStorage.getItem("mythophedia_ultimo_calcolo_dominio") || "0");

  const adesso = Date.now();

  if (!ultimoCalcolo) {

    localStorage.setItem("mythophedia_ultimo_calcolo_dominio", adesso.toString());

    return;

  }

  const oreTrascorse = Math.floor((adesso - ultimoCalcolo) / (60 * 60 * 1000));

  if (oreTrascorse <= 0) return;

  let renditaGiocatore = 0, renditaBot1 = 0, renditaBot2 = 0, renditaBot3 = 0;

  mappaGuerraClan.forEach(riga => riga.forEach(esa => {

    if (esa.fazione === "alleato") renditaGiocatore += esa.yield;

    else if (esa.fazione === "bot1") renditaBot1 += esa.yield;

    else if (esa.fazione === "bot2") renditaBot2 += esa.yield;

    else if (esa.fazione === "bot3") renditaBot3 += esa.yield;

  }));

  puntiDominioGiocatore += renditaGiocatore * oreTrascorse;

  puntiDominioBot1 += renditaBot1 * oreTrascorse;

  puntiDominioBot2 += renditaBot2 * oreTrascorse;

  puntiDominioBot3 += renditaBot3 * oreTrascorse;

  localStorage.setItem("mythophedia_ultimo_calcolo_dominio", adesso.toString());

  const display = document.getElementById("war-player-dominio-pts");

  if (display) display.innerText = puntiDominioGiocatore;

}

function controllaFineSettimanaGuerra() {

  const inizioSettimana = parseInt(localStorage.getItem("mythophedia_inizio_settimana_guerra") || "0");

  const adesso = Date.now();

  const SETTIMANA_MS = 7 * 24 * 60 * 60 * 1000;

  if (!inizioSettimana) {

    localStorage.setItem("mythophedia_inizio_settimana_guerra", adesso.toString());

    return;

  }

  if (adesso - inizioSettimana < SETTIMANA_MS) return;

  calcolaPuntiDominioOrari();

  const punteggi = [

    { nome: clanMioAttuale ? clanMioAttuale.nome : "Il tuo Clan", pts: puntiDominioGiocatore, mio: true },

    { nome: "Athena_War", pts: puntiDominioBot1 },

    { nome: "Ragnar99_Clan", pts: puntiDominioBot2 },

    { nome: "KitsuneFan_Clan", pts: puntiDominioBot3 }

  ].sort((a, b) => b.pts - a.pts);

  const posizione = punteggi.findIndex(p => p.mio) + 1;

  let ricompensaDracme = 0, ricompensaAmbra = 0;

  if (posizione === 1) { ricompensaDracme = 500; ricompensaAmbra = 3; }

  else if (posizione === 2) { ricompensaDracme = 250; ricompensaAmbra = 1; }

  else if (posizione === 3) { ricompensaDracme = 100; ricompensaAmbra = 0; }

  else { ricompensaDracme = 50; ricompensaAmbra = 0; }

  dracmeAttuali += ricompensaDracme;

  ambraAttuale += ricompensaAmbra;

  document.getElementById("dracme-count").innerText = dracmeAttuali;

  document.getElementById("ambra-count").innerText = ambraAttuale;

  alert(`La settimana di Guerra è terminata!\n\nClassifica:\n${punteggi.map((p, i) => `${i+1}. ${p.nome}: ${p.pts} Punti Dominio${p.mio ? " (TU)" : ""}`).join("\n")}\n\nHai ricevuto la Cassa del Clan: ${ricompensaDracme} Dracme${ricompensaAmbra > 0 ? ` + ${ricompensaAmbra} Frammenti d'Ambra` : ""}!`);

  puntiDominioGiocatore = 0; puntiDominioBot1 = 0; puntiDominioBot2 = 0; puntiDominioBot3 = 0;

  amnistiaUsataQuestaSettimana = false;

  mappaGuerraClan = [];

  localStorage.setItem("mythophedia_inizio_settimana_guerra", adesso.toString());

  localStorage.setItem("mythophedia_ultimo_calcolo_dominio", adesso.toString());

}

document.getElementById("btn-avvia-guerra-placeholder")?.addEventListener("click", () => {

  if (!clanMioAttuale) { alert("Devi far parte di un clan per accedere alla guerra!"); return; }

  controllaFineSettimanaGuerra();

  generaMappaGuerra();

  calcolaPuntiDominioOrari();

  renderizzaMappaGuerraVisiva();

  document.getElementById("war-player-dominio-pts").innerText = puntiDominioGiocatore;

  document.getElementById("clan-war-modal").classList.remove("hidden");

});

document.getElementById("close-clan-war-modal")?.addEventListener("click", () => {

  document.getElementById("clan-war-modal").classList.add("hidden");

});

document.getElementById("btn-attacca-esagono-guerra")?.addEventListener("click", () => {

  if (!esagonoGuerraSelezionatoDati || esagonoGuerraSelezionatoDati.tipo === "base") return;

  let mazzoAttaccoGuerra = [];

  for (let i = 0; i < 5; i++) {

    const cardId = document.getElementById(`war-deploy-slot-${i}`).value;

    mazzoAttaccoGuerra.push(deckGiocatore.find(c => c.id === cardId));

  }

  if (esagonoGuerraSelezionatoDati.guarnigioni.length === 0) {

    esagonoGuerraSelezionatoDati.fazione = "alleato";

    esagonoGuerraSelezionatoDati.guarnigioni = [mazzoAttaccoGuerra.map(c => ({ nome: c.nome, immagine: c.immagine, statistiche: c.statistiche, tratti: c.tratti || [] }))];

    mazzoAttaccoGuerra.forEach(c => applicaSfiancamento(c, "guerra"));

    alert("Settore indifeso occupato! Il tuo mazzo è stato posizionato a guardia.");

    renderizzaMappaGuerraVisiva();

    mostraDettagliEsagonoGuerra(esagonoGuerraSelezionatoDati);

    return;

  }

  let roundVintiGuerra = 0;

  document.getElementById("battle-title-outcome").innerText = "ASSALTO AL SETTORE...";

  document.getElementById("battle-result-modal").classList.remove("hidden");

  let warRoundIdx = 0;

  function eseguiProssimoRoundGuerraAnimato() {

    if (warRoundIdx >= 5) {

      risolviFineAssaltoGuerra(mazzoAttaccoGuerra, roundVintiGuerra);

      return;

    }

    const miaCarta = mazzoAttaccoGuerra[warRoundIdx];

    const mostroNemico = esagonoGuerraSelezionatoDati.guarnigioni[0][warRoundIdx];

    let statsRound = esagonoGuerraSelezionatoDati.statsGuerra;

    let sommaMioVal = 0, sommaNemicoVal = 0;

    statsRound.forEach(stat => {

      sommaMioVal += miaCarta.statistiche[stat];

      sommaNemicoVal += mostroNemico.statistiche[stat];

    });

    let mioValBase = parseFloat((sommaMioVal / statsRound.length).toFixed(1));

    let nemicoValBase = parseFloat((sommaNemicoVal / statsRound.length).toFixed(1));

    let mioMod = calcolaModificatoreTerreno(miaCarta.tratti || [], esagonoGuerraSelezionatoDati.terrain);

    let nemicoMod = calcolaModificatoreTerreno(mostroNemico.tratti || [], esagonoGuerraSelezionatoDati.terrain);

    let bonusPredatore = (warRoundIdx === 0 && esagonoGuerraSelezionatoDati.haMarchioPredatore && Date.now() < esagonoGuerraSelezionatoDati.predatoreScadenza) ? 0.5 : 0;

    let mioValFinale = parseFloat((mioValBase + mioMod + bonusPredatore).toFixed(1));

    let nemicoValFinale = parseFloat((nemicoValBase + nemicoMod).toFixed(1));

    const esitoRound = (mioValFinale >= nemicoValFinale);

    if (esitoRound) roundVintiGuerra++;

    let roundCardId = `clash-war-row-${warRoundIdx}`;

    let rLineHTML = `

      <div class="battle-arena-row" id="${roundCardId}">

        <div class="mini-card-anim" id="my-war-card-${warRoundIdx}">

          <div style="font-size:0.8rem; font-weight:bold; color:#ffcc66;">${miaCarta.nome}</div>

          <div style="font-size:1.5rem; margin:5px 0;">${miaCarta.immagine}</div>

          <div style="font-size:0.75rem; font-weight:bold; color:#fff;">PUNTI: ${mioValFinale}</div>

        </div>

        <div class="vs-clash-text" id="vs-text-war-${warRoundIdx}">ROUND ${warRoundIdx+1}</div>

        <div class="mini-card-anim" id="nem-war-card-${warRoundIdx}">

          <div style="font-size:0.8rem; font-weight:bold; color:#f56565;">${mostroNemico.nome}</div>

          <div style="font-size:1.5rem; margin:5px 0;">${mostroNemico.immagine}</div>

          <div style="font-size:0.75rem; font-weight:bold; color:#fff;">PUNTI: ${nemicoValFinale}</div>

        </div>

      </div>`;

    if (warRoundIdx === 0) {

      document.getElementById("battle-report-content").innerHTML = rLineHTML;

    } else {

      document.getElementById("battle-report-content").insertAdjacentHTML("beforeend", rLineHTML);

    }

    let targetRow = document.getElementById(roundCardId);

    if (targetRow) targetRow.scrollIntoView({ behavior: 'smooth', block: 'end' });

    setTimeout(() => {

      document.getElementById(`my-war-card-${warRoundIdx}`).classList.add("mia-card-scatto");

      document.getElementById(`nem-war-card-${warRoundIdx}`).classList.add("nemica-card-scatto");

      document.getElementById(`vs-text-war-${warRoundIdx}`).classList.add("shake");

      setTimeout(() => {

        if (esitoRound) {

          document.getElementById(`nem-war-card-${warRoundIdx}`).classList.add("card-sconfitta");

          document.getElementById(`vs-text-war-${warRoundIdx}`).innerHTML = "VINCI";

          document.getElementById(`vs-text-war-${warRoundIdx}`).style.color = "#48bb78";

        } else {

          document.getElementById(`my-war-card-${warRoundIdx}`).classList.add("card-sconfitta");

          document.getElementById(`vs-text-war-${warRoundIdx}`).innerHTML = "PERDI";

          document.getElementById(`vs-text-war-${warRoundIdx}`).style.color = "#f56565";

        }

        applicaSfiancamento(miaCarta, "guerra");

        warRoundIdx++;

        setTimeout(eseguiProssimoRoundGuerraAnimato, 1000);

      }, 400);

    }, 600);

  }

  setTimeout(eseguiProssimoRoundGuerraAnimato, 500);

});

function risolviFineAssaltoGuerra(mazzoAttaccoGuerra, roundVintiGuerra) {

  const vintoAssalto = (roundVintiGuerra >= 3);

  let epilogoHTML = `<div class="info-divider"></div>`;

  if (vintoAssalto) {

    esagonoGuerraSelezionatoDati.guarnigioni.shift();

    let mazziRimasti = esagonoGuerraSelezionatoDati.guarnigioni.length;

    if (mazziRimasti === 0) {

      document.getElementById("battle-title-outcome").innerText = "Settore Conquistato!";

      esagonoGuerraSelezionatoDati.fazione = "alleato";

      esagonoGuerraSelezionatoDati.guarnigioni = [mazzoAttaccoGuerra.map(c => {

        return { nome: c.nome, immagine: c.immagine, statistiche: c.statistiche, tratti: c.tratti || [] };

      })];

      epilogoHTML += `<p style="text-align:center; color:#48bb78; font-weight:bold;">Hai eliminato l'ultimo mazzo difensivo e conquistato il settore!</p>`;

    } else {

      document.getElementById("battle-title-outcome").innerText = "Mazzo Difensivo Sconfitto!";

      epilogoHTML += `<p style="text-align:center; color:#48bb78; font-weight:bold;">Hai sconfitto un mazzo difensivo (${roundVintiGuerra}/5 round vinti)! Restano ancora <strong>${mazziRimasti}</strong> mazzi a difesa del settore — attacca di nuovo per proseguire l'assedio.</p>`;

    }

    renderizzaMappaGuerraVisiva();

    mostraDettagliEsagonoGuerra(esagonoGuerraSelezionatoDati);

  } else {

    document.getElementById("battle-title-outcome").innerText = "Assalto Respinto";

    epilogoHTML += `<p style="text-align:center; color:#f56565; font-weight:bold;">Il mazzo in prima linea ha resistito. Round vinti: ${roundVintiGuerra} su 5.</p>`;

  }

  document.getElementById("battle-report-content").insertAdjacentHTML("beforeend", epilogoHTML);

}

document.getElementById("close-battle-modal")?.addEventListener("click", () => { 

  document.getElementById("battle-result-modal").classList.add("hidden"); 

});

document.getElementById("filter-comuni")?.addEventListener("click", () => renderizzaFiltrata(1, "Comuni"));

document.getElementById("filter-noncomuni")?.addEventListener("click", () => renderizzaFiltrata(2, "Non Comuni"));

document.getElementById("filter-rare")?.addEventListener("click", () => renderizzaFiltrata(3, "Rare"));

document.getElementById("filter-epiche")?.addEventListener("click", () => renderizzaFiltrata(4, "Epiche"));

document.getElementById("filter-mitiche")?.addEventListener("click", () => renderizzaFiltrata(5, "Mitiche"));

document.getElementById("filter-leggendarie")?.addEventListener("click", () => renderizzaFiltrata(6, "Leggendarie"));

document.getElementById("close-modal")?.addEventListener("click", () => { collectionModal.classList.add("hidden"); });

// ==========================================
// INTEGRAZIONE FIREBASE: Account e Salvataggio Cloud
// ==========================================

const authFirebase = firebase.auth();
const dbFirebase = firebase.database();
let utenteFirebaseAttuale = null;
let salvataggioCloudCaricato = false;

function raccogliDatiSalvataggio() {
  return {
    deckGiocatore: deckGiocatore,
    dracmeAttuali: dracmeAttuali,
    ambraAttuale: ambraAttuale,
    livelloGiocatore: livelloGiocatore,
    nicknameUtente: nicknameUtente,
    presentationUtente: presentationUtente,
    clanMioAttuale: clanMioAttuale,
    ultimoSalvataggio: Date.now()
  };
}

function salvaProgressoCloud() {
  if (!utenteFirebaseAttuale) return;
  dbFirebase.ref("giocatori/" + utenteFirebaseAttuale.uid).set(raccogliDatiSalvataggio())
    .catch((err) => console.error("Errore salvataggio cloud:", err));
}

function applicaDatiCaricati(dati) {
  deckGiocatore = dati.deckGiocatore || deckGiocatore;
  dracmeAttuali = (typeof dati.dracmeAttuali === "number") ? dati.dracmeAttuali : dracmeAttuali;
  ambraAttuale = (typeof dati.ambraAttuale === "number") ? dati.ambraAttuale : ambraAttuale;
  livelloGiocatore = dati.livelloGiocatore || livelloGiocatore;
  nicknameUtente = dati.nicknameUtente || nicknameUtente;
  presentationUtente = dati.presentationUtente || presentationUtente;
  if (dati.clanMioAttuale) clanMioAttuale = dati.clanMioAttuale;

  document.getElementById("dracme-count").innerText = dracmeAttuali;
  document.getElementById("ambra-count").innerText = ambraAttuale;
  aggiornaPulsantiLateraliRarita();
  if (typeof aggiornaVisualizzazioneClan === "function" && clanMioAttuale) aggiornaVisualizzazioneClan();
}

function aggiornaUIAccount(user) {
  const btn = document.getElementById("btn-account");
  if (!btn) return;
  if (user) {
    btn.innerText = "☁️ " + (user.displayName ? user.displayName.split(" ")[0] : "Account");
  } else {
    btn.innerText = "☁️ Accedi";
  }
}

document.getElementById("btn-account")?.addEventListener("click", () => {
  if (utenteFirebaseAttuale) {
    if (confirm("Vuoi disconnetterti dal tuo account? (i progressi restano salvati nel cloud)")) {
      authFirebase.signOut();
    }
    return;
  }
  const provider = new firebase.auth.GoogleAuthProvider();
  authFirebase.signInWithPopup(provider).catch((err) => {
    alert("Accesso non riuscito: " + err.message);
  });
});

authFirebase.onAuthStateChanged((user) => {
  utenteFirebaseAttuale = user;
  aggiornaUIAccount(user);

  if (!user) {
    salvataggioCloudCaricato = false;
    return;
  }

  dbFirebase.ref("giocatori/" + user.uid).once("value").then((snapshot) => {
    if (snapshot.exists()) {
      applicaDatiCaricati(snapshot.val());
    } else {
      salvaProgressoCloud();
    }
    salvataggioCloudCaricato = true;
  }).catch((err) => {
    console.error("Errore caricamento cloud:", err);
    alert("Non sono riuscito a caricare i tuoi dati dal cloud. Riprova più tardi.");
  });
});

setInterval(() => {
  if (utenteFirebaseAttuale && salvataggioCloudCaricato) salvaProgressoCloud();
}, 30000);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && utenteFirebaseAttuale && salvataggioCloudCaricato) {
    salvaProgressoCloud();
  }
});

// Avvio automatico dei popolamenti all'attivazione del DOM

inizializzaDeckGiocatore();

// CHIUSURA DEFINITIVA DI TUTTO LO SCRIPT

});