ALTER TABLE "BookingReservation"
ADD COLUMN "phone" TEXT NOT NULL DEFAULT '',
ADD COLUMN "servicePath" TEXT NOT NULL DEFAULT '',
ADD COLUMN "category" TEXT NOT NULL DEFAULT '',
ADD COLUMN "platform" TEXT NOT NULL DEFAULT 'CALDIY',
ADD COLUMN "meetingUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN "meetingInstructions" TEXT NOT NULL DEFAULT '',
ADD COLUMN "organizerEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN "calendarUid" TEXT NOT NULL DEFAULT '',
ADD COLUMN "calendarSequence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "calendarSelected" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "BookingNotification" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "eventAt" TIMESTAMP(3) NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'UPDATE',
  "recipientRole" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "calendarAttached" BOOLEAN NOT NULL DEFAULT false,
  "fingerprint" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "lastError" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookingNotification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BookingNotification_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "BookingReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "BookingNotification_reservationId_eventAt_kind_recipientRole_key" ON "BookingNotification"("reservationId", "eventAt", "kind", "recipientRole");
CREATE INDEX "BookingNotification_status_dueAt_idx" ON "BookingNotification"("status", "dueAt");
