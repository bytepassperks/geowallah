#!/usr/bin/env python3
"""Generate the GEOwallah free-tools hub (/tools/) and each tool page.

Every tool page shares the same site chrome (nav, footer, scripts) and SEO
scaffolding (canonical, OG/Twitter, BreadcrumbList + SoftwareApplication +
FAQPage JSON-LD) so the suite is consistent and indexable. The interactive bit
is driven by assets/js/tools.js via data-* attributes on a single <form>.

Run from the repo root:  python3 scripts/gen_tools.py
"""
import html
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://geowallah.com"
CSSV = "20260619a"

NAV = """<header class="nav">
  <div class="container">
    <a class="brand" href="/index.html"><img class="logo" width="34" height="34" decoding="async" src="/assets/img/logo.png" alt="GEOwallah logo"><span><b>GEO</b>wallah</span></a>
    <nav class="nav-links">
      <a href="/index.html">Home</a><a href="/services.html">Services</a><a href="/pricing.html">Pricing</a><a href="/tools/">Free tools</a><a href="/blog.html">Blog</a><a href="/contact.html">Contact</a>
    </nav>
    <div class="nav-cta">
      <a class="btn btn-ghost btn-sm" href="/audit.html">Free audit</a>
      <a class="btn btn-primary btn-sm" href="https://wa.me/917003888936" target="_blank" rel="noopener">Talk to us</a>
    </div>
    <button class="nav-toggle" aria-label="Menu"><span></span><span></span><span></span></button>
  </div>
</header>"""

FOOTER = """<footer class="footer">
  <div class="container">
    <div class="foot-grid">
      <div>
        <a class="brand" href="/index.html"><img class="logo" width="34" height="34" decoding="async" src="/assets/img/logo.png" alt="GEOwallah"><span><b>GEO</b>wallah</span></a>
        <p>Get found on Google. Get cited by AI. Get chosen locally. AI-search optimization rooted in Barrackpore, serving all of India.</p>
      </div>
      <div><h4>Services</h4><a href="/services.html">AI GEO / LLM</a><a href="/services.html">SEO &amp; AI SEO</a><a href="/services.html">Local SEO &amp; GMB</a><a href="/services.html">Web Development</a><a href="/services.html">Content &amp; Citations</a></div>
      <div><h4>Free tools</h4><a href="/tools/">All tools</a><a href="/audit.html">SEO &amp; AI audit</a><a href="/tools/schema-markup-generator/">Schema generator</a><a href="/tools/ai-visibility-checker/">AI visibility checker</a></div>
      <div><h4>Company</h4><a href="/about.html">About</a><a href="/pricing.html">Pricing</a><a href="/blog.html">Blog</a><a href="/contact.html">Contact</a></div>
      <div><h4>Get in touch</h4><a href="tel:+917003888936">+91 70038 88936</a><a href="https://wa.me/917003888936">WhatsApp</a><a href="mailto:rankme@geowallah.com">rankme@geowallah.com</a><span style="color:#8b857a;font-size:.84rem;display:block;padding-top:8px">Barrackpore, North 24 Parganas, WB</span></div>
    </div>
    <div class="foot-bottom">
      <span>&copy; <span id="year">2025</span> GEOwallah. All rights reserved.</span>
      <span>Made in Barrackpore &#127470;&#127475; &middot; GEO &middot; AEO &middot; SEO &middot; Local</span>
    </div>
  </div>
</footer>

<a class="wa-float" href="https://wa.me/917003888936" target="_blank" rel="noopener" aria-label="WhatsApp">
  <svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.1-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.3.5-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.5c-.2.2-.3.4-.1.7.2.3.9 1.4 1.9 2.3 1.3 1.1 2.3 1.5 2.6 1.6.2.1.4.1.5-.1l.7-.9c.2-.2.4-.2.6-.1l2 .9c.3.1.4.2.4.4.1.2.1.9-.1 1.6Z"/></svg>
</a>
<script src="/assets/js/main.js"></script>"""


def head(title, desc, canonical, jsonld, extra_css="", og_type="website"):
    j = "\n".join('<script type="application/ld+json">\n' + json.dumps(b, indent=2, ensure_ascii=False) + "\n</script>" for b in jsonld)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-4SELDD1S1X"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-4SELDD1S1X');
</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{canonical}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta name="author" content="GEOwallah">
<meta name="geo.region" content="IN-WB">
<meta name="geo.placename" content="Barrackpore">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="GEOwallah">
<meta property="og:url" content="{canonical}">
<meta property="og:locale" content="en_IN">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:image" content="{SITE}/assets/img/og-default.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{html.escape(title)}">
<meta name="twitter:description" content="{html.escape(desc)}">
<meta name="twitter:image" content="{SITE}/assets/img/og-default.png">
<meta name="theme-color" content="#FAF7F1">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-32.png">
<link rel="apple-touch-icon" href="/assets/img/favicon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/style.css?v=20260611h">
<link rel="stylesheet" href="/assets/css/tools.css?v={CSSV}">{extra_css}
{j}
</head>
<body>
<div class="progress"></div>

{NAV}
"""


ORG = {"@id": f"{SITE}/#organization"}


def breadcrumb(name, url):
    return {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": "Free Tools", "item": f"{SITE}/tools/"},
            {"@type": "ListItem", "position": 3, "name": name, "item": url},
        ],
    }


def softwareapp(name, desc, url, category="BusinessApplication"):
    return {
        "@context": "https://schema.org", "@type": "WebApplication",
        "name": name, "url": url, "description": desc,
        "applicationCategory": category, "operatingSystem": "Web",
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "INR"},
        "provider": ORG,
    }


def faqpage(faqs):
    return {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q,
             "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs
        ],
    }


def faq_html(faqs):
    items = "".join(
        f'<div class="item"><button class="q">{html.escape(q)}<span class="pm">+</span></button>'
        f'<div class="a"><p>{a}</p></div></div>' for q, a in faqs)
    return f"""<section class="section">
  <div class="container">
    <div class="shead center" data-reveal><span class="kicker" style="justify-content:center"><span class="num">?</span><span class="dash"></span> FAQ</span><h2>Questions about this tool</h2></div>
    <div class="faq" data-reveal style="max-width:820px;margin:26px auto 0">{items}</div>
  </div>
