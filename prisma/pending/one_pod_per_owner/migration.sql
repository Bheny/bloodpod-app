-- One Pod per donor, step M3: allow only one Pod per owner.
--
-- NOT in prisma/migrations on purpose. If it were, `prisma migrate deploy` would run it before anyone had
-- merged their Pods, and it would fail (and block the deploy) for any owner who still has more than one.
--
-- To enforce the rule, after `npm run pods:merge -- --apply --i-have-a-backup` has finished:
--   1. Move this folder to prisma/migrations/<timestamp>_one_pod_per_owner/
--   2. In prisma/schema.prisma, model Pod: add  @@unique([ownerId])
--   3. Run `prisma migrate deploy`
--
-- This statement fails, harmlessly, if any owner still has two Pods.

CREATE UNIQUE INDEX "Pod_ownerId_key" ON "Pod"("ownerId");
