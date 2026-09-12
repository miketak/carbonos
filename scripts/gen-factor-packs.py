"""Builds CarbonOS factor packs (JSON) from the ghg-inventory skill's published tables."""
import csv, json, re, sys
from collections import OrderedDict
from pathlib import Path

DATA = Path.home() / '.claude/skills/ghg-inventory/data/factors'
OUT = Path(sys.argv[1])
META = json.load(open(DATA / 'metadata.json'))['tables']

UNITS = {
    'tonnes': 'tonne', 'tonne': 'tonne', 'kg': 'kg', 'litres': 'litre', 'litre': 'litre', 'cubic metres': 'm3',
    'kWh': 'kWh', 'kWh (Gross CV)': 'kWh', 'GJ': 'GJ', 'km': 'km', 'miles': 'mile', 'passenger.km': 'passenger-km',
    'tonne.km': 'tonne-km', 'Room per night': 'room-night', 'mmBtu': 'mmBtu', 'gallon': 'US-gallon',
    'short ton': 'short-ton', 'scf': 'scf', 'vehicle-mile': 'mile', 'passenger-mile': 'passenger-mile',
    'short ton-mile': 'short-ton-mile', 'MWh': 'MWh',
}
SPECIES = {'HFC-23','HFC-32','HFC-41','HFC-125','HFC-134A','HFC-143A','HFC-152A','HFC-227EA','HFC-236FA','HFC-245FA',
           'HFC-365MFC','HFC-43-10MEE','PFC-14','PFC-116','PFC-218','PFC-318','PFC-3-1-10'}

def num(v):
    try:
        return float(v) if v not in ('', None) else 0.0
    except ValueError:
        return 0.0

def prov(meta_key):
    """The publication a row comes from (spec 02.3): a pack is a selection, a row cites its source."""
    m = META[meta_key]
    return dict(sourcePublication=m['source'], sourceUrl=m['url'], publicationYear=m['vintage'])


def row_factor(r, name, scope, category, agnostic, unit, ch4_fossil=True, biogenic=0.0, extra=None, meta_key=None):
    co2e = num(r['co2e_kg'])
    f = OrderedDict(code=r['factor_id'], name=name, defaultScope=scope, defaultCategory=category,
                    scopeAgnostic=agnostic, unit=unit, kgCo2ePerUnit=round(co2e, 6), co2=round(num(r['co2_kg']), 6),
                    ch4=round(num(r['ch4_kg']), 8), ch4Fossil=ch4_fossil, n2o=round(num(r['n2o_kg']), 8),
                    hfcsKg=0, blendComposition=None, blendGwpSource=None, biogenicCo2=round(biogenic, 6),
                    dataYear=int(r['vintage']), sourceDetail=(r['category'] + ' / ' + r['activity'] + (' / ' + r['detail'] if r['detail'] else '')).strip(),
                    approved=True, notes=r['notes'], reportingBasis='SCOPES')
    if meta_key:
        f.update(prov(meta_key))
    if extra:
        f.update(extra)
    # a row with no gas split: keep the CO2e only (the run uses it as-is)
    if f['co2'] == 0 and f['ch4'] == 0 and f['n2o'] == 0 and f['hfcsKg'] == 0:
        f['co2'] = 0
    return f

def pack(pid, name, meta_key, factors, extra_note=''):
    m = META[meta_key]
    return OrderedDict(id=pid, name=name, source=m['source'], sourceUrl=m['url'], publicationYear=m['vintage'],
                       gwpBasis=m['gwp_basis'], license=m['licence'], retrieved=m['retrieved'],
                       notes=extra_note, factors=factors)

def write(p):
    (OUT / f"{p['id']}.json").write_text(json.dumps(p, indent=1, ensure_ascii=False))
    print(p['id'], len(p['factors']))

# ---------- DEFRA ----------
defra = list(csv.DictReader(open(DATA / 'defra-2026.csv', encoding='utf-8')))
biogenic = {}
for r in defra:
    if r['category'] == 'Outside of scopes' and r['unit'] in UNITS:
        biogenic[(r['activity'], r['detail'], r['unit'])] = num(r['co2_kg']) or num(r['co2e_kg'])

MONTREAL = 'Montreal protocol products'


def is_montreal(r):
    return r['category'] == 'Refrigerant & other' and r['activity'].startswith(MONTREAL)


def montreal_name(activity):
    """"Montreal protocol products / HCFC-22/R22 = chlorodifluoromethane" reads "HCFC-22 (R-22)"."""
    species = activity.split('/', 1)[1].strip().split(' = ')[0].strip()
    if '/' in species:
        gas, alias = (part.strip() for part in species.split('/', 1))
        if alias.upper().startswith('R') and not alias.upper().startswith('R-'):
            alias = 'R-' + alias[1:]
        return f'{gas} ({alias})'
    return species


def defra_name(r):
    act = r['activity'].replace(' / ', ': ')
    return (act + (', ' + r['detail'] if r['detail'] else '')).strip()