</section>"""


def fields_html(fields):
    rows = []
    primary = fields[0]
    req = ' required' if primary.get("required") else ''
    rows.append(f"""      <div class="af-row">
        <label class="af-field af-grow"><span>{primary['label']} {'<i>*</i>' if primary.get('required') else '<small>(optional)</small>'}</span>
          <input type="text" id="{primary['id']}" data-field="{primary['field']}" placeholder="{primary['ph']}"{req}></label>
        <button type="submit" class="btn btn-primary af-go">{SUBMIT_DEFAULT}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
      </div>""")
    rest = fields[1:]
    if rest:
        cells = "".join(
            f'<label class="af-field"><span>{f["label"]} <small>(optional)</small></span>'
            f'<input type="text" id="{f["id"]}" data-field="{f["field"]}" placeholder="{f["ph"]}"></label>'
            for f in rest)
        rows.append(f'      <div class="af-row af-optional">{cells}</div>')
    return "\n".join(rows)


SUBMIT_DEFAULT = "Run it free"

# slug -> short label for cross-linking strips
ALL = [
    ("ai-visibility-checker", "AI Visibility Checker"),
    ("schema-markup-generator", "Schema Generator"),
    ("llms-txt-generator", "llms.txt Generator"),
    ("faq-schema-generator", "FAQ Schema Generator"),
    ("meta-description-generator", "Meta Description Generator"),
    ("nap-checker", "NAP Checker"),
    ("sitemap-generator", "Sitemap Generator"),
    ("website-security-checker", "Website Security Checker"),
    ("ai-visibility-badge", "AI Visibility Badge"),
]


def more_tools(current):
    links = "".join(f'<a href="/tools/{s}/">{l}</a>' for s, l in ALL if s != current)
    return f"""<section class="section" style="padding-top:0">
  <div class="container">
    <div class="shead center" data-reveal><h2 style="font-size:1.4rem">More free tools</h2></div>
    <div class="more-tools" data-reveal>{links}<a href="/tools/">All tools &rarr;</a></div>
  </div>
</section>"""


def cta_band(heading, desc, btn_text, btn_href):
    return f"""<section class="section">
  <div class="container">
    <div class="cta-band" data-reveal>
      <h2>{heading}</h2>
      <p class="lead">{desc}</p>
      <div class="cta-actions">
        <a class="btn btn-primary" href="{btn_href}">{btn_text}</a>
        <a class="btn btn-wa" href="https://wa.me/917003888936" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="#06351b"><path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.1-1.3A10 10 0 1 0 12 2Z"/></svg>
          Chat on WhatsApp</a>
      </div>
    </div>
  </div>
</section>"""


def how_html(title, steps):
    cards = "".join(
        f'<div class="block" style="text-align:left"><span class="kicker"><span class="num">{i+1}</span></span><h3 style="margin:10px 0 6px;font-size:1.1rem">{t}</h3><p>{d}</p></div>'
        for i, (t, d) in enumerate(steps))
    return f"""<section class="section">
  <div class="container">
    <div class="shead center" data-reveal><h2>{title}</h2></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:28px" data-reveal>{cards}</div>
  </div>
</section>"""


def tool_page(t):
    url = f"{SITE}/tools/{t['slug']}/"
    jsonld = [breadcrumb(t["h1"], url),
              softwareapp(t["sa_name"], t["sa_desc"], url, t.get("category", "BusinessApplication")),
              faqpage(t["faqs"])]
    parts = [head(t["meta_title"], t["meta_desc"], url, jsonld)]
    loading_steps = "".join(f"<li>{s}</li>" for s in t["loading_steps"])
    parts.append(f"""
<section class="section audit-hero">
  <div class="container">
    <div class="shead center" data-reveal>
      <span class="kicker" style="justify-content:center"><span class="num">&#10022;</span><span class="dash"></span> Free instant tool &middot; no signup</span>
      <h1 style="font-size:clamp(2.1rem,5vw,3.5rem);margin:14px 0">{t['h1']}</h1>
      <p class="lead">{t['lead']}</p>
    </div>

    <form data-tool data-endpoint="{t['endpoint']}"{(' data-kind="' + t['kind'] + '"') if t.get('kind') else ''} data-render="{t['render']}" data-filename="{t.get('filename','output.txt')}" class="audit-form tool-form block" data-reveal>
{fields_html(t['fields'])}
      <p class="af-hint">{t.get('hint','Free &middot; no signup &middot; results in seconds.')}</p>
    </form>

    <div id="tLoading" class="t-loading block" hidden>
      <div class="t-spinner"></div>
      <h3>{t.get('loading_title','Working&hellip;')}</h3>
      <ul class="al-steps" style="justify-content:center">{loading_steps}</ul>
    </div>

    <div id="tError" class="t-error" hidden>
      <h3>We couldn't run that automatically</h3>
      <p data-msg></p>
      <div class="cta-actions" style="justify-content:center;margin-top:12px">
        <a class="btn btn-wa" href="https://wa.me/917003888936" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="#06351b"><path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.1-1.3A10 10 0 1 0 12 2Z"/></svg>
          Get it done for free</a>
      </div>
    </div>

    <div id="tOut" class="t-out block" hidden></div>
  </div>
</section>
""")
    parts.append(f"""<section class="section" style="padding-top:0">
  <div class="container" style="max-width:820px">
    <div data-reveal>{t['intro_html']}</div>
  </div>
