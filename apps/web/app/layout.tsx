import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Ironsight Policy Manager",
  description: "Multi-tenant RAG policy management for hospital systems",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className={`${inter.variable} min-h-full text-slate-900 antialiased`}>{children}</body>
    </html>
  );
}
