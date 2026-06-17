#!/usr/bin/env python3
"""Submit the URLs changed in the latest push to IndexNow.

Runs in the Render deploy workflow on every push to ``deploy`` (manual PR
merge or the blog drip), so each deploy is announced to IndexNow-backed
engines (Bing, Yandex, Seznam) automatically. Google does not use IndexNow;
its discovery comes from the sitemap (auto-submitted separately) and crawling.

URL mapping (matches the static site layout):
  index.html            -> /
  about.html            -> /about.html
  blog.html             -> /blog.html
  <pillar>/index.html   -> /<pillar>/
  <a>/<b>/index.html    -> /<a>/<b>/
  sitemap.xml           -> /sitemap.xml
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

SITE = "https://geowallah.com"
HOST = "geowallah.com"
KEY = "fdf0ea921aec4f49a576c85a9927e61a"

# Only these change-types matter for search discovery.
SUBMIT_SUFFIXES = (".html", ".xml")
# Never submit non-page assets / machine files.
SKIP = {"robots.txt", "404.html"}


def changed_files() -> list[str]:
    """Files changed in the triggering push.

    Prefers the explicit push range ``DIFF_BASE..DIFF_HEAD`` (set by the deploy
    workflow) so the right files are diffed even after the sitemap auto-commit
    moves HEAD. Falls back to ``HEAD~1..HEAD`` for local/manual runs.
    """
    base = os.environ.get("DIFF_BASE", "").strip()
    head = os.environ.get("DIFF_HEAD", "").strip() or "HEAD"
    # An all-zero base is GitHub's "branch created" sentinel — no usable range.
    if base and set(base) != {"0"}:
        diff_args = ["git", "diff", "--name-only", base, head]
    else:
        diff_args = ["git", "diff", "--name-only", "HEAD~1", "HEAD"]
    try:
        out = subprocess.check_output(diff_args, text=True)
    except subprocess.CalledProcessError:
        # First commit / no parent: fall back to everything tracked.
        out = subprocess.check_output(["git", "ls-files"], text=True)
    return [line.strip() for line in out.splitlines() if line.strip()]


def to_url(path: str) -> str | None:
    if path in SKIP:
        return None
    if path.endswith("/index.html"):
        return f"{SITE}/{path[:-len('index.html')]}"
    if path == "index.html":
        return f"{SITE}/"
    if path.endswith(SUBMIT_SUFFIXES):
        return f"{SITE}/{path}"
    return None


def main() -> int:
    files = changed_files()
    urls = sorted({u for p in files if (u := to_url(p))})
    if not urls:
        print("IndexNow: no page URLs changed; nothing to submit.")
        return 0
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": f"{SITE}/{KEY}.txt",
        "urlList": urls,
    }
    req = urllib.request.Request(
        "https://api.indexnow.org/indexnow",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8",
                 "User-Agent": "geowallah-indexnow"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"IndexNow: HTTP {r.status} for {len(urls)} URL(s):")
    except urllib.error.HTTPError as e:
        # Non-fatal: a failed ping must not fail the deploy.
        print(f"IndexNow ping failed (non-fatal): HTTP {e.code} {e.read()[:200]!r}")
        for u in urls:
            print(f"  - {u}")
        return 0
    for u in urls:
        print(f"  - {u}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
