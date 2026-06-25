import { Reveal } from "@/components/landing/Reveal";
import { CountUp } from "@/components/landing/CountUp";

const STATS = [
  { value: 550, suffix: "K", label: "blood units needed/yr" },
  { value: 4, suffix: " hrs", label: "average search time" },
  { value: 1, suffix: "%", label: "of Ghanaians donate blood" },
];

export function Problem() {
  return (
    <section className="px-6 py-24 text-center">
      <div className="mx-auto max-w-[720px]">
        <Reveal>
          <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-red">
            Every day in Ghana
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="mt-4 text-[30px] font-extrabold leading-[1.15] tracking-[-1px] text-ink sm:text-[36px] sm:tracking-[-1.5px] lg:text-[48px]">
            Someone dies waiting
            <br />
            for blood that exists.
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mx-auto mt-8 max-w-[560px] text-lg leading-[1.8] text-ink-mid">
            <p>
              Akosua was 28 when her delivery went wrong. The hospital needed
              O+ blood urgently. Her husband made 12 phone calls. It took six
              hours to find a donor. She survived. Most don&apos;t get that
              chance.
            </p>
            <p className="mt-4 font-semibold text-ink">
              BloodPod exists so that call never has to happen.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="mt-16 grid grid-cols-3 gap-3 sm:flex sm:items-center sm:justify-center sm:gap-12">
            {STATS.map((stat, i) => (
              <div key={stat.label} className="flex items-center justify-center gap-6 sm:gap-12">
                {i > 0 && <div className="hidden h-12 w-px bg-[#E5E5EA] sm:block" />}
                <div>
                  <p className="text-[28px] font-extrabold tracking-[-1px] text-red sm:text-[40px] lg:text-[48px]">
                    <CountUp to={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-1 text-[11px] leading-tight text-ink-muted sm:text-[13px]">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