</section>""")
    parts.append(how_html(t["how_title"], t["how_steps"]))
    parts.append(faq_html(t["faqs"]))
    parts.append(cta_band(*t["cta"]))
    parts.append(more_tools(t["slug"]))
    parts.append(FOOTER)
    parts.append('<script src="/assets/js/tools.js?v=20260619a"></script>\n</body>\n</html>')
    return "\n".join(parts)


# --------------------------------------------------------------------- tool data
TOOLS = [
    {
        "slug": "ai-visibility-checker",
        "h1": "Free AI Visibility Checker",
        "meta_title": "Free AI Visibility Checker — Does ChatGPT & Gemini Name You? | GEOwallah",
        "meta_desc": "Check whether ChatGPT, Gemini, Google AI Overviews and Perplexity name your business — free, instant, no signup. See who AI recommends instead and how to fix it.",
        "lead": "See whether AI engines actually name your business when customers ask. We run a real, live query and show you which engines mention you, where you rank, and who they recommend instead.",
        "endpoint": "/aivisibility", "kind": "", "render": "aivis",
        "fields": [
            {"id": "tUrl", "field": "url", "label": "Your website", "ph": "yourbusiness.com", "required": True},
            {"id": "tName", "field": "business_name", "label": "Business name", "ph": "e.g. Emily's Pet Heaven"},
            {"id": "tCity", "field": "city", "label": "City / area", "ph": "e.g. Barrackpore"},
            {"id": "tCat", "field": "category", "label": "Category", "ph": "e.g. pet boarding"},
        ],
        "hint": "Add your category &amp; city for a sharper non-branded check.",
        "loading_title": "Asking the AI engines&hellip;",
        "loading_steps": ["Building your money-query", "Running live search", "Checking Gemini &amp; AI Overviews", "Scoring your visibility"],
        "intro_html": "<h2>Why AI visibility matters now</h2><p>More and more customers skip the ten blue links entirely and just ask ChatGPT, Gemini or Perplexity &ldquo;who's the best&hellip; near me?&rdquo; If those engines don't name your business, you're invisible to a fast-growing slice of buyers &mdash; no matter how good your classic SEO is.</p><p>This checker runs the real query a customer would ask and reports exactly what we measured: whether you're named, roughly where you rank, and which competitors the engines surface instead. It's the same live-index signal our paid <a href=\"/services.html\">AI search (GEO/AEO) optimization</a> is built to move.</p>",
        "how_title": "How the AI visibility check works",
        "how_steps": [
            ("We build your money-query", "From your business name, category and city we construct the question a real customer would ask an AI engine."),
            ("We run it live", "We query the live web index that ChatGPT/Bing, Gemini, Google AI Overviews and Perplexity all read from."),
            ("You get the verdict", "See which engines name you, your rough position, and the competitors AI recommends instead &mdash; plus the highest-impact fix."),
        ],
        "faqs": [
            ("How can ChatGPT recommend my business?", "AI engines answer from a live web index (ChatGPT and Perplexity read Bing's; Gemini and Google AI Overviews read Google's). To be recommended you need to rank in that index for the question customers ask, with consistent, citable information about your business. That's exactly what GEO/AEO optimization builds."),
            ("Is this AI visibility checker really free?", "Yes &mdash; it's completely free with no signup. Enter your website (and optionally your name, city and category for a sharper check) and you get an instant live result."),
            ("Why does it say I'm not named?", "Usually because you don't yet rank in the live results AI engines read, or your business information isn't consistent and citable across the web. Our free full <a href=\"/audit.html\">SEO &amp; AI audit</a> shows the specific fixes, and our GEO/AEO service implements them."),
            ("Which AI engines do you check?", "We report on ChatGPT (reads Bing/live web), Gemini, Google AI Overviews and Perplexity. The grounded Gemini answer is a real, live check; the others share the same live-index signal."),
        ],
        "cta": ("Want AI engines to name <span class=\"mark\">you</span>?",
                "We make your business the consistent, citable answer ChatGPT and Gemini reach for. Start with a free audit and a clear plan.",
                "Get my free audit", "/audit.html"),
        "sa_name": "GEOwallah AI Visibility Checker",
        "sa_desc": "Free tool to check whether ChatGPT, Gemini, Google AI Overviews and Perplexity name a business in live results.",
    },
    {
        "slug": "schema-markup-generator",
        "h1": "Free Schema Markup Generator",
        "meta_title": "Free Schema Markup Generator (LocalBusiness JSON-LD) | GEOwallah",
        "meta_desc": "Generate valid LocalBusiness schema markup (JSON-LD) from your real website — phone, address, geo and maps auto-detected. Free, instant, copy-paste ready. No signup.",
        "lead": "Generate clean, valid LocalBusiness JSON-LD built from your real page &mdash; we auto-detect your phone, address, map and geo so the markup reflects your actual business, not placeholder stubs.",
        "endpoint": "/generate", "kind": "schema", "render": "text", "filename": "schema.html",
        "fields": [
            {"id": "tUrl", "field": "url", "label": "Your website", "ph": "yourbusiness.com", "required": True},
            {"id": "tName", "field": "business_name", "label": "Business name", "ph": "e.g. Emily's Pet Heaven"},
            {"id": "tCity", "field": "city", "label": "City / area", "ph": "e.g. Barrackpore"},
        ],
        "loading_title": "Reading your page &amp; building schema&hellip;",
        "loading_steps": ["Fetching your site", "Detecting phone, address &amp; geo", "Assembling JSON-LD"],
        "intro_html": "<h2>Why schema markup matters</h2><p>Schema markup (structured data) tells Google, Bing and AI engines exactly what your business is &mdash; your name, phone, address, hours and location &mdash; in a machine-readable format. It powers rich results, the Map Pack, voice answers and AI citations. Pages with correct <code>LocalBusiness</code> schema are far easier for both search engines and LLMs to understand and recommend.</p><p>Most generators invent placeholder data. Ours reads your real page and reuses any phone, address, geo and map it finds, so the output is accurate from the first paste. Anything we genuinely can't detect is clearly marked for you to fill in.</p>",
        "how_title": "How the schema generator works",
        "how_steps": [
            ("Enter your URL", "We fetch your live page and scan it for contact details, existing structured data, maps and geo signals."),
            ("We build the JSON-LD", "A valid LocalBusiness block is assembled from what we found &mdash; never invented placeholder data."),
            ("Copy &amp; paste", "Drop the script into your page's <code>&lt;head&gt;</code>. We flag any field you should complete by hand."),
        ],
        "faqs": [
            ("What is schema markup / JSON-LD?", "Schema markup is structured data you add to a page so search engines and AI understand it. JSON-LD is Google's recommended format &mdash; a small script in your page head that describes your business, products or content."),
            ("Will this schema validate?", "Yes &mdash; we output well-formed LocalBusiness JSON-LD. After pasting it in, you can confirm with Google's Rich Results Test. Fill any fields we marked as missing first."),
            ("Do I need schema for AI search?", "It helps a lot. Clear structured data makes your business easier for ChatGPT, Gemini and AI Overviews to parse and cite. It's a core part of <a href=\"/services.html\">AEO/GEO optimization</a>."),
            ("Can you add the schema for me?", "Absolutely &mdash; we implement schema, fix validation errors and add the right types across your whole site as part of our <a href=\"/services.html\">technical SEO</a> work. <a href=\"/contact.html\">Get in touch</a>."),
        ],
        "cta": ("Want schema done <span class=\"mark\">right</span>, site-wide?",
                "We add the correct structured data across every page &mdash; LocalBusiness, FAQ, Article, Breadcrumb and more &mdash; so you win rich results and AI citations.",
                "Get my free audit", "/audit.html"),
        "sa_name": "GEOwallah Schema Markup Generator",
        "sa_desc": "Free tool that generates valid LocalBusiness JSON-LD schema from a real website.",
        "category": "DeveloperApplication",
    },
    {
        "slug": "llms-txt-generator",
        "h1": "Free llms.txt Generator",
        "meta_title": "Free llms.txt Generator — Help AI Crawlers Understand Your Site | GEOwallah",
        "meta_desc": "Generate an llms.txt file for your website in one click — the emerging standard that tells AI crawlers (ChatGPT, Claude, Gemini) which pages matter. Free, no signup.",
        "lead": "Create an <code>llms.txt</code> file for your site in one click. It's the emerging standard that points AI crawlers and LLMs at your most important pages &mdash; built straight from your real site structure.",
        "endpoint": "/generate", "kind": "llms", "render": "text", "filename": "llms.txt",
        "fields": [
            {"id": "tUrl", "field": "url", "label": "Your website", "ph": "yourbusiness.com", "required": True},
            {"id": "tName", "field": "business_name", "label": "Site / brand name", "ph": "e.g. GEOwallah"},
            {"id": "tDesc", "field": "description", "label": "One-line summary", "ph": "what your business does"},
        ],
        "loading_title": "Mapping your site for AI&hellip;",
        "loading_steps": ["Fetching your site", "Finding key pages", "Writing llms.txt"],
        "intro_html": "<h2>What is llms.txt and why add it?</h2><p><code>llms.txt</code> is a simple Markdown file you place at your domain root (like <code>robots.txt</code>) that gives AI models a clean, curated map of your most important pages and a short description of your business. As ChatGPT, Claude, Gemini and Perplexity increasingly read sites to answer questions, <code>llms.txt</code> helps them find and cite the right content instead of guessing.</p><p>It's early, low-competition, and easy to ship &mdash; exactly the kind of forward-looking signal that supports <a href=\"/services.html\">GEO and LLM optimization</a>. Our generator builds a sensible starting file from your real site so you can publish it today.</p>",
        "how_title": "How the llms.txt generator works",
        "how_steps": [
            ("Enter your URL", "We read your site, your title and description, and your key internal pages."),
            ("We write the file", "You get a standards-shaped llms.txt with your summary and a curated list of important pages."),
            ("Publish at /llms.txt", "Save the file and upload it to your domain root so AI crawlers can find it."),
        ],
        "faqs": [
            ("Where do I put the llms.txt file?", "At the root of your domain, so it's reachable at <code>yourdomain.com/llms.txt</code> &mdash; the same place robots.txt lives."),
            ("Is llms.txt an official standard?", "It's an emerging, widely-discussed convention (llmstxt.org) that a growing number of AI tools support. It's low-risk and quick to add, and positions you ahead of competitors for AI search."),
            ("Will llms.txt instantly get me cited by ChatGPT?", "No single file does that &mdash; AI citation depends on ranking and consistent, citable content. But llms.txt makes your key pages easier to discover and is part of a complete <a href=\"/services.html\">GEO/AEO</a> setup."),
            ("Can you set this up across my site?", "Yes &mdash; we ship llms.txt, robots rules, schema and the rest of the AI-discoverability stack as part of our optimization work. <a href=\"/contact.html\">Talk to us</a>."),
        ],
        "cta": ("Be the <span class=\"mark\">answer</span> AI engines cite",
                "llms.txt is one piece. We build the full GEO/AEO stack so ChatGPT and Gemini find, trust and recommend your business.",
                "Get my free audit", "/audit.html"),
        "sa_name": "GEOwallah llms.txt Generator",
        "sa_desc": "Free tool that generates an llms.txt file for a website to guide AI crawlers and LLMs.",
        "category": "DeveloperApplication",
    },
    {
        "slug": "faq-schema-generator",
        "h1": "Free FAQ Schema Generator",
        "meta_title": "Free FAQ Schema Generator (FAQPage JSON-LD) for AI & Voice | GEOwallah",
        "meta_desc": "Generate AI- and voice-search-optimized FAQs with FAQPage JSON-LD for your business — free, instant, copy-paste ready. Win answer-engine and rich results. No signup.",
        "lead": "Generate a set of sharp, answer-engine-optimized FAQs for your business &mdash; ready for both your page and as FAQPage structured data. Perfect for voice search, AI Overviews and rich results.",
        "endpoint": "/generate", "kind": "faq", "render": "text", "filename": "faqs.txt",
        "fields": [
            {"id": "tName", "field": "business_name", "label": "Business name", "ph": "e.g. Emily's Pet Heaven", "required": True},
            {"id": "tCity", "field": "city", "label": "City / area", "ph": "e.g. Barrackpore"},
            {"id": "tDesc", "field": "description", "label": "What you do", "ph": "e.g. pet boarding &amp; daycare"},
        ],
        "hint": "Add your city &amp; what you do for sharper, on-point FAQs.",
        "loading_title": "Writing your FAQs&hellip;",
        "loading_steps": ["Understanding your business", "Drafting questions &amp; answers", "Optimizing for AI &amp; voice"],
        "intro_html": "<h2>Why FAQs win AI &amp; voice search</h2><p>Answer engines and voice assistants love clean question-and-answer content &mdash; it maps directly to how people ask things out loud and how AI Overviews format replies. A well-built FAQ section, marked up with <code>FAQPage</code> schema, can earn rich results, feed voice answers, and give ChatGPT and Gemini quotable snippets about your business.</p><p>This tool drafts concise, natural FAQs tailored to your business and city. Pair them with the matching JSON-LD (our <a href=\"/tools/schema-markup-generator/\">schema generator</a> helps) and you've covered a key part of <a href=\"/services.html\">AEO</a>.</p>",
        "how_title": "How the FAQ generator works",
        "how_steps": [
            ("Describe your business", "Enter your name, city and what you do so the questions are specific, not generic."),
            ("We draft Q&amp;As", "You get five concise, voice- and AI-friendly questions with tight answers."),
            ("Publish &amp; mark up", "Add them to your page and wrap them in FAQPage JSON-LD for rich results."),
        ],
        "faqs": [
            ("What is FAQ schema (FAQPage)?", "FAQPage is structured data that labels your questions and answers so Google and AI engines can read them directly &mdash; enabling rich results and feeding voice and AI Overview answers."),
            ("Are these FAQs ready to publish?", "They're a strong, on-brand draft. Give them a quick human review for accuracy and voice, then publish and add the JSON-LD markup."),
            ("How does this help with AI search?", "Q&amp;A content is exactly what answer engines quote. Clear FAQs make your business easier for ChatGPT, Gemini and AI Overviews to cite &mdash; a core part of <a href=\"/services.html\">AEO/GEO</a>."),
            ("Can you build and mark up FAQs for me?", "Yes &mdash; we research the real questions your customers ask, write the answers and add the schema across your site. <a href=\"/contact.html\">Get in touch</a>."),
        ],
        "cta": ("Win the <span class=\"mark\">answer box</span> &amp; voice search",
                "We build FAQ content and schema that earns rich results and gets your business quoted by AI engines.",
                "Get my free audit", "/audit.html"),
        "sa_name": "GEOwallah FAQ Schema Generator",
        "sa_desc": "Free tool that generates AI- and voice-optimized FAQs with FAQPage JSON-LD for a business.",
    },
    {
        "slug": "meta-description-generator",
        "h1": "Free Meta Description Generator",
        "meta_title": "Free Meta Description Generator (SEO, AI-written) | GEOwallah",
        "meta_desc": "Generate a compelling, click-worthy SEO meta description for your business in seconds — AI-written, the right length, no placeholders. Free, instant, no signup.",
        "lead": "Generate a compelling, properly-sized SEO meta description for your business in seconds &mdash; written to earn clicks from the search results, with no robotic placeholders.",
        "endpoint": "/generate", "kind": "meta", "render": "text", "filename": "meta-description.txt",
        "fields": [
            {"id": "tName", "field": "business_name", "label": "Business name", "ph": "e.g. Emily's Pet Heaven", "required": True},
            {"id": "tCity", "field": "city", "label": "City / area", "ph": "e.g. Barrackpore"},
            {"id": "tDesc", "field": "description", "label": "What you do", "ph": "e.g. pet boarding &amp; daycare"},
        ],
        "hint": "Add your city &amp; what you do for a sharper, on-brand description.",
        "loading_title": "Writing your meta description&hellip;",
        "loading_steps": ["Understanding your business", "Drafting options", "Trimming to the right length"],
        "intro_html": "<h2>Why your meta description matters</h2><p>Your meta description is the snippet that appears under your title in Google's results. It doesn't directly rank you, but a sharp, benefit-led description dramatically improves click-through rate &mdash; and higher CTR is itself a positive signal. A vague or auto-truncated description leaves clicks (and customers) on the table.</p><p>This tool writes a natural, click-worthy description at the right length for your business, with no <code>[City]</code> or <code>[Service]</code> placeholders. Add your city and what you do for an even sharper result.</p>",
        "how_title": "How the meta description generator works",
        "how_steps": [
            ("Describe your business", "Enter your name and, ideally, your city and what you do."),
            ("AI writes it", "You get a compelling description sized to display fully in Google."),
            ("Paste it in", "Drop it into your page's meta description tag &mdash; done."),
        ],
        "faqs": [
            ("How long should a meta description be?", "Aim for roughly 150&ndash;160 characters so it displays fully in Google without being cut off. This tool keeps within that range."),
            ("Does a meta description affect rankings?", "Not directly, but a compelling one lifts click-through rate, which helps your visibility. It's an easy, high-leverage win."),
            ("Can I generate page titles too?", "Yes &mdash; titles are part of the same on-page foundation we optimize. For full title and meta work across your site, <a href=\"/contact.html\">talk to us</a>."),
            ("Will it work for any business?", "Yes. Add your name, city and what you do and it'll produce a natural, accurate description &mdash; no placeholders."),
        ],
        "cta": ("Want every page <span class=\"mark\">optimized</span>?",
                "Titles, meta, headings, internal links and schema across your whole site &mdash; we handle the on-page foundation that makes everything else rank.",
                "Get my free audit", "/audit.html"),
        "sa_name": "GEOwallah Meta Description Generator",
        "sa_desc": "Free AI tool that writes SEO meta descriptions for a business at the right length.",
    },
    {
        "slug": "nap-checker",
        "h1": "Free NAP Consistency Checker",
        "meta_title": "Free NAP Checker — Name, Address & Phone for Local SEO | GEOwallah",
        "meta_desc": "Check your website's NAP (Name, Address, Phone) signals for local SEO in one click — see what Google and maps can read, and what's missing. Free, instant, no signup.",
        "lead": "Check the Name, Address and Phone signals on your website in one click. Consistent NAP is a core local-ranking factor &mdash; we show you exactly what Google, maps and AI can read, and what's missing.",
        "endpoint": "/nap", "kind": "", "render": "nap",
        "fields": [
            {"id": "tUrl", "field": "url", "label": "Your website", "ph": "yourbusiness.com", "required": True},
        ],
        "loading_title": "Reading your NAP signals&hellip;",
        "loading_steps": ["Fetching your page", "Detecting name, phone &amp; address", "Checking structured data"],
        "intro_html": "<h2>Why NAP consistency drives local rankings</h2><p>NAP stands for <b>Name, Address, Phone</b>. Google and the Map Pack rank local businesses partly on how <i>consistent</i> these details are across your website, your Google Business Profile and every directory you're listed in. Mismatches (an old number here, a different address there) confuse search engines and quietly suppress your local ranking.</p><p>This checker reads your page and reports which NAP signals are clearly present in your content and structured data &mdash; the foundation Google needs to trust and rank you locally. Fixing gaps here is one of the highest-ROI local-SEO moves.</p>",
        "how_title": "How the NAP checker works",
        "how_steps": [
            ("Enter your URL", "We fetch your page and scan its text and structured data."),
            ("We extract your NAP", "You see the business name, phone and address we could detect &mdash; the way a search engine would."),
            ("Fix the gaps", "Anything missing is flagged, so you can add it to your page and LocalBusiness schema."),
        ],
        "faqs": [
            ("What is NAP in local SEO?", "NAP = Name, Address, Phone. Keeping it identical across your site, Google Business Profile and directories is a key local-ranking and Map Pack signal."),
            ("Why is my address or phone 'not found'?", "Usually it isn't in your page text or your LocalBusiness schema in a machine-readable way. Add a tel: link and a PostalAddress in your structured data &mdash; our <a href=\"/tools/schema-markup-generator/\">schema generator</a> helps."),
            ("Does NAP consistency really affect ranking?", "Yes &mdash; inconsistent NAP across the web is a well-known cause of weak local rankings. Cleaning it up often produces quick Map Pack gains."),
            ("Can you fix my citations for me?", "Yes &mdash; we audit and correct your NAP across Google Business Profile and dozens of directories as part of our <a href=\"/local-seo/\">local SEO &amp; citations</a> service."),
        ],
        "cta": ("Rank in the <span class=\"mark\">Map Pack</span>",
                "We make your NAP consistent everywhere, optimize your Google Business Profile and build local citations that move rankings.",
                "Get my free audit", "/audit.html"),
        "sa_name": "GEOwallah NAP Consistency Checker",
        "sa_desc": "Free tool that checks a website's Name, Address and Phone signals for local SEO.",
    },
    {
        "slug": "sitemap-generator",
        "h1": "Free XML Sitemap Generator",
        "meta_title": "Free XML Sitemap Generator — Build sitemap.xml Instantly | GEOwallah",
        "meta_desc": "Generate an XML sitemap (sitemap.xml) from your website in one click — list your pages for Google and Bing to crawl. Free, instant, copy-paste ready. No signup.",
        "lead": "Generate a clean <code>sitemap.xml</code> from your website in one click &mdash; a tidy list of your pages for Google and Bing to crawl, so nothing important gets missed.",
        "endpoint": "/generate", "kind": "sitemap", "render": "text", "filename": "sitemap.xml",
        "fields": [
            {"id": "tUrl", "field": "url", "label": "Your website", "ph": "yourbusiness.com", "required": True},
        ],
        "loading_title": "Crawling your links&hellip;",
        "loading_steps": ["Fetching your site", "Collecting internal pages", "Building sitemap.xml"],
        "intro_html": "<h2>Why you need an XML sitemap</h2><p>An XML sitemap is a list of your site's pages that tells search engines what to crawl and index. It's especially helpful for newer sites, large sites, or pages that aren't well linked internally. Submitting a sitemap in Google Search Console and Bing Webmaster Tools is one of the simplest ways to speed up discovery of your content.</p><p>This tool builds a sitemap from the internal links it finds on your page. For a site that updates often (like a blog), the best setup is a sitemap that regenerates automatically on every deploy &mdash; ask us how.</p>",
        "how_title": "How the sitemap generator works",
        "how_steps": [
            ("Enter your URL", "We fetch your page and collect the internal links pointing to your own pages."),
            ("We build the XML", "You get a well-formed sitemap.xml listing your pages, ready to publish."),
            ("Submit it", "Upload it to your root and submit the URL in Google Search Console and Bing."),
        ],
        "faqs": [
            ("Where do I put sitemap.xml?", "At your domain root (<code>yourdomain.com/sitemap.xml</code>), then submit that URL under Sitemaps in Google Search Console and Bing Webmaster Tools."),
            ("How is this different from an auto-generated sitemap?", "This builds a one-time sitemap from your current links. For sites that publish often, an automated generator that rebuilds the sitemap on every deploy is better &mdash; we build those too."),
            ("Will a sitemap make Google index me faster?", "It helps Google discover your pages, but indexing still depends on quality and crawl budget. Combine it with strong internal links and fresh content."),
            ("Can you automate my sitemap and indexing?", "Yes &mdash; we set up auto-regenerating sitemaps plus automatic submission to Google and IndexNow so new pages are found fast. <a href=\"/contact.html\">Talk to us</a>."),
        ],
        "cta": ("Get <span class=\"mark\">crawled &amp; indexed</span> faster",
                "We set up auto-regenerating sitemaps, clean internal linking and automatic indexing so Google finds your new pages within hours, not weeks.",
                "Get my free audit", "/audit.html"),
        "sa_name": "GEOwallah XML Sitemap Generator",
        "sa_desc": "Free tool that generates an XML sitemap (sitemap.xml) from a website's internal links.",
        "category": "DeveloperApplication",
    },
    {
        "slug": "website-security-checker",
        "h1": "Free Website Security Checker",
        "meta_title": "Free Website Security Checker \u2014 Malware, Hack & SSL Scan | GEOwallah",
        "meta_desc": "Scan your website for malware, injected spam, backdoors, SSL/TLS issues and missing security headers in one click \u2014 free, instant, no signup. A clean, secure site ranks better.",
        "lead": "Scan your site for malware, injected spam, backdoors, SSL problems and missing security headers in one click. A hacked or insecure site gets deranked and flagged by Google &mdash; we show you exactly what to fix.",
        "endpoint": "/security", "kind": "", "render": "security",
        "fields": [
            {"id": "tUrl", "field": "url", "label": "Your website", "ph": "yourbusiness.com", "required": True},
        ],
        "hint": "Passive scan &middot; we never attack your site &middot; results in seconds.",
        "loading_title": "Scanning your site&hellip;",
        "loading_steps": ["Checking SSL &amp; TLS", "Reading security headers", "Scanning for malware &amp; injected code", "Checking reputation &amp; exposed files"],
        "intro_html": "<h2>Why website security is also an SEO signal</h2><p>Search engines actively protect their users: a site that's hacked, serving malware, or pushing injected spam gets <b>deranked, flagged with a red &lsquo;this site may harm your computer&rsquo; warning, or removed from results entirely</b>. HTTPS is a confirmed Google ranking factor, and a broken or expired SSL certificate triggers a full-page browser warning that destroys your traffic and trust.</p><p>This checker runs a fast, <b>passive</b> scan &mdash; we only read what your site already exposes to any visitor, never attack it &mdash; and reports your SSL/TLS health, HTTP security headers, mixed content, software-version leaks, domain reputation, email anti-spoofing (SPF/DMARC), publicly exposed files, and tell-tale signs of malware, webshells, hidden link spam or a hacked site. Cleaning these up protects your visitors and your rankings at the same time.</p>",
        "how_title": "How the security checker works",
        "how_steps": [
            ("Enter your URL", "We fetch your page over a normal HTTPS request and complete a TLS handshake &mdash; exactly what a browser does."),
            ("We run passive checks", "SSL/cert, security headers, mixed content, version disclosure, malware &amp; injected-spam signatures, blocklist reputation, SPF/DMARC and exposed files."),
            ("Fix what's flagged", "Each issue comes with a plain-English fix. Want it handled for you? We secure and monitor sites as part of our work."),
        ],
        "faqs": [
            ("Is this a safe, non-intrusive scan?", "Yes. It's fully passive &mdash; we only read what your site already serves to any visitor (headers, HTML, certificate, public DNS). We never run intrusive attacks, port scans or exploit attempts."),
            ("How does it detect if my site is hacked?", "It scans the served HTML/JS for known malware and webshell signatures, obfuscated <code>eval</code>/base64 payloads, crypto-miners, hidden injected iframes, cloaked redirects and injected spam keywords, and checks your domain against the Spamhaus blocklist."),
            ("Does security really affect my Google ranking?", "Yes. HTTPS is a ranking factor, and hacked/malware/deceptive sites are demoted or delisted and flagged in Chrome and Search Console &mdash; which crushes clicks. A clean, secure site is a trust signal."),
            ("What are security headers and SPF/DMARC?", "Security headers (CSP, HSTS, X-Frame-Options&hellip;) tell browsers how to safely load your site and block common attacks. SPF/DMARC are DNS records that stop attackers spoofing email from your domain. Both are trust signals."),
            ("Can GEOwallah fix these issues for me?", "Absolutely &mdash; we harden security headers, fix SSL, clean hacked sites and set up email anti-spoofing as part of our <a href=\"/services.html\">services</a>. <a href=\"/contact.html\">Talk to us</a>."),
        ],
        "cta": ("Keep your site <span class=\"mark\">secure &amp; ranking</span>",
                "We harden your security headers, fix SSL, clean and protect hacked sites, and set up SPF/DMARC &mdash; so Google and AI trust you.",
                "Get my free audit", "/audit.html"),
        "sa_name": "GEOwallah Website Security Checker",
        "sa_desc": "Free passive scanner that checks a website for malware, injected spam, SSL/TLS issues, missing security headers and exposed files.",
        "category": "SecurityApplication",
    },
]


def badge_page():
    slug = "ai-visibility-badge"
    url = f"{SITE}/tools/{slug}/"
    h1 = "Free AI-Visibility Badge"
    mt = "Free AI-Visibility Badge — Embeddable Score Widget | GEOwallah"
    md = "Add a free, live AI-visibility badge to your website in one line of code. Shows your AI & SEO visibility score and links back to your free audit. No signup."
    faqs = [
        ("Is the badge free?", "Yes &mdash; it's a free, lightweight widget. Paste one line of HTML and it shows a live AI-visibility score for your site."),
        ("Does the badge slow my site down?", "No &mdash; it's a tiny lazy-loaded iframe (about 280&times;118px) with no heavy scripts, so it won't affect your page speed."),
        ("How does the score update?", "It reflects the latest AI &amp; SEO visibility score we have for your domain. Run the <a href=\"/audit.html\">free audit</a> to refresh it."),
        ("Can I change where it links?", "By default the badge links to your free GEOwallah audit so visitors can check their own score. Want a custom version? <a href=\"/contact.html\">Talk to us</a>."),
    ]
    jsonld = [breadcrumb(h1, url),
              softwareapp("GEOwallah AI-Visibility Badge",
                          "Free embeddable widget that displays a live AI & SEO visibility score on any website.",
                          url, "DeveloperApplication"),
              faqpage(faqs)]
    snippet = '<script src="https://api.geowallah.com/widget.js" data-url="yourbusiness.com" async></script>'
    parts = [head(mt, md, url, jsonld)]
    parts.append(f"""
