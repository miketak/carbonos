#!/usr/bin/env python3
"""Export the QA procedures (docs/qa) as DOCX files ready for Google Docs.

Converts docs/qa/README.md and docs/qa/NNN-*.md with pandoc: the H1 becomes the
title, a subtitle carries the git ref and build date, relative links point at
GitHub, the pages are landscape so the step tables have room, and every table
gets an outline. Upload the files to the shared Drive folder by hand; Drive
converts them to Google Docs. See docs/how-to/publish-qa-procedures.md.
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import re
import shutil
import subprocess
import sys
import zipfile
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
QA_DIR = REPO_ROOT / "docs" / "qa"
LUA_FILTERS = [
    REPO_ROOT / "scripts" / "qa-docs" / "github-links.lua",
    REPO_ROOT / "scripts" / "qa-docs" / "step-tables.lua",
]
REPO_URL = "https://github.com/miketak/carbonos"
# Table borders in eighths of a point: pandoc's default table style rules only the top and
# bottom, so the sign-off and scenario tables would import into Google Docs without an outline.
TABLE_BORDER_EIGHTHS = 8
# Page setup in twentieths of a point (twips): A4 landscape with 2 cm margins, so a step table
# has room for the action, the expected result and a Notes column a tester can write in.
# pandoc 3.1 writes an empty sectPr whatever the reference document says, so the page is set
# after the conversion.
PAGE_WIDTH = 16838
PAGE_HEIGHT = 11906
PAGE_MARGIN = 1134
TEXT_WIDTH = PAGE_WIDTH - 2 * PAGE_MARGIN


@dataclass(frozen=True)
class BuildInfo:
    """The git ref the documents are built from, for the subtitle and the spec links."""

    ref: str
    sha: str
    date: str

    @property
    def subtitle(self) -> str:
        return f"Version {self.ref} ({self.sha}), built {self.date}"

    @staticmethod
    def detect() -> "BuildInfo":
        today = dt.date.today().isoformat()
        ref = os.environ.get("GITHUB_REF_NAME")
        sha = os.environ.get("GITHUB_SHA", "")[:7]
        if ref and sha:
            return BuildInfo(ref, sha, today)
        describe = _git("describe", "--tags", "--always", "--dirty")
        branch = _git("rev-parse", "--abbrev-ref", "HEAD")
        short = _git("rev-parse", "--short", "HEAD")
        return BuildInfo(describe if branch == "HEAD" else branch, short, today)


def _display(path: Path) -> str:
    """The path relative to the repository when it is inside it, else as given."""
    try:
        return path.relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return str(path)


def _git(*args: str) -> str:
    try:
        return subprocess.run(
            ["git", *args], cwd=REPO_ROOT, check=True, capture_output=True, text=True
        ).stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "unknown"


# --- naming ------------------------------------------------------------------------


def source_files() -> list[Path]:
    return [QA_DIR / "README.md", *sorted(QA_DIR.glob("[0-9][0-9][0-9]-*.md"))]


def doc_name(source: Path) -> str:
    """'00 QA procedures (start here)' for the README, 'NN <title>' for a procedure."""
    if source.name == "README.md":
        return "00 QA procedures (start here)"
    number = int(source.name[:3])
    heading = next(
        (line for line in source.read_text(encoding="utf-8").splitlines() if line.startswith("# ")),
        source.stem,
    )
    title = re.sub(r"^#\s*Procedure\s+\d+:\s*", "", heading).strip()
    return f"{number:02d} {title}"


def docx_path(out_dir: Path, source: Path) -> Path:
    stem = "00-qa-procedures" if source.name == "README.md" else source.stem
    return out_dir / f"{stem}.docx"


# --- build ---------------------------------------------------------------------------


def build(out_dir: Path) -> list[tuple[str, Path]]:
    pandoc = shutil.which("pandoc")
    if pandoc is None:
        sys.exit("pandoc is not installed: apt-get install pandoc, brew install pandoc, or see the how-to.")
    info = BuildInfo.detect()
    out_dir = out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    built: list[tuple[str, Path]] = []
    for source in source_files():
        target = docx_path(out_dir, source)
        command = [
            pandoc,
            str(source),
            "--from=gfm+yaml_metadata_block",
            "--to=docx",
            "--shift-heading-level-by=-1",
            *(f"--lua-filter={lua_filter}" for lua_filter in LUA_FILTERS),
            f"--metadata=repo_url:{REPO_URL}",
            f"--metadata=git_ref:{info.ref}",
            f"--metadata=source_path:{source.relative_to(REPO_ROOT).as_posix()}",
            f"--metadata=subtitle:{info.subtitle}",
            f"--output={target}",
        ]
        subprocess.run(command, check=True, cwd=REPO_ROOT)
        set_page_layout(target)
        add_table_borders(target)
        built.append((doc_name(source), target))
        print(f"built {_display(target)}  ->  {doc_name(source)}")
    print(f"{len(built)} documents, {info.subtitle}")
    return built


def _rewrite_document(docx: Path, transform) -> None:
    """Applies transform to word/document.xml and writes the DOCX back with the same entries."""
    with zipfile.ZipFile(docx) as archive:
        entries = {info.filename: archive.read(info.filename) for info in archive.infolist()}
        infos = archive.infolist()
    document = entries["word/document.xml"].decode("utf-8")
    entries["word/document.xml"] = transform(document).encode("utf-8")
    with zipfile.ZipFile(docx, "w", zipfile.ZIP_DEFLATED) as archive:
        for info in infos:
            archive.writestr(info.filename, entries[info.filename])


def set_page_layout(docx: Path) -> int:
    """Makes the pages A4 landscape and stretches the full-width tables over the text width.

    Returns the number of tables whose grid was rescaled. pandoc emits a full-width table
    (tblW 100%) with a grid computed for a 5.5 inch text block; Google Docs sizes the
    columns from that grid, so it is scaled to the landscape text width to match.
    """
    section = (
        f'<w:sectPr><w:pgSz w:w="{PAGE_WIDTH}" w:h="{PAGE_HEIGHT}" w:orient="landscape"/>'
        f'<w:pgMar w:top="{PAGE_MARGIN}" w:right="{PAGE_MARGIN}" w:bottom="{PAGE_MARGIN}" '
        f'w:left="{PAGE_MARGIN}" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>'
    )
    grid_col = re.compile(r'<w:gridCol w:w="(\d+)"\s*/>')
    rescaled = 0

    def scale_grid(match: re.Match[str]) -> str:
        nonlocal rescaled
        table = match.group(0)
        if '<w:tblW w:type="pct"' not in table:
            return table
        widths = [int(w) for w in grid_col.findall(table)]
        total = sum(widths)
        if not total:
            return table
        rescaled += 1
        scaled = iter(round(w * TEXT_WIDTH / total) for w in widths)
        return grid_col.sub(lambda _: f'<w:gridCol w:w="{next(scaled)}" />', table)

    def transform(document: str) -> str:
        document = re.sub(r"<w:tblPr>.*?</w:tblGrid>", scale_grid, document, flags=re.S)
        body_end = document.rfind("</w:body>")
        head = re.sub(r"<w:sectPr\s*/>|<w:sectPr>.*?</w:sectPr>", "", document[:body_end], flags=re.S)
        return head + section + document[body_end:]

    _rewrite_document(docx, transform)
    return rescaled


def add_table_borders(docx: Path, eighths: int = TABLE_BORDER_EIGHTHS) -> int:
    """Gives every table in the DOCX a full grid border; returns the number of tables changed."""
    edge = f'<w:{{}} w:val="single" w:sz="{eighths}" w:space="0" w:color="000000"/>'
    borders = "<w:tblBorders>" + "".join(
        edge.format(side) for side in ("top", "left", "bottom", "right", "insideH", "insideV")
    ) + "</w:tblBorders>"
    # tblBorders sits after tblInd and before shd, tblLayout, tblCellMar and tblLook (schema order)
    anchor = re.compile(r"<w:shd\b|<w:tblLayout\b|<w:tblCellMar\b|<w:tblLook\b|</w:tblPr>")
    changed = 0

    def with_borders(match: re.Match[str]) -> str:
        nonlocal changed
        props = match.group(0)
        if "<w:tblBorders" in props:
            return props
        changed += 1
        return anchor.sub(lambda m: borders + m.group(0), props, count=1)

    _rewrite_document(
        docx, lambda document: re.sub(r"<w:tblPr>.*?</w:tblPr>", with_borders, document, flags=re.S)
    )
    return changed


# --- cli ---------------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--out", type=Path, default=REPO_ROOT / "build" / "qa-docs", help="where the DOCX files go")
    args = parser.parse_args(argv)
    build(args.out)


if __name__ == "__main__":
    main()
