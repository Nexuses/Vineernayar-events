/**
 * Scroll to URL hash after SPA hydration (for marketing site).
 * Include in the marketing site _document or layout:
 * <script src="https://YOUR-EVENTS-DOMAIN/hf-hash-scroll.js" defer />
 */
(function () {
  function scrollToHash() {
    var id = window.location.hash.replace(/^#/, "");
    if (!id) return;
    var el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ block: "start", behavior: "auto" });
    }
  }

  function scheduleScroll() {
    scrollToHash();
    window.setTimeout(scrollToHash, 50);
    window.setTimeout(scrollToHash, 200);
    window.setTimeout(scrollToHash, 600);
  }

  if (document.readyState === "complete") {
    scheduleScroll();
  } else {
    window.addEventListener("load", scheduleScroll);
  }

  window.addEventListener("hashchange", scrollToHash);
})();
