import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/champ/Header";
import { Footer } from "@/components/champ/Footer";
import { AuthModal } from "@/components/champ/AuthModal";
import { CursorBall } from "@/components/champ/CursorBall";
import { StickyBar } from "@/components/champ/StickyBar";
import { WaveDivider } from "@/components/champ/primitives";
import { Hero } from "@/components/sections/Hero";
import { TableSection } from "@/components/sections/TableSection";
import { ModelSection } from "@/components/sections/ModelSection";
import { CallIt } from "@/components/sections/CallIt";
import { BackYourself } from "@/components/sections/BackYourself";
import { EarnSpend } from "@/components/sections/EarnSpend";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { RunsProvider } from "@/lib/runs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CPL 2026 AI Power Rankings | Champhunt × Willow TV" },
      {
        name: "description",
        content:
          "Who is playing the best cricket in the Caribbean right now — nine measurements, weights we published, updated Mondays. Play a prediction free.",
      },
      { property: "og:title", content: "CPL 2026 AI Power Rankings | Champhunt × Willow TV" },
      {
        property: "og:description",
        content:
          "The table that asks who is playing well, not who has points. Nine measurements, published weights, free predictions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [cursorOn, setCursorOn] = useState(true);

  return (
    <RunsProvider>
      <CursorBall enabled={cursorOn} />
      <Header />
      <main className="pt-[56px] md:pt-[66px]">
        <Hero />
        <WaveDivider from="var(--color-indigo)" to="var(--color-cream)" />
        <TableSection />
        <WaveDivider from="var(--color-cream)" to="var(--color-cream-2)" />
        <ModelSection />
        <WaveDivider from="var(--color-cream-3)" to="var(--color-cream)" />
        <CallIt />
        <WaveDivider from="var(--color-cream)" to="var(--color-cream-3)" />
        <BackYourself />
        <WaveDivider from="var(--color-cream-3)" to="var(--color-cream-2)" />
        <EarnSpend />
        <WaveDivider from="var(--color-cream-2)" to="var(--color-cream)" />
        <HowItWorks />
        <WaveDivider from="var(--color-cream)" to="var(--color-magenta)" />
        <FinalCTA />
      </main>
      <Footer cursorOn={cursorOn} onToggleCursor={() => setCursorOn((c) => !c)} />
      <StickyBar />
      <AuthModal />
      <Toaster position="top-center" />
    </RunsProvider>
  );
}
