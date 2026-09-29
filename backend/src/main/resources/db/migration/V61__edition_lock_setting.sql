-- Spec 02.6 rule 1, amended 2026-09-29 (owner-approved), and spec 01.5: a
-- platform setting for whether a factor pack edition may be imported or
-- accepted when its applies-from date falls inside a PUBLISHED period.
--
-- Until now it never could. A frozen or final period can be reopened, but a
-- published one cannot, so an edition applying inside a published period was
-- refused for that organization forever. A published run is a snapshot: its
-- lines and its factor table hold the values it applied (ghg_run_lines,
-- ghg_run_factors), and its report is stored as it read at publication
-- (ghg_inventories.published_report). Cutting a version afterwards moves neither.
--
-- BLOCKED keeps today's behaviour and is the default, so a deployment that
-- upgrades and never opens the settings page behaves identically. ALLOWED
-- stops a PUBLISHED period (superseded or not) from blocking; FROZEN and
-- FINAL periods still block under both values.
--
-- A typed column with a CHECK, like the two settings V48 created; a change is
-- recorded in platform_setting_changes with its reason, as theirs are.
ALTER TABLE platform_settings
    ADD COLUMN editions_in_published_periods varchar(20) NOT NULL DEFAULT 'BLOCKED';

ALTER TABLE platform_settings
    ADD CONSTRAINT chk_platform_settings_editions_in_published_periods
        CHECK (editions_in_published_periods IN ('BLOCKED', 'ALLOWED'));
