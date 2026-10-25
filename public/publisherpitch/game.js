(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const R = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  const chance = (p) => Math.random() < p;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const shuffle = (a) => {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };

  const MILESTONE_KM = 500;
  const FIRST_STORM_KM = 700;
  const BEST_KEY = "frostline-best-km";
  const bestKm = () => +(localStorage.getItem(BEST_KEY) || 0);
  const MAX_WAGONS = 8;

  const PHASES = [
    ["morning", "Sabah"],
    ["route", "Rota"],
    ["travel", "Seyahat"],
    ["stop", "Durak"],
    ["evening", "Akşam"],
    ["night", "Gece"],
  ];

  // ————————————————————————————————— Tanımlar

  const WAGONS = {
    housing: { name: "Yaşam vagonu", short: "YAŞAM", cost: { hurda: 30 }, desc: "10 kişilik yatak. Sıcaklığı hastalığı belirler." },
    greenhouse: { name: "Sera vagonu", short: "SERA", cost: { hurda: 35 }, desc: "4 işçi kapasitesi. Soğukta verim düşer." },
    workshop: { name: "Atölye vagonu", short: "ATÖLYE", cost: { hurda: 30 }, desc: "4 işçi. Ar-Ge üretimi ×2." },
    infirmary: { name: "Revir vagonu", short: "REVİR", cost: { hurda: 30, ilac: 2 }, desc: "3 işçi. Tam hızda tedavi." },
    tender: { name: "Kömür tenderi", short: "TENDER", cost: { hurda: 20 }, desc: "Kömür kapasitesi +60." },
  };

  const JOBS = {
    kazan: { name: "Kazan", desc: "Her kazan seviyesi 2 ateşçi ister." },
    sera: { name: "Sera", desc: "İşçi başı 2.5 yemek (ısıya bağlı)." },
    atolye: { name: "Atölye", desc: "Ar-Ge üretir (araştırma için)." },
    revir: { name: "Revir", desc: "Hastaları iyileştirir." },
  };

  const TECH = {
    insulation: { name: "Vagon yalıtımı", cost: { arge: 10, hurda: 15 }, desc: "Tüm vagonlar +1 ısı." },
    pipes: { name: "Buhar boruları", cost: { arge: 8, hurda: 10 }, desc: "Isı her 3 vagonda bir düşer (2 yerine)." },
    boiler: { name: "Verimli kazan", cost: { arge: 12, hurda: 10 }, desc: "Isınma kömürü −%20." },
    lamps: { name: "Sera lambaları", cost: { arge: 8, hurda: 8 }, desc: "Sera verimi +%40." },
    plow: { name: "Kar sabanı", cost: { arge: 6, hurda: 12 }, desc: "Seyahat kömürü −%15, kar yığınları kolaylaşır." },
    scoutgear: { name: "Keşif kıyafetleri", cost: { arge: 8, hurda: 10 }, desc: "Keşif riski −%40." },
    core_boiler: { name: "Çekirdekli kazan", cost: { arge: 10, core: 1 }, desc: "Kazan 4. seviyeye çıkabilir." },
  };

  const LAWS = {
    childlabor: { tree: "Uyum", name: "Çocuk İşçiliği", group: "children", desc: "Çocuklar görevlere atanabilir.", once: { hope: -8, disc: 4 } },
    childshelter: { tree: "Uyum", name: "Çocuk Barınağı", group: "children", desc: "Çocuklar soğuktan korunur; her gece umut +1.", once: { hope: 4 } },
    extshift: { tree: "Uyum", name: "Uzatılmış Mesai", desc: "Uzatılmış mesai açılır: üretim ×1.4, +6 hoşnutsuzluk, kaza riski." },
    emershift: { tree: "Uyum", name: "Acil Mesai", req: "extshift", desc: "Acil mesai açılır: üretim ×2, +14 hoşnutsuzluk, %30 ölüm riski." },
    soup: { tree: "Uyum", name: "Çorba", group: "food", desc: "Yemek tüketimi −%25. Her gece hoşnutsuzluk +1." },
    sawdust: { tree: "Uyum", name: "Talaş Katkısı", group: "food", desc: "Yemek tüketimi −%20. Soğuktan hastalanma riski +%30." },
    radical: { tree: "Uyum", name: "Radikal Tedavi", desc: "Tedavisiz hasta ölüm riski %12 → %5; bazıları sakat kalır.", once: { hope: -4 } },
    overcrowd: { tree: "Uyum", name: "Revir Taşması", desc: "Tedavi kapasitesi +%50.", once: { hope: -2 } },
    funeral: { tree: "Uyum", name: "Ray Kenarı Törenleri", group: "dead", desc: "Ölüm başına umut kaybı yarıya iner; ölü başına 1 yemek.", once: { hope: 3 } },
    snowgrave: { tree: "Uyum", name: "Kar Mezarı", group: "dead", desc: "Ölülerin eşyası paylaşılır: ölü başına +2 yemek +1 hurda, umut −2 ek.", once: { disc: 2 } },
    order1: { tree: "Düzen", name: "Bekçi Devriyesi", group: "path", path: true, desc: "Her gece hoşnutsuzluk −3.", once: { hope: -2 } },
    order2: { tree: "Düzen", name: "Propaganda Hoparlörü", req: "order1", desc: "Her gece umut +2." },
    order3: { tree: "Düzen", name: "Yeni Düzen", req: "order2", desc: "Hoşnutsuzluk 95'i aşamaz. Çizgiyi aşarsın.", once: { hope: -10 } },
    faith1: { tree: "İnanç", name: "Akşam Duaları", group: "path", path: true, desc: "Her gece umut +2." },
    faith2: { tree: "İnanç", name: "İnanç Bekçileri", req: "faith1", desc: "Her gece hoşnutsuzluk −3." },
    faith3: { tree: "İnanç", name: "Yeni İnanç", req: "faith2", desc: "Umut 5'in altına düşmez. Çizgiyi aşarsın.", once: { disc: 8 } },
  };

  const RECRUITS = {
    yusuf: {
      name: "Yusuf", role: "Mühendis", job: "atolye",
      perk: "Atölyedeyken gece +3 Ar-Ge; vagonlar %25 daha az hurdaya mal olur.",
      intro: "Rayların yanında paslı bir alet çantasına sarılmış yaşlı bir adam. 'Bu lokomotifin borularını ben döşedim,' diyor.",
    },
    nermin: {
      name: "Nermin", role: "Öğretmen", job: "halk",
      perk: "Halkla ilgilenirken her gece umut +2, hoşnutsuzluk −1.",
      intro: "Yanında üç çocukla yürüyen bir kadın. Çocuklar donmuş ama hâlâ şarkı söylüyor.",
    },
    baran: {
      name: "Baran", role: "Avcı", job: "kesif",
      perk: "Keşifteyken yemek ganimeti ×1.6; geyik sürüsünde daha çok et.",
      intro: "Omzunda tüfek, belinde iki tavşan. Kar gözlüğünü çıkarıp trene bakıyor.",
    },
    emine: {
      name: "Emine", role: "Hemşire", job: "revir",
      perk: "Revirdeyken +2 iyileşme; tedavisiz hastaların ölüm riski yarıya iner.",
      intro: "Kızıl haç bantlı, yırtık bir palto. Elindeki çanta ilaç kokuyor.",
    },
  };

  const LOCS = {
    town: { name: "Terk edilmiş kasaba", km: [120, 160], danger: 0.1, cold: 0, loot: { hurda: [10, 20], food: [6, 14], ilac: [0, 2] }, special: { refugees: 0.25, core: 0.05 }, desc: "Yıkık evler, buz tutmuş vitrinler. Bodrumlarda hâlâ bir şeyler olabilir.", hint: "hurda, yemek" },
    mine: { name: "Kömür madeni", km: [140, 180], danger: 0.14, cold: -3, loot: { coal: [25, 45], hurda: [4, 10] }, special: { collapse: 0.15 }, desc: "Ağzı karla örtülü bir ocak. Galeriler çatırdıyor.", hint: "bol kömür" },
    convoy: { name: "Donmuş konvoy", km: [100, 140], danger: 0.06, cold: 0, loot: { food: [8, 16], coal: [6, 14], hurda: [6, 12] }, special: { refugees: 0.15 }, desc: "Rayların yanında yan yatmış kamyonlar. Kabinlerde donmuş sürücüler.", hint: "karışık" },
    depot: { name: "Askeri depo", km: [160, 210], danger: 0.22, cold: -5, loot: { hurda: [15, 28], ilac: [2, 5], coal: [5, 12] }, special: { core: 0.35, raid: 0.3 }, desc: "Dikenli tel, devrik nöbet kulübeleri. Birileri buraya senden önce gelmiş olabilir.", hint: "ilaç, hurda, çekirdek" },
    farm: { name: "Eski sera istasyonu", km: [130, 170], danger: 0.08, cold: -2, loot: { food: [16, 28] }, special: { seeds: 0.3 }, desc: "Kırık cam kubbeler altında donmuş sebze tarhları.", hint: "bol yemek" },
    plain: { name: "Açık buz düzlüğü", km: [200, 250], danger: 0, cold: -8, nostop: true, desc: "Durak yok. Hızlı ama rüzgâr kemiklere işler.", hint: "durak yok, hızlı" },
  };

  const BASE_TEMP = [-20, -22, -26, -30, -32, -36, -40, -44, -48, -52, -55, -58, -60];

  const RES_LABEL = {
    hope: "Umut", disc: "Hoşnutsuzluk", coal: "Kömür", food: "Yemek", hurda: "Hurda", ilac: "İlaç",
    core: "Buhar çekirdeği", arge: "Ar-Ge", workers: "İşçi", children: "Çocuk", sick: "Hasta", stress: "Kazan stresi",
  };
  const BAD_UP = new Set(["disc", "sick", "stress"]);

  // ————————————————————————————————— Durum

  let s;

  function newState() {
    return {
      day: 1, phase: "morning", km: 0, temp: -20,
      coal: 70, food: 60, hurda: 40, ilac: 4, core: 0, arge: 0,
      workers: 10, children: 4, sick: 0, disabled: 0, dead: 0, deathsToday: 0,
      hope: 60, disc: 15,
      boiler: 2, overdrive: false, stress: 0, boilerOut: false,
      wagons: ["housing", "greenhouse"],
      jobs: { kazan: 4, sera: 4, atolye: 1, revir: 1 },
      plan: { kazan: 4, sera: 4, atolye: 1, revir: 1 },
      chars: [
        { id: "selim", name: "Selim", role: "Makinist", job: "kazan", status: "ok", injured: 0, perk: "Kazandayken kömür −%25, 2 ateşçi sayılır, stres yavaş artar." },
        { id: "leyla", name: "Dr. Leyla", role: "Doktor", job: "revir", status: "ok", injured: 0, perk: "Revirdeyken günde +3 hasta iyileştirir." },
        { id: "ayse", name: "Ayşe", role: "Çiftçi", job: "sera", status: "ok", injured: 0, perk: "Seradayken +6 yemek, soğuk cezası yarıya iner." },
        { id: "kerem", name: "Kerem", role: "Lootçu", job: "kesif", status: "ok", injured: 0, perk: "Keşifte liderlik: ganimet ×1.4, risk ×0.6." },
      ],
      recruitPool: shuffle(Object.keys(RECRUITS)),
      laws: {}, lawReadyDay: 1,
      tech: {},
      shift: "normal",
      promises: [], ultimatum: null, ultimatumUsed: false,
      storm: 0, storms: 0, nextStorm: FIRST_STORM_KM,
      route: null, routeOptions: null,
      builtToday: false, researchedToday: false,
      seedBonus: 0,
      seen: {},
      log: [],
      hist: [],
      endKind: null,
      over: false,
      stats: { abandoned: 0, detached: 0, refugees: 0, explored: 0, emer: 0, betrayed: 0 },
    };
  }

  // ————————————————————————————————— Yardımcılar

  const aliveChars = () => s.chars.filter((c) => c.status !== "dead");
  const charById = (id) => s.chars.find((c) => c.id === id);
  const charOk = (id, job) => {
    const c = charById(id);
    return !!c && c.status === "ok" && (!job || c.job === job);
  };
  const pop = () => s.workers + s.sick + s.children + s.disabled + aliveChars().length;
  const count = (type) => s.wagons.filter((w) => w === type).length;
  const labor = () => s.workers + (s.laws.childlabor ? s.children : 0);
  const assigned = () => Object.values(s.jobs).reduce((a, b) => a + b, 0);
  const coalCap = () => 120 + 60 * count("tender");
  const maxBoiler = () => (s.tech.core_boiler ? 4 : 3);

  function capOf(job) {
    if (job === "kazan") return 8;
    if (job === "sera") return 4 * count("greenhouse");
    if (job === "atolye") return count("workshop") ? 4 * count("workshop") : 2;
    if (job === "revir") return count("infirmary") ? 3 * count("infirmary") : 1;
    return 0;
  }

  // s.plan oyuncunun istediği dağılım; s.jobs eldeki işçiyle karşılanabilen kısmı.
  // Hastalanan işçi görevden düşer, iyileşince aynı göreve kendiliğinden döner.
  function rebalance() {
    let left = labor();
    for (const j of ["kazan", "sera", "revir", "atolye"]) {
      s.plan[j] = clamp(s.plan[j], 0, capOf(j));
      s.jobs[j] = Math.min(s.plan[j], left);
      left -= s.jobs[j];
    }
  }

  const crew = () => s.jobs.kazan + (charOk("selim", "kazan") ? 2 : 0);
  function effLevel() {
    if (s.boilerOut) return 0;
    return Math.min(s.boiler, Math.floor(crew() / 2));
  }
  function tempPenalty(t) {
    if (t > -25) return 0;
    if (t > -35) return -1;
    if (t > -50) return -2;
    if (t > -65) return -3;
    return -4;
  }
  function heatAt(i) {
    const lvl = effLevel();
    let h = lvl + (s.overdrive && lvl > 0 ? 1 : 0) + tempPenalty(s.temp) + (s.tech.insulation ? 1 : 0) - Math.floor(i / (s.tech.pipes ? 3 : 2));
    if (lvl === 0) h = Math.min(h, tempPenalty(s.temp) - 1);
    return clamp(h, -3, 5);
  }
  const heatLabel = (h) => (h <= -2 ? "Donuyor" : h === -1 ? "Çok soğuk" : h === 0 ? "Soğuk" : h === 1 ? "Serin" : h === 2 ? "Ilık" : "Sıcak");
  const heatClass = (h) => "heat-" + String(clamp(h, -2, 3)).replace("-", "m");

  function normalize() {
    s.hope = clamp(Math.round(s.hope), s.laws.faith3 ? 5 : 0, 100);
    s.disc = clamp(Math.round(s.disc), 0, s.laws.order3 ? 95 : 100);
    ["coal", "food", "hurda", "ilac", "core", "arge", "workers", "children", "sick", "disabled"].forEach(
      (k) => (s[k] = Math.max(0, Math.round(s[k])))
    );
    s.coal = Math.min(s.coal, coalCap());
    s.stress = clamp(Math.round(s.stress), 0, 100);
    if (s.boiler > maxBoiler()) s.boiler = maxBoiler();
    rebalance();
  }

  const TRACK = ["coal", "food", "hurda", "ilac", "core", "arge", "hope", "disc", "workers", "children", "sick", "disabled", "dead", "stress", "km"];
  let lastDelta = [];
  let panelsForced = localStorage.getItem("frostline-panels") === "1";

  function takeSnap() {
    const o = {};
    TRACK.forEach((k) => (o[k] = s[k] || 0));
    return o;
  }

  function computeDelta(before) {
    const after = takeSnap();
    return TRACK.map((k) => ({ k, v: (after[k] || 0) - (before[k] || 0) })).filter((d) => d.v);
  }

  function deltaTone(k, v) {
    return BAD_UP.has(k) ? v < 0 : v > 0;
  }

  function deltaChip(k, v) {
    const good = deltaTone(k, v);
    return `<span class="d big ${good ? "pos" : "neg"}">${RES_LABEL[k] || k} ${v > 0 ? "+" : "−"}${Math.abs(v)}</span>`;
  }

  function showResult(deltas, title) {
    const el = $("g-result");
    if (!el) return;
    if (!deltas || !deltas.length) {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    el.hidden = false;
    el.innerHTML =
      `<p class="g-result-title">${title || "Ne değişti"}</p>` +
      `<div class="g-result-chips">${deltas.map((d) => deltaChip(d.k, d.v)).join("")}</div>`;
  }

  function toastDeltas(deltas, title) {
    const box = $("g-toast");
    if (!box || !deltas.length) return;
    box.innerHTML = "";
    box.classList.add("active");
    const row = document.createElement("div");
    row.className = "toast-banner";
    row.innerHTML =
      `<p class="toast-title">${title || "Ne değişti"}</p>` +
      `<div class="toast-chips">${deltas.map((d) => deltaChip(d.k, d.v)).join("")}</div>`;
    box.appendChild(row);
    requestAnimationFrame(() => {
      box.classList.add("show");
      row.classList.add("show");
    });
    clearTimeout(toastDeltas.t);
    clearTimeout(toastDeltas.t2);
    toastDeltas.t = setTimeout(() => {
      box.classList.remove("show");
      row.classList.remove("show");
      toastDeltas.t2 = setTimeout(() => {
        box.classList.remove("active");
        box.innerHTML = "";
      }, 450);
    }, 3200);
  }

  function pulseHud(deltas) {
    deltas.forEach(({ k, v }) => {
      const meter = k === "hope" ? $("g-hope") : k === "disc" ? $("g-disc") : null;
      const el = meter || document.querySelector(`.res-${k}`);
      if (!el) return;
      const up = deltaTone(k, v);
      el.classList.remove("pulse-up", "pulse-down");
      void el.offsetWidth;
      el.classList.add(up ? "pulse-up" : "pulse-down");
      const floater = document.createElement("em");
      floater.className = "hud-float " + (up ? "pos" : "neg");
      floater.textContent = `${v > 0 ? "+" : "−"}${Math.abs(v)}`;
      el.appendChild(floater);
      setTimeout(() => floater.remove(), 1400);
    });
  }

  function applyFeedback(before, title) {
    lastDelta = computeDelta(before);
    showResult(lastDelta, title);
    if (lastDelta.length) {
      pulseHud(lastDelta);
      toastDeltas(lastDelta, title || "Ne değişti");
    }
    return lastDelta;
  }

  function updateTeach() {
    const play = document.querySelector(".view-play");
    const teachEl = $("g-teach");
    if (!play || !teachEl || !s) return;
    const teach = !panelsForced && !s.over && s.day === 1 && (s.phase === "morning" || s.phase === "route");
    play.classList.toggle("teach", teach);
    teachEl.hidden = !teach;
  }

  function fx(d) {
    const parts = [];
    Object.entries(d).forEach(([k, v]) => {
      if (!v) return;
      s[k] = (s[k] || 0) + v;
      const good = BAD_UP.has(k) ? v < 0 : v > 0;
      parts.push(`<span class="d ${good ? "pos" : "neg"}">${RES_LABEL[k]} ${v > 0 ? "+" : "−"}${Math.abs(v)}</span>`);
    });
    normalize();
    return parts.join(" ");
  }
  const tag = (text, good) => `<span class="d ${good ? "pos" : "neg"}">${text}</span>`;

  function kill(n) {
    let k = 0;
    while (n > 0) {
      if (s.workers > 0) s.workers--;
      else if (s.sick > 0) s.sick--;
      else if (s.children > 0) s.children--;
      else break;
      n--;
      k++;
    }
    s.dead += k;
    s.deathsToday += k;
    normalize();
    return k;
  }
  function sicken(n) {
    const k = Math.min(n, s.workers);
    s.workers -= k;
    s.sick += k;
    normalize();
    return k;
  }
  function injureChar(id, days) {
    const c = charById(id);
    if (!c || c.status === "dead") return "";
    c.status = "injured";
    c.injured = Math.max(c.injured, days);
    return tag(`${c.name} yaralandı (${days} gün)`, false);
  }
  function recruit() {
    const id = s.recruitPool.shift();
    if (!id) return "";
    const r = RECRUITS[id];
    s.chars.push({ id, name: r.name, role: r.role, job: r.job, status: "ok", injured: 0, perk: r.perk });
    s.hope += 3;
    normalize();
    addLog(`${r.name} (${r.role}) ekibe katıldı`, "good");
    return tag(`Yeni karakter: ${r.name} · ${r.role}`, true) + " " + tag("Umut +3", true);
  }
  function killChar(id) {
    const c = charById(id);
    if (!c || c.status === "dead") return "";
    c.status = "dead";
    s.dead++;
    s.deathsToday++;
    s.hope -= 6;
    normalize();
    return tag(`${c.name} öldü`, false);
  }

  function addLog(text, tone) {
    s.log.unshift({ day: s.day, text, tone: tone || "" });
    if (s.log.length > 80) s.log.length = 80;
  }

  const baseTemp = (d) =>
    d <= BASE_TEMP.length ? BASE_TEMP[d - 1] : -56 + Math.round(6 * Math.sin((d - BASE_TEMP.length) * 0.9));
  const nextMilestone = () => (Math.floor(s.km / MILESTONE_KM) + 1) * MILESTONE_KM;
  const shiftMult = () => ({ normal: 1, ext: 1.4, emer: 2 }[s.shift]);
  function foodNeed() {
    let m = 1;
    if (s.laws.soup) m *= 0.75;
    if (s.laws.sawdust) m *= 0.8;
    return Math.ceil(pop() * m);
  }
  function heatFactor(h, half) {
    const base = h >= 2 ? 1 : h === 1 ? 0.8 : h === 0 ? 0.55 : h === -1 ? 0.3 : 0.1;
    return half ? 1 - (1 - base) / 2 : base;
  }
  function foodProd() {
    const idx = s.wagons.map((w, i) => (w === "greenhouse" ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) return 0;
    const ayse = charOk("ayse", "sera");
    const f = idx.reduce((a, i) => a + heatFactor(heatAt(i), ayse), 0) / idx.length;
    let p = s.jobs.sera * 2.5 * f + (ayse ? 6 * f : 0);
    p *= (s.tech.lamps ? 1.4 : 1) * (1 + s.seedBonus) * shiftMult();
    return Math.round(p);
  }
  const argeProd = () =>
    Math.round((s.jobs.atolye * (count("workshop") ? 2 : 1) + (charOk("yusuf", "atolye") ? 3 : 0)) * shiftMult());
  function healCap() {
    let c = (charOk("leyla", "revir") ? 3 : 0) + (charOk("emine", "revir") ? 2 : 0) + s.jobs.revir * (count("infirmary") ? 1 : 0.5);
    if (s.laws.overcrowd) c *= 1.5;
    return Math.floor(c);
  }
  function heatCoal() {
    const lvl = Math.min(s.boiler, Math.floor(crew() / 2));
    if (lvl === 0) return 0;
    let c = lvl * 3 + s.wagons.length;
    if (s.overdrive) c *= 1.5;
    if (charOk("selim", "kazan")) c *= 0.75;
    if (s.tech.boiler) c *= 0.8;
    return Math.ceil(c);
  }
  const travelCoal = (km, mult) => Math.ceil((km / 25) * (s.tech.plow ? 0.85 : 1) * (1 + s.wagons.length * 0.08) * (mult || 1));
  const housingIdx = () => s.wagons.map((w, i) => (w === "housing" ? i : -1)).filter((i) => i >= 0);
  function minHousingHeat() {
    const idx = housingIdx();
    return idx.length ? Math.min(...idx.map(heatAt)) : tempPenalty(s.temp) - 1;
  }
  const canAfford = (cost) => Object.entries(cost).every(([k, v]) => (s[k] || 0) >= v);
  const pay = (cost) => Object.entries(cost).forEach(([k, v]) => (s[k] -= v));
  function wagonCost(type) {
    const c = { ...WAGONS[type].cost };
    if (charOk("yusuf", "atolye")) c.hurda = Math.ceil(c.hurda * 0.75);
    return c;
  }
  const costStr = (cost) => Object.entries(cost).map(([k, v]) => `${v} ${RES_LABEL[k]}`).join(", ");
  const riskLabel = (d) => (d === 0 ? "Yok" : d < 0.09 ? "Düşük" : d < 0.16 ? "Orta" : "Yüksek");

  // ————————————————————————————————— Sözler

  const PROMISES = {
    warm: { text: "Tüm yaşam vagonları en az 'Serin' olacak", check: () => minHousingHeat() >= 1, win: { hope: 12, disc: -6 }, lose: { hope: -14, disc: 10 } },
    food: { text: "Depoda en az 3 günlük yemek olacak", check: () => s.food >= foodNeed() * 3, win: { hope: 10, disc: -5 }, lose: { hope: -12, disc: 8 } },
    heal: { text: "Hasta sayısı 1'e inecek", check: () => s.sick <= 1, win: { hope: 10, disc: -4 }, lose: { hope: -12, disc: 8 } },
    nodeath: { text: "2 gün boyunca kimse ölmeyecek", atDeadline: true, check: (p) => s.dead === p.deadAt, win: { hope: 14, disc: -6 }, lose: { hope: -16, disc: 10 } },
    infirmary: { text: "Bir revir vagonu inşa edilecek", check: () => count("infirmary") > 0, win: { hope: 10, disc: -5 }, lose: { hope: -12, disc: 8 } },
  };

  function makePromise(id) {
    if (s.promises.some((p) => p.id === id)) return "";
    s.promises.push({ id, deadline: s.day + 2, deadAt: s.dead });
    addLog(`Söz verildi: ${PROMISES[id].text}`, "warn");
    return fx({ hope: 3, disc: -3 }) + " " + tag("Söz: 2 gün", true);
  }

  // ————————————————————————————————— Olaylar

  const TRAVEL_EVENTS = [
    {
      id: "stranger", title: "Karda bir yabancı", cond: () => s.recruitPool.length > 0,
      text: () => RECRUITS[s.recruitPool[0]].intro,
      choices: [
        { label: "Trene al", hint: () => `${RECRUITS[s.recruitPool[0]].role} ekibe katılır · bir boğaz daha`, run: () => "Yabancı kar tozunu silkeleyip içeri girdi. " + recruit() },
        { label: "Geride bırak", hint: "umut −3", run: () => "Silüet karın içinde küçüldü. " + fx({ hope: -3 }) },
      ],
    },
    {
      id: "snow", title: "Raylarda kar yığını", text: "Önde rayları gömen dev bir kar duvarı. Tren yavaşlıyor.",
      choices: [
        { label: "Kürekle temizle", hint: "−4 yemek · donma riski", run: () => {
          let out = fx({ food: -4 });
          if (!s.tech.plow && chance(0.35)) out += " " + tag(`${sicken(1)} işçi dondu (hasta)`, false);
          else out += " " + tag("Kimse zarar görmedi", true);
          return "Ekipler saatlerce kürek salladı. " + out;
        } },
        { label: "Kazanı zorla, karı yar", hint: "−6 kömür · kazan stresi +15", run: () => "Lokomotif kara gömüldü ve çıktı. " + fx({ coal: -6, stress: 15 }) },
      ],
    },
    {
      id: "raid", title: "Akıncı pususu", text: "Bir köprüden atlayan gölgeler vagonların üstüne iniyor. Silahları var.",
      choices: [
        { label: "Hızlan, kaç", hint: "−6 kömür · son vagon hasar alabilir", run: () => {
          let out = fx({ coal: -6 });
          if (chance(0.4)) out += " " + fx({ hurda: -8 }) + " Son vagon delik deşik oldu.";
          return "Tren çığlık atarak hızlandı. " + out;
        } },
        { label: "Karşı koy", hint: "Kerem varsa şans yüksek · ölüm riski · hurda", run: () => {
          const k = charOk("kerem");
          if (chance(k ? 0.75 : 0.45)) return "Akıncılar püskürtüldü, silahları bizde. " + fx({ hurda: R(8, 16), hope: 4 });
          const d = kill(R(1, 2));
          return `Çatışma kanlı bitti. ${tag(d + " kişi öldü", false)} ` + (k && chance(0.4) ? injureChar("kerem", 2) : "");
        } },
        { label: "Erzak ver, geçmemize izin versinler", hint: "−12 yemek · umut −3", run: () => "Çuvallar karın üstüne bırakıldı. " + fx({ food: -12, hope: -3 }) },
      ],
    },
    {
      id: "refugees", title: "Yol kenarında mülteciler", cond: () => s.storm === 0,
      text: () => "Ray kenarında el sallayan, battaniyelere sarılmış bir grup. Çocuklar da var.",
      choices: [
        { label: "Trene al", hint: "+3–5 kişi · daha çok yemek ve yatak gerekir", run: () => {
          const w = R(2, 4), c = R(0, 1);
          s.stats.refugees += w + c;
          const extra = chance(0.35) ? " Aralarından biri öne çıktı. " + recruit() : "";
          return "Yeni yüzler vagonlara doluştu. " + fx({ workers: w, children: c, hope: 6 }) + extra;
        } },
        { label: "Erzak bırak, devam et", hint: "−6 yemek · umut +1", run: () => "Bir çuval yemek ve bir kibrit kutusu bırakıldı. " + fx({ food: -6, hope: 1 }) },
        { label: "Durma", hint: "umut −6 · hoşnutsuzluk +3", run: () => {
          s.stats.abandoned++;
          return "Yolcular pencerelerden onların küçülüşünü izledi. " + fx({ hope: -6, disc: 3 });
        } },
      ],
    },
    {
      id: "coupling", title: "Bağlantı kopuyor", cond: () => s.wagons.length >= 2,
      text: () => `Son vagonun (${WAGONS[s.wagons[s.wagons.length - 1]].name}) bağlantısı buzdan çatlıyor. Birkaç dakikası var.`,
      choices: [
        { label: "Tamir et", hint: "−10 hurda", can: () => s.hurda >= 10, run: () => "Kaynakçılar buzun üstünde çalıştı. Bağlantı tuttu. " + fx({ hurda: -10 }) },
        { label: "Bırak gitsin", hint: "Vagon ve işlevi kaybolur · umut −5", run: () => {
          const w = s.wagons.pop();
          s.stats.detached++;
          normalize();
          addLog(`${WAGONS[w].name} geride kaldı`, "bad");
          return `${WAGONS[w].name} karanlıkta durdu ve küçüldü. ` + fx({ hope: -5 });
        } },
      ],
    },
    {
      id: "switch", title: "Buzlanmış makas", text: "Makas donmuş, tren yanlış hatta sapmak üzere.",
      choices: [
        { label: "Selim tamir etsin", hint: "Sağlamsa %85 başarı · başarısızsa yaralanır", avail: () => charById("selim").status !== "dead", run: () => {
          const p = charOk("selim") ? 0.85 : 0.5;
          if (chance(p)) return "Selim çekiçle buzu kırdı, makas döndü. " + tag("Sorun çözüldü", true);
          return "Makas döndü ama Selim'in elleri dondu. " + injureChar("selim", 2);
        } },
        { label: "Geri dön, diğer hattı kullan", hint: "−30 km", run: () => {
          s.km = Math.max(0, s.km - 30);
          return "Tren saatlerce geri geri gitti. " + tag("−30 km", false);
        } },
      ],
    },
    {
      id: "hunt", title: "Donmuş geyik sürüsü", cond: () => s.storm === 0,
      text: "Ovada kıpırdamayan siluetler: fırtınada donmuş bir sürü. Ama bazıları hâlâ yaşıyor olabilir.",
      choices: [
        { label: "Avcı gönder", hint: () => (charOk("baran") ? "Baran önde · +18–28 yemek · yaralanma riski" : "+10–18 yemek · yaralanma riski"), run: () => {
          let out = fx({ food: charOk("baran") ? R(18, 28) : R(10, 18) });
          if (chance(0.25)) out += " " + tag(`${sicken(1)} avcı dondu`, false);
          return "Etler vagonlara taşındı. " + out;
        } },
        { label: "Zaman kaybetme", hint: "Etki yok", run: () => "Tren yoluna devam etti." },
      ],
    },
    {
      id: "radio", title: "Radyo sinyali", text: "Hoparlörden cızırtılı bir ses: 'Erzak... depo... koordinat...'",
      choices: [
        { label: "Sinyali takip et", hint: "−20 km · rastgele ödül veya tuzak", run: () => {
          s.km = Math.max(0, s.km - 20);
          const r = Math.random();
          if (r < 0.45) return "Gömülü bir depo! " + fx({ food: R(8, 14), coal: R(8, 16) });
          if (r < 0.7) return "Bir buhar çekirdeği, bir cesedin kucağında. " + fx({ core: 1 });
          if (r < 0.85) return "Sadece eski bir kayıt. Ses kendi kendine tekrar ediyordu. " + fx({ hope: -3 });
          return "Bir tuzak. " + tag(kill(1) + " kişi öldü", false) + " " + fx({ hope: -4 });
        } },
        { label: "Yoksay", hint: "Etki yok", run: () => "Ses yavaşça cızırtıya karıştı." },
      ],
    },
    {
      id: "whiteout", title: "Beyaz duvar", cond: () => s.storm > 0,
      text: "Görüş sıfır. Rüzgâr vagonların arasından ıslık çalıyor. Kazanın sesi bile duyulmuyor.",
      choices: [
        { label: "Aşırı yük ver, delip geç", hint: "kazan stresi +20 · −8 kömür", run: () => "Lokomotif kör bir boğa gibi ilerledi. " + fx({ stress: 20, coal: -8 }) },
        { label: "Yavaşla", hint: "−40 km · tüm vagonlar daha da soğur", run: () => {
          s.km = Math.max(0, s.km - 40);
          s.temp -= 5;
          return "Tren sürünerek ilerledi. " + tag("−40 km · −5°C", false);
        } },
      ],
    },
    {
      id: "frozenwagon", title: "Kopan vagonda donanlar", cond: () => s.storm > 0 && minHousingHeat() <= 0,
      text: "Fırtına arka yaşam vagonunun kapısını kırdı. Uyuyanlar üşüyor.",
      choices: [
        { label: "Herkesi öne sıkıştır", hint: "hoşnutsuzluk +6", run: () => "Koridorlar insanla doldu. " + fx({ disc: 6 }) },
        { label: "Kapıyı hurdayla kapat", hint: "−8 hurda", can: () => s.hurda >= 8, run: () => "Kaynak alevi gece boyunca yandı. " + fx({ hurda: -8 }) },
      ],
    },
  ];

  const NIGHT_EVENTS = [
    {
      id: "thief", title: "Kömür hırsızı", cond: () => s.coal > 10,
      text: "Bir yolcu kazandan kömür çalarken yakalandı. Arka vagonda ailesinin donduğunu söylüyor.",
      choices: [
        { label: "Affet", hint: "−3 kömür · umut +2 · hoşnutsuzluk +2", run: () => "Adam ağlayarak teşekkür etti. Diğerleri birbirine baktı. " + fx({ coal: -3, hope: 2, disc: 2 }) },
        { label: "Cezalandır: bir gün tayın yok", hint: "umut −3 · hoşnutsuzluk −3", run: () => "Düzen korundu. Bir aile daha aç yattı. " + fx({ hope: -3, disc: -3 }) },
        { label: "Ailesine kömür ver", hint: "−6 kömür · umut +6", run: () => "Kaptanın merhameti vagondan vagona anlatıldı. " + fx({ coal: -6, hope: 6 }) },
      ],
    },
    {
      id: "hungrychild", title: "Aç bir çocuk", cond: () => s.children > 0,
      text: "Bir çocuk mutfak vagonunun kapısında bekliyor. Annesi hasta.",
      choices: [
        { label: "Ek tayın ver", hint: "−3 yemek · umut +4", run: () => "Çocuk ekmeği koynuna sakladı, annesine götürdü. " + fx({ food: -3, hope: 4 }) },
        { label: "Herkes eşit pay alır", hint: "hoşnutsuzluk −1 · umut −2", run: () => "Kurallar kurallardır. " + fx({ disc: -1, hope: -2 }) },
      ],
    },
    {
      id: "returners", title: "Geri dönmek isteyenler", once: true, cond: () => s.day >= 3,
      text: "Bir grup güneye, eski şehre dönmek istiyor. 'Bu tren hiçbir yere gitmiyor' diyorlar.",
      choices: [
        { label: "Dinle ve söz ver: vagonlar ısınacak", hint: "Söz: tüm yaşam vagonları en az Serin", run: () => "Grup şimdilik sakinleşti. " + makePromise("warm") },
        { label: "Reddet", hint: "hoşnutsuzluk +8", run: () => "Fısıltılar büyüdü. " + fx({ disc: 8 }) },
        { label: "Gitsinler", hint: "−3–5 işçi · −10 yemek · hoşnutsuzluk −10 · umut −5", run: () => {
          const w = Math.min(s.workers, R(3, 5));
          return `${w} kişi bir istasyonda indi ve güneye yürümeye başladı. ` + fx({ workers: -w, food: -10, disc: -10, hope: -5 });
        } },
      ],
    },
    {
      id: "doctor", title: "Leyla'nın talebi", once: true, cond: () => charOk("leyla") && s.sick >= 2 && !count("infirmary"),
      text: "Dr. Leyla: 'Hastaları yataklarda tedavi edemem. Bana bir revir vagonu lazım.'",
      choices: [
        { label: "Söz ver: revir vagonu", hint: "Söz: 2 gün içinde revir inşa et", run: () => "Leyla başını salladı. " + makePromise("infirmary") },
        { label: "Elimizdekiyle idare et", hint: "umut −3", run: () => "Leyla bir şey demedi. " + fx({ hope: -3 }) },
      ],
    },
    {
      id: "frozen", title: "Donmuş aile", cond: () => minHousingHeat() <= -1,
      text: "Sabaha karşı arka yaşam vagonunda birbirine sarılmış bir aile bulundu. Nefes almıyorlar.",
      choices: [
        { label: "Tören yap", hint: "−2 yemek · umut −4", run: () => {
          const d = kill(R(1, 2));
          return `${tag(d + " kişi öldü", false)} Mumlar raylar boyunca yakıldı. ` + fx({ food: -2, hope: -4 });
        } },
        { label: "Sessizce kara bırak", hint: "umut −8 · hoşnutsuzluk +4", run: () => {
          const d = kill(R(1, 2));
          return `${tag(d + " kişi öldü", false)} Kimse adlarını söylemedi. ` + fx({ hope: -8, disc: 4 });
        } },
      ],
    },
    {
      id: "boilerwarn", title: "Selim'in uyarısı", cond: () => s.stress >= 50 && charOk("selim"),
      text: () => `Selim yağlı ellerini siliyor: 'Kazan %${s.stress} stres altında. Bir gece daha böyle gidersek patlar.'`,
      choices: [
        { label: "Aşırı yükü kapat", hint: "Isı −1 · stres düşer", run: () => {
          s.overdrive = false;
          return "Kazan iç çekti. " + tag("Aşırı yük kapandı", true);
        } },
        { label: "Devam et, insanlar donuyor", hint: "umut +2 · stres +10", run: () => "Selim başını salladı ama gözleri korkuyla doluydu. " + fx({ hope: 2, stress: 10 }) },
      ],
    },
    {
      id: "stash", title: "Kerem'in zulası", once: true, cond: () => charOk("kerem") && s.day >= 2,
      text: "Kerem'in yatağının altında konserve dolu bir çanta bulundu.",
      choices: [
        { label: "Herkese paylaştır", hint: "+8 yemek · Kerem küser (yaralı sayılır 1 gün)", run: () => "Konserveler dağıtıldı. " + fx({ food: 8, hope: 2 }) + " " + injureChar("kerem", 1) },
        { label: "Görmezden gel", hint: "hoşnutsuzluk +3", run: () => "Söylentiler yayıldı. " + fx({ disc: 3 }) },
      ],
    },
    {
      id: "moonshine", title: "Gizli içki", text: "Atölye vagonunda patates kabuğundan içki yapılıyor.",
      choices: [
        { label: "Göz yum", hint: "umut +4 · 1 kişi hastalanabilir", run: () => {
          let out = fx({ hope: 4 });
          if (chance(0.5)) out += " " + tag(`${sicken(1)} kişi zehirlendi`, false);
          return "O gece vagonlarda şarkı söylendi. " + out;
        } },
        { label: "Yasakla", hint: "hoşnutsuzluk +3", run: () => "Şişeler kırıldı. " + fx({ disc: 3 }) },
      ],
    },
    {
      id: "strike", title: "İşçi grevi", cond: () => s.disc >= 45,
      text: "Ateşçiler kazanın önünde oturuyor: 'Bu mesai bizi öldürüyor.'",
      choices: [
        { label: "Taleplerini kabul et", hint: "Yarın normal mesai zorunlu · hoşnutsuzluk −10", run: () => {
          s.forceNormal = true;
          return "Ateşçiler küreklerini aldı. " + fx({ disc: -10 });
        } },
        { label: "Bastır", hint: "hoşnutsuzluk +5 · umut −5", run: () => "Bekçiler kalabalığı dağıttı. " + fx({ disc: 5, hope: -5 }) },
        { label: "Söz ver: kimse ölmeyecek", hint: "Söz: 2 gün ölümsüz", run: () => "Kalabalık bekleyecek. " + makePromise("nodeath") },
      ],
    },
    {
      id: "speech", title: "Umutsuzluk", cond: () => s.hope <= 40,
      text: "Vagonlarda kimse konuşmuyor. Bir kadın sana bakıp soruyor: 'Bu yolun bir sonu var mı?'",
      choices: [
        { label: "Konuşma yap", hint: "Bugün ölüm yoksa umut +7, varsa +2", run: () => (s.deathsToday ? "İnsanlar dinledi ama inanmadı. " + fx({ hope: 2 }) : "Sesin vagonlar boyunca yankılandı. " + fx({ hope: 7 })) },
        { label: "Söz ver: depolar dolacak", hint: "Söz: 3 günlük yemek", run: () => "Kadın başını salladı. " + makePromise("food") },
      ],
    },
    {
      id: "lights", title: "Uzakta ışıklar", cond: () => s.km > 400, once: true,
      text: "Ufukta titreyen sarı noktalar. Bir şehir mi, yoksa yansıma mı?",
      choices: [{ label: "İnsanlar pencerelere koşsun", hint: "umut +5", run: () => "Kimse uyumadı o gece. " + fx({ hope: 5 }) }],
    },
    {
      id: "seeds", title: "Ayşe'nin tohumları", once: true, cond: () => charOk("ayse") && s.day >= 3,
      text: "Ayşe donmuş bir kutudan hâlâ canlı tohumlar çıkardı.",
      choices: [
        { label: "Seraya ek", hint: "Sera verimi kalıcı +%20", run: () => {
          s.seedBonus += 0.2;
          return "İlk filizler iki gün sonra çıktı. " + tag("Sera +%20", true);
        } },
        { label: "Ye", hint: "+6 yemek", run: () => "Bir gecelik çorba. " + fx({ food: 6 }) },
      ],
    },
    {
      id: "plague", title: "Salgın korkusu", cond: () => s.sick >= 4,
      text: () => `${s.sick} hasta aynı vagonda öksürüyor. Diğerleri yaklaşmak istemiyor.`,
      choices: [
        { label: "Karantina", hint: "hoşnutsuzluk +4", run: () => "Hastalar ayrıldı, bağlantı kapıları kilitlendi. " + fx({ disc: 4 }) },
        { label: "Söz ver: hastalar iyileşecek", hint: "Söz: hasta ≤ 1", run: () => "Leyla'nın yüzü soldu. " + makePromise("heal") },
        { label: "Hiçbir şey yapma", hint: "+2 hasta", run: () => "Öksürük sesleri arttı. " + tag(`${sicken(2)} kişi daha hastalandı`, false) },
      ],
    },
    {
      id: "kidscout", title: "Keşfe katılmak isteyen çocuk", once: true, cond: () => s.children > 0 && charOk("kerem"),
      text: "On iki yaşında bir çocuk Kerem'in peşinden ayrılmıyor: 'Ben de dışarı çıkmak istiyorum.'",
      choices: [
        { label: "Kerem ona öğretsin", hint: "Çocuk işçiye dönüşür · umut −2", run: () => "Çocuğun gözleri parladı. Annesi ağladı. " + fx({ children: -1, workers: 1, hope: -2 }) },
        { label: "Hayır, çocuklar içeride kalır", hint: "umut +2", run: () => "Kerem çocuğun saçını karıştırdı. " + fx({ hope: 2 }) },
      ],
    },
  ];

  // ————————————————————————————————— Kart / akış

  let card = null;

  function showCard(c) {
    card = c;
    renderCard();
    renderAll();
  }

  function cont(label, run) {
    return [{ label: label || "Devam", primary: true, run }];
  }

  function pickEvent(list) {
    const ok = list.filter((e) => (!e.cond || e.cond()) && !(e.once && s.seen[e.id]));
    return ok.length ? pick(ok) : null;
  }

  function runEvent(ev, kicker, then) {
    s.seen[ev.id] = (s.seen[ev.id] || 0) + 1;
    const text = typeof ev.text === "function" ? ev.text() : ev.text;
    showCard({
      kicker, title: ev.title, body: `<p>${text}</p>`, tone: "event",
      choices: ev.choices
        .filter((c) => !c.avail || c.avail())
        .map((c) => ({
          label: c.label, hint: typeof c.hint === "function" ? c.hint() : c.hint, disabled: c.can ? !c.can() : false,
          run: () => {
            const out = c.run();
            normalize();
            addLog(`${ev.title} → ${c.label}`);
            if (checkInstantEnd()) return;
            showCard({ kicker, title: ev.title, body: `<p>${out}</p>`, tone: "event", choices: cont("Devam", then) });
          },
        })),
    });
  }

  function setPhase(p) {
    s.phase = p;
    const label = (PHASES.find((x) => x[0] === p) || [p, p])[1];
    if (window.FlowView) window.FlowView.setLive(p, `Gün ${s.day} · ${label}`);
    updateTeach();
  }

  // —— SABAH
  function startDay() {
    s.deathsToday = 0;
    s.boilerOut = false;
    s.builtToday = false;
    s.researchedToday = false;
    s.shift = "normal";
    s.routeOptions = null;
    s.route = null;
    s.temp = baseTemp(s.day);
    if (!s.storm && s.km >= s.nextStorm) {
      s.storms++;
      s.storm = Math.min(4, 2 + Math.floor((s.storms - 1) / 2));
      s.nextStorm = s.km + R(550, 750);
      addLog(`FIRTINA (${s.storms}.) başladı · ${s.storm} gün`, "bad");
    }
    if (s.storm >= 2) s.temp = -70;
    else if (s.storm === 1) s.temp = -62;
    setPhase("morning");
    morningCard();
  }

  function morningCard() {
    const lines = [];
    lines.push(`<li>Bugün dış sıcaklık <b>${s.temp}°C</b>. Yarın ${s.storm >= 3 ? -70 : s.storm === 2 ? -62 : baseTemp(s.day + 1)}°C, sonraki gün ${s.storm >= 4 ? -70 : s.storm === 3 ? -62 : baseTemp(s.day + 2)}°C.</li>`);
    if (s.day === 4) lines.push(`<li class="bad">Sıcaklık düşüşü: önümüzdeki günler −30°C'nin altında. Kazan seviyesini düşün.</li>`);
    if (s.storm) lines.push(`<li class="bad">FIRTINA: ${s.storm} gün daha. Rota seçenekleri kısıtlı.</li>`);
    else if (s.nextStorm - s.km <= 300) lines.push(`<li class="bad">Kuzeyde beyaz bir duvar yükseliyor. Fırtına cephesi ~${Math.max(0, s.nextStorm - s.km)} km ileride.</li>`);
    const need = foodNeed();
    const coalDay = heatCoal() + 6;
    lines.push(`<li>Yemek: ${s.food} (${Math.floor(s.food / Math.max(1, need))} günlük, günde ${need} tüketim)</li>`);
    lines.push(`<li>Kömür: ${s.coal}/${coalCap()} (~${Math.floor(s.coal / Math.max(1, coalDay))} günlük)</li>`);
    if (s.sick) lines.push(`<li class="${s.sick >= 4 ? "bad" : ""}">Hasta: ${s.sick} · revir kapasitesi ${healCap()}/gün</li>`);
    const idle = labor() - assigned();
    if (idle > 0) lines.push(`<li class="warn">${idle} işçi boşta — soldan Görevler panelinden ata.</li>`);
    if (crew() < s.boiler * 2) lines.push(`<li class="bad">Kazan ekibi eksik: ${crew()} ateşçi, seviye ${s.boiler} için ${s.boiler * 2} gerekiyor.</li>`);
    s.promises.forEach((p) => lines.push(`<li class="warn">Söz: ${PROMISES[p.id].text} (son gün ${p.deadline})</li>`));
    if (s.ultimatum) lines.push(`<li class="bad">SON ŞANS: Gün ${s.ultimatum.deadline} sonuna kadar Umut ≥ 30 ve Hoşnutsuzluk ≤ 70.</li>`);
    if (s.day >= s.lawReadyDay) lines.push(`<li class="good">Kanun Kitabı hazır — üstteki butondan bir kanun imzalayabilirsin.</li>`);

    const choices = [{ label: "Normal mesai", hint: "Üretim ×1", run: () => chooseShift("normal") }];
    if (s.forceNormal) {
      lines.push(`<li class="warn">Grevle anlaşma: bugün sadece normal mesai.</li>`);
    } else {
      if (s.laws.extshift) choices.push({ label: "Uzatılmış mesai", hint: "Üretim ×1.4 · hoşnutsuzluk +6 · kaza riski", run: () => chooseShift("ext") });
      if (s.laws.emershift) choices.push({ label: "Acil mesai (24 saat)", hint: "Üretim ×2 · hoşnutsuzluk +14 · %30 ölüm", run: () => chooseShift("emer") });
    }
    showCard({
      kicker: `Gün ${s.day} · Sabah raporu`,
      title: s.day === 1 ? "Kazan yandı. Sefer başlıyor." : `${s.km} km geride kaldı`,
      body:
        (s.day === 1
          ? "<p>Dünya dondu. Bu tren son medeniyet ve durmak ölüm demek. Varılacak bir yer yok; raylar bittiği yerde yenisi döşenir. Önce mesaiyi seç — kazan ve görevleri yan panellerden (veya üstteki düğmeden açarak) ayarlayabilirsin.</p>"
          : "") + `<ul class="report">${lines.join("")}</ul>`,
      choices,
    });
  }

  function chooseShift(kind) {
    s.shift = kind;
    s.forceNormal = false;
    if (kind === "emer") s.stats.emer++;
    addLog(`Mesai: ${{ normal: "normal", ext: "uzatılmış", emer: "ACİL" }[kind]}`, kind === "normal" ? "" : "warn");
    routeCard();
  }

  // —— ROTA
  function genRoutes() {
    if (s.storm > 0) {
      return [
        { type: "stormpush", name: "Fırtınada ilerle", km: 110, cold: 0, danger: 0, nostop: true, coal: travelCoal(110, 1.8), hint: "durak yok" },
        { type: "wait", name: "Sığın ve bekle", km: 0, cold: 0, danger: 0, nostop: true, coal: 0, hint: "km yok" },
      ];
    }
    const opts = shuffle(Object.keys(LOCS)).slice(0, 3).map((k) => {
      const L = LOCS[k];
      const km = R(L.km[0], L.km[1]);
      return { type: k, name: L.name, km, cold: L.cold, danger: L.danger, nostop: !!L.nostop, coal: travelCoal(km), hint: L.hint };
    });
    opts.push({ type: "wait", name: "Bekle ve ısın", km: 0, cold: 0, danger: 0, nostop: true, coal: 0, hint: "km yok" });
    return opts;
  }

  function routeCard() {
    setPhase("route");
    if (!s.routeOptions) s.routeOptions = genRoutes();
    showCard({
      kicker: `Gün ${s.day} · Harita`,
      title: s.storm ? "Fırtına her yeri yutuyor" : "Bugün nereye?",
      body: `<p>Toplam: <b>${s.km} km</b> · sonraki kilometre taşı ${nextMilestone()} km. Kömür: ${s.coal}. Seyahat kömürü mesafe ve vagon sayısıyla artar; bu gecenin ısınma kömürü ayrıca yanar (~${heatCoal()}).</p>`,
      layout: "routes",
      choices: s.routeOptions.map((o) => ({
        label: o.name,
        hint:
          o.type === "wait"
            ? "0 km · seyahat kömürü yok · sadece ısınma"
            : `${o.km} km · ~${o.coal} kömür · Risk: ${riskLabel(o.danger)}${o.cold ? ` · ${o.cold}°C` : ""} · ${o.hint}` +
              (o.coal > s.coal ? " · KÖMÜR YETMEZ" : ""),
        warn: o.coal > s.coal,
        run: () => {
          s.route = o;
          s.temp += o.cold;
          addLog(`Rota: ${o.name}${o.km ? ` (${o.km} km)` : ""}`);
          travel();
        },
      })),
    });
  }

  // —— SEYAHAT
  function travel() {
    const r = s.route;
    if (r.type === "wait") {
      eveningCard("Tren raylarda bekledi. Kazan sadece ısınma için yandı.");
      return;
    }
    setPhase("travel");
    let km = r.km;
    let text;
    if (s.coal >= r.coal) {
      s.coal -= r.coal;
      text = `Tren ${km} km yol aldı. ${tag(`Kömür −${r.coal}`, false)}`;
    } else {
      km = Math.floor(km * (s.coal / r.coal));
      text = `Kömür yetmedi! Tren sadece ${km} km gidip durdu. Hedefe varılamadı. ${tag(`Kömür −${s.coal}`, false)} ${fx({ hope: -4 })}`;
      s.coal = 0;
      r.nostop = true;
    }
    const before = s.km;
    s.km += km;
    normalize();
    const passed = Math.floor(s.km / MILESTONE_KM) * MILESTONE_KM;
    if (passed > before) {
      text += `<br>Raylar kenarında paslı bir tabela: <b>${passed} km</b>. İnsanlar pencerelere koştu. ${fx({ hope: 5 })}`;
      addLog(`Kilometre taşı: ${passed} km`, "good");
    }
    const stranger = s.recruitPool.length && !s.storm && s.day >= 2 && chance(0.2);
    const ev = stranger ? TRAVEL_EVENTS[0] : chance(s.storm ? 0.75 : 0.5) ? pickEvent(TRAVEL_EVENTS) : null;
    const after = () => (r.nostop ? eveningCard() : stopCard());
    showCard({
      kicker: `Gün ${s.day} · Seyahat`, title: `${r.name} yönünde`,
      body: `<p>${text}</p><p class="muted">Toplam: ${s.km} km · sonraki kilometre taşı ${nextMilestone()} km</p>`,
      choices: cont(ev ? "Devam — bir şey var…" : "Devam", () => (ev ? runEvent(ev, `Gün ${s.day} · Yol olayı`, after) : after())),
    });
  }

  // —— DURAK
  function stopCard() {
    setPhase("stop");
    const L = LOCS[s.route.type];
    const kerem = charOk("kerem", "kesif");
    const choices = [2, 4, 6].map((n) => ({
      label: `Keşif ekibi gönder (${n} kişi)`,
      hint: `Ganimet ×${{ 2: 0.6, 4: 1, 6: 1.3 }[n]}${kerem ? " · Kerem liderlik ediyor" : ""} · kişi başı risk ~%${Math.round(exploreRisk(L) * 100)}`,
      disabled: s.workers < n,
      run: () => explore(n),
    }));
    choices.push({ label: "Hızlı toplama (tren yanında)", hint: "Ganimet ×0.3 · risk yok", run: () => quickGather() });
    choices.push({ label: "Durmadan geç", hint: "Hiçbir şey alma", run: () => { addLog(`${L.name}: geçildi`); eveningCard(); } });
    showCard({
      kicker: `Gün ${s.day} · Durak`, title: L.name,
      body: `<p>${L.desc}</p><p class="muted">Risk: ${riskLabel(L.danger)} · Dış sıcaklık ${s.temp}°C · ${kerem ? "Kerem keşfe hazır." : "Kerem keşifte değil (görevini 'Keşif' yap)."}</p>`,
      choices,
    });
  }

  function exploreRisk(L) {
    const coldF = 1 + Math.max(0, -(s.temp + 30)) / 40;
    return L.danger * coldF * (charOk("kerem", "kesif") ? 0.6 : 1) * (s.tech.scoutgear ? 0.6 : 1);
  }

  function explore(n) {
    const L = LOCS[s.route.type];
    const kerem = charOk("kerem", "kesif");
    s.stats.explored++;
    let mult = { 2: 0.6, 4: 1, 6: 1.3 }[n] * (kerem ? 1.4 : 1) * (0.7 + Math.random() * 0.6);
    const p = exploreRisk(L);
    const story = [];
    const sp = L.special || {};

    if (sp.raid && chance(sp.raid)) {
      story.push("Depoda akıncılar vardı. Çatışma çıktı.");
      mult *= kerem ? 0.8 : 0.5;
      const d = kill(chance(kerem ? 0.3 : 0.6) ? 1 : 0);
      if (d) story.push(tag(`${d} kişi vuruldu`, false));
    }
    if (sp.collapse && chance(sp.collapse)) {
      story.push("Galeride göçük!");
      if (n >= 4) story.push(tag(`${kill(R(1, 2))} kişi kayaların altında kaldı`, false));
      else story.push(tag(`${sicken(1)} kişi yaralandı`, false));
    }

    const gains = {};
    Object.entries(L.loot).forEach(([k, [a, b]]) => (gains[k] = Math.round(R(a, b) * mult)));
    const baran = charOk("baran", "kesif");
    if (baran) gains.food = Math.round((gains.food || R(3, 6)) * 1.6);
    story.push("Ganimet: " + fx(gains) + (baran ? " · Baran av getirdi" : ""));

    let injured = 0, died = 0;
    for (let i = 0; i < n; i++) {
      if (chance(p * 0.3)) died++;
      else if (chance(p)) injured++;
    }
    if (died) story.push(tag(`${kill(died)} kişi soğukta kayboldu`, false));
    if (injured) story.push(tag(`${sicken(injured)} kişi donma yarası aldı (hasta)`, false));
    if (!died && !injured) story.push(tag("Ekip eksiksiz döndü", true));
    if (kerem && chance(p * 0.5)) story.push(injureChar("kerem", 2));

    if (sp.refugees && chance(sp.refugees)) {
      const w = R(2, 4);
      s.stats.refugees += w;
      story.push(`Bir bodrumda saklanan ${w} kişi bulundu ve trene katıldı. ` + fx({ workers: w, hope: 4 }));
      if (chance(0.4)) story.push("Aralarında biri var ki işini biliyor. " + recruit());
    } else if (chance(0.12)) {
      story.push("Ekip enkazın içinde yalnız bir hayatta kalan buldu. " + recruit());
    }
    if (sp.core && chance(sp.core)) story.push("Bir buhar çekirdeği! " + fx({ core: 1 }));
    if (sp.seeds && chance(sp.seeds)) {
      s.seedBonus += 0.15;
      story.push(tag("Saklı tohumlar: sera verimi kalıcı +%15", true));
    }

    addLog(`${L.name}: ${n} kişilik keşif`);
    if (checkInstantEnd()) return;
    showCard({
      kicker: `Gün ${s.day} · Keşif sonucu`, title: L.name, tone: died ? "bad" : "event",
      body: `<p>${story.join("</p><p>")}</p>`,
      choices: cont("Trene dön → Akşam", () => eveningCard()),
    });
  }

  function quickGather() {
    const L = LOCS[s.route.type];
    const gains = {};
    Object.entries(L.loot).forEach(([k, [a, b]]) => (gains[k] = Math.round(R(a, b) * 0.3)));
    addLog(`${L.name}: hızlı toplama`);
    showCard({
      kicker: `Gün ${s.day} · Durak`, title: L.name,
      body: `<p>Tren yanındaki enkazdan ne bulunduysa toplandı. ${fx(gains)}</p>`,
      choices: cont("Devam → Akşam", () => eveningCard()),
    });
  }

  // —— AKŞAM
  function eveningCard(intro) {
    setPhase("evening");
    const need = foodNeed();
    const fp = foodProd();
    const hc = heatCoal();
    const minH = minHousingHeat();
    const preview = [
      `<li>Bu gece tahmini: yemek <b>+${fp}</b> üretim / <b>−${need}</b> tüketim (stok ${s.food})</li>`,
      `<li>Isınma kömürü: <b>−${hc}</b> (stok ${s.coal})${hc > s.coal ? ' <span class="d neg">KAZAN SÖNECEK</span>' : ""}</li>`,
      `<li>En soğuk yaşam vagonu: <b class="${heatClass(minH)}-t">${heatLabel(minH)}</b>${minH <= 0 ? " — hastalık riski" : ""}</li>`,
      `<li>Ar-Ge: ${s.arge} (+${argeProd()} bu gece) · Hurda: ${s.hurda}</li>`,
    ];
    const choices = [];
    Object.entries(WAGONS).forEach(([id, w]) => {
      const cost = wagonCost(id);
      choices.push({
        group: "İnşa",
        label: w.name, hint: `${costStr(cost)} · ${w.desc}`,
        disabled: s.builtToday || !canAfford(cost) || s.wagons.length >= MAX_WAGONS,
        run: () => positionCard(id),
      });
    });
    Object.entries(TECH).forEach(([id, t]) => {
      if (s.tech[id]) return;
      choices.push({
        group: "Araştırma",
        label: t.name, hint: `${costStr(t.cost)} · ${t.desc}`,
        disabled: s.researchedToday || !canAfford(t.cost),
        run: () => {
          pay(t.cost);
          s.tech[id] = true;
          s.researchedToday = true;
          normalize();
          addLog(`Araştırma: ${t.name}`, "good");
          eveningCard(`${t.name} tamamlandı.`);
        },
      });
    });
    choices.push({ group: "", label: "Günü bitir → Gece", primary: true, run: () => resolveNight() });
    const notes = [];
    if (s.builtToday) notes.push("Bugün zaten bir inşa yapıldı.");
    else if (s.wagons.length >= MAX_WAGONS) notes.push(`Tren en fazla ${MAX_WAGONS} vagon çekebilir.`);
    else if (!Object.keys(WAGONS).some((id) => canAfford(wagonCost(id)))) notes.push("Vagon için hurda yetmiyor — duraklarda keşfe çık.");
    if (s.researchedToday) notes.push("Bugün zaten bir araştırma tamamlandı.");
    showCard({
      kicker: `Gün ${s.day} · Akşam`, title: "Treni geliştir",
      body: (intro ? `<p>${intro}</p>` : "") + `<ul class="report">${preview.join("")}</ul>` + (notes.length ? `<p class="muted">${notes.join(" ")}</p>` : ""),
      layout: "grouped",
      choices,
    });
  }

  function positionCard(type) {
    const w = WAGONS[type];
    const choices = [];
    for (let i = 0; i <= s.wagons.length; i++) {
      const h = heatAt(i);
      choices.push({
        label: i === 0 ? "1. sıra — lokomotife bitişik" : i === s.wagons.length ? `${i + 1}. sıra — en sonda` : `${i + 1}. sıra`,
        hint: `Bu gece ısı: ${heatLabel(h)}` + (i < s.wagons.length ? ` · arkadakiler bir sıra uzaklaşır` : ""),
        heat: h,
        run: () => {
          pay(wagonCost(type));
          s.wagons.splice(i, 0, type);
          s.builtToday = true;
          normalize();
          addLog(`İnşa: ${w.name} (${i + 1}. sıra)`, "good");
          eveningCard(`${w.name} ${i + 1}. sıraya bağlandı.`);
        },
      });
    }
    choices.push({ label: "Vazgeç", run: () => eveningCard() });
    showCard({
      kicker: "İnşa · konum", title: `${w.name} nereye bağlansın?`,
      body: "<p>Lokomotife yakın vagonlar sıcak kalır. Her yeni vagon arkadakileri uzaklaştırır ve kömür tüketimini artırır.</p>",
      layout: "slots",
      choices,
    });
  }

  // —— GECE
  function resolveNight() {
    setPhase("night");
    const L = [];
    const line = (k, v, tone) => L.push(`<li class="${tone || ""}"><b>${k}</b> ${v}</li>`);

    const fp = foodProd();
    const ap = argeProd();
    s.food += fp;
    s.arge += ap;
    line("Sera", `+${fp} yemek`);
    line("Atölye", `+${ap} Ar-Ge`);

    if (s.shift === "ext") {
      s.disc += 6;
      line("Uzatılmış mesai", "hoşnutsuzluk +6", "warn");
      if (chance(0.15)) line("Kaza", `${sicken(1)} yorgun işçi hastalandı`, "bad");
    }
    if (s.shift === "emer") {
      s.disc += 14;
      line("Acil mesai", "hoşnutsuzluk +14", "bad");
      if (chance(0.3)) line("Kaza", `${kill(1)} işçi 24 saatin sonunda kazanın başında yığılıp öldü`, "bad");
    }

    const hc = heatCoal();
    if (s.coal >= hc) {
      s.coal -= hc;
      line("Kazan", `−${hc} kömür · seviye ${effLevel()}${s.overdrive ? " + aşırı yük" : ""}`);
    } else {
      s.coal = 0;
      s.boilerOut = true;
      s.hope -= 8;
      line("Kazan", "KÖMÜR BİTTİ — kazan söndü. Bu gece bütün vagonlar donuyor. Umut −8", "bad");
    }

    const need = foodNeed();
    if (s.food >= need) {
      s.food -= need;
      line("Yemek", `−${need} tüketildi · kalan ${s.food}`);
      if (s.food >= need * 2) s.hope += 1;
    } else {
      const deficit = need - s.food;
      s.food = 0;
      const hl = Math.min(12, Math.ceil(deficit * 0.6));
      const dl = Math.min(14, Math.ceil(deficit * 0.8));
      s.hope -= hl;
      s.disc += dl;
      const hs = sicken(Math.floor(deficit / 4));
      line("Açlık", `${deficit} kişi aç yattı · ${hs} hastalandı · umut −${hl} · hoşnutsuzluk +${dl}`, "bad");
    }

    const risk = (h) => (h <= -2 ? 0.22 : h === -1 ? 0.13 : h === 0 ? 0.06 : h === 1 ? 0.025 : 0.01) * (s.laws.sawdust ? 1.3 : 1);
    const share = s.workers / Math.max(1, s.workers + s.children);
    let remaining = s.workers + s.children;
    let newSick = 0;
    let childCold = false;
    let coldest = 99;
    housingIdx().forEach((i) => {
      const occ = Math.min(10, remaining);
      remaining -= occ;
      const h = heatAt(i);
      coldest = Math.min(coldest, h);
      for (let k = 0; k < Math.round(occ * share); k++) if (chance(risk(h))) newSick++;
      if (h <= 0 && occ > 0 && s.children > 0) childCold = true;
    });
    if (remaining > 0) {
      const h = (coldest === 99 ? tempPenalty(s.temp) : coldest) - 1;
      for (let k = 0; k < Math.round(remaining * share); k++) if (chance(risk(h) + 0.08)) newSick++;
      s.disc += 3;
      line("Kalabalık", `${remaining} kişi koridorlarda uyudu · hoşnutsuzluk +3`, "warn");
    }
    const ns = sicken(newSick);
    line("Soğuk", ns ? `${ns} kişi soğuktan hastalandı` : "Kimse soğuktan hastalanmadı", ns ? "bad" : "good");
    if (childCold && !s.laws.childshelter) {
      s.hope -= 2;
      line("Çocuklar", "soğukta titriyor · umut −2", "warn");
    }

    const cap = healCap();
    const healed = Math.min(cap, s.sick);
    s.sick -= healed;
    s.workers += healed;
    let med = 0;
    while (s.sick > 0 && s.ilac > 0 && med < 3) {
      s.ilac--;
      s.sick--;
      s.workers++;
      med++;
    }
    if (healed || med) line("Revir", `${healed} iyileşti${med ? ` · ${med} ilaç kullanıldı` : ""}`, "good");

    let deaths = 0;
    let crippled = 0;
    const pd = (s.laws.radical ? 0.05 : 0.12) * (charOk("emine", "revir") ? 0.5 : 1);
    for (let k = 0; k < s.sick; k++) {
      if (chance(pd)) deaths++;
      else if (s.laws.radical && chance(0.08)) crippled++;
    }
    if (deaths) {
      s.sick -= deaths;
      s.dead += deaths;
      s.deathsToday += deaths;
      line("Hastalık", `${deaths} hasta öldü`, "bad");
    }
    if (crippled) {
      s.sick -= crippled;
      s.disabled += crippled;
      line("Radikal tedavi", `${crippled} kişi sakat kaldı (çalışamaz)`, "warn");
    }

    const dT = s.deathsToday;
    if (dT > 0) {
      let hl = dT * 4;
      if (s.laws.funeral) {
        hl = Math.ceil(hl / 2);
        s.food = Math.max(0, s.food - dT);
      }
      if (s.laws.snowgrave) {
        hl += dT * 2;
        s.food += dT * 2;
        s.hurda += dT;
      }
      s.hope -= hl;
      s.disc += dT * 2;
      line("Ölüm", `Bugün ${dT} kişi öldü · umut −${hl} · hoşnutsuzluk +${dT * 2}`, "bad");
    }

    const idx = housingIdx();
    const avg = idx.length ? idx.reduce((a, i) => a + heatAt(i), 0) / idx.length : -3;
    if (avg >= 2) {
      s.hope += 2;
      line("Isı", "Yaşam vagonları ılık · umut +2", "good");
    } else if (avg <= -1) {
      s.hope -= 4;
      s.disc += 3;
      line("Isı", "Yaşam vagonları donuyor · umut −4 · hoşnutsuzluk +3", "bad");
    } else if (avg <= 0) {
      s.hope -= 2;
      s.disc += 1;
      line("Isı", "Yaşam vagonları soğuk · umut −2 · hoşnutsuzluk +1", "warn");
    }

    if (s.laws.soup) s.disc += 1;
    if (s.laws.order1 || s.laws.faith2) s.disc -= 3;
    if (s.laws.order2 || s.laws.faith1) s.hope += 2;
    if (s.laws.childshelter) s.hope += 1;
    if (charOk("nermin", "halk")) {
      s.hope += 2;
      s.disc -= 1;
      line("Nermin", "vagonlarda ders ve şarkı · umut +2 · hoşnutsuzluk −1", "good");
    }

    if (s.overdrive && !s.boilerOut) {
      const add = charOk("selim", "kazan") ? 15 : 25;
      s.stress += add;
      line("Kazan stresi", `+${add} → %${Math.min(100, s.stress)}`, s.stress >= 75 ? "bad" : "warn");
    } else {
      s.stress -= 20;
    }

    s.chars.forEach((c) => {
      if (c.status === "injured") {
        c.injured--;
        if (c.injured <= 0) {
          c.status = "ok";
          line(c.name, "iyileşti, göreve döndü", "good");
        }
      }
    });
    if (s.storm > 0) s.storm--;

    normalize();

    s.promises = s.promises.filter((p) => {
      const def = PROMISES[p.id];
      const due = s.day >= p.deadline;
      const ok = def.atDeadline ? (due ? def.check(p) : null) : def.check(p);
      if (ok === true) {
        s.hope += def.win.hope;
        s.disc += def.win.disc;
        line("Söz tutuldu", `${def.text} · umut +${def.win.hope}`, "good");
        addLog(`Söz tutuldu: ${def.text}`, "good");
        return false;
      }
      if (due) {
        s.hope += def.lose.hope;
        s.disc += def.lose.disc;
        s.stats.betrayed++;
        line("Söz bozuldu", `${def.text} · umut ${def.lose.hope}`, "bad");
        addLog(`Söz bozuldu: ${def.text}`, "bad");
        return false;
      }
      return true;
    });
    normalize();

    if (s.stress >= 100) return endGame("explosion");
    if (pop() === 0) return endGame("frozen");

    if (s.ultimatum && s.day >= s.ultimatum.deadline) {
      if (s.hope >= 30 && s.disc <= 70) {
        s.ultimatum = null;
        line("Son şans", "Halk sana bir kez daha güveniyor", "good");
        addLog("Son şans atlatıldı", "good");
      } else {
        return endGame("revolt");
      }
    }
    const mood = checkMood();
    if (mood === "over") return;
    if (mood === "ultimatum") line("SON ŞANS", "Halk sabrını yitirdi. 2 gün içinde Umut ≥ 30, Hoşnutsuzluk ≤ 70 — yoksa sürgün.", "bad");

    addLog(`Gün ${s.day} bitti: ${s.dead} toplam ölü, ${s.sick} hasta`);
    const ev = chance(0.65) ? pickEvent(NIGHT_EVENTS) : null;
    showCard({
      kicker: `Gün ${s.day} · Gece hesabı`, title: "Gece çöküyor",
      body: `<ul class="report">${L.join("")}</ul>`,
      choices: cont(ev ? "Devam — biri kapını çalıyor…" : "Yeni güne geç", () =>
        ev ? runEvent(ev, `Gün ${s.day} · Gece olayı`, endDay) : endDay()
      ),
    });
  }

  function checkMood() {
    if (s.hope <= 0 || s.disc >= 100) {
      if (!s.ultimatumUsed) {
        s.ultimatumUsed = true;
        s.ultimatum = { deadline: s.day + 2 };
        s.hope = Math.max(s.hope, 5);
        s.disc = Math.min(s.disc, 95);
        addLog("SON ŞANS verildi", "bad");
        return "ultimatum";
      }
      if (!s.ultimatum) {
        endGame("revolt");
        return "over";
      }
    }
    return null;
  }

  function checkInstantEnd() {
    if (pop() === 0) {
      endGame("frozen");
      return true;
    }
    if (s.stress >= 100) {
      endGame("explosion");
      return true;
    }
    return checkMood() === "over";
  }

  function endDay() {
    if (checkInstantEnd()) return;
    s.hist.push({ hope: s.hope, disc: s.disc, temp: s.temp });
    s.day++;
    startDay();
  }

  // —— SON
  function endGame(kind) {
    s.over = true;
    s.endKind = kind;
    s.hist.push({ hope: s.hope, disc: s.disc, temp: s.temp });
    setPhase(null);
    const prevBest = bestKm();
    const record = s.km > prevBest;
    if (record) localStorage.setItem(BEST_KEY, String(s.km));
    const T = {
      revolt: ["İsyan", "Bir istasyonda seni trenden indirdiler. Tren sensiz devam etti. Kar dizlerine kadar."],
      explosion: ["Kazan patladı", "Bir kükreme, sonra sessizlik. Lokomotif yarıldı. Vagonlar bir saat içinde soğudu."],
      frozen: ["Tren durdu", "Son ateşçi de kazanın yanında uyudu ve uyanmadı."],
    }[kind];
    const refl = [];
    if (s.laws.childlabor) refl.push("Çocuklar kazan başında büyüdü.");
    if (s.stats.emer) refl.push(`${s.stats.emer} kez insanları 24 saat çalıştırdın.`);
    if (s.laws.snowgrave) refl.push("Ölülerin paltoları yaşayanları ısıttı.");
    if (s.laws.radical) refl.push("Bazıları hayatta kaldı ama eksik kaldı.");
    if (s.stats.detached) refl.push(`${s.stats.detached} vagon rayların üstünde donup kaldı.`);
    if (s.stats.abandoned) refl.push(`${s.stats.abandoned} kez yol kenarında yardım bekleyenleri geçtin.`);
    if (s.stats.betrayed) refl.push(`${s.stats.betrayed} sözünü tutmadın.`);
    if (s.laws.order3) refl.push("Yeni Düzen'i ilan ettin. Kimse artık soru sormuyor.");
    if (s.laws.faith3) refl.push("Yeni İnanç'ı ilan ettin. Herkes sana dua ediyor.");
    const crossed = s.laws.order3 || s.laws.faith3 || s.laws.childlabor || s.stats.emer > 1;
    const lost = s.chars.filter((c) => c.status === "dead").map((c) => c.name);

    showCard({
      kicker: "Oyun bitti",
      title: T[0], tone: "bad",
      body:
        `<p>${T[1]}</p>` +
        `<p class="${record ? "record" : "muted"}">${record ? `Yeni rekor: <b>${s.km} km</b>${prevBest ? ` (önceki ${prevBest} km)` : ""}.` : `En uzun sefer: ${prevBest} km.`}</p>` +
        `<div class="end-stats">
          <div><b>${s.day}</b><span>gün</span></div>
          <div><b>${s.km}</b><span>km</span></div>
          <div><b>${pop()}</b><span>hayatta</span></div>
          <div><b>${s.dead}</b><span>ölü</span></div>
          <div><b>${s.stats.refugees}</b><span>kurtarılan</span></div>
          <div><b>${Object.keys(s.laws).length}</b><span>kanun</span></div>
        </div>` +
        (lost.length ? `<p class="muted">Kaybedilen karakterler: ${lost.join(", ")}</p>` : "") +
        (refl.length ? `<ul class="report">${refl.map((r) => `<li>${r}</li>`).join("")}</ul>` : "<p>Ellerin temiz kaldı.</p>") +
        `<p class="verdict">${crossed ? "Çizgiyi aştın." : "Çizgiyi aşmadın."} <b>Buna değdi mi?</b></p>`,
      choices: cont("Yeni sefer başlat", () => newGame()),
    });
  }

  // ————————————————————————————————— Kanun Kitabı

  function lawStatus(id) {
    const l = LAWS[id];
    if (s.laws[id]) return { state: "signed", text: "İmzalandı" };
    if (l.group && Object.keys(s.laws).some((k) => LAWS[k].group === l.group)) return { state: "locked", text: "Alternatif seçildi" };
    if (l.req && !s.laws[l.req]) return { state: "locked", text: `Önce: ${LAWS[l.req].name}` };
    if ((l.path || l.req) && l.tree !== "Uyum" && s.day < 4) return { state: "locked", text: "4. günden sonra açılır" };
    if (s.day < s.lawReadyDay) return { state: "cooldown", text: `Gün ${s.lawReadyDay}'de` };
    return { state: "ready", text: "İmzala" };
  }

  function renderLaws() {
    const box = $("law-list");
    box.innerHTML = "";
    ["Uyum", "Düzen", "İnanç"].forEach((tree) => {
      const h = document.createElement("h3");
      h.textContent = tree === "Uyum" ? "Uyum" : `${tree} yolu`;
      box.appendChild(h);
      const grid = document.createElement("div");
      grid.className = "law-grid";
      Object.entries(LAWS)
        .filter(([, l]) => l.tree === tree)
        .forEach(([id, l]) => {
          const st = lawStatus(id);
          const once = l.once ? Object.entries(l.once).map(([k, v]) => `${RES_LABEL[k]} ${v > 0 ? "+" : "−"}${Math.abs(v)}`).join(" · ") : "";
          const el = document.createElement("div");
          el.className = `law ${st.state}`;
          el.innerHTML = `<strong>${l.name}</strong><p>${l.desc}</p>${once ? `<small>İmzalarken: ${once}</small>` : ""}`;
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn " + (st.state === "ready" ? "btn-primary" : "btn-ghost");
          btn.textContent = st.text;
          btn.disabled = st.state !== "ready" || s.over;
          btn.addEventListener("click", () => {
            const before = takeSnap();
            s.laws[id] = true;
            s.lawReadyDay = s.day + 2;
            if (l.once) fx(l.once);
            addLog(`Kanun: ${l.name}`, "warn");
            rebalance();
            renderLaws();
            renderAll();
            if (card && s.phase === "morning") morningCard();
            applyFeedback(before, `Kanun: ${l.name}`);
            if (card) card.keepDelta = true;
            flash(`${l.name} imzalandı`);
          });
          el.appendChild(btn);
          grid.appendChild(el);
        });
      box.appendChild(grid);
    });
    $("law-cooldown").textContent =
      s.day >= s.lawReadyDay ? "Bugün bir kanun imzalayabilirsin." : `Sonraki kanun: Gün ${s.lawReadyDay}`;
  }

  function flash(text) {
    const f = $("g-flash");
    f.textContent = text;
    f.classList.add("show");
    clearTimeout(flash.t);
    flash.t = setTimeout(() => f.classList.remove("show"), 2600);
  }

  // ————————————————————————————————— Sahne

  const SKY = {
    morning: ["#2c4a78", "#93b6d8", "#f4c7a2", 0.55],
    day: ["#46678f", "#a9c4de", "#e4eef7", 0.75],
    evening: ["#232955", "#8a5a8f", "#ff9a5a", 0.45],
    night: ["#050a1a", "#0e1b3b", "#1d3260", 0.18],
    storm: ["#55616e", "#8f9ba7", "#c3ccd5", 0.6],
    lose: ["#07090f", "#151b27", "#262f3d", 0.12],
  };

  function rng(seed) {
    let x = seed * 9301 + 49297;
    return () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  }

  function sceneKey() {
    if (s.over) return "lose";
    if (s.storm > 0 && s.phase !== "night") return "storm";
    if (s.phase === "morning") return "morning";
    if (s.phase === "evening") return "evening";
    if (s.phase === "night") return "night";
    return "day";
  }

  function motif(type, dark) {
    const sil = dark ? "#0b1220" : "#2a3646";
    const snow = dark ? "#41536f" : "#eef4fa";
    const glass = dark ? "#2b4a66" : "#9ec3dd";
    const M = {
      town: `<g transform="translate(560 66)">
        <rect x="0" y="22" width="42" height="40" fill="${sil}"/><polygon points="-4,24 21,4 46,24" fill="${sil}"/><polygon points="-4,24 21,4 46,24" fill="none" stroke="${snow}" stroke-width="3"/>
        <rect x="52" y="10" width="34" height="52" fill="${sil}"/><rect x="52" y="8" width="34" height="5" fill="${snow}"/>
        <rect x="96" y="28" width="46" height="34" fill="${sil}"/><polygon points="92,30 119,12 146,30" fill="${sil}"/>
        <rect x="10" y="34" width="8" height="8" fill="#556070"/><rect x="62" y="22" width="7" height="9" fill="#556070"/><rect x="110" y="40" width="8" height="8" fill="#556070"/></g>`,
      mine: `<g transform="translate(560 40)">
        <polygon points="-20,88 60,30 170,88" fill="${sil}" opacity="0.85"/><polygon points="40,44 60,30 82,44" fill="${snow}"/>
        <line x1="70" y1="88" x2="96" y2="8" stroke="${sil}" stroke-width="5"/><line x1="122" y1="88" x2="96" y2="8" stroke="${sil}" stroke-width="5"/>
        <line x1="78" y1="62" x2="116" y2="62" stroke="${sil}" stroke-width="4"/><circle cx="96" cy="12" r="11" fill="none" stroke="${sil}" stroke-width="4"/>
        <rect x="128" y="64" width="26" height="24" fill="#111" /></g>`,
      convoy: `<g transform="translate(560 82)">
        <g transform="rotate(-8 30 20)"><rect x="0" y="6" width="44" height="24" fill="${sil}"/><rect x="44" y="12" width="18" height="18" fill="${sil}"/><rect x="0" y="4" width="44" height="4" fill="${snow}"/></g>
        <g transform="rotate(14 110 20)"><rect x="80" y="6" width="50" height="22" fill="${sil}"/><rect x="130" y="12" width="16" height="16" fill="${sil}"/><rect x="80" y="4" width="50" height="4" fill="${snow}"/></g>
        <circle cx="16" cy="34" r="6" fill="#0d1218"/><circle cx="100" cy="34" r="6" fill="#0d1218"/></g>`,
      depot: `<g transform="translate(548 40)">
        <rect x="70" y="44" width="90" height="44" fill="${sil}"/><rect x="70" y="40" width="90" height="6" fill="${snow}"/>
        <line x1="20" y1="88" x2="20" y2="10" stroke="${sil}" stroke-width="4"/><line x1="44" y1="88" x2="44" y2="10" stroke="${sil}" stroke-width="4"/>
        <rect x="10" y="0" width="44" height="18" fill="${sil}"/><polygon points="6,2 32,-12 58,2" fill="${sil}"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<line x1="${i * 24}" y1="70" x2="${i * 24}" y2="94" stroke="${sil}" stroke-width="3"/>`).join("")}
        <line x1="0" y1="76" x2="190" y2="76" stroke="${sil}" stroke-width="1.5" stroke-dasharray="3 2"/></g>`,
      farm: `<g transform="translate(560 66)">
        <path d="M0 62 A40 40 0 0 1 80 62 Z" fill="${glass}" opacity="0.45" stroke="${sil}" stroke-width="3"/>
        <path d="M20 62 A20 40 0 0 1 60 62 M40 22 V62 M6 44 H74" stroke="${sil}" stroke-width="2" fill="none"/>
        <path d="M90 62 A30 30 0 0 1 150 62 Z" fill="${glass}" opacity="0.35" stroke="${sil}" stroke-width="3"/>
        <path d="M120 32 V62 M96 48 H144" stroke="${sil}" stroke-width="2" fill="none"/><polygon points="96,40 110,36 104,50" fill="#0b1220"/></g>`,
    };
    return M[type] || "";
  }

  function sceneHTML() {
    const key = sceneKey();
    const [c1, c2, c3, light] = SKY[key];
    const dark = key === "night" || key === "lose";
    const r = rng(s.day * 7 + (s.route ? s.route.km || 1 : 3));
    let extra = "";
    if (dark) {
      extra += Array.from({ length: 40 }, () => `<circle cx="${(r() * 800).toFixed(0)}" cy="${(r() * 70).toFixed(0)}" r="${(r() * 1.2 + 0.3).toFixed(1)}" fill="#fff" opacity="${(r() * 0.7 + 0.2).toFixed(2)}"/>`).join("");
      if (key === "night") extra += `<path class="aurora" d="M0 40 C150 10 260 60 400 28 S650 10 800 36 L800 56 C650 30 520 70 400 46 S150 34 0 62Z" fill="url(#aur)" opacity="0.55"/>`;
      extra += `<circle cx="680" cy="30" r="13" fill="#e8eef8" opacity="${key === "lose" ? 0.25 : 0.85}"/>`;
    } else if (key === "morning") {
      extra += `<circle cx="140" cy="94" r="22" fill="#ffd9a8" opacity="0.9"/>`;
    } else if (key === "evening") {
      extra += `<circle cx="660" cy="96" r="26" fill="#ffb066" opacity="0.95"/>`;
    } else if (key === "day") {
      extra += `<circle cx="420" cy="34" r="16" fill="#f4f8fc" opacity="0.55"/>`;
    }
    const far = dark ? "#16233b" : key === "evening" ? "#5b4a72" : "#8fa7c0";
    const near = dark ? "#21324f" : key === "evening" ? "#7d6a8a" : "#c9d8e7";
    const ground = dark ? "#2a3c5a" : key === "evening" ? "#d9c3c3" : "#eef4fa";
    const tree = dark ? "#0a1222" : "#24313f";

    let loc = "";
    if (s.route && s.route.type !== "wait" && ["travel", "stop", "evening"].includes(s.phase) && LOCS[s.route.type]) loc = s.route.type;

    const trees = Array.from({ length: 9 }, (_, i) => {
      const x = (i * 97 + r() * 40) % 800;
      const h = 22 + r() * 22;
      return `<polygon points="${x},118 ${x + h * 0.32},${118 - h} ${x + h * 0.64},118" fill="${tree}"/>`;
    }).join("");

    const cars = [];
    let x = 40;
    s.wagons.forEach((w, i) => {
      const h = heatAt(s.wagons.length - 1 - i);
      cars.push(`<g class="sc-car"><rect x="${x}" y="104" width="54" height="22" rx="3" fill="#2b3b4f"/><rect x="${x}" y="101" width="54" height="4" fill="${ground}"/>
        ${[0, 1, 2].map((k) => `<rect x="${x + 7 + k * 16}" y="110" width="9" height="7" style="fill:var(--win)" class="${heatClass(h)}"/>`).join("")}</g>`);
      x += 58;
    });
    const out = s.boilerOut || s.over;
    cars.push(`<g><rect x="${x}" y="98" width="70" height="28" rx="4" fill="#1b2027"/><rect x="${x + 48}" y="84" width="10" height="16" fill="#1b2027"/>
      <rect x="${x + 10}" y="106" width="22" height="10" rx="2" fill="${out ? "#2a3442" : "#ffae57"}" ${out ? "" : 'class="sc-fire"'}/></g>`);
    const smoke = out ? "" : [0, 1, 2].map((k) => `<circle class="sc-smoke s${k}" cx="${x + 53}" cy="78" r="${6 + k * 3}" fill="#dfe7ef"/>`).join("");
    const wheels = Array.from({ length: Math.floor((x + 70 - 40) / 18) }, (_, k) => `<circle cx="${46 + k * 18}" cy="128" r="3.5" fill="#0d1218"/>`).join("");

    const snowCls = key === "storm" ? "heavy" : s.temp <= -40 ? "mid" : "";
    return `<div class="scene ${key}${s.phase === "travel" ? " moving" : ""}">
      <svg viewBox="0 0 800 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="0.6" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>
          <linearGradient id="aur" x1="0" x2="1"><stop offset="0" stop-color="#3cffb0" stop-opacity="0"/><stop offset="0.4" stop-color="#3cffb0"/><stop offset="0.7" stop-color="#5aa9ff"/><stop offset="1" stop-color="#5aa9ff" stop-opacity="0"/></linearGradient>
        </defs>
        <rect width="800" height="160" fill="url(#sky)"/>
        ${extra}
        <polygon points="0,96 70,58 140,84 220,44 300,80 380,52 470,86 540,50 630,82 720,56 800,78 800,120 0,120" fill="${far}" opacity="${0.5 + light * 0.3}"/>
        <polygon points="0,104 90,84 180,100 290,78 400,98 520,82 640,102 760,86 800,96 800,124 0,124" fill="${near}"/>
        ${trees}
        ${motif(loc, dark)}
        <rect y="122" width="800" height="38" fill="${ground}"/>
        <line x1="0" y1="133" x2="800" y2="133" stroke="${dark ? "#14203a" : "#7d8ea3"}" stroke-width="2"/>
        <g class="sc-train">${cars.join("")}${wheels}${smoke}</g>
      </svg>
      <div class="scene-snow ${snowCls}"></div>
      ${key === "storm" ? '<div class="scene-haze"></div>' : ""}
      <div class="scene-tag">${s.temp}°C${loc ? " · " + LOCS[loc].name : ""}</div>
    </div>`;
  }

  function renderTrend() {
    const el = $("g-trend");
    if (!el) return;
    const pts = s.hist.concat(s.over ? [] : [{ hope: s.hope, disc: s.disc, temp: s.temp }]);
    if (pts.length < 2) {
      el.innerHTML = '<p class="g-signed">Grafik 2. günden itibaren oluşur.</p>';
      return;
    }
    const W = 260, H = 84;
    const px = (i) => 6 + (i / (pts.length - 1)) * (W - 12);
    const py = (v) => H - 6 - (v / 100) * (H - 12);
    const line = (k) => pts.map((p, i) => `${px(i).toFixed(1)},${py(p[k]).toFixed(1)}`).join(" ");
    const tmin = -75;
    const tline = pts.map((p, i) => `${px(i).toFixed(1)},${(6 + (p.temp / tmin) * (H - 12)).toFixed(1)}`).join(" ");
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="trend">
      <line x1="0" y1="${py(30)}" x2="${W}" y2="${py(30)}" class="tr-grid"/>
      <line x1="0" y1="${py(70)}" x2="${W}" y2="${py(70)}" class="tr-grid"/>
      <polyline points="${tline}" class="tr-temp"/>
      <polyline points="${line("disc")}" class="tr-disc"/>
      <polyline points="${line("hope")}" class="tr-hope"/>
    </svg>
    <div class="tr-legend"><span class="h">Umut</span><span class="d">Hoşnutsuzluk</span><span class="t">Soğuk</span></div>`;
  }

  // ————————————————————————————————— Render

  function renderCard() {
    const c = card;
    if (!c) return;
    $("g-scene").innerHTML = sceneHTML();
    $("g-card-kicker").textContent = c.kicker || "";
    $("g-card-title").textContent = c.title || "";
    $("g-card-body").innerHTML = c.body || "";
    if (!c.keepDelta) showResult([]);
    const cardEl = $("g-card");
    cardEl.className = "g-card" + (c.tone ? " tone-" + c.tone : "");
    const box = $("g-choices");
    box.innerHTML = "";
    box.className = "g-choices" + (c.layout ? " layout-" + c.layout : "");
    let lastGroup = null;
    c.choices.forEach((ch) => {
      if (c.layout === "grouped" && ch.group !== lastGroup) {
        lastGroup = ch.group;
        if (ch.group) {
          const h = document.createElement("p");
          h.className = "choice-group";
          h.textContent = ch.group;
          box.appendChild(h);
        }
      }
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice" + (ch.primary ? " primary" : "") + (ch.warn ? " warn" : "") + (ch.heat != null ? " " + heatClass(ch.heat) : "");
      b.disabled = !!ch.disabled || s.over && !ch.primary;
      b.innerHTML = `<span class="c-label">${ch.label}</span>${ch.hint ? `<span class="c-hint">${hintChips(ch.hint, ch.primary)}</span>` : ""}`;
      b.addEventListener("click", () => {
        const before = takeSnap();
        ch.run();
        const title = /Gece hesabı|Keşif sonucu/.test(card && card.kicker ? card.kicker : "")
          ? "Bu adımda ne değişti"
          : "Seçimin sonucu";
        applyFeedback(before, title);
        if (card) card.keepDelta = true;
        updateTeach();
      });
      box.appendChild(b);
    });
    updateTeach();
  }

  function chipTone(t) {
    if (/hoşnutsuzluk\s*\+|stres\s*\+|umut\s*[−-]|ölüm|öl(ü|d)|YETMEZ|kaza|Risk: (Yüksek|Çok yüksek)|küser|hastalan/i.test(t)) return "neg";
    if (/umut\s*\+|hoşnutsuzluk\s*[−-]|^\s*\+|risk yok|iyileş/i.test(t)) return "pos";
    if (/^\s*[−-]\s*\d|~\d+ kömür/.test(t)) return "cost";
    return "";
  }

  function hintChips(hint, plain) {
    if (plain) return hint;
    return hint
      .split(" · ")
      .map((t) => `<em class="chip ${chipTone(t)}">${t}</em>`)
      .join("");
  }

  const ICONS = {
    coal: '<polygon points="5,16 7,8 12,5 17,9 19,16 12,19"/>',
    food: '<path d="M3 11h18a9 7 0 0 1-18 0z"/><path d="M9 3v4M13 3v4"/>',
    hurda: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
    ilac: '<path d="M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5z"/>',
    core: '<circle cx="12" cy="12" r="3.5"/><circle cx="12" cy="12" r="8.5" stroke-dasharray="3 3"/>',
    arge: '<path d="M9 3h6M10 3v6l-5 10h14l-5-10V3"/>',
  };
  const icon = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;

  const TODO = {
    morning: "Sabah: istersen soldan kazanı, görevleri ve karakterleri ayarla. Kanun Kitabı yanıyorsa bir kanun imzala. Sonra mesai türünü seç.",
    route: "Rota: kömür maliyetine, riske ve ne bulacağına bakıp bugünkü hedefi seç.",
    travel: "Seyahat: tren yolda. Bir olay çıkarsa kararını ver.",
    stop: "Durak: keşfe kaç kişi göndereceğini seç. Kalabalık ekip daha çok bulur ama daha çok kişi tehlikeye girer.",
    evening: "Akşam: günde bir vagon inşa edip bir araştırma yapabilirsin. Gece tahminine bak, sonra 'Günü bitir'.",
    night: "Gece: raporu oku. Kapına biri gelirse kararını ver.",
  };

  function bar(id, val, invert) {
    const el = $(id);
    el.querySelector("i").style.width = val + "%";
    el.querySelector("b").textContent = val;
    const danger = invert ? val >= 70 : val <= 30;
    el.classList.toggle("danger", danger);
  }

  function renderHUD() {
    $("g-day").textContent = s.over ? "Son" : `Gün ${s.day}`;
    $("g-phase").textContent = (PHASES.find((p) => p[0] === s.phase) || ["", s.over ? "Sefer bitti" : ""])[1];
    $("g-temp").textContent = `${s.temp}°C`;
    $("g-temp-ring").className = "g-temp-ring " + (s.temp <= -50 ? "cold3" : s.temp <= -35 ? "cold2" : "cold1");
    const segEnd = nextMilestone();
    const segStart = segEnd - MILESTONE_KM;
    $("g-km-label").textContent = `Kilometre taşı ${segEnd} km`;
    $("g-km-fill").style.width = ((s.km - segStart) / MILESTONE_KM) * 100 + "%";
    const best = bestKm();
    $("g-km-text").textContent = `${s.km} km${best ? ` · rekor ${best} km` : ""}`;
    const storm = $("g-km-storm");
    const stormIn = !s.storm && s.nextStorm < segEnd;
    storm.style.display = stormIn ? "" : "none";
    if (stormIn) storm.style.left = ((s.nextStorm - segStart) / MILESTONE_KM) * 100 + "%";
    bar("g-hope", s.hope, false);
    bar("g-disc", s.disc, true);
    const res = [
      ["coal", "Kömür", `${s.coal}/${coalCap()}`, s.coal < heatCoal() + 6, "Kazanı ve yolculuğu besler. Biterse kazan söner."],
      ["food", "Yemek", s.food, s.food < foodNeed(), `Günde ${foodNeed()} tüketilir. Sera üretir.`],
      ["hurda", "Hurda", s.hurda, false, "Vagon inşası ve araştırma için."],
      ["ilac", "İlaç", s.ilac, false, "Gece hastaları iyileştirir."],
      ["core", "Çekirdek", s.core, false, "Buhar çekirdeği: kazanı 4. seviyeye çıkaran teknoloji için."],
      ["arge", "Ar-Ge", s.arge, false, "Atölye üretir. Araştırma için harcanır."],
    ];
    $("g-res").innerHTML = res
      .map(([ic, k, v, bad, tip]) => `<div class="res res-${ic}${bad ? " bad" : ""}" title="${k}: ${tip}">${icon(ic)}<b>${v}</b><span>${k}</span></div>`)
      .join("");
    $("g-todo").textContent = s.over ? "Sefer bitti. Yeni bir sefer başlatabilirsin." : TODO[s.phase] || "";
    $("btn-laws").classList.toggle("ready", !s.over && s.day >= s.lawReadyDay);
    document.querySelectorAll(".g-step").forEach((el) => {
      const idx = PHASES.findIndex((p) => p[0] === el.dataset.phase);
      const cur = PHASES.findIndex((p) => p[0] === s.phase);
      el.classList.toggle("active", idx === cur);
      el.classList.toggle("done", cur > idx);
    });
  }

  function renderTrain() {
    const lvl = effLevel();
    const box = $("g-train");
    const loco = `<div class="loco">
      <div class="loco-head"><strong>Lokomotif · Kazan</strong><span>${s.boilerOut ? "SÖNDÜ" : "Seviye " + lvl + (s.overdrive ? " +1" : "")}</span></div>
      <div class="boiler-ctl">
        <button type="button" class="mini" data-act="boiler-" ${s.over ? "disabled" : ""}>−</button>
        <div class="levels">${Array.from({ length: maxBoiler() + 1 }, (_, i) => `<i class="${i <= s.boiler && i > 0 ? "on" : ""}${i > 0 && i > lvl && i <= s.boiler ? " short" : ""}"></i>`).join("")}</div>
        <button type="button" class="mini" data-act="boiler+" ${s.over ? "disabled" : ""}>+</button>
        <button type="button" class="mini od${s.overdrive ? " on" : ""}" data-act="overdrive" ${s.over ? "disabled" : ""}>Aşırı yük</button>
      </div>
      <div class="stress"><span>Stres %${s.stress}</span><div class="sbar"><i style="width:${s.stress}%"></i></div></div>
      <p class="loco-note">Ateşçi: ${crew()} / ${s.boiler * 2} gerekli · bu gece ~${heatCoal()} kömür</p>
    </div>`;
    const detach =
      s.wagons.length > 1 && !s.over
        ? `<button type="button" class="btn btn-ghost small" data-act="detach" title="Kömür tasarrufu sağlar ama içindekiler sıkışır, umut düşer">Son vagonu ayır</button>`
        : "";
    box.innerHTML = loco + detach;
    renderTrainline();
  }

  function renderTrainline() {
    const cars = s.wagons
      .map((w, i) => {
        const h = heatAt(i);
        const wins = `<span></span><span></span><span></span>`;
        return `<div class="car ${heatClass(h)} car-${w}" title="${i + 1}. sıra · ${WAGONS[w].name} · ${heatLabel(h)}">
          <div class="car-body">${wins}</div>
          <div class="car-label"><b>${WAGONS[w].short}</b><small class="${heatClass(h)}-t">${heatLabel(h)}</small></div>
        </div>`;
      })
      .reverse()
      .join("");
    const lvl = effLevel();
    const loco = `<div class="car loco-car${s.boilerOut ? " out" : ""}${s.overdrive ? " od" : ""}" title="Lokomotif · kazan seviyesi ${lvl}">
      <div class="car-body"><span class="firebox"></span><span class="chimney"></span></div>
      <div class="car-label"><b>LOKOMOTİF</b><small>${s.boilerOut ? "Söndü" : "Seviye " + lvl + (s.overdrive ? " +1" : "")}</small></div>
    </div>`;
    $("g-trainline").innerHTML = `<span class="tl-dir back">Arka</span><div class="tl-cars">${cars}${loco}</div><span class="tl-dir front">Kuzey →</span>`;
  }

  function renderJobs() {
    const box = $("g-jobs");
    const free = labor() - assigned();
    box.innerHTML =
      `<p class="jobs-free">Boşta: <b>${free}</b> · İşçi ${s.workers}${s.laws.childlabor ? ` + çocuk ${s.children}` : ""}</p>` +
      Object.entries(JOBS)
        .map(
          ([id, j]) => `<div class="job">
          <div><strong>${j.name}</strong><small>${j.desc}</small></div>
          <div class="job-ctl">
            <button type="button" class="mini" data-job="${id}" data-d="-1" ${s.jobs[id] <= 0 || s.over ? "disabled" : ""}>−</button>
            <b>${s.jobs[id]}<small>/${capOf(id)}</small></b>
            <button type="button" class="mini" data-job="${id}" data-d="1" ${free <= 0 || s.jobs[id] >= capOf(id) || s.over ? "disabled" : ""}>+</button>
          </div>
        </div>`
        )
        .join("");
  }

  function renderChars() {
    const box = $("g-chars");
    const opts = [["kazan", "Kazan"], ["sera", "Sera"], ["atolye", "Atölye"], ["revir", "Revir"], ["kesif", "Keşif"], ["halk", "Halk"]];
    box.innerHTML = s.chars
      .map(
        (c) => `<div class="char ${c.status}">
        <div class="char-head"><strong>${c.name}</strong><span>${c.role}</span><em>${c.status === "ok" ? "Sağlam" : c.status === "injured" ? `Yaralı (${c.injured})` : "Öldü"}</em></div>
        <p>${c.perk}</p>
        ${
          c.status === "dead"
            ? ""
            : `<div class="char-jobs">${opts
                .map(([v, l]) => `<button type="button" class="pill${c.job === v ? " on" : ""}" data-char="${c.id}" data-cjob="${v}" ${s.over ? "disabled" : ""}>${l}</button>`)
                .join("")}</div>`
        }
      </div>`
      )
      .join("");
  }

  function renderSide() {
    $("g-pop").innerHTML = `
      <div><b>${pop()}</b><span>Nüfus</span></div>
      <div><b>${s.workers}</b><span>İşçi</span></div>
      <div><b>${s.children}</b><span>Çocuk</span></div>
      <div class="${s.sick ? "bad" : ""}"><b>${s.sick}</b><span>Hasta</span></div>
      <div><b>${s.disabled}</b><span>Sakat</span></div>
      <div class="${s.dead ? "bad" : ""}"><b>${s.dead}</b><span>Ölü</span></div>`;
    const pr = $("g-promises");
    const items = s.promises.map((p) => `<li>${PROMISES[p.id].text}<small>Son gün: ${p.deadline}</small></li>`);
    if (s.ultimatum) items.unshift(`<li class="bad">SON ŞANS: Umut ≥ 30, Hoşnutsuzluk ≤ 70<small>Son gün: ${s.ultimatum.deadline}</small></li>`);
    pr.innerHTML = items.length ? items.join("") : '<li class="muted">Aktif söz yok.</li>';
    const laws = Object.keys(s.laws).map((k) => LAWS[k].name);
    $("g-signed").textContent = laws.length ? laws.join(" · ") : "Henüz kanun yok.";
    $("g-log").innerHTML = s.log.map((l) => `<li class="${l.tone}"><span>G${l.day}</span>${l.text}</li>`).join("");
  }

  function renderAll() {
    renderHUD();
    renderTrain();
    renderJobs();
    renderChars();
    renderSide();
    renderTrend();
    updateTeach();
  }

  // ————————————————————————————————— Kontroller

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-act],[data-job],[data-cjob]");
    if (!t || !s || s.over || !t.closest(".view-play")) return;
    if (t.dataset.act === "boiler-") s.boiler = Math.max(0, s.boiler - 1);
    if (t.dataset.act === "boiler+") s.boiler = Math.min(maxBoiler(), s.boiler + 1);
    if (t.dataset.act === "overdrive") {
      s.overdrive = !s.overdrive;
      addLog(s.overdrive ? "Aşırı yük AÇILDI" : "Aşırı yük kapandı", s.overdrive ? "warn" : "");
    }
    if (s.boiler === 0) s.overdrive = false;
    if (t.dataset.act === "detach") {
      const w = s.wagons[s.wagons.length - 1];
      if (!confirm(`${WAGONS[w].name} ayrılsın mı? Geri alınamaz.`)) return;
      const before = takeSnap();
      s.wagons.pop();
      s.stats.detached++;
      fx({ hope: w === "housing" ? -6 : -3 });
      addLog(`${WAGONS[w].name} ayrıldı`, "bad");
      applyFeedback(before, `${WAGONS[w].name} ayrıldı`);
      flash(`${WAGONS[w].name} geride bırakıldı`);
    }
    if (t.dataset.job) {
      s.plan[t.dataset.job] = s.jobs[t.dataset.job] + Number(t.dataset.d);
    }
    if (t.dataset.cjob) {
      charById(t.dataset.char).job = t.dataset.cjob;
    }
    normalize();
    renderAll();
    if (s.phase === "evening" && card && card.layout === "grouped") eveningCard();
  });

  $("btn-laws").addEventListener("click", () => {
    renderLaws();
    $("law-dialog").showModal();
  });
  $("law-close").addEventListener("click", () => $("law-dialog").close());
  $("btn-newgame").addEventListener("click", () => {
    if (s && !s.over && !confirm("Mevcut sefer silinsin mi?")) return;
    newGame();
  });

  function newGame() {
    s = newState();
    lastDelta = [];
    showResult([]);
    addLog("Sefer başladı. Durmak yok.", "good");
    startDay();
  }

  const btnPanels = $("btn-panels-open");
  if (btnPanels) {
    btnPanels.addEventListener("click", () => {
      panelsForced = true;
      localStorage.setItem("frostline-panels", "1");
      updateTeach();
    });
  }

  newGame();
})();
