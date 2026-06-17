#!/usr/bin/env python3
"""Regenerate sitemap.xml from the static page tree.

The site is plain static HTML with no build step, so the sitemap used to be
hand-edited — meaning blog-drip posts (and any new page) silently never made it
into sitemap.xml. This script rebuilds the sitemap from whatever HTML pages
actually exist in the repo, so every deploy ships a complete, current sitemap.

It runs in the Render deploy workflow (see .github/workflows/render-deploy.yml)
before the deploy is triggered, so the regenerated sitemap is what goes live and
what gets submitted to Google Search Console / IndexNow.

Page rules (derived from the existing site conventions):
  /                              -> weekly,  1.0, og-default image (no caption)
  *.html (services/pricing/...)  -> monthly, per-page priority, no image
  <dir>/index.html, og:type=website (local/landing pages) -> monthly, 0.9
  <dir>/index.html, og:type=article (blog pillars + posts) -> monthly, 0.7,
                                    + image:image (post figure image + alt)

A page is excluded if it is a Google verification file, the 404 page, or carries
a robots "noindex" directive.
"""
from __future__ import annotations

import datetime
import os
import re
import subprocess

SITE = "https://geowallah.com"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Root-level .html pages with intentional, hand-tuned priorities/changefreq.
ROOT_PAGE_RULES: dict[str, tuple[str, str]] = {
    "index.html": ("weekly", "1.0"),
    "services.html": ("monthly", "0.9"),
    "pricing.html": ("monthly", "0.9"),
    "audit.html": ("monthly", "0.9"),
    "blog.html": ("daily", "0.8"),
    "contact.html": ("monthly", "0.8"),
    "about.html": ("monthly", "0.7"),
}
ROOT_DEFAULT = ("monthly", "0.7")

# Never list these as indexable pages.
SKIP_EXACT = {"404.html"}
SKIP_RE = re.compile(r"^google[0-9a-f]+\.html$")


def run_git(args: list[str]) -> str:
    try:
        return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return ""


def lastmod_for(rel_path: str) -> str:
    """Last commit date (YYYY-MM-DD) for a file; today if untracked/unknown."""
    date = run_git(["log", "-1", "--format=%cs", "--", rel_path])
    return date or datetime.date.today().isoformat()


def find_html_files() -> list[str]:
    out: list[str] = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in {".git", ".github", "assets", "scripts"}]
        for name in filenames:
            if name.endswith(".html"):
                rel = os.path.relpath(os.path.join(dirpath, name), ROOT)
                out.append(rel.replace(os.sep, "/"))
    return out


def loc_for(rel_path: str) -> str | None:
    """Map a repo HTML path to its canonical URL, or None to skip."""
    base = os.path.basename(rel_path)
    if base in SKIP_EXACT or SKIP_RE.match(base):
        return None
    if rel_path == "index.html":
        return f"{SITE}/"
    if rel_path.endswith("/index.html"):
        return f"{SITE}/{rel_path[: -len('index.html')]}"
    if "/" not in rel_path:  # root-level standalone .html
        return f"{SITE}/{rel_path}"
    # Non-index .html nested in a directory: address it directly.
    return f"{SITE}/{rel_path}"


def meta(html: str, prop: str) -> str:
    m = re.search(
        rf'<meta\s+property="{re.escape(prop)}"\s+content="([^"]*)"', html
    )
    return m.group(1) if m else ""


def has_noindex(html: str) -> bool:
    m = re.search(r'<meta\s+name="robots"\s+content="([^"]*)"', html, re.I)
    return bool(m and "noindex" in m.group(1).lower())


def figure_caption_for(html: str, image_url: str) -> str:
    """alt text of the <img> whose src matches the og:image (used as caption)."""
    basename = image_url.rsplit("/", 1)[-1]
    m = re.search(
        rf'<img[^>]*src="[^"]*{re.escape(basename)}"[^>]*alt="([^"]*)"', html
    )
    if not m:
        m = re.search(
            rf'<img[^>]*alt="([^"]*)"[^>]*src="[^"]*{re.escape(basename)}"', html
        )
    return m.group(1) if m else ""


def classify(rel_path: str, html: str) -> tuple[str, str, str, str]:
    """Return (changefreq, priority, image_loc, image_caption)."""
    og_type = meta(html, "og:type")
    og_image = meta(html, "og:image")
    base = os.path.basename(rel_path)

    if rel_path == "index.html":
        cf, pr = ROOT_PAGE_RULES["index.html"]
        return cf, pr, og_image, ""  # homepage: image, no caption

    if rel_path.endswith("/index.html"):
        if og_type == "article":
            caption = figure_caption_for(html, og_image) if og_image else ""
            return "monthly", "0.7", og_image, caption
        # website-type directory page == local/landing page
        return "monthly", "0.9", "", ""

    if "/" not in rel_path:
        cf, pr = ROOT_PAGE_RULES.get(base, ROOT_DEFAULT)
        return cf, pr, "", ""

    return "monthly", "0.7", "", ""


def xml_escape(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def build() -> str:
    entries: list[tuple[int, str, str]] = []  # (sort_key, loc, xml_block)
    for rel in find_html_files():
        loc = loc_for(rel)
        if not loc:
            continue
        with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
            html = fh.read()
        if has_noindex(html):
            continue
        cf, pr, image, caption = classify(rel, html)
        lastmod = lastmod_for(rel)

        lines = [
            "  <url>",
            f"    <loc>{xml_escape(loc)}</loc>",
            f"    <lastmod>{lastmod}</lastmod>",
            f"    <changefreq>{cf}</changefreq>",
            f"    <priority>{pr}</priority>",
        ]
        if image:
            img = f"<image:image><image:loc>{xml_escape(image)}</image:loc>"
            if caption:
                img += f"<image:caption>{xml_escape(caption)}</image:caption>"
            img += "</image:image>"
            lines.append(f"    {img}")
        lines.append("  </url>")

        # Sort: homepage first, then root pages, then directory pages — each
        # group alphabetically by URL for a stable, deterministic file.
        if rel == "index.html":
            key = 0
        elif "/" not in rel:
            key = 1
        else:
            key = 2
        entries.append((key, loc, "\n".join(lines)))

    entries.sort(key=lambda e: (e[0], e[1]))
    body = "\n".join(block for _, _, block in entries)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
        '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
        f"{body}\n"
        "</urlset>\n"
    )


def main() -> int:
    xml = build()
    out_path = os.path.join(ROOT, "sitemap.xml")
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(xml)
    n = xml.count("<url>")
    print(f"sitemap.xml regenerated with {n} URL(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
