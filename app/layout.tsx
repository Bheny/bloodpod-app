import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { Tracker } from "@/components/analytics/Tracker";
import { Inter } from "next/font/google";
import { LazyMotion, domAnimation } from "framer-motion";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "BloodPod — The people who will save your life",
  description:
    "BloodPod is a personal blood network. Build your pod, invite the people you trust, and when an emergency strikes, your circle is already there.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#dd0000" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e10" },
  ],
};

// Runs before the first paint, so a saved Light or Dark choice never flashes the wrong theme.
// With no saved choice (or "system") it does nothing and the device setting applies.
const THEME_SCRIPT = `try{var t=localStorage.getItem("bp_theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-ink">
        <ServiceWorkerRegister />
        <Tracker />
        <LazyMotion features={domAnimation}>{children}</LazyMotion>
      </body>
    </html>
  );
}
