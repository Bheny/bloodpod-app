import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { StatsStrip } from "@/components/landing/StatsStrip";
import { SocialProof } from "@/components/landing/SocialProof";
import { Problem } from "@/components/landing/Problem";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PodSection } from "@/components/landing/PodSection";
import { BloodCard } from "@/components/landing/BloodCard";
import { Hospitals } from "@/components/landing/Hospitals";
import { Pricing } from "@/components/landing/Pricing";
import { Testimonials } from "@/components/landing/Testimonials";
import { Faq } from "@/components/landing/Faq";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

// Rebuilt at most every 10 minutes, so the live numbers stay fresh without a database hit per visitor.
export const revalidate = 600;

export default function Home() {
  return (
    <div className="force-light">
      <Nav />
      <main>
        <Hero />
        <StatsStrip />
        <SocialProof />
        <Problem />
        <HowItWorks />
        <PodSection />
        <BloodCard />
        <Hospitals />
        <Pricing />
        <Testimonials />
        <Faq />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
