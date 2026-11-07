import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tuma Dashboard",
  description: "Banking dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-ivory text-forest">{children}</body>
    </html>
  );
}
