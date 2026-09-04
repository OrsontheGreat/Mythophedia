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

// Tentativo di schermo intero nativo al primo tocco: il manifest.json chiede già la modalità
// "fullscreen", ma su alcuni telefoni/versioni Android non basta da sola a nascondere la barra
// di stato (orologio, batteria) — questo è un secondo tentativo via API del browser, innocuo
// se il sistema lo ignora o non lo supporta.
document.addEventListener("touchstart", () => {
  const el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
}, { once: true, passive: true });

// ===== Menu a tendina personalizzati (compatibili con la rotazione forzata orizzontale) =====
// I <select> nativi vengono disegnati dal sistema operativo/browser e NON seguono la rotazione
// CSS applicata al resto della pagina: risultavano quindi "storti" su telefono, leggibili solo
// ruotando fisicamente lo schermo. Li sostituiamo con un menu disegnato da noi (bottone + lista),
// tenendo il <select> originale nel DOM ma invisibile: tutto il resto del codice, che legge/scrive
// .value, .disabled o le <option> su questi elementi, continua a funzionare senza modifiche.
// Ricordano l'ultimo filtro/ordinamento scelto nei menu di scelta creature, così passando da
// una carta all'altra (es. i 5 slot di una squadra) non serve reimpostarli ogni volta.
let fakeSelectUltimoFiltroRarita = "";
let fakeSelectUltimoOrdinamento = "";

function potenziaMenuATendina() {

  const selettori = document.querySelectorAll("select.deploy-select, #modal-sort-select, #modal-rarita-select");

  selettori.forEach(sel => {

    if (sel.dataset.potenziato === "1") return;
    sel.dataset.potenziato = "1";

    const wrapper = document.createElement("div");
    wrapper.className = "fake-select-wrapper";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "fake-select-trigger";
    if (sel.id === "modal-sort-select") { trigger.classList.add("sort-select"); wrapper.id = "modal-sort-select-wrapper"; }

    sel.parentNode.insertBefore(wrapper, sel);
    wrapper.appendChild(trigger);
    wrapper.appendChild(sel);

    function aggiornaTesto() {
      const opt = sel.options[sel.selectedIndex];
      trigger.textContent = opt ? opt.textContent : "";
      wrapper.classList.toggle("fake-select-disabled", !!sel.disabled);
    }

    // Invece di creare un livello indipendente sopra tutto (che si è dimostrato inaffidabile
    // nel contenitore ruotato del gioco), riuso lo stesso .modal-card del modale già aperto
    // attorno a questo select: nascondo temporaneamente il suo contenuto normale e mostro la
    // lista al suo posto, dentro un box che sappiamo già essere correttamente posizionato e
    // dimensionato sullo schermo, perché è quello visibile in quel momento.
    function apriLista() {
      if (sel.disabled) return;

      const modaleAperto = sel.closest(".modal-overlay");
      const cardModale = modaleAperto ? modaleAperto.querySelector(".modal-card") : null;
      if (!cardModale) return;

      const vecchio = cardModale.querySelector("#fake-select-overlay-attivo");
      if (vecchio) vecchio.remove();

      const figliOriginali = Array.from(cardModale.children).filter(f => f.id !== "fake-select-overlay-attivo");
      figliOriginali.forEach(f => { f.dataset.nascostoPerScelta = "1"; f.style.display = "none"; });

      const overlay = document.createElement("div");
      overlay.id = "fake-select-overlay-attivo";
      overlay.className = "fake-select-list";

      function chiudiOverlay() {
        overlay.remove();
        figliOriginali.forEach(f => { delete f.dataset.nascostoPerScelta; f.style.display = ""; });
      }

      const intestazione = document.createElement("div");
      intestazione.className = "fake-select-list-header";
      const titolo = document.createElement("span");
      const etichettaVicina = sel.previousElementSibling && sel.previousElementSibling.tagName === "SPAN" ? sel.previousElementSibling.textContent.trim() : "";
      titolo.innerText = etichettaVicina ? `Scegli — ${etichettaVicina}` : "Scegli";
      const btnChiudi = document.createElement("button");
      btnChiudi.type = "button";
      btnChiudi.className = "fake-select-list-chiudi";
      btnChiudi.innerText = "✕";
      btnChiudi.addEventListener("click", (e) => { e.stopPropagation(); chiudiOverlay(); });
      intestazione.appendChild(titolo);
      intestazione.appendChild(btnChiudi);
      overlay.appendChild(intestazione);

      const contieneCarte = Array.from(sel.options).some(opt => opt.dataset.carta);
      const contenitoreOpzioni = contieneCarte ? document.createElement("div") : overlay;

      if (contieneCarte) {
        const rigaOrdinamento = document.createElement("div");
        rigaOrdinamento.className = "fake-select-riga-ordinamento";

        const selRarita = document.createElement("select");
        selRarita.className = "sort-select";
        selRarita.innerHTML = `
          <option value="">Tutte le rarità</option>
          <option value="1">Solo Comuni</option>
          <option value="2">Solo Non Comuni</option>
          <option value="3">Solo Rare</option>
          <option value="4">Solo Epiche</option>
          <option value="5">Solo Mitiche</option>
          <option value="6">Solo Leggendarie</option>`;
        selRarita.value = fakeSelectUltimoFiltroRarita;

        const selOrdina = document.createElement("select");
        selOrdina.className = "sort-select";
        selOrdina.innerHTML = `
          <option value="">Ordine originale</option>
          <option value="nome">Nome (A-Z)</option>
          <option value="rarita_desc">Rarità (dalla più alta)</option>
          <option value="rarita">Rarità (dalla più bassa)</option>
          <option value="ferocia">Ferocia</option>
          <option value="balzo">Balzo</option>
          <option value="corazza">Corazza</option>
          <option value="istinto">Istinto</option>
          <option value="stelle">Stelle (dalla più evoluta)</option>
          <option value="vigore">Vigore (dal più alto)</option>`;
        selOrdina.value = fakeSelectUltimoOrdinamento;

        rigaOrdinamento.appendChild(selRarita);
        rigaOrdinamento.appendChild(selOrdina);
        overlay.appendChild(rigaOrdinamento);

        selRarita.addEventListener("click", (e) => e.stopPropagation());
        selOrdina.addEventListener("click", (e) => e.stopPropagation());
        selRarita.addEventListener("change", () => { fakeSelectUltimoFiltroRarita = selRarita.value; renderizzaGrigliaCarte(); });
        selOrdina.addEventListener("change", () => { fakeSelectUltimoOrdinamento = selOrdina.value; renderizzaGrigliaCarte(); });

        contenitoreOpzioni.className = "fake-select-griglia-carte";
        overlay.appendChild(contenitoreOpzioni);
      }

      // Le voci senza dati carta (il segnaposto "-- Seleziona --") vanno gestite a parte: senza
      // questo controllo, il confronto tenta di leggere proprietà da un valore nullo e l'intero
      // ordinamento si interrompe in silenzio.
      function comparatoreSicuro(fn) {
        return (a, b) => {
          if (!a.carta && !b.carta) return 0;
          if (!a.carta) return 1;
          if (!b.carta) return -1;
          return fn(a, b);
        };
      }

      const CRITERI_ORDINAMENTO = {
        nome: comparatoreSicuro((a, b) => a.carta.nome.localeCompare(b.carta.nome)),
        rarita: comparatoreSicuro((a, b) => (a.carta.livello || 0) - (b.carta.livello || 0)),
        rarita_desc: comparatoreSicuro((a, b) => (b.carta.livello || 0) - (a.carta.livello || 0)),
        ferocia: comparatoreSicuro((a, b) => (b.carta.statistiche?.ferocia || 0) - (a.carta.statistiche?.ferocia || 0)),
        balzo: comparatoreSicuro((a, b) => (b.carta.statistiche?.balzo || 0) - (a.carta.statistiche?.balzo || 0)),
        corazza: comparatoreSicuro((a, b) => (b.carta.statistiche?.corazza || 0) - (a.carta.statistiche?.corazza || 0)),
        istinto: comparatoreSicuro((a, b) => (b.carta.statistiche?.istinto || 0) - (a.carta.statistiche?.istinto || 0)),
        stelle: comparatoreSicuro((a, b) => (b.carta.stelle || 0) - (a.carta.stelle || 0)),
        vigore: comparatoreSicuro((a, b) => (b.carta.vigore || 0) - (a.carta.vigore || 0))
      };

      const tutteLeOpzioni = Array.from(sel.options).map((opt, idx) => ({
        opt, idx, carta: opt.dataset.carta ? JSON.parse(opt.dataset.carta) : null
      }));

      function costruisciVoceOpzione({ opt, idx, carta }) {
        if (carta) {
          const voce = document.createElement("div");
          voce.className = "fake-select-opzione-carta" + (opt.disabled ? " disabled" : "") + (opt.value === sel.value ? " selected" : "");
          voce.innerHTML = costruisciCartaVisualeOpzione(carta);
          if (!opt.disabled) {
            voce.addEventListener("click", (e) => {
              e.stopPropagation();
              sel.value = opt.value;
              sel.dispatchEvent(new Event("change", { bubbles: true }));
              chiudiOverlay();
            });
          }
          return voce;
        }
        const voce = document.createElement("div");
        voce.className = "fake-select-option" + (opt.disabled ? " disabled" : "") + (idx === sel.selectedIndex ? " selected" : "");
        voce.textContent = opt.textContent;
        if (!opt.disabled) {
          voce.addEventListener("click", (e) => {
            e.stopPropagation();
            sel.value = opt.value;
            sel.dispatchEvent(new Event("change", { bubbles: true }));
            chiudiOverlay();
          });
        }
        return voce;
      }

      function renderizzaGrigliaCarte() {
        const rigaOrdinamento = overlay.querySelector(".fake-select-riga-ordinamento");
        const filtroRarita = rigaOrdinamento ? rigaOrdinamento.children[0].value : "";
        const criterio = rigaOrdinamento ? rigaOrdinamento.children[1].value : "";

        let elenco = tutteLeOpzioni.slice();
        if (filtroRarita) elenco = elenco.filter(o => o.carta && o.carta.livello === parseInt(filtroRarita));
        if (criterio && CRITERI_ORDINAMENTO[criterio]) elenco.sort(CRITERI_ORDINAMENTO[criterio]);

        contenitoreOpzioni.innerHTML = "";
        elenco.forEach(o => contenitoreOpzioni.appendChild(costruisciVoceOpzione(o)));
      }

      renderizzaGrigliaCarte();

      overlay.addEventListener("click", (e) => { e.stopPropagation(); });

      cardModale.appendChild(overlay);
    }

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      apriLista();
    });

    // Restiamo sincronizzati se il resto del codice cambia opzioni/valore/stato disabled del select originale
    const osservatore = new MutationObserver(aggiornaTesto);
    osservatore.observe(sel, { attributes: true, childList: true, subtree: true, attributeFilter: ["disabled"] });
    sel.addEventListener("change", aggiornaTesto);

    aggiornaTesto();

  });

}

// Copia locale — ETICHETTE_LIVELLI "vera" vive dentro la closure principale e non è
// raggiungibile da qui, ma è solo un piccolo dizionario statico: costa poco duplicarla.
const ETICHETTE_LIVELLI_LOCALE = { 1: "Comune", 2: "Non Comune", 3: "Rara", 4: "Epica", 5: "Mitica", 6: "Leggendaria" };

// Costruisce una carta visiva a partire da un vero oggetto carta (immagine, statistiche, vigore,
// stelle) — usata da apriLista() qui sopra per mostrare le creature nei menu di scelta ovunque
// nel gioco. Vive qui, fuori dalla closure principale, perché è proprio da qui che viene chiamata.
function costruisciCartaVisualeOpzione(carta) {
  const s = carta.statistiche;
  const trattiTesto = carta.tratti && carta.tratti.length > 0
    ? carta.tratti.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")
    : "Nessun tratto";
  const raritaTesto = carta.livello ? ETICHETTE_LIVELLI_LOCALE[carta.livello] || "" : "";

  return `
    <div class="tutorial-carta-esempio">
      <img src="${carta.immagine}" class="tutorial-carta-esempio-img" onerror="this.style.display='none';">
      ${raritaTesto ? `<div style="font-size:0.6rem; color:#c9a054; font-weight:bold; margin-top:2px;">${raritaTesto}</div>` : ""}
      <div class="tutorial-carta-esempio-nome">${carta.nome}${carta.stelle !== undefined && carta.stelle !== null ? ` (${carta.stelle}★)` : ""}</div>
      ${carta.vigore !== undefined && carta.vigore !== null ? `<div style="font-size:0.68rem; font-weight:bold; color:${carta.vigore > 30 ? '#7ee787' : '#f56565'}; margin-top:2px;">Vigore: ${carta.vigore}%</div>` : ""}
      ${s ? `
      <div class="tutorial-carta-esempio-stats">
        <span>Ferocia: <b>${s.ferocia}</b></span>
        <span>Balzo: <b>${s.balzo}</b></span>
        <span>Corazza: <b>${s.corazza}</b></span>
        <span>Istinto: <b>${s.istinto}</b></span>
      </div>` : ""}
      <div class="tutorial-carta-esempio-tratto">${trattiTesto}</div>
    </div>`;
}

document.addEventListener("click", () => {
  const overlayAttivo = document.querySelector("#fake-select-overlay-attivo");
  if (overlayAttivo) {
    const cardModale = overlayAttivo.parentElement;
    overlayAttivo.remove();
    if (cardModale) {
      Array.from(cardModale.children).forEach(f => {
        if (f.dataset.nascostoPerScelta) { delete f.dataset.nascostoPerScelta; f.style.display = ""; }
      });
    }
  }
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

 

  // Variabili per donazioni carte tra giocatori

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

 

  // Controllo e reset giornaliero (donazioni, poteri del Capitano) allo scattare della mezzanotte reale

  function controllaResetGiornaliero() {

    const oggi = new Date().toDateString();

    const ultimoReset = localStorage.getItem("mythophedia_ultimo_reset");

 

    if (ultimoReset !== oggi) {

      donazioneFattaOggi = false;

      capitanoOracoliUsatiOggi = 0;

      localStorage.setItem("mythophedia_ultimo_reset", oggi);

    }

  }

  controllaResetGiornaliero();

  setInterval(controllaResetGiornaliero, 30000);

 

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
  "Cacciatori della Caccia Selvaggia": "Nel folklore nordico ed europeo, la Caccia Selvaggia è un corteo spettrale di cacciatori e segugi che attraversa il cielo notturno, spesso guidato da una divinità o da un'anima dannata. Vederla passare era considerato un presagio di sventura o di guerra imminente.<br><br><b>Il mito completo:</b> Il capo specifico della Caccia Selvaggia varia drammaticamente tra le diverse tradizioni regionali e nazionali — nel folklore tedesco, spesso Wodan/Odino stesso; nella tradizione francese, talvolta re Artù o il cacciatore maledetto Hellequin; nel folklore inglese, figure come Herne il Cacciatore; in varie regioni, talvolta un'anima mortale dannata condannata a una caccia spettrale eterna come punizione per qualche peccato (l'amore eccessivo per la caccia rispetto all'osservanza religiosa, in molte versioni) — riflettendo come questo motivo folkloristico centrale di un corteo spettrale di caccia aerea si sia diffuso e adattato indipendentemente attraverso un'enorme estensione geografica di culture nordeuropee mantenendo caratteristiche strutturali fondamentali ampiamente simili.<br><br><b>Contesto culturale:</b> Incontrare la Caccia Selvaggia era universalmente considerato estremamente pericoloso in praticamente tutte le sue varianti regionali — ai viandanti si consigliava di gettarsi a faccia in giù sul terreno ed evitare di guardare direttamente il corteo, dato che essere notati o, peggio, essere fisicamente rapiti e costretti a unirsi ai cavalieri spettrali era un esito narrativo comune e molto temuto in molti racconti.<br><br><b>Curiosità:</b> Il motivo della Caccia Selvaggia visse una significativa rinascita e reinterpretazione durante il movimento romantico del XIX secolo, quando folkloristi e scrittori (inclusi i Fratelli Grimm, che scrissero ampiamente sulla tradizione) la trattarono come prova di una mitologia pangermanica pagana antica coerente e unificata — sebbene gli studiosi moderni siano considerevolmente più cauti su quanto la tradizione fosse genuinamente unificata o antica prima che questa sistematizzazione accademica del XIX secolo plasmasse significativamente come il folklore viene oggi popolarmente inteso.",
  "Caladri": "Uccello bianco della leggenda medievale capace di assorbire la malattia di chi guarda: se il paziente è destinato a guarire, il Caladrio lo fissa negli occhi e vola via portando via il male; se è condannato, gli volta lo sguardo altrove.<br><br><b>Il mito completo:</b> Oltre a diagnosticare semplicemente la malattia attraverso lo sguardo, il potere curativo del Caladrio operava attraverso un meccanismo di trasferimento specifico: fissando direttamente gli occhi del malato e assorbendone la malattia nel proprio corpo, per poi volare in alto verso il sole, dove il male veniva bruciato e disperso, guarendo completamente il paziente mentre l'uccello stesso restava illeso. I bestiari medievali (attingendo in parte alla precedente storia naturale romana, in particolare alla descrizione pliniana di un simile uccello bianco chiamato \"icterus\") elaborarono il Caladrio in una figura allegorica esplicitamente cristiana — il suo colore bianco puro rappresentava l'assenza di peccato di Cristo, e il suo sguardo curativo rappresentava il potere di Cristo di assumere su di sé i peccati dell'umanità e bruciarli attraverso il proprio sacrificio.<br><br><b>Contesto culturale:</b> Il Caladrio divenne un soggetto particolarmente popolare specificamente nelle corti reali medievali, dove l'uccello veniva talvolta tenuto (o si affermava che venisse tenuto) come vero e proprio strumento diagnostico per la salute di re e nobili — la sua presunta affidabilità medica trattata con sorprendente letteralità in alcuni resoconti storici.<br><br><b>Curiosità:</b> La lettura allegorica cristiana del Caladrio (assorbire peccato/malattia e portarlo verso la luce per essere distrutto) rappresenta uno dei casi più chiari dell'intera collezione di una creatura originariamente pagana o naturalistica di epoca romana deliberatamente reinterpretata secoli dopo in un simbolismo teologico cristiano esplicito durante il periodo medievale.",
  "Cigno di Apollo": "Il cigno era sacro ad Apollo, dio della musica e della profezia: si credeva che questi uccelli intonassero il loro canto più bello proprio in punto di morte, da cui l'espressione \"canto del cigno\".<br><br><b>Il mito completo:</b> Secondo alcune tradizioni, il cigno trainava il carro di Apollo o ne trasportava l'anima; il nome è legato anche a diversi personaggi di nome Cigno trasformati in questo uccello dal dolore — il più celebre, un amico di Fetonte, pianse così intensamente la sua morte lungo il fiume Eridano che gli dèi, impietositi, lo trasformarono in un cigno.<br><br><b>Contesto culturale:</b> L'associazione del cigno con l'eccellenza poetica e musicale rese l'uccello un simbolo ricorrente per i poeti stessi nella tradizione letteraria occidentale successiva (poeti chiamati metaforicamente \"cigni\", come Shakespeare definito \"il Cigno di Avon\").<br><br><b>Curiosità:</b> L'espressione \"canto del cigno\", usata ancora oggi per descrivere l'ultima grande opera di qualcuno prima della morte o del ritiro, deriva direttamente da questa antica (per quanto biologicamente falsa) credenza greca secondo cui i cigni cantano solo una volta nella vita, proprio prima di morire.",
  "Fenice Pulcino": "La Fenice è l'uccello immortale per eccellenza: quando sente avvicinarsi la morte, si dà fuoco sul proprio nido per poi rinascere dalle sue stesse ceneri, simbolo di eterno rinnovamento.<br><br><b>Il mito completo:</b> Le fonti antiche non concordano su come esattamente nasca la nuova Fenice: alcune raccontano che sia lo stesso uccello genitore a trasformarsi e rinascere dalle proprie ceneri, altre (più vicine alla tradizione di Erodoto) narrano che un nuovo e distinto piccolo nasca da una massa a forma d'uovo di mirra formata dai resti del genitore, che il giovane uccello porta poi fino a Eliopoli per seppellire il proprio stesso predecessore — rendendo il \"pulcino\" al tempo stesso la medesima Fenice immortale e, paradossalmente, il proprio figlio.<br><br><b>Contesto culturale:</b> Questo paradosso della Fenice come genitore e figlio insieme, sé stessa e la propria erede, affascinò in particolare i teologi cristiani successivi, che vi trovarono un parallelo naturale utile alla dottrina della resurrezione — il pulcino di Fenice non è semplicemente un nuovo uccello, è quello vecchio, trasformato e rinnovato.<br><br><b>Curiosità:</b> Il naturalista romano Plinio il Vecchio affermò di conoscere con precisione le riapparizioni cicliche della Fenice, legandole a date storiche specifiche di Roma, trattando il mito con sorprendente letteralità quasi burocratica — un caso interessante di scrittura \"scientifica\" antica che accoglie affermazioni mitologiche come fatti verificabili accanto alla storia naturale genuina.",
  "Grifone Recluta": "Metà leone e metà aquila, il Grifone univa nella tradizione greca e persiana la forza del re degli animali terrestri alla maestosità del re dei cieli. Si narrava custodisse gelosamente tesori d'oro nelle montagne.<br><br><b>Il mito completo:</b> Oltre al celebre ruolo di guardiani dell'oro nella Scizia, i giovani grifoni venivano immaginati in alcune tradizioni come allevati appositamente per custodire recinti sacri e tesorerie templari — l'immagine del grifone decorava emblemi di scudi, ornamenti dei tetti dei templi (akroteria) e armature proprio perché la creatura simboleggiava una protezione incorruttibile e vigile fin dalla giovane età.<br><br><b>Contesto culturale:</b> La duplice natura del grifone (aquila e leone, entrambi predatori supremi nei rispettivi regni) rendeva anche un grifone \"giovane\" un potente simbolo protettivo nella cultura visiva greca, comparendo su innumerevoli scudi, monete e dettagli architettonici come guardiani in formazione di spazi sacri o preziosi.<br><br><b>Curiosità:</b> L'immagine del grifone compare su alcune delle più antiche monete greche superstiti, in particolare da città come Teo e Abdera in Asia Minore, le cui economie dipendevano da rotte commerciali che passavano vicino a regioni associate all'oro custodito dai grifoni — un caso in cui la mitologia ha plasmato direttamente l'iconografia economica e civica reale.",
  "Hræsvelgr": "Nella mitologia norrena, questo gigante in forma d'aquila siede ai confini del mondo: è il battito delle sue ali immense a generare tutti i venti che soffiano sulla Terra.<br><br><b>Il mito completo:</b> Nominato nel Vafþrúðnismál dell'Edda poetica, dove il saggio gigante Vafþrúðnir, interrogato da un Odino travestito in una gara di sapienza, rivela il nome e la natura di Hræsvelgr come uno dei diversi enigmi cosmologici posti nella sfida. Il suo nome si traduce letteralmente come \"Divoratore di Cadaveri\", un dettaglio inquietante secondo alcune interpretazioni — oltre a generare vento battendo le ali, potrebbe anche nutrirsi dei morti, legandolo tematicamente al ruolo di Nidhogg stesso, divoratore di cadaveri all'estremità opposta della struttura cosmica dell'albero del mondo.<br><br><b>Contesto culturale:</b> I giganti generatori di vento e gli uccelli cosmici rappresentano uno schema cosmologico norreno ricorrente per spiegare i fenomeni naturali (il vento, il tempo atmosferico) attraverso un'agenzia incarnata e personificata piuttosto che forze naturali impersonali — riflettendo una visione del mondo più ampia in cui persino fenomeni meteorologici apparentemente astratti avevano \"cause\" mitologiche specifiche, dotate di nome e motivazione.<br><br><b>Curiosità:</b> Il formato della gara di sapienza del Vafþrúðnismál, dove viene rivelata l'esistenza di Hræsvelgr, è di per sé un genere distintivo all'interno della poesia mitologica norrena — la conoscenza cosmologica trasmessa non attraverso una narrazione diretta ma attraverso un teso duello di domande e risposte in cui il perdente rimette la propria testa, conferendo alla presentazione di Hræsvelgr nella mitologia registrata una cornice narrativa dall'esito insolitamente alto rispetto alla maggior parte delle altre creature.",
  "Ieraco": "Secondo il mito greco, Ieraco (Hierax) fu trasformato in falco da Apollo ed Ermes come punizione per la sua empietà, condannato a vivere da predatore alato per l'eternità.<br><br><b>Il mito completo:</b> Ieraco era un uomo — troiano o misio, secondo le fonti — celebre per la sua devozione esclusiva a Demetra e per il disprezzo mostrato verso Apollo e gli altri dèi celesti, prediligendo unicamente le divinità della terra. Questa scelta suscitò l'ira di Apollo ed Ermes, che lo trasformarono in falco — uccello ironicamente sacro proprio ad Apollo, come simbolo profetico, nonostante fosse diventato la forma della punizione di Ieraco.<br><br><b>Contesto culturale:</b> Il mito riflette la convinzione greca nella metamorfosi come punizione divina calibrata esattamente sulla colpa: l'eccessiva devozione di Ieraco a un solo gruppo di dèi, escludendo gli altri, si traduce in un'eterna irrequietezza da predatore.<br><br><b>Curiosità:</b> La parola greca hierax significa letteralmente \"falco\", e ha dato origine al nome scientifico del genere Hierax, tuttora usato per un gruppo di piccoli falchi — un altro caso di terminologia mitologica e descrittiva greca sopravvissuta direttamente nella tassonomia zoologica moderna.",
  "Ippogrifo": "Creatura nata dall'unione (ritenuta impossibile) tra un grifone e una giumenta, l'Ippogrifo divenne celebre nei poemi cavallereschi rinascimentali come cavalcatura capace di volare a velocità straordinarie.<br><br><b>Il mito completo:</b> L'Ippogrifo compare più celebremente nell'\"Orlando Furioso\" di Ludovico Ariosto (1516), dove il cavaliere Ruggiero lo cavalca in volo per compiere numerose imprese, incluso il celebre salvataggio di Angelica incatenata a uno scoglio da un mostro marino — Ariosto stesso, nel poema, gioca esplicitamente con l'idea dell'impossibilità biologica della creatura, dato che nella tradizione classica i grifoni erano notoriamente ostili e predatori verso i cavalli, rendendo la loro unione un simbolo letterario deliberato dell'impossibile reso possibile solo dalla pura invenzione poetica.<br><br><b>Contesto culturale:</b> L'Ippogrifo rappresenta un caso relativamente raro in questa collezione di una creatura non nata da un'autentica tradizione popolare orale antica, ma inventata consapevolmente da un singolo autore rinascimentale come dispositivo letterario e simbolo retorico — un promemoria di come la letteratura colta, non solo il folklore popolare, abbia generato creature mitologiche capaci poi di assumere vita propria nell'immaginario collettivo successivo.<br><br><b>Curiosità:</b> L'Ippogrifo ha conosciuto una vastissima rinascita di popolarità globale attraverso la serie di Harry Potter di J.K. Rowling, dove compare come \"Fierobecco\", uno degli animali fantastici più memorabili della saga — portando questa creatura nata da un poema epico italiano del Cinquecento a una fama internazionale contemporanea di gran lunga superiore a quella goduta nei secoli precedenti la sua reinvenzione nella narrativa fantasy moderna.",
  "Keres della Cenere": "Le Keres sono spiriti femminili greci che si aggirano sui campi di battaglia in cerca di anime da reclamare, personificazioni oscure della morte violenta e improvvisa.<br><br><b>Il mito completo:</b> Distinte dal più pacato dio della morte Thanatos, le Keres erano raffigurate come piccole figure alate dotate di zanne e artigli, che bevevano il sangue dei morenti sui campi di battaglia. Nell'Iliade, prima del duello finale tra Achille ed Ettore, Zeus pesa su una bilancia d'oro le rispettive \"sorti\" (kēres) dei due guerrieri per stabilire chi sia destinato a morire.<br><br><b>Contesto culturale:</b> Le Keres rappresentavano la convinzione greca che non tutte le morti fossero uguali: la morte violenta e sanguinosa in battaglia aveva propri agenti soprannaturali distinti dalla morte naturale e pacifica, riflettendo l'ansia costante della società greca per la morte in guerra.<br><br><b>Curiosità:</b> La celebre scena della \"pesatura delle anime\" nell'Iliade (le bilance d'oro di Zeus che determinano la sorte di Ettore) è uno dei primi esempi letterari del motivo della psicostasia — la pesatura divina delle anime o dei destini — che riecheggia indipendentemente anche nella tradizione egizia (la pesatura del cuore contro la piuma di Maat) e in quella cristiana (la pesatura delle anime nel Giudizio).",
  "Nachtrabe": "Nel folklore tedesco, il \"corvo notturno\" è un uccello di malaugurio il cui verso nella notte annuncia una morte imminente nel villaggio.<br><br><b>Il mito completo:</b> Distinto dal vero corvo biologico, il Nachtrabe nella tradizione popolare tedesca e più ampiamente germanica veniva spesso descritto non come un uccello vero e proprio ma come un'entità mutaforma, quasi spettrale — a volte si diceva fosse lo spirito irrequieto di un bambino non battezzato o di una persona morta senza i riti funebri appropriati, condannata a volare in eterno nel cielo notturno, il suo verso specificamente distinto da quello di un normale corvo per la sua qualità innaturale e lacerante.<br><br><b>Contesto culturale:</b> I presagi di morte legati a uccelli notturni sono uno schema di credenza popolare estremamente diffuso in tutta la tradizione nordeuropea e centroeuropea più ampiamente (non esclusivo della sola cultura germanica), riflettendo un'ansia premoderna comune per i suoni notturni inspiegabili e il genuino mistero su cosa, esattamente, potesse sentirsi chiamare nell'oscurità oltre la vista umana.<br><br><b>Curiosità:</b> La tradizione folkloristica del Nachtrabe persistette robustamente nella credenza popolare rurale tedesca relativamente moderna, documentata da folkloristi del XIX secolo (inclusi gli sforzi di raccolta folkloristica più ampi dei Fratelli Grimm) ben oltre il momento in cui la maggior parte della popolazione urbana istruita aveva abbandonato tali credenze — a dimostrazione di come queste tradizioni popolari sopravvivessero spesso molto più a lungo nella cultura orale rurale di quanto la documentazione scritta o accademica ufficiale potrebbe inizialmente suggerire.",
  "Nattramn": "Figura del folklore scandinavo simile al Nachtrabe: si diceva fosse lo spirito di una persona morta senza pace, il cui grido lacerante risuonava nelle notti di tempesta.<br><br><b>Il mito completo:</b> Radicato specificamente nella tradizione popolare svedese (distinto dal Nachtrabe tedesco, sebbene chiaramente imparentato nel concetto), il Nattramn era ritenuto lo spirito tormentato di qualcuno morto di morte violenta o ingiusta, in particolare vittime di omicidio o persone morte consumate dall'odio e da una rabbia irrisolta — il suo grido durante le tempeste era ritenuto rispecchiare specificamente l'angoscia e la furia della morte violenta originaria, legando il fenomeno direttamente a un'ingiustizia terrena irrisolta piuttosto che a una semplice irrequietezza.<br><br><b>Contesto culturale:</b> La tradizione del Nattramn riflette uno schema di credenza popolare scandinavo più ampio che collega i fenomeni atmosferici (le tempeste in particolare) al disturbo spirituale e ai debiti morali irrisolti — si riteneva che le morti violente o ingiuste potessero letteralmente disturbare l'ordine naturale finché non fossero adeguatamente affrontate o vendicate.<br><br><b>Curiosità:</b> Variazioni regionali dello stesso concetto folkloristico di fondo (uno spirito-uccello urlante legato alle tempeste, presagio di morte) compaiono in molteplici tradizioni scandinave e nordeuropee più ampie sotto nomi locali diversi, suggerendo un substrato genuinamente diffuso e antico di credenza popolare precristiana sulla morte violenta e gli spiriti irrequieti, sopravvissuto e regionalmente adattato fino all'epoca moderna.",
  "Nefele": "Nube plasmata da Zeus a immagine di Era per ingannare il temerario Issione, Nefele divenne poi madre dei Centauri e, in un'altra storia, madre di Frisso ed Elle, salvati in volo da un ariete dal vello d'oro.<br><br><b>Il mito completo:</b> Issione si era vantato di desiderare Era stessa; Zeus, per metterlo alla prova, plasmò una nuvola dalle sue sembianze. Issione si unì a Nefele credendola davvero la dea, e dalla loro unione nacquero i Centauri. In un mito distinto, Nefele fu anche madre di Frisso ed Elle: per salvarli da una matrigna crudele, inviò un ariete dal vello d'oro capace di volare, che portò in salvo i due fratelli — l'origine stessa della leggenda del Vello d'Oro cercato in seguito da Giasone.<br><br><b>Contesto culturale:</b> Nefele incarna l'inganno come strumento di punizione divina contro la tracotanza: Issione paga la propria hybris non con violenza diretta ma con uno stratagemma, e la sua punizione finale — legato in eterno a una ruota infuocata nel Tartaro — è uno dei tormenti più severi dell'intera mitologia greca.<br><br><b>Curiosità:</b> Il termine scientifico \"nefologia\", lo studio delle nuvole, deriva dalla stessa radice greca nephos/nephelē — un'eredità linguistica diretta, seppur tecnica, del nome di questa figura mitologica.",
  "Níðhöggr Giovane": "Nidhogg è il drago-serpente che rode incessantemente le radici dell'albero cosmico Yggdrasill nella mitologia norrena, nutrendo un'antica inimicizia con l'aquila che siede sulla cima.<br><br><b>Il mito completo:</b> Il nome stesso \"Níðhöggr\" è ricco di significato nel norreno antico — combina níð (un termine per un'onta profonda e quasi ritualizzata, legata strettamente ai concetti norreni di onore e disonore) con höggr (\"colpitore\" o \"tagliatore\") — così che il nome si traduce approssimativamente come \"Colpitore Malevolo\" o \"Colui che Colpisce con Malizia\", segnandolo fin dalla nascita come incarnazione della malizia disonorevole all'interno dell'ordine cosmico, distinto dai draghi più semplicemente mostruosi definiti solo dalla dimensione o dalla violenza.<br><br><b>Contesto culturale:</b> Questo peso etimologico lega Nidhogg specificamente alle ansie culturali norrene sul níð — una forma di vergogna sociale così grave nella società dell'epoca vichinga che accusare qualcuno di níð, o esserne accusati, poteva essere di per sé devastante legalmente e socialmente, a volte persino giustificando la violenza come risposta; dare a un mostro cosmico il nome di questo concetto lo eleva da semplice minaccia fisica a personificazione del disonore stesso che rode le fondamenta del mondo.<br><br><b>Curiosità:</b> Poiché il níð aveva un peso sociale così specifico e severo nel diritto e nella consuetudine reali della Scandinavia dell'epoca vichinga (con veri codici legali che affrontavano le accuse di níð e le loro conseguenze), il nome di Nidhogg rappresenta uno degli esempi più chiari di una figura mitologica il cui nome attinge direttamente a un concetto legale e culturale reale e socialmente carico, piuttosto che descrivere semplicemente l'aspetto fisico o una mostruosità generica.",
  "Skvader": "Creatura del folklore svedese, ibrido tra una lepre e un gallo cedrone con le ali: nacque nell'Ottocento come scherzo tassidermico, ma entrò talmente nell'immaginario popolare da diventare leggenda vera e propria.<br><br><b>Il mito completo:</b> Creato nel 1918 dal tassidermista svedese Rudolf Granberg, che combinò il corpo di una lepre con le ali, la coda e le piume delle spalle di un gallo cedrone come deliberato scherzo tassidermico e pezzo dimostrativo della propria abilità, lo Skvader si ispirò a genuini racconti popolari svedesi già in circolazione, seppur biologicamente confusi, secondo cui le lepri sarebbero state capaci di accoppiarsi con gli uccelli generando prole alata — la creazione di Granberg diede forma fisica e tangibile a un pezzo di folklore orale regionale già esistente ma mai documentato prima.<br><br><b>Contesto culturale:</b> Lo Skvader occupa una posizione genuinamente unica negli studi folkloristici come caso documentato di una creatura leggendaria \"costruita\" o \"inventata\" che tuttavia divenne autenticamente assorbita nell'identità e nella tradizione locale — la città di Sundsvall, dove il pezzo tassidermico originale è ancora esposto, ha adottato ufficialmente lo Skvader come mascotte e simbolo culturale locale.<br><br><b>Curiosità:</b> L'esemplare tassidermico originale dello Skvader del 1918 è ancora oggi esposto al pubblico presso il Museo di Sundsvall in Svezia, rendendolo una delle uniche creature mitologiche dell'intera collezione il cui manufatto fisico \"originale\" e fondativo può ancora essere visitato e osservato di persona da chiunque oggi — un caso genuinamente insolito di mitologia con un punto d'origine fisico verificabile e databile, invece dell'irrintracciabile tradizione orale antica.",
  "Stellio": "Nelle Metamorfosi di Ovidio, il ragazzo Ascalabo deride Demetra assetata mentre beve avidamente: la dea, offesa, lo trasforma in una lucertola maculata, lo stellio.<br><br><b>Il mito completo:</b> Nelle Metamorfosi di Ovidio, il racconto completo narra che Demetra (Cerere nella tradizione romana), esausta e disperatamente assetata mentre cercava per il mondo la figlia rapita Persefone, giunse alla modesta casa di una vecchia che le offrì una semplice bevanda d'orzo; la dea la bevve avidamente e con gratitudine, ma il figlio beffardo della vecchia, Ascalabo, rise della sua sete frettolosa, chiamandola avida e deridendone i modi. Furiosa per l'insulto durante il proprio genuino dolore ed esaurimento, Demetra gli gettò in faccia il resto della bevanda d'orzo, trasformandolo all'istante in una lucertola maculata (stellio, dal nome delle macchie simili a stelle sulla sua pelle) — una creatura considerata particolarmente ripugnante e di cattivo auspicio nella credenza popolare romana da allora in poi.<br><br><b>Contesto culturale:</b> Questo mito si lega direttamente al più ampio e famoso racconto di Demetra e Persefone (l'origine delle stagioni) come episodio minore ma pungente sui pericoli del deridere il dolore o l'ospitalità di qualcuno — persino una dea nel suo momento più vulnerabile e disperato meritava rispetto di base, e la sua violazione comportò una conseguenza soprannaturale reale.<br><br><b>Curiosità:</b> La parola \"stellio\" diede origine al termine legale latino successivo \"stellionatus\" (una forma di frode o comportamento ingannevole nel diritto romano e nel diritto civile successivo) — l'associazione della lucertola con astuzia e inganno (dalla derisione originaria di Ascalabo) divenne così radicata da prestare il proprio nome direttamente a una categoria di illecito legale ancora oggi richiamata in alcune tradizioni moderne di diritto civile discendenti dal diritto romano.",
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
  "Linfatica": "Il termine latino \"lympha\" indicava le acque e le ninfe che le abitavano: i Romani credevano che chi avesse la sventura di scorgerne una nello specchio di un fiume potesse essere colpito da una forma di delirio, detto per questo \"linfatico\".<br><br><b>Il mito completo:</b> Il più ampio concetto romano di \"lymphatus\" (lo stato di follia indotto dall'aver intravisto una ninfa delle acque) rifletteva una genuina ansia popolare romana verso siti naturali specifici, sacri o pericolosi — proprio come boschetti sacri o determinate sorgenti venivano trattati con cautela rituale, incontrare inaspettatamente il riflesso o la presenza di una ninfa si riteneva capace di sopraffare la mente di un mortale, una forma di incontro divino troppo intenso per essere elaborato in sicurezza dalla normale percezione umana.<br><br><b>Contesto culturale:</b> Questa credenza è parallela a motivi simili di \"follia da incontro divino\" presenti in molte culture antiche del Mediterraneo (si confronti il concetto greco di \"ninfolessia\", una follia correlata causata dall'incontro con le ninfe) — riflettendo un'ansia antica più ampia per il genuino pericolo psicologico del contatto non mediato con il numinoso o il sacro.<br><br><b>Curiosità:</b> Il termine medico inglese \"lymphatic\" (riferito al sistema linfatico del corpo) deriva direttamente dalla stessa radice latina \"lympha\" — sebbene l'uso anatomico moderno abbia completamente perso la connotazione mitologica originaria della follia indotta dalle ninfe, mantenendo solo l'associazione con un fluido corporeo limpido e simile all'acqua.",
  "Naiade": "Ninfe greche delle acque dolci, abitavano sorgenti, fiumi e fontane donando loro il potere di guarigione: si diceva che la loro presenza rendesse un luogo sacro e la sua acqua benedetta.<br><br><b>Il mito completo:</b> Le Naiadi presiedevano sorgenti d'acqua dolce, fiumi e fontane, ciascuna specifica fonte d'acqua avendo la propria naiade dedicata, il che le rendeva straordinariamente numerose e legate a luoghi precisi, rispetto a divinità più centralizzate. Erano considerate divinità minori ma genuinamente potenti, capaci sia di benedire (acque curative, fertilità) sia di maledire (follia, annegamento) chi ne offendeva il dominio — il mito di Ila, compagno di Eracle sulla nave Argo, racconta come le naiadi, innamoratesi della sua bellezza, lo trascinarono per sempre nella loro sorgente, senza che venisse mai più ritrovato, a testimonianza sia del loro fascino che del loro pericolo.<br><br><b>Contesto culturale:</b> Il culto delle Naiadi rimase una pratica religiosa locale genuina in tutta la Grecia antica per secoli — molte sorgenti e pozzi reali avevano piccoli santuari o offerte votive dedicate alla propria naiade residente, testimoniando come queste figure mitologiche \"minori\" fossero, nella pratica religiosa quotidiana, spesso più immediatamente rilevanti per la vita di tutti i giorni dei Greci comuni (acqua pulita, guarigione, agricoltura) rispetto ai distanti dèi olimpici.<br><br><b>Curiosità:</b> La parola \"naiade\" deriva dal greco naiein, \"scorrere\", descrivendo direttamente la loro natura e funzione essenziale — la biologia moderna usa ancora \"naiade\" come termine tecnico per la fase larvale acquatica di alcuni insetti (come le libellule e le effimere), una piccola ma genuina sopravvivenza della terminologia greca antica sulle ninfe nel vocabolario scientifico contemporaneo.",
  "Nereide": "Le cinquanta figlie di Nereo e Doride popolavano il mare come cortigiane di Poseidone, danzando tra le onde: tra loro Teti, madre di Achille, e Anfitrite, sposa dello stesso dio del mare.<br><br><b>Il mito completo:</b> Le Nereidi venivano spesso raffigurate mentre cavalcavano delfini o ippocampi nell'arte greca e romana, particolarmente diffuse nei mosaici e nei rilievi funerari di epoca romana, all'interno del cosiddetto \"tiaso marino\" — lo stesso motivo decorativo che vede protagonisti anche i Tritoni e gli Ittiocentauri.<br><br><b>Contesto culturale:</b> A differenza di molte ninfe greche legate al pericolo, le Nereidi erano figure costantemente benevole e protettive per i naviganti — sono sopravvissute preghiere votive autentiche indirizzate a loro per un viaggio sicuro.<br><br><b>Curiosità:</b> Il loro padre Nereo era conosciuto come \"il Vecchio del Mare\", una figura profetica capace di mutare forma, che — come il collega dio marino Proteo — poteva essere costretto a rivelare vere profezie solo se tenuto fermo con forza attraverso tutte le sue trasformazioni: un motivo ricorrente nel mito greco, \"lottare con chi cambia forma per estorcergli la verità\".",
  "Pesce d'Oro": "Figura ricorrente nelle fiabe popolari di tutta Europa: un pesce magico capace di esaudire desideri, spesso a patto che chi lo cattura non ecceda mai nella propria richiesta, pena la perdita di tutto.<br><br><b>Il mito completo:</b> La versione più celebre di questo racconto tipo è \"Il pescatore e sua moglie\", raccolta dai Fratelli Grimm ma diffusa in innumerevoli varianti regionali in tutta Europa (dal \"Pesciolino d'oro\" russo raccolto da Aleksandr Puškin fino a versioni italiane, tedesche e scandinave): un povero pescatore cattura un pesce magico capace di parlare, che gli concede desideri sempre più grandi su insistenza della moglie insaziabile — da una casa più grande, a un palazzo, a diventare re, fino a pretendere di diventare Dio stesso — provocando infine la rabbia del pesce, che annulla tutti i desideri concessi, riportando la coppia alla povertà originaria da cui erano partiti.<br><br><b>Contesto culturale:</b> Questo tipo di racconto (classificato dai folkloristi secondo il sistema Aarne-Thompson-Uther come tipo ATU 555, \"Il pescatore e sua moglie\") appartiene a una vastissima famiglia di fiabe europee sul tema dell'avidità punita e del giusto limite dei desideri — una struttura morale così diffusa e riconoscibile da essere considerata uno degli esempi più chiari e studiati di narrazione popolare condivisa attraverso confini linguistici e nazionali europei.<br><br><b>Curiosità:</b> Il folclorista Vladimir Propp, pioniere dell'analisi strutturale delle fiabe, usò proprio varianti di questo racconto come esempio centrale nei propri studi sulla morfologia della fiaba popolare russa ed europea — rendendo il Pesce d'Oro non solo un personaggio amato dell'immaginario infantile, ma anche un caso di studio accademico fondamentale nella storia della moderna teoria folkloristica.",
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
  "Coboldo": "Spirito domestico del folklore tedesco, il Kobold può essere un aiutante silenzioso della casa o un dispettoso disturbatore, a seconda di quanto viene rispettato dagli abitanti: si diceva infestasse anche le miniere.<br><br><b>Il mito completo:</b> I Kobold delle miniere venivano incolpati specificamente dell'inganno quando i minatori medievali, incontrando minerali dall'aspetto promettente che si rivelavano invece rocce velenose e inutili (ricche di arsenico), attribuivano la delusione a questi spiriti dispettosi — \"maledicendo\" il minerale senza valore col nome dello spirito stesso. I Kobold domestici, distinti da quelli delle miniere, erano simili ai folletti (brownies) inglesi: disponibili e utili se rispettati con piccole offerte (cibo, un angolo caldo), vendicativi e distruttivi se insultati o trascurati, a volte legandosi in modo permanente a una specifica famiglia per generazioni.<br><br><b>Contesto culturale:</b> Riflette la credenza popolare germanica in un rapporto negoziato e reciproco tra esseri umani e spiriti domestici o naturali — rispetto e piccole offerte mantenevano un \"patto\" funzionante, uno schema molto diffuso in tutto il folklore nordeuropeo sugli spiriti domestici (parallelo alle tradizioni scandinave del tomte e del nisse).<br><br><b>Curiosità:</b> La parola \"cobalto\" è uno degli esempi più chiari sopravvissuti nel vocabolario scientifico moderno di una credenza popolare mineraria che ha plasmato direttamente una nomenclatura chimica permanente — anche il nichel deriva analogamente da \"Nickel\" (un soprannome legato a uno spirito dispettoso simile, \"il vecchio Nick\", incolpato per minerali di rame ingannevoli).",
  "Driade": "Ninfe dei boschi in generale, le Driadi proteggevano gli alberi e la vita selvatica, apparendo ai viandanti solo raramente e sempre con un preciso scopo.<br><br><b>Il mito completo:</b> Strettamente legate soprattutto alla quercia (drys in greco, da cui il loro nome), le Driadi rappresentavano un profondo rispetto greco per i boschi sacri e per alberi specifici considerati abitati e animati. Diverse leggende narrano di veri e propri santuari costruiti intorno ad alberi antichi ritenuti dimora di una Driade.<br><br><b>Contesto culturale:</b> Abbattere un albero ritenuto sede di una Driade era considerato una grave trasgressione religiosa, capace di attirare la punizione divina: il mito di Erisittone, condannato da Demetra a una fame insaziabile per aver abbattuto il suo boschetto sacro, ne è l'esempio più celebre.<br><br><b>Curiosità:</b> Il concetto di Driade, legata indissolubilmente a un singolo albero fino a condividerne il destino, sopravvive ancora oggi nell'immaginario popolare e nella letteratura fantasy, spesso senza che si sappia quanto profondamente affondi le proprie radici nella religiosità greca reale, non solo nel mito.",
  "Dvergr": "Forma singolare di \"nano\" nella lingua norrena antica, radice da cui derivano tutte le leggende successive su questi maestri d'ascia e di fucina.<br><br><b>Il mito completo:</b> Nella cosmologia norrena (secondo l'Edda in prosa), i nani nacquero come vermi generati nella carne del gigante primordiale Ymir dopo la sua morte e lo smembramento per mano di Odino e dei suoi fratelli per creare il mondo; gli dèi, mossi a pietà o intravedendo un potenziale, donarono a questi vermi intelligenza e forma umana, trasformandoli nella razza di abilissimi artigiani nani. Ai nani si attribuisce la forgiatura di quasi ogni oggetto magico principale della mitologia norrena — il martello di Thor Mjolnir, la lancia di Odino Gungnir, la nave di Freyr Skidbladnir e il suo cinghiale Gullinbursti, i capelli d'oro di Sif, il laccio Gleipnir che incatena Fenrir — rendendoli probabilmente la singola classe di \"creatori\" più funzionalmente importante dell'intero impianto mitologico, pur raramente protagonisti diretti dei racconti.<br><br><b>Contesto culturale:</b> L'origine dei nani da un cadavere li lega simbolicamente alla terra e alla ricchezza minerale (metallo, pietra) a cui sono associati come minatori e artigiani, mentre il loro ruolo collettivo e in gran parte anonimo di artigiani (rispetto agli dèi, più individualmente distinti) riflette un rispetto culturale norreno per il lavoro qualificato anonimo che sostiene persino il potere degli dèi stessi.<br><br><b>Curiosità:</b> La parola \"dvergr\" è l'antenato linguistico diretto della moderna parola inglese \"dwarf\" — una delle esportazioni linguistiche più riuscite della mitologia norrena, sebbene il moderno \"nano\" da fantasy (basso, barbuto, minatore, spesso con accento scozzese in molti adattamenti) sia in gran parte un'invenzione successiva plasmata pesantemente dalla reinterpretazione di Tolkien di queste antiche fonti norrene.",
  "Fauno": "Spirito romano dei boschi e dei campi, dalle gambe caprine, legato al dio Fauno protettore dei pastori e dei raccolti: la sua presenza era considerata di buon auspicio per la fertilità della terra.<br><br><b>Il mito completo:</b> Fauno, il dio da cui questi spiriti seguaci presero il nome collettivo, era una delle divinità indigene più antiche di Roma (distinta dai successivi apporti di influenza greca), associata specificamente alla profezia trasmessa attraverso sogni e strani suoni uditi nella natura selvaggia — la festa dei Lupercalia, una delle celebrazioni religiose più antiche e durature di Roma (celebrata ogni febbraio, con sacerdoti che correvano per le strade con perizomi di pelle di capra, colpendo gli astanti con strisce di pelle caprina ritenute propiziatorie per la fertilità), era direttamente collegata al culto di Fauno e alla grotta del Lupercale sul colle Palatino, tradizionalmente anche il luogo dove la lupa trovò Romolo e Remo.<br><br><b>Contesto culturale:</b> A differenza dei satiri più chiaramente importati dalla Grecia, i Fauni rappresentano una tradizione religiosa genuinamente italica nativa di spiriti della natura legati a preoccupazioni agricole e pastorali specifiche (raccolti riusciti, bestiame sano, fertilità) — riflettendo le radici religiose indigene e pre-elleniche di Roma prima che l'ampia influenza culturale greca rimodellasse gran parte della mitologia romana successiva.<br><br><b>Curiosità:</b> La festa dei Lupercalia, legata al culto di Fauno, sopravvisse notevolmente a lungo nell'era cristiana — non fu ufficialmente abolita fino al 494 d.C. da papa Gelasio I, che la sostituì con la festa cristiana della Candelora, rendendo i rituali associati a Fauno una delle pratiche religiose pagane romane sopravvissute più a lungo, persistendo per secoli dopo che il cristianesimo era diventato la religione ufficiale di Roma.",
  "Gallo di Asclepio": "Il gallo era l'animale sacrificale offerto ad Asclepio, dio della medicina, in segno di guarigione avvenuta: Socrate pronunciò proprio queste parole come ultimo pensiero prima di morire.<br><br><b>Il mito completo:</b> Secondo un'usanza greca diffusa, chi guariva da una malattia offriva un gallo ad Asclepio in segno di gratitudine per la cura ricevuta. Nel Fedone di Platone, Socrate, poco prima di bere la cicuta, pronuncia come ultime parole: \"Critone, dobbiamo un gallo ad Asclepio; pagatelo, non dimenticatevene.\" La frase resta uno dei passaggi più enigmatici e discussi di tutta la filosofia antica: alcuni la leggono come un ultimo gesto di understatement ironico verso la morte, altri come l'idea che la morte stessa sia una guarigione, una liberazione dal \"male\" della vita terrena per cui si deve un debito di gratitudine agli dèi della medicina.<br><br><b>Contesto culturale:</b> Il culto di Asclepio prevedeva veri e propri santuari di guarigione (asclepieia) dove i malati dormivano sperando in una visione curativa del dio — il gallo, animale che annuncia l'alba, era simbolicamente legato al risveglio e alla rinascita, rendendolo un'offerta particolarmente adatta a chi tornava in salute.<br><br><b>Curiosità:</b> Le ultime parole di Socrate hanno generato una tradizione interpretativa filosofica ininterrotta per oltre duemila anni: filosofi da Nietzsche in poi le hanno lette come chiave per comprendere l'intero atteggiamento socratico verso la vita, la morte e la conoscenza — poche frasi nella storia della filosofia hanno generato tanto dibattito quanto queste, apparentemente semplici, parole finali.",
  "Garmr": "Enorme segugio norreno che sorveglia le porte di Hel, il regno dei morti: la profezia vuole che al Ragnarök si scontrerà con il dio Tyr, uccidendosi a vicenda.<br><br><b>Il mito completo:</b> Garmr viene talvolta identificato, in un dibattito accademico ancora aperto, come possibile stessa figura di Fenrir (entrambi esseri simili a lupi o segugi profetizzati per morire al Ragnarök in un duello dall'esito mortale reciproco con un dio — Fenrir con Odino, Garmr con Tyr) — una genuina incertezza accademica su se le fonti medievali descrivano una sola creatura sotto due nomi o due esseri realmente distinti, dato che i testi eddici superstiti non sono del tutto coerenti su questo punto. Garmr è incatenato davanti alla caverna di Gnipahellir, all'ingresso del regno di Hel, e il suo ululato è specificamente profetizzato come uno degli eventi che annunciano l'inizio del Ragnarök stesso.<br><br><b>Contesto culturale:</b> Il ruolo di Garmr come guardiano della soglia tra il mondo dei vivi e il regno dei morti riflette uno schema mitologico ricorrente in molte culture (con un parallelo evidente al Cerbero greco) di un segugio mostruoso incaricato specificamente di sorvegliare il confine tra vita e morte — un paragone che gli stessi commentatori antichi e medievali talvolta tracciavano esplicitamente.<br><br><b>Curiosità:</b> L'incertezza accademica su se Garmr e Fenrir siano la stessa figura riflette una sfida più ampia e genuina nella ricostruzione accurata della mitologia norrena: a differenza del mito greco, sopravvissuto attraverso una tradizione letteraria relativamente continua, la maggior parte dei testi mitologici norreni superstiti fu messa per iscritto secoli dopo la cristianizzazione, da scribi cristiani (come Snorri Sturluson) che lavoravano su una tradizione orale frammentaria — lasciando lacune e incoerenze reali e irrisolte in ciò che pensiamo di sapere su figure come Garmr.",
  "Gatto di Bubasti": "Nell'antico Egitto i gatti erano sacri alla dea Bastet, il cui principale centro di culto era proprio la città di Bubasti: ferire un gatto, anche per errore, poteva essere punito con la morte.<br><br><b>Il mito completo:</b> Bastet, originariamente raffigurata come una leonessa feroce (strettamente imparentata concettualmente con Sekhmet), si trasformò nel tempo in una divinità dal volto felino più domestico e protettivo, associata alla casa, alla fertilità e alla protezione dai demoni e dalle malattie, in particolare a difesa delle donne e dei bambini. Lo storico greco Erodoto, visitando l'Egitto nel V secolo a.C., descrisse il festival annuale di Bastet a Bubasti come una delle celebrazioni più affollate e gioiose di tutto l'Egitto, con migliaia di pellegrini che vi convergevano in barca, tra musica, danza e vino in abbondanza — una delle poche descrizioni dirette da testimone oculare straniero di un vero festival religioso egizio sopravvissute fino a noi.<br><br><b>Contesto culturale:</b> Il rispetto quasi assoluto per i gatti nell'antico Egitto era così radicato che gli scavi archeologici a Bubasti hanno riportato alla luce centinaia di migliaia di gatti mummificati, offerti come voti alla dea da devoti che desideravano un favore o ringraziavano per una grazia ricevuta — una pratica religiosa su scala industriale che riflette quanto profondamente il culto felino fosse integrato nella vita religiosa quotidiana egizia, non solo nella mitologia elitaria dei templi maggiori.<br><br><b>Curiosità:</b> Erodoto racconta che, durante un'invasione persiana dell'Egitto nel 525 a.C., il generale persiano Cambise II avrebbe fatto legare dei gatti agli scudi dei propri soldati, sapendo che gli egizi si sarebbero rifiutati di combattere per paura di ferire gli animali sacri — se autentico, uno degli esempi più insoliti nella storia militare di una credenza religiosa sfruttata deliberatamente come arma psicologica.",
  "Grabakr Giovane": "Uno dei cavalli mitici norreni che pascolano ogni giorno accanto all'albero cosmico Yggdrasill, secondo quanto narrato nei poemi eddici.<br><br><b>Il mito completo:</b> Grábakr (\"Dorso Grigio\") è uno dei diversi cavalli con nome proprio elencati nel Grímnismál come pascolanti quotidianamente accanto a Yggdrasil, insieme a cavalli come Glaðr, Gyllir e altri — questo elenco in stile catalogo di cavalli con nome proprio ma di scarsa rilevanza narrativa è caratteristico della tradizione poetica eddica, che amava la nomenclatura dettagliata e completa anche per figure prive di ulteriore ruolo attivo nel mito.<br><br><b>Contesto culturale:</b> Questi cavalli pascolanti rappresentano parte del più ampio \"ecosistema\" cosmico quotidiano accuratamente mappato intorno a Yggdrasil — insieme all'aquila, a Nidhogg, a Ratatoskr e ai quattro cervi che pascolano anch'essi sui rami dell'albero, dimostrando quanto minuziosamente la cosmologia norrena immaginasse un albero del mondo vivo e popolato, non una struttura simbolica statica.<br><br><b>Curiosità:</b> Elenchi così estesi di figure nominate ma prive di elaborazione ulteriore (cavalli, nani, valchirie) sono un tratto distintivo di alcuni poemi eddici specificamente concepiti come cataloghi mnemonici o enciclopedici (in particolare il Völuspá e il Grímnismál dell'Edda poetica) — alcuni studiosi ritengono che queste liste servissero a scopi pratici di memorizzazione o insegnamento per gli scaldi (poeti) che dovevano fare riferimento accuratamente all'intero impianto della cosmologia norrena nelle proprie composizioni.",
  "Gullinbursti": "Cinghiale dalle setole d'oro forgiato dai nani per il dio Freyr: le sue setole risplendevano al buio, illuminando la strada al suo carro anche nelle notti più oscure.<br><br><b>Il mito completo:</b> Gullinbursti fu forgiato dai fratelli nani Brokkr ed Eitri (talvolta chiamato Sindri) come parte di una scommessa con Loki — la stessa gara che produsse anche la lancia di Odino Gungnir, il martello di Thor Mjolnir e l'anello d'oro Draupnir. Loki, avendo scommesso la propria testa sull'esito, sabotò il processo di forgiatura trasformandosi in una mosca pungente per distrarre Brokkr a metà del lavoro, causando un piccolo difetto (il manico di Mjolnir risultò più corto del previsto) — ma Gullinbursti stesso fu completato con successo, capace di correre attraverso l'aria e l'acqua più veloce di qualunque cavallo, le sue setole luminose garantivano al carro di Freyr di non restare mai senza luce nemmeno nelle notti più buie.<br><br><b>Contesto culturale:</b> Questo intero ciclo mitico della \"scommessa dei nani\" (riportato nello Skáldskaparmál dell'Edda in prosa) servì in parte a spiegare l'origine divina di diversi tra gli oggetti magici più iconici della mitologia norrena in un colpo solo, legando i possedimenti distintivi di più divinità principali in un'unica storia d'origine interconnessa.<br><br><b>Curiosità:</b> I cinghiali avevano un più ampio significato rituale nella cultura norrena legato al dominio di Freyr sulla fertilità e la prosperità — la tradizione dello Yule del \"sonargöltr\" (un cinghiale sacrificato o simbolicamente invocato durante i rituali di giuramento del solstizio d'inverno) richiama direttamente l'associazione di Gullinbursti con il dio, e alcuni studiosi fanno risalire la moderna tradizione del prosciutto natalizio nei paesi scandinavi a questa antica pratica pagana di venerazione del cinghiale.",
  "Hrungnir Giovane": "Gigante dal cuore e dalla testa di pietra, Hrungnir sfidò Thor in un duello che gli antichi narratori ricordavano come uno scontro leggendario tra le forze del caos e dell'ordine.<br><br><b>Il mito completo:</b> Hrungnir, vantandosi ubriaco di poter distruggere Asgard e uccidere tutti gli dèi, fu sfidato a un duello formale da Thor dopo averlo insultato durante una gara di cavalli con Odino. Per garantire uno scontro leale, i giganti costruirono a Hrungnir un enorme compagno d'argilla (Mökkurkálfi) come suo secondo. Durante il duello stesso, Hrungnir, armato di una cote gigante, la scagliò contro Thor; il martello di Thor la frantumò a mezz'aria, ma un frammento rimase conficcato per sempre nel cranio del dio (una vecchia sacerdotessa di nome Gróa fu in seguito convocata proprio per tentare di rimuoverlo con la magia, anche se l'incantesimo fu interrotto prima del completamento, lasciando la scheggia nella testa di Thor per sempre). Il martello di Thor uccise poi Hrungnir, il cui corpo enorme cadde direttamente sulla gamba di Thor, intrappolandolo — solo il giovane figlio di Thor, Magni, ancora bambino ma già dotato di forza sovrumana ereditata dal padre, riuscì a sollevare il cadavere per liberarlo.<br><br><b>Contesto culturale:</b> Il mito di Hrungnir mostra il tema ricorrente norreno dell'ordine (gli dèi, in particolare Thor come loro principale difensore) costretto a reprimere e sconfiggere costantemente la minaccia caotica rappresentata dai giganti (jötnar), anche quando i singoli incontri (come la gara di cavalli iniziale di Odino) iniziano più come vanteria sconsiderata che vera guerra.<br><br><b>Curiosità:</b> Il dettaglio del frammento di cote rimasto per sempre conficcato nella testa di Thor, con il rituale di guarigione lasciato per sempre incompiuto, viene talvolta letto dagli studiosi come un sottile espediente narrativo per spiegare PERCHÉ lanciare coti o selci contro qualcuno fosse considerato particolarmente tabù o pericoloso nella credenza popolare scandinava successiva — il mito usato per rinforzare una pratica o superstizione culturale reale.",
  "Jotunn Giovane": "I Jotunn sono i giganti della mitologia norrena, spesso avversari degli dèi Asi ma a volte anche loro alleati o persino parenti, in un rapporto complesso fatto di guerre e matrimoni.<br><br><b>Il mito completo:</b> Nonostante il loro frequente ruolo di antagonisti, i Jötnar erano profondamente intrecciati con gli dèi attraverso matrimoni e discendenza — lo stesso Odino era in parte gigante (sua madre Bestla era una jötunn), e diversi dèi principali, incluso Thor, avevano madri o amanti giganti; la dea Skadi era essa stessa una gigantessa che entrò a far parte del pantheon degli Asi dopo una complessa negoziazione, seguita all'uccisione del padre per mano degli dèi.<br><br><b>Contesto culturale:</b> I ripetuti matrimoni misti degli dèi con i giganti, nonostante l'ostilità persistente, riflettono un principio cosmologico norreno più ampio: caos e ordine non sono semplicemente forze opposte da sconfiggere in modo definitivo, ma restano continuamente intrecciate, richiedendo negoziazione, conflitto e occasionale alleanza — una cornice morale notevolmente meno assoluta rispetto, ad esempio, alle più nette dicotomie bene-contro-male di altre tradizioni mitologiche.<br><br><b>Curiosità:</b> La parola inglese arcaica \"ettin\" (termine per gigante, imparentato etimologicamente con \"jötunn\") compare nel folklore e nella letteratura inglese più antica, dimostrando una radice linguistica condivisa tra il vocabolario mitologico norreno e anglosassone dalla loro comune ascendenza germanica, ben prima che le due tradizioni divergessero in corpus letterari separati.",
  "Landvættir": "Spiriti protettori della terra nella tradizione norrena e islandese, custodi silenziosi dei territori: si narra che le navi vichinghe dovessero rimuovere le teste di drago a prua avvicinandosi a costa, per non spaventarli.<br><br><b>Il mito completo:</b> Questo specifico tabù (rimuovere la testa di drago dalla prua prima di avvicinarsi a terra, per non spaventare gli spiriti residenti) è effettivamente registrato nel diritto islandese medievale reale — la Legge di Úlfljót (un primo codice legale islandese) richiedeva esplicitamente questa pratica, rendendolo uno dei rari casi in cui una credenza mitologica norrena plasmò direttamente una consuetudine legale documentata e applicabile, invece di restare puro folklore narrativo. Si credeva che i landvættir abitassero e proteggessero attivamente regioni specifiche di terra, e la loro benevolenza era considerata essenziale per la prosperità e la sicurezza di un insediamento.<br><br><b>Contesto culturale:</b> La tradizione dei landvættir riflette una dimensione genuinamente animista della credenza norrena precristiana, in cui la terra stessa (non solo gli dèi con nome proprio) possedeva un'agenzia spirituale attiva e reattiva, che richiedeva rispetto e negoziazione costanti — una credenza abbastanza solida da essere codificata nel diritto islandese vero e proprio.<br><br><b>Curiosità:</b> Questa stessa tradizione dei landvættir è specificamente richiamata nello stemma nazionale moderno dell'Islanda, che raffigura quattro spiriti guardiani (un toro, un'aquila, un gigante e un drago) che proteggono i quattro quadranti dell'isola — il che significa che questo antico concetto mitologico resta un simbolo ufficiale e attivamente usato dell'identità nazionale islandese moderna, non solo folklore storico.",
  "Limniade": "Ninfa greca dei laghi e delle paludi, meno celebrata delle Naiadi fluviali ma altrettanto legata alla vita delle acque ferme.<br><br><b>Il mito completo:</b> Distinte dalle Naiadi dei fiumi e delle sorgenti scorrenti, le Limniadi presiedevano specificamente alle acque ferme — laghi, stagni e paludi — ambienti spesso considerati più misteriosi e meno accessibili rispetto ai corsi d'acqua vivi, e per questo associati a un carattere più silenzioso e riservato nella tradizione popolare greca.<br><br><b>Contesto culturale:</b> La distinzione tra ninfe delle acque ferme e ninfe delle acque correnti riflette l'attenzione greca per le differenze concrete tra tipi di paesaggio acquatico — un lago o una palude, con la loro immobilità e i loro ecosistemi specifici, richiedevano una divinità propria, distinta da quella di un fiume in perenne movimento.<br><br><b>Curiosità:</b> Questa suddivisione capillare delle ninfe per tipo esatto di corpo idrico (Naiadi per l'acqua corrente, Limniadi per quella ferma, Idriadi per le sorgenti) dimostra quanto minuziosamente i Greci classificassero il mondo naturale attraverso la mitologia, un sistema di categorie ambientali sorprendentemente dettagliato per l'epoca.",
  "Linnormr Giovane": "Serpente-drago del folklore nordico e germanico, privo di ali o dotato solo di zampe anteriori: le sue forme adulte erano temute quanto i draghi veri e propri.<br><br><b>Il mito completo:</b> La tradizione popolare norrena riteneva spesso che alcuni serpenti particolarmente grandi o antichi potessero, nel corso di secoli di crescita incontrollata (talvolta legata all'accumulo di tesori, in modo simile alla trasformazione di Fafnir), svilupparsi gradualmente in un Linnormr completo — suggerendo che la creatura non fosse sempre considerata una specie distinta fin dalla nascita, ma piuttosto uno stato in cui alcuni serpenti potevano evolvere con tempo, avidità o esposizione sufficiente a ricchezze maledette o magiche.<br><br><b>Contesto culturale:</b> Questa credenza popolare della trasformazione graduale collega tematicamente la tradizione del Linnormr alla stessa trasformazione di Fafnir da nano a drago — rafforzando un'ansia culturale norrena più ampia sull'avidità e l'accumulo come forze letteralmente corruttrici e mostrificanti, capaci di trasformare persino creature relativamente ordinarie in minacce cosmiche col tempo.<br><br><b>Curiosità:</b> Questa credenza popolare della \"crescita nel corso di secoli\" sui serpenti che diventano draghi compare in varie forme in molte mitologie del mondo (incluse le tradizioni draconiche dell'Asia orientale, dove le carpe devono famosamente nuotare controcorrente per lunghissimo tempo prima di trasformarsi infine in draghi) — suggerendo un fascino umano diffuso e sorto indipendentemente per l'idea che tempo, sforzo o potere accumulato a sufficienza possano trasformare una creatura ordinaria in qualcosa di trascendente o mostruoso.",
  "Menaide Infuriata": "Le Menadi erano le seguaci estatiche di Dioniso, capaci durante i loro riti di cadere in un frenetico stato di trance: la leggenda narra che in quello stato potessero dilaniare a mani nude chiunque si opponesse al dio.<br><br><b>Il mito completo:</b> L'episodio più celebre e terribile riguardante le Menadi è narrato nelle Baccanti di Euripide: il re Penteo di Tebe, scettico verso il culto di Dioniso e deciso a reprimerlo, si nasconde travestito da donna per spiare i riti sul monte Citerone. Scoperto dalle Menadi in preda al furore sacro — tra cui, tragicamente, la propria stessa madre Agave, convinta nella sua trance di vedere un leone anziché il figlio — viene smembrato vivo dalle sue mani. Solo al termine del rito, tornata in sé, Agave si accorge con orrore di tenere in braccio la testa del proprio figlio.<br><br><b>Contesto culturale:</b> Il culto dionisiaco rappresentava per i Greci un potere religioso ambivalente e pericoloso: liberatorio ed estatico da un lato, capace di dissolvere temporaneamente le strutture sociali e familiari ordinarie dall'altro — le Menadi incarnano proprio questo potenziale distruttivo della perdita totale di controllo razionale, anche verso i legami più sacri come quello materno.<br><br><b>Curiosità:</b> Le Baccanti di Euripide, scritte alla fine della vita del drammaturgo, sono considerate una delle tragedie greche più inquietanti e psicologicamente moderne mai composte — la messa in scena dello smembramento di Penteo per mano della madre resta ancora oggi uno dei momenti più scioccanti di tutto il teatro classico.",
  "Mökkurkálfi": "Gigante d'argilla costruito dai nemici di Thor per affiancare Hrungnir nel duello, animato con un cuore di giumenta: alla vista dello scudiero di Thor fu talmente terrorizzato da bagnarsi addosso, prima ancora che iniziasse lo scontro.<br><br><b>Il mito completo:</b> Alto nove leghe e con un petto largo altrettanto nove leghe, animato inserendogli il cuore di una giumenta (poiché i giganti, associati alla natura caotica e grezza, apparentemente richiedevano un cuore animale anziché umano per essere portati in vita), Mökkurkálfi fu costruito appositamente per intimidire il giovane servitore di Thor, Þjálfi, arrivato sul luogo del duello prima dello stesso Thor. Vedendo l'enorme gigante d'argilla, Þjálfi gridò astutamente (o forse semplicemente per genuino terrore misto a bluff tattico) un avviso a Hrungnir che Thor si stava avvicinando da sottoterra, spingendo il gigante a stare in piedi sul proprio scudo per proteggersi il davanti — lasciando la schiena esposta, un errore tattico fatale che contribuì direttamente alla sua morte nel duello successivo.<br><br><b>Contesto culturale:</b> Il terrore e l'inutilità finale di Mökkurkálfi nella battaglia vera e propria (morì di paura, secondo il racconto, senza sferrare un solo colpo, alla semplice vista dell'arrivo di Thor) svolge una funzione narrativa lievemente comica all'interno della più seria storia del duello di Hrungnir — la mitologia norrena, anche nei racconti di combattimento più drammatici, include spesso simili dettagli sgonfianti, quasi da farsa.<br><br><b>Curiosità:</b> Il nome \"Mökkurkálfi\" si traduce approssimativamente come \"Vitello di Nebbia\" o \"Vitello di Nuvola\", un nome stranamente gentile e quasi pastorale per un gigante d'argilla alto nove leghe costruito per la guerra — un dettaglio linguistico che alcuni studiosi trovano tonalmente coerente con il sottotono complessivamente comico del mito riguardo al fallimento finale e vigliacco di questo particolare personaggio.",
  "Oreada": "Ninfa greca delle montagne e delle grotte rocciose, spirito silenzioso che abitava le vette più impervie.<br><br><b>Il mito completo:</b> Compagne soprattutto di Artemide, dea della caccia e dei luoghi selvaggi, e talvolta di Pan, le Oreadi erano legate a montagne, caverne e grotte specifiche. La ninfa Eco, punita da Era con una maledizione che le impediva di parlare se non ripetendo le ultime parole altrui, e poi consumata dall'amore non corrisposto per Narciso fino a restare pura voce, era tradizionalmente un'Oreade.<br><br><b>Contesto culturale:</b> Le ninfe di montagna rappresentavano le zone più selvagge e inaccessibili del paesaggio greco, in contrasto con le Naiadi delle sorgenti e dei fiumi, più vicine agli insediamenti umani — legate a luoghi remoti, misteriosi, e proprio per questo agli echi che vi risuonavano.<br><br><b>Curiosità:</b> La parola \"eco\", presente praticamente in ogni lingua europea moderna, deriva direttamente dal nome e dal mito di questa specifica Oreade — una delle eredità linguistiche più dirette e universali dell'intera mitologia greca.",
  "Orso di Arcadia": "Rimanda al mito di Callisto, ninfa trasformata in orsa da una Era gelosa: per proteggerla dalla caccia del proprio figlio, Zeus la pose infine tra le stelle come costellazione dell'Orsa Maggiore.<br><br><b>Il mito completo:</b> Callisto era una ninfa compagna di caccia di Artemide, votata alla castità come tutte le seguaci della dea. Zeus, invaghitosi di lei, assunse le sembianze della stessa Artemide per avvicinarla senza destare sospetti, e la sedusse con l'inganno. Quando la gravidanza di Callisto fu scoperta, Artemide la scacciò dal proprio seguito; Era, scoperto il tradimento del marito, trasformò per vendetta la ninfa in un'orsa. Anni dopo, il figlio di Callisto, Arcade, ormai cresciuto, per poco non uccise la propria madre durante una battuta di caccia, non riconoscendola nella forma animale: Zeus intervenne all'ultimo istante, ponendo entrambi tra le stelle come le costellazioni dell'Orsa Maggiore e dell'Orsa Minore (o del Bootes, secondo alcune versioni).<br><br><b>Contesto culturale:</b> Il mito di Callisto riflette un tema ricorrente e cupo della mitologia greca: la vittima di un dio che si traveste per ingannarla paga poi personalmente il prezzo della gelosia della moglie tradita, un pattern che si ripete in numerosi altri miti di amanti di Zeus perseguitate da Era.<br><br><b>Curiosità:</b> Il nome stesso dell'Arcadia, la regione greca associata a Callisto e al figlio Arcade, deriva secondo la tradizione popolare proprio dal nome del figlio — un raro caso in cui un intero territorio geografico greco porta il nome di un personaggio mitologico nato da un simile dramma familiare divino.",
  "Panisco": "Piccoli spiriti caprini al seguito del dio Pan, i Paniski condividevano il suo amore per la musica del flauto e gli scherzi tra i boschi.<br><br><b>Il mito completo:</b> I Paniski (plurale di Panisco) venivano immaginati specificamente come versioni più piccole, numerose e meno individualmente distinte dello stesso Pan — una sorta di \"sciame\" divino o moltiplicazione della natura essenziale del dio, caprina, suonatrice di flauto e amante degli scherzi, in innumerevoli spiriti minori del bosco, piuttosto che personaggi con nome proprio e miti distinti, riflettendo come l'immaginazione religiosa greco-romana successiva gestisse talvolta potenti divinità della natura generando un intero cast di supporto di copie ridotte.<br><br><b>Contesto culturale:</b> Questo schema di un dio maggiore che genera uno \"sciame\" di spiriti seguaci più piccoli e simili (parallelo a come le singole Nereidi o i Tritoni divennero categorie plurali generalizzate, come già visto nelle schede greche) riflette una più ampia tendenza religiosa mediterranea antica a popolare densamente il mondo naturale di innumerevoli presenze divine minori, piuttosto che lasciare le aree selvagge religiosamente \"vuote\" tra le grandi divinità con nome proprio.<br><br><b>Curiosità:</b> La parola \"panico\" deriva direttamente dallo stesso Pan (e per estensione dalla presenza generale generatrice di paura associata a lui e ai suoi numerosi seguaci Paniski nei luoghi selvaggi e remoti) — il terrore improvviso e irrazionale che un viandante poteva provare da solo nella fitta natura selvaggia veniva attribuito specificamente a un incontro invisibile con Pan o i suoi spiriti al seguito, dandoci la moderna parola per la paura improvvisa e travolgente.",
  "Satiro": "Creature per metà uomo e metà capra, i Satiri erano compagni festosi di Dioniso, sempre pronti a inseguire ninfe tra i boschi e a partecipare a banchetti e baldorie.<br><br><b>Il mito completo:</b> Musicisti instancabili, i Satiri suonavano l'aulo (un flauto doppio) durante i cortei dionisiaci, incarnando l'istinto naturale incontrollato in contrasto con la misura e la ragione civile. Il dramma satiresco, un genere teatrale greco a sé stante, prevedeva un coro di Satiri e veniva rappresentato come sollievo comico dopo le trilogie tragiche nei grandi festival ateniesi.<br><br><b>Contesto culturale:</b> I Satiri rappresentavano l'istinto naturale sfrenato come contrappunto rituale alla misura civile, incarnato proprio nel genere teatrale del dramma satiresco, che chiudeva le rappresentazioni tragiche con un tono deliberatamente comico e dissacrante.<br><br><b>Curiosità:</b> La parola italiana \"satira\" viene comunemente ma erroneamente fatta derivare da \"satiro\" — in realtà proviene dal latino satura, \"miscuglio, mescolanza\" — una falsa etimologia che moltissime persone continuano a credere vera ancora oggi.",
  "Segugio di Skadi": "Skadi, dea norrena della caccia e dell'inverno, era accompagnata da segugi abilissimi capaci di seguire una preda anche attraverso le nevicate più fitte.<br><br><b>Il mito completo:</b> Skadi stessa, prima di diventare una dea associata a inverno, montagne e caccia, era in origine una gigantessa (jötunn) giunta ad Asgard in cerca di vendetta dopo che gli dèi avevano ucciso suo padre Thiazi; come risarcimento, gli dèi le offrirono di scegliere in matrimonio uno di loro, ma solo guardandone i piedi (non i volti) — scelse i piedi più belli, credendo appartenessero al bellissimo Baldr, ma selezionò invece Njörðr, dio del mare, dando vita a un matrimonio celebre per essere del tutto disallineato e infine fallito (lui desiderava il suono del mare, lei l'ululato dei suoi lupi di montagna, e nessuno dei due riuscì a sopportare a lungo l'ambiente di casa dell'altro).<br><br><b>Contesto culturale:</b> I segugi da caccia di Skadi, abili nel tracciare attraverso la neve, riflettono il suo più ampio dominio su inverno, montagne e la natura selvaggia aspra ma abilmente navigata — un'abilità venatoria genuinamente pratica mitizzata come maestria divina, legata a un sapere reale di sopravvivenza invernale scandinava.<br><br><b>Curiosità:</b> Skadi presta il proprio nome alla \"Scandinavia\" stessa secondo una teoria etimologica di lunga data, seppur linguisticamente controversa — alcuni studiosi collegano il nome stesso della regione a questa dea dell'inverno e delle montagne, sebbene la questione resti dibattuta piuttosto che definitivamente stabilita tra gli etimologisti.",
  "Serpenti del Niflheimr": "Niflheim è il gelido regno di nebbia e ghiaccio della cosmologia norrena, dimora di serpenti che rosicchiano incessantemente le radici dell'albero del mondo insieme al grande Nidhogg.<br><br><b>Il mito completo:</b> Il Grímnismál nomina specificamente diversi di questi serpenti minori accanto a Nidhogg, intenti a rodere le radici di Yggdrasil — Góinn, Móinn, Grábakr (che condivide il nome con il cavallo Grábakr, una caratteristica comune nella nomenclatura norrena, dove lo stesso nome poteva applicarsi a tipi di creature diverse), Grafvölluðr, Ófnir e Sváfnir — un intero cast di supporto di serpenti roditori sotto il più celebre e singolo ruolo di Nidhogg, suggerendo che il decadimento costante dell'albero fosse immaginato come uno sforzo collettivo e continuo di più serpenti, non l'opera di un solo drago.<br><br><b>Contesto culturale:</b> Questo dettaglio rafforza il principio cosmologico norreno più ampio secondo cui persino Yggdrasil, l'albero che sostiene tutti e nove i mondi, affronta un decadimento costante e su più fronti dal basso — l'ordine cosmico nella credenza norrena non fu mai raffigurato come pienamente stabile o sicuro, ma come uno stato temporaneo attivamente e continuamente minato da più direzioni contemporaneamente.<br><br><b>Curiosità:</b> La sovrapposizione di nomi (più tipi di creature diverse che condividono nomi come \"Grábakr\") nei cataloghi mitologici norreni è un vero rompicapo per gli studiosi moderni che tentano di ricostruire un sistema mitologico pienamente coerente e privo di contraddizioni — un promemoria che questi miti non furono mai sistematizzati in un unico canone ufficiale, sopravvissuti invece come tradizione orale e poetica in parte incoerente, messa per iscritto solo più tardi da scribi cristiani.",
  "Sileno Giovane": "I Sileni erano satiri anziani e saggi, spesso ubriachi ma capaci — proprio in quello stato — di pronunciare profezie sorprendenti: il più celebre, Sileno, fu precettore dello stesso Dioniso.<br><br><b>Il mito completo:</b> Sileno, catturato una volta dal re Mida, rivelò profezie sorprendenti proprio nel suo stato di ubriachezza; in cambio della sua restituzione a Dioniso, il dio concesse a Mida un desiderio — la famosa (e infine disastrosa) capacità di trasformare in oro tutto ciò che toccava.<br><br><b>Contesto culturale:</b> Sileno incarna l'archetipo del \"saggio folle\": la sua saggezza emerge proprio attraverso, o nonostante, l'ubriachezza, un tema ripreso più tardi dalla filosofia greca — Platone, nel Simposio, fa paragonare Socrate proprio a una figura di Sileno da parte di Alcibiade: brutto esteriormente, ma colmo di saggezza all'interno.<br><br><b>Curiosità:</b> Questo paragone nel Simposio di Platone è una delle metafore filosofiche più celebri della storia occidentale, e ha reso \"Sileno\" un termine ancora oggi usato per indicare chi nasconde una profonda saggezza interiore dietro un aspetto esteriore poco impressionante.",
  "Volpe di Teumesso": "Volpe gigantesca destinata dal fato a non essere mai catturata, scatenata sulla città di Tebe: paradossalmente le fu messo alle calcagna un cane, Lelapo, destinato a catturare sempre la sua preda — Zeus risolse il dilemma impossibile trasformando entrambi in pietra.<br><br><b>Il mito completo:</b> Inviata da Dioniso (secondo la maggior parte delle versioni) per punire Tebe di un'antica colpa, la volpe era destinata dal fato stesso a non essere mai catturata: una legge cosmica infrangibile. Nel frattempo, Cefalo (o secondo altre versioni Anfitrione, lo stesso patrigno di Eracle) possedeva Lelapo, un cane da caccia donato da Zeus (o da Artemide, secondo altre fonti), destinato con altrettanta certezza cosmica a catturare sempre ciò che inseguiva. Anfitrione, disperato per liberare Tebe dalle devastazioni della volpe, scatenò Lelapo contro di essa — creando un vero e proprio paradosso logico: una forza inarrestabile contro un oggetto inamovibile, un inseguimento che sarebbe potuto continuare per sempre senza risoluzione. Zeus, non volendo lasciare la contraddizione irrisolta in eterno, la risolse trasformando entrambi gli animali in pietra a metà dell'inseguimento, e ponendoli poi tra le stelle — la volpe è talvolta identificata con la costellazione del Cane Minore, e Lelapo confluì nel Cane Maggiore accanto agli altri cani da caccia di Orione.<br><br><b>Contesto culturale:</b> Questo mito si distingue nella mitologia greca come un vero e proprio esperimento filosofico incorporato in forma narrativa — commentatori antichi e moderni ne hanno notato la somiglianza con i paradossi logici successivi (come quello della forza inarrestabile contro l'oggetto inamovibile), suggerendo che i narratori greci arcaici già giocassero con idee di contraddizione logica secoli prima che la filosofia formale affrontasse direttamente questo tipo di paradossi.<br><br><b>Curiosità:</b> Questo è uno dei pochissimi miti greci in cui il conflitto centrale non ha letteralmente alcuna possibile risoluzione narrativa tramite l'azione eroica normale — nessuna quantità di astuzia, forza o coraggio potrebbe risolverlo, rendendo l'intervento divino l'UNICO finale possibile, una situazione strutturalmente unica tra i racconti greci sui mostri.",

  "Anfisbena": "Serpente con una testa a ciascuna estremità del corpo, capace di muoversi in entrambe le direzioni senza mai voltarsi: secondo Ovidio nacque dal sangue sgocciolato dalla testa di Medusa mentre Perseo la trasportava in volo sopra i deserti della Libia.<br><br><b>Il mito completo:</b> Capace, secondo la leggenda, di mordere con entrambe le teste contemporaneamente per non dover mai lasciare la presa sulla preda, l'Anfisbena era anche ritenuta dotata di proprietà leggermente tossiche o anestetiche utili nella medicina popolare antica: si diceva che indossarne la pelle curasse i reumatismi o aiutasse le gravidanze.<br><br><b>Contesto culturale:</b> Divenne una creatura araldica e bestiaria molto diffusa in tutta l'Europa medievale, la sua natura bicefala simbolo di duplicità, contraddizione o, in senso positivo, di vigilanza bilanciata a seconda del contesto.<br><br><b>Curiosità:</b> La scienza moderna ha preso in prestito direttamente il nome: un'intera famiglia di rettili reali, privi di zampe e scavatori, è classificata scientificamente come \"Amphisbaenia\", la loro coda tozza che ricorda superficialmente una seconda testa — un raro caso di nomenclatura mitologica antica sopravvissuta direttamente nella tassonomia zoologica moderna.",
  "Basilisco Minore": "Il \"re dei serpenti\" secondo i bestiari medievali, capace di uccidere con il solo sguardo o con l'alito velenoso: si narrava nascesse da un uovo di serpente covato da un rospo o da un gallo.<br><br><b>Il mito completo:</b> La presunta origine del basilisco da un uovo di gallo covato da un rospo o da un serpente era considerata così pericolosa (data la letalità dello sguardo o del fiato della creatura) che le storie naturali medievali e rinascimentali discutevano seriamente metodi per distruggere in sicurezza tali uova, se trovate; l'unica debolezza nota della creatura era altrettanto specifica: il canto di un gallo si credeva gli fosse fatale, e il proprio riflesso (vedersi in uno specchio) poteva ucciderlo efficacemente quanto il suo sguardo uccideva gli altri — da cui il rimedio popolare di portare uno specchio come protezione contro i basilischi, insieme a tenere vicine le donnole (l'unico animale ritenuto immune al suo veleno).<br><br><b>Contesto culturale:</b> Il basilisco rappresenta uno dei mostri più minuziosamente \"documentati\" e presi sul serio nella letteratura di storia naturale medievale e della prima età moderna — il resoconto originale di epoca romana di Plinio il Vecchio (che descriveva un serpente molto più piccolo e meno elaboratamente mitizzato proveniente dal Nord Africa) fu progressivamente arricchito nei successivi oltre 1500 anni dagli scrittori dei bestiari medievali fino alla leggenda ben più elaborata del re-serpente nato da uovo di gallo oggi ampiamente conosciuta.<br><br><b>Curiosità:</b> La debolezza del basilisco legata al riflesso ha ispirato direttamente un'opera di narrativa moderna genuinamente popolare e duratura — la serie di Harry Potter di J.K. Rowling usa quasi esattamente la stessa difesa basata su specchio e riflesso contro lo sguardo letale del basilisco, dimostrando come questo specifico dettaglio mostruoso medievale sia rimasto culturalmente potente e narrativamente utile per quasi duemila anni di racconti.",
  "Blemio": "Popolo leggendario descritto dagli antichi geografi come privo di testa, con il volto posto direttamente sul petto: comparivano nei racconti di viaggio come esempio delle meraviglie nascoste ai confini del mondo conosciuto.<br><br><b>Il mito completo:</b> Erodoto accenna a un concetto simile, poi elaborato più tardi da Plinio il Vecchio: un popolo \"acefalo\" i cui tratti del viso — occhi, naso, bocca — si trovavano direttamente sul petto anziché su una testa. Il nome deriva probabilmente da racconti confusi di viaggiatori su un popolo africano reale (i Blemmi storici erano effettivamente una confederazione tribale nubiana-sudanese), con il dettaglio \"senza testa\" aggiunto come pura elaborazione fantastica su un nome autentico.<br><br><b>Contesto culturale:</b> Insieme ai Cinocefali e alle altre \"razze mostruose\", i Blemmi rappresentano la tendenza dell'immaginazione geografica greca antica a proiettare stranezza fisica su popoli lontani e poco conosciuti — uno schema che gli antropologi riconoscono oggi come comune a molte culture antiche nell'incontro con popolazioni genuinamente straniere.<br><br><b>Curiosità:</b> William Shakespeare fa riferimento diretto a uomini senza testa \"le cui teste crescono sotto le spalle\" nell'Otello, dimostrando che questo specifico mito geografico greco antico era ancora culturalmente vivo e citato nella letteratura inglese quasi duemila anni dopo la sua origine.",
  "Cercopo": "Dispettosi folletti dei boschi che tentarono di derubare Eracle mentre dormiva: l'eroe li punì legandoli a testa in giù a un bastone, e secondo alcune versioni del mito furono infine trasformati in scimmie per la loro incorreggibile natura beffarda.<br><br><b>Il mito completo:</b> Legati capovolti a un palo che Eracle si caricò sulle spalle come selvaggina, durante il tragitto i Cercopi, appesi a testa in giù, notarono il sedere abbronzato dall'eroe (celebre nel mito per il suo colorito scurito dal sole) e iniziarono a canzonarlo con battute irriverenti — divertendolo così tanto, nonostante tutto, che finì per liberarli ridendo.<br><br><b>Contesto culturale:</b> Questo mito si distingue per il suo tono comico, quasi da farsa, rispetto alle solite fatiche cupe e violente di Eracle — mostrando un lato più leggero e folkloristico della mitologia greca, più vicino a un racconto da furfante-imbroglione che all'epica eroica.<br><br><b>Curiosità:</b> In una tradizione successiva più elaborata, Zeus punì infine gli incorreggibili Cercopi per la loro natura ladra trasformandoli in scimmie ed esiliandoli su isole al largo della costa italiana — un mito che gli antichi Romani usavano per spiegare la presenza di scimmie su alcune isole del Mediterraneo.",
  "Chimera Minore": "Mostro ibrido con corpo di leone, una testa di capra sul dorso e coda di serpente, capace di sputare fiamme: fu abbattuta dall'eroe Bellerofonte, che la affrontò cavalcando il Pegaso dall'alto.<br><br><b>Il mito completo:</b> Figlia di Tifone ed Echidna, come l'Idra e Cerbero, la Chimera seminava terrore in Licia, in Asia Minore. Il re Iobate affidò a Bellerofonte l'incarico di ucciderla, sperando segretamente che l'eroe morisse nell'impresa — un favore chiesto dal re Preto, che voleva Bellerofonte morto dopo una falsa accusa mossa dalla propria moglie. Atena, in sogno, donò a Bellerofonte una briglia d'oro capace di domare il cavallo alato Pegaso: volando sopra la Chimera, l'eroe la colpì con una lancia sulla cui punta aveva fissato un blocco di piombo. Il fiato infuocato del mostro sciolse il piombo, che colò lungo la gola uccidendola dall'interno.<br><br><b>Contesto culturale:</b> La Chimera è diventata simbolo duraturo di ogni idea impossibile, innaturale o irrealizzabile — da qui il termine moderno \"chimera\", usato per un sogno illusorio o, in biologia, per un organismo composto da popolazioni cellulari geneticamente distinte. Monete licie antiche e sculture etrusche, come la celebre Chimera di Arezzo del V secolo a.C., testimoniano quanto la sua immagine sia rimasta impressa nell'arte per secoli.<br><br><b>Curiosità:</b> Alcuni geografi antichi collegavano il mito a un fenomeno naturale reale: sul Monte Chimera in Licia (l'odierno Yanartaş, in Turchia), fuoriuscite naturali di gas ancora oggi bruciano ininterrottamente dalle rocce — una fiamma eterna che potrebbe aver ispirato l'idea di un mostro capace di sputare fuoco che abita proprio quella montagna.",
  "Ciclope Operaio": "I tre Ciclopi Bronte, Sterope e Arge non erano mostri solitari come Polifemo, ma abilissimi fabbri: nelle loro fucine forgiarono per Zeus i fulmini che lo resero re degli dèi.<br><br><b>Il mito completo:</b> Figli di Urano e Gaia, questi tre Ciclopi originari furono imprigionati dal proprio padre Urano nel Tartaro insieme agli Ecatonchiri dalle cento mani, per poi essere liberati da Zeus durante la Titanomachia in cambio della loro lealtà. Per gratitudine, forgiarono i fulmini di Zeus, il tridente di Poseidone e l'elmo dell'invisibilità di Ade — le armi principali che permisero ai tre fratelli di sconfiggere i Titani e dividersi il cosmo.<br><br><b>Contesto culturale:</b> Questa tradizione dei Ciclopi \"fabbri\" è mitologicamente distinta e più antica della razza selvaggia e pastorale di Ciclopi solitari, come Polifemo, incontrata da Ulisse nell'Odissea — le stesse fonti antiche talvolta faticavano a conciliare le due tradizioni di Ciclopi, così diverse tra loro, in un'unica mitologia coerente.<br><br><b>Curiosità:</b> La tradizione greca e romana successiva collocò la loro fucina sotto il monte Etna in Sicilia (la stessa montagna sotto cui giace sepolto Tifone), al lavoro sotto la guida del dio Efesto — gli abitanti locali spiegavano il rombo e il fuoco del vulcano proprio come il suono dei Ciclopi ancora al lavoro sulla loro fucina eterna.",
  "Cinocefalo": "Popolo leggendario dalla testa canina, descritto dagli storici e viaggiatori dell'antichità come abitante di terre remote e misteriose ai margini del mondo conosciuto.<br><br><b>Il mito completo:</b> Il medico e storico greco Ctesia, scrivendo dell'India, li descrisse come intelligenti nonostante l'aspetto bestiale, capaci di comunicare (in parte tramite l'abbaiare) e organizzati in società con proprie usanze e costumi — un racconto poi ripreso da numerose fonti successive.<br><br><b>Contesto culturale:</b> I Cinocefali appartengono a un più ampio genere di miti greci sulle \"razze mostruose\" (insieme ai Blemmi, agli Arimaspi monocoli e altri) che descrivevano i confini del mondo conosciuto — riflettendo come la geografia greca antica mescolasse racconti reali di viaggiatori con elaborazioni fantastiche su popoli lontani e poco conosciuti.<br><br><b>Curiosità:</b> Questo mito ebbe una vita straordinariamente lunga: i Cinocefali compaiono ancora nelle mappe e nei bestiari europei medievali per oltre mille anni dopo Ctesia, e la tradizione cristiana dibatté seriamente se popoli dalla testa canina, ammesso che esistessero, potessero possedere un'anima ed essere convertiti — una vera questione teologica sollevata nella dottrina medievale.",
  "Dipsas": "Serpente della tradizione romana il cui morso non uccideva sul colpo, ma condannava la vittima a una sete inestinguibile e incurabile, descritto con orrore da diversi poeti latini.<br><br><b>Il mito completo:</b> Secondo il poeta romano Lucano, nella sua Farsaglia, il dipsas nacque, come l'Anfisbena e altri serpenti mostruosi del deserto libico, dalle gocce di sangue caduto dalla testa recisa di Medusa mentre Perseo la trasportava in volo sopra la Libia. Il nome stesso, dal greco dipsa (\"sete\"), descrive direttamente l'effetto del suo morso: una sete talmente insaziabile da spingere la vittima a bere fino a scoppiare, senza mai riuscire a placarla.<br><br><b>Contesto culturale:</b> I serpenti \"nati dal sangue di Medusa\" formavano un intero catalogo di creature velenose nella tradizione latina, ciascuna con un effetto specifico e orribile — un genere letterario di per sé, che univa la fascinazione romana per l'esotico deserto africano al gusto per il macabro dettagliato.<br><br><b>Curiosità:</b> Descrizioni dettagliate come quella del dipsas nella Farsaglia di Lucano hanno portato alcuni storici della medicina moderni a ipotizzare che dietro il mito si celi un'osservazione reale, per quanto esagerata poeticamente, degli effetti fisiologici genuini di alcuni morsi di serpente velenoso, che possono davvero causare sete intensa come sintomo secondario dell'avvelenamento.",
  "Dökkálfar Guerriero": "Gli \"elfi oscuri\" della mitologia norrena vivevano nelle profondità della terra, agli antipodi dei luminosi Ljósálfar: guerrieri temuti, si dice fossero all'origine di molte leggende successive sui nani.<br><br><b>Il mito completo:</b> I dökkálfar (\"elfi oscuri\") sono menzionati solo brevemente nell'Edda in prosa di Snorri Sturluson, descritti come abitanti sotterranei \"più neri della pece\" — ma questa descrizione breve e ambigua ha generato un enorme dibattito accademico, dato che altrove Snorri sembra descrivere esseri artigiani sotterranei similmente scuri come \"svartálfar\" (elfi neri) o semplicemente nani, portando molti studiosi moderni a sospettare che dökkálfar e svartálfar potessero essere gli stessi esseri sotto nomi diversi, o persino confusi del tutto con i nani dallo stesso Snorri, piuttosto che rappresentare tre razze genuinamente distinte nella credenza precristiana autentica.<br><br><b>Contesto culturale:</b> Questa incertezza accademica esemplifica una sfida più ampia nella ricostruzione della mitologia norrena: Snorri Sturluson, scrivendo nel XIII secolo come autore cristiano che lavorava su fonti orali e poetiche più antiche, potrebbe aver imposto la propria interpretazione sistematizzante su credenze popolari precedenti genuinamente più libere e regionalmente variabili sugli esseri sotterranei.<br><br><b>Curiosità:</b> Questa ambiguità tra elfi oscuri, nani ed elfi neri ha influenzato direttamente (e probabilmente originato) la convenzione ormai standard del genere fantasy moderno degli \"elfi oscuri\" come razza distinta (resa enormemente popolare dagli stessi elfi di Tolkien e più tardi da giochi come Dungeons & Dragons e Warhammer) — il che significa che un singolo riferimento medievale genuinamente incerto e poco documentato ha generato un intero archetipo fantasy moderno duraturo.",
  "Fossegrim": "Spirito scandinavo delle cascate, musicista sublime al violino: si narrava potesse insegnare la propria arte a chi gli offrisse un dono adeguato, ma il prezzo da pagare non era mai scontato.<br><br><b>Il mito completo:</b> Imparare dal Fossegrim richiedeva un'offerta rituale specifica — tradizionalmente un agnello nero rubato, o talvolta cibo o tabacco, gettato nella cascata di giovedì sera; se l'offerta era troppo modesta, lo spirito insegnava solo ad accordare lo strumento; un'offerta sufficiente garantiva lezioni abbastanza buone da far ballare gli ascoltatori senza controllo; un'offerta davvero generosa poteva conferire un'abilità così straordinaria che persino gli alberi e gli oggetti inanimati avrebbero ondeggiato al suono della musica, con le stesse dita del fossegrim a guidare direttamente la mano del suonatore.<br><br><b>Contesto culturale:</b> Questo sistema dettagliato e graduato di pagamento in cambio di abilità riflette uno schema di credenza popolare scandinavo più ampio che collega i patti soprannaturali a uno scambio precisamente calibrato e negoziato — nulla concesso dagli spiriti della natura era gratuito, e il valore esatto del dono ricevuto corrispondeva sempre esattamente al valore dell'offerta data.<br><br><b>Curiosità:</b> La tradizione del fossegrim è legata specificamente al violino tradizionale norvegese hardingfele (violino di Hardanger), strumento folk ancora suonato oggi — molti veri violinisti popolari norvegesi storici affermarono, o si disse di loro, che la propria eccezionale abilità derivasse da un patto col fossegrim, fondendo la tradizione musicale popolare genuina direttamente con la leggenda soprannaturale fino a epoche relativamente moderne.",
  "Gorgone Corazzata": "Le Gorgoni, tra cui la celebre Medusa, avevano capigliature di serpenti vivi e uno sguardo capace di pietrificare chiunque le fissasse negli occhi: solo Perseo riuscì a sconfiggerne una, usando uno scudo come specchio.<br><br><b>Il mito completo:</b> Delle tre sorelle Gorgoni, solo Medusa era mortale: Steno ed Euriale, le altre due, erano immortali e sopravvissero alla decapitazione della sorella, inconsolabili nel proprio dolore e furia, inseguendo invano Perseo in volo grazie ai sandali alati di Ermes che lo avevano reso troppo veloce per essere raggiunto. Alcune fonti descrivono le Gorgoni dotate di una pelle simile a scaglie di bronzo impenetrabili, zanne di cinghiale e mani di bronzo — un'armatura naturale che le rendeva quasi indistruttibili a qualunque arma convenzionale, distinguendole nettamente dalla successiva immagine più \"umana\" di Medusa resa celebre dall'arte posteriore.<br><br><b>Contesto culturale:</b> La distinzione tra la Medusa mortale e le sue sorelle immortali riflette un tema greco ricorrente: anche tra creature apparentemente identiche, esiste sempre un elemento vulnerabile che rende possibile l'eroismo — Perseo non avrebbe mai potuto sconfiggere Steno o Euriale, solo la sorella mortale.<br><br><b>Curiosità:</b> Le raffigurazioni artistiche più antiche delle Gorgoni (VII secolo a.C.) le mostrano tutte e tre praticamente identiche, grottesche e intercambiabili — solo con il tempo Medusa emerse come figura distinta e individualizzata, relegando Steno ed Euriale a un ruolo sempre più marginale, quasi dimenticato, nella tradizione successiva.",
  "Guerriero d'Ambra": "Le sorelle di Fetonte, disperate per la morte del fratello caduto dal carro del Sole, furono trasformate in pioppi le cui lacrime, cadendo nel fiume, si pietrificarono in ambra dorata: da quel pianto eterno la leggenda fa nascere guerrieri tanto preziosi quanto risoluti.<br><br><b>Il mito completo:</b> Il mito greco originale delle Eliadi (le sorelle di Fetonte, trasformate in pioppi lungo le rive del fiume Eridano) fu adottato e reinterpretato dalle culture baltiche, dove l'ambra veniva realmente e abbondantemente raccolta lungo le coste del Mar Baltico fin dalla preistoria — un caso in cui un mito mediterraneo di origine greca viaggiò per migliaia di chilometri lungo le antiche rotte commerciali dell'ambra, fondendosi con la venerazione locale baltica per questa resina fossile, considerata dotata di proprietà magiche e protettive.<br><br><b>Contesto culturale:</b> L'ambra baltica era merce di scambio così preziosa nell'antichità da dare il nome a un'intera rete commerciale, la \"Via dell'Ambra\", che collegava le coste baltiche fino al Mediterraneo attraverso l'Europa continentale — rendendo l'ambra uno dei rarissimi materiali il cui commercio collegò concretamente e per secoli le culture nordeuropee e quelle mediterranee, portando con sé anche scambi di miti e narrazioni.<br><br><b>Curiosità:</b> L'ambra baltica reale, spesso contenente insetti preistorici perfettamente conservati al proprio interno, continua a essere considerata pietra sacra e protettiva in molte tradizioni popolari baltiche contemporanee — un legame diretto tra la sostanza fisica reale, ancora oggi raccolta ed estratta commercialmente, e il ricco strato mitologico che le culture baltiche costruirono attorno a essa nel corso dei millenni.",
  "Huldra": "Bellissima donna dei boschi scandinavi, riconoscibile solo per una coda di mucca nascosta sotto le vesti: attirava i viandanti nella foresta con il suo canto, per poi rivelare la sua vera natura selvatica.<br><br><b>Il mito completo:</b> Oltre a sedurre semplicemente i viandanti, il folklore sulla Huldra la descriveva spesso capace di diventare una moglie devota, persino amorevole, per un mortale che la trattasse bene e, fondamentalmente, non rivelasse o deridesse mai la sua coda nascosta — se lo avesse fatto, o se l'avesse formalmente portata in chiesa per un vero matrimonio cristiano (alcuni racconti narrano che la coda cadesse entrando in chiesa, completando simbolicamente la sua trasformazione in donna pienamente umana e \"salvata\"), altre varianti più cupe insistono che qualunque tradimento della sua fiducia avrebbe portato rovina, malattia o morte al marito.<br><br><b>Contesto culturale:</b> Il folklore sulla Huldra riflette profonde tensioni culturali scandinave tra il mondo naturale selvaggio e precristiano (la foresta, incarnata dalla stessa Huldra) e l'ordine cristiano e civilizzato che avanzava (matrimonio, chiesa, comunità) — la sua potenziale \"redenzione\" attraverso il matrimonio simboleggia specificamente la natura selvaggia stessa incorporata e addomesticata dalla civiltà cristiana.<br><br><b>Curiosità:</b> La tradizione della Huldra resta vivacemente presente nella cultura popolare norvegese moderna — compare in modo prominente in film, televisione e letteratura norvegesi contemporanei, e il termine \"huldreung\" (\"bestiame degli hulder\", riferito al bestiame ritenuto appartenere al popolo nascosto degli Huldrefolk) compare ancora oggi negli studi folkloristici regionali norvegesi come tradizione viva, non semplice curiosità storica.",
  "Idra di Lerna (monotesta)": "Serpente dalle molte teste che, se recise, ricrescevano doppie: Eracle riuscì a sconfiggerla solo con l'aiuto del nipote Iolao, che cauterizzava ogni ferita col fuoco prima che una nuova testa spuntasse.<br><br><b>Il mito completo:</b> Prima di raggiungere la forma completamente sviluppata e temibile che affrontò Eracle, la tradizione immaginava l'Idra come una creatura ancora giovane, con un numero di teste inferiore rispetto alla sua forma matura — un dettaglio che alcuni mitografi antichi usavano per spiegare perché nessun eroe precedente a Eracle avesse mai tentato di affrontarla: la bestia era semplicemente cresciuta, diventando sempre più pericolosa con il passare degli anni nelle paludi di Lerna, fino a raggiungere le proporzioni leggendarie della sua fatica più celebre.<br><br><b>Contesto culturale:</b> L'idea di un mostro che cresce in pericolosità nel tempo, prima di essere finalmente affrontato dall'eroe giusto nel momento giusto, riflette una struttura narrativa comune nel mito greco: la minaccia deve raggiungere una scala quasi insostenibile prima che il destino porti l'eroe adatto a confrontarla.<br><br><b>Curiosità:</b> Le fonti antiche non concordano mai sul numero esatto di teste dell'Idra in nessuna fase della sua esistenza — un'incertezza che riflette quanto il mito fosse tramandato oralmente e rielaborato liberamente da narratore a narratore, senza mai fissarsi in una versione canonica unica e definitiva.",
  "Iena d'Etiopia": "I bestiari antichi narravano che le iene delle terre d'Etiopia sapessero imitare la voce umana per attirare i viandanti sprovveduti nell'oscurità, ingannandoli con richiami familiari.<br><br><b>Il mito completo:</b> Oltre a sedurre semplicemente le vittime con voci imitate, i resoconti dei bestiari antichi e medievali (attingendo a precedenti storici naturalisti greci come Plinio, elaborati attraverso la tradizione dei bestiari cristiani medievali) attribuirono numerose ulteriori proprietà inquietanti alla iena — inclusa la credenza che potesse cambiare sesso ogni anno (alternando tra maschio e femmina), che la sua ombra che cadeva su un cane lo rendesse muto, e che possedesse una pietra nell'occhio che, posta sotto la lingua di una persona, conferisse il potere della profezia.<br><br><b>Contesto culturale:</b> L'associazione della iena con inganno, trasformazione innaturale e sciacallaggio nei cimiteri (le vere iene sciacallano realmente, il che probabilmente alimentò la loro sinistra reputazione medievale) la rese un soggetto popolare per i bestiari cristiani medievali moraleggianti, dove la sua presunta natura di cambiamento di sesso in particolare veniva interpretata come simbolo di incostanza spirituale, ipocrisia e corruzione morale — la biologia genuinamente fraintesa di un animale reale trasformata in un'elaborata lezione morale.<br><br><b>Curiosità:</b> La base biologica reale dietro almeno un mito sulla iena è stata da allora scientificamente confermata in modo inaspettato: le iene macchiate femmine possiedono davvero genitali insolitamente mascolinizzati (una vera e documentata particolarità biologica legata ai loro livelli ormonali) che probabilmente contribuì direttamente ai resoconti confusi degli osservatori antichi sul sesso dell'animale — il che significa che questo particolare \"mito\" nacque in realtà da un'osservazione zoologica genuina ma travisata, non da pura invenzione.",
  "Leone di Citerone": "Sul monte Citerone il giovane Eracle, ancora adolescente, uccise il suo primo leone: un episodio che la tradizione ricorda come il preludio alle sue future, ben più celebri, imprese.<br><br><b>Il mito completo:</b> Prima ancora delle sue dodici fatiche, il giovane Eracle, mandato dal padre adottivo Anfitrione a sorvegliare le mandrie sul monte Citerone, affrontò e uccise un leone che da tempo terrorizzava la regione, decimando il bestiame locale. Secondo alcune fonti, l'eroe indossò poi la pelle di questo primo leone come suo primo mantello, prima ancora di ottenere quella ben più celebre del Leone di Nemea. Durante questa stessa impresa giovanile, secondo Apollodoro, Eracle avrebbe anche trascorso cinquanta notti con le cinquanta figlie del re Tespio, generando altrettanti figli.<br><br><b>Contesto culturale:</b> Questo episodio serve narrativamente come \"origine\" dell'eroismo di Eracle: dimostra fin dalla giovane età le qualità (forza, coraggio, capacità di proteggere una comunità da una minaccia) che caratterizzeranno tutta la sua carriera eroica successiva, in un classico schema del racconto dell'eroe che affronta prima piccole prove locali prima delle grandi imprese destinate a renderlo leggendario.<br><br><b>Curiosità:</b> Il fatto che Eracle affronti DUE leoni distinti nella sua vita — quello di Citerone da giovane e quello, ben più celebre, di Nemea nella sua prima fatica adulta — a volte genera confusione anche tra gli studiosi moderni su quale episodio venga raffigurato in certe antiche opere d'arte prive di iscrizioni esplicative.",
  "Leone di Nemea (cucciolo)": "La sua pelle era talmente resistente da non poter essere scalfita da nessuna arma: Eracle dovette strangolarlo a mani nude nella prima delle sue dodici fatiche, per poi indossarne la pelle come armatura invulnerabile.<br><br><b>Il mito completo:</b> Prima di raggiungere la piena maturità e l'invulnerabilità leggendaria che lo rese celebre, il Leone di Nemea era già temuto dagli abitanti della valle come un cucciolo insolitamente grande e feroce, capace di uccidere bestiame e pastori ben prima di raggiungere le sue dimensioni e la sua invulnerabilità adulte. Alcuni racconti popolari della regione narravano di segni premonitori — comete, tuoni improvvisi in cielo sereno — che accompagnarono la sua nascita, presagendo fin dall'inizio la minaccia che sarebbe diventato.<br><br><b>Contesto culturale:</b> L'idea di presagi che accompagnano la nascita di un futuro grande mostro (o eroe) è un motivo narrativo diffuso in tutta la mitologia greca, che sottolinea come il destino di una creatura sia spesso segnato fin dal principio, visibile a chi sa interpretare correttamente i segni divini.<br><br><b>Curiosità:</b> Il fatto che perfino da cucciolo il leone fosse già insolitamente pericoloso sottolinea, nella tradizione popolare, quanto la sua natura fosse innatamente soprannaturale fin dalla nascita, e non semplicemente il risultato di una crescita naturale come qualunque altro leone della regione.",
  "Svartálfar": "Nome collettivo per gli elfi oscuri della tradizione norrena, spesso confusi nelle fonti antiche con i nani: abili artigiani, vivevano rifuggendo la luce del giorno.<br><br><b>Il mito completo:</b> Gli svartálfar, nell'Edda in prosa di Snorri, compaiono specificamente nel contesto dei racconti sui nani artigiani (il resoconto dello Skáldskaparmál sui tesori forgiati dai nani per gli dèi colloca esplicitamente i fabbri nani in \"Svartálfheim\", il regno degli svartálfar), suggerendo che Snorri possa aver usato \"svartálfar\" essenzialmente come termine alternativo o sovrapposto per i nani stessi in certi contesti, piuttosto che come razza del tutto separata.<br><br><b>Contesto culturale:</b> La località di Svartálfheim (\"dimora degli elfi neri\") è elencata tra i nove mondi della cosmologia norrena in alcune fonti, dando a questo gruppo altrimenti vagamente definito una specifica patria cosmica distinta da Asgard, Midgard o gli altri regni nominati — anche se il rapporto esatto di questi esseri con i veri nani resta accademicamente incerto.<br><br><b>Curiosità:</b> La cultura popolare moderna (in particolare i film di Thor del Marvel Cinematic Universe) ha adottato \"Svartalfheim\" come ambientazione fittizia specifica e visivamente distinta associata agli \"elfi oscuri\" come antagonisti — un caso notevole in cui un concetto medievale norreno antico genuinamente ambiguo e poco documentato si cristallizza e si diffonde in un'ambientazione moderna specifica e visivamente concreta attraverso un adattamento cinematografico contemporaneo.",
  "Tarand": "Aristotele descrisse questo animale leggendario come capace di cambiare colore per mimetizzarsi con l'ambiente circostante, proprio come un camaleonte: un mistero naturalistico che affascinò i naturalisti per secoli.<br><br><b>Il mito completo:</b> Il Tarando (come descritto originariamente nelle fonti di storia naturale greche, poi assorbito nella scrittura di storia naturale romana e medievale) veniva descritto grande quanto un bue o un cervo, originario della Scizia (le regioni estreme del nord oltre il Mar Nero, ai confini del mondo classicamente conosciuto), con la specifica capacità di cambiare non solo colore ma l'intero aspetto del proprio manto per adattarsi a qualunque sfondo su cui si trovasse — descritta da alcuni autori antichi come la sua caratteristica più notevole e scientificamente sconcertante, che sfidava una spiegazione naturale semplice disponibile agli osservatori antichi.<br><br><b>Contesto culturale:</b> Il Tarando appartiene a un più ampio genere antico di \"meraviglie dai confini del mondo\" — descrizioni di animali genuinamente esotici da regioni distanti e raramente visitate (Scizia, India, Etiopia) riportate attraverso strati di racconti di viaggiatori di seconda mano, mescolando osservazione zoologica reale con esagerazione e fraintendimento progressivi mentre l'informazione passava attraverso molteplici narrazioni prima di raggiungere gli scrittori mediterranei.<br><br><b>Curiosità:</b> Zoologi e storici della scienza moderni hanno a lungo ipotizzato che il mito del Tarando sia probabilmente nato da descrizioni antiche confuse della vera renna (Rangifer tarandus, il cui nome scientifico di specie conserva direttamente questo antico nome mitologico) — le renne subiscono realmente drammatici cambiamenti stagionali del colore del manto (brunastro d'estate, molto più pallido e bianco d'inverno) che potrebbero facilmente essere stati esagerati da racconti distanti di seconda mano nella ben più drammatica capacità di \"mimetizzazione istantanea\" descritta nelle fonti antiche.",
  "Toro di Maratona": "In origine il maestoso Toro di Creta, catturato vivo da Eracle nella settima fatica e poi liberato in Grecia: giunto nei pressi di Maratona seminò il terrore, finché non fu domato dal giovane eroe Teseo.<br><br><b>Il mito completo:</b> Si tratta dello stesso toro inviato dal mare da Poseidone perché il re Minosse lo sacrificasse — proprio il toro che Minosse si rifiutò di sacrificare, e la cui sostituzione portò al concepimento del Minotauro. Eracle catturò questo toro vivo come settima fatica, cavalcandolo attraverso il mare da Creta al Peloponneso, per poi liberarlo presso Maratona dopo averlo presentato a Euristeo (che, ancora una volta terrorizzato, non ne volle sapere nulla e lo lasciò andare). Il toro devastò le campagne intorno a Maratona per anni, finché il giovane eroe Teseo, in una delle sue prime avventure prima di diventare re di Atene, non lo catturò e lo sacrificò ad Apollo (o ad Atena, secondo altre fonti) presso il Delfinio.<br><br><b>Contesto culturale:</b> La storia di questa creatura collega alcuni dei più celebri eroi greci (Eracle, Teseo) e luoghi (Creta, Maratona, Atene) in un unico filo narrativo continuo, illustrando come la mitologia greca antica funzionasse come una rete interconnessa piuttosto che come racconti isolati e slegati — lo stesso toro divino collega l'origine del Minotauro, le fatiche di Eracle e la prima carriera eroica di Teseo.<br><br><b>Curiosità:</b> La città di Maratona, per sempre legata a questo mito, divenne in seguito celebre in tutto il mondo per un evento storico completamente diverso: la battaglia di Maratona del 490 a.C. contro i Persiani, e la corsa (in gran parte leggendaria) del messaggero Fidippide che ispirò la moderna maratona sportiva — un unico toponimo che porta con sé due eredità del tutto separate, ugualmente famose, una mitologica e una storico-atletica.",
  "Troll dei Ponti": "Creatura scandinava che rivendica il possesso di ponti e passaggi, pretendendo un pedaggio o un tributo da chiunque intenda attraversarli: la leggenda più celebre lo vede sfidato e beffato da tre astute capre.<br><br><b>Il mito completo:</b> Questo racconto specifico — \"De tre bukkene Bruse\" (\"I Tre Capretti Bruse\") — è tecnicamente una fiaba popolare norvegese raccolta nell'Ottocento dai folkloristi Peter Christen Asbjørnsen e Jørgen Moe (l'equivalente norvegese dei Fratelli Grimm), più che un antico mito eddico o norreno vero e proprio — il capretto più piccolo attraversa per primo e soddisfa la richiesta di pagamento del troll promettendogli il fratello maggiore in arrivo; il troll lascia passare ogni capretto sperando in un pasto più grande, finché infine il più grande e forte non attraversa e semplicemente spinge il troll giù dal ponte nel fiume sottostante, sconfiggendolo con la forza più che con l'astuzia.<br><br><b>Contesto culturale:</b> I troll dei ponti che pretendono pedaggi o tributi riflettono una più ampia tradizione popolare europea (presente specificamente nel folklore germanico e scandinavo) che associa gli spazi liminali — ponti, soglie, confini tra territori — a pericolosi guardiani soprannaturali esigenti un tributo, un motivo popolare che serviva in parte a instillare una cautela genuina nei viandanti che si avvicinavano a punti di attraversamento sconosciuti o pericolosi.<br><br><b>Curiosità:</b> \"I Tre Capretti Bruse\" è una delle opere di folklore scandinavo più tradotte e riconosciute a livello internazionale, insegnata come storia per bambini in innumerevoli lingue — rendendo questo specifico troll dei ponti uno degli esportazioni culturali moderne di maggior successo del folklore di area norrena, probabilmente oggi molto più conosciuto internazionalmente della maggior parte dei veri miti eddici antichi.",
  "Ljósálfar": "Variante grafica del nome degli elfi di luce norreni, splendenti abitanti di Alfheim, simbolo di bellezza e grazia contrapposto alla natura oscura dei loro cugini sotterranei.<br><br><b>Il mito completo:</b> Descritti brevemente da Snorri Sturluson come \"più belli a vedersi del sole\", i ljósálfar abitano Alfheim, uno dei nove mondi, che fu specificamente donato al dio Freyr come \"dono del dente\" (un tradizionale regalo norreno dato a un bambino quando spuntava il primo dente) — un dettaglio mitologico insolitamente gentile e domestico che spiega l'origine del regno degli elfi di luce attraverso un atto di affetto familiare, non un mito di conquista o creazione.<br><br><b>Contesto culturale:</b> La netta dicotomia tra elfi di luce ed elfi oscuri (per quanto testualmente incerta riguardo a dökkálfar/svartálfar, come già notato) stabilisce quantomeno uno schema associativo chiaro nella cosmologia norrena tra luce, bellezza e il regno celeste da un lato, e oscurità, artigianato e il sottosuolo dall'altro — una gerarchia verticale simbolica che si ritrova altrove nella struttura cosmologica norrena (Asgard in alto, vari regni sotterranei in basso).<br><br><b>Curiosità:</b> Il possesso di Alfheim da parte di Freyr, unito alle sue forti associazioni con fertilità, luce solare e prosperità, ha portato alcuni studiosi a ipotizzare che i ljósálfar e il culto dello stesso Freyr potessero essere strettamente, forse originariamente, collegati o addirittura sovrapposti nella credenza precristiana più antica e meno sistematizzata, prima che gli scritti successivi di Snorri li organizzassero in categorie più nettamente separate.",
  "Lupo di Roma": "La lupa che allattò i gemelli abbandonati Romolo e Remo lungo le rive del Tevere resta uno dei simboli più celebri della fondazione di Roma, ancora oggi raffigurata in tutta la città.<br><br><b>Il mito completo:</b> I gemelli, figli della vestale Rea Silvia e del dio Marte, furono condannati ad annegare nel Tevere per ordine del prozio Amulio (che aveva usurpato il trono al nonno Numitore), ma il cesto che li trasportava si arenò presso il colle Palatino, dove la lupa li trovò e allattò finché un pastore, Faustolo, non li scoprì e li allevò come propri figli. Raggiunta l'età adulta e scoperte le proprie vere origini, i gemelli rovesciarono Amulio, restituirono il trono al nonno Numitore, e partirono per fondare la propria città — ma litigarono fatalmente sull'esatta ubicazione e sul diritto di darle il nome, una disputa conclusasi quando Romolo uccise Remo e fondò Roma da solo, dandole il proprio nome.<br><br><b>Contesto culturale:</b> La violenza centrale di questo mito fondativo (il fratricidio nel momento stesso della fondazione della città) fu interpretata da commentatori antichi e moderni come oscuramente simbolica dell'intera storia successiva di conflitti civili, ambizione e violenza politica interna di Roma — la storia dell'origine stessa della città contiene, e forse anticipa, il ricorrente schema di lotte interne romane che avrebbe caratterizzato gran parte della sua storia politica successiva.<br><br><b>Curiosità:</b> La celebre statua bronzea della \"Lupa Capitolina\" raffigurante la lupa che allatta i gemelli, sebbene a lungo ritenuta un'opera etrusca originale del V secolo a.C., fu ridatata scientificamente nel 2006 attraverso test al radiocarbonio e termoluminescenza al periodo medievale (probabilmente XI-XII secolo d.C.) — il che significa che il simbolo antico più famoso di Roma è oggi considerato una ricostruzione medievale, mentre le due figure dei gemelli furono confermate come aggiunte ancora più tarde, durante il Rinascimento.",
  "Mantichora Giovane": "Creatura descritta dallo storico greco Ctesia sulla base di racconti persiani: corpo di leone, volto quasi umano dalla voce simile a un flauto, e una coda di scorpione capace di scagliare aculei velenosi.<br><br><b>Il mito completo:</b> Ctesia, medico greco alla corte persiana nel V secolo a.C., raccolse racconti di viaggiatori e mercanti sulle terre remote dell'India, descrivendo la manticora come dotata di tre file di denti aguzzi come squali, capace di divorare intere prede senza lasciare traccia — ossa comprese — e di scagliare i propri aculei velenosi come frecce, per poi farne ricrescere di nuovi. Il nome stesso \"mantichora\" deriva probabilmente dal persiano antico martiya-khvar, che significa letteralmente \"mangiatore di uomini\".<br><br><b>Contesto culturale:</b> Insieme ai Cinocefali e ad altre \"meraviglie d'India\" descritte da Ctesia, la manticora appartiene a un genere letterario greco specifico dedicato alle terre esotiche ai confini del mondo conosciuto — un misto di osservazioni reali distorte (forse ispirate a tigri o altri grandi felini asiatici descritti da fonti indirette) ed elaborazione fantastica.<br><br><b>Curiosità:</b> La manticora ha avuto una delle vite più lunghe tra i mostri \"geografici\" greci, sopravvivendo praticamente immutata nei bestiari medievali europei e comparendo ancora oggi come creatura ricorrente in giochi di ruolo e fantasy contemporanei — quasi 2500 anni dopo la prima descrizione di Ctesia.",
  "Minotauro Rinnegato": "Nato dall'unione innaturale tra la regina Pasifae e un toro sacro, il Minotauro fu rinchiuso nel Labirinto di Cnosso a nutrirsi di vittime sacrificali, finché Teseo non lo affrontò e lo uccise con l'aiuto del filo di Arianna.<br><br><b>Il mito completo:</b> Al di là della vergogna pubblica che la sua nascita causò alla famiglia reale cretese, il Minotauro rappresentò per il re Minosse un problema politico oltre che personale: nasconderlo nel Labirinto costruito da Dedalo non fu solo un atto di pudore, ma anche un modo per mantenere il controllo su una creatura che, se lasciata libera, avrebbe potuto minacciare il potere stesso di Minosse sull'isola. Alcune tradizioni suggeriscono che lo stesso Minosse, incapace di uccidere di propria mano quello che restava comunque un figlio della moglie, preferì la soluzione del confinamento perpetuo piuttosto che l'esecuzione diretta.<br><br><b>Contesto culturale:</b> Il Minotauro incarna un tema greco specifico sulla vergogna familiare come minaccia al potere politico: una creatura nata dalla propria stessa casa reale, troppo pericolosa per essere mostrata ma anche troppo legata al sangue reale per essere semplicemente eliminata, costringe Minosse a una soluzione intermedia e instabile.<br><br><b>Curiosità:</b> Il termine \"rinnegato\", applicato retrospettivamente al Minotauro nella tradizione moderna, cattura bene questa tensione originaria: una creatura mai davvero accettata dalla propria famiglia, tenuta nascosta e negata pubblicamente pur essendo innegabilmente parte della casa reale cretese.",
  "Mirmidone (Forma Umana)": "Un tempo formiche, i Mirmidoni furono trasformati in uomini da Zeus per ripopolare l'isola del re Eaco dopo una pestilenza devastante: divennero poi i leggendari guerrieri al comando di Achille durante la guerra di Troia.<br><br><b>Il mito completo:</b> Divenuti uomini, i Mirmidoni conservarono la disciplina e la lealtà assoluta delle proprie origini di formiche. Al comando di Achille durante la guerra di Troia, divennero celebri per un episodio narrato nell'Iliade: quando Achille, offeso da Agamennone, si ritirò dal combattimento, i Mirmidoni si rifiutarono di combattere senza di lui, anche di fronte alle sconfitte greche — una dimostrazione della loro fedeltà assoluta a un singolo comandante, più che alla causa greca collettiva.<br><br><b>Contesto culturale:</b> Questo episodio dell'Iliade mostra un ideale eroico specifico: la lealtà personale al proprio signore come valore supremo, anche a costo della vittoria comune — un tema che risuona in tutta la letteratura eroica successiva sulla fedeltà tra guerriero e comandante.<br><br><b>Curiosità:</b> La disciplina proverbiale dei Mirmidoni, radicata nella loro origine di formiche, ha reso il loro nome sinonimo, ancora oggi in molte lingue europee, di seguace fedele e instancabile — un'eredità linguistica diretta di questa trasformazione mitologica.",
  "Mirmidone": "Nella forma originaria, prima della trasformazione divina, i Mirmidoni erano semplicemente formiche laboriose: proprio da questa umile origine deriva il loro nome, che significa letteralmente \"popolo delle formiche\".<br><br><b>Il mito completo:</b> Il re Eaco, sovrano di un'isola spopolata da una pestilenza devastante, pregò Zeus di donargli nuovi sudditi. Zeus trasformò l'intera colonia di formiche dell'isola in una razza di uomini leali e instancabili: i Mirmidoni, da myrmex, \"formica\".<br><br><b>Contesto culturale:</b> L'etimologia stessa del nome spiega proverbialmente la disciplina e la laboriosità dei Mirmidoni — formiche, per natura, lavoratrici instancabili e collettive — un'origine mitologica che si riflette direttamente nel loro carattere umano successivo.<br><br><b>Curiosità:</b> La parola \"mirmidone\" è entrata nell'inglese moderno (myrmidon) come termine per indicare un seguace leale e senza domande, un subordinato ubbidiente fino in fondo — un uso ancora oggi diffuso, diretta eredità di questa antica trasformazione mitologica.",
  "Nisse": "Piccolo spirito domestico scandinavo, vestito di grigio con un caratteristico berretto rosso: protegge le fattorie e il bestiame, ma pretende in cambio un piatto di porridge lasciato fuori nelle notti d'inverno.<br><br><b>Il mito completo:</b> La tradizione di lasciare fuori una ciotola di porridge (di solito con una noce di burro sopra) specificamente per il nisse la vigilia di Natale resta una consuetudine popolare attivamente praticata in alcune zone di Scandinavia ancora oggi, in particolare nelle aree rurali — dimenticare l'offerta, o peggio, mangiare il burro senza lasciarlo, si credeva provocasse l'ira del nisse, con conseguenti dispetti, sabotaggio degli attrezzi agricoli o persino l'abbandono della fattoria da parte dello spirito (portando via con sé la prosperità e la fortuna del luogo).<br><br><b>Contesto culturale:</b> La tradizione del nisse si è evoluta direttamente nel moderno \"julenisse\" scandinavo — sostanzialmente l'equivalente regionale di Babbo Natale — le caratteristiche dello spirito domestico guardiano legate ai doni, all'inverno e all'amore per il porridge si sono fuse nel corso dei secoli con le tradizioni natalizie cristiane importate e più tardi commercializzate, fino a produrre la moderna figura del Babbo Natale nordico.<br><br><b>Curiosità:</b> Questo significa che l'immagine moderna e globalmente riconoscibile di \"Babbo Natale\" ha in realtà almeno due tradizioni folkloristiche antenate genuinamente distinte che confluiscono in essa a seconda della regione — la più familiare tradizione anglo-americana di San Nicola, e questa separata e più antica tradizione scandinava dello spirito domestico (nisse/tomte) — entrambe infine convergenti in figure invernali moderne del dono ampiamente simili attraverso un'evoluzione culturale in gran parte indipendente.",
  "Ophiotauro (cucciolo)": "Creatura ibrida tra toro e serpente le cui viscere, se bruciate, avrebbero garantito la vittoria nella guerra tra Giganti e Olimpi: gli dèi, temendone il potere, ne impedirono il sacrificio proprio in tempo.<br><br><b>Il mito completo:</b> Secondo un oracolo, chiunque fosse riuscito a bruciare le viscere dell'Ofiotauro prima che gli dèi potessero intervenire avrebbe ottenuto il potere di rovesciare l'ordine cosmico stesso, permettendo ai Giganti di sconfiggere gli Olimpi nella Gigantomachia. Un Gigante tentò di compiere il sacrificio proprio in tempo per garantire la vittoria ai suoi alleati, ma Zeus, resosi conto del pericolo, inviò la propria aquila a strappargli di mano le viscere prima che il fuoco potesse consumarle completamente, salvando così il proprio regno all'ultimo istante possibile.<br><br><b>Contesto culturale:</b> Questo mito, tra i meno noti della tradizione greca, condivide una struttura narrativa con altri racconti di \"profezie sul filo del rasoio\" — un potere immenso reso disponibile a chiunque compia un rito specifico al momento giusto, disinnescato solo da un intervento divino tempestivo e quasi casuale.<br><br><b>Curiosità:</b> A differenza della maggior parte dei mostri greci, l'Ofiotauro non viene mai sconfitto o ucciso in battaglia: la sua unica funzione narrativa è essere l'oggetto di un sacrificio quasi riuscito, rendendolo uno dei rari casi in cui il \"mostro\" della storia non è mai davvero un antagonista attivo, ma piuttosto una chiave di volta passiva il cui destino determina l'esito di un'intera guerra cosmica.",
  "Salamandra di Fuoco": "Creatura ritenuta capace di vivere immersa nelle fiamme senza bruciare, tanto da spegnerle al solo contatto: divenne in seguito, nella tradizione alchemica, il simbolo stesso dell'elemento Fuoco.<br><br><b>Il mito completo:</b> La leggenda dell'immunità al fuoco della salamandra, riportata da Plinio il Vecchio tra gli altri nella storia naturale romana, fu presa così sul serio nell'antichità che alcuni autori romani sostenevano che la pelle dell'animale, se raccolta correttamente, potesse essere tessuta in un tessuto genuinamente ignifugo — una credenza persistita per secoli e probabilmente nata da vere osservazioni di salamandre reali che emergevano inaspettatamente da pile di legna quando questa veniva gettata sul fuoco (gli anfibi comunemente vanno in letargo dentro tronchi marcescenti, e la loro comparsa improvvisa e sorprendente tra le fiamme mentre il legno bruciava probabilmente convinse gli osservatori che la creatura nascesse dal fuoco o ne fosse immune, piuttosto che semplicemente fuggirlo).<br><br><b>Contesto culturale:</b> La salamandra di fuoco divenne una delle quattro creature simboliche elementali classiche dell'alchimia (insieme alle ondine per l'acqua, alle silfidi per l'aria e ai gnomi per la terra), una cornice simbolica formalizzata nel XVI secolo dal medico e alchimista svizzero Paracelso, consolidando l'associazione della salamandra con l'elemento fuoco profondamente nella successiva tradizione esoterica e alchemica occidentale, ben oltre le sue origini originarie nella storia naturale romana.<br><br><b>Curiosità:</b> Il presunto tessuto ignifugo di \"lana di salamandra\" descritto in alcune fonti medievali e rinascimentali era probabilmente un ricordo confuso o una deliberata mistificazione di un materiale reale — l'amianto, le cui genuine proprietà ignifughe erano note e sfruttate fin dall'antichità (gli stessi Romani usavano l'amianto in varie applicazioni), spiegando forse da dove provenisse davvero la \"prova\" pratica dell'originariamente esagerata leggenda del tessuto di salamandra.",
  "Scitala": "Serpente descritto dagli autori latini come dotato di una pelle così lucente da ipnotizzare le prede in pieno inverno, quando tutti gli altri rettili sono ormai in letargo.<br><br><b>Il mito completo:</b> Descritta da autori romani tra cui Lucano (nello stesso più ampio catalogo di serpenti del deserto libico già menzionato insieme a Dipsas e Anfisbena, tutti presumibilmente nati dal sangue di Medusa) ed elaborata più tardi dagli scrittori dei bestiari medievali, la Scitala era specificamente nota per mutare pelle molto presto nella stagione, ben prima degli altri serpenti, e per la sua colorazione insolitamente brillante e screziata ritenuta capace di ipnotizzare le potenziali prede spingendole ad avvicinarsi volontariamente invece che dover essere cacciate attivamente.<br><br><b>Contesto culturale:</b> Questa intera famiglia di \"serpenti del deserto libico nati dal sangue di Medusa\" (Scitala, Dipsas, Anfisbena e altri) rappresenta una tradizione letteraria distintamente romana, più pienamente elaborata nel poema epico Farsaglia di Lucano, che fonde una conoscenza geografica genuina della pericolosa fauna del deserto nordafricano con la cornice mitologica greca ereditata della morte di Medusa — una sintesi letteraria specificamente romana piuttosto che puro mito greco o pura storia naturale.<br><br><b>Curiosità:</b> Si ritiene che il nome Scitala derivi dalla parola greca/latina per \"rullo\" o \"bastone cilindrico\" (skytale), forse riferendosi alla forma liscia, arrotondata e simile a un tronco del corpo del serpente — la stessa parola radice \"skytale\" fu anche famosamente usata per un dispositivo crittografico spartano antico non correlato (un'asta di legno usata per messaggi militari cifrati per trasposizione), un'interessante coincidenza linguistica che collega il nome di un serpente mitologico a un pezzo di tecnologia militare antica del tutto scorrelato attraverso un'etimologia condivisa.",
  "Skogsrå": "La \"signora della foresta\" scandinava, simile alla Huldra, proteggeva gli animali selvatici del bosco e poteva sia aiutare che confondere i cacciatori che si avventuravano nel suo territorio.<br><br><b>Il mito completo:</b> Distinta dalla Huldra specificamente nella tradizione regionale svedese (rispetto alla maggiore prominenza norvegese/danese della Huldra), la Skogsrå era particolarmente associata alla protezione e al controllo della selvaggina della foresta — i cacciatori si credeva avessero bisogno della sua esplicita benevolenza per avere una battuta di caccia riuscita, e offenderla (con comportamento irrispettoso, caccia eccessiva o violazione dei tabù venatori) poteva rovinare permanentemente la fortuna di quel cacciatore, a volte anche per l'intera sua discendenza familiare in seguito.<br><br><b>Contesto culturale:</b> La tradizione della Skogsrå riflette ansie pratiche genuine delle comunità rurali scandinave dipendenti dalla foresta riguardo a pratiche venatorie sostenibili e rispetto per le popolazioni di selvaggina — mitizzate come un \"guardiano\" spirituale la cui benevolenza determinava direttamente il successo o il fallimento materiale di un cacciatore.<br><br><b>Curiosità:</b> A differenza di alcuni spiriti della foresta associati puramente al pericolo o all'inganno, diversi racconti regionali sulla Skogsrå descrivono specificamente relazioni riuscite, persino romanticamente appaganti, tra cacciatori mortali e la Skogsrå stessa — a condizione che l'uomo non rivelasse mai ad altri la sua vera natura parzialmente animale, uno schema folkloristico ricorrente di \"conoscenza proibita/segretezza\" presente in molte tradizioni di amanti soprannaturali in tutto il mondo.",
  "Sparto": "I \"uomini seminati\" nacquero armati dai denti di drago sparsi nella terra, prima da Cadmo nella fondazione di Tebe e poi da Giasone nella terra della Colchide: guerrieri feroci, si narra che iniziassero subito a combattersi a vicenda appena spuntati dal suolo.<br><br><b>Il mito completo:</b> Cadmo, fondatore di Tebe, uccise un drago che custodiva una sorgente sacra e, su consiglio di Atena, ne seminò i denti nel terreno: ne nacquero guerrieri completamente armati, che iniziarono immediatamente a combattersi a vicenda finché non ne sopravvissero solo cinque, diventati poi gli antenati della nobiltà tebana. Generazioni più tardi, Giasone, nella sua ricerca del Vello d'Oro, ricevette dallo stesso re Eeta gli stessi denti di drago (un dono di Atena) e dovette ripetere l'identica impresa come una delle sue prove impossibili, sopravvivendo grazie a uno stratagemma appreso da Medea: lanciare una pietra in mezzo agli Sparti per farli voltare gli uni contro gli altri.<br><br><b>Contesto culturale:</b> Il mito degli Sparti è legato direttamente all'identità civica di Tebe: la nobiltà tebana rivendicava una discendenza letterale dai cinque Sparti sopravvissuti, usando il mito come vero e proprio racconto fondativo della propria aristocrazia.<br><br><b>Curiosità:</b> Questo è uno degli esempi più chiari di un mito riutilizzato come \"modello\" narrativo in due storie eroiche diverse (Cadmo e Giasone), separate da generazioni — una dimostrazione di come gli elementi mitologici greci circolassero e venissero ricombinati tra diversi cicli eroici.",

  "Cernunnos": "Divinità celtica dalle corna di cervo, signore degli animali selvatici e della natura incontaminata. Le fonti su di lui sono scarse — appare soprattutto su un unico grande calderone rituale, il Calderone di Gundestrup.<br><br><b>Il mito completo:</b> Oltre alla celebre raffigurazione sul Calderone di Gundestrup (un vaso rituale d'argento pesantemente decorato ritrovato in Danimarca, sebbene le sue immagini si ritenga rappresentino temi religiosi celtici, forse create da artigiani traci per committenti celtici), Cernunnos compare in iscrizioni e rilievi sparsi in tutta la Gallia e il più ampio mondo celtico, tipicamente raffigurato seduto a gambe incrociate, cornuto e spesso accompagnato da un serpente dalla testa d'ariete e circondato da altri animali — un'iconografia che gli studiosi interpretano come rappresentazione del suo ruolo di signore della natura selvaggia, della fertilità e forse dell'oltretomba o dei cicli di morte e rigenerazione, sebbene l'estrema scarsità delle fonti testuali superstiti (a differenza dei ben documentati pantheon greco o norreno) significhi che gran parte della sua mitologia e del suo culto specifico resti genuinamente e permanentemente sconosciuta.<br><br><b>Contesto culturale:</b> Cernunnos esemplifica una delle sfide storiche centrali della religione celtica antica: gli stessi Celti lasciarono pochi o nessun testo mitologico scritto (la loro conoscenza religiosa veniva tradizionalmente trasmessa oralmente dai druidi, che evitavano deliberatamente di mettere per iscritto gli insegnamenti sacri), il che significa che praticamente tutto ciò che gli studiosi moderni sanno su divinità come Cernunnos proviene da reperti archeologici, brevi commenti di epoca romana da parte di osservatori esterni, o testi medievali molto più tardi scritti dopo la cristianizzazione — rendendo la ricostruzione della mitologia celtica fondamentalmente diversa e più frammentaria rispetto a tradizioni con documentazione letteraria nativa continua.<br><br><b>Curiosità:</b> Cernunnos è diventato una delle figure divine ricostruite più popolari del neopaganesimo e della tradizione wiccan moderni, frequentemente invocato come archetipo centrale del \"Dio Cornuto\" — un caso interessante in cui una figura antica genuinamente oscura e poco documentata ha acquisito un significato molto più dettagliato ed elaborato nella spiritualità alternativa contemporanea di quanto le scarse prove antiche potrebbero mai sostenere.",
  "Domovoy": "Spirito domestico slavo che vive nascosto dietro la stufa di casa: se trattato con rispetto protegge la famiglia e il focolare, ma se dimenticato o offeso può trasformarsi in un dispettoso disturbatore notturno.<br><br><b>Il mito completo:</b> Il domovoy si credeva tradizionalmente ereditato da una famiglia e persino da una specifica struttura della casa stessa — quando una famiglia si trasferiva in una nuova abitazione, veniva eseguito un rituale specifico per invitare il domovoy a seguirla (a volte portando braci dal vecchio focolare, o letteralmente pronunciando ad alta voce un invito mentre si portava una scarpa o una pantofola come veicolo simbolico per lo spirito), dato che abbandonarlo sarebbe stato considerato sia irrispettoso sia di cattivo auspicio per la fortuna futura della famiglia. Il domovoy si pensava assomigliasse fisicamente al capofamiglia stesso, apparendo talvolta come un piccolo sosia o un vecchio barbuto con gli stessi tratti, e la sua agitazione (rumori extra, oggetti spostati, suoni insoliti di notte) veniva interpretata come un avvertimento di sventura o pericolo imminente per la famiglia.<br><br><b>Contesto culturale:</b> La tradizione del domovoy riflette un tratto genuinamente centrale della religione popolare slava: la natura sacra e protetta del focolare e della casa stessa, considerata abitata da una presenza ancestrale o guardiana che richiede cura e rispetto continui, profondamente legata alle più ampie pratiche slave di venerazione degli antenati.<br><br><b>Curiosità:</b> La tradizione del domovoy sopravvisse notevolmente robusta fino al XIX e persino XX secolo nella credenza popolare rurale russa, ampiamente documentata dagli etnografi russi — alcune famiglie rurali continuarono a quanto pare a lasciare piccole offerte (pane, latte o sale) per il proprio domovoy fin dentro l'era sovietica, nonostante l'ateismo di stato ufficiale scoraggiasse attivamente tali pratiche religiose popolari.",
  "Kikimora delle Paludi": "Versione più oscura e inquietante del Domovoy, la Kikimora infesta le case trascurate portando incubi e disordine: nella variante delle paludi si narra viva tra le acque stagnanti, pronta a confondere chi si avventura troppo vicino.<br><br><b>Il mito completo:</b> Nella sua forma domestica infestante, la Kikimora era specificamente associata al disturbo del sonno attraverso gli incubi (il suo nome forse legato a \"mora\", un più ampio concetto popolare slavo e più generalmente europeo di uno spirito dell'incubo che si siede sul petto di chi dorme) e all'aggrovigliare o rovinare i lavori a maglia o tessitura lasciati incompiuti durante la notte — un compito domestico lasciato incompleto o riposto in modo improprio si riteneva invitasse specificamente i suoi dispetti, legando il suo folklore a genuine aspettative pratiche di disciplina domestica. La variante delle paludi si riteneva fosse lo spirito irrequieto di un bambino non battezzato o maledetto, che attirava i viandanti nella palude con luci ingannevoli o pianti che imitavano un bambino perduto in difficoltà.<br><br><b>Contesto culturale:</b> Le duplici forme, domestica e palustre, della Kikimora riflettono una più ampia tendenza popolare slava a immaginare lo stesso tipo di spirito malevolo di fondo manifestarsi diversamente a seconda dell'ambiente — disordine e negligenza domestica al chiuso, pericolo fisico e disorientamento all'aperto in terreno paludoso pericoloso.<br><br><b>Curiosità:</b> Il dettaglio delle luci ingannevoli nella palude condivide la Kikimora con numerose altre tradizioni folkloristiche di \"fuochi fatui\" diffuse in tutto il mondo (incluso il will-o'-the-wisp inglese stesso, e figure simili in molte culture) — un fenomeno naturale reale e ampiamente documentato (la combustione del gas di palude, \"ignis fatuus\") probabilmente fornì la base osservativa reale sottostante a questo particolare filone del suo folklore.",
  "Korrigan": "Piccole fate della tradizione bretone, i Korrigan custodiscono fontane e sorgenti sacre, proteggendo tesori nascosti: la leggenda li lega spesso a racconti di cavalieri smarriti nei boschi della Bretagna.<br><br><b>Il mito completo:</b> I Korrigan venivano specificamente associati nella tradizione bretone a siti sacri precristiani, in particolare monumenti megalitici e pozzi sacri successivamente \"convertiti\" o reinterpretati sotto il cristianesimo — alcuni racconti li descrivono come gli spiriti diminuiti ed esiliati di sacerdotesse druidiche precristiane o nobiltà pagana, condannati a diventare piccolo popolo fatato nascosto dopo essersi rifiutati di convertirsi o dopo che l'arrivo del cristianesimo aveva soppiantato la loro più antica autorità religiosa. Erano considerati mutaforma particolarmente belli (o in alcune varianti regionali più cupe, orribili) capaci di attirare i viandanti sia in un genuino coinvolgimento romantico sia in una rovina fatale, a volte entrambi — una notte trascorsa inconsapevolmente danzando con i Korrigan poteva far invecchiare un mortale di decenni in una sola sera al ritorno nel mondo normale, o fargli perdere permanentemente la capacità di lasciare del tutto il loro regno.<br><br><b>Contesto culturale:</b> La specifica associazione dei Korrigan con la transizione storica dall'autorità religiosa precristiana a quella cristiana in Bretagna riflette uno schema folkloristico europeo più ampio di \"degradazione\" di figure spirituali pagane precedenti in un piccolo popolo fatato moralmente ambiguo piuttosto che la loro completa cancellazione — preservando la memoria popolare dell'ordine religioso più antico in forma diminuita e addomesticata.<br><br><b>Curiosità:</b> Alcuni folkloristi bretoni hanno collegato specificamente le leggende sui Korrigan a un'ansia storica genuina riguardo ai reali monumenti megalitici della regione (come i celebri allineamenti di Carnac) — l'origine misteriosa, antica e chiaramente precristiana di queste massicce strutture in pietra, i cui costruttori e scopi originari erano completamente dimenticati in epoca medievale, probabilmente alimentò direttamente il folklore locale che attribuiva un significato soprannaturale legato alle fate a questi siti archeologici genuinamente enigmatici.",
  "Leshy": "Signore e guardiano della foresta nella mitologia slava, il Leshy può mutare forma e dimensione a piacimento: protegge gli animali selvatici e punisce i cacciatori avidi facendoli smarrire tra gli alberi per giorni interi.<br><br><b>Il mito completo:</b> La capacità di mutare forma del Leshy si riteneva capace non solo di cambiare dimensione e forma animale, ma anche di imitare perfettamente specifici individui umani (inclusi i membri della famiglia di un cacciatore o compaesani) proprio per condurre i viandanti smarriti ancora più fuori strada, sempre più in profondità nella foresta. Le contromisure protettive tradizionali contro l'essere \"sviato\" da un Leshy includevano rivoltare i propri vestiti al contrario e scambiare le scarpe destra e sinistra sui piedi opposti — disturbare deliberatamente l'ordine normale si riteneva spezzasse l'incantesimo confusionario, dato che il potere del Leshy dipendeva in parte dal mantenere il senso di direzione \"normale\" del viandante disorientato.<br><br><b>Contesto culturale:</b> Il Leshy incarnava ansie pratiche genuine delle comunità rurali slave dipendenti dalla foresta riguardo al reale pericolo di perdersi in una boscaglia fitta e disorientante — mitizzato come un'autorità spirituale personale e negoziabile (rispetta il suo dominio, e cacciatori e raccoglitori potevano aspettarsi un passaggio sicuro; mancale di rispetto attraverso caccia eccessiva o arroganza, e aspettati una punizione) piuttosto che semplicemente un pericolo naturale impersonale.<br><br><b>Curiosità:</b> Il rimedio popolare specifico di \"rivoltare i propri vestiti\" contro l'incantesimo del Leshy compare con sorprendente coerenza in un'enorme estensione geografica del folklore slavo (dalla Polonia attraverso la Russia fino all'Ucraina e oltre), suggerendo un sistema di credenze slavo precristiano genuinamente antico e ampiamente condiviso sulla magia del disorientamento e le sue specifiche contromisure rituali, precedente alla notevole variazione regionale osservata in molti altri aspetti del folklore slavo.",
  "Banshee": "Spirito femminile irlandese il cui lamento straziante, udito nella notte, annuncia la morte imminente di un membro della famiglia a cui è legata: si narra che ogni antico casato avesse la propria Banshee.<br><br><b>Il mito completo:</b> La tradizione della banshee sostiene specificamente che solo le famiglie di genuina antica discendenza irlandese (o nella tradizione scozzese, la correlata bean nighe) — in particolare quelle il cui cognome inizia con \"O'\" o \"Mac\", riflettendo un'autentica antica discendenza di clan — abbiano una propria banshee legata; le famiglie prive di radici ancestrali così profonde si riteneva tradizionalmente mancassero del tutto di questo particolare sistema di avvertimento soprannaturale. Alcuni racconti descrivono più banshee che gemono insieme come segno che una persona particolarmente grande o santa sta per morire, mentre altri descrivono il grido della banshee variare di carattere a seconda che la morte imminente sarà pacifica o violenta.<br><br><b>Contesto culturale:</b> La tradizione della banshee riflette profondi valori culturali irlandesi riguardo alla discendenza di clan, alla continuità ancestrale e all'importanza di segnare e piangere adeguatamente la morte all'interno della continuità storica di una famiglia — il suo avvertimento soprannaturale serviva in parte come meccanismo popolare a rinforzare l'importanza emotiva e sociale di prepararsi correttamente alla scomparsa di un membro della famiglia.<br><br><b>Curiosità:</b> La banshee resta una delle figure del folklore irlandese più riconosciute a livello internazionale, il suo nome e concetto generale noti persino a persone senza altra familiarità con la mitologia irlandese — in gran parte grazie all'ampio uso in film horror moderni, videogiochi e narrativa popolare, dove \"banshee\" è diventato un termine abbreviato ampiamente riconosciuto per qualunque spirito femminile associato a un grido lacerante e straziante, indipendentemente dal ruolo specifico di avvertimento ancestrale centrale nel folklore originale.",
  "Cú Sìth": "Enorme cane fatato scozzese, dal manto verde scuro e silenzioso come un'ombra: si diceva portasse via le anime verso l'Aldilà, ed era temuto tanto quanto rispettato dai pastori delle Highlands.<br><br><b>Il mito completo:</b> Il caratteristico e profondo latrato del Cù-sìth si riteneva udibile da grande distanza, ma diventava più flebile man mano che la creatura si avvicinava realmente — il che significa che un ascoltatore che sentiva l'abbaio debolmente doveva fuggire immediatamente, dato che un suono flebile indicava vicinanza, mentre il pericolo era già effettivamente arrivato nel momento in cui l'abbaio diventava forte e chiaro. Questa logica di avvertimento invertita rendeva la creatura particolarmente temuta, dato che l'intuizione ordinaria sul pericolo che si avvicina (suono che diventa più forte man mano che una minaccia si avvicina) veniva specificamente ribaltata e quindi ingannevole.<br><br><b>Contesto culturale:</b> L'associazione del Cù-sìth con il regno fatato (\"sìth\" significa direttamente \"fata\" in gaelico scozzese, la stessa radice dietro \"banshee\" — bean sìth, \"donna fata\") lega questa creatura al più ampio e profondamente sviluppato quadro concettuale gaelico scozzese e irlandese dell'Altro Mondo/regno fatato, esistente parallelamente e occasionalmente intersecantesi con l'esperienza umana ordinaria, in particolare nei paesaggi selvaggi e remoti delle Highlands.<br><br><b>Curiosità:</b> Il dettaglio popolare specifico del \"suono che diminuisce man mano che il pericolo si avvicina\" è un'inversione genuinamente insolita e distintiva rispetto ai tipici schemi di avvertimento dell'avvicinarsi di un mostro presenti nella maggior parte delle altre tradizioni folkloristiche del mondo, rendendo la specifica logica della minaccia del Cù-sìth uno dei dettagli psicologicamente più inquietanti e narrativamente distintivi del più ampio bestiario folkloristico celtico.",
  "Dullahan": "Cavaliere senza testa del folklore irlandese, che porta il proprio capo sotto il braccio mentre cavalca di notte: il suo apparire davanti a una casa era considerato un presagio infallibile di morte imminente.<br><br><b>Il mito completo:</b> Il Dullahan cavalca tradizionalmente un cavallo nero (o talvolta guida una carrozza nera chiamata \"Coach-a-bower\", costruita con ossa umane e materiali funebri) e porta una frusta fatta di una spina dorsale umana; non può specificamente attraversare l'acqua corrente, offrendo una rara e affidabile forma di protezione simile alla vulnerabilità del Nuckelavee. La sua testa recisa, portata sotto il braccio, viene descritta con un volto simile a formaggio ammuffito, costantemente ghignante, con occhi minuscoli capaci di vedere per grandi distanze attraverso la campagna nell'oscurità — usando questa vista soprannaturale per localizzare la persona specifica destinata a morire, chiamandone il nome nel momento in cui si ferma davanti alla sua casa, al che la persona nominata muore immediatamente.<br><br><b>Contesto culturale:</b> Il Dullahan è ampiamente considerato dai folkloristi una figura evoluta o correlata all'antico dio irlandese Crom Dubh (o Crom Cruach), una divinità precristiana a cui si narra fosse un tempo offerto sacrificio umano — l'assenza di testa del Dullahan e il suo ruolo di portatore di morte potrebbero rappresentare una continuazione mnemonica popolare di questa più antica e cupa tradizione religiosa pagana irlandese, sopravvissuta in forma diminuita e demonizzata dopo la cristianizzazione.<br><br><b>Curiosità:</b> Il Dullahan ha ispirato direttamente la figura del \"Cavaliere Senza Testa\" reso celebre dal racconto americano di Washington Irving \"La leggenda di Sleepy Hollow\" (1820) — le tradizioni folkloristiche degli immigrati irlandesi e scozzesi, incluse le leggende di tipo Dullahan, sono ampiamente accreditate dagli storici della letteratura come un'influenza diretta significativa su questo ormai iconico pezzo della prima letteratura gotica americana.",
  "Humbaba Giovane": "Gigante mostruoso posto dagli dèi mesopotamici a guardia della sacra Foresta dei Cedri: nell'Epopea di Gilgamesh, l'eroe e il suo compagno Enkidu lo affrontarono e sconfissero, sfidando la volontà divina.<br><br><b>Il mito completo:</b> Humbaba (o Huwawa in sumerico) fu specificamente posto dal dio Enlil a guardia della sacra Foresta dei Cedri, e veniva descritto con un volto simile a intestini attorcigliati e un ruggito simile a un'alluvione, capace di respirare fuoco e un fiato pestilenziale letale a distanza; quando Gilgamesh ed Enkidu lo braccarono infine, Humbaba implorò disperatamente per la propria vita, offrendosi di diventare servitore di Gilgamesh, ma Enkidu — temendo l'ira degli dèi se il mostruoso guardiano fosse stato risparmiato invece che propriamente sconfitto — esortò Gilgamesh a ucciderlo comunque, un atto per cui i due eroi sarebbero poi stati esplicitamente puniti dagli dèi (questa sfida alla volontà divina scatena direttamente la successiva morte dello stesso Enkidu, uno dei punti di svolta tragici centrali dell'epopea).<br><br><b>Contesto culturale:</b> L'episodio di Humbaba rappresenta uno dei primi esempi superstiti nella letteratura mondiale di una struttura narrativa \"l'eroe sfida l'ordine divino e ne subisce le conseguenze\" — la storia di Gilgamesh precede e probabilmente influenzò numerose tradizioni mitologiche successive che affrontano temi simili di trasgressione eroica contro la volontà divina e il suo costo inevitabile.<br><br><b>Curiosità:</b> L'Epopea di Gilgamesh, che contiene questo episodio, è ampiamente considerata l'opera sostanzialmente completa più antica della letteratura mondiale attualmente conosciuta, con frammenti testuali risalenti a quasi 4000 anni fa — il che significa che lo scontro di Humbaba con Gilgamesh ed Enkidu è molto probabilmente la singola narrazione di \"battaglia contro un mostro\" più antica registrata nell'intera storia della narrazione umana.",
  "Bagiennik": "Demone delle paludi della tradizione slava polacca, trascina i viandanti incauti nel fango profondo: la sua presenza era usata per spiegare le tante sparizioni inspiegabili nelle terre acquitrinose.<br><br><b>Il mito completo:</b> Documentato specificamente nel folklore polacco (regionalmente distinto dalla più ampia tradizione slava orientale del Bolotnik, sebbene chiaramente imparentato nel concetto), il Bagiennik si riteneva colpisse specificamente i viandanti che ignoravano i segnali di pericolo di un terreno paludoso instabile — apparendo talvolta come una porzione di terreno apparentemente solido che improvvisamente cedeva sotto i piedi di un viandante incauto, o come una luce distante scambiata per un sentiero sicuro o un villaggio vicino, attirando le vittime progressivamente più in profondità in sabbie mobili o terreno paludoso genuinamente letali.<br><br><b>Contesto culturale:</b> La tradizione del Bagiennik riflette il pericolo storico genuino e ben documentato del terreno paludoso dell'Europa centrale e orientale prima che il drenaggio moderno e la gestione del territorio trasformassero gran parte del paesaggio della regione — molte vere scomparse storiche nelle regioni di confine paludose ricevettero probabilmente una spiegazione soprannaturale attraverso figure come il Bagiennik, piuttosto che essere attribuite a semplice annegamento accidentale o disavventura.<br><br><b>Curiosità:</b> I toponimi regionali polacchi in aree storicamente paludose talvolta conservano ancora oggi riferimenti folkloristici diretti al Bagiennik o a tradizioni simili di demoni delle paludi, riflettendo quanto profondamente questa specifica credenza popolare si sia radicata nella memoria geografica locale e nelle convenzioni di denominazione, ben oltre la pura tradizione orale narrativa.",
  "Bašmu": "Serpente cornuto e velenoso della mitologia mesopotamica, spesso raffigurato come creatura ibrida tra rettile e drago: comparirebbe in antichi testi come nemico primordiale sconfitto dagli dèi.<br><br><b>Il mito completo:</b> Bašmu compare in vari testi mesopotamici come uno dei diversi serpenti mostruosi primordiali associati alle forze di Tiamat durante la battaglia cosmica contro Marduk, e separatamente in testi di incantesimo e letteratura rituale come creatura genuinamente temuta e pericolosa la cui immagine veniva talvolta invocata apotropaicamente (usata protettivamente contro il male, similmente al Gorgoneion greco) nonostante la sua natura intrinsecamente mostruosa — uno schema comune nella pratica religiosa del Vicino Oriente antico in cui raffigurare una creatura temuta poteva paradossalmente servire scopi protettivi piuttosto che puramente minacciosi.<br><br><b>Contesto culturale:</b> Bašmu appartiene a una più ampia tradizione mitologica mesopotamica di ibridi serpente-drago come forze del caos primordiale che richiedevano sconfitta o contenimento da parte dell'autorità divina propriamente ordinata — riflettendo la profonda preoccupazione culturale della civiltà mesopotamica antica per la lotta continua per mantenere l'ordine cosmico e sociale contro forze caotiche costantemente minacciose, un tema riflesso nella religione, nel diritto e nell'ideologia della regalità mesopotamiche in senso più ampio.<br><br><b>Curiosità:</b> Gli assiriologi moderni (studiosi specializzati in testi e cultura mesopotamici antichi) continuano a dibattere attivamente l'identificazione precisa e i dettagli iconografici di creature come Bašmu attraverso diverse fonti cuneiformi e periodi — la mitologia mesopotamica antica, nonostante sopravviva attraverso sostanziali documenti cuneiformi scritti (a differenza della tradizione celtica in gran parte orale), presenta ancora genuini rompicapo accademici in corso a causa della pura estensione geografica e temporale (molteplici civiltà distinte, migliaia di anni) che il corpus superstite rappresenta davvero.",
  "Bolotnik": "\"Signore della palude\" nel folklore slavo, simile al Bagiennik ma ancora più antico e temuto: si diceva regnasse su ogni creatura che abitasse gli acquitrini, dalle rane ai serpenti.<br><br><b>Il mito completo:</b> Il Bolotnik si riteneva specificamente detenesse autorità su tutte le creature che abitavano gli ambienti paludosi — rane, serpenti e altri animali delle paludi erano considerati sotto il suo dominio diretto o persino suoi servitori o messaggeri trasformati, e comportamenti insoliti tra la fauna palustre locale (un coro improvviso di rane, avvistamenti insoliti di serpenti) venivano talvolta interpretati come segno dell'attività o dell'umore del Bolotnik. Si riteneva capace, come molti spiriti delle paludi slavi, di manipolare il terreno stesso per disorientare e mettere in pericolo i viandanti, rendendo traditore un terreno apparentemente solido o facendo sembrare che sentieri reali si spostassero e scomparissero.<br><br><b>Contesto culturale:</b> Il Bolotnik rappresenta uno degli strati più antichi della più ampia tradizione slava orientale dei demoni delle paludi (precedente e probabilmente influenzando varianti regionali come il Bagiennik), riflettendo come l'antico folklore sul pericolo delle paludi si sia adattato regionalmente attraverso l'ampia diffusione geografica dei popoli di lingua slava, mantenendo un nucleo concettuale condiviso di uno spirito malevolo signore delle paludi.<br><br><b>Curiosità:</b> La più ampia categoria degli spiriti slavi delle paludi (Bolotnik, Bagiennik e varianti regionali) è considerata dai folkloristi uno degli esempi più chiari di mitologia determinata dall'ambiente — la specifica geografia delle vaste regioni paludose dell'Europa orientale (in particolare le storicamente enormi Paludi di Pinsk, uno dei più grandi sistemi paludosi d'Europa) plasmò direttamente quali pericoli e tipi di spiriti specifici divennero prominenti nella credenza popolare locale.",
  "Camazotz": "Divinità pipistrello della mitologia Maya, signore della notte e della morte sacrificale: nel Popol Vuh mette alla prova gli Eroi Gemelli in una delle sfide più pericolose della loro discesa nel Xibalbá, il regno sotterraneo.<br><br><b>Il mito completo:</b> Durante la loro discesa nel Xibalbá, gli Eroi Gemelli Hunahpú e Ixbalanqué furono rinchiusi per una notte nella \"Casa dei Pipistrelli\", una delle prove mortali imposte dai signori dell'oltretomba, piena di creature simili a Camazotz pronte a divorare chiunque vi entrasse. I gemelli si nascosero al sicuro dentro le proprie cerbottane per proteggersi durante la notte, ma Hunahpú, incuriosito, sporse la testa per vedere se l'alba fosse arrivata — Camazotz gli staccò istantaneamente la testa di netto. I suoi compagni animali riuscirono infine a recuperarla e a farla riattaccare magicamente, permettendo a Hunahpú di continuare la propria impresa contro i signori di Xibalbá.<br><br><b>Contesto culturale:</b> Camazotz rifletteva il genuino significato religioso dei pipistrelli nella cultura maya, associati alle grotte, al mondo sotterraneo e ai sacrifici notturni — le grotte reali dello Yucatán, abitate da vere colonie di pipistrelli, servivano come luoghi di culto e rituale, rendendo la mitologia di Camazotz direttamente radicata in una geografia sacra realmente visitata e venerata.<br><br><b>Curiosità:</b> Il glifo maya per \"Camazotz\" è stato identificato dagli archeologi su ceramiche e sculture provenienti da diverse città maya, incluso il sito di Copán, suggerendo che questa specifica divinità pipistrello fosse venerata in modo relativamente diffuso attraverso il mondo maya, non confinata a una singola regione o città-stato.",
  "Kelpie": "Spirito acquatico del folklore scozzese che vive nei laghi e nei fiumi, spesso sotto forma di cavallo. Attira i viandanti a salire sul suo dorso: chi lo fa non riesce più a scendere e viene trascinato nelle profondità.<br><br><b>Il mito completo:</b> La qualità adesiva soprannaturale del kelpie — una volta che una vittima toccava o montava la forma equina, le mani restavano permanentemente incollate alla sua pelle, incapaci di liberarsi mentre la creatura si tuffava in acqua profonda per annegarla — lo rendeva una delle creature predatrici più subdolamente efficaci del folklore scozzese, senza richiedere alcuna forza attiva o inganno oltre al semplice contatto fisico. Alcuni racconti regionali descrivono un metodo efficace per controllare un kelpie catturato: rimuovergli la briglia magica ne avrebbe eliminato del tutto i poteri soprannaturali, costringendolo in una forma equina permanente e priva di poteri, rendendolo innocuo (e persino utile come insolitamente forte cavallo da lavoro ordinario) finché la briglia restava confiscata.<br><br><b>Contesto culturale:</b> La tradizione del kelpie riflette una genuina e ben documentata ansia popolare scozzese sui reali pericoli dei laghi e dei fiumi delle Highlands, in particolare per bambini e bestiame — i genitori usavano specificamente i racconti sui kelpie come racconti ammonitori pratici per tenere i bambini lontani dai bordi pericolosi dell'acqua, un meccanismo di sicurezza folkloristico comune a molte tradizioni di spiriti acquatici in tutto il mondo.<br><br><b>Curiosità:</b> Il kelpie ha ispirato direttamente il design delle celebri sculture \"Kelpies\" vicino a Falkirk, in Scozia — due enormi sculture di teste di cavallo in acciaio inossidabile alte 30 metri completate nel 2013, oggi tra le opere d'arte pubblica moderna più visitate e fotografate della Scozia, dimostrando la continua risonanza culturale della creatura folkloristica nell'identità civica e nel turismo scozzesi genuinamente contemporanei.",
  "Kulullû": "Uomo-pesce guardiano delle acque nella tradizione mesopotamica, spesso raffigurato a protezione di palazzi e templi: simbolo dell'equilibrio tra il mondo umano e le profondità acquatiche.<br><br><b>Il mito completo:</b> Il kulullû (talvolta reso \"kulili\" o termini correlati in diverse traslitterazioni) compare frequentemente nell'iconografia mesopotamica ai lati degli ingressi di templi e palazzi insieme ad altre figure ibride guardiane protettive, ritenuto incarnare il potere benefico e datore di vita dell'acqua dolce (in particolare associato a Enki/Ea, dio della saggezza e dell'abisso di acqua dolce/Abzu) incanalato in un ruolo specificamente protettivo e di custode della soglia — a differenza dei mostri d'acqua più puramente minacciosi, il kulullû rappresentava il potenziale civilizzatore e nutritivo dell'acqua quando adeguatamente incanalato sotto l'ordine divino.<br><br><b>Contesto culturale:</b> Il kulullû riflette la profonda dipendenza culturale e venerazione della Mesopotamia antica per i fiumi d'acqua dolce e l'irrigazione (l'intera fondazione agricola della civiltà dipendeva dai fiumi Tigri ed Eufrate) — mitizzando il potere benefico dell'acqua come figura guardiana protettiva piuttosto che solo come forza pericolosa, in netto contrasto con alcune altre tradizioni di mostri acquatici trattate altrove in questa collezione.<br><br><b>Curiosità:</b> La forma ibrida uomo-pesce del kulullû presenta una sorprendente somiglianza visiva con tradizioni successive e geograficamente distanti di tritoni in culture completamente diverse (Tritoni greci, Vodyanoy slavi e altri trattati nelle schede precedenti) — sebbene queste tradizioni si siano sviluppate indipendentemente piuttosto che attraverso influenza storica diretta, lo schema ricorrente dell'immaginazione umana di un \"essere protettivo o potente per metà umano e per metà pesce\" che compare in civiltà senza contatto diretto suggerisce un modo ampiamente condiviso, forse psicologicamente universale, di concepire il rapporto dell'umanità con l'acqua e i suoi misteri.",
  "Lahmu": "Essere primordiale peloso della mitologia mesopotamica, associato alle acque dolci dell'Abzu: nonostante l'aspetto selvaggio, era considerato una figura protettiva, spesso raffigurata a guardia degli ingressi dei templi.<br><br><b>Il mito completo:</b> Secondo l'Enuma Elish, Lahmu (insieme alla sua consorte/controparte Lahamu) fu tra la primissima generazione di dèi nati direttamente dall'unione primordiale di Apsu (acqua dolce) e Tiamat (acqua salata) — rendendolo una delle divinità più antiche dell'intera genealogia cosmologica mesopotamica, esistente ancor prima dei più famosi dèi successivi come Enlil, Marduk o Ishtar. Nonostante questa origine primordiale, quasi pre-civilizzata, l'iconografia di Lahmu (tipicamente mostrato come una figura barbuta dai capelli ricci, spesso con sei riccioli disposti simbolicamente, talvolta mentre lotta o trattiene animali selvatici) enfatizza costantemente il suo ruolo protettivo e mantenitore dell'ordine a guardia di soglie sacre — una trasformazione sorprendente da origine caotica cosmica a dovere protettivo civilizzato.<br><br><b>Contesto culturale:</b> L'evoluzione di Lahmu da essere caotico primordiale a fidato guardiano del tempio riflette uno schema teologico mesopotamico antico più ampio secondo cui persino le forze cosmiche più antiche e fondamentalmente \"selvagge\" vengono infine incorporate e messe al servizio della civiltà propriamente ordinata e della struttura religiosa stabilita dalla generazione successiva e regnante di dèi.<br><br><b>Curiosità:</b> Lahmu viene specificamente menzionato in alcune interpretazioni come possibile influenza lontana sulle successive immagini bibliche e del Vicino Oriente di figure guardiane ibride protettive (come i cherubini descritti a guardia dell'ingresso dell'Eden nella Genesi) — sebbene l'influenza testuale diretta resti dibattuta tra gli studiosi, la più ampia tradizione visiva e concettuale del Vicino Oriente antico di potenti esseri ibridi guardiani che proteggono confini sacri probabilmente alimentò molteplici tradizioni religiose successive in tutta la regione.",
  "Vucub-Caquix": "Demone-uccello della mitologia Maya, tanto arrogante da proclamarsi sole e luna in persona: la sua storia è narrata nel Popol Vuh, il testo sacro che racconta le origini del mondo, ma solo l'astuzia degli Eroi Gemelli riuscì infine a smascherarlo e sconfiggerlo.<br><br><b>Il mito completo:</b> Vucub-Caquix, adornato di occhi splendenti come pietre preziose e denti di metallo brillante, si vantava falsamente di essere il vero sole e la vera luna in un'epoca oscura precedente alla creazione dell'umanità attuale. Gli Eroi Gemelli, riconoscendo la sua tracotanza come una minaccia all'ordine cosmico corretto, lo colpirono con una cerbottana mentre banchettava su un albero di nance, ferendogli la mascella; travestitisi poi da guaritori, si offrirono di curargli il dolore ai denti e agli occhi, ma in realtà gli sostituirono i denti di metallo con semplici chicchi di mais e gli tolsero gli occhi scintillanti, privandolo di ogni potere e falsa gloria, fino a farlo morire disonorato.<br><br><b>Contesto culturale:</b> La sconfitta di Vucub-Caquix rappresenta narrativamente la fine di un'epoca cosmica sbagliata e la preparazione per la creazione corretta del mondo e dell'umanità che segue nel Popol Vuh — la sua falsa pretesa di essere sole e luna doveva essere smascherata prima che i veri corpi celesti potessero assumere il loro posto legittimo nel cielo.<br><br><b>Curiosità:</b> Gli archeologi hanno identificato raffigurazioni di Vucub-Caquix ancora appollaiato sul proprio albero su ceramiche maya del periodo classico risalenti a oltre mille anni prima della trascrizione scritta del Popol Vuh nel XVI secolo, dimostrando che questo specifico mito era già pienamente sviluppato e diffuso visivamente nell'arte maya molti secoli prima di essere messo per iscritto.",
  "Rusalka": "Spirito femminile slavo delle acque, anima di una donna morta annegata: nelle notti di luna piena emerge dai fiumi per danzare sulle rive, attirando con il suo canto i viandanti verso le profondità.<br><br><b>Il mito completo:</b> Il folklore sulla rusalka variava significativamente per regione e stagione — nella tradizione russa settentrionale, veniva spesso ritratta come più chiaramente pericolosa e vendicativa, che attirava gli uomini ad annegare per rappresaglia della propria morte; nella tradizione ucraina e meridionale, veniva talvolta ritratta in modo più ambiguo, persino con empatia, in particolare durante la \"Settimana della Rusalka\" (un periodo specifico di inizio estate nel calendario popolare in cui si riteneva che le rusalki lasciassero l'acqua per vagare liberamente tra campi e boschi, quando certi lavori agricoli venivano tradizionalmente evitati e si eseguivano specifici rituali popolari protettivi). Alcune tradizioni sostenevano specificamente che l'origine tragica di una rusalka (spesso vittime di suicidio per annegamento, in particolare giovani donne morte per amore non corrisposto o assassinate) significasse che conservasse una genuina emozione e memoria umana, capace sia di malizia verso gli uomini in generale sia, in racconti più rari, di tenerezza specifica verso qualcuno che le ricordasse un amore perduto.<br><br><b>Contesto culturale:</b> La tradizione della rusalka riflette profonde ansie popolari slave riguardo alle morti di giovani donne non sposate e alla sepoltura impropria — come il draugr e altre tradizioni di \"morti irrequieti\" in molte culture, l'esistenza liminale e pericolosa di una rusalka derivava direttamente da una vita e una morte umane irrisolte e concluse in modo improprio.<br><br><b>Curiosità:</b> La rusalka è diventata una delle esportazioni culturali internazionali di maggior successo del folklore slavo attraverso la musica classica e il balletto — immortalata più celebremente nell'opera \"Rusalka\" (1901) di Antonín Dvořák, la cui aria \"Canto alla Luna\" resta uno dei brani operistici più amati ed eseguiti, garantendo alla rusalka una fama continua nella cultura musicale classica occidentale ben oltre il suo originario contesto folkloristico slavo.",
  "Vodyanoy": "Signore slavo delle acque dolci, spesso raffigurato come un vecchio con la barba d'alghe: benevolo con i pescatori che lo rispettano, poteva scatenare la sua ira contro chi disturbava la quiete dei suoi laghi.<br><br><b>Il mito completo:</b> Il vodyanoy si credeva tradizionalmente tenesse le anime umane annegate come propri servitori o schiavi all'interno del suo regno sottomarino, e i pescatori facevano talvolta piccole offerte (tabacco, pane, o occasionalmente un piccolo sacrificio animale) prima di pescare o nuotare per assicurarsi la sua benevolenza, in particolare prima di intraprendere attraversamenti d'acqua particolarmente pericolosi. Si diceva capace di controllare direttamente le popolazioni ittiche locali — irritarlo poteva significare una cattura scarsa o reti da pesca misteriosamente strappate e svuotate, mentre il dovuto rispetto e le offerte potevano garantire una fortuna costante.<br><br><b>Contesto culturale:</b> La tradizione del vodyanoy riflette ansie pratiche genuine delle comunità slave di pescatori dipendenti da fiumi e laghi riguardo alla sicurezza in acqua e al successo della pesca — mitizzata come una relazione personale e negoziabile che richiedeva una manutenzione rituale continua, piuttosto che semplicemente un rischio naturale impersonale o popolazioni ittiche imprevedibili.<br><br><b>Curiosità:</b> Il vodyanoy condivide una chiara parentela concettuale con numerose altre tradizioni slave e più ampiamente europee di spiriti delle acque (paragonabile al nix/nixie germanico, o persino lontanamente al ruolo più grandiosamente divino di Poseidone/Nettuno nella tradizione mediterranea) — ma la relazione specificamente negoziata e transazionale del vodyanoy con i comuni pescatori lavoratori (piuttosto che un ruolo puramente cosmico di dio del mare) riflette una tradizione religiosa popolare più intima e localmente scalata, legata alla sopravvivenza economica quotidiana piuttosto che a una grande narrazione mitologica.",
  "Yum Caax": "Giovane dio Maya del mais, dei raccolti e della vegetazione selvatica: la sua eterna giovinezza rappresentava il ciclo delle stagioni e la costante rinascita della natura dopo ogni stagione secca.<br><br><b>Il mito completo:</b> Yum Caax (il cui nome significa letteralmente \"Signore dei Campi\" o \"Signore della Foresta\") veniva raffigurato tradizionalmente come un giovane uomo con la testa adornata da una pannocchia di mais germogliante, incarnando il ciclo agricolo stesso: la sua \"morte\" simbolica durante la stagione secca e la sua rinascita con le prime piogge rispecchiavano direttamente il ciclo di semina e raccolto del mais, alimento fondamentale su cui si basava l'intera civiltà maya.<br><br><b>Contesto culturale:</b> Il mais non era semplicemente un alimento per i maya, ma il materiale sacro da cui, secondo il Popol Vuh, gli dèi crearono infine l'umanità corretta e permanente, dopo diversi tentativi falliti con altri materiali (fango, legno) — questo rende Yum Caax e il ciclo del mais direttamente collegati al concetto stesso di origine umana nella cosmologia maya, non solo a una divinità agricola secondaria.<br><br><b>Curiosità:</b> La rappresentazione di Yum Caax come eternamente giovane, mai invecchiato nonostante il ciclo perpetuo di morte e rinascita, lo distingue da molte altre divinità agricole mondiali (spesso raffigurate come figure materne o paterne mature) — un dettaglio iconografico che alcuni studiosi collegano al ciclo di crescita relativamente rapido del mais stesso rispetto ad altri raccolti, maturando in pochi mesi anziché in anni.",

  "Alkonost": "Insieme al Sirin e al Gamayun, l'Alkonost è uno degli uccelli-donna del paradiso nella tradizione slava: vive lungo un fiume mitico e il suo canto, meraviglioso ma pericoloso, fa dimenticare ogni pena a chi lo ascolta, rischiando di farlo restare incantato per sempre.<br><br><b>Il mito completo:</b> L'Alkonost viene tradizionalmente accoppiato nel folklore e nell'iconografia russa alla sua controparte Sirin, un'altra donna-uccello — le due sono frequentemente raffigurate insieme nei tradizionali lubok (stampe popolari russe su legno) come opposti complementari: il canto dell'Alkonost porta gioia e oblio di ogni dolore terreno (pur rischiando pericolosamente un incantamento permanente se ascoltato troppo a lungo), mentre il canto di Sirin, seppur similmente bello, porta profonda malinconia e può condurre l'ascoltatore verso la morte o la follia. Secondo alcune tradizioni popolari, l'Alkonost depone le proprie uova direttamente sulle spiagge oceaniche e, per esattamente sette giorni necessari alla loro schiusa, calma il mare stesso in una quiete perfetta.<br><br><b>Contesto culturale:</b> L'accoppiamento Alkonost/Sirin deriva probabilmente lontanamente dall'antica figura mitologica greca di Alcione (trasformata in un martin pescatore, legata al genuino mito greco dei \"giorni alcionici\" sui mari invernali placati) filtrata e trasformata attraverso secoli di trasmissione religiosa e artistico-popolare bizantina nell'iconografia religiosa e popolare russa medievale e della prima età moderna, illustrando una lunga catena di trasmissione culturale dal mito mediterraneo classico fino a una forma folkloristica distintamente russa.<br><br><b>Curiosità:</b> Alkonost e Sirin restano soggetti popolari nell'arte decorativa e figurativa russa ancora oggi — compaiono in modo prominente nell'opera di importanti artisti russi come Viktor Vasnecov (il cui dipinto del 1896 \"Sirin e Alkonost: Gli Uccelli della Gioia e del Dolore\" resta una delle immagini iconiche dell'arte russa) — il che significa che queste donne-uccello originariamente folkloristiche hanno raggiunto una specifica e celebrata vita successiva nella tradizione artistica formale russa, non solo nell'illustrazione popolare.",
  "Edimmu": "Nella tradizione mesopotamica, l'Edimmu è lo spirito inquieto di chi è morto senza una sepoltura adeguata o di morte violenta: condannato a vagare senza pace, tormenta i vivi finché i suoi resti non vengono finalmente onorati.<br><br><b>Il mito completo:</b> La tradizione dell'edimmu rifletteva una delle ansie religiose più profondamente radicate della Mesopotamia antica: una sepoltura adeguata e offerte rituali continue (specificamente libagioni regolari di acqua e cibo fornite dai discendenti viventi) erano considerate assolutamente essenziali affinché lo spirito di un defunto trovasse riposo nell'oltretomba (Kur o Irkalla); il fallimento di questi riti — che fosse per sepoltura impropria, morte lontano da casa senza cerimonia adeguata, o semplicemente l'estinzione di una linea familiare senza discendenti rimasti a compiere offerte continue — condannava lo spirito a diventare un genuinamente pericoloso edimmu, tormentando attivamente i vivi, causando malattia, incubi o sventura finché la mancanza non veniva in qualche modo corretta.<br><br><b>Contesto culturale:</b> Questo sistema di credenze attribuiva un'enorme importanza religiosa pratica al mantenimento delle discendenze familiari e alla corretta esecuzione di rituali continui di venerazione degli antenati — l'edimmu rappresentava non semplicemente folklore soprannaturale ma un obbligo religioso e sociale genuino e attivamente gestito, con testi rituali e magici specifici (incantesimi, rituali apotropaici) sviluppati appositamente per identificare, placare o bandire edimmu problematici quando si riteneva stessero affliggendo una casa.<br><br><b>Curiosità:</b> Il concetto di edimmu è ampiamente considerato dagli studiosi di religione del Vicino Oriente antico una delle più antiche tradizioni documentate di \"spirito non-morto irrequieto\" nella mitologia mondiale, precedente e potenzialmente influente (almeno concettualmente, se non attraverso trasmissione storica diretta) su numerose tradizioni folkloristiche successive di \"morti inquieti\" presenti in molte culture successive in tutto il mondo, incluse alcune figure di tipo draugr e rusalka trattate altrove in questa stessa collezione.",
  "Gallu": "Demone mesopotamico del regno dei morti, al servizio della dea Ereshkigal: fu uno dei sette Gallu a trascinare negli inferi il pastore-dio Dumuzi, in una delle storie più antiche mai scritte sulla morte e il suo prezzo.<br><br><b>Il mito completo:</b> Il mito specifico richiamato (la morte di Dumuzi) proviene dalla \"Discesa di Inanna\" — uno dei miti mesopotamici antichi più significativi e completi sopravvissuti — in cui la dea Inanna (Ishtar in accadico) si reca nell'oltretomba per sfidare il dominio della sorella Ereshkigal, viene uccisa e appesa a un gancio dalla sorella, per poi essere infine rianimata grazie all'intervento di altri dèi, ma è costretta dalla legge dell'oltretomba a fornire un sostituto che prenda il suo posto nella morte; quando scopre che il marito Dumuzi non ha adeguatamente pianto la sua apparente morte, lo designa con rabbia come proprio sostituto, e i demoni Gallu (specificamente inviati da Ereshkigal per far rispettare la legge dell'oltretomba) lo trascinano giù nell'oltretomba nonostante i suoi disperati tentativi di fuga e nascondimento, aiutati senza successo dai tentativi della sorella Geshtinanna di proteggerlo.<br><br><b>Contesto culturale:</b> Questo mito stabilì una spiegazione religiosa mesopotamica fondativa per i cicli agricoli stagionali — la morte di Dumuzi e il successivo accordo (nelle versioni più tarde) di dividere il tempo tra l'oltretomba e il mondo dei vivi con la sorella Geshtinanna anticipa direttamente e probabilmente influenzò il successivo e più celebre mito greco della discesa stagionale di Persefone nell'oltretomba, rappresentando uno dei più antichi miti conosciuti del Vicino Oriente antico sul \"dio morente\" legato alla fertilità.<br><br><b>Curiosità:</b> La \"Discesa di Inanna\", che contiene questo episodio dei Gallu, è conservata su tavolette cuneiformi risalenti a oltre 4000 anni fa, rendendola una delle narrazioni mitologiche sostanzialmente complete più antiche della storia umana — il che significa che i demoni Gallu rappresentano tra le primissime figure registrate di \"servitori della morte\" nell'intera documentazione scritta della narrazione umana, precedendo persino lo scontro di Humbaba con Gilgamesh potenzialmente di diversi secoli a seconda della datazione esatta delle versioni testuali superstiti.",
  "Gandharva": "Musicisti celesti della tradizione vedica indiana, i Gandharva abitano i cieli e sono sposi delle ninfe Apsara: la loro musica è così perfetta da essere considerata sacra, e custodiscono il Soma, la bevanda degli dèi.<br><br><b>Il mito completo:</b> I Gandharva vengono tradizionalmente accreditati nella mitologia indù e nella teoria musicale classica indiana come i diretti originatori e maestri divini del \"Gandharva Veda\", la scienza e arte sacra tradizionale della musica stessa — considerato uno dei quattro upaveda tradizionali (rami ausiliari/applicati della conoscenza vedica), il che significa che la stessa tradizione musicale classica indiana rivendica una discendenza mitologica diretta che risale a questi esseri musicisti celesti come propria fonte e ispirazione divina originaria, non semplicemente come figure mitologiche decorative ma come i letterali originatori fondativi di un'intera sofisticata tradizione artistica e teorica ancora attivamente praticata oggi.<br><br><b>Contesto culturale:</b> Il concetto di \"matrimonio Gandharva\" — un matrimonio basato puramente sull'amore e sul consenso reciproco tra due individui senza cerimonia formale o accordo dei genitori, chiamato così dalle stesse unioni romantiche mitologiche dei Gandharva con le Apsara — divenne riconosciuto nella tradizione legale e sociale indù antica e classica (citato nel Manusmriti e in altri testi legali tradizionali) come uno dei diversi tipi formalmente riconosciuti di matrimonio legittimo, riflettendo come questo concetto mitologico abbia influenzato direttamente la genuina comprensione sociale e legale storica indiana di matrimonio e consenso.<br><br><b>Curiosità:</b> Il ruolo di guardiani del Soma dei Gandharva (la sostanza rituale divina inebriante/visionaria centrale nell'antica pratica religiosa vedica, la cui esatta identità botanica nel mondo reale resta genuinamente dibattuta e irrisolta tra gli studiosi moderni) collega questa figura mitologica direttamente a uno dei più storicamente significativi e scientificamente misteriosi enigmi irrisolti della religione vedica antica — il che significa che la mitologia dei Gandharva si interseca con una genuina e continua controversia accademica sulla pratica religiosa antica, invece di esistere puramente in un territorio mitologico consolidato e incontestato.",
  "Ghoul": "Creatura del folklore arabo preislamico, il Ghoul abita cimiteri e deserti solitari, capace di mutare aspetto per ingannare i viandanti: la sua fama di divoratore di cadaveri lo rese celebre in tutto il mondo grazie alle Mille e una Notte.<br><br><b>Il mito completo:</b> Nel folklore arabo preislamico, i ghul erano considerati una sottospecie di jinn femminile, capace di assumere qualunque forma, ma con una preferenza particolare per apparire come una donna bellissima per attirare i viandanti solitari nel deserto, spesso lungo strade isolate o presso i cimiteri, prima di rivelare la propria vera natura e divorarli; un dettaglio ricorrente in molte versioni del mito sosteneva che i piedi del ghul restassero sempre visibilmente simili a zoccoli d'asino, un segno rivelatore che un viaggiatore attento poteva notare per riconoscere l'inganno prima che fosse troppo tardi.<br><br><b>Contesto culturale:</b> Le storie sui ghul servivano un genuino scopo pratico nella cultura beduina preislamica: mettevano in guardia i viandanti dai reali pericoli del viaggio nel deserto in solitaria, in particolare di notte o lungo percorsi isolati vicino ai cimiteri, incoraggiando la cautela e la compagnia altrui attraverso il timore soprannaturale piuttosto che il solo avvertimento pratico.<br><br><b>Curiosità:</b> La parola inglese \"ghoul\" (e l'italiano \"ghoul\", ormai entrato nel linguaggio horror internazionale) deriva direttamente da questa figura del folklore arabo, resa celebre in Occidente soprattutto attraverso le traduzioni europee delle Mille e una Notte nel XVIII secolo — uno dei pochissimi termini mostruosi dell'intero linguaggio horror moderno globale con un'origine linguistica araba diretta e documentata, anziché greco-latina o germanica.",
  "Rarog": "Spirito del fuoco della tradizione slava, il Rarog appare spesso come un falco fiammeggiante o un vortice incandescente: custode del focolare domestico, si narra portasse fortuna alla famiglia che lo ospitava con rispetto.<br><br><b>Il mito completo:</b> Alcuni studiosi ritengono che Rarog derivi da, o sia strettamente legato a, la divinità slava storica Svarozič (un dio del fuoco associato al dio-fabbro Svarog), una delle relativamente poche divinità slave precristiane direttamente attestate in fonti cronachistiche medievali (a differenza di gran parte della mitologia slava ricostruita, che sopravvive principalmente attraverso il folklore successivo piuttosto che documentazione scritta contemporanea dell'epoca pagana) — il ruolo di Rarog come guardiano del fuoco domestico potrebbe rappresentare una continuazione mnemonica popolare di questa più antica e formalmente venerata divinità del fuoco dopo che la cristianizzazione soppresse la pratica religiosa pagana organizzata ma permise alle usanze popolari domestiche correlate di persistere in forma diminuita e addomesticata.<br><br><b>Contesto culturale:</b> Il legame di Rarog (diretto o coincidentale che sia) con uno dei pochi dèi slavi precristiani documentati testualmente lo rende una figura particolarmente preziosa per gli studiosi che tentano di ricostruire la genuina pratica religiosa slava precristiana, dato che la maggior parte della mitologia slava sopravvive solo attraverso il folklore molto più tardo, già cristianizzato, piuttosto che fonti scritte contemporanee dell'epoca pagana.<br><br><b>Curiosità:</b> La città di Rerik (un insediamento commerciale slavo altomedievale storicamente significativo nell'attuale Germania settentrionale) è stata talvolta collegata etimologicamente da alcuni storici al nome di Rarog, e alcuni studiosi hanno persino ipotizzato un legame con la dinastia Rjurikide che fondò lo stato medievale della Rus' di Kiev — sebbene questo particolare collegamento etimologico resti genuinamente dibattuto e non dimostrato tra i linguisti storici, un filo interessante ma non confermato che collega il folklore alla storia politica medievale reale.",
  "Sirrush": "Drago-serpente sacro al dio Marduk, il Sirrush (o Mušḫuššu) era raffigurato sulle celebri porte di Ishtar a Babilonia: simbolo di potere regale, univa squame di serpente, zampe di leone e artigli d'aquila.<br><br><b>Il mito completo:</b> Il Sirrush (propriamente Mušḫuššu in accadico, che significa \"serpente rossastro\" o \"serpente feroce\") compare in modo prominente tra gli animali in rilievo di mattoni smaltati che decorano la monumentale Porta di Ishtar dell'antica Babilonia (costruita sotto il re Nabucodonosor II intorno al 575 a.C.), alternandosi in file con immagini di tori (sacri al dio della tempesta Adad) e leoni (sacri alla stessa Ishtar) — il Mušḫuššu serviva specificamente come animale sacro e simbolo di Marduk, e più tardi, dopo l'evoluzione religiosa e politica di Babilonia, fu anche associato al dio Nabu, figlio di Marduk.<br><br><b>Contesto culturale:</b> La stessa Porta di Ishtar, su cui il Sirrush è più celebremente raffigurato, era considerata una delle strutture più magnifiche del mondo antico, la sua vivida muratura smaltata di blu e la dettagliata decorazione a rilievo animale servivano come potente propaganda visiva che celebrava la potenza religiosa e imperiale babilonese — l'inclusione del Sirrush lo segnava specificamente come sotto la diretta protezione e il patrocinio divino di Marduk, rafforzando la legittimità religioso-politica della città.<br><br><b>Curiosità:</b> Una sostanziale porzione ricostruita della Porta di Ishtar originale (assemblata da mattoni originali scavati) è oggi permanentemente esposta al Museo di Pergamo di Berlino — il che significa che i visitatori moderni possono vedere di persona genuine e fisiche raffigurazioni babilonesi antiche del Sirrush ancora oggi, uno dei relativamente pochi casi in tutta questa collezione di carte in cui la rappresentazione artistica antica originale di una creatura mitologica sopravvive e resta visibile pubblicamente, invece di esistere solo attraverso descrizione testuale o reinterpretazione artistica successiva.",
  "Ahuizotl": "Creatura acquatica della mitologia azteca al servizio del dio della pioggia Tlaloc, dotata di una mano all'estremità della coda: trascinava i malcapitati sul fondo dei laghi, per poi restituirne il corpo privo di occhi, denti e unghie.<br><br><b>Il mito completo:</b> L'Ahuizotl (il cui nome significa approssimativamente \"spinoso d'acqua\") viveva nei laghi e nei fiumi, e si diceva emettesse un pianto simile a quello di un bambino per attirare i malcapitati vicino alla riva, prima di afferrarli con la mano artigliata all'estremità della propria coda e trascinarli sott'acqua. Il corpo della vittima riemergeva giorni dopo, mutilato in modo specifico e rituale — privato di occhi, denti e unghie, le parti del corpo ritenute più preziose per gli dèi dell'acqua — un dettaglio che gli aztechi interpretavano come segno che il defunto era stato scelto per servire Tlaloc nel suo paradiso acquatico, il Tlalocan, piuttosto che come punizione o semplice sventura.<br><br><b>Contesto culturale:</b> A differenza di molti mostri acquatici mondiali associati puramente al pericolo, l'Ahuizotl aveva un ruolo religioso ambivalente: le sue vittime non erano considerate semplicemente perdute, ma specificamente scelte per un aldilà privilegiato legato all'acqua e alla fertilità, riflettendo la visione azteca della morte come trasformazione verso destinazioni specifiche piuttosto che una fine indifferenziata.<br><br><b>Curiosità:</b> Il nome Ahuizotl fu portato anche da un vero imperatore azteco (Ahuitzotl, 1486-1502 circa), predecessore di Montezuma II, che espanse notevolmente l'impero azteco attraverso la conquista militare — un esempio di come un nome mitologico legato al potere e al pericolo acquatico venisse scelto anche come nome regale per un sovrano storico realmente esistito.",
  "Bunyip": "Creatura delle paludi e dei corsi d'acqua nella mitologia aborigena australiana, dall'aspetto variabile a seconda delle tradizioni locali: il suo verso, udito di notte vicino all'acqua, era considerato un presagio da non ignorare.<br><br><b>Il mito completo:</b> A differenza di molte creature mitologiche con un aspetto fisso e riconoscibile, il Bunyip veniva descritto in modo straordinariamente diverso a seconda della specifica nazione aborigena e della regione geografica — alcune tradizioni lo descrivevano simile a un grande cane con pinne, altre come un essere dal collo lungo simile a un cigno gigante, altre ancora con zanne e artigli — una variabilità che riflette come il termine \"Bunyip\" fosse probabilmente usato genericamente da molteplici popoli aborigeni distinti, ciascuno con la propria tradizione locale specifica per descrivere pericoli acquatici propri, piuttosto che rappresentare un'unica creatura uniformemente concepita in tutto il continente.<br><br><b>Contesto culturale:</b> I racconti sul Bunyip servivano un genuino scopo pratico di sicurezza per numerose comunità aborigene: tenere bambini e adulti lontani da specifiche pozze d'acqua, paludi e corsi d'acqua genuinamente pericolosi (per correnti, animali reali come coccodrilli, o terreno instabile), incorporando avvertimenti geografici locali specifici in narrazioni tramandate oralmente attraverso le generazioni.<br><br><b>Curiosità:</b> Il Bunyip divenne una delle prime creature del folklore aborigeno ad attirare l'attenzione dei coloni europei nell'Ottocento, con numerosi resoconti giornalistici dell'epoca coloniale che riportavano presunti avvistamenti o addirittura il ritrovamento di ossa \"di Bunyip\" (in realtà quasi sempre resti di animali reali come foche, canguri o bovini malformati) — rendendolo uno dei rari casi in cui una creatura folkloristica indigena divenne oggetto di un vero e proprio interesse pseudo-scientifico coloniale documentato nella stampa dell'epoca.",

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

  "Apopi Giovane": "Apopi (Apophis) è il grande serpente del caos della mitologia egizia, nemico eterno del dio-sole Ra: ogni notte tenta di inghiottire la barca solare durante il suo viaggio negli inferi, e ogni notte viene respinto affinché il sole possa sorgere di nuovo all'alba.<br><br><b>Il mito completo:</b> Alcuni testi religiosi egizi immaginavano Apopi non come un nemico esterno con un'origine propria, ma come una forza esistita ancor prima della creazione stessa, generata dall'ombra proiettata da Ra al momento del proprio autoconcepimento — rendendolo letteralmente coevo o addirittura antecedente al sole che combatte eternamente, una minaccia tanto antica quanto l'ordine cosmico che cerca di distruggere. Nella sua forma \"giovane\", meno sviluppata rispetto al colossale serpente che minaccia la barca solare nella sua piena potenza, Apopi rappresenta il caos primordiale ancora in crescita, non ancora al culmine della propria capacità distruttiva.<br><br><b>Contesto culturale:</b> Questa concezione di Apopi come forza coeva alla creazione stessa, piuttosto che semplice nemico generato successivamente, riflette una sofisticata teologia egizia in cui l'ordine (maat) non ha mai sconfitto definitivamente il caos (isfet), ma lo contiene e lo respinge in un equilibrio perpetuo e mai risolto fin dall'inizio dei tempi.<br><br><b>Curiosità:</b> Diversamente da quasi ogni altro grande antagonista mitologico mondiale, che tipicamente possiede un'origine narrativa chiara (nato da un genitore, creato da un dio, trasformato da una punizione), l'origine di Apopi resta deliberatamente ambigua e contraddittoria tra le diverse fonti egizie superstiti — un'ambiguità che alcuni egittologi ritengono intenzionale, dato che un caos veramente primordiale non dovrebbe avere un'origine ordinata e spiegabile.",
  "Bixi": "Una delle nove leggendarie progenie del Drago nella tradizione cinese, il Bixi ha corpo di tartaruga e testa di drago: simbolo di forza e longevità, la sua immagine sorregge da secoli le grandi stele di pietra incise nei templi e nei monumenti imperiali.<br><br><b>Il mito completo:</b> Secondo la tradizione, il Bixi amava particolarmente portare pesi enormi, e proprio per questa sua natura gli imperatori cinesi iniziarono a farne scolpire l'immagine alla base delle stele commemorative più importanti — monumenti in pietra spesso alti diversi metri, incisi con editti imperiali, epitaffi o resoconti di eventi storici significativi — affidando simbolicamente al Bixi il compito di sorreggere per l'eternità il peso della memoria storica e della parola imperiale.<br><br><b>Contesto culturale:</b> Come una delle nove progenie del Drago (ciascuna con una personalità e un ruolo distinti nella tradizione cinese, un concetto simile per struttura ai nove figli distinti di altre tradizioni draconiche mondiali), il Bixi riflette il modo in cui la cultura cinese imperiale usasse specifiche creature mitologiche per assegnare significati simbolici precisi a diversi elementi dell'architettura civile e religiosa — non un semplice ornamento decorativo, ma un linguaggio simbolico codificato e riconoscibile.<br><br><b>Curiosità:</b> Statue di Bixi che sorreggono stele sopravvivono ancora oggi in numero considerevole in tutta la Cina, alcune risalenti a oltre mille anni fa, rendendole tra le rappresentazioni artistiche di creature mitologiche più fisicamente durature e ancora visitabili di persona in tutto il mondo — molte di queste stele, letteralmente sorrette dal Bixi, sono sopravvissute a dinastie, guerre e rivoluzioni proprio grazie alla solidità del materiale in cui furono scolpite.",
  "Fenice": "Secondo lo storico greco Erodoto, la Fenice appare in Egitto una volta ogni cinquecento anni, portando le spoglie del proprio genitore avvolte in mirra fino al tempio del Sole a Eliopoli, in un ciclo di pietà filiale tramandato di generazione in generazione.<br><br><b>Il mito completo:</b> Erodoto, nelle sue Storie, offre il primo resoconto greco dettagliato: un uccello grande quanto un'aquila, dalle piume rosse e dorate, proveniente dall'Arabia, che visita il tempio del Sole a Eliopoli in Egitto una sola volta ogni cinquecento anni, portando con sé il corpo del proprio genitore defunto racchiuso in un uovo di mirra per seppellirlo lì. Autori più tardi, come Ovidio e Plinio il Vecchio, arricchirono il mito: la Fenice costruisce un nido di spezie aromatiche, viene consumata dal fuoco, e una nuova Fenice rinasce dalle sue ceneri — la versione oggi più celebre, anche se questo elemento di morte e rinascita è un'aggiunta più tarda, di età romana, assente nel racconto originale di Erodoto incentrato piuttosto sulla pietà filiale.<br><br><b>Contesto culturale:</b> La Fenice è diventata uno dei simboli più duraturi di rinnovamento, immortalità e resurrezione nella storia occidentale: fu adottata dai primi scrittori cristiani, come Clemente di Roma, come allegoria della resurrezione e della vita eterna, comparve su monete imperiali romane come emblema dell'eternità dell'Impero, e continua oggi a comparire in bandiere, letteratura e cultura popolare in tutto il mondo.<br><br><b>Curiosità:</b> La parola greca phoinix indicava anche il colore rosso-porpora, il popolo dei Fenici e la palma da dattero — gli studiosi discutono ancora se il nome dell'uccello derivi dal colore acceso del suo piumaggio o dalla Fenicia stessa, dove esistevano miti solari molto simili, come quello dell'uccello Bennu egizio, probabile parente diretto o modello della Fenice greca.",
  "Huli Jing": "Nella tradizione cinese, la volpe Huli Jing può accumulare secoli di saggezza e sviluppare nove code, ottenendo il potere di trasformarsi in splendide fanciulle: a seconda delle storie, può essere una guida illuminata oppure una tentatrice capace di sconvolgere il destino di un uomo.<br><br><b>Il mito completo:</b> Secondo la tradizione cinese, una volpe ordinaria che raggiunge una grande età (le stime tradizionali variano, spesso citando cinquecento o mille anni) accumula naturalmente saggezza e potere spirituale sufficienti a trasformarsi in huli jing, sviluppando gradualmente ulteriori code fino al massimo di nove — la Volpe a Nove Code (jiuweihu) — un essere di potere quasi divino capace di controllare gli elementi e vedere attraverso il tempo. Le storie cinesi più antiche, risalenti alla dinastia Han, descrivevano spesso la huli jing come una figura benevola e persino un simbolo di buon auspicio associato alla fertilità e alla prosperità familiare, mentre la letteratura successiva, in particolare durante le dinastie Tang e Qing, sviluppò sempre più il suo ruolo ambiguo o pericoloso di seduttrice capace di prosciugare l'energia vitale (qi) degli uomini che sedeva.<br><br><b>Contesto culturale:</b> L'evoluzione della huli jing da simbolo prevalentemente benevolo a figura moralmente ambigua nel corso dei secoli riflette cambiamenti più ampi nell'atteggiamento culturale cinese verso il genere, la sessualità femminile e il potere femminile non regolamentato all'interno delle strutture familiari e sociali confuciane in evoluzione.<br><br><b>Curiosità:</b> La huli jing condivide una chiara parentela concettuale con la kitsune giapponese e il kumiho coreano, riflettendo un più ampio schema mitologico culturale dell'Asia orientale specificamente incentrato sugli spiriti-volpe — la tradizione cinese è generalmente considerata dagli studiosi la fonte storica più antica di questo motivo condiviso, da cui le tradizioni giapponese e coreana si sarebbero poi sviluppate e adattate localmente attraverso secoli di contatto culturale.",
  "Kappa": "Spirito acquatico giapponese che abita fiumi e stagni, riconoscibile per la conca d'acqua incavata sulla testa: se quell'acqua si versa, il Kappa perde ogni sua forza — un dettaglio che generazioni di bambini hanno imparato a proprio vantaggio per placarlo con un inchino rispettoso.<br><br><b>Il mito completo:</b> Oltre a perdere semplicemente la forza se l'acqua della testa si versa, i Kappa venivano tradizionalmente ritenuti pericolosi in particolare per bambini e nuotatori, capaci di annegare le vittime trascinandole sott'acqua, e in alcune varianti regionali più cupe, si credeva estraessero dall'ano delle vittime un organo mitico chiamato \"shirikodama\", ritenuto in alcune tradizioni popolari la sede dell'anima — tuttavia, i Kappa erano anche considerati capaci di genuina amicizia e gratitudine verso gli umani che li trattavano bene, talvolta insegnando l'arte di curare le fratture o conoscenze mediche a chi risparmiava loro la vita o restituiva un braccio di Kappa perduto (gli arti dei Kappa si credeva fossero staccabili e riattaccabili).<br><br><b>Contesto culturale:</b> I Kappa restano profondamente legati a pratiche popolari giapponesi genuine riguardo alla sicurezza in acqua — l'avvertimento folkloristico sui Kappa in agguato in fiumi e stagni serviva (e in alcune zone rurali serve ancora) come racconto ammonitore pratico specificamente volto a prevenire incidenti di annegamento dei bambini, fondendo il folklore soprannaturale direttamente con l'educazione pratica alla sicurezza infantile.<br><br><b>Curiosità:</b> I Kappa sono così culturalmente amati nel Giappone moderno che numerose città e regioni mantengono turismo, festival e persino mascotte ufficiali a tema Kappa — la creatura si è evoluta da una figura folkloristica genuinamente temuta legata al pericolo dell'acqua a uno degli yokai più commercialmente popolari e affettuosamente considerati del Giappone, comparendo ampiamente in manga, anime e media per bambini, una trasformazione sorprendente da mostro puramente ammonitore a icona culturale amata.",
  "Medusa": "Un tempo bellissima sacerdotessa di Atena, Medusa fu trasformata in un mostro dalla stessa dea per punirla di un affronto subito nel suo tempio: da allora il suo sguardo pietrifica chiunque la osservi, finché Perseo non la decapitò guardandola solo di riflesso nel suo scudo.<br><br><b>Il mito completo:</b> Medusa era una delle tre sorelle Gorgoni, l'unica mortale tra loro. Secondo la versione più nota, fu Poseidone a unirsi a lei nel tempio di Atena; ma fu Medusa, non il dio, a subire la punizione della dea oltraggiata, che le trasformò i capelli in serpenti e lo sguardo in un'arma letale. Perseo, incaricato dal re Polidette di portargli la sua testa in un compito pensato per essere impossibile, ricevette dagli dèi gli strumenti per riuscirci: lo scudo a specchio di Atena, i sandali alati di Ermes, l'elmo dell'invisibilità di Ade. Decapitò Medusa mentre dormiva, guardando solo il suo riflesso per non essere pietrificato. Dal collo reciso nacquero Pegaso e il gigante Crisaore, figli di Poseidone rimasti intrappolati nel suo corpo.<br><br><b>Contesto culturale:</b> La testa di Medusa, il Gorgoneion, divenne uno dei simboli apotropaici (cioè capaci di allontanare il male) più diffusi nell'arte greca: comparve su scudi, timpani di templi, ingressi di edifici, proprio per \"spaventare la paura stessa\" con un volto ancora più terribile di qualunque minaccia. Riflette una convinzione greca profonda: l'orrore, se rivolto verso l'esterno, può proteggere anziché distruggere.<br><br><b>Curiosità:</b> Il nome Medusa deriva dal verbo greco medein, \"proteggere\" o \"governare\" — un'ironia notevole per una figura ricordata come mostro, ma coerente col suo uso successivo come simbolo protettivo. Le raffigurazioni più antiche delle Gorgoni, risalenti al VII secolo a.C., non mostrano affatto una donna bella e tragica, ma un volto grottesco con zanne di cinghiale e lingua penzolante: l'immagine della \"bella dannata\" che conosciamo oggi è in gran parte una reinterpretazione molto più tarda, resa celebre soprattutto dall'arte rinascimentale e moderna.",
  "Polifemo": "Il più celebre dei Ciclopi, figlio di Poseidone, tenne prigioniero Ulisse e i suoi compagni nella propria caverna: l'eroe riuscì a fuggire acciecandolo con un palo infuocato e presentandosi con l'astuto nome \"Nessuno\".<br><br><b>Il mito completo:</b> Figlio di Poseidone e della ninfa marina Toosa, Polifemo viveva da solitario pastore sull'isola dei Ciclopi, allevando greggi in una grande caverna. Quando Ulisse e dodici compagni rimasero intrappolati al suo interno, sigillati da un macigno enorme che solo Polifemo poteva spostare, il Ciclope iniziò a divorarne due alla volta. Ulisse escogitò una fuga: offrì a Polifemo vino fortissimo, e quando il gigante gli chiese il nome, rispose con astuzia \"Nessuno\" (in greco, Outis). Una volta che Polifemo cadde in un sonno ubriaco, Ulisse e i compagni rimasti gli conficcarono nell'unico occhio un palo d'ulivo appuntito e indurito al fuoco, accecandolo. Quando Polifemo urlò chiedendo aiuto, gridando che \"Nessuno\" lo stava attaccando, gli altri Ciclopi pensarono non ci fosse alcun aggressore e lo lasciarono senza soccorso. I Greci fuggirono dalla caverna aggrappandosi al ventre delle pecore, mentre il Ciclope, cieco, ne tastava solo il dorso lasciandole uscire al pascolo. Mentre si allontanava in nave, Ulisse rivelò con arroganza il proprio vero nome, permettendo a Polifemo di invocare la vendetta del padre Poseidone — la causa diretta della persecuzione decennale del dio del mare contro Ulisse per tutto il resto dell'Odissea.<br><br><b>Contesto culturale:</b> L'episodio di Polifemo viene spesso letto come una riflessione sui pericoli dell'hybris, l'orgoglio arrogante: l'astuzia di Ulisse salva l'equipaggio, ma il suo bisogno di vantarsi del proprio vero nome subito dopo, annullando la protezione dell'anonimato, causa direttamente anni di sofferenza — una delle illustrazioni omeriche più chiare dell'intelligenza scaltra (mētis) vanificata da un ego incontrollato.<br><br><b>Curiosità:</b> Il gioco di parole su \"Nessuno\" funziona pienamente solo in greco antico (Outis suona quasi identico a mē tis, \"nessuna astuzia\"), un'ambiguità in gran parte perduta nella traduzione — gli studiosi lo considerano uno dei primi ed più sofisticati esempi di gioco di parole come dispositivo letterario in tutta la letteratura occidentale, incastonato direttamente nella meccanica della trama e non solo come intrattenimento decorativo.",
  "Stinfalidi": "Questi uccelli dal piumaggio di bronzo si erano moltiplicati a tal punto da oscurare il cielo sul lago di Stinfalo, terrorizzando la regione: Eracle li fece alzare in volo tutti insieme con un sonaglio forgiato da Efesto, per poi abbatterli con le sue frecce infallibili.<br><br><b>Il mito completo:</b> Questi uccelli dal piumaggio di bronzo (alcune fonti raccontano che potessero scagliare le proprie piume metalliche come frecce, altre che i loro escrementi fossero abbastanza tossici da avvelenare i raccolti) si erano moltiplicati senza controllo intorno al lago di Stinfalo in Arcadia, spinti lì originariamente dai lupi, e secondo alcune versioni erano sacri ad Ares. La sesta fatica richiedeva a Eracle di scacciarli. Poiché il terreno paludoso rendeva impossibile un assalto diretto (non poteva né guadare in sicurezza né mirare con precisione tra i fitti canneti dove nidificavano), Atena gli fornì un paio di crotali di bronzo, forgiati da Efesto appositamente per questo scopo. Il suono assordante fece alzare in volo l'intero stormo contemporaneamente, ed Eracle li abbatté con l'arco mentre fuggivano: alcuni furono uccisi, il resto fuggì per sempre verso la regione del Mar Nero, dove secondo un mito successivo gli Argonauti ne avrebbero incontrato i discendenti.<br><br><b>Contesto culturale:</b> Questa fatica illustra uno schema ricorrente in diverse delle dodici imprese di Eracle: la vittoria ottenuta non con la sola forza bruta ma con strumenti ingegnosi e aiuto divino (si pensi allo strangolamento del Leone di Nemea, o allo scudo a specchio donato da Atena a Perseo contro Medusa) — un promemoria di come l'eroismo greco valorizzasse l'astuzia (mētis) tanto quanto la potenza fisica.<br><br><b>Curiosità:</b> Alcuni storici antichi ipotizzarono che il mito degli \"uccelli Stinfalidi\" fosse nato da racconti di seconda mano, tramandati confusamente da viaggiatori greci, su esotici uccelli africani — forse fenicotteri o ibis, il cui aspetto e comportamento insoliti, filtrati attraverso generazioni di racconti, potrebbero facilmente essere diventati la leggenda di mostruosi uccelli assassini dalle piume di metallo.",
  "Valchiria": "Guerriere al servizio di Odino, le Valchirie scelgono sul campo di battaglia quali guerrieri caduti meritano di essere condotti nel Valhalla: cavalcano tra le nubi della guerra stessa, ed è il loro volo silenzioso a decidere chi verrà ricordato per l'eternità.<br><br><b>Il mito completo:</b> Oltre a scegliere i caduti destinati al Valhalla, le Valchirie servivano Odino direttamente nella sua sala, portando idromele agli einherjar (i guerrieri morti prescelti) che si addestravano di giorno per la battaglia finale del Ragnarök e banchettavano di notte. Valchirie individuali con nome proprio compaiono in tutte le saghe e le Edda — Brynhild, la più celebre di tutte, disobbedì a un ordine diretto di Odino su chi dovesse vincere una determinata battaglia, e fu punita con una spina del sonno e imprigionata dentro un anello di fiamme, risvegliata solo dall'eroe Sigurd (lo stesso che uccise Fafnir).<br><br><b>Contesto culturale:</b> Le Valchirie occupavano uno spazio culturale complesso — al tempo stesso terrificanti agenti di morte sul campo di battaglia e figure desiderabili, talvolta corteggiate romanticamente nella letteratura successiva delle saghe, riflettendo l'intreccio proprio della cultura guerriera norrena tra la venerazione della morte gloriosa in battaglia e la narrativa romantica eroica.<br><br><b>Curiosità:</b> La parola \"Valchiria\" (norreno antico valkyrja) significa letteralmente \"colei che sceglie i caduti\" — e la celebre \"Cavalcata delle Valchirie\" di Richard Wagner, tratta dal suo ciclo operistico Die Walküre, resta uno dei brani più immediatamente riconoscibili della musica classica, garantendo la fama continua di queste figure nella cultura occidentale quasi mille anni dopo la composizione delle saghe originali.",
  "Xiezhi": "Creatura della tradizione cinese dotata di un solo corno, capace di distinguere il giusto dall'ingiusto con perfetta infallibilità: si narra che colpisse istintivamente col corno chiunque mentisse, motivo per cui divenne simbolo della giustizia e dei suoi tribunali.<br><br><b>Il mito completo:</b> Secondo la leggenda, il leggendario giudice Gao Yao, considerato il fondatore mitico della giurisprudenza cinese durante il regno del semi-leggendario imperatore Shun, possedeva un proprio Xiezhi che lo assisteva personalmente nei processi: quando due parti presentavano versioni contrastanti dei fatti, l'animale si avvicinava e colpiva con le corna specificamente la parte colpevole, offrendo un verdetto infallibile e incontestabile che nessun tribunale umano avrebbe potuto eguagliare in accuratezza.<br><br><b>Contesto culturale:</b> Lo Xiezhi divenne un simbolo talmente centrale della giustizia cinese che la sua immagine adornava tradizionalmente le vesti e i copricapi cerimoniali dei censori e dei funzionari giudiziari imperiali, un'usanza che influenzò anche l'iconografia giudiziaria coreana — il \"cappello Xiezhi\" indossato dagli ufficiali giudiziari serviva come promemoria visivo costante del loro dovere di giudicare con la stessa infallibile imparzialità attribuita alla creatura mitologica.<br><br><b>Curiosità:</b> Lo Xiezhi rimane oggi il simbolo ufficiale della professione legale in Corea del Sud, dove la sua immagine compare ancora su edifici giudiziari, pubblicazioni legali e persino come mascotte del sistema giudiziario coreano — uno dei rari casi in questa intera collezione in cui una creatura mitologica antica di migliaia di anni resta un simbolo istituzionale ufficiale e attivamente utilizzato da un moderno stato-nazione.",

  "Ifrit Minore": "Nella tradizione araba, gli Ifrit sono spiriti di fuoco potenti e orgogliosi, una casta superiore tra i Jinn: vivono nelle profondità della terra e si narra emergano dalle fiamme stesse dei falò abbandonati.<br><br><b>Il mito completo:</b> Gli ifrit compaiono nel Corano stesso (Sura 27, versetto 39) come una categoria specifica e potente di jinn, quando uno di essi si offre al re Salomone di recuperare il trono della Regina di Saba prima che l'assemblea si sciolga — un esempio della loro forza e velocità sovrumane riconosciute persino in un testo religioso, non solo nel folklore popolare successivo. Nella tradizione popolare più tarda, in particolare in molte storie delle Mille e una Notte, gli ifrit vengono descritti come giganteschi, dotati di ali e capaci di sollevare intere costruzioni, spesso imprigionati in lampade, anelli o bottiglie da maghi più potenti di loro, costretti a servire chiunque li liberasse fino al completamento di un compito o di un desiderio.<br><br><b>Contesto culturale:</b> Gli ifrit occupano una posizione teologicamente complessa nell'Islam: a differenza di molti mostri di altre tradizioni puramente mitologiche, i jinn (inclusi gli ifrit) sono considerati esseri genuinamente reali all'interno della cosmologia islamica ortodossa, creati da Allah dal \"fuoco senza fumo\" proprio come gli umani furono creati dall'argilla — non semplice folklore, ma parte integrante della teologia islamica formale ancora oggi.<br><br><b>Curiosità:</b> Il moderno \"genio della lampada\" della cultura popolare occidentale, reso celebre da adattamenti come Aladdin, deriva direttamente da questa tradizione degli ifrit imprigionati e costretti a esaudire desideri — un'immagine tuttavia significativamente addolcita e infantilizzata rispetto alla figura originale, spesso genuinamente pericolosa e orgogliosa, descritta nelle fonti arabe e islamiche autentiche.",
  "Alicanto": "Uccello leggendario delle Ande cilene che si nutre di minerali preziosi, oro e argento: le sue piume brillano di notte, ma si narra che chi tenta di seguirne la scia luminosa in cerca di ricchezza rischi di smarrirsi per sempre tra le montagne.<br><br><b>Il mito completo:</b> Secondo la tradizione dei minatori del deserto di Atacama, nel nord del Cile, l'Alicanto diventa talmente appesantito dai metalli preziosi che consuma da perdere gradualmente la capacità di volare se si nutre troppo, rendendolo teoricamente più facile da avvicinare — ma i minatori che tentavano di ucciderlo per impossessarsi delle sue riserve di minerale venivano tradizionalmente maledetti con sfortuna perpetua, mentre chi si limitava a seguirne pazientemente e rispettosamente la scia luminosa notturna poteva talvolta essere condotto fino a un vero giacimento minerario, come ricompensa per la propria pazienza.<br><br><b>Contesto culturale:</b> L'Alicanto riflette profondamente la cultura mineraria del Cile settentrionale, una delle regioni estrattive più importanti al mondo fin dall'epoca coloniale — il mito incorpora sia la promessa di ricchezza improvvisa sia l'avvertimento contro l'avidità, temi centrali nella cultura popolare di comunità la cui sopravvivenza economica dipendeva interamente dall'estrazione mineraria, spesso pericolosa e imprevedibile.<br><br><b>Curiosità:</b> L'Alicanto resta tuttora un riferimento folkloristico attivo nelle comunità minerarie del Cile settentrionale, dove alcuni minatori raccontano ancora aneddoti su presunti avvistamenti di luci notturne inspiegabili tra le montagne — un folklore che continua a intrecciarsi con la vita lavorativa reale e quotidiana di una regione ancora oggi economicamente definita dall'attività estrattiva.",
  "Zhar-Ptitsa": "Il vero Uccello di Fuoco delle fiabe russe: le sue piume incandescenti illuminano la notte come torce, e una sola di esse, caduta a terra, può cambiare il destino di chi la raccoglie — come accade a Ivan Tsarevich nella fiaba più celebre.<br><br><b>Il mito completo:</b> Nella versione più famosa del racconto (raccolta dal folklorista Aleksandr Afanas'ev tra gli altri), il principe Ivan viene inviato dal padre lo Zar a catturare l'Uccello di Fuoco dopo che viene scoperto a rubare mele d'oro dal giardino reale; aiutato dal magico Lupo Grigio (che diventa una delle figure animali-aiutanti più amate del folklore russo), Ivan riesce infine non catturando l'Uccello di Fuoco stesso ma recuperandone una piuma, insieme a una serie di ulteriori imprese magiche (vincere il cavallo dalla criniera d'oro, e la principessa Elena la Bella) che il Lupo Grigio lo aiuta a completare, spesso attraverso inganni mutaforma.<br><br><b>Contesto culturale:</b> Il racconto dell'Uccello di Fuoco esemplifica la classica struttura della skazka russa (fiaba) di un eroe che completa una serie crescente di imprese magiche apparentemente impossibili con l'aiuto di una figura soprannaturale aiutante — uno schema narrativo che i folkloristi (seguendo l'influente analisi strutturale delle fiabe russe di Vladimir Propp) hanno identificato come conforme a schemi formali sottostanti sorprendentemente coerenti attraverso centinaia di varianti di racconti raccolti.<br><br><b>Curiosità:</b> Lo Zhar-Ptitsa raggiunse una fama internazionale enorme ben oltre il folklore russo specificamente attraverso il rivoluzionario balletto del 1910 di Igor' Stravinskij \"L'Uccello di Fuoco\" (L'Oiseau de Feu), composto per i Balletti Russi di Sergej Djagilev — la prima parigina del balletto fu un evento culturale sensazionale che contribuì a lanciare la carriera di Stravinskij e resta una delle opere più eseguite e celebrate dell'intero repertorio del balletto classico, rendendo l'Uccello di Fuoco una delle esportazioni culturali globali di maggior successo e durata del folklore russo.",
  "Strix": "Nella tradizione romana, la Strix è un uccello notturno di malaugurio il cui verso, udito presso una casa, annuncia sciagura imminente: gli antichi la temevano al punto da inchiodare rami di biancospino alle porte per tenerla lontana.<br><br><b>Il mito completo:</b> Oltre a essere semplicemente un presagio di morte attraverso il proprio verso, la Strix nella successiva tradizione popolare romana (e specialmente nelle elaborazioni medievali successive) divenne specificamente associata all'attacco notturno di neonati e bambini, ritenuta capace di trasformarsi da vecchia donna (una strega, o striga) in forma di uccello per volare dentro le case e prosciugare il sangue o l'essenza vitale dei bambini addormentati — questa specifica variante del mito, pericolosa per i bambini, rese la Strix una delle minacce notturne più genuinamente temute del folklore romano, spingendo a pratiche popolari protettive reali oltre al semplice inchiodare rami di biancospino alle porte (incluse formule e rituali protettivi specifici per le nuove madri e i neonati).<br><br><b>Contesto culturale:</b> Il mito della Strix è ampiamente considerato una delle tradizioni folkloristiche antenate dirette delle successive e ben più elaborate credenze dell'epoca dei processi alle streghe europei sulla trasformazione delle streghe in uccelli per attaccare i bambini — il legame linguistico è particolarmente diretto, dato che la parola italiana \"strega\" e il romeno \"strigoi\" (uno spirito non-morto vampiresco) derivano entrambi direttamente da questa stessa antica radice romana \"strix\".<br><br><b>Curiosità:</b> Il nome del genere per i veri gufi nella tassonomia scientifica moderna, \"Strix\" (come in Strix aluco, l'allocco), fu preso in prestito direttamente da questo uccello notturno mitologico romano — il che significa che, proprio come Ceto e \"Cetacea\" nelle schede greche, il nome di questo antico mostro folkloristico sopravvive oggi nella classificazione ornitologica mainstream, completamente spogliato della sua originaria connotazione folkloristica vampiresca e pericolosa per i bambini.",
  "Golem": "Nella leggenda ebraica praghese, il Golem è un guardiano d'argilla animato tramite una parola sacra iscritta sulla fronte o infilata sotto la lingua: obbedisce fedelmente al proprio creatore, ma la leggenda ammonisce sui pericoli di un potere che sfugge al controllo.<br><br><b>Il mito completo:</b> La versione più celebre della leggenda attribuisce la creazione del Golem al Rabbino Judah Loew ben Bezalel, il Maharal di Praga, vissuto nel XVI secolo, che avrebbe plasmato la creatura dall'argilla del fiume Moldava per proteggere la comunità ebraica praghese dalle persecuzioni e dalle false accuse di omicidio rituale allora diffuse; la parola ebraica emet (\"verità\") veniva iscritta sulla fronte del Golem per animarlo, e cancellarne la prima lettera, trasformandola in met (\"morto\"), era il modo tradizionale per disattivarlo quando il suo scopo era compiuto o il suo potere diventava troppo pericoloso da controllare.<br><br><b>Contesto culturale:</b> La leggenda del Golem funziona su più livelli come parabola morale sulla creazione e la responsabilità: un tema ricorrente in molte versioni narrative vede il Golem crescere progressivamente in forza e in autonomia oltre le intenzioni originarie del proprio creatore, richiedendo infine di essere disattivato prima che il suo potere sfugga completamente al controllo — un archetipo narrativo che precede e probabilmente influenzò concettualmente storie occidentali successive sulla creazione artificiale sfuggita al controllo del proprio creatore.<br><br><b>Curiosità:</b> Molti storici della letteratura considerano il mito del Golem un'influenza diretta o concettuale sul romanzo \"Frankenstein\" di Mary Shelley (1818) e su gran parte della successiva narrativa fantascientifica sulla creazione artificiale e l'intelligenza artificiale — rendendo questa leggenda ebraica del XVI secolo una delle radici mitologiche più profonde e ancora oggi rilevanti dell'intero genere fantascientifico moderno sui rischi della creazione tecnologica incontrollata.",
  "Amarok": "Lupo gigante della tradizione Inuit, molto più grande di un lupo comune: si narra cacci da solo nella notte artica chi si allontana imprudentemente dal proprio villaggio.<br><br><b>Il mito completo:</b> A differenza dei lupi comuni, che gli Inuit tradizionalmente cacciavano in branco per necessità di sopravvivenza artica, l'Amarok veniva descritto come un cacciatore solitario di dimensioni straordinarie, capace di inseguire una singola preda umana per giorni interi attraverso il ghiaccio senza mai stancarsi — una minaccia specificamente riservata a chi si separava imprudentemente dal gruppo o dal villaggio, sfidando il principio di sopravvivenza collettiva fondamentale nella vita artica tradizionale Inuit.<br><br><b>Contesto culturale:</b> Il mito dell'Amarok rifletteva una genuina saggezza pratica di sopravvivenza artica: allontanarsi da soli, specialmente di notte o durante le tempeste, rappresentava un pericolo reale e mortale in un ambiente dove l'isolamento significava esposizione al freddo estremo, disorientamento e reale pericolo di predatori — il lupo gigante mitico incarnava e rinforzava narrativamente questa lezione di sopravvivenza essenziale.<br><br><b>Curiosità:</b> Il nome Amarok, nella sua forma originale inuktitut, è semplicemente la parola per \"lupo\" in molte varianti della lingua Inuit — significa che questa creatura, come il Grootslang sudafricano visto in precedenza in questo lotto, prende il nome direttamente dalla parola comune per l'animale reale a cui è ispirata, senza un nome mitologico distinto separato dalla specie ordinaria.",
  "Cadejo": "Cane spettrale nero dagli occhi rossi del folklore centroamericano, che segue i viandanti solitari lungo i sentieri di notte: la tradizione narra anche di un Cadejo bianco, protettore, che si oppone al suo gemello oscuro.<br><br><b>Il mito completo:</b> Secondo la tradizione popolare diffusa in tutto il Centroamerica (particolarmente in Guatemala, El Salvador, Honduras e Nicaragua), il Cadejo nero rappresenta un pericolo genuino per i viandanti notturni, in particolare per chi torna a casa ubriaco o in stato di vulnerabilità morale, mentre il Cadejo bianco appare specificamente per proteggere la stessa persona dal proprio gemello oscuro, scortandola in sicurezza fino a destinazione — un raro esempio nel folklore mondiale di due creature quasi identiche nell'aspetto ma diametralmente opposte nell'intenzione, impegnate in un conflitto diretto e ricorrente sul destino della stessa vittima designata.<br><br><b>Contesto culturale:</b> Il dualismo Cadejo bianco/nero rifletteva una cornice morale cristiana sincretizzata con credenze popolari precoloniali indigene, in cui la lotta tra bene e male veniva incarnata non in un'unica figura ambigua, ma in due entità distinte e opposte che si contendono attivamente ogni singola anima vulnerabile durante il proprio cammino notturno.<br><br><b>Curiosità:</b> Il Cadejo rimane oggi una delle figure folkloristiche più vive e culturalmente rilevanti in tutto il Centroamerica, comparendo regolarmente in festival locali, murales, birra artigianale con il suo nome (la birra salvadoregna \"Cadejo\" è tra le più note del paese) e persino in monumenti pubblici, dimostrando quanto profondamente questa creatura resti intrecciata nell'identità culturale regionale contemporanea, non solo nella narrazione folkloristica storica.",
  "Kludde": "Spirito mutaforma del folklore fiammingo, spesso in sembianze di cane o lupo nero: lo si riconosce per le scintille e i piccoli fulmini che sprigiona muovendosi, specialmente nelle notti di temporale.<br><br><b>Il mito completo:</b> Secondo il folklore delle Fiandre (nella regione belga di lingua neerlandese), il Kludde non si limitava alla forma canina, ma poteva assumere le sembianze di numerosi altri animali — cavallo, gatto, rana, uccello — mantenendo sempre come tratto distintivo le scintille elettriche o le piccole scariche luminose che accompagnavano i suoi movimenti, particolarmente visibili durante le tempeste notturne. Si diceva perseguitasse specifiche vittime lungo un percorso fisso, spesso saltando improvvisamente sulle spalle di un viandante solitario per farsi trasportare, con un peso che aumentava progressivamente man mano che la vittima proseguiva il cammino.<br><br><b>Contesto culturale:</b> Il Kludde appartiene a una più ampia tradizione fiamminga e neerlandese di spiriti mutaforma associati a specifiche strade, ponti o percorsi rurali — un motivo folkloristico che, come il troll dei ponti scandinavo già incontrato in questa collezione, rifletteva ansie genuine sui pericoli reali (banditi, animali selvatici, terreno insidioso) associati a viaggi notturni solitari lungo percorsi remoti.<br><br><b>Curiosità:</b> Il dettaglio delle scintille elettriche associate al Kludde rappresenta uno dei rari casi in cui il folklore europeo tradizionale sembra anticipare, seppur inconsapevolmente, un fenomeno scientificamente reale — l'elettricità statica visibile in condizioni atmosferiche particolari — offrendo un esempio di come osservazioni naturali genuine potessero essere incorporate in una narrazione soprannaturale ben prima di una comprensione scientifica formale del fenomeno stesso.",
  "Nanuq": "Spirito dell'orso polare nella tradizione Inuit, rispettato come un pari più che temuto come una bestia: i cacciatori gli rivolgevano riti e scuse rituali prima e dopo la caccia, per non offenderne lo spirito.<br><br><b>Il mito completo:</b> Secondo la tradizione Inuit, l'orso polare non era considerato un semplice animale ma un essere dotato di intelligenza e anima pari a quella umana, capace persino, secondo alcuni racconti, di rimuovere temporaneamente la propria pelliccia per camminare in forma quasi umana; i cacciatori che uccidevano un orso eseguivano rituali specifici di rispetto — talvolta appendendo gli attrezzi da caccia dell'uomo accanto alla pelle dell'animale per alcuni giorni, come se l'anima dell'orso stesse \"visitando\" la casa del cacciatore prima di ripartire in pace verso il mondo degli spiriti.<br><br><b>Contesto culturale:</b> Questa profonda venerazione rituale per Nanuq riflette un più ampio principio della cosmologia Inuit tradizionale, in cui la caccia non veniva considerata un semplice atto di sopraffazione sull'animale, ma un accordo reciproco tra cacciatore e preda: l'animale \"acconsentiva\" simbolicamente a essere cacciato solo se trattato con il dovuto rispetto rituale, sia prima che dopo l'uccisione.<br><br><b>Curiosità:</b> Queste tradizioni rituali legate a Nanuq restano tuttora praticate, seppur in forma adattata, da alcune comunità Inuit contemporanee che cacciano ancora legalmente l'orso polare secondo diritti di sussistenza tradizionali riconosciuti — rendendo Nanuq una delle rare figure mitologiche di questa collezione la cui pratica rituale associata resta genuinamente viva nella vita quotidiana di comunità reali oggi, non solo tramandata come racconto storico.",
  "Scorpione di Gaia": "Fu Gaia stessa, secondo il mito, a inviare questo scorpione contro il cacciatore Orione, colpevole di essersi vantato di poter uccidere ogni bestia della Terra: entrambi furono infine posti in cielo come costellazioni opposte.<br><br><b>Il mito completo:</b> Orione, cacciatore leggendario di forza sovrumana, si vantò pubblicamente di poter uccidere ogni singola creatura vivente sulla Terra — un'affermazione di tracotanza (hybris) che allarmò profondamente Gaia, la Terra stessa, madre di ogni essere vivente. Per punire questa arroganza e proteggere le proprie creature, Gaia generò uno scorpione dal veleno letale e lo inviò contro il cacciatore, che morì per la sua puntura nonostante tutta la propria forza. Zeus pose entrambi tra le stelle come monito eterno, ma posizionandoli su lati opposti del cielo, in modo che non sorgessero mai contemporaneamente: quando la costellazione dello Scorpione sorge a est, quella di Orione tramonta a ovest, come se il cacciatore fuggisse ancora in eterno dal proprio nemico.<br><br><b>Contesto culturale:</b> Questo mito rappresenta un classico esempio greco della hybris punita da una forza primordiale — non un dio olimpico, ma Gaia stessa, la Terra, a intervenire contro chi minaccia l'equilibrio naturale del mondo con la propria arroganza.<br><br><b>Curiosità:</b> Il posizionamento astronomico reale delle costellazioni di Orione e dello Scorpione riflette esattamente questo dettaglio mitologico: le due costellazioni non sono mai visibili contemporaneamente nel cielo notturno, un fenomeno astronomico genuino che i Greci antichi avevano osservato con precisione e incorporato direttamente nel proprio racconto mitologico.",
  "Onibi": "Fuoco fatuo della tradizione yokai giapponese, una fiammella azzurrognola che fluttua nelle paludi e nei boschi di notte: si diceva fosse generata dal risentimento di animali o persone morte in circostanze infelici.<br><br><b>Il mito completo:</b> Il folklore sull'onibi lo distingueva specificamente da fenomeni simili ma distinti di tipo \"fuoco fatuo\" nella tradizione giapponese — figure correlate ma concettualmente diverse includevano il \"kitsunebi\" (fuoco di volpe, specificamente associato agli spiriti kitsune/volpe e considerato meno apertamente malevolo) e lo \"hitodama\" (letteralmente \"anima umana\", che rappresenta un'anima in partenza o che indugia vicino a un corpo nel momento della morte) — l'onibi in particolare era associato a risentimento animale o umano persistente e a emozione negativa, distinguendo il suo significato folkloristico da questi fenomeni di luce notturna visivamente simili ma concettualmente distinti.<br><br><b>Contesto culturale:</b> Questa attenta distinzione tra molteplici fenomeni di luce notturna visivamente simili, ciascuno portatore di un significato folkloristico e una storia d'origine specifica diversi, esemplifica la natura dettagliata e sistematica della classificazione tradizionale giapponese degli yokai — invece di trattare tutte le luci inspiegabili come un'unica categoria generica, la tradizione popolare giapponese sviluppò distinzioni sfumate che riflettono diverse cause sottostanti e risposte umane appropriate a ciascuna.<br><br><b>Curiosità:</b> Come tradizioni folkloristiche simili di \"ignis fatuus\" presenti in tutto il mondo (incluse diverse già trattate nelle schede slave precedenti), il folklore sull'onibi nacque probabilmente in parte da fenomeni naturali genuini — combustione spontanea di gas di palude, funghi bioluminescenti o altre fonti di luce naturale osservate nel paesaggio umido e boscoso del Giappone stesso — dimostrando come osservazioni naturali sorprendentemente simili abbiano generato indipendentemente tradizioni folkloristiche soprannaturali ampiamente comparabili in culture completamente scollegate in tutto il mondo.",
  "Näkki": "Spirito d'acqua pericoloso del folklore finlandese, che si cela in laghi e fiumi in attesa di trascinare sott'acqua chi si avvicina troppo alla riva, specialmente i bambini incauti.<br><br><b>Il mito completo:</b> Secondo la tradizione finlandese, il Näkki poteva assumere forme diverse a seconda delle circostanze e della vittima designata — talvolta un cavallo apparentemente docile lungo la riva, che invitava implicitamente chi lo cavalcava a farsi trasportare in acqua profonda; talvolta una figura umana, spesso di bell'aspetto, che intonava un canto irresistibile per attirare i passanti verso il bordo dell'acqua durante la notte, in una figura concettualmente vicina sia al kelpie scozzese sia alla rusalka slava già incontrati in questa collezione.<br><br><b>Contesto culturale:</b> Il Näkki riflette la genuina e diffusa ansia popolare finlandese sui pericoli reali dei numerosissimi laghi e corsi d'acqua che caratterizzano il paesaggio finlandese (la Finlandia conta letteralmente centinaia di migliaia di laghi) — un avvertimento pratico contro l'annegamento incorporato in una narrazione soprannaturale, particolarmente rivolto ai bambini in età di gioco vicino all'acqua non sorvegliata.<br><br><b>Curiosità:</b> Il Näkki resta oggi una figura educativa attivamente impiegata in Finlandia per la sicurezza infantile in acqua — programmi scolastici e materiali didattici finlandesi contemporanei continuano occasionalmente a fare riferimento a questa antica figura folkloristica come strumento pedagogico per insegnare ai bambini la cautela intorno a laghi e fiumi, una continuità diretta tra folklore antico e educazione pratica moderna.",
  "Vargr": "Nella lingua norrena antica, questo era il vero nome dei grandi lupi selvaggi e fuorilegge: il termine stesso finì per indicare chiunque fosse bandito dalla società, cacciato al pari di una bestia.<br><br><b>Il mito completo:</b> Nel diritto norreno antico, dichiarare qualcuno \"vargr í véum\" (\"un lupo nel luogo sacro\") era tra le punizioni più severe disponibili — oltre alla semplice messa al bando, significava specificamente che il condannato poteva essere ucciso da chiunque senza conseguenze legali, trattato come letteralmente al di sotto della protezione normalmente garantita persino ai membri più umili della società, equiparato simbolicamente a un predatore selvaggio piuttosto che a un essere umano meritevole di una qualunque protezione comunitaria.<br><br><b>Contesto culturale:</b> Questa sovrapposizione tra diritto e mitologia riflette quanto profondamente il simbolismo del lupo fosse intrecciato nelle strutture sociali e legali norrene reali — i lupi (e per estensione, Fenrir come minaccia cosmica lupina definitiva) rappresentavano non semplicemente animali pericolosi ma l'antitesi fondamentale della civiltà umana legittima e comunitaria stessa.<br><br><b>Curiosità:</b> Il termine legale inglese \"outlaw\" (fuorilegge), e lo stesso concetto di porre formalmente qualcuno interamente al di fuori della protezione legale, hanno radici etimologiche e concettuali dirette in questa specifica tradizione mitologico-legale norrena del lupo — rendendo \"vargr\" uno degli esempi sopravvissuti più chiari di vocabolario religioso e mitologico norreno antico che ha plasmato direttamente lo sviluppo della successiva terminologia legale germanica e inglese.",
  "Yeti": "L'Uomo delle Nevi dell'Himalaya, avvistato ma mai catturato da generazioni di scalatori e abitanti locali: le popolazioni sherpa lo considerano un guardiano delle vette più alte e sacre.<br><br><b>Il mito completo:</b> Nella tradizione sherpa e tibetana himalayana, lo Yeti non veniva tradizionalmente concepito come un semplice animale sconosciuto, ma come una presenza spirituale legata alla sacralità delle montagne più alte del mondo — alcune tradizioni locali lo associano a spiriti protettori dei valichi montani, capaci di punire chi si avventura sulle vette sacre con irriverenza o senza il dovuto rispetto rituale, riflettendo l'importanza religiosa profonda che le comunità himalayane attribuiscono a specifiche montagne, inclusi molti degli stessi picchi oggi celebri per l'alpinismo occidentale.<br><br><b>Contesto culturale:</b> L'interesse occidentale per lo Yeti esplose particolarmente nel XX secolo in concomitanza con le prime grandi spedizioni alpinistiche himalayane, quando esploratori europei e americani riportarono avvistamenti di impronte inspiegabili nella neve, generando un intenso interesse mediatico e pseudo-scientifico internazionale che spesso si sovrappose, e talvolta distorse, il significato religioso più profondo e sfumato che la creatura aveva già da secoli nelle culture himalayane locali.<br><br><b>Curiosità:</b> Test genetici moderni condotti su presunti campioni biologici di Yeti raccolti nel corso di decenni (peli, escrementi, resti conservati in monasteri) hanno costantemente rivelato corrispondenze con orsi bruni himalayani o orsi tibetani, portando la maggior parte dei ricercatori scientifici a ritenere che gli avvistamenti storici derivino probabilmente da incontri reali con questi plantigradi, sebbene il significato culturale e religioso dello Yeti nelle tradizioni sherpa e tibetane resti indipendente da questa spiegazione puramente zoologica.",
  "Baku": "Creatura ibrida della tradizione giapponese capace di divorare gli incubi altrui: si dice che chiamarlo per nome dopo un brutto sogno lo induca a inghiottirlo, liberando chi lo ha sognato dall'angoscia.<br><br><b>Il mito completo:</b> L'origine del Baku risale al folklore cinese (similmente a diversi altri yokai importati e adattati da fonti continentali), originariamente descritto con una forma fisica ibrida più elaborata — tradizionalmente raffigurato con la proboscide di un elefante, gli occhi di un rinoceronte, la coda di un bue e le zampe di una tigre — sebbene questa specifica descrizione fisica composita divenne gradualmente meno enfatizzata nella tradizione giapponese successiva rispetto alla sua funzione centrale di divoratore di sogni; alcune tradizioni avvertivano che se un Baku consumava troppi sogni senza incubi genuini a bilanciare la propria dieta, avrebbe potuto diventare abbastanza affamato da consumare anche le speranze e le ambizioni di una persona insieme ai suoi brutti sogni, rendendo un affidamento eccessivamente indiscriminato sul chiamare il Baku potenzialmente rischioso.<br><br><b>Contesto culturale:</b> Il Baku esemplifica uno schema folkloristico relativamente raro di una creatura soprannaturale il cui ruolo fondamentale è esplicitamente protettivo e benefico verso gli umani (il consumo di sogni/incubi specificamente aiuta piuttosto che danneggiare) — un contrasto notevole con la natura prevalentemente pericolosa o moralmente ambigua della maggior parte delle altre figure yokai e folkloristiche soprannaturali in molte tradizioni del mondo.<br><br><b>Curiosità:</b> L'immagine del Baku veniva storicamente usata come genuino talismano protettivo in Giappone — cuscini, biancheria da letto e altri oggetti legati al sonno venivano talvolta decorati con l'immagine del Baku o il carattere stesso per \"baku\", ritenuto capace di invocare l'effettivo potere protettivo della creatura di divorare i sogni attraverso la mera presenza della sua rappresentazione simbolica, una pratica di magia popolare che collega direttamente la mitologia alla cultura materiale domestica quotidiana.",
  "Tarasque": "Drago-tartaruga corazzato che terrorizzava la Provenza francese, finché non fu placato non con la forza ma con la gentilezza di Santa Marta, che lo condusse mansueto fino alla città che oggi porta il suo nome, Tarascona.<br><br><b>Il mito completo:</b> Secondo l'agiografia medievale, la Tarasque devastava le rive del Rodano nei pressi dell'odierna Tarascona, capovolgendo le imbarcazioni e divorando i viaggiatori, finché la popolazione locale non implorò l'aiuto di Santa Marta, sorella di Lazzaro, che si dice fosse giunta in Provenza dopo la crocifissione di Cristo; a differenza della maggior parte dei racconti agiografici di draghi sconfitti con la spada o la forza, Marta si avvicinò alla bestia semplicemente cantando inni e aspergendola con acqua santa, domandola senza violenza al punto da poterla condurre come un animale mansueto fino al villaggio, dove secondo alcune versioni gli abitanti la uccisero comunque per paura, un atto che Marta rimproverò severamente.<br><br><b>Contesto culturale:</b> A differenza della tipica narrazione agiografica del \"santo che uccide il drago con la spada\" (come San Giorgio), il mito della Tarasque enfatizza specificamente la mansuetudine e la fede come strumenti di trionfo sul male, riflettendo una tradizione teologica alternativa che privilegiava la conversione e la pace rispetto alla vittoria violenta, anche nei confronti di minacce mostruose.<br><br><b>Curiosità:</b> La città di Tarascona celebra ancora oggi annualmente la Festa della Tarasque, una tradizione popolare risalente almeno al XV secolo in cui un'enorme effigie del drago viene fatta sfilare per le strade cittadine — riconosciuta dall'UNESCO come patrimonio culturale immateriale dell'umanità, rendendo la Tarasque una delle pochissime creature di questa intera collezione il cui culto popolare tradizionale continua a essere celebrato pubblicamente e ufficialmente ogni anno nella città che le deve il proprio nome.",
  "Simurgh": "Uccello sapiente e antichissimo della mitologia persiana, testimone della distruzione e rinascita del mondo per tre volte: nell'epica iraniana alleva l'eroe abbandonato Zal, trasmettendogli parte della propria saggezza.<br><br><b>Il mito completo:</b> Nello Shahnameh (\"Il Libro dei Re\", il grande poema epico persiano di Ferdowsi), il neonato Zal viene abbandonato dal padre Sam sul Monte Alborz per essere nato con i capelli bianchi, un tratto considerato di cattivo auspicio; il Simurgh lo trova, lo alleva insieme ai propri piccoli e gli dona tre delle proprie piume, promettendogli che bruciandone una avrebbe potuto richiamarla in soccorso in qualunque momento. Anni dopo, quando la moglie di Zal, Rudabeh, rischia di morire durante un parto difficile (dando alla luce il futuro eroe Rostam, il più grande campione dell'epica persiana), Zal brucia la piuma e il Simurgh torna a guidarlo attraverso un parto cesareo rituale che salva sia madre che figlio.<br><br><b>Contesto culturale:</b> Il Simurgh compare anche in un'opera mistica sufi fondamentale, \"Il Verbo degli Uccelli\" (Mantiq al-Tayr) del poeta persiano Attar del XII secolo, in cui trenta uccelli intraprendono un pericoloso pellegrinaggio alla ricerca del Simurgh come guida spirituale suprema, solo per scoprire alla fine del viaggio, attraverso un gioco di parole persiano (si morgh significa letteralmente \"trenta uccelli\"), che essi stessi, collettivamente, erano il Simurgh che cercavano — una delle allegorie più celebri della mistica sufi sull'unità tra cercatore e divino.<br><br><b>Curiosità:</b> Il nome \"Simurgh\" è considerato dagli studiosi una possibile fonte diretta o un'influenza significativa sull'uccello Rukh (o Roc) delle Mille e una Notte, e alcuni linguisti tracciano connessioni etimologiche lontane tra il Simurgh e la Fenice greco-romana, suggerendo una possibile origine mitologica indoeuropea condivisa per diversi grandi uccelli sapienti e rigenerativi in culture geograficamente distanti.",
  "Cinghiale d'Erimanto (cucciolo)": "Versione giovane del cinghiale gigantesco che devastava il monte Erimanto: la sua forma adulta sarebbe stata la Quarta Fatica di Eracle, che lo catturò vivo intrappolandolo nella neve profonda.<br><br><b>Il mito completo:</b> Ancora prima di raggiungere le dimensioni mostruose che lo resero celebre, questo cinghiale già terrorizzava le pendici del monte Erimanto in Arcadia, distruggendo raccolti e minacciando i pastori della regione. Fu proprio durante il tragitto verso questa impresa che Eracle, secondo Apollodoro, si fermò a far visita al centauro Folo, un episodio che degenerò in uno scontro violento con altri centauri attirati dall'odore del vino sacro aperto per l'occasione — durante il quale Eracle ferì accidentalmente anche il saggio Chirone con una delle sue frecce avvelenate dal sangue dell'Idra, la stessa ferita che secondo il mito lo avrebbe poi condotto a scambiare la propria immortalità con Prometeo.<br><br><b>Contesto culturale:</b> L'episodio del cinghiale è tra i pochi delle dodici fatiche a intrecciarsi direttamente con un altro mito importante (quello di Chirone), dimostrando come le imprese di Eracle non fossero racconti isolati ma nodi di una rete narrativa greca più ampia e interconnessa.<br><br><b>Curiosità:</b> La cattura finale del cinghiale, quando ormai adulto, avvenne intrappolandolo nella neve alta fino a sfinirlo — un dettaglio pratico e quasi realistico di tecnica venatoria che contrasta con la natura fantastica della creatura stessa, rendendo questa fatica una delle più \"credibili\" dal punto di vista della caccia reale tra tutte le dodici imprese di Eracle.",
  "Kitsune Giovane": "Giovane volpe della tradizione giapponese, non ancora abbastanza antica da aver sviluppato le nove code delle Kitsune più potenti: già capace di piccoli incantesimi e di confondere lievemente chi le si avvicina.<br><br><b>Il mito completo:</b> Nella più completa tradizione giapponese sulle kitsune, una volpe guadagna una coda aggiuntiva circa ogni cento anni di vita (o attraverso l'accumulo di grande saggezza e potere spirituale), raggiungendo infine il massimo di nove code intorno ai mille anni di età, momento in cui la kitsune raggiunge la propria forma più potente (kyūbi no kitsune, \"volpe a nove code\"), acquisendo la capacità di vedere e udire qualunque cosa accada in qualunque luogo del mondo, insieme a un immenso potere magico e spesso un manto che diventa bianco, argenteo o dorato. Le kitsune vengono tradizionalmente divise in due ampie categorie morali: \"zenko\" (volpi celesti benevole associate alla divinità shintoista del riso Inari, considerate messaggere e spiriti protettivi) e \"yako\" (volpi selvatiche, imbroglioni moralmente ambigui o attivamente dispettosi/malevoli che possono possedere gli umani, causare malattia o ingannare i viandanti attraverso elaborate illusioni mutaforma, più comunemente trasformandosi in belle donne).<br><br><b>Contesto culturale:</b> La profonda associazione della kitsune con Inari, una delle divinità shintoiste più ampiamente venerate (particolarmente legata a riso, fertilità e prosperità), riflette una delle tradizioni di spiriti animali religiosamente più significative del Giappone — statue di volpi in pietra restano un elemento comune e immediatamente riconoscibile a guardia degli ingressi dei santuari di Inari in tutto il Giappone ancora oggi, riflettendo il genuino e continuo significato religioso della kitsune ben oltre la pura narrazione folkloristica.<br><br><b>Curiosità:</b> La tradizione della kitsune condivide una chiara parentela concettuale con la simile tradizione cinese dello huli jing (spirito volpe a nove code) e il kumiho coreano, riflettendo uno schema mitologico culturale est-asiatico ampiamente condiviso specificamente incentrato sugli spiriti-volpe — sebbene ciascuna cultura abbia sviluppato propri dettagli regionali e cornici morali distinte, l'affascinazione sottostante per le volpi come esseri spirituali unicamente astuti, potenzialmente pericolosi e mutaforma compare in modo sorprendentemente coerente in molteplici tradizioni mitologiche est-asiatiche in modo indipendente.",
  "Encantado": "Spirito fluviale della tradizione amazzonica, capace di trasformarsi da delfino rosa a splendido essere umano durante le feste notturne: si narra seduca i presenti per poi ricondurli con sé nella città sommersa dell'Encante.<br><br><b>Il mito completo:</b> Secondo la tradizione popolare amazzonica, l'Encantado emerge dal fiume durante le feste di paese, sempre vestito elegantemente di bianco con un cappello, indossato specificamente per nascondere lo sfiatatoio ancora presente sulla sommità del capo — un dettaglio anatomico che tradisce la sua vera natura di boto (il delfino rosa amazzonico) a chi sa riconoscerlo. Dopo aver sedotto una giovane donna durante la festa, tornerebbe al fiume prima dell'alba, e gravidanze inspiegabili nelle comunità fluviali venivano tradizionalmente attribuite proprio a questi incontri notturni con un Encantado.<br><br><b>Contesto culturale:</b> Questo mito rifletteva e rinforzava un genuino tabù di protezione ambientale: uccidere o danneggiare un boto reale era considerato di gravissimo malaugurio nelle comunità amazzoniche tradizionali, un tabù che ha contribuito storicamente a proteggere questa specie realmente esistente e oggi minacciata, rendendo il mito dell'Encantado un raro esempio di folklore che funge anche da meccanismo di conservazione ambientale pratico.<br><br><b>Curiosità:</b> La credenza nell'Encantado resta sorprendentemente viva in alcune comunità rivierasche dell'Amazzonia brasiliana ancora oggi, dove gravidanze fuori dal matrimonio vengono talvolta ancora attribuite culturalmente a un Encantado — una spiegazione socialmente accettabile che, secondo alcuni antropologi, serviva anche a proteggere la reputazione della donna coinvolta, deviando la responsabilità verso una figura soprannaturale piuttosto che verso un partner umano reale.",
  "Makara": "Creatura ibrida acquatica della mitologia indiana, per metà coccodrillo e per metà pesce o elefante: funge da cavalcatura per la dea del fiume Gange e per Varuna, signore delle acque.<br><br><b>Il mito completo:</b> Oltre a servire come vahana (cavalcatura divina) specificamente per Ganga e Varuna, il makara compare estesamente in tutta l'architettura templare tradizionale indù, buddhista e sudest asiatica come motivo decorativo ricorrente e simbolicamente protettivo — figure di makara compaiono comunemente su archi di ingresso templari (torana), grondaie decorative e soglie architettoniche in tutto il subcontinente indiano e in tutto il sud-est asiatico (i templi di Angkor in Cambogia, l'architettura templare indonesiana e thailandese presentano tutte un'estesa iconografia makara), simboleggiando costantemente la soglia o il portale tra i regni terreno e sacro/divino.<br><br><b>Contesto culturale:</b> Il design composito specifico del makara (tipicamente combinando mascelle e muso di coccodrillo con quarti posteriori di pesce o elefante, talvolta con elementi aggiuntivi di pavone o altri animali a seconda della variazione regionale) esemplifica una più ampia tradizione religioso-artistica sudasiatica e sudest asiatica di creature ibride guardiane che segnano soglie architettoniche sacre — uno schema con chiari parallelismi strutturali ad altre tradizioni di ibridi guardiani trattate nelle schede precedenti (i guardiani templari mesopotamici, ad esempio), sebbene sviluppato indipendentemente all'interno del proprio distinto contesto religioso-artistico.<br><br><b>Curiosità:</b> Il makara presta il proprio nome direttamente a \"Makar Sankranti\", un'importante festa del raccolto indù celebrata in tutta l'India che segna la transizione astrologica del sole in Makara (Capricorno) nello zodiaco vedico tradizionale — il che significa che il nome di questa antica creatura ibrida mitologica resta oggi attivamente invocato non solo nell'architettura templare e nella mitologia, ma nel calendario indù contemporaneo e in una delle feste religiose annuali più ampiamente celebrate in India.",

  "Leone di Nemea Invulnerabile": "Nella sua forma piena, la pelle del Leone di Nemea non poteva essere scalfita da nessuna lama forgiata dagli uomini: Eracle dovette strangolarlo a mani nude, e solo gli artigli della bestia stessa riuscirono infine a scuoiarla.<br><br><b>Il mito completo:</b> Inviato da Era (o nato dalla Luna stessa, secondo altre tradizioni) a terrorizzare la valle di Nemea, il leone aveva una pelle impenetrabile a qualunque arma forgiata da mani mortali: frecce e spade rimbalzavano inutilmente. Eracle, resosi conto che le armi non servivano a nulla, lo braccò nella sua tana, che aveva due ingressi: ne bloccò uno e lo affrontò a mani nude nell'altro, strangolandolo in una lotta corpo a corpo disperata. Scoperto poi che nemmeno i coltelli comuni riuscivano a incidere la pelliccia, fu costretto a usare uno degli artigli stessi della bestia per scuoiarla.<br><br><b>Contesto culturale:</b> Il mantello di pelle leonina (la leontē) divenne l'attributo visivo più iconico di Eracle nell'arte greca e romana, riconoscibile all'istante su migliaia di vasi, statue e monete, spesso indossato come cappuccio con la testa del leone sopra quella dell'eroe. Simboleggiava la sua trasformazione: non si limita a sconfiggere la belva, ne indossa il potere come proprio.<br><br><b>Curiosità:</b> Nemea, teatro di questa fatica, ospitava i Giochi Nemei, uno dei quattro grandi festival atletici panellenici (insieme a Olimpia, Delfi e Istmia) — fondati, secondo la tradizione, proprio in memoria della vittoria di Eracle sul leone, rendendo questo mito uno dei pochissimi legati direttamente a un'istituzione sportiva storicamente documentata.",
  "Idra di Lerna Immortale": "La vera Idra di Lerna non è soltanto una bestia dalle molte teste, ma un essere la cui testa centrale è letteralmente immortale: Eracle poté solo seppellirla per sempre sotto un masso, l'unico modo per neutralizzare ciò che non può essere ucciso.<br><br><b>Il mito completo:</b> Mentre le altre teste dell'Idra erano mortali, la testa centrale non poteva essere uccisa in alcun modo, nemmeno dalla forza sovrumana di Eracle. Dopo aver reciso e cauterizzato tutte le altre teste con l'aiuto di Iolao, Eracle staccò anche quella immortale — ma non riuscì a distruggerla nemmeno separata dal corpo. Non gli restò che seppellirla per sempre sotto un macigno enorme, lungo la sacra via presso Lerna, un luogo che il viaggiatore greco Pausania, secoli più tardi, affermò di aver visitato personalmente, indicato ancora dagli abitanti del luogo.<br><br><b>Contesto culturale:</b> La testa immortale rappresenta un estremo filosofico tipicamente greco: non tutto ciò che è mostruoso può essere distrutto, solo contenuto e neutralizzato — uno dei rari casi in cui il trionfo di un eroe greco non è un annientamento totale, ma un'eterna prigionia, echeggiando il destino dei Titani rinchiusi nel Tartaro.<br><br><b>Curiosità:</b> Pausania, scrivendo secoli dopo la nascita del mito, sostenne di aver visto con i propri occhi il luogo presso Lerna dove gli abitanti indicavano la roccia sotto cui si diceva giacesse ancora la testa immortale — un esempio notevole di come le comunità greche ancorassero fisicamente i propri miti alla geografia reale, mescolando leggenda e turismo ante litteram.",
  "Linnormr": "Nella sua forma adulta e compiuta, il Linnormr norreno è un serpente-drago privo di zampe e ali che si muove sinuoso tra le acque e le rocce: la sua sola presenza in una regione bastava a far evacuare interi villaggi costieri.<br><br><b>Il mito completo:</b> A differenza dei draghi alati dell'Europa occidentale, il Linnormr è specificamente privo di ali e zampe, muovendosi in modo serpentino, quasi anguilliforme — questa tradizione visiva distinta lo lega strettamente al folklore norreno autentico su serpenti marini e mostri lacustri segnalati lungo le coste e i fiordi scandinavi per secoli, sfumando il confine tra drago puramente mitologico e \"avvistamento\" quasi da mostro reale. Jörmungandr, il Serpente di Midgard che cinge il mondo intero e affronterà Thor al Ragnarök, è tecnicamente l'esempio più celebre di questo archetipo di Linnormr portato a scala cosmica.<br><br><b>Contesto culturale:</b> Il tipo del Linnormr riflette una tradizione draconica nordeuropea genuinamente distinta, separata e precedente rispetto al drago sputafuoco, accumulatore di tesori, dotato di quattro zampe e ali che divenne dominante nell'immaginario fantasy medievale successivo (influenzato più dalla tradizione letteraria continentale europea).<br><br><b>Curiosità:</b> Numerosi laghi scandinavi conservano ancora oggi leggende locali di \"Linnormr\" o mostri serpentiformi legate specificamente a loro (il lago norvegese di Seljord ha una propria tradizione documentata del mostro \"Selma\") — una continuazione folkloristica diretta e ancora viva di questo antico archetipo draconico norreno fino al folklore regionale moderno.",

  "Fafnir": "Un tempo nano, Fafnir fu corrotto dall'avidità per un tesoro maledetto fino a trasformarsi lui stesso in drago per custodirlo meglio: la sua fine per mano dell'eroe Sigurd, che lo trafisse da sotto mentre strisciava verso l'acqua, è tra le storie più celebri dell'epica norrena.<br><br><b>Il mito completo:</b> L'oro apparteneva in origine al nano Andvari, che lo maledisse dopo esserne stato derubato con la forza da Loki, costretto a pagare un debito di sangue per aver ucciso accidentalmente Otr, un altro figlio di Hreidmar (padre anche di Fafnir). Lo stesso Hreidmar fu poi ucciso dai propri figli Fafnir e Regin per impossessarsi dell'oro; Fafnir, reso folle dall'avidità, scacciò il fratello Regin prendendosi l'intero tesoro, ritirandosi nella brughiera di Gnitaheath e trasformandosi in drago per custodirlo da solo. Regin, cercando vendetta e il tesoro per sé, allevò il giovane Sigurd apposta per uccidere Fafnir, forgiandogli la spada Gram dai frammenti della lama spezzata del padre. Sigurd scavò una fossa lungo il percorso di Fafnir verso l'acqua e lo trafisse da sotto mentre strisciava sopra di lui; poi, seguendo le istruzioni di Regin, arrostì il cuore del drago, assaggiandone per errore il sangue — un gesto che gli donò la capacità di comprendere il linguaggio degli uccelli, i quali lo avvertirono che Regin progettava di tradirlo e ucciderlo a sua volta, spingendo Sigurd a colpire per primo.<br><br><b>Contesto culturale:</b> Questo racconto dell'oro maledetto (l'anello di Andvari, la trasformazione di Fafnir spinta dall'avidità) è considerato una delle fonti mitiche dirette a cui J.R.R. Tolkien attinse sia per il drago Smaug sia per il potere corruttore dell'Unico Anello nel Signore degli Anelli, e ispirò direttamente anche il ciclo operistico dell'Anello del Nibelungo di Wagner.<br><br><b>Curiosità:</b> Il dettaglio specifico dell'assaggio del sangue di drago per comprendere il linguaggio degli uccelli è un motivo ricorrente di \"saggezza attraverso la trasgressione\" presente in molte mitologie; il nome di Fafnir divenne inoltre in seguito, in alcune tradizioni popolari scandinave, un termine generico per indicare qualunque drago accumulatore spinto dall'avidità.",
  "Yamata no Orochi": "Serpente a otto teste e otto code della mitologia giapponese, che pretendeva ogni anno il sacrificio di una fanciulla: il dio Susanoo lo sconfisse ubriacandolo con sakè prima di affrontarlo, trovando nella sua coda la spada sacra Kusanagi.<br><br><b>Il mito completo:</b> Susanoo, bandito dai cieli dalla sorella Amaterasu (la dea del sole) per il suo comportamento distruttivo, scese sulla terra e incontrò una coppia di anziani in lacrime per l'ultima figlia rimasta, Kushinada-hime — Orochi aveva già divorato le altre sette figlie nel corso di sette anni, una all'anno, ed era tornato per l'ottava e ultima. Susanoo si offrì di sconfiggere il mostro in cambio della mano della ragazza; fece preparare ai genitori otto tini di sakè estremamente potente, posizionati a otto cancelli, uno per ciascuna testa di Orochi. Quando il serpente arrivò, ogni testa bevve da un tino separato e cadde in un torpore ubriaco, permettendo a Susanoo di recidere tutti e otto i colli con la propria spada. Nella coda del serpente scoprì la leggendaria spada Kusanagi (\"Falciaerba\"), che donò ad Amaterasu come offerta di pace, e che divenne poi una delle Tre Insegne Imperiali del Giappone, simboli dell'autorità legittima del trono imperiale giapponese.<br><br><b>Contesto culturale:</b> Questo mito, registrato nelle cronache più antiche del Giappone (il Kojiki, 712 d.C., e il Nihon Shoki, 720 d.C.), lega direttamente la mitologia shintoista alla legittimità della linea imperiale — la scoperta di Kusanagi all'interno del mito collega l'autorità sacra della spada fino a questa vittoria primordiale sul caos, rendendo il mito di Orochi fondativo per l'ideologia religiosa statale giapponese, non semplice intrattenimento folkloristico.<br><br><b>Curiosità:</b> La spada Kusanagi stessa, secondo una tradizione ininterrotta, è custodita oggi presso il Santuario di Atsuta a Nagoya come uno degli oggetti più sacri del Giappone — a quanto pare non è mai stata esposta pubblicamente né fotografata in epoca moderna, e si dice che persino l'Imperatore regnante non la veda mai direttamente, rendendola uno dei pochissimi artefatti mitologici dell'intera collezione di carte il cui presunto oggetto fisico è ancora oggi attivamente venerato e protetto, invece di esistere solo in antichi testi o esposizioni museali.",
  "Tiamat": "Dea primordiale del mare salato nella mitologia mesopotamica, madre di mostri e progenitrice degli dèi stessi: quando si ribellò contro la nuova generazione divina, fu sconfitta da Marduk, che ne divise il corpo per plasmare il cielo e la terra.<br><br><b>Il mito completo:</b> L'Enuma Elish (l'epopea babilonese della creazione dove questo mito è registrato) descrive Tiamat, infuriata dopo che gli dèi più giovani uccisero suo marito Apsu (dio dell'acqua dolce, ucciso dagli dèi più giovani per aver disturbato la loro pace col suo rumore), radunare un esercito di creature mostruose — incluso il serpente cornuto Bašmu e vari uomini-scorpione e altri esseri ibridi presenti anche altrove in questa collezione — guidato dal suo consorte/generale prescelto Kingu, a cui affidò le Tavole del Destino (lo stesso artefatto cosmico rubato più tardi da Anzu) per garantirgli l'autorità suprema sulla battaglia imminente. Marduk, scelto come campione degli dèi proprio per la sua disponibilità ad affrontarla, sconfisse Tiamat usando una rete, i quattro venti e una freccia scoccata nella sua bocca aperta mentre tentava di inghiottirlo; divise poi in due il suo enorme cadavere, usando una metà per formare il cielo e l'altra per formare la terra, e usò il sangue di Kingu per creare l'umanità stessa, destinata a servire gli dèi.<br><br><b>Contesto culturale:</b> L'Enuma Elish e la sconfitta di Tiamat svolgevano una funzione esplicitamente politico-religiosa nell'antica Babilonia — venivano recitati cerimonialmente ogni anno durante la festa dell'Akitu (Capodanno) proprio per riaffermare la supremazia di Marduk come dio principale del pantheon babilonese e, per estensione, la supremazia politica di Babilonia stessa sulle città mesopotamiche rivali, rendendo questo mito della creazione al tempo stesso narrazione cosmologica e propaganda di stato.<br><br><b>Curiosità:</b> La storia di Tiamat è ampiamente considerata dagli studiosi biblici come condivisa da profonde connessioni strutturali e persino linguistiche con la narrazione della creazione all'inizio del Libro della Genesi — la parola ebraica \"tehom\" (\"l'abisso\", riferita alle acque primordiali in Genesi 1:2) è linguisticamente correlata a \"Tiamat\", suggerendo che questo mito della creazione mesopotamico abbia direttamente influenzato o condiviso radici mitologiche comuni del Vicino Oriente antico con il racconto biblico della creazione.",
  "Vritra": "Nella tradizione vedica indiana, Vritra è il serpente cosmico che tratteneva tutte le acque del mondo imprigionandole nel proprio corpo: Indra lo sconfisse con il vajra, il fulmine forgiato dagli dèi, liberando finalmente i fiumi per l'umanità.<br><br><b>Il mito completo:</b> Secondo il Rig Veda (uno dei testi religiosi sopravvissuti più antichi dell'umanità), Vritra nacque specificamente per custodire e accumulare le acque cosmiche, creando una siccità devastante che minacciava l'intera creazione; Indra, re degli dèi vedici, richiese l'assistenza del dio Vishnu e del saggio Dadhichi, che sacrificò volontariamente le proprie ossa (ritenute indurite e potenziate dalle sue pratiche spirituali ascetiche) per essere forgiate nel vajra, l'arma-fulmine capace infine di trafiggere la forma altrimenti invulnerabile di Vritra; alla sconfitta di Vritra, le acque cosmiche imprigionate furono rilasciate, scorrendo a nutrire il mondo.<br><br><b>Contesto culturale:</b> Il mito di Vritra rappresenta una delle narrazioni cosmologiche più centrali e frequentemente richiamate del Rig Veda, fondativa per l'intera tradizione religiosa vedica — il titolo di Indra \"Vritrahan\" (\"Uccisore di Vritra\") divenne uno dei suoi epiteti più importanti, e il mito veniva inteso come fondativo del principio cosmico fondamentale dell'ordine (rita) che trionfa sul caos e sulla stagnazione, un tema centrale che attraversa tutto lo sviluppo filosofico e religioso indù successivo.<br><br><b>Curiosità:</b> Linguisti e mitologi comparati hanno a lungo notato sorprendenti parallelismi strutturali tra il mito del combattimento Vritra-Indra e altre narrazioni indoeuropee di \"dio della tempesta che uccide il serpente/drago cosmico\" presenti in culture apparentemente scollegate — inclusa la battaglia greca Zeus-Tifone (trattata in precedenza in questa collezione) e gli scontri norreni di Thor con Jörmungandr — suggerendo che questi miti paralleli possano condividere un'origine comune genuinamente antica nella mitologia proto-indoeuropea, precedente alla divergenza storica di queste culture ormai ampiamente separate di migliaia di anni.",
  "Quetzalcoatl": "Il Serpente Piumato, una delle divinità più importanti del pantheon azteco e mesoamericano: signore del vento, della conoscenza e della stella del mattino, si narra abbia donato agli uomini il mais e l'arte della scrittura.<br><br><b>Il mito completo:</b> Secondo uno dei miti più importanti, Quetzalcoatl discese personalmente nel Mictlan, il regno dei morti, per recuperare le ossa delle generazioni precedenti di umanità, distrutte nei cicli cosmici passati; bagnando quelle ossa frantumate con il proprio sangue in un atto di autosacrificio, diede vita all'umanità attuale. In un altro celebre ciclo mitico, Quetzalcoatl fu ingannato dal proprio rivale divino Tezcatlipoca, che lo fece ubriacare e commettere atti vergognosi (talvolta descritti come unirsi con la propria sorella); sopraffatto dalla vergogna, Quetzalcoatl si autoesiliò, navigando verso est su una zattera di serpenti intrecciati, promettendo di tornare un giorno.<br><br><b>Contesto culturale:</b> La profezia del ritorno di Quetzalcoatl ebbe conseguenze storiche reali e drammatiche: alcune cronache (la cui accuratezza storica resta dibattuta tra gli storici moderni) suggeriscono che l'imperatore azteco Montezuma II possa aver inizialmente associato l'arrivo del conquistador spagnolo Hernán Cortés nel 1519 al ritorno profetizzato del dio, un possibile fattore (tra molti altri, militari e politici) nella caduta dell'impero azteco.<br><br><b>Curiosità:</b> Quetzalcoatl prende il nome dal quetzal, un uccello dalle piume verdi smeraldo lunghissime sacro ai maya e agli aztechi, e dal termine coatl, \"serpente\" — la sua immagine, un serpente ricoperto di piume, sopravvive ancora oggi come uno dei simboli mesoamericani più immediatamente riconoscibili a livello globale, raffigurato sulle rovine del Templo Mayor di Città del Messico e su innumerevoli opere d'arte moderne ispirate alla cultura azteca.",
  "Ladone": "Drago dalle cento teste che non dormiva mai, posto a guardia del giardino delle Esperidi e dei suoi pomi d'oro: sconfiggerlo (o aggirarlo con l'inganno, secondo alcune versioni) fu l'undicesima fatica di Eracle.<br><br><b>Il mito completo:</b> Figlio di Tifone ed Echidna (secondo alcune fonti) o di Forco e Ceto (secondo altre), Ladone custodiva il melo dai frutti d'oro che Gaia aveva donato a Era per le sue nozze con Zeus. Per la sua undicesima fatica, Eracle doveva procurarsi quei pomi. La versione più diffusa non lo vede uccidere il drago di persona: si accordò invece con il titano Atlante, che reggeva il cielo sulle spalle e conosceva bene il giardino, essendo padre delle Esperidi. Eracle sostenne temporaneamente il peso del cielo al posto di Atlante, che andò a cogliere i pomi personalmente, per poi essere ingannato dall'eroe e costretto a riprendersi il proprio fardello. In altre versioni, più dirette, Eracle uccise Ladone stesso con una freccia intinta nel sangue dell'Idra. Dopo la sua morte, Era pose il drago tra le stelle come costellazione.<br><br><b>Contesto culturale:</b> Il giardino delle Esperidi, collocato ai confini occidentali del mondo conosciuto, rappresentava per i Greci un vero e proprio paradiso irraggiungibile — lo stesso tema ricorrente del tesoro perfetto e custodito che ritroviamo nel Vello d'Oro. Ladone incarna la vigilanza assoluta ed eterna: non dormiva mai, un dettaglio che sottolinea quanto l'impresa fosse quasi impossibile.<br><br><b>Curiosità:</b> Alcune fonti antiche descrivono Ladone con fino a cento teste, ciascuna capace di parlare con una voce diversa — un parallelo diretto con la descrizione di Tifone stesso, a conferma della loro parentela. La costellazione del Draco, che si snoda tra l'Orsa Maggiore e l'Orsa Minore, fu identificata dagli astronomi antichi proprio con la collocazione eterna di Ladone nel cielo.",
  "Karkinos": "Granchio gigante mandato da Era stessa in soccorso dell'Idra durante lo scontro con Eracle, pizzicandogli un piede per distrarlo dalla battaglia: l'eroe lo schiacciò con un colpo di tallone, ma la dea, riconoscente per la sua fedeltà, lo pose in cielo come costellazione — il Cancro.<br><br><b>Il mito completo:</b> Il ruolo di Karkinos nel mito è breve, quasi comico: pizzicare il piede di Eracle a metà battaglia contro l'Idra, per poi essere schiacciato senza sforzo sotto un tallone. Eppure, nonostante non abbia ottenuto praticamente nulla, Era lo elevò al cielo puramente per gratitudine verso la sua lealtà e la sua disponibilità a combattere una battaglia disperata contro un eroe di gran lunga superiore, indipendentemente dall'esito.<br><br><b>Contesto culturale:</b> La costellazione del Cancro, una delle meno appariscenti dello zodiaco (composta da stelle deboli e poco visibili), ha a lungo lasciato perplessi astronomi e classicisti sul motivo della sua inclusione tra le dodici costellazioni zodiacali — alcuni studiosi suggeriscono che la sua collocazione rifletta più la personale vendetta di Era contro Eracle (premiando chiunque, per quanto inefficacemente, si fosse opposto a lui) che l'effettiva importanza mitologica del granchio.<br><br><b>Curiosità:</b> Il segno astrologico del Cancro, che governa chi è nato sotto di esso (21 giugno–22 luglio nell'astrologia moderna), trae l'intera propria tradizione simbolica da questo episodio mitologico relativamente minore e quasi tragicomico — uno degli esempi più chiari di come un dettaglio mitologico molto piccolo possa generare un'enorme rilevanza culturale duratura attraverso la propria eredità astronomica.",
  "Anzu": "Uccello tempesta dalla testa leonina, nato dalle acque primordiali: rubò le Tavole del Destino dal palazzo di Enlil, scatenando il caos nell'ordine cosmico finché un dio guerriero non lo abbatté per restituirle.<br><br><b>Il mito completo:</b> Dopo aver rubato le Tavole del Destino dal palazzo di Enlil mentre il dio faceva il bagno (cogliendolo in un momento di vulnerabilità), Anzu fuggì verso un rifugio montano, e gli dèi radunati, terrorizzati dall'affrontare direttamente un essere ora potenziato dall'autorità cosmica concessa dalle Tavole, faticarono a trovare un campione disposto ad affrontarlo — diversi dèi principali rifiutarono a quanto pare il compito prima che il dio della tempesta Ninurta (in alcune versioni, o Marduk nelle successive rielaborazioni babilonesi) accettasse infine, sconfiggendo alla fine Anzu in duello singolo (a volte tramite frecce che Anzu poteva inizialmente deviare grazie al potere di controllo del vento concesso dalle Tavole rubate, finché il vento stesso non venne in qualche modo rivoltato contro di lui) e restituendo le Tavole al loro legittimo posto.<br><br><b>Contesto culturale:</b> Il mito di Anzu riflette un'ansia religiosa mesopotamica antica più ampia sulla genuina fragilità dell'ordine cosmico — le Tavole del Destino rappresentavano la fonte letterale dell'autorità divina legittima stessa, e il loro furto (anche temporaneo) minacciava di disfare l'intera gerarchia cosmica e politica stabilita, richiedendo un intervento eroico attivo per ripristinare il giusto ordine.<br><br><b>Curiosità:</b> Anzu viene talvolta paragonato visivamente e concettualmente dagli studiosi moderni al più tardo e ben più celebre mito greco di Prometeo che ruba il fuoco — entrambi i miti sono incentrati su un essere che ruba qualcosa di immensa importanza cosmica agli dèi al potere, suggerendo un possibile schema narrativo più ampio del Vicino Oriente antico e del Mediterraneo sui miti del furto del potere cosmico, che potrebbe aver influenzato più tradizioni mitologiche geograficamente distanti in modo indipendente o attraverso contatti culturali.",
  "Nue": "Chimera dal grido spettrale — testa di scimmia, corpo di tanuki, zampe di tigre, coda di serpente — che si posava sui tetti imperiali portando malattia e sventura, finché l'arciere Minamoto no Yorimasa non la trafisse nel buio.<br><br><b>Il mito completo:</b> Secondo l'Heike Monogatari (un'importante cronaca epica giapponese medievale), il Nue aveva tormentato l'Imperatore Konoe con una misteriosa malattia causata dalle sue grida notturne echeggianti dal tetto del palazzo, finché l'abile arciere Minamoto no Yorimasa, guidato da un'insolita nube nera che incombeva minacciosamente sul palazzo, non abbatté la creatura nell'oscurità totale usando solo suono e istinto per mirare; dopo che la freccia di Yorimasa colpì nel segno, il suo servitore I no Hayata finì la creatura con la spada, e il suo corpo fu a quanto pare posto in un tronco cavo e lasciato alla deriva su un fiume, dato che persino il suo cadavere era considerato troppo pericoloso o di cattivo auspicio per essere sepolto a terra.<br><br><b>Contesto culturale:</b> Il grido distintivo e profondamente inquietante del Nue (tradizionalmente paragonato al richiamo di un uccello reale specifico, il tordo dorato, noto in giapponese come \"nue-dori\") riflette una più ampia tradizione yokai giapponese di associare suoni naturali particolarmente sinistri al terrore soprannaturale — il nome stesso della creatura deriva dal richiamo di questo uccello, il che significa che il Nue rappresenta una mitologia costruita direttamente sull'interpretazione di un suono naturale inquietante reale come prova di presenza soprannaturale.<br><br><b>Curiosità:</b> La specifica composizione ibrida a quattro animali del Nue (testa di scimmia, corpo di tanuki/cane procione, arti di tigre, coda di serpente) lo ha reso un soggetto particolarmente popolare e visivamente distintivo nell'arte, nei giochi e negli adattamenti mediatici giapponesi moderni — la sua combinazione di quattro animali giapponesi completamente diversi e individualmente ordinari in un'unica chimera visivamente sorprendente lo rende strutturalmente paragonabile (seppur sviluppato indipendentemente) ad altri mostri chimerici composti presenti nella mitologia mondiale, inclusa l'antica Chimera greca trattata in precedenza in questa collezione.",
  "Sfinge": "Custode enigmatica delle porte di Tebe, poneva a ogni viandante il celebre indovinello sull'essere che cammina su quattro, due e tre gambe: chi falliva veniva divorato, finché Edipo non trovò la risposta giusta.<br><br><b>Il mito completo:</b> Figlia di Echidna, la Sfinge fu inviata da Era (o da Ares, secondo altre versioni) a tormentare Tebe come punizione per un'antica colpa della città. Si appostò su una rupe fuori dalle mura e a ogni viandante poneva lo stesso indovinello, tramandato dalle Muse: \"Qual è l'essere che al mattino cammina su quattro zampe, a mezzogiorno su due, e alla sera su tre?\" Chi non sapeva rispondere veniva strangolato e divorato all'istante. Edipo, in fuga da Corinto, diede la risposta corretta — l'uomo, che gattona da neonato, cammina eretto da adulto e si appoggia a un bastone da vecchio — e la Sfinge, sconfitta, si gettò dalla rupe togliendosi la vita.<br><br><b>Contesto culturale:</b> A differenza della Sfinge egizia — quasi sempre maschile, benevola, simbolo del potere regale e associata ai faraoni — la Sfinge greca era una figura femminile e mostruosa, corpo di leone, ali d'aquila e volto di donna, incarnazione greca del fascino (e del pericolo) dell'enigma irrisolto. La sua sconfitta per mano di Edipo, che vince grazie alla ragione e non alla forza, rappresenta simbolicamente il trionfo dell'intelletto umano sul caos mostruoso.<br><br><b>Curiosità:</b> Il nome \"Sfinge\" deriva probabilmente dal verbo greco sphíngein, \"strangolare\" — un richiamo diretto al suo modo di uccidere le vittime. Colpisce il netto contrasto di genere tra le due tradizioni: la Sfinge greca è quasi sempre femminile, quella egizia quasi sempre associata a un potere maschile — uno degli esempi più chiari di come una stessa figura mitologica possa assumere connotazioni morali e simboliche opposte passando da una cultura vicina a un'altra.",
  "Rakshasa": "Demoni mutaforma della tradizione indiana, un tempo esseri nobili corrotti dall'orgoglio: vagano di notte tra le foreste, capaci di assumere qualsiasi aspetto per ingannare mortali e asceti.<br><br><b>Il mito completo:</b> I Rakshasa compaiono in modo prominente in tutta la letteratura epica indù, più celebremente come la principale forza antagonista del Ramayana — il re rakshasa Ravana, sovrano di Lanka, rapisce Sita, la moglie di Rama, scatenando il conflitto centrale dell'epopea; lo stesso Ravana viene descritto paradossalmente sia come un genuino e colto studioso bramino e devoto adoratore di Shiva, sia con la sua natura mostruosa da rakshasa e le sue molteplici teste e braccia, incarnando la più ampia complessità folkloristica dei rakshasa come esseri capaci di un genuino compimento spirituale corrotto da orgoglio e desiderio incontrollati, piuttosto che dalla semplice e non complicata malvagità.<br><br><b>Contesto culturale:</b> L'estesa mitologia dei rakshasa nel Ramayana (Ravana e la sua estesa corte ed esercito rakshasa) stabilì uno dei modelli più influenti della letteratura indù per raffigurare antagonisti moralmente complessi — figure dotate di genuino potere, talvolta persino pietà o dottrina, la cui rovina deriva specificamente da una corruzione morale interna (orgoglio eccessivo, desiderio o ego) piuttosto che da una mostruosità innata e non complicata, uno schema di caratterizzazione sfumato che influenzò la successiva tradizione letteraria e teatrale dell'Asia meridionale e sudorientale in senso più ampio.<br><br><b>Curiosità:</b> La mitologia dei rakshasa del Ramayana si diffuse e si adattò attraverso un'enorme estensione geografica e culturale grazie all'influenza culturale indù-buddhista — versioni dell'epopea, inclusi i suoi antagonisti rakshasa, compaiono in forme locali adattate in tutto il sud-est asiatico (il Ramakien thailandese, il Kakawin Ramayana indonesiano e altri), il che significa che la mitologia dei rakshasa raggiunse una portata culturale genuinamente transnazionale in tutta l'Asia, estendendosi ben oltre le regioni a maggioranza indù dell'Asia meridionale specificamente.",
  "Wendigo": "Spirito insaziabile dei boschi innevati dei popoli algonquini, incarnazione della fame e dell'inverno: si narra che chiunque ceda alla disperazione e al cannibalismo rischi di trasformarsi lui stesso in uno di essi.<br><br><b>Il mito completo:</b> Secondo la tradizione algonquina, il Wendigo nasceva quando un essere umano, spinto dalla fame estrema durante i rigidi inverni nordamericani, ricorreva al cannibalismo per sopravvivere — un atto che secondo la credenza tradizionale trasformava progressivamente la persona in un mostro dallo scheletro sporgente e dalla pelle tesa sulle ossa, condannato a una fame perpetua e mai saziabile: più il Wendigo divorava, più la sua fame cresceva, in un ciclo di consumo senza fine che rifletteva simbolicamente l'avidità e l'eccesso portati alle estreme conseguenze.<br><br><b>Contesto culturale:</b> Il mito del Wendigo serviva un genuino scopo di sopravvivenza comunitaria: rinforzava il tabù assoluto contro il cannibalismo anche nelle condizioni di carestia più estreme, e riflette i valori algonquini sulla condivisione delle risorse e sulla responsabilità collettiva durante gli inverni più duri, quando la sopravvivenza dell'intero gruppo dipendeva dalla cooperazione piuttosto che dall'egoismo individuale.<br><br><b>Curiosità:</b> Il concetto di \"psicosi da Wendigo\" fu effettivamente discusso in letteratura antropologica ed etnopsichiatrica del XX secolo come possibile sindrome culturalmente specifica legata a episodi storici di cannibalismo da carestia — un'interpretazione oggi considerata controversa e criticata da molti studiosi indigeni contemporanei, che sottolineano come questa lettura clinica abbia talvolta distorto e decontestualizzato un mito ricco di significato morale e comunitario, riducendolo a una semplice curiosità psichiatrica occidentale.",
  "Manticora": "Bestia persiana dal volto d'uomo, corpo di leone e coda irta di aculei velenosi: divora la preda per intero, ossa comprese, senza lasciare traccia del banchetto.<br><br><b>Il mito completo:</b> La prima descrizione occidentale della manticora proviene dal medico greco Ctesia, vissuto alla corte persiana achemenide nel V secolo a.C., che la descrisse riportando racconti di viaggiatori sull'India come dotata di tre file di denti aguzzi disposti come quelli di uno squalo e capace di scagliare gli aculei velenosi della propria coda come frecce a distanza, per poi farne ricrescere di nuovi immediatamente; il suo nome stesso deriva dal persiano antico martiya-khvar, che significa letteralmente \"mangiatore di uomini\", un'etimologia che riflette direttamente la sua natura predatoria specificamente rivolta contro l'umanità.<br><br><b>Contesto culturale:</b> La manticora appartiene a un più ampio genere letterario persiano e greco-persiano di \"meraviglie dei confini del mondo conosciuto\" — descrizioni di creature esotiche provenienti da terre remote (in questo caso l'India, ai margini orientali del mondo persiano conosciuto), che mescolavano osservazioni reali distorte con elaborazione fantastica progressiva nel corso di generazioni di racconti tramandati.<br><br><b>Curiosità:</b> La manticora ha avuto una delle vite più lunghe e durature tra i mostri \"geografici\" di origine persiana, sopravvivendo praticamente immutata nei bestiari medievali europei e comparendo ancora oggi come creatura ricorrente in giochi di ruolo e opere fantasy contemporanee, quasi 2500 anni dopo la prima descrizione di Ctesia.",
  "Peryton": "Cervo alato che proietta, curiosamente, l'ombra di un uomo anziché la propria: le leggende marinaresche lo vogliono cacciatore di naufraghi lungo le coste dell'Atlantico.<br><br><b>Il mito completo:</b> Secondo la tradizione (in gran parte di formazione relativamente moderna, sebbene presentata spesso come antica), il peryton nacque dalle anime dei viaggiatori morti lontano dalla propria terra natale senza mai potervi fare ritorno, condannati a vagare in forma di cervo alato fino a quando non avessero ucciso un essere umano — solo uccidendo una vittima umana il peryton avrebbe potuto finalmente riacquisire la propria ombra originaria, quella umana, e trovare pace; questo dettaglio della doppia ombra (proiettando quella di un uomo pur avendo corpo di cervo) lo rende una delle creature più visivamente e concettualmente insolite del bestiario leggendario mondiale.<br><br><b>Contesto culturale:</b> Il peryton, a differenza di molte altre creature di questa collezione con radici in testi antichi verificabili, è ampiamente considerato dai folkloristi moderni una creazione letteraria relativamente recente piuttosto che un'autentica tradizione popolare medievale o classica — uno strumento utile per illustrare come non tutte le \"leggende antiche\" apparenti abbiano davvero origini storiche profonde quanto sembrerebbero suggerire.<br><br><b>Curiosità:</b> Il peryton viene generalmente attribuito allo scrittore argentino Jorge Luis Borges, che lo descrisse nel suo celebre \"Manuale di zoologia fantastica\" (1957) presentandolo come creatura di tradizione antica — un caso affascinante e ben documentato di \"falsa etimologia mitologica\" letteraria, in cui un'invenzione dichiaratamente originale di un autore del Novecento è stata successivamente ripresa, ricopiata e diffusa in innumerevoli bestiari e opere fantasy moderne come se fosse un'autentica leggenda medievale.",
  "Qilin": "Creatura d'auspicio della tradizione cinese, così delicata da non calpestare mai un filo d'erba: la sua apparizione annuncia la nascita o la morte di un grande saggio.<br><br><b>Il mito completo:</b> Secondo la tradizione, un Qilin apparve alla madre di Confucio poco prima della sua nascita, portandole un pezzo di giada incisa che profetizzava la grandezza del bambino che stava per nascere; un altro Qilin sarebbe apparso e sarebbe stato ferito o ucciso poco prima della morte del saggio stesso, un presagio che Confucio interpretò come segno che la sua epoca e la sua missione stavano per concludersi. Descritto tipicamente con corpo di cervo o cavallo, squame simili a quelle di un drago o di un pesce, e spesso un singolo corno (in alcune raffigurazioni più tarde, specialmente durante la dinastia Ming, il Qilin venne visivamente confuso e fuso con le raffigurazioni delle giraffe portate dall'Africa come tributo, data la somiglianza del nome con quello swahili \"giraffa\").<br><br><b>Contesto culturale:</b> Il Qilin rappresentava nella filosofia cinese tradizionale l'incarnazione stessa della benevolenza (ren), il principio confuciano centrale di gentilezza e virtù morale — la sua celebre delicatezza nel non calpestare nemmeno un filo d'erba o ferire alcuna creatura vivente lo rendeva un simbolo perfetto degli ideali etici confuciani applicati letteralmente al comportamento fisico di un essere mitologico.<br><br><b>Curiosità:</b> La confusione storica tra Qilin e giraffa durante la dinastia Ming è documentata concretamente: quando l'ammiraglio Zheng He riportò una vera giraffa dall'Africa orientale alla corte imperiale cinese nel 1414, fu accolta e celebrata pubblicamente come un autentico Qilin, un presunto segno di buon auspicio per il regno dell'imperatore Yongle — uno dei rari casi documentati nella storia in cui un animale reale, appena scoperto da una cultura, venne temporaneamente identificato con una creatura mitologica preesistente.",
  "Garuda": "Re di tutti gli uccelli nella mitologia indiana, cavalcatura del dio Vishnu e acerrimo nemico dei serpenti Naga, dai quali liberò la propria madre ridotta in schiavitù.<br><br><b>Il mito completo:</b> Secondo il Mahabharata, la madre di Garuda, Vinata, perse una scommessa contro la rivale co-moglie Kadru (madre dei Naga, esseri-serpente) dopo essere stata ingannata riguardo al colore della coda di un cavallo divino, e di conseguenza fu resa schiava di Kadru e dei Naga; il giovane Garuda, venuto a conoscenza della schiavitù della madre, negoziò con i Naga per la sua libertà, ottenendola infine recuperando con successo l'amrita (l'elisir dell'immortalità) dagli dèi per loro conto — un compito che richiese di combattere attraverso i guardiani celesti di Indra, sebbene alla fine si alleò con Indra in seguito, restituendo l'amrita agli dèi prima che i Naga potessero consumarlo permanentemente, adempiendo così alla lettera del proprio patto pur impedendo ai serpenti di ottenere una vera immortalità, e guadagnandosi il favore di Vishnu e il suo eventuale ruolo di cavalcatura prescelta del dio.<br><br><b>Contesto culturale:</b> Garuda detiene un significato religioso e persino nazionale importante in tutta l'Asia meridionale e sudorientale, che si estende ben oltre la sola mitologia indù — Garuda è il simbolo nazionale dell'Indonesia e della Thailandia, e la compagnia aerea nazionale indonesiana si chiama letteralmente Garuda Indonesia, riflettendo quanto profondamente questa figura mitologica originariamente indù sia diventata integrata nell'identità nazionale di più stati moderni, inclusa l'Indonesia a maggioranza musulmana, dimostrando una notevole resistenza simbolica interreligiosa e interculturale.<br><br><b>Curiosità:</b> L'iconica inimicizia di Garuda con i Naga (esseri-serpente) riflette uno schema ricorrente più ampio nella mitologia indù e buddhista di conflitto aquila/uccello contro serpente presente in numerose tradizioni mitologiche mondiali non correlate (parallelo, strutturalmente se non storicamente, all'aquila del precedente Zeus greco e vari miti di conflitto con serpenti, o alla faida cosmologica norrena aquila-contro-Nidhogg trattata nelle schede precedenti) — suggerendo uno schema mitologico umano ricorrente più ampio che associa cielo/altezza con serpenti/terra come naturali opposti simbolici in culture sviluppate indipendentemente in tutto il mondo.",
  "Ammit": "Divoratrice dei cuori giudicati indegni nella sala del giudizio di Osiride — testa di coccodrillo, corpo di leonessa, zampe posteriori d'ippopotamo — l'incubo di ogni anima egizia in cerca dell'aldilà.<br><br><b>Il mito completo:</b> Nella \"Pesatura del Cuore\", la cerimonia centrale del Libro dei Morti egizio, il cuore del defunto veniva posto su una bilancia contro la piuma di Maat, dea della verità e dell'ordine cosmico: se il cuore, appesantito dai peccati commessi in vita, pesava più della piuma, Ammit lo divorava all'istante, condannando l'anima non alla dannazione eterna in senso occidentale, ma a una \"seconda morte\" — la completa e definitiva cancellazione dall'esistenza, considerata dagli egizi una sorte ben peggiore di qualunque punizione infernale, poiché privava l'anima persino della possibilità di continuare a esistere in qualunque forma.<br><br><b>Contesto culturale:</b> Ammit rappresentava l'antitesi assoluta di maat, il concetto egizio fondamentale di verità, ordine ed equilibrio cosmico: la sua natura ibrida (combinando i tre animali egizi considerati più pericolosi — coccodrillo, leone e ippopotamo) la rendeva la personificazione stessa del caos che attende chi vive in modo scorretto, un monito etico incorporato direttamente nella teologia funeraria quotidiana.<br><br><b>Curiosità:</b> A differenza di quasi ogni altra divinità egizia, non esistono templi dedicati al culto di Ammit, né sacerdoti che la venerassero direttamente — esisteva esclusivamente come figura del giudizio finale nell'aldilà, mai come oggetto di preghiera o richiesta di favore in vita, rendendola forse l'unica grande figura del pantheon egizio concepita puramente come minaccia e mai come possibile alleata.",
  "Zmey Gorynych": "Drago slavo a tre teste sputafuoco, terrore delle terre della Rus': solo un eroe capace di reciderle tutte e tre insieme, senza dare tempo alla rigenerazione, poteva sperare di abbatterlo.<br><br><b>Il mito completo:</b> Protagonista di numerose bylini (i poemi epici popolari russi), Zmey Gorynych compare più celebremente nel racconto dell'eroe Dobrynja Nikitič, che affronta il drago dopo il rapimento della nipote del principe Vladimir (in altre versioni, varie principesse vengono regolarmente richieste in tributo dal drago per risparmiare un intero regno). Dobrynja sconfigge il drago usando un cappello magico riempito di sabbia (un cappello di \"terra greca\" donatogli dalla madre) come arma e scudo insieme, abbattendolo prima che possa rigenerarsi. In altre bylini, l'eroe Il'ja Muromec affronta similmente il drago a difesa di Kiev.<br><br><b>Contesto culturale:</b> Come uno dei villain più iconici dell'intero corpus della poesia epica russa (le bylini), Zmey Gorynych funzionava in modo simile a come i draghi operano in molte altre epiche culturali — un'incarnazione della minaccia caotica ed esterna contro cui un eroe nazionale o regionale dimostra la propria legittimità ed eroismo, spesso legato alla difesa di una città specifica (frequentemente Kiev) trattata come il cuore simbolico delle terre della Rus'.<br><br><b>Curiosità:</b> A differenza dei draghi dell'Europa occidentale, tipicamente sconfitti con un singolo colpo decisivo o un trucco astuto, il requisito specifico di Zmey Gorynych di \"recidere tutte le teste simultaneamente\" (dato che qualunque singola testa recisa sarebbe altrimenti ricresciuta) riflette un'enfasi folkloristica ricorrente slava orientale sull'impegno totale e schiacciante verso un compito, piuttosto che l'aggiramento astuto — un ideale eroico sottilmente diverso dagli schemi dell'eroe-imbroglione più comuni in altre tradizioni mitologiche.",
  "Kraken": "Colosso degli abissi scandinavi, così vasto da essere scambiato per un'isola dai marinai incauti che vi gettavano l'ancora: quando si risveglia, trascina intere navi negli abissi con i suoi tentacoli.<br><br><b>Il mito completo:</b> La tradizione del Kraken è in realtà più tarda rispetto al nucleo della mitologia norrena antica propriamente detta — si sviluppa principalmente attraverso il folklore scandinavo medievale e della prima età moderna, e la sua descrizione più dettagliata si deve al vescovo norvegese Erik Pontoppidan nella sua \"Storia Naturale della Norvegia\" del 1755, dove lo descrive con sorprendente serietà scientifica come una creatura marina reale, seppur raramente avvistata, corredando il racconto di presunte testimonianze di pescatori su pesche improvvisamente abbondanti attribuite proprio al risveglio del Kraken dagli abissi.<br><br><b>Contesto culturale:</b> A differenza della maggior parte dei mostri puramente mitologici, il Kraken occupa uno spazio unico tra folklore e primi tentativi di criptozoologia e storia naturale — naturalisti del XVIII secolo presero sul serio i racconti al punto da discuterne la plausibilità biologica, probabilmente influenzati da incontri reali, seppur esagerati, dei marinai con veri calamari giganti, la cui esistenza non fu confermata scientificamente che molto più tardi.<br><br><b>Curiosità:</b> Il Kraken ispirò direttamente la celebre poesia \"The Kraken\" di Alfred Lord Tennyson del 1830 e divenne in seguito uno degli archetipi mostruosi più duraturi della cultura popolare moderna (film, videogiochi), rendendolo uno dei rari casi in cui la fama moderna di una figura mitologica di area norrena supera di gran lunga il suo ruolo relativamente modesto nell'autentica tradizione testuale norrena medievale.",
  "Behemoth": "Bestia primordiale di terra descritta nel Libro di Giobbe, dalla forza incontenibile e le ossa come sbarre di bronzo: creata il quinto giorno insieme al suo contraltare marino, il Leviatano.<br><br><b>Il mito completo:</b> Nel Libro di Giobbe (capitolo 40), Dio stesso descrive il Behemoth direttamente a Giobbe come esempio della propria potenza creativa incomprensibile alla mente umana, sottolineando che solo il Creatore stesso può avvicinarsi alla bestia senza timore — una descrizione che nella tradizione ebraica successiva venne interpretata sia letteralmente (identificando il Behemoth con animali reali come l'ippopotamo o l'elefante) sia simbolicamente, come rappresentazione del caos primordiale terrestre destinato, secondo alcune tradizioni rabbiniche successive, a essere servito come pasto ai giusti nel banchetto messianico alla fine dei tempi.<br><br><b>Contesto culturale:</b> Behemoth e Leviatano insieme rappresentano nella teologia biblica ed ebraica successiva i due poli del caos primordiale — terra e mare — entrambi creati da Dio ma tenuti sotto il suo controllo assoluto, un tema che rifletteva la convinzione teologica secondo cui persino le forze più incontrollabili e minacciose dell'universo restano comunque subordinate alla sovranità divina.<br><br><b>Curiosità:</b> Il termine \"Behemoth\" è entrato nel linguaggio comune di molte lingue moderne, incluso l'italiano, come sinonimo generico per qualunque cosa di dimensioni o potenza straordinariamente grandi — uno dei numerosi esempi in questa collezione di un nome mitologico religioso antico sopravvissuto nel vocabolario quotidiano contemporaneo, ormai quasi del tutto separato dal suo specifico contesto biblico originario.",
  "Bahamut": "Pesce colossale della cosmologia islamica, così immenso che nessun occhio mortale può abbracciarne l'intera forma: sul suo dorso poggia un toro, e sul toro l'intera Terra.<br><br><b>Il mito completo:</b> Secondo alcune cosmografie islamiche medievali, in particolare quelle influenzate dalla tradizione persiana e dal pensatore Al-Qazwini, la Terra intera poggia su un toro colossale di nome Kuyuta o Kujata, che a sua volta poggia sul dorso ancora più vasto di Bahamut, un pesce le cui dimensioni sono tali che l'intero oceano cosmico in cui nuota apparirebbe come una minuscola goccia se paragonato alla sua reale immensità — una cosmologia a strati concentrici in cui ogni elemento successivo (Terra, toro, pesce) supera in scala quello precedente in modo quasi incomprensibile alla mente umana.<br><br><b>Contesto culturale:</b> Questa cosmologia a strati riflette un più ampio tentativo medievale islamico di conciliare l'osservazione scientifica e astronomica con l'immaginazione cosmologica religiosa — un tentativo di dare struttura fisica e ordine visualizzabile a un universo la cui vastità reale iniziava già a essere intuita, seppur non ancora compresa nei termini della moderna astronomia.<br><br><b>Curiosità:</b> Il nome \"Bahamut\" ha avuto una notevole seconda vita nella cultura popolare moderna attraverso i giochi di ruolo fantasy (in particolare Dungeons & Dragons e la serie di videogiochi Final Fantasy), dove è diventato quasi universalmente reinterpretato come un drago colossale anziché un pesce — una trasformazione quasi completa del concetto originale che pochi giocatori moderni riconoscerebbero collegata alla sua vera origine cosmologica islamica medievale.",
  "Cipactli": "Mostro primordiale dalla forma di coccodrillo-pesce, che nuotava solitario nelle acque prima della creazione: gli dèi aztechi lo smembrarono per plasmare cielo e terra dal suo corpo.<br><br><b>Il mito completo:</b> Alcune tradizioni azteche identificano Cipactli come una figura strettamente correlata o addirittura identica a Tlaltecuhtli nel racconto della creazione, mentre altre lo descrivono come un essere primordiale distinto, un mostro ibrido tra coccodrillo, pesce e rospo che nuotava solo nell'oceano cosmico prima che esistesse qualunque terra ferma. Il suo smembramento da parte di Quetzalcoatl e Tezcatlipoca segnò l'inizio letterale del mondo materiale come lo conoscevano gli aztechi, con il suo corpo trasformato nella superficie terrestre stessa, ancora considerata \"viva\" e capace di provocare terremoti quando la si immaginava muoversi o lamentarsi.<br><br><b>Contesto culturale:</b> Cipactli dà anche il nome al primo giorno del calendario rituale azteco di 260 giorni, il tonalpohualli — ogni giorno di questo calendario portava il nome di un diverso simbolo o creatura, e l'apertura della sequenza con Cipactli riflette la sua posizione fondamentale come primissimo essere dell'era della creazione presente.<br><br><b>Curiosità:</b> La sovrapposizione concettuale tra Cipactli e Tlaltecuhtli in diverse fonti azteche è un esempio notevole di come la mitologia mesoamericana, tramandata attraverso molteplici tradizioni orali regionali prima della documentazione coloniale spagnola, potesse contenere versioni parallele e non sempre perfettamente coerenti dello stesso mito fondamentale, senza che questo fosse percepito come una contraddizione dagli stessi aztechi.",
  "Grendel": "Orrore delle paludi che per dodici anni terrorizzò la sala di Heorot, divorando i guerrieri danesi nel sonno, finché l'eroe Beowulf non gli strappò il braccio a mani nude.<br><br><b>Il mito completo:</b> Secondo il poema epico Beowulf, Grendel discendeva dalla stirpe di Caino, il primo assassino della tradizione biblica, condannato all'esilio eterno tra le paludi come progenitore di mostri, giganti ed elfi malvagi — una genealogia che fonde esplicitamente la mitologia pagana germanica con la teologia cristiana. Dopo che Beowulf gli strappa il braccio a mani nude durante un duello notturno in Heorot, Grendel fugge morente nella propria tana palustre; sua madre, sconvolta dal dolore e dalla vendetta, attacca a sua volta la sala la notte seguente, costringendo Beowulf a inseguirla fino alla sua tana sommersa per un secondo, ancora più pericoloso duello sott'acqua.<br><br><b>Contesto culturale:</b> Beowulf, composto probabilmente tra l'VIII e l'XI secolo, rappresenta uno dei rarissimi esempi sopravvissuti di epica germanica pagana trascritta da scribi cristiani, che intrecciarono deliberatamente temi eroici pre-cristiani (coraggio, lealtà, fama guerriera) con una cornice teologica biblica — Grendel stesso incarna questa fusione, un mostro dalle radici pagane ma dall'origine biblica esplicitamente cristiana.<br><br><b>Curiosità:</b> L'unico manoscritto medievale superstite di Beowulf sopravvisse per puro caso a un devastante incendio della biblioteca Cotton a Londra nel 1731, che distrusse numerosi altri manoscritti antichi inglesi — se quel singolo esemplare fosse andato perduto, l'intera storia di Grendel e Beowulf, fondamento della letteratura inglese antica, sarebbe oggi completamente sconosciuta.",
  "Typhon": "Il più mostruoso tra i figli di Gaia, cento teste di drago sulle spalle e fuoco negli occhi: sfidò Zeus per il trono dell'Olimpo, e solo il fulmine del re degli dèi riuscì infine a seppellirlo sotto l'Etna.<br><br><b>Il mito completo:</b> Figlio di Gaia e Tartaro, generato appositamente dalla Terra per vendicare la sconfitta dei Titani contro gli Olimpi, Tifone fu descritto da Esiodo come dotato di cento teste di serpente, occhi di fuoco e una voce capace di imitare qualunque suono. Si unì a Echidna, generando insieme a lei quasi tutti i grandi mostri della mitologia greca: Cerbero, l'Idra, la Chimera, la Sfinge, Ladone, Orto. Quando attaccò l'Olimpo, la sua potenza fu tale che gli altri dèi fuggirono terrorizzati fino in Egitto, trasformandosi in animali per nascondersi — un mito che gli scrittori greci successivi usarono per spiegare le divinità egizie dalla testa animale. Zeus alla fine lo sconfisse in una battaglia epica, colpendolo ripetutamente con i fulmini, e lo seppellì sotto il monte Etna in Sicilia: la sua perenne attività vulcanica veniva attribuita ai movimenti di Tifone ancora intrappolato sotto la montagna.<br><br><b>Contesto culturale:</b> Tifone rappresentava la minaccia ultima al kosmos, l'ordine cosmico stesso — il momento più vicino, in tutta la mitologia greca, a un vero pericolo esistenziale per gli dèi. La sua sconfitta consolidò definitivamente il regno incontrastato di Zeus come sovrano del cosmo.<br><br><b>Curiosità:</b> La parola inglese \"typhoon\" (e l'italiano \"tifone\") derivano quasi certamente dal nome di Tifone, attraverso il persiano e l'arabo prima di tornare in greco — una delle eredità linguistiche più chiare della mitologia greca dei mostri, sopravvissuta nel linguaggio quotidiano moderno per descrivere esattamente il tipo di potenza caotica che gli antichi Greci attribuivano a Tifone.",
  "Fenrir": "Lupo gigante figlio di Loki, incatenato dagli dèi con un laccio magico forgiato dai nani: le profezie lo vogliono libero al Ragnarök, destinato a divorare Odino stesso nello scontro finale.<br><br><b>Il mito completo:</b> Gli dèi, temendo le profezie sul ruolo distruttivo di Fenrir, lo allevarono tra loro ma divennero sempre più diffidenti verso la sua crescita rapida e la sua forza. Tentarono di legarlo due volte con catene ordinarie, che egli spezzò senza sforzo entrambe le volte (lasciandolo fare, lodandone pubblicamente la forza, per mascherare la propria paura). Infine i nani forgiarono Gleipnir, un legaccio magico fatto di sei ingredienti impossibili — il rumore dei passi di un gatto, la barba di una donna, le radici di una montagna, i tendini di un orso, il respiro di un pesce e la saliva di un uccello — apparentemente un sottile nastro di seta, ma indistruttibile. Fenrir, sospettoso di un legaccio dall'aspetto così fragile, accettò di farsi legare solo a condizione che un dio mettesse una mano nella sua bocca come garanzia di buona fede: solo Tyr, dio della legge e del coraggio, si offrì volontario. Quando Fenrir scoprì di non potersi liberare, morse via la mano di Tyr per vendetta — spiegando così l'iconica menomazione del dio nell'iconografia norrena. Fenrir resterà legato fino al Ragnarök, quando si libererà, ucciderà Odino inghiottendolo intero, e sarà a sua volta ucciso dal figlio di Odino, Víðarr, che gli squarcia le fauci.<br><br><b>Contesto culturale:</b> L'incatenamento di Fenrir, e in particolare il sacrificio di Tyr, viene spesso letto come una riflessione sul prezzo del mantenimento dell'ordine cosmico e sociale — la vera legge e il rispetto dei giuramenti (dominio di Tyr) richiedono un sacrificio autentico e non possono essere ottenuti solo con l'inganno, senza un costo reale.<br><br><b>Curiosità:</b> La parola \"fenrisulfr\" (\"lupo di Fenrir\") ha dato il nome a numerosi riferimenti culturali moderni, e il dettaglio specifico dei sei ingredienti impossibili di Gleipnir è un motivo ricorrente che gli studiosi collegano a schemi diffusi di folklore sulla \"prova impossibile\" presenti in molte mitologie del mondo, non esclusivi della tradizione norrena.",
  "Sekhmet": "Dea leonessa della guerra e della peste, inviata da Ra a punire l'umanità ribelle: la sua sete di sangue fu placata solo con l'inganno, facendole bere birra tinta di rosso al posto del sangue umano.<br><br><b>Il mito completo:</b> Secondo il \"Libro della Vacca Celeste\", Ra, ormai anziano, scoprì che gli uomini tramavano contro di lui e inviò il proprio occhio, incarnato in Hathor, a punirli sotto forma della leonessa Sekhmet. La dea si scatenò con una furia tale da rischiare di sterminare l'intera umanità, tanto che persino Ra si pentì della propria decisione. Per fermarla, gli dèi fecero fermentare enormi quantità di birra tingendola di rosso con ocra o ematite, così da farla sembrare sangue, e la versarono sui campi che Sekhmet avrebbe attraversato: credendola sangue umano, la dea la bevve avidamente fino a ubriacarsi e addormentarsi, risvegliandosi placata e trasformata nella più mite Hathor.<br><br><b>Contesto culturale:</b> Questo mito spiegava rituale e calendario reali: la festa egizia dell'ubriachezza (celebrata in onore di Hathor/Sekhmet) rievocava annualmente proprio questo salvataggio dell'umanità attraverso il bere, con partecipanti che si ubriacavano ritualmente per rivivere simbolicamente il momento in cui la furia divina fu placata.<br><br><b>Curiosità:</b> Migliaia di statue di Sekhmet furono commissionate dal faraone Amenofi III, forse addirittura più di settecento, una per ogni giorno dell'anno secondo alcune ipotesi, con l'intento di placare rualmente la dea e proteggere il regno dalla peste e dalla guerra — rendendola una delle divinità egizie più massicciamente rappresentate nella scultura monumentale sopravvissuta fino a oggi.",
  "Apophis": "Il grande serpente del caos, nemico eterno di Ra: ogni notte attende la barca solare nelle acque del Duat, e ogni notte gli dèi devono respingerlo perché l'alba possa sorgere ancora.<br><br><b>Il mito completo:</b> Ogni notte, mentre la barca solare di Ra attraversava il Duat (l'oltretomba egizio) nel suo viaggio verso una nuova alba, Apopi tentava di inghiottirla, talvolta provocando eclissi o tempeste quando sembrava sul punto di riuscirci. Gli dèi della barca solare, in particolare Seth (che nonostante la sua reputazione di dio del caos era paradossalmente il principale difensore di Ra contro una minaccia ancora più grande) e la dea Bastet sotto forma di gatta, combattevano Apopi ogni singola notte per garantire che il sole sorgesse di nuovo. Gli antichi egizi partecipavano attivamente a questa battaglia cosmica attraverso un rituale chiamato \"Il Libro dell'Abbattimento di Apopi\", in cui sacerdoti recitavano incantesimi, sputavano, calpestavano ed effettivamente bruciavano o distruggevano fisicamente immagini cerose del serpente per aiutare magicamente gli dèi nella lotta notturna.<br><br><b>Contesto culturale:</b> Apopi rappresentava per gli egizi non un nemico da sconfiggere definitivamente, ma una minaccia cosmica eterna e mai risolta — a differenza di molti miti in cui il mostro viene ucciso una volta per tutte, la battaglia contro Apopi doveva essere combattuta e vinta ogni singola notte per l'eternità, riflettendo la visione egizia del mondo come equilibrio costantemente minacciato tra ordine (maat) e caos (isfet).<br><br><b>Curiosità:</b> I rituali contro Apopi non erano semplice narrazione religiosa ma pratica magica attivamente eseguita: templi in tutto l'Egitto conservavano statuette cerose del serpente specificamente create per essere rituali distrutte ogni giorno, rendendo Apopi uno dei rari mostri mitologici mondiali contro cui i credenti comuni partecipavano attivamente a un rito di combattimento quotidiano, non solo a una narrazione passiva.",
  "Taotie": "Volto vorace scolpito sugli antichi bronzi rituali cinesi, simbolo di un'ingordigia così grande da essere condannato a divorare persino se stesso.<br><br><b>Il mito completo:</b> Il motivo del Taotie compare sui bronzi rituali cinesi fin dalla dinastia Shang (circa 1600-1046 a.C.), rendendolo uno dei motivi decorativi più antichi e duraturi dell'intera arte cinese, con oltre tremila anni di storia. Secondo la tradizione successiva, il Taotie era uno dei \"Quattro Mostri Malvagi\" della mitologia cinese, spesso descritto come un figlio degenere di un antico sovrano, così vorace ed egoista da essere condannato dagli dèi a possedere solo una testa gigantesca senza corpo, incapace mai di saziarsi davvero della propria fame insaziabile — alcune versioni narrano che continuasse a divorare persino la propria stessa carne nel disperato tentativo di placare l'appetito.<br><br><b>Contesto culturale:</b> Nonostante la sua natura mostruosa e vorace, il Taotie decorava proprio i vasi rituali usati nelle cerimonie sacrificali e nei banchetti religiosi cinesi più solenni — probabilmente inteso come monito visivo contro l'eccesso e l'ingordigia proprio nel momento del consumo di cibo e bevande, un promemoria etico incorporato direttamente nell'oggetto usato per il rituale stesso.<br><br><b>Curiosità:</b> Il termine \"taotie\" viene ancora oggi usato in cinese colloquiale come sinonimo di \"goloso\" o \"ingordo\" — uno dei rari casi in questa collezione in cui il nome di un mostro mitologico antico di tremila anni resta una parola viva e comunemente usata nel linguaggio quotidiano contemporaneo, non relegata a un uso puramente accademico o narrativo.",
  "Tengu": "Spirito alato dei monti giapponesi, maestro di arti marziali e maestro dell'inganno, temuto e rispettato allo stesso tempo dai monaci delle vette.<br><br><b>Il mito completo:</b> La credenza sui Tengu si evolse significativamente nel corso della storia giapponese — originariamente importati dal folklore cinese come demoni puramente malevoli e forieri di calamità (il nome stesso deriva dal cinese \"tiangou\", \"cane celeste\", associato a meteore e disastri), si trasformarono gradualmente nella tradizione giapponese in figure moralmente più ambigue, persino rispettate, associate all'ascetismo buddhista di montagna (la pratica yamabushi) — alcuni Tengu, in particolare i potenti \"daitengu\" (grandi Tengu) dal volto rosso e dal lungo naso, furono reimmaginati come spiriti guardiani protettivi, seppur dispettosi, delle montagne sacre, talvolta persino insegnando arti marziali o scherma a studenti umani meritevoli in varie leggende, incluso il racconto semi-leggendario del famoso guerriero Minamoto no Yoshitsune che imparò la scherma dai Tengu sul Monte Kurama da bambino.<br><br><b>Contesto culturale:</b> L'evoluzione del Tengu da demone della calamità puramente malevolo di derivazione cinese al complesso e moralmente ambiguo guardiano delle montagne giapponese riflette uno schema storico più ampio di sincretismo religioso giapponese, in cui concetti religiosi e folkloristici asiatici continentali importati (buddhismo, folklore cinese) furono gradualmente reinterpretati e fusi con credenze shintoiste native sulle montagne sacre (culto yamabushi) in una sintesi religioso-folkloristica distintamente giapponese.<br><br><b>Curiosità:</b> Le maschere Tengu (caratterizzate dal distintivo lungo naso rosso del personaggio) restano oggetti estremamente popolari e riconoscibili nei festival giapponesi moderni, nel teatro tradizionale (in particolare in certe rappresentazioni Noh e Kyogen) e nella cultura popolare in generale — rendendo il Tengu una delle figure yokai (creature soprannaturali) più visivamente iconiche e immediatamente riconoscibili nell'identità culturale giapponese contemporanea, ben oltre la conoscenza folkloristica specialistica.",
  "Vila": "Ninfa dei boschi e dei venti dei Balcani, danzatrice leggiadra capace di scatenare tempeste contro chi ne turba la quiete notturna.<br><br><b>Il mito completo:</b> Le Vile (al plurale) abitano boschi, montagne, nuvole e acque in tutto il folklore slavo meridionale (balcanico) — particolarmente ricco nella tradizione serba, croata, bosniaca e bulgara — apparendo come donne bellissime ed eteree dai lunghi capelli fluenti, spesso alate o capaci di trasformarsi in cigni, cavalli, lupi o falchi. Sono abili guaritrici e figure profetiche, a volte amiche o persino sorelle giurate di eroi mortali (il leggendario eroe serbo principe Marko si dice avesse una vila sorella giurata, Vila Ravijojla, che lo aiutò in battaglia) — ma difendono ferocemente le proprie danze private (il kolo, una tradizionale danza in cerchio) presso sorgenti sacre o radure boschive, e un mortale che si imbatte e disturba la loro danza notturna rischia di essere fatto danzare fino allo sfinimento e alla morte, o colpito da malattia improvvisa o zoppia (\"colpito dalla vila\", una diagnosi popolare per certi disturbi inspiegabili).<br><br><b>Contesto culturale:</b> La duplice natura della vila — guaritrice e alleata benevola da un lato, guardiana pericolosamente vendicativa degli spazi naturali sacri dall'altro — riflette uno schema popolare slavo meridionale più ampio di spiriti della natura che richiedono una navigazione attenta e rispettosa, piuttosto che una semplice categorizzazione come puramente buoni o puramente malvagi.<br><br><b>Curiosità:</b> La vila resta oggi un riferimento culturale genuinamente vivo in tutti i Balcani — il termine compare in numerosi toponimi regionali, e le tradizioni di medicina popolare serba attribuivano storicamente certe malattie specificamente all'aver offeso una vila, con i guaritori popolari che talvolta eseguivano rituali specifici volti a placare lo spirito offeso piuttosto che trattare direttamente i sintomi fisici.",
  "Púca": "Spirito mutaforma delle campagne irlandesi, capace di assumere le sembianze di cavallo, capra o coniglio per guidare i viandanti fuori strada — mai per vera cattiveria, solo per gioco.<br><br><b>Il mito completo:</b> Il púca si riteneva particolarmente attivo e pericoloso intorno a Samhain (il 31 ottobre, la festività celtica che si è poi evoluta in Halloween), quando il confine tra il mondo umano e l'Altro Mondo si riteneva più sottile; i contadini lasciavano tradizionalmente l'ultimo raccolto nei campi proprio come offerta al púca (\"la parte del púca\"), poiché non farlo rischiava di far calpestare, rovinare o sputare dal púca sul raccolto rimanente, rendendolo immangiabile. Nonostante la sua natura da imbroglione, alcuni racconti descrivono il púca capace di offrire profezie o consigli genuinamente utili a chi riusciva a catturarlo o a fargli amicizia, e in un racconto celebre aiuta un pigro garzone a diventare industrioso attraverso un intervento soprannaturale.<br><br><b>Contesto culturale:</b> Il púca incarna uno schema folkloristico distintamente irlandese/celtico di spiriti della natura \"pericolosi ma non veramente malvagi\" — a differenza dei mostri più puramente malevoli, rappresenta l'imprevedibilità capricciosa e in ultima analisi amorale della natura selvaggia, non la crudeltà deliberata, richiedendo rispetto e negoziazione attenta (come lasciare offerte del raccolto) piuttosto che una sconfitta totale.<br><br><b>Curiosità:</b> La parola inglese \"puck\" (come il dispettoso personaggio fatato di Shakespeare nel Sogno di una notte di mezza estate) si ritiene derivi direttamente da púca — il che significa che questa specifica figura folkloristica celtica ha plasmato direttamente uno dei personaggi più famosi dell'intero canone letterario inglese.",
  "Iku-Turso": "Mostro marino dai mille tentacoli del Kalevala finlandese, generato dalle profondità gelide del Mar Baltico.<br><br><b>Il mito completo:</b> Nel Kalevala, l'epica nazionale finlandese compilata da Elias Lönnrot nel XIX secolo da fonti orali popolari preesistenti, Iku-Turso compare come una minaccia marina evocata durante uno scontro magico tra gli eroi del poema e la strega Louhi, signora del gelido regno settentrionale di Pohjola — il mostro emerge dalle acque per attaccare il bestiame costiero, ma viene infine respinto o sconfitto attraverso incantesimi rituali recitati dagli eroi del poema, uno dei numerosi episodi in cui il Kalevala intreccia conflitto fisico e potere magico verbale come armi equivalenti.<br><br><b>Contesto culturale:</b> Il Kalevala stesso rappresenta un caso unico nella storia della letteratura mondiale: un'epica nazionale compilata e in parte ricostruita nell'Ottocento da un singolo studioso, Lönnrot, che raccolse e tessé insieme canti popolari orali (runot) tramandati per secoli da cantori tradizionali careliani e finlandesi, creando un testo che divenne fondamentale per la costruzione dell'identità nazionale finlandese durante il periodo di dominio russo e svedese.<br><br><b>Curiosità:</b> Il Kalevala, e con esso figure come Iku-Turso, influenzò direttamente e profondamente J.R.R. Tolkien, che studiò la lingua finlandese specificamente per poter leggere il poema in originale e ne trasse ispirazione strutturale e linguistica significativa per la creazione del proprio universo della Terra di Mezzo — rendendo questo mostro marino finlandese, indirettamente, parte della genealogia creativa dell'intero genere fantasy moderno.",
  "Aitvaras": "Drago domestico delle case lituane che porta fortuna e ricchezza a chi lo ospita, ma pretende in cambio un uovo nero da mangiare ogni notte.<br><br><b>Il mito completo:</b> Secondo la tradizione lituana, un Aitvaras può nascere da un uovo nero deposto da un gallo di sette o nove anni (un evento raro e insolito considerato di per sé un presagio soprannaturale), oppure può essere acquistato dal diavolo in cambio della propria anima — un'origine ambigua che rifletteva l'ambivalenza morale della ricchezza improvvisa e apparentemente immeritata portata dalla creatura. Un Aitvaras che entrava in una nuova casa portava tipicamente prosperità rubando segretamente grano, oro o altri beni dalle case dei vicini, trasferendo così ricchezza da una famiglia all'altra piuttosto che generandola dal nulla.<br><br><b>Contesto culturale:</b> Il mito dell'Aitvaras riflette un'ambiguità morale genuina nel folklore agricolo lituano riguardo alla ricchezza improvvisa e sproporzionata: un vicino inaspettatamente prospero veniva talvolta sospettato dalla comunità di ospitare un Aitvaras, un modo popolare di spiegare (e implicitamente criticare) disuguaglianze economiche altrimenti inspiegabili all'interno di comunità rurali tradizionalmente egualitarie.<br><br><b>Curiosità:</b> Sbarazzarsi di un Aitvaras indesiderato era considerato estremamente difficile secondo la tradizione popolare — uno dei pochi metodi ritenuti efficaci era dargli fuoco insieme al fienile in cui si era stabilito, un rimedio drastico che rifletteva quanto profondamente la creatura si legasse alla proprietà che aveva scelto di infestare.",
  "Cacus": "Gigante sputafuoco che viveva in una caverna sull'Aventino, sconfitto da Ercole dopo aver rubato parte del suo bestiame e nascosto le tracce all'incontrario.<br><br><b>Il mito completo:</b> Figlio di Vulcano (dio del fuoco, da cui la sua capacità di sputare fiamme), Caco viveva in una caverna sul colle Aventino, in un paesaggio che sarebbe poi diventato Roma stessa — uno dei miti fondativi pre-romani della città, ambientato proprio nel luogo geografico esatto della futura urbe. Quando Ercole passò di lì con il bestiame di Gerione (rubato per la sua decima fatica), Caco sottrasse alcuni buoi mentre l'eroe dormiva, trascinandoli astutamente all'indietro per la coda dentro la caverna, così che le impronte sembrassero condurre lontano dal suo covo anziché dentro di esso. Ercole sarebbe stato completamente ingannato, se non fosse stato per il muggito di uno dei buoi rimasti, in risposta alle grida di quelli nascosti, che tradì la posizione di Caco: Ercole sfondò la caverna (alcune versioni narrano che squarciò l'intero fianco della montagna) e lo strangolò.<br><br><b>Contesto culturale:</b> Questo mito era particolarmente importante per l'identità civica romana perché ambientato esattamente nel sito della futura area del Foro Romano — l'Ara Massima si diceva fondata dallo stesso Ercole proprio lì per commemorare la propria vittoria — e Virgilio lo racconta in modo prominente nell'Eneide proprio per legare l'antico eroismo di Ercole direttamente alla geografia sacra di Roma, decenni prima della fondazione di Romolo.<br><br><b>Curiosità:</b> L'Ara Massima descritta in questo mito era un altare reale e storicamente documentato, esistito davvero nella Roma antica presso il Foro Boario (il mercato del bestiame) — il che significa che questo mito non era puramente letterario ma legato a un sito religioso fisico e realmente visitato, che i Romani potevano attraversare e toccare, rafforzando la realtà civica del mito nella vita quotidiana romana.",
  "Zipacna": "Gigante del Popol Vuh maya capace di sollevare intere montagne in una sola notte, sconfitto con l'astuzia dagli eroi gemelli Hunahpú e Ixbalanqué.<br><br><b>Il mito completo:</b> Figlio del malvagio Vucub-Caquix, Zipacna si vantava di aver creato personalmente ogni montagna della terra, e uccise i Quattrocento Ragazzi (Ixbalanqué e i suoi compagni mitici) dopo che questi tentarono di ucciderlo per invidia della sua forza, schiacciandoli sotto una casa che stava aiutando a costruire. Gli Eroi Gemelli, decisi a vendicare i Quattrocento Ragazzi, escogitarono una trappola: costruirono un falso granchio gigante e lo posizionarono in fondo a un burrone, sapendo che Zipacna, ghiotto di granchi, si sarebbe infilato là sotto per catturarlo; quando il gigante si chinò a raccoglierlo, gli Eroi Gemelli fecero crollare l'intera montagna sopra di lui, uccidendolo e vendicando così i Quattrocento Ragazzi.<br><br><b>Contesto culturale:</b> Il ciclo di Zipacna e Vucub-Caquix nel Popol Vuh rappresenta una serie di episodi in cui l'astuzia intellettuale degli Eroi Gemelli trionfa ripetutamente sulla forza bruta e sull'arroganza di esseri primordiali sovrannaturali — uno schema narrativo centrale nella cosmologia maya, che prepara il terreno per la successiva creazione dell'umanità \"corretta\" fatta di mais.<br><br><b>Curiosità:</b> Il Popol Vuh, il testo sacro K'iche' maya che racconta queste storie, sopravvisse alla distruzione coloniale spagnola solo perché trascritto in caratteri latini da un sacerdote maya cristianizzato nel XVI secolo, basandosi su un testo geroglifico originale ormai perduto — rendendo l'intero ciclo di Zipacna uno dei rarissimi corpi mitologici mesoamericani sopravvissuti in forma narrativa relativamente completa, a differenza della maggior parte delle mitologie precolombiane, andate quasi interamente perdute nella conquista.",
  "Xolotl": "Dio-sciacallo azteco, gemello di Quetzalcoatl, guida delle anime nel pericoloso viaggio verso il Mictlan, il regno dei morti.<br><br><b>Il mito completo:</b> Nello stesso mito della creazione dell'umanità attuale narrato nella scheda di Quetzalcoatl, fu proprio Xolotl ad accompagnare il fratello nel viaggio verso il Mictlan per recuperare le ossa delle generazioni umane precedenti — quando il signore dei morti tentò di ingannarli negando loro il permesso di portar via le ossa, fu la scaltrezza di Xolotl (secondo alcune versioni) a permettere la fuga riuscita con il prezioso carico, nonostante un inseguimento che causò la caduta e la frantumazione parziale delle ossa, spiegando così perché gli esseri umani abbiano dimensioni diverse tra loro.<br><br><b>Contesto culturale:</b> Xolotl era anche associato al pianeta Venere nella sua fase di stella della sera (mentre Quetzalcoatl rappresentava la stessa Venere come stella del mattino), formando con il fratello gemello una coppia cosmologica che rifletteva il doppio aspetto dello stesso corpo celeste — luce che precede l'alba contro luce che segue il tramonto, vita contro morte, ordine contro il regno oscuro dell'oltretomba.<br><br><b>Curiosità:</b> La razza canina messicana Xoloitzcuintli (il \"cane nudo messicano\") prende il proprio nome direttamente da Xolotl, ritenuto nell'antica religione azteca capace di guidare le anime dei defunti attraverso il pericoloso viaggio verso il Mictlan — una credenza che sopravvive ancora oggi in alcune tradizioni popolari messicane, dove questi cani vengono considerati portatori di significato spirituale legato all'aldilà.",
  "Curupira": "Guardiano della foresta amazzonica dai piedi rivolti all'indietro, per confondere chi tenta di seguirne le tracce e proteggere gli alberi dai cacciatori avidi.<br><br><b>Il mito completo:</b> Il Curupira viene tradizionalmente descritto come un ragazzo o un piccolo uomo dai capelli rossi fiammeggianti, capace di emettere un fischio acuto e inquietante udibile a grande distanza nella foresta; i cacciatori tradizionalmente offrivano tabacco o cachaça (un distillato brasiliano) prima di addentrarsi nella foresta, come tributo per ottenere il permesso implicito di cacciare senza incorrere nella sua ira, e chiunque cacciasse più selvaggina del necessario per la propria sopravvivenza rischiava di essere punito dal Curupira con lo smarrimento permanente nella foresta.<br><br><b>Contesto culturale:</b> Il Curupira incarna un principio ecologico tradizionale fondamentale delle popolazioni indigene e caboclas amazzoniche: la caccia era considerata legittima solo entro i limiti della necessità di sussistenza, non dell'eccesso o dello spreco — un'etica ambientale integrata direttamente nella narrazione mitologica, secoli prima che il concetto moderno di conservazione ambientale venisse formalizzato scientificamente.<br><br><b>Curiosità:</b> Il Curupira è stato adottato ufficialmente come simbolo e mascotte da diverse iniziative brasiliane di protezione ambientale e forestale nel corso del XX secolo, inclusa una storica campagna dell'ente ambientale governativo brasiliano — un esempio diretto di come questa antica figura folkloristica sia stata consapevolmente reimpiegata dallo stato moderno come strumento di educazione ambientale contemporanea.",
  "Muldjewangk": "Creatura del fiume Murray custodita nei racconti aborigeni australiani, che trascina sott'acqua chi si avvicina troppo incautamente alla riva.<br><br><b>Il mito completo:</b> Legata specificamente al fiume Murray, il corso d'acqua più lungo dell'intera Australia e via d'acqua fondamentale per numerose nazioni aborigene lungo il suo percorso, la Muldjewangk veniva tradizionalmente descritta come una presenza acquatica in grado di generare correnti improvvise e pericolose, capace di trascinare sott'acqua chi si sporgeva troppo vicino alla riva o entrava in acqua senza il dovuto rispetto per il fiume stesso, considerato un'entità viva e potente nella cosmologia delle popolazioni aborigene locali.<br><br><b>Contesto culturale:</b> Come il Bunyip, la Muldjewangk riflette la profonda relazione spirituale delle popolazioni aborigene australiane con corsi d'acqua specifici e nominati, considerati non semplici risorse naturali ma entità dotate di propria agenzia e carattere, richiedenti rispetto rituale e comportamentale specifico da parte di chiunque vi si avvicinasse.<br><br><b>Curiosità:</b> Ancora oggi, alcune comunità lungo il fiume Murray in Australia meridionale mantengono viva la tradizione della Muldjewangk come parte del proprio patrimonio culturale locale, con il racconto talvolta utilizzato in contesti educativi e turistici per trasmettere sia la sicurezza pratica sull'acqua sia il rispetto culturale per il significato spirituale del fiume presso le popolazioni aborigene della regione.",
  "Qalupalik": "Spirito marino artico dalla pelle verdastra che, nelle leggende Inuit, rapisce nella sua amauti i bambini troppo audaci sul ghiaccio sottile.<br><br><b>Il mito completo:</b> Secondo la tradizione Inuit, il Qalupalik indossa un'amauti, la tradizionale parka femminile Inuit dotata di un ampio cappuccio-marsupio usato normalmente dalle madri per trasportare i propri bambini piccoli — un dettaglio che rende la creatura ancora più inquietante, dato che utilizza uno strumento genitoriale familiare e protettivo per uno scopo esattamente opposto, rapendo i bambini incauti invece di proteggerli. I bambini rapiti venivano trascinati in profondità sott'acqua, dove secondo alcune tradizioni venivano trasformati essi stessi in Qalupalik nel corso del tempo.<br><br><b>Contesto culturale:</b> Come molte creature \"spauracchio\" presenti in tradizioni mondiali diverse (e come lo stesso Amarok visto in precedenza in questo lotto), il Qalupalik serviva un genuino scopo pratico di sicurezza infantile: insegnare ai bambini a mantenersi lontani dai bordi pericolosi del ghiaccio marino, dove la sottigliezza del ghiaccio rappresentava un rischio reale e mortale di annegamento nelle gelide acque artiche.<br><br><b>Curiosità:</b> Il Qalupalik resta oggi una figura educativa genuinamente utilizzata nelle comunità Inuit canadesi contemporanee: libri illustrati per bambini, programmi scolastici e persino episodi televisivi in lingua inuktitut continuano a impiegare il racconto del Qalupalik specificamente come strumento di educazione alla sicurezza sul ghiaccio, dimostrando una continuità diretta tra folklore antico e pedagogia pratica moderna.",
  "Amaru": "Serpente-drago sacro delle Ande, ponte mitico tra il mondo sotterraneo e quello celeste nella cosmologia Inca.<br><br><b>Il mito completo:</b> Nella cosmologia Inca, l'Amaru veniva concepito come un essere capace di muoversi tra i tre livelli del mondo andino — Ukhu Pacha (il mondo sotterraneo), Kay Pacha (il mondo presente) e Hanan Pacha (il mondo celeste superiore) — funzionando come un vero e proprio canale cosmico che collegava questi regni normalmente separati; secondo alcune tradizioni, i fulmini e i terremoti venivano interpretati come segni del movimento dell'Amaru tra questi livelli, un serpente le cui dimensioni e il cui potere erano considerati capaci di rimodellare fisicamente il paesaggio andino stesso.<br><br><b>Contesto culturale:</b> L'Amaru era considerato talmente centrale nella cosmologia Inca da dare il nome a diversi sovrani della dinastia imperiale, incluso Túpac Amaru, l'ultimo imperatore Inca indipendente giustiziato dagli spagnoli nel 1572 — un nome che sarebbe poi risuonato ancora secoli dopo attraverso Túpac Amaru II, leader di una delle più grandi ribellioni indigene contro il dominio coloniale spagnolo nel XVIII secolo.<br><br><b>Curiosità:</b> Il nome \"Amaru\" continua a essere invocato attivamente nella politica e nella cultura sudamericane contemporanee ben oltre il puro folklore — dal movimento rivoluzionario peruviano Túpac Amaru degli anni '80 al nome d'arte del rapper statunitense Tupac Shakur (scelto dal padre in omaggio diretto a Túpac Amaru II) — rendendo questa antica creatura mitologica andina una delle rare figure di questa collezione il cui nome risuona ancora oggi in contesti politici e culturali globali del tutto lontani dalla mitologia originaria.",
  "Melusine": "Fata dalla coda di serpente delle leggende francesi, capostipite di una nobile casata finché il suo segreto non fu scoperto e svelato dal marito.<br><br><b>Il mito completo:</b> Secondo la leggenda medievale più diffusa, Melusina accettò di sposare Raimondino di Lusignano a condizione che non la spiasse mai di sabato, giorno in cui si ritirava da sola per bagnarsi, trasformandosi temporaneamente dalla vita in giù in coda di serpente o di pesce; dopo anni di matrimonio felice e numerosi figli, la curiosità di Raimondino ebbe infine la meglio, e la spiò attraverso un foro nella porta, scoprendo il suo segreto — quando in seguito, durante un litigio pubblico, lui la definì impulsivamente \"vile serpente\", Melusina, tradita nella fiducia concessa, si trasformò in un drago alato e volò via per sempre, pur tornando secondo la leggenda a piangere sopra il castello di Lusignano ogni volta che uno dei suoi discendenti stava per morire.<br><br><b>Contesto culturale:</b> Il mito di Melusina fu attivamente coltivato e promosso dalla stessa casata reale di Lusignano nel Medioevo come propria leggenda fondativa dinastica, un esempio di come una famiglia nobiliare europea reale abbia deliberatamente adottato e diffuso un mito soprannaturale per legittimare e nobilitare le proprie origini storiche.<br><br><b>Curiosità:</b> Il logo della catena internazionale di caffè Starbucks, come già notato nella scheda dedicata alla Sirena greca, raffigura in realtà proprio una figura derivata dall'iconografia di Melusina più che dalle sirene classiche in senso stretto — gli storici del design confermano che l'immagine a due code utilizzata nel logo trae diretta ispirazione da xilografie medievali europee raffiguranti specificamente Melusina, non le sirene omeriche.",
  "Nidhogg": "Drago scandinavo che rode incessantemente le radici di Yggdrasil, l'albero cosmico che sostiene i nove mondi della mitologia norrena.<br><br><b>Il mito completo:</b> Nidhogg rode eternamente una delle tre radici di Yggdrasil, in particolare quella che si estende nel Niflheim, il regno primordiale di ghiaccio e nebbia; si dice che si nutra dei cadaveri di spergiuri, assassini e adulteri a Náströnd (\"la riva dei cadaveri\"), una sala dell'oltretomba riservata ai peggiori colpevoli. Mantiene una lunga e amara faida verbale con l'aquila senza nome appollaiata in cima a Yggdrasil, con gli insulti trasmessi avanti e indietro dallo scoiattolo Ratatoskr, che corre incessantemente su e giù per il tronco dell'albero proprio per alimentare il conflitto tra i due.<br><br><b>Contesto culturale:</b> Nidhogg rappresenta l'entropia e il decadimento che rodono eternamente le stesse fondamenta dell'ordine cosmico — nemmeno l'albero del mondo che sostiene tutti e nove i regni è al sicuro da una corrosione costante, riflettendo la visione cosmologica norrena più ampia secondo cui persino l'ordine attuale è temporaneo e destinato al crollo finale al Ragnarök.<br><br><b>Curiosità:</b> Il ruolo dello scoiattolo Ratatoskr come pettegolo malevolo, appositamente concepito per provocare conflitto tra Nidhogg e l'aquila, è uno dei dettagli più oscuramente comici della mitologia norrena — una piccola creatura apparentemente insignificante che lavora attivamente per peggiorare una faida cosmica già antica, a quanto pare per il puro divertimento del caos stesso.",
  "Zahhak": "Re persiano maledetto con due serpenti nati dalle sue stesse spalle, che pretendono ogni giorno il cervello di due giovani per essere placati.<br><br><b>Il mito completo:</b> Secondo lo Shahnameh, Zahhak era originariamente un principe arabo sedotto da Ahriman (il principio del male nella cosmologia zoroastriana) travestito da consigliere, che lo indusse a uccidere il proprio padre e usurpare il trono; Ahriman poi lo baciò sulle spalle sotto le sembianze di un medico, facendo crescere lì due serpenti neri che potevano essere placati solo nutrendoli quotidianamente con i cervelli di due giovani vittime — un cuoco compassionevole al servizio del palazzo iniziò segretamente a sostituire uno dei due cervelli richiesti ogni giorno con quello di una pecora, salvando così migliaia di giovani nel corso del regno di terrore di Zahhak, che durò secondo la leggenda circa mille anni.<br><br><b>Contesto culturale:</b> Zahhak fu infine sconfitto dall'eroe Fereydun, che lo incatenò eternamente sotto il Monte Damavand anziché ucciderlo — secondo la profezia zoroastriana, Zahhak si libererà proprio alla fine dei tempi per l'ultima battaglia apocalittica, rendendo il suo incatenamento non una sconfitta definitiva ma una prigionia temporanea in attesa dello scontro finale tra bene e male.<br><br><b>Curiosità:</b> Il Monte Damavand, dove secondo il mito Zahhak resta ancora incatenato, è una montagna vulcanica realmente esistente in Iran, il picco più alto del Medio Oriente — un ulteriore esempio, come già visto con l'Etna greco-romano per Tifone, di come le tradizioni mitologiche del Vicino Oriente e del Mediterraneo colleghino frequentemente mostri incatenati a vere formazioni vulcaniche, forse ispirate dall'attività sismica e termale osservabile in queste montagne.",
  "Yurlunggur": "Il grande Serpente Arcobaleno delle terre di Arnhem, creatore dei fiumi e delle piogge nella tradizione aborigena australiana, custode della vita stessa.<br><br><b>Il mito completo:</b> Nella tradizione delle popolazioni aborigene della Terra di Arnhem, nell'Australia settentrionale, Yurlunggur è associato al ciclo stagionale del monsone: durante il \"Tempo del Sogno\" (Dreamtime, il periodo cosmogonico primordiale della creazione), il grande serpente emerse dalla terra scavando i letti dei fiumi con il proprio corpo sinuoso, per poi risalire in cielo trasformandosi nell'arcobaleno stesso, che riappare visibilmente ogni volta che la pioggia segna il passaggio dalla stagione secca a quella umida — un fenomeno naturale osservabile reinterpretato come manifestazione diretta e ricorrente della presenza del serpente ancestrale.<br><br><b>Contesto culturale:</b> Il Serpente Arcobaleno (di cui Yurlunggur rappresenta una delle molte varianti regionali nominate in tutta l'Australia aborigena, ciascuna nazione con il proprio nome e dettagli specifici) è considerato una delle figure più diffuse e centrali dell'intera cosmologia aborigena australiana, spesso ritenuto responsabile non solo della creazione del paesaggio fisico ma anche dell'istituzione delle leggi sociali e cerimoniali fondamentali osservate dalle comunità.<br><br><b>Curiosità:</b> Il mito del Serpente Arcobaleno, e Yurlunggur specificamente nella tradizione della Terra di Arnhem, è considerato dagli antropologi tra le tradizioni religiose continuativamente praticate più antiche del mondo conosciuto, con alcune stime che collegano elementi della cosmologia del Serpente Arcobaleno a pratiche culturali aborigene risalenti a decine di migliaia di anni, rendendola una delle narrazioni mitologiche viventi più antiche dell'umanità ancora attivamente tramandata oggi.",
  "Tlaltecuhtli": "Mostruosa divinità azteca della terra, smembrata dagli dèi per dare forma al cielo e al mondo dal suo stesso corpo.<br><br><b>Il mito completo:</b> Secondo il mito azteco, Tlaltecuhtli nuotava nelle acque primordiali prima della creazione quando Quetzalcoatl e Tezcatlipoca, trasformatisi in serpenti giganti, la afferrarono e la spezzarono in due: dalla metà superiore del suo corpo crearono il cielo e la terra, mentre dalla metà inferiore formarono l'oltretomba. Furiosa e addolorata per lo smembramento, si dice che Tlaltecuhtli richiedesse cuori umani sacrificati e sangue per essere placata e continuare a fornire raccolti fertili — un mito che gli aztechi usavano per spiegare la necessità religiosa del sacrificio umano, ritenuto essenziale per mantenere in vita la terra stessa e prevenire il collasso del mondo.<br><br><b>Contesto culturale:</b> Il volto di Tlaltecuhtli, tipicamente raffigurato con una bocca spalancata simile a quella di un rospo o di un coccodrillo divoratore, ornava spesso la parte inferiore delle sculture e degli altari aztechi, rivolto verso il basso, verso la terra stessa — una posizione che riflette il suo ruolo di fondamento letterale e nutritivo, ma anche minaccioso, del mondo fisico su cui gli aztechi vivevano.<br><br><b>Curiosità:</b> Nel 2006, gli archeologi scoprirono a Città del Messico un monolite di Tlaltecuhtli di dimensioni straordinarie, tra le sculture aztechi meglio conservate mai ritrovate, sepolto vicino al Templo Mayor — una scoperta che riportò l'attenzione pubblica su questa divinità, rivelando dettagli iconografici precedentemente sconosciuti sulla sua rappresentazione rituale nell'antica Tenochtitlan.",
  "Rahu": "Testa demoniaca decapitata della mitologia indiana, che insegue eternamente Sole e Luna attraverso il cielo, causando le eclissi ogni volta che li raggiunge.<br><br><b>Il mito completo:</b> Secondo la mitologia indù, Rahu era originariamente un asura (demone) a pieno titolo che si travestì tra gli dèi durante la zangolatura dell'oceano cosmico di latte (Samudra Manthan) proprio per bere una porzione di amrita, l'elisir dell'immortalità distribuito tra gli dèi; il dio del sole Surya e il dio della luna Chandra notarono l'inganno e avvertirono Vishnu, che decapitò Rahu con la propria arma a disco prima che l'elisir potesse scendere completamente lungo la sua gola — ma poiché Rahu aveva già ingoiato abbastanza amrita da raggiungere un'immortalità parziale, la sua testa recisa sopravvisse in modo indipendente come Rahu, mentre il suo corpo divenne il demone separato Ketu, ed entrambi furono posti in cielo come spiegazione mitologica delle eclissi, con Rahu specificamente incolpato delle eclissi solari e lunari poiché la sua testa immortale e fluttuante insegue perpetuamente e inghiotte brevemente il sole e la luna per vendetta contro i due dèi che ne svelarono l'inganno.<br><br><b>Contesto culturale:</b> Rahu occupa una posizione genuinamente significativa nell'astrologia vedica (Jyotisha) come uno dei nove corpi celesti (\"Navagraha\", o \"nove pianeti/afferratori\") tracciati nella pratica astrologica indù tradizionale, nonostante non abbia alcuna esistenza astronomica fisica — Rahu viene invece calcolato matematicamente come \"nodo lunare nord\", il punto in cui il percorso orbitale della luna attraversa l'eclittica, il che significa che questa figura mitologica fu incorporata direttamente in un sofisticato sistema astronomico-astrologico tradizionale matematicamente preciso, tuttora attivamente usato e consultato da milioni di praticanti oggi.<br><br><b>Curiosità:</b> Il significato astrologico di Rahu e Ketu significa che questo antico demone mitologico delle eclissi resta genuinamente rilevante nella vita culturale e religiosa contemporanea dell'Asia meridionale ben oltre la curiosità storica — gli astrologi vedici oggi calcolano ancora la posizione precisa di Rahu per gli oroscopi personali, e specifici rituali religiosi (in particolare durante le vere eclissi solari o lunari) vengono ancora eseguiti in tutta l'India proprio per placarsi o proteggersi dalla tradizionalmente infausta influenza astrologica di Rahu.",
  "Baba Yaga": "Strega delle foreste slave che vive in una capanna su zampe di gallina, custode della soglia tra il mondo dei vivi e quello degli spiriti.<br><br><b>Il mito completo:</b> Baba Yaga compare in decine di fiabe russe (skazki) con ruoli straordinariamente vari, spesso contraddittori — a volte strega puramente malevola divoratrice di bambini, altre volte fonte genuinamente utile (seppur capricciosa ed esigente) di saggezza, oggetti magici o consigli cruciali per l'eroe, a patto che questi mostri il dovuto rispetto e risponda correttamente ai suoi indovinelli o completi i suoi compiti. La sua capanna, celebremente montata su zampe di gallina, può camminare e voltarsi verso i visitatori a comando (la formula tradizionale di richiamo è \"Capanna, capanna, volta le spalle alla foresta e la fronte a me\"), ed è spesso circondata da una staccionata di ossa umane sormontata da teschi con le orbite luminose di notte. Viaggia non su una scopa ma volando in un mortaio gigante, usando il pestello per guidarlo e una scopa per cancellare le proprie tracce.<br><br><b>Contesto culturale:</b> La natura moralmente ambigua di Baba Yaga (né strega puramente malvagia né vecchia puramente benevola, ma genuinamente entrambe a seconda di come viene avvicinata) la rende una delle figure di strega più psicologicamente complesse del folklore mondiale — incarna un ruolo di guardiana della soglia, che mette alla prova se un eroe merita di procedere oltre nell'ignoto magico o pericoloso, riflettendo uno schema narrativo distintamente slavo meno comune nelle tradizioni fiabesche occidentali più nettamente divise tra bene e male.<br><br><b>Curiosità:</b> Alcuni folkloristi e linguisti fanno risalire le origini di Baba Yaga a una figura molto più antica e precristiana di spirito della morte o degli antenati — la staccionata di ossa e le zampe di gallina della sua capanna (i pollai nell'architettura popolare slava venivano tradizionalmente costruiti su palafitte per proteggerli dall'umidità e dai parassiti, un dettaglio che alcuni studiosi ritengono abbia ispirato direttamente le \"zampe di gallina\") potrebbero riflettere tradizioni molto antiche di capanne funerarie o case degli spiriti ancestrali, precedenti alla sua caratterizzazione successiva come strega da fiaba.",
  "Anansi": "Ragno astuto delle tradizioni Akan dell'Africa occidentale, portatore di tutte le storie del mondo: le conquistò con l'inganno agli dèi stessi.<br><br><b>Il mito completo:</b> Secondo il mito più celebre, tutte le storie del mondo appartenevano in origine al dio del cielo Nyame, che si rifiutò di cederle finché Anansi non avesse portato quattro creature quasi impossibili da catturare: il leopardo Osebo dai denti affilati, i calabroni Mmoboro, la fata Mmoatia e il pitone Onini. Anansi riuscì con l'astuzia in ognuna delle imprese — convinse il pitone a misurarsi contro un ramo di bambù per stabilire chi fosse più lungo, legandolo mentre era disteso; intrappolò i calabroni facendoli riparare da una finta pioggia dentro una zucca; catturò il leopardo con una trappola scavata nel terreno; ingannò la fata offrendole una bambola di gomma appiccicosa. Colpito dall'astuzia di Anansi, Nyame gli cedette tutte le storie del mondo, che da allora in poi vengono chiamate \"storie del ragno\" in molte lingue Akan.<br><br><b>Contesto culturale:</b> Anansi rappresenta l'archetipo del \"trickster\" (l'imbroglione astuto) tanto centrale in molte tradizioni africane occidentali quanto in altre mitologie mondiali — un essere debole fisicamente che sopravvive e prospera esclusivamente grazie all'intelligenza, offrendo un modello narrativo di resistenza e ingegno per popolazioni storicamente prive di potere politico o militare diretto.<br><br><b>Curiosità:</b> I racconti di Anansi attraversarono l'Atlantico insieme alla tratta atlantica degli schiavi e sopravvissero, trasformandosi, nel folklore caraibico e afroamericano — il personaggio \"Br'er Rabbit\" del folklore del sud degli Stati Uniti condivide una parentela concettuale diretta con Anansi, e il nome stesso \"Anansi\" (o varianti come \"Nancy\") rimane tuttora riconosciuto in Giamaica e in altre isole caraibiche come figura folkloristica viva.",
  "Tikbalang": "Creatura filippina dalla testa equina e le gambe lunghissime, che confonde i viandanti nella giungla fino a farli tornare al punto di partenza.<br><br><b>Il mito completo:</b> Secondo la tradizione popolare filippina, un viandante che si accorge di essere stato disorientato da un Tikbalang può liberarsi dall'incantesimo indossando i propri vestiti al rovescio — un dettaglio folkloristico che condivide una sorprendente somiglianza concettuale con il rimedio popolare contro il Leshy slavo trattato in una scheda precedente, nonostante l'assenza di qualunque contatto storico diretto tra le due tradizioni. Altre tradizioni regionali suggeriscono che strappare uno dei lunghi peli dalla criniera del Tikbalang possa costringerlo a diventare un fedele servitore o cavalcatura del viandante che lo cattura.<br><br><b>Contesto culturale:</b> Il Tikbalang riflette un genuino motivo folkloristico filippino di \"spiriti dello smarrimento\" (simili concettualmente al concetto filippino di essere \"nawala\" o disorientato da uno spirito della natura) — un modo tradizionale di spiegare l'esperienza reale e comune di perdersi nella fitta giungla filippina, attribuendo la confusione non a un semplice errore umano di orientamento ma all'intervento deliberato di uno spirito dispettoso.<br><br><b>Curiosità:</b> Il rimedio del \"vestito al rovescio\" contro l'incantesimo disorientante compare, come notato, in tradizioni folkloristiche sorprendentemente distanti geograficamente (Filippine, Europa slava) senza alcun contatto storico diretto conosciuto tra loro — un caso interessante di quello che i folkloristi chiamano \"convergenza culturale\", in cui culture indipendenti sviluppano soluzioni simbolicamente simili a paure universalmente condivise sul disorientamento e la perdita del proprio senso di direzione.",
  "Impundulu": "Uccello del fulmine delle tradizioni zulu, il cui battito d'ali scatena tempeste e il cui becco d'argento porta malattia a chi lo caccia.<br><br><b>Il mito completo:</b> Nella tradizione zulu e in quella di altri popoli nguni dell'Africa meridionale, l'Impundulu veniva spesso descritto come il famiglio personale di una strega o stregone (in lingua zulu, umthakathi), tramandato di generazione in generazione all'interno della stessa famiglia; si diceva che l'uccello potesse assumere forma umana per sedurre le proprie vittime prima di prosciugarne il sangue, e che la sua fedeltà al padrone continuasse anche dopo la morte di quest'ultimo, passando all'erede successivo insieme al resto della sua eredità stregonesca.<br><br><b>Contesto culturale:</b> L'Impundulu resta una figura genuinamente rilevante nella medicina tradizionale e nella credenza popolare sudafricana contemporanea: guaritori tradizionali (sangoma) vengono ancora oggi occasionalmente consultati da famiglie che ritengono una malattia inspiegabile o una serie di sventure familiari dovute alla presenza attiva di un Impundulu, non semplice folklore relegato al passato.<br><br><b>Curiosità:</b> Nei tribunali sudafricani coloniali e post-coloniali, accuse legate all'Impundulu e alla stregoneria in generale sono comparse storicamente in casi legali reali, inclusi processi per omicidio in cui l'imputato sosteneva di aver agito per legittima difesa contro un presunto attacco stregonesco — un esempio notevole di come questa credenza tradizionale abbia intersecato direttamente il sistema giudiziario moderno, non solo la narrazione popolare.",
  "Menehune": "Piccolo popolo delle foreste hawaiiane, costruttori instancabili capaci di erigere templi e canali in una sola notte, prima dell'alba.<br><br><b>Il mito completo:</b> Secondo la tradizione hawaiiana, i Menehune lavoravano esclusivamente di notte e dovevano completare qualunque progetto costruttivo (dighe, canali per l'irrigazione, templi in pietra, i cosiddetti heiau) entro l'alba di un'unica notte, altrimenti l'opera veniva abbandonata incompleta per sempre; si diceva formassero lunghe catene umane per trasportare enormi pietre da cava a cava, passandosele di mano in mano lungo distanze considerevoli con una coordinazione ed efficienza sovrumane, sempre evitando accuratamente il contatto diretto con gli esseri umani hawaiiani ordinari.<br><br><b>Contesto culturale:</b> Diverse strutture reali di pietra hawaiiane, in particolare l'antico bacino piscicolo di Alekoko sull'isola di Kauai (noto anche come \"Stagno dei Menehune\"), vengono tradizionalmente attribuite alla costruzione dei Menehune — un caso in cui il mito viene usato per spiegare l'origine di opere ingegneristiche antiche reali e genuinamente impressionanti, la cui costruzione effettiva resta in parte poco documentata storicamente.<br><br><b>Curiosità:</b> Alcuni antropologi e storici hanno ipotizzato che il mito dei Menehune possa riflettere lontanamente il ricordo storico di un'ondata migratoria polinesiana precedente a quella dei diretti antenati degli hawaiiani moderni — una popolazione originaria progressivamente assorbita, marginalizzata o mitizzata dalle successive ondate migratorie, sebbene questa teoria resti dibattuta e non definitivamente confermata dall'archeologia hawaiiana contemporanea.",
  "Dokkaebi": "Spirito dispettoso del folklore coreano, dal singolo corno e dal bastone magico, che sfida i viandanti a duelli di lotta e indovinelli.<br><br><b>Il mito completo:</b> Secondo la tradizione coreana, il bastone magico (dokkaebi bangmangi) posseduto dal dokkaebi poteva evocare oggetti materializzandoli dal nulla con un semplice comando, rendendolo una figura ambigua capace tanto di dispetti quanto di autentica generosità verso chi riusciva a sconfiggerlo o a intrattenerlo adeguatamente — il dokkaebi amava particolarmente sfidare i viandanti a gare di forza fisica (spesso lotta tradizionale coreana, ssireum) o a scambi di indovinelli, ricompensando generosamente chi vinceva onestamente ma punendo severamente chi tentava di imbrogliarlo.<br><br><b>Contesto culturale:</b> A differenza di molti spiriti simili in altre tradizioni mondiali, il dokkaebi coreano non nasce da spiriti umani defunti o da divinità decadute, ma tradizionalmente da oggetti domestici comuni (scope, utensili, attrezzi consumati) che, dopo lungo uso e abbandono, acquisiscono spontaneamente coscienza e forma propria — una concezione dell'animismo degli oggetti concettualmente simile al tsukumogami giapponese incontrato nella scheda del nekomata.<br><br><b>Curiosità:</b> Il dokkaebi resta un personaggio estremamente popolare nella cultura pop coreana contemporanea, protagonista di una celebre serie televisiva sudcoreana del 2016-2017 intitolata semplicemente \"Goblin\" (il termine inglese usato per tradurre dokkaebi), che ha contribuito a rinnovare l'interesse internazionale per questa figura folkloristica tradizionale ben oltre i confini della Corea.",
  "Alux": "Piccolo spirito custode dei campi maya, benevolo con chi lo rispetta, dispettoso e pungente con chi calpesta la sua terra senza chiedere permesso.<br><br><b>Il mito completo:</b> Secondo la tradizione popolare yucateca ancora viva oggi, un Alux può essere letteralmente creato da un agricoltore che modella una piccola figura umana in argilla o pietra e la colloca in un angolo del proprio campo, eseguendo un rituale specifico (talvolta con l'assistenza di uno sciamano) che dona vita e coscienza alla figura per un periodo determinato, tradizionalmente sette anni: durante questo periodo l'Alux protegge attivamente il raccolto dai ladri e dai parassiti, ma alla scadenza dei sette anni deve essere ritualmente \"spento\" (spesso rompendo un piccolo foro nella statuetta per farne uscire lo spirito) — un Alux lasciato attivo oltre questo periodo si crede diventi incontrollabile e dispettoso verso lo stesso agricoltore che lo ha creato.<br><br><b>Contesto culturale:</b> A differenza di molte creature mitologiche relegate al passato precolombiano, l'Alux resta parte di una pratica agricola e religiosa genuinamente viva nello Yucatán rurale contemporaneo — piccoli santuari o offerte per gli Alux sono tuttora visibili ai bordi di molti campi di mais nella regione, testimonianza di una continuità religiosa maya sopravvissuta quasi intatta attraverso secoli di colonizzazione.<br><br><b>Curiosità:</b> Durante la costruzione dell'aeroporto internazionale di Cancún negli anni '70, si narra che gli operai locali abbiano insistito per costruire piccole \"casette\" per gli Alux del terreno prima di iniziare i lavori, temendo dispetti o incidenti se gli spiriti locali non fossero stati adeguatamente rispettati — un esempio notevole di come questa credenza tradizionale continui a influenzare persino progetti infrastrutturali moderni su larga scala.",
  "Tomte": "Spirito domestico delle fattorie scandinave, minuto e barbuto, che veglia sul bestiame e sui raccolti purché riceva ogni Natale la sua ciotola di porridge.<br><br><b>Il mito completo:</b> Il tomte (svedese) rappresenta sostanzialmente la stessa tradizione più ampia del nisse (norvegese/danese) — piccoli spiriti domestici guardiani barbuti e dal berretto rosso, legati a una specifica fattoria attraverso le generazioni, ferocemente protettivi della prosperità e degli animali della fattoria, ma esigenti rispetto, un'offerta annuale di porridge e nessuna presa in giro. Il folklore svedese sottolinea specificamente la forza estrema del tomte nonostante la sua piccola statura (capace di sollevare oggetti ben oltre quanto la sua taglia suggerirebbe) e il suo intenso possesso verso la \"propria\" fattoria — un tomte che si sentiva mancato di rispetto poteva non solo sabotare il lavoro agricolo ma, nei racconti più severi, causare un declino permanente della fortuna della famiglia, o persino seguire una famiglia trasferitasi altrove per continuare a tormentarla.<br><br><b>Contesto culturale:</b> Come il nisse, la tradizione del tomte confluì direttamente nel moderno \"jultomte\" svedese (il donatore di regali natalizi), l'equivalente regionale svedese di Babbo Natale — il che significa che sia Norvegia sia Svezia svilupparono in modo indipendente evoluzioni folkloristiche parallele e strettamente imparentate dallo spirito domestico a Babbo Natale, riflettendo un substrato culturale scandinavo ampiamente condiviso.<br><br><b>Curiosità:</b> La parola \"tomte\" è direttamente imparentata con la parola svedese \"tomt\", che significa terreno di casa o podere — il suo stesso nome lo identifica come fondamentalmente legato a un pezzo specifico di terra o proprietà, distinguendolo linguisticamente da tipi di spiriti più mobili o generalizzati, e rafforzando quanto specificamente questa figura fosse ritenuta legata a un luogo nella tradizionale credenza rurale svedese.",
  "Adaro": "Spirito marino delle Isole Salomone, nato dall'arcobaleno, che cavalca gli squali e scaglia pesci volanti come lance contro chi disturba le sue acque.<br><br><b>Il mito completo:</b> Secondo la tradizione delle Isole Salomone, nella regione della Melanesia nel Pacifico sudoccidentale, gli Adaro nascono specificamente dall'arcobaleno stesso, considerato un fenomeno soprannaturale capace di generare spiriti marini dotati di squame simili a quelle di un pesce, pinne al posto degli arti e corna acuminate sulla fronte; gli Adaro venivano descritti come cavalcatori di squali che pattugliavano le acque costiere delle isole, scagliando pesci volanti avvelenati come vere e proprie armi contro pescatori o naviganti che disturbavano il loro territorio marino senza il dovuto rispetto.<br><br><b>Contesto culturale:</b> Il mito degli Adaro riflette la profonda dipendenza delle comunità insulari melanesiane dal mare come risorsa vitale e al tempo stesso pericolosa — una relazione ambivalente comune a molte culture del Pacifico, in cui gli spiriti marini incarnano sia il timore per i pericoli genuini della navigazione oceanica sia il rispetto per l'abbondanza che il mare stesso fornisce quando trattato correttamente.<br><br><b>Curiosità:</b> Gli Adaro appartengono a una tradizione orale melanesiana documentata relativamente tardi dagli antropologi occidentali rispetto a molte altre mitologie di questa collezione, principalmente attraverso il lavoro sul campo di ricercatori europei nel corso del XX secolo — un promemoria di quanto la documentazione accademica delle tradizioni orali del Pacifico sia rimasta incompleta più a lungo rispetto a culture con tradizioni scritte più antiche, e di quanta ricchezza mitologica resti ancora relativamente poco esplorata al di fuori delle comunità locali stesse.",
  "Boggart": "Spirito dispettoso delle case e delle fattorie inglesi, capace di far inacidire il latte e nascondere gli attrezzi, finché non gli si dà un nome.<br><br><b>Il mito completo:</b> Secondo il folklore inglese, il boggart non è tecnicamente una specie separata di creatura, ma piuttosto la forma in cui uno spirito domestico originariamente benevolo (un \"brownie\", concettualmente simile ai domovoy slavi e ai tomte scandinavi già incontrati in questa collezione) si trasforma quando viene offeso, trascurato o preso in giro dagli abitanti della casa — la trasformazione da alleato utile a tormentatore dispettoso rifletteva la convinzione che il rapporto tra umani e spiriti domestici richiedesse un rispetto reciproco costante, non garantito una volta per tutte.<br><br><b>Contesto culturale:</b> La tradizione del boggart appartiene a una più ampia famiglia di credenze nordeuropee su spiriti domestici capricciosi la cui benevolenza dipende interamente dal trattamento ricevuto — un pattern folkloristico condiviso, seppur sviluppato indipendentemente, con numerose altre tradizioni già incontrate in questa collezione, dal domovoy slavo al kobold tedesco.<br><br><b>Curiosità:</b> Il boggart ha ricevuto una nuova e vastissima popolarità globale attraverso la serie di Harry Potter di J.K. Rowling, dove viene reimmaginato come una creatura magica capace di trasformarsi nella paura più profonda di chi lo affronta — una reinvenzione creativa moderna che si allontana significativamente dal folklore originale, ma che ha reso il nome \"boggart\" immediatamente riconoscibile a milioni di lettori in tutto il mondo, ben oltre la conoscenza specialistica del folklore inglese tradizionale.",
  "Sarimanok": "Uccello leggendario delle Filippine dalle piume sgargianti e le ali screziate, simbolo di buona fortuna per chi lo scorge in volo all'alba.<br><br><b>Il mito completo:</b> Originario specificamente della tradizione del popolo Maranao di Mindanao, nel sud delle Filippine, il Sarimanok viene tradizionalmente raffigurato con un pesce o un pezzo di gioiello stretto nel becco o negli artigli, e le sue piume screziate e colorate vengono interpretate come simbolo di prosperità, buona sorte e comunicazione con il mondo spirituale — l'uccello compare frequentemente nell'arte decorativa tradizionale Maranao, in particolare intagliato su travi architettoniche, imbarcazioni cerimoniali e strumenti musicali.<br><br><b>Contesto culturale:</b> Il Sarimanok occupa un ruolo culturale che va ben oltre il semplice folklore narrativo: è diventato uno dei simboli visivi più riconosciuti e istituzionalmente adottati dell'intera regione di Mindanao, comparendo su stemmi regionali, loghi ufficiali e monumenti pubblici come rappresentazione dell'identità culturale Maranao e, più ampiamente, dell'eredità artistica islamica-filippina della regione.<br><br><b>Curiosità:</b> Una grande statua del Sarimanok funge da monumento pubblico prominente nella città di Marawi, capitale culturale del popolo Maranao, e l'immagine dell'uccello viene tuttora utilizzata attivamente nel design tessile, nella gioielleria e nell'artigianato tradizionale filippino contemporaneo — rendendolo, come alcune altre creature già incontrate in questa collezione, una figura mitologica la cui rilevanza culturale rimane genuinamente viva e visibile nella vita pubblica quotidiana, non relegata al solo folklore storico.",
  "Aswang": "Mutaforma delle isole filippine, capace di assumere sembianze umane di giorno e cacciare come belva feroce nelle notti di luna piena.<br><br><b>Il mito completo:</b> Il termine \"aswang\" nella tradizione filippina funge in realtà da categoria ombrello per diverse tipologie distinte di creature soprannaturali, non un'unica figura uniforme — include il manananggal (capace di separare la parte superiore del proprio corpo dalla metà inferiore per volare via di notte in cerca di prede, in particolare donne incinte), il viscera sucker (che si nutre specificamente degli organi interni delle vittime attraverso una lunga lingua sottile mentre dormono) e diverse altre varianti regionali, ciascuna con caratteristiche e debolezze specifiche proprie secondo la tradizione locale.<br><br><b>Contesto culturale:</b> Le credenze sull'aswang restano genuinamente diffuse in molte aree rurali delle Filippine ancora oggi, al punto che intere comunità hanno storicamente attribuito malattie inspiegabili, aborti spontanei o morti improvvise alla presenza attiva di un aswang locale — riflettendo, similmente al Tokoloshe zulu visto in precedenza in questo lotto, come il folklore possa fornire un quadro esplicativo genuinamente operativo per eventi tragici altrimenti privi di una spiegazione immediata disponibile.<br><br><b>Curiosità:</b> Nel 1992, un caso di panico collettivo di massa legato all'aswang scoppiò nella provincia di Capiz, sull'isola di Panay, con centinaia di residenti che riportarono presunti avvistamenti nel corso di diverse settimane, generando copertura mediatica nazionale nelle Filippine — un esempio notevole e relativamente recente di come questa specifica credenza folkloristica possa ancora oggi generare un'autentica isteria collettiva su scala regionale.",
  "Nekomata": "Gatto giapponese che, invecchiando, sviluppa una seconda coda e poteri sovrannaturali, capace di controllare i morti come marionette.<br><br><b>Il mito completo:</b> La tradizione popolare giapponese metteva specificamente in guardia dal tenere i gatti per troppi anni (le stime tradizionali variavano, citando talvolta i tredici anni come soglia pericolosa) o dal lasciare che la coda di un gatto crescesse insolitamente lunga, dato che entrambi si riteneva scatenassero la trasformazione in nekomata; alcune tradizioni regionali raccomandavano specificamente di tagliare la coda ai gatti come precauzione — una credenza popolare che alcuni storici collegano all'aspetto storicamente comune della coda corta o mozza di molte razze tradizionali di gatti domestici giapponesi, suggerendo che il tratto fisico possa essersi sviluppato in parte in risposta a questa stessa superstizione.<br><br><b>Contesto culturale:</b> Il nekomata appartiene a una più ampia categoria folkloristica giapponese chiamata \"tsukumogami\" e concetti correlati — la credenza che oggetti o animali ordinari, dotati di età sufficiente o significato accumulato, possano spontaneamente acquisire coscienza e potere soprannaturali — riflettendo una visione del mondo folk-buddhista distintamente giapponese in cui l'età e la lunga durata di per sé portano un peso genuinamente trasformativo e spiritualmente significativo.<br><br><b>Curiosità:</b> Il nekomata viene spesso distinto nel folklore giapponese dal correlato ma distinto \"bakeneko\" (una categoria più ampia di gatti mutaforma soprannaturali in generale, che possono o meno sviluppare la specifica caratteristica della coda divisa) — questa attenta distinzione folkloristica tra molteplici categorie di gatti soprannaturali correlate ma diverse riflette la natura spesso altamente specifica e tassonomicamente dettagliata della classificazione folkloristica degli yokai giapponesi più in generale.",
  "Tokoloshe": "Spirito dispettoso e velenoso delle tradizioni zulu, piccolo e peloso, capace di rendersi invisibile bevendo acqua e di seminare disgrazie nelle notti buie.<br><br><b>Il mito completo:</b> Secondo la tradizione, il Tokoloshe veniva tradizionalmente evocato da uno stregone malevolo (umthakathi) per tormentare o addirittura uccidere un nemico designato, spesso introducendosi in casa durante la notte per molestare chi dormiva; una pratica di protezione diffusa in molte comunità sudafricane consisteva nel sollevare il proprio letto su mattoni, così da renderlo troppo alto perché la piccola creatura potesse raggiungere chi vi dormiva sopra — un'usanza tuttora praticata in alcune aree rurali del Sudafrica.<br><br><b>Contesto culturale:</b> Il Tokoloshe riflette un aspetto centrale della tradizione zulu sulla stregoneria (ubuthakathi): la convinzione che sventura, malattia o morte inaspettata raramente accadano per puro caso, ma siano spesso il risultato dell'azione malevola di qualcuno, incanalata attraverso spiriti come il Tokoloshe — una cornice concettuale che struttura ancora oggi come alcune comunità interpretano eventi negativi inspiegabili.<br><br><b>Curiosità:</b> Il Tokoloshe resta talmente presente nella cultura popolare sudafricana contemporanea da comparire regolarmente in notizie di cronaca, film horror locali e persino in dibattiti pubblici — nel 2014 fece notizia internazionale un caso in cui un'intera scuola sudafricana fu temporaneamente chiusa dopo che gli studenti sostennero di essere stati terrorizzati da un Tokoloshe, dimostrando quanto questa figura folkloristica resti viva e capace di generare reazioni collettive reali ancora oggi.",
  "Kupua": "Essere mutaforma delle leggende hawaiiane, capace di passare dalla forma umana a quella animale, spesso guardiano di una particolare vallata o baia.<br><br><b>Il mito completo:</b> Secondo la tradizione hawaiiana, un kupua nasceva tipicamente da un'unione tra un essere umano e una divinità (akua), ereditando poteri sovrannaturali significativi ma restando comunque parzialmente legato al mondo mortale — a differenza degli dèi hawaiiani veri e propri, un kupua manteneva tipicamente un forte legame territoriale con un luogo geografico specifico (una valle, una baia, una montagna), agendo come guardiano semi-divino di quel particolare territorio e delle comunità che vi abitavano, spesso capace di trasformarsi in un particolare animale associato a quel luogo (uno squalo, un maiale, un uccello) a seconda della propria specifica tradizione locale.<br><br><b>Contesto culturale:</b> Il concetto di kupua riflette la profonda geografia sacra della cosmologia hawaiiana tradizionale, in cui specifiche caratteristiche del paesaggio (valli, baie, formazioni rocciose) erano considerate abitate e vegliate da presenze spirituali proprie, radicando la mitologia direttamente nel paesaggio fisico reale delle isole hawaiiane in modo simile ad altre tradizioni di spiriti-del-luogo già incontrate in questa collezione.<br><br><b>Curiosità:</b> Diverse leggende hawaiiane su kupua specifici sopravvivono ancora oggi legate a precisi luoghi geografici delle isole, spesso ancora raccontate come parte dell'identità culturale locale di specifiche comunità hawaiiane — un esempio di come la geografia mitologica tradizionale continui a intrecciarsi con l'identità regionale contemporanea delle isole, non relegata esclusivamente al passato precoloniale.",
  "Grootslang": "Ibrido colossale tra elefante e serpente delle leggende sudafricane, custode di caverne piene di diamanti, così potente che gli dèi stessi lo divisero in due per paura.<br><br><b>Il mito completo:</b> Secondo la leggenda, gli dèi crearono originariamente il Grootslang come una delle primissime creature del mondo, dotandolo di una forza e un'intelligenza tali da renderlo pericoloso persino per i propri creatori; per contenerne il potere, gli dèi lo divisero in due creature distinte — dando origine separatamente al primo elefante e al primo serpente — ma un singolo Grootslang, secondo la tradizione, sarebbe sopravvissuto intatto in una grotta remota, custodendo un'enorme fortuna di diamanti che attirerebbe ancora oggi cacciatori di tesori sconsiderati verso una fine sicura.<br><br><b>Contesto culturale:</b> Il Grootslang è tradizionalmente associato a una specifica località geografica reale, la Grotta di Richtersveld nel Sudafrica nordoccidentale, dove secondo la leggenda locale la creatura risiederebbe ancora — legando il mito a un vero paesaggio fisico visitabile, in modo simile ad altre tradizioni mitologiche geograficamente ancorate già incontrate in questa collezione.<br><br><b>Curiosità:</b> Il nome \"Grootslang\" deriva direttamente dall'afrikaans e significa letteralmente \"grande serpente\" — una delle numerose creature di questa collezione il cui nome descrive semplicemente e direttamente l'aspetto fisico della bestia, senza il velo di un nome proprio più elaborato, riflettendo uno stile narrativo diretto tipico di molte tradizioni folkloristiche sudafricane di lingua afrikaans.",
  "Nuckelavee": "Demone marino delle Isole Orcadi dalla pelle scorticata e il fiato pestilenziale, cavaliere senza pelle fuso al suo cavallo altrettanto scorticato.<br><br><b>Il mito completo:</b> Il Nuckelavee veniva specificamente incolpato nel folklore delle Orcadi per aver causato siccità, carestie di raccolto ed epidemie sia tra gli esseri umani sia tra il bestiame — il suo solo fiato si riteneva capace di far avvizzire i raccolti e ammalare gli animali a distanza, rendendolo una delle poche creature folkloristiche scozzesi associate a un disastro ambientale diffuso piuttosto che al solo pericolo individuale. La sua unica, terrificante debolezza era l'acqua dolce, che non poteva attraversare — il che significa che ruscelli e fiumi offrivano una protezione genuina e affidabile, e si riteneva che la creatura fosse confinata principalmente alle aree costiere e vicine al mare.<br><br><b>Contesto culturale:</b> La specifica vulnerabilità del Nuckelavee all'acqua dolce riflette uno schema più ampio nel folklore delle Isole Britanniche di spiriti malevoli associati al mare o all'acqua salata respinti o contenuti dall'acqua dolce corrente — una distinzione di credenza popolare che rispecchia preoccupazioni geografiche e pratiche reali delle comunità costiere delle Orcadi, bilanciando la ricchezza del mare contro i suoi genuini pericoli.<br><br><b>Curiosità:</b> A differenza della maggior parte delle creature folkloristiche scozzesi, che tipicamente hanno più varianti regionali con nome proprio in diverse zone, il Nuckelavee è quasi unicamente specifico al folklore delle Orcadi — questa specificità iperlocale lo rende uno degli esempi più chiari di una tradizione popolare genuinamente localizzata piuttosto che un archetipo pancéltico ampiamente diffuso.",
  "Gumiho": "Volpe dalle nove code delle leggende coreane, capace di assumere forma umana per ingannare i viandanti e rubarne l'energia vitale.<br><br><b>Il mito completo:</b> Secondo la tradizione coreana più diffusa, il gumiho si nutre specificamente del fegato o del cuore delle proprie vittime umane (a seconda della versione del racconto), assorbendo la loro energia vitale (gi) per mantenere o rafforzare la propria forma umana; alcune varianti narrative più tarde e romanticizzate del mito, particolarmente popolari nella cultura pop coreana contemporanea, immaginano invece un gumiho capace di rinunciare per sempre alla propria natura predatoria e diventare permanentemente umano se riesce a resistere per mille giorni senza cibarsi di alcuna vittima umana.<br><br><b>Contesto culturale:</b> Il gumiho condivide una chiara parentela concettuale con la kitsune giapponese e la huli jing cinese già incontrate in questa collezione, riflettendo un più ampio motivo mitologico est-asiatico condiviso sugli spiriti-volpe capaci di trasformazione — la tradizione coreana specificamente tende a enfatizzare più marcatamente l'aspetto pericoloso e predatorio della creatura rispetto alle controparti giapponese e cinese, spesso più moralmente ambigue o persino benevole.<br><br><b>Curiosità:</b> Il gumiho ha conosciuto una rinascita di popolarità straordinaria nella cultura pop coreana del XXI secolo, protagonista di numerosi drama televisivi, film e romanzi coreani contemporanei — spesso reinterpretato con maggiore simpatia narrativa rispetto al folklore tradizionale, come figura tragica in cerca di redenzione piuttosto che semplice mostro predatore, riflettendo un'evoluzione culturale moderna nella percezione pubblica di questa antica figura.",
  "Migoi": "Nome tibetano dell'uomo delle nevi, spirito solitario delle vette himalayane che i monaci considerano guardiano sacro, non semplice bestia.<br><br><b>Il mito completo:</b> A differenza del termine \"Yeti\", di origine più genericamente sherpa e nepalese, \"Migoi\" (talvolta traslitterato Mi-go o Migyu) è specificamente la denominazione tibetana della creatura, e nella tradizione buddhista tibetana viene tradizionalmente associato a un più ampio pantheon di spiriti protettori delle montagne (i sadak, \"signori della terra\"), esseri che devono essere placati e rispettati da chiunque attraversi il loro territorio, particolarmente monaci e pellegrini in cammino verso monasteri e siti sacri situati in alta quota.<br><br><b>Contesto culturale:</b> Diversi monasteri tibetani e himalayani conservano tuttora reliquie tradizionalmente presentate come appartenenti al Migoi — tra cui i celebri \"scalpi\" conservati nei monasteri di Khumjung e Pangboche in Nepal, oggetti sacri di culto religioso locale genuino piuttosto che semplici curiosità turistiche, sebbene analisi scientifiche condotte su alcuni di questi reperti abbiano suggerito origini animali più convenzionali (in particolare da stambecchi o altri mammiferi montani).<br><br><b>Curiosità:</b> La distinzione linguistica e culturale tra \"Yeti\" (termine più diffuso internazionalmente, di origine sherpa/nepalese) e \"Migoi\" (specificamente tibetano) riflette come una singola tradizione mitologica regionale, quella dell'uomo delle nevi himalayano, comprenda in realtà molteplici tradizioni locali distinte con nomi, sfumature religiose e dettagli culturali propri, spesso semplificate e omogeneizzate in un unico \"Yeti\" generico dalla narrazione occidentale popolare.",
  "Aigamuxa": "Creatura sudafricana dagli occhi posti sui piedi anziché sul volto, costretta a camminare a quattro zampe alla luce del giorno per riuscire a vedere.<br><br><b>Il mito completo:</b> Secondo la tradizione dei popoli Khoisan del Sudafrica, gli Aigamuxa abitano le dune di sabbia costiere, dove la loro insolita conformazione fisica — occhi posti sulla pianta dei piedi anziché sul volto — li costringe a camminare a quattro zampe con le gambe sollevate in aria per poter vedere dove stanno andando, un'andatura goffa e innaturale che li rende relativamente lenti e facilmente evitabili durante il giorno; di notte, tuttavia, quando non hanno bisogno di vedere per cacciare grazie all'olfatto, diventano cacciatori genuinamente pericolosi e veloci per chiunque si avventuri sulle dune al buio.<br><br><b>Contesto culturale:</b> Gli Aigamuxa riflettono un motivo folkloristico Khoisan più ampio legato alle dune di sabbia come paesaggio pericoloso e inospitale, popolato da creature dalla fisiologia deliberatamente innaturale e disorientante — un modo per incorporare nella narrazione mitologica la genuina difficoltà e pericolosità di orientarsi in un ambiente desertico dunale, dove il terreno stesso cambia costantemente forma.<br><br><b>Curiosità:</b> Il dettaglio specifico degli \"occhi sui piedi\" rende gli Aigamuxa una delle creature mitologiche mondiali con l'anatomia più deliberatamente e stranamente invertita rispetto alla norma — un'inversione anatomica che, insieme al loro punto debole intuitivo (sono relativamente innocui di giorno, quando la loro stessa conformazione li ostacola), crea uno dei rari mostri il cui pericolo dipende specificamente e in modo prevedibile dal ciclo giorno-notte, piuttosto che da un comportamento variabile o casuale.",
  "Thunderbird": "Uccello immenso delle tradizioni dei popoli nativi d'America, le cui ali battenti generano il tuono e i cui occhi lampeggianti scatenano il fulmine.<br><br><b>Il mito completo:</b> Il Thunderbird compare, con nomi e dettagli specifici diversi, in numerose e distinte tradizioni dei popoli indigeni nordamericani, dalle nazioni delle Grandi Pianure a quelle della costa nordoccidentale del Pacifico — in molte tradizioni viene considerato un essere benevolo e protettivo, spesso in eterno conflitto con potenti serpenti o mostri acquatici, una battaglia cosmica il cui esito determinava letteralmente il tempo atmosferico osservabile: tuoni e fulmini erano segni diretti di questo scontro perenne tra il Thunderbird celeste e le sue controparti acquatiche.<br><br><b>Contesto culturale:</b> Il Thunderbird occupa un ruolo di primo piano nell'arte tradizionale di numerose nazioni indigene della costa nordoccidentale del Pacifico (come i Kwakwaka'wakw e gli Haida), dove la sua immagine stilizzata compare frequentemente su totem cerimoniali, maschere rituali e opere d'arte intagliate — non semplice decorazione, ma rappresentazione di un essere spirituale genuinamente venerato e centrale nella cosmologia e nella pratica cerimoniale di queste comunità.<br><br><b>Curiosità:</b> Il Thunderbird resta un simbolo culturale attivamente rivendicato e rispettato da numerose nazioni indigene nordamericane contemporanee, ed è stato adottato anche in contesti ufficiali moderni — dal nome del celebre modello di automobile Ford Thunderbird al pattugliamento aereo acrobatico \"Thunderbirds\" dell'aeronautica militare statunitense — sebbene queste appropriazioni commerciali e militari abbiano talvolta suscitato critiche da parte delle comunità indigene per l'uso di un simbolo sacro al di fuori del proprio contesto culturale e religioso originario.",
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

// Genera un'esplosione astratta in SVG per il momento dell'impatto negli scontri — non ritrae
// nessuna creatura, quindi vale per qualsiasi coppia di carte si affrontino. Piccola casualità
// nei raggi e nelle scintille per non farla sembrare sempre identica.
function svgEsplosioneImpatto() {
  const numRaggi = 9 + Math.floor(Math.random() * 3);
  const raggi = Array.from({ length: numRaggi }, (_, i) => {
    const angoloBase = (360 / numRaggi) * i;
    const angolo = (angoloBase + (Math.random() * 14 - 7)) * Math.PI / 180;
    const lunghezza = 38 + Math.random() * 12;
    const x2 = (50 + Math.cos(angolo) * lunghezza).toFixed(1);
    const y2 = (50 + Math.sin(angolo) * lunghezza).toFixed(1);
    return `<line x1="50" y1="50" x2="${x2}" y2="${y2}" stroke="#ffcc66" stroke-width="${(2 + Math.random() * 2).toFixed(1)}" stroke-linecap="round" opacity="0.85"/>`;
  }).join("");

  const scintille = Array.from({ length: 7 }, () => {
    const angolo = Math.random() * 360 * Math.PI / 180;
    const dist = 18 + Math.random() * 26;
    const x = (50 + Math.cos(angolo) * dist).toFixed(1);
    const y = (50 + Math.sin(angolo) * dist).toFixed(1);
    return `<circle cx="${x}" cy="${y}" r="${(1.2 + Math.random() * 1.8).toFixed(1)}" fill="#fff6d5"/>`;
  }).join("");

  return `
    <svg viewBox="0 0 100 100" style="width:100%; height:100%; overflow:visible;">
      <defs>
        <radialGradient id="nucleoEsplosione" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="55%" stop-color="#ffcc66"/>
          <stop offset="100%" stop-color="#ffcc66" stop-opacity="0"/>
        </radialGradient>
      </defs>
      ${raggi}
      <circle cx="50" cy="50" r="17" fill="url(#nucleoEsplosione)"/>
      ${scintille}
    </svg>`;
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
    bottoneEvolviFsHTML = `<button type="button" class="events-btn" style="background:#4a5568; cursor:not-allowed; width:100%;" disabled>Solo per Sacrifici</button>`;
  } else if (carta.stelle >= 8) {
    bottoneEvolviFsHTML = `<button type="button" class="events-btn" style="background:#4a5568; cursor:not-allowed; width:100%;" disabled>Evoluzione Max</button>`;
  } else if (carta.occupataInDifesa) {
    bottoneEvolviFsHTML = `<button type="button" class="events-btn" style="background:#4a5568; cursor:not-allowed; width:100%;" disabled>Impegnata in Difesa</button>`;
  } else if (carta.bloccataInDuello) {
    bottoneEvolviFsHTML = `<button type="button" class="events-btn" style="background:#4a5568; cursor:not-allowed; width:100%;" disabled>Impegnata in un Duello</button>`;
  } else if (pctVigoreFs <= 0) {
    bottoneEvolviFsHTML = `<button type="button" class="events-btn" style="background:#4a5568; cursor:not-allowed; width:100%;" disabled>Esausta</button>`;
  } else {
    bottoneEvolviFsHTML = `<button type="button" class="events-btn" id="fs-card-evolvi-btn" style="background:linear-gradient(to bottom, #2f855a, #22543d); border-color:#22543d; width:100%;">Evolvi (Migliora)</button>`;
  }

  let bottoneAzioneHTML;
  if (modalitaBattaglia) {
    bottoneAzioneHTML = `<div style="display:flex; gap:8px; margin-top:14px;">
      <div style="flex:1;">${bottoneEvolviFsHTML}</div>
      <button type="button" class="events-btn fs-card-vendi" id="fs-card-battaglia-btn" style="flex:1; margin-top:0; background:linear-gradient(to bottom, #b7791f, #8a5b12); border-color:#8a5b12;">⚔️ Vai in Battaglia</button>
    </div>`;
  } else {
    bottoneAzioneHTML = `<div style="display:flex; gap:8px; margin-top:14px;">
      <div style="flex:1;">${bottoneEvolviFsHTML}</div>
      <button type="button" class="events-btn fs-card-vendi" id="fs-card-vendi-btn" style="flex:1; margin-top:0;">Vendi (${prezzoVendita} 🪙)</button>
    </div>`;
  }

  const bottonePlastificaHTML = carta.isJolly ? "" : `
    <button type="button" class="events-btn" id="fs-card-plastifica-btn" style="width:100%; margin-top:8px; background:${carta.plastificata ? "linear-gradient(to bottom, #4a5568, #2d3748)" : "linear-gradient(to bottom, #3182ce, #2262a8)"}; border-color:${carta.plastificata ? "#2d3748" : "#2262a8"};">
      ${carta.plastificata ? "📦 Rimuovi Plastificazione" : "📦 Plastifica"}
    </button>`;

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
          ${bottonePlastificaHTML}
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

  document.getElementById("fs-card-plastifica-btn")?.addEventListener("click", () => {
    carta.plastificata = !carta.plastificata;
    salvaProgressoCloud();
    mostraCartaFullscreen(carta, opzioniExtra);
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

      if (mappaMondo[r] && mappaMondo[r][c] && mappaMondo[r][c].proprietarioUid && utenteFirebaseAttuale && mappaMondo[r][c].proprietarioUid === utenteFirebaseAttuale.uid) {

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

      if (mappaMondo[v.r] && mappaMondo[v.r][v.c] && mappaMondo[v.r][v.c].proprietarioUid && utenteFirebaseAttuale && mappaMondo[v.r][v.c].proprietarioUid === utenteFirebaseAttuale.uid) {

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

// Oro riservato a te; ogni altro proprietario riceve uno tra 7 colori distinti, sempre lo
// stesso per la stessa persona (calcolato dal suo identificativo unico, non dal nickname).
const COLORI_ALTRI_GIOCATORI = ["hex-conquistato-rosso", "hex-conquistato-verde", "hex-conquistato-blu", "hex-conquistato-viola", "hex-conquistato-arancio", "hex-conquistato-ciano", "hex-conquistato-rosa"];

function classeColoreProprietario(proprietarioUid) {
  if (proprietarioUid && utenteFirebaseAttuale && proprietarioUid === utenteFirebaseAttuale.uid) {
    return "hex-conquistato";
  }
  if (!proprietarioUid) return "hex-conquistato";
  let hash = 0;
  for (let i = 0; i < proprietarioUid.length; i++) hash = (hash * 31 + proprietarioUid.charCodeAt(i)) >>> 0;
  return COLORI_ALTRI_GIOCATORI[hash % COLORI_ALTRI_GIOCATORI.length];
}

// ===== Visibilità in tempo reale delle battaglie in corso sui sottomondi =====
// Quando un giocatore avvia un attacco, segnaliamo "battaglia in corso" su un nodo Firebase
// separato dalla mappa vera e propria (per non appesantire il caricamento normale della mappa).
// Chi ha la mappa aperta resta in ascolto live di questo nodo e vede un piccolo indicatore
// sull'esagono interessato. Se il segnale non viene rimosso a fine battaglia (perché l'app si
// chiude di colpo, connessione persa, ecc.), Firebase lo cancella comunque da sola grazie a
// onDisconnect: chi abbandona a metà semplicemente non porta a termine la conquista, esattamente
// come una sconfitta normale, quindi non serve altra logica speciale per questo caso.

let ascoltoBattaglieInCorso = null;
let battaglieInCorsoAttuali = {};

function segnalaInizioBattaglia(chiaveMappa, riga, colonna) {
  if (!utenteFirebaseAttuale) return;
  const rif = dbFirebase.ref(`battaglie_in_corso/${chiaveMappa}/${riga}_${colonna}`);
  rif.set({ uid: utenteFirebaseAttuale.uid, nome: nicknameUtente, timestamp: Date.now() });
  rif.onDisconnect().remove();
}

function segnalaFineBattaglia(chiaveMappa, riga, colonna) {
  if (!utenteFirebaseAttuale) return;
  dbFirebase.ref(`battaglie_in_corso/${chiaveMappa}/${riga}_${colonna}`).remove().catch(() => {});
}

function avviaAscoltoBattaglieInCorso(chiaveMappa) {
  fermaAscoltoBattaglieInCorso();
  battaglieInCorsoAttuali = {};
  ascoltoBattaglieInCorso = dbFirebase.ref(`battaglie_in_corso/${chiaveMappa}`);
  ascoltoBattaglieInCorso.on("value", (snapshot) => {
    battaglieInCorsoAttuali = snapshot.val() || {};
    renderizzaMappaVisiva();
  });
}

function fermaAscoltoBattaglieInCorso() {
  if (ascoltoBattaglieInCorso) {
    ascoltoBattaglieInCorso.off();
    ascoltoBattaglieInCorso = null;
  }
  battaglieInCorsoAttuali = {};
}

function renderizzaMappaVisiva() {

  if (!gridElement) return;

  gridElement.innerHTML = "";

  mappaMondo.forEach((rigaDati) => {

    const rowDiv = document.createElement("div");

    rowDiv.className = "hex-row";

    rigaDati.forEach((esagono) => {

      const hexDiv = document.createElement("div");

      let classeTerreno = "hex-" + esagono.terrain.toLowerCase();

      if (esagono.conquistato) classeTerreno = classeColoreProprietario(esagono.proprietarioUid);

      hexDiv.className = "hexagon " + classeTerreno;

      hexDiv.id = `hex-cell-${esagono.riga}-${esagono.colonna}`;

      hexDiv.innerText = esagono.riga + "," + esagono.colonna;

      const battagliaQui = battaglieInCorsoAttuali[`${esagono.riga}_${esagono.colonna}`];
      if (battagliaQui) {
        const badge = document.createElement("span");
        badge.className = "hex-battaglia-in-corso";
        badge.title = `${battagliaQui.nome} sta attaccando`;
        badge.innerText = "⚔️";
        hexDiv.appendChild(badge);
      }

 

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

  const eProprioEsagono = esagono.proprietarioUid && utenteFirebaseAttuale && esagono.proprietarioUid === utenteFirebaseAttuale.uid;
  document.getElementById("info-hex-owner").innerText = esagono.proprietario + (eProprioEsagono ? " (Tu)" : "");

 

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

      option.dataset.carta = JSON.stringify({ nome: carta.nome, immagine: carta.immagine, tratti: carta.tratti || [], stelle: carta.stelle, livello: carta.livello, vigore, statistiche: carta.statistiche });

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

// ===== Resoconto di Battaglia: registro dettagliato round per round, condiviso da sottomondi, guerre di clan e duelli =====

let registroBattaglia = [];

function nuovoRegistroBattaglia() {
  registroBattaglia = [];
}

// Duplica la logica di calcolaModificatoreTerreno ma restituisce anche una spiegazione testuale
// di quale tratto ha causato il bonus/penalità, usata solo per il resoconto: la funzione originale
// resta invariata ovunque venga già usata per il calcolo vero e proprio dello scontro.
function spiegaModificatoreTerreno(tratti, terreno) {
  let valore = 0.0;
  let spiegazioni = [];
  const terrMod = terreno.toLowerCase();

  (tratti || []).forEach(t => {
    const tratto = String(t).toLowerCase().trim();
    let bonus = 0;

    if (tratto === "volo") {
      if (terrMod === "aria") bonus = 2.0;
      if (terrMod === "acqua") bonus = -2.0;
    } else if (tratto === "arrampicata" || tratto === "equilibrio") {
      if (terrMod === "foresta" || terrMod === "terra") bonus = 2.0;
      if (terrMod === "acqua" || terrMod === "aria") bonus = -2.0;
    } else if (tratto === "nuoto") {
      if (terrMod === "acqua") bonus = 2.0;
      if (terrMod === "aria") bonus = -2.0;
    }

    if (bonus !== 0) {
      valore += bonus;
      spiegazioni.push(`${t} (${bonus > 0 ? "+" : ""}${bonus.toFixed(1)})`);
    }
  });

  return { valore: parseFloat(valore.toFixed(1)), spiegazione: spiegazioni.join(", ") };
}

function registraRoundBattaglia(dati) {
  registroBattaglia.push(dati);
}

function mostraResocontoBattaglia() {
  if (registroBattaglia.length === 0) return;

  const righeHTML = registroBattaglia.map(r => {
    const coloreEsito = r.vinto ? "#7ee787" : "#f56565";
    const testoEsito = r.vinto ? "VINTO" : "PERSO";
    const nomiStatistiche = r.statistiche.map(s => String(s).toUpperCase()).join(" + ");

    return `
      <div style="background: rgba(255,255,255,0.04); border: 1px solid #3a3222; border-left: 4px solid ${coloreEsito}; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-weight:bold; color:#ffcc66;">Round ${r.numeroRound}</span>
          <span style="font-weight:bold; color:${coloreEsito};">${testoEsito}</span>
        </div>
        <div style="font-size:0.78rem; color:#a89a7a; margin-bottom:8px;">Statistiche in gioco: <b style="color:#e0d5c1;">${nomiStatistiche}</b></div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <div style="color:#e0d5c1; font-weight:bold; margin-bottom:4px;">🛡️ ${r.mioNome} (tua)</div>
            <div style="font-size:0.82rem; color:#c9c0ab;">Base: ${r.mioBase.toFixed(1)}</div>
            ${r.mioModificatore !== 0 ? `<div style="font-size:0.82rem; color:${r.mioModificatore > 0 ? "#7ee787" : "#f56565"};">Terreno: ${r.mioModificatore > 0 ? "+" : ""}${r.mioModificatore.toFixed(1)}${r.mioSpiegazioneModificatore ? ` (${r.mioSpiegazioneModificatore})` : ""}</div>` : ""}
            ${r.bonusExtraNome ? `<div style="font-size:0.82rem; color:#7ee787;">${r.bonusExtraNome}: +${r.bonusExtra.toFixed(1)}</div>` : ""}
            <div style="font-size:0.9rem; color:#ffcc66; font-weight:bold; margin-top:3px;">Finale: ${r.mioFinale.toFixed(1)}</div>
          </div>
          <div>
            <div style="color:#e0d5c1; font-weight:bold; margin-bottom:4px;">⚔️ ${r.nemicoNome}</div>
            <div style="font-size:0.82rem; color:#c9c0ab;">Base: ${r.nemicoBase.toFixed(1)}</div>
            ${r.nemicoModificatore !== 0 ? `<div style="font-size:0.82rem; color:${r.nemicoModificatore > 0 ? "#7ee787" : "#f56565"};">Terreno: ${r.nemicoModificatore > 0 ? "+" : ""}${r.nemicoModificatore.toFixed(1)}${r.nemicoSpiegazioneModificatore ? ` (${r.nemicoSpiegazioneModificatore})` : ""}</div>` : ""}
            <div style="font-size:0.9rem; color:#ffcc66; font-weight:bold; margin-top:3px;">Finale: ${r.nemicoFinale.toFixed(1)}</div>
          </div>
        </div>
      </div>`;
  }).join("");

  document.getElementById("battle-log-content").innerHTML = righeHTML;
  document.getElementById("battle-log-modal").classList.remove("hidden");
}

document.getElementById("close-battle-log-modal")?.addEventListener("click", () => {
  document.getElementById("battle-log-modal").classList.add("hidden");
});

// Il pulsante "Vedi Statistiche di Battaglia" viene inserito dinamicamente in tre punti diversi
// (sottomondi, guerra di clan, duello) tramite insertAdjacentHTML: un onclick inline non
// funzionerebbe perché cercherebbe la funzione nello spazio globale, mentre questo codice vive
// dentro la closure del gioco. Un ascoltatore delegato sul documento intercetta il click
// indipendentemente da quale delle tre schermate ha creato il pulsante.
document.addEventListener("click", (e) => {
  if (e.target.closest(".btn-vedi-statistiche")) mostraResocontoBattaglia();
});

document.getElementById("btn-attacca-esagono").addEventListener("click", () => {

  if (!esagonoSelezionatoDati) return;

  let mazzoAttaccoSelezionato = [];

  for (let i = 0; i < 5; i++) {

    const cardId = document.getElementById(`deploy-slot-${i}`).value;

    mazzoAttaccoSelezionato.push(deckGiocatore.find(c => c.id === cardId));

  }

 

  const eDavveroMioQuestoEsagono = esagonoSelezionatoDati.proprietarioUid && utenteFirebaseAttuale && esagonoSelezionatoDati.proprietarioUid === utenteFirebaseAttuale.uid;

  if (esagonoSelezionatoDati.conquistato && eDavveroMioQuestoEsagono) {

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

  nuovoRegistroBattaglia();

  segnalaInizioBattaglia(`${mondoSelezionatoCorrente.id}_${sottomondoSelezionatoCorrente.id}`, esagonoSelezionatoDati.riga, esagonoSelezionatoDati.colonna);

  document.getElementById("battle-title-outcome").innerText = "INVASIONE TERRITORIALE...";

  document.getElementById("battle-report-content").innerHTML = "";

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

 

    const esitoRound = (mioValFinale > nemicoValFinale); 

    if (esitoRound) roundVintiGiocatore++;

    // Nel resoconto post-battaglia sveliamo sempre la vera identità del mostro, anche nella
    // Nebbia di Guerra dove durante lo scontro resta nascosta: il resoconto racconta cosa è
    // davvero successo, non ripete il mistero a battaglia ormai conclusa.
    const spiegaMio = spiegaModificatoreTerreno(miaCarta.tratti || miaCarta.traits || [], esagonoSelezionatoDati.terrain);
    const spiegaNemico = spiegaModificatoreTerreno(mostroNemico.tratti || mostroNemico.traits || [], esagonoSelezionatoDati.terrain);
    registraRoundBattaglia({
      numeroRound: mapRoundIdx + 1,
      mioNome: miaCarta.nome,
      nemicoNome: mostroNemico.nome,
      statistiche: statisticheSettimanaliMondo,
      mioBase: mioValBase, mioModificatore: mioMod, mioSpiegazioneModificatore: spiegaMio.spiegazione, mioFinale: mioValFinale,
      nemicoBase: nemicoValBase, nemicoModificatore: nemicoMod, nemicoSpiegazioneModificatore: spiegaNemico.spiegazione, nemicoFinale: nemicoValFinale,
      vinto: esitoRound
    });

 

    let nomeVisibileNemico = (sottomondoSelezionatoCorrente.id === "4") ? "Mostro Misterioso" : mostroNemico.nome;

    let emojiVisibileNemica = (sottomondoSelezionatoCorrente.id === "4") ? `<span style="vertical-align:middle;">❓</span>` : miniImmagineCarta(mostroNemico, 40);

    let roundCardId = `clash-map-row-${mapRoundIdx}`;

 

    let rLineHTML = `

      <div class="battle-arena-row" id="${roundCardId}">
        <div class="effetto-impatto">${svgEsplosioneImpatto()}</div>

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

      document.getElementById(roundCardId)?.classList.add("impatto-flash");
      document.getElementById(roundCardId)?.querySelector(".effetto-impatto")?.classList.add("attivo");

 

      setTimeout(() => {

        if (esitoRound) {

          document.getElementById(`nem-map-card-${mapRoundIdx}`).classList.add("card-sconfitta");

          document.getElementById(`vs-text-map-${mapRoundIdx}`).innerHTML = "VINCI";

          document.getElementById(`vs-text-map-${mapRoundIdx}`).style.color = "#7ee787";

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

  segnalaFineBattaglia(`${mondoSelezionatoCorrente.id}_${sottomondoSelezionatoCorrente.id}`, esagonoSelezionatoDati.riga, esagonoSelezionatoDati.colonna);

  let guadagnoDracme = roundVintiGiocatore * 100; 

  if (roundVintiGiocatore === 5) guadagnoDracme += 100;

  dracmeAttuali += guadagnoDracme; 

  document.getElementById("dracme-count").innerText = dracmeAttuali; 

 

  const vintoBattaglia = (roundVintiGiocatore >= 3);

  document.getElementById("battle-title-outcome").innerText = vintoBattaglia ? "Vittoria Assoluta!" : "Sconfitta";

  let epilogoHTML = `<div class="info-divider"></div>`;

 

  if (vintoBattaglia) {

    esagonoSelezionatoDati.conquistato = true; 

    esagonoSelezionatoDati.proprietario = nicknameUtente;

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

    epilogoHTML += `<h3 style="text-align:center; color:#7ee787; text-transform:uppercase;">Territorio Conquistato! (${roundVintiGiocatore}/5)</h3>`;

    aggiungiXP(5);

  } else {

    epilogoHTML += `<h3 style="text-align:center; color:#f56565; text-transform:uppercase;">Invasione Fallita! (${roundVintiGiocatore}/5)</h3>`;

    aggiungiXP(1);

  }

 

  epilogoHTML += `<p style="text-align:center; margin-top:8px; font-weight:bold; color:#ecc94b;">Ricompensa: +${guadagnoDracme} Dracme</p>`;

  epilogoHTML += `<div style="text-align:center; margin-top:12px;"><button type="button" class="events-btn btn-vedi-statistiche" style="max-width:260px; margin:0 auto;">📊 Vedi Statistiche di Battaglia</button></div>`;

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

function calcolaClassificaSottomondo(mappa, uidUtente) {
  const conteggi = {};
  for (let r = 0; r < RIGHE_MAPPA; r++) {
    for (let c = 0; c < COLONNE_MAPPA; c++) {
      const esa = mappa && mappa[r] && mappa[r][c];
      if (esa && esa.proprietarioUid) {
        conteggi[esa.proprietarioUid] = (conteggi[esa.proprietarioUid] || 0) + 1;
      }
    }
  }
  const mioConteggio = conteggi[uidUtente] || 0;
  if (mioConteggio === 0) return null;

  const valoriUnici = [...new Set(Object.values(conteggi))].sort((a, b) => b - a);
  const posizione = valoriUnici.indexOf(mioConteggio) + 1;
  return { conteggio: mioConteggio, posizione };
}

function classeBadgeSottomondo(posizione) {
  if (posizione === 1) return "sottomondo-badge-oro";
  if (posizione === 2) return "sottomondo-badge-argento";
  if (posizione === 3) return "sottomondo-badge-bronzo";
  return "sottomondo-badge-normale";
}

function aggiornaBadgeSottomondi() {
  if (!utenteFirebaseAttuale) return;
  const uid = utenteFirebaseAttuale.uid;

  STRUTTURA_SOTTOMONDI.forEach(sub => {
    const chiave = `${mondoSelezionatoCorrente.id}_${sub.id}`;
    dbFirebase.ref("mondi_reali/" + chiave).once("value").then(snapshot => {
      const risultato = calcolaClassificaSottomondo(snapshot.val(), uid);
      if (!risultato) return;

      const btn = dynamicGrid.querySelector(`.sottomondo-btn[data-sub-id="${sub.id}"]`);
      if (!btn || btn.querySelector(".sottomondo-badge")) return;

      const badge = document.createElement("span");
      badge.className = "sottomondo-badge " + classeBadgeSottomondo(risultato.posizione);
      badge.innerText = risultato.posizione + "°";
      badge.title = `${risultato.conteggio} esagon${risultato.conteggio === 1 ? "o" : "i"} conquistat${risultato.conteggio === 1 ? "o" : "i"}`;
      btn.appendChild(badge);
    }).catch(() => {});
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

    btn.dataset.subId = sub.id;

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

      document.getElementById("map-header-title").innerText = "🗺️ " + mondoSelezionatoCorrente.nome + " · " + sub.nome;

      generaDatiMappaSicura(() => {

        renderizzaMappaVisiva(); 

        worldsModal.classList.remove("hidden");

        avviaAscoltoBattaglieInCorso(`${mondoSelezionatoCorrente.id}_${sottomondoSelezionatoCorrente.id}`);

      });

    });

    dynamicGrid.appendChild(btn);

  });

  aggiornaBadgeSottomondi();

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

  fermaAscoltoBattaglieInCorso();

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
let filtroRaritaRaccoglitoreCorrente = localStorage.getItem("mythophedia_filtro_rarita_raccoglitore") || "";

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

  const selettoreRarita = document.getElementById("modal-rarita-select");
  if (selettoreRarita && selettoreRarita.value !== filtroRaritaRaccoglitoreCorrente) selettoreRarita.value = filtroRaritaRaccoglitoreCorrente;

  const deckFiltratoPerRarita = filtroRaritaRaccoglitoreCorrente
    ? deckGiocatore.filter(c => c.livello === parseInt(filtroRaritaRaccoglitoreCorrente))
    : deckGiocatore;

  carteOrdinateRaccoglitoreCorrente = ordinaCarteRaccoglitore(deckFiltratoPerRarita, criterio);
  if (!mantieniPagina) paginaCorrenteRaccoglitore = 0;

  renderizzaPaginaRaccoglitore();
}

function gestisciCambioFiltroRaritaRaccoglitore() {
  filtroRaritaRaccoglitoreCorrente = document.getElementById("modal-rarita-select").value;
  localStorage.setItem("mythophedia_filtro_rarita_raccoglitore", filtroRaritaRaccoglitoreCorrente);
  renderizzaRaccoglitore();
}
document.getElementById("modal-rarita-select")?.addEventListener("change", gestisciCambioFiltroRaritaRaccoglitore);

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

    bottoneEvolviHTML = `<button type="button" class="events-btn" style="background:#4a5568; cursor:not-allowed; padding:5px; font-size:0.75rem; margin-top:8px;" disabled>Solo per Sacrifici</button>`;

  } else if (carta.stelle >= 8) {

    bottoneEvolviHTML = `<button type="button" class="events-btn" style="background:#4a5568; cursor:not-allowed; padding:5px; font-size:0.75rem; margin-top:8px;" disabled>Evoluzione Max</button>`;

  } else if (carta.occupataInDifesa) {

    bottoneEvolviHTML = `<button type="button" class="events-btn" style="background:#4a5568; cursor:not-allowed; padding:5px; font-size:0.75rem; margin-top:8px;" disabled>Impegnata in Difesa</button>`;

  } else if (carta.bloccataInDuello) {

    bottoneEvolviHTML = `<button type="button" class="events-btn" style="background:#4a5568; cursor:not-allowed; padding:5px; font-size:0.75rem; margin-top:8px;" disabled>Impegnata in un Duello</button>`;

  } else if (pctVigore <= 0) {

    bottoneEvolviHTML = `<button type="button" class="events-btn" style="background:#4a5568; cursor:not-allowed; padding:5px; font-size:0.75rem; margin-top:8px;" disabled>Esausta</button>`;

  } else {

    bottoneEvolviHTML = `<button type="button" class="events-btn" id="btn-evo-act-${carta.id}" style="padding:5px; font-size:0.75rem; margin-top:8px; background:linear-gradient(to bottom, #2f855a, #22543d); border-color:#22543d;">Evolvi (Migliora)</button>`;

  }

  let livelloTagHTML = carta.isJolly ? '' : `<span class="livello-tag ${CLASSI_LIVELLI[carta.livello] || ''}">${ETICHETTE_LIVELLI[carta.livello] || ''} · #${numeroCarta(carta)}</span>`;

  return `
    <div class="creature-card ${carta.occupataInDifesa || carta.bloccataInDuello || pctVigore <= 0 ? 'occupata' : ''}">
      ${carta.plastificata ? '<span class="plastificata-badge" title="Plastificata: protetta dai sacrifici">📦</span>' : ''}
      ${badgeHTML}
      ${livelloTagHTML}
      <div class="card-name" style="margin-top:${carta.occupataInDifesa || carta.bloccataInDuello || pctVigore <= 0 ? '45px' : (carta.isJolly ? '0' : '20px')};">${carta.nome} ${carta.isJolly ? '' : `(${carta.stelle} ★)`}</div>
      <div class="card-icon" id="card-icon-${carta.id}" style="cursor:pointer;">${haImmagineFile(carta) ? `<img src="${carta.immagine}" alt="${carta.nome}" class="card-icon-img"${carta.stelle > 0 ? ` style="border:2px solid ${STELLA_COLORI_EVO[Math.min(carta.stelle, 8)]}; box-shadow:0 0 6px ${STELLA_COLORI_EVO[Math.min(carta.stelle, 8)]};"` : ""}>` : carta.immagine}</div>
      <div class="card-stats">
        <div class="stat-line"><span class="stat-label">Vigore</span><span class="stat-val" style="color:${pctVigore > 30 ? '#7ee787' : '#f56565'};">${pctVigore}%</span></div>
        <div class="stat-line"><span class="stat-label">Ferocia</span><span class="stat-val">${carta.statistiche.ferocia}</span></div>
        <div class="stat-line"><span class="stat-label">Balzo</span><span class="stat-val">${carta.statistiche.balzo}</span></div>
        <div class="stat-line"><span class="stat-label">Corazza</span><span class="stat-val">${carta.statistiche.corazza}</span></div>
        <div class="stat-line"><span class="stat-label">Istinto</span><span class="stat-val">${carta.statistiche.istinto}</span></div>
      </div>
      <div class="card-traits-container">${trattiHTML}</div>
      ${bottoneEvolviHTML}
      <button type="button" class="events-btn btn-vendi-compatto" id="btn-vendi-${carta.id}" style="padding:5px; font-size:0.75rem; margin-top:4px; background:linear-gradient(to bottom, #742a2a, #4a1d1d); border-color:#5c2323;">Vendi (${carta.isJolly ? 10 : carta.livello * 15} 🪙)</button>
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

  modalTitle.innerText = filtroRaritaRaccoglitoreCorrente
    ? `${carteOrdinateRaccoglitoreCorrente.length} carte (su ${deckGiocatore.length}/${slotMassimiDeck})`
    : `${deckGiocatore.length}/${slotMassimiDeck} carte`;

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

  // Se la carta porta ancora il segno di un vecchio duello con scommessa (funzionalità ormai
  // sostituita dall'Addestramento), la libero qui — senza questo, una carta bloccata da prima
  // del cambio resterebbe bloccata per sempre, dato che il duello non esiste più da cercare.
  if (carta.bloccataInDuello) {
    carta.bloccataInDuello = false;
    carta.sfidaBloccoId = null;
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

 

  document.getElementById("evo-modal-title").innerText = `✨ Evoluzione: ${carta.nome} (${carta.stelle} ★ → ${carta.stelle + 1} ★)`;

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

  let poolIdonee = deckGiocatore.filter(c => c.id !== creaturaInEvoluzione.id && c.livello === lvlRichiesto && (c.isJolly || c.stelle === stelleRichieste) && !c.occupataInDifesa && !c.bloccataInDuello && !c.plastificata && calcolaVigorePercentuale(c) > 0);

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

        <button type="button" class="events-btn" id="btn-evo-min-${stat}" style="padding:2px 8px; width:auto; margin:0; background:#742a2a;">-</button>

        <button type="button" class="events-btn" id="btn-evo-pls-${stat}" style="padding:2px 8px; width:auto; margin:0; background:#22543d;">+</button>

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

 

  const nomiPossedutiPrimaDelPacco = new Set(deckGiocatore.map(c => c.nome));

  deckGiocatore = deckGiocatore.concat(nuoveCarte);

  aggiornaPulsantiLateraliRarita();

  document.getElementById("battle-title-outcome").innerText = "Spacchettamento!";

  mostraPaccoDaAprire(pack, nuoveCarte, nomiPossedutiPrimaDelPacco);

}

function mostraPaccoDaAprire(pack, nuoveCarte, nomiPossedutiPrimaDelPacco) {

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

  document.getElementById("pack-fisico-clic").addEventListener("click", () => apriAnimazionePacco(pack, nuoveCarte, nomiPossedutiPrimaDelPacco), { once: true });

}

function apriAnimazionePacco(pack, nuoveCarte, nomiPossedutiPrimaDelPacco) {

  const pacco = document.getElementById("pack-fisico-clic");
  document.getElementById("pack-tocca-testo")?.remove();

  suonaStrappoPacco();
  attivaScuotimentoSchermo();
  sparaParticelle(1, pacco);

  pacco.classList.add("pack-in-apertura");

  setTimeout(() => mostraGrigliaCarteEstratte(pack, nuoveCarte, nomiPossedutiPrimaDelPacco), 650);

}

function mostraGrigliaCarteEstratte(pack, nuoveCarte, nomiPossedutiPrimaDelPacco) {

  let cartineFlipHTML = nuoveCarte.map((c, idx) => {

    let raro = c.livello >= 3 ? " rare-glow" : "";
    let anticipazione = c.livello >= 4 ? " pack-flip-anticipazione" : "";
    let eNuova = nomiPossedutiPrimaDelPacco && !nomiPossedutiPrimaDelPacco.has(c.nome);

    return `

      <div class="pack-flip-card${raro}${anticipazione}" id="pack-flip-${idx}">

        <div class="pack-flip-inner">

          <div class="pack-flip-front">🎴</div>

          <div class="pack-flip-back">

            ${eNuova ? '<span class="pack-flip-badge-nuova">nuova!</span>' : ''}

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

      <button type="button" class="events-btn" id="buy-slots-btn" style="padding: 8px; font-size: 0.75rem; margin-top: auto; background: linear-gradient(to bottom, #2b6cb0, #2b4c7e); border-color: #2b4c7e;">2000 🪙</button>

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

      <button type="button" class="events-btn" id="tributo-ra-btn" style="padding: 8px; font-size: 0.75rem; margin-top: auto; background: linear-gradient(to bottom, #b7791f, #8a5a12); border-color: #8a5a12;" ${tributoDisabilitato ? "disabled" : ""}>${TRIBUTO_RA_COSTO} 🪙 → 1 💎</button>

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

        <button type="button" class="events-btn" id="buy-pack-${id}" style="padding: 8px; font-size: 0.75rem; margin-top: auto;">${p.costo} ${iconaValuta}</button>

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

        <button id="btn-upload-avatar" type="button" class="events-btn" style="padding: 5px 10px; font-size: 0.75rem; margin: 0; width: auto; background: #2d3748; border-color: #4a5568;">Carica Foto / JPEG</button>

        <input type="file" id="input-avatar-file" accept="image/jpeg, image/png, image/jpg" style="display: none;">

      </div>

      <div style="width: 100%;">

        <label style="color:#c9a054; font-weight:bold; display:block; margin-bottom:5px; font-family:Cinzel;">NICKNAME EVOCATORE:</label>

        <input type="text" id="edit-profile-nickname" class="deploy-select" value="${nicknameUtente}" style="font-size:1rem; padding:8px;">

      </div>

      <div style="background:rgba(0,0,0,0.35); padding:10px; border-radius:6px; border:1px solid #5c4d31; width: 100%;">

        <p style="color:#fff; margin-bottom:4px;"><strong>Livello Attuale:</strong> ${livelloGiocatore}</p>

        <p style="color:#aaa; font-size:0.85rem;"><strong>Esperienza accumulata:</strong> ${xpAttuali} / ${sogliaXpPerLivello(livelloGiocatore)} XP</p>

        <p style="color:#cbd5e0; font-size:0.85rem; margin-top:4px;"><strong>Capacità Totale Deck:</strong> ${deckGiocatore.length} / ${slotMassimiDeck} carte</p>

      </div>

      <div style="width: 100%;">

        <label style="color:#c9a054; font-weight:bold; display:block; margin-bottom:5px; font-family:Cinzel;">FRASE DI PRESENTAZIONE:</label>

        <textarea id="edit-profile-presentation" class="deploy-select" style="font-size:0.9rem; padding:8px; height:80px; resize:none;">${presentationUtente}</textarea>

      </div>

      <button id="btn-save-profile-data" class="events-btn" style="padding:10px; font-size:0.85rem; margin-top:5px; background:linear-gradient(to bottom, #2f855a, #22543d); border-color:#22543d; width: 100%;">Salva Modifiche Profilo</button>

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
const RA_PROBABILITA_DOPPIO_FRAMMENTO = 0.15;

function dataOggiStringaRa() { return new Date().toISOString().slice(0, 10); }

function raDisponibileOggi() {
  return raStato.dataUltimoRitiro !== dataOggiStringaRa();
}

function ritiraDonoRa() {
  if (!raDisponibileOggi()) return;

  raStato.dataUltimoRitiro = dataOggiStringaRa();
  dracmeAttuali += RA_DRACME_BASE;

  const frammenti = Math.random() < RA_PROBABILITA_DOPPIO_FRAMMENTO ? 2 : 1;
  ambraAttuale += frammenti;

  const messaggio = `☀️ Ra ti dona ${RA_DRACME_BASE} Dracme e ${frammenti} Frammento${frammenti > 1 ? "i" : ""} d'Ambra!`;

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
const MIRA_VELOCITA = 2.6;
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

function sparaMiraMancato(xPerc, yPerc) {
  if (miraBloccaClick || !miraInPartita || miraFrecceRimaste <= 0) return;
  miraBloccaClick = true;

  miraFrecceRimaste--;

  const campo = document.getElementById("mira-campo");
  if (campo && typeof xPerc === "number") {
    const segno = document.createElement("span");
    segno.className = "mira-mancato-segno";
    segno.style.left = xPerc + "%";
    segno.style.top = yPerc + "%";
    segno.innerText = "✕";
    campo.appendChild(segno);
    setTimeout(() => segno.remove(), 400);
  }

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
      const rect = campo.getBoundingClientRect();
      const xPerc = ((e.clientX - rect.left) / rect.width) * 100;
      const yPerc = ((e.clientY - rect.top) / rect.height) * 100;
      sparaMiraMancato(xPerc, yPerc);
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
      const opzioni = carteLivello.map(c => {
        const datiCarta = JSON.stringify({ nome: c.nome, immagine: c.immagine, tratti: c.tratti || [], stelle: c.stelle, livello: c.livello, statistiche: c.statistiche }).replace(/"/g, "&quot;");
        return `<option value="${c.id}" data-carta="${datiCarta}">${c.nome} — ${nomeStatOggi}: ${c.statistiche[statOggi].toFixed(1)}</option>`;
      }).join("");
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

// ===== "La Trappola nella Neve": inseguimento a resistenza, non più scavo (Quarta Fatica) =====

let trappolaStato = { tentativiOggi: 0, dataUltimoTentativo: "" };

const TRAPPOLA_TENTATIVI_MAX = 1;
const TRAPPOLA_ENERGIA_MAX = 100;
const TRAPPOLA_COSTO_BASE_INSEGUI = 12;
const TRAPPOLA_COSTO_CRESCITA_INSEGUI = 3;
const TRAPPOLA_DANNO_CINGHIALE_MIN = 15;
const TRAPPOLA_DANNO_CINGHIALE_MAX = 25;
const TRAPPOLA_RECUPERO_GIOCATORE_RIPOSO = 20;
const TRAPPOLA_RECUPERO_CINGHIALE_RIPOSO = 10;

const TRAPPOLA_PREMI_VITTORIA = [
  { turniMax: 4, dracme: 220, frammenti: 1 },
  { turniMax: 6, dracme: 140, frammenti: 0 },
  { turniMax: 9, dracme: 80, frammenti: 0 },
  { turniMax: 13, dracme: 40, frammenti: 0 },
  { turniMax: Infinity, dracme: 20, frammenti: 0 }
];

let trappolaInPartita = false;
let trappolaGiocoFinito = false;
let trappolaEnergiaGiocatore = TRAPPOLA_ENERGIA_MAX;
let trappolaEnergiaCinghiale = TRAPPOLA_ENERGIA_MAX;
let trappolaTurnoAttuale = 0;
let trappolaEsitoTesto = "";
let trappolaUltimaAzioneTesto = "";
let trappolaBloccaClick = false;

function dataOggiStringaTrappola() { return new Date().toISOString().slice(0, 10); }

function assicuraStatoTrappola() {
  const oggi = dataOggiStringaTrappola();
  if (trappolaStato.dataUltimoTentativo !== oggi) {
    trappolaStato.tentativiOggi = 0;
    trappolaStato.dataUltimoTentativo = oggi;
  }
}

function calcolaPremioVittoriaTrappola(turni) {
  for (const p of TRAPPOLA_PREMI_VITTORIA) if (turni <= p.turniMax) return p;
  return { dracme: 20, frammenti: 0 };
}

function calcolaPremioSconfittaTrappola() {
  // Premio di consolazione proporzionale a quanto il cinghiale era stato sfiancato prima del crollo
  const percentualeInflitta = 1 - (trappolaEnergiaCinghiale / TRAPPOLA_ENERGIA_MAX);
  return Math.round(percentualeInflitta * 60);
}

function iniziaPartitaTrappola() {
  assicuraStatoTrappola();
  if (trappolaStato.tentativiOggi >= TRAPPOLA_TENTATIVI_MAX) return;

  trappolaStato.tentativiOggi++;
  salvaProgressoCloud();

  trappolaInPartita = true;
  trappolaGiocoFinito = false;
  trappolaEnergiaGiocatore = TRAPPOLA_ENERGIA_MAX;
  trappolaEnergiaCinghiale = TRAPPOLA_ENERGIA_MAX;
  trappolaTurnoAttuale = 0;
  trappolaUltimaAzioneTesto = "";

  renderContenutoFatiche();
}

function terminaTrappola(vittoria) {
  trappolaInPartita = false;
  trappolaGiocoFinito = true;

  if (vittoria) {
    const premio = calcolaPremioVittoriaTrappola(trappolaTurnoAttuale);
    dracmeAttuali += premio.dracme;
    if (premio.frammenti > 0) ambraAttuale += premio.frammenti;
    if (trappolaTurnoAttuale <= 9) segnaFaticaCompletata("trappola");
    trappolaEsitoTesto = `🐗 Il cinghiale è sfinito, la caccia è tua! Catturato in ${trappolaTurnoAttuale} turni. Bottino: ${premio.dracme} Dracme${premio.frammenti > 0 ? ` e ${premio.frammenti} Frammento d'Ambra` : ""}.`;
  } else {
    const dracmeConsolazione = calcolaPremioSconfittaTrappola();
    dracmeAttuali += dracmeConsolazione;
    trappolaEsitoTesto = `Le forze ti abbandonano nella neve alta: il cinghiale fugge. Per lo sforzo comunque profuso guadagni ${dracmeConsolazione} Dracme.`;
  }

  aggiornaTopbarProfilo();
  salvaProgressoCloud();
  renderContenutoFatiche();
}

function eseguiTurnoTrappola(azione) {
  if (trappolaBloccaClick || !trappolaInPartita) return;
  trappolaBloccaClick = true;

  trappolaTurnoAttuale++;

  if (azione === "insegui") {
    const costoGiocatore = TRAPPOLA_COSTO_BASE_INSEGUI + (trappolaTurnoAttuale - 1) * TRAPPOLA_COSTO_CRESCITA_INSEGUI;
    const dannoCinghiale = TRAPPOLA_DANNO_CINGHIALE_MIN + Math.random() * (TRAPPOLA_DANNO_CINGHIALE_MAX - TRAPPOLA_DANNO_CINGHIALE_MIN);
    trappolaEnergiaGiocatore = Math.max(0, trappolaEnergiaGiocatore - costoGiocatore);
    trappolaEnergiaCinghiale = Math.max(0, trappolaEnergiaCinghiale - dannoCinghiale);
    trappolaUltimaAzioneTesto = `Insegui nella neve alta: -${Math.round(costoGiocatore)} a te, -${Math.round(dannoCinghiale)} al cinghiale.`;
  } else {
    trappolaEnergiaGiocatore = Math.min(TRAPPOLA_ENERGIA_MAX, trappolaEnergiaGiocatore + TRAPPOLA_RECUPERO_GIOCATORE_RIPOSO);
    trappolaEnergiaCinghiale = Math.min(TRAPPOLA_ENERGIA_MAX, trappolaEnergiaCinghiale + TRAPPOLA_RECUPERO_CINGHIALE_RIPOSO);
    trappolaUltimaAzioneTesto = `Riprendi fiato: +${TRAPPOLA_RECUPERO_GIOCATORE_RIPOSO} a te, ma anche il cinghiale recupera +${TRAPPOLA_RECUPERO_CINGHIALE_RIPOSO}.`;
  }

  if (trappolaEnergiaCinghiale <= 0) {
    trappolaBloccaClick = false;
    terminaTrappola(true);
    return;
  }
  if (trappolaEnergiaGiocatore <= 0) {
    trappolaBloccaClick = false;
    terminaTrappola(false);
    return;
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

  if (!trappolaInPartita && !trappolaGiocoFinito) {
    const tentativiRimasti = TRAPPOLA_TENTATIVI_MAX - trappolaStato.tentativiOggi;
    const disponibile = tentativiRimasti > 0;

    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:14px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:10px; padding:14px; color:#e0d5c1; font-size:0.85rem; max-width:400px; text-align:center;">
          <p style="color:#c9a054; font-style:italic; margin-bottom:8px;">Il Cinghiale d'Erimanto seminava il terrore tra i monti dell'Arcadia: Eracle non lo uccise, lo inseguì senza sosta nella neve alta finché la bestia, ormai sfinita, non poté più fuggire.</p>
          <p>Ad ogni turno scegli se <b>inseguire</b> (consuma energia tua, ma indebolisce il cinghiale — la neve si fa più pesante ad ogni passo) o <b>riprendere fiato</b> (recuperi energia, ma anche il cinghiale ne approfitta per riprendersi). Chi resta senza energie per primo, perde.</p>
        </div>
        <button type="button" id="trappola-inizia-btn" class="events-btn events-btn-main" style="max-width:260px;" ${disponibile ? "" : "disabled"}>
          ${disponibile ? "🐗 Inizia l'inseguimento" : "Nessun tentativo rimasto oggi"}
        </button>
        <p style="color:#a89a7a; font-size:0.8rem;">Tentativi rimasti oggi: <b style="color:#ffcc66;">${tentativiRimasti} / ${TRAPPOLA_TENTATIVI_MAX}</b></p>
      </div>`;
  }

  if (trappolaGiocoFinito) {
    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:16px; padding:14px;">
        <div style="background:rgba(15,10,5,0.6); border-radius:12px; padding:20px; color:#e0d5c1; font-size:0.95rem; max-width:400px; text-align:center;">
          ${trappolaEsitoTesto}
        </div>
        <button type="button" id="trappola-chiudi-btn" class="events-btn events-btn-main" style="max-width:240px;">Continua</button>
      </div>`;
  }

  const percTu = Math.round((trappolaEnergiaGiocatore / TRAPPOLA_ENERGIA_MAX) * 100);
  const percCinghiale = Math.round((trappolaEnergiaCinghiale / TRAPPOLA_ENERGIA_MAX) * 100);

  return `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:14px; padding:14px;">
      <div style="color:#e0d5c1; font-size:0.85rem;">Turno <b style="color:#ffcc66;">${trappolaTurnoAttuale}</b></div>

      <div style="width:100%; max-width:360px; display:flex; flex-direction:column; gap:10px;">
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.78rem; color:#a89a7a; margin-bottom:3px;">
            <span>🏃 La tua energia</span><span>${percTu}%</span>
          </div>
          <div class="trappola-barra-energia"><div class="trappola-barra-riempimento trappola-barra-giocatore" style="width:${percTu}%;"></div></div>
        </div>
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.78rem; color:#a89a7a; margin-bottom:3px;">
            <span>🐗 Energia del cinghiale</span><span>${percCinghiale}%</span>
          </div>
          <div class="trappola-barra-energia"><div class="trappola-barra-riempimento trappola-barra-cinghiale" style="width:${percCinghiale}%;"></div></div>
        </div>
      </div>

      <div style="min-height:20px; color:#ffcc66; font-size:0.82rem; text-align:center; max-width:340px;">${trappolaUltimaAzioneTesto}</div>

      <div style="display:flex; gap:12px;">
        <button type="button" id="trappola-insegui-btn" class="events-btn events-btn-main" style="max-width:170px;">🏃 Insegui</button>
        <button type="button" id="trappola-riposa-btn" class="events-btn events-btn-main" style="max-width:170px;">💨 Riprendi fiato</button>
      </div>
    </div>`;
}

function collegaEventiTrappola() {
  document.getElementById("trappola-inizia-btn")?.addEventListener("click", iniziaPartitaTrappola);
  document.getElementById("trappola-chiudi-btn")?.addEventListener("click", chiudiPartitaTrappola);
  document.getElementById("trappola-insegui-btn")?.addEventListener("click", () => eseguiTurnoTrappola("insegui"));
  document.getElementById("trappola-riposa-btn")?.addEventListener("click", () => eseguiTurnoTrappola("riposa"));
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
  const testoCompleto = LORE_CARTE[carta.nome];
  const fraseBase = testoCompleto.split("<br><br>")[0];

  // Maschero ogni occorrenza diretta del nome della creatura (in qualunque punto della frase),
  // così la risposta non viene mai svelata dal testo stesso, indipendentemente dalla scheda.
  const regexNome = new RegExp(carta.nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  const testo = fraseBase.replace(regexNome, "questa creatura");

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
    testo: "Il Colosseo ospita il mio Addestramento: un percorso in più tappe, sempre disponibile quando vuoi, per imparare a fondo come funzionano gli scontri — incluso il modificatore di terreno, che vedremo tra poco."
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
    selettore: "#btn-eventi-fatiche",
    testo: "Qui sotto trovi Le Dodici Fatiche: undici minigiochi diversi, uno per ciascuna prova mitologica di Eracle, più una scala di combattimenti a difficoltà crescente. Un modo diverso — spesso più leggero — per guadagnare Dracme e Frammenti ogni giorno."
  },
  {
    selettore: "#btn-eventi-torneo",
    testo: "Accanto trovi gli Eventi: una classifica a cicli di 2 giorni contro altri Evocatori veri. Ogni ciclo ha le sue regole su quali carte puoi schierare — sempre pensate per non escludere chi ha appena iniziato."
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
    testo: "Ti ho mostrato tanti luoghi diversi, lo so — ma non farti confondere: sono tutte strade per la stessa meta. Combatti, guadagni Dracme e Frammenti, li spendi in nuove creature o le fai evolvere, e ricominci un po' più forte di prima. Scegli tu quale porta attraversare ogni volta. Se mai dovessi dimenticare qualcosa, il tasto Guida qui accanto racconta tutte le regole nel dettaglio. Io, invece, ti lascio andare: il tuo viaggio a Mythophedia comincia adesso. In bocca al lupo, Evocatore."
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

  // Al termine del tutorial iniziale, la formella dell'Addestramento si illumina per invitare
  // il giocatore a provarlo — resta accesa finché non lo apre almeno una volta.
  if (!addestramentoApertoAlmenoUnaVolta) {
    addestramentoDaEvidenziare = true;
    aggiornaEvidenziazioneAddestramento();
  }

  salvaProgressoCloud();
}

// ===== Addestramento nel Colosseo: percorso guidato in 8 tappe sulla meccanica di combattimento =====

let addestramentoTappaAttuale = 0;
let addestramentoRoundAttuale = 0;
let addestramentoRoundVinti = 0;
let addestramentoAttesaScelta = false;
let addestramentoPremioRitirato = false;
let addestramentoApertoAlmenoUnaVolta = false;
let addestramentoDaEvidenziare = false;

const ADDESTRAMENTO_TAPPE = [
  {
    titolo: "Il primo scontro",
    narrazione: "Cominciamo dal principio. Una creatura contro una creatura, nessun terreno particolare: la regola più semplice di tutte.",
    modalita: "osserva",
    terreno: null,
    statistiche: ["ferocia"],
    round: [{ mia: "Grifone Recluta", nemica: "Ceto Minore" }],
    spiegazione: "Hai vinto perché la tua Ferocia era più alta di quella nemica. È la base di ogni scontro: chi ha il valore più alto in quel round, vince quel round."
  },
  {
    titolo: "Più di uno scontro",
    narrazione: "Nei Sottomondi e nelle Guerre di Clan non si combatte una sola volta: si schierano più creature, una contro una, in round successivi.",
    modalita: "osserva",
    terreno: null,
    statistiche: ["ferocia"],
    round: [
      { mia: "Grifone Recluta", nemica: "Ceto Minore" },
      { mia: "Aura Marina", nemica: "Idriade" },
      { mia: "Boggart", nemica: "Cariddi Minore" }
    ],
    spiegazione: "Hai perso il terzo round, ma va bene così: la battaglia si vince a maggioranza. Bastano più round vinti che persi — qui 2 su 3."
  },
  {
    titolo: "Più statistiche insieme",
    narrazione: "A volte conta più di una statistica insieme, mediata tra loro. Guarda con attenzione il primo round qui sotto.",
    modalita: "osserva",
    terreno: null,
    statistiche: ["ferocia", "corazza"],
    round: [
      { mia: "Ippocampo Selvatico", nemica: "Cariddi Minore" },
      { mia: "Alseide", nemica: "Amadriade" },
      { mia: "Boggart", nemica: "Centauro" }
    ],
    spiegazione: "Nel primo round, guardando solo la Ferocia la nemica ti avrebbe battuto — ma qui contava la media di Ferocia e Corazza insieme, e in quella hai vinto tu. Leggi sempre quali statistiche sono in gioco prima di scegliere."
  },
  {
    titolo: "Il terreno conta",
    narrazione: "Ed eccoci al punto più importante: il terreno. Alcuni tratti vengono premiati o penalizzati a seconda di dove si combatte. Terreno: Aria. Scegli con attenzione.",
    modalita: "scegli",
    terreno: "aria",
    statistiche: ["balzo"],
    round: [
      { opzioni: ["Ieraco", "Aura Marina"], nemica: "Grifone Recluta", suggerimento: "In Aria, chi vola prende un bel vantaggio. Chi nuota, invece, ci si trova male." },
      { opzioni: ["Arpìa Cacciatrice", "Idriade"], nemica: "Cariddi Minore", suggerimento: "Stesso principio del round precedente: guarda quale tratto ha ciascuna creatura." },
      { opzioni: ["Grifone Recluta", "Ippocampo Selvatico"], nemica: "Aura Marina", suggerimento: "Ultimo indizio: il cielo aperto non è casa di chi nuota." }
    ],
    spiegazioneVittoria: "Hai scelto sempre le creature con il tratto Volo: in Aria ricevono +2, mentre chi nuota va in penalità di -2. Il terreno giusto ha reso ogni scontro una vittoria netta.",
    spiegazioneSconfitta: "Qualcosa non ha funzionato: ricorda che in Aria il tratto Volo viene premiato (+2) e il tratto Nuoto penalizzato (-2). Riprova osservando bene i tratti delle due opzioni."
  },
  {
    titolo: "Anche in negativo",
    narrazione: "Stesso principio, ma stavolta il terreno è Acqua: chi era favorito prima ora potrebbe non esserlo più.",
    modalita: "scegli",
    terreno: "acqua",
    statistiche: ["balzo"],
    round: [
      { opzioni: ["Aura Marina", "Ieraco"], nemica: "Arpìa Cacciatrice", suggerimento: "In Acqua le regole si ribaltano rispetto all'Aria: chi nuota è a casa sua." },
      { opzioni: ["Cariddi Minore", "Aura Volante"], nemica: "Grifone Recluta", suggerimento: "Le ali qui non aiutano affatto — anzi." },
      { opzioni: ["Ceto Minore", "Fenice Pulcino"], nemica: "Ippogrifo", suggerimento: "Ultimo round: stesso ragionamento di prima." }
    ],
    spiegazioneVittoria: "In Acqua è il tratto Nuoto a ricevere +2, mentre Volo scende di -2. Le stesse identiche creature possono essere perfette o pessime, a seconda solo del terreno.",
    spiegazioneSconfitta: "In Acqua il tratto Nuoto viene premiato (+2), Volo penalizzato (-2) — l'esatto contrario dell'Aria. Riprova."
  },
  {
    titolo: "Scegli tu il terreno giusto",
    narrazione: "Ora tocca a te. Terreno: Foresta. Per ogni round scegli quale delle due creature schierare — pensa a quale tratto viene premiato qui.",
    modalita: "scegli",
    terreno: "foresta",
    statistiche: ["ferocia"],
    round: [
      { opzioni: ["Amadriade", "Ieraco"], nemica: "Cariddi Minore", suggerimento: "In Foresta non è il Volo a essere premiato, ma un altro tratto legato all'equilibrio sul terreno." },
      { opzioni: ["Cerva di Cerinea", "Grifone Recluta"], nemica: "Telchino", suggerimento: "Stesso ragionamento del round precedente." },
      { opzioni: ["Nanuq", "Arpìa Cacciatrice"], nemica: "Makara", suggerimento: "Ultimo indizio: chi si muove bene tra gli alberi e sul terreno accidentato." }
    ],
    spiegazioneVittoria: "In Foresta (e in Terra) sono i tratti Arrampicata ed Equilibrio a ricevere +2. Volo e Nuoto qui non contano nulla, né in bene né in male.",
    spiegazioneSconfitta: "In Foresta il bonus va ai tratti Arrampicata ed Equilibrio (+2). Volo e Nuoto restano neutri, non aiutano. Riprova."
  },
  {
    titolo: "Più creature, più scelte",
    narrazione: "Cambiamo terreno: Acqua. Le stesse creature che in Foresta non ti sarebbero servite qui potrebbero essere perfette — o il contrario.",
    modalita: "scegli",
    terreno: "acqua",
    statistiche: ["ferocia"],
    round: [
      { opzioni: ["Aura Marina", "Ieraco"], nemica: "Grifone Recluta", suggerimento: "Siamo di nuovo in Acqua: quale tratto era favorito, te lo ricordi dalla tappa 5?" },
      { opzioni: ["Cariddi Minore", "Aura Volante"], nemica: "Ippogrifo", suggerimento: "Stesso ragionamento." },
      { opzioni: ["Ippocampo Selvatico", "Fenice Pulcino"], nemica: "Keres della Cenere", suggerimento: "Ultimo round di questa tappa." }
    ],
    spiegazioneVittoria: "Bene: in Acqua il Nuoto resta premiato, il Volo penalizzato — esattamente come nella tappa precedente. La stessa regola vale sempre, indipendentemente da quali creature specifiche hai in mano.",
    spiegazioneSconfitta: "In Acqua il tratto Nuoto è premiato (+2), il Volo penalizzato (-2). Riprova ricordando questa regola."
  },
  {
    titolo: "La prova finale",
    narrazione: "Ultima tappa: una vera battaglia a 5 round, come quelle che troverai sui Sottomondi. Terreni diversi, statistiche diverse, e ogni volta una scelta vera da fare.",
    modalita: "scegli",
    terreno: null,
    statistiche: ["ferocia"],
    round: [
      { opzioni: ["Pegaso", "Ieraco"], nemica: "Uccello Stinfalide", terreno: "foresta", statistiche: ["ferocia"], suggerimento: "Foresta: pensa a equilibrio e arrampicata." },
      { opzioni: ["Aura Marina", "Aura Volante"], nemica: "Grifone Recluta", terreno: "acqua", statistiche: ["balzo"], suggerimento: "Acqua: chi nuota è favorito." },
      { opzioni: ["Fenice Pulcino", "Cariddi Minore"], nemica: "Arpìa Cacciatrice", terreno: "aria", statistiche: ["ferocia"], suggerimento: "Aria: stavolta il volo è premiato." },
      { opzioni: ["Anfisbena", "Ceto Minore"], nemica: "Ippogrifo", terreno: "terra", statistiche: ["corazza"], suggerimento: "Terra: come la Foresta, premia lo stesso genere di tratto." },
      { opzioni: ["Scylla Recluta", "Serpenti del Niflheimr"], nemica: "Nachtrabe", terreno: null, statistiche: ["istinto"], suggerimento: "Nessun terreno qui: guarda solo chi ha la statistica più alta." }
    ],
    spiegazioneVittoria: "Hai superato la prova finale! Hai dimostrato di saper leggere terreno, tratti e statistiche insieme — esattamente quello che serve per giocare bene nei Sottomondi e nelle Guerre di Clan.",
    spiegazioneSconfitta: "Quasi! Ripensa a ogni round: terreno, tratto premiato, statistica più alta. Riprova la prova finale quando vuoi."
  }
];

function valoreConTerreno(nomeCarta, statistiche, terreno) {
  const carta = CARTE_FISSE.find(c => c.nome === nomeCarta);
  const s = carta.statisticheFisse;
  const base = statistiche.reduce((tot, st) => tot + s[st], 0) / statistiche.length;
  const mod = terreno ? calcolaModificatoreTerreno(carta.tratti || [], terreno) : 0;
  return { carta, base: parseFloat(base.toFixed(1)), mod, finale: parseFloat((base + mod).toFixed(1)) };
}

function apriAddestramento() {
  addestramentoApertoAlmenoUnaVolta = true;
  addestramentoDaEvidenziare = false;
  aggiornaEvidenziazioneAddestramento();
  salvaProgressoCloud();

  document.getElementById("addestramento-modal").classList.remove("hidden");

  if (addestramentoPremioRitirato) {
    mostraHubAddestramento();
  } else {
    addestramentoTappaAttuale = 0;
    avviaTappaAddestramento();
  }
}

function mostraHubAddestramento() {
  const contenitore = document.getElementById("addestramento-content");
  contenitore.innerHTML = `
    <div style="display:flex; align-items:center; gap:18px; width:100%; height:100%;">
      <div class="tutorial-chirone-box" style="flex:1; max-width:none; margin:0;">
        <img src="img/carte/chirone.jpg" class="tutorial-chirone-ritratto" onerror="this.style.display='none';">
        <div class="tutorial-chirone-testo">
          <p style="font-weight:bold; color:#ffcc66;">Bentornato, Evocatore.</p>
          <p style="margin-top:8px;">Vuoi ripassare le 8 tappe guidate, o scendere ancora più a fondo nei Sotterranei?</p>
        </div>
      </div>
      <div style="flex:0 0 auto; display:flex; flex-direction:column; gap:8px;">
        <button type="button" id="addestramento-hub-sotterranei-btn" class="events-btn events-btn-main" style="width:auto; margin-top:0; padding:12px 20px; white-space:nowrap;">🕳️ I Sotterranei</button>
        <button type="button" id="addestramento-hub-tappe-btn" class="events-btn" style="width:auto; margin-top:0; padding:12px 20px; white-space:nowrap;">Rifai le 8 Tappe</button>
      </div>
    </div>`;

  document.getElementById("addestramento-hub-tappe-btn").addEventListener("click", () => {
    addestramentoTappaAttuale = 0;
    avviaTappaAddestramento();
  });
  document.getElementById("addestramento-hub-sotterranei-btn").addEventListener("click", apriSotterranei);
}

function avviaTappaAddestramento() {
  addestramentoRoundAttuale = 0;
  addestramentoRoundVinti = 0;
  addestramentoAttesaScelta = false;
  renderizzaAddestramento();
}

function terrenoEmoji(terreno) {
  if (!terreno) return null;
  return { aria: "🌬️ Aria", acqua: "🌊 Acqua", foresta: "🌲 Foresta", terra: "⛰️ Terra" }[terreno.toLowerCase()] || null;
}

function renderizzaAddestramento() {
  const tappa = ADDESTRAMENTO_TAPPE[addestramentoTappaAttuale];
  const contenitore = document.getElementById("addestramento-content");
  const numeroRound = tappa.round.length;
  const inizioRound = addestramentoRoundAttuale === 0 && !addestramentoAttesaScelta;

  if (inizioRound && addestramentoRoundAttuale === 0) {
    contenitore.innerHTML = `
      <div style="display:flex; align-items:center; gap:18px; width:100%; height:100%;">
        <div style="flex:0 0 130px; text-align:center;">
          <p style="color:#a89a7a; font-size:0.75rem; margin:0;">Tappa ${addestramentoTappaAttuale + 1}/${ADDESTRAMENTO_TAPPE.length}</p>
          <h3 style="color:#ffcc66; margin:4px 0 0; font-size:1rem;">${tappa.titolo}</h3>
        </div>
        <div class="tutorial-chirone-box" style="flex:1; max-width:none; margin:0;">
          <img src="img/carte/chirone.jpg" class="tutorial-chirone-ritratto" onerror="this.style.display='none';">
          <div class="tutorial-chirone-testo">${tappa.narrazione}</div>
        </div>
        <button type="button" id="addestramento-inizia-round-btn" class="events-btn events-btn-main" style="flex:0 0 auto; width:auto; margin-top:0; padding:14px 24px;">Inizia</button>
      </div>`;
    document.getElementById("addestramento-inizia-round-btn").addEventListener("click", () => renderizzaRoundAddestramento());
    return;
  }

  renderizzaRoundAddestramento();
}

function renderizzaRoundAddestramento() {
  const tappa = ADDESTRAMENTO_TAPPE[addestramentoTappaAttuale];
  const contenitore = document.getElementById("addestramento-content");
  const round = tappa.round[addestramentoRoundAttuale];
  const terrenoRound = round.terreno !== undefined ? round.terreno : tappa.terreno;
  const statRound = round.statistiche || tappa.statistiche;

  const badgeTerreno = terrenoEmoji(terrenoRound);

  // Layout a due colonne per sfruttare lo spazio orizzontale (il gioco è quasi sempre in
  // orizzontale su mobile): a sinistra Chirone con le informazioni e l'eventuale suggerimento,
  // a destra le carte e l'azione. L'area azione viene sostituita sul posto, non aggiunta sotto,
  // per non far crescere l'altezza della pagina ed evitare lo scroll.
  contenitore.innerHTML = `
    <div style="display:flex; gap:16px; width:100%; height:100%; align-items:stretch;">
      <div style="flex:0 0 190px; display:flex; flex-direction:column; gap:8px;">
        <img src="img/carte/chirone.jpg" style="width:56px; height:56px; border-radius:50%; object-fit:cover; border:2px solid #ffcc66; align-self:center;" onerror="this.style.display='none';">
        <p style="text-align:center; color:#a89a7a; font-size:0.72rem; margin:0;">Tappa ${addestramentoTappaAttuale + 1}/${ADDESTRAMENTO_TAPPE.length} — Round ${addestramentoRoundAttuale + 1}/${tappa.round.length}</p>
        <div style="background:rgba(0,0,0,0.35); border:1px solid #5c4d31; border-radius:8px; padding:8px; font-size:0.75rem;">
          <p style="margin:0 0 4px; color:${badgeTerreno ? '#ffcc66' : '#a89a7a'}; font-weight:bold;">${badgeTerreno || "Nessun terreno"}</p>
          <p style="margin:0; color:#e0d5c1;">Statistiche: <b>${statRound.map(s => s.toUpperCase()).join(" + ")}</b></p>
        </div>
        ${round.suggerimento ? `<div style="background:rgba(0,0,0,0.35); border:1px solid #5c4d31; border-radius:8px; padding:8px; font-size:0.75rem; color:#e0d5c1;"><b style="color:#ffcc66;">Chirone:</b> ${round.suggerimento}</div>` : ""}
      </div>
      <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; min-width:0;">
        <div id="addestramento-carte-zona" style="display:flex; gap:14px; justify-content:center; flex-wrap:wrap; width:100%;"></div>
        <div id="addestramento-azione-zona" style="display:flex; flex-direction:column; align-items:center; gap:8px;"></div>
      </div>
    </div>`;

  const zonaCarte = document.getElementById("addestramento-carte-zona");
  const zonaAzione = document.getElementById("addestramento-azione-zona");

  if (tappa.modalita === "osserva") {
    const mia = valoreConTerreno(round.mia, statRound, terrenoRound);
    const nem = valoreConTerreno(round.nemica, statRound, terrenoRound);

    zonaCarte.innerHTML = costruisciCartaEsempioTutorial(round.mia) + costruisciCartaEsempioTutorial(round.nemica);
    zonaAzione.innerHTML = `<button type="button" id="addestramento-rivela-btn" class="events-btn events-btn-main" style="max-width:220px;">Rivela il risultato</button>`;

    document.getElementById("addestramento-rivela-btn").addEventListener("click", () => {
      mostraEsitoRoundAddestramento(mia, nem, mia.finale > nem.finale);
    });

  } else {
    zonaCarte.innerHTML = `
      <div style="display:flex; gap:14px; flex-wrap:wrap; justify-content:center; align-items:flex-start;">
        ${round.opzioni.map(nome => `<div class="addestramento-opzione-clic" data-nome="${nome}">${costruisciCartaEsempioTutorial(nome)}</div>`).join("")}
        <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
          <span style="color:#a89a7a; font-size:0.68rem;">Nemica</span>
          ${costruisciCartaEsempioTutorial(round.nemica)}
        </div>
      </div>`;
    zonaAzione.innerHTML = `<p style="color:#e0d5c1; font-size:0.8rem; margin:0;">Tocca la carta che vuoi schierare</p>`;

    document.querySelectorAll(".addestramento-opzione-clic").forEach(el => {
      el.addEventListener("click", () => {
        document.querySelectorAll(".addestramento-opzione-clic").forEach(e => e.style.pointerEvents = "none");
        const nomeScelto = el.dataset.nome;
        const nomeScartato = round.opzioni.find(n => n !== nomeScelto);
        const mia = valoreConTerreno(nomeScelto, statRound, terrenoRound);
        const nem = valoreConTerreno(round.nemica, statRound, terrenoRound);
        const scartata = valoreConTerreno(nomeScartato, statRound, terrenoRound);
        mostraEsitoRoundAddestramento(mia, nem, mia.finale > nem.finale, scartata);
      });
    });
  }
}

function mostraEsitoRoundAddestramento(mia, nem, vinto, scartata) {
  if (vinto) addestramentoRoundVinti++;

  const rigaMod = (v) => v.mod !== 0 ? ` <span style="color:${v.mod > 0 ? '#7ee787' : '#f56565'};">${v.mod > 0 ? "+" : ""}${v.mod.toFixed(1)} terreno</span>` : "";

  const zonaAzione = document.getElementById("addestramento-azione-zona");
  zonaAzione.innerHTML = `
    <div style="background:rgba(0,0,0,0.35); border-radius:8px; padding:10px 14px; text-align:center;">
      <p style="font-size:1rem; font-weight:bold; margin:0 0 4px; color:${vinto ? '#7ee787' : '#f56565'};">${vinto ? "Round vinto!" : "Round perso"}</p>
      <p style="font-size:0.8rem; color:#e0d5c1; margin:2px 0;">${mia.carta.nome}: base ${mia.base.toFixed(1)}${rigaMod(mia)} → <b>${mia.finale.toFixed(1)}</b></p>
      <p style="font-size:0.8rem; color:#e0d5c1; margin:2px 0;">${nem.carta.nome}: base ${nem.base.toFixed(1)}${rigaMod(nem)} → <b>${nem.finale.toFixed(1)}</b></p>
      ${scartata ? `<p style="font-size:0.72rem; color:#a89a7a; margin-top:5px;">Con ${scartata.carta.nome}: <b>${scartata.finale.toFixed(1)}</b> — ${scartata.finale > nem.finale ? "avrebbe vinto comunque" : "avrebbe perso"}.</p>` : ""}
    </div>
    <button type="button" id="addestramento-avanti-round-btn" class="events-btn events-btn-main" style="max-width:220px;">
      ${addestramentoRoundAttuale + 1 < ADDESTRAMENTO_TAPPE[addestramentoTappaAttuale].round.length ? "Round successivo" : "Vedi risultato tappa"}
    </button>`;

  document.getElementById("addestramento-avanti-round-btn").addEventListener("click", () => {
    addestramentoRoundAttuale++;
    if (addestramentoRoundAttuale < ADDESTRAMENTO_TAPPE[addestramentoTappaAttuale].round.length) {
      renderizzaRoundAddestramento();
    } else {
      mostraRisultatoTappaAddestramento();
    }
  });
}

function mostraRisultatoTappaAddestramento() {
  const tappa = ADDESTRAMENTO_TAPPE[addestramentoTappaAttuale];
  const totale = tappa.round.length;
  const vinta = addestramentoRoundVinti > totale / 2;
  const ultimaTappa = addestramentoTappaAttuale === ADDESTRAMENTO_TAPPE.length - 1;

  // Nelle tappe a scelta vera, sbagliare ha una conseguenza reale: bisogna rifare la tappa.
  // Nelle tappe puramente dimostrative (1-3) il risultato è già calibrato per finire in vittoria.
  const daRipetere = tappa.modalita === "scegli" && !vinta;

  const spiegazioneTesto = vinta
    ? (tappa.spiegazioneVittoria || tappa.spiegazione || "")
    : (tappa.spiegazioneSconfitta || "");

  const contenitore = document.getElementById("addestramento-content");
  contenitore.innerHTML = `
    <div style="display:flex; align-items:center; gap:18px; width:100%; height:100%;">
      <div class="tutorial-chirone-box" style="flex:1; max-width:none; margin:0;">
        <img src="img/carte/chirone.jpg" class="tutorial-chirone-ritratto" onerror="this.style.display='none';">
        <div class="tutorial-chirone-testo">
          <p style="font-weight:bold; color:${vinta ? '#7ee787' : '#f56565'};">${vinta ? `Battaglia vinta! (${addestramentoRoundVinti} round su ${totale})` : `Battaglia persa (${addestramentoRoundVinti} round su ${totale})`}</p>
          ${spiegazioneTesto ? `<p style="margin-top:8px;">${spiegazioneTesto}</p>` : ""}
        </div>
      </div>
      <button type="button" id="addestramento-prossima-tappa-btn" class="events-btn events-btn-main" style="flex:0 0 auto; width:auto; margin-top:0; padding:14px 24px;">
        ${daRipetere ? "Riprova la tappa" : (ultimaTappa ? "Completa l'Addestramento" : "Tappa successiva")}
      </button>
    </div>`;

  document.getElementById("addestramento-prossima-tappa-btn").addEventListener("click", () => {
    if (daRipetere) {
      avviaTappaAddestramento();
    } else if (ultimaTappa) {
      completaAddestramento();
    } else {
      addestramentoTappaAttuale++;
      avviaTappaAddestramento();
    }
  });
}

function completaAddestramento() {
  const contenitore = document.getElementById("addestramento-content");
  const primaVolta = !addestramentoPremioRitirato;

  let premioHTML = "";
  if (primaVolta) {
    addestramentoPremioRitirato = true;
    dracmeAttuali += 2000;
    ambraAttuale += 5;
    document.getElementById("dracme-count").innerText = dracmeAttuali;
    document.getElementById("ambra-count").innerText = ambraAttuale;
    salvaProgressoCloud();
    premioHTML = `<p style="color:#ffcc66; font-weight:bold; margin-top:10px;">🎁 Premio di laurea: 2000 Dracme e 5 Frammenti d'Ambra!</p>`;
  }

  contenitore.innerHTML = `
    <div style="display:flex; align-items:center; gap:18px; width:100%; height:100%;">
      <div class="tutorial-chirone-box" style="flex:1; max-width:none; margin:0;">
        <img src="img/carte/chirone.jpg" class="tutorial-chirone-ritratto" onerror="this.style.display='none';">
        <div class="tutorial-chirone-testo">
          <p style="font-weight:bold; color:#7ee787;">Sei pronto, Evocatore.</p>
          <p style="margin-top:8px;">Hai visto come si calcola un round, come si vince una battaglia, e soprattutto come il terreno può cambiare tutto. Ora tocca a te: vai a mettere alla prova quello che hai imparato nei Sottomondi e nelle Guerre di Clan.</p>
          <p style="margin-top:8px;">Se invece preferisci allenarti da solo, senza dover affrontare altri giocatori, ti aspetto più a fondo: nei <b style="color:#ffcc66;">Sotterranei</b>.</p>
          ${premioHTML}
        </div>
      </div>
      <div style="flex:0 0 auto; display:flex; flex-direction:column; gap:8px;">
        <button type="button" id="addestramento-vai-sotterranei-btn" class="events-btn events-btn-main" style="width:auto; margin-top:0; padding:12px 20px; white-space:nowrap;">🕳️ I Sotterranei</button>
        <button type="button" id="addestramento-chiudi-finale-btn" class="events-btn" style="width:auto; margin-top:0; padding:12px 20px;">Chiudi</button>
      </div>
    </div>`;

  document.getElementById("addestramento-chiudi-finale-btn").addEventListener("click", () => {
    document.getElementById("addestramento-modal").classList.add("hidden");
  });
  document.getElementById("addestramento-vai-sotterranei-btn").addEventListener("click", apriSotterranei);
}

function aggiornaEvidenziazioneAddestramento() {
  const btn = document.getElementById("btn-duelli");
  if (!btn) return;
  btn.classList.toggle("map-tile-evidenziata", !!addestramentoDaEvidenziare);
}

// ===== I Sotterranei: viaggio infinito contro bot per chi vuole giocare da solo =====

let sotterraneiLivelloAttuale = 1;
let sotterraneiLivelloMassimoConPremio = 0;
let sotterraneiVittorieOggi = 0;
let sotterraneiDataVittorie = "";
let sotterraneiSquadraBot = [];
let sotterraneiTerreno = null;
let sotterraneiStatistiche = ["ferocia"];

const SOTTERRANEI_BLOCCO = 30;
const SOTTERRANEI_VITTORIE_MAX_GIORNO = 10;

function assicuraGiornoSotterranei() {
  const oggi = new Date().toISOString().slice(0, 10);
  if (sotterraneiDataVittorie !== oggi) {
    sotterraneiDataVittorie = oggi;
    sotterraneiVittorieOggi = 0;
  }
}

// La rarità sale un gradino alla volta, ma con calma: 30 livelli di rarità pura, 30 misti con
// quella successiva, poi 30 puri della successiva — così per ogni passaggio, fino al tetto
// naturale di rarità Leggendaria. Oltre quel tetto (livello 330), un moltiplicatore molto lento
// garantisce una scalata davvero infinita.
function calcolaParametriSotterraneo(livello) {
  const indiceBlocco = Math.floor((livello - 1) / SOTTERRANEI_BLOCCO);
  const posizioneNelBlocco = (livello - 1) % SOTTERRANEI_BLOCCO;
  const stelle = Math.min(8, Math.round((posizioneNelBlocco / (SOTTERRANEI_BLOCCO - 1)) * 8));

  let tipo, rarita, raritaA, raritaB;
  if (indiceBlocco >= 10) {
    tipo = "pura";
    rarita = 6;
  } else if (indiceBlocco % 2 === 0) {
    tipo = "pura";
    rarita = Math.floor(indiceBlocco / 2) + 1;
  } else {
    tipo = "mista";
    raritaA = Math.floor((indiceBlocco - 1) / 2) + 1;
    raritaB = raritaA + 1;
  }

  const livelloOltreTetto = Math.max(0, livello - SOTTERRANEI_BLOCCO * 11);
  const moltiplicatoreExtra = 1 + livelloOltreTetto * 0.01;

  return { tipo, rarita, raritaA, raritaB, stelle, moltiplicatoreExtra };
}

function generaBotSotterraneo(livello) {
  const p = calcolaParametriSotterraneo(livello);
  const squadra = [];

  for (let i = 0; i < 5; i++) {
    const raritaScelta = p.tipo === "pura" ? p.rarita : (Math.random() < 0.5 ? p.raritaA : p.raritaB);
    const pool = CARTE_FISSE.filter(c => c.livello === raritaScelta);
    const base = pool[Math.floor(Math.random() * pool.length)];

    const bonusPerStella = raritaScelta === 1 ? 0.7 : raritaScelta === 6 ? 0.3 : 0.6;
    const bonusTotalePerStat = (bonusPerStella * p.stelle) / 4;

    const statistiche = {};
    ["ferocia", "balzo", "corazza", "istinto"].forEach(s => {
      statistiche[s] = parseFloat(((base.statisticheFisse[s] + bonusTotalePerStat) * p.moltiplicatoreExtra).toFixed(1));
    });

    squadra.push({ nome: base.nome, immagine: base.immagine, tratti: base.tratti || [], statistiche, stelle: p.stelle, livello: raritaScelta });
  }

  return squadra;
}

function apriSotterranei() {
  assicuraGiornoSotterranei();
  renderizzaHubSotterranei();
}

function costruisciMappaSotterranei() {
  // Mostro una finestra scorrevole delle ultime tappe percorse più quella attuale, disposte
  // in un percorso asimmetrico (a zig-zag) che si "traccia" mano a mano che si avanza — dato
  // che i livelli sono infiniti, non ha senso provare a mostrarli tutti: la finestra si sposta
  // sempre in avanti insieme al giocatore.
  const NODI = 5;
  const primoLivello = Math.max(1, sotterraneiLivelloAttuale - (NODI - 1));
  const livelli = [];
  for (let l = primoLivello; l <= sotterraneiLivelloAttuale; l++) livelli.push(l);

  const larghezza = 600, altezza = 140;
  const yZigzag = [95, 35, 105, 30, 90];
  const passoX = livelli.length > 1 ? (larghezza - 80) / (livelli.length - 1) : 0;
  const punti = livelli.map((liv, i) => ({
    x: 40 + passoX * i,
    y: yZigzag[i % yZigzag.length],
    livello: liv,
    corrente: liv === sotterraneiLivelloAttuale
  }));

  const lineaHTML = punti.slice(1).map((p, i) => {
    const prec = punti[i];
    return `<line x1="${prec.x}" y1="${prec.y}" x2="${p.x}" y2="${p.y}" stroke="#c9a054" stroke-width="3" stroke-dasharray="${p.corrente ? '6,5' : '0'}" />`;
  }).join("");

  const nodiHTML = punti.map(p => `
    <g>
      <circle cx="${p.x}" cy="${p.y}" r="${p.corrente ? 22 : 17}" fill="${p.corrente ? '#ffcc66' : '#3a3222'}" stroke="${p.corrente ? '#fff6d5' : '#c9a054'}" stroke-width="${p.corrente ? 3 : 2}" ${p.corrente ? 'class="sott-nodo-corrente"' : ''} />
      <text x="${p.x}" y="${p.y + 5}" text-anchor="middle" font-size="${p.corrente ? 15 : 12}" font-weight="bold" fill="${p.corrente ? '#1a1410' : '#e0d5c1'}">${p.livello}</text>
      ${!p.corrente ? `<text x="${p.x}" y="${p.y + 32}" text-anchor="middle" font-size="13">✅</text>` : ""}
    </g>`).join("");

  return `<svg viewBox="0 0 ${larghezza} ${altezza}" style="width:min(100%, 520px, calc(var(--app-height) * 40 / 100 * 600 / 140)); height:auto;">${lineaHTML}${nodiHTML}</svg>`;
}

function renderizzaHubSotterranei() {
  assicuraGiornoSotterranei();
  const contenitore = document.getElementById("addestramento-content");
  const vittorieRimaste = SOTTERRANEI_VITTORIE_MAX_GIORNO - sotterraneiVittorieOggi;
  const bloccato = vittorieRimaste <= 0;

  contenitore.innerHTML = `
    <div style="display:flex; align-items:center; gap:18px; width:100%;">
      <div class="tutorial-chirone-box" style="flex:1; max-width:none; margin:0;">
        <img src="img/carte/chirone.jpg" class="tutorial-chirone-ritratto" onerror="this.style.display='none';">
        <div class="tutorial-chirone-testo">
          <p style="font-weight:bold; color:#ffcc66;">🕳️ Livello ${sotterraneiLivelloAttuale}</p>
          ${bloccato ? `<p style="margin-top:4px; color:#f56565; font-size:0.78rem;">Hai raggiunto il limite di vittorie di oggi. Torna domani.</p>` : ""}
        </div>
      </div>
      <button type="button" id="sotterranei-inizia-btn" class="events-btn events-btn-main" style="flex:0 0 auto; width:auto; margin-top:0; padding:14px 24px; white-space:nowrap;" ${bloccato ? "disabled" : ""}>
        ${bloccato ? "Torna domani" : "Scendi in battaglia"}
      </button>
    </div>
    ${costruisciMappaSotterranei()}`;

  document.getElementById("sotterranei-inizia-btn")?.addEventListener("click", allestisciSquadraSotterranei);
}

const SOTTERRANEI_TERRENI = ["aria", "acqua", "foresta", "terra"];

function allestisciSquadraSotterranei() {
  sotterraneiSquadraBot = generaBotSotterraneo(sotterraneiLivelloAttuale);
  sotterraneiTerreno = SOTTERRANEI_TERRENI[Math.floor(Math.random() * SOTTERRANEI_TERRENI.length)];
  const combinazioniStat = [["ferocia"], ["balzo"], ["corazza"], ["istinto"], ["ferocia", "corazza"], ["balzo", "istinto"]];
  sotterraneiStatistiche = combinazioniStat[Math.floor(Math.random() * combinazioniStat.length)];

  const contenitore = document.getElementById("addestramento-content");
  const slotsHTML = Array.from({ length: 5 }, (_, i) => `
    <div class="select-row sott-select-row">
      <span>${i + 1}°:</span>
      <select id="sott-deploy-slot-${i}" class="deploy-select"></select>
    </div>`).join("");

  contenitore.innerHTML = `
    <div style="display:flex; gap:16px; width:100%; height:100%; align-items:center; justify-content:center; flex-wrap:wrap;">
      <div style="flex:0 0 180px; text-align:center;">
        <p style="color:#ffcc66; font-weight:bold; margin:0;">Livello ${sotterraneiLivelloAttuale}</p>
        <p style="color:#a89a7a; font-size:0.75rem; margin:4px 0;">Terreno: ${terrenoEmoji(sotterraneiTerreno)}</p>
        <p style="color:#a89a7a; font-size:0.72rem; margin:0 0 10px;">Statistiche: <b style="color:#e0d5c1;">${sotterraneiStatistiche.map(s => s.toUpperCase()).join(" + ")}</b></p>
        <button type="button" id="sott-attacca-btn" class="events-btn events-btn-main" style="max-width:180px;" disabled>Scegli le tue 5 creature</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:5px; width:100%; max-width:340px;">${slotsHTML}</div>
    </div>`;

  popolaSelectSchieramentoSotterraneo();
  potenziaMenuATendina();
}

function popolaSelectSchieramentoSotterraneo() {
  let valoriSelezionati = [];
  for (let i = 0; i < 5; i++) {
    const s = document.getElementById(`sott-deploy-slot-${i}`);
    if (s && s.value) valoriSelezionati.push(s.value);
  }

  for (let i = 0; i < 5; i++) {
    const select = document.getElementById(`sott-deploy-slot-${i}`);
    if (!select) continue;
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Seleziona --</option>';

    deckGiocatore.forEach(carta => {
      controllaERinfrescaFatica(carta);
      let vigore = calcolaVigorePercentuale(carta);
      if (carta.isJolly || carta.bloccataInDuello || carta.occupataInDifesa || carta.inizioRiposo || vigore <= 0) return;
      if (valoriSelezionati.includes(carta.id) && carta.id !== currentVal) return;

      const option = document.createElement("option");
      option.value = carta.id;
      let stringaTratti = carta.tratti && carta.tratti.length > 0 ? ` [${carta.tratti.join(",")}]` : " [Nessuno]";
      option.innerText = `${iconaCartaTesto(carta)} ${carta.nome} [ ${vigore}%] F:${carta.statistiche.ferocia} B:${carta.statistiche.balzo} C:${carta.statistiche.corazza} I:${carta.statistiche.istinto}${stringaTratti}`;
      option.dataset.carta = JSON.stringify({ nome: carta.nome, immagine: carta.immagine, tratti: carta.tratti || [], stelle: carta.stelle, livello: carta.livello, vigore, statistiche: carta.statistiche });
      if (carta.id === currentVal) option.selected = true;
      select.appendChild(option);
    });

    select.removeEventListener("change", gestisciCambioSelectSotterraneo);
    select.addEventListener("change", gestisciCambioSelectSotterraneo);
  }
}

function gestisciCambioSelectSotterraneo() {
  popolaSelectSchieramentoSotterraneo();
  const btn = document.getElementById("sott-attacca-btn");
  let scelti = [];
  let valido = true;
  for (let i = 0; i < 5; i++) {
    const val = document.getElementById(`sott-deploy-slot-${i}`).value;
    if (!val || scelti.includes(val)) valido = false;
    else scelti.push(val);
  }
  if (btn) {
    btn.disabled = !valido;
    btn.innerText = valido ? "⚔️ Scendi in battaglia" : "Scegli le tue 5 creature";
  }
}

document.getElementById("addestramento-modal")?.addEventListener("click", (e) => {
  if (e.target && e.target.id === "sott-attacca-btn" && !e.target.disabled) {
    avviaBattagliaSotterraneo();
  }
});

function avviaBattagliaSotterraneo() {
  let mazzoSotterraneo = [];
  for (let i = 0; i < 5; i++) {
    const cardId = document.getElementById(`sott-deploy-slot-${i}`).value;
    mazzoSotterraneo.push(deckGiocatore.find(c => c.id === cardId));
  }

  document.getElementById("addestramento-modal").classList.add("hidden");

  let roundVintiSotterraneo = 0;
  nuovoRegistroBattaglia();
  document.getElementById("battle-title-outcome").innerText = "DISCESA NEI SOTTERRANEI...";
  document.getElementById("battle-report-content").innerHTML = "";
  document.getElementById("battle-result-modal").classList.remove("hidden");
  let sottRoundIdx = 0;

  function eseguiProssimoRoundSotterraneo() {
    if (sottRoundIdx >= 5) {
      risolviFineSotterraneo(mazzoSotterraneo, roundVintiSotterraneo);
      return;
    }

    const miaCarta = mazzoSotterraneo[sottRoundIdx];
    const mostroNemico = sotterraneiSquadraBot[sottRoundIdx];

    let sommaMioVal = 0, sommaNemicoVal = 0;
    sotterraneiStatistiche.forEach(stat => {
      sommaMioVal += miaCarta.statistiche[stat];
      sommaNemicoVal += mostroNemico.statistiche[stat];
    });

    let mioValBase = parseFloat((sommaMioVal / sotterraneiStatistiche.length).toFixed(1));
    let nemicoValBase = parseFloat((sommaNemicoVal / sotterraneiStatistiche.length).toFixed(1));
    let mioMod = calcolaModificatoreTerreno(miaCarta.tratti || [], sotterraneiTerreno);
    let nemicoMod = calcolaModificatoreTerreno(mostroNemico.tratti || [], sotterraneiTerreno);
    let mioValFinale = parseFloat((mioValBase + mioMod).toFixed(1));
    let nemicoValFinale = parseFloat((nemicoValBase + nemicoMod).toFixed(1));

    const esitoRound = (mioValFinale > nemicoValFinale);
    if (esitoRound) roundVintiSotterraneo++;

    const spiegaMio = spiegaModificatoreTerreno(miaCarta.tratti || [], sotterraneiTerreno);
    const spiegaNemico = spiegaModificatoreTerreno(mostroNemico.tratti || [], sotterraneiTerreno);
    registraRoundBattaglia({
      numeroRound: sottRoundIdx + 1,
      mioNome: miaCarta.nome,
      nemicoNome: mostroNemico.nome,
      statistiche: sotterraneiStatistiche,
      mioBase: mioValBase, mioModificatore: mioMod, mioSpiegazioneModificatore: spiegaMio.spiegazione, mioFinale: mioValFinale,
      nemicoBase: nemicoValBase, nemicoModificatore: nemicoMod, nemicoSpiegazioneModificatore: spiegaNemico.spiegazione, nemicoFinale: nemicoValFinale,
      vinto: esitoRound
    });

    let roundCardId = `clash-sott-row-${sottRoundIdx}`;
    let rLineHTML = `
      <div class="battle-arena-row" id="${roundCardId}">
        <div class="effetto-impatto">${svgEsplosioneImpatto()}</div>
        <div class="mini-card-anim" id="my-sott-card-${sottRoundIdx}">
          <div style="font-size:0.8rem; font-weight:bold; color:#ffcc66;">${miaCarta.nome}</div>
          <div style="font-size:1.5rem; margin:5px 0;">${miniImmagineCarta(miaCarta, 40)}</div>
          <div style="font-size:0.75rem; font-weight:bold; color:#fff;">PUNTI: ${mioValFinale}</div>
        </div>
        <div class="vs-clash-text" id="vs-text-sott-${sottRoundIdx}">ROUND ${sottRoundIdx + 1}</div>
        <div class="mini-card-anim" id="nem-sott-card-${sottRoundIdx}">
          <div style="font-size:0.8rem; font-weight:bold; color:#f56565;">${mostroNemico.nome}</div>
          <div style="font-size:1.5rem; margin:5px 0;">${miniImmagineCarta(mostroNemico, 40)}</div>
          <div style="font-size:0.75rem; font-weight:bold; color:#fff;">PUNTI: ${nemicoValFinale}</div>
        </div>
      </div>`;

    if (sottRoundIdx === 0) {
      document.getElementById("battle-report-content").innerHTML = rLineHTML;
    } else {
      document.getElementById("battle-report-content").insertAdjacentHTML("beforeend", rLineHTML);
    }

    let targetRow = document.getElementById(roundCardId);
    if (targetRow) targetRow.scrollIntoView({ behavior: 'smooth', block: 'end' });

    setTimeout(() => {
      document.getElementById(`my-sott-card-${sottRoundIdx}`).classList.add("mia-card-scatto");
      document.getElementById(`nem-sott-card-${sottRoundIdx}`).classList.add("nemica-card-scatto");
      document.getElementById(`vs-text-sott-${sottRoundIdx}`).classList.add("shake");

      document.getElementById(roundCardId)?.classList.add("impatto-flash");
      document.getElementById(roundCardId)?.querySelector(".effetto-impatto")?.classList.add("attivo");

      setTimeout(() => {
        if (esitoRound) {
          document.getElementById(`nem-sott-card-${sottRoundIdx}`).classList.add("card-sconfitta");
          document.getElementById(`vs-text-sott-${sottRoundIdx}`).innerHTML = "VINCI";
          document.getElementById(`vs-text-sott-${sottRoundIdx}`).style.color = "#7ee787";
        } else {
          document.getElementById(`my-sott-card-${sottRoundIdx}`).classList.add("card-sconfitta");
          document.getElementById(`vs-text-sott-${sottRoundIdx}`).innerHTML = "PERDI";
          document.getElementById(`vs-text-sott-${sottRoundIdx}`).style.color = "#f56565";
        }
        applicaSfiancamento(miaCarta, "mondo");
        sottRoundIdx++;
        setTimeout(eseguiProssimoRoundSotterraneo, 1000);
      }, 400);
    }, 600);
  }

  setTimeout(eseguiProssimoRoundSotterraneo, 500);
}

function risolviFineSotterraneo(mazzoSotterraneo, roundVinti) {
  assicuraGiornoSotterranei();

  const stelleGuadagnate = roundVinti >= 5 ? 3 : roundVinti === 4 ? 2 : roundVinti === 3 ? 1 : 0;
  const superato = stelleGuadagnate > 0;
  const primaVoltaSuQuestoLivello = sotterraneiLivelloAttuale > sotterraneiLivelloMassimoConPremio;
  const guadagnoDracme = (superato && primaVoltaSuQuestoLivello) ? stelleGuadagnate * 100 : 0;

  let epilogoHTML = `<div class="info-divider"></div>`;
  document.getElementById("battle-title-outcome").innerText = superato ? "Sotterranei — Superato!" : "Sotterranei — Sconfitta";

  epilogoHTML += `<p style="text-align:center; font-size:1.3rem;">${"⭐".repeat(stelleGuadagnate)}${"☆".repeat(3 - stelleGuadagnate)}</p>`;
  epilogoHTML += `<p style="text-align:center; color:#e0d5c1;">Round vinti: ${roundVinti} su 5</p>`;

  if (guadagnoDracme > 0) {
    dracmeAttuali += guadagnoDracme;
    document.getElementById("dracme-count").innerText = dracmeAttuali;
    epilogoHTML += `<p style="text-align:center; font-weight:bold; color:#ecc94b;">Ricompensa: +${guadagnoDracme} Dracme</p>`;
  } else if (superato) {
    epilogoHTML += `<p style="text-align:center; color:#a89a7a; font-size:0.8rem;">Livello già superato in passato: nessuna nuova ricompensa.</p>`;
  }

  if (superato) {
    if (primaVoltaSuQuestoLivello) sotterraneiLivelloMassimoConPremio = sotterraneiLivelloAttuale;
    sotterraneiVittorieOggi++;
    sotterraneiLivelloAttuale++;
    epilogoHTML += `<p style="text-align:center; color:#7ee787; font-weight:bold;">Livello superato! Ora sei al livello ${sotterraneiLivelloAttuale}.</p>`;
  } else {
    epilogoHTML += `<p style="text-align:center; color:#f56565; font-weight:bold;">Servono almeno 3 vittorie su 5 per superare il livello. Riprova quando vuoi.</p>`;
  }

  salvaProgressoCloud();

  epilogoHTML += `<div style="text-align:center; margin-top:12px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
    <button type="button" class="events-btn btn-vedi-statistiche" style="max-width:220px;">📊 Vedi Statistiche di Battaglia</button>
    <button type="button" class="events-btn events-btn-main" id="sott-torna-hub-btn" style="max-width:220px;">Torna ai Sotterranei</button>
  </div>`;

  document.getElementById("battle-report-content").insertAdjacentHTML("beforeend", epilogoHTML);

  document.getElementById("sott-torna-hub-btn").addEventListener("click", () => {
    document.getElementById("battle-result-modal").classList.add("hidden");
    document.getElementById("addestramento-modal").classList.remove("hidden");
    renderizzaHubSotterranei();
  });
}

// ===== Eventi: torneo a classifica a cicli di 2 giorni, sfide contro bot e giocatori reali =====

const EVENTI_DURATA_CICLO_MS = 2 * 24 * 60 * 60 * 1000;
const EVENTI_SFIDE_MAX = 5;
const EVENTI_TERRENI = ["Aria", "Terra", "Foresta", "Acqua"];
const EVENTI_NOMI_BOT = ["Discepolo di Bronzo", "Novizio dell'Arena", "Custode Silenzioso", "Ombra del Colosseo", "Apprendista Evocatore", "Vagabondo Mistico", "Sfidante Anonimo", "Guardiano Minore", "Iniziato del Rito", "Eco della Battaglia"];

let eventiSquadraDifensiva = null;
let eventiSfideRimaste = EVENTI_SFIDE_MAX;
let eventiTimestampUltimaSfida = null;
let eventiUltimoCicloPremiato = 0;
let eventiPartiteGiocateQuestoCiclo = 0;

// Generatore pseudo-casuale deterministico (mulberry32): a parità di seme produce sempre
// la stessa sequenza di numeri, così ogni giocatore calcola da solo la stessa restrizione
// per lo stesso ciclo, senza bisogno di coordinarsi su Firebase.
function pseudoRandomSeminato(seme) {
  return function() {
    seme |= 0; seme = (seme + 0x6D2B79F5) | 0;
    let t = Math.imul(seme ^ (seme >>> 15), 1 | seme);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function calcolaNumeroCicloEventiCorrente() {
  return Math.floor(Date.now() / EVENTI_DURATA_CICLO_MS);
}

// Genera la restrizione di ammissibilità del ciclo: rarità sempre a partire da Comune (mai
// "solo carte forti"), a volte con un vincolo aggiuntivo su una statistica. Verifica sempre,
// contro il vero mazzo di carte del gioco, che almeno una quindicina di carte diverse la
// soddisfino — altrimenti ne genera un'altra, così i principianti non restano mai esclusi.
function generaRestrizioneEventi(numeroCiclo) {
  const rand = pseudoRandomSeminato(numeroCiclo * 7919 + 13);
  let tentativi = 0;
  while (tentativi < 50) {
    tentativi++;
    const raritaMax = 1 + Math.floor(rand() * 6);
    const usaVincoloStat = rand() < 0.6;
    let vincoloStat = null;
    if (usaVincoloStat) {
      const stats = ["ferocia", "balzo", "corazza", "istinto"];
      const stat = stats[Math.floor(rand() * stats.length)];
      const operatore = rand() < 0.5 ? ">=" : "<=";
      const soglia = operatore === ">=" ? (1 + Math.floor(rand() * 3)) : (4 + Math.floor(rand() * 4));
      vincoloStat = { stat, operatore, soglia };
    }

    const pool = CARTE_FISSE.filter(c => {
      if (c.livello > raritaMax) return false;
      if (vincoloStat) {
        const v = c.statisticheFisse[vincoloStat.stat];
        if (vincoloStat.operatore === ">=" && v < vincoloStat.soglia) return false;
        if (vincoloStat.operatore === "<=" && v > vincoloStat.soglia) return false;
      }
      return true;
    });

    if (pool.length >= 15) return { raritaMax, vincoloStat };
  }
  return { raritaMax: 6, vincoloStat: null };
}

function cartaAmmissibileEventi(carta, restrizione) {
  if (carta.livello > restrizione.raritaMax) return false;
  if (restrizione.vincoloStat) {
    const v = carta.statistiche[restrizione.vincoloStat.stat];
    if (restrizione.vincoloStat.operatore === ">=" && v < restrizione.vincoloStat.soglia) return false;
    if (restrizione.vincoloStat.operatore === "<=" && v > restrizione.vincoloStat.soglia) return false;
  }
  return true;
}

function testoRestrizioneEventi(restrizione) {
  let testo = `Rarità ammesse: fino a ${ETICHETTE_LIVELLI[restrizione.raritaMax]}`;
  if (restrizione.vincoloStat) {
    const simbolo = restrizione.vincoloStat.operatore === ">=" ? "almeno" : "al massimo";
    testo += ` · ${restrizione.vincoloStat.stat.toUpperCase()} ${simbolo} ${restrizione.vincoloStat.soglia}`;
  }
  return testo;
}

function assicuraRicaricaSfideEventi() {
  if (eventiSfideRimaste >= EVENTI_SFIDE_MAX) {
    eventiTimestampUltimaSfida = null;
    return;
  }
  if (!eventiTimestampUltimaSfida) {
    eventiTimestampUltimaSfida = Date.now();
    return;
  }
  const oreTrascorse = Math.floor((Date.now() - eventiTimestampUltimaSfida) / (60 * 60 * 1000));
  if (oreTrascorse <= 0) return;
  eventiSfideRimaste = Math.min(EVENTI_SFIDE_MAX, eventiSfideRimaste + oreTrascorse);
  eventiTimestampUltimaSfida += oreTrascorse * 60 * 60 * 1000;
  if (eventiSfideRimaste >= EVENTI_SFIDE_MAX) eventiTimestampUltimaSfida = null;
}

function generaSquadraBotEventi(restrizione, rand) {
  const pool = CARTE_FISSE.filter(c => {
    if (c.livello > restrizione.raritaMax) return false;
    if (restrizione.vincoloStat) {
      const v = c.statisticheFisse[restrizione.vincoloStat.stat];
      if (restrizione.vincoloStat.operatore === ">=" && v < restrizione.vincoloStat.soglia) return false;
      if (restrizione.vincoloStat.operatore === "<=" && v > restrizione.vincoloStat.soglia) return false;
    }
    return true;
  });
  const squadra = [];
  for (let i = 0; i < 5; i++) {
    const base = pool[Math.floor(rand() * pool.length)];
    squadra.push({ nome: base.nome, immagine: base.immagine, tratti: base.tratti || [], statistiche: { ...base.statisticheFisse } });
  }
  return squadra;
}

function seminaLottiBotEventi(numeroCiclo, restrizione, callback) {
  const rand = pseudoRandomSeminato(numeroCiclo * 104729 + 7);
  const NUM_BOT = 40;
  let scritture = 0;
  for (let i = 0; i < NUM_BOT; i++) {
    const nome = EVENTI_NOMI_BOT[Math.floor(rand() * EVENTI_NOMI_BOT.length)] + " " + (i + 1);
    const punteggio = Math.floor(rand() * 26);
    const squadra = generaSquadraBotEventi(restrizione, rand);
    dbFirebase.ref(`eventi_classifica/${numeroCiclo}/bot_${i}`).set({ nome, punteggio, squadra, eBot: true })
      .catch(() => {})
      .finally(() => { scritture++; if (scritture >= NUM_BOT && callback) callback(); });
  }
}

function assicuraClassificaEventiSeminata(numeroCiclo, restrizione, callback) {
  // Controllo specificamente la presenza di un bot (chiave deterministica "bot_0"), non
  // semplicemente "esiste qualche dato" — perché a questo punto la squadra del giocatore
  // potrebbe essere già stata scritta un attimo prima, facendo credere erroneamente che
  // la classifica sia già popolata quando in realtà i bot non sono mai stati creati.
  dbFirebase.ref(`eventi_classifica/${numeroCiclo}/bot_0`).once("value").then(snapshot => {
    if (snapshot.exists()) {
      callback();
    } else {
      seminaLottiBotEventi(numeroCiclo, restrizione, callback);
    }
  }).catch(() => callback());
}

let eventiNumeroCicloCorrente = null;
let eventiRestrizioneCorrente = null;
let eventiTerrenoCorrente = null;

// Il terreno, come la restrizione, è deciso una volta sola per l'intero ciclo di 2 giorni —
// deterministico dal numero di ciclo, così ogni giocatore lo calcola da solo allo stesso modo,
// e lo conosce fin da quando sceglie la squadra, non solo un attimo prima di ogni sfida.
function calcolaTerrenoEventi(numeroCiclo) {
  const rand = pseudoRandomSeminato(numeroCiclo * 31337 + 5);
  return EVENTI_TERRENI[Math.floor(rand() * EVENTI_TERRENI.length)];
}

function apriEventi() {
  eventiNumeroCicloCorrente = calcolaNumeroCicloEventiCorrente();
  eventiRestrizioneCorrente = generaRestrizioneEventi(eventiNumeroCicloCorrente);
  eventiTerrenoCorrente = calcolaTerrenoEventi(eventiNumeroCicloCorrente);
  assicuraRicaricaSfideEventi();

  document.getElementById("eventi-content").innerHTML = `<p style="text-align:center; color:#a89a7a;">Preparazione dell'arena in corso...</p>`;
  document.getElementById("eventi-modal").classList.remove("hidden");
  document.querySelector("#eventi-modal .modal-card").classList.add("eventi-bg-attivo");

  if (!utenteFirebaseAttuale) return;

  controllaFineCicloEventi(() => {
    dbFirebase.ref(`eventi_classifica/${eventiNumeroCicloCorrente}/${utenteFirebaseAttuale.uid}`).once("value").then(snapshot => {
      if (snapshot.exists() && snapshot.val().squadra) {
        eventiSquadraDifensiva = snapshot.val().squadra;
        assicuraClassificaEventiSeminata(eventiNumeroCicloCorrente, eventiRestrizioneCorrente, renderizzaHubEventi);
      } else {
        eventiPartiteGiocateQuestoCiclo = 0;
        renderizzaSelezioneSquadraEventi();
      }
    }).catch(() => renderizzaSelezioneSquadraEventi());
  });
}

function renderizzaSelezioneSquadraEventi() {
  const contenitore = document.getElementById("eventi-content");
  const slotsHTML = Array.from({ length: 5 }, (_, i) => `
    <div class="select-row sott-select-row">
      <span>${i + 1}°:</span>
      <select id="ev-deploy-slot-${i}" class="deploy-select"></select>
    </div>`).join("");

  contenitore.innerHTML = `
    <div style="text-align:center; width:100%;">
      <p style="color:#ffcc66; font-weight:bold;">🏆 Nuovo Evento in corso</p>
      <p style="color:#a89a7a; font-size:0.8rem;">${testoRestrizioneEventi(eventiRestrizioneCorrente)}</p>
      <p style="color:#ffcc66; font-size:0.82rem; font-weight:bold; margin-top:4px;">Terreno di questo evento: ${terrenoEmoji(eventiTerrenoCorrente)}</p>
      <p style="color:#a89a7a; font-size:0.75rem; margin-top:4px;">Scegli le 5 carte con cui parteciperai — verranno usate sia quando sfidi altri, sia come tua difesa quando qualcuno sfida te.</p>
    </div>
    <div style="display:flex; flex-direction:column; gap:5px; width:100%; max-width:360px;">${slotsHTML}</div>
    <button type="button" id="ev-conferma-squadra-btn" class="events-btn events-btn-main" style="max-width:240px;" disabled>Scegli le tue 5 creature</button>`;

  popolaSelectSchieramentoEventi();
  potenziaMenuATendina();
}

function popolaSelectSchieramentoEventi() {
  let valoriSelezionati = [];
  for (let i = 0; i < 5; i++) {
    const s = document.getElementById(`ev-deploy-slot-${i}`);
    if (s && s.value) valoriSelezionati.push(s.value);
  }

  for (let i = 0; i < 5; i++) {
    const select = document.getElementById(`ev-deploy-slot-${i}`);
    if (!select) continue;
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Seleziona --</option>';

    deckGiocatore.forEach(carta => {
      if (carta.isJolly || !cartaAmmissibileEventi(carta, eventiRestrizioneCorrente)) return;
      if (valoriSelezionati.includes(carta.id) && carta.id !== currentVal) return;

      const option = document.createElement("option");
      option.value = carta.id;
      let stringaTratti = carta.tratti && carta.tratti.length > 0 ? ` [${carta.tratti.join(",")}]` : " [Nessuno]";
      option.innerText = `${iconaCartaTesto(carta)} ${carta.nome} F:${carta.statistiche.ferocia} B:${carta.statistiche.balzo} C:${carta.statistiche.corazza} I:${carta.statistiche.istinto}${stringaTratti}`;
      option.dataset.carta = JSON.stringify({ nome: carta.nome, immagine: carta.immagine, tratti: carta.tratti || [], stelle: carta.stelle, livello: carta.livello, statistiche: carta.statistiche });
      if (carta.id === currentVal) option.selected = true;
      select.appendChild(option);
    });

    select.removeEventListener("change", gestisciCambioSelectEventi);
    select.addEventListener("change", gestisciCambioSelectEventi);
  }
}

function gestisciCambioSelectEventi() {
  popolaSelectSchieramentoEventi();
  const btn = document.getElementById("ev-conferma-squadra-btn");
  let scelti = [];
  let valido = true;
  for (let i = 0; i < 5; i++) {
    const val = document.getElementById(`ev-deploy-slot-${i}`).value;
    if (!val || scelti.includes(val)) valido = false;
    else scelti.push(val);
  }
  if (btn) {
    btn.disabled = !valido;
    btn.innerText = valido ? "Conferma squadra" : "Scegli le tue 5 creature";
  }
}

document.getElementById("eventi-modal")?.addEventListener("click", (e) => {
  if (e.target && e.target.id === "ev-conferma-squadra-btn" && !e.target.disabled) {
    confermaSquadraEventi();
  }
});

function confermaSquadraEventi() {
  const squadra = [];
  for (let i = 0; i < 5; i++) {
    const cardId = document.getElementById(`ev-deploy-slot-${i}`).value;
    const carta = deckGiocatore.find(c => c.id === cardId);
    squadra.push({ nome: carta.nome, immagine: carta.immagine, tratti: carta.tratti || [], statistiche: { ...carta.statistiche } });
  }
  eventiSquadraDifensiva = squadra;
  eventiUltimoCicloPartecipato = eventiNumeroCicloCorrente;
  eventiPartiteGiocateQuestoCiclo = 0;

  dbFirebase.ref(`eventi_classifica/${eventiNumeroCicloCorrente}/${utenteFirebaseAttuale.uid}`).set({
    nome: nicknameUtente, punteggio: 0, squadra, eBot: false
  }).then(() => {
    salvaProgressoCloud();
    assicuraClassificaEventiSeminata(eventiNumeroCicloCorrente, eventiRestrizioneCorrente, renderizzaHubEventi);
  }).catch((err) => {
    console.error("Errore salvataggio squadra Eventi:", err);
    document.getElementById("eventi-content").innerHTML = `
      <p style="text-align:center; color:#f56565;">Non è stato possibile salvare la squadra. Controlla la connessione e riprova.</p>
      <button type="button" id="ev-riprova-squadra-btn" class="events-btn events-btn-main" style="max-width:220px;">Riprova</button>`;
    document.getElementById("ev-riprova-squadra-btn").addEventListener("click", renderizzaSelezioneSquadraEventi);
  });
}

function renderizzaHubEventi() {
  assicuraRicaricaSfideEventi();
  const contenitore = document.getElementById("eventi-content");
  const tempoAlProssimoCiclo = EVENTI_DURATA_CICLO_MS - (Date.now() % EVENTI_DURATA_CICLO_MS);
  const oreRimaste = Math.floor(tempoAlProssimoCiclo / (60 * 60 * 1000));

  dbFirebase.ref(`eventi_classifica/${eventiNumeroCicloCorrente}`).once("value").then(snapshot => {
    const dati = snapshot.val() || {};
    const elenco = Object.entries(dati).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.punteggio - a.punteggio);
    const mioIndice = elenco.findIndex(e => e.id === utenteFirebaseAttuale.uid);
    const mioPunteggio = mioIndice >= 0 ? elenco[mioIndice].punteggio : 0;
    const miaPosizione = mioIndice >= 0 ? mioIndice + 1 : "-";

    let avversari;
    if (eventiPartiteGiocateQuestoCiclo === 0) {
      const candidatiSfidabili = elenco.filter(e => e.id !== utenteFirebaseAttuale.uid);
      const scelti = new Set();
      while (scelti.size < Math.min(5, candidatiSfidabili.length)) {
        scelti.add(candidatiSfidabili[Math.floor(Math.random() * candidatiSfidabili.length)].id);
      }
      const idScelti = elenco.filter(e => scelti.has(e.id) || e.id === utenteFirebaseAttuale.uid).map(e => e.id);
      avversari = elenco.filter(e => idScelti.includes(e.id));
    } else if (mioIndice >= 0) {
      const inizio = Math.max(0, mioIndice - 5);
      const fine = Math.min(elenco.length, mioIndice + 6);
      avversari = elenco.slice(inizio, fine);
    } else {
      avversari = elenco.slice(0, 5);
    }

    const avversariHTML = avversari.map(a => {
      const sonoIo = a.id === utenteFirebaseAttuale.uid;
      return `
      <div style="display:flex; justify-content:space-between; align-items:center; background:${sonoIo ? 'rgba(255,204,102,0.15)' : 'rgba(0,0,0,0.35)'}; border:1px solid ${sonoIo ? '#ffcc66' : '#5c4d31'}; border-radius:8px; padding:8px 12px; width:100%; max-width:420px;">
        <span style="color:#e0d5c1; font-size:0.85rem;">${sonoIo ? "⭐" : (a.eBot ? "🤖" : "👤")} ${a.nome}${sonoIo ? " (Tu)" : ""} <span style="color:#ffcc66;">(${a.punteggio} pt)</span></span>
        ${sonoIo ? "" : `<button type="button" class="events-btn ev-sfida-btn" data-id="${a.id}" style="max-width:100px; font-size:0.75rem; padding:6px 10px;" ${eventiSfideRimaste <= 0 ? "disabled" : ""}>Sfida</button>`}
      </div>`;
    }).join("");

    contenitore.innerHTML = `
      <div style="text-align:center; width:100%;">
        <p style="color:#ffcc66; font-weight:bold;">🏆 Evento in corso — termina tra ${oreRimaste}h</p>
        <p style="color:#a89a7a; font-size:0.78rem;">${testoRestrizioneEventi(eventiRestrizioneCorrente)}</p>
        <p style="color:#ffcc66; font-size:0.78rem; font-weight:bold;">Terreno: ${terrenoEmoji(eventiTerrenoCorrente)}</p>
        <p style="color:#e0d5c1; font-size:0.85rem; margin-top:4px;">La tua posizione: <b style="color:#ffcc66;">${miaPosizione}</b> — Punti: <b style="color:#ffcc66;">${mioPunteggio}</b></p>
        <p style="color:${eventiSfideRimaste > 0 ? '#7ee787' : '#f56565'}; font-size:0.78rem;">Sfide disponibili: ${eventiSfideRimaste} / ${EVENTI_SFIDE_MAX}</p>
      </div>
      <button type="button" id="ev-cambia-squadra-btn" class="events-btn" style="max-width:200px; font-size:0.75rem;">Cambia squadra</button>
      <div style="display:flex; flex-direction:column; gap:8px; width:100%; align-items:center;">${avversariHTML || '<p style="color:#a89a7a;">Nessun avversario disponibile al momento.</p>'}</div>`;

    document.getElementById("ev-cambia-squadra-btn").addEventListener("click", renderizzaSelezioneSquadraEventi);
    document.querySelectorAll(".ev-sfida-btn").forEach(btn => {
      btn.addEventListener("click", () => avviaSfidaEventi(btn.dataset.id, elenco.find(e => e.id === btn.dataset.id)));
    });
  }).catch((err) => {
    console.error("Errore lettura classifica Eventi:", err);
    contenitore.innerHTML = `
      <p style="text-align:center; color:#f56565;">Non è stato possibile caricare la classifica. Controlla la connessione e riprova.</p>
      <button type="button" id="ev-riprova-hub-btn" class="events-btn events-btn-main" style="max-width:220px;">Riprova</button>`;
    document.getElementById("ev-riprova-hub-btn").addEventListener("click", renderizzaHubEventi);
  });
}

const EVENTI_MODALITA = [
  { nome: "Normale", numStat: 1 },
  { nome: "Bifase", numStat: 2 },
  { nome: "Trifase", numStat: 3 }
];

let eventiSquadraLocaleOrdinata = null;
let eventiIndiceSelezionatoPerScambio = null;

function avviaSfidaEventi(avversarioId, avversarioDati) {
  if (eventiSfideRimaste <= 0 || !avversarioDati) return;

  const tutteStat = ["ferocia", "balzo", "corazza", "istinto"];
  const modalitaScelta = EVENTI_MODALITA[Math.floor(Math.random() * EVENTI_MODALITA.length)];
  const statisticheMescolate = tutteStat.slice().sort(() => Math.random() - 0.5);
  const eventiStatistiche = statisticheMescolate.slice(0, modalitaScelta.numStat);
  const eventiTerreno = eventiTerrenoCorrente;

  eventiSquadraLocaleOrdinata = eventiSquadraDifensiva.map(c => ({ ...c }));
  eventiIndiceSelezionatoPerScambio = null;

  renderizzaAnteprimaSfidaEventi(avversarioId, avversarioDati, eventiTerreno, modalitaScelta, eventiStatistiche);
}

function terrenoCongenialeCreatura(tratti) {
  if (!tratti || tratti.length === 0) return null;
  if (tratti.includes("volo")) return { emoji: "🌬️", nome: "Aria", chiavi: ["aria"] };
  if (tratti.includes("nuoto")) return { emoji: "🌊", nome: "Acqua", chiavi: ["acqua"] };
  if (tratti.includes("arrampicata") || tratti.includes("equilibrio")) return { emoji: "🌲⛰️", nome: "Foresta/Terra", chiavi: ["foresta", "terra"] };
  return null;
}

function renderizzaAnteprimaSfidaEventi(avversarioId, avversarioDati, terreno, modalitaScelta, statistiche) {
  const contenitore = document.getElementById("eventi-content");
  const terrenoAttualeMin = (terreno || "").toLowerCase();

  const rigaCongeniale = (c) => {
    const cong = terrenoCongenialeCreatura(c.tratti);
    if (!cong) return `<div style="font-size:0.6rem; color:#6b5f45; margin-top:1px;">— nessun terreno preferito —</div>`;
    const favorevole = cong.chiavi.includes(terrenoAttualeMin);
    return `<div style="font-size:0.6rem; margin-top:1px; font-weight:${favorevole ? "bold" : "normal"}; color:${favorevole ? "#7ee787" : "#a89a7a"};">${cong.emoji} ${cong.nome}${favorevole ? " ✓" : ""}</div>`;
  };

  const cartaOpponenteHTML = (c) => `
    <div style="background:rgba(0,0,0,0.35); border:1px solid #5c4d31; border-radius:8px; padding:6px; text-align:center; width:90px; display:flex; flex-direction:column; align-items:center;">
      <div style="font-size:1.4rem;">${miniImmagineCarta(c, 30)}</div>
      <div style="font-size:0.68rem; font-weight:bold; color:#e0d5c1; margin-top:2px; min-height:2.2em; display:flex; align-items:center;">${c.nome}</div>
      <div style="font-size:0.62rem; color:#a89a7a;">F:${c.statistiche.ferocia} B:${c.statistiche.balzo}<br>C:${c.statistiche.corazza} I:${c.statistiche.istinto}</div>
      ${rigaCongeniale(c)}
    </div>`;

  const cartaMiaHTML = (c, idx) => `
    <div class="ev-carta-riordino" data-idx="${idx}" style="background:${idx === eventiIndiceSelezionatoPerScambio ? 'rgba(255,204,102,0.3)' : 'rgba(0,0,0,0.35)'}; border:1px solid ${idx === eventiIndiceSelezionatoPerScambio ? '#ffcc66' : '#5c4d31'}; border-radius:8px; padding:6px; text-align:center; width:90px; cursor:pointer; display:flex; flex-direction:column; align-items:center;">
      <div style="font-size:1.4rem;">${miniImmagineCarta(c, 30)}</div>
      <div style="font-size:0.68rem; font-weight:bold; color:#e0d5c1; margin-top:2px; min-height:2.2em; display:flex; align-items:center;">${c.nome}</div>
      <div style="font-size:0.62rem; color:#a89a7a;">F:${c.statistiche.ferocia} B:${c.statistiche.balzo}<br>C:${c.statistiche.corazza} I:${c.statistiche.istinto}</div>
      ${rigaCongeniale(c)}
    </div>`;

  const righeRound = Array.from({ length: 5 }, (_, idx) => `
    <div style="display:flex; align-items:center; gap:10px;">
      ${cartaOpponenteHTML(avversarioDati.squadra[idx])}
      <span style="color:#ffcc66; font-size:0.7rem; font-weight:bold; width:20px; text-align:center;">R${idx + 1}</span>
      ${cartaMiaHTML(eventiSquadraLocaleOrdinata[idx], idx)}
    </div>`).join("");

  contenitore.innerHTML = `
    <div style="text-align:center; width:100%;">
      <p style="color:#ffcc66; font-weight:bold;">Sfida contro ${avversarioDati.nome}</p>
      <p style="color:#a89a7a; font-size:0.8rem;">Terreno: ${terrenoEmoji(terreno)} — Modalità: ${modalitaScelta.nome} (${statistiche.map(s => s.toUpperCase()).join(" + ")})</p>
    </div>
    <div style="display:flex; gap:10px; justify-content:center; font-size:0.75rem; font-weight:bold;">
      <span style="color:#f56565; width:90px; text-align:center;">Avversario</span>
      <span style="width:20px;"></span>
      <span style="color:#7ee787; width:90px; text-align:center;">Tu — tocca 2 per scambiare</span>
    </div>
    <div style="display:flex; flex-direction:column; gap:8px; align-items:center;">${righeRound}</div>
    <div style="display:flex; gap:10px;">
      <button type="button" id="ev-annulla-anteprima-btn" class="events-btn" style="max-width:160px; font-size:0.8rem;">Annulla</button>
      <button type="button" id="ev-combatti-btn" class="events-btn events-btn-main" style="max-width:200px;">⚔️ Combatti</button>
    </div>`;

  document.querySelectorAll(".ev-carta-riordino").forEach(el => {
    el.addEventListener("click", () => {
      const idx = parseInt(el.dataset.idx);
      if (eventiIndiceSelezionatoPerScambio === null) {
        eventiIndiceSelezionatoPerScambio = idx;
      } else if (eventiIndiceSelezionatoPerScambio === idx) {
        eventiIndiceSelezionatoPerScambio = null;
      } else {
        const tmp = eventiSquadraLocaleOrdinata[idx];
        eventiSquadraLocaleOrdinata[idx] = eventiSquadraLocaleOrdinata[eventiIndiceSelezionatoPerScambio];
        eventiSquadraLocaleOrdinata[eventiIndiceSelezionatoPerScambio] = tmp;
        eventiIndiceSelezionatoPerScambio = null;
      }
      renderizzaAnteprimaSfidaEventi(avversarioId, avversarioDati, terreno, modalitaScelta, statistiche);
    });
  });

  document.getElementById("ev-annulla-anteprima-btn").addEventListener("click", renderizzaHubEventi);
  document.getElementById("ev-combatti-btn").addEventListener("click", () => {
    confermaBattagliaEventi(avversarioId, avversarioDati, terreno, modalitaScelta, statistiche);
  });
}

function confermaBattagliaEventi(avversarioId, avversarioDati, eventiTerreno, modalitaScelta, eventiStatistiche) {
  assicuraRicaricaSfideEventi();
  eventiSfideRimaste--;
  if (!eventiTimestampUltimaSfida) eventiTimestampUltimaSfida = Date.now();

  const squadraDaUsare = eventiSquadraLocaleOrdinata;

  document.getElementById("eventi-modal").classList.add("hidden");

  let roundVintiEventi = 0;
  nuovoRegistroBattaglia();
  document.getElementById("battle-title-outcome").innerText = `SFIDA CONTRO ${avversarioDati.nome.toUpperCase()}...`;
  document.getElementById("battle-report-content").innerHTML = "";
  document.getElementById("battle-result-modal").classList.remove("hidden");
  let evRoundIdx = 0;

  function eseguiProssimoRoundEventi() {
    if (evRoundIdx >= 5) {
      risolviFineSfidaEventi(avversarioId, avversarioDati, roundVintiEventi);
      return;
    }

    const miaCarta = squadraDaUsare[evRoundIdx];
    const cartaAvversaria = avversarioDati.squadra[evRoundIdx];

    let sommaMioVal = 0, sommaAvvVal = 0;
    eventiStatistiche.forEach(stat => {
      sommaMioVal += miaCarta.statistiche[stat];
      sommaAvvVal += cartaAvversaria.statistiche[stat];
    });

    let mioValBase = parseFloat((sommaMioVal / eventiStatistiche.length).toFixed(1));
    let avvValBase = parseFloat((sommaAvvVal / eventiStatistiche.length).toFixed(1));
    let mioMod = calcolaModificatoreTerreno(miaCarta.tratti || [], eventiTerreno);
    let avvMod = calcolaModificatoreTerreno(cartaAvversaria.tratti || [], eventiTerreno);
    let mioValFinale = parseFloat((mioValBase + mioMod).toFixed(1));
    let avvValFinale = parseFloat((avvValBase + avvMod).toFixed(1));

    const esitoRound = (mioValFinale > avvValFinale);
    if (esitoRound) roundVintiEventi++;

    const spiegaMio = spiegaModificatoreTerreno(miaCarta.tratti || [], eventiTerreno);
    const spiegaAvv = spiegaModificatoreTerreno(cartaAvversaria.tratti || [], eventiTerreno);
    registraRoundBattaglia({
      numeroRound: evRoundIdx + 1,
      mioNome: miaCarta.nome,
      nemicoNome: cartaAvversaria.nome,
      statistiche: eventiStatistiche,
      mioBase: mioValBase, mioModificatore: mioMod, mioSpiegazioneModificatore: spiegaMio.spiegazione, mioFinale: mioValFinale,
      nemicoBase: avvValBase, nemicoModificatore: avvMod, nemicoSpiegazioneModificatore: spiegaAvv.spiegazione, nemicoFinale: avvValFinale,
      vinto: esitoRound
    });

    let roundCardId = `clash-ev-row-${evRoundIdx}`;
    let rLineHTML = `
      <div class="battle-arena-row" id="${roundCardId}">
        <div class="effetto-impatto">${svgEsplosioneImpatto()}</div>
        <div class="mini-card-anim" id="my-ev-card-${evRoundIdx}">
          <div style="font-size:0.8rem; font-weight:bold; color:#ffcc66;">${miaCarta.nome}</div>
          <div style="font-size:1.5rem; margin:5px 0;">${miniImmagineCarta(miaCarta, 40)}</div>
          <div style="font-size:0.75rem; font-weight:bold; color:#fff;">PUNTI: ${mioValFinale}</div>
        </div>
        <div class="vs-clash-text" id="vs-text-ev-${evRoundIdx}">ROUND ${evRoundIdx + 1}</div>
        <div class="mini-card-anim" id="nem-ev-card-${evRoundIdx}">
          <div style="font-size:0.8rem; font-weight:bold; color:#f56565;">${cartaAvversaria.nome}</div>
          <div style="font-size:1.5rem; margin:5px 0;">${miniImmagineCarta(cartaAvversaria, 40)}</div>
          <div style="font-size:0.75rem; font-weight:bold; color:#fff;">PUNTI: ${avvValFinale}</div>
        </div>
      </div>`;

    if (evRoundIdx === 0) {
      document.getElementById("battle-report-content").innerHTML = `<p style="text-align:center; color:#a89a7a; font-size:0.8rem;">Modalità: ${modalitaScelta.nome} (${eventiStatistiche.map(s => s.toUpperCase()).join(" + ")}) — Terreno: ${terrenoEmoji(eventiTerreno)}</p>` + rLineHTML;
    } else {
      document.getElementById("battle-report-content").insertAdjacentHTML("beforeend", rLineHTML);
    }

    let targetRow = document.getElementById(roundCardId);
    if (targetRow) targetRow.scrollIntoView({ behavior: 'smooth', block: 'end' });

    setTimeout(() => {
      document.getElementById(`my-ev-card-${evRoundIdx}`).classList.add("mia-card-scatto");
      document.getElementById(`nem-ev-card-${evRoundIdx}`).classList.add("nemica-card-scatto");
      document.getElementById(`vs-text-ev-${evRoundIdx}`).classList.add("shake");

      document.getElementById(roundCardId)?.classList.add("impatto-flash");
      document.getElementById(roundCardId)?.querySelector(".effetto-impatto")?.classList.add("attivo");

      setTimeout(() => {
        if (esitoRound) {
          document.getElementById(`nem-ev-card-${evRoundIdx}`).classList.add("card-sconfitta");
          document.getElementById(`vs-text-ev-${evRoundIdx}`).innerHTML = "VINCI";
          document.getElementById(`vs-text-ev-${evRoundIdx}`).style.color = "#7ee787";
        } else {
          document.getElementById(`my-ev-card-${evRoundIdx}`).classList.add("card-sconfitta");
          document.getElementById(`vs-text-ev-${evRoundIdx}`).innerHTML = "PERDI";
          document.getElementById(`vs-text-ev-${evRoundIdx}`).style.color = "#f56565";
        }
        evRoundIdx++;
        setTimeout(eseguiProssimoRoundEventi, 1000);
      }, 400);
    }, 600);
  }

  setTimeout(eseguiProssimoRoundEventi, 500);
}

function risolviFineSfidaEventi(avversarioId, avversarioDati, roundVinti) {
  eventiPartiteGiocateQuestoCiclo++;

  let epilogoHTML = `<div class="info-divider"></div>`;
  document.getElementById("battle-title-outcome").innerText = `Sfida conclusa: ${roundVinti} punti guadagnati`;

  epilogoHTML += `<p style="text-align:center; font-size:1.2rem; color:#ffcc66; font-weight:bold;">+${roundVinti} punti</p>`;
  epilogoHTML += `<p style="text-align:center; color:#e0d5c1;">Round vinti contro ${avversarioDati.nome}: ${roundVinti} su 5</p>`;

  if (utenteFirebaseAttuale) {
    const rifMio = dbFirebase.ref(`eventi_classifica/${eventiNumeroCicloCorrente}/${utenteFirebaseAttuale.uid}/punteggio`);
    rifMio.transaction(punteggioAttuale => (punteggioAttuale || 0) + roundVinti).catch((err) => {
      console.error("Errore aggiornamento punteggio Eventi:", err);
    });
  }

  epilogoHTML += `<div style="text-align:center; margin-top:12px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
    <button type="button" class="events-btn btn-vedi-statistiche" style="max-width:220px;">📊 Vedi Statistiche di Battaglia</button>
    <button type="button" class="events-btn events-btn-main" id="ev-torna-hub-btn" style="max-width:220px;">Torna agli Eventi</button>
  </div>`;

  document.getElementById("battle-report-content").insertAdjacentHTML("beforeend", epilogoHTML);

  document.getElementById("ev-torna-hub-btn").addEventListener("click", () => {
    document.getElementById("battle-result-modal").classList.add("hidden");
    document.getElementById("eventi-modal").classList.remove("hidden");
    renderizzaHubEventi();
  });
}

let eventiUltimoCicloPartecipato = 0;

function calcolaPremioPiazzamentoEventi(posizione, puntiOttenuti) {
  if (posizione === 1) return { dracme: 500, ambra: 3, livelloCartaPacco: 4, testo: "🥇 1° posto!" };
  if (posizione >= 2 && posizione <= 3) return { dracme: 350, ambra: 2, livelloCartaPacco: 3, testo: `🥈 ${posizione}° posto!` };
  if (posizione >= 4 && posizione <= 10) return { dracme: 200, ambra: 1, livelloCartaPacco: 2, testo: `${posizione}° posto` };
  if (posizione >= 11 && posizione <= 25) return { dracme: 100, ambra: 1, livelloCartaPacco: 0, testo: `${posizione}° posto` };
  if (puntiOttenuti > 0) return { dracme: 50, ambra: 0, livelloCartaPacco: 0, testo: "Premio di partecipazione" };
  return null;
}

function controllaFineCicloEventi(callback) {
  const cicloAttuale = calcolaNumeroCicloEventiCorrente();

  if (!eventiUltimoCicloPartecipato || eventiUltimoCicloPartecipato >= cicloAttuale || eventiUltimoCicloPremiato >= eventiUltimoCicloPartecipato || !utenteFirebaseAttuale) {
    callback();
    return;
  }

  dbFirebase.ref(`eventi_classifica/${eventiUltimoCicloPartecipato}`).once("value").then(snapshot => {
    const dati = snapshot.val() || {};
    const elenco = Object.entries(dati).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.punteggio - a.punteggio);
    const mioIndice = elenco.findIndex(e => e.id === utenteFirebaseAttuale.uid);
    eventiUltimoCicloPremiato = eventiUltimoCicloPartecipato;

    if (mioIndice < 0) { salvaProgressoCloud(); callback(); return; }

    const posizione = mioIndice + 1;
    const puntiOttenuti = elenco[mioIndice].punteggio;
    const premio = calcolaPremioPiazzamentoEventi(posizione, puntiOttenuti);

    if (!premio) { salvaProgressoCloud(); callback(); return; }

    dracmeAttuali += premio.dracme;
    ambraAttuale += premio.ambra;
    let cartaVinta = null;
    if (premio.livelloCartaPacco > 0) cartaVinta = estraiCartaPerLivello(premio.livelloCartaPacco);
    if (cartaVinta) deckGiocatore.push(cartaVinta);

    document.getElementById("dracme-count").innerText = dracmeAttuali;
    document.getElementById("ambra-count").innerText = ambraAttuale;
    salvaProgressoCloud();

    document.getElementById("eventi-content").innerHTML = `
      <div style="display:flex; align-items:center; gap:18px; width:100%; height:100%;">
        <div class="tutorial-chirone-box" style="flex:1; max-width:none; margin:0;">
          <div class="tutorial-chirone-testo">
            <p style="font-weight:bold; color:#ffcc66; font-size:1.1rem;">${premio.testo}</p>
            <p style="margin-top:6px;">L'evento precedente si è concluso: hai totalizzato <b>${puntiOttenuti} punti</b>.</p>
            <p style="margin-top:6px; color:#ecc94b; font-weight:bold;">Premio: ${premio.dracme} Dracme${premio.ambra > 0 ? `, ${premio.ambra} Frammenti d'Ambra` : ""}${cartaVinta ? `, e la carta ${cartaVinta.nome}!` : ""}</p>
          </div>
        </div>
        <button type="button" id="ev-continua-dopo-premio-btn" class="events-btn events-btn-main" style="flex:0 0 auto; width:auto; margin-top:0; padding:14px 24px;">Continua</button>
      </div>`;

    document.getElementById("ev-continua-dopo-premio-btn").addEventListener("click", callback);
  }).catch(() => { salvaProgressoCloud(); callback(); });
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
    const opzioniHTML = eleggibili.map(c => {
      const datiCarta = JSON.stringify({ nome: c.nome, immagine: c.immagine, tratti: c.tratti || [], stelle: c.stelle, livello: c.livello, statistiche: c.statistiche }).replace(/"/g, "&quot;");
      return `<option value="${c.id}" data-carta="${datiCarta}">${c.nome} (Lvl ${c.livello})</option>`;
    }).join("");

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

document.getElementById("btn-duelli")?.addEventListener("click", apriAddestramento);

document.getElementById("close-addestramento-modal")?.addEventListener("click", () => {
  document.getElementById("addestramento-modal").classList.add("hidden");
});

document.getElementById("btn-eventi-torneo")?.addEventListener("click", apriEventi);

document.getElementById("close-eventi-modal")?.addEventListener("click", () => {
  document.getElementById("eventi-modal").classList.add("hidden");
});

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

        <button type="button" class="events-btn" id="join-clan-btn-${clan.id}" style="padding: 6px 12px; font-size: 0.75rem; width: auto; margin: 0;">Unisciti</button>

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

      let btnDonaHTML = eIlGiocatore ? "" : `<button type="button" class="events-btn btn-dona-membro" data-nome="${m.nome}" data-uid="${m.uid || ''}" style="width:auto; padding:3px 10px; font-size:0.7rem;">Dona</button>`;

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

      poteriDashHTML += `<button type="button" class="events-btn" id="btn-potere-assedio" style="font-size:0.75rem; padding:8px;">⚔️ Dichiarazione d'Assedio${assedioAttivoOra ? " (Attiva)" : ""}</button>`;

    }

    if (ruolo === "capitano") {

      poteriDashHTML += `<button type="button" class="events-btn" id="btn-potere-staffetta" style="font-size:0.75rem; padding:8px;">🐎 Staffetta Logistica (-1h fatica, 50 Dracme)</button>`;

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

      const battagliaGuerraQui = battaglieInCorsoAttuali[`${esagono.r}_${esagono.c}`];
      if (battagliaGuerraQui) {
        const badgeGuerra = document.createElement("span");
        badgeGuerra.className = "hex-battaglia-in-corso";
        badgeGuerra.title = `${battagliaGuerraQui.nome} sta attaccando`;
        badgeGuerra.innerText = "⚔️";
        hexDiv.appendChild(badgeGuerra);
      }

      

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

  { id: "benvenuto", titolo: "🌟 Benvenuto, Evocatore", html: `<h3>Benvenuto, Evocatore</h3><p>Da qualche parte, in un angolo dimenticato del mondo, un antico patto ti ha scelto. Non sei un semplice collezionista: sei un <strong>Evocatore</strong>, e il tuo compito è radunare le creature nate dai miti e dalle leggende di ogni cultura che l'umanità abbia mai raccontato — spiriti silenziosi, bestie feroci, guardiani immortali, fino ai draghi che hanno plasmato il destino dei popoli.</p><p>Ogni carta che possiedi non è solo un numero su uno schermo: ha una storia, un carattere, un terreno in cui si sente a casa e uno in cui invece arranca. Impara a conoscerle. Guarda le loro statistiche, scopri i loro tratti speciali, capisci quando un'Arpìa vola meglio di quanto un Kraken possa nuotare — e quando invece è vero il contrario.</p><p>Il tuo cammino da Evocatore non ha una fine scritta: ogni settimana nuove creature possono unirsi al bestiario, nuove sfide attendono nei mondi, nuove alleanze si stringono nei clan. Ma un solo traguardo resta sempre lì, all'orizzonte, a guidarti: <strong>la collezione completa.</strong></p><h3>Tante strade, una sola meta</h3><p>Aprendo il gioco per la prima volta troverai diversi luoghi da esplorare — Mondi, Clan, Addestramento, Eventi, le Dodici Fatiche. Non farti scoraggiare da quanti sono: sono tutti la stessa cosa, vista da porte diverse. Ognuno di loro ti fa combattere, ogni combattimento ti fa guadagnare Dracme e Frammenti d'Ambra, e Dracme e Frammenti si trasformano in nuovi pacchetti al Mercato — nuove creature, o le stelle in più per far evolvere quelle che già hai. È un unico cerchio che gira: <strong>gioca, guadagna, colleziona, evolvi, ricomincia</strong> — scegli tu con quale porta entrarci ogni volta.</p><p>Ogni carta mancante è una storia che non conosci ancora. Vai a scoprirla.</p>` },

  { id: "creature", titolo: "🃏 Le Creature", html: `<h3>Il Bestiario</h3><p>Il bestiario di Mythophedia nasce dalle mitologie e dal folklore reale di tutto il mondo — greco, norreno, giapponese, azteco, celtico, slavo, mesopotamico e molti altri ancora. Ogni creatura è organizzata in <strong>6 Livelli di rarità</strong>, una piramide che sale dalla tradizione popolare fino al mito supremo:</p><ul><li><strong>Comuni</strong> — piccoli spiriti, folletti, creature della tradizione popolare. L'inizio di ogni collezione.</li><li><strong>Non Comuni</strong> — bestie feroci e mostri da caccia, i primi veri banchi di prova.</li><li><strong>Rare</strong> — mostri iconici, guardiani di templi che pochi Evocatori riescono a domare.</li><li><strong>Epiche</strong> — grandi forze della natura, creature quasi immortali.</li><li><strong>Mitiche</strong> — flagelli divini, custodi supremi degli esagoni di mappa.</li><li><strong>Leggendarie</strong> — l'apice assoluto: i Draghi Millenari, l'ultimo passo di ogni collezione.</li></ul><p>Ogni creatura possiede quattro caratteristiche — <strong>Ferocia</strong>, <strong>Balzo</strong>, <strong>Corazza</strong>, <strong>Istinto</strong> — distribuite in modo unico, mai uguale da una carta all'altra. Alcune nascondono anche un dono in più: il <strong>Volo</strong>, il <strong>Nuoto</strong>, l'<strong>Arrampicata</strong> o l'<strong>Equilibrio</strong>, capacità che possono ribaltare uno scontro se schierate sul terreno giusto.</p><p><em>Consiglio da Evocatore: prima di lanciarti in battaglia, apri la scheda di ogni carta. Conoscerne i punti di forza — e le debolezze — è la prima vera strategia del gioco.</em></p>` },

  { id: "evoluzione", titolo: "⭐ Evoluzione a Stelle", html: `<h3>Come far evolvere una carta</h3><p>Le tue creature non restano ferme: possono <strong>evolvere</strong>, guadagnando stelle che ne accrescono il potere.</p><p>Per dare una stella a una creatura, dovrai sacrificarne altre quattro — dello stesso livello immediatamente inferiore, e con esattamente una stella in meno di quella che vuoi far crescere. Un rito antico, ma efficace: ogni sacrificio è un passo verso una creatura più forte.</p><p>Non tutti i sacrifici devono pesare sulla tua collezione più preziosa: le carte <strong>Jolly</strong>, che troverai nei pacchetti del mercato, sono nate apposta per essere offerte al rito, senza doverti privare delle creature a cui tieni davvero.</p>` },

  { id: "combattimento", titolo: "⚔️ Combattimento", html: `<h3>Come funziona uno scontro</h3><p>Quando scendi in campo, scegli <strong>5 creature</strong> dal tuo mazzo e decidi con cura l'ordine in cui le schiererai. Lo scontro si gioca su 5 round: la tua prima creatura contro la loro prima, la seconda contro la seconda, e così via — ogni round deciso da <strong>una sola caratteristica</strong>, al singolo decimale. Vince chi prevale in almeno 3 round su 5.</p><h3>Terreno Congeniale</h3><p>Ma il campo di battaglia non è mai neutro: ogni scontro avviene su un terreno — Aria, Terra, Foresta o Acqua — e il terreno può essere alleato o nemico.</p><ul><li><strong>Volo</strong> → a suo agio in Aria, in difficoltà in Acqua</li><li><strong>Nuoto</strong> → a suo agio in Acqua, in difficoltà in Aria</li><li><strong>Arrampicata / Equilibrio</strong> → a loro agio tra Foresta e Terra, in difficoltà tra Acqua e Aria</li></ul><p><em>Consiglio da Evocatore: uno schieramento vincente non è solo quello con le statistiche più alte — è quello pensato per il terreno che ti aspetta.</em></p>` },

  { id: "addestramento", titolo: "🏛️ Addestramento e Sotterranei", html: `<h3>L'Addestramento</h3><p>Se il combattimento ti sembra ancora un mistero, il Colosseo è dove Chirone in persona ti aspetta. Un percorso guidato in 8 tappe, sempre disponibile e rigiocabile quante volte vuoi, ti fa provare sulla tua pelle — senza alcun rischio — come funzionano le statistiche, come si vince una battaglia a più round, e soprattutto come il terreno può ribaltare uno scontro che sembrava già deciso. Ogni tappa ti mette alla prova un po' di più della precedente; completarle tutte ti prepara davvero per i Mondi e le Guerre.</p><h3>I Sotterranei</h3><p>Finito l'Addestramento, si apre un cammino ben più lungo: i <strong>Sotterranei</strong>, un viaggio contro bot sempre più forti che non ha una vera fine. Ogni livello superato — vincendo almeno 3 round su 5 — ti fa scendere un gradino più a fondo, con nemici via via più temibili, e ti frutta Dracme una tantum al primo superamento. Se perdi, ripeti semplicemente lo stesso livello: nessuna penalità, solo un altro tentativo. Un posto perfetto per chi vuole giocare con calma, mettersi alla prova, o allenare un mazzo nuovo senza dover affrontare altri Evocatori.</p><p><em>Consiglio da Evocatore: se un Mondo o un Evento ti sembrano troppo impegnativi, i Sotterranei sono sempre lì ad aspettarti — a un ritmo tutto tuo.</em></p>` },

  { id: "fatica", titolo: "💪 Fatica e Vigore", html: `<h3>Vigore</h3><p>Ogni creatura che scende in battaglia si stanca: il suo <strong>Vigore</strong> scende del 10% a ogni scontro, e a Vigore 0% ha bisogno di riposo prima di tornare in campo.</p><h3>Recupero</h3><p>Il recupero però non si ferma mai, nemmeno a gioco chiuso: <strong>+10% ogni 30 minuti</strong>, in modo continuo. Se hai davvero bisogno di lei prima che sia tornata al massimo, puoi comunque schierarla a ricarica parziale — sta a te decidere se rischiare.</p>` },

  { id: "mondi", titolo: "🗺️ Mondi e Sottomondi", html: `<h3>I Mondi</h3><p>Il vero banco di prova di ogni Evocatore sono i <strong>Mondi</strong>: mappe vastissime fatte di esagoni, dove conquisti territorio sfidando avversari che non serve nemmeno trovare online — li affronti attraverso le difese che hanno lasciato.</p><p>Ogni Mondo ha una soglia d'ingresso pensata per il tuo livello di esperienza, dal principiante che muove i primi passi fino al veterano che accetta ogni carta in gioco.</p><h3>I Sottomondi</h3><p>Ogni Mondo si divide ulteriormente in Sottomondi, ciascuno con la propria variante di regole:</p><ul><li><strong>Normale:</strong> una statistica variabile a settimana</li><li><strong>Bifase:</strong> media di 2 statistiche</li><li><strong>Trifase:</strong> media di 3 statistiche</li><li><strong>Nebbia di Guerra:</strong> non vedi le carte avversarie</li></ul><p>Ogni settimana la mappa si rinnova, e chi ha conquistato di più viene ricompensato di conseguenza. Nessuna conquista è mai per sempre — ma nessuna vittoria è mai sprecata.</p>` },

  { id: "eventi", titolo: "🏆 Eventi", html: `<h3>Una classifica, due giorni</h3><p>Se cerchi una sfida più diretta contro altri Evocatori veri, gli Eventi sono la tua arena. Ogni due giorni parte un nuovo ciclo, con una <strong>restrizione</strong> che decide quali carte puoi schierare (a volte solo Comuni, a volte con una statistica minima richiesta) — pensata apposta per non escludere mai chi ha appena iniziato. La restrizione, insieme al terreno di quel ciclo, la conosci subito, prima ancora di scegliere la tua squadra di 5.</p><h3>Come si sfida</h3><p>La prima sfida di ogni ciclo è casuale; dopo, potrai sfidare solo i 5 Evocatori subito sopra e i 5 subito sotto di te in classifica — più sali, più cambiano gli avversari a portata di mano. Prima di ogni scontro vedi in anteprima la squadra avversaria e puoi riordinare la tua, per sfruttare al meglio modalità e terreno di quella specifica sfida. Hai 5 sfide disponibili, che si ricaricano una ogni ora.</p><h3>Punteggio e premi</h3><p>Ogni round vinto in uno scontro vale 1 punto, fino a un massimo di 5 a sfida. Alla fine del ciclo, il piazzamento in classifica decide il premio — Dracme, Frammenti d'Ambra, e per i migliori anche pacchetti di carte — assegnato non appena il ciclo successivo comincia.</p><p><em>Consiglio da Evocatore: dato che restrizione e terreno sono fissi per tutto il ciclo, prenditi un momento a scegliere la squadra con criterio prima di lanciarti — è una decisione che vale due giorni interi.</em></p>` },

  { id: "mercato", titolo: "🛒 Mercato", html: `<h3>Pacchetti di carte</h3><p>Le Dracme guadagnate in battaglia e i rari Frammenti d'Ambra trovati lungo il cammino sono la chiave per aprire nuovi pacchetti al Mercato. Ogni pacchetto è una porta verso creature che ancora non conosci — alcune comuni, altre che si lasciano scoprire solo da chi ha pazienza e fortuna in egual misura.</p><h3>Risorse</h3><ul><li><strong>Dracme:</strong> valuta comune, si ottiene giocando</li><li><strong>Frammenti d'Ambra:</strong> valuta rara, per pacchetti di livello superiore</li></ul>` },

  { id: "clan", titolo: "🛡️ Clan e Ruoli", html: `<h3>La fratellanza</h3><p>Nessun Evocatore leggendario ha mai camminato del tutto da solo. Unisciti a un Clan — o fondane uno tuo — e scopri il valore della fratellanza: scambio di carte quotidiano, strategie condivise, e ruoli che danno a ciascun membro un potere unico da esercitare quando la guerra chiama.</p><p>Un clan ha fino a 20 membri: 1 Comandante, fino a 3 Capitani, fino a 5 Sergenti, il resto Soldati. Solo il Comandante può promuovere o degradare i membri.</p><h3>Donazioni</h3><p>Puoi donare 1 carta di Livello 1 o 2 al giorno a un compagno di clan, spendendo 1 Frammento d'Ambra.</p><h3>Poteri di Ruolo</h3><ul><li><strong>Comandante:</strong> Amnistia di Guerra (ritira le difese di un tuo esagono, 1 volta a settimana) e Dichiarazione d'Assedio (dimezza la fatica in guerra per 24h)</li><li><strong>Capitano:</strong> Occhio dell'Oracolo (rivela le difese nemiche per 6h, 1 volta al giorno) e Staffetta Logistica (-1h di fatica a una tua carta, costa Dracme)</li><li><strong>Sergente:</strong> Marchio del Predatore (bonus al 1° round contro un esagono marcato) e Supervisore del Mercato (donazioni gratuite, senza Ambra)</li></ul>` },

  { id: "guerra", titolo: "⚔️ Guerra tra Clan", html: `<h3>L'assedio</h3><p>Quando i Clan si scontrano, la posta si alza. Torri Minori e una Cittadella centrale attendono al centro della mappa, difese da guarnigioni che possono ospitare fino a diversi mazzi schierati in fila — un assedio vero, non un semplice scontro.</p><p>Un settore normale genera 1 Punto Dominio l'ora, un Avamposto 10, la Cittadella centrale 30.</p><h3>La vittoria</h3><p>Il dominio si misura ora dopo ora, esagono dopo esagono. Alla fine della settimana, solo il Clan che ha saputo resistere più a lungo — e colpire più a fondo — porterà a casa la gloria e le ricompense che ne derivano.</p>` }

];

function apriGuida(capitoloId) {

  const toc = document.getElementById("guide-toc");

  toc.innerHTML = CAPITOLI_GUIDA.map(cap => `<button type="button" class="events-btn guide-toc-btn" data-id="${cap.id}" style="width:100%; text-align:left; font-size:0.75rem; padding:8px; ${cap.id === capitoloId ? 'background:rgba(255,204,102,0.25);' : ''}">${cap.titolo}</button>`).join("");

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

    listaDifensoriHTML = "<p style='color:#7ee787;'>Settore indifeso! Pronto per essere conquistato.</p>";

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

      poteriHTML += `<button type="button" class="events-btn" id="btn-potere-oracolo" style="width:auto; font-size:0.75rem; padding:6px 10px; margin-right:6px;" ${capitanoOracoliUsatiOggi >= 1 ? "disabled" : ""}>👁️ Occhio dell'Oracolo</button>`;

    }

    if (ruoloGiocatore === "sergente" && !predatoreAttivo) {

      poteriHTML += `<button type="button" class="events-btn" id="btn-potere-marchio" style="width:auto; font-size:0.75rem; padding:6px 10px;">🎯 Marchio del Predatore</button>`;

    }

  } else if (ruoloGiocatore === "comandante") {

    poteriHTML += `<button type="button" class="events-btn" id="btn-potere-amnistia" style="width:auto; font-size:0.75rem; padding:6px 10px;" ${amnistiaUsataQuestaSettimana ? "disabled" : ""}>🕊️ Amnistia di Guerra</button>`;

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

      option.dataset.carta = JSON.stringify({ nome: carta.nome, immagine: carta.immagine, tratti: carta.tratti || [], stelle: carta.stelle, livello: carta.livello, vigore, statistiche: carta.statistiche });

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

  // Il solo reset della variabile locale non basta: se i vecchi dati restano su Firebase,
  // al prossimo caricamento la mappa verrebbe ripescata identica a prima, vanificando il
  // reset settimanale (esattamente il bug segnalato: guerra "già iniziata" con territori
  // già conquistati). Cancelliamo quindi anche il nodo remoto.
  if (clanMioAttuale && clanMioAttuale.reale && clanMioAttuale.firebaseId) {
    dbFirebase.ref("guerre_reali/" + clanMioAttuale.firebaseId).remove()
      .catch((err) => console.error("Errore azzeramento mappa guerra:", err));
  }

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

      if (clanMioAttuale.reale) avviaAscoltoBattaglieInCorso(`guerra_${clanMioAttuale.firebaseId}`);

    });

  });

});

document.getElementById("close-clan-war-modal")?.addEventListener("click", () => {

  document.getElementById("clan-war-modal").classList.add("hidden");

  fermaAscoltoBattaglieInCorso();

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

  nuovoRegistroBattaglia();

  segnalaInizioBattaglia(`guerra_${clanMioAttuale.firebaseId}`, esagonoGuerraSelezionatoDati.r, esagonoGuerraSelezionatoDati.c);

  document.getElementById("battle-title-outcome").innerText = "ASSALTO AL SETTORE...";

  document.getElementById("battle-report-content").innerHTML = "";

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

    const esitoRound = (mioValFinale > nemicoValFinale);

    if (esitoRound) roundVintiGuerra++;

    const spiegaMioGuerra = spiegaModificatoreTerreno(miaCarta.tratti || [], esagonoGuerraSelezionatoDati.terrain);
    const spiegaNemicoGuerra = spiegaModificatoreTerreno(mostroNemico.tratti || [], esagonoGuerraSelezionatoDati.terrain);
    registraRoundBattaglia({
      numeroRound: warRoundIdx + 1,
      mioNome: miaCarta.nome,
      nemicoNome: mostroNemico.nome,
      statistiche: statsRound,
      mioBase: mioValBase, mioModificatore: mioMod, mioSpiegazioneModificatore: spiegaMioGuerra.spiegazione, mioFinale: mioValFinale,
      nemicoBase: nemicoValBase, nemicoModificatore: nemicoMod, nemicoSpiegazioneModificatore: spiegaNemicoGuerra.spiegazione, nemicoFinale: nemicoValFinale,
      bonusExtra: bonusPredatore, bonusExtraNome: bonusPredatore > 0 ? "Marchio del Predatore" : null,
      vinto: esitoRound
    });

    let roundCardId = `clash-war-row-${warRoundIdx}`;

    let rLineHTML = `

      <div class="battle-arena-row" id="${roundCardId}">
        <div class="effetto-impatto">${svgEsplosioneImpatto()}</div>

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

      document.getElementById(roundCardId)?.classList.add("impatto-flash");
      document.getElementById(roundCardId)?.querySelector(".effetto-impatto")?.classList.add("attivo");

      setTimeout(() => {

        if (esitoRound) {

          document.getElementById(`nem-war-card-${warRoundIdx}`).classList.add("card-sconfitta");

          document.getElementById(`vs-text-war-${warRoundIdx}`).innerHTML = "VINCI";

          document.getElementById(`vs-text-war-${warRoundIdx}`).style.color = "#7ee787";

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

  segnalaFineBattaglia(`guerra_${clanMioAttuale.firebaseId}`, esagonoGuerraSelezionatoDati.r, esagonoGuerraSelezionatoDati.c);

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

      epilogoHTML += `<p style="text-align:center; color:#7ee787; font-weight:bold;">Hai eliminato l'ultimo mazzo difensivo e conquistato il settore!</p>`;

    } else {

      document.getElementById("battle-title-outcome").innerText = "Mazzo Difensivo Sconfitto!";

      epilogoHTML += `<p style="text-align:center; color:#7ee787; font-weight:bold;">Hai sconfitto un mazzo difensivo (${roundVintiGuerra}/5 round vinti)! Restano ancora <strong>${mazziRimasti}</strong> mazzi a difesa del settore — attacca di nuovo per proseguire l'assedio.</p>`;

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

  epilogoHTML += `<div style="text-align:center; margin-top:12px;"><button type="button" class="events-btn btn-vedi-statistiche" style="max-width:260px; margin:0 auto;">📊 Vedi Statistiche di Battaglia</button></div>`;

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
    addestramentoPremioRitirato: addestramentoPremioRitirato,
    addestramentoApertoAlmenoUnaVolta: addestramentoApertoAlmenoUnaVolta,
    addestramentoDaEvidenziare: addestramentoDaEvidenziare,
    sotterraneiLivelloAttuale: sotterraneiLivelloAttuale,
    sotterraneiLivelloMassimoConPremio: sotterraneiLivelloMassimoConPremio,
    sotterraneiVittorieOggi: sotterraneiVittorieOggi,
    sotterraneiDataVittorie: sotterraneiDataVittorie,
    eventiSfideRimaste: eventiSfideRimaste,
    eventiTimestampUltimaSfida: eventiTimestampUltimaSfida,
    eventiUltimoCicloPremiato: eventiUltimoCicloPremiato,
    eventiUltimoCicloPartecipato: eventiUltimoCicloPartecipato,
    eventiPartiteGiocateQuestoCiclo: eventiPartiteGiocateQuestoCiclo,
    ultimoSalvataggio: Date.now()
  };
}

function salvaProgressoCloud() {
  if (!utenteFirebaseAttuale) return;
  if (!salvataggioCloudCaricato) {
    console.warn("Salvataggio bloccato: i dati reali non sono ancora stati caricati dal cloud. Evitato un possibile sovrascrivimento.");
    return;
  }
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
    <button type="button" class="events-btn guide-toc-btn classifica-toc-btn" data-categoria="${cat.id}" style="width:100%; text-align:left; font-size:0.75rem; padding:8px; ${cat.id === categoriaClassificaCorrente ? 'background:rgba(255,204,102,0.25);' : ''}">${cat.nome}</button>
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
  if (typeof dati.addestramentoPremioRitirato === "boolean") {
    addestramentoPremioRitirato = dati.addestramentoPremioRitirato;
  }
  if (typeof dati.addestramentoApertoAlmenoUnaVolta === "boolean") {
    addestramentoApertoAlmenoUnaVolta = dati.addestramentoApertoAlmenoUnaVolta;
  }
  if (typeof dati.addestramentoDaEvidenziare === "boolean") {
    addestramentoDaEvidenziare = dati.addestramentoDaEvidenziare;
    aggiornaEvidenziazioneAddestramento();
  }
  if (typeof dati.sotterraneiLivelloAttuale === "number") {
    sotterraneiLivelloAttuale = dati.sotterraneiLivelloAttuale;
  }
  if (typeof dati.sotterraneiLivelloMassimoConPremio === "number") {
    sotterraneiLivelloMassimoConPremio = dati.sotterraneiLivelloMassimoConPremio;
  }
  if (typeof dati.sotterraneiVittorieOggi === "number") {
    sotterraneiVittorieOggi = dati.sotterraneiVittorieOggi;
  }
  if (typeof dati.sotterraneiDataVittorie === "string") {
    sotterraneiDataVittorie = dati.sotterraneiDataVittorie;
  }
  if (typeof dati.eventiSfideRimaste === "number") {
    eventiSfideRimaste = dati.eventiSfideRimaste;
  }
  if (typeof dati.eventiTimestampUltimaSfida === "number" || dati.eventiTimestampUltimaSfida === null) {
    eventiTimestampUltimaSfida = dati.eventiTimestampUltimaSfida;
  }
  if (typeof dati.eventiUltimoCicloPremiato === "number") {
    eventiUltimoCicloPremiato = dati.eventiUltimoCicloPremiato;
  }
  if (typeof dati.eventiUltimoCicloPartecipato === "number") {
    eventiUltimoCicloPartecipato = dati.eventiUltimoCicloPartecipato;
  }
  if (typeof dati.eventiPartiteGiocateQuestoCiclo === "number") {
    eventiPartiteGiocateQuestoCiclo = dati.eventiPartiteGiocateQuestoCiclo;
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
    setTimeout(avviaTutorialDopoIntro, 600);
  }
}

// Aspetta che il video introduttivo sia finito prima di aprire il tutorial di Chirone — altrimenti
// il tutorial si apre sopra il video e lo interrompe, impedendo di goderselo.
function avviaTutorialDopoIntro() {
  if (window.introVideoAttivo) {
    setTimeout(avviaTutorialDopoIntro, 400);
    return;
  }
  apriTutorialChirone();
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
      setTimeout(avviaTutorialDopoIntro, 600);
    }
    nascondiLoadingOverlay();
    return;
  }

  dbFirebase.ref("giocatori/" + user.uid).once("value").then((snapshot) => {
    if (snapshot.exists()) {
      applicaDatiCaricati(snapshot.val());
      aggiornaClassificaCloud();
      salvataggioCloudCaricato = true;
    } else {
      salvataggioCloudCaricato = true;
      salvaProgressoCloud();
    }
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

  window.introVideoAttivo = true;
  document.body.classList.add("intro-playing");

  const chiudiIntro = () => {
    window.introVideoAttivo = false;
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
    musica.play().then(() => {
      document.removeEventListener("click", avviaMusica);
      document.removeEventListener("touchstart", avviaMusica);
    }).catch(() => {}); // se il browser blocca ancora, gli ascoltatori restano attivi e riproveremo al prossimo tocco
  }

  document.addEventListener("click", avviaMusica);
  document.addEventListener("touchstart", avviaMusica);
})();

// CHIUSURA DEFINITIVA DI TUTTO LO SCRIPT

});