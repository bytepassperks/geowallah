#!/usr/bin/env python3
"""Insert a "Free tools" link into the nav and footer of every site page.

Idempotent: skips a file/region if the /tools/ link is already present.
Targets only the nav-links anchor row and the footer "Company" column so we
never touch body copy that happens to contain the word Blog.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAV_LINK = '<a href="/tools/">Free tools</a>'
BLOG_RE = re.compile(r'(<a [^>]*>Blog</a>)')


def find_html():
    for dirpath, _dirs, files in os.walk(ROOT):
        if os.sep + "tools" in dirpath:  # generated pages already have the link
            continue
        for f in files:
            if f.endswith(".html"):
                yield os.path.join(dirpath, f)


def patch_nav(lines):
    out = []
    i = 0
    changed = False
    while i < len(lines):
        out.append(lines[i])
        if 'class="nav-links"' in lines[i]:
            # next non-empty line holds the anchors
            j = i + 1
            while j < len(lines) and lines[j].strip() == "":
                out.append(lines[j]); j += 1
            if j < len(lines):
                row = lines[j]
                if "/tools/" not in row and BLOG_RE.search(row):
                    row = BLOG_RE.sub(NAV_LINK + r"\1", row, count=1)
                    changed = True
                out.append(row)
                i = j
        i += 1
    return out, changed


def patch_footer(text):
    if "<h4>Company</h4>" not in text:
        return text, False
    def repl(m):
        block = m.group(0)
        if "/tools/" in block or "Free tools" in block:
            return block
        return BLOG_RE.sub(NAV_LINK + r"\1", block, count=1)
    new = re.sub(r"<h4>Company</h4>.*?</div>", repl, text, count=1, flags=re.S)
    return new, new != text


def main():
    n = 0
    for path in find_html():
        with open(path, encoding="utf-8") as fh:
            text = fh.read()
        lines = text.split("\n")
        lines, c1 = patch_nav(lines)
        text2 = "\n".join(lines)
        text2, c2 = patch_footer(text2)
        if c1 or c2:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(text2)
            n += 1
            print("patched", os.path.relpath(path, ROOT), "nav" if c1 else "", "footer" if c2 else "")
    print("done:", n, "files")


if __name__ == "__main__":
    main()