<section class="section audit-hero">
  <div class="container">
    <div class="shead center" data-reveal>
      <span class="kicker" style="justify-content:center"><span class="num">&#10022;</span><span class="dash"></span> Free embeddable widget</span>
      <h1 style="font-size:clamp(2.1rem,5vw,3.5rem);margin:14px 0">{h1}</h1>
      <p class="lead">Add a live AI-visibility badge to your website in one line of code. It shows your AI &amp; SEO visibility score and gives visitors a one-click way to check their own &mdash; a simple trust and engagement booster.</p>
    </div>

    <div class="block" data-reveal style="max-width:760px;margin:30px auto 0">
      <span class="t-out-label">Live preview</span>
      <div style="margin:14px 0 22px" id="badgePreview" data-embed="https://api.geowallah.com/embed?url=geowallah.com">
        <a href="/audit.html" target="_blank" rel="noopener" style="font-family:system-ui,Segoe UI,Roboto,sans-serif;background:#fff;border:1px solid #eee;border-radius:14px;padding:14px 16px;width:248px;display:inline-block;text-decoration:none;color:inherit;box-shadow:0 4px 20px rgba(0,0,0,.12)">
          <div style="font-size:40px;font-weight:800;line-height:1;color:#16a34a">100</div>
          <div style="font-size:12px;color:#444;margin-top:4px">AI-Visibility Score &middot; Excellent</div>
          <div style="font-size:11px;color:#6d28d9;font-weight:700;margin-top:8px">Powered by GEOwallah &#8599;</div>
        </a>
      </div>
      <script>
      (function(){{
        var box=document.getElementById('badgePreview');
        if(!box)return;
        fetch(box.getAttribute('data-embed')).then(function(r){{return r.ok?r.text():null;}}).then(function(t){{
          if(!t)return;
          var b=t.match(/<body[^>]*>([\\s\\S]*?)<\\/body>/i),s=t.match(/<style[^>]*>[\\s\\S]*?<\\/style>/i);
          if(b)box.innerHTML=(s?s[0]:'')+b[1];
        }}).catch(function(){{}});
      }})();
      </script>
      <span class="t-out-label">Paste this where you want the badge</span>
      <div class="t-out-head" style="margin-top:10px"><span></span><div class="t-out-btns"><button type="button" class="btn btn-ghost btn-sm" id="copyBadge">Copy code</button></div></div>
      <pre class="t-code"><code id="badgeCode">{html.escape(snippet)}</code></pre>
      <p class="t-out-note">Replace <code>yourbusiness.com</code> with your own domain. The badge links to a free audit so visitors can check their own score.</p>
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container" style="max-width:820px">
    <div data-reveal><h2>Why add an AI-visibility badge?</h2><p>A small, honest visibility badge does three things: it signals that you take search and AI visibility seriously, it gives visitors a reason to engage (they can check their own score), and &mdash; when partners or clients embed it &mdash; it builds branded links back to you. It's the same play big SEO brands use with their grader badges.</p><p>The widget is tiny and lazy-loaded, so it won't hurt your page speed, and the score reflects the latest AI &amp; SEO visibility data for the domain.</p></div>
  </div>
