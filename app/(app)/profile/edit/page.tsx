import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AppHeader } from "@/components/layout/AppHeader";
import { EditProfileForm } from "@/components/profile/EditProfileForm";

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  return (
    <div>
      <AppHeader title="Edit profile" backHref="/profile" />
      <EditProfileForm
        defaultValues={{
          name: user.name ?? "",
          phone: user.phone ?? "",
          city: user.city ?? "",
          bloodType: user.bloodType ?? "",
        }}
      />
    </div>
  );
}
