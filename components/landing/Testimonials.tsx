import { Reveal } from "@/components/landing/Reveal";
import { cardHover, cn } from "@/lib/utils";

const QUOTES = [
  {
    quote:
      "I built my pod in 10 minutes. When my mother needed surgery, I didn't make a single phone call. My pod handled everything.",
    name: "Kwame A.",
    location: "Accra",
  },
  {
    quote:
      "As a sickle cell patient, I always needed a plan. BloodPod gave me one. I know exactly who to call — and they're already in my network.",
    name: "Ama S.",
    location: "Kumasi",
  },
  {
    quote:
      "We partnered with BloodPod for our hospital and donor response time dropped from 4 hours to under 30 minutes. This is what we needed.",
    name: "Dr. Mensah",
    location: "Korle Bu Hospital",
  },
];

export function Testimonials() {
  return (
    <section className="bg-surface px-6 py-20">
      <div className="mx-auto grid max-w-[1100px] gap-6 sm:grid-cols-3">
        {QUOTES.map((q, i) => (
          <Reveal key={q.name} delay={i * 0.1}>
            <div
              className={cn(
                "h-full rounded-card border-[0.5px] border-[#E5E5EA] bg-white p-8",
                cardHover,
              )}
            >
              <span className="font-serif text-5xl leading-none text-red/50">&ldquo;</span>
              <p className="mt-2 text-[15px] leading-[1.7] text-ink-mid">{q.quote}</p>
              <p className="mt-6 text-sm font-bold text-ink">— {q.name}, {q.location}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
