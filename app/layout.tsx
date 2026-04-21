import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Product-Pal Agent",
  description: "Guided teardown workflow agent MVP",
  metadataBase: new URL("https://thara-product.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Product-Pal Agent",
    description: "Guided teardown workflow agent MVP",
    url: "https://thara-product.vercel.app",
    siteName: "Product-Pal",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Product-Pal Agent",
    description: "Guided teardown workflow agent MVP",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
