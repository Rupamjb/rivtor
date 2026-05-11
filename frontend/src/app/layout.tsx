import type { Metadata } from "next";

import AppProviders from "@/App";

import "./globals.css";


export const metadata: Metadata = {
  title: "Rivtor",
  description: "Rivtor landing and FounderOS workspace",
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-rv text-rv-text antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
