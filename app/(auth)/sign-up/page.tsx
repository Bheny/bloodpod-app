import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Create your account — BloodPod",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
