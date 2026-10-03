ALTER TABLE "User"
ADD COLUMN "deactivationReason" TEXT,
ADD COLUMN "deactivationReasonRequestedAt" TIMESTAMP(3);