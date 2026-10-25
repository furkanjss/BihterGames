(function () {
  "use strict";

  const F = window.FROSTLINE_FLOW;
  const EXPORT = /[?&]export\b/.test(location.search);
  const COLW = 340;
  const ROWH = 165;
  const X0 = 1010;
  const Y0 = 190;
  const SIZE = {
    start: [300, 80],
    end: [300, 80],
    bad: [300, 80],
    "bad-soft": [290, 92],
    good: [280, 82],
    process: [280, 82],
    event: [290, 92],
    decision: [290, 128],
    note: [300, 120],
  };
  const GUTTER_X = X0 - 2 * COLW - 200;
  const LOOP_X = X0 - 2 * COLW - 260;

  const PHASE_LABEL = {
    morning: "Sabah",
    route: "Rota",
    travel: "Seyahat",
    stop: "Durak",
    evening: "Akşam",
    night: "Gece",
  };
  const TYPE_LABEL = {
    start: "Başlangıç",
    end: "Final",
    bad: "Oyun sonu",
    "bad-soft": "Bedel",
    good: "Ödül",
    process: "Süreç",
    event: "Sonuç / olay",
    decision: "Karar",
    note: "Ayrıntı",
  };

  const nodes = F.nodes.map((n) => {
    const [w, h] = SIZE[n.type];
    return { ...n, x: X0 + n.col * COLW, y: Y0 + n.row * ROWH, w, h };
  });
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const WORLD_W = X0 + 2 * COLW + 230;
  const WORLD_H = Math.max(...nodes.map((n) => n.y + n.h / 2)) + 110;

  const els = {
    viewport: document.getElementById("flow-viewport"),
    world: document.getElementById("flow-world"),
    edges: document.getElementById("flow-edges"),
    nodes: document.getElementById("flow-nodes"),
    kicker: document.getElementById("fd-kicker"),
    title: document.getElementById("fd-title"),
    body: document.getElementById("fd-body"),
    bullets: document.getElementById("fd-bullets"),
    live: document.getElementById("fd-live"),
    zoom: document.getElementById("flow-zoom"),
  };

  const cam = { x: 0, y: 20, s: 1 };
  let selected = null;
  let livePhase = null;
  let drag = null;

  const top = (n) => ({ x: n.x, y: n.y - n.h / 2 });
  const bottom = (n) => ({ x: n.x, y: n.y + n.h / 2 });
  const left = (n) => ({ x: n.x - n.w / 2, y: n.y });
  const right = (n) => ({ x: n.x + n.w / 2, y: n.y });

  function routePoints(e) {
    const a = byId[e.from];
    const b = byId[e.to];
    const kind = e.route || "auto";
    if (kind === "note") return b.x > a.x ? [right(a), left(b)] : [left(a), right(b)];
    if (kind === "loop") {
      const p0 = left(a);
      const p3 = left(b);
      return [p0, { x: LOOP_X, y: p0.y }, { x: LOOP_X, y: p3.y }, p3];
    }
    if (kind === "loop2") {
      const p0 = bottom(a);
      const y = p0.y + 34;
      const p3 = left(b);
      return [p0, { x: a.x, y }, { x: LOOP_X, y }, { x: LOOP_X, y: p3.y }, p3];
    }
    if (kind === "gutter") {
      const p0 = left(a);
      const p3 = left(b);
      return [p0, { x: GUTTER_X, y: p0.y }, { x: GUTTER_X, y: p3.y }, p3];
    }
    if (kind === "merge") {
      const p0 = bottom(a);
      const p3 = top(b);
      const joinY = p3.y - 22;
      return [p0, { x: a.x, y: joinY }, { x: b.x, y: joinY }, p3];
    }
    if (a.col === b.col) return [bottom(a), top(b)];
    const p0 = b.x > a.x ? right(a) : left(a);
    return [p0, { x: b.x, y: p0.y }, top(b)];
  }

  function labelPos(pts) {
    const [p0, p1] = pts;
    if (p0.y === p1.y) {
      const dir = p1.x > p0.x ? 1 : -1;
      return { x: p0.x + dir * 14, y: p0.y - 9, anchor: dir > 0 ? "start" : "end" };
    }
    return { x: p0.x + 10, y: p0.y + 20, anchor: "start" };
  }

  const bandY = (b) => [Y0 + b.from * ROWH - ROWH / 2 + 4, Y0 + b.to * ROWH + ROWH / 2 - 4];

  function renderEdges() {
    const svgNS = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const el = document.createElementNS(svgNS, tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      if (text != null) el.textContent = text;
      els.edges.appendChild(el);
      return el;
    };
    els.edges.setAttribute("width", WORLD_W);
    els.edges.setAttribute("height", WORLD_H);
    els.edges.setAttribute("viewBox", `0 0 ${WORLD_W} ${WORLD_H}`);
    els.edges.innerHTML =
      '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>';

    mk("text", { x: LOOP_X - 30, y: 70, class: "ftitle" }, "FROSTLINE · BİR OYUN GÜNÜ");
    mk(
      "text",
      { x: LOOP_X - 30, y: 104, class: "fsubtitle" },
      "Hareket eden şehir · Frostpunk tarzı hayatta kalma döngüsü · yol hiç bitmez · her gün daha soğuk"
    );
    const legend = [
      ["start", "Başlangıç"],
      ["process", "Süreç"],
      ["decision", "Karar"],
      ["event", "Sonuç / olay"],
      ["bad-soft", "Bedel"],
      ["good", "Ödül"],
      ["bad", "Oyun sonu"],
      ["note", "Ayrıntı"],
    ];
    legend.forEach(([t, l], i) => {
      const x = WORLD_W - 30 - (legend.length - i) * 128;
      mk("rect", { x, y: 58, width: 22, height: 14, rx: t === "start" || t === "bad" ? 7 : 2, class: "flg flg-" + t, transform: t === "decision" ? `rotate(45 ${x + 11} 65)` : "" });
      mk("text", { x: x + 30, y: 70, class: "flg-text" }, l);
    });

    F.bands.forEach((b, i) => {
      const [y1, y2] = bandY(b);
      mk("rect", {
        x: LOOP_X - 40, y: y1, width: WORLD_W - LOOP_X + 20, height: y2 - y1, rx: 14,
        class: `fband fband-${b.phase}${livePhase === b.phase ? " live" : ""}`,
      });
      const lx = WORLD_W - 52;
      const ly = (y1 + y2) / 2;
      mk("text", { x: lx, y: ly, "text-anchor": "middle", transform: `rotate(90 ${lx} ${ly})`, class: `fband-label fband-label-${b.phase}` }, b.label);
    });

    F.edges.forEach((e) => {
      const pts = routePoints(e);
      const isNote = e.route === "note";
      const path = mk("polyline", {
        points: pts.map((p) => `${p.x},${p.y}`).join(" "),
        class: "fedge" + (e.route === "loop" || e.route === "loop2" ? " loop" : "") + (isNote ? " note" : ""),
      });
      if (!isNote) path.setAttribute("marker-end", "url(#arrow)");
      const hot = selected && (e.from === selected || e.to === selected);
      if (hot) path.classList.add("hot");

      if (e.label) {
        const lp = labelPos(pts);
        mk("text", { x: lp.x, y: lp.y, "text-anchor": lp.anchor, class: "flabel" + (hot ? " hot" : "") }, e.label);
      }
    });

    const my = (byId["f-morning"].y + byId["f-storm"].y) / 2;
    mk(
      "text",
      { x: LOOP_X - 12, y: my, class: "floop-label", transform: `rotate(-90 ${LOOP_X - 12} ${my})`, "text-anchor": "middle" },
      "GÜNLÜK DÖNGÜ · her gün tekrar eder, her gün daha soğuk"
    );
  }

  function renderNodes() {
    els.nodes.innerHTML = "";
    nodes.forEach((n) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "fnode " + n.type;
      if (n.id === selected) el.classList.add("selected");
      if (livePhase && n.phase === livePhase) el.classList.add("live");
      el.style.left = n.x - n.w / 2 + "px";
      el.style.top = n.y - n.h / 2 + "px";
      el.style.width = n.w + "px";
      el.style.height = n.h + "px";
      const shape =
        n.type === "decision"
          ? '<svg class="fshape" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="50,1.5 98.5,50 50,98.5 1.5,50"/></svg>'
          : "";
      el.innerHTML = `${shape}<span class="ftext">${n.label}</span>`;
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        select(n.id);
      });
      els.nodes.appendChild(el);
    });
  }

  function select(id) {
    selected = id;
    const n = byId[id];
    els.kicker.textContent = TYPE_LABEL[n.type] + (n.phase ? " · " + PHASE_LABEL[n.phase] + " aşaması" : "");
    els.title.textContent = n.label;
    els.body.textContent = n.detail || "";
    els.bullets.innerHTML = "";
    (n.bullets || []).forEach((b) => {
      const li = document.createElement("li");
      li.textContent = b;
      els.bullets.appendChild(li);
    });
    renderNodes();
    renderEdges();
  }

  function apply() {
    els.world.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})`;
    els.zoom.textContent = Math.round(cam.s * 100) + "%";
  }

  let fitted = false;

  function fitWidth() {
    const vw = els.viewport.clientWidth;
    if (!vw) return;
    fitted = true;
    cam.s = Math.min(1, Math.max(0.3, (vw - 40) / WORLD_W));
    cam.x = (vw - WORLD_W * cam.s) / 2;
    cam.y = 20;
    apply();
  }

  function zoomAt(factor, mx, my) {
    const bx = (mx - cam.x) / cam.s;
    const by = (my - cam.y) / cam.s;
    cam.s = Math.min(2, Math.max(0.2, cam.s * factor));
    cam.x = mx - bx * cam.s;
    cam.y = my - by * cam.s;
    apply();
  }

  function focus(id) {
    const n = byId[id];
    if (!n) return;
    const vw = els.viewport.clientWidth;
    const vh = els.viewport.clientHeight;
    cam.x = vw / 2 - n.x * cam.s;
    cam.y = vh / 2 - n.y * cam.s;
    apply();
  }

  els.viewport.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      if (e.ctrlKey) {
        const r = els.viewport.getBoundingClientRect();
        zoomAt(e.deltaY > 0 ? 0.9 : 1.1, e.clientX - r.left, e.clientY - r.top);
      } else {
        cam.y -= e.deltaY;
        cam.x -= e.deltaX;
        apply();
      }
    },
    { passive: false }
  );

  els.viewport.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".fnode")) return;
    drag = { px: e.clientX, py: e.clientY, cx: cam.x, cy: cam.y, id: e.pointerId };
    els.viewport.setPointerCapture(e.pointerId);
    els.viewport.classList.add("dragging");
  });
  els.viewport.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    cam.x = drag.cx + (e.clientX - drag.px);
    cam.y = drag.cy + (e.clientY - drag.py);
    apply();
  });
  const endDrag = (e) => {
    if (drag && drag.id === e.pointerId) {
      drag = null;
      els.viewport.classList.remove("dragging");
    }
  };
  els.viewport.addEventListener("pointerup", endDrag);
  els.viewport.addEventListener("pointercancel", endDrag);

  document.getElementById("btn-fit").addEventListener("click", fitWidth);
  document.getElementById("btn-zoom-in").addEventListener("click", () =>
    zoomAt(1.15, els.viewport.clientWidth / 2, els.viewport.clientHeight / 2)
  );
  document.getElementById("btn-zoom-out").addEventListener("click", () =>
    zoomAt(1 / 1.15, els.viewport.clientWidth / 2, els.viewport.clientHeight / 2)
  );

  els.world.style.width = WORLD_W + "px";
  els.world.style.height = WORLD_H + "px";
  renderEdges();
  renderNodes();
  select("f-start");

  if (EXPORT) {
    document.documentElement.classList.add("export");
    selected = null;
    els.viewport.style.width = WORLD_W + "px";
    els.viewport.style.height = WORLD_H + "px";
    cam.x = 0;
    cam.y = 0;
    cam.s = 1;
    renderEdges();
    renderNodes();
    apply();
  }

  window.FlowView = {
    fit() {
      if (!EXPORT) fitWidth();
    },
    size: { w: WORLD_W, h: WORLD_H },
    setLive(phase, info) {
      if (EXPORT) return;
      livePhase = phase;
      els.live.textContent = phase
        ? `Oyunda şu an: ${info} — turuncu yanan düğümler bu aşama.`
        : "Oyna sekmesinde bir sefer başlatınca, bulunduğun aşama burada yanar.";
      renderNodes();
      renderEdges();
    },
    focusLive() {
      if (!fitted) fitWidth();
      const n = nodes.find((x) => x.phase === livePhase);
      if (n) focus(n.id);
    },
  };
})();
