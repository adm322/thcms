/* eslint-disable */
/**
 * Browser-side error interceptor.
 *
 * Capture JS runtime errors, unhandled promise rejections, and
 * fetch/XHR failures, then forward them to the local log-saver
 * server (chrome-log-server/server.js) via fetch().
 *
 * Drop this into the head of any HTML page (before app JS runs) to
 * automatically record errors to chrome-log-server/logs/.
 *
 * Safe to include in production too — it silently no-ops if the
 * log server isn't reachable.
 */

(function () {
  var LOG_SERVER = 'http://localhost:3100/log-error';

  function send(payload) {
    try {
      // Keep the fetch fire-and-forget so the page isn't blocked
      fetch(LOG_SERVER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function () { /* log server unreachable — silent */ });
    } catch (_) { /* never let the logger break the page */ }
  }

  // 1) Standard JS runtime errors
  window.addEventListener('error', function (event) {
    send({
      type: 'JavaScript Error',
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error ? event.error.stack : null,
      url: window.location.href,
      time: new Date().toISOString(),
    });
  });

  // 2) Unhandled promise rejections (failed async/API calls)
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    send({
      type: 'Promise Rejection',
      message: reason && reason.message ? reason.message : String(reason || 'Unknown rejection'),
      stack: reason && reason.stack ? reason.stack : null,
      url: window.location.href,
      time: new Date().toISOString(),
    });
  });

  // 3) Patch fetch() to record failed network requests
  if (typeof window.fetch === 'function') {
    var origFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      return origFetch(input, init).catch(function (err) {
        send({
          type: 'Network Failure',
          message: (err && err.message) || 'fetch failed',
          url: typeof input === 'string' ? input : (input && input.url) || 'unknown',
          method: (init && init.method) || 'GET',
          stack: err && err.stack ? err.stack : null,
          page: window.location.href,
          time: new Date().toISOString(),
        });
        throw err; // re-throw so app code still sees the error
      });
    };
  }

  // 4) Patch XMLHttpRequest to record failed network requests
  if (typeof window.XMLHttpRequest === 'function') {
    var origOpen = window.XMLHttpRequest.prototype.open;
    var origSend = window.XMLHttpRequest.prototype.send;
    window.XMLHttpRequest.prototype.open = function (method, url) {
      this.__logMeta = { method: method, url: url };
      return origOpen.apply(this, arguments);
    };
    window.XMLHttpRequest.prototype.send = function () {
      this.addEventListener('error', function () {
        send({
          type: 'XHR Failure',
          message: 'XMLHttpRequest error',
          method: (this.__logMeta && this.__logMeta.method) || 'GET',
          url: (this.__logMeta && this.__logMeta.url) || 'unknown',
          page: window.location.href,
          time: new Date().toISOString(),
        });
      });
      return origSend.apply(this, arguments);
    };
  }
})();