CAT = {
    'Fuels': ('SCOPE_1', 'STATIONARY_COMBUSTION', True),
    'Bioenergy': ('SCOPE_1', 'STATIONARY_COMBUSTION', True),
    'Refrigerant & other': ('SCOPE_1', 'FUGITIVE_EMISSIONS', False),
    'Passenger vehicles': ('SCOPE_1', 'MOBILE_COMBUSTION', True),
    'Delivery vehicles': ('SCOPE_1', 'MOBILE_COMBUSTION', True),
    'Managed assets- vehicles': ('SCOPE_1', 'MOBILE_COMBUSTION', True),
    'UK electricity': ('SCOPE_2', 'PURCHASED_ELECTRICITY', False),
    'Heat and steam': ('SCOPE_2', 'PURCHASED_HEAT_STEAM', False),
    'Transmission and distribution': ('SCOPE_3', 'FUEL_ENERGY_RELATED', False),
    'WTT- fuels': ('SCOPE_3', 'FUEL_ENERGY_RELATED', False),
    'WTT- bioenergy': ('SCOPE_3', 'FUEL_ENERGY_RELATED', False),
    'WTT- UK electricity': ('SCOPE_3', 'FUEL_ENERGY_RELATED', False),
    'WTT- heat and steam': ('SCOPE_3', 'FUEL_ENERGY_RELATED', False),
    'Water supply': ('SCOPE_3', 'PURCHASED_GOODS_SERVICES', False),
    'Water treatment': ('SCOPE_3', 'WASTE_GENERATED', False),
    'Material use': ('SCOPE_3', 'PURCHASED_GOODS_SERVICES', False),
    'Waste disposal': ('SCOPE_3', 'WASTE_GENERATED', False),
    'Business travel- air': ('SCOPE_3', 'BUSINESS_TRAVEL', False),
    'Business travel- land': ('SCOPE_3', 'BUSINESS_TRAVEL', False),
    'Business travel- sea': ('SCOPE_3', 'BUSINESS_TRAVEL', False),
    'Hotel stay': ('SCOPE_3', 'BUSINESS_TRAVEL', False),
    'Freighting goods': ('SCOPE_3', 'UPSTREAM_TRANSPORT', False),
    'WTT- business travel- air': ('SCOPE_3', 'BUSINESS_TRAVEL', False),
    'WTT- pass vehs & travel- land': ('SCOPE_3', 'BUSINESS_TRAVEL', False),
    'WTT- business travel- sea': ('SCOPE_3', 'BUSINESS_TRAVEL', False),
    'WTT- delivery vehs & freight': ('SCOPE_3', 'UPSTREAM_TRANSPORT', False),
}
seen = set()
dfactors = []
for r in defra:
    cat = r['category']
    if cat not in CAT or r['unit'] not in UNITS:
        continue
    if cat == 'Refrigerant & other' and 'Total emissions' in r['detail']:
        continue  # the "including only Kyoto products" variant is kept
    if cat.startswith('Business travel- air') or cat == 'WTT- business travel- air':
        if 'Without RF' in r['detail']:
            continue  # keep the with-RF rows, DEFRA's recommendation
    name = montreal_name(r['activity']) if is_montreal(r) else defra_name(r)
    if cat.startswith('WTT'):
        name = 'Well-to-tank: ' + name
    key = (name, UNITS[r['unit']])
    if key in seen:
        continue
    seen.add(key)
    scope, category, agnostic = CAT[cat]
    extra = {}
    fossil = True
    bio = 0.0
    if cat in ('Bioenergy',):
        fossil = False
        bio = biogenic.get((r['activity'], r['detail'], r['unit']), 0.0)
    if cat == 'Waste disposal' or cat == 'Water treatment':
        fossil = False
    if cat == 'Refrigerant & other':
        sp = r['activity'].split('/')[-1].strip().upper()
        extra = dict(hfcsKg=1, blendGwpSource='AR5', co2=0, ch4=0, n2o=0)
        if is_montreal(r):
            # spec 02.4: Chapter 4 counts the seven Kyoto gas groups; a Montreal Protocol gas is not one
            extra['reportingBasis'] = 'OUTSIDE_SCOPES_NON_KYOTO'
            extra['notes'] = ('A Montreal Protocol gas, not a Kyoto gas. Its mass is reported outside the scopes as '
                              'optional information under Chapter 4 and Chapter 9, with the CO2e DESNZ publishes on '
                              'the AR5 basis; no scope total includes it.')
            extra['blendGwpSource'] = 'AR5' 
        if sp in SPECIES:
            extra['blendComposition'] = f"{sp.replace('HFC-134A','HFC-134a').replace('HFC-143A','HFC-143a').replace('HFC-152A','HFC-152a').replace('HFC-227EA','HFC-227ea').replace('HFC-236FA','HFC-236fa').replace('HFC-245FA','HFC-245fa').replace('HFC-365MFC','HFC-365mfc').replace('HFC-43-10MEE','HFC-43-10mee')}:1"
        if 'PFC' in sp or sp in ('CF4','C2F6'):
            extra['hfcsKg'] = 0
            extra['pfcsKg'] = 1
        if any(x in sp for x in ('SF6', 'NF3', 'CO2', 'CH4', 'N2O', 'R-', 'CFC', 'HCFC')):
            if sp not in SPECIES:
                extra['notes'] = r['notes'] + ' Reported on the source basis; not rebased between GWP sets.'
    if num(r['co2e_kg']) == 0 and cat != 'Bioenergy':
        continue
    dfactors.append(row_factor(r, name, scope, category, agnostic, UNITS[r['unit']], fossil, bio, extra, 'defra-2026.csv'))
