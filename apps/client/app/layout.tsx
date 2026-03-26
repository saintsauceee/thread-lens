import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthProvider from "./components/AuthProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Thread Lens",
  description: "Reddit Deep Research Monitor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`antialiased font-[var(--font-inter)]`} style={{ background: '#07080e' }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
