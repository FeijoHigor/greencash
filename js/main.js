/* GreenCash · Landing page v1 */
(() => {
  "use strict";
  document.documentElement.classList.remove("no-js");

  const SVGNS = "http://www.w3.org/2000/svg";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // PRNG determinístico: a ilustração sai igual a cada carregamento
  const rng = (seed) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const el = (tag, attrs) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  /* ---------- QR Code decorativo ---------- */
  function drawQR(target, size, seed) {
    if (!target) return;
    const N = 21, m = size / N, r = rng(seed);
    const frag = document.createDocumentFragment();
    const isFinder = (x, y) =>
      (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (isFinder(x, y)) continue;
        if (r() > 0.52) {
          frag.appendChild(el("rect", { x: x * m, y: y * m, width: m + 0.2, height: m + 0.2, fill: "#13200f" }));
        }
      }
    }
    [[0, 0], [N - 7, 0], [0, N - 7]].forEach(([fx, fy]) => {
      frag.appendChild(el("rect", { x: fx * m, y: fy * m, width: 7 * m, height: 7 * m, fill: "#13200f", rx: m * 1.2 }));
      frag.appendChild(el("rect", { x: (fx + 1) * m, y: (fy + 1) * m, width: 5 * m, height: 5 * m, fill: "#fbfaf4", rx: m * 0.8 }));
      frag.appendChild(el("rect", { x: (fx + 2) * m, y: (fy + 2) * m, width: 3 * m, height: 3 * m, fill: "#2d5a1f", rx: m * 0.6 }));
    });
    target.appendChild(frag);
  }
  drawQR(document.getElementById("qr"), 114, 7);
  drawQR(document.getElementById("qr2"), 110, 42);

  /* ---------- Musgo ---------- */
  const MOSS = ["#1d4a17", "#2d6a1f", "#3f8a2a", "#4caf2f", "#5fb937", "#7fd14a", "#a8e27c"];
  const FLOWERS = ["#f2c6d6", "#fbfaf4", "#f7e08a"];

  function mossCluster(g, r, count, pos, sizeMin, sizeMax) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const [x, y] = pos(r);
      const s = sizeMin + r() * (sizeMax - sizeMin);
      // tons mais escuros embaixo, mais claros em cima
      const c = MOSS[Math.min(MOSS.length - 1, Math.floor(r() * MOSS.length * 0.8 + (i / count) * 2))];
      frag.appendChild(el("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: s.toFixed(1), fill: c }));
    }
    for (let i = 0; i < count / 14; i++) {
      const [x, y] = pos(r);
      frag.appendChild(el("circle", { cx: x.toFixed(1), cy: (y - 4).toFixed(1), r: (1.5 + r() * 2).toFixed(1), fill: FLOWERS[Math.floor(r() * FLOWERS.length)] }));
    }
    g.appendChild(frag);
  }

  const moss = document.getElementById("moss");
  if (moss) {
    const r = rng(11);
    // faixa ao longo da base da sacola, mais alta nos cantos
    mossCluster(moss, r, 300, (r) => {
      const t = r();
      const x = 112 + t * 370;
      const corner = Math.max(0, 1 - Math.min(Math.abs(t - 0.05), Math.abs(t - 0.95)) * 5);
      const y = 506 - r() * (22 + corner * 70) + r() * 10;
      return [x, y];
    }, 4, 12);
    // subida pela lateral esquerda
    mossCluster(moss, r, 90, (r) => {
      const t = r();
      return [128 + t * 22 - r() * 18 + 10, 300 + t * 200 + r() * 20];
    }, 3, 9);
  }

  /* ---------- Menu mobile ---------- */
  const toggle = document.querySelector(".nav__toggle");
  const menu = document.getElementById("menu");
  if (toggle && menu) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }

  /* ---------- Reveal ao rolar ---------- */
  const revealEls = document.querySelectorAll(".reveal, .manifesto__vine");
  // atraso escalonado entre irmãos
  document.querySelectorAll(".steps__list, .bento, .faq__list, .hero__copy, .problem__stats, .uses__grid, .chain__points, .scale__list").forEach((group) => {
    [...group.children].forEach((c, i) => c.style.setProperty("--d", `${i * 0.09}s`));
  });
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach((n) => io.observe(n));
  } else {
    revealEls.forEach((n) => n.classList.add("is-in"));
  }

  /* ---------- Demonstração: o descarte precisa bater com a compra ---------- */
  const scanBtn = document.querySelector("[data-scan]");
  if (scanBtn) {
    const ledger = document.querySelector("[data-ledger]");
    const scanner = document.querySelector(".scanner");
    const msg = document.querySelector("[data-scan-msg]");
    const status = document.querySelector("[data-status]");
    const total = document.querySelector("[data-total]");
    const original = ledger.innerHTML;
    const initial = { status: status.textContent, msg: msg.textContent, btn: scanBtn.textContent };

    // resultado da triagem (dados do pitch): descartado por item e status
    const triage = [
      { id: "pet", disc: 2, cls: "is-ok", label: "✓ Confere" },
      { id: "pote", disc: 1, cls: "is-partial", label: "◐ Parcial" },
      { id: "lata", disc: 0, cls: "is-pending", label: "Pendente" },
    ];
    const wait = (ms) => new Promise((res) => setTimeout(res, reduceMotion ? 0 : ms));
    let done = false;

    scanBtn.addEventListener("click", async () => {
      if (done) {
        ledger.innerHTML = original;
        total.hidden = true;
        status.textContent = initial.status;
        msg.textContent = initial.msg;
        scanBtn.textContent = initial.btn;
        done = false;
        return;
      }
      scanBtn.disabled = true;
      scanner.classList.add("is-scanning");
      msg.textContent = "Cooperativa lendo o QR Code da sacola #GC-20931…";
      await wait(1200);
      scanner.classList.remove("is-scanning");
      msg.textContent = "Conferindo cada embalagem pelo código de barras e cruzando com a sua nota…";

      for (const t of triage) {
        const row = ledger.querySelector(`[data-item="${t.id}"]`);
        row.classList.add("is-checking");
        await wait(650);
        row.classList.remove("is-checking");
        row.classList.add(t.cls);
        row.querySelector("[data-disc]").textContent = t.disc;
        row.querySelector(".block__state").textContent = t.label;
      }

      await wait(450);
      const extra = document.createElement("div");
      extra.className = "block is-invalid is-new";
      extra.setAttribute("role", "row");
      extra.innerHTML =
        '<span class="block__name" role="cell">PET sem nota no CPF</span>' +
        '<span class="block__num" role="cell" data-label="Comprado">0</span>' +
        '<span class="block__num" role="cell" data-label="Descartado">1</span>' +
        '<span class="block__state" role="cell">✕ Não conta</span>';
      ledger.appendChild(extra);

      await wait(450);
      status.textContent = "Triagem concluída · 3 de 5 comprovadas";
      msg.textContent = "Pronto! Só conta o que saiu na sua nota, e cada embalagem gera crédito uma única vez.";
      total.hidden = false;
      scanBtn.disabled = false;
      scanBtn.textContent = "Recomeçar";
      done = true;
    });
  }

  /* ---------- Simulador ---------- */
  const range = document.getElementById("qtd");
  if (range) {
    const out = document.getElementById("qtdOut");
    const money = document.getElementById("simMoney");
    const items = document.getElementById("simItems");
    const fill = document.getElementById("simFill");
    const PER_ITEM = 0.04; // valor ilustrativo
    const update = () => {
      const v = +range.value;
      const pct = ((v - range.min) / (range.max - range.min)) * 100;
      out.textContent = v;
      range.style.setProperty("--p", pct + "%");
      money.textContent = (v * 12 * PER_ITEM).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      items.textContent = (v * 12).toLocaleString("pt-BR");
      fill.style.height = 10 + pct * 0.9 + "%";
    };
    range.addEventListener("input", update);
    update();
  }

  /* ---------- Formulário (sem backend nesta versão) ---------- */
  const form = document.querySelector("[data-form]");
  if (form) {
    const msg = document.querySelector("[data-form-msg]");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input[type=email]");
      if (!input.checkValidity() || !input.value.trim()) {
        msg.textContent = "Digite um e-mail válido.";
        msg.classList.add("is-error");
        input.focus();
        return;
      }
      msg.classList.remove("is-error");
      msg.textContent = "Obrigado! Avisaremos você assim que o GreenCash chegar perto de você. 🌱";
      form.reset();
    });
  }

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
