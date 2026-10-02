#!/usr/bin/env python3
"""Verify the calculation vectors independently of the Java engine.

Reads backend/src/test/resources/ghg/calculation-vectors.json and recomputes
every expected figure from the formulas the file's `notes` and the reference
page (docs/reference/calculation-vectors.md) state, with Python's decimal
module and nothing else: no Spring, no JPA, no LineMath. A disagreement
between this script and a vector means the vector's hand-computed figure and
the stated formula do not meet; a disagreement between the Java tests and a
vector that this script accepts means the engine drifted from the formula.

    python3 scripts/verify-calculation-vectors.py            # all groups
    python3 scripts/verify-calculation-vectors.py -v         # list every check
    python3 scripts/verify-calculation-vectors.py --only L04 M03

Exit code 0 when every vector agrees, 1 otherwise.

The formulas, as the reference page states them:

    periodShare   = coveredDays / totalDays, 6 decimals half up, exactly 1 when all days are covered
    share         = the boundary's accounting share, or 0 when no day is covered
    counted       = convertedQuantity x periodShare
    kgCo2e        = round3(counted x kgCo2ePerUnit x share), each gas column alike
    kgCo2ePerUnit = co2 + ch4 x GWP(CH4, fossil or biogenic) + n2o x GWP(N2O) + sf6 x GWP(SF6) + HFC CO2e
                    for a factor with a gas split, else the published CO2e
    HFC CO2e      = hfcsKg x sum(fraction x GWP(component)) from the blend composition under the run's set,
                    else the published CO2e minus the CO2 (the publication's own basis)
    run totals    = sums of the rounded lines; a Montreal Protocol gas counts in no total
    market-based  = round3((coveredKwh x instrumentRate + balanceKwh x balanceRate) x share),
                    an instrument consumed chronologically per facility, the balance at the
                    residual mix when available else the line's own location-based rate
    base year     = round2(affectedKg x 100 / baseKg); the running sum adds the earlier
                    changes not yet recalculated; above means strictly greater than the threshold
    tonnes        = round3(kg / 1000)
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from datetime import date
from decimal import ROUND_HALF_UP, Context, Decimal, localcontext
from pathlib import Path

VECTORS = Path(__file__).resolve().parent.parent / "backend/src/test/resources/ghg/calculation-vectors.json"

# DECIMAL64 as java.math.MathContext.DECIMAL64 defines it: 16 significant digits, half even.
DECIMAL64 = Context(prec=16, rounding="ROUND_HALF_EVEN")

D = Decimal
ZERO = D(0)
ONE = D(1)

# The registered units and their size in the base unit of their dimension (spec 04.3).
UNITS: dict[str, tuple[str, Decimal]] = {
    "litre": ("volume", D("1")),
    "US-gallon": ("volume", D("3.785411784")),
    "kg": ("mass", D("1")),
    "tonne": ("mass", D("1000")),
    "kWh": ("energy", D("1")),
    "MWh": ("energy", D("1000")),
}

# The base year the running-sum reasons cite. The vectors do not state it; the
# engine prints the inventory's base year, which the fixtures set to 2025.
BASE_YEAR = 2025


# ----------------------------------------------------------------------------
# Rounding, as the engine does it
# ----------------------------------------------------------------------------


def round_half_up(value: Decimal, places: int) -> Decimal:
    return value.quantize(D(1).scaleb(-places), rounding=ROUND_HALF_UP)


def round3(value: Decimal) -> Decimal:
    """A line's kilograms: three decimals, half up (LineMath.round)."""
    return round_half_up(value, 3)


def period_share(covered: int, total: int) -> Decimal:
    """coveredDays / totalDays to six decimals half up; exactly 1 when every day is covered."""
    if covered == total:
        return ONE
    return round_half_up(D(covered) / D(total), 6)


def percent_of_base(part: Decimal, base: Decimal) -> Decimal:
    """A part of the base as a percentage to two decimals half up; 0 against an empty base."""
    if base.is_zero():
        return ZERO
    return round_half_up(part * 100 / base, 2)


def tonnes(kg: Decimal) -> Decimal:
    return round_half_up(kg / 1000, 3)


