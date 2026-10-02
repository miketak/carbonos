import { describe, expect, it } from 'vitest'
import type { Pack, Procedure } from '../model.ts'
import { narrateStep, narrationContext, renderProcedure, wordsFor } from './render.ts'
import { compileProcedure } from '../compile/compile.ts'

const pack: Pack = {
  persona: 'synthetic',
  title: 'Synthetic',
  mailbox: { local: 'qa', domain: 'example.test' },
  actors: {
    admin: { name: 'Admin', alias: 'admin', password: 'Admin-pass-2026', platformRole: 'ADMIN', seeded: true, window: 'normal' },
    kofi: { name: 'Kofi Mensah', alias: 'kofi', password: 'Kofi-pass-2026', platformRole: 'MEMBER', window: 'private' },
  },
}

const procedure: Procedure = {
  procedure: 9,
  slug: 'synthetic',
  title: 'Synthetic',
  covers: ['01'],
  let: {},
  file: 'qa/packs/synthetic/009-synthetic.yaml',
  sha256: 'abc',
  docs: { version: 1, estimatedMinutes: 5, objective: 'Two steps.', prerequisitesText: ['An administrator.'], changeNotes: [] },
  sections: [
    {
      id: 'A',
      title: 'Accounts',
      cases: [
        {
          id: 'A1',
          title: 'A member is created, and a duplicate refused',
          steps: [
            { as: 'admin', do: { verb: 'signIn', args: { user: 'admin' } }, expect: [] },
            { do: { verb: 'createUser', args: { user: 'kofi' } }, expect: [] },
            {
              do: { verb: 'createUser', args: { user: 'kofi' } },
              expect: [{ outcome: 'refused', args: { rule: 'user.email.duplicate', with: { email: '{email:kofi}' } }, why: 'an administrator may learn that an account exists' }],
            },
          ],
        },
      ],
    },
  ],
}

describe('the narrator', () => {
  const n = narrationContext(pack)

  it('prefixes the actor only when it changes and folds postconditions into the expected result', () => {
    const first = narrateStep(pack, n, procedure.sections[0]!.cases[0]!.steps[0]!, undefined)
    expect(first.action).toBe('As Admin in the normal window, sign in as "Admin".')
    expect(first.expected).toBe('Admin is signed in.')
    const second = narrateStep(pack, n, procedure.sections[0]!.cases[0]!.steps[1]!, 'admin')
    expect(second.action).toBe('Click **Add user**. Fill in the Kofi alias, the display name "Kofi Mensah", the role **Member** and the temporary password `Kofi-pass-2026`. Submit.')
    expect(second.expected).toBe('Kofi Mensah is listed as Member, Active.')
  })

  it('quotes the refusal from the catalogue and appends the why', () => {
    const third = narrateStep(pack, n, procedure.sections[0]!.cases[0]!.steps[2]!, 'admin')
    expect(third.expected).toBe(`Refused: "A user with email 'the Kofi alias' already exists.": an administrator may learn that an account exists.`)
  })

  it('resolves tokens into the README\'s words', () => {
    expect(wordsFor(pack, '{email:kofi} and {name:kofi} and {role:kofi}')).toBe('the Kofi alias and "Kofi Mensah" and Member')
  })
})

describe('the exporter', () => {
  it('renders the layout the QA README describes', () => {
    const md = renderProcedure(pack, procedure)
    expect(md).toContain('<!-- generated from qa/packs/synthetic/009-synthetic.yaml by make qa-export; edit the YAML -->')
    expect(md).toContain('# Procedure 9: Synthetic')
    expect(md).toContain('| Step | Action | Expected result | Pass/Fail | Notes |')
    expect(md).toContain('### A1. A member is created, and a duplicate refused')
    expect(md).toContain('## Sign-off')
    expect(md).not.toContain(String.fromCharCode(0x2014))
  })
})

describe('the compiler', () => {
  it('emits one test per case and one step per row, stamped with the YAML hash', () => {
    const spec = compileProcedure('synthetic', procedure, 'api')
    expect(spec).toContain('sha256 abc')
    expect(spec).toContain(`test("A1. A member is created, and a duplicate refused"`)
    expect(spec).toContain(`await test.step("9.A1.3"`)
    expect(spec).toContain(`s.do("createUser", {"user":"kofi"})`)
    expect(spec).toContain(`"outcome":"refused"`)
  })
})
