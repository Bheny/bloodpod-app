import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { LazyMotion, domAnimation } from "framer-motion";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-surface text-ink">
        <LazyMotion features={domAnimation}>{children}</LazyMotion>
      </body>
    </html>
  );
}
