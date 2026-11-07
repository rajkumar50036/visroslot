import type { Metadata, Viewport } from "next";
import { Inter, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { GlobalDeploySignoutGuard } from "@/components/auth/GlobalDeploySignoutGuard";
import { VisroSlotTracker } from "@/components/analytics/VisroSlotTracker";
import { InAppBrowserBreakout } from "@/components/browser/InAppBrowserBreakout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "VisroSlot — Appointments Made Simple for Your Business",
  description:
    "Let your customers book online while you manage appointments, staff and customer details in one place.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/visroslot-logo.png", sizes: "1024x1024", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`light scroll-smooth ${inter.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Speed Boost: Preconnect critical infrastructure */}
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="preload" href="/sounds/booking-chime.wav" as="audio" />
        <link rel="preload" href="/assets/visroslot-logo.png" as="image" type="image/png" />

        {/* Synchronous Default Light Theme Enforcer */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('visroslot_theme');if(!t||t==='light'){document.documentElement.classList.add('light');document.documentElement.classList.remove('dark');}else if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');}}catch(e){document.documentElement.classList.add('light');}})();`,
          }}
        />

      </head>
      <body className="antialiased min-h-screen bg-white text-charcoal dark:bg-navy-950 dark:text-white font-sans transition-colors duration-200 selection:bg-gold selection:text-navy-950">
        <ThemeProvider>
          <InAppBrowserBreakout />
          <GlobalDeploySignoutGuard />
          <VisroSlotTracker />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
