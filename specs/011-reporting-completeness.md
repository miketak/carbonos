# 011: Reporting completeness

- **Status**: Draft
- **Owner**: Michael Takrama
- **Created**: 2026-09-02 (from the GHG Protocol conformance review of spec 003)
- **Backend module(s)**: `ghg`
- **Frontend feature(s)**: `src/features/ghg`
- **Relates to**: [spec 003](003-inventory-accounting-model.md),
  [spec 007](007-boundary-freeze-and-versioning.md)

## Problem / Motivation

A run report today shows one CO2e figure per scope. Chapter 9 of the GHG
Protocol Corporate Standard requires emissions for each of the seven gases
separately, biogenic CO2 separately from the scopes, the organizational
boundary and approach, the operational boundary (which scope 3 categories are
covered), the base year and recalculation policy, methodologies, and every
exclusion with justification. The Scope 2 Guidance (2015) requires both a
location-based and a market-based scope 2 figure where contractual instruments
exist.

## Behaviour

- Emission factors carry per-gas components and a GWP set; run lines carry
  per-gas kg alongside CO2e; biogenic CO2 is reported outside the scopes.
- An inventory declares its **operational boundary**: the scope 3 categories it
  covers and why others are excluded.
- Scope 2 is calculated and shown both location-based and market-based when a
  market-based factor (contract, certificate, supplier) is recorded.
- The run report renders every Chapter 9 element in one page, in order.

## API contract

Sketch: the factor library gains a gas breakdown and `gwpSet`; inventory gains
`operationalBoundary`; run gains per-gas totals and `scope2MarketBased`.

## Data

Factor and line columns; `ghg_inventories.operational_boundary`.

## Events

None.

## Non-goals

PDF export; assurance statements.

## Open questions

Which GWP set (AR5 or AR6) the seeded library adopts by default.
