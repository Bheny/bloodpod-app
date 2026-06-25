import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="text-center">
      <h1 className="mt-6 text-2xl font-bold text-ink">Reset your password</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Password reset is coming soon. Contact hello@bloodpod.gh for help in the meantime.
      </p>
      <Link href="/sign-in" className="mt-8 inline-block text-sm font-semibold text-red">
        ← Back to sign in
      </Link>
    </div>
  );
}
