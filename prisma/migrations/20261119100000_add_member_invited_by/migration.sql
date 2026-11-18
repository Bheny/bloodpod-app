-- AlterTable
ALTER TABLE "PodMember" ADD COLUMN     "invitedById" TEXT;

-- AddForeignKey
ALTER TABLE "PodMember" ADD CONSTRAINT "PodMember_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