def plain(value: Decimal) -> str:
    """A decimal with its trailing zeros stripped, never in exponent form (BigDecimal.toPlainString)."""
    value = value.normalize()
    if value == value.to_integral():
        return str(value.quantize(D(1)))
    return format(value, "f")


def kwh_text(value: Decimal) -> str:
    """DecimalFormat("#,##0.###") in Locale.ROOT."""
    rounded = round3(value).normalize()
    whole = int(rounded)
    frac = rounded - whole
    text = f"{whole:,}"
    if frac:
        text += format(frac, "f")[1:]
    return text


def pct_text(share: Decimal) -> str:
    """The pro-rating note's percentage: share x 100 to two decimals, trailing zeros stripped."""
    return plain(round_half_up(share * 100, 2))


# ----------------------------------------------------------------------------
# GWP sets (GwpSet in the backend, repeated in gwpReference for the reader)
# ----------------------------------------------------------------------------


@dataclass
class Gwp:
    name: str
    ch4_fossil: Decimal
    ch4_biogenic: Decimal
    n2o: Decimal
    sf6: Decimal
    components: dict[str, Decimal]

    def ch4(self, fossil: bool) -> Decimal:
        return self.ch4_fossil if fossil else self.ch4_biogenic


def load_gwps(reference: dict) -> dict[str, Gwp]:
    sets = {}
    for name, table in reference.items():
        components = {k.replace("_", "-"): D(v) for k, v in table.items() if k.startswith("HFC")}
        sets[name] = Gwp(name, D(table["CH4_fossil"]), D(table["CH4_biogenic"]), D(table["N2O"]), D(table["SF6"]), components)
    return sets


# ----------------------------------------------------------------------------
# Factors
# ----------------------------------------------------------------------------


@dataclass
class Factor:
    key: str
    scope: str
    category: str
    unit: str
    published: Decimal
    co2: Decimal = ZERO
    ch4: Decimal = ZERO
    ch4_fossil: bool = False
    n2o: Decimal = ZERO
    sf6: Decimal = ZERO
    biogenic_co2: Decimal = ZERO
    hfcs_kg: Decimal = ZERO
    blend_composition: str | None = None
    blend_gwp_source: str | None = None
    reporting_basis: str = "SCOPES"

    @classmethod
    def of(cls, key: str, raw: dict) -> "Factor":
        return cls(
            key=key,
            scope=raw["scope"],
            category=raw["category"],
            unit=raw["unit"],
            published=D(raw["kgCo2ePerUnit"]),
            co2=D(raw.get("co2", "0")),
            ch4=D(raw.get("ch4", "0")),
            ch4_fossil=bool(raw.get("ch4Fossil", False)),
            n2o=D(raw.get("n2o", "0")),
            sf6=D(raw.get("sf6", "0")),
            biogenic_co2=D(raw.get("biogenicCo2", "0")),
            hfcs_kg=D(raw.get("hfcsKg", "0")),
            blend_composition=raw.get("blendComposition"),
            blend_gwp_source=raw.get("blendGwpSource"),
            reporting_basis=raw.get("reportingBasis", "SCOPES"),
        )

    def hfcs_co2e_published(self) -> Decimal:
        """The HFC CO2e the publication implies: its CO2e minus its CO2, when it names an HFC mass."""
        if self.hfcs_kg.is_zero():
            return ZERO
        return max(self.published - self.co2, ZERO)

    def blend_converts(self, gwp: Gwp) -> bool:
        if not self.blend_composition:
            return False
        return all(part.split(":")[0] in gwp.components for part in self.blend_composition.split(","))

    def hfcs_co2e_per_unit(self, gwp: Gwp) -> Decimal:
        if self.hfcs_kg.is_zero():
            return ZERO
        if self.blend_converts(gwp):
            per_kg = sum((D(frac) * gwp.components[name] for name, frac in
                          (part.split(":") for part in self.blend_composition.split(","))), ZERO)
            return self.hfcs_kg * per_kg
        return self.hfcs_co2e_published()

    def has_gas_split(self) -> bool:
        return any(not x.is_zero() for x in (self.co2, self.ch4, self.n2o, self.sf6, self.hfcs_co2e_published()))

    def unsplit(self) -> bool:
        return not self.has_gas_split() and self.hfcs_kg.is_zero()

    def per_unit(self, gwp: Gwp) -> Decimal:
        if not self.has_gas_split():
            return self.published
        return (self.co2 + self.ch4 * gwp.ch4(self.ch4_fossil) + self.n2o * gwp.n2o
                + self.sf6 * gwp.sf6 + self.hfcs_co2e_per_unit(gwp))

    def blend_gwp_source_for(self, gwp: Gwp) -> str | None:
        if self.hfcs_kg.is_zero():
            return None
        return gwp.name if self.blend_converts(gwp) else self.blend_gwp_source


