import { redirect } from "next/navigation";

// Joined Pods now open on the same detail page as owned ones.
export default async function JoinedPodRedirect({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  redirect(`/pod/${podId}`);
}
