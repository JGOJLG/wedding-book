import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const bookFont = Cormorant_Garamond({
  variable: "--font-book",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sansFont = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "For Kirstin",
  description:
    "A collection of letters from the people who know and love Kirstin most.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bookFont.variable} ${sansFont.variable}`}>
        {children}
      </body>
    </html>
  );
}