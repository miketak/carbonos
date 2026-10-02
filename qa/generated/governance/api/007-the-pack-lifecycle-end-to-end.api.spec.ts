// generated from qa/packs/governance/007-the-pack-lifecycle-end-to-end.yaml (sha256 df29187277104319156abb1b5419e877ecc76590534f2dbe01c8317771ffba6f); edit the YAML, then `make qa-compile`
import { procedure, test } from '../../../src/runtime/api/index.ts'

const P = procedure("governance", 7, "df29187277104319156abb1b5419e877ecc76590534f2dbe01c8317771ffba6f")

test.describe.configure({ mode: 'serial' })
test.describe("Procedure 7: The pack lifecycle end to end", () => {
  test.beforeAll(async () => P.start())
  test.afterAll(async () => P.finish())

  test("A1. A clone starts from the predecessor's rows", async () => {
    await test.step("7.A1.1", async () => {
      const s = P.step("7.A1.1").as("adminA")
      const out = await s.do("signIn", {"user":"adminA"})
      await s.done()
    })
    await test.step("7.A1.2", async () => {
      const s = P.step("7.A1.2")
      const out = await s.do("openFactorPacks", {})
      await s.expect(out, [{"outcome":"editionListed","args":{"edition":"defra-2025","status":"PUBLISHED","holders":1}},{"outcome":"editionListed","args":{"edition":"defra-2026","status":"PUBLISHED","holders":1}},{"outcome":"editionListed","args":{"edition":"ghana","status":"PUBLISHED","rows":7,"holders":1},"why":"two families, defra with two PUBLISHED editions (2025 and 2026) and ghana with one, each edition with its applies-from date, its row count and how many organizations hold it: all three read \"1 organization\""}])
    })
    await test.step("7.A1.3", async () => {
      const s = P.step("7.A1.3")
      await s.expect(undefined, [{"outcome":"observe","args":{"text":"Click Clone on the ghana edition: the dialog \"Clone ghana\" says the draft starts with the 7 rows of ghana, copied, with the name, source, URL, year and GWP basis filled in."}}])
    })
    await test.step("7.A1.4", async () => {
      const s = P.step("7.A1.4")
      const out = await s.do("cloneEdition", {"from":"ghana","editionId":"ghana"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.pack.edition-id-reused","with":{"edition":"ghana"}}}])
    })
    await test.step("7.A1.5", async () => {
      const s = P.step("7.A1.5")
      const out = await s.do("cloneEdition", {"from":"ghana","editionId":"ghana-2027-gov","appliesFrom":"2026-01-01"})
      await s.expect(out, [{"outcome":"editionListed","args":{"edition":"ghana-2027-gov","status":"DRAFT","rows":7,"holders":0},"why":"a toast reads \"ghana-2027-gov was created from ghana with its 7 rows.\"; the draft is listed under the family reading DRAFT, 7 rows, \"No organization\""}])
    })
    await test.step("7.A1.6", async () => {
      const s = P.step("7.A1.6")
      const out = await s.do("editPackRow", {"edition":"ghana","code":"GHANA:grid:GHA:2024","kgCo2ePerUnit":0.44})
      await s.expect(out, [{"outcome":"screenReads","args":{"text":"This edition is published, so its rows, metadata and values never change again"}},{"outcome":"refused","args":{"rule":"ghg.pack.edition-immutable","with":{"edition":"ghana","status":"published"}},"why":"reports already rest on them"}])
    })
  })

  test("A2. One value changes, and the rules are read live", async () => {
    await test.step("7.A2.1", async () => {
      const s = P.step("7.A2.1")
      const out = await s.do("editPackRow", {"edition":"ghana-2027-gov","code":"GHANA:grid:GHA:2024","kgCo2ePerUnit":0.44})
      await s.expect(out, [{"outcome":"packRowReads","args":{"edition":"ghana","code":"GHANA:grid:GHA:2024","kgCo2ePerUnit":0.468809},"why":"the published ghana still reads 0.468809"}])
    })
    await test.step("7.A2.2", async () => {
      const s = P.step("7.A2.2")
      const out = await s.do("editPackRow", {"edition":"ghana-2027-gov","code":"GHANA:grid:GHA:2024","newCode":"grid2024","unit":"widgets","dataYear":null})
      await s.expect(out, [{"outcome":"editionValidation","args":{"edition":"ghana-2027-gov","findings":[{"rule":"code","code":"grid2024"},{"rule":"unit","code":"grid2024"},{"rule":"provenance","code":"grid2024"}]},"why":"three findings on the row: the code needs two or more colon-separated segments, widgets is not a registered unit, and the provenance is missing the data year"}])
    })
    await test.step("7.A2.3", async () => {
      const s = P.step("7.A2.3")
      const out = await s.do("editPackRow", {"edition":"ghana-2027-gov","code":"grid2024","newCode":"GHANA:grid:GHA:2024","unit":"kWh","dataYear":2024})
      await s.expect(out, [{"outcome":"editionValidation","args":{"edition":"ghana-2027-gov","passes":true}}])
    })
  })

  test("B1. The curator cannot publish", async () => {
    await test.step("7.B1.1", async () => {
      const s = P.step("7.B1.1")
      const out = await s.do("publishEdition", {"edition":"ghana-2027-gov"})
      await s.expect(out, [{"outcome":"publishGate","args":{"edition":"ghana-2027-gov","noDocument":true}},{"outcome":"dialogButtonDisabled","args":{"dialog":"Publish ghana-2027-gov","button":"Publish","rule":"ghg.pack.approver-is-curator"},"why":"the dialog lists the conditions; the rules line passes; no source document yet, and the curator is the one asking"}])
    })
    await test.step("7.B1.2", async () => {
      const s = P.step("7.B1.2")
      const out = await s.do("attachSourceDocument", {"edition":"ghana-2027-gov","file":"source-document.txt"})
      await s.expect(out, [{"outcome":"publishGate","args":{"edition":"ghana-2027-gov","documentOnFile":true,"curatorIsMe":true}},{"outcome":"editionListed","args":{"edition":"ghana-2027-gov","status":"DRAFT"},"why":"the citation is typed by whoever publishes, in case B2; the edition is still a draft"}])
    })
  })

  test("B2. The second administrator reads the blast radius and publishes", async () => {
    await test.step("7.B2.1", async () => {
      const s = P.step("7.B2.1").as("adminB")
      const out = await s.do("signIn", {"user":"adminB"})
      await s.done()
    })
    await test.step("7.B2.2", async () => {
      const s = P.step("7.B2.2")
      const out = await s.do("readBlastRadius", {"edition":"ghana-2027-gov"})
      await s.expect(out, [{"outcome":"blastRadius","args":{"edition":"ghana-2027-gov","rowsChanged":1,"holders":1,"row":{"code":"GHANA:grid:GHA:2024","from":0.468809,"to":0.44,"percent":-6.15},"organization":{"name":"Adansi Foods Ltd","estimatedKgCo2eDelta":-3485.89,"lastRun":"Run 001","lockedPeriod":"FY2025"}},"why":"the correction's Run 001 priced 121,000 kWh; (0.44 - 0.468809) × 121,000 is about -3,486 kg CO₂e"}])
    })
    await test.step("7.B2.3", async () => {
      const s = P.step("7.B2.3")
      const out = await s.do("publishEdition", {"edition":"ghana-2027-gov","appliesFrom":""})
      await s.expect(out, [{"outcome":"screenReads","args":{"text":"Give the date the edition applies from. It is the vintage boundary an adoption is run from."}},{"outcome":"dialogButtonDisabled","args":{"dialog":"Publish ghana-2027-gov","button":"Publish","rule":"ghg.pack.applies-from-required"}}])
    })
    await test.step("7.B2.4", async () => {
      const s = P.step("7.B2.4")
      const out = await s.do("publishEdition", {"edition":"ghana-2027-gov","appliesFrom":"2026-01-01","sourceDocument":"Gas supplier delivery note, March 2025 (test source)"})
      await s.expect(out, [{"outcome":"editionListed","args":{"edition":"ghana-2027-gov","status":"PUBLISHED","appliesFrom":"2026-01-01","supersedes":"ghana"}},{"outcome":"editionListed","args":{"edition":"ghana","status":"SUPERSEDED"}},{"outcome":"editionMetadata","args":{"edition":"ghana-2027-gov","curator":"adminA","approver":"adminB"},"why":"\"ghana-2027-gov was published.\"; ghana reads SUPERSEDED because the new edition applies after it; the Metadata tab prints the provenance review and the evidence checksum, not the publication moment, which the edition's events carry"}])
    })
    await test.step("7.B2.5", async () => {
      const s = P.step("7.B2.5").as("ama")
      const out = await s.do("signIn", {"user":"ama"})
      await s.done()
    })
    await test.step("7.B2.6", async () => {
      const s = P.step("7.B2.6")
      await s.expect(undefined, [{"outcome":"factorListed","args":{"organization":"Adansi Foods Ltd","name":"Grid electricity, Ghana (2024)","versions":["ghana"]}},{"outcome":"runListed","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5,"totalKgCo2e":120373.32},"why":"0.468809 and 120,373.32 kg: publishing moved nothing"}])
    })
  })

  test("C1. The notice is in the organization's workspace", async () => {
    await test.step("7.C1.1", async () => {
      const s = P.step("7.C1.1")
      await s.expect(undefined, [{"outcome":"updatesBadge","args":{"organization":"Adansi Foods Ltd","count":1}}])
    })
    await test.step("7.C1.2", async () => {
      const s = P.step("7.C1.2")
      const out = await s.do("openUpdates", {"organization":"Adansi Foods Ltd"})
      await s.expect(out, [{"outcome":"noticeListed","args":{"organization":"Adansi Foods Ltd","edition":"ghana-2027-gov","predecessor":"ghana","rowsAffected":1,"rowsOverThreshold":1,"status":"OPEN"},"why":"raised now, with the estimated movement"}])
    })
    await test.step("7.C1.3", async () => {
      const s = P.step("7.C1.3")
      const out = await s.do("reviewNotice", {"organization":"Adansi Foods Ltd","edition":"ghana-2027-gov"})
      await s.expect(out, [{"outcome":"noticeDiff","args":{"organization":"Adansi Foods Ltd","edition":"ghana-2027-gov","predecessor":"ghana","appliesFrom":"2026-01-01","rows":7,"row":{"code":"GHANA:grid:GHA:2024","current":0.468809,"new":0.44,"percent":-6.15},"earlierPeriodsInclude":["FY2025"]},"why":"six lineages at 0% and the grid row; the movement is estimated over the open FY2025 equity view"}])
    })
    await test.step("7.C1.4", async () => {
      const s = P.step("7.C1.4")
      await s.expect(undefined, [{"outcome":"noticeDiff","args":{"organization":"Adansi Foods Ltd","edition":"ghana-2027-gov","hasBaseYear":false},"why":"once a base year is designated (procedure 8), the note says instead that accepting raises a recalculation candidate and, above the significance threshold, holds final designation and publication until it is completed or declined"}])
    })
  })

  test("C2. A preparer reads and cannot decide", async () => {
    await test.step("7.C2.1", async () => {
      const s = P.step("7.C2.1").as("esi")
      const out = await s.do("signIn", {"user":"esi"})
      await s.done()
    })
    await test.step("7.C2.2", async () => {
      const s = P.step("7.C2.2")
      const out = await s.do("acceptNotice", {"organization":"Adansi Foods Ltd","edition":"ghana-2027-gov","answer":"VINTAGE_PROGRESSION"})
      await s.expect(out, [{"outcome":"roleDisabled","args":{"button":"Accept"}},{"outcome":"roleDisabled","args":{"button":"Decline"},"why":"fully readable"}])
    })
  })

  test("C3. Support access reads everything and cannot decide", async () => {
    await test.step("7.C3.1", async () => {
      const s = P.step("7.C3.1").as("adminB")
      const out = await s.do("signIn", {"user":"adminB"})
      await s.done()
    })
    await test.step("7.C3.2", async () => {
      const s = P.step("7.C3.2")
      await s.expect(undefined, [{"outcome":"organizationNotListed","args":{"organization":"Adansi Foods Ltd"},"why":"an administrator is an outsider"}])
    })
    await test.step("7.C3.3", async () => {
      const s = P.step("7.C3.3")
      const out = await s.do("assumeSupportAccess", {"organization":"Adansi Foods Ltd","reason":"short"})
      await s.expect(out, [{"outcome":"dialogButtonDisabled","args":{"dialog":"Assume access to {orgLabel:Adansi Foods Ltd}","button":"Assume access","rule":"ghg.support-access.reason-too-short"}}])
    })
    await test.step("7.C3.4", async () => {
      const s = P.step("7.C3.4")
      const out = await s.do("assumeSupportAccess", {"organization":"Adansi Foods Ltd","reason":"Ticket 118: the owner asked what the notice means"})
      await s.done()
    })
    await test.step("7.C3.5", async () => {
      const s = P.step("7.C3.5")
      const out = await s.do("openUpdates", {"organization":"Adansi Foods Ltd"})
      await s.expect(out, [{"outcome":"screenReads","args":{"text":"under support access until"}},{"outcome":"observe","args":{"text":"Every page carries the banner \"You are in Adansi Foods Ltd under support access until <time>. Every act is recorded in this organization's history.\". Settings opens only on Baseline and targets, with no Organization tab, and the foot of the sidebar reads \"Support access\" where a member's reads their role."}}])
    })
    await test.step("7.C3.6", async () => {
      const s = P.step("7.C3.6")
      const out = await s.do("acceptNotice", {"organization":"Adansi Foods Ltd","edition":"ghana-2027-gov","answer":"VINTAGE_PROGRESSION"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.support-access.cannot-decide","with":{"act":"adopt an edition for an organization"}}}])
    })
    await test.step("7.C3.7", async () => {
      const s = P.step("7.C3.7")
      const out = await s.do("declineNotice", {"organization":"Adansi Foods Ltd","edition":"ghana-2027-gov"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.support-access.cannot-decide","with":{"act":"decline an edition for an organization"}}}])
    })
    await test.step("7.C3.8", async () => {
      const s = P.step("7.C3.8")
      const out = await s.do("endSupportAccess", {"organization":"Adansi Foods Ltd"})
      await s.expect(out, [{"outcome":"organizationNotListed","args":{"organization":"Adansi Foods Ltd"},"why":"the organization leaves the administrator's list"}])
    })
    await test.step("7.C3.9", async () => {
      const s = P.step("7.C3.9").as("ama")
      const out = await s.do("signIn", {"user":"ama"})
      await s.done()
    })
    await test.step("7.C3.10", async () => {
      const s = P.step("7.C3.10")
      await s.expect(undefined, [{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"ADMIN_ACCESS_ASSUMED","actor":"adminB","detail":"Ticket 118: the owner asked what the notice means"}},{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"ADMIN_ACCESS_ENDED","actor":"adminB"},"why":"each with Admin B's email, the moment and the reason"}])
    })
  })

  test("C4. The reviewer answers the question and accepts", async () => {
    await test.step("7.C4.1", async () => {
      const s = P.step("7.C4.1").as("kofi")
      const out = await s.do("signIn", {"user":"kofi"})
      await s.done()
    })
    await test.step("7.C4.2", async () => {
      const s = P.step("7.C4.2")
      const out = await s.do("acceptNotice", {"organization":"Adansi Foods Ltd","edition":"ghana-2027-gov"})
      await s.expect(out, [{"outcome":"answersOffered","args":{}},{"outcome":"dialogButtonDisabled","args":{"dialog":"{editionName:Adansi Foods Ltd|ghana-2027-gov}","button":"Accept","rule":"ghg.adoption.answer-required"}}])
    })
    await test.step("7.C4.3", async () => {
      const s = P.step("7.C4.3")
      const out = await s.do("acceptNotice", {"organization":"Adansi Foods Ltd","edition":"ghana-2027-gov","answer":"VINTAGE_PROGRESSION"})
      await s.expect(out, [{"outcome":"noticeListed","args":{"organization":"Adansi Foods Ltd","edition":"ghana-2027-gov","status":"ACCEPTED","decidedBy":"kofi"}},{"outcome":"updatesBadge","args":{"organization":"Adansi Foods Ltd","count":0},"why":"\"Adopted ghana-2027-gov: 1 version cut, 0 lineages added.\""}])
    })
    await test.step("7.C4.4", async () => {
      const s = P.step("7.C4.4")
      await s.expect(undefined, [{"outcome":"factorListed","args":{"organization":"Adansi Foods Ltd","name":"Grid electricity, Ghana (2024)","versions":["ghana","ghana-2027-gov"]},"why":"the old version until 2025-12-31 at 0.468809, the live one from 2026-01-01 at 0.44; nothing rewrote a past value"}])
    })
    await test.step("7.C4.5", async () => {
      const s = P.step("7.C4.5").as("ama")
      const out = await s.do("signIn", {"user":"ama"})
      await s.done()
    })
    await test.step("7.C4.6", async () => {
      const s = P.step("7.C4.6")
      await s.expect(undefined, [{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"FACTOR_PACK_ADOPTED","actor":"kofi","detail":"as a vintage progression"},"why":"Settings is the owner's; Overview carries no event list, History is the organization's record"}])
    })
    await test.step("7.C4.7", async () => {
      const s = P.step("7.C4.7")
      await s.expect(undefined, [{"outcome":"observe","args":{"text":"Open Settings and the Baseline and targets tab: no base year is designated yet, so no candidate was raised. The answer lives on the notice."}}])
    })
  })

  test("D1. FY2026", async () => {
    await test.step("7.D1.1", async () => {
      const s = P.step("7.D1.1")
      const out = await s.do("importActivities", {"organization":"Adansi Foods Ltd","file":"adansi-2026.csv"})
      await s.expect(out, [{"outcome":"activityExists","args":{"organization":"Adansi Foods Ltd","record":"ACT-0014","quantity":2100,"unit":"litre"}},{"outcome":"activityExists","args":{"organization":"Adansi Foods Ltd","record":"ACT-0015","quantity":110,"unit":"MWh"},"why":"\"2 records imported.\"; the two rows removed in procedure 3 do not count as duplicates"}])
    })
    await test.step("7.D1.2", async () => {
      const s = P.step("7.D1.2")
      const out = await s.do("createInventory", {"organization":"Adansi Foods Ltd","name":"FY2026","periodStart":"2026-01-01","periodEnd":"2026-12-31","approach":"OPERATIONAL_CONTROL","gwpSet":"AR5","straddle":"PRO_RATE","prefillBoundary":true})
      await s.done()
    })
    await test.step("7.D1.3", async () => {
      const s = P.step("7.D1.3")
      const out = await s.do("reviewActivityData", {"organization":"Adansi Foods Ltd","inventory":"FY2026"})
      await s.expect(out, [{"outcome":"recordView","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","record":"ACT-0014","status":"UNCLASSIFIED"}},{"outcome":"recordView","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","record":"ACT-0015","status":"UNCLASSIFIED"}},{"outcome":"recordView","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","record":"ACT-0006","status":"UNCLASSIFIED"}},{"outcome":"recordView","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","record":"ACT-0001","status":"EXCLUDED","reason":"OUTSIDE_PERIOD"}},{"outcome":"gateFinding","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","gate":"COMPLETENESS","severity":"WARNING","containing":"15 of 32 days"},"why":"three records are included: the two January rows and ACT-0006, the year-end LPG, whose 2025-12-15 to 2026-01-15 period reaches 15 days into 2026; every 2025 record is excluded as outside the period; the run pro-rates ACT-0006 to 46.88%"}])
    })
    await test.step("7.D1.4", async () => {
      const s = P.step("7.D1.4")
      const out = await s.do("classifyRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2026","record":"ACT-0014","factor":"Gaseous fuels: LPG (/litre)"})
      await s.done()
    })
    await test.step("7.D1.5", async () => {
      const s = P.step("7.D1.5")
      const out = await s.do("classifyRecord", {"organization":"Adansi Foods Ltd","inventory":"FY2026","record":"ACT-0006","factor":"Gaseous fuels: LPG (/litre)"})
      await s.done()
    })
    await test.step("7.D1.6", async () => {
      const s = P.step("7.D1.6")
      const out = await s.do("classifyWithSuggestion", {"organization":"Adansi Foods Ltd","inventory":"FY2026","record":"ACT-0015"})
      await s.expect(out, [{"outcome":"observe","args":{"text":"The picker offers the defra-2026 LPG version, the one live in 2026. The grid preview reads \"110 MWh → 110,000 kWh × 0.44 kg CO₂e/kWh\": the suggestion is the version live in the period."}}])
    })
    await test.step("7.D1.7", async () => {
      const s = P.step("7.D1.7")
      const out = await s.do("setResidualMix", {"organization":"Adansi Foods Ltd","inventory":"FY2026","available":false})
      await s.done()
    })
    await test.step("7.D1.8", async () => {
      const s = P.step("7.D1.8")
      const out = await s.do("freezeInventory", {"organization":"Adansi Foods Ltd","inventory":"FY2026"})
      await s.done()
    })
    await test.step("7.D1.9", async () => {
      const s = P.step("7.D1.9")
      const out = await s.do("launchRun", {"organization":"Adansi Foods Ltd","inventory":"FY2026"})
      await s.expect(out, [{"outcome":"runListed","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","run":1,"totalKgCo2e":52253.9}},{"outcome":"runLine","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","run":1,"record":"ACT-0015","kgCo2e":48400}},{"outcome":"runLine","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","run":1,"record":"ACT-0014","kgCo2e":3269.97}},{"outcome":"runLine","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","run":1,"record":"ACT-0006","kgCo2e":583.92,"coveredDays":15,"periodDays":32},"why":"48,400 for the electricity, 3,269.97 for the January LPG (2,100 litre × 1.55713) and 583.92 for the 15 pro-rated days of the year-end LPG (375 litre × 1.55713)"}])
    })
    await test.step("7.D1.10", async () => {
      const s = P.step("7.D1.10")
      await s.expect(undefined, [{"outcome":"reportCites","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","run":1,"factor":"Grid electricity, Ghana (2024)","edition":"ghana-2027-gov","from":"2026-01-01"}},{"outcome":"reportCites","args":{"organization":"Adansi Foods Ltd","inventory":"FY2026","run":1,"factor":"Gaseous fuels: LPG","edition":"defra-2026","from":"2026-01-01"},"why":"open the PDF and read the factor table: the grid row cites ghana-2027-gov from 2026-01-01; the LPG row cites defra-2026 from 2026-01-01"}])
    })
    await test.step("7.D1.11", async () => {
      const s = P.step("7.D1.11")
      await s.expect(undefined, [{"outcome":"runLine","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025 (correction)","run":1,"record":"ACT-0002","kgCo2e":56725.89},"why":"still 56,725.89 kg on the grid line at 0.468809: the reported year kept its factors"}])
    })
  })

  test("E1. Accepting is refused, declining stays open", async () => {
    await test.step("7.E1.1", async () => {
      const s = P.step("7.E1.1").as("adminB")
      const out = await s.do("signIn", {"user":"adminB"})
      await s.done()
    })
    await test.step("7.E1.2", async () => {
      const s = P.step("7.E1.2")
      const out = await s.do("cloneEdition", {"from":"ghana-2027-gov","editionId":"ghana-2027-gov.r2"})
      await s.done()
    })
    await test.step("7.E1.3", async () => {
      const s = P.step("7.E1.3")
      const out = await s.do("editPackRow", {"edition":"ghana-2027-gov.r2","code":"GHANA:grid:GHA:2024","kgCo2ePerUnit":0.45})
      await s.done()
    })
    await test.step("7.E1.4", async () => {
      const s = P.step("7.E1.4")
      const out = await s.do("attachSourceDocument", {"edition":"ghana-2027-gov.r2","file":"source-document.txt"})
      await s.done()
    })
    await test.step("7.E1.5", async () => {
      const s = P.step("7.E1.5").as("adminA")
      const out = await s.do("signIn", {"user":"adminA"})
      await s.done()
    })
    await test.step("7.E1.6", async () => {
      const s = P.step("7.E1.6")
      const out = await s.do("publishEdition", {"edition":"ghana-2027-gov.r2","appliesFrom":"2025-06-01","sourceDocument":"Gas supplier delivery note, March 2025 (test source)"})
      await s.expect(out, [{"outcome":"editionListed","args":{"edition":"ghana-2027-gov.r2","status":"PUBLISHED","appliesFrom":"2025-06-01"}},{"outcome":"editionListed","args":{"edition":"ghana-2027-gov","status":"PUBLISHED"}},{"outcome":"editionMetadata","args":{"edition":"ghana-2027-gov.r2","curator":"adminB","approver":"adminA"},"why":"an edition that applies from an earlier date than the one standing is not its successor, so it supersedes nothing (spec 02.5); the roles swap with the curator"}])
    })
    await test.step("7.E1.7", async () => {
      const s = P.step("7.E1.7").as("kofi")
      const out = await s.do("signIn", {"user":"kofi"})
      await s.done()
    })
    await test.step("7.E1.8", async () => {
      const s = P.step("7.E1.8")
      await s.expect(undefined, [{"outcome":"updatesBadge","args":{"organization":"Adansi Foods Ltd","count":1}}])
    })
    await test.step("7.E1.9", async () => {
      const s = P.step("7.E1.9")
      const out = await s.do("reviewNotice", {"organization":"Adansi Foods Ltd","edition":"ghana-2027-gov.r2"})
      await s.expect(out, [{"outcome":"noticeDiff","args":{"organization":"Adansi Foods Ltd","edition":"ghana-2027-gov.r2","blockedBy":"FY2025"},"why":"\"2025-06-01 falls inside FY2025 (2025-01-01 → 2025-12-31), which is published. A reported period keeps the factors it reported with, so this edition cannot be accepted while the platform blocks editions inside a published period. Declining stays available.\""}])
    })
    await test.step("7.E1.10", async () => {
      const s = P.step("7.E1.10")
      const out = await s.do("acceptNotice", {"organization":"Adansi Foods Ltd","edition":"ghana-2027-gov.r2","answer":"ERRATUM_ON_REPORTED_YEAR"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.pack.applies-inside-locked-period","with":{"edition":"ghana-2027-gov.r2","appliesFrom":"2025-06-01","inventory":"FY2025","start":"2025-01-01","end":"2025-12-31","status":"PUBLISHED","exit":"The edition cannot be imported while that period is on record and the platform setting Editions inside a published period is Blocked; choose an edition that applies from a later date, or ask a platform administrator about the setting."}},"why":"the refusal names the platform setting"}])
    })
    await test.step("7.E1.11", async () => {
      const s = P.step("7.E1.11")
      await s.expect(undefined, [{"outcome":"factorListed","args":{"organization":"Adansi Foods Ltd","name":"Grid electricity, Ghana (2024)","versions":["ghana","ghana-2027-gov"]},"why":"still two versions: the refusal wrote nothing"}])
    })
  })

  test("F1. A withdrawal closes the notice and moves no factor", async () => {
    await test.step("7.F1.1", async () => {
      const s = P.step("7.F1.1").as("adminA")
      const out = await s.do("signIn", {"user":"adminA"})
      await s.done()
    })
    await test.step("7.F1.2", async () => {
      const s = P.step("7.F1.2")
      const out = await s.do("withdrawEdition", {"edition":"ghana-2027-gov.r2","reason":"short"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.pack.withdrawal-reason-too-short","with":{"min":"10"}}}])
    })
    await test.step("7.F1.3", async () => {
      const s = P.step("7.F1.3")
      const out = await s.do("withdrawEdition", {"edition":"ghana-2027-gov.r2","reason":"Published against the wrong period; retracted"})
      await s.expect(out, [{"outcome":"editionListed","args":{"edition":"ghana-2027-gov.r2","status":"WITHDRAWN"},"why":"\"ghana-2027-gov.r2 was withdrawn.\"; the reason reaches the organizations, on the Updates row of case F1.4; the edition page itself prints the status, not the reason"}])
    })
    await test.step("7.F1.4", async () => {
      const s = P.step("7.F1.4")
      const out = await s.do("cloneEdition", {"from":"ghana","editionId":"ghana-scratch"})
      await s.done()
    })
    await test.step("7.F1.5", async () => {
      const s = P.step("7.F1.5")
      const out = await s.do("openEdition", {"edition":"ghana-scratch"})
      await s.expect(out, [{"outcome":"buttonsOffered","args":{"present":["Delete draft"],"absent":["Withdraw"]},"why":"a draft offers no Withdraw: no organization can see it, so there is nothing to retract"}])
    })
    await test.step("7.F1.6", async () => {
      const s = P.step("7.F1.6")
      const out = await s.do("deleteDraft", {"edition":"ghana-scratch"})
      await s.done()
    })
    await test.step("7.F1.7", async () => {
      const s = P.step("7.F1.7").as("kofi")
      const out = await s.do("signIn", {"user":"kofi"})
      await s.done()
    })
    await test.step("7.F1.8", async () => {
      const s = P.step("7.F1.8")
      const out = await s.do("openUpdates", {"organization":"Adansi Foods Ltd"})
      await s.expect(out, [{"outcome":"noticeListed","args":{"organization":"Adansi Foods Ltd","edition":"ghana-2027-gov.r2","status":"WITHDRAWN","withdrawalReason":"Published against the wrong period; retracted"}},{"outcome":"updatesBadge","args":{"organization":"Adansi Foods Ltd","count":0}}])
    })
    await test.step("7.F1.9", async () => {
      const s = P.step("7.F1.9")
      const out = await s.do("reviewNotice", {"organization":"Adansi Foods Ltd","edition":"ghana-2027-gov.r2"})
      await s.expect(out, [{"outcome":"screenReads","args":{"text":"The publisher withdrew this edition, so there is nothing to decide."}}])
    })
    await test.step("7.F1.10", async () => {
      const s = P.step("7.F1.10")
      await s.expect(undefined, [{"outcome":"factorListed","args":{"organization":"Adansi Foods Ltd","name":"Grid electricity, Ghana (2024)","versions":["ghana","ghana-2027-gov"]}},{"outcome":"runListed","args":{"organization":"Adansi Foods Ltd","inventory":"FY2025","run":5,"totalKgCo2e":120373.32},"why":"two versions, 120,373.32 kg: a withdrawal is the publisher's act"}])
    })
  })
})
