import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simple CRM",
  description: "A simple CRM application built with Next.js and PocketBase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
