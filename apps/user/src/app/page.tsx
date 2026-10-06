/**
 * FILE PURPOSE:
 * Roohae public marketing landing page and interactive brand showcase.
 *
 * MAIN RESPONSIBILITY:
 * Composes the interactive 3D hero book opening page, video/sound experience reel,
 * editorial section showcase, floating navigation bar, and footer.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/landing/FloatingNav.tsx
 * - apps/user/src/components/landing/hero/OpeningPage.tsx
 * - apps/user/src/components/landing/Experience/Experience.tsx
 * - apps/user/src/components/landing/Editorial/EditorialSection.tsx
 * - apps/user/src/components/landing/EditorialFooter.tsx
 */

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
