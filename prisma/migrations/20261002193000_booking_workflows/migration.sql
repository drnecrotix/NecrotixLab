-- AlterTable
ALTER TABLE "BookingReservation" ADD COLUMN     "internalNotes" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "BookingProject" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingReminder" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "hours" INTEGER NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingProject_reservationId_key" ON "BookingProject"("reservationId");

-- CreateIndex
CREATE INDEX "BookingReminder_status_dueAt_idx" ON "BookingReminder"("status", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "BookingReminder_reservationId_startTime_hours_key" ON "BookingReminder"("reservationId", "startTime", "hours");

-- CreateIndex
CREATE INDEX "BookingReservation_email_idx" ON "BookingReservation"("email");

-- AddForeignKey
ALTER TABLE "BookingProject" ADD CONSTRAINT "BookingProject_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "BookingReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingReminder" ADD CONSTRAINT "BookingReminder_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "BookingReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

