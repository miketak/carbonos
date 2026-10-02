// generated from qa/packs/governance/004-inventory-boundary-and-declaration.yaml (sha256 62533740ec225c53c7b123cb0db35ef801b69c6521a4c2caba00b19670dedd4b); edit the YAML, then `make qa-compile`
import { procedure, test } from '../../../src/runtime/api/index.ts'

const P = procedure("governance", 4, "62533740ec225c53c7b123cb0db35ef801b69c6521a4c2caba00b19670dedd4b")

test.describe.configure({ mode: 'serial' })
test.describe("Procedure 4: Inventory, boundary and declaration", () => {
  test.beforeAll(async () => P.start())
  test.afterAll(async () => P.finish())

  test("A1. Pre-population from the approach", async () => {
    await test.step("4.A1.1", async () => {
      const s = P.step("4.A1.1").as("ama")
      const out = await s.do("signIn", {"user":"ama"})
      await s.done()
    })
    await test.step("4.A1.2", async () => {
      const s = P.step("4.A1.2")
      const out = await s.do("createInventory", {"organization":"Adansi Foods Ltd","name":"FY2025","periodStart":"2025-01-01","periodEnd":"2025-12-31","approach":"OPERATIONAL_CONTROL","gwpSet":"AR5","straddle":"PRO_RATE","prefillBoundary":true})
      await s.expect(out, [{"outcome":"inventoryListed","args":{"organization":"Adansi Foods Ltd","name":"FY2025","status":"DRAFT"},"why":"\"FY2025 created.\" appears first"}])
    })
    await test.step("4.A1.3", async () => {
      const s = P.step("4.A1.3")
      const out = await s.do("openInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2025"})
      await s.expect(out, [{"outcome":"workbenchTabs","args":{"tabs":["Records","Boundary","Method","Runs","Report"]}},{"outcome":"inventoryStatus","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","status":"DRAFT"}}])
    })
    await test.step("4.A1.4", async () => {
      const s = P.step("4.A1.4")
      const out = await s.do("openInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2025","tab":"Boundary"})
      await s.expect(out, [{"outcome":"boundaryRow","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","entity":"Adansi Foods Ltd","inBoundary":true,"facilities":{"Kumasi Plant":true}}},{"outcome":"boundaryRow","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","entity":"Adansi Logistics Ltd","inBoundary":true,"facilities":{"Tema Depot":true}}},{"outcome":"boundaryRow","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","entity":"Coldstore Ghana Ltd","inBoundary":false,"shareUnderApproach":0,"cannotTick":true,"asksWhy":true},"why":"its 0% comes from its Table 1 row, an associate under operational control"}])
    })
    await test.step("4.A1.5", async () => {
      const s = P.step("4.A1.5")
      await s.expect(undefined, [{"outcome":"boundaryRow","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","entity":"Adansi Logistics Ltd","memberFrom":"2025-07-01"},"why":"Member from is taken from the acquisition date"}])
    })
  })

  test("A2. The period hint", async () => {
    await test.step("4.A2.1", async () => {
      const s = P.step("4.A2.1")
      const out = await s.do("startNewInventory", {"organization":"Adansi Foods Ltd","periodStart":"2025-01-01","periodEnd":"2026-06-30"})
      await s.expect(out, [{"outcome":"formHint","args":{"text":"This period is 18 months. Chapter 9 expects an annual inventory; keep it only if the period is deliberate."},"why":"it can still be saved"}])
    })
    await test.step("4.A2.2", async () => {
      const s = P.step("4.A2.2")
      const out = await s.do("startNewInventory", {"organization":"Adansi Foods Ltd","periodStart":"2025-07-01","periodEnd":"2026-06-30"})
      await s.expect(out, [{"outcome":"formHint","args":{"text":"A fiscal year: the inventory will be labelled FY2025/26."}}])
    })
    await test.step("4.A2.3", async () => {
      const s = P.step("4.A2.3")
      const out = await s.do("cancelDialog", {"dialog":"New inventory"})
      await s.done()
    })
  })

  test("B1. An operation left out needs a reason", async () => {
    await test.step("4.B1.1", async () => {
      const s = P.step("4.B1.1")
      const out = await s.do("setFacilityInBoundary", {"organization":"Adansi Foods Ltd","inventory":"FY2025","facility":"Tema Depot","on":false})
      await s.expect(out, [{"outcome":"boundaryRow","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","entity":"Adansi Logistics Ltd","inBoundary":false,"facilities":{"Tema Depot":false},"asksWhy":true},"why":"unticking E1's only facility unticks E1, and the reason control appears on the entity's row"}])
    })
    await test.step("4.B1.2", async () => {
      const s = P.step("4.B1.2")
      await s.expect(undefined, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"BOUNDARY","severity":"ERROR","containing":"'Tema Depot' (Adansi Logistics Ltd) is neither in the boundary nor excluded with a reason. Tick it in, or record why it is left out."},"why":"the facility is named first: the reason is recorded on its entity's row"}])
    })
    await test.step("4.B1.3", async () => {
      const s = P.step("4.B1.3")
      const out = await s.do("excludeEntity", {"organization":"Adansi Foods Ltd","inventory":"FY2025","entity":"Adansi Logistics Ltd","reason":"NOT_APPLICABLE","detail":"Scratch: testing the exclusion flow"})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"BOUNDARY","containing":"is neither in the boundary nor excluded with a reason","absent":true}},{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"BOUNDARY","severity":"WARNING","containing":"Adansi Logistics Ltd is excluded as not applicable in the period but holds a 100% share under this approach: the report discloses the exclusion."},"why":"the error becomes a warning, the entity holds a 100% share under this approach"}])
    })
    await test.step("4.B1.4", async () => {
      const s = P.step("4.B1.4")
      const out = await s.do("setFacilityInBoundary", {"organization":"Adansi Foods Ltd","inventory":"FY2025","facility":"Tema Depot","on":true})
      await s.expect(out, [{"outcome":"boundaryRow","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","entity":"Adansi Logistics Ltd","inBoundary":true,"exclusion":"none"},"why":"an operation back in the boundary carries no exclusion"}])
    })
  })

  test("B2. The associate is disclosed, and can be excluded on method", async () => {
    await test.step("4.B2.1", async () => {
      const s = P.step("4.B2.1")
      await s.expect(undefined, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"BOUNDARY","severity":"WARNING","containing":"Coldstore Ghana Ltd has a 0% accounting share under operational control, so its facilities are outside the boundary under this approach and the report discloses the exclusion. Record why it is left out so the report says so."}}])
    })
    await test.step("4.B2.2", async () => {
      const s = P.step("4.B2.2")
      const out = await s.do("excludeEntity", {"organization":"Adansi Foods Ltd","inventory":"FY2025","entity":"Coldstore Ghana Ltd","reason":"METHODOLOGY","detail":"Associate: no operational control"})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"BOUNDARY","containing":"Record why it is left out so the report says so","absent":true}},{"outcome":"boundaryRow","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","entity":"Coldstore Ghana Ltd","exclusion":"METHODOLOGY"}}])
    })
  })

  test("B3. A share override is compared with the entity record", async () => {
    await test.step("4.B3.1", async () => {
      const s = P.step("4.B3.1")
      const out = await s.do("setEntityShare", {"organization":"Adansi Foods Ltd","inventory":"FY2025","entity":"Adansi Logistics Ltd","economicInterest":80})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"BOUNDARY","severity":"WARNING","containing":"differs from the entity record"}},{"outcome":"entityListed","args":{"organization":"Adansi Foods Ltd","name":"Adansi Logistics Ltd","equityShare":100},"why":"the override is for this inventory only; Legal entities still reads 100%"}])
    })
    await test.step("4.B3.2", async () => {
      const s = P.step("4.B3.2")
      const out = await s.do("setEntityShare", {"organization":"Adansi Foods Ltd","inventory":"FY2025","entity":"Adansi Logistics Ltd","economicInterest":100})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"BOUNDARY","containing":"differs from the entity record","absent":true}}])
    })
  })

  test("B4. A membership window is effective-dated", async () => {
    await test.step("4.B4.1", async () => {
      const s = P.step("4.B4.1")
      await s.expect(undefined, [{"outcome":"boundaryRow","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","entity":"Adansi Logistics Ltd","memberFrom":"2025-07-01"}},{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"BOUNDARY","severity":"WARNING","containing":"Adansi Logistics Ltd is a member from 2025-07-01: a partial-period membership, accounted from that date."}}])
    })
    await test.step("4.B4.2", async () => {
      const s = P.step("4.B4.2")
      const out = await s.do("setMembershipWindow", {"organization":"Adansi Foods Ltd","inventory":"FY2025","entity":"Adansi Logistics Ltd","until":"2025-06-30"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.boundary.window-ends-before-start"},"why":"clear the typed date; the window stays as it was"}])
    })
    await test.step("4.B4.3", async () => {
      const s = P.step("4.B4.3")
      await s.expect(undefined, [{"outcome":"observe","args":{"text":"Note for procedure 5: ACT-0007 (Tema Depot, May 2025) falls before the window. Review will exclude it with the computed detail \"member from 2025-07-01\"."}}])
    })
  })

  test("C1. A declared category without lines warns, and a reason silences it", async () => {
    await test.step("4.C1.1", async () => {
      const s = P.step("4.C1.1")
      const out = await s.do("declareScope3", {"organization":"Adansi Foods Ltd","inventory":"FY2025","categories":["INVESTMENTS"]})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"CLASSIFICATION","severity":"WARNING","containing":"Scope 3 '15. Investments' is declared as covered but no included record is classified into it: a reader takes 'covered' to mean quantified. Classify records into it, or say in the declaration why it is not quantified this year."},"why":"\"Operational boundary declaration saved.\" first"}])
    })
    await test.step("4.C1.2", async () => {
      const s = P.step("4.C1.2")
      const out = await s.do("declareScope3", {"organization":"Adansi Foods Ltd","inventory":"FY2025","categories":["INVESTMENTS"],"notQuantified":[{"category":"INVESTMENTS","reason":"n/a"}]})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.declaration.reason-too-short","with":{"category":"15. Investments"}}}])
    })
    await test.step("4.C1.3", async () => {
      const s = P.step("4.C1.3")
      const out = await s.do("declareScope3", {"organization":"Adansi Foods Ltd","inventory":"FY2025","categories":["INVESTMENTS"],"notQuantified":[{"category":"INVESTMENTS","reason":"Minority holding; no emissions data available this year"}]})
      await s.expect(out, [{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","gate":"CLASSIFICATION","containing":"is declared as covered but no included record is classified into it","absent":true},"why":"the report will print the category as \"declared, not quantified\" with the reason"}])
    })
    await test.step("4.C1.4", async () => {
      const s = P.step("4.C1.4")
      await s.expect(undefined, [{"outcome":"declarationHas","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","category":"BUSINESS_TRAVEL","covered":false}},{"outcome":"declarationHas","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","category":"PURCHASED_GOODS_SERVICES","covered":false},"why":"procedure 5 classifies records into both and reads the cross-check the other way round"}])
    })
  })

  test("D1. Unclassified records block the freeze, and the boundary stays live", async () => {
    await test.step("4.D1.1", async () => {
      const s = P.step("4.D1.1")
      const out = await s.do("reviewActivityData", {"organization":"Adansi Foods Ltd","inventory":"FY2025"})
      await s.done()
    })
    await test.step("4.D1.2", async () => {
      const s = P.step("4.D1.2")
      const out = await s.do("freezeInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2025"})
      await s.expect(out, [{"outcome":"freezeBlocked","args":{"notClassified":8}}])
    })
    await test.step("4.D1.3", async () => {
      const s = P.step("4.D1.3")
      const out = await s.do("cancelDialog", {"dialog":"Freeze the inventory?"})
      await s.done()
    })
    await test.step("4.D1.4", async () => {
      const s = P.step("4.D1.4")
      const out = await s.do("setFacilityInBoundary", {"organization":"Adansi Foods Ltd","inventory":"FY2025","facility":"Tema Depot","on":false})
      await s.done()
    })
    await test.step("4.D1.5", async () => {
      const s = P.step("4.D1.5")
      const out = await s.do("setFacilityInBoundary", {"organization":"Adansi Foods Ltd","inventory":"FY2025","facility":"Tema Depot","on":true})
      await s.expect(out, [{"outcome":"inventoryStatus","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","status":"DRAFT"},"why":"the boundary is still editable: nothing is frozen"}])
    })
  })

  test("E1. Edit inventory", async () => {
    await test.step("4.E1.1", async () => {
      const s = P.step("4.E1.1")
      const out = await s.do("openInventoryForm", {"organization":"Adansi Foods Ltd","inventory":"FY2025"})
      await s.expect(out, [{"outcome":"formOffers","args":{"dialog":"Edit inventory","fields":["Name","Period start","Period end","Records that straddle the period or a membership window","Purpose (optional)","Consolidation approach","GWP set"]}}])
    })
    await test.step("4.E1.2", async () => {
      const s = P.step("4.E1.2")
      const out = await s.do("cancelDialog", {"dialog":"Edit inventory"})
      await s.expect(out, [{"outcome":"observe","args":{"text":"Procedure 5 sets the straddle treatment to Block the run until the record is split and back; procedure 6 sets the GWP set to AR6 and back. The declaration stays on Boundary; Method holds the upstream rules, the instruments and the residual mix."}}])
    })
  })
})
