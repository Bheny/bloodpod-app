import { redirect } from "next/navigation";
import { Check, Clock, Mail, Phone } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { HospitalHeader } from "@/components/hospital/HospitalHeader";
import { cn } from "@/lib/utils";

const KIND_LABELS = { HOSPITAL: "Hospital", BLOOD_BANK: "Blood bank", CLINIC: "Clinic" } as const;

export default async function HospitalHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.hospitalId) redirect("/dashboard");

  const hospital = await prisma.hospital.findUnique({ where: { id: user.hospitalId } });
  if (!hospital) redirect("/dashboard");

  const approved = hospital.status === "APPROVED";
  const rejected = hospital.status === "REJECTED";

  const steps = [
    { label: "Application received", done: true },
    { label: "We call you to verify your facility", done: approved || rejected },
    { label: "Practice drill with your blood bank", done: false },
  ];

  return (
    <>
      <HospitalHeader userName={user.name} />

      <main className="mx-auto max-w-[1100px] px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-modal border-[0.5px] border-[#E5E5EA] bg-white p-8">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold",
                approved ? "bg-[#F0FBF3] text-[#1FA855]" : rejected ? "bg-surface text-ink-mid" : "bg-red-light text-red",
              )}
            >
              {approved ? <Check className="size-3.5" /> : <Clock className="size-3.5" />}
              {approved ? "Approved" : rejected ? "Not approved" : "Application under review"}
            </span>

            <h1 className="mt-4 text-[28px] font-extrabold leading-[1.15] tracking-[-0.8px] text-ink">
              {approved
                ? `${hospital.name} is approved.`
                : rejected
                  ? "We could not approve this application."
                  : `Thanks, ${user.name?.split(" ")[0] ?? "there"}. We have your application.`}
            </h1>

            <p className="mt-3 max-w-[560px] text-base leading-[1.7] text-ink-mid">
              {approved
                ? "Your facility is verified. The dashboard for donor counts and alerts is being built with our pilot partner, and we will contact you as soon as your practice drill is ready."
                : rejected
                  ? "That usually means we could not verify the facility yet. Reply to our email or call us and we will sort it out together."
                  : "We review every application by hand, because this tool can alert real people. We will contact you using the details below. Nothing reaches donors until you are approved."}
            </p>

            <ol className="mt-8 space-y-4">
              {steps.map((s, i) => (
                <li key={s.label} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                      s.done ? "bg-red text-white" : "bg-surface text-ink-muted",
                    )}
                  >
                    {s.done ? <Check className="size-4" /> : i + 1}
                  </span>
                  <span className={cn("text-sm font-semibold", s.done ? "text-ink" : "text-ink-muted")}>{s.label}</span>
                </li>
              ))}
            </ol>
          </section>

          <aside className="space-y-4">
            <div className="rounded-modal border-[0.5px] border-[#E5E5EA] bg-white p-6">
              <p className="text-[11px] font-bold uppercase tracking-[2px] text-ink-muted">Your application</p>
              <p className="mt-3 text-base font-extrabold text-ink">{hospital.name}</p>
              <p className="text-sm text-ink-muted">
                {KIND_LABELS[hospital.kind]} · {hospital.city}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{hospital.address}</p>
              <div className="mt-4 space-y-2 border-t-[0.5px] border-hairline pt-4 text-sm text-ink-mid">
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-ink-muted" /> {hospital.phone}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="size-4 text-ink-muted" /> {user.email}
                </p>
              </div>
            </div>

            <div className="rounded-modal bg-ink p-6 text-white">
              <p className="text-sm font-bold">Want to get ready?</p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Think about who in your blood bank would send the alert, and which blood types are hardest for you to
                find. We will ask about both on the call.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
