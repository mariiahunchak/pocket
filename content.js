(() => {
  if (window.__TSO_GCLASS_V6__) return;
  window.__TSO_GCLASS_V6__ = true;

  const KEY = "tso_gclass_v6_data";
  const SET = "tso_gclass_v6_settings";
  const POS = "tso_gclass_v6_pos";

  const seed = {
    "EUR/GBP OTC": { win: 33, loss: 2, trades: [] },
    "AED/CNY OTC": { win: 89, loss: 3, trades: [] },
    "GBP/USD OTC": { win: 24, loss: 8, trades: [] },
    "EUR/USD": { win: 0, loss: 0, trades: [] }
  };

  let data = {};
  let settings = { auto: true };
  let current = "EUR/GBP OTC";
  let lastDetected = "—";
  let manualUntil = 0;
  let timer = null;
  let drag = null;

  const panel = document.createElement("div");
  panel.id = "tso5";

  panel.innerHTML = `
    <div class="carGlow"></div>

    <div class="carSvg" aria-hidden="true">
      <svg viewBox="0 0 720 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="tsoBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#292e38"/>
            <stop offset=".5" stop-color="#090c12"/>
            <stop offset="1" stop-color="#202631"/>
          </linearGradient>
          <linearGradient id="tsoGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#40516b"/>
            <stop offset="1" stop-color="#090e18"/>
          </linearGradient>
        </defs>

        <path class="outline"
          d="M55 218 L72 155 L118 137 L165 80 L355 80
          L408 111 L578 113 L635 145 L665 205 L645 228
          L73 228 Z"/>

        <path class="body"
          d="M68 210 L85 158 L128 145 L176 91 L349 91
          L399 119 L575 120 L622 148 L650 208 L632 220
          L82 220 Z"/>

        <path class="window" d="M179 98 L343 98 L383 121 L158 121 Z"/>
        <path class="window" d="M395 127 L560 127 L601 151 L410 151 Z"/>
        <path class="trim" d="M90 158 L625 158"/>
        <path class="trim" d="M94 207 L632 207"/>
        <path class="handle" d="M280 166 h30 M420 166 h30"/>

        <circle class="wheel" cx="174" cy="219" r="42"/>
        <circle class="hub" cx="174" cy="219" r="27"/>
        <circle class="hub2" cx="174" cy="219" r="13"/>

        <circle class="wheel" cx="566" cy="219" r="42"/>
        <circle class="hub" cx="566" cy="219" r="27"/>
        <circle class="hub2" cx="566" cy="219" r="13"/>

        <path class="lamp" d="M92 168 h32 l-8 24 H86 Z"/>
        <path class="tail" d="M615 164 h25 v27 h-25"/>
      </svg>
    </div>

    <div class="ui">
      <div class="head">
        <div>
          <b>G-CLASS TRADE JOURNAL</b>
          <small><i class="dot"></i><span class="mode">AUTO</span></small>
        </div>
        <div class="headBtns">
          <button class="icon gear" title="Налаштування">⚙</button>
          <button class="icon close" title="Згорнути">×</button>
        </div>
      </div>

      <div class="pairRow">
        <select class="pair" aria-label="Валютна пара"></select>
        <button class="sync" title="Синхронізувати">↻</button>
      </div>

      <div class="detected">ЗНАЙДЕНО: <b>—</b></div>

      <div class="stats">
        <div class="stat win">
          <label>WIN</label>
          <strong class="wins">0</strong>
          <div>
            <button data-k="win" data-d="1" aria-label="Додати WIN">+</button>
            <button data-k="win" data-d="-1" aria-label="Забрати WIN">−</button>
          </div>
        </div>

        <div class="stat loss">
          <label>LOSS</label>
          <strong class="losses">0</strong>
          <div>
            <button data-k="loss" data-d="1" aria-label="Додати LOSS">+</button>
            <button data-k="loss" data-d="-1" aria-label="Забрати LOSS">−</button>
          </div>
        </div>
      </div>

      <div class="rate">
        <label>WINRATE</label>
        <strong class="ratev">0%</strong>
        <small class="total">0 угод</small>
      </div>

      <div class="quick">
        <button class="qw">✓ WIN</button>
        <button class="ql">✕ LOSS</button>
      </div>

      <div class="bottom">
        <button class="add">＋ Пара</button>
        <button class="overallBtn">📊 Статистика</button>
        <button class="historyBtn">Історія</button>
        <button class="reset">Скинути</button>
      </div>

      <div class="settings">
        <label>
          <input class="auto" type="checkbox" checked>
          Автоматично визначати пару
        </label>
        <p>
          Віджет читає видиму назву активу на сторінці.
          Угоди позначаються вручну. Віджет не відкриває
          угод і не читає баланс.
        </p>
      </div>

      <div class="history">
        <b>ІСТОРІЯ УГОД</b>
        <div class="historyList"></div>
        <button class="clear">Очистити історію</button>
      </div>

      <div class="overall">
        <b>📊 ЗАГАЛЬНА СТАТИСТИКА</b>
        <div class="overallSummary"></div>
        <div class="overallPairs"></div>
        <button class="overallClose">Закрити</button>
      </div>
    </div>
  `;

  document.documentElement.appendChild(panel);

  const launcher = document.createElement("button");
  launcher.id = "tso5-launcher";
  launcher.textContent = "G";
  launcher.title = "Відкрити Trade Journal";
  document.documentElement.appendChild(launcher);

  const $ = selector => panel.querySelector(selector);

  function norm(text) {
    if (!text) return "";

    const cleaned = text
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const match = cleaned.match(
      /\b([A-Z]{3})\s*\/\s*([A-Z]{3})(?:\s+(OTC))?\b/i
    );

    if (!match) return "";

    return (
      match[1].toUpperCase() + "/" +
      match[2].toUpperCase() +
      (match[3] ? " OTC" : "")
    );
  }

  function assets(text) {
    const found = [];
    const regex =
      /\b[A-Z]{3}\s*\/\s*[A-Z]{3}(?:\s+OTC)?\b/gi;

    let match;

    while ((match = regex.exec(text || "")) !== null) {
      const pair = norm(match[0]);
      if (pair && !found.includes(pair)) found.push(pair);
    }

    return found;
  }

  function detect() {
    const selectors = [
      "[data-symbol]",
      "[data-asset]",
      "[data-pair]",
      "[aria-label]",
      "[title]",
      "button",
      '[role="button"]',
      '[class*="asset"]',
      '[class*="symbol"]',
      '[class*="pair"]',
      '[class*="instrument"]'
    ].join(",");

    const nodes = document.querySelectorAll(selectors);
    const found = [];

    for (const el of nodes) {
      if (panel.contains(el) || launcher.contains(el)) continue;
      if (el !== document.body && !el.offsetParent) continue;

      for (const attr of [
        "data-symbol",
        "data-asset",
        "data-pair",
        "aria-label",
        "title"
      ]) {
        const pair = norm(el.getAttribute(attr) || "");
        if (pair) found.push(pair);
      }

      found.push(...assets(el.innerText || ""));
    }

    found.push(
      ...assets((document.body.innerText || "").slice(0, 40000))
    );

    // Prefer the first detected pair that is not part of the overlay.
    return found[0] || "";
  }

  function ensure(pair) {
    if (!data[pair]) {
      data[pair] = { win: 0, loss: 0, trades: [] };
    }

    if (!Array.isArray(data[pair].trades)) {
      data[pair].trades = [];
    }

    data[pair].win = Math.max(0, Number(data[pair].win) || 0);
    data[pair].loss = Math.max(0, Number(data[pair].loss) || 0);
  }

  function save() {
    chrome.storage.local.set({
      [KEY]: data,
      [SET]: settings
    });
  }

  function render() {
    ensure(current);

    const d = data[current];
    const total = d.win + d.loss;

    const select = $(".pair");
    select.replaceChildren();

    Object.keys(data).sort().forEach(pair => {
      const option = document.createElement("option");
      option.value = pair;
      option.textContent = pair;
      select.appendChild(option);
    });

    select.value = current;
    $(".wins").textContent = d.win;
    $(".losses").textContent = d.loss;

    $(".ratev").textContent =
      (total ? (d.win / total * 100).toFixed(1) : "0.0") + "%";

    $(".total").textContent = total + " угод";
    $(".detected b").textContent = lastDetected;
    $(".mode").textContent = settings.auto ? "AUTO" : "MANUAL";
    $(".dot").classList.toggle("off", !settings.auto);
    $(".auto").checked = settings.auto;

    const list = $(".historyList");
    list.replaceChildren();

    if (!d.trades.length) {
      const empty = document.createElement("em");
      empty.textContent = "Поки немає записів";
      list.appendChild(empty);
    } else {
      d.trades.slice(0, 10).forEach(trade => {
        const row = document.createElement("div");
        const result = document.createElement("b");
        const time = document.createElement("small");

        result.textContent = trade.result;
        result.className = trade.result === "WIN" ? "w" : "l";
        time.textContent = trade.time;

        row.append(result, time);
        list.appendChild(row);
      });
    }
  }

  function addResult(kind, delta) {
    ensure(current);

    const d = data[current];
    const key = kind === "win" ? "win" : "loss";

    if (delta > 0) {
      d[key]++;

      d.trades.unshift({
        result: key.toUpperCase(),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      });

      d.trades = d.trades.slice(0, 100);
    } else {
      if (d[key] <= 0) return;

      d[key]--;

      const index = d.trades.findIndex(
        trade => trade.result === key.toUpperCase()
      );

      if (index !== -1) d.trades.splice(index, 1);
    }

    save();
    render();
  }

  panel.querySelectorAll("[data-k]").forEach(button => {
    button.addEventListener("click", () => {
      addResult(button.dataset.k, Number(button.dataset.d));
    });
  });

  $(".qw").addEventListener("click", () => addResult("win", 1));
  $(".ql").addEventListener("click", () => addResult("loss", 1));

  $(".pair").addEventListener("change", event => {
    current = event.target.value;
    manualUntil = Date.now() + 3000;
    render();
  });

  $(".sync").addEventListener("click", () => {
    const pair = detect();

    if (!pair) {
      lastDetected = "Не знайдено";
      render();
      return;
    }

    lastDetected = pair;
    ensure(pair);
    current = pair;
    save();
    render();
  });

  $(".add").addEventListener("click", () => {
    const input = prompt("Введи пару, наприклад EUR/GBP OTC");
    if (!input) return;

    const pair = norm(input) || input.trim();
    if (!pair) return;

    ensure(pair);
    current = pair;
    manualUntil = Date.now() + 3000;
    save();
    render();
  });

  $(".reset").addEventListener("click", () => {
    if (!confirm("Скинути статистику тільки для цієї пари?")) return;

    data[current] = { win: 0, loss: 0, trades: [] };
    save();
    render();
  });

  $(".historyBtn").addEventListener("click", () => {
    $(".history").classList.toggle("open");
    $(".overall").classList.remove("open");
    $(".settings").classList.remove("open");
  });

  $(".clear").addEventListener("click", () => {
    if (!confirm("Видалити історію цієї пари?")) return;

    data[current].trades = [];
    save();
    render();
  });

  function renderOverall() {
    const pairs = Object.entries(data);

    let wins = 0;
    let losses = 0;

    pairs.forEach(([, d]) => {
      wins += Number(d.win) || 0;
      losses += Number(d.loss) || 0;
    });

    const total = wins + losses;
    const rate = total ? (wins / total * 100).toFixed(1) : "0.0";

    const summary = $(".overallSummary");
    summary.replaceChildren();

    [
      ["WIN", wins, "#36e39d"],
      ["LOSS", losses, "#ff596f"],
      ["WINRATE", rate + "%", "#ffb25b"]
    ].forEach(([label, value, color]) => {
      const card = document.createElement("div");
      const title = document.createElement("span");
      const number = document.createElement("strong");

      title.textContent = label;
      number.textContent = value;
      number.style.color = color;

      card.append(title, number);
      summary.appendChild(card);
    });

    const rows = $(".overallPairs");
    rows.replaceChildren();

    pairs.sort(([a], [b]) => a.localeCompare(b)).forEach(([pair, d]) => {
      const w = Number(d.win) || 0;
      const l = Number(d.loss) || 0;
      const n = w + l;
      const percent = n ? (w / n * 100).toFixed(1) : "0.0";

      const row = document.createElement("div");
      const name = document.createElement("span");
      const stats = document.createElement("span");

      name.textContent = pair;
      stats.textContent = `${w}W / ${l}L · ${percent}%`;

      row.append(name, stats);
      rows.appendChild(row);
    });
  }

  $(".overallBtn").addEventListener("click", () => {
    $(".settings").classList.remove("open");
    $(".history").classList.remove("open");
    renderOverall();
    $(".overall").classList.toggle("open");
  });

  $(".overallClose").addEventListener("click", () => {
    $(".overall").classList.remove("open");
  });

  $(".gear").addEventListener("click", () => {
    $(".settings").classList.toggle("open");
    $(".history").classList.remove("open");
    $(".overall").classList.remove("open");
  });

  $(".auto").addEventListener("change", event => {
    settings.auto = event.target.checked;
    save();
    render();

    if (settings.auto) $(".sync").click();
  });

  $(".close").addEventListener("click", () => {
    panel.style.display = "none";
    launcher.style.display = "block";
  });

  launcher.addEventListener("click", () => {
    panel.style.display = "block";
    launcher.style.display = "none";
  });

  // Drag support for mouse and touchscreen.
  $(".head").addEventListener("pointerdown", event => {
    if (event.target.closest("button")) return;

    const rect = panel.getBoundingClientRect();
    drag = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    panel.style.right = "auto";
    try {
      $(".head").setPointerCapture(event.pointerId);
    } catch (_) {}
  });

  $(".head").addEventListener("pointermove", event => {
    if (!drag) return;

    panel.style.left = Math.max(
      0, event.clientX - drag.x
    ) + "px";

    panel.style.top = Math.max(
      0, event.clientY - drag.y
    ) + "px";
  });

  function stopDrag() {
    if (!drag) return;

    drag = null;

    chrome.storage.local.set({
      [POS]: {
        left: parseInt(panel.style.left, 10) || 0,
        top: parseInt(panel.style.top, 10) || 0
      }
    });
  }

  $(".head").addEventListener("pointerup", stopDrag);
  $(".head").addEventListener("pointercancel", stopDrag);

  function schedule() {
    if (!settings.auto || Date.now() < manualUntil) return;

    clearTimeout(timer);

    timer = setTimeout(() => {
      const pair = detect();
      if (!pair || pair === lastDetected) return;

      lastDetected = pair;
      ensure(pair);
      current = pair;
      save();
      render();
    }, 400);
  }

  const observer = new MutationObserver(schedule);

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [
      "data-symbol", "data-asset", "data-pair",
      "aria-label", "title"
    ]
  });

  const poll = setInterval(schedule, 1500);

  window.addEventListener("pagehide", () => {
    observer.disconnect();
    clearInterval(poll);
    clearTimeout(timer);
  });

  chrome.storage.local.get([KEY, SET, POS], stored => {
    data = stored[KEY] || structuredClone(seed);
    settings = { auto: true, ...(stored[SET] || {}) };

    Object.keys(data).forEach(ensure);

    const position = stored[POS];

    if (position) {
      panel.style.left = position.left + "px";
      panel.style.top = position.top + "px";
      panel.style.right = "auto";
    }

    ensure(current);
    render();

    setTimeout(() => {
      if (settings.auto) $(".sync").click();
    }, 1000);
  });
})();
