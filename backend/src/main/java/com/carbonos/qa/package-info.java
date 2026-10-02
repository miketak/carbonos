/**
 * The QA hooks of a local stack (plan 2026-10-02, QA scenario DSL): the rule
 * catalogue, a reset that brings the deployment back to the migrations and
 * the seeded administrator, and a digest of the database's state. Every
 * endpoint lives under {@code /api/qa/**}, which the security filter reserves
 * for the ADMIN platform role, and the whole module exists only when
 * {@code carbonos.qa.endpoints=true} (the local profile and the tests, never
 * Railway). It depends on the public APIs of {@code user} (the initial
 * administrator), {@code media} (the object store) and {@code shared} (the
 * rules), and on no business module's internals.
 */
package com.carbonos.qa;
