import { describe, expect, it } from 'vitest'
import type { RunResults } from '../runtime/shared/results.ts'
import { stateDigest } from './record.ts'

const results = (digest: Record<string, number>): RunResults =>
  ({ yamlSha256: 'y', steps: [], digestSha256: 'server', digest }) as unknown as RunResults

describe('the record digest', () => {
  it('compares the product state and leaves the audit trail out', () => {
    const a = stateDigest(results({ ghg_activity_records: 10, ghg_audit_events: 34 }))
    const b = stateDigest(results({ ghg_audit_events: 40, ghg_activity_records: 10 }))
    expect(a).toBe(b)
    expect(stateDigest(results({ ghg_activity_records: 11, ghg_audit_events: 34 }))).not.toBe(a)
  })

  it('falls back to the server digest when the run carries no counts', () => {
    expect(stateDigest({ yamlSha256: 'y', steps: [], digestSha256: 'server' } as unknown as RunResults)).toBe('server')
  })
})
