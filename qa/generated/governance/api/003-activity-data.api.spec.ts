// generated from qa/packs/governance/003-activity-data.yaml (sha256 2360e6f20f61aeeb7fe63b8db4c84d73081435be770d46b54b5f8ad72a30332a); edit the YAML, then `make qa-compile`
import { procedure, test } from '../../../src/runtime/api/index.ts'

const P = procedure("governance", 3, "2360e6f20f61aeeb7fe63b8db4c84d73081435be770d46b54b5f8ad72a30332a")

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
      await s.expect(undefined, [{"outcome":"importTemplateHeader","args":{"organization":"Adansi Foods Ltd","header":"facility,emission_source,activity_type,quantity,unit,period_start,period_end,data_source,supplier,evidence_ref,data_quality,data_quality_tier,uncertainty_percent,note"}}])
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
      await s.expect(out, [{"outcome":"activityExists","args":{"organization":"Adansi Foods Ltd","record":"ACT-0009","evidenceRef":"WB-2025-11","issues":["NO_STREAM","EVIDENCE_REFERENCE_ONLY"]}},{"outcome":"attentionCount","args":{"organization":"Adansi Foods Ltd","count":7},"why":"\"Needs evidence\" goes and the drawer reads \"Reference WB-2025-11, nothing attached\"; the emission source is still missing, and a record leaves the count only when every item on it is resolved"}])
    })
    await test.step("3.C1.4", async () => {
      const s = P.step("3.C1.4")
      const out = await s.do("resolveAttention", {"organization":"Adansi Foods Ltd"})
      await s.expect(out, [{"outcome":"attentionListed","args":{"organization":"Adansi Foods Ltd","count":7},"why":"the register lists exactly the seven after the correction, with the tab in the address; a stale list of ten was seen once in the walkthrough of 2026-09-24 (P3 C1.2)"}])
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

  test("J1. A name the facility lacks is decided in the preview", async () => {
    await test.step("3.J1.1", async () => {
      const s = P.step("3.J1.1")
      const out = await s.do("previewImport", {"organization":"Adansi Foods Ltd","file":"adansi-2025-new-sources.csv"})
      await s.expect(out, [{"outcome":"importUnknownSources","args":{"sources":[{"name":"Boiler LPG 2","facility":"Kumasi Plant","candidates":["Boiler LPG"]},{"name":"Chiller units","facility":"Kumasi Plant","candidates":[]}]},"why":"nothing is rejected and nothing is matched silently; \"Boiler LPG 2\" is a near miss of Boiler LPG, so it is offered; \"Chiller units\" is near nothing; the third row names no source and waits on nothing"}])
    })
    await test.step("3.J1.2", async () => {
      const s = P.step("3.J1.2")
      const out = await s.do("decideImport", {"organization":"Adansi Foods Ltd","file":"adansi-2025-new-sources.csv","decisions":[{"name":"Boiler LPG 2","facility":"Kumasi Plant","use":"Boiler LPG"},{"name":"Chiller units","facility":"Kumasi Plant","create":{"kind":"FUGITIVE","fuel":"R-410A"}}]})
      await s.expect(out, [{"outcome":"importResolved","args":{"recordsToAdd":3},"why":"a suggested near name needs no reason; a name near nothing is created without one"}])
    })
    await test.step("3.J1.3", async () => {
      const s = P.step("3.J1.3")
      const out = await s.do("importDecided", {"organization":"Adansi Foods Ltd","file":"adansi-2025-new-sources.csv","decisions":[{"name":"Boiler LPG 2","facility":"Kumasi Plant","use":"Boiler LPG"},{"name":"Chiller units","facility":"Kumasi Plant","create":{"kind":"FUGITIVE","fuel":"R-410A"}}]})
      await s.expect(out, [{"outcome":"screenReads","args":{"text":"3 records imported. 1 emission source added during import."}},{"outcome":"activityCount","args":{"organization":"Adansi Foods Ltd","count":13}},{"outcome":"activityHasSource","args":{"organization":"Adansi Foods Ltd","record":"ACT-0014","source":"Boiler LPG"}},{"outcome":"activityHasSource","args":{"organization":"Adansi Foods Ltd","record":"ACT-0015","source":"Chiller units"}},{"outcome":"streamListed","args":{"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","name":"Chiller units","kind":"FUGITIVE","origin":"IMPORT"}},{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"IMPORT_SOURCE_MAPPED","detail":"'Boiler LPG 2' in row 2 of adansi-2025-new-sources.csv mapped to 'Boiler LPG'"}},{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"STREAM_ADDED","detail":"Chiller units added at Kumasi Plant: fugitive, during import of adansi-2025-new-sources.csv"},"why":"the mapping and the creation each leave a row a verifier reads without opening the file; the created source is marked \"added during import\" on the facility's Emission sources page"}])
    })
  })

  test("J2. One source for several records, one reason, one act", async () => {
    await test.step("3.J2.1", async () => {
      const s = P.step("3.J2.1")
      const out = await s.do("assignSourceToActivities", {"organization":"Adansi Foods Ltd","records":["ACT-0016"],"source":"Chiller units","reason":"The chillers draw from the plant meter"})
      await s.expect(out, [{"outcome":"activityHistoryHas","args":{"organization":"Adansi Foods Ltd","record":"ACT-0016","kind":"CORRECTED","field":"stream","after":"Chiller units","reason":"The chillers draw from the plant meter"}},{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"RECORDS_BULK_CORRECTED","detail":"Emission source 'Chiller units' assigned to 1 record (ACT-0016): The chillers draw from the plant meter"},"why":"the record's history reads as a single correction; the organization's history names the act once"}])
    })
    await test.step("3.J2.2", async () => {
      const s = P.step("3.J2.2")
      await s.expect(undefined, [{"outcome":"observe","args":{"text":"Tick ACT-0001 (which has a source) together with ACT-0016: **Assign emission source** is disabled with \"Select records at one facility with no emission source.\" The act fills a gap; it never moves a record from one source to another, because the source sets the default scope. A move is a correction of the one record, with its own reason."}}])
    })
    await test.step("3.J2.3", async () => {
      const s = P.step("3.J2.3")
      const out = await s.do("removeActivities", {"organization":"Adansi Foods Ltd","records":["ACT-0014","ACT-0015","ACT-0016"],"reason":"Scratch rows for the unknown-source case"})
      await s.expect(out, [{"outcome":"activityCount","args":{"organization":"Adansi Foods Ltd","count":10}},{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"RECORDS_BULK_CORRECTED","detail":"3 records removed (ACT-0014, ACT-0015, ACT-0016): Scratch rows for the unknown-source case"},"why":"the three go under one reason in one request; the register is back to the ten records procedure 4 works on"}])
    })
    await test.step("3.J2.4", async () => {
      const s = P.step("3.J2.4")
      const out = await s.do("removeStream", {"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","name":"Chiller units"})
      await s.expect(out, [{"outcome":"streamAbsent","args":{"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","name":"Chiller units"},"why":"with its records removed the source can go; Kumasi Plant is back to the two sources procedure 2 gave it, and the history keeps the import, the mapping and the removals"}])
    })
  })

  test("K1. A month with nothing to report is a fact", async () => {
    await test.step("3.K1.1", async () => {
      const s = P.step("3.K1.1").as("ama")
      await s.expect(undefined, [{"outcome":"observe","args":{"text":"Click **+ Add activity**, choose Kumasi Plant and Boiler LPG, type 0 as the quantity: the field reads \"A zero needs a note: what showed that nothing was consumed. A meter or log reading is measured; 'the site said so' is estimated.\" and **Notes** reads \"Required for a zero\". Click **Save** with the note empty: \"A zero needs a note of at least 10 characters: what showed that nothing was consumed.\" prints under **Context for the reviewer** and nothing is saved."}}])
    })
    await test.step("3.K1.2", async () => {
      const s = P.step("3.K1.2")
      const out = await s.do("addActivity", {"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","source":"Boiler LPG","activityType":"Boiler LPG, February","quantity":0,"unit":"litre","periodStart":"2025-02-01","periodEnd":"2025-02-28","dataSource":"Gas supplier delivery note","evidenceRef":"LPG-2025-02","supplier":"Ghana Gas","note":"Boiler off for relining; no delivery in February"})
      await s.expect(out, [{"outcome":"activityExists","args":{"organization":"Adansi Foods Ltd","record":"ACT-0017","quantity":0,"unit":"litre","issues":["DOCUMENTED_ZERO","EVIDENCE_REFERENCE_ONLY"],"supplier":"Ghana Gas"},"why":"a zero with its note, a data source and a reference is Ready and labelled \"documented zero\"; the supplier is who billed it, the data source what showed the figure"}])
    })
    await test.step("3.K1.3", async () => {
      const s = P.step("3.K1.3")
      const out = await s.do("removeActivity", {"organization":"Adansi Foods Ltd","record":"ACT-0017","reason":"Scratch record for the documented-zero case"})
      await s.expect(out, [{"outcome":"activityCount","args":{"organization":"Adansi Foods Ltd","count":10}}])
    })
  })

  test("K2. The monthly template", async () => {
    await test.step("3.K2.1", async () => {
      const s = P.step("3.K2.1").as("ama")
      await s.expect(undefined, [{"outcome":"monthlyTemplateRows","args":{"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","month":"2025-09","sources":["Boiler LPG","Plant grid supply"]},"why":"a source that ran nothing is recorded as 0 with a note and its reading, not deleted; data quality is left blank because a zero typed from memory is an estimate"}])
    })
  })

  test("L1. A change of kind on a source with records needs a reason, and the records keep theirs", async () => {
    await test.step("3.L1.1", async () => {
      const s = P.step("3.L1.1")
      const out = await s.do("editStream", {"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","name":"Boiler LPG","kind":"MOBILE_COMBUSTION"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.stream.reclassify-reason-required","with":{"name":"Boiler LPG"}},"why":"the kind and the operator are the source's operational-boundary decision (Corporate Standard chapter 4); with records filed under it, the change is documented or not made"}])
    })
    await test.step("3.L1.2", async () => {
      const s = P.step("3.L1.2")
      const out = await s.do("editStream", {"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","name":"Boiler LPG","kind":"MOBILE_COMBUSTION","reason":"moved"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ghg.stream.reclassify-reason-required","with":{"name":"Boiler LPG"}},"why":"five characters say nothing a verifier can read"}])
    })
    await test.step("3.L1.3", async () => {
      const s = P.step("3.L1.3")
      const out = await s.do("editStream", {"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","name":"Boiler LPG","kind":"MOBILE_COMBUSTION","reason":"boiler skid moved onto a trailer and towed between the two plant halls since June"})
      await s.expect(out, [{"outcome":"streamListed","args":{"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","name":"Boiler LPG","kind":"MOBILE_COMBUSTION"}},{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"STREAM_EDITED","detail":"Boiler LPG at Kumasi Plant: kind stationary combustion → mobile combustion; reason: boiler skid moved onto a trailer and towed between the two plant halls since June","actor":"ama"},"why":"the row carries the reason; the records already filed keep the scope and category they were classified under, and only new records take the new default"}])
    })
    await test.step("3.L1.4", async () => {
      const s = P.step("3.L1.4")
      const out = await s.do("editStream", {"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","name":"Boiler LPG","fuel":"LPG (bulk)"})
      await s.expect(out, [{"outcome":"historyHas","args":{"organization":"Adansi Foods Ltd","action":"STREAM_EDITED","detail":"Boiler LPG at Kumasi Plant: fuel LPG → LPG (bulk)"},"why":"a fuel change asks no reason; filed records keep the factor they were classified with"}])
    })
    await test.step("3.L1.5", async () => {
      const s = P.step("3.L1.5")
      const out = await s.do("editStream", {"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","name":"Boiler LPG","kind":"STATIONARY_COMBUSTION","fuel":"LPG","reason":"walkthrough: the skid is back on its slab; procedures 4 to 8 expect the boiler as stationary combustion"})
      await s.expect(out, [{"outcome":"streamListed","args":{"organization":"Adansi Foods Ltd","facility":"Kumasi Plant","name":"Boiler LPG","kind":"STATIONARY_COMBUSTION"},"why":"the later procedures classify the boiler's records under the stationary default, so the source goes back as it was, with a reason of its own"}])
    })
  })
})
