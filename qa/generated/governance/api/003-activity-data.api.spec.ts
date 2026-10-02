// generated from qa/packs/governance/003-activity-data.yaml (sha256 202991c68884a57bfa9bf1d0edbb28b956004821ebcc9b68efca082571085c4f); edit the YAML, then `make qa-compile`
import { procedure, test } from '../../../src/runtime/api/index.ts'

const P = procedure("governance", 3, "202991c68884a57bfa9bf1d0edbb28b956004821ebcc9b68efca082571085c4f")

test.describe.configure({ mode: 'serial' })
test.describe("Procedure 3: Activity data", () => {
  test.beforeAll(async () => P.start())
  test.afterAll(async () => P.finish())

  test("A1. The template, and the dry run", async () => {
    await test.step("3.A1.1", async () => {
      const s = P.step("3.A1.1").as("ama")
      const out = await s.do("signIn", {"user":"ama"})
      await s.done()
    })
    await test.step("3.A1.2", async () => {
      const s = P.step("3.A1.2")
      await s.expect(undefined, [{"outcome":"importTemplateHeader","args":{"organization":"Adansi Foods Ltd","header":"facility,stream,activity_type,quantity,unit,period_start,period_end,data_source,evidence_ref,data_quality,data_quality_tier,uncertainty_percent,note"}}])
    })
    await test.step("3.A1.3", async () => {
      const s = P.step("3.A1.3")
      const out = await s.do("previewImport", {"organization":"Adansi Foods Ltd","file":"adansi-2025.csv"})
      await s.expect(out, [{"outcome":"importPreview","args":{"recordsToAdd":10,"totals":[{"facility":"Kumasi Plant","stream":"Boiler LPG","unit":"litre","quantity":2400},{"facility":"Kumasi Plant","stream":"Plant grid supply","unit":"MWh","quantity":120},{"facility":"Tema Depot","stream":"Delivery fleet","unit":"litre","quantity":5000}],"warning":{"row":7,"containing":"the period is longer than one month (2025-12-15 to 2026-01-15)"},"ready":[2,3,4],"noStream":7,"noEvidence":2},"why":"\"Missing source\" appears nowhere, every row names its data source"}])
    })
  })

  test("A2. The import, and the same file again", async () => {
    await test.step("3.A2.1", async () => {
      const s = P.step("3.A2.1")
      const out = await s.do("importActivities", {"organization":"Adansi Foods Ltd","file":"adansi-2025.csv"})
      await s.expect(out, [{"outcome":"activityCount","args":{"organization":"Adansi Foods Ltd","count":10}},{"outcome":"activityRefs","args":{"organization":"Adansi Foods Ltd","from":"ACT-0001","to":"ACT-0010"}},{"outcome":"activityOrder","args":{"organization":"Adansi Foods Ltd","newestPeriodFirst":true,"first":"ACT-0006","last":"ACT-0001"}}])
    })
    await test.step("3.A2.2", async () => {
      const s = P.step("3.A2.2")
      const out = await s.do("previewImport", {"organization":"Adansi Foods Ltd","file":"adansi-2025.csv"})
      await s.expect(out, [{"outcome":"importRejected","args":{"rows":"all","messages":{"2":"duplicate: the same facility, activity, quantity, unit and period already exist on file or earlier in this file"}}}])
    })
  })

  test("B1. Four rows, four reasons, nothing written", async () => {
    await test.step("3.B1.1", async () => {
      const s = P.step("3.B1.1")
      const out = await s.do("previewImport", {"organization":"Adansi Foods Ltd","file":"adansi-2025-rejected.csv"})
      await s.expect(out, [{"outcome":"importRejected","args":{"rows":4,"messages":{"2":"quantity '1,2O0' is not a number","3":"period_start is in the future","4":"no facility named 'Kumasi Depot'","5":"duplicate: the same facility, activity, quantity, unit and period already exist on file or earlier in this file"}},"why":"the header is row 1, so the rows are named 2 to 5; row 3 also reads \"period_end is in the future\" because an empty end takes the start; row 5 repeats ACT-0001"},{"outcome":"activityCount","args":{"organization":"Adansi Foods Ltd","count":10},"why":"a file imports whole or not at all"}])
    })
  })

  test("C1. The banner counts what is missing, and a fix clears it", async () => {
    await test.step("3.C1.1", async () => {
      const s = P.step("3.C1.1")
      await s.expect(undefined, [{"outcome":"attentionCount","args":{"organization":"Adansi Foods Ltd","count":7},"why":"ACT-0004 to ACT-0010; the wording is about completeness, not assurance"}])
    })
    await test.step("3.C1.2", async () => {
      const s = P.step("3.C1.2")
      await s.expect(undefined, [{"outcome":"activityExists","args":{"organization":"Adansi Foods Ltd","record":"ACT-0009","issues":["NO_STREAM","NO_EVIDENCE"]},"why":"its tier is not missing, a blank tier follows the method, ESTIMATED to tier 4"}])
    })
    await test.step("3.C1.3", async () => {
      const s = P.step("3.C1.3")
      const out = await s.do("correctActivity", {"organization":"Adansi Foods Ltd","record":"ACT-0009","evidenceRef":"WB-2025-11","reason":"Weighbridge ticket found"})
      await s.expect(out, [{"outcome":"activityExists","args":{"organization":"Adansi Foods Ltd","record":"ACT-0009","evidenceRef":"WB-2025-11","issues":["NO_STREAM","EVIDENCE_REFERENCE_ONLY"]}},{"outcome":"attentionCount","args":{"organization":"Adansi Foods Ltd","count":7},"why":"\"Needs evidence\" goes and the drawer reads \"Reference WB-2025-11, nothing attached\"; the stream is still missing, and a record leaves the count only when every item on it is resolved"}])
    })
  })

  test("D1. A draft holds a source until its figures arrive", async () => {
    await test.step("3.D1.1", async () => {
      const s = P.step("3.D1.1")
      const out = await s.do("addActivityDraft", {"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","activityType":"Generator diesel"})
      await s.done()
    })
    await test.step("3.D1.2", async () => {
      const s = P.step("3.D1.2")
      const out = await s.do("enterActivity", {"organization":"Adansi Foods Ltd","record":"Generator diesel","quantity":150,"unit":"litre","periodStart":"2025-02-01","periodEnd":"2025-02-28"})
      await s.done()
    })
    await test.step("3.D1.3", async () => {
      const s = P.step("3.D1.3")
      await s.expect(undefined, [{"outcome":"observe","args":{"text":"Open the record again: the drawer offers Save but no Save draft. A saved record is corrected with a reason or removed with a reason; it cannot go back to a draft."}}])
    })
  })

  test("E1. A correction needs a reason and keeps the history", async () => {
    await test.step("3.E1.1", async () => {
      const s = P.step("3.E1.1")
      const out = await s.do("correctActivity", {"organization":"Adansi Foods Ltd","record":"ACT-0002","quantity":121,"reason":"typo"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.reason-too-short","with":{"what":"A correction"}}}])
    })
    await test.step("3.E1.2", async () => {
      const s = P.step("3.E1.2")
      const out = await s.do("correctActivity", {"organization":"Adansi Foods Ltd","record":"ACT-0002","quantity":121,"reason":"Invoice re-read: 121 MWh"})
      await s.expect(out, [{"outcome":"activityHistoryHas","args":{"organization":"Adansi Foods Ltd","record":"ACT-0002","kind":"CORRECTED","reason":"Invoice re-read: 121 MWh","field":"quantity","before":"120","after":"121"}}])
    })
    await test.step("3.E1.3", async () => {
      const s = P.step("3.E1.3")
      const out = await s.do("correctActivity", {"organization":"Adansi Foods Ltd","record":"ACT-0002","quantity":120,"reason":"Back to the invoice figure for the procedures"})
      await s.expect(out, [{"outcome":"activityHistoryHas","args":{"organization":"Adansi Foods Ltd","record":"ACT-0002","kind":"CORRECTED","reason":"Back to the invoice figure for the procedures","field":"quantity","before":"121","after":"120"},"why":"the history holds both corrections, nothing is overwritten"}])
    })
  })

  test("F1. A file and a link attach; a wrong type and a bare address are refused", async () => {
    await test.step("3.F1.1", async () => {
      const s = P.step("3.F1.1")
      const out = await s.do("attachFile", {"organization":"Adansi Foods Ltd","record":"ACT-0001","file":"not-evidence.zip"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.evidence.unsupported-type"}}])
    })
    await test.step("3.F1.2", async () => {
      const s = P.step("3.F1.2")
      const out = await s.do("attachFile", {"organization":"Adansi Foods Ltd","record":"ACT-0001","file":"source-document.txt"})
      await s.done()
    })
    await test.step("3.F1.3", async () => {
      const s = P.step("3.F1.3")
      const out = await s.do("attachLink", {"organization":"Adansi Foods Ltd","record":"ACT-0001","name":"Supplier portal","url":"www.example.test/delivery/LPG-2025-03"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.evidence.link-scheme"}}])
    })
    await test.step("3.F1.4", async () => {
      const s = P.step("3.F1.4")
      const out = await s.do("attachLink", {"organization":"Adansi Foods Ltd","record":"ACT-0001","name":"Supplier portal","url":"https://example.test/delivery/LPG-2025-03"})
      await s.expect(out, [{"outcome":"evidenceListed","args":{"organization":"Adansi Foods Ltd","record":"ACT-0001","name":"Supplier portal","kind":"LINK","count":2}}])
    })
  })

  test("G1. A removal needs a reason, and several are removed with one", async () => {
    await test.step("3.G1.1", async () => {
      const s = P.step("3.G1.1")
      const out = await s.do("removeActivity", {"organization":"Adansi Foods Ltd","record":"Generator diesel","reason":"Scratch record for the draft case"})
      await s.expect(out, [{"outcome":"activityCount","args":{"organization":"Adansi Foods Ltd","count":10},"why":"the dialog keeps its button disabled until a reason is typed; the record's history is kept"}])
    })
    await test.step("3.G1.2", async () => {
      const s = P.step("3.G1.2")
      const out = await s.do("importActivities", {"organization":"Adansi Foods Ltd","file":"adansi-2026.csv"})
      await s.expect(out, [{"outcome":"activityCount","args":{"organization":"Adansi Foods Ltd","count":12}}])
    })
    await test.step("3.G1.3", async () => {
      const s = P.step("3.G1.3")
      const out = await s.do("removeActivities", {"organization":"Adansi Foods Ltd","records":["ACT-0012","ACT-0013"],"reason":"Scratch rows for the bulk removal case"})
      await s.expect(out, [{"outcome":"activityCount","args":{"organization":"Adansi Foods Ltd","count":10},"why":"both go under the one reason; procedure 7 imports the same file again for FY2026, and a removed record does not count as a duplicate"}])
    })
  })

  test("G2. A facility with records is not removed", async () => {
    await test.step("3.G2.1", async () => {
      const s = P.step("3.G2.1")
      const out = await s.do("removeFacility", {"organization":"Adansi Foods Ltd","facility":"Takoradi Cold Store","reason":"walkthrough removal of a site with records"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.facility.has-records","with":{"facility":"Takoradi Cold Store"}}}])
    })
  })

  test("H1. Every document with its record", async () => {
    await test.step("3.H1.1", async () => {
      const s = P.step("3.H1.1")
      await s.expect(undefined, [{"outcome":"sourceDocumentListed","args":{"organization":"Adansi Foods Ltd","name":"source-document.txt","record":"ACT-0001"}},{"outcome":"sourceDocumentListed","args":{"organization":"Adansi Foods Ltd","name":"Supplier portal","record":"ACT-0001"}},{"outcome":"importBatchListed","args":{"organization":"Adansi Foods Ltd","file":"adansi-2025.csv"}},{"outcome":"importBatchListed","args":{"organization":"Adansi Foods Ltd","file":"adansi-2026.csv"}}])
    })
    await test.step("3.H1.2", async () => {
      const s = P.step("3.H1.2")
      await s.expect(undefined, [{"outcome":"evidenceIndexHeader","args":{"organization":"Adansi Foods Ltd","header":"record_ref,activity_type,facility,period_start,period_end,evidence_ref,document,kind,url,content_type,size_bytes,uploaded_by,uploaded_at"}}])
    })
  })

  test("I1. A view is a link", async () => {
    await test.step("3.I1.1", async () => {
      const s = P.step("3.I1.1")
      await s.expect(undefined, [{"outcome":"observe","args":{"text":"Type \"diesel\" in the search and choose the facility Kumasi Plant: one record, ACT-0004, and the address bar carries the search and the facility. Open ACT-0004, copy the address and open it in a new tab: the same view opens with the same record in the drawer. Press Escape, then use the arrow keys and Enter on the table: the cursor moves down the rows and Enter opens the record under it."}}])
    })
  })
})
