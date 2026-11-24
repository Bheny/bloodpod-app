# One Pod per donor, with categories — plan

Status: proposed, nothing built. Written to be reviewed and edited before work starts.

## Goal

Every donor has **one Pod** to grow. Each person in it carries a **category** (Family, Friends, School, Church, Work, Neighbours, Other). A Pod starts with **20 slots** and can grow. The aim is for every donor to have **at least 10 ready people** who are aware and available.

What this replaces: up to 3 owned Pods on Free and 10 on a paid plan (`FREE_OWNED_POD_LIMIT`, `PAID_OWNED_POD_LIMIT` in `lib/pod-limits.ts`), and the Garden's idea of one "plot" per Pod.

## What stays the same

- Joining other people's Pods is unlimited. A person can still be a member of several donors' Pods.
- Care Pods and Case Pods are separate and untouched.
- Alerts, drills, readiness and the "ready" definition (finished profile, eligible to give) work as they do now, on the donor's one Pod.
- Spin-offs: a member who has invited 5 people who finished their profile can still start their own Pod (`READINESS.spinoffMinInvitees`). Lineage (`parentPodId`) stays.
- No payment decides who is alerted or in what order.

## Decisions needed before building

| # | Question | Proposed answer |
|---|---|---|
| 1 | How do slots grow past 20? | Add slots when the Pod proves itself: at 10 ready people and a passed drill in the last 90 days, +10 slots, repeating each time the Pod fills and passes again. Never sold. |
| 2 | Categories: fixed list or free text? | Fixed list, so counts stay clean. Family, Friends, School, Church, Work, Neighbours, Other. |
| 3 | Can a donor change a person's category later? | Yes, the owner can, any time. |
| 4 | What does "Complete" mean now? | 10 ready people in the one Pod (`READINESS.podComplete`). |
| 5 | Does the plan page still mention Pod counts? | No. Free, Basic and Plus wording drops "up to N Pods". Slots are not a plan feature. |

## Data model

Additive first, so nothing breaks while the merge runs.

```prisma
model Pod {
  // existing fields stay
  slotLimit Int @default(20)          // 20 to start; raised by the growth rule
  // After the merge: @@unique([ownerId])  — one Pod per owner
}

model PodMember {
  // existing fields stay
  category PodCategory @default(OTHER)
}

model PodInvite {
  // existing fields stay
  category PodCategory @default(OTHER) // the category the person gets on joining
}

enum PodCategory { FAMILY FRIENDS SCHOOL CHURCH WORK NEIGHBOURS OTHER }
```

The owner is not a `PodMember` row (they are added explicitly in `podPeople`), so the owner has no category.

## Migration, in order

Each step is its own migration so it can be checked before the next. With about 18 users this is quick, but run it on a copy of the database first.

**M1 — add columns (safe, no data change)**
1. Add `PodCategory` enum.
2. Add `Pod.slotLimit` (default 20), `PodMember.category` (default OTHER), `PodInvite.category` (default OTHER).

**M2 — merge each owner's Pods into one (data migration, a SQL script)**
For every owner with more than one Pod:
1. **Pick the survivor:** the Pod with the most members; ties go to the oldest. Keep its `id`, `slug`, share link and code, so existing invite links keep working.
2. **Move members:** re-point each `PodMember` of the other Pods to the survivor.
   - If the person is already in the survivor, keep the survivor row and drop the duplicate (the `@@unique([podId, userId])` would otherwise fail).
   - Set the category from the source Pod's name when it clearly matches (a name containing "family", "church", "school", "work", and so on). Otherwise OTHER.
   - Keep `joinedAt` and `invitedById`.
3. **Move the rest:** re-point `Drill`, `PodInvite` (and any `Nudge` or other rows that carry a `podId`) to the survivor. Re-point `parentPodId` on child Pods that pointed at a merged Pod.
4. **Capture the old names:** write the dropped Pod names into a one-off table or a log so nothing is lost and the owner can be told.
5. **Delete the emptied Pods.**
6. **Fix `slotLimit`:** if the merged Pod has more than 20 people, set `slotLimit` to the member count rounded up to the next 10, so nobody is over their limit on day one.
7. **Report:** print per owner how many Pods merged, members moved, duplicates dropped, and members left as OTHER, so you can review it.

**M3 — enforce one Pod per owner**
1. Add `@@unique([ownerId])` on `Pod`. This only succeeds once M2 has left every owner with at most one Pod.
2. Owners with no Pod are unaffected.

**Rollback:** M1 is additive, so it is safe to leave. Before M2, take a database backup (or copy `Pod`, `PodMember`, `PodInvite`, `Drill` into `_backup_*` tables). M2 is not reversible without it. M3 can be dropped with one statement.

## Code changes

Grouped by area. File names are from a search of the current code; each needs checking when we get there.

**Limits and plans**
- `lib/pod-limits.ts`: replace the owned-Pod limits with the slot rule; keep `isPodFull`, but base it on `Pod.slotLimit`. Add the growth rule as a pure function that can be tested.
- `lib/plan-catalog.ts`, `lib/glossary.ts`, `app/(app)/upgrade/page.tsx`: remove "up to N Pods" wording.

