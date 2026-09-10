import Hero from "@/components/home/Hero";
import Problem from "@/components/home/Problem";
import Pipeline from "@/components/home/Pipeline";
import TurningPoints from "@/components/home/TurningPoints";
import Sectors from "@/components/home/Sectors";
import Layers from "@/components/home/Layers";
import PassportShowcase from "@/components/home/PassportShowcase";
import Comparison from "@/components/home/Comparison";
import Roadmap from "@/components/home/Roadmap";
import CTA from "@/components/home/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Problem />
      <Pipeline />
      <TurningPoints />
      <Sectors />
      <Layers />
      <PassportShowcase />
      <Comparison />
      <Roadmap />
      <CTA />
    </>
  );
}
