-- One Pod per donor, step M3: allow only one Pod per owner.
-- Run only after the merge (npm run pods:merge) has left every owner with at most one Pod.
-- This fails, harmlessly, if any owner still has two.

CREATE UNIQUE INDEX "Pod_ownerId_key" ON "Pod"("ownerId");
