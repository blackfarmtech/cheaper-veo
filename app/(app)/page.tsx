import { Hero } from "@/components/landing/Hero";
import { PriceComparison } from "@/components/landing/PriceComparison";
import { Stats } from "@/components/landing/Stats";
import { Models } from "@/components/landing/Models";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Faq } from "@/components/landing/Faq";
import { CtaFinal } from "@/components/landing/CtaFinal";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <>
      <main>
        <Hero />
        <PriceComparison />
        <Stats />
        <Models />
        <Features />
        <Pricing />
        <HowItWorks />
        <Faq />
        <CtaFinal />
      </main>
      <Footer />
    </>
  );
}
