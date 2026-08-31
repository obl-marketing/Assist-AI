/*
 * Orientbell Tiles - RAG Assistant widget
 * ---------------------------------------
 * Embed on any page with:
 *   <script src="https://YOUR-HOST/widget.js"
 *           data-api="https://YOUR-HOST" defer></script>
 *
 * It injects a floating "Ask about tiles" launcher, a chat panel, product
 * cards with a Shortlist button, category chips, quick-action buttons and
 * follow-up suggestions. The shortlist (wishlist) is kept in localStorage so
 * it survives navigation across the site.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var API_BASE =
    (script && script.getAttribute("data-api")) ||
    window.OBT_ASSISTANT_API ||
    ""; // same-origin by default
  var STORAGE_KEY = "obt_shortlist";
  var history = [];

  // ------------------------------------------------------------- shortlist
  function loadShortlist() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }
  function saveShortlist(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      /* storage may be blocked; shortlist just won't persist */
    }
  }
  function inShortlist(id) {
    return loadShortlist().some(function (i) {
      return i.id === id;
    });
  }
  function toggleShortlist(product) {
    var items = loadShortlist();
    var idx = items.findIndex(function (i) {
      return i.id === product.id;
    });
    if (idx >= 0) {
      items.splice(idx, 1);
    } else {
      items.push(product);
    }
    saveShortlist(items);
    updateBadge();
    renderShortlist();
    return idx < 0; // true if now added
  }

  // ------------------------------------------------------------- styling
  var css =
    "" +
    ".obt-launcher{position:fixed;right:20px;bottom:20px;z-index:99999;background:#c2185b;color:#fff;border:none;border-radius:28px;padding:14px 20px;font:600 15px/1 system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer}" +
    ".obt-launcher:hover{background:#ad1457}" +
    ".obt-badge{position:absolute;top:-8px;right:-8px;background:#111;color:#fff;border-radius:12px;min-width:20px;height:20px;font:700 11px/20px system-ui;text-align:center;padding:0 5px}" +
    ".obt-panel{position:fixed;right:20px;bottom:20px;z-index:100000;width:380px;max-width:calc(100vw - 32px);height:600px;max-height:calc(100vh - 40px);background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.3);display:none;flex-direction:column;overflow:hidden;font-family:system-ui,-apple-system,sans-serif}" +
    ".obt-panel.open{display:flex}" +
    ".obt-head{background:#c2185b;color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between}" +
    ".obt-head h3{margin:0;font-size:16px}.obt-head p{margin:2px 0 0;font-size:12px;opacity:.85}" +
    ".obt-head button{background:transparent;border:none;color:#fff;font-size:20px;cursor:pointer;line-height:1}" +
    ".obt-tabs{display:flex;border-bottom:1px solid #eee}" +
    ".obt-tab{flex:1;padding:10px;border:none;background:#fafafa;cursor:pointer;font:600 13px system-ui;color:#666}" +
    ".obt-tab.active{background:#fff;color:#c2185b;box-shadow:inset 0 -2px 0 #c2185b}" +
    ".obt-body{flex:1;overflow-y:auto;padding:14px;background:#faf7f8}" +
    ".obt-msg{margin-bottom:12px;display:flex}" +
    ".obt-msg.user{justify-content:flex-end}" +
    ".obt-bubble{max-width:85%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.45}" +
    ".obt-msg.user .obt-bubble{background:#c2185b;color:#fff;border-bottom-right-radius:4px}" +
    ".obt-msg.bot .obt-bubble{background:#fff;color:#222;border:1px solid #eee;border-bottom-left-radius:4px}" +
    ".obt-card{background:#fff;border:1px solid #eee;border-radius:12px;padding:10px;margin:8px 0;display:flex;gap:10px}" +
    ".obt-swatch{width:44px;height:44px;border-radius:8px;flex:0 0 auto;background:#eee}" +
    ".obt-card h4{margin:0 0 2px;font-size:13px}.obt-card .meta{font-size:11px;color:#777;margin:0 0 4px}" +
    ".obt-card .reason{font-size:12px;color:#444;margin:0 0 6px}" +
    ".obt-card .row{display:flex;gap:6px;align-items:center}" +
    ".obt-btn{border:none;border-radius:8px;padding:6px 10px;font:600 12px system-ui;cursor:pointer}" +
    ".obt-btn.primary{background:#c2185b;color:#fff}.obt-btn.ghost{background:#fce4ec;color:#c2185b}" +
    ".obt-btn.added{background:#2e7d32;color:#fff}" +
    ".obt-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}" +
    ".obt-chip{background:#fff;border:1px solid #f0c6d6;color:#c2185b;border-radius:16px;padding:6px 11px;font:500 12px system-ui;cursor:pointer}" +
    ".obt-chip:hover{background:#fce4ec}" +
    ".obt-cat{display:block;color:#c2185b;font-size:13px;text-decoration:none;padding:6px 0;border-bottom:1px dashed #f0c6d6}" +
    ".obt-foot{border-top:1px solid #eee;padding:10px;display:flex;gap:8px;background:#fff}" +
    ".obt-foot input{flex:1;border:1px solid #ddd;border-radius:20px;padding:10px 14px;font-size:14px;outline:none}" +
    ".obt-foot input:focus{border-color:#c2185b}" +
    ".obt-send{background:#c2185b;color:#fff;border:none;border-radius:20px;padding:0 16px;cursor:pointer;font-weight:600}" +
    ".obt-empty{color:#999;font-size:13px;text-align:center;margin-top:30px}" +
    ".obt-typing{font-size:13px;color:#999;font-style:italic}";

  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ------------------------------------------------------------- DOM
  var launcher = document.createElement("button");
  launcher.className = "obt-launcher";
  launcher.innerHTML =
    '🧱 Ask about tiles<span class="obt-badge" style="display:none">0</span>';

  var panel = document.createElement("div");
  panel.className = "obt-panel";
  panel.innerHTML =
    '<div class="obt-head"><div><h3>Tile Assistant</h3><p>Find, compare & shortlist Orientbell tiles</p></div><button class="obt-close" aria-label="Close">&times;</button></div>' +
    '<div class="obt-tabs"><button class="obt-tab active" data-tab="chat">Chat</button><button class="obt-tab" data-tab="shortlist">Shortlist <span class="obt-sl-count"></span></button></div>' +
    '<div class="obt-body obt-chat"></div>' +
    '<div class="obt-body obt-shortlist" style="display:none"></div>' +
    '<div class="obt-foot"><input class="obt-input" placeholder="e.g. pink tiles for my bathroom" /><button class="obt-send">Send</button></div>';

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  var chatBody = panel.querySelector(".obt-chat");
  var shortlistBody = panel.querySelector(".obt-shortlist");
  var input = panel.querySelector(".obt-input");
  var badge = launcher.querySelector(".obt-badge");
  var slCount = panel.querySelector(".obt-sl-count");

  // ------------------------------------------------------------- helpers
  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function swatchColor(colors) {
    var map = {
      pink: "#f8bbd0", blush: "#f8bbd0", rose: "#f48fb1", mauve: "#d7a1c4",
      white: "#f5f5f5", cream: "#f3ead6", beige: "#e8dcc0", sand: "#e6d7b8",
      grey: "#bdbdbd", gray: "#bdbdbd", slate: "#8a99a8", charcoal: "#555",
      brown: "#a1887f", oak: "#c8a26a", honey: "#d9a441", graphite: "#4a4a4a",
      aqua: "#b2ebf2", blue: "#90caf9", terracotta: "#c86b4a", rust: "#b05a3c",
      marble: "#eceff1", stone: "#cfd8dc"
    };
    var first = (colors && colors[0] ? colors[0] : "").toLowerCase();
    return map[first] || "#e0e0e0";
  }

  function addMessage(role, html) {
    var wrap = document.createElement("div");
    wrap.className = "obt-msg " + role;
    wrap.innerHTML = '<div class="obt-bubble">' + html + "</div>";
    chatBody.appendChild(wrap);
    chatBody.scrollTop = chatBody.scrollHeight;
    return wrap;
  }

  function renderProductCard(p) {
    var added = inShortlist(p.id);
    var price = p.price_per_sqft_inr ? "₹" + p.price_per_sqft_inr + "/sq.ft" : "";
    var meta = [p.size, p.finish, price].filter(Boolean).join(" · ");
    var card = document.createElement("div");
    card.className = "obt-card";
    card.innerHTML =
      '<div class="obt-swatch" style="background:' + swatchColor(p.color) + '"></div>' +
      "<div style=\"flex:1\">" +
      "<h4>" + esc(p.name) + "</h4>" +
      '<p class="meta">' + esc(meta) + "</p>" +
      '<p class="reason">' + esc(p.reason || "") + "</p>" +
      '<div class="row">' +
      '<a class="obt-btn ghost" href="' + esc(p.url) + '" target="_blank" rel="noopener">View</a>' +
      '<button class="obt-btn ' + (added ? "added" : "primary") + ' obt-sl-btn">' +
      (added ? "✓ Shortlisted" : "♡ Shortlist") +
      "</button></div></div>";
    card.querySelector(".obt-sl-btn").addEventListener("click", function () {
      var nowAdded = toggleShortlist(p);
      var btn = card.querySelector(".obt-sl-btn");
      btn.className = "obt-btn " + (nowAdded ? "added" : "primary") + " obt-sl-btn";
      btn.textContent = nowAdded ? "✓ Shortlisted" : "♡ Shortlist";
    });
    return card;
  }

  function renderBotAnswer(data) {
    var bubble = addMessage("bot", esc(data.reply));
    var host = bubble.querySelector(".obt-bubble");

    (data.products || []).forEach(function (p) {
      host.appendChild(renderProductCard(p));
    });

    if (data.categories && data.categories.length) {
      var catWrap = document.createElement("div");
      catWrap.style.marginTop = "6px";
      catWrap.innerHTML = '<div style="font-size:12px;color:#777;margin:4px 0">Explore collections:</div>';
      data.categories.forEach(function (c) {
        var a = document.createElement("a");
        a.className = "obt-cat";
        a.href = c.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "→ " + c.name;
        catWrap.appendChild(a);
      });
      host.appendChild(catWrap);
    }

    if (data.follow_up_questions && data.follow_up_questions.length) {
      var chips = document.createElement("div");
      chips.className = "obt-chips";
      data.follow_up_questions.forEach(function (q) {
        var chip = document.createElement("button");
        chip.className = "obt-chip";
        chip.textContent = q;
        chip.addEventListener("click", function () {
          send(q);
        });
        chips.appendChild(chip);
      });
      host.appendChild(chips);
    }
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // ------------------------------------------------------------- shortlist tab
  function renderShortlist() {
    var items = loadShortlist();
    slCount.textContent = items.length ? "(" + items.length + ")" : "";
    if (!items.length) {
      shortlistBody.innerHTML =
        '<div class="obt-empty">No tiles shortlisted yet.<br>Ask the assistant and tap ♡ Shortlist on any tile.</div>';
      return;
    }
    shortlistBody.innerHTML = "";
    items.forEach(function (p) {
      shortlistBody.appendChild(renderProductCard(p));
    });
    var cta = document.createElement("a");
    cta.className = "obt-btn primary";
    cta.style.display = "block";
    cta.style.textAlign = "center";
    cta.style.margin = "12px 0";
    cta.style.textDecoration = "none";
    cta.href = "https://www.orientbell.com/store-locator";
    cta.target = "_blank";
    cta.rel = "noopener";
    cta.textContent = "Book a free store visit for these →";
    shortlistBody.appendChild(cta);
  }

  function updateBadge() {
    var n = loadShortlist().length;
    badge.textContent = n;
    badge.style.display = n ? "block" : "none";
  }

  // ------------------------------------------------------------- networking
  function send(text) {
    var msg = (text != null ? text : input.value).trim();
    if (!msg) return;
    input.value = "";
    addMessage("user", esc(msg));
    history.push({ role: "user", content: msg });
    var typing = addMessage("bot", '<span class="obt-typing">Finding tiles…</span>');

    fetch(API_BASE + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, history: history.slice(-8) }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        typing.remove();
        renderBotAnswer(data);
        history.push({ role: "assistant", content: data.reply });
      })
      .catch(function () {
        typing.querySelector(".obt-bubble").innerHTML =
          "Sorry, I couldn't reach the assistant. Please try again.";
      });
  }

  // ------------------------------------------------------------- events
  function openPanel() {
    panel.classList.add("open");
    launcher.style.display = "none";
    if (!chatBody.dataset.greeted) {
      renderBotAnswer({
        reply:
          "Hi! I'm your Orientbell tile assistant. Tell me the room and the look you want - " +
          "like “pink tiles for a bathroom” or “anti-skid tiles for the kitchen”.",
        follow_up_questions: [
          "Pink tiles for my bathroom",
          "Best tiles for kitchen floor",
          "Marble-look tiles for living room",
        ],
      });
      chatBody.dataset.greeted = "1";
    }
    input.focus();
  }
  function closePanel() {
    panel.classList.remove("open");
    launcher.style.display = "block";
  }

  launcher.addEventListener("click", openPanel);
  panel.querySelector(".obt-close").addEventListener("click", closePanel);
  panel.querySelector(".obt-send").addEventListener("click", function () {
    send();
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") send();
  });
  panel.querySelectorAll(".obt-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      panel.querySelectorAll(".obt-tab").forEach(function (t) {
        t.classList.remove("active");
      });
      tab.classList.add("active");
      var isChat = tab.dataset.tab === "chat";
      chatBody.style.display = isChat ? "block" : "none";
      shortlistBody.style.display = isChat ? "none" : "block";
      if (!isChat) renderShortlist();
    });
  });

  // init
  updateBadge();
  renderShortlist();
})();
