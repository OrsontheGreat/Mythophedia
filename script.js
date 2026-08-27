// ==========================================

// MYTHOPHEDIA - SCRIPT.JS - BLOCCO 1

// ==========================================

// ===== Forzatura orientamento orizzontale su dispositivi touch =====
// Su telefono ruotiamo l'intera app via CSS (funziona ovunque, iPhone incluso) e in aggiunta
// tentiamo il blocco nativo dell'orientamento (Screen Orientation API), che su Android in una
// PWA installata evita del tutto il trucco CSS. I due sistemi convivono senza conflitti.
function aggiornaOrientamentoELayout() {

  const html = document.documentElement;
  const wrapper = document.querySelector(".game-wrapper");
  const wFisico = window.innerWidth;
  const hFisico = window.innerHeight;
  const isTouch = (window.matchMedia && (window.matchMedia("(hover: none)").matches || window.matchMedia("(pointer: coarse)").matches)) || navigator.maxTouchPoints > 0;
  const inPortrait = hFisico > wFisico;
  const ruota = isTouch && inPortrait;

  html.classList.toggle("forza-landscape", ruota);

  if (wrapper) {

    if (ruota) {

      wrapper.style.position = "fixed";
      wrapper.style.width = hFisico + "px";
      wrapper.style.height = wFisico + "px";
      wrapper.style.transformOrigin = "top left";
      wrapper.style.transform = "rotate(90deg)";
      wrapper.style.top = "0px";
      wrapper.style.left = "0px";

      // Correzione empirica: misuriamo dove finisce davvero il riquadro dopo la rotazione
      // e lo riportiamo esattamente sopra lo schermo fisico, qualunque sia il verso di rotazione
      // applicato dal browser (evita l'effetto "spostato e tagliato" visto in passato col video).
      const rect = wrapper.getBoundingClientRect();
      wrapper.style.top = (-rect.top) + "px";
      wrapper.style.left = (-rect.left) + "px";

    } else {

      wrapper.style.position = "";
      wrapper.style.width = "";
      wrapper.style.height = "";
      wrapper.style.transformOrigin = "";
      wrapper.style.transform = "";
      wrapper.style.top = "";
      wrapper.style.left = "";

    }

  }

  // Larghezza/altezza "logiche" (cioè quelle che l'utente vede davvero dopo l'eventuale rotazione)
  const larghezzaLogica = ruota ? hFisico : wFisico;
  const altezzaLogica = ruota ? wFisico : hFisico;

  html.classList.toggle("narrow-820", larghezzaLogica <= 820);
  html.classList.toggle("narrow-700", larghezzaLogica <= 700);
  html.classList.toggle("narrow-600", larghezzaLogica <= 600);
  html.classList.toggle("narrow-420", larghezzaLogica <= 420);

  html.style.setProperty("--app-width", larghezzaLogica + "px");
  html.style.setProperty("--app-height", altezzaLogica + "px");

  // Tentativo di blocco nativo (utile soprattutto su Android, quando l'app è installata come PWA)
  if (ruota && screen.orientation && screen.orientation.lock) {
    screen.orientation.lock("landscape").catch(() => {});
  }

}

window.addEventListener("resize", aggiornaOrientamentoELayout);
window.addEventListener("orientationchange", () => setTimeout(aggiornaOrientamentoELayout, 250));
// Alcuni browser concedono il blocco nativo solo dopo un'interazione dell'utente: ritentiamo al primo tocco
document.addEventListener("touchstart", aggiornaOrientamentoELayout, { once: true, passive: true });
document.addEventListener("DOMContentLoaded", aggiornaOrientamentoELayout);
aggiornaOrientamentoELayout();

// ===== Menu a tendina personalizzati (compatibili con la rotazione forzata orizzontale) =====
// I <select> nativi vengono disegnati dal sistema operativo/browser e NON seguono la rotazione
// CSS applicata al resto della pagina: risultavano quindi "storti" su telefono, leggibili solo
// ruotando fisicamente lo schermo. Li sostituiamo con un menu disegnato da noi (bottone + lista),
// tenendo il <select> originale nel DOM ma invisibile: tutto il resto del codice, che legge/scrive
// .value, .disabled o le <option> su questi elementi, continua a funzionare senza modifiche.
function potenziaMenuATendina() {

  const selettori = document.querySelectorAll("select.deploy-select, #modal-sort-select");

  selettori.forEach(sel => {

    if (sel.dataset.potenziato === "1") return;
    sel.dataset.potenziato = "1";

    const wrapper = document.createElement("div");
    wrapper.className = "fake-select-wrapper";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "fake-select-trigger";
    if (sel.id === "modal-sort-select") { trigger.classList.add("sort-select"); wrapper.id = "modal-sort-select-wrapper"; }

    const lista = document.createElement("div");
    lista.className = "fake-select-list hidden";

    sel.parentNode.insertBefore(wrapper, sel);
    wrapper.appendChild(trigger);
    wrapper.appendChild(lista);
    wrapper.appendChild(sel);

    function aggiornaTesto() {
      const opt = sel.options[sel.selectedIndex];
      trigger.textContent = opt ? opt.textContent : "";
      wrapper.classList.toggle("fake-select-disabled", !!sel.disabled);
    }

    function costruisciLista() {
      lista.innerHTML = "";
      Array.from(sel.options).forEach((opt, idx) => {
        const voce = document.createElement("div");
        voce.className = "fake-select-option" + (opt.disabled ? " disabled" : "") + (idx === sel.selectedIndex ? " selected" : "");
        voce.textContent = opt.textContent;
        if (!opt.disabled) {
          voce.addEventListener("click", () => {
            sel.value = opt.value;
            sel.dispatchEvent(new Event("change", { bubbles: true }));
            chiudiLista();
          });
        }
        lista.appendChild(voce);
      });
    }

    function apriLista() {
      if (sel.disabled) return;
      document.querySelectorAll(".fake-select-list").forEach(l => l.classList.add("hidden"));
      costruisciLista();
      lista.classList.remove("hidden");
    }

    function chiudiLista() {
      lista.classList.add("hidden");
    }

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      if (lista.classList.contains("hidden")) apriLista(); else chiudiLista();
    });

    // Restiamo sincronizzati se il resto del codice cambia opzioni/valore/stato disabled del select originale
    const osservatore = new MutationObserver(aggiornaTesto);
    osservatore.observe(sel, { attributes: true, childList: true, subtree: true, attributeFilter: ["disabled"] });
    sel.addEventListener("change", aggiornaTesto);

    aggiornaTesto();

  });

}

document.addEventListener("click", () => {
  document.querySelectorAll(".fake-select-list").forEach(l => l.classList.add("hidden"));
});

document.addEventListener("DOMContentLoaded", () => setTimeout(potenziaMenuATendina, 0));

document.addEventListener("DOMContentLoaded", () => {

  // Registri delle Mappe e degli Stati di Gioco

  let dizionarioMappe = {};

  let dizionarioInizioSettimanaMondo = {};

  let mappaMondo = [];

  let mappaGuerraClan = [];

 

  // Contatori Punti Dominio per la Guerra tra Clan

  let puntiDominioGiocatore = 0;

  let puntiDominioBot1 = 0;

  let puntiDominioBot2 = 0;

  let puntiDominioBot3 = 0;

  let capitanoOracoliUsatiOggi = 0;

  let inizioSettimanaMondoAttuale = 0;

  let inizioSettimanaGuerraAttuale = 0;

  let amnistiaUsataQuestaSettimana = false;

 

  // Variabili per l'Arena dei Duelli

  let listaDuelliBacheca = [];

  let contatoreDuelliGiornalieri = 0;

  let haGiocatoEliteOggi = false;

  let sfidaSelezionataInAccettazione = null;

  let donazioneFattaOggi = false;

  let donazioneDestinatarioCorrente = null;

  let donazioneDestinatarioUidCorrente = null;

 

  // Registri delle Gilde e dell'Utente

  let listaClanGlobali = [];

  let clanMioAttuale = null;

  let esagonoGuerraSelezionatoDati = null;

  let nicknameUtente = "Ospite";

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

// Carte "fisse": ogni immagine ha nome e statistiche stabilite una volta per sempre
// (a differenza del database procedurale, qui F/B/C/I NON vengono rigenerate ad ogni estrazione)
const CARTE_FISSE = [
  { nome: "Ieraco", cultura: "Greca", tratti: ["volo"], immagine: "img/carte/ieraco.jpg", livello: 1, statisticheFisse: { ferocia: 2.0, balzo: 2.6, corazza: 0.7, istinto: 2.7 } },
  { nome: "Aura Volante", cultura: "Greca", tratti: ["volo"], immagine: "img/carte/aura-volante.jpg", livello: 1, statisticheFisse: { ferocia: 0.3, balzo: 0.7, corazza: 6.8, istinto: 0.2 } },
  { nome: "Fenice Pulcino", cultura: "Greca", tratti: ["volo"], immagine: "img/carte/fenice-pulcino.jpg", livello: 1, statisticheFisse: { ferocia: 0.8, balzo: 0.5, corazza: 4.0, istinto: 2.7 } },
  { nome: "Grifone Recluta", cultura: "Greca", tratti: ["volo"], immagine: "img/carte/grifone-recluta.jpg", livello: 1, statisticheFisse: { ferocia: 3.1, balzo: 1.5, corazza: 0.1, istinto: 3.3 } },
  { nome: "Arpìa Cacciatrice", cultura: "Greca", tratti: ["volo"], immagine: "img/carte/arpia-cacciatrice.jpg", livello: 1, statisticheFisse: { ferocia: 0.3, balzo: 2.9, corazza: 4.1, istinto: 0.7 } },
  { nome: "Ippogrifo", cultura: "Medievale", tratti: ["volo"], immagine: "img/carte/ippogrifo.jpg", livello: 1, statisticheFisse: { ferocia: 3.8, balzo: 2.4, corazza: 1.5, istinto: 0.3 } },
  { nome: "Pegaso", cultura: "Greca", tratti: ["volo", "equilibrio"], immagine: "img/carte/pegaso.jpg", livello: 1, statisticheFisse: { ferocia: 0.8, balzo: 3.0, corazza: 3.9, istinto: 0.3 } },
  { nome: "Keres della Cenere", cultura: "Greca", tratti: ["volo"], immagine: "img/carte/keres-della-cenere.jpg", livello: 1, statisticheFisse: { ferocia: 1.3, balzo: 3.7, corazza: 1.1, istinto: 1.9 } },
  { nome: "Nachtrabe", cultura: "Norrena", tratti: ["volo"], immagine: "img/carte/nachtrabe.jpg", livello: 1, statisticheFisse: { ferocia: 1.4, balzo: 0.9, corazza: 0.2, istinto: 5.5 } },
  { nome: "Nattramn", cultura: "Norrena", tratti: ["volo"], immagine: "img/carte/nattramn.jpg", livello: 1, statisticheFisse: { ferocia: 0.2, balzo: 5.9, corazza: 0.9, istinto: 1.0 } },
  { nome: "Huginn, Corvo di Odino", cultura: "Norrena", tratti: ["volo"], immagine: "img/carte/huginn.jpg", livello: 2, statisticheFisse: { ferocia: 1.4, balzo: 6.5, corazza: 1.8, istinto: 2.3 } },
  { nome: "Cigno di Apollo", cultura: "Greca", tratti: ["volo"], immagine: "img/carte/cigno-di-apollo.jpg", livello: 1, statisticheFisse: { ferocia: 0.9, balzo: 3.0, corazza: 0.2, istinto: 3.9 } },
  { nome: "Anemoi", cultura: "Greca", tratti: ["volo"], immagine: "img/carte/anemoi.jpg", livello: 1, statisticheFisse: { ferocia: 1.0, balzo: 3.7, corazza: 0.9, istinto: 2.4 } },
  { nome: "Nefele", cultura: "Greca", tratti: ["volo"], immagine: "img/carte/nefele.jpg", livello: 1, statisticheFisse: { ferocia: 1.5, balzo: 1.4, corazza: 2.6, istinto: 2.5 } },
  { nome: "Níðhöggr Giovane", cultura: "Norrena", tratti: ["volo"], immagine: "img/carte/nidhoggr-giovane.jpg", livello: 2, statisticheFisse: { ferocia: 5.9, balzo: 1.3, corazza: 2.4, istinto: 2.4 } },
  { nome: "Caladri", cultura: "Romana", tratti: ["volo"], immagine: "img/carte/caladri.jpg", livello: 1, statisticheFisse: { ferocia: 1.1, balzo: 3.7, corazza: 2.6, istinto: 0.6 } },
  { nome: "Aquila di Zeus", cultura: "Greca", tratti: ["volo"], immagine: "img/carte/aquila-di-zeus.jpg", livello: 1, statisticheFisse: { ferocia: 1.5, balzo: 0.3, corazza: 3.7, istinto: 2.5 } },
  { nome: "Hræsvelgr", cultura: "Norrena", tratti: ["volo"], immagine: "img/carte/hraesvelgr.jpg", livello: 2, statisticheFisse: { ferocia: 3.6, balzo: 5.4, corazza: 1.7, istinto: 1.3 } },
  { nome: "Cacciatori della Caccia Selvaggia", cultura: "Celtica", tratti: ["volo"], immagine: "img/carte/cacciatori-caccia-selvaggia.jpg", livello: 1, statisticheFisse: { ferocia: 3.0, balzo: 0.4, corazza: 1.5, istinto: 3.1 } },

  // Lotto 2 (volo)
  { nome: "Skvader", cultura: "Norrena", tratti: ["volo"], immagine: "img/carte/skvader.jpg", livello: 1, statisticheFisse: { ferocia: 0.5, balzo: 1.6, corazza: 4.7, istinto: 1.2 } },
  { nome: "Stellio", cultura: "Romana", tratti: ["volo"], immagine: "img/carte/stellio.jpg", livello: 1, statisticheFisse: { ferocia: 1.4, balzo: 3.5, corazza: 2.2, istinto: 0.9 } },
  { nome: "Uccello Stinfalide", cultura: "Greca", tratti: ["volo"], immagine: "img/carte/uccello-stinfalide.jpg", livello: 1, statisticheFisse: { ferocia: 2.2, balzo: 2.2, corazza: 3.1, istinto: 0.5 } },
  { nome: "Valchiria Caduta", cultura: "Norrena", tratti: ["volo"], immagine: "img/carte/valchiria-caduta.jpg", livello: 1, statisticheFisse: { ferocia: 2.1, balzo: 4.3, corazza: 0.5, istinto: 1.1 } },
  { nome: "Veðrfölnir", cultura: "Norrena", tratti: ["volo"], immagine: "img/carte/vedrfolnir.jpg", livello: 2, statisticheFisse: { ferocia: 1.2, balzo: 4.3, corazza: 5.1, istinto: 1.4 } },
  { nome: "Perdice", cultura: "Greca", tratti: ["volo"], immagine: "img/carte/perdice.jpg", livello: 1, statisticheFisse: { ferocia: 0.3, balzo: 3.4, corazza: 2.0, istinto: 2.3 } },

  // Lotto 3 (nuoto)
  { nome: "Aura Marina", cultura: "Greca", tratti: ["nuoto"], immagine: "img/carte/aura-marina.jpg", livello: 1, statisticheFisse: { ferocia: 3.0, balzo: 1.5, corazza: 1.1, istinto: 2.4 } },
  { nome: "Cariddi Minore", cultura: "Greca", tratti: ["nuoto"], immagine: "img/carte/cariddi-minore.jpg", livello: 1, statisticheFisse: { ferocia: 4.2, balzo: 1.4, corazza: 0.1, istinto: 2.3 } },
  { nome: "Ceto Minore", cultura: "Greca", tratti: ["nuoto"], immagine: "img/carte/ceto-minore.jpg", livello: 1, statisticheFisse: { ferocia: 1.5, balzo: 0.5, corazza: 0.2, istinto: 5.8 } },
  { nome: "Draugr Marinaio", cultura: "Norrena", tratti: ["nuoto"], immagine: "img/carte/draugr-marinaio.jpg", livello: 1, statisticheFisse: { ferocia: 1.9, balzo: 3.2, corazza: 1.7, istinto: 1.2 } },
  { nome: "Idriade", cultura: "Greca", tratti: ["nuoto"], immagine: "img/carte/idriade.jpg", livello: 1, statisticheFisse: { ferocia: 2.9, balzo: 0.4, corazza: 1.3, istinto: 3.4 } },
  { nome: "Ippocampo Selvatico", cultura: "Greca", tratti: ["nuoto"], immagine: "img/carte/ippocampo-selvatico.jpg", livello: 1, statisticheFisse: { ferocia: 3.6, balzo: 0.7, corazza: 2.5, istinto: 1.2 } },
  { nome: "Ittiocauro", cultura: "Greca", tratti: ["nuoto"], immagine: "img/carte/ittiocauro.jpg", livello: 1, statisticheFisse: { ferocia: 1.9, balzo: 0.3, corazza: 5.1, istinto: 0.7 } },
  { nome: "Linfatica", cultura: "Romana", tratti: ["nuoto"], immagine: "img/carte/linfatica.jpg", livello: 1, statisticheFisse: { ferocia: 0.3, balzo: 0.2, corazza: 2.6, istinto: 4.9 } },
  { nome: "Naiade", cultura: "Greca", tratti: ["nuoto"], immagine: "img/carte/naiade.jpg", livello: 1, statisticheFisse: { ferocia: 0.5, balzo: 1.8, corazza: 0.4, istinto: 5.3 } },
  { nome: "Nereide", cultura: "Greca", tratti: ["nuoto"], immagine: "img/carte/nereide.jpg", livello: 1, statisticheFisse: { ferocia: 1.0, balzo: 1.1, corazza: 1.1, istinto: 4.8 } },
  { nome: "Pesce d'Oro", cultura: "Orientale", tratti: ["nuoto"], immagine: "img/carte/pesce-doro.jpg", livello: 1, statisticheFisse: { ferocia: 0.9, balzo: 3.6, corazza: 1.8, istinto: 1.7 } },
  { nome: "Scylla Recluta", cultura: "Greca", tratti: ["nuoto"], immagine: "img/carte/scylla-recluta.jpg", livello: 1, statisticheFisse: { ferocia: 0.8, balzo: 0.6, corazza: 1.0, istinto: 5.6 } },
  { nome: "Sirena - Forma Classica", cultura: "Greca", tratti: ["nuoto"], immagine: "img/carte/sirena-forma-classica.jpg", livello: 1, statisticheFisse: { ferocia: 1.3, balzo: 5.4, corazza: 0.7, istinto: 0.6 } },
  { nome: "Sirena - Forma Marina", cultura: "Greca", tratti: ["nuoto"], immagine: "img/carte/sirena-forma-marina.jpg", livello: 1, statisticheFisse: { ferocia: 2.3, balzo: 1.2, corazza: 0.2, istinto: 4.3 } },
  { nome: "Telchino", cultura: "Greca", tratti: ["nuoto"], immagine: "img/carte/telchino.jpg", livello: 1, statisticheFisse: { ferocia: 5.2, balzo: 1.0, corazza: 1.7, istinto: 0.1 } },
  { nome: "Tritone Minore", cultura: "Greca", tratti: ["nuoto"], immagine: "img/carte/tritone-minore.jpg", livello: 1, statisticheFisse: { ferocia: 2.0, balzo: 4.1, corazza: 0.2, istinto: 1.7 } },

  // Lotto 4 (equilibrio)
  { nome: "Alseide", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/alseide.jpg", livello: 1, statisticheFisse: { ferocia: 6.8, balzo: 0.1, corazza: 0.8, istinto: 0.3 } },
  { nome: "Amadriade", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/amadriade.jpg", livello: 1, statisticheFisse: { ferocia: 3.8, balzo: 2.9, corazza: 0.1, istinto: 1.2 } },
  { nome: "Ape di Aristeo", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/ape-di-aristeo.jpg", livello: 1, statisticheFisse: { ferocia: 1.4, balzo: 2.1, corazza: 2.4, istinto: 2.1 } },
  { nome: "Auloniade", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/auloniade.jpg", livello: 1, statisticheFisse: { ferocia: 0.9, balzo: 3.9, corazza: 0.9, istinto: 2.3 } },
  { nome: "Centauro", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/centauro.jpg", livello: 1, statisticheFisse: { ferocia: 0.9, balzo: 0.7, corazza: 4.9, istinto: 1.5 } },
  { nome: "Cerva di Cerinea", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/cerva-di-cerinea.jpg", livello: 1, statisticheFisse: { ferocia: 3.6, balzo: 0.3, corazza: 0.9, istinto: 3.2 } },
  { nome: "Cinghiale di Calidone (cucciolo)", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/cinghiale-di-calidone-cucciolo.jpg", livello: 1, statisticheFisse: { ferocia: 0.5, balzo: 2.4, corazza: 4.9, istinto: 0.2 } },
  { nome: "Coboldo", cultura: "Norrena", tratti: ["equilibrio"], immagine: "img/carte/coboldo.jpg", livello: 1, statisticheFisse: { ferocia: 0.1, balzo: 1.2, corazza: 4.8, istinto: 1.9 } },
  { nome: "Driade", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/driade.jpg", livello: 1, statisticheFisse: { ferocia: 0.7, balzo: 3.4, corazza: 3.6, istinto: 0.3 } },
  { nome: "Dvergr", cultura: "Norrena", tratti: ["equilibrio"], immagine: "img/carte/dvergr.jpg", livello: 1, statisticheFisse: { ferocia: 0.9, balzo: 0.8, corazza: 3.2, istinto: 3.1 } },
  { nome: "Fauno", cultura: "Romana", tratti: ["equilibrio"], immagine: "img/carte/fauno.jpg", livello: 1, statisticheFisse: { ferocia: 1.6, balzo: 1.3, corazza: 2.8, istinto: 2.3 } },
  { nome: "Gallo di Asclepio", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/gallo-di-asclepio.jpg", livello: 1, statisticheFisse: { ferocia: 2.6, balzo: 1.2, corazza: 2.0, istinto: 2.2 } },
  { nome: "Garmr", cultura: "Norrena", tratti: ["equilibrio"], immagine: "img/carte/garmr.jpg", livello: 2, statisticheFisse: { ferocia: 4.2, balzo: 3.1, corazza: 2.8, istinto: 1.9 } },
  { nome: "Gatto di Bubasti", cultura: "Egiziana", tratti: ["equilibrio"], immagine: "img/carte/gatto-di-bubasti.jpg", livello: 1, statisticheFisse: { ferocia: 1.3, balzo: 2.8, corazza: 1.4, istinto: 2.5 } },
  { nome: "Grabakr Giovane", cultura: "Norrena", tratti: ["equilibrio"], immagine: "img/carte/grabakr-giovane.jpg", livello: 1, statisticheFisse: { ferocia: 3.7, balzo: 0.2, corazza: 0.2, istinto: 3.9 } },
  { nome: "Gullinbursti", cultura: "Norrena", tratti: ["equilibrio"], immagine: "img/carte/gullinbursti.jpg", livello: 2, statisticheFisse: { ferocia: 1.5, balzo: 2.2, corazza: 5.8, istinto: 2.5 } },
  { nome: "Hrungnir Giovane", cultura: "Norrena", tratti: ["equilibrio"], immagine: "img/carte/hrungnir-giovane.jpg", livello: 2, statisticheFisse: { ferocia: 5.6, balzo: 1.8, corazza: 3.4, istinto: 1.2 } },
  { nome: "Jotunn Giovane", cultura: "Norrena", tratti: ["equilibrio"], immagine: "img/carte/jotunn-giovane.jpg", livello: 1, statisticheFisse: { ferocia: 0.2, balzo: 2.3, corazza: 5.3, istinto: 0.2 } },

  // Lotto 5 (equilibrio)
  { nome: "Landvættir", cultura: "Norrena", tratti: ["equilibrio"], immagine: "img/carte/landvaettir.jpg", livello: 1, statisticheFisse: { ferocia: 5.9, balzo: 0.6, corazza: 0.7, istinto: 0.8 } },
  { nome: "Limniade", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/limniade.jpg", livello: 1, statisticheFisse: { ferocia: 3.9, balzo: 1.2, corazza: 1.8, istinto: 1.1 } },
  { nome: "Linnormr Giovane", cultura: "Norrena", tratti: ["equilibrio"], immagine: "img/carte/linnormr-giovane.jpg", livello: 1, statisticheFisse: { ferocia: 1.4, balzo: 3.2, corazza: 0.4, istinto: 3.0 } },
  { nome: "Menaide Infuriata", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/menaide-infuriata.jpg", livello: 1, statisticheFisse: { ferocia: 4.5, balzo: 2.4, corazza: 0.9, istinto: 0.2 } },
  { nome: "Mökkurkálfi", cultura: "Norrena", tratti: ["equilibrio"], immagine: "img/carte/mokkurkalfi.jpg", livello: 2, statisticheFisse: { ferocia: 1.1, balzo: 4.8, corazza: 5.0, istinto: 1.1 } },
  { nome: "Oreada", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/oreada.jpg", livello: 1, statisticheFisse: { ferocia: 0.4, balzo: 1.2, corazza: 3.5, istinto: 2.9 } },
  { nome: "Orso di Arcadia", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/orso-di-arcadia.jpg", livello: 1, statisticheFisse: { ferocia: 1.6, balzo: 1.7, corazza: 1.6, istinto: 3.1 } },
  { nome: "Panisco", cultura: "Romana", tratti: ["equilibrio"], immagine: "img/carte/panisco.jpg", livello: 1, statisticheFisse: { ferocia: 0.2, balzo: 2.8, corazza: 2.8, istinto: 2.2 } },
  { nome: "Satiro", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/satiro.jpg", livello: 1, statisticheFisse: { ferocia: 0.1, balzo: 1.6, corazza: 3.6, istinto: 2.7 } },
  { nome: "Segugio di Skadi", cultura: "Norrena", tratti: ["equilibrio"], immagine: "img/carte/segugio-di-skadi.jpg", livello: 1, statisticheFisse: { ferocia: 0.9, balzo: 1.3, corazza: 0.6, istinto: 5.2 } },
  { nome: "Serpenti del Niflheimr", cultura: "Norrena", tratti: ["equilibrio"], immagine: "img/carte/serpenti-del-niflheimr.jpg", livello: 1, statisticheFisse: { ferocia: 2.0, balzo: 1.2, corazza: 0.8, istinto: 4.0 } },
  { nome: "Sileno Giovane", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/sileno-giovane.jpg", livello: 1, statisticheFisse: { ferocia: 0.4, balzo: 0.4, corazza: 4.8, istinto: 2.4 } },
  { nome: "Volpe di Teumesso", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/volpe-di-teumesso.jpg", livello: 2, statisticheFisse: { ferocia: 2.1, balzo: 6.8, corazza: 1.5, istinto: 1.6 } },

  // Lotto 6 (arrampicata)
  { nome: "Anfisbena", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/anfisbena.jpg", livello: 1, statisticheFisse: { ferocia: 4.2, balzo: 0.3, corazza: 1.9, istinto: 1.6 } },
  { nome: "Basilisco Minore", cultura: "Romana", tratti: ["arrampicata"], immagine: "img/carte/basilisco-minore.jpg", livello: 1, statisticheFisse: { ferocia: 2.4, balzo: 2.3, corazza: 3.0, istinto: 0.3 } },
  { nome: "Blemio", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/blemio.jpg", livello: 1, statisticheFisse: { ferocia: 2.8, balzo: 0.3, corazza: 1.5, istinto: 3.4 } },
  { nome: "Cercopo", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/cercopo.jpg", livello: 1, statisticheFisse: { ferocia: 1.1, balzo: 2.9, corazza: 3.9, istinto: 0.1 } },
  { nome: "Chimera Minore", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/chimera-minore.jpg", livello: 3, statisticheFisse: { ferocia: 6.8, balzo: 2.1, corazza: 5.3, istinto: 1.8 } },
  { nome: "Ciclope Operaio", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/ciclope-operaio.jpg", livello: 1, statisticheFisse: { ferocia: 5.0, balzo: 1.8, corazza: 0.6, istinto: 0.6 } },
  { nome: "Cinocefalo", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/cinocefalo.jpg", livello: 1, statisticheFisse: { ferocia: 2.2, balzo: 1.6, corazza: 2.2, istinto: 2.0 } },
  { nome: "Dipsas", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/dipsas.jpg", livello: 1, statisticheFisse: { ferocia: 1.7, balzo: 3.2, corazza: 1.3, istinto: 1.8 } },
  { nome: "Dökkálfar Guerriero", cultura: "Norrena", tratti: ["arrampicata"], immagine: "img/carte/dokkalfar-guerriero.jpg", livello: 1, statisticheFisse: { ferocia: 2.3, balzo: 1.7, corazza: 2.4, istinto: 1.6 } },
  { nome: "Fossegrim", cultura: "Norrena", tratti: ["arrampicata"], immagine: "img/carte/fossegrim.jpg", livello: 1, statisticheFisse: { ferocia: 4.3, balzo: 0.4, corazza: 1.5, istinto: 1.8 } },
  { nome: "Gorgone Corazzata", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/gorgone-corazzata.jpg", livello: 1, statisticheFisse: { ferocia: 3.1, balzo: 1.9, corazza: 1.9, istinto: 1.1 } },
  { nome: "Guerriero d'Ambra", cultura: "Baltica", tratti: ["arrampicata"], immagine: "img/carte/guerriero-dambra.jpg", livello: 1, statisticheFisse: { ferocia: 0.9, balzo: 3.0, corazza: 2.1, istinto: 2.0 } },
  { nome: "Huldra", cultura: "Norrena", tratti: ["arrampicata"], immagine: "img/carte/huldra.jpg", livello: 1, statisticheFisse: { ferocia: 0.9, balzo: 4.0, corazza: 1.0, istinto: 2.1 } },
  { nome: "Idra di Lerna (monotesta)", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/idra-di-lerna-monotesta.jpg", livello: 1, statisticheFisse: { ferocia: 2.7, balzo: 1.8, corazza: 1.6, istinto: 1.9 } },
  { nome: "Iena d'Etiopia", cultura: "Romana", tratti: ["arrampicata"], immagine: "img/carte/iena-detiopia.jpg", livello: 1, statisticheFisse: { ferocia: 3.5, balzo: 3.3, corazza: 1.0, istinto: 0.2 } },
  { nome: "Leone di Citerone", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/leone-di-citerone.jpg", livello: 1, statisticheFisse: { ferocia: 1.4, balzo: 1.3, corazza: 1.0, istinto: 4.3 } },
  { nome: "Leone di Nemea (cucciolo)", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/leone-di-nemea-cucciolo.jpg", livello: 1, statisticheFisse: { ferocia: 3.2, balzo: 1.1, corazza: 2.3, istinto: 1.4 } },

  // Lotto 7 (arrampicata)
  { nome: "Svartálfar", cultura: "Norrena", tratti: ["arrampicata"], immagine: "img/carte/svartalfar.jpg", livello: 1, statisticheFisse: { ferocia: 3.1, balzo: 1.6, corazza: 1.4, istinto: 1.9 } },
  { nome: "Tarand", cultura: "Romana", tratti: ["arrampicata"], immagine: "img/carte/tarand.jpg", livello: 1, statisticheFisse: { ferocia: 2.9, balzo: 1.0, corazza: 1.5, istinto: 2.6 } },
  { nome: "Toro di Maratona", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/toro-di-maratona.jpg", livello: 2, statisticheFisse: { ferocia: 6.4, balzo: 2.2, corazza: 2.6, istinto: 0.8 } },
  { nome: "Troll dei Ponti", cultura: "Norrena", tratti: ["arrampicata"], immagine: "img/carte/troll-dei-ponti.jpg", livello: 1, statisticheFisse: { ferocia: 2.3, balzo: 0.9, corazza: 3.4, istinto: 1.4 } },
  { nome: "Ljósálfar", cultura: "Norrena", tratti: ["arrampicata"], immagine: "img/carte/ljosalfar.jpg", livello: 1, statisticheFisse: { ferocia: 1.6, balzo: 2.9, corazza: 0.7, istinto: 2.8 } },
  { nome: "Lupo di Roma", cultura: "Romana", tratti: ["arrampicata"], immagine: "img/carte/lupo-di-roma.jpg", livello: 1, statisticheFisse: { ferocia: 3.1, balzo: 2.0, corazza: 1.7, istinto: 1.2 } },
  { nome: "Mantichora Giovane", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/mantichora-giovane.jpg", livello: 1, statisticheFisse: { ferocia: 0.1, balzo: 1.0, corazza: 4.5, istinto: 2.4 } },
  { nome: "Minotauro Rinnegato", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/minotauro-rinnegato.jpg", livello: 1, statisticheFisse: { ferocia: 1.3, balzo: 2.4, corazza: 1.7, istinto: 2.6 } },
  { nome: "Mirmidone (Forma Umana)", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/mirmidone-forma-umana.jpg", livello: 1, statisticheFisse: { ferocia: 1.7, balzo: 1.1, corazza: 4.4, istinto: 0.8 } },
  { nome: "Mirmidone", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/mirmidone.jpg", livello: 1, statisticheFisse: { ferocia: 1.9, balzo: 1.4, corazza: 2.4, istinto: 2.3 } },
  { nome: "Nisse", cultura: "Norrena", tratti: ["arrampicata"], immagine: "img/carte/nisse.jpg", livello: 1, statisticheFisse: { ferocia: 4.4, balzo: 0.3, corazza: 0.2, istinto: 3.1 } },
  { nome: "Ophiotauro (cucciolo)", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/ophiotauro-cucciolo.jpg", livello: 1, statisticheFisse: { ferocia: 4.5, balzo: 0.5, corazza: 2.4, istinto: 0.6 } },
  { nome: "Salamandra di Fuoco", cultura: "Romana", tratti: ["arrampicata"], immagine: "img/carte/salamandra-di-fuoco.jpg", livello: 1, statisticheFisse: { ferocia: 1.3, balzo: 4.9, corazza: 0.4, istinto: 1.4 } },
  { nome: "Scitala", cultura: "Romana", tratti: ["arrampicata"], immagine: "img/carte/scitala.jpg", livello: 1, statisticheFisse: { ferocia: 2.2, balzo: 2.8, corazza: 0.4, istinto: 2.6 } },
  { nome: "Skogsrå", cultura: "Norrena", tratti: ["arrampicata"], immagine: "img/carte/skogsra.jpg", livello: 1, statisticheFisse: { ferocia: 1.4, balzo: 1.9, corazza: 2.3, istinto: 2.4 } },
  { nome: "Sparto", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/sparto.jpg", livello: 1, statisticheFisse: { ferocia: 0.8, balzo: 1.0, corazza: 2.6, istinto: 3.6 } },

  // Lotto 8 (Non Comune - arrampicata)
  { nome: "Cernunnos", cultura: "Celtica", tratti: ["arrampicata"], immagine: "img/carte/cernunnos.jpg", livello: 2, statisticheFisse: { ferocia: 0.6, balzo: 2.2, corazza: 7.6, istinto: 1.6 } },
  { nome: "Domovoy", cultura: "Slava", tratti: ["arrampicata"], immagine: "img/carte/domovoy.jpg", livello: 2, statisticheFisse: { ferocia: 1.3, balzo: 5.6, corazza: 0.2, istinto: 4.9 } },
  { nome: "Kikimora delle Paludi", cultura: "Slava", tratti: ["arrampicata"], immagine: "img/carte/kikimora-delle-paludi.jpg", livello: 2, statisticheFisse: { ferocia: 4.6, balzo: 3.8, corazza: 2.4, istinto: 1.2 } },
  { nome: "Korrigan", cultura: "Celtica", tratti: ["arrampicata"], immagine: "img/carte/korrigan.jpg", livello: 2, statisticheFisse: { ferocia: 0.7, balzo: 5.7, corazza: 4.1, istinto: 1.5 } },
  { nome: "Leshy", cultura: "Slava", tratti: ["arrampicata"], immagine: "img/carte/leshy.jpg", livello: 2, statisticheFisse: { ferocia: 3.9, balzo: 0.9, corazza: 5.8, istinto: 1.4 } },

  // Lotto 9 (Non Comune - equilibrio)
  { nome: "Banshee", cultura: "Celtica", tratti: ["equilibrio"], immagine: "img/carte/banshee.jpg", livello: 2, statisticheFisse: { ferocia: 2.5, balzo: 3.9, corazza: 2.9, istinto: 2.7 } },
  { nome: "Cú Sìth", cultura: "Celtica", tratti: ["equilibrio"], immagine: "img/carte/cu-sith.jpg", livello: 2, statisticheFisse: { ferocia: 0.1, balzo: 2.0, corazza: 4.6, istinto: 5.3 } },
  { nome: "Dullahan", cultura: "Celtica", tratti: ["equilibrio"], immagine: "img/carte/dullahan.jpg", livello: 2, statisticheFisse: { ferocia: 2.7, balzo: 3.6, corazza: 4.5, istinto: 1.2 } },
  { nome: "Humbaba Giovane", cultura: "Mesopotamica", tratti: ["equilibrio"], immagine: "img/carte/humbaba-giovane.jpg", livello: 2, statisticheFisse: { ferocia: 1.7, balzo: 4.9, corazza: 0.4, istinto: 5.0 } },

  // Lotto 10 (Non Comune - nuoto)
  { nome: "Bagiennik", cultura: "Slava", tratti: ["nuoto"], immagine: "img/carte/bagiennik.jpg", livello: 2, statisticheFisse: { ferocia: 3.6, balzo: 0.2, corazza: 6.3, istinto: 1.9 } },
  { nome: "Bašmu", cultura: "Mesopotamica", tratti: ["nuoto"], immagine: "img/carte/basmu.jpg", livello: 2, statisticheFisse: { ferocia: 2.1, balzo: 3.7, corazza: 4.0, istinto: 2.2 } },
  { nome: "Bolotnik", cultura: "Slava", tratti: ["nuoto"], immagine: "img/carte/bolotnik.jpg", livello: 2, statisticheFisse: { ferocia: 3.0, balzo: 4.0, corazza: 0.2, istinto: 4.8 } },
  { nome: "Camazotz", cultura: "Maya", tratti: ["nuoto"], immagine: "img/carte/camazotz.jpg", livello: 2, statisticheFisse: { ferocia: 2.2, balzo: 5.5, corazza: 3.9, istinto: 0.4 } },
  { nome: "Kelpie", cultura: "Celtica", tratti: ["nuoto"], immagine: "img/carte/kelpie.jpg", livello: 2, statisticheFisse: { ferocia: 2.3, balzo: 3.3, corazza: 0.4, istinto: 6.0 } },
  { nome: "Kulullû", cultura: "Mesopotamica", tratti: ["nuoto"], immagine: "img/carte/kulullu.jpg", livello: 2, statisticheFisse: { ferocia: 3.6, balzo: 2.5, corazza: 2.1, istinto: 3.8 } },
  { nome: "Lahmu", cultura: "Mesopotamica", tratti: ["nuoto"], immagine: "img/carte/lahmu.jpg", livello: 2, statisticheFisse: { ferocia: 0.5, balzo: 8.0, corazza: 0.9, istinto: 2.6 } },
  { nome: "Vucub-Caquix", cultura: "Maya", tratti: ["nuoto"], immagine: "img/carte/vucub-caquix.jpg", livello: 2, statisticheFisse: { ferocia: 3.8, balzo: 2.9, corazza: 3.2, istinto: 2.1 } },
  { nome: "Rusalka", cultura: "Slava", tratti: ["nuoto"], immagine: "img/carte/rusalka.jpg", livello: 2, statisticheFisse: { ferocia: 6.7, balzo: 1.7, corazza: 1.8, istinto: 1.8 } },
  { nome: "Vodyanoy", cultura: "Slava", tratti: ["nuoto"], immagine: "img/carte/vodyanoy.jpg", livello: 2, statisticheFisse: { ferocia: 2.1, balzo: 0.8, corazza: 6.6, istinto: 2.5 } },
  { nome: "Yum Caax", cultura: "Maya", tratti: ["nuoto"], immagine: "img/carte/yum-caax.jpg", livello: 2, statisticheFisse: { ferocia: 4.7, balzo: 2.3, corazza: 0.3, istinto: 4.7 } },

  // Lotto 11 (Non Comune - vari tratti)
  { nome: "Alkonost", cultura: "Slava", tratti: ["volo"], immagine: "img/carte/alkonost.jpg", livello: 2, statisticheFisse: { ferocia: 4.5, balzo: 1.2, corazza: 2.1, istinto: 4.2 } },
  { nome: "Edimmu", cultura: "Mesopotamica", tratti: [], immagine: "img/carte/edimmu.jpg", livello: 2, statisticheFisse: { ferocia: 1.8, balzo: 3.6, corazza: 5.4, istinto: 1.2 } },
  { nome: "Gallu", cultura: "Mesopotamica", tratti: [], immagine: "img/carte/gallu.jpg", livello: 2, statisticheFisse: { ferocia: 5.9, balzo: 2.3, corazza: 3.0, istinto: 0.8 } },
  { nome: "Gandharva", cultura: "Indiana", tratti: [], immagine: "img/carte/gandharva.jpg", livello: 2, statisticheFisse: { ferocia: 1.4, balzo: 4.6, corazza: 0.9, istinto: 5.1 } },
  { nome: "Ghoul", cultura: "Araba", tratti: [], immagine: "img/carte/ghoul.jpg", livello: 2, statisticheFisse: { ferocia: 4.4, balzo: 1.9, corazza: 4.8, istinto: 0.9 } },
  { nome: "Rarog", cultura: "Slava", tratti: [], immagine: "img/carte/rarog.jpg", livello: 2, statisticheFisse: { ferocia: 3.5, balzo: 5.2, corazza: 1.1, istinto: 2.2 } },
  { nome: "Sirrush", cultura: "Mesopotamica", tratti: [], immagine: "img/carte/sirrush.jpg", livello: 2, statisticheFisse: { ferocia: 5.0, balzo: 1.6, corazza: 4.3, istinto: 1.1 } },

  // Lotto 16 (Comune - revisione: sostituzioni creature non autentiche + nuove per slot liberati dai doppioni)
  { nome: "Ifrit Minore", cultura: "Araba", tratti: ["equilibrio"], immagine: "img/carte/ifrit-minore.jpg", livello: 1, statisticheFisse: { ferocia: 3.6, balzo: 1.4, corazza: 1.8, istinto: 1.2 } },
  { nome: "Alicanto", cultura: "Andina", tratti: ["volo"], immagine: "img/carte/alicanto.jpg", livello: 1, statisticheFisse: { ferocia: 1.1, balzo: 3.4, corazza: 1.6, istinto: 1.9 } },
  { nome: "Zhar-Ptitsa", cultura: "Slava", tratti: ["volo"], immagine: "img/carte/zhar-ptitsa.jpg", livello: 1, statisticheFisse: { ferocia: 1.5, balzo: 4.1, corazza: 0.9, istinto: 1.5 } },
  { nome: "Strix", cultura: "Romana", tratti: ["volo"], immagine: "img/carte/strix.jpg", livello: 1, statisticheFisse: { ferocia: 2.3, balzo: 3.5, corazza: 1.1, istinto: 1.1 } },
  { nome: "Golem", cultura: "Ebraica", tratti: ["arrampicata"], immagine: "img/carte/golem.jpg", livello: 1, statisticheFisse: { ferocia: 3.1, balzo: 0.4, corazza: 3.9, istinto: 0.6 } },
  { nome: "Amarok", cultura: "Inuit", tratti: ["equilibrio"], immagine: "img/carte/amarok.jpg", livello: 1, statisticheFisse: { ferocia: 4.2, balzo: 2.1, corazza: 1.0, istinto: 0.7 } },
  { nome: "Cadejo", cultura: "Centroamericana", tratti: ["equilibrio"], immagine: "img/carte/cadejo.jpg", livello: 1, statisticheFisse: { ferocia: 2.6, balzo: 3.3, corazza: 0.9, istinto: 1.2 } },
  { nome: "Kludde", cultura: "Belga", tratti: ["arrampicata"], immagine: "img/carte/kludde.jpg", livello: 1, statisticheFisse: { ferocia: 2.2, balzo: 3.6, corazza: 1.4, istinto: 0.8 } },
  { nome: "Nanuq", cultura: "Inuit", tratti: ["equilibrio"], immagine: "img/carte/nanuq.jpg", livello: 1, statisticheFisse: { ferocia: 3.4, balzo: 0.7, corazza: 3.2, istinto: 0.7 } },
  { nome: "Scorpione di Gaia", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/scorpione-di-gaia.jpg", livello: 1, statisticheFisse: { ferocia: 3.9, balzo: 1.6, corazza: 2.0, istinto: 0.5 } },
  { nome: "Onibi", cultura: "Giapponese", tratti: ["arrampicata"], immagine: "img/carte/onibi.jpg", livello: 1, statisticheFisse: { ferocia: 1.0, balzo: 2.8, corazza: 0.6, istinto: 3.6 } },
  { nome: "Näkki", cultura: "Finlandese", tratti: ["nuoto"], immagine: "img/carte/nakki.jpg", livello: 1, statisticheFisse: { ferocia: 2.9, balzo: 1.5, corazza: 1.3, istinto: 2.3 } },
  { nome: "Vargr", cultura: "Norrena", tratti: ["equilibrio"], immagine: "img/carte/vargr.jpg", livello: 1, statisticheFisse: { ferocia: 4.4, balzo: 2.0, corazza: 0.9, istinto: 0.7 } },
  { nome: "Yeti", cultura: "Himalayana", tratti: ["arrampicata"], immagine: "img/carte/yeti.jpg", livello: 1, statisticheFisse: { ferocia: 3.3, balzo: 0.9, corazza: 3.0, istinto: 0.8 } },
  { nome: "Baku", cultura: "Giapponese", tratti: ["arrampicata"], immagine: "img/carte/baku.jpg", livello: 1, statisticheFisse: { ferocia: 1.2, balzo: 1.4, corazza: 2.1, istinto: 3.3 } },
  { nome: "Tarasque", cultura: "Francese", tratti: ["arrampicata"], immagine: "img/carte/tarasque.jpg", livello: 1, statisticheFisse: { ferocia: 2.8, balzo: 0.6, corazza: 4.1, istinto: 0.5 } },
  { nome: "Simurgh", cultura: "Persiana", tratti: ["volo"], immagine: "img/carte/simurgh.jpg", livello: 1, statisticheFisse: { ferocia: 1.3, balzo: 3.0, corazza: 1.5, istinto: 2.2 } },
  { nome: "Cinghiale d'Erimanto (cucciolo)", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/cinghiale-d-erimanto-cucciolo.jpg", livello: 1, statisticheFisse: { ferocia: 3.7, balzo: 1.1, corazza: 2.4, istinto: 0.8 } },
  { nome: "Kitsune Giovane", cultura: "Giapponese", tratti: ["equilibrio"], immagine: "img/carte/kitsune-giovane.jpg", livello: 1, statisticheFisse: { ferocia: 1.0, balzo: 2.7, corazza: 0.8, istinto: 3.5 } },
  { nome: "Encantado", cultura: "Amazzonica", tratti: ["equilibrio"], immagine: "img/carte/encantado.jpg", livello: 1, statisticheFisse: { ferocia: 0.7, balzo: 2.2, corazza: 1.3, istinto: 3.8 } },
  { nome: "Makara", cultura: "Indiana", tratti: ["nuoto"], immagine: "img/carte/makara.jpg", livello: 1, statisticheFisse: { ferocia: 3.5, balzo: 1.0, corazza: 2.8, istinto: 0.7 } },

  // Lotto 12 (Non Comune - nessun tratto extra)
  { nome: "Ahuizotl", cultura: "Azteca", tratti: [], immagine: "img/carte/ahuizotl.jpg", livello: 2, statisticheFisse: { ferocia: 4.6, balzo: 3.1, corazza: 0.9, istinto: 3.4 } },
  { nome: "Bunyip", cultura: "Aborigena Australiana", tratti: [], immagine: "img/carte/bunyip.jpg", livello: 2, statisticheFisse: { ferocia: 2.4, balzo: 0.7, corazza: 5.8, istinto: 3.1 } },

  // Lotto 13 (Rara)
  { nome: "Cariddi", cultura: "Greca", tratti: ["nuoto"], immagine: "img/carte/cariddi.jpg", livello: 3, statisticheFisse: { ferocia: 6.5, balzo: 1.4, corazza: 5.3, istinto: 2.8 } },
  { nome: "Cerva di Cerinea Adulta", cultura: "Greca", tratti: [], immagine: "img/carte/cerva-di-cerinea-adulta.jpg", livello: 3, statisticheFisse: { ferocia: 4.0, balzo: 6.2, corazza: 1.3, istinto: 4.5 } },
  { nome: "Cinghiale di Calidone", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/cinghiale-di-calidone.jpg", livello: 3, statisticheFisse: { ferocia: 7.2, balzo: 2.1, corazza: 5.9, istinto: 0.8 } },
  { nome: "Ittiocentauro", cultura: "Greca", tratti: ["nuoto"], immagine: "img/carte/ittiocentauro.jpg", livello: 3, statisticheFisse: { ferocia: 3.4, balzo: 5.6, corazza: 2.1, istinto: 4.9 } },
  { nome: "Scilla", cultura: "Greca", tratti: ["nuoto"], immagine: "img/carte/scilla.jpg", livello: 3, statisticheFisse: { ferocia: 6.8, balzo: 3.5, corazza: 4.2, istinto: 1.5 } },
  { nome: "Tritone", cultura: "Greca", tratti: ["nuoto"], immagine: "img/carte/tritone.jpg", livello: 3, statisticheFisse: { ferocia: 2.9, balzo: 4.1, corazza: 3.6, istinto: 5.4 } },

  // Lotto 14 (Rara)
  { nome: "Cerbero", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/cerbero.jpg", livello: 3, statisticheFisse: { ferocia: 6.9, balzo: 2.3, corazza: 5.4, istinto: 1.4 } },
  { nome: "Chirone", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/chirone.jpg", livello: 3, statisticheFisse: { ferocia: 2.5, balzo: 3.8, corazza: 1.9, istinto: 7.8 } },
  { nome: "Grifone Reale", cultura: "Greca", tratti: ["volo"], immagine: "img/carte/grifone-reale.jpg", livello: 3, statisticheFisse: { ferocia: 6.2, balzo: 5.5, corazza: 3.1, istinto: 1.2 } },
  { nome: "Idra di Lerna", cultura: "Greca", tratti: ["nuoto"], immagine: "img/carte/idra-di-lerna.jpg", livello: 3, statisticheFisse: { ferocia: 5.8, balzo: 1.6, corazza: 6.9, istinto: 1.7 } },
  { nome: "Leone di Nemea", cultura: "Greca", tratti: ["equilibrio"], immagine: "img/carte/leone-di-nemea.jpg", livello: 3, statisticheFisse: { ferocia: 7.5, balzo: 4.6, corazza: 3.1, istinto: 0.8 } },
  { nome: "Minotauro", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/minotauro.jpg", livello: 3, statisticheFisse: { ferocia: 7.9, balzo: 1.3, corazza: 5.6, istinto: 1.2 } },

  // Lotto 15 (Rara)
  { nome: "Apopi Giovane", cultura: "Egiziana", tratti: [], immagine: "img/carte/apopi-giovane.jpg", livello: 3, statisticheFisse: { ferocia: 6.1, balzo: 2.4, corazza: 5.8, istinto: 1.7 } },
  { nome: "Bixi", cultura: "Cinese", tratti: [], immagine: "img/carte/bixi.jpg", livello: 3, statisticheFisse: { ferocia: 2.2, balzo: 1.6, corazza: 8.9, istinto: 3.3 } },
  { nome: "Fenice", cultura: "Greca", tratti: ["volo"], immagine: "img/carte/fenice.jpg", livello: 3, statisticheFisse: { ferocia: 3.1, balzo: 6.4, corazza: 1.5, istinto: 5.0 } },
  { nome: "Huli Jing", cultura: "Cinese", tratti: ["equilibrio"], immagine: "img/carte/huli-jing.jpg", livello: 3, statisticheFisse: { ferocia: 1.8, balzo: 5.9, corazza: 2.6, istinto: 5.7 } },
  { nome: "Kappa", cultura: "Giapponese", tratti: ["nuoto"], immagine: "img/carte/kappa.jpg", livello: 3, statisticheFisse: { ferocia: 4.5, balzo: 3.2, corazza: 2.1, istinto: 6.2 } },
  { nome: "Medusa", cultura: "Greca", tratti: [], immagine: "img/carte/medusa.jpg", livello: 3, statisticheFisse: { ferocia: 5.6, balzo: 4.4, corazza: 1.9, istinto: 4.1 } },
  { nome: "Polifemo", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/polifemo.jpg", livello: 3, statisticheFisse: { ferocia: 8.3, balzo: 1.1, corazza: 6.0, istinto: 0.6 } },
  { nome: "Stinfalidi", cultura: "Greca", tratti: ["volo"], immagine: "img/carte/stinfalidi.jpg", livello: 3, statisticheFisse: { ferocia: 4.9, balzo: 6.7, corazza: 2.5, istinto: 1.9 } },
  { nome: "Valchiria", cultura: "Norrena", tratti: ["volo"], immagine: "img/carte/valchiria.jpg", livello: 3, statisticheFisse: { ferocia: 5.5, balzo: 4.2, corazza: 3.8, istinto: 2.5 } },
  { nome: "Xiezhi", cultura: "Cinese", tratti: [], immagine: "img/carte/xiezhi.jpg", livello: 3, statisticheFisse: { ferocia: 3.7, balzo: 2.5, corazza: 4.9, istinto: 4.9 } },

  // Lotto 17 (Epica) - la vera Prima Fatica
  { nome: "Leone di Nemea Invulnerabile", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/leone-di-nemea-invulnerabile.jpg", livello: 4, statisticheFisse: { ferocia: 9.6, balzo: 3.2, corazza: 6.5, istinto: 0.7 } },

  // Lotto 18 (Mitica) - la vera Idra + il Linnormr generato in questo giro
  { nome: "Idra di Lerna Immortale", cultura: "Greca", tratti: ["nuoto", "arrampicata"], immagine: "img/carte/idra-di-lerna-immortale.jpg", livello: 5, statisticheFisse: { ferocia: 8.9, balzo: 2.4, corazza: 9.3, istinto: 3.4 } },
  { nome: "Linnormr", cultura: "Norrena", tratti: ["nuoto"], immagine: "img/carte/linnormr.jpg", livello: 5, statisticheFisse: { ferocia: 9.8, balzo: 2.1, corazza: 8.7, istinto: 3.4 } },

  // Lotto 19 (Leggendaria) - i 6 Draghi Millenari
  { nome: "Fafnir", cultura: "Norrena", tratti: ["volo", "arrampicata"], immagine: "img/carte/fafnir.jpg", livello: 6, statisticheFisse: { ferocia: 9.5, balzo: 8.2, corazza: 7.1, istinto: 3.2 } },
  { nome: "Yamata no Orochi", cultura: "Giapponese", tratti: ["nuoto", "arrampicata"], immagine: "img/carte/yamata-no-orochi.jpg", livello: 6, statisticheFisse: { ferocia: 10.8, balzo: 3.4, corazza: 9.6, istinto: 4.2 } },
  { nome: "Tiamat", cultura: "Mesopotamica", tratti: ["nuoto", "volo"], immagine: "img/carte/tiamat.jpg", livello: 6, statisticheFisse: { ferocia: 8.9, balzo: 9.4, corazza: 5.3, istinto: 4.4 } },
  { nome: "Vritra", cultura: "Indiana", tratti: ["nuoto", "arrampicata"], immagine: "img/carte/vritra.jpg", livello: 6, statisticheFisse: { ferocia: 7.6, balzo: 4.1, corazza: 10.2, istinto: 6.1 } },
  { nome: "Quetzalcoatl", cultura: "Azteca", tratti: ["volo", "equilibrio"], immagine: "img/carte/quetzalcoatl.jpg", livello: 6, statisticheFisse: { ferocia: 6.4, balzo: 9.8, corazza: 3.5, istinto: 8.3 } },
  { nome: "Ladone", cultura: "Greca", tratti: ["arrampicata", "equilibrio"], immagine: "img/carte/ladone.jpg", livello: 6, statisticheFisse: { ferocia: 5.9, balzo: 3.6, corazza: 11.2, istinto: 7.3 } },

  // Lotto 20 (Non Comune)
  { nome: "Karkinos", cultura: "Greca", tratti: ["nuoto", "arrampicata"], immagine: "img/carte/karkinos.jpg", livello: 2, statisticheFisse: { ferocia: 4.8, balzo: 1.2, corazza: 5.1, istinto: 0.9 } },

  // Lotto 21 (8 Rare, 8 Epiche, 4 Mitiche) - a rinforzare i livelli più scarni del bestiario
  { nome: "Anzu", cultura: "Mesopotamica", tratti: ["volo"], immagine: "img/carte/anzu.jpg", livello: 3, statisticheFisse: { ferocia: 5.5, balzo: 6.0, corazza: 2.0, istinto: 2.5 } },
  { nome: "Nue", cultura: "Giapponese", tratti: ["arrampicata"], immagine: "img/carte/nue.jpg", livello: 3, statisticheFisse: { ferocia: 4.0, balzo: 4.5, corazza: 3.0, istinto: 4.5 } },
  { nome: "Sfinge", cultura: "Greca", tratti: ["arrampicata"], immagine: "img/carte/sfinge.jpg", livello: 3, statisticheFisse: { ferocia: 3.0, balzo: 3.0, corazza: 4.5, istinto: 5.5 } },
  { nome: "Rakshasa", cultura: "Indiana", tratti: ["equilibrio"], immagine: "img/carte/rakshasa.jpg", livello: 3, statisticheFisse: { ferocia: 6.0, balzo: 4.0, corazza: 3.0, istinto: 3.0 } },
  { nome: "Wendigo", cultura: "Algonquina", tratti: ["equilibrio"], immagine: "img/carte/wendigo.jpg", livello: 3, statisticheFisse: { ferocia: 6.5, balzo: 3.5, corazza: 3.0, istinto: 3.0 } },
  { nome: "Manticora", cultura: "Persiana", tratti: ["arrampicata"], immagine: "img/carte/manticora.jpg", livello: 3, statisticheFisse: { ferocia: 6.0, balzo: 3.5, corazza: 4.0, istinto: 2.5 } },
  { nome: "Peryton", cultura: "Medievale", tratti: ["volo"], immagine: "img/carte/peryton.jpg", livello: 3, statisticheFisse: { ferocia: 3.5, balzo: 6.5, corazza: 2.0, istinto: 4.0 } },
  { nome: "Qilin", cultura: "Cinese", tratti: ["equilibrio"], immagine: "img/carte/qilin.jpg", livello: 3, statisticheFisse: { ferocia: 2.5, balzo: 3.5, corazza: 5.5, istinto: 4.5 } },

  { nome: "Garuda", cultura: "Indiana", tratti: ["volo"], immagine: "img/carte/garuda.jpg", livello: 4, statisticheFisse: { ferocia: 5.5, balzo: 7.5, corazza: 3.5, istinto: 3.5 } },
  { nome: "Ammit", cultura: "Egiziana", tratti: ["nuoto"], immagine: "img/carte/ammit.jpg", livello: 4, statisticheFisse: { ferocia: 8.0, balzo: 3.0, corazza: 5.5, istinto: 3.5 } },
  { nome: "Zmey Gorynych", cultura: "Slava", tratti: ["volo", "arrampicata"], immagine: "img/carte/zmey-gorynych.jpg", livello: 5, statisticheFisse: { ferocia: 9.0, balzo: 6.0, corazza: 7.2, istinto: 1.8 } },
  { nome: "Kraken", cultura: "Norrena", tratti: ["nuoto"], immagine: "img/carte/kraken.jpg", livello: 5, statisticheFisse: { ferocia: 7.8, balzo: 3.6, corazza: 9.0, istinto: 3.6 } },
  { nome: "Behemoth", cultura: "Ebraica", tratti: ["arrampicata"], immagine: "img/carte/behemoth.jpg", livello: 4, statisticheFisse: { ferocia: 5.0, balzo: 2.0, corazza: 9.5, istinto: 3.5 } },
  { nome: "Bahamut", cultura: "Araba", tratti: ["nuoto"], immagine: "img/carte/bahamut.jpg", livello: 4, statisticheFisse: { ferocia: 3.5, balzo: 3.0, corazza: 8.5, istinto: 5.0 } },
  { nome: "Cipactli", cultura: "Azteca", tratti: ["nuoto", "arrampicata"], immagine: "img/carte/cipactli.jpg", livello: 4, statisticheFisse: { ferocia: 7.0, balzo: 4.0, corazza: 6.0, istinto: 3.0 } },
  { nome: "Grendel", cultura: "Anglosassone", tratti: ["nuoto"], immagine: "img/carte/grendel.jpg", livello: 4, statisticheFisse: { ferocia: 8.5, balzo: 4.5, corazza: 4.0, istinto: 3.0 } },

  { nome: "Typhon", cultura: "Greca", tratti: ["volo", "arrampicata"], immagine: "img/carte/typhon.jpg", livello: 5, statisticheFisse: { ferocia: 8.5, balzo: 6.0, corazza: 6.0, istinto: 3.5 } },
  { nome: "Fenrir", cultura: "Norrena", tratti: ["arrampicata"], immagine: "img/carte/fenrir.jpg", livello: 5, statisticheFisse: { ferocia: 9.5, balzo: 6.5, corazza: 4.5, istinto: 3.5 } },
  { nome: "Sekhmet", cultura: "Egiziana", tratti: ["equilibrio"], immagine: "img/carte/sekhmet.jpg", livello: 5, statisticheFisse: { ferocia: 9.0, balzo: 5.0, corazza: 5.5, istinto: 4.5 } },
  { nome: "Apophis", cultura: "Egiziana", tratti: ["nuoto"], immagine: "img/carte/apophis.jpg", livello: 5, statisticheFisse: { ferocia: 6.5, balzo: 4.5, corazza: 7.5, istinto: 5.5 } },

  // Lotto 22 (15 Epiche, 5 Mitiche) - 13 mitologie diverse, molte mai toccate prima
  { nome: "Taotie", cultura: "Cinese", tratti: ["equilibrio"], immagine: "img/carte/taotie.jpg", livello: 4, statisticheFisse: { ferocia: 6.5, balzo: 3.0, corazza: 6.5, istinto: 4.0 } },
  { nome: "Tengu", cultura: "Giapponese", tratti: ["volo"], immagine: "img/carte/tengu.jpg", livello: 4, statisticheFisse: { ferocia: 6.0, balzo: 8.0, corazza: 2.5, istinto: 3.5 } },
  { nome: "Vila", cultura: "Slava", tratti: ["arrampicata"], immagine: "img/carte/vila.jpg", livello: 4, statisticheFisse: { ferocia: 4.0, balzo: 6.0, corazza: 3.0, istinto: 7.0 } },
  { nome: "Púca", cultura: "Celtica", tratti: ["equilibrio"], immagine: "img/carte/puca.jpg", livello: 4, statisticheFisse: { ferocia: 5.0, balzo: 7.0, corazza: 3.5, istinto: 4.5 } },
  { nome: "Iku-Turso", cultura: "Finlandese", tratti: ["nuoto"], immagine: "img/carte/iku-turso.jpg", livello: 4, statisticheFisse: { ferocia: 6.5, balzo: 2.5, corazza: 7.0, istinto: 4.0 } },
  { nome: "Aitvaras", cultura: "Baltica", tratti: ["volo"], immagine: "img/carte/aitvaras.jpg", livello: 4, statisticheFisse: { ferocia: 4.5, balzo: 7.5, corazza: 3.0, istinto: 5.0 } },
  { nome: "Cacus", cultura: "Romana", tratti: ["arrampicata"], immagine: "img/carte/cacus.jpg", livello: 4, statisticheFisse: { ferocia: 8.0, balzo: 2.0, corazza: 6.5, istinto: 3.5 } },
  { nome: "Zipacna", cultura: "Maya", tratti: ["nuoto", "arrampicata"], immagine: "img/carte/zipacna.jpg", livello: 4, statisticheFisse: { ferocia: 7.5, balzo: 3.5, corazza: 6.0, istinto: 3.0 } },
  { nome: "Xolotl", cultura: "Azteca", tratti: ["equilibrio"], immagine: "img/carte/xolotl.jpg", livello: 4, statisticheFisse: { ferocia: 5.5, balzo: 4.5, corazza: 4.5, istinto: 5.5 } },
  { nome: "Curupira", cultura: "Amazzonica", tratti: ["arrampicata"], immagine: "img/carte/curupira.jpg", livello: 4, statisticheFisse: { ferocia: 6.0, balzo: 6.5, corazza: 3.0, istinto: 4.5 } },
  { nome: "Muldjewangk", cultura: "Aborigena Australiana", tratti: ["nuoto"], immagine: "img/carte/muldjewangk.jpg", livello: 4, statisticheFisse: { ferocia: 6.0, balzo: 3.0, corazza: 6.5, istinto: 4.5 } },
  { nome: "Qalupalik", cultura: "Inuit", tratti: ["nuoto"], immagine: "img/carte/qalupalik.jpg", livello: 4, statisticheFisse: { ferocia: 5.5, balzo: 4.0, corazza: 6.0, istinto: 4.5 } },
  { nome: "Amaru", cultura: "Andina", tratti: ["nuoto", "arrampicata"], immagine: "img/carte/amaru.jpg", livello: 4, statisticheFisse: { ferocia: 6.5, balzo: 4.0, corazza: 5.5, istinto: 4.0 } },
  { nome: "Melusine", cultura: "Francese", tratti: ["nuoto"], immagine: "img/carte/melusine.jpg", livello: 4, statisticheFisse: { ferocia: 3.5, balzo: 4.5, corazza: 4.5, istinto: 7.5 } },
  { nome: "Nidhogg", cultura: "Norrena", tratti: ["arrampicata"], immagine: "img/carte/nidhogg.jpg", livello: 4, statisticheFisse: { ferocia: 7.5, balzo: 3.0, corazza: 7.0, istinto: 2.5 } },

  { nome: "Zahhak", cultura: "Persiana", tratti: ["arrampicata"], immagine: "img/carte/zahhak.jpg", livello: 5, statisticheFisse: { ferocia: 8.5, balzo: 4.0, corazza: 6.5, istinto: 5.0 } },
  { nome: "Yurlunggur", cultura: "Aborigena Australiana", tratti: ["nuoto", "arrampicata"], immagine: "img/carte/yurlunggur.jpg", livello: 5, statisticheFisse: { ferocia: 7.0, balzo: 5.0, corazza: 7.5, istinto: 4.5 } },
  { nome: "Tlaltecuhtli", cultura: "Azteca", tratti: ["arrampicata"], immagine: "img/carte/tlaltecuhtli.jpg", livello: 5, statisticheFisse: { ferocia: 8.0, balzo: 3.5, corazza: 8.0, istinto: 4.5 } },
  { nome: "Rahu", cultura: "Indiana", tratti: ["volo"], immagine: "img/carte/rahu.jpg", livello: 5, statisticheFisse: { ferocia: 7.5, balzo: 6.5, corazza: 5.5, istinto: 4.5 } },
  { nome: "Baba Yaga", cultura: "Slava", tratti: ["equilibrio"], immagine: "img/carte/baba-yaga.jpg", livello: 5, statisticheFisse: { ferocia: 9.0, balzo: 5.5, corazza: 5.5, istinto: 4.0 } },

  // Lotto 23 (10 Comuni, 4 Non Comuni, 3 Rare, 2 Epiche, 1 Mitica) - 6 mitologie mai toccate prima
  { nome: "Anansi", cultura: "Africana", tratti: ["arrampicata"], immagine: "img/carte/anansi.jpg", livello: 1, statisticheFisse: { ferocia: 1.5, balzo: 2.5, corazza: 1.0, istinto: 3.0 } },
  { nome: "Tikbalang", cultura: "Filippina", tratti: ["arrampicata"], immagine: "img/carte/tikbalang.jpg", livello: 1, statisticheFisse: { ferocia: 2.5, balzo: 2.5, corazza: 1.5, istinto: 1.5 } },
  { nome: "Impundulu", cultura: "Africana", tratti: ["volo"], immagine: "img/carte/impundulu.jpg", livello: 1, statisticheFisse: { ferocia: 2.0, balzo: 3.0, corazza: 0.8, istinto: 2.2 } },
  { nome: "Menehune", cultura: "Polinesiana", tratti: ["arrampicata"], immagine: "img/carte/menehune.jpg", livello: 1, statisticheFisse: { ferocia: 0.8, balzo: 2.2, corazza: 1.5, istinto: 3.5 } },
  { nome: "Dokkaebi", cultura: "Coreana", tratti: ["equilibrio"], immagine: "img/carte/dokkaebi.jpg", livello: 1, statisticheFisse: { ferocia: 1.8, balzo: 1.7, corazza: 2.0, istinto: 2.5 } },
  { nome: "Alux", cultura: "Maya", tratti: ["arrampicata"], immagine: "img/carte/alux.jpg", livello: 1, statisticheFisse: { ferocia: 1.2, balzo: 2.3, corazza: 1.5, istinto: 3.0 } },
  { nome: "Tomte", cultura: "Norrena", tratti: ["equilibrio"], immagine: "img/carte/tomte.jpg", livello: 1, statisticheFisse: { ferocia: 0.7, balzo: 1.5, corazza: 2.3, istinto: 3.5 } },
  { nome: "Adaro", cultura: "Melanesiana", tratti: ["nuoto"], immagine: "img/carte/adaro.jpg", livello: 1, statisticheFisse: { ferocia: 2.2, balzo: 1.8, corazza: 1.5, istinto: 2.5 } },
  { nome: "Boggart", cultura: "Anglosassone", tratti: [], immagine: "img/carte/boggart.jpg", livello: 1, statisticheFisse: { ferocia: 1.5, balzo: 1.5, corazza: 2.5, istinto: 2.5 } },
  { nome: "Sarimanok", cultura: "Filippina", tratti: ["volo"], immagine: "img/carte/sarimanok.jpg", livello: 1, statisticheFisse: { ferocia: 1.0, balzo: 3.2, corazza: 1.0, istinto: 2.8 } },

  { nome: "Aswang", cultura: "Filippina", tratti: ["equilibrio"], immagine: "img/carte/aswang.jpg", livello: 2, statisticheFisse: { ferocia: 3.5, balzo: 2.5, corazza: 2.0, istinto: 4.0 } },
  { nome: "Nekomata", cultura: "Giapponese", tratti: ["arrampicata"], immagine: "img/carte/nekomata.jpg", livello: 2, statisticheFisse: { ferocia: 3.0, balzo: 3.5, corazza: 2.0, istinto: 3.5 } },
  { nome: "Tokoloshe", cultura: "Africana", tratti: ["nuoto"], immagine: "img/carte/tokoloshe.jpg", livello: 2, statisticheFisse: { ferocia: 4.0, balzo: 2.5, corazza: 2.0, istinto: 3.5 } },
  { nome: "Kupua", cultura: "Polinesiana", tratti: ["equilibrio"], immagine: "img/carte/kupua.jpg", livello: 2, statisticheFisse: { ferocia: 2.5, balzo: 3.0, corazza: 2.5, istinto: 4.0 } },

  { nome: "Grootslang", cultura: "Africana", tratti: ["nuoto", "arrampicata"], immagine: "img/carte/grootslang.jpg", livello: 3, statisticheFisse: { ferocia: 6.5, balzo: 2.0, corazza: 5.5, istinto: 2.0 } },
  { nome: "Nuckelavee", cultura: "Celtica", tratti: ["nuoto"], immagine: "img/carte/nuckelavee.jpg", livello: 3, statisticheFisse: { ferocia: 6.0, balzo: 2.5, corazza: 4.5, istinto: 3.0 } },
  { nome: "Gumiho", cultura: "Coreana", tratti: ["equilibrio"], immagine: "img/carte/gumiho.jpg", livello: 3, statisticheFisse: { ferocia: 3.5, balzo: 4.0, corazza: 2.5, istinto: 6.0 } },

  { nome: "Migoi", cultura: "Himalayana", tratti: ["arrampicata"], immagine: "img/carte/migoi.jpg", livello: 4, statisticheFisse: { ferocia: 6.5, balzo: 2.5, corazza: 7.5, istinto: 3.5 } },
  { nome: "Aigamuxa", cultura: "Africana", tratti: ["arrampicata"], immagine: "img/carte/aigamuxa.jpg", livello: 4, statisticheFisse: { ferocia: 7.0, balzo: 4.5, corazza: 5.0, istinto: 3.5 } },

  { nome: "Thunderbird", cultura: "Nativa Americana", tratti: ["volo"], immagine: "img/carte/thunderbird.jpg", livello: 5, statisticheFisse: { ferocia: 7.5, balzo: 8.0, corazza: 4.5, istinto: 4.0 } }
];

// Testi di lore per "Dentro il Mito". Chiave = nome esatto della carta in CARTE_FISSE.
// Le carte non ancora presenti qui mostrano un messaggio segnaposto: aggiungerle qui man mano che vengono scritte.
const LORE_CARTE = {
  "Aquila di Zeus": "L'aquila era l'animale sacro di Zeus, suo messaggero e simbolo del suo potere sul cielo. Secondo il mito, fu proprio un'aquila a rapire il giovane Ganimede per portarlo sull'Olimpo a servire gli dèi come coppiere.<br><br><b>Il mito completo:</b> Oltre al rapimento di Ganimede (in cui talvolta l'aquila è Zeus stesso trasformato, talvolta un servitore divino separato), l'aquila di Zeus fu anche l'uccello che tormentò eternamente Prometeo, divorandogli ogni giorno il fegato che ricresceva durante la notte, punizione per aver rubato il fuoco agli uomini — finché Eracle non la uccise, liberando finalmente il titano.<br><br><b>Contesto culturale:</b> L'aquila divenne il simbolo per eccellenza del potere supremo proprio per questa stretta associazione con Zeus, adottata da Roma (come insegna delle legioni, l'aquila) e da innumerevoli imperi successivi — bizantino, sacro romano, napoleonico, asburgico, fino agli Stati Uniti — come emblema di autorità sovrana.<br><br><b>Curiosità:</b> La combinazione aquila-e-fulmine resta uno dei simboli politici e araldici più riutilizzati nella storia mondiale, direttamente rintracciabile attraverso una tradizione visiva ininterrotta fino a questa specifica associazione mitologica greca.",
  "Arpìa Cacciatrice": "Le Arpie sono spiriti femminili con corpo d'uccello rapace e volto umano, personificazione dei venti violenti e improvvisi. Nel mito tormentarono il re Fineo rubandogli il cibo, finché non furono scacciate dagli Argonauti alati Zete e Calais.<br><br><b>Il mito completo:</b> Fineo, re e profeta punito dagli dèi per aver rivelato troppo dei loro segreti, veniva tormentato dalle Arpie ogni volta che tentava di mangiare: rubavano o contaminavano il suo cibo, condannandolo a una fame perpetua. Solo l'intervento degli Argonauti — in particolare i figli alati di Borea, Zete e Calais, capaci di volare — riuscì infine a scacciarle per sempre.<br><br><b>Contesto culturale:</b> Le Arpie incarnano l'idea greca di punizione divina come tormento incessante e inevitabile, piuttosto che un singolo colpo decisivo — una \"maledizione vivente\" più che un mostro da sconfiggere una volta per tutte.<br><br><b>Curiosità:</b> La parola \"arpia\" sopravvive nell'italiano moderno come insulto per una donna crudele e avida — una delle eredità linguistiche negative di genere più chiaramente sopravvissute dalla mitologia greca dei mostri, ancora in uso quotidiano.",
  "Aura Volante": "Aura era una ninfa associata alla brezza, tanto veloce da vantarsi di correre più svelta della stessa Artemide. La sua superbia le costò cara: fu punita per aver osato sfidare una dea.<br><br><b>Il mito completo:</b> Nel racconto più completo giunto fino a noi (l'epica tarda di Nonno di Panopoli), la punizione di Aura fu orchestrata da Nemesi su richiesta della stessa Artemide: Dioniso, innamoratosi di lei, la fece ubriacare e la possedette nel sonno, lasciandola incinta di due gemelli. Impazzita per la vergogna e il dolore, Aura uccise uno dei due figli e tentò di uccidere anche l'altro, prima di essere trasformata da Zeus in una sorgente — il suo nome sopravvissuto come personificazione della brezza stessa.<br><br><b>Contesto culturale:</b> Questo è uno dei racconti più cupi della mitologia greca sul pericolo specifico di paragonarsi favorevolmente a una dea vergine, legato al tema ricorrente (come nei miti di Niobe o Aracne) della hybris contro la dignità divina, soprattutto femminile, che si conclude in una rovina personale catastrofica.<br><br><b>Curiosità:</b> La parola \"aura\", che indica un'emanazione sottile o un'atmosfera distintiva, è entrata nell'italiano e in altre lingue europee direttamente dal nome di questa ninfa e dalla sua natura essenziale di brezza personificata — un raro caso in cui un mito relativamente oscuro e tragico ha lasciato in eredità una parola comune e quotidiana, spogliata della sua violenta storia originaria.",
  "Cacciatori della Caccia Selvaggia": "Nel folklore nordico ed europeo, la Caccia Selvaggia è un corteo spettrale di cacciatori e segugi che attraversa il cielo notturno, spesso guidato da una divinità o da un'anima dannata. Vederla passare era considerato un presagio di sventura o di guerra imminente.",
  "Caladri": "Uccello bianco della leggenda medievale capace di assorbire la malattia di chi guarda: se il paziente è destinato a guarire, il Caladrio lo fissa negli occhi e vola via portando via il male; se è condannato, gli volta lo sguardo altrove.",
  "Cigno di Apollo": "Il cigno era sacro ad Apollo, dio della musica e della profezia: si credeva che questi uccelli intonassero il loro canto più bello proprio in punto di morte, da cui l'espressione \"canto del cigno\".<br><br><b>Il mito completo:</b> Secondo alcune tradizioni, il cigno trainava il carro di Apollo o ne trasportava l'anima; il nome è legato anche a diversi personaggi di nome Cigno trasformati in questo uccello dal dolore — il più celebre, un amico di Fetonte, pianse così intensamente la sua morte lungo il fiume Eridano che gli dèi, impietositi, lo trasformarono in un cigno.<br><br><b>Contesto culturale:</b> L'associazione del cigno con l'eccellenza poetica e musicale rese l'uccello un simbolo ricorrente per i poeti stessi nella tradizione letteraria occidentale successiva (poeti chiamati metaforicamente \"cigni\", come Shakespeare definito \"il Cigno di Avon\").<br><br><b>Curiosità:</b> L'espressione \"canto del cigno\", usata ancora oggi per descrivere l'ultima grande opera di qualcuno prima della morte o del ritiro, deriva direttamente da questa antica (per quanto biologicamente falsa) credenza greca secondo cui i cigni cantano solo una volta nella vita, proprio prima di morire.",
  "Fenice Pulcino": "La Fenice è l'uccello immortale per eccellenza: quando sente avvicinarsi la morte, si dà fuoco sul proprio nido per poi rinascere dalle sue stesse ceneri, simbolo di eterno rinnovamento.<br><br><b>Il mito completo:</b> Le fonti antiche non concordano su come esattamente nasca la nuova Fenice: alcune raccontano che sia lo stesso uccello genitore a trasformarsi e rinascere dalle proprie ceneri, altre (più vicine alla tradizione di Erodoto) narrano che un nuovo e distinto piccolo nasca da una massa a forma d'uovo di mirra formata dai resti del genitore, che il giovane uccello porta poi fino a Eliopoli per seppellire il proprio stesso predecessore — rendendo il \"pulcino\" al tempo stesso la medesima Fenice immortale e, paradossalmente, il proprio figlio.<br><br><b>Contesto culturale:</b> Questo paradosso della Fenice come genitore e figlio insieme, sé stessa e la propria erede, affascinò in particolare i teologi cristiani successivi, che vi trovarono un parallelo naturale utile alla dottrina della resurrezione — il pulcino di Fenice non è semplicemente un nuovo uccello, è quello vecchio, trasformato e rinnovato.<br><br><b>Curiosità:</b> Il naturalista romano Plinio il Vecchio affermò di conoscere con precisione le riapparizioni cicliche della Fenice, legandole a date storiche specifiche di Roma, trattando il mito con sorprendente letteralità quasi burocratica — un caso interessante di scrittura \"scientifica\" antica che accoglie affermazioni mitologiche come fatti verificabili accanto alla storia naturale genuina.",
  "Grifone Recluta": "Metà leone e metà aquila, il Grifone univa nella tradizione greca e persiana la forza del re degli animali terrestri alla maestosità del re dei cieli. Si narrava custodisse gelosamente tesori d'oro nelle montagne.<br><br><b>Il mito completo:</b> Oltre al celebre ruolo di guardiani dell'oro nella Scizia, i giovani grifoni venivano immaginati in alcune tradizioni come allevati appositamente per custodire recinti sacri e tesorerie templari — l'immagine del grifone decorava emblemi di scudi, ornamenti dei tetti dei templi (akroteria) e armature proprio perché la creatura simboleggiava una protezione incorruttibile e vigile fin dalla giovane età.<br><br><b>Contesto culturale:</b> La duplice natura del grifone (aquila e leone, entrambi predatori supremi nei rispettivi regni) rendeva anche un grifone \"giovane\" un potente simbolo protettivo nella cultura visiva greca, comparendo su innumerevoli scudi, monete e dettagli architettonici come guardiani in formazione di spazi sacri o preziosi.<br><br><b>Curiosità:</b> L'immagine del grifone compare su alcune delle più antiche monete greche superstiti, in particolare da città come Teo e Abdera in Asia Minore, le cui economie dipendevano da rotte commerciali che passavano vicino a regioni associate all'oro custodito dai grifoni — un caso in cui la mitologia ha plasmato direttamente l'iconografia economica e civica reale.",
  "Hræsvelgr": "Nella mitologia norrena, questo gigante in forma d'aquila siede ai confini del mondo: è il battito delle sue ali immense a generare tutti i venti che soffiano sulla Terra.<br><br><b>Il mito completo:</b> Nominato nel Vafþrúðnismál dell'Edda poetica, dove il saggio gigante Vafþrúðnir, interrogato da un Odino travestito in una gara di sapienza, rivela il nome e la natura di Hræsvelgr come uno dei diversi enigmi cosmologici posti nella sfida. Il suo nome si traduce letteralmente come \"Divoratore di Cadaveri\", un dettaglio inquietante secondo alcune interpretazioni — oltre a generare vento battendo le ali, potrebbe anche nutrirsi dei morti, legandolo tematicamente al ruolo di Nidhogg stesso, divoratore di cadaveri all'estremità opposta della struttura cosmica dell'albero del mondo.<br><br><b>Contesto culturale:</b> I giganti generatori di vento e gli uccelli cosmici rappresentano uno schema cosmologico norreno ricorrente per spiegare i fenomeni naturali (il vento, il tempo atmosferico) attraverso un'agenzia incarnata e personificata piuttosto che forze naturali impersonali — riflettendo una visione del mondo più ampia in cui persino fenomeni meteorologici apparentemente astratti avevano \"cause\" mitologiche specifiche, dotate di nome e motivazione.<br><br><b>Curiosità:</b> Il formato della gara di sapienza del Vafþrúðnismál, dove viene rivelata l'esistenza di Hræsvelgr, è di per sé un genere distintivo all'interno della poesia mitologica norrena — la conoscenza cosmologica trasmessa non attraverso una narrazione diretta ma attraverso un teso duello di domande e risposte in cui il perdente rimette la propria testa, conferendo alla presentazione di Hræsvelgr nella mitologia registrata una cornice narrativa dall'esito insolitamente alto rispetto alla maggior parte delle altre creature.",
  "Ieraco": "Secondo il mito greco, Ieraco (Hierax) fu trasformato in falco da Apollo ed Ermes come punizione per la sua empietà, condannato a vivere da predatore alato per l'eternità.<br><br><b>Il mito completo:</b> Ieraco era un uomo — troiano o misio, secondo le fonti — celebre per la sua devozione esclusiva a Demetra e per il disprezzo mostrato verso Apollo e gli altri dèi celesti, prediligendo unicamente le divinità della terra. Questa scelta suscitò l'ira di Apollo ed Ermes, che lo trasformarono in falco — uccello ironicamente sacro proprio ad Apollo, come simbolo profetico, nonostante fosse diventato la forma della punizione di Ieraco.<br><br><b>Contesto culturale:</b> Il mito riflette la convinzione greca nella metamorfosi come punizione divina calibrata esattamente sulla colpa: l'eccessiva devozione di Ieraco a un solo gruppo di dèi, escludendo gli altri, si traduce in un'eterna irrequietezza da predatore.<br><br><b>Curiosità:</b> La parola greca hierax significa letteralmente \"falco\", e ha dato origine al nome scientifico del genere Hierax, tuttora usato per un gruppo di piccoli falchi — un altro caso di terminologia mitologica e descrittiva greca sopravvissuta direttamente nella tassonomia zoologica moderna.",
  "Ippogrifo": "Creatura nata dall'unione (ritenuta impossibile) tra un grifone e una giumenta, l'Ippogrifo divenne celebre nei poemi cavallereschi rinascimentali come cavalcatura capace di volare a velocità straordinarie.",
  "Keres della Cenere": "Le Keres sono spiriti femminili greci che si aggirano sui campi di battaglia in cerca di anime da reclamare, personificazioni oscure della morte violenta e improvvisa.<br><br><b>Il mito completo:</b> Distinte dal più pacato dio della morte Thanatos, le Keres erano raffigurate come piccole figure alate dotate di zanne e artigli, che bevevano il sangue dei morenti sui campi di battaglia. Nell'Iliade, prima del duello finale tra Achille ed Ettore, Zeus pesa su una bilancia d'oro le rispettive \"sorti\" (kēres) dei due guerrieri per stabilire chi sia destinato a morire.<br><br><b>Contesto culturale:</b> Le Keres rappresentavano la convinzione greca che non tutte le morti fossero uguali: la morte violenta e sanguinosa in battaglia aveva propri agenti soprannaturali distinti dalla morte naturale e pacifica, riflettendo l'ansia costante della società greca per la morte in guerra.<br><br><b>Curiosità:</b> La celebre scena della \"pesatura delle anime\" nell'Iliade (le bilance d'oro di Zeus che determinano la sorte di Ettore) è uno dei primi esempi letterari del motivo della psicostasia — la pesatura divina delle anime o dei destini — che riecheggia indipendentemente anche nella tradizione egizia (la pesatura del cuore contro la piuma di Maat) e in quella cristiana (la pesatura delle anime nel Giudizio).",
  "Nachtrabe": "Nel folklore tedesco, il \"corvo notturno\" è un uccello di malaugurio il cui verso nella notte annuncia una morte imminente nel villaggio.<br><br><b>Il mito completo:</b> Distinto dal vero corvo biologico, il Nachtrabe nella tradizione popolare tedesca e più ampiamente germanica veniva spesso descritto non come un uccello vero e proprio ma come un'entità mutaforma, quasi spettrale — a volte si diceva fosse lo spirito irrequieto di un bambino non battezzato o di una persona morta senza i riti funebri appropriati, condannata a volare in eterno nel cielo notturno, il suo verso specificamente distinto da quello di un normale corvo per la sua qualità innaturale e lacerante.<br><br><b>Contesto culturale:</b> I presagi di morte legati a uccelli notturni sono uno schema di credenza popolare estremamente diffuso in tutta la tradizione nordeuropea e centroeuropea più ampiamente (non esclusivo della sola cultura germanica), riflettendo un'ansia premoderna comune per i suoni notturni inspiegabili e il genuino mistero su cosa, esattamente, potesse sentirsi chiamare nell'oscurità oltre la vista umana.<br><br><b>Curiosità:</b> La tradizione folkloristica del Nachtrabe persistette robustamente nella credenza popolare rurale tedesca relativamente moderna, documentata da folkloristi del XIX secolo (inclusi gli sforzi di raccolta folkloristica più ampi dei Fratelli Grimm) ben oltre il momento in cui la maggior parte della popolazione urbana istruita aveva abbandonato tali credenze — a dimostrazione di come queste tradizioni popolari sopravvivessero spesso molto più a lungo nella cultura orale rurale di quanto la documentazione scritta o accademica ufficiale potrebbe inizialmente suggerire.",
  "Nattramn": "Figura del folklore scandinavo simile al Nachtrabe: si diceva fosse lo spirito di una persona morta senza pace, il cui grido lacerante risuonava nelle notti di tempesta.<br><br><b>Il mito completo:</b> Radicato specificamente nella tradizione popolare svedese (distinto dal Nachtrabe tedesco, sebbene chiaramente imparentato nel concetto), il Nattramn era ritenuto lo spirito tormentato di qualcuno morto di morte violenta o ingiusta, in particolare vittime di omicidio o persone morte consumate dall'odio e da una rabbia irrisolta — il suo grido durante le tempeste era ritenuto rispecchiare specificamente l'angoscia e la furia della morte violenta originaria, legando il fenomeno direttamente a un'ingiustizia terrena irrisolta piuttosto che a una semplice irrequietezza.<br><br><b>Contesto culturale:</b> La tradizione del Nattramn riflette uno schema di credenza popolare scandinavo più ampio che collega i fenomeni atmosferici (le tempeste in particolare) al disturbo spirituale e ai debiti morali irrisolti — si riteneva che le morti violente o ingiuste potessero letteralmente disturbare l'ordine naturale finché non fossero adeguatamente affrontate o vendicate.<br><br><b>Curiosità:</b> Variazioni regionali dello stesso concetto folkloristico di fondo (uno spirito-uccello urlante legato alle tempeste, presagio di morte) compaiono in molteplici tradizioni scandinave e nordeuropee più ampie sotto nomi locali diversi, suggerendo un substrato genuinamente diffuso e antico di credenza popolare precristiana sulla morte violenta e gli spiriti irrequieti, sopravvissuto e regionalmente adattato fino all'epoca moderna.",
  "Nefele": "Nube plasmata da Zeus a immagine di Era per ingannare il temerario Issione, Nefele divenne poi madre dei Centauri e, in un'altra storia, madre di Frisso ed Elle, salvati in volo da un ariete dal vello d'oro.<br><br><b>Il mito completo:</b> Issione si era vantato di desiderare Era stessa; Zeus, per metterlo alla prova, plasmò una nuvola dalle sue sembianze. Issione si unì a Nefele credendola davvero la dea, e dalla loro unione nacquero i Centauri. In un mito distinto, Nefele fu anche madre di Frisso ed Elle: per salvarli da una matrigna crudele, inviò un ariete dal vello d'oro capace di volare, che portò in salvo i due fratelli — l'origine stessa della leggenda del Vello d'Oro cercato in seguito da Giasone.<br><br><b>Contesto culturale:</b> Nefele incarna l'inganno come strumento di punizione divina contro la tracotanza: Issione paga la propria hybris non con violenza diretta ma con uno stratagemma, e la sua punizione finale — legato in eterno a una ruota infuocata nel Tartaro — è uno dei tormenti più severi dell'intera mitologia greca.<br><br><b>Curiosità:</b> Il termine scientifico \"nefologia\", lo studio delle nuvole, deriva dalla stessa radice greca nephos/nephelē — un'eredità linguistica diretta, seppur tecnica, del nome di questa figura mitologica.",
  "Níðhöggr Giovane": "Nidhogg è il drago-serpente che rode incessantemente le radici dell'albero cosmico Yggdrasill nella mitologia norrena, nutrendo un'antica inimicizia con l'aquila che siede sulla cima.<br><br><b>Il mito completo:</b> Il nome stesso \"Níðhöggr\" è ricco di significato nel norreno antico — combina níð (un termine per un'onta profonda e quasi ritualizzata, legata strettamente ai concetti norreni di onore e disonore) con höggr (\"colpitore\" o \"tagliatore\") — così che il nome si traduce approssimativamente come \"Colpitore Malevolo\" o \"Colui che Colpisce con Malizia\", segnandolo fin dalla nascita come incarnazione della malizia disonorevole all'interno dell'ordine cosmico, distinto dai draghi più semplicemente mostruosi definiti solo dalla dimensione o dalla violenza.<br><br><b>Contesto culturale:</b> Questo peso etimologico lega Nidhogg specificamente alle ansie culturali norrene sul níð — una forma di vergogna sociale così grave nella società dell'epoca vichinga che accusare qualcuno di níð, o esserne accusati, poteva essere di per sé devastante legalmente e socialmente, a volte persino giustificando la violenza come risposta; dare a un mostro cosmico il nome di questo concetto lo eleva da semplice minaccia fisica a personificazione del disonore stesso che rode le fondamenta del mondo.<br><br><b>Curiosità:</b> Poiché il níð aveva un peso sociale così specifico e severo nel diritto e nella consuetudine reali della Scandinavia dell'epoca vichinga (con veri codici legali che affrontavano le accuse di níð e le loro conseguenze), il nome di Nidhogg rappresenta uno degli esempi più chiari di una figura mitologica il cui nome attinge direttamente a un concetto legale e culturale reale e socialmente carico, piuttosto che descrivere semplicemente l'aspetto fisico o una mostruosità generica.",
  "Skvader": "Creatura del folklore svedese, ibrido tra una lepre e un gallo cedrone con le ali: nacque nell'Ottocento come scherzo tassidermico, ma entrò talmente nell'immaginario popolare da diventare leggenda vera e propria.<br><br><b>Il mito completo:</b> Creato nel 1918 dal tassidermista svedese Rudolf Granberg, che combinò il corpo di una lepre con le ali, la coda e le piume delle spalle di un gallo cedrone come deliberato scherzo tassidermico e pezzo dimostrativo della propria abilità, lo Skvader si ispirò a genuini racconti popolari svedesi già in circolazione, seppur biologicamente confusi, secondo cui le lepri sarebbero state capaci di accoppiarsi con gli uccelli generando prole alata — la creazione di Granberg diede forma fisica e tangibile a un pezzo di folklore orale regionale già esistente ma mai documentato prima.<br><br><b>Contesto culturale:</b> Lo Skvader occupa una posizione genuinamente unica negli studi folkloristici come caso documentato di una creatura leggendaria \"costruita\" o \"inventata\" che tuttavia divenne autenticamente assorbita nell'identità e nella tradizione locale — la città di Sundsvall, dove il pezzo tassidermico originale è ancora esposto, ha adottato ufficialmente lo Skvader come mascotte e simbolo culturale locale.<br><br><b>Curiosità:</b> L'esemplare tassidermico originale dello Skvader del 1918 è ancora oggi esposto al pubblico presso il Museo di Sundsvall in Svezia, rendendolo una delle uniche creature mitologiche dell'intera collezione il cui manufatto fisico \"originale\" e fondativo può ancora essere visitato e osservato di persona da chiunque oggi — un caso genuinamente insolito di mitologia con un punto d'origine fisico verificabile e databile, invece dell'irrintracciabile tradizione orale antica.",
  "Stellio": "Nelle Metamorfosi di Ovidio, il ragazzo Ascalabo deride Demetra assetata mentre beve avidamente: la dea, offesa, lo trasforma in una lucertola maculata, lo stellio.",
  "Uccello Stinfalide": "Mostruosi uccelli dal becco e dagli artigli di bronzo, capaci di scagliare le proprie piume come frecce: sconfiggerli fu la sesta fatica di Eracle, che li fece alzare in volo con un sonaglio di bronzo forgiato da Efesto.<br><br><b>Il mito completo:</b> Ogni singolo uccello stinfalide possedeva piume abbastanza affilate da poter essere scagliate come frecce o giavellotti quando l'animale si scuoteva in volo — un dettaglio che alcuni commentatori antichi collegavano a incontri reali con uccelli acquatici dall'aspetto metallico (forse ibis o gru dal piumaggio insolito), il cui riflesso in volo e sotto il sole poteva apparire da lontano come metallo.<br><br><b>Contesto culturale:</b> La minaccia del singolo uccello (una creatura capace di un attacco a distanza, quasi un'arma vivente) rendeva gli uccelli Stinfalidi unici tra i mostri greci come pericolo moltiplicato dal numero più che dalla dimensione o dalla forza singola — la loro pericolosità nasceva specificamente dal comportamento di stormo, un tipo di minaccia mostruosa diverso dai giganti o serpenti solitari.<br><br><b>Curiosità:</b> I geografi greci successivi ipotizzarono che gli uccelli Stinfalidi sopravvissuti si fossero trasferiti definitivamente nella regione del Mar Nero (su un'isola chiamata poi \"Isola di Ares\"), dove gli Argonauti, in un mito successivo separato, avrebbero dovuto respingerne l'attacco usando rumore e battiti di scudi — un'eco narrativa diretta della stessa soluzione del sonaglio di bronzo di Eracle, a dimostrazione di come i miti successivi riciclassero le soluzioni precedenti come sapere ormai consolidato.",
  "Valchiria Caduta": "Le Valchirie sono figure femminili norrene che scelgono chi cade in battaglia e chi verrà accolto nel Valhalla: una Valchiria \"caduta\" ha infranto il proprio giuramento, spesso per amore verso un mortale.<br><br><b>Il mito completo:</b> Brynhild, incaricata da Odino di garantire la vittoria a un determinato re in battaglia, favorì invece il guerriero avversario più giovane secondo il proprio giudizio — disobbedendo apertamente al comando esplicito di Odino. Come punizione, Odino la punse con una spina del sonno, le tolse lo status di Valchiria, e la rinchiuse in una fortezza circondata da un anello di fiamme magiche, decretando che avrebbe dormito finché un mortale abbastanza coraggioso da attraversare il fuoco non fosse venuto a svegliarla e sposarla. L'eroe Sigurd (fresco dall'uccisione di Fafnir) attraversò le fiamme, la svegliò, e i due si innamorarono profondamente scambiandosi giuramenti — ma la tragedia seguì quando Sigurd, in seguito drogato con una pozione dell'oblio da una famiglia reale rivale, sposò un'altra donna (Gudrun) senza ricordare il legame precedente con Brynhild; quando l'inganno fu svelato, Brynhild, tra dolore e furia, orchestrò la morte di Sigurd e poi si tolse la vita per raggiungerlo sulla sua pira funebre, assicurando che sarebbero stati uniti nella morte se non nella vita.<br><br><b>Contesto culturale:</b> La tragedia di Brynhild e Sigurd divenne una delle tragedie romantiche più influenti dell'intera tradizione letteraria germanica, ispirando direttamente l'epica medievale tedesca dei Nibelunghi e, molto più tardi, il ciclo di quattro opere dell'Anello di Richard Wagner, consacrandola come una delle tragedie mitiche d'amore più durature della cultura occidentale.<br><br><b>Curiosità:</b> La struttura narrativa fondamentale \"l'eroe attraversa le fiamme per svegliare la fanciulla addormentata\" presenta somiglianze sorprendenti e molto discusse con la successiva fiaba della Bella Addormentata — alcuni folkloristi tracciano una plausibile linea di influenza o un'origine narrativa antica condivisa tra il mito di Brynhild e la fiaba molto più tarda e addolcita.",
  "Veðrfölnir": "Nella cosmologia norrena, questo sparviero siede tra gli occhi dell'aquila in cima a Yggdrasill, osservando i nove mondi dall'alto dell'albero cosmico.<br><br><b>Il mito completo:</b> Descritto nel Gylfaginning dell'Edda in prosa da Snorri Sturluson, Veðrfölnir occupa una delle posizioni più specifiche e stranamente precise dell'intera cosmologia norrena — appollaiato letteralmente tra gli occhi dell'aquila senza nome in cima a Yggdrasil, essa stessa già una figura cosmica significativa, impegnata nella faida eterna con Nidhogg trasmessa da Ratatoskr — rendendo Veðrfölnir una sorta di sentinella cosmica secondaria, quasi ornamentale, la cui funzione esatta oltre al semplice \"osservare\" resta in gran parte non spiegata nelle fonti superstiti.<br><br><b>Contesto culturale:</b> Il dettaglio straordinariamente specifico, quasi architettonico, della cosmologia norrena (uno sparviero posizionato esattamente tra gli occhi di un'aquila in cima all'albero del mondo) riflette quanto meticolosamente le fonti eddiche cercassero di mappare ogni livello e ogni abitante della struttura cosmica dei nove mondi, anche per figure dall'importanza narrativa apparentemente minima.<br><br><b>Curiosità:</b> Il nome di Veðrfölnir si traduce probabilmente come qualcosa come \"Sbiadito dal Vento\" o \"Sbiancato dalla Tempesta\", adatto alla sua posizione cosmica esposta e in alta quota — ma al di là di questa singola menzione nell'Edda in prosa, non svolge alcun ruolo attivo ulteriore in nessun mito superstite, rendendolo uno degli esempi più puri della mitologia norrena di una creatura che esiste quasi interamente per la completezza cosmologica piuttosto che per la funzione narrativa.",
  "Perdice": "Secondo il mito greco, Perdice era il talentuoso nipote di Dedalo: geloso della sua bravura, Dedalo lo spinse da una torre, ma Atena lo salvò trasformandolo in pernice, un uccello che da allora vola sempre basso, senza dimenticare la caduta.<br><br><b>Il mito completo:</b> Perdice, giovane nipote e apprendista di Dedalo, mostrò fin dalla più giovane età una straordinaria inventiva naturale — accreditato in alcune versioni dell'invenzione della sega (ispirata dalla spina dorsale di un pesce o dai denti di un serpente) e del compasso, invenzioni che minacciavano di eclissare la fama dello stesso famoso zio come miglior artigiano della storia. Consumato dall'invidia professionale, Dedalo spinse Perdice dalla cima dell'Acropoli di Atene; Atena, testimone della caduta e mossa a pietà dal genuino talento e dall'immeritato destino del ragazzo, lo trasformò a mezz'aria in una pernice — un uccello che, significativamente, non costruisce mai il nido in alto sugli alberi e vola sempre vicino al suolo, evitando per sempre le altezze per il ricordo ancestrale della propria caduta fatale.<br><br><b>Contesto culturale:</b> Questo mito funziona come un monito pungente sul pericolo corrosivo dell'invidia professionale, anche (o soprattutto) all'interno dei legami familiari — Dedalo, altrimenti celebrato come l'archetipo storico dell'inventore geniale, si dimostra capace di una gretta ferocia omicida quando la propria reputazione si sente minacciata da un parente più giovane e più talentuoso.<br><br><b>Curiosità:</b> Questo stesso mito viene talvolta citato dagli studiosi in relazione alla storia molto più celebre di Dedalo e Icaro (il proprio figlio, morto volando troppo vicino al sole con ali di cera costruite dal padre) — notando uno schema tematico sorprendente per cui il genio di Dedalo porta ripetutamente disastro sui giovani a lui più vicini, sia attraverso violenza diretta (Perdice) sia attraverso un'invenzione troppo sicura di sé (Icaro).",
  "Anemoi": "Nella mitologia greca sono gli dèi-venti, figli di Eos e Astreo: Borea del nord, Zefiro del ponente, Noto del sud ed Euro dell'est. Governavano le stagioni e potevano scatenare tempeste o brezze gentili a loro piacimento.<br><br><b>Il mito completo:</b> Ogni vento aveva una personalità distinta: Borea, violento e freddo, rapì la principessa ateniese Orizia portandola con sé nella sua dimora tracia; Zefiro, dolce e legato alla primavera, amava il giovane Giacinto, e fu proprio la sua gelosia (deviando per invidia un disco lanciato da Apollo) a causarne la morte accidentale; Noto portava le tempeste estive; Euro restava il più indefinito, associato a un tempo instabile e sfortunato.<br><br><b>Contesto culturale:</b> I venti erano venerati con santuari reali: ad Atene sorge ancora oggi la Torre dei Venti, costruita nel I secolo a.C., che raffigura tutte le otto personificazioni dei venti su altrettante facce ottagonali.<br><br><b>Curiosità:</b> La Torre dei Venti di Atene è uno dei più antichi monumenti meteorologici e segnavento della storia, ancora in piedi oggi — testimonianza di quanto seriamente i Greci considerassero la mitologia dei venti come sapere pratico e civico, non solo racconto religioso.",
  "Huginn, Corvo di Odino": "Uno dei due corvi che ogni giorno sorvolano il mondo per conto di Odino, insieme al fratello Muninn. Il suo nome significa \"Pensiero\": al tramonto torna a sussurrare all'orecchio del padre degli dèi tutto ciò che ha visto.<br><br><b>Il mito completo:</b> Il fratello di Huginn, Muninn (\"Memoria\"), completa la coppia; insieme, ogni alba volano attraverso tutti e nove i mondi raccogliendo informazioni, per poi tornare ogni sera a posarsi sulle spalle di Odino e riferire tutto ciò che hanno visto. Lo stesso Odino, nel Grímnismál dell'Edda poetica, esprime una genuina ansia per il timore che possano non fare ritorno — preoccupandosi più per il sicuro ritorno di Muninn che per quello di Huginn, un dettaglio piccolo ma rivelatore, che suggerisce come Odino tema la perdita della memoria persino più della perdita del pensiero stesso.<br><br><b>Contesto culturale:</b> La coppia di corvi riflette la concezione norrena di Odino come divinità definita fondamentalmente dalla ricerca attiva e dall'accumulo di conoscenza (parallela al sacrificio di un occhio al pozzo di Mímir, e all'autoimpiccagione su Yggdrasil per ottenere le rune) — anche come sovrano supremo degli dèi, Odino dipende da agenti esterni per estendere la propria consapevolezza oltre i propri limiti fisici.<br><br><b>Curiosità:</b> I corvi avevano un significato culturale speciale in tutto il mondo vichingo oltre a questo mito — le navi vichinghe portavano talvolta corvi rilasciati appositamente per aiutare i marinai a individuare la terraferma osservandone la direzione di volo (una pratica che richiama la storia biblica del corvo di Noè), e l'immagine del corvo compare in modo prominente su stendardi e insegne di battaglia vichinghe, forse invocando direttamente i corvi di Odino come presagio di vittoria.",
  "Pegaso": "Cavallo alato nato dal sangue di Medusa decapitata da Perseo. Con uno zoccolo fece scaturire la fonte Ippocrene sul monte Elicona, sacra alle Muse, e in seguito portò in cielo l'eroe Bellerofonte contro la Chimera.<br><br><b>Il mito completo:</b> Dopo la sconfitta della Chimera, narrata nella scheda dedicata alla creatura, Bellerofonte divenne sempre più arrogante, convinto che la propria vittoria gli desse il diritto di volare su Pegaso fino all'Olimpo stesso, per unirsi agli dèi. Zeus, offeso da tanta hybris, inviò un tafano a pungere Pegaso, facendo imbizzarrire il cavallo e disarcionando violentemente Bellerofonte, che precipitò a terra sopravvivendo gravemente ferito, storpio e cieco, condannato a trascorrere il resto della vita vagando in solitudine e vergogna, evitato da tutti i mortali. Pegaso, invece, proseguì da solo fino all'Olimpo, dove Zeus lo accolse e gli affidò l'onorato compito di portare i suoi fulmini.<br><br><b>Contesto culturale:</b> La storia di Pegaso completa uno schema morale classico greco — hybris seguita da nemesis, la caduta — ma con una divisione unica della punizione: l'eroe mortale cade, mentre la creatura divina o semidivina ascende, illustrando come i miti greci distinguano spesso nettamente tra ciò a cui i mortali possono legittimamente aspirare e ciò che appartiene propriamente alla sfera divina.<br><br><b>Curiosità:</b> Pegaso fu infine collocato tra le stelle come costellazione, una delle più grandi del cielo notturno, e il suo stesso nome potrebbe derivare dal greco pēgē, \"sorgente\" o \"fonte\", legato direttamente al suo ruolo nella creazione della fonte Ippocrene con un singolo colpo di zoccolo — il proprio nome che commemora uno dei suoi gesti mitologici più celebri.",

  "Aura Marina": "Variante marina delle antiche ninfe dell'aria, l'Aura era la personificazione della brezza che increspa la superficie del mare: i naviganti la invocavano per un vento propizio, temendone al contrario i capricci improvvisi.<br><br><b>Il mito completo:</b> Mentre la storia tragica della ninfa Aura appartiene alla terraferma e al dominio di Artemide, i naviganti antichi veneravano specificamente le aurae (al plurale, come classe generale di spiriti della brezza) come i venti leggeri e favorevoli essenziali per una navigazione sicura — distinte dai temuti Anemoi, i grandi venti di tempesta, queste erano i soffi leggeri e propizi che gonfiavano le vele senza mettere in pericolo le navi.<br><br><b>Contesto culturale:</b> I naviganti del Mediterraneo antico, interamente dipendenti dal vento per la propulsione, mantenevano pratiche cultuali genuine dedicate alle brezze favorevoli, distinte dai più temuti grandi dèi dei venti — piccoli rituali di bordo e offerte per assicurarsi un'aura benevola piuttosto che una tempesta degli Anemoi.<br><br><b>Curiosità:</b> La parola \"aura\", ancora oggi usata per descrivere un'atmosfera sottile che circonda una persona o un luogo, è entrata nell'uso comune proprio attraverso questa tradizione marittima e generale della brezza, distinta — seppur collegata — dal mito individuale e tragico della ninfa omonima.",
  "Cariddi Minore": "Cariddi era un mostro marino che tre volte al giorno inghiottiva e risputava enormi quantità d'acqua, creando un vortice mortale nello Stretto di Messina, proprio di fronte alla tana di Scilla: Ulisse dovette scegliere quale dei due pericoli affrontare.<br><br><b>Il mito completo:</b> I geografi e i filosofi naturali antichi presero Cariddi sorprendentemente sul serio, considerandola un fenomeno reale e spiegabile più che pura fantasia: lo storico Tucidide descrisse le vere e pericolose correnti di marea dello Stretto di Messina in termini quasi documentaristici, mentre autori di epoca romana successiva discussero se lo schema \"tre volte al giorno\" riflettesse osservazioni genuine, seppur esagerate, dei reali cicli di marea o corrente in quello specifico stretto.<br><br><b>Contesto culturale:</b> Questa fusione tra scienza e mito riflette come gli intellettuali greci e romani cercassero spesso spiegazioni razionali e naturali dietro i propri miti ereditati — trattando Cariddi meno come fantasia soprannaturale e più come un racconto drammatizzato e personificato di un fenomeno naturale genuinamente pericoloso, da rispettare e navigare con attenzione.<br><br><b>Curiosità:</b> Gli oceanografi moderni confermano che lo Stretto di Messina presenta davvero correnti di marea insolitamente complesse e genuinamente pericolose, causate dall'incontro tra il Mar Tirreno e il Mar Ionio — il che significa che l'antico mito \"esagerato\" di Cariddi era, nel suo nucleo geografico, costruito su un pericolo marittimo reale e tuttora misurabile.",
  "Ceto Minore": "Ceto (Keto) era un'antica divinità marina, madre insieme a Forco di alcune delle creature più temute della mitologia greca: le Gorgoni, le Graie e il drago Ladone, guardiano del giardino delle Esperidi.<br><br><b>Il mito completo:</b> Figlia di Gaia e Ponto, il mare primordiale, Ceto si unì al fratello Forco per formare una delle coppie \"genitrici di mostri\" più prolifiche dell'intera mitologia greca, seconda forse solo a Tifone ed Echidna: insieme generarono le Gorgoni (compresa Medusa), le Graie (le tre sorelle grigie che condividevano un solo occhio e un solo dente), il drago Ladone, e secondo alcune tradizioni anche Scilla. Il nome stesso di Ceto passò poi genericamente a indicare qualunque grande mostro marino nell'uso greco successivo — la parola \"ketos\" divenne il termine standard per le grandi creature del mare.<br><br><b>Contesto culturale:</b> Ceto rappresenta la generazione primordiale e pre-olimpica di divinità, incarnazione di forze naturali grezze (il mare stesso, personificato come mostruoso e pericoloso) piuttosto che dell'ordine divino civilizzato — i suoi figli mostruosi rappresentano collettivamente il mondo naturale \"selvaggio\" infine sottomesso, domato o sconfitto dalla generazione eroica e olimpica successiva.<br><br><b>Curiosità:</b> Il termine scientifico moderno \"Cetacea\" (balene, delfini e focene) deriva direttamente dal nome di Ceto attraverso la parola greca generica \"ketos\" per mostro marino — il che significa che il nome di questa antica dea primordiale sopravvive oggi nella classificazione biologica marina mainstream, completamente spogliato del suo originario contesto mostruoso e mitologico.",
  "Draugr Marinaio": "Nel folklore norreno, il draugr è un morto che non trova pace e torna dalla tomba per custodire i propri beni. I marinai periti in mare senza sepoltura erano tra i più temuti: si diceva vagassero ancora tra i relitti, ostili a chiunque si avvicinasse.<br><br><b>Il mito completo:</b> I draugar (al plurale), nella più ampia tradizione norrena, erano ritenuti in grado di mantenere e persino potenziare la propria forza fisica dopo la morte, capaci di un'immensa capacità di mutare dimensione, forza sovrumana e talvolta persino di trasformarsi in forma animale (le foche erano specificamente associate ai draugar dei marinai annegati, dato che il legame della creatura con il mare rendeva questa trasformazione particolarmente adatta); si riteneva fossero motivati principalmente da un feroce possesso dei propri beni funebri o, nel caso specifico dei marinai annegati, dal risentimento verso i vivi per i riti funebri impropri o assenti che li avevano lasciati incapaci di passare correttamente nell'aldilà.<br><br><b>Contesto culturale:</b> La tradizione del draugr riflette profonde ansie norrene riguardo alla corretta sepoltura e al rito funebre — non dare ai morti i riti corretti non era semplicemente una mancanza di rispetto, ma si riteneva rischiasse genuinamente di creare una minaccia pericolosa e irrequieta per la comunità dei vivi, rendendo la pratica funebre corretta una questione di sicurezza comunitaria pratica più che di semplice osservanza religiosa.<br><br><b>Curiosità:</b> La tradizione del draugr è ampiamente considerata uno degli antenati storici e folkloristici diretti del moderno archetipo dello zombie nella cultura popolare — a differenza dell'evoluzione più aristocratica e seducente del folklore vampiresco successivo, l'enfasi del draugr sul decadimento fisico, la forza sovrumana e l'aggressività territoriale si mappa molto più direttamente sulle convenzioni della moderna narrativa zombie.",
  "Idriade": "Ninfa delle acque dolci, custode di sorgenti e ruscelli, spesso raffigurata con un'anfora (hydria) da cui versa l'acqua che dà vita ai fiumi.<br><br><b>Il mito completo:</b> Le Idriadi erano specificamente associate alla hydria, l'alta anfora usata per trasportare l'acqua, centrale nella vita domestica e rituale greca antica: la loro iconografia (una ninfa che versa eternamente acqua da un'anfora) personificava direttamente la sorgente stessa del flusso di un ruscello o di una fonte, più che il semplice abitarla.<br><br><b>Contesto culturale:</b> Questa immagine legata al vaso avvicina le Idriadi alla pratica religiosa quotidiana greca reale intorno all'approvvigionamento dell'acqua, un'attività essenziale e spesso comunitaria (in particolare per le donne) presso fontane e sorgenti pubbliche, che portavano frequentemente dediche votive alla propria ninfa residente.<br><br><b>Curiosità:</b> La parola greca \"hydria\" è direttamente imparentata con \"hydor\" (acqua) — la stessa radice dietro \"idra\", \"idrogeno\" e \"idraulico\" — a dimostrazione di come questa singola radice antica abbia generato un'intera famiglia di termini mitologici e scientifico-tecnici moderni tuttora attivi in molte lingue.",
  "Ippocampo Selvatico": "Creatura per metà cavallo e per metà pesce, l'ippocampo trainava il carro di Poseidone attraverso i flutti: il suo nome ha dato origine a quello della piccola regione del cervello legata alla memoria.<br><br><b>Il mito completo:</b> Oltre a trainare il carro di Poseidone, gli ippocampi compaiono in tutta l'arte greca e romana come simboli generali della potenza del mare domata dagli dèi, spesso raffigurati insieme a Tritoni e Nereidi in processioni marine; alcuni naturalisti romani si chiesero se gli ippocampi rappresentassero racconti esagerati di creature marine reali e poco familiari, come i veri e propri piccoli cavallucci marini, ingranditi attraverso generazioni di narrazione — sebbene l'ippocampo mitologico resti un concetto ibrido cavallo-pesce ben più grande e distinto.<br><br><b>Contesto culturale:</b> L'ippocampo incarnava il fascino greco per l'addomesticamento del potere grezzo del mare — aggiogare letteralmente un ibrido cavallo-pesce al carro di un dio rappresenta un dominio controllato sulle forze naturali caotiche, un tema visivo ricorrente in tutta la mitologia marina greca.<br><br><b>Curiosità:</b> La struttura cerebrale chiamata \"ippocampo\" (cruciale per la formazione della memoria) fu così battezzata nel XVI secolo da anatomisti convinti che la sua forma curva ricordasse questa creatura mitologica marina — uno degli esempi più bizzarri della storia in cui un termine scientifico moderno deriva direttamente dall'immaginario mitologico antico piuttosto che dalla funzione.",
  "Ittiocauro": "Gli Ittiocentauri erano creature con torso umano, zampe anteriori equine e coda di pesce, spesso raffigurate al seguito di Poseidone o durante la nascita di Afrodite dalla schiuma del mare.<br><br><b>Il mito completo:</b> Pur strettamente imparentata (e spesso visivamente indistinguibile) dagli Ittiocentauri della tradizione legata alla nascita di Afrodite, questa variante del nome compare più specificamente in contesti artistici e letterari che raffigurano il seguito reale di Poseidone — accompagnando le processioni del carro del dio del mare insieme a Tritoni e Nereidi come cortigiani fedeli degli abissi, piuttosto che legata specificamente al racconto della nascita di Afrodite.<br><br><b>Contesto culturale:</b> La nomenclatura sovrapposta e talvolta incoerente delle creature marine ibride nelle fonti antiche (Ittiocentauro, e varie varianti locali del nome) riflette come la \"sistematizzazione\" mitologica di epoca tardo-antica ed ellenistica fosse spesso più libera e regionalmente variabile di quanto un pubblico moderno, abituato ad alberi genealogici mitologici più ordinati, tenda a immaginare.<br><br><b>Curiosità:</b> Queste piccole varianti di nomenclatura tra le fonti antiche sono un utile promemoria che la mitologia greca non fu mai un canone unico e ufficiale — sopravvisse come tradizione orale e artistica viva e regionalmente diversificata, con città, poeti e artisti diversi che offrivano proprie versioni e nomi locali per creature marine ibride sostanzialmente simili.",
  "Linfatica": "Il termine latino \"lympha\" indicava le acque e le ninfe che le abitavano: i Romani credevano che chi avesse la sventura di scorgerne una nello specchio di un fiume potesse essere colpito da una forma di delirio, detto per questo \"linfatico\".",
  "Naiade": "Ninfe greche delle acque dolci, abitavano sorgenti, fiumi e fontane donando loro il potere di guarigione: si diceva che la loro presenza rendesse un luogo sacro e la sua acqua benedetta.<br><br><b>Il mito completo:</b> Le Naiadi presiedevano sorgenti d'acqua dolce, fiumi e fontane, ciascuna specifica fonte d'acqua avendo la propria naiade dedicata, il che le rendeva straordinariamente numerose e legate a luoghi precisi, rispetto a divinità più centralizzate. Erano considerate divinità minori ma genuinamente potenti, capaci sia di benedire (acque curative, fertilità) sia di maledire (follia, annegamento) chi ne offendeva il dominio — il mito di Ila, compagno di Eracle sulla nave Argo, racconta come le naiadi, innamoratesi della sua bellezza, lo trascinarono per sempre nella loro sorgente, senza che venisse mai più ritrovato, a testimonianza sia del loro fascino che del loro pericolo.<br><br><b>Contesto culturale:</b> Il culto delle Naiadi rimase una pratica religiosa locale genuina in tutta la Grecia antica per secoli — molte sorgenti e pozzi reali avevano piccoli santuari o offerte votive dedicate alla propria naiade residente, testimoniando come queste figure mitologiche \"minori\" fossero, nella pratica religiosa quotidiana, spesso più immediatamente rilevanti per la vita di tutti i giorni dei Greci comuni (acqua pulita, guarigione, agricoltura) rispetto ai distanti dèi olimpici.<br><br><b>Curiosità:</b> La parola \"naiade\" deriva dal greco naiein, \"scorrere\", descrivendo direttamente la loro natura e funzione essenziale — la biologia moderna usa ancora \"naiade\" come termine tecnico per la fase larvale acquatica di alcuni insetti (come le libellule e le effimere), una piccola ma genuina sopravvivenza della terminologia greca antica sulle ninfe nel vocabolario scientifico contemporaneo.",
  "Nereide": "Le cinquanta figlie di Nereo e Doride popolavano il mare come cortigiane di Poseidone, danzando tra le onde: tra loro Teti, madre di Achille, e Anfitrite, sposa dello stesso dio del mare.<br><br><b>Il mito completo:</b> Le Nereidi venivano spesso raffigurate mentre cavalcavano delfini o ippocampi nell'arte greca e romana, particolarmente diffuse nei mosaici e nei rilievi funerari di epoca romana, all'interno del cosiddetto \"tiaso marino\" — lo stesso motivo decorativo che vede protagonisti anche i Tritoni e gli Ittiocentauri.<br><br><b>Contesto culturale:</b> A differenza di molte ninfe greche legate al pericolo, le Nereidi erano figure costantemente benevole e protettive per i naviganti — sono sopravvissute preghiere votive autentiche indirizzate a loro per un viaggio sicuro.<br><br><b>Curiosità:</b> Il loro padre Nereo era conosciuto come \"il Vecchio del Mare\", una figura profetica capace di mutare forma, che — come il collega dio marino Proteo — poteva essere costretto a rivelare vere profezie solo se tenuto fermo con forza attraverso tutte le sue trasformazioni: un motivo ricorrente nel mito greco, \"lottare con chi cambia forma per estorcergli la verità\".",
  "Pesce d'Oro": "Figura ricorrente nelle fiabe popolari di tutta Europa: un pesce magico capace di esaudire desideri, spesso a patto che chi lo cattura non ecceda mai nella propria richiesta, pena la perdita di tutto.",
  "Scylla Recluta": "In origine una splendida ninfa, Scilla fu trasformata da una rivale gelosa in un mostro con sei teste canine intorno alla vita, condannata a divorare i marinai che osavano avvicinarsi al suo scoglio.<br><br><b>Il mito completo:</b> Prima della sua tragica trasformazione, Scilla era conosciuta tra le ninfe marine della costa siciliana per la propria bellezza e per l'abitudine di bagnarsi in una pozza di marea appartata e limpida — fu lì che il pescatore divenuto dio marino Glauco la vide per la prima volta, innamorandosene perdutamente, dando avvio alla catena di gelosia (l'amore non corrisposto di Circe per lo stesso Glauco) che l'avrebbe infine condannata.<br><br><b>Contesto culturale:</b> La vita pacifica di Scilla prima della trasformazione, come ninfa comune e amata, rende il suo destino mostruoso successivo particolarmente tragico nei racconti antichi — il pubblico antico avrebbe compreso la sua mostruosità non come malvagità innata ma come un'ingiusta punizione inflitta a una figura innocente e amabile, rafforzando lo schema greco già notato con Medusa.<br><br><b>Curiosità:</b> Alcune ceramiche antiche raffigurano Scilla in uno stato di transizione, mezza trasformata — ancora riconoscibilmente bella dalla vita in su, ma già con teste canine che spuntano dal basso — gli artisti antichi trovavano evidentemente questo momento liminale e intermedio di trasformazione mostruosa più drammaticamente avvincente delle sue forme pienamente umana o pienamente mostruosa prese singolarmente.",
  "Sirena - Forma Classica": "Nella tradizione greca più antica, incluso nell'Odissea, le Sirene non erano donne-pesce ma donne-uccello: il loro canto ammaliante attirava i naviganti verso gli scogli, ed Ulisse si fece legare all'albero della nave pur di ascoltarlo senza perire.<br><br><b>Il mito completo:</b> Nell'Odissea di Omero, Circe avverte Ulisse del canto irresistibile delle Sirene prima che la nave passi vicino alla loro isola. Seguendo il suo consiglio, Ulisse ordina all'equipaggio di tapparsi le orecchie con cera d'api, mentre lui solo, volendo ascoltare il leggendario canto senza morirne (il canto delle Sirene era letale — spingeva chi lo ascoltava a gettarsi in mare o a lasciarsi consumare sull'isola tra le ossa delle vittime precedenti), si fa legare saldamente all'albero della nave, ordinando ai compagni di ignorare qualunque sua richiesta di essere liberato finché non fossero passati oltre in sicurezza. Il numero esatto e i nomi delle Sirene variano a seconda delle fonti (spesso due o tre: Partenope, Ligea, Leucosia tra i nomi più ricorrenti), e una tradizione successiva racconta che fossero originariamente ancelle di Persefone, trasformate in creature per metà uccello da Demetra (o per loro stessa richiesta, in cerca di ali per andare a cercare Persefone rapita) dopo non essere riuscite a impedirne il rapimento da parte di Ade.<br><br><b>Contesto culturale:</b> La trasformazione delle Sirene da donne-uccello nell'immagine oggi dominante delle sirene-pesce avvenne gradualmente durante il periodo medievale, quando il folklore mediterraneo e poi quello europeo più ampio fusero la mitologia greca delle Sirene con tradizioni nordeuropee separate di spiriti delle acque — la comune equivalenza moderna \"Sirena = donna pesce\" è una fusione culturale di secoli successiva, non la concezione greca originale.<br><br><b>Curiosità:</b> La parola \"sirena\" sopravvive direttamente nell'italiano moderno come termine per un dispositivo d'allarme sonoro (la sirena dei veicoli di emergenza) — un'eco linguistica interessante, dato che il pericolo delle sirene mitologiche ORIGINALI derivava da un canto troppo bello e ammaliante per resistervi, essenzialmente la qualità opposta (un rumore deliberatamente sgradevole e attira-attenzione) del significato moderno della parola, pur condividendo entrambi l'idea centrale di un segnale acustico irresistibile e ineludibile.",
  "Sirena - Forma Marina": "Solo nel Medioevo l'immagine della Sirena si fuse con quella delle ondine e delle donne-pesce nordiche, dando origine alla sirena con coda che conosciamo oggi, molto diversa dall'originale figura alata greca.<br><br><b>Il mito completo:</b> Il passaggio dalla Sirena-uccello alla Sirena-pesce avvenne gradualmente man mano che i racconti dei naviganti mediterranei si fondevano con il folklore nordeuropeo separato su ondine e spiriti delle acque durante il primo Medioevo; al tempo dei bestiari medievali (XII-XIII secolo), la sirena dalla coda di pesce era ormai diventata l'immagine dominante, completa di specchio e pettine come nuovi attributi iconografici del tutto assenti dalla tradizione greca originale.<br><br><b>Contesto culturale:</b> I bestiari cristiani medievali reinterpretarono la Sirena specificamente come allegoria morale della lussuria e della tentazione mondana — il suo bel busto che attira gli uomini verso la rovina rispecchiava le ansie religiose contemporanee sulla seduzione femminile e il pericolo spirituale, una lettura moralizzante assente dal racconto omerico originale, più moralmente neutro.<br><br><b>Curiosità:</b> Il logo della Starbucks, uno dei simboli aziendali moderni più riconoscibili al mondo, raffigura direttamente una sirena-pesce a due code derivata proprio da questa tradizione iconografica medievale — un esempio notevole di come una trasformazione mitologica millenaria plasmi ancora oggi il branding visivo riconosciuto globalmente.",
  "Telchino": "I Telchini erano demoni marini dell'isola di Rodi, abilissimi fabbri capaci di forgiare le prime statue e armi divine: la tradizione li ricorda anche come invidiosi maghi, capaci di scatenare tempeste con arti oscure.<br><br><b>Il mito completo:</b> Considerati i primi abitanti mitici di Rodi, ai Telchini si attribuiva l'invenzione stessa della lavorazione dei metalli: forgiarono il tridente di Poseidone e altre armi divine. La leggenda successiva li trasformò in maghi malevoli dotati di malocchio, capaci di controllare il tempo atmosferico e causare pestilenze, finché non furono infine distrutti o scacciati dagli dèi (spesso Apollo, o un diluvio inviato da Zeus) per punirli delle loro arti oscure.<br><br><b>Contesto culturale:</b> I Telchini riflettono l'ambivalenza greca verso la maestria tecnologica e magica: sono al tempo stesso inventori portatori di civiltà e temuti maghi oscuri, incarnando l'ansia per un potere esercitato senza saggezza.<br><br><b>Curiosità:</b> La tradizione rodia antica usava il mito dei Telchini per spiegare la reale e antica tradizione metallurgica dell'isola e la sua fama come centro di fusione del bronzo — un mito letteralmente costruito per raccontare l'origine di un'industria locale genuina.",
  "Tritone Minore": "Figlio di Poseidone e Anfitrite, Tritone è l'araldo del mare: soffiando nella sua conchiglia può placare le onde più furiose o scatenare la tempesta, a seconda del suo umore.<br><br><b>Il mito completo:</b> Con il tempo, la tradizione artistica greca successiva, e in particolare quella ellenistica e romana, moltiplicò l'unico dio Tritone con nome proprio in un'intera classe generica di divinità marine minori maschili — i \"tritoni\" (al plurale, minuscolo), attendenti dalla coda di pesce che popolavano il seguito di Poseidone, Anfitrite e altri dèi del mare in innumerevoli mosaici, rilievi di sarcofagi e sculture di fontane, proprio come le singole Nereidi con nome proprio diedero origine al termine generico \"nereide\" per le ninfe marine collettivamente.<br><br><b>Contesto culturale:</b> Questa proliferazione riflette uno schema più ampio e ben documentato dell'arte religiosa greco-romana successiva: divinità singole e narrativamente significative del mito arcaico divennero spesso \"tipi\" decorativi — figure generiche che popolavano elaborate scene mitologiche — man mano che la cultura artistica e letteraria successiva privilegiava l'abbondanza visiva e la ricchezza decorativa rispetto alla rigorosa genealogia mitologica.<br><br><b>Curiosità:</b> Gli scultori di fontane rinascimentali e barocchi (celebre su tutte la Fontana di Trevi a Roma, e innumerevoli altre fontane europee) attinsero direttamente a questa tradizione successiva del \"tritone generico\" piuttosto che all'originale dio omerico singolo — il che significa che l'immagine mentale che la maggior parte delle persone oggi ha di un \"tritone\" deriva in realtà da questa tradizione secondaria e moltiplicata, non dal mito originale.",

  "Alseide": "Ninfa greca dei boschetti e delle radure, meno nota delle sue \"sorelle\" ma ugualmente legata alla vita silenziosa della foresta.<br><br><b>Il mito completo:</b> Le Alseidi abitavano specificamente gli alse (boschetti sacri), distinte dalle più celebri Driadi (legate a un singolo albero) o dalle Naiadi (legate all'acqua) — rappresentavano la sacralità dell'intero spazio boschivo come un unico recinto sacro unificato, spesso sede di altari all'aperto e santuari, piuttosto che di un singolo albero o sorgente.<br><br><b>Contesto culturale:</b> I boschetti sacri (alsē) avevano un significato religioso genuino e ben documentato in tutta la Grecia antica come santuari naturali protetti, spesso intatti — tagliare legname o cacciare in un boschetto sacro riconosciuto era un tabù grave, e le Alseidi personificavano proprio questa sacralità specifica e legata al luogo del boschetto nel suo insieme, più che di una singola caratteristica naturale al suo interno.<br><br><b>Curiosità:</b> Alcuni boschetti sacri greci antichi sopravvissero come boscaglie protette e indisturbate per molti secoli proprio grazie a questo tabù religioso — trasformandoli involontariamente in alcune delle prime riserve naturali de facto dell'antichità, protette non da una legge ma da un genuino timore religioso di offendere la propria Alseide guardiana.",
  "Amadriade": "A differenza delle driadi comuni, l'Amadriade è legata indissolubilmente a un singolo albero: se quello muore o viene abbattuto, anche la ninfa perisce con lui, motivo per cui i Greci trattavano i boschi sacri con grande rispetto.<br><br><b>Il mito completo:</b> Uno dei racconti più celebri di una singola Amadriade narra di una ninfa innamoratasi di un mortale, Reco, dopo che questi aveva salvato il suo albero dal crollo; lei accettò di diventare sua amante a condizione che restasse fedele e attento ai suoi segnali, ma Reco, distratto durante una partita a dama, ignorò un'ape che lei gli aveva inviato come messaggera — furiosa per la sua trascuratezza, lo accecò per sempre come punizione. Un altro racconto celebre, questa volta dal punto di vista dell'albero stesso, narra di come il re Erisittone di Tessaglia, abbattendo una possente quercia sacra a Demetra nonostante le suppliche dell'albero sanguinante (il sangue di un'Amadriade morente che scorreva dalla ferita), fu maledetto dalla dea con una fame eterna e insaziabile che lo condusse infine a divorare la propria stessa carne.<br><br><b>Contesto culturale:</b> Entrambi i miti rafforzano la stessa ansia greca fondamentale per il rispetto dovuto alla presenza sacra e animata della natura — che sia trascuratezza romantica (Reco) o distruzione violenta (Erisittone), mancare di rispetto al legame di un'Amadriade con il proprio albero comporta sempre gravi conseguenze soprannaturali, spesso fisiche.<br><br><b>Curiosità:</b> Il mito di Reco è uno dei pochi racconti greci in cui una ninfa punisce non violenza o distruzione, ma semplice disattenzione romantica — una storia sorprendentemente moderna sul non accorgersi o non rispondere ai segnali del proprio partner, ancora risonante come monito quasi 2500 anni dopo.",
  "Ape di Aristeo": "Aristeo, dio minore protettore dell'apicoltura, imparò l'arte delle api dalle ninfe che lo allevarono; quando perse tutto il suo sciame per aver causato indirettamente la morte di Euridice, dovette sacrificare del bestiame per farne rinascere uno nuovo.<br><br><b>Il mito completo:</b> Il racconto completo, narrato da Virgilio nelle Georgiche, spiega che Aristeo inseguì amorosamente Euridice attraverso un prato, e nella fuga da lui la donna calpestò un serpente e morì per il morso — la stessa morte che spinse Orfeo a scendere negli Inferi per riportarla in vita. Come punizione indiretta, l'intero sciame di api di Aristeo morì di malattia. Disperato, consultò il profeta marino Proteo (con l'aiuto della madre, la ninfa Cirene, che lo aiutò a lottare e interrogare il mutevole vecchio dio del mare), apprendendo che solo attraverso il sacrificio rituale di alcuni buoi — lasciando che le loro carcasse generassero naturalmente un nuovo sciame attraverso la decomposizione, un rito chiamato bugonia, genuinamente creduto e praticato in qualche forma nell'antichità — avrebbe potuto ripristinare le sue api perdute.<br><br><b>Contesto culturale:</b> Il rituale della bugonia riflette credenze antiche reali, seppur biologicamente errate, sulla generazione spontanea — gli apicoltori antichi credevano genuinamente che le api potessero nascere da carcasse animali in decomposizione nelle giuste condizioni rituali, una credenza sopravvissuta in alcune tradizioni agricole fino a tarda antichità e persino richiamata in alcuni passi biblici (l'indovinello di Sansone sulla \"dolcezza dal forte\", legato a una carcassa di leone e alle api, nel Libro dei Giudici).<br><br><b>Curiosità:</b> Il racconto di Virgilio nelle Georgiche è uno dei trattamenti letterari antichi più estesi e dettagliati dell'apicoltura come sapere agricolo pratico e narrazione mitologica insieme — un genuino testo antico \"pratico\" sulla vera tecnica apistica avvolto in una cornice narrativa mitologica e tragica.",
  "Auloniade": "Ninfa dei pascoli montani e delle valli erbose, vegliava sulle mandrie che vi trovavano riparo e nutrimento.<br><br><b>Il mito completo:</b> Distinte dalle Oreadi di montagna o dalle Driadi dei boschi, le Auloniadi presiedevano specificamente agli aulōnes — le gole montane, i pascoli e le valli erbose — proteggendo il bestiame che vi pascolava e, di conseguenza, i pastori e i mandriani che dipendevano dalla fertilità e dalla sicurezza di quella terra.<br><br><b>Contesto culturale:</b> Questa categoria di ninfa estremamente specifica riflette la meticolosità quasi burocratica della classificazione greca delle divinità naturali — quasi ogni tipo distinto di paesaggio (sorgenti, boschetti, montagne, valli, prati, il mare) aveva la propria categoria dedicata di ninfa, formando insieme una mappa sacra completa dell'intero mondo naturale abitato e vegliato.<br><br><b>Curiosità:</b> Questa proliferazione di tipi di ninfa estremamente specifici (Naiadi, Driadi, Amadriadi, Oreadi, Alseidi, Auloniadi, Nereidi, e altre ancora) significa che la mitologia greca creò di fatto uno dei sistemi di classificazione ecologica premoderna più dettagliati della storia — organizzando il mondo naturale per tipo di habitat secoli prima che l'ecologia moderna formalizzasse classificazioni simili basate sull'habitat.",
  "Centauro": "Per metà uomini e per metà cavalli, i Centauri erano noti per la loro natura selvaggia e per l'amore smodato per il vino, che spesso li portava a scontri violenti — con l'eccezione del saggio Chirone, maestro di eroi come Achille.<br><br><b>Il mito completo:</b> Il mito collettivo più celebre dei Centauri è la Centauromachia: invitati alle nozze di Piritoo, re dei Lapiti, con Ippodamia, i Centauri, non abituati al vino, si ubriacarono e tentarono di rapire le donne dei Lapiti, inclusa la stessa sposa. Questo scatenò una battaglia caotica e violentissima tra Centauri e Lapiti, conclusa con la sconfitta e l'espulsione dei Centauri dalla Tessaglia. L'evento divenne uno dei soggetti più amati dall'arte greca, simbolo del trionfo della civiltà sulla barbarie e sulla passione incontrollata.<br><br><b>Contesto culturale:</b> La Centauromachia fu scolpita in modo prominente sulle metope meridionali del Partenone ad Atene (V secolo a.C.), scelta deliberatamente accanto ad altre scene di \"civiltà contro caos\" (Greci contro Amazzoni, Dèi contro Giganti, Greci contro Troiani) come propaganda politico-religiosa a celebrazione dell'identità ateniese e della recente vittoria greca sugli invasori persiani \"barbari\" — la mitologia usata consapevolmente come messaggio politico contemporaneo.<br><br><b>Curiosità:</b> Storici e antropologi moderni hanno a lungo ipotizzato che il mito dei Centauri possa essere nato dai primi incontri greci con popoli abili cavalieri (forse i primi cavalieri della Tessaglia, o addirittura popolazioni nomadi delle steppe più lontane) — per una cultura non ancora abituata all'equitazione, un uomo apparentemente fuso con un cavallo in movimento fluido poteva facilmente aver ispirato l'immagine di una vera e propria creatura ibrida.",
  "Cerva di Cerinea": "Sacra ad Artemide, questa cerva dalle corna d'oro e zoccoli di bronzo era così veloce da essere quasi inafferrabile: catturarla viva, senza ferirla, fu la terza fatica di Eracle.<br><br><b>Il mito completo:</b> Le corna d'oro della cerva erano un dettaglio particolarmente sorprendente, perché biologicamente solo i cervi maschi sviluppano di norma le corna — rendendo le corna dorate di questa femmina un segnale inconfondibile della sua natura soprannaturale e divinamente contrassegnata fin dal primo sguardo, distinguendola immediatamente da qualunque animale ordinario agli occhi del pubblico antico, ben consapevole della normale biologia dei cervidi. Alcune tradizioni la collegano a un gruppo di cinque cerve dalle corna d'oro che Artemide avrebbe originariamente addomesticato e aggiogato al proprio carro, essendo questa l'ultima ancora libera.<br><br><b>Contesto culturale:</b> I cervi, e in particolare le cerve, avevano un profondo significato simbolico e cultuale per il culto di Artemide in tutta la Grecia antica — santuari come quello di Brauron, vicino Atene, presentavano genuine associazioni rituali tra la dea e i cervi, inclusi festival in cui giovani ragazze compivano riti vestite da \"piccole orse\" o associate simbolicamente alla natura selvaggia e indomita sotto la protezione di Artemide.<br><br><b>Curiosità:</b> Il dettaglio specifico delle \"corna d'oro\" ha portato alcuni studiosi moderni a ipotizzare che il mito possa echeggiare lontanamente osservazioni antiche genuine di condizioni biologiche rarissime (come le renne femmine, che — a differenza della maggior parte delle specie di cervidi — sviluppano davvero corna naturalmente, presenti nelle regioni estreme del nord di cui mercanti e viaggiatori greci potrebbero aver avuto conoscenza confusa e indiretta).",
  "Cinghiale di Calidone (cucciolo)": "Artemide scatenò un cinghiale gigantesco sulla città di Calidone perché il suo re aveva dimenticato di onorarla nei sacrifici: la caccia che ne seguì riunì i più grandi eroi della Grecia in un'unica leggendaria impresa.<br><br><b>Il mito completo:</b> Il re Eneo di Calidone celebrava ogni anno un sacrificio del raccolto in onore di tutti e dodici gli dèi olimpici — tranne che, per un momento di distrazione o negligenza, dimenticò proprio Artemide. Furiosa per essere stata esclusa dal culto dovuto mentre i suoi colleghi olimpici ricevevano piena venerazione, Artemide scelse una punizione calibrata esattamente sulla colpa: poiché la negligenza di Eneo minacciava l'onore del raccolto, inviò un cinghiale mostruoso a distruggere il raccolto stesso, devastando vigneti, uliveti e campi di Calidone ancora prima che la caccia potesse essere organizzata.<br><br><b>Contesto culturale:</b> Questo mito esemplifica un principio religioso ricorrente e distintamente greco: gli dèi non pretendevano necessariamente una devozione grandiosa, ma una correttezza rituale costante e completa — una singola svista, anche involontaria, poteva provocare conseguenze del tutto sproporzionate rispetto all'offesa apparente, riflettendo un'ansia antica genuina per la natura precisa ed esigente della corretta osservanza religiosa.<br><br><b>Curiosità:</b> Questo stesso schema narrativo — un singolo sacrificio omesso che scatena una punizione divina catastrofica — ricorre in molti altri miti greci non collegati tra loro, suggerendo che funzionasse come un vero e proprio monito culturale incorporato ripetutamente nella mitologia: la completezza rituale contava enormemente nella pratica religiosa greca antica, e i miti servivano in parte a rinforzare questa lezione attraverso il racconto ammonitore.",
  "Coboldo": "Spirito domestico del folklore tedesco, il Kobold può essere un aiutante silenzioso della casa o un dispettoso disturbatore, a seconda di quanto viene rispettato dagli abitanti: si diceva infestasse anche le miniere.",
  "Driade": "Ninfe dei boschi in generale, le Driadi proteggevano gli alberi e la vita selvatica, apparendo ai viandanti solo raramente e sempre con un preciso scopo.<br><br><b>Il mito completo:</b> Strettamente legate soprattutto alla quercia (drys in greco, da cui il loro nome), le Driadi rappresentavano un profondo rispetto greco per i boschi sacri e per alberi specifici considerati abitati e animati. Diverse leggende narrano di veri e propri santuari costruiti intorno ad alberi antichi ritenuti dimora di una Driade.<br><br><b>Contesto culturale:</b> Abbattere un albero ritenuto sede di una Driade era considerato una grave trasgressione religiosa, capace di attirare la punizione divina: il mito di Erisittone, condannato da Demetra a una fame insaziabile per aver abbattuto il suo boschetto sacro, ne è l'esempio più celebre.<br><br><b>Curiosità:</b> Il concetto di Driade, legata indissolubilmente a un singolo albero fino a condividerne il destino, sopravvive ancora oggi nell'immaginario popolare e nella letteratura fantasy, spesso senza che si sappia quanto profondamente affondi le proprie radici nella religiosità greca reale, non solo nel mito.",
  "Dvergr": "Forma singolare di \"nano\" nella lingua norrena antica, radice da cui derivano tutte le leggende successive su questi maestri d'ascia e di fucina.",
  "Fauno": "Spirito romano dei boschi e dei campi, dalle gambe caprine, legato al dio Fauno protettore dei pastori e dei raccolti: la sua presenza era considerata di buon auspicio per la fertilità della terra.",
  "Gallo di Asclepio": "Il gallo era l'animale sacrificale offerto ad Asclepio, dio della medicina, in segno di guarigione avvenuta: Socrate pronunciò proprio queste parole come ultimo pensiero prima di morire.<br><br><b>Il mito completo:</b> Secondo un'usanza greca diffusa, chi guariva da una malattia offriva un gallo ad Asclepio in segno di gratitudine per la cura ricevuta. Nel Fedone di Platone, Socrate, poco prima di bere la cicuta, pronuncia come ultime parole: \"Critone, dobbiamo un gallo ad Asclepio; pagatelo, non dimenticatevene.\" La frase resta uno dei passaggi più enigmatici e discussi di tutta la filosofia antica: alcuni la leggono come un ultimo gesto di understatement ironico verso la morte, altri come l'idea che la morte stessa sia una guarigione, una liberazione dal \"male\" della vita terrena per cui si deve un debito di gratitudine agli dèi della medicina.<br><br><b>Contesto culturale:</b> Il culto di Asclepio prevedeva veri e propri santuari di guarigione (asclepieia) dove i malati dormivano sperando in una visione curativa del dio — il gallo, animale che annuncia l'alba, era simbolicamente legato al risveglio e alla rinascita, rendendolo un'offerta particolarmente adatta a chi tornava in salute.<br><br><b>Curiosità:</b> Le ultime parole di Socrate hanno generato una tradizione interpretativa filosofica ininterrotta per oltre duemila anni: filosofi da Nietzsche in poi le hanno lette come chiave per comprendere l'intero atteggiamento socratico verso la vita, la morte e la conoscenza — poche frasi nella storia della filosofia hanno generato tanto dibattito quanto queste, apparentemente semplici, parole finali.",
  "Garmr": "Enorme segugio norreno che sorveglia le porte di Hel, il regno dei morti: la profezia vuole che al Ragnarök si scontrerà con il dio Tyr, uccidendosi a vicenda.<br><br><b>Il mito completo:</b> Garmr viene talvolta identificato, in un dibattito accademico ancora aperto, come possibile stessa figura di Fenrir (entrambi esseri simili a lupi o segugi profetizzati per morire al Ragnarök in un duello dall'esito mortale reciproco con un dio — Fenrir con Odino, Garmr con Tyr) — una genuina incertezza accademica su se le fonti medievali descrivano una sola creatura sotto due nomi o due esseri realmente distinti, dato che i testi eddici superstiti non sono del tutto coerenti su questo punto. Garmr è incatenato davanti alla caverna di Gnipahellir, all'ingresso del regno di Hel, e il suo ululato è specificamente profetizzato come uno degli eventi che annunciano l'inizio del Ragnarök stesso.<br><br><b>Contesto culturale:</b> Il ruolo di Garmr come guardiano della soglia tra il mondo dei vivi e il regno dei morti riflette uno schema mitologico ricorrente in molte culture (con un parallelo evidente al Cerbero greco) di un segugio mostruoso incaricato specificamente di sorvegliare il confine tra vita e morte — un paragone che gli stessi commentatori antichi e medievali talvolta tracciavano esplicitamente.<br><br><b>Curiosità:</b> L'incertezza accademica su se Garmr e Fenrir siano la stessa figura riflette una sfida più ampia e genuina nella ricostruzione accurata della mitologia norrena: a differenza del mito greco, sopravvissuto attraverso una tradizione letteraria relativamente continua, la maggior parte dei testi mitologici norreni superstiti fu messa per iscritto secoli dopo la cristianizzazione, da scribi cristiani (come Snorri Sturluson) che lavoravano su una tradizione orale frammentaria — lasciando lacune e incoerenze reali e irrisolte in ciò che pensiamo di sapere su figure come Garmr.",
  "Gatto di Bubasti": "Nell'antico Egitto i gatti erano sacri alla dea Bastet, il cui principale centro di culto era proprio la città di Bubasti: ferire un gatto, anche per errore, poteva essere punito con la morte.",
  "Grabakr Giovane": "Uno dei cavalli mitici norreni che pascolano ogni giorno accanto all'albero cosmico Yggdrasill, secondo quanto narrato nei poemi eddici.",
  "Gullinbursti": "Cinghiale dalle setole d'oro forgiato dai nani per il dio Freyr: le sue setole risplendevano al buio, illuminando la strada al suo carro anche nelle notti più oscure.<br><br><b>Il mito completo:</b> Gullinbursti fu forgiato dai fratelli nani Brokkr ed Eitri (talvolta chiamato Sindri) come parte di una scommessa con Loki — la stessa gara che produsse anche la lancia di Odino Gungnir, il martello di Thor Mjolnir e l'anello d'oro Draupnir. Loki, avendo scommesso la propria testa sull'esito, sabotò il processo di forgiatura trasformandosi in una mosca pungente per distrarre Brokkr a metà del lavoro, causando un piccolo difetto (il manico di Mjolnir risultò più corto del previsto) — ma Gullinbursti stesso fu completato con successo, capace di correre attraverso l'aria e l'acqua più veloce di qualunque cavallo, le sue setole luminose garantivano al carro di Freyr di non restare mai senza luce nemmeno nelle notti più buie.<br><br><b>Contesto culturale:</b> Questo intero ciclo mitico della \"scommessa dei nani\" (riportato nello Skáldskaparmál dell'Edda in prosa) servì in parte a spiegare l'origine divina di diversi tra gli oggetti magici più iconici della mitologia norrena in un colpo solo, legando i possedimenti distintivi di più divinità principali in un'unica storia d'origine interconnessa.<br><br><b>Curiosità:</b> I cinghiali avevano un più ampio significato rituale nella cultura norrena legato al dominio di Freyr sulla fertilità e la prosperità — la tradizione dello Yule del \"sonargöltr\" (un cinghiale sacrificato o simbolicamente invocato durante i rituali di giuramento del solstizio d'inverno) richiama direttamente l'associazione di Gullinbursti con il dio, e alcuni studiosi fanno risalire la moderna tradizione del prosciutto natalizio nei paesi scandinavi a questa antica pratica pagana di venerazione del cinghiale.",
  "Hrungnir Giovane": "Gigante dal cuore e dalla testa di pietra, Hrungnir sfidò Thor in un duello che gli antichi narratori ricordavano come uno scontro leggendario tra le forze del caos e dell'ordine.<br><br><b>Il mito completo:</b> Hrungnir, vantandosi ubriaco di poter distruggere Asgard e uccidere tutti gli dèi, fu sfidato a un duello formale da Thor dopo averlo insultato durante una gara di cavalli con Odino. Per garantire uno scontro leale, i giganti costruirono a Hrungnir un enorme compagno d'argilla (Mökkurkálfi) come suo secondo. Durante il duello stesso, Hrungnir, armato di una cote gigante, la scagliò contro Thor; il martello di Thor la frantumò a mezz'aria, ma un frammento rimase conficcato per sempre nel cranio del dio (una vecchia sacerdotessa di nome Gróa fu in seguito convocata proprio per tentare di rimuoverlo con la magia, anche se l'incantesimo fu interrotto prima del completamento, lasciando la scheggia nella testa di Thor per sempre). Il martello di Thor uccise poi Hrungnir, il cui corpo enorme cadde direttamente sulla gamba di Thor, intrappolandolo — solo il giovane figlio di Thor, Magni, ancora bambino ma già dotato di forza sovrumana ereditata dal padre, riuscì a sollevare il cadavere per liberarlo.<br><br><b>Contesto culturale:</b> Il mito di Hrungnir mostra il tema ricorrente norreno dell'ordine (gli dèi, in particolare Thor come loro principale difensore) costretto a reprimere e sconfiggere costantemente la minaccia caotica rappresentata dai giganti (jötnar), anche quando i singoli incontri (come la gara di cavalli iniziale di Odino) iniziano più come vanteria sconsiderata che vera guerra.<br><br><b>Curiosità:</b> Il dettaglio del frammento di cote rimasto per sempre conficcato nella testa di Thor, con il rituale di guarigione lasciato per sempre incompiuto, viene talvolta letto dagli studiosi come un sottile espediente narrativo per spiegare PERCHÉ lanciare coti o selci contro qualcuno fosse considerato particolarmente tabù o pericoloso nella credenza popolare scandinava successiva — il mito usato per rinforzare una pratica o superstizione culturale reale.",
  "Jotunn Giovane": "I Jotunn sono i giganti della mitologia norrena, spesso avversari degli dèi Asi ma a volte anche loro alleati o persino parenti, in un rapporto complesso fatto di guerre e matrimoni.",
  "Landvættir": "Spiriti protettori della terra nella tradizione norrena e islandese, custodi silenziosi dei territori: si narra che le navi vichinghe dovessero rimuovere le teste di drago a prua avvicinandosi a costa, per non spaventarli.",
  "Limniade": "Ninfa greca dei laghi e delle paludi, meno celebrata delle Naiadi fluviali ma altrettanto legata alla vita delle acque ferme.<br><br><b>Il mito completo:</b> Distinte dalle Naiadi dei fiumi e delle sorgenti scorrenti, le Limniadi presiedevano specificamente alle acque ferme — laghi, stagni e paludi — ambienti spesso considerati più misteriosi e meno accessibili rispetto ai corsi d'acqua vivi, e per questo associati a un carattere più silenzioso e riservato nella tradizione popolare greca.<br><br><b>Contesto culturale:</b> La distinzione tra ninfe delle acque ferme e ninfe delle acque correnti riflette l'attenzione greca per le differenze concrete tra tipi di paesaggio acquatico — un lago o una palude, con la loro immobilità e i loro ecosistemi specifici, richiedevano una divinità propria, distinta da quella di un fiume in perenne movimento.<br><br><b>Curiosità:</b> Questa suddivisione capillare delle ninfe per tipo esatto di corpo idrico (Naiadi per l'acqua corrente, Limniadi per quella ferma, Idriadi per le sorgenti) dimostra quanto minuziosamente i Greci classificassero il mondo naturale attraverso la mitologia, un sistema di categorie ambientali sorprendentemente dettagliato per l'epoca.",
  "Linnormr Giovane": "Serpente-drago del folklore nordico e germanico, privo di ali o dotato solo di zampe anteriori: le sue forme adulte erano temute quanto i draghi veri e propri.",
  "Menaide Infuriata": "Le Menadi erano le seguaci estatiche di Dioniso, capaci durante i loro riti di cadere in un frenetico stato di trance: la leggenda narra che in quello stato potessero dilaniare a mani nude chiunque si opponesse al dio.<br><br><b>Il mito completo:</b> L'episodio più celebre e terribile riguardante le Menadi è narrato nelle Baccanti di Euripide: il re Penteo di Tebe, scettico verso il culto di Dioniso e deciso a reprimerlo, si nasconde travestito da donna per spiare i riti sul monte Citerone. Scoperto dalle Menadi in preda al furore sacro — tra cui, tragicamente, la propria stessa madre Agave, convinta nella sua trance di vedere un leone anziché il figlio — viene smembrato vivo dalle sue mani. Solo al termine del rito, tornata in sé, Agave si accorge con orrore di tenere in braccio la testa del proprio figlio.<br><br><b>Contesto culturale:</b> Il culto dionisiaco rappresentava per i Greci un potere religioso ambivalente e pericoloso: liberatorio ed estatico da un lato, capace di dissolvere temporaneamente le strutture sociali e familiari ordinarie dall'altro — le Menadi incarnano proprio questo potenziale distruttivo della perdita totale di controllo razionale, anche verso i legami più sacri come quello materno.<br><br><b>Curiosità:</b> Le Baccanti di Euripide, scritte alla fine della vita del drammaturgo, sono considerate una delle tragedie greche più inquietanti e psicologicamente moderne mai composte — la messa in scena dello smembramento di Penteo per mano della madre resta ancora oggi uno dei momenti più scioccanti di tutto il teatro classico.",
  "Mökkurkálfi": "Gigante d'argilla costruito dai nemici di Thor per affiancare Hrungnir nel duello, animato con un cuore di giumenta: alla vista dello scudiero di Thor fu talmente terrorizzato da bagnarsi addosso, prima ancora che iniziasse lo scontro.<br><br><b>Il mito completo:</b> Alto nove leghe e con un petto largo altrettanto nove leghe, animato inserendogli il cuore di una giumenta (poiché i giganti, associati alla natura caotica e grezza, apparentemente richiedevano un cuore animale anziché umano per essere portati in vita), Mökkurkálfi fu costruito appositamente per intimidire il giovane servitore di Thor, Þjálfi, arrivato sul luogo del duello prima dello stesso Thor. Vedendo l'enorme gigante d'argilla, Þjálfi gridò astutamente (o forse semplicemente per genuino terrore misto a bluff tattico) un avviso a Hrungnir che Thor si stava avvicinando da sottoterra, spingendo il gigante a stare in piedi sul proprio scudo per proteggersi il davanti — lasciando la schiena esposta, un errore tattico fatale che contribuì direttamente alla sua morte nel duello successivo.<br><br><b>Contesto culturale:</b> Il terrore e l'inutilità finale di Mökkurkálfi nella battaglia vera e propria (morì di paura, secondo il racconto, senza sferrare un solo colpo, alla semplice vista dell'arrivo di Thor) svolge una funzione narrativa lievemente comica all'interno della più seria storia del duello di Hrungnir — la mitologia norrena, anche nei racconti di combattimento più drammatici, include spesso simili dettagli sgonfianti, quasi da farsa.<br><br><b>Curiosità:</b> Il nome \"Mökkurkálfi\" si traduce approssimativamente come \"Vitello di Nebbia\" o \"Vitello di Nuvola\", un nome stranamente gentile e quasi pastorale per un gigante d'argilla alto nove leghe costruito per la guerra — un dettaglio linguistico che alcuni studiosi trovano tonalmente coerente con il sottotono complessivamente comico del mito riguardo al fallimento finale e vigliacco di questo particolare personaggio.",
  "Oreada": "Ninfa greca delle montagne e delle grotte rocciose, spirito silenzioso che abitava le vette più impervie.<br><br><b>Il mito completo:</b> Compagne soprattutto di Artemide, dea della caccia e dei luoghi selvaggi, e talvolta di Pan, le Oreadi erano legate a montagne, caverne e grotte specifiche. La ninfa Eco, punita da Era con una maledizione che le impediva di parlare se non ripetendo le ultime parole altrui, e poi consumata dall'amore non corrisposto per Narciso fino a restare pura voce, era tradizionalmente un'Oreade.<br><br><b>Contesto culturale:</b> Le ninfe di montagna rappresentavano le zone più selvagge e inaccessibili del paesaggio greco, in contrasto con le Naiadi delle sorgenti e dei fiumi, più vicine agli insediamenti umani — legate a luoghi remoti, misteriosi, e proprio per questo agli echi che vi risuonavano.<br><br><b>Curiosità:</b> La parola \"eco\", presente praticamente in ogni lingua europea moderna, deriva direttamente dal nome e dal mito di questa specifica Oreade — una delle eredità linguistiche più dirette e universali dell'intera mitologia greca.",
  "Orso di Arcadia": "Rimanda al mito di Callisto, ninfa trasformata in orsa da una Era gelosa: per proteggerla dalla caccia del proprio figlio, Zeus la pose infine tra le stelle come costellazione dell'Orsa Maggiore.<br><br><b>Il mito completo:</b> Callisto era una ninfa compagna di caccia di Artemide, votata alla castità come tutte le seguaci della dea. Zeus, invaghitosi di lei, assunse le sembianze della stessa Artemide per avvicinarla senza destare sospetti, e la sedusse con l'inganno. Quando la gravidanza di Callisto fu scoperta, Artemide la scacciò dal proprio seguito; Era, scoperto il tradimento del marito, trasformò per vendetta la ninfa in un'orsa. Anni dopo, il figlio di Callisto, Arcade, ormai cresciuto, per poco non uccise la propria madre durante una battuta di caccia, non riconoscendola nella forma animale: Zeus intervenne all'ultimo istante, ponendo entrambi tra le stelle come le costellazioni dell'Orsa Maggiore e dell'Orsa Minore (o del Bootes, secondo alcune versioni).<br><br><b>Contesto culturale:</b> Il mito di Callisto riflette un tema ricorrente e cupo della mitologia greca: la vittima di un dio che si traveste per ingannarla paga poi personalmente il prezzo della gelosia della moglie tradita, un pattern che si ripete in numerosi altri miti di amanti di Zeus perseguitate da Era.<br><br><b>Curiosità:</b> Il nome stesso dell'Arcadia, la regione greca associata a Callisto e al figlio Arcade, deriva secondo la tradizione popolare proprio dal nome del figlio — un raro caso in cui un intero territorio geografico greco porta il nome di un personaggio mitologico nato da un simile dramma familiare divino.",
  "Panisco": "Piccoli spiriti caprini al seguito del dio Pan, i Paniski condividevano il suo amore per la musica del flauto e gli scherzi tra i boschi.",
  "Satiro": "Creature per metà uomo e metà capra, i Satiri erano compagni festosi di Dioniso, sempre pronti a inseguire ninfe tra i boschi e a partecipare a banchetti e baldorie.<br><br><b>Il mito completo:</b> Musicisti instancabili, i Satiri suonavano l'aulo (un flauto doppio) durante i cortei dionisiaci, incarnando l'istinto naturale incontrollato in contrasto con la misura e la ragione civile. Il dramma satiresco, un genere teatrale greco a sé stante, prevedeva un coro di Satiri e veniva rappresentato come sollievo comico dopo le trilogie tragiche nei grandi festival ateniesi.<br><br><b>Contesto culturale:</b> I Satiri rappresentavano l'istinto naturale sfrenato come contrappunto rituale alla misura civile, incarnato proprio nel genere teatrale del dramma satiresco, che chiudeva le rappresentazioni tragiche con un tono deliberatamente comico e dissacrante.<br><br><b>Curiosità:</b> La parola italiana \"satira\" viene comunemente ma erroneamente fatta derivare da \"satiro\" — in realtà proviene dal latino satura, \"miscuglio, mescolanza\" — una falsa etimologia che moltissime persone continuano a credere vera ancora oggi.",
  "Segugio di Skadi": "Skadi, dea norrena della caccia e dell'inverno, era accompagnata da segugi abilissimi capaci di seguire una preda anche attraverso le nevicate più fitte.",
  "Serpenti del Niflheimr": "Niflheim è il gelido regno di nebbia e ghiaccio della cosmologia norrena, dimora di serpenti che rosicchiano incessantemente le radici dell'albero del mondo insieme al grande Nidhogg.",
  "Sileno Giovane": "I Sileni erano satiri anziani e saggi, spesso ubriachi ma capaci — proprio in quello stato — di pronunciare profezie sorprendenti: il più celebre, Sileno, fu precettore dello stesso Dioniso.<br><br><b>Il mito completo:</b> Sileno, catturato una volta dal re Mida, rivelò profezie sorprendenti proprio nel suo stato di ubriachezza; in cambio della sua restituzione a Dioniso, il dio concesse a Mida un desiderio — la famosa (e infine disastrosa) capacità di trasformare in oro tutto ciò che toccava.<br><br><b>Contesto culturale:</b> Sileno incarna l'archetipo del \"saggio folle\": la sua saggezza emerge proprio attraverso, o nonostante, l'ubriachezza, un tema ripreso più tardi dalla filosofia greca — Platone, nel Simposio, fa paragonare Socrate proprio a una figura di Sileno da parte di Alcibiade: brutto esteriormente, ma colmo di saggezza all'interno.<br><br><b>Curiosità:</b> Questo paragone nel Simposio di Platone è una delle metafore filosofiche più celebri della storia occidentale, e ha reso \"Sileno\" un termine ancora oggi usato per indicare chi nasconde una profonda saggezza interiore dietro un aspetto esteriore poco impressionante.",
  "Volpe di Teumesso": "Volpe gigantesca destinata dal fato a non essere mai catturata, scatenata sulla città di Tebe: paradossalmente le fu messo alle calcagna un cane, Lelapo, destinato a catturare sempre la sua preda — Zeus risolse il dilemma impossibile trasformando entrambi in pietra.<br><br><b>Il mito completo:</b> Inviata da Dioniso (secondo la maggior parte delle versioni) per punire Tebe di un'antica colpa, la volpe era destinata dal fato stesso a non essere mai catturata: una legge cosmica infrangibile. Nel frattempo, Cefalo (o secondo altre versioni Anfitrione, lo stesso patrigno di Eracle) possedeva Lelapo, un cane da caccia donato da Zeus (o da Artemide, secondo altre fonti), destinato con altrettanta certezza cosmica a catturare sempre ciò che inseguiva. Anfitrione, disperato per liberare Tebe dalle devastazioni della volpe, scatenò Lelapo contro di essa — creando un vero e proprio paradosso logico: una forza inarrestabile contro un oggetto inamovibile, un inseguimento che sarebbe potuto continuare per sempre senza risoluzione. Zeus, non volendo lasciare la contraddizione irrisolta in eterno, la risolse trasformando entrambi gli animali in pietra a metà dell'inseguimento, e ponendoli poi tra le stelle — la volpe è talvolta identificata con la costellazione del Cane Minore, e Lelapo confluì nel Cane Maggiore accanto agli altri cani da caccia di Orione.<br><br><b>Contesto culturale:</b> Questo mito si distingue nella mitologia greca come un vero e proprio esperimento filosofico incorporato in forma narrativa — commentatori antichi e moderni ne hanno notato la somiglianza con i paradossi logici successivi (come quello della forza inarrestabile contro l'oggetto inamovibile), suggerendo che i narratori greci arcaici già giocassero con idee di contraddizione logica secoli prima che la filosofia formale affrontasse direttamente questo tipo di paradossi.<br><br><b>Curiosità:</b> Questo è uno dei pochissimi miti greci in cui il conflitto centrale non ha letteralmente alcuna possibile risoluzione narrativa tramite l'azione eroica normale — nessuna quantità di astuzia, forza o coraggio potrebbe risolverlo, rendendo l'intervento divino l'UNICO finale possibile, una situazione strutturalmente unica tra i racconti greci sui mostri.",

  "Anfisbena": "Serpente con una testa a ciascuna estremità del corpo, capace di muoversi in entrambe le direzioni senza mai voltarsi: secondo Ovidio nacque dal sangue sgocciolato dalla testa di Medusa mentre Perseo la trasportava in volo sopra i deserti della Libia.<br><br><b>Il mito completo:</b> Capace, secondo la leggenda, di mordere con entrambe le teste contemporaneamente per non dover mai lasciare la presa sulla preda, l'Anfisbena era anche ritenuta dotata di proprietà leggermente tossiche o anestetiche utili nella medicina popolare antica: si diceva che indossarne la pelle curasse i reumatismi o aiutasse le gravidanze.<br><br><b>Contesto culturale:</b> Divenne una creatura araldica e bestiaria molto diffusa in tutta l'Europa medievale, la sua natura bicefala simbolo di duplicità, contraddizione o, in senso positivo, di vigilanza bilanciata a seconda del contesto.<br><br><b>Curiosità:</b> La scienza moderna ha preso in prestito direttamente il nome: un'intera famiglia di rettili reali, privi di zampe e scavatori, è classificata scientificamente come \"Amphisbaenia\", la loro coda tozza che ricorda superficialmente una seconda testa — un raro caso di nomenclatura mitologica antica sopravvissuta direttamente nella tassonomia zoologica moderna.",
  "Basilisco Minore": "Il \"re dei serpenti\" secondo i bestiari medievali, capace di uccidere con il solo sguardo o con l'alito velenoso: si narrava nascesse da un uovo di serpente covato da un rospo o da un gallo.",
  "Blemio": "Popolo leggendario descritto dagli antichi geografi come privo di testa, con il volto posto direttamente sul petto: comparivano nei racconti di viaggio come esempio delle meraviglie nascoste ai confini del mondo conosciuto.<br><br><b>Il mito completo:</b> Erodoto accenna a un concetto simile, poi elaborato più tardi da Plinio il Vecchio: un popolo \"acefalo\" i cui tratti del viso — occhi, naso, bocca — si trovavano direttamente sul petto anziché su una testa. Il nome deriva probabilmente da racconti confusi di viaggiatori su un popolo africano reale (i Blemmi storici erano effettivamente una confederazione tribale nubiana-sudanese), con il dettaglio \"senza testa\" aggiunto come pura elaborazione fantastica su un nome autentico.<br><br><b>Contesto culturale:</b> Insieme ai Cinocefali e alle altre \"razze mostruose\", i Blemmi rappresentano la tendenza dell'immaginazione geografica greca antica a proiettare stranezza fisica su popoli lontani e poco conosciuti — uno schema che gli antropologi riconoscono oggi come comune a molte culture antiche nell'incontro con popolazioni genuinamente straniere.<br><br><b>Curiosità:</b> William Shakespeare fa riferimento diretto a uomini senza testa \"le cui teste crescono sotto le spalle\" nell'Otello, dimostrando che questo specifico mito geografico greco antico era ancora culturalmente vivo e citato nella letteratura inglese quasi duemila anni dopo la sua origine.",
  "Cercopo": "Dispettosi folletti dei boschi che tentarono di derubare Eracle mentre dormiva: l'eroe li punì legandoli a testa in giù a un bastone, e secondo alcune versioni del mito furono infine trasformati in scimmie per la loro incorreggibile natura beffarda.<br><br><b>Il mito completo:</b> Legati capovolti a un palo che Eracle si caricò sulle spalle come selvaggina, durante il tragitto i Cercopi, appesi a testa in giù, notarono il sedere abbronzato dall'eroe (celebre nel mito per il suo colorito scurito dal sole) e iniziarono a canzonarlo con battute irriverenti — divertendolo così tanto, nonostante tutto, che finì per liberarli ridendo.<br><br><b>Contesto culturale:</b> Questo mito si distingue per il suo tono comico, quasi da farsa, rispetto alle solite fatiche cupe e violente di Eracle — mostrando un lato più leggero e folkloristico della mitologia greca, più vicino a un racconto da furfante-imbroglione che all'epica eroica.<br><br><b>Curiosità:</b> In una tradizione successiva più elaborata, Zeus punì infine gli incorreggibili Cercopi per la loro natura ladra trasformandoli in scimmie ed esiliandoli su isole al largo della costa italiana — un mito che gli antichi Romani usavano per spiegare la presenza di scimmie su alcune isole del Mediterraneo.",
  "Chimera Minore": "Mostro ibrido con corpo di leone, una testa di capra sul dorso e coda di serpente, capace di sputare fiamme: fu abbattuta dall'eroe Bellerofonte, che la affrontò cavalcando il Pegaso dall'alto.<br><br><b>Il mito completo:</b> Figlia di Tifone ed Echidna, come l'Idra e Cerbero, la Chimera seminava terrore in Licia, in Asia Minore. Il re Iobate affidò a Bellerofonte l'incarico di ucciderla, sperando segretamente che l'eroe morisse nell'impresa — un favore chiesto dal re Preto, che voleva Bellerofonte morto dopo una falsa accusa mossa dalla propria moglie. Atena, in sogno, donò a Bellerofonte una briglia d'oro capace di domare il cavallo alato Pegaso: volando sopra la Chimera, l'eroe la colpì con una lancia sulla cui punta aveva fissato un blocco di piombo. Il fiato infuocato del mostro sciolse il piombo, che colò lungo la gola uccidendola dall'interno.<br><br><b>Contesto culturale:</b> La Chimera è diventata simbolo duraturo di ogni idea impossibile, innaturale o irrealizzabile — da qui il termine moderno \"chimera\", usato per un sogno illusorio o, in biologia, per un organismo composto da popolazioni cellulari geneticamente distinte. Monete licie antiche e sculture etrusche, come la celebre Chimera di Arezzo del V secolo a.C., testimoniano quanto la sua immagine sia rimasta impressa nell'arte per secoli.<br><br><b>Curiosità:</b> Alcuni geografi antichi collegavano il mito a un fenomeno naturale reale: sul Monte Chimera in Licia (l'odierno Yanartaş, in Turchia), fuoriuscite naturali di gas ancora oggi bruciano ininterrottamente dalle rocce — una fiamma eterna che potrebbe aver ispirato l'idea di un mostro capace di sputare fuoco che abita proprio quella montagna.",
  "Ciclope Operaio": "I tre Ciclopi Bronte, Sterope e Arge non erano mostri solitari come Polifemo, ma abilissimi fabbri: nelle loro fucine forgiarono per Zeus i fulmini che lo resero re degli dèi.<br><br><b>Il mito completo:</b> Figli di Urano e Gaia, questi tre Ciclopi originari furono imprigionati dal proprio padre Urano nel Tartaro insieme agli Ecatonchiri dalle cento mani, per poi essere liberati da Zeus durante la Titanomachia in cambio della loro lealtà. Per gratitudine, forgiarono i fulmini di Zeus, il tridente di Poseidone e l'elmo dell'invisibilità di Ade — le armi principali che permisero ai tre fratelli di sconfiggere i Titani e dividersi il cosmo.<br><br><b>Contesto culturale:</b> Questa tradizione dei Ciclopi \"fabbri\" è mitologicamente distinta e più antica della razza selvaggia e pastorale di Ciclopi solitari, come Polifemo, incontrata da Ulisse nell'Odissea — le stesse fonti antiche talvolta faticavano a conciliare le due tradizioni di Ciclopi, così diverse tra loro, in un'unica mitologia coerente.<br><br><b>Curiosità:</b> La tradizione greca e romana successiva collocò la loro fucina sotto il monte Etna in Sicilia (la stessa montagna sotto cui giace sepolto Tifone), al lavoro sotto la guida del dio Efesto — gli abitanti locali spiegavano il rombo e il fuoco del vulcano proprio come il suono dei Ciclopi ancora al lavoro sulla loro fucina eterna.",
  "Cinocefalo": "Popolo leggendario dalla testa canina, descritto dagli storici e viaggiatori dell'antichità come abitante di terre remote e misteriose ai margini del mondo conosciuto.<br><br><b>Il mito completo:</b> Il medico e storico greco Ctesia, scrivendo dell'India, li descrisse come intelligenti nonostante l'aspetto bestiale, capaci di comunicare (in parte tramite l'abbaiare) e organizzati in società con proprie usanze e costumi — un racconto poi ripreso da numerose fonti successive.<br><br><b>Contesto culturale:</b> I Cinocefali appartengono a un più ampio genere di miti greci sulle \"razze mostruose\" (insieme ai Blemmi, agli Arimaspi monocoli e altri) che descrivevano i confini del mondo conosciuto — riflettendo come la geografia greca antica mescolasse racconti reali di viaggiatori con elaborazioni fantastiche su popoli lontani e poco conosciuti.<br><br><b>Curiosità:</b> Questo mito ebbe una vita straordinariamente lunga: i Cinocefali compaiono ancora nelle mappe e nei bestiari europei medievali per oltre mille anni dopo Ctesia, e la tradizione cristiana dibatté seriamente se popoli dalla testa canina, ammesso che esistessero, potessero possedere un'anima ed essere convertiti — una vera questione teologica sollevata nella dottrina medievale.",
  "Dipsas": "Serpente della tradizione romana il cui morso non uccideva sul colpo, ma condannava la vittima a una sete inestinguibile e incurabile, descritto con orrore da diversi poeti latini.<br><br><b>Il mito completo:</b> Secondo il poeta romano Lucano, nella sua Farsaglia, il dipsas nacque, come l'Anfisbena e altri serpenti mostruosi del deserto libico, dalle gocce di sangue caduto dalla testa recisa di Medusa mentre Perseo la trasportava in volo sopra la Libia. Il nome stesso, dal greco dipsa (\"sete\"), descrive direttamente l'effetto del suo morso: una sete talmente insaziabile da spingere la vittima a bere fino a scoppiare, senza mai riuscire a placarla.<br><br><b>Contesto culturale:</b> I serpenti \"nati dal sangue di Medusa\" formavano un intero catalogo di creature velenose nella tradizione latina, ciascuna con un effetto specifico e orribile — un genere letterario di per sé, che univa la fascinazione romana per l'esotico deserto africano al gusto per il macabro dettagliato.<br><br><b>Curiosità:</b> Descrizioni dettagliate come quella del dipsas nella Farsaglia di Lucano hanno portato alcuni storici della medicina moderni a ipotizzare che dietro il mito si celi un'osservazione reale, per quanto esagerata poeticamente, degli effetti fisiologici genuini di alcuni morsi di serpente velenoso, che possono davvero causare sete intensa come sintomo secondario dell'avvelenamento.",
  "Dökkálfar Guerriero": "Gli \"elfi oscuri\" della mitologia norrena vivevano nelle profondità della terra, agli antipodi dei luminosi Ljósálfar: guerrieri temuti, si dice fossero all'origine di molte leggende successive sui nani.",
  "Fossegrim": "Spirito scandinavo delle cascate, musicista sublime al violino: si narrava potesse insegnare la propria arte a chi gli offrisse un dono adeguato, ma il prezzo da pagare non era mai scontato.",
  "Gorgone Corazzata": "Le Gorgoni, tra cui la celebre Medusa, avevano capigliature di serpenti vivi e uno sguardo capace di pietrificare chiunque le fissasse negli occhi: solo Perseo riuscì a sconfiggerne una, usando uno scudo come specchio.<br><br><b>Il mito completo:</b> Delle tre sorelle Gorgoni, solo Medusa era mortale: Steno ed Euriale, le altre due, erano immortali e sopravvissero alla decapitazione della sorella, inconsolabili nel proprio dolore e furia, inseguendo invano Perseo in volo grazie ai sandali alati di Ermes che lo avevano reso troppo veloce per essere raggiunto. Alcune fonti descrivono le Gorgoni dotate di una pelle simile a scaglie di bronzo impenetrabili, zanne di cinghiale e mani di bronzo — un'armatura naturale che le rendeva quasi indistruttibili a qualunque arma convenzionale, distinguendole nettamente dalla successiva immagine più \"umana\" di Medusa resa celebre dall'arte posteriore.<br><br><b>Contesto culturale:</b> La distinzione tra la Medusa mortale e le sue sorelle immortali riflette un tema greco ricorrente: anche tra creature apparentemente identiche, esiste sempre un elemento vulnerabile che rende possibile l'eroismo — Perseo non avrebbe mai potuto sconfiggere Steno o Euriale, solo la sorella mortale.<br><br><b>Curiosità:</b> Le raffigurazioni artistiche più antiche delle Gorgoni (VII secolo a.C.) le mostrano tutte e tre praticamente identiche, grottesche e intercambiabili — solo con il tempo Medusa emerse come figura distinta e individualizzata, relegando Steno ed Euriale a un ruolo sempre più marginale, quasi dimenticato, nella tradizione successiva.",
  "Guerriero d'Ambra": "Le sorelle di Fetonte, disperate per la morte del fratello caduto dal carro del Sole, furono trasformate in pioppi le cui lacrime, cadendo nel fiume, si pietrificarono in ambra dorata: da quel pianto eterno la leggenda fa nascere guerrieri tanto preziosi quanto risoluti.",
  "Huldra": "Bellissima donna dei boschi scandinavi, riconoscibile solo per una coda di mucca nascosta sotto le vesti: attirava i viandanti nella foresta con il suo canto, per poi rivelare la sua vera natura selvatica.",
  "Idra di Lerna (monotesta)": "Serpente dalle molte teste che, se recise, ricrescevano doppie: Eracle riuscì a sconfiggerla solo con l'aiuto del nipote Iolao, che cauterizzava ogni ferita col fuoco prima che una nuova testa spuntasse.<br><br><b>Il mito completo:</b> Prima di raggiungere la forma completamente sviluppata e temibile che affrontò Eracle, la tradizione immaginava l'Idra come una creatura ancora giovane, con un numero di teste inferiore rispetto alla sua forma matura — un dettaglio che alcuni mitografi antichi usavano per spiegare perché nessun eroe precedente a Eracle avesse mai tentato di affrontarla: la bestia era semplicemente cresciuta, diventando sempre più pericolosa con il passare degli anni nelle paludi di Lerna, fino a raggiungere le proporzioni leggendarie della sua fatica più celebre.<br><br><b>Contesto culturale:</b> L'idea di un mostro che cresce in pericolosità nel tempo, prima di essere finalmente affrontato dall'eroe giusto nel momento giusto, riflette una struttura narrativa comune nel mito greco: la minaccia deve raggiungere una scala quasi insostenibile prima che il destino porti l'eroe adatto a confrontarla.<br><br><b>Curiosità:</b> Le fonti antiche non concordano mai sul numero esatto di teste dell'Idra in nessuna fase della sua esistenza — un'incertezza che riflette quanto il mito fosse tramandato oralmente e rielaborato liberamente da narratore a narratore, senza mai fissarsi in una versione canonica unica e definitiva.",
  "Iena d'Etiopia": "I bestiari antichi narravano che le iene delle terre d'Etiopia sapessero imitare la voce umana per attirare i viandanti sprovveduti nell'oscurità, ingannandoli con richiami familiari.",
  "Leone di Citerone": "Sul monte Citerone il giovane Eracle, ancora adolescente, uccise il suo primo leone: un episodio che la tradizione ricorda come il preludio alle sue future, ben più celebri, imprese.<br><br><b>Il mito completo:</b> Prima ancora delle sue dodici fatiche, il giovane Eracle, mandato dal padre adottivo Anfitrione a sorvegliare le mandrie sul monte Citerone, affrontò e uccise un leone che da tempo terrorizzava la regione, decimando il bestiame locale. Secondo alcune fonti, l'eroe indossò poi la pelle di questo primo leone come suo primo mantello, prima ancora di ottenere quella ben più celebre del Leone di Nemea. Durante questa stessa impresa giovanile, secondo Apollodoro, Eracle avrebbe anche trascorso cinquanta notti con le cinquanta figlie del re Tespio, generando altrettanti figli.<br><br><b>Contesto culturale:</b> Questo episodio serve narrativamente come \"origine\" dell'eroismo di Eracle: dimostra fin dalla giovane età le qualità (forza, coraggio, capacità di proteggere una comunità da una minaccia) che caratterizzeranno tutta la sua carriera eroica successiva, in un classico schema del racconto dell'eroe che affronta prima piccole prove locali prima delle grandi imprese destinate a renderlo leggendario.<br><br><b>Curiosità:</b> Il fatto che Eracle affronti DUE leoni distinti nella sua vita — quello di Citerone da giovane e quello, ben più celebre, di Nemea nella sua prima fatica adulta — a volte genera confusione anche tra gli studiosi moderni su quale episodio venga raffigurato in certe antiche opere d'arte prive di iscrizioni esplicative.",
  "Leone di Nemea (cucciolo)": "La sua pelle era talmente resistente da non poter essere scalfita da nessuna arma: Eracle dovette strangolarlo a mani nude nella prima delle sue dodici fatiche, per poi indossarne la pelle come armatura invulnerabile.<br><br><b>Il mito completo:</b> Prima di raggiungere la piena maturità e l'invulnerabilità leggendaria che lo rese celebre, il Leone di Nemea era già temuto dagli abitanti della valle come un cucciolo insolitamente grande e feroce, capace di uccidere bestiame e pastori ben prima di raggiungere le sue dimensioni e la sua invulnerabilità adulte. Alcuni racconti popolari della regione narravano di segni premonitori — comete, tuoni improvvisi in cielo sereno — che accompagnarono la sua nascita, presagendo fin dall'inizio la minaccia che sarebbe diventato.<br><br><b>Contesto culturale:</b> L'idea di presagi che accompagnano la nascita di un futuro grande mostro (o eroe) è un motivo narrativo diffuso in tutta la mitologia greca, che sottolinea come il destino di una creatura sia spesso segnato fin dal principio, visibile a chi sa interpretare correttamente i segni divini.<br><br><b>Curiosità:</b> Il fatto che perfino da cucciolo il leone fosse già insolitamente pericoloso sottolinea, nella tradizione popolare, quanto la sua natura fosse innatamente soprannaturale fin dalla nascita, e non semplicemente il risultato di una crescita naturale come qualunque altro leone della regione.",
  "Svartálfar": "Nome collettivo per gli elfi oscuri della tradizione norrena, spesso confusi nelle fonti antiche con i nani: abili artigiani, vivevano rifuggendo la luce del giorno.",
  "Tarand": "Aristotele descrisse questo animale leggendario come capace di cambiare colore per mimetizzarsi con l'ambiente circostante, proprio come un camaleonte: un mistero naturalistico che affascinò i naturalisti per secoli.",
  "Toro di Maratona": "In origine il maestoso Toro di Creta, catturato vivo da Eracle nella settima fatica e poi liberato in Grecia: giunto nei pressi di Maratona seminò il terrore, finché non fu domato dal giovane eroe Teseo.<br><br><b>Il mito completo:</b> Si tratta dello stesso toro inviato dal mare da Poseidone perché il re Minosse lo sacrificasse — proprio il toro che Minosse si rifiutò di sacrificare, e la cui sostituzione portò al concepimento del Minotauro. Eracle catturò questo toro vivo come settima fatica, cavalcandolo attraverso il mare da Creta al Peloponneso, per poi liberarlo presso Maratona dopo averlo presentato a Euristeo (che, ancora una volta terrorizzato, non ne volle sapere nulla e lo lasciò andare). Il toro devastò le campagne intorno a Maratona per anni, finché il giovane eroe Teseo, in una delle sue prime avventure prima di diventare re di Atene, non lo catturò e lo sacrificò ad Apollo (o ad Atena, secondo altre fonti) presso il Delfinio.<br><br><b>Contesto culturale:</b> La storia di questa creatura collega alcuni dei più celebri eroi greci (Eracle, Teseo) e luoghi (Creta, Maratona, Atene) in un unico filo narrativo continuo, illustrando come la mitologia greca antica funzionasse come una rete interconnessa piuttosto che come racconti isolati e slegati — lo stesso toro divino collega l'origine del Minotauro, le fatiche di Eracle e la prima carriera eroica di Teseo.<br><br><b>Curiosità:</b> La città di Maratona, per sempre legata a questo mito, divenne in seguito celebre in tutto il mondo per un evento storico completamente diverso: la battaglia di Maratona del 490 a.C. contro i Persiani, e la corsa (in gran parte leggendaria) del messaggero Fidippide che ispirò la moderna maratona sportiva — un unico toponimo che porta con sé due eredità del tutto separate, ugualmente famose, una mitologica e una storico-atletica.",
  "Troll dei Ponti": "Creatura scandinava che rivendica il possesso di ponti e passaggi, pretendendo un pedaggio o un tributo da chiunque intenda attraversarli: la leggenda più celebre lo vede sfidato e beffato da tre astute capre.",
  "Ljósálfar": "Variante grafica del nome degli elfi di luce norreni, splendenti abitanti di Alfheim, simbolo di bellezza e grazia contrapposto alla natura oscura dei loro cugini sotterranei.",
  "Lupo di Roma": "La lupa che allattò i gemelli abbandonati Romolo e Remo lungo le rive del Tevere resta uno dei simboli più celebri della fondazione di Roma, ancora oggi raffigurata in tutta la città.",
  "Mantichora Giovane": "Creatura descritta dallo storico greco Ctesia sulla base di racconti persiani: corpo di leone, volto quasi umano dalla voce simile a un flauto, e una coda di scorpione capace di scagliare aculei velenosi.<br><br><b>Il mito completo:</b> Ctesia, medico greco alla corte persiana nel V secolo a.C., raccolse racconti di viaggiatori e mercanti sulle terre remote dell'India, descrivendo la manticora come dotata di tre file di denti aguzzi come squali, capace di divorare intere prede senza lasciare traccia — ossa comprese — e di scagliare i propri aculei velenosi come frecce, per poi farne ricrescere di nuovi. Il nome stesso \"mantichora\" deriva probabilmente dal persiano antico martiya-khvar, che significa letteralmente \"mangiatore di uomini\".<br><br><b>Contesto culturale:</b> Insieme ai Cinocefali e ad altre \"meraviglie d'India\" descritte da Ctesia, la manticora appartiene a un genere letterario greco specifico dedicato alle terre esotiche ai confini del mondo conosciuto — un misto di osservazioni reali distorte (forse ispirate a tigri o altri grandi felini asiatici descritti da fonti indirette) ed elaborazione fantastica.<br><br><b>Curiosità:</b> La manticora ha avuto una delle vite più lunghe tra i mostri \"geografici\" greci, sopravvivendo praticamente immutata nei bestiari medievali europei e comparendo ancora oggi come creatura ricorrente in giochi di ruolo e fantasy contemporanei — quasi 2500 anni dopo la prima descrizione di Ctesia.",
  "Minotauro Rinnegato": "Nato dall'unione innaturale tra la regina Pasifae e un toro sacro, il Minotauro fu rinchiuso nel Labirinto di Cnosso a nutrirsi di vittime sacrificali, finché Teseo non lo affrontò e lo uccise con l'aiuto del filo di Arianna.<br><br><b>Il mito completo:</b> Al di là della vergogna pubblica che la sua nascita causò alla famiglia reale cretese, il Minotauro rappresentò per il re Minosse un problema politico oltre che personale: nasconderlo nel Labirinto costruito da Dedalo non fu solo un atto di pudore, ma anche un modo per mantenere il controllo su una creatura che, se lasciata libera, avrebbe potuto minacciare il potere stesso di Minosse sull'isola. Alcune tradizioni suggeriscono che lo stesso Minosse, incapace di uccidere di propria mano quello che restava comunque un figlio della moglie, preferì la soluzione del confinamento perpetuo piuttosto che l'esecuzione diretta.<br><br><b>Contesto culturale:</b> Il Minotauro incarna un tema greco specifico sulla vergogna familiare come minaccia al potere politico: una creatura nata dalla propria stessa casa reale, troppo pericolosa per essere mostrata ma anche troppo legata al sangue reale per essere semplicemente eliminata, costringe Minosse a una soluzione intermedia e instabile.<br><br><b>Curiosità:</b> Il termine \"rinnegato\", applicato retrospettivamente al Minotauro nella tradizione moderna, cattura bene questa tensione originaria: una creatura mai davvero accettata dalla propria famiglia, tenuta nascosta e negata pubblicamente pur essendo innegabilmente parte della casa reale cretese.",
  "Mirmidone (Forma Umana)": "Un tempo formiche, i Mirmidoni furono trasformati in uomini da Zeus per ripopolare l'isola del re Eaco dopo una pestilenza devastante: divennero poi i leggendari guerrieri al comando di Achille durante la guerra di Troia.<br><br><b>Il mito completo:</b> Divenuti uomini, i Mirmidoni conservarono la disciplina e la lealtà assoluta delle proprie origini di formiche. Al comando di Achille durante la guerra di Troia, divennero celebri per un episodio narrato nell'Iliade: quando Achille, offeso da Agamennone, si ritirò dal combattimento, i Mirmidoni si rifiutarono di combattere senza di lui, anche di fronte alle sconfitte greche — una dimostrazione della loro fedeltà assoluta a un singolo comandante, più che alla causa greca collettiva.<br><br><b>Contesto culturale:</b> Questo episodio dell'Iliade mostra un ideale eroico specifico: la lealtà personale al proprio signore come valore supremo, anche a costo della vittoria comune — un tema che risuona in tutta la letteratura eroica successiva sulla fedeltà tra guerriero e comandante.<br><br><b>Curiosità:</b> La disciplina proverbiale dei Mirmidoni, radicata nella loro origine di formiche, ha reso il loro nome sinonimo, ancora oggi in molte lingue europee, di seguace fedele e instancabile — un'eredità linguistica diretta di questa trasformazione mitologica.",
  "Mirmidone": "Nella forma originaria, prima della trasformazione divina, i Mirmidoni erano semplicemente formiche laboriose: proprio da questa umile origine deriva il loro nome, che significa letteralmente \"popolo delle formiche\".<br><br><b>Il mito completo:</b> Il re Eaco, sovrano di un'isola spopolata da una pestilenza devastante, pregò Zeus di donargli nuovi sudditi. Zeus trasformò l'intera colonia di formiche dell'isola in una razza di uomini leali e instancabili: i Mirmidoni, da myrmex, \"formica\".<br><br><b>Contesto culturale:</b> L'etimologia stessa del nome spiega proverbialmente la disciplina e la laboriosità dei Mirmidoni — formiche, per natura, lavoratrici instancabili e collettive — un'origine mitologica che si riflette direttamente nel loro carattere umano successivo.<br><br><b>Curiosità:</b> La parola \"mirmidone\" è entrata nell'inglese moderno (myrmidon) come termine per indicare un seguace leale e senza domande, un subordinato ubbidiente fino in fondo — un uso ancora oggi diffuso, diretta eredità di questa antica trasformazione mitologica.",
  "Nisse": "Piccolo spirito domestico scandinavo, vestito di grigio con un caratteristico berretto rosso: protegge le fattorie e il bestiame, ma pretende in cambio un piatto di porridge lasciato fuori nelle notti d'inverno.",
  "Ophiotauro (cucciolo)": "Creatura ibrida tra toro e serpente le cui viscere, se bruciate, avrebbero garantito la vittoria nella guerra tra Giganti e Olimpi: gli dèi, temendone il potere, ne impedirono il sacrificio proprio in tempo.<br><br><b>Il mito completo:</b> Secondo un oracolo, chiunque fosse riuscito a bruciare le viscere dell'Ofiotauro prima che gli dèi potessero intervenire avrebbe ottenuto il potere di rovesciare l'ordine cosmico stesso, permettendo ai Giganti di sconfiggere gli Olimpi nella Gigantomachia. Un Gigante tentò di compiere il sacrificio proprio in tempo per garantire la vittoria ai suoi alleati, ma Zeus, resosi conto del pericolo, inviò la propria aquila a strappargli di mano le viscere prima che il fuoco potesse consumarle completamente, salvando così il proprio regno all'ultimo istante possibile.<br><br><b>Contesto culturale:</b> Questo mito, tra i meno noti della tradizione greca, condivide una struttura narrativa con altri racconti di \"profezie sul filo del rasoio\" — un potere immenso reso disponibile a chiunque compia un rito specifico al momento giusto, disinnescato solo da un intervento divino tempestivo e quasi casuale.<br><br><b>Curiosità:</b> A differenza della maggior parte dei mostri greci, l'Ofiotauro non viene mai sconfitto o ucciso in battaglia: la sua unica funzione narrativa è essere l'oggetto di un sacrificio quasi riuscito, rendendolo uno dei rari casi in cui il \"mostro\" della storia non è mai davvero un antagonista attivo, ma piuttosto una chiave di volta passiva il cui destino determina l'esito di un'intera guerra cosmica.",
  "Salamandra di Fuoco": "Creatura ritenuta capace di vivere immersa nelle fiamme senza bruciare, tanto da spegnerle al solo contatto: divenne in seguito, nella tradizione alchemica, il simbolo stesso dell'elemento Fuoco.",
  "Scitala": "Serpente descritto dagli autori latini come dotato di una pelle così lucente da ipnotizzare le prede in pieno inverno, quando tutti gli altri rettili sono ormai in letargo.",
  "Skogsrå": "La \"signora della foresta\" scandinava, simile alla Huldra, proteggeva gli animali selvatici del bosco e poteva sia aiutare che confondere i cacciatori che si avventuravano nel suo territorio.",
  "Sparto": "I \"uomini seminati\" nacquero armati dai denti di drago sparsi nella terra, prima da Cadmo nella fondazione di Tebe e poi da Giasone nella terra della Colchide: guerrieri feroci, si narra che iniziassero subito a combattersi a vicenda appena spuntati dal suolo.<br><br><b>Il mito completo:</b> Cadmo, fondatore di Tebe, uccise un drago che custodiva una sorgente sacra e, su consiglio di Atena, ne seminò i denti nel terreno: ne nacquero guerrieri completamente armati, che iniziarono immediatamente a combattersi a vicenda finché non ne sopravvissero solo cinque, diventati poi gli antenati della nobiltà tebana. Generazioni più tardi, Giasone, nella sua ricerca del Vello d'Oro, ricevette dallo stesso re Eeta gli stessi denti di drago (un dono di Atena) e dovette ripetere l'identica impresa come una delle sue prove impossibili, sopravvivendo grazie a uno stratagemma appreso da Medea: lanciare una pietra in mezzo agli Sparti per farli voltare gli uni contro gli altri.<br><br><b>Contesto culturale:</b> Il mito degli Sparti è legato direttamente all'identità civica di Tebe: la nobiltà tebana rivendicava una discendenza letterale dai cinque Sparti sopravvissuti, usando il mito come vero e proprio racconto fondativo della propria aristocrazia.<br><br><b>Curiosità:</b> Questo è uno degli esempi più chiari di un mito riutilizzato come \"modello\" narrativo in due storie eroiche diverse (Cadmo e Giasone), separate da generazioni — una dimostrazione di come gli elementi mitologici greci circolassero e venissero ricombinati tra diversi cicli eroici.",

  "Cernunnos": "Divinità celtica dalle corna di cervo, signore degli animali selvatici e della natura incontaminata. Le fonti su di lui sono scarse — appare soprattutto su un unico grande calderone rituale, il Calderone di Gundestrup.",
  "Domovoy": "Spirito domestico slavo che vive nascosto dietro la stufa di casa: se trattato con rispetto protegge la famiglia e il focolare, ma se dimenticato o offeso può trasformarsi in un dispettoso disturbatore notturno.",
  "Kikimora delle Paludi": "Versione più oscura e inquietante del Domovoy, la Kikimora infesta le case trascurate portando incubi e disordine: nella variante delle paludi si narra viva tra le acque stagnanti, pronta a confondere chi si avventura troppo vicino.",
  "Korrigan": "Piccole fate della tradizione bretone, i Korrigan custodiscono fontane e sorgenti sacre, proteggendo tesori nascosti: la leggenda li lega spesso a racconti di cavalieri smarriti nei boschi della Bretagna.",
  "Leshy": "Signore e guardiano della foresta nella mitologia slava, il Leshy può mutare forma e dimensione a piacimento: protegge gli animali selvatici e punisce i cacciatori avidi facendoli smarrire tra gli alberi per giorni interi.",
  "Banshee": "Spirito femminile irlandese il cui lamento straziante, udito nella notte, annuncia la morte imminente di un membro della famiglia a cui è legata: si narra che ogni antico casato avesse la propria Banshee.",
  "Cú Sìth": "Enorme cane fatato scozzese, dal manto verde scuro e silenzioso come un'ombra: si diceva portasse via le anime verso l'Aldilà, ed era temuto tanto quanto rispettato dai pastori delle Highlands.",
  "Dullahan": "Cavaliere senza testa del folklore irlandese, che porta il proprio capo sotto il braccio mentre cavalca di notte: il suo apparire davanti a una casa era considerato un presagio infallibile di morte imminente.",
  "Humbaba Giovane": "Gigante mostruoso posto dagli dèi mesopotamici a guardia della sacra Foresta dei Cedri: nell'Epopea di Gilgamesh, l'eroe e il suo compagno Enkidu lo affrontarono e sconfissero, sfidando la volontà divina.",
  "Bagiennik": "Demone delle paludi della tradizione slava polacca, trascina i viandanti incauti nel fango profondo: la sua presenza era usata per spiegare le tante sparizioni inspiegabili nelle terre acquitrinose.",
  "Bašmu": "Serpente cornuto e velenoso della mitologia mesopotamica, spesso raffigurato come creatura ibrida tra rettile e drago: comparirebbe in antichi testi come nemico primordiale sconfitto dagli dèi.",
  "Bolotnik": "\"Signore della palude\" nel folklore slavo, simile al Bagiennik ma ancora più antico e temuto: si diceva regnasse su ogni creatura che abitasse gli acquitrini, dalle rane ai serpenti.",
  "Camazotz": "Divinità pipistrello della mitologia Maya, signore della notte e della morte sacrificale: nel Popol Vuh mette alla prova gli Eroi Gemelli in una delle sfide più pericolose della loro discesa nel Xibalbá, il regno sotterraneo.",
  "Kelpie": "Spirito acquatico del folklore scozzese che vive nei laghi e nei fiumi, spesso sotto forma di cavallo. Attira i viandanti a salire sul suo dorso: chi lo fa non riesce più a scendere e viene trascinato nelle profondità.",
  "Kulullû": "Uomo-pesce guardiano delle acque nella tradizione mesopotamica, spesso raffigurato a protezione di palazzi e templi: simbolo dell'equilibrio tra il mondo umano e le profondità acquatiche.",
  "Lahmu": "Essere primordiale peloso della mitologia mesopotamica, associato alle acque dolci dell'Abzu: nonostante l'aspetto selvaggio, era considerato una figura protettiva, spesso raffigurata a guardia degli ingressi dei templi.",
  "Vucub-Caquix": "Demone-uccello della mitologia Maya, tanto arrogante da proclamarsi sole e luna in persona: la sua storia è narrata nel Popol Vuh, il testo sacro che racconta le origini del mondo, ma solo l'astuzia degli Eroi Gemelli riuscì infine a smascherarlo e sconfiggerlo.",
  "Rusalka": "Spirito femminile slavo delle acque, anima di una donna morta annegata: nelle notti di luna piena emerge dai fiumi per danzare sulle rive, attirando con il suo canto i viandanti verso le profondità.",
  "Vodyanoy": "Signore slavo delle acque dolci, spesso raffigurato come un vecchio con la barba d'alghe: benevolo con i pescatori che lo rispettano, poteva scatenare la sua ira contro chi disturbava la quiete dei suoi laghi.",
  "Yum Caax": "Giovane dio Maya del mais, dei raccolti e della vegetazione selvatica: la sua eterna giovinezza rappresentava il ciclo delle stagioni e la costante rinascita della natura dopo ogni stagione secca.",

  "Alkonost": "Insieme al Sirin e al Gamayun, l'Alkonost è uno degli uccelli-donna del paradiso nella tradizione slava: vive lungo un fiume mitico e il suo canto, meraviglioso ma pericoloso, fa dimenticare ogni pena a chi lo ascolta, rischiando di farlo restare incantato per sempre.",
  "Edimmu": "Nella tradizione mesopotamica, l'Edimmu è lo spirito inquieto di chi è morto senza una sepoltura adeguata o di morte violenta: condannato a vagare senza pace, tormenta i vivi finché i suoi resti non vengono finalmente onorati.",
  "Gallu": "Demone mesopotamico del regno dei morti, al servizio della dea Ereshkigal: fu uno dei sette Gallu a trascinare negli inferi il pastore-dio Dumuzi, in una delle storie più antiche mai scritte sulla morte e il suo prezzo.",
  "Gandharva": "Musicisti celesti della tradizione vedica indiana, i Gandharva abitano i cieli e sono sposi delle ninfe Apsara: la loro musica è così perfetta da essere considerata sacra, e custodiscono il Soma, la bevanda degli dèi.",
  "Ghoul": "Creatura del folklore arabo preislamico, il Ghoul abita cimiteri e deserti solitari, capace di mutare aspetto per ingannare i viandanti: la sua fama di divoratore di cadaveri lo rese celebre in tutto il mondo grazie alle Mille e una Notte.",
  "Rarog": "Spirito del fuoco della tradizione slava, il Rarog appare spesso come un falco fiammeggiante o un vortice incandescente: custode del focolare domestico, si narra portasse fortuna alla famiglia che lo ospitava con rispetto.",
  "Sirrush": "Drago-serpente sacro al dio Marduk, il Sirrush (o Mušḫuššu) era raffigurato sulle celebri porte di Ishtar a Babilonia: simbolo di potere regale, univa squame di serpente, zampe di leone e artigli d'aquila.",
  "Ahuizotl": "Creatura acquatica della mitologia azteca al servizio del dio della pioggia Tlaloc, dotata di una mano all'estremità della coda: trascinava i malcapitati sul fondo dei laghi, per poi restituirne il corpo privo di occhi, denti e unghie.",
  "Bunyip": "Creatura delle paludi e dei corsi d'acqua nella mitologia aborigena australiana, dall'aspetto variabile a seconda delle tradizioni locali: il suo verso, udito di notte vicino all'acqua, era considerato un presagio da non ignorare.",

  "Cariddi": "In origine una ninfa, figlia di Poseidone e Gaia, Cariddi fu trasformata da Zeus in un mostro divoratore per aver appoggiato il padre contro di lui: da allora è condannata a inghiottire ed espellere il mare in eterno, in un vortice senza fine.<br><br><b>Il mito completo:</b> Cariddi si schierò con Poseidone in una disputa contro Zeus (secondo alcune versioni, aiutandolo a rubare bestiame o terre), e per punizione fu trasformata in un mostro fissato sotto una roccia nello Stretto di Messina, condannato a inghiottire e rigettare le acque marine tre volte al giorno, creando un vortice letale e inevitabile. Si trovava esattamente di fronte a Scilla, sull'altro lato dello stretto, costringendo i naviganti — come Ulisse — a una scelta impossibile tra due pericoli mortali: da qui l'espressione ancora oggi diffusa \"tra Scilla e Cariddi\", equivalente al nostro \"tra l'incudine e il martello\".<br><br><b>Contesto culturale:</b> La coppia Cariddi-Scilla è diventata una delle metafore più durature dell'antichità per descrivere un dilemma senza via d'uscita, tuttora usata idiomaticamente in molte lingue europee. Geografi antichi come Tucidide collegavano il mito alle correnti reali e realmente pericolose dello Stretto di Messina, tra Italia e Sicilia, un tratto di mare genuinamente insidioso per i naviganti antichi.<br><br><b>Curiosità:</b> A differenza della maggior parte dei mostri greci, Cariddi non ha quasi mai una descrizione fisica fissa nelle fonti antiche: viene spesso immaginata puramente come una forza della natura, un vortice dotato di un'enorme bocca, più che come una creatura dall'anatomia definita — uno dei mostri più astratti dell'intero bestiario mitologico greco.",
  "Cerva di Cerinea Adulta": "Eracle inseguì questa cerva sacra ad Artemide per un anno intero attraverso tutta la Grecia, senza mai riuscire a ferirla: la raggiunse solo presso il fiume Ladone, e dovette poi convincere la dea stessa a perdonargli di aver toccato la sua creatura sacra.<br><br><b>Il mito completo:</b> Sacra ad Artemide, dea della caccia, la Cerva di Cerinea aveva corna dorate — un dettaglio insolito, dato che le cerve femmine normalmente non hanno corna, a segnalarne fin da subito la natura soprannaturale — e zoccoli di bronzo, ed era celebre per correre più veloce di una freccia in volo. La terza fatica di Eracle richiedeva specificamente di catturarla viva, non di ucciderla come la maggior parte delle altre imprese, rendendo il compito delicatissimo: ferire la creatura sacra della dea rischiava di scatenarne la collera. Eracle la inseguì per un anno intero attraverso la Grecia, prima di riuscire a fermarla, ferendola leggermente tra tendine e osso per non spargere sangue né spezzare l'arto, presso il fiume Ladone. Portandola via viva, incontrò Artemide e Apollo furiosi lungo il cammino: spiegò la propria necessità, obbligato dagli ordini di Euristeo, e ottenne il perdono, potendo così completare la fatica prima di restituire la cerva alla dea.<br><br><b>Contesto culturale:</b> Questa fatica si distingue tra le dodici per l'enfasi sulla misura e l'astuzia piuttosto che sulla violenza bruta: Eracle deve riuscire senza danneggiare una creatura sacra e innocente, riflettendo l'ansia religiosa greca per il comportamento corretto verso i possedimenti degli dèi.<br><br><b>Curiosità:</b> Gli artisti antichi raffiguravano spesso questa fatica mostrando Eracle mentre afferra delicatamente le corna della cerva o la conduce con un laccio in pose visibilmente più gentili rispetto alle sue altre imprese, più violente — una delle pochissime scene mitologiche in cui l'iconografia di Eracle privilegia la tenerezza sulla forza bruta.",
  "Cinghiale di Calidone": "Nella grande caccia che riunì gli eroi di tutta la Grecia, fu la cacciatrice Atalanta a colpire per prima la bestia, ma il colpo di grazia spettò al principe Meleagro: la disputa sulla pelle del cinghiale scatenò una faida familiare che costò la vita allo stesso Meleagro.<br><br><b>Il mito completo:</b> Inviato da Artemide a devastare Calidone dopo che il re Eneo si era dimenticato di includerla nei sacrifici del raccolto offerti a tutti gli altri dèi, il cinghiale devastava campi, bestiame e vite umane. Il figlio del re, Meleagro, radunò i più grandi eroi di Grecia per la Caccia Calidonia — tra cui Giasone, Teseo, i Dioscuri e la cacciatrice Atalanta, unica donna del gruppo, la cui presenza fu malvista da diversi eroi. Fu proprio Atalanta a colpire per prima la bestia, ma il colpo mortale spettò a Meleagro, che le assegnò poi la pelle del cinghiale come trofeo, in riconoscimento della sua abilità e, secondo alcune versioni, come gesto d'amore. Questo scatenò la furia degli zii di Meleagro, che tentarono di strappare la pelle ad Atalanta; Meleagro li uccise nello scontro che ne seguì. Sua madre Altea, scoprendo che i propri fratelli erano morti per mano del figlio, recuperò un tizzone magico legato alla vita di Meleagro (le Parche avevano predetto che sarebbe morto quando quel legno si fosse consumato del tutto) e lo gettò nel fuoco, uccidendo il figlio all'istante per dolore e vendetta.<br><br><b>Contesto culturale:</b> Il mito della Caccia Calidonia esplora temi di onore, tensione di genere (il risentimento degli eroi verso la partecipazione e l'abilità di Atalanta) e il potere distruttivo della faida familiare — la morte di Meleagro per mano della propria madre è una delle tragedie più crude della mitologia greca sullo scontro tra fato e obbligo familiare.<br><br><b>Curiosità:</b> Questo mito è uno dei primi ed più vividi esempi nella letteratura greca di una donna, Atalanta, esplicitamente celebrata per abilità marziale e venatoria alla pari degli eroi maschili — le ceramiche greche successive la raffigurano spesso in primo piano, a volte persino come figura centrale della caccia, riflettendo un genuino, seppur limitato, fascino antico per l'eroismo femminile.",
  "Ittiocentauro": "Le fonti greche più tarde raccontano di due Ittiocentauri con un nome proprio, Bythos (\"Profondità\") e Afros (\"Schiuma\"), che avrebbero guidato fino a riva la conchiglia sulla quale nacque Afrodite.<br><br><b>Il mito completo:</b> A differenza della maggior parte degli ibridi mostruosi greci, legati a una fatica eroica o a un'epica precisa, gli Ittiocentauri appartengono a una tradizione mitologica più tarda e decorativa, particolarmente diffusa nell'arte ellenistica e romana piuttosto che nella poesia epica arcaica. Due Ittiocentauri con nome proprio, Bythos e Afros, compaiono in alcune fonti tarde come compagni che guidarono fino a riva la conchiglia sulla quale la neonata Afrodite emerse dalla schiuma del mare.<br><br><b>Contesto culturale:</b> Appartenevano al più ampio \"tiaso marino\", un motivo artistico molto amato in epoca ellenistica e romana, che raffigurava una gioiosa processione sottomarina di Nereidi, Tritoni, centauri marini e altri spiriti acquatici al seguito di divinità come Poseidone o Afrodite — particolarmente diffuso nei mosaici pavimentali e nei rilievi dei sarcofagi, a celebrazione dell'abbondanza e della bellezza del mare.<br><br><b>Curiosità:</b> A differenza dei Centauri terrestri, legati a storie di violenza e natura selvaggia, gli Ittiocentauri non portano con sé alcun mito di conflitto o tragedia: esistono puramente come figure graziose e celebrative, un raro esempio nella mitologia greca di una creatura ibrida inventata soprattutto per scopi estetici e decorativi piuttosto che morali o narrativi.",
  "Scilla": "Nell'Odissea, Ulisse scelse consapevolmente di far passare la nave sotto lo scoglio di Scilla piuttosto che rischiare l'intero equipaggio nel vortice di Cariddi: il mostro afferrò e divorò sei marinai, uno per ciascuna delle sue teste.<br><br><b>Il mito completo:</b> In origine, secondo la maggior parte delle versioni, Scilla era una bellissima ninfa marina (figlia di Forco, o secondo altre fonti di Ecate) amata dal dio marino Glauco. Quando Glauco chiese aiuto alla maga Circe per conquistarla, fu Circe stessa a innamorarsi di lui; respinta, per gelosia avvelenò la pozza dove Scilla era solita bagnarsi, trasformandola dalla vita in giù in un anello mostruoso di sei colli terminanti in teste canine dotate di zanne. Sconvolta e furiosa, Scilla si stabilì per sempre in una grotta su un lato dello Stretto di Messina, di fronte a Cariddi, divorando i marinai di passaggio con ciascuna delle sue teste. Nell'Odissea, avvertito da Circe che Cariddi avrebbe potuto distruggere l'intera nave mentre Scilla si sarebbe accontentata di pochi uomini, Ulisse guidò deliberatamente la nave verso il lato di Scilla, sacrificando sei marinai — uno per ciascuna testa — per salvare il resto dell'equipaggio.<br><br><b>Contesto culturale:</b> La trasformazione di Scilla da vittima innocente a mostro, causata dalla gelosia di un'altra donna (Circe), riflette uno schema ricorrente nel mito greco, in cui la mostruosità femminile nasce spesso da una punizione divina per una colpa che la donna stessa non ha commesso — lo stesso schema del mito di Medusa — un tema su cui gli studiosi hanno a lungo riflettuto riguardo a come la mitologia greca inquadri spesso la mostruosità femminile come trasformazione tragica piuttosto che malvagità innata.<br><br><b>Curiosità:</b> Il poeta romano Ovidio, nelle Metamorfosi, offre uno dei racconti più dettagliati della trasformazione di Scilla, con il suo busto umano che urla d'orrore mentre osserva in tempo reale la propria parte inferiore contorcersi in teste canine mostruose — uno dei passaggi di body-horror più vividi della letteratura antica, sorprendentemente moderno nel suo dettaglio viscerale.",
  "Tritone": "Quando i Giganti assalirono l'Olimpo, fu Tritone a soffiare nella sua conchiglia con un suono così terribile da farli fuggire in preda al panico, convinti che una bestia mostruosa fosse giunta in soccorso degli dèi.<br><br><b>Il mito completo:</b> Figlio di Poseidone e Anfitrite, Tritone svolgeva il ruolo di araldo e messaggero del mare, spesso raffigurato mentre soffia nella sua grande conchiglia, il cui suono poteva calmare o agitare le onde a piacimento. Oltre all'episodio della Gigantomachia, Tritone compare anche nelle Argonautiche, dove guida gli Argonauti fuori da un lago interno della Libia in cui erano rimasti bloccati, donando a Eufemo una zolla di terra sacra che, secondo la leggenda successiva, avrebbe portato alla fondazione della città di Cirene.<br><br><b>Contesto culturale:</b> Col tempo Tritone diede il proprio nome a un'intera classe di divinità marine minori nell'arte greca ed ellenistica successiva — i \"tritoni\" (al plurale), spiriti marini maschili dalla coda di pesce che accompagnavano Poseidone e popolavano innumerevoli mosaici e sculture, proprio come le \"Nereidi\" divennero il termine generico per le ninfe del mare. Questo passaggio linguistico da un singolo dio con nome proprio a un'intera categoria è uno schema notevole di come la mitologia greca abbia assorbito e moltiplicato le proprie divinità minori nel corso dei secoli.<br><br><b>Curiosità:</b> La luna più grande di Nettuno, scoperta nel 1846, porta proprio il nome di Tritone — proseguendo un'antica tradizione astronomica (già seguita per Crono/Saturno e Zeus/Giove) di intitolare corpi celesti alle divinità marine greco-romane, estendendo l'eredità mitologica di Tritone fino all'astronomia planetaria moderna, quasi tre millenni dopo la sua prima apparizione nella poesia greca.",

  "Cerbero": "Il cane a tre teste che sorveglia le porte degli Inferi, impedendo tanto ai vivi di entrare quanto alle anime dei morti di uscire: catturarlo vivo, a mani nude e senza armi, fu l'ultima e la più temeraria delle dodici fatiche di Eracle.<br><br><b>Il mito completo:</b> Figlio di Tifone ed Echidna, fratello dell'Idra di Lerna, della Chimera e di Orto (il cane a due teste ucciso da Eracle nella fatica dei buoi di Gerione), Cerbero era il guardiano assoluto della soglia tra il mondo dei vivi e quello dei morti: lasciava entrare tutti, non lasciava uscire nessuno. Per la sua dodicesima e ultima fatica, Euristeo pretese che Eracle gli portasse Cerbero in catene. L'eroe scese negli Inferi guidato da Ermes e Atena, ottenne il permesso di Ade a patto di non usare alcuna arma, e domò la belva a mani nude, protetto dalla pelle invulnerabile del Leone di Nemea dai morsi del serpente sulla coda. Trascinò Cerbero fino a Micene, dove il re Euristeo, terrorizzato, si nascose in una giara di bronzo — per poi restituire il cane al suo posto negli Inferi.<br><br><b>Contesto culturale:</b> Cerbero incarnava l'idea greca della morte come soglia invalicabile in un'unica direzione: si poteva entrare nel regno di Ade, ma tornarne era quasi impossibile (come dimostrano i pochissimi eroi capaci di riuscirci, tra cui lo stesso Eracle). Figure di cani multi-testa a guardia dell'oltretomba ricorrono in diverse mitologie indoeuropee, suggerendo radici condivise molto antiche. Il mito ha continuato a vivere ben oltre la Grecia antica: Dante, nella sua Commedia, colloca Cerbero a guardia dei golosi nel terzo cerchio dell'Inferno.<br><br><b>Curiosità:</b> Il numero delle teste di Cerbero non è sempre stato tre: Esiodo, la fonte più antica, ne descrive addirittura cinquanta o cento; fu l'arte e la letteratura classica successiva a fissare il canone delle tre teste che conosciamo oggi. Una leggenda vuole che l'aconito, pianta velenosa usata nell'antichità, sia nato dalla bava di Cerbero caduta a terra mentre veniva trascinato controvoglia alla luce del sole.",
  "Chirone": "A differenza dei centauri selvaggi nati dalle nubi, Chirone era figlio del titano Crono e della ninfa Filira: saggio e giusto, divenne maestro di eroi come Achille, Giasone e Asclepio, e pur essendo immortale scelse infine di rinunciare alla propria immortalità per liberare Prometeo dal suo tormento.<br><br><b>Il mito completo:</b> Mentre gli altri centauri nacquero dall'unione tra Issione e una nuvola dalle sembianze di Era — da cui la loro natura violenta e incline all'ebbrezza — Chirone era figlio diretto del titano Crono e della ninfa Filira, e per questo immortale, saggio, colto. Visse sul Monte Pelio, dove divenne il leggendario maestro di numerosi eroi greci: insegnò ad Achille l'arte della guerra, a Giasone la guida, ad Asclepio i segreti della medicina che ne avrebbero fatto il dio della guarigione. Fu ferito per errore da una freccia di Eracle, intinta nel sangue avvelenato dell'Idra, durante uno scontro con altri centauri: la ferita era incurabile, ma Chirone, essendo immortale, non poteva morire — condannato a un dolore perpetuo. Per porre fine alla propria sofferenza, offrì di scambiare la propria immortalità con Prometeo, condannato da Zeus a un tormento eterno per aver rubato il fuoco agli uomini: così Prometeo poté finalmente morire e essere liberato, mentre Chirone ascese in cielo, diventando la costellazione del Sagittario (o del Centauro, secondo altre fonti).<br><br><b>Contesto culturale:</b> Chirone rappresentava un modello ideale di saggezza, mentorship e virtù civile, in netto contrasto con la violenza caotica ed ebbra tipicamente associata ai centauri (basti pensare alla Centauromachia, la celebre battaglia tra centauri e Lapiti). Il suo ruolo di maestro di medicina, tramandato ad Asclepio, ne consolidò per sempre il legame con l'arte della guarigione — una tradizione che sopravvive ancora oggi nel termine \"chirurgia\", dal greco cheirourgia, \"lavoro con le mani\".<br><br><b>Curiosità:</b> Il sacrificio di Chirone per Prometeo è uno dei pochissimi miti greci costruiti esplicitamente attorno all'idea di rinunciare volontariamente all'immortalità — una struttura narrativa sorprendentemente rara in una mitologia quasi sempre ossessionata dagli eroi che cercano di sfuggire alla morte, non di abbracciarla.",
  "Grifone Reale": "Lo storico greco Erodoto raccontava che i grifoni custodissero enormi giacimenti d'oro tra le montagne della Scizia, difendendoli senza sosta dagli Arimaspi, un popolo leggendario di cacciatori con un solo occhio.<br><br><b>Il mito completo:</b> A differenza di molte altre creature greche, il grifone non è protagonista di una singola avventura eroica, ma di un motivo ricorrente legato alla custodia di tesori in terre lontane. Nella Scizia, ai confini settentrionali del mondo conosciuto, i grifoni proteggevano immensi giacimenti d'oro, in perenne lotta contro gli Arimaspi che tentavano di rubarlo. Il grifone era anche associato ad Apollo, che secondo alcune tradizioni li avrebbe usati per trainare il proprio carro, e a Nemesi, dea della retribuzione e della giusta punizione.<br><br><b>Contesto culturale:</b> Il grifone simboleggiava vigilanza e protezione del sacro e del prezioso: compare come motivo decorativo diffuso nell'arte greca, persiana e più tardi nell'araldica medievale, spesso posto agli ingressi di templi o tombe come guardiano. La sua natura ibrida — aquila, re del cielo, e leone, re degli animali terrestri — lo rendeva un simbolo naturale di duplice, suprema sovranità.<br><br><b>Curiosità:</b> Alcuni paleontologi moderni, in particolare la storica Adrienne Mayor, hanno proposto che la leggenda del grifone sia nata dall'incontro dei cercatori d'oro sciti con scheletri fossili di Protoceratopo in Asia Centrale: il cranio dotato di becco e la postura quadrupede ricordano sorprendentemente le raffigurazioni dei grifoni, offrendo uno dei primi esempi noti di folklore ispirato direttamente da un ritrovamento paleontologico.",
  "Idra di Lerna": "La vera Idra, con le sue molte teste mortali e una centrale immortale, fu la seconda fatica di Eracle: solo bruciando il moncone di ogni testa recisa con l'aiuto del nipote Iolao riuscì a impedirne la ricrescita, seppellendo infine la testa immortale sotto un masso enorme.<br><br><b>Il mito completo:</b> Figlia di Tifone ed Echidna, come Cerbero e la Chimera, l'Idra viveva nelle paludi di Lerna, presso un ingresso segreto agli Inferi. Ogni volta che Eracle recideva una testa, altre due ricrescevano al suo posto — un meccanismo di difesa quasi impossibile da vincere con la sola forza. Durante lo scontro intervenne anche un gigantesco granchio, Karkinos, inviato da Era a mordergli il piede: Eracle lo schiacciò, ed Era lo trasformò poi nella costellazione del Cancro. La vittoria arrivò solo grazie all'aiuto del nipote Iolao, che cauterizzava con una torcia ogni moncone appena reciso, impedendo la ricrescita. Infine Eracle staccò e seppellì la testa immortale sotto un macigno enorme, e intinse le proprie frecce nel sangue velenoso della bestia — un veleno che in seguito avrebbe ucciso il centauro Nesso, e infine, indirettamente, lo stesso Eracle.<br><br><b>Contesto culturale:</b> L'Idra è diventata proverbiale in tutta la cultura occidentale per descrivere un problema che peggiora se affrontato con superficialità — da qui l'espressione ancora oggi diffusa \"tagliare una testa e vederne spuntare altre due\", usata per corruzione, burocrazia o qualunque male che si autoalimenta. Le raffigurazioni più antiche compaiono già su ceramiche corinzie del VI secolo a.C.<br><br><b>Curiosità:</b> Il nome \"idra\" deriva direttamente dal greco hýdor, \"acqua\", a conferma del legame profondo tra la creatura e il suo habitat palustre. Questa è una delle pochissime fatiche in cui Eracle ricevette aiuto esterno (da Iolao): alcune fonti antiche discussero seriamente se dovesse essere considerata valida, dato che l'eroe non l'aveva portata a termine da solo — e lo stesso Euristeo, in un primo momento, si rifiutò di conteggiarla tra le dodici.",
  "Leone di Nemea": "La sua pelliccia era così resistente da respingere qualunque lama: dopo averlo strangolato a mani nude, Eracle scoprì che solo gli artigli della bestia stessa potevano scuoiarla, ottenendo così il mantello invulnerabile che lo avrebbe accompagnato in tutte le sue imprese successive.<br><br><b>Il mito completo:</b> Le fonti antiche non concordano sull'origine esatta del leone: Esiodo lo descrive come figlio della mostruosa Echidna e di Tifone o del proprio stesso figlio Orto (in un caso inquietante di incesto divino comune tra le genealogie dei mostri primordiali), mentre altre tradizioni raccontano che fosse caduto dalla luna, allevato da Selene come sua bestia sacra. Qualunque fosse la sua origine, tutte le versioni concordano che Era o Selene lo collocarono nella valle di Nemea proprio per tormentare la popolazione locale, prima dell'arrivo di Eracle.<br><br><b>Contesto culturale:</b> Al termine della fatica, Zeus onorò il leone ponendolo tra le stelle come costellazione del Leone — una delle dodici costellazioni dello zodiaco, assicurando che la memoria della creatura (e il trionfo di Eracle su di essa) restasse visibile nel cielo notturno per tutte le generazioni future, una pratica greca comune per commemorare astronomicamente gli eventi mitologici principali.<br><br><b>Curiosità:</b> Questa fu la prima delle dodici fatiche, scelta deliberatamente da Euristeo come prova d'apertura che si aspettava fosse fatale — al punto che, secondo la tradizione, quando Eracle tornò indossando la pelle stessa del leone come trofeo, il re fu così terrorizzato da far seppellire nel terreno un grande vaso di bronzo (un pithos), da cui in seguito avrebbe osservato il ritorno di Eracle da ogni fatica successiva, troppo spaventato per affrontarlo di persona.",
  "Minotauro": "Nato dall'unione contro natura tra la regina Pasifae e il Toro di Creta, punizione degli dèi contro il re Minosse, il Minotauro fu rinchiuso nel Labirinto costruito da Dedalo e nutrito con giovani ateniesi in tributo, finché Teseo non pose fine al suo regno di terrore.<br><br><b>Il mito completo:</b> Tutto nasce da uno sgarro: Minosse aveva promesso a Poseidone di sacrificare uno splendido toro emerso dal mare, ma lo sostituì con un altro animale, trattenendo per sé la bestia divina. Per punirlo, Poseidone fece innamorare follemente la regina Pasifae del toro; Dedalo costruì per lei una struttura di legno a forma di giovenca per consumare l'unione, da cui nacque il Minotauro. Ogni nove anni, Atene era costretta a inviare a Creta sette giovani e sette fanciulle in tributo, divorati dalla creatura nel cuore del Labirinto — finché Teseo, aiutato dal filo che Arianna gli affidò per non perdersi al ritorno, non lo affrontò e uccise a mani nude.<br><br><b>Contesto culturale:</b> Per i Greci il Minotauro incarnava la νέμεσις (nemesis), la punizione divina inevitabile che segue la tracotanza umana (ὕβρις, hybris): Minosse pagò per il suo inganno attraverso la vergogna generata nella propria stessa famiglia. Il mito rifletteva anche un ricordo storico reale: gli scavi di Cnosso a Creta, con i loro palazzi immensi e labirintici e i celebri affreschi di giovani acrobati che saltavano sopra tori, suggeriscono che dietro la leggenda si celi la memoria della civiltà minoica e dei suoi rituali taurini.<br><br><b>Curiosità:</b> Il nome \"Minotauro\" significa letteralmente \"toro di Minosse\" (dal greco Μῑνώταυρος), e la creatura veniva chiamata anche Asterione, forse un'eco di un'antica divinità cretese pre-greca. Le rappresentazioni artistiche più antiche, su vasi corinzi dell'VII secolo a.C., lo raffigurano già con il caratteristico corpo umano e testa taurina — un'iconografia rimasta sorprendentemente stabile per oltre 2000 anni, fino ai giorni nostri.",

  "Apopi Giovane": "Apopi (Apophis) è il grande serpente del caos della mitologia egizia, nemico eterno del dio-sole Ra: ogni notte tenta di inghiottire la barca solare durante il suo viaggio negli inferi, e ogni notte viene respinto affinché il sole possa sorgere di nuovo all'alba.",
  "Bixi": "Una delle nove leggendarie progenie del Drago nella tradizione cinese, il Bixi ha corpo di tartaruga e testa di drago: simbolo di forza e longevità, la sua immagine sorregge da secoli le grandi stele di pietra incise nei templi e nei monumenti imperiali.",
  "Fenice": "Secondo lo storico greco Erodoto, la Fenice appare in Egitto una volta ogni cinquecento anni, portando le spoglie del proprio genitore avvolte in mirra fino al tempio del Sole a Eliopoli, in un ciclo di pietà filiale tramandato di generazione in generazione.<br><br><b>Il mito completo:</b> Erodoto, nelle sue Storie, offre il primo resoconto greco dettagliato: un uccello grande quanto un'aquila, dalle piume rosse e dorate, proveniente dall'Arabia, che visita il tempio del Sole a Eliopoli in Egitto una sola volta ogni cinquecento anni, portando con sé il corpo del proprio genitore defunto racchiuso in un uovo di mirra per seppellirlo lì. Autori più tardi, come Ovidio e Plinio il Vecchio, arricchirono il mito: la Fenice costruisce un nido di spezie aromatiche, viene consumata dal fuoco, e una nuova Fenice rinasce dalle sue ceneri — la versione oggi più celebre, anche se questo elemento di morte e rinascita è un'aggiunta più tarda, di età romana, assente nel racconto originale di Erodoto incentrato piuttosto sulla pietà filiale.<br><br><b>Contesto culturale:</b> La Fenice è diventata uno dei simboli più duraturi di rinnovamento, immortalità e resurrezione nella storia occidentale: fu adottata dai primi scrittori cristiani, come Clemente di Roma, come allegoria della resurrezione e della vita eterna, comparve su monete imperiali romane come emblema dell'eternità dell'Impero, e continua oggi a comparire in bandiere, letteratura e cultura popolare in tutto il mondo.<br><br><b>Curiosità:</b> La parola greca phoinix indicava anche il colore rosso-porpora, il popolo dei Fenici e la palma da dattero — gli studiosi discutono ancora se il nome dell'uccello derivi dal colore acceso del suo piumaggio o dalla Fenicia stessa, dove esistevano miti solari molto simili, come quello dell'uccello Bennu egizio, probabile parente diretto o modello della Fenice greca.",
  "Huli Jing": "Nella tradizione cinese, la volpe Huli Jing può accumulare secoli di saggezza e sviluppare nove code, ottenendo il potere di trasformarsi in splendide fanciulle: a seconda delle storie, può essere una guida illuminata oppure una tentatrice capace di sconvolgere il destino di un uomo.",
  "Kappa": "Spirito acquatico giapponese che abita fiumi e stagni, riconoscibile per la conca d'acqua incavata sulla testa: se quell'acqua si versa, il Kappa perde ogni sua forza — un dettaglio che generazioni di bambini hanno imparato a proprio vantaggio per placarlo con un inchino rispettoso.",
  "Medusa": "Un tempo bellissima sacerdotessa di Atena, Medusa fu trasformata in un mostro dalla stessa dea per punirla di un affronto subito nel suo tempio: da allora il suo sguardo pietrifica chiunque la osservi, finché Perseo non la decapitò guardandola solo di riflesso nel suo scudo.<br><br><b>Il mito completo:</b> Medusa era una delle tre sorelle Gorgoni, l'unica mortale tra loro. Secondo la versione più nota, fu Poseidone a unirsi a lei nel tempio di Atena; ma fu Medusa, non il dio, a subire la punizione della dea oltraggiata, che le trasformò i capelli in serpenti e lo sguardo in un'arma letale. Perseo, incaricato dal re Polidette di portargli la sua testa in un compito pensato per essere impossibile, ricevette dagli dèi gli strumenti per riuscirci: lo scudo a specchio di Atena, i sandali alati di Ermes, l'elmo dell'invisibilità di Ade. Decapitò Medusa mentre dormiva, guardando solo il suo riflesso per non essere pietrificato. Dal collo reciso nacquero Pegaso e il gigante Crisaore, figli di Poseidone rimasti intrappolati nel suo corpo.<br><br><b>Contesto culturale:</b> La testa di Medusa, il Gorgoneion, divenne uno dei simboli apotropaici (cioè capaci di allontanare il male) più diffusi nell'arte greca: comparve su scudi, timpani di templi, ingressi di edifici, proprio per \"spaventare la paura stessa\" con un volto ancora più terribile di qualunque minaccia. Riflette una convinzione greca profonda: l'orrore, se rivolto verso l'esterno, può proteggere anziché distruggere.<br><br><b>Curiosità:</b> Il nome Medusa deriva dal verbo greco medein, \"proteggere\" o \"governare\" — un'ironia notevole per una figura ricordata come mostro, ma coerente col suo uso successivo come simbolo protettivo. Le raffigurazioni più antiche delle Gorgoni, risalenti al VII secolo a.C., non mostrano affatto una donna bella e tragica, ma un volto grottesco con zanne di cinghiale e lingua penzolante: l'immagine della \"bella dannata\" che conosciamo oggi è in gran parte una reinterpretazione molto più tarda, resa celebre soprattutto dall'arte rinascimentale e moderna.",
  "Polifemo": "Il più celebre dei Ciclopi, figlio di Poseidone, tenne prigioniero Ulisse e i suoi compagni nella propria caverna: l'eroe riuscì a fuggire acciecandolo con un palo infuocato e presentandosi con l'astuto nome \"Nessuno\".<br><br><b>Il mito completo:</b> Figlio di Poseidone e della ninfa marina Toosa, Polifemo viveva da solitario pastore sull'isola dei Ciclopi, allevando greggi in una grande caverna. Quando Ulisse e dodici compagni rimasero intrappolati al suo interno, sigillati da un macigno enorme che solo Polifemo poteva spostare, il Ciclope iniziò a divorarne due alla volta. Ulisse escogitò una fuga: offrì a Polifemo vino fortissimo, e quando il gigante gli chiese il nome, rispose con astuzia \"Nessuno\" (in greco, Outis). Una volta che Polifemo cadde in un sonno ubriaco, Ulisse e i compagni rimasti gli conficcarono nell'unico occhio un palo d'ulivo appuntito e indurito al fuoco, accecandolo. Quando Polifemo urlò chiedendo aiuto, gridando che \"Nessuno\" lo stava attaccando, gli altri Ciclopi pensarono non ci fosse alcun aggressore e lo lasciarono senza soccorso. I Greci fuggirono dalla caverna aggrappandosi al ventre delle pecore, mentre il Ciclope, cieco, ne tastava solo il dorso lasciandole uscire al pascolo. Mentre si allontanava in nave, Ulisse rivelò con arroganza il proprio vero nome, permettendo a Polifemo di invocare la vendetta del padre Poseidone — la causa diretta della persecuzione decennale del dio del mare contro Ulisse per tutto il resto dell'Odissea.<br><br><b>Contesto culturale:</b> L'episodio di Polifemo viene spesso letto come una riflessione sui pericoli dell'hybris, l'orgoglio arrogante: l'astuzia di Ulisse salva l'equipaggio, ma il suo bisogno di vantarsi del proprio vero nome subito dopo, annullando la protezione dell'anonimato, causa direttamente anni di sofferenza — una delle illustrazioni omeriche più chiare dell'intelligenza scaltra (mētis) vanificata da un ego incontrollato.<br><br><b>Curiosità:</b> Il gioco di parole su \"Nessuno\" funziona pienamente solo in greco antico (Outis suona quasi identico a mē tis, \"nessuna astuzia\"), un'ambiguità in gran parte perduta nella traduzione — gli studiosi lo considerano uno dei primi ed più sofisticati esempi di gioco di parole come dispositivo letterario in tutta la letteratura occidentale, incastonato direttamente nella meccanica della trama e non solo come intrattenimento decorativo.",
  "Stinfalidi": "Questi uccelli dal piumaggio di bronzo si erano moltiplicati a tal punto da oscurare il cielo sul lago di Stinfalo, terrorizzando la regione: Eracle li fece alzare in volo tutti insieme con un sonaglio forgiato da Efesto, per poi abbatterli con le sue frecce infallibili.<br><br><b>Il mito completo:</b> Questi uccelli dal piumaggio di bronzo (alcune fonti raccontano che potessero scagliare le proprie piume metalliche come frecce, altre che i loro escrementi fossero abbastanza tossici da avvelenare i raccolti) si erano moltiplicati senza controllo intorno al lago di Stinfalo in Arcadia, spinti lì originariamente dai lupi, e secondo alcune versioni erano sacri ad Ares. La sesta fatica richiedeva a Eracle di scacciarli. Poiché il terreno paludoso rendeva impossibile un assalto diretto (non poteva né guadare in sicurezza né mirare con precisione tra i fitti canneti dove nidificavano), Atena gli fornì un paio di crotali di bronzo, forgiati da Efesto appositamente per questo scopo. Il suono assordante fece alzare in volo l'intero stormo contemporaneamente, ed Eracle li abbatté con l'arco mentre fuggivano: alcuni furono uccisi, il resto fuggì per sempre verso la regione del Mar Nero, dove secondo un mito successivo gli Argonauti ne avrebbero incontrato i discendenti.<br><br><b>Contesto culturale:</b> Questa fatica illustra uno schema ricorrente in diverse delle dodici imprese di Eracle: la vittoria ottenuta non con la sola forza bruta ma con strumenti ingegnosi e aiuto divino (si pensi allo strangolamento del Leone di Nemea, o allo scudo a specchio donato da Atena a Perseo contro Medusa) — un promemoria di come l'eroismo greco valorizzasse l'astuzia (mētis) tanto quanto la potenza fisica.<br><br><b>Curiosità:</b> Alcuni storici antichi ipotizzarono che il mito degli \"uccelli Stinfalidi\" fosse nato da racconti di seconda mano, tramandati confusamente da viaggiatori greci, su esotici uccelli africani — forse fenicotteri o ibis, il cui aspetto e comportamento insoliti, filtrati attraverso generazioni di racconti, potrebbero facilmente essere diventati la leggenda di mostruosi uccelli assassini dalle piume di metallo.",
  "Valchiria": "Guerriere al servizio di Odino, le Valchirie scelgono sul campo di battaglia quali guerrieri caduti meritano di essere condotti nel Valhalla: cavalcano tra le nubi della guerra stessa, ed è il loro volo silenzioso a decidere chi verrà ricordato per l'eternità.<br><br><b>Il mito completo:</b> Oltre a scegliere i caduti destinati al Valhalla, le Valchirie servivano Odino direttamente nella sua sala, portando idromele agli einherjar (i guerrieri morti prescelti) che si addestravano di giorno per la battaglia finale del Ragnarök e banchettavano di notte. Valchirie individuali con nome proprio compaiono in tutte le saghe e le Edda — Brynhild, la più celebre di tutte, disobbedì a un ordine diretto di Odino su chi dovesse vincere una determinata battaglia, e fu punita con una spina del sonno e imprigionata dentro un anello di fiamme, risvegliata solo dall'eroe Sigurd (lo stesso che uccise Fafnir).<br><br><b>Contesto culturale:</b> Le Valchirie occupavano uno spazio culturale complesso — al tempo stesso terrificanti agenti di morte sul campo di battaglia e figure desiderabili, talvolta corteggiate romanticamente nella letteratura successiva delle saghe, riflettendo l'intreccio proprio della cultura guerriera norrena tra la venerazione della morte gloriosa in battaglia e la narrativa romantica eroica.<br><br><b>Curiosità:</b> La parola \"Valchiria\" (norreno antico valkyrja) significa letteralmente \"colei che sceglie i caduti\" — e la celebre \"Cavalcata delle Valchirie\" di Richard Wagner, tratta dal suo ciclo operistico Die Walküre, resta uno dei brani più immediatamente riconoscibili della musica classica, garantendo la fama continua di queste figure nella cultura occidentale quasi mille anni dopo la composizione delle saghe originali.",
  "Xiezhi": "Creatura della tradizione cinese dotata di un solo corno, capace di distinguere il giusto dall'ingiusto con perfetta infallibilità: si narra che colpisse istintivamente col corno chiunque mentisse, motivo per cui divenne simbolo della giustizia e dei suoi tribunali.",

  "Ifrit Minore": "Nella tradizione araba, gli Ifrit sono spiriti di fuoco potenti e orgogliosi, una casta superiore tra i Jinn: vivono nelle profondità della terra e si narra emergano dalle fiamme stesse dei falò abbandonati.",
  "Alicanto": "Uccello leggendario delle Ande cilene che si nutre di minerali preziosi, oro e argento: le sue piume brillano di notte, ma si narra che chi tenta di seguirne la scia luminosa in cerca di ricchezza rischi di smarrirsi per sempre tra le montagne.",
  "Zhar-Ptitsa": "Il vero Uccello di Fuoco delle fiabe russe: le sue piume incandescenti illuminano la notte come torce, e una sola di esse, caduta a terra, può cambiare il destino di chi la raccoglie — come accade a Ivan Tsarevich nella fiaba più celebre.",
  "Strix": "Nella tradizione romana, la Strix è un uccello notturno di malaugurio il cui verso, udito presso una casa, annuncia sciagura imminente: gli antichi la temevano al punto da inchiodare rami di biancospino alle porte per tenerla lontana.",
  "Golem": "Nella leggenda ebraica praghese, il Golem è un guardiano d'argilla animato tramite una parola sacra iscritta sulla fronte o infilata sotto la lingua: obbedisce fedelmente al proprio creatore, ma la leggenda ammonisce sui pericoli di un potere che sfugge al controllo.",
  "Amarok": "Lupo gigante della tradizione Inuit, molto più grande di un lupo comune: si narra cacci da solo nella notte artica chi si allontana imprudentemente dal proprio villaggio.",
  "Cadejo": "Cane spettrale nero dagli occhi rossi del folklore centroamericano, che segue i viandanti solitari lungo i sentieri di notte: la tradizione narra anche di un Cadejo bianco, protettore, che si oppone al suo gemello oscuro.",
  "Kludde": "Spirito mutaforma del folklore fiammingo, spesso in sembianze di cane o lupo nero: lo si riconosce per le scintille e i piccoli fulmini che sprigiona muovendosi, specialmente nelle notti di temporale.",
  "Nanuq": "Spirito dell'orso polare nella tradizione Inuit, rispettato come un pari più che temuto come una bestia: i cacciatori gli rivolgevano riti e scuse rituali prima e dopo la caccia, per non offenderne lo spirito.",
  "Scorpione di Gaia": "Fu Gaia stessa, secondo il mito, a inviare questo scorpione contro il cacciatore Orione, colpevole di essersi vantato di poter uccidere ogni bestia della Terra: entrambi furono infine posti in cielo come costellazioni opposte.<br><br><b>Il mito completo:</b> Orione, cacciatore leggendario di forza sovrumana, si vantò pubblicamente di poter uccidere ogni singola creatura vivente sulla Terra — un'affermazione di tracotanza (hybris) che allarmò profondamente Gaia, la Terra stessa, madre di ogni essere vivente. Per punire questa arroganza e proteggere le proprie creature, Gaia generò uno scorpione dal veleno letale e lo inviò contro il cacciatore, che morì per la sua puntura nonostante tutta la propria forza. Zeus pose entrambi tra le stelle come monito eterno, ma posizionandoli su lati opposti del cielo, in modo che non sorgessero mai contemporaneamente: quando la costellazione dello Scorpione sorge a est, quella di Orione tramonta a ovest, come se il cacciatore fuggisse ancora in eterno dal proprio nemico.<br><br><b>Contesto culturale:</b> Questo mito rappresenta un classico esempio greco della hybris punita da una forza primordiale — non un dio olimpico, ma Gaia stessa, la Terra, a intervenire contro chi minaccia l'equilibrio naturale del mondo con la propria arroganza.<br><br><b>Curiosità:</b> Il posizionamento astronomico reale delle costellazioni di Orione e dello Scorpione riflette esattamente questo dettaglio mitologico: le due costellazioni non sono mai visibili contemporaneamente nel cielo notturno, un fenomeno astronomico genuino che i Greci antichi avevano osservato con precisione e incorporato direttamente nel proprio racconto mitologico.",
  "Onibi": "Fuoco fatuo della tradizione yokai giapponese, una fiammella azzurrognola che fluttua nelle paludi e nei boschi di notte: si diceva fosse generata dal risentimento di animali o persone morte in circostanze infelici.",
  "Näkki": "Spirito d'acqua pericoloso del folklore finlandese, che si cela in laghi e fiumi in attesa di trascinare sott'acqua chi si avvicina troppo alla riva, specialmente i bambini incauti.",
  "Vargr": "Nella lingua norrena antica, questo era il vero nome dei grandi lupi selvaggi e fuorilegge: il termine stesso finì per indicare chiunque fosse bandito dalla società, cacciato al pari di una bestia.",
  "Yeti": "L'Uomo delle Nevi dell'Himalaya, avvistato ma mai catturato da generazioni di scalatori e abitanti locali: le popolazioni sherpa lo considerano un guardiano delle vette più alte e sacre.",
  "Baku": "Creatura ibrida della tradizione giapponese capace di divorare gli incubi altrui: si dice che chiamarlo per nome dopo un brutto sogno lo induca a inghiottirlo, liberando chi lo ha sognato dall'angoscia.",
  "Tarasque": "Drago-tartaruga corazzato che terrorizzava la Provenza francese, finché non fu placato non con la forza ma con la gentilezza di Santa Marta, che lo condusse mansueto fino alla città che oggi porta il suo nome, Tarascona.",
  "Simurgh": "Uccello sapiente e antichissimo della mitologia persiana, testimone della distruzione e rinascita del mondo per tre volte: nell'epica iraniana alleva l'eroe abbandonato Zal, trasmettendogli parte della propria saggezza.",
  "Cinghiale d'Erimanto (cucciolo)": "Versione giovane del cinghiale gigantesco che devastava il monte Erimanto: la sua forma adulta sarebbe stata la Quarta Fatica di Eracle, che lo catturò vivo intrappolandolo nella neve profonda.<br><br><b>Il mito completo:</b> Ancora prima di raggiungere le dimensioni mostruose che lo resero celebre, questo cinghiale già terrorizzava le pendici del monte Erimanto in Arcadia, distruggendo raccolti e minacciando i pastori della regione. Fu proprio durante il tragitto verso questa impresa che Eracle, secondo Apollodoro, si fermò a far visita al centauro Folo, un episodio che degenerò in uno scontro violento con altri centauri attirati dall'odore del vino sacro aperto per l'occasione — durante il quale Eracle ferì accidentalmente anche il saggio Chirone con una delle sue frecce avvelenate dal sangue dell'Idra, la stessa ferita che secondo il mito lo avrebbe poi condotto a scambiare la propria immortalità con Prometeo.<br><br><b>Contesto culturale:</b> L'episodio del cinghiale è tra i pochi delle dodici fatiche a intrecciarsi direttamente con un altro mito importante (quello di Chirone), dimostrando come le imprese di Eracle non fossero racconti isolati ma nodi di una rete narrativa greca più ampia e interconnessa.<br><br><b>Curiosità:</b> La cattura finale del cinghiale, quando ormai adulto, avvenne intrappolandolo nella neve alta fino a sfinirlo — un dettaglio pratico e quasi realistico di tecnica venatoria che contrasta con la natura fantastica della creatura stessa, rendendo questa fatica una delle più \"credibili\" dal punto di vista della caccia reale tra tutte le dodici imprese di Eracle.",
  "Kitsune Giovane": "Giovane volpe della tradizione giapponese, non ancora abbastanza antica da aver sviluppato le nove code delle Kitsune più potenti: già capace di piccoli incantesimi e di confondere lievemente chi le si avvicina.",
  "Encantado": "Spirito fluviale della tradizione amazzonica, capace di trasformarsi da delfino rosa a splendido essere umano durante le feste notturne: si narra seduca i presenti per poi ricondurli con sé nella città sommersa dell'Encante.",
  "Makara": "Creatura ibrida acquatica della mitologia indiana, per metà coccodrillo e per metà pesce o elefante: funge da cavalcatura per la dea del fiume Gange e per Varuna, signore delle acque.",

  "Leone di Nemea Invulnerabile": "Nella sua forma piena, la pelle del Leone di Nemea non poteva essere scalfita da nessuna lama forgiata dagli uomini: Eracle dovette strangolarlo a mani nude, e solo gli artigli della bestia stessa riuscirono infine a scuoiarla.<br><br><b>Il mito completo:</b> Inviato da Era (o nato dalla Luna stessa, secondo altre tradizioni) a terrorizzare la valle di Nemea, il leone aveva una pelle impenetrabile a qualunque arma forgiata da mani mortali: frecce e spade rimbalzavano inutilmente. Eracle, resosi conto che le armi non servivano a nulla, lo braccò nella sua tana, che aveva due ingressi: ne bloccò uno e lo affrontò a mani nude nell'altro, strangolandolo in una lotta corpo a corpo disperata. Scoperto poi che nemmeno i coltelli comuni riuscivano a incidere la pelliccia, fu costretto a usare uno degli artigli stessi della bestia per scuoiarla.<br><br><b>Contesto culturale:</b> Il mantello di pelle leonina (la leontē) divenne l'attributo visivo più iconico di Eracle nell'arte greca e romana, riconoscibile all'istante su migliaia di vasi, statue e monete, spesso indossato come cappuccio con la testa del leone sopra quella dell'eroe. Simboleggiava la sua trasformazione: non si limita a sconfiggere la belva, ne indossa il potere come proprio.<br><br><b>Curiosità:</b> Nemea, teatro di questa fatica, ospitava i Giochi Nemei, uno dei quattro grandi festival atletici panellenici (insieme a Olimpia, Delfi e Istmia) — fondati, secondo la tradizione, proprio in memoria della vittoria di Eracle sul leone, rendendo questo mito uno dei pochissimi legati direttamente a un'istituzione sportiva storicamente documentata.",
  "Idra di Lerna Immortale": "La vera Idra di Lerna non è soltanto una bestia dalle molte teste, ma un essere la cui testa centrale è letteralmente immortale: Eracle poté solo seppellirla per sempre sotto un masso, l'unico modo per neutralizzare ciò che non può essere ucciso.<br><br><b>Il mito completo:</b> Mentre le altre teste dell'Idra erano mortali, la testa centrale non poteva essere uccisa in alcun modo, nemmeno dalla forza sovrumana di Eracle. Dopo aver reciso e cauterizzato tutte le altre teste con l'aiuto di Iolao, Eracle staccò anche quella immortale — ma non riuscì a distruggerla nemmeno separata dal corpo. Non gli restò che seppellirla per sempre sotto un macigno enorme, lungo la sacra via presso Lerna, un luogo che il viaggiatore greco Pausania, secoli più tardi, affermò di aver visitato personalmente, indicato ancora dagli abitanti del luogo.<br><br><b>Contesto culturale:</b> La testa immortale rappresenta un estremo filosofico tipicamente greco: non tutto ciò che è mostruoso può essere distrutto, solo contenuto e neutralizzato — uno dei rari casi in cui il trionfo di un eroe greco non è un annientamento totale, ma un'eterna prigionia, echeggiando il destino dei Titani rinchiusi nel Tartaro.<br><br><b>Curiosità:</b> Pausania, scrivendo secoli dopo la nascita del mito, sostenne di aver visto con i propri occhi il luogo presso Lerna dove gli abitanti indicavano la roccia sotto cui si diceva giacesse ancora la testa immortale — un esempio notevole di come le comunità greche ancorassero fisicamente i propri miti alla geografia reale, mescolando leggenda e turismo ante litteram.",
  "Linnormr": "Nella sua forma adulta e compiuta, il Linnormr norreno è un serpente-drago privo di zampe e ali che si muove sinuoso tra le acque e le rocce: la sua sola presenza in una regione bastava a far evacuare interi villaggi costieri.<br><br><b>Il mito completo:</b> A differenza dei draghi alati dell'Europa occidentale, il Linnormr è specificamente privo di ali e zampe, muovendosi in modo serpentino, quasi anguilliforme — questa tradizione visiva distinta lo lega strettamente al folklore norreno autentico su serpenti marini e mostri lacustri segnalati lungo le coste e i fiordi scandinavi per secoli, sfumando il confine tra drago puramente mitologico e \"avvistamento\" quasi da mostro reale. Jörmungandr, il Serpente di Midgard che cinge il mondo intero e affronterà Thor al Ragnarök, è tecnicamente l'esempio più celebre di questo archetipo di Linnormr portato a scala cosmica.<br><br><b>Contesto culturale:</b> Il tipo del Linnormr riflette una tradizione draconica nordeuropea genuinamente distinta, separata e precedente rispetto al drago sputafuoco, accumulatore di tesori, dotato di quattro zampe e ali che divenne dominante nell'immaginario fantasy medievale successivo (influenzato più dalla tradizione letteraria continentale europea).<br><br><b>Curiosità:</b> Numerosi laghi scandinavi conservano ancora oggi leggende locali di \"Linnormr\" o mostri serpentiformi legate specificamente a loro (il lago norvegese di Seljord ha una propria tradizione documentata del mostro \"Selma\") — una continuazione folkloristica diretta e ancora viva di questo antico archetipo draconico norreno fino al folklore regionale moderno.",

  "Fafnir": "Un tempo nano, Fafnir fu corrotto dall'avidità per un tesoro maledetto fino a trasformarsi lui stesso in drago per custodirlo meglio: la sua fine per mano dell'eroe Sigurd, che lo trafisse da sotto mentre strisciava verso l'acqua, è tra le storie più celebri dell'epica norrena.<br><br><b>Il mito completo:</b> L'oro apparteneva in origine al nano Andvari, che lo maledisse dopo esserne stato derubato con la forza da Loki, costretto a pagare un debito di sangue per aver ucciso accidentalmente Otr, un altro figlio di Hreidmar (padre anche di Fafnir). Lo stesso Hreidmar fu poi ucciso dai propri figli Fafnir e Regin per impossessarsi dell'oro; Fafnir, reso folle dall'avidità, scacciò il fratello Regin prendendosi l'intero tesoro, ritirandosi nella brughiera di Gnitaheath e trasformandosi in drago per custodirlo da solo. Regin, cercando vendetta e il tesoro per sé, allevò il giovane Sigurd apposta per uccidere Fafnir, forgiandogli la spada Gram dai frammenti della lama spezzata del padre. Sigurd scavò una fossa lungo il percorso di Fafnir verso l'acqua e lo trafisse da sotto mentre strisciava sopra di lui; poi, seguendo le istruzioni di Regin, arrostì il cuore del drago, assaggiandone per errore il sangue — un gesto che gli donò la capacità di comprendere il linguaggio degli uccelli, i quali lo avvertirono che Regin progettava di tradirlo e ucciderlo a sua volta, spingendo Sigurd a colpire per primo.<br><br><b>Contesto culturale:</b> Questo racconto dell'oro maledetto (l'anello di Andvari, la trasformazione di Fafnir spinta dall'avidità) è considerato una delle fonti mitiche dirette a cui J.R.R. Tolkien attinse sia per il drago Smaug sia per il potere corruttore dell'Unico Anello nel Signore degli Anelli, e ispirò direttamente anche il ciclo operistico dell'Anello del Nibelungo di Wagner.<br><br><b>Curiosità:</b> Il dettaglio specifico dell'assaggio del sangue di drago per comprendere il linguaggio degli uccelli è un motivo ricorrente di \"saggezza attraverso la trasgressione\" presente in molte mitologie; il nome di Fafnir divenne inoltre in seguito, in alcune tradizioni popolari scandinave, un termine generico per indicare qualunque drago accumulatore spinto dall'avidità.",
  "Yamata no Orochi": "Serpente a otto teste e otto code della mitologia giapponese, che pretendeva ogni anno il sacrificio di una fanciulla: il dio Susanoo lo sconfisse ubriacandolo con sakè prima di affrontarlo, trovando nella sua coda la spada sacra Kusanagi.",
  "Tiamat": "Dea primordiale del mare salato nella mitologia mesopotamica, madre di mostri e progenitrice degli dèi stessi: quando si ribellò contro la nuova generazione divina, fu sconfitta da Marduk, che ne divise il corpo per plasmare il cielo e la terra.",
  "Vritra": "Nella tradizione vedica indiana, Vritra è il serpente cosmico che tratteneva tutte le acque del mondo imprigionandole nel proprio corpo: Indra lo sconfisse con il vajra, il fulmine forgiato dagli dèi, liberando finalmente i fiumi per l'umanità.",
  "Quetzalcoatl": "Il Serpente Piumato, una delle divinità più importanti del pantheon azteco e mesoamericano: signore del vento, della conoscenza e della stella del mattino, si narra abbia donato agli uomini il mais e l'arte della scrittura.",
  "Ladone": "Drago dalle cento teste che non dormiva mai, posto a guardia del giardino delle Esperidi e dei suoi pomi d'oro: sconfiggerlo (o aggirarlo con l'inganno, secondo alcune versioni) fu l'undicesima fatica di Eracle.<br><br><b>Il mito completo:</b> Figlio di Tifone ed Echidna (secondo alcune fonti) o di Forco e Ceto (secondo altre), Ladone custodiva il melo dai frutti d'oro che Gaia aveva donato a Era per le sue nozze con Zeus. Per la sua undicesima fatica, Eracle doveva procurarsi quei pomi. La versione più diffusa non lo vede uccidere il drago di persona: si accordò invece con il titano Atlante, che reggeva il cielo sulle spalle e conosceva bene il giardino, essendo padre delle Esperidi. Eracle sostenne temporaneamente il peso del cielo al posto di Atlante, che andò a cogliere i pomi personalmente, per poi essere ingannato dall'eroe e costretto a riprendersi il proprio fardello. In altre versioni, più dirette, Eracle uccise Ladone stesso con una freccia intinta nel sangue dell'Idra. Dopo la sua morte, Era pose il drago tra le stelle come costellazione.<br><br><b>Contesto culturale:</b> Il giardino delle Esperidi, collocato ai confini occidentali del mondo conosciuto, rappresentava per i Greci un vero e proprio paradiso irraggiungibile — lo stesso tema ricorrente del tesoro perfetto e custodito che ritroviamo nel Vello d'Oro. Ladone incarna la vigilanza assoluta ed eterna: non dormiva mai, un dettaglio che sottolinea quanto l'impresa fosse quasi impossibile.<br><br><b>Curiosità:</b> Alcune fonti antiche descrivono Ladone con fino a cento teste, ciascuna capace di parlare con una voce diversa — un parallelo diretto con la descrizione di Tifone stesso, a conferma della loro parentela. La costellazione del Draco, che si snoda tra l'Orsa Maggiore e l'Orsa Minore, fu identificata dagli astronomi antichi proprio con la collocazione eterna di Ladone nel cielo.",
  "Karkinos": "Granchio gigante mandato da Era stessa in soccorso dell'Idra durante lo scontro con Eracle, pizzicandogli un piede per distrarlo dalla battaglia: l'eroe lo schiacciò con un colpo di tallone, ma la dea, riconoscente per la sua fedeltà, lo pose in cielo come costellazione — il Cancro.<br><br><b>Il mito completo:</b> Il ruolo di Karkinos nel mito è breve, quasi comico: pizzicare il piede di Eracle a metà battaglia contro l'Idra, per poi essere schiacciato senza sforzo sotto un tallone. Eppure, nonostante non abbia ottenuto praticamente nulla, Era lo elevò al cielo puramente per gratitudine verso la sua lealtà e la sua disponibilità a combattere una battaglia disperata contro un eroe di gran lunga superiore, indipendentemente dall'esito.<br><br><b>Contesto culturale:</b> La costellazione del Cancro, una delle meno appariscenti dello zodiaco (composta da stelle deboli e poco visibili), ha a lungo lasciato perplessi astronomi e classicisti sul motivo della sua inclusione tra le dodici costellazioni zodiacali — alcuni studiosi suggeriscono che la sua collocazione rifletta più la personale vendetta di Era contro Eracle (premiando chiunque, per quanto inefficacemente, si fosse opposto a lui) che l'effettiva importanza mitologica del granchio.<br><br><b>Curiosità:</b> Il segno astrologico del Cancro, che governa chi è nato sotto di esso (21 giugno–22 luglio nell'astrologia moderna), trae l'intera propria tradizione simbolica da questo episodio mitologico relativamente minore e quasi tragicomico — uno degli esempi più chiari di come un dettaglio mitologico molto piccolo possa generare un'enorme rilevanza culturale duratura attraverso la propria eredità astronomica.",
  "Anzu": "Uccello tempesta dalla testa leonina, nato dalle acque primordiali: rubò le Tavole del Destino dal palazzo di Enlil, scatenando il caos nell'ordine cosmico finché un dio guerriero non lo abbatté per restituirle.",
  "Nue": "Chimera dal grido spettrale — testa di scimmia, corpo di tanuki, zampe di tigre, coda di serpente — che si posava sui tetti imperiali portando malattia e sventura, finché l'arciere Minamoto no Yorimasa non la trafisse nel buio.",
  "Sfinge": "Custode enigmatica delle porte di Tebe, poneva a ogni viandante il celebre indovinello sull'essere che cammina su quattro, due e tre gambe: chi falliva veniva divorato, finché Edipo non trovò la risposta giusta.<br><br><b>Il mito completo:</b> Figlia di Echidna, la Sfinge fu inviata da Era (o da Ares, secondo altre versioni) a tormentare Tebe come punizione per un'antica colpa della città. Si appostò su una rupe fuori dalle mura e a ogni viandante poneva lo stesso indovinello, tramandato dalle Muse: \"Qual è l'essere che al mattino cammina su quattro zampe, a mezzogiorno su due, e alla sera su tre?\" Chi non sapeva rispondere veniva strangolato e divorato all'istante. Edipo, in fuga da Corinto, diede la risposta corretta — l'uomo, che gattona da neonato, cammina eretto da adulto e si appoggia a un bastone da vecchio — e la Sfinge, sconfitta, si gettò dalla rupe togliendosi la vita.<br><br><b>Contesto culturale:</b> A differenza della Sfinge egizia — quasi sempre maschile, benevola, simbolo del potere regale e associata ai faraoni — la Sfinge greca era una figura femminile e mostruosa, corpo di leone, ali d'aquila e volto di donna, incarnazione greca del fascino (e del pericolo) dell'enigma irrisolto. La sua sconfitta per mano di Edipo, che vince grazie alla ragione e non alla forza, rappresenta simbolicamente il trionfo dell'intelletto umano sul caos mostruoso.<br><br><b>Curiosità:</b> Il nome \"Sfinge\" deriva probabilmente dal verbo greco sphíngein, \"strangolare\" — un richiamo diretto al suo modo di uccidere le vittime. Colpisce il netto contrasto di genere tra le due tradizioni: la Sfinge greca è quasi sempre femminile, quella egizia quasi sempre associata a un potere maschile — uno degli esempi più chiari di come una stessa figura mitologica possa assumere connotazioni morali e simboliche opposte passando da una cultura vicina a un'altra.",
  "Rakshasa": "Demoni mutaforma della tradizione indiana, un tempo esseri nobili corrotti dall'orgoglio: vagano di notte tra le foreste, capaci di assumere qualsiasi aspetto per ingannare mortali e asceti.",
  "Wendigo": "Spirito insaziabile dei boschi innevati dei popoli algonquini, incarnazione della fame e dell'inverno: si narra che chiunque ceda alla disperazione e al cannibalismo rischi di trasformarsi lui stesso in uno di essi.",
  "Manticora": "Bestia persiana dal volto d'uomo, corpo di leone e coda irta di aculei velenosi: divora la preda per intero, ossa comprese, senza lasciare traccia del banchetto.",
  "Peryton": "Cervo alato che proietta, curiosamente, l'ombra di un uomo anziché la propria: le leggende marinaresche lo vogliono cacciatore di naufraghi lungo le coste dell'Atlantico.",
  "Qilin": "Creatura d'auspicio della tradizione cinese, così delicata da non calpestare mai un filo d'erba: la sua apparizione annuncia la nascita o la morte di un grande saggio.",
  "Garuda": "Re di tutti gli uccelli nella mitologia indiana, cavalcatura del dio Vishnu e acerrimo nemico dei serpenti Naga, dai quali liberò la propria madre ridotta in schiavitù.",
  "Ammit": "Divoratrice dei cuori giudicati indegni nella sala del giudizio di Osiride — testa di coccodrillo, corpo di leonessa, zampe posteriori d'ippopotamo — l'incubo di ogni anima egizia in cerca dell'aldilà.",
  "Zmey Gorynych": "Drago slavo a tre teste sputafuoco, terrore delle terre della Rus': solo un eroe capace di reciderle tutte e tre insieme, senza dare tempo alla rigenerazione, poteva sperare di abbatterlo.",
  "Kraken": "Colosso degli abissi scandinavi, così vasto da essere scambiato per un'isola dai marinai incauti che vi gettavano l'ancora: quando si risveglia, trascina intere navi negli abissi con i suoi tentacoli.<br><br><b>Il mito completo:</b> La tradizione del Kraken è in realtà più tarda rispetto al nucleo della mitologia norrena antica propriamente detta — si sviluppa principalmente attraverso il folklore scandinavo medievale e della prima età moderna, e la sua descrizione più dettagliata si deve al vescovo norvegese Erik Pontoppidan nella sua \"Storia Naturale della Norvegia\" del 1755, dove lo descrive con sorprendente serietà scientifica come una creatura marina reale, seppur raramente avvistata, corredando il racconto di presunte testimonianze di pescatori su pesche improvvisamente abbondanti attribuite proprio al risveglio del Kraken dagli abissi.<br><br><b>Contesto culturale:</b> A differenza della maggior parte dei mostri puramente mitologici, il Kraken occupa uno spazio unico tra folklore e primi tentativi di criptozoologia e storia naturale — naturalisti del XVIII secolo presero sul serio i racconti al punto da discuterne la plausibilità biologica, probabilmente influenzati da incontri reali, seppur esagerati, dei marinai con veri calamari giganti, la cui esistenza non fu confermata scientificamente che molto più tardi.<br><br><b>Curiosità:</b> Il Kraken ispirò direttamente la celebre poesia \"The Kraken\" di Alfred Lord Tennyson del 1830 e divenne in seguito uno degli archetipi mostruosi più duraturi della cultura popolare moderna (film, videogiochi), rendendolo uno dei rari casi in cui la fama moderna di una figura mitologica di area norrena supera di gran lunga il suo ruolo relativamente modesto nell'autentica tradizione testuale norrena medievale.",
  "Behemoth": "Bestia primordiale di terra descritta nel Libro di Giobbe, dalla forza incontenibile e le ossa come sbarre di bronzo: creata il quinto giorno insieme al suo contraltare marino, il Leviatano.",
  "Bahamut": "Pesce colossale della cosmologia islamica, così immenso che nessun occhio mortale può abbracciarne l'intera forma: sul suo dorso poggia un toro, e sul toro l'intera Terra.",
  "Cipactli": "Mostro primordiale dalla forma di coccodrillo-pesce, che nuotava solitario nelle acque prima della creazione: gli dèi aztechi lo smembrarono per plasmare cielo e terra dal suo corpo.",
  "Grendel": "Orrore delle paludi che per dodici anni terrorizzò la sala di Heorot, divorando i guerrieri danesi nel sonno, finché l'eroe Beowulf non gli strappò il braccio a mani nude.",
  "Typhon": "Il più mostruoso tra i figli di Gaia, cento teste di drago sulle spalle e fuoco negli occhi: sfidò Zeus per il trono dell'Olimpo, e solo il fulmine del re degli dèi riuscì infine a seppellirlo sotto l'Etna.<br><br><b>Il mito completo:</b> Figlio di Gaia e Tartaro, generato appositamente dalla Terra per vendicare la sconfitta dei Titani contro gli Olimpi, Tifone fu descritto da Esiodo come dotato di cento teste di serpente, occhi di fuoco e una voce capace di imitare qualunque suono. Si unì a Echidna, generando insieme a lei quasi tutti i grandi mostri della mitologia greca: Cerbero, l'Idra, la Chimera, la Sfinge, Ladone, Orto. Quando attaccò l'Olimpo, la sua potenza fu tale che gli altri dèi fuggirono terrorizzati fino in Egitto, trasformandosi in animali per nascondersi — un mito che gli scrittori greci successivi usarono per spiegare le divinità egizie dalla testa animale. Zeus alla fine lo sconfisse in una battaglia epica, colpendolo ripetutamente con i fulmini, e lo seppellì sotto il monte Etna in Sicilia: la sua perenne attività vulcanica veniva attribuita ai movimenti di Tifone ancora intrappolato sotto la montagna.<br><br><b>Contesto culturale:</b> Tifone rappresentava la minaccia ultima al kosmos, l'ordine cosmico stesso — il momento più vicino, in tutta la mitologia greca, a un vero pericolo esistenziale per gli dèi. La sua sconfitta consolidò definitivamente il regno incontrastato di Zeus come sovrano del cosmo.<br><br><b>Curiosità:</b> La parola inglese \"typhoon\" (e l'italiano \"tifone\") derivano quasi certamente dal nome di Tifone, attraverso il persiano e l'arabo prima di tornare in greco — una delle eredità linguistiche più chiare della mitologia greca dei mostri, sopravvissuta nel linguaggio quotidiano moderno per descrivere esattamente il tipo di potenza caotica che gli antichi Greci attribuivano a Tifone.",
  "Fenrir": "Lupo gigante figlio di Loki, incatenato dagli dèi con un laccio magico forgiato dai nani: le profezie lo vogliono libero al Ragnarök, destinato a divorare Odino stesso nello scontro finale.<br><br><b>Il mito completo:</b> Gli dèi, temendo le profezie sul ruolo distruttivo di Fenrir, lo allevarono tra loro ma divennero sempre più diffidenti verso la sua crescita rapida e la sua forza. Tentarono di legarlo due volte con catene ordinarie, che egli spezzò senza sforzo entrambe le volte (lasciandolo fare, lodandone pubblicamente la forza, per mascherare la propria paura). Infine i nani forgiarono Gleipnir, un legaccio magico fatto di sei ingredienti impossibili — il rumore dei passi di un gatto, la barba di una donna, le radici di una montagna, i tendini di un orso, il respiro di un pesce e la saliva di un uccello — apparentemente un sottile nastro di seta, ma indistruttibile. Fenrir, sospettoso di un legaccio dall'aspetto così fragile, accettò di farsi legare solo a condizione che un dio mettesse una mano nella sua bocca come garanzia di buona fede: solo Tyr, dio della legge e del coraggio, si offrì volontario. Quando Fenrir scoprì di non potersi liberare, morse via la mano di Tyr per vendetta — spiegando così l'iconica menomazione del dio nell'iconografia norrena. Fenrir resterà legato fino al Ragnarök, quando si libererà, ucciderà Odino inghiottendolo intero, e sarà a sua volta ucciso dal figlio di Odino, Víðarr, che gli squarcia le fauci.<br><br><b>Contesto culturale:</b> L'incatenamento di Fenrir, e in particolare il sacrificio di Tyr, viene spesso letto come una riflessione sul prezzo del mantenimento dell'ordine cosmico e sociale — la vera legge e il rispetto dei giuramenti (dominio di Tyr) richiedono un sacrificio autentico e non possono essere ottenuti solo con l'inganno, senza un costo reale.<br><br><b>Curiosità:</b> La parola \"fenrisulfr\" (\"lupo di Fenrir\") ha dato il nome a numerosi riferimenti culturali moderni, e il dettaglio specifico dei sei ingredienti impossibili di Gleipnir è un motivo ricorrente che gli studiosi collegano a schemi diffusi di folklore sulla \"prova impossibile\" presenti in molte mitologie del mondo, non esclusivi della tradizione norrena.",
  "Sekhmet": "Dea leonessa della guerra e della peste, inviata da Ra a punire l'umanità ribelle: la sua sete di sangue fu placata solo con l'inganno, facendole bere birra tinta di rosso al posto del sangue umano.",
  "Apophis": "Il grande serpente del caos, nemico eterno di Ra: ogni notte attende la barca solare nelle acque del Duat, e ogni notte gli dèi devono respingerlo perché l'alba possa sorgere ancora.",
  "Taotie": "Volto vorace scolpito sugli antichi bronzi rituali cinesi, simbolo di un'ingordigia così grande da essere condannato a divorare persino se stesso.",
  "Tengu": "Spirito alato dei monti giapponesi, maestro di arti marziali e maestro dell'inganno, temuto e rispettato allo stesso tempo dai monaci delle vette.",
  "Vila": "Ninfa dei boschi e dei venti dei Balcani, danzatrice leggiadra capace di scatenare tempeste contro chi ne turba la quiete notturna.",
  "Púca": "Spirito mutaforma delle campagne irlandesi, capace di assumere le sembianze di cavallo, capra o coniglio per guidare i viandanti fuori strada — mai per vera cattiveria, solo per gioco.",
  "Iku-Turso": "Mostro marino dai mille tentacoli del Kalevala finlandese, generato dalle profondità gelide del Mar Baltico.",
  "Aitvaras": "Drago domestico delle case lituane che porta fortuna e ricchezza a chi lo ospita, ma pretende in cambio un uovo nero da mangiare ogni notte.",
  "Cacus": "Gigante sputafuoco che viveva in una caverna sull'Aventino, sconfitto da Ercole dopo aver rubato parte del suo bestiame e nascosto le tracce all'incontrario.",
  "Zipacna": "Gigante del Popol Vuh maya capace di sollevare intere montagne in una sola notte, sconfitto con l'astuzia dagli eroi gemelli Hunahpú e Ixbalanqué.",
  "Xolotl": "Dio-sciacallo azteco, gemello di Quetzalcoatl, guida delle anime nel pericoloso viaggio verso il Mictlan, il regno dei morti.",
  "Curupira": "Guardiano della foresta amazzonica dai piedi rivolti all'indietro, per confondere chi tenta di seguirne le tracce e proteggere gli alberi dai cacciatori avidi.",
  "Muldjewangk": "Creatura del fiume Murray custodita nei racconti aborigeni australiani, che trascina sott'acqua chi si avvicina troppo incautamente alla riva.",
  "Qalupalik": "Spirito marino artico dalla pelle verdastra che, nelle leggende Inuit, rapisce nella sua amauti i bambini troppo audaci sul ghiaccio sottile.",
  "Amaru": "Serpente-drago sacro delle Ande, ponte mitico tra il mondo sotterraneo e quello celeste nella cosmologia Inca.",
  "Melusine": "Fata dalla coda di serpente delle leggende francesi, capostipite di una nobile casata finché il suo segreto non fu scoperto e svelato dal marito.",
  "Nidhogg": "Drago scandinavo che rode incessantemente le radici di Yggdrasil, l'albero cosmico che sostiene i nove mondi della mitologia norrena.<br><br><b>Il mito completo:</b> Nidhogg rode eternamente una delle tre radici di Yggdrasil, in particolare quella che si estende nel Niflheim, il regno primordiale di ghiaccio e nebbia; si dice che si nutra dei cadaveri di spergiuri, assassini e adulteri a Náströnd (\"la riva dei cadaveri\"), una sala dell'oltretomba riservata ai peggiori colpevoli. Mantiene una lunga e amara faida verbale con l'aquila senza nome appollaiata in cima a Yggdrasil, con gli insulti trasmessi avanti e indietro dallo scoiattolo Ratatoskr, che corre incessantemente su e giù per il tronco dell'albero proprio per alimentare il conflitto tra i due.<br><br><b>Contesto culturale:</b> Nidhogg rappresenta l'entropia e il decadimento che rodono eternamente le stesse fondamenta dell'ordine cosmico — nemmeno l'albero del mondo che sostiene tutti e nove i regni è al sicuro da una corrosione costante, riflettendo la visione cosmologica norrena più ampia secondo cui persino l'ordine attuale è temporaneo e destinato al crollo finale al Ragnarök.<br><br><b>Curiosità:</b> Il ruolo dello scoiattolo Ratatoskr come pettegolo malevolo, appositamente concepito per provocare conflitto tra Nidhogg e l'aquila, è uno dei dettagli più oscuramente comici della mitologia norrena — una piccola creatura apparentemente insignificante che lavora attivamente per peggiorare una faida cosmica già antica, a quanto pare per il puro divertimento del caos stesso.",
  "Zahhak": "Re persiano maledetto con due serpenti nati dalle sue stesse spalle, che pretendono ogni giorno il cervello di due giovani per essere placati.",
  "Yurlunggur": "Il grande Serpente Arcobaleno delle terre di Arnhem, creatore dei fiumi e delle piogge nella tradizione aborigena australiana, custode della vita stessa.",
  "Tlaltecuhtli": "Mostruosa divinità azteca della terra, smembrata dagli dèi per dare forma al cielo e al mondo dal suo stesso corpo.",
  "Rahu": "Testa demoniaca decapitata della mitologia indiana, che insegue eternamente Sole e Luna attraverso il cielo, causando le eclissi ogni volta che li raggiunge.",
  "Baba Yaga": "Strega delle foreste slave che vive in una capanna su zampe di gallina, custode della soglia tra il mondo dei vivi e quello degli spiriti.",
  "Anansi": "Ragno astuto delle tradizioni Akan dell'Africa occidentale, portatore di tutte le storie del mondo: le conquistò con l'inganno agli dèi stessi.",
  "Tikbalang": "Creatura filippina dalla testa equina e le gambe lunghissime, che confonde i viandanti nella giungla fino a farli tornare al punto di partenza.",
  "Impundulu": "Uccello del fulmine delle tradizioni zulu, il cui battito d'ali scatena tempeste e il cui becco d'argento porta malattia a chi lo caccia.",
  "Menehune": "Piccolo popolo delle foreste hawaiiane, costruttori instancabili capaci di erigere templi e canali in una sola notte, prima dell'alba.",
  "Dokkaebi": "Spirito dispettoso del folklore coreano, dal singolo corno e dal bastone magico, che sfida i viandanti a duelli di lotta e indovinelli.",
  "Alux": "Piccolo spirito custode dei campi maya, benevolo con chi lo rispetta, dispettoso e pungente con chi calpesta la sua terra senza chiedere permesso.",
  "Tomte": "Spirito domestico delle fattorie scandinave, minuto e barbuto, che veglia sul bestiame e sui raccolti purché riceva ogni Natale la sua ciotola di porridge.",
  "Adaro": "Spirito marino delle Isole Salomone, nato dall'arcobaleno, che cavalca gli squali e scaglia pesci volanti come lance contro chi disturba le sue acque.",
  "Boggart": "Spirito dispettoso delle case e delle fattorie inglesi, capace di far inacidire il latte e nascondere gli attrezzi, finché non gli si dà un nome.",
  "Sarimanok": "Uccello leggendario delle Filippine dalle piume sgargianti e le ali screziate, simbolo di buona fortuna per chi lo scorge in volo all'alba.",
  "Aswang": "Mutaforma delle isole filippine, capace di assumere sembianze umane di giorno e cacciare come belva feroce nelle notti di luna piena.",
  "Nekomata": "Gatto giapponese che, invecchiando, sviluppa una seconda coda e poteri sovrannaturali, capace di controllare i morti come marionette.",
  "Tokoloshe": "Spirito dispettoso e velenoso delle tradizioni zulu, piccolo e peloso, capace di rendersi invisibile bevendo acqua e di seminare disgrazie nelle notti buie.",
  "Kupua": "Essere mutaforma delle leggende hawaiiane, capace di passare dalla forma umana a quella animale, spesso guardiano di una particolare vallata o baia.",
  "Grootslang": "Ibrido colossale tra elefante e serpente delle leggende sudafricane, custode di caverne piene di diamanti, così potente che gli dèi stessi lo divisero in due per paura.",
  "Nuckelavee": "Demone marino delle Isole Orcadi dalla pelle scorticata e il fiato pestilenziale, cavaliere senza pelle fuso al suo cavallo altrettanto scorticato.",
  "Gumiho": "Volpe dalle nove code delle leggende coreane, capace di assumere forma umana per ingannare i viandanti e rubarne l'energia vitale.",
  "Migoi": "Nome tibetano dell'uomo delle nevi, spirito solitario delle vette himalayane che i monaci considerano guardiano sacro, non semplice bestia.",
  "Aigamuxa": "Creatura sudafricana dagli occhi posti sui piedi anziché sul volto, costretta a camminare a quattro zampe alla luce del giorno per riuscire a vedere.",
  "Thunderbird": "Uccello immenso delle tradizioni dei popoli nativi d'America, le cui ali battenti generano il tuono e i cui occhi lampeggianti scatenano il fulmine."
};

// Mappa Nome carta -> Numero progressivo (stesso ordine/numerazione del foglio Creature.ods,
// cioè la posizione della carta base nell'archivio CARTE_FISSE). Usata per ordinare il Raccoglitore.
const MAPPA_NUMERI_CARTE = {};
CARTE_FISSE.forEach((c, idx) => { MAPPA_NUMERI_CARTE[c.nome] = idx + 1; });
function numeroCarta(carta) {
  return MAPPA_NUMERI_CARTE[carta.nome] || 9999;
}

// Etichette e classi CSS di rarità, riusate per il badge colorato nel Raccoglitore
const ETICHETTE_LIVELLI = { 1: "Comune", 2: "Non Comune", 3: "Rara", 4: "Epica", 5: "Mitica", 6: "Leggendaria" };
const CLASSI_LIVELLI = { 1: "comuni", 2: "non-comuni", 3: "rare", 4: "epiche", 5: "mitiche", 6: "leggendarie" };

// Pesca una carta fissa del livello richiesto; se quel livello non ha ancora carte disponibili,
// ripiega temporaneamente sul livello comune (finché non aggiungiamo altre immagini)
function pescaCartaFissa(lvlRichiesto) {
  let pool = CARTE_FISSE.filter(c => c.livello === lvlRichiesto);
  if (pool.length === 0) pool = CARTE_FISSE.filter(c => c.livello === 1);
  return pool[Math.floor(Math.random() * pool.length)];
}

// Una carta ha immagine "fissa" (file reale) quando il campo immagine è un percorso e non un'emoji
// Pesca una carta fissa del livello richiesto; se quel livello non ha ancora carte disponibili,
// ripiega temporaneamente sul livello comune (finché non aggiungiamo altre immagini)
function pescaCartaFissa(lvlRichiesto) {
  let pool = CARTE_FISSE.filter(c => c.livello === lvlRichiesto);
  if (pool.length === 0) pool = CARTE_FISSE.filter(c => c.livello === 1);
  return pool[Math.floor(Math.random() * pool.length)];
}

// Per i menu a tendina (testo semplice, non possono contenere immagini): un'iconcina generica al posto del percorso file
function iconaCartaTesto(carta) {
  return haImmagineFile(carta) ? "🎴" : carta.immagine;
}

// Per le mini-anteprime HTML (defense-row, riepiloghi duello, ecc.): immagine vera se disponibile, altrimenti emoji
// Le carte con almeno 1 stella hanno un bordo colorato permanente (vedi STELLA_COLORI_EVO) per riconoscere il grado a colpo d'occhio
function miniImmagineCarta(carta, px) {
  px = px || 28;
  const bordoStella = (carta.stelle > 0 && typeof STELLA_COLORI_EVO !== "undefined")
    ? `border:2px solid ${STELLA_COLORI_EVO[Math.min(carta.stelle, 8)]}; box-shadow:0 0 5px ${STELLA_COLORI_EVO[Math.min(carta.stelle, 8)]};`
    : "";
  return haImmagineFile(carta)
    ? `<img src="${carta.immagine}" alt="${carta.nome}" style="width:${px}px;height:${px}px;object-fit:cover;border-radius:5px;vertical-align:middle;${bordoStella}">`
    : `<span style="vertical-align:middle;">${carta.immagine}</span>`;
}

function haImmagineFile(carta) {
  return typeof carta.immagine === "string" && carta.immagine.indexOf("img/carte/") === 0;
}

const ETICHETTE_TRATTI = { volo: "Volo", nuoto: "Nuoto", arrampicata: "Arrampicata", equilibrio: "Equilibrio" };

// Mostra la carta a schermo intero: immagine grande in alto, nome, le 4 statistiche, tratti extra
function mostraCelebrazioneRicompensaMondo(info) {

  const vecchia = document.getElementById("celebrazione-mondo-overlay");
  if (vecchia) vecchia.remove();

  const coloriCoriandoli = ["#ffcc66", "#c9a054", "#7ee787", "#8bb8e0", "#e09fae", "#f5f0ff"];
  let coriandoliHTML = "";
  for (let i = 0; i < 40; i++) {
    const angolo = Math.random() * 360;
    const distanza = 120 + Math.random() * 180;
    const ritardo = (Math.random() * 0.4).toFixed(2);
    const colore = coloriCoriandoli[Math.floor(Math.random() * coloriCoriandoli.length)];
    const dx = (Math.cos(angolo * Math.PI / 180) * distanza).toFixed(0);
    const dy = (Math.sin(angolo * Math.PI / 180) * distanza).toFixed(0);
    coriandoliHTML += `<span class="coriandolo" style="--dx:${dx}px; --dy:${dy}px; --ritardo:${ritardo}s; background:${colore};"></span>`;
  }

  const overlay = document.createElement("div");
  overlay.id = "celebrazione-mondo-overlay";
  overlay.className = "celebrazione-overlay";
  overlay.innerHTML = `
    <div class="celebrazione-coriandoli">${coriandoliHTML}</div>
    <div class="celebrazione-box">
      <div class="celebrazione-trofeo">🏆</div>
      <p class="celebrazione-titolo">Settimana Conclusa!</p>
      <p class="celebrazione-sottotitolo">${info.mondoNome}</p>
      <p class="celebrazione-piazzamento">${info.posizione}° posto — ${info.esagoni} esagoni conquistati</p>
      <div class="celebrazione-premio">
        <span>+${info.dracme} Dracme</span>
        ${info.ambra > 0 ? `<span>+${info.ambra} Frammenti d'Ambra</span>` : ""}
        ${info.carte.length > 0 ? `<span>Nuove carte: ${info.carte.join(", ")}</span>` : ""}
      </div>
      <button type="button" id="celebrazione-chiudi-btn" class="events-btn events-btn-main">Continua</button>
    </div>`;

  const contenitore = document.querySelector(".game-wrapper") || document.body;
  contenitore.appendChild(overlay);

  document.getElementById("celebrazione-chiudi-btn").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

}

function mostraCartaFullscreen(carta, opzioniExtra) {
  const vecchia = document.getElementById("card-fullscreen-overlay");
  if (vecchia) vecchia.remove();

  const modalitaBattaglia = opzioniExtra && opzioniExtra.bottoneBattaglia;

  const tratti = carta.tratti || [];
  const trattiHTML = tratti.length
    ? `<div class="fs-card-traits">${tratti.map(t => `<span class="trait-badge">${ETICHETTE_TRATTI[t] || t}</span>`).join("")}</div>`
    : "";

  const bordoStellaFs = (carta.stelle > 0)
    ? `border:3px solid ${STELLA_COLORI_EVO[Math.min(carta.stelle, 8)]}; box-shadow:0 0 12px ${STELLA_COLORI_EVO[Math.min(carta.stelle, 8)]};`
    : "";

  const immagineHTML = haImmagineFile(carta)
    ? `<img src="${carta.immagine}" alt="${carta.nome}" class="fs-card-img" style="${bordoStellaFs}">`
    : `<div class="fs-card-emoji">${carta.immagine}</div>`;

  const raritaBadgeHTML = carta.isJolly ? "" : `<span class="fs-card-rarita-badge ${CLASSI_LIVELLI[carta.livello] || ''}">${ETICHETTE_LIVELLI[carta.livello] || ''}</span>`;

  const stelleHTML = carta.isJolly ? "" : `<div class="fs-card-stelle">${"★".repeat(carta.stelle || 0)}${"☆".repeat(Math.max(0, 8 - (carta.stelle || 0)))}</div>`;

  const prezzoVendita = carta.isJolly ? 10 : carta.livello * 15;

  const pctVigoreFs = calcolaVigorePercentuale(carta);
  let bottoneEvolviFsHTML;
  if (carta.isJolly) {
    bottoneEvolviFsHTML = `<button type="button" class="attack-btn" style="background:#4a5568; cursor:not-allowed; width:100%;" disabled>Solo per Sacrifici</button>`;
  } else if (carta.stelle >= 8) {
    bottoneEvolviFsHTML = `<button type="button" class="attack-btn" style="background:#4a5568; cursor:not-allowed; width:100%;" disabled>Evoluzione Max</button>`;
  } else if (carta.occupataInDifesa) {
    bottoneEvolviFsHTML = `<button type="button" class="attack-btn" style="background:#4a5568; cursor:not-allowed; width:100%;" disabled>Impegnata in Difesa</button>`;
  } else if (carta.bloccataInDuello) {
    bottoneEvolviFsHTML = `<button type="button" class="attack-btn" style="background:#4a5568; cursor:not-allowed; width:100%;" disabled>Impegnata in un Duello</button>`;
  } else if (pctVigoreFs <= 0) {
    bottoneEvolviFsHTML = `<button type="button" class="attack-btn" style="background:#4a5568; cursor:not-allowed; width:100%;" disabled>Esausta</button>`;
  } else {
    bottoneEvolviFsHTML = `<button type="button" class="attack-btn" id="fs-card-evolvi-btn" style="background:linear-gradient(to bottom, #2f855a, #22543d); border-color:#22543d; width:100%;">Evolvi (Migliora)</button>`;
  }

  let bottoneAzioneHTML;
  if (modalitaBattaglia) {
    bottoneAzioneHTML = `<div style="display:flex; gap:8px; margin-top:14px;">
      <div style="flex:1;">${bottoneEvolviFsHTML}</div>
      <button type="button" class="attack-btn fs-card-vendi" id="fs-card-battaglia-btn" style="flex:1; margin-top:0; background:linear-gradient(to bottom, #b7791f, #8a5b12); border-color:#8a5b12;">⚔️ Vai in Battaglia</button>
    </div>`;
  } else {
    bottoneAzioneHTML = `<div style="display:flex; gap:8px; margin-top:14px;">
      <div style="flex:1;">${bottoneEvolviFsHTML}</div>
      <button type="button" class="attack-btn fs-card-vendi" id="fs-card-vendi-btn" style="flex:1; margin-top:0;">Vendi (${prezzoVendita} 🪙)</button>
    </div>`;
  }

  const overlay = document.createElement("div");
  overlay.id = "card-fullscreen-overlay";
  overlay.className = "card-fullscreen-overlay";
  overlay.innerHTML = `
    <div class="fs-card-content">
      <button type="button" class="fs-card-close" id="fs-card-close-btn">&times;</button>
      <div class="fs-card-layout">
        <div class="fs-card-left">
          ${immagineHTML}
          ${raritaBadgeHTML}
        </div>
        <div class="fs-card-right">
          <div class="fs-card-nome">${carta.nome}</div>
          ${stelleHTML}
          <div class="fs-card-stats">
            <div class="fs-stat-line"><span class="fs-stat-label">Ferocia</span><span class="fs-stat-val">${carta.statistiche.ferocia}</span></div>
            <div class="fs-stat-line"><span class="fs-stat-label">Balzo</span><span class="fs-stat-val">${carta.statistiche.balzo}</span></div>
            <div class="fs-stat-line"><span class="fs-stat-label">Corazza</span><span class="fs-stat-val">${carta.statistiche.corazza}</span></div>
            <div class="fs-stat-line"><span class="fs-stat-label">Istinto</span><span class="fs-stat-val">${carta.statistiche.istinto}</span></div>
          </div>
          ${trattiHTML}
          ${bottoneAzioneHTML}
        </div>
      </div>
    </div>`;

  const contenitoreRuotato = document.querySelector(".game-wrapper") || document.body;
  contenitoreRuotato.appendChild(overlay);

  document.getElementById("fs-card-close-btn").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

  if (modalitaBattaglia) {
    document.getElementById("fs-card-battaglia-btn").addEventListener("click", () => {
      overlay.remove();
      affrontaGradinoFatiche(carta.id);
    });
  } else {
    document.getElementById("fs-card-vendi-btn").addEventListener("click", () => {
      vendiCarta(carta);
      overlay.remove();
    });
  }

  document.getElementById("fs-card-evolvi-btn")?.addEventListener("click", () => {
    overlay.remove();
    document.querySelectorAll(".modal-overlay:not(.hidden)").forEach(m => { if (m.id !== "evolution-modal") m.classList.add("hidden"); });
    apriFinestraEvoluzione(carta);
  });
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

let slotMassimiDeck = 100;

// Soglia di XP richiesta per salire dal livello N al successivo: cresce sempre (nessun tetto massimo),
// così ogni giocatore può continuare a salire di livello all'infinito, con ogni gradino via via più impegnativo.
function sogliaXpPerLivello(livello) {
  return Math.round(50 * Math.pow(livello, 1.9));
}

  function aggiornaPulsantiLateraliRarita() {

  const conteggi = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  deckGiocatore.forEach(c => { if (conteggi[c.livello] !== undefined) conteggi[c.livello]++; });

 

  const contatoreRaccoglitoreTile = document.getElementById("raccoglitore-tile-counter");

  if (contatoreRaccoglitoreTile) {

    contatoreRaccoglitoreTile.innerText = `${deckGiocatore.length} / ${slotMassimiDeck} carte`;

  }

}

function aggiornaBarraLivelloXP() {

  const elLivelloTesto = document.getElementById("player-level");
  if (elLivelloTesto) elLivelloTesto.innerText = livelloGiocatore;

  const elFill = document.getElementById("level-xp-fill");
  if (elFill) {
    const soglia = sogliaXpPerLivello(livelloGiocatore);
    const percentuale = Math.min(100, (xpAttuali / soglia) * 100);
    elFill.style.width = percentuale + "%";
  }

}

function aggiungiXP(quantita) {

  xpAttuali += quantita;

  let stabileSoglia = sogliaXpPerLivello(livelloGiocatore);

  let passatiLivelli = false;

  let reportLivelliHTML = "";

 

  while (xpAttuali >= stabileSoglia) {

    xpAttuali -= stabileSoglia;

    livelloGiocatore++;

    slotMassimiDeck += 10;

    dracmeAttuali += 1000;

    ambraAttuale += 5;

    passatiLivelli = true;

    stabileSoglia = sogliaXpPerLivello(livelloGiocatore);

    reportLivelliHTML += `<p>Ascensione al <strong>Livello ${livelloGiocatore}</strong>!<br>Bonus: +1000 Dracme | +5 Frammenti d'Ambra | +10 Slot Deck</p><br>`; 

  }

 

  aggiornaBarraLivelloXP();

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

    let ref = pescaCartaFissa(1);

    deckGiocatore.push({

      id: "carta_" + i + "_" + Date.now() + "_" + Math.floor(Math.random()*1000),

      nome: ref.nome, 

      cultura: ref.cultura, 

      tratti: ref.tratti || [], 

      immagine: ref.immagine, 

      livello: 1, 

      stelle: 0,

      statistiche: { ferocia: ref.statisticheFisse.ferocia, balzo: ref.statisticheFisse.balzo, corazza: ref.statisticheFisse.corazza, istinto: ref.statisticheFisse.istinto }, 
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

const SOTTOMONDO_SFONDI = {
  "1": "img/sottomondi/normale.jpg",
  "2": "img/sottomondi/bifase.jpg",
  "3": "img/sottomondi/trifase.jpg",
  "4": "img/sottomondi/nebbia-di-guerra.jpg"
};

const MONDO_SFONDI = {
  "p": "img/mondi/principianti.jpg",
  "i": "img/mondi/intermedio.jpg",
  "e": "img/mondi/esperti.jpg",
  "c": "img/mondi/cultori.jpg",
  "l": "img/mondi/libero.jpg"
};

let mondoSelezionatoCorrente = null;

let livelloVistaSottomondi = "mondi";

function sincronizzaCarteMondiInScadenza(callback) {

  const combinazioni = new Map();

  deckGiocatore.forEach(c => {
    if (c.occupataInDifesa && c.mondoPresidio && c.sottomondoPresidio) {
      const mondoObj = STRUTTURA_MONDI.find(m => m.nome === c.mondoPresidio);
      const subObj = STRUTTURA_SOTTOMONDI.find(s => s.nome === c.sottomondoPresidio);
      if (mondoObj && subObj) {
        const chiave = `${mondoObj.id}_${subObj.id}`;
        if (!combinazioni.has(chiave)) combinazioni.set(chiave, { mondoObj, subObj });
      }
    }
  });

  if (combinazioni.size === 0 || !utenteFirebaseAttuale) { if (callback) callback(); return; }

  const SETTIMANA_MS_SYNC = 3 * 24 * 60 * 60 * 1000;
  const chiavi = Array.from(combinazioni.keys());
  let completate = 0;
  let qualcosaLiberato = false;

  chiavi.forEach(chiave => {
    const { mondoObj, subObj } = combinazioni.get(chiave);

    dbFirebase.ref("mondi_meta/" + chiave).once("value").then(snap => {

      const inizioSettimana = snap.exists() ? snap.val().inizioSettimana : 0;

      if (inizioSettimana && (Date.now() - inizioSettimana >= SETTIMANA_MS_SYNC)) {
        deckGiocatore.forEach(c => {
          if (c.occupataInDifesa && c.mondoPresidio === mondoObj.nome && c.sottomondoPresidio === subObj.nome) {
            c.occupataInDifesa = false; c.coordinatePresidio = null; c.mondoPresidio = null; c.sottomondoPresidio = null;
            qualcosaLiberato = true;
          }
        });
      }

    }).catch((err) => console.error("Errore sincronizzazione carte a presidio:", err)).finally(() => {
      completate++;
      if (completate === chiavi.length) {
        if (qualcosaLiberato) salvaProgressoCloud();
        if (callback) callback();
      }
    });
  });

}

let sottomondoSelezionatoCorrente = null;

let esagonoSelezionatoDati = null;

const RIGHE_MAPPA = 8; 

const COLONNE_MAPPA = 9;

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

function formattaCountdownSettimana(inizioSettimana, durataMs) {

  if (!inizioSettimana) return "--";

  if (!durataMs) durataMs = 7 * 24 * 60 * 60 * 1000;

  let rimasti = inizioSettimana + durataMs - Date.now();

  if (rimasti <= 0) return "In aggiornamento...";

  let giorni = Math.floor(rimasti / (24 * 60 * 60 * 1000));

  let ore = Math.floor((rimasti % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  return `${giorni}g ${ore}h alla fine della settimana`;

}

function aggiornaCountdownMondo() {

  const el = document.getElementById("mondo-countdown-settimana");

  if (el) el.innerText = formattaCountdownSettimana(inizioSettimanaMondoAttuale, 3 * 24 * 60 * 60 * 1000);

}

function aggiornaCountdownGuerra() {

  const el = document.getElementById("guerra-countdown-settimana");

  if (el) el.innerText = formattaCountdownSettimana(inizioSettimanaGuerraAttuale);

}

setInterval(() => {

  aggiornaCountdownMondo();

  aggiornaCountdownGuerra();

}, 60000);

function controllaFineSettimanaMondo(chiaveMappa, vecchiaMappa, callback) {

  dbFirebase.ref("mondi_meta/" + chiaveMappa).once("value").then((snapMeta) => {

    const inizioSettimana = snapMeta.exists() ? snapMeta.val().inizioSettimana : 0;

    const adesso = Date.now();

    const SETTIMANA_MS = 3 * 24 * 60 * 60 * 1000;

    if (!inizioSettimana) {

      dbFirebase.ref("mondi_meta/" + chiaveMappa).set({ inizioSettimana: adesso });

      inizioSettimanaMondoAttuale = adesso;

      dizionarioInizioSettimanaMondo[chiaveMappa] = adesso;

      aggiornaCountdownMondo();

      callback(false);

      return;

    }

    if (adesso - inizioSettimana < SETTIMANA_MS) { inizioSettimanaMondoAttuale = inizioSettimana; dizionarioInizioSettimanaMondo[chiaveMappa] = inizioSettimana; aggiornaCountdownMondo(); callback(false); return; }

    let conteggi = {};

    vecchiaMappa.forEach(riga => riga.forEach(esa => {

      if (esa.conquistato && esa.proprietarioUid) conteggi[esa.proprietarioUid] = (conteggi[esa.proprietarioUid] || 0) + 1;

    }));

    let classifica = Object.keys(conteggi).map(uid => ({ uid, count: conteggi[uid] })).sort((a, b) => b.count - a.count);

    let posizioneMia = classifica.findIndex(c => c.uid === utenteFirebaseAttuale.uid);

    const moltiplicatori = { p: 1, i: 1.5, e: 2, c: 3, l: 4 };

    const cappelloLivelloCartaPerMondo = { p: 1, i: 2, e: 3, c: 4, l: 4 };

    let molt = moltiplicatori[mondoSelezionatoCorrente.id] || 1;

    let livelloCartaPremio = cappelloLivelloCartaPerMondo[mondoSelezionatoCorrente.id] || 1;

    if (posizioneMia >= 0 && classifica[posizioneMia].count > 0) {

      let dracmeBase, ambraBase, cartaBonus, livelloCarteBonus;

      if (posizioneMia === 0) { dracmeBase = 400; ambraBase = 2; cartaBonus = 2; livelloCarteBonus = livelloCartaPremio; }

      else if (posizioneMia === 1) { dracmeBase = 250; ambraBase = 1; cartaBonus = 1; livelloCarteBonus = livelloCartaPremio; }

      else if (posizioneMia === 2) { dracmeBase = 180; ambraBase = 0; cartaBonus = 1; livelloCarteBonus = 1; }

      else { dracmeBase = 150; ambraBase = 0; cartaBonus = 1; livelloCarteBonus = 1; }

      let dracmeVinte = Math.round(dracmeBase * molt);

      // I Frammenti d'Ambra restano una ricompensa esclusiva dei mondi più difficili (Cultori e Libero)
      let mondoDaAmbra = mondoSelezionatoCorrente.id === "c" || mondoSelezionatoCorrente.id === "l";

      let ambraVinta = mondoDaAmbra ? Math.round(ambraBase * molt) : 0;

      dracmeAttuali += dracmeVinte;

      ambraAttuale += ambraVinta;

      let carteVinteNomi = [];

      for (let k = 0; k < cartaBonus; k++) {

        let nuovaCarta = estraiCartaPerLivello(livelloCarteBonus);

        deckGiocatore.push(nuovaCarta);

        carteVinteNomi.push(nuovaCarta.nome);

      }

      document.getElementById("dracme-count").innerText = dracmeAttuali;
      document.getElementById("dracme-count").innerText = dracmeAttuali;

      document.getElementById("ambra-count").innerText = ambraAttuale;

      aggiornaPulsantiLateraliRarita();

      mostraCelebrazioneRicompensaMondo({
        mondoNome: mondoSelezionatoCorrente.nome,
        posizione: posizioneMia + 1,
        esagoni: classifica[posizioneMia].count,
        dracme: dracmeVinte,
        ambra: ambraVinta,
        carte: carteVinteNomi
      });

    }

    deckGiocatore.forEach(c => {

      if (c.occupataInDifesa && c.mondoPresidio === mondoSelezionatoCorrente.nome && c.sottomondoPresidio === sottomondoSelezionatoCorrente.nome) {

        c.occupataInDifesa = false; c.coordinatePresidio = null; c.mondoPresidio = null; c.sottomondoPresidio = null;

      }

    });

    salvaProgressoCloud();

    dbFirebase.ref("mondi_meta/" + chiaveMappa).set({ inizioSettimana: adesso });

    inizioSettimanaMondoAttuale = adesso;

    dizionarioInizioSettimanaMondo[chiaveMappa] = adesso;

    aggiornaCountdownMondo();

    callback(true);

  }).catch((err) => { console.error("Errore controllo settimana mondo:", err); callback(false); });

}

function generaDatiMappaSicura(callback) {

  const poolCaratteristiche = ["ferocia", "balzo", "corazza", "istinto"];

  const chiaveMappa = `${mondoSelezionatoCorrente.id}_${sottomondoSelezionatoCorrente.id}`;

  function impostaStatisticheSettimanali() {

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

  }

  if (dizionarioMappe[chiaveMappa]) {

    mappaMondo = dizionarioMappe[chiaveMappa];

    if (dizionarioInizioSettimanaMondo[chiaveMappa]) {

      inizioSettimanaMondoAttuale = dizionarioInizioSettimanaMondo[chiaveMappa];

      aggiornaCountdownMondo();

    }

    impostaStatisticheSettimanali();

    callback();

    return;

  }

  function generaMappaLocaleFresca() {

    mappaMondo = [];

    for (let r = 0; r < RIGHE_MAPPA; r++) {

      let riga = [];

      for (let c = 0; c < COLONNE_MAPPA; c++) {

        let terrStr = TIPI_TERRENO[Math.floor(Math.random() * TIPI_TERRENO.length)];

        let guard = [];

        for (let g = 0; g < 5; g++) {

          let m = pescaCartaFissa(1);

          guard.push({ nome: m.nome, immagine: m.immagine, statistiche: { ferocia: m.statisticheFisse.ferocia, balzo: m.statisticheFisse.balzo, corazza: m.statisticheFisse.corazza, istinto: m.statisticheFisse.istinto }, tratti: m.tratti || [], isJolly: false });

        }

        riga.push({ riga: r, colonna: c, terrain: terrStr, proprietario: "Nessuno (Mostri Selvatici)", proprietarioUid: null, difesa: guard, conquistato: false });

      }

      mappaMondo.push(riga);

    }

    dizionarioMappe[chiaveMappa] = mappaMondo;

  }

  impostaStatisticheSettimanali();

  if (!utenteFirebaseAttuale) {

    generaMappaLocaleFresca();

    callback();

    return;

  }

  dbFirebase.ref("mondi_reali/" + chiaveMappa).once("value").then((snapshot) => {

    if (snapshot.exists()) {

      let vecchiaMappa = snapshot.val();

      controllaFineSettimanaMondo(chiaveMappa, vecchiaMappa, (finita) => {

        if (finita) {

          generaMappaLocaleFresca();

          dbFirebase.ref("mondi_reali/" + chiaveMappa).set(mappaMondo).catch((err) => console.error("Errore ripubblicazione mappa:", err));

        } else {

          mappaMondo = vecchiaMappa;

          dizionarioMappe[chiaveMappa] = mappaMondo;

        }

        callback();

      });

    } else {

      generaMappaLocaleFresca();

      dbFirebase.ref("mondi_reali/" + chiaveMappa).set(mappaMondo).catch((err) => console.error("Errore pubblicazione mappa:", err));

      dbFirebase.ref("mondi_meta/" + chiaveMappa).set({ inizioSettimana: Date.now() });

      inizioSettimanaMondoAttuale = Date.now();

      dizionarioInizioSettimanaMondo[chiaveMappa] = inizioSettimanaMondoAttuale;

      aggiornaCountdownMondo();

      callback();

    }

  }).catch((err) => {

    console.error("Errore caricamento mappa condivisa:", err);

    generaMappaLocaleFresca();

    callback();

  });

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

    return `<div class="defense-row"><span><strong>${index + 1}°:</strong> ${miniImmagineCarta(mostro)} ${mostro.nome}</span><div class="defense-stats"><span>F: ${mostro.statistiche.ferocia}</span><span>B: ${mostro.statistiche.balzo}</span><span>C: ${mostro.statistiche.corazza}</span><span>I: ${mostro.statistiche.istinto}</span></div></div>`;

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

 

    for (let m = 0; m < 5; m++) {

      let cartaRef = pescaCartaFissa(lvlMazzo);

      mazzoBot.push({

        nome: cartaRef.nome,

        immagine: cartaRef.immagine,

        tratti: cartaRef.tratti || [],

        statistiche: { ferocia: cartaRef.statisticheFisse.ferocia, balzo: cartaRef.statisticheFisse.balzo, corazza: cartaRef.statisticheFisse.corazza, istinto: cartaRef.statisticheFisse.istinto }

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

 

    let eMiaSfida = sfida.creatore.includes("(Tu)");

    let pulsanteAzioneHTML = eMiaSfida

      ? `<button class="attack-btn" id="ritira-duel-${sfida.id}" style="padding:6px; font-size:0.75rem; margin-top:2px; background:linear-gradient(to bottom, #c53030, #9b2c2c); border-color:#742a2a;">Ritira la Sfida</button>`

      : `<button class="attack-btn" id="accept-duel-${sfida.id}" style="padding:6px; font-size:0.75rem; margin-top:2px;">Accetta ed Entra in Arena</button>`;

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

        ${pulsanteAzioneHTML}

      </div>`;

    container.insertAdjacentHTML("beforeend", cardHTML);

    if (eMiaSfida) {

      document.getElementById(`ritira-duel-${sfida.id}`).addEventListener("click", () => {

        ritiraSfida(sfida);

      });

    } else {

      document.getElementById(`accept-duel-${sfida.id}`).addEventListener("click", () => {

        apriPannelloSchieramentoDuello(sfida);

      });

    }

  });

}

function ritiraSfida(sfida) {

  if (!confirm("Vuoi ritirare questa sfida? Le tue 5 carte torneranno libere e le Dracme (e l'eventuale Ambra) scommesse ti verranno restituite.")) return;

  deckGiocatore.forEach(c => {

    if (c.sfidaBloccoId === sfida.id) {

      c.bloccataInDuello = false;

      c.sfidaBloccoId = null;

    }

  });

  if (sfida.reale && utenteFirebaseAttuale) {

    dracmeAttuali += sfida.dracmeQuota;

    if (sfida.tier === "elite") ambraAttuale += sfida.ambraQuota;

    document.getElementById("dracme-count").innerText = dracmeAttuali;

    document.getElementById("ambra-count").innerText = ambraAttuale;

    salvaProgressoCloud();

    dbFirebase.ref("sfide_reali/" + sfida.id).remove().catch((err) => console.error("Errore ritiro sfida:", err));

  }

  listaDuelliBacheca = listaDuelliBacheca.filter(s => s.id !== sfida.id);

  renderizzaBachecaDuelli();

  popolaSelectMazzoDuelli();

  alert("Sfida ritirata. Le tue carte e le risorse scommesse sono di nuovo disponibili.");

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

  let motivoBlocco = "";

  let sceltiMazzo = [];

  for (let i = 0; i < 5; i++) {

    const el = document.getElementById(`duel-slot-${i}`);

    let val = el ? el.value : "";

    if (!val || sceltiMazzo.includes(val)) { valido = false; if (!motivoBlocco) motivoBlocco = "Scegli 5 carte distinte."; }

    else sceltiMazzo.push(val);

  }

  const fase = parseInt(document.getElementById("duel-phase-select").value);

  let statsScelte = [];

  for (let i = 0; i < fase; i++) {

    const el = document.getElementById(`duel-stat-choice-${i}`);

    if (el) {

      let sVal = el.value;

      if (statsScelte.includes(sVal)) { valido = false; if (!motivoBlocco) motivoBlocco = "Le statistiche scelte devono essere diverse tra loro."; }

      else statsScelte.push(sVal);

    }

  }

  const tier = document.getElementById("duel-tier-select").value;

  if (tier === "elite" && haGiocatoEliteOggi) { valido = false; motivoBlocco = "Hai già giocato il tuo Duello d'Elite di oggi."; }

  else if (contatoreDuelliGiornalieri >= 10) { valido = false; motivoBlocco = "Hai raggiunto il limite di 10 duelli (creati+accettati) per oggi. Riprova domani."; }

  btnCrea.disabled = !valido;

  const elMotivo = document.getElementById("duel-crea-motivo-blocco");

  if (elMotivo) elMotivo.innerText = valido ? "" : motivoBlocco;

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

      option.innerText = `${iconaCartaTesto(carta)} ${carta.nome} [ ${vigore}%] F:${carta.statistiche.ferocia} B:${carta.statistiche.balzo} C:${carta.statistiche.corazza} I:${carta.statistiche.istinto}${stringaTratti}`;

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

      option.innerText = `${iconaCartaTesto(carta)} ${carta.nome} [ ${vigore}%] F:${carta.statistiche.ferocia} B:${carta.statistiche.balzo} C:${carta.statistiche.corazza} I:${carta.statistiche.istinto}${stringaTratti}`;

      if (carta.id === currentVal) option.selected = true;

      select.appendChild(option);

    });

    select.removeEventListener("change", gestisciCambioMazzoAccettaDuello);

    select.addEventListener("change", gestisciCambioMazzoAccettaDuello);

  }

  validaMazzoAccettaDuello();

}

function gestisciCambioMazzoAccettaDuello() {

  popolaSelectMazzoAccettaDuello();

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

          <div style="font-size:1.5rem; margin:5px 0;">${miniImmagineCarta(miaC, 40)}</div>

          <div style="font-size:0.75rem; font-weight:bold; color:#fff;">PUNTI: ${mioVFin}</div>

        </div>

        <div class="vs-clash-text" id="vs-text-clash-${roundIndex}">ROUND ${roundIndex+1}</div>

        <div class="mini-card-anim" id="nem-clash-card-${roundIndex}">

          <div style="font-size:0.8rem; font-weight:bold; color:#f56565;">${nemC.nome}</div>

          <div style="font-size:1.5rem; margin:5px 0;">${miniImmagineCarta(nemC, 40)}</div>

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

        deckGiocatore.forEach(c => {

          if (c.sfidaBloccoId === childSnap.key) {

            c.bloccataInDuello = false;

            c.sfidaBloccoId = null;

          }

        });

        salvaProgressoCloud();

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

 

  let nuovaSfidaId = "sfida_utente_" + Date.now();

  let mazzoScelto = [];

  for (let i = 0; i < 5; i++) {

    let cardId = document.getElementById(`duel-slot-${i}`).value;

    let carta = deckGiocatore.find(c => c.id === cardId);

    carta.bloccataInDuello = true;

    carta.sfidaBloccoId = nuovaSfidaId;

    mazzoScelto.push(carta);

  }

 


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

const LIVELLI_AMMESSI_PER_MONDO = {
  "p": [1],
  "i": [1, 2],
  "e": [1, 2, 3],
  "c": [2, 3, 4],
  "l": [1, 2, 3, 4, 5, 6]
};

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

      if (mondoSelezionatoCorrente) {
        const livelliAmmessi = LIVELLI_AMMESSI_PER_MONDO[mondoSelezionatoCorrente.id] || [1, 2, 3, 4, 5, 6];
        if (!livelliAmmessi.includes(carta.livello)) return;
      }

      if (valoriSelezionati.includes(carta.id) && carta.id !== currentVal) return;

 

      const option = document.createElement("option");

      option.value = carta.id; 

      let stringaTratti = carta.tratti && carta.tratti.length > 0 ? ` [${carta.tratti.join(",")}]` : " [Nessuno]";

      option.innerText = `${iconaCartaTesto(carta)} ${carta.nome} [ ${vigore}%] F:${carta.statistiche.ferocia} B:${carta.statistiche.balzo} C:${carta.statistiche.corazza} I:${carta.statistiche.istinto}${stringaTratti}`;

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

    let emojiVisibileNemica = (sottomondoSelezionatoCorrente.id === "4") ? `<span style="vertical-align:middle;">❓</span>` : miniImmagineCarta(mostroNemico, 40);

    let roundCardId = `clash-map-row-${mapRoundIdx}`;

 

    let rLineHTML = `

      <div class="battle-arena-row" id="${roundCardId}">

        <div class="mini-card-anim" id="my-map-card-${mapRoundIdx}">

          <div style="font-size:0.8rem; font-weight:bold; color:#ffcc66;">${miaCarta.nome}</div>

          <div style="font-size:1.5rem; margin:5px 0;">${miniImmagineCarta(miaCarta, 40)}</div>

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

    esagonoSelezionatoDati.proprietarioUid = utenteFirebaseAttuale ? utenteFirebaseAttuale.uid : null;

    mazzoAttaccoSelezionato.forEach(c => {

      c.occupataInDifesa = true; 

      c.coordinatePresidio = `${esagonoSelezionatoDati.riga},${esagonoSelezionatoDati.colonna}`;

      c.mondoPresidio = mondoSelezionatoCorrente.nome; 

      c.sottomondoPresidio = sottomondoSelezionatoCorrente.nome;

    });

    esagonoSelezionatoDati.difesa = mazzoAttaccoSelezionato.map(c => { 

      return { nome: c.nome, immagine: c.immagine, statistiche: c.statistiche, tratti: c.tratti || [], isJolly: false }; 

    });

    if (utenteFirebaseAttuale) {

      const chiaveMappa = `${mondoSelezionatoCorrente.id}_${sottomondoSelezionatoCorrente.id}`;

      dbFirebase.ref(`mondi_reali/${chiaveMappa}/${esagonoSelezionatoDati.riga}/${esagonoSelezionatoDati.colonna}`).set(esagonoSelezionatoDati)

        .catch((err) => console.error("Errore sincronizzazione conquista:", err));

    }

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

const modalGrid = document.getElementById("modal-cards-grid"); 

const modalTitle = document.getElementById("modal-title");

function renderizzaSelezioneMondi() {

  livelloVistaSottomondi = "mondi";

  worldsTitle.innerText = "Seleziona Mondo"; 

  dynamicGrid.innerHTML = "";

  dynamicGrid.classList.add("mondi-riga-singola");

  STRUTTURA_MONDI.forEach(mondo => {

    const btn = document.createElement("button"); 

    btn.className = "mondo-tile"; 

    btn.innerHTML = `<strong class="sub-title">${mondo.nome}</strong><span class="sub-info">${mondo.info}</span>`;

    const sfondoAnteprima = MONDO_SFONDI[mondo.id];
    if (sfondoAnteprima) {
      btn.style.backgroundImage = `linear-gradient(rgba(15,12,8,0.5), rgba(15,12,8,0.78)), url('${sfondoAnteprima}')`;
    }

    btn.addEventListener("click", () => { 

      mondoSelezionatoCorrente = mondo; 

      renderizzaSelezioneSottomondi(); 

    });

    dynamicGrid.appendChild(btn);

  });

}

function renderizzaSelezioneSottomondi() {

  livelloVistaSottomondi = "sottomondi";

  worldsTitle.innerText = "Mondo: " + mondoSelezionatoCorrente.nome; 

  dynamicGrid.innerHTML = "";

  dynamicGrid.classList.remove("mondi-riga-singola");

  STRUTTURA_SOTTOMONDI.forEach(sub => {

    const btn = document.createElement("button"); 

    btn.className = "sottomondo-btn"; 

    btn.innerHTML = `<strong class="sub-title">${sub.nome}</strong><span class="sub-info">${sub.info}</span>`;

    const sfondoAnteprima = SOTTOMONDO_SFONDI[sub.id];
    if (sfondoAnteprima) {
      btn.style.backgroundImage = `linear-gradient(rgba(15,12,8,0.55), rgba(15,12,8,0.72)), url('${sfondoAnteprima}')`;
      btn.style.backgroundSize = "cover";
      btn.style.backgroundPosition = "center";
    }

    btn.addEventListener("click", () => {

      sottomondoSelezionatoCorrente = sub; 

      sottomondiModal.classList.add("hidden"); 

      document.getElementById("map-header-title").innerText = mondoSelezionatoCorrente.nome + " · " + sub.nome;

      generaDatiMappaSicura(() => {

        renderizzaMappaVisiva(); 

        worldsModal.classList.remove("hidden");

      });

    });

    dynamicGrid.appendChild(btn);

  });

}

  // ==========================================

// MYTHOPHEDIA - SCRIPT.JS - BLOCCO 10

// ==========================================

document.getElementById("btn-mondi").addEventListener("click", () => { 

  renderizzaSelezioneMondi(); 

  sottomondiModal.classList.remove("hidden"); 

});

document.getElementById("close-sottomondi-modal").addEventListener("click", () => { 

  if (livelloVistaSottomondi === "sottomondi") {

    renderizzaSelezioneMondi();

    return;

  }

  sottomondiModal.classList.add("hidden"); 

});

document.getElementById("close-worlds-modal").addEventListener("click", () => { 

  worldsModal.classList.add("hidden"); 

  sottomondiModal.classList.remove("hidden"); 

});

let criterioOrdinamentoCorrente = localStorage.getItem("mythophedia_ordinamento_raccoglitore") || "numero";

// Ordina una copia dell'elenco carte secondo il criterio scelto dal menu a tendina
function ordinaCarteRaccoglitore(lista, criterio) {
  const copia = lista.slice();
  switch (criterio) {
    case "rarita":
      copia.sort((a, b) => (a.livello - b.livello) || (numeroCarta(a) - numeroCarta(b)));
      break;
    case "rarita_desc":
      copia.sort((a, b) => (b.livello - a.livello) || (numeroCarta(a) - numeroCarta(b)));
      break;
    case "nome":
      copia.sort((a, b) => a.nome.localeCompare(b.nome, "it"));
      break;
    case "ferocia":
      copia.sort((a, b) => b.statistiche.ferocia - a.statistiche.ferocia);
      break;
    case "balzo":
      copia.sort((a, b) => b.statistiche.balzo - a.statistiche.balzo);
      break;
    case "corazza":
      copia.sort((a, b) => b.statistiche.corazza - a.statistiche.corazza);
      break;
    case "istinto":
      copia.sort((a, b) => b.statistiche.istinto - a.statistiche.istinto);
      break;
    case "tratto":
      copia.sort((a, b) => {
        const ta = (a.tratti && a.tratti[0]) || "zzz-nessuno";
        const tb = (b.tratti && b.tratti[0]) || "zzz-nessuno";
        return ta.localeCompare(tb, "it") || (numeroCarta(a) - numeroCarta(b));
      });
      break;
    case "stelle":
      copia.sort((a, b) => (b.stelle || 0) - (a.stelle || 0) || (numeroCarta(a) - numeroCarta(b)));
      break;
    case "stelle_asc":
      copia.sort((a, b) => (a.stelle || 0) - (b.stelle || 0) || (numeroCarta(a) - numeroCarta(b)));
      break;
    case "numero_desc":
      copia.sort((a, b) => numeroCarta(b) - numeroCarta(a));
      break;
    case "numero":
    default:
      copia.sort((a, b) => numeroCarta(a) - numeroCarta(b));
      break;
  }
  return copia;
}

// Mostra l'intero Raccoglitore (tutte le carte possedute), ordinato secondo il criterio scelto
const CARTE_PER_PAGINA_RACCOGLITORE = 60;
const CARTE_PER_META_PAGINA_RACCOGLITORE = 30;
let paginaCorrenteRaccoglitore = 0;
let carteOrdinateRaccoglitoreCorrente = [];

// Punto d'ingresso: ricalcola l'ordinamento e riparte dalla prima pagina (usato dal pulsante
// "Il Raccoglitore" e dal menu a tendina). mantieniPagina=true viene usato dai tasti Avanti/Indietro.
function renderizzaRaccoglitore(criterio, mantieniPagina) {

  if (!modalGrid) return; 

  modalGrid.classList.remove("mercato-grid");

  const controlliRaccoglitore = document.querySelector(".raccoglitore-controlli-header");
  if (controlliRaccoglitore) controlliRaccoglitore.classList.remove("hidden");

  criterio = criterio || criterioOrdinamentoCorrente;
  criterioOrdinamentoCorrente = criterio;
  localStorage.setItem("mythophedia_ordinamento_raccoglitore", criterio);
  const selettore = document.getElementById("modal-sort-select");
  if (selettore && selettore.value !== criterio) selettore.value = criterio;

  carteOrdinateRaccoglitoreCorrente = ordinaCarteRaccoglitore(deckGiocatore, criterio);
  if (!mantieniPagina) paginaCorrenteRaccoglitore = 0;

  renderizzaPaginaRaccoglitore();
}

// Genera l'HTML di una singola tasca/carta del raccoglitore
function generaHTMLCartaRaccoglitore(carta) {

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

  if (carta.isJolly) {

    bottoneEvolviHTML = `<button type="button" class="attack-btn" style="background:#4a5568; cursor:not-allowed; padding:5px; font-size:0.75rem; margin-top:8px;" disabled>Solo per Sacrifici</button>`;

  } else if (carta.stelle >= 8) {

    bottoneEvolviHTML = `<button type="button" class="attack-btn" style="background:#4a5568; cursor:not-allowed; padding:5px; font-size:0.75rem; margin-top:8px;" disabled>Evoluzione Max</button>`;

  } else if (carta.occupataInDifesa) {

    bottoneEvolviHTML = `<button type="button" class="attack-btn" style="background:#4a5568; cursor:not-allowed; padding:5px; font-size:0.75rem; margin-top:8px;" disabled>Impegnata in Difesa</button>`;

  } else if (carta.bloccataInDuello) {

    bottoneEvolviHTML = `<button type="button" class="attack-btn" style="background:#4a5568; cursor:not-allowed; padding:5px; font-size:0.75rem; margin-top:8px;" disabled>Impegnata in un Duello</button>`;

  } else if (pctVigore <= 0) {

    bottoneEvolviHTML = `<button type="button" class="attack-btn" style="background:#4a5568; cursor:not-allowed; padding:5px; font-size:0.75rem; margin-top:8px;" disabled>Esausta</button>`;

  } else {

    bottoneEvolviHTML = `<button type="button" class="attack-btn" id="btn-evo-act-${carta.id}" style="padding:5px; font-size:0.75rem; margin-top:8px; background:linear-gradient(to bottom, #2f855a, #22543d); border-color:#22543d;">Evolvi (Migliora)</button>`;

  }

  let livelloTagHTML = carta.isJolly ? '' : `<span class="livello-tag ${CLASSI_LIVELLI[carta.livello] || ''}">${ETICHETTE_LIVELLI[carta.livello] || ''} · #${numeroCarta(carta)}</span>`;

  return `
    <div class="creature-card ${carta.occupataInDifesa || carta.bloccataInDuello || pctVigore <= 0 ? 'occupata' : ''}">
      ${badgeHTML}
      ${livelloTagHTML}
      <div class="card-name" style="margin-top:${carta.occupataInDifesa || carta.bloccataInDuello || pctVigore <= 0 ? '45px' : (carta.isJolly ? '0' : '20px')};">${carta.nome} ${carta.isJolly ? '' : `(${carta.stelle} ★)`}</div>
      <div class="card-icon" id="card-icon-${carta.id}" style="cursor:pointer;">${haImmagineFile(carta) ? `<img src="${carta.immagine}" alt="${carta.nome}" class="card-icon-img"${carta.stelle > 0 ? ` style="border:2px solid ${STELLA_COLORI_EVO[Math.min(carta.stelle, 8)]}; box-shadow:0 0 6px ${STELLA_COLORI_EVO[Math.min(carta.stelle, 8)]};"` : ""}>` : carta.immagine}</div>
      <div class="card-stats">
        <div class="stat-line"><span class="stat-label">Vigore</span><span class="stat-val" style="color:${pctVigore > 30 ? '#48bb78' : '#f56565'};">${pctVigore}%</span></div>
        <div class="stat-line"><span class="stat-label">Ferocia</span><span class="stat-val">${carta.statistiche.ferocia}</span></div>
        <div class="stat-line"><span class="stat-label">Balzo</span><span class="stat-val">${carta.statistiche.balzo}</span></div>
        <div class="stat-line"><span class="stat-label">Corazza</span><span class="stat-val">${carta.statistiche.corazza}</span></div>
        <div class="stat-line"><span class="stat-label">Istinto</span><span class="stat-val">${carta.statistiche.istinto}</span></div>
      </div>
      <div class="card-traits-container">${trattiHTML}</div>
      ${bottoneEvolviHTML}
      <button type="button" class="attack-btn btn-vendi-compatto" id="btn-vendi-${carta.id}" style="padding:5px; font-size:0.75rem; margin-top:4px; background:linear-gradient(to bottom, #742a2a, #4a1d1d); border-color:#5c2323;">Vendi (${carta.isJolly ? 10 : carta.livello * 15} 🪙)</button>
    </div>`;
}

// Completa una mezza pagina (6 tasche) con placeholder vuoti, per l'effetto "libro" anche a pagina incompleta
function completaMetaPaginaRaccoglitore(listaHTML) {
  let html = listaHTML.join("");
  for (let i = listaHTML.length; i < CARTE_PER_META_PAGINA_RACCOGLITORE; i++) {
    html += `<div class="creature-card-empty"></div>`;
  }
  return html;
}

function renderizzaPaginaRaccoglitore() {

  modalGrid.classList.add("raccoglitore-grid");

  const footer = document.querySelector(".raccoglitore-footer");
  if (footer) footer.classList.remove("hidden");

  modalTitle.innerText = `${deckGiocatore.length} carte`;

  const totalePagine = Math.max(1, Math.ceil(carteOrdinateRaccoglitoreCorrente.length / CARTE_PER_PAGINA_RACCOGLITORE));
  if (paginaCorrenteRaccoglitore >= totalePagine) paginaCorrenteRaccoglitore = totalePagine - 1;
  if (paginaCorrenteRaccoglitore < 0) paginaCorrenteRaccoglitore = 0;

  const inizio = paginaCorrenteRaccoglitore * CARTE_PER_PAGINA_RACCOGLITORE;
  let carteFiltrate = carteOrdinateRaccoglitoreCorrente.slice(inizio, inizio + CARTE_PER_PAGINA_RACCOGLITORE);

  const indicatore = document.getElementById("raccoglitore-indicatore-pagina");
  if (indicatore) indicatore.innerText = `Pagina ${paginaCorrenteRaccoglitore + 1} di ${totalePagine}`;
  const btnPrec = document.getElementById("raccoglitore-pag-prec");
  const btnSucc = document.getElementById("raccoglitore-pag-succ");
  if (btnPrec) btnPrec.disabled = paginaCorrenteRaccoglitore <= 0;
  if (btnSucc) btnSucc.disabled = paginaCorrenteRaccoglitore >= totalePagine - 1;

  if (carteFiltrate.length === 0) {

    modalGrid.innerHTML = `<p class="raccoglitore-vuoto">Non possiedi ancora nessuna carta.</p>`;

  } else {

    const htmlCarte = carteFiltrate.map(generaHTMLCartaRaccoglitore);
    const sinistra = htmlCarte.slice(0, CARTE_PER_META_PAGINA_RACCOGLITORE);
    const destra = htmlCarte.slice(CARTE_PER_META_PAGINA_RACCOGLITORE, CARTE_PER_PAGINA_RACCOGLITORE);

    modalGrid.innerHTML = `
      <div class="pagina-libro pagina-sinistra">${completaMetaPaginaRaccoglitore(sinistra)}</div>
      <div class="dorso-libro"></div>
      <div class="pagina-libro pagina-destra">${completaMetaPaginaRaccoglitore(destra)}</div>
    `;

    // Seconda passata: agganciamo gli eventi ora che gli elementi sono nel DOM
    carteFiltrate.forEach(carta => {

      let pctVigore = calcolaVigorePercentuale(carta);

      document.getElementById(`btn-vendi-${carta.id}`)?.addEventListener("click", () => {
        vendiCarta(carta);
      });

      document.getElementById(`card-icon-${carta.id}`)?.addEventListener("click", () => {
        mostraCartaFullscreen(carta);
      });

      if (!carta.isJolly && carta.stelle < 8 && !carta.bloccataInDuello && !carta.occupataInDifesa && pctVigore > 0) {
        document.getElementById(`btn-evo-act-${carta.id}`)?.addEventListener("click", () => {
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

function vendiCarta(carta) {

  let prezzoVendita = carta.isJolly ? 10 : carta.livello * 15;

  let avviso = `Vuoi vendere ${carta.nome} per ${prezzoVendita} Dracme? L'operazione non è reversibile.`;

  if (carta.occupataInDifesa) avviso += "\n\n⚠️ Questa carta sta difendendo un territorio conquistato. Vendendola, lascerai un buco nella guarnigione e perderai automaticamente quel settore!";

  if (carta.bloccataInDuello) avviso += "\n\n⚠️ Questa carta è impegnata in una sfida ancora aperta. Vendendola, la sfida verrà ritirata automaticamente (le altre 4 carte torneranno libere).";

  if (!confirm(avviso)) return;

  if (carta.occupataInDifesa && carta.coordinatePresidio) {

    const [rStr, cStr] = carta.coordinatePresidio.split(",");

    const r = parseInt(rStr), c = parseInt(cStr);

    const mondoObj = STRUTTURA_MONDI.find(m => m.nome === carta.mondoPresidio);

    const subObj = STRUTTURA_SOTTOMONDI.find(s => s.nome === carta.sottomondoPresidio);

    if (mondoObj && subObj) {

      const chiaveMappa = `${mondoObj.id}_${subObj.id}`;

      if (dizionarioMappe[chiaveMappa] && dizionarioMappe[chiaveMappa][r] && dizionarioMappe[chiaveMappa][r][c]) {

        let esa = dizionarioMappe[chiaveMappa][r][c];

        esa.conquistato = false;

        esa.proprietario = "Nessuno (Mostri Selvatici)";

        esa.proprietarioUid = null;

      }

      if (utenteFirebaseAttuale) {

        dbFirebase.ref(`mondi_reali/${chiaveMappa}/${r}/${c}`).update({

          conquistato: false, proprietario: "Nessuno (Mostri Selvatici)", proprietarioUid: null

        }).catch((err) => console.error("Errore aggiornamento perdita esagono:", err));

      }

    }

  }

  if (carta.bloccataInDuello && carta.sfidaBloccoId) {

    let sfida = listaDuelliBacheca.find(s => s.id === carta.sfidaBloccoId);

    if (sfida) {

      if (sfida.reale && utenteFirebaseAttuale) {

        dracmeAttuali += sfida.dracmeQuota;

        if (sfida.tier === "elite") ambraAttuale += sfida.ambraQuota;

        dbFirebase.ref("sfide_reali/" + sfida.id).remove().catch((err) => console.error("Errore ritiro sfida:", err));

      }

      listaDuelliBacheca = listaDuelliBacheca.filter(s => s.id !== sfida.id);

      deckGiocatore.forEach(c => {

        if (c.sfidaBloccoId === sfida.id) { c.bloccataInDuello = false; c.sfidaBloccoId = null; }

      });

    }

  }

  deckGiocatore = deckGiocatore.filter(c => c.id !== carta.id);

  dracmeAttuali += prezzoVendita;

  document.getElementById("dracme-count").innerText = dracmeAttuali;

  aggiornaPulsantiLateraliRarita();

  salvaProgressoCloud();

  const elCard = document.getElementById(`btn-vendi-${carta.id}`)?.closest(".creature-card");

  if (elCard) elCard.remove();

  alert(`Hai venduto ${carta.nome} per ${prezzoVendita} Dracme.`);

}

// Scala di 8 colori tenui ma sempre più preziosi, uno per ogni stella d'evoluzione raggiunta
const STELLA_COLORI_EVO = {
  1: "rgba(217, 185, 138, 0.85)",  // Ambra
  2: "rgba(168, 216, 185, 0.85)",  // Giada
  3: "rgba(159, 194, 224, 0.85)",  // Zaffiro
  4: "rgba(195, 168, 221, 0.85)",  // Ametista
  5: "rgba(224, 159, 174, 0.85)",  // Rosa Antico
  6: "rgba(232, 207, 138, 0.92)",  // Oro
  7: "rgba(215, 219, 224, 0.92)",  // Platino
  8: "rgba(245, 240, 255, 0.98)"   // Opale
};

const STELLA_NOMI_EVO = { 1: "Ambra", 2: "Giada", 3: "Zaffiro", 4: "Ametista", 5: "Rosa Antico", 6: "Oro", 7: "Platino", 8: "Opale" };

function apriFinestraEvoluzione(carta) {

  try {

  creaturaInEvoluzione = carta;

  valoreBonusStellaCorrente = carta.livello === 1 ? 0.7 : carta.livello === 6 ? 0.3 : 0.6;

  puntiDistribuzioneAssegnati = { ferocia: 0, balzo: 0, corazza: 0, istinto: 0 };

 

  document.getElementById("evo-modal-title").innerText = `Evoluzione: ${carta.nome} (${carta.stelle} ★ → ${carta.stelle + 1} ★)`;

  let targetPreview = document.getElementById("evo-target-preview");

  targetPreview.innerHTML = `

    <div style="font-weight:bold; font-size:1.1rem; color:#ffcc66;">${miniImmagineCarta(carta, 32)} ${carta.nome}</div>

    <div style="font-size:0.8rem; color:#aaa; margin-top:4px;">F: ${carta.statistiche.ferocia} | B: ${carta.statistiche.balzo} | C: ${carta.statistiche.corazza} | I: ${carta.statistiche.istinto}</div>`;

 

  aggiornaInterfacciaPuntiEvo(); 

  popolaSelectSacrifici();

  document.getElementById("evolution-modal").classList.remove("hidden");

  } catch (err) {

    alert("Non sono riuscito ad aprire la finestra di evoluzione. Riprova.");

    console.error(err);

  }

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

  let stelleRichieste = Math.max(0, creaturaInEvoluzione.stelle - 1);

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

      option.innerText = carta.isJolly ? `${carta.immagine} ${carta.nome} (Evolutivo)` : `${iconaCartaTesto(carta)} ${carta.nome} (Lvl ${carta.livello} - ${carta.stelle} ★)`;

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

  document.querySelector("#battle-result-modal .modal-card").classList.remove("mito-bg-attivo", "fatiche-bg-attivo", "fatiche-fullscreen");

  const coloreStella = STELLA_COLORI_EVO[creaturaInEvoluzione.stelle] || STELLA_COLORI_EVO[8];
  const nomeStella = STELLA_NOMI_EVO[creaturaInEvoluzione.stelle] || STELLA_NOMI_EVO[8];

  document.getElementById("battle-title-outcome").innerText = "Evoluzione Riuscita!";

  document.getElementById("battle-report-content").innerHTML = `
    <div style="text-align:center; padding:10px;">
      <div class="evo-stella-glow" style="--glow-colore:${coloreStella}; display:inline-block; border-radius:12px;">
        ${miniImmagineCarta(creaturaInEvoluzione, 90)}
      </div>
      <p style="margin-top:14px;">La tua creatura <strong>${creaturaInEvoluzione.nome}</strong> è ascesa al grado di <strong>${creaturaInEvoluzione.stelle} ★</strong>, avvolta da riflessi color <strong style="color:${coloreStella};">${nomeStella}</strong>!</p>
      <p style='margin:10px 0; border-top:1px dashed #2f855a; padding-top:10px; color:#cbd5e0;'>I nuovi attributi personalizzati sono stati applicati con successo alla matrice matematica del server.</p>
    </div>
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

  3: { nome: "Dono di Gea", costo: 500, valuta: "dracme", descrizione: "4 Carte miste (80% Lvl 1, 20% Lvl 2) + 1 Non Comune (Lvl 2) garantita + 1 Jolly Lvl 1" }

};

const SCHEMI_PACCHETTI_RESTO = {

  4: { nome: "Guardiani del Tempio", costo: 800, valuta: "dracme", descrizione: "4 Non Comuni (Lvl 2) + 5% possibilità Rara (Lvl 3)" },

  6: { nome: "Miti Incorrotti", costo: 1, valuta: "ambra", descrizione: "2 Rare (Lvl 3) garantite" },

  7: { nome: "Essenza dell'Evoluzione", costo: 2, valuta: "ambra", descrizione: "1 Carta Jolly Livello 2 + 1 Carta Jolly Livello 3" },

  8: { nome: "Forze Primordiali", costo: 3, valuta: "ambra", descrizione: "1 Epica (Lvl 4) + 2 Rare (Lvl 3) garantite" },

  9: { nome: "Flagello dei Cieli", costo: 8, valuta: "ambra", descrizione: "1 Mitica (Lvl 5) estratta dal pool supremo" },

  10: { nome: "Respiro del Drago", costo: 15, valuta: "ambra", descrizione: "1 Mitica (Lvl 5) garantita + 0.1% possibilità Drago Ancestrale (Lvl 6) extra" }

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

  let ref = pescaCartaFissa(lvl);

  return {

    id: "carta_" + lvl + "_" + Date.now() + "_" + Math.floor(Math.random()*10000),

    nome: ref.nome, cultura: ref.cultura, tratti: ref.tratti || [], immagine: ref.immagine, livello: lvl, stelle: 0,

    statistiche: { ferocia: ref.statisticheFisse.ferocia, balzo: ref.statisticheFisse.balzo, corazza: ref.statisticheFisse.corazza, istinto: ref.statisticheFisse.istinto }, isJolly: false,

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

  else if (id === 3) { for(let i=0; i<4; i++) { let lvl = Math.random() < 0.8 ? 1 : 2; nuoveCarte.push(estraiCartaPerLivello(lvl)); } nuoveCarte.push(estraiCartaPerLivello(2)); nuoveCarte.push(estraiCartaPerLivello(1, true)); }

  else if (id === 4) { for(let i=0; i<4; i++) nuoveCarte.push(estraiCartaPerLivello(2)); if(Math.random() < 0.05) nuoveCarte.push(estraiCartaPerLivello(3)); }

  else if (id === 6) { nuoveCarte.push(estraiCartaPerLivello(3), estraiCartaPerLivello(3)); }

  else if (id === 7) { nuoveCarte.push(estraiCartaPerLivello(2, true), estraiCartaPerLivello(3, true)); }

  else if (id === 8) { nuoveCarte.push(estraiCartaPerLivello(4), estraiCartaPerLivello(3), estraiCartaPerLivello(3)); }

  else if (id === 9) { nuoveCarte.push(estraiCartaPerLivello(5)); }

  else if (id === 10) { nuoveCarte.push(estraiCartaPerLivello(5)); if(Math.random() < 0.001) nuoveCarte.push(estraiCartaPerLivello(6)); }

 

  deckGiocatore = deckGiocatore.concat(nuoveCarte);

  aggiornaPulsantiLateraliRarita();

  document.getElementById("battle-title-outcome").innerText = "Spacchettamento!";

  mostraPaccoDaAprire(pack, nuoveCarte);

}

function mostraPaccoDaAprire(pack, nuoveCarte) {

  document.getElementById("battle-report-content").innerHTML = `
    <div class="pack-apertura-scena">
      <div class="pack-fisico" id="pack-fisico-clic">
        <div class="pack-meta pack-meta-sopra"></div>
        <div class="pack-sigillo">🔮</div>
        <div class="pack-meta pack-meta-sotto"></div>
      </div>
      <p class="pack-tocca-per-aprire" id="pack-tocca-testo">Tocca il pacchetto per aprirlo</p>
    </div>`;

  document.getElementById("battle-result-modal").classList.remove("hidden");

  document.getElementById("pack-fisico-clic").addEventListener("click", () => apriAnimazionePacco(pack, nuoveCarte), { once: true });

}

function apriAnimazionePacco(pack, nuoveCarte) {

  const pacco = document.getElementById("pack-fisico-clic");
  document.getElementById("pack-tocca-testo")?.remove();

  suonaStrappoPacco();
  attivaScuotimentoSchermo();
  sparaParticelle(1, pacco);

  pacco.classList.add("pack-in-apertura");

  setTimeout(() => mostraGrigliaCarteEstratte(pack, nuoveCarte), 650);

}

function mostraGrigliaCarteEstratte(pack, nuoveCarte) {

  let cartineFlipHTML = nuoveCarte.map((c, idx) => {

    let raro = c.livello >= 3 ? " rare-glow" : "";
    let anticipazione = c.livello >= 4 ? " pack-flip-anticipazione" : "";

    return `

      <div class="pack-flip-card${raro}${anticipazione}" id="pack-flip-${idx}">

        <div class="pack-flip-inner">

          <div class="pack-flip-front">🎴</div>

          <div class="pack-flip-back">

            <div style="font-size:1.8rem;">${miniImmagineCarta(c, 40)}</div>

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

  nuoveCarte.forEach((c, idx) => {

    setTimeout(() => {

      const el = document.getElementById(`pack-flip-${idx}`);

      if (el) {
        el.classList.add("flipped");
        sparaParticelle(c.livello, el);
        suonaEffettoRarita(c.livello);
      }

    }, idx * 500);

  });

}

let tributoRaStato = { scambiOggi: 0, dataUltimoScambio: "" };

const TRIBUTO_RA_COSTO = 2000;
const TRIBUTO_RA_MAX_GIORNO = 5;

function mostraToast(testo) {
  const wrapper = document.querySelector(".game-wrapper") || document.body;
  const toast = document.createElement("div");
  toast.className = "toast-notifica";
  toast.innerText = testo;
  wrapper.appendChild(toast);
  setTimeout(() => toast.classList.add("toast-notifica-esci"), 1800);
  setTimeout(() => toast.remove(), 2300);
}

function assicuraStatoTributoRa() {
  const oggi = new Date().toISOString().slice(0, 10);
  if (tributoRaStato.dataUltimoScambio !== oggi) {
    tributoRaStato.scambiOggi = 0;
    tributoRaStato.dataUltimoScambio = oggi;
  }
}

function effettuaTributoRa() {
  assicuraStatoTributoRa();
  if (tributoRaStato.scambiOggi >= TRIBUTO_RA_MAX_GIORNO) return;
  if (dracmeAttuali < TRIBUTO_RA_COSTO) { alert("Dracme insufficienti!"); return; }

  dracmeAttuali -= TRIBUTO_RA_COSTO;
  ambraAttuale += 1;
  tributoRaStato.scambiOggi++;

  aggiornaTopbarProfilo();
  salvaProgressoCloud();
  mostraToast("☀️ Ra accetta il tuo tributo: +1 Frammento d'Ambra!");

  renderizzaMercato();
}

function renderizzaMercato() {

  modalGrid.classList.remove("raccoglitore-grid");
  modalGrid.classList.add("mercato-grid");

  const controlliRaccoglitore = document.querySelector(".raccoglitore-controlli-header");
  if (controlliRaccoglitore) controlliRaccoglitore.classList.add("hidden");

  modalGrid.innerHTML = ""; 

  modalTitle.innerText = "Mercato Generale - Acquista Pacchetti";

 

  const slotCardHTML = `

    <div class="creature-card" style="justify-content: space-between; text-align: center; padding: 15px; height: 100%; border-color: #ffb703;">

      <div class="card-name" style="color: #ffb703; font-size: 1rem;">Espansione Deck</div>

      <div class="card-icon" style="font-size: 2rem; margin: 10px 0;">📦</div>

      <p style="font-size: 0.75rem; color: #cbd5e0; margin-bottom: 10px; font-family: sans-serif; min-height: 40px;">Aggiunge immediatamente +10 slot massimi per conservare le tue carte.</p>

      <button type="button" class="attack-btn" id="buy-slots-btn" style="padding: 8px; font-size: 0.75rem; margin-top: auto; background: linear-gradient(to bottom, #2b6cb0, #2b4c7e); border-color: #2b4c7e;">2000 🪙</button>

    </div>`;

  modalGrid.insertAdjacentHTML("beforeend", slotCardHTML);

  assicuraStatoTributoRa();
  const scambiRimasti = TRIBUTO_RA_MAX_GIORNO - tributoRaStato.scambiOggi;
  const tributoDisabilitato = scambiRimasti <= 0 || dracmeAttuali < TRIBUTO_RA_COSTO;

  const tributoCardHTML = `

    <div class="creature-card" style="justify-content: space-between; text-align: center; padding: 15px; height: 100%; border-color: #ffcc66;">

      <div class="card-name" style="color: #ffcc66; font-size: 1rem;">Tributo a Ra</div>

      <div class="card-icon" style="font-size: 2rem; margin: 10px 0;">☀️</div>

      <p style="font-size: 0.75rem; color: #cbd5e0; margin-bottom: 6px; font-family: sans-serif; min-height: 40px;">Offri Dracme in eccesso a Ra in cambio di un Frammento d'Ambra.</p>

      <p style="font-size: 0.68rem; color: #a89a7a; margin-bottom: 8px;">Scambi rimasti oggi: ${scambiRimasti} / ${TRIBUTO_RA_MAX_GIORNO}</p>

      <button type="button" class="attack-btn" id="tributo-ra-btn" style="padding: 8px; font-size: 0.75rem; margin-top: auto; background: linear-gradient(to bottom, #b7791f, #8a5a12); border-color: #8a5a12;" ${tributoDisabilitato ? "disabled" : ""}>${TRIBUTO_RA_COSTO} 🪙 → 1 💎</button>

    </div>`;

  modalGrid.insertAdjacentHTML("beforeend", tributoCardHTML);

 

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

    if (dracmeAttuali < 2000) { alert("Dracme insufficienti!"); return; } 

    dracmeAttuali -= 2000; slotMassimiDeck += 10; 

    document.getElementById("dracme-count").innerText = dracmeAttuali; 

    aggiornaPulsantiLateraliRarita(); 

    salvaProgressoCloud();

    alert(`Espanso! Massimi: ${slotMassimiDeck}`); 

  });

  document.getElementById("tributo-ra-btn")?.addEventListener("click", effettuaTributoRa);

 

  Object.keys(tuttiI_Pacchetti).forEach(id => { 

    document.getElementById(`buy-pack-${id}`).addEventListener("click", () => acquistaPacchetto(parseInt(id))); 

  });

  collectionModal.classList.remove("hidden");

}

document.getElementById("btn-mercato").addEventListener("click", renderizzaMercato);

  // ==========================================

// MYTHOPHEDIA - SCRIPT.JS - BLOCCO 13

// ==========================================

// Aggiorna il pulsante del profilo in alto a sinistra: nickname + foto (se caricata)
// ===== Motore particelle riutilizzabile (Canvas) — usato per pesca carte, vittorie, evoluzioni, ecc. =====

let particelleAttive = [];
let ondeAttive = [];
let raggiAttivi = [];
let particelleLoopAttivo = false;
let particelleUltimoTs = null;

function ottieniCanvasParticelle() {
  let canvas = document.getElementById("particelle-canvas");
  if (canvas) return canvas;

  const wrapper = document.querySelector(".game-wrapper") || document.body;
  canvas = document.createElement("canvas");
  canvas.id = "particelle-canvas";
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "3000";
  wrapper.appendChild(canvas);

  function ridimensionaCanvasParticelle() {
    canvas.width = wrapper.offsetWidth;
    canvas.height = wrapper.offsetHeight;
  }
  ridimensionaCanvasParticelle();
  window.addEventListener("resize", ridimensionaCanvasParticelle);

  return canvas;
}

// Calcola il centro di un elemento nello stesso sistema di coordinate "locale" (pre-rotazione) del canvas,
// risalendo la catena offsetParent fino a .game-wrapper — necessario perché .game-wrapper viene ruotato
// via transform inline per il landscape forzato, quindi getBoundingClientRect() darebbe coordinate sbagliate.
function centroLocaleElemento(elemento) {
  const wrapper = document.querySelector(".game-wrapper");
  if (!elemento || !wrapper) return null;
  let x = 0, y = 0, el = elemento, iterazioni = 0;
  while (el && el !== wrapper && iterazioni < 50) {
    x += el.offsetLeft;
    y += el.offsetTop;
    el = el.offsetParent;
    iterazioni++;
  }
  return { x: x + elemento.offsetWidth / 2, y: y + elemento.offsetHeight / 2 };
}

// Configurazione per livello di rarità (1 Comune → 6 Leggendaria): più alto il livello, più grande e vistoso il burst
const PARTICELLE_LIVELLI = {
  1: { conteggio: 12, colori: ["#e0d5c1", "#c9a054"], velocita: 3.2, vitaMs: 650, shake: false, onda: false, raggi: false, forma: "cerchio" },
  2: { conteggio: 20, colori: ["#7ee787", "#8bb8e0", "#e0d5c1"], velocita: 4.2, vitaMs: 800, shake: false, onda: false, raggi: false, forma: "cerchio" },
  3: { conteggio: 32, colori: ["#8bb8e0", "#b794f6", "#e0d5c1"], velocita: 5.2, vitaMs: 950, shake: false, onda: true, raggi: false, forma: "scintilla" },
  4: { conteggio: 46, colori: ["#ffcc66", "#f6ad55", "#fff2cc"], velocita: 6.2, vitaMs: 1150, shake: true, onda: true, raggi: false, forma: "scintilla" },
  5: { conteggio: 62, colori: ["#e09fae", "#ffcc66", "#f5f0ff"], velocita: 7.2, vitaMs: 1300, shake: true, onda: true, raggi: true, forma: "stella" },
  6: { conteggio: 90, colori: ["#ffe9a8", "#ffcc66", "#f5f0ff", "#c9a054"], velocita: 8.5, vitaMs: 1550, shake: true, onda: true, raggi: true, forma: "stella" }
};

// Spara un burst di particelle. "origine" può essere un elemento DOM (il burst parte dal suo centro),
// un oggetto {x,y}, oppure omesso (allora esplode dal centro dello schermo).
function sparaParticelle(livello, origine) {
  const canvas = ottieniCanvasParticelle();
  const cfg = PARTICELLE_LIVELLI[Math.min(6, Math.max(1, livello || 1))];

  let cx = canvas.width / 2;
  let cy = canvas.height / 2;

  if (origine instanceof HTMLElement) {
    const pos = centroLocaleElemento(origine);
    if (pos) { cx = pos.x; cy = pos.y; }
  } else if (origine && typeof origine.x === "number") {
    cx = origine.x; cy = origine.y;
  }

  for (let i = 0; i < cfg.conteggio; i++) {
    const angolo = Math.random() * Math.PI * 2;
    const velocita = cfg.velocita * (0.5 + Math.random() * 0.7);
    particelleAttive.push({
      x: cx, y: cy,
      vx: Math.cos(angolo) * velocita,
      vy: Math.sin(angolo) * velocita - 1.5,
      dimensione: 2 + Math.random() * 3.5,
      colore: cfg.colori[Math.floor(Math.random() * cfg.colori.length)],
      vitaMax: cfg.vitaMs,
      vitaRimasta: cfg.vitaMs,
      gravita: 0.09,
      forma: cfg.forma,
      rotazione: Math.random() * Math.PI * 2,
      velocitaRotazione: (Math.random() - 0.5) * 0.3
    });
  }

  if (cfg.onda) {
    ondeAttive.push({ x: cx, y: cy, raggio: 4, raggioMax: 70 + livello * 14, vitaMax: 500, vitaRimasta: 500, colore: cfg.colori[0] });
  }

  if (cfg.raggi) {
    raggiAttivi.push({ x: cx, y: cy, vitaMax: 750, vitaRimasta: 750, colore: cfg.colori[0], numero: 8, rotazioneBase: Math.random() * Math.PI });
  }

  if (cfg.shake) attivaScuotimentoSchermo();

  if (!particelleLoopAttivo) {
    particelleLoopAttivo = true;
    particelleUltimoTs = null;
    requestAnimationFrame(animaParticelle);
  }
}

function disegnaStellaParticella(ctx, cx, cy, raggio, colore, rotazione) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotazione);
  ctx.beginPath();
  ctx.moveTo(0, -raggio);
  ctx.lineTo(raggio * 0.28, -raggio * 0.28);
  ctx.lineTo(raggio, 0);
  ctx.lineTo(raggio * 0.28, raggio * 0.28);
  ctx.lineTo(0, raggio);
  ctx.lineTo(-raggio * 0.28, raggio * 0.28);
  ctx.lineTo(-raggio, 0);
  ctx.lineTo(-raggio * 0.28, -raggio * 0.28);
  ctx.closePath();
  ctx.fillStyle = colore;
  ctx.fill();
  ctx.restore();
}

function disegnaScintillaParticella(ctx, x, y, vx, vy, lunghezza, colore) {
  const angolo = Math.atan2(vy, vx);
  const dx = Math.cos(angolo) * lunghezza;
  const dy = Math.sin(angolo) * lunghezza;
  ctx.strokeStyle = colore;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - dx, y - dy);
  ctx.lineTo(x + dx * 0.3, y + dy * 0.3);
  ctx.stroke();
}

function animaParticelle(ts) {
  const canvas = document.getElementById("particelle-canvas");
  if (!canvas) { particelleLoopAttivo = false; return; }
  const ctx = canvas.getContext("2d");

  if (particelleUltimoTs === null) particelleUltimoTs = ts;
  const delta = Math.min(50, ts - particelleUltimoTs);
  particelleUltimoTs = ts;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "lighter";

  ondeAttive.forEach(o => {
    o.vitaRimasta -= delta;
    const progresso = 1 - Math.max(0, o.vitaRimasta / o.vitaMax);
    o.raggio = 4 + progresso * o.raggioMax;
    ctx.globalAlpha = Math.max(0, o.vitaRimasta / o.vitaMax) * 0.5;
    ctx.strokeStyle = o.colore;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.raggio, 0, Math.PI * 2);
    ctx.stroke();
  });
  ondeAttive = ondeAttive.filter(o => o.vitaRimasta > 0);

  raggiAttivi.forEach(r => {
    r.vitaRimasta -= delta;
    const progresso = 1 - r.vitaRimasta / r.vitaMax;
    const opacita = Math.max(0, r.vitaRimasta / r.vitaMax) * 0.35;
    const lunghezza = 60 + progresso * 160;
    for (let i = 0; i < r.numero; i++) {
      const angolo = r.rotazioneBase + (i / r.numero) * Math.PI * 2 + progresso * 0.6;
      const gradiente = ctx.createLinearGradient(r.x, r.y, r.x + Math.cos(angolo) * lunghezza, r.y + Math.sin(angolo) * lunghezza);
      gradiente.addColorStop(0, r.colore);
      gradiente.addColorStop(1, "rgba(0,0,0,0)");
      ctx.strokeStyle = gradiente;
      ctx.globalAlpha = opacita;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x + Math.cos(angolo) * lunghezza, r.y + Math.sin(angolo) * lunghezza);
      ctx.stroke();
    }
  });
  raggiAttivi = raggiAttivi.filter(r => r.vitaRimasta > 0);

  particelleAttive.forEach(p => {
    p.vitaRimasta -= delta;
    p.x += p.vx * (delta / 16);
    p.y += p.vy * (delta / 16);
    p.vy += p.gravita * (delta / 16);
    p.rotazione += p.velocitaRotazione * (delta / 16);

    const opacita = Math.max(0, p.vitaRimasta / p.vitaMax);
    ctx.globalAlpha = opacita;

    if (p.forma === "stella") {
      disegnaStellaParticella(ctx, p.x, p.y, p.dimensione * 1.7 * opacita, p.colore, p.rotazione);
    } else if (p.forma === "scintilla") {
      disegnaScintillaParticella(ctx, p.x, p.y, p.vx, p.vy, p.dimensione * 2.3 * opacita, p.colore);
    } else {
      ctx.fillStyle = p.colore;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.dimensione * opacita, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  particelleAttive = particelleAttive.filter(p => p.vitaRimasta > 0);

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;

  if (particelleAttive.length > 0 || ondeAttive.length > 0 || raggiAttivi.length > 0) {
    requestAnimationFrame(animaParticelle);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particelleLoopAttivo = false;
    particelleUltimoTs = null;
  }
}

// Scuote il riquadro del modale attivo (MAI .game-wrapper: ha già una rotazione inline da preservare per il landscape forzato)
function attivaScuotimentoSchermo(selettore) {
  const el = document.querySelector(selettore || "#battle-result-modal .modal-card");
  if (!el) return;
  el.classList.remove("schermo-shake");
  void el.offsetWidth;
  el.classList.add("schermo-shake");
  setTimeout(() => el.classList.remove("schermo-shake"), 420);
}

// ===== Motore audio effetti (Web Audio API nativa, sintetizzata: nessun file, nessun costo) =====

let contestoAudioEffetti = null;
let audioEffettiAttivi = localStorage.getItem("mythophedia_audio_attivo") !== "false";

function ottieniContestoAudioEffetti() {
  if (!audioEffettiAttivi) return null;
  if (!contestoAudioEffetti) {
    try { contestoAudioEffetti = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { return null; }
  }
  if (contestoAudioEffetti.state === "suspended") contestoAudioEffetti.resume();
  return contestoAudioEffetti;
}

function aggiornaIconaAudio() {
  const btn = document.getElementById("btn-toggle-audio");
  if (btn) btn.innerText = audioEffettiAttivi ? "🔊" : "🔇";
}

document.getElementById("btn-toggle-audio")?.addEventListener("click", () => {
  audioEffettiAttivi = !audioEffettiAttivi;
  localStorage.setItem("mythophedia_audio_attivo", audioEffettiAttivi ? "true" : "false");
  aggiornaIconaAudio();
});

aggiornaIconaAudio();

function suonaTono(freq, durataSec, tipo, volume, ritardoSec, freqFine) {
  const ctx = ottieniContestoAudioEffetti();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = tipo || "sine";
  const tStart = ctx.currentTime + (ritardoSec || 0);
  osc.frequency.setValueAtTime(freq, tStart);
  if (freqFine) osc.frequency.exponentialRampToValueAtTime(freqFine, tStart + durataSec);
  gain.gain.setValueAtTime(0.0001, tStart);
  gain.gain.linearRampToValueAtTime(volume, tStart + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, tStart + durataSec);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(tStart);
  osc.stop(tStart + durataSec + 0.05);
}

function suonaRumoreStrappo(durataSec, volume) {
  const ctx = ottieniContestoAudioEffetti();
  if (!ctx) return;
  const bufferSize = Math.floor(ctx.sampleRate * durataSec);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const dati = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) dati[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const sorgente = ctx.createBufferSource();
  sorgente.buffer = buffer;
  const filtro = ctx.createBiquadFilter();
  filtro.type = "highpass";
  filtro.frequency.value = 800;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  sorgente.connect(filtro);
  filtro.connect(gain);
  gain.connect(ctx.destination);
  sorgente.start();
}

function suonaStrappoPacco() {
  suonaRumoreStrappo(0.35, 0.18);
  suonaTono(180, 0.3, "sawtooth", 0.08, 0.05, 90);
}

function suonaEffettoRarita(livello) {
  if (livello <= 1) {
    suonaTono(520, 0.12, "sine", 0.12, 0, 700);
  } else if (livello === 2) {
    suonaTono(500, 0.15, "triangle", 0.13, 0, 750);
    suonaTono(750, 0.15, "sine", 0.08, 0.05);
  } else if (livello === 3) {
    suonaTono(440, 0.2, "triangle", 0.14, 0, 660);
    suonaTono(660, 0.18, "sine", 0.1, 0.06);
    suonaTono(880, 0.18, "sine", 0.08, 0.12);
  } else if (livello === 4) {
    suonaTono(220, 0.35, "sawtooth", 0.09, 0, 110);
    suonaTono(660, 0.25, "triangle", 0.12, 0.05, 990);
    suonaTono(990, 0.2, "sine", 0.09, 0.15);
  } else if (livello === 5) {
    suonaTono(180, 0.4, "sawtooth", 0.1, 0, 90);
    suonaTono(550, 0.3, "triangle", 0.13, 0.08, 825);
    suonaTono(825, 0.25, "sine", 0.1, 0.18);
    suonaTono(1100, 0.2, "sine", 0.08, 0.28);
  } else {
    suonaTono(140, 0.55, "sawtooth", 0.12, 0, 70);
    suonaTono(440, 0.35, "triangle", 0.13, 0.1, 660);
    suonaTono(660, 0.3, "sine", 0.11, 0.22);
    suonaTono(880, 0.28, "sine", 0.09, 0.34);
    suonaTono(1320, 0.25, "sine", 0.08, 0.46);
  }
}

function aggiornaTopbarProfilo() {
  const elUsername = document.getElementById("username");
  if (elUsername) elUsername.innerText = nicknameUtente;

  const elDracme = document.getElementById("dracme-count");
  if (elDracme) elDracme.innerText = dracmeAttuali;

  const elAmbra = document.getElementById("ambra-count");
  if (elAmbra) elAmbra.innerText = ambraAttuale;

  aggiornaBarraLivelloXP();

  const elImg = document.getElementById("profilo-img");
  const elPlaceholder = document.getElementById("profilo-placeholder");
  if (elImg && elPlaceholder) {
    const avatar = localStorage.getItem("user_avatar");
    if (avatar) {
      elImg.src = avatar;
      elImg.style.display = "block";
      elPlaceholder.style.display = "none";
    } else {
      elImg.style.display = "none";
      elPlaceholder.style.display = "flex";
    }
  }
}

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

        <p style="color:#aaa; font-size:0.85rem;"><strong>Esperienza accumulata:</strong> ${xpAttuali} / ${sogliaXpPerLivello(livelloGiocatore)} XP</p>

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

        const img = new Image();

        img.onload = function() {

          const maxLato = 200;

          let larghezza = img.width;

          let altezza = img.height;

          if (larghezza > altezza) {

            if (larghezza > maxLato) { altezza = Math.round(altezza * (maxLato / larghezza)); larghezza = maxLato; }

          } else {

            if (altezza > maxLato) { larghezza = Math.round(larghezza * (maxLato / altezza)); altezza = maxLato; }

          }

          const canvas = document.createElement("canvas");

          canvas.width = larghezza;

          canvas.height = altezza;

          const ctx = canvas.getContext("2d");

          ctx.drawImage(img, 0, 0, larghezza, altezza);

          const base64Image = canvas.toDataURL("image/jpeg", 0.7);

          avatarPreview.style.backgroundImage = `url('${base64Image}')`;

          avatarPreview.innerText = "";

          localStorage.setItem("user_avatar_temp", base64Image);

        };

        img.src = event.target.result;

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

    aggiornaTopbarProfilo();

    salvaProgressoCloud();

 

    alert("Profilo aggiornato con successo!"); document.getElementById("battle-result-modal").classList.add("hidden");

  });

}

document.getElementById("btn-profilo").addEventListener("click", apriPannelloProfiloEvocatore);

// ===== Fatica 1: "La Scala del Leone" - 10 gradini, 20 carte selezionate, caratteristiche a rotazione settimanale =====

let fatica1Stato = { settimanaId: 0, carteSelezionate: [], carteUsate: [], gradinoAttuale: 0, tentativiOggi: 0, dataUltimoTentativo: "", premioFinaleRitirato: false };

let selezioneTemporaneaFatiche = new Set();

function mulberry32Fatiche(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function idSettimanaFatiche() { return Math.floor(Date.now() / (7 * 24 * 3600 * 1000)); }

function dataOggiStringaFatiche() { return new Date().toISOString().slice(0, 10); }

// ===== "Il Dono di Ra": omaggio giornaliero gratuito nell'hub delle Fatiche =====

let raStato = { dataUltimoRitiro: "" };

const RA_DRACME_BASE = 80;
const RA_PROBABILITA_FRAMMENTO = 0.15;

function dataOggiStringaRa() { return new Date().toISOString().slice(0, 10); }

function raDisponibileOggi() {
  return raStato.dataUltimoRitiro !== dataOggiStringaRa();
}

function ritiraDonoRa() {
  if (!raDisponibileOggi()) return;

  raStato.dataUltimoRitiro = dataOggiStringaRa();
  dracmeAttuali += RA_DRACME_BASE;

  let messaggio = `☀️ Ra ti dona ${RA_DRACME_BASE} Dracme.`;
  if (Math.random() < RA_PROBABILITA_FRAMMENTO) {
    ambraAttuale += 1;
    messaggio += " E un raro Frammento d'Ambra!";
  }

  mostraToast(messaggio);
  aggiornaTopbarProfilo();
  salvaProgressoCloud();
  renderContenutoFatiche();
}

// ===== "Serie Giornaliera": streak infinita, non si azzera se salti un giorno =====

let serieStato = { giorni: 0, dataUltimoRitiro: "" };

function dataOggiStringaSerie() { return new Date().toISOString().slice(0, 10); }

function serieDisponibileOggi() {
  return serieStato.dataUltimoRitiro !== dataOggiStringaSerie();
}

function ritiraSerieGiornaliera() {
  if (!serieDisponibileOggi()) return;

  serieStato.giorni += 1;
  serieStato.dataUltimoRitiro = dataOggiStringaSerie();

  const dracmeVinte = Math.round(150 + 150 * Math.log(serieStato.giorni));
  dracmeAttuali += dracmeVinte;

  let frammenti = 0;
  if (serieStato.giorni % 30 === 0) frammenti = 2;
  else if (serieStato.giorni % 7 === 0) frammenti = 1;
  if (frammenti > 0) ambraAttuale += frammenti;

  let messaggio = `🔥 Giorno ${serieStato.giorni} della tua serie: +${dracmeVinte} Dracme.`;
  if (frammenti > 0) messaggio += ` +${frammenti} Frammento${frammenti > 1 ? "i" : ""} d'Ambra!`;

  mostraToast(messaggio);
  aggiornaTopbarProfilo();
  salvaProgressoCloud();
  renderContenutoFatiche();
}

function assicuraStatoFatiche() {
  const weekId = idSettimanaFatiche();
  if (fatica1Stato.settimanaId !== weekId) {
    fatica1Stato = { settimanaId: weekId, carteSelezionate: [], carteUsate: [], gradinoAttuale: 0, tentativiOggi: 0, dataUltimoTentativo: dataOggiStringaFatiche(), premioFinaleRitirato: false };
  }
  const oggi = dataOggiStringaFatiche();
  if (fatica1Stato.dataUltimoTentativo !== oggi) {
    fatica1Stato.tentativiOggi = 0;
    fatica1Stato.dataUltimoTentativo = oggi;
  }
}

// Scala deterministica: stessa per tutti i giocatori nella stessa settimana (seed = id settimana)
function generaScalaFatiche(weekId) {
  const rng = mulberry32Fatiche(weekId * 7919 + 13);
  const poolStat = ["ferocia", "balzo", "corazza", "istinto"];
  const livelliRung = [1, 1, 1, 2, 2, 2, 3, 3, 3, 3];
  const premiRung = [15, 20, 25, 30, 35, 40, 50, 60, 70, 90];
  const scala = [];

  for (let i = 0; i < 10; i++) {
    let modalita, stats;
    if (i === 9) {
      modalita = "trifase";
      stats = [...poolStat].sort(() => rng() - 0.5).slice(0, 3);
    } else {
      const r = rng();
      if (r < 0.5) { modalita = "singola"; stats = [poolStat[Math.floor(rng() * 4)]]; }
      else if (r < 0.8) { modalita = "bifase"; stats = [...poolStat].sort(() => rng() - 0.5).slice(0, 2); }
      else { modalita = "trifase"; stats = [...poolStat].sort(() => rng() - 0.5).slice(0, 3); }
    }

    let nemicoRef;
    if (i === 9) {
      nemicoRef = CARTE_FISSE.find(c => c.nome === "Cerbero") || CARTE_FISSE.filter(c => c.livello === 3)[0];
    } else {
      const pool = CARTE_FISSE.filter(c => c.livello === livelliRung[i]);
      nemicoRef = pool[Math.floor(rng() * pool.length)];
    }

    scala.push({
      nemico: {
        nome: nemicoRef.nome,
        immagine: nemicoRef.immagine,
        livello: nemicoRef.livello,
        statistiche: { ferocia: nemicoRef.statisticheFisse.ferocia, balzo: nemicoRef.statisticheFisse.balzo, corazza: nemicoRef.statisticheFisse.corazza, istinto: nemicoRef.statisticheFisse.istinto }
      },
      modalita, stats, premio: premiRung[i]
    });
  }

  return scala;
}

const ETICHETTE_STAT_FATICHE = { ferocia: "Ferocia", balzo: "Balzo", corazza: "Corazza", istinto: "Istinto" };
const ETICHETTE_MODALITA_FATICHE = { singola: "Normale", bifase: "Bifase", trifase: "Trifase" };

let sezioneFaticheCorrente = "hub";

let faticheSwipeStartY = null;
let faticheSwipeStartX = null;

let ruotaFortunaStato = { ultimoGiro: 0 };

const SEGMENTI_RUOTA = [
  { label: "100 Dracme", tipo: "dracme", valore: 100, colore: "#d9b98a" },   // Ambra
  { label: "100 Dracme", tipo: "dracme", valore: 100, colore: "#8fc9a0" },   // Giada
  { label: "150 Dracme", tipo: "dracme", valore: 150, colore: "#8bb8e0" },   // Zaffiro
  { label: "150 Dracme", tipo: "dracme", valore: 150, colore: "#c3a8dd" },   // Ametista
  { label: "200 Dracme", tipo: "dracme", valore: 200, colore: "#e09fae" },   // Rosa Antico
  { label: "300 Dracme", tipo: "dracme", valore: 300, colore: "#e8cf6f" },   // Oro
  { label: "1 Frammento d'Ambra", tipo: "ambra", valore: 1, colore: "#a8d7d0" }, // Platino/Acqua
  { label: "Jackpot: 500 Dracme + 1 Jolly", tipo: "jackpot", valore: 500, colore: "#a05fd1" } // Viola vivo
];

function apriPannelloFatiche() {

  document.querySelector("#battle-result-modal .modal-card").classList.add("fatiche-bg-attivo");

  assicuraStatoFatiche();

  sezioneFaticheCorrente = "hub";

  renderContenutoFatiche();

  document.getElementById("battle-result-modal").classList.remove("hidden");

}

function aggiornaSfondoFatiche() {

  const modalCard = document.querySelector("#battle-result-modal .modal-card");
  if (!modalCard) return;

  if (sezioneFaticheCorrente === "hub" || sezioneFaticheCorrente === "ruota") {
    modalCard.style.backgroundImage = "";
    return;
  }

  const fatica = FATICHE_DODICI.find(f => f.id === sezioneFaticheCorrente);
  if (fatica) {
    modalCard.style.backgroundImage = `linear-gradient(rgba(20,12,4,0.72), rgba(20,12,4,0.72)), url('img/fatiche/${fatica.slug}.jpg')`;
  } else {
    modalCard.style.backgroundImage = "";
  }

}

function renderContenutoFatiche() {
  const content = document.getElementById("battle-report-content");
  const modalCard = document.querySelector("#battle-result-modal .modal-card");

  modalCard?.classList.remove("fatiche-fullscreen");

  if (sezioneFaticheCorrente !== "mira") fermaCicloMira();
  if (sezioneFaticheCorrente !== "furto") fermaCicloFurto();

  aggiornaSfondoFatiche();

  if (sezioneFaticheCorrente === "hub") {
    document.getElementById("battle-title-outcome").innerText = "Le Dodici Fatiche e tanto altro...";
    content.innerHTML = htmlHubFatiche();
    document.getElementById("hub-btn-scala")?.addEventListener("click", () => { sezioneFaticheCorrente = "scala"; renderContenutoFatiche(); });
    document.getElementById("hub-btn-ruota")?.addEventListener("click", () => { sezioneFaticheCorrente = "ruota"; renderContenutoFatiche(); });
    document.getElementById("hub-btn-ra")?.addEventListener("click", ritiraDonoRa);
    document.getElementById("hub-btn-serie")?.addEventListener("click", ritiraSerieGiornaliera);
    document.getElementById("hub-btn-augia")?.addEventListener("click", () => { sezioneFaticheCorrente = "augia"; renderContenutoFatiche(); });
    document.getElementById("hub-btn-cavalle")?.addEventListener("click", () => { sezioneFaticheCorrente = "cavalle"; renderContenutoFatiche(); });
    document.getElementById("hub-btn-inseguimento")?.addEventListener("click", () => { sezioneFaticheCorrente = "inseguimento"; renderContenutoFatiche(); });
    document.getElementById("hub-btn-mira")?.addEventListener("click", () => { sezioneFaticheCorrente = "mira"; renderContenutoFatiche(); });
    document.getElementById("hub-btn-idra")?.addEventListener("click", () => { sezioneFaticheCorrente = "idra"; renderContenutoFatiche(); });
    document.getElementById("hub-btn-amazzone")?.addEventListener("click", () => { sezioneFaticheCorrente = "amazzone"; renderContenutoFatiche(); });
    document.getElementById("hub-btn-trappola")?.addEventListener("click", () => { sezioneFaticheCorrente = "trappola"; renderContenutoFatiche(); });
    document.getElementById("hub-btn-toro")?.addEventListener("click", () => { sezioneFaticheCorrente = "toro"; renderContenutoFatiche(); });
    document.getElementById("hub-btn-furto")?.addEventListener("click", () => { sezioneFaticheCorrente = "furto"; renderContenutoFatiche(); });
    document.getElementById("hub-btn-giardino")?.addEventListener("click", () => { sezioneFaticheCorrente = "giardino"; renderContenutoFatiche(); });
    document.getElementById("hub-btn-cerbero")?.addEventListener("click", () => { sezioneFaticheCorrente = "cerbero"; renderContenutoFatiche(); });
    return;
  }

  if (sezioneFaticheCorrente === "scala") {
    document.getElementById("battle-title-outcome").innerText = "La Scala del Leone";
    if (fatica1Stato.carteSelezionate.length < 20) {
      content.innerHTML = htmlSelezioneCarteFatiche();
      collegaEventiSelezioneFatiche();
    } else {
      content.innerHTML = htmlScalaFatiche();
      collegaEventiScalaFatiche();
    }
  } else if (sezioneFaticheCorrente === "ruota") {
    document.getElementById("battle-title-outcome").innerText = "Ruota della Fortuna";
    content.innerHTML = htmlRuotaFortuna();
    document.getElementById("ruota-fortuna-btn")?.addEventListener("click", girRuotaFortuna);
  } else if (sezioneFaticheCorrente === "augia") {
    const titoloEl = document.getElementById("battle-title-outcome");
    titoloEl.innerHTML = augiaInPartita
      ? `Le Stalle di Augia <span style="font-size:0.6em; color:#ffcc66; margin-left:10px; white-space:nowrap;">Mosse: ${augiaMosseRimaste} · Punteggio: ${augiaPunteggio}</span>`
      : "Le Stalle di Augia";
    content.innerHTML = htmlSchermataAugia();
    collegaEventiAugia();
  } else if (sezioneFaticheCorrente === "cavalle") {
    document.getElementById("battle-title-outcome").innerText = "Le Cavalle Famigliche";
    content.innerHTML = htmlSchermataCavalle();
    collegaEventiCavalle();
  } else if (sezioneFaticheCorrente === "inseguimento") {
    document.getElementById("battle-title-outcome").innerText = "L'Inseguimento";
    content.innerHTML = htmlSchermataInseguimento();
    collegaEventiInseguimento();
  } else if (sezioneFaticheCorrente === "mira") {
    document.getElementById("battle-title-outcome").innerText = "La Mira di Bronzo";
    content.innerHTML = htmlSchermataMira();
    collegaEventiMira();
  } else if (sezioneFaticheCorrente === "idra") {
    document.getElementById("battle-title-outcome").innerText = "Le Teste dell'Idra";
    content.innerHTML = htmlSchermataIdra();
    collegaEventiIdra();
  } else if (sezioneFaticheCorrente === "amazzone") {
    document.getElementById("battle-title-outcome").innerText = "Il Dono dell'Amazzone";
    content.innerHTML = htmlSchermataAmazzone();
    collegaEventiAmazzone();
  } else if (sezioneFaticheCorrente === "trappola") {
    document.getElementById("battle-title-outcome").innerText = "La Trappola nella Neve";
    content.innerHTML = htmlSchermataTrappola();
    collegaEventiTrappola();
  } else if (sezioneFaticheCorrente === "toro") {
    document.getElementById("battle-title-outcome").innerText = "Il Toro Furioso";
    content.innerHTML = htmlSchermataToro();
    collegaEventiToro();
  } else if (sezioneFaticheCorrente === "furto") {
    document.getElementById("battle-title-outcome").innerText = "Il Furto del Gregge";
    content.innerHTML = htmlSchermataFurto();
    collegaEventiFurto();
  } else if (sezioneFaticheCorrente === "giardino") {
    document.getElementById("battle-title-outcome").innerText = "Il Giardino Custodito";
    content.innerHTML = htmlSchermataGiardino();
    collegaEventiGiardino();
  } else if (sezioneFaticheCorrente === "cerbero") {
    document.getElementById("battle-title-outcome").innerText = "Le Porte degli Inferi";
    content.innerHTML = htmlSchermataCerbero();
    collegaEventiCerbero();
  }
}

const FATICHE_DODICI = [
  { numero: 1, id: "scala", nome: "La Scala del Leone", emoji: "🦁", slug: "scala-del-leone", implementata: true },
  { numero: 2, id: "idra", nome: "Le Teste dell'Idra", emoji: "🐍", slug: "teste-dell-idra", implementata: true },
  { numero: 3, id: "inseguimento", nome: "L'Inseguimento", emoji: "🦌", slug: "inseguimento", implementata: true },
  { numero: 4, id: "trappola", nome: "La Trappola nella Neve", emoji: "🐗", slug: "trappola-nella-neve", implementata: true },
  { numero: 5, id: "augia", nome: "Le Stalle di Augia", emoji: "🐄", slug: "stalle-di-augia", implementata: true },
  { numero: 6, id: "mira", nome: "La Mira di Bronzo", emoji: "🏹", slug: "mira-di-bronzo", implementata: true },
  { numero: 7, id: "toro", nome: "Il Toro Furioso", emoji: "🐂", slug: "toro-furioso", implementata: true },
  { numero: 8, id: "cavalle", nome: "Le Cavalle Famigliche", emoji: "🐴", slug: "cavalle-famigliche", implementata: true },
  { numero: 9, id: "amazzone", nome: "Il Dono dell'Amazzone", emoji: "🏹", slug: "dono-dell-amazzone", implementata: true },
  { numero: 10, id: "furto", nome: "Il Furto del Gregge", emoji: "🐕‍🦺", slug: "furto-del-gregge", implementata: true },
  { numero: 11, id: "giardino", nome: "Il Giardino Custodito", emoji: "🍎", slug: "giardino-custodito", implementata: true },
  { numero: 12, id: "cerbero", nome: "Le Porte degli Inferi", emoji: "🐕", slug: "porte-degli-inferi", implementata: true }
];

function htmlHubFatiche() {

  const raDisponibile = raDisponibileOggi();
  const serieDisponibile = serieDisponibileOggi();

  const rigaBonus = `
    <div class="fatiche-riga-bonus">
      <button type="button" id="hub-btn-ruota" class="fatica-tile-ruota">
        <span class="fatica-tile-ruota-emoji">🎡</span>
        <span>Ruota della Fortuna</span>
      </button>
      <button type="button" id="hub-btn-ra" class="fatica-tile-ruota" ${raDisponibile ? "" : "disabled"}>
        <span class="fatica-tile-ruota-emoji">${raDisponibile ? "☀️" : "🌑"}</span>
        <span>${raDisponibile ? "Il Dono di Ra" : "Ra è già passato oggi"}</span>
      </button>
      <button type="button" id="hub-btn-serie" class="fatica-tile-ruota" ${serieDisponibile ? "" : "disabled"}>
        <span class="fatica-tile-ruota-emoji">🔥</span>
        <span>${serieDisponibile ? `Serie: giorno ${serieStato.giorni + 1}` : `Serie: giorno ${serieStato.giorni} (fatto)`}</span>
      </button>
    </div>`;

  const tileFatiche = FATICHE_DODICI.map(f => {
    if (!f.implementata) {
      return `
        <div class="fatica-tile fatica-tile-bloccata">
          <span class="fatica-tile-numero">${f.numero}</span>
          <div class="fatica-tile-img-wrap">
            <div class="fatica-tile-fallback" style="display:flex;">🔒</div>
          </div>
          <span class="fatica-tile-label">${f.nome}</span>
        </div>`;
    }
    if (f.id === "cerbero" && !tutteLeFaticheCompletate()) {
      return `
        <button type="button" class="fatica-tile" id="hub-btn-cerbero">
          <span class="fatica-tile-numero">${f.numero}</span>
          <div class="fatica-tile-img-wrap">
            <div class="fatica-tile-fallback" style="display:flex;">🔒</div>
          </div>
          <span class="fatica-tile-label">${f.nome}</span>
          <span class="fatica-tile-progresso">${contaFaticheCompletate()} / 11</span>
        </button>`;
    }
    return `
      <button type="button" class="fatica-tile" id="hub-btn-${f.id}">
        <span class="fatica-tile-numero">${f.numero}</span>
        <div class="fatica-tile-img-wrap">
          <img src="img/fatiche/${f.slug}.jpg" class="fatica-tile-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="fatica-tile-fallback">${f.emoji}</div>
        </div>
        <span class="fatica-tile-label">${f.nome}</span>
      </button>`;
  }).join("");

  return `
    <div style="display:flex; flex-direction:column; gap:10px; padding:14px; height:100%; box-sizing:border-box;">
      ${rigaBonus}
      <div class="fatiche-griglia-piastrelle">${tileFatiche}</div>
    </div>`;
}

function msRimanentiRuota() {
  return Math.max(0, (ruotaFortunaStato.ultimoGiro + 8 * 3600 * 1000) - Date.now());
}

function formattaTempoResiduoRuota(ms) {
  const totMin = Math.ceil(ms / 60000);
  const h = Math.floor(totMin / 60);
  const m = totMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function costruisciConicGradientRuota() {
  const step = 360 / SEGMENTI_RUOTA.length;
  const parti = SEGMENTI_RUOTA.map((s, i) => `${s.colore} ${i * step}deg ${(i + 1) * step}deg`);
  return `conic-gradient(${parti.join(", ")})`;
}

function htmlRuotaFortuna() {
  const msResidui = msRimanentiRuota();
  const disponibile = msResidui <= 0;

  const legenda = SEGMENTI_RUOTA.map(s => `
    <div style="display:flex; align-items:center; gap:6px; font-size:0.66rem; color:#e0d5c1;">
      <span style="width:10px; height:10px; border-radius:3px; background:${s.colore}; display:inline-block; border:1px solid rgba(255,255,255,0.35); flex-shrink:0;"></span>${s.label}
    </div>`).join("");

  return `
    <div style="display:flex; align-items:center; justify-content:center; gap:28px; height:100%; padding:6px 14px; flex-wrap:nowrap;">
      <div style="display:flex; align-items:center; gap:16px; flex-shrink:0;">
        <div style="position:relative; width:160px; height:160px; flex-shrink:0;">
          <div style="position:absolute; top:-14px; left:50%; transform:translateX(-50%); font-size:1.3rem; z-index:2; filter:drop-shadow(0 2px 3px rgba(0,0,0,0.9));">🔻</div>
          <div id="ruota-fortuna-disco" style="width:160px; height:160px; border-radius:50%; border:5px solid #c9a054; box-shadow:0 0 18px rgba(0,0,0,0.6), inset 0 0 18px rgba(0,0,0,0.4); background:${costruisciConicGradientRuota()}; transition: transform 4.2s cubic-bezier(0.15,0.68,0.1,1);"></div>
          <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:24px; height:24px; border-radius:50%; background:radial-gradient(circle,#ffe9a8,#c9a054); border:3px solid #5c4d31; box-shadow:0 0 10px rgba(0,0,0,0.6); z-index:2;"></div>
        </div>
        <div style="display:flex; flex-direction:column; gap:5px;">${legenda}</div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:14px; flex-shrink:0;">
        <div id="ruota-fortuna-esito" style="min-height:40px; text-align:center; color:#ffcc66; font-weight:bold; font-size:0.9rem; max-width:200px;"></div>
        <button type="button" id="ruota-fortuna-btn" class="events-btn events-btn-main" style="max-width:220px;" ${disponibile ? "" : "disabled"}>
          ${disponibile ? "🎡 Gira la Ruota" : `Prossimo giro tra ${formattaTempoResiduoRuota(msResidui)}`}
        </button>
      </div>
    </div>`;
}

function assegnaPremioRuota(premio) {
  if (premio.tipo === "dracme") {
    dracmeAttuali += premio.valore;
  } else if (premio.tipo === "ambra") {
    ambraAttuale += premio.valore;
  } else if (premio.tipo === "jackpot") {
    dracmeAttuali += premio.valore;
    deckGiocatore.push(estraiCartaPerLivello(1, true));
  }
  aggiornaTopbarProfilo();
}

function girRuotaFortuna() {
  if (msRimanentiRuota() > 0) return;

  const btn = document.getElementById("ruota-fortuna-btn");
  if (btn) { btn.disabled = true; btn.innerText = "Il destino sta decidendo..."; }

  const indice = Math.floor(Math.random() * SEGMENTI_RUOTA.length);
  const step = 360 / SEGMENTI_RUOTA.length;
  const angoloCentroSegmento = indice * step + step / 2;
  const giriExtra = 6 * 360;
  const rotazioneFinale = giriExtra + (360 - angoloCentroSegmento);

  const disco = document.getElementById("ruota-fortuna-disco");
  if (disco) disco.style.transform = `rotate(${rotazioneFinale}deg)`;

  setTimeout(() => {
    const premio = SEGMENTI_RUOTA[indice];
    assegnaPremioRuota(premio);
    ruotaFortunaStato.ultimoGiro = Date.now();
    salvaProgressoCloud();

    const esitoEl = document.getElementById("ruota-fortuna-esito");
    if (esitoEl) esitoEl.innerText = `🎉 Hai vinto: ${premio.label}!`;

    const btnFinale = document.getElementById("ruota-fortuna-btn");
    if (btnFinale) {
      btnFinale.disabled = true;
      btnFinale.innerText = `Prossimo giro tra ${formattaTempoResiduoRuota(msRimanentiRuota())}`;
    }
  }, 4300);
}

// ===== "Le Stalle di Augia": match-3 di creature (Quinta Fatica) =====

let augiaStato = { ultimoTentativo: 0 };

const AUGIA_COLONNE = 12;
const AUGIA_RIGHE = 5;
const AUGIA_SIMBOLI = ["🦁", "🐍", "🦅", "🐺", "🐲", "🦂"];
const AUGIA_COOLDOWN_MS = 4 * 3600 * 1000;
const AUGIA_MOSSE_BASE = 10;
const AUGIA_MOSSE_EXTRA_QTY = 10;
const AUGIA_COSTO_MOSSE_EXTRA = 200;

const AUGIA_PREMI = [
  { soglia: 600, dracme: 220 },
  { soglia: 450, dracme: 130 },
  { soglia: 300, dracme: 70 },
  { soglia: 150, dracme: 30 },
  { soglia: 50, dracme: 10 }
];

let augiaGriglia = [];
let augiaMosseRimaste = 0;
let augiaPunteggio = 0;
let augiaCellaSelezionata = null;
let augiaInPartita = false;
let augiaGiocoFinito = false;
let augiaBloccaClick = false;

function msRimanentiAugia() {
  return Math.max(0, (augiaStato.ultimoTentativo + AUGIA_COOLDOWN_MS) - Date.now());
}

function calcolaPremioAugia(punteggio) {
  for (const p of AUGIA_PREMI) if (punteggio >= p.soglia) return p.dracme;
  return 0;
}

function generaGrigliaAugia() {
  const g = [];
  for (let r = 0; r < AUGIA_RIGHE; r++) {
    g.push([]);
    for (let c = 0; c < AUGIA_COLONNE; c++) {
      let simbolo;
      do {
        simbolo = Math.floor(Math.random() * AUGIA_SIMBOLI.length);
      } while (
        (c >= 2 && g[r][c - 1] === simbolo && g[r][c - 2] === simbolo) ||
        (r >= 2 && g[r - 1][c] === simbolo && g[r - 2][c] === simbolo)
      );
      g[r].push(simbolo);
    }
  }
  return g;
}

function trovaMatchAugia(g) {
  const daRimuovere = new Set();

  for (let r = 0; r < AUGIA_RIGHE; r++) {
    let run = 1;
    for (let c = 1; c <= AUGIA_COLONNE; c++) {
      if (c < AUGIA_COLONNE && g[r][c] === g[r][c - 1]) { run++; }
      else {
        if (run >= 3) for (let k = c - run; k < c; k++) daRimuovere.add(r + "-" + k);
        run = 1;
      }
    }
  }

  for (let c = 0; c < AUGIA_COLONNE; c++) {
    let run = 1;
    for (let r = 1; r <= AUGIA_RIGHE; r++) {
      if (r < AUGIA_RIGHE && g[r][c] === g[r - 1][c]) { run++; }
      else {
        if (run >= 3) for (let k = r - run; k < r; k++) daRimuovere.add(k + "-" + c);
        run = 1;
      }
    }
  }

  return daRimuovere;
}

function risolviCascataAugia() {
  let puntiRound = 0;
  while (true) {
    const match = trovaMatchAugia(augiaGriglia);
    if (match.size === 0) break;
    puntiRound += match.size * 10;
    match.forEach(chiave => {
      const [r, c] = chiave.split("-").map(Number);
      augiaGriglia[r][c] = null;
    });
    for (let c = 0; c < AUGIA_COLONNE; c++) {
      let colonna = [];
      for (let r = 0; r < AUGIA_RIGHE; r++) if (augiaGriglia[r][c] !== null) colonna.push(augiaGriglia[r][c]);
      while (colonna.length < AUGIA_RIGHE) colonna.unshift(Math.floor(Math.random() * AUGIA_SIMBOLI.length));
      for (let r = 0; r < AUGIA_RIGHE; r++) augiaGriglia[r][c] = colonna[r];
    }
  }
  return puntiRound;
}

function sonoAdiacentiAugia(a, b) {
  return (a.r === b.r && Math.abs(a.c - b.c) === 1) || (a.c === b.c && Math.abs(a.r - b.r) === 1);
}

function scambiaCelleAugia(g, a, b) {
  const tmp = g[a.r][a.c];
  g[a.r][a.c] = g[b.r][b.c];
  g[b.r][b.c] = tmp;
}

function iniziaPartitaAugia() {
  augiaStato.ultimoTentativo = Date.now();
  salvaProgressoCloud();
  augiaGriglia = generaGrigliaAugia();
  augiaMosseRimaste = AUGIA_MOSSE_BASE;
  augiaPunteggio = 0;
  augiaCellaSelezionata = null;
  augiaInPartita = true;
  augiaGiocoFinito = false;
  renderContenutoFatiche();
}

function comparaMosseAugia() {
  if (dracmeAttuali < AUGIA_COSTO_MOSSE_EXTRA) return;
  dracmeAttuali -= AUGIA_COSTO_MOSSE_EXTRA;
  augiaMosseRimaste += AUGIA_MOSSE_EXTRA_QTY;
  augiaGiocoFinito = false;
  aggiornaTopbarProfilo();
  salvaProgressoCloud();
  renderContenutoFatiche();
}

function ritiraPremioAugia() {
  const premio = calcolaPremioAugia(augiaPunteggio);
  dracmeAttuali += premio;
  if (augiaPunteggio >= 300) segnaFaticaCompletata("augia");
  augiaInPartita = false;
  augiaGiocoFinito = false;
  aggiornaTopbarProfilo();
  salvaProgressoCloud();
  renderContenutoFatiche();
}

function htmlSchermataAugia() {
  if (augiaInPartita) return htmlGiocoAugia();

  const msResidui = msRimanentiAugia();
  const disponibile = msResidui <= 0;

  return `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:14px; padding:14px;">
      <div style="background:rgba(15,10,5,0.6); border-radius:10px; padding:14px; color:#e0d5c1; font-size:0.85rem; max-width:340px; text-align:center;">
        <p style="color:#c9a054; font-style:italic; margin-bottom:8px;">Le stalle del re Augia non venivano ripulite da anni: montagne di sterco accumulato in decenni. Eracle riuscì a ripulirle in un solo giorno deviando il corso di due fiumi.</p>
        <p>Ripulisci le stalle allineando almeno 3 creature uguali in riga o colonna: spariscono e ti fanno guadagnare punti. Hai <b>10 mosse</b> a disposizione — più punti fai, più Dracme guadagni!</p>
      </div>
      <button type="button" id="augia-inizia-btn" class="events-btn events-btn-main" style="max-width:260px;" ${disponibile ? "" : "disabled"}>
        ${disponibile ? "🌾 Inizia" : `Prossimo tentativo tra ${formattaTempoResiduoRuota(msResidui)}`}
      </button>
    </div>`;
}

function attendiAugia(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let augiaCelleInEvidenza = null;

function htmlGiocoAugia() {
  let celle = "";
  for (let r = 0; r < AUGIA_RIGHE; r++) {
    for (let c = 0; c < AUGIA_COLONNE; c++) {
      const selezionata = augiaCellaSelezionata && augiaCellaSelezionata.r === r && augiaCellaSelezionata.c === c;
      const inEvidenza = augiaCelleInEvidenza && augiaCelleInEvidenza.has(r + "-" + c);
      const simboloCella = augiaGriglia[r][c];
      const vuota = simboloCella === null || simboloCella === undefined;
      const classi = "augia-cella" + (selezionata ? " selezionata" : "") + (inEvidenza ? " in-evidenza" : "") + (vuota ? " vuota" : "");
      celle += `<button type="button" class="${classi}" data-r="${r}" data-c="${c}">${vuota ? "" : AUGIA_SIMBOLI[simboloCella]}</button>`;
    }
  }

  const overlayFine = augiaGiocoFinito ? htmlFineAugia() : "";

  return `
    <div style="position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; height:100%; padding:6px;">
      <div class="augia-griglia">${celle}</div>
      ${overlayFine}
    </div>`;
}

function htmlFineAugia() {
  const premio = calcolaPremioAugia(augiaPunteggio);
  const puoComprare = dracmeAttuali >= AUGIA_COSTO_MOSSE_EXTRA;
  return `
    <div class="augia-overlay-fine">
      <div class="augia-overlay-box">
        <p style="font-size:1rem; color:#ffcc66; font-weight:bold; margin-bottom:6px;">Mosse esaurite!</p>
        <p style="font-size:0.9rem; color:#e0d5c1; margin-bottom:4px;">Punteggio: <b>${augiaPunteggio}</b></p>
        <p style="font-size:0.85rem; color:#c9a054; margin-bottom:14px;">Premio disponibile: ${premio} Dracme</p>
        <button type="button" id="augia-ritira-btn" class="events-btn events-btn-main" style="margin-bottom:8px; max-width:240px;">🏆 Ritira Premio</button>
        <button type="button" id="augia-compra-mosse-btn" class="events-btn events-btn-small" style="max-width:240px;" ${puoComprare ? "" : "disabled"}>
          ▶️ +10 Mosse (${AUGIA_COSTO_MOSSE_EXTRA} Dracme)
        </button>
      </div>
    </div>`;
}

async function eseguiScambioAugia(a, b) {

  augiaBloccaClick = true;

  scambiaCelleAugia(augiaGriglia, a, b);
  renderContenutoFatiche();
  await attendiAugia(180);

  let match = trovaMatchAugia(augiaGriglia);

  if (match.size === 0) {
    scambiaCelleAugia(augiaGriglia, a, b); // nessun match: annulla lo scambio, mossa non consumata
    renderContenutoFatiche();
    await attendiAugia(180);
    augiaBloccaClick = false;
    renderContenutoFatiche();
    return;
  }

  augiaMosseRimaste--;

  while (match.size > 0) {

    augiaCelleInEvidenza = match;
    renderContenutoFatiche();
    await attendiAugia(380);

    augiaPunteggio += match.size * 10;
    match.forEach(chiave => {
      const [r, c] = chiave.split("-").map(Number);
      augiaGriglia[r][c] = null;
    });
    augiaCelleInEvidenza = null;
    renderContenutoFatiche();
    await attendiAugia(200);

    for (let c = 0; c < AUGIA_COLONNE; c++) {
      let colonna = [];
      for (let r = 0; r < AUGIA_RIGHE; r++) if (augiaGriglia[r][c] !== null) colonna.push(augiaGriglia[r][c]);
      while (colonna.length < AUGIA_RIGHE) colonna.unshift(Math.floor(Math.random() * AUGIA_SIMBOLI.length));
      for (let r = 0; r < AUGIA_RIGHE; r++) augiaGriglia[r][c] = colonna[r];
    }
    renderContenutoFatiche();
    await attendiAugia(260);

    match = trovaMatchAugia(augiaGriglia);
  }

  if (augiaMosseRimaste <= 0) augiaGiocoFinito = true;

  augiaBloccaClick = false;
  renderContenutoFatiche();
}

function collegaEventiAugia() {
  document.getElementById("augia-inizia-btn")?.addEventListener("click", iniziaPartitaAugia);

  document.getElementById("augia-ritira-btn")?.addEventListener("click", ritiraPremioAugia);
  document.getElementById("augia-compra-mosse-btn")?.addEventListener("click", comparaMosseAugia);

  document.querySelectorAll(".augia-cella").forEach(cella => {
    cella.addEventListener("click", () => {
      if (augiaBloccaClick || augiaGiocoFinito) return;

      const r = parseInt(cella.dataset.r);
      const c = parseInt(cella.dataset.c);
      const posizione = { r, c };

      if (!augiaCellaSelezionata) {
        augiaCellaSelezionata = posizione;
        renderContenutoFatiche();
        return;
      }

      if (augiaCellaSelezionata.r === r && augiaCellaSelezionata.c === c) {
        augiaCellaSelezionata = null;
        renderContenutoFatiche();
        return;
      }

      if (!sonoAdiacentiAugia(augiaCellaSelezionata, posizione)) {
        augiaCellaSelezionata = posizione;
        renderContenutoFatiche();
        return;
      }

      const a = augiaCellaSelezionata;
      const b = posizione;
      augiaCellaSelezionata = null;

      eseguiScambioAugia(a, b);
    });
  });
}

// ===== "Le Cavalle Famigliche": rischio/ricompensa a moltiplicatore crescente (Ottava Fatica) =====

let cavalleStato = { tentativiOggi: 0, dataUltimoTentativo: "" };

const CAVALLE_TAPPE = [
  { nome: "Podargo", probabilita: 0.65, moltiplicatore: 1.5 },
  { nome: "Lampone", probabilita: 0.50, moltiplicatore: 2.3 },
  { nome: "Xanto", probabilita: 0.38, moltiplicatore: 3.8 },
  { nome: "Dino", probabilita: 0.25, moltiplicatore: 6.5 }
];

const CAVALLE_PUNTATE = [50, 100, 200];
const CAVALLE_TENTATIVI_MAX = 3;

let cavalleInPartita = false;
let cavallePuntata = 0;
let cavalleTappaAttuale = 0;
let cavalleMoltiplicatoreAttuale = 1;
let cavalleGiocoFinito = false;
let cavalleEsitoTesto = "";
let cavalleBloccaClick = false;

function dataOggiStringaCavalle() { return new Date().toISOString().slice(0, 10); }

function assicuraStatoCavalle() {
  const oggi = dataOggiStringaCavalle();
  if (cavalleStato.dataUltimoTentativo !== oggi) {
    cavalleStato.tentativiOggi = 0;
    cavalleStato.dataUltimoTentativo = oggi;
  }
}

function attendiCavalle(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function iniziaPartitaCavalle(puntata) {
  if (cavalleBloccaClick) return;
  assicuraStatoCavalle();
  if (cavalleStato.tentativiOggi >= CAVALLE_TENTATIVI_MAX) return;
  if (dracmeAttuali < puntata) return;

  dracmeAttuali -= puntata;
  cavalleStato.tentativiOggi++;
  cavallePuntata = puntata;
  cavalleTappaAttuale = 0;
  cavalleMoltiplicatoreAttuale = 1;
  cavalleInPartita = true;
  cavalleGiocoFinito = false;
  cavalleEsitoTesto = "";

  aggiornaTopbarProfilo();
  salvaProgressoCloud();
  renderContenutoFatiche();
}

async function affrontaTappaCavalle() {
  if (cavalleBloccaClick) return;
  cavalleBloccaClick = true;

  const tappa = CAVALLE_TAPPE[cavalleTappaAttuale];
  const esitoEl = document.getElementById("cavalle-esito-tappa");

  if (esitoEl) esitoEl.innerHTML = `<span class="cavalle-galoppo">🐎</span> ${tappa.nome} scalpita minacciosa...`;
  await attendiCavalle(900);

  const sopravvive = Math.random() < tappa.probabilita;

  if (esitoEl) {
    esitoEl.innerHTML = sopravvive
      ? `<span class="cavalle-flash-vittoria">✅ ${tappa.nome} domata!</span>`
      : `<span class="cavalle-flash-sconfitta">💥 ${tappa.nome} si ribella!</span>`;
  }
  await attendiCavalle(550);

  if (sopravvive) {
    cavalleMoltiplicatoreAttuale = tappa.moltiplicatore;
    cavalleTappaAttuale++;

    if (cavalleTappaAttuale >= CAVALLE_TAPPE.length) {
      const vincitaFinale = Math.round(cavallePuntata * cavalleMoltiplicatoreAttuale);
      dracmeAttuali += vincitaFinale;
      segnaFaticaCompletata("cavalle");
      cavalleGiocoFinito = true;
      cavalleEsitoTesto = `🏆 Hai domato tutte e quattro le cavalle! Vinci ${vincitaFinale} Dracme.`;
      aggiornaTopbarProfilo();
      salvaProgressoCloud();
    }
  } else {
    cavalleGiocoFinito = true;
    cavalleEsitoTesto = `💀 ${tappa.nome} non ti ha risparmiato. Hai perso la puntata di ${cavallePuntata} Dracme.`;
  }

  cavalleBloccaClick = false;
  renderContenutoFatiche();
}

function ritiraCavalle() {
  if (cavalleBloccaClick || cavalleTappaAttuale === 0) return;
  const vincita = Math.round(cavallePuntata * cavalleMoltiplicatoreAttuale);
  dracmeAttuali += vincita;
  if (cavalleTappaAttuale >= 2) segnaFaticaCompletata("cavalle");
  cavalleGiocoFinito = true;
  cavalleEsitoTesto = `Ti sei ritirato in tempo, portando a casa ${vincita} Dracme.`;
  aggiornaTopbarProfilo();
  salvaProgressoCloud();
  renderContenutoFatiche();
}

function chiudiPartitaCavalle() {
  cavalleInPartita = false;
  cavalleGiocoFinito = false;
  renderContenutoFatiche();
}

function htmlSchermataCavalle() {
  assicuraStatoCavalle();

  if (!cavalleInPartita) {
    const tentativiRimasti = CAVALLE_TENTATIVI_MAX - cavalleStato.tentativiOggi;
    const disponibile = tentativiRimasti > 0;

    const bottoniPuntata = CAVALLE_PUNTATE.map(p => `
      <button type="button" class="cavalle-puntata-btn events-btn events-btn-small" data-puntata="${p}" ${(!disponibile || dracmeAttuali < p) ? "disabled" : ""}>
        ${p} Dracme
      </button>`).join("");

    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:14px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:10px; padding:14px; color:#e0d5c1; font-size:0.85rem; max-width:360px; text-align:center;">
          <p style="color:#c9a054; font-style:italic; margin-bottom:8px;">Le cavalle del re Diomede erano nutrite con carne umana, feroci e imprevedibili: Eracle le domò dando in pasto lo stesso Diomede alle sue creature.</p>
          <p>Scegli quante Dracme rischiare. Ad ogni cavalla superata il moltiplicatore cresce — puoi ritirarti quando vuoi, ma un passo falso ti costa l'intera puntata.</p>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">${bottoniPuntata}</div>
        <p style="color:#a89a7a; font-size:0.8rem;">Tentativi rimasti oggi: <b style="color:#ffcc66;">${tentativiRimasti} / ${CAVALLE_TENTATIVI_MAX}</b></p>
      </div>`;
  }

  if (cavalleGiocoFinito) {
    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:16px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:12px; padding:20px; color:#e0d5c1; font-size:0.95rem; max-width:360px; text-align:center;">
          ${cavalleEsitoTesto}
        </div>
        <button type="button" id="cavalle-chiudi-btn" class="events-btn events-btn-main" style="max-width:240px;">Continua</button>
      </div>`;
  }

  const tappa = CAVALLE_TAPPE[cavalleTappaAttuale];
  const vincitaAttuale = Math.round(cavallePuntata * cavalleMoltiplicatoreAttuale);
  const vincitaPotenziale = Math.round(cavallePuntata * tappa.moltiplicatore);

  return `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:14px; padding:14px;">
      <div style="background:rgba(15,10,5,0.6); border-radius:10px; padding:14px; color:#e0d5c1; font-size:0.85rem; max-width:360px; text-align:center;">
        <p style="font-size:1rem; color:#ffcc66; font-weight:bold; margin-bottom:6px;">🐴 ${tappa.nome}</p>
        <p>Puntata: <b>${cavallePuntata}</b> Dracme — Se la superi: <b style="color:#c9a054;">${vincitaPotenziale}</b> Dracme (×${tappa.moltiplicatore})</p>
        ${cavalleTappaAttuale > 0 ? `<p style="margin-top:6px; color:#7ee787;">Se ti ritiri ora incassi: <b>${vincitaAttuale}</b> Dracme</p>` : ""}
      </div>
      <div id="cavalle-esito-tappa" style="min-height:22px; color:#ffcc66; font-weight:bold; font-size:0.9rem;"></div>
      <div style="display:flex; gap:10px;">
        <button type="button" id="cavalle-rischia-btn" class="events-btn events-btn-main" style="max-width:200px;">⚔️ Rischia</button>
        ${cavalleTappaAttuale > 0 ? `<button type="button" id="cavalle-ritira-btn" class="events-btn events-btn-small" style="max-width:200px;">🏳️ Ritirati</button>` : ""}
      </div>
    </div>`;
}

function collegaEventiCavalle() {
  document.querySelectorAll(".cavalle-puntata-btn").forEach(btn => {
    btn.addEventListener("click", () => iniziaPartitaCavalle(parseInt(btn.dataset.puntata)));
  });

  document.getElementById("cavalle-rischia-btn")?.addEventListener("click", affrontaTappaCavalle);
  document.getElementById("cavalle-ritira-btn")?.addEventListener("click", ritiraCavalle);
  document.getElementById("cavalle-chiudi-btn")?.addEventListener("click", chiudiPartitaCavalle);
}

// ===== "L'Inseguimento": riflessi a tempo decrescente (Terza Fatica) =====

let inseguimentoStato = { tentativiOggi: 0, dataUltimoTentativo: "" };

const INSEGUIMENTO_TENTATIVI_MAX = 3;
const INSEGUIMENTO_VITE_MAX = 3;
const INSEGUIMENTO_MS_INIZIALE = 1600;
const INSEGUIMENTO_MS_RIDUZIONE = 90;
const INSEGUIMENTO_MS_MINIMO = 500;
const INSEGUIMENTO_CELLE = 6;
const INSEGUIMENTO_TARGET = "🦌";
const INSEGUIMENTO_DECOY = ["🐺", "🦊", "🐗", "🐻", "🦅", "🐇", "🦉", "🐿️"];

const INSEGUIMENTO_PREMI = [
  { soglia: 15, dracme: 250 },
  { soglia: 12, dracme: 150 },
  { soglia: 9, dracme: 80 },
  { soglia: 6, dracme: 40 },
  { soglia: 3, dracme: 15 }
];

let inseguimentoInPartita = false;
let inseguimentoGiocoFinito = false;
let inseguimentoRoundAttuale = 0;
let inseguimentoViteRimaste = INSEGUIMENTO_VITE_MAX;
let inseguimentoCelle = [];
let inseguimentoIndiceCerva = 0;
let inseguimentoTimer = null;
let inseguimentoBloccaClick = false;
let inseguimentoEsitoTesto = "";

function dataOggiStringaInseguimento() { return new Date().toISOString().slice(0, 10); }

function assicuraStatoInseguimento() {
  const oggi = dataOggiStringaInseguimento();
  if (inseguimentoStato.dataUltimoTentativo !== oggi) {
    inseguimentoStato.tentativiOggi = 0;
    inseguimentoStato.dataUltimoTentativo = oggi;
  }
}

function calcolaPremioInseguimento(round) {
  for (const p of INSEGUIMENTO_PREMI) if (round >= p.soglia) return p.dracme;
  return 0;
}

function calcolaTempoRoundInseguimento(round) {
  return Math.max(INSEGUIMENTO_MS_MINIMO, INSEGUIMENTO_MS_INIZIALE - round * INSEGUIMENTO_MS_RIDUZIONE);
}

function iniziaPartitaInseguimento() {
  assicuraStatoInseguimento();
  if (inseguimentoStato.tentativiOggi >= INSEGUIMENTO_TENTATIVI_MAX) return;

  inseguimentoStato.tentativiOggi++;
  salvaProgressoCloud();

  inseguimentoInPartita = true;
  inseguimentoGiocoFinito = false;
  inseguimentoRoundAttuale = 0;
  inseguimentoViteRimaste = INSEGUIMENTO_VITE_MAX;

  renderContenutoFatiche();
  avviaRoundInseguimento();
}

function avviaRoundInseguimento() {
  inseguimentoIndiceCerva = Math.floor(Math.random() * INSEGUIMENTO_CELLE);
  inseguimentoCelle = [];
  for (let i = 0; i < INSEGUIMENTO_CELLE; i++) {
    if (i === inseguimentoIndiceCerva) {
      inseguimentoCelle.push(INSEGUIMENTO_TARGET);
    } else {
      inseguimentoCelle.push(INSEGUIMENTO_DECOY[Math.floor(Math.random() * INSEGUIMENTO_DECOY.length)]);
    }
  }

  inseguimentoBloccaClick = false;
  renderContenutoFatiche();

  const tempoRound = calcolaTempoRoundInseguimento(inseguimentoRoundAttuale);
  const barraEl = document.getElementById("inseguimento-barra-tempo");
  if (barraEl) {
    barraEl.style.transition = "none";
    barraEl.style.width = "100%";
    void barraEl.offsetWidth; // forza un reflow sincrono, altrimenti dal secondo giro il browser "salta" il reset e la barra resta ferma
    barraEl.style.transition = `width ${tempoRound}ms linear`;
    barraEl.style.width = "0%";
  }

  clearTimeout(inseguimentoTimer);
  inseguimentoTimer = setTimeout(() => gestisciEsitoInseguimento(false), tempoRound);
}

function gestisciEsitoInseguimento(indovinata) {
  if (inseguimentoBloccaClick) return;
  inseguimentoBloccaClick = true;
  clearTimeout(inseguimentoTimer);

  const cellaEl = document.getElementById(`inseguimento-cella-${inseguimentoIndiceCerva}`);

  if (indovinata) {
    cellaEl?.classList.add("inseguimento-flash-vittoria");
    inseguimentoRoundAttuale++;
  } else {
    cellaEl?.classList.add("inseguimento-flash-mancata");
    inseguimentoViteRimaste--;
  }

  setTimeout(() => {
    if (inseguimentoViteRimaste <= 0) {
      inseguimentoGiocoFinito = true;
      const premio = calcolaPremioInseguimento(inseguimentoRoundAttuale);
      dracmeAttuali += premio;
      if (inseguimentoRoundAttuale >= 9) segnaFaticaCompletata("inseguimento");
      inseguimentoEsitoTesto = `La cerva è sparita nel bosco dopo ${inseguimentoRoundAttuale} inseguimenti riusciti. Premio: ${premio} Dracme.`;
      aggiornaTopbarProfilo();
      salvaProgressoCloud();
      renderContenutoFatiche();
    } else {
      avviaRoundInseguimento();
    }
  }, 450);
}

function chiudiPartitaInseguimento() {
  inseguimentoInPartita = false;
  inseguimentoGiocoFinito = false;
  renderContenutoFatiche();
}

function htmlSchermataInseguimento() {
  assicuraStatoInseguimento();

  if (!inseguimentoInPartita) {
    const tentativiRimasti = INSEGUIMENTO_TENTATIVI_MAX - inseguimentoStato.tentativiOggi;
    const disponibile = tentativiRimasti > 0;

    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:14px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:10px; padding:14px; color:#e0d5c1; font-size:0.85rem; max-width:360px; text-align:center;">
          <p style="color:#c9a054; font-style:italic; margin-bottom:8px;">Per un anno intero Eracle inseguì la Cerva di Cerinea per tutta la Grecia, senza mai riuscire a coglierla di sorpresa: la sua velocità era quasi sovrumana.</p>
          <p>Individua la cerva 🦌 tra le altre creature prima che scompaia — hai <b>3 vite</b>, e ad ogni inseguimento riuscito la finestra di tempo si restringe sempre di più.</p>
        </div>
        <button type="button" id="inseguimento-inizia-btn" class="events-btn events-btn-main" style="max-width:260px;" ${disponibile ? "" : "disabled"}>
          ${disponibile ? "🏹 Inizia l'inseguimento" : "Nessun tentativo rimasto oggi"}
        </button>
        <p style="color:#a89a7a; font-size:0.8rem;">Tentativi rimasti oggi: <b style="color:#ffcc66;">${tentativiRimasti} / ${INSEGUIMENTO_TENTATIVI_MAX}</b></p>
      </div>`;
  }

  if (inseguimentoGiocoFinito) {
    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:16px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:12px; padding:20px; color:#e0d5c1; font-size:0.95rem; max-width:360px; text-align:center;">
          ${inseguimentoEsitoTesto}
        </div>
        <button type="button" id="inseguimento-chiudi-btn" class="events-btn events-btn-main" style="max-width:240px;">Continua</button>
      </div>`;
  }

  const celleHTML = inseguimentoCelle.map((simbolo, i) => `
    <button type="button" id="inseguimento-cella-${i}" class="inseguimento-cella" data-indice="${i}">${simbolo}</button>
  `).join("");

  return `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:12px; padding:14px;">
      <div style="display:flex; justify-content:space-between; width:100%; max-width:360px; color:#e0d5c1; font-size:0.85rem;">
        <span>Vite: ${"❤️".repeat(inseguimentoViteRimaste)}</span>
        <span>Inseguimenti riusciti: <b style="color:#ffcc66;">${inseguimentoRoundAttuale}</b></span>
      </div>
      <div class="inseguimento-barra-contenitore"><div id="inseguimento-barra-tempo" class="inseguimento-barra-tempo"></div></div>
      <div class="inseguimento-griglia">${celleHTML}</div>
    </div>`;
}

function collegaEventiInseguimento() {
  document.getElementById("inseguimento-inizia-btn")?.addEventListener("click", iniziaPartitaInseguimento);
  document.getElementById("inseguimento-chiudi-btn")?.addEventListener("click", chiudiPartitaInseguimento);

  document.querySelectorAll(".inseguimento-cella").forEach(cella => {
    cella.addEventListener("click", () => {
      if (inseguimentoBloccaClick) return;
      const indice = parseInt(cella.dataset.indice);
      gestisciEsitoInseguimento(indice === inseguimentoIndiceCerva);
    });
  });
}

// ===== "La Mira di Bronzo": uccelli in volo libero, colpiti con precisione (Sesta Fatica) =====

let miraStato = { tentativiOggi: 0, dataUltimoTentativo: "" };

const MIRA_TENTATIVI_MAX = 3;
const MIRA_FRECCE_MAX = 15;
const MIRA_NUM_UCCELLI = 2;
const MIRA_VELOCITA = 1.9;
const MIRA_TICK_MS = 40;

const MIRA_PREMI = [
  { soglia: 13, dracme: 220 },
  { soglia: 10, dracme: 140 },
  { soglia: 7, dracme: 85 },
  { soglia: 4, dracme: 40 },
  { soglia: 1, dracme: 15 }
];

let miraInPartita = false;
let miraGiocoFinito = false;
let miraUccelli = [];
let miraFrecceRimaste = MIRA_FRECCE_MAX;
let miraPunteggio = 0;
let miraIntervalId = null;
let miraBloccaClick = false;

function dataOggiStringaMira() { return new Date().toISOString().slice(0, 10); }

function assicuraStatoMira() {
  const oggi = dataOggiStringaMira();
  if (miraStato.dataUltimoTentativo !== oggi) {
    miraStato.tentativiOggi = 0;
    miraStato.dataUltimoTentativo = oggi;
  }
}

function calcolaPremioMira(punteggio) {
  for (const p of MIRA_PREMI) if (punteggio >= p.soglia) return p.dracme;
  return 0;
}

function fermaCicloMira() {
  if (miraIntervalId) { clearInterval(miraIntervalId); miraIntervalId = null; }
}

function generaUccelloMira() {
  const angolo = Math.random() * Math.PI * 2;
  return {
    x: 15 + Math.random() * 70,
    y: 15 + Math.random() * 70,
    dx: Math.cos(angolo) * MIRA_VELOCITA,
    dy: Math.sin(angolo) * MIRA_VELOCITA
  };
}

function iniziaPartitaMira() {
  assicuraStatoMira();
  if (miraStato.tentativiOggi >= MIRA_TENTATIVI_MAX) return;

  miraStato.tentativiOggi++;
  salvaProgressoCloud();

  miraInPartita = true;
  miraGiocoFinito = false;
  miraFrecceRimaste = MIRA_FRECCE_MAX;
  miraPunteggio = 0;
  miraUccelli = Array.from({ length: MIRA_NUM_UCCELLI }, generaUccelloMira);

  renderContenutoFatiche();

  fermaCicloMira();
  miraIntervalId = setInterval(tickMira, MIRA_TICK_MS);
}

// Sposta gli uccelli aggiornando solo la loro posizione via stile: mai ricostruire lo schermo qui,
// altrimenti i bottoni verrebbero ricreati di continuo e i click finirebbero fuori bersaglio.
function tickMira() {
  miraUccelli.forEach((u, i) => {
    u.x += u.dx;
    u.y += u.dy;
    if (u.x <= 5 || u.x >= 95) u.dx *= -1;
    if (u.y <= 5 || u.y >= 95) u.dy *= -1;
    u.x = Math.max(5, Math.min(95, u.x));
    u.y = Math.max(5, Math.min(95, u.y));

    const el = document.querySelector(`.mira-uccello-hit[data-indice="${i}"]`);
    if (el) {
      el.style.left = u.x + "%";
      el.style.top = u.y + "%";
    }
  });
}

function aggiornaContatoriMira() {
  const elFrecce = document.getElementById("mira-frecce-testo");
  const elPunti = document.getElementById("mira-punteggio-testo");
  if (elFrecce) elFrecce.innerText = miraFrecceRimaste;
  if (elPunti) elPunti.innerText = miraPunteggio;
}

function concludiSeFineFrecceMira() {
  if (miraFrecceRimaste <= 0) {
    fermaCicloMira();
    miraInPartita = false;
    miraGiocoFinito = true;
    const premio = calcolaPremioMira(miraPunteggio);
    dracmeAttuali += premio;
    if (miraPunteggio >= 10) segnaFaticaCompletata("sonaglio");
    aggiornaTopbarProfilo();
    salvaProgressoCloud();
    renderContenutoFatiche();
  }
}

// Colpito: si clicca DIRETTAMENTE sul bottone dell'uccello, quindi il browser stesso
// garantisce che il colpo vada esattamente dove tocchi, indipendentemente da rotazioni dello schermo.
function sparaMiraColpito(indice) {
  if (miraBloccaClick || !miraInPartita || miraFrecceRimaste <= 0) return;
  miraBloccaClick = true;

  miraFrecceRimaste--;
  miraPunteggio++;

  const el = document.querySelector(`.mira-uccello-hit[data-indice="${indice}"]`);
  if (el) {
    el.classList.add("mira-colpito-flash");
    setTimeout(() => el?.classList.remove("mira-colpito-flash"), 250);
  }

  Object.assign(miraUccelli[indice], generaUccelloMira());
  if (el) {
    el.style.left = miraUccelli[indice].x + "%";
    el.style.top = miraUccelli[indice].y + "%";
  }

  aggiornaContatoriMira();
  concludiSeFineFrecceMira();

  miraBloccaClick = false;
}

function sparaMiraMancato() {
  if (miraBloccaClick || !miraInPartita || miraFrecceRimaste <= 0) return;
  miraBloccaClick = true;

  miraFrecceRimaste--;
  aggiornaContatoriMira();
  concludiSeFineFrecceMira();

  miraBloccaClick = false;
}

function chiudiPartitaMira() {
  fermaCicloMira();
  miraInPartita = false;
  miraGiocoFinito = false;
  renderContenutoFatiche();
}

function htmlSchermataMira() {
  assicuraStatoMira();

  if (!miraInPartita && !miraGiocoFinito) {
    const tentativiRimasti = MIRA_TENTATIVI_MAX - miraStato.tentativiOggi;
    const disponibile = tentativiRimasti > 0;

    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:14px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:10px; padding:14px; color:#e0d5c1; font-size:0.85rem; max-width:380px; text-align:center;">
          <p style="color:#c9a054; font-style:italic; margin-bottom:8px;">Il sonaglio di bronzo forgiato da Efesto fece alzare in volo gli uccelli Stinfalidi tutti insieme: Eracle li abbatté poi con il suo arco, uno dopo l'altro, mentre fuggivano nel cielo.</p>
          <p>Tocca direttamente un uccello per colpirlo: volano liberi e cambiano rotta in continuazione. Hai <b>${MIRA_FRECCE_MAX} frecce</b>, usale con precisione.</p>
        </div>
        <button type="button" id="mira-inizia-btn" class="events-btn events-btn-main" style="max-width:260px;" ${disponibile ? "" : "disabled"}>
          ${disponibile ? "🏹 Prendi la mira" : "Nessun tentativo rimasto oggi"}
        </button>
        <p style="color:#a89a7a; font-size:0.8rem;">Tentativi rimasti oggi: <b style="color:#ffcc66;">${tentativiRimasti} / ${MIRA_TENTATIVI_MAX}</b></p>
      </div>`;
  }

  if (miraGiocoFinito) {
    const premio = calcolaPremioMira(miraPunteggio);
    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:16px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:12px; padding:20px; color:#e0d5c1; font-size:0.95rem; max-width:360px; text-align:center;">
          <p style="font-size:1.05rem; color:#ffcc66; font-weight:bold; margin-bottom:6px;">🏹 Faretra vuota</p>
          <p>Uccelli colpiti: <b>${miraPunteggio}</b> su ${MIRA_FRECCE_MAX} frecce</p>
          <p style="color:#c9a054; margin-top:6px;">Premio: ${premio} Dracme</p>
        </div>
        <button type="button" id="mira-chiudi-btn" class="events-btn events-btn-main" style="max-width:240px;">Continua</button>
      </div>`;
  }

  const uccelliHTML = miraUccelli.map((u, i) => `
    <button type="button" class="mira-uccello-hit" data-indice="${i}" style="left:${u.x}%; top:${u.y}%;">🕊️</button>
  `).join("");

  return `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:10px; padding:10px;">
      <div style="display:flex; justify-content:space-between; width:100%; max-width:400px; color:#e0d5c1; font-size:0.85rem;">
        <span>🏹 Frecce: <b id="mira-frecce-testo" style="color:#ffcc66;">${miraFrecceRimaste}</b></span>
        <span>Colpiti: <b id="mira-punteggio-testo" style="color:#ffcc66;">${miraPunteggio}</b></span>
      </div>
      <div id="mira-campo" class="mira-campo">${uccelliHTML}</div>
    </div>`;
}

function collegaEventiMira() {
  document.getElementById("mira-inizia-btn")?.addEventListener("click", iniziaPartitaMira);
  document.getElementById("mira-chiudi-btn")?.addEventListener("click", chiudiPartitaMira);

  const campo = document.getElementById("mira-campo");
  if (campo) {
    campo.addEventListener("click", (e) => {
      if (e.target.closest(".mira-uccello-hit")) return;
      sparaMiraMancato();
    });
  }

  document.querySelectorAll(".mira-uccello-hit").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      sparaMiraColpito(parseInt(btn.dataset.indice));
    });
  });
}

// ===== "Le Teste dell'Idra": rosa di una carta per livello, rotazione obbligatoria (Seconda Fatica) =====

let idraStato = { tentativiOggi: 0, dataUltimoTentativo: "" };

const IDRA_TENTATIVI_MAX = 3;
const IDRA_SOMMA_TARGET = [1.5, 2.5, 3.5, 4.5, 5.5, 6.8, 8.0, 9.2, 10.3, 11.5];
const IDRA_PREMI_DRACME = [15, 25, 40, 60, 85, 115, 150, 190];
const IDRA_NOMI_STAT = { ferocia: "Ferocia", balzo: "Balzo", corazza: "Corazza", istinto: "Istinto" };
const IDRA_NOMI_RARITA = { 1: "Comune", 2: "Non Comune", 3: "Rara", 4: "Epica", 5: "Mitica", 6: "Leggendaria" };

let idraInPartita = false;
let idraGiocoFinito = false;
let idraRosterAttiva = [];
let idraTurnoAttuale = 0;
let idraEsitoTesto = "";
let idraBloccaClick = false;
let idraTotaleDracmeRun = 0;
let idraTotaleFrammentiRun = 0;

function dataOggiStringaIdra() { return new Date().toISOString().slice(0, 10); }

function assicuraStatoIdra() {
  const oggi = dataOggiStringaIdra();
  if (idraStato.dataUltimoTentativo !== oggi) {
    idraStato.tentativiOggi = 0;
    idraStato.dataUltimoTentativo = oggi;
  }
}

function idGiornoIdra() { return Math.floor(Date.now() / (24 * 3600 * 1000)); }

function statisticaGiornalieraIdra() {
  const rng = mulberry32Fatiche(idGiornoIdra() * 104729 + 7);
  const poolStat = ["ferocia", "balzo", "corazza", "istinto"];
  return poolStat[Math.floor(rng() * poolStat.length)];
}

function attendiIdra(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function carteEleggibiliIdra() {
  return deckGiocatore.filter(c => !c.isJolly && !c.occupataInDifesa && !c.bloccataInDuello && calcolaVigorePercentuale(c) > 0);
}

function iniziaPartitaIdra() {
  assicuraStatoIdra();
  if (idraStato.tentativiOggi >= IDRA_TENTATIVI_MAX) return;

  const selettori = document.querySelectorAll(".idra-select-livello");
  const roster = [];
  selettori.forEach(sel => {
    const carta = deckGiocatore.find(c => c.id === sel.value);
    if (carta) roster.push({ carta, usata: false });
  });

  if (roster.length === 0) { alert("Scegli almeno una creatura per affrontare l'Idra!"); return; }

  idraStato.tentativiOggi++;
  salvaProgressoCloud();

  idraRosterAttiva = roster;
  idraTurnoAttuale = 0;
  idraTotaleDracmeRun = 0;
  idraTotaleFrammentiRun = 0;
  idraInPartita = true;
  idraGiocoFinito = false;
  idraEsitoTesto = "";

  renderContenutoFatiche();
}

async function affrontaTurnoIdra(indiceRoster) {
  if (idraBloccaClick) return;
  const voce = idraRosterAttiva[indiceRoster];
  if (!voce || voce.usata) return;
  idraBloccaClick = true;

  const stat = statisticaGiornalieraIdra();
  const numeroTurno = idraTurnoAttuale + 1;
  const target = IDRA_SOMMA_TARGET[idraTurnoAttuale];
  const sommaNemica = +(target * (0.92 + Math.random() * 0.16)).toFixed(1);
  const valoreMio = voce.carta.statistiche[stat];

  const esitoEl = document.getElementById("idra-esito-turno");
  if (esitoEl) esitoEl.innerHTML = `<span class="cavalle-galoppo">🐍</span> L'Idra solleva ${numeroTurno} test${numeroTurno === 1 ? "a" : "e"}...`;
  await attendiIdra(900);

  const vittoria = valoreMio > sommaNemica;

  if (esitoEl) {
    esitoEl.innerHTML = vittoria
      ? `<span class="cavalle-flash-vittoria">✅ Test${numeroTurno > 1 ? "e recise" : "a recisa"}!</span>`
      : `<span class="cavalle-flash-sconfitta">💥 L'Idra ha la meglio!</span>`;
  }
  await attendiIdra(550);

  voce.usata = true;
  if (idraRosterAttiva.every(r => r.usata)) idraRosterAttiva.forEach(r => r.usata = false);

  if (vittoria) {
    if (numeroTurno >= 5) segnaFaticaCompletata("idra");
    if (numeroTurno === 10) {
      idraTotaleFrammentiRun += 3;
      ambraAttuale += 3;
      idraGiocoFinito = true;
      idraEsitoTesto = `🏆 Hai reciso tutte e dieci le teste dell'Idra! Bottino di questo tentativo: ${idraTotaleDracmeRun} Dracme, ${idraTotaleFrammentiRun} Frammenti d'Ambra.`;
    } else if (numeroTurno === 9) {
      idraTotaleFrammentiRun += 1;
      ambraAttuale += 1;
      idraTurnoAttuale++;
    } else {
      const premio = IDRA_PREMI_DRACME[idraTurnoAttuale];
      idraTotaleDracmeRun += premio;
      dracmeAttuali += premio;
      idraTurnoAttuale++;
    }
  } else {
    idraGiocoFinito = true;
    idraEsitoTesto = `L'Idra ti ha fermato alla testa numero ${numeroTurno}. Bottino di questo tentativo: ${idraTotaleDracmeRun} Dracme${idraTotaleFrammentiRun > 0 ? `, ${idraTotaleFrammentiRun} Frammenti d'Ambra` : ""}.`;
  }

  aggiornaTopbarProfilo();
  salvaProgressoCloud();

  idraBloccaClick = false;
  renderContenutoFatiche();
}

function chiudiPartitaIdra() {
  idraInPartita = false;
  idraGiocoFinito = false;
  idraRosterAttiva = [];
  renderContenutoFatiche();
}

function htmlSchermataIdra() {
  assicuraStatoIdra();

  const statOggi = statisticaGiornalieraIdra();
  const nomeStatOggi = IDRA_NOMI_STAT[statOggi];

  if (!idraInPartita) {
    const tentativiRimasti = IDRA_TENTATIVI_MAX - idraStato.tentativiOggi;
    const disponibile = tentativiRimasti > 0;

    const eleggibili = carteEleggibiliIdra();
    let selettoriHTML = "";
    let livelliDisponibili = 0;

    for (let lvl = 1; lvl <= 6; lvl++) {
      const carteLivello = eleggibili.filter(c => c.livello === lvl).sort((a, b) => b.statistiche[statOggi] - a.statistiche[statOggi]);
      if (carteLivello.length === 0) continue;
      livelliDisponibili++;
      const opzioni = carteLivello.map(c => `<option value="${c.id}">${c.nome} — ${nomeStatOggi}: ${c.statistiche[statOggi].toFixed(1)}</option>`).join("");
      selettoriHTML += `
        <div style="display:flex; flex-direction:column; gap:2px; width:100%; max-width:380px;">
          <label style="font-size:0.68rem; color:#a89a7a;">Livello ${lvl} — ${IDRA_NOMI_RARITA[lvl]}</label>
          <select class="deploy-select idra-select-livello" style="padding:6px; font-size:0.78rem;">${opzioni}</select>
        </div>`;
    }

    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:10px; padding:14px; overflow-y:auto;">
        <div style="background:rgba(15,10,5,0.6); border-radius:10px; padding:12px; color:#e0d5c1; font-size:0.82rem; max-width:380px; text-align:center;">
          <p style="color:#c9a054; font-style:italic; margin-bottom:6px;">Per ogni testa mozzata dell'Idra di Lerna, due ne ricrescevano al suo posto: solo bruciando le ferite col fuoco, Eracle riuscì infine a fermarne la rigenerazione.</p>
          <p>Oggi l'Idra misura la <b>${nomeStatOggi}</b>. Scegli una creatura per ogni livello che possiedi: ad ogni testa deciderai quale schierare, ma ogni creatura va usata almeno una volta prima di poterla riusare. Oltre il settimo turno servono creature davvero potenti.</p>
        </div>
        ${livelliDisponibili > 0 ? selettoriHTML : `<p style="color:#a89a7a;">Non hai creature disponibili al momento.</p>`}
        <button type="button" id="idra-inizia-btn" class="events-btn events-btn-main" style="max-width:260px;" ${(!disponibile || livelliDisponibili === 0) ? "disabled" : ""}>
          ${disponibile ? "🐍 Affronta l'Idra" : "Nessun tentativo rimasto oggi"}
        </button>
        <p style="color:#a89a7a; font-size:0.8rem;">Tentativi rimasti oggi: <b style="color:#ffcc66;">${tentativiRimasti} / ${IDRA_TENTATIVI_MAX}</b></p>
      </div>`;
  }

  if (idraGiocoFinito) {
    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:16px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:12px; padding:20px; color:#e0d5c1; font-size:0.95rem; max-width:380px; text-align:center;">
          ${idraEsitoTesto}
        </div>
        <button type="button" id="idra-chiudi-btn" class="events-btn events-btn-main" style="max-width:240px;">Continua</button>
      </div>`;
  }

  const numeroTurno = idraTurnoAttuale + 1;

  const rosterHTML = idraRosterAttiva.map((voce, idx) => `
    <button type="button" class="idra-carta-turno-btn${voce.usata ? " idra-carta-esaurita" : ""}" data-indice="${idx}" ${voce.usata ? "disabled" : ""}>
      <span class="idra-carta-turno-nome">${voce.carta.nome}</span>
      <span class="idra-carta-turno-livello">Lvl ${voce.carta.livello}</span>
      <span class="idra-carta-turno-valore">${nomeStatOggi}: ${voce.carta.statistiche[statOggi].toFixed(1)}</span>
      ${voce.usata ? `<span class="idra-carta-turno-tag">In rotazione</span>` : ""}
    </button>`).join("");

  return `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:10px; padding:14px;">
      <div style="background:rgba(15,10,5,0.6); border-radius:10px; padding:10px 14px; color:#e0d5c1; font-size:0.85rem; max-width:420px; text-align:center;">
        <p style="font-size:1rem; color:#ffcc66; font-weight:bold; margin-bottom:4px;">🐍 Testa numero ${numeroTurno} di 10</p>
        <p style="color:#c9a054;">Bottino accumulato: ${idraTotaleDracmeRun} Dracme${idraTotaleFrammentiRun > 0 ? `, ${idraTotaleFrammentiRun} Frammenti` : ""}</p>
      </div>
      <div id="idra-esito-turno" style="min-height:22px; color:#ffcc66; font-weight:bold; font-size:0.9rem;"></div>
      <p style="color:#a89a7a; font-size:0.75rem;">Scegli quale creatura schierare in questo turno:</p>
      <div class="idra-roster-turno">${rosterHTML}</div>
    </div>`;
}

function collegaEventiIdra() {
  document.getElementById("idra-inizia-btn")?.addEventListener("click", iniziaPartitaIdra);
  document.getElementById("idra-chiudi-btn")?.addEventListener("click", chiudiPartitaIdra);

  document.querySelectorAll(".idra-carta-turno-btn").forEach(btn => {
    btn.addEventListener("click", () => affrontaTurnoIdra(parseInt(btn.dataset.indice)));
  });
}

// ===== "La Trappola nella Neve": scavi con indizi via via più precisi (Quarta Fatica) =====

let trappolaStato = { tentativiOggi: 0, dataUltimoTentativo: "" };

const TRAPPOLA_TENTATIVI_MAX = 1;
const TRAPPOLA_DIMENSIONE = 4;
const TRAPPOLA_PREMI = {
  1: { dracme: 150, frammenti: 1 },
  2: { dracme: 80, frammenti: 0 },
  3: { dracme: 30, frammenti: 0 }
};

let trappolaInPartita = false;
let trappolaGiocoFinito = false;
let trappolaPosizioneCinghiale = null;
let trappolaScavoAttuale = 1;
let trappolaCandidate = [];
let trappolaCelleEscluse = [];
let trappolaEsitoTesto = "";
let trappolaIndizioTesto = "";
let trappolaBloccaClick = false;

function dataOggiStringaTrappola() { return new Date().toISOString().slice(0, 10); }

function assicuraStatoTrappola() {
  const oggi = dataOggiStringaTrappola();
  if (trappolaStato.dataUltimoTentativo !== oggi) {
    trappolaStato.tentativiOggi = 0;
    trappolaStato.dataUltimoTentativo = oggi;
  }
}

function attendiTrappola(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function tutteLeCelleTrappola() {
  const celle = [];
  for (let r = 0; r < TRAPPOLA_DIMENSIONE; r++) {
    for (let c = 0; c < TRAPPOLA_DIMENSIONE; c++) celle.push({ r, c });
  }
  return celle;
}

function cellaInEsclusiTrappola(cella) {
  return trappolaCelleEscluse.some(e => e.r === cella.r && e.c === cella.c);
}

function iniziaPartitaTrappola() {
  assicuraStatoTrappola();
  if (trappolaStato.tentativiOggi >= TRAPPOLA_TENTATIVI_MAX) return;

  trappolaStato.tentativiOggi++;
  salvaProgressoCloud();

  trappolaPosizioneCinghiale = {
    r: Math.floor(Math.random() * TRAPPOLA_DIMENSIONE),
    c: Math.floor(Math.random() * TRAPPOLA_DIMENSIONE)
  };
  trappolaScavoAttuale = 1;
  trappolaCandidate = tutteLeCelleTrappola();
  trappolaCelleEscluse = [];
  trappolaIndizioTesto = "";
  trappolaInPartita = true;
  trappolaGiocoFinito = false;

  renderContenutoFatiche();
}

async function scavaCellaTrappola(r, c) {
  if (trappolaBloccaClick) return;
  trappolaBloccaClick = true;

  const el = document.querySelector(`.trappola-cella[data-r="${r}"][data-c="${c}"]`);

  const trovato = r === trappolaPosizioneCinghiale.r && c === trappolaPosizioneCinghiale.c;

  if (trovato) {

    el?.classList.add("cavalle-flash-vittoria");
    await attendiTrappola(700);

    const premio = TRAPPOLA_PREMI[trappolaScavoAttuale];
    dracmeAttuali += premio.dracme;
    if (premio.frammenti > 0) ambraAttuale += premio.frammenti;
    if (trappolaScavoAttuale <= 2) segnaFaticaCompletata("trappola");

    trappolaEsitoTesto = `🐗 Il cinghiale è tuo! Trovato al ${trappolaScavoAttuale}° scavo: +${premio.dracme} Dracme${premio.frammenti > 0 ? ` e +${premio.frammenti} Frammento d'Ambra` : ""}.`;
    trappolaGiocoFinito = true;
    aggiornaTopbarProfilo();
    salvaProgressoCloud();
    trappolaBloccaClick = false;
    renderContenutoFatiche();
    return;
  }

  el?.classList.add("cavalle-flash-sconfitta");
  trappolaCelleEscluse.push({ r, c });
  await attendiTrappola(700);

  if (trappolaScavoAttuale === 1) {

    const perRiga = Math.random() < 0.5;
    trappolaCandidate = tutteLeCelleTrappola().filter(cella =>
      perRiga ? cella.r === trappolaPosizioneCinghiale.r : cella.c === trappolaPosizioneCinghiale.c
    );
    trappolaIndizioTesto = perRiga
      ? `Le impronte conducono verso la riga ${trappolaPosizioneCinghiale.r + 1}.`
      : `Le impronte conducono verso la colonna ${trappolaPosizioneCinghiale.c + 1}.`;
    trappolaScavoAttuale = 2;

  } else if (trappolaScavoAttuale === 2) {

    trappolaCandidate = [trappolaPosizioneCinghiale];
    trappolaIndizioTesto = "Le tracce non lasciano più dubbi: eccolo!";
    trappolaScavoAttuale = 3;

  }

  trappolaBloccaClick = false;
  renderContenutoFatiche();
}

function chiudiPartitaTrappola() {
  trappolaInPartita = false;
  trappolaGiocoFinito = false;
  renderContenutoFatiche();
}

function htmlSchermataTrappola() {
  assicuraStatoTrappola();

  if (!trappolaInPartita) {
    const tentativiRimasti = TRAPPOLA_TENTATIVI_MAX - trappolaStato.tentativiOggi;
    const disponibile = tentativiRimasti > 0;

    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:14px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:10px; padding:14px; color:#e0d5c1; font-size:0.85rem; max-width:400px; text-align:center;">
          <p style="color:#c9a054; font-style:italic; margin-bottom:8px;">Il Cinghiale d'Erimanto seminava il terrore tra i monti dell'Arcadia: Eracle non lo uccise, ma lo inseguì fino a stancarlo nella neve alta, catturandolo vivo per portarlo a Micene — dove il re Euristeo, terrorizzato, si nascose in una giara di bronzo.</p>
          <p>Scava tra i cumuli di neve: se sbagli, le tracce ti guideranno sempre più vicino. Hai al massimo <b>3 scavi</b>, ma prima lo trovi più ricco sarà il bottino.</p>
        </div>
        <button type="button" id="trappola-inizia-btn" class="events-btn events-btn-main" style="max-width:260px;" ${disponibile ? "" : "disabled"}>
          ${disponibile ? "🐗 Segui le tracce" : "Nessun tentativo rimasto oggi"}
        </button>
        <p style="color:#a89a7a; font-size:0.8rem;">Tentativi rimasti oggi: <b style="color:#ffcc66;">${tentativiRimasti} / ${TRAPPOLA_TENTATIVI_MAX}</b></p>
      </div>`;
  }

  if (trappolaGiocoFinito) {
    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:16px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:12px; padding:20px; color:#e0d5c1; font-size:0.95rem; max-width:380px; text-align:center;">
          ${trappolaEsitoTesto}
        </div>
        <button type="button" id="trappola-chiudi-btn" class="events-btn events-btn-main" style="max-width:240px;">Continua</button>
      </div>`;
  }

  let celleHTML = "";
  for (let r = 0; r < TRAPPOLA_DIMENSIONE; r++) {
    for (let c = 0; c < TRAPPOLA_DIMENSIONE; c++) {
      const cella = { r, c };
      const esclusa = cellaInEsclusiTrappola(cella);
      const candidata = trappolaCandidate.some(cc => cc.r === r && cc.c === c);
      const classi = "trappola-cella"
        + (esclusa ? " trappola-cella-esclusa" : "")
        + (candidata && !esclusa ? " trappola-cella-candidata" : "")
        + (!candidata && !esclusa ? " trappola-cella-inattiva" : "");
      celleHTML += `<button type="button" class="${classi}" data-r="${r}" data-c="${c}" ${(candidata && !esclusa) ? "" : "disabled"}>${esclusa ? "🕳️" : "❄️"}</button>`;
    }
  }

  return `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:10px; padding:10px;">
      <div style="color:#e0d5c1; font-size:0.85rem;">Scavo <b style="color:#ffcc66;">${trappolaScavoAttuale}</b> / 3</div>
      ${trappolaIndizioTesto ? `<div style="color:#ffcc66; font-weight:bold; font-size:0.85rem; text-align:center; max-width:360px;">${trappolaIndizioTesto}</div>` : ""}
      <div class="trappola-griglia">${celleHTML}</div>
    </div>`;
}

function collegaEventiTrappola() {
  document.getElementById("trappola-inizia-btn")?.addEventListener("click", iniziaPartitaTrappola);
  document.getElementById("trappola-chiudi-btn")?.addEventListener("click", chiudiPartitaTrappola);

  document.querySelectorAll(".trappola-cella-candidata").forEach(btn => {
    btn.addEventListener("click", () => scavaCellaTrappola(parseInt(btn.dataset.r), parseInt(btn.dataset.c)));
  });
}

// ===== "Il Toro Furioso": tempismo su barra a moto oscillante (Settima Fatica) =====

let toroStato = { tentativiOggi: 0, dataUltimoTentativo: "" };

const TORO_TENTATIVI_MAX = 1;
const TORO_VITE_MAX = 3;
const TORO_PREMI = [
  { soglia: 12, dracme: 250 },
  { soglia: 9, dracme: 150 },
  { soglia: 6, dracme: 80 },
  { soglia: 3, dracme: 35 },
  { soglia: 1, dracme: 10 }
];

let toroInPartita = false;
let toroGiocoFinito = false;
let toroRoundAttuale = 1;
let toroViteRimaste = TORO_VITE_MAX;
let toroCentroZona = 50;
let toroLarghezzaZona = 30;
let toroInizioRoundTs = 0;
let toroEsitoTesto = "";
let toroBloccaClick = false;

function dataOggiStringaToro() { return new Date().toISOString().slice(0, 10); }

function assicuraStatoToro() {
  const oggi = dataOggiStringaToro();
  if (toroStato.dataUltimoTentativo !== oggi) {
    toroStato.tentativiOggi = 0;
    toroStato.dataUltimoTentativo = oggi;
  }
}

function attendiToro(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function periodoToro(round) {
  return Math.max(700, 2400 - (round - 1) * 150);
}

function larghezzaToro(round) {
  return Math.max(10, 30 - (round - 1) * 2);
}

function calcolaPremioToro(roundSuperati) {
  for (const p of TORO_PREMI) if (roundSuperati >= p.soglia) return p.dracme;
  return 0;
}

function posizioneMarcatoreToro(elapsedMs, periodoMs) {
  const ciclo = (elapsedMs % periodoMs) / periodoMs;
  return ciclo < 0.5 ? ciclo * 2 * 100 : (1 - ciclo) * 2 * 100;
}

function iniziaPartitaToro() {
  assicuraStatoToro();
  if (toroStato.tentativiOggi >= TORO_TENTATIVI_MAX) return;

  toroStato.tentativiOggi++;
  salvaProgressoCloud();

  toroRoundAttuale = 1;
  toroViteRimaste = TORO_VITE_MAX;
  toroInPartita = true;
  toroGiocoFinito = false;

  avviaRoundToro();
}

function avviaRoundToro() {
  toroCentroZona = 20 + Math.random() * 60;
  toroLarghezzaZona = larghezzaToro(toroRoundAttuale);
  toroInizioRoundTs = Date.now();
  renderContenutoFatiche();
}

async function tentaAfferraToro() {
  if (toroBloccaClick) return;
  toroBloccaClick = true;

  const periodo = periodoToro(toroRoundAttuale);
  const elapsed = Date.now() - toroInizioRoundTs;
  const posizione = posizioneMarcatoreToro(elapsed, periodo);
  const meta = toroLarghezzaZona / 2;
  const successo = posizione >= (toroCentroZona - meta) && posizione <= (toroCentroZona + meta);

  const esitoEl = document.getElementById("toro-esito-round");
  if (esitoEl) {
    esitoEl.innerHTML = successo
      ? `<span class="cavalle-flash-vittoria">✅ Corna afferrate!</span>`
      : `<span class="cavalle-flash-sconfitta">💥 Il toro si divincola!</span>`;
  }

  if (successo) toroRoundAttuale++;
  else toroViteRimaste--;

  await attendiToro(600);

  if (toroViteRimaste <= 0) {
    const roundSuperati = toroRoundAttuale - 1;
    const premio = calcolaPremioToro(roundSuperati);
    dracmeAttuali += premio;
    if (roundSuperati >= 6) segnaFaticaCompletata("toro");
    toroGiocoFinito = true;
    toroEsitoTesto = `Il Toro di Creta ti ha disarcionato dopo ${roundSuperati} round superati. Premio: ${premio} Dracme.`;
    aggiornaTopbarProfilo();
    salvaProgressoCloud();
    toroBloccaClick = false;
    renderContenutoFatiche();
  } else {
    toroBloccaClick = false;
    avviaRoundToro();
  }
}

function chiudiPartitaToro() {
  toroInPartita = false;
  toroGiocoFinito = false;
  renderContenutoFatiche();
}

function htmlSchermataToro() {
  assicuraStatoToro();

  if (!toroInPartita) {
    const tentativiRimasti = TORO_TENTATIVI_MAX - toroStato.tentativiOggi;
    const disponibile = tentativiRimasti > 0;

    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:14px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:10px; padding:14px; color:#e0d5c1; font-size:0.85rem; max-width:380px; text-align:center;">
          <p style="color:#c9a054; font-style:italic; margin-bottom:8px;">Il Toro di Creta devastava l'isola sputando fuoco: Eracle non lo uccise, ma lo domò a mani nude afferrandolo per le corna, per poi portarlo vivo fino a Micene.</p>
          <p>Tocca "Afferra le corna!" quando il segnale è dentro la zona verde. Ogni volta che riesci, il toro diventa più furioso: la zona si restringe e il segnale accelera. Hai <b>3 vite</b>.</p>
        </div>
        <button type="button" id="toro-inizia-btn" class="events-btn events-btn-main" style="max-width:260px;" ${disponibile ? "" : "disabled"}>
          ${disponibile ? "🐂 Affronta il Toro" : "Nessun tentativo rimasto oggi"}
        </button>
        <p style="color:#a89a7a; font-size:0.8rem;">Tentativi rimasti oggi: <b style="color:#ffcc66;">${tentativiRimasti} / ${TORO_TENTATIVI_MAX}</b></p>
      </div>`;
  }

  if (toroGiocoFinito) {
    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:16px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:12px; padding:20px; color:#e0d5c1; font-size:0.95rem; max-width:380px; text-align:center;">
          ${toroEsitoTesto}
        </div>
        <button type="button" id="toro-chiudi-btn" class="events-btn events-btn-main" style="max-width:240px;">Continua</button>
      </div>`;
  }

  return `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:14px; padding:14px;">
      <div style="display:flex; justify-content:space-between; width:100%; max-width:380px; color:#e0d5c1; font-size:0.85rem;">
        <span>Round <b style="color:#ffcc66;">${toroRoundAttuale}</b></span>
        <span>${"❤️".repeat(toroViteRimaste)}</span>
      </div>
      <div id="toro-esito-round" style="min-height:22px; color:#ffcc66; font-weight:bold; font-size:0.9rem;"></div>
      <div class="toro-barra">
        <div class="toro-zona-bersaglio" style="left:${toroCentroZona - toroLarghezzaZona / 2}%; width:${toroLarghezzaZona}%;"></div>
        <div class="toro-marcatore" style="animation-duration:${periodoToro(toroRoundAttuale)}ms;"></div>
      </div>
      <button type="button" id="toro-afferra-btn" class="events-btn events-btn-main" style="max-width:260px;">🐂 Afferra le corna!</button>
    </div>`;
}

function collegaEventiToro() {
  document.getElementById("toro-inizia-btn")?.addEventListener("click", iniziaPartitaToro);
  document.getElementById("toro-chiudi-btn")?.addEventListener("click", chiudiPartitaToro);
  document.getElementById("toro-afferra-btn")?.addEventListener("click", tentaAfferraToro);
}

// ===== "Il Dono dell'Amazzone": quiz di mitologia basato sulle schede lore del gioco (Nona Fatica) =====

let amazzoneStato = { tentativiOggi: 0, dataUltimoTentativo: "" };

const AMAZZONE_TENTATIVI_MAX = 3;
const AMAZZONE_DOMANDE_TOTALI = 5;
const AMAZZONE_DRACME_PARTECIPAZIONE = 20;
const AMAZZONE_DRACME_PER_RISPOSTA = 15;
const AMAZZONE_FRAMMENTO_BONUS_PERFETTO = 1;

let amazzoneInPartita = false;
let amazzoneGiocoFinito = false;
let amazzoneDomande = [];
let amazzoneIndiceDomanda = 0;
let amazzoneRisposteCorrette = 0;
let amazzoneBloccaClick = false;
let amazzoneEsitoTesto = "";

function dataOggiStringaAmazzone() { return new Date().toISOString().slice(0, 10); }

function assicuraStatoAmazzone() {
  const oggi = dataOggiStringaAmazzone();
  if (amazzoneStato.dataUltimoTentativo !== oggi) {
    amazzoneStato.tentativiOggi = 0;
    amazzoneStato.dataUltimoTentativo = oggi;
  }
}

function attendiAmazzone(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generaDomandaAmazzone(nomiEsclusi) {
  const carteConLore = CARTE_FISSE.filter(c => LORE_CARTE[c.nome] && !nomiEsclusi.includes(c.nome));
  if (carteConLore.length === 0) return null;

  const carta = carteConLore[Math.floor(Math.random() * carteConLore.length)];
  const testo = LORE_CARTE[carta.nome];

  const altriNomi = CARTE_FISSE.map(c => c.nome).filter(n => n !== carta.nome);
  const distrattori = [];
  while (distrattori.length < 3 && altriNomi.length > 0) {
    const idx = Math.floor(Math.random() * altriNomi.length);
    const nome = altriNomi.splice(idx, 1)[0];
    if (!distrattori.includes(nome)) distrattori.push(nome);
  }

  const opzioni = [carta.nome, ...distrattori].sort(() => Math.random() - 0.5);

  return { nomeCorretto: carta.nome, testo, opzioni };
}

function iniziaPartitaAmazzone() {
  assicuraStatoAmazzone();
  if (amazzoneStato.tentativiOggi >= AMAZZONE_TENTATIVI_MAX) return;

  amazzoneStato.tentativiOggi++;
  salvaProgressoCloud();

  amazzoneDomande = [];
  const nomiUsati = [];
  for (let i = 0; i < AMAZZONE_DOMANDE_TOTALI; i++) {
    const domanda = generaDomandaAmazzone(nomiUsati);
    if (!domanda) break;
    amazzoneDomande.push(domanda);
    nomiUsati.push(domanda.nomeCorretto);
  }

  amazzoneIndiceDomanda = 0;
  amazzoneRisposteCorrette = 0;
  amazzoneInPartita = true;
  amazzoneGiocoFinito = false;
  amazzoneEsitoTesto = "";

  renderContenutoFatiche();
}

async function rispondiAmazzone(nomeScelto) {
  if (amazzoneBloccaClick) return;
  amazzoneBloccaClick = true;

  const domanda = amazzoneDomande[amazzoneIndiceDomanda];
  const corretta = nomeScelto === domanda.nomeCorretto;
  if (corretta) amazzoneRisposteCorrette++;

  document.querySelectorAll(".amazzone-opzione-btn").forEach(btn => {
    if (btn.dataset.nome === domanda.nomeCorretto) btn.classList.add("cavalle-flash-vittoria");
    else if (btn.dataset.nome === nomeScelto) btn.classList.add("cavalle-flash-sconfitta");
  });

  await attendiAmazzone(1000);

  amazzoneIndiceDomanda++;

  if (amazzoneIndiceDomanda >= amazzoneDomande.length) {
    const dracmeVinte = AMAZZONE_DRACME_PARTECIPAZIONE + amazzoneRisposteCorrette * AMAZZONE_DRACME_PER_RISPOSTA;
    dracmeAttuali += dracmeVinte;
    if (amazzoneRisposteCorrette >= 3) segnaFaticaCompletata("amazzone");
    let testoFinale = `Hai risposto correttamente a ${amazzoneRisposteCorrette} domande su ${amazzoneDomande.length}. Guadagni ${dracmeVinte} Dracme.`;
    if (amazzoneRisposteCorrette === amazzoneDomande.length) {
      ambraAttuale += AMAZZONE_FRAMMENTO_BONUS_PERFETTO;
      testoFinale += ` Punteggio pieno! +${AMAZZONE_FRAMMENTO_BONUS_PERFETTO} Frammento d'Ambra.`;
    }
    amazzoneEsitoTesto = testoFinale;
    amazzoneGiocoFinito = true;
    aggiornaTopbarProfilo();
    salvaProgressoCloud();
  }

  amazzoneBloccaClick = false;
  renderContenutoFatiche();
}

function chiudiPartitaAmazzone() {
  amazzoneInPartita = false;
  amazzoneGiocoFinito = false;
  amazzoneDomande = [];
  renderContenutoFatiche();
}

function htmlSchermataAmazzone() {
  assicuraStatoAmazzone();

  if (!amazzoneInPartita) {
    const tentativiRimasti = AMAZZONE_TENTATIVI_MAX - amazzoneStato.tentativiOggi;
    const disponibile = tentativiRimasti > 0;

    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:14px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:10px; padding:14px; color:#e0d5c1; font-size:0.85rem; max-width:400px; text-align:center;">
          <p style="color:#c9a054; font-style:italic; margin-bottom:8px;">Ippolita, regina delle Amazzoni, possedeva una cintura magica donatale da Ares stesso: Eracle fu inviato a conquistarla, e solo l'intervento di Era trasformò un dono volontario in uno scontro sanguinoso.</p>
          <p>${AMAZZONE_DOMANDE_TOTALI} domande di mitologia, tratte dalle schede che hai già scoperto in Mythophedia: un premio garantito per la partecipazione, un bonus per ogni risposta giusta.</p>
        </div>
        <button type="button" id="amazzone-inizia-btn" class="events-btn events-btn-main" style="max-width:260px;" ${disponibile ? "" : "disabled"}>
          ${disponibile ? "🏹 Ricevi il dono" : "Nessun tentativo rimasto oggi"}
        </button>
        <p style="color:#a89a7a; font-size:0.8rem;">Tentativi rimasti oggi: <b style="color:#ffcc66;">${tentativiRimasti} / ${AMAZZONE_TENTATIVI_MAX}</b></p>
      </div>`;
  }

  if (amazzoneGiocoFinito) {
    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:16px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:12px; padding:20px; color:#e0d5c1; font-size:0.95rem; max-width:400px; text-align:center;">
          ${amazzoneEsitoTesto}
        </div>
        <button type="button" id="amazzone-chiudi-btn" class="events-btn events-btn-main" style="max-width:240px;">Continua</button>
      </div>`;
  }

  const domanda = amazzoneDomande[amazzoneIndiceDomanda];
  const opzioniHTML = domanda.opzioni.map(nome => `
    <button type="button" class="amazzone-opzione-btn" data-nome="${nome}">${nome}</button>
  `).join("");

  return `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:12px; padding:14px;">
      <div style="display:flex; justify-content:space-between; width:100%; max-width:460px; color:#e0d5c1; font-size:0.82rem;">
        <span>Domanda <b style="color:#ffcc66;">${amazzoneIndiceDomanda + 1}</b> / ${amazzoneDomande.length}</span>
        <span>Corrette: <b style="color:#ffcc66;">${amazzoneRisposteCorrette}</b></span>
      </div>
      <div style="background:rgba(15,10,5,0.6); border-radius:10px; padding:14px; color:#e0d5c1; font-size:0.85rem; max-width:460px; text-align:center;">
        <p style="color:#c9a054; font-weight:bold; margin-bottom:6px;">Quale creatura è descritta qui?</p>
        <p>${domanda.testo}</p>
      </div>
      <div class="amazzone-opzioni-griglia">${opzioniHTML}</div>
    </div>`;
}

function collegaEventiAmazzone() {
  document.getElementById("amazzone-inizia-btn")?.addEventListener("click", iniziaPartitaAmazzone);
  document.getElementById("amazzone-chiudi-btn")?.addEventListener("click", chiudiPartitaAmazzone);

  document.querySelectorAll(".amazzone-opzione-btn").forEach(btn => {
    btn.addEventListener("click", () => rispondiAmazzone(btn.dataset.nome));
  });
}

// ===== "Il Furto del Gregge": avanza solo quando il guardiano non guarda (Decima Fatica) =====

let furtoStato = { tentativiOggi: 0, dataUltimoTentativo: "" };

const FURTO_TENTATIVI_MAX = 3;
const FURTO_TAPPE_TOTALI = 13;
const FURTO_INTERVALLO_MIN_MS = 550;
const FURTO_INTERVALLO_MAX_MS = 1500;

const FURTO_PREMI = [
  { soglia: 13, dracme: 260, frammenti: 1 },
  { soglia: 10, dracme: 150, frammenti: 0 },
  { soglia: 7, dracme: 90, frammenti: 0 },
  { soglia: 4, dracme: 35, frammenti: 0 },
  { soglia: 1, dracme: 10, frammenti: 0 }
];

let furtoInPartita = false;
let furtoGiocoFinito = false;
let furtoTappaAttuale = 0;
let furtoGuardianoDistratto = true;
let furtoTimeoutId = null;
let furtoEsitoTesto = "";
let furtoBloccaClick = false;

function dataOggiStringaFurto() { return new Date().toISOString().slice(0, 10); }

function assicuraStatoFurto() {
  const oggi = dataOggiStringaFurto();
  if (furtoStato.dataUltimoTentativo !== oggi) {
    furtoStato.tentativiOggi = 0;
    furtoStato.dataUltimoTentativo = oggi;
  }
}

function calcolaPremioFurto(tappe) {
  for (const p of FURTO_PREMI) if (tappe >= p.soglia) return p;
  return { dracme: 0, frammenti: 0 };
}

function fermaCicloFurto() {
  if (furtoTimeoutId) { clearTimeout(furtoTimeoutId); furtoTimeoutId = null; }
}

// Aggiorna SOLO l'icona e il testo del guardiano, senza mai ricostruire tutta la schermata:
// il bottone "Avanza" deve restare sempre lo stesso elemento, pronto a rispondere all'istante.
function aggiornaVisualeGuardianoFurto() {
  const icona = document.getElementById("furto-guardiano-icona");
  const testo = document.getElementById("furto-stato-testo");
  if (!icona || !testo) return;
  icona.className = "furto-guardiano " + (furtoGuardianoDistratto ? "furto-guardiano-distratto" : "furto-guardiano-attento");
  icona.innerText = furtoGuardianoDistratto ? "🐕‍🦺" : "👀";
  testo.style.color = furtoGuardianoDistratto ? "#7ee787" : "#f56565";
  testo.innerText = furtoGuardianoDistratto ? "Via libera: avanza ora!" : "Ortro ti sta guardando!";
}

function programmaCambioGuardiano() {
  fermaCicloFurto();
  const attesa = FURTO_INTERVALLO_MIN_MS + Math.random() * (FURTO_INTERVALLO_MAX_MS - FURTO_INTERVALLO_MIN_MS);
  furtoTimeoutId = setTimeout(() => {
    furtoGuardianoDistratto = !furtoGuardianoDistratto;
    aggiornaVisualeGuardianoFurto();
    if (furtoInPartita) programmaCambioGuardiano();
  }, attesa);
}

function iniziaPartitaFurto() {
  assicuraStatoFurto();
  if (furtoStato.tentativiOggi >= FURTO_TENTATIVI_MAX) return;

  furtoStato.tentativiOggi++;
  salvaProgressoCloud();

  furtoInPartita = true;
  furtoGiocoFinito = false;
  furtoTappaAttuale = 0;
  furtoGuardianoDistratto = true;

  renderContenutoFatiche();

  programmaCambioGuardiano();
}

function terminaFurto(catturato) {
  fermaCicloFurto();
  furtoInPartita = false;
  furtoGiocoFinito = true;

  const premio = calcolaPremioFurto(furtoTappaAttuale);
  dracmeAttuali += premio.dracme;
  if (premio.frammenti > 0) ambraAttuale += premio.frammenti;
  if (furtoTappaAttuale >= 8) segnaFaticaCompletata("gregge");

  furtoEsitoTesto = catturato
    ? `Ortro si è voltato e ti ha scoperto dopo ${furtoTappaAttuale} passi. Bottino: ${premio.dracme} Dracme${premio.frammenti > 0 ? ` e ${premio.frammenti} Frammento d'Ambra` : ""}.`
    : `🏆 Hai condotto l'intero gregge fino in Grecia, senza farti scoprire! Bottino: ${premio.dracme} Dracme e ${premio.frammenti} Frammento d'Ambra.`;

  aggiornaTopbarProfilo();
  salvaProgressoCloud();
  renderContenutoFatiche();
}

async function avanzaFurto() {
  if (furtoBloccaClick || !furtoInPartita) return;
  furtoBloccaClick = true;

  if (!furtoGuardianoDistratto) {
    terminaFurto(true);
    furtoBloccaClick = false;
    return;
  }

  furtoTappaAttuale++;

  if (furtoTappaAttuale >= FURTO_TAPPE_TOTALI) {
    terminaFurto(false);
    furtoBloccaClick = false;
    return;
  }

  const contatore = document.getElementById("furto-contatore-passo");
  if (contatore) contatore.innerText = furtoTappaAttuale;

  furtoBloccaClick = false;
}

function chiudiPartitaFurto() {
  fermaCicloFurto();
  furtoInPartita = false;
  furtoGiocoFinito = false;
  renderContenutoFatiche();
}

function htmlSchermataFurto() {
  assicuraStatoFurto();

  if (!furtoInPartita && !furtoGiocoFinito) {
    const tentativiRimasti = FURTO_TENTATIVI_MAX - furtoStato.tentativiOggi;
    const disponibile = tentativiRimasti > 0;

    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:14px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:10px; padding:14px; color:#e0d5c1; font-size:0.85rem; max-width:380px; text-align:center;">
          <p style="color:#c9a054; font-style:italic; margin-bottom:8px;">Il gigante Gerione custodiva i suoi buoi rossi con Ortro, il cane a due teste: Eracle dovette condurre l'intera mandria in un lunghissimo viaggio fino in Grecia, senza mai farsi sorprendere.</p>
          <p>Tocca "Avanza" solo quando Ortro guarda altrove. Se lo tocchi mentre ti fissa, vieni scoperto. Servono <b>${FURTO_TAPPE_TOTALI} passi</b> per completare il viaggio.</p>
        </div>
        <button type="button" id="furto-inizia-btn" class="events-btn events-btn-main" style="max-width:260px;" ${disponibile ? "" : "disabled"}>
          ${disponibile ? "🐂 Inizia il lungo viaggio" : "Nessun tentativo rimasto oggi"}
        </button>
        <p style="color:#a89a7a; font-size:0.8rem;">Tentativi rimasti oggi: <b style="color:#ffcc66;">${tentativiRimasti} / ${FURTO_TENTATIVI_MAX}</b></p>
      </div>`;
  }

  if (furtoGiocoFinito) {
    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:16px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:12px; padding:20px; color:#e0d5c1; font-size:0.95rem; max-width:380px; text-align:center;">
          ${furtoEsitoTesto}
        </div>
        <button type="button" id="furto-chiudi-btn" class="events-btn events-btn-main" style="max-width:240px;">Continua</button>
      </div>`;
  }

  return `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:16px; padding:14px;">
      <div style="color:#e0d5c1; font-size:0.85rem;">Passo <b id="furto-contatore-passo" style="color:#ffcc66;">${furtoTappaAttuale}</b> / ${FURTO_TAPPE_TOTALI}</div>
      <div id="furto-guardiano-icona" class="furto-guardiano ${furtoGuardianoDistratto ? "furto-guardiano-distratto" : "furto-guardiano-attento"}">
        ${furtoGuardianoDistratto ? "🐕‍🦺" : "👀"}
      </div>
      <div id="furto-stato-testo" style="color:${furtoGuardianoDistratto ? "#7ee787" : "#f56565"}; font-weight:bold; font-size:0.95rem;">
        ${furtoGuardianoDistratto ? "Via libera: avanza ora!" : "Ortro ti sta guardando!"}
      </div>
      <button type="button" id="furto-avanza-btn" class="events-btn events-btn-main" style="max-width:260px;">🐂 Avanza</button>
    </div>`;
}

function collegaEventiFurto() {
  document.getElementById("furto-inizia-btn")?.addEventListener("click", iniziaPartitaFurto);
  document.getElementById("furto-chiudi-btn")?.addEventListener("click", chiudiPartitaFurto);
  document.getElementById("furto-avanza-btn")?.addEventListener("click", avanzaFurto);
}

// ===== "Il Giardino Custodito": memory a sequenza crescente, non svegliare Ladone (Undicesima Fatica) =====

let giardinoStato = { tentativiOggi: 0, dataUltimoTentativo: "" };

const GIARDINO_TENTATIVI_MAX = 3;
const GIARDINO_ALBERI = 6;
const GIARDINO_PREMI = [
  { soglia: 10, dracme: 220, frammenti: 1 },
  { soglia: 8, dracme: 150, frammenti: 0 },
  { soglia: 6, dracme: 90, frammenti: 0 },
  { soglia: 4, dracme: 45, frammenti: 0 },
  { soglia: 2, dracme: 15, frammenti: 0 }
];

let giardinoInPartita = false;
let giardinoGiocoFinito = false;
let giardinoSequenza = [];
let giardinoIndiceInput = 0;
let giardinoLivelloRaggiunto = 0;
let giardinoModalitaMostra = true;
let giardinoAlberoIlluminato = null;
let giardinoBloccaClick = false;
let giardinoEsitoTesto = "";

function dataOggiStringaGiardino() { return new Date().toISOString().slice(0, 10); }

function assicuraStatoGiardino() {
  const oggi = dataOggiStringaGiardino();
  if (giardinoStato.dataUltimoTentativo !== oggi) {
    giardinoStato.tentativiOggi = 0;
    giardinoStato.dataUltimoTentativo = oggi;
  }
}

function attendiGiardino(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calcolaPremioGiardino(livello) {
  for (const p of GIARDINO_PREMI) if (livello >= p.soglia) return p;
  return { dracme: 0, frammenti: 0 };
}

function iniziaPartitaGiardino() {
  assicuraStatoGiardino();
  if (giardinoStato.tentativiOggi >= GIARDINO_TENTATIVI_MAX) return;

  giardinoStato.tentativiOggi++;
  salvaProgressoCloud();

  giardinoSequenza = [Math.floor(Math.random() * GIARDINO_ALBERI)];
  giardinoIndiceInput = 0;
  giardinoLivelloRaggiunto = 0;
  giardinoInPartita = true;
  giardinoGiocoFinito = false;
  giardinoModalitaMostra = true;

  renderContenutoFatiche();
  mostraSequenzaGiardino();
}

async function mostraSequenzaGiardino() {
  giardinoModalitaMostra = true;
  giardinoBloccaClick = true;
  await attendiGiardino(500);

  for (let i = 0; i < giardinoSequenza.length; i++) {
    giardinoAlberoIlluminato = giardinoSequenza[i];
    renderContenutoFatiche();
    await attendiGiardino(500);
    giardinoAlberoIlluminato = null;
    renderContenutoFatiche();
    await attendiGiardino(200);
  }

  giardinoModalitaMostra = false;
  giardinoBloccaClick = false;
  renderContenutoFatiche();
}

async function gestisciClickAlberoGiardino(indice) {
  if (giardinoBloccaClick || giardinoModalitaMostra) return;

  const el = document.querySelector(`.giardino-albero[data-indice="${indice}"]`);

  if (indice === giardinoSequenza[giardinoIndiceInput]) {

    el?.classList.add("giardino-albero-corretto");
    giardinoIndiceInput++;

    if (giardinoIndiceInput === giardinoSequenza.length) {

      giardinoBloccaClick = true;
      giardinoLivelloRaggiunto = giardinoSequenza.length;
      await attendiGiardino(500);
      giardinoSequenza.push(Math.floor(Math.random() * GIARDINO_ALBERI));
      giardinoIndiceInput = 0;
      renderContenutoFatiche();
      mostraSequenzaGiardino();

    } else {

      giardinoBloccaClick = true;
      await attendiGiardino(220);
      el?.classList.remove("giardino-albero-corretto");
      giardinoBloccaClick = false;

    }

  } else {

    giardinoBloccaClick = true;
    el?.classList.add("cavalle-flash-sconfitta");
    await attendiGiardino(700);

    const premio = calcolaPremioGiardino(giardinoLivelloRaggiunto);
    dracmeAttuali += premio.dracme;
    if (premio.frammenti > 0) ambraAttuale += premio.frammenti;
    if (giardinoLivelloRaggiunto >= 6) segnaFaticaCompletata("giardino");

    giardinoGiocoFinito = true;
    giardinoEsitoTesto = giardinoLivelloRaggiunto > 0
      ? `Ladone si è svegliato! Sei arrivato a una sequenza di ${giardinoLivelloRaggiunto}. Premio: ${premio.dracme} Dracme${premio.frammenti > 0 ? ` e ${premio.frammenti} Frammento d'Ambra` : ""}.`
      : `Ladone si è svegliato al primo passo. Nessun premio questa volta — riprova domani.`;

    aggiornaTopbarProfilo();
    salvaProgressoCloud();
    giardinoBloccaClick = false;
    renderContenutoFatiche();

  }
}

function chiudiPartitaGiardino() {
  giardinoInPartita = false;
  giardinoGiocoFinito = false;
  renderContenutoFatiche();
}

function htmlSchermataGiardino() {
  assicuraStatoGiardino();

  if (!giardinoInPartita) {
    const tentativiRimasti = GIARDINO_TENTATIVI_MAX - giardinoStato.tentativiOggi;
    const disponibile = tentativiRimasti > 0;

    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:14px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:10px; padding:14px; color:#e0d5c1; font-size:0.85rem; max-width:380px; text-align:center;">
          <p style="color:#c9a054; font-style:italic; margin-bottom:8px;">Nel giardino delle Esperidi, agli estremi confini del mondo, crescevano i pomi d'oro custoditi da Ladone, il drago dalle cento teste che non dormiva mai — sconfiggerlo fu l'undicesima fatica di Eracle.</p>
          <p>Osserva quali alberi si illuminano, poi toccali nello stesso ordine. Ad ogni sequenza superata se ne aggiunge una: un solo passo sbagliato sveglia Ladone.</p>
        </div>
        <button type="button" id="giardino-inizia-btn" class="events-btn events-btn-main" style="max-width:260px;" ${disponibile ? "" : "disabled"}>
          ${disponibile ? "🍎 Entra nel giardino" : "Nessun tentativo rimasto oggi"}
        </button>
        <p style="color:#a89a7a; font-size:0.8rem;">Tentativi rimasti oggi: <b style="color:#ffcc66;">${tentativiRimasti} / ${GIARDINO_TENTATIVI_MAX}</b></p>
      </div>`;
  }

  if (giardinoGiocoFinito) {
    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:16px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:12px; padding:20px; color:#e0d5c1; font-size:0.95rem; max-width:380px; text-align:center;">
          ${giardinoEsitoTesto}
        </div>
        <button type="button" id="giardino-chiudi-btn" class="events-btn events-btn-main" style="max-width:240px;">Continua</button>
      </div>`;
  }

  const alberiHTML = Array.from({ length: GIARDINO_ALBERI }, (_, i) => {
    const illuminato = giardinoAlberoIlluminato === i;
    return `<button type="button" class="giardino-albero${illuminato ? " giardino-albero-illuminato" : ""}" data-indice="${i}" ${giardinoModalitaMostra ? "disabled" : ""}>🌳</button>`;
  }).join("");

  return `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:12px; padding:14px;">
      <div style="color:#e0d5c1; font-size:0.85rem;">Sequenza: <b style="color:#ffcc66;">${giardinoSequenza.length}</b></div>
      <div style="color:#a89a7a; font-size:0.8rem;">${giardinoModalitaMostra ? "Osserva..." : "Tocca nell'ordine giusto"}</div>
      <div class="giardino-griglia">${alberiHTML}</div>
    </div>`;
}

function collegaEventiGiardino() {
  document.getElementById("giardino-inizia-btn")?.addEventListener("click", iniziaPartitaGiardino);
  document.getElementById("giardino-chiudi-btn")?.addEventListener("click", chiudiPartitaGiardino);

  document.querySelectorAll(".giardino-albero").forEach(btn => {
    btn.addEventListener("click", () => gestisciClickAlberoGiardino(parseInt(btn.dataset.indice)));
  });
}

// ===== Tutorial guidato con Chirone: vero giro tra gli elementi reali della mappa principale =====

let tutorialCompletato = false;
let tutorialPassoAttuale = 0;

const TUTORIAL_PASSI = [
  {
    selettore: null,
    testo: "Salve, giovane Evocatore. Sono Chirone, il centauro che ha istruito eroi come Achille e Giasone — e ora tocca a me guidare anche te. Lasciami mostrarti in breve come muovere i primi passi a Mythophedia."
  },
  {
    selettore: "#btn-mondi",
    testo: "Il Monte Olimpo ti porta nei Mondi: mappe esagonali dove conquisti territorio schierando le tue creature in difesa o attacco. Ogni Mondo ha un livello di difficoltà diverso."
  },
  {
    selettore: "#btn-clan",
    testo: "Il Santuario ti porta al tuo Clan: unisciti ad altri Evocatori, chatta con loro, e partecipa alla Guerra tra Clan per conquistare territorio insieme."
  },
  {
    selettore: "#btn-duelli",
    testo: "Il Colosseo ospita i Duelli: sfide dirette contro altri giocatori, con una posta in Dracme in palio per chi vince."
  },
  {
    selettore: "#btn-mercato",
    testo: "L'Agorà è il Mercato: qui spendi le tue Dracme e i tuoi Frammenti d'Ambra per acquistare pacchetti di nuove creature, o espandere il tuo mazzo."
  },
  {
    selettore: "#btn-raccoglitore",
    testo: "La Biblioteca custodisce il tuo Raccoglitore: tutte le creature che possiedi, le loro statistiche, e da qui puoi anche evolverle per renderle più forti."
  },
  {
    selettore: "#dracme-count",
    testo: "Qui in alto tieni sempre d'occhio le tue Dracme e i tuoi Frammenti d'Ambra: le due valute del gioco, guadagnabili in mille modi diversi — battaglie, fatiche, eventi giornalieri."
  },
  {
    carta: "Centauro",
    testo: "Ogni creatura possiede quattro caratteristiche: <b>Ferocia</b>, <b>Balzo</b>, <b>Corazza</b> e <b>Istinto</b>. Guarda questo Centauro, uno dei miei — solida Corazza, ma più debole altrove. Le creature vanno dal Comune fino al Leggendario: più sali di rarità, più questi numeri crescono."
  },
  {
    carta: "Centauro",
    testo: "Ma c'è di più: alcune creature nascondono anche un dono speciale. Il mio Centauro ha l'<b>Equilibrio</b> — se la cava bene tra Foresta e Terra, ma soffre tra Acqua e Aria. Il Volo ama l'Aria e teme l'Acqua; il Nuoto è l'esatto contrario. Scegliere il terreno giusto può ribaltare uno scontro."
  },
  {
    selettore: "#btn-apri-guida",
    testo: "Se mai dovessi dimenticare qualcosa, il tasto Guida qui accanto racconta tutte le regole nel dettaglio. Io, invece, ti lascio andare: il tuo viaggio a Mythophedia comincia adesso. In bocca al lupo, Evocatore."
  }
];

function costruisciCartaEsempioTutorial(nomeCarta) {
  const carta = CARTE_FISSE.find(c => c.nome === nomeCarta);
  if (!carta) return "";

  const s = carta.statisticheFisse;
  const trattiTesto = carta.tratti && carta.tratti.length > 0
    ? carta.tratti.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")
    : "Nessun tratto";

  return `
    <div class="tutorial-carta-esempio">
      <img src="${carta.immagine}" class="tutorial-carta-esempio-img" onerror="this.style.display='none';">
      <div class="tutorial-carta-esempio-nome">${carta.nome}</div>
      <div class="tutorial-carta-esempio-stats">
        <span>Ferocia: <b>${s.ferocia.toFixed(1)}</b></span>
        <span>Balzo: <b>${s.balzo.toFixed(1)}</b></span>
        <span>Corazza: <b>${s.corazza.toFixed(1)}</b></span>
        <span>Istinto: <b>${s.istinto.toFixed(1)}</b></span>
      </div>
      <div class="tutorial-carta-esempio-tratto">${trattiTesto}</div>
    </div>`;
}

function apriTutorialChirone() {
  tutorialPassoAttuale = 0;
  renderizzaPassoTutorial();
}

function renderizzaPassoTutorial() {

  document.querySelectorAll(".tutorial-evidenziato").forEach(el => el.classList.remove("tutorial-evidenziato"));

  let overlay = document.getElementById("tutorial-chirone-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "tutorial-chirone-overlay";
    overlay.className = "tutorial-chirone-overlay";
    const wrapper = document.querySelector(".game-wrapper") || document.body;
    wrapper.appendChild(overlay);
  }

  const passo = TUTORIAL_PASSI[tutorialPassoAttuale];
  const ultimoPasso = tutorialPassoAttuale === TUTORIAL_PASSI.length - 1;

  if (passo.selettore) {
    const target = document.querySelector(passo.selettore);
    target?.classList.add("tutorial-evidenziato");
  }

  overlay.innerHTML = `
    <div class="tutorial-chirone-box${passo.carta ? " tutorial-chirone-box-carta" : ""}">
      ${passo.carta ? costruisciCartaEsempioTutorial(passo.carta) : `<img src="img/carte/chirone.jpg" class="tutorial-chirone-ritratto" onerror="this.style.display='none';">`}
      <div class="tutorial-chirone-testo">
        <p>${passo.testo}</p>
        <div class="tutorial-chirone-controlli">
          <button type="button" id="tutorial-salta-btn" class="tutorial-btn-salta">Salta tutorial</button>
          <button type="button" id="tutorial-avanti-btn" class="events-btn events-btn-main" style="max-width:200px;">${ultimoPasso ? "Inizia l'avventura" : "Avanti →"}</button>
        </div>
      </div>
    </div>`;

  document.getElementById("tutorial-avanti-btn").addEventListener("click", () => {
    if (ultimoPasso) { chiudiTutorialChirone(); return; }
    tutorialPassoAttuale++;
    renderizzaPassoTutorial();
  });

  document.getElementById("tutorial-salta-btn").addEventListener("click", chiudiTutorialChirone);

}

function chiudiTutorialChirone() {
  document.querySelectorAll(".tutorial-evidenziato").forEach(el => el.classList.remove("tutorial-evidenziato"));
  document.getElementById("tutorial-chirone-overlay")?.remove();

  tutorialCompletato = true;
  localStorage.setItem("mythophedia_tutorial_completato", "true");
  salvaProgressoCloud();
}

// ===== Tracciamento completamento delle 11 Fatiche, per sbloccare Cerbero =====

let faticheCompletateStato = {
  scala: false, idra: false, inseguimento: false, trappola: false,
  augia: false, sonaglio: false, toro: false, cavalle: false,
  amazzone: false, gregge: false, giardino: false
};

function segnaFaticaCompletata(id) {
  if (!faticheCompletateStato[id]) {
    faticheCompletateStato[id] = true;
    salvaProgressoCloud();
  }
}

function contaFaticheCompletate() {
  return Object.values(faticheCompletateStato).filter(Boolean).length;
}

function tutteLeFaticheCompletate() {
  return contaFaticheCompletate() >= 11;
}

// ===== "Le Porte degli Inferi": le tre teste di Cerbero, il gran finale (Dodicesima Fatica) =====

let cerberoStato = { tentativiOggi: 0, dataUltimoTentativo: "" };

const CERBERO_TENTATIVI_MAX = 1;
const CERBERO_TARGET = [7, 8.5, 10];
const CERBERO_PREMIO_TESTA = [100, 200];
const CERBERO_PREMIO_FINALE = { dracme: 400, frammenti: 3 };
const CERBERO_NOMI_STAT = { ferocia: "Ferocia", balzo: "Balzo", corazza: "Corazza", istinto: "Istinto" };

let cerberoInPartita = false;
let cerberoGiocoFinito = false;
let cerberoCartaScelta = null;
let cerberoStatistiche = [];
let cerberoTestaAttuale = 0;
let cerberoTotaleDracmeRun = 0;
let cerberoEsitoTesto = "";
let cerberoBloccaClick = false;

function dataOggiStringaCerbero() { return new Date().toISOString().slice(0, 10); }

function assicuraStatoCerbero() {
  const oggi = dataOggiStringaCerbero();
  if (cerberoStato.dataUltimoTentativo !== oggi) {
    cerberoStato.tentativiOggi = 0;
    cerberoStato.dataUltimoTentativo = oggi;
  }
}

function attendiCerbero(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function statisticheCasualiCerbero() {
  const pool = ["ferocia", "balzo", "corazza", "istinto"];
  const scelte = [];
  while (scelte.length < 3) {
    const idx = Math.floor(Math.random() * pool.length);
    const stat = pool.splice(idx, 1)[0];
    scelte.push(stat);
  }
  return scelte;
}

function iniziaPartitaCerbero() {
  assicuraStatoCerbero();
  if (!tutteLeFaticheCompletate() || cerberoStato.tentativiOggi >= CERBERO_TENTATIVI_MAX) return;

  const idCarta = document.getElementById("cerbero-select-carta")?.value;
  const carta = deckGiocatore.find(c => c.id === idCarta);
  if (!carta) { alert("Scegli la tua creatura migliore per affrontare Cerbero!"); return; }

  cerberoStato.tentativiOggi++;
  salvaProgressoCloud();

  cerberoCartaScelta = carta;
  cerberoStatistiche = statisticheCasualiCerbero();
  cerberoTestaAttuale = 0;
  cerberoTotaleDracmeRun = 0;
  cerberoInPartita = true;
  cerberoGiocoFinito = false;
  cerberoEsitoTesto = "";

  renderContenutoFatiche();
}

async function affrontaTestaCerbero() {
  if (cerberoBloccaClick) return;
  cerberoBloccaClick = true;

  const stat = cerberoStatistiche[cerberoTestaAttuale];
  const bersaglio = CERBERO_TARGET[cerberoTestaAttuale];
  const valoreMio = cerberoCartaScelta.statistiche[stat];

  const esitoEl = document.getElementById("cerbero-esito-testa");
  if (esitoEl) esitoEl.innerHTML = `<span class="cavalle-galoppo">🐕</span> La testa numero ${cerberoTestaAttuale + 1} ringhia...`;
  await attendiCerbero(1000);

  const vittoria = valoreMio > bersaglio;

  if (esitoEl) {
    esitoEl.innerHTML = vittoria
      ? `<span class="cavalle-flash-vittoria">✅ Testa sottomessa!</span>`
      : `<span class="cavalle-flash-sconfitta">💥 Cerbero ti respinge!</span>`;
  }
  await attendiCerbero(600);

  if (vittoria) {

    if (cerberoTestaAttuale === 2) {
      cerberoTotaleDracmeRun += CERBERO_PREMIO_FINALE.dracme;
      dracmeAttuali += CERBERO_PREMIO_FINALE.dracme;
      ambraAttuale += CERBERO_PREMIO_FINALE.frammenti;
      cerberoGiocoFinito = true;
      cerberoEsitoTesto = `🏆 Hai domato Cerbero in persona, guardiano delle Porte degli Inferi! Bottino totale: ${cerberoTotaleDracmeRun} Dracme, ${CERBERO_PREMIO_FINALE.frammenti} Frammenti d'Ambra.`;
      aggiornaTopbarProfilo();
      salvaProgressoCloud();
      sparaParticelle(6);
    } else {
      const premio = CERBERO_PREMIO_TESTA[cerberoTestaAttuale];
      cerberoTotaleDracmeRun += premio;
      dracmeAttuali += premio;
      cerberoTestaAttuale++;
      aggiornaTopbarProfilo();
      salvaProgressoCloud();
    }

  } else {
    cerberoGiocoFinito = true;
    cerberoEsitoTesto = `Cerbero ti ha fermato alla testa numero ${cerberoTestaAttuale + 1}. Bottino di questo tentativo: ${cerberoTotaleDracmeRun} Dracme.`;
    aggiornaTopbarProfilo();
    salvaProgressoCloud();
  }

  cerberoBloccaClick = false;
  renderContenutoFatiche();
}

function chiudiPartitaCerbero() {
  cerberoInPartita = false;
  cerberoGiocoFinito = false;
  renderContenutoFatiche();
}

function htmlSchermataCerbero() {
  assicuraStatoCerbero();

  if (!tutteLeFaticheCompletate()) {

    const elencoHTML = FATICHE_DODICI.filter(f => f.id !== "cerbero").map(f => {
      const fatta = faticheCompletateStato[f.id];
      return `
        <div style="display:flex; align-items:center; gap:8px; padding:4px 8px; opacity:${fatta ? "1" : "0.6"};">
          <span style="font-size:1rem;">${fatta ? "✅" : "⬜"}</span>
          <span style="color:${fatta ? "#7ee787" : "#e0d5c1"}; font-size:0.8rem;">${f.numero}. ${f.nome}</span>
        </div>`;
    }).join("");

    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:10px; padding:14px; overflow-y:auto;">
        <div style="background:rgba(15,10,5,0.6); border-radius:10px; padding:12px; color:#e0d5c1; font-size:0.82rem; max-width:380px; text-align:center;">
          <p style="color:#c9a054; font-style:italic; margin-bottom:6px;">Le Porte degli Inferi restano chiuse a chi non ha ancora dimostrato il proprio valore in tutte le altre prove.</p>
          <p>Completa ciascuna delle altre 11 Fatiche con un risultato degno per sbloccare lo scontro con Cerbero.</p>
        </div>
        <p style="color:#ffcc66; font-size:1.1rem; font-weight:bold;">${contaFaticheCompletate()} / 11 completate</p>
        <div style="display:flex; flex-direction:column; max-width:320px; width:100%;">${elencoHTML}</div>
      </div>`;
  }

  if (!cerberoInPartita) {
    const tentativiRimasti = CERBERO_TENTATIVI_MAX - cerberoStato.tentativiOggi;
    const disponibile = tentativiRimasti > 0;

    const eleggibili = carteEleggibiliIdra().sort((a, b) => b.livello - a.livello);
    const opzioniHTML = eleggibili.map(c => `<option value="${c.id}">${c.nome} (Lvl ${c.livello})</option>`).join("");

    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:12px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:10px; padding:12px; color:#e0d5c1; font-size:0.82rem; max-width:400px; text-align:center;">
          <p style="color:#c9a054; font-style:italic; margin-bottom:6px;">Cerbero, il cane a tre teste che sorveglia le Porte degli Inferi, fu l'ultima e più temuta fatica di Eracle: scendere nell'Ade stesso e riportarlo in catene alla luce del sole.</p>
          <p>Scegli la tua creatura migliore: affronterà le tre teste in sequenza, ognuna su una statistica diversa e via via più esigente. Serve superarle tutte per il premio pieno.</p>
        </div>
        <select id="cerbero-select-carta" class="deploy-select" style="width:100%; max-width:380px; padding:8px;" ${(!disponibile || eleggibili.length === 0) ? "disabled" : ""}>
          ${eleggibili.length > 0 ? opzioniHTML : `<option>Nessuna creatura disponibile</option>`}
        </select>
        <button type="button" id="cerbero-inizia-btn" class="events-btn events-btn-main" style="max-width:260px;" ${(!disponibile || eleggibili.length === 0) ? "disabled" : ""}>
          ${disponibile ? "🐕 Scendi negli Inferi" : "Nessun tentativo rimasto oggi"}
        </button>
        <p style="color:#a89a7a; font-size:0.8rem;">Tentativi rimasti oggi: <b style="color:#ffcc66;">${tentativiRimasti} / ${CERBERO_TENTATIVI_MAX}</b></p>
      </div>`;
  }

  if (cerberoGiocoFinito) {
    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:16px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:12px; padding:20px; color:#e0d5c1; font-size:0.95rem; max-width:400px; text-align:center;">
          ${cerberoEsitoTesto}
        </div>
        <button type="button" id="cerbero-chiudi-btn" class="events-btn events-btn-main" style="max-width:240px;">Continua</button>
      </div>`;
  }

  const stat = cerberoStatistiche[cerberoTestaAttuale];
  const bersaglio = CERBERO_TARGET[cerberoTestaAttuale];

  return `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:14px; padding:14px;">
      <div style="background:rgba(15,10,5,0.6); border-radius:10px; padding:14px; color:#e0d5c1; font-size:0.85rem; max-width:400px; text-align:center;">
        <p style="font-size:1rem; color:#ffcc66; font-weight:bold; margin-bottom:6px;">🐕 Testa ${cerberoTestaAttuale + 1} di 3</p>
        <p>${cerberoCartaScelta.nome} in campo — ${CERBERO_NOMI_STAT[stat]}: <b>${cerberoCartaScelta.statistiche[stat].toFixed(1)}</b> contro <b>${bersaglio}</b> richiesto</p>
        <p style="margin-top:6px; color:#c9a054;">Bottino accumulato: ${cerberoTotaleDracmeRun} Dracme</p>
      </div>
      <div id="cerbero-esito-testa" style="min-height:22px; color:#ffcc66; font-weight:bold; font-size:0.9rem;"></div>
      <button type="button" id="cerbero-combatti-btn" class="events-btn events-btn-main" style="max-width:260px;">⚔️ Affronta la testa</button>
    </div>`;
}

function collegaEventiCerbero() {
  document.getElementById("cerbero-inizia-btn")?.addEventListener("click", iniziaPartitaCerbero);
  document.getElementById("cerbero-combatti-btn")?.addEventListener("click", affrontaTestaCerbero);
  document.getElementById("cerbero-chiudi-btn")?.addEventListener("click", chiudiPartitaCerbero);
}

function htmlSelezioneCarteFatiche() {
  const carte = deckGiocatore.filter(c => !c.isJolly);
  const righe = carte.map(c => {
    const checked = selezioneTemporaneaFatiche.has(c.id) ? "checked" : "";
    return `
      <label class="fatiche-carta-select" style="display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:8px; background:rgba(20,20,25,0.55); cursor:pointer;">
        <input type="checkbox" class="fatiche-check" data-id="${c.id}" ${checked}>
        ${miniImmagineCarta(c, 32)}
        <span style="flex:1; font-size:0.8rem; color:#e0d5c1;">${c.nome} <span style="color:#a89a7a;">(L${c.livello}${c.stelle ? (" ★" + c.stelle) : ""})</span></span>
      </label>`;
  }).join("");

  return `
    <div style="padding:10px 20px; display:flex; flex-direction:column; height:100%; min-height:0;">
      <div style="background:rgba(15,10,5,0.6); border-radius:10px; padding:12px; margin-bottom:10px; color:#e0d5c1; font-size:0.85rem;">
        <p style="color:#c9a054; font-style:italic; margin-bottom:8px;">La pelle del Leone di Nemea era talmente resistente da respingere ogni lama: Eracle dovette strangolarlo a mani nude nella sua prima, leggendaria fatica.</p>
        <p>Scegli esattamente <b>20 carte</b> dal tuo mazzo: le userai, una alla volta, per affrontare la scala di 10 nemici. Ogni carta selezionata potrà essere usata <b>una sola volta</b> per tutta la settimana. La scelta resta valida fino al prossimo rinnovo settimanale.</p>
      </div>
      <div id="fatiche-contatore-selezione" style="text-align:center; font-weight:bold; color:#ffcc66; margin-bottom:8px;">${selezioneTemporaneaFatiche.size} / 20 selezionate</div>
      <div style="flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">
        ${righe || '<p style="text-align:center; color:#a89a7a;">Il tuo mazzo non ha ancora carte disponibili.</p>'}
      </div>
      <button type="button" id="fatiche-conferma-btn" class="events-btn events-btn-main" style="margin-top:10px;" ${selezioneTemporaneaFatiche.size === 20 ? "" : "disabled"}>
        Conferma le tue 20 carte
      </button>
    </div>`;
}

function collegaEventiSelezioneFatiche() {
  document.querySelectorAll(".fatiche-check").forEach(chk => {
    chk.addEventListener("change", (e) => {
      const id = e.target.dataset.id;
      if (e.target.checked) {
        if (selezioneTemporaneaFatiche.size >= 20) { e.target.checked = false; return; }
        selezioneTemporaneaFatiche.add(id);
      } else {
        selezioneTemporaneaFatiche.delete(id);
      }
      document.getElementById("fatiche-contatore-selezione").innerText = `${selezioneTemporaneaFatiche.size} / 20 selezionate`;
      document.getElementById("fatiche-conferma-btn").disabled = selezioneTemporaneaFatiche.size !== 20;
    });
  });

  document.getElementById("fatiche-conferma-btn")?.addEventListener("click", () => {
    fatica1Stato.carteSelezionate = Array.from(selezioneTemporaneaFatiche);
    selezioneTemporaneaFatiche = new Set();
    salvaProgressoCloud();
    renderContenutoFatiche();
  });
}

function htmlTorceFatiche() {
  let html = '<div class="fatiche-torce-row">';
  for (let i = 0; i < 10; i++) {
    const accesa = i < fatica1Stato.gradinoAttuale;
    const attuale = i === fatica1Stato.gradinoAttuale;
    html += `<span class="fatiche-torcia${accesa ? " accesa" : ""}${attuale ? " attuale" : ""}">🔥</span>`;
  }
  html += '</div>';
  return html;
}

function htmlScalaFatiche() {
  const scala = generaScalaFatiche(fatica1Stato.settimanaId);

  if (fatica1Stato.gradinoAttuale >= 10) {
    return `
      ${htmlTorceFatiche()}
      <div style="padding:24px; text-align:center; color:#e0d5c1; background:rgba(15,10,5,0.6); border-radius:12px; margin-top:10px;">
        <p style="font-size:1.1rem; color:#ffcc66; margin-bottom:10px;">🏆 Hai completato tutti e 10 i gradini di questa settimana!</p>
        <p style="font-size:0.9rem;">Torna la prossima settimana per una nuova scala, con nemici e caratteristiche diverse.</p>
      </div>`;
  }

  const gradino = scala[fatica1Stato.gradinoAttuale];
  const carteDisponibili = fatica1Stato.carteSelezionate
    .filter(id => !fatica1Stato.carteUsate.includes(id))
    .map(id => deckGiocatore.find(c => c.id === id))
    .filter(Boolean);

  const statLabel = gradino.stats.map(s => ETICHETTE_STAT_FATICHE[s]).join(" + ");
  const nemicoImg = miniImmagineCarta(gradino.nemico, 90);

  const carteHTML = carteDisponibili.map(c => `
    <button type="button" class="fatiche-carta-btn" data-id="${c.id}" style="display:flex; flex-direction:column; align-items:center; gap:4px; background:rgba(20,20,25,0.55); border:1px solid #5a4a2a; border-radius:8px; padding:6px; cursor:pointer;">
      ${miniImmagineCarta(c, 44)}
      <span style="font-size:0.62rem; color:#e0d5c1; text-align:center;">${c.nome}</span>
    </button>`).join("");

  const tentativiEsauriti = fatica1Stato.tentativiOggi >= 10;

  return `
    <div style="padding:10px 20px; display:flex; flex-direction:column; height:100%; min-height:0; gap:10px;">
      ${htmlTorceFatiche()}
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(15,10,5,0.6); border-radius:10px; padding:10px 14px; color:#e0d5c1; font-size:0.85rem;">
        <span>Gradino <b style="color:#ffcc66;">${fatica1Stato.gradinoAttuale + 1} / 10</b></span>
        <span>Tentativi oggi: <b style="color:#ffcc66;">${10 - fatica1Stato.tentativiOggi} / 10</b></span>
        <span>Carte rimaste: <b style="color:#ffcc66;">${carteDisponibili.length}</b></span>
      </div>
      <div style="text-align:center; background:rgba(15,10,5,0.55); border-radius:10px; padding:14px;">
        <div>${nemicoImg}</div>
        <div style="color:#ffcc66; font-weight:bold; margin-top:6px;">${gradino.nemico.nome}</div>
        <div style="color:#a89a7a; font-size:0.8rem; margin-top:2px;">Modalità: ${ETICHETTE_MODALITA_FATICHE[gradino.modalita]} — ${statLabel}</div>
        <div style="color:#c9a054; font-size:0.8rem; margin-top:4px;">Premio se superato: ${gradino.premio} Dracme${fatica1Stato.gradinoAttuale === 9 ? " + 3 Frammenti d'Ambra" : ""}</div>
      </div>
      ${tentativiEsauriti ? '<p style="text-align:center; color:#f87171; font-size:0.85rem;">Tentativi di oggi esauriti — torna domani per continuare.</p>' : `
      <div style="flex:1; min-height:0; overflow-y:auto;">
        <p style="text-align:center; color:#a89a7a; font-size:0.8rem; margin-bottom:6px;">Scegli la carta da schierare:</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(70px,1fr)); gap:6px;">
          ${carteHTML || '<p style="text-align:center; color:#a89a7a;">Nessuna carta rimasta disponibile per questa settimana.</p>'}
        </div>
      </div>`}
    </div>`;
}

function collegaEventiScalaFatiche() {
  document.querySelectorAll(".fatiche-carta-btn").forEach(btn => {
    const carta = deckGiocatore.find(c => c.id === btn.dataset.id);
    if (!carta) return;
    btn.addEventListener("click", () => mostraCartaFullscreen(carta, { bottoneBattaglia: true }));
  });
}

function affrontaGradinoFatiche(idCarta) {

  if (fatica1Stato.tentativiOggi >= 10) { alert("Hai esaurito i tentativi di oggi per Le Dodici Fatiche. Torna domani!"); return; }

  const carta = deckGiocatore.find(c => c.id === idCarta);
  if (!carta) return;

  const scala = generaScalaFatiche(fatica1Stato.settimanaId);
  const gradino = scala[fatica1Stato.gradinoAttuale];

  let sommaMio = 0, sommaNemico = 0;
  gradino.stats.forEach(stat => {
    sommaMio += carta.statistiche[stat];
    sommaNemico += gradino.nemico.statistiche[stat];
  });
  const mioVal = parseFloat((sommaMio / gradino.stats.length).toFixed(1));
  const nemicoVal = parseFloat((sommaNemico / gradino.stats.length).toFixed(1));
  const vittoria = mioVal > nemicoVal;

  fatica1Stato.tentativiOggi++;
  fatica1Stato.carteUsate.push(idCarta);

  let completataOra = false;

  if (vittoria) {
    dracmeAttuali += gradino.premio;
    fatica1Stato.gradinoAttuale++;
    if (fatica1Stato.gradinoAttuale >= 5) segnaFaticaCompletata("scala");
    if (fatica1Stato.gradinoAttuale >= 10) {
      ambraAttuale += 3;
      fatica1Stato.premioFinaleRitirato = true;
      completataOra = true;
    }
  }

  aggiornaTopbarProfilo();
  salvaProgressoCloud();

  mostraAnimazioneScontroFatiche(carta, gradino.nemico, vittoria, mioVal, nemicoVal, gradino, completataOra);
}

function mostraAnimazioneScontroFatiche(carta, nemico, vittoria, mioVal, nemicoVal, gradino, completataOra) {

  document.getElementById("battle-title-outcome").innerText = "Scontro in corso...";

  document.getElementById("battle-report-content").innerHTML = `
    <div class="fatiche-arena">
      <div id="fatiche-mio-lato" class="fatiche-combattente fatiche-slide-left">
        ${miniImmagineCarta(carta, 90)}
        <div class="fatiche-combattente-nome">${carta.nome}</div>
      </div>
      <div class="fatiche-vs-pop">VS</div>
      <div id="fatiche-nemico-lato" class="fatiche-combattente fatiche-slide-right">
        ${miniImmagineCarta(nemico, 90)}
        <div class="fatiche-combattente-nome">${nemico.nome}</div>
      </div>
    </div>`;

  setTimeout(() => {
    const mioEl = document.getElementById("fatiche-mio-lato");
    const nemicoEl = document.getElementById("fatiche-nemico-lato");
    if (!mioEl || !nemicoEl) return;
    if (vittoria) { mioEl.classList.add("fatiche-vincitore"); nemicoEl.classList.add("fatiche-perdente"); }
    else { nemicoEl.classList.add("fatiche-vincitore"); mioEl.classList.add("fatiche-perdente"); }
  }, 900);

  setTimeout(() => {
    document.getElementById("battle-title-outcome").innerText = vittoria ? "Gradino superato!" : "Sconfitta...";
    document.getElementById("battle-report-content").innerHTML = `
      <div style="padding:24px; text-align:center; color:#e0d5c1; background:rgba(15,10,5,0.6); border-radius:12px; margin-top:10px;">
        <p style="font-size:1rem; margin-bottom:8px;">${carta.nome} (${mioVal}) contro ${nemico.nome} (${nemicoVal})</p>
        <p style="font-size:1.1rem; color:${vittoria ? "#7ee787" : "#f87171"}; font-weight:bold;">${vittoria ? "Hai vinto! Gradino superato." : "Hai perso questo scontro."}</p>
        ${vittoria ? `<p style="color:#c9a054; margin-top:6px;">+${gradino.premio} Dracme${completataOra ? " · +3 Frammenti d'Ambra (scala completata!)" : ""}</p>` : ""}
        <button type="button" id="fatiche-continua-btn" class="events-btn events-btn-main" style="margin-top:16px;">Continua</button>
      </div>`;
    document.getElementById("fatiche-continua-btn").addEventListener("click", renderContenutoFatiche);
  }, 1900);

}

document.getElementById("btn-eventi-fatiche")?.addEventListener("click", apriPannelloFatiche);

// Icona di richiamo per ogni mitologia (segnaposto in attesa di illustrazioni dedicate)
const ICONE_MITOLOGIA = {
  "Greca": "🏛️", "Norrena": "🪓", "Romana": "🦅", "Egiziana": "🐫", "Mesopotamica": "𒀭",
  "Slava": "🐺", "Cinese": "🐉", "Giapponese": "⛩️", "Indiana": "🕉️", "Araba": "🌙",
  "Celtica": "🍀", "Maya": "🌽", "Azteca": "☀️", "Persiana": "🔥", "Inuit": "❄️",
  "Francese": "⚜️", "Belga": "🌩️", "Finlandese": "🌲", "Andina": "⛰️", "Amazzonica": "🌴",
  "Centroamericana": "🐆", "Himalayana": "🏔️", "Baltica": "🌊", "Ebraica": "✡️",
  "Aborigena Australiana": "🪃", "Anglosassone": "⚔️", "Algonquina": "🦌",
  "Africana": "🌅", "Filippina": "🌺", "Coreana": "🐯", "Polinesiana": "🌊",
  "Melanesiana": "🐚", "Nativa Americana": "🦅",
  "Altre Tradizioni": "🌍"
};

function slugMitologia(cultura) {
  return cultura
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

let cultureMitoCorrente = null;

function apriPannelloDentroIlMito() {

  document.querySelector("#battle-result-modal .modal-card").classList.add("mito-bg-attivo");

  cultureMitoCorrente = null;

  renderContenutoMythophedia();

  document.getElementById("battle-result-modal").classList.remove("hidden");

}

function renderContenutoMythophedia() {

  const gruppi = {};
  CARTE_FISSE.forEach(c => {
    const cultura = c.cultura && c.cultura.trim() ? c.cultura.trim() : "Altre Tradizioni";
    if (!gruppi[cultura]) gruppi[cultura] = [];
    gruppi[cultura].push(c.nome);
  });

  if (!cultureMitoCorrente) {
    // ===== Vista Hub: un tasto grande per ogni mitologia, tutti visibili insieme =====

    document.getElementById("battle-title-outcome").innerText = "Mythophedia";

    const cultureOrdinate = Object.keys(gruppi).sort((a, b) => a.localeCompare(b, "it"));

    const tastiHtml = cultureOrdinate.map(cultura => {
      const slug = slugMitologia(cultura);
      return `
        <button type="button" class="mito-tasto-cultura" data-cultura-tasto="${cultura}" style="background-image: linear-gradient(rgba(15,12,8,0.55), rgba(15,12,8,0.8)), url('img/mitologie/${slug}.jpg'); background-size: cover; background-position: center;">
          <span class="mito-tasto-nome">${cultura}</span>
          <span class="mito-tasto-conteggio">${gruppi[cultura].length} creature</span>
        </button>`;
    }).join("");

    document.getElementById("battle-report-content").innerHTML = `
      <div style="padding:10px 20px; height:100%; min-height:0; display:flex; flex-direction:column;">
        <div class="mito-hub-grid">
          ${tastiHtml}
        </div>
      </div>`;

    document.querySelectorAll(".mito-tasto-cultura").forEach(btn => {
      btn.addEventListener("click", () => {
        cultureMitoCorrente = btn.dataset.culturaTasto;
        renderContenutoMythophedia();
      });
    });

    const modalCardMito = document.querySelector("#battle-result-modal .modal-card");
    if (modalCardMito) modalCardMito.style.backgroundImage = "";

  } else {
    // ===== Vista Creature: lista scrollabile della singola mitologia scelta =====

    document.getElementById("battle-title-outcome").innerText = "Mythophedia — " + cultureMitoCorrente;

    const slugCorrente = slugMitologia(cultureMitoCorrente);
    const modalCardMito = document.querySelector("#battle-result-modal .modal-card");
    if (modalCardMito) {
      modalCardMito.style.backgroundImage = `linear-gradient(rgba(10,8,5,0.75), rgba(10,8,5,0.75)), url('img/mitologie/${slugCorrente}.jpg')`;
      modalCardMito.style.backgroundSize = "cover";
      modalCardMito.style.backgroundPosition = "center";
      modalCardMito.style.backgroundRepeat = "no-repeat";
    }

    const nomiOrdinati = (gruppi[cultureMitoCorrente] || []).sort((a, b) => a.localeCompare(b, "it"));

    const schedeHtml = nomiOrdinati.map(nome => {
      const testo = LORE_CARTE[nome] || "Lore in arrivo — questa scheda sarà completata presto.";
      return `
        <div class="mito-scheda" data-nome-mito="${nome.toLowerCase()}">
          <div class="mito-scheda-nome">${nome}</div>
          <div class="mito-scheda-testo">${testo}</div>
        </div>`;
    }).join("");

    document.getElementById("battle-report-content").innerHTML = `
      <div style="padding:10px 20px; display:flex; flex-direction:column; height:100%; min-height:0;">
        <input type="text" id="mito-search-input" placeholder="Cerca una creatura..." 
          style="width:100%; box-sizing:border-box; padding:8px 12px; margin-bottom:10px; border-radius:8px; border:1px solid #5a4a2a; background:rgba(20,20,25,0.6); color:#e0d5c1; font-size:0.95rem;">
        <div id="mito-lista-schede" style="flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:10px;">
          ${schedeHtml}
        </div>
      </div>`;

    document.getElementById("mito-search-input").addEventListener("input", (e) => {
      const filtro = e.target.value.trim().toLowerCase();
      document.querySelectorAll(".mito-scheda").forEach(scheda => {
        scheda.style.display = scheda.dataset.nomeMito.includes(filtro) ? "" : "none";
      });
    });
  }

}

document.getElementById("btn-dentro-mito")?.addEventListener("click", apriPannelloDentroIlMito);

function renderEmblemaClan(valore, dimensionePx) {

  if (typeof valore === "string" && valore.startsWith("data:image")) {

    return `<img src="${valore}" style="width:${dimensionePx}px; height:${dimensionePx}px; border-radius:50%; object-fit:cover; vertical-align:middle;">`;

  }

  return valore;

}

function caricaClanRealiCondivisi(callback) {

  if (!utenteFirebaseAttuale) { callback(); return; }

  listaClanGlobali = listaClanGlobali.filter(c => !c.reale);

  dbFirebase.ref("clan_reali").once("value").then((snapshot) => {

    if (snapshot.exists()) {

      snapshot.forEach((childSnap) => {

        const dati = childSnap.val();

        const membriArray = Object.keys(dati.membri || {}).map(uid => ({

          nome: dati.membri[uid].nome,

          rank: dati.membri[uid].rank,

          uid: uid

        }));

        if (membriArray.some(m => m.uid === utenteFirebaseAttuale.uid)) return;

        listaClanGlobali.push({

          id: childSnap.key,

          firebaseId: childSnap.key,

          nome: dati.nome,

          emblema: dati.emblema,

          motto: dati.motto,

          regole: dati.regole || [],

          membri: membriArray,

          isBot: false,

          reale: true,

          fazioneId: "bot" + childSnap.key,

          assedioAttivo: false, chat: [],

          oracoloHex: null

        });

      });

    }

    callback();

  }).catch((err) => {

    console.error("Errore caricamento clan reali:", err);

    callback();

  });

}

function renderizzaListaClanReclutamento() {

  const container = document.getElementById("clan-available-list");

  if (!container) return;

  container.innerHTML = "";

  listaClanGlobali.forEach(clan => {

    let badgeReale = clan.reale ? `<span style="background:#2f855a; color:#fff; font-size:0.65rem; padding:2px 6px; border-radius:4px; margin-left:6px;">👤 REALE</span>` : "";

    const cardHTML = `

      <div class="clan-card-bacheca">

        <div class="clan-card-details">

          <div class="clan-card-title"><span>${renderEmblemaClan(clan.emblema, 22)}</span> ${clan.nome}${badgeReale}</div>

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

  clan.membri.push({ nome: nicknameUtente + " (Tu)", rank: "soldato", uid: utenteFirebaseAttuale ? utenteFirebaseAttuale.uid : null });

  if (clan.reale && utenteFirebaseAttuale) {

    dbFirebase.ref(`clan_reali/${clan.firebaseId}/membri/${utenteFirebaseAttuale.uid}`).set({

      nome: nicknameUtente,

      rank: "soldato"

    }).catch((err) => console.error("Errore adesione clan reale:", err));

  }

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

    membri: [{ nome: nicknameUtente + " (Tu)", rank: "comandante", uid: utenteFirebaseAttuale ? utenteFirebaseAttuale.uid : null }],

    isBot: false,

    fazioneId: "alleato",

    assedioAttivo: false, chat: [],

    oracoloHex: null

  };

  if (utenteFirebaseAttuale) {

    nuovoClan.reale = true;

    nuovoClan.firebaseId = nuovoClan.id;

    dbFirebase.ref("clan_reali/" + nuovoClan.id).set({

      nome: nomeInput,

      emblema: emblemaInput,

      motto: mottoInput,

      regole: [r1, r2, r3],

      comandanteUid: utenteFirebaseAttuale.uid,

      membri: { [utenteFirebaseAttuale.uid]: { nome: nicknameUtente, rank: "comandante" } },

      timestampCreazione: Date.now()

    }).catch((err) => console.error("Errore pubblicazione clan reale:", err));

  }

 

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

    caricaClanRealiCondivisi(() => renderizzaListaClanReclutamento());

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

      let btnDonaHTML = eIlGiocatore ? "" : `<button type="button" class="attack-btn btn-dona-membro" data-nome="${m.nome}" data-uid="${m.uid || ''}" style="width:auto; padding:3px 10px; font-size:0.7rem;">Dona</button>`;

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

      btn.addEventListener("click", () => apriModaleDonazione(btn.dataset.nome, btn.dataset.uid));

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

function apriModaleDonazione(nomeDestinatario, uidDestinatario) {

  if (donazioneFattaOggi) { alert("Hai già donato una carta oggi. Riprova domani!"); return; }

  if (ambraAttuale < 1 && getRuoloGiocatore() !== "sergente") { alert("Non hai abbastanza Frammenti d'Ambra!"); return; }

  donazioneDestinatarioCorrente = nomeDestinatario;

  donazioneDestinatarioUidCorrente = uidDestinatario || null;

  document.getElementById("donation-target-name").innerText = nomeDestinatario;

  const select = document.getElementById("donation-card-select");

  select.innerHTML = '<option value="">-- Seleziona --</option>';

  deckGiocatore.filter(c => !c.isJolly && (c.livello === 1 || c.livello === 2)).forEach(carta => {

    const option = document.createElement("option");

    option.value = carta.id;

    option.innerText = `${iconaCartaTesto(carta)} ${carta.nome} (Lvl ${carta.livello})`;

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

  if (donazioneDestinatarioUidCorrente && utenteFirebaseAttuale) {

    dbFirebase.ref(`regali/${donazioneDestinatarioUidCorrente}`).push({

      carta: { nome: carta.nome, immagine: carta.immagine, livello: carta.livello, cultura: carta.cultura, tratti: carta.tratti || [], statistiche: carta.statistiche, stelle: 0, isJolly: false },

      mittenteNome: nicknameUtente,

      timestamp: Date.now()

    }).then(() => {

      salvaProgressoCloud();

      alert(`Hai donato ${carta.nome} a ${donazioneDestinatarioCorrente}! La riceverà al suo prossimo accesso.`);

    }).catch((err) => {

      console.error("Errore invio dono:", err);

      alert(`Hai donato ${carta.nome}, ma c'è stato un problema nella consegna. Riprova più tardi.`);

    });

  } else {

    alert(`Hai donato ${carta.nome} a ${donazioneDestinatarioCorrente}!`);

  }

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

function generaMappaGuerra(callback) {

  if (mappaGuerraClan.length > 0) { callback(); return; }

  function generaMappaGuerraLocaleFresca() {

    mappaGuerraClan = [];

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

            let ref = pescaCartaFissa(1);

            mazzo.push({ nome: ref.nome, immagine: ref.immagine, statistiche: { ferocia: ref.statisticheFisse.ferocia, balzo: ref.statisticheFisse.balzo, corazza: ref.statisticheFisse.corazza, istinto: ref.statisticheFisse.istinto }, tratti: ref.tratti || [], proprietario: "Mostri Selvatici" });

          }

          guarnigioni.push(mazzo);

        }

        riga.push({ r: r, c: c, terrain: terreno, fazione: fazione, tipo: tipoSettore, yield: rendimento, guarnigioni: guarnigioni, statsGuerra: statsAttive, haMarchioPredatore: false, predatoreScadenza: 0, oracoloScadenza: 0 });

      }

      mappaGuerraClan.push(riga);

    }

  }

  if (!clanMioAttuale.reale || !utenteFirebaseAttuale) {

    generaMappaGuerraLocaleFresca();

    callback();

    return;

  }

  dbFirebase.ref("guerre_reali/" + clanMioAttuale.firebaseId).once("value").then((snapshot) => {

    if (snapshot.exists()) {

      mappaGuerraClan = snapshot.val();

    } else {

      generaMappaGuerraLocaleFresca();

      dbFirebase.ref("guerre_reali/" + clanMioAttuale.firebaseId).set(mappaGuerraClan).catch((err) => console.error("Errore pubblicazione guerra:", err));

    }

    callback();

  }).catch((err) => {

    console.error("Errore caricamento guerra condivisa:", err);

    generaMappaGuerraLocaleFresca();

    callback();

  });

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

  if (clanMioAttuale.reale && m.uid) {

    dbFirebase.ref(`clan_reali/${clanMioAttuale.firebaseId}/membri/${m.uid}/rank`).set(nuovoRank)

      .catch((err) => console.error("Errore promozione clan reale:", err));

  }

  clanMioAttuale.chat.push({ autore: "Sistema", testo: `${m.nome} è stato promosso da ${vecchioRank} a ${nuovoRank}.`, sistema: true });

  aggiornaVisualizzazioneClan();

}

const RISPOSTE_CHAT_BOT = [

  "Ottima notizia, comandante!", "Io sono pronto per la prossima guerra.", "Qualcuno ha carte di Livello 2 da scambiare?",

  "Bel colpo nell'ultimo assedio!", "Aspetto il reset settimanale con ansia.", "Concordo pienamente.",

  "Ho appena evoluto una nuova creatura, top!", "Dobbiamo difendere meglio gli avamposti questa settimana."

];

let chatAscoltoAttivoId = null;

function avviaAscoltoChatReale(clan) {

  if (chatAscoltoAttivoId === clan.firebaseId) return;

  if (chatAscoltoAttivoId) {

    dbFirebase.ref("clan_reali/" + chatAscoltoAttivoId + "/chat").off();

  }

  chatAscoltoAttivoId = clan.firebaseId;

  clan.chat = [];

  dbFirebase.ref("clan_reali/" + clan.firebaseId + "/chat").on("child_added", (snap) => {

    clan.chat.push(snap.val());

    if (clanMioAttuale && clanMioAttuale.firebaseId === clan.firebaseId) renderizzaChatClanLocale();

  });

}

function renderizzaChatClanLocale() {

  const box = document.getElementById("clan-chat-messages");

  if (!box || !clanMioAttuale) return;

  if (!clanMioAttuale.chat) clanMioAttuale.chat = [];

  box.innerHTML = clanMioAttuale.chat.map(msg => {

    if (msg.sistema) return `<div style="text-align:center; color:#c9a054; font-style:italic; font-size:0.72rem;">${msg.testo}</div>`;

    let mioMsg = msg.autoreUid ? (utenteFirebaseAttuale && msg.autoreUid === utenteFirebaseAttuale.uid) : msg.mio;

    let colore = mioMsg ? "#ffcc66" : "#a0d8ef";

    return `<div><strong style="color:${colore};">${msg.autore}:</strong> <span style="color:#e0d5c1;">${msg.testo}</span></div>`;

  }).join("");

  box.scrollTop = box.scrollHeight;

}

function renderizzaChatClan() {

  if (!clanMioAttuale) return;

  if (clanMioAttuale.reale) {

    avviaAscoltoChatReale(clanMioAttuale);

  } else {

    renderizzaChatClanLocale();

  }

}

function inviaMessaggioChatClan() {

  const input = document.getElementById("clan-chat-input");

  const testo = input.value.trim();

  if (!testo || !clanMioAttuale) return;

  if (!clanMioAttuale.chat) clanMioAttuale.chat = [];

  input.value = "";

  if (clanMioAttuale.reale && utenteFirebaseAttuale) {

    dbFirebase.ref("clan_reali/" + clanMioAttuale.firebaseId + "/chat").push({

      autore: nicknameUtente,

      autoreUid: utenteFirebaseAttuale.uid,

      testo: testo,

      timestamp: Date.now()

    }).catch((err) => console.error("Errore invio messaggio:", err));

    return;

  }

  clanMioAttuale.chat.push({ autore: nicknameUtente, testo: testo, mio: true });

  renderizzaChatClanLocale();

  const altriMembri = clanMioAttuale.membri.filter(m => !m.nome.includes("(Tu)"));

  if (altriMembri.length > 0 && Math.random() < 0.7) {

    setTimeout(() => {

      if (!clanMioAttuale || !clanMioAttuale.chat) return;

      const autoreBot = altriMembri[Math.floor(Math.random() * altriMembri.length)];

      const rispostaBot = RISPOSTE_CHAT_BOT[Math.floor(Math.random() * RISPOSTE_CHAT_BOT.length)];

      clanMioAttuale.chat.push({ autore: autoreBot.nome, testo: rispostaBot, mio: false });

      renderizzaChatClanLocale();

    }, 1200 + Math.random() * 1800);

  }

}

document.getElementById("btn-invia-chat-clan")?.addEventListener("click", inviaMessaggioChatClan);

const CAPITOLI_GUIDA = [

  { id: "benvenuto", titolo: "🌟 Benvenuto, Evocatore", html: `<h3>Benvenuto, Evocatore</h3><p>Da qualche parte, in un angolo dimenticato del mondo, un antico patto ti ha scelto. Non sei un semplice collezionista: sei un <strong>Evocatore</strong>, e il tuo compito è radunare le creature nate dai miti e dalle leggende di ogni cultura che l'umanità abbia mai raccontato — spiriti silenziosi, bestie feroci, guardiani immortali, fino ai draghi che hanno plasmato il destino dei popoli.</p><p>Ogni carta che possiedi non è solo un numero su uno schermo: ha una storia, un carattere, un terreno in cui si sente a casa e uno in cui invece arranca. Impara a conoscerle. Guarda le loro statistiche, scopri i loro tratti speciali, capisci quando un'Arpìa vola meglio di quanto un Kraken possa nuotare — e quando invece è vero il contrario.</p><p>Il tuo cammino da Evocatore non ha una fine scritta: ogni settimana nuove creature possono unirsi al bestiario, nuove sfide attendono nei mondi, nuove alleanze si stringono nei clan. Ma un solo traguardo resta sempre lì, all'orizzonte, a guidarti: <strong>la collezione completa.</strong></p><p>Ogni carta mancante è una storia che non conosci ancora. Vai a scoprirla.</p>` },

  { id: "creature", titolo: "🃏 Le Creature", html: `<h3>Il Bestiario</h3><p>Il bestiario di Mythophedia nasce dalle mitologie e dal folklore reale di tutto il mondo — greco, norreno, giapponese, azteco, celtico, slavo, mesopotamico e molti altri ancora. Ogni creatura è organizzata in <strong>6 Livelli di rarità</strong>, una piramide che sale dalla tradizione popolare fino al mito supremo:</p><ul><li><strong>Comuni</strong> — piccoli spiriti, folletti, creature della tradizione popolare. L'inizio di ogni collezione.</li><li><strong>Non Comuni</strong> — bestie feroci e mostri da caccia, i primi veri banchi di prova.</li><li><strong>Rare</strong> — mostri iconici, guardiani di templi che pochi Evocatori riescono a domare.</li><li><strong>Epiche</strong> — grandi forze della natura, creature quasi immortali.</li><li><strong>Mitiche</strong> — flagelli divini, custodi supremi degli esagoni di mappa.</li><li><strong>Leggendarie</strong> — l'apice assoluto: i Draghi Millenari, l'ultimo passo di ogni collezione.</li></ul><p>Ogni creatura possiede quattro caratteristiche — <strong>Ferocia</strong>, <strong>Balzo</strong>, <strong>Corazza</strong>, <strong>Istinto</strong> — distribuite in modo unico, mai uguale da una carta all'altra. Alcune nascondono anche un dono in più: il <strong>Volo</strong>, il <strong>Nuoto</strong>, l'<strong>Arrampicata</strong> o l'<strong>Equilibrio</strong>, capacità che possono ribaltare uno scontro se schierate sul terreno giusto.</p><p><em>Consiglio da Evocatore: prima di lanciarti in battaglia, apri la scheda di ogni carta. Conoscerne i punti di forza — e le debolezze — è la prima vera strategia del gioco.</em></p>` },

  { id: "evoluzione", titolo: "⭐ Evoluzione a Stelle", html: `<h3>Come far evolvere una carta</h3><p>Le tue creature non restano ferme: possono <strong>evolvere</strong>, guadagnando stelle che ne accrescono il potere.</p><p>Per dare una stella a una creatura, dovrai sacrificarne altre quattro — dello stesso livello immediatamente inferiore, e con esattamente una stella in meno di quella che vuoi far crescere. Un rito antico, ma efficace: ogni sacrificio è un passo verso una creatura più forte.</p><p>Non tutti i sacrifici devono pesare sulla tua collezione più preziosa: le carte <strong>Jolly</strong>, che troverai nei pacchetti del mercato, sono nate apposta per essere offerte al rito, senza doverti privare delle creature a cui tieni davvero.</p>` },

  { id: "combattimento", titolo: "⚔️ Combattimento", html: `<h3>Come funziona uno scontro</h3><p>Quando scendi in campo, scegli <strong>5 creature</strong> dal tuo mazzo e decidi con cura l'ordine in cui le schiererai. Lo scontro si gioca su 5 round: la tua prima creatura contro la loro prima, la seconda contro la seconda, e così via — ogni round deciso da <strong>una sola caratteristica</strong>, al singolo decimale. Vince chi prevale in almeno 3 round su 5.</p><h3>Terreno Congeniale</h3><p>Ma il campo di battaglia non è mai neutro: ogni scontro avviene su un terreno — Aria, Terra, Foresta o Acqua — e il terreno può essere alleato o nemico.</p><ul><li><strong>Volo</strong> → a suo agio in Aria, in difficoltà in Acqua</li><li><strong>Nuoto</strong> → a suo agio in Acqua, in difficoltà in Aria</li><li><strong>Arrampicata / Equilibrio</strong> → a loro agio tra Foresta e Terra, in difficoltà tra Acqua e Aria</li></ul><p><em>Consiglio da Evocatore: uno schieramento vincente non è solo quello con le statistiche più alte — è quello pensato per il terreno che ti aspetta.</em></p>` },

  { id: "fatica", titolo: "💪 Fatica e Vigore", html: `<h3>Vigore</h3><p>Ogni creatura che scende in battaglia si stanca: il suo <strong>Vigore</strong> scende del 10% a ogni scontro, e a Vigore 0% ha bisogno di riposo prima di tornare in campo.</p><h3>Recupero</h3><p>Il recupero però non si ferma mai, nemmeno a gioco chiuso: <strong>+10% ogni 30 minuti</strong>, in modo continuo. Se hai davvero bisogno di lei prima che sia tornata al massimo, puoi comunque schierarla a ricarica parziale — sta a te decidere se rischiare.</p>` },

  { id: "mondi", titolo: "🗺️ Mondi e Sottomondi", html: `<h3>I Mondi</h3><p>Il vero banco di prova di ogni Evocatore sono i <strong>Mondi</strong>: mappe vastissime fatte di esagoni, dove conquisti territorio sfidando avversari che non serve nemmeno trovare online — li affronti attraverso le difese che hanno lasciato.</p><p>Ogni Mondo ha una soglia d'ingresso pensata per il tuo livello di esperienza, dal principiante che muove i primi passi fino al veterano che accetta ogni carta in gioco.</p><h3>I Sottomondi</h3><p>Ogni Mondo si divide ulteriormente in Sottomondi, ciascuno con la propria variante di regole:</p><ul><li><strong>Normale:</strong> una statistica variabile a settimana</li><li><strong>Bifase:</strong> media di 2 statistiche</li><li><strong>Trifase:</strong> media di 3 statistiche</li><li><strong>Nebbia di Guerra:</strong> non vedi le carte avversarie</li></ul><p>Ogni settimana la mappa si rinnova, e chi ha conquistato di più viene ricompensato di conseguenza. Nessuna conquista è mai per sempre — ma nessuna vittoria è mai sprecata.</p>` },

  { id: "mercato", titolo: "🛒 Mercato", html: `<h3>Pacchetti di carte</h3><p>Le Dracme guadagnate in battaglia e i rari Frammenti d'Ambra trovati lungo il cammino sono la chiave per aprire nuovi pacchetti al Mercato. Ogni pacchetto è una porta verso creature che ancora non conosci — alcune comuni, altre che si lasciano scoprire solo da chi ha pazienza e fortuna in egual misura.</p><h3>Risorse</h3><ul><li><strong>Dracme:</strong> valuta comune, si ottiene giocando</li><li><strong>Frammenti d'Ambra:</strong> valuta rara, per pacchetti di livello superiore</li></ul>` },

  { id: "duelli", titolo: "🎲 Duelli con Scommessa", html: `<h3>L'Arena</h3><p>Non tutte le sfide hanno bisogno di un esagono. Nell'Arena dei Duelli puoi lanciare un guanto di sfida, scommettendo Dracme sul risultato — e aspettare che un altro Evocatore, in qualunque momento, decida di raccoglierlo. Il server calcola tutto all'istante: chi vince, incassa.</p><h3>Scaglioni</h3><p>Che tu voglia testare un mazzo appena assemblato o rischiare in grande con una posta importante, l'Arena ha uno scaglione adatto a te:</p><ul><li><strong>Minore:</strong> piccole quantità di Dracme</li><li><strong>Maggiore:</strong> quantità rilevanti</li><li><strong>Elite:</strong> Dracme + 1 Frammento d'Ambra, massimo 1 al giorno</li></ul><p>Limite: 10 duelli al giorno in totale, tra creati e accettati.</p>` },

  { id: "clan", titolo: "🛡️ Clan e Ruoli", html: `<h3>La fratellanza</h3><p>Nessun Evocatore leggendario ha mai camminato del tutto da solo. Unisciti a un Clan — o fondane uno tuo — e scopri il valore della fratellanza: scambio di carte quotidiano, strategie condivise, e ruoli che danno a ciascun membro un potere unico da esercitare quando la guerra chiama.</p><p>Un clan ha fino a 20 membri: 1 Comandante, fino a 3 Capitani, fino a 5 Sergenti, il resto Soldati. Solo il Comandante può promuovere o degradare i membri.</p><h3>Donazioni</h3><p>Puoi donare 1 carta di Livello 1 o 2 al giorno a un compagno di clan, spendendo 1 Frammento d'Ambra.</p><h3>Poteri di Ruolo</h3><ul><li><strong>Comandante:</strong> Amnistia di Guerra (ritira le difese di un tuo esagono, 1 volta a settimana) e Dichiarazione d'Assedio (dimezza la fatica in guerra per 24h)</li><li><strong>Capitano:</strong> Occhio dell'Oracolo (rivela le difese nemiche per 6h, 1 volta al giorno) e Staffetta Logistica (-1h di fatica a una tua carta, costa Dracme)</li><li><strong>Sergente:</strong> Marchio del Predatore (bonus al 1° round contro un esagono marcato) e Supervisore del Mercato (donazioni gratuite, senza Ambra)</li></ul>` },

  { id: "guerra", titolo: "⚔️ Guerra tra Clan", html: `<h3>L'assedio</h3><p>Quando i Clan si scontrano, la posta si alza. Torri Minori e una Cittadella centrale attendono al centro della mappa, difese da guarnigioni che possono ospitare fino a diversi mazzi schierati in fila — un assedio vero, non un semplice scontro.</p><p>Un settore normale genera 1 Punto Dominio l'ora, un Avamposto 10, la Cittadella centrale 30.</p><h3>La vittoria</h3><p>Il dominio si misura ora dopo ora, esagono dopo esagono. Alla fine della settimana, solo il Clan che ha saputo resistere più a lungo — e colpire più a fondo — porterà a casa la gloria e le ricompense che ne derivano.</p>` }

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

document.getElementById("btn-apri-guida")?.addEventListener("click", () => apriGuida("benvenuto"));

document.getElementById("btn-rivedi-tutorial")?.addEventListener("click", () => {
  document.getElementById("guide-modal").classList.add("hidden");
  apriTutorialChirone();
});

document.getElementById("close-guide-modal")?.addEventListener("click", () => {

  document.getElementById("guide-modal").classList.add("hidden");

});

document.getElementById("clan-chat-input")?.addEventListener("keydown", (e) => {

  if (e.key === "Enter") inviaMessaggioChatClan();

});

function sincronizzaEsagonoGuerra(esagono) {

  if (clanMioAttuale && clanMioAttuale.reale && utenteFirebaseAttuale) {

    dbFirebase.ref(`guerre_reali/${clanMioAttuale.firebaseId}/${esagono.r}/${esagono.c}`).set(esagono)

      .catch((err) => console.error("Errore sincronizzazione esagono guerra:", err));

  }

}

function attivaOracolo(esagono) {

  if (capitanoOracoliUsatiOggi >= 1) { alert("Hai già usato l'Occhio dell'Oracolo oggi!"); return; }

  esagono.oracoloScadenza = Date.now() + 6 * 60 * 60 * 1000;

  capitanoOracoliUsatiOggi++;

  alert("Occhio dell'Oracolo attivato: le difese di questo settore sono rivelate per 6 ore!");

  mostraDettagliEsagonoGuerra(esagono);

  sincronizzaEsagonoGuerra(esagono);

}

function attivaMarchioPredatore(esagono) {

  esagono.haMarchioPredatore = true;

  esagono.predatoreScadenza = Date.now() + 24 * 60 * 60 * 1000;

  alert("Marchio del Predatore applicato! Per 24 ore, chi nel clan attacca questo settore ha un bonus al primo round.");

  mostraDettagliEsagonoGuerra(esagono);

  sincronizzaEsagonoGuerra(esagono);

}

function attivaAmnistia(esagono) {

  if (amnistiaUsataQuestaSettimana) { alert("Hai già usato l'Amnistia di Guerra questa settimana!"); return; }

  esagono.guarnigioni = [];

  amnistiaUsataQuestaSettimana = true;

  alert("Amnistia di Guerra attivata: le truppe sono state richiamate. Il settore è ora indifeso, pronto per un nuovo schieramento a sorpresa.");

  mostraDettagliEsagonoGuerra(esagono);

  sincronizzaEsagonoGuerra(esagono);

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

        return `<div class="defense-row guarnigione-slot"><span><strong>${index + 1}° Slot:</strong> ${miniImmagineCarta(mostro)} ${mostro.nome}${stringaTratti}</span><div class="defense-stats"><span>F: ${mostro.statistiche.ferocia}</span><span>B: ${mostro.statistiche.balzo}</span><span>C: ${mostro.statistiche.corazza}</span><span>I: ${mostro.statistiche.istinto}</span></div></div>`;

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

      option.innerText = `${iconaCartaTesto(carta)} ${carta.nome} [${vigore}%] F:${carta.statistiche.ferocia} B:${carta.statistiche.balzo} C:${carta.statistiche.corazza} I:${carta.statistiche.istinto}${stringaTratti}`;

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

  localStorage.setItem("mythophedia_punti_dominio_giocatore", puntiDominioGiocatore.toString());

  localStorage.setItem("mythophedia_punti_dominio_bot1", puntiDominioBot1.toString());

  localStorage.setItem("mythophedia_punti_dominio_bot2", puntiDominioBot2.toString());

  localStorage.setItem("mythophedia_punti_dominio_bot3", puntiDominioBot3.toString());

  if (clanMioAttuale && clanMioAttuale.reale && utenteFirebaseAttuale && clanMioAttuale.firebaseId) {

    dbFirebase.ref("guerre_meta/" + clanMioAttuale.firebaseId).update({

      puntiDominioGiocatore: puntiDominioGiocatore,

      puntiDominioBot1: puntiDominioBot1,

      puntiDominioBot2: puntiDominioBot2,

      puntiDominioBot3: puntiDominioBot3

    }).catch((err) => console.error("Errore salvataggio punti dominio:", err));

  }

  const display = document.getElementById("war-player-dominio-pts");

  if (display) display.innerText = puntiDominioGiocatore;

}

function controllaFineSettimanaGuerra(callback) {

  if (!clanMioAttuale.reale || !utenteFirebaseAttuale) {

    const inizioSettimana = parseInt(localStorage.getItem("mythophedia_inizio_settimana_guerra") || "0");

    const adesso = Date.now();

    const SETTIMANA_MS = 7 * 24 * 60 * 60 * 1000;

    if (!inizioSettimana) {

      localStorage.setItem("mythophedia_inizio_settimana_guerra", adesso.toString());

      inizioSettimanaGuerraAttuale = adesso;

      aggiornaCountdownGuerra();

      callback();

      return;

    }

    puntiDominioGiocatore = parseFloat(localStorage.getItem("mythophedia_punti_dominio_giocatore") || "0");

    puntiDominioBot1 = parseFloat(localStorage.getItem("mythophedia_punti_dominio_bot1") || "0");

    puntiDominioBot2 = parseFloat(localStorage.getItem("mythophedia_punti_dominio_bot2") || "0");

    puntiDominioBot3 = parseFloat(localStorage.getItem("mythophedia_punti_dominio_bot3") || "0");

    if (adesso - inizioSettimana < SETTIMANA_MS) { inizioSettimanaGuerraAttuale = inizioSettimana; aggiornaCountdownGuerra(); callback(); return; }

    risolviRicompensaSettimanaGuerra(adesso);

    localStorage.setItem("mythophedia_inizio_settimana_guerra", adesso.toString());

    inizioSettimanaGuerraAttuale = adesso;

    aggiornaCountdownGuerra();

    callback();

    return;

  }

  const chiaveMeta = "guerre_meta/" + clanMioAttuale.firebaseId;

  dbFirebase.ref(chiaveMeta).once("value").then((snap) => {

    const inizioSettimana = snap.exists() ? snap.val().inizioSettimana : 0;

    const adesso = Date.now();

    const SETTIMANA_MS = 7 * 24 * 60 * 60 * 1000;

    if (!inizioSettimana) {

      dbFirebase.ref(chiaveMeta).set({ inizioSettimana: adesso, puntiDominioGiocatore: 0, puntiDominioBot1: 0, puntiDominioBot2: 0, puntiDominioBot3: 0 });

      inizioSettimanaGuerraAttuale = adesso;

      puntiDominioGiocatore = 0; puntiDominioBot1 = 0; puntiDominioBot2 = 0; puntiDominioBot3 = 0;

      aggiornaCountdownGuerra();

      callback();

      return;

    }

    const dati = snap.val();

    puntiDominioGiocatore = dati.puntiDominioGiocatore || 0;

    puntiDominioBot1 = dati.puntiDominioBot1 || 0;

    puntiDominioBot2 = dati.puntiDominioBot2 || 0;

    puntiDominioBot3 = dati.puntiDominioBot3 || 0;

    if (adesso - inizioSettimana < SETTIMANA_MS) { inizioSettimanaGuerraAttuale = inizioSettimana; aggiornaCountdownGuerra(); callback(); return; }

    risolviRicompensaSettimanaGuerra(adesso);

    dbFirebase.ref(chiaveMeta).set({ inizioSettimana: adesso });

    inizioSettimanaGuerraAttuale = adesso;

    aggiornaCountdownGuerra();

    callback();

  }).catch((err) => { console.error("Errore controllo settimana guerra:", err); callback(); });

}

function risolviRicompensaSettimanaGuerra(adesso) {

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

  localStorage.setItem("mythophedia_ultimo_calcolo_dominio", adesso.toString());

  localStorage.setItem("mythophedia_punti_dominio_giocatore", "0");

  localStorage.setItem("mythophedia_punti_dominio_bot1", "0");

  localStorage.setItem("mythophedia_punti_dominio_bot2", "0");

  localStorage.setItem("mythophedia_punti_dominio_bot3", "0");

}

document.getElementById("btn-avvia-guerra-placeholder")?.addEventListener("click", () => {

  if (!clanMioAttuale) { alert("Devi far parte di un clan per accedere alla guerra!"); return; }

  controllaFineSettimanaGuerra(() => {

    generaMappaGuerra(() => {

      calcolaPuntiDominioOrari();

      renderizzaMappaGuerraVisiva();

      document.getElementById("war-player-dominio-pts").innerText = puntiDominioGiocatore;

      document.getElementById("clan-war-modal").classList.remove("hidden");

    });

  });

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

    sincronizzaEsagonoGuerra(esagonoGuerraSelezionatoDati);

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

          <div style="font-size:1.5rem; margin:5px 0;">${miniImmagineCarta(miaCarta, 40)}</div>

          <div style="font-size:0.75rem; font-weight:bold; color:#fff;">PUNTI: ${mioValFinale}</div>

        </div>

        <div class="vs-clash-text" id="vs-text-war-${warRoundIdx}">ROUND ${warRoundIdx+1}</div>

        <div class="mini-card-anim" id="nem-war-card-${warRoundIdx}">

          <div style="font-size:0.8rem; font-weight:bold; color:#f56565;">${mostroNemico.nome}</div>

          <div style="font-size:1.5rem; margin:5px 0;">${miniImmagineCarta(mostroNemico, 40)}</div>

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

    if (clanMioAttuale.reale && utenteFirebaseAttuale) {

      dbFirebase.ref(`guerre_reali/${clanMioAttuale.firebaseId}/${esagonoGuerraSelezionatoDati.r}/${esagonoGuerraSelezionatoDati.c}`).set(esagonoGuerraSelezionatoDati)

        .catch((err) => console.error("Errore sincronizzazione assalto:", err));

    }

  } else {

    document.getElementById("battle-title-outcome").innerText = "Assalto Respinto";

    epilogoHTML += `<p style="text-align:center; color:#f56565; font-weight:bold;">Il mazzo in prima linea ha resistito. Round vinti: ${roundVintiGuerra} su 5.</p>`;

  }

  document.getElementById("battle-report-content").insertAdjacentHTML("beforeend", epilogoHTML);

}

document.getElementById("close-battle-modal")?.addEventListener("click", () => { 

  const modalCard = document.querySelector("#battle-result-modal .modal-card");
  const dentroFatiche = modalCard && modalCard.classList.contains("fatiche-bg-attivo");
  const dentroMito = modalCard && modalCard.classList.contains("mito-bg-attivo");

  if (dentroFatiche && sezioneFaticheCorrente !== "hub") {
    sezioneFaticheCorrente = "hub";
    renderContenutoFatiche();
    return;
  }

  if (dentroMito && cultureMitoCorrente !== null) {
    cultureMitoCorrente = null;
    renderContenutoMythophedia();
    return;
  }

  document.getElementById("battle-result-modal").classList.add("hidden"); 

  modalCard.classList.remove("mito-bg-attivo", "fatiche-bg-attivo", "fatiche-fullscreen");

  modalCard.style.backgroundImage = "";

});

document.getElementById("btn-raccoglitore")?.addEventListener("click", () => {
  sincronizzaCarteMondiInScadenza(() => renderizzaRaccoglitore(criterioOrdinamentoCorrente));
});

document.getElementById("modal-sort-select")?.addEventListener("change", (e) => {
  renderizzaRaccoglitore(e.target.value);
});

document.getElementById("raccoglitore-pag-prec")?.addEventListener("click", () => {
  paginaCorrenteRaccoglitore--;
  renderizzaPaginaRaccoglitore();
});

document.getElementById("raccoglitore-pag-succ")?.addEventListener("click", () => {
  paginaCorrenteRaccoglitore++;
  renderizzaPaginaRaccoglitore();
});

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
    xpAttuali: xpAttuali,
    slotMassimiDeck: slotMassimiDeck,
    nicknameUtente: nicknameUtente,
    presentationUtente: presentationUtente,
    avatarUtente: localStorage.getItem("user_avatar") || "",
    clanMioAttuale: clanMioAttuale,
    fatica1Stato: fatica1Stato,
    ruotaFortunaStato: ruotaFortunaStato,
    augiaStato: augiaStato,
    cavalleStato: cavalleStato,
    inseguimentoStato: inseguimentoStato,
    miraStato: miraStato,
    idraStato: idraStato,
    amazzoneStato: amazzoneStato,
    trappolaStato: trappolaStato,
    raStato: raStato,
    serieStato: serieStato,
    criterioOrdinamento: criterioOrdinamentoCorrente,
    toroStato: toroStato,
    furtoStato: furtoStato,
    giardinoStato: giardinoStato,
    cerberoStato: cerberoStato,
    faticheCompletateStato: faticheCompletateStato,
    tutorialCompletato: tutorialCompletato,
    tributoRaStato: tributoRaStato,
    ultimoSalvataggio: Date.now()
  };
}

function salvaProgressoCloud() {
  if (!utenteFirebaseAttuale) return;
  dbFirebase.ref("giocatori/" + utenteFirebaseAttuale.uid).set(raccogliDatiSalvataggio())
    .catch((err) => console.error("Errore salvataggio cloud:", err));
  aggiornaClassificaCloud();
}

function calcolaDatiClassificaGiocatore() {
  const carteVere = deckGiocatore.filter(c => !c.isJolly);

  let potenzaTotale = 0;
  let migliorFerocia = 0, migliorBalzo = 0, migliorCorazza = 0, migliorIstinto = 0;
  let maxStelle = 0, nomeCartaMaxStelle = "";

  carteVere.forEach(c => {
    const s = c.statistiche;
    potenzaTotale += (s.ferocia + s.balzo + s.corazza + s.istinto);
    if (s.ferocia > migliorFerocia) migliorFerocia = s.ferocia;
    if (s.balzo > migliorBalzo) migliorBalzo = s.balzo;
    if (s.corazza > migliorCorazza) migliorCorazza = s.corazza;
    if (s.istinto > migliorIstinto) migliorIstinto = s.istinto;
    if ((c.stelle || 0) > maxStelle) { maxStelle = c.stelle || 0; nomeCartaMaxStelle = c.nome; }
  });

  return {
    nome: nicknameUtente || "Evocatore",
    livello: livelloGiocatore,
    potenza: Math.round(potenzaTotale * 10) / 10,
    ferocia: Math.round(migliorFerocia * 10) / 10,
    balzo: Math.round(migliorBalzo * 10) / 10,
    corazza: Math.round(migliorCorazza * 10) / 10,
    istinto: Math.round(migliorIstinto * 10) / 10,
    stelle: maxStelle,
    cartaStelle: nomeCartaMaxStelle,
    aggiornato: Date.now()
  };
}

function aggiornaClassificaCloud() {
  if (!utenteFirebaseAttuale) return;
  dbFirebase.ref("classifica_giocatori/" + utenteFirebaseAttuale.uid).set(calcolaDatiClassificaGiocatore())
    .catch((err) => console.error("Errore aggiornamento classifica:", err));
}

// ===== Schermata Classifica: 6 categorie, Top 50, posizione propria sempre visibile =====

const CLASSIFICA_CATEGORIE = [
  { id: "livello", nome: "🏆 Livello", campo: "livello", unita: "" },
  { id: "potenza", nome: "💎 Potenza Raccoglitore", campo: "potenza", unita: "" },
  { id: "ferocia", nome: "🔥 Ferocia", campo: "ferocia", unita: "" },
  { id: "balzo", nome: "💨 Balzo", campo: "balzo", unita: "" },
  { id: "corazza", nome: "🛡️ Corazza", campo: "corazza", unita: "" },
  { id: "istinto", nome: "👁️ Istinto", campo: "istinto", unita: "" },
  { id: "stelle", nome: "⭐ Carta più Evoluta", campo: "stelle", unita: "★" }
];

let categoriaClassificaCorrente = "livello";
let cacheClassificaGiocatori = null;

function renderizzaTocClassifica() {
  const tocHtml = CLASSIFICA_CATEGORIE.map(cat => `
    <button type="button" class="attack-btn guide-toc-btn classifica-toc-btn" data-categoria="${cat.id}" style="width:100%; text-align:left; font-size:0.75rem; padding:8px; ${cat.id === categoriaClassificaCorrente ? 'background:linear-gradient(to bottom, #d69e2e, #b7791f);' : ''}">${cat.nome}</button>
  `).join("");
  document.getElementById("classifica-toc").innerHTML = tocHtml;

  document.querySelectorAll(".classifica-toc-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      categoriaClassificaCorrente = btn.dataset.categoria;
      renderizzaTocClassifica();
      renderizzaClassifica();
    });
  });
}

function apriClassificaModal() {
  document.getElementById("classifica-modal").classList.remove("hidden");

  renderizzaTocClassifica();

  document.getElementById("classifica-content").innerHTML = `<p style="text-align:center; color:#a89a7a;">Caricamento in corso...</p>`;

  dbFirebase.ref("classifica_giocatori").once("value").then((snapshot) => {
    cacheClassificaGiocatori = [];
    snapshot.forEach((child) => {
      cacheClassificaGiocatori.push(Object.assign({ uid: child.key }, child.val()));
    });
    renderizzaClassifica();
  }).catch((err) => {
    document.getElementById("classifica-content").innerHTML = `<p style="text-align:center; color:#f56565;">Impossibile caricare la classifica al momento.</p>`;
    console.error("Errore caricamento classifica:", err);
  });
}

function renderizzaClassifica() {
  if (!cacheClassificaGiocatori) return;

  const cat = CLASSIFICA_CATEGORIE.find(c => c.id === categoriaClassificaCorrente);
  const contentEl = document.getElementById("classifica-content");

  const ordinata = [...cacheClassificaGiocatori]
    .filter(g => typeof g[cat.campo] === "number")
    .sort((a, b) => b[cat.campo] - a[cat.campo]);

  const top50 = ordinata.slice(0, 50);
  const mioUid = utenteFirebaseAttuale ? utenteFirebaseAttuale.uid : null;
  const mieIndiceReale = ordinata.findIndex(g => g.uid === mioUid);

  const righeHtml = top50.map((g, i) => {
    const sonoIo = g.uid === mioUid;
    const dettaglio = cat.id === "stelle" && g.cartaStelle ? ` (${g.cartaStelle})` : "";
    return `
      <div class="classifica-riga${sonoIo ? " classifica-riga-mia" : ""}">
        <span class="classifica-pos">${i + 1}°</span>
        <span class="classifica-nome">${g.nome || "Evocatore"}${dettaglio}</span>
        <span class="classifica-valore">${g[cat.campo]}${cat.unita}</span>
      </div>`;
  }).join("");

  let fuoriClassificaHtml = "";
  if (mieIndiceReale >= 50) {
    const mieDati = ordinata[mieIndiceReale];
    const dettaglio = cat.id === "stelle" && mieDati.cartaStelle ? ` (${mieDati.cartaStelle})` : "";
    fuoriClassificaHtml = `
      <div class="classifica-separatore">· · ·</div>
      <div class="classifica-riga classifica-riga-mia">
        <span class="classifica-pos">${mieIndiceReale + 1}°</span>
        <span class="classifica-nome">${mieDati.nome || "Evocatore"}${dettaglio}</span>
        <span class="classifica-valore">${mieDati[cat.campo]}${cat.unita}</span>
      </div>`;
  } else if (mieIndiceReale === -1 && mioUid) {
    fuoriClassificaHtml = `<p style="text-align:center; color:#a89a7a; margin-top:10px; font-size:0.8rem;">Non hai ancora dati sufficienti per comparire in questa categoria.</p>`;
  }

  contentEl.innerHTML = `
    <h3 style="color:#ffcc66; margin-bottom:10px;">${cat.nome} — Top 50</h3>
    <div class="classifica-lista">${righeHtml || `<p style="text-align:center; color:#a89a7a;">Ancora nessun dato in questa categoria.</p>`}</div>
    ${fuoriClassificaHtml}
  `;
}

document.getElementById("btn-classifica")?.addEventListener("click", apriClassificaModal);
document.getElementById("close-classifica-modal")?.addEventListener("click", () => {
  document.getElementById("classifica-modal").classList.add("hidden");
});

function applicaDatiCaricati(dati) {
  deckGiocatore = dati.deckGiocatore || deckGiocatore;

  dracmeAttuali = (typeof dati.dracmeAttuali === "number") ? dati.dracmeAttuali : dracmeAttuali;
  ambraAttuale = (typeof dati.ambraAttuale === "number") ? dati.ambraAttuale : ambraAttuale;
  livelloGiocatore = dati.livelloGiocatore || livelloGiocatore;
  xpAttuali = (typeof dati.xpAttuali === "number") ? dati.xpAttuali : xpAttuali;

  if (typeof dati.slotMassimiDeck === "number") {
    let valoreAttesoVecchiaFormula = 50 + (livelloGiocatore - 1) * 5;
    if (dati.slotMassimiDeck === valoreAttesoVecchiaFormula) {
      slotMassimiDeck = 100 + (livelloGiocatore - 1) * 10;
      salvaProgressoCloud();
    } else {
      slotMassimiDeck = dati.slotMassimiDeck;
    }
  } else if (livelloGiocatore > 1) {
    slotMassimiDeck = 100 + (livelloGiocatore - 1) * 10;
    salvaProgressoCloud();
  }

  nicknameUtente = dati.nicknameUtente || nicknameUtente;
  presentationUtente = dati.presentationUtente || presentationUtente;
  if (typeof dati.avatarUtente === "string" && dati.avatarUtente) {
    localStorage.setItem("user_avatar", dati.avatarUtente);
  }
  if (dati.clanMioAttuale) clanMioAttuale = dati.clanMioAttuale;
  if (dati.fatica1Stato && typeof dati.fatica1Stato === "object") {
    fatica1Stato = Object.assign({ settimanaId: 0, carteSelezionate: [], carteUsate: [], gradinoAttuale: 0, tentativiOggi: 0, dataUltimoTentativo: "", premioFinaleRitirato: false }, dati.fatica1Stato);
  }
  if (dati.ruotaFortunaStato && typeof dati.ruotaFortunaStato === "object") {
    ruotaFortunaStato = Object.assign({ ultimoGiro: 0 }, dati.ruotaFortunaStato);
  }
  if (dati.augiaStato && typeof dati.augiaStato === "object") {
    augiaStato = Object.assign({ ultimoTentativo: 0 }, dati.augiaStato);
  }
  if (dati.cavalleStato && typeof dati.cavalleStato === "object") {
    cavalleStato = Object.assign({ tentativiOggi: 0, dataUltimoTentativo: "" }, dati.cavalleStato);
  }
  if (dati.inseguimentoStato && typeof dati.inseguimentoStato === "object") {
    inseguimentoStato = Object.assign({ tentativiOggi: 0, dataUltimoTentativo: "" }, dati.inseguimentoStato);
  }
  if (dati.miraStato && typeof dati.miraStato === "object") {
    miraStato = Object.assign({ tentativiOggi: 0, dataUltimoTentativo: "" }, dati.miraStato);
  }
  if (dati.idraStato && typeof dati.idraStato === "object") {
    idraStato = Object.assign({ tentativiOggi: 0, dataUltimoTentativo: "" }, dati.idraStato);
  }
  if (dati.amazzoneStato && typeof dati.amazzoneStato === "object") {
    amazzoneStato = Object.assign({ tentativiOggi: 0, dataUltimoTentativo: "" }, dati.amazzoneStato);
  }
  if (dati.trappolaStato && typeof dati.trappolaStato === "object") {
    trappolaStato = Object.assign({ tentativiOggi: 0, dataUltimoTentativo: "" }, dati.trappolaStato);
  }
  if (dati.raStato && typeof dati.raStato === "object") {
    raStato = Object.assign({ dataUltimoRitiro: "" }, dati.raStato);
  }
  if (dati.serieStato && typeof dati.serieStato === "object") {
    serieStato = Object.assign({ giorni: 0, dataUltimoRitiro: "" }, dati.serieStato);
  }
  if (typeof dati.criterioOrdinamento === "string") {
    criterioOrdinamentoCorrente = dati.criterioOrdinamento;
    localStorage.setItem("mythophedia_ordinamento_raccoglitore", criterioOrdinamentoCorrente);
  }
  if (dati.toroStato && typeof dati.toroStato === "object") {
    toroStato = Object.assign({ tentativiOggi: 0, dataUltimoTentativo: "" }, dati.toroStato);
  }
  if (dati.furtoStato && typeof dati.furtoStato === "object") {
    furtoStato = Object.assign({ tentativiOggi: 0, dataUltimoTentativo: "" }, dati.furtoStato);
  }
  if (dati.giardinoStato && typeof dati.giardinoStato === "object") {
    giardinoStato = Object.assign({ tentativiOggi: 0, dataUltimoTentativo: "" }, dati.giardinoStato);
  }
  if (dati.cerberoStato && typeof dati.cerberoStato === "object") {
    cerberoStato = Object.assign({ tentativiOggi: 0, dataUltimoTentativo: "" }, dati.cerberoStato);
  }
  if (dati.faticheCompletateStato && typeof dati.faticheCompletateStato === "object") {
    faticheCompletateStato = Object.assign({
      scala: false, idra: false, inseguimento: false, trappola: false,
      augia: false, sonaglio: false, toro: false, cavalle: false,
      amazzone: false, gregge: false, giardino: false
    }, dati.faticheCompletateStato);
  }
  if (typeof dati.tutorialCompletato === "boolean") {
    tutorialCompletato = dati.tutorialCompletato;
  }
  if (dati.tributoRaStato && typeof dati.tributoRaStato === "object") {
    tributoRaStato = Object.assign({ scambiOggi: 0, dataUltimoScambio: "" }, dati.tributoRaStato);
  }

  document.getElementById("dracme-count").innerText = dracmeAttuali;
  document.getElementById("ambra-count").innerText = ambraAttuale;
  aggiornaPulsantiLateraliRarita();
  if (typeof aggiornaVisualizzazioneClan === "function" && clanMioAttuale) aggiornaVisualizzazioneClan();
  aggiornaTopbarProfilo();

  if (!tutorialCompletato) {
    setTimeout(apriTutorialChirone, 600);
  }
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

function nascondiLoadingOverlay() {
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) return;
  overlay.classList.add("loading-overlay-hidden");
  setTimeout(() => overlay.remove(), 600);
}

setTimeout(nascondiLoadingOverlay, 8000);

authFirebase.onAuthStateChanged((user) => {
  utenteFirebaseAttuale = user;
  aggiornaUIAccount(user);

  if (!user) {
    salvataggioCloudCaricato = false;
    if (localStorage.getItem("mythophedia_tutorial_completato") !== "true") {
      setTimeout(apriTutorialChirone, 600);
    }
    nascondiLoadingOverlay();
    return;
  }

  dbFirebase.ref("giocatori/" + user.uid).once("value").then((snapshot) => {
    if (snapshot.exists()) {
      applicaDatiCaricati(snapshot.val());
      aggiornaClassificaCloud();
    } else {
      salvaProgressoCloud();
    }
    salvataggioCloudCaricato = true;
    controllaRegaliInSospeso();
    nascondiLoadingOverlay();
  }).catch((err) => {
    console.error("Errore caricamento cloud:", err);
    alert("Non sono riuscito a caricare i tuoi dati dal cloud. Riprova più tardi.");
    nascondiLoadingOverlay();
  });
});

function controllaRegaliInSospeso() {
  if (!utenteFirebaseAttuale) return;
  const rifRegali = dbFirebase.ref("regali/" + utenteFirebaseAttuale.uid);
  rifRegali.once("value").then((snapshot) => {
    if (!snapshot.exists()) return;
    let elencoNomi = [];
    snapshot.forEach((childSnap) => {
      const dati = childSnap.val();
      const nuovaCarta = Object.assign({}, dati.carta, {
        id: "carta_regalo_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
        occupataInDifesa: false, coordinatePresidio: null, mondoPresidio: null, sottomondoPresidio: null,
        bloccataInDuello: false, faticaMondo: 0, fatigueGuerra: 0, inizioRiposo: null, ultimoAggiornamentoFatica: null
      });
      deckGiocatore.push(nuovaCarta);
      elencoNomi.push(`${dati.carta.nome} (da ${dati.mittenteNome})`);
    });
    rifRegali.remove();
    salvaProgressoCloud();
    aggiornaPulsantiLateraliRarita();
    alert(`Hai ricevuto ${elencoNomi.length} carta/e in regalo!\n\n${elencoNomi.join("\n")}`);
  }).catch((err) => console.error("Errore controllo regali:", err));
}

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

aggiornaTopbarProfilo();

// Gestione video introduttivo: parte all'apertura dell'app e si chiude da solo
// alla fine (o subito, se l'utente preme "Salta" o se l'autoplay viene bloccato).
(() => {
  const introSplash = document.getElementById("intro-splash");
  const introVideo = document.getElementById("intro-video");
  const introSkipBtn = document.getElementById("intro-skip-btn");
  if (!introSplash || !introVideo) return;

  document.body.classList.add("intro-playing");

  const chiudiIntro = () => {
    introSplash.classList.add("intro-hidden");
    document.body.classList.remove("intro-playing");
    setTimeout(() => introSplash.remove(), 700);
  };

  introVideo.addEventListener("ended", chiudiIntro);
  if (introSkipBtn) introSkipBtn.addEventListener("click", chiudiIntro);

  // Se il browser blocca l'autoplay (es. policy mobile), non blocchiamo l'utente
  const tentativoPlay = introVideo.play();
  if (tentativoPlay && typeof tentativoPlay.catch === "function") {
    tentativoPlay.catch(() => chiudiIntro());
  }
})();

// ===== Musica di sottofondo: parte al 100% al primo tocco/click, poi resta in loop per tutta la sessione =====
(function() {
  const musica = document.getElementById("musica-sottofondo");
  if (!musica) return;
  musica.volume = 1.0;

  function avviaMusica() {
    musica.play().catch(() => {}); // se il browser blocca ancora, ritenteremo al prossimo tocco
    document.removeEventListener("click", avviaMusica);
    document.removeEventListener("touchstart", avviaMusica);
  }

  document.addEventListener("click", avviaMusica);
  document.addEventListener("touchstart", avviaMusica);
})();

// CHIUSURA DEFINITIVA DI TUTTO LO SCRIPT

});