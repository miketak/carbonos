"""Generates V43__seed_factor_pack_editions.sql from the shipped factor pack JSON (spec 02.5).

The ten JSON files in backend/src/main/resources/factor-packs are the packs the
server shipped before the catalogue existed. This script turns each of them into
one PUBLISHED edition of a family, with its rows, so the database holds what the
classpath used to hold. It runs once: the SQL it writes is committed, Flyway
checksums it, and the script is deleted with the JSON in the last phase of the
factor pack console (spec 02.7).

Two things it does are worth knowing:

- Values are written as the JSON states them, into unconstrained `numeric`
  columns, so an edition row carries the publisher's figure with the scale the
  publication used and the read path returns exactly what the file returned.
- `sourceDetail` is one concatenated string in the JSON and three columns in the
  catalogue. See `split_taxonomy` for the rule and what it was checked against.

Usage: python3 scripts/packs_to_seed_sql.py > \\
    backend/src/main/resources/db/migration/V43__seed_factor_pack_editions.sql
"""

import hashlib
import json
import sys
import uuid
from decimal import Decimal
from pathlib import Path

PACKS = Path(__file__).resolve().parent.parent / 'backend/src/main/resources/factor-packs'

# A fixed namespace so every environment seeds the same identifiers.
NAMESPACE = uuid.UUID('6f2a1d4e-0b3c-4f8a-9c1d-5e7a2b4c6d80')

# The family each shipped pack belongs to. A family is the lineage of one
# publication; the edition is the dated release. The order is the order the
# editions are seeded in.
FAMILIES = {
    'defra-2026': ('defra', 'UK Government (DESNZ) GHG conversion factors', 'SOURCE'),
    'ember-grid-2025': ('ember-grid', 'Ember national grid intensities (generation-based)', 'SOURCE'),
    'epa-hub-2025': ('epa-hub', 'US EPA GHG Emission Factors Hub', 'SOURCE'),
    'ghana': ('ghana', 'Ghana: grid electricity and transmission losses', 'SOURCE'),
    'ipcc-2006-process': ('ipcc-process', 'IPCC 2006 Guidelines: process emission defaults (Tier 1)', 'SOURCE'),
    'nga-2024-explosives': ('nga-explosives', 'Australian National Greenhouse Accounts Factors: explosives', 'SOURCE'),
    'refrigerants-ar5': ('refrigerants', 'Refrigerants and other fluorinated gases', 'SOURCE'),
    'sector-construction': ('sector-construction', 'Sector pack: construction', 'SECTOR'),
    'sector-mining': ('sector-mining', 'Sector pack: mining (Ghana and West Africa)', 'SECTOR'),
    'sector-oil-and-gas': ('sector-oil-and-gas', 'Sector pack: oil and gas', 'SECTOR'),
}

# The moment the ten seeded editions read as published: the day the catalogue
# migration ships, fixed rather than now() so V43 seeds the same rows in every
# environment and a wipe rebuilds an identical catalogue.
PUBLISHED_AT = '2026-09-13T00:00:00Z'

PROVENANCE_NOTE = (
    'Seeded from the JSON pack shipped with the server before the catalogue existed. The evidence '
    'checksum is the SHA-256 of that file, not of the publication, and no approver checked the rows '
    'against the source document. The separation-of-duties record starts at the next edition of this '
    'family.'
)

ROW_COLUMNS = [
    'id', 'edition_id', 'ordinal', 'code', 'name', 'default_scope', 'default_category', 'scope_agnostic', 'unit',
    'kg_co2e_per_unit', 'co2_kg_per_unit', 'ch4_kg_per_unit', 'ch4_fossil', 'n2o_kg_per_unit', 'hfcs_kg_per_unit',
    'pfcs_kg_per_unit', 'sf6_kg_per_unit', 'nf3_kg_per_unit', 'biogenic_co2_kg_per_unit', 'blend_composition',
    'blend_gwp_source', 'data_year', 'source_publication', 'source_url', 'publication_year', 'source_category',
    'source_activity', 'source_detail', 'co2e_only', 'approved', 'notes', 'reporting_basis',
]

EDITION_COLUMNS = [
    'edition_id', 'pack_key', 'name', 'status', 'source', 'source_url', 'publication_year', 'gwp_basis', 'license',
    'retrieved', 'notes', 'applies_from', 'published_at', 'source_document', 'evidence_name', 'evidence_size',
    'evidence_checksum', 'provenance_review', 'provenance_note', 'curator_name',
]


def split_taxonomy(code, source_detail):
    """Splits the concatenated sourceDetail back into category, activity and detail.

    `scripts/gen-factor-packs.py` wrote `category / activity / detail`, and a
    DESNZ activity almost always contains a ' / ' of its own ("Gaseous fuels /
    Butane"), while an EPA Hub or Ember detail does not. The publisher therefore
    decides where the second separator belongs. Checked against the source CSV
    tables the packs were built from: this rule reproduces the publisher's own
    category, activity and detail for all 2,722 rows drawn from a published
    table. The remaining 114 rows are hand-written derivations and templates
    whose sourceDetail is a free-text citation; a citation with no separator
    becomes the detail alone.
    """
    if not source_detail:
        return None, None, None
    parts = source_detail.split(' / ')
    if len(parts) == 1:
        return None, None, parts[0]
    if len(parts) == 2:
        return parts[0], parts[1], None
    if code.startswith('DEFRA:'):
        return parts[0], ' / '.join(parts[1:3]), ' / '.join(parts[3:]) or None
    return parts[0], parts[1], ' / '.join(parts[2:])


