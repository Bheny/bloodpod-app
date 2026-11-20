/** Plain data the Captain rules run on. Nothing here knows about the database or Prisma. */

export interface TreeMember {
  userId: string;
  phone: string | null;
  phoneVerified: boolean;
  eligible: boolean;
  joinedAt: Date;
}

export interface TreeDrill {
  startedAt: Date;
  /** Eligible members when the drill started. Fixed then, so later churn cannot change the result. */
  eligibleCount: number;
  /** How many of them answered inside the window. */
  respondedInWindow: number;
}

export interface TreePod {
  id: string;
  leaderId: string;
  leaderPhone: string | null;
  leaderPhoneVerified: boolean;
  createdAt: Date;
  /** Latest drill or real-alert response from anyone in the Pod. */
  lastResponseAt: Date | null;
  /** Includes the leader. */
  members: TreeMember[];
  drills: TreeDrill[];
  children: TreePod[];
}

export interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  /** Short progress, like "2 of 3". */
  detail?: string;
  /** Where the next action lives. */
  action?: "invite" | "drill" | "spinoff" | "wait";
}

export interface ChildState {
  podId: string;
  qualifying: boolean;
  /** Plain-language reason it is not working yet, when it isn't. */
  reason: "ok" | "needs_members" | "needs_activity" | "same_person";
  level: number | null;
}

export interface CaptainResult {
  /** null = Pod Starter. */
  level: number | null;
  title: string;
  drillPassed: boolean;
  qualifyingChildren: number;
  children: ChildState[];
  /** What the next step still needs. Empty at the top level. */
  checklist: ChecklistItem[];
  nextLevel: number | null;
  nextTitle: string | null;
}

export type IntegrityCode = "same_phone" | "phone_pattern" | "created_fast" | "burst_joins";

export interface IntegrityFlag {
  code: IntegrityCode;
  podId: string;
  detail: string;
}
