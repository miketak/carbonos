// generated from qa/packs/governance/006-runs-final-publication-and-correction.yaml (sha256 d6db999181acda2225fbb786067e5958d28eb5f772055233469c12ea43f9ba1b); edit the YAML, then `make qa-compile`
import { procedure, test } from '../../../src/runtime/api/index.ts'

const P = procedure("governance", 6, "d6db999181acda2225fbb786067e5958d28eb5f772055233469c12ea43f9ba1b")

test.describe.configure({ mode: 'serial' })
test.describe("Procedure 6: Runs, final, publication and correction", () => {
  test.beforeAll(async () => P.start())
  test.afterAll(async () => P.finish())

  test("A1. The first run, and its lines", async () => {
    await test.step("6.A1.1", async () => {
      const s = P.step("6.A1.1").as("ama")
      const out = await s.do("signIn", {"user":"ama"})
      await s.done()
    })
    await test.step("6.A1.2", async () => {
      const s = P.step("6.A1.2")
      const out = await s.do("launchRun", {"organization":"Adansi Foods Ltd","inventory":"FY2025"})
      await s.expect(out, [{"outcome":"runListed","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":1,"totalKgCo2e":120458.96,"boundaryVersion":2}}])
    })
    await test.step("6.A1.3", async () => {
      const s = P.step("6.A1.3")
      const out = await s.do("openRun", {"organization":"Adansi Foods Ltd","inventory":"FY2025","run":1})
      await s.expect(out, [{"outcome":"runLine","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":1,"record":"ACT-0004","kgCo2e":9591.17,"conversionNote":"3 tonne = 3000 kg ÷ 0.8325 kg/litre = 3603.603604 litre (density of Diesel (Adansi CoA))"}},{"outcome":"runLine","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":1,"record":"ACT-0006","kgCo2e":661.78,"coveredDays":17,"periodDays":32}},{"outcome":"runLine","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":1,"record":"ACT-0001","derived":true,"kgCo2e":445.22}},{"outcome":"runLine","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":1,"record":"ACT-0006","derived":true,"kgCo2e":78.84},"why":"one line per included record as the table in the preamble lists them, plus two derived well-to-tank lines, each naming the LPG line it derives from"}])
    })
    await test.step("6.A1.4", async () => {
      const s = P.step("6.A1.4")
      await s.expect(undefined, [{"outcome":"runExclusions","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":1,"records":[{"record":"ACT-0007","reason":"OUTSIDE_BOUNDARY","detailContaining":"member from 2025-07-01"},{"record":"ACT-0008","reason":"OUTSIDE_BOUNDARY"},{"record":"ACT-0009","reason":"METHODOLOGY","estimate":"NOT_ESTIMATED"}]}}])
    })
    await test.step("6.A1.5", async () => {
      const s = P.step("6.A1.5")
      await s.expect(undefined, [{"outcome":"runByGas","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":1,"hfcsKg":20,"unsplitKgCo2e":60681.14},"why":"four lines are priced from factors that publish CO₂e only, the Ghana grid 56,257.08, the flights 3,900.00 and the two well-to-tank LPG lines 445.22 and 78.84; the footing row \"Total (scope 2 location-based), ties to section 04\" equals the section 04 total"}])
    })
  })

  test("A2. Voiding keeps the number and the figures", async () => {
    await test.step("6.A2.1", async () => {
      const s = P.step("6.A2.1")
      await s.expect(undefined, [{"outcome":"observe","args":{"text":"Click Void… on Run 001: the dialog \"Void Run 001?\" keeps its button disabled until a reason is typed."}}])
    })
    await test.step("6.A2.2", async () => {
      const s = P.step("6.A2.2")
      const out = await s.do("voidRun", {"organization":"Adansi Foods Ltd","inventory":"FY2025","run":1,"reason":"Scratch run for the void case"})
      await s.done()
    })
    await test.step("6.A2.3", async () => {
      const s = P.step("6.A2.3")
      const out = await s.do("launchRun", {"organization":"Adansi Foods Ltd","inventory":"FY2025"})
      await s.expect(out, [{"outcome":"runCount","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","count":2}}])
    })
    await test.step("6.A2.4", async () => {
      const s = P.step("6.A2.4")
      await s.expect(undefined, [{"outcome":"observe","args":{"text":"Look for Submit for review and Mark as final on Run 001: there is neither, a voided run is never submitted or designated final."}}])
    })
  })

  test("B1. A planning value and a blend on another basis hold the designation", async () => {
    await test.step("6.B1.1", async () => {
      const s = P.step("6.B1.1")
      const out = await s.do("reopenInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2025","reason":"Reading the final-run holds"})
      await s.done()
    })
    await test.step("6.B1.2", async () => {
      const s = P.step("6.B1.2")
      const out = await s.do("classifyRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0004","factor":"Liquid fuels: Diesel (100% mineral diesel) (/litre)","density":"Diesel (typical value)"})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"EMISSION_FACTOR","severity":"WARNING","containing":"converts through the typical density of Diesel (0.84 kg/litre), a planning value. A run may use it; a final run may not"}}])
    })
    await test.step("6.B1.3", async () => {
      const s = P.step("6.B1.3")
      const out = await s.do("setGwpSet", {"organization":"Adansi Foods Ltd","inventory":"FY2025","gwpSet":"AR6"})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"EMISSION_FACTOR","severity":"WARNING","containing":"whose CO2e is published under AR5 and cannot be re-derived under AR6 (no composition recorded)"}}])
    })
    await test.step("6.B1.4", async () => {
      const s = P.step("6.B1.4")
      const out = await s.do("freezeInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2025"})
      await s.expect(out, [{"outcome":"boundaryVersion","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","versionNo":3}}])
    })
    await test.step("6.B1.5", async () => {
      const s = P.step("6.B1.5")
      const out = await s.do("launchRun", {"organization":"Adansi Foods Ltd","inventory":"FY2025"})
      await s.expect(out, [{"outcome":"runListed","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":3,"boundaryVersion":3},"why":"the run completes: a run may use both"}])
    })
    await test.step("6.B1.6", async () => {
      const s = P.step("6.B1.6")
      const out = await s.do("submitForReview", {"organization":"Adansi Foods Ltd","inventory":"FY2025","run":3})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.run.final-holds","with":{"run":"3"}},"why":"the submission checks what the sign-off checks, so the preparer learns it first; the message names the run by its number and then both holds, the blend first: \"'Chiller refrigerant top-up' uses 'Blends: R407C, Emissions including only Kyoto products', whose CO2e is published under AR5 and cannot be re-derived under AR6 (no composition recorded): record the blend's composition, choose a factor on AR6, or run the inventory on AR5 (one GWP set across the inventory).\" and \"'Forklift diesel' converts through the typical density of Diesel (0.84 kg/litre), a planning value.\""}])
    })
  })

  test("B2. The proxy route, and one GWP set", async () => {
    await test.step("6.B2.1", async () => {
      const s = P.step("6.B2.1")
      const out = await s.do("reopenInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2025","reason":"Proxy flag and AR5 restored"})
      await s.done()
    })
    await test.step("6.B2.2", async () => {
      const s = P.step("6.B2.2")
      const out = await s.do("classifyRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0004","factor":"Liquid fuels: Diesel (100% mineral diesel) (/litre)","density":"Diesel (typical value)","proxy":true,"proxyJustification":"No certificate of analysis for this delivery; typical mid-range density"})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"EMISSION_FACTOR","containing":"typical density","absent":true},"why":"a documented proxy is an answer"}])
    })
    await test.step("6.B2.3", async () => {
      const s = P.step("6.B2.3")
      const out = await s.do("setGwpSet", {"organization":"Adansi Foods Ltd","inventory":"FY2025","gwpSet":"AR5"})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"EMISSION_FACTOR","containing":"cannot be re-derived","absent":true}}])
    })
    await test.step("6.B2.4", async () => {
      const s = P.step("6.B2.4")
      const out = await s.do("freezeInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2025"})
      await s.expect(out, [{"outcome":"boundaryVersion","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","versionNo":4}}])
    })
    await test.step("6.B2.5", async () => {
      const s = P.step("6.B2.5")
      const out = await s.do("launchRun", {"organization":"Adansi Foods Ltd","inventory":"FY2025"})
      await s.expect(out, [{"outcome":"runListed","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":4,"totalKgCo2e":120373.32}},{"outcome":"runLine","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":4,"record":"ACT-0004","kgCo2e":9505.54,"conversionNote":"(density of Diesel, typical value)"}},{"outcome":"observe","args":{"text":"The proxy justification is not printed on the line; the lines CSV of case D1 carries it in proxy_justification."}}])
    })
  })

  test("C1. Metadata persists and reaches the next run", async () => {
    await test.step("6.C1.1", async () => {
      const s = P.step("6.C1.1")
      const out = await s.do("saveReportHeader", {"organization":"Adansi Foods Ltd","inventory":"FY2025","uncertaintyStatement":"Metered fuel and electricity; the flights figure is the travel agent's estimate","denominators":[{"name":"Product output","value":1500,"unit":"t"}]})
      await s.done()
    })
    await test.step("6.C1.2", async () => {
      const s = P.step("6.C1.2")
      const out = await s.do("launchRun", {"organization":"Adansi Foods Ltd","inventory":"FY2025"})
      await s.expect(out, [{"outcome":"reportIntensity","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5,"name":"Product output","value":1500,"unit":"t","tCo2ePerUnit":0.080249},"why":"120.373 t divided by 1,500"},{"outcome":"reportStatementHas","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5,"section":"uncertainty","containing":"Metered fuel and electricity; the flights figure is the travel agent's estimate"}},{"outcome":"reportStatementHas","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5,"section":"dataQuality","containing":"3 of 9 lines record a quantitative uncertainty; weighted by emissions it is ±2.8% for those lines."},"why":"the run has nine lines, seven records and the two derived ones"}])
    })
  })

  test("D1. The four downloads match the page", async () => {
    await test.step("6.D1.1", async () => {
      const s = P.step("6.D1.1")
      const out = await s.do("openRun", {"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5})
      await s.expect(out, [{"outcome":"observe","args":{"text":"Click PDF report: the PDF carries the numbered sections of the page, the factor table with each factor's source and vintage, and the row \"CO₂e from factors without a gas split\"."}}])
    })
    await test.step("6.D1.2", async () => {
      const s = P.step("6.D1.2")
      await s.expect(undefined, [{"outcome":"csvHas","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5,"file":"lines.csv","columns":["line_id","derived_from_line_id","record_ref","evidence_ref","density_material","density_kg_per_litre","proxy_justification","period_share","co2e_unsplit_kg"]},"why":"one row per line; the forklift line carries the proxy justification, the straddling line period_share 0.53125 and the flights line co2e_unsplit_kg 3,900"}])
    })
    await test.step("6.D1.3", async () => {
      const s = P.step("6.D1.3")
      await s.expect(undefined, [{"outcome":"csvHas","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5,"file":"exclusions.csv","rows":3,"cell":{"record":"ACT-0009","column":"estimate_state","value":"NOT_ESTIMATED"}}},{"outcome":"csvHas","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5,"file":"exclusions.csv","cell":{"record":"ACT-0009","column":"estimated_kg_co2e","value":""}}}])
    })
    await test.step("6.D1.4", async () => {
      const s = P.step("6.D1.4")
      await s.expect(undefined, [{"outcome":"inputsHas","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5,"boundaryVersion":4,"instruments":1,"residualMixAvailable":false}}])
    })
  })

  test("D2. A self-approved factor is disclosed on the report", async () => {
    await test.step("6.D2.1", async () => {
      const s = P.step("6.D2.1").as("yaw")
      const out = await s.do("signIn", {"user":"yaw"})
      await s.done()
    })
    await test.step("6.D2.2", async () => {
      const s = P.step("6.D2.2")
      const out = await s.do("addFacility", {"organization":"Solo Ltd","name":"Solo Office","location":"Accra","country":"GH","entity":"Solo Ltd"})
      await s.done()
    })
    await test.step("6.D2.3", async () => {
      const s = P.step("6.D2.3")
      const out = await s.do("recordActivity", {"organization":"Solo Ltd","facility":"Solo Office","activityType":"Office generator diesel","quantity":100,"unit":"litre","periodStart":"2025-03-01","periodEnd":"2025-03-31","dataSource":"Fuel receipt"})
      await s.done()
    })
    await test.step("6.D2.4", async () => {
      const s = P.step("6.D2.4")
      const out = await s.do("createInventory", {"organization":"Solo Ltd","name":"Solo FY2025","periodStart":"2025-01-01","periodEnd":"2025-12-31","approach":"OPERATIONAL_CONTROL"})
      await s.done()
    })
    await test.step("6.D2.5", async () => {
      const s = P.step("6.D2.5")
      const out = await s.do("reviewActivityData", {"organization":"Solo Ltd","inventory":"Solo FY2025"})
      await s.done()
    })
    await test.step("6.D2.6", async () => {
      const s = P.step("6.D2.6")
      const out = await s.do("classifyRecord", {"organization":"Solo Ltd","inventory":"Solo FY2025","record":"Office generator diesel","factor":"Diesel (Solo)"})
      await s.done()
    })
    await test.step("6.D2.7", async () => {
      const s = P.step("6.D2.7")
      const out = await s.do("setResidualMix", {"organization":"Solo Ltd","inventory":"Solo FY2025","available":false})
      await s.done()
    })
    await test.step("6.D2.8", async () => {
      const s = P.step("6.D2.8")
      const out = await s.do("freezeInventory", {"organization":"Solo Ltd","inventory":"Solo FY2025"})
      await s.done()
    })
    await test.step("6.D2.9", async () => {
      const s = P.step("6.D2.9")
      const out = await s.do("launchRun", {"organization":"Solo Ltd","inventory":"Solo FY2025"})
      await s.expect(out, [{"outcome":"runListed","args":{"organization":"Solo Ltd","inventory":"Solo FY2025","run":1,"totalKgCo2e":266}}])
    })
    await test.step("6.D2.10", async () => {
      const s = P.step("6.D2.10")
      await s.expect(undefined, [{"outcome":"observe","args":{"text":"Open the PDF: the methodology section prints \"Approved by the person who entered them, no other member of the organization being able to check them at the time: Diesel (Solo) (<the Yaw alias>).\". Adansi's PDF of case D1 prints no such sentence: Kofi checked its factors."}}])
    })
    await test.step("6.D2.11", async () => {
      const s = P.step("6.D2.11")
      const out = await s.do("submitForReview", {"organization":"Solo Ltd","inventory":"Solo FY2025","run":1})
      await s.expect(out, [{"outcome":"inventoryStatus","args":{"organization":"Solo Ltd","inventory":"Solo FY2025","status":"IN_REVIEW"}}])
    })
    await test.step("6.D2.12", async () => {
      const s = P.step("6.D2.12")
      const out = await s.do("markFinal", {"organization":"Solo Ltd","inventory":"Solo FY2025","run":1})
      await s.expect(out, [{"outcome":"inventoryStatus","args":{"organization":"Solo Ltd","inventory":"Solo FY2025","status":"FINAL"}},{"outcome":"reportHeader","args":{"organization":"Solo Ltd","inventory":"Solo FY2025","run":1,"preparedBy":"yaw","approvedBy":"yaw","selfApproved":true},"why":"Yaw is the only member who may approve, so his sign-off of the run he submitted goes through and the header says so: \"Approved by <the Yaw alias>, run 1, <date>; self-approved: nobody else in the organization could check it\". The Mark as final dialog said so before the sign-off."}])
    })
    await test.step("6.D2.13", async () => {
      const s = P.step("6.D2.13")
      const out = await s.do("withdrawFinal", {"organization":"Solo Ltd","inventory":"Solo FY2025","reason":"Solo Ltd is a scratch organization"})
      await s.expect(out, [{"outcome":"inventoryStatus","args":{"organization":"Solo Ltd","inventory":"Solo FY2025","status":"FROZEN"},"why":"procedure 8 deletes Solo Ltd, which a final run would hold"}])
    })
  })

  test("E1. The preparer submits, someone else signs off, a reviewer or owner publishes", async () => {
    await test.step("6.E1.1", async () => {
      const s = P.step("6.E1.1").as("esi")
      const out = await s.do("signIn", {"user":"esi"})
      await s.done()
    })
    await test.step("6.E1.2", async () => {
      const s = P.step("6.E1.2")
      const out = await s.do("submitForReview", {"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5,"note":"Fuel ledger and invoices attached"})
      await s.expect(out, [{"outcome":"inventoryStatus","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","status":"IN_REVIEW"}},{"outcome":"inventoryHistoryHas","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","action":"SUBMITTED_FOR_REVIEW","detail":"run 5 submitted for review: Fuel ledger and invoices attached","actor":"esi"},"why":"Run 005 reads IN REVIEW; the lifecycle bar reads \"Submitted for review by <the Esi alias> on <date>: Fuel ledger and invoices attached\""}])
    })
    await test.step("6.E1.3", async () => {
      const s = P.step("6.E1.3")
      const out = await s.do("markFinal", {"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5})
      await s.expect(out, [{"outcome":"roleDisabled","args":{"button":"Mark as final"}}])
    })
    await test.step("6.E1.4", async () => {
      const s = P.step("6.E1.4").as("kofi")
      const out = await s.do("signIn", {"user":"kofi"})
      await s.done()
    })
    await test.step("6.E1.5", async () => {
      const s = P.step("6.E1.5")
      const out = await s.do("returnToPreparer", {"organization":"Adansi Foods Ltd","inventory":"FY2025","reason":"The June invoice is not attached"})
      await s.expect(out, [{"outcome":"inventoryStatus","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","status":"FROZEN"}},{"outcome":"inventoryHistoryHas","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","action":"REVIEW_RETURNED","detail":"run 5 returned to the preparer: The June invoice is not attached","actor":"kofi"}}])
    })
    await test.step("6.E1.6", async () => {
      const s = P.step("6.E1.6")
      const out = await s.do("submitForReview", {"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5})
      await s.expect(out, [{"outcome":"inventoryStatus","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","status":"IN_REVIEW"},"why":"a reviewer may submit too; what he may not do is sign what he submitted while someone else can"}])
    })
    await test.step("6.E1.7", async () => {
      const s = P.step("6.E1.7")
      const out = await s.do("markFinal", {"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.run.self-signed","with":{"run":"5","submitter":"Kofi Mensah","checker":"Ama Owusu"}},"why":"Mark as final on Run 005 is disabled with \"You submitted this run; another reviewer or owner signs it off.\"; through the API the refusal names Ama as someone who can"}])
    })
    await test.step("6.E1.8", async () => {
      const s = P.step("6.E1.8")
      const out = await s.do("returnToPreparer", {"organization":"Adansi Foods Ltd","inventory":"FY2025","reason":"Esi prepares this inventory"})
      await s.done()
    })
    await test.step("6.E1.9", async () => {
      const s = P.step("6.E1.9").as("esi")
      const out = await s.do("submitForReview", {"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5,"note":"Reconciled against the fuel ledger"})
      await s.done()
    })
    await test.step("6.E1.10", async () => {
      const s = P.step("6.E1.10").as("kofi")
      const out = await s.do("unapproveFactor", {"organization":"Adansi Foods Ltd","factor":"Long-haul flights (supplier)"})
      await s.done()
    })
    await test.step("6.E1.11", async () => {
      const s = P.step("6.E1.11")
      const out = await s.do("markFinal", {"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.run.final-holds","with":{"run":"5"}},"why":"\"'Staff flights' uses 'Long-haul flights (supplier)', which is not approved. Approve it under Emission factors, or choose another.\": approval is checked again at the sign-off, not only at the run and the submission"}])
    })
    await test.step("6.E1.12", async () => {
      const s = P.step("6.E1.12")
      const out = await s.do("approveFactor", {"organization":"Adansi Foods Ltd","factor":"Long-haul flights (supplier)"})
      await s.expect(out, [{"outcome":"factorListed","args":{"organization":"Adansi Foods Ltd","name":"Long-haul flights (supplier)","approved":true,"approvedBy":"kofi"},"why":"approved by Kofi, who did not enter it"}])
    })
    await test.step("6.E1.13", async () => {
      const s = P.step("6.E1.13")
      const out = await s.do("markFinal", {"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5,"note":"Reconciled against the March and June invoices"})
      await s.expect(out, [{"outcome":"inventoryStatus","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","status":"FINAL"}},{"outcome":"reportHeader","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5,"preparedBy":"esi","approvedBy":"kofi","finalNote":"Reconciled against the March and June invoices"}},{"outcome":"inventoryHistoryHas","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","action":"FINAL_DESIGNATED","detail":"run 5 signed off and designated final: Reconciled against the March and June invoices","actor":"kofi"}},{"outcome":"buttonsOffered","args":{"absent":["Reopen as draft"]},"why":"the lifecycle bar reads \"Final designated by <the Kofi alias> on <date>: Reconciled against the March and June invoices\"; the report header reads \"Prepared by <the Esi name and alias>, run 5\" and \"Approved by <the Kofi name and alias>, run 5\""}])
    })
    await test.step("6.E1.14", async () => {
      const s = P.step("6.E1.14")
      const out = await s.do("withdrawFinal", {"organization":"Adansi Foods Ltd","inventory":"FY2025","reason":""})
      await s.expect(out, [{"outcome":"dialogButtonDisabled","args":{"dialog":"Withdraw the final designation?","button":"Withdraw designation","rule":"ghg.reason-too-short"}}])
    })
    await test.step("6.E1.15", async () => {
      const s = P.step("6.E1.15")
      const out = await s.do("withdrawFinal", {"organization":"Adansi Foods Ltd","inventory":"FY2025","reason":"Checking the withdrawal"})
      await s.expect(out, [{"outcome":"inventoryStatus","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","status":"FROZEN"},"why":"the history records the withdrawal with Kofi's email; the submission went with the designation, so Esi submits again"}])
    })
    await test.step("6.E1.16", async () => {
      const s = P.step("6.E1.16").as("esi")
      const out = await s.do("submitForReview", {"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5,"note":"Reconciled against the fuel ledger"})
      await s.done()
    })
    await test.step("6.E1.17", async () => {
      const s = P.step("6.E1.17").as("kofi")
      const out = await s.do("markFinal", {"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5})
      await s.expect(out, [{"outcome":"inventoryStatus","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","status":"FINAL"}}])
    })
    await test.step("6.E1.18", async () => {
      const s = P.step("6.E1.18").as("esi")
      const out = await s.do("publishInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2025"})
      await s.expect(out, [{"outcome":"roleDisabled","args":{"button":"Publish"}}])
    })
    await test.step("6.E1.19", async () => {
      const s = P.step("6.E1.19").as("kofi")
      const out = await s.do("publishInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2025"})
      await s.expect(out, [{"outcome":"inventoryStatus","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","status":"PUBLISHED"}},{"outcome":"reportHeader","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5,"version":1,"preparedBy":"esi","approvedBy":"kofi"},"why":"the lifecycle bar reads \"Final designated by <the Kofi alias>\" and \"Published <time>.\" and says nothing on this inventory can change and that a correction is a new inventory that supersedes it; the Report tab reads \"Published by <the Kofi alias>\""}])
    })
  })

  test("F1. Nothing on a published inventory changes", async () => {
    await test.step("6.F1.1", async () => {
      const s = P.step("6.F1.1").as("ama")
      const out = await s.do("openInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2025"})
      await s.expect(out, [{"outcome":"buttonsOffered","args":{"present":["Create correction"],"absent":["Reopen as draft","Freeze inventory","Edit inventory"]}}])
    })
    await test.step("6.F1.2", async () => {
      const s = P.step("6.F1.2")
      const out = await s.do("openInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2025","tab":"Runs"})
      await s.expect(out, [{"outcome":"buttonsOffered","args":{"absent":["Void…"]}},{"outcome":"screenReads","args":{"text":"Published. The runs are a record; a correction restates the year."}},{"outcome":"controlDisabled","args":{"button":"Launch calculation run","title":"A published inventory cannot be recalculated. Create a correction that supersedes it."},"why":"a published inventory's runs are a record"}])
    })
    await test.step("6.F1.3", async () => {
      const s = P.step("6.F1.3")
      const out = await s.do("correctActivity", {"organization":"Adansi Foods Ltd","record":"ACT-0002","quantity":121,"reason":"June invoice re-read after publication"})
      await s.expect(out, [{"outcome":"recordView","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","record":"ACT-0002","changedSincePublication":["quantity"]}},{"outcome":"runLine","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5,"record":"ACT-0002","kgCo2e":56257.08},"why":"the published report still reads 120 MWh and 56,257.08 kg: the report is frozen; the view marks what moved after it"}])
    })
  })

  test("F2. A correction needs a reason and inherits the view", async () => {
    await test.step("6.F2.1", async () => {
      const s = P.step("6.F2.1")
      const out = await s.do("createCorrection", {"organization":"Adansi Foods Ltd","inventory":"FY2025","reason":"typo"})
      await s.expect(out, [{"outcome":"dialogButtonDisabled","args":{"dialog":"Create a correction","button":"Create correction","rule":"ghg.correction.reason-too-short"}}])
    })
    await test.step("6.F2.2", async () => {
      const s = P.step("6.F2.2")
      const out = await s.do("createCorrection", {"organization":"Adansi Foods Ltd","inventory":"FY2025","reason":"June electricity was 121 MWh, not 120"})
      await s.expect(out, [{"outcome":"inventoryStatus","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025 (correction)","status":"DRAFT"}},{"outcome":"observe","args":{"text":"A new draft, FY2025 (correction), opens with the boundary, the declaration, the classifications, the rule, the instrument and the residual mix inherited. Each inherited decision is marked as inherited."}}])
    })
    await test.step("6.F2.3", async () => {
      const s = P.step("6.F2.3")
      const out = await s.do("freezeInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2025 (correction)"})
      await s.done()
    })
    await test.step("6.F2.4", async () => {
      const s = P.step("6.F2.4")
      const out = await s.do("launchRun", {"organization":"Adansi Foods Ltd","inventory":"FY2025 (correction)"})
      await s.expect(out, [{"outcome":"runLine","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025 (correction)","run":1,"record":"ACT-0002","kgCo2e":56725.89}},{"outcome":"reportHeader","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025 (correction)","run":1,"version":2,"supersedes":"FY2025"}},{"outcome":"reportCorrection","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025 (correction)","run":1,"added":0,"removed":0,"changed":1}}])
    })
    await test.step("6.F2.5", async () => {
      const s = P.step("6.F2.5")
      await s.expect(undefined, [{"outcome":"reportHeader","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5,"version":1,"supersededBy":"FY2025 (correction)"},"why":"unchanged, and its header says it is superseded by the correction"}])
    })
  })

  test("F3. Assignment narrows who submits and who signs, within the roles", async () => {
    await test.step("6.F3.1", async () => {
      const s = P.step("6.F3.1")
      const out = await s.do("assignSignOff", {"organization":"Adansi Foods Ltd","inventory":"FY2025 (correction)","approver":"esi"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.inventory.sign-off-role","with":{"name":"Esi Boateng","role":"Preparer","act":"sign off an inventory"}},"why":"the roles are the ceiling; the Approver list offers only the reviewer and the owner"}])
    })
    await test.step("6.F3.2", async () => {
      const s = P.step("6.F3.2")
      const out = await s.do("assignSignOff", {"organization":"Adansi Foods Ltd","inventory":"FY2025 (correction)","preparer":"esi","approver":"kofi"})
      await s.expect(out, [{"outcome":"inventoryHistoryHas","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025 (correction)","action":"SIGN_OFF_ASSIGNED","detail":"preparer: Esi Boateng; approver: Kofi Mensah","actor":"ama"}}])
    })
    await test.step("6.F3.3", async () => {
      const s = P.step("6.F3.3")
      const out = await s.do("submitForReview", {"organization":"Adansi Foods Ltd","inventory":"FY2025 (correction)","run":1})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.inventory.not-the-preparer","with":{"name":"Esi Boateng"}},"why":"Ama owns the organization, but Esi is this inventory's preparer"}])
    })
    await test.step("6.F3.4", async () => {
      const s = P.step("6.F3.4").as("esi")
      const out = await s.do("submitForReview", {"organization":"Adansi Foods Ltd","inventory":"FY2025 (correction)","run":1,"note":"The June electricity restated"})
      await s.expect(out, [{"outcome":"inventoryStatus","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025 (correction)","status":"IN_REVIEW"}}])
    })
    await test.step("6.F3.5", async () => {
      const s = P.step("6.F3.5").as("ama")
      const out = await s.do("markFinal", {"organization":"Adansi Foods Ltd","inventory":"FY2025 (correction)","run":1})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.inventory.not-the-approver","with":{"name":"Kofi Mensah"}},"why":"the correction stays in review for the walkthrough; procedure 7 reads only its run lines"}])
    })
  })

  test("G1. The equity share view brings the associate in", async () => {
    await test.step("6.G1.1", async () => {
      const s = P.step("6.G1.1")
      const out = await s.do("createInventory", {"organization":"Adansi Foods Ltd","name":"FY2025 equity view","periodStart":"2025-01-01","periodEnd":"2025-12-31","approach":"EQUITY_SHARE","copyFrom":"FY2025"})
      await s.done()
    })
    await test.step("6.G1.2", async () => {
      const s = P.step("6.G1.2")
      const out = await s.do("openInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2025 equity view","tab":"Boundary"})
      await s.expect(out, [{"outcome":"boundaryRow","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025 equity view","entity":"Coldstore Ghana Ltd","inBoundary":true,"share":30,"facilities":{"Takoradi Cold Store":true}}}])
    })
    await test.step("6.G1.3", async () => {
      const s = P.step("6.G1.3")
      const out = await s.do("showInheritance", {"organization":"Adansi Foods Ltd","inventory":"FY2025 equity view"})
      await s.expect(out, [{"outcome":"inheritanceDropped","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025 equity view","entity":"Coldstore Ghana Ltd","reason":"METHODOLOGY","sharePercent":30}}])
    })
    await test.step("6.G1.4", async () => {
      const s = P.step("6.G1.4")
      const out = await s.do("reviewActivityData", {"organization":"Adansi Foods Ltd","inventory":"FY2025 equity view"})
      await s.expect(out, [{"outcome":"recordView","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025 equity view","record":"ACT-0008","status":"UNCLASSIFIED"},"why":"Takoradi Cold Store is in the boundary under this approach; the classifications of the other records are inherited and marked"}])
    })
    await test.step("6.G1.5", async () => {
      const s = P.step("6.G1.5")
      await s.expect(undefined, [{"outcome":"observe","args":{"text":"Leave the equity view a draft. Procedure 8 reads its base-year gate."}}])
    })
  })
})
