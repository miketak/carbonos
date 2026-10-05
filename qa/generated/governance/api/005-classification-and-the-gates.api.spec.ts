// generated from qa/packs/governance/005-classification-and-the-gates.yaml (sha256 7fe9604d84b44bc48c1dac1c8eea952164e2cadef84ed57ef923dda64be513f0); edit the YAML, then `make qa-compile`
import { procedure, test } from '../../../src/runtime/api/index.ts'

const P = procedure("governance", 5, "7fe9604d84b44bc48c1dac1c8eea952164e2cadef84ed57ef923dda64be513f0")

test.describe.configure({ mode: 'serial' })
test.describe("Procedure 5: Classification and the gates", () => {
  test.beforeAll(async () => P.start())
  test.afterAll(async () => P.finish())

  test("A1. Review decides the obvious records", async () => {
    await test.step("5.A1.1", async () => {
      const s = P.step("5.A1.1").as("ama")
      const out = await s.do("signIn", {"user":"ama"})
      await s.done()
    })
    await test.step("5.A1.2", async () => {
      const s = P.step("5.A1.2")
      const out = await s.do("openInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2025","tab":"Records"})
      await s.expect(out, [{"outcome":"recordCounts","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","total":10,"unclassified":8,"excluded":2}},{"outcome":"recordView","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0007","status":"EXCLUDED","reason":"OUTSIDE_BOUNDARY","detailContaining":"member from 2025-07-01"},"why":"E1 joined on 2025-07-01 and the record is earlier"},{"outcome":"recordView","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0008","status":"EXCLUDED","reason":"OUTSIDE_BOUNDARY"},"why":"the facility is not in the boundary"}])
    })
    await test.step("5.A1.3", async () => {
      const s = P.step("5.A1.3")
      await s.expect(undefined, [{"outcome":"observe","args":{"text":"Open ACT-0007's drawer: an excluded record's drawer has no tabs; the chip reads the computed reason and its detail, \"Excluded · Outside boundary (Adansi Logistics Ltd: member from 2025-07-01)\", and no justification was asked."}}])
    })
  })

  test("B1. A plain scope 1 line", async () => {
    await test.step("5.B1.1", async () => {
      const s = P.step("5.B1.1")
      const out = await s.do("classifyRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0001","factor":"Gaseous fuels: LPG (/litre)"})
      await s.expect(out, [{"outcome":"recordView","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0001","status":"INCLUDED","scope":"SCOPE_1","category":"STATIONARY_COMBUSTION","factor":"Gaseous fuels: LPG"},"why":"the stream's default scope is taken without a justification"},{"outcome":"observe","args":{"text":"The picker offered the defra-2025 version, the one live in the period, at 1.557 kg CO₂e per litre. There is no arithmetic preview line, because the record's unit is the factor's own (the preview appears only where a unit converts, as cases B2 and B4 show)."}}])
    })
  })

  test("B2. The grid factor is suggested", async () => {
    await test.step("5.B2.1", async () => {
      const s = P.step("5.B2.1")
      const out = await s.do("openRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0002"})
      await s.expect(out, [{"outcome":"screenReads","args":{"text":"Suggested for this facility's grid: Grid electricity, Ghana (2024)"},"why":"ACT-0002 is the plant grid electricity, 120 MWh; the Ghana pack's row for the data year is offered"}])
    })
    await test.step("5.B2.2", async () => {
      const s = P.step("5.B2.2")
      const out = await s.do("classifyWithSuggestion", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0002"})
      await s.expect(out, [{"outcome":"screenReads","args":{"text":"120 MWh → 120,000 kWh × 0.468809 kg CO₂e/kWh"}},{"outcome":"recordView","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0002","status":"INCLUDED","scope":"SCOPE_2","category":"PURCHASED_ELECTRICITY","factor":"Grid electricity, Ghana (2024)"}}])
    })
  })

  test("B3. A contractor's stream lands in scope 3, and the lease is inherited", async () => {
    await test.step("5.B3.1", async () => {
      const s = P.step("5.B3.1")
      const out = await s.do("classifyRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0003","factor":"Liquid fuels: Diesel (100% mineral diesel) (/litre)"})
      await s.expect(out, [{"outcome":"recordView","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0003","status":"INCLUDED","scope":"SCOPE_3","category":"PURCHASED_GOODS_SERVICES"},"why":"no justification field, the stream is operated by a contractor; the drawer says the lease \"operating lease (leased in)\" is inherited from Tema Depot"}])
    })
    await test.step("5.B3.2", async () => {
      const s = P.step("5.B3.2")
      await s.expect(undefined, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"CLASSIFICATION","severity":"WARNING","containing":"Records are classified into scope 3 '1. Purchased goods and services' but the declaration does not list it as covered. Declare it, or reclassify the records."}}])
    })
    await test.step("5.B3.3", async () => {
      const s = P.step("5.B3.3")
      const out = await s.do("declareScope3", {"organization":"Adansi Foods Ltd","inventory":"FY2025","categories":["INVESTMENTS","PURCHASED_GOODS_SERVICES"],"notQuantified":[{"category":"INVESTMENTS","reason":"Minority holding; no emissions data available this year"}]})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"CLASSIFICATION","containing":"scope 3 '1. Purchased goods and services' but the declaration does not list it","absent":true}}])
    })
  })

  test("B4. Mass meets volume through a density", async () => {
    await test.step("5.B4.1", async () => {
      const s = P.step("5.B4.1")
      const out = await s.do("pickFactorWithoutDensity", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0004","factor":"Liquid fuels: Diesel (100% mineral diesel) (/litre)"})
      await s.expect(out, [{"outcome":"screenReads","args":{"text":"tonne meets a factor per litre: choose the density that converts between them"},"why":"nothing is sent yet; the drawer keeps the factor in view and the gate still lists ACT-0004 as unclassified"}])
    })
    await test.step("5.B4.2", async () => {
      const s = P.step("5.B4.2")
      const out = await s.do("classifyRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0004","factor":"Liquid fuels: Diesel (100% mineral diesel) (/litre)","density":"Diesel (typical value)"})
      await s.expect(out, [{"outcome":"screenReads","args":{"text":"3 tonne → 3,571.4286 litre (density of Diesel, 0.84 kg/litre) × 2.66155 kg CO₂e/litre"}},{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"EMISSION_FACTOR","severity":"WARNING","containing":"'Forklift diesel' converts through the typical density of Diesel (0.84 kg/litre), a planning value. A run may use it; a final run may not: record the supplier's density, or flag the classification as a proxy with a justification."}}])
    })
    await test.step("5.B4.3", async () => {
      const s = P.step("5.B4.3")
      const out = await s.do("classifyRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0004","factor":"Liquid fuels: Diesel (100% mineral diesel) (/litre)","density":"Diesel (Adansi CoA)"})
      await s.expect(out, [{"outcome":"screenReads","args":{"text":"3 tonne → 3,603.6036 litre"}},{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"EMISSION_FACTOR","containing":"typical density","absent":true},"why":"procedure 6 puts the typical value back to read the final-run hold"}])
    })
  })

  test("B5. The DESNZ blend, and the hand-entered one", async () => {
    await test.step("5.B5.1", async () => {
      const s = P.step("5.B5.1")
      await s.expect(undefined, [{"outcome":"observe","args":{"text":"Open ACT-0005 (chiller refrigerant top-up, 20 kg) and search for \"R407C\": \"Blends: R407C, Emissions including only Kyoto products\" per kg, 1,624 kg CO₂e/kg, is offered."}}])
    })
    await test.step("5.B5.2", async () => {
      const s = P.step("5.B5.2")
      const out = await s.do("classifyRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0005","factor":"Blends: R407C, Emissions including only Kyoto products (/kg)"})
      await s.expect(out, [{"outcome":"recordView","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0005","status":"INCLUDED","scope":"SCOPE_1","category":"FUGITIVE_EMISSIONS"},"why":"no preview line, the record's unit is the factor's own; the factor publishes an HFC mass, so the by-gas table of a run carries 20 kg under HFCs"}])
    })
  })

  test("B6. A departure needs a justification; a proxy needs one too", async () => {
    await test.step("5.B6.1", async () => {
      const s = P.step("5.B6.1")
      const out = await s.do("classifyRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0001","factor":"Gaseous fuels: LPG (/litre)","scope":"SCOPE_3","category":"PURCHASED_GOODS_SERVICES"})
      await s.expect(out, [{"outcome":"screenReads","args":{"text":"The emission source suggests Scope 1."}},{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"CLASSIFICATION","severity":"ERROR","containing":"'Boiler LPG' is classified in scope 3; its emission source 'Boiler LPG' defaults to scope 1. Record why (a justification of at least 10 characters), or classify it in scope 1."}}])
    })
    await test.step("5.B6.2", async () => {
      const s = P.step("5.B6.2")
      const out = await s.do("classifyRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0001","factor":"Gaseous fuels: LPG (/litre)","scope":"SCOPE_1","category":"STATIONARY_COMBUSTION"})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"CLASSIFICATION","containing":"'Boiler LPG' is classified in scope 3","absent":true}}])
    })
    await test.step("5.B6.3", async () => {
      const s = P.step("5.B6.3")
      await s.expect(undefined, [{"outcome":"observe","args":{"text":"On ACT-0010 (staff flights), choose \"Long-haul flights (supplier)\" and tick proxy factor: a justification field opens and nothing is sent until it is filled. The drawer never records a proxy without its justification, so the rule \"A proxy factor needs a justification: say what the factor stands in for.\" is met before the API is reached."}}])
    })
    await test.step("5.B6.4", async () => {
      const s = P.step("5.B6.4")
      const out = await s.do("classifyRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0010","factor":"Long-haul flights (supplier)","proxy":true,"proxyJustification":"Travel agent's average; no per-flight data"})
      await s.expect(out, [{"outcome":"recordView","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0010","status":"INCLUDED","scope":"SCOPE_3","category":"BUSINESS_TRAVEL","proxy":true}},{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"CLASSIFICATION","severity":"WARNING","containing":"Records are classified into scope 3 '6. Business travel' but the declaration does not list it as covered. Declare it, or reclassify the records."}}])
    })
    await test.step("5.B6.5", async () => {
      const s = P.step("5.B6.5")
      const out = await s.do("declareScope3", {"organization":"Adansi Foods Ltd","inventory":"FY2025","categories":["INVESTMENTS","PURCHASED_GOODS_SERVICES","BUSINESS_TRAVEL"],"notQuantified":[{"category":"INVESTMENTS","reason":"Minority holding; no emissions data available this year"}]})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"CLASSIFICATION","containing":"scope 3 '6. Business travel' but the declaration does not list it","absent":true}}])
    })
  })

  test("B7. An unapproved factor blocks until the reviewer approves it", async () => {
    await test.step("5.B7.1", async () => {
      const s = P.step("5.B7.1")
      const out = await s.do("classifyRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0005","factor":"R-410A (composition)","showUnapproved":true})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"EMISSION_FACTOR","severity":"ERROR","containing":"'Chiller refrigerant top-up' uses 'R-410A (composition)', which is not approved. Approve it under Emission factors, or choose another."}}])
    })
    await test.step("5.B7.2", async () => {
      const s = P.step("5.B7.2").as("kofi")
      const out = await s.do("signIn", {"user":"kofi"})
      await s.done()
    })
    await test.step("5.B7.3", async () => {
      const s = P.step("5.B7.3")
      const out = await s.do("approveFactor", {"organization":"Adansi Foods Ltd","factor":"R-410A (composition)"})
      await s.expect(out, [{"outcome":"factorListed","args":{"organization":"Adansi Foods Ltd","name":"R-410A (composition)","approved":true,"approvedBy":"kofi"}}])
    })
    await test.step("5.B7.4", async () => {
      const s = P.step("5.B7.4").as("ama")
      await s.expect(undefined, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"EMISSION_FACTOR","containing":"which is not approved","absent":true}}])
    })
    await test.step("5.B7.5", async () => {
      const s = P.step("5.B7.5")
      const out = await s.do("classifyRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0005","factor":"Blends: R407C, Emissions including only Kyoto products (/kg)"})
      await s.done()
    })
  })

  test("C1. A methodology exclusion, not estimated", async () => {
    await test.step("5.C1.1", async () => {
      const s = P.step("5.C1.1")
      await s.expect(undefined, [{"outcome":"observe","args":{"text":"Open ACT-0009 (canteen waste), switch to Exclude and choose Methodology exclusion: the form asks for a justification, a magnitude in kg CO₂e, and offers the two statements \"This record emits nothing\" and \"Not estimated: there is no basis to size this record\". With \"short\" typed, the button stays disabled while the justification is under 10 characters, and while no magnitude and no statement is given."}}])
    })
    await test.step("5.C1.2", async () => {
      const s = P.step("5.C1.2")
      const out = await s.do("excludeRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0009","reason":"METHODOLOGY","justification":"Waste contractor's factor not available; supplier study pending","notEstimated":true})
      await s.expect(out, [{"outcome":"recordView","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0009","status":"EXCLUDED","reason":"METHODOLOGY","estimate":"NOT_ESTIMATED"},"why":"it never reads \"about 0 kg CO₂e\""}])
    })
  })

  test("C2. A Montreal Protocol gas is reported outside the scopes", async () => {
    await test.step("5.C2.1", async () => {
      const s = P.step("5.C2.1")
      await s.expect(undefined, [{"outcome":"observe","args":{"text":"Open ACT-0001 (litres) and read the reasons on Exclude: \"Outside the scopes: Montreal Protocol gas\" is not offered; the block reports a mass of gas, so the reason needs a mass unit. On ACT-0005 (kg) the reason is offered, and choosing it asks for a justification and a Gas, and no magnitude."}}])
    })
    await test.step("5.C2.2", async () => {
      const s = P.step("5.C2.2")
      const out = await s.do("excludeRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0005","reason":"OUTSIDE_SCOPES_NON_KYOTO","justification":"Scratch: reading the Montreal Protocol form","gas":"HCFC-22"})
      await s.expect(out, [{"outcome":"recordView","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0005","status":"EXCLUDED","reason":"OUTSIDE_SCOPES_NON_KYOTO","gas":"HCFC-22"}}])
    })
    await test.step("5.C2.3", async () => {
      const s = P.step("5.C2.3")
      const out = await s.do("includeRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0005"})
      await s.done()
    })
    await test.step("5.C2.4", async () => {
      const s = P.step("5.C2.4")
      const out = await s.do("classifyRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0005","factor":"Blends: R407C, Emissions including only Kyoto products (/kg)"})
      await s.expect(out, [{"outcome":"recordView","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0005","status":"INCLUDED","scope":"SCOPE_1","factor":"Blends: R407C, Emissions including only Kyoto products"},"why":"the record is included again, as case B5 left it"}])
    })
  })

  test("C3. A page of records under one reason", async () => {
    await test.step("5.C3.1", async () => {
      const s = P.step("5.C3.1")
      await s.expect(undefined, [{"outcome":"observe","args":{"text":"Tick ACT-0007 and ACT-0008 and read the footer: \"2 selected\" with Exclude 2 selected."}}])
    })
    await test.step("5.C3.2", async () => {
      const s = P.step("5.C3.2")
      const out = await s.do("excludeSelected", {"organization":"Adansi Foods Ltd","inventory":"FY2025","records":["ACT-0007","ACT-0008"],"reason":"NOT_APPLICABLE","justification":"Scratch: bulk exclusion"})
      await s.done()
    })
    await test.step("5.C3.3", async () => {
      const s = P.step("5.C3.3")
      const out = await s.do("includeRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0007"})
      await s.done()
    })
    await test.step("5.C3.4", async () => {
      const s = P.step("5.C3.4")
      const out = await s.do("includeRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0008"})
      await s.done()
    })
    await test.step("5.C3.5", async () => {
      const s = P.step("5.C3.5")
      const out = await s.do("reviewActivityData", {"organization":"Adansi Foods Ltd","inventory":"FY2025"})
      await s.expect(out, [{"outcome":"recordView","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0007","status":"EXCLUDED","reason":"OUTSIDE_BOUNDARY","detailContaining":"member from 2025-07-01"}},{"outcome":"recordView","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0008","status":"EXCLUDED","reason":"OUTSIDE_BOUNDARY"},"why":"review excludes both again with the computed reasons of case A1; nothing the tester typed survives"}])
    })
  })

  test("D1. Pro-rated by days, or blocked", async () => {
    await test.step("5.D1.1", async () => {
      const s = P.step("5.D1.1")
      const out = await s.do("classifyRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0006","factor":"Gaseous fuels: LPG (/litre)"})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"COMPLETENESS","severity":"WARNING","containing":"'Year-end boiler LPG' (Kumasi Plant) covers 2025-12-15 to 2026-01-15; 17 of 32 days fall inside the reporting period and the membership window: the run pro-rates it to 53.13%."}}])
    })
    await test.step("5.D1.2", async () => {
      const s = P.step("5.D1.2")
      const out = await s.do("setStraddleTreatment", {"organization":"Adansi Foods Ltd","inventory":"FY2025","straddle":"BLOCK"})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"COMPLETENESS","severity":"ERROR","containing":"17 of 32 days fall inside the reporting period and the membership window. The inventory blocks straddling records: split the record at the cut-off or exclude it."},"why":"the same finding is an error"}])
    })
    await test.step("5.D1.3", async () => {
      const s = P.step("5.D1.3")
      const out = await s.do("setStraddleTreatment", {"organization":"Adansi Foods Ltd","inventory":"FY2025","straddle":"PRO_RATE"})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"COMPLETENESS","severity":"WARNING","containing":"the run pro-rates it to 53.13%"}}])
    })
  })

  test("E1. Category 3 is quantified by an upstream rule", async () => {
    await test.step("5.E1.1", async () => {
      const s = P.step("5.E1.1")
      const out = await s.do("declareScope3", {"organization":"Adansi Foods Ltd","inventory":"FY2025","categories":["INVESTMENTS","PURCHASED_GOODS_SERVICES","BUSINESS_TRAVEL","FUEL_ENERGY_RELATED"],"notQuantified":[{"category":"INVESTMENTS","reason":"Minority holding; no emissions data available this year"}]})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"CLASSIFICATION","severity":"WARNING","containing":"Fuel- and energy-related activities is declared, but no upstream rule matches a scope 1 or scope 2 factor in this view; add a rule or say why category 3 is not quantified."}}])
    })
    await test.step("5.E1.2", async () => {
      const s = P.step("5.E1.2")
      await s.expect(undefined, [{"outcome":"observe","args":{"text":"On Method, in Add an upstream rule, type \"LPG\" in Narrow the primary factors and choose \"Gaseous fuels: LPG (/litre)\"; the Upstream factor list holds a group \"Suggested: named after the primary factor\" with \"Well-to-tank: Gaseous fuels: LPG (/litre)\", the defra-2025 version: both lists offer only the versions live in the inventory's period. The suggestion is offered, never applied."}}])
    })
    await test.step("5.E1.3", async () => {
      const s = P.step("5.E1.3")
      const out = await s.do("addUpstreamRule", {"organization":"Adansi Foods Ltd","inventory":"FY2025","primary":"Gaseous fuels: LPG (/litre)","upstream":"Well-to-tank: Gaseous fuels: LPG (/litre)","kind":"WELL_TO_TANK"})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"CLASSIFICATION","containing":"no upstream rule matches","absent":true},"why":"\"Upstream rule added.\" Every LPG litre now carries a well-to-tank line at 0.18551 kg CO₂e/litre"}])
    })
    await test.step("5.E1.4", async () => {
      const s = P.step("5.E1.4")
      const out = await s.do("addUpstreamRule", {"organization":"Adansi Foods Ltd","inventory":"FY2025","primary":"Gaseous fuels: LPG (/litre)","upstream":"Grid electricity, Ghana (2024) (/kWh)","kind":"WELL_TO_TANK"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.upstream-rule.unit-mismatch","with":{"upstream":"Grid electricity, Ghana (2024)","upstreamUnit":"kWh","primary":"Gaseous fuels: LPG","primaryUnit":"litre"}}}])
    })
  })

  test("E2. An instrument is applied only when the eight criteria are met", async () => {
    await test.step("5.E2.1", async () => {
      const s = P.step("5.E2.1")
      const out = await s.do("addInstrument", {"organization":"Adansi Foods Ltd","inventory":"FY2025","facility":"Kumasi Plant","instrument":"CERTIFICATE","kgCo2ePerKwh":0,"source":"I-REC(E) Ghana 2025","coveredMwh":150,"reference":"IREC-GH-2025-0091","registry":"I-TRACK","vintage":2025,"criteria":["met","met","unanswered","met","met","met","met","met"]})
      await s.expect(out, [{"outcome":"instrumentListed","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","facility":"Kumasi Plant","notApplied":"Not applied: 1 unanswered"},"why":"\"Instrument recorded for Kumasi Plant.\""}])
    })
    await test.step("5.E2.2", async () => {
      const s = P.step("5.E2.2")
      await s.expect(undefined, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"EMISSION_FACTOR","severity":"WARNING","containing":"The instrument for Kumasi Plant does not meet the Scope 2 Quality Criteria (1 of the eight criteria not yet answered): the market-based figure falls back to location-based."}},{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"EMISSION_FACTOR","severity":"WARNING","containing":"The instrument for Kumasi Plant covers 150,000 kWh but the facility's scope 2 electricity in its period is 120,000 kWh: the excess covers nothing."}}])
    })
    await test.step("5.E2.3", async () => {
      const s = P.step("5.E2.3")
      const out = await s.do("editInstrument", {"organization":"Adansi Foods Ltd","inventory":"FY2025","facility":"Kumasi Plant","criteria":["met","met","met","met","met","met","met","met"]})
      await s.expect(out, [{"outcome":"instrumentListed","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","facility":"Kumasi Plant","notApplied":false}},{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"EMISSION_FACTOR","containing":"does not meet the Scope 2 Quality Criteria","absent":true}},{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"EMISSION_FACTOR","severity":"WARNING","containing":"the excess covers nothing"},"why":"the first warning goes; the coverage warning stays"}])
    })
    await test.step("5.E2.4", async () => {
      const s = P.step("5.E2.4")
      const out = await s.do("editInstrument", {"organization":"Adansi Foods Ltd","inventory":"FY2025","facility":"Kumasi Plant","coveredMwh":120})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"EMISSION_FACTOR","containing":"the excess covers nothing","absent":true}}])
    })
  })

  test("E3. The residual mix is stated either way", async () => {
    await test.step("5.E3.1", async () => {
      const s = P.step("5.E3.1")
      await s.expect(undefined, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"EMISSION_FACTOR","severity":"WARNING","containing":"The inventory does not say whether a residual mix is available."}}])
    })
    await test.step("5.E3.2", async () => {
      const s = P.step("5.E3.2")
      const out = await s.do("setResidualMix", {"organization":"Adansi Foods Ltd","inventory":"FY2025","available":true})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.residual-mix.factor-required"}}])
    })
    await test.step("5.E3.3", async () => {
      const s = P.step("5.E3.3")
      const out = await s.do("setResidualMix", {"organization":"Adansi Foods Ltd","inventory":"FY2025","available":false})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"EMISSION_FACTOR","containing":"does not say whether a residual mix is available","absent":true},"why":"the report will print the double-counting disclosure and price uncovered kWh at the grid average"}])
    })
  })

  test("F1. A version is cut, and a frozen inventory refuses writes", async () => {
    await test.step("5.F1.1", async () => {
      const s = P.step("5.F1.1")
      await s.expect(undefined, [{"outcome":"noGateErrors","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025"},"why":"the warnings are the ones this procedure left: the straddling record and the partial-period membership, and the two factors that publish CO₂e only (the Ghana grid and the supplier's flights), whose emissions the by-gas table carries on one row"}])
    })
    await test.step("5.F1.2", async () => {
      const s = P.step("5.F1.2")
      const out = await s.do("freezeInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2025"})
      await s.expect(out, [{"outcome":"inventoryStatus","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","status":"FROZEN"}},{"outcome":"boundaryVersion","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","versionNo":1}},{"outcome":"screenReads","args":{"text":"Frozen. The boundary and the activity view are read-only and runs are allowed."}}])
    })
    await test.step("5.F1.3", async () => {
      const s = P.step("5.F1.3")
      await s.expect(undefined, [{"outcome":"boundaryRow","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","entity":"Adansi Logistics Ltd","inBoundary":true,"readOnly":true}},{"outcome":"observe","args":{"text":"Try to change ACT-0001's factor: the drawer shows the classification without its factor, scope and category controls. The lifecycle bar says the boundary and the view are read-only; reopen the inventory as a draft to change either."}}])
    })
    await test.step("5.F1.4", async () => {
      const s = P.step("5.F1.4")
      const out = await s.do("reopenInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2025","reason":"short"})
      await s.expect(out, [{"outcome":"dialogButtonDisabled","args":{"dialog":"Reopen as a draft?","button":"Reopen as draft","rule":"ghg.inventory.reopen-reason"}}])
    })
    await test.step("5.F1.5", async () => {
      const s = P.step("5.F1.5")
      const out = await s.do("reopenInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2025","reason":"Checking that a reopen keeps the version"})
      await s.expect(out, [{"outcome":"inventoryStatus","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","status":"DRAFT"}},{"outcome":"boundaryVersion","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","versionNo":1,"reopenReason":"Checking that a reopen keeps the version"},"why":"Runs carries the same act in the inventory's history"}])
    })
    await test.step("5.F1.6", async () => {
      const s = P.step("5.F1.6")
      const out = await s.do("freezeInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2025"})
      await s.expect(out, [{"outcome":"boundaryVersion","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","versionNo":2,"count":2}}])
    })
  })
})