def quote(value):
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, Decimal):
        # plain notation, keeping the scale the publication stated
        return format(value, 'f')
    if isinstance(value, int):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def row_values(edition_id, ordinal, factor):
    category, activity, detail = split_taxonomy(factor['code'], factor.get('sourceDetail'))
    gases = ('co2', 'ch4', 'n2o', 'hfcsKg', 'pfcsKg', 'sf6', 'nf3')
    co2e_only = all(not factor.get(gas) for gas in gases)
    return [
        str(uuid.uuid5(NAMESPACE, 'row:' + edition_id + '|' + factor['code'])),
        edition_id,
        ordinal,
        factor['code'],
        factor['name'],
        factor['defaultScope'],
        factor['defaultCategory'],
        bool(factor.get('scopeAgnostic')),
        factor['unit'],
        factor['kgCo2ePerUnit'],
        factor.get('co2'),
        factor.get('ch4'),
        bool(factor.get('ch4Fossil')),
        factor.get('n2o'),
        factor.get('hfcsKg'),
        factor.get('pfcsKg'),
        factor.get('sf6'),
        factor.get('nf3'),
        factor.get('biogenicCo2'),
        factor.get('blendComposition'),
        factor.get('blendGwpSource'),
        factor.get('dataYear'),
        factor.get('sourcePublication'),
        factor.get('sourceUrl'),
        factor.get('publicationYear'),
        category,
        activity,
        detail,
        co2e_only,
        bool(factor.get('approved')),
        factor.get('notes'),
        factor.get('reportingBasis') or 'SCOPES',
    ]


def main():
    out = sys.stdout
    editions = []
    families = {}
    rows = []
    for edition_id, (pack_key, family_name, kind) in FAMILIES.items():
        path = PACKS / (edition_id + '.json')
        raw = path.read_bytes()
        pack = json.loads(raw.decode('utf-8'), parse_float=Decimal)
        checksum = hashlib.sha256(raw).hexdigest()
        families.setdefault(pack_key, (pack_key, family_name, kind, pack.get('notes')))
        editions.append([
            edition_id,
            pack_key,
            pack['name'],
            'PUBLISHED',
            pack['source'],
            pack.get('sourceUrl'),
            pack.get('publicationYear'),
            pack.get('gwpBasis'),
            pack.get('license'),
            pack.get('retrieved'),
            pack.get('notes'),
            'DATE %d-01-01' % pack['publicationYear'],
            PUBLISHED_AT,
            'factor-packs/%s.json, shipped with the server' % edition_id,
            '%s.json' % edition_id,
            len(raw),
            checksum,
            'SEED_UNCHECKED',
            PROVENANCE_NOTE,
            'seed',
        ])
        for ordinal, factor in enumerate(pack['factors'], start=1):
            rows.append(row_values(edition_id, ordinal, factor))

    out.write('''-- Spec 02.5: the ten packs the server shipped on the classpath become ten
-- PUBLISHED editions, one per family, with the 2,836 rows they carry today.
-- Generated once by scripts/packs_to_seed_sql.py from
-- backend/src/main/resources/factor-packs/*.json; never edit it by hand, as
-- Flyway checksums the file and a published edition's values never change.
--
-- Each edition applies from 1 January of its publication year, and its evidence
-- checksum is the SHA-256 of the JSON file it came from. The curator reads as
-- the seed and there is no approver, which chk_ghg_factor_pack_editions_published
-- allows only while provenance_review is SEED_UNCHECKED: a verifier can see that
-- these ten were not independently checked against their publications. An edition
-- authored in the console can never carry that value.

''')
    out.write('INSERT INTO ghg_factor_packs (pack_key, name, kind, summary) VALUES\n')
    out.write(',\n'.join('    (' + ', '.join(quote(v) for v in family) + ')' for family in families.values()))
    out.write(';\n\n')

    out.write('INSERT INTO ghg_factor_pack_editions (' + ', '.join(EDITION_COLUMNS) + ') VALUES\n')
    rendered = []
    for edition in editions:
        values = []
        for column, value in zip(EDITION_COLUMNS, edition):
            if column == 'applies_from':
                values.append(value.replace('DATE ', "DATE '") + "'")
            elif column == 'published_at':
                values.append("TIMESTAMPTZ '" + value + "'")
            else:
                values.append(quote(value))
        rendered.append('    (' + ', '.join(values) + ')')
    out.write(',\n'.join(rendered))
    out.write(';\n\n')

    out.write('-- The rows, in the order the pack file lists them.\n')
    batch = 250
    for start in range(0, len(rows), batch):
        chunk = rows[start:start + batch]
        out.write('INSERT INTO ghg_factor_pack_rows (' + ', '.join(ROW_COLUMNS) + ') VALUES\n')
        out.write(',\n'.join('    (' + ', '.join(quote(v) for v in row) + ')' for row in chunk))
        out.write(';\n\n')

    out.write('''-- The publication trail of a seeded edition: one entry saying where it came from.
INSERT INTO ghg_factor_pack_events (id, edition_id, action, actor_email, detail)
SELECT gen_random_uuid(), edition_id, 'PUBLISHED', NULL,
       'Seeded by V43 from the pack file shipped with the server; not checked against the publication'
FROM ghg_factor_pack_editions;

-- Spec 02.6: a factor an organization already holds gains the publisher's
-- taxonomy, matched on the publication row identifier. The three values are the
-- publisher's own, so a code that appears in more than one edition carries the
-- same three wherever it appears; the first edition by identifier stands in.
-- A hand-entered factor matches no edition row and keeps its nulls.
UPDATE ghg_emission_factors f
   SET source_category = r.source_category,
       source_activity = r.source_activity,
       source_detail   = r.source_detail
  FROM (SELECT DISTINCT ON (code) code, source_category, source_activity, source_detail
          FROM ghg_factor_pack_rows
         ORDER BY code, edition_id) r
 WHERE f.pack_code = r.code;
''')


if __name__ == '__main__':
    main()
