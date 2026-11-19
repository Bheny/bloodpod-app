import Link from "next/link";
import { Reveal } from "@/components/landing/Reveal";
import { GradientBlob } from "@/components/landing/GradientBlob";
import { Button } from "@/components/ui/Button";

export function CTA() {
  return (
    <section className="relative overflow-hidden px-6 py-20 text-center sm:py-28 lg:py-[120px]">
      <GradientBlob color="red" className="inset-0 -z-10 m-auto size-110 opacity-70" />
      <div className="relative mx-auto max-w-[640px]">
        <Reveal>
          <h2 className="text-[32px] font-extrabold leading-[1.1] tracking-[-1px] text-ink sm:text-[44px] sm:tracking-[-1.5px] lg:text-[52px]">
            Build your Pod
            <br />
            before you need it.
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-6 text-lg leading-[1.7] text-ink-mid">
            Free for donors, always. The people who can help are already in
            your contacts. Put them in one place.
          </p>
        </Reveal>

        <Reveal delay={0.2} className="mt-10 flex flex-col items-center gap-4">
          <Button asChild size="lg">
            <Link href="/start">Build my network →</Link>
          </Button>
          <Link href="/sign-in" className="text-sm font-semibold text-ink-muted hover:text-ink">
            Sign in
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
