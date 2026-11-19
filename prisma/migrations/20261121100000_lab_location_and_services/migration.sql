-- Labs become listable on the Services page: where they are, how to reach them, and a switch to hide them.
ALTER TABLE "Lab" ADD COLUMN "address" TEXT;
ALTER TABLE "Lab" ADD COLUMN "phone" TEXT;
ALTER TABLE "Lab" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Lab" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "Lab" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Lab" ALTER COLUMN "commissionRate" SET DEFAULT 0;
