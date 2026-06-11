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

  function render(d) {
    results.hidden = false;
    // host
    document.getElementById("arHost").textContent = d.host || "your site";
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

  // prefill from ?url=
  const q = new URLSearchParams(location.search).get("url");
  if (q) {
    document.getElementById("afUrl").value = q;
    form.requestSubmit();
  }
})();