# ----------------------------------------------------------------------------
# Conversions (Conversion.of)
# ----------------------------------------------------------------------------


@dataclass
class Conversion:
    quantity: Decimal
    factor: Decimal
    note: str | None
    via_density: bool


def unit_of(code: str, custom: list[dict]) -> tuple[str, Decimal, str | None] | None:
    """The dimension and size of a unit; a custom unit is a multiple of a registered base."""
    if code in UNITS:
        dim, size = UNITS[code]
        return dim, size, None
    for unit in custom:
        if unit["code"] == code:
            dim, size = UNITS[unit["base"]]
            return dim, size * D(unit["factor"]), f"1 {code} = {plain(D(unit['factor']))} {unit['base']}"
    return None


def convert(quantity: Decimal, src: str, dst: str, density: dict | None, custom: list[dict]) -> Conversion | None:
    if src == dst:
        return Conversion(quantity, ONE, None, False)
    a = unit_of(src, custom)
    b = unit_of(dst, custom)
    if a is None or b is None:
        return None
    (dim_a, size_a, note_a), (dim_b, size_b, _) = a, b
    with localcontext(DECIMAL64):
        if dim_a == dim_b:
            factor = size_a / size_b
            return Conversion(quantity * factor, factor, note_a, False)
        if density is None or {dim_a, dim_b} != {"volume", "mass"}:
            return None
        d = D(density["kgPerLitre"])
        suffix = f"density of {density['material']}" + (", typical value" if density.get("typical") else "")
        if dim_a == "volume":
            litres = quantity * size_a
            kg = litres * d
            converted = kg / size_b
            note = f"{plain(quantity)} {src} = {plain(litres)} litre × {plain(d)} kg/litre = {plain(kg)} kg ({suffix})"
        else:
            kg = quantity * size_a
            litres = kg / d
            converted = litres / size_b
            note = f"{plain(quantity)} {src} = {plain(kg)} kg ÷ {plain(d)} kg/litre = {plain(round6(litres))} litre ({suffix})"
        factor = ZERO if quantity.is_zero() else converted / quantity
        return Conversion(converted, factor, note, True)


def round6(value: Decimal) -> Decimal:
    return round_half_up(value, 6)


# ----------------------------------------------------------------------------
# The check harness
# ----------------------------------------------------------------------------


@dataclass
class Report:
    verbose: bool
    failures: list[str] = field(default_factory=list)
    checks: int = 0
    vectors: int = 0

    def check(self, vector: str, what: str, expected, actual, equal=None) -> None:
        self.checks += 1
        ok = equal(expected, actual) if equal else expected == actual
        line = f"{vector:>4}  {what}: expected {expected!r}, got {actual!r}"
        if not ok:
            self.failures.append(line)
            print("FAIL  " + line)
        elif self.verbose:
            print("ok    " + line)

    def number(self, vector: str, what: str, expected, actual: Decimal | None, places: int | None = None) -> None:
        """compareTo semantics: 0.5 and 0.500000 agree; `places` compares both rounded there."""
        if expected is None or actual is None:
            self.check(vector, what, expected, None if actual is None else plain(actual))
            return
        e, a = D(expected), actual
        if places is not None:
            e, a = round_half_up(e, places), round_half_up(a, places)
        self.check(vector, what, plain(e), plain(a), lambda x, y: D(x) == D(y))

    def exact(self, vector: str, what: str, expected: str, actual: Decimal) -> None:
        """Value and scale, for the rounding stages (BigDecimal.equals)."""
        self.check(vector, what, expected, str(actual))


# ----------------------------------------------------------------------------
# Line vectors
# ----------------------------------------------------------------------------


