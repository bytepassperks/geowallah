/* GEOwallah — free audit tool client */
(function () {
  "use strict";
  const API = "https://geowallah-audit.osc-fr1.scalingo.io";

  const form = document.getElementById("auditForm");
  if (!form) return;
  const loading = document.getElementById("auditLoading");
  const errBox = document.getElementById("auditError");
  const results = document.getElementById("auditResults");

  const ICONS = {
    pass: '<svg viewBox="0 0 24 24" fill="none" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.6"><path d="M12 8v5M12 17v.01"/><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
    fail: '<svg viewBox="0 0 24 24" fill="none" stroke-width="3"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.6"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/></svg>',
  };
  const CAT_ICON = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    ai: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 21s-7-5.7-7-11a7 7 0 0 1 14 0c0 5.3-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>',
  };

  let stepTimer = null;
  function runSteps() {
    const steps = Array.from(loading.querySelectorAll(".al-steps li"));
    let i = 0;
    steps.forEach((s) => s.classList.remove("done", "active"));
    steps[0].classList.add("active");
    stepTimer = setInterval(() => {
      if (i < steps.length - 1) {
        steps[i].classList.remove("active");
        steps[i].classList.add("done");
        i++;
        steps[i].classList.add("active");
      }
    }, 1600);
  }
  function stopSteps() { if (stepTimer) clearInterval(stepTimer); stepTimer = null; }

  function scoreColor(s) {
    if (s >= 85) return "var(--teal-bright)";
    if (s >= 70) return "var(--teal)";
    if (s >= 50) return "var(--amber)";
    return "var(--coral)";
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const url = document.getElementById("afUrl").value.trim();
    if (!url) return;
    const payload = {
      url: url,
      business_name: document.getElementById("afName").value.trim(),
      city: document.getElementById("afCity").value.trim(),
      category: document.getElementById("afCat").value.trim(),
    };
    errBox.hidden = true;
    results.hidden = true;
    loading.hidden = false;
    runSteps();
    loading.scrollIntoView({ behavior: "smooth", block: "center" });

    try {
      const res = await fetch(API + "/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      stopSteps();
      loading.hidden = true;
      if (!data || !data.ok) {
        showError(typeof data.error === "string" ? data.error : "We couldn't read that website.");
        return;
      }
      render(data);
    } catch (err) {
      stopSteps();
      loading.hidden = true;
      showError("Our scanner couldn't reach the site (it may block automated visits or be offline).");
    }
  });

  function showError(msg) {
    document.getElementById("aeMsg").textContent = msg;
    errBox.hidden = false;
    errBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  let lastData = null;

  function render(d) {
    results.hidden = false;
    lastData = d;
    // host
    document.getElementById("arHost").textContent = d.host || "your site";
    renderVis(d.ai_visibility);
    // grade
    const grade = document.getElementById("arGrade");
    grade.textContent = d.grade || "";
    grade.style.background = scoreColor(d.overall_score);
    grade.style.color = d.overall_score >= 50 && d.overall_score < 70 ? "var(--ink)" : "#fff";
    // verdict
    const verdict = d.ai && d.ai.verdict ? d.ai.verdict :
      "Here's how customers and AI engines currently see your business — and the highest-impact fixes.";
    document.getElementById("arVerdict").textContent = verdict;

    // gauge animation
    const fill = document.querySelector(".g-fill");
    const C = 2 * Math.PI * 52;
    fill.style.strokeDasharray = C;
    fill.style.strokeDashoffset = C;
    fill.style.stroke = scoreColor(d.overall_score);
    const scoreEl = document.getElementById("arScore");
    let cur = 0;
    requestAnimationFrame(() => {
      fill.style.strokeDashoffset = C * (1 - d.overall_score / 100);
    });
    const dur = 1100, t0 = performance.now();
    (function tick(t) {
      const p = Math.min(1, (t - t0) / dur);
      scoreEl.textContent = Math.round(d.overall_score * (0.5 - Math.cos(Math.PI * p) / 2));
      if (p < 1) requestAnimationFrame(tick); else scoreEl.textContent = d.overall_score;
    })(t0);

    // categories
    const cats = document.getElementById("arCats");
    cats.innerHTML = "";
    (d.categories || []).forEach((c) => {
      const el = document.createElement("div");
      el.className = "ar-cat block";
      el.innerHTML =
        '<div class="arc-ico">' + (CAT_ICON[c.icon] || "") + "</div>" +
        '<div class="arc-body"><div class="arc-head"><h3>' + c.name + "</h3>" +
        '<b style="color:' + scoreColor(c.score) + '">' + c.score + "</b></div>" +
        '<div class="arc-bar"><i style="width:' + c.score + "%;background:" + scoreColor(c.score) + '"></i></div>' +
        '<div class="arc-sum"><span class="ok">' + c.summary.pass + " good</span>" +
        '<span class="wn">' + c.summary.warn + " to improve</span>" +
        '<span class="bd">' + c.summary.fail + " critical</span></div></div>";
      cats.appendChild(el);
    });

    // AI insights
    const aiBox = document.getElementById("arAi");
    if (d.ai && (d.ai.priorities || d.ai.meta_description)) {
      aiBox.hidden = false;
      const pr = document.getElementById("arPriorities");
      pr.innerHTML = "";
      (d.ai.priorities || []).forEach((p, i) => {
        const it = document.createElement("div");
        it.className = "ar-prio";
        it.innerHTML = '<span class="pr-n">' + (i + 1) + "</span><div><b>" +
          esc(p.action || "") + "</b><p>" + esc(p.why || "") + "</p></div>";
        pr.appendChild(it);
      });
      const meta = d.ai.meta_description || "";
      document.getElementById("arMeta").textContent = meta;
      document.querySelector(".ar-meta").style.display = meta ? "" : "none";
      const faqs = document.getElementById("arFaqs");
      faqs.innerHTML = "";
      (d.ai.faqs || []).forEach((q) => {
        const li = document.createElement("li");
        li.textContent = q;
        faqs.appendChild(li);
      });
      document.querySelector(".ar-faqs").style.display = (d.ai.faqs && d.ai.faqs.length) ? "" : "none";
    } else {
      aiBox.hidden = true;
    }

    // detailed checklist
    const detail = document.getElementById("arDetail");
    detail.innerHTML = '<div class="shead center"><span class="kicker" style="justify-content:center"><span class="num">✓</span><span class="dash"></span> Full checklist</span><h2>Every check, explained</h2></div>';
    (d.categories || []).forEach((c) => {
      const sec = document.createElement("div");
      sec.className = "ard-cat block";
      let rows = "";
      c.items.forEach((it) => {
        rows += '<div class="ard-row ' + it.status + '"><span class="ard-i">' + (ICONS[it.status] || "") + "</span>" +
          '<div class="ard-t"><b>' + esc(it.label) + "</b><span>" + esc(it.detail || "") + "</span>" +
          (it.advice ? '<em>' + esc(it.advice) + "</em>" : "") + "</div></div>";
      });
      sec.innerHTML = '<h3>' + (CAT_ICON[c.icon] || "") + " " + c.name + " <small>" + c.score + "/100</small></h3>" + rows;
      detail.appendChild(sec);
    });

    results.scrollIntoView({ behavior: "smooth" });
  }

  const ENGINE_ICON = {
    ChatGPT: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M12 3l1.6 4.2L18 8.8l-4.4 1.6L12 15l-1.6-4.6L6 8.8l4.4-1.6z"/></svg>',
    Gemini: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M12 3c.6 4.5 1.5 5.4 6 6-4.5.6-5.4 1.5-6 6-.6-4.5-1.5-5.4-6-6 4.5-.6 5.4-1.5 6-6Z"/></svg>',
    "Google AI": '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    Perplexity: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>',
  };

  function renderVis(v) {
    const box = document.getElementById("arVis");
    if (!v || !v.checked) { if (box) box.hidden = true; return; }
    box.hidden = false;
    box.classList.remove("tier-top", "tier-mid", "tier-absent");
    box.classList.add("tier-" + v.tier);
    document.getElementById("avQuery").textContent = "\u201c" + v.query + "\u201d";
    document.getElementById("avTitle").textContent =
      v.found ? (v.tier === "top" ? "Yes \u2014 you're in the results AI engines name first"
                                   : "You're visible, but not the top pick AI cites")
              : "Not yet \u2014 AI engines can't find you for this search";
    document.getElementById("avVerdict").textContent = v.verdict || "";

    const eng = document.getElementById("avEngines");
    eng.innerHTML = "";
    (v.engines || []).forEach((e) => {
      const ok = e.found;
      const el = document.createElement("div");
      el.className = "av-eng " + (ok ? "ok" : "no") + (e.real ? " real" : "");
      el.innerHTML =
        (e.real ? '<span class="ave-real">LIVE</span>' : "") +
        '<div class="ave-ic">' + (ENGINE_ICON[e.name] || "") + "</div>" +
        '<div class="ave-b"><b>' + e.name + "</b><small>" + esc(e.via) + "</small></div>" +
        '<span class="ave-tag">' + (ok ? (e.position ? "#" + e.position : "Named") : "Not named") + "</span>";
      eng.appendChild(el);
    });

    const comp = document.getElementById("avComp");
    const list = document.getElementById("avCompList");
    if (v.competitors && v.competitors.length && (!v.found || v.position > 1)) {
      comp.hidden = false;
      list.innerHTML = "";
      v.competitors.slice(0, 5).forEach((c) => {
        const li = document.createElement("li");
        li.innerHTML = '<b>' + esc(c.domain) + "</b><span>" + esc(c.title) + "</span>";
        list.appendChild(li);
      });
    } else {
      comp.hidden = true;
    }

    // Real, grounded Gemini answer (when an AI Studio key is configured)
    let gem = document.getElementById("avGem");
    const g = v.gemini;
    if (g && g.checked && g.answer) {
      if (!gem) {
        gem = document.createElement("div");
        gem.id = "avGem";
        gem.className = "av-gem";
        comp.parentNode.insertBefore(gem, comp.nextSibling);
      }
      gem.hidden = false;
      gem.className = "av-gem " + (g.named ? "ok" : "no");
      gem.innerHTML =
        '<div class="avg-head">' + (ENGINE_ICON.Gemini || "") +
        "<b>What Gemini actually answers</b>" +
        '<span class="avg-tag">' +
        (g.named ? (g.position ? "Names you #" + g.position : "Names you") : "Doesn't name you") +
        " \u00b7 live</span></div>" +
        '<p class="avg-verdict">' + esc(g.verdict || "") + "</p>" +
        '<blockquote class="avg-quote">' + esc(g.answer) + "</blockquote>" +
        '<small class="avg-src">Real Gemini answer with Google Search grounding (' +
        esc(g.model || "gemini") + ") \u2014 not invented.</small>";
    } else if (gem) {
      gem.hidden = true;
    }

    const note = "We ran your real query on live web results \u2014 the same index ChatGPT (via Bing), " +
      "Gemini & Google AI Overviews read from. We report exactly what we measured, never a fake \u201cAI recommends you\u201d.";
    document.getElementById("avNote").textContent = v.note ? v.note + " " + note : note;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // copy meta description
  document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "arMetaCopy") {
      const txt = document.getElementById("arMeta").textContent;
      navigator.clipboard.writeText(txt).then(() => {
        e.target.textContent = "Copied!";
        setTimeout(() => (e.target.textContent = "Copy"), 1600);
      });
    }
  });

  // ---------- PDF report ----------
  function hex(s) {
    if (s >= 85) return "#0EA98F";
    if (s >= 70) return "#14B8A6";
    if (s >= 50) return "#F59E0B";
    return "#F97362";
  }
  const MARK = { pass: ["#0EA98F", "\u2713"], warn: ["#F59E0B", "\u26A0"], fail: ["#F97362", "\u2717"], info: ["#6D28D9", "i"] };

  // Build the report as a list of atomic "blocks". Each block is rendered to
  // its own image and placed on a page without ever being sliced, so nothing
  // gets clipped across page breaks.
  function buildReportBlocks(d) {
    const sc = hex(d.overall_score);
    const v = d.ai_visibility;
    const B = []; // { html, pad } blocks, in order

    // Hero: score + grade + verdict
    B.push('<div style="display:flex;gap:18px;align-items:center;padding:18px 20px;border:1px solid #E7E1D5;border-radius:14px;background:linear-gradient(180deg,#FBF9F4,#fff)">' +
      '<div style="flex:0 0 auto;width:92px;height:92px;border-radius:50%;border:8px solid ' + sc + ';display:flex;flex-direction:column;align-items:center;justify-content:center">' +
      '<div style="font-family:\'Fraunces\',serif;font-size:30px;font-weight:700;line-height:1;color:#17150F">' + d.overall_score + '</div><div style="font-size:9px;color:#7a7568">/ 100</div></div>' +
      '<div style="flex:1"><span style="display:inline-block;background:' + sc + ';color:#fff;font-size:11px;font-weight:800;padding:3px 11px;border-radius:20px;text-transform:uppercase;letter-spacing:.05em">' + esc(d.grade || "") + '</span>' +
      '<h2 style="font-family:\'Fraunces\',serif;font-size:21px;margin:7px 0 4px;color:#17150F">Visibility score for ' + esc(d.host || "your site") + '</h2>' +
      '<p style="font-size:12.5px;color:#3f3a31;margin:0;line-height:1.5">' + esc((d.ai && d.ai.verdict) || "How customers and AI engines currently see your business.") + '</p></div></div>');

    // AI Search Visibility panel (engine cards as flex, not a fragile table)
    if (v && v.checked) {
      const eng = (v.engines || []).map((e) =>
        '<div style="flex:1 1 0;min-width:0;padding:10px 11px;border:1px solid #E7E1D5;border-radius:10px;background:#fff;position:relative">' +
        (e.real ? '<span style="position:absolute;top:7px;right:7px;font-size:8px;font-weight:800;color:#fff;background:#6D28D9;padding:1px 5px;border-radius:5px">LIVE</span>' : "") +
        '<div style="font-weight:800;font-size:13px;color:#17150F">' + e.name + '</div>' +
        '<div style="color:#7a7568;font-size:10px;margin:1px 0 6px">' + esc(e.via) + '</div>' +
        '<div style="display:inline-block;font-weight:800;font-size:11.5px;color:#fff;background:' + (e.found ? "#0EA98F" : "#C2410C") + ';padding:2px 9px;border-radius:14px">' +
        (e.found ? (e.position ? "#" + e.position : "Named") : "Not named") + '</div></div>').join("");
      let comp = "";
      if (v.competitors && v.competitors.length && (!v.found || v.position > 1)) {
        comp = '<p style="margin:12px 0 4px;font-weight:700;font-size:12.5px;color:#17150F">Who AI is naming instead:</p><ol style="margin:0 0 0 18px;padding:0;font-size:12px;color:#3f3a31">' +
          v.competitors.slice(0, 5).map((c) => '<li style="margin:2px 0"><b>' + esc(c.domain) + '</b> \u2014 ' + esc(c.title) + '</li>').join("") + '</ol>';
      }
      let gemBlk = "";
      const g = v.gemini;
      if (g && g.checked && g.answer) {
        gemBlk =
          '<div style="margin-top:12px;padding:13px 15px;border:1.5px solid #6D28D9;border-radius:12px;background:#F6F2FC">' +
          '<div style="font-size:12.5px;font-weight:800;color:#6D28D9">What Gemini actually answers \u00b7 ' +
          (g.named ? (g.position ? "names you #" + g.position : "names you") : "doesn\u2019t name you") + ' (live)</div>' +
          '<p style="margin:6px 0 8px;font-size:12px;color:#3f3a31;font-weight:600;line-height:1.5">' + esc(g.verdict || "") + '</p>' +
          '<div style="font-size:11.5px;font-style:italic;color:#5B554B;border-left:3px solid #6D28D9;padding:8px 12px;background:#fff;border-radius:0 8px 8px 0;line-height:1.55">' + esc(g.answer) + '</div>' +
          '<div style="font-size:9.5px;color:#7a7568;margin-top:7px">Real Gemini answer with Google Search grounding \u2014 not invented.</div></div>';
      }
      B.push('<div style="padding:16px 18px;border:2px solid #17150F;border-radius:14px;background:#FBF9F4">' +
        '<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#6D28D9;text-transform:uppercase">AI Search Visibility</div>' +
        '<p style="margin:7px 0 4px;font-size:13px;color:#17150F">Tested live query: <b>\u201c' + esc(v.query) + '\u201d</b></p>' +
        '<p style="margin:0 0 11px;font-size:12.5px;color:#3f3a31;line-height:1.5">' + esc(v.verdict) + '</p>' +
        '<div style="display:flex;gap:9px">' + eng + '</div>' + comp + gemBlk + '</div>');
    }

    // Category scores
    const cats = (d.categories || []).map((c) =>
      '<div style="margin:9px 0"><div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:700;color:#17150F"><span>' + c.name + '</span><span style="color:' + hex(c.score) + '">' + c.score + '/100</span></div>' +
      '<div style="height:9px;background:#EFEAE0;border-radius:6px;overflow:hidden;margin-top:4px"><div style="height:100%;width:' + c.score + '%;background:' + hex(c.score) + '"></div></div></div>'
    ).join("");
    B.push('<div style="padding:16px 18px;border:1px solid #E7E1D5;border-radius:14px;background:#fff">' +
      '<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#6D28D9;text-transform:uppercase;margin-bottom:6px">Category scores</div>' + cats + '</div>');

    // What to fix first
    if (d.ai && (d.ai.priorities || d.ai.meta_description)) {
      const pr = (d.ai.priorities || []).map((p, i) =>
        '<div style="margin:7px 0;font-size:12px;line-height:1.5"><b style="color:#17150F">' + (i + 1) + ". " + esc(p.action) + '</b><br><span style="color:#5B554B">' + esc(p.why) + '</span></div>').join("");
      const faqs = (d.ai.faqs || []).map((q) => '<li style="margin:2px 0">' + esc(q) + '</li>').join("");
      B.push('<div style="padding:16px 18px;border:1px solid #E7E1D5;border-radius:14px;background:#fff">' +
        '<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#6D28D9;text-transform:uppercase">What to fix first</div>' + pr +
        (d.ai.meta_description ? '<p style="margin:11px 0 3px;font-weight:700;font-size:12px;color:#17150F">Ready-to-use meta description</p><div style="font-size:11.5px;color:#3f3a31;background:#FBF9F4;border:1px solid #E7E1D5;border-radius:8px;padding:9px;line-height:1.5">' + esc(d.ai.meta_description) + '</div>' : "") +
        (faqs ? '<p style="margin:11px 0 3px;font-weight:700;font-size:12px;color:#17150F">FAQ questions to answer (for AI/voice)</p><ul style="margin:0 0 0 18px;padding:0;font-size:11.5px;color:#3f3a31">' + faqs + '</ul>' : "") + '</div>');
    }

    // Checklist section label (its own small block)
    B.push('<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#6D28D9;text-transform:uppercase;background:#fff;padding:4px 2px 6px;border-bottom:2px solid #6D28D9">Full checklist \u2014 every check explained</div>');
    // One block per category so rows are never sliced across pages
    (d.categories || []).forEach((c) => {
      const rows = c.items.map((it) => {
        const m = MARK[it.status] || MARK.info;
        return '<div style="display:flex;gap:9px;padding:7px 0;border-bottom:1px solid #F0EBE1">' +
          '<span style="color:' + m[0] + ';font-weight:800;width:14px;flex:0 0 14px">' + m[1] + '</span>' +
          '<div style="font-size:12px;line-height:1.5"><b style="color:#17150F">' + esc(it.label) + '</b> <span style="color:#5B554B">\u2014 ' + esc(it.detail || "") + '</span>' +
          (it.advice ? '<br><i style="color:#7a7568;font-size:11px">' + esc(it.advice) + '</i>' : "") + '</div></div>';
      }).join("");
      B.push('<div style="padding:13px 18px;border:1px solid #E7E1D5;border-radius:14px;background:#fff">' +
        '<div style="font-weight:800;font-size:13px;color:#17150F;border-bottom:2px solid #17150F;padding-bottom:5px;margin-bottom:3px">' + c.name + ' <span style="color:' + hex(c.score) + '">' + c.score + '/100</span></div>' + rows + '</div>');
    });

    // CTA band
    B.push('<div style="padding:16px 18px;background:#17150F;color:#fff;border-radius:14px;text-align:center">' +
      '<div style="font-family:\'Fraunces\',serif;font-size:16px">Want us to fix all of this for you?</div>' +
      '<div style="font-size:12px;color:#cfc9bd;margin:4px 0 0;line-height:1.5">Free deeper audit + fixed-price plan \u00b7 WhatsApp +91 70038 88936<br>geowallah.com \u00b7 rankme@geowallah.com</div></div>');

    return B;
  }

  function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

  function drawChrome(pdf, d, dt) {
    const pw = 210, ink = rgb("#17150F"), violet = rgb("#6D28D9"), gray = rgb("#5B554B");
    // Header wordmark
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(15);
    pdf.setTextColor(ink[0], ink[1], ink[2]); pdf.text("GEO", 12, 13);
    const w = pdf.getTextWidth("GEO");
    pdf.setTextColor(violet[0], violet[1], violet[2]); pdf.text("wallah", 12 + w, 13);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(8.5);
    pdf.setTextColor(gray[0], gray[1], gray[2]); pdf.text("AI & SEO Visibility Report", 12, 17.5);
    // Right meta
    pdf.setFontSize(8.5); pdf.setTextColor(gray[0], gray[1], gray[2]);
    pdf.text(dt, pw - 12, 12, { align: "right" });
    pdf.setFont("helvetica", "bold"); pdf.setTextColor(ink[0], ink[1], ink[2]);
    pdf.text(d.host || "", pw - 12, 16.5, { align: "right" });
    // Header rule
    pdf.setDrawColor(ink[0], ink[1], ink[2]); pdf.setLineWidth(0.6); pdf.line(12, 20, pw - 12, 20);
    // Footer
    pdf.setDrawColor(231, 225, 213); pdf.setLineWidth(0.3); pdf.line(12, 286, pw - 12, 286);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(8);
    pdf.setTextColor(154, 148, 134, 1);
    pdf.text("\u00a9 " + new Date().getFullYear() + " GEOwallah \u00b7 Made in Barrackpore", 12, 291);
  }

  // Fully NATIVE PDF (real text + vector shapes — no screenshots), so nothing
  // is ever clipped and the layout flows continuously with clean page breaks.
  function generatePdf(btn) {
    if (!lastData || !window.jspdf) {
      alert("Report tools are still loading — please try again in a moment.");
      return;
    }
    const old = btn.innerHTML;
    btn.disabled = true; btn.textContent = "Preparing PDF…";
    try {
      const d = lastData;
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("p", "mm", "a4");
      const M = 14, PW = 210, CW = PW - 2 * M, CTOP = 27, CBOT = 278;
      const PT = 0.3527777778; // pt -> mm
      const INK = "#17150F", GRY = "#5B554B", MUT = "#8A8475", VIO = "#6D28D9",
        LINE = "#E7E1D5", CREAM = "#FBF9F4", WHITE = "#FFFFFF";
      const dt = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      let y = CTOP;

      function rgbOf(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
      function tcol(h) { const c = rgbOf(h); pdf.setTextColor(c[0], c[1], c[2]); }
      function dcol(h) { const c = rgbOf(h); pdf.setDrawColor(c[0], c[1], c[2]); }
      function fcol(h) { const c = rgbOf(h); pdf.setFillColor(c[0], c[1], c[2]); }
      function font(style, size) { pdf.setFont("helvetica", style); pdf.setFontSize(size); }
      function lh(size, g) { return size * PT * (g || 1.32); }
      function meas(txt, w, size, style) { font(style || "normal", size); return pdf.splitTextToSize(String(txt == null ? "" : txt), w); }

      function chrome() {
        font("bold", 15); tcol(INK); pdf.text("GEO", M, 13);
        const w = pdf.getTextWidth("GEO"); tcol(VIO); pdf.text("wallah", M + w, 13);
        font("normal", 8.5); tcol(GRY); pdf.text("AI & SEO Visibility Report", M, 17.6);
        font("normal", 8.5); tcol(GRY); pdf.text(dt, PW - M, 11.5, { align: "right" });
        font("bold", 9); tcol(INK); pdf.text(d.host || "", PW - M, 16, { align: "right" });
        dcol(INK); pdf.setLineWidth(0.5); pdf.line(M, 20.5, PW - M, 20.5);
        dcol(LINE); pdf.setLineWidth(0.3); pdf.line(M, 283, PW - M, 283);
        font("normal", 7.5); tcol(MUT);
        pdf.text("\u00a9 " + new Date().getFullYear() + " GEOwallah \u00b7 Made in Barrackpore", M, 288);
        pdf.text("geowallah.com \u00b7 rankme@geowallah.com", PW - M, 288, { align: "right" });
      }
      function newpage() { pdf.addPage(); chrome(); y = CTOP; }
      function need(h) { if (y + h > CBOT) newpage(); }
      function gap(n) { y += n; }
      // wrapped paragraph; breaks per line across pages
      function para(txt, x, w, size, color, style, g) {
        const L = meas(txt, w, size, style); const H = lh(size, g);
        font(style || "normal", size); tcol(color || INK);
        for (const ln of L) { need(H); pdf.text(ln, x, y, { baseline: "top" }); y += H; }
        return L.length;
      }
      function kicker(t) {
        need(9); font("bold", 9); tcol(VIO);
        pdf.text(t.toUpperCase(), M, y, { baseline: "top", charSpace: 0.25 });
        y += lh(9, 1.0) + 2.2;
      }
      function icon(cx, cy, st) {
        const r = 2.0;
        if (st === "pass") { fcol("#0EA98F"); pdf.circle(cx, cy, r, "F"); dcol(WHITE); pdf.setLineWidth(0.5); pdf.line(cx - 1, cy + 0.05, cx - 0.2, cy + 0.9); pdf.line(cx - 0.2, cy + 0.9, cx + 1.1, cy - 0.85); }
        else if (st === "warn") { fcol("#F59E0B"); pdf.circle(cx, cy, r, "F"); dcol(WHITE); pdf.setLineWidth(0.5); pdf.line(cx, cy - 1, cx, cy + 0.3); fcol(WHITE); pdf.circle(cx, cy + 1.1, 0.32, "F"); }
        else if (st === "fail") { fcol("#F97362"); pdf.circle(cx, cy, r, "F"); dcol(WHITE); pdf.setLineWidth(0.5); pdf.line(cx - 0.8, cy - 0.8, cx + 0.8, cy + 0.8); pdf.line(cx - 0.8, cy + 0.8, cx + 0.8, cy - 0.8); }
        else { fcol(VIO); pdf.circle(cx, cy, r, "F"); }
      }

      chrome();

      // ---- HERO: score ring + grade + verdict ----
      {
        const ringR = 13, textX = M + 38, textW = CW - 40;
        const grade = (d.grade || "");
        const verdict = (d.ai && d.ai.verdict) || "How customers and AI engines currently see your business.";
        const titleL = meas("Visibility score for " + (d.host || "your site"), textW, 15, "bold");
        const verdL = meas(verdict, textW, 10, "normal");
        const textH = 8 + titleL.length * lh(15, 1.2) + 2 + verdL.length * lh(10, 1.35);
        const boxH = Math.max(36, textH + 12);
        need(boxH + 3);
        const top = y;
        fcol(CREAM); dcol(LINE); pdf.setLineWidth(0.3); pdf.roundedRect(M, top, CW, boxH, 3, 3, "FD");
        const cx = M + 8 + ringR, cy = top + boxH / 2;
        dcol("#EDE7DB"); pdf.setLineWidth(3.2); pdf.circle(cx, cy, ringR, "S");
        dcol(hex(d.overall_score)); pdf.setLineWidth(3.2); pdf.circle(cx, cy, ringR, "S");
        font("bold", 25); tcol(INK); pdf.text(String(d.overall_score), cx, cy + 0.5, { align: "center", baseline: "middle" });
        font("normal", 7.5); tcol(MUT); pdf.text("/ 100", cx, cy + 7, { align: "center", baseline: "middle" });
        let ty = top + (boxH - textH) / 2;
        font("bold", 8.5); const gw = pdf.getTextWidth(grade.toUpperCase()) + 9;
        fcol(hex(d.overall_score)); pdf.roundedRect(textX, ty, gw, 6.2, 3.1, 3.1, "F");
        tcol(WHITE); pdf.text(grade.toUpperCase(), textX + gw / 2, ty + 3.2, { align: "center", baseline: "middle", charSpace: 0.2 });
        ty += 9;
        font("bold", 15); tcol(INK); for (const ln of titleL) { pdf.text(ln, textX, ty, { baseline: "top" }); ty += lh(15, 1.2); }
        ty += 2;
        font("normal", 10); tcol(GRY); for (const ln of verdL) { pdf.text(ln, textX, ty, { baseline: "top" }); ty += lh(10, 1.35); }
        y = top + boxH + 7;
      }

      // ---- AI SEARCH VISIBILITY ----
      const v = d.ai_visibility;
      if (v && v.checked) {
        kicker("AI Search Visibility");
        para("Tested live query: \u201c" + (v.query || "") + "\u201d", M, CW, 10.5, INK, "bold", 1.3); gap(1);
        para(v.verdict || "", M, CW, 10, GRY, "normal", 1.4); gap(3.5);

        const cards = v.engines || [];
        const n = cards.length || 1, cg = 3, cwd = (CW - cg * (n - 1)) / n, ch = 23;
        need(ch + 4);
        const ctop = y;
        cards.forEach((e, i) => {
          const x = M + i * (cwd + cg);
          fcol(WHITE); dcol(LINE); pdf.setLineWidth(0.3); pdf.roundedRect(x, ctop, cwd, ch, 2.5, 2.5, "FD");
          font("bold", 10); tcol(INK); pdf.text(e.name || "", x + 4, ctop + 5.5, { baseline: "middle" });
          font("normal", 7); tcol(MUT);
          const via = meas(e.via || "", cwd - 8, 7, "normal"); let vy = ctop + 9;
          for (const ln of via.slice(0, 2)) { pdf.text(ln, x + 4, vy, { baseline: "top" }); vy += lh(7, 1.2); }
          const lbl = e.found ? (e.position ? "#" + e.position : "Named") : "Not named";
          font("bold", 8.5); const pw2 = pdf.getTextWidth(lbl) + 7;
          fcol(e.found ? "#0EA98F" : "#C2410C"); pdf.roundedRect(x + 4, ctop + ch - 8, pw2, 5.6, 2.8, 2.8, "F");
          tcol(WHITE); pdf.text(lbl, x + 4 + pw2 / 2, ctop + ch - 5.1, { align: "center", baseline: "middle" });
          if (e.real || e.name === "Gemini") {
            font("bold", 6.5); const lw = pdf.getTextWidth("LIVE") + 4;
            fcol(VIO); pdf.roundedRect(x + cwd - lw - 3, ctop + 3, lw, 4.2, 2, 2, "F");
            tcol(WHITE); pdf.text("LIVE", x + cwd - lw - 3 + lw / 2, ctop + 5.1, { align: "center", baseline: "middle" });
          }
        });
        y = ctop + ch + 6;

        const g = v.gemini;
        if (g && g.checked && g.answer) {
          const innerW = CW - 12;
          const t1 = "What Gemini actually answers \u00b7 " + (g.named ? (g.position ? "names you #" + g.position : "names you") : "doesn\u2019t name you") + " (live)";
          const t1L = meas(t1, innerW, 9.5, "bold");
          const vL = g.verdict ? meas(g.verdict, innerW, 9.5, "bold") : [];
          const aL = meas(g.answer, innerW - 4, 9, "italic");
          const boxH = 4 + t1L.length * lh(9.5, 1.3) + 1 + vL.length * lh(9.5, 1.3) + 2.5 + aL.length * lh(9, 1.4) + 3 + lh(7.5, 1.2) + 3;
          need(boxH + 3);
          const top = y;
          fcol("#F6F2FC"); dcol(VIO); pdf.setLineWidth(0.5); pdf.roundedRect(M, top, CW, boxH, 3, 3, "FD");
          let iy = top + 4;
          font("bold", 9.5); tcol(VIO); for (const ln of t1L) { pdf.text(ln, M + 6, iy, { baseline: "top" }); iy += lh(9.5, 1.3); }
          iy += 1;
          font("bold", 9.5); tcol(GRY); for (const ln of vL) { pdf.text(ln, M + 6, iy, { baseline: "top" }); iy += lh(9.5, 1.3); }
          iy += 2.5;
          dcol(VIO); pdf.setLineWidth(1.1); pdf.line(M + 6, iy + 0.5, M + 6, iy + aL.length * lh(9, 1.4) - 0.5);
          font("italic", 9); tcol("#5B554B"); for (const ln of aL) { pdf.text(ln, M + 10, iy, { baseline: "top" }); iy += lh(9, 1.4); }
          iy += 3;
          font("normal", 7.5); tcol(MUT); pdf.text("Real Gemini answer with Google Search grounding (" + (g.model || "") + ") \u2014 not invented.", M + 6, iy, { baseline: "top" });
          y = top + boxH + 6;
        }

        if (v.competitors && v.competitors.length && (!v.found || v.position > 1)) {
          para("Who AI is naming instead:", M, CW, 10, INK, "bold", 1.3); gap(0.5);
          v.competitors.slice(0, 5).forEach((c, i) => { para((i + 1) + ". " + (c.domain || "") + " \u2014 " + (c.title || ""), M + 2, CW - 2, 9.5, GRY, "normal", 1.35); gap(0.6); });
          gap(2.5);
        }
      }

      // ---- CATEGORY SCORES ----
      kicker("Category scores");
      (d.categories || []).forEach((c) => {
        need(11);
        font("bold", 10); tcol(INK); pdf.text(c.name, M, y, { baseline: "top" });
        font("bold", 10); tcol(hex(c.score)); pdf.text(c.score + "/100", PW - M, y, { align: "right", baseline: "top" });
        y += lh(10, 1.2) + 1.2;
        fcol("#EFEAE0"); pdf.roundedRect(M, y, CW, 2.8, 1.4, 1.4, "F");
        fcol(hex(c.score)); pdf.roundedRect(M, y, Math.max(2.8, CW * c.score / 100), 2.8, 1.4, 1.4, "F");
        y += 2.8 + 5.5;
      });
      gap(2);

      // ---- WHAT TO FIX FIRST ----
      if (d.ai && (d.ai.priorities || d.ai.meta_description)) {
        kicker("What to fix first");
        (d.ai.priorities || []).forEach((p, i) => {
          para((i + 1) + ". " + (p.action || ""), M, CW, 10, INK, "bold", 1.3); gap(0.5);
          if (p.why) para(p.why, M + 5, CW - 5, 9.5, GRY, "normal", 1.35);
          gap(2.8);
        });
        if (d.ai.meta_description) {
          para("Ready-to-use meta description", M, CW, 9.5, INK, "bold", 1.3); gap(1.2);
          const mL = meas(d.ai.meta_description, CW - 10, 9.5, "normal");
          const bH = mL.length * lh(9.5, 1.4) + 7; need(bH + 2);
          const top = y; fcol(CREAM); dcol(LINE); pdf.setLineWidth(0.3); pdf.roundedRect(M, top, CW, bH, 2.5, 2.5, "FD");
          let iy = top + 3.5; font("normal", 9.5); tcol(GRY); for (const ln of mL) { pdf.text(ln, M + 5, iy, { baseline: "top" }); iy += lh(9.5, 1.4); }
          y = top + bH + 4.5;
        }
        if (d.ai.faqs && d.ai.faqs.length) {
          para("FAQ questions to answer (for AI/voice search)", M, CW, 9.5, INK, "bold", 1.3); gap(1.2);
          d.ai.faqs.forEach((q) => {
            need(lh(9.5, 1.35)); font("bold", 9.5); tcol(VIO); pdf.text("\u2022", M + 2, y, { baseline: "top" });
            para(q, M + 7, CW - 7, 9.5, GRY, "normal", 1.35); gap(0.6);
          });
        }
        gap(2);
      }

      // ---- FULL CHECKLIST ----
      need(11);
      font("bold", 9.5); tcol(VIO); pdf.text("FULL CHECKLIST \u2014 EVERY CHECK EXPLAINED", M, y, { baseline: "top", charSpace: 0.25 });
      y += lh(9.5, 1.1) + 2;
      dcol(VIO); pdf.setLineWidth(0.5); pdf.line(M, y, PW - M, y); y += 4.5;
      (d.categories || []).forEach((c) => {
        need(13);
        font("bold", 11); tcol(INK); pdf.text(c.name, M, y, { baseline: "top" });
        font("bold", 11); tcol(hex(c.score)); pdf.text(c.score + "/100", PW - M, y, { align: "right", baseline: "top" });
        y += lh(11, 1.15) + 1.2;
        dcol(INK); pdf.setLineWidth(0.4); pdf.line(M, y, PW - M, y); y += 3.8;
        (c.items || []).forEach((it) => {
          const tx = M + 8, tw = CW - 8;
          const labL = meas(it.label, tw, 9.5, "bold");
          const detL = it.detail ? meas(it.detail, tw, 9, "normal") : [];
          const advL = it.advice ? meas(it.advice, tw, 8.5, "italic") : [];
          const rowH = labL.length * lh(9.5, 1.25) + detL.length * lh(9, 1.3) + advL.length * lh(8.5, 1.3) + 4.5;
          need(rowH);
          const rtop = y;
          icon(M + 2.2, rtop + 1.9, it.status);
          let iy = rtop;
          font("bold", 9.5); tcol(INK); for (const ln of labL) { pdf.text(ln, tx, iy, { baseline: "top" }); iy += lh(9.5, 1.25); }
          if (detL.length) { font("normal", 9); tcol(GRY); for (const ln of detL) { pdf.text(ln, tx, iy, { baseline: "top" }); iy += lh(9, 1.3); } }
          if (advL.length) { font("italic", 8.5); tcol(MUT); for (const ln of advL) { pdf.text(ln, tx, iy, { baseline: "top" }); iy += lh(8.5, 1.3); } }
          y = rtop + rowH;
          dcol("#F0EBE1"); pdf.setLineWidth(0.2); pdf.line(tx, y - 1.8, PW - M, y - 1.8);
        });
        y += 4;
      });

      // ---- CTA band (flows after checklist; no empty page) ----
      {
        const bh = 22; need(bh + 2);
        const top = y;
        fcol(INK); pdf.roundedRect(M, top, CW, bh, 3, 3, "F");
        font("bold", 13); tcol(WHITE); pdf.text("Want us to fix all of this for you?", PW / 2, top + 7, { align: "center", baseline: "middle" });
        font("normal", 9); tcol("#CFC9BD");
        pdf.text("Free deeper audit + fixed-price plan \u00b7 WhatsApp +91 70038 88936", PW / 2, top + 13, { align: "center", baseline: "middle" });
        pdf.text("geowallah.com \u00b7 rankme@geowallah.com", PW / 2, top + 17.5, { align: "center", baseline: "middle" });
        y = top + bh + 2;
      }

      const host = (d.host || "site").replace(/[^a-z0-9.-]/gi, "");
      pdf.save("GEOwallah-Audit-" + host + ".pdf");
    } catch (err) {
      alert("Sorry — couldn't generate the PDF. Please try again.");
    } finally {
      btn.disabled = false; btn.innerHTML = old;
    }
  }

  document.addEventListener("click", function (e) {
    const b = e.target && e.target.closest && e.target.closest("#arPdf");
    if (b) generatePdf(b);
  });

  // prefill from ?url=
  const q = new URLSearchParams(location.search).get("url");
  if (q) {
    document.getElementById("afUrl").value = q;
    form.requestSubmit();
  }
})();
