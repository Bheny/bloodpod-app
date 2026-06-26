import type { BloodType } from "@prisma/client";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";

export function formatBloodType(bt: BloodType): string {
  return BLOOD_TYPE_LABELS[bt];
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string): string {
  const then = new Date(date).getTime();
  const diffSeconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (diffSeconds < 60) return "just now";
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export function formatOrdinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

const AVATAR_BG_COLORS = ["#EFF6FF", "#F0FDF4", "#FFFBEB", "#FFF0F0", "#F5F3FF", "#F2F2F2"];
const AVATAR_TEXT_COLORS = ["#1D4ED8", "#166534", "#92400E", "#AA0000", "#6D28D9", "#8E8E93"];

export function getAvatarColor(userId: string): string {
  const index = userId.charCodeAt(0) % AVATAR_BG_COLORS.length;
  return AVATAR_BG_COLORS[index];
}

export function getAvatarTextColor(userId: string): string {
  const index = userId.charCodeAt(0) % AVATAR_TEXT_COLORS.length;
  return AVATAR_TEXT_COLORS[index];
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
