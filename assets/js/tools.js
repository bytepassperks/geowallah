/* GEOwallah — free SEO/AI tools client.
   Generic runtime: a single <form data-tool> per page declares its endpoint,
   payload kind and how to render the result. Keeps every tool page lean. */
(function () {
  "use strict";
  const API = "https://api.geowallah.com";

  const form = document.querySelector("form[data-tool]");
  if (!form) return;

  const out = document.getElementById("tOut");
  const loading = document.getElementById("tLoading");
  const errBox = document.getElementById("tError");
  const endpoint = form.getAttribute("data-endpoint");
  const kind = form.getAttribute("data-kind") || "";
  const render = form.getAttribute("data-render") || "text";
  const filename = form.getAttribute("data-filename") || "output.txt";

  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function gather() {
    const p = {};
    form.querySelectorAll("[data-field]").forEach(function (el) {
      const k = el.getAttribute("data-field");
      const v = (el.value || "").trim();
      if (v) p[k] = v;
    });
    if (kind) p.kind = kind;
    return p;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const payload = gather();
    const needsUrl = !!form.querySelector('[data-field="url"]');
    if (needsUrl && !payload.url) return;
    hide(errBox); hide(out); show(loading);
    if (loading) loading.scrollIntoView({ behavior: "smooth", block: "center" });
    try {
      const res = await fetch(API + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data = {};
      try { data = await res.json(); } catch (_) { data = {}; }
      hide(loading);
      if (res.status === 429) { return showErr(data.error || "You're going a bit fast — wait a minute and try again."); }
      if (!data || !data.ok) { return showErr((data && data.error) || "We couldn't process that — try another URL."); }
      renderResult(data);
    } catch (err) {
      hide(loading);
      showErr("Our tool couldn't reach that site (it may block automated visits or be offline). We'll happily run it for you by hand.");
    }
  });

  function showErr(msg) {
    if (!errBox) return;
    const m = errBox.querySelector("[data-msg]");
    if (m) m.textContent = msg;
    show(errBox);
    errBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function renderResult(d) {
    show(out);
    if (render === "nap") renderNap(d);
    else if (render === "aivis") renderAivis(d);
    else renderText(d);
    out.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---- text/code output (schema, sitemap, llms.txt, faq, meta, title) ---- */
  function renderText(d) {
    const content = d.content || "";
    out.innerHTML =
      '<div class="t-out-head"><span class="t-out-label">Your result</span>' +
      '<div class="t-out-btns">' +
      '<button type="button" class="btn btn-ghost btn-sm" data-copy>Copy</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-download>Download</button>' +
      '</div></div>' +
      '<pre class="t-code"><code>' + esc(content) + '</code></pre>' +
      '<p class="t-out-note">Paste this into your site. Need it implemented for you? ' +
      '<a href="/contact.html">We\'ll do it free with any plan</a>.</p>';
    out.querySelector("[data-copy]").addEventListener("click", function () {
      navigator.clipboard.writeText(content).then(() => flash(this, "Copied!"));
    });
    out.querySelector("[data-download]").addEventListener("click", function () {
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
    });
  }

  function flash(btn, txt) {
    const old = btn.textContent; btn.textContent = txt;
    setTimeout(() => { btn.textContent = old; }, 1600);
  }

  /* ---- NAP consistency checker ---- */
  function renderNap(d) {
    const f = d.found || {};
    const row = (label, ok, val) =>
      '<div class="t-nap-row ' + (ok ? "ok" : "bad") + '">' +
      '<span class="t-nap-ic">' + (ok ? "&#10003;" : "&#10007;") + '</span>' +
      '<div><b>' + label + '</b>' + (val ? '<span>' + esc(val) + '</span>' : '<span>Not found on the page</span>') + '</div></div>';
    let html = '<div class="t-out-head"><span class="t-out-label">NAP signals on ' + esc(d.host || "your page") + '</span></div>';
    html += '<div class="t-nap">';
    html += row("Business name", f.name, d.name);
    html += row("Phone", f.phone, d.phone);
    html += row("Address", f.address, d.address);
    html += '</div>';
    if (d.issues && d.issues.length) {
      html += '<ul class="t-issues">' + d.issues.map((i) => "<li>" + esc(i) + "</li>").join("") + "</ul>";
    }
    html += '<p class="t-out-note">Consistent NAP across your site, Google Business Profile and directories is a core local-ranking signal. ' +
      '<a href="/local-seo/">See our local SEO &amp; citations work</a>.</p>';
    out.innerHTML = html;
  }

  /* ---- AI visibility checker ---- */
  function renderAivis(d) {
    if (!d.checked) {
      out.innerHTML = '<p class="t-out-note">We couldn\'t complete a live AI check right now (search backends were busy). ' +
        'Try again in a minute, or <a href="/audit.html">run the full free audit</a>.</p>';
      return;
    }
    const tierClass = d.tier === "top" ? "ok" : d.tier === "mid" ? "warn" : "bad";
    let html = '<div class="t-out-head"><span class="t-out-label">Live AI visibility</span></div>';
    if (d.query) html += '<p class="t-aivis-q">Tested live query: <b>' + esc(d.query) + '</b></p>';
    html += '<p class="t-verdict ' + tierClass + '">' + esc(d.verdict || "") + "</p>";
    if (d.engines && d.engines.length) {
      html += '<div class="t-engines">' + d.engines.map(function (e) {
        const named = e.found;
        return '<div class="t-engine ' + (named ? "ok" : "bad") + '">' +
          '<b>' + esc(e.name) + '</b>' +
          '<span>' + esc(e.via || "") + '</span>' +
          '<em>' + (named ? (e.position ? "Named · ~#" + e.position : "Named") : "Not named yet") + '</em>' +
          '</div>';
      }).join("") + '</div>';
    }
    if (d.competitors && d.competitors.length) {
      html += '<p class="t-out-label" style="margin-top:18px">Who AI sees instead</p><ol class="t-rivals">' +
        d.competitors.slice(0, 5).map((c) => "<li>" + esc(c.domain || c.title || "") + "</li>").join("") + "</ol>";
    }
    html += '<p class="t-out-note">Want to be the name AI engines recommend? ' +
      '<a href="/services.html">See our AI search (GEO/AEO) optimization</a> or ' +
      '<a href="/audit.html">run the full audit</a>.</p>';
    out.innerHTML = html;
  }
})();
