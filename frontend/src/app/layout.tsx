import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { FloatingActions } from "@/components/floating-actions";
import { PageTransition } from "@/components/page-transition";
import { SiteFooter } from "@/components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RENTeasy | Trusted P2P Rentals",
  description: "Rent big useful things from verified people near you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-slate-50">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <FloatingActions />
            <main className="flex-1 overflow-x-clip">
              <PageTransition>{children}</PageTransition>
            </main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
