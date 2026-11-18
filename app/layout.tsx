import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
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
  themeColor: "#dd0000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-surface text-ink">
        <ServiceWorkerRegister />
        <LazyMotion features={domAnimation}>{children}</LazyMotion>
      </body>
    </html>
  );
}
