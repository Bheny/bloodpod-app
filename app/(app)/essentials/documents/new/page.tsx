import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AppHeader } from "@/components/layout/AppHeader";
import { DocumentForm } from "@/components/essentials/DocumentForm";

export default async function NewDocumentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  return (
    <div>
      <AppHeader title="Add a document" backHref="/essentials" />
      <DocumentForm supabaseId={user.supabaseId} />
    </div>
  );
}
