"""
bump_version.py

A utility script to batch-update asset cache-busting query strings (?v=X.Y)
across all HTML files in the project (root, posts/, research/, etc.).

Usage:
    python scripts/bump_version.py nav.js 3.1
    python scripts/bump_version.py style.css 2.9
    python scripts/bump_version.py mind-waves.js 4.5
"""

import sys
import re
from pathlib import Path

def bump_asset_version(asset_name: str, new_version: str):
    root_dir = Path(__file__).resolve().parent.parent
    html_files = sorted(root_dir.rglob("*.html"))

    pattern = re.compile(
        rf"""((?:src|href)=["'][^"']*?{re.escape(asset_name)})(?:\?v=[^"']*)?(["'])"""
    )

    updated_count = 0

    print(f"Bumping '{asset_name}' to version 'v={new_version}' across HTML files...")

    for html_file in html_files:
        try:
            content = html_file.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue

        new_content, count = pattern.subn(rf"\g<1>?v={new_version}\g<2>", content)

        if count > 0 and new_content != content:
            html_file.write_text(new_content, encoding="utf-8")
            rel_path = html_file.relative_to(root_dir)
            print(f"  [UPDATED] {rel_path} ({count} occurrence{'s' if count > 1 else ''})")
            updated_count += 1

    print(f"\nDone! {updated_count} file{'s' if updated_count != 1 else ''} updated.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python scripts/bump_version.py <asset_filename> <new_version>")
        print("Example: python scripts/bump_version.py nav.js 3.1")
        sys.exit(1)

    asset = sys.argv[1].strip()
    version = sys.argv[2].strip().lstrip("v=").lstrip("v")
    bump_asset_version(asset, version)
