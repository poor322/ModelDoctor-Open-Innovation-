import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ModelDoctor — The MRI for your ML Pipeline",
  description:
    "AI-powered diagnostic system that catches silent failures in ML code before they reach production. By Team ASTROID.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
