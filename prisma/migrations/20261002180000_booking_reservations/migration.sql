CREATE TABLE "BookingReservation" (
    "id" TEXT NOT NULL,
    "calUid" TEXT NOT NULL,
    "rescheduledFromUid" TEXT,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "reason" TEXT NOT NULL DEFAULT '',
    "eventAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BookingReservation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BookingReservation_calUid_key" ON "BookingReservation"("calUid");
CREATE INDEX "BookingReservation_status_startTime_idx" ON "BookingReservation"("status", "startTime");
CREATE INDEX "BookingReservation_createdAt_idx" ON "BookingReservation"("createdAt");

CREATE INDEX "BookingReservation_rescheduledFromUid_idx" ON "BookingReservation"("rescheduledFromUid");