</section>
""")
    parts.append(how_html("How to add the badge", [
        ("Copy the snippet", "Grab the one-line code above and set <code>data-url</code> to your domain."),
        ("Paste it on your site", "Drop it into your footer, sidebar or About page &mdash; anywhere you want the badge to show."),
        ("It goes live instantly", "The badge renders a live score and links visitors to a free audit. No build step needed."),
    ]))
    parts.append(faq_html(faqs))
    parts.append(cta_band("Check your <span class=\"mark\">real</span> score first",
                          "Run the free AI &amp; SEO visibility audit to see where you stand &mdash; then show it off with the badge.",
                          "Get my free audit", "/audit.html"))
    parts.append(more_tools(slug))
    parts.append(FOOTER)
    parts.append("""<script>
(function(){var b=document.getElementById('copyBadge');if(!b)return;b.addEventListener('click',function(){navigator.clipboard.writeText(document.getElementById('badgeCode').textContent).then(function(){var o=b.textContent;b.textContent='Copied!';setTimeout(function(){b.textContent=o;},1600);});});})();
</script>
</body>
</html>""")
    return "\n".join(parts)


def breadcrumb_hub():
    return {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": "Free Tools", "item": f"{SITE}/tools/"},
        ],
    }


def hub_page():
    url = f"{SITE}/tools/"
    mt = "Free SEO & AI Tools — Schema, llms.txt, AI Visibility & More | GEOwallah"
    md = "A free suite of SEO and AI-search tools: AI visibility checker, schema markup generator, llms.txt generator, FAQ schema, meta descriptions, NAP checker and sitemap generator. No signup."
    cards = {
        "ai-visibility-checker": ("Does ChatGPT, Gemini, Google AI Overviews &amp; Perplexity name your business? Run a live check.", "AI SEO &middot; GEO", '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>'),
        "schema-markup-generator": ("Generate valid LocalBusiness JSON-LD from your real page &mdash; phone, address &amp; geo auto-detected.", "Classic SEO &middot; AEO", '<svg viewBox="0 0 24 24"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>'),
        "llms-txt-generator": ("Build an llms.txt so AI crawlers find your most important pages. The emerging LLM standard.", "AI LLM &middot; GEO", '<svg viewBox="0 0 24 24"><path d="M4 4h16v12H5.2L4 17.2z"/><path d="M8 9h8M8 12h5"/></svg>'),
        "faq-schema-generator": ("Generate AI- &amp; voice-optimized FAQs with FAQPage schema to win answer engines.", "AEO &middot; Voice", '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17v.01"/></svg>'),
        "meta-description-generator": ("Write a compelling, right-length SEO meta description that earns clicks &mdash; no placeholders.", "Classic SEO", '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h10"/></svg>'),
        "nap-checker": ("Check your Name, Address &amp; Phone signals &mdash; the core of local &amp; Map Pack ranking.", "Local SEO", '<svg viewBox="0 0 24 24"><path d="M12 21s-7-5.7-7-11a7 7 0 0 1 14 0c0 5.3-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>'),
        "sitemap-generator": ("Generate an XML sitemap so Google &amp; Bing crawl every page. Copy-paste ready.", "Classic SEO", '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M12 12H6v4M12 12h6v4"/></svg>'),
        "website-security-checker": ("Scan for malware, injected spam, backdoors, SSL issues &amp; missing security headers &mdash; security is an SEO signal.", "Security &middot; Trust", '<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.4-3 8.3-7 10-4-1.7-7-5.6-7-10V6l7-3Z"/><path d="M9 12l2 2 4-4"/></svg>'),
        "ai-visibility-badge": ("Add a free live AI-visibility badge to your site in one line of code.", "Backlinks &middot; Brand", '<svg viewBox="0 0 24 24"><path d="M12 2l2.4 5 5.6.6-4 4 1 5.6L12 19l-5 2.8 1-5.6-4-4 5.6-.6z"/></svg>'),
    }
    items = []
    for slug, label in ALL:
        desc, tag, ic = cards[slug]
        items.append(f"""<a class="tool-card" href="/tools/{slug}/">
        <span class="tc-ic">{ic}</span>
        <h3>{label}</h3>
        <p>{desc}</p>
        <span class="tc-tag">{tag}</span>
      </a>""")
    grid = "\n      ".join(items)
    itemlist = {
        "@context": "https://schema.org", "@type": "ItemList",
        "name": "GEOwallah free SEO & AI tools",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": label, "url": f"{SITE}/tools/{slug}/"}
            for i, (slug, label) in enumerate(ALL)
        ],
    }
    faqs = [
        ("Are these tools really free?", "Yes &mdash; every tool here is free with no signup. We build them to be genuinely useful and to show how we approach SEO and AI search."),
        ("Do I need to create an account?", "No account, no signup. Just open a tool, enter your details and get an instant result."),
        ("How do these help with AI search (GEO/AEO)?", "Several tools target AI visibility directly &mdash; the AI visibility checker, llms.txt generator and FAQ schema generator all help ChatGPT, Gemini and AI Overviews find, understand and cite your business."),
        ("Can GEOwallah implement the fixes for me?", "Absolutely. The tools show what to do; our <a href=\"/services.html\">services</a> do it for you &mdash; schema, content, local SEO, citations and full GEO/AEO optimization."),
    ]
    jsonld = [
        {"@context": "https://schema.org", "@type": "CollectionPage", "name": mt, "url": url, "description": md},
        breadcrumb_hub(),
        itemlist,
        faqpage(faqs),
    ]
    parts = [head(mt, md, url, jsonld)]
    parts.append(f"""
