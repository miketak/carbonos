// generated from qa/packs/governance/001-accounts-and-the-platform.yaml (sha256 9f4b41e20384ccb199d24f311cebcf62b5e97006857b04905dc984f139accfa6); edit the YAML, then `make qa-compile`
import { procedure, test } from '../../../src/runtime/ui/index.ts'

const P = procedure("governance", 1, "9f4b41e20384ccb199d24f311cebcf62b5e97006857b04905dc984f139accfa6")

test.describe.configure({ mode: 'serial' })
test.describe("Procedure 1: Accounts and the platform", () => {
  test.beforeAll(async () => P.start())
  test.afterAll(async () => P.finish())

  test("A1. At the start, no organization exists", async () => {
    await test.step("1.A1.1", async () => {
      const s = P.step("1.A1.1").as("adminA")
      const out = await s.do("signIn", {"user":"adminA"})
      await s.expect(out, [{"outcome":"platformSummary","args":{"organizations":0,"publishedEditions":3,"openNotices":0}},{"outcome":"accessRequestsPending","args":{"count":0}}])
      await s.capture({"usersAtStart":"userCount"})
    })
    await test.step("1.A1.2", async () => {
      const s = P.step("1.A1.2")
      await s.expect(undefined, [{"outcome":"userListed","args":{"user":"adminA","role":"ADMIN","status":"ACTIVE"}}])
    })
  })

  test("B1. The password rule holds on the administrator's form", async () => {
    await test.step("1.B1.1", async () => {
      const s = P.step("1.B1.1")
      const out = await s.do("createUser", {"user":"adminB","password":"short1"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"user.password.weak"}},{"outcome":"userAbsent","args":{"user":"adminB"}}])
    })
    await test.step("1.B1.2", async () => {
      const s = P.step("1.B1.2")
      const out = await s.do("createUser", {"user":"adminB"})
      s.done()
    })
  })

  test("B2. Three member accounts, and a duplicate is refused", async () => {
    await test.step("1.B2.1", async () => {
      const s = P.step("1.B2.1")
      const out = await s.do("createUser", {"user":"kofi"})
      s.done()
    })
    await test.step("1.B2.2", async () => {
      const s = P.step("1.B2.2")
      const out = await s.do("createUser", {"user":"esi"})
      s.done()
    })
    await test.step("1.B2.3", async () => {
      const s = P.step("1.B2.3")
      const out = await s.do("createUser", {"user":"yaw"})
      await s.expect(out, [{"outcome":"userCount","args":{"since":"usersAtStart","added":4}}])
    })
    await test.step("1.B2.4", async () => {
      const s = P.step("1.B2.4")
      const out = await s.do("createUser", {"user":"kofi"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"user.email.duplicate","with":{"email":"{email:kofi}"}}},{"outcome":"userCount","args":{"since":"usersAtStart","added":4},"why":"an administrator may learn that an account exists, a visitor may not (case C1 says less on purpose)"}])
    })
    await test.step("1.B2.5", async () => {
      const s = P.step("1.B2.5")
      await s.expect(undefined, [{"outcome":"accessRequestsPending","args":{"count":0}},{"outcome":"userCount","args":{"since":"usersAtStart","added":4}}])
    })
  })

  test("C1. A visitor requests access, once", async () => {
    await test.step("1.C1.1", async () => {
      const s = P.step("1.C1.1").as("visitor")
      const out = await s.do("requestAccess", {"user":"ama","company":"Adansi Foods Ltd"})
      s.done()
    })
    await test.step("1.C1.2", async () => {
      const s = P.step("1.C1.2")
      const out = await s.do("requestAccess", {"user":"ama","company":"Adansi Foods Ltd"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"access-request.duplicate","with":{"email":"{email:ama}"}}}])
    })
    await test.step("1.C1.3", async () => {
      const s = P.step("1.C1.3")
      const out = await s.do("requestAccess", {"user":"kofi"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"access-request.duplicate","with":{"email":"{email:kofi}"}},"why":"the message does not say whether the address holds an account or a request"}])
    })
    await test.step("1.C1.4", async () => {
      const s = P.step("1.C1.4")
      const out = await s.do("signIn", {"user":"ama","password":"{wrong}"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"user.credentials.invalid"},"why":"a request is not an account"}])
    })
  })

  test("C2. The administrator approves", async () => {
    await test.step("1.C2.1", async () => {
      const s = P.step("1.C2.1").as("adminA")
      await s.expect(undefined, [{"outcome":"accessRequestsPending","args":{"count":1}}])
    })
    await test.step("1.C2.2", async () => {
      const s = P.step("1.C2.2")
      const out = await s.do("approveAccessRequest", {"user":"ama"})
      s.done()
    })
    await test.step("1.C2.3", async () => {
      const s = P.step("1.C2.3")
      await s.expect(undefined, [{"outcome":"userListed","args":{"user":"ama","status":"PENDING"}}])
    })
    await test.step("1.C2.4", async () => {
      const s = P.step("1.C2.4")
      await s.expect(undefined, [{"outcome":"emailReceived","args":{"to":"ama","subject":"Your CarbonOS access is approved","linkTo":"/set-password"},"why":"on this environment's address, never localhost or production"}])
    })
  })

  test("C3. The link sets the password once", async () => {
    await test.step("1.C3.1", async () => {
      const s = P.step("1.C3.1").as("ama")
      const out = await s.do("setPasswordFromLink", {"user":"ama","password":"Ama-pass"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"user.password.weak"},"why":"too short"}])
    })
    await test.step("1.C3.2", async () => {
      const s = P.step("1.C3.2")
      const out = await s.do("setPasswordFromLink", {"user":"ama","password":"twelvelettersx"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"user.password.weak"},"why":"no digit"}])
    })
    await test.step("1.C3.3", async () => {
      const s = P.step("1.C3.3")
      const out = await s.do("setPasswordFromLink", {"user":"ama"})
      await s.expect(out, [{"outcome":"organizationCount","args":{"user":"ama","count":0}},{"outcome":"canCreateOrganization","args":{"user":"ama","value":true}}])
    })
    await test.step("1.C3.4", async () => {
      const s = P.step("1.C3.4")
      const out = await s.do("openSetupLink", {"user":"ama"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"access-request.setup-link.invalid"},"why":"with a way back to the landing page"}])
    })
    await test.step("1.C3.5", async () => {
      const s = P.step("1.C3.5")
      const out = await s.do("openSetupLink", {"user":"ama","link":"forged"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"access-request.setup-link.invalid"},"why":"a forged token is not told apart from a used one"}])
    })
    await test.step("1.C3.6", async () => {
      const s = P.step("1.C3.6").as("adminA")
      await s.expect(undefined, [{"outcome":"userListed","args":{"user":"ama","status":"ACTIVE"}},{"outcome":"userCount","args":{"since":"usersAtStart","added":5}}])
    })
  })

  test("D1. A setting needs a value in range, a change and a reason", async () => {
    await test.step("1.D1.1", async () => {
      const s = P.step("1.D1.1").as("adminA")
      await s.expect(undefined, [{"outcome":"settings","args":{"supportAccessWindowHours":24,"organizationCreation":"EVERYONE","editionsInPublishedPeriods":"BLOCKED"}}])
    })
    await test.step("1.D1.2", async () => {
      const s = P.step("1.D1.2")
      const out = await s.do("changeSettings", {"supportAccessWindowHours":0,"reason":"Governance pack: a window of zero"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"platform.support-window.range","with":{"min":"1","max":"72"}}}])
    })
    await test.step("1.D1.3", async () => {
      const s = P.step("1.D1.3")
      const out = await s.do("changeSettings", {"supportAccessWindowHours":100,"reason":"Governance pack: a window of a hundred"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"platform.support-window.range","with":{"min":"1","max":"72"}}}])
    })
    await test.step("1.D1.4", async () => {
      const s = P.step("1.D1.4")
      const out = await s.do("changeSettings", {"supportAccessWindowHours":24,"reason":"Governance pack: the same value again"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"platform.nothing-changed"}}])
    })
    await test.step("1.D1.5", async () => {
      const s = P.step("1.D1.5")
      const out = await s.do("changeSettings", {"supportAccessWindowHours":2,"reason":"short"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"platform.reason-too-short","with":{"min":"10"}}}])
    })
    await test.step("1.D1.6", async () => {
      const s = P.step("1.D1.6")
      const out = await s.do("changeSettings", {"supportAccessWindowHours":2,"reason":"Governance pack: a shorter support window"})
      await s.expect(out, [{"outcome":"settingHistoryHas","args":{"setting":"supportAccessWindowHours","from":24,"to":2,"reason":"Governance pack: a shorter support window","actor":"adminA"}}])
    })
    await test.step("1.D1.7", async () => {
      const s = P.step("1.D1.7")
      await s.expect(undefined, [{"outcome":"supportAccessWindow","args":{"hours":2}}])
    })
  })

  test("D2. Reserving organization creation takes effect at once", async () => {
    await test.step("1.D2.1", async () => {
      const s = P.step("1.D2.1")
      const out = await s.do("changeSettings", {"organizationCreation":"ADMINISTRATORS","reason":"Governance pack: creation reserved"})
      await s.expect(out, [{"outcome":"settingHistoryHas","args":{"setting":"organizationCreation","from":"EVERYONE","to":"ADMINISTRATORS","reason":"Governance pack: creation reserved"}}])
    })
    await test.step("1.D2.2", async () => {
      const s = P.step("1.D2.2").as("ama")
      await s.expect(undefined, [{"outcome":"canCreateOrganization","args":{"user":"ama","value":false}}])
    })
    await test.step("1.D2.3", async () => {
      const s = P.step("1.D2.3").as("adminA")
      const out = await s.do("changeSettings", {"organizationCreation":"EVERYONE","reason":"Governance pack: creation opened again"})
      s.done()
    })
    await test.step("1.D2.4", async () => {
      const s = P.step("1.D2.4")
      const out = await s.do("changeSettings", {"supportAccessWindowHours":24,"reason":"Governance pack: the window restored"})
      await s.expect(out, [{"outcome":"settingHistoryCount","args":{"count":4}}])
    })
    await test.step("1.D2.5", async () => {
      const s = P.step("1.D2.5").as("ama")
      await s.expect(undefined, [{"outcome":"canCreateOrganization","args":{"user":"ama","value":true},"why":"leave it, procedure 2 creates the organization"}])
    })
  })

  test("D3. The third setting is recorded like the others", async () => {
    await test.step("1.D3.1", async () => {
      const s = P.step("1.D3.1").as("adminA")
      await s.expect(undefined, [{"outcome":"settings","args":{"editionsInPublishedPeriods":"BLOCKED"},"why":"the hint says published runs keep the factors they reported with either way, and that frozen and final periods always block"}])
    })
    await test.step("1.D3.2", async () => {
      const s = P.step("1.D3.2")
      const out = await s.do("changeSettings", {"editionsInPublishedPeriods":"ALLOWED","reason":"Governance pack: reading the third setting"})
      await s.expect(out, [{"outcome":"settingHistoryHas","args":{"setting":"editionsInPublishedPeriods","from":"BLOCKED","to":"ALLOWED","reason":"Governance pack: reading the third setting"}}])
    })
    await test.step("1.D3.3", async () => {
      const s = P.step("1.D3.3")
      const out = await s.do("changeSettings", {"editionsInPublishedPeriods":"BLOCKED","reason":"Governance pack: the default again"})
      await s.expect(out, [{"outcome":"settingHistoryCount","args":{"count":6}}])
    })
  })

  test("E1. Self-demotion, self-disabling and self-deletion are refused", async () => {
    await test.step("1.E1.1", async () => {
      const s = P.step("1.E1.1").as("adminB")
      const out = await s.do("signIn", {"user":"adminB"})
      s.done()
    })
    await test.step("1.E1.2", async () => {
      const s = P.step("1.E1.2")
      const out = await s.do("changeUserRole", {"user":"adminB","role":"MEMBER"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"user.self.demote-or-disable"}}])
    })
    await test.step("1.E1.3", async () => {
      const s = P.step("1.E1.3")
      const out = await s.do("disableUser", {"user":"adminB"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"user.self.demote-or-disable"}}])
    })
    await test.step("1.E1.4", async () => {
      const s = P.step("1.E1.4")
      const out = await s.do("deleteUser", {"user":"adminB"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"user.self.delete"}}])
    })
    await test.step("1.E1.5", async () => {
      const s = P.step("1.E1.5")
      const out = await s.do("signOut", {"user":"adminB"})
      s.done()
    })
  })

  test("E2. A disabled account cannot sign in, and is re-enabled", async () => {
    await test.step("1.E2.1", async () => {
      const s = P.step("1.E2.1").as("adminA")
      const out = await s.do("disableUser", {"user":"yaw"})
      s.done()
    })
    await test.step("1.E2.2", async () => {
      const s = P.step("1.E2.2").as("yaw")
      const out = await s.do("signIn", {"user":"yaw"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"user.credentials.invalid"}}])
    })
    await test.step("1.E2.3", async () => {
      const s = P.step("1.E2.3").as("adminA")
      const out = await s.do("enableUser", {"user":"yaw"})
      s.done()
    })
    await test.step("1.E2.4", async () => {
      const s = P.step("1.E2.4").as("yaw")
      const out = await s.do("signIn", {"user":"yaw"})
      await s.expect(out, [{"outcome":"organizationCount","args":{"user":"yaw","count":0}}])
    })
    await test.step("1.E2.5", async () => {
      const s = P.step("1.E2.5")
      const out = await s.do("signOut", {"user":"yaw"})
      s.done()
    })
  })

  test("F1. The menu carries the profile, and the administrator's entry", async () => {
    await test.step("1.F1.1", async () => {
      const s = P.step("1.F1.1").as("ama")
      await s.expect(undefined, [{"outcome":"platformRole","args":{"user":"ama","role":"MEMBER"}}])
    })
    await test.step("1.F1.2", async () => {
      const s = P.step("1.F1.2")
      const out = await s.do("renameProfile", {"user":"ama","displayName":"Ama Owusu (Owner)"})
      s.done()
    })
    await test.step("1.F1.3", async () => {
      const s = P.step("1.F1.3")
      const out = await s.do("renameProfile", {"user":"ama","displayName":"Ama Owusu"})
      s.done()
    })
    await test.step("1.F1.4", async () => {
      const s = P.step("1.F1.4").as("adminA")
      await s.expect(undefined, [{"outcome":"platformRole","args":{"user":"adminA","role":"ADMIN"},"why":"inside the administration area the entry is absent, the sidebar is the navigation there"}])
    })
    await test.step("1.F1.5", async () => {
      const s = P.step("1.F1.5").as("ama")
      await s.expect(undefined, [{"outcome":"platformAccess","args":{"user":"ama","value":false}}])
    })
  })

  test("G1. A member changes their password on the profile", async () => {
    await test.step("1.G1.1", async () => {
      const s = P.step("1.G1.1").as("yaw")
      const out = await s.do("signIn", {"user":"yaw"})
      s.done()
    })
    await test.step("1.G1.2", async () => {
      const s = P.step("1.G1.2").as("yawSecond")
      const out = await s.do("signIn", {"user":"yawSecond"})
      s.done()
    })
    await test.step("1.G1.3", async () => {
      const s = P.step("1.G1.3")
      const out = await s.do("changePassword", {"user":"yawSecond","current":"{wrong}","new":"Yaw-pass-2027"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"user.password.current-wrong"}}])
    })
    await test.step("1.G1.4", async () => {
      const s = P.step("1.G1.4")
      const out = await s.do("changePassword", {"user":"yawSecond","new":"Yaw-pass-2026"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"user.password.same"}}])
    })
    await test.step("1.G1.5", async () => {
      const s = P.step("1.G1.5")
      const out = await s.do("changePassword", {"user":"yawSecond","new":"Yaw-pass-2027"})
      s.done()
    })
    await test.step("1.G1.6", async () => {
      const s = P.step("1.G1.6").as("yaw")
      await s.expect(undefined, [{"outcome":"sessionEnded","args":{"user":"yaw"},"why":"that session ended with the change"}])
    })
  })

  test("G2. A forgotten password is reset by email", async () => {
    await test.step("1.G2.1", async () => {
      const s = P.step("1.G2.1").as("visitor")
      const out = await s.do("requestPasswordReset", {"email":"nobody@example.test"})
      await s.expect(out, [{"outcome":"noEmail","args":{"to":"nobody@example.test","subject":"Reset your CarbonOS password"}}])
    })
    await test.step("1.G2.2", async () => {
      const s = P.step("1.G2.2")
      const out = await s.do("requestPasswordReset", {"user":"yaw"})
      await s.expect(out, [{"outcome":"emailReceived","args":{"to":"yaw","subject":"Reset your CarbonOS password","containing":"Somebody, probably you, asked to reset your password","linkTo":"/reset-password"},"why":"both answers on the page read the same, and do not say which address holds an account"}])
    })
    await test.step("1.G2.3", async () => {
      const s = P.step("1.G2.3")
      const out = await s.do("resetPasswordFromLink", {"user":"yaw","password":"Yaw-pass-2026","confirm":"Yaw-pass-2025"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"ui.password-confirmation-mismatch"}}])
    })
    await test.step("1.G2.4", async () => {
      const s = P.step("1.G2.4")
      const out = await s.do("resetPasswordFromLink", {"user":"yaw","password":"Yaw-pass-2026"})
      s.done()
    })
    await test.step("1.G2.5", async () => {
      const s = P.step("1.G2.5")
      const out = await s.do("signIn", {"user":"yaw","password":"Yaw-pass-2027"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"user.credentials.invalid"}}])
    })
    await test.step("1.G2.6", async () => {
      const s = P.step("1.G2.6")
      const out = await s.do("signIn", {"user":"yaw"})
      s.done()
    })
    await test.step("1.G2.7", async () => {
      const s = P.step("1.G2.7")
      const out = await s.do("openResetLink", {"user":"yaw"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"password-reset.link.used"}}])
    })
    await test.step("1.G2.8", async () => {
      const s = P.step("1.G2.8")
      const out = await s.do("openResetLink", {"user":"yaw","link":"forged"})
      await s.expect(out, [{"outcome":"refused","args":{"rule":"password-reset.link.invalid"}}])
    })
  })

  test("G3. An administrator sends a reset link", async () => {
    await test.step("1.G3.1", async () => {
      const s = P.step("1.G3.1").as("adminA")
      const out = await s.do("sendResetLink", {"user":"esi"})
      s.done()
    })
    await test.step("1.G3.2", async () => {
      const s = P.step("1.G3.2").as("esi")
      const out = await s.do("signIn", {"user":"esi"})
      s.done()
    })
    await test.step("1.G3.3", async () => {
      const s = P.step("1.G3.3")
      const out = await s.do("signOut", {"user":"esi"})
      s.done()
    })
  })
})
