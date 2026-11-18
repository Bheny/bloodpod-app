import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { Problem } from "@/components/landing/Problem";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PodSection } from "@/components/landing/PodSection";
import { BloodCard } from "@/components/landing/BloodCard";
import { Hospitals } from "@/components/landing/Hospitals";
import { Testimonials } from "@/components/landing/Testimonials";
import { Faq } from "@/components/landing/Faq";
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
        <BloodCard />
        <Hospitals />
        <Testimonials />
        <Faq />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
