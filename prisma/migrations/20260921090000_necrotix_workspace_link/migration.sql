ALTER TABLE "ServiceRequest"
ADD COLUMN "workspaceProjectId" TEXT,
ADD COLUMN "workspaceProjectKey" TEXT,
ADD COLUMN "workspacePortalUrl" TEXT,
ADD COLUMN "workspaceSyncedAt" TIMESTAMP(3),
ADD COLUMN "workspaceLastError" TEXT;

CREATE UNIQUE INDEX "ServiceRequest_workspaceProjectId_key" ON "ServiceRequest"("workspaceProjectId");
