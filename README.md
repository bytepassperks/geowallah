# GEOwallah — AI Search Optimization Agency website

Handcrafted, original static site (HTML/CSS/JS, no frameworks, no template copy).
Fast, SEO-first, fully responsive, with custom animations.

## Pages
- `index.html` — Home (animated node-network hero, services, process, pricing preview, testimonials, FAQ, CTA)
- `services.html` — Full services (AI GEO/LLM, AEO, SEO/AI SEO, Local SEO/GMB, Web Dev, Content, Citations, Marketing)
- `pricing.html` — Monthly plans + one-time packages + pricing FAQ (the "store")
- `about.html` — Story / positioning
- `blog.html` — Blog grid (sample posts)
- `contact.html` — Lead form that opens a prefilled WhatsApp chat (no backend needed)

## Assets
- `assets/css/style.css` — design system + all styles
- `assets/js/main.js` — animations (canvas network, reveals, count-ups, typing headline, FAQ, cursor glow, magnetic buttons)
- `assets/img/logo.png` — gradient logo (header/footer)  •  `logo-mono.png` — solid version  •  `favicon-*.png`

## ⚙️ Before you go live — replace these placeholders
Search & replace across all `.html` files:
1. **WhatsApp number:** `91XXXXXXXXXX` → your number with country code, no `+` (e.g. `919830000000`). Also in `contact.html` the `WA_NUMBER` variable.
2. **Email:** `hello@geowallah.com` → your real email.
3. **Social links:** the `href="#"` in the footer (Instagram/Facebook/LinkedIn).
4. **Razorpay (optional):** turn any "Choose plan / Get started" button into a payment link — replace `href="contact.html"` with your Razorpay Payment Link URL (e.g. `https://rzp.io/l/xxxx`).
5. **Domain in `sitemap.xml` / `robots.txt`** is already set to `https://geowallah.com`.

## 🚀 Deploy to Render (static site, free)
1. Push this folder to a GitHub repo.
2. Render Dashboard → **New → Static Site** → connect the repo.
3. Settings:
   - **Build Command:** *(leave empty)*
   - **Publish Directory:** `.`
4. Create. Render gives you a `*.onrender.com` URL. (`render.yaml` is included for Blueprint deploys too.)

## 🌐 Point your Wix domain (apex `geowallah.com`) to Render
1. In Render → your static site → **Settings → Custom Domains** → add `geowallah.com` and `www.geowallah.com`. Render shows the exact DNS targets.
2. In **Wix → Domains → your domain → Manage DNS / DNS records**:
   - **Apex (`geowallah.com`):** add the **A records** Render lists (Render's static anycast IPs), **or** an `ALIAS/ANAME` to your Render hostname if Wix supports it.
   - **`www`:** add a **CNAME** → `your-site.onrender.com`.
3. Wait for DNS to propagate (minutes–hours). Render auto-issues a free SSL certificate.
4. Set your preferred primary (redirect `www` → apex or vice-versa) in Render.

> Note: Render is **static** — this site is pure HTML/CSS/JS, so it deploys with no build step and no server.
