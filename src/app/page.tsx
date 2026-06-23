import Hero from "@/components/Hero";
import PartnerMarquee from "@/components/PartnerMarquee";
import ProofStats from "@/components/sections/ProofStats";
import Differentiator from "@/components/sections/Differentiator";
import ValuePillars from "@/components/sections/ValuePillars";
import GlobeSection from "@/components/sections/GlobeSection";
import DestinationsTeaser from "@/components/sections/DestinationsTeaser";
import Testimonials from "@/components/sections/Testimonials";
import StoryTeaser from "@/components/sections/StoryTeaser";

export default function Home() {
  return (
    <>
      <Hero />
      <PartnerMarquee />
      <ProofStats />
      <Differentiator />
      <ValuePillars />
      <GlobeSection />
      <DestinationsTeaser />
      <Testimonials />
      <StoryTeaser />
    </>
  );
}
