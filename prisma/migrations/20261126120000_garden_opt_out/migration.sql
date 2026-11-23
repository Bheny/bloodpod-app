-- Garden leaders now show everyone by first name; a donor can opt out. Replaces the earlier opt-in column.
ALTER TABLE "User" DROP COLUMN "gardenShowcase";
ALTER TABLE "User" ADD COLUMN "gardenHidden" BOOLEAN NOT NULL DEFAULT false;
