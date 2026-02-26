import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Qawafel Admin",
  description: "Qawafel Travel Platform Admin Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}