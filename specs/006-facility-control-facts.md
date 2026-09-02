# 006: Facility control facts and boundary prefill

- **Status**: Superseded by [spec 007](007-boundary-freeze-and-versioning.md)
- **Owner**: Michael Takrama
- **Created**: 2026-08-31

Drafted as a standalone fix for two gaps in spec 003's boundary (a single
`controlled` flag on the facility, and boundary treatments that ignored the
facility's facts). Before it shipped, the boundary also gained a lifecycle and
versioning, and the two designs were reconciled and implemented together. The
facility facts, server-side prefill and drift warning now live in spec 007
alongside the freeze and version model, so there is one document for the v1
organizational boundary. The number is retired.
