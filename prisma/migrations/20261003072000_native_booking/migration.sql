ALTER TABLE "BookingReservation" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'CALDIY';
CREATE TABLE "BookingRateLimit" ("key" TEXT NOT NULL, "count" INTEGER NOT NULL DEFAULT 1, "expiresAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "BookingRateLimit_pkey" PRIMARY KEY ("key"));
CREATE INDEX "BookingRateLimit_expiresAt_idx" ON "BookingRateLimit"("expiresAt");
