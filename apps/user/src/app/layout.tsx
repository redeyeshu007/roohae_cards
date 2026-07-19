import type { Metadata, Viewport } from 'next';
import {
  Plus_Jakarta_Sans,
  Great_Vibes,
  Caveat_Brush,
  Dancing_Script,
  Cedarville_Cursive,
  Permanent_Marker,
  Pinyon_Script,
  Shadows_Into_Light,
} from "next/font/google";
import { AppProviders } from '@roohae/ui';
import { MotionConfig } from "framer-motion";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import './globals.css';

const displaySans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-primary",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-secondary",
  display: "swap",
});

const handCalligraphy = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--hand-calligraphy",
  display: "swap",
});

const handBrush = Caveat_Brush({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--hand-brush",
  display: "swap",
});

const handScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--hand-script",
  display: "swap",
});

const handFountain = Cedarville_Cursive({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--hand-fountain",
  display: "swap",
});

const handMarker = Permanent_Marker({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--hand-marker",
  display: "swap",
});

const handFinale = Pinyon_Script({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--hand-finale",
  display: "swap",
});

const handMinimal = Shadows_Into_Light({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--hand-minimal",
  display: "swap",
});

const hands = [
  handCalligraphy,
  handBrush,
  handScript,
  handFountain,
  handMarker,
  handFinale,
  handMinimal,
].map((f) => f.variable).join(" ");

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: { default: 'Roohae Cards', template: '%s · Roohae Cards' },
  description: 'Customize beautiful templates and download print-ready designs.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${displaySans.variable} ${plusJakartaSans.variable} ${hands}`}>
      <body className="font-sans min-h-screen bg-background text-foreground antialiased flex flex-col">
        <AppProviders>
          <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <MotionConfig reducedMotion="user">
              {children}
            </MotionConfig>
          </NextThemesProvider>
        </AppProviders>
      </body>
    </html>
  );
}
