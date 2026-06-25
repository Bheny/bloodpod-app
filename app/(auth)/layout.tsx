import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-surface px-4 py-8 sm:py-12">
      <div className="w-full max-w-[440px] rounded-modal border-[0.5px] border-[#E5E5EA] bg-white p-6 sm:p-12">
        <Link href="/" className="flex justify-center">
          <Logo />
        </Link>
        {children}
      </div>
    </div>
  );
}
