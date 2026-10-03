ALTER TABLE "User"
ADD COLUMN "participationOptOut" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET "participationOptOut" = true
WHERE "deactivationReason" IS NOT NULL
	OR "deactivationReasonRequestedAt" IS NOT NULL;