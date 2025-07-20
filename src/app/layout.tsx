import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "OakDex - Build Better Pokémon TCG Pocket Decks",
  description: "Get expert deck building advice for Pokémon TCG Pocket. Professor Oak helps you create winning strategies, counter meta decks, and improve your gameplay with AI-powered insights.",
  keywords: "Pokemon TCG Pocket, deck builder, meta decks, strategy guide, deck analysis, Pokemon cards, mobile TCG",
  authors: [{ name: "OakDex" }],
  openGraph: {
    title: "OakDex - Build Better Pokémon TCG Pocket Decks",
    description: "Expert deck building advice for Pokémon TCG Pocket. Build winning decks, counter the meta, and master strategy with Professor Oak's AI guidance.",
    type: "website",
    url: "https://oakdex.xyz",
  },
  twitter: {
    card: "summary",
    title: "OakDex - Build Better Pokémon TCG Pocket Decks", 
    description: "Expert deck building advice for Pokémon TCG Pocket. Build winning decks and master strategy with Professor Oak's guidance.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
