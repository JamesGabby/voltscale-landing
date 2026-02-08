import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VoltScale | B2B Lead Generation That Scales",
  description:
    "VoltScale helps B2B companies generate qualified leads and scale revenue predictably. Book a strategy call to learn how we can accelerate your growth.",
  keywords: [
    "B2B lead generation",
    "sales pipeline",
    "demand generation",
    "lead generation agency",
    "B2B marketing",
  ],
  authors: [{ name: "VoltScale" }],
  openGraph: {
    title: "VoltScale | B2B Lead Generation That Scales",
    description:
      "VoltScale helps B2B companies generate qualified leads and scale revenue predictably.",
    type: "website",
    locale: "en_US",
    siteName: "VoltScale",
  },
  twitter: {
    card: "summary_large_image",
    title: "VoltScale | B2B Lead Generation That Scales",
    description:
      "VoltScale helps B2B companies generate qualified leads and scale revenue predictably.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}