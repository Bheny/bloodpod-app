import type { BookingStatus } from "@prisma/client";

/** Shared by the user's list and the lab inbox so both say the same thing. */
export const BOOKING_STATUS: Record<BookingStatus, { label: string; tone: "amber" | "green" | "gray" | "red" | "blue" }> = {
  REQUESTED: { label: "Waiting for the lab", tone: "amber" },
  RESCHEDULED: { label: "New time suggested", tone: "blue" },
  CONFIRMED: { label: "Confirmed", tone: "green" },
  COMPLETED: { label: "Done", tone: "gray" },
  DECLINED: { label: "Declined", tone: "red" },
  CANCELLED: { label: "Cancelled", tone: "gray" },
};

export const dayText = (d: Date | string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "";