def verify_lines(vec: dict, factors: dict[str, Factor], gwps: dict[str, Gwp], r: Report) -> None:
    vid = vec["id"]
    inp, exp = vec["inputs"], vec["expected"]
    gwp = gwps[inp["gwpSet"]]
    custom = inp.get("customUnits", [])
    residual = inp.get("residualMix")
    inventory_start, inventory_end = date.fromisoformat(inp["inventoryPeriod"]["start"]), date.fromisoformat(inp["inventoryPeriod"]["end"])
    instruments = {i["facility"]: i for i in inp.get("instruments", [])}
    remaining = {name: D(i["coveredKwh"]) for name, i in instruments.items()}

    lines = []  # (scope, kg, gases dict, reporting_basis, unsplit, market_kg, fossil)
    bases_applied: set[str] = set()
    cited = [gwp.name]

    for i, rec in enumerate(inp["records"]):
        er = exp["records"][i]
        f = factors[rec["factor"]]
        cov = rec["coverage"]
        ref = f"ACT-{rec['ref']:04d}"
        share = ZERO if cov["coveredDays"] == 0 else D(cov["share"])
        pshare = period_share(cov["coveredDays"], cov["totalDays"])
        conv = convert(D(rec["quantity"]), rec["unit"], f.unit, rec.get("density"), custom)
        assert conv is not None, f"{vid}: {rec['unit']} does not convert to {f.unit}"
        counted = conv.quantity * pshare
        per_unit = f.per_unit(gwp)

        def gas(per: Decimal) -> Decimal:
            return round3(counted * per * share)

        kg = gas(per_unit)
        hfcs_co2e = gas(f.hfcs_co2e_per_unit(gwp))
        row = {
            "kgCo2e": kg, "co2Kg": gas(f.co2), "ch4Kg": gas(f.ch4), "n2oKg": gas(f.n2o),
            "hfcsKgCo2e": hfcs_co2e, "sf6Kg": gas(f.sf6), "biogenicCo2Kg": gas(f.biogenic_co2), "hfcsKg": gas(f.hfcs_kg),
        }
        for k, v in row.items():
            r.number(vid, f"{ref} {k}", er.get(k, "0"), v)
        r.check(vid, f"{ref} blendGwpSource", er.get("blendGwpSource"), f.blend_gwp_source_for(gwp))
        r.check(vid, f"{ref} ch4Fossil", er.get("ch4Fossil", False), f.ch4_fossil)
        r.number(vid, f"{ref} convertedQuantity", er.get("convertedQuantity", "0"), conv.quantity, 6)
        r.number(vid, f"{ref} conversionFactor", er.get("conversionFactor", "0"), conv.factor, 6)
        r.check(vid, f"{ref} conversionNote", er.get("conversionNote"), conv.note)
        r.number(vid, f"{ref} kgCo2ePerUnit", er.get("kgCo2ePerUnit"), per_unit)
        r.number(vid, f"{ref} weight", er.get("weight", "0"), share)
        r.number(vid, f"{ref} periodShare", er.get("periodShare", "0"), pshare)
        note = None if pshare == ONE else (f"pro-rated: {cov['coveredDays']} of {cov['totalDays']} days inside the "
                                            f"reporting period and the membership window ({pct_text(pshare)}%)")
        r.check(vid, f"{ref} periodNote", er.get("periodNote"), note)
        r.check(vid, f"{ref} scope", er.get("scope"), f.scope)
        r.check(vid, f"{ref} category", er.get("category"), f.category)
        r.check(vid, f"{ref} reportingBasis", er.get("reportingBasis", "SCOPES"), f.reporting_basis)
        r.check(vid, f"{ref} unsplit", er.get("unsplit", False), f.unsplit())
        source = f.blend_gwp_source_for(gwp)
        if source and source not in cited:
            cited.append(source)

        # the market-based side of a scope 2 line
        market_kg = None
        if f.scope == "SCOPE_2":
            em = er.get("market") or {}
            if f.category != "PURCHASED_ELECTRICITY":
                market_kg = kg
                r.number(vid, f"{ref} market.kgCo2e", em.get("kgCo2e"), market_kg)
                r.check(vid, f"{ref} market.instrument", em.get("instrument"), None)
                r.number(vid, f"{ref} market.coveredKwh", em.get("coveredKwh", "0"), ZERO)
                r.number(vid, f"{ref} market.balanceKwh", em.get("balanceKwh", "0"), ZERO)
                if "noteStartsWith" in em:
                    r.check(vid, f"{ref} market.note starts with", True,
                            "no contractual instrument applies to".startswith(em["noteStartsWith"]))
            else:
                kwh_conv = convert(D(rec["quantity"]), rec["unit"], "kWh", None, custom)
                assert kwh_conv is not None
                kwh = kwh_conv.quantity * pshare
                with localcontext(DECIMAL64):
                    location_per_kwh = ZERO if kwh.is_zero() else counted * per_unit / kwh
                inst = instruments.get(rec["facility"])
                covered, inst_rate, applied, parts = ZERO, None, None, []
                rec_start, rec_end = date.fromisoformat(rec["period"]["start"]), date.fromisoformat(rec["period"]["end"])
                if inst is None:
                    parts.append("no contractual instrument")
                else:
                    eff_start = date.fromisoformat(inst["periodStart"]) if inst.get("periodStart") else inventory_start
                    eff_end = date.fromisoformat(inst["periodEnd"]) if inst.get("periodEnd") else inventory_end
                    if rec_end < eff_start or rec_start > eff_end:
                        parts.append(f"the facility's instrument covers {eff_start} to {eff_end}, not this record's period")
                    elif not inst.get("meetsQualityCriteria", True):
                        parts.append("the facility's instrument does not meet the Scope 2 Quality Criteria and was not applied")
                    else:
                        left = remaining[rec["facility"]]
                        covered = min(kwh, max(left, ZERO))
                        remaining[rec["facility"]] = left - covered
                        if covered > 0:
                            inst_rate = D(inst["kgCo2ePerKwh"])
                            applied = inst["type"]
                            parts.append(f"{kwh_text(covered)} kWh at {plain(inst_rate)} kg/kWh ({applied.lower().replace('_', ' ')})")
                        else:
                            parts.append("the facility's instrument is used up by earlier records")
                balance = kwh - covered
                residual_available = bool(residual and residual.get("available") and residual.get("kgCo2ePerKwh") is not None)
                balance_rate = D(residual["kgCo2ePerKwh"]) if residual_available else location_per_kwh
                basis = None
                if balance > 0:
                    basis = "RESIDUAL_MIX" if residual_available else "GRID_AVERAGE"
                    if residual_available:
                        tail = "residual mix"
                    else:
                        availability = ("residual-mix availability not stated" if residual is None or residual.get("available") is None
                                        else "no residual mix is available")
                        tail = f"grid average: the location-based figure stands, {availability}"
                    parts.append(f"{kwh_text(balance)} kWh at {plain(balance_rate)} kg/kWh ({tail})")
                market_kg = round3((covered * (inst_rate or ZERO) + balance * balance_rate) * share)
                reported = applied if applied else ("RESIDUAL_MIX" if basis == "RESIDUAL_MIX" else None)
                if applied:
                    bases_applied.add("INSTRUMENTS")
                elif basis == "RESIDUAL_MIX":
                    bases_applied.add("RESIDUAL_MIX")
                r.number(vid, f"{ref} market.kgCo2e", em.get("kgCo2e"), market_kg)
                r.check(vid, f"{ref} market.instrument", em.get("instrument"), reported)
                r.number(vid, f"{ref} market.coveredKwh", em.get("coveredKwh", "0"), covered)
                r.number(vid, f"{ref} market.balanceKwh", em.get("balanceKwh", "0"), balance)
                r.check(vid, f"{ref} market.balanceBasis", em.get("balanceBasis"), basis)
                note_text = "; ".join(parts)
                if "note" in em:
                    r.check(vid, f"{ref} market.note", em["note"], note_text)
                elif "noteStartsWith" in em:
                    r.check(vid, f"{ref} market.note starts with", True, note_text.startswith(em["noteStartsWith"]))

        lines.append((f.scope, kg, row, f.reporting_basis, f.unsplit(), market_kg, f.ch4_fossil))

        # derived category 3 lines
        derived_exp = er.get("derived", [])
        rules = rec.get("upstreamRules", [])
        r.check(vid, f"{ref} derived count", len(derived_exp), len(rules))
        for j, rule in enumerate(rules):
            up = factors[rule["upstream"]]
            ed = derived_exp[j] if j < len(derived_exp) else {}
            dconv = convert(D(rec["quantity"]), rec["unit"], up.unit, rec.get("density"), custom)
            assert dconv is not None, f"{vid}: {rec['unit']} does not convert to {up.unit}"
            dcounted = dconv.quantity * pshare
            dkg = round3(dcounted * up.per_unit(gwp) * share)
            dco2 = round3(dcounted * up.co2 * share)
            label = f"{ref} derived[{j}]"
            r.check(vid, f"{label} upstream", ed.get("upstream"), rule["upstream"])
            r.check(vid, f"{label} kind", ed.get("kind"), rule["kind"])
            r.number(vid, f"{label} kgCo2e", ed.get("kgCo2e"), dkg)
            r.number(vid, f"{label} co2Kg", ed.get("co2Kg"), dco2)
            r.check(vid, f"{label} scope", ed.get("scope"), up.scope)
            r.check(vid, f"{label} category", ed.get("category"), up.category)
            r.number(vid, f"{label} conversionFactor", ed.get("conversionFactor"), dconv.factor, 6)
            if rule["kind"] == "WELL_TO_TANK":
                dnote = f"well-to-tank of {ref} {rec['activityType']}"
            else:
                dnote = (f"transmission and distribution losses of {ref} {rec['activityType']}; "
                         "on the consumed kWh, not the market-based balance")
            r.check(vid, f"{label} note", ed.get("note"), dnote)
            lines.append((up.scope, dkg, {"co2Kg": dco2}, up.reporting_basis, up.unsplit(), None, False))

    # the run: sums of the rounded lines, nothing counted twice, nothing outside the scopes counted
    run = exp["run"]
    in_scope = [ln for ln in lines if ln[3] == "SCOPES"]

    def total(scope: str | None = None) -> Decimal:
        return sum((ln[1] for ln in in_scope if scope is None or ln[0] == scope), ZERO)

    def gas_total(key: str) -> Decimal:
        return sum((ln[2].get(key, ZERO) for ln in in_scope), ZERO)

    r.number(vid, "run totalKgCo2e", run.get("totalKgCo2e", "0"), total())
    r.number(vid, "run scope1KgCo2e", run.get("scope1KgCo2e", "0"), total("SCOPE_1"))
    r.number(vid, "run scope2KgCo2e", run.get("scope2KgCo2e", "0"), total("SCOPE_2"))
    r.number(vid, "run scope3KgCo2e", run.get("scope3KgCo2e", "0"), total("SCOPE_3"))
    r.number(vid, "run scope2MarketBasedKgCo2e", run.get("scope2MarketBasedKgCo2e", "0"),
             sum((ln[5] for ln in in_scope if ln[5] is not None), ZERO))
    basis = "INSTRUMENTS" if "INSTRUMENTS" in bases_applied else "RESIDUAL_MIX" if "RESIDUAL_MIX" in bases_applied else "GRID_AVERAGE"
    r.check(vid, "run scope2MarketBasis", run.get("scope2MarketBasis"), basis)
    for key in ("co2Kg", "ch4Kg", "n2oKg", "hfcsKgCo2e", "biogenicCo2Kg"):
        r.number(vid, f"run {key}", run.get(key, "0"), gas_total(key))
    r.number(vid, "run ch4FossilKg", run.get("ch4FossilKg", "0"), sum((ln[2].get("ch4Kg", ZERO) for ln in in_scope if ln[6]), ZERO))
    r.number(vid, "run co2eUnsplitKg", run.get("co2eUnsplitKg", "0"), sum((ln[1] for ln in in_scope if ln[4]), ZERO))
    r.check(vid, "run activityCount", run.get("activityCount"), len(lines))
    r.check(vid, "run outsideScopesLines", run.get("outsideScopesLines", 0), sum(1 for ln in lines if ln[3] != "SCOPES"))
    if run.get("assessmentReports"):
        r.check(vid, "run assessmentReports", run["assessmentReports"], cited)

    # the invariants every run keeps, as RunInvariants.assertAll states them
    tolerance = D(run.get("gasFootingToleranceKg", "0"))
    footing = ZERO
    for ln in in_scope:
        g = ln[2]
        if "ch4Kg" in g:  # a primary line
            footing += (g["co2Kg"] + g["ch4Kg"] * gwp.ch4(ln[6]) + g["n2oKg"] * gwp.n2o
                        + g["hfcsKgCo2e"] + g["sf6Kg"] * gwp.sf6)
            if ln[4]:
                footing += ln[1]
        else:
            footing += g["co2Kg"]
    r.check(vid, f"run gas rows foot to the total within {plain(tolerance)} kg", True,
            abs(footing - total()) <= tolerance + D("0.0000001"))
    r.check(vid, "run scopes sum to the total", True, total("SCOPE_1") + total("SCOPE_2") + total("SCOPE_3") == total())