**Creating and joining**
- `app/api/pods/new/route.ts`, `app/api/pods/route.ts`, `components/pod/CreatePodCard.tsx`: creating a second Pod is no longer allowed. Show "your Pod" instead of "create another".
- `app/api/invite/[token]/accept/route.ts`, `lib/invite.ts`, `lib/pod-invite.ts`, `lib/pod-invitations.ts`, `app/invite/[token]/page.tsx`: carry the category through an invite; set it on the new `PodMember`.
- `app/api/pod/invite/route.ts`, `app/api/pods/[podId]/invite/route.ts`, `components/invite/InviteOptions.tsx`: choose a category when inviting.
- `app/api/pods/[podId]/members/[userId]/route.ts`: owner can change a member's category.
- Onboarding (`app/(onboarding)/onboarding/page.tsx`, `components/onboarding/steps/*`, `app/api/auth/complete-signup/route.ts`): the Pod step creates the single Pod; the invite step can pick a category.

**Screens**
- `app/(app)/pod/[podId]/page.tsx`, `app/(app)/pod/page.tsx`, `lib/pod-data.ts`: one Pod, a members list with category filter and a count by category.
- `app/(app)/pod/settings/page.tsx`, `app/(app)/pod/[podId]/settings/page.tsx`, `components/pod/PodSettings.tsx`: merge into one settings page.
- Dashboard (`lib/dashboard-data.ts`, `components/dashboard/home/HomeHero.tsx`): one Pod card for an owner. The "Next:" row now runs 3 → 5 → 10.

**Readiness and Garden**
- `lib/readiness/people.ts`, `lib/readiness/drill.ts`, `lib/readiness/view.ts`, `lib/readiness/spinoff.ts`, `app/api/readiness/*`: a donor has one Pod, so "which Pod" goes away in the UI; the code can still take a `podId`.
- `lib/garden-data.ts`, `lib/garden.ts`, `app/(app)/garden/page.tsx`: a Garden has one plot. The "counted once across plots" rule is no longer needed for the donor's own people (it still matters for the same person added twice by phone). Decide whether the Garden page stays or folds into the Pod page (see risks).
- `lib/admin/pod-strength.ts`, `components/admin/PodStrengthPanel.tsx`, `lib/admin/garden-leaderboard.ts`, `lib/admin/metrics.ts`, `lib/admin/graph.ts`: simplify to one Pod per donor; the leaderboard ranks one Pod.

**Other places that read owned Pods**
- `lib/alerts.ts`, `lib/care.ts`, `lib/care-rules.ts`, `app/(app)/care/new/page.tsx`, `app/api/care/route.ts`, `lib/pod-access.ts`, `lib/pod-dependable.ts`, `lib/pod-strength.ts`, `lib/nudges.ts`, `lib/reports.ts`, `lib/email/notify.ts`, `lib/get-started-data.ts`, `lib/passport-data.ts`, `app/(app)/activity/page.tsx`, `app/api/pod/share-invite/regenerate/route.ts`, `app/api/admin/users/export/route.ts`: read each for assumptions about several Pods.

## Order of work

1. **Prepare.** Commit the uncommitted nudges and reports work first (it touches Pods and has a `tsc` error in `lib/nudge-rules.ts`). Take a database backup.
2. **Phase 1: data and rules.** M1 migration; `PodCategory`; the slot rule and tests; invite and join carry a category. The app still works with several Pods at this point.
3. **Phase 2: screens.** Category on the Pod page, member list filters, invite picks a category, owner can recategorise.
4. **Phase 3: merge.** Run M2 on a copy, review the report, then on production. Add M3.
5. **Phase 4: simplify.** Remove "create another Pod", the Pod switcher and the plan wording. Collapse the Garden, readiness and admin views to one Pod. Update the tutorial video notes.
6. **Phase 5: tell people.** A short in-app note to owners whose Pods were merged, listing the old names and where their people went.

Phases 1 and 2 can ship without Phase 3. Phase 3 should be a day by itself, so problems are easy to see.

## Risks

- **Merged Pods are surprising to owners.** Mitigation: keep the survivor's link and code, send the in-app note, and keep the old names in the log.
- **A member in two of an owner's Pods** is counted once. Their category comes from the survivor Pod's row.
- **Old invite links** to a merged Pod stop working. Mitigation: also keep the removed Pods' `slug`, code and token in a small redirect table that points to the survivor.
- **The Garden's meaning shrinks.** With one plot, stage and plot health measure almost the same thing. Decide whether to keep both or fold plot health into the stage. Stages today: Sprout 3, Grove 8, Forest 30; with slots starting at 20, Forest at 30 needs the growth rule first.
- **Hard-rule tests** (`__tests__/garden.test.ts`, `__tests__/readiness-hard-rules.test.ts`, `__tests__/get-started.test.ts`) check file lists and wording. Expect to update them as files move.
- **Terms and Privacy** do not yet describe categories. A category (for example "Church") can hint at a person's religion, so treat it as personal data: show it only to the Pod owner and the person, never in admin counts or on a poster, and say so in the Privacy page.

## Tests to add

- Merge script on a seeded database: member counts, duplicates dropped, drills and invites re-pointed, one Pod per owner afterwards.
- Slot rule: 20 to start, no growth below 10 ready, growth at 10 ready plus a passed drill, never sold.
- Joining: category stored; full Pod refuses; owner can change a category.
- Hard rules: category never appears in admin aggregates, leaderboard data or alerts.

## Not in this plan

Phone verification, the Privacy and Terms rewrite, and new Care Pod work.
