import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { Problem } from "@/components/landing/Problem";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PodSection } from "@/components/landing/PodSection";
import { Passport } from "@/components/landing/Passport";
import { Pricing } from "@/components/landing/Pricing";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <SocialProof />
        <Problem />
        <HowItWorks />
        <PodSection />
        <Passport />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