# ----------------------------------------------------------------------------
# Pro-rating: the days a window covers of a record (BoundaryVersion.Coverage)
# ----------------------------------------------------------------------------


def coverage(inventory: dict, record: dict, window_from: str | None, window_to: str | None) -> tuple[int, int]:
    rs, re_ = date.fromisoformat(record["start"]), date.fromisoformat(record["end"])
    start = max(rs, date.fromisoformat(inventory["start"]), *( [date.fromisoformat(window_from)] if window_from else []))
    end = min(re_, date.fromisoformat(inventory["end"]), *( [date.fromisoformat(window_to)] if window_to else []))
    total = (re_ - rs).days + 1
    covered = max(0, (end - start).days + 1)
    return total, covered


def verify_pro_rating(vec: dict, r: Report) -> Decimal:
    vid, inp, exp = vec["id"], vec["inputs"], vec["expected"]
    total, covered = coverage(inp["inventoryPeriod"], inp["record"], inp.get("windowFrom"), inp.get("windowTo"))
    share = period_share(covered, total)
    r.check(vid, "days", exp["days"], total)
    r.check(vid, "coveredDays", exp["coveredDays"], covered)
    r.number(vid, "periodShare", exp["periodShare"], share)
    note = None if share == ONE else (f"pro-rated: {covered} of {total} days inside the reporting period "
                                      f"and the membership window ({pct_text(share)}%)")
    r.check(vid, "periodNote", exp.get("periodNote"), note)
    return share


