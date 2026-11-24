-- One Pod per donor, step M1: add the columns only. No data changes, nothing breaks.
-- A person's category (how the owner knows them), the category an invite will give, and a Pod's slot limit.

CREATE TYPE "PodCategory" AS ENUM ('FAMILY', 'FRIENDS', 'SCHOOL', 'CHURCH', 'WORK', 'NEIGHBOURS', 'OTHER');

ALTER TABLE "Pod" ADD COLUMN "slotLimit" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "PodMember" ADD COLUMN "category" "PodCategory" NOT NULL DEFAULT 'OTHER';
ALTER TABLE "PodInvite" ADD COLUMN "category" "PodCategory" NOT NULL DEFAULT 'OTHER';
