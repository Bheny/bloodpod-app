import { Reveal } from "@/components/landing/Reveal";
import { PassportCard } from "@/components/landing/PassportCard";
import { GradientBlob } from "@/components/landing/GradientBlob";
import { TiltCard } from "@/components/landing/TiltCard";

export function Passport() {
  return (
    <section className="relative overflow-hidden bg-ink px-6 py-24 lg:px-12">
      <GradientBlob color="red" className="-left-32 inset-y-0 my-auto size-105" />

      <div className="relative mx-auto grid max-w-[1100px] items-center gap-16 lg:grid-cols-2">
        <Reveal className="flex justify-center lg:order-1 lg:justify-start">
          <TiltCard>
            <PassportCard variant="embedded" />
          </TiltCard>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-red">
            Your blood identity
          </p>
          <h2 className="mt-4 text-[32px] font-extrabold leading-[1.15] tracking-[-1px] text-white lg:text-[36px]">
            A passport that proves you show up.
          </h2>

          <p className="mt-6 text-base leading-[1.7] text-white/60">
            Every donation you log builds your verified history. Hospitals
            can scan your QR code to confirm your record before accepting a
            donation. Your pod members can see your eligibility status in
            real time.
          </p>
          <p className="mt-4 text-base leading-[1.7] text-white/60">
            The more you give, the more your passport grows. It&apos;s not
            just a health record — it&apos;s a reputation.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
