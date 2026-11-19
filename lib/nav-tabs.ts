import { Home, Users, Search, FlaskConical, User, type LucideIcon } from "lucide-react";

export interface NavTab {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_TABS: NavTab[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/pod", label: "My Pod", icon: Users },
  { href: "/discover", label: "Discover", icon: Search },
  { href: "/services", label: "Services", icon: FlaskConical },
  { href: "/profile", label: "Profile", icon: User },
];
