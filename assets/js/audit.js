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
      el.className = "av-eng " + (ok ? "ok" : "no");
      el.innerHTML =
        '<div class="ave-ic">' + (ENGINE_ICON[e.name] || "") + "</div>" +
        '<div class="ave-b"><b>' + e.name + "</b><small>" + esc(e.via) + "</small></div>" +
        '<span class="ave-tag">' + (ok ? (e.position ? "#" + e.position : "Found") : "Not found") + "</span>";
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

  function buildReportHTML(d) {
    const dt = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const sc = hex(d.overall_score);
    const v = d.ai_visibility;
    let vis = "";
    if (v && v.checked) {
      const eng = (v.engines || []).map((e) =>
        '<td style="padding:9px 10px;border:1px solid #E7E1D5;font-size:12.5px">' +
        '<b>' + e.name + '</b><br><span style="color:#7a7568;font-size:10.5px">' + esc(e.via) + '</span><br>' +
        '<span style="color:' + (e.found ? "#0EA98F" : "#C2410C") + ';font-weight:700">' +
        (e.found ? (e.position ? "Appears \u2014 #" + e.position : "Appears") : "Not found") + '</span></td>').join("");
      let comp = "";
      if (v.competitors && v.competitors.length && (!v.found || v.position > 1)) {
        comp = '<p style="margin:10px 0 4px;font-weight:700;font-size:12.5px">Who AI is naming instead:</p><ol style="margin:0 0 0 18px;padding:0;font-size:12px;color:#3f3a31">' +
          v.competitors.slice(0, 5).map((c) => '<li style="margin:2px 0"><b>' + esc(c.domain) + '</b> \u2014 ' + esc(c.title) + '</li>').join("") + '</ol>';
      }
      vis =
        '<div style="margin:16px 0;padding:16px 18px;border:2px solid #17150F;border-radius:12px;background:#FBF9F4">' +
        '<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#6D28D9;text-transform:uppercase">AI Search Visibility</div>' +
        '<p style="margin:6px 0 4px;font-size:13px">Tested live query: <b>\u201c' + esc(v.query) + '\u201d</b></p>' +
        '<p style="margin:0 0 10px;font-size:12.5px;color:#3f3a31">' + esc(v.verdict) + '</p>' +
        '<table style="border-collapse:collapse;width:100%"><tr>' + eng + '</tr></table>' + comp + '</div>';
    }
    const cats = (d.categories || []).map((c) =>
      '<div style="display:flex;align-items:center;gap:10px;margin:7px 0">' +
      '<div style="flex:1"><div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:700"><span>' + c.name + '</span><span style="color:' + hex(c.score) + '">' + c.score + '/100</span></div>' +
      '<div style="height:8px;background:#EFEAE0;border-radius:6px;overflow:hidden;margin-top:3px"><div style="height:100%;width:' + c.score + '%;background:' + hex(c.score) + '"></div></div></div></div>'
    ).join("");
    let aiBlk = "";
    if (d.ai && (d.ai.priorities || d.ai.meta_description)) {
      const pr = (d.ai.priorities || []).map((p, i) =>
        '<div style="margin:6px 0;font-size:12px"><b>' + (i + 1) + ". " + esc(p.action) + '</b><br><span style="color:#5B554B">' + esc(p.why) + '</span></div>').join("");
      const faqs = (d.ai.faqs || []).map((q) => '<li style="margin:2px 0">' + esc(q) + '</li>').join("");
      aiBlk =
        '<div style="margin:16px 0;padding:16px 18px;border:1px solid #E7E1D5;border-radius:12px;background:#fff">' +
        '<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#6D28D9;text-transform:uppercase">What to fix first</div>' + pr +
        (d.ai.meta_description ? '<p style="margin:10px 0 2px;font-weight:700;font-size:12px">Ready-to-use meta description</p><div style="font-size:11.5px;color:#3f3a31;background:#FBF9F4;border:1px solid #E7E1D5;border-radius:8px;padding:8px">' + esc(d.ai.meta_description) + '</div>' : "") +
        (faqs ? '<p style="margin:10px 0 2px;font-weight:700;font-size:12px">FAQ questions to answer (for AI/voice)</p><ul style="margin:0 0 0 18px;padding:0;font-size:11.5px;color:#3f3a31">' + faqs + '</ul>' : "") + '</div>';
    }
    const checklist = (d.categories || []).map((c) => {
      const rows = c.items.map((it) => {
        const m = MARK[it.status] || MARK.info;
        return '<div style="display:flex;gap:9px;padding:6px 0;border-bottom:1px solid #F0EBE1">' +
          '<span style="color:' + m[0] + ';font-weight:800;width:14px">' + m[1] + '</span>' +
          '<div style="font-size:12px"><b>' + esc(it.label) + '</b> <span style="color:#5B554B">\u2014 ' + esc(it.detail || "") + '</span>' +
          (it.advice ? '<br><i style="color:#7a7568;font-size:11px">' + esc(it.advice) + '</i>' : "") + '</div></div>';
      }).join("");
      return '<div style="margin-top:12px"><div style="font-weight:800;font-size:13px;border-bottom:2px solid #17150F;padding-bottom:4px">' + c.name + ' <span style="color:' + hex(c.score) + '">' + c.score + '/100</span></div>' + rows + '</div>';
    }).join("");

    return '<div style="font-family:\'Plus Jakarta Sans\',sans-serif;color:#17150F;width:754px;padding:0">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #17150F;padding-bottom:12px">' +
        '<div><div style="font-family:\'Fraunces\',serif;font-size:24px;font-weight:700">GEO<span style="color:#6D28D9">wallah</span></div>' +
        '<div style="font-size:11px;color:#5B554B">AI &amp; SEO Visibility Report</div></div>' +
        '<div style="text-align:right;font-size:11px;color:#5B554B">' + dt + '<br><b style="color:#17150F">' + esc(d.host || "") + '</b></div></div>' +
      '<div style="display:flex;gap:18px;align-items:center;margin:16px 0">' +
        '<div style="flex:0 0 auto;width:96px;height:96px;border-radius:50%;border:8px solid ' + sc + ';display:flex;flex-direction:column;align-items:center;justify-content:center">' +
        '<div style="font-family:\'Fraunces\',serif;font-size:30px;font-weight:700;line-height:1">' + d.overall_score + '</div><div style="font-size:9px;color:#7a7568">/ 100</div></div>' +
        '<div style="flex:1"><span style="display:inline-block;background:' + sc + ';color:#fff;font-size:11px;font-weight:800;padding:3px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:.05em">' + esc(d.grade || "") + '</span>' +
        '<h2 style="font-family:\'Fraunces\',serif;font-size:20px;margin:7px 0 4px">Visibility score for ' + esc(d.host || "your site") + '</h2>' +
        '<p style="font-size:12.5px;color:#3f3a31;margin:0">' + esc((d.ai && d.ai.verdict) || "How customers and AI engines currently see your business.") + '</p></div></div>' +
      vis +
      '<div style="margin:16px 0"><div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#6D28D9;text-transform:uppercase;margin-bottom:4px">Category scores</div>' + cats + '</div>' +
      aiBlk +
      '<div style="margin-top:18px"><div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#6D28D9;text-transform:uppercase">Full checklist \u2014 every check explained</div>' + checklist + '</div>' +
      '<div style="margin-top:20px;padding:14px 18px;background:#17150F;color:#fff;border-radius:12px;text-align:center">' +
        '<div style="font-family:\'Fraunces\',serif;font-size:15px">Want us to fix all of this for you?</div>' +
        '<div style="font-size:12px;color:#cfc9bd;margin:3px 0 0">Free deeper audit + fixed-price plan \u00b7 WhatsApp +91 70038 88936 \u00b7 geowallah.com \u00b7 rankme@geowallah.com</div></div>' +
      '<div style="text-align:center;font-size:10px;color:#9a9486;margin-top:8px">\u00a9 ' + new Date().getFullYear() + ' GEOwallah \u00b7 Made in Barrackpore \u00b7 GEO \u00b7 AEO \u00b7 SEO \u00b7 Local</div></div>';
  }

  async function generatePdf(btn) {
    if (!lastData || typeof html2canvas === "undefined" || !window.jspdf) {
      alert("Report tools are still loading — please try again in a moment.");
      return;
    }
    const old = btn.innerHTML;
    btn.disabled = true; btn.textContent = "Preparing PDF…";
    const holder = document.createElement("div");
    holder.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;background:#fff;padding:20px;box-sizing:border-box";
    holder.innerHTML = buildReportHTML(lastData);
    document.body.appendChild(holder);
    try {
      const canvas = await html2canvas(holder, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const img = canvas.toDataURL("image/jpeg", 0.92);
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("p", "mm", "a4");
      const pw = 210, ph = 297;
      const imgH = canvas.height * pw / canvas.width;
      let left = imgH, pos = 0;
      pdf.addImage(img, "JPEG", 0, pos, pw, imgH);
      left -= ph;
      while (left > 0) { pos -= ph; pdf.addPage(); pdf.addImage(img, "JPEG", 0, pos, pw, imgH); left -= ph; }
      const host = (lastData.host || "site").replace(/[^a-z0-9.-]/gi, "");
      pdf.save("GEOwallah-Audit-" + host + ".pdf");
    } catch (err) {
      alert("Sorry — couldn't generate the PDF. Please try again.");
    } finally {
      document.body.removeChild(holder);
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
