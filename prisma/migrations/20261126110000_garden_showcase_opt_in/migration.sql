-- A donor can allow BloodPod to feature their name and Garden stage. Off by default.
ALTER TABLE "User" ADD COLUMN "gardenShowcase" BOOLEAN NOT NULL DEFAULT false;