write(pack('defra-2026', 'UK Government (DESNZ) GHG conversion factors 2026', 'defra-2026.csv', dfactors,
           'Fuels, bioenergy, refrigerants, UK electricity and T&D, well-to-tank, water, materials, waste, travel and freight. UK factors apply to Ghanaian activity by analogy; say so in the report.'))

# ---------- EPA Hub ----------
epa = list(csv.DictReader(open(DATA / 'epa-hub-2025.csv', encoding='utf-8')))
ECAT = {
    'Stationary combustion': ('SCOPE_1', 'STATIONARY_COMBUSTION', True),
    'Mobile combustion CO2': ('SCOPE_1', 'MOBILE_COMBUSTION', True),
    'Mobile combustion CH4 N2O (on-road gasoline)': ('SCOPE_1', 'MOBILE_COMBUSTION', True),
    'Mobile combustion CH4 N2O (on-road diesel & alternative fuel)': ('SCOPE_1', 'MOBILE_COMBUSTION', True),
    'Mobile combustion CH4 N2O (non-road)': ('SCOPE_1', 'MOBILE_COMBUSTION', True),
    'Purchased steam and heat': ('SCOPE_2', 'PURCHASED_HEAT_STEAM', False),
    'Scope 3 cat 4/9: transport & distribution': ('SCOPE_3', 'UPSTREAM_TRANSPORT', False),
    'Scope 3 cat 5/12: waste treatment (WARM)': ('SCOPE_3', 'WASTE_GENERATED', False),
    'Scope 3 cat 6/7: business travel & commuting': ('SCOPE_3', 'BUSINESS_TRAVEL', False),
}
efactors = []
seen = set()
for r in epa:
    cat = r['category']
    if cat.startswith('Electricity (US eGRID'):
        if 'location-based' not in r['unit'] and 'location-based' not in r['detail']:
            continue
        unit = 'MWh'
        scope, category, agnostic = 'SCOPE_2', 'PURCHASED_ELECTRICITY', False
        name = 'US grid electricity, ' + r['activity']
    elif cat in ECAT and r['unit'] in UNITS:
        scope, category, agnostic = ECAT[cat]
        unit = UNITS[r['unit']]
        name = (r['activity'] + (', ' + r['detail'] if r['detail'] else '')).strip()
        if cat.startswith('Mobile combustion CH4'):
            name = 'Mobile CH4 and N2O: ' + name
    else:
        continue
    if num(r['co2e_kg']) == 0:
        continue
    key = (name, unit)
    if key in seen:
        continue
    seen.add(key)
    fossil = cat != 'Scope 3 cat 5/12: waste treatment (WARM)'
    efactors.append(row_factor(r, name, scope, category, agnostic, unit, fossil, meta_key='epa-hub-2025.csv'))
write(pack('epa-hub-2025', 'US EPA GHG Emission Factors Hub 2025', 'epa-hub-2025.csv', efactors,
           'Stationary and mobile combustion per US unit, eGRID subregions (location-based), steam, freight, travel and WARM waste factors. US factors apply to West African activity by analogy; say so in the report.'))

# ---------- Ember grid ----------
ember = list(csv.DictReader(open(DATA / 'grid-intl-ember-2025.csv', encoding='utf-8')))
gfactors = []
for r in ember:
    name = 'Grid electricity, ' + r['activity'].split(' (')[0] + ' (' + r['vintage'] + ')'
    f = row_factor(r, name, 'SCOPE_2', 'PURCHASED_ELECTRICITY', False, 'kWh', meta_key='grid-intl-ember-2025.csv')
    f['notes'] = r['notes'] + ' CO2e only: the source publishes no gas split.'
    gfactors.append(f)
write(pack('ember-grid-2025', 'Ember national grid intensities (generation-based)', 'grid-intl-ember-2025.csv', gfactors,
           'Location-based grid factors for every country Ember covers, by data year; a secondary source to use where no national or IFI factor is published.'))

# ---------- refrigerants (GWP) ----------
gwp = list(csv.DictReader(open(DATA / 'gwp.csv', encoding='utf-8')))
rfactors = []
def parse_comp(detail):
    parts = []
    for piece in detail.split(','):
        m = re.match(r'\s*([\d.]+)%\s+(.+?)\s*$', piece)
        if not m:
            return None
        frac, sp = float(m.group(1)) / 100, m.group(2).strip()
        if sp.upper() not in SPECIES:
            return None
        parts.append(f"{sp}:{round(frac, 4)}")
    return ','.join(parts)
