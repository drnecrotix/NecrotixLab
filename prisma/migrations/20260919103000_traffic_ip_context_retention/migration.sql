ALTER TABLE "TrafficSession"
ADD COLUMN "ipAsn" TEXT,
ADD COLUMN "ipIsp" TEXT,
ADD COLUMN "ipOrganization" TEXT,
ADD COLUMN "ipDomain" TEXT;

ALTER TABLE "TrafficPageEvent"
ADD COLUMN "ipAsn" TEXT,
ADD COLUMN "ipIsp" TEXT,
ADD COLUMN "ipOrganization" TEXT,
ADD COLUMN "ipDomain" TEXT;

CREATE TABLE "TrafficCleanupState" (
    "id" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrafficCleanupState_pkey" PRIMARY KEY ("id")
);