# ----------------------------------------------------------------------------
# Conversions
# ----------------------------------------------------------------------------


def verify_conversion(vec: dict, r: Report) -> None:
    vid, inp, exp = vec["id"], vec["inputs"], vec["expected"]
    conv = convert(D(inp["quantity"]), inp["from"], inp["to"], inp.get("density"), inp.get("customUnits", []))
    r.check(vid, "present", exp["present"], conv is not None)
    if conv is None or not exp["present"]:
        return
    r.number(vid, "convertedQuantity", exp["convertedQuantity"], conv.quantity, 6)
    r.number(vid, "factor", exp["factor"], conv.factor, 6)
    r.check(vid, "note", exp.get("note"), conv.note)
    r.check(vid, "viaDensity", exp.get("viaDensity", False), conv.via_density)


# ----------------------------------------------------------------------------
# Base year: the running sum of recalculation candidates
# ----------------------------------------------------------------------------


def verify_base_year(vec: dict, r: Report) -> None:
    vid, inp, exp = vec["id"], vec["inputs"], vec["expected"]
    threshold, base = D(inp["thresholdPercent"]), D(inp["baseTotalKg"])
    flags: list[dict] = []  # {"percent", "status"}
    results = []
    for step in inp["steps"]:
        if step["op"] == "decide":
            flags[-1]["status"] = step["status"]
            continue
        pct = D(step["affectedPercent"]) if "affectedPercent" in step else percent_of_base(D(step["affectedKg"]), base)
        earlier = [f for f in flags if f["status"] != "RECALCULATED"]
        cumulative = pct + sum((f["percent"] for f in earlier), ZERO)
        above = pct > threshold or cumulative > threshold
        verdict = (f"above the {plain(threshold)}% threshold, recalculation required" if above
                   else f"below the {plain(threshold)}% threshold, recalculation optional")
        if earlier:
            n = len(earlier)
            reason = (f"{step['what']}; {plain(pct)}% of base-year emissions on its own, {plain(cumulative)}% together with "
                      f"{n} earlier change{'' if n == 1 else 's'} since the {BASE_YEAR} base year, {verdict}")
        else:
            reason = f"{step['what']}; {plain(pct)}% of base-year emissions, {verdict}"
        flags.append({"percent": pct, "status": "FLAGGED"})
        results.append((pct, cumulative, above, reason))
    r.check(vid, "flag count", len(exp["flags"]), len(results))
    for i, (pct, cumulative, above, reason) in enumerate(results):
        ef = exp["flags"][i]
        r.number(vid, f"flags[{i}].affectedPercent", ef["affectedPercent"], pct)
        r.number(vid, f"flags[{i}].cumulativePercent", ef["cumulativePercent"], cumulative)
        r.check(vid, f"flags[{i}].aboveThreshold", ef["aboveThreshold"], above)
        r.check(vid, f"flags[{i}].reason", ef["reason"], reason)
    r.check(vid, "hasUnresolvedFlag", exp["hasUnresolvedFlag"], any(f["status"] != "RECALCULATED" for f in flags))


