CREATE TABLE "SiteHealthLog" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteHealthLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteHealthLog_createdAt_idx" ON "SiteHealthLog"("createdAt");
CREATE INDEX "SiteHealthLog_source_severity_createdAt_idx" ON "SiteHealthLog"("source", "severity", "createdAt");
CREATE INDEX "SiteHealthLog_fingerprint_createdAt_idx" ON "SiteHealthLog"("fingerprint", "createdAt");
