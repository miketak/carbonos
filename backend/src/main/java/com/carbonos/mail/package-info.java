/**
 * Outbound email. Listens to other modules' domain events and turns them into
 * SMTP messages; owns no tables and exposes no public API. Delivery is
 * at-least-once via the Modulith event registry (unsent mails are retried on
 * restart).
 */
package com.carbonos.mail;
