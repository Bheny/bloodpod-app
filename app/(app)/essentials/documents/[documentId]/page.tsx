import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getUserDocument } from "@/lib/essentials-data";
import { AppHeader } from "@/components/layout/AppHeader";
import { DocumentForm } from "@/components/essentials/DocumentForm";

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const { documentId } = await params;
  const document = await getUserDocument(user.id, documentId);
  if (!document) notFound();

  return (
    <div>
      <AppHeader title="Edit document" backHref="/essentials" />
      <DocumentForm supabaseId={user.supabaseId} initialDocument={document} />
    </div>
  );
}