<section class="section audit-hero">
  <div class="container">
    <div class="shead center" data-reveal>
      <span class="kicker" style="justify-content:center"><span class="num">&#10022;</span><span class="dash"></span> Free tools &middot; no signup</span>
      <h1 style="font-size:clamp(2.2rem,5.2vw,3.7rem);margin:14px 0">Free <span class="mark">SEO</span> &amp; <span class="mark violet">AI search</span> tools</h1>
      <p class="lead">A growing suite of free tools to help you get found on Google, cited by AI engines, and chosen locally &mdash; from schema and llms.txt generators to a live AI-visibility checker. No signup, instant results.</p>
    </div>
    <div class="tools-grid" data-reveal>
      {grid}
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container" style="max-width:820px">
    <div data-reveal><h2>Built by an SEO &amp; AI-search agency</h2><p>These tools come from the same playbook we use for clients at <a href="/index.html">GEOwallah</a> &mdash; an AI-search optimization agency in Barrackpore serving all of India. Each one solves a real piece of getting found on Google and recommended by ChatGPT, Gemini and Perplexity. Use them free; when you want the fixes implemented end-to-end, <a href="/services.html">see what we do</a> or <a href="/audit.html">run a full free audit</a>.</p></div>
  </div>
</section>""")
    parts.append(faq_html(faqs))
    parts.append(cta_band("Want it all <span class=\"mark\">done for you</span>?",
                          "Start with a free AI &amp; SEO audit. We'll show you exactly where you're invisible &mdash; and how we'll fix it.",
                          "Get my free audit", "/audit.html"))
    parts.append(FOOTER)
    parts.append("</body>\n</html>")
    return "\n".join(parts)


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content if content.endswith("\n") else content + "\n")
    print("wrote", os.path.relpath(path, ROOT))


def main():
    write(os.path.join(ROOT, "tools", "index.html"), hub_page())
    for t in TOOLS:
        write(os.path.join(ROOT, "tools", t["slug"], "index.html"), tool_page(t))
    write(os.path.join(ROOT, "tools", "ai-visibility-badge", "index.html"), badge_page())
    print("done:", len(TOOLS) + 2, "pages")


if __name__ == "__main__":
    main()
