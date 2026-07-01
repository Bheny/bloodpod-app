import Link from "next/link";
import { getInvitePreview } from "@/lib/invite";
import { getCurrentUser } from "@/lib/auth/current-user";
import { InviteLanding } from "@/components/invite/InviteLanding";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [preview, user] = await Promise.all([getInvitePreview(token), getCurrentUser()]);

  if (!preview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
        <p className="text-base font-semibold text-ink">
          This invite has expired or is no longer valid.
        </p>
        <Link href="/sign-up" className="text-sm font-semibold text-red">
          Create your own pod
        </Link>
      </div>
    );
  }

  return (
    <InviteLanding
      token={token}
      preview={preview}
      isAuthenticated={Boolean(user)}
      isOwner={user?.id === preview.pod.ownerId}
    />
  );
}
