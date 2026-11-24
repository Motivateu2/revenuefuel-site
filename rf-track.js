/* Revenue Fuel preview tracking (GoatCounter, cookie-free).
   One line in each page's <head>:  <script src="/rf-track.js" defer></script>
   Counts the page view, plus these events (each at most once per visit):
     <slug> · tapped <button/link label>   (or "tapped call" / "tapped text" / "tapped email")
     <slug> · sent the form                (preview forms go nowhere, but the try counts)
     <slug> · scrolled halfway / scrolled to bottom
     <slug> · stayed 30s / stayed 2 min    (only time with the tab in front)
   Nothing a visitor types is ever read or sent.
   Runs only on revenuefuel.ai, never in headless/automated browsers.
   To stop counting your own visits in a browser, open
   https://revenuefuel.ai/#toggle-goatcounter once in that browser. */
(function () {
  if (location.hostname !== "revenuefuel.ai") return;
  if (navigator.webdriver) return;

  var ENDPOINT = "https://revenuefuel.goatcounter.com/count";
  window.goatcounter = window.goatcounter || {};
  window.goatcounter.endpoint = ENDPOINT;
  // Count by page only: Messenger adds ?fbclid=... to every link, which would split one page into many rows.
  window.goatcounter.path = function () { return location.pathname; };

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://gc.zgo.at/count.js";
  s.setAttribute("data-goatcounter", ENDPOINT);
  document.head.appendChild(s);

  var slug = location.pathname.replace(/^\/+|\/+$/g, "").replace(/^p\//, "") || "home";
  var sent = {};
  function ev(name) {
    if (sent[name]) return;
    sent[name] = 1;
    var path = slug + " · " + name;
    (function go(tries) {
      if (window.goatcounter && typeof window.goatcounter.count === "function") {
        window.goatcounter.count({ path: path, title: path, event: true });
      } else if (tries < 20) {
        setTimeout(function () { go(tries + 1); }, 250);
      }
    })(0);
  }

  function label(el) {
    var href = el.getAttribute && (el.getAttribute("href") || "");
    if (/^tel:/i.test(href)) return "call";
    if (/^sms:/i.test(href)) return "text";
    if (/^mailto:/i.test(href)) return "email";
    var t = (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim();
    if (!t && /^https?:/i.test(href)) { try { t = new URL(href).hostname; } catch (e) {} }
    return (t || "button").slice(0, 40);
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("a, button, [role=button], summary");
    if (el) ev("tapped " + label(el));
  }, true);

  document.addEventListener("submit", function () { ev("sent the form"); }, true);

  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (h <= 0) return;
    var p = (window.scrollY || window.pageYOffset) / h;
    if (p >= 0.5) ev("scrolled halfway");
    if (p >= 0.95) ev("scrolled to bottom");
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  var shown = 0, last = Date.now();
  setInterval(function () {
    var now = Date.now();
    if (document.visibilityState === "visible") shown += now - last;
    last = now;
    if (shown >= 30000) ev("stayed 30s");
    if (shown >= 120000) ev("stayed 2 min");
  }, 1000);
})();
