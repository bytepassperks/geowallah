#!/usr/bin/env python3
"""Submit an arbitrary set of URLs to IndexNow on demand.

Unlike ``indexnow_ping.py`` (which only submits the files changed in a push),
this pushes any list of URLs — useful for a one-off re-announce, a manual
backfill, or re-submitting the whole site without changing any files.
IndexNow is consumed by Bing, Yandex and Seznam (Google does not use it; its
discovery comes from the sitemap submitted via ``gsc_submit_sitemap.py`` and
its own crawl).

Sources (first non-empty wins):
  1. URLs passed as CLI args.
  2. ``--file PATH`` / stdin: one URL per line (blank lines and ``#`` comments
     ignored).
  3. Default: every ``<loc>`` in ``--sitemap`` (defaults to the live sitemap).

Only ``https://geowallah.com/...`` URLs are submitted; anything else is dropped
so a stray paste can never announce another host under our key.

Examples:
  python3 scripts/index_urls.py                      # all sitemap URLs
  python3 scripts/index_urls.py https://geowallah.com/pricing.html
  python3 scripts/index_urls.py --file urls.txt
  python3 scripts/index_urls.py --sitemap ./sitemap.xml --dry-run
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request

SITE = "https://geowallah.com"
HOST = "geowallah.com"
KEY = "fdf0ea921aec4f49a576c85a9927e61a"
ENDPOINT = "https://api.indexnow.org/indexnow"
DEFAULT_SITEMAP = f"{SITE}/sitemap.xml"
# IndexNow accepts up to 10000 URLs per request.
BATCH = 10000


def _read(src: str) -> str:
    if src.startswith(("http://", "https://")):
        req = urllib.request.Request(src, headers={"User-Agent": "geowallah-indexnow"})
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read().decode("utf-8", "replace")
    if src == "-":
        return sys.stdin.read()
    with open(src, encoding="utf-8") as fh:
        return fh.read()


def urls_from_sitemap(text: str) -> list[str]:
    return re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", text)


def urls_from_lines(text: str) -> list[str]:
    out = []
    for line in text.splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            out.append(line)
    return out


def normalize(urls: list[str]) -> list[str]:
    """Keep only on-site https URLs, de-duplicate, preserve order."""
    seen: set[str] = set()
    out: list[str] = []
    for u in urls:
        u = u.strip()
        if not u.startswith(f"{SITE}/") and u != SITE and u != f"{SITE}":
            continue
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def submit(urls: list[str]) -> int:
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": f"{SITE}/{KEY}.txt",
        "urlList": urls,
    }
    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8",
                 "User-Agent": "geowallah-indexnow"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"IndexNow: HTTP {r.status} accepted {len(urls)} URL(s).")
            return 0
    except urllib.error.HTTPError as e:
        body = e.read()[:300]
        print(f"IndexNow: HTTP {e.code} {body!r}")
        # 200/202 are success; anything else is a real failure for an explicit run.
        return 1 if e.code >= 400 else 0


def gather(args: argparse.Namespace) -> list[str]:
    if args.urls:
        return urls_from_lines("\n".join(args.urls))
    if args.file:
        return urls_from_lines(_read(args.file))
    text = _read(args.sitemap)
    return urls_from_sitemap(text)


def main() -> int:
    ap = argparse.ArgumentParser(description="Submit URLs to IndexNow on demand.")
    ap.add_argument("urls", nargs="*", help="URLs to submit (overrides --file/--sitemap).")
    ap.add_argument("--file", help="Path or '-' for stdin: one URL per line.")
    ap.add_argument("--sitemap", default=DEFAULT_SITEMAP,
                    help=f"Sitemap to read when no URLs/--file given (default: {DEFAULT_SITEMAP}).")
    ap.add_argument("--dry-run", action="store_true", help="Print URLs without submitting.")
    args = ap.parse_args()

    urls = normalize(gather(args))
    if not urls:
        print("IndexNow: no valid on-site URLs to submit.")
        return 0

    print(f"IndexNow: {len(urls)} URL(s) to submit:")
    for u in urls:
        print(f"  - {u}")
    if args.dry_run:
        print("(dry-run: nothing submitted)")
        return 0

    rc = 0
    for i in range(0, len(urls), BATCH):
        rc |= submit(urls[i:i + BATCH])
    return rc


if __name__ == "__main__":
    sys.exit(main())
