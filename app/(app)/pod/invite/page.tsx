import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPrimaryPodId } from "@/lib/pod-data";

// Shortcut used across the app: "invite people" for the person's own (first) Pod.
export default async function PodInviteShortcut() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const podId = await getPrimaryPodId(user.id);
  redirect(podId ? `/pod/${podId}/invite` : "/pod");
}
