---
status: proposed
date: 2026-10-02
decision-makers: miketak
owner: miketak
last_reviewed: 2026-10-02
---

# 0008: A `qa` module for the local stack's test hooks

## Context and problem statement

The QA drivers (ADR 0007) need three things from the backend that no user
needs: the catalogue of named refusals, a way to bring a running stack back
to what a fresh deployment gets without a restart, and a deterministic
picture of the database to compare two runs. They must exist on a local
stack and in the tests, and never on Railway.

## Considered options

- Test code only (Testcontainers fixtures): does not help a stack a person
  or a driver is using.
- Shell scripts around `docker compose down -v` and a restart: slow, forgets
  the sessions, and a Playwright run cannot call it.
- Endpoints under `/api/qa/**` in a Spring Modulith module, present only
  when `carbonos.qa.endpoints=true`, reserved for the ADMIN platform role.

## Decision outcome

Chosen option: the `qa` module, because it is a module like any other
(`ModularityTests` checks it reaches the business modules only through
their public APIs), it is absent from the context without the property (a
test proves it), and the security filter gates it like `/api/admin/**`.

Rule ids live in `shared/web` (`Rule`, `RuleViolation`, `RuleSource`, the
`web` named interface of the `shared` module). Each module declares its
rules as constants in its root package (`UserRules`, `PlatformRules`) and
its exceptions carry the rule; the problem detail gains the extension
member `rule`. Migration is incremental: an exception not yet named by a
rule keeps its message-only constructor, and throw sites move to a rule as
their procedure is transliterated.

The reset is Flyway `clean` then `migrate` (the auto-configured Flyway
refuses `clean`; a copy of its configuration allows it), the object store
emptied through `MediaStorage.deleteAll()`, every session expired through
the `SessionRegistry`, and the seeded administrator created again through
the `user` module's public `InitialAdmin`. The digest is the row count of
every table the migrations own, hashed.

### Consequences

- Good: a driver resets a stack in a second and keeps the backend running;
  the catalogue is pulled by `make qa-rules` and compared by `qa doctor`;
  two drivers prove they left the same state.
- Bad: the DTOs no longer pre-empt `PasswordPolicy` with `@Size(min = 12)`,
  so a weak password is refused by the policy check (same message, now with
  a rule id); a controller must throw the rule under the form's own field
  name. A controllable clock and `/api/version` are still to come.
