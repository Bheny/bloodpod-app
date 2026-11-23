-- Every donor can lead a Pod, so the Captain hierarchy (levels, promotions, badge, lapse clock) is removed.
-- Kept: Drill and DrillResponse (Pod readiness) and Pod.parentPodId / spawnedByUserId / lastActivityAt (spin-off Pods).
-- These tables held no rows when this was written.

DROP TABLE "CaptainPromotion";
DROP TABLE "CaptainStatus";
DROP TABLE "CaptainAuditLog";
DROP TYPE "PromotionStatus";

-- The programme's on/off switch is gone too.
DELETE FROM "AppSetting" WHERE "key" = 'captain_programme';
