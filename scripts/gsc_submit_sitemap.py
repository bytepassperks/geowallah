#!/usr/bin/env python3
"""Submit the sitemap to Google Search Console on every deploy.

Google removed its public sitemap "ping" endpoint in 2023 and its Indexing API
only supports JobPosting/BroadcastEvent pages, so this is the compliant way to
keep Google's copy of the sitemap fresh: the Search Console API
``sitemaps.submit``. It does not force indexing — Google still crawls on its own
schedule — but it is the strongest automatic signal available for normal pages.

Auth: a Google service-account JSON supplied via the ``GSC_SA_JSON`` env var
(the service account must be added as a user on the GSC property). The property
is set via ``GSC_SITE_URL`` (default: the domain property ``sc-domain:geowallah.com``).

No-ops quietly (exit 0) when the credential is absent, so it never breaks a deploy.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

SITEMAP_URL = "https://geowallah.com/sitemap.xml"
DEFAULT_SITE = "sc-domain:geowallah.com"
TOKEN_URI = "https://oauth2.googleapis.com/token"
SCOPE = "https://www.googleapis.com/auth/webmasters"


def _access_token(sa: dict) -> str:
    """Mint an OAuth2 access token from the service account (JWT bearer flow)."""
    import time

    from google.auth import jwt as _jwt  # noqa: F401  (ensure dep present)

    # Use google-auth's service-account credentials to avoid hand-rolling JWT.
    from google.oauth2 import service_account
    from google.auth.transport.requests import Request

    creds = service_account.Credentials.from_service_account_info(
        sa, scopes=[SCOPE]
    )
    creds.refresh(Request())
    return creds.token


def main() -> int:
    raw = os.environ.get("GSC_SA_JSON", "").strip()
    if not raw:
        print("GSC: GSC_SA_JSON not set; skipping sitemap submission.")
        return 0
    try:
        sa = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"GSC: GSC_SA_JSON is not valid JSON ({e}); skipping.")
        return 0

    site = os.environ.get("GSC_SITE_URL", DEFAULT_SITE)
    try:
        token = _access_token(sa)
    except Exception as e:  # noqa: BLE001 - never fail the deploy
        print(f"GSC: could not obtain access token (non-fatal): {e}")
        return 0

    endpoint = (
        "https://www.googleapis.com/webmasters/v3/sites/"
        f"{urllib.parse.quote(site, safe='')}/sitemaps/"
        f"{urllib.parse.quote(SITEMAP_URL, safe='')}"
    )
    req = urllib.request.Request(
        endpoint, method="PUT",
        headers={"Authorization": f"Bearer {token}",
                 "Content-Length": "0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"GSC: submitted sitemap for {site} (HTTP {r.status}).")
    except urllib.error.HTTPError as e:
        print(f"GSC: sitemap submit failed (non-fatal): "
              f"HTTP {e.code} {e.read()[:200]!r}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
