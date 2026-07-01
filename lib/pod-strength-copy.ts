import { Droplet, UserCheck, Users, BellRing, HeartPulse, type LucideIcon } from "lucide-react";

export interface PodStrengthCelebrationCopy {
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

export const POD_STRENGTH_CELEBRATIONS: Record<string, PodStrengthCelebrationCopy> = {
  "blood-type": {
    title: "Blood type locked in.",
    subtitle: "One less unknown if your pod ever needs you.",
    icon: Droplet,
  },
  profile: {
    title: "Profile complete.",
    subtitle: "Your pod can see exactly who they're calling.",
    icon: UserCheck,
  },
  invite: {
    title: "Your pod isn't empty anymore.",
    subtitle: "Someone just joined your circle.",
    icon: Users,
  },
  availability: {
    title: "You're on the list.",
    subtitle: "You'll be first to know when your type is needed.",
    icon: BellRing,
  },
  donation: {
    title: "First donation logged.",
    subtitle: "That's a real save on your passport now.",
    icon: HeartPulse,
  },
};
