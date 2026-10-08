// generated from qa/packs/governance/002-the-organization.yaml (sha256 34251348982e0b03d84e4accf0e1864f6f7def1a310a1b594fc8576645011cef); edit the YAML, then `make qa-compile`
import { procedure, test } from '../../../src/runtime/ui/index.ts'

const P = procedure("governance", 2, "34251348982e0b03d84e4accf0e1864f6f7def1a310a1b594fc8576645011cef")

test.describe.configure({ mode: 'serial' })
test.describe("Procedure 2: The organization", () => {
  test.beforeAll(async () => P.start())
  test.afterAll(async () => P.finish())

  test("A1. The creator is the owner, and members are added by email", async () => {
    await test.step("2.A1.1", async () => {
      const s = P.step("2.A1.1").as("ama")
      const out = await s.do("signIn", {"user":"ama"})
      await s.done()
    })
    await test.step("2.A1.2", async () => {
      const s = P.step("2.A1.2")
      const out = await s.do("createOrganization", {"name":"Adansi Foods Ltd"})
      await s.done()
    })
    await test.step("2.A1.3", async () => {
      const s = P.step("2.A1.3")
      const out = await s.do("openOrganization", {"organization":"Adansi Foods Ltd"})
      await s.expect(out, [{"outcome":"myRole","args":{"user":"ama","organization":"Adansi Foods Ltd","role":"OWNER"}}])
    })
    await test.step("2.A1.4", async () => {
      const s = P.step("2.A1.4")
      const out = await s.do("addMember", {"organization":"Adansi Foods Ltd","user":"kofi","role":"REVIEWER"})
      await s.done()
    })
    await test.step("2.A1.5", async () => {
      const s = P.step("2.A1.5")
      const out = await s.do("addMember", {"organization":"Adansi Foods Ltd","user":"esi","role":"PREPARER"})
      await s.done()
    })
    await test.step("2.A1.6", async () => {
      const s = P.step("2.A1.6")
      const out = await s.do("addMember", {"organization":"Adansi Foods Ltd","user":"yaw","role":"VERIFIER"})
      await s.done()
    })
    await test.step("2.A1.7", async () => {
      const s = P.step("2.A1.7")
      const out = await s.do("addMember", {"organization":"Adansi Foods Ltd","email":"nobody@example.test","role":"PREPARER"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.account.not-found"},"why":"membership is granted to an existing account, a newcomer requests access first"}])
    })
    await test.step("2.A1.8", async () => {
      const s = P.step("2.A1.8")
      const out = await s.do("addMember", {"organization":"Adansi Foods Ltd","user":"kofi","role":"REVIEWER"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.member.duplicate","with":{"email":"{email:kofi}","organization":"Adansi Foods Ltd"}}}])
    })
    await test.step("2.A1.9", async () => {
      const s = P.step("2.A1.9")
      const out = await s.do("changeMemberRole", {"organization":"Adansi Foods Ltd","user":"ama","role":"PREPARER"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.member.last-owner","with":{"organization":"Adansi Foods Ltd"}}}])
    })
    await test.step("2.A1.10", async () => {
      const s = P.step("2.A1.10")
      const out = await s.do("removeMember", {"organization":"Adansi Foods Ltd","user":"ama"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.member.last-owner","with":{"organization":"Adansi Foods Ltd"}}}])
    })
    await test.step("2.A1.11", async () => {
      const s = P.step("2.A1.11")
      await s.expect(undefined, [{"outcome":"historyCount","args":{"organization":"Adansi Foods Ltd","action":"MEMBER_ADDED","count":3}},{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"MEMBER_ADDED","detail":"{email:kofi} added as REVIEWER","actor":"ama"},"why":"it updated as you added them, without a reload; structure changes join the same card from section B on"}])
    })
  })

  test("A2. A verifier reads everything and changes nothing", async () => {
    await test.step("2.A2.1", async () => {
      const s = P.step("2.A2.1").as("yaw")
      const out = await s.do("signIn", {"user":"yaw"})
      await s.done()
    })
    await test.step("2.A2.2", async () => {
      const s = P.step("2.A2.2")
      const out = await s.do("openOrganization", {"organization":"Adansi Foods Ltd"})
      await s.expect(out, [{"outcome":"myRole","args":{"user":"yaw","organization":"Adansi Foods Ltd","role":"VERIFIER"}}])
    })
    await test.step("2.A2.3", async () => {
      const s = P.step("2.A2.3")
      await s.expect(undefined, [{"outcome":"cannotWrite","args":{"user":"yaw","organization":"Adansi Foods Ltd"}}])
    })
    await test.step("2.A2.4", async () => {
      const s = P.step("2.A2.4")
      const out = await s.do("signOut", {"user":"yaw"})
      await s.done()
    })
  })

  test("A3. Two organizations may share a name", async () => {
    await test.step("2.A3.1", async () => {
      const s = P.step("2.A3.1").as("ama")
      const out = await s.do("createOrganization", {"name":"adansi foods ltd"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.organization.name-duplicate","with":{"name":"adansi foods ltd"}},"why":"refused once, in the form, naming the organization of A1 with its number; names are compared without regard to case, and the button now reads Create anyway"}])
    })
    await test.step("2.A3.2", async () => {
      const s = P.step("2.A3.2")
      const out = await s.do("createOrganization", {"name":"adansi foods ltd","confirmDuplicate":true})
      await s.done()
    })
    await test.step("2.A3.3", async () => {
      const s = P.step("2.A3.3")
      await s.expect(undefined, [{"outcome":"organizationCount","args":{"user":"ama","count":2},"why":"both organizations are listed in the switcher, each with its number"}])
    })
    await test.step("2.A3.4", async () => {
      const s = P.step("2.A3.4")
      const out = await s.do("renameOrganization", {"organization":"adansi foods ltd","name":"Adansi Foods Ltd"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.organization.name-duplicate","with":{"name":"Adansi Foods Ltd"}},"why":"the same sentence, naming the first organization; the button reads Save anyway"}])
    })
    await test.step("2.A3.5", async () => {
      const s = P.step("2.A3.5")
      const out = await s.do("renameOrganization", {"organization":"adansi foods ltd","name":"Adansi Foods Ltd","confirmDuplicate":true})
      await s.expect(out, [{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd #2","action":"ORGANIZATION_RENAMED","detail":"renamed from 'adansi foods ltd' to 'Adansi Foods Ltd'"}}])
    })
    await test.step("2.A3.6", async () => {
      const s = P.step("2.A3.6")
      const out = await s.do("deleteOrganization", {"organization":"Adansi Foods Ltd #2","reason":"duplicate created for the walkthrough, no client data"})
      await s.expect(out, [{"outcome":"organizationCount","args":{"user":"ama","count":1}}])
    })
    await test.step("2.A3.7", async () => {
      const s = P.step("2.A3.7")
      const out = await s.do("createOrganization", {"name":"Adansi Foods Ltd"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.organization.name-duplicate","with":{"name":"Adansi Foods Ltd"}},"why":"still refused once, naming only the live organization; the removed one does not count"}])
    })
  })

  test("B1. The reporting company is there by definition", async () => {
    await test.step("2.B1.1", async () => {
      const s = P.step("2.B1.1")
      await s.expect(undefined, [{"outcome":"entityListed","args":{"organization":"Adansi Foods Ltd","name":"Adansi Foods Ltd","reportingCompany":true,"equityShare":100,"financialControlShare":100,"operationalControlShare":100},"why":"its row has no Remove, and in its edit form the relationship, the percentages, Operated by the company, Financial control and Held through show their fixed values and are disabled"}])
    })
  })

  test("B2. A subsidiary with dates, and an associate", async () => {
    await test.step("2.B2.1", async () => {
      const s = P.step("2.B2.1")
      const out = await s.do("addEntity", {"organization":"Adansi Foods Ltd","name":"Adansi Logistics Ltd","relationship":"SUBSIDIARY","economicInterest":100,"legalOwnership":100,"operatedByCompany":true,"acquiredOn":"2025-07-01","disposedOn":"2025-01-01","jurisdiction":"GH"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.entity.disposal-before-acquisition"}}])
    })
    await test.step("2.B2.2", async () => {
      const s = P.step("2.B2.2")
      const out = await s.do("addEntity", {"organization":"Adansi Foods Ltd","name":"Adansi Logistics Ltd","relationship":"SUBSIDIARY","economicInterest":100,"legalOwnership":100,"operatedByCompany":true,"acquiredOn":"2025-07-01","jurisdiction":"GH"})
      await s.expect(out, [{"outcome":"entityListed","args":{"organization":"Adansi Foods Ltd","name":"Adansi Logistics Ltd","equityShare":100,"financialControlShare":100,"operationalControlShare":100,"from":"2025-07-01"}}])
    })
    await test.step("2.B2.3", async () => {
      const s = P.step("2.B2.3")
      const out = await s.do("addEntity", {"organization":"Adansi Foods Ltd","name":"Coldstore Ghana Ltd","relationship":"ASSOCIATE","economicInterest":150})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.entity.percent-range","with":{"field":"Economic interest"}}}])
    })
    await test.step("2.B2.4", async () => {
      const s = P.step("2.B2.4")
      const out = await s.do("addEntity", {"organization":"Adansi Foods Ltd","name":"Coldstore Ghana Ltd","relationship":"ASSOCIATE","economicInterest":30,"legalOwnership":30,"jurisdiction":"GH"})
      await s.expect(out, [{"outcome":"entityListed","args":{"organization":"Adansi Foods Ltd","name":"Coldstore Ghana Ltd","equityShare":30,"financialControlShare":0,"operationalControlShare":0}}])
    })
    await test.step("2.B2.5", async () => {
      const s = P.step("2.B2.5")
      const out = await s.do("addEntity", {"organization":"Adansi Foods Ltd","name":"adansi logistics ltd","relationship":"SUBSIDIARY","economicInterest":100})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.entity.name-duplicate","with":{"name":"adansi logistics ltd"}},"why":"names are compared without regard to case"}])
    })
  })

  test("B3. A parent chain cannot loop", async () => {
    await test.step("2.B3.1", async () => {
      const s = P.step("2.B3.1")
      const out = await s.do("editEntity", {"organization":"Adansi Foods Ltd","entity":"Coldstore Ghana Ltd","heldThrough":"Adansi Logistics Ltd"})
      await s.done()
    })
    await test.step("2.B3.2", async () => {
      const s = P.step("2.B3.2")
      const out = await s.do("editEntity", {"organization":"Adansi Foods Ltd","entity":"Adansi Logistics Ltd","heldThrough":"Coldstore Ghana Ltd"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.entity.parent-loop","with":{"parent":"Coldstore Ghana Ltd","entity":"Adansi Logistics Ltd"}}}])
    })
    await test.step("2.B3.3", async () => {
      const s = P.step("2.B3.3")
      const out = await s.do("editEntity", {"organization":"Adansi Foods Ltd","entity":"Coldstore Ghana Ltd","heldThrough":"directly"})
      await s.expect(out, [{"outcome":"entityListed","args":{"organization":"Adansi Foods Ltd","name":"Adansi Logistics Ltd","heldThrough":"directly"}}])
    })
  })

  test("C1. Three sites, one of them leased", async () => {
    await test.step("2.C1.1", async () => {
      const s = P.step("2.C1.1")
      const out = await s.do("addFacility", {"organization":"Adansi Foods Ltd","name":"Kumasi Plant","location":"Kumasi","country":"GH","gridRegion":"GHA","entity":"Adansi Foods Ltd"})
      await s.expect(out, [{"outcome":"facilityListed","args":{"organization":"Adansi Foods Ltd","name":"Kumasi Plant","entity":"Adansi Foods Ltd","gridRegion":"GHA"},"why":"the Legal entity list names the reporting company as such; a blank grid region follows the country"}])
    })
    await test.step("2.C1.2", async () => {
      const s = P.step("2.C1.2")
      const out = await s.do("addFacility", {"organization":"Adansi Foods Ltd","name":"Tema Depot","location":"Tema","country":"GH","entity":"Adansi Logistics Ltd","lease":"OPERATING_LEASE_IN","leaseFrom":"2025-07-01","leaseUntil":"2025-06-30"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.facility.lease-ends-before-start"}}])
    })
    await test.step("2.C1.3", async () => {
      const s = P.step("2.C1.3")
      const out = await s.do("addFacility", {"organization":"Adansi Foods Ltd","name":"Tema Depot","location":"Tema","country":"GH","entity":"Adansi Logistics Ltd","lease":"OPERATING_LEASE_IN","leaseFrom":"2025-07-01"})
      await s.expect(out, [{"outcome":"facilityListed","args":{"organization":"Adansi Foods Ltd","name":"Tema Depot","entity":"Adansi Logistics Ltd","lease":"OPERATING_LEASE_IN"}}])
    })
    await test.step("2.C1.4", async () => {
      const s = P.step("2.C1.4")
      const out = await s.do("addFacility", {"organization":"Adansi Foods Ltd","name":"Takoradi Cold Store","location":"Takoradi","country":"GH","entity":"Coldstore Ghana Ltd"})
      await s.expect(out, [{"outcome":"facilityListed","args":{"organization":"Adansi Foods Ltd","name":"Takoradi Cold Store","entity":"Coldstore Ghana Ltd"}}])
    })
  })

  test("C2. An entity with facilities is not deleted", async () => {
    await test.step("2.C2.1", async () => {
      const s = P.step("2.C2.1")
      const out = await s.do("removeEntity", {"organization":"Adansi Foods Ltd","entity":"Coldstore Ghana Ltd","reason":"walkthrough: trying to remove an entity with a site"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.entity.has-facilities","with":{"entity":"Coldstore Ghana Ltd"}}}])
    })
  })

  test("D1. An emission source sets the default classification", async () => {
    await test.step("2.D1.1", async () => {
      const s = P.step("2.D1.1")
      const out = await s.do("addStream", {"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","name":"Boiler LPG","kind":"STATIONARY_COMBUSTION","fuel":"LPG"})
      await s.expect(out, [{"outcome":"streamListed","args":{"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","name":"Boiler LPG","kind":"STATIONARY_COMBUSTION","contractorOperated":false}}])
    })
    await test.step("2.D1.2", async () => {
      const s = P.step("2.D1.2")
      const out = await s.do("addStream", {"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","name":"Plant grid supply","kind":"PURCHASED_ELECTRICITY","meterOrSupplier":"ECG-KSI-01"})
      await s.done()
    })
    await test.step("2.D1.3", async () => {
      const s = P.step("2.D1.3")
      const out = await s.do("addStream", {"organization":"Adansi Foods Ltd","facility":"Tema Depot","name":"Delivery fleet","kind":"MOBILE_COMBUSTION","fuel":"Diesel","contractorOperated":true})
      await s.expect(out, [{"outcome":"streamListed","args":{"organization":"Adansi Foods Ltd","facility":"Tema Depot","name":"Delivery fleet","contractorOperated":true},"why":"the form says a contractor's source is scope 3 under chapter 4"}])
    })
  })

  test("D2. Names are unique per facility", async () => {
    await test.step("2.D2.1", async () => {
      const s = P.step("2.D2.1")
      const out = await s.do("addStream", {"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","name":"Boiler LPG","kind":"STATIONARY_COMBUSTION"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.stream.name-duplicate","with":{"facility":"Kumasi Plant","name":"Boiler LPG"}}}])
    })
  })

  test("D3. The history records the structure, and only real changes", async () => {
    await test.step("2.D3.1", async () => {
      const s = P.step("2.D3.1")
      const out = await s.do("editEntity", {"organization":"Adansi Foods Ltd","entity":"Adansi Logistics Ltd"})
      await s.done()
    })
    await test.step("2.D3.2", async () => {
      const s = P.step("2.D3.2")
      await s.expect(undefined, [{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"ENTITY_ADDED","detail":"Adansi Logistics Ltd added","actor":"ama"}},{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"ENTITY_ADDED","detail":"Coldstore Ghana Ltd added","actor":"ama"}},{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"ENTITY_UPDATED","detail":"Coldstore Ghana Ltd","actor":"ama"}},{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"FACILITY_ADDED","detail":"Kumasi Plant added under Adansi Foods Ltd","actor":"ama"}},{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"STREAM_ADDED","detail":"Boiler LPG added at Kumasi Plant","actor":"ama"}}])
    })
    await test.step("2.D3.3", async () => {
      const s = P.step("2.D3.3")
      await s.expect(undefined, [{"outcome":"historyCount","args":{"organization":"Adansi Foods Ltd","action":"ENTITY_UPDATED","count":2}},{"outcome":"historyCount","args":{"organization":"Adansi Foods Ltd","action":"ENTITY_ADDED","count":2}},{"outcome":"historyCount","args":{"organization":"Adansi Foods Ltd","action":"FACILITY_ADDED","count":3}},{"outcome":"historyCount","args":{"organization":"Adansi Foods Ltd","action":"STREAM_ADDED","count":3},"why":"a save that changes nothing writes no row, and a refused act is not an act"}])
    })
  })

  test("D4. A source described on a record is reconciled against the register", async () => {
    await test.step("2.D4.1", async () => {
      const s = P.step("2.D4.1")
      const out = await s.do("recordActivity", {"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","activityType":"Boiler LPG top-up","quantity":400,"unit":"kg","periodStart":"2025-03-01","periodEnd":"2025-03-31","newSource":{"name":"Boiler LPG 2","kind":"STATIONARY_COMBUSTION","fuel":"LPG"}})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.stream.name-similar","with":{"facility":"Kumasi Plant","candidates":"'Boiler LPG'","name":"Boiler LPG 2"}},"why":"a near name is a prompt, never a silent match; the record is not saved and no number is used"}])
    })
    await test.step("2.D4.2", async () => {
      const s = P.step("2.D4.2")
      const out = await s.do("recordActivity", {"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","activityType":"Boiler LPG top-up","quantity":400,"unit":"kg","periodStart":"2025-03-01","periodEnd":"2025-03-31","newSource":{"name":"boiler lpg","kind":"STATIONARY_COMBUSTION"}})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.stream.name-duplicate","with":{"facility":"Kumasi Plant","name":"boiler lpg"}},"why":"the exact name is taken, so the notice offers \"Use Boiler LPG\" and no \"anyway\""}])
    })
    await test.step("2.D4.3", async () => {
      const s = P.step("2.D4.3")
      await s.expect(undefined, [{"outcome":"historyCount","args":{"organization":"Adansi Foods Ltd","action":"STREAM_ADDED","count":3},"why":"a refused source creates nothing, and the record it came with is not written either"}])
    })
  })

  test("D5. An edit keeps the source and writes what changed", async () => {
    await test.step("2.D5.1", async () => {
      const s = P.step("2.D5.1")
      const out = await s.do("addStream", {"organization":"Adansi Foods Ltd","facility":"Tema Depot","name":"Yard genset","kind":"STATIONARY_COMBUSTION","fuel":"Diesel"})
      await s.done()
    })
    await test.step("2.D5.2", async () => {
      const s = P.step("2.D5.2")
      const out = await s.do("editStream", {"organization":"Adansi Foods Ltd","facility":"Tema Depot","name":"Yard genset","newName":"Yard standby genset","meterOrSupplier":"Yard tank dip"})
      await s.expect(out, [{"outcome":"streamListed","args":{"organization":"Adansi Foods Ltd","facility":"Tema Depot","name":"Yard standby genset","kind":"STATIONARY_COMBUSTION"}},{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"STREAM_EDITED","detail":"Yard standby genset at Tema Depot: name Yard genset → Yard standby genset, meter or supplier none → Yard tank dip","actor":"ama"},"why":"the source is what the evidence pack keys on, so a rename or a changed meter is written with the old and new values"}])
    })
    await test.step("2.D5.3", async () => {
      const s = P.step("2.D5.3")
      const out = await s.do("editStream", {"organization":"Adansi Foods Ltd","facility":"Tema Depot","name":"Yard standby genset"})
      await s.expect(out, [{"outcome":"historyCount","args":{"organization":"Adansi Foods Ltd","action":"STREAM_EDITED","count":1},"why":"a save that changes nothing is not an act"}])
    })
    await test.step("2.D5.4", async () => {
      const s = P.step("2.D5.4")
      const out = await s.do("editStream", {"organization":"Adansi Foods Ltd","facility":"Tema Depot","name":"Yard standby genset","kind":"MOBILE_COMBUSTION"})
      await s.expect(out, [{"outcome":"streamListed","args":{"organization":"Adansi Foods Ltd","facility":"Tema Depot","name":"Yard standby genset","kind":"MOBILE_COMBUSTION"}},{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"STREAM_EDITED","detail":"Yard standby genset at Tema Depot: kind stationary combustion → mobile combustion"},"why":"no record names the source yet, so the kind changes without a reason; procedure 3 case L1 asks for one once records exist"}])
    })
    await test.step("2.D5.5", async () => {
      const s = P.step("2.D5.5")
      const out = await s.do("editStream", {"organization":"Adansi Foods Ltd","facility":"Tema Depot","name":"Yard standby genset","newName":"delivery fleet"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.stream.name-duplicate","with":{"facility":"Tema Depot","name":"delivery fleet"}},"why":"the check skips the source itself but not its neighbours, and ignores case"}])
    })
    await test.step("2.D5.6", async () => {
      const s = P.step("2.D5.6")
      const out = await s.do("removeStream", {"organization":"Adansi Foods Ltd","facility":"Tema Depot","name":"Yard standby genset"})
      await s.expect(out, [{"outcome":"streamAbsent","args":{"organization":"Adansi Foods Ltd","facility":"Tema Depot","name":"Yard standby genset"},"why":"the depot goes into procedure 3 with the one source it had"}])
    })
  })

  test("E1. A custom unit is a multiple of a registered one", async () => {
    await test.step("2.E1.1", async () => {
      const s = P.step("2.E1.1")
      const out = await s.do("addCustomUnit", {"organization":"Adansi Foods Ltd","code":"litre","label":"A litre again","equals":1,"of":"litre"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.unit.registered","with":{"code":"litre"}}}])
    })
    await test.step("2.E1.2", async () => {
      const s = P.step("2.E1.2")
      const out = await s.do("addCustomUnit", {"organization":"Adansi Foods Ltd","code":"crate","label":"Crate of 24 bottles","equals":12,"of":"litre"})
      await s.expect(out, [{"outcome":"customUnitListed","args":{"organization":"Adansi Foods Ltd","code":"crate","definition":"1 crate = 12 litre"}}])
    })
    await test.step("2.E1.3", async () => {
      const s = P.step("2.E1.3")
      const out = await s.do("addCustomUnit", {"organization":"Adansi Foods Ltd","code":"crate","label":"Crate of 24 bottles","equals":12,"of":"litre"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.unit.duplicate","with":{"code":"crate"}}}])
    })
  })

  test("E2. A typical density is shared; a supplier's is the organization's own", async () => {
    await test.step("2.E2.1", async () => {
      const s = P.step("2.E2.1")
      await s.expect(undefined, [{"outcome":"densityListed","args":{"organization":"Adansi Foods Ltd","material":"Diesel","typical":true,"kgPerLitre":0.84},"why":"typical values are for planning and the gate says so"}])
    })
    await test.step("2.E2.2", async () => {
      const s = P.step("2.E2.2")
      const out = await s.do("addDensity", {"organization":"Adansi Foods Ltd","material":"Diesel (Adansi CoA)","kgPerLitre":0.8325,"source":"Supplier certificate of analysis, May 2025"})
      await s.done()
    })
    await test.step("2.E2.3", async () => {
      const s = P.step("2.E2.3")
      const out = await s.do("addDensity", {"organization":"Adansi Foods Ltd","material":"Diesel (Adansi CoA)","kgPerLitre":0.8325,"source":"Supplier certificate of analysis, May 2025"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.density.duplicate","with":{"material":"Diesel (Adansi CoA)"}}}])
    })
  })

  test("F1. Two packs are imported", async () => {
    await test.step("2.F1.1", async () => {
      const s = P.step("2.F1.1")
      await s.expect(undefined, [{"outcome":"factorsEmpty","args":{"organization":"Adansi Foods Ltd"},"why":"the Factor packs card lists the three shipped editions by their display names, each with View factors and Import pack"}])
    })
    await test.step("2.F1.2", async () => {
      const s = P.step("2.F1.2")
      const out = await s.do("importPack", {"organization":"Adansi Foods Ltd","pack":"ghana","packName":"Ghana: grid electricity and transmission losses"})
      await s.expect(out, [{"outcome":"importResult","args":{"added":7,"versioned":0}},{"outcome":"factorListed","args":{"organization":"Adansi Foods Ltd","name":"Grid electricity T&D losses, Ghana (derived)","approved":false},"why":"the row reads \"Caveat: Derived, not published: approve it after checking the year's loss rate with the Energy Commission statistics, or replace it with the utility's figure.\" under Not approved; the six grid rows carry a note, not a caveat, and arrive approved"}])
    })
    await test.step("2.F1.3", async () => {
      const s = P.step("2.F1.3")
      const out = await s.do("approveFactor", {"organization":"Adansi Foods Ltd","factor":"Grid electricity T&D losses, Ghana (derived)","note":""})
      await s.expect(out, [{"outcome":"screenReads","args":{"text":"Say what you checked before approving this factor."},"why":"Approve opens the dialog \"Approve Grid electricity T&D losses, Ghana (derived)\" with the caveat and a Check note field; the empty note is refused by the page before any request (the API refuses it too, rule ghg.factor.caveat-note-required on the note field)"}])
    })
    await test.step("2.F1.4", async () => {
      const s = P.step("2.F1.4")
      const out = await s.do("approveFactor", {"organization":"Adansi Foods Ltd","factor":"Grid electricity T&D losses, Ghana (derived)","note":"Loss rate checked against the Energy Commission's 2024 statistics (20%)."})
      await s.expect(out, [{"outcome":"factorListed","args":{"organization":"Adansi Foods Ltd","name":"Grid electricity T&D losses, Ghana (derived)","approved":true},"why":"the row reads Approved by the approver with the moment, then \"Checked: Loss rate checked against the Energy Commission's 2024 statistics (20%).\"; the caveat stays on the row and both print in the report's factor table"}])
    })
    await test.step("2.F1.5", async () => {
      const s = P.step("2.F1.5")
      const out = await s.do("unapproveFactor", {"organization":"Adansi Foods Ltd","factor":"Grid electricity T&D losses, Ghana (derived)"})
      await s.expect(out, [{"outcome":"factorListed","args":{"organization":"Adansi Foods Ltd","name":"Grid electricity T&D losses, Ghana (derived)","approved":false},"why":"leave it unapproved for the procedures that follow; unapproving clears the check note"}])
    })
    await test.step("2.F1.6", async () => {
      const s = P.step("2.F1.6")
      const out = await s.do("importPack", {"organization":"Adansi Foods Ltd","pack":"defra-2025","packName":"UK Government (DESNZ) GHG conversion factors 2025"})
      await s.expect(out, [{"outcome":"importResult","args":{"added":1928,"versioned":0},"why":"the table pages at 50 and the search narrows it"}])
    })
    await test.step("2.F1.7", async () => {
      const s = P.step("2.F1.7")
      const out = await s.do("importPack", {"organization":"Adansi Foods Ltd","pack":"defra-2026","packName":"UK Government (DESNZ) GHG conversion factors 2026"})
      await s.expect(out, [{"outcome":"importResult","args":{"added":385,"versioned":1483,"discontinued":445}},{"outcome":"factorListed","args":{"organization":"Adansi Foods Ltd","name":"Gaseous fuels: LPG","versions":["defra-2025","defra-2026"]},"why":"a row both years carry now shows two versions, defra-2025 to 2025-12-31 and defra-2026 from 2026-01-01; a pack-derived row offers Retire… and never Delete"}])
    })
  })

  test("F2. A blend's fractions add up to 1", async () => {
    await test.step("2.F2.1", async () => {
      const s = P.step("2.F2.1")
      const out = await s.do("addFactor", {"organization":"Adansi Foods Ltd","name":"R-410A (composition)","scope":"SCOPE_1","category":"FUGITIVE_EMISSIONS","unit":"kg","kgCo2ePerUnit":1923.5,"hfcsKgPerUnit":1,"blendComposition":"HFC-32:0.5,HFC-125:0.6","gwpBasis":"AR5","source":"Supplier safety data sheet, 2025","publicationYear":2025,"dataYear":2025})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.factor.blend-fractions"}}])
    })
    await test.step("2.F2.2", async () => {
      const s = P.step("2.F2.2")
      const out = await s.do("addFactor", {"organization":"Adansi Foods Ltd","name":"R-410A (composition)","scope":"SCOPE_1","category":"FUGITIVE_EMISSIONS","unit":"kg","kgCo2ePerUnit":1923.5,"hfcsKgPerUnit":1,"blendComposition":"HFC-32:0.5,HFC-125:0.5","gwpBasis":"AR5","source":"Supplier safety data sheet, 2025","publicationYear":2025,"dataYear":2025})
      await s.done()
    })
    await test.step("2.F2.3", async () => {
      const s = P.step("2.F2.3")
      const out = await s.do("addFactor", {"organization":"Adansi Foods Ltd","name":"Long-haul flights (supplier)","scope":"SCOPE_3","category":"BUSINESS_TRAVEL","unit":"passenger-km","kgCo2ePerUnit":0.195,"source":"Travel agent's emissions statement, 2025","publicationYear":2025,"dataYear":2025})
      await s.done()
    })
  })

  test("F3. A factor retires by its validity end", async () => {
    await test.step("2.F3.1", async () => {
      const s = P.step("2.F3.1")
      const out = await s.do("retireFactor", {"organization":"Adansi Foods Ltd","factor":"R-410A (composition)"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ui.factor.valid-to-required"},"why":"nothing is saved"}])
    })
    await test.step("2.F3.2", async () => {
      const s = P.step("2.F3.2")
      const out = await s.do("retireFactor", {"organization":"Adansi Foods Ltd","factor":"R-410A (composition)","validTo":"2025-12-31"})
      await s.done()
    })
  })

  test("F4. The author cannot approve; the reviewer does", async () => {
    await test.step("2.F4.1", async () => {
      const s = P.step("2.F4.1")
      const out = await s.do("approveFactor", {"organization":"Adansi Foods Ltd","factor":"Long-haul flights (supplier)"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.factor.self-approval","with":{"name":"Long-haul flights (supplier)","checker":"Kofi Mensah"}}}])
    })
    await test.step("2.F4.2", async () => {
      const s = P.step("2.F4.2").as("kofi")
      const out = await s.do("signIn", {"user":"kofi"})
      await s.done()
    })
    await test.step("2.F4.3", async () => {
      const s = P.step("2.F4.3")
      const out = await s.do("approveFactor", {"organization":"Adansi Foods Ltd","factor":"Long-haul flights (supplier)"})
      await s.expect(out, [{"outcome":"factorListed","args":{"organization":"Adansi Foods Ltd","name":"Long-haul flights (supplier)","approved":true,"approvedBy":"kofi"}}])
    })
    await test.step("2.F4.4", async () => {
      const s = P.step("2.F4.4")
      await s.expect(undefined, [{"outcome":"factorListed","args":{"organization":"Adansi Foods Ltd","name":"R-410A (composition)","approved":false},"why":"leave it unapproved, procedure 5 reads the gate refusing it"}])
    })
  })

  test("G1. Solo Ltd", async () => {
    await test.step("2.G1.1", async () => {
      const s = P.step("2.G1.1").as("yaw")
      const out = await s.do("signIn", {"user":"yaw"})
      await s.done()
    })
    await test.step("2.G1.2", async () => {
      const s = P.step("2.G1.2")
      const out = await s.do("createOrganization", {"name":"Solo Ltd"})
      await s.expect(out, [{"outcome":"myRole","args":{"user":"yaw","organization":"Solo Ltd","role":"OWNER"},"why":"a verifier elsewhere is an owner here, roles are per organization"}])
    })
    await test.step("2.G1.3", async () => {
      const s = P.step("2.G1.3")
      const out = await s.do("addFactor", {"organization":"Solo Ltd","name":"Diesel (Solo)","scope":"SCOPE_1","category":"STATIONARY_COMBUSTION","unit":"litre","kgCo2ePerUnit":2.66,"source":"Own transcription of DESNZ 2025"})
      await s.done()
    })
    await test.step("2.G1.4", async () => {
      const s = P.step("2.G1.4")
      const out = await s.do("approveFactor", {"organization":"Solo Ltd","factor":"Diesel (Solo)"})
      await s.expect(out, [{"outcome":"factorListed","args":{"organization":"Solo Ltd","name":"Diesel (Solo)","approved":true,"approvedBy":"yaw","selfApproved":true},"why":"nobody else is a member, so the refusal of case F4 does not apply, and the record says so; procedure 6 reads the sentence on a report"}])
    })
    await test.step("2.G1.5", async () => {
      const s = P.step("2.G1.5")
      const out = await s.do("signOut", {"user":"yaw"})
      await s.done()
    })
  })
})
