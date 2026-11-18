import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in — BloodPod",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const notice =
    error === "link"
      ? "That link couldn't sign you in on this device. If you already confirmed your email, just sign in below."
      : error === "oauth"
        ? "Google sign-in didn't complete. Please try again."
        : undefined;

  return <SignInForm notice={notice} />;
}