for r in gwp:
    sp = r['activity']
    if sp in ('Carbon dioxide', 'Methane', 'Nitrous oxide') or num(r['co2e_kg']) <= 1:
        continue
    comp = None
    if sp.upper() in SPECIES:
        comp = f"{sp}:1"
    elif r['detail'] and '%' in r['detail']:
        comp = parse_comp(r['detail'])
    is_pfc = sp.upper().startswith('PFC') or sp in ('CF4', 'C2F6')
    f = OrderedDict(code=r['factor_id'], name=f"Refrigerant {sp} leakage", defaultScope='SCOPE_1',
                    defaultCategory='FUGITIVE_EMISSIONS', scopeAgnostic=False, unit='kg',
                    kgCo2ePerUnit=round(num(r['co2e_kg']), 6), co2=0, ch4=0, ch4Fossil=True, n2o=0,
                    hfcsKg=0 if is_pfc or sp in ('Sulfur hexafluoride', 'Nitrogen trifluoride') else 1,
                    pfcsKg=1 if is_pfc else 0,
                    sf6=1 if sp == 'Sulfur hexafluoride' else 0, nf3=1 if sp == 'Nitrogen trifluoride' else 0,
                    blendComposition=comp, blendGwpSource='AR5', biogenicCo2=0, dataYear=int(r['vintage']),
                    sourceDetail='EPA Hub Tables 11-12 (IPCC AR5 GWP100)' + (': ' + r['detail'] if r['detail'] else ''),
                    approved=True, reportingBasis='SCOPES', **prov('gwp.csv'),
                    notes=r['notes'] + ('' if comp else ' Composition includes a component with no Kyoto potential or not in the species table; the CO2e is kept on the AR5 basis.'))
    if sp in ('Sulfur hexafluoride', 'Nitrogen trifluoride'):
        f['hfcsKg'] = 0
    rfactors.append(f)
# spec 02.4: HCFC-22 is the common refrigerant in West African air conditioning and the EPA GWP table
# carries no Montreal Protocol row, so the pack selects the DESNZ one, which reports outside the scopes
MONTREAL_ROWS = [f for f in dfactors if f.get('reportingBasis') == 'OUTSIDE_SCOPES_NON_KYOTO']
HCFC_22 = [f for f in MONTREAL_ROWS if f['name'] == 'HCFC-22 (R-22)']
if not HCFC_22:
    raise SystemExit('the DESNZ pack no longer carries an HCFC-22 Montreal Protocol row')
rfactors = rfactors + [OrderedDict(f) for f in HCFC_22]
write(pack('refrigerants-ar5', 'Refrigerants and other fluorinated gases (EPA Hub, IPCC AR5)', 'gwp.csv', rfactors,
           'Kilograms of gas leaked. Blends with a recorded composition are converted with the inventory GWP set. '
           'HCFC-22 (R-22) comes from the DESNZ 2026 table: it is a Montreal Protocol gas, not a Kyoto gas, so its '
           'mass is reported outside the scopes with the CO2e DESNZ publishes for information.'))

# ---------- hand-written packs: IPCC 2006 process defaults, Ghana, and sector selections ----------
# The publication hand-written rows cite, switched per pack (spec 02.3).
HAND_PROV = (None, None, None)


def hand(code, name, scope, category, unit, co2e, co2=None, ch4=0, n2o=0, fossil=True, year=2006, detail='',
         approved=True, notes='', agnostic=False, bio=0, sf6=0, nf3=0):
    publication, url, published = HAND_PROV
    return OrderedDict(code=code, name=name, defaultScope=scope, defaultCategory=category, scopeAgnostic=agnostic,
                       unit=unit, kgCo2ePerUnit=co2e, co2=co2e if co2 is None else co2, ch4=ch4, ch4Fossil=fossil,
                       n2o=n2o, hfcsKg=0, blendComposition=None, blendGwpSource=None, biogenicCo2=bio, dataYear=year,
                       sourceDetail=detail, approved=approved, notes=notes, reportingBasis='SCOPES', sf6=sf6, nf3=nf3,
                       sourcePublication=publication, sourceUrl=url, publicationYear=published if published else year)


