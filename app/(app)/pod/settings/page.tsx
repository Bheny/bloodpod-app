import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPrimaryPodId } from "@/lib/pod-data";

export default async function PodSettingsShortcut() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const podId = await getPrimaryPodId(user.id);
  redirect(podId ? `/pod/${podId}/settings` : "/pod");
}
