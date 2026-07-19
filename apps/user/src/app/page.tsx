import { OpeningPage } from "@/components/landing/hero/OpeningPage";
import { Experience } from "@/components/landing/Experience/Experience";
import { FloatingNav } from "@/components/landing/FloatingNav";
import { EditorialSection } from "@/components/landing/Editorial/EditorialSection";
import { EditorialFooter } from "@/components/landing/EditorialFooter";

export default function LandingPage() {
  return (
    <main className="w-full flex flex-col min-h-screen bg-background">
      {/* Fixed floating login — z-100, always above the transition canvas */}
      <FloatingNav />


      <OpeningPage />
      <Experience />
      <EditorialSection />
      <EditorialFooter />
    </main>
  );
}