IPCC_V2 = ('IPCC 2006 Guidelines for National Greenhouse Gas Inventories, Volume 2 (Energy), Chapter 4 '
           '(Fugitive Emissions)', 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol2.html')
IPCC_V3 = ('IPCC 2006 Guidelines for National Greenhouse Gas Inventories, Volume 3 (Industrial Processes and '
           'Product Use)', 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol3.html')
IPCC_V4 = ('IPCC 2006 Guidelines for National Greenhouse Gas Inventories, Volume 4 (Agriculture, Forestry and '
           'Other Land Use), Chapter 4 (Forest Land)', 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol4.html')
NGA_2024 = ('Australian Government DCCEEW, National Greenhouse Accounts Factors, 2024',
            'https://www.dcceew.gov.au/climate-change/publications/national-greenhouse-accounts-factors')
GHANA_SRC = ('Energy Commission of Ghana, National Energy Statistics (system losses), applied to the Ember '
             'generation intensity', 'https://www.energycom.gov.gh/')


def override(rows, code, **changes):
    """A selected row with a different name or note, without touching the pack it comes from."""
    for row in rows:
        if row['code'] == code:
            copy = OrderedDict(row)
            copy.update(changes)
            return [copy]
    raise SystemExit(f'row {code} is not in the pack any more; fix the selection')

HAND_PROV = (IPCC_V3[0], IPCC_V3[1], 2006)
ipcc = OrderedDict(id='ipcc-2006-process', name='IPCC 2006 Guidelines: process emission defaults (Tier 1)',
    source='IPCC 2006 Guidelines for National Greenhouse Gas Inventories, Volume 3 (Industrial Processes and Product Use)',
    sourceUrl='https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol3.html', publicationYear=2006, gwpBasis='AR5',
    license='IPCC, free to use with attribution', retrieved='2026-09-09',
    notes='Tier 1 defaults per tonne of product. Use plant-specific data (Tier 2 or 3) where the plant measures its own raw materials.',
    factors=[
        hand('IPCC:2006:clinker', 'Cement clinker production (calcination)', 'SCOPE_1', 'PROCESS_EMISSIONS', 'tonne', 510.0, year=2006,
             detail='Volume 3, Chapter 2, Section 2.2.1.2, equation 2.4: 0.510 t CO2 per t clinker before the cement kiln dust correction', agnostic=True),
        hand('IPCC:2006:lime-high-calcium', 'Quicklime (high-calcium lime) calcination', 'SCOPE_1', 'PROCESS_EMISSIONS', 'tonne', 750.0, year=2006,
             detail='Volume 3, Chapter 2, Table 2.4: 0.75 t CO2 per t high-calcium lime (stoichiometric ratio 0.785 at 100% CaO)', agnostic=True),
        hand('IPCC:2006:lime-dolomitic', 'Dolomitic lime calcination', 'SCOPE_1', 'PROCESS_EMISSIONS', 'tonne', 770.0, year=2006,
             detail='Volume 3, Chapter 2, Table 2.4: 0.77 t CO2 per t dolomitic lime', agnostic=True),
        hand('IPCC:2006:glass', 'Glass production (carbonate raw materials)', 'SCOPE_1', 'PROCESS_EMISSIONS', 'tonne', 200.0, year=2006,
             detail='Volume 3, Chapter 2, Section 2.4.2.1: 0.20 t CO2 per t glass at the default cullet ratio', agnostic=True),
        hand('IPCC:2006:ammonia', 'Ammonia production (natural gas feedstock)', 'SCOPE_1', 'PROCESS_EMISSIONS', 'tonne', 1694.0, year=2006,
             detail='Volume 3, Chapter 3, Table 3.1: 1.694 t CO2 per t NH3, modern conventional natural gas reforming', agnostic=True),
    ])
write(ipcc)

HAND_PROV = (NGA_2024[0], NGA_2024[1], 2024)
nga = OrderedDict(id='nga-2024-explosives', name='Australian National Greenhouse Accounts Factors 2024: explosives',
    source='Australian Government DCCEEW, National Greenhouse Accounts Factors, 2024',
    sourceUrl='https://www.dcceew.gov.au/climate-change/publications/national-greenhouse-accounts-factors',
    publicationYear=2024, gwpBasis='AR5', license='CC BY 4.0', retrieved='2026-09-09',
    notes='The only widely used published factor for explosives; applied to Ghanaian mining by analogy. IPCC 2006 publishes none.',
    factors=[
        hand('NGA:2024:explosives', 'Explosives detonation (ANFO, emulsion, heavy ANFO)', 'SCOPE_1', 'PROCESS_EMISSIONS', 'tonne', 170.0, year=2024,
             detail='NGA Factors 2024, explosives: 0.17 t CO2-e per t of explosive, all types', agnostic=True),
    ])
write(nga)

HAND_PROV = (GHANA_SRC[0], GHANA_SRC[1], 2025)
ghana = OrderedDict(id='ghana', name='Ghana: grid electricity and transmission losses',
    source='Ember Yearly Electricity Data (grid intensity); Energy Commission of Ghana, National Energy Statistics (system losses)',
    sourceUrl='https://www.energycom.gov.gh/', publicationYear=2025, gwpBasis='AR5', license='Ember CC BY 4.0; Energy Commission publications',
    retrieved='2026-09-09',
    notes='Ghana publishes no official grid emission factor. Ember intensity is the location-based factor; replace it with the Energy Commission or an IFI figure when one is published for the year. The T&D loss factor is derived and needs the year\'s loss rate.',
    factors=[])
for f in gfactors:
    if 'Ghana' in f['name']:
        g = OrderedDict(f); g['code'] = f['code'].replace('EMBER', 'GHANA'); ghana['factors'].append(g)
latest = [f for f in gfactors if 'Ghana' in f['name']][-1]
ghana['factors'].append(hand('GHANA:td-losses', 'Grid electricity T&D losses, Ghana (derived)', 'SCOPE_3', 'FUEL_ENERGY_RELATED', 'kWh',
    round(latest['kgCo2ePerUnit'] * 0.20 / 0.80, 6), year=int(latest['dataYear']),
    detail=f"Scope 3 category 3: the {latest['dataYear']} Ember intensity of {latest['kgCo2ePerUnit']} kg CO2e/kWh times the share lost in transmission and distribution (20% of generation, Energy Commission National Energy Statistics, system losses), per kWh consumed",
    approved=False, notes='Derived, not published: approve it after checking the year\'s loss rate with the Energy Commission statistics, or replace it with the utility\'s figure.'))
write(ghana)

# ---------- spec 02.4: flaring, the flared-gas proxy and land clearing ----------
# Values fetched from the IPCC 2006 Guidelines and cited by table, row and unit; never estimated.
HAND_PROV = (IPCC_V2[0], IPCC_V2[1], 2006)
flaring = [
    # 1 Gg per 10^6 m3 is 1 kg per m3, so the published values are kg per m3 of throughput; the row is
    # per thousand cubic metres because the CH4 and N2O components per m3 fall below the six decimals a
    # factor stores (spec 02.3 divergence, recorded in spec 02.4).
    hand('IPCC:2006:flaring-gas-production', 'Flaring, gas production (per 1000 m3 gas produced)', 'SCOPE_1',
         'STATIONARY_COMBUSTION', '1000m3', round(1.2 + 0.00076 * 28 + 0.000021 * 265, 6), co2=1.2, ch4=0.00076,
         n2o=0.000021, year=2006, approved=False, agnostic=False,
         detail='Volume 2, Chapter 4, Table 4.2.4 (developed countries), Gas Production, Flaring (IPCC code '
                '1.B.2.b.ii): CH4 7.6E-07, CO2 1.2E-03 and N2O 2.1E-08 Gg per 10^6 m3 of gas produced. 1 Gg per '
                '10^6 m3 is 1 kg per m3, so per 1,000 m3 produced the values are CO2 1.2, CH4 0.00076 and N2O '
                '0.000021 kg. Table 4.2.5 (developing countries and economies in transition) carries the same '
                'figures as the lower bound of its range, up to CH4 1.0E-06, CO2 1.6E-03 and N2O 2.9E-08',
         notes='A production-based Tier 1 default: it applies to the gas produced, not to the volume flared. '
               'Confirm the segment and the flaring practice before approving it. Where the flared volume is '
               'metered, use a per-cubic-metre-flared row instead.'),
    hand('IPCC:2006:flaring-oil-production', 'Flaring, oil production (per m3 oil produced)', 'SCOPE_1',
         'STATIONARY_COMBUSTION', 'm3', round(41.0 + 0.025 * 28 + 0.00064 * 265, 6), co2=41.0, ch4=0.025,
         n2o=0.00064, year=2006, approved=False,
         detail='Volume 2, Chapter 4, Table 4.2.4 (developed countries), Oil Production, Conventional Oil, Flaring '
                '(IPCC code 1.B.2.a.ii): CH4 2.5E-05, CO2 4.1E-02 and N2O 6.4E-07 Gg per 10^3 m3 of conventional '
                'oil produced. 1 Gg per 10^3 m3 is 1,000 kg per m3, so per m3 produced the values are CO2 41, CH4 '
                '0.025 and N2O 0.00064 kg. Table 4.2.5 carries the same figures as the lower bound of its range',
         notes='A production-based Tier 1 default: it applies to the oil produced, not to the volume flared. '
               'Confirm the segment and the amount of gas conserved before approving it.'),
    hand('IPCC:2006:flaring-per-m3-flared', 'Flared gas, per m3 flared (IPCC default composition)', 'SCOPE_1',
         'STATIONARY_COMBUSTION', 'm3', round(2.0 + 0.012 * 28 + 0.000023 * 265, 6), co2=2.0, ch4=0.012,
         n2o=0.000023, year=2006, approved=False,
         detail='Volume 2, Chapter 4, Table 4.2.5, footnote (e): the emission factors for direct estimation of CH4, '
                'CO2 and N2O emissions from reported flared volumes are 0.012, 2.0 and 0.000023 Gg respectively per '
                '10^6 m3 of gas flared, at a flaring efficiency of 98% and a typical gas analysis at a gas '
                'processing plant (91.9% CH4, 0.58% CO2, 0.68% N2 and 6.84% non-methane hydrocarbons by volume). '
                '1 Gg per 10^6 m3 is 1 kg per m3',
         notes='Use this row where the flared volume is metered. It assumes the IPCC default composition and 98% '
               'flaring efficiency, so the 2% that escapes uncombusted is already in the CH4 component. A site '
               'with a measured composition enters a supplier-specific factor instead.'),
]
HAND_PROV = (META['defra-2026.csv']['source'], META['defra-2026.csv']['url'], META['defra-2026.csv']['vintage'])
flaring.append(
    hand('PROXY:2026:flared-gas-as-natural-gas', 'Flared gas, per m3 flared, as natural gas fully combusted (proxy)',
         'SCOPE_1', 'STATIONARY_COMBUSTION', 'm3', 2.02633, co2=2.02231, ch4=0.0001096428571, n2o=3.58490566e-06,
         year=2026, approved=False,
         detail='Fuels, Gaseous fuels: Natural gas, per cubic metre (2.02633 kg CO2e, of which CO2 2.02231, CH4 '
                '0.00010964 and N2O 0.00000358), applied to the volume flared',
         notes='A proxy, not a flaring factor: it assumes complete combustion of a natural-gas composition, so it '
               'understates the methane a real flare lets through. Record the uncombusted fraction separately '
               'against the methane row, or use the IPCC per-cubic-metre-flared row.'))

HAND_PROV = (IPCC_V4[0], IPCC_V4[1], 2006)
# 260 t d.m./ha above ground (Table 4.7, tropical moist deciduous forest, Africa) x (1 + 0.24) root-to-shoot
# (Table 4.4, above-ground biomass > 125 t/ha) x 0.47 t C per t d.m. (Table 4.3, tropical and subtropical)
# x 44/12 = 555,602.67 kg CO2 per hectare cleared.
LAND_CLEARING = hand('IPCC:2006:land-clearing-tropical-moist-forest', 'Land clearing, tropical moist forest (per hectare)',
    'SCOPE_1', 'PROCESS_EMISSIONS', 'hectare', round(260 * 1.24 * 0.47 * 44 / 12 * 1000, 6), year=2006, approved=False,
    detail='Volume 4, Chapter 4: Table 4.7 above-ground biomass, tropical moist deciduous forest, Africa, 260 tonnes '
           'd.m. per hectare; Table 4.4 root-to-shoot ratio 0.24 for tropical moist deciduous forest above 125 tonnes '
           'per hectare; Table 4.3 carbon fraction 0.47 tonne C per tonne d.m. for tropical and subtropical. '
           '260 x 1.24 x 0.47 x 44/12 = 555.60 tonnes CO2 per hectare of biomass carbon lost',
    notes='A placeholder until a land-use-change category exists. The Land Sector and Removals Guidance amortizes '
          'land-use-change CO2 over 20 years, so this one-shot per-hectare value overstates a single year. It is '
          'classified as scope 1 process emissions because no land-use category exists yet. Confirm the ecological '
          'zone before approving it, and say in the report which treatment was applied.')

HAND_PROV = (None, None, None)
# Supplier-factor templates (spec 02.4): DESNZ publishes no lime, cement, cyanide or grinding-media row, so
# the pack ships an unapproved shell with every value zero and the document to obtain.
def template(code, name, document):
    return OrderedDict(code=code, name=name, defaultScope='SCOPE_3', defaultCategory='PURCHASED_GOODS_SERVICES',
                       scopeAgnostic=False, unit='tonne', kgCo2ePerUnit=0, co2=0, ch4=0, ch4Fossil=True, n2o=0,
                       hfcsKg=0, blendComposition=None, blendGwpSource=None, biogenicCo2=0, dataYear=2026,
                       sourceDetail='No published factor: enter the supplier figure', approved=False,
                       reportingBasis='SCOPES',
                       sourcePublication='Supplier factor, to be obtained', sourceUrl=None, publicationYear=None,
                       notes='A template, not a factor. Obtain ' + document + ', enter the kg CO2e per tonne and '
                             'the gas split it states, cite it as the source, then approve the factor. Until the '
                             'value is entered and the factor approved, the run is blocked.')


TEMPLATES = [
    template('TEMPLATE:supplier:quicklime', 'Quicklime purchased (supplier factor)',
             "the lime supplier's product carbon footprint or environmental product declaration"),
    template('TEMPLATE:supplier:cement', 'Cement purchased (supplier factor)',
             "the cement supplier's product carbon footprint or environmental product declaration"),
    template('TEMPLATE:supplier:sodium-cyanide', 'Sodium cyanide purchased (supplier factor)',
             "the cyanide supplier's product carbon footprint or environmental product declaration"),
    template('TEMPLATE:supplier:grinding-media', 'Grinding media purchased (supplier factor)',
             "the grinding-media supplier's product carbon footprint or environmental product declaration"),
]


def select(pack_factors, patterns, rename=None):
    out = []
    for f in pack_factors:
        if any(re.search(p, f['name'], re.I) for p in patterns):
            g = OrderedDict(f)
            out.append(g)
    return out

MINING_NOTES = ("Fuels for haul fleets and gensets, explosives, refrigerants including HCFC-22 (a Montreal Protocol gas, reported outside the scopes), waste, grid power and T&D losses, travel and commuting. Purchased goods: DESNZ publishes no lime or cement row, so the pack ships the construction concrete row and the construction-metals average as a proxy for steel and grinding media (flag the record as a proxy and say what it stands in for), plus unapproved supplier-factor templates for quicklime, cement, sodium cyanide and grinding media. Obtain the supplier's product carbon footprint or environmental product declaration, enter the value and approve the factor; until then the run is blocked. Land clearing ships one unapproved IPCC per-hectare row. Tailings and mine-water treatment have no published factor: record a supplier or study factor by hand. The IPCC calcination rows stay scope 1, for a site that calcines its own lime or clinker.")

OILGAS_NOTES = ("Fuels burned on site and offshore, flaring, refrigerants including HCFC-22 (a Montreal Protocol gas, reported outside the scopes), well-to-tank and transport. Methane, nitrous oxide, carbon dioxide, SF6 and NF3 emitted as themselves are in the shared library, one kilogram of gas per kilogram, so a vented or fugitive mass derived from the site gas composition follows the inventory's GWP set (1 kg CH4 is 28 kg CO2e under AR5 and 29.8 under AR6). Flaring ships four unapproved rows: the IPCC Tier 1 production-based defaults per thousand cubic metres of gas produced and per cubic metre of oil produced, the IPCC per-cubic-metre-flared default at 98% efficiency and a typical gas analysis, and a DESNZ natural-gas proxy that assumes complete combustion. Confirm the segment and the composition before approving one.")


def sector(pid, name, notes, rows):
    return OrderedDict(id=pid, name=name, source='Selection from the DEFRA 2026, EPA Hub 2025, IPCC 2006 and NGA 2024 packs',
        sourceUrl='', publicationYear=2026, gwpBasis='AR5', license='See each factor\'s source pack', retrieved='2026-09-09',
        notes=notes, factors=rows)

mining = sector('sector-mining', 'Sector pack: mining (Ghana and West Africa)',
    MINING_NOTES,
    select(dfactors, [r'^Liquid fuels: Diesel \(100% mineral diesel\)', r'^Liquid fuels: Fuel oil', r'^Liquid fuels: Burning oil', r'^Liquid fuels: LPG', r'^Solid fuels: Coal \(industrial\)', r'^Well-to-tank: Liquid fuels: Diesel \(100% mineral', r'^Well-to-tank: Liquid fuels: Fuel oil', r'^Well-to-tank: Liquid fuels: LPG',
                     r'^Metal: Steel', r'^Construction: Aggregates', r'^Construction: Concrete, Primary material production', r'^Refuse: Commercial and industrial waste, Landfill', r'^Refuse: Commercial and industrial waste, Combustion', r'^Metal: Steel cans, Landfill', r'^Metal: Scrap metal',
                     r'^Flights, Long-haul, to/from non-UK, Economy class', r'^Flights, Long-haul, to/from non-UK, Business class', r'^Flights, Short-haul, to/from UK, Economy', r'^Flights, Domestic, to/from UK, Average passenger', r'^Bus, Local bus \(not London\)', r'^Cars \(by size\), Average car, Diesel', r'^Cars \(by size\), Average car, Petrol', r'^HGV \(all diesel\), All HGVs, Average laden'])
    + select(efactors, [r'Construction/Mining Equipment', r'Diesel Fuel$', r'Diesel Fuel, ', r'Motor Gasoline$'])
    + select(rfactors, [r'R-410A', r'R-407C', r'R-404A', r'R-134a', r'R-22 ', r'R-32 ', r'HFC-134a', r'HFC-32', r'^HCFC-22 \(R-22\)$'])
    # spec 02.4: a construction-metal average stands in for steel and grinding media; the note says so
    + override(dfactors, 'DEFRA:Material_use:Construction_Metals:Primary_material_production:tonnes',
               notes='A construction-metal average, not a steel or grinding-media factor. Use it as a proxy: tick '
                     '"proxy factor" on the record and say what it stands in for, or replace it with the supplier '
                     'template once the mill or supplier publishes a figure.')
    + [OrderedDict(f) for f in TEMPLATES] + [OrderedDict(LAND_CLEARING)]
    + [OrderedDict(f) for f in nga['factors']] + [OrderedDict(f) for f in ipcc['factors'] if 'lime' in f['name'].lower() or 'clinker' in f['name'].lower()]
    + [OrderedDict(f) for f in ghana['factors']])
write(mining)

oilgas = sector('sector-oil-and-gas', 'Sector pack: oil and gas',
    OILGAS_NOTES,
    select(dfactors, [r'^Gaseous fuels: Natural gas', r'^Gaseous fuels: CNG', r'^Gaseous fuels: LNG', r'^Liquid fuels: Diesel \(100% mineral diesel\)', r'^Liquid fuels: Fuel oil', r'^Liquid fuels: Marine gas oil', r'^Liquid fuels: Marine fuel oil', r'^Liquid fuels: Aviation turbine fuel', r'^Liquid fuels: Naphtha', r'^Liquid fuels: Petroleum coke', r'^Liquid fuels: Refinery miscellaneous', r'^Well-to-tank: Gaseous fuels: Natural gas', r'^Well-to-tank: Liquid fuels: Diesel \(100% mineral', r'^Well-to-tank: Liquid fuels: Fuel oil', r'^Sea tanker, Crude tanker', r'^Sea tanker, Products tanker', r'^Flights, Long-haul, to/from non-UK, Economy class', r'^Cars \(by size\), Average car, Diesel'])
    + select(efactors, [r'Natural Gas, ', r'Natural Gas$', r'Distillate Fuel Oil No\. 2', r'Residual Fuel Oil No\. 6', r'Propane Gas', r'Propane \(Liquid\)', r'Crude Oil', r'Kerosene'])
    + [OrderedDict(f) for f in ipcc['factors'] if 'ammonia' in f['name'].lower()]
    + select(rfactors, [r'R-410A', r'R-134a', r'R-22 ', r'Sulfur hexafluoride', r'^HCFC-22 \(R-22\)$'])
    + [OrderedDict(f) for f in flaring]
    + [OrderedDict(f) for f in ghana['factors']])
write(oilgas)

construction = sector('sector-construction', 'Sector pack: construction',
    'Site fuels and plant, cement, clinker, concrete, steel, aggregates, asphalt, timber and other materials as purchased goods, construction waste, freight and travel.',
    select(dfactors, [r'^Liquid fuels: Diesel \(100% mineral diesel\)', r'^Liquid fuels: Gas oil', r'^Liquid fuels: LPG', r'^Construction: ', r'^Metal: Steel', r'^Metal: Aluminium', r'^Refuse: Construction', r'^Construction waste', r'^Metal: Steel cans', r'^HGV \(all diesel\), All HGVs, Average laden', r'^Vans, Average \(up to 3.5 tonnes\), Diesel', r'^Cars \(by size\), Average car, Diesel', r'^Flights, Long-haul, to/from non-UK, Economy class', r'^Bus, Local bus \(not London\)', r'^Well-to-tank: Liquid fuels: Diesel \(100% mineral'])
    + select(efactors, [r'Construction/Mining Equipment'])
    + [OrderedDict(f) for f in ipcc['factors'] if 'clinker' in f['name'].lower() or 'lime' in f['name'].lower() or 'glass' in f['name'].lower()]
    + [OrderedDict(f) for f in ghana['factors']])
write(construction)
