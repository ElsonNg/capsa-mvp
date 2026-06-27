import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Capsa",
  description: "Document health monitoring for company knowledge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#f7f9fb] text-[#191c1e]">{children}</body>
    </html>
  );
}
