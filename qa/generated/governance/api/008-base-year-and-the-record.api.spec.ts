// generated from qa/packs/governance/008-base-year-and-the-record.yaml (sha256 3e19ad37381fdc52e9b228f036c9dab3ee44a4a589c636e024bbd5b6bb9e2774); edit the YAML, then `make qa-compile`
import { procedure, test } from '../../../src/runtime/api/index.ts'

const P = procedure("governance", 8, "3e19ad37381fdc52e9b228f036c9dab3ee44a4a589c636e024bbd5b6bb9e2774")

test.describe.configure({ mode: 'serial' })
test.describe("Procedure 8: Base year and the organization's record", () => {
  test.beforeAll(async () => P.start())
  test.afterAll(async () => P.finish())

  test("A1. FY2026 without Tema Depot", async () => {
    await test.step("8.A1.1", async () => {
      const s = P.step("8.A1.1").as("ama")
      const out = await s.do("signIn", {"user":"ama"})
      await s.done()
    })
    await test.step("8.A1.2", async () => {
      const s = P.step("8.A1.2")
      const out = await s.do("reopenInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2026","reason":"Depot sold in January 2026"})
      await s.done()
    })
    await test.step("8.A1.3", async () => {
      const s = P.step("8.A1.3")
      const out = await s.do("setFacilityInBoundary", {"organization":"Adansi Foods Ltd","inventory":"FY2026","facility":"Tema Depot","on":false})
      await s.expect(out, [{"outcome":"boundaryRow","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","entity":"Adansi Logistics Ltd","inBoundary":false,"asksWhy":true},"why":"E1 leaves the boundary with its only facility; the reason control appears on E1's row"}])
    })
    await test.step("8.A1.4", async () => {
      const s = P.step("8.A1.4")
      const out = await s.do("excludeEntity", {"organization":"Adansi Foods Ltd","inventory":"FY2026","entity":"Adansi Logistics Ltd","reason":"NOT_APPLICABLE","detail":"Depot sold on 2026-01-31; no operation in the period"})
      await s.done()
    })
    await test.step("8.A1.5", async () => {
      const s = P.step("8.A1.5")
      const out = await s.do("freezeInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2026"})
      await s.expect(out, [{"outcome":"boundaryVersion","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","versionNo":2}},{"outcome":"noBaseYear","args":{"organization":"Adansi Foods Ltd"},"why":"there is no base year yet"}])
    })
  })

  test("B1. A base year needs its reason and policy", async () => {
    await test.step("8.B1.1", async () => {
      const s = P.step("8.B1.1")
      const out = await s.do("designateBaseYear", {"organization":"Adansi Foods Ltd","inventory":"FY2025","threshold":5,"reason":"First year with metered data at every site","convention":"TRANSACTION_DATE"})
      await s.expect(out, [{"outcome":"baseYearReads","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","year":2025,"threshold":5,"reason":"First year with metered data at every site","convention":"TRANSACTION_DATE","baseRun":"Run 005","baseRunKgCo2e":120373.32}}])
    })
    await test.step("8.B1.2", async () => {
      const s = P.step("8.B1.2")
      await s.expect(undefined, [{"outcome":"candidateListed","args":{"organization":"Adansi Foods Ltd","containing":"structural change: Tema Depot removed; 11.06% of base-year emissions, above the 5% threshold, recalculation required","status":"FLAGGED","boundaryVersion":2,"affectedPercent":11.06,"aboveThreshold":true},"why":"one FLAGGED candidate at once, against FY2026 version 2: the designation weighed the frozen year without a new freeze"}])
    })
    await test.step("8.B1.3", async () => {
      const s = P.step("8.B1.3")
      await s.expect(undefined, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","gate":"BASE_YEAR","severity":"ERROR","containing":"Base year flagged for recalculation (structural change: Tema Depot removed; 11.06% of base-year emissions, above the 5% threshold, recalculation required). Record the decision under the organization's base year."}}])
    })
    await test.step("8.B1.4", async () => {
      const s = P.step("8.B1.4")
      const out = await s.do("markFinal", {"organization":"Adansi Foods Ltd","inventory":"FY2026","run":1})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.base-year.holds-final","with":{"year":"2025","reason":"structural change: Tema Depot removed; 11.06% of base-year emissions, above the 5% threshold, recalculation required","act":"marked final"}}}])
    })
    await test.step("8.B1.5", async () => {
      const s = P.step("8.B1.5")
      const out = await s.do("openInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2026"})
      await s.expect(out, [{"outcome":"screenReads","args":{"text":"Base year holds the final designation; runs stay available."}}])
    })
    await test.step("8.B1.6", async () => {
      const s = P.step("8.B1.6")
      const out = await s.do("launchRun", {"organization":"Adansi Foods Ltd","inventory":"FY2026"})
      await s.expect(out, [{"outcome":"runCount","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","count":2},"why":"a run goes through: quantifying the movement is how a recalculation is assessed"}])
    })
    await test.step("8.B1.7", async () => {
      const s = P.step("8.B1.7")
      await s.expect(undefined, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025 equity view","gate":"BASE_YEAR","severity":"WARNING","containing":"This inventory is not held because it is an equity share view and the base year is operational control"},"why":"a warning, not an error"}])
    })
  })

  test("C1. Put back as the base year held it", async () => {
    await test.step("8.C1.1", async () => {
      const s = P.step("8.C1.1")
      const out = await s.do("reopenInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2026","reason":"Sale fell through"})
      await s.done()
    })
    await test.step("8.C1.2", async () => {
      const s = P.step("8.C1.2")
      const out = await s.do("setFacilityInBoundary", {"organization":"Adansi Foods Ltd","inventory":"FY2026","facility":"Tema Depot","on":true})
      await s.done()
    })
    await test.step("8.C1.3", async () => {
      const s = P.step("8.C1.3")
      const out = await s.do("freezeInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2026"})
      await s.expect(out, [{"outcome":"boundaryVersion","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","versionNo":3}},{"outcome":"candidateListed","args":{"organization":"Adansi Foods Ltd","containing":"structural change: Tema Depot removed; 11.06% of base-year emissions, above the 5% threshold, recalculation required","status":"SUPERSEDED","note":"put back in boundary version 3 as the base year held it"}},{"outcome":"noGateErrors","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026"}}])
    })
    await test.step("8.C1.4", async () => {
      const s = P.step("8.C1.4")
      const out = await s.do("reopenInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2026","reason":"Sale completed after all"})
      await s.done()
    })
    await test.step("8.C1.5", async () => {
      const s = P.step("8.C1.5")
      const out = await s.do("setFacilityInBoundary", {"organization":"Adansi Foods Ltd","inventory":"FY2026","facility":"Tema Depot","on":false})
      await s.done()
    })
    await test.step("8.C1.6", async () => {
      const s = P.step("8.C1.6")
      const out = await s.do("excludeEntity", {"organization":"Adansi Foods Ltd","inventory":"FY2026","entity":"Adansi Logistics Ltd","reason":"NOT_APPLICABLE","detail":"Depot sold on 2026-01-31; no operation in the period"})
      await s.done()
    })
    await test.step("8.C1.7", async () => {
      const s = P.step("8.C1.7")
      const out = await s.do("freezeInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2026"})
      await s.expect(out, [{"outcome":"boundaryVersion","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","versionNo":4}},{"outcome":"candidateListed","args":{"organization":"Adansi Foods Ltd","containing":"structural change: Tema Depot removed; 11.06% of base-year emissions, above the 5% threshold, recalculation required","status":"FLAGGED","boundaryVersion":4},"why":"a new FLAGGED candidate"}])
    })
  })

  test("D1. A recalculated base is a run of the base-year inventory", async () => {
    await test.step("8.D1.1", async () => {
      const s = P.step("8.D1.1")
      const out = await s.do("recordRecalculatedBase", {"organization":"Adansi Foods Ltd","candidate":"structural change: Tema Depot removed; 11.06% of base-year emissions, above the 5% threshold, recalculation required"})
      await s.expect(out, [{"outcome":"recalculationRunsOffered","args":{"organization":"Adansi Foods Ltd","offered":["Run 002","Run 003","Run 004","Run 005"],"notOffered":["Run 001"]}}])
    })
    await test.step("8.D1.2", async () => {
      const s = P.step("8.D1.2")
      const out = await s.do("recordRecalculatedBase", {"organization":"Adansi Foods Ltd","candidate":"structural change: Tema Depot removed; 11.06% of base-year emissions, above the 5% threshold, recalculation required","run":"Run 002"})
      await s.expect(out, [{"outcome":"candidateListed","args":{"organization":"Adansi Foods Ltd","containing":"structural change: Tema Depot removed; 11.06% of base-year emissions, above the 5% threshold, recalculation required","status":"RECALCULATED","decidedBy":"ama","baseRun":"Run 002"}},{"outcome":"noGateErrors","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026"}}])
    })
  })

  test("D2. Manual candidates need a share or a comparison run", async () => {
    await test.step("8.D2.1", async () => {
      const s = P.step("8.D2.1")
      const out = await s.do("raiseCandidate", {"organization":"Adansi Foods Ltd","trigger":"ERROR_CORRECTION","reason":"Scratch: reading the refusal"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.base-year.share-or-run"}}])
    })
    await test.step("8.D2.2", async () => {
      const s = P.step("8.D2.2")
      const out = await s.do("raiseCandidate", {"organization":"Adansi Foods Ltd","trigger":"METHODOLOGY_CHANGE","reason":"Grid factor vintage moved to ghana-2027-gov","affectedPercent":2.87})
      await s.expect(out, [{"outcome":"candidateListed","args":{"organization":"Adansi Foods Ltd","containing":"2.87% of base-year emissions, below the 5% threshold, recalculation optional","status":"FLAGGED","affectedPercent":2.87,"aboveThreshold":false},"why":"the running sum restarted at the recalculation of case D1, so the 11.06% is not added to it"}])
    })
    await test.step("8.D2.3", async () => {
      const s = P.step("8.D2.3")
      const out = await s.do("declineCandidate", {"organization":"Adansi Foods Ltd","candidate":"2.87% of base-year emissions","note":"Below the 5% threshold; the notice records the answer"})
      await s.expect(out, [{"outcome":"candidateListed","args":{"organization":"Adansi Foods Ltd","containing":"2.87% of base-year emissions","status":"DECLINED","decidedBy":"ama","note":"Below the 5% threshold; the notice records the answer"},"why":"had this candidate been raised before case D1's recalculation, the next structural change would have read \"11.06% of base-year emissions on its own, 13.93% together with 1 earlier change since the 2025 base year\": the running sum counts every candidate since the base or the last recalculation, declined ones included"}])
    })
  })

  test("E1. FY2026 on AR6 against an AR5 base year", async () => {
    await test.step("8.E1.1", async () => {
      const s = P.step("8.E1.1")
      const out = await s.do("reopenInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2026","reason":"Reading the GWP flag"})
      await s.done()
    })
    await test.step("8.E1.2", async () => {
      const s = P.step("8.E1.2")
      const out = await s.do("setGwpSet", {"organization":"Adansi Foods Ltd","inventory":"FY2026","gwpSet":"AR6"})
      await s.done()
    })
    await test.step("8.E1.3", async () => {
      const s = P.step("8.E1.3")
      const out = await s.do("freezeInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2026"})
      await s.done()
    })
    await test.step("8.E1.4", async () => {
      const s = P.step("8.E1.4")
      const out = await s.do("launchRun", {"organization":"Adansi Foods Ltd","inventory":"FY2026"})
      await s.expect(out, [{"outcome":"reportBaseYearGwp","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","run":3,"matches":false}}])
    })
    await test.step("8.E1.5", async () => {
      const s = P.step("8.E1.5")
      const out = await s.do("reopenInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2026","reason":"Back to the base year's set"})
      await s.done()
    })
    await test.step("8.E1.6", async () => {
      const s = P.step("8.E1.6")
      const out = await s.do("setGwpSet", {"organization":"Adansi Foods Ltd","inventory":"FY2026","gwpSet":"AR5"})
      await s.done()
    })
    await test.step("8.E1.7", async () => {
      const s = P.step("8.E1.7")
      const out = await s.do("freezeInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2026"})
      await s.expect(out, [{"outcome":"inventoryStatus","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","status":"FROZEN"}},{"outcome":"boundaryVersion","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","versionNo":6},"why":"FY2026 is where procedure 7 left it, five boundary versions on"}])
    })
  })

  test("F1. A published record keeps the organization", async () => {
    await test.step("8.F1.1", async () => {
      const s = P.step("8.F1.1")
      const out = await s.do("deleteFactor", {"organization":"Adansi Foods Ltd","factor":"R-410A (composition)"})
      await s.done()
    })
    await test.step("8.F1.2", async () => {
      const s = P.step("8.F1.2")
      const out = await s.do("deleteFactor", {"organization":"Adansi Foods Ltd","factor":"Long-haul flights (supplier)"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.factor.applied-not-deleted","with":{"factor":"Long-haul flights (supplier)"}},"why":"set its validity end to retire it instead"}])
    })
    await test.step("8.F1.3", async () => {
      const s = P.step("8.F1.3")
      const out = await s.do("tryDeleteOrganization", {"organization":"Adansi Foods Ltd","reason":"Scratch attempt on a published record"})
      await s.expect(out, [{"outcome":"deletionBlocked","args":{"organization":"Adansi Foods Ltd","records":["FY2025: Published"]}}])
    })
    await test.step("8.F1.4", async () => {
      const s = P.step("8.F1.4")
      await s.expect(undefined, [{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"ADMIN_ACCESS_ASSUMED","actor":"adminB"}},{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"FACTOR_PACK_ADOPTED","actor":"kofi"}},{"outcome":"observe","args":{"text":"History lists the members added, the entities, facilities and emission sources of procedure 2, support access assumed and ended, the adoption, and every act since, each with an email and a moment. Its rows are not only members: read them by their label."}}])
    })
  })

  test("F2. A scratch organization is deleted with its name typed", async () => {
    await test.step("8.F2.1", async () => {
      const s = P.step("8.F2.1").as("yaw")
      const out = await s.do("signIn", {"user":"yaw"})
      await s.done()
    })
    await test.step("8.F2.2", async () => {
      const s = P.step("8.F2.2")
      const out = await s.do("deleteOrganization", {"organization":"Solo Ltd","typed":"solo ltd","reason":"Scratch organization of the governance pack"})
      await s.expect(out, [{"outcome":"dialogButtonDisabled","args":{"dialog":"Delete organization","button":"Delete","rule":"ghg.organization.name-confirmation"},"why":"the name must match exactly"}])
    })
    await test.step("8.F2.3", async () => {
      const s = P.step("8.F2.3")
      const out = await s.do("deleteOrganization", {"organization":"Solo Ltd","reason":"Scratch organization of the governance pack"})
      await s.expect(out, [{"outcome":"observe","args":{"text":"Solo Ltd leaves the list and its URL is not found. The dialog said the record of who removed it, when and why is kept."}}])
    })
    await test.step("8.F2.4", async () => {
      const s = P.step("8.F2.4").as("adminA")
      const out = await s.do("signIn", {"user":"adminA"})
      await s.done()
    })
    await test.step("8.F2.5", async () => {
      const s = P.step("8.F2.5")
      await s.expect(undefined, [{"outcome":"platformSummary","args":{"organizations":1},"why":"Organizations counts Adansi Foods Ltd alone"}])
    })
  })
})