# ----------------------------------------------------------------------------
# Rounding stages
# ----------------------------------------------------------------------------


def verify_rounding(vec: dict, r: Report) -> None:
    vid, stage = vec["id"], vec["stage"]
    if stage == "LINE_KG":
        r.exact(vid, "LINE_KG", vec["expected"], round3(D(vec["input"])))
    elif stage == "PERIOD_SHARE":
        r.exact(vid, "PERIOD_SHARE", vec["expected"], period_share(vec["coveredDays"], vec["totalDays"]))
    elif stage == "BASE_YEAR_PERCENT":
        r.exact(vid, "BASE_YEAR_PERCENT", vec["expected"], percent_of_base(D(vec["partKg"]), D(vec["baseKg"])))
    elif stage == "TONNES":
        r.exact(vid, "TONNES", vec["expected"], tonnes(D(vec["input"])))
    else:
        r.check(vid, "stage known", True, False)


# ----------------------------------------------------------------------------


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("file", nargs="?", default=str(VECTORS), help="the vector file (default: the repository's)")
    parser.add_argument("-v", "--verbose", action="store_true", help="print every check, not only the failures")
    parser.add_argument("--only", nargs="*", default=None, metavar="ID", help="vector ids to check (default: all)")
    args = parser.parse_args(argv)

    data = json.loads(Path(args.file).read_text(encoding="utf-8"))
    if data.get("version") != 1:
        print(f"unsupported vector format version {data.get('version')!r}")
        return 1
    gwps = load_gwps(data["gwpReference"])
    factors = {k: Factor.of(k, v) for k, v in data["factors"].items()}
    r = Report(verbose=args.verbose)
    wanted = set(args.only) if args.only else None

    def selected(vec: dict) -> bool:
        return wanted is None or vec["id"] in wanted

    shares: dict[str, Decimal] = {}
    for vec in data["lines"]:
        if selected(vec):
            r.vectors += 1
            verify_lines(vec, factors, gwps, r)
    for vec in data["proRating"]:
        shares[vec["id"]] = verify_pro_rating(vec, r) if selected(vec) else None
        r.vectors += selected(vec)
    for vec in data["proRatingSums"]:
        if selected(vec) or wanted is None:
            parts = [shares.get(v) for v in vec["vectors"]]
            if all(p is not None for p in parts):
                r.vectors += 1
                r.number(vec["id"], f"sum of {' + '.join(vec['vectors'])}", vec["expected"], sum(parts, ZERO), 6)
    for vec in data["conversions"]:
        if selected(vec):
            r.vectors += 1
            verify_conversion(vec, r)
    for vec in data["baseYear"]:
        if selected(vec):
            r.vectors += 1
            verify_base_year(vec, r)
    for vec in data["baseYearShares"]:
        if selected(vec):
            r.vectors += 1
            r.exact(vec["id"], "percentOfBase", vec["expected"],
                    percent_of_base(D(vec["inputs"]["partKg"]), D(vec["inputs"]["baseKg"])))
    for vec in data["rounding"]:
        if selected(vec):
            r.vectors += 1
            verify_rounding(vec, r)

    print(f"{r.vectors} vectors, {r.checks} checks, {len(r.failures)} failures")
    return 1 if r.failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
