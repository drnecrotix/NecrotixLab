ALTER TABLE "BookingReservation" ADD COLUMN "rescheduledAt" TIMESTAMP(3);
ALTER TABLE "BookingProject" DROP CONSTRAINT "BookingProject_reservationId_fkey";
ALTER TABLE "BookingProject" ALTER COLUMN "reservationId" DROP NOT NULL;
ALTER TABLE "BookingProject" ADD CONSTRAINT "BookingProject_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "BookingReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
