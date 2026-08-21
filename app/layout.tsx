import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Atuto — generowanie dokumentacji firmowej",
  description:
    "Projekt własny: aplikacja generująca obowiązkową dokumentację firmową z formularza — od danych przez PDF po wysyłkę mailem. Pierwszy wdrożony typ dokumentu: skierowanie na badania lekarskie wg załącznika 3a (Dz.U. 2023 poz. 607). Demo otwarte, dane fikcyjne.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
