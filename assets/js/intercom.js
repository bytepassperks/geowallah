/* GEOwallah — Intercom Messenger (personalized live chat)
   Loads the Intercom Messenger site-wide for anonymous visitors and exposes
   window.GEOwallahIntercom so the free-audit page can make each chat
   context-aware (which site was audited, the score, the named AI rivals…). */
(function () {
  "use strict";

  var APP_ID = "by85lg4n";

  /* Boot settings. Brand colour, name, greeting and home screen are configured
     in the Intercom workspace; here we set placement (stacked above the
     WhatsApp float, bottom-right) and the page the visitor landed on. */
  window.intercomSettings = {
    api_base: "https://api-iam.intercom.io",
    app_id: APP_ID,
    alignment: "right",
    horizontal_padding: 22,
    vertical_padding: 96,
    site: "geowallah.com",
    entry_page: (location.pathname.split("/").pop() || "index.html")
  };

  /* Standard Intercom loader (anonymous visitors). */
  (function () {
    var w = window; var ic = w.Intercom;
    if (typeof ic === "function") {
      ic("reattach_activator");
      ic("update", w.intercomSettings);
    } else {
      var d = document;
      var i = function () { i.c(arguments); };
      i.q = []; i.c = function (args) { i.q.push(args); };
      w.Intercom = i;
      var l = function () {
        var s = d.createElement("script");
        s.type = "text/javascript"; s.async = true;
        s.src = "https://widget.intercom.io/widget/" + APP_ID;
        var x = d.getElementsByTagName("script")[0];
        x.parentNode.insertBefore(s, x);
      };
      if (document.readyState === "complete") { l(); }
      else if (w.attachEvent) { w.attachEvent("onload", l); }
      else { w.addEventListener("load", l, false); }
    }
  })();

  /* Helpers the rest of the site can call. */
  window.GEOwallahIntercom = {
    /* Attach the just-finished audit to the visitor's Intercom profile so a
       teammate (or Fin) sees exactly what the prospect saw, and fire an event
       outbound campaigns can target. */
    setAuditContext: function (a) {
      if (!window.Intercom || !a) return;
      var attrs = {};
      if (a.website) attrs.audited_website = a.website;
      if (a.business) attrs.business_name = a.business;
      if (a.city) attrs.business_city = a.city;
      if (a.category) attrs.business_category = a.category;
      if (a.score != null) attrs.audit_score = a.score;
      if (a.grade) attrs.audit_grade = a.grade;
      if (a.ai_query) attrs.ai_search_query = a.ai_query;
      if (a.ai_tier) attrs.ai_visibility = a.ai_tier;
      if (a.top_rival) attrs.top_ai_rival = a.top_rival;
      attrs.last_audit_at = Math.floor(Date.now() / 1000);
      try {
        window.Intercom("update", attrs);
        window.Intercom("trackEvent", "ran-free-audit", {
          website: a.website || "",
          score: (a.score == null ? "" : a.score),
          grade: a.grade || ""
        });
      } catch (e) { /* never block the page on chat */ }
    },
    open: function () { if (window.Intercom) try { window.Intercom("show"); } catch (e) {} },
    ask: function (text) { if (window.Intercom) try { window.Intercom("showNewMessage", text || ""); } catch (e) {} }
  };
})();
