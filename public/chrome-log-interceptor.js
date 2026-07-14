/* eslint-disable */
/**
 * Browser-side error interceptor.
 *
 * Captures JS runtime errors, unhandled promise rejections, and
 * fetch/XHR failures, then forwards them to the local log-saver
 * server (chrome-log-server/server.js) via fetch().
 *
 * Served from /chrome-log-interceptor.js (public/). Safe to include
 * in production — silently no-ops if the log server isn't running.
 *
 * Self-pings on install with type "Interceptor Ready" so you can
 * confirm in the log folder that the interceptor actually ran.
 */

(function () {
  var L = "http://localhost:3100/log-error";
  function s(p) {
    try {
      fetch(L, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
        keepalive: true,
      }).catch(function (e) { console.warn("[chrome-log-server] fetch failed:", e); });
    } catch (e) { console.warn("[chrome-log-server] send error:", e); }
  }

  // Mark installed so the browser console can verify
  window.__chromeLogServerInstalled = true;
  s({
    type: "Interceptor Ready",
    message: "chrome-log-server interceptor installed on " + window.location.href,
    url: window.location.href,
    time: new Date().toISOString(),
  });

  // 1) Standard JS runtime errors
  window.addEventListener("error", function (event) {
    s({
      type: "JavaScript Error",
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error && event.error.stack ? event.error.stack : null,
      url: window.location.href,
      time: new Date().toISOString(),
    });
  });

  // 2) Unhandled promise rejections
  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    s({
      type: "Promise Rejection",
      message: reason && reason.message ? reason.message : String(reason || "Unknown"),
      stack: reason && reason.stack ? reason.stack : null,
      url: window.location.href,
      time: new Date().toISOString(),
    });
  });

  // 3) fetch() failures
  if (typeof window.fetch === "function") {
    var origFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      return origFetch(input, init).catch(function (err) {
        s({
          type: "Network Failure",
          message: (err && err.message) || "fetch failed",
          url: typeof input === "string" ? input : (input && input.url) || "unknown",
          method: (init && init.method) || "GET",
          stack: err && err.stack ? err.stack : null,
          page: window.location.href,
          time: new Date().toISOString(),
        });
        throw err;
      });
    };
  }

  // 4) XMLHttpRequest failures
  if (typeof window.XMLHttpRequest === "function") {
    var origOpen = window.XMLHttpRequest.prototype.open;
    var origSend = window.XMLHttpRequest.prototype.send;
    window.XMLHttpRequest.prototype.open = function (method, url) {
      this.__logMeta = { method: method, url: url };
      return origOpen.apply(this, arguments);
    };
    window.XMLHttpRequest.prototype.send = function () {
      this.addEventListener("error", function () {
        s({
          type: "XHR Failure",
          message: "XMLHttpRequest error",
          method: (this.__logMeta && this.__logMeta.method) || "GET",
          url: (this.__logMeta && this.__logMeta.url) || "unknown",
          page: window.location.href,
          time: new Date().toISOString(),
        });
      });
      return origSend.apply(this, arguments);
    };
  }
})();
