/* Tara AI — floating chat widget loader
 * ---------------------------------------------------------------------------
 * Drop ONE tag on any page of the website (staging or production):
 *
 *   <script src="https://obl-marketing.github.io/Assist-AI/embed.js" defer></script>
 *
 * It injects a floating "Chat" bubble bottom-right that opens Tara in an
 * iframe. Because the iframe loads the independently-hosted Tara page, any
 * change pushed to Tara appears here automatically — the website is never
 * re-deployed and nothing is merged into the site's own codebase.
 *
 * Optional data-* attributes on the <script> tag:
 *   data-position="left"      -> bubble on the bottom-left (default: right)
 *   data-label="Tile Help"    -> tooltip / aria-label (default: "Tile Assistant")
 *   data-open="true"          -> open automatically on load
 * --------------------------------------------------------------------------- */
(function () {
  var s = document.currentScript;
  // Tara lives next to this script (same folder on GitHub Pages).
  var APP_URL = new URL("./index.html", s.src).href;
  var SIDE = (s.getAttribute("data-position") || "right").toLowerCase() === "left" ? "left" : "right";
  var LABEL = s.getAttribute("data-label") || "Tile Assistant";
  var AUTO_OPEN = (s.getAttribute("data-open") || "") === "true";

  if (window.__taraWidgetLoaded) return;
  window.__taraWidgetLoaded = true;

  var NAVY = "#000D36", GOLD = "#FFCC00";
  var Z = 2147483000;
  var open = false;

  // ---- launcher button ----
  var btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", LABEL);
  btn.title = LABEL;
  btn.style.cssText =
    "position:fixed;bottom:20px;" + SIDE + ":20px;z-index:" + Z + ";" +
    "width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;" +
    "background:" + NAVY + ";color:" + GOLD + ";box-shadow:0 8px 24px rgba(0,0,0,.28);" +
    "display:flex;align-items:center;justify-content:center;transition:transform .15s ease;";
  btn.onmouseenter = function () { btn.style.transform = "scale(1.06)"; };
  btn.onmouseleave = function () { btn.style.transform = "scale(1)"; };
  btn.innerHTML =
    '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-4 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z" fill="' + GOLD + '"/>' +
    '</svg>';

  // ---- iframe panel ----
  var panel = document.createElement("div");
  panel.style.cssText =
    "position:fixed;z-index:" + Z + ";box-shadow:0 18px 60px rgba(0,0,0,.35);" +
    "border-radius:16px;overflow:hidden;background:#fff;display:none;";
  var iframe = document.createElement("iframe");
  iframe.title = LABEL;
  iframe.setAttribute("loading", "lazy");
  iframe.style.cssText = "width:100%;height:100%;border:0;display:block;";
  panel.appendChild(iframe);

  function sizePanel() {
    var mobile = window.matchMedia("(max-width:560px)").matches;
    if (mobile) {
      panel.style.inset = "0";
      panel.style.borderRadius = "0";
      panel.style.width = "100%";
      panel.style.height = "100%";
    } else {
      panel.style.inset = "";
      panel.style.borderRadius = "16px";
      panel.style.bottom = "92px";
      panel.style[SIDE] = "20px";
      panel.style.top = "";
      panel.style.width = "400px";
      panel.style.height = "min(640px, calc(100vh - 120px))";
    }
  }

  function setOpen(v) {
    open = v;
    if (open && !iframe.src) iframe.src = APP_URL;   // load on first open
    sizePanel();
    panel.style.display = open ? "block" : "none";
    btn.style.display = open && window.matchMedia("(max-width:560px)").matches ? "none" : "flex";
    btn.innerHTML = open
      ? '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="' + GOLD + '" stroke-width="2.4" stroke-linecap="round"/></svg>'
      : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-4 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z" fill="' + GOLD + '"/></svg>';
  }

  btn.addEventListener("click", function () { setOpen(!open); });
  window.addEventListener("resize", function () { if (open) sizePanel(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) setOpen(false); });

  function mount() {
    document.body.appendChild(panel);
    document.body.appendChild(btn);
    if (AUTO_OPEN) setOpen(true);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
