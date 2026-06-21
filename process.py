#!/usr/bin/env python3
"""
Build data.json for the Excel eSports BR ranking site.

Inputs (encoding auto-detected per file: UTF-8 or ISO-8859-1):
  - rankings.csv : one row per participant per round (long format)
        Rodada, Pos., Nome, UF
        Points are derived: pontos = 1001 - Pos.  (1st place = 1000)
  - class.csv    : qualified participants (the * mark), one name per line,
        NO header (the first line is already a name).

Output:
  - data.json    : UTF-8, consumed by app.js. One object per participant:
        nome, estado, class, r[], part, descarte, total, media

Scoring:
  - `r` holds each round's points indexed by round number (Rodada 1 -> r[0]).
    Rounds the participant didn't play are null.
  - `descarte` drops the NUM_DISCARDS lowest rounds (blank counts as 0 and is
    dropped first). 1 now; bump to 2 after round 7.

Usage:
    python process.py [rankings.csv] [class.csv] [data.json]
"""

import csv
import json
import re
import sys

# Number of lowest rounds discarded when computing `descarte`.
# Bumped to 2 (was 1 for rounds 1-6).
NUM_DISCARDS = 2


def read_text(path):
    """
    Read a CSV as text, tolerating either encoding the export may use:
    UTF-8 (with optional BOM) or ISO-8859-1. rankings.csv and class.csv have
    historically differed, so decode each independently to keep names matching.
    """
    raw = open(path, "rb").read()
    try:
        return raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        return raw.decode("iso-8859-1")


def round_number(label):
    """'Rodada 3' -> 3 (1-based)."""
    m = re.search(r"\d+", label)
    if not m:
        raise ValueError(f"Unrecognized round label: {label!r}")
    return int(m.group())


def load_qualified(path):
    """Return a set of qualified participant names. class.csv has no header."""
    return {line.strip() for line in read_text(path).splitlines() if line.strip()}


def load_rankings(path):
    """
    Parse the long-format rankings into per-participant records.

    Returns (participants_by_name, num_rounds) where each record carries the
    name, UF and a dict {round_number: points}.
    """
    by_name = {}
    max_round = 0

    reader = csv.DictReader(read_text(path).splitlines())
    for row in reader:
        nome = row["Nome"].strip()
        if not nome:
            continue
        rnd = round_number(row["Rodada"])
        pos = int(row["Pos."])
        points = 1001 - pos
        max_round = max(max_round, rnd)

        rec = by_name.setdefault(nome, {"nome": nome, "estado": "", "scores": {}})
        rec["estado"] = row["UF"].strip()  # UF is constant per participant
        rec["scores"][rnd] = points

    return by_name, max_round


def build(rankings_path, class_path):
    by_name, num_rounds = load_rankings(rankings_path)
    qualified = load_qualified(class_path)

    participants = []
    for rec in by_name.values():
        # r[]: points per round, null for rounds not played.
        r = [rec["scores"].get(n) for n in range(1, num_rounds + 1)]
        played = [s for s in r if s is not None]

        part = len(played)
        total = sum(played)

        # descarte: sum of the best (num_rounds - NUM_DISCARDS) rounds,
        # blanks treated as 0 so they are dropped first.
        filled = [s if s is not None else 0 for s in r]
        keep = num_rounds - NUM_DISCARDS
        descarte = sum(sorted(filled, reverse=True)[:keep])

        media = round(total / part, 2) if part else 0.0

        participants.append({
            "nome": rec["nome"],
            "estado": rec["estado"],
            "class": rec["nome"] in qualified,
            "r": r,
            "part": part,
            "descarte": descarte,
            "total": total,
            "media": media,
        })

    # Primary: descarte desc. Deterministic tie-break: media desc, then name.
    participants.sort(key=lambda p: (-p["descarte"], -p["media"], p["nome"]))

    # Warn about qualified names that didn't match any ranking row (typos).
    unmatched = qualified - {p["nome"] for p in participants}
    if unmatched:
        print(f"WARNING: {len(unmatched)} class.csv name(s) not found in rankings:",
              file=sys.stderr)
        for n in sorted(unmatched):
            print(f"  - {n}", file=sys.stderr)

    return participants


def main():
    rankings_path = sys.argv[1] if len(sys.argv) > 1 else "rankings.csv"
    class_path = sys.argv[2] if len(sys.argv) > 2 else "class.csv"
    out_path = sys.argv[3] if len(sys.argv) > 3 else "data.json"

    participants = build(rankings_path, class_path)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(participants, f, ensure_ascii=False)

    print(f"Wrote {out_path}: {len(participants)} participants")


if __name__ == "__main__":
    main()
