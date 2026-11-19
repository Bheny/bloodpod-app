-- Lab portal: staff accounts and a fuller booking record.
ALTER TYPE "BookingStatus" ADD VALUE 'RESCHEDULED';
ALTER TYPE "BookingStatus" ADD VALUE 'DECLINED';
ALTER TYPE "BookingStatus" ADD VALUE 'COMPLETED';

ALTER TABLE "User" ADD COLUMN "labId" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Booking" ADD COLUMN "testIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Booking" ADD COLUMN "preferredDate" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "note" TEXT;
ALTER TABLE "Booking" ADD COLUMN "scheduledFor" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "labNote" TEXT;
ALTER TABLE "Booking" ADD COLUMN "respondedAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "consentAt" TIMESTAMP(3);

CREATE INDEX "Booking_labId_status_idx" ON "Booking"("labId", "status");
